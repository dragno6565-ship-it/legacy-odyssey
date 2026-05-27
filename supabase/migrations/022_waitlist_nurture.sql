-- Lead nurture (B16): track drip progress + unsubscribes on the waitlist.
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS nurture_sent JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP DEFAULT NULL;
