const { Router } = require('express');
const path = require('path');
const resolveFamily = require('../middleware/resolveFamily');
const { requireBookPassword, hashPassword, computeSiteLabel } = require('../middleware/requireBookPassword');
const bookService = require('../services/bookService');
const { translateBook } = require('../services/translateService');
const { getPublicUrl } = require('../utils/imageUrl');

/**
 * Build a photoPos(path) helper for EJS templates.
 * Returns "object-position: X% Y%" inline style string, or "" if no focal point saved.
 */
function makePhotoPos(photoPositions) {
  const positions = photoPositions || {};
  return function photoPos(photoPath) {
    if (!photoPath) return '';
    let storagePath = photoPath;
    if (photoPath.startsWith('http')) {
      const marker = '/photos/';
      const idx = photoPath.indexOf(marker);
      storagePath = idx !== -1 ? photoPath.substring(idx + marker.length) : photoPath;
    }
    const pos = positions[storagePath];
    if (!pos) return '';
    return `object-position: ${pos.x}% ${pos.y}%`;
  };
}

const router = Router();

// ===== Landing-page A/B split =====
// Cookie-based 50/50 split between v1 (legacy) and v2 (redesign) at /.
// Sticky for 30 days so the same visitor always sees the same version.
// Bots see v1 for SEO/canonical stability.
const BOT_UA_RE = /bot\b|crawl|spider|slurp|googlebot|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|applebot|petalbot|ia_archiver|semrushbot|ahrefsbot/i;
const LANDING_COOKIE = 'lo_landing';
const LANDING_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function pickLandingVariant(req, res) {
  // Manual override via ?lov=v1|v2 — sets cookie too so it sticks.
  const override = (req.query && req.query.lov || '').toLowerCase();
  if (override === 'v1' || override === 'v2') {
    res.cookie(LANDING_COOKIE, override, {
      maxAge: LANDING_COOKIE_MAX_AGE_MS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return override;
  }

  const existing = req.cookies && req.cookies[LANDING_COOKIE];
  if (existing === 'v1' || existing === 'v2') return existing;

  // Bots & crawlers always see v1 — keeps canonical content stable for SEO.
  const ua = req.get('user-agent') || '';
  if (BOT_UA_RE.test(ua)) return 'v1';

  const assigned = Math.random() < 0.5 ? 'v1' : 'v2';
  res.cookie(LANDING_COOKIE, assigned, {
    maxAge: LANDING_COOKIE_MAX_AGE_MS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return assigned;
}

// Preview route for the v2 landing redesign — direct access, bypasses A/B.
// Bypasses resolveFamily so it renders regardless of host.
router.get('/preview/landing-v2', (req, res) => {
  res.render('marketing/landing-v2', { landingVariant: 'v2' });
});

// Preview route for v1 too, in case Dan wants to compare side-by-side.
router.get('/preview/landing-v1', (req, res) => {
  res.render('marketing/landing', { landingVariant: 'v1' });
});

// Preview route for the CRO revision of landing-v2 (Alexis Cottray audit, May 2026).
// NOT live in the A/B split — review-only until promoted.
router.get('/preview/landing-v2-cro', (req, res) => {
  res.render('marketing/landing-v2-cro', { landingVariant: 'v2-cro' });
});

// Preview route for the "what is it" headline test (Option 6).
// Hero leads with the product definition instead of the .com question.
router.get('/preview/option6', (req, res) => {
  res.render('marketing/landing-option6', { landingVariant: 'option6' });
});

// Public affiliate program landing page (Friends of Legacy Odyssey / Rewardful).
// Apply CTA points to the Rewardful-hosted signup; tracking snippet is in the view.
router.get('/affiliates', (req, res) => {
  res.render('marketing/affiliates');
});

// Guided, self-contained product walkthrough — a tap-through "tour" for showing
// people what the product is (pick a name → reserve → editor → add photos →
// publish → the finished site). No DB, no auth, no real names; noindex. Renders
// on the main domain (defined before resolveFamily). Images live in /demo-assets/.
router.get('/demo', (req, res) => {
  res.render('marketing/demo');
});

// Side-by-side comparison: original landing-v2 (left) vs CRO revision (right),
// each rendered in its own iframe at the real preview routes above.
router.get('/preview/cro-compare', (req, res) => {
  res.set('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CRO Comparison — Original vs Revised</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Jost',system-ui,sans-serif;background:#1a1510;color:#faf7f2;height:100vh;display:flex;flex-direction:column;overflow:hidden}
  header{flex:0 0 auto;padding:10px 20px;display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(200,169,110,0.2);background:#0f0b07}
  header h1{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:#c8a96e}
  header .hint{font-size:12px;color:rgba(250,247,242,0.5)}
  header label{font-size:12px;color:rgba(250,247,242,0.7);margin-left:auto;display:flex;align-items:center;gap:6px;cursor:pointer}
  .panes{flex:1 1 auto;display:flex;min-height:0}
  .panes.stacked{flex-direction:column}
  .pane{flex:1 1 50%;display:flex;flex-direction:column;min-width:0;min-height:0;border-right:1px solid rgba(200,169,110,0.25)}
  .pane:last-child{border-right:none}
  .pane .bar{flex:0 0 auto;padding:7px 14px;font-size:12px;letter-spacing:1px;text-transform:uppercase;background:#2e2218;color:#c8a96e;display:flex;justify-content:space-between;align-items:center}
  .pane .bar a{color:rgba(250,247,242,0.6);font-size:11px;text-decoration:none}
  .pane .bar a:hover{color:#c8a96e}
  .pane iframe{flex:1 1 auto;width:100%;border:none;background:#faf7f2}
</style></head>
<body>
  <header>
    <h1>Legacy Odyssey — CRO Comparison</h1>
    <span class="hint">Left: current landing (v2) &nbsp;·&nbsp; Right: CRO revision. Each scrolls independently.</span>
    <label><input type="checkbox" id="stackToggle"> Stack vertically</label>
  </header>
  <div class="panes" id="panes">
    <div class="pane">
      <div class="bar"><span>Original — landing-v2</span><a href="/preview/landing-v2" target="_blank">open full ↗</a></div>
      <iframe src="/preview/landing-v2" title="Original landing v2" loading="eager"></iframe>
    </div>
    <div class="pane">
      <div class="bar"><span>CRO revision — landing-v2-cro</span><a href="/preview/landing-v2-cro" target="_blank">open full ↗</a></div>
      <iframe src="/preview/landing-v2-cro" title="CRO revised landing" loading="eager"></iframe>
    </div>
  </div>
  <script>
    document.getElementById('stackToggle').addEventListener('change', function(e){
      document.getElementById('panes').classList.toggle('stacked', e.target.checked);
    });
  </script>
</body></html>`);
});

// Preview route for the gift-giver landing — NOT live until promoted.
// Same architecture: bypasses resolveFamily so it renders for legacyodyssey.com
// regardless of which family record the host resolves to.
router.get('/preview/gift-landing', (req, res) => {
  res.render('marketing/gift-landing');
});

// Preview of the two "Your Birth Day" layout options (A: card-per-photo,
// B: captioned gallery). Review-only mockup — no DB, placeholder photos/labels.
router.get('/preview/birthday-models', (req, res) => {
  res.render('marketing/preview-birthday-models');
});

// Hidden "founder" landing page — shared privately with friends and early
// supporters. Posts to /api/stripe/create-founder-page-checkout which uses
// STRIPE_PRICE_FOUNDER ($29/yr flat, no coupon). NOT linked from anywhere
// public; not in sitemap; meta robots=noindex on the page itself.
router.get('/preview/founder', (req, res) => {
  res.render('marketing/founder');
});

// Celebration detail-page DESIGN MOCKUP routes — shown to Dan before the
// feature is built. Three variants render the same template with different
// sample data so Dan can see how conditional sections (only render if
// filled in) behave from "all fields populated" to "title only".
function celebrationMockupHandler(req, res) {
  const v = (req.params.variant || 'full').toLowerCase();

  const fullCelebration = {
    yearLabel: 'Year 1 (2025)',
    title: 'First <em>Christmas</em>',
    eyebrow: 'Christmas Day · December 25, 2025',
    date: 'December 25, 2025',
    location: 'Grandma & Grandpa\'s House, Vermont',
    coverPhoto: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=1600&h=800&fit=crop&crop=center&auto=format&q=85',
    story: [
      'Sophia\'s first Christmas was a quiet one — her first time meeting her great-grandparents, her first time near a tree taller than the ceiling she\'s used to, and the first time she fell asleep with a wrapped present held tightly in both hands.',
      'We woke up at 7:00. By 7:15 the house was full of cousins. Mom carried her downstairs in the red pajamas Grandma sent up last week, and the first thing Sophia did when she saw the tree was point and say "oooooh." She has never said "oooooh" before. We are choosing to believe she made it up just for the moment.',
      'The afternoon was leftover ham, the puzzle Aunt Sarah brought, and Sophia falling asleep in Grandpa\'s arms while he hummed something we didn\'t recognize. She has made this house — for the first time — into a place where memories are being made about her, instead of for her.',
    ].join('\n\n'),
    attendees: ['Mom', 'Dad', 'Grandma Pat', 'Grandpa Joe', 'Great-Grandma Ruth', 'Aunt Sarah', 'Uncle Mike', 'Cousin Ben', 'Cousin Lily'],
    gifts: [
      'A handmade quilt from Grandma — yellow stars on cream',
      'Wooden alphabet blocks from Grandpa',
      'Her first cloth book ("Where Is Spot?")',
      'Reindeer pajamas (which she\'s currently wearing)',
      'A silver baby spoon engraved with the date',
      'A tiny stocking with her name embroidered on it',
    ],
    photos: [
      { url: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=600&h=750&fit=crop&crop=center&auto=format&q=80', caption: 'The first ornament she picked up off the tree — and refused to give back.' },
      { url: 'https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?w=600&h=750&fit=crop&crop=faces,center&auto=format&q=80', caption: 'Right before she tore into the wrapping paper.' },
      { url: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&h=750&fit=crop&crop=center&auto=format&q=80', caption: 'Grandma\'s quilt. She wouldn\'t let go.' },
      { url: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=600&h=750&fit=crop&crop=faces,center&auto=format&q=80', caption: '' },
      { url: 'https://images.unsplash.com/photo-1533483595632-c5f0e57a1936?w=600&h=750&fit=crop&crop=faces,center&auto=format&q=80', caption: 'Asleep in Grandpa\'s arms, post-ham.' },
      { url: 'https://images.unsplash.com/photo-1518689745945-cf04ab1d8d52?w=600&h=750&fit=crop&crop=center&auto=format&q=80', caption: '' },
    ],
    prev: null,
    next: 'Easter Sunday',
  };

  const sparseCelebration = {
    yearLabel: 'Year 1 (2025)',
    title: 'Easter Sunday',
    eyebrow: '',
    date: 'April 20, 2025',
    location: '',
    coverPhoto: 'https://images.unsplash.com/photo-1517232115160-ff93364542dd?w=1600&h=800&fit=crop&crop=center&auto=format&q=85',
    story: '',
    attendees: [],
    gifts: [],
    photos: [
      { url: 'https://images.unsplash.com/photo-1517232115160-ff93364542dd?w=600&h=750&fit=crop&crop=center&auto=format&q=80', caption: 'Her first Easter dress.' },
      { url: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=600&h=750&fit=crop&crop=center&auto=format&q=80', caption: '' },
    ],
    prev: 'First Christmas',
    next: 'Fourth of July',
  };

  const emptyCelebration = {
    yearLabel: 'Year 1 (2025)',
    title: 'Halloween',
    eyebrow: '',
    date: '',
    location: '',
    coverPhoto: '',
    story: '',
    attendees: [],
    gifts: [],
    photos: [],
    prev: 'Fourth of July',
    next: 'First Birthday',
  };

  const celebration =
    v === 'sparse' ? sparseCelebration :
    v === 'empty'  ? emptyCelebration  :
    fullCelebration;

  res.render('marketing/preview-celebration-mockup', { celebration });
}
// Two routes: with and without :variant. (Express 5's path-to-regexp dropped
// the `:variant?` optional-param syntax which previously combined these.)
router.get('/preview/celebration-mockup', celebrationMockupHandler);
router.get('/preview/celebration-mockup/:variant', celebrationMockupHandler);

// ─── Recipe redesign mockup ────────────────────────────────────────────────
function recipeMockupHandler(req, res) {
  const v = (req.params.variant || 'overview').toLowerCase();
  res.render('marketing/preview-recipe-mockup', { variant: v });
}
router.get('/preview/recipe-mockup', recipeMockupHandler);
router.get('/preview/recipe-mockup/:variant', recipeMockupHandler);

// ─── Keepsakes design mockup (preview-only, not wired to data yet) ─────────
function keepsakesMockupHandler(req, res) {
  const v = (req.params.variant || 'overview').toLowerCase();
  res.render('marketing/preview-keepsakes-mockup', { variant: v });
}
router.get('/preview/keepsakes-mockup', keepsakesMockupHandler);
router.get('/preview/keepsakes-mockup/:variant', keepsakesMockupHandler);

// ─── Adoption Story design mockup (preview-only, not wired to data yet) ────
function adoptionStoryMockupHandler(req, res) {
  const v = (req.params.variant || 'full').toLowerCase();
  res.render('marketing/preview-adoption-story-mockup', { variant: v });
}
router.get('/preview/adoption-story-mockup', adoptionStoryMockupHandler);
router.get('/preview/adoption-story-mockup/:variant', adoptionStoryMockupHandler);

// Printable gift certificate.
// Public route — the certificate_token is the only auth. Anyone with the
// link can view + print, but only the buyer ever receives the link
// (in their gift-purchase confirmation email). Renders a print-optimized
// page that says nicely when "Print to PDF" is used in the browser.
router.get('/gift/certificate/:token', async (req, res, next) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const token = (req.params.token || '').trim();
    if (!token || token.length < 8) {
      return res.status(404).render('book/not-found');
    }
    const { data: gift, error } = await supabaseAdmin
      .from('gift_codes')
      .select('code, buyer_name, recipient_name, recipient_message, expires_at, deliver_at, delivery_method, created_at')
      .eq('certificate_token', token)
      .single();
    if (error || !gift) {
      return res.status(404).render('book/not-found');
    }
    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    res.render('marketing/gift-certificate', {
      gift,
      redeemUrl: `https://${appDomain}/redeem?code=${gift.code}`,
      bareRedeemUrl: `${appDomain}/redeem`,
    });
  } catch (err) {
    next(err);
  }
});

// Set password page — linked from welcome email recovery link
router.get('/set-password', (req, res) => {
  res.render('marketing/set-password', {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// Back-compat alias: older mobile password-reset emails set the Supabase redirect to
// /reset-callback, which had no route — customers saw "Cannot GET /reset-callback".
// Serve the same set-password page so every already-sent recovery link still works.
// (New reset emails now target /set-password directly — see routes/api/auth.js.)
router.get('/reset-callback', (req, res) => {
  res.render('marketing/set-password', {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// Domains that show the book as a demo (password bypassed, CTA shown)
const DEMO_BOOK_DOMAINS = ['your-childs-name.com'];

function isDemoBookDomain(hostname) {
  const bare = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  return DEMO_BOOK_DOMAINS.includes(bare.toLowerCase());
}

// Serve static demo sites for specific domains and subdomains
const DEMO_SITES = {
  'your-childs-name.com': 'your-childs-name-demo.html',
  'your-childs-name': 'your-childs-name-demo.html', // subdomain match
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

// GET /robots.txt — Domain-aware robots policy.
//
// On legacyodyssey.com (the marketing site) we want the public pages indexed
// but admin/api hidden. On every customer's custom domain or subdomain
// ({customer}.legacyodyssey.com), we return Disallow:/ — every customer
// book is private and password-protected, and we don't want search engines
// touching them at all. This middleware runs BEFORE the static-file middleware
// in server.js so it overrides the static public/robots.txt.
router.get('/robots.txt', (req, res) => {
  const host = (req.hostname || '').toLowerCase();
  const appDomain = (process.env.APP_DOMAIN || 'legacyodyssey.com').toLowerCase();
  const isMarketing = host === appDomain || host === `www.${appDomain}` || host === 'localhost' || host === '127.0.0.1';

  res.set('Content-Type', 'text/plain');

  if (isMarketing) {
    return res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /stripe/
Disallow: /set-password
Disallow: /unsubscribe

Sitemap: https://${appDomain}/sitemap.xml
`);
  }

  // Customer domain (custom_domain or subdomain) — block everything
  res.send(`User-agent: *
Disallow: /
`);
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
    { loc: `https://${appDomain}/blog/getting-started-with-legacy-odyssey`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/legacy-odyssey-walkthrough`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/what-is-legacy-odyssey`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/birth-story-section`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/month-by-month`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/letters-to-your-child`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/the-family-website`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/getting-started-guide`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/circles-sharing`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/custom-galleries`, priority: '0.7', changefreq: 'monthly' },
    { loc: `https://${appDomain}/blog/reposition-photos`, priority: '0.7', changefreq: 'monthly' },
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

// GET /download — Smart app download page (detects iOS/Android and redirects)
router.get('/download', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/download.html'));
});

// GET /unsubscribe?token=... — One-click unsubscribe from drip-campaign emails.
// Honoured by the daily onboarding cron — anyone with unsubscribed_at set is
// skipped. Transactional emails (welcome, cancellation, password reset) still
// send because they're operationally necessary.
router.get('/unsubscribe', async (req, res) => {
  const { verifyUnsubscribeToken } = require('../services/unsubscribeTokens');
  const { supabaseAdmin } = require('../config/supabase');
  const familyId = verifyUnsubscribeToken(req.query.token);
  if (!familyId) {
    return res.status(400).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head><body style="font-family:Georgia,serif;background:#faf7f2;padding:40px;text-align:center;color:#2c2416;"><h1>Invalid or expired link</h1><p>This unsubscribe link isn't valid. If you'd like to opt out, just reply to any email and let us know.</p></body></html>`);
  }
  const { data: family } = await supabaseAdmin.from('families').select('id, email, unsubscribed_at').eq('id', familyId).maybeSingle();
  if (!family) {
    return res.status(404).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head><body style="font-family:Georgia,serif;background:#faf7f2;padding:40px;text-align:center;color:#2c2416;"><h1>Account not found</h1></body></html>`);
  }

  // Resubscribe path: ?action=resubscribe
  if (req.query.action === 'resubscribe') {
    await supabaseAdmin.from('families').update({ unsubscribed_at: null }).eq('id', familyId);
    return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resubscribed</title></head><body style="font-family:Georgia,serif;background:#faf7f2;padding:40px;text-align:center;color:#2c2416;"><h1>You're back on the list</h1><p>Welcome back, ${family.email}. You'll receive Legacy Odyssey emails again.</p></body></html>`);
  }

  if (!family.unsubscribed_at) {
    await supabaseAdmin.from('families').update({ unsubscribed_at: new Date().toISOString() }).eq('id', familyId);
  }
  const resubUrl = `/unsubscribe?token=${req.query.token}&action=resubscribe`;
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unsubscribed — Legacy Odyssey</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Jost:wght@400;500&display=swap" rel="stylesheet">
    <style>
      body { background:#faf7f2; font-family:'Jost',sans-serif; color:#2c2416; padding:40px 20px; min-height:80vh; display:flex; align-items:center; justify-content:center; }
      .card { max-width:520px; background:#fff; border:1px solid #e0d5c4; border-radius:14px; padding:48px 40px; text-align:center; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
      h1 { font-family:'Cormorant Garamond',serif; font-size:30px; margin:0 0 12px; color:#1a1a2e; }
      p { color:#8a7e6b; line-height:1.6; margin:0 0 16px; }
      .muted { font-size:13px; color:#a09080; }
      a.btn { display:inline-block; margin-top:18px; padding:11px 26px; background:transparent; border:1px solid #c8a96e; color:#c8a96e; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; }
      a.btn:hover { background:#c8a96e; color:#fff; }
    </style></head>
    <body><div class="card">
      <h1>You've been unsubscribed</h1>
      <p>We've removed <strong>${family.email}</strong> from our marketing emails.</p>
      <p class="muted">You'll still receive transactional emails (welcome, password resets, billing confirmations) — those are part of your account and can't be turned off.</p>
      <a class="btn" href="${resubUrl}">Changed your mind? Resubscribe</a>
    </div></body></html>`);
});

// GET /signup — Free account signup page
router.get('/signup', (req, res) => {
  res.render('marketing/signup');
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
    title: 'Circles: Sharing Your Book with Family, the Easy Way',
    excerpt: 'A private list of who can see the book, and a one-tap way to send each person their own private link whenever there\'s something new.',
    url: '/blog/circles-sharing',
    category: 'Feature',
    date: 'June 15, 2026',
    readTime: '5 min read',
  },
  {
    title: 'Custom Galleries: Photo Collections, Named However You Like',
    excerpt: 'Make as many photo collections as you like — up to 50 captioned photos each, reorderable, each its own page on the public book.',
    url: '/blog/custom-galleries',
    category: 'Feature',
    date: 'June 15, 2026',
    readTime: '5 min read',
  },
  {
    title: 'Reposition: Get the Crop Right on Every Photo',
    excerpt: 'Set the focal point so the crop centers on what matters — usually the face — wherever the photo appears. Your original is never changed.',
    url: '/blog/reposition-photos',
    category: 'Feature',
    date: 'June 15, 2026',
    readTime: '4 min read',
  },
  {
    title: 'Inside Legacy Odyssey: A Complete Walkthrough of Every Section',
    excerpt: 'Every section of the book explained — what\'s in it, how to fill it in, and what family sees on the website.',
    url: '/blog/legacy-odyssey-walkthrough',
    category: 'Walkthrough',
    date: 'May 22, 2026',
    readTime: '8 min read',
  },
  {
    title: 'What Is Legacy Odyssey?',
    excerpt: 'A digital baby book built as a real website at your child\'s own .com domain. Here\'s how it works.',
    url: '/blog/what-is-legacy-odyssey',
    category: 'Overview',
    date: 'May 22, 2026',
    readTime: '4 min read',
  },
  {
    title: 'How the Birth Story Section Works',
    excerpt: 'Two perspectives, custom labels, and a layout built for the people who were actually there.',
    url: '/blog/birth-story-section',
    category: 'Feature',
    date: 'May 22, 2026',
    readTime: '3 min read',
  },
  {
    title: 'Month by Month: Tracking the First Year',
    excerpt: 'Twelve months, each with a photo, measurements, and a note. Fill it in as the year goes on.',
    url: '/blog/month-by-month',
    category: 'Feature',
    date: 'May 22, 2026',
    readTime: '3 min read',
  },
  {
    title: 'Letters to You: Writing to Your Child Inside the Book',
    excerpt: 'Letters from family members, displayed as actual letter-style cards on the website.',
    url: '/blog/letters-to-your-child',
    category: 'Feature',
    date: 'May 22, 2026',
    readTime: '3 min read',
  },
  {
    title: 'What the Family Website Looks Like',
    excerpt: 'No app, no signup. Family opens it in any browser. Here\'s exactly what they see.',
    url: '/blog/the-family-website',
    category: 'The Website',
    date: 'May 22, 2026',
    readTime: '4 min read',
  },
  {
    title: 'Getting Started with Legacy Odyssey',
    excerpt: 'What you get, how to access everything, and what to expect when your domain goes live.',
    url: '/blog/getting-started-guide',
    category: 'Getting Started',
    date: 'May 22, 2026',
    readTime: '3 min read',
  },
  {
    title: 'Getting Started with Legacy Odyssey: A Complete Walkthrough',
    excerpt: 'A thorough walkthrough of everything that happens after you purchase — setting your password, downloading the app, filling in every section of your book, sharing with family, and the Time Vault.',
    url: '/blog/getting-started-with-legacy-odyssey',
    category: 'Getting Started',
    date: 'April 25, 2026',
    readTime: '12 min read',
  },
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

// GET /blog/getting-started-with-legacy-odyssey
router.get('/blog/getting-started-with-legacy-odyssey', (req, res) => {
  res.render('marketing/blog-getting-started');
});

// GET /blog/what-to-write-in-baby-book
router.get('/blog/what-to-write-in-baby-book', (req, res) => {
  res.render('marketing/blog-what-to-write-in-baby-book');
});

router.get('/blog/legacy-odyssey-walkthrough', (req, res) => {
  res.render('marketing/blog-legacy-odyssey-walkthrough');
});
router.get('/blog/what-is-legacy-odyssey', (req, res) => {
  res.render('marketing/blog-what-is-legacy-odyssey');
});
router.get('/blog/birth-story-section', (req, res) => {
  res.render('marketing/blog-birth-story-section');
});
router.get('/blog/month-by-month', (req, res) => {
  res.render('marketing/blog-month-by-month');
});
router.get('/blog/letters-to-your-child', (req, res) => {
  res.render('marketing/blog-letters-to-your-child');
});
router.get('/blog/the-family-website', (req, res) => {
  res.render('marketing/blog-the-family-website');
});
router.get('/blog/getting-started-guide', (req, res) => {
  res.render('marketing/blog-getting-started-guide');
});
router.get('/blog/circles-sharing', (req, res) => {
  res.render('marketing/blog-circles-sharing');
});
router.get('/blog/custom-galleries', (req, res) => {
  res.render('marketing/blog-custom-galleries');
});
router.get('/blog/reposition-photos', (req, res) => {
  res.render('marketing/blog-reposition-photos');
});

// Circle update emails — unsubscribe (works on any host: book domains + main
// domain). GET serves the link in the email footer; POST serves Gmail/Apple
// one-click (List-Unsubscribe-Post).
async function circleUnsubscribe(req, res) {
  const contactService = require('../services/contactService');
  let ok = false;
  try { ok = !!(await contactService.unsubscribeByToken(req.params.token)); } catch (e) { /* render generic */ }
  res.status(ok ? 200 : 404).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex"><title>Unsubscribed</title></head>
<body style="margin:0;background:#faf7f2;font-family:Georgia,serif;color:#2c2416;">
  <div style="max-width:460px;margin:5rem auto;padding:2.5rem 2rem;background:#fff;border-radius:12px;border:1px solid #e0d5c4;text-align:center;">
    <h1 style="font-size:1.5rem;margin:0 0 0.75rem;">${ok ? "You're unsubscribed" : 'Link not found'}</h1>
    <p style="font-size:0.95rem;color:#6b5d47;line-height:1.6;margin:0;">${ok
      ? "You won't receive any more update emails about this book. Your private view link still works if you'd like to visit."
      : 'This unsubscribe link is no longer valid.'}</p>
  </div>
</body></html>`);
}
router.get('/circle/unsubscribe/:token', circleUnsubscribe);
router.post('/circle/unsubscribe/:token', circleUnsubscribe);

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

  const siteLabel = await computeSiteLabel(req.family);
  res.render('book/password', { family: req.family, siteLabel, error: true });
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


    if (family) {
      // Webhook already processed — show success page (no temp password available).
      // If this buyer already had another active site, this is an additional site →
      // they log in with their existing account instead of setting a new password.
      let additionalSite = false;
      try {
        if (family.auth_user_id) {
          const fams = await familyService.findAllByAuthUserId(family.auth_user_id);
          additionalSite = fams.filter((f) => !f.archived_at).length > 1;
        }
      } catch (e) { /* best-effort; default to the normal password flow */ }
      return res.render('marketing/success', {
        subdomain: family.subdomain,
        domain,
        appDomain,
        plan,
        planValue,
        email,
        tempPassword: null,
        bookPassword: family.book_password || null,
        additionalSite,
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
      bookPassword: result.family.book_password || null,
      additionalSite: !!result.additionalSite,
      purchaseEventId,
    });
  } catch (err) {
    console.error('Stripe success handler error:', err);
  }
  res.redirect('/');
});

// Gift purchase page
// /gift is the live gift-purchase landing page (promoted from /preview/gift-landing
// on May 9 2026). The previous minimal form-only template (marketing/gift.ejs) is
// preserved on disk for reference but no longer rendered by any route.
router.get('/gift', (req, res) => {
  res.render('marketing/gift-landing');
});

// On-brand embedded gift checkout (Stripe Payment Element + Appearance API).
// Standalone for now so we can verify it without disturbing the live /gift
// hosted-Checkout flow. Once verified, the /gift "Give the Gift" button can
// point here. Needs STRIPE_PUBLISHABLE_KEY on the server to function.
router.get('/gift/checkout', (req, res) => {
  res.render('marketing/gift-checkout', {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    appDomain: process.env.APP_DOMAIN || 'legacyodyssey.com',
    initialPlan: req.query.plan === 'childhood' ? 'childhood' : 'annual',
  });
});

// On-brand embedded SIGNUP checkout (Stripe Payment Element). Preview/isolated:
// the live hosted signup (founder modal -> hosted Checkout) is unchanged. Needs
// STRIPE_PUBLISHABLE_KEY on the server. Accepts ?domain= & ?plan= to prefill.
router.get('/start/checkout', (req, res) => {
  const plan = ['annual', 'childhood'].includes(req.query.plan) ? req.query.plan : 'annual';
  res.render('marketing/signup-checkout', {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    appDomain: process.env.APP_DOMAIN || 'legacyodyssey.com',
    initialPlan: plan,
    initialDomain: typeof req.query.domain === 'string' ? req.query.domain : '',
  });
});

// Post-payment welcome for the embedded signup. Provisioning (account + book +
// domain) runs in the webhook; this page just reassures + points to email.
// Branded embedded-signup completion page. confirmPayment redirects here with
// ?payment_intent=...&redirect_status=succeeded (Stripe appends them to the
// return_url). We retrieve the PaymentIntent so the page can fire the SAME
// purchase analytics as the hosted-Checkout success page (success.ejs) — without
// this, every branded-signup conversion was invisible to GA4/Meta/Pinterest.
// Value comes from the actual charge (pi.amount), so it reflects the real
// first-year price ($29 annual intro / $10.98 monthly+setup / $450 childhood).
router.get('/start/welcome', async (req, res) => {
  const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
  let purchase = null;
  const piId = req.query.payment_intent;
  if (piId && req.query.redirect_status === 'succeeded') {
    try {
      const { stripe } = require('../config/stripe');
      if (stripe) {
        const pi = await stripe.paymentIntents.retrieve(piId);
        if (pi && pi.status === 'succeeded') {
          // period lives on the PI metadata for childhood; for subscriptions it's
          // on the subscription, so fall back to deriving from the charged amount.
          let plan = (pi.metadata && pi.metadata.period) || '';
          if (!plan) plan = pi.amount >= 45000 ? 'childhood' : (pi.amount === 2900 ? 'annual' : 'monthly');
          purchase = {
            transactionId: pi.id,
            value: (pi.amount || 0) / 100,
            plan,
          };
        }
      }
    } catch (err) {
      console.error('[start/welcome] purchase analytics lookup failed:', err.message);
      // Non-fatal — still show the welcome page, just without the purchase event.
    }
  }
  res.render('marketing/signup-welcome', { appDomain, purchase });
});

// Post-payment confirmation for the embedded checkout. Fulfillment normally
// happens in the payment_intent.succeeded webhook, but we ALSO finalize it here
// as a belt-and-suspenders fallback (idempotent) so a gift is fulfilled even if
// that webhook event isn't enabled on the Stripe endpoint. confirmPayment
// appends ?payment_intent=...&redirect_status=succeeded to the return_url.
router.get('/gift/thank-you', async (req, res) => {
  const { stripe } = require('../config/stripe');
  const piId = req.query.payment_intent;
  if (stripe && piId && req.query.redirect_status === 'succeeded') {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (pi && pi.status === 'succeeded' && pi.metadata?.type === 'gift') {
        const giftService = require('../services/giftService');
        await giftService.fulfillGiftForPaymentIntent(pi); // idempotent with the webhook
      }
    } catch (err) {
      console.error('[gift/thank-you] fallback fulfillment failed:', err.message);
      // Non-fatal — the webhook is the primary path; still show the thank-you page.
    }
  }
  res.render('marketing/gift-thank-you', {
    appDomain: process.env.APP_DOMAIN || 'legacyodyssey.com',
  });
});

// Gift success page — shown right after Stripe payment clears.
// We try to read the gift_codes row created by the webhook first; if the
// webhook hasn't fired yet (race), we create the row inline. Either way,
// the buyer sees their gift code, the redeem URL, the printable certificate
// link, and timing-aware messaging based on the delivery method they chose.
router.get('/gift/success', async (req, res) => {
  const { stripe } = require('../config/stripe');
  const giftService = require('../services/giftService');
  const sessionId = req.query.session_id;
  if (!sessionId || !stripe) return res.redirect('/gift');

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return res.redirect('/gift');

    // Find the gift code created by the webhook. Use limit(1) rather than
    // .single() — a webhook/redirect race can briefly leave more than one
    // row for a session, and .single() errors on multiple rows, which would
    // throw and bounce the buyer off this success page back to /gift.
    const { supabaseAdmin } = require('../config/supabase');
    const { data: giftRows } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(1);
    let gift = (giftRows && giftRows[0]) || null;

    if (!gift) {
      // Webhook hasn't fired yet — create the gift code now, passing all
      // the metadata fields so the deliver_at + certificate_token + delivery
      // method are populated correctly.
      gift = await giftService.createGiftCode({
        buyerEmail: session.customer_email || session.customer_details?.email,
        buyerName: session.metadata?.buyer_name,
        recipientName: session.metadata?.recipient_name || null,
        recipientEmail: session.metadata?.recipient_email,
        recipientMessage: session.metadata?.gift_message,
        stripeSessionId: session.id,
        deliveryMethod: session.metadata?.delivery_method,
        scheduledDate: session.metadata?.scheduled_date,
      });
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    res.render('marketing/gift-success', {
      giftCode: gift.code,
      redeemUrl: `https://${appDomain}/redeem?code=${gift.code}`,
      certificateUrl: gift.certificate_token ? `https://${appDomain}/gift/certificate/${gift.certificate_token}` : null,
      buyerEmail: gift.buyer_email,
      recipientName: gift.recipient_name,
      recipientEmail: gift.recipient_email,
      deliveryMethod: gift.delivery_method || 'email_now',
      deliverAt: gift.deliver_at,
      recipientEmailSentAt: gift.recipient_email_sent_at,
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
  // If no family found, show the marketing landing page (A/B split)
  if (req.isMarketingSite) {
    // landing-v2-cro is the sole live landing page (CRO redesign promoted, May 2026),
    // replacing the old v1/v2 A/B split. The old pages stay reachable for reference
    // at /preview/landing-v1 and /preview/landing-v2. The gift landing is separate.
    return res.render('marketing/landing-v2-cro', { landingVariant: 'v2-cro' });
  }
  next();
}, requireBookPassword, async (req, res, next) => {
  try {
    // Suspended accounts: show reinstate page instead of book
    if (req.family.subscription_status === 'canceled') {
      const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
      return res.render('book/suspended', { family: req.family, appDomain });
    }

    // Baby Book
    const data = await translateBook(await bookService.getFullBook(req.family.id), res.locals.lang);
    if (!data) return res.status(404).render('book/not-found');
    const isFree = req.family.plan !== 'paid' && req.family.subscription_status !== 'active';

    res.render('layouts/book', {
      family: req.family,
      isFree,
      isDemoDomain: isDemoBookDomain(req.hostname),
      ...data,
      imageUrl: getPublicUrl,
      photoPos: makePhotoPos(data.book && data.book.photo_positions),
    });
  } catch (err) {
    next(err);
  }
});

// GET /celebrations/:yearSlug/:celebrationSlug — Detail page for a single celebration
// Resolves the customer book by host (resolveFamily), enforces book password,
// then looks up the celebration by slug within (book_id, year_label). Falls
// back to title-derived slug if the celebrations.slug column doesn't exist
// yet (pre-migration-014).
router.get('/celebrations/:yearSlug/:celebrationSlug', resolveFamily, requireBookPassword, async (req, res, next) => {
  try {
    if (!req.family) return res.status(404).render('book/not-found');
    if (req.family.subscription_status === 'canceled') {
      const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
      return res.render('book/suspended', { family: req.family, appDomain });
    }

    const data = await translateBook(await bookService.getFullBook(req.family.id), res.locals.lang);
    if (!data) return res.status(404).render('book/not-found');

    const isFree = req.family.plan !== 'paid' && req.family.subscription_status !== 'active';
    // Free users can't see celebrations
    if (isFree) {
      return res.redirect('/');
    }

    const { yearSlug, celebrationSlug } = req.params;
    const allCelebrations = data.celebrations || [];

    // Find which year_label matches the yearSlug
    const matchedYear = (data.celebrationsByYear || []).find((y) =>
      bookService.slugifyYear(y.label) === yearSlug
    );
    if (!matchedYear) return res.status(404).render('book/not-found');

    const yearItems = matchedYear.items || [];
    // Match by slug — celebrations from bookService have .slug already resolved
    const celebration = yearItems.find((c) => c.slug === celebrationSlug);
    if (!celebration) return res.status(404).render('book/not-found');

    // Determine prev/next within the year (filtered to meaningful celebrations)
    const meaningful = (c) => c && (
      (c.title && c.title.trim() && c.title !== '(untitled)') ||
      (c.body && c.body.trim()) ||
      c.location || c.attendees || c.gifts ||
      (c.photos && c.photos.length > 0) || c.photo_path
    );
    const list = yearItems.filter(meaningful);
    const idx = list.findIndex((c) => c.id === celebration.id);
    const prevCelebration = idx > 0 ? list[idx - 1] : null;
    const nextCelebration = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

    res.render('layouts/celebration-detail', {
      book: data.book,
      family: req.family,
      visibleSections: data.visibleSections,
      celebrations: data.celebrations,
      celebrationsByYear: data.celebrationsByYear,
      recipesList: data.recipes || [],
      celebration,
      yearLabel: matchedYear.label,
      prevCelebration,
      nextCelebration,
      isFree,
      isDemoDomain: isDemoBookDomain(req.hostname),
      imageUrl: getPublicUrl,
      photoPos: makePhotoPos(data.book && data.book.photo_positions),
      celebrationVideos: (data.videos || []).filter((v) => v.context === 'celebration' && v.celebration_id === celebration.id),
    });
  } catch (err) {
    next(err);
  }
});

// GET /recipes/:slug — Detail page for a single recipe.
// Same access pattern as celebrations: family resolved by host, password
// enforced, free users redirected back to the SPA root.
router.get('/recipes/:slug', resolveFamily, requireBookPassword, async (req, res, next) => {
  try {
    if (!req.family) return res.status(404).render('book/not-found');
    if (req.family.subscription_status === 'canceled') {
      const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
      return res.render('book/suspended', { family: req.family, appDomain });
    }

    const data = await translateBook(await bookService.getFullBook(req.family.id), res.locals.lang);
    if (!data) return res.status(404).render('book/not-found');

    const isFree = req.family.plan !== 'paid' && req.family.subscription_status !== 'active';
    if (isFree) return res.redirect('/');

    const allRecipes = data.recipes || [];
    const recipe = allRecipes.find((r) => r.slug === req.params.slug);
    if (!recipe) return res.status(404).render('book/not-found');

    // Only navigate among recipes with meaningful content.
    const meaningful = (r) => r && (
      (r.title && r.title.trim() && r.title !== '(untitled)') ||
      (r.description && r.description.trim()) ||
      (r.story && r.story.trim()) ||
      (r.ingredients && r.ingredients.length > 0) ||
      (r.directions && r.directions.length > 0) ||
      (r.photos && r.photos.length > 0) ||
      r.photo_path
    );
    const list = allRecipes.filter(meaningful);
    const idx = list.findIndex((r) => r.id === recipe.id);
    const prevRecipe = idx > 0 ? list[idx - 1] : null;
    const nextRecipe = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

    res.render('layouts/recipe-detail', {
      book: data.book,
      family: req.family,
      visibleSections: data.visibleSections,
      celebrationsByYear: data.celebrationsByYear,
      recipesList: list,
      recipe,
      prevRecipe,
      nextRecipe,
      isFree,
      isDemoDomain: isDemoBookDomain(req.hostname),
      imageUrl: getPublicUrl,
      photoPos: makePhotoPos(data.book && data.book.photo_positions),
    });
  } catch (err) {
    next(err);
  }
});

// GET /keepsakes/:slug — Detail page for a single keepsake.
// Same access pattern as celebrations/recipes.
router.get('/keepsakes/:slug', resolveFamily, requireBookPassword, async (req, res, next) => {
  try {
    if (!req.family) return res.status(404).render('book/not-found');
    if (req.family.subscription_status === 'canceled') {
      const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
      return res.render('book/suspended', { family: req.family, appDomain });
    }

    const data = await translateBook(await bookService.getFullBook(req.family.id), res.locals.lang);
    if (!data) return res.status(404).render('book/not-found');

    const isFree = req.family.plan !== 'paid' && req.family.subscription_status !== 'active';
    if (isFree) return res.redirect('/');

    const allKeepsakes = data.keepsakes || [];
    const keepsake = allKeepsakes.find((k) => k.slug === req.params.slug);
    if (!keepsake) return res.status(404).render('book/not-found');

    // Only navigate among keepsakes with meaningful content.
    const meaningful = (k) => k && (
      (k.title && k.title.trim() && k.title !== '(untitled)' && k.title !== 'New Keepsake') ||
      (k.description && k.description.trim()) ||
      (k.story && k.story.trim()) ||
      (k.photos && k.photos.length > 0)
    );
    const list = allKeepsakes.filter(meaningful);
    const idx = list.findIndex((k) => k.id === keepsake.id);
    const prevKeepsake = idx > 0 ? list[idx - 1] : null;
    const nextKeepsake = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

    res.render('layouts/keepsake-detail', {
      book: data.book,
      family: req.family,
      visibleSections: data.visibleSections,
      celebrationsByYear: data.celebrationsByYear,
      recipesList: data.recipes || [],
      keepsakesList: list,
      keepsake,
      prevKeepsake,
      nextKeepsake,
      isFree,
      isDemoDomain: isDemoBookDomain(req.hostname),
      imageUrl: getPublicUrl,
      photoPos: makePhotoPos(data.book && data.book.photo_positions),
    });
  } catch (err) {
    next(err);
  }
});

// Catch /book/:slug for path-based access
router.get('/book/:slug', resolveFamily, requireBookPassword, async (req, res, next) => {
  try {
    if (!req.family) return res.status(404).render('book/not-found');

    // Suspended accounts: show reinstate page instead of book
    if (req.family.subscription_status === 'canceled') {
      const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
      return res.render('book/suspended', { family: req.family, appDomain });
    }

    // Baby Book
    const data = await translateBook(await bookService.getFullBook(req.family.id), res.locals.lang);
    if (!data) return res.status(404).render('book/not-found');
    const isFree = req.family.plan !== 'paid' && req.family.subscription_status !== 'active';

    res.render('layouts/book', {
      family: req.family,
      isFree,
      isDemoDomain: isDemoBookDomain(req.hostname),
      ...data,
      imageUrl: getPublicUrl,
      photoPos: makePhotoPos(data.book && data.book.photo_positions),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
