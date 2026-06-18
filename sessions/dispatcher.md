# Session: Dispatcher / HQ

> Dan's organizing session. When Dan has an idea, question, or doesn't know where work
> belongs, it comes HERE first. This session routes it.

**Last session:** 2026-06-17 (nightly close; flagged the real-names rule conflict for Dan; D-009 revenue resolved = $288 net lifetime)

## Scope
- **Route ideas:** decide which session a task belongs to; write a paste-ready fenced
  brief Dan can drop into that session (hard rule #10: copy-paste content goes in its
  own fenced block).
- **Maintain the system:** CLAUDE.md (only this session edits it), `sessions/README.md`
  roster, STATUS.md hygiene (archive old entries past ~40), `ops/PROJECT-MAP.md` cleanup phases.
- **Cross-session awareness:** keep an eye on STATUS.md for conflicts/duplication
  between sessions and flag them to Dan.
- Does NOT write feature code, run ad campaigns, or do ops filings — it routes those.

## How to route an idea (checklist)
1. Which session owns it? (see roster in `sessions/README.md`). Product/feature/bug →
   coding. Money/legal/vendor → chief-of-staff. Platform-specific marketing → that
   platform's session. Spans several → split it into per-session briefs.
2. Check `STATUS.md` + the target session's file: is it already in flight?
3. Write the brief in a fenced block: context, the ask, files to read first, definition
   of done, reminder to follow the sessions/ protocol.
4. If it's a genuinely new area → create `sessions/<new-role>.md` from the template
   below + add to the roster BEFORE handing Dan the brief.

## Open items
- [ ] **Blocked on Dan — delete zombie Railway service.** Identified as project
      `romantic-creation` (id `25a7cbc7-64da-4012-bf24-5b20a0bc4839`, service
      `a759cd1b-34ae-4171-8e4b-9259e0e95dda`, live at `legacy-odyssey-production-a9d1...`
      v2.1.0 — confirmed alive 2026-06-10). Owning Railway account is the **`dragno65`
      GitHub identity** (login email almost certainly `dragno65@hotmail.com`), separate
      from production account `dragno6565@gmail.com`. Dan needs to sign in via that
      GitHub identity in Chrome and delete from the service-settings URL. All findings
      written into `docs/infrastructure/railway.md` under Open issues. Do NOT use the
      `.env` Railway token to delete (scope is currently ambiguous between sources).
- [ ] **Reconcile `.env` Railway-token scope.** CLAUDE.md (2026-06-08) says it points to
      LIVE prod (`27622203`); archived DEV.md/HANDOFF.md say it points to the OLD zombie
      (`25a7cbc7`). After Dan deletes the zombie, re-verify by hitting Railway's GraphQL
      `me` query with the token — whichever project it lists is the real scope. Update
      CLAUDE.md once and remove the ambiguity from `docs/infrastructure/railway.md`.
- [ ] **CLAUDE.md zombie note (lines 109-110) currently says "benign; don't chase it."**
      Update once Dan has deleted it — or update before then to "in flight to delete,
      see docs/infrastructure/railway.md" so a future session doesn't get confused.
- [ ] Dan to paste the reorg onboarding note into each currently-running session.
- [ ] PROJECT-MAP Phase 1 (Dan): move `Legacy Odyssey Logins.docx` +
      `Legacy_Odyssey_Project_Accounts.pdf` from the repo to `F:\_secrets\` / password manager.
- [ ] PROJECT-MAP Phase 2 (needs Dan's per-item approval): dedupe the stale full copies
      on E:\ (`legacy-odyssey-backup`, `legacy-odyssey.OLD`, etc.).
- [ ] Archive the two dead sessions in the session list ("V3 cutover day 5 checkin",
      "Legacy odyssey morning followups") — or fold v3 status into coding.md.
- [ ] Stale marketing files: pinterest.md / email.md / content-organic.md / seo.md
      haven't been updated since early May — have each session refresh its own file
      (handoff prompts exist in `marketing/HANDOFF-other-sessions.md`).

## Log
- **2026-06-17** — Nightly close. Wins: GA consent-timing fix LIVE; D-009 fully resolved
  (lifetime $287.95 net, 7 real external paying customers); Contact section built (D-012
  step 1, unpushed, awaiting deploy go); editor IA revamp approved (D-012/13/14); Amanda
  Foust order placed; LLC checklist created. Flagged a CONFLICT for Dan: facebook made
  "no real outside names in brand content" a hard rule (after Dan reacted strongly) while
  chief-of-staff relays Dan said that item is NOT a hard rule — needs reconciliation;
  sessions defaulting to the stricter ask-first rule meanwhile. Headline: ~$288 net
  lifetime vs ~$1,142/mo past Meta spend → keep paid off.
- **2026-06-15** — Full work day. Routed Dan's 8-item brainstorm into the TODO backlog;
  resolved D-010 (35% affiliate commission stands) + D-011 (ClickBank rejected); recorded
  real customer count (7: 6 annual + 1 monthly); issued work-day prompts to Pinterest /
  Influencer / content-organic / Facebook / Coding / Email / Affiliates; baked standing
  morning + shutdown routines into all 12 briefs. Survived a power outage with zero data
  loss (everything committed to git on F: as it happened). Nightly close: coding shipped
  3 prod deploys (branded-signup GA tracking fix, 3 feature blog posts live, Clarity live);
  **demo-site host mystery SOLVED = Spaceship Web Hosting, not Railway.** New Dan decisions
  queued: GA consent-mode timing fix, success.ejs $49.99→$29.
- **2026-06-10 (evening)** — Investigated zombie Railway service for Dan-side deletion.
  Confirmed alive via `/health` (v2.1.0). Identified project as `romantic-creation`
  (id `25a7cbc7-...`, service `a759cd1b-...`) owned by the `dragno65` GitHub Railway
  account (email likely `dragno65@hotmail.com`), separate from prod `dragno6565@gmail.com`.
  Sources: `Legacy_Odyssey_Project_Accounts.pdf`, `PROJECT_LINKS.md`,
  `BACKUP_PRE_MIGRATION.md`. Wrote findings into `docs/infrastructure/railway.md` —
  Open issues section now has concrete IDs, dashboard URLs, access path, and the
  do-NOT-use-the-`.env`-token caveat. No deletion performed (Dan owns that).
- **2026-06-10 (morning)** — Full reorg: slim CLAUDE.md (full copy →
  `docs/archive/CLAUDE-full-20260610.md`), created sessions/ + STATUS.md, ran
  PROJECT-MAP Phase 0, stubbed E:\Claude\CLAUDE.md.

---

## Template for a new session file

```markdown
# Session: <Role name>

> One-line mission.

**Last session:** YYYY-MM-DD

## Scope
- What this session does / does not do.

## Read first (beyond CLAUDE.md + STATUS.md)
- <detail files this role owns>

## Current state
- <2–6 bullets, kept current>

## Open items
- [ ] ...

## Log
- **YYYY-MM-DD** — ...
```

---

## Standing morning routine (trigger: "good morning" or no specific task)
1. Re-read this brief and the full top section of STATUS.md; check for overnight entries, conflicts, and board formatting damage.
2. Produce Dan's agenda: decisions in priority order, hands-on tasks, each session's first task, and any new cross-session conflicts.
3. Explicitly flag any session whose planned first task is gated on a decision Dan has not made yet.

## Standing shutdown routine (trigger: "goodnight" / "run the close" - normally AFTER Dan pastes the other sessions' goodnight summaries)
1. Reconcile the pasted summaries against STATUS.md; detect duplicates, conflicts, and decisions that gate tomorrow's first tasks.
2. Write ONE consolidated "NIGHTLY CLOSE - dispatcher" entry at the top of STATUS.md: day headline, morning gates, consolidated+prioritized "Blocked on Dan" list. Verify no existing entry headings get damaged by the edit.
3. Commit STATUS.md (own files only; do not push - pushing main triggers a Railway deploy).
4. Give Dan the morning agenda preview: decisions in priority order, hands-on tasks, each session's first task.
5. Housekeeping check: archive STATUS.md's oldest half past ~40 entries; update this brief's log.
