-- ============================================================
-- Legacy Odyssey — Gift Codes Table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS gift_codes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT NOT NULL UNIQUE,             -- GIFT-XXXX-XXXX-XXXX
  buyer_email         TEXT NOT NULL,
  buyer_name          TEXT,
  recipient_name      TEXT,
  recipient_email     TEXT,
  recipient_message   TEXT,
  stripe_session_id   TEXT,
  months_prepaid      INTEGER NOT NULL DEFAULT 12,
  status              TEXT NOT NULL DEFAULT 'purchased'
                        CHECK (status IN ('purchased', 'redeemed', 'expired')),
  expires_at          TIMESTAMPTZ NOT NULL,
  family_id           UUID REFERENCES families(id) ON DELETE SET NULL,
  redeemed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gift_codes_code_idx        ON gift_codes (code);
CREATE INDEX IF NOT EXISTS gift_codes_buyer_email_idx ON gift_codes (buyer_email);
CREATE INDEX IF NOT EXISTS gift_codes_family_id_idx   ON gift_codes (family_id);
CREATE INDEX IF NOT EXISTS gift_codes_status_idx      ON gift_codes (status);
