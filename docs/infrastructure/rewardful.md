# Rewardful — Affiliate Program (Friends of Legacy Odyssey)

> Single source of truth for the Legacy Odyssey affiliate program.
> Set up June 8, 2026. **Live in Rewardful; code integration NOT YET deployed.**
> Last touched: 2026-06-08 (initial setup session).

---

## ⚠️ Read this first if you're picking this up

The Rewardful account is **fully configured and ready to recruit affiliates** — campaign created, fraud controls maxed, ToS saved, affiliate signup URL is live.

**BUT** the legacyodyssey.com side has zero integration. Until you ship the JS snippet + the Stripe `client_reference_id` patch, **referrals will not be tracked**. Anyone applying via https://legacyodyssey.getrewardful.com/signup right now would get an account but their links wouldn't attribute anything.

Do not recruit affiliates until the integration is deployed and tested end-to-end.

---

## Account

| Field | Value |
|---|---|
| Vendor | Rewardful (rewardful.com / app.getrewardful.com) |
| Login email | `legacyodysseyapp@gmail.com` |
| Account holder | Daniel Ragno |
| Plan | **Starter** ($49/mo) |
| Trial ends | **June 23, 2026** — paid plan kicks in |
| Transaction fee | 9% on commissions (on Starter) — drops to 0% on Growth ($99/mo) once monthly commissions paid exceed ~$555 |
| Stripe connection | `acct_1T3N7kJk2GIrL5uS` (Legacy Odyssey live mode) |
| Payment processor | Stripe (no Paddle) |

## Campaign

| Field | Value |
|---|---|
| Campaign name | **Friends of Legacy Odyssey** |
| Campaign ID | `4888cac7-ef12-44e5-a3f6-1f43a0874720` |
| Campaign URL (admin) | https://app.getrewardful.com/campaigns/4888cac7-ef12-44e5-a3f6-1f43a0874720 |
| Website URL | https://legacyodyssey.com |
| Affiliate signup URL | **https://legacyodyssey.getrewardful.com/signup** |
| Affiliate portal subdomain | `legacyodyssey.getrewardful.com` |
| Commission type | Percentage of sale |
| **Commission rate** | **35%** |
| **Recurring duration** | **Forever (no cap on # of payments, no month cap)** — both max-commissions and max-months fields left blank |
| Currency | USD |
| Cookie window | **90 days** |
| Hold period (days before commission becomes due) | **60 days** |
| Minimum payout threshold | **$50** |
| Attribution model | **Last-touch** |
| Affiliate link format | Query string (`?via=token`) |
| Payout method | PayPal (Wise also offered to affiliates) |

### Why 35% recurring forever

User chose this after a long pricing analysis (see session transcript ~June 8, 2026). Key reasoning:
- At 35% of $49.99/yr, the company still nets ~$19/yr per customer in perpetuity — never goes underwater
- "Forever" framing is the recruitment hook that breaks through pitches from competitors offering 30%/1yr
- ToS Section 9 locks in grandfathering: any future rate cut applies only to NEW referrals after the change, so existing affiliates keep 35% forever on their existing customers — this preserves brand trust if the program ever needs to be tightened

**Do not reduce this rate without reading Section 9 of the saved ToS first.** Cutting affiliate rates is a one-way reputational door.

## Fraud controls

All enabled in this session. Verify on /company/edit?tab=self_referrals and the campaign edit page.

| Control | State | Purpose |
|---|---|---|
| Self-referral auto-deactivate | ✅ ON | Catches the most common scam — affiliate using their own link to subscribe themselves/household |
| Self-referral email alerts | ✅ ON | Notifies `legacyodysseyapp@gmail.com` immediately |
| 60-day hold period | ✅ Set | Refunds + most Stripe chargebacks land before payout |
| Ignore search-engine traffic | ✅ ON | Blocks brand-PPC arbitrage (affiliate runs ads on "Legacy Odyssey" terms and claims credit for customers who would've converted anyway) |
| ToS prohibits 12 fraud vectors | ✅ Saved | Legal cover for clawing back commissions + banning affiliates |
| Stripe refund auto-void | ✅ Native (Rewardful handles automatically via `charge.refunded` webhook) | Refunded sales remove their commission with no manual work |

### Fraud controls NOT available on Starter plan

- **Manual affiliate approval** (private campaigns) — paywalled to Growth. On Starter, affiliates auto-approve at signup. **Mitigation:** check /affiliates daily, deactivate sketchy ones manually. The ToS gives legal cover to do so without dispute.
- **Custom reward descriptions** — paywalled.
- **Customer name visibility for affiliates** — paywalled.

### Things Rewardful does NOT solve (your eyes, not theirs)

- Coordinated cross-referrals (two affiliates trading sign-ups)
- Coupon-site detection (ToS bans them; recognize on application)
- Cookie stuffing — high click counts with abnormally low conversion ratio is the signature
- Chargebacks that fire >60 days after sale (rare but possible)
- Stolen-card subscriptions (chargeback timing usually within hold window)

Plan: 30 min/week reviewing /affiliates and /referrals for anomalies. Anomaly = sudden spike, abnormal click:signup ratio, multiple referrals sharing surname/address/IP, churn rate >2x baseline.

## Terms of Service

**Saved 2026-06-08** at https://app.getrewardful.com/terms/edit.

13 sections. Every affiliate must accept on signup. Key clauses:

1. What you earn — 35% recurring forever, no cap
2. Tracking — 90-day cookie, last-touch
3. **60-day hold** — voidable on refund, chargeback, trial cancel, fraud, ToS violation
4. Payouts — monthly 15th, PayPal/Wise, $50 min
5. Taxes — W-9 for US, W-8BEN intl, 1099-NEC at $600+/yr
6. Permitted promotion — blog/IG/TikTok/etc. with FTC disclosure
7. **Prohibited tactics (12 items)** — self-referrals, coordinated cross-referrals, coupon/cashback/deal sites, brand-term PPC, brand-domain squatting, cookie stuffing, incentivized signups, spam, misrepresentation, adult/hate/conspiracy/MLM platforms, stolen payment methods, marketing to minors
8. **Brand & content rules** — no "family book / family album / family story / scrapbook", no "forever", no "chapter", no real children's names in demos, use your-family-photo-album.com as demo
9. **Changes to program** — rate cuts: 30-day notice + applies only to NEW referrals (grandfathering, see above)
10. Termination — paid commissions survive, pending may be voided if linked to violation
11. Independent contractor; liability capped at unpaid commissions
12. Contact: `legacyodysseyapp@gmail.com`
13. **Governing law: Arizona** (Maricopa County state/federal courts) — DOR Industries, LLC is Arizona-formed

**Title field appears as "Terms of Service" in the Rewardful UI after save** — this is a Rewardful render quirk. The custom title "Friends of Legacy Odyssey - Affiliate Program Agreement" was saved successfully (verified via form_input "previous" value on re-edit). Affiliates see the saved content correctly during signup.

This ToS is a **strong starter**, not a lawyer-reviewed document. Budget $300-500 for a SaaS lawyer to review before the program scales past ~50 affiliates.

---

## ⏳ What's left to ship (code work in F:\legacy-odyssey)

### Task 2: Install Rewardful JS snippet on legacyodyssey.com

**Snippet to add** (paste in `<head>` of every page that an affiliate-referred visitor might land on):

```html
<script>(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');</script>
<script async src='https://r.wdfl.co/rw.js' data-rewardful='0a0312'></script>
```

**Rewardful API key:** `0a0312` (this is the public client-side key — safe to commit).

**Files to update:**
- `src/views/marketing/landing.ejs`
- `src/views/marketing/landing-v2.ejs`
- `src/views/marketing/gift.ejs`
- `src/views/marketing/redeem.ejs`
- All blog templates (`src/views/marketing/blog-*.ejs`)
- Any shared layout in `src/views/layouts/` that wraps marketing pages
- The new `/affiliates` page (Task 5)

**Verification:** After deploy, visit `https://legacyodyssey.com/?via=test123` in an incognito window, open DevTools console, run `Rewardful.referral` — should return the referral ID (not the literal string "test123").

### Task 3: Pass referral ID to Stripe Checkout sessions

**File:** `src/routes/api/stripe.js`

**Two checkout-session endpoints to patch:**
1. `POST /api/stripe/create-checkout` (monthly subscription)
2. `POST /api/stripe/create-founder-checkout` (annual intro)

**Frontend change** (in each pricing card's JS that hits these endpoints):
```js
// before posting to /api/stripe/create-checkout:
const referral = (window.Rewardful && window.Rewardful.referral) || null;
fetch('/api/stripe/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...existing, referral })
});
```

**Backend change** (in each endpoint's Stripe Checkout session creation):
```js
const sessionParams = {
  // ...existing params
};
// CRITICAL: only set client_reference_id when present.
// Stripe rejects the session if client_reference_id is an empty string.
if (req.body.referral) {
  sessionParams.client_reference_id = req.body.referral;
}
const session = await stripe.checkout.sessions.create(sessionParams);
```

**Why:** Rewardful's attribution pipeline reads `client_reference_id` from the Stripe webhook. No `client_reference_id`, no commission.

**Reference docs:** https://app.getrewardful.com/setup/code?platform=stripe_checkout_server (shareable instructions: https://app.getrewardful.com/instructions/82fae679-0778-4069-8f1d-af5dc1987afa)

### Task 4: Verify domain-purchase-failure refund voids the commission

The Legacy Odyssey signup flow can fail post-Stripe-charge if Spaceship domain registration fails. The existing code refunds the customer in that case.

**Verify:** when that refund path executes, it triggers Stripe's `charge.refunded` webhook → Rewardful automatically voids the linked commission. No code change should be needed, but **test the failure path explicitly** with a test referral before launching:

1. Create test affiliate in Rewardful (use /affiliates/new)
2. Use a test referral link to subscribe a test customer
3. Force the Spaceship purchase to fail (use an invalid domain name)
4. Confirm Stripe refund fires AND the Rewardful commission flips to `voided`

If Rewardful doesn't void automatically, we'd need to register a webhook endpoint and void via `POST https://api.getrewardful.com/v1/commissions/:id` with the API Secret (NOT the public key — store in Railway env as `REWARDFUL_API_SECRET`).

### Task 5: Build `/affiliates` public landing page

**Route:** add to `src/routes/marketing.js` or appropriate marketing route file.

**View:** new `src/views/marketing/affiliates.ejs`.

**Copy outline:**
- Hero: "Earn 35% recurring forever for every parent you refer to Legacy Odyssey."
- Who it's for: parenting bloggers, doulas, baby gear reviewers, pregnancy influencers, midwives, lactation consultants, birth photographers
- How it works: apply → get approved → share your link → 35% on every payment your customers make, forever
- Program details box: 35% rate, 90-day cookie, 60-day hold, $50 min payout, last-touch, monthly PayPal/Wise payouts
- What's NOT allowed: short list pointing to full ToS (coupon sites, brand PPC, incentivized signups, spam)
- CTA: "Apply now →" button linking to `https://legacyodyssey.getrewardful.com/signup`
- Footer note: "Approval typically within 48 hours"

**Footer link:** add "Affiliates" to the legacyodyssey.com footer (both `landing.ejs` and `landing-v2.ejs`).

**Brand rules apply** — read CLAUDE.md hard rules before writing copy. Never use "forever" to describe the **product** (we DO use it for the commission rate — that's fine, it's about money not product). Never "family book / chapter / scrapbook" etc.

### Task 6: Upload affiliate marketing materials to Rewardful Asset Library

**Where:** https://app.getrewardful.com/asset-library

**Pack contents:**
- The canonical product description (verbatim, from CLAUDE.md "CANONICAL PRODUCT DESCRIPTION" section)
- 5 sample IG/TikTok caption swipes (parenting voice, not corporate)
- 3 email-newsletter swipe templates
- Banner images: 728x90, 300x250, 1080x1080 (matches our gold/cream brand colors)
- Demo link: `https://your-family-photo-album.com`
- Brand-rules one-pager (forbidden words: forever (re: product), chapter, family book/album/story/scrapbook; no real children's names; use the demo site, not real customer sites)
- FAQ doc affiliates can copy answers from when their audience asks

Until this is uploaded, affiliates have nothing to work with — recruitment success drops materially.

---

## Webhooks (optional but recommended later)

https://app.getrewardful.com/webhooks — currently **no endpoints registered**.

When the legacy-odyssey backend has a Rewardful webhook receiver, register the endpoint here. Useful events:
- `commission.created` — track commission accruals in our admin dashboard
- `commission.voided` — log fraud catches
- `affiliate.created` — Slack/email notification for new applications so we can vet within 48h
- `affiliate.confirmed` — kick off our own welcome email + onboarding sequence

API Secret (for webhook signature verification) lives in https://app.getrewardful.com/company/edit under "API credentials." Store as Railway env `REWARDFUL_API_SECRET`. **DO NOT COMMIT.**

## Useful URLs

| URL | What |
|---|---|
| https://app.getrewardful.com/campaigns | Campaign list |
| https://app.getrewardful.com/affiliates | All affiliates (review here daily once recruiting) |
| https://app.getrewardful.com/referrals | All referrals (clicks + conversions) |
| https://app.getrewardful.com/commissions | Commission ledger |
| https://app.getrewardful.com/payouts | Payout history |
| https://app.getrewardful.com/asset-library | Marketing assets (Task 6) |
| https://app.getrewardful.com/setup | Setup wizard (we're stuck on step 4 until Task 2 ships) |
| https://app.getrewardful.com/subscription | Plan / billing |
| https://app.getrewardful.com/terms/edit | ToS |
| https://legacyodyssey.getrewardful.com/signup | **Affiliate signup (public)** |
| https://app.getrewardful.com/instructions/82fae679-0778-4069-8f1d-af5dc1987afa | Shareable Stripe-Checkout setup instructions |

## Credentials cheat sheet

| Secret | Where | Notes |
|---|---|---|
| Public API key | `0a0312` | Embed in client-side JS snippet. Safe to commit. |
| API Secret | https://app.getrewardful.com/company/edit (show with link, never logged here) | Server-side only. Store as Railway env `REWARDFUL_API_SECRET`. **Never commit.** |
| Account login | legacyodysseyapp@gmail.com | Password not stored — use the user's password manager. |

---

## Decisions worth recording (so future Claude sessions don't relitigate them)

- **35% recurring forever is locked in.** Reversibility is the constraint, not math. Dropping it later is a brand-killer. See ToS Section 9 grandfathering clause.
- **No commission cap.** No "$200 lifetime per customer" cap was set in Rewardful (the plan doesn't expose that field anyway). Risk is small because retention curve drops naturally and 35% leaves ~$19/yr net per long-tenured customer.
- **Last-touch attribution, not first-touch.** Industry standard; harder to game with parking-page cookie attacks than first-touch.
- **Starter plan, not Growth.** Upgrade trigger: monthly commissions paid exceed ~$555 (the breakeven where 9% Starter fee > $50/mo Growth premium).
- **Self-vet, not "approve every applicant".** Even though Rewardful auto-approves on Starter, we will actively deactivate within 48h any affiliate whose application/site/audience doesn't pass our smell test. ToS Section 7 gives legal cover.
- **No paid recruitment agency.** User explored this. Conclusion: at <10 paying customers, recruitment is the founder's job (mom bloggers respond to founders, not affiliate managers). Re-evaluate at 50+ active affiliates.

---

## Refund policy (affects commission clawbacks)

**Legacy Odyssey does NOT offer refunds — ever.** All sales are final. To stop future
charges, a customer cancels and keeps access through the end of their current paid period.
Surfaced on every checkout entry point ("All sales are final — no refunds"), in the customer
ToS (`terms.ejs` §4 Refund Policy), the affiliate FAQ, and the Rewardful affiliate ToS §1.

**Implication for affiliates:** commissions are NOT subject to refund-based clawback (there are
no refunds). The only residual reasons a commission voids after the 60-day hold are **Stripe
chargebacks** (rare) and **ToS violations** — both handled natively by Rewardful / manually.

## Checkout-surface attribution status

- **Standard subscription checkouts** (create-checkout / founder / founder-page / childhood
  Checkout Sessions): attributed via `client_reference_id`. ✅ Live + verified 2026-06-08.
- **Gift + branded-signup PaymentIntent flows**: can't use `client_reference_id`, so the
  Rewardful referral is captured in Stripe metadata (`metadata.rewardful_referral`) and the
  webhook calls `rewardfulService.recordConversion()` → `POST /v1/conversions` on payment
  success. **✅ 2026-06-15: `REWARDFUL_API_SECRET` confirmed set in Railway prod (length 32) and
  AUTHENTICATES** (coding ran a read-only `GET /v1/campaigns` with the key → HTTP 200). The
  webhook uses the identical Basic-auth (secret as username), so conversions will authenticate.
  **Last step:** the affiliates session's real referred purchase — buy via a test affiliate's
  `?via=` link, confirm the conversion appears in the Rewardful dashboard. Code/webhook = GREEN.

## History

- **2026-06-15** — `REWARDFUL_API_SECRET` added to Railway prod by Dan; coding verified it's set (length 32) and authenticates against the Rewardful API (`GET /v1/campaigns` → 200, read-only). Gift/branded-signup conversion code/webhook side now GREEN; only a real referred test purchase remains (affiliates).
- **2026-06-08** — Initial setup. Rewardful account, Stripe connection, campaign, fraud controls, ToS all configured by Claude session in `E:\Claude` working with Dan. Code-side integration (Tasks 2-6 above) not yet done.
