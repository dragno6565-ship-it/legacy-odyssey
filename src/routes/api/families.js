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

// POST /api/families — DISABLED. Additional sites are sold through paid checkout
// ($29 first year → $49.99/year), not created free via this API. The old
// implementation made an UNPAID site using the broken auth_user_id:null +
// plus-addressed-email + metadata-linking model. Kept as a guard so any stray
// caller gets a clear error instead of silently creating bad/free data. To add a
// site, send the user to /account/add-site (web) which runs the real checkout.
router.post('/', async (req, res) => {
  return res.status(403).json({
    error: 'Additional sites are added through checkout. Visit legacyodyssey.com/account/add-site to add another site to your account.',
    code: 'USE_CHECKOUT',
  });
});

module.exports = router;
