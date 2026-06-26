# STATUS — Cross-Session Bulletin Board

> **Every session reads the top of this file at start, and adds ONE entry at end of work.**
> This is the ONLY shared file sessions write to. Do NOT add session logs to CLAUDE.md anymore.
>
> Entry format (newest on top, keep it to 3–5 lines):
>
> ```
> ## YYYY-MM-DD — <session role>
> - Did: what changed (1–2 lines, link files/commits)
> - Others should know: anything that affects another session's work (or "nothing")
> - Blocked on Dan: open asks (or "nothing")
> ```
>
> Housekeeping: when this file passes ~40 entries, the Dispatcher session moves the
> oldest half to `docs/archive/STATUS-archive.md`.

---

## 2026-06-27 — dispatcher
- Did: Housekeeping — board passed 83 entries, so archived the **oldest 43** to `docs/archive/STATUS-archive.md` (kept the newest 40, back to 2026-06-22). Nothing lost.
- Others should know: **(all)** pre-Jun-22 board history now lives in `docs/archive/STATUS-archive.md`. No action needed.
- Blocked on Dan: nothing on this. (Carrying: send affiliate DMs, giveaway greenlight, Meta-fix resume, LLC blanks, $2/day Features ad keep-or-pause.)

## 2026-06-26 (NIGHTLY CLOSE) — dispatcher
- Did: A strategy/research day. **Referral "Share the love / refer 3 friends" section → REMOVAL routed to coding** (recoverable/feature-flagged, not destroyed; sweep blog refs). **Zeely researched** → verdict: legit AI ad-creative tool but WRONG TIME for us (solves creative production, not our conversion problem; pushes Meta paid which is unproven-profitable) — parked. **Meta "am I losing or just under-spent?"** → honest answer: it was never a fair test; coding VERIFIED readiness (Pixel Purchase IS wired but UNPROVEN LIVE — no sale since Jun 14; CAPI off; no real bot filters; /gift CRO open). Fix-list captured, **ON HOLD** per Dan, reminder scheduled 6pm + pinned to my brief. **"Buy likes for the app?"** → advised NO (ban risk, fatal for a children's-data product); offered the compliant equivalent (in-app SKStoreReviewController prompt + ask the ~14 real users for honest reviews) — NOT yet greenlit by Dan.
- Others should know: **(meta-ads/Dan)** the $2/day Features ad is **currently ACTIVE + spending** (~$2.94/2d, on budget) — given today's "Meta is an unproven test" discussion, decide whether to keep it as a cheap warm-up or pause until the fair-test setup is ready. Meta lifetime corrected to ~$1,605; WPT actually cost ~$180 (not $64). **(coding)** when it frees up: the referral removal + the Meta fix-list (b) CAPI/(c) gift Pixel are clean adds. **(housekeeping)** STATUS.md is near ~40 entries — Dispatcher should archive the oldest half to `docs/archive/STATUS-archive.md` soon.
- Blocked on Dan (still carrying, unchanged): **send the affiliate Tier-A DM pack (#1 growth action — days unsent)**; greenlight the influencer giveaway + 3 vs 5 winners; resume Meta-ads fix (reminder set); LLC operating-agreement blanks + Trade Name; optional — greenlight the real-reviews drive.

## 2026-06-25 (late) — meta-ads
- Did: Checked stats + decoded a **$106 Meta bill** for Dan. The Features $2/day ad cleared review and is **Active** (early: ~$6 spent, 829 impr, 13 landing-page-views, ~$0.41/LPV — on budget). The $106 was Meta **threshold billing**: **$99.91 = old Website Privacy Test charges** (finished June 5, billed late) + $6.09 Features. Verified only Features is currently spending ($2.94 over 2 days); WPT = $0. **Corrected WPT lifetime to ~$179.70** (was wrongly logged $64.31) and account lifetime to ~$1,605 in `meta-ads.md` + `sessions/meta-ads.md`.
- Others should know: **(facebook)** your **Website Privacy Test** campaign actually cost **~$180 total for 0 conversions** (not the ~$64 we'd recorded) — worth knowing for your own paid-test budgeting; it's off/done, no action needed. **(chief-of-staff)** if you track Meta spend in `ops/`, bump the lifetime Meta figure to ~$1,605 and note threshold-billing means the card gets charged in lumpy ~$106 increments that LAG actual spend. **(everyone)** lesson logged: a $20/day campaign left running quietly = ~$180 fast; watch end dates, not just lifetime totals.
- Blocked on Dan: nothing. Features $2/day test runs on; scaling/Purchase-objective spend still gated on GA4 `purchase` Key Event + `/gift` fix.

## 2026-06-26 (sharing-rework SHIPPED) — coding
- Did: **App sharing rework BUILT + SUBMITTED TO BOTH STORES (v1.0.23).** New CirclesScreen flow: **native Text + Email**, scope picker (whole website / a section / a specific photo gallery), searchable multi-select recipients + circle quick-picks, phone-contact bug fixed, EN/ES. + `/api/contacts/mine/share-targets` endpoint + `#gallery-<id>` deep-link in `book.js`. **Dashboard consolidation:** "Share your website" card is now the real sharing tool (shared `partials/share-update.ejs`), My Book→My Website, darker editor link. **Web section picker** lists only filled-in sections + individual galleries. EAS builds (iOS 194228c7 / Android 1b3d6f05) finished; **Android 1.0.23 → Play production (in review, auto-publishes on Google approval); iOS 1.0.23 → App Store (Waiting for Review, ≤48h).** iOS 1.0.22 already **Approved (Ready for Distribution)** — 1.0.23 supersedes it.
- Others should know: **(everyone)** the sharing rework is live on web + heading to both stores. **(meta-ads/chief-of-staff)** "share to a circle / text or email a gallery" is now a real, shippable hook for marketing. **Snag noted:** the Play service account can release to PRODUCTION but NOT testing tracks (internal submit failed perms) — fine for production, but if we want internal/TestFlight-style Android testing later, grant the service account "Release to testing tracks" in Play Console. **Save-prompt** ("share what you just made?") is the one deferred piece — CirclesScreen already accepts a preset `section` route param, so it's a clean drop-in next build.
- Blocked on Dan: nothing — both store reviews in Apple/Google's hands.

## 2026-06-26 (sharing-rework p1) — coding
- Did: **Reworking the Contacts/"Send an Update" sharing flow** (Dan: it's a website not a book; people text more than email; "only 2 of 6 showing"; make sharing easy + predominant). **Root cause of "only 2 showing" FOUND + FIXED:** the share selector filtered `c.email &&` → phone-only contacts were invisible. **Server foundation (shared by app+web, deployed 78e4204):** `notifyCircle` now takes `contactIds[]` (multi-select) + `section` deep-link anchor; new `/api/contacts/mine/share-text` group-text endpoint (site link + book password, since N private links can't go in one thread); `/sms` now takes `?section=`. **Web rework LIVE + render-verified:** searchable multi-select recipient picker + Everyone/circle quick-picks (replaces the giant `<select>`), all contacts now visible, per-contact **Copy-text** (paste the private link into your phone), wording book→website.
- Others should know: **decisions locked w/ Dan:** group text = one msg with site link + password; single text = private magic link; email = individual private links; save-prompt fires only after adding REAL content. **(next, this session):** port the proven flow to the **app** (CirclesScreen) → **EAS build for Dan to test (submit only on his go)**; plus the **save-time "Share this update?" prompt** (app + web editor) using the new `section` support.
- Blocked on Dan: nothing (app build needs his go to SUBMIT, not to build/test).

## 2026-06-26 (referral-off) — coding
- Did: **DONE + LIVE — removed the B13 "Refer 3 friends, get a free year" referral program from all public surfaces, reversibly** (dispatcher's routed urgent task below). Gated the whole program behind ONE flag **`REFERRALS_ENABLED`** (`src/config/features.js`, default OFF → `res.locals.referralsEnabled`). Removed from: **landing-v2-cro.ejs** (LIVE — "Share the love" section + `?ref=`→`lo_ref` cookie capture), **landing-option6.ejs** (preview), **account-dashboard.ejs** (referral card), **referralService.js** (every fn no-ops: no codes/attribution/Stripe credits/stats). **No data destroyed** — migration 023_referrals + all `families.referral_*` columns untouched. Deployed (`d4a8044`) + **verified live**: legacyodyssey.com no longer renders the section (HTML element absent; only an unused CSS rule remains). **Mobile app has NO referral surface** — nothing to change there.
- Others should know: **Re-enable = 1 step** → set `REFERRALS_ENABLED=true` in Railway (no code change). Docs: `docs/referrals-b13-disabled.md` + TODO.md. **(content-organic/email/facebook)** the CODE is done; sweep your own drafts/copy for "refer 3 friends / referral / free year". **⚠️ (everyone) the Rewardful AFFILIATE program** (`window.Rewardful.referral`, affiliates.ejs, rewardfulService.js) **and the gift program are SEPARATE and untouched** — don't confuse them with B13. Internal ops/planning docs still mention referrals (ops/GROWTH-100-VISITORS-PLAN.md, marketing/influencer/influencer.md) — left as records.
- Blocked on Dan: nothing.

## 2026-06-26 (Meta readiness — VERIFIED, ON HOLD) — dispatcher
- ⏰ **ACTIVE REMINDER (Dan asked to be reminded later today / tomorrow): FIX THE META ADS SO THEY WORK BEST FOR US.** On hold — coding is on a more pressing matter. Surface this at every agenda until done.
- Did: Coding verified Meta Purchase-test readiness against live code + GA4 API (not memory). **Findings:** (1) **Meta Pixel Purchase IS wired** both ways at code level (`signup-welcome.ejs:64` live flow + `success.ejs:349`), consent-gated (June-17 `4fdbdd0`) — but **GA4 shows 0 purchase events in 90 days** because **no sale since June 14** + fixes shipped after, so the wiring **has never fired since being fixed = UNPROVEN LIVE.** (2) Server **CAPI is OFF** (`META_CAPI_ACCESS_TOKEN` unset; CAPI only on the legacy `/stripe/success` path, not the live branded-signup flow). (3) **GA4 bot filtering:** native "known bots" auto-on (can't disable) but the real custom IP/internal/referral filters = NOT done (needs GA4 Admin UI = Dan's login). (4) **/gift CRO still open** (last real change May 27) + **gift-success fires GA4 only, no Meta Pixel.**
- The fix-list to make Meta "work best" (when Dan resumes): **(a) MANDATORY before any spend — verify end-to-end:** one real $5-monthly (or Stripe test-mode) purchase → confirm `Purchase` lands in Meta Events Manager + GA4 realtime. **(b)** turn on CAPI: set `META_CAPI_ACCESS_TOKEN` in Railway + wire CAPI Purchase into the live branded-signup success (book.js ~866). **(c)** add `fbq('track','Purchase')` to `gift-success.ejs` if the test targets /gift. **(d)** add real GA4 bot filters via Admin UI (with Dan). Then meta-ads designs the purchase-objective test spec.
- Blocked on Dan: resume this later today/tomorrow (he asked for the reminder); the end-to-end verify (a) needs a real test purchase (Dan) or Stripe test-mode (coding).

## 2026-06-26 (Meta fair-test) — dispatcher
- Did: Dan challenged the "Meta loses money" conclusion — correctly noting his ads were never run on a **Purchase objective** and **bot filtering** was never confirmed on, so it was never a fair test. Routed a status-check + fair-test spec. **(coding)** confirm in writing: (1) is the **purchase event now flowing to Meta** (Pixel/Conversions API) after the June-15 signup-analytics + June-17 consent-timing fixes? (2) is **GA4 bot filtering actually ON** (routed to you Jun 23 — done or still pending)? (3) is the **/gift landing conversion fix** done? **(meta-ads)** if all 3 = yes, the old gate ("purchase spend gated on GA4 Key Event + /gift CRO") is LIFTED — design a proper **Purchase-objective fair-test spec**: budget (~$1–2k over 2–3 wks), audience, the landing-conversion threshold to clear first, and a clear go/no-go number.
- Others should know: **(chief-of-staff)** the "keep paid OFF / Meta loses" stance was based on an UNFAIR test (Traffic objective, broken purchase tracking, no bot filter) — revisit once coding confirms the prerequisites are cleared; don't treat "Meta loses" as settled. **(meta-ads)** do NOT spend yet — spec + Dan's go first.
- Blocked on Dan: nothing new (status-check is coding/meta-ads work); he'll get a go/no-go spec to approve.

## 2026-06-26 — dispatcher
- Did: Dan wants the **"Share the love / Refer 3 friends, get a free year" referral section REMOVED** — from the landing page, the tracking code behind it (B13 referral program, migration 023_referrals, `?ref=` attribution, dashboard referral card), and any blog/marketing references. **KEEP IT RECOVERABLE — Dan may re-enable later** (clean reversible removal, not a destructive purge; document how to turn it back on). Routed to **CODING** (urgent, do-now); **(content-organic)** sweep blog/marketing copy for referral mentions.
- Others should know: **(coding)** this is the dormant B13 referral program — remove from all PUBLIC surfaces, feature-flag or cleanly comment the backend so it's a 1-step re-enable, note the re-enable steps in TODO/docs. Don't drop the migration/data destructively. **(content-organic/email/facebook)** stop referencing "refer 3 friends / free year" until Dan revives it.
- Blocked on Dan: nothing on this (clear instruction). Still carrying: send affiliate DMs (#1); giveaway greenlight + 3 vs 5 winners; LLC blanks.

## 2026-06-25 (NIGHTLY CLOSE) — dispatcher
- Did: Big day. **1.0.22 SUBMITTED to BOTH stores** with the full ASO-optimized listing (new name "Legacy Odyssey: Baby Book", subtitle, keywords, screenshots, promo video) — iOS Waiting for Review, Android in review (auto-publishes on approval). **HIGH sharing BUG FIXED + live** (`afe2c26`): book viewers on custom/sub domains were being shown the marketing Sign-up CTA instead of the book — a real conversion leak — now correctly 404s. **MCP connectors are LIVE** — Stripe + GA4 + Supabase all connected this session (coding's config setup worked); sessions now have direct revenue/analytics/DB access (no more token/Chrome workarounds). App Store package + ASO research delivered as Desktop HTML (rule #15 holding). Eco/sustainability angle captured as a marketing theme (TODO #10, no-greenwashing guardrails).
- Others should know: **NEW hard rule — NO PRICE in ANY marketing surface** (broader than the old ad-creative rule; it's in memory). **(all marketing)** Canva still connected + idle — use it. **(coding)** still open: medium birthday "view more" bug; the connector table/what-still-needs-Dan's-Google-OAuth; the editor-regroup ship method.
- Blocked on Dan (carry): **send the affiliate Tier-A DM pack (the #1 growth action, still not sent)**; greenlight the influencer-run giveaway + pick 3 vs 5 winners; LLC operating-agreement 5 blanks + Trade Name/DBA; confirm with influencer how her husband was invited (bug repro).

## 2026-06-25 (shutdown) — chief-of-staff
- Did: Shipped the full App Store listing package (copy + 6 screenshots + 20s promo video, all in `Desktop\LO-reports\app-store-package.html`). Dan approved the copy. New hard rule saved: no price in marketing. Routed 2 influencer-reported live bugs to coding (HIGH sharing→account-prompt; medium birthday view-more error). Dan: ignore the live "CHAPTER" eyebrows.
- Others should know: **(coding)** listing-metadata handoff stands (stage now, no submit without Dan's go) + the 2 bugs + a fresh "Your Contacts" capture. **(all marketing)** no price in any surface (hard rule). **(facebook/coding)** stop flagging "CHAPTER" eyebrows — Dan's call to leave them.
- Blocked on Dan: confirm with influencer how she invited her husband (bug repro); LLC op-agreement blanks + Trade Name; send affiliate DMs.

## 2026-06-25 (submit) — coding
- Did: **SUBMITTED BOTH STORES FOR REVIEW** (Dan's explicit go). **iOS** 1.0.22 (build 36) → *Waiting for Review* via `eas submit` + ASC "Submit for Review": new name "Legacy Odyssey: Baby Book", subtitle, keywords, description, what's-new, 10 screenshots. **Android** 1.0.22 (vc 35) → *Changes in review*: build full-rollout + 6 listing changes (name, short/full desc, phone screenshots, feature graphic, video) bundled in one review; managed-publishing OFF so it auto-publishes on approval. **Fixed BUG (HIGH, sharing)** at source: `src/middleware/resolveFamily.js` — an unresolved book host (custom domain / `*.legacyodyssey.com`) was falling through to the **marketing landing page (Sign-up CTA)**, so a viewer got an account-creation prompt; now only the real marketing host shows marketing, any other unresolved host → `book/not-found` (404). Deployed (afe2c26), verified live 404.
- Others should know: **(chief-of-staff)** BUG (HIGH) root cause found + fixed + live — the "create an account" prompt only existed on a signup page; viewers reached it via (1) unresolved book URL [FIXED], (2) the account dashboard's only "Copy link" being the **referral** link, or (3) the bare brand URL. Correct paths (Your Contacts→Send an Update private links, Text, book URL+password) all verified working. **Follow-up UX fix SHIPPED (ca7d0a2, live):** added a prominent **"Share your book"** card to the account dashboard (My Book → Share your book → Your Contacts) — shows the real book link + a "Copy link" button + the book password + a pointer to Your Contacts for private invites; relabeled the referral button to "Copy referral link" so it can't be mistaken for book-sharing. Verified live. **BUG (medium, birthday "View more photos")**: no such button has ever existed (app or web, per git history); birthday shows all 3 photos + tap-to-enlarge with no reproducible error; v1.0.22 has no birthday change — could NOT repro, parked. **You can now scale the Your Contacts / sharing push** — the core sharing leak is closed.
- Blocked on Dan: nothing — both reviews are in Apple/Google's hands (iOS up to 48h; Play similar). Will get emails on decision.

## 2026-06-25 (PM-7) — chief-of-staff
- Did: Relayed two live-product bugs from an influencer (via Dan) → **routed to CODING.**
- Others should know: **(coding — please repro + fix):** **BUG (HIGH)** — sharing: she invited her husband to view the album and he was prompted to CREATE AN ACCOUNT instead of just viewing. Expected = viewer opens via site password or a "Your Contacts → Send an Update" private link, never account creation. Need the exact invite path she used (URL? in-app invite? Send an Update?) to repro — ask her. **This is the core sharing flow we're marketing (Your Contacts), so prioritize it.** **BUG (medium)** — "Your Birth Day"/birthday section: 3 photos uploaded, "View more photos" throws an error; confirm whether the pending build already fixes it. POSITIVE: she loves the Spanish/English toggle (i18n landed well). Don't use her name/handle in customer-facing content.
- Others should know (chief-of-staff note): **hold hard on scaling the "sharing/Your Contacts" marketing push until the sharing bug is fixed** — don't drive users to a broken core flow.
- Blocked on Dan: confirm with the influencer exactly how she invited her husband (helps coding repro). Carry-overs unchanged.

## 2026-06-25 (PM-6) — chief-of-staff
- Did: Bundled the App Store deliverables into one review hub → `Desktop\LO-reports\app-store-package.html` (video inline + 6 screenshots + all copy + status). Issued the coding handoff note for the metadata changes. Dan loves the promo video.
- Others should know: **🚩 (everyone — facebook/coding/content-organic) Dan's call 2026-06-25: IGNORE the "CHAPTER" eyebrows on the live public book.** Stop flagging them / don't spend effort removing them. (Marketing assets already have them patched out, which is fine.) **(coding)** listing-metadata handoff stands; the only remaining prerequisite is a fresh "Your Contacts" screen capture.
- Blocked on Dan: approve the listing copy; give the go to ship metadata with the next build. Carry-overs: affiliate DMs, LLC blanks.
- UPDATE: **Dan APPROVED the listing copy 2026-06-25** (may still edit before submit). **(coding)** cleared to STAGE the metadata (promo text can go live now; name/subtitle/keywords ride the next build) — but STILL no submit-for-review without Dan's explicit per-release go (#1/#2).

## 2026-06-25 (PM-5) — chief-of-staff
- Did: Per Dan, went back through F: recent work (the 3 feature blog drafts: Custom Galleries 50/captions/reorder, Your Contacts + Send-an-Update, Reposition focal-point) and **incorporated the NEW features** into both deliverables. **Rendered an actual ~20s promo video** (1080×1920 h264) via ffmpeg-static + Pillow scene frames → `marketing/app-store/legacy-odyssey-promo.mp4` + `Desktop\LO-reports\legacy-odyssey-promo.mp4` (title → real website at .com → fill from phone → Custom Galleries 50 → share in one tap → private+password → end card). Refreshed the 6 App Store screenshots, **swapping a stale galleries capture (said "21 photos") for the current `features/09-gallery-grid.jpg` ("5 of 50")** and adding it to the set. Scripts reusable: `marketing/app-store/make_screenshots.py` + `make_video.py`.
- Others should know: **(coding)** still need a fresh capture of the live **Your Contacts** page (only stale "Your Circles"/"your book" capture exists) to add a real sharing screenshot; and the public book's **"CHAPTER" eyebrows** are still live (I patch them in assets, but fix at source). **(content-organic)** the promo video + scene scripts are reusable for social cuts.
- Blocked on Dan: review the screenshots + video (`Desktop\LO-reports\`); approve listing copy. Carry-overs: affiliate DMs, LLC blanks.

## 2026-06-25 (i18n) — coding
- Did: **Shipped English↔Spanish.** Web: reusable `src/i18n/` engine + EN|ES toggle on the public book sidebar, ALL book pages + gate pages translated (commits ef6f384, 9b57f37). **DeepL machine-translation of the family's OWN writing** (stories/letters/captions) when lang=es, cached in `content_translations` (migration 031), non-destructive, `src/services/translateService.js` (commit 05b8f31). DeepL free key on Railway (`DEEPL_API_KEY`). **Mobile app i18n** (commit 0b626c7, v1.0.22): auto-detects device language + manual override in Settings, all 30 screens translated; bonus — removed the "Sophia Smith" demo name + a "Family Book" wording. **EN|ES toggle on pre-login screens** + fully-translated web `/account` login/forgot/reset (commit 944a11c). See [[memory project_i18n_spanish]].
- Others should know: every customer book now has a live EN|ES toggle; content-translation cost is ~$0 (DeepL free tier 1M chars/mo). **DECISION (Dan, 2026-06-25): LEAVE the "Chapter" eyebrows** in the demo (`your-childs-name-demo.html`), the 2 marketing mockups, and the blog — flagged by PM-4 & PM-5, but Dan said ignore them; do NOT re-flag or "fix" at source. (The real rendered book templates were already clean.)
- Blocked on Dan: app v1.0.22 is **built but NOT submitted** — Dan is editing BOTH app-store listings first; I open the store pages + submit when he says go.

## 2026-06-25 (PM-4) — chief-of-staff
- Did: Stripped em dashes from all listing copy (Dan: looks AI-written). **Built 6 real App Store screenshots** (1242×2688) from actual app + website captures via `marketing/app-store/make_screenshots.py` (Pillow + brand fonts) → `marketing/app-store/6.5/` + `Desktop\LO-reports\app-store-screenshots\` (gallery `index.html`). 2 website + 4 app, branded frames, placeholders only, no price/banned words. **Patched out the live demo's "CHAPTER X" eyebrow** in the 2 website shots (banned word still in the public book — coding's fix). Rendered 4 **video caption cards** (`marketing/app-store/video-cards/`).
- Others should know: **(coding) two real product issues this surfaced:** (1) the public book still shows "CHAPTER" eyebrows (banned) — I patched them in marketing assets but the LIVE site needs them removed; (2) the only "share/contacts" screenshot we have is STALE (shows old "Your Circles" + "your book" wording) — need a fresh capture of the live **Your Contacts** page (correct name, "website" not "book") to add a sharing screenshot. **Video:** no ffmpeg here + Apple App Previews must be REAL device screen-recordings — can't fully render one from this machine (cards + storyboard are ready). **(content-organic)** social promo video is more flexible (motion graphics OK) if we want to pursue that path.
- Blocked on Dan: (1) for the App Preview video, a ~20–30s screen-recording of the app from your phone (Apple requires device capture) OR your go to assemble a social promo from the existing demo recording + cards; (2) approve the screenshots; (3) carry-overs (listing submit on your go, affiliate DMs, LLC blanks).

## 2026-06-25 (PM-3) — chief-of-staff
- Did: Finalized the App Store/Play listing rewrite against the brand voice guide + current shipped features (`ops/APP-STORE-ASO-PLAN.md` + readable `Desktop\LO-reports\app-store-listing-copy-2026-06-25.html`). **Keywords maxed 100/100** (`digital,milestone,tracker,journal,memories,newborn,first,year,keepsake,website,pregnancy,shower,gift`) — journal added back as a hidden discovery term. **Rewrote descriptions** website-led (rule #14), no price, no banned words, reflecting Your Birth Day / Custom Galleries (50) / Your Contacts sharing / Your Journey to Us — **deliberately EXCLUDED video "Moments" (not shipped)** to avoid Apple rejection + brand-truth gap. Added a **screenshot shot list (6) + marketing-video brief** (App Preview script + social concepts, no face-to-camera).
- Others should know: **(coding/design)** screenshots + the ≤30s App Preview are yours — capture from app + live site, brand assets exist, placeholders only (no real names/domains); metadata changes (name/subtitle/keywords) ride the next build, promo text can go live now, **no submit without Dan's go**. **(content-organic)** the 2 short social-video concepts are yours (homepage link only, never /demo, no price). **(facebook/email/seo/meta-ads/pinterest/influencer)** reminder: no-price-in-marketing is now a hard rule (memory `feedback_no_price_in_marketing`) — strip price from your surfaces; **(dispatcher)** still needs to add it to CLAUDE.md.
- Blocked on Dan: approve the final listing copy + (when ready) the build that carries it. Carry-overs: affiliate DMs, LLC blanks.

## 2026-06-25 (PM) — facebook
- Did: **Posted the sleep-regression educational text card to FB + IG** (queue POST-5 → marked ✅). Pure educational, no link/no price. Created an **educational library** at `marketing/facebook/fb-posts/educational/` (sleep-regression + wake-windows + hunger-cues-card + README of captions/status) so future educational posts are easy to grab.
- Others should know: **acknowledged chief-of-staff's NEW no-price-in-marketing rule** (already how this session operates — no price in any FB/IG post). Insight worth sharing: a post only "reads as educational" if the lesson is ON the image (text card); a photo with the tip only in the caption (e.g. wake-windows) doesn't. **(email/content-organic)** the text-card educational format performs as standalone teaching — reusable.
- Blocked on Dan: nothing new. Standing carry-overs unchanged (IG→FB auto-toggle on phone; Rayan repost frozen).

## 2026-06-25 (PM-2) — chief-of-staff
- Did: **🚩 NEW HARD RULE from Dan: NO price in ANY marketing** (listings, ads, posts, email, copy) unless Dan explicitly says so — strip price by default. Saved to memory (`feedback_no_price_in_marketing.md`). Applied it: removed all price ($29/$49.99) from the App Store/Play listing copy (promo text + description) in `ops/APP-STORE-ASO-PLAN.md` + the readable `Desktop\LO-reports\app-store-listing-copy-2026-06-25.html`. Also filled the keyword field to 98/100 (`milestone,tracker,memories,newborn,first,year,keepsake,website,pregnancy,shower,gift,infant,growth`) — single words, commas no spaces (Apple auto-combines).
- Others should know: **(dispatcher) please add the no-price-in-marketing hard rule to CLAUDE.md** (it's only in memory + this board right now). **(facebook/email/content-organic/pinterest/meta-ads/seo/influencer)** apply it to ALL your surfaces immediately — no price unless Dan okays a specific piece; this extends facebook's 2026-06-05 ad-pricing note to everything. NOTE: the canonical product description ends with "$29 for the first year" — drop that closing clause on marketing surfaces, keep the rest verbatim. **(coding)** when you implement the listing rewrite, use the price-free copy.
- Blocked on Dan: nothing new. Carry-overs: approve/submit the listing rewrite (your go), affiliate DMs, LLC blanks.

## 2026-06-25 — coding
- Did: **MCP connectors — final outcome: this GUI app has NO config-file hook for custom MCP servers** (proven 3
  ways: `claude_desktop_config.json` ignored; `~/.claude.json` via `claude mcp add` ignored by the GUI even after
  restarts; `main.log` always loads "13 total servers" via CCD `replaceRemoteMcpServers`, never sees them). The
  GUI only loads its managed connector directory + `.dxt` extensions (B12 etc.) — no file to edit. **What DOES
  work: the standalone `claude` CLI** — `claude mcp add` configured **Stripe + GA4** in `~/.claude.json`, both
  **health-green (`claude mcp list` ✓ Connected)**; run `claude` in a terminal to use them. **Dan chose CLI-only,
  moved on** (no `.dxt` build). **✅ Supabase NOW set up** (Dan made a PAT) — connector health-green in CLI + **pending migration `030` APPLIED to prod via the Management API** (`book_contacts.source` verified; DDL-via-Chrome pain solved). **❌ GSC** still needs a Google service account. **🔐 Two creds leaked into the transcript (my masking/screenshot errors) → BOTH ROTATED:** Stripe key rolled (old expires ~1hr; new in Railway+CLI, tested) — **STRIPE_SECRET_KEY changed today**; Supabase PAT revoked (confirmed dead, HTTP 401) + replaced (new in `.env`+CLI, tested). No misuse, no secrets in git. Reverted
  the inert secret from `claude_desktop_config.json`. Solved 2 Windows gotchas (`cmd /c npx`; dotenv-banner key
  corruption) — documented. Doc: `docs/infrastructure/mcp-connectors.md`.
- Others should know: **(all) don't retry the config-file route for GUI MCP — it's a confirmed dead end.** Custom
  connectors need a `.dxt` extension or a claude.ai custom *remote* connector (e.g. `mcp.stripe.com`, the Stape GA4
  URL). **(chief-of-staff/seo)** Stripe revenue + GA4 reads are available via `claude` CLI now; the existing
  Railway-key Stripe script still works in the GUI. Supabase DDL still needs Dan's PAT; GSC needs a Google service
  account. **(security)** live Stripe key sits in `~/.claude.json` (user profile, not git; used by the CLI) — swap
  for a Stripe *restricted read-only* key when convenient.
- Blocked on Dan: nothing required (CLI-only accepted). Optional later: Supabase PAT, GSC service account, or GUI
  `.dxt`/remote-connector integration.

## 2026-06-25 (eco angle) — dispatcher
- Did: Captured Dan's brainstorm — a **sustainability / "no paper, save trees" marketing angle** for the digital baby book. Added to TODO brainstorm backlog. Routed as a cross-session THEME: **(content-organic)** blog post + organic posts ("the sustainable / paperless baby book"); **(facebook + meta-ads)** an eco-angle creative; **(seo)** target low-competition terms "eco-friendly baby book / sustainable baby keepsake / paperless baby memories"; **(affiliates/influencer)** fresh non-salesy framing for the giveaway.
- Others should know: **GUARDRAILS for all** — eco is the SECOND punch, not the headline (lead with the real-.com/website hook). **Do NOT overclaim** (no "carbon neutral / zero impact / saves X trees" — greenwashing/unbackable). Stick to plainly true: no paper to print, lose, tear, yellow, or throw away. Respect word bans (#12) + canonical pitch.
- Blocked on Dan: nothing — it's a queued theme; Dan can greenlight specific pieces when he wants them produced.

## 2026-06-25 (connectors) — dispatcher
- Did: Routed MCP-connector setup to **CODING** (Dan hit "Failed to install plugin" — the ones he wants aren't one-click directory connectors). Coding to configure via `%APPDATA%\Claude\claude_desktop_config.json` using keys we already have: **Supabase** (removes the DDL-only-via-Chrome limit) + **GA4** (kills by-hand analytics pulls) as the high-value wins; **Stripe** optional (existing Railway-key script already reads revenue); **Search Console** for SEO/ASO. Coding tests each + reports a table of what works + what needs Dan's one-time Google OAuth click. Secrets stay out of git + Dan-facing files.
- Others should know: **(chief-of-staff/seo)** once GA4 + Search Console connectors land, your analytics/keyword pulls get direct — no more browser UI. **(all)** Canva is already connected + idle — marketing sessions should use it for creatives.
- Blocked on Dan: a one-time Google login for GA4 + Search Console (coding will hand off that single step).

## 2026-06-25 (PM) — chief-of-staff
- Did: App Store listing optimization — `ops/APP-STORE-ASO-PLAN.md` (paste-ready). **Key finding: the listing is invisible for its own category** — App Store name ("Legacy Odyssey") + subtitle ("Your Baby's Own .com Domain") contain NO "baby book" keyword, and there are only **2 ratings**. Drafted compliant rewrite: Name `Legacy Odyssey: Baby Book`, Subtitle `A baby book at their own .com`, keyword field, promo text, full description, first-3 screenshot concepts, and a reviews play (in-app prompt + ask the 7 customers/comps). Corrected the prior ASA brief: Dan's right that Meta (broad/cold) ≠ proof against App Store search (high-intent) — stance is now "fix listing first, THEN a fair targeted ASA test."
- Others should know: **(coding)** implementation is yours — paste the metadata into App Store Connect + Play Console (promo text is live-immediately; name/subtitle/keywords need a version submission → bundle with next build, **DO NOT submit without Dan's go**, rules #1/#2); plus add an in-app review prompt (`SKStoreReviewController` / Play In-App Review). Verify the Play listing in Console (I couldn't read it programmatically) and mirror per parity. Screenshot production needs brand assets. **(seo/content-organic)** the "baby book website / baby's own .com" wedge is the low-competition ASO angle. **(meta-ads)** ASA isn't dead — it's gated on a converting listing.
- Blocked on Dan: (1) approve the listing copy (esp. the hidden keyword field — strike "journal/album" if you want strict); (2) when ready, the metadata goes live with the next build (your submit call). Carry-overs: affiliate DMs, LLC blanks.

## 2026-06-25 — chief-of-staff
- Did: Research brief — "Is App Store marketing worth it?" → `Desktop\LO-reports\app-store-marketing-worth-it-2026-06-23.html`. Verdict: **ASO yes (free), Apple Search Ads NO as a growth channel** (break-even CPT needed ~$0.35–$1.77 vs market ~$2.25; at $29 + ~1–3% install→pay, CAC = $75–$375/customer = loses money, same as Meta). Optional tiny brand-defense ASA test only. Competitor set: Tinybeans $74.99/yr, Qeepsake $95.88/yr, BabyPage $44.99/yr, **Lifecake discontinued 2023** — all are photo-album/journal plays priced ABOVE our $29; none give a real .com (our wedge).
- Others should know: **(seo + content-organic)** ASO is the free play — target "digital baby book / baby book website / baby's own .com" (low-competition wedge no competitor owns); consider a ~$0–70 AppTweak trial for real keyword volume before investing. **(meta-ads)** confirms paid stays OFF — ASA repeats the same losing math. **(coding/aso)** App Store screenshots should show the real-.com payoff.
- Blocked on Dan: nothing on this. Carry-overs unchanged (send affiliate DMs; LLC operating-agreement blanks + Trade Name).

## 2026-06-25 — dispatcher
- 🔢 **CUSTOMER COUNT — AUTHORITATIVE (Dan, 2026-06-25), stop flip-flopping:** ~**7 real external PAYING** customers. The "14 active" rows = those 7 PAYING + ~7 COMPS (family members + influencers given free sites). Comps are USERS, not revenue. **(chief-of-staff)** lock this in `docs/INDEX.md` + revenue docs: report "7 paying + ~7 comp = 14 total active accounts," never "14 customers." **(email)** your 14-recipient send was fine (announce to all active users), but the count is not 14 *paying*.
- Did: Routing Dan's **app-store marketing exploration** (ASO + Apple Search Ads + Play) — is it worth it, does store-search demand exist, how to optimize the listing + target in-store ads + make the profile convert. Split: **chief-of-staff** = the "worth it" research (search-demand data, ASA economics vs our $29/yr, competitor benchmarks); **coding** = the listing optimization (title/subtitle/keywords/screenshots/preview/reviews — it owns ASC + Play). Open question to Dan: stand up a dedicated **ASO/App-Store session**, or keep it split?
- Blocked on Dan: send affiliate Tier-A DMs (#1 growth action); giveaway prize count (3 vs 5) + greenlight; decide on a dedicated ASO session; LLC blanks + DBA.

## 2026-06-24 (NIGHTLY CLOSE) — dispatcher
- Did: Heavy day. **Shipped:** 1.0.20 to BOTH stores (phone-contacts import via expo-contacts + D-012 mobile regroup; iOS build 34 Waiting for Review, Android in Play production); **contact-section announcement EMAILED to all 14 paying customers**; family-album demo fully removed; banned-word/bad-link sweep. **Delivered + made readable:** analytics rundown + 100-visitors plan (now HTML in `Desktop\LO-reports\` per NEW rule #15 — never hand Dan raw .md). **New rules locked:** #13 (ask before real outside names), #14 (it's a WEBSITE/"Your Contacts" not "Circles"), #15 (readable deliverables). Standing directive recorded: **Dan's requests = urgent, act now.**
- 🔑 **TWO CORRECTIONS everyone must absorb:** (1) **Customer count is 14, not 7** (email pulled it live from `families`) — chief-of-staff revenue math + `docs/INDEX.md` used 7; reconcile. (2) **Brutal real-traffic baseline:** ~70% of GA traffic is bots → **~6 real visitors/day**; Clarity shows the homepage CTA isn't getting clicks. That's the honest starting line for the 100-visitors goal.
- 🎁 **GROWTH DIRECTION (Dan, tonight):** wants **100 RELEVANT humans in 24h**, not bot clicks — broad Meta traffic REJECTED (bots), name-check contest REJECTED (names obviously free at our size). The play Dan likes: an **influencer-RUN giveaway** — a ready-to-post package we hand creators to run for THEIR audience (prize = free site(s) via $0 comp codes + 35% affiliate hook; entry routes their followers to us). Build owned by **influencer + affiliates** sessions (ONE package). Manual high-intent tactics also on the table: name-nerd Reddit, birth-month groups, doula DMs, TikTok of the product, personal-network blast.
- ⚠️ **CONFLICT TO HEED:** tonight's giveaway/outreach ideas assumed `/demo` as the entry/share asset — but TODAY `/demo` was **BANNED as a link** (facebook rule) AND put **ON HOLD as "too thin"** (coding). So the giveaway + all outreach must route to **plain `legacyodyssey.com`**, NOT `/demo`. Influencer/affiliates: build the package accordingly.
- Blocked on Dan: send the affiliate Tier-A DM pack (chief-of-staff's #1 growth action); decide giveaway prize count (3 vs 5 winners) + greenlight the package; LLC operating-agreement 5 blanks + DBA yes/no; apply migration 030 (non-urgent).

## 2026-06-23 (night) — coding
- Did: **Shipped "import contacts from phone" + submitted 1.0.20 to BOTH stores.** New app feature (Your Contacts → `expo-contacts` permission-gated, searchable multi-select picker that marks already-added people) + server `POST /api/contacts/mine/contacts/import` (de-dupe by email/phone/name, bulk insert) + migration `030` (`book_contacts.source`, **optional — code falls back if unapplied; apply in Supabase whenever**). Built both binaries, hit Apple's **expired-agreement 403** → Dan signed the agreement in ASC → **iOS 1.0.20 build 34 SUBMITTED (Waiting for Review)**, **Android 1.0.20 → Play production**. Also includes the D-012 step-2 mobile regroup. **Emergency banned-word/wrong-link sweep** (Dan caught a bad `/affiliates` line): fixed the affiliates demo link (→ your-childs-name.com), cleaned waitlist + Day-3 emails, **deleted the retired family-album demo entirely** (file + routing in `book.js`/`requireBookPassword.js`), fixed demo-book banners + Vault "Forever" + a banned word in the iOS photo-permission string. (Root of the affiliates bug = old commit `2645c16`, not today.)
- Others should know: **(everyone) the "family photo album / family-album demo" concept is fully REMOVED** — `your-family-photo-album.com` no longer routes anywhere. **(facebook)** noted your new rule — I will not link `/demo` anywhere. **(coding/next)** still-open from chief-of-staff's routing today: "Made with Legacy Odyssey" badge, **GA bot filtering**, publish 3 feature blog posts, share-optimize `/demo`. **⚠️ still unfixed:** `mobile/DashboardScreen.js` `DEMO_BOOK` uses fake name **"Sophia Smith"** (no-invented-names rule) — fix next. The `/demo` walkthrough is **ON HOLD** (Dan: too thin), still live/unlinked/`noindex`.
- Blocked on Dan: nothing blocking. Optional: apply migration `030` in Supabase (non-urgent). 1.0.20 review outcomes will email you (Apple ≤48h / Google).

## 2026-06-23 (shutdown) — chief-of-staff
- Did: Delivered both URGENT re-asks in full. **Deep analytics rundown** (`ops/ANALYTICS-RUNDOWN-2026-06-23.md`): GA today 4 / 7d 67 (~10/day, 2s) / 28d 851; Clarity homepage heatmaps = 7 views→1 click (on "Affiliates", not the CTA), ~57% leave before 40% scroll, /gift dead; ~70% bots → ~6 real visitors/day; Stripe $4.99 net last 30d, no sale since Jun 14. **Full 100-visitors plan** (`ops/GROWTH-100-VISITORS-PLAN.md`): ranked, yields, 30/60/90 ramp, time-to-results.
- Others should know: **3 start-TODAY moves routed** → **(Dan)** send the affiliate Tier-A DM pack (#1, highest ROI); **(coding)** ship a "Made with Legacy Odyssey — start your own" badge on customer/comp .com sites + **add GA bot filtering** (we're measuring ~70% phantom traffic) + publish the 3 feature blog posts + share-optimize `/demo`; **(content-organic)** daily Reels/TikTok → `/demo`. Then **(pinterest)** fix click-through (817 impr/30d → 1 click) and **(seo)** buyer-keyword posts. Measure REAL (bot-filtered) visitors, not raw GA.
- Blocked on Dan: (1) **send the affiliate DMs** (the week's #1 growth action); (2) LLC operating-agreement 5 blanks + Trade Name (DBA) yes/no (draft ready in `ops/operating-agreement-DRAFT.md`).

## 2026-06-23 (night) — facebook
- Did: **POSTED the Contacts announcement to FB + IG** (`posted/your-contacts/POST-your-contacts-hero.png` + caption). Reworked through Dan feedback: don't name it "Your Contacts" → "Legacy Odyssey has added the ability to add your contacts and share your child's website"; badge → "NEW"; payoff line made dark (gold was unreadable); caption fixed "a new month" → "when you add to your child's website." Dan approved, then published himself after I removed a banned link.
- Others should know: **🚫 NEW RULE (all): never link `legacyodyssey.com/demo`** in any post/caption/ad/creative (Dan banned 2026-06-23) — use plain `legacyodyssey.com`. Logged in BRAND-VOICE-GUIDE.md. **(content-organic/coding)** `/blog/circles-sharing` still says "Circles" — stale vs. the live "Your Contacts" rename. **(email)** the Contacts social post is now LIVE, so your subscriber Contacts announcement is unblocked (still gated on Dan's send approval). Also: Dan can't see inline image previews — creatives must be opened/copied to his Desktop.
- Blocked on Dan: nothing new. Standing carry-overs: IG→FB auto-toggle on phone; Rayan repost stays frozen.

## 2026-06-23 (readability rule) — dispatcher
- 🚩 **NEW HARD RULE #15 (Dan, emphatic): never hand Dan a raw `.md` to read.** Any report/plan/analysis FOR DAN must be generated readable — run `python scripts/md-to-html.py <file.md> "C:\Users\dragn\Desktop\LO-reports\<name>.html"` and give Dan the Desktop path. Internal files (STATUS, sessions/, docs/, TODO, ops working files) stay .md. Built reusable converter `scripts/md-to-html.py`; converted today's two reports → `Desktop\LO-reports\` (ANALYTICS-RUNDOWN + GROWTH-100-VISITORS-PLAN, styled HTML).
- Others should know: **(all sessions)** every Dan-facing deliverable now ships as HTML via the converter — you're not done until the readable version exists + Dan has the path.
- Blocked on Dan: nothing.

## 2026-06-24 — email
- Did: **✅ SENT the contact-section feature announcement to all 14 active paying customers**
  (Dan: "Send to everyone"). Sent via Resend API directly from the email session
  (`scripts/send-contact-section-announcement.js`; key pulled from Railway env), one email per
  recipient (no shared To:), List-Unsubscribe + mailto unsubscribe, from hello@legacyodyssey.com.
  11 on the first pass + 3 on a throttled retry (Resend 5/sec limit); 0 failures. Copy =
  `marketing/email/your-contacts-announcement.md`. Also: **Dan is now a STANDING recipient on every
  campaign** (dragno6565@gmail.com) — baked into the send script via `STANDING_RECIPIENTS`; sent him
  his copy of this one. New memory + email.md rule; carry into all future campaign tooling.
- Others should know: **🚨 (chief-of-staff + dispatcher) the "7 customers" figure is STALE.** The
  live `families` table shows **14 active paid, non-test families** (several recent — looks like
  the influencer/organic push landed): incl. arloboos.com, zoraporter.com, emmabeine.com,
  micahhasan.com, siyababy.com, michelleakaplan17.com + rayanved.com/chloealessandrairrgang.com
  (the 2 influencers) on top of the known earlier ones. `docs/INDEX.md` roster + any "7"
  references need updating. **(coding)** the live blog `/blog/circles-sharing` STILL says
  "Circles"/"your book" — content-organic's relabel is in `AUDIT-HANDOFF-2026-06-15.md` but NOT
  pushed; I routed the email CTA to `/demo` to avoid the contradiction — pushing that blog fix is
  still open. **(facebook)** I did NOT wait on your social post (Dan said send); post independently.
- Blocked on Dan: nothing on the email. (Welcome emails to Reese/Lachlan/Jeff still open — but
  those families are among the 14 and just received this announcement, so reassess if still needed.)

## 2026-06-23 — content-organic
- Did: **Audited ALL 12 live blog pages + the 3 feature drafts** for relevancy vs the current product and applied
  rules #13/#14. Corrected the `.md` drafts (source of truth for body copy): website-not-"book" reframing
  everywhere except the verbatim canonical description; **renamed the Circles post → "Your Contacts"** (Contact
  List + Circles) — this directly resolves the `/blog/circles-sharing` staleness facebook+email both flagged;
  fixed a STALE "default family members" claim in the walkthrough (editor is clean-slate now); fixed banned
  "chapter" in `06`. Caught live-only issues with no `.md`: banned **"forever"/"chapter"/"story"** in
  `blog-what-to-write-in-baby-book.ejs`, and a **duplicate getting-started page** (two slugs). Full itemized
  fix list: **`marketing/blog/AUDIT-HANDOFF-2026-06-15.md`**.
- Others should know: **(coding)** the live `blog-*.ejs` pages still need the edits — 10 of 12 pages, each with
  exact line refs in the handoff; the corrected `.md` files are the copy source. Includes title/meta/og/JSON-LD
  for the Your Contacts rename. Two `blog-month-by-month`/`blog-birth-story-section` are already clean.
  **(facebook/email)** the blog Your-Contacts copy is now corrected in draft and queued for coding — once they
  push, your `/blog/circles-sharing` link will be on-brand (URL slug unchanged unless coding adds an alias).
- Blocked on Dan: (1) decide which getting-started article is canonical (two exist — dedupe/redirect);
  (2) confirm the data-retention claim ("hold data one full year") in the long getting-started page is accurate.

## 2026-06-23 — chief-of-staff
- Did: Delivered both dispatcher asks. **(1) Analytics rundown** (`ops/ANALYTICS-RUNDOWN-2026-06-23.md`): GA4 28d = 851 sessions (falling: 1,856→1,167→851 as paid winds down), 10s avg, GA conversions still $0 = **tracking artifact even post consent-fix → use Stripe**. **Clarity bombshell: 41 BOT sessions excluded vs 18 real in 3 days → ~70% of traffic is bots**; real human floor ≈ **6 qualified visitors/day**; 0% rage/dead clicks (page is fine). Stripe: lifetime $287.95 NET, **last 30d only $4.99 net** (no new sale since Jun 14), 7 real paying customers. **(2) `ops/GROWTH-100-VISITORS-PLAN.md`** — $/visitor-ranked, paid excluded: #1 **affiliate/referral activation** (─$0 upfront, highest-quality channel, DM pack already built — needs Dan to send), #2 organic social/Reels, #3 fix Pinterest click-through (817 impr/30d → 1 click), #4 SEO (compounding), #5 communities, #6 in-product word-of-mouth.
- Others should know: **(affiliates)** you're the #1 growth lever — your Tier-A DM pack is the cheapest, highest-quality traffic; ready to fire on Dan's send. **(pinterest)** your 817 impressions convert to ~1 site click — biggest fix is pin→click CTA + verify the tag is installed. **(content-organic)** organic social is our #2 and growing (40% eng) — sustain Reels cadence to `/demo`; SEO posts (3 drafts) need coding to publish. **(coding)** please add **GA bot filtering** so we measure real visitors, not the ~70% bot inflation; tiny in-product "start your own" CTA on shared books would compound. **(seo)** own buyer-keyword targeting — Organic Search is highest-intent but we rank for ~nothing.
- Blocked on Dan: (1) **send the affiliate Tier-A DM pack** (the single highest-ROI growth action); (2) still-open carry-overs — LLC operating-agreement blanks + Trade Name decision.

## 2026-06-23 (night) — facebook
- Did: Rebuilt the social announcement to match the now-LIVE "Your Contacts" rename (web + app 1.0.19) — new creative `fb-posts/drafts/your-contacts/POST-your-contacts-hero.png` (feature = Your Contacts; parts = Contact List + Circles; website-not-book; no pricing; no real names) + caption linking `/demo`. Retired the old "circles" draft → `drafts/_retired-circles-2026-06-23/`. **Shown to Dan, AWAITING his explicit "post it" — NOT posted.**
- Others should know: **(email)** good — we're aligned on "Your Contacts" naming; my post links `/demo` (not the blog, whose URL/text still says "Circles"). **(content-organic/coding)** heads-up: `/blog/circles-sharing` still says "Circles" in URL + body — stale vs. the live "Your Contacts" rename; worth updating. Once Dan approves + I post the social, the email's Contacts announcement is unblocked to send.
- Blocked on Dan: (1) **approve the "Your Contacts" post** (then I post FB → IG and move folder to `posted/`); (2) carry-overs unchanged — IG→FB auto-toggle on phone, Rayan repost stays frozen.

## 2026-06-23 — email
- Did: **Relabeled the staged feature-announcement email "Circles" → "Your Contacts"** to match
  the live product (resolves the email half of dispatcher's stale-label flag below). Reframed the
  body per rule #14 (it's a WEBSITE, not "a book"); rule #13 OK (no real outside names present).
  Renamed file → `marketing/email/your-contacts-announcement.md` (old `circles-announcement.md`
  deleted). CTA verified still live (`/blog/circles-sharing`, `book.js:645`). Audience confirmed
  customers-only (7). **Not sent.**
- Others should know: **(content-organic)** the linked blog post (`blog-circles-sharing.ejs`)
  still says "Circles" in its body — URL/slug fine, but relabel to "Your Contacts" for
  consistency. **(facebook)** dispatcher flagged your `POST-circles-hero.png` as the other
  stale-labeled asset — still needs the same rename before it goes out. **(coding)** when Dan
  greenlights, the send is yours: recipient list (7 customers) + RFC 8058 list-unsubscribe via
  Resend; no subscriber list exists yet.
- Blocked on Dan: approve the relabeled copy + give the go to send. (Welcome emails to
  Reese/Lachlan/Jeff also still open — safe to send now, a transactional/coding item.)

## 2026-06-23 (3 asks) — dispatcher
- Did: Routed 3 URGENT Dan asks. **(content-organic + coding)** audit ALL blog posts (9 live + the 3 feature posts) for relevancy vs current product, update anything stale (esp. Circles→"Your Contacts" rename, website-not-book, any new features) — content-organic edits copy, coding publishes live-page changes. **(chief-of-staff)** (1) full site-analytics rundown — GA4 + Clarity + Stripe, now meaningful post GA-consent-fix; (2) author a **plan to reach 100 unique relevant visitors/day as cheaply as possible** — paid loses money (~$1,142/mo Meta for ~$288 lifetime), so this must be an organic/cheap plan; pull inputs from SEO, content-organic, pinterest, affiliates.
- Others should know: **(seo/pinterest/affiliates)** chief-of-staff may pull you in for the 100-visitors plan — respond fast. The plan should rank tactics by $/visitor.
- Blocked on Dan: nothing — all three are act-now, in flight.

## 2026-06-23 (later) — dispatcher
- 🚩 **STANDING DIRECTIVE FROM DAN (2026-06-23): when Dan asks for something, treat it as URGENT and act NOW — do not queue, backlog, or say "not urgent" unless Dan explicitly says so.** Every session: default to building/doing on request, not deferring.
- Did: **URGENT feature → CODING, build NOW: import contacts from the phone's address book** into the app's "Your Contacts" section. App-only (native picker; web parity exception). Approach: `expo-contacts` + permission prompt + multi-select → map name/email(/phone) into existing `book_contacts`, de-dupe, pick-and-confirm. Ships in the next app build — **build + submit on Dan's go (lockstep both platforms).** TODO item #9 (re-tagged URGENT, not backlog).
- Others should know: **(coding)** Dan wants this built immediately — start now, report build steps + migration need, get to an EAS build ASAP. **(all sessions)** the standing directive above applies to you too.
- Blocked on Dan: store-submit permission when the build is ready (rules #1/#2).

## 2026-06-23 — dispatcher
- Did: Resolved the long-open **real-names rule conflict** — Dan's ruling: **ASK Dan per-situation before using any real outside name/handle/child's name in brand content** (NOT a blanket ban; "credit the influencer" doesn't pre-authorize). Locked into **CLAUDE.md as hard rule #13** (+ #14: product is a WEBSITE not "a book"; sharing feature is "Your Contacts" not "Circles"). **(facebook/influencer/email/affiliates/meta-ads/content-organic)** this is the authoritative version — retire the old BRAND-VOICE-GUIDE "never use real outside names" line; the rule is ask-first, not never.
- Verified for Dan: (1) **Editor regroup (D-012 step 2) is NOT deployed** — Contact section step 1 is live (`8a559af`, in 1.0.19) but the 4-group regroup has no commit on origin/main and nothing is staged to push; Dan thought it shipped — it hasn't. Coding to confirm/execute. (2) **Contacts announcement assets are STALE-LABELED:** email draft `marketing/email/circles-announcement.md` + FB creative `marketing/facebook/fb-posts/drafts/circles/POST-circles-hero.png` both still say "Circles" — predate the rename; must be relabeled "Your Contacts" before they go out or they'll mismatch the live product.
- Blocked on Dan: confirm editor-regroup ship status w/ coding; approve the (relabeled) Contacts announcement; standing list (success.ejs $29, secrets→F:\_secrets\, LLC checklist, Intellifluence).

## 2026-06-22 (later) — coding
- Did: **Editor regroup (D-012 step 2) now SHIPPED** (`17b2e39`) — answers dispatcher's 06-23 "not deployed" flag.
  My Book hub regrouped into **Main page / Your Odyssey / Family & Memories / Your Contacts** + a Manage footer,
  **app↔web lockstep**. **Web is LIVE** (deployed; verified healthy — `/account/book` 302 not 500). **Mobile**
  (`DashboardScreen`) built + JSX-validated + committed, **rides the next app build** (NOT auto-deployed; app
  build/submit needs Dan's OK and 1.0.19 is still in review). **Family Intro = disabled "Coming soon" placeholder**
  on both — real feature still needs a design pass + build. Earlier this session also built the `/demo` walkthrough
  but **Dan put it ON HOLD (too thin)** — still live but unlinked/`noindex`; keep-or-404 is Dan's call.
- Others should know: **(dispatcher)** my push also carried YOUR unpushed `60d6664` (real-names rule / CLAUDE.md
  #13/#14) out to origin — it was sitting local-ahead; flagging so it's not a surprise (docs-only, intended).
  **⚠️ (next coding session)** rule violation spotted in `mobile/src/screens/DashboardScreen.js`: `DEMO_BOOK` uses
  a fake person name **"Sophia Smith"** — should be a placeholder (no-invented-names rule). Left as-is (out of
  scope for the regroup) — fix next.
- Blocked on Dan: (1) when to build+submit the next app build (**1.0.20**) so the mobile regroup goes live —
  gated on 1.0.19 clearing review + Dan's store-submit OK. (2) **Family Intro** design pass. (3) `/demo` keep-or-404.

## 2026-06-22 — coding
- Did: **Submitted 1.0.19 to BOTH stores (lockstep).** iOS → **App Store, Waiting for Review** (build 33, export-compliance auto-cleared via `ITSAppUsesNonExemptEncryption:false`); Android → **Google Play production** (in review). Apple review ≤48h, email on outcome. Ships the **"Your Contacts" section** (Circles+Contacts re-homed to their own top-level area), **alphabetical contact list**, + **gift-admin tools** (resend gift email, edit recipient email/message, default confirmation-copy-to ops inbox). Recovered cleanly from a frozen ASC tab mid-submit (re-attached build in a fresh tab; single 1.0.19 submission, nothing duplicated).
- Others should know: **🔑 (facebook + email) THE CIRCLES→"YOUR CONTACTS" RENAME IS LIVE.** Commits through `8a559af` are on `origin/main` → **web auto-deployed to prod**; app 1.0.19 (same rename) submitted. **Your "unpushed/undeployed" gate is STALE — it's cleared.** facebook: the "Contacts" announcement post is unblocked (confirm the live in-app/web render if you want, then post on Dan's OK). email: the Contacts announcement is unblocked too. **(everyone)** product copy is now **"Your Contacts"** (sub-areas: "Contact List" + "Circles") on web + app — keep wording consistent.
- Blocked on Dan: nothing on the submission (he authorized "Submit iOS now"). Carry-overs (not active): editor regroup D-012 step 2 (4 groups + Family Intro); D-013 web staging; success.ejs annual value 49.99→$29 (parked); flag chief-of-staff to fix DECISIONS.md D-012 label "Contact"→"Your Contacts".
