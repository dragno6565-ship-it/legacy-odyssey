/**
 * Marketing-site proxy.
 *
 * Phase 5 first cut: rather than re-port 2,500+ lines of EJS templates +
 * marketing.css + landing-page JavaScript into JSX, we proxy GET requests
 * for the public marketing routes from production legacyodyssey.com.
 *
 * Why this works for cutover:
 *   - Form POSTs from these pages all go to relative `/api/*` URLs which
 *     are already on v3 (auth/signup, stripe/create-*, contact, waitlist,
 *     domains/search). The proxied HTML doesn't need rewriting.
 *   - Browsers see the response coming from v3's hostname, so cookies and
 *     CORS work cleanly.
 *   - Cloudflare's edge caches each page for 5 minutes (cache-control
 *     public, max-age=300) — essentially free hosting for static-ish pages.
 *
 * Phase 6 will replace each proxied page with a native JSX port. The
 * proxy stays as a graceful-degrade fallback for pages we haven't
 * ported yet.
 *
 * NOT proxied here:
 *   - /book/:slug + /             handled by the existing book viewer routes
 *     (Phase 1 — those check c.var.family and render BookLayout)
 *   - /api/*                       handled by the API routers
 *   - /stripe/webhook              handled by the webhook router
 *   - /css/* /js/*                 already proxied at /css/book.css and /js/book.js
 *   - /css/marketing.css           added below alongside the page proxy
 */
import { Hono } from 'hono';
import type { Env } from '../lib/supabase';

// Proxy upstream: target Railway DIRECTLY, not legacyodyssey.com.
//
// Cutover-day footgun caught Apr 28: at cutover we'll point DNS for
// legacyodyssey.com at this Worker. If the proxy still fetched from
// legacyodyssey.com, it would loop back to itself → 524-style timeout.
// Hitting Railway directly bypasses the loop and is also faster
// (no Cloudflare round-trip on the upstream).
//
// The Railway URL is stable per-service (it's the Express deploy's own
// hostname). Lives in CLAUDE.md if it ever needs updating.
const PROD = 'https://legacy-odyssey-production.up.railway.app';

const marketing = new Hono<{ Bindings: Env }>();

/**
 * Generic proxy: fetch the same path from production, restream the body
 * with a fresh cache header. We strip out cookies (the session cookies
 * from production wouldn't apply on workers.dev) but keep content-type +
 * content-length untouched.
 */
async function proxyMarketing(env: Env, path: string): Promise<Response> {
  const upstreamUrl = `${PROD}${path}`;
  const upstream = await fetch(upstreamUrl, {
    cf: { cacheTtl: 300, cacheEverything: true } as any,
    redirect: 'follow',
  });

  const headers = new Headers();
  // Pass through content-type + status. Strip cookies/Set-Cookie which
  // would leak Express's own session cookies into the workers.dev origin.
  const ct = upstream.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  headers.set('cache-control', 'public, max-age=300');
  // Source attribution so we can spot proxied responses in DevTools.
  headers.set('x-v3-marketing-proxy', 'legacyodyssey.com');

  return new Response(upstream.body, { status: upstream.status, headers });
}

// Marketing.css proxy — same trick as the existing /css/book.css proxy.
marketing.get('/css/marketing.css', (c) => proxyMarketing(c.env, '/css/marketing.css'));
marketing.get('/css/admin.css', (c) => proxyMarketing(c.env, '/css/admin.css'));

// Static images, favicons, OG images live under /images on Express.
marketing.get('/images/*', (c) => {
  const path = new URL(c.req.url).pathname;
  return proxyMarketing(c.env, path);
});
marketing.get('/favicon.ico', (c) => proxyMarketing(c.env, '/favicon.ico'));
marketing.get('/robots.txt', (c) => proxyMarketing(c.env, '/robots.txt'));
marketing.get('/sitemap.xml', (c) => proxyMarketing(c.env, '/sitemap.xml'));

// Marketing pages. Each maps to the same path on production.
const MARKETING_PAGES = [
  '/gift',
  '/gift/success',
  '/redeem',
  '/set-password',
  '/signup',
  '/privacy',
  '/terms',
  '/blog',
  '/blog/getting-started-with-legacy-odyssey',
  '/blog/what-to-write-in-baby-book',
  '/stripe/success',
  '/additional-site/success',
];
for (const path of MARKETING_PAGES) {
  marketing.get(path, (c) => proxyMarketing(c.env, path));
}

// Account dashboard pages — also proxied for now. The /account/* surface
// is a web mirror of the mobile editor; mobile customers don't need it.
// If we later port these natively, replace the proxy entries one by one.
marketing.get('/account', (c) => proxyMarketing(c.env, '/account'));
marketing.get('/account/*', (c) => {
  const path = new URL(c.req.url).pathname;
  return proxyMarketing(c.env, path);
});
// Account form posts (login, forgot-password, etc.) also need to go to
// production for now — the session cookies live there.
marketing.post('/account', (c) => proxyMarketing(c.env, '/account'));
marketing.post('/account/*', async (c) => {
  // For POSTs we need to forward the body too.
  const path = new URL(c.req.url).pathname;
  const upstream = await fetch(`${PROD}${path}`, {
    method: 'POST',
    body: await c.req.arrayBuffer(),
    headers: {
      'content-type': c.req.header('content-type') || 'application/x-www-form-urlencoded',
    },
    redirect: 'follow',
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'text/html' },
  });
});

export default marketing;
