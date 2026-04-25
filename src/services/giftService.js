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
 * Create a gift code record after successful Stripe payment.
 */
async function createGiftCode({ buyerEmail, buyerName, recipientName, recipientEmail, recipientMessage, stripeSessionId }) {
  const code = generateGiftCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year to redeem

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
    })
    .select()
    .single();

  if (error) throw error;
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
  if (gift.status !== 'purchased') throw new Error('This gift code has already been redeemed.');
  if (new Date(gift.expires_at) < new Date()) throw new Error('This gift code has expired.');

  // 2. Create auth user
  const tempPassword = crypto.randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError) throw authError;

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
    authUserId: authData.user.id,
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

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_ANNUAL }],
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
