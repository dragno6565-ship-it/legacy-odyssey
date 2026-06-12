# Decisions Log + Open Questions

> Decisions made (with date, rationale, and who made them) and the open
> questions awaiting Dan. New entries at the top. Other sessions: if you
> change a vendor, plan, or compliance posture, add a row here so it's not
> lost when context compacts.

Last updated: 2026-06-04

---

## ❓ Open questions for Dan (in priority order)

### D-001 — LLC formation: confirm EIN, op agreement, banking separation
- **Partial update 2026-06-04:** Formation state is **AZ (Mesa)** — confirmed
  from the live Privacy Policy. Still open:
  1. ~~Formation state~~ → AZ (confirmed)
  2. EIN (or "no, I never got one")
  3. Operating Agreement (or "no, never drafted one")
  4. Registered agent on file (or "I am, at my home address")
  5. Whether business banking is separate from personal
- **Why it still matters:** without EIN + op agreement + separated banking,
  the AZ LLC may not shield Dan personally.
- **Owner:** Dan. ~20 minutes to dig out / confirm.

### D-011 — Add ClickBank as a second affiliate channel? (affiliates session recommends REJECT)
- **Question:** Should we onboard Legacy Odyssey as a ClickBank vendor in
  addition to (or instead of extending) the live Rewardful program?
- **Affiliates session recommendation (2026-06-11): REJECT.** Three
  structural conflicts make ClickBank incompatible with the product as it
  exists today:
  1. ClickBank is **merchant of record** — collects payment, settles to us
     later. Our Spaceship .com domain registration fires at the moment of
     payment. The flows can't reconcile without breaking the "your baby
     gets a .com at signup" pitch.
  2. ClickBank's **minimum refund window is 30 days** (default 60).
     Conflicts with CLAUDE.md hard rule #11 (NO REFUNDS — ever) and creates
     a domain-cost write-off on every refunded sale (~$11 each).
  3. The ClickBank Parenting category is **tiny and brand-toxic** — top
     gravity ~17, bestsellers are "Pregnancy Miracle" / "Baby Sleep Miracle"
     / child surveillance software / marriage-rescue ebooks. Wrong shelf
     for a sentimental baby-book product, wrong affiliate cohort
     (info-product / nutra / biz-opp marketers, not parenting creators).
- **Economics:** Per-sale net to LO is within a penny of Rewardful at the
  same 35% commission ($16.79 vs. $16.80 on a $29 first-year sale before
  domain costs). ClickBank does NOT beat Rewardful on margin.
- **What ClickBank would add over Rewardful + our 232 verified targets:**
  nothing useful. Their marketplace value-prop is info-product affiliates;
  we don't sell info-products and don't want that audience near a
  children's-photos product.
- **Full evaluation:** `affiliate-assets/clickbank-evaluation.md`.
- **What would change the answer:** ClickBank introducing a non-MoR mode
  (they don't offer one today) OR LO launching a downloadable info-product
  variant where the domain-purchase flow doesn't apply. Both hypothetical.
- **What I need from Dan:** "agreed, REJECT" or "I want to revisit."

### D-009 — Verify REAL Stripe sales count (HIGH — underpins all funnel work)
- **Why:** GA4 shows only **$14.97 revenue / 3 key events** over 28 days, while
  Meta claimed ~3 purchases. We don't know the TRUE number of paying customers
  or the true conversion rate. Everything in SALES-BLOCKERS rests on this.
- **Action:** pull lifetime + last-30d real sales from Stripe (and reconcile vs
  the ~9 customers in docs/INDEX.md). Chief-of-staff can do this on Dan's go.
- **Owner:** Dan to greenlight; Claude executes.

### D-010 — Affiliate commission: ✅ RESOLVED 2026-06-11
- **Dan's decision (2026-06-11, via Dispatcher): 35% recurring stands.** The
  live Rewardful program ("Friends of Legacy Odyssey", 35% recurring, 90-day
  cookie, 60-day hold) is the single offer for ALL affiliates. The flat-$15
  recommendation is declined; any recruitment copy with a `[$X]` placeholder
  must be rewritten to the 35%-recurring framing before use.
- **Dan personally handles creator outreach** (the 19 Tier-A DMs and beyond) —
  sessions prepare copy, lists, and tracking; Dan sends.

### D-002 — Privacy Policy / ToS: ✅ RESOLVED 2026-06-04
- **Outcome:** Both live and substantive. /privacy (May 25 2026, 167 lines)
  and /terms (Mar 21 2026, 120 lines). Cookie banner active with EU/UK
  gating. G1–G6 + G8 all materially closed. See FILINGS.md §4 for the
  verified table and the 9 follow-up gaps (C-001 through C-009) that
  surfaced during the audit. Not nearly as urgent as I initially flagged.

### D-003 — Marketing spend: is Meta still on?
- **Why it's open:** Memory says "Active campaign $50/day as of May 6 2026."
  That's $1,500/mo. If it's still on, it's by far the largest controllable
  expense and we should see the SUBSCRIPTIONS file reflect it.
- **What I need from Dan:** current daily spend + which ads are live.

### D-004 — Apple Developer Program renewal date
- **Why it's open:** $99/yr; if it lapses, apps get pulled.
- **What I need from Dan:** the renewal date from `developer.apple.com` —
  add to CALENDAR.md.

### D-005 — Insurance: ready to bind?
- **Why it's open:** Recommended P0 in FILINGS.md. Quote takes 15 min via
  Vouch / Embroker. ~$50–150/mo.
- **What I need from Dan:** "yes get quotes" or "wait."

### D-006 — Trademark filing
- **Why it's open:** ~$500. Worth doing before ad spend scales. Once a
  copycat appears, more expensive to enforce.
- **What I need from Dan:** "yes file" or "wait."

### D-007 — Bookkeeping system choice
- **Wave (free) vs QuickBooks Online Simple Start ($30/mo)?** Wave is fine
  for solo single-member LLCs; QBO has stronger sales-tax integration if
  Stripe Tax doesn't fully cover us.
- **What I need from Dan:** preference.

### D-008 — Test-device buys
- **iPhone + Pixel for testing** (~$750 combined).
- **What I need from Dan:** approve and I'll write up exact SKUs to buy.

---

## ✅ Decisions made

### 2026-06-04 — Chief-of-Staff session stood up
- Created `F:\legacy-odyssey\ops\` as the business source of truth.
- Authored BUSINESS-OPS, FILINGS, SUBSCRIPTIONS, HARDWARE, DECISIONS,
  CALENDAR as v1 drafts.
- All marked "VERIFY" where actual values weren't known to this session.
- **Who:** this session, on Dan's mandate.

(Older business decisions from prior sessions live in CLAUDE.md and
docs/INDEX.md — pull them in here only if they're business-side and
likely to be questioned later.)
