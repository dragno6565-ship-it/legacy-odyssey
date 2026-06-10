# STATUS — Cross-Session Bulletin Board

> **Every session reads the top of this file at start, and adds ONE entry at end of work.**
> This is the ONLY shared file sessions write to. Do NOT add session logs to CLAUDE.md anymore.
>
> Entry format (newest on top, keep it to 3–5 lines):
>
> ```
> ## YYYY-MM-DD — <session role>
> - Did: what changed (1–2 lines, link files/commits)
> - Others should know: anything that affects another session's work (or "nothing")
> - Blocked on Dan: open asks (or "nothing")
> ```
>
> Housekeeping: when this file passes ~40 entries, the Dispatcher session moves the
> oldest half to `docs/archive/STATUS-archive.md`.

---

## 2026-06-10 — dispatcher
- Did: Reorganized the whole cross-session system. Created `sessions/` (one brief per session role), this STATUS.md board, slimmed CLAUDE.md (full old copy preserved verbatim at `docs/archive/CLAUDE-full-20260610.md`), ran PROJECT-MAP Phase 0 (15 loose root .md files → `docs/archive/`; created `F:\_archive` + `F:\_secrets`). E:\Claude\CLAUDE.md is now a pointer stub — new sessions should be started in `F:\legacy-odyssey`.
- Others should know: New protocol — at session start read CLAUDE.md → `sessions/<your-role>.md` → top of this file. At session end update your own sessions/ file + add one entry here. Stop appending "Recent Work" to CLAUDE.md.
- Blocked on Dan: paste the onboarding note (provided in the dispatcher session) into each running session; move `Legacy Odyssey Logins.docx` + `Legacy_Odyssey_Project_Accounts.pdf` out of the repo into `F:\_secrets\` or a password manager (PROJECT-MAP Phase 1).
