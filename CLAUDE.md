# Legacy Odyssey — Master Project Context

> **Loaded automatically at the start of every session. Read it fully before doing anything.**
> **🏠 Canonical home: `F:\legacy-odyssey\CLAUDE.md` — the single source of truth.**
> `E:\Claude\CLAUDE.md` is now just a pointer stub; new sessions should be started in `F:\legacy-odyssey`.
> **⚠️ Do NOT add session logs / "Recent Work" to this file.** Session history goes in
> `sessions/<your-role>.md` + a `STATUS.md` entry. Only the Dispatcher session edits this file.
> The full pre-reorg version (with all historical session detail) is preserved verbatim at
> `docs/archive/CLAUDE-full-20260610.md`.
> Last updated: June 10, 2026 (reorganized into the sessions/ + STATUS.md system)

---

## ⚠️ MANDATORY at session start

1. **Identify your session role and read `sessions/<your-role>.md`.** The roster is in
   `sessions/README.md`. If you don't know your role, ask Dan one question: "Which session
   is this?" (coding / chief-of-staff / dispatcher / facebook / meta-ads / google-ads /
   pinterest / affiliates / content-organic / email / seo / influencer).
2. **Read the top of `STATUS.md`** — what other sessions changed recently. Multiple Claude
   sessions work in parallel; this board is how they stay coherent.
3. **Read `docs/INDEX.md`** (per-entity knowledge base). Whenever Dan mentions a specific
   domain, customer, or vendor by name, open `docs/<category>/<entity>.md` BEFORE responding.
   When you change an entity, update its file IN THE SAME RESPONSE. New entity → new file
   from the template in `docs/README.md` + an INDEX line. Skipping this is a process violation.
4. **For business / cost / legal / vendor / renewal / hardware questions, read
   `ops/BUSINESS-OPS.md` first.** Engineering items live in `TODO.md`; business in `ops/`.
5. **Coding sessions:** also run `git log --oneline -20` + `git status` in `F:\legacy-odyssey`
   before touching code — other sessions' uncommitted work may be present; never clobber or
   blanket-commit it.

## ⚠️ MANDATORY at session end (same response as your last piece of work)

1. Update your own `sessions/<role>.md` (date, log bullet, refreshed open items).
2. Add ONE entry to the top of `STATUS.md` (format documented in that file).
3. Update any `docs/` entity files and `TODO.md` / `ops/` items you touched.

---

## What Is This Project?

Legacy Odyssey is a **subscription SaaS baby book platform**. Parents fill in their baby's
story (milestones, photos, recipes, letters) via the iOS/Android app or the web editor, and
family views the finished book at a custom domain (e.g., `kateragno.com`) purchased
automatically via the Spaceship API at checkout.

**Status: LIVE and accepting real payments since March 29, 2026.** ~9 paying customers.

### ✅ CANONICAL PRODUCT DESCRIPTION (use verbatim everywhere)

> Legacy Odyssey is a digital baby book — built as a real website at your child's own .com
> domain. Your baby gets their name as a website. Parents fill in milestones, photos, and
> letters through the iOS & Android app. Family visits the book at your-childs-name.com,
> straight from any browser. Password-protected. $29 for the first year.

**Do not paraphrase, do not add qualifiers, do not mention "family photo albums", do not say
"forever", do not call it a "story". Adapt only the length — never the meaning.**

---

## Critical Rules (Read Every Session)

1. **NEVER submit anything to Apple App Store or Google Play without explicit user permission.** Ask first. Wait for "yes" or "please go ahead."
2. **NEVER click "Submit for Review", "Add for Review", or "Resubmit to App Review" in App Store Connect without explicit confirmation.**
3. **NEVER use real family names** (Eowyn, Ragno, Kate, Roy, Lindsey, Emma, Jeff, Lachlan, Reese, Daniel, Jeanine) as placeholders, examples, or seed data anywhere a non-developer might see them. Use generic stand-ins (Sophia, Smith, Sam Smith, Sarah Smith). See `feedback_no_real_names.md` in memory. ALSO: never invent fake person names in demos — use "Your Child's Name", Mom/Dad/Grandma (see `feedback_no_fake_names_in_demos.md`).
4. **When resuming a session, read `C:\Users\dragn\.claude\projects\E--Claude\memory\project_legacy_odyssey.md` and this file before taking any action.**
5. **If you lose context about a file path, credential, or decision** — check `docs/archive/CLAUDE-full-20260610.md` and the memory directory before asking Dan.
6. **Write important facts to memory / the right .md file immediately** — file paths, credentials, decisions, status changes. Don't wait.
7. **The user prefers direct action** — don't ask unnecessary questions; make decisions and drive work forward.
8. **APP ↔ WEB PARITY (hard rule — "I want the apps and web based editors to all be the same, always.").** iOS app, Android app, and the web book editor must offer the SAME capabilities AND the same copy/wording for the same content. Any change to one MUST be mirrored in ALL surfaces in the same effort. Note intentional gaps in TODO.md.
9. **iOS + ANDROID SHIP IN LOCKSTEP ("I want both apps updated at the same time, always.").** Always `eas build --platform all`; submit BOTH stores for the same version in the same effort (still per-release permission per rules #1/#2 — lockstep means "both or neither," not "auto-submit").
10. **ALWAYS put copy-paste content in its own fenced code block** — emails, prompts for other sessions, commands, snippets — alone in the block, no surrounding prose inside it.
11. **NO REFUNDS — ever.** Do not advertise, offer, or imply refunds anywhere. Cancellation = stop future charges, keep access through the paid period. Domains non-refundable. (Only the formal ToS keeps a minimal consumer-protection-law carve-out.)
12. **Word bans (memory hard rules):** never "forever", never "chapter" (use section/page/area), never "family book / family's story" (it's a BABY book about the CHILD), never analogize to scrapbook/journal/photo album. The mobile app is NOT required — the web editor is equal.
13. **REAL OUTSIDE NAMES — ASK FIRST (Dan, 2026-06-23, resolves the 06-16/06-17 conflict).** Before putting any real outside person's name, @handle, or their child's name (influencers, customers, partners, etc.) into ANY brand content — caption, post, ad, email, creative — ASK Dan whether it's appropriate *in that specific situation*. It is NOT a blanket ban (so the old BRAND-VOICE-GUIDE "never" line is retired) and "credit the influencer" does not pre-authorize it — the rule is per-instance approval. (Distinct from rule #3, which is an absolute ban on the owner's own FAMILY names in placeholders/demos.)
14. **The product is a WEBSITE, not "a book"** (facebook hard rule, 2026-06-22). The sharing feature is **"Your Contacts"** (sub-areas: Contact List + Circles) — the old "Circles" label is retired in customer-facing copy.

---

## ✅ VERIFIED ACCOUNTS & WHAT CLAUDE CAN DO (verified 2026-05-27)

**Claude CAN do these — don't refuse. Confirm the tool is connected, then proceed.**
Only hard limit: raw DDL can't run via the Supabase REST API — use the SQL editor (in Chrome).

- **Supabase migrations (DDL):** SQL editor via the Chrome extension. REST/service-role can do DML, not DDL.
- **App builds:** `cd mobile && npx eas-cli build --platform all --profile production --non-interactive --no-wait`. EAS CLI logged in; credentials EAS-managed.
- **Store submission:** `eas submit --platform ios|android` — ONLY with explicit permission (rules #1/#2); recommend a device test first.
- **Browser actions:** Chrome extension (`mcp__claude-in-chrome__*`) drives Supabase, Stripe, ASC, Play Console. Check `list_connected_browsers` first.

### Accounts — ⚠️ NOT all the same email. Verify before acting.
| Service | Account / identity | Notes |
|---|---|---|
| **Expo / EAS** | **`dragno65`** · project `@dragno65/legacy-odyssey` · projectId `14daf713-2b41-4ac0-b413-1179afa6e6a9` | |
| **Apple (App Store)** | Apple ID **`dragno6565@gmail.com`** · Team **`Y3J2B5YA4N`** (DOR Industries, LLC) · ASC App ID **`6760883565`** | |
| **Google Play** | **`albumerapp2@gmail.com`** (Chrome u/2) · Developer "DOR Industries" (7255543911428830238) · App 4975186349665269659 · svc key `C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json` | **⚠️ DIFFERENT email** |
| **App bundle** | iOS + Android `com.legacyodyssey.app` | |
| **Supabase** | org "dragno6565@gmail.com's Org" (Pro) · ref **`vesaydfwwdbbajydbzmq`** | |
| **GitHub** | **`dragno6565-ship-it/legacy-odyssey`** (origin → Railway auto-deploy) | |
| **Stripe** | `acct_1T3N7kJk2GIrL5uS` — **LIVE MODE** | |
| **Google Ads** | legacyodysseyapp@gmail.com · 517-079-2970 | GA4 property 530710619 |
| Railway / Spaceship / Resend / Approximated / Rewardful | dragno6565@gmail.com | details in `docs/infrastructure/` |

---

## Infrastructure (essentials — full detail in `docs/infrastructure/`)

- **Backend:** Express on Railway. **Canonical URL `https://legacyodyssey.com`** (+ www).
  Auto-deploys on push to `main`. Project `27622203-...` ("bountiful-expression"),
  service `59190e65-...`. **⚠️ The `.env` Railway token points at LIVE PRODUCTION — deleting
  that service takes down prod.**
- **🧟 Zombie service:** `legacy-odyssey-production-a9d1.up.railway.app` (stale v2.1.0) lives
  in a DIFFERENT Railway account; benign; `/admin/health` WARN expected. Don't chase it.
- **DB/Storage/Auth:** Supabase ref `vesaydfwwdbbajydbzmq` (us-west-2). DDL via SQL editor only.
- **Payments (Stripe, LIVE):** Annual intro **$29 first year → $49.99/yr** (primary offer,
  price `price_1TLojVJk2GIrL5uS0oQORYsr` + coupon `sX2lEPb6`); additional domain $12.99/yr.
  Monthly is retired for new customers (foreverearley.com grandfathered — don't touch).
- **Customer domains:** Spaceship registrar (auto-purchase at checkout) → 2 A records to
  `137.66.1.199` (Approximated proxy, `keep_host=true` critical) → Railway. Full subtleties
  in `docs/infrastructure/approximated.md` + `spaceship-registrar.md`.
- **Email:** Resend, verified legacyodyssey.com; all @legacyodyssey.com forwards to
  legacyodysseyapp@gmail.com. Onboarding drip Day 1/3/7/13.
- **Mobile:** Expo/EAS, remote version source. Builds: `eas build --platform all`.
- **⚠️ PASSWORD RESET has TWO flows** (web `/account/reset-password` vs app→`/set-password`,
  token arrives in the URL **hash**). Both fixed; canonical recovery page = `set-password.ejs`
  (served at `/set-password` + `/reset-callback`). Details: archive file + `account.js`/`api/auth.js`.
- **Windows curl:** always `--ssl-no-revoke`.

## App store status (keep this to 3 lines — history lives in sessions/coding.md + archive)

- **v1.0.17 LIVE on both stores** (released 2026-06-04, iOS build 31 / Android versionCode 30).
- **1.0.18 queue:** CirclesScreen, tagline fix ("child's story"), gallery-reposition parity,
  Celebrations year-rename. Build both platforms lockstep; submit only on Dan's explicit go.
- Apple review demo: `review@legacyodyssey.com` / `TestPass-2026!`.

---

## File map — where everything lives

| What | Where |
|---|---|
| Session briefs + protocol | `sessions/` (one file per session; roster in `sessions/README.md`) |
| Cross-session bulletin board | `STATUS.md` |
| Engineering open items | `TODO.md` |
| Entity knowledge base (domains/customers/vendors) | `docs/` + `docs/INDEX.md` |
| Business ops (legal/costs/hardware/decisions/calendar) | `ops/` + `ops/BUSINESS-OPS.md` |
| Marketing per-platform detail | `marketing/<platform>/<platform>.md` + shared `marketing/_BRIEF.md` |
| Historical context (pre-reorg CLAUDE.md, old handoffs, DEV/BLOCKS/SESSIONS notes) | `docs/archive/` |
| Code | `src/` (server) · `mobile/` (Expo app) · `supabase/migrations/` · `scripts/` |
| Secrets | `F:\_secrets\` (NEVER in the repo) · `.env` (gitignored) |

## Design system

```javascript
colors: { background:'#faf7f2', dark:'#1a1510', gold:'#c8a96e', goldLight:'#d4bb8a',
  goldDark:'#b08e4a', textPrimary:'#2c2416', textSecondary:'#8a7e6b', card:'#f0e8dc',
  white:'#ffffff', error:'#c0392b', border:'#e0d5c4' }
```
Web viewer fonts: Cormorant Garamond + Jost (Google Fonts).

## Key database records

- **Primary family (owner dogfood):** family `fb16691d-7ea4-4c93-9827-ffe8904ced6b`,
  book `501e0807-d950-4004-8b4c-9b0f0ce0c910`, eowynhoperagno.com, dragno65@hotmail.com.
- **Admin:** `https://legacyodyssey.com/admin/login` — dragno65@hotmail.com.
- Customer roster: `docs/INDEX.md` §Customers.

## How to run locally

```bash
cd F:/legacy-odyssey && npm run dev          # server → http://localhost:3000
cd F:/legacy-odyssey/mobile && npx expo start --web --port 8082   # app (web) → :8082
```

---

## DO NOT SEND — historical actions completed

- **Welcome email to Reese, Lachlan, Jeff:** ALREADY SENT. Do NOT send another.
- **No unprompted kateragno.com diagnostics.** Don't surface this until Dan raises it.
