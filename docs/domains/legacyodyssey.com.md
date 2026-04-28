# legacyodyssey.com

**Status:** active (production marketing site + SaaS API origin)
**Owner:** Legacy Odyssey (the business)
**Last touched:** 2026-04-28

## What it is
The primary domain for the Legacy Odyssey business. Serves the marketing site, the mobile API (`/api/*`), the admin panel (`/admin`), the customer account portal (`/account`), the gift/redeem flows, and the Stripe webhook (`/stripe/webhook`). Wildcard `*.legacyodyssey.com` is also a Railway custom domain — used for subdomain-based book viewing (e.g. `eowynragno.legacyodyssey.com`) and the Apple Review Demo at `applereview.legacyodyssey.com`.

## Where it's used
- `src/server.js` — every Express route
- `src/views/marketing/*.ejs` — landing, pricing, gift, etc.
- Mobile app's API target (`mobile/src/api/client.js` BASE_URL fallback)
- All transactional emails reference `https://legacyodyssey.com/...`
- App Store / Play Store listings link to it
- Customer custom-domain books eventually proxy through Railway → Express which is hosted at this domain's service

## Current configuration
- **Registrar:** Spaceship (registered ~Feb 2026)
- **Expires:** Feb 20, 2027 (auto-renew ON)
- **DNS authority:** Cloudflare (since Apr 26 2026; was Spaceship before)
- **Cloudflare zone ID:** `78a493539f48075096aec16f26075500`
- **Nameservers:** `khalid.ns.cloudflare.com`, `sima.ns.cloudflare.com`
- **TLS:** Cloudflare (free Universal SSL, plus Pro plan is active)
- **Routing:** Cloudflare → Railway (custom domain `legacyodyssey.com`) → Express
- **Plan:** Cloudflare Pro (~$25/mo) — gives access to Cloudflare for SaaS (currently UNUSED, should cancel SaaS add-on)

## Key DNS records (Cloudflare)
- `A @` / `CNAME @` → Railway (proxied through Cloudflare)
- `CNAME www` → Railway
- `*.legacyodyssey.com` → Railway (wildcard for subdomains)
- MX → Spacemail
- TXT `spacemail._domainkey` → DKIM key
- TXT `_acme-challenge` (Let's Encrypt for various)
- TXT `_railway-verify` (Railway domain ownership)

## History
- 2026-02-20 — Domain registered via Spaceship; Railway service first deployed
- 2026-04-26 — DNS authority moved Spaceship → Cloudflare. 14 records imported, 3 manually re-added (`_acme-challenge`, `_railway-verify`, `spacemail._domainkey`)
- 2026-04-26 — Cloudflare for SaaS subscription enabled (no longer needed since Approximated migration; should cancel)

## Related
- `infrastructure/cloudflare.md` — DNS authority
- `infrastructure/railway.md` — origin
- `infrastructure/spaceship-registrar.md` — registrar
- `infrastructure/spacemail.md` — inbound mail
- `infrastructure/resend.md` — outbound mail (verified sender)
- `projects/v3-workers-rewrite.md` — long-term plan replaces Railway as origin

## Open issues / quirks
- **`*.legacyodyssey.com`** wildcard is a single Railway custom-domain entry covering all subdomains. Used for `applereview.legacyodyssey.com` and any internal-style URL.
- **Cloudflare for SaaS subscription billing $7/mo, no longer used.** Cancel.
- **Mobile fallback BASE_URL** in older app versions points to zombie Railway service `legacy-odyssey-production-a9d1.up.railway.app`. Fixed in v1.0.5+.
