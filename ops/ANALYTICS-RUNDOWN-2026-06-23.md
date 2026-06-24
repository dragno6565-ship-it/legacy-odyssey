# Complete Site Analytics Rundown — 2026-06-23

> Live pull from GA4 (property 531219463) + Microsoft Clarity (x7mt9cszyp) + Stripe (live, read-only).
> Chief-of-staff. Feeds `ops/GROWTH-100-VISITORS-PLAN.md`.

## ⚠️ Data freshness (read first)
- **GA consent-mode fix shipped ~2026-06-15** → only ~8 days of "corrected" conversion data.
  BUT GA still reports **0 key events / $0 across every window** — so GA conversion tracking is
  STILL not registering purchases. **Use Stripe as the source of truth for sales, not GA.**
- **Clarity was installed ~2026-06-15** → even when "Last 30 days" is selected, it holds only
  ~8 days of real data. Per-page samples are small (directional, not precise).

---

## 🔑 The 3 biggest takeaways
1. **~70% of your "traffic" is bots, and real traffic is tiny and shrinking.** Clarity excluded
   41 bot sessions vs 18 real in 3 days. Real humans ≈ **6/day**. Raw GA is also falling:
   28d 851 → 7d 67 (~10/day) → today 4. You are effectively starting near zero on qualified traffic.
2. **The page is fine — it's a volume + intent problem, not a design problem.** Clarity shows
   **0% rage clicks, 0% dead clicks.** On the homepage, real visitors generated 7 views and just
   **1 click** (on "Affiliates," not the domain-search CTA), and **~57% leave before 40% scroll** —
   most never reach pricing/how-it-works. Don't rebuild the page; feed it qualified visitors.
3. **Revenue is stalled.** **$4.99 net in the last 30 days, no new sale since Jun 14, ~0% conversion
   this month.** Lifetime net $287.95 from 7 paying customers. At ~6 real visitors/day there simply
   aren't enough qualified people arriving to produce sales — which is exactly why the 100-visitors
   plan is the priority.

---

## 1. GA4 — sessions over time
| Window | Sessions | Engagement rate | Avg engagement time | Conversions |
|---|---|---|---|---|
| **Today** (Jun 23, partial) | 4 | 0% | 1s | 0 |
| **Last 7 days** (Jun 16–22) | 67 (~10/day) | 23.9% | **2s** | 0 |
| **Last 28 days** (May 26–Jun 22) | 851 (~30/day) | 25.6% | 10s | 0 |
- Trend across recent 28-day pulls: **1,856 → 1,167 → 851** — declining as paid winds down.
- Engagement time is collapsing in the recent window (2s/7d) — consistent with mostly-bot traffic.

## 2. GA4 — channels (last 28 days)
| Channel | Sessions | % | Avg time | Read |
|---|---|---|---|---|
| Direct | 513 | **60%** | 8s | bot/junk-inflated (Clarity confirms) |
| Organic Social | 129 | 15% | 13s | **growing + engaged (40%)** — best organic |
| Paid Search | 83 | 10% | 5s | residual, winding down |
| Paid Social | 60 | 7% | 14s | residual |
| Referral | 26 | 3% | **34s** | **highest-quality (58% eng)** |
| Organic Search | 14 | 1.6% | 16s | high-intent, tiny |
| Organic Shopping | 6 | 0.7% | **1m05s** | very engaged, tiny |

7-day channel shift: Direct 45 (67%), **Organic Social 18 (27%, 50% engagement)** — organic
social is now carrying the real traffic; paid nearly gone (2 sessions).

## 3. GA4 — top landing pages (last 28 days)
| Page | Sessions | % | Avg time |
|---|---|---|---|
| `/` (home) | 716 | **84%** | 8s |
| `/gift` | 65 | 7.6% | 4s |
| `/redeem` | 9 | 1% | 26s |
| `/account` · `/blog` · book pages | <1% each | | `/blog` ≈5/28d — SEO not yet an acquisition channel |

## 4. GA4 — conversions / bounce
- **0 key events, $0, 0% across all windows.** Consent fix is live but GA still isn't recording
  purchases → not trustworthy yet. (Bounce ≈ inverse of the 25% engagement rate → ~75% non-engaged.)

## 5. Microsoft Clarity — behavior
**Overall (last 3 days):** 18 real sessions, **41 bot sessions excluded (~70% bots)**, 13 unique
users, 78% new. 1.22 pages/session · 49.6% avg scroll · **8s active time** · quick-backs 5.56%.
**Insights: 0% rage clicks · 0% dead clicks · 0% excessive scrolling** → page is not frustrating anyone.

**Homepage `/` (≈8 real days):** 21 visits.
- **Click map:** 7 page views → **1 total click**, and it was on the "Affiliates" link — the hero
  "Check the Name" domain-search CTA got essentially **zero** clicks.
- **Scroll map:** 100% see the top; ~57% reach only 10–40%; **only ~29% scroll past the halfway
  point** (where pricing / how-it-works / the demo link live). Steep early drop-off — the hero is
  the entire experience for most real visitors.

**`/gift`:** **no behavioral data** in the window (too few real visits) — confirms /gift went quiet
after the gift ad campaign ended.

## 6. Stripe — revenue + conversion (live, read-only)
- **Lifetime: $503.87 gross / $215.92 refunded / $287.95 NET** (24 charges; first Mar 29, latest Jun 14).
- **Last 30 days: $38.98 gross / $4.99 NET** (3 charges) — one monthly renewal; **no new sale since Jun 14**.
- **Subscriptions: 9 active · 8 trialing (gifts/comps) · 8 canceled · 4 incomplete.**
- **7 real external paying customers** (6 annual + 1 monthly).
- **Real conversion rate:** ~0.2–0.3% historically; **effectively ~0% in the last 28 days** (no new
  paying customer). Not enough qualified traffic arriving to convert.

---

## What this means (plain English)
The funnel mechanics work and the page is clean — but it's being starved. After stripping bots,
only ~6 real, mostly-low-intent people reach the site per day, over half bounce above the fold, and
almost none click the primary CTA. Paid is correctly off (it lost money). With real traffic this thin,
sales have stalled to ~$5/month. **Everything now hinges on cheaply driving qualified, in-market
visitors** — see `ops/GROWTH-100-VISITORS-PLAN.md` (affiliate/referral activation is the #1, $0-upfront,
highest-quality lever and is ready to fire on your send).
