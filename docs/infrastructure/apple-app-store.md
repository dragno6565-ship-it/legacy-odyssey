# Apple App Store

**Status:** v1.0.5 live; v1.0.6 in review
**Owner:** Legacy Odyssey iOS app distribution
**Last touched:** 2026-04-28

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
