# sessions/ — One brief per Claude session

Each parallel Claude session working on Legacy Odyssey has exactly ONE file here.
It is that session's standing brief + running log. **A session edits only its own file**
(plus the shared `STATUS.md` board and whatever detail files its role owns).

## The protocol (every session, every time)

**At start:**
1. `CLAUDE.md` (auto-loads — rules, accounts, infrastructure).
2. `sessions/<your-role>.md` (this directory) — your scope, state, open items.
3. Top of `STATUS.md` — what the other sessions did since you last ran.
4. Drill into your detail files only as needed (`TODO.md`, `docs/`, `ops/`, `marketing/<platform>/`).

**At end (same response as your last piece of work):**
1. Update your `sessions/<role>.md` — bump "Last session" date, log what you did, refresh open items.
2. Add ONE entry to the top of `STATUS.md` (format is in that file).
3. Do NOT edit `CLAUDE.md` (Dispatcher maintains it) or another session's file.

## Roster

| File | Session | Detail files it owns |
|---|---|---|
| [dispatcher.md](dispatcher.md) | Dispatcher / HQ (Dan's idea-routing session) | CLAUDE.md, STATUS.md hygiene, this directory |
| [coding.md](coding.md) | Coding (product + infra engineering) | `TODO.md`, `docs/`, `src/`, `mobile/` |
| [chief-of-staff.md](chief-of-staff.md) | Chief of Staff (business ops) | `ops/` |
| [facebook.md](facebook.md) | Facebook organic page | `marketing/facebook/` |
| [meta-ads.md](meta-ads.md) | Meta (FB/IG) paid ads | `marketing/meta-ads/` |
| [google-ads.md](google-ads.md) | Google Ads | `marketing/google-ads/` |
| [pinterest.md](pinterest.md) | Pinterest | `marketing/pinterest/`, `pinterest-pins/` |
| [affiliates.md](affiliates.md) | Affiliate program (Rewardful) | `affiliate-assets/`, `docs/infrastructure/rewardful.md` |
| [content-organic.md](content-organic.md) | Organic content (IG/TikTok/blog) | `marketing/content-organic/`, `marketing/blog/` |
| [email.md](email.md) | Email marketing | `marketing/email/` |
| [seo.md](seo.md) | SEO | `marketing/seo/` |
| [influencer.md](influencer.md) | Influencer outreach | `marketing/influencer/` |

Starting a NEW kind of session? The Dispatcher creates its file here first (copy the
template at the bottom of dispatcher.md) and adds it to this roster.
