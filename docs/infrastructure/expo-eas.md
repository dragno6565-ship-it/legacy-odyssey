# Expo / EAS

**Status:** active
**Owner:** Legacy Odyssey mobile app build pipeline
**Last touched:** 2026-04-28

## What it is
Expo (managed React Native runtime) + EAS (Expo Application Services for build/submit). Builds the iOS and Android apps from `mobile/` directory.

## Where it's used
- `mobile/` — entire React Native app
- `mobile/app.json` — EAS config (NSCameraUsageDescription etc.)
- `eas build` for production builds → uploaded to Apple/Google
- `eas submit` for App Store / Play Store submission

## Current configuration
- **Account:** `dragno65`
- **EAS Project ID:** `14daf713-2b41-4ac0-b413-1179afa6e6a9`
- **Project URL:** https://expo.dev/accounts/dragno65/projects/legacy-odyssey
- **Builds page:** https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds
- **iOS build numbers:** managed remotely via EAS (`appVersionSource: "remote"` in app.json)
- **Mobile API target:** `EXPO_PUBLIC_API_URL || API_URL || 'https://legacy-odyssey-production-a9d1.up.railway.app'` ⚠️ STALE — should be `legacyodyssey.com` in fresh installs (commit `1a495d0` Apr 19)

## Latest builds
- **iOS 1.0.6 (build 16):** id `ef12b3b7-38f3-4875-a74a-5437c2609759` — submitted Apr 25 2026 for App Store review
- **Android 1.0.6 (versionCode 14):** build id `e27db0cd-cba0-4131-b5f5-794e8dfa93fc` (AAB) — submission `a117abb9-5864-46e5-9def-85cab7bacc2b` to Google Play

## History
- 2026-02 — Project created on Expo
- 2026-04-19 — Mobile BASE_URL fixed to `legacyodyssey.com` (was pinned to zombie Railway service); commit `1a495d0`. Bumped to 1.0.5.
- 2026-04-22 — v1.0.5 (build 15) released to both stores
- 2026-04-25 — v1.0.6 (build 16) submitted for review (Cancel Subscription flow + removed Family Album navigator)

## Related
- `infrastructure/apple-app-store.md`
- `infrastructure/google-play.md`
- `infrastructure/railway.md` — mobile app's API target

## Open issues / quirks
- **Zombie Railway service URL** is still the fallback in mobile code if env var isn't set. Delete zombie service AFTER v1.0.5+ has fully propagated (per CLAUDE.md open loops).
- **EAS build minutes** quota — at scale this becomes a real cost. Currently fine.
