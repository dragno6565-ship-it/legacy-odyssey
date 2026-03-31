const { Router } = require('express');
const { supabaseAnon } = require('../config/supabase');
const familyService = require('../services/familyService');
const stripeService = require('../services/stripeService');

const router = Router();

const COOKIE_NAME = 'lo_account';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function getFamily(req) {
  return req.signedCookies[COOKIE_NAME] || null;
}

// GET /account — login page (or redirect if already logged in)
router.get('/', (req, res) => {
  if (getFamily(req)) return res.redirect('/account/dashboard');
  res.render('marketing/account-login', { error: null });
});

// POST /account/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('marketing/account-login', { error: 'Please enter your email and password.' });
  }

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) {
      return res.render('marketing/account-login', { error: 'Incorrect email or password. Please try again.' });
    }

    const family = await familyService.findByAuthUserId(data.user.id);
    if (!family) {
      return res.render('marketing/account-login', { error: 'No account found for this email.' });
    }

    res.cookie(COOKIE_NAME, family.id, {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });

    res.redirect('/account/dashboard');
  } catch (err) {
    res.render('marketing/account-login', { error: 'Something went wrong. Please try again.' });
  }
});

// GET /account/dashboard
router.get('/dashboard', async (req, res) => {
  const familyId = getFamily(req);
  if (!familyId) return res.redirect('/account');

  try {
    const { data: families, error } = await require('../config/supabase').supabaseAdmin
      .from('families')
      .select('id, email, display_name, subscription_status, billing_period, stripe_customer_id, stripe_subscription_id')
      .eq('id', familyId)
      .single();

    if (error || !families) {
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/account');
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    res.render('marketing/account-dashboard', { family: families, appDomain, error: null });
  } catch (err) {
    res.render('marketing/account-dashboard', { family: null, appDomain: process.env.APP_DOMAIN || 'legacyodyssey.com', error: 'Could not load account details.' });
  }
});

// POST /account/portal — redirect to Stripe customer portal
router.post('/portal', async (req, res) => {
  const familyId = getFamily(req);
  if (!familyId) return res.redirect('/account');

  try {
    const { data: family } = await require('../config/supabase').supabaseAdmin
      .from('families')
      .select('stripe_customer_id')
      .eq('id', familyId)
      .single();

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';

    if (!family || !family.stripe_customer_id) {
      return res.redirect(`https://${appDomain}/#pricing`);
    }

    const session = await stripeService.createPortalSession(
      family.stripe_customer_id,
      `https://${appDomain}/account/dashboard`
    );
    res.redirect(session.url);
  } catch (err) {
    res.redirect('/account/dashboard?error=portal');
  }
});

// GET /account/logout
router.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/account');
});

module.exports = router;
