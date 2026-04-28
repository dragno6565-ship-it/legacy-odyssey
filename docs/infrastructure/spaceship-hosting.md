# Spaceship Hosting (Web Hosting)

**Status:** active (paid plan exists, just discovered Apr 28 2026)
**Owner:** Legacy Odyssey static demo + corporate landing pages
**Last touched:** 2026-04-28

## What it is
Spaceship's "Web Hosting Essential" plan — shared cPanel hosting. Used to serve static HTML demo files for Legacy Odyssey marketing demos (your-childs-name.com, your-family-photo-album.com) and the DOR Industries corporate landing page (dorindustries.com).

NOT the same product as the Spaceship registrar; this is a separate Spaceship offering.

## Where it's used
- Hosts `your-childs-name.com` (currently the only configured website)
- Will host `dorindustries.com` and `your-family-photo-album.com` (in-progress migration Apr 28)

## Current configuration
- **Plan:** Web Hosting Essential ($3.88/mo billing)
- **Storage:** 0.1 / 20 GB used
- **Domains:** 3 / 5 — `your-childs-name.com`, `dorindustries.com`, `your-family-photo-album.com` (2 free slots)
- **Websites:** 3 (all 3 domains have website folders; YFP folder is empty)
- **Shared IP:** `66.29.148.24` (this is what DNS A records point at)
- **cPanel server hostname:** `server5.shared.spaceship.host:2083`
- **cPanel username:** `wnuazicufx`
- **Home dir:** `/home/wnuazicufx/`
- **Per-domain web roots:** `/home/wnuazicufx/<domain>/`
- **TLS:** included free (auto)
- **Uptime guarantee:** 99.99%
- **Dashboard:** https://www.spaceship.com/application/hosting-manager/
- **File manager:** cPanel File Manager (separate auth via cPanel session)

## File layout per domain

```
/home/wnuazicufx/<domain>/
├── images/         (httpd unix-directory, default subdirectory)
├── index.html      (the actual page served at the apex)
└── ... (any additional assets)
```

## Existing files

### your-childs-name.com/
- `index.html` — 386.92 KB, dated Apr 15 2026 7:06 PM. Title: "Your Child's Name — A Legacy Odyssey Baby Book". Full demo with PASSWORD SCREEN, SIDEBAR NAV, BIRTH STORY, etc. **This is more elaborate than the local copy** at `src/public/your-childs-name-demo.html` (42 KB). Uploaded directly via cPanel.
- `images/` — 4 KB folder

## History
- 2026-04-15 — Plan likely purchased; `your-childs-name.com` attached as primary domain. Rich 386 KB demo HTML uploaded via cPanel.
- (Inactivity until Apr 28 — no website folder created on Spaceship's side; site still served via Railway/Express because DNS pointed there)
- 2026-04-28 — Discovered the plan during Railway slot-cleanup discussion. Created website folder for `your-childs-name.com` (the existing 386 KB index.html was preserved, not overwritten)
- 2026-04-28 — In-progress: adding `dorindustries.com` and `your-family-photo-album.com` to the same plan

## Related
- `domains/your-childs-name.com.md`
- `domains/dorindustries.com.md`
- `domains/your-family-photo-album.com.md`
- `infrastructure/spaceship-registrar.md` — separate product, same vendor
- `infrastructure/railway.md` — currently still serves these 3 domains (until DNS flipped)

## Open issues / quirks
- **Auto-DNS-rewrite on domain attachment:** when you "Connect" a domain to hosting via the wizard, Spaceship may auto-update the DNS records to point at this hosting. This causes a brief window where the domain 404s if the website folder isn't already populated. Workaround: add domain → IMMEDIATELY upload index.html → verify via Spaceship preview URL → confirm DNS is correct. (Verified pattern Apr 28.)
- **"CONFLICTING CONNECTION"** label on domains in the wizard means existing DNS records will be overwritten. Click "Solutions" or proceed knowing DNS is about to change.
- **The existing 386 KB index.html for your-childs-name.com is the canonical demo per user direction — DO NOT overwrite with the local 42 KB version.**
- **The plan supports up to 5 domains.** If we ever exceed that, upgrade to the Pro plan (unlimited domains).
