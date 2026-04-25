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
      name: 'Zombie Railway service offline',
      fn: async () => {
        try {
          const r = await axios.get('https://legacy-odyssey-production-a9d1.up.railway.app/health',
            { timeout: 5000, validateStatus: () => true });
          if (r.status === 200) return warn(`Zombie still alive at v${r.data?.version || '?'} (delete via Railway dashboard once mobile v1.0.5+ has propagated)`);
          return pass(`Returns ${r.status}`);
        } catch (err) {
          // Connection refused / DNS not found = service is gone, which is what we want
          return pass('Unreachable (good — service deleted)');
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
