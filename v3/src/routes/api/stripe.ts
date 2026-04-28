/**
 * /api/stripe — Stripe Checkout + Portal endpoints.
 *
 * Phase 2 first cut: the routes the MOBILE app calls.
 *   POST /portal                          — SettingsScreen "Manage Subscription"
 *   POST /create-additional-site-checkout — AdditionalDomainScreen, NewWebsiteScreen
 *
 * Marketing-site routes (`/create-checkout`, `/create-founder-checkout`,
 * `/create-gift-checkout`, `/redeem-gift`) come in Phase 3 alongside the
 * marketing pages themselves. Mobile doesn't call them.
 *
 * Direct port of the relevant slices of:
 *   src/routes/api/stripe.js
 *   src/services/stripeService.js
 */
import { Hono } from 'hono';
import { type Env } from '../../lib/supabase';
import { stripeClient } from '../../lib/stripeClient';
import { requireAuth } from '../../middleware/requireAuth';
import type { Family } from '../../lib/types';

type Variables = {
  user: any;
  family: Family;
  accessibleFamilyIds: string[];
};

const stripe = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /api/stripe/portal — Stripe Customer Portal session for the family.
//
// Mobile SettingsScreen reads `url` and either opens it in a browser (real
// portal) or, when `isPortal: false`, treats it as the marketing pricing page
// (used when a trialing customer hasn't paid yet, so no Stripe customer exists).
stripe.post('/portal', requireAuth, async (c) => {
  const family = c.var.family;
  const appDomain = c.env.APP_DOMAIN || 'legacyodyssey.com';

  if (!family.stripe_customer_id) {
    return c.json({ url: `https://${appDomain}/#pricing`, isPortal: false });
  }

  const body = await c.req.json<{ return_url?: string }>().catch(() => ({}));
  const returnUrl = body.return_url || `https://${appDomain}`;

  const stripeApi = stripeClient(c.env);
  const session = await stripeApi.billingPortal.sessions.create({
    customer: family.stripe_customer_id,
    return_url: returnUrl,
  });
  return c.json({ url: session.url, isPortal: true });
});

// POST /api/stripe/create-additional-site-checkout — $12.99/yr add-on for a
// second/third website on the same Stripe customer. Mobile NewWebsiteScreen +
// AdditionalDomainScreen call this; the resulting Checkout URL opens in a
// browser, the customer pays, and the Stripe webhook (Phase 3) provisions
// the new family + book on success.
stripe.post('/create-additional-site-checkout', requireAuth, async (c) => {
  const body = await c.req.json<{
    subdomain?: string;
    domain?: string | null;
    bookName?: string;
  }>();
  if (!body.subdomain) return c.json({ error: 'subdomain is required' }, 400);

  const family = c.var.family;
  if (!family.stripe_customer_id) {
    return c.json({ error: 'No Stripe customer found. Please contact support.' }, 400);
  }

  const priceId = c.env.STRIPE_PRICE_ADDITIONAL_DOMAIN;
  if (!priceId) return c.json({ error: 'Additional-site price not configured' }, 500);

  const appDomain = c.env.APP_DOMAIN || 'legacyodyssey.com';

  const metadata: Record<string, string> = {
    type: 'additional_site',
    auth_user_id: c.var.user.id,
    subdomain: body.subdomain,
    book_name: body.bookName || '',
  };
  if (body.domain) metadata.domain = body.domain;

  const stripeApi = stripeClient(c.env);
  const session = await stripeApi.checkout.sessions.create({
    mode: 'subscription',
    customer: family.stripe_customer_id,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    success_url: `https://${appDomain}/additional-site/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://${appDomain}`,
  });

  return c.json({ url: session.url, sessionId: session.id });
});

export default stripe;
