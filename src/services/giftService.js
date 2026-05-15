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
}) {
  // ─── IDEMPOTENCY ────────────────────────────────────────────────────────
  // Stripe retries webhook deliveries on slow / non-2xx responses. Without
  // this check each retry inserted a new gift_codes row for the same
  // checkout session — see the May 14 2026 Giulia Busetto incident (3 rows
  // created within 2.3s for a single $29 charge). Before inserting, look
  // up an existing row by stripe_session_id; if found, return it and let
  // the caller skip duplicate work (email sends, etc.).
  if (stripeSessionId) {
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existing) {
      // Signal "this isn't new" so the webhook can skip resending emails.
      // Returning the row plus a flag keeps the contract simple — every
      // existing caller already destructures fields off the result.
      return { ...existing, _alreadyExisted: true };
    }
  }

  const code = generateGiftCode();
  const certificateToken = generateCertificateToken();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year to redeem

  const resolvedMethod = ['email_now', 'email_scheduled'].includes(deliveryMethod)
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
      months_prepaid: 12,
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
      const { data: existing } = await supabaseAdmin
        .from('gift_codes')
        .select('*')
        .eq('stripe_session_id', stripeSessionId)
        .single();
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
  if (gift.status !== 'purchased') throw new Error('This gift code has already been redeemed.');
  if (new Date(gift.expires_at) < new Date()) throw new Error('This gift code has expired.');

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

  // 5. Create Stripe customer and subscription with trial
  const { stripe } = require('../config/stripe');
  if (stripe) {
    try {
      const customer = await stripe.customers.create({ email, metadata: { family_id: family.id } });

      // Calculate trial end: gift purchase date + months_prepaid
      const trialEnd = new Date(gift.created_at);
      trialEnd.setMonth(trialEnd.getMonth() + gift.months_prepaid);

      // Gift recipients are explicitly told on the gift page that the post-
      // gift-year auto-renew is $49.99/yr — so use STRIPE_PRICE_ANNUAL.
      // (Earlier code preferred MONTHLY which would have rebilled at $4.99/mo,
      // contradicting the disclosure on the gift page.)
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

module.exports = {
  generateGiftCode,
  createGiftCode,
  findByCode,
  redeemGiftCode,
};
