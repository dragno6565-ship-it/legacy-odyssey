# Legacy Odyssey — Business Ops (master)

> **Single source of truth for the BUSINESS side of Legacy Odyssey.**
> Code/infra context lives in `CLAUDE.md` + `docs/`. This directory (`ops/`) covers
> formation, filings, compliance, costs, hardware, decisions, and the calendar.
> Other Claude sessions: consult `ops/` before answering money / legal / vendor /
> renewal questions. Update IN THE SAME RESPONSE you change anything.
>
> Maintained by the Chief-of-Staff session. Started 2026-06-04.

---

## What you should read in here

| File | Purpose |
|---|---|
| [BUSINESS-OPS.md](BUSINESS-OPS.md) | This file. 90-day plan + index. |
| [FILINGS.md](FILINGS.md) | Legal entity, registrations, EIN, sales tax, trademark, compliance (Privacy/ToS/COPPA/GDPR/CCPA/DPAs), insurance. |
| [SUBSCRIPTIONS.md](SUBSCRIPTIONS.md) | Every recurring cost. Monthly burn. Keep/cancel/right-size flags. |
| [HARDWARE.md](HARDWARE.md) | Prioritized hardware purchase list w/ price + ROI. |
| [DECISIONS.md](DECISIONS.md) | Decisions made + open questions awaiting Dan. |
| [CALENDAR.md](CALENDAR.md) | Dated obligations: tax, annual reports, vendor renewals, Apple Dev. |
| [SALES-BLOCKERS.md](SALES-BLOCKERS.md) | What's stopping/depressing sales — tiered by revenue impact. |
| [PROJECT-MAP.md](PROJECT-MAP.md) | Drive inventory (E: + F:) + the cleanup/organization plan. |
| [TRAFFIC-AND-REVENUE-2026-06-16.md](TRAFFIC-AND-REVENUE-2026-06-16.md) | GA4 traffic snapshot + Stripe revenue ($287.95 net lifetime) + customer reconciliation. |
| [LLC-CHECKLIST.md](LLC-CHECKLIST.md) | D-001 do-this checklist for Dan: EIN, operating agreement, business banking. |
| [ANALYTICS-RUNDOWN-2026-06-23.md](ANALYTICS-RUNDOWN-2026-06-23.md) | GA4 + Clarity + Stripe snapshot. ~70% bot traffic; real floor ≈6 visitors/day. |
| [GROWTH-100-VISITORS-PLAN.md](GROWTH-100-VISITORS-PLAN.md) | $/visitor-ranked plan to reach 100 real visitors/day (organic; paid excluded). |
| [APP-STORE-ASO-PLAN.md](APP-STORE-ASO-PLAN.md) | Paste-ready iOS/Android listing rewrite (keywords, copy, screenshots, reviews play). |

---

## The Business — at a glance

- **Trading entity:** "DOR Industries, LLC" — listed on Apple Team `Y3J2B5YA4N`
  and the Google Play developer account. **State of formation, registered
  agent, EIN, operating agreement status = VERIFY** (no record in repo/memory).
- **Product:** Legacy Odyssey — subscription SaaS digital baby book at a per-
  customer .com (canonical product description in CLAUDE.md). Live since
  2026-03-29.
- **Customers (paying):** 9 (incl. owner's dogfood family + Apple review demo);
  ~7 real external. Live mode Stripe charges in flow.
- **Stack owner / sole operator:** Dan (solo founder).
- **Sensitive data we hold:** parent PII, payment metadata (Stripe-tokenized),
  **photos of children**, names of children, family stories, viewing
  passwords (plaintext at rest — see TODO.md security follow-ups).
- **Jurisdiction:** VERIFY. Owner is US-based; LLC state unknown to this session.

---

## 90-day plan (priorities, in order)

**P0 — Stop the bleeding (this week → next 2 weeks):**
1. **Confirm legal entity is actually formed and in good standing.** Pull
   articles, EIN letter, operating agreement, registered-agent invoice. If
   any is missing → form properly. Without this, the "LLC" on the app stores
   is not protecting Dan personally.
2. **Stand up Privacy Policy + Terms of Service** that match the live product
   and link them from marketing site + signup + apps. Verify G1–G6/G8 status
   (see FILINGS.md). This is the single largest exposure (live SaaS +
   children's photos + real money + no documented policy).
3. **Separate business banking** (if not already): dedicated checking + card
   for all Legacy Odyssey expenses. Prevents veil-piercing if commingled.
4. **Buy the test-device pair** (one iPhone + one Android). CLAUDE.md repeatedly
   notes "NOT device-tested before submit" on every recent release; the
   business risk is shipping a broken app to paying customers.

**P1 — Right-size + close known waste (weeks 2–4):**
5. Cancel Cloudflare for SaaS add-on (per TODO; no longer used).
6. Delete zombie Railway service + free stale custom-domain slots (engineering
   work, but trims a real customer-facing risk and may avoid a plan bump).
7. Audit every recurring vendor → SUBSCRIPTIONS.md → cancel/right-size.

**P2 — Compliance & longevity (weeks 4–12):**
8. **Sales tax / Stripe Tax**: confirm economic nexus posture as revenue grows.
9. **Trademark "Legacy Odyssey"** (USPTO TEAS Plus) — protects brand before
   ad spend scales.
10. **Insurance**: bind General Liability + Tech E&O + Cyber. Children's-data
    product without cyber liability is a category-killer if breached.
11. **Bookkeeping**: connect a QuickBooks/Wave to the business bank +
    Stripe; minimum-viable monthly close for tax-time sanity.

**P3 — Cadence (continuous):**
12. **Weekly business review** (proposed: Mondays, 30 min). What changed
    in customers / revenue / spend / open filings; what files in `ops/` need
    updating; what's the top open decision.
13. End-of-session ritual: every Chief-of-Staff session ends by updating
    `ops/` + posting a "state of the business" snapshot + top-3 actions.

---

## Cross-session protocol

Anything that touches MONEY, LEGAL, VENDOR PLANS, or HARDWARE — that session
should:
1. Read the relevant file in `ops/`.
2. Make the change.
3. Update the `ops/` file in the same response, with date + one-line history bullet.
4. If it's a decision, also log it in `DECISIONS.md`.

Engineering work continues to live in CLAUDE.md / docs/ / TODO.md. The
Chief-of-Staff session does NOT write feature code.

---

## State of the business (snapshot — 2026-06-04)

- **Revenue:** live; exact MRR/ARR not yet tracked in `ops/`. TODO: pull Stripe
  numbers into a weekly snapshot.
- **Top tactical risk right now:** ~~Privacy / ToS undocumented~~ — verified
  2026-06-04 against live code; both are LIVE and substantive (G1–G6 + G8
  materially closed). Revised top risk: **LLC veil-protection paperwork**
  (EIN + signed Operating Agreement + separated business banking) — without
  these, the "DOR Industries, LLC" label on the app stores doesn't actually
  shield Dan personally. See [DECISIONS.md](DECISIONS.md) D-001.
- **Top operational risk:** every recent app release shipped without device
  test. See [HARDWARE.md](HARDWARE.md) §1.
- **Top dollar-waste risk:** Cloudflare for SaaS add-on still billing
  (~$7/mo by CLAUDE.md), zombie Railway service, possible Spaceship hosting
  duplication. See [SUBSCRIPTIONS.md](SUBSCRIPTIONS.md).
- **Top open decision for Dan:** confirm/produce LLC formation docs +
  EIN — see [DECISIONS.md](DECISIONS.md) D-001.
