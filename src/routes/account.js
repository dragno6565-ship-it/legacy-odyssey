const { Router } = require('express');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const { supabaseAnon, supabaseAdmin } = require('../config/supabase');
const familyService = require('../services/familyService');
const bookService = require('../services/bookService');
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
  return sanitizeHtml(dirty, {
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

router.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/account');
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.redirect('/account');
  try {
    const { data: family, error } = await supabaseAdmin
      .from('families')
      .select('id, email, display_name, subscription_status, billing_period, stripe_customer_id')
      .eq('id', familyId)
      .single();
    if (error || !family) {
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/account');
    }
    res.render('marketing/account-dashboard', { family, appDomain: APP_DOMAIN(), error: null });
  } catch (err) {
    res.render('marketing/account-dashboard', { family: null, appDomain: APP_DOMAIN(), error: 'Could not load account details.' });
  }
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

// ─── Book section overview ────────────────────────────────────────────────────

router.get('/book', requireAccountSession, async (req, res, next) => {
  try {
    const fullBook = await bookService.getFullBook(req.family.id);
    res.render('marketing/account-book', {
      family: req.family,
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
      'name_meaning', 'hero_image_path', 'parent_quote', 'parent_quote_attribution',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key] || null;
    }
    // Typed columns must be null, not empty string
    for (const col of ['birth_date', 'birth_time', 'birth_weight_lbs', 'birth_weight_oz', 'birth_length_inches']) {
      if (col in updates && !updates[col]) updates[col] = null;
    }
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
      mom_narrative: sanitizeBookHtml(req.body.mom_narrative),
      dad_narrative: sanitizeBookHtml(req.body.dad_narrative),
      mom_photo_1: req.body.mom_photo_1 || null,
      dad_photo_1: req.body.dad_photo_1 || null,
    });
    res.redirect('/account/book/birth-story?success=1');
  } catch (err) {
    console.error('Birth story save error:', err.message);
    res.redirect('/account/book/birth-story?error=1');
  }
});

module.exports = router;
