const { Router } = require('express');
const path = require('path');
const resolveFamily = require('../middleware/resolveFamily');
const { requireBookPassword, hashPassword } = require('../middleware/requireBookPassword');
const bookService = require('../services/bookService');
const { getPublicUrl } = require('../utils/imageUrl');

const router = Router();

// Serve static demo sites for specific domains and subdomains
const DEMO_SITES = {
  'your-family-photo-album.com': 'family-album-demo.html',
  'your-family-photo-album': 'family-album-demo.html', // subdomain match
};

router.use((req, res, next) => {
  const host = req.hostname.startsWith('www.') ? req.hostname.slice(4) : req.hostname;
  const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
  const subdomain = host.endsWith(`.${appDomain}`) ? host.replace(`.${appDomain}`, '') : null;
  const demoFile = DEMO_SITES[host] || (subdomain && DEMO_SITES[subdomain]);
  if (demoFile && (req.path === '/' || req.path === '')) {
    return res.sendFile(path.join(__dirname, '../public', demoFile));
  }
  next();
});

// GET /sitemap.xml — Dynamic sitemap
router.get('/sitemap.xml', async (req, res) => {
  const { supabaseAdmin } = require('../config/supabase');
  const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';

  const { data: families } = await supabaseAdmin
    .from('families')
    .select('subdomain, custom_domain, updated_at')
    .eq('is_active', true);

  const urls = [
    { loc: `https://${appDomain}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `https://${appDomain}/terms`, priority: '0.3', changefreq: 'monthly' },
    { loc: `https://${appDomain}/privacy`, priority: '0.3', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog`, priority: '0.6', changefreq: 'weekly' },
    { loc: `https://${appDomain}/blog/what-to-write-in-baby-book`, priority: '0.7', changefreq: 'monthly' },
  ];

  if (families) {
    for (const f of families) {
      if (f.custom_domain) {
        urls.push({
          loc: `https://www.${f.custom_domain}/`,
          priority: '0.6',
          changefreq: 'weekly',
          lastmod: f.updated_at ? new Date(f.updated_at).toISOString().split('T')[0] : undefined,
        });
      }
    }
  }

  res.set('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <changefreq>${u.changefreq}</changefreq>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`);
});

// GET /terms — Terms of Service
router.get('/terms', (req, res) => {
  res.render('marketing/terms');
});

// GET /privacy — Privacy Policy
router.get('/privacy', (req, res) => {
  res.render('marketing/privacy');
});

// Blog posts registry — add new posts here
const BLOG_POSTS = [
  {
    title: 'What to Write in Your Baby\'s First Year Book (A Complete Guide for New Parents)',
    excerpt: 'Don\'t know where to start? Here\'s everything worth writing down in your baby\'s first year — from the birth story to milestone moments to letters they\'ll read one day.',
    url: '/blog/what-to-write-in-baby-book',
    category: 'Baby Book Guides',
    date: 'April 3, 2026',
    readTime: '10 min read',
  },
];

// GET /blog — Blog index
router.get('/blog', (req, res) => {
  res.render('marketing/blog-index', { posts: BLOG_POSTS });
});

// GET /blog/what-to-write-in-baby-book
router.get('/blog/what-to-write-in-baby-book', (req, res) => {
  res.render('marketing/blog-what-to-write-in-baby-book');
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
  const { sendCapiEvent } = require('../utils/metaCapi');
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

    const planValue = plan === 'annual' ? 49.99 : 4.99;
    const purchaseEventId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const customerName = session.customer_details?.name || '';

    sendCapiEvent({
      eventName: 'Purchase',
      eventId: purchaseEventId,
      userData: {
        email,
        firstName: customerName.split(' ')[0],
        lastName: customerName.split(' ').slice(1).join(' '),
      },
      customData: { value: planValue, currency: 'USD', orderId: sessionId },
      eventSourceUrl: 'https://legacyodyssey.com/success',
      clientIpAddress: req.ip || req.headers['x-forwarded-for'],
      clientUserAgent: req.headers['user-agent'],
    });

    sendCapiEvent({
      eventName: 'StartTrial',
      eventId: `trial_${purchaseEventId}`,
      userData: { email },
      customData: { value: planValue, currency: 'USD' },
      eventSourceUrl: 'https://legacyodyssey.com/success',
      clientIpAddress: req.ip || req.headers['x-forwarded-for'],
      clientUserAgent: req.headers['user-agent'],
    });

    if (family) {
      // Webhook already processed — show success page (no temp password available)
      return res.render('marketing/success', {
        subdomain: family.subdomain,
        domain,
        appDomain,
        plan,
        planValue,
        email,
        tempPassword: null,
        purchaseEventId,
      });
    }

    // Webhook hasn't fired yet (rare) — process the checkout ourselves
    const result = await stripeService.handleCheckoutComplete(session);
    return res.render('marketing/success', {
      subdomain: result.family.subdomain,
      domain: result.domain || null,
      appDomain,
      plan,
      planValue,
      email,
      tempPassword: result.tempPassword,
      purchaseEventId,
    });
  } catch (err) {
    console.error('Stripe success handler error:', err);
  }
  res.redirect('/');
});

// Gift purchase page
router.get('/gift', (req, res) => {
  res.render('marketing/gift');
});

// Gift success page
router.get('/gift/success', async (req, res) => {
  const { stripe } = require('../config/stripe');
  const giftService = require('../services/giftService');
  const sessionId = req.query.session_id;
  if (!sessionId || !stripe) return res.redirect('/gift');

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return res.redirect('/gift');

    // Find the gift code created by the webhook
    const { supabaseAdmin } = require('../config/supabase');
    const { data: gift } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (!gift) {
      // Webhook hasn't fired yet — create the gift code now
      const newGift = await giftService.createGiftCode({
        buyerEmail: session.customer_email || session.customer_details?.email,
        buyerName: session.metadata?.buyer_name,
        recipientEmail: session.metadata?.recipient_email,
        recipientMessage: session.metadata?.gift_message,
        stripeSessionId: session.id,
      });
      const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
      return res.render('marketing/gift-success', {
        giftCode: newGift.code,
        redeemUrl: `https://${appDomain}/redeem?code=${newGift.code}`,
        buyerEmail: newGift.buyer_email,
      });
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    res.render('marketing/gift-success', {
      giftCode: gift.code,
      redeemUrl: `https://${appDomain}/redeem?code=${gift.code}`,
      buyerEmail: gift.buyer_email,
    });
  } catch (err) {
    console.error('Gift success handler error:', err);
    res.redirect('/gift');
  }
});

// Additional site success page
router.get('/additional-site/success', (req, res) => {
  res.render('marketing/additional-site-success');
});

// Gift redemption page
router.get('/redeem', (req, res) => {
  const code = req.query.code || '';
  res.render('marketing/redeem', { code, error: null });
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
