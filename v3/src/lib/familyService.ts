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

export async function findByCustomDomain(supabase: SupabaseClient, domain: string): Promise<Family | null> {
  const { data } = await supabase
    .from('families')
    .select('*')
    .eq('custom_domain', domain)
    .maybeSingle();
  return (data as Family | null) ?? null;
}

/**
 * Generate a random alphanumeric token (lowercase hex) using Web Crypto.
 * Used for the per-family book_password seed. The Express version uses
 * Node's `crypto.randomBytes(4).toString('hex')` — same output shape (8 chars).
 */
function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

type CreateFamilyArgs = {
  email: string;
  authUserId: string | null;
  subdomain: string | null;
  displayName: string;
  customDomain?: string | null;
  stripeCustomerId?: string | null;
  customerName?: string;
  plan?: 'free' | 'paid';
  bookType?: string;
};

/**
 * Insert a new family row. Mirrors familyService.create() from the Express side.
 * Returns the inserted row.
 */
export async function createFamily(
  supabase: SupabaseClient,
  args: CreateFamilyArgs
): Promise<Family> {
  const insert: Record<string, any> = {
    email: args.email,
    auth_user_id: args.authUserId,
    subdomain: args.subdomain,
    custom_domain: args.customDomain || null,
    display_name: args.displayName,
    book_password: randomHex(4),
    subscription_status: args.plan === 'paid' ? 'active' : 'trialing',
    plan: args.plan || 'free',
    book_type: args.bookType || 'baby_book',
  };
  if (args.stripeCustomerId) insert.stripe_customer_id = args.stripeCustomerId;
  if (args.customerName) insert.customer_name = args.customerName;

  const { data, error } = await supabase.from('families').insert(insert).select().single();
  if (error) throw error;
  return data as Family;
}
