# Resend

**Status:** active
**Owner:** Legacy Odyssey transactional + drip emails
**Last touched:** 2026-04-28

## What it is
Email API for transactional and drip emails. Sender domain `legacyodyssey.com` is fully verified (DKIM, SPF, DMARC).

## Where it's used
- Welcome email on Stripe checkout completion
- Day 1 / 3 / 7 / 13 onboarding drip (cron at 9:07 AM UTC daily)
- "Your site is live" email when `siteLiveDetect` cron sees customer's domain serve 200 first time
- Cancellation emails (archive + delete variants)
- Reactivation email
- Password reset
- Gift purchase confirmation (to buyer)
- Contact form submissions (to admin)

## Current configuration
- **Sender:** `hello@legacyodyssey.com` (and others on the legacyodyssey.com verified domain)
- **Reply-To:** `legacyodysseyapp@gmail.com` (catch-all — bypasses unreliable Spacemail forwarding)
- **Plan:** Free tier or low Pro (current usage is ~hundreds/day, well under)
- **Env var:** `RESEND_API_KEY`
- **Domain verification:** legacyodyssey.com ✅ DKIM ✅ SPF ✅ DMARC ✅
- **Forwarding rule:** all `@legacyodyssey.com` inbound → `legacyodysseyapp@gmail.com`

## Pricing tiers (for context)
- Free: 3,000 emails/mo (12 months)
- Pro: $20/mo for 50k emails
- At 100k customers × 5 onboarding emails/yr ≈ 41k/mo — Pro plan handles it

## History
- 2026-02 — Set up; sender domain verified
- 2026-04 — Welcome-back / reactivation email added
- 2026-04-26 — Webhook race fix (no longer fires welcome-back immediately after cancel)

## Related
- `infrastructure/stripe.md` — Stripe webhooks trigger most emails
- `infrastructure/spacemail.md` — separate inbound product (mailbox forwarding); not yet fully working
- All `customers/*.md` files — each customer received some Resend email

## Open issues / quirks
- **Spacemail per-mailbox forwarding** still not set up at Spacemail level — `replyTo: gmail` is the working safety net.
- **AWS SES is cheaper at high volume** ($0.10/1k emails) — eventual migration target if costs grow past 200k emails/mo. Resend's developer experience is currently worth the premium.
- **Welcome-email resend** to Reese / Lachlan / Jeff was held for blog post; blog is now live so safe to resend (per CLAUDE.md open loop).
