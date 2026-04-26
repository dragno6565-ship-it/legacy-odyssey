require('dotenv').config();
const { spaceship } = require('../src/config/spaceship');
(async () => {
  const domain = process.argv[2] || 'eowynhoperagno.com';
  const { data } = await spaceship.get(`/dns/records/${domain}`, { params: { take: 100, skip: 0 } });
  const items = data.items || data.records || data || [];
  console.log(`Records stored at Spaceship for ${domain} (${items.length}):`);
  for (const r of items) {
    const target = r.cname || r.address || r.value || '';
    console.log(`  ${r.type}\t${r.name}\t→ ${target}`);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
