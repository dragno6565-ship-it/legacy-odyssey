const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');
const familyService = require('./familyService');
const bookService = require('./bookService');
const { sendWelcomeEmail } = require('./emailService');

/**
 * Generate a human-friendly gift code: GIFT-XXXX-XXXX-XXXX
 * Uses uppercase alphanumeric chars, excluding ambiguous ones (0/O, 1/I/L).
 */
function generateGiftCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const groups = [];
  for (let g = 0; g < 3; g++) {
    let group = '';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      group += chars[bytes[i] % chars.length];
    }
    groups.push(group);
  }
  return `GIFT-${groups.join('-')}`;
}

/**
 * Generate a URL-safe random token for the printable certificate page.
 * 24 hex chars (~96 bits of entropy) is plenty — anyone with this token
 * can view the certificate, but only the buyer ever sees the link.
 */
function generateCertificateToken() {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Create a gift code record after successful Stripe payment.
 *
 * deliveryMethod:
 *   'email_now'        — recipient gets the gift email immediately (default)
 *   'email_scheduled'  — recipient gets the gift email on `scheduledDate`
 *
 * scheduledDate: ISO timestamp (used only when deliveryMethod = email_scheduled)
 *
 * Either way, the BUYER gets a confirmation email immediately with a link to
 * a printable PDF certificate (rendered from the certificate_token).
 */
async function createGiftCode({
  buyerEmail,
  buyerName,
  recipientName,
  recipientEmail,
  recipientMessage,
  stripeSessionId,
  deliveryMethod,
  scheduledDate,
  monthsPrepaid,
}) {
  // ─── IDEMPOTENCY ────────────────────────────────────────────────────────
  // Stripe retries webhook deliveries on slow / non-2xx responses. Without
  // this check each retry inserted a new gift_codes row for the same
  // checkout session — see the May 14 2026 Giulia Busetto incident (3 rows
  // created within 2.3s for a single $29 charge). Before inserting, look
  // up an existing row by stripe_session_id; if found, return it and let
  // the caller skip duplicate work (email sends, etc.).
  if (stripeSessionId) {
    // limit(1) rather than maybeSingle(): maybeSingle() errors when more than
    // one row already exists, which would defeat the idempotency check it's
    // meant to power. Take the earliest row for this session.
    const { data: existingRows, error: existingErr } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .order('created_at', { ascending: true })
      .limit(1);
    if (existingErr) throw existingErr;
    const existing = existingRows && existingRows[0];
    if (existing) {
      // Signal "this isn't new" so the webhook can skip resending emails.
      // Returning the row plus a flag keeps the contract simple — every
      // existing caller already destructures fields off the result.
      return { ...existing, _alreadyExisted: true };
    }
  }

  const code = generateGiftCode();
  const certificateToken = generateCertificateToken();
  // Gift codes don't expire — a buyer can hold one as long as they like
  // before giving it, and the recipient can redeem whenever they're ready
  // (this matches the promise on the /gift page). expires_at is NOT NULL,
  // so we store a far-future date rather than enforcing a real window.
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);

  // 'print' = buyer hands over the printable certificate themselves; we
  // never email the recipient. 'email_now' is the fallback for anything
  // unrecognized so a paid gift is never left without a delivery path.
  const resolvedMethod = ['email_now', 'email_scheduled', 'print'].includes(deliveryMethod)
    ? deliveryMethod
    : 'email_now';

  // deliver_at = when the recipient should hear from us.
  //   email_now       → now (cron will skip; webhook sends inline)
  //   email_scheduled → the timestamp the buyer chose
  let deliverAt;
  if (resolvedMethod === 'email_scheduled' && scheduledDate) {
    const parsed = new Date(scheduledDate);
    deliverAt = !isNaN(parsed.getTime()) && parsed.getTime() > Date.now()
      ? parsed.toISOString()
      : new Date().toISOString();
  } else {
    deliverAt = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .insert({
      code,
      buyer_email: buyerEmail,
      buyer_name: buyerName || null,
      recipient_name: recipientName || null,
      recipient_email: recipientEmail || null,
      recipient_message: recipientMessage || null,
      stripe_session_id: stripeSessionId,
      // 12 = 1-year gift; 216 (= 18×12) = Entire Childhood gift. The tier is
      // carried by this number — redeemGiftCode branches on >= 216.
      months_prepaid: monthsPrepaid && monthsPrepaid >= 216 ? 216 : 12,
      status: 'purchased',
      expires_at: expiresAt.toISOString(),
      delivery_method: resolvedMethod,
      deliver_at: deliverAt,
      certificate_token: certificateToken,
    })
    .select()
    .single();

  if (error) {
    // If we lost a race and another webhook beat us to the insert, the
    // unique constraint on stripe_session_id (migration 017) will fire
    // with Postgres code 23505. Treat that as "already exists" and fetch.
    if (error.code === '23505' && stripeSessionId) {
      const { data: existingRows } = await supabaseAdmin
        .from('gift_codes')
        .select('*')
        .eq('stripe_session_id', stripeSessionId)
        .order('created_at', { ascending: true })
        .limit(1);
      const existing = existingRows && existingRows[0];
      if (existing) return { ...existing, _alreadyExisted: true };
    }
    throw error;
  }
  return data;
}

/**
 * Look up a gift code by its code string.
 */
async function findByCode(code) {
  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single();

  if (error) return null;
  return data;
}

/**
 * Redeem a gift code: create the recipient's account, family, book, and subscription.
 */
async function redeemGiftCode({ code, email, domain }) {
  // 1. Find and validate the gift code
  const gift = await findByCode(code);
  if (!gift) throw new Error('Invalid gift code.');
  if (gift.status === 'refunded') {
    throw new Error('This gift code has been refunded and is no longer valid. Please contact the person who sent it to you.');
  }
  if (gift.status === 'voided' || gift.status === 'cancelled') {
    throw new Error('This gift code has been cancelled and is no longer valid. Please contact the person who sent it to you.');
  }
  if (gift.status !== 'purchased') throw new Error('This gift code has already been redeemed.');
  // Gift codes intentionally don't expire (see createGiftCode) — a code stays
  // redeemable whenever the recipient is ready, no matter how long it sat.

  // 2. Create auth user — or reuse one that already exists.
  // A previous customer who cancelled and is now redeeming a gift would
  // already have a row in auth.users (cancellation only archives the family,
  // not the auth account). Surface a friendly error if found, then proceed.
  const tempPassword = crypto.randomBytes(16).toString('hex');
  let authUserId = null;
  const { data: createData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createData?.user) {
    authUserId = createData.user.id;
  } else if (authError && /already (been )?registered|already exists|email_exists|duplicate/i.test(authError.message || '')) {
    // Find the existing auth user. Supabase admin doesn't have a direct
    // "find by email" — listUsers paginates. The list is small enough
    // that one page is enough for the foreseeable future.
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listError) throw listError;
    const existing = (listData.users || []).find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (!existing) {
      throw new Error(`Gift redemption: email ${email} reported as existing but not found in user list.`);
    }
    authUserId = existing.id;
    console.log(`Gift redemption reusing existing auth user for ${email} (${authUserId})`);
  } else if (authError) {
    throw authError;
  } else {
    throw new Error('Gift redemption: unexpected createUser response (no user, no error).');
  }

  // Generate a recovery link so the customer can set their own password
  let setPasswordUrl = null;
  try {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: 'https://legacyodyssey.com/set-password' },
    });
    setPasswordUrl = linkData?.properties?.action_link || null;
  } catch (e) {
    console.error('Failed to generate recovery link for gift redemption:', e.message);
  }

  // 3. Derive subdomain from domain
  const subdomain = domain ? domain.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '').toLowerCase() : null;

  // 4. Create family
  const family = await familyService.create({
    email,
    authUserId,
    subdomain,
    displayName: subdomain ? `The ${subdomain} Family` : 'My Family',
    customerName: gift.recipient_name || null,
  });

  // 5. Create Stripe customer and provision access.
  //    months_prepaid >= 216 → Entire Childhood gift: a one-time, 18-year
  //    plan with NO recurring subscription (mirrors a direct Childhood
  //    purchase — nothing ever re-bills). Otherwise → 1-year gift: a
  //    subscription whose trial covers the gifted months, then auto-renews
  //    at $49.99/yr (as disclosed on the gift page).
  const isChildhoodGift = (gift.months_prepaid || 12) >= 216;
  const { stripe } = require('../config/stripe');
  if (stripe) {
    try {
      const customer = await stripe.customers.create({ email, metadata: { family_id: family.id } });

      if (isChildhoodGift) {
        // No subscription — the buyer already paid $450 in full for all 18 years.
        await familyService.update(family.id, {
          stripe_customer_id: customer.id,
          subscription_status: 'active',
          billing_period: 'childhood',
          plan: 'paid',
        });
      } else {
        // The gift year runs from when the recipient REDEEMS — not from when
        // the gift was purchased — so a gift bought well in advance still
        // gives the recipient a full year. months_prepaid is the gifted
        // length (12). redeemGiftCode runs at redemption time, so "now" is
        // exactly the moment the recipient claimed the gift.
        const trialEnd = new Date();
        trialEnd.setMonth(trialEnd.getMonth() + gift.months_prepaid);

        // Gift recipients are explicitly told on the gift page that the post-
        // gift-year auto-renew is $49.99/yr — so use STRIPE_PRICE_ANNUAL.
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: process.env.STRIPE_PRICE_ANNUAL }],
          trial_end: Math.floor(trialEnd.getTime() / 1000),
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
        });

        await familyService.update(family.id, {
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          subscription_status: 'active',
          billing_period: 'annual',
        });
      }
    } catch (stripeErr) {
      console.error('Gift redemption Stripe setup error:', stripeErr.message);
      // Still continue — family and book are created
      await familyService.update(family.id, { subscription_status: 'active' });
    }
  } else {
    await familyService.update(family.id, { subscription_status: 'active' });
  }

  // 6. Create book with defaults
  await bookService.createBookWithDefaults(family.id);

  // 7. Mark gift code as redeemed
  await supabaseAdmin
    .from('gift_codes')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      family_id: family.id,
    })
    .eq('id', gift.id);

  // 8. Kick off domain purchase if selected
  if (domain) {
    try {
      const domainService = require('./domainService');
      const order = await domainService.createDomainOrder({
        familyId: family.id,
        domain,
        stripeSessionId: gift.stripe_session_id,
        price: null,
      });
      domainService.purchaseAndSetupDomain(order.id).catch((err) => {
        console.error(`Gift domain setup failed for ${domain}:`, err.message);
      });
    } catch (err) {
      console.error(`Gift domain order failed for ${domain}:`, err.message);
    }
  }

  // 9. Send welcome email
  try {
    await sendWelcomeEmail({
      to: email,
      displayName: family.display_name || subdomain,
      setPasswordUrl,
      bookPassword: family.book_password,
      subdomain,
      customDomain: domain || null,
    });
  } catch (emailErr) {
    console.error('Gift welcome email failed:', emailErr.message);
  }

  return { family, tempPassword, setPasswordUrl, domain, gift };
}

/**
 * Fulfill a gift purchase from a succeeded Stripe PaymentIntent (the embedded
 * Payment Element checkout path). Creates the gift code and sends the buyer's
 * confirmation + (if applicable) the recipient's notification.
 *
 * Idempotent: createGiftCode dedups on the PaymentIntent id (stored in
 * gift_codes.stripe_session_id, unique index migration 017), so this is safe to
 * call from BOTH the `payment_intent.succeeded` webhook AND the /gift/thank-you
 * redirect. Whichever runs first creates the row + sends emails; the second
 * sees `_alreadyExisted` and skips the emails. This belt-and-suspenders design
 * means a gift is still fulfilled even if the webhook event isn't enabled.
 *
 * Returns { gift, alreadyExisted }. No-op (null gift) for non-gift PIs.
 */
async function fulfillGiftForPaymentIntent(pi) {
  if (!pi || pi.metadata?.type !== 'gift') return { gift: null, alreadyExisted: false };
  const { sendGiftPurchaseEmail, sendGiftNotificationEmail } = require('./emailService');

  const m = pi.metadata || {};
  const giftPlan = m.gift_plan === 'childhood' ? 'childhood' : 'annual';
  const monthsPrepaid = giftPlan === 'childhood' ? 216 : 12;
  const buyerEmail = m.buyer_email || pi.receipt_email || null;

  const gift = await createGiftCode({
    buyerEmail,
    buyerName: m.buyer_name,
    recipientName: m.recipient_name || null,
    recipientEmail: m.recipient_email,
    recipientMessage: m.gift_message,
    stripeSessionId: pi.id,
    deliveryMethod: m.delivery_method || 'email_now',
    scheduledDate: m.scheduled_date || null,
    monthsPrepaid,
  });

  if (gift._alreadyExisted) return { gift, alreadyExisted: true };

  const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
  const redeemUrl = `https://${appDomain}/redeem?code=${gift.code}`;
  const certificateUrl = `https://${appDomain}/gift/certificate/${gift.certificate_token}`;

  await sendGiftPurchaseEmail({
    to: gift.buyer_email,
    buyerName: gift.buyer_name,
    giftCode: gift.code,
    redeemUrl,
    certificateUrl,
    recipientName: gift.recipient_name,
    deliveryMethod: gift.delivery_method,
    deliverAt: gift.deliver_at,
    monthsPrepaid: gift.months_prepaid,
  });

  if (gift.recipient_email && gift.delivery_method === 'email_now') {
    await sendGiftNotificationEmail({
      to: gift.recipient_email,
      buyerName: gift.buyer_name,
      message: gift.recipient_message,
      redeemUrl,
      monthsPrepaid: gift.months_prepaid,
    });
    await supabaseAdmin
      .from('gift_codes')
      .update({ recipient_email_sent_at: new Date().toISOString() })
      .eq('id', gift.id);
  }

  return { gift, alreadyExisted: false };
}

/**
 * Void (cancel) an UNREDEEMED gift code so it can never be redeemed. The status
 * guard (.eq('status','purchased')) makes this a no-op on already-redeemed,
 * refunded, or already-voided codes — so an admin can't accidentally invalidate
 * a code someone already used. redeemGiftCode rejects status='voided'.
 * Returns the updated row, or null if it wasn't an unredeemed code.
 */
async function voidGiftCode(giftId) {
  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .update({ status: 'voided', updated_at: new Date().toISOString() })
    .eq('id', giftId)
    .eq('status', 'purchased')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/** Save admin-only notes on a gift (any status). Returns the updated row. */
async function setGiftNotes(giftId, notes) {
  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .update({ admin_notes: (notes || '').slice(0, 2000) || null, updated_at: new Date().toISOString() })
    .eq('id', giftId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

module.exports = {
  generateGiftCode,
  createGiftCode,
  findByCode,
  redeemGiftCode,
  fulfillGiftForPaymentIntent,
  voidGiftCode,
  setGiftNotes,
};
