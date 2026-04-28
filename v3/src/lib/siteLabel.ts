/**
 * Compute the public-facing label for a customer's book ("The Smith Family Site").
 *
 * Direct port of computeSiteLabel from src/middleware/requireBookPassword.js.
 * Order:
 *   1. Child's first + last name from the books table
 *   2. Custom domain stripped of TLD (kateragno.com → "The kateragno Site")
 *   3. Subdomain
 *   4. Generic fallback
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Family } from './types';

export async function computeSiteLabel(supabase: SupabaseClient, family: Family | null): Promise<string> {
  if (!family) return "Your Child's Site";

  // 1. Child's first + last name
  try {
    const { data: book } = await supabase
      .from('books')
      .select('child_first_name, child_last_name')
      .eq('family_id', family.id)
      .maybeSingle();
    const first = (book?.child_first_name || '').trim();
    const last = (book?.child_last_name || '').trim();
    const fullName = [first, last].filter(Boolean).join(' ');
    if (fullName) return `The ${fullName} Site`;
  } catch {
    // fall through
  }

  // 2. Custom domain stripped of TLD
  if (family.custom_domain) {
    const bare = family.custom_domain.replace(/\.[a-z]{2,}$/i, '');
    return `The ${bare} Site`;
  }

  // 3. Subdomain
  if (family.subdomain) return `The ${family.subdomain} Site`;

  return "Your Child's Site";
}
