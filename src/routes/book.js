const { Router } = require('express');
const resolveFamily = require('../middleware/resolveFamily');
const { requireBookPassword, hashPassword } = require('../middleware/requireBookPassword');
const bookService = require('../services/bookService');
const { getPublicUrl } = require('../utils/imageUrl');

const router = Router();

// GET /terms — Terms of Service
router.get('/terms', (req, res) => {
  res.render('marketing/terms');
});

// GET /privacy — Privacy Policy
router.get('/privacy', (req, res) => {
  res.render('marketing/privacy');
});

// POST /verify-password
router.post('/verify-password', resolveFamily, async (req, res) => {
  // If resolveFamily couldn't find the family (e.g. Railway URL, not a subdomain),
  // fall back to looking up by slug from the hidden form field
  if (!req.family && req.body.slug) {
    const { supabaseAdmin } = require('../config/supabase');
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('subdomain', req.body.slug)
      .eq('is_active', true)
      .single();
    if (data) req.family = data;
  }

  if (!req.family) return res.status(404).render('book/not-found');

  const { password } = req.body;
  if (password && req.family.book_password &&
      password.toLowerCase() === req.family.book_password.toLowerCase()) {
    const cookieName = `book_${req.family.id}`;
    const hash = hashPassword(req.family.book_password, req.family.id);
    res.cookie(cookieName, hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });
    // Redirect back to the book page (use slug path so it works on any domain)
    const slug = req.body.slug || req.family.subdomain;
    return res.redirect(`/book/${slug}`);
  }

  res.render('book/password', { family: req.family, error: true });
});

// Stripe success callback
router.get('/stripe/success', async (req, res) => {
  const { stripe } = require('../config/stripe');
  const familyService = require('../services/familyService');
  const stripeService = require('../services/stripeService');
  const sessionId = req.query.session_id;
  if (!sessionId || !stripe) {
    return res.redirect('/');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.redirect('/');
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const subdomain = session.metadata?.subdomain;
    const domain = session.metadata?.domain || null;
    const plan = session.metadata?.plan || 'starter';
    const email = session.customer_email || session.customer_details?.email;

    // Try to find the family that the webhook already created
    let family = null;
    if (subdomain) {
      family = await familyService.findBySubdomain(subdomain);
    }
    if (!family && session.customer) {
      family = await familyService.findByStripeCustomerId(session.customer);
    }

    if (family) {
      // Webhook already processed — show success page (no temp password available)
      return res.render('marketing/success', {
        subdomain: family.subdomain,
        domain,
        appDomain,
        plan,
        email,
        tempPassword: null,
      });
    }

    // Webhook hasn't fired yet (rare) — process the checkout ourselves
    const result = await stripeService.handleCheckoutComplete(session);
    return res.render('marketing/success', {
      subdomain: result.family.subdomain,
      domain: result.domain || null,
      appDomain,
      plan,
      email,
      tempPassword: result.tempPassword,
    });
  } catch (err) {
    console.error('Stripe success handler error:', err);
  }
  res.redirect('/');
});

// GET / — Main book route (or marketing landing page)
router.get('/', resolveFamily, (req, res, next) => {
  // If no family found, show the marketing landing page
  if (req.isMarketingSite) {
    return res.render('marketing/landing');
  }
  next();
}, requireBookPassword, async (req, res, next) => {
  try {
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.status(404).render('book/not-found');

    res.render('layouts/book', {
      family: req.family,
      ...data,
      imageUrl: getPublicUrl,
    });
  } catch (err) {
    next(err);
  }
});

// Catch /book/:slug for path-based access
router.get('/book/:slug', resolveFamily, requireBookPassword, async (req, res, next) => {
  try {
    if (!req.family) return res.status(404).render('book/not-found');
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.status(404).render('book/not-found');

    res.render('layouts/book', {
      family: req.family,
      ...data,
      imageUrl: getPublicUrl,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
