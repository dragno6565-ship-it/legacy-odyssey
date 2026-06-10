# Session: Affiliates (Rewardful)

> The "Friends of Legacy Odyssey" affiliate program — recruitment, assets, Rewardful
> admin. 35% recurring commission. Code integration is DONE and live.

**Last session:** 2026-06-10

## Scope
- Owns `affiliate-assets/` (swipe copy, banners, target lists) and the program itself.
- Code changes to tracking/attribution route to the CODING session.

## Read first (beyond CLAUDE.md + STATUS.md)
- `docs/infrastructure/rewardful.md` — source of truth for the program.
- `TODO.md` §Affiliate — current state + open items.
- `affiliate-assets/verified-affiliate-targets.md` + `verified-ig-500.md` — recruitment lists.

## Current state (2026-06-10)
- Integration MERGED + DEPLOYED + verified end-to-end (merge `6e6cbd6`). `?via=` tracking
  confirmed working. `/affiliates` landing page live. **Recruitment is unblocked.**
- Gift/signup conversion attribution (Option B) shipped (`23518d1`).
- NOT yet attributed: branded Payment-Intent signup flow + gift checkouts (PaymentIntents,
  not Checkout Sessions) — coding-session work if needed.

## Open items
- [ ] Upload asset pack to the Rewardful Asset Library (needs the UI; export SVG→PNG if required).
- [ ] Dan: add `REWARDFUL_API_SECRET` to Railway env (only needed for future webhook/API void).
- [ ] Begin recruitment from the verified target lists.

## Log
- **2026-06-10** — (dispatcher) File created during the cross-session reorg.
