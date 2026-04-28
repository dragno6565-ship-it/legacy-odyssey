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

export const MAX_REGISTRATION_PRICE = 20; // Don't auto-buy domains over $20/yr

/**
 * Register a domain via Spaceship. Returns the async operation ID — caller
 * polls via pollOperation() until status is 'success' or 'failed'.
 */
export async function registerDomain(env: Env, domain: string): Promise<string> {
  if (!env.SPACESHIP_API_KEY || !env.SPACESHIP_API_SECRET || !env.SPACESHIP_CONTACT_ID) {
    throw new Error(
      'Spaceship not fully configured (need SPACESHIP_API_KEY/SECRET/CONTACT_ID)'
    );
  }
  const contactId = env.SPACESHIP_CONTACT_ID;
  const res = await fetch(`${SPACESHIP_BASE_URL}/domains/${encodeURIComponent(domain)}`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      autoRenew: true,
      years: 1,
      privacyProtection: { level: 'high', userConsent: true },
      contacts: {
        registrant: contactId,
        admin: contactId,
        tech: contactId,
        billing: contactId,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Spaceship registerDomain failed for ${domain}: ${res.status} ${body}`);
  }
  const operationId = res.headers.get('spaceship-async-operationid');
  if (!operationId) {
    throw new Error(`No operation ID returned from Spaceship registration for ${domain}`);
  }
  console.log(`Domain registration started: ${domain} (operation: ${operationId})`);
  return operationId;
}

/**
 * Poll an async operation. Returns 'pending' | 'success' | 'failed'.
 */
export async function pollOperation(
  env: Env,
  operationId: string
): Promise<'pending' | 'success' | 'failed'> {
  const res = await fetch(`${SPACESHIP_BASE_URL}/async-operations/${operationId}`, {
    headers: headers(env),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Spaceship pollOperation ${operationId} failed: ${res.status} ${body}`);
  }
  const data: any = await res.json();
  return data.status;
}

/**
 * Configure customer DNS so apex + www both A → Approximated cluster IP.
 * Direct port of spaceshipService.setupDns including the URL-Redirect
 * pollution detector (Apr 25 2026 — Spaceship's default URL Redirect
 * connection injects locked apex A records that compete with ours).
 */
export async function setupDns(env: Env, domain: string): Promise<void> {
  if (!env.APPROXIMATED_CLUSTER_IP) {
    throw new Error('APPROXIMATED_CLUSTER_IP not configured');
  }
  const clusterIp = env.APPROXIMATED_CLUSTER_IP;

  const items = [
    { type: 'A', name: '@', address: clusterIp, ttl: 1800 },
    { type: 'A', name: 'www', address: clusterIp, ttl: 1800 },
  ];

  const res = await fetch(`${SPACESHIP_BASE_URL}/dns/records/${encodeURIComponent(domain)}`, {
    method: 'PUT',
    headers: headers(env),
    body: JSON.stringify({ force: true, items }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Spaceship setupDns failed for ${domain}: ${res.status} ${body}`);
  }
  console.log(`DNS configured for ${domain}: apex + www → ${clusterIp} (Approximated)`);

  // Pollution detector — verify no stray apex A records remain that point
  // anywhere other than our cluster IP. Spaceship's default URL Redirect
  // connection injects locked apex records that compete with ours.
  try {
    const check = await fetch(
      `${SPACESHIP_BASE_URL}/dns/records/${encodeURIComponent(domain)}?take=100&skip=0`,
      { headers: headers(env) }
    );
    if (check.ok) {
      const data: any = await check.json();
      const all = (data.items || []) as any[];
      const apexA = all.filter((r) => r.type === 'A' && (r.name === '@' || r.name === ''));
      const stray = apexA.filter((r) => r.address !== clusterIp);
      if (stray.length > 0) {
        const groups = Array.from(new Set(stray.map((r: any) => r.group?.type || 'unknown')));
        throw new Error(
          `Apex polluted by ${stray.length} stray A record(s) (${stray
            .map((r: any) => r.address)
            .join(', ')}; group=${groups.join(',')}). Likely Spaceship URL Redirect — remove via dashboard: Domain Manager → ${domain} → URL redirect → Remove connection.`
        );
      }
    }
  } catch (err: any) {
    if (/polluted/.test(err.message || '')) throw err;
    console.warn(`setupDns verification GET failed for ${domain}: ${err.message}`);
  }
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
