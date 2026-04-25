/**
 * Wraps a cron's run function so each invocation records its lifecycle
 * to the cron_runs table. Block 7 of the health check reads this table
 * to verify each cron has fired within its expected interval.
 *
 * Usage:
 *   const tracked = withTracking('photo-backup', runPhotoBackup);
 *   cron.schedule('30 3 * * *', tracked);
 *   setTimeout(tracked, 90000);
 */
const { supabaseAdmin } = require('../config/supabase');

async function markStarted(name) {
  await supabaseAdmin
    .from('cron_runs')
    .upsert({ name, last_started_at: new Date().toISOString() }, { onConflict: 'name' });
}

async function markSuccess(name) {
  await supabaseAdmin
    .from('cron_runs')
    .update({
      last_finished_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      last_error: null,
      consecutive_failures: 0,
    })
    .eq('name', name);
}

async function markFailure(name, message) {
  // Atomically increment consecutive_failures using an RPC-style read-then-write.
  // Race conditions here are tolerable — this is observability, not correctness.
  const { data: row } = await supabaseAdmin
    .from('cron_runs')
    .select('consecutive_failures')
    .eq('name', name)
    .maybeSingle();
  const next = (row?.consecutive_failures || 0) + 1;
  await supabaseAdmin
    .from('cron_runs')
    .update({
      last_finished_at: new Date().toISOString(),
      last_error: (message || 'Unknown error').slice(0, 500),
      consecutive_failures: next,
    })
    .eq('name', name);
}

function withTracking(name, fn) {
  return async function trackedRun(...args) {
    try { await markStarted(name); } catch (e) { console.warn(`[cron-tracker] markStarted failed for ${name}:`, e.message); }
    try {
      const result = await fn(...args);
      try { await markSuccess(name); } catch (e) { console.warn(`[cron-tracker] markSuccess failed for ${name}:`, e.message); }
      return result;
    } catch (err) {
      try { await markFailure(name, err.message); } catch (e) { console.warn(`[cron-tracker] markFailure failed for ${name}:`, e.message); }
      throw err;
    }
  };
}

module.exports = { withTracking };
