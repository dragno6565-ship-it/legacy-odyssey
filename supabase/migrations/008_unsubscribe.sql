-- Email unsubscribe support: tracks when a customer opted out of marketing
-- (drip campaign) emails. Transactional emails (welcome, cancellation,
-- password reset) are still sent regardless — they're operationally required.
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_families_unsubscribed_at ON families (unsubscribed_at)
  WHERE unsubscribed_at IS NOT NULL;
