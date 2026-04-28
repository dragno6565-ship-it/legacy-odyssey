/**
 * Legacy Odyssey v3 — Cloudflare Workers entry point.
 *
 * Phase 1 (Apr 28 2026): family lookup by Host header + password gate render.
 * The first real port from the Express app — proves the Worker can read
 * production Supabase, run middleware, and render JSX.
 *
 * What's here:
 *   - resolveFamily middleware (Host → families row, with subscription gating)
 *   - GET / → password gate (or marketing-site placeholder if no family)
 *   - GET /health → JSON status, includes whether a family was resolved
 *
 * What's NOT here yet (later phases):
 *   - Actual book content rendering (months, family, recipes, etc.) — Phase 1 next steps
 *   - POST /verify-password — Phase 1 next
 *   - Marketing site routes — Phase 3
 *   - Mobile API — Phase 2
 *   - Stripe webhooks — Phase 3
 *
 * See docs/projects/v3-workers-rewrite.md for the full plan.
 */
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { adminClient, type Env } from './lib/supabase';
import { computeSiteLabel } from './lib/siteLabel';
import { hashPassword } from './lib/passwordHash';
import { getFullBook, imageUrl as makeImageUrl, makePhotoPos } from './lib/bookService';
import { resolveFamily } from './middleware/resolveFamily';
import { requireBookPassword } from './middleware/requireBookPassword';
import { PasswordGate } from './views/PasswordGate';
import { BookLayout } from './views/book/BookLayout';
import authApi from './routes/api/auth';
import booksApi from './routes/api/books';
import type { Family } from './lib/types';

const app = new Hono<{ Bindings: Env }>();

// Same-origin proxy for the legacy book.js / book.css. Mounted BEFORE
// resolveFamily so the Host header (e.g. workers.dev) doesn't 404 us.
//
// Why we proxy instead of <script src="https://legacyodyssey.com/...">:
// loading book.js cross-origin from the workers.dev hostname fails in the
// browser ("error" event on <script>, despite curl returning 200). This
// re-serves the same bytes from the Worker so nothing is cross-origin.
//
// TTL=14400 matches what Express sets, and Cloudflare caches at the edge.
const proxyAsset = (path: string, contentType: string) => async () => {
  const upstream = `https://legacyodyssey.com${path}`;
  const res = await fetch(upstream, { cf: { cacheTtl: 14400, cacheEverything: true } as any });
  return new Response(res.body, {
    status: res.status,
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=14400',
    },
  });
};
app.get('/js/book.js', proxyAsset('/js/book.js', 'text/javascript; charset=utf-8'));
app.get('/css/book.css', proxyAsset('/css/book.css', 'text/css; charset=utf-8'));

// Mobile API. Mounted BEFORE resolveFamily because /api/* uses Bearer-token
// auth via requireAuth, not Host-header family resolution. resolveFamily
// would 403 these requests on workers.dev because the host doesn't match
// any customer domain.
app.route('/api/auth', authApi);
app.route('/api/books', booksApi);

// Route order: resolveFamily first, then everything else can read c.var.family.
app.use('*', resolveFamily);

// Health check — useful for verifying deploy + family resolution.
app.get('/health', (c) => {
  const family = c.var.family;
  return c.json({
    status: 'ok',
    version: 'v3-0.0.2-phase1',
    timestamp: new Date().toISOString(),
    host: c.req.header('host'),
    family: family
      ? {
          id: family.id,
          custom_domain: family.custom_domain,
          subdomain: family.subdomain,
          subscription_status: family.subscription_status,
        }
      : null,
    isMarketingSite: c.var.isMarketingSite ?? false,
    cf: {
      colo: (c.req.raw as any).cf?.colo,
      country: (c.req.raw as any).cf?.country,
    },
  });
});

// Root path — password gate (via middleware) → real book viewer.
// Marketing-site routes (no family resolved) ported in Phase 3.
app.get('/', requireBookPassword, async (c) => {
  const family = c.var.family;
  if (!family) {
    return c.html(marketingPlaceholder(c.req.header('host') || 'unknown'));
  }

  const supabase = adminClient(c.env);
  const data = await getFullBook(supabase, family.id);
  if (!data) {
    return c.html('<h1>404 — No book found for this family</h1>', 404);
  }

  const imageUrl = (path: string | null | undefined) => makeImageUrl(c.env.SUPABASE_URL, path);
  const photoPos = makePhotoPos(data.book.photo_positions);
  return c.html(<BookLayout data={data} imageUrl={imageUrl} photoPos={photoPos} />);
});

// /book/:slug — same as / but routed by path (used by mobile app preview
// and any test environment where the Host doesn't match a customer domain).
// resolveFamily already handles the slug lookup and stashes the family.
app.get('/book/:slug', requireBookPassword, async (c) => {
  const family = c.var.family;
  if (!family) {
    return c.html('<h1>404 — Book not found</h1>', 404);
  }
  const supabase = adminClient(c.env);
  const data = await getFullBook(supabase, family.id);
  if (!data) {
    return c.html('<h1>404 — No book found for this family</h1>', 404);
  }
  const imageUrl = (path: string | null | undefined) => makeImageUrl(c.env.SUPABASE_URL, path);
  const photoPos = makePhotoPos(data.book.photo_positions);
  return c.html(<BookLayout data={data} imageUrl={imageUrl} photoPos={photoPos} />);
});

// POST /verify-password — set the HMAC cookie and redirect to /
// Direct port of the route in src/routes/book.js. Falls back to slug-from-form
// lookup so the password gate works on any domain (including Railway URLs).
app.post('/verify-password', async (c) => {
  const supabase = adminClient(c.env);
  const form = await c.req.parseBody();
  const password = String(form.password || '');
  const slug = String(form.slug || '');

  // Try the resolveFamily-set family first; fall back to slug lookup.
  let family: Family | null = c.var.family;
  if (!family && slug) {
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('subdomain', slug)
      .eq('is_active', true)
      .maybeSingle();
    family = (data as Family | null) ?? null;
  }

  if (!family) {
    return c.html('<h1>404 — Book not found</h1>', 404);
  }

  if (
    password &&
    family.book_password &&
    password.toLowerCase() === family.book_password.toLowerCase()
  ) {
    const hash = await hashPassword(family.book_password, family.id, c.env.SESSION_SECRET);
    setCookie(c, `book_${family.id}`, hash, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days, in seconds
      sameSite: 'Lax',
      path: '/',
    });
    // Redirect to /book/:slug so it works on any domain (including Railway URL)
    const target = slug || family.subdomain || '';
    return c.redirect(target ? `/book/${target}` : '/');
  }

  // Wrong password — re-render the gate with error
  const siteLabel = await computeSiteLabel(supabase, family);
  return c.html(
    <PasswordGate siteLabel={siteLabel} subdomain={family.subdomain} error={true} />,
    401
  );
});

// 404 catch-all so we know what's not ported yet.
app.notFound((c) => {
  return c.json(
    {
      error: 'not_found',
      hint: 'Phase 1 only ports / and /health. More routes in upcoming phases.',
      host: c.req.header('host'),
      path: c.req.path,
      family_resolved: c.var.family ? c.var.family.id : null,
    },
    404
  );
});

function marketingPlaceholder(host: string): string {
  const escapedHost = escapeHtml(host);
  return `<!DOCTYPE html><html><head><title>Legacy Odyssey v3 — marketing placeholder</title>
<style>body{font-family:system-ui;max-width:560px;margin:4rem auto;padding:0 1.5rem;color:#2c2416;line-height:1.6;text-align:center}
h1{font-family:Georgia,serif;color:#b08e4a}code{background:#f0e8dc;padding:.15em .4em;border-radius:3px}</style></head>
<body><h1>v3 marketing placeholder</h1>
<p>No customer family matches Host header <code>${escapedHost}</code>.</p>
<p>Real marketing site routes get ported in Phase 3.</p></body></html>`;
}

function bookPlaceholder(label: string): string {
  return `<!DOCTYPE html><html><head><title>${escapeHtml(label)} — v3 book placeholder</title>
<style>body{font-family:system-ui;max-width:560px;margin:4rem auto;padding:0 1.5rem;color:#2c2416;line-height:1.6;text-align:center}
h1{font-family:Georgia,serif;color:#b08e4a}</style></head>
<body><h1>${escapeHtml(label)}</h1>
<p>Family found, no password set. The book view is ported in Phase 1 next-step.</p></body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export default app;
