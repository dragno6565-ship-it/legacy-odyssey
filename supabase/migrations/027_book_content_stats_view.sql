-- 027_book_content_stats_view.sql
-- Per-book content analytics for the admin portal. One indexed query returns
-- photo / video / text / section counts for every site, so the admin Analytics
-- page scales regardless of customer count (no per-book full-content loads).
-- Requires the videos table (migration 026). Re-runnable (create or replace).

create or replace view book_content_stats as
select
  b.id        as book_id,
  b.family_id as family_id,

  -- ── Photos: across every photo-bearing table ──────────────────────────────
  (case when b.hero_image_path is not null and b.hero_image_path <> '' then 1 else 0 end)
  + (select count(*) from before_arrived_cards x where x.book_id = b.id and x.photo_path is not null and x.photo_path <> '')
  + (select count(*) from coming_home_cards    x where x.book_id = b.id and x.photo_path is not null and x.photo_path <> '')
  + (select count(*) from months               x where x.book_id = b.id and x.photo_path is not null and x.photo_path <> '')
  + (select count(*) from family_members        x where x.book_id = b.id and x.photo_path is not null and x.photo_path <> '')
  + (select coalesce(sum(
        (album_1_path is not null and album_1_path <> '')::int
      + (album_2_path is not null and album_2_path <> '')::int
      + (album_3_path is not null and album_3_path <> '')::int), 0)
     from family_members x where x.book_id = b.id)
  + (select count(*) from celebrations  x where x.book_id = b.id and x.photo_path is not null and x.photo_path <> '')
  + (select count(*) from celebration_photos cp join celebrations c on c.id = cp.celebration_id where c.book_id = b.id)
  + (select count(*) from recipes       x where x.book_id = b.id and x.photo_path is not null and x.photo_path <> '')
  + (select count(*) from recipe_photos  rp join recipes  r on r.id = rp.recipe_id  where r.book_id = b.id)
  + (select count(*) from keepsake_photos kp join keepsakes k on k.id = kp.keepsake_id where k.book_id = b.id)
  + (select count(*) from vault_items   x where x.book_id = b.id and x.photo_path is not null and x.photo_path <> '')
  + (select count(*) from birthday_photos x where x.book_id = b.id)
  + (select count(*) from journey_photos jp join journey_story js on js.id = jp.journey_id where js.book_id = b.id)
  + coalesce((select
        (case when mom_photo_1 is not null and mom_photo_1 <> '' then 1 else 0 end)
      + (case when mom_photo_2 is not null and mom_photo_2 <> '' then 1 else 0 end)
      + (case when dad_photo_1 is not null and dad_photo_1 <> '' then 1 else 0 end)
      + (case when dad_photo_2 is not null and dad_photo_2 <> '' then 1 else 0 end)
     from birth_stories x where x.book_id = b.id limit 1), 0)
  as photo_count,

  -- ── Videos ────────────────────────────────────────────────────────────────
  (select count(*)               from videos v where v.book_id = b.id) as video_count,
  (select coalesce(sum(duration_sec), 0) from videos v where v.book_id = b.id) as video_seconds,

  -- ── Text / content entries ────────────────────────────────────────────────
  (select count(*) from letters      x where x.book_id = b.id) as letters_count,
  (select count(*) from firsts       x where x.book_id = b.id) as firsts_count,
  (select count(*) from celebrations x where x.book_id = b.id) as celebrations_count,
  (select count(*) from recipes      x where x.book_id = b.id) as recipes_count,
  (select count(*) from keepsakes    x where x.book_id = b.id) as keepsakes_count,
  (select count(*) from family_members x where x.book_id = b.id) as family_count,

  -- ── Sections filled (out of 13) ───────────────────────────────────────────
  (
      (exists(select 1 from before_arrived_cards x where x.book_id = b.id))::int
    + (exists(select 1 from birth_stories x where x.book_id = b.id and (x.mom_narrative is not null or x.dad_narrative is not null or x.mom_photo_1 is not null or x.dad_photo_1 is not null)))::int
    + (exists(select 1 from birthday_photos x where x.book_id = b.id))::int
    + (exists(select 1 from journey_story x where x.book_id = b.id and (x.story is not null or x.intro is not null or x.letter_text is not null)))::int
    + (exists(select 1 from coming_home_cards x where x.book_id = b.id))::int
    + (exists(select 1 from months x where x.book_id = b.id and (x.photo_path is not null or x.note is not null or x.highlight is not null)))::int
    + (exists(select 1 from family_members x where x.book_id = b.id))::int
    + (exists(select 1 from firsts x where x.book_id = b.id))::int
    + (exists(select 1 from celebrations x where x.book_id = b.id))::int
    + (exists(select 1 from letters x where x.book_id = b.id))::int
    + (exists(select 1 from recipes x where x.book_id = b.id))::int
    + (exists(select 1 from keepsakes x where x.book_id = b.id))::int
    + (exists(select 1 from vault_items x where x.book_id = b.id))::int
  ) as sections_filled,

  -- ── Last content activity (best-effort across high-signal tables) ──────────
  greatest(
    b.updated_at,
    coalesce((select max(updated_at) from months      x where x.book_id = b.id), b.created_at),
    coalesce((select max(updated_at) from celebrations x where x.book_id = b.id), b.created_at),
    coalesce((select max(created_at) from birthday_photos x where x.book_id = b.id), b.created_at),
    coalesce((select max(created_at) from videos v where v.book_id = b.id), b.created_at)
  ) as last_activity

from books b;

-- Admin-only: this view aggregates customer data, so it must NOT be reachable
-- by the public anon/authenticated keys via PostgREST (a view runs as its owner
-- and would otherwise bypass RLS — same risk class as the birthday_photos miss).
-- The server reads it with the service-role key, which is unaffected by this.
revoke all on book_content_stats from anon, authenticated;
