// Blocker-proof pageview counter (2026-08-24).
//
// Clarity and GA4 are client-side trackers that Brave, Safari ITP, Firefox, and
// ad blockers routinely block — so they UNDERCOUNT real visitors and can show
// "nobody here" while people are actually on the site. This records human
// marketing-page GETs SERVER-side (nothing to block), giving a true "did anyone
// visit" number on the admin health page. Best-effort and non-blocking: any
// failure is swallowed so it can never slow or break a page.

const { realHost } = require('../utils/realHost');
const { supabaseAdmin } = require('../config/supabase');

// User agents we never count as a human visit: crawlers, link unfurlers,
// scanners, uptime probes, and our own monitors.
const BOT_UA = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|quora|whatsapp|telegram|discord|skype|line-poker|preview|headless|phantom|puppeteer|playwright|selenium|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|libwww|httpclient|scan|monitor|uptime|pingdom|statuscake|semrush|ahrefs|mj12|dotbot|petalbot|dataforseo|censys|masscan|zgrab|nuclei|legacyodyssey-(pulse|healthcheck)|sentryuptimebot/i;

// Paths that are not marketing HTML pages (APIs, admin, assets, infra files).
const SKIP_PREFIX = ['/api', '/admin', '/stripe', '/book', '/assets', '/img', '/images', '/css', '/js', '/fonts', '/guides', '/.well-known'];
const SKIP_EXACT = new Set(['/health', '/robots.txt', '/sitemap.xml', '/favicon.ico']);

function isMarketingHost(host, appDomain) {
  return host === appDomain || host === `www.${appDomain}` || host === 'localhost' || host === '127.0.0.1';
}

module.exports = function recordPageView(req, res, next) {
  try {
    if (req.method !== 'GET') return next();

    const appDomain = (process.env.APP_DOMAIN || 'legacyodyssey.com').toLowerCase();
    const host = realHost(req).toLowerCase().replace(/:\d+$/, '');
    // Only the public marketing site — customer book domains are private.
    if (!isMarketingHost(host, appDomain)) return next();

    const path = (req.path || '/').toLowerCase();
    if (SKIP_EXACT.has(path)) return next();
    if (SKIP_PREFIX.some((p) => path === p || path.startsWith(p + '/'))) return next();
    // Skip anything that looks like a file (has an extension in its last segment).
    if (/\.[a-z0-9]{1,6}$/.test(path)) return next();

    const ua = req.headers['user-agent'] || '';
    if (!ua || BOT_UA.test(ua)) return next();
    // Real browsers navigating to a page send an Accept that prefers HTML.
    if (!String(req.headers['accept'] || '').includes('text/html')) return next();

    // Fire-and-forget — never await, never let a DB hiccup touch the response.
    let refHost = null;
    try { if (req.headers['referer']) refHost = new URL(req.headers['referer']).host.slice(0, 120); } catch (_) {}
    supabaseAdmin.from('page_views').insert({
      path: req.path.slice(0, 300),
      ref_host: refHost,
      ip: (req.ip || req.headers['x-forwarded-for'] || '').toString().slice(0, 64),
      ua: ua.slice(0, 300),
    }).then(() => {}, () => {}); // swallow all outcomes
  } catch (_) { /* never block a page over analytics */ }
  next();
};
