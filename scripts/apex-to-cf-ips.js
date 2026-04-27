require('dotenv').config();
const { spaceship } = require('../src/config/spaceship');
const CF_IPS = ['104.21.27.18', '172.67.140.204'];
(async () => {
  const domain = process.argv[2];
  if (!domain) { console.error('Usage: node scripts/apex-to-cf-ips.js <domain>'); process.exit(1); }
  const { data } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const apexRecords = (data.items || []).filter(r => (r.type === 'CNAME' || r.type === 'A') && (r.name === '@' || r.name === ''));
  if (apexRecords.length > 0) {
    const body = apexRecords.map(r => {
      const out = { type: r.type, name: r.name };
      if (r.cname) out.cname = r.cname;
      if (r.address) out.address = r.address;
      return out;
    });
    console.log(`Deleting ${apexRecords.length} existing apex record(s)…`);
    const resp = await spaceship.delete(`/dns/records/${domain}`, { data: body });
    console.log(`  responded ${resp.status}`);
  }
  const newItems = CF_IPS.map(ip => ({ type: 'A', name: '@', address: ip, ttl: 1800 }));
  await spaceship.put(`/dns/records/${domain}`, { force: true, items: newItems });
  console.log(`Added apex A records → ${CF_IPS.join(', ')}`);
  const { data: after } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  console.log('All records now:');
  (after.items || []).forEach(r => console.log(`  ${r.type}\t${r.name}\t→ ${r.cname || r.address || (r.value || '').slice(0,60)}`));
})().catch(e => { console.error(e.message); if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2)); process.exit(1); });
