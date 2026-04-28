/**
 * Supabase client factory for Workers.
 *
 * Two clients in production code:
 *   - admin: uses service role key, bypasses row-level security. Server-only.
 *   - anon: uses anon key, respects RLS. Public-safe.
 *
 * In Phase 1 we only use admin (matches src/config/supabase.js usage in
 * resolveFamily/requireBookPassword). Anon will be wired up in Phase 2 for
 * the mobile-app-side auth flows.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Env = {
  // Public (in wrangler.toml [vars])
  APP_DOMAIN: string;
  NODE_ENV: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  // Stripe price IDs are PUBLIC — committable to wrangler.toml.
  STRIPE_PRICE_MONTHLY?: string;
  STRIPE_PRICE_SETUP?: string;
  STRIPE_PRICE_ANNUAL?: string;
  STRIPE_PRICE_ANNUAL_INTRO?: string;
  STRIPE_ANNUAL_INTRO_COUPON?: string;
  STRIPE_PRICE_ADDITIONAL_DOMAIN?: string;
  // Secrets (via wrangler secret put)
  SUPABASE_SERVICE_ROLE_KEY: string;
  SESSION_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  SPACESHIP_API_KEY?: string;
  SPACESHIP_API_SECRET?: string;
};

export function adminClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Anon-keyed client. Used by the auth routes that hit signInWithPassword,
 * refreshSession, resetPasswordForEmail, and updateUser — public Supabase
 * Auth endpoints that should NOT use the service-role key.
 */
export function anonClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
