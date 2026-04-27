require('dotenv').config();
const axios = require('axios');
const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
});
(async () => {
  // Find Roy's zone
  const { data: zones } = await cf.get('/zones', { params: { name: 'roypatrickthompson.com' } });
  if (!zones.success || !zones.result?.length) {
    console.error('Token cannot list this zone:', JSON.stringify(zones.errors || zones));
    process.exit(1);
  }
  const zone = zones.result[0];
  console.log(`Roy's zone id=${zone.id}, status=${zone.status}`);

  // List existing DNS records
  const { data: list } = await cf.get(`/zones/${zone.id}/dns_records`);
  if (!list.success) { console.error('Cannot list DNS:', JSON.stringify(list.errors)); process.exit(1); }
  console.log(`\nExisting records: ${list.result.length}`);
  for (const r of list.result) console.log(`  ${r.type}\t${r.name}\t${r.content}\tproxied=${r.proxied}`);

  // Delete the 2 apex A records and the _cf-custom-hostname TXT
  for (const r of list.result) {
    if (r.type === 'A' && r.name === 'roypatrickthompson.com') {
      await cf.delete(`/zones/${zone.id}/dns_records/${r.id}`);
      console.log(`  ✓ Deleted ${r.type} ${r.name} → ${r.content}`);
    }
    if (r.type === 'TXT' && r.name === '_cf-custom-hostname.roypatrickthompson.com') {
      await cf.delete(`/zones/${zone.id}/dns_records/${r.id}`);
      console.log(`  ✓ Deleted ${r.type} ${r.name}`);
    }
  }

  // Add CNAME @ → edge.legacyodyssey.com (proxied)
  const body = { type: 'CNAME', name: '@', content: process.env.CLOUDFLARE_FALLBACK_ORIGIN, proxied: true, ttl: 1 };
  const { data: add } = await cf.post(`/zones/${zone.id}/dns_records`, body);
  if (!add.success) { console.error('CNAME add failed:', JSON.stringify(add.errors)); process.exit(1); }
  console.log(`\n  ✓ Added CNAME @ → ${process.env.CLOUDFLARE_FALLBACK_ORIGIN} (proxied)`);

  // Final state
  const { data: final } = await cf.get(`/zones/${zone.id}/dns_records`);
  console.log(`\nFinal records: ${final.result.length}`);
  for (const r of final.result) console.log(`  ${r.type}\t${r.name}\t${r.content}\tproxied=${r.proxied}`);
})().catch(e => { console.error(e.message); if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2)); process.exit(1); });
