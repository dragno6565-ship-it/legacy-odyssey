-- Migration 016 — Keepsakes section (ADDITIVE ONLY, fully reversible)
--
-- Adds:
--   • `keepsakes` table — one row per saved child keepsake (drawing,
--     report card, award, handprint, etc.). Carries title, optional
--     category (artwork / schoolwork / award / memorabilia / custom),
--     optional age_text, optional date_made, optional attribution,
--     optional short description, optional long-form story, slug.
--   • `keepsake_photos` table — gallery photos per keepsake with
--     captions + focal-point positioning, FK CASCADE.
--   • RLS enabled on both tables to match project posture (service-role
--     bypasses; no policies = anon/authenticated get nothing).
--
-- Does NOT:
--   • Touch any existing table or row
--   • Seed any default data (visible section auto-hides until owner
--     adds at least one keepsake with content)
--
-- Rollback:
--   DROP TABLE IF EXISTS keepsake_photos;
--   DROP TABLE IF EXISTS keepsakes;

CREATE TABLE IF NOT EXISTS keepsakes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  title           TEXT,
  category        TEXT,            -- 'artwork' | 'schoolwork' | 'award' | 'memorabilia' | custom string
  age_text        TEXT,            -- free-form "Age 4" / "Kindergarten" / etc.
  date_made       DATE,
  attribution     TEXT,            -- "made by Sophia" / "with Daddy's help" / etc.
  description     TEXT,            -- short subtitle on hero
  story           TEXT,            -- long-form paragraph(s)
  slug            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS keepsakes_book_id_idx ON keepsakes(book_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS keepsakes_book_slug_unique ON keepsakes(book_id, slug);

CREATE TABLE IF NOT EXISTS keepsake_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keepsake_id     UUID NOT NULL REFERENCES keepsakes(id) ON DELETE CASCADE,
  photo_path      TEXT NOT NULL,
  caption         TEXT,
  focal_x         REAL,
  focal_y         REAL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS keepsake_photos_keepsake_id_idx ON keepsake_photos(keepsake_id, sort_order);

-- Enable RLS to match the rest of the public schema. Service role bypasses
-- RLS; no policies = anon/authenticated cannot read or write. All access
-- flows through the backend with the service-role key.
ALTER TABLE keepsakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE keepsake_photos ENABLE ROW LEVEL SECURITY;
