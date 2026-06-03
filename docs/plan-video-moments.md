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

## BLOCKED ON (Dan's action — billing/account, can't be done by Claude)
1. Enable **Cloudflare Stream** subscription (CF dashboard → Stream; ~$5/1,000 min stored + $1/1,000 min delivered).
2. Create an **API token** scoped to Account → Stream → Edit.
3. Get the **Cloudflare Account ID**.
4. Add to **Railway env**: `CLOUDFLARE_STREAM_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. (Token goes in Railway directly, never in chat.)

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

## Phased rollout
- P0 decisions ✅ (above) — confirm section placement.
- P1: migration + `cloudflareStreamService.js` + signed-upload endpoint (can scaffold BEFORE the token lands).
- P2: viewer playback (read-only).
- P3: web editor upload (ships live).
- P4: app upload (next EAS build).
- P5: copy + FAQ.

## Note
App/web parity rule (#8) applies — build both surfaces for the Moments section.
