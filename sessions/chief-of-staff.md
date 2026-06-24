# Session: Chief of Staff

> Business operations: formation/legal, filings, costs, vendors, hardware, calendar,
> decisions, and business-level analytics/diagnosis. Does NOT write feature code.

**Last session:** 2026-06-23 (deep analytics rundown + full 100-visitors growth plan)

## Scope
- Owns the entire `ops/` directory — the business source of truth.
- Money / legal / vendor / renewal / hardware / unit-economics questions route here.
- **Does NOT draft marketing/recruitment copy and does NOT redesign live program terms.**
  (Lesson 2026-06-10: this session drafted affiliate copy at flat-$15 while the affiliates
  session had 35%-recurring LIVE in Rewardful/ToS. Dan resolved D-010 on 2026-06-11:
  **35% recurring stands**; the flat-$15 copy is retired.) If a live program's economics
  look wrong, raise a DECISIONS.md entry + STATUS note for Dan — never produce competing
  artifacts in another session's lane.
- End-of-session ritual: update `ops/`, post a state-of-the-business snapshot + top-3
  actions (see `ops/BUSINESS-OPS.md` P3), update this file + a STATUS.md entry.

## Read first (beyond CLAUDE.md + STATUS.md)
- `ops/BUSINESS-OPS.md` — master view + 90-day plan + index of all ops/ files.
- `ops/SALES-BLOCKERS.md` — the "why nobody buys" diagnosis (S-001a–f). **Current marquee work.**
- `ops/DECISIONS.md` — open questions awaiting Dan (D-001 LLC paperwork is #1).
- `ops/CALENDAR.md` — anything due soon.

## Current state (2026-06-10)

### Marquee finding — why traffic doesn't convert (verified in GA4 + Meta Ads Manager)
- **The landing page is NOT the problem** (clear hero, CTA + $29 above fold; purchase
  pixel fires on success.ejs). **People leave in ~9 seconds — the traffic is the problem.**
- **Paid acquisition is deeply unprofitable and was the cash leak.** Meta last 30d
  (May 9–Jun 7): **$1,141.87 spent** → "New Parents" $639 / **$213.12 per purchase** on a
  $29 product; "Gift" $322.80 / 3 mid-funnel "conversions" (GA shows /gift = $0 revenue);
  "Privacy Test" $179.70 / 0 sales. GA4 total revenue 28d = **$14.97, 3 key events.**
- **Traffic mix (GA4 28d, ~1,856 sess):** ~49% PAID (bounces 6–8s, ~$0), 41% "Direct"
  (10s — bot/junk signature), only ~180 organic sess/28d (the real, engaged humans:
  Organic Search reads 78s, Referral/Organic-Shopping 36s, Organic Social 14s on 122 sess).
- **`/gift` is 25% of all traffic (471 sess), 6s, ZERO conversions** — almost certainly the
  (now-ended) Meta "Gift" campaign dumping cold clicks there.
- **Status now: ALL Meta campaigns Off/Completed — nothing actively spending. Keep it off.**

### Recommendation on file (in SALES-BLOCKERS.md)
1. Keep paid Meta + Google OFF until economics change ($29 product can't pay ~$200 CAC).
2. Fix GA4 conversion tracking (mark `purchase` as a key event) before any future spend.
3. Growth via distribution where in-market parents already are: partnerships
   (hospitals/doulas/registries/parenting communities), gifting, the **referral/affiliate
   program** (Rewardful — owned by the affiliates session), and SEO (slow, months).
4. Page/product convert fine for real visitors — don't rebuild them.

### Other standing state
- **Top business risk: LLC veil-protection paperwork** — EIN, signed operating agreement,
  separated business banking (DECISIONS D-001, still open). Formation state = AZ (Mesa), confirmed.
- Privacy Policy + ToS verified live (2026-06-04). No-refunds is hard rule #11.
- PROJECT-MAP Phase 0 done (Dispatcher, 2026-06-10). Phases 1–4 pending — Phase 1 (move
  `Legacy Odyssey Logins.docx` + `Project_Accounts.pdf` into `F:\_secrets\`) is the priority.

## Open items (next session — refreshed 2026-06-23)
- **🚀 GROWTH IS THE PRIORITY.** Plan is written (`ops/GROWTH-100-VISITORS-PLAN.md`). The 3
  start-today moves: (1) **Dan sends the affiliate Tier-A DM pack** — highest-ROI, $0, ready;
  (2) **coding ships the customer-site "start your own" badge** + **GA bot filter** (step 0) +
  publishes the 3 feature blog posts + share-optimizes `/demo`; (3) **content-organic starts the
  Reels→/demo cadence**. Then Pinterest click-through fix, SEO buyer-keywords. Next CoS session:
  chase whether these started + measure REAL (bot-filtered) visitors vs the ~6/day baseline.
- **D-009 — DONE** (revenue $287.95 net lifetime / $4.99 net last 30d; 7 payers). No action.
- **GA consent-mode fix — shipped, but GA still reads $0 conversions** → coding still needs the
  bot filter + verify purchase key-event actually registers. Routed to coding.
- **D-001 LLC paperwork — BLOCKED ON DAN.** Formation+EIN confirmed (AZ). Remaining: the 5
  operating-agreement blanks (draft ready in `ops/operating-agreement-DRAFT.md`) + Trade Name
  (DBA) yes/no. Offer to render the OA to a Word doc on his answers.
- Mine, unblocked: 90-day plan P1/P2 in `ops/BUSINESS-OPS.md` (Stripe Tax, insurance,
  trademark, bookkeeping). Keep paid Meta/Google OFF.
- Not mine: coding owns the new-customer entity files (arloboos/zoraporter/emmabeine + 4
  comps) + emmacherry/roypatrickthompson Stripe-sub verification.

## Log
- **2026-06-23 (PM, deeper)** — On Dan's two URGENT re-asks, deepened both deliverables.
  **Analytics:** added GA today (4) / 7d (67, ~10/day, 2s) / 28d (851); Clarity per-page
  heatmaps — homepage 7 views→1 click (on "Affiliates", not the CTA), ~57% leave before 40%
  scroll, only ~29% pass halfway; /gift has no real data (dead post-campaign). Clarity + GA
  consent fix both only ~8 days old → directional. Rewrote `ops/ANALYTICS-RUNDOWN-2026-06-23.md`
  as the full top-to-bottom report w/ 3 takeaways. **Plan:** rewrote `ops/GROWTH-100-VISITORS-PLAN.md`
  full version — $/visitor ranking (all ~$0 organic), per-channel concrete inputs, yields,
  30/60/90 ramp, time-to-results, exec summary. Honest baseline: ~6 real visitors/day → 100 is ~16×.
- **2026-06-23** — Dispatcher's 2 asks. Analytics rundown (GA4+Clarity+Stripe):
  traffic falling (851/28d), **~70% bots** (Clarity excluded 41/59 in 3d → ~6 real
  visitors/day), page fine (0 rage/dead clicks), last-30d net **$4.99**. Authored
  `ops/GROWTH-100-VISITORS-PLAN.md` ranked by $/visitor (affiliates #1, organic social #2,
  Pinterest click-fix #3, SEO #4) — paid excluded. Both in `ops/`; routed levers to the
  marketing sessions via STATUS. Earlier this session: routed the editor IA revamp + staging
  (D-012/13/14), resolved D-009 revenue, moved last secret file to `F:\_secrets\`, drafted
  the operating agreement + LLC checklist.
- **2026-06-16** — Traffic report + D-009 Stripe pull. GA4 (28d: 1,167 sess/11s/25% eng;
  7d: 177 sess/4s, paid OFF; home 79%, /gift 14%, all conversions $0 = tracking artifact per
  yesterday's GA fix + consent-timing caveat). **Stripe $ BLOCKED** (dashboard blocked, Railway
  token 403, no local key, CLI not logged in) — but reconciled CUSTOMERS via Supabase
  service-role: **7 real paying = 6 annual + 1 monthly** (matches Dan exactly); DB's 16 "paid"
  rows = +owner +2 demos +4 influencer comps +2 early no-stripe-sub. Real conversion ≈0.2–0.3%
  (sells, just tiny). Wrote `ops/TRAFFIC-AND-REVENUE-2026-06-16.md`; updated DECISIONS D-009 +
  docs/INDEX.md customer section. Removed `.tmp` pull scripts. Late: absorbed coding's shutdown
  note → recorded sales-path VERIFIED-WORKING in SALES-BLOCKERS (checkout reaches Stripe; not a
  checkout problem) + R2 backups healthy (273==273) in PROJECT-MAP Phase 4.
- **2026-06-10** — Sales-funnel deep-dive at Dan's request ("getting traffic but nobody
  buys"). Pulled GA4 (traffic-acquisition + landing-page reports via Chrome) and Meta Ads
  Manager. Found paid acquisition was the leak ($213/purchase; /gift 25% of traffic at 0
  conversions; ~$1,142/30d for ~1–3 sales). Wrote it all into `ops/SALES-BLOCKERS.md`
  (S-001a–f). Gave Dan affiliate recruitment copy (cross-over; affiliate workstream owned
  by sessions/affiliates.md). Adopted the new sessions/+STATUS protocol; rewrote this file.
- **2026-06-08** — Built the `ops/` suite (BUSINESS-OPS, FILINGS, SUBSCRIPTIONS, HARDWARE,
  DECISIONS, CALENDAR, SALES-BLOCKERS, PROJECT-MAP). Verified Privacy/ToS live.
- **2026-06-10** — (dispatcher) File created during the cross-session reorg.

---

## Standing morning routine (trigger: Dan opens with just "good morning" or no specific task)
1. Re-read CLAUDE.md, this brief, and the top of STATUS.md - start with the latest dispatcher NIGHTLY CLOSE / agenda entry.
2. Cross-check the board against your planned first task: if another session's entry conflicts with it, blocks it, gates it on a Dan decision, or already did it, surface that instead of proceeding.
3. Reply with: (a) your first task and why it's first, (b) what you're blocked on, (c) anything on the board that affects you. Then WAIT for Dan's go before starting any work.

## Standing shutdown routine (trigger: Dan says "goodnight", "end of session", "wrap up", or similar)
1. Update this brief: bump "Last session" to today, add a log bullet for today's work, rewrite Open items so the next session knows exactly what's next (mark anything waiting on Dan as "Blocked on Dan").
2. Update your detail file(s) (marketing/<platform>/<platform>.md, TODO.md, ops/, docs/ - whatever you touched) with anything from today's conversation not yet written down.
3. Add ONE entry to the top of STATUS.md in the documented format (Did / Others should know / Blocked on Dan).
4. If you have uncommitted changes that are complete work, commit ONLY your own files with a clear message. Never commit other sessions' files. Never push a deploy unless Dan agreed to it this session.
5. End with a 3-line goodnight summary for Dan to carry to the Dispatcher: what shipped today / what's first tomorrow / what you need from Dan.
6. Do not start anything new after the trigger.
