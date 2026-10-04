# Supabase

**Status:** active (since Feb 2026)
**Owner:** Legacy Odyssey database + storage + auth
**Last touched:** 2026-05-15; archive-review additions 2026-10-04 at the bottom

## What it is
Postgres-as-a-service. Source of truth for: families (customers), books and book content, domain orders, gift codes, subscriptions, photos (storage bucket), authentication (Supabase Auth).

## Where it's used
- Every read/write in Express server hits Supabase
- Mobile app authenticates via Supabase Auth
- Photos upload to `photos` bucket (Supabase Storage), backed up to Cloudflare R2

## Current configuration
- **Project ref:** `vesaydfwwdbbajydbzmq`
- **URL:** https://vesaydfwwdbbajydbzmq.supabase.co
- **Region:** us-west-2
- **Pooler hostname:** `aws-0-us-west-2.pooler.supabase.com:6543`
- **Plan:** Pro ($25/mo) + 100k MAU included
- **Account email:** dragno6565@gmail.com
- **Dashboard:** https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq
- **SQL editor:** https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/sql
- **Env vars:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

## Key tables
- `families` — customer records (PK `id`, columns include `auth_user_id`, `email`, `custom_domain`, `subdomain`, `archived_at`)
- `books` — one per family
- `domain_orders` — every domain purchase tracked: pending → registering → registered → dns_setup → active (or failed)
- `gift_codes` — purchased gifts
- + many content tables (birth_stories, months, photos, etc.)

## Migrations
- Located in `supabase/migrations/`
- Recently: `011` (mom_title/dad_title on birth_stories), `012` (partial unique indexes), `017` (gift_codes stripe_session_id unique index), `018` (books.visible_sections JSONB), `019` (books.welcome_fields JSONB), `020` (journey_story + journey_photos tables), `021` (birth_stories person1_label/person2_label)
- ✅ All migrations 011–021 are applied on Supabase.

## History
- 2026-02 — Project created
- 2026-04-22 — Migration 011 (editable birth-story headlines)
- 2026-04-26 — Migration 012 (partial unique indexes — allows cancel→resignup without violating constraints)
- 2026-04-28 — Verified 12 families rows via /admin/health
- 2026-05-15 — Migration 018 (books.visible_sections JSONB DEFAULT '{}'). Fixes the "Website Sections" toggle, which was a no-op platform-wide because the column the code read/wrote never existed. Applied via SQL Editor; all 19 books default to {} (no live site changes).
- 2026-05-15 — Migration 019 (books.welcome_fields JSONB DEFAULT '{}'). Makes the Welcome-page birth-stat tiles (Born/Time/Weight/Length/Born In/Hospital) optional: empty tiles auto-hide, plus per-tile toggles in the editor. Built for adoptive families lacking pregnancy/birth details. Applied via SQL Editor; all 19 books default to {}.
- 2026-05-15 — Migrations 020 + 021. 020: journey_story + journey_photos tables (RLS enabled) for the new optional "Your Journey to Us" section — a single story page for adoption/surrogacy/foster families, sibling to Birth Story. 021: birth_stories.person1_label/person2_label so Birth Story perspectives have selectable labels (Mom & Mom, Dad & Dad, Mom & Mama, single parent, etc.). Both applied via SQL Editor.
- 2026-05-17 — Migration 017 (gift_codes stripe_session_id partial unique index) FINALLY applied. It had been written during the May 14 Giulia Busetto incident but never run — which let a webhook/redirect race create duplicate gift rows again (Miss Katie purchase). Duplicate rows cleaned up first, then the index applied.

## Related
- `infrastructure/stripe.md` — webhooks update families table on subscription events
- `infrastructure/railway.md` — Express server connects to Supabase
- All `customers/*.md` files — each one corresponds to a families row

## Open issues / quirks
- ~~Cannot run DDL via API~~ superseded 2026-06-24: DDL runs via the Management API with the PAT (see Update 2026-10-04 below)
- **At 100k+ MAUs** would need Team plan ($599/mo) or Enterprise. We're far below this.
- **Storage bucket `photos`** is the primary blob store; eventual migration to R2-direct uploads may save cost at scale
- **Pooler vs direct:** code uses pooler (port 6543) for connection pooling; direct connection (5432) only for migrations


## Update 2026-10-04 (archive review)

### RLS rule for every new table and view (standing rule)
Tables created without RLS are fully readable, writable and deletable with the public anon key (the anon key is rendered into the set-password page HTML, so it is discoverable). It happened with celebration_photos and recipe_photos (May 2026), birthday_photos (exposed 2026-05-30 to 06-03) and content_translations (2026-06-30).
- Every CREATE TABLE migration includes `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` with no policy. The server uses the service-role key, which bypasses RLS. About 34 tables show the INFO "RLS enabled, no policy": expected.
- Every view: `REVOKE ALL ON <view> FROM anon;` (done for book_content_stats).
- Verify: check `pg_tables.rowsecurity`, or probe the table with the anon key vs the service-role key and compare row counts (anon must see 0).
- Never click "Run without RLS" in the SQL editor.

### Applying migrations
- Preferred: the Management API with the PAT (`SUPABASE_ACCESS_TOKEN` in .env): `POST https://api.supabase.com/v1/projects/vesaydfwwdbbajydbzmq/database/query` (or the Supabase MCP `apply_migration`). The "DDL only via SQL editor" note above is superseded.
- Apply the migration and verify the column with a live select BEFORE pushing code that reads it. 2026-05-27: code selecting referral columns from unapplied migration 023 logged out every customer who opened the dashboard (hotfix a1fb0eb). Use `ADD COLUMN IF NOT EXISTS`. Apply a written migration the same day (unapplied 017 caused duplicate gift rows).
- Never swallow DB-column errors with a 200 (hid the Website Sections bug for weeks).
- Fallback SQL editor technique (Chrome): `javascript_tool` is blocked on supabase.com for some reads; for large SQL use `monaco.editor.getModels()[0].setValue(sql)` after the editor mounts, then Run. Reusing a saved snippet overwrites it. In-page wait loops froze the renderer: reload, wait about 8 s from the shell, then setValue.
- Never let a sub-agent write production data without a human-readable review of the content (a delegated agent seeded fake demo rows into prod on 2026-05-26; reverted).
- Nightly backup table list must be patched when adding tables (see docs/infrastructure/backups.md).

### Migrations 022 to 033
| # | What | Applied |
|---|---|---|
| 022 | waitlist.nurture_sent JSONB + waitlist.unsubscribed_at (lead nurture drip) | 2026-05-26 |
| 023 | referral columns on families (B13 referral program) | NOT applied as of 2026-05-26/27; code now tolerates absence (`select('*')`, self-disabling referralService, REFERRALS_ENABLED flag). Verify in prod before relying on it. |
| 024 | birthday_photos ("Your Birth Day" gallery) | 2026-05-30 (created WITHOUT RLS) |
| 025 | enable RLS on birthday_photos | 2026-06-03 |
| 026 | videos (polymorphic: moments / celebration / family_member; RLS on; partial unique index = one video per family member) | about 2026-06-03 |
| 027 | book_content_stats view for /admin/analytics (anon revoked) | about 2026-06-03 |
| 028 | custom_galleries (RLS on from the start) | applied (feature live) |
| 029 | circles: contact list + circles + update notifications | applied (feature live) |
| 030 | book_contacts.source ('manual' / 'import') | 2026-06-24 via Management API |
| 031 | content_translations (DeepL cache) | applied (created without RLS) |
| 032 | enable RLS on content_translations | 2026-06-30 |
| 033 | page_views counter (server-side pageview log) | 2026-08-24 via Management API |

### Auth and plan settings (Dan's choices, May 2026)
- Plan upgraded to Pro by Dan himself 2026-05-13 ($25/mo), spend cap left ON. Org slug `jhstphhofapoxuhtqnrj` (billing at /org/<slug>/billing).
- Email OTP / magic-link expiry raised from 1 h to 24 h for everyone (Dan: keep 24 h; customers whose link lapses contact us). Pro still cannot exceed 24 h. Dan declined, for now, a custom long-lived welcome-email token.
- Leaked-password protection turned ON (needs Pro), 2026-05-13.
- Personal Access Token set to NEVER expire by Dan (2026-06-24); Dan's decision is to leave it (do not nag). To rotate in future: revoke at supabase.com/dashboard/account/tokens, generate new, update .env and ~/.claude.json, then call `https://api.supabase.com/v1/projects` with both (old must return 401, new 200).

### Open advisor warnings (not done as of 2026-06-30)
- `photos` storage bucket allows listing (change needs careful testing so photo display survives; the app hardcodes the public URL pattern in PhotoPicker.js). The private-bucket / signed-URL project was parked 2026-05-29.
- Magic-link/OTP expiry over 1 hour (deliberate, see above).
- One function without a fixed search_path.

### Data gotchas
- `families.billing_period` is stale for several rows; never count monthly vs annual customers from it. Stripe is the source of truth.
- Birth weight columns: `birth_weight_lbs`, `birth_weight_oz` are INTEGER, `birth_length_inches` is NUMERIC(4,1). bookService.updateBook converts 5.5 lb to 5 lb 8 oz (a 2026-06-08 crash lost one parent's edit).
- `bookService.getFullBook` takes the FAMILY id, not the book id (`getFullBook(req.family.id)`).
- `bookService.updateSectionCards` writes the placeholder '(untitled)' into NOT NULL title columns; defaults and seed text must never leak onto the public site (Month-by-Month seed rows were cleaned 2026-06-27; other sections in seedData.js still seed).
