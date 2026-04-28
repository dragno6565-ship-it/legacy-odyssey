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
import { findBySubdomain, findByAuthUserId, createFamily } from '../../lib/familyService';
import { createBookWithDefaults } from '../../lib/bookService';
import * as seedData from '../../lib/seedData';
import { requireAuth } from '../../middleware/requireAuth';

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
