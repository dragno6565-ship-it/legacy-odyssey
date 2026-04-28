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
import {
  getFullBook,
  getBookByFamilyId,
  imageUrl,
  updateBook,
  updateSectionCards,
  upsertBirthStory,
  upsertFamilyMember,
  upsertMonth,
} from '../../lib/bookService';
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

// PUT /api/books/mine/sections — Override section visibility from ManageSections.
const SECTION_KEYS = ['before', 'birth', 'home', 'months', 'family', 'firsts', 'holidays', 'letters', 'recipes', 'vault'];
books.put('/mine/sections', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);

  const body = await c.req.json<Record<string, unknown>>();
  const current = (book.visible_sections as Record<string, boolean>) || {};
  for (const [key, value] of Object.entries(body)) {
    if (SECTION_KEYS.includes(key) && typeof value === 'boolean') current[key] = value;
  }

  try {
    await updateBook(supabase, book.id, { visible_sections: current });
  } catch (err: any) {
    // Match Express graceful-degrade if the column hasn't been migrated yet.
    if (!String(err?.message || '').includes('visible_sections')) throw err;
  }

  const data = await getFullBook(supabase, c.var.family.id);
  return c.json(data?.visibleSections || {});
});

// PUT /api/books/mine — child info + book-password update.
const CHILD_FIELD_MAP: Record<string, string> = {
  first_name: 'child_first_name',
  middle_name: 'child_middle_name',
  last_name: 'child_last_name',
  birth_date: 'birth_date',
  birth_time: 'birth_time',
  weight_lbs: 'birth_weight_lbs',
  weight_oz: 'birth_weight_oz',
  length_inches: 'birth_length_inches',
  city: 'birth_city',
  state: 'birth_state',
  hospital: 'birth_hospital',
  name_meaning: 'name_meaning',
};
const ALLOWED_BOOK_FIELDS = [
  'child_first_name', 'child_middle_name', 'child_last_name', 'birth_date', 'birth_time',
  'birth_weight_lbs', 'birth_weight_oz', 'birth_length_inches',
  'birth_city', 'birth_state', 'birth_hospital', 'name_meaning',
  'hero_image_path', 'name_quote', 'parent_quote', 'parent_quote_attribution',
  'vault_unlock_date',
];
const TYPED_COLUMNS = ['birth_date', 'birth_time', 'birth_weight_lbs', 'birth_weight_oz', 'birth_length_inches', 'vault_unlock_date'];

books.put('/mine', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);

  const body = await c.req.json<Record<string, any>>();
  const updates: Record<string, any> = {};

  if (body.child && typeof body.child === 'object') {
    for (const [mobileKey, dbKey] of Object.entries(CHILD_FIELD_MAP)) {
      if (body.child[mobileKey] !== undefined) updates[dbKey] = body.child[mobileKey];
    }
  }
  for (const k of ALLOWED_BOOK_FIELDS) {
    if (body[k] !== undefined) updates[k] = body[k];
  }
  for (const col of TYPED_COLUMNS) {
    if (col in updates && (updates[col] === '' || updates[col] === undefined)) updates[col] = null;
  }

  const passwordValue = body.password ?? body.book_password;
  if (passwordValue !== undefined) {
    await supabase.from('families').update({ book_password: passwordValue }).eq('id', c.var.family.id);
  }

  if (Object.keys(updates).length === 0 && passwordValue === undefined) {
    return c.json(book);
  }

  let updated = book;
  if (Object.keys(updates).length > 0) {
    updated = await updateBook(supabase, book.id, updates);
  }
  return c.json(updated);
});

// --- Generic resolvePhoto helper for read endpoints below ---
function rp(env: Env, val: any) {
  return imageUrl(env.SUPABASE_URL, val) || '';
}

// --- Before Arrived ---
books.get('/mine/before', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const [{ data: cards }, { data: checklist }] = await Promise.all([
    supabase.from('before_arrived_cards').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('before_arrived_checklist').select('*').eq('book_id', book.id).order('sort_order'),
  ]);
  return c.json({ cards: cards || [], checklist: checklist || [] });
});

books.put('/mine/before', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const body = await c.req.json<{ cards?: any[]; checklist?: any[] }>();
  if (body.cards) await updateSectionCards(supabase, 'before_arrived_cards', book.id, body.cards);
  if (body.checklist) await updateSectionCards(supabase, 'before_arrived_checklist', book.id, body.checklist);
  return c.json({ success: true });
});

// --- Birth ---
books.get('/mine/birth', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const { data } = await supabase.from('birth_stories').select('*').eq('book_id', book.id).maybeSingle();
  if (!data) return c.json({});
  return c.json({
    ...data,
    mom_photo_1: rp(c.env, data.mom_photo_1),
    mom_photo_2: rp(c.env, data.mom_photo_2),
    dad_photo_1: rp(c.env, data.dad_photo_1),
    dad_photo_2: rp(c.env, data.dad_photo_2),
  });
});

books.put('/mine/birth', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const body = await c.req.json();
  const data = await upsertBirthStory(supabase, book.id, body);
  return c.json(data);
});

// --- Coming Home ---
books.get('/mine/coming-home', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const { data } = await supabase.from('coming_home_cards').select('*').eq('book_id', book.id).order('sort_order');
  return c.json((data || []).map((card: any) => ({ ...card, photo_path: rp(c.env, card.photo_path) })));
});

books.put('/mine/coming-home', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const body = await c.req.json<any>();
  await updateSectionCards(supabase, 'coming_home_cards', book.id, body.cards || body);
  return c.json({ success: true });
});

// --- Months ---
books.get('/mine/months', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const { data } = await supabase.from('months').select('*').eq('book_id', book.id).order('month_number');
  return c.json(data || []);
});

books.get('/mine/months/:num', async (c) => {
  const num = parseInt(c.req.param('num'), 10);
  if (!Number.isFinite(num) || num < 1 || num > 12) return c.json({ error: 'Month must be 1-12' }, 400);
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const { data } = await supabase.from('months').select('*').eq('book_id', book.id).eq('month_number', num).maybeSingle();
  if (!data) return c.json({ error: 'Month not found' }, 404);
  return c.json({ ...data, photo_path: rp(c.env, data.photo_path) });
});

books.put('/mine/months/:num', async (c) => {
  const num = parseInt(c.req.param('num'), 10);
  if (!Number.isFinite(num) || num < 1 || num > 12) return c.json({ error: 'Month must be 1-12' }, 400);
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const body = await c.req.json();
  const data = await upsertMonth(supabase, book.id, num, body);
  return c.json(data);
});

// --- Family ---
books.get('/mine/family', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const { data } = await supabase.from('family_members').select('*').eq('book_id', book.id).order('sort_order');
  return c.json(
    (data || []).map((m: any) => ({
      ...m,
      photo_path: rp(c.env, m.photo_path),
      album_1_path: rp(c.env, m.album_1_path),
      album_2_path: rp(c.env, m.album_2_path),
      album_3_path: rp(c.env, m.album_3_path),
    }))
  );
});

books.put('/mine/family/:key', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const body = await c.req.json();
  const data = await upsertFamilyMember(supabase, book.id, c.req.param('key'), body);
  return c.json(data);
});

// --- Generic firsts / letters / recipes ---
const SECTION_TABLES: Record<string, string> = {
  firsts: 'firsts',
  letters: 'letters',
  recipes: 'recipes',
};
for (const [route, table] of Object.entries(SECTION_TABLES)) {
  books.get(`/mine/${route}`, async (c) => {
    const supabase = adminClient(c.env);
    const book = await getBookByFamilyId(supabase, c.var.family.id);
    if (!book) return c.json({ error: 'No book found' }, 404);
    const { data } = await supabase.from(table).select('*').eq('book_id', book.id).order('sort_order');
    return c.json(data || []);
  });
  books.put(`/mine/${route}`, async (c) => {
    const supabase = adminClient(c.env);
    const book = await getBookByFamilyId(supabase, c.var.family.id);
    if (!book) return c.json({ error: 'No book found' }, 404);
    const body = await c.req.json<any>();
    await updateSectionCards(supabase, table, book.id, body.items || body);
    return c.json({ success: true });
  });
}

// --- Celebrations (year-scoped) ---
books.get('/mine/celebration-years', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  return c.json(book.celebration_years || ['Your First Year']);
});

books.post('/mine/celebration-years', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const { label } = await c.req.json<{ label?: string }>();
  const years = (book.celebration_years as string[]) || ['Your First Year'];
  if (!label || years.includes(label)) return c.json({ error: 'Invalid or duplicate label' }, 400);
  const updated = [...years, label];
  await updateBook(supabase, book.id, { celebration_years: updated });
  return c.json(updated);
});

books.delete('/mine/celebration-years', async (c) => {
  const supabase = adminClient(c.env);
  const { label } = await c.req.json<{ label?: string }>();
  if (!label || label === 'Your First Year') return c.json({ error: 'Cannot delete first year' }, 400);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const years = ((book.celebration_years as string[]) || ['Your First Year']).filter((y) => y !== label);
  await supabase.from('celebrations').delete().eq('book_id', book.id).eq('year_label', label);
  await updateBook(supabase, book.id, { celebration_years: years });
  return c.json(years);
});

books.get('/mine/celebrations', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const yearLabel = c.req.query('year_label') || 'Your First Year';
  const { data } = await supabase
    .from('celebrations')
    .select('*')
    .eq('book_id', book.id)
    .eq('year_label', yearLabel)
    .order('sort_order');
  return c.json((data || []).map((row: any) => ({ ...row, photo_path: rp(c.env, row.photo_path) })));
});

books.put('/mine/celebrations', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const body = await c.req.json<{ year_label?: string; items?: any[] }>();
  const yearLabel = body.year_label || 'Your First Year';
  const items = body.items || [];
  await supabase.from('celebrations').delete().eq('book_id', book.id).eq('year_label', yearLabel);
  const meaningful = items.filter((i) => i.title || i.body || i.photo_path || i.eyebrow);
  if (meaningful.length > 0) {
    const rows = meaningful.map((c2, i) => ({
      book_id: book.id,
      year_label: yearLabel,
      sort_order: i,
      photo_path: c2.photo_path || null,
      eyebrow: c2.eyebrow || null,
      title: c2.title || '(untitled)',
      body: c2.body || null,
    }));
    const { error } = await supabase.from('celebrations').insert(rows);
    if (error) throw error;
  }
  return c.json({ success: true });
});

// --- Vault ---
books.get('/mine/vault', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const { data } = await supabase.from('vault_items').select('*').eq('book_id', book.id).order('created_at');
  return c.json(data || []);
});

books.post('/mine/vault', async (c) => {
  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  if (!book) return c.json({ error: 'No book found' }, 404);
  const body = await c.req.json();
  const { data, error } = await supabase
    .from('vault_items')
    .insert({ book_id: book.id, ...body })
    .select()
    .single();
  if (error) throw error;
  return c.json(data, 201);
});

// --- PUT /mine/photo-position — JSONB merge for one focal point ---
books.put('/mine/photo-position', async (c) => {
  const body = await c.req.json<{ storagePath?: string; x?: number; y?: number }>();
  const { storagePath, x, y } = body;
  if (!storagePath || x === undefined || y === undefined) {
    return c.json({ error: 'storagePath, x, and y are required' }, 400);
  }
  const cx = Math.max(0, Math.min(100, Number(x)));
  const cy = Math.max(0, Math.min(100, Number(y)));

  const supabase = adminClient(c.env);
  const book = await getBookByFamilyId(supabase, c.var.family.id);
  // If this family has no book row, silently succeed (matches Express behavior).
  if (!book) return c.json({ success: true, storagePath, x: cx, y: cy });

  const current = (book.photo_positions as Record<string, { x: number; y: number }>) || {};
  current[storagePath] = { x: cx, y: cy };

  const { error } = await supabase.from('books').update({ photo_positions: current }).eq('id', book.id);
  if (error) throw error;
  return c.json({ success: true, storagePath, x: cx, y: cy });
});

// --- PUT /mine/settings — book_password + custom_domain on the family row ---
books.put('/mine/settings', async (c) => {
  const supabase = adminClient(c.env);
  const body = await c.req.json<{ book_password?: string; custom_domain?: string | null }>();
  const updates: Record<string, any> = {};
  if (body.book_password) updates.book_password = body.book_password;
  if (body.custom_domain !== undefined) updates.custom_domain = body.custom_domain;
  const { data, error } = await supabase
    .from('families')
    .update(updates)
    .eq('id', c.var.family.id)
    .select()
    .single();
  if (error) throw error;
  return c.json(data);
});

export default books;
