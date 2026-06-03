-- 026_videos.sql — Video uploads (Cloudflare Stream).
-- One polymorphic table backs three contexts:
--   'moments'        → the dedicated "Video Moments" section (many per book)
--   'celebration'    → attached to a celebration (many per celebration)
--   'family_member'  → attached to a family member (ONE per member, for now)
--
-- Video bytes live in Cloudflare Stream (stream_uid); we only store metadata.
-- RLS is ENABLED from the start (server uses the service-role key, which
-- bypasses RLS; the anon key gets deny-by-default — no repeat of birthday_photos).

create table if not exists videos (
  id               uuid primary key default gen_random_uuid(),
  book_id          uuid not null references books(id) on delete cascade,
  context          text not null check (context in ('moments','celebration','family_member')),
  celebration_id   uuid references celebrations(id) on delete cascade,
  family_member_id uuid references family_members(id) on delete cascade,
  stream_uid       text not null,
  status           text not null default 'uploading' check (status in ('uploading','ready','error')),
  poster_url       text,
  duration_sec     integer not null default 0,
  caption          text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_videos_book_id          on videos(book_id);
create index if not exists idx_videos_celebration_id   on videos(celebration_id);
create index if not exists idx_videos_family_member_id on videos(family_member_id);

-- Enforce ONE video per family member (for now) at the DB level.
create unique index if not exists uniq_video_per_family_member
  on videos(family_member_id)
  where context = 'family_member';

-- Lock it down (see header). Service-role bypasses RLS; no policies = anon denied.
alter table videos enable row level security;
