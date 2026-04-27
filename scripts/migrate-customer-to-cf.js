/**
 * Migrate one existing customer from the old Fastly+Railway routing path to
 * Cloudflare for SaaS.
 *
 * Steps:
 *   1. Add `<domain>` and `www.<domain>` as Custom Hostnames on Cloudflare
 *   2. Read existing Spaceship DNS records
 *   3. DELETE the old apex A, www CNAME, and Railway verify TXTs
 *   4. PUT the new CNAME @  → CLOUDFLARE_FALLBACK_ORIGIN and CNAME www → same
 *   5. Print Cloudflare's view + a curl-ready check
 *
 * Safe to re-run — addCustomHostname is idempotent (returns existing if found).
 *
 * Usage: node scripts/migrate-customer-to-cf.js <domain>
 *   e.g.: node scripts/migrate-customer-to-cf.js roypatrickthompson.com
 */
require('dotenv').config();
const { spaceship } = require('../src/config/spaceship');
const cloudflareService = require('../src/services/cloudflareService');

const FALLBACK_ORIGIN = process.env.CLOUDFLARE_FALLBACK_ORIGIN;
if (!FALLBACK_ORIGIN) { console.error('CLOUDFLARE_FALLBACK_ORIGIN not set'); process.exit(1); }

async function main() {
  const domain = process.argv[2];
  if (!domain) { console.error('Usage: node scripts/migrate-customer-to-cf.js <domain>'); process.exit(1); }

  console.log(`\n=== Migrating ${domain} → Cloudflare for SaaS ===\n`);

  // 1. Register both hostnames on Cloudflare (apex + www)
  console.log('1) Registering Custom Hostnames on Cloudflare…');
  for (const host of [domain, `www.${domain}`]) {
    try {
      const existing = await cloudflareService.findCustomHostname(host);
      if (existing) {
        console.log(`   • ${host} — already exists (id=${existing.id} status=${existing.status})`);
      } else {
        const r = await cloudflareService.addCustomHostname(host);
        console.log(`   • ${host} — added (id=${r.id} status=${r.status})`);
      }
    } catch (err) {
      console.error(`   ✗ ${host} — ${err.message}`);
      throw err;
    }
  }

  // 2. Read current Spaceship records
  console.log('\n2) Reading current Spaceship records…');
  const { data } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const items = data.items || [];
  console.log(`   ${items.length} records currently:`);
  for (const r of items) {
    const t = r.cname || r.address || r.value || '';
    console.log(`     ${r.type}\t${r.name}\t→ ${(t || '').slice(0, 60)}`);
  }

  // 3. Identify old records to delete (apex A, www CNAME, Railway verify TXTs)
  const toDelete = items.filter((r) => {
    if (r.type === 'A' && (r.name === '@' || r.name === '')) return true;
    if (r.type === 'CNAME' && r.name === 'www') return true;
    if (r.type === 'TXT' && r.name === '_railway-verify') return true;
    if (r.type === 'TXT' && r.name === '_railway-verify.www') return true;
    return false;
  });

  if (toDelete.length > 0) {
    console.log(`\n3) Deleting ${toDelete.length} old record(s)…`);
    const body = toDelete.map((r) => {
      const out = { type: r.type, name: r.name };
      if (r.address) out.address = r.address;
      if (r.cname) out.cname = r.cname;
      if (r.value) out.value = r.value;
      return out;
    });
    const resp = await spaceship.delete(`/dns/records/${domain}`, { data: body });
    console.log(`   Spaceship DELETE responded ${resp.status}`);
  } else {
    console.log('\n3) No old records to delete.');
  }

  // 4. Add new records: apex + www CNAME, plus the apex ownership TXT.
  // Why the TXT: Cloudflare verifies hostname ownership by checking that
  // the record CNAMEs to the SaaS zone. CNAME-at-apex is RFC-illegal —
  // Spaceship flattens it to A, so Cloudflare's verifier sees A records
  // (not a CNAME) and rejects with "custom hostname does not CNAME to
  // this zone." Fallback: add the TXT _cf-custom-hostname record they
  // give us in the Custom Hostname response. The www subdomain has a
  // legal CNAME so it doesn't need this. Discovered Apr 27 2026 with
  // roypatrickthompson.com.
  const apexHost = await cloudflareService.findCustomHostname(domain);
  const ov = apexHost?.ownership_verification;
  console.log('\n4) Adding new DNS records…');
  const newItems = [
    { type: 'CNAME', name: '@',   cname: FALLBACK_ORIGIN, ttl: 1800 },
    { type: 'CNAME', name: 'www', cname: FALLBACK_ORIGIN, ttl: 1800 },
  ];
  if (ov && ov.type === 'txt') {
    const relName = ov.name.endsWith('.' + domain) ? ov.name.slice(0, -(domain.length + 1)) : ov.name;
    newItems.push({ type: 'TXT', name: relName, value: ov.value, ttl: 1800 });
    console.log(`   Adding apex ownership TXT: ${relName} = ${ov.value.slice(0, 12)}…`);
  } else {
    console.warn('   ⚠ No ownership_verification TXT found — apex may fail validation');
  }
  await spaceship.put(`/dns/records/${domain}`, { force: true, items: newItems });
  console.log(`   Wrote: CNAME @ → ${FALLBACK_ORIGIN}, CNAME www → ${FALLBACK_ORIGIN}${ov ? ', TXT _cf-custom-hostname (apex ownership)' : ''}`);

  // 5. Verify final Spaceship state
  console.log('\n5) Verifying Spaceship state after changes…');
  const { data: after } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const afterItems = after.items || [];
  console.log(`   ${afterItems.length} records now:`);
  for (const r of afterItems) {
    const t = r.cname || r.address || r.value || '';
    console.log(`     ${r.type}\t${r.name}\t→ ${(t || '').slice(0, 60)}`);
  }

  // 6. Cloudflare hostname status
  console.log('\n6) Cloudflare Custom Hostname status…');
  for (const host of [domain, `www.${domain}`]) {
    const h = await cloudflareService.findCustomHostname(host);
    if (h) {
      console.log(`   • ${host} — status=${h.status} ssl=${h.ssl?.status} validation=${h.ssl?.validation_records?.[0]?.status || h.ssl?.method || 'n/a'}`);
    }
  }

  console.log(`\nDone. Cloudflare will issue Let's Encrypt cert via HTTP-01 once DNS propagates.`);
  console.log(`Verify: curl -I https://${domain}  AND  curl -I https://www.${domain}\n`);
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
