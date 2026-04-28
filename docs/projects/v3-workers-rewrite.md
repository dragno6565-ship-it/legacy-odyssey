# Project: v3 — Cloudflare Workers + Hono Rewrite

**Status:** Phase 1 complete (Apr 28 2026 late evening). Phase 2 (mobile API) up next.
**Goal:** replace the entire Express-on-Railway custom-domain layer with Cloudflare Workers + Hono, eliminating Approximated subscription and the Railway 20-domain cap permanently.
**Estimated effort:** 4-6 weeks of focused engineering
**Last touched:** 2026-04-28

## Phase 1 — DONE

Live at https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/book/eowynragno (password: `Hunter65!`).

What's working end-to-end on the v3 Worker against production Supabase:
- `resolveFamily` middleware (Host → families row, with subscription gating)
- `requireBookPassword` middleware (HMAC-SHA256 cookie, byte-compatible with v2)
- `GET /` and `GET /book/:slug` → password gate → BookLayout
- `POST /verify-password` → cookie set + redirect
- All 11 book sections rendered: Welcome, BeforeArrived, BirthStory, ComingHome, Months, Family, Firsts, Holidays, Letters, Recipes, Vault
- Sidebar nav with `visibleSections` toggling
- Existing `book.js` (months grid, modals, family detail, vault countdown, lightbox) reused unchanged via same-origin proxy at `/js/book.js` and `/css/book.css` (cross-origin script load from workers.dev was failing in browsers despite valid headers)

Gotchas hit during Phase 1 (so we don't repeat them):
1. Hono JSX HTML-escapes children of `<script>` — `&` in JSON breaks the inline payload. Fix: `<script>{raw(dataScript)}</script>` from `hono/html`. `dangerouslySetInnerHTML` does not work on `<script>` in Hono JSX (drops the content silently).
2. Cross-origin `<script src="https://legacyodyssey.com/js/book.js">` from workers.dev fails (`error` event) even with no CSP/CORP. Fix: same-origin proxy route in the Worker that fetches it via `fetch()` with `cf.cacheTtl`.
3. `index.ts` containing JSX must be `index.tsx` for esbuild-via-wrangler to compile it.

## Why we're doing this

Current architecture (post-Approximated, Apr 27 2026):
- Approximated.app handles per-domain TLS termination (~$0.10-0.20/domain/mo)
- Approximated proxies to Railway via legacy-odyssey-production.up.railway.app
- Railway gates by Host header → every customer domain must be in custom domains list (cap of 20 on Pro)
- At 100 new domains/day target, Approximated cost projects to ~$19,000/mo at 100k customers, plus Railway custom-domain cap is the immediate bottleneck

Workers architecture:
- Cloudflare Workers Custom Domains: unlimited, no cap
- Workers Paid plan: $5/mo + $0.30/M requests
- At 100k customers: ~$30-50/mo total (vs ~$19k/mo on Approximated)
- Apex routing works natively via Workers Custom Domains

## High-level plan (parallel-track approach)

**Track 1 — keep production stable** (current Express + Approximated + Railway path) for the next 4-6 weeks while v3 is built.
**Track 2 — build v3 in parallel** on a separate `v3-workers` git branch. New Cloudflare Worker named `legacy-odyssey-v3`. Doesn't touch production until cutover.

## Phases

### Phase 0 — Setup ✅ COMPLETE (Apr 28 2026 evening)
- ✅ Git branch `v3-workers` on existing repo (commit `99aa475`)
- ✅ `v3/` directory with Hono + Wrangler + TypeScript scaffolding
- ✅ Wrangler authenticated to Cloudflare account `bc2ebc94444d987c7a78809a1d9449cb` via OAuth
- ✅ Worker deployed and live at **https://legacy-odyssey-v3.legacyodysseyapp.workers.dev**
- ✅ workers.dev subdomain `legacyodysseyapp.workers.dev` registered
- ✅ Observability (Workers Logs) enabled
- ✅ Preview URLs enabled (for future branch deploys)
- ⏸ Supabase database branch — deferred to Phase 1 when we actually need it
- ⏸ Stripe test mode — deferred to Phase 3 (Stripe integration phase)

### Phase 1 — Hono app skeleton + auth + book viewer (~5 days)
- Hono app structure (similar shape to current `src/server.js`)
- JWT auth (port from `src/routes/api/auth.js`)
- Family lookup by Host header (`src/middleware/resolveFamily.js`)
- Book viewer routes (`/`, `/coming-home`, etc.)
- Convert EJS book templates to Hono JSX

### Phase 2 — Mobile API parity (~5-7 days)
- Port `/api/auth/*`, `/api/books/*`, `/api/families/*`, `/api/upload`
- Image upload flow: Worker → Supabase Storage (under 30s/5min CPU limit)
- All API responses must match v2.2.0 byte-for-byte

### Phase 3 — Marketing site, /admin, /account, gift flow (~7 days)
- Port marketing site + every public route
- Port `/admin` panel + auth
- Port `/gift`, `/redeem`
- Port `/stripe/webhook` and Stripe checkout flows
- Port domain search + purchase orchestration (Spaceship integration)
- Port email sending (Resend SDK works in Workers via fetch)
- Spaceship async polling: switch to Cloudflare Queues or Durable Objects (current setInterval doesn't work in Workers)

### Phase 4 — Custom domain layer (~5 days)
- Set up Workers Custom Domains for one test domain (lotest1.com — already cancelled, perfect throwaway)
- Confirm apex works (Cloudflare's pattern accepts apex via dnsRecords or hostname registration)
- Refine the migration script

### Phase 5 — Parallel-run validation (~5-7 days)
- Point v3 at real production Supabase (read-only, then read-write)
- Migrate ONE volunteer customer (suggest: owner's own Eowyn family — keep prod still serving as fallback)
- Daily diff: hit each book URL on both v2.2.0 and v3, compare, fix discrepancies
- Performance benchmarks: book pages < 200ms at edge, mobile API < 100ms

### Phase 6 — Cutover (one weekend)
- Friday eve: final v3 → prod data sync, freeze
- Saturday: customer-by-customer DNS flip
  - Each customer's A record from 137.66.1.199 (Approximated) → Cloudflare Workers IP
  - Cert auto-issued by CF
- Throughout: monitor each customer's site live
- Sunday: all customers on v3. Cancel Approximated. Free Railway from custom-domain duty.
- Monday: mobile app hits v3 (no app update needed — same legacyodyssey.com URL)

### Phase 7 — Decommission (~30 days post-cutover)
- Delete Railway custom-domain entries for migrated customers
- Cancel Railway Pro (downgrade to Hobby for marketing site OR kill Railway entirely)
- Cancel Approximated
- Delete `cloudflareService.js`, `approximatedService.js`, old migration scripts

## Cost during build
- Approximated: $20/mo continued
- Railway: existing Pro plan
- Cloudflare Workers Paid: $5/mo for v3 (during dev)
- Supabase database branch: included in Pro plan

**~$30/mo extra during the build.** After cutover, Workers replaces Approximated → savings start month 6 and compound.

## Decisions pending from user

1. **Phase 0 setup tonight or first thing tomorrow?**
2. **Throwaway test customer:** suggesting `lotest1.com` (already cancelled). User to confirm.
3. **Scope confirmation:** plan ports EVERYTHING (mobile API, marketing, admin, account, gift, customer book viewer). Or partial?
4. **kateragno.com apex fix:** verify it's working post-Railway-re-add before kicking off Phase 0.

## Decisions made
- ✅ Approach: parallel-track, v3 branch, separate Worker, cutover when ready
- ✅ User approved building this alongside continuing production maintenance
- ✅ Worker name: `legacy-odyssey-v3`
- ✅ Branch name: `v3-workers`
- ✅ Auth: OAuth via `wrangler login` (not API token — broader Workers scope needed)
- ✅ Stack: Hono 4.6+, TypeScript, Wrangler 3.114+, nodejs_compat flag

## Related
- `infrastructure/cloudflare.md` — already have account, just need Workers Paid plan
- `infrastructure/approximated.md` — what v3 replaces
- `infrastructure/railway.md` — what v3 replaces
- `infrastructure/supabase.md` — stays the same (just add a branch)
- All `domains/*.md` — each one will need DNS reconfigured during Phase 6 cutover
- All `customers/*.md` — each one is a migration target

## Risks
- **Apex routing on Workers** — needs validation in Phase 4. If apex doesn't work cleanly the way Workers Custom Domains advertise, we have an architectural pivot to make.
- **Image upload time** — must fit under 30s (or 5min on Paid). Real-world testing in Phase 2.
- **Spaceship async polling** — current setInterval pattern needs rewrite. Cloudflare Queues or Durable Objects.
- **Mobile app compatibility** — API responses must match exactly. Byte-for-byte testing required.
- **Cutover risk** — high but contained. Rollback is "flip DNS back at Approximated" — same minute.

## Findings discovered during port

- **Apr 28, Phase 1:** `families.book_password` is stored as **plaintext** in the database, not hashed. The Express code reads it raw and HMACs it on the fly during password verification. Not introduced by v3 — same pattern in `src/middleware/requireBookPassword.js`. Worth fixing before scaling: hash on write (bcrypt or argon2id), update the verify path. Track separately from v3.

## Sources for the architectural decision
See SESSIONS.md (Apr 28 entry) for the research that led here, including comparison of Approximated, Cloudflare for SaaS, self-hosted Caddy, and Workers options at 100k+ scale.
