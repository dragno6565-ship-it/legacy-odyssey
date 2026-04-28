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
import { findBySubdomain, findByCustomDomain } from '../../lib/familyService';
import { createBookWithDefaults } from '../../lib/bookService';
import * as seedData from '../../lib/seedData';
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

// POST /api/families — create a new linked website for the current user.
// Direct port of POST / from src/routes/api/families.js.
//
// Important details preserved from Express:
//   - auth_user_id is set to NULL on the new family row (not the current user's
//     id) — otherwise we'd violate the partial UNIQUE index on auth_user_id.
//     Linkage is recorded via user_metadata.linked_family_ids on the auth user.
//   - email is suffixed (jane+slug@host) so it doesn't collide with the
//     primary family's email UNIQUE constraint.
families.post('/', async (c) => {
  const supabase = adminClient(c.env);
  const user = c.var.user;
  const body = await c.req.json<{
    subdomain?: string;
    displayName?: string;
    customDomain?: string | null;
  }>();
  const { subdomain, displayName, customDomain } = body;

  if (!subdomain && !customDomain) {
    return c.json({ error: 'Either subdomain or customDomain is required' }, 400);
  }

  let slug: string | null = null;
  if (subdomain) {
    slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (slug.length < 3) {
      return c.json({ error: 'Subdomain must be at least 3 characters' }, 400);
    }
    const exists = await findBySubdomain(supabase, slug);
    if (exists) return c.json({ error: 'Subdomain is already taken' }, 409);
  }

  if (customDomain) {
    const exists = await findByCustomDomain(supabase, customDomain);
    if (exists) return c.json({ error: 'Custom domain is already in use' }, 409);
  }

  // Build a unique-per-website email so we don't collide with the primary
  // family's UNIQUE(email) constraint.
  const [local, host] = String(user.email).split('@');
  const uniqueEmail = `${local}+${slug || Date.now()}@${host}`;

  const randomHex = (() => {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
  })();

  const { data: newFamily, error: famErr } = await supabase
    .from('families')
    .insert({
      auth_user_id: null,
      email: uniqueEmail,
      subdomain: slug,
      custom_domain: customDomain || null,
      display_name: displayName || 'New Website',
      book_password: randomHex,
      subscription_status: 'trialing',
    })
    .select()
    .single();
  if (famErr) throw famErr;

  const book = await createBookWithDefaults(supabase, (newFamily as Family).id, seedData);

  // Add this new family to the user's linked_family_ids so requireAuth picks
  // it up on subsequent requests with x-family-id.
  const linkedIds: string[] = user.user_metadata?.linked_family_ids || [];
  linkedIds.push((newFamily as Family).id);
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, linked_family_ids: linkedIds },
  });

  return c.json(
    {
      family: { ...newFamily, childName: '', heroImage: null, hasBook: true },
      book,
    },
    201
  );
});

export default families;
