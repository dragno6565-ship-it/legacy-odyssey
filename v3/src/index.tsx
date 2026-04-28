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
import { adminClient, type Env } from './lib/supabase';
import { computeSiteLabel } from './lib/siteLabel';
import { resolveFamily } from './middleware/resolveFamily';
import { PasswordGate } from './views/PasswordGate';

const app = new Hono<{ Bindings: Env }>();

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

// Root path — password gate, marketing placeholder, or (eventually) book viewer.
app.get('/', async (c) => {
  const family = c.var.family;

  if (!family) {
    // Marketing site path — a real port comes in Phase 3. For now, a
    // recognizable placeholder so we know the routing works.
    return c.html(marketingPlaceholder(c.req.header('host') || 'unknown'));
  }

  // No password set → continue to book (Phase 1 next step). For now, placeholder.
  if (!family.book_password) {
    return c.html(bookPlaceholder(family.custom_domain || family.subdomain || 'Book'));
  }

  // Password set → render the gate.
  const supabase = adminClient(c.env);
  const siteLabel = await computeSiteLabel(supabase, family);
  return c.html(<PasswordGate siteLabel={siteLabel} subdomain={family.subdomain} error={false} />);
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
