require('dotenv').config();
const axios = require('axios');
const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
});
(async () => {
  const host = process.argv[2];
  if (!host) { console.error('Usage: node scripts/cf-set-custom-origin.js <hostname>'); process.exit(1); }
  // Find the hostname id
  const { data: list } = await cf.get(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames`, { params: { hostname: host } });
  const h = (list.result || []).find(r => r.hostname === host);
  if (!h) { console.error('Not found'); process.exit(1); }
  // Patch: set custom_origin_server
  const body = { custom_origin_server: process.env.CLOUDFLARE_FALLBACK_ORIGIN };
  try {
    const { data } = await cf.patch(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${h.id}`, body);
    console.log(`PATCH succeeded — new status=${data.result.status}, custom_origin_server=${data.result.custom_origin_server}`);
    if (data.result.verification_errors) console.log('verification_errors:', data.result.verification_errors);
  } catch (e) {
    console.log(`PATCH failed: ${e.response?.status} ${JSON.stringify(e.response?.data)}`);
  }
})();
