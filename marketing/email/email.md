# Legacy Odyssey — Email Marketing
> Read `F:\legacy-odyssey\marketing\_BRIEF.md` first for full project context.
> Last updated: May 3, 2026

---

## Infrastructure (Already Set Up)

| Item | Detail |
|---|---|
| Email provider | **Resend** (resend.com) |
| Login | dragno6565@gmail.com |
| Sending domain | legacyodyssey.com — **VERIFIED** (DKIM, SPF, DMARC all passing) |
| From address | info@legacyodyssey.com |
| Reply-to / forwarding | All @legacyodyssey.com → legacyodysseyapp@gmail.com |
| Transactional email | Live — signup welcome, password reset, gift redemption, cancellation, win-back all wired into backend |

---

## Existing Email Sequences (Live in Production)

### Onboarding Drip (Paying Customers)
Fires automatically after signup. Implemented in backend (`src/routes/webhooks.js` + Resend).

| Day | Subject / Purpose |
|---|---|
| Day 1 | Welcome + getting started |
| Day 3 | Tips / first milestone prompt |
| Day 7 | Engagement / add family members |
| Day 13 | Check-in / feature highlight |

### Transactional Emails (Live)
- **Welcome email** — fires on new signup
- **Gift purchase confirmation** — fires when gift purchased (buyer)
- **Gift redemption** — fires when recipient redeems code
- **Set password** — fires after gift redemption (if new user)
- **Cancellation** — fires when subscription cancelled
- **Welcome back** — fires on reactivation (with fix: does NOT fire if cancel_at_period_end=true or archived <60s ago — commit `58661e8`)

### ⚠️ Known Gap: Welcome emails pending for Reese, Lachlan, Jeff
These were held for a blog post. Blog is now live so safe to send. Do this.

---

## What Needs to Be Built

### 1. Lead Capture Form on Website
Currently: zero email capture for non-purchasers. Visitors leave with no way to follow up.
- Need: Email capture form or exit-intent popup on legacyodyssey.com
- Suggested hook: "Check if your child's .com is available" → enter email → get result + nurture sequence
- Implement in Express/EJS frontend (`src/views/marketing/`)

### 2. Lead Nurture Sequence (Non-Purchasers)
**Trigger:** Email signup on website (not yet built)
**Goal:** Convert fence-sitters

| Email | Timing | Angle |
|---|---|---|
| Welcome | Immediately | "One thing most parents don't think about until it's too late" |
| Social proof | Day 2 | "What a Legacy Odyssey book actually looks like" |
| Domain urgency | Day 4 | "Is sophiasmith.com still available?" |
| Objection handling | Day 7 | "Is $29 worth it? Here's what you're actually getting" |
| Last chance | Day 10 | Reminder + urgency |

### 3. Cancellation Win-Back Sequence
Reactivation flow already exists in the app (`commit 1a65934`). Email reinforces it.
- Day 3 after cancel: "Your book is still waiting for you"
- Day 14: "Here's what you'll lose when your domain expires"
- Day 30: "One last thing before your domain is released"

### 4. Gift Recipient Follow-Up
- Day 3 after gift purchase (if not redeemed): Redemption reminder to recipient
- Day 1 after redemption: "Getting started" guide

---

## Subject Line Swipe File
- "Is sophiasmith.com still available?"
- "The one thing you can't undo after your baby's first year"
- "What happens to your baby book when Instagram shuts down?"
- "She's 3 months old. Her .com is already taken."
- "A baby book that lasts longer than a hard drive"

---

## Status
- [x] Resend set up and verified
- [x] Onboarding drip live (Day 1, 3, 7, 13)
- [x] All transactional emails live
- [ ] Send pending welcome emails to Reese, Lachlan, Jeff
- [ ] Lead capture form on website
- [ ] Lead nurture sequence written + live
- [ ] Win-back email sequence live
- [ ] List size tracking (currently 0 leads, ~8 customers)

## ⭐ STANDING RULE — Dan receives every campaign email (set 2026-06-24)
Dan is a permanent recipient on **every** outbound marketing/campaign send. Default address:
**dragno6565@gmail.com**. Implement by including a `STANDING_RECIPIENTS = ['dragno6565@gmail.com']`
block in every campaign send script (see `scripts/send-contact-section-announcement.js` for the
pattern) and merging it into the recipient list. This is internal — not a paying customer, just
Dan keeping eyes on what goes out. When a real Resend Audience/Broadcast is stood up, add Dan to it.

## Feature-Announcement Emails (new motion: ship feature → blog → subscriber email)
- **Privacy blog post** — ✅ **SENT 2026-07-11** to all 18 active paying customers (+ Dan = 19),
  19/19 OK. "Is it safe to put your baby online?" → `/blog/is-it-safe-to-put-your-baby-online`.
  Copy: `marketing/email/privacy-post-announcement.md`. Sent via
  `scripts/send-privacy-post-announcement.js` — **the current best pattern: pulls the recipient
  list LIVE from `families` at send time** (dry-run + `--force` guard, per-recipient, throttled).
  Compliance: no price, website-not-book, positioning #16. From content-organic's §B handoff.
- **Contact section** (first announcement) — ✅ **SENT 2026-06-24** to all **14 active paying
  customers**. Copy: `marketing/email/your-contacts-announcement.md`; send script:
  `scripts/send-contact-section-announcement.js`. CTA → `legacyodyssey.com/demo` (the live blog
  still said "Circles" at send time). Per-recipient Resend send, List-Unsubscribe + mailto
  unsubscribe. **Lesson:** real customer count is 14 (not the long-quoted 7) — verified from the
  `families` table. **Next time:** stand up a proper Resend Audience/Broadcast + a one-click
  unsubscribe that writes `families.unsubscribed_at` instead of hand-rolling (CODING).

## Work Log
- **2026-06-23** — Relabeled the staged announcement Circles → "Your Contacts" to match the live
  product (web + app 1.0.19); renamed file; reframed per rules #13/#14. Still not sent.
- **2026-06-16** — Drafted Circles feature-announcement email (staged, not sent). Blocked on Dan.
- **Pre-May 2026** — Resend set up, domain verified, onboarding drip + all transactional emails implemented
- **Apr 25–27, 2026** — Multiple email bug fixes: cancellation/reactivation race condition fixed (commit `58661e8`), welcome-back email no longer fires on cancel+archive, set-password email improved
- **May 3, 2026** — .md file created. Pending: welcome emails to Reese/Lachlan/Jeff, lead capture form.
