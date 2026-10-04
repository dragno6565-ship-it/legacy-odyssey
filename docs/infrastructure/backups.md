# Backups

**Status:** active (both scheduled tasks "Ready" as of 2026-10-04)
**Owner:** coding session (Dan's PC)
**Last touched:** 2026-10-04 (documented from retired coding sessions; was undocumented)

## What exists
| Backup | How | Schedule | Output |
|---|---|---|---|
| Data (Supabase + photos) | Windows task `LegacyOdyssey-NightlyBackup` runs `F:\backups\backup.py` | nightly 02:17 | Supabase JSON dump `F:\backups\supabase\<date>\tables.json.gz`; photo mirror `F:\backups\photos\` |
| Repo mirror | Windows task `LegacyOdysseyDailyBackup` runs `F:\legacy-odyssey\scripts\backup-to-e.ps1` (robocopy /MIR to `E:\Claude\legacy-odyssey-backup`, excludes node_modules and .tmp, keeps .git) | daily 03:00 | E: mirror. Robocopy exit code 1 = success. |
| Offsite code | `git push` to GitHub `dragno6565-ship-it/legacy-odyssey` | on push (also deploys) | GitHub |
| Photo blobs | R2 backup cron (`legacy-odyssey-backup-cron` token, R2 write only) | cron | Cloudflare R2 |
| Pre-change snapshots | manual: git tag (e.g. `pre-video-feature`, commit 3a9cafd, pushed) plus an immutable copy under `E:\Claude\legacy-odyssey-snapshots\` (e.g. pre-video_2026-06-03_1104) and per-feature folders under `F:\backups\` | before risky work | |

## Rules (Dan)
- "Make sure everything is backed up first" before any store submission or risky change; keep changes additive and reversible (rollback SQL in the migration header, one commit per phase).
- When adding a table, patch the table list in `F:\backups\backup.py` (it was patched 2026-05-12 for celebration_photos and recipe_photos; later tables may be missing).

## Open questions
- After the 2026-10-04 move of the home to `F:\legacy-odyssey`, is the E: mirror still wanted? ops/PROJECT-MAP.md calls it stale. Dan to confirm the backup routine.
- The F: drive disconnected mid-session once (2026-06); the repo survived. If F: is flaky, push unpushed work to a GitHub backup branch (never main, which deploys).
- Not verified: that `backup.py` covers every table added after May 2026 (videos, custom_galleries, circles, contacts, content_translations, page_views).
