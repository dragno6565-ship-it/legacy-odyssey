# Spaceship (Registrar)

**Status:** active (primary registrar)
**Owner:** Legacy Odyssey customer-domain registration + DNS for ~all customer domains
**Last touched:** 2026-04-28

## What it is
Spaceship is the user's domain registrar (owned by Namecheap). Registers customer .com domains automatically at SaaS checkout. Also serves DNS for almost all customer domains (Roy is the exception — on Cloudflare NS).

Below-wholesale pricing: $9.98/yr renewal for .com.

## Where it's used
- `src/config/spaceship.js` — axios client with auth headers
- `src/services/spaceshipService.js` — `checkAvailability`, `checkMultipleTlds`, `registerDomain`, `pollOperation`, `setupDns`, `setAutoRenew`
- `src/services/domainService.js` — orchestrates registration → DNS → etc.
- Domain order pipeline: pending → registering → registered → dns_setup → active

## Current configuration
- **Account email:** dragno65@gmail.com
- **API key env vars:** `SPACESHIP_API_KEY`, `SPACESHIP_API_SECRET`
- **Contact ID env var:** `SPACESHIP_CONTACT_ID` (used for registrant/admin/tech/billing on every domain)
- **Wallet balance:** ~$50 funded, auto-renewal enabled (Visa ending 6181)
- **Default nameservers (assigned at registration):** `launch1.spaceship.net`, `launch2.spaceship.net`
- **Domain count owned:** 24 total (mix of Legacy Odyssey customers + user's other personal domains)
- **Pricing:** ~$12.99 first year (variable), $9.98/yr renewal for .com
- **MAX_REGISTRATION_PRICE:** $20 (cap in code; refuses to auto-purchase domains above this)

## API quirks (learned the hard way)

1. **PUT `/dns/records/{domain}` is NON-DESTRUCTIVE.** It appends rather than replaces. To replace, must DELETE existing records first. Several scripts handle this: `scripts/repair-apex-dns.js`, `scripts/delete-stale-a-records.js`, `scripts/check-spaceship-dns.js`.
2. **DELETE on locked records silently fails** with HTTP 204 (success) but doesn't actually remove. `group: product` records are locked. Discovered Apr 25 2026.
3. **URL Redirect connection** auto-injects locked `group:product` apex A records pointing at parking IPs (e.g. `15.197.162.184`). Cannot remove via API — only via Domain Manager → click domain → URL redirect → Remove connection.
4. **Async domain registration:** POST `/domains/{domain}` returns 202 + `spaceship-async-operationid` header. Poll `/async-operations/{id}` until status='success' or 'failed'.
5. **Rate limits:** 5 req/domain/300s for availability checks. Use bulk endpoint + 5-min cache to stay under.
6. **`/url-forwardings` endpoint REMOVED** (2026). Cannot programmatically set up apex→www redirects via that path.
7. **Privacy protection** must be `{ level: 'high', userConsent: true }` on registration body.
8. **Auto-renew toggle:** PUT `/domains/{domain}/autoRenew` with `{ isEnabled: bool }`. Same 5 req/300s limit.

## History
- 2026-02 — Account created, first domain (legacyodyssey.com) registered
- 2026-04-25 — Discovered URL Redirect locked-record issue via `roypatrickthompson.com`
- 2026-04-26 — `setupDns` rewritten for Cloudflare for SaaS (CNAME-at-apex)
- 2026-04-27 — `setupDns` rewritten for Approximated (A records at apex + www → cluster IP)
- 2026-04-27 — Removed URL Redirect connections from kateragno.com and your-family-photo-album.com (the two customers with `group:product` pollution)
- 2026-04-28 — Confirmed kateragno.com state: clean, 2 A records, 0 connections, 0 redirects

## Related
- `infrastructure/spaceship-hosting.md` — separate Spaceship product, hosts demo sites
- `infrastructure/approximated.md` — DNS A records point at Approximated cluster
- `infrastructure/cloudflare.md` — replaces Spaceship NS for `legacyodyssey.com` zone only
- `domains/*.md` — each domain registered through Spaceship

## Open issues / quirks
- **No bulk auto-renew toggle.** Disabling auto-renew on multiple lapsing domains requires 1 API call each.
- **Order failures don't auto-disable auto-renew.** Code added Apr 26 to handle this on post-registration failures (legacyodysseytest5.com, legacyodysseytest6.com lost ~$25.98 before this fix).
- **Domain Manager UI** is needed for: nameserver changes, URL Redirect connection removal, Connections panel inspection. No API equivalent.
