/**
 * Helper: write only the apex A record + apex verify TXT for a domain that's
 * already had its Railway apex registered. Use when the previous repair
 * crashed at the Spaceship PUT step but Railway accepted the customDomain.
 *
 * Usage: node scripts/just-write-apex-dns.js <domain> <apex_verify_token>
 */
require('dotenv').config();
const { spaceship } = require('../src/config/spaceship');
const FASTLY = '151.101.2.15';
(async () => {
  const domain = process.argv[2];
  if (!domain) { console.error('Usage: node scripts/just-write-apex-dns.js <domain>'); process.exit(1); }
  const { data } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const items = (data.items || data.records || data || []).map(r => ({
    type: r.type, name: r.name,
    ...(r.cname ? { cname: r.cname } : {}),
    ...(r.address ? { address: r.address } : {}),
    ...(r.value ? { value: r.value } : {}),
    ttl: r.ttl || 1800,
  }));
  // strip stale apex A
  for (let i = items.length - 1; i >= 0; i--) {
    const r = items[i];
    if (r.type === 'A' && (r.name === '@' || r.name === '') && r.address !== FASTLY) items.splice(i, 1);
  }
  // ensure Fastly A
  if (!items.some(r => r.type === 'A' && (r.name === '@' || r.name === '') && r.address === FASTLY)) {
    items.push({ type: 'A', name: '@', address: FASTLY, ttl: 1800 });
  }
  console.log(`Writing ${items.length} records to ${domain}…`);
  await spaceship.put(`/dns/records/${domain}`, { force: true, items });
  console.log('Done.');
})().catch(e => { console.error(e.message); if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2)); process.exit(1); });
