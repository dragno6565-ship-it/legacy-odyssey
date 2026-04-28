/**
 * Subscription lifecycle orchestration. Direct port of
 * src/services/subscriptionService.js.
 *
 * Single source of truth for cancel / un-cancel / promotion across all
 * surfaces (admin panel, web dashboard, mobile API, Stripe webhooks).
 *
 * Key principles preserved from Express:
 *   - Soft cancel always uses cancel_at_period_end (never charges or refunds).
 *   - Customer is NEVER charged during a cancellation action.
 *   - "Primary" family = the one whose Stripe subscription uses one of the
 *     primary price IDs (STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL /
 *     STRIPE_PRICE_ANNUAL_INTRO). Secondary = STRIPE_PRICE_ADDITIONAL_DOMAIN.
 *   - Promotion of a secondary to primary uses Stripe Subscription Schedules
 *     so the higher rate doesn't kick in until the retiring primary's
 *     period_end (no overlap, no double-billing).
 *
 * Deferred from Phase 3 first cut: email confirmation (sendCancellationEmail).
 * Express sends a confirmation email best-effort; v3 will add this when the
 * Resend port lands. Cancellation itself (Stripe + Spaceship + DB row) works
 * without it. Logged in the result summary so admins can see the gap.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import type { Env } from './supabase';
import { adminClient } from './supabase';
import { stripeClient } from './stripeClient';
import { findAllByAuthUserId } from './familyService';
import { setAutoRenew } from './spaceshipApi';
import type { Family } from './types';

function primaryPriceIds(env: Env): Set<string> {
  return new Set(
    [env.STRIPE_PRICE_MONTHLY, env.STRIPE_PRICE_ANNUAL, env.STRIPE_PRICE_ANNUAL_INTRO].filter(
      (x): x is string => Boolean(x)
    )
  );
}

/**
 * Determine whether a family's subscription is on a primary price.
 * Returns null if we can't tell (no Stripe sub on file).
 */
export async function isPrimaryFamily(env: Env, family: Family | null): Promise<boolean | null> {
  if (!family?.stripe_subscription_id) return null;
  try {
    const stripe = stripeClient(env);
    const sub = await stripe.subscriptions.retrieve(family.stripe_subscription_id, {
      expand: ['items.data.price'],
    });
    const priceId = sub.items.data[0]?.price?.id;
    if (!priceId) return null;
    return primaryPriceIds(env).has(priceId);
  } catch (err: any) {
    console.error(
      `isPrimaryFamily: stripe error for sub ${family.stripe_subscription_id}: ${err.message}`
    );
    return null;
  }
}

/**
 * Cancel a subscription at period_end. Returns { canceled, periodEnd, alreadyCanceled }.
 * Idempotent — calling on an already-cancelled sub returns alreadyCanceled=true.
 */
async function cancelSubscriptionAtPeriodEnd(
  stripe: Stripe,
  family: Family
): Promise<{ canceled: boolean; periodEnd: string | null; alreadyCanceled: boolean; reason?: string }> {
  if (!family.stripe_subscription_id) {
    return { canceled: false, periodEnd: null, alreadyCanceled: false, reason: 'no-subscription' };
  }
  const sub = await stripe.subscriptions.retrieve(family.stripe_subscription_id);
  if (sub.status === 'canceled') {
    return { canceled: true, periodEnd: null, alreadyCanceled: true };
  }
  if (sub.cancel_at_period_end) {
    return {
      canceled: true,
      periodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      alreadyCanceled: true,
    };
  }
  const updated = await stripe.subscriptions.update(family.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  return {
    canceled: true,
    periodEnd: updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null,
    alreadyCanceled: false,
  };
}

export type CancelResult = {
  canceled: boolean;
  periodEnd: string | null;
  summary: string[];
};

/**
 * Soft-cancel a single family.
 *   - cancel_at_period_end on the Stripe subscription (no charge)
 *   - Spaceship auto-renew disabled on the custom domain
 *   - archived_at + subscription_status='canceled' on the families row
 *   - (TODO Resend) confirmation email — currently logged in summary as deferred
 *
 * Idempotent: if already archived, returns the existing state.
 */
export async function softCancelFamily(
  env: Env,
  family: Family,
  opts: { source?: string; sendEmail?: boolean } = {}
): Promise<CancelResult> {
  const { source = 'unknown' } = opts;
  if (!family) throw new Error('softCancelFamily: family required');
  const summary: string[] = [];
  let periodEnd: string | null = null;

  console.log(`[softCancel] family=${family.id} source=${source}`);

  if (family.archived_at) {
    summary.push(`Family was already archived at ${family.archived_at}`);
    return { canceled: true, periodEnd: null, summary };
  }

  // 1. Cancel Stripe subscription
  try {
    const stripe = stripeClient(env);
    const result = await cancelSubscriptionAtPeriodEnd(stripe, family);
    periodEnd = result.periodEnd;
    if (result.canceled && result.alreadyCanceled) summary.push('Stripe subscription was already cancelled');
    else if (result.canceled)
      summary.push(`Stripe subscription will end ${result.periodEnd?.slice(0, 10) || 'at period end'}`);
    else summary.push('No Stripe subscription on file (skipped)');
  } catch (err: any) {
    console.error(`[softCancel] stripe cancel failed for family ${family.id}: ${err.message}`);
    summary.push(`⚠ Stripe cancel failed: ${err.message}`);
  }

  // 2. Disable Spaceship auto-renew on custom domain
  if (family.custom_domain) {
    try {
      await setAutoRenew(env, family.custom_domain, false);
      summary.push(`Spaceship auto-renew disabled on ${family.custom_domain}`);
    } catch (err: any) {
      console.error(
        `[softCancel] spaceship auto-renew failed for ${family.custom_domain}: ${err.message}`
      );
      summary.push(`⚠ Spaceship auto-renew failed: ${err.message}`);
    }
  }

  // 3. Mark family archived + canceled
  const supabase = adminClient(env);
  await supabase
    .from('families')
    .update({
      subscription_status: 'canceled',
      archived_at: new Date().toISOString(),
    })
    .eq('id', family.id);
  summary.push('Family marked archived; book is now suspended');

  // 4. (Deferred) Confirmation email — Resend port lands separately.
  summary.push('TODO: cancellation email — pending Resend port');

  return { canceled: true, periodEnd, summary };
}

/** Soft-cancel every family linked to an auth user (mobile "Cancel All"). */
export async function softCancelAllForUser(
  env: Env,
  authUserId: string,
  opts: { source?: string } = {}
): Promise<{ canceled: number; results: Array<{ familyId: string; ok: boolean; summary?: string[]; error?: string }> }> {
  const supabase = adminClient(env);
  const families = await findAllByAuthUserId(supabase, authUserId);
  if (!families.length) return { canceled: 0, results: [] };
  const results: Array<{ familyId: string; ok: boolean; summary?: string[]; error?: string }> = [];
  for (const fam of families) {
    try {
      const r = await softCancelFamily(env, fam, opts);
      results.push({ familyId: fam.id, ok: true, summary: r.summary });
    } catch (err: any) {
      console.error(`[softCancelAll] family ${fam.id} failed: ${err.message}`);
      results.push({ familyId: fam.id, ok: false, error: err.message });
    }
  }
  return { canceled: results.filter((r) => r.ok).length, results };
}

/**
 * Promote a secondary family to be the new primary at the retiring primary's
 * period_end. Direct port of the Stripe Subscription Schedule logic.
 */
export async function promoteSecondaryToPrimary(
  env: Env,
  secondaryFamily: Family,
  retiringPrimary: Family,
  _opts: { source?: string } = {}
): Promise<{ scheduleId: string; switchAt: string; newPriceId: string }> {
  if (!secondaryFamily?.stripe_subscription_id)
    throw new Error('Secondary family has no Stripe subscription');
  if (!retiringPrimary?.stripe_subscription_id)
    throw new Error('Retiring primary has no Stripe subscription');

  const stripe = stripeClient(env);

  const retiringSub = await stripe.subscriptions.retrieve(retiringPrimary.stripe_subscription_id);
  const cutover = retiringSub.current_period_end;
  if (!cutover) throw new Error('Retiring primary has no period_end');

  const secondarySub = await stripe.subscriptions.retrieve(secondaryFamily.stripe_subscription_id, {
    expand: ['items.data.price'],
  });
  const currentPriceId = secondarySub.items.data[0]?.price?.id;
  if (!currentPriceId) throw new Error('Could not read secondary subscription price');

  const retiringPrice = retiringSub.items.data[0]?.price?.id;
  let newPrimaryPriceId = env.STRIPE_PRICE_ANNUAL!;
  if (retiringPrice === env.STRIPE_PRICE_MONTHLY) newPrimaryPriceId = env.STRIPE_PRICE_MONTHLY!;

  console.log(
    `[promote] family ${secondaryFamily.id}: ${currentPriceId} → ${newPrimaryPriceId} at ${new Date(
      cutover * 1000
    ).toISOString()}`
  );

  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: secondarySub.id });
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

  return {
    scheduleId: schedule.id,
    switchAt: new Date(cutover * 1000).toISOString(),
    newPriceId: newPrimaryPriceId,
  };
}

/** Reactivate (un-archive) a family. Used by the Stripe webhook safety net. */
export async function reactivateFamily(
  env: Env,
  family: Family,
  opts: { source?: string } = {}
): Promise<{ reactivated: boolean; summary: string[] }> {
  const { source = 'unknown' } = opts;
  console.log(`[reactivate] family=${family.id} source=${source}`);
  const summary: string[] = [];

  const supabase = adminClient(env);
  await supabase
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
      await setAutoRenew(env, family.custom_domain, true);
      summary.push(`Spaceship auto-renew enabled on ${family.custom_domain}`);
    } catch (err: any) {
      console.error(`[reactivate] spaceship auto-renew failed: ${err.message}`);
      summary.push(`⚠ Spaceship auto-renew enable failed: ${err.message}`);
    }
  }

  summary.push('TODO: welcome-back email — pending Resend port');
  return { reactivated: true, summary };
}
