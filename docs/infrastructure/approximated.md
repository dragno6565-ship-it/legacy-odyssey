# Approximated.app

**Status:** active (added Apr 27 2026)
**Owner / who it's for:** Legacy Odyssey customer-domain TLS termination + proxy
**Last touched:** 2026-04-28; archive-review additions 2026-10-04 at the bottom

## What it is
SaaS proxy service that handles per-customer-domain TLS termination via Caddy On-Demand TLS (Let's Encrypt). Each customer's apex+www points DNS at our Approximated cluster IP; Approximated terminates the TLS connection and proxies to our Railway origin with the original Host header preserved.

Founder: Tyler. Indie SaaS, responsive direct support.

## Where it's used
- `src/services/approximatedService.js` — API wrapper (addVirtualHost, findVirtualHost, deleteVirtualHost, getStatus, getClusterIp)
- `src/services/spaceshipService.js setupDns` — writes 2 A records per customer (apex + www) → cluster IP
- `src/services/domainService.js purchaseAndSetupDomain` — creates virtual host before DNS setup
- `scripts/migrate-customer-to-approximated.js` — idempotent migration script for existing customers

## Current configuration
- **Plan:** $20/mo base (less than 100 hostnames)
- **Pricing model:** $0.20/hostname/mo, with 5% off per 1000 hostnames, capped at 50% off (= $0.10/hostname at 5k+)
- **Cluster name:** "Legacy Odyssey"
- **Cluster IP (customer A records):** `137.66.1.199`
- **Target address (where Approximated proxies to):** `legacy-odyssey-production.up.railway.app:443`
- **Critical config per vhost:** `keep_host: true` (preserves original Host header so Express routes correctly)
- **Hostnames in use:** 16 (8 customers × apex + www)
- **API key:** `APPROXIMATED_API_KEY` env var (in `.env` and Railway). Per-cluster scope.
- **Cluster IP env var:** `APPROXIMATED_CLUSTER_IP=137.66.1.199`
- **Bandwidth allowance:** 400 GB/mo included; $0.05/GB overage
- **Uptime claim:** 99.993% average
- **Dashboard:** https://cloud.approximated.app

## History
- 2026-04-27 — Created account, $20/mo plan. First smoke test: `apxtest.legacyodyssey.com` worked end-to-end in <60s
- 2026-04-27 — Wrote `approximatedService.js` (6/6 ops verified: add / idempotent re-add / find / status / delete / verify-deleted)
- 2026-04-27 — Migrated all 8 customers (Roy, Eowyn, Emma, Kate, Reese, Lachlan, Jeff, your-family-photo-album) to Approximated
- 2026-04-27 — Hit two bugs: (1) wrong target_address `legacyodyssey.com` returned 403 from Cloudflare; switched to direct `legacy-odyssey-production.up.railway.app`. (2) `keep_host` field wasn't actually rewriting Host header in test
- 2026-04-27 — Discovered field name quirk: update endpoint uses `current_incoming_address` not `incoming_address` (400 errors otherwise)
- 2026-04-27 — Discovered `redirect: true` is sticky — once enabled, can't be cleanly cleared via update; must delete and recreate the vhost

## Related
- `infrastructure/railway.md` — origin target
- `infrastructure/cloudflare.md` — DOES NOT proxy customer domains anymore (was tried, abandoned)
- `infrastructure/spaceship-registrar.md` — where customer DNS lives
- `domains/*.md` — every customer domain has an Approximated vhost
- `projects/v3-workers-rewrite.md` — long-term replacement plan

## Open issues / quirks
- **At scale (100k customers):** ~$19,200/mo at the 50%-discount-cap. This is the primary motivation for v3 Workers rewrite.
- **`keep_host` setting in API** — empirically didn't rewrite Host header in test (Apr 27). Live behavior is fine because Express still gets the customer hostname.
- **`redirect: true` sticky bug** — workaround: delete + recreate vhost.
- **No published SLA at $20/mo tier.** Custom SLAs require contacting sales.
- **Single point of failure** for ALL customer-domain traffic. If Approximated cluster goes down, all 8 customer sites are unreachable until rollback (point DNS back at older path).


## Update 2026-10-04 (archive review): the apx-incoming-host header contract
- Approximated rewrites the upstream Host to `legacyodyssey.com` and passes the customer's real domain in the **`apx-incoming-host`** header (confirmed empirically 2026-07-14 with a temporary /health echo, since removed). The `keep_host` behavior noted above is therefore NOT what production relies on.
- `src/utils/realHost.js` reads `apx-incoming-host` ONLY when the transport host is our own domain (anti-spoof). Used by resolveFamily, customerNoindex, the robots.txt route and recordPageView. `www.<appDomain>` 301s to the apex in server.js.
- Ignoring this header caused the 11-week custom-domain outage (fixed 2026-07-14). Monitoring must check page CONTENT per customer domain, not just status codes.
- Pulse history: 2026-07-15 06:10 Approximated proxy blip (ECONNABORTED on proxied domains only, self-recovered); from 2026-08-08 03:00 an in-container "hairpin" failure after a redeploy (the pulse could not reach its own public domains; the site was up). `cron_runs` (name, last_success_at, last_error, consecutive_failures) is the authoritative record; a 7 s run means the pulse saw everything, blind runs take about 20 s.
- The hourly pulse excludes Dan's test sites (legacyodysseytest8/9) and your-family-photo-album.com so alerts mean real customers.
