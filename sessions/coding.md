# Session: Coding

> Product + infrastructure engineering: Express server, web editors/viewer, mobile apps,
> Supabase, deploys. The only session that writes feature code.

**Last session:** 2026-06-17 (shipped GA consent-timing fix — live; built the editor-IA Contact section + alphabetical contacts, web+mobile, UNCOMMITTED/undeployed pending Dan's review)

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
1. **⏳ Editor IA revamp — Contact section (D-012 step 1): BUILT, UNCOMMITTED, awaiting Dan's deploy
   decision.** Web + mobile lockstep, "relabel in place" (Dan's call). Files changed (uncommitted):
   web `account-dashboard.ejs` (card "Your Circles"→"Contact"), `account-book-circles.ejs`
   (title/breadcrumb/h1→"Contact", "People"→"Contact List"); mobile `DashboardScreen.js` (pulled
   `circles` out of SECTIONS into its own "Contact" ListHeaderComponent), `CirclesScreen.js` + `App.js`
   (relabel). PLUS **alphabetical Contact List** — `contactService.listContacts` now sorts case-insensitive
   (server-side → fixes web + LIVE app, no rebuild). Plan doc: `docs/editor-ia-revamp.md`. Verified (web
   render-shown to Dan, mobile parses). **NEXT: get Dan's go → commit + push web; mobile rides next EAS
   build (TestFlight review).** Web previews saved to `.tmp/contact-preview/` + Dan's Desktop.
2. **Editor regroup (D-012 step 2)** — once Contact ships: regroup the flat editor into 4 groups (Main page
   [Child Info · Your Journey to Us · **Family Intro NEW**] · Your Odyssey · Family & Memories · Contact),
   web `account-book.ejs` (flat grid today) + mobile `DashboardScreen` SECTIONS. + notify-after-NEW-section
   prompt. + **D-013 web staging env** (web deploys straight to prod today — stand up a review copy). Full
   spec: `docs/editor-ia-revamp.md` + `ops/DECISIONS.md` D-012/013/014. Family sites DEFERRED (D-014).
3. **✅ GA consent-mode timing — SHIPPED + LIVE (`4fdbdd0`).** Added a `loOnTrackingReady()` queue to the
   tracking partial that `loEnableTracking` flushes AFTER granting consent; wrapped the `purchase` events on
   success/gift-success/signup-welcome. Logic verified (queued→flushed on grant→never on decline). Real
   proof = a live conversion + GA's 24-48h lag. Secondary still open: **success.ejs annual value 49.99 → $29**
   (Dan said leave for now, mid revenue reconciliation).
2. **Customer entity files (routed by chief-of-staff 2026-06-16).** `docs/INDEX.md` customer section was
   reconciled (7 real paying = 6 annual + 1 monthly). Create `docs/customers/` entity files for the 3 NEW
   real customers (**arloboos**, **zoraporter**, **emmabeine**) + the 4 influencer comps
   (Akshita/Giulia/Megan/Sia), and **confirm whether `emmacherry`/`roypatrickthompson` actually pay** —
   their DB rows have NO `stripe_subscription_id` (churned? manually provisioned? comped?). Use the
   Supabase service-role (local) to check.
3. **Demo-site content refresh — MYSTERY SOLVED, now actionable.** The live demo is on **Spaceship Web
   Hosting cPanel**, file `/home/wnuazicufx/your-childs-name.com/index.html` (386 KB) — NOT Railway/repo
   (see `docs/domains/your-childs-name.com.md`). To fix the banner overlap + clickable recipes + any banned
   "CHAPTER" eyebrows, edit that cPanel file via Spaceship file-manager/FTP. **Needs Spaceship hosting login
   (Dan).** Repo edits will NOT reach it.
4. **Monitor 1.0.18 review outcomes** (iOS "Waiting for Review"; Android delivered, verified 2026-06-10).
   React to rejections; coordinate Dan's phone test.
5. **Affiliate gift/signup conversion** — coding side GREEN (`REWARDFUL_API_SECRET` live + authenticating).
   Remaining = the affiliates session's real referred $29 test purchase confirming a dashboard conversion.
6. B15 branded-signup CTA cutover; `/gift` conversion fixes (now measurable via Clarity + the GA fix once
   consent-timing lands); `/preview/option6` promote-or-delete; infra cleanups (www 404,
   `TURNSTILE_SECRET_KEY`). Pre-existing parity drift: web rotate in ~4 of ~12 editors.

### ⚠️ Build / deploy gotcha (NEW 2026-06-16 — read before deploying)
- **`PUPPETEER_SKIP_DOWNLOAD=true` MUST stay set in Railway env.** The `puppeteer` devDependency (backs the
  screenshot scripts) makes Railway's `npm ci` try to download Chromium, which FAILS the build (builder
  lacks tar/unzip, Node 18). The env var makes the build skip the download (puppeteer is never RUN on
  Railway). If a deploy ever fails on `npm ci`/puppeteer/chromium, confirm that var is set. Local installs
  still download Chromium (so the screenshot script works) — the skip is Railway-scoped only.
- Sales path is healthy: both `create-signup-intent` (clientSecret) and `create-checkout`
  (checkout.stripe.com) reach Stripe; the `req.body` guard (server.js, `d7740fc`) returns clean 400s for
  malformed/bot POSTs instead of 500/Sentry pages.

### ⚠️ Working-tree / repo notes
- **GA consent-timing fix (`4fdbdd0`) is PUSHED + LIVE.** origin caught up through it.
- **⚠️ The Contact section feature is COMMITTED LOCALLY (`3d54f6a`) but NOT PUSHED** — held pending Dan's
  deploy review. **The next `git push` WILL deploy it** (web). So before any unrelated push, know that
  Contact rides along — confirm Dan's OK on Contact first, or cherry-pick. Mobile part ships in the next
  EAS build regardless.
- `docs/INDEX.md` is modified by chief-of-staff (customer reclassification) — not mine, leave it.
- `TODO.md` stays uncommitted (coding working-list convention).
- Still uncommitted (other sessions', leave alone): `marketing/facebook/BRAND-VOICE-GUIDE.md`,
  various `sessions/*.md` other roles edited. Never blanket-commit.
- Feature screenshots are untracked binaries in `marketing/screenshots/features/`; Contact-section web
  previews in `.tmp/contact-preview/` (also copied to Dan's Desktop).

## Log
- **2026-06-17** — Two things.
  • **GA consent-timing fix — SHIPPED + LIVE (`4fdbdd0`).** `purchase` events fired before the deferred
    consent.js granted analytics_storage → Consent Mode v2 dropped them (GA $0). Added `loOnTrackingReady()`
    queue to the tracking partial, flushed by `loEnableTracking` after consent; wrapped purchase on
    success/gift-success/signup-welcome. Deployed + smoke-tested (homepage 200, partial present site-wide).
  • **Editor IA revamp — Contact section (D-012 step 1) BUILT (uncommitted, undeployed, pending Dan).**
    Web+mobile lockstep relabel-in-place: Contacts+Circles pulled into their own "Contact" section
    (web card + page; mobile ListHeaderComponent above the book grid). + **alphabetical Contact List**
    (`listContacts` case-insensitive sort, server-side → web + live app). Created `docs/editor-ia-revamp.md`.
    Verified web by rendering the changed pages locally → screenshots shown to Dan (saved to his Desktop +
    `.tmp/contact-preview/`); mobile parses clean. Dan reviewing; hadn't given the deploy go at shutdown.
  • Lessons: PowerShell mangles inline JSON/quotes for curl + node -e — write a script file or use
    `--data-binary @file`. Chrome MCP `navigate` forces https:// (no file://) — serve previews via a tiny
    local http server, or puppeteer-screenshot rendered HTML to PNG. Expo-web is NOT faithful for app review —
    use TestFlight. Mobile section ordering that comes from the server API updates the live app without a rebuild.
- **2026-06-16** — Health-check triage + sales-path verification (no feature work).
  • **Both health-check alarms FALSE.** lachlanstoneleister.com UP (apex+www 200, 12/12 no flap; the
    ECONNRESET was a transient blip during yesterday's redeploys — the domain check pings once, no retry).
    Backups HEALTHY: `cron_runs[photo-backup]` last success 14.4h ago, **R2 273 == Supabase 273 (gap 0)** —
    the 95.7h WARN was the benign "no new photos in 4 days" case (the check measures last-*upload* age),
    self-cleared by my demo uploads.
  • **Sales path WORKS.** Both `create-signup-intent` (→clientSecret) and `create-checkout`
    (→checkout.stripe.com) reach Stripe; Stripe/prices/coupon all valid. The scary "Something went wrong" +
    the Sentry `req.body undefined` page were **my own PowerShell↔curl JSON-quoting artifacts** (browser=curl),
    NOT a real outage — a clean file-based request works. Verified the actual `stripeService` fn + raw Stripe
    ops locally with prod env; all green. Cleaned up the live test customers I created.
  • **Shipped `req.body` hardening** (server.js global guard → malformed/bot POSTs get a clean 400 instead of
    a 500 TypeError that pages Sentry). `d7740fc`, deployed + verified live.
  • **Deploy detour:** the push FAILED the Railway build — it was the first to carry yesterday's `puppeteer`
    devDependency, whose Chromium download breaks `npm ci`. Fixed by setting `PUPPETEER_SKIP_DOWNLOAD=true` in
    Railway env (via API); rebuild succeeded; hardening live. (No outage — prod stayed on the last good build.)
    A delayed Railway "build failed" email arrived AFTER the fix — stale, for the 18:20 failed attempt; the
    18:28 rebuild is SUCCESS.
  • **Demo-host mystery SOLVED + documented** (Spaceship cPanel; see Open item 3 + `your-childs-name.com.md`).
  • Lessons: NEVER call a new dependency "harmless to deploy" without checking it builds on the server
    (puppeteer ≠ harmless). PowerShell+curl mangles inline JSON — use `--data-binary @file` for POST tests.
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
