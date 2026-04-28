# Legacy Odyssey — Project Knowledge Base

A per-entity knowledge base. Every domain, customer, vendor, and ongoing project we touch gets a file here. The goal is to convert "I forgot what that was" into "I read its file before answering."

## How this is organized

```
docs/
├── README.md              ← this file (the system explanation)
├── INDEX.md               ← every entity, one line each (read first at session start)
├── domains/               ← one file per domain we own
├── customers/             ← one file per family / demo / test account
├── infrastructure/        ← one file per vendor (Railway, Stripe, Spaceship, etc.)
└── projects/              ← one file per ongoing multi-session project
```

## Standard Operating Procedure for Claude

**At session start:**
1. Read `INDEX.md` — small, fits in working memory, gives a complete map.

**When the user mentions a specific entity:**
1. Locate the file: `docs/<category>/<name>.md`.
2. Read it BEFORE responding.
3. If the file doesn't exist for an entity that should have one — create it before continuing the work.

**After any meaningful change to an entity:**
1. Update its file's "Current configuration" and "History" sections in the same response that does the work.
2. Bump the "Last touched" date.
3. Add to "Open issues / quirks" if anything new was discovered.

**When creating a new entity (new customer, new vendor):**
1. Write its file from the standard template (see below) BEFORE moving on.
2. Add it to `INDEX.md`.

## Standard template

Every entity file follows this shape so it scans fast:

```markdown
# <name>

**Status:** active / archived / planned / dormant
**Owner / who it's for:** ...
**Last touched:** YYYY-MM-DD

## What it is
One paragraph in plain English. Disambiguates from similar things.

## Where it's used
- `src/path/to/code:line` — what role
- referenced from `<route>`, marketing copy at `<file>`
- linked from `<external thing>`

## Current configuration
Concrete state right now. DNS, IDs, env vars, plan tier, anything you'd
need to know to operate it.

## History
Reverse-chronological. Bullet per meaningful change.
- 2026-04-28 — what happened
- 2026-04-27 — earlier change

## Related
Other docs/ files that should also be read when this comes up.

## Open issues / quirks
Known gotchas, known bugs, planned changes.
```

## Why the existing CLAUDE.md / SESSIONS.md / BLOCKS.md aren't enough

- **CLAUDE.md** is project-level — too coarse for "what is this one thing"
- **SESSIONS.md** is time-ordered — finding info about a specific entity requires scanning every session
- **BLOCKS.md** is operational-block-level — good for "what runs the customer-domains layer" but doesn't say "what is `your-childs-name.com` specifically"

Per-entity files are content-addressable. User says a name → I read that one file → I know.

## Maintenance

- Files are version-controlled in the main repo.
- Git history is the audit trail.
- If a file gets stale or wrong, fix it in the same session it's caught.
- INDEX.md is regenerated whenever entities are added/removed/renamed.
