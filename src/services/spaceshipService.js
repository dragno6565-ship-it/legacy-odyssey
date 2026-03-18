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
 * Domain registration is asynchronous — poll with pollOperation().
 */
async function registerDomain(domain) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  const contactId = process.env.SPACESHIP_CONTACT_ID;
  if (!contactId) throw new Error('SPACESHIP_CONTACT_ID not configured');

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
 * Adds CNAME records for @ and www.
 */
async function setupDns(domain, cnameTarget) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  // Use the Railway-assigned CNAME target if provided, fall back to env var
  const target = cnameTarget || process.env.RAILWAY_CNAME_TARGET;
  if (!target) throw new Error('No CNAME target provided and RAILWAY_CNAME_TARGET not configured');

  // Set CNAME for root and www
  await spaceship.put('/dns-records', {
    domain,
    records: [
      { type: 'CNAME', name: '@', content: target, ttl: 300 },
      { type: 'CNAME', name: 'www', content: target, ttl: 300 },
    ],
  });

  console.log(`DNS configured for ${domain} → ${target}`);
}

module.exports = {
  checkAvailability,
  checkMultipleTlds,
  registerDomain,
  pollOperation,
  setupDns,
  PRIMARY_TLDS,
  MAX_REGISTRATION_PRICE,
};
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
      const underBudget = v.price != null ? v.price <= MAX_PRICE_YEARLY : true;
      return { domain: v.domain, tld: tlds[i], available: v.available, price: v.price, underBudget };
    });
  }
}

/**
 * Register a domain via Spaceship. Returns the async operation ID.
 * Domain registration is asynchronous — poll with pollOperation().
 */
async function registerDomain(domain) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  const contactId = process.env.SPACESHIP_CONTACT_ID;
  if (!contactId) throw new Error('SPACESHIP_CONTACT_ID not configured');

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
 * Adds CNAME records for @ and www.
 */
async function setupDns(domain) {
  if (!spaceship) throw new Error('Spaceship API not configured');

  const target = process.env.RAILWAY_CNAME_TARGET;
  if (!target) throw new Error('RAILWAY_CNAME_TARGET not configured');

  // Set CNAME for root and www
  await spaceship.put('/dns-records', {
    domain,
    records: [
      { type: 'CNAME', name: '@', content: target, ttl: 300 },
      { type: 'CNAME', name: 'www', content: target, ttl: 300 },
    ],
  });

  console.log(`DNS configured for ${domain} → ${target}`);
}

module.exports = {
  checkAvailability,
  checkMultipleTlds,
  registerDomain,
  pollOperation,
  setupDns,
  PRIMARY_TLDS,
  MAX_REGISTRATION_PRICE,
};
