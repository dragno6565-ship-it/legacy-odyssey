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
