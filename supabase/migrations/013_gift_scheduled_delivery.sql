-- 013_gift_scheduled_delivery.sql
-- Add columns to gift_codes for scheduled email delivery + printable certificate.
--
-- Phase 2 of the gift-giver landing rework (May 2026).
-- The new gift-landing page lets the buyer choose to either email the recipient
-- right now, or schedule the gift email for a date they pick (e.g. baby shower
-- morning). Either way, the BUYER gets a printable PDF certificate link in
-- their confirmation email.
--
-- Run via Supabase SQL Editor (DDL can't run from the API).

-- delivery_method: 'email_now' (default) | 'email_scheduled' | 'certificate_only'
-- (kept 'certificate_only' as a future-compat value even though the new
-- landing's form only exposes the first two — the schema doesn't constrain it)
ALTER TABLE gift_codes ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'email_now';

-- deliver_at: when the recipient should receive the gift email.
--   NULL  → send immediately (legacy rows + email_now without explicit value)
--   set   → wait until this timestamp; the scheduled-delivery cron sends on/after this date.
ALTER TABLE gift_codes ADD COLUMN IF NOT EXISTS deliver_at timestamptz;

-- recipient_email_sent_at: when the recipient gift email was actually sent.
-- NULL = not yet sent. Used by the scheduled-delivery cron to avoid double-sends.
ALTER TABLE gift_codes ADD COLUMN IF NOT EXISTS recipient_email_sent_at timestamptz;

-- certificate_token: random URL-safe slug for the public printable certificate
-- page at /gift/certificate/:token. The token is the only auth — anyone with
-- the link can view+print, which is fine because the buyer is the only one
-- who gets it (in their confirmation email).
ALTER TABLE gift_codes ADD COLUMN IF NOT EXISTS certificate_token text UNIQUE;

-- Index to speed up the cron's nightly scan for due deliveries.
CREATE INDEX IF NOT EXISTS idx_gift_codes_deliver_at_pending
  ON gift_codes (deliver_at)
  WHERE recipient_email_sent_at IS NULL AND status = 'purchased' AND recipient_email IS NOT NULL;

-- Backfill: for any existing rows (status='purchased') where the recipient
-- email was already sent at purchase time, mark them done so the cron
-- doesn't re-send.
-- We can't know the exact timestamp; created_at is the closest proxy.
UPDATE gift_codes
SET recipient_email_sent_at = COALESCE(recipient_email_sent_at, created_at),
    delivery_method = COALESCE(delivery_method, 'email_now')
WHERE status = 'purchased' AND recipient_email IS NOT NULL;
