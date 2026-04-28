/**
 * Legacy Odyssey v3 — Cloudflare Workers entry point.
 *
 * Phase 0 (Apr 28 2026): smoke-test scaffolding only. Routes are placeholders
 * that confirm the deploy pipeline works and the Worker can read the Host
 * header. Real route logic ports from the Express app in src/ in Phase 1+.
 *
 * See docs/projects/v3-workers-rewrite.md for the full plan.
 */
import { Hono } from 'hono';

type Bindings = {
  APP_DOMAIN: string;
  NODE_ENV: string;
  // Secrets get added later via `wrangler secret put`:
  // SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, etc.
};

const app = new Hono<{ Bindings: Bindings }>();

// Smoke-test routes — replaced in Phase 1+ with real handlers.

app.get('/', (c) => {
  const host = c.req.header('host') || 'unknown';
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Legacy Odyssey v3 — placeholder</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1.5rem; color: #2c2416; line-height: 1.6; }
  code { background: #f0e8dc; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
  h1 { font-family: Georgia, serif; color: #b08e4a; }
  .muted { color: #8a7e6b; }
</style>
</head>
<body>
  <h1>Legacy Odyssey v3 — Worker is alive</h1>
  <p>This is the Cloudflare Workers + Hono rewrite scaffolding (Phase 0). Real routes get ported in Phase 1+.</p>
  <p class="muted">Host header received: <code>${escapeHtml(host)}</code></p>
  <p class="muted">App domain (env): <code>${escapeHtml(c.env.APP_DOMAIN)}</code></p>
  <p class="muted">Environment: <code>${escapeHtml(c.env.NODE_ENV)}</code></p>
  <hr style="margin: 2rem 0; border: 0; border-top: 1px solid #e0d5c4">
  <p class="muted">v3 progress: see <a href="https://github.com/dragno6565-ship-it/legacy-odyssey/blob/v3-workers/docs/projects/v3-workers-rewrite.md">docs/projects/v3-workers-rewrite.md</a></p>
</body>
</html>`);
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: 'v3-0.0.1-phase0',
    timestamp: new Date().toISOString(),
    host: c.req.header('host'),
    cf: {
      colo: (c.req.raw as any).cf?.colo,
      country: (c.req.raw as any).cf?.country,
    },
  });
});

// Catch-all so we can confirm Worker handles arbitrary hosts (custom domains will land here).
app.notFound((c) => {
  return c.json(
    {
      error: 'not_found',
      hint: 'Phase 0 only has / and /health routes. Other routes are ported in later phases.',
      host: c.req.header('host'),
      path: c.req.path,
    },
    404
  );
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export default app;
