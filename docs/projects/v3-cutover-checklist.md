# v3 Cutover Checklist

> **Read this before flipping any DNS or webhook settings.** Each section is independent — you can do them on separate days.

**Last touched:** 2026-04-28
**Worker URL:** https://legacy-odyssey-v3.legacyodysseyapp.workers.dev
**Status dashboard:** https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/v3-status

---

## What "cutover" means here

Three independent surfaces can be moved from Express → v3 separately:

| Surface | What flipping it does | Risk if wrong | Reversible? |
|---|---|---|---|
| **Mobile app `BASE_URL`** | App points at v3 instead of `legacyodyssey.com` | Existing app installs get 5xx until they update | Yes — ship a new build with the old URL |
| **Stripe webhook destination** | Stripe sends events to v3 instead of Express | New paid signups would fail to provision | Yes — re-add Express endpoint in Stripe dashboard |
| **DNS for `legacyodyssey.com`** | Marketing site + book viewer served from v3 | Marketing/branding pages 5xx; existing customer domains keep working through Approximated → still hits Express → unaffected | Yes — flip DNS back to Railway |

You don't have to do all three at once. **Recommended order:** mobile → webhook → DNS.

---

## Pre-cutover sanity checks (do these first, every time)

```bash
# 1. All 9 secrets present + upstreams reachable
curl -s https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/v3-status | jq

# 2. Public book viewer renders for an existing customer
curl -sI https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/book/eowynragno
# expect 200 with text/html

# 3. Mobile API auth round-trip
TOKEN=$(curl -s -X POST -H 'content-type: application/json' \
  -d '{"email":"review@legacyodyssey.com","password":"TestPass-2026!"}' \
  https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/api/auth/login \
  | jq -r '.session.access_token')
curl -s -H "Authorization: Bearer $TOKEN" \
  https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/api/books/mine | jq .id
# expect a UUID

# 4. Marketing proxy — landing page through Worker
curl -sI https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/
# expect 200, x-v3-marketing-proxy header

# 5. Cron is registered
npx wrangler deployments list --config v3/wrangler.toml | head
# expect "schedule: * * * * *"
```

If anything in 1–5 fails, **don't cut over.** Fix it first.

---

## Cutover step 1 — Mobile app BASE_URL

**Effect:** New mobile app builds talk to v3 for every API call. Old builds (already installed on customer phones) keep talking to Express.

1. Edit `mobile/src/api/client.js`:
   ```js
   const BASE_URL =
     process.env.EXPO_PUBLIC_API_URL ||
     process.env.API_URL ||
     'https://legacy-odyssey-v3.legacyodysseyapp.workers.dev';  // ← was 'https://legacyodyssey.com'
   ```
2. Bump version in `mobile/app.json` (`expoConfig.version` + `ios.buildNumber` if not auto + `android.versionCode`).
3. EAS submit for both stores. Wait for review (24–48 h).
4. Once **both** stores have approved + released, the app's existing JWTs continue to work (same Supabase project; v3 uses anon + service role keys for the same project).
5. Keep an eye on the Worker dashboard for errors during the first week.

**Rollback:** ship a new build with the old `BASE_URL`. Both v3 and Express use the same Supabase, so customer data is identical.

---

## Cutover step 2 — Stripe webhook destination

**Effect:** New checkout completions, subscription updates, refunds, and invoice events route to v3 instead of Express.

1. Stripe dashboard → Developers → Webhooks.
2. **Add a new endpoint** (don't replace yet): `https://legacy-odyssey-v3.legacyodysseyapp.workers.dev/stripe/webhook`
3. Subscribe to the same event types Express has:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Webhook signing secret** must match `STRIPE_WEBHOOK_SECRET` on the Worker. If Stripe generates a new one for the new endpoint, sync it:
   ```bash
   echo "<new whsec_… value>" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --config v3/wrangler.toml
   ```
5. Run **both** endpoints in parallel for 7 days. They're idempotent — handleCheckoutComplete uses findByEmail + reinstate logic, additional_site uses metadata to upsert. Duplicate handling is safe.
6. After 7 quiet days (no `[webhook] error` logs from v3, no support tickets about missing welcome emails or unprovisioned domains), **disable** the Express webhook endpoint in the Stripe dashboard. Don't delete it — keep it disabled for 30 days as an emergency rollback option.

**Watch for:** the v3 webhook enqueues domain orders to the cron pipeline; the Express webhook does it inline. During the parallel-run window, **only one of the two** should be enqueueing per checkout, otherwise the customer's domain would be registered twice (Spaceship would 422 the second registration but cron would mark the order failed). Ensure step 2's "add new endpoint" config sends events to v3, and Stripe stops sending duplicates to Express by default — confirm in the Stripe dashboard that each endpoint shows its own event delivery count post-cutover.

**Rollback:** re-enable the Express endpoint, disable v3's. Customers don't see anything.

---

## Cutover step 3 — DNS for `legacyodyssey.com`

**Effect:** The marketing site (landing, /pricing, /gift, /privacy, /blog, /account, /admin) is served by v3. Most pages still proxy back to Railway underneath, but visitors hit v3's TLS + edge cache.

**Important:** Customer custom domains (`kateragno.com`, etc.) keep using Approximated → Railway. They're unaffected by this DNS change. Only the apex `legacyodyssey.com` zone moves.

1. Cloudflare dashboard → `legacyodyssey.com` zone → DNS:
   - Find the existing A/CNAME for `@` and `www`. They probably point at Railway via Cloudflare for SaaS.
   - Replace with a Worker custom domain pointing at the v3 Worker:
     - In Cloudflare → Workers → `legacy-odyssey-v3` → Triggers → Custom Domains → Add `legacyodyssey.com` and `www.legacyodyssey.com`.
   - Cloudflare auto-provisions the cert and routes apex traffic to the Worker.
2. **Verify the proxy upstream is Railway, not legacyodyssey.com** — important to avoid a self-loop:
   ```
   v3/src/routes/marketing.ts: const PROD = 'https://legacy-odyssey-production.up.railway.app';
   v3/src/index.tsx GET /:    fetch('https://legacy-odyssey-production.up.railway.app/', ...)
   ```
   This is already correct as of the Apr 28 commit but **double-check before flipping DNS**.
3. Watch the Worker analytics dashboard for the first hour. Any spike in 5xx → roll back DNS.
4. After 48 quiet hours, **decommission the Cloudflare for SaaS subscription** (~$7/mo savings). Customer domains use Approximated, not CF for SaaS.

**Rollback:** in the Worker custom-domain panel, remove the `legacyodyssey.com` and `www.legacyodyssey.com` entries. Cloudflare reverts apex DNS to whatever was there before. Propagation < 1 min.

---

## Step 4 — Optional: native ports replacing the marketing proxy

The proxy works indefinitely as long as Express keeps running. To fully decommission Railway, port each of these to native JSX in v3:

- `/` (landing) — 973-line EJS, biggest single page
- `/gift`, `/gift/success`
- `/redeem`, `/set-password`, `/signup`
- `/stripe/success`, `/additional-site/success`
- `/privacy`, `/terms`, `/blog/*`
- `/account/*` (40+ web-form routes — mirror of the mobile editor)
- `/admin/*` (operator panel)

Once each is ported natively, remove its proxy entry from `routes/marketing.ts`.

When ALL pages are native, you can shut down the Railway service and recover the monthly cost. Until then, the proxy is the bridge.

---

## Post-cutover: removing the zombie Railway service

There's still a stale Railway deployment at `legacy-odyssey-production-a9d1.up.railway.app` (CLAUDE.md). It's been around since the original Pro/Hobby project split. Once **all three cutover steps** are complete and you've gone 30 days without rolling anything back, delete that service to free its custom-domain slot.

The CANONICAL Railway service (`legacy-odyssey-production.up.railway.app`, project `27622203`) is the proxy upstream — keep it running until step 4 is fully done.

---

## Common pitfalls (caught during build)

1. **`SESSION_SECRET` mismatch** would invalidate every existing book-password cookie. v3's was synced to Railway's value on Apr 28 — verify in `/v3-status`:
   ```
   "SESSION_SECRET": { "present": true, "len": 35, "prefix": "legacy" }
   ```
   If the prefix shows `dev-se` again, sync it:
   ```bash
   # Pull from Railway and re-upload
   RAILWAY_TOKEN=… # from local .env
   curl -s -X POST https://backboard.railway.app/graphql/v2 \
     -H "Authorization: Bearer $RAILWAY_TOKEN" \
     -d '{"query":"...","variables":{...}}' \
     | jq -r '.data.variables.SESSION_SECRET' \
     | npx wrangler secret put SESSION_SECRET --config v3/wrangler.toml
   ```

2. **Marketing proxy upstream pointing at `legacyodyssey.com`** is a footgun — at DNS cutover the apex points at the Worker → infinite self-proxy → 524 timeouts. Always proxy from `legacy-odyssey-production.up.railway.app` directly.

3. **Cron interval is 1 minute.** A fresh paid customer with a custom domain reaches `domain_orders.status=active` in 2–4 cron ticks (Spaceship registration usually completes in 30–90s, then vhost + DNS in one tick each). If you see orders stuck in `registering` for >10 minutes, check the Spaceship dashboard for a failed/manual operation.

4. **Stripe webhook double-billing.** During the parallel-run window in step 2, ensure each Stripe event has exactly one delivery — the dashboard shows per-endpoint counts. If Stripe sends to both, both will run handleCheckoutComplete; the family-creation path is idempotent on email but the domain order would be enqueued twice.

5. **Cookie compat across cutover.** v3 uses Web Crypto HMAC; Express uses Node's crypto. Same algorithm (HMAC-SHA256), same input (`${familyId}:${password.toLowerCase()}`), same secret (now synced) — so byte-identical output. Existing customer cookies validate on either side during the transition.
