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
    return res.render('marketing/account-forgot-password', { sent: false, error: 'Please enter your email address.' });
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
  });
});

router.post('/reset-password', async (req, res) => {
  const { token_hash, new_password, confirm_password } = req.body;

  const renderError = (error) => res.render('marketing/account-reset-password', {
    token_hash: token_hash || '',
    error,
    success: false,
  });

  if (!token_hash) return renderError('Invalid reset link. Please request a new one.');
  if (!new_password || new_password.length < 6) return renderError('Password must be at least 6 characters.');
  if (new_password !== confirm_password) return renderError('Passwords do not match.');

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
      return renderError('This reset link has expired or already been used. Please request a new one.');
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      password: new_password,
    });

    if (updateError) {
      console.error('Password update error:', updateError.message, updateError);
      return renderError(`Failed to update password: ${updateError.message}`);
    }

    res.render('marketing/account-reset-password', { token_hash: '', error: null, success: true });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return renderError('Something went wrong. Please try again.');
  }
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.redirect('/account');
  try {
    const { data: family, error } = await supabaseAdmin
      .from('families')
      .select('id, email, display_name, subscription_status, billing_period, stripe_customer_id, stripe_subscription_id, custom_domain, subdomain, archived_at, auth_user_id')
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

    res.render('marketing/account-dashboard', {
      family,
      linkedFamilies,
      isPrimary,
      appDomain: APP_DOMAIN(),
      error: null,
    });
  } catch (err) {
    res.render('marketing/account-dashboard', { family: null, linkedFamilies: [], isPrimary: null, appDomain: APP_DOMAIN(), error: 'Could not load account details.' });
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
      mom_title: (req.body.mom_title || '').trim() || null,
      mom_narrative: sanitizeBookHtml(req.body.mom_narrative),
      dad_title: (req.body.dad_title || '').trim() || null,
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

// ─── Before Arrived ──────────────────────────────────────────────────────────

router.get('/book/before-arrived', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: cards } = await supabaseAdmin
      .from('before_arrived_cards').select('*').eq('book_id', book.id).order('sort_order');
    const cardsWithUrls = (cards || []).map(c => ({
      ...c, photoUrl: c.photo_path ? getPublicUrl(c.photo_path) : null,
    }));
    res.render('marketing/account-book-before-arrived', {
      family: req.family, book: book || {}, cards: cardsWithUrls,
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
    res.render('marketing/account-book-family-member', {
      family: req.family, book: book || {},
      member: member || { member_key: req.params.key },
      photoUrl: member?.photo_path ? getPublicUrl(member.photo_path) : null,
      album1Url: member?.album_1_path ? getPublicUrl(member.album_1_path) : null,
      album2Url: member?.album_2_path ? getPublicUrl(member.album_2_path) : null,
      album3Url: member?.album_3_path ? getPublicUrl(member.album_3_path) : null,
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
      name: 'New Member', relation: 'Family Member', emoji: '👤',
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
  const DEFAULT_KEYS = ['mom', 'dad', 'grandma-maternal', 'grandpa-maternal', 'grandma-paternal', 'grandpa-paternal'];
  if (DEFAULT_KEYS.includes(req.params.key)) return res.redirect('/account/book/family');
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

    // Group by year_label, preserving book.celebration_years order
    const yearLabels = book.celebration_years || ['Your First Year'];
    const grouped = yearLabels.map((label) => ({
      label,
      celebrations: cardsWithMeta.filter(c => (c.year_label || 'Your First Year') === label),
    }));
    // Orphan years (rows whose year_label isn't in book.celebration_years)
    const seen = new Set(yearLabels);
    for (const c of cardsWithMeta) {
      const y = c.year_label || 'Your First Year';
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
    const years = book.celebration_years || ['Your First Year'];
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
    const years = book.celebration_years || ['Your First Year'];
    if (years.length <= 1) return res.redirect('/account/book/celebrations?error=cannot_delete_last_year');
    const updated = years.filter((y) => y !== label);
    // Cascade-delete celebrations in this year (celebration_photos cascades via FK)
    await supabaseAdmin.from('celebrations').delete().eq('book_id', book.id).eq('year_label', label);
    await bookService.updateBook(book.id, { celebration_years: updated });
    res.redirect('/account/book/celebrations?success=year_deleted');
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
    const years = book.celebration_years || ['Your First Year'];

    res.render('marketing/account-book-celebration-detail', {
      family: req.family,
      book: book || {},
      celebration: c,
      photos: photosWithUrls,
      years,
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

router.get('/book/recipes', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { data: recipes } = await supabaseAdmin
      .from('recipes').select('*').eq('book_id', book.id).order('sort_order');
    const recipesWithUrls = (recipes || []).map(r => ({
      ...r, photoUrl: r.photo_path ? getPublicUrl(r.photo_path) : null,
    }));
    res.render('marketing/account-book-recipes', {
      family: req.family, book: book || {}, recipes: recipesWithUrls,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) { next(err); }
});

router.post('/book/recipes', requireAccountSession, async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    let recipes = [];
    try { recipes = JSON.parse(req.body.recipes_json || '[]'); } catch (e) {}
    const cleaned = recipes.map(r => ({
      origin_label: r.origin_label || null,
      title: r.title || null,
      description: r.description || null,
      photo_path: r.photo_path || null,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients.filter(i => i && i.trim()) : [],
    }));
    await bookService.updateSectionCards('recipes', book.id, cleaned);
    res.redirect('/account/book/recipes?success=1');
  } catch (err) {
    console.error('Recipes save error:', err.message);
    res.redirect('/account/book/recipes?error=1');
  }
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
