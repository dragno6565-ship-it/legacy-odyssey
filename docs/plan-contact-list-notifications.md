# Plan — Contact List + Update Notifications ("Share Circle")

> Drafted 2026-06-09. Lets a parent build a contact list of approved viewers and
> notify them when they add/change something in the book. Extends the May-2026
> brainstorm in CLAUDE.md (per-person magic links; native share sheet for SMS;
> no server SMS for MVP).

---

## 1. The concept

Each book has a **contact list** of approved viewers (name + email, optional
phone), which the parent organizes into one or more named **Circles** —
e.g. "Grandparents," "Close Family," "Friends," "Work." When the parent updates
the book, they tap **"Notify,"** pick **a Circle (or Everyone)**, optionally add a
one-line note, and those people get an email: *"[Parent] added something new to
[child]'s book"* with a one-tap link straight into the book.

This solves two things at once: (a) easy, targeted sharing after an update (tell
just the grandparents, or everyone), and (b) a curated audience list that doubles
as the access-control list for the book.

**A person can belong to multiple Circles** (Grandma can be in both "Grandparents"
and "Close Family") — so contacts are stored once and tagged into Circles
(many-to-many), never duplicated.

---

## 2. Key design decisions (recommendations — confirm before building)

| Decision | Recommendation | Why |
|---|---|---|
| **Channel** | **Email only for MVP** (via Resend, which is already wired). | Server SMS = TCPA + A2P 10DLC carrier registration (weeks of approval, per-message cost, real legal liability). Not worth it for v1. |
| **"Text" sharing** | Use the phone's **native share sheet** in the app (opens Messages/Mail pre-filled from the parent's own number/account). | Free, compliant, trusted (comes from the parent, not a business number). Manual per-person, but fine for SMS. |
| **How viewers get in** | **Per-contact magic link** (a tokenized URL that bypasses the book password for that one person). | Best UX (no "ask me for the password" friction), and enables **revoke** (delete contact → link dies) + **"who viewed"** analytics later. |
| **Password vs magic link** | Keep the shared password as a fallback; magic link is the primary path. | Don't put the actual password in emails (security). |
| **When to notify** | **Manual** ("Notify my Circle" button), never auto-on-every-save. | Auto-notify on every tiny edit = spam. Parent controls timing + audience. |
| **Multiple named Circles** | **Core feature.** One shared contact list per book; parent creates named Circles and tags people into them (a person can be in many). Notify a Circle or Everyone. | Parents think in groups ("just the grandparents"). Many-to-many avoids duplicate contacts. |

---

## 3. Data model (Supabase / Postgres)

Four tables: the master contact list, the named circles, the join between them,
and the notification audit log.

```sql
-- The parent's master contact list, scoped to a book (people stored ONCE).
CREATE TABLE book_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name          text NOT NULL,
  email         text,                          -- nullable (phone-only contacts)
  phone         text,                          -- stored for native-share convenience
  access_token  text UNIQUE DEFAULT encode(gen_random_bytes(18),'hex'), -- magic-link token (per PERSON, not per circle)
  notify_opt_in boolean DEFAULT true,
  unsubscribed_at timestamptz,                 -- set when they click unsubscribe
  last_viewed_at  timestamptz,                 -- set when their magic link is used
  created_at    timestamptz DEFAULT now(),
  archived_at   timestamptz
);
CREATE INDEX idx_book_contacts_book ON book_contacts(book_id) WHERE archived_at IS NULL;

-- Named groups within a book ("Grandparents", "Close Family", ...).
CREATE TABLE circles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name        text NOT NULL,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX idx_circles_book ON circles(book_id) WHERE archived_at IS NULL;

-- Many-to-many: a contact can be in several circles; a circle has many contacts.
CREATE TABLE circle_members (
  circle_id   uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES book_contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (circle_id, contact_id)
);

-- Audit/history of notification blasts (rate-limiting + a "last notified" UI).
CREATE TABLE book_update_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  circle_id     uuid REFERENCES circles(id) ON DELETE SET NULL, -- null = "Everyone"
  sent_at       timestamptz DEFAULT now(),
  recipient_count int,
  note          text,                          -- the parent's optional one-liner
  section       text                           -- optional "what changed" tag
);
```
RLS: enable on all four; only `supabaseAdmin` (service role) writes, same pattern
as the rest of the book tables.

**Notify target = a `circle_id` (members of that circle) OR "Everyone" (all
non-unsubscribed contacts on the book).** Magic-link tokens stay on the *contact*,
so a person has one stable link no matter how many circles they're in.

---

## 4. Backend (Express)

**Service** `src/services/contactService.js`:
- Contacts: `listContacts(bookId)`, `addContact(bookId,{name,email,phone})`,
  `updateContact`, `archiveContact` (soft delete → its magic link dies).
- Circles: `listCircles(bookId)` (each with member contacts), `createCircle(bookId,name)`,
  `renameCircle`, `archiveCircle`, `setContactCircles(contactId, circleIds[])`
  (sets a person's circle memberships in one call).
- `notify(bookId, { circleId, note })` — `circleId` null = Everyone; otherwise the
  circle's members. For each opted-in, non-unsubscribed contact, build the
  magic-link URL and send via `emailService`. Writes a `book_update_notifications`
  row. Rate-limit: max ~1 blast / 10 min / book.

**Magic-link access** (in `book.js` viewer):
- `GET /?circle=<access_token>` (or `/v/<token>`) → look up `book_contacts` by token,
  set the book-view session (same one the password sets), stamp `last_viewed_at`,
  redirect into the book. Revoke = archive the contact.

**Email** — reuse the existing `sendOnboardingEmail({to, subject, preheader,
heading, body, ctaText, ctaUrl, unsubscribeUrl})`. The `unsubscribeUrl` →
`/circle/unsubscribe/<token>` which sets `unsubscribed_at`. (CAN-SPAM: every blast
needs the unsubscribe link — already supported by the template.)

**API for the app** `src/routes/api/contacts.js` (JWT, `/mine`): list / add / update /
archive contacts + `POST /mine/notify`.

---

## 5. Web + App (PARITY — hard rule #8)

Build identically on both surfaces:
- **Web editor:** new `/account/book/circles` page — (a) contact table
  (add/edit/remove, with checkboxes to assign each person to Circles); (b) manage
  Circles (create / rename / delete); (c) a "Notify" panel: pick a Circle (or
  Everyone) + optional note → Send. Add a card on the My Book hub.
- **App:** new `CirclesScreen` — same contact + circle management; a "Notify" sheet
  (choose Circle or Everyone); plus the **native share sheet** for texting a single
  contact (React Native `Share`).
- Both call the same endpoints / DB. Same labels and copy.

---

## 6. Compliance / privacy (don't skip)

- Storing third-party PII (contacts' emails/phones) → update the **privacy policy**
  + processor scope; this is the parent's data used only for their book.
- **Unsubscribe** link on every notification (CAN-SPAM) + never email
  `unsubscribed_at` contacts.
- **Rate-limit** blasts; show "last notified X ago".
- Magic-link tokens are unguessable (18 random bytes) and **revocable**.
- No real children's names in any placeholder/example (hard rule #3).

---

## 7. MVP phasing (build order)

- **Phase 1 — Manage contacts + Circles (no notifications yet).** Migration (all 4
  tables) → contactService CRUD (contacts + circles + membership) → web
  `/account/book/circles` + app `CirclesScreen`. Ship.
- **Phase 2 — Notify + magic link.** `notify(circleId|Everyone)` + email +
  `?circle=token` access + unsubscribe + the audit log. This is the payoff.
- **Phase 3 — Polish.** "What changed" auto-detection, view analytics ("3 people
  opened it"), digest mode, native-share SMS, import from phone contacts.

Phase 1 is a clean ~2 hour chunk on its own and is independently useful.

---

## 8. Decisions to lock before you build (quick answers from Dan)

1. **Email-only for MVP?** (recommend yes; native share-sheet SMS in Phase 3) — Y/N
2. **Magic-link access** (vs. "ask me for the password")? — recommend magic link
3. **Manual "Notify" button** (vs auto-on-change)? — recommend manual
4. **Where in the UI** — a "Your Circle" card on the My Book hub (web) + a Dashboard
   card (app)? — confirm
5. **Name for the feature** — "Circle", "Your People", "Viewers", "Family & Friends"? —
   pick one (used in all copy)
