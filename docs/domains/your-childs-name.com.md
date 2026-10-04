# your-childs-name.com

**Status:** active (marketing demo site, NOT a customer)
**Owner:** Legacy Odyssey marketing
**Last touched:** 2026-10-04 (rulings, contents, edit method at the bottom)

## What it is
**Marketing demo of the Legacy Odyssey baby book product.** Anyone visiting this domain sees a fully populated baby book — password gate is bypassed, demo content is shown — so prospective customers can preview the product before purchasing. **NOT a paying customer.** It's a static HTML demo. **Served from Spaceship Web Hosting** (LiteSpeed, 66.29.148.24) — migration off Railway COMPLETED Apr 28. The repo's `src/public/your-childs-name-demo.html` (42 KB) is **NOT** what's live; the live file is the richer 386 KB `index.html` on Spaceship cPanel (see below).

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
- 2026-06-16 — **Resolved the coding-session "demo deploy-source mystery"** (open since May 26): the demo is served from **Spaceship Web Hosting cPanel**, file `/home/wnuazicufx/your-childs-name.com/index.html` (386 KB) — NOT Railway/the repo. So repo edits to `src/views/book/*` or `your-childs-name-demo.html` never reach the live demo. **To refresh the demo (banner overlap, clickable recipes, any banned "CHAPTER" eyebrows) edit that cPanel file via Spaceship hosting file-manager/FTP** (needs Spaceship hosting login). TODO "Demo site" updated to match.
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


## Update 2026-10-04 (archive review)

### Dan's rulings on the demo
- 2026-05-26: no DB-backed demo and no subdomain demo; improve the demo only by editing the static page. (A delegated agent had seeded fake families into prod; fully reverted.) Never invent person names in it.
- 2026-07-01: "I want to keep the demo static, but I also want it updated." Do not point it back at the app.
- 2026-07-01: video in the demo = example photos made to look like video (poster cards with play badges), not real video; 3 custom galleries.
- Any demo must show the child's OWN .com, never name.legacyodyssey.com (2026-06-23).
- Edit only what Dan names; do not sweep existing "forever" or "Chapter" eyebrows in the demo (2026-05-26 "DON'T FIX THAT").

### What the live demo contains (after the 2026-07-01 edit)
Single "Open the Book" button with "live demo, no password needed" text; sections incl. Keepsakes, Custom Galleries (Grandparents & Cuddles, Everyday Little Moments, Parties & Holidays) and Video Moments (6 poster cards); an EN/ES/HI sidebar toggle that translates nav labels only; nav in product order. Recipe and keepsake images are hot-linked Unsplash stock (should be self-hosted). File size about 355 to 363 KB. Nav items are JS click handlers (no hrefs). Re-check before using demo screenshots in posts (as of 2026-06-04 it had no video, galleries, Journey to Us or Keepsakes).

### How to edit the live file (worked 2026-05-20 and 2026-07-01)
Dan must log in to Spaceship himself.
- Method A (UI): Spaceship Launchpad > Hosting Manager > File Manager > select `index.html` > Edit (encoding dialog) > Ace editor. Edit with `javascript_tool` via `ace.edit(...)` replace calls, sync to the form textarea, click `#sform_submit` ("Save Changes"). Live instantly; verify with curl.
- Method B (cPanel UAPI from the logged-in cPanel tab, using the cpsess token in the URL): `Fileman/get_file_content` (read), `Fileman/save_file_content` (write), `Fileman/upload_files` (images via FormData from CDN blobs). Fetching the live page from the cPanel tab hits CORS, so read via UAPI. A 900 KB image failed in a 5-file batch: retry alone at lower quality. Images live in `/home/wnuazicufx/your-childs-name.com/images/`. Verify by hashing downloads (two different Unsplash IDs were byte-identical once).
- The Chrome file_upload tool refuses scratchpad and project folders, so re-uploading a whole file does not work.
- Check the browser console after every change: removing `#pwInput` once threw on null and halted the script that builds the Month by Month cards. Keep `<input type="hidden" id="pwInput">`.

### Stale statement corrected
`docs/customers/your-childs-name-demo-context.md` says Express middleware serves a 42 KB file "currently". That is wrong since 2026-04-28: the live demo is the cPanel `index.html` above.
