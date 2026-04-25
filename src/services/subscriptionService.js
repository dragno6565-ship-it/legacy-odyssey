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
 *     STRIPE_PRICE_ANNUAL_INTRO). Secondary = STRIPE_PRICE_ADDITIONAL_DOMAIN.
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

const ADDITIONAL_PRICE_ID = process.env.STRIPE_PRICE_ADDITIONAL_DOMAIN;

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

/**
 * Soft-cancel a single family.
 *
 *  - Cancels the Stripe subscription at period end (no charge)
 *  - Disables Spaceship auto-renew on the family's custom domain (if any)
 *  - Sets archived_at + subscription_status='canceled' on the family row
 *  - Sends the cancellation confirmation email (best-effort)
 *
 * Idempotent: safe to call repeatedly. If already archived, skips and
 * returns the existing state.
 *
 * @param family - the families row (must have id, email, custom_domain, stripe_subscription_id)
 * @param opts.source - audit string: 'admin' | 'customer-web' | 'customer-mobile' | 'stripe-webhook'
 * @param opts.sendEmail - default true; pass false to suppress (e.g., webhook re-runs)
 * @returns { canceled, periodEnd, summary }
 */
async function softCancelFamily(family, { source = 'unknown', sendEmail = true } = {}) {
  if (!family) throw new Error('softCancelFamily: family required');
  const summary = [];
  let periodEnd = null;

  console.log(`[softCancel] family=${family.id} source=${source}`);

  // Idempotency: if already archived, summarize state and bail
  if (family.archived_at) {
    summary.push(`Family was already archived at ${family.archived_at}`);
    return { canceled: true, periodEnd: null, summary };
  }

  // 1. Cancel Stripe subscription at period end
  try {
    const result = await stripeService.cancelSubscriptionAtPeriodEnd(family);
    periodEnd = result.periodEnd;
    if (result.canceled && result.alreadyCanceled) summary.push('Stripe subscription was already cancelled');
    else if (result.canceled) summary.push(`Stripe subscription will end ${result.periodEnd?.slice(0, 10) || 'at period end'}`);
    else summary.push('No Stripe subscription on file (skipped)');
  } catch (err) {
    console.error(`[softCancel] stripe cancel failed for family ${family.id}:`, err.message);
    summary.push(`⚠ Stripe cancel failed: ${err.message}`);
  }

  // 2. Disable Spaceship auto-renew on custom domain (if any)
  if (family.custom_domain) {
    try {
      await spaceshipService.setAutoRenew(family.custom_domain, false);
      summary.push(`Spaceship auto-renew disabled on ${family.custom_domain}`);
    } catch (err) {
      console.error(`[softCancel] spaceship auto-renew failed for ${family.custom_domain}:`, err.message);
      summary.push(`⚠ Spaceship auto-renew failed: ${err.message}`);
    }
  }

  // 3. Mark family as archived + canceled
  await supabaseAdmin
    .from('families')
    .update({
      subscription_status: 'canceled',
      archived_at: new Date().toISOString(),
    })
    .eq('id', family.id);
  summary.push('Family marked archived; book is now suspended');

  // 4. Send confirmation email (best-effort)
  if (sendEmail) {
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
      console.error(`[softCancel] email failed for ${family.email}:`, err.message);
      summary.push(`⚠ Email failed: ${err.message}`);
    }
  }

  return { canceled: true, periodEnd, summary };
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
      results.push({ familyId: fam.id, ok: true, summary: r.summary });
    } catch (err) {
      console.error(`[softCancelAll] family ${fam.id} failed:`, err.message);
      results.push({ familyId: fam.id, ok: false, error: err.message });
    }
  }
  return { canceled: results.filter(r => r.ok).length, results };
}

/**
 * Promote a secondary family to be the new primary.
 *
 * Used when the current primary is being cancelled but the customer wants
 * to keep at least one site. The retiring primary has cancel_at_period_end
 * set; at that period_end the secondary's price flips from $12.99/yr to
 * the primary annual rate, with no immediate charge to the customer.
 *
 * Implementation: Stripe Subscription Schedules. Phase 1 keeps the secondary
 * at its current price until retiringPrimary.period_end. Phase 2 starts the
 * primary annual price at that moment. proration_behavior='none' ensures
 * no charge at the moment of cancellation.
 *
 * @param secondaryFamily - the family being promoted (currently on $12.99/yr)
 * @param retiringPrimary - the family being cancelled (its period_end is the cutover)
 * @returns { scheduleId, switchAt }
 */
async function promoteSecondaryToPrimary(secondaryFamily, retiringPrimary, { source = 'unknown' } = {}) {
  if (!stripe) throw new Error('Stripe not configured');
  if (!secondaryFamily?.stripe_subscription_id) throw new Error('Secondary family has no Stripe subscription');
  if (!retiringPrimary?.stripe_subscription_id) throw new Error('Retiring primary has no Stripe subscription');

  // Determine the cutover moment — the retiring primary's period_end
  const retiringSub = await stripe.subscriptions.retrieve(retiringPrimary.stripe_subscription_id);
  const cutover = retiringSub.current_period_end; // unix seconds
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
 *  - Clears archived_at, sets subscription_status='active'
 *  - Re-enables Spaceship auto-renew on the family's custom domain
 *  - Sends a welcome-back email
 */
async function reactivateFamily(family, { source = 'unknown' } = {}) {
  console.log(`[reactivate] family=${family.id} source=${source}`);
  const summary = [];

  await supabaseAdmin
    .from('families')
    .update({
      archived_at: null,
      subscription_status: 'active',
      cancelled_at: null,
    })
    .eq('id', family.id);
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
  promoteSecondaryToPrimary,
  reactivateFamily,
  PRIMARY_PRICE_IDS,
  ADDITIONAL_PRICE_ID,
};
