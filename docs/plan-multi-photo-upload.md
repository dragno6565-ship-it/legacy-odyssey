# Plan — Multi-Photo Select & Label (app + web)

> Created 2026-05-27. Status: IN PROGRESS.
> Decisions locked: Your Birth Day after Birth Story · **Model B (gallery)** · key `birthday` · limit 20.
> ✅ Phase 2 "Your Birth Day" WEB shipped (`7ed876a`).
> ✅ Your Birth Day APP side built (`BirthDayScreen` + nav + Dashboard card + ManageSections + API `d97a519`).
> ✅ **Migration 024 RUN** (birthday_photos table live in Supabase).
> ✅ **v1.0.13 RELEASED (May 31, 2026)** on both stores. Mobile batch `808cecf`.
> ✅ **Phase 1 (web multi-select)** shipped `0b3bf65` — Before, Coming Home, Celebrations editors.
> ✅ **Phase 3 (app multi-select)** built `6edae96` → **v1.0.14**: shared `pickAndUploadPhotos` util;
>    Before now dynamic cards + multi-add; Coming Home multi-add; Celebration detail multi-select gallery.
>    Building via EAS (Android `991b005d…`, iOS `f4dc2c00…`); submitting after builds finish.
> ✅ Book viewer: gallery lightbox prev/next arrows + keyboard (`f4009bb`) — Birth Day & all galleries.
> ⏳ STILL OPTIONAL: focal-point/reposition parity on web editors; web rotate control on the rest of the editors.

## ▶️ BUILD + SUBMIT RUNBOOK (Dan runs — Claude can't: needs EAS/Apple/Google creds + cloud build)
1. **FIRST run migration 024** in the Supabase SQL editor (birthday_photos table) or the section stays empty everywhere.
2. From `F:\legacy-odyssey\mobile`:  `eas build --platform all --profile production`  (~15 min cloud build).
3. **TEST the build on your phone** (TestFlight / Play internal) before submitting — this batch (icons, theme,
   picker fix, Birth Day, etc.) has NOT been device-tested. Verify: photo picker, Birth Day add/caption,
   the icon/theme screens, login.
4. Submit:  `eas submit --platform ios`  and  `eas submit --platform android`  (or via App Store Connect /
   Play Console). iOS app 6760883565; Google service acct key at C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json.
5. Bump version/build numbers if EAS doesn't auto (app.json appVersionSource: remote handles iOS build #).
NOTE: the mobile working tree holds the whole session's uncommitted app batch (emoji→icons, Help/ForgotPw
theme fixes, picker fix, $29 copy, Birth Day). EAS build archives the working dir, so they're all included.
Commit the mobile batch before building if you want a clean git state (watch for OTHER-session files).

## Goal / UX
Select **multiple photos at once**, each lands on its **own card** (blank label), then go back and **label them**. Wanted in: **Before You Arrived**, **Coming Home**, the **new "Your Birth Day"** section, and **Celebrations**. Must work on **both** the app and the web editor (CLAUDE.md rule #8 — parity).

## Two reusable building blocks
1. **Web multi-upload** — a "+ Add Multiple Photos" button + `<input type="file" multiple>`. On select: upload each file to `/account/upload` (with the section), show "Uploading 3 of 5…", and for each create a card (card sections) or a gallery row (Celebrations). Labels filled in after, then Save.
2. **App multi-select** — `expo-image-picker launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit })`, then upload each asset → card/gallery per photo. (Builds on the just-made "system picker, no permission" change.) **Requires an EAS build to test/ship.**

## Section-by-section
### A. Before You Arrived  (table: before_arrived_cards — exists)
- **Web:** add multi-upload → one card per photo. (Editor already has cards + single upload + the rotate/checklist work.) — shippable, no migration.
- **App (BeforeScreen):** today it's **4 FIXED cards** with no add/remove. Needs: dynamic card count + add/remove + multi-select. (Bigger app change.)
- **Viewer:** already renders N cards. ✓

### B. Coming Home  (table: coming_home_cards — exists, identical editor pattern to Before)
- **Web:** same multi-upload → card per photo. — shippable.
- **App (ComingHomeScreen):** confirm fixed vs dynamic; add dynamic + multi-select to match.
- **Viewer:** renders N cards. ✓

### C. Your Birth Day  (NEW SECTION — does not exist yet)
The birth-day gallery: who was there, hospital/where born, the doctor, etc.
- **DB migration (Supabase SQL editor — DDL can't run via API):** new `birth_day_cards` table (book_id, photo_path, title/label, body, sort_order) mirroring before_arrived_cards.
- **Section registration:** add key (proposed `birthday`) to the sections list (`account.js` KEYS ~line 638), `visible_sections`, the app ManageSections screen, and the web sections editor.
- **Viewer:** new `views/book/birthday.ejs` + include in `layouts/book.ejs` + sidebar nav entry. Proposed placement: right after **Birth Story**.
- **Web editor:** new `account-book-birthday.ejs` + GET/POST `/book/birthday` routes — multi-upload built in.
- **App:** new `BirthDayScreen` + nav entry + API `/mine/birthday` GET/PUT (uses `updateSectionCards`). Multi-select built in.
- Biggest piece — a full new section on both surfaces.

### D. Celebrations  (tables: celebrations + celebration_photos — gallery model, exists)
- Already multi-photo per celebration. "Multi-select" = bulk-add many photos to a celebration's gallery at once (then caption each — captions already supported, and Rotate/Replace/Delete just shipped).
- **Web:** make celebration-detail "+ Add photo" accept `multiple`; upload each via the existing single-photo add route (sequential). — shippable.
- **App (CelebrationDetailScreen):** multi-select → add each to gallery. Needs build.

## Proposed build order (phases)
- **Phase 1 — Web, no migration, ships live:** multi-select on Before + Coming Home (card-per-photo) and Celebrations (bulk gallery add).
- **Phase 2 — New section "Your Birth Day":** migration → viewer + sidebar → web editor (multi-select) → API → app screen → sections registration. (Migration step needs Dan in the Supabase SQL editor.)
- **Phase 3 — App parity:** multi-select in BeforeScreen, ComingHomeScreen, CelebrationDetailScreen, BirthDayScreen; make Before/ComingHome cards dynamic (add/remove). Bundle into the next **EAS build**.
- **Phase 4 — QA + docs:** verify each section on BOTH surfaces; update TODO + this doc.

## Decisions needed from Dan
1. **"Your Birth Day" placement** in the book order — proposed: right after Birth Story. OK?
2. **Model for Your Birth Day** — card-per-photo with a label (consistent with Before/Coming Home) vs. a captioned gallery (like Celebrations). Proposed: **card-per-photo** (matches the "upload to cards, then label" ask).
3. **Internal section key** — proposed `birthday`. OK?
4. Multi-select **limit** per pick (e.g., 20 at a time)? Proposed: 20.

## Risks / notes
- App Before/Coming Home are fixed-card today → converting to dynamic is real work.
- N photos = N sequential uploads → progress UI + partial-failure handling.
- Migration depends on the Supabase SQL editor (was flaky before).
- App changes don't reach phones without an EAS build (store submission still on hold).
- Every section: not "done" until it works on BOTH app and web.
