# MCP Connectors (Claude Code / Cowork desktop)

**Status:** Stripe + GA4 configured & health-green (load on next restart); Supabase + GSC blocked on credentials.
**Set up / corrected:** 2026-06-24 (coding).

## ⚠️ The right mechanism (learned the hard way)
This app is **Claude Code (v2.1.x) running inside the Cowork/CCD desktop frame.** It does **NOT** read
`%APPDATA%\Claude\claude_desktop_config.json`'s `mcpServers` block — that's the *old standalone Claude Desktop*
file. Proof: servers added there produced zero startup logs; the live connectors (B12, etc.) load via CCD's
`replaceRemoteMcpServers` SDK call + `.dxt` extensions, not that file.

**Custom local MCP servers must be added to Claude Code's own config** via the `claude` CLI:
```
claude mcp add <name> -s user -- cmd /c npx -y <package> <args>     # Windows
```
- Writes to **`C:\Users\dragn\.claude.json`** (`mcpServers`). NOT git, NOT a file Dan opens.
- **Windows gotcha #1:** the spawn command must be `cmd /c npx …` (bare `npx` won't spawn). In Git Bash, `/c`
  gets mangled to `C:/` — set it via the CLI then fix `args[0]` to `/c` in the json, or use `MSYS_NO_PATHCONV=1`.
- **Windows gotcha #2:** don't capture a key from a `dotenv`-printing node call — the banner corrupts it. Use
  `dotenv.config({quiet:true})`.
- **New servers load only on app restart** (the session's tool list is fixed at startup).

## Current state
| Connector | Server | Configured | Health (`claude mcp list`) | What's needed |
|---|---|---|---|---|
| **Stripe** | `@stripe/mcp` (official) | ✅ `~/.claude.json` | ✅ **Connected** | **Restart** to load tools. 11 tools, mostly read; one write `create_refund` (swap to a Stripe restricted read-only key to remove it). |
| **GA4** | `mcp-remote` → `https://mcp-google-analytics.stape.io/mcp` | ✅ `~/.claude.json` | ✅ **Connected** | **Restart**, then a **Google OAuth** prompt on first real data query (Stape endpoint is 401 until authed). |
| **Supabase** | `@supabase/mcp-server-supabase` | ❌ not added | — | Needs a **Personal Access Token** (service-role key can't run DDL). Create at supabase.com/dashboard/account/tokens → give to coding. |
| **Search Console** | community (`mcp-gsc`) | ❌ not added | — | Needs a **Google service-account JSON** with GSC access. |

## Notes
- Stripe key is **LIVE**, stored in `~/.claude.json` (the config Claude Code actually reads). Never in git.
- `claude_desktop_config.json` was reverted to its original (no secret left there); a dated backup sits beside it.
- **No custom MCP build warranted** — working servers exist for all four; gaps are creds/OAuth only.
- Restart caveat: the coding session can't quit/reopen the app (kills the running session) — Dan does it.

## Related
- `infrastructure/railway.md` (secret source), `infrastructure/supabase.md`, `infrastructure/cloudflare.md`.
