/**
 * Migrate one existing customer from Cloudflare for SaaS / old Fastly+Railway
 * to Approximated.app.
 *
 * What this does:
 *   1. Create virtual hosts for `<domain>` and `www.<domain>` on Approximated
 *      (idempotent — safe to re-run).
 *   2. Read the customer's current Spaceship DNS records.
 *   3. DELETE old apex/www records (any A, CNAME, or stale Railway TXTs that
 *      conflict with the new A → cluster IP setup).
 *   4. PUT the new A records: apex + www → APPROXIMATED_CLUSTER_IP.
 *   5. Verify Spaceship state after the change.
 *   6. Print Approximated status for both hostnames.
 *
 * After this script runs, expect TLS issuance within ~60s of DNS propagation.
 *
 * Usage: node scripts/migrate-customer-to-approximated.js <domain>
 *   e.g.: node scripts/migrate-customer-to-approximated.js kateragno.com
 */
require('dotenv').config();
const { spaceship } = require('../src/config/spaceship');
const apx = require('../src/services/approximatedService');

const CLUSTER_IP = process.env.APPROXIMATED_CLUSTER_IP;
if (!CLUSTER_IP) { console.error('APPROXIMATED_CLUSTER_IP not set'); process.exit(1); }

async function main() {
  const domain = process.argv[2];
  if (!domain) { console.error('Usage: node scripts/migrate-customer-to-approximated.js <domain>'); process.exit(1); }

  console.log(`\n=== Migrating ${domain} → Approximated ===\n`);

  // 1. Register both vhosts (idempotent)
  console.log('1) Registering Approximated virtual hosts…');
  for (const host of [domain, `www.${domain}`]) {
    try {
      const r = await apx.addVirtualHost(host);
      console.log(`   • ${host} — id=${r.id}`);
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

  // 3. Identify old records to delete:
  //    - apex A records (we'll replace with our own pointing at cluster IP)
  //    - apex CNAME (Cloudflare for SaaS holdover)
  //    - www A or CNAME (replace with our A)
  //    - Stale Railway/Cloudflare TXTs (_railway-verify*, _cf-custom-hostname)
  const toDelete = items.filter((r) => {
    const isApex = r.name === '@' || r.name === '';
    if (isApex && (r.type === 'A' || r.type === 'CNAME')) return true;
    if (r.name === 'www' && (r.type === 'A' || r.type === 'CNAME')) return true;
    if (r.type === 'TXT' && /^_railway-verify/.test(r.name)) return true;
    if (r.type === 'TXT' && r.name === '_cf-custom-hostname') return true;
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
    try {
      const resp = await spaceship.delete(`/dns/records/${domain}`, { data: body });
      console.log(`   Spaceship DELETE responded ${resp.status}`);
    } catch (err) {
      // Some records (group:product locked apex A) can't be deleted via API.
      // Surface the error but keep going — the operator may need to remove
      // a Spaceship URL Redirect connection in the dashboard.
      console.warn(`   ⚠ Some records could not be deleted: ${err.response?.status} ${JSON.stringify(err.response?.data || err.message)}`);
    }
  } else {
    console.log('\n3) No old records to delete.');
  }

  // 4. Add new A records
  console.log('\n4) Writing new A records…');
  const newItems = [
    { type: 'A', name: '@',   address: CLUSTER_IP, ttl: 1800 },
    { type: 'A', name: 'www', address: CLUSTER_IP, ttl: 1800 },
  ];
  await spaceship.put(`/dns/records/${domain}`, { force: true, items: newItems });
  console.log(`   Wrote: A @ → ${CLUSTER_IP}, A www → ${CLUSTER_IP}`);

  // 5. Verify final Spaceship state
  console.log('\n5) Verifying Spaceship state after changes…');
  const { data: after } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const afterItems = after.items || [];
  console.log(`   ${afterItems.length} records now:`);
  for (const r of afterItems) {
    const t = r.cname || r.address || r.value || '';
    console.log(`     ${r.type}\t${r.name}\t→ ${(t || '').slice(0, 60)}`);
  }

  // 6. Approximated status
  console.log('\n6) Approximated status…');
  for (const host of [domain, `www.${domain}`]) {
    const s = await apx.getStatus(host);
    console.log(`   • ${host} — status=${s.status} cert=${s.hasCert} hit=${s.hasHit}`);
  }

  console.log(`\nDone. Approximated will issue TLS via Caddy On-Demand TLS as soon as DNS propagates.`);
  console.log(`Verify: curl -I https://${domain}  AND  curl -I https://www.${domain}\n`);
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
