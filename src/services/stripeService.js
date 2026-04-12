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
    founder: process.env.STRIPE_PRICE_FOUNDER,
  },
  setupFee: process.env.STRIPE_PRICE_SETUP,
  additionalDomain: process.env.STRIPE_PRICE_ADDITIONAL_DOMAIN,
};

const FOUNDER_LIMIT = 100;

/**
 * Resolve the Stripe subscription price ID for a billing period.
 */
function resolvePriceId(plan, period) {
  const resolvedPeriod = period || 'monthly';
  const priceId = PRICES.subscription[resolvedPeriod];
  if (priceId) return priceId;
  throw new Error(`No Stripe price configured for period="${resolvedPeriod}"`);
}

async function createCheckoutSession({ email, subdomain, domain, period, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const resolvedPeriod = period || 'monthly';
  const priceId = resolvePriceId(null, resolvedPeriod);

  const metadata = { subdomain, period: resolvedPeriod };
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
  });

  // Update with subscription ID
  await familyService.update(family.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    billing_period: period,
    plan: 'paid',
  });

  // Create book with default content
  await bookService.createBookWithDefaults(family.id);

  // Send welcome email with credentials
  try {
    const { sendWelcomeEmail } = require('./emailService');
    await sendWelcomeEmail({
      to: email,
      displayName: family.display_name || subdomain,
      tempPassword,
      bookPassword: 'legacy',
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
 * Count how many founder subscriptions have been created.
 */
async function getFounderCount() {
  if (!stripe) return 0;
  const subs = await stripe.subscriptions.list({
    price: PRICES.subscription.founder,
    limit: 100,
    status: 'all',
  });
  // Only count active/trialing — not canceled ones
  return subs.data.filter(s => ['active', 'trialing', 'past_due'].includes(s.status)).length;
}

/**
 * Create a Stripe Checkout session for the founder annual plan ($29/yr).
 * Enforces the 100-spot limit before creating.
 */
async function createFounderCheckoutSession({ email, subdomain, domain, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');
  if (!PRICES.subscription.founder) throw new Error('STRIPE_PRICE_FOUNDER not configured');

  const metadata = { subdomain, period: 'founder', plan: 'founder' };
  if (domain) metadata.domain = domain;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: PRICES.subscription.founder, quantity: 1 }],
    metadata,
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

async function createGiftCheckoutSession({ buyerEmail, buyerName, recipientName, recipientEmail, message, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: buyerEmail,
    line_items: [
      { price: PRICES.subscription.annual, quantity: 1 },
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
  FOUNDER_LIMIT,
  createCheckoutSession,
  createFounderCheckoutSession,
  getFounderCount,
  createGiftCheckoutSession,
  createAdditionalSiteCheckout,
  handleCheckoutComplete,
  syncSubscriptionStatus,
  createPortalSession,
};
