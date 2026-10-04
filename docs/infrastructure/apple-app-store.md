# Apple App Store

**Status:** v1.0.5 live; v1.0.6 in review
**Owner:** Legacy Odyssey iOS app distribution
**Last touched:** 2026-04-28; archive-review additions 2026-10-04 at the bottom

## What it is
Apple App Store Connect listing for Legacy Odyssey iOS app.

## Current configuration
- **Apple Team ID:** `Y3J2B5YA4N`
- **App ID:** `6760883565`
- **App Store Connect URL:** https://appstoreconnect.apple.com/apps/6760883565
- **In-flight URL:** https://appstoreconnect.apple.com/apps/6760883565/distribution/ios/version/inflight
- **Demo account for reviewers:** `review@legacyodyssey.com` / `TestPass-2026!` (password reset via Supabase service-role)

## Version history

| Version | Build | Status | Date |
|---|---|---|---|
| 1.0.1 | 11 | Released | Mar/Apr 2026 |
| 1.0.3 | 13 | Released | early Apr 2026 |
| 1.0.4 | 14 | Released | Apr 14 2026 |
| 1.0.5 | 15 | Released | Apr ~22 2026 (confirmed via iTunes API). Includes photo-loading fix (mobile BASE_URL → legacyodyssey.com) + "Adjust Photo" 404 fix |
| 1.0.6 | 16 | ⏳ Waiting for Review | submitted Apr 25 2026 — Cancel Subscription flow + removes Family Album navigator |

## Screenshots
- Files in `screenshots/` directory: `screenshot1.png`, `screenshot2.png`, `screenshot3.png`
- 6.5" iPhone format

## ASC UI quirk
- ⚠️ **Any scroll/focus blanks the page** in App Store Connect's editor. Workarounds:
  - Resize browser window tall
  - Use `.click()` via JS, not native click
  - Use native value setter: `Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set`
  - **NEVER** call `.focus()` or `.scrollIntoView()`

## History
- 2026-04-25 — v1.0.6 submitted via EAS submit
- 2026-04-22 — v1.0.5 released (the photo-loading fix is in this version)
- 2026-04-19 — Discovered photo-loading bug (zombie Railway service); fix in 1.0.5

## Related
- `infrastructure/expo-eas.md` — builds + submits
- `infrastructure/google-play.md` — Android counterpart

## Open issues / quirks
- **NEVER submit without explicit user permission** (CLAUDE.md hard rule)
- **NEVER click "Submit for Review", "Add for Review", or "Resubmit to App Review"** without explicit user confirmation


## Update 2026-10-04 (archive review)
The version table above stops at 1.0.6. Later history and the working procedures follow. Store state changes often: check ASC itself before stating what is live.

### Version / build history (iOS build; Android versionCode in google-play.md)
| Version | iOS build | Notes |
|---|---|---|
| 1.0.9 | 21 | live about 2026-05-07 |
| 1.0.10 | 23 | live 2026-05-12 (celebrations + recipes) |
| 1.0.11 | 25 | live 2026-05-14 (Help & Support tile) |
| 1.0.16 | 30 | replaced in review by 1.0.17 |
| 1.0.17 | 31 | released 2026-06-04 within hours of swapping it into review |
| 1.0.18 | 32 | |
| 1.0.19 | 33 | |
| 1.0.20 | 34 | |
| 1.0.21 | 35 | uploaded 2026-06-24, never submitted (1.0.22 went instead) |
| 1.0.22 | 36 | i18n + ASO; Ready for Distribution |
| 1.0.23 | 37 | Ready for Distribution |
| 1.0.24 | 38 | |
| 1.0.25 | 39 | removed from review, replaced by 1.0.26 |
| 1.0.26 | 40 | Hindi; Ready for Distribution |
| 1.0.27 | 41 | |
Later versions: see STATUS.md and sessions/coding.md.

### Listing state (2026-06-25)
Name "Legacy Odyssey: Baby Book", subtitle "A baby book at their own .com", 10 screenshots. Builders: `marketing/app-store/make_screenshots.py`, `make_play_assets.py`, `make_product_extra.py`; outputs under `marketing/app-store/`. The old screenshot1-3 listed above were non-compliant ("Your Family's Story", emoji, real names) and were removed 2026-06-04. Promotional Text can change on a live version without review; Name, Subtitle and Keywords need a new version.

### Submission procedure (only with Dan's explicit go for that release)
1. `eas build --platform all --profile production --non-interactive`, then `eas submit -p ios --latest` (or `--id <buildId>` so an older queued build is not uploaded). This ONLY uploads the binary.
2. Wait for Apple processing (5 to 20+ minutes; Apple emails when done; TestFlight shows "Ready to Submit").
3. In ASC (Dan logs in): (+) next to "iOS App", enter the version, Create. Fill What's New (the page can shift so text lands in Keywords; the textarea id is `whatsNew`, set it with the native value setter). Add Build, pick it, Done, Save and confirm the checkmark.
4. "Add for Review", open App Review > Draft Submissions, press "Submit for Review", confirm "1 Item Submitted" and "Waiting for Review" in the sidebar.
5. Bump the in-app version display manually (it has gone stale before).
- Generic "Something went wrong" from EAS submit: check TestFlight / Build Uploads first (the binary may be there), then retry up to 3 times (`--verbose`).
- The 403 `REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED` fails in about 200 ms; the real message is only on the EAS submission web page (Dan must accept the agreement).
- Before each new submission, check both consoles that the previous release is Ready for Distribution / at 100% rollout (Dan, 2026-06-27). Dan prefers one batched app submit per day.

### Swap a build while a version is in review
Version page > "Remove this version from review" > confirm; state becomes "Developer Rejected" and the version number becomes editable (native setter). The old build's Delete button is hover-only: reveal it with a JS `mouseover` dispatch, delete, Add Build, Save, Add for Review, Submit. 2026-06-04 precedent: the swap cost almost nothing (1.0.17 approved within hours). But rapidly superseding builds (1.0.23 to 1.0.26) restarts review each time so nothing gets approved: let one clear first.

### Automation limits
- The browser tool cannot upload local files into ASC (sandboxed file input; F: paths refused): Dan drags screenshots in from Explorer; Claude clicks Save and verifies. file:// URLs are mangled; serve review galleries over local HTTP.
- ASC froze under automation while typing What's New (2026-06-11); Dan clicked the last steps. Screenshots time out often; read_page and Dan's confirmation work better.
- Store reviews: Dan's own review does not appear (stores suppress reviews from developer-linked accounts). expo-store-review in-app prompt was suggested, never agreed.
- App Clip: skipped by Dan 2026-06-25 (separate native target; the website already gives no-install viewing). Revisit only for a named one-tap use case.
- Verify the live iOS version without a login: `https://itunes.apple.com/lookup?id=6760883565`.
