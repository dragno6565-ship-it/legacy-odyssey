/**
 * /api/books — mobile API book endpoints.
 *
 * Phase 2 first cut: GET /mine, GET /mine/full, GET /mine/sections.
 * These three are enough for the mobile app to load the dashboard +
 * MonthsScreen + ManageSections initial reads.
 *
 * Write endpoints (PUT /mine, PUT /mine/before, PUT /mine/months/:num, etc.)
 * land in subsequent commits — they require more careful porting because
 * each one writes a different set of columns.
 *
 * Direct port of src/routes/api/books.js (Express).
 */
import { Hono } from 'hono';
import { adminClient, type Env } from '../../lib/supabase';
import { getFullBook, imageUrl } from '../../lib/bookService';
import { requireAuth } from '../../middleware/requireAuth';
import type { Family } from '../../lib/types';

type Variables = {
  user: any;
  family: Family;
  accessibleFamilyIds: string[];
};

const books = new Hono<{ Bindings: Env; Variables: Variables }>();

books.use('*', requireAuth);

/**
 * Convert a Supabase Storage path (or already-full URL) to a public URL.
 * Mirrors `resolvePhoto` from the Express books.js.
 */
function resolvePhoto(supabaseUrl: string, val: string | null | undefined): string {
  return imageUrl(supabaseUrl, val) || '';
}

// GET /api/books/mine — main payload the mobile app reads on every login,
// dashboard load, settings open, and MonthsScreen mount. Includes:
//   - book row (with hero_image_path resolved to a full URL)
//   - synthesized `child` object (mobile reads book.child)
//   - months array (with month/number aliases the mobile expects)
//   - family password + slug aliases for SettingsScreen
books.get('/mine', async (c) => {
  const supabase = adminClient(c.env);
  const family = c.var.family;

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('family_id', family.id)
    .maybeSingle();
  if (!book) return c.json({ error: 'No book found' }, 404);

  const child = {
    first_name: book.child_first_name || '',
    middle_name: book.child_middle_name || '',
    last_name: book.child_last_name || '',
    birth_date: book.birth_date || '',
    birth_time: book.birth_time || '',
    weight_lbs: book.birth_weight_lbs || '',
    weight_oz: book.birth_weight_oz || '',
    length_inches: book.birth_length_inches || '',
    city: book.birth_city || '',
    state: book.birth_state || '',
    hospital: book.birth_hospital || '',
    name_meaning: book.name_meaning || '',
  };

  const { data: monthsData } = await supabase
    .from('months')
    .select('*')
    .eq('book_id', book.id)
    .order('month_number');
  const months = (monthsData || []).map((m: any) => ({
    ...m,
    month: m.month_number,
    number: m.month_number,
  }));

  // Re-fetch the family slug fields fresh — c.var.family may not have them
  // depending on which fallback path requireAuth took.
  const { data: famRow } = await supabase
    .from('families')
    .select('book_password, subdomain, custom_domain')
    .eq('id', family.id)
    .single();

  return c.json({
    ...book,
    hero_image_path: resolvePhoto(c.env.SUPABASE_URL, book.hero_image_path),
    child,
    months,
    password: famRow?.book_password || '',
    book_password: famRow?.book_password || '',
    slug: famRow?.subdomain || '',
    family_slug: famRow?.subdomain || '',
    subdomain: famRow?.subdomain || '',
  });
});

// GET /api/books/mine/full — entire book with every section, used by Preview.
books.get('/mine/full', async (c) => {
  const supabase = adminClient(c.env);
  const data = await getFullBook(supabase, c.var.family.id);
  if (!data) return c.json({ error: 'No book found' }, 404);
  return c.json(data);
});

// GET /api/books/mine/sections — visible-section flags only.
books.get('/mine/sections', async (c) => {
  const supabase = adminClient(c.env);
  const data = await getFullBook(supabase, c.var.family.id);
  if (!data) return c.json({ error: 'No book found' }, 404);
  return c.json(data.visibleSections);
});

export default books;
