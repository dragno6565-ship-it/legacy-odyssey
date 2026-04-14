const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const requireAuth = require('../../middleware/requireAuth');
const bookService = require('../../services/bookService');
const familyService = require('../../services/familyService');

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/families/mine — List all families for the current user
router.get('/mine', async (req, res, next) => {
  try {
    // Use the accessible family IDs from requireAuth (includes both owned + linked)
    const familyIds = req.accessibleFamilyIds || [];

    let families = [];
    if (familyIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('families')
        .select('id, email, subdomain, display_name, custom_domain, subscription_status, plan, book_type, created_at')
        .in('id', familyIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      families = data || [];
    }

    // For each family, check if a book exists and get child name
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

    res.json({
      families: enriched,
      activeFamilyId: req.family.id,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/families — Create a new family (website) for the current user
router.post('/', async (req, res, next) => {
  try {
    const { subdomain, displayName, customDomain } = req.body;

    if (!subdomain && !customDomain) {
      return res.status(400).json({ error: 'Either subdomain or customDomain is required' });
    }

    // Validate subdomain format if provided
    if (subdomain) {
      const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (slug.length < 3) {
        return res.status(400).json({ error: 'Subdomain must be at least 3 characters' });
      }
      // Check if subdomain is taken
      const existing = await familyService.findBySubdomain(slug);
      if (existing) {
        return res.status(409).json({ error: 'Subdomain is already taken' });
      }
    }

    // Check if custom domain is taken
    if (customDomain) {
      const existing = await familyService.findByCustomDomain(customDomain);
      if (existing) {
        return res.status(409).json({ error: 'Custom domain is already in use' });
      }
    }

    // Create the family with null auth_user_id (to avoid UNIQUE constraint)
    // and link via user metadata instead
    const uniqueEmail = `${req.user.email.split('@')[0]}+${subdomain || Date.now()}@${req.user.email.split('@')[1]}`;
    const { data: newFamily, error: famErr } = await supabaseAdmin
      .from('families')
      .insert({
        auth_user_id: null, // Use null to avoid UNIQUE constraint; linked via user metadata
        email: uniqueEmail,
        subdomain: subdomain ? subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '') : null,
        custom_domain: customDomain || null,
        display_name: displayName || 'New Website',
        book_password: 'legacy',
        subscription_status: 'trialing',
      })
      .select()
      .single();

    if (famErr) throw famErr;

    // Create book with defaults
    const book = await bookService.createBookWithDefaults(newFamily.id);

    // Link this family to the user via user metadata
    const linkedIds = req.user.user_metadata?.linked_family_ids || [];
    linkedIds.push(newFamily.id);
    await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      user_metadata: { ...req.user.user_metadata, linked_family_ids: linkedIds },
    });

    res.status(201).json({
      family: {
        ...newFamily,
        childName: '',
        heroImage: null,
        hasBook: true,
      },
      book,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
