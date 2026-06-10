# Project Map & Organization Plan

> Inventory of everything Legacy-Odyssey-related across E: and F:, plus the
> plan to get to ONE clean source of truth. Review 2026-06-08.
>
> ⚠️ This plan is NON-DESTRUCTIVE until Dan approves. Nothing here has been
> deleted or moved. Cleanup runs in phases on go-ahead.

---

## The one rule

**`F:\legacy-odyssey` is the ONLY source of truth.** It is the git working tree
whose `origin` auto-deploys to Railway. Everything else is a copy, a backup, a
prototype, or scratch. Production only ever changes through this directory.

---

## Inventory — what exists where

### ✅ CANONICAL (the live project)
| Path | What | Keep? |
|---|---|---|
| `F:\legacy-odyssey\` | Git tree → GitHub → Railway. The real thing. | **KEEP — single source of truth** |
| `F:\legacy-odyssey\docs\` | Per-entity knowledge base | KEEP |
| `F:\legacy-odyssey\ops\` | Business source of truth (this dir) | KEEP |
| `F:\backups\` | `backup.py` + DB dumps (photos/recipes/keepsakes/supabase) + `last-run.log` + `mobile-v1.0.10` snapshot | **KEEP — this is the real backup system. Verify it runs + lands OFFSITE.** |

### �amber DUPLICATE FULL COPIES (stale — archive then delete)
| Path | What | Action |
|---|---|---|
| `E:\Claude\legacy-odyssey-backup\` | Full git tree, stale | Confirm no unique commits → delete |
| `E:\Claude\legacy-odyssey.OLD\` | Full git tree, old | Confirm → delete |
| `E:\Claude\legacy-odyssey-backup-20260308\` | Partial (src + package only), Mar 8 | Delete |
| `E:\Claude\legacy-odyssey-snapshots\pre-video_2026-06-03_1104\` | Point-in-time snapshot | Keep until 1.0.17 confirmed stable, then delete |
| `F:\legacy-odyssey-backups\landing-v1-backup-2026-05-05\` | Single-page backup | Delete once landing consolidation done |

### 🟥 DEAD PRE-LAUNCH PROTOTYPES (archive off-repo or delete)
| Path | What | Action |
|---|---|---|
| `E:\Claude\babybook\` | Original static HTML prototype | Archive to `F:\_archive\` or delete |
| `E:\Claude\eowyn-book\` | Early static book (CNAME/index.html) | Archive/delete |
| `E:\Claude\dorindustries-site\` | Old DOR landing | Archive/delete |
| `E:\Claude\index-corrected.html`, `files.zip`, `chunk_00..10`, `b64_chunks.txt`, `files.zip` | Ancient base64/chunk scratch from initial build | Delete |
| `E:\Claude\eowyn-book`, `apk-serve`, `apple-screenshots`, `Marketing\` (1 png) | Misc scratch | Review → archive/delete |

### 🔴 SENSITIVE — secrets sitting in the open (handle first)
| Path | What | Action |
|---|---|---|
| `F:\legacy-odyssey\Legacy Odyssey\Legacy Odyssey Logins.docx` | **Plaintext logins** inside the repo working tree | Move to a real secret store (password manager / encrypted, gitignored `F:\_secrets\`). Confirm NOT git-tracked. |
| `F:\legacy-odyssey\Legacy_Odyssey_Project_Accounts.pdf` | Account/credentials PDF | Same |
| `F:\legacy-odyssey\.env` | Live API keys | Confirm gitignored (it should be); never commit |
| `F:\Legacy-Odyssey-Claude.bat`, `F:\LAPTOP_SETUP.md` | Launcher + setup | Keep, but scrub any embedded secrets |

### 🟡 IN-REPO CLUTTER (15 loose top-level .md + scratch)
Root of `F:\legacy-odyssey` has 15 loose `.md` context files plus scratch dirs
that make the repo hard to navigate and confuse parallel sessions:
- Context/handoff docs: `HANDOFF.md`, `HANDOFF-signup-fix.md`, `SESSIONS.md`,
  `SESSION_CONTEXT.md`, `DEV.md`, `BLOCKS.md`, `BACKUP_PRE_MIGRATION.md`,
  `PROJECT_LINKS.md`, `CLAUDE_CONTEXT.md`, `MARKETING.md`, `MARKETING_BRIEF.md`,
  `APP_SCREEN_REFERENCE.md`, `STORE_LISTING_v1.0.7.md`
- Superseded: `CLAUDE.md.superseded-20260527.bak`, `Changes from Claude 1.docx`
- Scratch dirs: `.tmp\`, `5-2 screenshots\`, nested `Legacy Odyssey\` folder
  (docx + zips + marketing images), `session-summary-2026-04-17.html`,
  `screen-reference.html`, `generate_*.py`, `save_html.py`, `nul`
- `v3\` — Cloudflare Workers rewrite (has its own node_modules); legit but
  should be a separate concern, not loose in the main repo root.

---

## Target structure (after cleanup)

```
F:\legacy-odyssey\               ← SINGLE source of truth (git → Railway)
├── CLAUDE.md                    ← stays at root (auto-loaded)
├── TODO.md                      ← engineering open items
├── README.md
├── src/  mobile/  supabase/  scripts/  assets/   ← code (unchanged)
├── docs/                        ← entity knowledge base (unchanged)
│   └── archive/                 ← NEW: all 15 loose context .md move here
│       (HANDOFF*, SESSIONS, DEV, BLOCKS, MARKETING*, etc.)
├── ops/                         ← business source of truth (this dir)
├── marketing/                   ← all marketing assets consolidated here
└── v3/                          ← (or split to its own repo)

F:\_secrets\        ← NEW, gitignored/off-repo: logins.docx, accounts.pdf
F:\_archive\        ← NEW: dead prototypes (babybook, eowyn-book, old copies)
F:\backups\         ← the ONE backup system (keep; verify offsite)
```

Everything under `E:\Claude\legacy-odyssey*` gets archived/deleted once the
F: tree is confirmed authoritative. The long-standing TODO to "relocate the
session project root to F so F auto-loads directly" should be completed so we
stop maintaining two `CLAUDE.md` copies (E: + F:).

---

## Cleanup plan — phased, each needs Dan's go

**Phase 0 (safe, no data risk) — ✅ DONE 2026-06-10 (Dispatcher session, Dan approved):**
- ✅ Created `docs/archive/`, moved the 15 loose context files into it (12 git-tracked
  via `git mv` + 3 untracked: HANDOFF-signup-fix.md, CLAUDE.md.superseded bak, Changes docx).
- ✅ Created `F:\_archive\` and `F:\_secrets\` folders (empty).
- ✅ Same day: CLAUDE.md slimmed (full copy preserved at `docs/archive/CLAUDE-full-20260610.md`),
  `sessions/` + `STATUS.md` cross-session system created, `E:\Claude\CLAUDE.md` reduced to a
  pointer stub (no more E↔F sync).
- ⏳ `.gitignore` audit still open (note: `CLAUDE.md` itself is gitignored).

**Phase 1 (secrets) — Dan does, I guide:**
- Move logins.docx + accounts.pdf to `F:\_secrets\` (or a password manager).
- Confirm they were never committed (`git log` on those paths).

**Phase 2 (dedupe full copies) — Dan approves each delete:**
- For each E:\ copy: `git log` to confirm no unique commits, then delete.
- Delete partial/old copies and pre-launch prototypes (archive first if unsure).

**Phase 3 (consolidate) — engineering:**
- One landing page (retire v1/v2 variants — ties to S-008).
- Decide v3 rewrite: keep in-repo subfolder vs its own repo.
- Complete the "project root → F:" relocation; collapse to one CLAUDE.md.

**Phase 4 (backups) — verify, don't add:**
- Confirm `F:\backups\backup.py` runs on a schedule and copies OFFSITE
  (Backblaze rec in HARDWARE.md). Retire ad-hoc manual copies once verified.
