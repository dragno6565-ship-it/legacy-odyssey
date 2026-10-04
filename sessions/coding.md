# Session: Coding

> Product + infrastructure engineering: Express server, web editors/viewer, mobile apps,
> Supabase, deploys. The only session that writes feature code.

**Last session:** 2026-10-04 (HANDOFF before Legacy Odyssey moved to its own F:\legacy-odyssey home + LO-only memory at `.claude\projects\F--legacy-odyssey\memory`. This session ran long and covered branded checkout, privacy hardening, the 11-week domain-outage root-cause + monitoring overhaul, v1.0.28 ship, HEIC fix, landing/gift overhaul, forgot-password scanner fix, pulse false-alarm fix, waitlist protection + a server-side visitor counter, and today removed a stray global GA4 MCP that was popping a Google OAuth on every launch. A new "LO Coding" session will start in F:\legacy-odyssey and replace me.)

---

## 🔑 2026-10-04 SWITCHOVER HANDOFF — read this first

**Repo / working-tree state (verified today):**
- Branch `main`. **All my code is committed and live.** HEAD = `3d9ce7f`. Recent mine: `3d9ce7f` (waitlist bot protection + blocker-proof visitor counter), `d1db1d9` (forgot-password scanner-safe reset link), `3bd0ddb` (pulse false-alarm fix), `96e5674` (Family Album brainstorm, design-only). **Nothing uncommitted in `src/` or `mobile/`.**
- The large pile of modified/untracked files in `git status` (marketing/, pinterest-pins/, screenshots/, blog posts, fb-posts, other `sessions/*.md`, STATUS.md) is **other sessions' work — do NOT blanket-commit.** `.tmp/`, `.temp/`, `.backups/`, `*.stackdump` are junk.
- **Session-only context (outside the repo):** the recurring Google OAuth popup "Stape GA4 MCP" was a **global `ga4` MCP server** in `C:\Users\dragn\.claude.json` (ran `npx mcp-remote https://mcp-google-analytics.stape.io/mcp`). I **deleted that entry today** (file still valid JSON). Dan must **fully quit + reopen Claude** for it to stop. If it ever recurs, clear the leftover `~/.mcp-auth` token cache. GA4 truth (see memory `project_ga4_ads_truth`): live property **531219463 under legacyodysseyapp@gmail.com**; 530710619 is the empty duplicate the MCP read as "0".

**What shipped across this session (all live unless noted):**
- **Branded checkout** — embedded Stripe Payment Element + brand-styled checkout/success/gift pages through the whole flow (the "#3" half). The "#1" half (Stripe **Dashboard** branding: logo/colors in Stripe settings) is still **Dan's to do in the Stripe dashboard**.
- **Checkout audit → 4 bugs fixed/deployed:** (1) webhook read `invoice.subscription` but Stripe Basil+ puts it at `invoice.parent.subscription_details.subscription`; (2) `/start/welcome` fallback provisioning when the webhook lags; (3) gift flow had no conversion tracking; (4) checkout pages were missing the tracking partial. Google Ads conversion fires URL-based on `/stripe/success` (AW-18137400874/5Qh2CI6c_KYcEKqMy8hD), plus Meta CAPI + gtag/fbq/pintrk.
- **Privacy hardening (Dan approved #1–3):** `requireBookPassword.js` is now fail-safe (removed the Railway-host bypass; no password ⇒ locked page, never open); customer `X-Robots-Tag: noindex` middleware; customer domains removed from the sitemap. ("Invite-only" wording stays — Dan's ruling: giving out the password is the customer's responsibility.)
- **"books" → "websites/sites"** in customer-facing emails (do NOT rename public-site nav "The Book" or the App Store listing — Dan's ruling). Added **`scripts/copy-lint.js`** guard that blocks outbound copy containing "book", "web address", em-dashes, wrong greeting, or a price.
- **11-week custom-domain outage root-cause + monitoring overhaul** (the big lesson — see memory `feedback_monitoring_must_verify_correctness`): health checks are now **content-aware** (`siteHealthCheck.js`: 200 AND body has `/verify-password` marker AND NOT marketing markers); `block2Domains.js` content-verifies every customer domain; `publicPulseCron.js` rewritten with a **monitor-blindness guard** (self-checks homepage first; an in-container hairpin/egress failure ⇒ "monitor offline, NOT confirmed outage", throttled, no customer alarm); added `domain-reputation` check (Norton Safe Web + Google Safe Browsing); `prod-health` connection errors are WARN not FAIL (Approximated/Cloudflare hairpin can't reach our own public URL from inside the container).
- **Outage announcement email — ALREADY SENT, do NOT touch.** (Its subject said "web address"; Dan was furious; copy-lint.js exists so it can't happen again.)
- **App v1.0.28** built + submitted BOTH stores (book→website wording, EN/ES/HI). **v1.0.29 is the next build — see `mobile/NEXT-APP-BUILD.md`** (native video-playback retest pending Dan; verify `default_language` honoring). Do NOT trigger an EAS build until those are in. Hard rule: never submit to a store without Dan's explicit OK.
- **SEO "Duplicate without user-selected canonical" fix:** `www.<appDomain>` 301→apex in `server.js` (customers' own www untouched); customer domains out of the sitemap; noindex on customer domains.
- **HEIC fix:** `photoService.js` `isHeic()` + `toJpegIfHeic()` (magic-byte `ftyp` brand detect + heic-convert on upload).
- **Landing + /gift show-first overhaul** (`views/marketing/landing-v2-cro.ejs`, `gift-landing.ejs`, real demo screenshots via `scripts/capture-landing-screens.js`).
- **Forgot-password "link doesn't work" FIXED** (`d1db1d9`, `src/routes/account.js`): root cause was email scanners consuming the single-use `action_link` on GET before the user clicked. Now emails a scanner-safe `token_hash` link (`/account/reset-password?token_hash=...&type=recovery`, verified on submit via `verifyOtp`). **OPEN:** the **set-password / welcome-email link has the SAME scanner-consumption pattern** — apply the same `token_hash` fix next.
- **Clarity "nobody's visiting" mystery → resolved + two features (`3d9ce7f`):** Clarity actually works; the "nobody but 2 waitlist signups" was direct-POST **bots** (the waitlist was wide open while the contact form had protection). Added waitlist protection (rate limit + Origin/Referer guard + honeypot + Turnstile-ready) in `src/routes/api/waitlist.js`, and a **blocker-proof server-side visitor counter**: migration `033_page_views_counter.sql` (page_views table, RLS-closed), `src/middleware/recordPageView.js` (logs human marketing-page GETs, bots filtered), surfaced as the **`site-visitors`** check on the **admin health page** (`block1Infra.js`). This is the TRUE visitor count since Clarity/GA4 are client-side and ad-blocked.

**Open / standing items for the new session (most are Blocked on Dan):**
1. **set-password/welcome-email link** scanner-safety fix (same `token_hash` pattern as forgot-password) — code task, do next.
2. **Stripe Dashboard branding** (the "#1" half of branded checkout) — Dan, in Stripe settings.
3. **v1.0.29** app build: native video retest + `default_language` honoring, then build+submit on Dan's OK (`NEXT-APP-BUILD.md`).
4. **Norton dispute** filed 2026-08-05, awaiting response — the daily `domain-reputation` health check tracks it.
5. **$29 test purchase** to confirm a real end-to-end conversion (Dan).
6. **ga4 MCP popup** — fixed today; confirm it's gone after Dan's next full restart.
7. Ads were **paused** (zombie campaign); GA4 "1-second engagement" was concluded to be bot traffic. Mobile-app Sentry SDK still wanted for a future build.

**Carry-over rules that bit us (full set now in the LO memory folder):** customer sites are "website/site", never "book", never "web address/page/URL"; no em-dashes in public copy; mass emails greet "Hi Legacy Odyssey Customer,"; no price in marketing unless Dan says; never real family names; **never do Albumer work in this session** (route it to the Albumer session); health checks must verify CONTENT not just status codes.

---

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

## Current state (2026-06-23)
- **iOS 1.0.19 = "Ready for Distribution"** (passed review). **v1.0.20 SUBMITTED to BOTH stores 2026-06-23** —
  iOS **Waiting for Review** (build 34), Android **Play production** (in review). 1.0.20 = **import contacts
  from phone** (new) + the D-012 step-2 editor regroup (mobile). 1.0.19 shipped "Your Contacts" + alphabetical
  list + gift-admin (all live on web prod). Backend auto-deploys from `main`.
- **⚠️ Apple agreement watch:** iOS submits 403 (`REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED`) whenever an Apple
  agreement lapses — Dan signs it at App Store Connect → **Business** (`/business`). Hit this on 1.0.20; resolved.
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
1. **✅ DONE — Editor IA "Your Contacts" section (D-012 step 1): SHIPPED.** Web pushed to prod (commits through
   `8a559af` on `origin/main`); mobile shipped in **1.0.19** (submitted to both stores 2026-06-22). Final label
   is **"Your Contacts"** (Dan's correction from "Contact"), sub-areas "Contact List" + "Circles". Includes
   alphabetical Contact List (`listContacts` case-insensitive sort). **Watch: iOS 1.0.19 review outcome** (≤48h)
   + Android production rollout. ⚠️ DECISIONS.md D-012 still says "Contact" — flag chief-of-staff to fix to "Your Contacts".
2. **✅ DONE — Editor regroup (D-012 step 2): SHIPPED lockstep (`17b2e39`).** `account-book.ejs` (web) +
   `DashboardScreen.js` (mobile) both regrouped into Main page [Child Info · Your Journey to Us · **Family Intro**
   = disabled "Coming soon" card] · Your Odyssey · Family & Memories · Your Contacts (+ Manage footer). **Web is
   LIVE** (deployed, healthy). **Mobile committed + JSX-validated, rides the next app build (1.0.20)** — not
   auto-deployed; needs Dan's store-submit OK after 1.0.19 clears review. Still TODO: **Family Intro** real
   feature (design pass — placeholder now); notify-after-NEW-section prompt; **D-013 web staging env**. Spec:
   `docs/editor-ia-revamp.md` + `ops/DECISIONS.md` D-012/013/014. Family sites DEFERRED (D-014).
   - **✅ DONE — `/demo` guided walkthrough LIVE** (`legacyodyssey.com/demo`, `d0ac004`). Shareable tap-through
     tour for in-person/link sharing. Self-contained, `noindex`, no real names. Future tweaks if Dan wants:
     more steps, a "share" button, swap/add demo photos (`src/public/demo-assets/`).
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
- **`origin/main` is caught up through `17b2e39` (editor regroup).** NO unpushed code commits. Shipped this
  session: "Your Contacts" + gift-admin + `/demo` + the D-012 step-2 regroup (web live; mobile committed, awaits
  next app build).
- **Mobile regroup is in the repo but NOT in any released build** — it ships when the next EAS build (1.0.20) is
  cut + submitted (needs Dan's OK; 1.0.19 still in review). Until then the live app shows the pre-regroup grid.
- **`/demo` is ON HOLD (Dan: too thin)** — still live/unlinked/`noindex` at `legacyodyssey.com/demo`. Keep-or-404
  is Dan's call; `marketing/demo.ejs` + `/demo` route + `src/public/demo-assets/*.jpg`.
- **⚠️ `mobile/.../DashboardScreen.js` `DEMO_BOOK` still uses a fake name "Sophia Smith"** (no-invented-names rule
  violation, pre-existing) — fix next session.
- `docs/INDEX.md` is modified by chief-of-staff (customer reclassification) — not mine, leave it.
- `TODO.md` stays uncommitted (coding working-list convention).
- Still uncommitted (other sessions', leave alone): `marketing/facebook/BRAND-VOICE-GUIDE.md`,
  various `sessions/*.md` other roles edited. Never blanket-commit.
- Feature screenshots are untracked binaries in `marketing/screenshots/features/`; Contact-section web
  previews in `.tmp/contact-preview/` (also copied to Dan's Desktop).

## Log
- **2026-06-23** — Big session: new feature + both-store submit + brand-safety cleanup.
  • **Import contacts from phone (app):** `expo-contacts ~15.0.11`; Your Contacts gets a permission-gated,
    searchable multi-select picker (marks already-added). Server `POST /api/contacts/mine/contacts/import`
    (`contactService.importContacts` — de-dupe by email/phone/name + within-batch; bulk insert). Migration
    `030_book_contacts_source.sql` adds `book_contacts.source` — **optional**: insert falls back without it if
    unapplied (no DB access from here to apply; manual in Supabase). app.json: Contacts permission (iOS+Android),
    **v1.0.20**. Web-parity exception logged in TODO (browsers can't read the OS address book). Commit `e0506aa`.
  • **Built + submitted 1.0.20 to BOTH stores.** EAS build all → Android versionCode 33 / iOS build 34. `eas submit`
    iOS failed 4× with a generic error → diagnosed via the EAS submission log (browser): **403
    `FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED`** — an expired Apple agreement. Dan signed it in ASC →
    iOS uploaded → I drove the ASC version flow (created 1.0.20, What's New, attached build 34, export-compliance
    auto-cleared) → **Submitted for Review** (Dan authorized). Android went to Play production.
  • **Emergency banned-word / wrong-demo-link sweep** (Dan caught "your-family-photo-album.com" + "finished book"
    on `/affiliates`): fixed the affiliates demo link → your-childs-name.com; cleaned the waitlist email
    (removed family-album demo button + "chapters"/"preserve"/"family's memories") and the Day-3 onboarding email
    ("preserve"); **deleted `src/public/family-album-demo.html` + its routing** (`book.js` DEMO_BOOK_DOMAINS/SITES,
    `requireBookPassword.js`); fixed demo-book upsell banners (4 layout files), Vault "Protected Forever", and a
    "preserve" in the iOS photo-permission string. Sent emails verified clean. The bad affiliates copy traced to
    old commit `2645c16`, not this session.
  • Lessons: `eas submit --non-interactive` needs `--latest` (or `--id`) or it errors on archive source. The real
    iOS submit error lives on the EAS submission web log, not the CLI (`--verbose-fastlane` didn't surface it
    locally). Apple "Something went wrong" on submit while builds succeed + Android works == an account-level
    agreement (`/business`) needs signing. ASC: after attaching a build, Save and confirm the ✓ before Add for Review.
- **2026-06-22 (later)** — **Shipped a guided product demo — LIVE at `legacyodyssey.com/demo`** (`d0ac004`,
  Dan-approved push). Self-contained tap-through tour (`marketing/demo.ejs` + `/demo` route in `book.js`,
  defined before resolveFamily so it renders on the main domain; photos in `src/public/demo-assets/`): pick a
  name → availability ✓ → reserve → 4-group editor → add photos → publish → finished example site → $29 pitch.
  No DB/auth, resets each run, `noindex`, no real names, word-ban clean (verified on live page + a demo-asset
  image both 200). Built with vanilla JS step nav; verified by driving the tour in headless Chrome (no console
  errors) via `scripts/preview-demo.js`. **Editor regroup (D-012 step 2) web-side also built but HELD** —
  `account-book.ejs` regrouped into the 4 groups (Family Intro = disabled "Coming soon" card); preview on
  Dan's Desktop (`contact-preview/editor-regroup-*.png` via `scripts/preview-account-book.js`). Deploy gated
  on Dan's lockstep-vs-web-first call; mobile `DashboardScreen` regroup not built yet.
- **2026-06-22** — Shipped "Your Contacts" + submitted 1.0.19 to both stores.
  • **Gift-admin tools** (commit `e2982a1`): resend gift email, edit recipient email/message, default the
    "Confirmation copy to" field to the ops inbox (`legacyodysseyapp@gmail.com`) instead of admin's login.
  • **"Your Contacts" relabel** (`a85e2e2`): Dan corrected "Contact" → **"Your Contacts"** everywhere (web
    card + page, mobile screens/nav); sub-areas stay "Contact List" + "Circles".
  • **Pushed web to prod** + **built & submitted 1.0.19 to BOTH stores** (`8a559af`): iOS → App Store,
    **Waiting for Review** (build 33; export compliance auto-cleared via `ITSAppUsesNonExemptEncryption:false`,
    no prompt); Android → **Google Play production**. Per Dan's "Submit iOS now, Android when ready" + backups-first.
  • **ASC recovery:** mid-submit the App Store Connect tab's renderer froze with the build attachment unsaved
    (a beforeunload "Leave site?" dialog blocked reload, even with force). Recovered by opening a FRESH tab —
    the version + What's New + app-review info had saved server-side, so only the build attach was lost;
    re-attached build 33, saved (verified the ✓), Add for Review → Submit. Single clean 1.0.19 submission.
  • Lesson: in ASC, after attaching a build click **Save and confirm the ✓** before doing anything else — the
    page re-renders and a too-fast follow-up click lands on blank space, leaving an unsaved/ frozen state. A
    fresh tab is the clean escape from a stuck beforeunload dialog (server-side saves persist).
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
