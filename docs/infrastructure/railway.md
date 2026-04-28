# Railway

**Status:** active (production hosting since Feb 2026)
**Owner:** Legacy Odyssey Express server hosting
**Last touched:** 2026-04-28

## What it is
Railway Pro — hosts the production Express server (Node 20). Auto-deploys from `dragno6565-ship-it/legacy-odyssey` on push to `main`.

## Where it's used
- Every customer book page eventually proxies through here (Approximated → Railway)
- Marketing site (`legacyodyssey.com` → Cloudflare → Railway)
- Mobile API endpoints (`legacyodyssey.com/api/*`)
- Admin panel (`legacyodyssey.com/admin`)
- Account portal (`legacyodyssey.com/account`)
- Stripe webhook (`legacyodyssey.com/stripe/webhook`)

## Current configuration
- **Project:** "bountiful-expression"
- **Project ID:** `27622203-293e-4720-b019-9efe8eadfdf4`
- **Service ID:** `59190e65-b239-4cf1-842a-3913fabb1838`
- **Environment ID:** `a9643517-8aad-441a-81c7-55c462f2fea0`
- **Service hostname (system):** `legacy-odyssey-production.up.railway.app` (free, doesn't count toward cap)
- **Plan:** Pro
- **Custom domain cap:** 20 (verified by Railway support)
- **Region:** US-West (California)
- **Dashboard:** https://railway.com/project/27622203-293e-4720-b019-9efe8eadfdf4

## Custom-domain entries (19 of 20 used as of 2026-04-28 — see ./railway-custom-domains.md for live list)
- `legacyodyssey.com` (Cloudflare-fronted) — marketing site
- `*.legacyodyssey.com` (Cloudflare-fronted) — wildcard for subdomain books
- 7 customer apex (Kate, Roy, Eowyn, Emma, Reese, Lachlan, Jeff)
- 8 customer www (the 7 above + your-family-photo-album.com)
- `www.dorindustries.com` — corporate landing
- `www.your-childs-name.com` — marketing demo site
- 1 free slot

Critical: Railway's edge **gates traffic by Host header**. Any Host not in this list returns 404 "Application not found" before Express even runs.

## History
- 2026-02-20 — `legacyodyssey.com` registered, Railway service created
- 2026-04-19 — Discovered "zombie" Railway service `legacy-odyssey-production-a9d1.up.railway.app` running stale v2.1.0; mobile app's BASE_URL was pinned to it. Fixed mobile to use `legacyodyssey.com`. Zombie still alive but unused.
- 2026-04-26 — Hit 20-domain cap; Railway support (Brody) confirmed Pro plan limit. Filed Central Station ticket asking for cap bump.
- 2026-04-26 — Cloudflare for SaaS migration begun to bypass cap (later abandoned in favor of Approximated).
- 2026-04-27 — Migrated to Approximated.app for TLS, but Railway STILL gates by Host header so all customer domains must remain in custom-domain list.
- 2026-04-27 — Deleted `edge.legacyodyssey.com` (was Cloudflare for SaaS fallback origin); freed 1 slot.
- 2026-04-28 — Re-added `kateragno.com` apex after delete to clear "Waiting for DNS update" stale state.
- 2026-04-28 — Plan: cap-bump request in flight; long-term solution is v3 Workers rewrite which eliminates Railway entirely.

## Related
- `infrastructure/approximated.md` — Approximated proxies all customer traffic to here
- `infrastructure/cloudflare.md` — fronts legacyodyssey.com itself
- `projects/v3-workers-rewrite.md` — replaces Railway
- All `domains/*.md` files — each customer domain has Railway custom-domain entries

## Open issues / quirks
- **20 custom-domain cap** is the hard scaling block. Cap-bump to 30 offered temporarily by Railway support; not negotiated yet.
- **Edge gates by Host header** — traffic proxied from Approximated still needs each Host to be in Railway's list. This is why Approximated alone doesn't solve the cap problem.
- **Zombie service** at `legacy-odyssey-production-a9d1.up.railway.app` still alive (v2.1.0 stale). Should be deleted once v1.0.5+ has propagated to all installed mobile clients.
- **Railway env vars** — `RAILWAY_API_TOKEN`, `RAILWAY_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID` in `.env` point to a SECONDARY project (`25a7cbc7` "romantic-creation"). Cannot add custom domains via API for the production project.
