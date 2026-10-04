# Google Play Store

**Status:** v1.0.5 live; v1.0.6 submitted to production track
**Owner:** Legacy Odyssey Android app distribution
**Last touched:** 2026-04-28; archive-review additions 2026-10-04 at the bottom

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


## Update 2026-10-04 (archive review)

### versionCode history (after 1.0.6)
1.0.9 vc 20; 1.0.10 vc 21; 1.0.11 vc 24 (vc 22 superseded, vc 23 burned by a failed EAS retry); 1.0.16 vc 29; 1.0.17 vc 30; 1.0.18 vc 31; 1.0.19 vc 32; 1.0.20 vc 33; 1.0.22 vc 35; 1.0.23 vc 36; 1.0.24 vc 38; 1.0.26 vc 40 (100% rollout 2026-06-27). 1.0.21 was submitted to production 2026-06-24; whether it rolled out or was replaced by 1.0.22 is unverified. Later: STATUS.md.

### Console facts
- Managed publishing is OFF: an `eas submit` production release enters review automatically and auto-publishes on approval. "Completed" from eas/API is the rollout setting, not "live": check the track page for "in review".
- Listing edits: "Save as draft" (not submitted) vs "Save" (stages), then "Submit N changes for review". Submitting listing changes while a release is in review asks "Restart review" and bundles both (done for 1.0.22).
- Assets: phone screenshots 9:16 (1080x1920; the iOS 1242x2688 set is too tall), feature graphic 1024x500, promo video must be a public or unlisted YouTube URL (not private, not age-restricted, monetization off; a vertical Short was accepted).
- Tablet 7in and 10in slots still carried the old banned "Your Family's Story, Beautifully Told" image when last checked 2026-06-25 (open).
- The service-account key can release to PRODUCTION but not testing tracks (internal-track submit fails with a permission error). Fix if wanted: grant "Release to testing tracks". Dan prefers straight-to-production anyway (he tests the live build on his Android phone).
- The CLI once reported a false "already submitted" for 1.0.26 while it was in review: confirm in Publishing overview before re-running.
- Ctrl+A on an unfocused field adds a stray "a" (Video URL field): click, Ctrl+A, Delete, retype. Zoom/layout shifts break coordinate clicks. Dan drag-drops files; the Chrome tool's file_upload rejects F: paths.
- Verify the track status without a login: Play Developer API with the service-account JSON and a self-signed JWT (python cryptography + requests): create a throwaway edit, read the track, discard the edit.
- An unread Play notice about Android developer verification existed in April 2026; check the inbox.
