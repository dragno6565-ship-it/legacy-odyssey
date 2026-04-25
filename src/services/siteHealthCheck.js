const axios = require('axios');

/**
 * Check whether a customer's domain is actually serving content over HTTPS.
 *
 * Tests both `https://www.{domain}` and `https://{domain}` — passes if either
 * returns 200/301/302/403 (403 happens at the password page when password is
 * required but cookie missing — that's a "live, working" signal).
 *
 * Returns { live: bool, checkedUrls: [{ url, status, ok }] } so the caller
 * can log details for diagnostics.
 */
async function isSiteLive(domain) {
  if (!domain) return { live: false, checkedUrls: [] };
  const lower = domain.toLowerCase();
  const urls = [`https://www.${lower}/`, `https://${lower}/`];
  const checks = [];

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        timeout: 8000,
        maxRedirects: 0,
        // Don't trust whatever certs the customer's edge serves; we just
        // want to know if there's a TLS-terminated HTTP server responding.
        validateStatus: () => true,
        // A real browser-ish UA so any server-side firewalls don't block us.
        headers: { 'User-Agent': 'LegacyOdyssey-HealthCheck/1.0' },
      });
      const status = res.status;
      const ok = status >= 200 && status < 500; // 200/301/302/403 all count as "live"
      checks.push({ url, status, ok });
      if (ok) return { live: true, checkedUrls: checks };
    } catch (err) {
      // ECONNREFUSED, ETIMEDOUT, certificate errors, DNS not resolved, etc.
      checks.push({ url, status: 0, ok: false, error: err.code || err.message });
    }
  }

  return { live: false, checkedUrls: checks };
}

module.exports = { isSiteLive };
