/**
 * Approximated.app — Custom domains + auto TLS for SaaS.
 *
 * Replaces cloudflareService.js (which replaced railwayService).
 *
 * One API call per customer hostname creates a "virtual host" on our
 * dedicated proxy cluster. The customer points their DNS A record at
 * our cluster IP (APPROXIMATED_CLUSTER_IP). Approximated terminates
 * TLS via Caddy On-Demand TLS / Let's Encrypt and proxies the request
 * to our origin (legacyodyssey.com:443) preserving the Host header.
 *
 * No zone creation, no per-permission token juggling, no fallback origin.
 * Just: register virtual host → set DNS A record → done.
 *
 * ENV required:
 *   APPROXIMATED_API_KEY     — per-cluster API key from cloud.approximated.app
 *   APPROXIMATED_CLUSTER_IP  — IPv4 customers' A records point at (e.g. 137.66.1.199)
 *
 * Optional:
 *   APPROXIMATED_TARGET      — origin we proxy to (default: 'legacyodyssey.com')
 *   APPROXIMATED_TARGET_PORT — origin port (default: '443')
 *
 * Why we ditched Cloudflare for SaaS: their custom token UI doesn't
 * expose the Account-level Zone:Edit permission needed to create
 * per-customer zones programmatically. Tenants API requires Enterprise.
 * Approximated solves the same problem with one API key and zero
 * permission politics — built for exactly this use case. Discovered
 * Apr 27 2026.
 */
const axios = require('axios');

const API_BASE = 'https://cloud.approximated.app/api';

function client() {
  const key = process.env.APPROXIMATED_API_KEY;
  if (!key) throw new Error('APPROXIMATED_API_KEY not configured');
  return axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

function clusterIp() {
  const ip = process.env.APPROXIMATED_CLUSTER_IP;
  if (!ip) throw new Error('APPROXIMATED_CLUSTER_IP not configured');
  return ip;
}

function targetAddress() {
  return process.env.APPROXIMATED_TARGET || 'legacyodyssey.com';
}

function targetPort() {
  return process.env.APPROXIMATED_TARGET_PORT || '443';
}

/**
 * Register a customer's hostname (apex or www) on Approximated.
 * Idempotent — if a virtual host already exists for this incoming
 * address, returns the existing one instead of erroring.
 *
 * Returns { id, hostname, target, clusterIp, userMessage }.
 */
async function addVirtualHost(hostname) {
  const apx = client();
  // Check first — Approximated POST is not idempotent and 422s on dupes.
  const existing = await findVirtualHost(hostname);
  if (existing) {
    console.log(`Approximated virtual host already exists: ${hostname} (id: ${existing.id})`);
    return {
      id: existing.id,
      hostname: existing.incoming_address,
      target: existing.target_address,
      clusterIp: clusterIp(),
      userMessage: existing.user_message,
    };
  }
  const body = {
    incoming_address: hostname,
    target_address: targetAddress(),
    target_ports: targetPort(),
  };
  let data;
  try {
    ({ data } = await apx.post('/vhosts', body));
  } catch (err) {
    const errBody = err.response?.data;
    throw new Error(`Approximated addVirtualHost failed for ${hostname}: ${JSON.stringify(errBody || err.message)}`);
  }
  console.log(`Approximated virtual host added: ${hostname} (id: ${data.data.id})`);
  return {
    id: data.data.id,
    hostname: data.data.incoming_address,
    target: data.data.target_address,
    clusterIp: clusterIp(),
    userMessage: data.data.user_message,
  };
}

/**
 * Look up a virtual host by its incoming hostname.
 * Returns the raw vhost object, or null if not found.
 */
async function findVirtualHost(hostname) {
  const apx = client();
  try {
    const { data } = await apx.get(`/vhosts/by/incoming/${encodeURIComponent(hostname)}`);
    return data.data || null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw new Error(`Approximated findVirtualHost failed for ${hostname}: ${JSON.stringify(err.response?.data || err.message)}`);
  }
}

/**
 * Delete a virtual host by numeric id (returned from addVirtualHost
 * or findVirtualHost). Used during customer cancellation cleanup.
 */
async function deleteVirtualHost(id) {
  const apx = client();
  try {
    await apx.delete(`/vhosts/${id}`);
  } catch (err) {
    throw new Error(`Approximated deleteVirtualHost failed for id ${id}: ${JSON.stringify(err.response?.data || err.message)}`);
  }
  console.log(`Approximated virtual host deleted: ${id}`);
  return true;
}

/**
 * Delete by hostname (convenience — looks up id first).
 */
async function deleteVirtualHostByHostname(hostname) {
  const existing = await findVirtualHost(hostname);
  if (!existing) {
    console.log(`Approximated virtual host not found for delete: ${hostname}`);
    return false;
  }
  return deleteVirtualHost(existing.id);
}

/**
 * Health check for a single virtual host. Returns:
 *   { id, hostname, status, hasCert, hasHit, raw }
 *
 * Status meanings (from Approximated docs):
 *   - apx_hit: requests are reaching the cluster (DNS is working)
 *   - has_ssl: a valid TLS cert is provisioned
 *   - dns_pointing_at: customer's DNS A record matches our cluster IP
 */
async function getStatus(hostname) {
  const v = await findVirtualHost(hostname);
  if (!v) return { id: null, hostname, status: 'not_found', hasCert: false, hasHit: false };
  return {
    id: v.id,
    hostname: v.incoming_address,
    status: v.has_ssl ? 'serving' : (v.apx_hit ? 'cert_pending' : 'dns_pending'),
    hasCert: !!v.has_ssl,
    hasHit: !!v.apx_hit,
    raw: v,
  };
}

/**
 * The IP customers' DNS A records should point at.
 * Used by spaceshipService.setupDns.
 */
function getClusterIp() {
  return clusterIp();
}

module.exports = {
  addVirtualHost,
  findVirtualHost,
  deleteVirtualHost,
  deleteVirtualHostByHostname,
  getStatus,
  getClusterIp,
};
