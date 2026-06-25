# Legacy Odyssey — Master To-Do

> Living checklist of everything still open. Created 2026-05-27.
> Not committed to git (personal working list). Update as we go.
>
> **Business / legal / cost / vendor / hardware items live in `ops/`.**
> See `ops/BUSINESS-OPS.md` for the master view and `ops/DECISIONS.md` for
> open questions awaiting Dan. Engineering items stay here.

---

## ⚠️ Known parity exception (2026-06-23)
- **Import contacts from phone address book is APP-ONLY** (shipped in 1.0.20, `expo-contacts`). The web
  editor (`/account/book/circles`) has NO equivalent — browsers can't read the OS address book. Web users
  still add contacts manually. The shared server endpoint `POST /api/contacts/mine/contacts/import`
  (de-dupe + bulk insert) is generic, so if a web path is ever wanted, it could drive a CSV/vCard upload.
  This is an accepted lockstep exception (native-only capability), per Dan's spec.

---

## 💡 Brainstorm backlog (Dan, 2026-06-11 — captured by Dispatcher; not yet scheduled)

> Dan's forward-looking ideas. Each tagged with the owning session. When one gets
> picked up, move it into the owning session's plan / the right section below.

1. **[coding] Site menus + per-type "main" landing page.** Organize the navigation menus on
   customer book sites. Each site gets a proper "main" page (the first thing visitors see).
   We have the baby version today; design main-page variants for (a) FAMILY sites and
   (b) non-traditional / adopted kids. NOTE: lean on the existing "Your Journey to Us"
   section (migration 020, built for adoption/surrogacy/foster) for (b); (a) connects to
   the future Family Photo Album SKU (your-family-photo-album.com demo).
2. **[coding] Language toggle — English/Spanish first.** Viewer-side i18n on the book sites
   (and eventually editor/app). DESIGN NOTE: build the i18n mechanism once — the India plan
   (TODO §Product & growth, Phase 3) wants a Hindi/English toggle later; ES is the pilot.
3. **[coding] Resettable live-demo account.** A demo book Dan can build IN FRONT of people
   (use the app, content appears on the website live), then wipe back to a clean slate with
   one action afterward. Think: dedicated demo family + a "reset demo" admin button that
   restores a known-clean snapshot. Different from the static your-childs-name.com demo.
4. **[coding] Update your-childs-name.com** to showcase the newer features (galleries,
   Circles sharing, video, reposition, etc.). ⚠️ GATED on the demo deploy-source mystery
   (§Marketing & site polish below) — resolve where the live demo is served from FIRST.
5. **[coding] Family tree for family sites.** A visual family-tree (looks like a tree,
   grows as they add people); clicking a family member's name opens a short bio page.
   Likely builds on the existing family-members data + Family Member editor/bios.
   Big feature — needs design + migration + app/web parity plan.
6. **[facebook / content-organic] Demo videos.** Start producing them (C19 was parked when
   Descript flopped). Natural order: fix demo site (item 4) → record walkthroughs →
   short cuts for ads/social. Coordinate with item 3's live-demo account.
7. **[content-organic] Blog post per feature/section** — especially the new ones (Custom
   Galleries, photo reposition, Circles sharing, video/Moments when it ships). Joins the
   existing 9 live articles; SEO session should weigh in on titles/keywords.
   ✅ **2026-06-15 (coding): the first 3 are LIVE** — `/blog/circles-sharing`, `/blog/custom-galleries`,
   `/blog/reposition-photos` (content-organic drafts published as `blog-*.ejs` + routes + index +
   sitemap, `9c4c526`). Marketing screenshots for them in `marketing/screenshots/features/`.
   Also done 2026-06-15: GA branded-signup `purchase` tracking fix (`9c4c526`) + Microsoft Clarity
   live site-wide, project `x7mt9cszyp` (`a1146d9`). `purchase` was already a GA4 key event.
8. **[email] Feature-announcement emails to current subscribers** for each addition, linking
   to the matching blog post (item 7). Recurring motion, not one-shot: ship feature → blog
   post → subscriber email. Circles ("share your book with family") is the obvious first
   one since it just shipped. Coordinate with coding for the subscriber list/send mechanism
   (Resend) and respect unsubscribe handling.

9. **[coding] Import contacts from the phone's address book (Dan, 2026-06-23).** In the app's
   "Your Contacts" section, let users pull people straight from their phone contacts instead of
   typing each by hand. APP-ONLY by nature (native contact picker; web can't access it — note the
   parity exception in TODO per the parity rule). Design notes: use Expo Contacts (`expo-contacts`)
   with iOS/Android permission prompts; let the user multi-select; map name + email (+ phone for
   future SMS) into the existing `book_contacts` model; de-dupe against contacts already added;
   privacy-careful (request least data, don't bulk-upload the whole address book silently — pick-and-confirm).
   Ties into Circles Phase 3 (the TODO §Circles "import phone contacts" line already anticipated this).

10. **[marketing theme — content-organic / facebook / meta-ads / seo] Sustainability / "no paper" angle (Dan, 2026-06-25).**
    Market the digital baby book as the eco choice: no paper to print, lose, tear, yellow, or throw away.
    GUARDRAILS: secondary punch (lead with the real-.com hook, not "save trees"); NO overclaiming
    (no "carbon neutral / zero impact / saves X trees" — greenwashing/unbackable); true claims only.
    SEO wedge: "eco-friendly baby book", "sustainable baby keepsake", "paperless baby memories" (low-comp).
    Pieces: blog post, eco creative, Earth Day/seasonal beat, fresh framing for the giveaway.

---

## 🤝 Affiliate program — Rewardful (✅ LIVE + verified, 2026-06-08)

Code integration for the "Friends of Legacy Odyssey" affiliate program (35% recurring).
Source of truth: `docs/infrastructure/rewardful.md`. **MERGED to main + DEPLOYED + verified
end-to-end on Rewardful** (merge `6e6cbd6`). Verification: created a real test affiliate
(`?via=ztest`), visited the live site → `rw.js` loaded, `api.getrewardful.com/referrals/track`
fired, Rewardful minted a referral UUID, and the affiliate's dashboard showed **Referrals: 1**.
Test affiliate deleted afterward (account clean). NOTE: Rewardful's "Add Rewardful to your
website" banner is a generic nag that only clears after the first paying conversion — NOT an
installation detector; tracking is confirmed working. **Recruitment is now unblocked.**

- [x] **Task 1 — Rewardful JS snippet** added to `<head>` of all 28 public marketing pages (key `0a0312`). Commit `dd2ed36`.
- [x] **Task 2 — Stripe `client_reference_id`** passed from `window.Rewardful.referral` through 4 checkout endpoints (create-checkout, create-founder-checkout, create-founder-page-checkout, create-childhood-checkout), set only when present. Commit `2b163b5`.
- [x] **Task 3 — refund/void trace.** ⚠️ Finding: there is **no automatic Stripe refund** on domain-registration failure (no `refunds.create` anywhere) — the customer keeps an active subscription + a working book on the subdomain, so the sale (and commission) is legitimate. Rewardful's native `charge.refunded` auto-void still works for any *manual* refund Dan issues. **Decision needed:** should domain failure auto-refund? (separate business call — not implemented.)
- [x] **Task 4 — `/affiliates` landing page** + route (`book.js`) + footer links (landing-v2-cro/landing/landing-v2). Commit `2645c16`.
- [x] **Task 5 — asset pack** in `affiliate-assets/` (product desc, 5 captions, 3 email swipes, brand-rules, 10-Q&A FAQ, 3 SVG banners). Commit `692ac4c`. **Still to do:** upload to Rewardful Asset Library (needs the UI); export SVG banners→PNG if required.
- [x] **Merged to main + deployed + verified live** (merge `6e6cbd6`, 2026-06-08). `/affiliates` serves 200; snippet confirmed live; real `?via=` referral tracked on Rewardful dashboard.
- [x] **Add `REWARDFUL_API_SECRET` to Railway env** — DONE (Dan, 2026-06-15) + VERIFIED by coding: set in Railway prod (length 32) and authenticates (GET /v1/campaigns → 200). The webhook's `recordConversion()` uses the same Basic-auth, so gift/branded-signup conversions will authenticate. Remaining = affiliates' real referred test purchase to confirm a conversion in the dashboard.
- [ ] **Upload asset pack to Rewardful Asset Library** (Dan / needs the UI). Files in `affiliate-assets/`; export SVG banners → PNG if the library requires raster.
- [ ] **Decision (Task 3): should domain-registration failure auto-refund?** Currently NO refunds at all (per Dan — no-refund policy; customer keeps subscription + subdomain book). Nothing to implement unless policy changes.
- [ ] **Follow-up:** the branded Payment-Intent signup flow (`create-signup-intent`) + gift checkouts are NOT yet Rewardful-attributed (they use PaymentIntents, not Checkout Sessions — need separate handling).

---

## 👥 Circles — contact list + update notifications (2026-06-09)

Plan: `docs/plan-contact-list-notifications.md`. Decisions locked: email-only MVP,
per-contact magic link, manual notify, name = "Circles", a person can be in
multiple circles (many-to-many).

- [x] **Phase 1 — manage contacts + circles. SHIPPED + deployed (merge `c2bf469`).**
  Migration `029_circles.sql` applied to prod (book_contacts, circles, circle_members,
  book_update_notifications). `contactService.js` + app API `/api/contacts/*` +
  web `/account/book/circles` (live) + app `CirclesScreen` (ships in next build 1.0.18).
- [x] **Phase 2 — Notify + magic link. SHIPPED + TESTED on web (2026-06-10).**
  `contactService.notifyCircle` (cooldown 10 min/book, dedupe, audit row);
  `?circle=<token>` in requireBookPassword opens the book passwordless (sets the
  standard book cookie, stamps last_viewed_at; archiving a contact revokes the link);
  `GET/POST /circle/unsubscribe/:token` (RFC 8058 one-click); web "Send an Update"
  card on /account/book/circles; app API `POST /api/contacts/mine/notify` ready.
  E2E-verified live: email sent (Resend), magic link bypassed the password via curl
  (no cookies), bad token rejected, unsubscribe flips notify_opt_in, cooldown blocks
  repeat blasts. REMAINING: app CirclesScreen needs the Notify UI (1.0.18); Dan's
  personal test pass.
- [ ] **Phase 3 — polish.** "What changed" auto-detect, view analytics, digest, native-share SMS, import phone contacts.
- [x] **1.0.18 mobile build BUILT + SUBMITTED to both stores 2026-06-10 (night) on Dan's explicit go.** ✅ VERIFIED 2026-06-10 ~10 PM: iOS "Waiting for Review" in ASC (build 32, Dan clicked Submit); Android delivered to Play. Remaining: monitor review outcomes (sessions/coding.md open item 1).
- [x] **App: remove numbered "Chapter/Section" eyebrow labels — N/A in app code** (no Chapter strings in mobile/; the site preview is a WebView so it inherits the web fix). ⚠️ BUT the facebook session reports the your-childs-name.com DEMO still shows CHAPTER labels — demo deploy source is separate/unresolved (see sessions/coding.md open item 2). from the book section screens, to match the web (done on web 2026-06-10: dropped Chapter One/Two/Three/Six/Seven/Eight/Nine/Ten + "Section Five" on Family; kept descriptive eyebrows like "The day you arrived", "In motion", "Your collections", "The First Year"). Find any "Chapter X"/"Section X" headers in `mobile/` book screens and remove them the same way. Ship in 1.0.18.

### 📱 App parity for the next build (web changes made 2026-06-10 — mirror ALL of these in 1.0.18)
> Rule #8/#9: apps + web editors must always match. Everything below is LIVE on web and must be brought to the app before/in the next build. **Circles must be working + tested on web first (Dan's call) before we cut the app build.**
- [x] **Circles entry now lives on "My Account", not the book editor.** Web: moved the "Your Circles" card off the My Book hub onto the My Account page (`account-dashboard.ejs`), gold-bordered with a "New" badge; Circles page nav now breadcrumbs `My Account / Your Circles` and "← Back to My Account". App already shows a Circles card on the Dashboard (DashboardScreen SECTIONS) — confirm it's positioned/labelled to match and is NOT inside the book-editing flow.
- [x] **Circles Phase 2 in the app. DONE in 1.0.18.** Add the "Send an Update" UI to CirclesScreen calling `POST /api/contacts/mine/notify` ({circleId?, note?}; 429 = cooldown — show the server's message). Mirror the web card: Everyone-or-circle picker + optional note + confirm before sending.
- [x] **Family editor — clean slate + no emojis. DONE in 1.0.18** (app was already DB-driven/clean; added Remove-from-family + icon + empty state; server DELETE /api/books/mine/family/:key). Web removed the 6 forced default members (Mom/Dad/4 grandparents); list now shows only members the user added, with an empty-state prompt + "+ Add Family Member", all members deletable, and emoji avatars replaced with a line-drawn person icon (also on the member-detail page + public book). Mirror in the app's family screens: drop the hardcoded defaults, allow delete of all, swap emoji placeholders for the icon.
- [x] **Video Moments grouping. N/A for app** (app dashboard mirrors the web My Book hub, which was not regrouped; the public-book nav change reaches the app via the WebView preview). Web book nav moved "Video Moments" out of "The Book" into "Family & Memories", directly under "Our Family". Match the app's book navigation order/grouping.
- [x] **Photo Galleries grouping + submenu + rename/reorder. DONE in 1.0.18** (app: up/down reorder + rename existed in detail; server PUT /api/galleries/mine/reorder; public-book submenu reaches app via WebView). Web (2026-06-10): book nav moved "Photo Galleries" into "Family & Memories" (after Video Moments) with a nested submenu listing each gallery (click scrolls to it); editor galleries list got per-gallery **Rename** and **drag-to-reorder** (POST `/account/book/galleries/reorder`, `galleryService.reorderGalleries`). Mirror in the app: galleries entry placement, rename + reorder in the app's galleries editor.
- [x] **Galleries: cap 50 + create-then-name flow + lightbox arrows. DONE in 1.0.18** (cap now server-driven in app; create-then-name in GalleriesScreen; lightbox via WebView). Web (2026-06-10): `galleryService.MAX_PHOTOS` 21→50 (app reads it from `/api/galleries` `maxPhotos` — verify no hardcoded 21 in `mobile/`); galleries list page is now just a "+ Create Gallery" button (no name field) — naming happens on the gallery's photo page via a labeled "Gallery name" + Save name control (autofocused when untitled); public-book lightbox prev/next arrows now cover custom galleries + before/firsts/keepsake grids. Mirror flow + cap + photo-swipe in the app.
- [x] **Master "Save Page" button on gallery editors. VERIFIED parity** (app saves per-field on end-editing — equivalent behavior). Web added a one-tap "save all captions" bar on Birthday/Celebrations(+detail)/Keepsakes/Recipes/Galleries/Journey editors. Confirm the app's equivalent editors save captions in a way that matches (app already saves per-field on blur — verify parity of behavior).
- [x] ~~Font + contrast refresh in the app~~ — **DECIDED 2026-06-10: app fonts stay as-is** (Dan: "The app fonts look fine on my phone"). Web-only change; no app work needed.
- [x] **Child Info — allow decimal weight/length. DONE in 1.0.18** (decimal-pad keyboards). Web fixed the length/weight inputs to accept decimals (e.g. 19.8 in) — they were `type=number` with no step (whole-numbers only), which rejected 19.8 with a browser "valid value" error. DB already stores it (`birth_length_inches NUMERIC(4,1)`; weight normalized server-side). Check the app's Child Info screen uses `keyboardType="decimal-pad"` and doesn't block decimals.

---

## 🔜 Test / verify (Dan — quick actions)

- [ ] **Test the comp (free) gift flow.** Log in `/admin/login` → **Gift Codes** → "🎁 Give a free gift" →
      mint one to yourself → redeem the code → confirm you get a full free year + the .com registers.
- [ ] **Test the branded SIGNUP checkout** at `https://legacyodyssey.com/start/checkout`.
      ⚠️ A success = real charge + real Spaceship .com purchase. Use **Annual ($29)** with a domain
      you're OK keeping; then cancel the sub + domain auto-renew. After it works → **cut over** the
      landing/founder-modal signup CTAs to `/start/checkout`.
- [ ] **Confirm the Stripe webhook endpoint** has **`payment_intent.succeeded`** AND
      **`invoice.payment_succeeded`** enabled (signup checkout provisioning depends on them).
- [ ] **Refund the $29 gift test charge** (code `GIFT-FCEW-UB98-KZN2`) in Stripe. Refund auto-invalidates it.

---

## 🚀 Active build threads

- [x] **📐 PHOTO REPOSITION (focal point) — WEB DONE + live (2026-06-03).** Fixes heads being cropped
      out of cover-fit photos. New `POST /account/book/photo-position` writes `books.photo_positions`
      (JSONB, which the viewer already honors via `photoPos()`); reusable `_reposition-widget.ejs`
      (drag focal dot + live preview). Wired into ALL 11 web editors: Month, Child Info, Family Member,
      Birth Story (×4), Before, Coming Home, Birthday, Celebrations, Recipes, Keepsakes, Journey.
      Commits 11a6f86 → 4f71166. `focal_x/focal_y` columns are vestigial — `photo_positions` is canonical.
      **APP parity REMAINING (bundle into the combined build w/ video):** PhotoPicker-based screens already
      have reposition; the GAP is the gallery screens — add reposition (reuse PhotoEditor) to BirthDayScreen,
      CelebrationDetailScreen gallery, RecipeDetailScreen gallery, KeepsakeDetailScreen gallery.
- [ ] **🎥 VIDEO ("Moments" section) — RESUME HERE next session.** Decisions locked 2026-06-02:
      upload-only · 3-min cap · free on all plans · **Cloudflare Stream**. Full plan: `docs/plan-video-moments.md`.
      **BLOCKED on Dan:** enable Cloudflare Stream + create Stream:Edit API token + Account ID → add
      `CLOUDFLARE_STREAM_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` to Railway env. Then Claude scaffolds
      Phase 1 (migration 025_videos + cloudflareStreamService + signed-upload endpoint). CONFIRM section
      placement first (dedicated "Moments" gallery [rec.] vs. attach to Month-by-Month).
- [ ] **B15 — Branded checkout cutover.** Gift flow: DONE + live-tested. Signup flow: built + server-validated,
      isolated at `/start/checkout` — needs Dan's live test (above), then repoint signup CTAs.
      Later/optional: extend the Payment Element to additional-site purchases too.
- [ ] **B13 — Referral program.** Code deployed but **dormant**: apply migration
      `supabase/migrations/023_referrals.sql` in the Supabase SQL editor. Dashboard already safe without it
      (self-disables). Once applied + redeployed, the referral card + `?ref=` attribution go live.

---

## 🌱 Product & growth (new — Dan, 2026-05-27)

- [ ] **Growth chart on the book sites.** Add a height/weight growth chart families can fill in and that
      renders on the customer's website. (Design: data model for measurements over time, editor UI in
      app + web, viewer section. Decide percentile curves vs. plain plotted points.)
- [ ] **Target foster & adoptive parents.** Marketing + product angle for non-traditional families.
      NOTE: the product already has a **"Your Journey to Us"** section (migration 020) built for
      adoption/surrogacy/foster — lean on it. Work = dedicated landing/messaging, ad targeting, possibly
      tailored copy + testimonials.
- [ ] **🇮🇳 India market expansion — 4-phase plan (Dan, 2026-06-08).** ~25M babies/yr (7× US cohort),
      strong cultural fit, cheap CAC. GA already shows ~19 Indian visitors/week with zero marketing.
      **HOLD until US conversion improves** (currently 0.16% / 3 sales / 28d) — don't multiply problems.
      But **Phase 1 validation is worth doing soon** ($200 spend, no build required).
      - **Phase 1 — Validate (0–30d, ~$200):** Meta ads targeting Indian moms in metros (Mumbai, Delhi,
        Bangalore, Pune, Hyderabad) → land on `/india` with ₹999 displayed (paid at $29 USD via Stripe).
        Add post-bounce survey "would you pay ₹999/₹1,499/₹1,999?" Analyze why current 19/wk Indian
        visitors aren't converting.
      - **Phase 2 — Lower friction (30–60d):** Sign up **Paddle** as Merchant of Record (handles GST,
        currency, no India entity needed, pays USD; ~5% fee). Add IP-based INR pricing. Route Indian
        IPs to Paddle, US to Stripe. Split-test ₹999 / ₹1,499 / ₹1,999. Add UPI as a payment method.
      - **Phase 3 — Localize (60–120d):** Indian milestone sections (Namkaran, Annaprashan, Mundan,
        First Birthday). Hindi/English language toggle. Indian testimonials. WhatsApp share button
        (Indian families share via WhatsApp, not email). Offer **.in domain** (~₹600/yr vs .com ~₹1,000).
      - **Phase 4 — Scale (120d+):** Indian influencer partnerships (₹1,500–5,000/post vs $200+ in US).
        Indian PR (YourStory, Inc42, mom blogs). WhatsApp Business notifications. Part-time Indian VA
        for time-zone coverage.
      - **Key constraints to plan around:** RBI eMandate rules complicate annual auto-renew. India GST
        (18% on digital services) handled by Paddle as MoR. Stripe India requires Indian entity. PPP
        pricing → expect ~$10–15 effective revenue per customer vs $29 in US.

---

## 📣 Marketing & site polish

- [ ] **C19 — Demo / presentation video.** On hold (Descript attempt scrapped). Needs a clean screen-recording
      walkthrough of the demo book once the demo site is fixed.
- [ ] **Demo site `your-childs-name.com`** — fix: (1) top banner overlaps the "Back to Family" button;
      (2) make recipes clickable → recipe detail page; (3) possible banned "CHAPTER ONE/TWO/FOUR" eyebrows.
      ✅ **DEPLOY-SOURCE MYSTERY SOLVED (2026-06-16):** the live demo is hosted on **Spaceship Web Hosting**
      (NOT Railway, NOT the repo). That's why repo edits (`src/views/book/*`, `your-childs-name-demo.html`)
      never reach it. **Edits must be made on Spaceship hosting** (file manager / FTP) — needs Spaceship
      hosting login. See `docs/infrastructure/spaceship-hosting.md` + `docs/domains/your-childs-name.com.md`.
      Next: get Spaceship-hosting file access, locate the served files, edit there.
- [ ] **B17 — Smart domain-alternative suggestions** when a searched name is taken (middle name, hyphen,
      nickname, "baby/little" prefixes, alt TLDs). Surface in hero search + checkout modal.

---

## 🐛 Book editor bugs (Dan, working on Eowyn's site 2026-05-27)

- ✅ **Web Before editor — rotate + obvious remove** shipped (`a5729d4`). Rotate ↻ on each photo
      (canvas re-upload); "✕ Remove card" pill. NOTE: roll the same rotate control out to the OTHER web
      editors (birth, months, family, firsts, celebrations, recipes, keepsakes, journey, coming-home) — Dan
      will likely want it everywhere, not just Before.
- [ ] **App: no way to remove a Before card.** BeforeScreen has 4 FIXED cards (DEFAULT_CARDS), only the
      checklist has remove. Add per-card remove/clear (+ probably variable card count to match the web). App build.
- [ ] **App: photo goes blank right after selecting (Birth Story screen, per screenshot).** Data is HEALTHY
      (stored paths are valid JPG/PNG full Supabase URLs — NOT a HEIC/format/relative-path problem). Root cause
      not reproducible from static code — likely a refetch-on-focus clobbering unsaved state, or a transient
      upload failure. NEEDS a repro + app build. Don't blind-patch live data.
- [ ] **App: rotation didn't persist to website.** App PhotoEditor bakes rotation → re-uploads to a NEW
      `general/` path → updates local state; user must hit Save. Likely the rotation wasn't saved, or a stale
      web cache. Web rotate (shipped) is the immediate workaround. Revisit app flow in the build.
- [ ] **PhotoPicker placeholder emoji** — `mobile/src/components/PhotoPicker.js` line ~218 uses `\u{1F4F7}`
      (📷) as a unicode escape (missed by the earlier emoji sweep, which matched literal chars). Swap for a
      Lucide icon in the next app batch.
- [ ] **Birth Story photo parity (app↔web drift).** App + DB support 2 photos per perspective
      (`mom_photo_1/2`, `dad_photo_1/2`); the WEB editor (`account-book-birth-story.ejs` + `account.js`)
      exposes only `*_photo_1`. Add the 2nd photo (mom + dad) to the web editor. Web-only fix, ships live.
- [ ] **NEW SECTION: "Your Birth Day"** — multi-photo gallery (who was there, hospital, the doctor, etc.).
      Build in BOTH app + web per the parity rule. Needs: DB migration (new section table or a photos array
      à la celebration_photos/recipe_photos), viewer section + toggle, app screen, web editor. Larger feature.
- [ ] **Multi-photo + multi-select everywhere.** Dan wants to select MULTIPLE photos at once (app + web)
      and galleries that hold many photos — not the current fixed 1–2 slots. Applies to Your Birth Day and
      likely should extend to other sections. Design a reusable multi-photo gallery component (app) + multi-
      upload zone (web) on top of the existing `*_photos` array pattern.
- [x] **App↔web parity audit (photo capabilities) — done 2026-05-27.** Section COVERAGE is fine (every
      app screen has a web editor). Capability gaps found:
      - **ROTATE is the big gap.** The app rotates photos in every section (shared PhotoPicker → PhotoEditor),
        but the WEB can only rotate in Before You Arrived (just added). → Roll the web rotate control out to:
        birth-story, child-info, coming-home, month-detail, family-member, vault, journey, celebration-detail,
        recipe-detail, keepsake-detail. (Reusable: the canvas-rotate fn from before-arrived.)
      - **Focal-point / reposition** — app PhotoEditor lets you set the focal point (x,y); web editors don't.
        Parity gap; add reposition or at least carry the saved position.
      - **Birth Story 2nd photo** — FIXED 2026-05-27 (`38a3c1e`).
      - **Multi-photo galleries** already on BOTH sides for celebrations/recipes/keepsakes/journey
        (`*_photos` arrays). Fixed-slot sections (before, birth, months, child-info, coming-home,
        family-member, vault) do NOT have galleries.
      - **Multi-select** (pick many photos at once) — NEITHER app nor web has it yet; it's a NEW feature for
        both (Dan requested), not a drift.

## 📱 Mobile app (NONE submitted — hold until Dan says go)

- [ ] **Uncommitted app changes** sitting in the tree: emoji→Lucide icon pass (9 screens), Help/Forgot-Password
      washed-out-theme fixes, DashboardScreen upgrade-prompt copy ($29 annual). Commit as a batch when ready.
- [ ] **Fix "family book / family's story" copy** on Login & Signup screens (breaks the no-"family book" rule):
      "Your family's story, beautifully told", "Get Your Own Family Book", "Add Another Book".
- [ ] **Photo picker "Search disabled" fix (done in code, needs build).** Removed
      `requestMediaLibraryPermissionsAsync()` before picking in PhotoPicker.js + Recipe/Celebration/
      Keepsake DetailScreens, so `launchImageLibraryAsync` uses the system Android Photo Picker instead of
      the Google Photos picker (which disables Search for third-party callers). Camera permission kept.
      Verify on Dan's S25 Ultra after the build.
- [ ] **Celebrations year rename + birth-year default (app parity).** Web shipped (`486457f`): rename years
      (e.g. "2025") + first year defaults to birth year. App CelebrationsScreen needs the same (rename a year,
      seed first from birthdate). Needs build.
- [ ] Ship a new build (EAS) so the icon/theme fixes reach phones — **only on Dan's explicit go-ahead.**

---

## 🔧 Infrastructure (verify still relevant — some from CLAUDE.md)

- [ ] **`TURNSTILE_SECRET_KEY`** → add to Railway env so contact-form server-side verification activates
      (honeypot defends until then).
- [ ] **`www.legacyodyssey.com` 404** — add `www` as a Railway custom domain, or a Cloudflare 301 www→apex.
- [ ] **Delete the zombie Railway service** (`legacy-odyssey-production-a9d1.up.railway.app`) — ⚠️ Dan-only,
      via the dashboard UI signed in as the `dragno65` GitHub Railway account (it lives in project
      `romantic-creation`, a DIFFERENT account). NEVER use the `.env` `RAILWAY_API_TOKEN` for this — it may
      point at LIVE prod. Full findings + access path: `docs/infrastructure/railway.md`.
- [ ] **Cancel Cloudflare for SaaS** add-on (no longer used for customer routing; keep CF for the
      legacyodyssey.com zone).
- [ ] **Delete dead code:** `cloudflareService.js` + old CF migration scripts (Approximated is the layer now).

---

## ⚖️ Compliance

- [ ] **G7 — Enable the GDPR badge** (lawyer-approved; optional, flip on when wanted).
- [ ] **#38 — Guarded data-retention purge job.** Interim weekly reminder email already ships; the actual
      guarded auto-purge is still to build.

---

## 🧹 Housekeeping / side quests

- [ ] **Backfill `families.billing_period`** from Stripe — 5 stale rows are wrong (eowynhoperagno, emmacherry,
      roypatrickthompson, your-family-photo-album, review@) so admin reports reflect reality.
- [ ] **Pricing — monthly dropped (DONE 2026-05-27).** `foreverearley.com` is the one grandfathered monthly
      customer — do NOT touch their sub, the monthly Stripe Price, or monthly backend code paths.

---

## 🔒 Security follow-ups (from the 2026-05-27 audit)

- [ ] **Private photo bucket (PARKED — needs a project, not a flip).** Photos are on a *public* Supabase
      bucket; URLs are unguessable (familyId UUID path) so scrapers/search can't find them, but the files
      aren't access-controlled. Making the bucket private would break EVERY existing image + the mobile app
      (PhotoPicker hardcodes the `/public/` URL pattern) unless staged: build a gated image proxy / signed
      URLs, migrate all 5 server call sites + book viewer + mobile app, dual-support old format until a
      coordinated mobile release, THEN flip. Only worth it if marketing hard on per-file protection.
- [ ] **(Skip unless dropping show-password UX)** Hash book passwords at rest. Currently plaintext + shown
      to the owner in 5 places (success page, welcome email, site-live email, 2 admin screens). Hashing
      would break showing them their own password. Low value for a shared viewing password.
- ✅ **X-Robots-Tag: noindex on customer domains** — shipped 2026-05-27 (`b96d15d`), verified live
      (present on customer sites, absent on marketing). Third search-blocking layer.

## ✅ Recently shipped (for context — 2026-05-26/27)

- Account-dashboard logout bug fixed (referral columns without migration).
- Gift landing page: Entire Childhood ($450) option + CRO upgrades + social icons.
- Branded embedded checkout (Payment Element) — gift flow cut over + live-tested; signup flow built.
- Monthly plan removed from all new-customer surfaces (foreverearley grandfathered).
- Comp (free) gift minting for influencers/promos — admin-only.
