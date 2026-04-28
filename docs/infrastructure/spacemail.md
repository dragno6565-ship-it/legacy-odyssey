# Spacemail

**Status:** partially configured (mailboxes exist, forwarding incomplete)
**Owner:** Legacy Odyssey inbound email at `@legacyodyssey.com`
**Last touched:** earlier April 2026

## What it is
Spaceship's email product (Spacemail) — provides MX records and mailboxes for the `legacyodyssey.com` domain. Inbound email service only; outbound transactional goes through Resend.

## Where it's used
- MX records on `legacyodyssey.com` zone (`mx1/2.spacemail.com`)
- DKIM key `spacemail._domainkey` (TXT record)
- Mailboxes: `dan@`, `hello@`, `help@`, `info@` (plus `review@` for Apple)

## Current configuration
- **Mailboxes:** `dan@`, `hello@`, `help@`, `info@`, `review@legacyodyssey.com`
- **Login:** Spaceship dashboard → Email → Spacemail Login (separate from main Spaceship login)
- **MX records:** `mx1.spacemail.com`, `mx2.spacemail.com`
- **DKIM:** `spacemail._domainkey` TXT record on legacyodyssey.com zone (now managed by Cloudflare since Apr 26)

## History
- 2026-02 — Set up alongside domain registration
- 2026-04-26 — Cloudflare zone migration: DKIM + MX records re-added in Cloudflare (auto-import missed `_domainkey`)

## Related
- `infrastructure/resend.md` — outbound emails; uses `replyTo: legacyodysseyapp@gmail.com` because Spacemail forwarding to gmail isn't fully working
- `infrastructure/cloudflare.md` — DNS authority for legacyodyssey.com (where MX/DKIM live)
- `domains/legacyodyssey.com.md`

## Open issues / quirks
- **Per-mailbox forwarding to gmail is NOT set up** at the Spacemail level. The code's `replyTo: legacyodysseyapp@gmail.com` is the working safety net so customer replies still reach a usable inbox.
- Eventual cleanup: configure each mailbox's forwarding rule properly, then drop the `replyTo` workaround.
