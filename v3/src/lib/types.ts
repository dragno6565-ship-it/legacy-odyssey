/**
 * Shared types for v3.
 *
 * Mirror of the relevant columns from the families table in Supabase.
 * Source of truth is the production schema; this is the subset v3 reads.
 */

export type Family = {
  id: string;
  email: string | null;
  custom_domain: string | null;
  subdomain: string | null;
  is_active: boolean;
  archived_at: string | null;
  subscription_status: string | null;
  book_password: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string | null;
  // Many more fields exist; v3 only cares about routing + auth + status for now.
};
