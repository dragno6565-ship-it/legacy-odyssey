# Legacy Odyssey — Pinterest
> Read `F:\legacy-odyssey\marketing\_BRIEF.md` first for full project context.
> Last updated: 2026-06-10

---

## Account & Tracking

| Item | Value |
|---|---|
| Login | dragno6565@gmail.com |
| Account | Legacy Odyssey (@legacyodysseyapp) — Business account |
| Pinterest Tag ID | **2613467907928** |
| Tag installed on legacyodyssey.com | ⚠️ Unverified — check |
| Pin-creation tool | https://www.pinterest.com/pin-creation-tool/ |

---

## Goal

Pinterest is a zero-cost, high-intent channel. Parents actively search for baby book ideas, memory keeping, and baby shower gifts. Pins have multi-year shelf lives.

## Why Pinterest for This Product

- 85% of Pinterest users are planning a purchase
- "Baby book" and "baby memory" are high-search terms
- Audience skews new/expecting mothers 25–40
- Gift pins (baby shower) perform extremely well
- Our dark/warm/premium aesthetic stands out in a sea of pastel baby content

---

## Board Structure (live)

| Board Name | Purpose |
|---|---|
| **Digital Baby Book Ideas** | Main product board — all product pins |
| **Baby First Year Milestones** | Educational/milestone content, soft sell |
| **Baby Shower Gift Ideas** | Gift angle — high search volume |
| **Letters to My Child** | Letter-writing prompts, emotional content |

---

## Pin Schedule

**Pins 1–123 scheduled — queue runs daily (12 PM) continuously through Aug 9, 2026 (full to the 30-day Pinterest cap). 31 pins scheduled ahead as of Jul 11.**

- **Pins 1–40:** Scheduled in prior sessions.
- **Pins 41–70:** Scheduled Jun 10. Dates May 21–June 18, 2026.
- **Pins 71–97:** Scheduled Jun 16 for June 19–July 15 (one/day, 12 PM).
- **Pins 98–123:** Scheduled Jul 11 for July 16–Aug 9 (one/day, 12 PM; pin 123 doubled on Aug 9, Aug 10 was outside the cap). **REALIGNED to rule #16 (not just a baby book / whole life journey) + privacy-first before scheduling** — 8 images regenerated (`scripts/gen_pins_realign.py`), all descriptions rewritten lifelong + private. No price; placeholder names only.

**⚠️ POSITIONING (rule #16) governs all NEW pins:** lead with "not just a baby book / whole life journey," never cap at infancy/first year, add lineage; lead .com copy with privacy (invite-only, never public). The older `scripts/gen_pins_101_123.py` is first-year-heavy — use `gen_pins_realign.py` as the template for future batches.

**Standing need:** queue is full to the cap; to keep 15–30 pins always scheduled ahead (Dan's requirement), add ~1 new (rule-#16-aligned) pin/day as the cap advances.

CDN URL pattern: `https://vesaydfwwdbbajydbzmq.supabase.co/storage/v1/object/public/pinterest-pins/<filename>` (append `?v=2` when injecting after an upsert to dodge stale CDN cache)

Boards used in rotation: Digital Baby Book Ideas, Baby First Year Milestones, Baby Shower Gift Ideas, Letters to My Child.

### Analytics (May 16–Jun 15, 2026)

- 817 impressions (+129%), 43 engagements (+258%), 6 saves, 1 outbound click
- Top board: **Baby First Year Milestones** (479 impr / 15 pins = ~32/pin)
- Editorial list-format pins far outperform generic product pins on a per-impression basis

---

## SEO Keywords for Pins

- digital baby book
- baby book ideas
- baby memory keeper
- baby milestone tracker
- custom baby website
- unique baby shower gift
- baby's first year book
- personalized baby gift

---

## Scheduling Notes

- Pinterest enforces a **30-day scheduling limit** from today's date. Anything beyond 30 days is greyed out on the calendar.
- The calendar date picker is a `type=text` input (MM/DD/YYYY); typing the date is NOT enough — you must click the matching day in the calendar picker. Navigate months with the `>` arrow.
- Best scheduling flow: open the calendar by clicking the date field → advance month if needed → click the correct day → verify date field updates → click Schedule → confirm modal.
- To inject images (Pinterest blocks direct file upload via Chrome extension), use the canvas method above.

## Next Steps

- [ ] **Schedule pins 98–100** (~Jun 18+ when 30-day window reaches Jul 16–18) — method in sessions/pinterest.md
- [ ] Resolve orphan draft "How to Write a Letter to Your Newborn" (schedule or delete)
- [ ] Verify Pinterest tag 2613467907928 is installed on legacyodyssey.com
- [ ] Consider Idea Pins (no-link awareness content) for broader reach
- [ ] Consider Tailwind for scheduling when pin volume grows

## Work Log

- **2026-06-16** — Scheduled pins 71–97 (Jun 19–Jul 15, 12 PM). Solved Schedule-button blocker (real-keystroke title) + tab-focus requirement. Queue extends to Jul 15. 98–100 remain (outside cap).
- **2026-06-15** — Analytics pulled. Generated + uploaded pins 71–100. Scheduling blocked by background-tab React issue.
- **2026-06-10** — Scheduled pins 41–70 (May 21–Jun 18, 2026 at 12:00 PM). Pin 70 fell on Jun 18 due to 30-day cap.
- **~2026-05-20** — Scheduled pins 1–40 (prior session, dates not individually logged).
- **2026-05-03** — Initial file created; account and boards set up.


---

## Archive review additions (2026-10-04, retired pinterest session, 2026-05-03 to 2026-07-11)

**Decisions:** Dan decided 2026-10-04 to LEAVE the old pins as they are, including priced ones ("$29") and older hooks (Time Vault, "Yours forever", pin 74 "not a scrapbook"); do not audit or edit them. New pins stay clean (no price, word bans, rule #16). 2026-05-07: "We only do baby books now": the board "Family Photo Album Ideas" was deleted (pins 18, 25, 29, 30 went with it) and "family albums" removed from the bio; the differentiator is the baby book on their own .com, not the Vault (bio rewritten to lead with .com). 2026-06-15 Dan asked about following people: advice was at most 20-30 relevant accounts once, never rapid follow/unfollow; no decision.

**State to check:** the scheduled queue was last filled through about 2026-08-09 and no Pinterest session ran after 07-11, so it is almost certainly EMPTY (Dan's standard: 15-30 pins scheduled ahead, one per day at 12:00 PM). Verify at profile > Created > Scheduled. Bio and the top SEO board "Baby First Year Milestones" still cap at baby/first year; rewriting needs Dan's approval. Click-through is the known gap (817 impressions to 1 outbound click in 30 days, June).

**Facts:** business ID 1127729700350112226 (used in pin-builder and bookmarklet URLs). Boards: Baby First Year Milestones, Digital Baby Book Ideas, Letters to My Child, Meaningful Gifts for New Parents (holds pins 13, 19, 24), Baby Shower Gift Ideas (created 2026-05-20). Pinterest tag 2613467907928: a May doc claimed it was verified firing; later notes say unverified (re-check). Generators: scripts/gen_pins.py (11-30), gen_pins_31_40.py, gen_pins_41_70.py (has the dark_photo_pin template), gen_pins_71_100.py; uploader scripts/upload_pins_to_supabase.py (public `pinterest-pins` bucket, x-upsert; its filename filter missed pin40 once). Files in F:\legacy-odyssey\pinterest-pins. Pins 11-30 were bulk-published on 05-07 (not scheduled); 31-40 scheduled May 8-17 at 12 PM. Top pins (06-15): "A digital baby book at your child's own .com" (358 impressions), "What to write in your baby's book" (109).

**How-tos and traps:**
- Schedule ONLY in https://www.pinterest.com/pin-creation-tool/. pin-builder is the ads tool and cannot schedule ("Save from URL" redirects there). The bookmarklet URL (`pin/create/bookmarklet/?url=&media=&description=&actingBusinessId=`) publishes immediately with no title or scheduling: never use it for scheduled content.
- Image injection: the target input is `#storyboard-upload-input`. Pinterest CSP blocks fetch/XHR to Supabase, but `img-src *` allows loading the image into a canvas. The extension file_upload fails with CDP -32000.
- The `type` action drops characters (".com" became ".om"): set bio/textarea values with the native value setter plus an input event. Ctrl+A in an empty field injects a stray "a": click and type.
- Same-day scheduling after 12:00 PM only offers later slots; start a batch tomorrow. The time dropdown must be scrolled to reach 12:00 PM. The +30 day is NOT selectable: the effective window is today + 29.
- Date cells need a real click; aria-labels use ordinals ("June 22nd, 2026"), so regexes with `\b` after the number miss them.
- The MCP drives only its own tab group: the controllable Pinterest tab has a green-check icon; a normal red-P tab cannot be driven; programmatic focus is blocked, so Dan must click the tab. Forcing React suspense (`$RC`/`$RS`), faking visibilityState and DOM surgery all failed.
- Claude's own browser could not render Pinterest (logged out); use Dan's Chrome.
- Read the board and current rules BEFORE generating a batch (a 26-pin batch was built against old rules on 07-11).
