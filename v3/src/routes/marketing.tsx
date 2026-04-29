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
import { stripeClient } from '../lib/stripeClient';
import { adminClient } from '../lib/supabase';
import { findBySubdomain, findByStripeCustomerId } from '../lib/familyService';
import { StripeSuccess } from '../views/marketing/StripeSuccess';
import { SetPassword } from '../views/marketing/SetPassword';
import { Redeem } from '../views/marketing/Redeem';

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
// Native ports below replace specific entries from this list.
const MARKETING_PAGES = [
  '/gift',
  '/gift/success',
  '/signup',
  '/privacy',
  '/terms',
  '/blog',
  '/blog/getting-started-with-legacy-odyssey',
  '/blog/what-to-write-in-baby-book',
  '/additional-site/success',
];
for (const path of MARKETING_PAGES) {
  marketing.get(path, (c) => proxyMarketing(c.env, path));
}

/**
 * GET /set-password — completes the Supabase recovery-link password set.
 * Native port of marketing/set-password.ejs. Body of the page is mostly
 * client-side JS that reads the recovery access_token out of the URL hash
 * and PUTs to Supabase /auth/v1/user. Server only injects SUPABASE_URL +
 * SUPABASE_ANON_KEY (both public values).
 */
marketing.get('/set-password', (c) =>
  c.html(<SetPassword supabaseUrl={c.env.SUPABASE_URL} supabaseAnonKey={c.env.SUPABASE_ANON_KEY} />)
);

/**
 * GET /redeem — gift redemption page.
 * Query string: ?code=GIFT-XXXX-XXXX-XXXX (pre-fills the form)
 * Form posts to /api/stripe/redeem-gift (Phase 3 — already on v3).
 */
marketing.get('/redeem', (c) => c.html(<Redeem code={c.req.query('code')} />));

/**
 * GET /stripe/success — native port of stripe-success page from Express.
 *
 * Customer arrives here with ?session_id=cs_live_… set as the success_url
 * on the Checkout session. We retrieve the Stripe session, verify the
 * payment status, look up the family the webhook should have created,
 * and render the success view. Race-tolerant: if the webhook hasn't
 * fired yet (rare), we still render the page with whatever info we have
 * from the Checkout session metadata.
 */
marketing.get('/stripe/success', async (c) => {
  const sessionId = c.req.query('session_id');
  if (!sessionId) return c.redirect('/');

  let stripe;
  try {
    stripe = stripeClient(c.env);
  } catch {
    return c.redirect('/');
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err: any) {
    console.error('[stripe/success] retrieve failed:', err.message);
    return c.redirect('/');
  }

  if (session.payment_status !== 'paid') return c.redirect('/');

  const meta = (session.metadata || {}) as Record<string, string>;
  const subdomain = meta.subdomain || null;
  const domain = meta.domain || null;
  const plan = meta.plan || 'starter';
  const email =
    session.customer_email || (session.customer_details as any)?.email || '';
  const planValue = plan === 'annual' || plan === 'annual_intro' ? 49.99 : 4.99;
  const purchaseEventId = `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const supabase = adminClient(c.env);
  let family = subdomain ? await findBySubdomain(supabase, subdomain) : null;
  if (!family && session.customer) {
    family = await findByStripeCustomerId(supabase, String(session.customer));
  }

  return c.html(
    <StripeSuccess
      email={email}
      subdomain={family?.subdomain || subdomain}
      appDomain={c.env.APP_DOMAIN || 'legacyodyssey.com'}
      plan={plan}
      planValue={planValue}
      domain={domain}
      tempPassword={null}
      bookPassword={family?.book_password || null}
      purchaseEventId={purchaseEventId}
    />
  );
});

// Account dashboard pages — also proxied for now. The /account/* surface
// is a web mirror of the mobile editor; mobile customers don't need it.
// If we later port these natively, replace the proxy entries one by one.
marketing.get('/account', (c) => proxyMarketing(c.env, '/account'));
marketing.get('/account/*', (c) => {
  const path = new URL(c.req.url).pathname;
  return proxyMarketing(c.env, path);
});

// Admin panel — operator-only surface. Same proxy pattern as /account, but
// admin sessions live on Railway, so we forward cookies in BOTH directions
// (request + response Set-Cookie) so the operator's login persists.
marketing.get('/admin', (c) => proxyMarketingWithCookies(c, '/admin'));
marketing.get('/admin/*', (c) => {
  const path = new URL(c.req.url).pathname;
  return proxyMarketingWithCookies(c, path);
});
marketing.post('/admin', (c) => proxyMarketingPostWithCookies(c, '/admin'));
marketing.post('/admin/*', (c) => {
  const path = new URL(c.req.url).pathname;
  return proxyMarketingPostWithCookies(c, path);
});

// Account form posts (login, forgot-password, etc.) also need to go to
// production for now — the session cookies live there.
marketing.post('/account', (c) => proxyMarketingPostWithCookies(c, '/account'));
marketing.post('/account/*', (c) => {
  const path = new URL(c.req.url).pathname;
  return proxyMarketingPostWithCookies(c, path);
});

/**
 * Cookie-aware GET proxy. Forwards the client's Cookie header upstream and
 * pipes any Set-Cookie back to the browser (rewriting Domain= to drop a
 * production-specific value). Used by routes that have user sessions.
 */
async function proxyMarketingWithCookies(c: any, path: string): Promise<Response> {
  const headers: Record<string, string> = {};
  const cookie = c.req.header('cookie');
  if (cookie) headers['cookie'] = cookie;
  const ua = c.req.header('user-agent');
  if (ua) headers['user-agent'] = ua;

  const upstream = await fetch(`${PROD}${path}`, {
    headers,
    redirect: 'manual', // pass through 302s instead of following
  });

  const out = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) out.set('content-type', ct);
  // Forward Set-Cookie. Workers need .raw('set-cookie') — but Hono's
  // Response init doesn't support multi-value, so iterate getSetCookie.
  const setCookies = (upstream.headers as any).getSetCookie?.() as string[] | undefined;
  if (setCookies) for (const sc of setCookies) out.append('set-cookie', sc);
  const loc = upstream.headers.get('location');
  if (loc) out.set('location', loc);
  out.set('x-v3-marketing-proxy', 'legacyodyssey.com');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

/** Cookie-aware POST proxy — forwards body, content-type, and cookies. */
async function proxyMarketingPostWithCookies(c: any, path: string): Promise<Response> {
  const headers: Record<string, string> = {
    'content-type': c.req.header('content-type') || 'application/x-www-form-urlencoded',
  };
  const cookie = c.req.header('cookie');
  if (cookie) headers['cookie'] = cookie;
  const ua = c.req.header('user-agent');
  if (ua) headers['user-agent'] = ua;

  const upstream = await fetch(`${PROD}${path}`, {
    method: 'POST',
    body: await c.req.arrayBuffer(),
    headers,
    redirect: 'manual',
  });

  const out = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) out.set('content-type', ct);
  const setCookies = (upstream.headers as any).getSetCookie?.() as string[] | undefined;
  if (setCookies) for (const sc of setCookies) out.append('set-cookie', sc);
  const loc = upstream.headers.get('location');
  if (loc) out.set('location', loc);
  out.set('x-v3-marketing-proxy', 'legacyodyssey.com');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export default marketing;
