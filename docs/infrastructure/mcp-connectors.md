# MCP Connectors (Claude Desktop)

**Status:** partial — Stripe live; GA4 staged (needs OAuth); Supabase + GSC blocked on credentials.
**Set up:** 2026-06-24 (coding). **Config file:** `%APPDATA%\Claude\claude_desktop_config.json` (`mcpServers` block).
**⚠️ Secrets live ONLY in that config file** (user profile, NOT git). A dated backup of the pre-edit config sits beside it.

## What it is
Direct API access for Claude sessions via MCP, replacing browser/token workarounds. Configured in the
Claude Desktop config (NOT one-click directory connectors). Requires a full app quit + reopen to load.

## Current state
| Connector | Server | Installed | Tested | Blocker / Dan action |
|---|---|---|---|---|
| **Stripe** | `@stripe/mcp` (official) | ✅ yes | ✅ MCP handshake (11 tools) + live key read | Restart app. Optional: swap the live key for a Stripe **restricted read-only key** to neutralize the one write tool (`create_refund`). |
| **GA4** | `mcp-remote` → `https://mcp-google-analytics.stape.io/mcp` (Stape, official remote) | ✅ config added | ⚠️ not testable here | Restart, then **click the Google OAuth login** once on first use. |
| **Supabase** | `@supabase/mcp-server-supabase` (official) | ❌ not added | — | Needs a **Personal Access Token** (PAT) — the service-role key can't run DDL. Create at supabase.com/dashboard/account/tokens → give to coding → I add it. (Alt: a Postgres MCP needs the DB password.) |
| **Google Search Console** | community (`mcp-gsc` etc.) | ❌ not added | — | Needs a **Google service account JSON with GSC access** (or a remote OAuth GSC server, TBD). No Google creds on hand. |

## Notes
- **Stripe key is LIVE.** `@stripe/mcp` v0.3.3 has no `--tools` flag; it exposes 11 tools that are mostly
  read (`stripe_api_read`, `stripe_api_search`, search docs/resources, account info) + **one write: `create_refund`**.
  A restricted read-only key would make it truly read-only.
- **No custom MCP build is warranted for any of the four** — working servers exist for all; the only gaps are
  credentials/OAuth (Supabase PAT, Google auth), not missing software.
- **Restart caveat:** the coding session can't quit/reopen Claude (that kills the running session) — Dan does it.

## Related
- `infrastructure/railway.md` — where the secrets (STRIPE_SECRET_KEY, SUPABASE_*) are sourced from.
- `infrastructure/supabase.md`, `infrastructure/cloudflare.md`.
