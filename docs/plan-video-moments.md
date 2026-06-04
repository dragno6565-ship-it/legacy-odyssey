# Plan — Video upload ("Moments" section)

> Created 2026-06-02. Status: PLANNED — not started. Resume here next session.
> Research + pros/cons memo lived in the 2026-06-02 chat; decisions locked below.

## Locked decisions (Dan, updated 2026-06-03)
1. **Upload-only** for now — no in-app recording yet.
2. **2-minute cap** per clip — enforced server-side at ingest via Cloudflare `maxDurationSeconds: 120`. (3 min → 90 s → 2 min.)
3. **Site cap: 1,000 minutes total per book** (60,000 sec). Block new uploads once the sum of the book's video durations would exceed it.
4. **Free on all plans** for now — NO Stripe entitlement/gating logic.
5. **Provider: Cloudflare Stream** (transcodes HEVC→HLS, serves off CF CDN → keeps video egress OFF Supabase/Railway).
6. **Placement — THREE contexts** (one shared `videos` table, polymorphic by `context`):
   - **"Video Moments"** — NEW dedicated video-gallery section. Multiple videos.
   - **Celebrations** — per celebration, **multiple** videos each.
   - **Our Family** — per family member, **one** video each (for now).

## Why a dedicated video service (not raw Supabase)
- iPhones record HEVC/H.265 `.mov` → many browsers (esp. Android Chrome) won't play it. Cloudflare Stream transcodes to HLS so playback is universal.
- Video egress is 10–100× photos. Serving from Supabase public bucket ($0.09/GB uncached) would threaten $29–50/yr unit economics. Stream serves off CF CDN instead.
- Current upload path can't handle video anyway: multer **10MB cap** + `memoryStorage()` in BOTH `src/routes/api/upload.js:9` and `src/routes/account.js:19` → big files would OOM Railway. Video must upload **direct to Cloudflare**, bypassing Express.

## ✅ UNBLOCKED 2026-06-03 — Cloudflare Stream live & verified
- Stream enabled/subscribed; API token (Stream:Edit + Account Analytics:Read, all-accounts) created.
- Railway env set: `CLOUDFLARE_ACCOUNT_ID=bc2ebc94444d987c7a78809a1d9449cb`, `CLOUDFLARE_STREAM_API_TOKEN` (secret in Railway).
- Verified end-to-end: `GET /api/videos/health` → `{configured:true, reachable:true, error:null}`.
- Migrations 026 (videos) + 027 (book_content_stats view) RUN in prod. Foundation complete.

## ✅ FEATURE BUILT (2026-06-03) — web complete + live, app in EAS build 1.0.15
- ✅ P1 mint/finalize/list/caption/delete endpoints (web `/account/book/videos*` + app `/api/videos/mine*`), caps enforced (`videoService`). Finalize via polling (no webhook needed).
- ✅ P2 viewer players: Video Moments section (`book/video-moments`), Celebrations (`book/celebration-detail`), Family member detail (`book.js` client render). All LIVE.
- ✅ P3 web editors: Video Moments page; reusable `_video-block.ejs` for Celebrations (multi) + Family (single). Hub card + section toggle (`moments` key, web+app).
- ✅ P4 app: `MomentsScreen` + `UploadProvider` background upload (XHR progress banner) + WebView player. Nav/Dashboard/ManageSections wired. v1.0.15 building on EAS (Android c9431a27, iOS e2831830).
- ⏳ DEFERRED to a follow-up app build (not blocking): app gallery-photo **reposition** parity (BirthDay/Celebration/Recipe/Keepsake gallery screens) + app **Celebration/Family video** screens (web has all 3 contexts; app currently has Video Moments).
  - **Background upload (Dan, 2026-06-03):** user starts the upload and can leave the screen / use the app
    while it uploads. Global persistent "Uploading video… NN%" banner (live progress via
    expo-file-system `uploadAsync` progress callback; iOS background URLSession so it survives backgrounding).
    On done → "✓ Video added" + appears in Video Moments; on fail → "Upload failed — tap to retry".
    Direct-to-Cloudflare (bytes never hit Railway). Needs app JWT endpoints (mirror of the web /account/book/videos*).
- P5: caps polish + swap "No storage limits" landing copy + FAQ.

## Build plan / file touchpoints
- **Migration `026_videos.sql`** (025 = birthday_photos RLS; 023 referrals still unapplied). **RLS ON from the start.**
  `videos`: id · book_id FK→books(cascade) · **context** text ('moments'|'celebration'|'family_member')
  · celebration_id FK→celebrations(cascade, null) · family_member_id FK→family_members(cascade, null)
  · stream_uid · status ('uploading'|'ready'|'error') · poster_url · duration_sec int · caption · sort_order · created_at.
  Indexes on book_id, celebration_id, family_member_id. Partial unique index (book_id, family_member_id) WHERE
  context='family_member' → enforces ONE video per family member at the DB level.
- **Caps (enforced in the mint endpoint, before creating the Cloudflare upload):**
  - Per-clip: `maxDurationSeconds: 120` (Cloudflare rejects longer at ingest).
  - Per-site: sum(duration_sec) of the book's videos must be < 60,000 (1,000 min) or reject with a friendly message.
  - Family: reject if the member already has a video (also DB-guarded by the partial unique index).
- **`src/services/cloudflareStreamService.js`** — mint direct-upload URL (`maxDurationSeconds:120`), get status, delete.
- **Backend endpoints** — app (`src/routes/api/books.js`): GET/POST/PUT/DELETE `/mine/moments*`; web (`src/routes/account.js`): `/book/moments*`. Plus a **Stream webhook** (in `src/routes/webhooks.js` or new route) to flip `status` → ready when transcoding finishes.
- **`src/services/bookService.js getFullBook`** — load `videos` defensively; add `momentsVideos` + `computeVisibleSections` key `moments`.
- **Viewer** — new `src/views/book/moments.ejs` (Cloudflare Stream player embed + poster), include in `layouts/book.ejs`, sidebar nav entry, section toggle.
- **Web editor** — `src/views/marketing/account-book-moments.ejs` + routes. Ships live, no app build.
- **Mobile** — `mobile/src/screens/MomentsScreen.js` (reuse picker pattern, `mediaTypes:['videos']`, upload direct to CF), App.js nav, Dashboard card, ManageSections toggle. Next EAS build.
- **Copy** — replace "No storage limits" on `src/views/marketing/landing.ejs:183` with the metered story.

## ✅ Already built (scaffold, committed, inert until Cloudflare configured)
- `026_videos.sql` (RLS on, polymorphic, family one-per-member DB guard) — NOT YET RUN.
- `cloudflareStreamService.js` — mint upload URL, status, delete, getDeliveredMinutes (analytics).
- `videoUsageMonitor.js` — weekly storage + delivery cost report/alert (registered in server.js, deployed `7ad7899`).

## Phased rollout
- P0 decisions ✅ (above) — confirm section placement.
- P1: migration + `cloudflareStreamService.js` + signed-upload endpoint (can scaffold BEFORE the token lands).
- P2: viewer playback (read-only).
- P3: web editor upload (ships live).
- P4: app upload (next EAS build).
- P5: copy + FAQ.

## Note
App/web parity rule (#8) applies — build both surfaces for the Moments section.
