# Google Play Store

**Status:** v1.0.5 live; v1.0.6 submitted to production track
**Owner:** Legacy Odyssey Android app distribution
**Last touched:** 2026-04-28

## What it is
Google Play Console listing for Legacy Odyssey Android app. Hosted under DOR Industries' developer account.

## Current configuration
- **Developer:** DOR Industries
- **Login:** `albumerapp2@gmail.com` (uses u/2 in Chrome)
- **Developer ID:** `7255543911428830238`
- **App ID:** `4975186349665269659`
- **Console URL:** https://play.google.com/console/u/2/developers/7255543911428830238/app/4975186349665269659/app-dashboard
- **Service account key for EAS submit:** `C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json`

## Version history

| Version | versionCode | Status | Date |
|---|---|---|---|
| 1.0.2 | 9 | In Production | earlier Apr 2026 |
| 1.0.3 | 10 | In Production | Apr 13 2026 |
| 1.0.5 | 13 | In Production | Apr ~22 2026 |
| 1.0.6 | 14 | ⏳ Submitted to production track | Apr 25 2026 — submission `a117abb9-5864-46e5-9def-85cab7bacc2b`. Build id `e27db0cd-cba0-4131-b5f5-794e8dfa93fc` (AAB) |

## History
- 2026-04-25 — v1.0.6 submitted
- 2026-04-22 — v1.0.5 released

## Related
- `infrastructure/expo-eas.md` — builds + submits
- `infrastructure/apple-app-store.md` — iOS counterpart

## Open issues / quirks
- **NEVER submit without explicit user permission** (CLAUDE.md hard rule)
- **Service account key location is a single Downloads folder file** — should be moved to a more durable location, but operational right now
