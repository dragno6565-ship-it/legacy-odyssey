/**
 * Rewardful affiliate conversion API (server-side).
 *
 * The standard Rewardful↔Stripe integration attributes a sale by reading
 * `client_reference_id` off a Stripe Checkout Session. The on-brand embedded
 * flows (gift purchases + the branded signup) use Stripe PaymentIntents /
 * Subscriptions instead, which can't carry client_reference_id — so we capture
 * the Rewardful referral id in Stripe metadata (`metadata.rewardful_referral`)
 * at creation time, and on payment success the webhook calls recordConversion()
 * here to register the conversion via Rewardful's API.
 *
 * Auth: HTTP Basic — the API SECRET is the username, password blank.
 * Endpoint: POST https://api.getrewardful.com/v1/conversions
 *
 * SAFE BY DESIGN:
 *   - No-ops (returns {skipped}) when REWARDFUL_API_SECRET is unset.
 *   - Never throws — an affiliate-tracking hiccup must NEVER break fulfillment.
 *
 * ⚠️ UNVERIFIED end-to-end as of 2026-06-08 — blocked on REWARDFUL_API_SECRET
 * (Railway env) + a real referred purchase. Verify before relying on payouts;
 * see docs/infrastructure/rewardful.md. If the conversions payload contract
 * differs from {referral,email,stripe_customer_id}, adjust here.
 */

function getSecret() {
  return process.env.REWARDFUL_API_SECRET || '';
}

/**
 * Record a Rewardful conversion for a PaymentIntent/Subscription flow.
 * @param {object} o
 * @param {string} o.referralId   Rewardful referral id (from Stripe metadata.rewardful_referral)
 * @param {string} [o.email]      customer email (helps Rewardful link the conversion)
 * @param {string} [o.stripeCustomerId]
 * @param {number} [o.amountCents]
 * @param {string} [o.currency]
 */
async function recordConversion({ referralId, email, stripeCustomerId, amountCents, currency } = {}) {
  if (!referralId) return { skipped: 'no referral' };
  const secret = getSecret();
  if (!secret) {
    console.warn(`[rewardful] REWARDFUL_API_SECRET not set — skipping conversion for referral ${referralId}`);
    return { skipped: 'no secret' };
  }
  try {
    const auth = Buffer.from(`${secret}:`).toString('base64');
    const body = { referral: referralId };
    if (email) body.email = email;
    if (stripeCustomerId) body.stripe_customer_id = stripeCustomerId;
    if (amountCents != null) body.amount = amountCents;
    if (currency) body.currency = currency;

    const res = await fetch('https://api.getrewardful.com/v1/conversions', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      console.error(`[rewardful] conversion failed ${res.status} for referral ${referralId}: ${text.slice(0, 300)}`);
      return { ok: false, status: res.status };
    }
    console.log(`[rewardful] conversion recorded for referral ${referralId}`);
    return { ok: true };
  } catch (err) {
    console.error(`[rewardful] conversion error for referral ${referralId}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

module.exports = { recordConversion };
