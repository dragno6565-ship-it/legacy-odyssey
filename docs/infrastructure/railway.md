# Railway

**Status:** active (production hosting since Feb 2026)
**Owner:** Legacy Odyssey Express server hosting
**Last touched:** 2026-06-10; archive-review additions 2026-10-04 at the bottom

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

## Custom-domain entries (14 of 20 used as of 2026-04-28 evening — 6 free slots)
- `legacyodyssey.com` (Cloudflare-fronted) — marketing site
- `*.legacyodyssey.com` (Cloudflare-fronted) — wildcard for subdomain books
- 6 paying-customer apex (Roy, Eowyn, Emma, Reese, Lachlan, Jeff)
- 6 paying-customer www (same 6)

**Removed 2026-04-28** (frees 5 slots):
- `www.dorindustries.com` — moved to Spaceship Web Hosting
- `www.your-family-photo-album.com` — moved to Spaceship Web Hosting (folder empty, demo can stay down)
- `kateragno.com` (apex) — niece's site, safe to be temporarily down
- `www.kateragno.com` — niece's site, safe to be temporarily down
- `www.your-childs-name.com` — moved to Spaceship Web Hosting (Apr 28 evening)

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
- **Zombie service** at `legacy-odyssey-production-a9d1.up.railway.app` still alive (v2.1.0 stale, health-checked 2026-06-10). Lives in a DIFFERENT Railway account from production. Concrete identifiers (from `PROJECT_LINKS.md` + `BACKUP_PRE_MIGRATION.md`):
  - Project: **`romantic-creation`** · project ID `25a7cbc7-64da-4012-bf24-5b20a0bc4839`
  - Service ID: `a759cd1b-34ae-4171-8e4b-9259e0e95dda`
  - Dashboard: https://railway.com/project/25a7cbc7-64da-4012-bf24-5b20a0bc4839
  - Service settings (delete here): https://railway.com/project/25a7cbc7-64da-4012-bf24-5b20a0bc4839/service/a759cd1b-34ae-4171-8e4b-9259e0e95dda/settings
  - **Owning Railway account:** the `dragno65` GitHub identity (per `Legacy_Odyssey_Project_Accounts.pdf` — "Railway · Username: dragno65 (GitHub login)"). Associated email almost certainly `dragno65@hotmail.com` (owner's older personal email). NOT `dragno6565@gmail.com` (that one holds production only).
  - **Access path to delete:** sign into railway.com via GitHub as `dragno65` in a private window (the local machine's git is authenticated as `dragno6565-ship-it`, so creds for `dragno65` aren't on disk here).
  - Delete only after eyeballing project name "romantic-creation" + version 2.1.0 + URL `...a9d1.up.railway.app` — do NOT touch the live `bountiful-expression` project.
- **Railway env vars** — `RAILWAY_API_TOKEN`, `RAILWAY_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID` in `.env`: **CLAUDE.md (2026-06-08 correction) says these point to LIVE production (`27622203`)**; older HANDOFF.md/DEV.md (now archived) said they point to the OLD `25a7cbc7` zombie project. Treat as ambiguous until reconfirmed — do NOT use this token to delete anything. Delete the zombie via the dashboard UI only.


## Update 2026-10-04 (archive review)

### The .env token points at LIVE production (settled)
The "ambiguous" note above is resolved: on 2026-06-15 REWARDFUL_API_SECRET was found under project `27622203` through this token, so `RAILWAY_API_TOKEN` / `RAILWAY_SERVICE_ID` / `RAILWAY_ENVIRONMENT_ID` in `.env` point at LIVE production (bountiful-expression). Never use it to delete anything. (Claude nearly deleted production on 2026-06-08 because an old note said otherwise.)

### GraphQL API recipes
- Endpoint `https://backboard.railway.com/graphql/v2`, bearer `RAILWAY_API_TOKEN`; project, environment and service ids are in `.env`.
- `variables` query: read env vars. `variableUpsert` mutation: set one variable (triggers a redeploy; used for CLARITY_PROJECT_ID, PUPPETEER_SKIP_DOWNLOAD, STRIPE_SECRET_KEY, DEEPL_API_KEY).
- `deployments`: SUCCESS/FAILED status by commit. `deploymentLogs`: runtime logs. `domains`: custom-domain status.
- Inline GraphQL in bash/PowerShell gets mangled: put the query in a script file. Scratch helpers `.tmp/rwpoll.js` (deploy poll), `.tmp/rwstatus.js`, `.tmp/rwlog.js` (log fetch) live in the gitignored `.tmp/` folder and print a harmless libuv "Assertion failed" on Windows exit. They are not version-controlled; recreate from these notes if lost.
- Secrets pulled this way (e.g. RESEND_API_KEY for a send) go into a one-shot env var or temp file that is deleted after the run; never printed.

### Deploy and verify routine
Push to main, poll the deployment until SUCCESS, wait 1 to 3 minutes (the rollover serves mixed old/new responses for 1 to 2 minutes), then verify with curl using a marker that exists ONLY in the new code plus a cache-buster (`?cb=$(date +%s)`). Text present in both old and new HTML gives a false "deployed". Static CSS/JS is cached by Cloudflare for 4 hours (see cloudflare.md). Ask Dan whether he is mid-edit before pushing; batch small fixes (a deploy restarts the server and kills in-flight uploads).

### Outage triage (origin vs edge vs platform)
1. Direct origin: `https://legacy-odyssey-production.up.railway.app` serves the full site.
2. Railway edge target for the apex: `d3rlkmxd.up.railway.app` with header `Host: legacyodyssey.com` (200 = Railway fine).
3. Then the public domain. This located the 2026-06-24 apex DNS fault (dead Fastly IP) in minutes.
4. Platform outage signature (2026-05-19): about 4 of 5 requests return 404 "Application not found" after a 10 s hang, even on the direct *.up.railway.app URL, and the Railway dashboard itself shows Not Found. Check status.railway.com before rolling back or debugging code.
5. Use Sentry timestamps (Sentry flagged one 500 three minutes BEFORE a deploy) and Railway runtime logs before blaming a deploy. curl-only views can mislead.

### Zombie service status
Dan said on 2026-06-08 "I deleted that railway account", yet the zombie URL still answered 200 / v2.1.0 right after and again on 2026-10-04. Unresolved which account was deleted. `/admin/health` now reports the zombie check as an informational PASS (commit 0b29266), not a WARN.
