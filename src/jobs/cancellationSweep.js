const cron = require('node-cron');

/**
 * Cancellation sweep: takes websites offline when a scheduled cancellation
 * comes due.
 *
 * Cancelling keeps the website live until the end of the paid period (Terms
 * section 4); subscriptionService.softCancelFamily records that date in
 * families.cancel_effective_at. Stripe families are archived by the
 * customer.subscription.deleted webhook at period end. This job:
 *   - archives no-subscription families (admin comps with a trial end date),
 *     which no webhook will ever fire for;
 *   - is the safety net for Stripe families whose deleted webhook was missed
 *     (archived only once Stripe confirms the subscription has ended; a
 *     resumed subscription clears the pending cancellation instead).
 *
 * Inert (logs and returns) until migration 036 adds cancel_effective_at.
 */
async function runCancellationSweep() {
  const subscriptionService = require('../services/subscriptionService');
  const r = await subscriptionService.archiveDueCancellations();
  if (r.checked || r.error) console.log(`[cancellation-sweep] checked=${r.checked} archived=${r.archived}${r.error ? ` error=${r.error}` : ''}`);
  return r;
}

function startCancellationSweepScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('cancellation-sweep', runCancellationSweep);
  // Hourly at :23 (offset from the other hourly jobs).
  cron.schedule('23 * * * *', tracked);
  console.log('[cancellation-sweep] Scheduler started: runs hourly at :23');
}

module.exports = { startCancellationSweepScheduler, runCancellationSweep };
