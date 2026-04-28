# Your Family (placeholder demo family record)

**Status:** active demo record (NOT a real customer)
**Subscription:** N/A (placeholder)
**Last touched:** 2026-04-28

## What it is
The "Your Family" record in the families table — placeholder/demo family used to populate the demo at `your-family-photo-album.com` (the future "family photo album" SKU). NOT a paying customer. Email is a sample address (`sample@your-family-photo-album.com`).

This entity exists in the families table for two reasons:
1. The demo at `your-family-photo-album.com` needs a families row to "exist" for the routing layer
2. Acts as a placeholder for the future product launch when a real "family album" SKU goes live

## Family record
- **Email:** `sample@your-family-photo-album.com`
- **Custom domain:** `your-family-photo-album.com`
- **Status:** ACTIVE (so the demo is reachable)
- **Family name in admin:** "Your Family"

## Related
- `domains/your-family-photo-album.com.md` — the demo domain
- `customers/your-childs-name-demo-context.md` — sibling demo (note: that domain has NO families row, only a static HTML file. This one has both a static file AND a families row.)

## Open issues / quirks
- **Don't archive or modify** this family record without updating the demo
- **NOT a real customer** — never include in revenue counts or active-customer counts
- **In admin panel** it appears in the "active" list (status=ACTIVE) which inflates the count. Worth filtering it out of the production "active customer" stat eventually.
