const { supabaseAdmin } = require('../../config/supabase');
const { pass, warn, fail } = require('./helpers');

/**
 * Cron jobs each have an expected max-interval. If a cron's last finish
 * is older than expected, alert. Each cron's run lifecycle is recorded
 * in cron_runs (see src/services/cronTracker.js).
 */
const CRONS = [
  { name: 'onboarding-emails',  label: 'Onboarding emails',     maxIntervalHours: 25 },
  { name: 'domain-order-alerts',label: 'Domain-order alerts',   maxIntervalHours: 25 },
  { name: 'photo-backup',       label: 'Photo backup → R2',     maxIntervalHours: 26 },
  { name: 'site-live-detect',   label: 'Site-live detect',      maxIntervalHours: 0.25 }, // 15 min
  { name: 'health-check',       label: 'Daily health check',    maxIntervalHours: 25 },
];

async function loadAllRuns() {
  const { data, error } = await supabaseAdmin.from('cron_runs').select('*');
  if (error) throw new Error(`cron_runs query failed: ${error.message}`);
  const byName = {};
  for (const row of (data || [])) byName[row.name] = row;
  return byName;
}

function makeFreshnessCheck(cronDef) {
  return {
    id: `cron-fresh-${cronDef.name}`,
    name: `${cronDef.label} ran within ${cronDef.maxIntervalHours}h`,
    fn: async () => {
      const runs = await loadAllRuns();
      const row = runs[cronDef.name];
      if (!row) return warn('Never recorded a run yet (server may have just started)');
      if (!row.last_finished_at && !row.last_started_at) return warn('No run completed yet');
      const last = row.last_finished_at || row.last_started_at;
      const ageHours = (Date.now() - new Date(last).getTime()) / 1000 / 60 / 60;
      if (ageHours > cronDef.maxIntervalHours) {
        return fail(`Last run ${ageHours.toFixed(1)}h ago (expected ≤ ${cronDef.maxIntervalHours}h)`);
      }
      return pass(`Last run ${ageHours < 1 ? Math.round(ageHours * 60) + 'm' : ageHours.toFixed(1) + 'h'} ago`);
    },
  };
}

function makeNoFailuresCheck(cronDef) {
  return {
    id: `cron-noerr-${cronDef.name}`,
    name: `${cronDef.label} not failing repeatedly`,
    fn: async () => {
      const runs = await loadAllRuns();
      const row = runs[cronDef.name];
      if (!row) return pass('No data yet');
      const failures = Number(row.consecutive_failures || 0);
      if (failures === 0) return pass('No consecutive failures');
      if (failures === 1) return warn(`1 recent failure: ${(row.last_error || '').slice(0, 100)}`);
      return fail(`${failures} consecutive failures — latest: ${(row.last_error || '').slice(0, 200)}`);
    },
  };
}

module.exports = {
  blockName: 'crons',
  blockLabel: 'Cron Jobs',
  checks: [
    ...CRONS.map(makeFreshnessCheck),
    ...CRONS.map(makeNoFailuresCheck),
  ],
};
