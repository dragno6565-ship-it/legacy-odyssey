/**
 * Approximated.app — custom domains + auto TLS for SaaS.
 *
 * Direct port of src/services/approximatedService.js. We register a virtual
 * host on Approximated's proxy cluster for each customer hostname (apex + www);
 * Approximated terminates TLS via Caddy On-Demand TLS / Let's Encrypt and
 * proxies to our origin while preserving the Host header.
 *
 * Phase 4: Workers will eventually replace Approximated entirely with native
 * Workers Custom Domains. Until then, the v3 webhook still adds vhosts here
 * so newly-registered customer domains route correctly.
 */
import type { Env } from './supabase';

const API_BASE = 'https://cloud.approximated.app/api';

function headers(env: Env): Record<string, string> {
  if (!env.APPROXIMATED_API_KEY) throw new Error('APPROXIMATED_API_KEY not configured');
  return {
    'api-key': env.APPROXIMATED_API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function targetAddress(env: Env): string {
  return env.APPROXIMATED_TARGET || 'legacyodyssey.com';
}

function targetPort(env: Env): string {
  return env.APPROXIMATED_TARGET_PORT || '443';
}

export type Vhost = {
  id: number;
  incoming_address: string;
  target_address: string;
  target_ports: string | number;
  user_message?: string;
};

/**
 * Look up a vhost by its incoming hostname. Returns null on 404.
 */
export async function findVirtualHost(env: Env, hostname: string): Promise<Vhost | null> {
  const res = await fetch(
    `${API_BASE}/vhosts/by/incoming/${encodeURIComponent(hostname)}`,
    { headers: headers(env) }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Approximated findVirtualHost failed for ${hostname}: ${res.status} ${body}`);
  }
  const data: any = await res.json();
  return (data.data as Vhost) || null;
}

/**
 * Register a customer hostname (apex or www). Idempotent — if a vhost already
 * exists for this incoming address, returns it instead of 422-ing.
 */
export async function addVirtualHost(
  env: Env,
  hostname: string
): Promise<{ id: number; hostname: string; target: string; userMessage?: string }> {
  const existing = await findVirtualHost(env, hostname);
  if (existing) {
    console.log(`Approximated virtual host already exists: ${hostname} (id: ${existing.id})`);
    return {
      id: existing.id,
      hostname: existing.incoming_address,
      target: existing.target_address,
      userMessage: existing.user_message,
    };
  }

  const res = await fetch(`${API_BASE}/vhosts`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      incoming_address: hostname,
      target_address: targetAddress(env),
      target_ports: targetPort(env),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Approximated addVirtualHost failed for ${hostname}: ${res.status} ${body}`);
  }
  const data: any = await res.json();
  console.log(`Approximated virtual host added: ${hostname} (id: ${data.data.id})`);
  return {
    id: data.data.id,
    hostname: data.data.incoming_address,
    target: data.data.target_address,
    userMessage: data.data.user_message,
  };
}

/**
 * Delete a vhost by numeric id (returned from addVirtualHost or findVirtualHost).
 * Used during cancellation cleanup.
 */
export async function deleteVirtualHost(env: Env, id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/vhosts/${id}`, {
    method: 'DELETE',
    headers: headers(env),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Approximated deleteVirtualHost failed for id ${id}: ${res.status} ${body}`);
  }
  console.log(`Approximated virtual host deleted: ${id}`);
  return true;
}
