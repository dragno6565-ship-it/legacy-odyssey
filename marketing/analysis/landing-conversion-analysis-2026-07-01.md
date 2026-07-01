# Landing Page Conversion Analysis

**Prepared 2026-07-01 · Source: live GA4 property 531219463 (legacyodysseyapp@) + Stripe + production database**

---

## The short version

You have real traffic on paper (259 users in the last 7 days, ~917 sessions in 28 days), but **almost none of it is a real, in-market US parent**. A large share is bots and random foreign junk. Of the genuine humans who do land, the page holds them for about **8 seconds on average** and then they leave. In the last week, **zero real customers bought** — the three purchases GA shows are all your own checkout tests (`legacyodysseytest8`, `legacyodysseytest9`, and one un-provisioned test charge).

So the problem is two separate problems stacked on top of each other:

1. **Traffic quality** — most of the "131 sessions" are not prospects at all.
2. **Page conversion** — the few real visitors aren't being convinced or even held.

---

## Purchases: the truth

- **Stripe, last ~4 days:** 3 successful $29 charges — all yours. Two created the test books `legacyodysseytest8` / `legacyodysseytest9` (customer name "Daniel Ragno"); the third ($29, Jun 29 19:22) has no matching book row (a cleaned-up test, but worth a glance to be sure a real buyer wasn't charged without getting an account).
- **Real external customers acquired in the window: 0.**
- GA "Purchaser rate 4.1%" is meaningless right now — it's counting your test purchases.

---

## Who is actually showing up (last 7 days, by channel)

| Channel | Sessions | Engagement | Avg time | Real? |
|---|---|---|---|---|
| Direct | 194 (75%) | 22% | ~6 sec | Mostly junk — real people don't bounce a typed URL in 6s |
| Unassigned | 50 (+2,400%) | 0% | ~3 sec | Junk |
| Paid Social (your Meta ad) | 38 | 17.5% | ~5 sec | Very low quality |
| Cross-network | 27 | 0% | ~7 sec | Junk |
| Referral | 13 | 53% | **44 sec** | **Real — and the only channel that produced key events + revenue** |
| Paid Search | 6 | 0% | — | Junk |
| Organic Social | 3 | 42% | 12 sec | Real but tiny (the influencer surge has faded) |

**Reading it:** the two channels with genuinely engaged humans are **Referral (44s, converts)** and **Organic Search (26s over 28 days)**. Everything you're paying for — Paid Social, Paid Search, Cross-network — is bringing 0–5 second visitors who never engage.

---

## Where they're from (last 7 days, active users)

United States **173** · Canada 28 · United Kingdom 10 · Poland 9 · Germany 7 · France 7 · India 7

- ~67% US is fine, but a third is foreign, and **Poland / Germany / France appearing out of nowhere is a classic bot signature.** A US-domain baby book will not convert those visitors.

---

## Where they land and go (last 7 days, page views)

| Page | Views |
|---|---|
| Home ("A digital baby book at your child's own .com") | 231 |
| Gift page | 39 |
| A live customer book (real family site) | 36 |
| My Account | 15 |
| Account Login | 11 |
| Redeem Your Gift | 0 |

- **The home page is ~85% of the entry battle.** That is the page that currently reads like a domain registrar and doesn't explain the product — exactly what we're rewriting.
- Almost nobody reaches Redeem — the gift funnel is barely getting traffic.

---

## The 28-day picture (Jun 3 – Jun 30)

- 917 sessions, 224 engaged, **24.4% engagement rate** (healthy sites run 55–70%), **8s average engagement per session**.
- Direct 68% of all sessions at 22% engagement — the single biggest bucket, and largely junk.
- Only **3 key events and $14.97 total tracked "revenue"** in 28 days, and even that came from Referral + Organic Shopping (likely test/mis-valued at $4.99).

---

## Why nobody's buying — honest synthesis

1. **The traffic is mostly not real prospects.** Bots (Direct/Unassigned/Cross-network at 0–6s) and non-US visitors inflate the session count. Your true in-market US parents per day are in the single digits. This matches the earlier ~70%-bots baseline.
2. **The real visitors aren't held.** 8-second average engagement means the page loses people before they understand it. This is the copy/clarity problem we're already fixing (the home page reads like a domain sale and never plainly says what the product is or what you get).
3. **No social proof.** There's no customer count, no reviews, no faces on the page. Cold parents don't hand over a card to an unknown brand with nothing to trust.
4. **Paid money is buying garbage.** Paid Social and Paid Search are delivering 0–5 second clicks. Any paid spend on the current page is lighting money on fire.
5. **What actually works is starved.** Referral and Organic Search are the only channels bringing engaged, converting humans — and they're tiny because we're not feeding them (the affiliate/referral DMs are still unsent; SEO is thin).

---

## What to do about it (in priority order)

1. **Fix the home page** (in progress): lead with a clear statement of what the product is, add the full feature list (being compiled now), and add social proof — even a simple "join the families already using Legacy Odyssey." This is the highest-leverage fix because 85% of entries land here.
2. **Add social proof** anywhere on both landing pages: a customer count, a real review (Akshita's is public), example book screenshots.
3. **Stop feeding the junk.** Pause or tightly geo-target (US-only) any paid social/search until the page converts; you're currently paying for 5-second visitors.
4. **Feed what works.** Send the affiliate/referral DMs (Referral is your best channel by far) and invest in organic search — those are the humans who actually engage and buy.
5. **Clean up GA reporting.** Add bot filtering / internal-traffic exclusion so future numbers reflect real humans, not a bot-inflated 131.

---

*Data pulled live from GA4 property 531219463 via the browser (the MCP connector is still stuck on the empty duplicate property 530710619 — worth fixing so this data is one query away next time).*
