/**
 * Loads a customer's full book from Supabase.
 *
 * Direct port of getFullBook + computeVisibleSections from
 * src/services/bookService.js. Same data shape — used by the JSX views.
 *
 * Phase 1 only reads. Writes (upsertMonth, etc.) get ported in the mobile
 * API phase (Phase 2).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

// Loose types for now — full schema typing comes later.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export type FullBook = {
  book: Row;
  beforeCards: Row[];
  checklist: Row[];
  birthStory: Row;
  comingHomeCards: Row[];
  months: Row[];
  familyMembers: Row[];
  firsts: Row[];
  celebrations: Row[];
  celebrationsByYear: { label: string; items: Row[] }[];
  letters: Row[];
  recipes: Row[];
  vaultItems: Row[];
  visibleSections: VisibleSections;
};

export type VisibleSections = {
  before: boolean;
  birth: boolean;
  home: boolean;
  months: boolean;
  family: boolean;
  firsts: boolean;
  holidays: boolean;
  letters: boolean;
  recipes: boolean;
  vault: boolean;
};

const hasText = (v: unknown): boolean =>
  typeof v === 'string' && v.trim().length > 0;

function computeVisibleSections(data: Omit<FullBook, 'visibleSections'>): VisibleSections {
  const before = data.beforeCards.some((c) => hasText(c.body) || hasText(c.photo_path));
  const birth = hasText(data.birthStory?.mom_narrative) || hasText(data.birthStory?.dad_narrative);
  const home = data.comingHomeCards.some((c) => hasText(c.body) || hasText(c.photo_path));
  const months = data.months.some((m) => hasText(m.photo_path) || hasText(m.note));
  const family = data.familyMembers.some((fm) => hasText(fm.story) || hasText(fm.photo_path));
  const firsts = data.firsts.some((f) => hasText(f.note) || hasText(f.date_text));
  const holidays = data.celebrations.some((c) => hasText(c.body) || hasText(c.photo_path));
  const letters = data.letters.some((l) => hasText(l.body));
  const recipes = data.recipes.some((r) => hasText(r.description) || hasText(r.photo_path));
  const vault = data.vaultItems.length > 0;

  const overrides = (data.book?.visible_sections as Partial<VisibleSections>) || {};
  return {
    before: overrides.before !== undefined ? overrides.before : before,
    birth: overrides.birth !== undefined ? overrides.birth : birth,
    home: overrides.home !== undefined ? overrides.home : home,
    months: overrides.months !== undefined ? overrides.months : months,
    family: overrides.family !== undefined ? overrides.family : family,
    firsts: overrides.firsts !== undefined ? overrides.firsts : firsts,
    holidays: overrides.holidays !== undefined ? overrides.holidays : holidays,
    letters: overrides.letters !== undefined ? overrides.letters : letters,
    recipes: overrides.recipes !== undefined ? overrides.recipes : recipes,
    vault: overrides.vault !== undefined ? overrides.vault : vault,
  };
}

export async function getFullBook(
  supabase: SupabaseClient,
  familyId: string
): Promise<FullBook | null> {
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('family_id', familyId)
    .maybeSingle();
  if (!book) return null;

  const [
    { data: beforeCards },
    { data: checklist },
    { data: birthStory },
    { data: comingHomeCards },
    { data: months },
    { data: familyMembers },
    { data: firsts },
    { data: celebrations },
    { data: letters },
    { data: recipes },
    { data: vaultItems },
  ] = await Promise.all([
    supabase.from('before_arrived_cards').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('before_arrived_checklist').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('birth_stories').select('*').eq('book_id', book.id).maybeSingle(),
    supabase.from('coming_home_cards').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('months').select('*').eq('book_id', book.id).order('month_number'),
    supabase.from('family_members').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('firsts').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('celebrations').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('letters').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('recipes').select('*').eq('book_id', book.id).order('sort_order'),
    supabase.from('vault_items').select('*').eq('book_id', book.id).order('created_at'),
  ]);

  // Group celebrations by year_label, respecting book.celebration_years order
  const allCelebrations = (celebrations || []) as Row[];
  const years: string[] = book.celebration_years || ['Your First Year'];
  const grouped: { label: string; items: Row[] }[] = years.map((label) => ({
    label,
    items: allCelebrations.filter((c) => (c.year_label || 'Your First Year') === label),
  }));
  const seen = new Set(years);
  for (const c of allCelebrations) {
    const y = c.year_label || 'Your First Year';
    if (!seen.has(y)) {
      seen.add(y);
      grouped.push({
        label: y,
        items: allCelebrations.filter((x) => (x.year_label || 'Your First Year') === y),
      });
    }
  }

  const partial = {
    book,
    beforeCards: (beforeCards || []) as Row[],
    checklist: (checklist || []) as Row[],
    birthStory: (birthStory || {}) as Row,
    comingHomeCards: (comingHomeCards || []) as Row[],
    months: (months || []) as Row[],
    familyMembers: (familyMembers || []) as Row[],
    firsts: (firsts || []) as Row[],
    celebrations: allCelebrations,
    celebrationsByYear: grouped,
    letters: (letters || []) as Row[],
    recipes: (recipes || []) as Row[],
    vaultItems: (vaultItems || []) as Row[],
  };

  return {
    ...partial,
    visibleSections: computeVisibleSections(partial),
  };
}

/**
 * Build a public URL for a Supabase Storage photo path.
 * Port of getPublicUrl from src/utils/imageUrl.js.
 */
export function imageUrl(supabaseUrl: string, storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith('http')) return storagePath;
  return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;
}

// --- Mutating helpers (Phase 2 mobile API write endpoints) ---

/**
 * Find a book by family_id. Same shape as Express bookService.getBookByFamilyId.
 */
export async function getBookByFamilyId(supabase: SupabaseClient, familyId: string): Promise<Row | null> {
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('family_id', familyId)
    .maybeSingle();
  return (data as Row | null) ?? null;
}

export async function updateBook(supabase: SupabaseClient, bookId: string, fields: Row): Promise<Row> {
  const { data, error } = await supabase
    .from('books')
    .update(fields)
    .eq('id', bookId)
    .select()
    .single();
  if (error) throw error;
  return data as Row;
}

const MONTH_ALLOWED = ['label', 'highlight', 'weight', 'length', 'photo_path', 'note'];

export async function upsertMonth(
  supabase: SupabaseClient,
  bookId: string,
  monthNumber: number,
  fields: Row
): Promise<Row> {
  const safe: Row = {};
  for (const k of MONTH_ALLOWED) if (fields[k] !== undefined) safe[k] = fields[k];

  const { data: existing } = await supabase
    .from('months')
    .select('id')
    .eq('book_id', bookId)
    .eq('month_number', monthNumber)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('months')
      .update(safe)
      .eq('id', (existing as Row).id)
      .select()
      .single();
    if (error) throw error;
    return data as Row;
  }
  if (!safe.label) safe.label = `Month ${monthNumber}`;
  const { data, error } = await supabase
    .from('months')
    .insert({ book_id: bookId, month_number: monthNumber, ...safe })
    .select()
    .single();
  if (error) throw error;
  return data as Row;
}

export async function upsertFamilyMember(
  supabase: SupabaseClient,
  bookId: string,
  memberKey: string,
  fields: Row
): Promise<Row> {
  const { data, error } = await supabase
    .from('family_members')
    .upsert({ book_id: bookId, member_key: memberKey, ...fields }, { onConflict: 'book_id,member_key' })
    .select()
    .single();
  if (error) throw error;
  return data as Row;
}

const BIRTH_ALLOWED = [
  'first_held_by',
  'mom_title',
  'mom_narrative',
  'dad_title',
  'dad_narrative',
  'mom_photo_1',
  'mom_photo_2',
  'dad_photo_1',
  'dad_photo_2',
];

export async function upsertBirthStory(
  supabase: SupabaseClient,
  bookId: string,
  fields: Row
): Promise<Row> {
  const safe: Row = {};
  for (const k of BIRTH_ALLOWED) if (fields[k] !== undefined) safe[k] = fields[k];

  const { data: existing } = await supabase
    .from('birth_stories')
    .select('id')
    .eq('book_id', bookId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('birth_stories')
      .update(safe)
      .eq('id', (existing as Row).id)
      .select()
      .single();
    if (error) throw error;
    return data as Row;
  }
  const { data, error } = await supabase
    .from('birth_stories')
    .insert({ book_id: bookId, ...safe })
    .select()
    .single();
  if (error) throw error;
  return data as Row;
}

const NOT_NULL_DEFAULTS: Record<string, Row> = {
  before_arrived_cards: { title: '(untitled)' },
  coming_home_cards: { title: '(untitled)' },
  firsts: { title: '(untitled)', emoji: '⭐' },
  celebrations: { title: '(untitled)' },
  letters: { from_label: '(anonymous)' },
  recipes: { title: '(untitled)' },
  before_arrived_checklist: { label: '(item)' },
};

/**
 * "Replace all rows for this book in this table" pattern. Mirrors the Express
 * helper exactly: filter empty cards out, apply NOT NULL defaults, delete then
 * insert with sort_order.
 */
export async function updateSectionCards(
  supabase: SupabaseClient,
  table: string,
  bookId: string,
  cards: Row[]
): Promise<Row[]> {
  const defaults = NOT_NULL_DEFAULTS[table] || {};

  const meaningful = (cards || []).filter((card) => {
    const { photo_path: _p, sort_order: _s, book_id: _b, id: _i, created_at: _c, updated_at: _u, ...fields } = card;
    return Object.values(fields).some((v) => v !== undefined && v !== null && v !== '' && v !== false);
  });

  const cleaned = meaningful.map((card) => {
    const row: Row = { ...card };
    for (const [key, defaultVal] of Object.entries(defaults)) {
      if (row[key] === undefined || row[key] === null || (typeof row[key] === 'string' && !row[key].trim())) {
        row[key] = defaultVal;
      }
    }
    delete row.id;
    delete row.created_at;
    delete row.updated_at;
    delete row.book_id;
    return row;
  });

  await supabase.from(table).delete().eq('book_id', bookId);
  if (cleaned.length > 0) {
    const rows = cleaned.map((card, i) => ({ book_id: bookId, sort_order: i, ...card }));
    const { data, error } = await supabase.from(table).insert(rows).select();
    if (error) throw error;
    return (data || []) as Row[];
  }
  return [];
}

/**
 * Build the photoPos() helper that renders an inline `object-position` style
 * for a given photo path, given the book's photo_positions JSONB column.
 */
export function makePhotoPos(photoPositions: Record<string, { x: number; y: number }> | null) {
  const positions = photoPositions || {};
  return function photoPos(photoPath: string | null | undefined): string {
    if (!photoPath) return '';
    let storagePath = photoPath;
    if (photoPath.startsWith('http')) {
      const marker = '/photos/';
      const idx = photoPath.indexOf(marker);
      storagePath = idx !== -1 ? photoPath.substring(idx + marker.length) : photoPath;
    }
    const pos = positions[storagePath];
    if (!pos) return '';
    return `object-position: ${pos.x}% ${pos.y}%`;
  };
}
