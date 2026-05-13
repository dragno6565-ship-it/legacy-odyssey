-- 014_celebrations_extensions.sql
-- Phase 2 of the Celebrations feature redesign (May 2026).
--
-- WHAT THIS MIGRATION DOES:
--   Adds support for:
--     • Unlimited celebrations per year (no UI 3-cap)
--     • Per-celebration detail page with location / attendees / gifts /
--       celebration_date / slug
--     • Multi-photo gallery per celebration with per-photo captions
--
-- PURELY ADDITIVE — no existing columns are renamed or dropped. The
-- existing `celebrations.body` and `celebrations.photo_path` columns are
-- left untouched; new code reads them as fallbacks alongside the new
-- columns and table. Existing rows (52 in production as of May 11, 2026)
-- remain exactly as they were, plus a backfill that copies their
-- `photo_path` into the new `celebration_photos` table as a single
-- gallery photo.
--
-- BACKUPS (run before this migration):
--   • F:\backups\supabase\2026-05-11\tables.json.gz captured every row
--     of every table, including celebrations
--   • F:\backups\photos\ mirrors all 99 photos in Supabase Storage
--
-- ROLLBACK (if absolutely necessary):
--   BEGIN;
--   DROP TABLE IF EXISTS celebration_photos;
--   DROP INDEX IF EXISTS idx_celebrations_book_year_slug;
--   ALTER TABLE celebrations
--     DROP COLUMN IF EXISTS location,
--     DROP COLUMN IF EXISTS attendees,
--     DROP COLUMN IF EXISTS gifts,
--     DROP COLUMN IF EXISTS celebration_date,
--     DROP COLUMN IF EXISTS slug;
--   COMMIT;
--   (No data loss — body and photo_path were never touched.)

BEGIN;

-- ─── 1. New optional fields on celebrations ──────────────────────────────
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS attendees text;
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS gifts text;
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS celebration_date date;
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS slug text;

-- ─── 2. celebration_photos table for multi-photo support ─────────────────
CREATE TABLE IF NOT EXISTS celebration_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celebration_id  uuid NOT NULL REFERENCES celebrations(id) ON DELETE CASCADE,
  photo_path      text NOT NULL,
  caption         text,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_celebration_photos_celebration ON celebration_photos (celebration_id, sort_order);

-- Enable RLS to match the project's existing posture (service role bypasses
-- RLS; no policies = anon/authenticated get nothing, which is what we want
-- since all data access goes through the backend with the service-role key).
-- Added May 13 2026 after Supabase Advisor flagged this.
ALTER TABLE celebration_photos ENABLE ROW LEVEL SECURITY;

-- ─── 3. Backfill: existing photo_path becomes first row in celebration_photos
-- The NOT EXISTS guard makes this idempotent — if the migration is rerun,
-- it won't duplicate the photo.
INSERT INTO celebration_photos (celebration_id, photo_path, sort_order)
SELECT c.id, c.photo_path, 0
FROM celebrations c
WHERE c.photo_path IS NOT NULL
  AND c.photo_path <> ''
  AND NOT EXISTS (
    SELECT 1 FROM celebration_photos cp WHERE cp.celebration_id = c.id
  );

-- ─── 4. Generate slugs for existing celebrations ─────────────────────────
-- Slug = lowercased, alphanumerics-and-hyphens-only, trimmed.
-- Empty titles → fallback to 'celebration-<sort_order>' so each row gets one.
UPDATE celebrations
SET slug = regexp_replace(
  regexp_replace(
    lower(COALESCE(NULLIF(TRIM(title), ''), 'celebration-' || sort_order::text)),
    '[^a-z0-9]+', '-', 'g'
  ),
  '^-+|-+$', '', 'g'
)
WHERE slug IS NULL OR slug = '';

-- ─── 5. Disambiguate slug collisions within (book_id, year_label) ─────────
-- If two celebrations in the same year happen to share a slug, append
-- the sort_order to all duplicates except the first. (Most titles will be
-- unique; this is a safety net.)
WITH duplicates AS (
  SELECT id, slug, sort_order,
         ROW_NUMBER() OVER (
           PARTITION BY book_id, year_label, slug
           ORDER BY sort_order, created_at
         ) AS rn
  FROM celebrations
)
UPDATE celebrations c
SET slug = c.slug || '-' || c.sort_order
FROM duplicates d
WHERE c.id = d.id AND d.rn > 1;

-- ─── 6. Index for fast detail-page slug lookups ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_celebrations_book_year_slug
  ON celebrations (book_id, year_label, slug);

COMMIT;

-- ─── Post-migration verification queries ─────────────────────────────────
-- Run these manually after the migration to confirm everything looks right:
--
--   -- Should match the row count from before (52 as of May 11 2026):
--   SELECT COUNT(*) FROM celebrations;
--
--   -- Should equal the number of existing rows with a non-empty photo_path
--   -- (4 as of May 11 2026):
--   SELECT COUNT(*) FROM celebration_photos;
--
--   -- Every celebration should now have a slug:
--   SELECT COUNT(*) FROM celebrations WHERE slug IS NULL OR slug = '';
--   -- Expected: 0
--
--   -- No collisions within (book_id, year_label):
--   SELECT book_id, year_label, slug, COUNT(*) FROM celebrations
--   GROUP BY 1,2,3 HAVING COUNT(*) > 1;
--   -- Expected: empty
