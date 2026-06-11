# Subscriptions & Recurring Costs

> Every vendor that bills us, what it's for, what plan, what it costs,
> when it renews, and the keep/cancel/right-size call. Update IN THE SAME
> RESPONSE you change a plan, add a vendor, or cancel anything.
>
> All figures are USD. "VERIFY" = needs Dan to confirm with an invoice/bill.

Last updated: 2026-06-04

---

## Monthly burn — rough estimate

| Bucket | Estimated $/mo | Confidence |
|---|---|---|
| Infrastructure (Railway, Supabase, Approximated, Cloudflare, Resend) | ~$80 | medium |
| Domains (Spaceship — registrar + hosting + customer COGS) | varies w/ customer count | low — see notes |
| Mobile / app stores (Apple, Google, Expo/EAS) | ~$15 amortized | medium |
| Analytics / monitoring (Sentry, Hotjar, GA, Meta Pixel, Pinterest) | $0–25 | low — depends on tier |
| Marketing (Meta ads) | ~$1,500/mo at $50/day | high (was on as of May 6) |
| Compliance / legal / books (none yet) | $0 | high |
| **Subtotal fixed (non-marketing):** | **~$95–120/mo** | |
| **With marketing on:** | **~$1,600/mo** | |

VERIFY all line items against a real bank/credit-card statement before
trusting this total.

---

## Core infrastructure

| Vendor | Plan | $/mo | Renews | Account | Purpose | Call |
|---|---|---|---|---|---|---|
| **Railway** | Pro | $20 base + usage (~$10–30) | monthly | linked to GitHub `dragno6565-ship-it` | App hosting (Express server) | KEEP — but cap usage; the 20-domain limit is the scaling block (engineering work in TODO to free slots) |
| **Supabase** | Pro | $25 | monthly | `dragno6565@gmail.com`'s Org | DB + Storage + Auth | KEEP — required, no cheaper option at this stage |
| **Cloudflare** | Free zone for `legacyodyssey.com` | $0 | n/a | VERIFY | DNS + (was) for-SaaS proxy | KEEP zone only |
| **Cloudflare for SaaS** add-on | ~$7 (per CLAUDE.md) | monthly | VERIFY | same | Unused since Approximated migration (Apr 27 2026) | **CANCEL** — TODO item, $84/yr saved |
| **Cloudflare Stream** | usage-based | $0 baseline + $5/1k min storage + $1/1k min delivery | monthly | enabled May 2026 for Video Moments | Customer video uploads | KEEP — required for the Video Moments feature shipped in 1.0.15/16/17 |
| **Cloudflare R2** | usage-based | very low | monthly | photo storage backup | photo backup | VERIFY usage + cost |
| **Approximated** | $20 plan | $20 | monthly | "Legacy Odyssey" cluster | TLS termination + Host-header proxy for customer domains | KEEP — replaces CF-for-SaaS, supports up to 250 hostnames @ this plan |
| **Resend** | Free or Pro? | $0 or $20 | VERIFY | sender domain verified | Transactional + drip emails | VERIFY tier; free tier is 3k emails/mo |
| **Sentry** | Free or paid? | VERIFY | VERIFY | integrated in `server.js` | Error tracking | VERIFY; free tier likely sufficient |

---

## Domains & registrar

| Vendor | Plan | $/mo | Renews | Account | Purpose | Call |
|---|---|---|---|---|---|---|
| **Spaceship — registrar** | per-domain | ~$10/yr per .com | rolling | wallet funded $50, Visa ending 6181, auto-renew on | Customer + owner domains | KEEP — below-wholesale renewal pricing |
| **Spaceship — Web Hosting Essential** | one plan | VERIFY ($3–5/mo typical) | VERIFY | server5.shared.spaceship.host | Hosts `your-childs-name.com` demo (+ planned others) | KEEP IF cheaper than alternative; verify whether it's $/mo or $/yr |
| **Spacemail** (Spaceship email) | per-mailbox | VERIFY | VERIFY | mailboxes at @legacyodyssey.com | Inbound mail | VERIFY active mailboxes + cost; TODO says forwarding not yet wired (Resend `replyTo: gmail` is the workaround) |

**Customer-domain COGS:** every paying customer = ~$10/yr Spaceship renewal we
absorb. At 7 paying external customers ≈ $70/yr right now. Track this against
revenue per customer ($29 first year → $49.99/yr renewal). Healthy margin.

**Orphan/test domains** (already disabled per CLAUDE.md):
- `legacyodysseytest5.com`, `legacyodysseytest6.com` — auto-renew OFF; lapse on
  their own next year.
- `lotest1.com` — cancelled, auto-renew off.

---

## Mobile / app stores

| Vendor | Plan | $/yr | Renews | Account | Purpose | Call |
|---|---|---|---|---|---|---|
| **Apple Developer Program** | Individual or Org | $99/yr | annual — **VERIFY DATE** | `dragno6565@gmail.com` / Team `Y3J2B5YA4N` | iOS distribution | KEEP — required. **DO NOT let lapse** — apps get pulled. Add to CALENDAR. |
| **Google Play Developer** | one-time | $25 (paid once) | — | `albumerapp2@gmail.com` | Android distribution | KEEP — required |
| **Expo / EAS** | Production? Free? | VERIFY | monthly | account `dragno65` | Mobile build pipeline | VERIFY tier; we're hitting the free-tier build queue (CLAUDE.md says iOS sat ~1h). $19/mo Production tier removes that wait. |

---

## Analytics / monitoring

| Vendor | Plan | $/mo | Notes |
|---|---|---|---|
| **GA4** | free | $0 | id `G-LMJVX82M3Q` |
| **Meta Pixel** | free | $0 | id `839009299208301` |
| **Hotjar (ContentSquare)** | free? | VERIFY | id `38cdf4e1f1a56`; free tier limits sessions/mo |
| **Pinterest Tag** | free | $0 | id `2613467907928` |
| **Sentry** | free? | VERIFY | server-side error tracking |

---

## Marketing

| Vendor | Plan | $/mo | Notes |
|---|---|---|---|
| **Meta Ads** | self-serve | ~$1,500/mo at $50/day (when on) | Account `605508002865292`. Total spend ~$520 as of May 6. Verify current state. |
| **Google Ads** | n/a yet | $0 | Folder exists; not yet active |
| **Pinterest Ads** | n/a yet | $0 | Folder exists; not yet active |

---

## Tools / SaaS Dan uses personally (verify which are billed to the business)

| Vendor | Likely $/mo | Notes |
|---|---|---|
| **Anthropic / Claude** subscriptions | VERIFY | This whole operation runs on Claude — should be a business expense, not personal |
| **GitHub** | free for public repos; $4/mo Pro | VERIFY |
| **Microsoft 365 / Google Workspace** | VERIFY | Worth standing up `dan@legacyodyssey.com` proper mailbox |
| **VPN / password mgr** | VERIFY | |

---

## Known waste / open optimizations (do these)

1. **Cancel Cloudflare for SaaS add-on** — TODO. Saves ~$7/mo / $84/yr. Confirmed unused per CLAUDE.md.
2. **Delete zombie Railway service** (`legacy-odyssey-production-a9d1.up.railway.app`) once 1.0.5+ has propagated — no direct $ saving since it shares the same project, but eliminates duplicate-usage billing if Railway scales the env separately. VERIFY.
3. **Free stale Railway custom-domain slots** (14 of them per TODO) — engineering task; closes the cap that's blocking new customers from getting apex 200s. Indirect revenue impact > $ saving.
4. **Right-size Expo/EAS** — if we're queuing on free tier and that's slowing releases, $19/mo Production is worth it.
5. **Verify Resend tier** — free covers 3k emails/mo; if we're over, the Pro tier is $20/mo and we should know.

---

## Process

- Anything new you sign up for → add a row + a one-line history bullet at
  the bottom of this file (date, who/what, why).
- Anything cancelled → strike the row OR move to a "Cancelled" section at
  the bottom, with the cancellation date.
- Once a quarter (calendar), reconcile this file against the actual bank
  statement.
