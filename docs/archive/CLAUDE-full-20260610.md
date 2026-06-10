# Legacy Odyssey — Master Project Context

> **This file is loaded automatically at the start of every session. Read it fully before doing anything.**
> **🏠 Canonical home: `F:\legacy-odyssey\CLAUDE.md` — the single source of truth.**
> A synced backup is kept at `E:\Claude\CLAUDE.md`; when you edit one, copy it to the other so they stay identical.
> (Organizing-session TODO: relocate the session project root to F so F auto-loads directly. The prior,
>  larger F copy was archived to `CLAUDE.md.superseded-20260527.bak` — nothing was lost.)
> Last updated: May 27, 2026 (added VERIFIED ACCOUNTS & capabilities section; consolidated to one F-drive file; app↔web parity + session-review rules)

---

## ⚠️ MANDATORY at session start

1. **Read `F:\legacy-odyssey\docs\INDEX.md`.** This is the per-entity knowledge base. Every domain, customer, and vendor we've worked with has its own file there. The INDEX is small and gives you a complete map.

2. **Whenever the user mentions a specific domain, customer, or vendor by name, BEFORE responding, open the matching file at `docs/<category>/<entity>.md`.** Read it. Then answer.
   - Example: user says "your-childs-name.com" → open `docs/domains/your-childs-name.com.md` first
   - Example: user says "Approximated" → open `docs/infrastructure/approximated.md` first
   - Example: user says "Kate" or "kateragno" → open `docs/customers/kate-ragno-niece.md` AND `docs/domains/kateragno.com.md`

3. **Whenever you make a meaningful change to an entity, update its file IN THE SAME RESPONSE that does the work.** Bump "Last touched" date, add a History bullet, update Current configuration. Never leave the docs out of sync with reality.

4. **When you create a new entity (new customer, new vendor, new domain we own), write its file from the standard template in `docs/README.md` BEFORE moving on. Add a line to `docs/INDEX.md`.**

5. **For business / cost / legal / vendor / renewal / hardware questions, read `F:\legacy-odyssey\ops\BUSINESS-OPS.md` first.** That directory is the Chief-of-Staff source of truth (formation, filings, subscriptions, hardware, decisions, calendar). Engineering work still lives here + in `docs/` + `TODO.md`; `ops/` is the business layer.

6. **Review what other sessions changed before starting work.** Multiple Claude sessions work on this project in parallel and drift apart. At the start of every session, in `F:\legacy-odyssey`:
   - `git log --oneline -20` — see recent commits from any session.
   - `git status` — see uncommitted in-progress work from other sessions (do NOT clobber or blanket-commit it).
   - Read `F:\legacy-odyssey\TODO.md` (the master open-items list) and the latest memory `session_*.md`.
   Summarize anything relevant to the current task before touching code.

This system exists because Claude has previously failed to know what entities are, despite the information being available. The fix is: read the entity file first, every time. Treat skipping it as a process violation.

---

## What Is This Project?

Legacy Odyssey is a **subscription SaaS baby book / family memory platform**. Parents use a React Native mobile app to fill in their baby's story (milestones, photos, recipes, letters, etc.), and family/friends view the finished book at a custom domain (e.g., `kateragno.com`). Every customer gets their own real `.com` domain purchased automatically via the Spaceship API at checkout.

**Status: LIVE and accepting real payments as of March 29, 2026.**

---

## Critical Rules (Read Every Session)

1. **NEVER submit anything to Apple App Store or Google Play without explicit user permission.** Ask first. Wait for "yes" or "please go ahead."
2. **NEVER click "Submit for Review", "Add for Review", or "Resubmit to App Review" in App Store Connect without explicit confirmation.**
3. **NEVER use real family names** (Eowyn, Ragno, Kate, Roy, Lindsey, Emma, Jeff, Lachlan, Reese, Daniel, Jeanine) as placeholders, examples, or seed data anywhere a non-developer might see them. The user has flagged this multiple times as a hard rule. Use generic stand-ins (Sophia, Smith, Sam Smith, Sarah Smith, etc.). See `feedback_no_real_names.md` in memory.
4. **When resuming a session, read `C:\Users\dragn\.claude\projects\E--Claude\memory\project_legacy_odyssey.md` and this file before taking any action.**
5. **If you lose context about a file path, credential, or decision — read the transcript at `C:\Users\dragn\.claude\projects\E--Claude\50819f15-0eb3-41f8-8f0e-6139a35218b8.jsonl` before asking the user.**
6. **Write important facts to memory immediately** — file paths, credentials, decisions, status changes. Don't wait.
7. **The user prefers direct action** — don't ask unnecessary questions, make decisions and drive work forward.
8. **APP ↔ WEB PARITY (hard rule — user re-escalated 2026-06-04: "I want the apps and web based editors to all be the same, always.").** The iOS app, the Android app, and the web book editor (`src/views/marketing/account-book-*.ejs` + `src/routes/account.js`) must offer the SAME capabilities for the same content — AND the same copy/wording/branding. Any change to one MUST be mirrored in ALL surfaces in the same effort — same fields, same photo counts, same add/remove/rotate/multi-select behavior, same labels and taglines. They share one database, so a field the app writes (e.g. `birth_stories.mom_photo_2`) but the web can't edit is a bug. When you touch a content or copy feature, check ALL surfaces before considering it done, and note any intentional gap in TODO.md. (The old Birth Story 2nd-photo web drift is RESOLVED — `account-book-birth-story.ejs` + `account.js` now read/write `mom_photo_2`/`dad_photo_2`, verified 2026-06-04. Current known drift: web "rotate" control exists in only ~4 of ~12 editors; app lacks Celebrations year-rename + birth-year default.)
9. **iOS + ANDROID SHIP IN LOCKSTEP (hard rule — user, 2026-06-04: "I want both apps updated at the same time, always.").** Never build/submit one mobile platform without the other. Always `eas build --platform all` and submit BOTH stores for the same version in the same effort. Never let iOS and Android versions/features drift. (Store submission still requires explicit per-release permission per rules #1/#2 — lockstep means "both or neither," not "auto-submit.")
10. **ALWAYS put copy-paste content in its own fenced code block (user, 2026-06-08: "anything I need to copy, do that with it").** Any text intended for the user to copy — customer-reply emails, prompts to paste into another session, commands, snippets, config — goes in a SEPARATE ``` fenced block by itself, with NO surrounding prose inside the block, so the UI gives a one-click "copy" button for just that content. Don't make the user copy your whole message.
11. **NO REFUNDS — ever (user, 2026-06-08: "We do not give refunds").** Do not advertise, offer, or imply refunds anywhere — site, emails, app/web copy, or support replies. Cancellation = stop FUTURE charges and retain access through the end of the current paid period (never a refund). Domain registrations are non-refundable regardless. The only post-sale commission void for affiliates is a Stripe chargeback (rare) or ToS violation. (A minimal "except where required by applicable consumer-protection law" carve-out stays in the formal ToS for legal safety — that's the only place.)

---

## ✅ VERIFIED ACCOUNTS & WHAT CLAUDE CAN DO (verified 2026-05-27)

**Claude CAN do these — don't refuse them. Just confirm the tool is connected first, then proceed.**
Verified this session by actually doing them (ran a migration via the browser; queued an EAS build via CLI).
The only hard limit: raw DDL (CREATE/ALTER TABLE) cannot run through the Supabase REST API — use the SQL editor.

- **Supabase migrations (DDL):** open the SQL editor in the user's Chrome (Chrome extension is connected as
  "Personal Chrome"), paste the migration, Run. The REST/service-role API can run DML but NOT DDL.
- **App builds:** `cd mobile && npx eas-cli build --platform all --profile production --non-interactive --no-wait`.
  EAS CLI is logged in (no re-auth needed). Credentials (Apple cert/profile, Android keystore) are EAS-managed.
- **App store submission:** `eas submit --platform ios|android` (creds below). ALWAYS get explicit user
  permission first (hard rule #1/#2) AND recommend a device test — builds are often untested batches.
- **Browser actions:** Chrome extension (`mcp__claude-in-chrome__*`) is connected → can drive Supabase,
  Stripe, App Store Connect, Play Console, etc. Check `list_connected_browsers` first.

### Accounts — ⚠️ NOT all the same email. Verify before acting.
| Service | Account / identity | Notes |
|---|---|---|
| **Expo / EAS** | account **`dragno65`** · project `@dragno65/legacy-odyssey` · projectId `14daf713-2b41-4ac0-b413-1179afa6e6a9` | `eas whoami` → dragno65 |
| **Apple (App Store)** | Apple ID **`dragno6565@gmail.com`** · Team **`Y3J2B5YA4N`** (DOR Industries, LLC) · ASC App ID **`6760883565`** | from eas.json + build creds |
| **Google Play** | console login **`albumerapp2@gmail.com`** (Chrome profile u/2) · Developer "DOR Industries" (ID 7255543911428830238) · App ID 4975186349665269659 · service-account key `C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json` (present) | **⚠️ DIFFERENT email from everything else** |
| **App bundle/package** | iOS `com.legacyodyssey.app` · Android `com.legacyodyssey.app` | same id both platforms |
| **Supabase** | org "**dragno6565@gmail.com**'s Org" (Pro) · project "Legacy Odyssey" · ref **`vesaydfwwdbbajydbzmq`** | |
| **GitHub** | **`dragno6565-ship-it/legacy-odyssey`** (origin → Railway auto-deploy) | |
| **Stripe / Railway / Spaceship / Resend** | see Infrastructure below | |

---

## Infrastructure

### Repository
- **Repo (deploys to Railway):** `github.com/dragno6565-ship-it/legacy-odyssey`
- **Local git origin:** `github.com/dragno6565-ship-it/legacy-odyssey`
- **Branch:** `main`
- **Local path:** `F:\legacy-odyssey`
- Railway is connected directly to `dragno6565-ship-it/legacy-odyssey` — pushing to origin triggers deploy.

### Railway (Backend Hosting)
- **Canonical URL (USE THIS):** `https://legacyodyssey.com` — serves the current deploy from this repo. All mobile + web traffic should target this hostname.
- **Also live at:** `https://www.legacyodyssey.com`
- **Project ID:** `27622203-293e-4720-b019-9efe8eadfdf4` (project name: "bountiful-expression")
- **Service ID:** `59190e65-b239-4cf1-842a-3913fabb1838`
- **Environment ID:** `a9643517-8aad-441a-81c7-55c462f2fea0`
- **Dashboard:** `https://railway.com/project/27622203-293e-4720-b019-9efe8eadfdf4`
- **⚠️ CORRECTED 2026-06-08 (was DANGEROUSLY WRONG):** The `.env` `RAILWAY_SERVICE_ID` (`59190e65…`) + `RAILWAY_ENVIRONMENT_ID` (`a9643517…`) + `RAILWAY_API_TOKEN` actually point to the **LIVE production service** `legacy-odyssey` in project `bountiful-expression` (`27622203`) — verified live via the Railway GraphQL API. They do **NOT** point to the old `25a7cbc7` "romantic-creation" project. **DELETING "the service the .env token points to" WOULD TAKE DOWN PRODUCTION.** (`railwayService.js` still can't add custom domains via API regardless — use the Railway dashboard for that.)
- **🧟 Zombie service location (unresolved):** the stale `legacy-odyssey-production-a9d1.up.railway.app` (v2.1.0) is NOT in the `dragno6565@gmail.com` Railway account (which holds only `bountiful-expression`) and is NOT reachable via the `.env` token. It lives in a DIFFERENT Railway account/team (the old "romantic-creation" project). To delete it you must log into that other account first. It's benign (stale code, negligible old-app traffic now that 1.0.17 is live) — the `/admin/health` "Zombie Railway service" WARN is expected until then.
- Auto-deploys from `dragno6565-ship-it/legacy-odyssey` (`origin`) on push to main. The `dragno65` remote has been removed — it pointed to a non-existent repo.

#### ⚠️ Stale/zombie Railway service — KNOWN HAZARD (Apr 19 2026)
- A second Railway service is alive at `https://legacy-odyssey-production-a9d1.up.railway.app` and is NOT tied to this repo's current deploy pipeline. It still responds to API calls (shares the same Supabase DB so logins work) but runs a **stale copy of the backend** (version 2.1.0 vs 2.2.0 on `legacyodyssey.com`).
- **This caused weeks of broken photos in the mobile app.** The mobile `BASE_URL` was historically hardcoded to the `*.up.railway.app` hostname, so every recent server-side fix we deployed went to `legacyodyssey.com` but the app never saw them.
- **Fixed in commit `1a495d0` (Apr 19 2026):** mobile `BASE_URL` now falls back to `https://legacyodyssey.com`. Ship 1.0.5 or later to all users.
- **TODO:** once 1.0.5 has propagated on both stores, delete (or repoint) the zombie service via the Railway dashboard so this can't recur. Do NOT delete it until then — older installed APKs/IPAs still rely on it.
- Quick detector: `curl -s https://legacyodyssey.com/health` vs `curl -s https://legacy-odyssey-production-a9d1.up.railway.app/health`. If the `version` fields differ, the zombie is still live.

### Supabase (Database + Storage)
- **Project ref:** `vesaydfwwdbbajydbzmq`
- **URL:** `https://vesaydfwwdbbajydbzmq.supabase.co`
- **Dashboard:** `https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq`
- **SQL Editor:** `https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/sql`
- **Account:** dragno6565@gmail.com
- Region: us-west-2 (pooler: `aws-0-us-west-2.pooler.supabase.com:6543`)

### Stripe (Payments — LIVE MODE)
- **Account:** `acct_1T3N7kJk2GIrL5uS`
- **Pricing:**
  - Monthly: $4.99/mo + $5.99 one-time setup fee (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_SETUP`)
  - Annual standard: $49.99/yr, no setup fee (`STRIPE_PRICE_ANNUAL`)
  - **Annual intro (PRIMARY OFFER):** $29 first year → $49.99/yr renewal
    - Price: `STRIPE_PRICE_ANNUAL_INTRO` = `price_1TLojVJk2GIrL5uS0oQORYsr` ($49.99/yr base)
    - Coupon: `STRIPE_ANNUAL_INTRO_COUPON` = `sX2lEPb6` ($20.99 off, duration: once, applies to "Legacy Odyssey Annual" product only)
  - Additional Domain: $12.99/yr (`STRIPE_PRICE_ADDITIONAL_DOMAIN` = `price_1TDVIAQzzNThrLYKNnMljEkp`)
- **Checkout:** Annual intro → `POST /api/stripe/create-founder-checkout`; Monthly → `POST /api/stripe/create-checkout`

### Email (Resend)
- **Domain:** `legacyodyssey.com` — VERIFIED (DKIM, SPF, DMARC)
- **Forwarding:** all @legacyodyssey.com → `legacyodysseyapp@gmail.com`
- Onboarding drip emails: Day 1, 3, 7, 13

### DNS / Domains
- **Registrar:** Spaceship (purchased automatically via API)
- **DNS:** Spaceship Advanced DNS — www CNAME only (root @ does NOT support CNAME)
- **Spaceship wallet:** $50 funded (auto-renewal enabled, Visa ending 6181)

### Expo / EAS (Mobile Builds)
- **Account:** `dragno65`
- **EAS Project ID:** `14daf713-2b41-4ac0-b413-1179afa6e6a9`
- **Expo project:** `https://expo.dev/accounts/dragno65/projects/legacy-odyssey`
- **All builds:** `https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds`
- iOS build numbers managed remotely via EAS (`appVersionSource: "remote"` in app.json)

---

## App Store Status (as of June 4, 2026)

### ⭐ CURRENT — v1.0.17 (✅ RELEASED / LIVE on BOTH stores June 4, 2026 — same-day approval)
- **iOS** — ✅ **LIVE** on the App Store (iTunes lookup: version 1.0.17, released 2026-06-04T22:59Z, min iOS 15.1). Apple approved + auto-released within hours of submit.
- **Android** — ✅ **LIVE** on Google Play production (Play Developer API: track production, release name 1.0.17, versionCode 30, status `completed`, full rollout).
- ⚠️ **Tagline fix ("family's story"→"child's story") is NOT in these live builds — ships in 1.0.18.** Emails already carry it (deployed June 4, commit `9a4f1bb`). Both apps went out NOT device-tested — sanity-test the live apps (video upload/playback, gallery create+add, reposition); a bug → 1.0.18 hotfix (which also carries the tagline fix).

- **iOS** — build **31**, ✅ **Submitted for Review** (June 4 — Option A swap: removed in-review 1.0.16 from review → "Developer Rejected", edited version 1.0.16→1.0.17, attached build 31, set release notes, Add for Review → Submit for Review → "1 Item Submitted"). Binary uploaded via `eas submit` (sat in EAS free-tier queue ~1h before processing).
- **Android** — versionCode **30**, ✅ submitted to Google Play **production** (`eas submit --platform android --id 1b0be08d…` → "✔ Submitted your app to Google Play Store! All done!", exit 0).
- **Screenshots refreshed (iOS 6.5"):** replaced the old set with **6 emoji-free, brand-compliant** shots. Deleted the 3 violating ones — screenshot1 (forbidden "Your Family's Story"/"family photo albums" copy), screenshot2 (emoji dashboard icons), screenshot3 (**real family names "Emma Thompson"** + emoji). Kept screenshot4/5 (book viewer); added Lucide-icon app shots (01-dashboard, 07-firsts, 05-video-moments, 04-celebrations) captured emoji-free via Expo web + Puppeteer (`F:\legacy-odyssey\screenshots\new\`, viewport 414×896@3x → 1242×2688).
- **v1.0.17 = v1.0.16's features + the app-parity items that were missing from 1.0.16:** app gallery-photo reposition (`RepositionModal`) + Celebration/Family-member video (`VideoBlock`). Carries Video Moments (Cloudflare Stream) + Custom Galleries (migration 028).
- **⚠️ Tagline fix NOT in this build — ships in 1.0.18.** Changed "Your family's story, beautifully told" → "Your **child's** story, beautifully told" in app `LoginScreen`/`SignupScreen`/`DashboardScreen` AND `emailService.js` (footer ×3 + "...waiting to be told" subject). App fix needs a 1.0.18 build; email fix needs a Railway deploy (git push) to go live. (Per new hard rule #9, 1.0.18 must build+submit BOTH platforms together.)
- Built via `eas build --platform all --profile production` (Android `1b0be08d…`, iOS `dca29a37…`, commit `1e9129f`).
- **⚠️ NOT device-tested before submit** — worth a TestFlight/Play-internal tap-through (gallery create+add, video upload+banner+playback, reposition).

### Superseded — v1.0.16 (replaced by 1.0.17 before Apple review completed)
- iOS 1.0.16 build 30 was **removed from review** June 4 and replaced by 1.0.17 build 31 (Option A). Android versionCode 29 had already gone to the Play production track (live/completed) — 1.0.17 versionCode 30 supersedes it.
- **Android** — versionCode 29, ✅ submitted to Google Play production (live/completed on the production track).
- **iOS** — build **30**, ✅ **Submitted for Review** (June 4 via ASC Draft Submission → "1 Item Submitted"; sidebar "Waiting for Review"). Version 1.0.16 created, build 30 attached, release notes set.
- **v1.0.16 carries TWO new features** (both web sides already LIVE):
  - **Video Moments** (Cloudflare Stream): upload-only, 2-min cap, 1,000-min/site cap; contexts = Video Moments section + Celebrations (multi) + Family member (one). App has Video Moments screen + **background upload** banner (XHR progress). Migrations 026/027 run; Cloudflare Stream live (`CLOUDFLARE_ACCOUNT_ID=bc2ebc94444d987c7a78809a1d9449cb` + token in Railway). Commits `bb562d4`→`60f1ef1`.
  - **Custom Galleries** (migration 028, run): unlimited named galleries, 21 captioned photos each. Web + app. Commits `4182a89`,`8a4ba01`.
- Built via `eas build --platform all --profile production` (Android `48fd8b92…`, iOS `a74d47b5…`).
- **⚠️ NOT device-tested before submit** — two big new features (video upload/playback/background banner + custom galleries). Worth a TestFlight/Play-internal tap-through during review: create a gallery + add photos; upload a video, watch the banner, confirm playback.
- (The earlier 1.0.15 build — video only — was superseded by 1.0.16 and never submitted.)

### Previous — v1.0.14 (submitted June 2, 2026; in review on both stores)
- **iOS** — Build 28, **Waiting for Review** in App Store Connect (version 1.0.14 submitted June 2 via ASC Draft Submission → "Submit for Review" — confirmed "1 Item Submitted"). Binary uploaded via `eas submit`; version created + build 28 attached + release notes set via the browser.
- **Android** — versionCode 27, submitted to the Google Play **production** track via `eas submit --platform android` ("Submitted your app to Google Play Store!", release status COMPLETED — in Google review).
- v1.0.14 carries **Phase 3 multi-photo parity** (commit `6edae96`): new shared `pickAndUploadPhotos` util (system picker, multi-select ≤20); **Before You Arrived** now dynamic add/remove cards + "+ Add multiple photos"; **Coming Home** "+ Add multiple photos"; **Celebration detail** multi-select gallery with per-photo progress. (Web equivalents shipped earlier as Phase 1 `0b3bf65`; book-viewer gallery lightbox prev/next arrows shipped `f4009bb`.)
- Built via `eas build --platform all --profile production` (Android build `991b005d…`, iOS `f4dc2c00…`).
- **⚠️ Not device-tested before submit** — the Before You Arrived fixed→dynamic card change is the riskiest piece; worth a TestFlight/Play-internal tap-through during the review window.

### Previous — v1.0.13 (RELEASED on both stores — confirmed May 31, 2026)
- **iOS** — Build 27, **Released / live** on the App Store (iTunes lookup API: version 1.0.13, released 2026-05-31, "Your Birth Day" release notes live). Submitted May 30 via ASC Draft Submission; Apple approved + released same-day.
- **Android** — versionCode 26, **live** on the Google Play **production** track (Play Developer API: track `production` release name `1.0.13`, status `completed`, full rollout). Verified via service-account key (read-only throwaway edit, discarded uncommitted).
- ⚠️ ASC browser session expired May 31 — re-login needed there for internal metrics. Android status pulled programmatically via `C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json`.
- v1.0.13 carries: the new **"Your Birth Day"** captioned-gallery section (after Birth Story, key `birthday`, migration 024 applied) + `BirthDayScreen` with multi-select up to 20; photo-picker "Search disabled" fix (system picker, no permission); emoji→Lucide icons; Help/Forgot-Password theme fixes; $29 copy; Birth Story 2nd photo support.
- Built via `eas build --platform all --profile production` (mobile batch committed `808cecf`); submitted via `eas submit` (Android) + ASC version page (iOS).
- **⚠️ Not yet device-tested before submit** — watch for issues during the review window; reaches users only after approval.

### Previous — v1.0.12 (submitted May 17, 2026)
- **iOS** — Build 26, submitted for App Store review (version 1.0.12).
- **Android** — versionCode 25, submitted to the Google Play production track.
- v1.0.12 carries: the "Your Journey to Us" section + its editor screen, selectable Birth Story perspective labels, Welcome-page optional birth-detail fields/toggles, and the journey section toggle.

### Older history

### iOS — Apple App Store
- **Apple Team ID:** Y3J2B5YA4N
- **App ID:** 6760883565
- **ASC URL:** `https://appstoreconnect.apple.com/apps/6760883565/distribution/ios/version/inflight`
- **v1.0.1 (Build 11) — Complete ✅**
- **v1.0.3 (Build 13) — Complete ✅**
- **v1.0.4 (Build 14) — Ready to Submit ✅** (uploaded Apr 14, 2026 7:07 PM; currently the latest Complete build in TestFlight Build Uploads)
- **v1.0.5 (Build 15) — Released ✅** (Apr ~22, 2026 — confirmed via iTunes API).
- **v1.0.6 (Build 16) — ⏳ Waiting for Review** (build ID `ef12b3b7-38f3-4875-a74a-5437c2609759`). Submitted for App Store review Apr 25, 2026 via EAS submit.
  - Adds Cancel Subscription flow + removes Family Album navigator.
  - Review password: `TestPass-2026!`.
- **v1.0.5 included the photo-loading fix** (mobile BASE_URL → `legacyodyssey.com`, commit `1a495d0`) + "Adjust Photo" 404 fix (same root cause).
- **Screenshot files:** `F:\legacy-odyssey\screenshots\` — screenshot1.png, screenshot2.png, screenshot3.png (6.5" iPhone)
- **⚠️ ASC rendering bug:** Any scroll/focus blanks the page. Fix: resize window tall, use JS `.click()`, use native value setter (`Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set`) — never call `.focus()` or `.scrollIntoView()`

### Android — Google Play
- **Developer:** DOR Industries — login as `albumerapp2@gmail.com` (u/2 in Chrome)
- **Developer ID:** 7255543911428830238 | **App ID:** 4975186349665269659
- **Console:** `https://play.google.com/console/u/2/developers/7255543911428830238/app/4975186349665269659/app-dashboard`
- **v1.0.2 (versionCode 9) — In Production ✅**
- **v1.0.3 (versionCode 10) — In Production ✅** (Apr 13, 2026)
- **v1.0.5 (versionCode 13) — In Production ✅** (released ~Apr 22, 2026)
- **v1.0.6 (versionCode 14) — Submitted to production track ⏳** (Apr 25, 2026)
  - Build ID: `e27db0cd-cba0-4131-b5f5-794e8dfa93fc` (AAB)
  - Submission ID: `a117abb9-5864-46e5-9def-85cab7bacc2b`
  - Status: `✔ Submitted your app to Google Play Store!` — awaiting Google review
  - Service account key: `C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json`

---

## Architecture (post Approximated.app migration, Apr 27 2026 evening)

Customer custom-domain traffic flow:

```
   Visitor → kateragno.com (Spaceship DNS — A record at customer's zone)
          ↓
   137.66.1.199 — Approximated proxy cluster ("Legacy Odyssey" cluster)
          ↓
   Caddy On-Demand TLS (per-domain Let's Encrypt cert, auto-issued)
          ↓
   legacy-odyssey-production.up.railway.app:443 (Railway, NOT through Cloudflare)
          ↓
   Railway service (Express server reads Host header, routes to family/book)
```

**Key points:**
- Each customer: 2 A records (apex + www) → `137.66.1.199` (Approximated cluster IP). No Cloudflare for SaaS, no per-customer Cloudflare zones.
- Approximated handles: TLS termination, Host-header preservation, proxy to Railway.
- Customer DNS authority stays on **Spaceship** (no nameserver change needed for new signups). Roy is the only customer still on Cloudflare nameservers — keep his Cloudflare zone but the DNS records inside it are A → 137.66.1.199.
- Target is `legacy-odyssey-production.up.railway.app` directly (not `legacyodyssey.com`, which is Cloudflare-fronted and 403s unknown Hosts). This bypasses Cloudflare entirely for customer-domain traffic.
- Approximated config per vhost: `target_address=legacy-odyssey-production.up.railway.app`, `target_ports=443`, `keep_host=true` (CRITICAL — without this Express sees Host=railway and serves marketing site).
- Cost: $20/mo plan (paid). Includes 250 hostnames. We're at 16 (8 customers × apex+www).

**Why we ditched Cloudflare for SaaS:** Cloudflare's custom-token UI doesn't expose the account-level Zone:Edit permission needed to programmatically create per-customer zones. Tenants API requires Enterprise sales call. Approximated solves the same problem with one API key, no permission politics.

**Code:**
- `src/services/approximatedService.js` — wraps Approximated Virtual Hosts API (add/find/delete/status). Replaces `cloudflareService.js`.
- `src/services/spaceshipService.js setupDns` — writes 2 A records per customer to cluster IP.
- `src/services/domainService.js processDomainOrder` — calls `approximatedService.addVirtualHost` instead of Cloudflare.
- `scripts/migrate-customer-to-approximated.js` — idempotent migration script for existing customers.
- `cloudflareService.js` and the old CF migration scripts still exist but are NOT used by the new signup flow. Safe to delete eventually.

**Env vars (set on Railway):**
- `APPROXIMATED_API_KEY` (cluster-scoped to "Legacy Odyssey" cluster)
- `APPROXIMATED_CLUSTER_IP=137.66.1.199`
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_FALLBACK_ORIGIN` — kept around for legacyodyssey.com zone management (DNS, R2 photos), no longer used for customer domains.

**Important Approximated subtleties:**
- Update API uses field name `current_incoming_address` (not `incoming_address`).
- `keep_host: false` is the CLUSTER DEFAULT — always set explicitly to `true` on new vhosts.
- `redirect: true` once set is sticky and not cleanly clearable via update — delete and recreate the vhost if you accidentally enable it.
- Approximated re-issues cert ON FIRST HIT to a DNS-pointing domain — apex stays `dns_pending` until first request, then 200s within seconds. Don't panic if `getStatus()` says `dns_pending` immediately after migration.

**Status:**
- ✅ All 8 customers migrated to Approximated (Roy, Eowyn, Emma, Kate, Reese, Lachlan, Jeff, your-family-photo-album).
- ✅ All 16 hostnames serving 200 with valid TLS (BUT: kateragno.com and your-family-photo-album.com APEX still 404 — Railway custom-domain cap blocks adding apex to Railway. www works for both. Cosmetic — canonical URL we share is www.)
- ✅ Built-in `/admin/health` reports 38 PASS / 2 WARN / 0 FAIL.
- ✅ Marketing site, /admin, /account, all APIs verified working post-migration.

---

## Recent Work — June 8, 2026 Session (Affiliate program — Rewardful)

Shipped the code-side integration for the **"Friends of Legacy Odyssey" affiliate program** (Rewardful, 35% recurring forever). Source of truth: `docs/infrastructure/rewardful.md`. Done on branch **`affiliate-rewardful-integration`** — **NOT yet merged to main / deployed** (awaiting Dan's go). Work: (1) Rewardful JS snippet (public key `0a0312`) in the `<head>` of all 28 public marketing pages; (2) `client_reference_id = window.Rewardful.referral` threaded through 4 Stripe Checkout endpoints (set only when present); (3) traced the domain-failure path — **there is NO auto Stripe refund** (customer keeps subscription + subdomain book), so commissions are legitimate and Rewardful's native `charge.refunded` auto-void covers manual refunds; (4) new public `/affiliates` landing page + footer links; (5) asset pack in `affiliate-assets/`. **Open:** add `REWARDFUL_API_SECRET` to Railway (only needed for a future webhook/API void), upload assets to the Rewardful Asset Library, merge+deploy, then verify `Rewardful.referral` resolves on `?via=`. Same-day also fixed: password-reset `/reset-callback` 404, weight-decimal 500 on book save, health-check zombie warning + flaky domains check, landing hero/title copy, "family's story→child's story" tagline.

---

## Recent Work — May 22, 2026 Session

Marketing-site polish: blog readability, contact-form spam defense softening, and a full fix of the "Get Started"/pricing anchor. All changes committed + pushed to `origin/main`.

- **Blog section fixed (`0ff207b`, prior in this session).** The blog index + all 9 article pages were dark-text-on-dark — they inherited `marketing.css`'s dark `#1a1510` body but were designed as light "paper" pages. Added a light-theme body override (`#faf7f2` bg / `#2C2318` text) to `blog-index.ejs` and every `blog-*.ejs`. Verified live: index + articles render readably.
- **Contact form no longer blocks real customers (`dc474db`).** In `src/routes/api/contact.js`, a **missing** Cloudflare Turnstile token used to return a hard 400. Now it falls through to honeypot + rate-limiter (logged via `console.warn`) instead, so a real visitor who blocks `challenges.cloudflare.com` (privacy extension, ad blocker, corporate net, VPN/Tor) can still submit. **Bad/forged tokens are still rejected.** Honeypot (`website` field) + 5-msg/15-min limiter unchanged.
- **Every "Get Started" CTA now lands on the pricing section (`dc474db`, `cba82dc`, `2cacdc5`, `7394ff2`).**
  - Nav CTAs on `landing.ejs` + `landing-v2.ejs` now target `#pricing` (were opening the founder modal).
  - 7 blog article-footer "Get Started" buttons repointed from bare `https://legacyodyssey.com` → `/#pricing`.
  - **Root cause of the "lands at the top" bug:** the site sets `html { scroll-behavior: smooth }` globally, so a cross-page `/#pricing` jump became a long *animated* scroll that lazy-loading images aborted mid-flight, stranding the visitor near the top. **Fix:** an on-load handler (`jumpToHash`) in both landing pages that temporarily forces `scroll-behavior:auto`, does `window.scrollTo(0, el.top - navHeight)`, restores, and re-runs at +250ms/+700ms for late layout shifts. Added `scroll-margin-top` to `#pricing/#features/#how-it-works/#help`. Same-page anchor clicks keep native smooth scroll; in-pricing-card buttons still open the checkout modal. **Verified live end-to-end** (blog → Get Started → lands on "Simple, honest pricing").

### Open items after this session
- **`TURNSTILE_SECRET_KEY` = `0x4AAAAAADSqsyM1OnquACl8Uf6PJN0IqSo` still needs to be added to Railway env vars** (user action). Until then server-side Turnstile verification is skipped (honeypot still defends). After today's change, even once live it only rejects bad/missing-when-present tokens — never a human who couldn't load the widget.
- **`www.legacyodyssey.com` 404s** — needs `www` added as a Railway custom domain or a Cloudflare 301 www→apex redirect (carried over, not done).
- **Uncommitted/untracked files in `F:\legacy-odyssey`** belong to OTHER sessions (marketing assets, `mobile/src/api/client.js`, `DashboardScreen.js`, business-plan PDFs, etc.). Deliberately NOT committed this session — some may be sensitive (`Legacy_Odyssey_Project_Accounts.pdf`, business plan). Left untouched.

### Brainstorm captured (NOT implemented — Dan was thinking through it)
Topic: making customer book sites easy to share, especially after an update. Dan's proposal: parent builds their own contact list (names/emails/phones) of approved viewers, selects a person/group, shares via email and/or text, message says "contact [parent] if you don't remember the password."
- **Strong core:** parent-curated allowlist fits the privacy-first product and doubles as the audience list for an "update notification" engine.
- **Flaws I raised:** (1) "ask me for the password" re-introduces the friction the curated list removes → recommend **per-person magic links** as primary access, password as fallback, never put the actual password in the message. (2) **Business-sent SMS = TCPA/A2P 10DLC + deliverability minefield** → use **native share sheet** (parent's own Messages/Mail) for personal invites (trusted, free, compliant), reserve **server-side email via Resend** for opt-in update digests, defer/avoid server SMS. (3) Storing third-party PII is real responsibility (breach + consent + revocation). (4) Manual contact entry is friction for a new parent → import from phone contacts, make incremental. Per-person tokens also enable revoke + "who viewed" analytics → feeds a referral loop. Offered to map either approach into `requireBookPassword` + data model on paper next time.

---

## Recent Work — May 19, 2026 Session

Follow-up day: web editor parity, contact-form spam defense, customer-facing gift fixes.

- **Web "Website Sections" page** built at `/account/book/sections` — toggle switches for each of the 12 sections, syncs with the mobile ManageSections screen. Stores only deviations from content auto-detection so an untouched section keeps auto-showing when it gets content. Reachable from a new card on the My Book hub.
- **My Book hub: emoji → Lucide icons.** Hub now matches the app and book viewer (Sparkles / BookOpen / Compass / Heart / Home / Calendar / Users / Star / Gift / Mail / UtensilsCrossed / Archive / Lock / Globe). The pre-existing "you can't keep forever" wording on the Keepsakes card was deliberately left as-is per Dan.
- **Gift purchase fixes (Miss Katie incident, dragno65@hotmail.com):**
  - `/gift/success` was bouncing buyers to `/gift` when a webhook/redirect race created duplicate `gift_codes` rows; switched the `.single()` lookups to `.order().limit(1)` in `book.js` and `giftService.js`.
  - Migration 017 (gift_codes stripe_session_id unique index) **finally applied** — prevents the duplicate-row race at the DB level.
  - `createGiftCode` now recognizes `'print'` delivery method (was silently coerced to `email_now`).
  - **Gift year now starts at redemption**, not purchase (`trialEnd = new Date() + months_prepaid`). Gift codes **no longer expire** (column kept NOT NULL with a far-future date; the expiry check in `redeemGiftCode` removed). The "Code expires …" line dropped from the printable certificate.
  - Dan's existing GIFT-5Y4G-MQTZ-PYMZ row (for Miss Katie) was de-duped + `delivery_method` corrected to `print` + `expires_at` updated to match the new policy.
- **Admin dashboard:** "Trialing" KPI removed; Total/Active/Canceled/Archived cards are clickable and filter the customer table in place (`/admin?filter=…`).
- **Contact form spam defense (both landing.ejs + landing-v2.ejs):**
  - Layer 1 — **honeypot** (hidden `website` field, off-screen + aria-hidden; non-empty value → silent 200 drop server-side).
  - Layer 2 — **Cloudflare Turnstile** in Managed mode. Site Key hardcoded (`0x4AAAAAADSqswy0UC1jvjWd`); server validates `cfTurnstileToken` against `https://challenges.cloudflare.com/turnstile/v0/siteverify` using `TURNSTILE_SECRET_KEY` env. Skipped gracefully when the secret isn't set, and on CF-side fetch errors. Hostnames added: `legacyodyssey.com` and `www.legacyodyssey.com`.
  - ⚠️ **OPEN:** `TURNSTILE_SECRET_KEY` (`0x4AAAAAADSqsyM1OnquACl8Uf6PJN0IqSo`) must be added to Railway env vars before server-side verification activates. Until then the widget renders but verification is a no-op (honeypot still defends).
- **Railway major outage May 19** ~22:29 UTC — "no healthy upstream" / fallback 404s on legacyodyssey.com. Confirmed via status.railway.com; not our code. Was still ongoing when Dan signed off.
- **www.legacyodyssey.com 404s** — separate, pre-existing config issue surfaced during the outage probe: Railway has no custom domain registered for `www.`. Non-www works. To fix: add `www.legacyodyssey.com` as a Railway custom domain (or set a Cloudflare 301 redirect www → apex). Not addressed today; flagged for follow-up.

## Recent Work — May 17–18, 2026 Session

Non-traditional-family features, gift fixes, admin tweaks, and mobile v1.0.12 shipped. **All migrations 017–021 applied.**

- **Website Sections toggle fixed** — `books.visible_sections` column never existed; the mobile/web toggle was a silent platform-wide no-op. Migration 018 added the column.
- **Welcome page optional fields** — migration 019 (`books.welcome_fields`). Birth-stat tiles (Time/Weight/Length/etc.) auto-hide when empty + per-tile toggles. The "name subtitle" (`name_quote`) is now editable on the web editor too.
- **"Your Journey to Us"** — new optional section, migration 020 (`journey_story` + `journey_photos`). Single story page for adoption/surrogacy/foster families, sibling to Birth Story. Built across visitor site (`book/journey.ejs`), web editor (`/account/book/journey`), and mobile (`JourneyScreen`). Section-toggle key `journey`. Renamed from "Adoption Story" per Dan. Mockup route: `/preview/adoption-story-mockup`.
- **Birth Story perspectives** — migration 021 (`birth_stories.person1_label/person2_label`). Each perspective optional + auto-hides when empty; "From ___'s Point of View" label is selectable (Mom & Mom, Dad & Dad, single parent, etc.). Editor labels made generic. NOTE: the "Chapter Two" eyebrow in `birth.ejs` was deliberately left as-is per Dan.
- **Gift flow:**
  - Recipient email now optional — new "I'll give it to them myself" delivery option (`deliveryMethod` value `print`).
  - Fixed `/gift/success` bouncing to `/gift`: a webhook/redirect race created duplicate `gift_codes` rows and `.single()` errored. Now uses `limit(1)`. Migration 017 (unique index) finally applied; duplicate rows cleaned up.
  - Gift year now starts at **redemption**, not purchase; gift codes **no longer expire** (matches the `/gift` FAQ). Certificate no longer prints an expiry date.
- **Admin dashboard** — removed the "Trialing" KPI; Total/Active/Canceled/Archived cards are now clickable and filter the customer table (`/admin?filter=…`).
- **Mobile v1.0.12** — built + submitted to both stores (see App Store Status above).

## Recent Work — Apr 25–27, 2026 Session (E2E testing — Annual ✓ Gift ✓ Monthly pending)

User has been doing live end-to-end purchase testing on their phone with real money: **Annual → Gift → Monthly** (Monthly still TODO). Bugs are fixed and deployed mid-test. Many problems were uncovered; commits below.

### Critical infrastructure findings
- **Railway custom-domain cap = 20 per service on Pro.** Confirmed via existing Central Station thread. Brody (Railway employee) said they can bump to 30 temporarily on request, but the long-term answer is **Cloudflare for SaaS** (TLS termination + Host-header proxy) so Railway only needs ONE custom domain entry. User filed a private Central Station support ticket Apr 26 asking for the bump. Banner in dashboard: "You have hit the custom domain limit for your plan." Failing all new gift signups until resolved.
- **Spaceship "URL Redirect" connection** auto-injects locked `group: product` apex A records pointing at parking IPs (15.197.162.184). Cannot remove via API — only via Domain Manager → click domain → URL redirect → Remove connection. Discovered via roypatrickthompson.com Apr 25; documented in BLOCKS.md.
- **Spaceship's PUT /dns/records is non-destructive.** It appends. To actually replace, must DELETE first. The ad-hoc cleanup scripts (`scripts/repair-apex-dns.js`, `scripts/delete-stale-a-records.js`, `scripts/check-spaceship-dns.js`) handle this.

### Mid-test commits (newest → oldest)
- **`e38d4a7`** — Auto-disable Spaceship auto-renew when domain order fails post-registration. Stops orphan domains auto-billing. Triggered by legacyodysseytest5/6.com losing $25.98 (already disabled manually too).
- **`9ad0150`** — Removed real family names from all placeholders (admin add-customer, family-detail, account-book-child-info, account-book-family-member, gift recipient name). Replaced with Sophia/Smith/Sam Smith/Sarah Smith. Memory note `feedback_no_real_names.md` enforces.
- **`1a65934`** — Customer-initiated reactivation flow. Cancelled families now see a "Reactivate — $49.99/year" card on /account/dashboard. Stripe Checkout → webhook → un-archive + restore Spaceship auto-renew + welcome-back email. All book content preserved. Also added show-password toggle on /account login.
- **`681d4da`** — `findByAuthUserId` / `findByEmail` prefer non-archived families. Was returning the OLDEST (often cancelled) family for a customer with multiple, so re-signed customers saw their dead account on dashboard.
- **`58661e8`** — Webhook race fix: cancellation triggered Stripe `customer.subscription.updated` with status='trialing' + cancel_at_period_end=true; old code treated archived+trialing as a reactivation and fired welcome-back email immediately after the cancel email. Now skips reactivation if `cancel_at_period_end=true` OR family was archived <60s ago.
- **`e2902ed`** — DB migration: drop strict UNIQUE on families.auth_user_id and families.email; replace with partial unique indexes WHERE archived_at IS NULL. Allows cancel→re-signup without violating constraints. Migration `012_partial_unique_families.sql` already applied on Supabase.
- **`a816441`** + **`82330d4`** — Set-password success page: offer web sign-in alongside the apps; logo now links home.
- **`bbfc46e`** — Surface real Supabase password-update error instead of generic "Failed to update password" (helped diagnose pwned-password rejection of "Hunter65!"; "Hunter6565!" worked).
- **`80d4c91`** — Redeem success points "Sign in" to /account (was /login → 404), prompts to set password first via email.
- **`00a7e40`** — Gift redeem: reuse existing Supabase auth user when email already exists (cancelled customer redeeming a gift); always return JSON errors so client can display them.
- **`a636b3b`** — `/redeem` got founder-modal-style domain search (Check button + alternatives + auto `.com` append). Also added Gift tier as third side-by-side card on the pricing section (was a standalone button below).
- **`726c49c`** — Disclose post-gift-year auto-renewal on /gift; fixed bug where post-trial subscription used $4.99/month instead of $49.99/year.
- **`d5b658e`** + **`e2bf14e`** — Gift price corrected to $29 (display + Stripe charge).
- **`36f2538`** — Domain pipeline hardening: separate try/catch for www vs apex add (so apex failure no longer marks order `active` silently); `setupDns` re-fetches records and throws if locked product-group records remain; Block 2 health check now uses `isFullyServing` (apex AND www required) instead of `isSiteLive` (either OK).
- **`131b5ec`** — Editable birth-story headlines (`mom_title` / `dad_title` on `birth_stories`). Migration 011 applied. Mobile UI in v1.0.7+, web edit works now.
- **`5837950`** — Show/hide password toggle on set-password page; welcome email mentions Settings → Book Password.
- **`eab5a23`** — Founder modal: Check button hidden on mobile (flex min-width).

### Customer state after this session
| Family | Status |
|---|---|
| Eowyn | apex repaired (was on stale GitHub Pages IPs); now serving |
| Lindsey/Emma | apex added + serving |
| Roy | URL Redirect removed in Spaceship; apex in Let's Encrypt CA challenge; serves once issued |
| Jeff | apex DNS correct; Railway "Waiting for DNS update" UI lag (also affects Kate's working site, so this is a Railway display bug) |
| Kate | working on both apex + www (UI shows misleading "waiting" status) |
| `legacyodysseytest5.com` + `legacyodysseytest6.com` | failed gift test domains; Spaceship registered ($25.98 lost) but Railway add hit cap; auto-renew DISABLED so they lapse next year |
| `lotest1.com` | annual test, cancelled + auto-renew off |

### Open loops
1. **Apex 404 on kateragno.com + your-family-photo-album.com** — Railway custom-domain cap (20) is full and adding the apex returns "Not available" / "Domain in use". www works for both. Two paths: (a) free up Railway slots by deleting old per-customer entries that Approximated has replaced — Roy's, Eowyn's, etc. www and apex Railway customs are now redundant; (b) re-add a Spaceship URL Redirect for apex → www on those 2 domains (ironic but works).
2. **Cancel Cloudflare for SaaS subscription** ($7/mo savings — no longer used; only DNS for `legacyodyssey.com` zone needs CF).
3. **Free up the 14 stale Railway custom-domain slots** for migrated customers — delete `www.eowynhoperagno.com`, `eowynhoperagno.com`, `www.roypatrickthompson.com`, `roypatrickthompson.com`, etc. from Railway. All traffic now flows through Approximated. Once cleaned, we'll have 18 free slots for the 2 stragglers above + future overflow.
4. **Continue E2E test** with Monthly subscription (Annual + Gift already done).
5. **Wait for Apple/Google review of v1.0.6** (submitted Apr 25).
6. **Delete zombie Railway service** at `legacy-odyssey-production-a9d1.up.railway.app` once v1.0.5+ has propagated on both stores.
7. **Refunded gift codes don't auto-invalidate** — gift_codes.status stays `purchased` even after Stripe refund. Webhook on `charge.refunded` should mark code invalid.
8. **#6 Store descriptions** update (deferred per user).
9. **Spacemail per-mailbox forwarding** still working via `replyTo: gmail` safety net.

## Earlier Fixes (Apr 19, 2026 session)

**Photo-loading bug:** Two Railway services existed. `legacyodyssey.com` ran current code; `legacy-odyssey-production-a9d1.up.railway.app` was a zombie running stale code (v2.1.0 vs v2.2.0). Mobile `BASE_URL` fallback was pinned to the zombie, so server-side fixes never reached the app.

**Fix (commit `1a495d0`):** Changed `mobile/src/api/client.js` `BASE_URL` fallback to `legacyodyssey.com`. Bumped to 1.0.5. Detector: compare `/health` `version` field across both hostnames.

**Apple review demo password:** `review@legacyodyssey.com` / `TestPass-2026!` (reset via service-role `supabase.auth.admin.updateUserById`).

## Earlier Fixes (Apr 19, 2026 session)

**Photo-loading bug:** Two Railway services existed. `legacyodyssey.com` ran current code; `legacy-odyssey-production-a9d1.up.railway.app` was a zombie running stale code (v2.1.0 vs v2.2.0). Mobile `BASE_URL` fallback was pinned to the zombie, so server-side fixes never reached the app.

**Fix (commit `1a495d0`):** Changed `mobile/src/api/client.js` `BASE_URL` fallback to `legacyodyssey.com`. Bumped to 1.0.5. Detector: compare `/health` `version` field across both hostnames.

**Apple review demo password:** `review@legacyodyssey.com` / `TestPass-2026!` (reset via service-role `supabase.auth.admin.updateUserById`).

---

## Code Structure

```
F:\legacy-odyssey\
├── src/                        # Express API server
│   ├── server.js               # Entry point
│   ├── config/                 # DB, Supabase, Stripe, Spaceship configs
│   ├── middleware/              # Auth, error handling, family resolution
│   ├── routes/
│   │   ├── api/
│   │   │   ├── auth.js         # Sign up, login, JWT — DELETE /account route (lines 167-211)
│   │   │   ├── books.js        # CRUD for all book content
│   │   │   ├── stripe.js       # Subscription management
│   │   │   └── domains.js      # Domain search
│   │   ├── book.js             # Web book viewer routes
│   │   ├── admin.js            # Admin panel
│   │   └── webhooks.js         # Stripe webhook handler
│   ├── services/
│   │   ├── spaceshipService.js # Spaceship API wrapper
│   │   ├── domainService.js    # Domain search + purchase orchestration
│   │   ├── railwayService.js   # Railway GraphQL API
│   │   └── stripeService.js    # Stripe checkout
│   ├── views/
│   │   ├── book/               # Web book viewer EJS pages
│   │   ├── layouts/            # Shared layouts
│   │   ├── admin/              # Admin panel pages
│   │   └── marketing/          # Landing + success pages
│   └── public/                 # Static assets
│
├── mobile/                     # React Native (Expo)
│   ├── App.js                  # Root: AuthProvider + NavigationContainer
│   ├── app.json                # EAS config — NSCameraUsageDescription here
│   └── src/
│       ├── screens/
│       │   ├── SettingsScreen.js   # Account deletion (lines 225-238) + Manage Subscription (lines 199-212)
│       │   ├── DashboardScreen.js
│       │   └── [all other screens]
│       └── api/client.js       # API base URL logic
│
├── supabase/migrations/        # SQL migrations
├── screenshots/                # App Store screenshots (screenshot1-3.png, 6.5" iPhone)
└── CLAUDE_CONTEXT.md           # Older context file (superseded by this CLAUDE.md)
```

---

## Mobile App Navigation

**Auth Stack:** Login → Signup

**App Stack (authenticated):**
| Route | Screen File | Description |
|-------|-------------|-------------|
| Dashboard | DashboardScreen.js | Main hub |
| ChildInfo | ChildInfoScreen.js | Baby info |
| BeforeArrived | BeforeScreen.js | Pregnancy story |
| BirthStory | BirthStoryScreen.js | Birth narrative |
| ComingHome | ComingHomeScreen.js | Coming home story |
| Months | MonthsScreen.js | Month 1-12 grid |
| MonthDetail | MonthDetailScreen.js | Individual month |
| OurFamily | FamilyScreen.js | Family members |
| FamilyMember | FamilyMemberScreen.js | Add/edit member |
| YourFirsts | FirstsScreen.js | First smile, word, etc. |
| Celebrations | CelebrationsScreen.js | Birthday parties, holidays |
| Letters | LettersScreen.js | Letters to child |
| FamilyRecipes | RecipesScreen.js | Recipe collection |
| TheVault | VaultScreen.js | Document storage |
| Settings | SettingsScreen.js | Account, subscription, delete |
| Preview | PreviewScreen.js | WebView of book viewer |

Visual screen reference: `F:\legacy-odyssey\app-screen-reference.html`
Label system: e.g. "3-d" = Child Info card on Dashboard. Open the HTML file to see all labels.

---

## ✅ CANONICAL PRODUCT DESCRIPTION (use this everywhere — copy, briefs, bios, campaigns)

> Legacy Odyssey is a digital baby book — built as a real website at your child's own .com domain. Your baby gets their name as a website. Parents fill in milestones, photos, and letters through the iOS & Android app. Family visits the book at your-childs-name.com, straight from any browser. Password-protected. $29 for the first year.

**This is the approved description. Do not paraphrase it, do not add qualifiers, do not mention "family photo albums", do not say "forever", do not call it a "story". Use it verbatim or adapt only the length — never the meaning.**

---

## Design System

```javascript
colors: {
  background: '#faf7f2',   // Warm cream
  dark: '#1a1510',          // Near-black
  gold: '#c8a96e',          // Primary accent
  goldLight: '#d4bb8a',
  goldDark: '#b08e4a',
  textPrimary: '#2c2416',
  textSecondary: '#8a7e6b',
  card: '#f0e8dc',
  white: '#ffffff',
  error: '#c0392b',
  border: '#e0d5c4',
}
```
Web viewer fonts: Cormorant Garamond + Jost (Google Fonts).

---

## Key Database Records

### Primary Family (Eowyn's Book — owner's own book)
- Family ID: `fb16691d-7ea4-4c93-9827-ffe8904ced6b`
- Book ID: `501e0807-d950-4004-8b4c-9b0f0ce0c910`
- Subdomain: `eowynragno`
- Custom Domain: `eowynhoperagno.com`
- Email: `dragno65@hotmail.com`

### Apple Review Demo Account
- Email: `review@legacyodyssey.com`
- Status: ACTIVE
- Purpose: For App Store reviewers to test the app

### Admin
- Admin URL: `https://legacy-odyssey-production-a9d1.up.railway.app/admin/login`
- Admin email: `dragno65@hotmail.com`

---

## Active Customers (as of April 13, 2026)
- **kateragno Family** — dragno65@gmail.com, kateragno.com, ACTIVE
- **Eowyn Ragno (owner)** — dragno65@hotmail.com, eowynhoperagno.com, ACTIVE
- **Lindsey Cherry** — lindsey.e.cherry@gmail.com, emmacherry.com, ACTIVE
- **Roy Patrick Thompson** — eowynkiller@gmail.com, roypatrickthompson.com, ACTIVE
- **Apple Review Demo** — review@legacyodyssey.com, ACTIVE (password: "password")
- **your-family-photo-album** — your-family-photo-album.com, ACTIVE (demo site)
- Test accounts: John (test@test.com), Preet Rana (preetrana2355@gmail.com)

---

## How to Run Locally

```bash
# Server
cd E:/Claude/legacy-odyssey
npm run dev
# → http://localhost:3000

# Mobile app (Expo web for testing)
cd E:/Claude/legacy-odyssey/mobile
npx expo start --web --port 8082
# → http://localhost:8082 — click "Browse Demo" to skip auth

# View screen reference
cd E:/Claude/legacy-odyssey
python -m http.server 9876
# → http://localhost:9876/app-screen-reference.html
```

---

## Pending Tasks (as of April 27, 2026 evening)

1. **Free up Railway custom-domain slots** by deleting per-customer entries (`www.eowynhoperagno.com`, `eowynhoperagno.com`, `www.roypatrickthompson.com`, `roypatrickthompson.com`, etc.) — all traffic flows through Approximated now, the Railway entries are dead weight.
2. **Add `kateragno.com` and `your-family-photo-album.com` apex** to Railway after slots free up. Or keep them on Approximated apex only, with a Spaceship URL Redirect for apex → www as fallback.
3. **Update Block 2 health check** to verify each Approximated vhost has `has_ssl=true` and `apx_hit=true`. Current check just curl-tests the URL.
4. **Cancel Cloudflare for SaaS subscription** — no longer used for customer routing. CF is still needed for `legacyodyssey.com` zone (DNS, R2 photos). Just cancel the SaaS add-on.
5. **Continue E2E test with Monthly subscription** — paused while we migrated. Annual + Gift already tested with real money + refunded.
6. **Wait for Apple review of iOS 1.0.6** — submitted Apr 25 (build 16). Check ASC.
7. **Wait for Google Play review of v1.0.6** — versionCode 14, submission `a117abb9-5864-46e5-9def-85cab7bacc2b`. Submitted Apr 25.
8. **Refunded gift codes auto-invalidation** — gap: refund a gift in Stripe doesn't change `gift_codes.status`. Webhook on `charge.refunded`.
9. **Delete zombie Railway service** at `legacy-odyssey-production-a9d1.up.railway.app` — only after v1.0.5+ has propagated on both stores.
10. **#6 Store descriptions** — deferred per user.
11. **Spacemail per-mailbox forwarding** — eventual cleanup; current `replyTo: gmail` on every transactional email is the working safety net.
13. **Delete `cloudflareService.js`, old CF migration scripts** — dead code now that Approximated is the customer-domain layer.

---

## Technical Notes

- **Windows curl:** Always use `--ssl-no-revoke` flag
- **Chrome extension disconnects** — reconnect via Claude Desktop + Chrome extension same account
- **Demo mode:** "Browse Demo" on login screen = isAuthenticated true + isDemo true, no real API calls
- **API base URL:** `EXPO_PUBLIC_API_URL || API_URL || 'https://legacy-odyssey-production-a9d1.up.railway.app'`
- **Auth:** JWT Bearer tokens in expo-secure-store, axios interceptor auto-attaches
- **Domain registration is async** — Spaceship returns 202 + operation ID, poll `/async-operations/{id}`
- **Spaceship rate limits** — 5 req/domain/300s for availability; use bulk endpoint + 5-min cache
- **Supabase:** Cannot run DDL (ALTER TABLE) from API — use Supabase SQL Editor dashboard
- **Railway CNAME Target env var:** needed for custom domain setup
- **⚠️ PASSWORD RESET — TWO SEPARATE FLOWS (don't confuse them):**
  1. **Web self-serve reset** — web `/account` login → "Forgot your password?" → `POST /account/reset-password` (`account.js`) → `generateLink({type:'recovery'})`, `redirectTo` = `/account/reset-password` (view `account-reset-password.ejs`). The token arrives in the **URL hash** (`#access_token=…&type=recovery`). Was broken (read query param, not hash) — **fixed `9f92d55`, May 13 2026, caught by "Ashley."**
  2. **App / API reset** — app `ForgotPasswordScreen` → `POST /api/auth/reset-password` (`api/auth.js`) → `supabaseAnon.auth.resetPasswordForEmail(email, { redirectTo })`. `redirectTo` was `/reset-callback`, **a route that never existed** → customers got Express 404 "Cannot GET /reset-callback." Broken since `bd3879b` (Mar 21 2026); historically patched per-customer by hand. **Fixed `1102a28`, Jun 8 2026:** `redirectTo` → `/set-password` AND added a `/reset-callback` alias route (both render `set-password.ejs`, which reads the hash `access_token` → `PUT /auth/v1/user`). Web-only fix; app needs no rebuild (it just calls the server endpoint). `supabaseAnon` uses default implicit flow → token in hash (matches `set-password.ejs`).
  - **Canonical recovery landing page = `set-password.ejs`** (served at `/set-password` AND `/reset-callback`); welcome/gift/admin emails all use `/set-password`. Reset links expire on Supabase's timer (~1h) — if stale, request a fresh one.


---

## DO NOT SEND — historical actions completed

- **Welcome email to Reese, Lachlan, Jeff:** ALREADY SENT. Do NOT send another.
- **No unprompted kateragno.com diagnostics.** Don't surface this until Dan raises it.
