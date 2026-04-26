/**
 * Spaceship's PUT /dns/records/{domain} is non-destructive — it appends rather
 * than replacing. To actually remove records we have to DELETE them. This
 * script removes any apex A record whose address is NOT the Railway/Fastly IP.
 *
 * Usage: node scripts/delete-stale-a-records.js <domain>
 */
require('dotenv').config();
const { spaceship } = require('../src/config/spaceship');
const RAILWAY_FASTLY_IP = '151.101.2.15';

(async () => {
  const domain = process.argv[2];
  if (!domain) { console.error('Usage: node scripts/delete-stale-a-records.js <domain>'); process.exit(1); }

  const { data } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const items = data.items || data.records || data || [];
  const stale = items.filter(r => r.type === 'A' && (r.name === '@' || r.name === '') && r.address !== RAILWAY_FASTLY_IP);
  console.log(`Found ${stale.length} stale apex A record(s) on ${domain}:`);
  for (const r of stale) console.log(`  ${r.address}`);
  if (stale.length === 0) { console.log('Nothing to delete.'); return; }

  const body = stale.map(r => ({ type: r.type, name: r.name, address: r.address }));
  let resp;
  try {
    resp = await spaceship.delete(`/dns/records/${domain}`, { data: body });
  } catch (e) {
    console.warn(`Bare-array body failed (${e.message}); retrying with {items:...} wrapper…`);
    resp = await spaceship.delete(`/dns/records/${domain}`, { data: { items: body } });
  }
  console.log(`Spaceship DELETE responded ${resp.status}`);
  // Verify
  const { data: after } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const afterItems = after.items || after.records || after || [];
  const still = afterItems.filter(r => r.type === 'A' && (r.name === '@' || r.name === '') && r.address !== RAILWAY_FASTLY_IP);
  if (still.length === 0) console.log('Verified: stale records gone.');
  else { console.error(`WARNING: ${still.length} stale apex A still present:`); for (const r of still) console.error(`  ${r.address}`); }
})().catch(e => {
  console.error('FAILED:', e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
