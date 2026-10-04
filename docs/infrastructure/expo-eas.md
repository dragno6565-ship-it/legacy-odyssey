# Expo / EAS

**Status:** active
**Owner:** Legacy Odyssey mobile app build pipeline
**Last touched:** 2026-04-28; archive-review additions 2026-10-04 at the bottom

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


## Update 2026-10-04 (archive review)
- **Plan:** Dan upgraded to the Expo **Starter** plan on 2026-06-26 (about $19/month in his words; verify on Expo's billing page). The Free plan had 15 iOS builds/month and 12 were used. He declined OTA (EAS Update) on that day; later sessions may have adopted it, so check before assuming either way.
- **Queue behavior:** free-tier queues held an Android build 30 to 40+ minutes (sometimes hours) and an iOS submit "Queued, Free Tier Queue" for over an hour with no output. Do not kill and re-run (it goes to the back of the queue). Real status is on the expo.dev submission page (Dan's login) and in ASC TestFlight. Piping `eas submit` through `tail` buffers all output until exit. Fast alternative for iOS: upload the IPA with Transporter.
- `eas submit --non-interactive` needs `--latest` or `--id <buildId>`; prefer `--id` so an older queued build is not uploaded. Build numbers burn on rebuilds and retries. Every new EAS build needs its own store version.
- Android submit goes straight to the Play production track via the service-account key (about 2 minutes). iOS submit only uploads the binary; the ASC steps are in apple-app-store.md.
- Poll builds with `eas build:view <id> --json`.
- `.easignore` does not exist: an EAS upload once swept 292 MB of marketing assets (2026-06-25). Low priority to add.
- Pre-build smoke test: an Expo web bundle (`cd mobile && npx expo start --web --port 8085`), then kill the Metro server afterwards (a stray one was left running once). `node --check` does not catch JSX errors: validate screens with @babel/parser (JSX + Flow) from a script inside `mobile/`.
- App screenshots via Expo web + Puppeteer: `scripts/capture-app-screenshots.js` at 414x896 @3x = 1242x2688; the demo account is empty, so use a populated account or a real device.
- App theme tokens: real ones are textPrimary, textSecondary, placeholder, inputBg, shadows.card/button, borderRadius.round. Nonexistent tokens (colors.text, colors.surface, typography.h2, shadows.sm) render washed out; grep new screens for them.
- Android edge-to-edge on Samsung: the nav bar covers bottom buttons and the keyboard covers inputs. Use `KeyboardAvoidingView`, `softwareKeyboardLayoutMode: "pan"` in app.json and `useSafeAreaInsets` bottom padding (added v1.0.24; other screens may still lack it).
- Video uploads: keep-awake during upload (v1.0.25). There is no server-side dedup, so retries after a real network failure can still create duplicate videos.
- The "Mobile API target" fallback note above is historical; the app points at legacyodyssey.com.
