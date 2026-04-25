-- Track when each new customer's site first responds successfully (DNS + TLS
-- provisioned, server reachable). The siteLiveDetect cron polls every 5 min
-- and sets these columns; once site_live_email_sent_at is non-null we stop
-- polling that order.

ALTER TABLE domain_orders
  ADD COLUMN IF NOT EXISTS site_live_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS site_live_email_sent_at TIMESTAMPTZ;

-- Partial index for the cron's hot query: "find active orders we haven't
-- yet detected as live or given up on yet"
CREATE INDEX IF NOT EXISTS idx_domain_orders_pending_live_check
  ON domain_orders (created_at)
  WHERE status = 'active' AND site_live_email_sent_at IS NULL;
