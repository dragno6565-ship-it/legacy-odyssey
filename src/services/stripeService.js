const { stripe } = require('../config/stripe');
const familyService = require('./familyService');
const bookService = require('./bookService');

/**
 * Stripe Price IDs — single plan with two billing options + domain add-ons.
 *
 * Subscription: $4.99/month or $49.99/year
 * Custom domain: $5.99 one-time setup fee
 * Setup fee: $5.99 one-time (monthly subscribers only)
 * Additional domains: $12.99/year
 */
const PRICES = {
  subscription: {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual: process.env.STRIPE_PRICE_ANNUAL,
    annualIntro: process.env.STRIPE_PRICE_ANNUAL_INTRO, // $49.99/yr with first-year coupon
  },
  setupFee: process.env.STRIPE_PRICE_SETUP,
  additionalDomain: process.env.STRIPE_PRICE_ADDITIONAL_DOMAIN,
  annualIntroCoupon: process.env.STRIPE_ANNUAL_INTRO_COUPON, // $20.99 off first invoice
};

/**
 * Resolve the Stripe subscription price ID for a billing period.
 */
function resolvePriceId(plan, period) {
  const resolvedPeriod = period || 'monthly';
  const priceId = PRICES.subscription[resolvedPeriod];
  if (priceId) return priceId;
  throw new Error(`No Stripe price configured for period="${resolvedPeriod}"`);
}

async function createCheckoutSession({ email, subdomain, domain, period, bookType, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const resolvedPeriod = period || 'monthly';
  const priceId = resolvePriceId(null, resolvedPeriod);

  const metadata = { subdomain, period: resolvedPeriod, book_type: bookType || 'baby_book' };
  if (domain) metadata.domain = domain;

  // Build line items: subscription + setup fee for monthly only
  const line_items = [{
    price: priceId,
    quantity: 1,
  }];

  // Add one-time setup fee for monthly subscribers only (annual = no setup fee)
  if (resolvedPeriod === 'monthly') {
    line_items.push({
      price: PRICES.setupFee,
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items,
    metadata,
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

async function handleCheckoutComplete(session) {
  const email = session.customer_email || session.customer_details?.email;
  const customerName = session.customer_details?.name || null;
  const subdomain = session.metadata?.subdomain;
  const domain = session.metadata?.domain || null;
  const period = session.metadata?.period || 'monthly';
  const bookType = session.metadata?.book_type || 'baby_book';
  const stripeCustomerId = session.customer;
  const stripeSubscriptionId = session.subscription;

  const { supabaseAdmin } = require('../config/supabase');

  // Check if an existing account (free or cancelled) exists for this email — upgrade or reinstate it
  const existingFamily = await familyService.findByEmail(email);
  if (existingFamily && (existingFamily.plan !== 'paid' || existingFamily.subscription_status === 'canceled')) {
    await familyService.update(existingFamily.id, {
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: 'active',
      billing_period: period,
      plan: 'paid',
      // Clear cancellation fields on reinstatement
      cancelled_at: null,
      data_retain_until: null,
      ...(customerName ? { customer_name: customerName } : {}),
    });

    // If a custom domain was selected, kick off domain purchase
    if (domain) {
      try {
        const domainService = require('./domainService');
        const order = await domainService.createDomainOrder({
          familyId: existingFamily.id,
          domain,
          stripeSessionId: session.id,
          price: null,
        });
        domainService.purchaseAndSetupDomain(order.id).catch((err) => {
          console.error(`Background domain setup failed for ${domain}:`, err.message);
        });
      } catch (err) {
        console.error(`Failed to create domain order for ${domain}:`, err.message);
      }
    }

    return { family: existingFamily, tempPassword: null, domain };
  }

  // No existing free account — create a brand new one
  const tempPassword = require('crypto').randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError) throw authError;

  // Create family as paid (Stripe checkout = paid plan)
  const family = await familyService.create({
    email,
    authUserId: authData.user.id,
    subdomain,
    displayName: `The ${subdomain} Family`,
    stripeCustomerId,
    customerName,
    plan: 'paid',
    bookType,
  });

  // Update with subscription ID
  await familyService.update(family.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    billing_period: period,
    plan: 'paid',
  });

  // Create book with default content appropriate to product type
  if (bookType === 'family_album') {
    await bookService.createFamilyAlbumWithDefaults(family.id);
  } else {
    await bookService.createBookWithDefaults(family.id);
  }

  // Send welcome email with credentials
  try {
    const { sendWelcomeEmail } = require('./emailService');
    await sendWelcomeEmail({
      to: email,
      displayName: family.display_name || subdomain,
      tempPassword,
      bookPassword: family.book_password,
      subdomain,
      customDomain: domain || null,
    });
  } catch (emailErr) {
    console.error('Failed to send welcome email after checkout:', emailErr.message);
    // Non-fatal: account is created, email can be resent from admin
  }

  // If a custom domain was selected, kick off async domain purchase
  if (domain) {
    try {
      const domainService = require('./domainService');
      const order = await domainService.createDomainOrder({
        familyId: family.id,
        domain,
        stripeSessionId: session.id,
        price: null,
      });

      // Fire-and-forget: purchase and set up domain in background
      domainService.purchaseAndSetupDomain(order.id).catch((err) => {
        console.error(`Background domain setup failed for ${domain}:`, err.message);
      });
    } catch (err) {
      console.error(`Failed to create domain order for ${domain}:`, err.message);
      // Non-fatal: family + book are created, domain can be retried
    }
  }

  return { family, tempPassword, domain };
}

async function syncSubscriptionStatus(stripeCustomerId, status) {
  await familyService.updateSubscriptionStatus(stripeCustomerId, status);
}

async function createPortalSession(stripeCustomerId, returnUrl) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Create a Stripe Checkout session for the annual intro plan ($29/yr first year).
 */
async function createFounderCheckoutSession({ email, subdomain, domain, bookType, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const priceId = PRICES.subscription.annualIntro || PRICES.subscription.founder;
  if (!priceId) throw new Error('Annual intro price not configured');

  const metadata = { subdomain, period: 'annual', plan: 'annual_intro', book_type: bookType || 'baby_book' };
  if (domain) metadata.domain = domain;

  const sessionParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  // Apply first-year intro coupon if configured ($20.99 off → $29 first year, $49.99 after)
  if (PRICES.annualIntroCoupon) {
    sessionParams.discounts = [{ coupon: PRICES.annualIntroCoupon }];
  } else {
    sessionParams.allow_promotion_codes = true;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

async function createGiftCheckoutSession({ buyerEmail, buyerName, recipientName, recipientEmail, message, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Legacy Odyssey — 1 Year Gift for ${recipientName || 'your recipient'}`,
            description: 'One-year gift subscription. Recipient redeems a gift code to create their own account and choose their custom domain.',
            images: ['https://legacyodyssey.com/images/og-image.png'],
          },
          unit_amount: 4999, // $49.99
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'gift',
      buyer_name: buyerName || '',
      recipient_name: recipientName || '',
      recipient_email: recipientEmail || '',
      gift_message: message || '',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Create a Stripe Checkout session for purchasing an additional site ($12.99/yr).
 * Used by existing authenticated customers who want another book/domain.
 */
async function createAdditionalSiteCheckout({ stripeCustomerId, authUserId, subdomain, domain, bookName, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const metadata = {
    type: 'additional_site',
    auth_user_id: authUserId,
    subdomain,
    book_name: bookName || '',
  };
  if (domain) metadata.domain = domain;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      { price: PRICES.additionalDomain, quantity: 1 },
    ],
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

module.exports = {
  PRICES,
  createCheckoutSession,
  createFounderCheckoutSession,
  createGiftCheckoutSession,
  createAdditionalSiteCheckout,
  handleCheckoutComplete,
  syncSubscriptionStatus,
  createPortalSession,
};
