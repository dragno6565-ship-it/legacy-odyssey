# Resend

**Status:** active
**Owner:** Legacy Odyssey transactional + drip emails
**Last touched:** 2026-04-28; archive-review additions 2026-10-04 at the bottom

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


## Update 2026-10-04 (archive review)

### Rate limit: 5 requests per second
The first unthrottled campaign send failed 3 of 14 with rate-limit errors (2026-06-23); a 9-recipient loop failed on the 6th (2026-05-15). Space sends 250 to 300 ms apart and retry on 429.

### Campaign / customer announcement send runbook
1. Copy staged in `marketing/email/<name>.md`; show Dan the FULL final copy in chat; he says "go" / "send it" (then send in this session, no extra gates).
2. Verify the CTA URL returns HTTP 200 in production. If the CTA target contradicts the email or the website-not-book rule, change the target, not the copy. Never link /demo.
3. Script pattern: `scripts/send-privacy-post-announcement.js` / `scripts/send-domain-fix-announcement.js`: dry run by default, `--force` sends; calls `scripts/copy-lint.js` (`assertCleanCustomerCopy`: blocks "book", "web address", em dash, wrong greeting, price; requires "Hi Legacy Odyssey Customer,"). Run as `node -r dotenv/config scripts/<file>.js`.
4. Recipients pulled LIVE from the families table (subscription_status=active, plan=paid, archived_at null, unsubscribed_at null). Dan's 2026-06-23 audience ruling: every active paid family including his own family account and influencer accounts, excluding dogfood/test, Apple review, demo and cancelled rows. Never use a remembered number and never scrape customer docs (a docs scrape returned the wrong person's email and missed a customer).
5. STANDING_RECIPIENTS adds Dan (he gets a copy of every send). One email per recipient, throttled.
6. RESEND_API_KEY lives only in Railway production (not in local .env): fetch it with RAILWAY_API_TOKEN into a one-shot env var or temp file, never printed, deleted after the run.
7. Log in STATUS.md, sessions/email.md and marketing/email/email.md.
- Any bulk-send route or script must default to a dry run or a single explicit recipient, never "everyone" (2026-05-15 a bare URL click sent the Keepsakes email to all 9 customers twice; Dan chose no apology email).
- Do not commit scripts with hardcoded customer emails (scripts/send-contact-section-announcement.js is deliberately untracked for that reason).
- Do not use Stripe `customer_name` for greetings (it is the cardholder).
- Old pattern, superseded: a temporary admin-cookie-protected `/admin/dev/<name>` route that Dan visits once (used May 2026 before the Railway key fetch).

### Sender, authentication and tracking
- All campaigns go from hello@legacyodyssey.com. Unsubscribe is a mailto to info@ plus a List-Unsubscribe header; nothing writes families.unsubscribed_at yet (manual, a growing compliance risk).
- Before 2026-05-14 apex SPF was `include:spf.spacemail.com ~all` only, so every Resend email FAILED SPF. Fixed to also include `_spf.resend.com` (`scripts/fix-spf.js`, Cloudflare API). DMARC `p=none` with `rua=mailto:dmarc@legacyodyssey.com` (aggregate XML reports land in the dan@ catch-all; they are legitimate, not phishing). DKIM `resend._domainkey` verified. `scripts/fix-dmarc.js` exists.
- Open and click tracking is on for all transactional sends (TRACKING constant in emailService; the contact-form mail to Dan is excluded).
- Not done: Google Postmaster Tools (needs Dan signed in, then a TXT via Cloudflare), Microsoft SNDS/JMRP.

### Other senders and jobs
- Lead nurture drip `src/jobs/leadNurture.js`: 3 emails (day 2 educational, day 5 value, day 9 soft offer) to waitlist sources lead_magnet, exit_intent, newsletter; tracks waitlist.nurture_sent; daily 09:37 plus a 45 s startup run; unsubscribe GET `/api/waitlist/unsubscribe?e=<email>`.
- Lead capture: POST `/api/waitlist` with a source tag (Dan chose Supabase, not a Resend Audience). newsletter = stored silently; lead_magnet / exit_intent = free-guide email (the guide is a hosted page `src/public/guides/protecting-your-childs-digital-identity.html`); every signup notifies info@legacyodyssey.com.
- `dataRetentionReminder.js`: weekly Monday about 09:50, emails dan@ and Dan's Gmail the cancelled accounts whose 1-year retention lapsed; sends nothing when none are due. The real purge job is unbuilt.
- `videoUsageMonitor.js`: Mondays, flags sites at 80% of the 1,000-minute video cap.
- Contact form: POST /api/contact (5 per 15 min), mailed to help@ AND directly to Dan's Gmail. A MISSING Turnstile token falls through to honeypot (hidden input "website") plus rate limit so real users with Cloudflare blocked still reach Dan; an invalid token is rejected. Turnstile is a no-op until TURNSTILE_SECRET_KEY is set in Railway. The contact page says hello@ while the backend routes to help@ (minor mismatch).
- No standalone "check your spam" blast (Dan 2026-05-14): spam-folder lines live on /success, /gift/success, the buyer gift email and as a P.S.; no in-app notice.
