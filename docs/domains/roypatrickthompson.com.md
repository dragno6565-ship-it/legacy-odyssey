# roypatrickthompson.com

**Status:** active customer site
**Owner:** Julia Ragno (owner's relative) — for Roy Patrick Thompson
**Customer email:** eowynkiller@gmail.com
**Last touched:** 2026-04-28

## What it is
A customer site for Julia Ragno's family. The book is for Roy Patrick Thompson. Active paying subscriber.

Notable: This was the FIRST customer migrated to Approximated and is the only customer with Cloudflare nameservers (artifact of the abandoned per-customer-Cloudflare-zone experiment Apr 27).

## Where it's used
- Family record in Supabase
- Mobile app book editor
- Public book viewer at `https://www.roypatrickthompson.com` and `https://roypatrickthompson.com`

## Current configuration
- **Registrar:** Spaceship (auto-renew ON, expires Mar 19 2027)
- **DNS authority:** **Cloudflare** (custom nameservers `khalid.ns.cloudflare.com`, `sima.ns.cloudflare.com`) — UNIQUE among customers
- **Cloudflare account:** Roy is a zone in our Legacyodysseyapp@gmail.com account
- **Cloudflare zone account ID:** `bc2ebc94444d987c7a78809a1d9449cb`
- **DNS records (in Cloudflare):**
  - A `roypatrickthompson.com` → 137.66.1.199 (DNS only, not proxied)
  - A `www` → 137.66.1.199 (DNS only)
  - TXT `_cf-custom-hostname` (vestigial from Cloudflare for SaaS experiment, not actively used)
- **TLS:** Approximated
- **Approximated vhost:** active, status=serving
- **Railway custom domains:** apex + www both registered

## History
- 2026-03-19 — Domain registered
- 2026-04-25 — URL Redirect connection in Spaceship had injected locked `group:product` apex A. Removed via dashboard.
- 2026-04-27 (early) — First customer migrated to per-customer Cloudflare zone model (the Cloudflare for SaaS experiment). Nameservers switched Spaceship → Cloudflare.
- 2026-04-27 (later) — Migration target pivoted to Approximated. Roy's Cloudflare zone DNS records edited from CNAME→edge to A→137.66.1.199 (DNS only).
- 2026-04-27 — Apex + www both serving 200 OK on Approximated

## Related
- `customers/roy-patrick-thompson.md`
- `infrastructure/cloudflare.md` — DNS authority for this domain
- `infrastructure/approximated.md`
- `infrastructure/railway.md`

## Open issues / quirks
- **Only customer with Cloudflare nameservers.** Eventually consolidate (move back to Spaceship NS) OR keep as exception. No current rush.
- **Vestigial `_cf-custom-hostname` TXT** record could be cleaned up.
- **Was the proof point** for the Approximated migration — first customer end-to-end.
