# Session: Email Marketing

> Lead capture, nurture sequences, customer email campaigns. Transactional email
> (welcome, onboarding drip Day 1/3/7/13) is code-owned — changes route to CODING.

**Last session:** 2026-07-11

## Scope
- Owns `marketing/email/email.md` — the detail file.

## Read first (beyond CLAUDE.md + STATUS.md)
- `marketing/email/email.md` — the detail file.
- `marketing/_BRIEF.md` + memory hard rules.
- Sending infra: Resend, verified domain legacyodyssey.com (see CLAUDE.md accounts).

## Current state
- See the detail file. B16 nurture work was noted as done in the 2026-05-26 memory —
  verify against the live drip when next active.

## Open items
- [x] **Contact-section announcement — ✅ SENT 2026-06-24** to 14 customers. Done.
- [x] **Privacy blog-post announcement — ✅ SENT 2026-07-11** to 18 customers (+ Dan = 19), 19/19
  OK. Reusable live-pull script `scripts/send-privacy-post-announcement.js`. Done.
- [ ] **Still open — a real repeatable send path (CODING).** Both campaigns worked but are
  hand-rolled (key pulled from Railway, per-recipient loop, mailto unsubscribe). For scale we want
  a proper Resend Audience/Broadcast or a server endpoint + a true one-click unsubscribe that
  writes `families.unsubscribed_at` (column exists, but nothing writes it yet — the mailto is
  manual). `send-privacy-post-announcement.js` (live recipient pull) is the current best pattern.
- [ ] **Feed back to chief-of-staff/dispatcher:** live paying-customer count is **18** (was 14 on
  2026-06-24). Roster/docs need updating.
- ⭐ **STANDING RULE (2026-06-24): Dan (dragno6565@gmail.com) gets a copy of EVERY campaign send.**
  Implemented via `STANDING_RECIPIENTS` in the send script; carry into all future campaign tooling
  + any Resend Audience. Detail in `marketing/email/email.md`.
- [ ] Known gap (still open): welcome emails to Reese/Lachlan/Jeff — blog is live so safe to
  send; this is a CODING/transactional task, surface to Dan.
- [ ] Detail file is stale (2026-05-03) — refresh from session history.

## Log
- **2026-07-11** — (email) **SENT the privacy blog-post announcement** ("Is it safe to put your
  baby online?") to all 18 active paying customers + Dan (19/19 OK). From content-organic's §B
  handoff; CTA → live `/blog/is-it-safe-to-put-your-baby-online`. Built a reusable send script that
  pulls the recipient list LIVE from `families` at send time (`send-privacy-post-announcement.js`,
  dry-run + `--force` guard). Compliance: no price (dropped the $29 canonical footer),
  website-not-book, positioning #16. Confirmed count grew 14→18 since last campaign.
- **2026-06-24** — (email) **SENT the contact-section feature announcement to all 14 active paying
  customers** (Dan: "Send it" → "Send to everyone"). Pulled the authoritative recipient list from
  the live `families` table (caught that "7" was stale — it's 14), excluded owner-dogfood/Apple-
  review/demo/test/cancelled rows, pulled `RESEND_API_KEY` from Railway, sent via Resend one email
  per recipient with List-Unsubscribe. Switched CTA to `/demo` because the live blog still said
  "Circles". Script: `scripts/send-contact-section-announcement.js` (guarded against re-send).
- **2026-06-23** — (email) Relabeled the staged announcement "Circles" → **"Your Contacts"**
  (sub-areas Contact List + Circles) to match the live product. Reframed body per rule #14
  (website, not "a book"); rule #13 OK (no real outside names). Renamed file →
  `your-contacts-announcement.md` (old deleted). CTA link verified still live. Audience confirmed
  customers-only (7). Flagged to content-organic: the linked blog post body still says "Circles".
  Still NOT sent — awaiting Dan's copy approval + go.
- **2026-06-16** — (email) Drafted + staged the Circles feature-announcement email to existing
  customers → `marketing/email/circles-announcement.md`. One CTA → live blog post
  (legacyodyssey.com/blog/circles-sharing); canonical description verbatim; word bans + no real
  names respected. Did NOT send — blocked on Dan's audience call (recommended customers-only, 7).
- **2026-06-10** — (dispatcher) File created during the cross-session reorg.

---

## Standing morning routine (trigger: Dan opens with just "good morning" or no specific task)
1. Re-read CLAUDE.md, this brief, and the top of STATUS.md - start with the latest dispatcher NIGHTLY CLOSE / agenda entry.
2. Cross-check the board against your planned first task: if another session's entry conflicts with it, blocks it, gates it on a Dan decision, or already did it, surface that instead of proceeding.
3. Reply with: (a) your first task and why it's first, (b) what you're blocked on, (c) anything on the board that affects you. Then WAIT for Dan's go before starting any work.

## Standing shutdown routine (trigger: Dan says "goodnight", "end of session", "wrap up", or similar)
1. Update this brief: bump "Last session" to today, add a log bullet for today's work, rewrite Open items so the next session knows exactly what's next (mark anything waiting on Dan as "Blocked on Dan").
2. Update your detail file(s) (marketing/<platform>/<platform>.md, TODO.md, ops/, docs/ - whatever you touched) with anything from today's conversation not yet written down.
3. Add ONE entry to the top of STATUS.md in the documented format (Did / Others should know / Blocked on Dan).
4. If you have uncommitted changes that are complete work, commit ONLY your own files with a clear message. Never commit other sessions' files. Never push a deploy unless Dan agreed to it this session.
5. End with a 3-line goodnight summary for Dan to carry to the Dispatcher: what shipped today / what's first tomorrow / what you need from Dan.
6. Do not start anything new after the trigger.
