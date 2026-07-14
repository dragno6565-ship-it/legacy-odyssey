// Resolve the ORIGINAL request host, accounting for the Approximated proxy.
//
// Customer custom domains (their .coms) are fronted by Approximated, which
// terminates TLS for the customer domain and proxies to APPROXIMATED_TARGET
// (our app, on legacyodyssey.com). So that the proxied request routes through
// our own CDN/host, Approximated rewrites the Host header to the target — which
// means req.hostname is "legacyodyssey.com" for EVERY custom-domain request.
// The original hostname is preserved in the `apx-incoming-host` request header.
//
// Without reading that header, resolveFamily saw every custom domain as the
// marketing host and served the marketing landing page instead of the book
// (systemic custom-domain outage after the Approximated migration, Apr 2026).
//
// We honor apx-incoming-host ONLY when the transport host is our own app domain
// (i.e. the request genuinely arrived via the Approximated proxy, which always
// rewrites Host to the target). Direct subdomain (*.legacyodyssey.com) and
// marketing requests hit the app with the real Host and no apx header, so they
// fall through to req.hostname unchanged. The app-domain gate also prevents a
// stray/forged apx-incoming-host on a direct request from overriding routing.
function realHost(req) {
  const appDomain = (process.env.APP_DOMAIN || 'legacyodyssey.com').toLowerCase();
  const direct = String(req.hostname || '').toLowerCase().replace(/:\d+$/, '');
  const apx = String((req.headers && req.headers['apx-incoming-host']) || '')
    .toLowerCase()
    .replace(/:\d+$/, '');
  if (apx && (direct === appDomain || direct === `www.${appDomain}`)) {
    return apx;
  }
  return direct;
}

module.exports = { realHost };
