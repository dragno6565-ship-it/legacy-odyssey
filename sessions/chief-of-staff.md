# Session: Chief of Staff

> Business operations: formation/legal, filings, costs, vendors, hardware, calendar,
> decisions, and business-level analytics/diagnosis. Does NOT write feature code.

**Last session:** 2026-06-10 (sales-funnel analytics deep-dive + protocol adoption)

## Scope
- Owns the entire `ops/` directory — the business source of truth.
- Money / legal / vendor / renewal / hardware / unit-economics questions route here.
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

## Open items
- See `ops/DECISIONS.md` (D-001…D-008) + the 90-day plan in `ops/BUSINESS-OPS.md`.
  Headlines: confirm LLC paperwork; verify real Stripe sales count vs GA; keep paid off;
  fix GA4 purchase key-event; secrets out of repo (Phase 1).

## Log
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
