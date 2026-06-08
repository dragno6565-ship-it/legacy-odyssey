const axios = require('axios');
const { supabaseAdmin } = require('../../config/supabase');
const { pass, warn, fail } = require('./helpers');

module.exports = {
  blockName: 'infra',
  blockLabel: 'Web Infrastructure',
  checks: [
    {
      id: 'prod-health',
      name: 'Production /health endpoint responsive',
      fn: async () => {
        const r = await axios.get('https://legacyodyssey.com/health', { timeout: 5000, validateStatus: () => true });
        if (r.status !== 200) return fail(`HTTP ${r.status}`);
        if (!r.data?.version) return warn('200 but missing version field');
        return pass(`v${r.data.version}`);
      },
    },
    {
      id: 'zombie-railway',
      name: 'Legacy zombie service (informational — non-blocking)',
      fn: async () => {
        // The old legacy-odyssey-production-a9d1 service is BENIGN: nothing in the
        // traffic path uses it (mobile BASE_URL → legacyodyssey.com since v1.0.5; we're
        // on 1.0.17). It lives in a separate Railway account Dan is decommissioning, and
        // teardown is async. Per Dan (2026-06-08) this must NOT warn anymore — report it
        // as PASS either way so it stops nagging the health dashboard.
        try {
          const r = await axios.get('https://legacy-odyssey-production-a9d1.up.railway.app/health',
            { timeout: 5000, validateStatus: () => true });
          if (r.status === 200) return pass(`Old instance still up at v${r.data?.version || '?'} — harmless (not in traffic path; being decommissioned)`);
          return pass(`Returns ${r.status} — effectively gone`);
        } catch (err) {
          return pass('Unreachable — gone (good)');
        }
      },
    },
    {
      id: 'supabase-db',
      name: 'Supabase Postgres reachable',
      fn: async () => {
        const { error, count } = await supabaseAdmin.from('families').select('id', { count: 'exact', head: true });
        if (error) return fail(`Query failed: ${error.message}`);
        return pass(`${count} families row(s)`);
      },
    },
    {
      id: 'supabase-storage',
      name: 'Supabase Storage reachable',
      fn: async () => {
        const { data, error } = await supabaseAdmin.storage.from('photos').list('', { limit: 1 });
        if (error) return fail(`List failed: ${error.message}`);
        return pass('photos bucket listable');
      },
    },
  ],
};
