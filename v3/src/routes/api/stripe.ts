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
import { redeemGiftCode } from '../../lib/giftService';
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

// ----------------------------------------------------------------------------
// Marketing-site checkouts. Phase 3 — these are NOT called by the mobile app;
// they're called by the marketing site's pricing page, founder modal, and
// gift page. Direct ports of stripeService.{createCheckoutSession,
// createFounderCheckoutSession, createGiftCheckoutSession} + the matching
// Express routes.
// ----------------------------------------------------------------------------

// POST /api/stripe/create-checkout — monthly OR annual subscription Checkout.
stripe.post('/create-checkout', async (c) => {
  const body = await c.req.json<{
    email?: string;
    domain?: string;
    period?: string;
    subdomain?: string;
    book_type?: string;
  }>();
  const { email, domain, period, subdomain: legacySubdomain } = body;

  // Support both new domain flow and legacy subdomain flow.
  const subdomain = domain
    ? domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
    : legacySubdomain;
  if (!email || (!domain && !subdomain)) {
    return c.json({ error: 'email and domain (or subdomain) are required' }, 400);
  }

  const resolvedPeriod = period === 'annual' ? 'annual' : 'monthly';
  const priceId =
    resolvedPeriod === 'annual' ? c.env.STRIPE_PRICE_ANNUAL : c.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) return c.json({ error: `No price configured for ${resolvedPeriod}` }, 500);

  const metadata: Record<string, string> = {
    subdomain: subdomain!,
    period: resolvedPeriod,
    book_type: 'baby_book', // Family Album product retired
  };
  if (domain) metadata.domain = domain;

  const lineItems: any[] = [{ price: priceId, quantity: 1 }];
  // Setup fee for monthly only — annual has no one-time charge.
  if (resolvedPeriod === 'monthly' && c.env.STRIPE_PRICE_SETUP) {
    lineItems.push({ price: c.env.STRIPE_PRICE_SETUP, quantity: 1 });
  }

  const appDomain = c.env.APP_DOMAIN || 'legacyodyssey.com';
  const stripeApi = stripeClient(c.env);
  const session = await stripeApi.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: lineItems,
    metadata,
    allow_promotion_codes: true,
    success_url: `https://${appDomain}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://${appDomain}`,
  });
  return c.json({ url: session.url, sessionId: session.id });
});

// POST /api/stripe/create-founder-checkout — annual intro $29 first year.
stripe.post('/create-founder-checkout', async (c) => {
  const body = await c.req.json<{ email?: string; domain?: string; subdomain?: string }>();
  const { email, domain, subdomain: legacySubdomain } = body;

  const subdomain = domain
    ? domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
    : legacySubdomain;
  if (!email) return c.json({ error: 'email is required' }, 400);

  const priceId = c.env.STRIPE_PRICE_ANNUAL_INTRO || c.env.STRIPE_PRICE_ANNUAL;
  if (!priceId) return c.json({ error: 'Annual intro price not configured' }, 500);

  const metadata: Record<string, string> = {
    subdomain: subdomain || '',
    period: 'annual',
    plan: 'annual_intro',
    book_type: 'baby_book',
  };
  if (domain) metadata.domain = domain;

  const params: any = {
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    success_url: `https://${c.env.APP_DOMAIN || 'legacyodyssey.com'}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://${c.env.APP_DOMAIN || 'legacyodyssey.com'}`,
  };
  // Apply first-year intro coupon if configured ($20.99 off → $29 first year).
  if (c.env.STRIPE_ANNUAL_INTRO_COUPON) {
    params.discounts = [{ coupon: c.env.STRIPE_ANNUAL_INTRO_COUPON }];
  } else {
    params.allow_promotion_codes = true;
  }

  const stripeApi = stripeClient(c.env);
  const session = await stripeApi.checkout.sessions.create(params);
  return c.json({ url: session.url, sessionId: session.id });
});

// POST /api/stripe/create-gift-checkout — one-time $29 gift purchase.
stripe.post('/create-gift-checkout', async (c) => {
  const body = await c.req.json<{
    buyerEmail?: string;
    buyerName?: string;
    recipientName?: string;
    recipientEmail?: string;
    message?: string;
    giftMessage?: string;
  }>();
  const { buyerEmail, buyerName, recipientName, recipientEmail } = body;
  const message = body.message || body.giftMessage;

  if (!buyerEmail) return c.json({ error: 'buyerEmail is required' }, 400);
  if (!recipientName) return c.json({ error: 'recipientName is required' }, 400);

  const appDomain = c.env.APP_DOMAIN || 'legacyodyssey.com';
  const stripeApi = stripeClient(c.env);
  const session = await stripeApi.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Legacy Odyssey — 1 Year Gift for ${recipientName || 'your recipient'}`,
            description:
              'One-year gift subscription. Recipient redeems a gift code to create their own account and choose their custom domain.',
            images: ['https://legacyodyssey.com/images/og-image.png'],
          },
          unit_amount: 2900, // $29.00
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'gift',
      buyer_name: buyerName || '',
      recipient_name: recipientName || '',
      recipient_email: recipientEmail || '',
      gift_message: message || '',
    },
    success_url: `https://${appDomain}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://${appDomain}/gift`,
  });
  return c.json({ url: session.url, sessionId: session.id });
});

// POST /api/stripe/redeem-gift — recipient claims their gift code.
// Always returns JSON (matches the Apr 26 fix in Express).
stripe.post('/redeem-gift', async (c) => {
  try {
    const body = await c.req.json<{ code?: string; email?: string; domain?: string }>();
    if (!body.code || !body.email) {
      return c.json({ error: 'code and email are required' }, 400);
    }
    const result = await redeemGiftCode(c.env, {
      code: body.code,
      email: body.email,
      domain: body.domain,
    });
    return c.json({
      success: true,
      subdomain: result.family.subdomain,
      domain: result.domain,
    });
  } catch (err: any) {
    console.error('redeem-gift error:', err.message);
    const status = String(err.message || '').includes('gift code') ? 400 : 500;
    return c.json({ error: err.message || 'Redemption failed.' }, status);
  }
});

export default stripe;
