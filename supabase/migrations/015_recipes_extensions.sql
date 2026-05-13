-- Migration 015 — Recipes redesign (ADDITIVE ONLY, fully reversible)
--
-- Adds:
--   • Long-form fields on `recipes` (story, prep_time, cook_time, servings,
--     difficulty, notes, slug)
--   • Structured `directions` JSONB list (step-by-step numbered instructions)
--   • Structured ingredient amounts: `ingredients` stays JSONB but now stores
--     objects like {amount, item} instead of plain strings. Both shapes are
--     handled by the read-side normalizer so existing rows remain valid.
--   • New `recipe_photos` table — gallery photos with per-photo captions and
--     focal-point positioning. Mirrors the celebration_photos pattern from
--     migration 014.
--   • Backfill that copies each recipe's existing `photo_path` into
--     `recipe_photos` (idempotent NOT EXISTS guard).
--   • Slug generation with disambiguation via ROW_NUMBER.
--
-- Does NOT:
--   • Drop or rename any existing column
--   • Delete any existing row
--   • Modify the existing photo_path column (kept for backward compatibility
--     with mobile v1.0.9, which still reads/writes it)
--
-- Rollback:
--   ALTER TABLE recipes DROP COLUMN IF EXISTS story;
--   ALTER TABLE recipes DROP COLUMN IF EXISTS prep_time;
--   ALTER TABLE recipes DROP COLUMN IF EXISTS cook_time;
--   ALTER TABLE recipes DROP COLUMN IF EXISTS servings;
--   ALTER TABLE recipes DROP COLUMN IF EXISTS difficulty;
--   ALTER TABLE recipes DROP COLUMN IF EXISTS notes;
--   ALTER TABLE recipes DROP COLUMN IF EXISTS directions;
--   ALTER TABLE recipes DROP COLUMN IF EXISTS slug;
--   DROP TABLE IF EXISTS recipe_photos;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS story        TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS prep_time    TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time    TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS servings     TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty   TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS notes        TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS directions   JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS slug         TEXT;

CREATE TABLE IF NOT EXISTS recipe_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  photo_path      TEXT NOT NULL,
  caption         TEXT,
  focal_x         REAL,
  focal_y         REAL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS recipe_photos_recipe_id_idx ON recipe_photos(recipe_id);

-- Enable RLS to match the rest of the public schema. Service role bypasses
-- RLS; no policies = anon/authenticated cannot read or write. All access
-- flows through the backend with the service-role key.
-- Added May 13 2026 after Supabase Advisor flagged this.
ALTER TABLE recipe_photos ENABLE ROW LEVEL SECURITY;

-- Backfill: every existing recipe with a photo_path gets one row in
-- recipe_photos so the gallery shows the legacy photo even before the
-- owner re-uploads anything. Idempotent — the NOT EXISTS clause means
-- re-running this migration won't duplicate rows.
INSERT INTO recipe_photos (recipe_id, photo_path, sort_order)
SELECT r.id, r.photo_path, 0
FROM recipes r
WHERE r.photo_path IS NOT NULL
  AND r.photo_path <> ''
  AND NOT EXISTS (
    SELECT 1 FROM recipe_photos rp WHERE rp.recipe_id = r.id
  );

-- Slug backfill with disambiguation. If two recipes in the same book end up
-- with the same slug (e.g. two "untitled"), append -2, -3, etc.
WITH slugged AS (
  SELECT
    id,
    book_id,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(NULLIF(TRIM(title), ''), 'recipe'), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) AS base,
    ROW_NUMBER() OVER (
      PARTITION BY book_id, LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(NULLIF(TRIM(title), ''), 'recipe'), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
      ORDER BY sort_order, created_at, id
    ) AS rn
  FROM recipes
  WHERE slug IS NULL OR slug = ''
)
UPDATE recipes r
SET slug = CASE WHEN s.rn = 1 THEN s.base ELSE s.base || '-' || s.rn END
FROM slugged s
WHERE r.id = s.id;

CREATE UNIQUE INDEX IF NOT EXISTS recipes_book_slug_unique ON recipes(book_id, slug);
