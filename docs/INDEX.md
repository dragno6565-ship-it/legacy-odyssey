# Legacy Odyssey — Knowledge Base Index

**This is the entry point.** Read this file at session start. Then `cat docs/<category>/<entity>.md` BEFORE answering any question that mentions a specific entity.

Last regenerated: 2026-04-28

---

## How to use this file

When the user mentions a name, find it below. Open the linked file. Read it. THEN respond.

When you create/touch any entity not yet listed: write its file from the standard template AND add a line here.

---

## Domains we own and operate

### Legacy Odyssey core
- [domains/legacyodyssey.com.md](domains/legacyodyssey.com.md) — Marketing site, mobile API, admin, account portal, Stripe webhook. Cloudflare-fronted. Wildcard `*.legacyodyssey.com` covers subdomain books.
- [domains/your-childs-name.com.md](domains/your-childs-name.com.md) — **Marketing demo** for the baby book product. NOT a customer. Static HTML; migrating to Spaceship hosting Apr 28.
- [domains/your-family-photo-album.com.md](domains/your-family-photo-album.com.md) — **Marketing demo** for the future Family Photo Album SKU. Has a placeholder families row in the DB.
- [domains/dorindustries.com.md](domains/dorindustries.com.md) — DOR Industries corporate landing page (the user's parent company). Static HTML; migrating to Spaceship hosting Apr 28.

### Active paying-customer domains
- [domains/eowynhoperagno.com.md](domains/eowynhoperagno.com.md) — **owner's own daughter's site** (dogfood). Eowyn Hope Ragno.
- [domains/kateragno.com.md](domains/kateragno.com.md) — owner's niece Kate. Active subscription, content not yet populated.
- [domains/roypatrickthompson.com.md](domains/roypatrickthompson.com.md) — Julia Ragno's family. **First customer migrated to Approximated** (Apr 27). Only customer on Cloudflare nameservers.
- [domains/emmacherry.com.md](domains/emmacherry.com.md) — Lindsey Cherry's family (daughter Emma).
- [domains/reesetatler.com.md](domains/reesetatler.com.md) — Ashlee Tatler's family (Reese).
- [domains/lachlanstoneleister.com.md](domains/lachlanstoneleister.com.md) — Alexis Lynn Stone's family (Lachlan Stone-Leister).
- [domains/jeffpresutti.com.md](domains/jeffpresutti.com.md) — Kayle Brown / Jeff Presutti family.

### Test, dormant, defensive
- [domains/test-and-dormant.md](domains/test-and-dormant.md) — `legacyodysseytest5.com`, `legacyodysseytest6.com` (failed gift tests, lapsing), `lotest1.com` (cancelled annual test, candidate for v3 migration testing).
- [domains/non-legacy-odyssey-personal-domains.md](domains/non-legacy-odyssey-personal-domains.md) — User's other 11 domains in Spaceship (albumer.com, athleticjourney.com, housetuners.com, jeanineragno.com, legacyodyssy.com, phoenixvalleyappraiser.com, phoenixvalleyappraisers.com, pvappraise.com, ragno55.com, warriorpit.com). NOT Legacy Odyssey related.

---

## Customers / family records

### Real customers (paying)
- [customers/eowyn-ragno-owner.md](customers/eowyn-ragno-owner.md) — owner's own family (dogfood). Email `dragno65@hotmail.com`. Family ID `fb16691d-...`.
- [customers/kate-ragno-niece.md](customers/kate-ragno-niece.md) — owner's niece. Signed up Mar 29 2026. Site live, content minimal.
- [customers/roy-patrick-thompson.md](customers/roy-patrick-thompson.md) — Julia Ragno's family.
- [customers/emma-cherry.md](customers/emma-cherry.md) — Lindsey Cherry's family.
- [customers/reese-tatler.md](customers/reese-tatler.md) — Ashlee Tatler's family.
- [customers/lachlan-stone-leister.md](customers/lachlan-stone-leister.md) — Alexis Lynn Stone's family.
- [customers/jeff-presutti.md](customers/jeff-presutti.md) — Kayle Brown / Jeff Presutti family.

### Demo / test accounts
- [customers/apple-review-demo.md](customers/apple-review-demo.md) — `review@legacyodyssey.com` for Apple App Store review. Password `TestPass-2026!`.
- [customers/your-family-demo.md](customers/your-family-demo.md) — placeholder families row for `your-family-photo-album.com` demo. NOT a real customer.
- [customers/your-childs-name-demo-context.md](customers/your-childs-name-demo-context.md) — context for the static demo at `your-childs-name.com`. No families row.

---

## Infrastructure (vendors and services)

### Customer-domain layer
- [infrastructure/approximated.md](infrastructure/approximated.md) — TLS termination + proxy. Cluster IP `137.66.1.199`. $20/mo plan, $0.20/hostname/mo with volume discount.
- [infrastructure/cloudflare.md](infrastructure/cloudflare.md) — DNS authority for `legacyodyssey.com` zone, R2 backup. Cloudflare for SaaS subscription is unused (cancel).
- [infrastructure/railway.md](infrastructure/railway.md) — Express server hosting. **20-domain cap** is the scaling block.
- [infrastructure/spaceship-registrar.md](infrastructure/spaceship-registrar.md) — Domain registrar + DNS for ~all customer domains. Below-wholesale at $9.98/yr renewal.
- [infrastructure/spaceship-hosting.md](infrastructure/spaceship-hosting.md) — Web Hosting Essential plan (separate Spaceship product). Hosts demo sites (your-childs-name.com is there; dorindustries.com + your-family-photo-album.com migrating).

### Database / storage / payments / email
- [infrastructure/supabase.md](infrastructure/supabase.md) — Postgres + Storage + Auth. Pro plan ($25/mo). Project ref `vesaydfwwdbbajydbzmq`.
- [infrastructure/stripe.md](infrastructure/stripe.md) — Live mode payments. Account `acct_1T3N7kJk2GIrL5uS`.
- [infrastructure/resend.md](infrastructure/resend.md) — Outbound transactional email. Sender domain verified.
- [infrastructure/spacemail.md](infrastructure/spacemail.md) — Inbound mail at `@legacyodyssey.com`. Mailboxes exist; per-mailbox forwarding to gmail not yet set up.

### Mobile + app stores
- [infrastructure/expo-eas.md](infrastructure/expo-eas.md) — Mobile build pipeline. Account `dragno65`. EAS project ID `14daf713-...`.
- [infrastructure/apple-app-store.md](infrastructure/apple-app-store.md) — iOS distribution. App ID `6760883565`. v1.0.6 in review.
- [infrastructure/google-play.md](infrastructure/google-play.md) — Android distribution. Developer "DOR Industries". v1.0.6 submitted.

---

## Active projects

- [projects/v3-workers-rewrite.md](projects/v3-workers-rewrite.md) — Cloudflare Workers + Hono rewrite. 4-6 weeks. Replaces Approximated + Railway custom-domain layer. **Approved by user Apr 28 2026.**

---

## Cross-references (when X is mentioned, also read Y)

- "kateragno.com" or "Kate" → also read `customers/kate-ragno-niece.md`
- "Eowyn" or "owner's family" → `customers/eowyn-ragno-owner.md`
- "demo site" → both `domains/your-childs-name.com.md` and `domains/your-family-photo-album.com.md`
- "the cap" or "Railway domain limit" → `infrastructure/railway.md`
- "v3" or "the rewrite" → `projects/v3-workers-rewrite.md`
- "the new TLS thing" → `infrastructure/approximated.md`
- Any registrar question → `infrastructure/spaceship-registrar.md`
- Any hosting-on-Spaceship question → `infrastructure/spaceship-hosting.md` (DIFFERENT product from registrar)
- Any "what's at <domain>" question → `domains/<domain>.md` first, always

---

## Quick stats (Apr 28 2026)

- **9 active customers** (paying), 7 with custom domains, 2 are owner's own (Eowyn) + Apple review demo
- **3 demo entities** (your-childs-name, your-family-photo-album, your-family demo families row)
- **20 Railway custom domains** (cap), 19 used + 1 free
- **8 Approximated vhosts** (4 customers × apex + www, technically 16 but counting customer-domains as 8)
- **12 vendors** documented above
- **1 active project** (v3 rewrite)
