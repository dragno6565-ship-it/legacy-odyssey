-- Soft-cancel pattern: archived_at is set when admin clicks "Cancel & Archive."
-- The family's subscription_status is also set to 'canceled' which the existing
-- book/suspended page already handles. Photos, content, and Supabase Auth user
-- all remain intact so the family can resubscribe later without data loss.

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_families_archived_at ON families (archived_at)
  WHERE archived_at IS NOT NULL;
