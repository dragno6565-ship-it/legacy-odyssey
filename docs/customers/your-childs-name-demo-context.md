# Your Child's Name (demo context — no DB record)

**Status:** active demo (NO families table record)
**Last touched:** 2026-04-28

## What it is
Marketing demo of the baby book product. **No corresponding row in the `families` table** — it's purely a static HTML file served by Express middleware (or by Spaceship hosting after migration).

This is sibling to "Your Family" (which DOES have a families row, for the photo album product) but architected differently: this one is purely static-content, no SaaS plumbing.

## How it's served
- Express middleware (currently): when Host header is `your-childs-name.com`, serves `src/public/your-childs-name-demo.html` (42 KB)
- Spaceship hosting (target post-migration): serves `index.html` directly from cPanel website folder (386 KB version)

## Related
- `domains/your-childs-name.com.md` — the domain + migration plan
- `customers/your-family-demo.md` — sibling demo (has DB record)
- `infrastructure/spaceship-hosting.md` — target host

## Open issues / quirks
- **No families row** — don't try to look it up in admin or expect a customer record
- **Pure static demo** — simplest of the demo entities
