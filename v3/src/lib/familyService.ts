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

export async function findById(supabase: SupabaseClient, id: string): Promise<Family | null> {
  const { data } = await supabase.from('families').select('*').eq('id', id).maybeSingle();
  return (data as Family | null) ?? null;
}

export async function findByEmail(supabase: SupabaseClient, email: string): Promise<Family | null> {
  // Same logic as findByAuthUserId — prefer non-archived, fall back to most recent.
  const { data: active } = await supabase
    .from('families')
    .select('*')
    .eq('email', email)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active) return active as Family;
  const { data: latest } = await supabase
    .from('families')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (latest as Family | null) ?? null;
}

export async function findByStripeCustomerId(
  supabase: SupabaseClient,
  stripeCustomerId: string
): Promise<Family | null> {
  const { data } = await supabase
    .from('families')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  return (data as Family | null) ?? null;
}

export async function updateFamily(
  supabase: SupabaseClient,
  id: string,
  fields: Record<string, any>
): Promise<Family> {
  const { data, error } = await supabase
    .from('families')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Family;
}

/**
 * Sync a family's subscription_status by Stripe customer id. Direct port of
 * familyService.updateSubscriptionStatus from Express. Skips the update when
 * the family is admin-archived (the only legitimate way to un-archive is via
 * subscriptionService.reactivateFamily, which clears archived_at first).
 */
export async function updateSubscriptionStatus(
  supabase: SupabaseClient,
  stripeCustomerId: string,
  status: string
): Promise<Family | null> {
  const { data: existing } = await supabase
    .from('families')
    .select('id, archived_at')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (existing && (existing as any).archived_at) {
    console.log(
      `[stripe-webhook] family ${(existing as any).id} is archived — ignoring status sync to "${status}"`
    );
    return existing as Family;
  }

  const now = new Date();
  const updates: Record<string, any> = { subscription_status: status };
  if (status === 'active') {
    updates.plan = 'paid';
  } else if (status === 'canceled') {
    updates.plan = 'free';
    updates.cancelled_at = now.toISOString();
    updates.data_retain_until = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from('families')
    .update(updates)
    .eq('stripe_customer_id', stripeCustomerId)
    .select()
    .single();
  if (error) throw error;
  return data as Family;
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
