-- Allow multiple archived families per auth user / email, but keep only
-- ONE active family per auth user / email. The original strict UNIQUE
-- constraints made "customer cancels, then later redeems a gift / re-signs"
-- impossible (discovered Apr 26 2026 during gift redemption test).
--
-- Active = archived_at IS NULL.

ALTER TABLE families DROP CONSTRAINT IF EXISTS families_auth_user_id_key;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS families_auth_user_id_active_key
  ON families (auth_user_id)
  WHERE archived_at IS NULL AND auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS families_email_active_key
  ON families (email)
  WHERE archived_at IS NULL;
