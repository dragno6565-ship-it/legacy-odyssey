# kateragno.com

**Status:** active customer site (niece — early days, not in heavy use)
**Owner:** The kateragno Family — owner's niece Kate
**Customer email:** dragno65@gmail.com (owner's gmail; family setup)
**Last touched:** 2026-04-28

## What it is
Customer-purchased domain for the user's niece (Kate). Hosts her digital baby book on Legacy Odyssey. Signed up Mar 29 2026 via the founder modal flow at $29 first year. Niece's family hasn't started filling in the book yet — site exists but content is minimal.

## Where it's used
- Family record in Supabase: `families.custom_domain = 'kateragno.com'`
- Mobile app book editor for this family
- Public book viewer at `https://www.kateragno.com` (canonical) and `https://kateragno.com` (apex)

## Current configuration (as of Apr 28 2026)
- **Registrar:** Spaceship
- **Renewal:** Mar 29, 2027 ($10.18/yr, auto-renew ON)
- **DNS authority:** Spaceship nameservers (launch1/2.spaceship.net)
- **Propagation status:** ONLINE
- **DNS records:**
  - A `@` → 137.66.1.199 (Approximated cluster), TTL 30 min
  - A `www` → 137.66.1.199, TTL 30 min
- **Connections:** 0 (URL Redirect was removed Apr 27)
- **TLS:** Approximated (Caddy On-Demand TLS, Let's Encrypt)
- **Approximated vhost:** id 1297383 (re-created Apr 27), keep_host=true, target=legacy-odyssey-production.up.railway.app
- **Railway custom domain entries:** `kateragno.com` (apex, just re-added Apr 28 — Waiting for DNS update) and `www.kateragno.com`

## History
- 2026-03-29 — Domain registered via Stripe checkout flow ($29 first year via founder modal)
- 2026-04-22 — Migrated apex+www to Cloudflare for SaaS architecture
- 2026-04-27 — Migrated to Approximated.app (Cloudflare for SaaS abandoned)
- 2026-04-27 — Removed Spaceship URL Redirect connection (was injecting locked `group:product` apex A records pointing at parking IP `15.197.162.184`)
- 2026-04-27 — Approximated vhost initially had `redirect: true` set during a configuration test; deleted+recreated to clear the sticky flag
- 2026-04-28 — Apex 404'd through Railway (stuck "Waiting for DNS update" state)
- 2026-04-28 — Deleted `kateragno.com` apex from Railway then re-added; status reset
- 2026-04-28 — User confirmed: "we can safely remove kateragno.com... for now" — acceptable for site to be temporarily down while v3 is being built; not a high-traffic site

## Related
- `customers/kate-ragno-niece.md` — family record details
- `infrastructure/approximated.md`
- `infrastructure/railway.md`
- `infrastructure/spaceship-registrar.md`

## Open issues / quirks
- **www works, apex was 404 (just re-added to Railway Apr 28).** Verify post-propagation.
- **User said safe to remove temporarily** during v3 build. Site is for niece's family that hasn't started yet.
- **Spaceship URL Redirect feature was removed** — don't re-add (causes locked apex A pollution).
