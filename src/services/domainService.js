const { supabaseAdmin } = require('../config/supabase');
const spaceshipService = require('./spaceshipService');
const familyService = require('./familyService');

// In-memory cache for availability results (5 min TTL)
const availabilityCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = availabilityCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  availabilityCache.delete(key);
  return null;
}

function setCache(key, data) {
  availabilityCache.set(key, { data, ts: Date.now() });
}

/**
 * Sanitize a base name: lowercase, alphanumeric + hyphens only.
 */
function sanitizeBaseName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

/**
 * Search for domain availability across primary TLDs.
 * Returns { results, alternatives }.
 */
async function searchDomains(baseName) {
  const clean = sanitizeBaseName(baseName);
  if (!clean || clean.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  // Check cache first
  const cacheKey = `search:${clean}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Check primary TLDs
  const results = await spaceshipService.checkMultipleTlds(clean);

  // Filter to only show affordable + available
  const hasAvailable = results.some((r) => r.available && r.underBudget);

  let alternatives = [];
  if (!hasAvailable) {
    alternatives = await suggestAlternatives(clean);
  }

  const response = { results, alternatives };
  setCache(cacheKey, response);
  return response;
}

/**
 * Generate and check alternative domain suggestions when primary options are taken.
 */
async function suggestAlternatives(baseName) {
  const variations = generateVariations(baseName);

  // Check a batch of variations (cap at 10 to stay within rate limits)
  const toCheck = variations.slice(0, 10);
  const results = await Promise.allSettled(
    toCheck.map((domain) => spaceshipService.checkAvailability(domain))
  );

  return results
    .map((r) => {
      if (r.status === 'rejected' || !r.value) return null;
      const v = r.value;
      if (!v.available) return null;
      const underBudget = v.price != null ? v.price <= spaceshipService.MAX_REGISTRATION_PRICE : true;
      if (!underBudget) return null;
      return { domain: v.domain, available: true, price: v.price, underBudget: true };
    })
    .filter(Boolean);
}

/**
 * Generate domain name variations for alternatives.
 */
function generateVariations(baseName) {
  const variations = [];

  // Prefixes
  const prefixes = ['the', 'little', 'baby', 'our'];
  for (const p of prefixes) {
    variations.push(`${p}${baseName}.com`);
  }

  // Suffixes
  const suffixes = ['family', 'book', 'story'];
  for (const s of suffixes) {
    variations.push(`${baseName}${s}.com`);
  }

  // Additional TLDs with the original name
  const extraTlds = ['me', 'name', 'us'];
  for (const tld of extraTlds) {
    variations.push(`${baseName}.${tld}`);
  }

  // Common middle names appended
  const middleNames = ['rose', 'marie', 'grace', 'james', 'lee'];
  for (const m of middleNames) {
    variations.push(`${baseName}${m}.com`);
  }

  return variations;
}

// --- Domain purchase orchestration ---

/**
 * Create a domain order record in the database.
 */
async function createDomainOrder({ familyId, domain, stripeSessionId, price }) {
  const tld = domain.split('.').slice(1).join('.');

  const { data, error } = await supabaseAdmin
    .from('domain_orders')
    .insert({
      family_id: familyId,
      domain,
      tld,
      status: 'pending',
      stripe_session_id: stripeSessionId,
      price_yearly: price, // NOTE: this is the one-time registration cost (column name is legacy)
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a domain order's status and optional fields.
 */
async function updateDomainOrder(orderId, fields) {
  const { data, error } = await supabaseAdmin
    .from('domain_orders')
    .update(fields)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Main orchestration: purchase domain, set up DNS, add to Railway.
 * Called async (fire-and-forget) after Stripe payment.
 */
async function purchaseAndSetupDomain(orderId) {
  let order;
  try {
    // Get the order
    const { data } = await supabaseAdmin
      .from('domain_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    order = data;

    if (!order) throw new Error(`Domain order ${orderId} not found`);

    // Step 1: Register domain
    await updateDomainOrder(orderId, { status: 'registering' });
    const operationId = await spaceshipService.registerDomain(order.domain);
    await updateDomainOrder(orderId, { spaceship_op_id: operationId });

    // Step 2: Poll for completion (max 5 minutes)
    const MAX_POLLS = 30;
    const POLL_INTERVAL = 10000; // 10 seconds
    let registered = false;

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      const status = await spaceshipService.pollOperation(operationId);

      if (status === 'success') {
        registered = true;
        break;
      }
      if (status === 'failed') {
        throw new Error(`Spaceship registration failed for ${order.domain}`);
      }
      // status === 'pending' — keep polling
      console.log(`Domain ${order.domain} registration pending (poll ${i + 1}/${MAX_POLLS})`);
    }

    if (!registered) {
      throw new Error(`Domain registration timed out for ${order.domain}`);
    }

    await updateDomainOrder(orderId, { status: 'registered', registered_at: new Date().toISOString() });
    console.log(`Domain registered: ${order.domain}`);

    // Step 3: Add www domain to Railway only. Root domains cannot use CNAME
    // so Railway can never issue TLS for them. Root traffic is handled by
    // a Spaceship URL redirect → https://www.{domain}.
    let railwayDomainId = null;
    let cnameTarget = null;
    try {
      const railwayService = require('./railwayService');
      const wwwResult = await railwayService.addCustomDomain(`www.${order.domain}`);
      railwayDomainId = wwwResult.id;
      cnameTarget = wwwResult.cnameTarget;
      console.log(`Railway www domain added: www.${order.domain} (cname: ${cnameTarget})`);
    } catch (err) {
      console.error(`Railway custom domain setup failed for www.${order.domain}:`, err.message);
      // Non-fatal — will fall back to RAILWAY_CNAME_TARGET env var for DNS
    }

    // Step 4: Set up DNS (www CNAME → Railway) and root URL redirect → www
    await spaceshipService.setupDns(order.domain, cnameTarget);
    try {
      await spaceshipService.setupUrlRedirect(order.domain);
    } catch (redirectErr) {
      console.error(`URL redirect setup failed for ${order.domain}:`, redirectErr.message);
      // Non-fatal — www still works without root redirect
    }
    await updateDomainOrder(orderId, { status: 'dns_setup', dns_configured_at: new Date().toISOString() });

    // Step 5: Update family record with custom domain
    if (order.family_id) {
      await familyService.update(order.family_id, { custom_domain: order.domain });
    }

    // Step 6: Mark as active
    await updateDomainOrder(orderId, {
      status: 'active',
      railway_domain_id: railwayDomainId,
    });

    console.log(`Domain fully active: ${order.domain}`);
  } catch (err) {
    console.error(`Domain purchase failed for order ${orderId}:`, err.message);
    try {
      await updateDomainOrder(orderId, {
        status: 'failed',
        error_message: err.message,
      });
    } catch (updateErr) {
      console.error('Failed to update domain order status:', updateErr.message);
    }
  }
}

module.exports = {
  searchDomains,
  suggestAlternatives,
  createDomainOrder,
  updateDomainOrder,
  purchaseAndSetupDomain,
  sanitizeBaseName,
};
