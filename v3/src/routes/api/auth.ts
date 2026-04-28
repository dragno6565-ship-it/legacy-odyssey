/**
 * /api/auth — mobile auth endpoints.
 *
 * Phase 2 first cut: check-subdomain, login, logout, refresh, reset-password,
 * update-password. These six are enough for the mobile app's sign-in,
 * forgot-password, and token-refresh flows.
 *
 * Endpoints intentionally deferred to a later commit:
 *   - POST /signup — needs createBookWithDefaults (~100 lines of seed data)
 *   - POST /cancel — needs the full subscriptionService (Stripe Subscription
 *     Schedule, soft-cancel logic, primary-promotion). Lands with the rest
 *     of the Stripe port.
 *   - DELETE /account — was already deprecated → 410 in Express. Same here.
 *
 * Direct port of src/routes/api/auth.js.
 */
import { Hono } from 'hono';
import { adminClient, anonClient, type Env } from '../../lib/supabase';
import {
  findBySubdomain,
  findByAuthUserId,
  findAllByAuthUserId,
  createFamily,
} from '../../lib/familyService';
import { createBookWithDefaults } from '../../lib/bookService';
import * as seedData from '../../lib/seedData';
import {
  isPrimaryFamily,
  promoteSecondaryToPrimary,
  softCancelAllForUser,
  softCancelFamily,
} from '../../lib/subscriptionService';
import { requireAuth } from '../../middleware/requireAuth';
import type { Family } from '../../lib/types';

const auth = new Hono<{ Bindings: Env }>();

// GET /api/auth/check-subdomain?s=xxx — Live availability check during signup.
auth.get('/check-subdomain', async (c) => {
  const raw = (c.req.query('s') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!raw || raw.length < 3) return c.json({ available: false, subdomain: raw });
  const supabase = adminClient(c.env);
  const existing = await findBySubdomain(supabase, raw);
  return c.json({ available: !existing, subdomain: raw });
});

// POST /api/auth/signup — create auth user + family + seeded book + session.
// Direct port of /api/auth/signup from src/routes/api/auth.js.
auth.post('/signup', async (c) => {
  const { email, password, subdomain, displayName } = await c.req.json<{
    email?: string;
    password?: string;
    subdomain?: string;
    displayName?: string;
  }>();
  if (!email || !password || !subdomain) {
    return c.json({ error: 'email, password, and subdomain are required' }, 400);
  }

  const supabase = adminClient(c.env);

  const existing = await findBySubdomain(supabase, subdomain);
  if (existing) return c.json({ error: 'This subdomain is already taken' }, 409);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });
  if (authError || !authData.user) {
    return c.json({ error: authError?.message || 'Failed to create user' }, 400);
  }

  const family = await createFamily(supabase, {
    email,
    authUserId: authData.user.id,
    subdomain,
    displayName: displayName || `The ${subdomain} Family`,
  });

  const book = await createBookWithDefaults(supabase, family.id, seedData);

  // Sign in immediately so the mobile app gets tokens back.
  const anon = anonClient(c.env);
  const { data: session, error: sessionError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (sessionError || !session.session) {
    return c.json(
      {
        error: 'Account created but login failed. Please try logging in.',
        // Surface the actual Supabase reason so the mobile client can show
        // a useful message (matches what Express does after the Apr 26
        // pwned-password debugging session).
        detail: sessionError?.message || 'no session returned',
        code: (sessionError as any)?.code,
        status: (sessionError as any)?.status,
      },
      500
    );
  }

  return c.json(
    {
      family,
      book,
      session: {
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        expires_at: session.session.expires_at,
      },
    },
    201
  );
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();
  if (!email || !password) return c.json({ error: 'email and password are required' }, 400);

  const anon = anonClient(c.env);
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) return c.json({ error: 'Invalid email or password' }, 401);

  const supabase = adminClient(c.env);
  const family = await findByAuthUserId(supabase, data.user.id);
  if (!family) return c.json({ error: 'No family account found' }, 403);

  return c.json({
    family,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// POST /api/auth/logout — JWT means no server-side session; client clears tokens.
auth.post('/logout', (c) => c.json({ success: true }));

// POST /api/auth/refresh
auth.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json<{ refresh_token?: string }>();
  if (!refresh_token) return c.json({ error: 'refresh_token is required' }, 400);

  const anon = anonClient(c.env);
  const { data, error } = await anon.auth.refreshSession({ refresh_token });
  if (error || !data.session) return c.json({ error: 'Invalid refresh token' }, 401);

  return c.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// POST /api/auth/reset-password
auth.post('/reset-password', async (c) => {
  const { email } = await c.req.json<{ email?: string }>();
  if (!email) return c.json({ error: 'email is required' }, 400);

  const anon = anonClient(c.env);
  await anon.auth.resetPasswordForEmail(email, {
    redirectTo: `https://${c.env.APP_DOMAIN || 'legacyodyssey.com'}/reset-callback`,
  });

  // Always return success to prevent email enumeration (matches Express).
  return c.json({
    success: true,
    message: 'If an account exists with that email, a reset link has been sent.',
  });
});

// POST /api/auth/update-password — completes the password-reset flow.
auth.post('/update-password', async (c) => {
  const { access_token, new_password } = await c.req.json<{
    access_token?: string;
    new_password?: string;
  }>();
  if (!access_token || !new_password) {
    return c.json({ error: 'access_token and new_password are required' }, 400);
  }
  if (new_password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400);
  }

  // Update the user using the access token from the reset email link.
  // The Express version passed `{ accessToken }` as the second arg; the
  // supabase-js v2 API accepts that as a per-call override.
  const anon = anonClient(c.env);
  const { error } = await (anon.auth as any).updateUser(
    { password: new_password },
    { accessToken: access_token }
  );
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true, message: 'Password updated successfully.' });
});

// POST /api/auth/cancel — customer-initiated soft cancel.
// Direct port of the Express cancel route. Body shapes:
//   { all: true }                                → cancel every linked family
//   { familyId: "..." }                          → cancel a non-primary family,
//                                                  or the only family the user has
//   { familyId: "...", promoteFamilyId: "..." }  → cancel the primary; promote a
//                                                  secondary to primary at the
//                                                  retiring primary's period_end
auth.post('/cancel', requireAuth, async (c) => {
  const supabase = adminClient(c.env);
  const user = (c as any).var.user;
  const linked = await findAllByAuthUserId(supabase, user.id);
  if (!linked.length) return c.json({ error: 'No families found for this user' }, 404);

  const body = await c.req.json<{ all?: boolean | string; familyId?: string; promoteFamilyId?: string }>();

  // --- Cancel All path
  if (body.all === true || body.all === 'true') {
    const r = await softCancelAllForUser(c.env, user.id, { source: 'customer-mobile' });
    return c.json({ ok: true, mode: 'all', cancelled: r.canceled, results: r.results });
  }

  if (!body.familyId) return c.json({ error: 'familyId or all=true required' }, 400);
  const target = linked.find((f) => f.id === body.familyId);
  if (!target) return c.json({ error: 'Family not found or not linked to your account' }, 404);

  const isPrimary = await isPrimaryFamily(c.env, target);
  const otherLinked = linked.filter((f) => f.id !== target.id && !f.archived_at);

  // If target is the primary AND there are other active families, require
  // promote or all (matches the Express multi-family invariant).
  if (isPrimary && otherLinked.length > 0) {
    const promoteId = body.promoteFamilyId;
    if (!promoteId) {
      return c.json(
        {
          error: 'PROMOTE_OR_CANCEL_ALL_REQUIRED',
          message:
            'You must always have one Primary site. To cancel your Primary, either promote another site to Primary or cancel all sites.',
          otherFamilies: otherLinked.map((f: Family) => ({
            id: f.id,
            subdomain: f.subdomain,
            custom_domain: f.custom_domain,
            display_name: f.display_name,
          })),
        },
        400
      );
    }
    const promoteTarget = otherLinked.find((f) => f.id === promoteId);
    if (!promoteTarget)
      return c.json({ error: 'promoteFamilyId is not a valid linked family' }, 400);

    const promoteResult = await promoteSecondaryToPrimary(c.env, promoteTarget, target, {
      source: 'customer-mobile',
    });
    const cancelResult = await softCancelFamily(c.env, target, { source: 'customer-mobile' });
    return c.json({
      ok: true,
      mode: 'promote-and-cancel',
      promoted: {
        familyId: promoteTarget.id,
        switchAt: promoteResult.switchAt,
        scheduleId: promoteResult.scheduleId,
      },
      cancelled: { familyId: target.id, summary: cancelResult.summary },
    });
  }

  // Simple case: cancel a non-primary family OR the only family the user has
  const result = await softCancelFamily(c.env, target, { source: 'customer-mobile' });
  return c.json({
    ok: true,
    mode: 'single',
    cancelled: { familyId: target.id, summary: result.summary },
  });
});

// DELETE /api/auth/account — old hard-delete. Return 410 so old app builds get
// a clear "update your app" message instead of a silent failure.
auth.delete('/account', requireAuth, (c) =>
  c.json(
    {
      error: 'ENDPOINT_REMOVED',
      message:
        'Account cancellation has moved to a new flow. Please update your Legacy Odyssey app from the App Store or Google Play to continue.',
    },
    410
  )
);

export default auth;
