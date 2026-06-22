# Editor IA Revamp (D-012/013/014)

**Status:** IN PROGRESS — started 2026-06-17 (coding). Mockup approved by Dan 2026-06-17.
**Source decisions:** `ops/DECISIONS.md` D-012 (IA), D-013 (web staging), D-014 (full family sites — DEFERRED).
**Hard rules:** app + web LOCKSTEP (parity), no real names in demos, nothing to customers without Dan's review (mockup → staging/TestFlight → release).

## Approved structure (4 editor groups)
- **Main page** (front door — pick one): Child Info · Your Journey to Us · **Family Intro (NEW** — family-photo-album-style front page; main-page option ONLY, not the full family-sites product).
- **Your Odyssey** (chronological): Before You Arrived · Birth Story · Your Birth Day · Coming Home · Month by Month.
- **Family & Memories**: Our Family · Your Firsts · Celebrations · Letters · Recipes · The Vault · Custom Galleries · Video Moments.
- **Contact** (its OWN section, pulled out of "My Book"): Contact List + Circles. Plumbing exists (Circles Phase 1+2) — re-home + declutter.

> ⚠️ **LABEL = "Your Contacts"** (Dan, 2026-06-17). The section/card is titled **"Your Contacts"**, NOT
> "Contact" — `ops/DECISIONS.md` D-012 says "Contact", which is wrong; chief-of-staff should correct it.
> The two parts inside keep "Contact List" (people) + "Circles" (groups).

## Build order (D-012)
1. **Your Contacts section** ← BUILT (pending Dan's deploy go). Re-home Contacts + Circles into their own
   top-level **"Your Contacts"** section, web + app lockstep. Decision (Dan 2026-06-17): **relabel in place** —
   keep the web route `/account/book/circles`, relabel "Your Circles" → "Your Contacts" (card + page +
   breadcrumb), and inside relabel "People" → "Contact List". Mobile: pull `circles` out of `DashboardScreen`
   `SECTIONS` into its own "Your Contacts" card above the grid; relabel CirclesScreen + nav title.
2. **Editor regroup** into the 4 groups above (web My Book hub `account-book.ejs` is a flat grid today; mobile `DashboardScreen` `SECTIONS` is a flat list). + **Family Intro** new main-page option.
3. **Notify-after-section prompt:** when a whole NEW section is added → "notify a circle or one contact?" (user chooses each time, NOT per edit; revisit the 10-min cooldown).

## Current state (pre-revamp, 2026-06-17)
- Web: `account-book.ejs` = flat grid of section cards (no groups). Circles surfaced as a gold "New" card on `account-dashboard.ejs` (My Account) → `/account/book/circles` (page has People + Circles).
- Mobile: `DashboardScreen.js` `SECTIONS` = flat 2-col grid incl. `circles` (line ~63), `manageSections`, `help`, `settings`. `CirclesScreen.js` = the Circles UI.

## Related (D-013 web staging)
- Stand up a non-customer-facing staging copy of the web app (web currently deploys straight to prod on push). App already has TestFlight + Play internal as its pre-release gate. Separate infra task.

## D-014 — full family sites: DEFERRED
- Only the "Family Intro" main-page option is in scope (D-012). Retired `family_album` book_type code exists in the backend — decide revive vs rebuild when family sites become a project.
