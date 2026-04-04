-- Waitlist: email capture for visitors not ready to subscribe
CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(100) DEFAULT 'landing_page',
  created_at TIMESTAMP DEFAULT NOW()
);
