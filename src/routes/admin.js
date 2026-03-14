const { Router } = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const familyService = require('../services/familyService');
const bookService = require('../services/bookService');
const emailService = require('../services/emailService');
const { supabaseAdmin } = require('../config/supabase');

const router = Router();

// Admin login
router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { supabaseAnon } = require('../config/supabase');
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error) {
    return res.render('admin/login', { error: 'Invalid credentials' });
  }

  // Verify user is an admin
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .single();

  if (!admin) {
    return res.render('admin/login', { error: 'Not an admin account' });
  }

  res.cookie('admin_token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  });

  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin/login');
});

// Dashboard
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const families = await familyService.listAll();

    // Enrich with book data (child name)
    const enriched = await Promise.all(
      families.map(async (fam) => {
        const { data: book } = await supabaseAdmin
          .from('books')
          .select('id, child_first_name, child_last_name, hero_image_path')
          .eq('family_id', fam.id)
          .single();

        return {
          ...fam,
          childName: book
            ? `${book.child_first_name || ''} ${book.child_last_name || ''}`.trim()
            : '',
          heroImage: book?.hero_image_path || null,
          hasBook: !!book,
        };
      })
    );

    const stats = {
      total: families.length,
      active: families.filter((f) => f.subscription_status === 'active').length,
      trialing: families.filter((f) => f.subscription_status === 'trialing').length,
      canceled: families.filter((f) => f.subscription_status === 'canceled').length,
    };

    res.render('admin/dashboard', { families: enriched, stats, admin: req.admin });
  } catch (err) {
    next(err);
  }
});

// Family detail (GET)
router.get('/families/:id', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const bookData = await bookService.getFullBook(family.id);

    res.render('admin/family-detail', {
      family,
      bookData,
      admin: req.admin,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
});

// Family update (POST)
router.post('/families/:id', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const allowedFields = [
      'display_name',
      'email',
      'book_password',
      'subdomain',
      'custom_domain',
      'subscription_status',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const val = req.body[field].trim();
        // Only set to null if empty for optional fields
        if (field === 'custom_domain' || field === 'subdomain') {
          updates[field] = val || null;
        } else {
          updates[field] = val;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await familyService.update(family.id, updates);
    }

    res.redirect(`/admin/families/${family.id}?success=Changes+saved+successfully`);
  } catch (err) {
    console.error('Admin update error:', err);
    res.redirect(`/admin/families/${req.params.id}?error=Failed+to+save+changes`);
  }
});

// Add Customer (GET)
router.get('/customers/new', requireAdmin, (req, res) => {
  // Generate a simple random password
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let generatedPassword = '';
  for (let i = 0; i < 10; i++) {
    generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  res.render('admin/add-customer', {
    admin: req.admin,
    error: null,
    formData: {},
    generatedPassword,
  });
});

// Add Customer (POST)
router.post('/customers/new', requireAdmin, async (req, res, next) => {
  const {
    display_name,
    email,
    temp_password,
    book_password,
    custom_domain,
    subdomain,
    subscription_status,
    trial_days,
  } = req.body;

  // Re-render helper for errors
  const renderError = (errorMsg) => {
    res.render('admin/add-customer', {
      admin: req.admin,
      error: errorMsg,
      formData: req.body,
      generatedPassword: temp_password,
    });
  };

  try {
    // Validate required fields
    if (!display_name || !email || !temp_password || !subdomain) {
      return renderError('Please fill in all required fields.');
    }

    // Check if subdomain already taken
    const existingSubdomain = await familyService.findBySubdomain(subdomain);
    if (existingSubdomain) {
      return renderError(`The subdomain "${subdomain}" is already taken.`);
    }

    // Check if custom domain already taken
    if (custom_domain) {
      const existingDomain = await familyService.findByCustomDomain(custom_domain);
      if (existingDomain) {
        return renderError(`The domain "${custom_domain}" is already assigned to another customer.`);
      }
    }

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: temp_password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        display_name: display_name.trim(),
      },
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      if (authError.message.includes('already been registered')) {
        return renderError('A user with this email already exists.');
      }
      return renderError(`Failed to create auth user: ${authError.message}`);
    }

    const authUserId = authData.user.id;

    // 2. Calculate trial end date
    const trialDays = parseInt(trial_days) || 14;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // 3. Create family record
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .insert({
        email: email.trim().toLowerCase(),
        auth_user_id: authUserId,
        display_name: display_name.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        custom_domain: custom_domain ? custom_domain.trim().toLowerCase() : null,
        book_password: book_password || 'legacy',
        subscription_status: subscription_status || 'trialing',
        trial_ends_at: trialDays > 0 ? trialEndsAt.toISOString() : null,
        is_active: true,
      })
      .select()
      .single();

    if (familyError) {
      // Clean up: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      console.error('Family creation error:', familyError);
      return renderError(`Failed to create family: ${familyError.message}`);
    }

    // 4. Create book with defaults (customer fills in details via the app)
    await bookService.createBookWithDefaults(family.id);

    // 5. Render success page
    const apkUrl = 'https://expo.dev/artifacts/eas/dEWDhAKzbdohggvEofzuEy.apk';
    const expoGoUrl = 'https://expo.dev/accounts/dragno65/projects/legacy-odyssey/updates/6eb62faf-2a25-4892-a438-7339b8d9df19';

    res.render('admin/customer-created', {
      admin: req.admin,
      customer: {
        display_name: display_name.trim(),
        email: email.trim().toLowerCase(),
        temp_password,
        book_password: book_password || 'legacy',
        custom_domain: custom_domain ? custom_domain.trim().toLowerCase() : null,
        subdomain: subdomain.trim().toLowerCase(),
        subscription_status: subscription_status || 'trialing',
        family_id: family.id,
      },
      apkUrl,
      expoGoUrl,
    });

  } catch (err) {
    console.error('Add customer error:', err);
    renderError('An unexpected error occurred. Please try again.');
  }
});

// Send welcome email
router.post('/families/:id/send-welcome', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const apkUrl = 'https://expo.dev/artifacts/eas/dEWDhAKzbdohggvEofzuEy.apk';

    // Get the temp password from the form or use a placeholder
    const tempPassword = req.body.temp_password || '(check with admin)';

    await emailService.sendWelcomeEmail({
      to: family.email,
      displayName: family.display_name,
      tempPassword,
      bookPassword: family.book_password || 'legacy',
      subdomain: family.subdomain,
      customDomain: family.custom_domain,
      apkUrl,
    });

    res.redirect(`/admin/families/${family.id}?success=Welcome+email+sent+to+${encodeURIComponent(family.email)}`);
  } catch (err) {
    console.error('Send welcome email error:', err);
    res.redirect(`/admin/families/${req.params.id}?error=Failed+to+send+welcome+email:+${encodeURIComponent(err.message)}`);
  }
});

// Toggle active status
router.get('/families/:id/toggle-active', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    await familyService.update(family.id, { is_active: !family.is_active });

    const action = family.is_active ? 'deactivated' : 'reactivated';
    res.redirect(`/admin/families/${family.id}?success=Account+${action}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
