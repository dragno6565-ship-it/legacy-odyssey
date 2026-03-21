const { stripe } = require('../config/stripe');
const familyService = require('./familyService');
const bookService = require('./bookService');

/**
 * Stripe Price IDs — single plan with two billing options + domain add-ons.
 *
 * Subscription: $4.99/month or $49.99/year
 * Custom domain: $10.99 one-time setup fee
 * Additional domains: $12.99/year
 */
const PRICES = {
  subscription: {
    monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1TDVGGQzzNThrLYKcu32HMg1',
    annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1TDVMiQzzNThrLYKNwthzxO8',
  },
  domainSetup: process.env.STRIPE_PRICE_DOMAIN_SETUP || 'price_1TDVHGQzzNThrLYKzOoEoN0I',
  additionalDomain: process.env.STRIPE_PRICE_ADDITIONAL_DOMAIN || 'price_1TDVIAQzzNThrLYKNnMljEkp',
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

async function createCheckoutSession({ email, subdomain, domain, period, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const resolvedPeriod = period || 'monthly';
  const priceId = resolvePriceId(null, resolvedPeriod);

  const metadata = { subdomain, period: resolvedPeriod };
  if (domain) metadata.domain = domain;

  // Build line items: subscription + optional domain setup fee
  const line_items = [{
    price: priceId,
    quantity: 1,
  }];

  // Add domain setup fee if customer wants a custom domain
  if (domain) {
    line_items.push({
      price: PRICES.domainSetup,
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

async function handleCheckoutComplete(session) {
  const email = session.customer_email || session.customer_details?.email;
  const subdomain = session.metadata?.subdomain;
  const domain = session.metadata?.domain || null;
  const period = session.metadata?.period || 'monthly';
  const stripeCustomerId = session.customer;
  const stripeSubscriptionId = session.subscription;

  // Create auth user in Supabase
  const { supabaseAdmin } = require('../config/supabase');
  const tempPassword = require('crypto').randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError) throw authError;

  // Create family
  const family = await familyService.create({
    email,
    authUserId: authData.user.id,
    subdomain,
    displayName: `The ${subdomain} Family`,
    stripeCustomerId,
  });

  // Update with subscription ID and plan details
  await familyService.update(family.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    billing_period: period,
  });

  // Create book with default content
  await bookService.createBookWithDefaults(family.id);

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

module.exports = {
  PRICES,
  createCheckoutSession,
  handleCheckoutComplete,
  syncSubscriptionStatus,
  createPortalSession,
};
