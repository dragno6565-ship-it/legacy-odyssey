# Stripe

**Status:** LIVE MODE — accepting real payments since Mar 29 2026
**Owner:** Legacy Odyssey subscription billing + gift purchases + domain order payments
**Last touched:** 2026-10-04 (archive review: endpoint-to-price map, plan/gift policies, webhook and how-to facts at the bottom)

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
- `charge.refunded`: marks UNREDEEMED gift codes `status='refunded'` (refuses to invalidate redeemed ones, logs loudly). Extended 2026-05-27 to PaymentIntent-based gifts.
- The live endpoint must be subscribed to 7 events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed, charge.refunded, payment_intent.succeeded.

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
- STALE, corrected 2026-10-04: refunded gift codes DO auto-invalidate now (`charge.refunded` handler in webhooks.js, see Webhooks handled).
- **NEVER use a customer's saved card / never enter card numbers** — direct customer to enter themselves (per safety rules)
- **Setup fee is monthly-only** — annual subscriptions don't pay setup


## Checkout endpoint to price map (verified in code 2026-10-04)
Two similarly named functions caused a false alarm on 2026-06-29; this is the truth:

| Route (POST /api/stripe/...) | Service function | What the customer pays | Used by |
|---|---|---|---|
| `/create-founder-checkout` | `createFounderCheckoutSession` | annual price + intro coupon = **$29 first year, then $49.99/yr** | the live landing "Claim It" (hosted Checkout path) |
| (embedded) | `createSignupSubscription` | same, via Payment Element (`metadata.signup_flow='embedded'`) | branded `/start/checkout` signup |
| `/create-founder-page-checkout` | `createFounderPageCheckoutSession` | **$29/yr FLAT, no coupon** (price `price_1TIVpBJk2GIrL5uS5xg3lRhk`, `metadata.plan='founder'`, optional `founder_note`) | hidden `/preview/founder` page only (noindex, GA4 only, letter signed by Dan; Dan's decision 2026-05-11; he does not mind strangers finding it) |
| `/create-checkout` | `createCheckoutSession` | annual price, NO coupon = $49.99 immediately | only old `/preview/*` landings (landing.ejs, landing-v2.ejs); a stray link could overcharge |
| `/create-childhood-checkout` | `createChildhoodCheckoutSession` / `createSignupChildhoodIntent` | **$450 one-time, 18 years** (STRIPE_PRICE_CHILDHOOD, fallback id in code) | Entire Childhood plan |
| gift flows | `createGiftCheckoutSession`, `createGiftPaymentIntent` | $29 (1 year) or $450 (Entire Childhood) | /gift |
| add-site | `createAdditionalSiteCheckout` | $29 first year then $49.99 (same coupon); web only | "Add a site" (kept web-only because of the Apple/Google in-app-purchase cut and review) |

Public pricing confirmed by Dan 2026-06-29: $29 first year, then $49.99/yr. No customers are on the old $12.99 add-on (dead code removed). Monthly is retired (one grandfathered customer).

## Plan and gift policies (Dan's decisions)
- **Entire Childhood Plan** (2026-05-25/26): $450 one-time, 18 years; anchor "about $900 in annual renewals" ($49.99 x 18). Account is `plan='paid'`, `billing_period='childhood'`, NO recurring Stripe subscription (we cover renewals). Gift version reuses `gift_codes.months_prepaid` (12 = one year, 216 = Entire Childhood). Badges: Annual "Introductory Offer", Childhood "Best Value". Never run with a real charge as of the archive review.
- **Gift redemption** (2026-05-17): the free year starts at REDEMPTION (trialEnd = now + months_prepaid); codes never expire (`expires_at` is NOT NULL, stored about +100 years; no expiry line on the certificate). Third delivery option "I'll give it to them myself" (`delivery_method='print'`). The certificate goes to the BUYER immediately; the recipient email goes now or on a buyer-chosen date. Certificate title "A digital baby book and their own personal website" (not "first year", 2026-05-14).
- **Comp (influencer) gifts**: admin-only at /admin/gift-codes, free year, company pays the domain. The `gift_codes.stripe_session_id` prefix tells the source: `comp_` = comp ($0 in Stripe), `cs_` = Checkout, `pi_` = PaymentIntent. A "customer with no Stripe payment" is usually a redeemed comp.
- **No refunds ever**, including when domain registration fails (Dan 2026-06-09); the customer keeps a working site on the subdomain.

## API and tracking facts
- API version is Basil-era: `invoice.payment_intent` is gone; the Payment Element secret is on `invoice.confirmation_secret` (expand `latest_invoice.confirmation_secret`); the webhook reads both `invoice.subscription` and `invoice.parent.subscription_details.subscription`.
- Embedded signup deliberately had no redirect-fallback provisioning (risk of a double domain purchase racing the webhook); `/start/welcome` later got an idempotent fallback. The gift flow has an idempotent redirect fallback.
- Google Ads "Purchase" is URL-based on `/stripe/success` only (do not break that URL). The branded flow returns to `/start/welcome`, which fires an explicit Ads conversion (label `5Qh2CI6c_KYcEKqMy8hD`) plus server-side Meta CAPI.
- After a paid checkout the customer must never land on the homepage: errors render `checkout-thanks.ejs`.
- Webhook idempotency: Stripe retries created 3 gift rows for one session (2026-05-15) until migration 017's unique index. Audit any new webhook insert for the same race. Any throw after payment must still provision or alert (an existing-email signup once threw after charging, leaving an orphaned subscription).
- Stripe `customer_name` is the CARDHOLDER, not the account holder: never use it for greetings.
- A test-mode (sandbox) endpoint pointed at the live webhook URL fails with 400 (prod only knows the live signing secret) and Stripe emails warnings; delete such endpoints.

## How-tos
- **Re-run fulfillment for a paid but unprovisioned session:** GET `/stripe/success?session_id=cs_live_...` (idempotent, keyed on the unique subdomain).
- **Live numbers without the dashboard:** Claude's browser tools cannot open dashboard.stripe.com or stripe.com/legal (safety restriction), so Dan clicks dashboard steps. For reads use the Stripe MCP (CLI) or the API with STRIPE_SECRET_KEY fetched read-only from Railway with an explicit User-Agent header (bare python-urllib gets 403 from Cloudflare). The MCP returns large JSON to a file and there is no jq on this machine: parse with Python. Customer emails come back redacted: join on `families.stripe_customer_id`.
- **Rolling the live secret key without downtime:** Dashboard > Developers > API keys > secret key row > Roll key; choose a SHORT grace expiry (about 1 hour), not "now"; passkey step-up; update STRIPE_SECRET_KEY in Railway (triggers a redeploy) and the ~/.claude.json Stripe MCP entry; test GET /v1/balance (200) and the homepage. Webhook signing secrets are separate.
- **Branding** (Dashboard only; the MCP cannot change account settings): planned brand #c8a96e, accent #1a1510 or gold, custom checkout domain `checkout.legacyodyssey.com` (CNAME). Hosted (redirect) flows that still show Stripe's page: add-site and reactivation.
- **Test purchases:** use a fresh email (Dan's own email is already a user). A Stripe checkout creates a subscription, so a failed fulfillment leaves one to cancel (Dan's job; Claude does no financial actions).

## Known leftovers
- The legacy hosted gift checkout points the product thumbnail at `/images/og-image.png`, which 404s (`stripeService.js` around line 537). Low impact (the Payment Element flow bypasses it).
- Dan's paid test sites legacyodysseytest8 and legacyodysseytest9 (2026-06-29/30) are real families with their own subscriptions (renew at $49.99) and registered .coms; see docs/domains/test-and-dormant.md. The smoke-test incomplete subscription for `lo-smoketest-2026` (2026-07-10) auto-voided with no charge.
