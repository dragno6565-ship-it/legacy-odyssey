-- 029_circles.sql — Contact list + Circles + update notifications.
-- A parent builds a master contact list per book, organizes people into named
-- Circles (many-to-many), and can notify a Circle (or Everyone) when the book
-- changes. Magic-link access token lives on the CONTACT (one stable link per
-- person regardless of circle membership).
--
-- All tables are service-role-only (the Express server uses supabaseAdmin);
-- RLS is enabled with no policies so anon/authenticated cannot read/write.

-- Master contact list (people stored once per book).
CREATE TABLE IF NOT EXISTS book_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name            text NOT NULL,
  email           text,
  phone           text,
  access_token    text UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  notify_opt_in   boolean DEFAULT true,
  unsubscribed_at timestamptz,
  last_viewed_at  timestamptz,
  created_at      timestamptz DEFAULT now(),
  archived_at     timestamptz
);
CREATE INDEX IF NOT EXISTS idx_book_contacts_book ON book_contacts(book_id) WHERE archived_at IS NULL;

-- Named groups within a book ("Grandparents", "Close Family", ...).
CREATE TABLE IF NOT EXISTS circles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name        text NOT NULL,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_circles_book ON circles(book_id) WHERE archived_at IS NULL;

-- Many-to-many: a contact can be in several circles.
CREATE TABLE IF NOT EXISTS circle_members (
  circle_id   uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES book_contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (circle_id, contact_id)
);
CREATE INDEX IF NOT EXISTS idx_circle_members_contact ON circle_members(contact_id);

-- Audit log of notification blasts (Phase 2 uses this; harmless empty for now).
CREATE TABLE IF NOT EXISTS book_update_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  circle_id       uuid REFERENCES circles(id) ON DELETE SET NULL, -- null = "Everyone"
  sent_at         timestamptz DEFAULT now(),
  recipient_count int,
  note            text,
  section         text
);
CREATE INDEX IF NOT EXISTS idx_book_update_notifications_book ON book_update_notifications(book_id);

-- Service-role-only: enable RLS, add no policies (anon/authenticated get nothing).
ALTER TABLE book_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_update_notifications ENABLE ROW LEVEL SECURITY;
