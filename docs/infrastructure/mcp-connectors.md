# MCP Connectors (Claude Code / Cowork desktop)

**Status (2026-06-24, FINAL):** Stripe + GA4 work in the **`claude` CLI only** (not the GUI app). Supabase + GSC
not set up (blocked on credentials). GUI integration deferred by Dan (CLI is enough).

## ⚠️ Key finding: the GUI app has NO config-file hook for custom MCP servers
This app is **Claude Code running inside the Cowork/CCD desktop frame.** Proven three ways that it does **not**
load custom MCP servers from any config file:
1. `%APPDATA%\Claude\claude_desktop_config.json` `mcpServers` → ignored (zero startup logs).
2. `~/.claude.json` `mcpServers` (via `claude mcp add`) → also ignored by the GUI, even after restarts.
3. `main.log`: every session loads exactly **"13 total servers"** via the CCD `replaceRemoteMcpServers` SDK
   call and never mentions stripe/ga4/`.claude.json`.

The GUI's session connectors come ONLY from its managed set: the **connector directory** (claude.ai remote
connectors) + **`.dxt` extensions** (e.g. B12, installed under `Claude Extensions\` + `extensions-installations.json`).
**To add a custom connector to the GUI you must build/install a `.dxt` extension or add a claude.ai custom
remote connector — there is no config file to edit.**

## What IS working — the `claude` CLI
`claude mcp add … -s user` configured these in `~/.claude.json`; they're **health-green in the standalone CLI**
(`claude mcp list` → ✓ Connected). Run `claude` in a terminal to use them:
| Connector | Server | CLI status | Notes |
|---|---|---|---|
| **Stripe** | `@stripe/mcp` (official) | ✅ Connected | 11 tools, mostly read; one write `create_refund`. Live key in `~/.claude.json` (not git). |
| **GA4** | `mcp-remote` → `mcp-google-analytics.stape.io/mcp` | ✅ Connected | Google OAuth prompt on first real data query. |
| **Supabase** | `@supabase/mcp-server-supabase` | ❌ not added | Needs a **Personal Access Token** (service-role can't run DDL). |
| **Search Console** | community (`mcp-gsc`) | ❌ not added | Needs a **Google service-account JSON**. |

## Windows gotchas (for any future `claude mcp add`)
- Spawn command must be `cmd /c npx …` (bare `npx` won't spawn). In Git Bash `/c` mangles to `C:/` — fix
  `args[0]` to `/c` in `~/.claude.json`, or use `MSYS_NO_PATHCONV=1`.
- Don't capture a secret from a `dotenv`-printing node call — use `dotenv.config({quiet:true})` or the banner
  corrupts the value.

## Notes
- `claude_desktop_config.json` was reverted to original (no secret left there); dated backup beside it.
- **No custom MCP build was warranted** for the goal — working servers exist; gaps are creds/OAuth + the GUI's
  closed connector model.
- To revisit GUI integration later: build a Stripe `.dxt`, or add `mcp.stripe.com` / the Stape GA4 URL as
  **claude.ai custom remote connectors** (Settings → Connectors).

## Related
- `infrastructure/railway.md` (secret source), `infrastructure/supabase.md`, `infrastructure/cloudflare.md`.
