/**
 * Subscription lifecycle orchestration.
 *
 * Single source of truth for cancel / un-cancel / promotion across all
 * surfaces (admin panel, web dashboard, mobile API, Stripe webhooks).
 *
 * Key principles:
 *   - Soft cancel always uses cancel_at_period_end (never charges or refunds).
 *   - Customer is NEVER charged during a cancellation action.
 *   - "Primary" family = the one whose Stripe subscription uses one of the
 *     primary price IDs (STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL /
 *     STRIPE_PRICE_ANNUAL_INTRO). Additional sites are billed at the same
 *     annual-intro rate ($29 first year → $49.99/year).
 *   - Promotion of a secondary to primary uses Stripe Subscription Schedules
 *     so the higher rate doesn't kick in until the retiring primary's
 *     period_end (no overlap, no double-billing).
 */
const { supabaseAdmin } = require('../config/supabase');
const { stripe } = require('../config/stripe');
const familyService = require('./familyService');
const stripeService = require('./stripeService');
const spaceshipService = require('./spaceshipService');
const emailService = require('./emailService');

const PRIMARY_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_MONTHLY,
  process.env.STRIPE_PRICE_ANNUAL,
  process.env.STRIPE_PRICE_ANNUAL_INTRO,
].filter(Boolean));

/**
 * Determine whether a family's subscription is on a primary price.
 * Returns null if we can't tell (no Stripe sub on file).
 */
async function isPrimaryFamily(family) {
  if (!stripe || !family?.stripe_subscription_id) return null;
  try {
    const sub = await stripe.subscriptions.retrieve(family.stripe_subscription_id, { expand: ['items.data.price'] });
    const priceId = sub.items.data[0]?.price?.id;
    if (!priceId) return null;
    return PRIMARY_PRICE_IDS.has(priceId);
  } catch (err) {
    console.error(`isPrimaryFamily: stripe error for sub ${family.stripe_subscription_id}:`, err.message);
    return null;
  }
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Update a families row. If the database does not have the cancel_effective_at
 * column yet (migration 036 not applied), retry without it so a cancellation is
 * never lost: the Stripe-side cancel and the end-of-period archive still work,
 * only the "stays live until" date is missing from the dashboard.
 */
async function writeFamily(familyId, updates) {
  let { error } = await supabaseAdmin.from('families').update(updates).eq('id', familyId);
  if (error && 'cancel_effective_at' in updates && /cancel_effective_at/.test(error.message || '')) {
    console.error('[subscription] families.cancel_effective_at missing: apply migration 036. Retrying without it.');
    const rest = { ...updates };
    delete rest.cancel_effective_at;
    ({ error } = await supabaseAdmin.from('families').update(rest).eq('id', familyId));
  }
  if (error) throw new Error(`families update failed: ${error.message}`);
}

function futureDate(iso, now = new Date()) {
  if (!iso) return null;
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.getTime() > now.getTime() + 60 * 1000 ? d : null;
}

/** Prepaid Entire Childhood plan: no Stripe subscription, nothing renews. */
function isPrepaidChildhood(family) {
  return !!(family && family.billing_period === 'childhood' && !family.stripe_subscription_id);
}

/** True when the family has asked to cancel but its paid period has not ended yet. */
function isPendingCancel(family) {
  return !!(family && !family.archived_at && family.cancel_effective_at);
}

/**
 * Soft-cancel a single family.
 *
 * Terms of Service section 4: "Cancelling stops future renewals; you keep full
 * access through the end of the period you have already paid for." So this does
 * NOT take the website down. It:
 *
 *  - Cancels the Stripe subscription at period end (no charge, no refund)
 *  - Disables Spaceship auto-renew on the family's custom domain (if any)
 *  - Records cancelled_at + cancel_effective_at (= end of the paid period) and
 *    leaves subscription_status / archived_at alone, so the website stays live
 *  - Sends the cancellation email naming the date access ends
 *
 * The website is archived (suspended) later, when the period really ends:
 *   - Stripe families: the customer.subscription.deleted webhook -> archiveFamily
 *   - No-subscription families (admin comps with a trial end date): the hourly
 *     jobs/cancellationSweep.js
 * If there is no paid period left (subscription already ended, comp with no
 * future end date) the family is archived immediately, as before.
 *
 * Entire Childhood plans (prepaid 18 years, no subscription) have nothing to
 * cancel: customer sources get { canceled:false, reason:'prepaid' } and the
 * site is untouched. Only an admin (acting on the customer's request) can take
 * one down; that archives immediately.
 *
 * Idempotent: an archived or already-pending family returns its current state
 * without calling Stripe or re-sending the email.
 *
 * @param family - the families row
 * @param opts.source - audit string: 'admin' | 'customer-web' | 'customer-mobile' | 'stripe-webhook' | 'stripe-portal'
 * @param opts.sendEmail - default true
 * @returns { canceled, periodEnd, archived, reason?, summary }
 */
async function softCancelFamily(family, { source = 'unknown', sendEmail = true } = {}) {
  if (!family) throw new Error('softCancelFamily: family required');
  const summary = [];

  console.log(`[softCancel] family=${family.id} source=${source}`);

  if (family.archived_at) {
    summary.push(`Family was already archived at ${family.archived_at}`);
    return { canceled: true, periodEnd: null, archived: true, summary };
  }
  if (futureDate(family.cancel_effective_at)) {
    summary.push(`Cancellation already scheduled; website stays live until ${String(family.cancel_effective_at).slice(0, 10)}`);
    return { canceled: true, periodEnd: family.cancel_effective_at, archived: false, summary };
  }

  if (isPrepaidChildhood(family) && source !== 'admin') {
    summary.push('Entire Childhood plan is prepaid and never renews; nothing to cancel');
    return { canceled: false, periodEnd: null, archived: false, reason: 'prepaid', summary };
  }

  // 1. Cancel Stripe subscription at period end
  let accessUntil = null;
  if (family.stripe_subscription_id) {
    try {
      const result = await stripeService.cancelSubscriptionAtPeriodEnd(family);
      if (result.status === 'canceled') summary.push('Stripe subscription had already ended');
      else if (result.alreadyCanceled) summary.push(`Stripe subscription was already set to end ${result.periodEnd ? result.periodEnd.slice(0, 10) : 'at period end'}`);
      else summary.push(`Stripe subscription will end ${result.periodEnd ? result.periodEnd.slice(0, 10) : 'at period end'}`);
      if (result.status !== 'canceled') {
        accessUntil = futureDate(result.periodEnd);
        if (!accessUntil) {
          // Stripe says it is still running but we could not read a future end
          // date: never take a paying customer offline early. Use 1 day out as a
          // placeholder; the subscription.deleted webhook archives at the real end
          // and the sweep only archives once Stripe confirms the sub has ended.
          console.error(`[softCancel] family ${family.id}: no period end from Stripe; relying on subscription.deleted webhook`);
          accessUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
          summary.push('⚠ Could not read period end from Stripe; website goes offline when Stripe ends the subscription');
        }
      }
    } catch (err) {
      // Do not archive (or claim a cancellation) when Stripe did not confirm it:
      // the customer would lose access while still being billed.
      console.error(`[softCancel] stripe cancel failed for family ${family.id}:`, err.message);
      summary.push(`⚠ Stripe cancel failed: ${err.message}. Nothing changed; try again.`);
      return { canceled: false, periodEnd: null, archived: false, reason: 'stripe-error', summary };
    }
  } else {
    // No subscription: an admin comp / trial with a known future end date keeps
    // access until then. Anything else (no end date, already past, or a
    // Childhood plan being taken down by an admin) is archived now, as before.
    accessUntil = isPrepaidChildhood(family) ? null : futureDate(family.trial_ends_at);
    summary.push(accessUntil
      ? `No Stripe subscription; comp access runs until ${accessUntil.toISOString().slice(0, 10)}`
      : 'No Stripe subscription on file');
  }

  // 2. Disable Spaceship auto-renew on custom domain (if any)
  await setDomainAutoRenew(family, false, summary);

  // 3a. Paid period left: schedule the end, keep the website live.
  if (accessUntil) {
    const now = new Date();
    await writeFamily(family.id, {
      cancelled_at: family.cancelled_at || now.toISOString(),
      cancel_effective_at: accessUntil.toISOString(),
    });
    summary.push(`Cancellation scheduled; website stays live until ${accessUntil.toISOString().slice(0, 10)}`);
    if (sendEmail) await sendCancelEmail(family, accessUntil.toISOString(), summary);
    return { canceled: true, periodEnd: accessUntil.toISOString(), archived: false, summary };
  }

  // 3b. Nothing left to honour: archive now.
  await archiveFamily(family, { source, sendEmail, summary, skipDomain: true });
  return { canceled: true, periodEnd: null, archived: true, summary };
}

async function setDomainAutoRenew(family, on, summary) {
  if (!family.custom_domain) return;
  try {
    await spaceshipService.setAutoRenew(family.custom_domain, on);
    summary.push(`Spaceship auto-renew ${on ? 'enabled' : 'disabled'} on ${family.custom_domain}`);
  } catch (err) {
    console.error(`[subscription] spaceship auto-renew ${on} failed for ${family.custom_domain}:`, err.message);
    summary.push(`⚠ Spaceship auto-renew ${on ? 'enable' : 'disable'} failed: ${err.message}`);
  }
}

async function sendCancelEmail(family, periodEnd, summary) {
  try {
    await emailService.sendCancellationEmail({
      to: family.email,
      displayName: family.customer_name || family.display_name,
      type: 'archive',
      periodEnd,
      customDomain: family.custom_domain,
      subdomain: family.subdomain,
    });
    summary.push(`Confirmation email sent to ${family.email}`);
  } catch (err) {
    console.error(`[subscription] cancellation email failed for ${family.email}:`, err.message);
    summary.push(`⚠ Email failed: ${err.message}`);
  }
}

/**
 * Archive (suspend) a family NOW: the paid period is over (or there never was
 * one). Sets archived_at + subscription_status='canceled' (resolveFamily then
 * serves the offline page) and starts the one-year data-retention clock that
 * jobs/dataRetentionPurge.js enforces (Privacy Policy section 8, Terms 13):
 * data_retain_until = archive time + 1 year.
 *
 * Called by softCancelFamily (no paid period left), the
 * customer.subscription.deleted webhook (period ended, or a Stripe-side
 * immediate cancel) and jobs/cancellationSweep.js.
 *
 * @param opts.sendEmail - send the cancellation email (pass false when the
 *   customer was already emailed at cancel time)
 */
async function archiveFamily(family, { source = 'unknown', sendEmail = true, summary = [], skipDomain = false } = {}) {
  if (family.archived_at) {
    summary.push(`Family was already archived at ${family.archived_at}`);
    return { archived: false, summary };
  }
  console.log(`[archive] family=${family.id} source=${source}`);
  if (!skipDomain) await setDomainAutoRenew(family, false, summary);
  const now = new Date();
  await writeFamily(family.id, {
    subscription_status: 'canceled',
    archived_at: now.toISOString(),
    cancelled_at: family.cancelled_at || now.toISOString(),
    cancel_effective_at: family.cancel_effective_at || now.toISOString(),
    data_retain_until: new Date(now.getTime() + YEAR_MS).toISOString(),
  });
  summary.push('Family archived; website is now offline (content kept 1 year)');
  if (sendEmail) await sendCancelEmail(family, null, summary);
  return { archived: true, summary };
}

/**
 * Undo a scheduled cancellation before the paid period ends: turn Stripe's
 * cancel_at_period_end back off, clear the pending dates and re-enable domain
 * auto-renew. Archived families must use the reactivation checkout instead.
 *
 * @param opts.skipStripe - Stripe is already resumed (webhook / sweep saw it)
 */
async function resumeCancellation(family, { source = 'unknown', skipStripe = false } = {}) {
  if (!family) throw new Error('resumeCancellation: family required');
  if (family.archived_at) throw new Error('Website is already offline; use reactivation instead');
  console.log(`[resume] family=${family.id} source=${source}`);
  const summary = [];
  if (!skipStripe && family.stripe_subscription_id) {
    await stripeService.resumeSubscription(family); // throws if the sub already ended
    summary.push('Stripe subscription will renew again');
  }
  await writeFamily(family.id, { cancelled_at: null, cancel_effective_at: null });
  summary.push('Pending cancellation cleared');
  await setDomainAutoRenew(family, true, summary);
  return { resumed: true, summary };
}

/**
 * Archive families whose scheduled cancellation has come due. Primary path for
 * families without a Stripe subscription (comps); a safety net for Stripe
 * families whose subscription.deleted webhook was missed (those are archived
 * only after Stripe confirms the subscription has ended).
 */
async function archiveDueCancellations({ graceMs = 60 * 60 * 1000 } = {}) {
  const cutoff = new Date(Date.now() - graceMs).toISOString();
  const { data, error } = await supabaseAdmin
    .from('families')
    .select('*')
    .is('archived_at', null)
    .not('cancel_effective_at', 'is', null)
    .lt('cancel_effective_at', cutoff);
  if (error) {
    console.error('[cancellation-sweep] query failed (migration 036 applied?):', error.message);
    return { checked: 0, archived: 0, error: error.message };
  }
  let archived = 0;
  for (const fam of data || []) {
    try {
      if (fam.stripe_subscription_id) {
        if (!stripe) continue;
        let ended = false;
        try {
          const sub = await stripe.subscriptions.retrieve(fam.stripe_subscription_id);
          ended = sub.status === 'canceled' || sub.status === 'incomplete_expired';
          if (!ended && !sub.cancel_at_period_end && !sub.cancel_at) {
            // Customer resumed (e.g. in the Stripe portal) and we missed the webhook.
            await resumeCancellation(fam, { source: 'cancellation-sweep', skipStripe: true });
            continue;
          }
          if (!ended) {
            // Still running toward a later end (period extended): move our date.
            const end = stripeService.subscriptionPeriodEnd(sub);
            if (end && futureDate(end)) await writeFamily(fam.id, { cancel_effective_at: end });
            continue;
          }
        } catch (err) {
          if (!(err && err.code === 'resource_missing')) throw err;
        }
      }
      await archiveFamily(fam, { source: 'cancellation-sweep', sendEmail: false });
      archived++;
    } catch (err) {
      console.error(`[cancellation-sweep] family ${fam.id} failed:`, err.message);
    }
  }
  return { checked: (data || []).length, archived };
}

/**
 * Soft-cancel all families linked to an auth user.
 * Used by mobile/web "Cancel All" flows.
 */
async function softCancelAllForUser(authUserId, { source = 'unknown' } = {}) {
  const families = await familyService.findAllByAuthUserId(authUserId);
  if (!families.length) return { canceled: 0, results: [] };
  const results = [];
  for (const fam of families) {
    try {
      const r = await softCancelFamily(fam, { source });
      results.push({ familyId: fam.id, ok: true, canceled: r.canceled, periodEnd: r.periodEnd, reason: r.reason, summary: r.summary });
    } catch (err) {
      console.error(`[softCancelAll] family ${fam.id} failed:`, err.message);
      results.push({ familyId: fam.id, ok: false, error: err.message });
    }
  }
  return { canceled: results.filter(r => r.ok && r.canceled).length, results };
}

/**
 * Promote a secondary family to be the new primary.
 *
 * Used when the current primary is being cancelled but the customer wants
 * to keep at least one site. The retiring primary has cancel_at_period_end
 * set; at that period_end the secondary's price flips to the primary annual
 * rate, with no immediate charge to the customer.
 *
 * Implementation: Stripe Subscription Schedules. Phase 1 keeps the secondary
 * at its current price until retiringPrimary.period_end. Phase 2 starts the
 * primary annual price at that moment. proration_behavior='none' ensures
 * no charge at the moment of cancellation.
 *
 * @param secondaryFamily - the family being promoted (on its current annual rate)
 * @param retiringPrimary - the family being cancelled (its period_end is the cutover)
 * @returns { scheduleId, switchAt }
 */
async function promoteSecondaryToPrimary(secondaryFamily, retiringPrimary, { source = 'unknown' } = {}) {
  if (!stripe) throw new Error('Stripe not configured');
  if (!secondaryFamily?.stripe_subscription_id) throw new Error('Secondary family has no Stripe subscription');
  if (!retiringPrimary?.stripe_subscription_id) throw new Error('Retiring primary has no Stripe subscription');

  // Determine the cutover moment — the retiring primary's period_end
  const retiringSub = await stripe.subscriptions.retrieve(retiringPrimary.stripe_subscription_id);
  // current_period_end moved onto subscription items in Stripe API 2025-03+.
  const retiringEnd = stripeService.subscriptionPeriodEnd(retiringSub);
  const cutover = retiringEnd ? Math.floor(new Date(retiringEnd).getTime() / 1000) : null; // unix seconds
  if (!cutover) throw new Error('Retiring primary has no period_end');

  // Pull the secondary's current subscription so we can mirror its price in phase 1
  const secondarySub = await stripe.subscriptions.retrieve(secondaryFamily.stripe_subscription_id, { expand: ['items.data.price'] });
  const currentPriceId = secondarySub.items.data[0]?.price?.id;
  if (!currentPriceId) throw new Error('Could not read secondary subscription price');

  // Choose the new primary price — match the retiring primary's billing period.
  // If the retiring primary was on monthly, the promoted family should also be monthly. Otherwise annual.
  const retiringPrice = retiringSub.items.data[0]?.price?.id;
  let newPrimaryPriceId = process.env.STRIPE_PRICE_ANNUAL;
  if (retiringPrice === process.env.STRIPE_PRICE_MONTHLY) newPrimaryPriceId = process.env.STRIPE_PRICE_MONTHLY;

  console.log(`[promote] family ${secondaryFamily.id}: ${currentPriceId} → ${newPrimaryPriceId} at ${new Date(cutover * 1000).toISOString()}`);

  // Create a Subscription Schedule from the secondary's existing subscription
  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: secondarySub.id });

  // Replace its phases with: phase 1 (current price → cutover), phase 2 (new price → forever)
  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'release',
    phases: [
      {
        items: [{ price: currentPriceId, quantity: 1 }],
        start_date: secondarySub.current_period_start,
        end_date: cutover,
        proration_behavior: 'none',
      },
      {
        items: [{ price: newPrimaryPriceId, quantity: 1 }],
        start_date: cutover,
        proration_behavior: 'none',
      },
    ],
  });

  return { scheduleId: schedule.id, switchAt: new Date(cutover * 1000).toISOString(), newPriceId: newPrimaryPriceId };
}

/**
 * Reactivate (un-archive) a family. Called by the webhook safety net when
 * Stripe reports an archived family's subscription has gone back to 'active',
 * OR by an explicit reactivation route.
 *
 *  - Clears archived_at and any pending/finished cancellation, sets subscription_status='active'
 *  - Re-enables Spaceship auto-renew on the family's custom domain
 *  - Sends a welcome-back email
 */
async function reactivateFamily(family, { source = 'unknown' } = {}) {
  console.log(`[reactivate] family=${family.id} source=${source}`);
  const summary = [];

  await writeFamily(family.id, {
    archived_at: null,
    subscription_status: 'active',
    cancelled_at: null,
    cancel_effective_at: null,
    data_retain_until: null,
  });
  summary.push('Cleared archived_at; subscription_status=active');

  if (family.custom_domain) {
    try {
      await spaceshipService.setAutoRenew(family.custom_domain, true);
      summary.push(`Spaceship auto-renew enabled on ${family.custom_domain}`);
    } catch (err) {
      console.error(`[reactivate] spaceship auto-renew failed:`, err.message);
      summary.push(`⚠ Spaceship auto-renew enable failed: ${err.message}`);
    }
  }

  // Welcome-back email — best-effort
  try {
    await emailService.sendReactivationEmail?.({
      to: family.email,
      displayName: family.customer_name || family.display_name,
      customDomain: family.custom_domain,
      subdomain: family.subdomain,
    });
    summary.push('Welcome-back email sent');
  } catch (err) {
    console.error('[reactivate] email failed:', err.message);
  }

  return { reactivated: true, summary };
}

module.exports = {
  isPrimaryFamily,
  softCancelFamily,
  softCancelAllForUser,
  archiveFamily,
  resumeCancellation,
  archiveDueCancellations,
  isPendingCancel,
  isPrepaidChildhood,
  promoteSecondaryToPrimary,
  reactivateFamily,
  PRIMARY_PRICE_IDS,
};
