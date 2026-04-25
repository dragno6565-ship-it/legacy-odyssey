const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const familyService = require('../../services/familyService');

const router = Router();

// GET /api/auth/check-subdomain?s=xxx — Check if a subdomain is available
router.get('/check-subdomain', async (req, res) => {
  const subdomain = (req.query.s || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!subdomain || subdomain.length < 3) {
    return res.json({ available: false, subdomain });
  }
  const existing = await familyService.findBySubdomain(subdomain);
  res.json({ available: !existing, subdomain });
});

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, subdomain, displayName } = req.body;

    if (!email || !password || !subdomain) {
      return res.status(400).json({ error: 'email, password, and subdomain are required' });
    }

    // Check subdomain availability
    const existing = await familyService.findBySubdomain(subdomain);
    if (existing) {
      return res.status(409).json({ error: 'This subdomain is already taken' });
    }

    // Create auth user (email_confirm: false sends verification email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create family record
    const family = await familyService.create({
      email,
      authUserId: authData.user.id,
      subdomain,
      displayName: displayName || `The ${subdomain} Family`,
    });

    // Create book with defaults
    const bookService = require('../../services/bookService');
    const book = await bookService.createBookWithDefaults(family.id);

    // Sign in to get tokens
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    // Use signInWithPassword to get session
    const { supabaseAnon } = require('../../config/supabase');
    const { data: session, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      return res.status(500).json({ error: 'Account created but login failed. Please try logging in.' });
    }

    res.status(201).json({
      family,
      book,
      session: {
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        expires_at: session.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { supabaseAnon } = require('../../config/supabase');
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get the family for this user
    const family = await familyService.findByAuthUserId(data.user.id);
    if (!family) {
      return res.status(403).json({ error: 'No family account found' });
    }

    res.json({
      family,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  // JWT-based auth doesn't require server-side session invalidation.
  // The client clears its stored tokens. We return success.
  res.json({ success: true });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token is required' });
    }

    const { supabaseAnon } = require('../../config/supabase');
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const { supabaseAnon } = require('../../config/supabase');
    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: `https://${process.env.APP_DOMAIN || 'legacyodyssey.com'}/reset-callback`,
    });

    if (error) {
      console.error('Password reset error:', error);
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/cancel
// Customer-initiated soft cancel (mobile app + web). Replaces the old
// DELETE /api/auth/account hard-delete flow.
//
// Body:
//   { all: true }                      → cancel all linked families (Cancel All)
//   { familyId: "..." }                → cancel a specific non-primary family
//   { familyId: "...", promoteFamilyId: "..." }
//                                       → cancel the primary; promote the named secondary
//                                         to primary (price flips to primary rate at retiring
//                                         primary's period_end via Stripe Subscription Schedule)
//
// Multi-family rule (Scenario A): if the targeted family is the primary and the
// customer has other linked families, the request MUST include either
// `all: true` or `promoteFamilyId`. Otherwise we return 400.
router.post('/cancel', require('../../middleware/requireAuth'), async (req, res, next) => {
  try {
    const subscriptionService = require('../../services/subscriptionService');
    const familyService = require('../../services/familyService');
    const userId = req.user.id;

    const linked = await familyService.findAllByAuthUserId(userId);
    if (!linked.length) return res.status(404).json({ error: 'No families found for this user' });

    // Cancel All path
    if (req.body.all === true || req.body.all === 'true') {
      const r = await subscriptionService.softCancelAllForUser(userId, { source: 'customer-mobile' });
      return res.json({ ok: true, mode: 'all', cancelled: r.canceled, results: r.results });
    }

    const familyId = req.body.familyId;
    if (!familyId) return res.status(400).json({ error: 'familyId or all=true required' });
    const target = linked.find(f => f.id === familyId);
    if (!target) return res.status(404).json({ error: 'Family not found or not linked to your account' });

    const isPrimary = await subscriptionService.isPrimaryFamily(target);
    const otherLinked = linked.filter(f => f.id !== target.id && !f.archived_at);

    // If target is the primary AND there are other active families, require promote or all
    if (isPrimary && otherLinked.length > 0) {
      const promoteId = req.body.promoteFamilyId;
      if (!promoteId) {
        return res.status(400).json({
          error: 'PROMOTE_OR_CANCEL_ALL_REQUIRED',
          message: `You must always have one Primary site. To cancel your Primary, either promote another site to Primary or cancel all sites.`,
          otherFamilies: otherLinked.map(f => ({ id: f.id, subdomain: f.subdomain, custom_domain: f.custom_domain, display_name: f.display_name })),
        });
      }
      const promoteTarget = otherLinked.find(f => f.id === promoteId);
      if (!promoteTarget) return res.status(400).json({ error: 'promoteFamilyId is not a valid linked family' });

      const promoteResult = await subscriptionService.promoteSecondaryToPrimary(promoteTarget, target, { source: 'customer-mobile' });
      const cancelResult = await subscriptionService.softCancelFamily(target, { source: 'customer-mobile' });
      return res.json({
        ok: true,
        mode: 'promote-and-cancel',
        promoted: { familyId: promoteTarget.id, switchAt: promoteResult.switchAt, scheduleId: promoteResult.scheduleId },
        cancelled: { familyId: target.id, summary: cancelResult.summary },
      });
    }

    // Simple case: cancel a non-primary family OR the only family the user has
    const result = await subscriptionService.softCancelFamily(target, { source: 'customer-mobile' });
    return res.json({ ok: true, mode: 'single', cancelled: { familyId: target.id, summary: result.summary } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/account — DEPRECATED
// The old hard-delete endpoint. Customer-initiated hard delete is no longer
// supported; only admins can permanently delete via the admin panel. Old app
// versions still call this — return 410 Gone with a message instructing the
// user to update their app.
router.delete('/account', require('../../middleware/requireAuth'), (req, res) => {
  res.status(410).json({
    error: 'ENDPOINT_REMOVED',
    message: 'Account cancellation has moved to a new flow. Please update your Legacy Odyssey app from the App Store or Google Play to continue.',
  });
});

// POST /api/auth/update-password
router.post('/update-password', async (req, res, next) => {
  try {
    const { access_token, new_password } = req.body;
    if (!access_token || !new_password) {
      return res.status(400).json({ error: 'access_token and new_password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Use the access token from the reset link to update the password
    const { supabaseAnon } = require('../../config/supabase');
    const { error } = await supabaseAnon.auth.updateUser(
      { password: new_password },
      { accessToken: access_token }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
