-- Migration 017 — Defense-in-depth: enforce unique stripe_session_id on gift_codes
--
-- Companion to the May 14 2026 idempotency fix in giftService.createGiftCode.
-- Even if the code-level check ever races or misses, the DB will hard-reject
-- a second insert for the same Stripe Checkout session, surfacing as
-- error.code === '23505' which the service catches and treats as "already
-- exists, fetch and return."
--
-- Rollback:
--   DROP INDEX IF EXISTS gift_codes_stripe_session_id_unique;

-- Use a partial unique index so legacy rows with NULL stripe_session_id
-- (manually created gifts before the gift flow shipped) don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS gift_codes_stripe_session_id_unique
  ON gift_codes (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
