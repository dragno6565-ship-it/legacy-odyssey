-- Migration 020 — "Your Journey to Us" section
--
-- An optional, single-story page for non-traditional families (adoption,
-- surrogacy, foster, donor-conceived, kinship, etc.). It sits as a sibling
-- to the Birth Story — a family that didn't have a traditional pregnancy
-- can hide Birth Story and turn this on instead.
--
-- One row per book (like birth_stories). The page title is customizable so
-- a family can name it "The Adoption Story", "Our Surrogacy Story", etc.
-- Visibility is governed by books.visible_sections key 'journey' (migration
-- 018): empty -> auto-hidden, present -> shown, togglable in the editor.
--
-- Rollback:
--   DROP TABLE IF EXISTS journey_photos;
--   DROP TABLE IF EXISTS journey_story;

CREATE TABLE IF NOT EXISTS journey_story (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id      UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title        TEXT,   -- customizable section/page title (default "Your Journey to Us")
  intro        TEXT,   -- the short italic intro line
  story_title  TEXT,   -- heading above the narrative (e.g. "How you came home")
  story        TEXT,   -- the narrative itself
  milestones   JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{ "label": "...", "date": "..." }]
  letter_text  TEXT,   -- optional closing "letter to you"
  letter_sign  TEXT,   -- signature on the letter
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS journey_story_book_id_unique ON journey_story (book_id);

CREATE TABLE IF NOT EXISTS journey_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id  UUID NOT NULL REFERENCES journey_story(id) ON DELETE CASCADE,
  photo_path  TEXT NOT NULL,
  caption     TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS journey_photos_journey_id_idx ON journey_photos (journey_id, sort_order);

-- Server uses the service-role key (bypasses RLS). Enabling RLS with no
-- policies keeps the anon key from reading these tables — same posture as
-- celebration_photos / recipe_photos / keepsakes (migrations 014–016).
ALTER TABLE journey_story  ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_photos ENABLE ROW LEVEL SECURITY;
