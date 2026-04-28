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
  // Secrets (via wrangler secret put)
  SUPABASE_SERVICE_ROLE_KEY: string;
  SESSION_SECRET: string;
};

export function adminClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
