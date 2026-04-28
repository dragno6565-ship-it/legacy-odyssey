# eowynhoperagno.com

**Status:** active customer site (the owner's own daughter's book)
**Owner:** Eowyn Ragno (the owner's daughter) — owner's own family book
**Customer email:** dragno65@hotmail.com
**Last touched:** 2026-04-27

## What it is
The owner's own family digital baby book — for his daughter Eowyn Hope Ragno. This is the founder's primary "dogfood" customer site and was the first real book on the platform.

Family ID: `fb16691d-7ea4-4c93-9827-ffe8904ced6b`
Book ID: `501e0807-d950-4004-8b4c-9b0f0ce0c910`
Subdomain (legacy): `eowynragno` (also serves at `eowynragno.legacyodyssey.com` via the wildcard)

## Where it's used
- Family record in Supabase
- Mobile app (owner's primary book)
- Public book viewer at `https://www.eowynhoperagno.com` and `https://eowynhoperagno.com`
- Subdomain alias `eowynragno.legacyodyssey.com`

## Current configuration
- **Registrar:** Spaceship (auto-renew ON, expires Mar 10 2027)
- **DNS authority:** Spaceship nameservers
- **DNS records:** A `@` → 137.66.1.199, A `www` → 137.66.1.199
- **TLS:** Approximated
- **Approximated vhost:** active, status=serving
- **Railway custom domains:** apex + www both registered

## History
- (Earliest) — registered before public launch as the dogfood site
- 2026-04 — Apex repaired (was on stale GitHub Pages IPs)
- 2026-04-27 — Migrated to Approximated. apex + www both 200 OK

## Related
- `customers/eowyn-ragno-owner.md`
- `infrastructure/approximated.md`
- `infrastructure/railway.md`

## Open issues / quirks
- **Real family content** — handle with care. Not a placeholder.
- **Tied to owner's account** (`dragno65@hotmail.com`) — different gmail than other accounts
