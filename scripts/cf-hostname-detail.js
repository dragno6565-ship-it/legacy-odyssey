require('dotenv').config();
const axios = require('axios');
const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
  timeout: 10000,
});
(async () => {
  const host = process.argv[2];
  if (!host) { console.error('Usage: node scripts/cf-hostname-detail.js <hostname>'); process.exit(1); }
  const { data } = await cf.get(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames`, { params: { hostname: host } });
  const match = (data.result || []).find(h => h.hostname === host);
  if (!match) { console.error('Not found'); return; }
  console.log(JSON.stringify(match, null, 2));
})();
