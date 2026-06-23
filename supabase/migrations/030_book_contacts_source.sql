-- 030_book_contacts_source.sql — track how a contact was added.
-- 'manual' = typed into the editor/app; 'import' = imported from the device's
-- address book (the app-only "Import from phone" feature, contactService.importContacts).
--
-- Informational only. The import works WITHOUT this column — contactService falls
-- back to inserting name/email/phone if this migration hasn't been applied yet —
-- so applying it is non-blocking. Backfills existing rows to 'manual'.
ALTER TABLE book_contacts ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
UPDATE book_contacts SET source = 'manual' WHERE source IS NULL;
