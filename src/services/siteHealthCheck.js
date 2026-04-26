const axios = require('axios');

/**
 * Check whether a customer's domain is actually serving content over HTTPS.
 *
 * `isSiteLive` (looser): live if EITHER www or apex returns 200/301/302/403.
 *   Used by site-live-detect cron to decide when to send the "your site is up"
 *   email — at that point a working www is enough good news.
 *
 * `isFullyServing` (stricter): live only if BOTH www AND apex return ok.
 *   Used by the daily health check, because half-broken domains (apex 404,
 *   www 200) are exactly the failure mode the audit needs to catch.
 *   Discovered Apr 25 2026: a Spaceship URL Redirect connection had been
 *   polluting customer apexes with parking-IP A records, but `isSiteLive`
 *   passed on www alone so nobody noticed for weeks.
 *
 * Returns { live: bool, checkedUrls: [{ url, status, ok }] }.
 */
async function checkUrl(url) {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 0,
      validateStatus: () => true,
      headers: { 'User-Agent': 'LegacyOdyssey-HealthCheck/1.0' },
    });
    const status = res.status;
    const ok = status >= 200 && status < 500;
    return { url, status, ok };
  } catch (err) {
    return { url, status: 0, ok: false, error: err.code || err.message };
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
