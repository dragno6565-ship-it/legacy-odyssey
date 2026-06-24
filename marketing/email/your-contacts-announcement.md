# Feature Announcement Email — Contact Section (✅ SENT 2026-06-24)

> **Status:** ✅ **SENT 2026-06-24** to all **14 active paying customers** (Dan: "Send to
> everyone"). Sent via Resend API directly (`scripts/send-contact-section-announcement.js`),
> from `Legacy Odyssey <hello@legacyodyssey.com>`, reply-to info@legacyodyssey.com, one email
> per recipient (no shared To:), List-Unsubscribe + visible mailto unsubscribe. 11 delivered on
> the first pass, 3 (rdawnporter / eowynkiller / akshitathakur) hit Resend's 5/sec rate limit and
> were re-sent successfully on a throttled retry. 0 failures after retry.
> **Audience note:** the long-standing "7 customers" figure was STALE — the live `families` table
> showed **14** active paid, non-test families. Excluded: owner dogfood (dragno65@hotmail.com),
> Apple review login, demo/sample account, cancelled/test rows. Nobody had `unsubscribed_at` set.
> **CTA:** switched to `https://legacyodyssey.com/demo` at send time — the blog page
> `/blog/circles-sharing` still said "Circles"/"your book" live (coding hadn't pushed
> content-organic's relabel), so linking it would have contradicted the email + broken rule #14.
> **Author:** Email session, 2026-06-16 → simplified + approved 2026-06-23 → sent 2026-06-24.
> **Provider:** Resend · **From:** info@legacyodyssey.com · **Reply-to:** forwards to legacyodysseyapp@gmail.com
> **Links the live blog post:** https://legacyodyssey.com/blog/circles-sharing (route verified
> live 2026-06-23, `src/routes/book.js:645`; URL slug unchanged by the rename).
> **Compliance:** canonical product description verbatim (footer); rule #14 — body frames it as a
> WEBSITE, not "a book" (canonical footer is the approved verbatim exception); rule #13 — no real
> outside names present (Sophia Smith is a generic placeholder, not a real person); word bans
> respected (no "forever", "chapter", "family book/story", or scrapbook/journal/album analogy);
> one clear CTA.

---

## Subject line (pick one)

1. **A new contact section to make sharing easy** ← recommended
2. Sharing your site just got easier
3. We added a contact section

## Preheader
Add your people once, then share your site and any updates in a tap.

---

## Email body

Hi there,

We just added a **contact section** to make sharing your site easy.

Add your contacts — the family and friends who should see it — and sharing your site and any changes you make is simple. No more texting the address and password to one relative at a time.

You can also split your contacts into groups, or circles — like "Grandparents" or "Close Family" — so you can share with just one part of the family when you want to.

It's waiting for you now, on the web and in the iOS and Android app.

Here's a quick look at how it works:

### → See how it works

https://legacyodyssey.com/demo

Warmly,
The Legacy Odyssey team

---

*Legacy Odyssey is a digital baby book — built as a real website at your child's own .com domain. Your baby gets their name as a website. Parents fill in milestones, photos, and letters through the iOS & Android app. Family visits the book at your-childs-name.com, straight from any browser. Password-protected. $29 for the first year.*

legacyodyssey.com · info@legacyodyssey.com
[Unsubscribe]({{unsubscribe_url}})

---

## Notes for the coding session (send mechanics — not done here)

- **One CTA only**: the "See how Your Contacts works" link → blog post. Render it as a gold
  (`#c8a96e`) button if built as HTML; keep the raw URL visible in the plain-text part.
- **Unsubscribe**: `{{unsubscribe_url}}` must be a working list-unsubscribe (Resend supports
  RFC 8058 one-click). Required for a marketing (non-transactional) send.
- **Audience list**: no marketing subscriber list exists yet (`email.md` Status: "List size
  tracking — currently 0 leads"). The recipient set has to be assembled — see decision below.
- Fonts/colors if HTML: Cormorant Garamond + Jost; cream `#faf7f2`, gold `#c8a96e`,
  text `#2c2416` (design system in CLAUDE.md).
- **Heads-up (content-organic):** the linked blog post (`blog-circles-sharing.ejs`) still uses
  the old "Circles" naming in its body. The URL slug is fine and the email link works, but the
  post should be relabeled to "Your Contacts" for full consistency. Not blocking this email.

## AUDIENCE — CONFIRMED PLAN (still needs Dan's go to send)

**Plan: send to the 7 paying customers only** (6 annual + 1 monthly). Your Contacts is a feature
they can use *today* in their own site — highest relevance, lowest risk, no list to build. There
is **no lead list yet** (0 captured), so there is nothing to widen to right now. Revisit a wider
send once the lead-capture form exists and a real subscriber list has grown.
