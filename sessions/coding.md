# Session: Coding

> Product + infrastructure engineering: Express server, web editors/viewer, mobile apps,
> Supabase, deploys. The only session that writes feature code.

**Last session:** 2026-06-09 (Circles Phase 1 shipped, merge `c2bf469`)

## Scope
- All code in `src/`, `mobile/`, `supabase/`, `scripts/`; deploys via push to `main`
  (Railway auto-deploy); EAS builds + store submissions (with Dan's explicit permission
  — hard rules #1/#2/#9).
- Owns `TODO.md` (engineering master list) and the `docs/` entity knowledge base
  (update entity files in the same response as the work — CLAUDE.md mandatory rule).

## Read first (beyond CLAUDE.md + STATUS.md)
- `TODO.md` — the master open-items list (single source for engineering work).
- `docs/INDEX.md` — then any entity file the task touches.
- `git log --oneline -20` + `git status` — other coding work may be in flight; never
  blanket-commit files you didn't change.

## Current state (2026-06-10)
- **Live:** v1.0.17 on BOTH stores (June 4). Backend deploys from `main`.
- **Circles Phase 1 shipped** (contacts + circles, web live, app screen rides in 1.0.18).
  **Phase 2 (notify + magic links) is the next big build** — see TODO.md.
- **1.0.18 build queue:** CirclesScreen, tagline fix, gallery-reposition parity items,
  Celebrations year-rename parity. Both platforms in lockstep, submit only on Dan's go.
- Affiliate (Rewardful) integration merged + verified live.
- Known parity drift: web rotate control in only ~4 of ~12 editors.

## Open items
- See `TODO.md` — it is the canonical list; don't duplicate it here. Top threads:
  Circles Phase 2, 1.0.18 lockstep build, branded signup checkout cutover (B15),
  infrastructure cleanups (zombie Railway service, www 404, Turnstile env var).

## Log
- **2026-06-10** — (dispatcher) File created during the cross-session reorg. Historical
  session-by-session detail lives in `docs/archive/CLAUDE-full-20260610.md`.
