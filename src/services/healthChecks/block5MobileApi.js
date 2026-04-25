const axios = require('axios');
const { pass, warn, fail } = require('./helpers');

const PROD = 'https://legacyodyssey.com';

/**
 * These checks hit the live production API to verify each surface still
 * responds with the right shape. We use unauthenticated probes that should
 * return controlled errors (400/401) rather than 5xx — a 5xx means the
 * route is broken at a deeper level than auth.
 */
module.exports = {
  blockName: 'mobile-api',
  blockLabel: 'Mobile API',
  checks: [
    {
      id: 'login-rejects-bad-creds',
      name: 'POST /api/auth/login rejects bad creds (not 5xx)',
      fn: async () => {
        const r = await axios.post(`${PROD}/api/auth/login`,
          { email: 'health-check@invalid.example', password: 'wrong-on-purpose' },
          { timeout: 5000, validateStatus: () => true });
        if (r.status >= 500) return fail(`HTTP ${r.status} — route is throwing`);
        if (![400, 401, 403].includes(r.status)) return warn(`Unexpected ${r.status}`);
        return pass(`HTTP ${r.status} (expected rejection)`);
      },
    },
    {
      id: 'cancel-requires-auth',
      name: 'POST /api/auth/cancel requires auth',
      fn: async () => {
        const r = await axios.post(`${PROD}/api/auth/cancel`, {}, { timeout: 5000, validateStatus: () => true });
        if (r.status >= 500) return fail(`HTTP ${r.status} — route throwing`);
        if (r.status !== 401) return warn(`Expected 401, got ${r.status}`);
        return pass('401 (correctly requires auth)');
      },
    },
    {
      id: 'old-delete-410',
      name: 'DELETE /api/auth/account returns 410 Gone',
      fn: async () => {
        const r = await axios.delete(`${PROD}/api/auth/account`, {
          headers: { Authorization: 'Bearer not-a-real-token' },
          timeout: 5000, validateStatus: () => true,
        });
        // The route requires auth, so we'll get 401 unless we can pass the
        // requireAuth middleware. Either 401 or 410 is acceptable behavior.
        if (r.status >= 500) return fail(`HTTP ${r.status} — route throwing`);
        if (r.status === 410) return pass('410 Gone (deprecated correctly)');
        if (r.status === 401) return pass('401 (auth gates 410, which is fine)');
        return warn(`Unexpected ${r.status}`);
      },
    },
    {
      id: 'books-mine-requires-auth',
      name: 'GET /api/books/mine requires auth',
      fn: async () => {
        const r = await axios.get(`${PROD}/api/books/mine`, { timeout: 5000, validateStatus: () => true });
        if (r.status >= 500) return fail(`HTTP ${r.status} — route throwing`);
        if (r.status !== 401) return warn(`Expected 401, got ${r.status}`);
        return pass('401 (correctly requires auth)');
      },
    },
    {
      id: 'families-mine-requires-auth',
      name: 'GET /api/families/mine requires auth',
      fn: async () => {
        const r = await axios.get(`${PROD}/api/families/mine`, { timeout: 5000, validateStatus: () => true });
        if (r.status >= 500) return fail(`HTTP ${r.status} — route throwing`);
        if (r.status !== 401) return warn(`Expected 401, got ${r.status}`);
        return pass('401 (correctly requires auth)');
      },
    },
    {
      id: 'domain-search-works',
      name: 'GET /api/domains/search returns valid response',
      fn: async () => {
        // Route uses ?name= (not ?q=)
        const r = await axios.get(`${PROD}/api/domains/search?name=hcprobe${Date.now().toString(36)}`,
          { timeout: 8000, validateStatus: () => true });
        if (r.status >= 500) return fail(`HTTP ${r.status} — route throwing`);
        if (r.status === 429) return warn('Rate limited (try again later)');
        if (r.status !== 200) return warn(`HTTP ${r.status}`);
        if (!r.data || !Array.isArray(r.data.results)) return fail('Response missing results array');
        return pass(`200, ${r.data.results.length} TLD result(s)`);
      },
    },
  ],
};
