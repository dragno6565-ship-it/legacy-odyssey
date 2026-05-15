-- Migration 019 — Add books.welcome_fields so the Welcome (cover) page
-- birth-detail stats can be made optional per-customer.
--
-- Background: the Welcome page renders six "vital stat" tiles (Born, Time,
-- Weight, Length, Born In, Hospital). They previously rendered
-- unconditionally — a customer with no birth time still got an empty "Time"
-- tile. Adoptive families in particular don't have most of these details.
--
-- New behaviour (see src/views/book/welcome.ejs):
--   A tile shows IFF it has a value AND welcome_fields[key] !== false.
--   - Empty field            -> hidden automatically (no value to show).
--   - Filled field, no key   -> shown (default).
--   - Filled field, key=false-> hidden (customer toggled it off in the editor).
--
-- Shape: JSON object keyed by tile, e.g. {"hospital": false, "time": false}.
-- Keys: born, time, weight, length, birthplace, hospital.
-- Default '{}' = no overrides; every existing customer's page is unchanged
-- except that genuinely-empty tiles now disappear (the intended fix).
--
-- Rollback:
--   ALTER TABLE books DROP COLUMN IF EXISTS welcome_fields;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS welcome_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
