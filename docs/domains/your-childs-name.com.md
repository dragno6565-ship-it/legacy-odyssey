# your-childs-name.com

**Status:** active (marketing demo site, NOT a customer)
**Owner:** Legacy Odyssey marketing
**Last touched:** 2026-04-28

## What it is
**Marketing demo of the Legacy Odyssey baby book product.** Anyone visiting this domain sees a fully populated baby book — password gate is bypassed, demo content is shown — so prospective customers can preview the product before purchasing. **NOT a paying customer.** It's a static HTML demo served either from Express middleware (currently) or Spaceship hosting (target state as of Apr 28).

This is one of TWO marketing demo domains; the sibling is `your-family-photo-album.com` (demo for the future family photo album product).

## Where it's used
- `src/routes/book.js` — listed in `DEMO_BOOK_DOMAINS = ['your-childs-name.com', 'your-family-photo-album.com']` and `DEMO_SITES['your-childs-name.com'] = 'your-childs-name-demo.html'`
- `src/middleware/requireBookPassword.js` — bypasses password protection for demo domains
- `src/public/your-childs-name-demo.html` — local 42 KB version of the demo HTML
- `src/views/marketing/landing.ejs` — landing page links to demo
- `src/views/marketing/redeem.ejs` — redeem flow links to demo
- `src/views/marketing/blog-what-to-write-in-baby-book.ejs` — blog post links to demo
- `ads/app_comparison.py`, `ads/generate_ads_v3.py`, `ads/generate_ads_v4.py` — ad copy generation references
- `HANDOFF.md` — historical doc references

## Current configuration (as of Apr 28 2026 evening)
- **Registrar:** Spaceship (auto-renew ON)
- **DNS authority:** Spaceship nameservers (launch1/2.spaceship.net)
- **Currently serving from:** **Spaceship Web Hosting** (LiteSpeed at 66.29.148.24)
- **DNS records:**
  - A `@` → 66.29.148.24 (locked product group)
  - A `ftp`, `webdisk` → 66.29.148.24 (Spaceship infrastructure)
  - CNAME `www` → `your-childs-name.com`
  - TXT `@` (SPF), TXT `tbolt` (Spaceship verification)
- **Railway custom domain:** REMOVED 2026-04-28 (was `www.your-childs-name.com`)
- **Spaceship hosting:** custom website folder + 386 KB demo HTML serving as `index.html`

## Migration COMPLETE (Apr 28 2026)
1. ✅ Spaceship hosting plan attached
2. ✅ Custom website folder created
3. ✅ 386 KB index.html in place (uploaded earlier to cPanel)
4. ✅ DNS auto-flipped to Spaceship hosting IP (66.29.148.24) when domain attached
5. ✅ Verified: `Server: LiteSpeed`, title "Your Child's Name — A Legacy Odyssey Baby Book"
6. ✅ Removed `www.your-childs-name.com` from Railway custom domains list

## Two versions of the demo HTML

| Location | Size | Notes |
|---|---|---|
| Spaceship cPanel `/home/wnuazicufx/your-childs-name.com/index.html` | 386.92 KB | Apr 15 2026 7:06 PM. **More polished, more demo content.** Canonical per user direction. |
| Local repo `src/public/your-childs-name-demo.html` | 42 KB | Apr 15 2026 6:04 PM. What Express serves currently. |

**DO NOT overwrite the Spaceship version** — user's preferred canonical.

## History
- 2026-04-15 — Local demo HTML created, committed to repo. Express middleware added. Marketing copy updated.
- 2026-04-15 (later same day) — Richer 386 KB version uploaded directly to Spaceship cPanel
- 2026-04-28 — Spaceship hosting custom website folder created. Migration off Railway in progress.

## Related
- `domains/your-family-photo-album.com.md` — sibling demo domain
- `infrastructure/spaceship-hosting.md` — new home for the static demo
- `infrastructure/spaceship-registrar.md` — domain registrar + DNS authority
- `infrastructure/railway.md` — currently still serving (until DNS flipped)

## Open issues / quirks
- **Two versions of the demo file exist** (Spaceship cPanel 386 KB vs local 42 KB) — user wants the Spaceship version preserved
- **High-traffic marketing surface** — site MUST stay up during migration. Verify Spaceship serves correctly before flipping DNS.
- **I (Claude) FAILED to know what this was on first encounter Apr 28**, treating it as an unknown placeholder. The information was in the codebase. This file exists so that doesn't happen again.
