const axios = require('axios');

/**
 * Check whether a customer's domain is actually serving THE CUSTOMER'S SITE
 * over HTTPS — not merely responding.
 *
 * History of this check getting stricter, each time because a real outage
 * slipped past the looser version:
 *   - Apr 25 2026: apexes polluted with parking-IP A records; `isSiteLive`
 *     passed on www alone → switched daily audit to `isFullyServing` (both).
 *   - Jul 14 2026: EVERY custom domain served the marketing landing page for
 *     ~11 weeks (Approximated proxy rewrites Host; resolveFamily didn't read
 *     apx-incoming-host). All checks passed the whole time because they only
 *     verified an HTTP response (any 2xx–4xx!), never WHAT was served. Now a
 *     URL only counts as OK if it returns 200 AND the body is recognizably the
 *     customer's site (the password gate / book shell), and recognizably NOT
 *     the marketing landing page.
 *
 * `isSiteLive` (looser): live if EITHER www or apex serves the site.
 *   Used by site-live-detect cron to decide when to send the "your site is up"
 *   email — at that point a working www is enough good news. Content-aware so
 *   we never email "your website is live!" while the domain serves marketing.
 *
 * `isFullyServing` (stricter): live only if BOTH www AND apex serve the site.
 *   Used by the daily health check.
 *
 * Returns { live: bool, checkedUrls: [{ url, status, ok, content }] } where
 * content is 'site' | 'marketing' | 'other'.
 */

// A cookie-less request to a customer domain must render the password gate
// (every site has a password and the gate fails closed), whose form posts to
// /verify-password. The marketing landing page contains its own unmistakable
// markers and no gate.
const SITE_MARKER = '/verify-password';
const MARKETING_MARKERS = ['lo-pricing-btn', 'openFounderModal', 'landing_variant'];

function classifyBody(body) {
  const html = String(body || '');
  if (html.includes(SITE_MARKER)) return 'site';
  if (MARKETING_MARKERS.some((m) => html.includes(m))) return 'marketing';
  return 'other';
}

async function checkUrl(url) {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 5, // follow www→apex style redirects to the final body
      validateStatus: () => true,
      headers: { 'User-Agent': 'LegacyOdyssey-HealthCheck/1.0' },
    });
    const status = res.status;
    const content = classifyBody(res.data);
    // OK = the customer's actual site is being served. A 200 marketing page
    // (the Jul 14 outage), an error page, or any non-200 is NOT ok.
    const ok = status === 200 && content === 'site';
    return { url, status, ok, content };
  } catch (err) {
    return { url, status: 0, ok: false, content: 'other', error: err.code || err.message };
  }
}

async function isSiteLive(domain) {
  if (!domain) return { live: false, checkedUrls: [] };
  const lower = domain.toLowerCase();
  const urls = [`https://www.${lower}/`, `https://${lower}/`];
  const checks = [];
  for (const url of urls) {
    const r = await checkUrl(url);
    checks.push(r);
    if (r.ok) return { live: true, checkedUrls: checks };
  }
  return { live: false, checkedUrls: checks };
}

async function isFullyServing(domain) {
  if (!domain) return { live: false, checkedUrls: [] };
  const lower = domain.toLowerCase();
  const checks = await Promise.all([
    checkUrl(`https://www.${lower}/`),
    checkUrl(`https://${lower}/`),
  ]);
  const allOk = checks.every((c) => c.ok);
  return { live: allOk, checkedUrls: checks };
}

module.exports = { isSiteLive, isFullyServing };
