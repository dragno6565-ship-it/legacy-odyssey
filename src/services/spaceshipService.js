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

/**
 * Set DNS records for a domain to point to Railway.
 * Sets CNAME for www (root @ cannot use CNAME per DNS standard) AND the
 * Railway verification TXT record (_railway-verify.www = railway-verify=...).
 * Without the TXT record Railway never validates ownership and TLS never issues.
 *
 * Spaceship API: PUT /dns/records/{domain} — replaces ALL records for the domain,
 * so we read existing records first and merge in www CNAME + verification TXT,
 * preserving everything else.
 * Schema: items=[{ type, name, ttl, ...typeSpecificFields }] where CNAME uses `cname`,
 * A uses `address`, MX uses `exchange`+`preference`, TXT uses `value`.
 */
async function setupDns(domain, cnameTarget, { verificationHost, verificationToken } = {}) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  // Use the Railway-assigned CNAME target if provided, fall back to env var
  const target = cnameTarget || process.env.RAILWAY_CNAME_TARGET;
  if (!target) throw new Error('No CNAME target provided and RAILWAY_CNAME_TARGET not configured');

  // Read existing records — Spaceship PUT is a full replace, so we must preserve them.
  const { data: existing } = await spaceship.get(`/dns/records/${encodeURIComponent(domain)}`, {
    params: { take: 100, skip: 0 },
  });
  const items = (existing.items || []).map((rec) => {
    // Strip read-only metadata before re-submitting
    const { group, ...rest } = rec;
    return rest;
  });

  // Replace or append the www CNAME
  const wwwIdx = items.findIndex((i) => i.type === 'CNAME' && i.name === 'www');
  const wwwRecord = { type: 'CNAME', name: 'www', cname: target, ttl: 1800 };
  if (wwwIdx >= 0) items[wwwIdx] = wwwRecord;
  else items.push(wwwRecord);

  // Replace or append the Railway verification TXT
  if (verificationHost && verificationToken) {
    const txtIdx = items.findIndex((i) => i.type === 'TXT' && i.name === verificationHost);
    const txtRecord = { type: 'TXT', name: verificationHost, value: verificationToken, ttl: 1800 };
    if (txtIdx >= 0) items[txtIdx] = txtRecord;
    else items.push(txtRecord);
  }

  await spaceship.put(`/dns/records/${encodeURIComponent(domain)}`, { force: true, items });
  console.log(`DNS configured for ${domain} → ${target}${verificationHost ? ` (+ verify TXT at ${verificationHost})` : ''}`);
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

module.exports = {
  checkAvailability,
  checkMultipleTlds,
  registerDomain,
  pollOperation,
  setupDns,
  setupUrlRedirect,
  PRIMARY_TLDS,
  MAX_REGISTRATION_PRICE,
};
