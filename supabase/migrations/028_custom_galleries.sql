-- 028_custom_galleries.sql — customer-created custom photo galleries.
-- Each book can have any number of galleries; each gallery has a custom title
-- and up to 21 captioned photos (cap enforced in the app/service, not the DB).
-- RLS on from the start (server uses the service-role key; anon denied).

create table if not exists custom_galleries (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references books(id) on delete cascade,
  title      text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_custom_galleries_book on custom_galleries(book_id);
alter table custom_galleries enable row level security;

create table if not exists custom_gallery_photos (
  id         uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references custom_galleries(id) on delete cascade,
  photo_path text not null,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_custom_gallery_photos_gallery on custom_gallery_photos(gallery_id);
alter table custom_gallery_photos enable row level security;
