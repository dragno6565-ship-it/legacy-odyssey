/**
 * Stripe SDK helper for Workers.
 *
 * Stripe-node ships a fetch-based HTTP client (`Stripe.createFetchHttpClient`)
 * that works inside Workers without Node's `http` module. We construct the
 * client per-request (cheap, ~1ms) so the Env binding can flow in cleanly.
 *
 * `apiVersion` pinned to the same value the Express side uses (default at
 * the time of port). Bump deliberately when Stripe pushes API changes.
 */
import Stripe from 'stripe';
import type { Env } from './supabase';

export function stripeClient(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured (STRIPE_SECRET_KEY secret missing on the Worker)');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    typescript: true,
    // Pin to a stable API version. Stripe accepts an explicit version string.
    apiVersion: '2024-06-20',
  });
}
