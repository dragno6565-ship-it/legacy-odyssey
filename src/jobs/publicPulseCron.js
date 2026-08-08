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
 * right content on the right URL — not merely that URLs respond.
 *
 * ── MONITOR-BLINDNESS GUARD (2026-08-08) ──────────────────────────────────────
 * This job runs INSIDE the production container and reaches every target by its
 * PUBLIC URL, which routes out to Cloudflare and hairpins back to this same app.
 * If the container's egress can't hairpin (e.g. after Railway reschedules it),
 * EVERY self-referential check times out (ECONNABORTED) even though the site is
 * fully up for real visitors: inbound is unaffected, and third-party outbound
 * (Resend/Stripe/Supabase) still works — which is exactly how this job can still
 * query the DB and send mail while "seeing" the whole site as down.
 *
 * On 2026-08-08 that produced an hourly false-alarm storm ("everything down",
 * including our own homepage) while the site was 100% healthy. So: before
 * trusting ANY failure, the monitor first checks whether it can reach our own
 * homepage — which is effectively always up (Sentry Uptime watches it
 * externally). If it can't even fetch that (connection error, not a content
 * mismatch), the MONITOR is blind, not the site: we send at most one throttled
 * "monitor offline, NOT a confirmed outage" note and skip the customer alarms.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dragno6565@gmail.com';
const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';
const REALERT_MS = 6 * 60 * 60 * 1000;

// Internal/test rows — excluded so an alert ALWAYS means real customers.
const INTERNAL_EMAILS = new Set(['dragno65@hotmail.com', 'sample@your-family-photo-album.com']);
const isInternal = (f) => !f.email || INTERNAL_EMAILS.has(f.email)
  || /@legacyodyssey\.com$/i.test(f.email) || /smoketest/i.test(f.email);

// Per-kind throttle so a persistent condition e-mails at most once per 6h even
// when the exact failure set shuffles between runs (the old signature-based
// throttle mailed hourly because which domains timed out varied each run).
const lastAlertAt = { outage: 0, blind: 0 };

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

// status 0 == the request never completed (timeout/DNS/refused) → a CONNECTION
// error. A 200 with the wrong body is a real, actionable content failure.
const isConnError = (p) => !p || p.status === 0;

async function fetchPage(url, attempts = 2) {
  let last = { status: 0, body: '', error: 'no attempt' };
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await axios.get(url, {
        timeout: 10000, maxRedirects: 5, validateStatus: () => true,
        headers: { 'User-Agent': 'LegacyOdyssey-Pulse/1.0' },
      });
      return { status: r.status, body: String(r.data || '') };
    } catch (err) {
      last = { status: 0, body: '', error: err.code || err.message };
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return last;
}

async function sendAlert(kind, subject, introHtml, items) {
  const now = Date.now();
  if (now - (lastAlertAt[kind] || 0) < REALERT_MS) {
    console.log(`[pulse] ${kind} alert throttled (last sent < 6h ago)`);
    return;
  }
  const client = getResend();
  if (!client) { console.warn('[pulse] Resend not configured — cannot email alert'); return; }
  try {
    await client.emails.send({
      from: FROM_ADDRESS, to: [ADMIN_EMAIL], subject,
      html: `<p style="font-family:Arial,sans-serif;font-size:14px;">${introHtml}</p>${
        items && items.length
          ? `<ul style="font-family:Arial,sans-serif;font-size:13px;">${items.map((f) => `<li>${f}</li>`).join('')}</ul>`
          : ''
      }<p style="font-family:Arial,sans-serif;font-size:12px;color:#888;">Re-raised at most every 6h.</p>`,
    });
    lastAlertAt[kind] = now;
    console.log(`[pulse] ${kind} alert email sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('[pulse] alert email failed:', err.message);
  }
}

async function runPulse() {
  // ── SELF-CHECK FIRST. If the monitor can't even reach our own homepage over
  // the network, its results are meaningless — it's blind, not the site down.
  const home = await fetchPage('https://legacyodyssey.com/');
  if (isConnError(home)) {
    console.error(`[pulse] MONITOR BLIND — cannot reach own homepage (${home.error}); egress/hairpin problem inside the container, NOT a customer outage. Skipping checks.`);
    await sendAlert('blind',
      '⚠️ Legacy Odyssey pulse — monitor can’t reach the network (NOT a confirmed outage)',
      `The pulse monitor (which runs inside the production server) can’t make outbound requests to our own site right now (<code>${home.error}</code>). This almost always means the server can’t loop back to its own public domain, NOT that the site is down — real visitors are unaffected, and external uptime monitoring (Sentry) is the source of truth for "is the site actually up". The in-container content checks are paused until egress recovers.`,
      []);
    return { ok: false, blind: true };
  }

  const failures = [];

  // Homepage content (already fetched) must be the marketing page.
  if (!home.body.includes('openFounderModal')) {
    failures.push(`homepage — https://legacyodyssey.com/: reachable (status ${home.status}) but marker "openFounderModal" MISSING`);
  }

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

  // 3–4. The two money pages must render.
  for (const pg of [
    { name: 'checkout', url: 'https://legacyodyssey.com/start/checkout?plan=annual', marker: 'gcPaymentElement' },
    { name: 'gift', url: 'https://legacyodyssey.com/gift', marker: 'Give the Gift' },
  ]) {
    const p = await fetchPage(pg.url);
    if (!(p.status === 200 && p.body.includes(pg.marker))) {
      failures.push(`${pg.name} — ${pg.url}: status ${p.status}${p.error ? '/' + p.error : ''}, marker "${pg.marker}" ${p.body.includes(pg.marker) ? 'ok' : 'MISSING'}`);
    }
  }

  // Second blindness guard: the homepage was reachable, but if EVERY other
  // target failed with a connection error (not content), that's still egress
  // flakiness rather than a real simultaneous outage of every customer domain.
  const connFailures = failures.filter((f) => /ECONNABORTED|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|=0\b|status 0/.test(f));
  if (failures.length >= 4 && connFailures.length === failures.length) {
    console.error(`[pulse] ${failures.length} targets all failed with CONNECTION errors while the homepage was reachable — treating as egress flakiness, not a customer outage. Not paging.`);
    return { ok: false, flaky: true, failures };
  }

  if (!failures.length) {
    console.log('[pulse] all public checks OK');
    return { ok: true };
  }

  console.error(`[pulse] ${failures.length} REAL failure(s):\n  ${failures.join('\n  ')}`);
  await sendAlert('outage',
    `🚨 Legacy Odyssey PULSE — ${failures.length} public-surface failure(s)`,
    'The hourly pulse found problems customers can SEE right now (homepage was reachable, so this is not monitor blindness):',
    failures);
  return { ok: false, failures };
}

function startPublicPulseScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('public-pulse', runPulse);
  cron.schedule('10 * * * *', tracked); // hourly at :10
  console.log('[pulse] Scheduler started — public-surface correctness pulse runs hourly at :10');
}

module.exports = { startPublicPulseScheduler, runPulse };
