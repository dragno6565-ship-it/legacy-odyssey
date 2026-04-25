-- Track every cron's last run / success / failure for health checks.
-- One row per cron, identified by name. Updated by the cronTracker
-- wrapper around each scheduled function.

CREATE TABLE IF NOT EXISTS cron_runs (
  name                  TEXT PRIMARY KEY,
  last_started_at       TIMESTAMPTZ,
  last_finished_at      TIMESTAMPTZ,
  last_success_at       TIMESTAMPTZ,
  last_error            TEXT,
  consecutive_failures  INT DEFAULT 0
);
