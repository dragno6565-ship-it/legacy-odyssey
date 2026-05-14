const { Router } = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const familyService = require('../services/familyService');
const bookService = require('../services/bookService');
const emailService = require('../services/emailService');
const { supabaseAdmin } = require('../config/supabase');

const router = Router();

// ─── ONE-SHOT: send the Keepsakes announcement to all real paying customers.
// Will be removed in a follow-up commit after delivery. Admin-only.
router.get('/dev/announce-keepsakes', requireAdmin, async (req, res) => {
  // Hardcoded recipient list — these are the 9 real paying customers Dan
  // approved on May 14 2026. Demo / test / Apple-review / Dan's own
  // accounts are intentionally excluded.
  const RECIPIENTS = [
    'lindsey.e.cherry@gmail.com',
    'eowynkiller@gmail.com',
    'ashleetatler@gmail.com',
    'stoneal13@gmail.com',
    'Jeffpresutti61@gmail.com',
    'jadeashb@gmail.com',
    'rdawnporter@gmail.com',
    'ashley.beine@outlook.com',
    'lorenearley23@gmail.com',
  ];

  try {
    // Look up first names from the families table so each email is personalized.
    const { data: families } = await supabaseAdmin
      .from('families')
      .select('email, customer_name, display_name')
      .in('email', RECIPIENTS);
    const familiesByEmail = {};
    for (const f of (families || [])) familiesByEmail[f.email.toLowerCase()] = f;

    function getFirstName(email) {
      const fam = familiesByEmail[email.toLowerCase()];
      const raw = (fam && (fam.customer_name || fam.display_name)) || '';
      // First word that isn't a filler like "The" / "Your"
      const skip = new Set(['the', 'your', 'our', 'a', 'an']);
      const first = raw.split(/\s+/).find((w) => w && !skip.has(w.toLowerCase()));
      if (first) return first;
      // Fall back to the local-part of the email, title-cased
      const prefix = email.split('@')[0].replace(/[._\-]+/g, ' ').trim().split(' ')[0];
      return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase() : 'there';
    }

    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const results = [];
    for (const to of RECIPIENTS) {
      const firstName = getFirstName(to);
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#c8a96e;letter-spacing:2px;">LEGACY ODYSSEY</span>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a2e;margin:0 0 18px;">Hi ${firstName},</h1>
          <p style="font-size:15px;line-height:1.75;color:#4a4a4a;margin:0 0 14px;">
            A quick note about something new in your Legacy Odyssey book.
          </p>
          <p style="font-size:15px;line-height:1.75;color:#4a4a4a;margin:0 0 14px;">
            We as parents want to keep every painting, picture, drawing, and piece of art our child makes. It's hard to store them all, so reluctantly we end up throwing them away. With our new <strong>Keepsakes section</strong>, you can save a version of every one.
          </p>
          <p style="font-size:15px;line-height:1.75;color:#4a4a4a;margin:0 0 14px;">
            Snap a photo of the artwork, the certificate, the report card, or the swim ribbon &mdash; add a short note about what it was &mdash; and let the original go knowing it lives on in your book. Each keepsake gets its own little page with a story, the age your child was, who made it, and as many photos as you want.
          </p>
          <p style="font-size:15px;line-height:1.75;color:#4a4a4a;margin:0 0 22px;">
            It's live now on your website and in the iPhone and Android apps (version 1.0.11 &mdash; make sure your app is updated from the store).
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
            <a href="https://legacyodyssey.com/account/book/keepsakes" style="display:inline-block;background:#c8a96e;color:#ffffff;padding:13px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;">Add Your First Keepsake</a>
          </td></tr></table>
          <p style="font-size:15px;line-height:1.75;color:#4a4a4a;margin:0 0 6px;">Hope you love it.</p>
          <p style="font-size:15px;line-height:1.75;color:#4a4a4a;margin:18px 0 0;">
            &mdash; Dan<br><span style="font-family:Georgia,serif;color:#1a1a2e;">Legacy Odyssey</span>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#8a8a8a;margin:28px 0 0;font-style:italic;border-top:1px solid #f0ece6;padding-top:18px;">
            P.S. &mdash; If our emails ever end up in your spam folder, marking them &ldquo;Not Spam&rdquo; helps make sure you see future updates.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f0ece6;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">Legacy Odyssey</p>
          <p style="font-size:12px;color:#999;margin:4px 0 0;"><a href="mailto:help@legacyodyssey.com" style="color:#c8a96e;">help@legacyodyssey.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

      try {
        const { data, error } = await resend.emails.send({
          from: 'Legacy Odyssey <hello@legacyodyssey.com>',
          to: [to],
          replyTo: process.env.EMAIL_REPLY_TO || process.env.ADMIN_EMAIL || 'legacyodysseyapp@gmail.com',
          subject: 'A new section in your book — Keepsakes',
          html,
          tracking: { opens: true, clicks: true },
        });
        if (error) {
          results.push({ to, firstName, error: error.message || JSON.stringify(error) });
        } else {
          results.push({ to, firstName, id: data.id });
        }
      } catch (err) {
        results.push({ to, firstName, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.id).length;
    const failCount = results.filter((r) => r.error).length;
    res.send(`<!DOCTYPE html><html><body style="font-family:system-ui;padding:3rem;max-width:720px;margin:0 auto;background:#faf7f2;color:#2c2416;">
<h1 style="color:#2e7d32;">Keepsakes announcement sent</h1>
<p><strong>${successCount}</strong> delivered, <strong>${failCount}</strong> failed (out of ${RECIPIENTS.length}).</p>
<table style="width:100%;border-collapse:collapse;margin-top:1.5rem;font-size:0.92rem;">
<thead><tr style="background:#f0ebe3;text-align:left;"><th style="padding:8px 12px;">Recipient</th><th style="padding:8px 12px;">Name used</th><th style="padding:8px 12px;">Status</th></tr></thead>
<tbody>
${results.map((r) => `<tr style="border-top:1px solid #e0d5c4;"><td style="padding:8px 12px;">${r.to}</td><td style="padding:8px 12px;">${r.firstName}</td><td style="padding:8px 12px;">${r.id ? `<span style="color:#2e7d32;">✓ ${r.id.substring(0, 8)}…</span>` : `<span style="color:#c0392b;">✗ ${r.error}</span>`}</td></tr>`).join('')}
</tbody>
</table>
<p style="margin-top:2rem;"><a href="/admin">← Back to admin</a> · <a href="https://resend.com/emails" target="_blank">View in Resend →</a></p>
</body></html>`);
  } catch (err) {
    console.error('announce-keepsakes failed:', err);
    res.status(500).send(`<pre>FAILED: ${err.message}</pre>`);
  }
});

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

    // Gift code stats — surface unredeemed count so Dan sees pending gifts
    // at a glance from the main dashboard rather than having to drill into
    // /admin/gifts.
    let giftStats = { total: 0, unredeemed: 0, redeemed: 0, expired: 0, stale: 0 };
    try {
      const { data: gifts } = await supabaseAdmin
        .from('gift_codes')
        .select('status, created_at, expires_at');
      const now = Date.now();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      for (const g of (gifts || [])) {
        giftStats.total++;
        if (g.status === 'purchased') {
          giftStats.unredeemed++;
          if (g.created_at && (now - new Date(g.created_at).getTime()) > THIRTY_DAYS) {
            giftStats.stale++;
          }
        } else if (g.status === 'redeemed') {
          giftStats.redeemed++;
        } else if (g.status === 'expired') {
          giftStats.expired++;
        }
      }
    } catch (_) { /* table may not exist on fresh installs */ }

    res.render('admin/dashboard', { families: enriched, stats, giftStats, admin: req.admin });
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

    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    // Annotate each gift with derived fields the view uses (days_since_purchase,
    // is_stale, is_expired_unused) so the EJS stays clean.
    const annotated = (gifts || []).map((g) => {
      const created = g.created_at ? new Date(g.created_at).getTime() : null;
      const expires = g.expires_at ? new Date(g.expires_at).getTime() : null;
      const days_since_purchase = created ? Math.floor((now - created) / (24 * 60 * 60 * 1000)) : null;
      const is_unredeemed = g.status === 'purchased';
      const is_stale = is_unredeemed && days_since_purchase !== null && days_since_purchase >= 30;
      const is_expired_now = !!(expires && expires < now && is_unredeemed);
      return { ...g, days_since_purchase, is_unredeemed, is_stale, is_expired_now };
    });

    const stats = {
      total: annotated.length,
      purchased: annotated.filter((g) => g.status === 'purchased').length,
      redeemed: annotated.filter((g) => g.status === 'redeemed').length,
      expired: annotated.filter((g) => g.status === 'expired').length,
      stale: annotated.filter((g) => g.is_stale).length,
    };

    // Server-side filter via ?filter= so links from the main dashboard can
    // deep-link straight to the relevant subset. Default is 'unredeemed'
    // because that's the most actionable view; 'all' shows everything.
    const filter = (req.query.filter || 'unredeemed').toString().toLowerCase();
    let filteredGifts = annotated;
    if (filter === 'unredeemed') {
      filteredGifts = annotated.filter((g) => g.is_unredeemed);
    } else if (filter === 'stale') {
      filteredGifts = annotated.filter((g) => g.is_stale);
    } else if (filter === 'redeemed') {
      filteredGifts = annotated.filter((g) => g.status === 'redeemed');
    } else if (filter === 'expired') {
      filteredGifts = annotated.filter((g) => g.status === 'expired');
    } // else 'all' — keep everything

    res.render('admin/gifts', { gifts: filteredGifts, stats, filter, admin: req.admin });
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
