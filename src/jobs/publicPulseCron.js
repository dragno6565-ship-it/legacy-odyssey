const cron = require('node-cron');
const axios = require('axios');
const { Resend } = require('resend');
const { supabaseAdmin } = require('../config/supabase');
const { isFullyServing } = require('../services/siteHealthCheck');

/**
 * Public-surface pulse — HOURLY correctness check of everything a customer or
 * visitor can hit, added 2026-07-14 after the custom-domain outage (all custom
 * domains served the marketing page for ~11 weeks; the daily check only
 * verified reachability, so nothing alerted).
 *
 * Dan's standing requirement: monitoring must prove the product WORKS — the
 * right content on the right URL — at all times, not that URLs respond.
 *
 * Checks every hour:
 *   1. Every active customer custom domain serves THE CUSTOMER'S SITE
 *      (content-verified apex + www via siteHealthCheck).
 *   2. One active subdomain serves the book password gate.
 *   3. Homepage serves the marketing page.
 *   4. /start/checkout renders the branded checkout.
 *   5. /gift renders the gift page.
 *
 * Alerts ADMIN_EMAIL on any failure. A repeated identical failure signature is
 * re-alerted at most every 6h (so a broken domain doesn't send 24 emails/day),
 * but any NEW failure alerts immediately.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dragno6565@gmail.com';
const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';
const REALERT_MS = 6 * 60 * 60 * 1000;

// Internal/test rows (Dan's test purchases + the sample site) — excluded so an
// alert ALWAYS means real customers are affected. Same set the campaign email
// scripts exclude.
const INTERNAL_EMAILS = new Set(['dragno65@hotmail.com', 'sample@your-family-photo-album.com']);
const isInternal = (f) => !f.email || INTERNAL_EMAILS.has(f.email)
  || /@legacyodyssey\.com$/i.test(f.email) || /smoketest/i.test(f.email);

let lastAlertSignature = null;
let lastAlertAt = 0;

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

async function fetchPage(url) {
  try {
    const r = await axios.get(url, {
      timeout: 8000, maxRedirects: 5, validateStatus: () => true,
      headers: { 'User-Agent': 'LegacyOdyssey-Pulse/1.0' },
    });
    return { status: r.status, body: String(r.data || '') };
  } catch (err) {
    return { status: 0, body: '', error: err.code || err.message };
  }
}

async function runPulse() {
  const failures = [];

  // 1. Custom domains serve the customer's site (content-verified)
  try {
    const { data: families } = await supabaseAdmin
      .from('families')
      .select('custom_domain, subdomain, email')
      .in('subscription_status', ['active', 'trialing'])
      .is('archived_at', null)
      .not('custom_domain', 'is', null)
      .eq('is_active', true);
    const withDomain = (families || []).filter((f) => f.custom_domain && !isInternal(f));
    const results = await Promise.all(withDomain.map(async (f) => {
      const r = await isFullyServing(f.custom_domain);
      if (r.live) return null;
      const why = r.checkedUrls.filter((c) => !c.ok)
        .map((c) => `${c.url}=${c.content === 'marketing' ? 'SERVES MARKETING' : (c.status || c.error)}`).join(', ');
      return `${f.custom_domain}: ${why}`;
    }));
    failures.push(...results.filter(Boolean).map((m) => `custom-domain — ${m}`));

    // 2. One subdomain must serve the password gate
    const sub = (families || []).find((f) => f.subdomain);
    if (sub) {
      const p = await fetchPage(`https://${sub.subdomain}.legacyodyssey.com/`);
      if (!(p.status === 200 && p.body.includes('/verify-password'))) {
        failures.push(`subdomain — ${sub.subdomain}.legacyodyssey.com: ${p.status}/${p.error || 'no password gate'}`);
      }
    }
  } catch (err) {
    failures.push(`custom-domain sweep errored: ${err.message}`);
  }

  // 3–5. Marketing surface: right page on the right URL
  const pages = [
    { name: 'homepage', url: 'https://legacyodyssey.com/', marker: 'openFounderModal' },
    { name: 'checkout', url: 'https://legacyodyssey.com/start/checkout?plan=annual', marker: 'gcPaymentElement' },
    { name: 'gift', url: 'https://legacyodyssey.com/gift', marker: 'Give the Gift' },
  ];
  for (const pg of pages) {
    const p = await fetchPage(pg.url);
    if (!(p.status === 200 && p.body.includes(pg.marker))) {
      failures.push(`${pg.name} — ${pg.url}: status ${p.status}${p.error ? '/' + p.error : ''}, marker "${pg.marker}" ${p.body.includes(pg.marker) ? 'ok' : 'MISSING'}`);
    }
  }

  if (!failures.length) {
    console.log('[pulse] all public checks OK');
    lastAlertSignature = null; // clear so a future recurrence alerts immediately
    return { ok: true };
  }

  console.error(`[pulse] ${failures.length} FAILURE(S):\n  ${failures.join('\n  ')}`);

  // Throttle: identical failure set → at most one alert per 6h; new/changed set → alert now.
  const signature = failures.slice().sort().join('|');
  const now = Date.now();
  if (signature === lastAlertSignature && now - lastAlertAt < REALERT_MS) {
    console.log('[pulse] same failure signature already alerted — suppressing repeat email');
    return { ok: false, failures, suppressed: true };
  }

  const client = getResend();
  if (!client) {
    console.warn('[pulse] Resend not configured — cannot email alert');
    return { ok: false, failures };
  }
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to: [ADMIN_EMAIL],
      subject: `🚨 Legacy Odyssey PULSE — ${failures.length} public-surface failure(s)`,
      html: `<p style="font-family:Arial,sans-serif;font-size:14px;">Hourly public-surface pulse found problems customers can SEE right now:</p>
<ul style="font-family:Arial,sans-serif;font-size:13px;">${failures.map((f) => `<li>${f}</li>`).join('')}</ul>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#888;">Checked: every custom domain (content-verified), a subdomain gate, homepage, /start/checkout, /gift. Repeats of this exact failure set are suppressed for 6h.</p>`,
    });
    lastAlertSignature = signature;
    lastAlertAt = now;
    console.log(`[pulse] alert email sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('[pulse] alert email failed:', err.message);
  }
  return { ok: false, failures };
}

function startPublicPulseScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('public-pulse', runPulse);
  // Hourly at :10 (offset from other jobs)
  cron.schedule('10 * * * *', tracked);
  console.log('[pulse] Scheduler started — public-surface correctness pulse runs hourly at :10');
}

module.exports = { startPublicPulseScheduler, runPulse };
