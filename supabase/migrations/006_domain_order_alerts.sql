-- Track when admin was last alerted about a problem domain order so the daily
-- cron doesn't spam. last_alerted_status records the order status at the time
-- of the alert, so we re-alert if the status changes (e.g., failed → stuck).

ALTER TABLE domain_orders
  ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_alerted_status TEXT;
