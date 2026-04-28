# your-family-photo-album.com

**Status:** active (marketing demo for FUTURE product)
**Owner:** Legacy Odyssey marketing
**Last touched:** 2026-04-28

## What it is
**Marketing demo of the future Legacy Odyssey "Family Photo Album" product.** A separate SKU from the current baby book product — a full-family photo album rather than a single-child book. The demo shows what that product will look like when it launches. Currently served at this domain to validate the concept and capture interested visitors.

NOT a paying customer. The "Your Family" record in the families table is a placeholder/demo entity, not a real subscriber.

## Where it's used
- `src/routes/book.js` — `DEMO_BOOK_DOMAINS` and `DEMO_SITES['your-family-photo-album.com'] = 'family-album-demo.html'`
- `src/middleware/requireBookPassword.js` — password bypassed for demo
- `src/public/family-album-demo.html` — 67 KB demo HTML
- `src/views/marketing/redeem.ejs` — referenced
- `src/views/marketing/landing.ejs` — referenced
- "Your Family" in admin panel families list — DEMO record

## Current configuration (as of Apr 28 2026)
- **Registrar:** Spaceship (auto-renew ON)
- **Renewal:** Feb 22, 2027
- **DNS authority:** Spaceship nameservers
- **Currently serving from:** Railway → Express (DEMO_SITES middleware), apex hostname returns 404 because Railway apex not registered
- **In Railway custom domains list:** `www.your-family-photo-album.com` (apex is NOT registered — this is why apex 404s)
- **Approximated vhost:** exists (id 1297384), keep_host=true, target=legacy-odyssey-production.up.railway.app

## Migration plan (Apr 28 2026)
Moving FROM Railway/Express TO Spaceship Web Hosting (same plan as your-childs-name.com). User said:
> "Yes, but also move your-family-photo-album.com as well so we can remove it from Railway."
> "your-family-photo-album.com can go down until we want to work on it again."

So: not urgent. Brief downtime acceptable. Move when convenient during the dorindustries.com migration.

## History
- 2026-02-22 — Domain registered
- 2026-04-15 — Demo HTML `family-album-demo.html` (67 KB) created
- 2026-04-27 — Approximated vhost created, DNS A records → 137.66.1.199, removed Spaceship URL Redirect connection (which was injecting locked group:product apex A pollution)
- 2026-04-28 — Apex 404 confirmed (Railway custom-domain list missing the apex). User confirms acceptable for now. Migration to Spaceship hosting planned.

## Related
- `domains/your-childs-name.com.md` — sibling demo domain
- `infrastructure/spaceship-hosting.md` — target host for the migration
- `customers/your-family-demo.md` — the demo "family" record
- `infrastructure/approximated.md` — current vhost
- `infrastructure/railway.md` — currently still serving www

## Open issues / quirks
- **Apex 404** — never registered as Railway custom domain. Will be moot once moved to Spaceship hosting.
- **Demo for future product** — not yet launched as a paid SKU. Strategic asset, not revenue-generating.
- **Two domain owners might confuse:** "Your Family" the demo families row in DB ≠ "Your Family Photo Album" the future product SKU.
