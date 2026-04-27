require('dotenv').config();
const axios = require('axios');
const { spaceship } = require('../src/config/spaceship');
const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
});
(async () => {
  const domain = process.argv[2];
  if (!domain) { console.error('Usage: node scripts/add-cf-ownership-txt.js <domain>'); process.exit(1); }
  // Get the apex hostname's ownership_verification details
  const { data } = await cf.get(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames`, { params: { hostname: domain } });
  const h = (data.result || []).find(r => r.hostname === domain);
  if (!h) { console.error(`No CF custom hostname for ${domain}`); process.exit(1); }
  const ov = h.ownership_verification;
  if (!ov || ov.type !== 'txt') { console.error('No TXT ownership verification offered'); process.exit(1); }
  // ov.name comes back as full FQDN (e.g. _cf-custom-hostname.roypatrickthompson.com)
  // Spaceship wants just the host part (relative to the zone)
  const relName = ov.name.endsWith('.' + domain) ? ov.name.slice(0, -(domain.length + 1)) : ov.name;
  console.log(`Adding TXT ${relName} = ${ov.value} to ${domain}`);
  await spaceship.put(`/dns/records/${domain}`, {
    force: true,
    items: [{ type: 'TXT', name: relName, value: ov.value, ttl: 1800 }],
  });
  console.log('Done. Cloudflare typically picks up within 1-2 min.');
})().catch(e => {
  console.error(e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
