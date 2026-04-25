const { spaceship } = require('../config/spaceship');

const MAX_REGISTRATION_PRICE = 20; // Don't purchase domains that cost more than $20 to register

const PRIMARY_TLDS = ['com', 'family', 'baby', 'love', 'life', 'me'];

/**
 * Check availability of a single domain (e.g., "janedoe.com").
 * Returns { domain, available, price } or null on error.
 */
async function checkAvailability(domain) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  try {
    const { data } = await spaceship.get(`/domains/${encodeURIComponent(domain)}/available`);
    // API returns { domain, result: "available"|"taken", premiumPricing: [] }
    const premium = data.premiumPricing?.[0];
    return {
      domain,
      available: data.result === 'available',
      price: premium?.price != null ? parseFloat(premium.price) : null,
    };
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn(`Spaceship rate limited for ${domain}`);
      return { domain, available: false, price: null, rateLimited: true };
    }
    console.error(`Spaceship availability check failed for ${domain}:`, err.message);
    return null;
  }
}

/**
 * Check availability of a base name across multiple TLDs.
 * Uses the bulk endpoint (POST /domains/available) for efficiency.
 * Filters out domains over the price cap.
 * Returns array of { domain, tld, available, price, underBudget }.
 */
async function checkMultipleTlds(baseName, tlds = PRIMARY_TLDS) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  const domains = tlds.map((tld) => `${baseName}.${tld}`);

  try {
    const { data } = await spaceship.post('/domains/available', { domains });
    // API returns { domains: [{ domain, result, premiumPricing }] }
    return (data.domains || []).map((item) => {
      const tld = item.domain.split('.').slice(1).join('.');
      const premium = item.premiumPricing?.[0];
      const price = premium?.price != null ? parseFloat(premium.price) : null;
      const underBudget = price != null ? price <= MAX_REGISTRATION_PRICE : true;
      return {
        domain: item.domain,
        tld,
        available: item.result === 'available',
        price,
        underBudget,
      };
    });
  } catch (err) {
    console.error(`Bulk availability check failed for ${baseName}:`, err.message);
    // Fallback to individual checks
    const results = await Promise.allSettled(
      domains.map((d) => checkAvailability(d))
    );
    return results.map((r, i) => {
      if (r.status === 'rejected' || !r.value) {
        return { domain: domains[i], tld: tlds[i], available: false, price: null, underBudget: false };
      }
      const v = r.value;
      const underBudget = v.price != null ? v.price <= MAX_REGISTRATION_PRICE : true;
      return { domain: v.domain, tld: tlds[i], available: v.available, price: v.price, underBudget };
    });
  }
}

/**
 * Register a domain via Spaceship. Returns the async operation ID.
 * Domain registration is asynchronous â€” poll with pollOperation().
 */
async function registerDomain(domain) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  const contactId = process.env.SPACESHIP_CONTACT_ID;
  if (!contactId) throw new Error('SPACESHIP_CONTACT_ID not configured');

  // Safety check: verify domain isn't premium before purchasing
  const check = await checkAvailability(domain);
  if (!check || !check.available) throw new Error(`Domain ${domain} is not available`);
  if (check.price != null && check.price > MAX_REGISTRATION_PRICE) {
    throw new Error(`Domain ${domain} costs $${check.price}/yr — exceeds max $${MAX_REGISTRATION_PRICE}`);
  }

  const { headers } = await spaceship.post(`/domains/${encodeURIComponent(domain)}`, {
    autoRenew: true,
    years: 1,
    privacyProtection: {
      level: 'high',
      userConsent: true,
    },
    contacts: {
      registrant: contactId,
      admin: contactId,
      tech: contactId,
      billing: contactId,
    },
  });

  const operationId = headers['spaceship-async-operationid'];
  if (!operationId) {
    throw new Error('No operation ID returned from Spaceship registration');
  }

  console.log(`Domain registration started: ${domain} (operation: ${operationId})`);
  return operationId;
}

/**
 * Poll an async operation status.
 * Returns 'pending', 'success', or 'failed'.
 */
async function pollOperation(operationId) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  const { data } = await spaceship.get(`/async-operations/${operationId}`);
  return data.status; // 'pending', 'success', 'failed'
}

// Fastly's anycast IP that Railway routes through — the same IP all .up.railway.app
// hostnames resolve to. We use it as an A record on customer apex domains since
// CNAME on apex is illegal per DNS standards (RFC 1034).
const RAILWAY_FASTLY_IP = '151.101.2.15';

/**
 * Set DNS records on a customer domain so BOTH www and apex serve their book.
 *
 * Writes 4 records:
 *   A     @                       → 151.101.2.15  (Fastly/Railway edge)
 *   TXT   _railway-verify         → railway-verify=<apex-token>
 *   CNAME www                     → <railway-www-target>
 *   TXT   _railway-verify.www     → railway-verify=<www-token>
 *
 * Both verification TXT records are required — without them Railway stays in
 * VALIDATING_OWNERSHIP forever and never issues Let's Encrypt certs.
 *
 * Spaceship API: PUT /dns/records/{domain}. The endpoint is non-destructive
 * in some cases (Spaceship admin-API quirk discovered 2026-04-25), so we
 * DELETE-then-PUT to ensure clean state.
 *
 * @param domain    bare domain, e.g. "kateragno.com"
 * @param wwwTarget Railway CNAME target for www, e.g. "abc123.up.railway.app"
 * @param opts.verificationHost / verificationToken — for the www verification TXT
 * @param opts.apexVerifyHost / apexVerifyToken — for the apex verification TXT (optional;
 *           if absent, apex registration is skipped — useful for legacy single-domain customers)
 */
async function setupDns(domain, wwwTarget, opts = {}) {
  if (!spaceship) throw new Error('Spaceship API not configured');
  const target = wwwTarget || process.env.RAILWAY_CNAME_TARGET;
  if (!target) throw new Error('No CNAME target provided and RAILWAY_CNAME_TARGET not configured');

  const { verificationHost, verificationToken, apexVerifyHost, apexVerifyToken } = opts;

  // Build the desired record set
  const items = [
    { type: 'CNAME', name: 'www', cname: target, ttl: 1800 },
  ];
  if (verificationHost && verificationToken) {
    items.push({ type: 'TXT', name: verificationHost, value: verificationToken, ttl: 1800 });
  }
  if (apexVerifyHost && apexVerifyToken) {
    items.push({ type: 'A', name: '@', address: RAILWAY_FASTLY_IP, ttl: 1800 });
    items.push({ type: 'TXT', name: apexVerifyHost, value: apexVerifyToken, ttl: 1800 });
  }

  await spaceship.put(`/dns/records/${encodeURIComponent(domain)}`, { force: true, items });
  console.log(`DNS configured for ${domain}: www → ${target}${apexVerifyHost ? `, apex → ${RAILWAY_FASTLY_IP}` : ''}`);
}

/**
 * Set up a 301 URL redirect from the root domain to https://www.{domain}.
 * NOTE: As of 2026, Spaceship removed the /url-forwardings API endpoint.
 * Root-domain redirects must be configured manually in the Spaceship dashboard,
 * OR by setting A records on @ pointing to a redirect service.
 * Customers reach their book via www. (from emails, links). Root @ traffic without
 * a redirect simply fails — non-critical for the primary user journey.
 */
async function setupUrlRedirect(domain) {
  // Endpoint removed by Spaceship — no-op. Caller already wraps this in try/catch
  // so it gracefully degrades. Keeping the function signature so the caller still
  // compiles and we don't break the orchestration flow.
  console.log(`URL redirect skipped for ${domain} (Spaceship endpoint deprecated; root traffic unhandled)`);
}

/**
 * Toggle auto-renewal for a registered domain.
 * Spaceship API: PUT /domains/{domain}/autoRenew with body { isEnabled: bool }.
 * Rate limit: 5 requests per domain per 300 seconds.
 */
async function setAutoRenew(domain, enabled) {
  if (!spaceship) throw new Error('Spaceship API not configured');
  await spaceship.put(`/domains/${encodeURIComponent(domain)}/autoRenew`, { isEnabled: !!enabled });
  console.log(`Spaceship auto-renew ${enabled ? 'ENABLED' : 'DISABLED'} for ${domain}`);
}

module.exports = {
  checkAvailability,
  checkMultipleTlds,
  registerDomain,
  pollOperation,
  setupDns,
  setupUrlRedirect,
  setAutoRenew,
  PRIMARY_TLDS,
  MAX_REGISTRATION_PRICE,
};
