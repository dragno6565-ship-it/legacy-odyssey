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
      archived: families.filter((f) => !!f.archived_at).length,
    };

    res.render('admin/dashboard', { families: enriched, stats, admin: req.admin });
  } catch (err) {
    next(err);
  }
});

// Health check page — runs every block's checks live and renders results.
// (Admin-only. Each render triggers a fresh check pass — typically 5-15s.)
router.get('/health', requireAdmin, async (req, res, next) => {
  try {
    const { runAll, listBlocks } = require('../services/healthChecks');
    const blockFilter = req.query.block || null;
    const report = await runAll({ blockFilter });
    res.render('admin/health', {
      admin: req.admin,
      report,
      blocks: listBlocks(),
      blockFilter,
    });
  } catch (err) {
    next(err);
  }
});

// Gift Codes list
router.get('/gifts', requireAdmin, async (req, res, next) => {
  try {
    const { data: gifts } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .order('created_at', { ascending: false });

    const stats = {
      total: (gifts || []).length,
      purchased: (gifts || []).filter((g) => g.status === 'purchased').length,
      redeemed: (gifts || []).filter((g) => g.status === 'redeemed').length,
      expired: (gifts || []).filter((g) => g.status === 'expired').length,
    };

    res.render('admin/gifts', { gifts: gifts || [], stats, admin: req.admin });
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

    // Check if this account was created via a gift redemption
    const { data: giftCode } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('family_id', family.id)
      .maybeSingle();

    res.render('admin/family-detail', {
      family,
      bookData,
      giftCode: giftCode || null,
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
      'customer_name',
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
    customer_name,
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
        customer_name: customer_name ? customer_name.trim() : null,
        display_name: display_name.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        custom_domain: custom_domain ? custom_domain.trim().toLowerCase() : null,
        book_password: book_password || require('crypto').randomBytes(4).toString('hex'),
        subscription_status: subscription_status || 'trialing',
        trial_ends_at: trialDays > 0 ? trialEndsAt.toISOString() : null,
        is_active: true,
        book_type: 'baby_book',
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
        customer_name: customer_name ? customer_name.trim() : null,
        display_name: display_name.trim(),
        email: email.trim().toLowerCase(),
        temp_password,
        book_password: book_password || family.book_password,
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

    // Auto-generate a fresh temp password and update the user's Supabase auth so they can actually log in with it
    const tempPassword = require('crypto').randomBytes(8).toString('hex');
    if (family.auth_user_id) {
      const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(family.auth_user_id, {
        password: tempPassword,
      });
      if (pwErr) console.error('Failed to reset auth password for welcome email:', pwErr.message);
    }

    // Generate a recovery link so the customer can set their own password
    let setPasswordUrl = null;
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: family.email,
        options: { redirectTo: 'https://legacyodyssey.com/set-password' },
      });
      setPasswordUrl = linkData?.properties?.action_link || null;
    } catch (e) {
      console.error('Failed to generate recovery link for welcome resend:', e.message);
    }

    // Allow admin to override the recipient address (defaults to family.email)
    const sendTo = (req.body.send_to_email || '').trim() || family.email;

    await emailService.sendWelcomeEmail({
      to: sendTo,
      displayName: family.display_name,
      setPasswordUrl,
      bookPassword: family.book_password,
      subdomain: family.subdomain,
      customDomain: family.custom_domain,
    });

    res.redirect(`/admin/families/${family.id}?success=Welcome+email+sent+to+${encodeURIComponent(sendTo)}`);
  } catch (err) {
    console.error('Send welcome email error:', err);
    res.redirect(`/admin/families/${req.params.id}?error=Failed+to+send+welcome+email:+${encodeURIComponent(err.message)}`);
  }
});

// Reset app + account login password
router.post('/families/:id/reset-password', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.redirect(`/admin/families/${family.id}?error=Password+must+be+at+least+6+characters`);
    }

    if (!family.auth_user_id) {
      return res.redirect(`/admin/families/${family.id}?error=No+auth+user+linked+to+this+family`);
    }

    // Update directly by auth_user_id — works for both mobile app and web account login
    const { error } = await supabaseAdmin.auth.admin.updateUserById(family.auth_user_id, {
      password: new_password,
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.redirect(`/admin/families/${family.id}?error=Failed+to+reset+password:+${encodeURIComponent(error.message)}`);
    }

    res.redirect(`/admin/families/${family.id}?success=Password+reset+successfully+%E2%80%94+works+for+app+and+account+login`);
  } catch (err) {
    next(err);
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

// Hardcoded protected emails — never cancel or delete these via the admin UI.
// (Apple App Store reviewers depend on the demo account; admins shouldn't be
// able to nuke their own auth user from the panel.)
const PROTECTED_EMAILS = new Set(['review@legacyodyssey.com']);

/**
 * Block cancellation/deletion of: any admin's own account, or hardcoded
 * protected emails. Returns string reason if blocked, null if OK.
 */
async function checkProtectedFamily(family) {
  if (!family || !family.email) return null;
  const email = family.email.toLowerCase();
  if (PROTECTED_EMAILS.has(email)) return `${email} is protected (Apple Review Demo) and cannot be cancelled or deleted from the admin panel`;
  const { data: admins } = await supabaseAdmin.from('admin_users').select('email');
  const adminEmails = new Set((admins || []).map(a => a.email?.toLowerCase()).filter(Boolean));
  if (adminEmails.has(email)) return `${email} is an admin account and cannot be cancelled or deleted from the admin panel (would lock you out)`;
  return null;
}

/**
 * Soft cancel: mark archived, cancel Stripe at period end, stop Spaceship
 * auto-renew. Keeps all data so the customer can resubscribe later.
 */
router.post('/families/:id/cancel', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const blocked = await checkProtectedFamily(family);
    if (blocked) return res.redirect(`/admin/families/${family.id}?error=${encodeURIComponent(blocked)}`);

    const subscriptionService = require('../services/subscriptionService');
    const result = await subscriptionService.softCancelFamily(family, { source: 'admin' });

    res.redirect(`/admin/families/${family.id}?success=${encodeURIComponent('Cancelled & archived: ' + result.summary.join('; '))}`);
  } catch (err) {
    next(err);
  }
});

/**
 * Hard delete: requires the admin to type the exact email as confirmation.
 * Performs all soft-cancel steps PLUS purges photos from storage and
 * deletes all SQL rows + the auth user.
 */
router.post('/families/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    // Confirmation: the form must POST `confirm_email` matching family.email.
    const typed = (req.body.confirm_email || '').trim().toLowerCase();
    if (!typed || typed !== (family.email || '').toLowerCase()) {
      return res.redirect(`/admin/families/${family.id}?error=${encodeURIComponent('Confirmation email did not match — deletion aborted')}`);
    }

    const blocked = await checkProtectedFamily(family);
    if (blocked) return res.redirect(`/admin/families/${family.id}?error=${encodeURIComponent(blocked)}`);

    // 1. Cancel Stripe + Spaceship first (best-effort; do not block hard delete on failure)
    try {
      const stripeService = require('../services/stripeService');
      await stripeService.cancelSubscriptionAtPeriodEnd(family);
    } catch (err) {
      console.error(`Pre-delete Stripe cancel failed for family ${family.id}:`, err.message);
    }
    if (family.custom_domain) {
      try {
        const spaceshipService = require('../services/spaceshipService');
        await spaceshipService.setAutoRenew(family.custom_domain, false);
      } catch (err) {
        console.error(`Pre-delete Spaceship auto-renew failed for ${family.custom_domain}:`, err.message);
      }
    }

    // 1b. Send the deletion confirmation email BEFORE wiping data, while the
    //     email/name/domain are still in memory. Best-effort.
    try {
      await emailService.sendCancellationEmail({
        to: family.email,
        displayName: family.customer_name || family.display_name,
        type: 'delete',
        customDomain: family.custom_domain,
        subdomain: family.subdomain,
      });
    } catch (err) {
      console.error(`Pre-delete email failed for ${family.email}:`, err.message);
    }

    // 2. Purge storage photos at photos/{family_id}/...
    try {
      const { data: files } = await supabaseAdmin.storage.from('photos').list(family.id, { limit: 1000 });
      if (files && files.length) {
        const paths = files.map(f => `${family.id}/${f.name}`);
        await supabaseAdmin.storage.from('photos').remove(paths);
        console.log(`[admin-delete] Purged ${paths.length} photo(s) for family ${family.id}`);
      }
    } catch (err) {
      console.error(`Storage purge failed for family ${family.id}:`, err.message);
    }

    // 3. Delete SQL rows. books → cascade deletes all 11 content tables.
    //    domain_orders/gift_codes have ON DELETE SET NULL — they remain as orphans (intentional).
    await supabaseAdmin.from('books').delete().eq('family_id', family.id);
    await supabaseAdmin.from('families').delete().eq('id', family.id);

    // 4. Delete Supabase Auth user
    if (family.email) {
      const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
      const user = authUser?.users?.find(u => u.email?.toLowerCase() === family.email.toLowerCase());
      if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
    }

    res.redirect('/admin?success=' + encodeURIComponent('Account permanently deleted'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
