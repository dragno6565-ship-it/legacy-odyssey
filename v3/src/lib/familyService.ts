/**
 * Family lookups. Direct port of the read-side helpers from
 * src/services/familyService.js. The "prefer non-archived" rule fixed the
 * cancelled-customer-sees-old-family bug from Apr 26 2026 — we replicate it
 * exactly so v3 doesn't regress that fix.
 *
 * Phase 2 only ports the lookups the mobile auth flow needs. The write helpers
 * (create/update/listAll/updateSubscriptionStatus) come in Phase 3 alongside
 * signup + Stripe webhooks.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Family } from './types';

export async function findBySubdomain(supabase: SupabaseClient, subdomain: string): Promise<Family | null> {
  const { data } = await supabase
    .from('families')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .maybeSingle();
  return (data as Family | null) ?? null;
}

/**
 * Prefer the active (non-archived) family. Falls back to the most recent
 * archived one only if every family is archived.
 */
export async function findByAuthUserId(supabase: SupabaseClient, authUserId: string): Promise<Family | null> {
  const { data: active } = await supabase
    .from('families')
    .select('*')
    .eq('auth_user_id', authUserId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active) return active as Family;
  const { data: latest } = await supabase
    .from('families')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (latest as Family | null) ?? null;
}

export async function findAllByAuthUserId(supabase: SupabaseClient, authUserId: string): Promise<Family[]> {
  const { data } = await supabase
    .from('families')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: true });
  return (data || []) as Family[];
}
