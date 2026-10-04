-- Data-retention purge job support (C-005, src/jobs/dataRetentionPurge.js).
-- NOT YET APPLIED: run in the Supabase SQL editor before enabling
-- RETENTION_PURGE_ENABLED=true. The purge job runs in dry-run mode without it.
--
-- 1. cancelled_at / data_retain_until are already used by the code
--    (familyService.updateSubscriptionStatus sets them on cancellation) and exist
--    in production, but were added by hand and never recorded in a migration.
--    IF NOT EXISTS makes this a no-op in production and correct on a fresh DB.
alter table public.families add column if not exists cancelled_at timestamptz;
alter table public.families add column if not exists data_retain_until timestamptz;
create index if not exists idx_families_data_retain_until on public.families (data_retain_until)
  where data_retain_until is not null;

-- 2. Audit log of every purge (dry runs are NOT written here, only real deletes).
--    Deliberately stores no email/name/domain: once a family is purged, this
--    row only proves THAT family_id was deleted, when, and what was removed.
create table if not exists public.retention_purge_log (
  id                 bigint generated always as identity primary key,
  purged_at          timestamptz not null default now(),
  family_id          uuid not null,
  cancelled_at       timestamptz,
  data_retain_until  timestamptz,
  summary            jsonb not null default '{}'::jsonb   -- counts: storage objects, videos, r2 objects, rows
);
alter table public.retention_purge_log enable row level security;
