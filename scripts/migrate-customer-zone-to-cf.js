/**
 * Long-term migration: move a customer domain's DNS authority from
 * Spaceship to Cloudflare. The customer's domain becomes a Cloudflare
 * zone (Free plan, unlimited zones). With Cloudflare serving the
 * zone, apex CNAME works natively (Cloudflare flattens it WITH CNAME
 * visibility, satisfying Cloudflare for SaaS apex validation).
 *
 * Steps:
 *   1. Create a Cloudflare zone for the customer's domain
 *   2. Add DNS records on the new zone:
 *      - CNAME @   → CLOUDFLARE_FALLBACK_ORIGIN (proxied)
 *      - CNAME www → CLOUDFLARE_FALLBACK_ORIGIN (proxied)
 *   3. Print the 2 Cloudflare nameservers that need to be set at the
 *      customer's registrar (Spaceship). Manual step for this script —
 *      a follow-up patches Spaceship via API once we add nameserver-
 *      update support to spaceshipService.
 *   4. Once nameservers propagate (~5min-24h), Cloudflare for SaaS
 *      apex validation will succeed and TLS issues automatically.
 *
 * The customer's existing Custom Hostnames (apex + www) on the SaaS
 * zone (legacyodyssey.com) stay as-is and pick up the new DNS once
 * propagation completes.
 *
 * Usage: node scripts/migrate-customer-zone-to-cf.js <domain>
 */
require('dotenv').config();
const axios = require('axios');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const FALLBACK_ORIGIN = process.env.CLOUDFLARE_FALLBACK_ORIGIN;

const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  timeout: 15000,
});

async function getAccountId() {
  const { data } = await cf.get('/accounts');
  if (!data.success || !data.result?.length) throw new Error('Could not list Cloudflare accounts');
  return data.result[0].id;
}

async function findOrCreateZone(domain, accountId) {
  // Check if zone exists
  const { data: list } = await cf.get('/zones', { params: { name: domain } });
  if (list.result?.length) {
    const z = list.result[0];
    console.log(`   Zone already exists: id=${z.id} status=${z.status}`);
    return z;
  }
  console.log(`   Creating zone…`);
  const { data } = await cf.post('/zones', { name: domain, account: { id: accountId }, type: 'full' });
  if (!data.success) throw new Error(`Zone create failed: ${JSON.stringify(data.errors)}`);
  console.log(`   Created zone: id=${data.result.id}`);
  return data.result;
}

async function addCname(zoneId, name, target) {
  // Check if already exists
  const { data: list } = await cf.get(`/zones/${zoneId}/dns_records`, { params: { type: 'CNAME', name: name === '@' ? null : `${name}` } });
  // Some flexibility — list all CNAMEs in zone, find ours
  const { data: all } = await cf.get(`/zones/${zoneId}/dns_records`, { params: { type: 'CNAME' } });
  const fullName = name === '@' ? null : `${name}`;
  const existing = (all.result || []).find(r => {
    if (name === '@') return r.name === r.zone_name; // apex
    return r.name.startsWith(`${name}.`) || r.name === fullName;
  });
  if (existing) {
    console.log(`   CNAME ${name} → ${existing.content} already exists (proxied=${existing.proxied})`);
    return existing;
  }
  const body = { type: 'CNAME', name, content: target, proxied: true, ttl: 1 };
  const { data } = await cf.post(`/zones/${zoneId}/dns_records`, body);
  if (!data.success) throw new Error(`DNS add ${name} failed: ${JSON.stringify(data.errors)}`);
  console.log(`   Added CNAME ${name} → ${target} (proxied)`);
  return data.result;
}

(async () => {
  const domain = process.argv[2];
  if (!domain) { console.error('Usage: node scripts/migrate-customer-zone-to-cf.js <domain>'); process.exit(1); }
  if (!TOKEN || !FALLBACK_ORIGIN) { console.error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_FALLBACK_ORIGIN'); process.exit(1); }

  console.log(`\n=== Adding ${domain} as a Cloudflare zone ===\n`);

  console.log('1) Looking up Cloudflare account…');
  const accountId = await getAccountId();
  console.log(`   account=${accountId}`);

  console.log(`\n2) Finding or creating zone for ${domain}…`);
  const zone = await findOrCreateZone(domain, accountId);

  console.log(`\n3) Adding DNS records to zone…`);
  await addCname(zone.id, '@', FALLBACK_ORIGIN);
  await addCname(zone.id, 'www', FALLBACK_ORIGIN);

  console.log(`\n4) Cloudflare nameservers for this zone:`);
  const nameservers = zone.name_servers || [];
  if (nameservers.length === 0) {
    // Re-fetch zone to get nameservers
    const { data } = await cf.get(`/zones/${zone.id}`);
    nameservers.push(...(data.result.name_servers || []));
  }
  for (const ns of nameservers) console.log(`   • ${ns}`);

  console.log(`\nNEXT STEP — change nameservers at Spaceship for ${domain}:`);
  console.log(`  Spaceship → Domain Manager → ${domain} → Nameservers & DNS → Change → Custom nameservers`);
  console.log(`  Set the two nameservers above.`);
  console.log(`\nPropagation typically completes in 5min–24h. After that:`);
  console.log(`  - ${domain} apex will serve through Cloudflare for SaaS`);
  console.log(`  - Cloudflare's CNAME-to-zone validation passes (zone serves real CNAME at apex)`);
  console.log(`  - TLS cert issues automatically via HTTP-01\n`);
})().catch(e => {
  console.error('FAILED:', e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
