-- "Your Birth Day" section — a captioned photo gallery for the day the child
-- arrived (who was there, the hospital, the doctor, etc.). One row per photo,
-- belonging directly to the book (no parent like celebrations).
--
-- Run in the Supabase SQL editor (DDL can't run via the API). Until this is
-- applied, the app + web are defensive (the section just shows no photos).

create table if not exists birthday_photos (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  photo_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_birthday_photos_book_id on birthday_photos(book_id);
