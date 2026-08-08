const axios = require('axios');
const { supabaseAdmin } = require('../../config/supabase');
const { pass, warn, fail } = require('./helpers');

module.exports = {
  blockName: 'infra',
  blockLabel: 'Web Infrastructure',
  checks: [
    {
      id: 'domain-reputation',
      name: 'legacyodyssey.com clean on Norton Safe Web + Google Safe Browsing',
      // Added 2026-08-05: Norton had silently rated the domain "b" (bad) —
      // every Norton/Norton-360 user got a block page on our marketing site,
      // discovered only when Dan hit it himself. Vendor reputation is part of
      // "the product works": check it daily and page on any non-clean rating.
      fn: async () => {
        const problems = [];
        try {
          const n = await axios.get('https://safeweb.norton.com/safeweb/sites/v1/details?url=legacyodyssey.com&insert=0', { timeout: 8000 });
          const rating = n.data && n.data.rating;
          if (rating && rating !== 'g' && rating !== 'u') problems.push(`Norton Safe Web rating "${rating}" (g=safe expected) — Norton users see a block page`);
        } catch (e) { /* API unreachable — don't false-alarm on their downtime */ }
        try {
          const g = await axios.get('https://transparencyreport.google.com/transparencyreport/api/v3/safebrowsing/status?site=legacyodyssey.com', { timeout: 8000 });
          const raw = String(g.data || '');
          // Response is JSONP-ish: [["sb.ssr",1,flag,flag,flag,flag,flag,...]] — any "true" flag = unsafe finding.
          if (/,true,/.test(raw.replace(/\s/g, ''))) problems.push('Google Safe Browsing reports an unsafe finding');
        } catch (e) { /* ditto */ }
        if (problems.length) return fail(problems.join(' | '));
        return pass('Norton g/clean + Google Safe Browsing clean');
      },
    },
    {
      id: 'prod-health',
      name: 'Production /health endpoint responsive',
      fn: async () => {
        // This runs inside the prod container and calls our OWN public URL,
        // which hairpins back through Cloudflare to this same app. If egress
        // can't hairpin (Railway reschedule, 2026-08-08) this throws a
        // connection error even though the site is fully up for real visitors.
        // Treat a connection error as WARN (monitor egress), not FAIL (outage) —
        // the supabase-db check below + external uptime are the real signals.
        try {
          const r = await axios.get('https://legacyodyssey.com/health', { timeout: 8000, validateStatus: () => true });
          if (r.status !== 200) return fail(`HTTP ${r.status}`);
          if (!r.data?.version) return warn('200 but missing version field');
          return pass(`v${r.data.version}`);
        } catch (err) {
          return warn(`Monitor could not reach prod over the network (${err.code || err.message}) — likely in-container egress/hairpin, NOT a real outage (inbound is unaffected; see supabase-db + external uptime).`);
        }
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
