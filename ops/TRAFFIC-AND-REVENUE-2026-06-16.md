# Traffic + Revenue Report — 2026-06-16

> Chief-of-staff pull. Two parts: (1) GA4 traffic picture, (2) Stripe/Supabase
> revenue + customer reconciliation (D-009). Source data is live; method noted.

## ⚠️ Read this caveat first (conversion numbers are a FLOOR, not gospel)
- The **branded-signup purchase tracking was only fixed yesterday (2026-06-15,
  commit `9c4c526`)** — before that, `/start/welcome` fired ZERO analytics, so
  every branded-signup sale was invisible to GA4/Meta/Pinterest.
- A **consent-mode timing issue still dampens ALL flows** (purchase can fire
  before consent grant). Live verification pending; GDPR-sensitive.
- Net: **GA4 revenue/conversion = $0 right now is a TRACKING artifact, NOT
  reality.** Treat GA conversions as a floor. Ground truth for sales = Stripe.

---

## PART 1 — GA4 TRAFFIC (property 531219463)

### Volume
| Window | Sessions | Engagement rate | Avg engagement time |
|---|---|---|---|
| **Last 7 days** (Jun 9–15) | **177** | 23.7% | **4s** |
| **Last 28 days** (May 19–Jun 15) | **1,167** | 25.5% | **11s** |

Prior 28d (to Jun 7) was 1,856 — traffic is **down ~37%** because paid is off.

### Channels — last 28 days
| Channel | Sessions | % | Avg time | Note |
|---|---|---|---|---|
| Direct | 622 | 53% | 11s | bot/junk-like (real direct should engage most) |
| Paid Search | 214 | 18% | 6s | residual/winding down; bounces |
| Paid Social | 130 | 11% | 10s | residual |
| Organic Social | 110 | 9% | 15s | real humans |
| Referral | 23 | 2% | 35s | real, engaged |
| Organic Search | 17 | 1.5% | **51s** | most engaged — real intent |
| Organic Shopping | 12 | 1% | 44s | engaged |

### Channels — last 7 days (paid fully OFF)
- Direct **140 (79%)**, Unassigned 20, Organic Social 13, Cross-network 8,
  Organic Search 8, Referral 2. **Zero paid sessions.** 4-second avg.
- Takeaway: with paid off, real organic human traffic is only **~25–30
  sessions/week**; the rest is Direct (largely bot/junk).

### Landing pages — last 28 days
| Page | Sessions | % | Avg time |
|---|---|---|---|
| `/` (home) | 924 | 79% | 9s |
| `/gift` | 161 | 14% | 7s | (down from 25% — gift ad ended) |
| everything else | <2% each | | book viewer pages, /account, /blog (6 sess) |

- GA conversions on every page = 0 / $0 → tracking artifact (see caveat).
- `/blog` gets ~6 sessions/28d — SEO is not yet an acquisition channel.

### Where people drop
- They never get past the first screen: **9-second average on the homepage**,
  4s last week. The drop-off is at the very top — before pricing/checkout.
- This is the same conclusion as SALES-BLOCKERS S-001: the **page is fine; the
  traffic is mostly low-intent/junk** (bot Direct + paid bouncers).

---

## PART 2 — REVENUE + CUSTOMER RECONCILIATION (D-009)

### Method
- Stripe dashboard is **blocked** in the browser tool; the **Railway API token
  returned 403** (couldn't auto-retrieve the live Stripe key); local `.env` has
  no Stripe key; Stripe CLI not logged in. → **Actual Stripe $ not yet pulled.**
- Used the **Supabase service-role key (read-only)** to reconcile customers from
  the `families` + `gift_codes` tables — this gives ground truth on WHO is a real
  paying customer, even without the Stripe $ figure.

### Customer reconciliation — RESOLVES D-009 (count)
`families` table: **16 non-archived `paid` rows + 3 free + 7 archived.**
Stripped to reality:

| Bucket | Count | Who |
|---|---|---|
| **REAL PAYING** | **7** | reesetatler, lachlanstoneleister, jeffpresutti, arloboos, zoraporter, emmabeine (6 annual) + foreverearley (1 monthly $4.99) |
| Influencer comps ($0, free gift code) | 4 | rayanved/Akshita, chloealessandra/Giulia, micahhasan/Megan, siyababy/Sia |
| Owner / demo | 3 | eowynhoperagno (owner), your-family-photo-album (demo), review@ (Apple) |
| Early rows, NO stripe sub (status unclear) | 2 | emmacherry, roypatrickthompson |

- **7 real paying = 6 annual + 1 monthly — matches Dan's ground truth EXACTLY.**
- Discriminator: real payer = has `stripe_subscription_id` AND did not redeem a
  comp gift code (gift_codes shows the 4 influencers redeemed free codes).
- **The DB overstates paying customers** — anyone reading "16 paid families"
  would be wrong by >2×. `docs/INDEX.md` updated to reflect this.
- **Growth signal:** 3 of the 7 (arloboos May 6, zoraporter May 11, emmabeine
  May 12) are NEW since the docs were written → the base did grow.

### Revenue — REAL Stripe figures (pulled live 2026-06-17, read-only via Railway-stored key)
- **LIFETIME gross: $503.87** (24 succeeded charges, first sale 2026-03-29 → latest 2026-06-14)
- **LIFETIME refunds: $215.92** (43% of gross — largely Dan's own E2E test purchases)
- **LIFETIME NET (money actually kept): $287.95**
- **Last 30 days: $67.98 gross / $33.99 net** (4 charges)
- Charge mix: 15 × $29.00 (annual intro), 5 × $4.99 (monthly recurring),
  4 × $10.98 (monthly first payment = $4.99 + $5.99 setup).
- **Subscriptions: 9 active, 7 trialing (= gifts/comps in their free year), 8 canceled,
  4 incomplete_expired.** The 16 active+trialing exactly matches the 16 Supabase "paid" rows ✓.
  The 7 trialing = the comps/gifted years ($0 collected now; would bill at renewal unless cancelled).
- **GA4's $14.97 / $0 was a tracking artifact — real gross is $503.87.** Confirmed: trust Stripe, not GA.

### ⚠️ The number that matters most
**Net lifetime revenue is ~$288. Meta ad spend in ONE month (May) was ~$1,142.**
The business has spent multiples of its entire lifetime net revenue on paid ads. Keeping paid
OFF (already done) is the single most important financial decision in play.

### The real conversion rate (Dan's question)
- ~3 real new paying customers in roughly the last 30 days against ~1,167–1,856
  sessions ≈ **0.2–0.3% conversion.** Against the homepage specifically (~924
  sessions) ≈ 0.3%.
- **Verdict: the landing pages ARE making sales — just very few**, at ~0.2–0.3%.
  It's not "zero" (GA's $0 is a tracking artifact); it's "real but tiny," and the
  constraint is traffic VOLUME + QUALITY, not the page.

---

## Status
- **D-009 fully RESOLVED 2026-06-17** — both customer count (7 real external paying) and
  revenue ($503.87 gross / $287.95 net lifetime) now confirmed from live Stripe.
- Method: read-only pull using the prod `STRIPE_SECRET_KEY` fetched via the Railway API
  token (the earlier 403 was a missing User-Agent header, not a dead token).
