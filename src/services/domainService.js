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

    // Step 3: Register BOTH apex and www as Approximated virtual hosts.
    // Replaces Cloudflare for SaaS (which replaced Railway). Approximated
    // gives unlimited TLS-terminated hostnames per cluster with no zone-
    // creation permission politics — built for exactly this use case.
    // Discovered Apr 27 2026 after Cloudflare's account-scoped Zone:Edit
    // permission proved unavailable through the custom-token UI.
    //
    // Order matters: register virtual hosts BEFORE writing DNS so the
    // proxy is ready to issue a cert the moment customer DNS propagates.
    // Each side wrapped in its own try/catch so partial failures don't
    // mask the half that worked.
    const approximatedService = require('./approximatedService');
    let apexVhostId = null;
    let wwwVhostId = null;
    let wwwSetupError = null;
    let apexSetupError = null;

    try {
      const wwwResult = await approximatedService.addVirtualHost(`www.${order.domain}`);
      wwwVhostId = wwwResult.id;
      console.log(`Approximated www vhost added: www.${order.domain} (id: ${wwwVhostId})`);
    } catch (err) {
      wwwSetupError = err.message;
      console.error(`Approximated www add FAILED for ${order.domain}: ${err.message}`);
    }

    try {
      const apexResult = await approximatedService.addVirtualHost(order.domain);
      apexVhostId = apexResult.id;
      console.log(`Approximated apex vhost added: ${order.domain} (id: ${apexVhostId})`);
    } catch (err) {
      apexSetupError = err.message;
      console.error(`Approximated apex add FAILED for ${order.domain}: ${err.message}`);
    }

    // Step 4: Write Spaceship DNS — apex + www A records → Approximated
    // cluster IP. No verify TXTs. Cert auto-issues once Approximated sees
    // traffic at the cluster.
    await spaceshipService.setupDns(order.domain);
    await updateDomainOrder(orderId, { status: 'dns_setup', dns_configured_at: new Date().toISOString() });

    // Step 5: Update family record with custom domain
    if (order.family_id) {
      await familyService.update(order.family_id, { custom_domain: order.domain });
    }

    // Step 6: Final status — only mark `active` when BOTH sides succeeded.
    if (wwwSetupError || apexSetupError) {
      const parts = [];
      if (wwwSetupError) parts.push(`www: ${wwwSetupError}`);
      if (apexSetupError) parts.push(`apex: ${apexSetupError}`);
      await updateDomainOrder(orderId, {
        status: 'dns_setup',
        railway_domain_id: String(apexVhostId || wwwVhostId || ''), // legacy column name; now stores Approximated vhost id
        error_message: `Partial Approximated setup — ${parts.join('; ')}`,
      });
      console.warn(`Domain ${order.domain} ended in PARTIAL state — ${parts.join('; ')}`);
    } else {
      await updateDomainOrder(orderId, {
        status: 'active',
        railway_domain_id: String(apexVhostId), // legacy column name; stores Approximated vhost id
      });
      console.log(`Domain fully active on Approximated: ${order.domain}`);
    }
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

    // If Spaceship already registered the domain before the failure (i.e.
    // we crashed somewhere after step 2), disable auto-renew so we don't
    // get billed again next year for an orphaned domain. Discovered Apr 26
    // 2026: legacyodysseytest5/6.com both registered ($12.99 each) but
    // Railway addCustomDomain failed at the per-service cap, so custom_domain
    // never got written to the family — softCancelFamily then saw a null
    // custom_domain and never disabled the renewal.
    if (order && order.registered_at && order.domain) {
      try {
        await spaceshipService.setAutoRenew(order.domain, false);
        console.log(`Disabled Spaceship auto-renew on orphaned ${order.domain}`);
      } catch (renewErr) {
        console.error(`Failed to disable auto-renew on orphaned ${order.domain}:`, renewErr.message);
      }
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
