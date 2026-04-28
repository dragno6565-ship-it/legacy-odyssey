/**
 * Hono middleware that looks up a family by the request's Host header.
 *
 * Direct port of src/middleware/resolveFamily.js. Same lookup priority:
 *   1. Custom domain (host !== app domain and not subdomain of it)
 *   2. Subdomain of app domain (eowynragno.legacyodyssey.com)
 *   3. Path-based fallback /book/:slug (used by mobile app preview)
 *   4. Local dev fallback for localhost → demo family
 *
 * If no family matches, sets c.set('isMarketingSite', true) and continues.
 * Otherwise stashes the family and resolved host on the context.
 *
 * Subscription gating (canceled/unpaid → 403, past_due >7d → 403) is
 * handled here, identical to the Express version.
 */
import type { Context, MiddlewareHandler } from 'hono';
import { adminClient, type Env } from '../lib/supabase';
import type { Family } from '../lib/types';

declare module 'hono' {
  interface ContextVariableMap {
    family: Family | null;
    isMarketingSite: boolean;
    bookSlug?: string;
  }
}

export const resolveFamily: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const supabase = adminClient(c.env);
  const url = new URL(c.req.url);
  const host = url.hostname.toLowerCase();
  const appDomain = c.env.APP_DOMAIN || 'legacyodyssey.com';

  let family: Family | null = null;

  // 1. Custom domain
  const isAppDomain = host === appDomain || host === `www.${appDomain}`;
  const isSubdomain = host.endsWith(`.${appDomain}`);
  if (!isAppDomain && !isSubdomain) {
    const customDomainHost = host.startsWith('www.') ? host.slice(4) : host;
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('custom_domain', customDomainHost)
      .eq('is_active', true)
      .maybeSingle();
    family = (data as Family | null) ?? null;
  }

  // 2. Subdomain of app domain
  if (!family && isSubdomain) {
    const subdomain = host.slice(0, host.length - appDomain.length - 1);
    if (subdomain && !['www', 'app', 'admin'].includes(subdomain)) {
      const { data } = await supabase
        .from('families')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .maybeSingle();
      family = (data as Family | null) ?? null;
    }
  }

  // 3. Path-based /book/:slug fallback
  if (!family && url.pathname.startsWith('/book/')) {
    const slug = url.pathname.split('/')[2];
    if (slug) {
      const { data } = await supabase
        .from('families')
        .select('*')
        .eq('subdomain', slug)
        .eq('is_active', true)
        .maybeSingle();
      family = (data as Family | null) ?? null;
      if (family) c.set('bookSlug', slug);
    }
  }

  // 4. Local dev fallback (Workers won't typically hit this — keeping for parity)
  if (!family && (host === 'localhost' || host === '127.0.0.1') && c.env.NODE_ENV !== 'production') {
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('subdomain', 'demo')
      .eq('is_active', true)
      .maybeSingle();
    family = (data as Family | null) ?? null;
  }

  // No family — marketing site path
  if (!family) {
    c.set('family', null);
    c.set('isMarketingSite', true);
    return next();
  }

  // Subscription gating
  const status = family.subscription_status;
  if (status === 'canceled' || status === 'unpaid') {
    return c.html(renderExpiredPlaceholder(family), 403);
  }
  if (status === 'past_due') {
    const updatedAt = new Date(family.updated_at || family.created_at);
    const daysSincePastDue = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePastDue > 7) {
      return c.html(renderExpiredPlaceholder(family), 403);
    }
  }

  c.set('family', family);
  c.set('isMarketingSite', false);
  return next();
};

// Tiny inline placeholder until Phase 2 ports the real expired/suspended pages.
function renderExpiredPlaceholder(family: Family): string {
  const label = family.custom_domain || family.subdomain || 'this site';
  return `<!DOCTYPE html><html><head><title>Subscription expired — ${label}</title>
<style>body{font-family:system-ui;max-width:560px;margin:4rem auto;padding:0 1.5rem;color:#2c2416;line-height:1.6;text-align:center}
h1{font-family:Georgia,serif;color:#b08e4a}</style></head>
<body><h1>${label}</h1>
<p>This site's subscription is currently suspended. The owner can reactivate at
<a href="https://legacyodyssey.com/account">legacyodyssey.com/account</a>.</p>
</body></html>`;
}
