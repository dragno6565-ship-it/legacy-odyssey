# Session: Coding

> Product + infrastructure engineering: Express server, web editors/viewer, mobile apps,
> Supabase, deploys. The only session that writes feature code.

**Last session:** 2026-06-11 (new coding session onboarded — read-in + verification only, no code changes)

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

## Open items (next session, in order)
1. **Monitor 1.0.18 review outcomes** (iOS "Waiting for Review" in ASC; Android delivered
   to Play — both verified 2026-06-10 ~10 PM, reconfirmed `fdaa502`). React to any
   rejection; coordinate Dan's phone test once builds are downloadable. Expo submission
   links if needed:
   https://expo.dev/accounts/dragno65/projects/legacy-odyssey/submissions/d5724f17-f238-4843-b7af-b35de8415183 (Android)
   https://expo.dev/accounts/dragno65/projects/legacy-odyssey/submissions/ec191935-bbc6-42cd-9c1d-f1bbadc489f5 (iOS)
2. **Dispatcher-routed (2026-06-10 nightly close):** (a) mark GA4 `purchase` as a Key
   Event — GA4 admin toggle, property 530710619, not code; (b) install Microsoft Clarity
   on `/gift` (routed from google-ads — gates any paid-spend restart).
3. **Demo-site CHAPTER labels (facebook session flag, 2026-06-10):** your-childs-name.com
   may STILL show "CHAPTER ONE/TWO/FOUR" — the demo is served from a DIFFERENT/richer
   deploy than the repo (source unresolved since May 26). The eyebrow removal fixed
   `src/views/book/*` but won't reach the demo if it's a separate deploy. Resolve the
   demo's deploy source, then re-check (then also: banner overlap + clickable recipes,
   TODO.md "Demo site" item).
4. **Verify affiliate gift/signup conversion** (needs `REWARDFUL_API_SECRET` confirmed
   in Railway + a $29 test gift via a test affiliate link) — Blocked on Dan.
5. B15 branded-signup CTA cutover; `/gift` conversion fixes; `/preview/option6`
   promote-or-delete; infra cleanups (www 404, `TURNSTILE_SECRET_KEY`).
6. Known parity drift (pre-existing): web rotate control in only ~4 of ~12 editors.

### ⚠️ Working-tree watchlist (uncommitted, seen 2026-06-11 — don't clobber, don't blanket-commit)
- `.gitignore` adds `CLAUDE.md` to the ignore list — unattributed; F: CLAUDE.md is the
  canonical, Dispatcher-owned source of truth, so ignoring it looks wrong. Flagged to Dan;
  confirm with Dispatcher before anyone commits that hunk.
- `package.json`/`package-lock.json` add `puppeteer` devDependency — unattributed (likely a
  marketing session's screenshot scripts). No STATUS entry claims it.
- `marketing/facebook/BRAND-VOICE-GUIDE.md` 1-line change — facebook session's.
- TODO.md carries the previous coding session's status updates (kept; TODO.md stays
  uncommitted by convention despite being tracked).
- Commit `60b73ce` (landing pricing reorder: Annual middle on desktop, first on mobile) is
  live but undocumented in any brief/STATUS — likely predecessor's last act.

## Log
- **2026-06-11** — New coding session onboarded (replaces the prior over-large one; sole
  coding session per `c91c125`). Read-in + verification only — no code changes, no deploys.
  Confirmed 1.0.18: iOS Waiting for Review, Android delivered. Audited the working tree and
  flagged inconsistencies (see watchlist above): `.gitignore`-ignores-CLAUDE.md hunk,
  unattributed puppeteer dep, stale TODO.md lines (fixed: 1.0.18 verification done; zombie
  Railway deletion is Dan-via-dashboard-only, never the `.env` token).
- **2026-06-10 (night)** — Marathon. Web: Fraunces/Inter restyle (29 views) + darker
  muted text (#4a3f30 final); Circles moved to My Account; Circles **Phase 2 shipped +
  E2E-tested** (notify emails, magic links, unsubscribe, cooldown); family editor clean
  slate (defaults removed, emojis→SVG, all deletable); numbered Chapter/Section eyebrows
  removed from public book; Save Page bar (7 editors + JS-autosave hook); galleries
  overhaul (per-gallery pages + index on public book, nav submenu, rename, reorder,
  50-photo cap, create-then-name, lightbox arrows); decimal weight/length; upload
  resilience (graceful shutdown on SIGTERM + batch-uploader auto-retry + urlencoded
  body fix). App: full 1.0.18 parity batch (Circles Send-an-Update, galleries flow/
  reorder/cap, family icon/delete, year rename, decimal pads) + 3 new API endpoints.
  **Both EAS builds FINISHED; both store submissions scheduled on Dan's explicit go.**
  Lessons: don't deploy while Dan is uploading (now structurally fixed); FormData fetch
  to urlencoded-only routes silently empties req.body.
- **2026-06-10** — Big day. Shipped: affiliate code integration (snippet + Checkout
  attribution, verified live) + gift/signup Option-B attribution + no-refunds policy
  everywhere; gift admin (void/notes/email-recipient); Circles Phase 1 (web + app +
  migration 029, merge `c2bf469`). Same-day fixes: password-reset `/reset-callback` 404,
  weight-decimal 500 on book save, `/admin/health` zombie + flaky-domains cleanup, landing
  hero/title copy. Adopted the sessions/ + STATUS.md protocol.
- **2026-06-10** — (dispatcher) File created during the cross-session reorg. Historical
  session-by-session detail lives in `docs/archive/CLAUDE-full-20260610.md`.

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
