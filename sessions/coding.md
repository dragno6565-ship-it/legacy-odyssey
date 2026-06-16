# Session: Coding

> Product + infrastructure engineering: Express server, web editors/viewer, mobile apps,
> Supabase, deploys. The only session that writes feature code.

**Last session:** 2026-06-15 (big day — GA branded-signup tracking fix, 3 feature blog posts, Microsoft Clarity, Rewardful key verified, feature screenshots; all live)

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
  fired from the webhook. ✅ **2026-06-15: `REWARDFUL_API_SECRET` CONFIRMED in Railway prod +
  authenticates (GET /v1/campaigns → 200).** Code/webhook side green; only the affiliates
  session's real referred test purchase remains to confirm a conversion in the dashboard.
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
1. **GA: two deferred decisions (Blocked on Dan).** (a) **Consent-mode timing** — the inline
   `purchase` event on success.ejs/gift-success.ejs fires BEFORE the deferred `consent.js`
   grants `analytics_storage`, so Consent Mode v2 downgrades them to cookieless/modeled and
   likely dampens GA conversion counts across ALL flows. Needs careful fix (fire `purchase`
   from inside `loEnableTracking`, or load consent.js before the event) + live verification —
   don't touch blind (it's GDPR gating). (b) **success.ejs annual value = 49.99** but the
   customer pays **$29** first year — Dan said leave it for now (mid revenue reconciliation);
   revisit after the Stripe pull. (Branded-signup flow already fixed — uses real pi.amount.)
2. **Demo-site deploy-source mystery** (only untouched item from 2026-06-15). your-childs-name.com
   serves a DIFFERENT/richer build than the repo (unresolved since May 26) — may still show
   banned "CHAPTER ONE/TWO/FOUR" eyebrows. **LEAD (from `docs/INDEX.md` line 65 / `spaceship-hosting.md`):
   the demo is hosted on SPACESHIP WEB HOSTING, not Railway** — so repo/Railway changes never reach it.
   Next: find the demo's source files on Spaceship hosting (likely a static export of an older book
   build), edit there. Then fix banner overlap + clickable recipes (TODO "Demo site"). Gates the refresh.
3. **Monitor 1.0.18 review outcomes** (iOS "Waiting for Review" in ASC; Android delivered to
   Play, verified 2026-06-10). React to any rejection; coordinate Dan's phone test. Submission
   links: Android d5724f17-… / iOS ec191935-… (expo.dev/accounts/dragno65/projects/legacy-odyssey/submissions/).
4. **Affiliate gift/signup conversion end-to-end** — the `REWARDFUL_API_SECRET` is now CONFIRMED
   live in Railway + authenticating (verified 2026-06-15, GET /v1/campaigns → 200). Remaining =
   the affiliates session's real referred $29 test purchase confirming a conversion in the
   Rewardful dashboard. Coding side = GREEN.
5. **Reposition screenshot follow-up (optional):** the 4th feature shot IS captured
   (`marketing/screenshots/features/10-reposition-modal.jpg`); script works. Nothing pending
   unless we want it embedded in the blog (existing posts are text-only).
6. B15 branded-signup CTA cutover; `/gift` conversion fixes (now measurable via Clarity +
   the branded-signup GA fix); `/preview/option6` promote-or-delete; infra cleanups
   (www 404, `TURNSTILE_SECRET_KEY`). Pre-existing parity drift: web rotate in ~4 of ~12 editors.

### ⚠️ Working-tree / repo notes
- **Local `main` is 2 commits AHEAD of origin** — `d7e158b` (puppeteer dep + capture script)
  and `bd52da5` (capture-script reposition fix). Intentionally UNPUSHED (dev tooling only, no
  prod runtime change). Will ride the next agreed deploy. The prod commits today (`9c4c526`
  blog+GA fix, `a1146d9` Clarity) ARE pushed/live.
- `.gitignore`-ignores-CLAUDE.md hunk: RESOLVED by dispatcher (`3cefbef` tracks CLAUDE.md).
- `puppeteer` devDependency: now COMMITTED (`d7e158b`) — it backs the screenshot capture scripts.
- Still uncommitted (other sessions', leave alone): `TODO.md` (coding working list, edited today),
  `marketing/facebook/BRAND-VOICE-GUIDE.md` (facebook), `sessions/content-organic.md` (content-organic).
- Commit `60b73ce` (landing pricing reorder) = prior coding session's, live, now documented.
- Feature screenshots delivered (untracked binaries, per marketing/ convention):
  `marketing/screenshots/features/08-circles-page.jpg`, `09-gallery-grid.jpg`, `09-gallery-list.jpg`,
  `10-reposition-modal.jpg`.

## Log
- **2026-06-15** — Big day; 3 prod deploys, all live & verified.
  • **GA4 tracking:** found `purchase` was ALREADY a key event (the routed console toggle was
    moot). Real bug: the **branded PaymentIntent signup** (`/start/checkout`→`/start/welcome`)
    fired ZERO analytics — `signup-welcome.ejs` had no tracking partial/purchase event, unlike
    success.ejs + gift-success.ejs. Fixed: `/start/welcome` retrieves the PI and fires GA4+Meta+
    Pinterest `purchase` with the real charged amount (commit `9c4c526`). Flagged consent-timing
    + the 49.99-vs-29 value (see Open items 1).
  • **Blog:** published Circles / Custom Galleries / Reposition posts (`blog-*.ejs` + routes +
    registry + sitemap), text-only matching the 9 existing posts; canonical desc + word bans
    verified (`9c4c526`). Live + in index/sitemap.
  • **Clarity:** wired site-wide, consent-gated, env-driven (`CLARITY_PROJECT_ID` via
    `consentRegion` middleware; loader in tracking partial) — `a1146d9`. Dan created project
    `x7mt9cszyp`; I set the Railway env var via API (authorized) → live on `/gift` + site-wide.
  • **Rewardful:** verified `REWARDFUL_API_SECRET` is set in Railway prod (also confirms the
    local Railway token/IDs point at the LIVE project `27622203`, not the zombie) AND the key
    authenticates (GET /v1/campaigns → 200). Webhook/code side GREEN.
  • **Screenshots:** built `scripts/capture-feature-screenshots.js` (puppeteer) — logs into the
    review@ demo account (password via `LO_DEMO_PASSWORD` env), uploads repo stock photos to seed
    a gallery, captures all 4 feature shots → `marketing/screenshots/features/`. Committed dep +
    script locally (`d7e158b`,`bd52da5`, unpushed).
  • Lessons: the Apple-review account `review@legacyodyssey.com` is the safe demo (placeholder
    data); the real dogfood `dragno65@hotmail.com` was pre-filled at login — never screenshot it.
    GA4 lives under `legacyodysseyapp@gmail.com` (not the default Chrome account) — switch via
    `?authuser=`. Browser MCP can't upload arbitrary repo files; puppeteer can.
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
