const { Router } = require('express');
const stripeService = require('../../services/stripeService');
const requireAuth = require('../../middleware/requireAuth');

const router = Router();

// POST /api/stripe/create-checkout
router.post('/create-checkout', async (req, res, next) => {
  try {
    const { email, domain, period, subdomain: legacySubdomain, book_type, ref } = req.body;

    // Support both new domain flow and legacy subdomain flow
    const subdomain = domain
      ? domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
      : legacySubdomain;

    if (!email || (!domain && !subdomain)) {
      return res.status(400).json({ error: 'email and domain (or subdomain) are required' });
    }

    const validPeriods = ['monthly', 'annual'];
    const resolvedPeriod = validPeriods.includes(period) ? period : 'monthly';
    const resolvedBookType = 'baby_book'; // Family Album product retired

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createCheckoutSession({
      email,
      subdomain,
      domain: domain || null,
      period: resolvedPeriod,
      bookType: resolvedBookType,
      ref: ref || null,
      successUrl: `https://${appDomain}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/create-gift-checkout
router.post('/create-gift-checkout', async (req, res, next) => {
  try {
    const {
      buyerEmail,
      buyerName,
      recipientName,
      recipientEmail,
      message,
      giftMessage,
      deliveryMethod,
      scheduledDate,
      plan,
    } = req.body;

    if (!buyerEmail) {
      return res.status(400).json({ error: 'buyerEmail is required' });
    }
    if (!recipientName) {
      return res.status(400).json({ error: 'recipientName is required' });
    }
    // Recipient email is required only when we're emailing the recipient.
    // For deliveryMethod 'print' the buyer hands over the certificate themselves.
    if (deliveryMethod !== 'print' && !recipientEmail) {
      return res.status(400).json({ error: 'recipientEmail is required' });
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createGiftCheckoutSession({
      buyerEmail,
      buyerName,
      recipientName,
      recipientEmail,
      message: message || giftMessage,
      deliveryMethod,
      scheduledDate,
      plan: plan === 'childhood' ? 'childhood' : 'annual',
      successUrl: `https://${appDomain}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}/gift`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/create-gift-payment-intent
// Powers the on-brand embedded checkout (Stripe Payment Element). Returns the
// PaymentIntent client secret + the publishable key the browser needs to mount
// Elements. Fulfillment happens on `payment_intent.succeeded` in the webhook.
router.post('/create-gift-payment-intent', async (req, res, next) => {
  try {
    const {
      buyerEmail, buyerName, recipientName, recipientEmail,
      message, giftMessage, deliveryMethod, scheduledDate, plan,
    } = req.body;

    if (!buyerEmail) return res.status(400).json({ error: 'buyerEmail is required' });
    if (!recipientName) return res.status(400).json({ error: 'recipientName is required' });
    if (deliveryMethod !== 'print' && !recipientEmail) {
      return res.status(400).json({ error: 'recipientEmail is required' });
    }

    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return res.status(503).json({ error: 'Embedded checkout is not configured yet (missing publishable key).' });
    }

    const result = await stripeService.createGiftPaymentIntent({
      buyerEmail, buyerName, recipientName, recipientEmail,
      message: message || giftMessage,
      deliveryMethod,
      scheduledDate,
      plan: plan === 'childhood' ? 'childhood' : 'annual',
    });

    res.json({
      clientSecret: result.clientSecret,
      publishableKey,
      amount: result.amount,
      plan: result.plan,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/create-signup-intent
// Embedded (Payment Element) signup. Monthly/Annual -> default_incomplete
// subscription; Childhood -> one-time PaymentIntent. Returns clientSecret +
// publishable key. Provisioning (account + book + domain) happens in the
// webhook, guarded by signup_flow='embedded'. Preview flow — does NOT touch the
// live hosted signup.
router.post('/create-signup-intent', async (req, res, next) => {
  try {
    const { email, domain, subdomain, period, ref } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    const sub = (domain ? String(domain).split('.')[0] : subdomain) || '';
    if (!sub) return res.status(400).json({ error: 'domain or subdomain is required' });

    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return res.status(503).json({ error: 'Embedded checkout is not configured yet (missing publishable key).' });
    }

    const resolved = period === 'childhood' ? 'childhood' : (period === 'annual' ? 'annual' : 'monthly');
    let result;
    if (resolved === 'childhood') {
      result = await stripeService.createSignupChildhoodIntent({ email, subdomain: sub, domain: domain || null, ref });
    } else {
      result = await stripeService.createSignupSubscription({ email, subdomain: sub, domain: domain || null, period: resolved, ref });
    }

    res.json({
      clientSecret: result.clientSecret,
      publishableKey,
      period: resolved,
      mode: resolved === 'childhood' ? 'payment' : 'subscription',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/redeem-gift
router.post('/redeem-gift', async (req, res, next) => {
  try {
    const { code, email, domain } = req.body;
    if (!code || !email) {
      return res.status(400).json({ error: 'code and email are required' });
    }

    const giftService = require('../../services/giftService');
    const result = await giftService.redeemGiftCode({ code, email, domain });

    res.json({
      success: true,
      subdomain: result.family.subdomain,
      domain: result.domain,
    });
  } catch (err) {
    console.error('redeem-gift error:', err.message, err.stack);
    // Always return JSON so the client can display the actual error.
    // Previously only gift-code errors returned JSON; everything else fell
    // through to next(err) which returned HTML, which the client parsed as
    // an empty data.error and showed the generic "Something went wrong".
    const status = err.message.includes('gift code') ? 400 : 500;
    return res.status(status).json({ error: err.message || 'Redemption failed.' });
  }
});

// POST /api/stripe/create-founder-checkout
router.post('/create-founder-checkout', async (req, res, next) => {
  try {
    const { email, domain, subdomain: legacySubdomain, book_type, ref } = req.body;

    const subdomain = domain
      ? domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
      : legacySubdomain;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const resolvedBookType = 'baby_book'; // Family Album product retired

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createFounderCheckoutSession({
      email,
      subdomain,
      domain: domain || null,
      bookType: resolvedBookType,
      ref: ref || null,
      successUrl: `https://${appDomain}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/create-founder-page-checkout
// Used only by the hidden /preview/founder landing page (shared privately
// with friends and early supporters). Identical shape to the public
// /create-founder-checkout endpoint above, but uses the $29/year flat
// founder price with no coupon.
router.post('/create-founder-page-checkout', async (req, res, next) => {
  try {
    const { email, domain, subdomain: legacySubdomain, book_type, founderNote } = req.body;

    const subdomain = domain
      ? domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
      : legacySubdomain;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!domain && !subdomain) {
      return res.status(400).json({ error: 'domain is required' });
    }

    const resolvedBookType = 'baby_book';

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createFounderPageCheckoutSession({
      email,
      subdomain,
      domain: domain || null,
      bookType: resolvedBookType,
      founderNote: founderNote || null,
      successUrl: `https://${appDomain}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      // Cancel returns them to the hidden founder page, not the public home
      cancelUrl: `https://${appDomain}/preview/founder`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/create-childhood-checkout — Childhood Plan ($450 / 18 years, one-time)
router.post('/create-childhood-checkout', async (req, res, next) => {
  try {
    const { email, domain, subdomain: legacySubdomain, ref } = req.body;

    const subdomain = domain
      ? domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
      : legacySubdomain;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!domain && !subdomain) {
      return res.status(400).json({ error: 'domain is required' });
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createChildhoodCheckoutSession({
      email,
      subdomain,
      domain: domain || null,
      bookType: 'baby_book',
      ref: ref || null,
      successUrl: `https://${appDomain}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/create-additional-site-checkout — Purchase another site
router.post('/create-additional-site-checkout', requireAuth, async (req, res, next) => {
  try {
    const { subdomain, domain, bookName } = req.body;
    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!req.family.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found. Please contact support.' });
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createAdditionalSiteCheckout({
      stripeCustomerId: req.family.stripe_customer_id,
      authUserId: req.user.id,
      subdomain,
      domain: domain || null,
      bookName: bookName || '',
      successUrl: `https://${appDomain}/additional-site/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/portal — Billing management
router.post('/portal', requireAuth, async (req, res, next) => {
  try {
    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';

    if (!req.family.stripe_customer_id) {
      // No Stripe customer yet (e.g. trial account) — send them to the website to subscribe
      return res.json({ url: `https://${appDomain}/#pricing`, isPortal: false });
    }

    const returnUrl = req.body.return_url || `https://${appDomain}`;
    const session = await stripeService.createPortalSession(
      req.family.stripe_customer_id,
      returnUrl
    );

    res.json({ url: session.url, isPortal: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
