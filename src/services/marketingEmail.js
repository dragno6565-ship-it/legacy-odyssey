/**
 * Marketing / announcement email helpers (customer list sends).
 *
 * Every NON-transactional email to customers (announcements, newsletters, blog
 * posts, the onboarding drip) must:
 *   1. skip anyone who has unsubscribed (families.unsubscribed_at is set on ANY
 *      of the sites that share their email address), and
 *   2. carry a working one-click unsubscribe: a signed link in the footer plus
 *      List-Unsubscribe + List-Unsubscribe-Post headers (RFC 8058), so Gmail and
 *      Apple Mail show their native "Unsubscribe" button.
 *
 * Transactional emails (receipts, password resets, site-live, cancellation,
 * gift delivery, contact updates the customer asked us to send) are NOT routed
 * through here and are unaffected by unsubscribed_at.
 *
 * Tokens are HMAC-signed with SESSION_SECRET (services/unsubscribeTokens.js),
 * so a script that builds links MUST run with the PRODUCTION SESSION_SECRET.
 * Scripts call assertUnsubscribeSecretMatchesProduction() before a real send.
 */
const https = require('https');
const { generateUnsubscribeToken } = require('./unsubscribeTokens');

const DEFAULT_BASE = 'https://legacyodyssey.com';
const UNSUB_MAILTO = 'mailto:unsubscribe@legacyodyssey.com?subject=unsubscribe';

function unsubscribeUrl(familyId, baseUrl = DEFAULT_BASE) {
  return `${baseUrl}/unsubscribe?token=${generateUnsubscribeToken(familyId)}`;
}

/** Headers for Resend's `headers` option. */
function unsubscribeHeaders(url) {
  return {
    'List-Unsubscribe': `<${url}>, <${UNSUB_MAILTO}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

// Escape LIKE/ILIKE wildcards so an email is matched literally.
function escapeLike(s) {
  return String(s).replace(/[\\%_]/g, (c) => '\\' + c);
}

/**
 * Mark EVERY family row that shares this family's email as unsubscribed
 * (multi-site customers have several rows with one email). Returns the email,
 * or null if the family wasn't found. `supabaseAdmin` is injected so this works
 * from the server.
 */
async function setUnsubscribed(supabaseAdmin, familyId, unsubscribed) {
  const { data: fam, error } = await supabaseAdmin
    .from('families').select('id, email').eq('id', familyId).maybeSingle();
  if (error) throw error;
  if (!fam) return null;
  const value = unsubscribed ? new Date().toISOString() : null;
  let q = supabaseAdmin.from('families').update({ unsubscribed_at: value });
  // Case-insensitive exact match on email; escape LIKE wildcards (_ is common in emails).
  q = fam.email ? q.ilike('email', escapeLike(fam.email)) : q.eq('id', fam.id);
  // Don't overwrite the original unsubscribe timestamp on repeat clicks.
  if (unsubscribed) q = q.is('unsubscribed_at', null);
  const { error: upErr } = await q;
  if (upErr) throw upErr;
  return fam.email;
}

// ---------------------------------------------------------------------------
// Script helpers (scripts/send-*.js). These use the Supabase REST API directly,
// like the scripts always have, so they need SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY in the environment.
// ---------------------------------------------------------------------------

function getJSON(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { reject(new Error(`Bad JSON from ${url.split('?')[0]} (HTTP ${res.statusCode})`)); }
      });
    }).on('error', reject);
  });
}

const DEFAULT_EXCLUDE = ['dragno65@hotmail.com', 'sample@your-family-photo-album.com'];

/**
 * Active, paid, non-archived customers who have NOT unsubscribed, one entry per
 * email address: [{ email, familyId }]. If ANY site row for an email is
 * unsubscribed, the whole email is skipped.
 */
async function fetchMarketingRecipients({ exclude = DEFAULT_EXCLUDE } = {}) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

  const active = await getJSON(
    `${SUPABASE_URL}/rest/v1/families?select=id,email,created_at`
      + '&subscription_status=eq.active&plan=eq.paid&archived_at=is.null&unsubscribed_at=is.null&order=created_at.asc',
    headers,
  );
  if (active.status !== 200 || !Array.isArray(active.body)) throw new Error(`families query failed: HTTP ${active.status}`);

  const unsub = await getJSON(
    `${SUPABASE_URL}/rest/v1/families?select=email&unsubscribed_at=not.is.null`,
    headers,
  );
  if (unsub.status !== 200 || !Array.isArray(unsub.body)) throw new Error(`unsubscribed query failed: HTTP ${unsub.status}`);
  const unsubscribed = new Set(unsub.body.map((r) => (r.email || '').trim().toLowerCase()).filter(Boolean));

  const excludeSet = new Set(exclude.map((e) => e.toLowerCase()));
  const byEmail = new Map();
  for (const r of active.body) {
    const email = (r.email || '').trim();
    const key = email.toLowerCase();
    if (!email || excludeSet.has(key) || unsubscribed.has(key)) continue;
    if (/@legacyodyssey\.com$/i.test(email) || /smoketest/i.test(email)) continue;
    if (!byEmail.has(key)) byEmail.set(key, { email, familyId: r.id });
  }
  return { recipients: [...byEmail.values()], skippedUnsubscribed: unsubscribed.size };
}

/**
 * Refuse to send if this machine's SESSION_SECRET differs from production's —
 * otherwise every unsubscribe link in the batch would be rejected as invalid.
 * Builds a token for `familyId` and asks production to validate the signature
 * (GET /unsubscribe/verify, no side effects).
 */
async function assertUnsubscribeSecretMatchesProduction(familyId, baseUrl = DEFAULT_BASE) {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not set. Run this script with the PRODUCTION SESSION_SECRET (e.g. `railway run node scripts/<script>.js --force`) so unsubscribe links work.');
  }
  const token = generateUnsubscribeToken(familyId);
  const res = await getJSON(`${baseUrl}/unsubscribe/verify?token=${encodeURIComponent(token)}`, {});
  if (res.status !== 200 || !res.body || res.body.valid !== true) {
    throw new Error(`Unsubscribe links would NOT work in production (verify returned HTTP ${res.status}: ${JSON.stringify(res.body)}). Your SESSION_SECRET does not match production's, or the /unsubscribe/verify route is not deployed yet. Nothing was sent.`);
  }
}

module.exports = {
  UNSUB_MAILTO,
  unsubscribeUrl,
  unsubscribeHeaders,
  setUnsubscribed,
  fetchMarketingRecipients,
  assertUnsubscribeSecretMatchesProduction,
};
