# Session: Coding

> Product + infrastructure engineering: Express server, web editors/viewer, mobile apps,
> Supabase, deploys. The only session that writes feature code.

**Last session:** 2026-06-10 (evening: Circles Phase 2 shipped + E2E tested live; Fraunces/Inter font swap across all 29 account/editor pages; Circles entry moved to My Account; family editor clean slate + no emojis; numbered Chapter/Section labels removed from public book; Save Page bar on gallery editors; decimal weight/length fix)

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
- **Live:** v1.0.17 on BOTH stores (June 4). Backend auto-deploys from `main`.
- **Affiliate (Rewardful) — fully integrated + verified live.** JS snippet on all 28
  marketing pages; referral → `client_reference_id` on the 4 Checkout-Session endpoints
  (verified end-to-end with a real test affiliate). **Gift + branded-signup PaymentIntent
  flows NOW ALSO attributed (Option B):** referral captured in Stripe metadata
  (`rewardful_referral`) → `rewardfulService.recordConversion()` (POST /v1/conversions)
  fired from the webhook. ⚠️ That last hop is UNVERIFIED until `REWARDFUL_API_SECRET` is
  confirmed applied in Railway + a real referred gift purchase. **(Corrects the
  affiliates-session note that gift/signup flows are "still not attributed" — they are now.)**
- **No-refunds policy** surfaced everywhere: every checkout fine print, `terms.ejs` §4,
  affiliate FAQ. (CLAUDE.md rule #11.) `/affiliates` page price ($29) removed per Dan.
- **Gift admin (live):** void an unredeemed code (redeem now rejects `status='voided'`);
  editable **Admin notes** column (`gift_codes.admin_notes` applied 2026-06-10); comp-gift
  confirmation now goes to `legacyodysseyapp@gmail.com`, not the admin's login email.
- **Circles Phase 1 + 2 BOTH shipped and live.** Phase 1 (contacts/circles CRUD) and
  Phase 2 (Notify emails + magic links): `contactService.notifyCircle` (10-min/book
  cooldown, dedupe, audit), `?circle=<token>` passwordless book access in
  requireBookPassword (archive = revoke), `/circle/unsubscribe/:token`, web
  "Send an Update" card, app API `POST /api/contacts/mine/notify`. E2E-tested on prod
  2026-06-10 (email sent, curl-verified bypass, unsubscribe, cooldown). Circles entry
  now on **My Account** (not the book hub). Dan still wants a personal test pass; app
  Notify UI ships in 1.0.18.
- **Account/editor restyle (Dan-approved font #1):** Cormorant→Fraunces, Jost→Inter,
  muted #8a7e6b→#6b5d47 across all 29 `account*.ejs` views. Temp /font/1-4 preview
  pages torn down.
- **1.0.18 build queue:** CirclesScreen (+ Notify UI), "child's story" tagline fix,
  gallery-reposition parity, Celebrations year-rename, chapter-label removal, family
  clean-slate parity, decimal inputs, Video Moments nav grouping — full checklist in
  TODO.md "App parity" block. Both platforms lockstep; submit only on Dan's go.
  Dan's hard gate: Circles tested by him on web BEFORE the app build.
- Known parity drift: web rotate control in only ~4 of ~12 editors.

## Open items
- See `TODO.md` (canonical). Top threads: Circles Phase 2 (notify/magic-link), 1.0.18
  lockstep build, **verify affiliate gift/signup conversion** (needs `REWARDFUL_API_SECRET`
  live + a $29 test gift purchase via a test affiliate link), B15 branded-signup CTA
  cutover, infra cleanups (www 404, `TURNSTILE_SECRET_KEY` env).

## Log
- **2026-06-10** — Big day. Shipped: affiliate code integration (snippet + Checkout
  attribution, verified live) + gift/signup Option-B attribution + no-refunds policy
  everywhere; gift admin (void/notes/email-recipient); Circles Phase 1 (web + app +
  migration 029, merge `c2bf469`). Same-day fixes: password-reset `/reset-callback` 404,
  weight-decimal 500 on book save, `/admin/health` zombie + flaky-domains cleanup, landing
  hero/title copy. Adopted the sessions/ + STATUS.md protocol.
- **2026-06-10** — (dispatcher) File created during the cross-session reorg. Historical
  session-by-session detail lives in `docs/archive/CLAUDE-full-20260610.md`.
