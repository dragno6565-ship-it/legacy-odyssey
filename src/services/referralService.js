const { supabaseAdmin } = require('../config/supabase');
const { REFERRALS_ENABLED } = require('../config/features');

/**
 * Referral program (B13) — Stripe customer-balance credit model.
 *
 * FEATURE FLAG: the whole program is gated by REFERRALS_ENABLED (config/features).
 * When OFF (the current default, set by Dan 2026-06-26) every public function
 * below short-circuits to a no-op: no codes are generated, ?ref= attribution is
 * ignored, no Stripe credits are issued, and getReferralStats returns null so the
 * dashboard card hides. Existing referral DATA and migration 023 are untouched —
 * flip REFERRALS_ENABLED=true to restore the program exactly as it was.
 *
 * Each family has a shareable `referral_code`. New customers who arrive via a
 * referral link (?ref=CODE) get tagged with `referred_by` at checkout. Once a
 * referred family completes a paid checkout (the "qualifying" event), the
 * referrer's `referral_qualified_count` is incremented. For every REWARD_THRESHOLD
 * qualified referrals, we add a REWARD_AMOUNT_CENTS credit to the referrer's
 * Stripe customer balance — a negative balance transaction that Stripe applies
 * automatically toward their next invoice. `referral_credits_granted` tracks how
 * many credits we've already issued so we never double-pay.
 *
 * Idempotency: a referred family is only ever counted once, guarded by
 * `referral_counted_at`. Stripe retries of checkout.session.completed are safe.
 */

const REWARD_THRESHOLD = 3;      // qualified referrals per reward
const REWARD_AMOUNT_CENTS = 4999; // $49.99 — one free renewal year
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I/L
const CODE_LENGTH = 6;

// Self-disable guard: the referral columns (migration 023) may not be applied
// yet in a given environment. The first query that hits a "column does not
// exist" error trips this flag so we stop firing doomed queries (no log spam,
// no wasted round-trips). It resets on process start, so once the migration is
// applied and the server redeploys/restarts, referrals re-enable automatically.
let referralSchemaMissing = false;

function noteSchema(error) {
  // SELECT on a missing column → Postgres 42703 ("column ... does not exist").
  // INSERT/UPDATE on a missing column → PostgREST PGRST204 ("Could not find the
  // '...' column ... in the schema cache"). Catch both.
  const msg = (error && error.message) || '';
  if (error && (error.code === '42703' || error.code === 'PGRST204' ||
                /does not exist/i.test(msg) || /schema cache/i.test(msg))) {
    if (!referralSchemaMissing) {
      console.warn('[referral] referral columns absent (migration 023 not applied) — referral features disabled until applied + redeployed');
    }
    referralSchemaMissing = true;
    return true;
  }
  return false;
}

function normalizeCode(raw) {
  return (raw || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function randomCode() {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Find the family that owns a referral code. Returns null if none.
 */
async function findByReferralCode(code) {
  if (!REFERRALS_ENABLED) return null;
  if (referralSchemaMissing) return null;
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const { data, error } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('referral_code', normalized)
    .limit(1)
    .maybeSingle();
  if (error) { noteSchema(error); return null; }
  return data || null;
}

/**
 * Return the family's referral code, generating + persisting one if needed.
 * Retries on the (rare) unique-index collision.
 */
async function getOrCreateCodeForFamily(family) {
  if (!REFERRALS_ENABLED) return null;
  if (referralSchemaMissing) return null;
  if (!family) return null;
  if (family.referral_code) return family.referral_code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const { data, error } = await supabaseAdmin
      .from('families')
      .update({ referral_code: code })
      .eq('id', family.id)
      .is('referral_code', null) // don't clobber a code set by a concurrent request
      .select('referral_code')
      .maybeSingle();
    if (error && noteSchema(error)) return null; // columns missing — bail, don't retry
    if (!error && data && data.referral_code) {
      family.referral_code = data.referral_code;
      return data.referral_code;
    }
    // Either a unique collision (error 23505) or another request set it first —
    // re-read and return whatever is now stored.
    const { data: fresh } = await supabaseAdmin
      .from('families').select('referral_code').eq('id', family.id).maybeSingle();
    if (fresh && fresh.referral_code) {
      family.referral_code = fresh.referral_code;
      return fresh.referral_code;
    }
  }
  console.error(`[referral] could not generate a code for family ${family.id} after 6 attempts`);
  return null;
}

/**
 * Tag a newly-created family with the code that referred them. No-op if the
 * code is missing, invalid, self-referral, or the family is already attributed.
 */
async function attributeSignup(newFamily, rawCode) {
  if (!REFERRALS_ENABLED) return null;
  if (referralSchemaMissing) return null;
  const code = normalizeCode(rawCode);
  if (!newFamily || !code) return null;
  if (newFamily.referred_by) return newFamily.referred_by; // already attributed

  const referrer = await findByReferralCode(code);
  if (!referrer) {
    console.log(`[referral] signup used unknown code "${code}" — ignoring`);
    return null;
  }
  if (referrer.id === newFamily.id) return null; // can't refer yourself

  await supabaseAdmin.from('families').update({ referred_by: code }).eq('id', newFamily.id);
  newFamily.referred_by = code;
  console.log(`[referral] family ${newFamily.id} attributed to referrer ${referrer.id} (code ${code})`);
  return code;
}

/**
 * Issue any Stripe credits the referrer has earned but not yet been granted.
 * Safe to call repeatedly — only grants the delta between earned and granted.
 */
async function grantEarnedCredits(referrer) {
  if (!REFERRALS_ENABLED) return;
  if (!referrer) return;
  const qualified = referrer.referral_qualified_count || 0;
  const granted = referrer.referral_credits_granted || 0;
  const earned = Math.floor(qualified / REWARD_THRESHOLD);
  const owed = earned - granted;
  if (owed <= 0) return;

  if (!referrer.stripe_customer_id) {
    // Referrer hasn't got a Stripe customer yet (free/trial). Leave
    // credits_granted untouched so the credit is issued on a later qualifying
    // event once they have a customer id. Log so it isn't silently lost.
    console.warn(`[referral] referrer ${referrer.id} earned ${owed} credit(s) but has no stripe_customer_id — deferring`);
    return;
  }

  const { stripe } = require('../config/stripe');
  if (!stripe) { console.error('[referral] Stripe not configured — cannot grant credit'); return; }

  for (let i = 0; i < owed; i++) {
    try {
      await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
        amount: -REWARD_AMOUNT_CENTS, // negative = credit toward future invoices
        currency: 'usd',
        description: 'Legacy Odyssey referral reward — one free year (3 friends referred)',
        metadata: { type: 'referral_reward', family_id: referrer.id },
      });
    } catch (err) {
      console.error(`[referral] failed to grant credit to ${referrer.id}:`, err.message);
      // Persist however many we did manage to grant so far, then stop.
      if (i > 0) {
        await supabaseAdmin.from('families')
          .update({ referral_credits_granted: granted + i })
          .eq('id', referrer.id);
        referrer.referral_credits_granted = granted + i;
      }
      return;
    }
  }

  await supabaseAdmin.from('families')
    .update({ referral_credits_granted: earned })
    .eq('id', referrer.id);
  referrer.referral_credits_granted = earned;
  console.log(`[referral] granted ${owed} credit(s) ($${(owed * REWARD_AMOUNT_CENTS / 100).toFixed(2)}) to referrer ${referrer.id}`);
}

/**
 * Record that a referred family has completed a paid checkout. Idempotent:
 * the referred family is only counted once (referral_counted_at). Increments
 * the referrer's qualified count and grants any newly-earned credits.
 */
async function recordQualifiedReferral(referredFamily) {
  if (!REFERRALS_ENABLED) return;
  if (referralSchemaMissing) return;
  if (!referredFamily || !referredFamily.referred_by) return;
  if (referredFamily.referral_counted_at) return; // already counted

  // Atomically claim the count: only the request that flips counted_at from
  // NULL proceeds, so concurrent webhook retries can't double-increment.
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('families')
    .update({ referral_counted_at: new Date().toISOString() })
    .eq('id', referredFamily.id)
    .is('referral_counted_at', null)
    .select('id')
    .maybeSingle();
  if (claimErr) { noteSchema(claimErr); return; }
  if (!claimed) return; // someone else already counted it
  referredFamily.referral_counted_at = new Date().toISOString();

  const referrer = await findByReferralCode(referredFamily.referred_by);
  if (!referrer) {
    console.log(`[referral] qualified referral but referrer code "${referredFamily.referred_by}" no longer exists`);
    return;
  }

  const newCount = (referrer.referral_qualified_count || 0) + 1;
  await supabaseAdmin.from('families')
    .update({ referral_qualified_count: newCount })
    .eq('id', referrer.id);
  referrer.referral_qualified_count = newCount;
  console.log(`[referral] referrer ${referrer.id} now has ${newCount} qualified referral(s)`);

  await grantEarnedCredits(referrer);
}

/**
 * Build the referral stats object for the account dashboard.
 */
function getReferralStats(family, appDomain) {
  if (!REFERRALS_ENABLED) return null;
  const code = family.referral_code || null;
  const qualified = family.referral_qualified_count || 0;
  const creditsGranted = family.referral_credits_granted || 0;
  const towardNext = qualified % REWARD_THRESHOLD;
  return {
    code,
    link: code ? `https://${appDomain}/?ref=${code}` : null,
    qualified,
    creditsGranted,
    threshold: REWARD_THRESHOLD,
    towardNext,
    remaining: REWARD_THRESHOLD - towardNext,
    rewardLabel: '$49.99 (one free year)',
  };
}

module.exports = {
  REWARD_THRESHOLD,
  REWARD_AMOUNT_CENTS,
  normalizeCode,
  findByReferralCode,
  getOrCreateCodeForFamily,
  attributeSignup,
  recordQualifiedReferral,
  grantEarnedCredits,
  getReferralStats,
};
