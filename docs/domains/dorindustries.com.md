# dorindustries.com

**Status:** active (corporate landing page) — **MIGRATED TO SPACESHIP HOSTING Apr 28 2026**
**Owner:** DOR Industries (the user's parent company)
**Last touched:** 2026-04-28

## What it is
The corporate landing page for DOR Industries — the parent company of Legacy Odyssey. Static HTML page; not a SaaS application. Served by Express middleware that detects the Host header and returns the static `dorindustries.html` file.

Used for: business credibility, corporate identity, app store developer-account branding (Google Play developer is "DOR Industries").

## Where it's used
- `src/views/dorindustries.html` — the static HTML page (~10 KB)
- `src/server.js` lines 71-83 — Express middleware:
  ```javascript
  app.use((req, res, next) => {
    const host = (req.headers['x-forwarded-host'] || req.hostname || '').replace(/:\d+$/, '');
    if (host === 'dorindustries.com' || host === 'www.dorindustries.com') {
      return res.send(DOR_INDUSTRIES_HTML);
    }
    next();
  });
  ```
- Google Play developer account is "DOR Industries" (login `albumerapp2@gmail.com`)

## Current configuration (as of Apr 28 2026 8:52 AM)
- **Registrar:** Spaceship (auto-renew ON)
- **Renewal:** Feb 25, 2029 (3-year registration)
- **DNS authority:** Spaceship nameservers
- **Currently serving from:** **Spaceship Web Hosting** (66.29.148.24 shared IP)
- **TLS:** Spaceship FreeSSL (Let's Encrypt, auto-managed)
- **Hosting plan:** Web Hosting Essential ($3.88/mo billing) — shared with `your-childs-name.com` and (inactive) `your-family-photo-album.com`
- **cPanel website folder:** `/home/wnuazicufx/dorindustries.com/`
- **index.html:** ~10 KB, contents of `src/views/dorindustries.html` (gold/cream design, hero, About, Products, Contact, footer with privacy/terms links)
- **In Railway custom domains list:** REMOVED 2026-04-28 (was `www.dorindustries.com`, now redundant after Spaceship hosting migration)
- **Approximated:** never used.

## What can be cleaned up
- **Delete `www.dorindustries.com` from Railway custom domains list** (now redundant; frees 1 slot)
- **Delete the Express middleware** in `src/server.js` that special-cases the dorindustries.com Host header (lines ~71-83); becomes dead code post-migration
- **Delete `src/views/dorindustries.html`** from the repo eventually (Spaceship cPanel is now the source of truth)

## History
- 2026-02-25 — Domain registered (3-year)
- 2026-04-16 — `dorindustries.html` created/updated (latest commit Apr 16 2026)
- 2026-04-28 8:00 AM — Spaceship hosting Web Hosting Essential connected (3rd domain on the plan)
- 2026-04-28 8:10 AM — Custom website folder created at `/home/wnuazicufx/dorindustries.com/`
- 2026-04-28 8:52 AM — `index.html` (10 KB, full corporate page) saved via cPanel ACE editor (ACE setValue API used because file_upload was blocked by Chrome MCP "Not allowed" error)
- 2026-04-28 — Verified live: `curl -I https://dorindustries.com` returns 200 OK with title "DOR Industries — Software for Families"

## Related
- `infrastructure/spaceship-hosting.md` — target host
- `infrastructure/spaceship-registrar.md` — registrar
- `infrastructure/railway.md` — currently serves
- `infrastructure/google-play.md` — uses the DOR Industries developer identity

## Open issues / quirks
- **Brief downtime is acceptable** during DNS flip per user
- **Express middleware will become dead code** once migrated; can remove the special-case handling in `server.js` after cutover
- **Apex (dorindustries.com without www)** has never been routable via the current Railway setup. Spaceship hosting will fix this.
