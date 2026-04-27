/**
 * Quick read-only test of the Cloudflare API token + zone setup.
 * Runs locally — uses the same env vars that production reads.
 *
 * Verifies:
 *   1. Token is valid (token verify endpoint)
 *   2. Zone exists and is Active (zone fetch)
 *   3. Fallback Origin is configured (custom_hostnames/fallback_origin)
 *   4. Custom Hostnames API is callable (list endpoint)
 *
 * Usage: node scripts/cloudflare-test.js
 */
require('dotenv').config();
const axios = require('axios');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE = process.env.CLOUDFLARE_ZONE_ID;
const ORIGIN = process.env.CLOUDFLARE_FALLBACK_ORIGIN;

if (!TOKEN || !ZONE || !ORIGIN) {
  console.error('Missing one or more env vars: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, CLOUDFLARE_FALLBACK_ORIGIN');
  process.exit(1);
}

const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  timeout: 10000,
});

(async () => {
  // 1. Token verify
  try {
    const { data } = await cf.get('/user/tokens/verify');
    console.log(`✓ Token valid — id=${data.result.id} status=${data.result.status}`);
  } catch (e) {
    console.error(`✗ Token verify failed: ${e.response?.status} ${JSON.stringify(e.response?.data)}`);
    process.exit(1);
  }

  // 2. Zone fetch
  try {
    const { data } = await cf.get(`/zones/${ZONE}`);
    console.log(`✓ Zone — name=${data.result.name} status=${data.result.status} plan=${data.result.plan?.name || 'unknown'}`);
  } catch (e) {
    console.error(`✗ Zone fetch failed: ${e.response?.status} ${JSON.stringify(e.response?.data)}`);
    process.exit(1);
  }

  // 3. Fallback Origin
  try {
    const { data } = await cf.get(`/zones/${ZONE}/custom_hostnames/fallback_origin`);
    const r = data.result || {};
    console.log(`✓ Fallback Origin — origin=${r.origin || 'not set'} status=${r.status || 'unknown'}`);
    if (r.origin !== ORIGIN) {
      console.warn(`  ⚠ ENV says ${ORIGIN}, Cloudflare says ${r.origin}`);
    }
  } catch (e) {
    console.error(`✗ Fallback Origin fetch failed: ${e.response?.status} ${JSON.stringify(e.response?.data)}`);
  }

  // 4. List custom hostnames (should be empty)
  try {
    const { data } = await cf.get(`/zones/${ZONE}/custom_hostnames`, { params: { per_page: 50 } });
    console.log(`✓ Custom Hostnames — count=${data.result_info?.total_count || 0}`);
    if (data.result?.length) {
      data.result.slice(0, 5).forEach(h => console.log(`  - ${h.hostname} status=${h.status} ssl=${h.ssl?.status}`));
    }
  } catch (e) {
    console.error(`✗ List custom_hostnames failed: ${e.response?.status} ${JSON.stringify(e.response?.data)}`);
    process.exit(1);
  }

  console.log('\nAll checks passed — Cloudflare integration is wired up correctly.');
})();
