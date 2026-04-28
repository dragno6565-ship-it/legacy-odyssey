# Supabase

**Status:** active (since Feb 2026)
**Owner:** Legacy Odyssey database + storage + auth
**Last touched:** 2026-04-28

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
- Recently: `011` (mom_title/dad_title on birth_stories), `012` (partial unique indexes on families.email/auth_user_id WHERE archived_at IS NULL)

## History
- 2026-02 — Project created
- 2026-04-22 — Migration 011 (editable birth-story headlines)
- 2026-04-26 — Migration 012 (partial unique indexes — allows cancel→resignup without violating constraints)
- 2026-04-28 — Verified 12 families rows via /admin/health

## Related
- `infrastructure/stripe.md` — webhooks update families table on subscription events
- `infrastructure/railway.md` — Express server connects to Supabase
- All `customers/*.md` files — each one corresponds to a families row

## Open issues / quirks
- **Cannot run DDL via API** (ALTER TABLE etc.) — must use Supabase SQL Editor in dashboard
- **At 100k+ MAUs** would need Team plan ($599/mo) or Enterprise. We're far below this.
- **Storage bucket `photos`** is the primary blob store; eventual migration to R2-direct uploads may save cost at scale
- **Pooler vs direct:** code uses pooler (port 6543) for connection pooling; direct connection (5432) only for migrations
