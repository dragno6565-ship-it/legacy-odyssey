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

// DELETE /api/auth/account
// Permanently deletes the authenticated user's account, all family/book data, and Stripe subscriptions.
router.delete('/account', require('../../middleware/requireAuth'), async (req, res, next) => {
  try {
    const { stripe } = require('../../config/stripe');
    const familyService = require('../../services/familyService');

    const userId = req.user.id;

    // Get all families for this user
    const families = await familyService.findAllByAuthUserId(userId);

    // Cancel all Stripe subscriptions
    for (const family of families) {
      if (family.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(family.stripe_subscription_id);
        } catch (stripeErr) {
          // Log but don't block deletion if subscription is already cancelled
          console.error(`Failed to cancel subscription ${family.stripe_subscription_id}:`, stripeErr.message);
        }
      }
    }

    // Delete all family records (books/sections cascade via DB foreign keys)
    for (const family of families) {
      await supabaseAdmin.from('book_sections').delete().eq('book_id',
        (await supabaseAdmin.from('books').select('id').eq('family_id', family.id).single()).data?.id
      );
      await supabaseAdmin.from('books').delete().eq('family_id', family.id);
      await supabaseAdmin.from('families').delete().eq('id', family.id);
    }

    // Delete the Supabase auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError.message);
      // Don't expose this error — data is already deleted
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
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
