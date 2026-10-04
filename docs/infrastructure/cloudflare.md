# Cloudflare

**Status:** active (since Apr 26 2026)
**Owner:** DNS authority for `legacyodyssey.com` zone, R2 photo backup, no longer used for customer domains
**Last touched:** 2026-04-28; archive-review additions 2026-10-04 at the bottom

## What it is
Cloudflare account (Free plan + Pro for SaaS subscription that should be cancelled). Two roles:
1. DNS authority for `legacyodyssey.com` zone (since Apr 26 — moved off Spaceship NS)
2. R2 object storage for photo backup
3. (Formerly) Cloudflare for SaaS for customer-domain TLS — abandoned Apr 27 in favor of Approximated.

## Where it's used
- DNS for `legacyodyssey.com` zone — managed in Cloudflare dashboard
- `src/services/cloudflareService.js` — DEAD CODE (was for SaaS), kept for reference
- R2 photo backup — managed by separate cron, env vars `CLOUDFLARE_R2_*`
- Roy's domain `roypatrickthompson.com` is the ONLY customer still on Cloudflare nameservers (artifact of failed CF-for-SaaS migration)

## Current configuration
- **Account email:** Legacyodysseyapp@gmail.com
- **Account ID:** `bc2ebc94444d987c7a78809a1d9449cb`
- **Plan:** Pro for legacyodyssey.com (~$25/mo)
- **Cloudflare for SaaS subscription:** **STILL ACTIVE — NEEDS CANCELLATION** (~$7/mo, no longer used since Approximated migration)
- **Zone Active:** legacyodyssey.com (since Apr 26 2026)
- **Cloudflare nameservers (legacyodyssey.com):** `khalid.ns.cloudflare.com`, `sima.ns.cloudflare.com`
- **API token:** `CLOUDFLARE_API_TOKEN` env var (zone-scoped to legacyodyssey.com only)
- **Zone ID:** `CLOUDFLARE_ZONE_ID=78a493539f48075096aec16f26075500`
- **Dashboard:** https://dash.cloudflare.com

## History
- 2026-04-26 — Connected `legacyodyssey.com` as Cloudflare zone. Imported 14 records, manually added 3 CF missed (`_acme-challenge`, `_railway-verify`, `spacemail._domainkey`)
- 2026-04-26 — Switched Spaceship NS for `legacyodyssey.com` to Cloudflare. Marketing site stayed live throughout
- 2026-04-26 — Subscribed to Cloudflare for SaaS; set up `edge.legacyodyssey.com` as fallback origin
- 2026-04-27 — Migrated Roy as test case: per-customer Cloudflare zone for `roypatrickthompson.com`
- 2026-04-27 — Hit account-token-permission wall: Account-scoped Zone:Edit needed for programmatic per-customer zone creation; not exposed in custom-token UI
- 2026-04-27 — Pivoted to Approximated.app. Cloudflare for SaaS stopped being used (subscription not yet cancelled)
- 2026-04-27 — Deleted `edge.legacyodyssey.com` Railway custom domain (was the SaaS fallback origin); freed 1 Railway slot
- 2026-04-28 — kateragno.com apex DNS edited from CNAME→edge to A→137.66.1.199 (Approximated)
- 2026-04-28 — kateragno.com www same edit

## Related
- `infrastructure/approximated.md` — replaced Cloudflare for SaaS for customer domains
- `infrastructure/spaceship-registrar.md` — domain registrar; Cloudflare is just the DNS authority for legacyodyssey.com
- `domains/legacyodyssey.com.md` — the zone Cloudflare hosts
- `domains/roypatrickthompson.com.md` — the one customer with Cloudflare nameservers (pending cleanup)

## Open issues / quirks
- **Cloudflare for SaaS subscription** still billing ~$7/mo, no longer used. Cancel in dashboard → Manage Subscriptions.
- **API token is too narrow** for any future CF-for-SaaS use — would need account-scoped Zone:Edit which the custom-token UI doesn't expose. Workaround if revisited: Global API Key (with IP allowlist) or Tenants API (Enterprise).
- **Roy is the only customer on Cloudflare NS.** Eventually consolidate by moving him back to Spaceship NS, OR keep as exception.
- **R2 backup** is independent of all this; uses separate IAM token, separate billing line.


## Update 2026-10-04 (archive review)
- **Static asset cache is 4 hours** (`cf-cache-status: REVALIDATED`, `max-age=14400`). CSS/JS served after a deploy can be stale for hours. Bust it by bumping a query string on the link/script URL, e.g. `admin.css?v=20260529`, `book.js?v=20260527`. Claude cannot purge the CF cache. Server-rendered EJS is not cached. Verify deploys with `?cb=<timestamp>` and a marker unique to the new code.
- **Audit log:** dash.cloudflare.com/<account-id>/audit-log. The zone-scoped CLOUDFLARE_API_TOKEN in .env can edit DNS but CANNOT read the audit log (Dan must be logged in). On 2026-06-24 the account had exactly one account API token, `legacy-odyssey-backup-cron` (R2 write only).
- **Managed robots.txt:** Cloudflare prepends `Allow: /` above our `Disallow: /` on customer hosts, so robots.txt is not an authoritative privacy layer. Customer-site privacy relies on the X-Robots-Tag header plus the meta tag (and the password gate).
- **Stream (video):** live since 2026-06-03 on account bc2ebc94444d987c7a78809a1d9449cb; Railway env CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN; health at `/api/videos/health`. Token template "Read and write to Cloudflare Stream and Images" (includes Account Analytics Read), no expiry. That token was pasted in chat once; Dan decided to leave it as is (do not nag). Cap: 1,000 minutes per site; the weekly `videoUsageMonitor.js` flags 80%. Delivery cost is not capped (a 60 to 120 minute cap was suggested; no answer).
- Client country for consent comes from the CF-IPCountry header (`middleware/consentRegion.js`; EU/EEA/UK need consent; test with `?consent=eu` or `?consent=us`).
