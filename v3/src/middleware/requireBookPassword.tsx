/**
 * Hono middleware: require valid book-password cookie before serving the book.
 *
 * Direct port of requireBookPassword from src/middleware/requireBookPassword.js.
 * Order of bypass checks is intentionally identical to Express version:
 *   1. No password set → allow
 *   2. Demo domains (your-childs-name.com, your-family-photo-album.com) → allow
 *   3. Mobile app preview via /book/:slug on Railway URL → allow (legacy path)
 *   4. Mobile JWT token in ?app_token query → allow if valid
 *   5. Cookie matches HMAC(book_password, familyId, SESSION_SECRET) → allow
 *   6. Otherwise render password gate
 */
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../lib/supabase';
import { adminClient } from '../lib/supabase';
import { hashPassword, constantTimeEqual } from '../lib/passwordHash';
import { computeSiteLabel } from '../lib/siteLabel';
import { PasswordGate } from '../views/PasswordGate';

const DEMO_DOMAINS = ['your-childs-name.com', 'your-family-photo-album.com'];

export const requireBookPassword: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const family = c.var.family;
  if (!family) {
    return c.html('<h1>404 — Book not found</h1>', 404);
  }

  // 1. No password configured → wide open
  if (!family.book_password) {
    return next();
  }

  const url = new URL(c.req.url);
  const host = url.hostname.toLowerCase();
  const bareHost = host.startsWith('www.') ? host.slice(4) : host;

  // 2. Demo domains always bypass
  if (DEMO_DOMAINS.includes(bareHost)) {
    return next();
  }

  // 3. Mobile preview: Railway URL + /book/:slug. Legacy path; keep for parity.
  const isRailwayHost = host.endsWith('.up.railway.app');
  if (isRailwayHost && url.pathname.startsWith('/book/')) {
    return next();
  }

  // 4. Mobile JWT token bypass — Phase 2 will wire up real JWT verification.
  // For Phase 1 we honor the same query-param shape but log if used so we
  // can audit before fully removing this code path.
  const appToken = url.searchParams.get('app_token');
  if (appToken) {
    // TODO Phase 2: verify JWT with JWT_SECRET, check decoded.familyId === family.id
    // For now, leave this as a deny so we don't accidentally bypass auth.
    console.log('[requireBookPassword] app_token bypass not yet ported — denying');
  }

  // 5. Cookie check
  const cookieName = `book_${family.id}`;
  const cookie = getCookie(c, cookieName);
  if (cookie) {
    const expected = await hashPassword(family.book_password, family.id, c.env.SESSION_SECRET);
    if (constantTimeEqual(cookie, expected)) {
      return next();
    }
  }

  // 6. Fall through: render password gate
  const supabase = adminClient(c.env);
  const siteLabel = await computeSiteLabel(supabase, family);
  return c.html(<PasswordGate siteLabel={siteLabel} subdomain={family.subdomain} error={false} />);
};
