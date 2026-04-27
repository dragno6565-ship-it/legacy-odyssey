/**
 * Cloudflare for SaaS — Custom Hostnames API wrapper.
 *
 * Replaces railwayService.addCustomDomain for new customer signups.
 * Cloudflare handles per-customer TLS termination, then Host-header
 * proxies traffic to our single Railway fallback origin
 * (CLOUDFLARE_FALLBACK_ORIGIN, e.g. "edge.legacyodyssey.com").
 *
 * The customer points their DNS (apex + www) at the same fallback origin
 * via a CNAME. Cloudflare detects ownership via HTTP challenge once the
 * domain resolves through their network, issues a Let's Encrypt cert,
 * and starts serving.
 *
 * ENV required:
 *   CLOUDFLARE_API_TOKEN       — token with Custom Hostnames + SSL + DNS edit scope
 *   CLOUDFLARE_ZONE_ID         — zone ID for legacyodyssey.com
 *   CLOUDFLARE_FALLBACK_ORIGIN — e.g. "edge.legacyodyssey.com"
 *
 * Why we ditched Railway custom domains: Pro plan caps at 20 custom
 * domains per service (confirmed by Railway support Apr 26 2026). Each
 * customer needed 2 entries (apex + www), so we were maxed at 10
 * customers. Cloudflare for SaaS includes 100 custom hostnames free,
 * with $0.10/month for each additional. Discovered Apr 26 2026.
 */
const axios = require('axios');

const API_BASE = 'https://api.cloudflare.com/client/v4';

function client() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN not configured');
  return axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

function zoneId() {
  const id = process.env.CLOUDFLARE_ZONE_ID;
  if (!id) throw new Error('CLOUDFLARE_ZONE_ID not configured');
  return id;
}

function fallbackOrigin() {
  const o = process.env.CLOUDFLARE_FALLBACK_ORIGIN;
  if (!o) throw new Error('CLOUDFLARE_FALLBACK_ORIGIN not configured');
  return o;
}

/**
 * Register a customer's hostname (e.g. "kateragno.com" or
 * "www.kateragno.com") with Cloudflare for SaaS.
 *
 * Cloudflare provisions a Let's Encrypt cert via HTTP-01 once the
 * customer's DNS points (CNAME) at our fallback origin.
 *
 * Returns { id, hostname, status, ssl_status, cnameTarget }.
 *   - cnameTarget: the value the customer's DNS CNAME should point at
 *     (always the fallback origin).
 */
async function addCustomHostname(hostname) {
  const cf = client();
  const body = {
    hostname,
    ssl: {
      method: 'http',
      type: 'dv',
      settings: { http2: 'on', min_tls_version: '1.2', tls_1_3: 'on' },
    },
  };
  const { data } = await cf.post(`/zones/${zoneId()}/custom_hostnames`, body);
  if (!data.success) {
    throw new Error(`Cloudflare addCustomHostname failed: ${JSON.stringify(data.errors)}`);
  }
  console.log(`Cloudflare custom hostname added: ${hostname} (id: ${data.result.id}, status: ${data.result.status})`);
  return {
    id: data.result.id,
    hostname: data.result.hostname,
    status: data.result.status,
    sslStatus: data.result.ssl?.status,
    cnameTarget: fallbackOrigin(),
  };
}

/**
 * Look up a custom hostname by its full hostname string.
 * Returns null if not found.
 */
async function findCustomHostname(hostname) {
  const cf = client();
  const { data } = await cf.get(`/zones/${zoneId()}/custom_hostnames`, {
    params: { hostname },
  });
  if (!data.success) {
    throw new Error(`Cloudflare findCustomHostname failed: ${JSON.stringify(data.errors)}`);
  }
  const match = (data.result || []).find((h) => h.hostname === hostname);
  return match || null;
}

/**
 * Remove a custom hostname by ID. Used during customer cancellation
 * cleanup or when migrating a domain off Cloudflare for SaaS.
 */
async function deleteCustomHostname(id) {
  const cf = client();
  const { data } = await cf.delete(`/zones/${zoneId()}/custom_hostnames/${id}`);
  if (!data.success) {
    throw new Error(`Cloudflare deleteCustomHostname failed: ${JSON.stringify(data.errors)}`);
  }
  console.log(`Cloudflare custom hostname deleted: ${id}`);
  return true;
}

/**
 * List all custom hostnames on the zone (paginated under the hood,
 * but we cap at 1,000 since the plan ceiling is 50,000 and we'll
 * never approach that).
 */
async function listCustomHostnames() {
  const cf = client();
  const all = [];
  let page = 1;
  while (true) {
    const { data } = await cf.get(`/zones/${zoneId()}/custom_hostnames`, {
      params: { page, per_page: 50 },
    });
    if (!data.success) {
      throw new Error(`Cloudflare listCustomHostnames failed: ${JSON.stringify(data.errors)}`);
    }
    all.push(...(data.result || []));
    if ((data.result || []).length < 50) break;
    page++;
    if (page > 20) break; // safety cap (1,000 hostnames)
  }
  return all;
}

/**
 * Returns the CNAME target customers should point their DNS at.
 * Used by spaceshipService.setupDns when writing the customer's
 * DNS records.
 */
function getFallbackOrigin() {
  return fallbackOrigin();
}

module.exports = {
  addCustomHostname,
  findCustomHostname,
  deleteCustomHostname,
  listCustomHostnames,
  getFallbackOrigin,
};
