const { Router } = require('express');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const { supabaseAnon, supabaseAdmin } = require('../config/supabase');
const familyService = require('../services/familyService');
const bookService = require('../services/bookService');
const videoService = require('../services/videoService');
const galleryService = require('../services/galleryService');
const contactService = require('../services/contactService');
const photoService = require('../services/photoService');
const stripeService = require('../services/stripeService');
const { getPublicUrl } = require('../utils/imageUrl');

const router = Router();

const COOKIE_NAME = 'lo_account';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Photo upload (multer) ───────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFamilyId(req) {
  return req.signedCookies[COOKIE_NAME] || null;
}

/**
 * Middleware: require a valid account session cookie.
 * Attaches req.family for use in route handlers.
 */
async function requireAccountSession(req, res, next) {
  const familyId = getFamilyId(req);
  if (!familyId) return res.redirect('/account');
  try {
    const family = await familyService.findById(familyId);
    if (!family) {
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/account');
    }
    req.family = family;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Sanitize HTML from the Quill rich-text editor.
 * Allows only basic formatting — no scripts, no styles, no attributes.
 */
function sanitizeBookHtml(dirty) {
  if (!dirty) return '';
  // Strip any literal &lt;p&gt;&lt;/p&gt; artifacts left over from old escaped rendering
  const cleaned = dirty.replace(/&lt;p&gt;&lt;\/p&gt;/gi, '').replace(/&lt;p&gt;|&lt;\/p&gt;/gi, '').trim();
  return sanitizeHtml(cleaned, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'ol', 'ul', 'li', 'h2', 'h3'],
    allowedAttributes: {},
  });
}

const APP_DOMAIN = () => process.env.APP_DOMAIN || 'legacyodyssey.com';

// ─── Auth routes ─────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  if (getFamilyId(req)) return res.redirect('/account/dashboard');
  res.render('marketing/account-login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('marketing/account-login', { error: res.locals.t('auth.err_missing') });
  }
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) {
      return res.render('marketing/account-login', { error: res.locals.t('auth.err_incorrect') });
    }
    const family = await familyService.findByAuthUserId(data.user.id);
    if (!family) {
      return res.render('marketing/account-login', { error: res.locals.t('auth.err_no_account') });
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
    res.render('marketing/account-login', { error: res.locals.t('auth.err_generic') });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/account');
});

// ─── Multi-site: switch the active site ───────────────────────────────────────
// A customer with more than one site (e.g. one per child) picks which site the
// dashboard + editor act on. Verifies the target shares the current session's
// auth_user_id before moving the session cookie to it (so you can only switch to
// your own sites).
router.post('/switch-site', requireAccountSession, async (req, res) => {
  const targetId = req.body.familyId;
  // Whitelist the return path (avoid open redirect): only the editor or dashboard.
  const returnTo = req.body.returnTo === '/account/book' ? '/account/book' : '/account/dashboard';
  if (!targetId || targetId === req.family.id) return res.redirect(returnTo);
  try {
    const target = await familyService.findById(targetId);
    const sameOwner = target && req.family.auth_user_id && target.auth_user_id === req.family.auth_user_id;
    if (!sameOwner) return res.redirect(returnTo);
    res.cookie(COOKIE_NAME, target.id, {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res.redirect(`${returnTo}?switched=1`);
  } catch (err) {
    return res.redirect(returnTo);
  }
});

// ─── Multi-site: add a site from the web dashboard ────────────────────────────
// The mobile app buys extra sites via /api/stripe/create-additional-site-checkout
// (Bearer auth). The web dashboard uses the lo_account cookie, so it needs its own
// cookie-authenticated entry point. Same price as a fresh signup: $29 first year,
// then $49.99/year.
router.get('/add-site', requireAccountSession, (req, res) => {
  res.render('marketing/add-site', { family: req.family, appDomain: APP_DOMAIN(), error: null });
});

router.post('/add-site/checkout', requireAccountSession, async (req, res, next) => {
  try {
    const stripeService = require('../services/stripeService');
    const subdomain = (req.body.subdomain || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const domain = ((req.body.domain || '').trim().toLowerCase() || null);
    const bookName = (req.body.bookName || '').trim();
    if (!subdomain) return res.redirect('/account/add-site?error=missing');
    if (!req.family.auth_user_id) return res.redirect('/account/add-site?error=account');
    const appDomain = APP_DOMAIN();
    const session = await stripeService.createAdditionalSiteCheckout({
      email: req.family.email,
      authUserId: req.family.auth_user_id,
      subdomain,
      domain,
      bookName,
      successUrl: `https://${appDomain}/additional-site/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}/account/add-site`,
    });
    return res.redirect(303, session.url);
  } catch (err) { next(err); }
});

// ─── Customer-initiated soft cancel (web) ─────────────────────────────────────

/**
 * POST /account/cancel
 *
 * Soft-cancels the customer's currently-active family (the one in their session
 * cookie). If their session family is the Primary AND they have other linked
 * sites, returns 400 with the list — the form should re-prompt for promote/cancel-all.
 *
 * Body:
 *   { all: true }                                   → cancel ALL linked families
 *   { promoteFamilyId: "<uuid>" }                   → cancel session family (primary), promote
 *                                                     the named secondary
 *   {}                                              → cancel just session family (only valid if
 *                                                     it's not primary, or it's the only family)
 */
router.post('/cancel', requireAccountSession, async (req, res, next) => {
  try {
    const subscriptionService = require('../services/subscriptionService');

    // Cancel All
    if (req.body.all === 'true' || req.body.all === true) {
      if (!req.family.auth_user_id) {
        return res.redirect('/account/dashboard?error=' + encodeURIComponent('Cannot cancel all — no auth user linked'));
      }
      await subscriptionService.softCancelAllForUser(req.family.auth_user_id, { source: 'customer-web' });
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/account?cancelled=all');
    }

    // Single-family path: figure out if it's primary AND there are others
    const linked = req.family.auth_user_id
      ? await familyService.findAllByAuthUserId(req.family.auth_user_id)
      : [req.family];
    const isPrimary = await subscriptionService.isPrimaryFamily(req.family);
    const otherActive = linked.filter(f => f.id !== req.family.id && !f.archived_at);

    if (isPrimary && otherActive.length > 0) {
      const promoteId = req.body.promoteFamilyId;
      if (!promoteId) {
        // Re-render dashboard with the choice prompt — the view will offer promote vs cancel-all
        return res.redirect('/account/dashboard?cancel_blocked=primary_with_secondaries');
      }
      const promoteTarget = otherActive.find(f => f.id === promoteId);
      if (!promoteTarget) {
        return res.redirect('/account/dashboard?error=' + encodeURIComponent('Invalid promotion target'));
      }
      await subscriptionService.promoteSecondaryToPrimary(promoteTarget, req.family, { source: 'customer-web' });
      await subscriptionService.softCancelFamily(req.family, { source: 'customer-web' });
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/account?cancelled=promoted');
    }

    // Not primary, or only family — straightforward soft cancel
    await subscriptionService.softCancelFamily(req.family, { source: 'customer-web' });
    res.clearCookie(COOKIE_NAME);
    return res.redirect('/account?cancelled=single');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /account/reactivate-checkout
 *
 * Customer-facing "Reactivate" flow for an archived family. Creates a new
 * Stripe Checkout session for the standard annual price; on completion the
 * webhook will un-archive the family, re-enable Spaceship auto-renew, and
 * send the welcome-back email. All book content is preserved (we only
 * archived; nothing was deleted).
 */
router.post('/reactivate-checkout', requireAccountSession, async (req, res, next) => {
  try {
    const family = req.family;
    if (!family.archived_at) {
      return res.redirect('/account/dashboard?error=' + encodeURIComponent('Your subscription is already active.'));
    }
    const { stripe } = require('../config/stripe');
    if (!stripe) throw new Error('Stripe not configured');

    let customerId = family.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: family.email,
        metadata: { family_id: family.id },
      });
      customerId = customer.id;
      await familyService.update(family.id, { stripe_customer_id: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ANNUAL, quantity: 1 }],
      metadata: { type: 'reactivation', family_id: family.id },
      subscription_data: { metadata: { family_id: family.id, type: 'reactivation' } },
      success_url: `https://${APP_DOMAIN()}/account/dashboard?reactivated=1`,
      cancel_url: `https://${APP_DOMAIN()}/account/dashboard`,
    });

    res.redirect(session.url);
  } catch (err) {
    next(err);
  }
});

// ─── Forgot / Reset password ──────────────────────────────────────────────────

router.get('/forgot-password', (req, res) => {
  res.render('marketing/account-forgot-password', { sent: false, error: null });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.render('marketing/account-forgot-password', { sent: false, error: res.locals.t('auth.err_missing_email') });
  }
  try {
    // Generate a branded recovery link via admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `https://${APP_DOMAIN()}/account/reset-password`,
      },
    });

    if (!linkError && linkData?.properties?.action_link) {
      const emailService = require('../services/emailService');
      await emailService.sendPasswordResetEmail({
        to: email.trim().toLowerCase(),
        resetUrl: linkData.properties.action_link,
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err.message);
  }
  // Always show success — prevents email enumeration
  res.render('marketing/account-forgot-password', { sent: true, error: null });
});

router.get('/reset-password', (req, res) => {
  const { token_hash } = req.query;
  res.render('marketing/account-reset-password', {
    token_hash: token_hash || '',
    error: null,
    success: false,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

router.post('/reset-password', async (req, res) => {
  const { token_hash, new_password, confirm_password } = req.body;

  const renderError = (error) => res.render('marketing/account-reset-password', {
    token_hash: token_hash || '',
    error,
    success: false,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });

  if (!token_hash) return renderError(res.locals.t('auth.reset_err_invalid_link'));
  if (!new_password || new_password.length < 6) return renderError(res.locals.t('auth.reset_err_min6'));
  if (new_password !== confirm_password) return renderError(res.locals.t('auth.reset_err_mismatch'));

  try {
    // Create a temporary Supabase client to avoid polluting the shared anon client's session
    const { createClient } = require('@supabase/supabase-js');
    const tempClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data, error: verifyError } = await tempClient.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    if (verifyError || !data?.user) {
      console.error('verifyOtp error:', verifyError?.message);
      return renderError(res.locals.t('auth.reset_err_expired'));
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      password: new_password,
    });

    if (updateError) {
      console.error('Password update error:', updateError.message, updateError);
      return renderError(`Failed to update password: ${updateError.message}`);
    }

    res.render('marketing/account-reset-password', {
      token_hash: '', error: null, success: true,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return renderError(res.locals.t('auth.err_generic'));
  }
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.redirect('/account');
  try {
    const { data: family, error } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
    if (error || !family) {
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/account');
    }

    // Multi-family context — used by the cancel UI to show promote/cancel-all options.
    const subscriptionService = require('../services/subscriptionService');
    let linkedFamilies = [family];
    if (family.auth_user_id) {
      try { linkedFamilies = await familyService.findAllByAuthUserId(family.auth_user_id); }
      catch (err) { console.error('listing linked families failed:', err.message); }
    }
    let isPrimary = null;
    try { isPrimary = await subscriptionService.isPrimaryFamily(family); }
    catch (err) { console.error('isPrimaryFamily failed:', err.message); }

    // Referral program (B13): ensure this family has a shareable code, then
    // build the stats the dashboard card renders. Best-effort — a failure here
    // must never break the dashboard.
    let referral = null;
    try {
      const referralService = require('../services/referralService');
      await referralService.getOrCreateCodeForFamily(family);
      referral = referralService.getReferralStats(family, APP_DOMAIN());
    } catch (err) { console.error('referral stats failed:', err.message); }

    // Data for the "Share your website" card (the share-update partial): contacts,
    // circles, and which sections/galleries this book actually has.
    let contacts = [], circles = [], visibleSections = {}, galleries = [];
    let bookSettings = { unit_system: 'imperial', default_language: '' };
    try {
      const book = await bookService.getBookByFamilyId(family.id);
      if (book) {
        contacts = await contactService.listContacts(book.id);
        circles = await contactService.listCircles(book.id);
        bookSettings = { unit_system: book.unit_system || 'imperial', default_language: book.default_language || '' };
      }
      const fb = await bookService.getFullBook(family.id);
      visibleSections = (fb && fb.visibleSections) || {};
      galleries = ((fb && fb.customGalleries) || [])
        .filter((g) => g.photos && g.photos.length)
        .map((g) => ({ id: g.id, title: g.title || 'Untitled gallery' }));
    } catch (err) { console.error('dashboard share data failed:', err.message); }

    res.render('marketing/account-dashboard', {
      family,
      linkedFamilies,
      isPrimary,
      referral,
      contacts, circles, visibleSections, galleries,
      bookSettings,
      appDomain: APP_DOMAIN(),
      error: null,
    });
  } catch (err) {
    res.render('marketing/account-dashboard', { family: null, linkedFamilies: [], isPrimary: null, referral: null, appDomain: APP_DOMAIN(), error: 'Could not load account details.' });
  }
});

// POST /account/site-settings — the book's main site language + measurement units.
router.post('/site-settings', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/dashboard');
    const { SUPPORTED } = require('../i18n');
    const lang = SUPPORTED.includes(req.body.default_language) ? req.body.default_language : 'en';
    const unit = req.body.unit_system === 'metric' ? 'metric' : 'imperial';
    await bookService.updateBook(book.id, { default_language: lang, unit_system: unit });
    res.redirect('/account/dashboard?settings=1');
  } catch (err) { next(err); }
});

// GET /account/export — GDPR right of access / data portability.
// Returns a downloadable JSON copy of the account's personal data + full book.
router.get('/export', requireAccountSession, async (req, res, next) => {
  try {
    const fullBook = await bookService.getFullBook(req.family.id);
    const payload = {
      exportedAt: new Date().toISOString(),
      notice: 'This file is a copy of the personal data Legacy Odyssey holds for your account, provided under your right of access and data portability. To request deletion, see your account or email help@legacyodyssey.com.',
      account: req.family,
      book: fullBook?.book || null,
      visibleSections: fullBook?.visibleSections || {},
    };
    const filename = `legacy-odyssey-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) { next(err); }
});

// POST /account/portal — Stripe billing portal
router.post('/portal', async (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.redirect('/account');
  try {
    const { data: family } = await supabaseAdmin
      .from('families')
      .select('stripe_customer_id')
      .eq('id', familyId)
      .single();
    if (!family?.stripe_customer_id) {
      return res.redirect(`https://${APP_DOMAIN()}/#pricing`);
    }
    const session = await stripeService.createPortalSession(
      family.stripe_customer_id,
      `https://${APP_DOMAIN()}/account/dashboard`
    );
    res.redirect(session.url);
  } catch (err) {
    res.redirect('/account/dashboard?error=portal');
  }
});

// ─── Photo upload (account-session authenticated) ─────────────────────────────

router.post('/upload', requireAccountSession, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const section = req.body.section || 'general';
    const identifier = req.body.identifier || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await photoService.upload(req.family.id, section, identifier, req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Reposition a photo (focal point) ────────────────────────────────────────
// Web twin of the app's PUT /api/books/mine/photo-position. Saves an
// object-position focal point (x%, y%) into books.photo_positions (JSONB,
// keyed by storage path), which the viewer already honors via photoPos().
// Lets web customers stop heads being cropped out of cover-fit photos.
router.post('/book/photo-position', requireAccountSession, async (req, res, next) => {
  try {
    let { storagePath, x, y } = req.body;
    if (!storagePath || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'storagePath, x, and y are required' });
    }
    // Normalize a full public URL down to the storage path the viewer keys on.
    if (typeof storagePath === 'string' && storagePath.startsWith('http')) {
      const idx = storagePath.indexOf('/photos/');
      if (idx !== -1) storagePath = storagePath.substring(idx + '/photos/'.length);
    }
    const cx = Math.max(0, Math.min(100, Number(x)));
    const cy = Math.max(0, Math.min(100, Number(y)));

    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.json({ success: true, storagePath, x: cx, y: cy });

    const current = book.photo_positions || {};
    current[storagePath] = { x: cx, y: cy };
    const { error } = await supabaseAdmin
      .from('books')
      .update({ photo_positions: current })
      .eq('id', book.id);
    if (error) throw error;
    res.json({ success: true, storagePath, x: cx, y: cy });
  } catch (err) {
    next(err);
  }
});

// ─── Video uploads (Cloudflare Stream) — web AJAX ────────────────────────────
async function resolveBookId(req) {
  const b = await bookService.getBookByFamilyId(req.family.id);
  return b ? b.id : null;
}

// Mint a direct-upload URL + create the pending video row.
router.post('/book/videos', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    if (!bid) return res.status(400).json({ error: 'No book found.' });
    const { context, celebrationId, familyMemberId } = req.body;
    const r = await videoService.createUpload(bid, { context, celebrationId, familyMemberId });
    res.json({ uploadURL: r.uploadURL, videoId: r.video.id });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Called after the client finishes uploading — pull status/duration/poster from CF.
router.post('/book/videos/:id/finalize', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    const v = await videoService.getOne(bid, req.params.id);
    if (!v) return res.status(404).json({ error: 'Not found.' });
    res.json(await videoService.refresh(bid, v));
  } catch (err) { next(err); }
});

router.post('/book/videos/:id/caption', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    res.json(await videoService.setCaption(bid, req.params.id, req.body.caption));
  } catch (err) { next(err); }
});

router.post('/book/videos/:id/delete', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await videoService.remove(bid, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Video Moments editor page.
router.get('/book/video-moments', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    const videos = bid ? await videoService.listByContext(bid, { context: 'moments' }) : [];
    const totalMin = bid ? Math.round((await videoService.totalSeconds(bid)) / 60) : 0;
    res.render('marketing/account-book-video-moments', {
      videos, totalMin, capMin: Math.round(videoService.SITE_CAP_SECONDS / 60),
      maxClipSec: 120,
      success: req.query.success, error: req.query.error,
    });
  } catch (err) { next(err); }
});

// ─── Custom galleries ────────────────────────────────────────────────────────
// Hub: list all of this book's custom galleries.
router.get('/book/galleries', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    const galleries = bid ? await galleryService.listGalleries(bid) : [];
    const withUrls = galleries.map((g) => ({
      ...g,
      coverUrl: g.photos[0] ? getPublicUrl(g.photos[0].photo_path) : null,
      photoCount: g.photos.length,
    }));
    res.render('marketing/account-book-galleries', { galleries: withUrls, success: req.query.success || null, error: req.query.error || null });
  } catch (err) { next(err); }
});

router.post('/book/galleries', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    if (!bid) return res.redirect('/account/book');
    const g = await galleryService.createGallery(bid, req.body.title);
    res.redirect('/account/book/galleries/' + g.id);
  } catch (err) { next(err); }
});

router.get('/book/galleries/:id', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    const g = await galleryService.getGallery(bid, req.params.id);
    if (!g) return res.redirect('/account/book/galleries');
    const photos = g.photos.map((p) => ({ ...p, url: getPublicUrl(p.photo_path) }));
    res.render('marketing/account-book-gallery-detail', {
      gallery: g, photos, maxPhotos: galleryService.MAX_PHOTOS,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/galleries/:id/rename', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await galleryService.renameGallery(bid, req.params.id, req.body.title);
    // Renames come from two places: the gallery detail page and the list page.
    res.redirect(req.body.from === 'list'
      ? '/account/book/galleries?success=1'
      : '/account/book/galleries/' + req.params.id + '?success=1');
  } catch (err) { next(err); }
});

// Drag-to-reorder on the galleries list — this order is what visitors see.
router.post('/book/galleries/reorder', requireAccountSession, async (req, res) => {
  try {
    const bid = await resolveBookId(req);
    if (!bid || !Array.isArray(req.body.order)) return res.status(400).json({ error: 'Invalid order' });
    await galleryService.reorderGalleries(bid, req.body.order);
    res.json({ ok: true });
  } catch (err) {
    console.error('Gallery reorder error:', err.message);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

router.post('/book/galleries/:id/delete', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await galleryService.deleteGallery(bid, req.params.id);
    res.redirect('/account/book/galleries');
  } catch (err) { next(err); }
});

// Attach already-uploaded photo paths (client uploaded each via /account/upload). Caps at 21.
router.post('/book/galleries/:id/photos', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    const paths = Array.isArray(req.body.paths) ? req.body.paths : [];
    const added = await galleryService.addPhotos(bid, req.params.id, paths);
    res.json({ added: added.length });
  } catch (err) { next(err); }
});

router.post('/book/galleries/photo/:pid/caption', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await galleryService.setCaption(bid, req.params.pid, req.body.caption);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/book/galleries/photo/:pid/delete', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await galleryService.deletePhoto(bid, req.params.pid);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Circles: contact list + groups (migration 029) ──────────────────────────
// Phase 1: manage contacts + circles. Phase 2: Notify (magic-link emails).
router.get('/book/circles', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    const contacts = bid ? await contactService.listContacts(bid) : [];
    const circles = bid ? await contactService.listCircles(bid) : [];
    const f = req.family;
    const bookUrl = f.custom_domain ? `https://www.${f.custom_domain}` : `https://${f.subdomain}.legacyodyssey.com`;
    const { computeSiteLabel } = require('../middleware/requireBookPassword');
    const siteLabel = await computeSiteLabel(f);
    // Which sections actually have content — so the "share a section" picker only
    // lists sections this book really shows (matches the live site's nav).
    let visibleSections = {};
    let galleries = [];
    try {
      const fb = await bookService.getFullBook(f.id);
      visibleSections = (fb && fb.visibleSections) || {};
      // Individual photo galleries (with photos) so they can share a specific one.
      galleries = ((fb && fb.customGalleries) || [])
        .filter((g) => g.photos && g.photos.length)
        .map((g) => ({ id: g.id, title: g.title || 'Untitled gallery' }));
    } catch (e) { console.error('circles: book load failed:', e.message); }
    res.render('marketing/account-book-circles', {
      contacts, circles, bookUrl, siteLabel, visibleSections, galleries,
      success: req.query.success || null, error: req.query.error || null,
      sent: req.query.sent || null,
    });
  } catch (err) { next(err); }
});

// Phase 2 — Notify a circle (or Everyone) by email with each person's magic link.
router.post('/book/circles/notify', requireAccountSession, async (req, res) => {
  try {
    const bid = await resolveBookId(req);
    if (!bid) return res.redirect('/account/book/circles?error=1');
    const f = req.family;
    const bookUrl = f.custom_domain
      ? `https://www.${f.custom_domain}`
      : `https://${f.subdomain}.legacyodyssey.com`;
    const { computeSiteLabel } = require('../middleware/requireBookPassword');
    const siteLabel = await computeSiteLabel(f);
    // New flow submits a hand-picked list: contactIds[]. Legacy "target" ("" =
    // Everyone, "circle:<id>", "contact:<id>") is still accepted for safety.
    const contactIds = Array.isArray(req.body['contactIds[]']) ? req.body['contactIds[]']
      : Array.isArray(req.body.contactIds) ? req.body.contactIds
      : (req.body['contactIds[]'] ? [req.body['contactIds[]']] : (req.body.contactIds ? [req.body.contactIds] : null));
    const target = (req.body.target || req.body.circleId || '').trim();
    let circleId = null, contactId = null;
    if (!contactIds || !contactIds.length) {
      if (target.indexOf('circle:') === 0) circleId = target.slice(7);
      else if (target.indexOf('contact:') === 0) contactId = target.slice(8);
      else if (target) circleId = target; // backward-compat: bare circle id
    }
    const result = await contactService.notifyCircle({
      bookId: bid,
      circleId,
      contactId,
      contactIds: (contactIds && contactIds.length) ? contactIds : null,
      section: (req.body.section || '').trim() || null,
      note: req.body.note,
      bookUrl,
      siteLabel,
      senderName: f.display_name || null,
    });
    res.redirect('/account/book/circles?sent=' + result.sent);
  } catch (err) {
    res.redirect('/account/book/circles?error=' + encodeURIComponent(err.message || '1'));
  }
});

function _circleIds(body) {
  const v = body.circleIds;
  return Array.isArray(v) ? v : (v ? [v] : []);
}

router.post('/book/circles/contacts', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    if (!bid) return res.redirect('/account/book/circles?error=1');
    const c = await contactService.addContact(bid, req.body);
    const ids = _circleIds(req.body);
    if (ids.length) await contactService.setContactCircles(bid, c.id, ids);
    res.redirect('/account/book/circles?success=1');
  } catch (err) { res.redirect('/account/book/circles?error=' + encodeURIComponent(err.message || '1')); }
});

router.post('/book/circles/contacts/:id/update', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await contactService.updateContact(bid, req.params.id, req.body);
    await contactService.setContactCircles(bid, req.params.id, _circleIds(req.body));
    res.redirect('/account/book/circles?success=1');
  } catch (err) { res.redirect('/account/book/circles?error=1'); }
});

router.post('/book/circles/contacts/:id/delete', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await contactService.archiveContact(bid, req.params.id);
    res.redirect('/account/book/circles?success=1');
  } catch (err) { res.redirect('/account/book/circles?error=1'); }
});

router.post('/book/circles', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    if (!bid) return res.redirect('/account/book/circles?error=1');
    await contactService.createCircle(bid, req.body.name);
    res.redirect('/account/book/circles?success=1');
  } catch (err) { res.redirect('/account/book/circles?error=' + encodeURIComponent(err.message || '1')); }
});

router.post('/book/circles/:id/rename', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await contactService.renameCircle(bid, req.params.id, req.body.name);
    res.redirect('/account/book/circles?success=1');
  } catch (err) { res.redirect('/account/book/circles?error=1'); }
});

router.post('/book/circles/:id/delete', requireAccountSession, async (req, res, next) => {
  try {
    const bid = await resolveBookId(req);
    await contactService.archiveCircle(bid, req.params.id);
    res.redirect('/account/book/circles?success=1');
  } catch (err) { res.redirect('/account/book/circles?error=1'); }
});

// ─── Book section overview ────────────────────────────────────────────────────

router.get('/book', requireAccountSession, async (req, res, next) => {
  try {
    const fullBook = await bookService.getFullBook(req.family.id);
    let linkedFamilies = [req.family];
    if (req.family.auth_user_id) {
      try { linkedFamilies = await familyService.findAllByAuthUserId(req.family.auth_user_id); }
      catch (e) { console.error('book editor: linked families failed:', e.message); }
    }
    res.render('marketing/account-book', {
      family: req.family,
      linkedFamilies,
      book: fullBook?.book || null,
      visibleSections: fullBook?.visibleSections || {},
    });
  } catch (err) { next(err); }
});

// ─── Child Info ───────────────────────────────────────────────────────────────

router.get('/book/child-info', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    res.render('marketing/account-book-child-info', {
      family: req.family,
      book: book || {},
      heroUrl: book?.hero_image_path ? getPublicUrl(book.hero_image_path) : null,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/child-info', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const allowed = [
      'child_first_name', 'child_middle_name', 'child_last_name',
      'birth_date', 'birth_time', 'birth_weight_lbs', 'birth_weight_oz',
      'birth_length_inches', 'birth_city', 'birth_state', 'birth_hospital',
      'name_meaning', 'name_quote', 'hero_image_path', 'parent_quote', 'parent_quote_attribution',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key] || null;
    }
    // Typed columns must be null, not empty string
    for (const col of ['birth_date', 'birth_time', 'birth_weight_lbs', 'birth_weight_oz', 'birth_length_inches']) {
      if (col in updates && !updates[col]) updates[col] = null;
    }
    // Welcome-page vital-stat visibility — six checkboxes named wf_*. A checkbox
    // only posts a value when checked, so an absent key means unchecked = hidden.
    const WF_KEYS = ['born', 'time', 'weight', 'length', 'birthplace', 'hospital'];
    const welcomeFields = {};
    for (const k of WF_KEYS) welcomeFields[k] = req.body['wf_' + k] !== undefined;
    updates.welcome_fields = welcomeFields;
    await bookService.updateBook(book.id, updates);
    res.redirect('/account/book/child-info?success=1');
  } catch (err) {
    console.error('Child info save error:', err.message);
    res.redirect('/account/book/child-info?error=1');
  }
});

// ─── Birth Story ─────────────────────────────────────────────────────────────

router.get('/book/birth-story', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: birthStory } = await supabaseAdmin
      .from('birth_stories').select('*').eq('book_id', book.id).maybeSingle();
    res.render('marketing/account-book-birth-story', {
      family: req.family,
      book: book || {},
      birthStory: birthStory || {},
      momPhotoUrl: birthStory?.mom_photo_1 ? getPublicUrl(birthStory.mom_photo_1) : null,
      dadPhotoUrl: birthStory?.dad_photo_1 ? getPublicUrl(birthStory.dad_photo_1) : null,
      momPhoto2Url: birthStory?.mom_photo_2 ? getPublicUrl(birthStory.mom_photo_2) : null,
      dadPhoto2Url: birthStory?.dad_photo_2 ? getPublicUrl(birthStory.dad_photo_2) : null,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/birth-story', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    await bookService.upsertBirthStory(book.id, {
      first_held_by: req.body.first_held_by || null,
      person1_label: (req.body.person1_label || '').trim() || null,
      person2_label: (req.body.person2_label || '').trim() || null,
      mom_title: (req.body.mom_title || '').trim() || null,
      mom_narrative: sanitizeBookHtml(req.body.mom_narrative),
      dad_title: (req.body.dad_title || '').trim() || null,
      dad_narrative: sanitizeBookHtml(req.body.dad_narrative),
      mom_photo_1: req.body.mom_photo_1 || null,
      dad_photo_1: req.body.dad_photo_1 || null,
      mom_photo_2: req.body.mom_photo_2 || null,
      dad_photo_2: req.body.dad_photo_2 || null,
    });
    res.redirect('/account/book/birth-story?success=1');
  } catch (err) {
    console.error('Birth story save error:', err.message);
    res.redirect('/account/book/birth-story?error=1');
  }
});

// ─── Your Journey to Us ──────────────────────────────────────────────────────

router.get('/book/journey', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: journey } = await supabaseAdmin
      .from('journey_story').select('*').eq('book_id', book.id).maybeSingle();
    let photos = [];
    if (journey) {
      const { data } = await supabaseAdmin.from('journey_photos')
        .select('*').eq('journey_id', journey.id).order('sort_order');
      photos = (data || []).map((p) => ({ ...p, url: getPublicUrl(p.photo_path) }));
    }
    res.render('marketing/account-book-journey', {
      family: req.family,
      book: book || {},
      journey: journey || {},
      photos,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/journey', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    // Milestones arrive as parallel arrays milestone_label[] / milestone_date[].
    const labels = [].concat(req.body.milestone_label || []);
    const dates = [].concat(req.body.milestone_date || []);
    const milestones = [];
    for (let i = 0; i < labels.length; i++) {
      const label = (labels[i] || '').toString().trim();
      const date = (dates[i] || '').toString().trim();
      if (label || date) milestones.push({ label, date });
    }
    await bookService.upsertJourneyStory(book.id, {
      title: (req.body.title || '').toString().trim() || null,
      intro: (req.body.intro || '').toString().trim() || null,
      story_title: (req.body.story_title || '').toString().trim() || null,
      story: sanitizeBookHtml(req.body.story),
      milestones,
      letter_text: sanitizeBookHtml(req.body.letter_text),
      letter_sign: (req.body.letter_sign || '').toString().trim() || null,
    });
    res.redirect('/account/book/journey?success=1');
  } catch (err) {
    console.error('Journey save error:', err.message);
    res.redirect('/account/book/journey?error=1');
  }
});

router.post('/book/journey/photo', requireAccountSession, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.redirect('/account/book/journey?error=no_file');
    const book = await bookService.getBookByFamilyId(req.family.id);
    let { data: journey } = await supabaseAdmin
      .from('journey_story').select('id').eq('book_id', book.id).maybeSingle();
    if (!journey) {
      const ins = await supabaseAdmin.from('journey_story').insert({ book_id: book.id }).select('id').single();
      if (ins.error) throw ins.error;
      journey = ins.data;
    }
    const ident = journey.id + '-' + Date.now();
    const result = await photoService.upload(req.family.id, 'journey', ident, req.file.buffer, req.file.mimetype);
    const { data: existing } = await supabaseAdmin.from('journey_photos')
      .select('sort_order').eq('journey_id', journey.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);
    const { error } = await supabaseAdmin.from('journey_photos').insert({
      journey_id: journey.id, photo_path: result.path, caption: null, sort_order: nextSort,
    });
    if (error) throw error;
    res.redirect('/account/book/journey?success=photo_added');
  } catch (err) {
    console.error('Journey photo upload failed:', err.message);
    res.redirect('/account/book/journey?error=photo_upload_failed');
  }
});

router.post('/book/journey/photo/:photoId/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: photo } = await supabaseAdmin.from('journey_photos')
      .select('id, journey_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/journey?error=photo_not_found');
    const { data: j } = await supabaseAdmin.from('journey_story')
      .select('id').eq('id', photo.journey_id).eq('book_id', book.id).maybeSingle();
    if (!j) return res.redirect('/account/book/journey?error=not_authorized');
    await supabaseAdmin.from('journey_photos').delete().eq('id', req.params.photoId);
    res.redirect('/account/book/journey?success=photo_deleted');
  } catch (err) { next(err); }
});

// ─── Website Sections (show / hide on the public site) ───────────────────────

router.get('/book/sections', requireAccountSession, async (req, res, next) => {
  try {
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.redirect('/account/book');
    // effective = content auto-detection with any saved overrides applied.
    const effective = data.visibleSections || {};
    // auto = pure content-based detection (overrides stripped) so a save
    // stores only deviations — a section the owner never deliberately
    // toggled keeps auto-showing when it gets content later.
    const auto = bookService.computeVisibleSections({
      ...data,
      book: { ...(data.book || {}), visible_sections: {} },
    });
    res.render('marketing/account-book-sections', {
      family: req.family,
      book: data.book || {},
      effective,
      auto,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/sections', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const KEYS = ['before', 'birth', 'birthday', 'moments', 'galleries', 'journey', 'home', 'months', 'family', 'firsts', 'holidays', 'letters', 'recipes', 'keepsakes', 'vault'];
    // Each row posts a checkbox (sec_<key>, present only when on) and a hidden
    // auto_<key> carrying the content-based default. Store an override only
    // when the chosen state differs from that default, keeping the map minimal.
    const overrides = {};
    for (const k of KEYS) {
      const checked = req.body['sec_' + k] !== undefined;
      const auto = req.body['auto_' + k] === '1';
      if (checked !== auto) overrides[k] = checked;
    }
    await bookService.updateBook(book.id, { visible_sections: overrides });
    res.redirect('/account/book/sections?success=1');
  } catch (err) {
    console.error('Sections save error:', err.message);
    res.redirect('/account/book/sections?error=1');
  }
});

// ─── Before Arrived ──────────────────────────────────────────────────────────

router.get('/book/before-arrived', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: cards } = await supabaseAdmin
      .from('before_arrived_cards').select('*').eq('book_id', book.id).order('sort_order');
    const cardsWithUrls = (cards || []).map(c => ({
      ...c, photoUrl: c.photo_path ? getPublicUrl(c.photo_path) : null,
    }));
    const { data: checklist } = await supabaseAdmin
      .from('before_arrived_checklist').select('*').eq('book_id', book.id).order('sort_order');
    res.render('marketing/account-book-before-arrived', {
      family: req.family, book: book || {}, cards: cardsWithUrls, checklist: checklist || [],
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/before-arrived', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    let cards = [];
    try { cards = JSON.parse(req.body.cards_json || '[]'); } catch (e) {}
    const cleaned = cards.map(c => ({
      title: c.title || null,
      subtitle: c.subtitle || null,
      body: c.body || null,
      photo_path: c.photo_path || null,
    }));
    await bookService.updateSectionCards('before_arrived_cards', book.id, cleaned);

    // Getting-Ready Checklist (parity with the app's Before screen).
    let checklist = [];
    try { checklist = JSON.parse(req.body.checklist_json || '[]'); } catch (e) {}
    const cleanedChecklist = checklist
      .filter(it => (it.label || '').trim())
      .map(it => ({ label: (it.label || '').trim(), is_checked: !!it.is_checked }));
    await bookService.updateSectionCards('before_arrived_checklist', book.id, cleanedChecklist);

    res.redirect('/account/book/before-arrived?success=1');
  } catch (err) {
    console.error('Before arrived save error:', err.message);
    res.redirect('/account/book/before-arrived?error=1');
  }
});

// ─── Coming Home ─────────────────────────────────────────────────────────────

router.get('/book/coming-home', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: cards } = await supabaseAdmin
      .from('coming_home_cards').select('*').eq('book_id', book.id).order('sort_order');
    const cardsWithUrls = (cards || []).map(c => ({
      ...c, photoUrl: c.photo_path ? getPublicUrl(c.photo_path) : null,
    }));
    res.render('marketing/account-book-coming-home', {
      family: req.family, book: book || {}, cards: cardsWithUrls,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/coming-home', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    let cards = [];
    try { cards = JSON.parse(req.body.cards_json || '[]'); } catch (e) {}
    const cleaned = cards.map(c => ({
      title: c.title || null,
      subtitle: c.subtitle || null,
      body: c.body || null,
      photo_path: c.photo_path || null,
    }));
    await bookService.updateSectionCards('coming_home_cards', book.id, cleaned);
    res.redirect('/account/book/coming-home?success=1');
  } catch (err) {
    console.error('Coming home save error:', err.message);
    res.redirect('/account/book/coming-home?error=1');
  }
});

// ─── Month by Month ───────────────────────────────────────────────────────────

router.get('/book/months', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: months } = await supabaseAdmin
      .from('months').select('*').eq('book_id', book.id).order('month_number');
    const monthsWithUrls = (months || []).map(m => ({
      ...m, photoUrl: m.photo_path ? getPublicUrl(m.photo_path) : null,
    }));
    res.render('marketing/account-book-months', {
      family: req.family, book: book || {}, months: monthsWithUrls,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.get('/book/months/:num', requireAccountSession, async (req, res, next) => {
  try {
    const num = parseInt(req.params.num);
    if (isNaN(num) || num < 1 || num > 12) return res.redirect('/account/book/months');
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: month } = await supabaseAdmin
      .from('months').select('*').eq('book_id', book.id).eq('month_number', num).maybeSingle();
    res.render('marketing/account-book-month-detail', {
      family: req.family, book: book || {}, month: month || { month_number: num },
      photoUrl: month?.photo_path ? getPublicUrl(month.photo_path) : null,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/months/:num', requireAccountSession, async (req, res, next) => {
  try {
    const num = parseInt(req.params.num);
    if (isNaN(num) || num < 1 || num > 12) return res.redirect('/account/book/months');
    const book = await bookService.getBookByFamilyId(req.family.id);
    // Measurement units are a book-level setting, but the toggle lives on this page.
    const unit = req.body.unit_system === 'metric' ? 'metric' : 'imperial';
    if (book.unit_system !== unit) await bookService.updateBook(book.id, { unit_system: unit });
    await bookService.upsertMonth(book.id, num, {
      label: req.body.label || null,
      highlight: req.body.highlight || null,
      weight: req.body.weight || null,
      length: req.body.length || null,
      note: req.body.note || null,
      photo_path: req.body.photo_path || null,
    });
    res.redirect(`/account/book/months/${num}?success=1`);
  } catch (err) {
    console.error('Month save error:', err.message);
    res.redirect(`/account/book/months/${req.params.num}?error=1`);
  }
});

// ─── Our Family ───────────────────────────────────────────────────────────────

router.get('/book/family', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: members } = await supabaseAdmin
      .from('family_members').select('*').eq('book_id', book.id).order('sort_order');
    const membersWithUrls = (members || []).map(m => ({
      ...m, photoUrl: m.photo_path ? getPublicUrl(m.photo_path) : null,
    }));
    res.render('marketing/account-book-family', {
      family: req.family, book: book || {}, members: membersWithUrls,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.get('/book/family/:key', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: member } = await supabaseAdmin
      .from('family_members').select('*').eq('book_id', book.id).eq('member_key', req.params.key).maybeSingle();
    // One video per family member (only if the member row exists yet).
    const memberVideos = (member && member.id)
      ? await videoService.listByContext(book.id, { context: 'family_member', familyMemberId: member.id })
      : [];
    res.render('marketing/account-book-family-member', {
      family: req.family, book: book || {},
      member: member || { member_key: req.params.key },
      photoUrl: member?.photo_path ? getPublicUrl(member.photo_path) : null,
      album1Url: member?.album_1_path ? getPublicUrl(member.album_1_path) : null,
      album2Url: member?.album_2_path ? getPublicUrl(member.album_2_path) : null,
      album3Url: member?.album_3_path ? getPublicUrl(member.album_3_path) : null,
      videos: memberVideos,
      videoContext: 'family_member',
      videoContextId: (member && member.id) || null,
      videoSingle: true,
      maxClipSec: 120,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/family/add-new', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    // Find max sort_order so new member goes to bottom
    const { data: existing } = await supabaseAdmin
      .from('family_members').select('sort_order').eq('book_id', book.id)
      .order('sort_order', { ascending: false }).limit(1);
    const maxOrder = (existing && existing.length > 0 && existing[0].sort_order != null)
      ? existing[0].sort_order : 10;
    const newKey = `custom-${Date.now()}`;
    await bookService.upsertFamilyMember(book.id, newKey, {
      name: 'New Member', relation: 'Family Member',
      sort_order: maxOrder + 1,
    });
    res.redirect(`/account/book/family/${newKey}`);
  } catch (err) { next(err); }
});

router.post('/book/family/reorder', requireAccountSession, async (req, res) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const order = req.body.order;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid order' });
    // UPDATE (not upsert) — only touches rows that already exist.
    // Upsert would fail silently for default members with no DB record
    // because name/relation are NOT NULL with no default.
    const updates = order.map((memberKey, i) =>
      supabaseAdmin.from('family_members')
        .update({ sort_order: i })
        .eq('book_id', book.id)
        .eq('member_key', memberKey)
    );
    const results = await Promise.all(updates);
    const failed = results.filter(r => r.error);
    if (failed.length) {
      console.error('Reorder partial failure:', failed.map(r => r.error.message));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Reorder error:', err.message);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

router.post('/book/family/:key/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    await supabaseAdmin.from('family_members').delete().eq('book_id', book.id).eq('member_key', req.params.key);
    res.redirect('/account/book/family');
  } catch (err) { next(err); }
});

router.post('/book/family/:key', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const allowed = [
      'name', 'relation', 'emoji', 'photo_path',
      'story', 'story2', 'quote_text', 'quote_cite',
      'meta_1_label', 'meta_1_value', 'meta_2_label', 'meta_2_value',
      'meta_3_label', 'meta_3_value', 'meta_4_label', 'meta_4_value',
      'album_1_path', 'album_1_caption', 'album_2_path', 'album_2_caption',
      'album_3_path', 'album_3_caption',
    ];
    const fields = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) fields[key] = req.body[key] || null;
    }
    if (fields.story !== undefined) fields.story = sanitizeBookHtml(fields.story) || null;
    if (fields.story2 !== undefined) fields.story2 = sanitizeBookHtml(fields.story2) || null;
    await bookService.upsertFamilyMember(book.id, req.params.key, fields);
    res.redirect(`/account/book/family/${req.params.key}?success=1`);
  } catch (err) {
    console.error('Family member save error:', err.message);
    res.redirect(`/account/book/family/${req.params.key}?error=1`);
  }
});

// ─── Celebrations ────────────────────────────────────────────────────────────

// Slugify helper — same algorithm used by migration 014 and bookService.
function celebrationSlug(title, sortOrder) {
  const base = (title || ('celebration-' + (sortOrder || 0))).toString();
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('celebration-' + (sortOrder || 0));
}

// The default label for a book's first celebration year: the child's birth
// YEAR when we know it (e.g. "2025"), else the legacy "Your First Year".
function defaultCelebrationYear(book) {
  if (book && book.birth_date) {
    const y = new Date(book.birth_date).getFullYear();
    if (!isNaN(y)) return String(y);
  }
  return 'Your First Year';
}

// The effective list of year labels for a book, non-disruptively:
//   1. explicit book.celebration_years if set
//   2. else the distinct year_labels already on existing celebrations
//   3. else a single seeded default (birth year)
// `cards` may be passed to avoid a re-query.
async function effectiveCelebrationYears(book, cards) {
  if (book.celebration_years && book.celebration_years.length) return book.celebration_years;
  if (!cards) {
    const { data } = await supabaseAdmin.from('celebrations').select('year_label').eq('book_id', book.id);
    cards = data || [];
  }
  const existing = [...new Set((cards || []).map(c => c.year_label).filter(Boolean))];
  return existing.length ? existing : [defaultCelebrationYear(book)];
}

// ─── Celebrations: index (year + celebration tree) ───────────────────────
router.get('/book/celebrations', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    // Load all celebrations for the book.
    const { data: cards } = await supabaseAdmin
      .from('celebrations').select('*').eq('book_id', book.id).order('sort_order');

    // Load photo counts per celebration for the index summary.
    let photoCounts = {};
    if (cards && cards.length > 0) {
      try {
        const { data: photos } = await supabaseAdmin
          .from('celebration_photos').select('celebration_id').in('celebration_id', cards.map(c => c.id));
        for (const p of (photos || [])) photoCounts[p.celebration_id] = (photoCounts[p.celebration_id] || 0) + 1;
      } catch (_) { /* pre-migration: silent */ }
    }

    const cardsWithMeta = (cards || []).map(c => ({
      ...c,
      photoUrl: c.photo_path ? getPublicUrl(c.photo_path) : null,
      photo_count: (photoCounts[c.id] || 0) + (c.photo_path && !photoCounts[c.id] ? 1 : 0),
    }));

    // Group by year_label. Default the first year to the birth year for fresh
    // books, without disrupting existing data (derive from existing rows first).
    const fallbackYear = defaultCelebrationYear(book);
    const yearLabels = await effectiveCelebrationYears(book, cards);
    const grouped = yearLabels.map((label) => ({
      label,
      celebrations: cardsWithMeta.filter(c => (c.year_label || fallbackYear) === label),
    }));
    // Orphan years (rows whose year_label isn't in the effective list)
    const seen = new Set(yearLabels);
    for (const c of cardsWithMeta) {
      const y = c.year_label || fallbackYear;
      if (!seen.has(y)) {
        seen.add(y);
        grouped.push({ label: y, celebrations: cardsWithMeta.filter(x => (x.year_label || 'Your First Year') === y) });
      }
    }

    res.render('marketing/account-book-celebrations', {
      family: req.family,
      book: book || {},
      years: grouped,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

// ─── Celebration years: add ──────────────────────────────────────────────
router.post('/book/celebrations/year/add', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const label = (req.body.label || '').toString().trim();
    if (!label) return res.redirect('/account/book/celebrations?error=year_label_required');
    const years = await effectiveCelebrationYears(book);
    if (years.includes(label)) return res.redirect('/account/book/celebrations?error=year_exists');
    const updated = [...years, label];
    await bookService.updateBook(book.id, { celebration_years: updated });
    res.redirect('/account/book/celebrations?success=year_added');
  } catch (err) { next(err); }
});

// ─── Celebration years: delete (also deletes all celebrations in that year) ──
router.post('/book/celebrations/year/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const label = (req.body.label || '').toString().trim();
    if (!label) return res.redirect('/account/book/celebrations?error=year_label_required');
    // Don't allow deleting the only remaining year.
    const years = await effectiveCelebrationYears(book);
    if (years.length <= 1) return res.redirect('/account/book/celebrations?error=cannot_delete_last_year');
    const updated = years.filter((y) => y !== label);
    // Cascade-delete celebrations in this year (celebration_photos cascades via FK)
    await supabaseAdmin.from('celebrations').delete().eq('book_id', book.id).eq('year_label', label);
    await bookService.updateBook(book.id, { celebration_years: updated });
    res.redirect('/account/book/celebrations?success=year_deleted');
  } catch (err) { next(err); }
});

// ─── Celebration years: rename / relabel ──────────────────────────────────
// Lets the user put in the actual year (e.g. "2025") instead of a generic label.
// Updates the year in the book's list AND relabels every celebration in it.
router.post('/book/celebrations/year/edit', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const oldLabel = (req.body.old_label || '').toString().trim();
    const newLabel = (req.body.new_label || '').toString().trim();
    if (!oldLabel || !newLabel) return res.redirect('/account/book/celebrations?error=year_label_required');
    if (oldLabel === newLabel) return res.redirect('/account/book/celebrations?success=year_renamed');

    const years = await effectiveCelebrationYears(book);
    if (years.includes(newLabel)) return res.redirect('/account/book/celebrations?error=year_exists');

    const updated = years.includes(oldLabel) ? years.map((y) => (y === oldLabel ? newLabel : y)) : [...years, newLabel];
    // Relabel every celebration that was filed under the old year.
    await supabaseAdmin.from('celebrations').update({ year_label: newLabel }).eq('book_id', book.id).eq('year_label', oldLabel);
    await bookService.updateBook(book.id, { celebration_years: updated });
    res.redirect('/account/book/celebrations?success=year_renamed');
  } catch (err) { next(err); }
});

// ─── Celebrations: create one and redirect to its editor ─────────────────
router.post('/book/celebrations/new', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const yearLabel = (req.body.year_label || 'Your First Year').toString();
    const title = (req.body.title || '').toString().trim() || 'New Celebration';

    // Next sort_order within the year
    const { data: existing } = await supabaseAdmin
      .from('celebrations').select('sort_order').eq('book_id', book.id).eq('year_label', yearLabel)
      .order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const row = {
      book_id: book.id,
      year_label: yearLabel,
      sort_order: nextSort,
      title,
    };
    // slug column may not exist yet pre-migration; insert defensively.
    try { row.slug = celebrationSlug(title, nextSort); } catch (_) {}

    const { data, error } = await supabaseAdmin.from('celebrations').insert(row).select().single();
    if (error) throw error;
    res.redirect('/account/book/celebrations/edit/' + data.id);
  } catch (err) {
    console.error('Create celebration failed:', err.message);
    res.redirect('/account/book/celebrations?error=create_failed');
  }
});

// ─── Celebration detail editor: GET ──────────────────────────────────────
router.get('/book/celebrations/edit/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: c } = await supabaseAdmin
      .from('celebrations').select('*')
      .eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.redirect('/account/book/celebrations?error=not_found');

    // Load gallery photos
    let photos = [];
    try {
      const { data } = await supabaseAdmin.from('celebration_photos')
        .select('*').eq('celebration_id', c.id).order('sort_order');
      photos = data || [];
    } catch (_) { /* pre-migration */ }
    // If pre-migration and the row has a legacy photo_path, surface it as the only photo
    if ((!photos || photos.length === 0) && c.photo_path) {
      photos = [{ id: null, photo_path: c.photo_path, caption: '', sort_order: 0 }];
    }
    const photosWithUrls = photos.map(p => ({ ...p, url: getPublicUrl(p.photo_path) }));

    // Available years for the year-picker dropdown
    const years = book.celebration_years || [defaultCelebrationYear(book)];

    // Videos attached to this celebration.
    const celebVideos = await videoService.listByContext(book.id, { context: 'celebration', celebrationId: c.id });

    res.render('marketing/account-book-celebration-detail', {
      family: req.family,
      book: book || {},
      celebration: c,
      photos: photosWithUrls,
      years,
      videos: celebVideos,
      videoContext: 'celebration',
      videoContextId: c.id,
      videoSingle: false,
      maxClipSec: 120,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

// ─── Celebration detail editor: POST save ────────────────────────────────
router.post('/book/celebrations/edit/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const patch = {
      title: (req.body.title || '').toString().trim() || 'Untitled',
      eyebrow: (req.body.eyebrow || '').toString().trim() || null,
      body: (req.body.body || '').toString().trim() || null,
      location: (req.body.location || '').toString().trim() || null,
      attendees: (req.body.attendees || '').toString().trim() || null,
      gifts: (req.body.gifts || '').toString().trim() || null,
      celebration_date: req.body.celebration_date || null,
      year_label: (req.body.year_label || 'Your First Year').toString(),
      updated_at: new Date().toISOString(),
    };
    // Regenerate slug from title (defensive — column may not exist pre-migration)
    try { patch.slug = celebrationSlug(patch.title, 0); } catch (_) {}

    // Try a defensive update — if a column doesn't exist (pre-migration), strip the unknown fields and retry.
    let { error } = await supabaseAdmin.from('celebrations').update(patch).eq('id', req.params.id).eq('book_id', book.id);
    if (error && /column .* does not exist/i.test(error.message)) {
      // Fallback for pre-migration DBs: only update the columns that definitely exist.
      const fallback = {
        title: patch.title, eyebrow: patch.eyebrow, body: patch.body,
        year_label: patch.year_label, updated_at: patch.updated_at,
      };
      ({ error } = await supabaseAdmin.from('celebrations').update(fallback).eq('id', req.params.id).eq('book_id', book.id));
    }
    if (error) throw error;
    res.redirect('/account/book/celebrations/edit/' + req.params.id + '?success=1');
  } catch (err) {
    console.error('Save celebration failed:', err.message);
    res.redirect('/account/book/celebrations/edit/' + req.params.id + '?error=save_failed');
  }
});

// ─── Celebration: delete ─────────────────────────────────────────────────
router.post('/book/celebrations/delete/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    await supabaseAdmin.from('celebrations').delete().eq('id', req.params.id).eq('book_id', book.id);
    res.redirect('/account/book/celebrations?success=celebration_deleted');
  } catch (err) { next(err); }
});

// ─── Celebration photo: upload (uses multer; uploads to Supabase Storage, then creates celebration_photos row) ──
router.post('/book/celebrations/:id/photo', requireAccountSession, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.redirect('/account/book/celebrations/edit/' + req.params.id + '?error=no_file');
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    // Verify ownership
    const { data: c } = await supabaseAdmin.from('celebrations').select('id')
      .eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.redirect('/account/book/celebrations?error=not_found');

    // Upload to storage under <familyId>/celebrations/<id>/<filename>
    const ident = c.id + '-' + Date.now();
    const result = await photoService.upload(req.family.id, 'celebrations', ident, req.file.buffer, req.file.mimetype);

    // Find next sort_order for this celebration
    const { data: existing } = await supabaseAdmin.from('celebration_photos')
      .select('sort_order').eq('celebration_id', c.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const { error } = await supabaseAdmin.from('celebration_photos').insert({
      celebration_id: c.id,
      photo_path: result.path,
      caption: null,
      sort_order: nextSort,
    });
    if (error) throw error;

    res.redirect('/account/book/celebrations/edit/' + req.params.id + '?success=photo_added');
  } catch (err) {
    console.error('Photo upload failed:', err.message);
    res.redirect('/account/book/celebrations/edit/' + req.params.id + '?error=photo_upload_failed');
  }
});

// ─── Celebration photo: update caption / sort_order ──────────────────────
router.post('/book/celebrations/photo/:photoId/edit', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    // Verify ownership via the join to celebrations
    const { data: photo } = await supabaseAdmin.from('celebration_photos').select('id, celebration_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/celebrations?error=photo_not_found');
    const { data: c } = await supabaseAdmin.from('celebrations').select('id').eq('id', photo.celebration_id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.redirect('/account/book/celebrations?error=not_authorized');

    const patch = { updated_at: new Date().toISOString() };
    if (req.body.caption !== undefined) patch.caption = (req.body.caption || '').toString().trim() || null;
    if (req.body.sort_order !== undefined) patch.sort_order = parseInt(req.body.sort_order, 10) || 0;
    await supabaseAdmin.from('celebration_photos').update(patch).eq('id', req.params.photoId);

    res.redirect('/account/book/celebrations/edit/' + c.id + '?success=photo_updated');
  } catch (err) { next(err); }
});

// ─── Celebration photo: delete ───────────────────────────────────────────
router.post('/book/celebrations/photo/:photoId/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const { data: photo } = await supabaseAdmin.from('celebration_photos').select('id, celebration_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/celebrations?error=photo_not_found');
    const { data: c } = await supabaseAdmin.from('celebrations').select('id').eq('id', photo.celebration_id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.redirect('/account/book/celebrations?error=not_authorized');

    await supabaseAdmin.from('celebration_photos').delete().eq('id', req.params.photoId);
    res.redirect('/account/book/celebrations/edit/' + c.id + '?success=photo_deleted');
  } catch (err) { next(err); }
});

// ─── Celebration photo: replace the image (used by "Replace" + client-side "Rotate") ──
router.post('/book/celebrations/photo/:photoId/replace', requireAccountSession, upload.single('file'), async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const { data: photo } = await supabaseAdmin.from('celebration_photos').select('id, celebration_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/celebrations?error=photo_not_found');
    const { data: c } = await supabaseAdmin.from('celebrations').select('id').eq('id', photo.celebration_id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.redirect('/account/book/celebrations?error=not_authorized');
    if (!req.file) return res.redirect('/account/book/celebrations/edit/' + c.id + '?error=no_file');

    const ident = c.id + '-' + Date.now();
    const result = await photoService.upload(req.family.id, 'celebrations', ident, req.file.buffer, req.file.mimetype);
    await supabaseAdmin.from('celebration_photos')
      .update({ photo_path: result.path, updated_at: new Date().toISOString() })
      .eq('id', req.params.photoId);

    res.redirect('/account/book/celebrations/edit/' + c.id + '?success=photo_replaced');
  } catch (err) {
    console.error('Celebration photo replace failed:', err.message);
    next(err);
  }
});

// ─── Your Birth Day (captioned photo gallery, migration 024) ──────────────
router.get('/book/birthday', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    let photos = [];
    try {
      const { data } = await supabaseAdmin.from('birthday_photos').select('*').eq('book_id', book.id).order('sort_order');
      photos = data || [];
    } catch (_) { photos = []; } // table may not exist yet (pre-migration-024)
    const photosWithUrls = photos.map(p => ({ ...p, url: getPublicUrl(p.photo_path) }));
    res.render('marketing/account-book-birthday', {
      family: req.family, book: book || {}, photos: photosWithUrls,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

// Add one OR many photos at once (multi-select, up to 20). Each becomes a gallery item.
router.post('/book/birthday/photo', requireAccountSession, upload.array('file', 20), async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const files = req.files || [];
    if (!files.length) return res.redirect('/account/book/birthday?error=no_file');
    const { data: existing } = await supabaseAdmin.from('birthday_photos')
      .select('sort_order').eq('book_id', book.id).order('sort_order', { ascending: false }).limit(1);
    let nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);
    for (const f of files) {
      const ident = 'bd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const result = await photoService.upload(req.family.id, 'birthday', ident, f.buffer, f.mimetype);
      await supabaseAdmin.from('birthday_photos').insert({ book_id: book.id, photo_path: result.path, caption: null, sort_order: nextSort++ });
    }
    res.redirect('/account/book/birthday?success=photos_added');
  } catch (err) {
    console.error('Birthday photo upload failed:', err.message);
    res.redirect('/account/book/birthday?error=upload_failed');
  }
});

router.post('/book/birthday/photo/:photoId/edit', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const { data: photo } = await supabaseAdmin.from('birthday_photos').select('id, book_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo || photo.book_id !== book.id) return res.redirect('/account/book/birthday?error=not_authorized');
    await supabaseAdmin.from('birthday_photos')
      .update({ caption: (req.body.caption || '').toString().trim() || null, updated_at: new Date().toISOString() })
      .eq('id', req.params.photoId);
    res.redirect('/account/book/birthday?success=caption_saved');
  } catch (err) { next(err); }
});

router.post('/book/birthday/photo/:photoId/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const { data: photo } = await supabaseAdmin.from('birthday_photos').select('id, book_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo || photo.book_id !== book.id) return res.redirect('/account/book/birthday?error=not_authorized');
    await supabaseAdmin.from('birthday_photos').delete().eq('id', req.params.photoId);
    res.redirect('/account/book/birthday?success=photo_deleted');
  } catch (err) { next(err); }
});

// Replace the image (used by "Replace" + client-side "Rotate").
router.post('/book/birthday/photo/:photoId/replace', requireAccountSession, upload.single('file'), async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const { data: photo } = await supabaseAdmin.from('birthday_photos').select('id, book_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo || photo.book_id !== book.id) return res.redirect('/account/book/birthday?error=not_authorized');
    if (!req.file) return res.redirect('/account/book/birthday?error=no_file');
    const ident = 'bd-' + Date.now();
    const result = await photoService.upload(req.family.id, 'birthday', ident, req.file.buffer, req.file.mimetype);
    await supabaseAdmin.from('birthday_photos')
      .update({ photo_path: result.path, updated_at: new Date().toISOString() })
      .eq('id', req.params.photoId);
    res.redirect('/account/book/birthday?success=photo_replaced');
  } catch (err) { console.error('Birthday photo replace failed:', err.message); next(err); }
});

// ─── Letters ──────────────────────────────────────────────────────────────────

router.get('/book/letters', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: letters } = await supabaseAdmin
      .from('letters').select('*').eq('book_id', book.id).order('sort_order');
    res.render('marketing/account-book-letters', {
      family: req.family, book: book || {}, letters: letters || [],
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/letters', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    let letters = [];
    try { letters = JSON.parse(req.body.letters_json || '[]'); } catch (e) {}
    const cleaned = letters.map(l => ({
      from_label: l.from_label || null,
      occasion: l.occasion || null,
      salutation: l.salutation || null,
      body: l.body || null,
      signature: l.signature || null,
    }));
    await bookService.updateSectionCards('letters', book.id, cleaned);
    res.redirect('/account/book/letters?success=1');
  } catch (err) {
    console.error('Letters save error:', err.message);
    res.redirect('/account/book/letters?error=1');
  }
});

// ─── Family Recipes ───────────────────────────────────────────────────────────

function recipeSlugify(title, sortOrder) {
  const base = (title || ('recipe-' + (sortOrder || 0))).toString();
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('recipe-' + (sortOrder || 0));
}

// List page — shows every recipe with photo thumb + meta. Click to edit.
router.get('/book/recipes', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: recipes } = await supabaseAdmin
      .from('recipes').select('*').eq('book_id', book.id).order('sort_order');

    // Photo counts per recipe for the index summary
    let photoCounts = {};
    if (recipes && recipes.length > 0) {
      try {
        const { data: photos } = await supabaseAdmin
          .from('recipe_photos').select('recipe_id').in('recipe_id', recipes.map(r => r.id));
        for (const p of (photos || [])) photoCounts[p.recipe_id] = (photoCounts[p.recipe_id] || 0) + 1;
      } catch (_) { /* pre-migration: silent */ }
    }

    const recipesWithMeta = (recipes || []).map(r => ({
      ...r,
      photoUrl: r.photo_path ? getPublicUrl(r.photo_path) : null,
      photo_count: (photoCounts[r.id] || 0) + (r.photo_path && !photoCounts[r.id] ? 1 : 0),
      stepCount: Array.isArray(r.directions) ? r.directions.length : 0,
      ingredientCount: Array.isArray(r.ingredients) ? r.ingredients.length : 0,
    }));

    res.render('marketing/account-book-recipes', {
      family: req.family,
      book: book || {},
      recipes: recipesWithMeta,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

// Create a new recipe (from the "Add recipe" form on the list page)
router.post('/book/recipes/new', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const title = (req.body.title || '').toString().trim() || 'New Recipe';

    const { data: existing } = await supabaseAdmin
      .from('recipes').select('sort_order').eq('book_id', book.id)
      .order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const row = {
      book_id: book.id,
      sort_order: nextSort,
      title,
    };
    try { row.slug = recipeSlugify(title, nextSort); } catch (_) {}

    const { data, error } = await supabaseAdmin.from('recipes').insert(row).select().single();
    if (error) throw error;
    res.redirect('/account/book/recipes/edit/' + data.id);
  } catch (err) {
    console.error('Create recipe failed:', err.message);
    res.redirect('/account/book/recipes?error=create_failed');
  }
});

// Detail editor — GET
router.get('/book/recipes/edit/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: r } = await supabaseAdmin
      .from('recipes').select('*').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.redirect('/account/book/recipes?error=not_found');

    // Gallery photos
    let photos = [];
    try {
      const { data } = await supabaseAdmin.from('recipe_photos')
        .select('*').eq('recipe_id', r.id).order('sort_order');
      photos = data || [];
    } catch (_) { /* pre-migration */ }
    if ((!photos || photos.length === 0) && r.photo_path) {
      photos = [{ id: null, photo_path: r.photo_path, caption: '', sort_order: 0 }];
    }
    const photosWithUrls = photos.map(p => ({ ...p, url: getPublicUrl(p.photo_path) }));

    // Normalize ingredients + directions into the editor's expected shape
    const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : []).map((ing) => {
      if (typeof ing === 'string') return { amount: '', item: ing };
      return { amount: ing.amount || '', item: ing.item || ing.name || ing.text || '' };
    });
    const directions = (Array.isArray(r.directions) ? r.directions : []).map((step) => {
      if (typeof step === 'string') return { text: step };
      return { text: step.text || step.body || '' };
    });

    res.render('marketing/account-book-recipe-detail', {
      family: req.family,
      book: book || {},
      recipe: r,
      ingredients,
      directions,
      photos: photosWithUrls,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

// Detail editor — POST save
router.post('/book/recipes/edit/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    // Parse ingredients/directions from parallel form arrays. Express's
    // body-parser with qs (extended: true) strips the [] suffix, so name="foo[]"
    // arrives as req.body.foo (an array, or a single value if only one row).
    const toArray = (v) => Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]);
    const amounts = toArray(req.body.ingredient_amount);
    const items   = toArray(req.body.ingredient_item);
    const ingredients = items.map((it, i) => ({
      amount: (amounts[i] || '').toString().trim(),
      item: (it || '').toString().trim(),
    })).filter((ing) => ing.amount || ing.item);

    const steps = toArray(req.body.direction_text);
    const directions = steps.map((s) => ({ text: (s || '').toString().trim() })).filter((d) => d.text);

    const patch = {
      title: (req.body.title || '').toString().trim() || 'Untitled',
      origin_label: (req.body.origin_label || '').toString().trim() || null,
      description: (req.body.description || '').toString().trim() || null,
      story: (req.body.story || '').toString().trim() || null,
      prep_time: (req.body.prep_time || '').toString().trim() || null,
      cook_time: (req.body.cook_time || '').toString().trim() || null,
      servings: (req.body.servings || '').toString().trim() || null,
      difficulty: (req.body.difficulty || '').toString().trim() || null,
      notes: (req.body.notes || '').toString().trim() || null,
      ingredients,
      directions,
      updated_at: new Date().toISOString(),
    };
    try { patch.slug = recipeSlugify(patch.title, 0); } catch (_) {}

    // Defensive: strip unknown columns if a column doesn't exist (pre-migration)
    let { error } = await supabaseAdmin.from('recipes').update(patch).eq('id', req.params.id).eq('book_id', book.id);
    if (error && /column .* does not exist/i.test(error.message)) {
      const fallback = {
        title: patch.title, origin_label: patch.origin_label, description: patch.description,
        ingredients: patch.ingredients, updated_at: patch.updated_at,
      };
      ({ error } = await supabaseAdmin.from('recipes').update(fallback).eq('id', req.params.id).eq('book_id', book.id));
    }
    if (error) throw error;
    res.redirect('/account/book/recipes/edit/' + req.params.id + '?success=1');
  } catch (err) {
    console.error('Save recipe failed:', err.message);
    res.redirect('/account/book/recipes/edit/' + req.params.id + '?error=save_failed');
  }
});

// Delete a recipe (FK cascades recipe_photos)
router.post('/book/recipes/delete/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    await supabaseAdmin.from('recipes').delete().eq('id', req.params.id).eq('book_id', book.id);
    res.redirect('/account/book/recipes?success=recipe_deleted');
  } catch (err) { next(err); }
});

// Upload a photo to a recipe gallery
router.post('/book/recipes/:id/photo', requireAccountSession, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.redirect('/account/book/recipes/edit/' + req.params.id + '?error=no_file');
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: r } = await supabaseAdmin.from('recipes').select('id')
      .eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.redirect('/account/book/recipes?error=not_found');

    const ident = r.id + '-' + Date.now();
    const result = await photoService.upload(req.family.id, 'recipes', ident, req.file.buffer, req.file.mimetype);

    const { data: existing } = await supabaseAdmin.from('recipe_photos')
      .select('sort_order').eq('recipe_id', r.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const { error } = await supabaseAdmin.from('recipe_photos').insert({
      recipe_id: r.id,
      photo_path: result.path,
      caption: null,
      sort_order: nextSort,
    });
    if (error) throw error;

    res.redirect('/account/book/recipes/edit/' + req.params.id + '?success=photo_added');
  } catch (err) {
    console.error('Recipe photo upload failed:', err.message);
    res.redirect('/account/book/recipes/edit/' + req.params.id + '?error=photo_upload_failed');
  }
});

// Update a recipe photo caption
router.post('/book/recipes/photo/:photoId/edit', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: photo } = await supabaseAdmin.from('recipe_photos').select('id, recipe_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/recipes?error=photo_not_found');
    const { data: r } = await supabaseAdmin.from('recipes').select('id').eq('id', photo.recipe_id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.redirect('/account/book/recipes?error=not_authorized');

    const patch = {};
    if (req.body.caption !== undefined) patch.caption = (req.body.caption || '').toString().trim() || null;
    if (req.body.sort_order !== undefined) patch.sort_order = parseInt(req.body.sort_order, 10) || 0;
    await supabaseAdmin.from('recipe_photos').update(patch).eq('id', req.params.photoId);

    res.redirect('/account/book/recipes/edit/' + r.id + '?success=photo_updated');
  } catch (err) { next(err); }
});

// Delete a recipe photo
router.post('/book/recipes/photo/:photoId/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const { data: photo } = await supabaseAdmin.from('recipe_photos').select('id, recipe_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/recipes?error=photo_not_found');
    const { data: r } = await supabaseAdmin.from('recipes').select('id').eq('id', photo.recipe_id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.redirect('/account/book/recipes?error=not_authorized');

    await supabaseAdmin.from('recipe_photos').delete().eq('id', req.params.photoId);
    res.redirect('/account/book/recipes/edit/' + r.id + '?success=photo_deleted');
  } catch (err) { next(err); }
});

// ─── Keepsakes (Chapter Ten) ──────────────────────────────────────────────────

function keepsakeSlugify(title, sortOrder) {
  const base = (title || ('keepsake-' + (sortOrder || 0))).toString();
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('keepsake-' + (sortOrder || 0));
}

router.get('/book/keepsakes', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    let keepsakes = [];
    try {
      const { data } = await supabaseAdmin
        .from('keepsakes').select('*').eq('book_id', book.id).order('sort_order');
      keepsakes = data || [];
    } catch (_) { /* pre-migration: silent */ }

    // Cover photo per keepsake (first row from keepsake_photos)
    let coverByKeepsakeId = {};
    let photoCounts = {};
    if (keepsakes.length > 0) {
      try {
        const { data: photos } = await supabaseAdmin
          .from('keepsake_photos').select('keepsake_id, photo_path, sort_order')
          .in('keepsake_id', keepsakes.map(k => k.id))
          .order('sort_order');
        for (const p of (photos || [])) {
          if (!coverByKeepsakeId[p.keepsake_id]) coverByKeepsakeId[p.keepsake_id] = p.photo_path;
          photoCounts[p.keepsake_id] = (photoCounts[p.keepsake_id] || 0) + 1;
        }
      } catch (_) { /* pre-migration: silent */ }
    }

    const keepsakesWithMeta = keepsakes.map(k => ({
      ...k,
      photoUrl: coverByKeepsakeId[k.id] ? getPublicUrl(coverByKeepsakeId[k.id]) : null,
      photo_count: photoCounts[k.id] || 0,
    }));

    res.render('marketing/account-book-keepsakes', {
      family: req.family,
      book: book || {},
      keepsakes: keepsakesWithMeta,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

// Create a new keepsake (from "Add keepsake" form on list page)
router.post('/book/keepsakes/new', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const title = (req.body.title || '').toString().trim() || 'New Keepsake';

    const { data: existing } = await supabaseAdmin
      .from('keepsakes').select('sort_order').eq('book_id', book.id)
      .order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const row = {
      book_id: book.id,
      sort_order: nextSort,
      title,
      category: (req.body.category || '').toString().trim().toLowerCase() || null,
    };
    try { row.slug = keepsakeSlugify(title, nextSort); } catch (_) {}

    const { data, error } = await supabaseAdmin.from('keepsakes').insert(row).select().single();
    if (error) throw error;
    res.redirect('/account/book/keepsakes/edit/' + data.id);
  } catch (err) {
    console.error('Create keepsake failed:', err.message);
    res.redirect('/account/book/keepsakes?error=create_failed');
  }
});

// Detail editor — GET
router.get('/book/keepsakes/edit/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: k } = await supabaseAdmin
      .from('keepsakes').select('*').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.redirect('/account/book/keepsakes?error=not_found');

    let photos = [];
    try {
      const { data } = await supabaseAdmin.from('keepsake_photos')
        .select('*').eq('keepsake_id', k.id).order('sort_order');
      photos = data || [];
    } catch (_) { /* pre-migration */ }
    const photosWithUrls = photos.map(p => ({ ...p, url: getPublicUrl(p.photo_path) }));

    res.render('marketing/account-book-keepsake-detail', {
      family: req.family,
      book: book || {},
      keepsake: k,
      photos: photosWithUrls,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

// Detail editor — POST save
router.post('/book/keepsakes/edit/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const patch = {
      title: (req.body.title || '').toString().trim() || 'Untitled',
      category: (req.body.category || '').toString().trim().toLowerCase() || null,
      age_text: (req.body.age_text || '').toString().trim() || null,
      attribution: (req.body.attribution || '').toString().trim() || null,
      description: (req.body.description || '').toString().trim() || null,
      story: (req.body.story || '').toString().trim() || null,
      updated_at: new Date().toISOString(),
    };

    // date_made: only send if parses as YYYY-MM-DD
    const dt = (req.body.date_made || '').toString().trim();
    patch.date_made = /^\d{4}-\d{2}-\d{2}$/.test(dt) ? dt : null;

    try { patch.slug = keepsakeSlugify(patch.title, 0); } catch (_) {}

    let { error } = await supabaseAdmin.from('keepsakes').update(patch).eq('id', req.params.id).eq('book_id', book.id);
    if (error && /column .* does not exist/i.test(error.message)) {
      // Pre-migration fallback (shouldn't happen on prod but defensive)
      const fallback = { title: patch.title, description: patch.description, updated_at: patch.updated_at };
      ({ error } = await supabaseAdmin.from('keepsakes').update(fallback).eq('id', req.params.id).eq('book_id', book.id));
    }
    if (error) throw error;
    res.redirect('/account/book/keepsakes/edit/' + req.params.id + '?success=1');
  } catch (err) {
    console.error('Save keepsake failed:', err.message);
    res.redirect('/account/book/keepsakes/edit/' + req.params.id + '?error=save_failed');
  }
});

// Delete a keepsake (FK cascades keepsake_photos)
router.post('/book/keepsakes/delete/:id', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    await supabaseAdmin.from('keepsakes').delete().eq('id', req.params.id).eq('book_id', book.id);
    res.redirect('/account/book/keepsakes?success=keepsake_deleted');
  } catch (err) { next(err); }
});

// Upload a photo to a keepsake gallery
router.post('/book/keepsakes/:id/photo', requireAccountSession, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.redirect('/account/book/keepsakes/edit/' + req.params.id + '?error=no_file');
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: k } = await supabaseAdmin.from('keepsakes').select('id')
      .eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.redirect('/account/book/keepsakes?error=not_found');

    const ident = k.id + '-' + Date.now();
    const result = await photoService.upload(req.family.id, 'keepsakes', ident, req.file.buffer, req.file.mimetype);

    const { data: existing } = await supabaseAdmin.from('keepsake_photos')
      .select('sort_order').eq('keepsake_id', k.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const { error } = await supabaseAdmin.from('keepsake_photos').insert({
      keepsake_id: k.id,
      photo_path: result.path,
      caption: null,
      sort_order: nextSort,
    });
    if (error) throw error;

    res.redirect('/account/book/keepsakes/edit/' + req.params.id + '?success=photo_added');
  } catch (err) {
    console.error('Keepsake photo upload failed:', err.message);
    res.redirect('/account/book/keepsakes/edit/' + req.params.id + '?error=photo_upload_failed');
  }
});

// Update keepsake photo caption
router.post('/book/keepsakes/photo/:photoId/edit', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');

    const { data: photo } = await supabaseAdmin.from('keepsake_photos').select('id, keepsake_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/keepsakes?error=photo_not_found');
    const { data: k } = await supabaseAdmin.from('keepsakes').select('id').eq('id', photo.keepsake_id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.redirect('/account/book/keepsakes?error=not_authorized');

    const patch = {};
    if (req.body.caption !== undefined) patch.caption = (req.body.caption || '').toString().trim() || null;
    if (req.body.sort_order !== undefined) patch.sort_order = parseInt(req.body.sort_order, 10) || 0;
    await supabaseAdmin.from('keepsake_photos').update(patch).eq('id', req.params.photoId);

    res.redirect('/account/book/keepsakes/edit/' + k.id + '?success=photo_updated');
  } catch (err) { next(err); }
});

// Delete a keepsake photo
router.post('/book/keepsakes/photo/:photoId/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.redirect('/account/book');
    const { data: photo } = await supabaseAdmin.from('keepsake_photos').select('id, keepsake_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.redirect('/account/book/keepsakes?error=photo_not_found');
    const { data: k } = await supabaseAdmin.from('keepsakes').select('id').eq('id', photo.keepsake_id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.redirect('/account/book/keepsakes?error=not_authorized');

    await supabaseAdmin.from('keepsake_photos').delete().eq('id', req.params.photoId);
    res.redirect('/account/book/keepsakes/edit/' + k.id + '?success=photo_deleted');
  } catch (err) { next(err); }
});

// ─── The Vault ────────────────────────────────────────────────────────────────

router.get('/book/vault', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: items } = await supabaseAdmin
      .from('vault_items').select('*').eq('book_id', book.id).order('created_at');
    const itemsWithUrls = (items || []).map(v => ({
      ...v, photoUrl: v.photo_path ? getPublicUrl(v.photo_path) : null,
    }));
    res.render('marketing/account-book-vault', {
      family: req.family, book: book || {}, items: itemsWithUrls,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/vault', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { item_type, title, body, sealed_by, photo_path } = req.body;
    if (!title || !title.trim()) return res.redirect('/account/book/vault?error=1');
    await supabaseAdmin.from('vault_items').insert({
      book_id: book.id,
      item_type: item_type || 'letter',
      title: title.trim(),
      body: body || null,
      sealed_by: sealed_by || null,
      photo_path: photo_path || null,
    });
    res.redirect('/account/book/vault?success=1');
  } catch (err) {
    console.error('Vault save error:', err.message);
    res.redirect('/account/book/vault?error=1');
  }
});

router.post('/book/vault/:id/delete', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    await supabaseAdmin.from('vault_items')
      .delete().eq('id', req.params.id).eq('book_id', book.id);
    res.redirect('/account/book/vault');
  } catch (err) { next(err); }
});

// ─── Your Firsts ──────────────────────────────────────────────────────────────

router.get('/book/firsts', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: firsts } = await supabaseAdmin
      .from('firsts').select('*').eq('book_id', book.id).order('sort_order');
    res.render('marketing/account-book-firsts', {
      family: req.family, book: book || {}, firsts: firsts || [],
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/firsts', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    let firsts = [];
    try { firsts = JSON.parse(req.body.firsts_json || '[]'); } catch (e) {}
    const cleaned = firsts.map(f => ({
      emoji: f.emoji || '⭐',
      title: f.title || null,
      date_text: f.date_text || null,
      note: f.note || null,
    }));
    await bookService.updateSectionCards('firsts', book.id, cleaned);
    res.redirect('/account/book/firsts?success=1');
  } catch (err) {
    console.error('Firsts save error:', err.message);
    res.redirect('/account/book/firsts?error=1');
  }
});

module.exports = router;
