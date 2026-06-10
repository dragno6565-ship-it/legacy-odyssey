# Session: Dispatcher / HQ

> Dan's organizing session. When Dan has an idea, question, or doesn't know where work
> belongs, it comes HERE first. This session routes it.

**Last session:** 2026-06-10 (created the whole sessions/ system)

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
- **2026-06-10** — Full reorg: slim CLAUDE.md (full copy → `docs/archive/CLAUDE-full-20260610.md`),
  created sessions/ + STATUS.md, ran PROJECT-MAP Phase 0, stubbed E:\Claude\CLAUDE.md.

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
