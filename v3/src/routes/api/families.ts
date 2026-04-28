/**
 * /api/families — multi-website endpoints.
 *
 * Phase 2 first cut: GET /mine. The mobile app calls this on every dashboard
 * load to populate the family-switcher.
 *
 * POST / (create new linked website) is deferred — it depends on
 * createBookWithDefaults from src/services/bookService.js which is ~100 lines
 * of seed data and lands with the Phase 3 signup port.
 *
 * Direct port of src/routes/api/families.js.
 */
import { Hono } from 'hono';
import { adminClient, type Env } from '../../lib/supabase';
import { requireAuth } from '../../middleware/requireAuth';
import type { Family } from '../../lib/types';

type Variables = {
  user: any;
  family: Family;
  accessibleFamilyIds: string[];
};

const families = new Hono<{ Bindings: Env; Variables: Variables }>();

families.use('*', requireAuth);

// GET /api/families/mine — every family the user has access to (owned +
// linked via user_metadata.linked_family_ids), with child name and hero
// image preview for the family-switcher UI.
families.get('/mine', async (c) => {
  const supabase = adminClient(c.env);
  const familyIds = c.var.accessibleFamilyIds || [];

  let rows: any[] = [];
  if (familyIds.length > 0) {
    const { data, error } = await supabase
      .from('families')
      .select(
        'id, email, subdomain, display_name, custom_domain, subscription_status, plan, book_type, created_at'
      )
      .in('id', familyIds)
      .order('created_at', { ascending: true });
    if (error) throw error;
    rows = data || [];
  }

  const enriched = await Promise.all(
    rows.map(async (fam) => {
      const { data: book } = await supabase
        .from('books')
        .select('id, child_first_name, child_last_name, hero_image_path')
        .eq('family_id', fam.id)
        .maybeSingle();
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

  return c.json({
    families: enriched,
    activeFamilyId: c.var.family.id,
  });
});

export default families;
