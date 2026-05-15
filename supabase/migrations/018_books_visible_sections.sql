-- Migration 018 — Add books.visible_sections so the "Website Sections"
-- toggle actually persists.
--
-- Background: src/services/bookService.js (computeVisibleSections) reads
-- book.visible_sections as a per-section manual override, and
-- src/routes/api/books.js (PUT /api/books/mine/sections) writes it. But the
-- column was never created by any migration, so every write failed silently
-- (the PUT handler swallowed the 42703 "column does not exist" error). The
-- mobile "Website Sections" screen and the web account editor toggles were
-- therefore cosmetic — flipping a switch did nothing.
--
-- Shape: a JSON object keyed by section, e.g. {"before": false, "birth": false}.
-- A key present + false  -> section force-hidden even if it has content.
-- A key present + true   -> section force-shown even if empty.
-- A key absent           -> fall back to content auto-detection.
-- Default '{}' = no overrides, behaves exactly as before for every existing
-- customer (their sites are unchanged until they deliberately toggle).
--
-- Rollback:
--   ALTER TABLE books DROP COLUMN IF EXISTS visible_sections;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS visible_sections JSONB NOT NULL DEFAULT '{}'::jsonb;
