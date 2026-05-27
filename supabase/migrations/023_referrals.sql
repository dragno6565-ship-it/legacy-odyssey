-- Referral program (B13).
-- Each family gets a shareable referral_code. When 3 referred families each
-- complete a paid checkout, the referrer earns a $49.99 Stripe customer-balance
-- credit (applied automatically toward their next renewal).
--
--   referral_code            — this family's shareable code (NULL until generated)
--   referred_by              — the referral_code that sent this family here
--   referral_qualified_count — # of referred families that have qualified (paid)
--   referral_credits_granted — # of $49.99 credits already issued to this referrer
--   referral_counted_at      — set on the REFERRED family once its payment has
--                              been counted toward the referrer (idempotency guard)

ALTER TABLE families ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS referral_qualified_count INT NOT NULL DEFAULT 0;
ALTER TABLE families ADD COLUMN IF NOT EXISTS referral_credits_granted INT NOT NULL DEFAULT 0;
ALTER TABLE families ADD COLUMN IF NOT EXISTS referral_counted_at TIMESTAMP DEFAULT NULL;

-- Codes must be unique (only enforced for rows that have one).
CREATE UNIQUE INDEX IF NOT EXISTS families_referral_code_uniq
  ON families (referral_code) WHERE referral_code IS NOT NULL;

-- Fast lookup of "who did this code refer".
CREATE INDEX IF NOT EXISTS families_referred_by_idx
  ON families (referred_by) WHERE referred_by IS NOT NULL;
