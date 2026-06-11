# Sales Blockers — What's Stopping Conversions

> Review 2026-06-08. Mix of LIVE-VERIFIED (curl/code) and agent-reported
> (marked). Tiered by revenue impact. Update as items close.

---

## ⭐ ROOT CAUSE — "traffic but nobody buys" (GA4 data, 2026-06-08)

**Verified in GA4 (property 531219463), last 28 days May 11–Jun 7:**
- **1,856 sessions**, but **engagement rate only 24%** (healthy ≈ 50%+) and
  **average engagement time per session ≈ 9 SECONDS** (Direct 10s, Paid Social 8s).
- **Key events: 3 in 28 days. Purchaser rate 0.0%. Last 7 days: 0 key events**
  on 319 users.
- Channels: **Direct 763 (41%)**, Paid Social 449 (24%), then Paid Search /
  Organic Social / Paid Other.

**The page is NOT the problem.** Loaded the live site: hero headline, value
prop, the domain-search CTA, and the $29 price are all clear and above the
fold; purchase tracking (Meta Pixel `Purchase` + GA4 `purchase`) fires
correctly on success.ejs (lines 343/352). So conversions are near-zero
because **visitors leave in ~9 seconds — they never scroll to pricing/checkout.**

**That points at TRAFFIC QUALITY, not the funnel below the fold:**

### S-001a — ~76% of sessions never engage; traffic is largely unqualified 🔴 #1
- 9-second average + 24% engagement across all channels = most "traffic" is
  not in-market parents.
- **41% "Direct" at 10s / 19.5% engagement is a bot/junk signature.** Real
  direct visitors (typed your URL) should engage MORE than other channels, not
  less. This is likely bots or untagged junk inflating the "traffic" number.
- **Paid Social (Meta) 8s** = the ads buy cheap, low-intent clicks.
- **Fix:** (1) Segment "Direct" by geo/device/landing-path to confirm bots;
  add bot filtering. (2) Judge the funnel on REAL engaged sessions, not the
  vanity 1,856. The true qualified-visitor count is far smaller.

### S-001b — Conversion volume too low for Meta to optimize → vicious cycle 🔴
- The `Purchase` pixel fires, BUT Meta needs ~50 purchases/week to exit
  "learning." At ~0–3 conversions/month it CAN'T optimize for buyers, so it
  optimizes for cheap clicks/landing-page-views → it literally finds you
  bouncers. Low sales → no optimization → junk traffic → low sales.
- This is why ~$520 spend / ~$134 CPA produced almost nothing.
- **Fix:** Don't run Meta on Purchase optimization at this volume. Either
  (a) optimize for a higher-volume mid-funnel event (domain search /
  InitiateCheckout) with a TIGHT audience (new/expecting parents, gift-givers),
  or (b) pause paid entirely and pour effort into the channel that actually
  engages (find it: the channel with the highest avg engagement time = real
  humans), plus the dormant referral program (B13) and gifting.

### S-001c — Unit economics (context)
- $29 first year, ~$10/yr domain COGS, $49.99 renewal. Even a "good" CPA must
  stay well under ~$20 to work. Current paid spend is pure loss.

### S-001d — FULL per-channel engagement (GA4, 28 days) — the decisive table

| Channel | Sessions | % | Eng rate | **Avg time** | Key events | Revenue |
|---|---|---|---|---|---|---|
| **TOTAL** | 1,856 | 100% | 24% | **9s** | 3 | $14.97 |
| Direct | 763 | 41% | 19.5% | 10s | 2 | $9.98 |
| Paid Social | 449 | 24% | 22.7% | 8s | 1 | $4.99 |
| Paid Search | 403 | 22% | 23.8% | **6s** | 0 | $0 |
| Organic Social | 122 | 6.6% | 41% | 14s | 0 | $0 |
| Paid Other | 52 | 2.8% | 25% | 0s | 0 | $0 |
| Referral | 25 | 1.4% | 48% | 36s | 0 | $0 |
| Organic Shopping | 20 | 1.1% | 55% | 36s | 0 | $0 |
| Organic Search | 12 | 0.7% | 75% | **1m18s** | 0 | $0 |

**The pattern is unambiguous: the more you PAY for traffic, the worse it
engages; the real humans are in the (starved) organic channels.**

- **~49% of all traffic is PAID (Paid Social + Search + Other = 904 sessions)
  and it bounces in 0–8 seconds for ~$0 return.** Paid Search especially: 403
  sessions, **6-second** average, ZERO key events. You are paying Google and
  Meta to deliver bouncers.
- **Direct 41% @ 10s** = mostly bot/junk inflating the session count (real
  direct should engage MOST, not least). It did yield 2 key events / $9.98 —
  so a sliver is real.
- **Where the real, interested parents are (high engagement, starved volume):**
  - **Organic Search — 75% engaged, 1m18s** (people who searched + found you READ).
  - Organic Shopping 55% / 36s · Referral 48% / 36s.
  - **Organic Social — 41% / 14s on 122 sessions** = best volume+quality combo.
  - All organic combined ≈ 180 sessions (<10% of traffic).

### ACTION (priced by leverage)
1. **Cut Paid Search now** (403 sess, 6s, $0). It's the clearest waste.
2. **Pause / radically rework Paid Social** — at this conversion volume Meta
   can't optimize for buyers (S-001b); it's buying 8s bouncers.
3. **Investigate the 41% Direct for bots** (segment by geo/device/landing path;
   add bot filtering) so the real funnel is measurable.
4. **Reallocate to organic — that's where attention lives:**
   - **SEO / content** (Organic Search reads for 78s) — the blog already exists; invest here.
   - **Organic Social** — already your best engaged-volume channel; post consistently.
   - **Turn ON the dormant referral program (B13)** — Referral engages 48%/36s.
5. **Gifting** — warm, intent-driven buyers vs cold ad clicks.

> Net: this is NOT "fix the page." It's "stop buying junk traffic, and feed the
> organic channels where real parents already engage."

### S-001e — Landing-page report (GA4, 28 days) — the /gift leak

| Landing page | Sessions | % | Avg time | Key events | Rev |
|---|---|---|---|---|---|
| / (home) | 1,264 | 68% | 9s | 2 | $9.98 |
| **/gift** | **471** | **25%** | **6s** | **0** | **$0** |
| /account | 23 | 1.2% | 4s | 0 | $0 |
| /blog | 10 | 0.5% | **2s** | 0 | $0 |
| /redeem | 9 | 0.5% | 28s | 0 | $0 |

**NEW critical finding — 25% of ALL traffic lands on `/gift`, bounces in 6
seconds, and converts ZERO.** That's 471 sessions producing nothing.
- **Strong hypothesis:** a paid campaign points at `/gift`. Paid Social = 449
  sessions; /gift = 471 — nearly identical. Likely the Meta gift ads drive cold
  6-second bouncers to the gift page for $0. **CONFIRM in Meta Ads Manager:
  what's the destination URL + audience of the active campaign?** If it's
  /gift, that single campaign is ~a quarter of your traffic wasted.
- **Action:** audit the /gift campaign — pause it or fix targeting/landing.

**Blog is NOT an acquisition channel yet:** only 10 sessions, 2-second
engagement. The content exists but isn't ranking/getting traffic. SEO is a
real lever but a MONTHS-long build, not a quick win — set expectations
accordingly. (Organic Search brings quality — 78s — but only ~12 sessions,
landing mostly on home.)

**Homepage (68%, 9s):** the workhorse, but even it engages only 9s —
reinforces that the inbound traffic is mostly low-intent/junk, not the page.

### S-001f — Meta Ads Manager (CONFIRMED) — paid is deeply unprofitable

Account 605508002865292, last 30 days (May 9–Jun 7). **$1,141.87 spent.**

| Campaign | Status | Spent | Results | Cost / result |
|---|---|---|---|---|
| Sales — New Parents | Off | $639.37 | **3 website purchases** | **$213.12 / purchase** |
| Sales — Gift | Completed | $322.80 | 3 "multiple conversions" | $107.60 (likely mid-funnel, not sales — GA shows /gift = $0) |
| Sales — Website Privacy Test | Completed | $179.70 | **0 purchases** | — (pure loss) |
| Leads — Phoenix/Mesa Parents | Off | $0.00 | — | never spent |

**The damning math: you paid $213 to acquire a $29 customer.** That's a ~$184
loss on every sale before the ~$10 domain cost. The "Gift" campaign's 3
"conversions" don't reconcile with GA ($0 revenue / 0 key events on /gift) —
they're likely landing-page-views or add-to-cart, not real gift purchases.
"Website Privacy Test" spent $179.70 for literally zero.

**Reconciliation:** Meta claims ~3 purchases; GA4 shows 3 key events and
**$14.97 total revenue** in 28 days. Best case you spent ~$1,142 to generate a
small handful of sales. **Paid Meta is burning ~$1,100/mo for roughly one to
three sales.**

**Current state: all campaigns are Off/Completed — nothing is actively
spending right now. Good. KEEP IT OFF.**

### REVISED bottom line (what's actually stopping sales)
1. **Paid Meta is the cash leak** — $213/purchase on a $29 product. It's off
   now; do NOT turn it back on until the economics change (lower price point
   can't support it; need either much cheaper CAC or a higher-LTV offer).
2. **The product genuinely has almost no organic demand engine yet.** Strip out
   paid + bot/direct and you have ~180 organic sessions/28d. That's the real
   top of funnel, and it's tiny. **The core problem isn't conversion — it's
   that almost no qualified humans are discovering the product.**
3. **The page converts fine for the few real visitors** (homepage drove the
   only revenue). Don't rebuild it.
4. **Real growth levers (all slow/cheap, none are paid Meta):** SEO/content
   (months), organic social consistency, the dormant **referral program (B13)**,
   gifting to warm audiences, and partnerships (hospitals, doulas, baby
   registries, parenting communities) where in-market parents already gather.
5. **Fix conversion tracking as a GA4 key event** so any future spend can be
   judged on real purchases, not vanity clicks.

### S-002 — Customer-domain apex 404s (Railway cap) 🟡
- ⚠️ **`kateragno.com` is DAN'S OWN site — NOT a customer. IGNORE it; do not
  flag its 404 (Dan directive 2026-06-08; matches CLAUDE.md "no unprompted
  kateragno.com diagnostics").**
- Real concern: confirm *paying-customer* custom domains serve 200 (apex+www).
  CLAUDE.md notes the Railway 20-domain cap can leave apex 404 on some domains.
- Impact: a prospect clicking a real customer link to a broken site = trust hit.
- **Fix:** finish Railway-slot cleanup / Approximated apex for live CUSTOMER
  domains. Engineering — already in TODO. (Skip Dan's personal domains.)

### S-003 — Branded signup checkout not cut over / unverified 🟡
- `/start/checkout` is LIVE (200 verified) but TODO B15 says the signup path
  is "built + server-validated, needs Dan's live test, THEN repoint signup
  CTAs." Landing CTAs may still open the older founder modal.
- Risk: two checkout code paths = one can silently break and you won't notice
  lost sales. Also TODO flags confirming the Stripe webhook has
  `payment_intent.succeeded` + `invoice.payment_succeeded` enabled — **if those
  webhooks aren't firing, a customer can pay and NOT get provisioned.**
- **Fix:** run the one live $29 test in TODO, confirm webhooks, cut CTAs over to
  the verified path, retire the other.

---

## TIER 2 — Depressing conversion rate

### S-004 — Weak trust signals (agent-reported, verify)
- Testimonials are initials + emoji avatars, no photos/full names/dates; no
  money-back guarantee; no "trusted by N families"; no press/badges.
- Parents spending on a keepsake for their child buy on *trust*. This is
  likely the highest-leverage on-page conversion fix.
- **Fix:** real testimonials (with permission), an explicit guarantee, a
  concrete social-proof number if true.

### S-005 — No final domain-spelling confirmation before non-refundable buy
- Domain registration is non-refundable; a misspelled `.com` = an angry $29
  customer + a refund/chargeback. Modal warns but doesn't hard-confirm.
- **Fix:** "You're buying www.[domain].com — this can't be undone. Confirm."

### S-006 — Renewal price clarity ($29 → $49.99)
- Hero leads with $29; the 72% renewal jump is small-print. Reads as
  bait-and-switch to careful buyers; can drive first-renewal cancellations.
- **Fix:** state both prices honestly up front; it builds trust and reduces
  refund/chargeback risk.

### S-007 — "Domain live in hours" uncertainty post-purchase
- Success page tells a paying customer DNS "can take a couple hours." Anxiety →
  refund requests.
- **Fix:** lead with the instant `name.legacyodyssey.com` subdomain as the
  immediate live URL; frame the custom domain as "going live shortly."

---

## TIER 3 — Polish / friction / hygiene

- **S-008** Three landing variants (v1, v2, v2-cro) with overlapping modal code
  = QA/A-B debt; stale code can ship a broken funnel. Consolidate to one.
- **S-009** Demo at `your-childs-name.com` uses realistic sample data on a
  public domain — fine as a demo, but watermark "SAMPLE" / confirm no real
  family names per hard rule #3.
- **S-010** Email-only support (no phone/chat) — adds friction for
  non-technical parents. Consider a chat widget.
- **S-011** No cancellation/refund FAQ — pre-purchase hesitation. Add one.
- **S-012** Mobile search button wraps < 380px (iPhone SE). Minor.
- **S-013** `TURNSTILE_SECRET_KEY` still not in Railway env → contact-form
  server-side bot defense inactive (honeypot only). Spam can bury real leads.

---

## What's actually WORKING (verified, don't worry about these)
- `legacyodyssey.com` + `www.legacyodyssey.com` both 200 (the old www-404 note
  is RESOLVED).
- `/start/checkout`, `/privacy` both 200; server v2.2.0 healthy.
- No email-verification wall before payment (good — low friction).
- Domain search does return alternatives when a name is taken.
- Cookie consent + privacy/terms live and linked.
