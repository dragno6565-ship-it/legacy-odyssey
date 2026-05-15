-- Migration 021 — selectable perspective labels on birth_stories
--
-- The Birth Story shows two voices, previously hard-labeled "From Mom's
-- Point of View" / "From Dad's Point of View". These columns let a family
-- choose each label independently — Mom & Mom, Dad & Dad, Mom & Mama,
-- Dad & Dadda, grandparent, single parent, etc.
--
-- NULL = fall back to the historical default ("Mom" for person 1, "Dad"
-- for person 2), so every existing book is unchanged until edited.
-- A perspective with no narrative/photo auto-hides (handled in birth.ejs),
-- which is what makes a single voice possible.
--
-- The headline columns mom_title / dad_title already exist (migration 011).
--
-- Rollback:
--   ALTER TABLE birth_stories
--     DROP COLUMN IF EXISTS person1_label,
--     DROP COLUMN IF EXISTS person2_label;

ALTER TABLE birth_stories
  ADD COLUMN IF NOT EXISTS person1_label TEXT,
  ADD COLUMN IF NOT EXISTS person2_label TEXT;
