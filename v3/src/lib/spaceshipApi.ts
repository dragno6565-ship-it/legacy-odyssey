/**
 * Tiny shared Spaceship API helper.
 *
 * The /api/domains/search route ships its own Spaceship fetch wrapper
 * inline; once we needed setAutoRenew (called by the cancel flow) it was
 * worth pulling the auth+base URL into one place.
 */
import type { Env } from './supabase';

export const SPACESHIP_BASE_URL = 'https://spaceship.dev/api/v1';

function headers(env: Env): Record<string, string> {
  return {
    'X-Api-Key': env.SPACESHIP_API_KEY!,
    'X-Api-Secret': env.SPACESHIP_API_SECRET!,
    'Content-Type': 'application/json',
  };
}

/**
 * Toggle Spaceship auto-renewal on a domain. Used by the cancel flow so the
 * customer's domain stops auto-billing once their subscription lapses.
 * No-op (logs warning + swallow) if the API isn't configured.
 */
export async function setAutoRenew(env: Env, domain: string, enabled: boolean): Promise<void> {
  if (!env.SPACESHIP_API_KEY || !env.SPACESHIP_API_SECRET) {
    console.warn(`[spaceship.setAutoRenew] Spaceship not configured — skipping ${domain}`);
    return;
  }
  const res = await fetch(
    `${SPACESHIP_BASE_URL}/domains/${encodeURIComponent(domain)}/autoRenew`,
    {
      method: 'PUT',
      headers: headers(env),
      body: JSON.stringify({ isEnabled: !!enabled }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spaceship setAutoRenew ${res.status}: ${text || res.statusText}`);
  }
  console.log(`Spaceship auto-renew ${enabled ? 'ENABLED' : 'DISABLED'} for ${domain}`);
}
