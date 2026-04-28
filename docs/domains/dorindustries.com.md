# dorindustries.com

**Status:** active (corporate landing page)
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

## Current configuration (as of Apr 28 2026)
- **Registrar:** Spaceship (auto-renew ON)
- **Renewal:** Feb 25, 2029 (3-year registration)
- **DNS authority:** Spaceship nameservers
- **Currently serving from:** Railway → Express middleware
- **In Railway custom domains list:** `www.dorindustries.com` (apex routing not configured — no apex Railway entry)
- **Approximated:** NOT in Approximated. Routing happens at Railway directly via Express middleware.

## Migration plan (Apr 28 2026)
User direction: "Can we move dorindustries.com to our Spaceship hosting?"
Action: add `dorindustries.com` as a 2nd domain to the existing Spaceship Web Hosting Essential plan, upload `dorindustries.html` as `index.html`, switch DNS, remove from Railway.

User accepts brief downtime: "I don't mind if dorindustries.com goes 'down' for a short time."

## History
- 2026-02-25 — Domain registered (3-year)
- 2026-04-16 — `dorindustries.html` created/updated (latest commit Apr 16 2026)
- 2026-04-28 — Migration to Spaceship hosting in progress

## Related
- `infrastructure/spaceship-hosting.md` — target host
- `infrastructure/spaceship-registrar.md` — registrar
- `infrastructure/railway.md` — currently serves
- `infrastructure/google-play.md` — uses the DOR Industries developer identity

## Open issues / quirks
- **Brief downtime is acceptable** during DNS flip per user
- **Express middleware will become dead code** once migrated; can remove the special-case handling in `server.js` after cutover
- **Apex (dorindustries.com without www)** has never been routable via the current Railway setup. Spaceship hosting will fix this.
