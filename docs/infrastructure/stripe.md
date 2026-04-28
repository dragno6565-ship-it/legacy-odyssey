# Stripe

**Status:** LIVE MODE — accepting real payments since Mar 29 2026
**Owner:** Legacy Odyssey subscription billing + gift purchases + domain order payments
**Last touched:** 2026-04-28

## What it is
Payment processor. Handles all customer billing — annual subscriptions, monthly subscriptions, gift purchases, additional domain add-ons. Live mode (real cards charged).

## Where it's used
- `src/services/stripeService.js` — checkout creation
- `src/routes/api/stripe.js` — checkout endpoints
- `src/routes/webhooks.js` — webhook handler at `/stripe/webhook`
- Mobile app's Manage Subscription flow
- Founder modal on landing page (annual intro $29 → $49.99/yr)
- /gift purchase flow
- /redeem flow

## Current configuration
- **Account ID:** `acct_1T3N7kJk2GIrL5uS`
- **Mode:** LIVE
- **Webhook endpoint:** https://legacyodyssey.com/stripe/webhook (validates Stripe-Signature)
- **Env vars:**
  - `STRIPE_SECRET_KEY` — server-side
  - `STRIPE_WEBHOOK_SECRET` — webhook signature validation
  - `STRIPE_PRICE_MONTHLY` — $4.99/mo
  - `STRIPE_PRICE_SETUP` — $5.99 one-time setup fee
  - `STRIPE_PRICE_ANNUAL` — $49.99/yr standard
  - `STRIPE_PRICE_ANNUAL_INTRO` = `price_1TLojVJk2GIrL5uS0oQORYsr` — base annual ($49.99/yr)
  - `STRIPE_ANNUAL_INTRO_COUPON` = `sX2lEPb6` — $20.99 off, duration: once (the $29 intro)
  - `STRIPE_PRICE_ADDITIONAL_DOMAIN` = `price_1TDVIAQzzNThrLYKNnMljEkp` — $12.99/yr

## Pricing tiers

| Tier | Customer pays | Stripe price ID env var |
|---|---|---|
| Annual intro (PRIMARY) | $29 first year, $49.99/yr renewal | `STRIPE_PRICE_ANNUAL_INTRO` + coupon `sX2lEPb6` |
| Annual standard | $49.99/yr | `STRIPE_PRICE_ANNUAL` |
| Monthly | $4.99/mo + $5.99 setup | `STRIPE_PRICE_MONTHLY` + `STRIPE_PRICE_SETUP` |
| Gift | $29 (recipient gets first year free, then $49.99/yr) | gift checkout flow |
| Additional domain | $12.99/yr | `STRIPE_PRICE_ADDITIONAL_DOMAIN` |

## Webhooks handled
- `checkout.session.completed` — provisions family, kicks off domain registration, sends welcome email
- `customer.subscription.updated` — handles cancellations + reactivations
- `customer.subscription.deleted` — finalizes cancellation
- `charge.refunded` — TODO: should mark gift_codes invalid (not implemented yet, see CLAUDE.md open loops)

## History
- 2026-03-29 — First real payment accepted. Business goes live.
- 2026-04 — Annual intro pricing set as primary; gift flow added; reactivation flow added
- 2026-04-26 — Webhook race fix: cancellation triggered Stripe `customer.subscription.updated` with status='trialing'+cancel_at_period_end=true; treated as reactivation by mistake. Fixed.
- 2026-04-27 — Annual + Gift end-to-end tested with real money during E2E session
- 2026-04-28 — Monthly E2E test pending

## Related
- All `customers/*.md` files — each subscription is a Stripe customer
- `infrastructure/supabase.md` — webhook updates families/gift_codes tables
- `infrastructure/resend.md` — webhook triggers welcome email

## Open issues / quirks
- **Refunded gift codes don't auto-invalidate** — `gift_codes.status` stays `purchased` even after Stripe refund. Webhook on `charge.refunded` should mark code invalid; not implemented.
- **NEVER use a customer's saved card / never enter card numbers** — direct customer to enter themselves (per safety rules)
- **Setup fee is monthly-only** — annual subscriptions don't pay setup
