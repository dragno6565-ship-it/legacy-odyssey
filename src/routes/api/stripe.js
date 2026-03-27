const { Router } = require('express');
const stripeService = require('../../services/stripeService');
const requireAuth = require('../../middleware/requireAuth');

const router = Router();

// POST /api/stripe/create-checkout
router.post('/create-checkout', async (req, res, next) => {
  try {
    const { email, domain, period, subdomain: legacySubdomain } = req.body;

    // Support both new domain flow and legacy subdomain flow
    const subdomain = domain
      ? domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
      : legacySubdomain;

    if (!email || (!domain && !subdomain)) {
      return res.status(400).json({ error: 'email and domain (or subdomain) are required' });
    }

    const validPeriods = ['monthly', 'annual'];
    const resolvedPeriod = validPeriods.includes(period) ? period : 'monthly';

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createCheckoutSession({
      email,
      subdomain,
      domain: domain || null,
      period: resolvedPeriod,
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
    const { buyerEmail, buyerName, recipientEmail, message } = req.body;
    if (!buyerEmail) {
      return res.status(400).json({ error: 'buyerEmail is required' });
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createGiftCheckoutSession({
      buyerEmail,
      buyerName,
      recipientEmail,
      message,
      successUrl: `https://${appDomain}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}/gift`,
    });

    res.json({ url: session.url, sessionId: session.id });
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
    if (err.message.includes('gift code')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// POST /api/stripe/portal — Billing management
router.post('/portal', requireAuth, async (req, res, next) => {
  try {
    if (!req.family.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const returnUrl = req.body.return_url || `https://${process.env.APP_DOMAIN || 'legacyodyssey.com'}`;
    const session = await stripeService.createPortalSession(
      req.family.stripe_customer_id,
      returnUrl
    );

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
