/**
 * /api/domains/search — live domain availability lookup against Spaceship.
 *
 * Used by AdditionalDomainScreen + the founder modal on the marketing site.
 * Direct port of the search slice of:
 *   src/routes/api/domains.js
 *   src/services/domainService.js
 *   src/services/spaceshipService.js (checkAvailability + checkMultipleTlds)
 *
 * Spaceship API uses X-Api-Key + X-Api-Secret headers with a plain JSON body —
 * no SDK needed, just fetch().
 *
 * Cache:
 *   The Express version uses an in-memory Map with a 5-minute TTL. That works
 *   on Railway where every request hits the same process. On Workers each
 *   request can land on a different isolate, so we use Cache API (Cloudflare's
 *   edge cache) keyed by the search URL — same effective behavior, edge-distributed.
 */
import { Hono } from 'hono';
import { type Env } from '../../lib/supabase';

const SPACESHIP_BASE_URL = 'https://spaceship.dev/api/v1';
const PRIMARY_TLDS = ['com', 'family', 'baby', 'love', 'life', 'me'];
const MAX_REGISTRATION_PRICE = 20; // Don't surface domains over this — see spaceshipService.js
const CACHE_TTL_SEC = 5 * 60;

const domains = new Hono<{ Bindings: Env }>();

type AvailabilityResult = {
  domain: string;
  tld?: string;
  available: boolean;
  price: number | null;
  underBudget?: boolean;
  rateLimited?: boolean;
};

function sanitizeBaseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

async function spaceshipFetch(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SPACESHIP_BASE_URL}${path}`, {
    ...init,
    headers: {
      'X-Api-Key': env.SPACESHIP_API_KEY!,
      'X-Api-Secret': env.SPACESHIP_API_SECRET!,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function checkMultipleTlds(env: Env, baseName: string, tlds = PRIMARY_TLDS): Promise<AvailabilityResult[]> {
  const candidateDomains = tlds.map((tld) => `${baseName}.${tld}`);
  try {
    const res = await spaceshipFetch(env, '/domains/available', {
      method: 'POST',
      body: JSON.stringify({ domains: candidateDomains }),
    });
    if (!res.ok) throw new Error(`bulk availability ${res.status}`);
    const data: any = await res.json();
    return (data.domains || []).map((item: any) => {
      const tld = item.domain.split('.').slice(1).join('.');
      const premium = item.premiumPricing?.[0];
      const price = premium?.price != null ? parseFloat(premium.price) : null;
      const underBudget = price != null ? price <= MAX_REGISTRATION_PRICE : true;
      return {
        domain: item.domain,
        tld,
        available: item.result === 'available',
        price,
        underBudget,
      };
    });
  } catch (_err) {
    // Fall back to individual lookups (matches the Express recovery path).
    const results = await Promise.allSettled(
      candidateDomains.map(async (d, i): Promise<AvailabilityResult> => {
        try {
          const res = await spaceshipFetch(env, `/domains/${encodeURIComponent(d)}/available`);
          if (res.status === 429) {
            return { domain: d, tld: tlds[i], available: false, price: null, rateLimited: true };
          }
          const data: any = await res.json();
          const premium = data.premiumPricing?.[0];
          const price = premium?.price != null ? parseFloat(premium.price) : null;
          const underBudget = price != null ? price <= MAX_REGISTRATION_PRICE : true;
          return {
            domain: d,
            tld: tlds[i],
            available: data.result === 'available',
            price,
            underBudget,
          };
        } catch {
          return { domain: d, tld: tlds[i], available: false, price: null, underBudget: false };
        }
      })
    );
    return results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { domain: '', available: false, price: null, underBudget: false }
    );
  }
}

function generateVariations(baseName: string): string[] {
  const variations: string[] = [];
  for (const p of ['the', 'little', 'baby', 'our']) variations.push(`${p}${baseName}.com`);
  for (const s of ['family', 'book', 'story']) variations.push(`${baseName}${s}.com`);
  for (const tld of ['me', 'name', 'us']) variations.push(`${baseName}.${tld}`);
  for (const m of ['rose', 'marie', 'grace', 'james', 'lee']) variations.push(`${baseName}${m}.com`);
  return variations;
}

async function checkOne(env: Env, domain: string): Promise<AvailabilityResult | null> {
  try {
    const res = await spaceshipFetch(env, `/domains/${encodeURIComponent(domain)}/available`);
    if (res.status === 429) return { domain, available: false, price: null, rateLimited: true };
    if (!res.ok) return null;
    const data: any = await res.json();
    const premium = data.premiumPricing?.[0];
    return {
      domain,
      available: data.result === 'available',
      price: premium?.price != null ? parseFloat(premium.price) : null,
    };
  } catch {
    return null;
  }
}

async function suggestAlternatives(env: Env, baseName: string): Promise<AvailabilityResult[]> {
  const variations = generateVariations(baseName).slice(0, 10);
  const results = await Promise.allSettled(variations.map((d) => checkOne(env, d)));
  return results
    .map((r) => {
      if (r.status === 'rejected' || !r.value) return null;
      const v = r.value;
      if (!v.available) return null;
      const underBudget = v.price != null ? v.price <= MAX_REGISTRATION_PRICE : true;
      if (!underBudget) return null;
      return { domain: v.domain, available: true, price: v.price, underBudget: true };
    })
    .filter((x): x is AvailabilityResult => Boolean(x));
}

// GET /api/domains/search?name=janedoe
domains.get('/search', async (c) => {
  if (!c.env.SPACESHIP_API_KEY || !c.env.SPACESHIP_API_SECRET) {
    return c.json({ error: 'Domain search is not available at this time' }, 503);
  }

  const name = c.req.query('name');
  if (!name) return c.json({ error: 'name query parameter is required' }, 400);

  const clean = sanitizeBaseName(name);
  if (!clean || clean.length < 2) {
    return c.json({ error: 'Name must be at least 2 characters (letters, numbers, hyphens)' }, 400);
  }

  // Edge-cache key. Same effective TTL as Express's in-memory Map.
  const cacheKey = new Request(`https://internal.cache/domains-search/${clean}`);
  const cache = (caches as any).default as Cache;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const results = await checkMultipleTlds(c.env, clean);
  const hasAvailable = results.some((r) => r.available && r.underBudget);
  const alternatives = hasAvailable ? [] : await suggestAlternatives(c.env, clean);

  const body = JSON.stringify({ results, alternatives });
  const response = new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${CACHE_TTL_SEC}`,
    },
  });
  // Stash a clone so the cache layer keeps a copy without consuming the response body.
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

export default domains;
