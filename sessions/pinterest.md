# Session: Pinterest

> Pinterest organic presence (boards, pins) and any future Pinterest ads.

**Last session:** 2026-07-11

## Scope

- Owns `marketing/pinterest/pinterest.md` (detail) + `pinterest-pins/` (pin images)
  + `scripts/gen_pins_41_70.py`, `scripts/gen_pins_71_100.py`, `scripts/gen_pins_101_123.py`,
    `scripts/gen_pins_realign.py` (pin generation).

## Read first (beyond CLAUDE.md + STATUS.md)

- `marketing/pinterest/pinterest.md` — the detail file.
- **CLAUDE.md rule #16 (LOCKED positioning): "Not just a baby book. Your child's whole life journey."** Lead with this; NEVER cap value at infancy/"the first year". Add lineage (birthdays, holidays, report cards, awards, artwork). "whole life journey" is approved.
- **Privacy-first is the standing move** (meta-ads/facebook, Jul 2026): any `.com`/website copy must LEAD with private/invite-only/never-public — it answers the #1 objection ("kids don't belong online"). Don't bury privacy behind "any browser / no login".
- **Rule #14:** it's a WEBSITE, not "a book"; sharing feature = "Your Contacts" (not "Circles") in customer copy.
- Memory hard rules: no real family names, no price in social creative, no "forever"/"chapter"/"family book/story", ask-first on real outside names.

## Current state

**Pins 1–123 are scheduled. Queue runs daily (12:00 PM) continuously through Aug 9, 2026.** Verified 2026-07-11: profile → Created → Scheduled Pins = **31 Pins** (26 new this session + ~5 leftover from the 71–97 batch for Jul 11–15 not yet posted).

- Pins 1–40: prior sessions. Pins 41–70: Jun 10 (May 21–Jun 18). Pins 71–97: Jun 16 (Jun 19–Jul 15).
- **Pins 98–123: scheduled 2026-07-11.** Dates July 16 – Aug 9, one/day at 12 PM (pin 123 doubled onto Aug 9 because Aug 10 was outside the 30-day cap that day).
- 4 boards live: Digital Baby Book Ideas, Baby First Year Milestones, Baby Shower Gift Ideas, Letters to My Child.

**Pins 98–123 were REALIGNED to rule #16 + privacy-first before scheduling (Dan's explicit call 2026-07-11).** The originally-generated 101–123 (and 98–100) leaned "first year / infancy / baby book" — which rule #16 forbids. Fix: regenerated 8 images (`scripts/gen_pins_realign.py`: pins 100, 102, 108, 113, 116, 117, 119, 123) to lead "not just a baby book / whole life journey" + private, keep the useful milestone-content pins, and rewrote EVERY description to lead lifelong + privacy and add lineage. Also fixed a word-ban slip (pin 117's image had said "story"). No price anywhere; placeholder names only.

- Images: `scripts/gen_pins_101_123.py` (pins 101–123) + `scripts/gen_pins_realign.py` (the 8 rewrites, same filenames). All in Supabase CDN (`pinterest-pins` bucket).
- CDN base URL: `https://vesaydfwwdbbajydbzmq.supabase.co/storage/v1/object/public/pinterest-pins/` (append `?v=2` when injecting after an upsert to dodge stale CDN cache).

## SOLVED: the working scheduling method (use this next session for 98–100)

Per pin: (1) JS canvas-inject the image + set link via setNativeValue + description via execCommand; (2) **click the Title field and TYPE the title with REAL keystrokes** — this is the critical step, scripted titles don't satisfy Pinterest's publish validation and the Schedule button silently no-ops; (3) board: JS `.click()` the `[data-test-id="board-dropdown-select-button"]` then `.click()` the option button by text — JS clicks WORK for board/buttons; (4) toggle "Publish at a later date" via JS `.click()` (resets OFF each pin; date then defaults to tomorrow, time to 12:00 PM); (5) **date: must use REAL clicks** — JS `.click()` does NOT register on calendar day cells. Real-click the date field, click "Next Month" if the target is in July, then real-click the day cell (aria-label "Choose <Weekday>, <Month> <D>(st/nd/rd/th), 2026"); (6) Schedule via JS: `.click()` the visible "Schedule" button, wait ~1.2s, `.click()` the modal's confirm "Schedule" button. Verify drafts count returns to 1 (orphan only).

## Known Issues (BOTH must be solved to schedule — learned 2026-06-15 eve)

### Issue 1: Tab must be the ACTIVE Chrome tab the whole time
Pinterest's React app uses streaming SSR with Suspense. When the tab is `document.visibilityState === "hidden"` (i.e. NOT the active tab in its Chrome window), the streaming scripts don't run, the UI never renders, AND screenshots/clicks freeze ("renderer unresponsive"). **Fix: Dan clicks the Pinterest tab and leaves it as the active tab in that Chrome window.** He CAN use other apps/windows freely — visibility only goes "hidden" when he switches to a *different tab within the same Chrome window*. Confirmed: clicking the tab → file input appears in 0ms; switching away → renderer freezes mid-task. Cannot be faked via `Object.defineProperty(document,'visibilityState',...)` — Chrome throttles on real tab state.

### Issue 2: The "Schedule" button no-ops when fields are set via JavaScript
When title/link are set with `setNativeValue` (native setter + input/change events), the DOM shows the value and "Changes stored!" appears, BUT clicking "Schedule" does nothing — the pin stays a draft ("30 days until expiration"). Strong hypothesis: Pinterest's publish validation reads React's internal controlled-state, which a scripted edit doesn't truly update, so publish silently aborts (button stays enabled, no error). **Fix to try next session: type the TITLE (and probably LINK) with REAL keystrokes via the `computer` type action, then click Schedule.** The image (canvas injection), board change (real click), and date (real calendar-day click) all worked fine — only the text fields set via JS are suspect.

**RESOLVED 2026-07-11:** the fix (real-keystroke title) is confirmed working — used it for all of 71–97 (Jun 16) and 98–123 (Jul 11). The orphaned draft "How to Write a Letter to Your Newborn" is GONE (it expired on its own — decision made itself). Drafts list is now clean/empty. **Cache note:** after an image upsert to the CDN, inject with a `?v=2` cache-buster or the canvas may pull the stale cached copy.

### Direct-API path is BLOCKED
Tried replicating Pinterest's internal `/resource/*Resource/get/` calls via `fetch` (with csrftoken) to bypass the UI entirely. Even replaying a call that succeeds from the page returns `403 Invalid Resource Request` — Pinterest has an integrity/signature check on resource requests. Not a viable bypass. UI automation is the only path.

### Empty draft `{}` returns from javascript_tool
The `javascript_tool` frequently returns `{}` (empty) for the async injection/board/schedule calls even though the code ran fine — just verify state with a follow-up simple JS read (title/board/date). Not an error.

## Pin 71–100 schedule (HISTORICAL — all scheduled)

One pin per day at 12:00 PM starting June 19, 2026. Board assignments:

| Pin | Filename | Board | Date |
|-----|----------|-------|------|
| 71 | pin71_first_24_hours.png | Baby First Year Milestones | Jun 19 |
| 72 | pin72_grandparents_visit.png | Digital Baby Book Ideas | Jun 20 |
| 73 | pin73_paed_visits.png | Baby First Year Milestones | Jun 21 |
| 74 | pin74_not_a_scrapbook.png | Digital Baby Book Ideas | Jun 22 |
| 75 | pin75_sneak_up_milestones.png | Baby First Year Milestones | Jun 23 |
| 76 | pin76_physical_vs_digital.png | Digital Baby Book Ideas | Jun 24 |
| 77 | pin77_week_before_one.png | Baby First Year Milestones | Jun 25 |
| 78 | pin78_letter_worst_day.png | Letters to My Child | Jun 26 |
| 79 | pin79_sounds_to_record.png | Baby First Year Milestones | Jun 27 |
| 80 | pin80_start_month_three.png | Digital Baby Book Ideas | Jun 28 |
| 81 | pin81_changes_fastest.png | Baby First Year Milestones | Jun 29 |
| 82 | pin82_what_makes_worth_using.png | Digital Baby Book Ideas | Jun 30 |
| 83 | pin83_second_baby_gift.png | Baby Shower Gift Ideas | Jul 1 |
| 84 | pin84_first_year_timeline.png | Baby First Year Milestones | Jul 2 |
| 85 | pin85_at_sixteen.png | Digital Baby Book Ideas | Jul 3 |
| 86 | pin86_gift_not_on_registry.png | Baby Shower Gift Ideas | Jul 4 |
| 87 | pin87_document_not_photograph.png | Baby First Year Milestones | Jul 5 |
| 88 | pin88_family_visits.png | Digital Baby Book Ideas | Jul 6 |
| 89 | pin89_month_twelve.png | Baby First Year Milestones | Jul 7 |
| 90 | pin90_sharing_vs_documenting.png | Digital Baby Book Ideas | Jul 8 |
| 91 | pin91_gift_grandparents_love.png | Baby Shower Gift Ideas | Jul 9 |
| 92 | pin92_before_first_birthday.png | Baby First Year Milestones | Jul 10 |
| 93 | pin93_five_sections_matter.png | Digital Baby Book Ideas | Jul 11 |
| 94 | pin94_dont_know_what_to_get.png | Baby Shower Gift Ideas | Jul 12 |
| 95 | pin95_what_to_write_first.png | Letters to My Child | Jul 13 |
| 96 | pin96_private_corner.png | Digital Baby Book Ideas | Jul 14 |
| 97 | pin97_three_am_letter.png | Letters to My Child | Jul 15 |
| 98 | pin98_gift_nobody_forgets.png | Baby Shower Gift Ideas | Jul 16 *(cap)* |
| 99 | pin99_day_before_changed.png | Letters to My Child | Jul 17 *(cap)* |
| 100 | pin100_complete_first_year.png | Baby First Year Milestones | Jul 18 *(cap)* |

Pins 98–100 dates are beyond today's 30-day cap (Jun 15 + 30 = Jul 15). Schedule them when the window opens (~Jun 18+).

## Canvas injection JS template

```javascript
(async () => {
  const url = "https://vesaydfwwdbbajydbzmq.supabase.co/storage/v1/object/public/pinterest-pins/[FILENAME]";
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  canvas.getContext("2d").drawImage(img, 0, 0);
  const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
  const file = new File([blob], "[FILENAME]", { type: "image/png" });
  const input = document.querySelector('input[type="file"]');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return `Injected ${file.name} (${file.size} bytes)`;
})()
```

## Key technical notes

- **Image injection method:** Canvas API → toBlob → DataTransfer → `input.files`. Bypasses Pinterest CSP. ONLY reliable method.
- **Date picker:** Must click the calendar day (typing alone doesn't update React state). Navigate months with `>` arrow. 30-day hard cap from today.
- **Background tab issue:** Pinterest's React streaming SSR doesn't hydrate in background tabs. Fix: tab must be brought to foreground by clicking it in Chrome.
- **Titles:** Use the headline text from each pin's gen_pins_71_100.py call as the pin title.
- **30-day cap:** Today (Jun 15) + 30 days = Jul 15. Pins 98–100 (Jul 16–18) can't be scheduled until ~Jun 18.

## Analytics (Last 30 Days: May 16–Jun 15, 2026)

- Impressions: 817 (+129%), Engagements: 43 (+258%), Saves: 6, Outbound clicks: 1
- **Top board: Baby First Year Milestones** — 479 impressions / 15 pins = ~32/pin average
- Digital Baby Book Ideas: 213 / 24 pins = ~9/pin
- Letters to My Child: 108 / 16 pins = ~7/pin
- Baby Shower Gift Ideas: Not in top 3 (low volume)
- **Top content type:** List/resource format pins outperform generic product pins per-impression

## Open items

- [ ] **STANDING: keep the queue 15–30 pins ahead (Dan's requirement).** The queue is now full to the 30-day Pinterest cap (through Aug 9). The cap advances 1 day/day, so to stay full someone must add ~1 pin/day. Pin 123 is on Aug 9 (doubled) because Aug 10 was outside the cap on Jul 11 — Aug 10+ opens up day by day. Next batch (pins 124+) needed to keep extending; **generate it lifelong+privacy-first per rule #16** (see gen_pins_realign.py as the model, NOT the older first-year-heavy gen_pins_101_123.py).
- [ ] **Profile bio still off-positioning:** reads "Your baby's story on their own private .com… a beautiful digital baby book…" — uses "story" + caps at baby book, doesn't lead with the whole-life-journey framing. Pre-existing (don't "chase"), but worth a Dan-approved rewrite to rule #16.
- [ ] **Board name "Baby First Year Milestones"** itself caps at first year (10+ pins live there). Consider a Dan-approved rename to something lifelong (e.g. "Childhood Milestones & Memories") — but it's the top SEO performer, so weigh carefully.
- [ ] Verify Pinterest tag 2613467907928 is installed on legacyodyssey.com
- [ ] Consider Idea Pins (awareness, no link) for broader reach

## Log

- **2026-07-11** — **Scheduled pins 98–123 (26 pins, Jul 16–Aug 9, 12 PM) → queue now full to the 30-day cap; 31 total scheduled.** FIRST reviewed all new cross-session rules per Dan; caught that the freshly-generated 101–123 (+98–100) violated the now-LOCKED rule #16 (they capped at "first year"). Per Dan's "full realign", regenerated 8 images (`gen_pins_realign.py`) + rewrote every description to lead "not just a baby book / whole life journey" + privacy-first + lineage; fixed pin 117's "story" word-ban slip. Orphan draft expired (resolved itself). Pin 123 doubled onto Aug 9 (Aug 10 outside cap).
- **2026-06-16** — **Scheduled all 27 pins 71–97 (Jun 19–Jul 15, 12 PM).** Cracked the Schedule-button blocker (real-keystroke title required) and the tab-focus requirement (Dan clicked the green-check Pinterest tab). Built the repeatable hybrid method (JS for image/board/toggle/schedule, real clicks for title + calendar date). Verified 30 scheduled pins on profile. Queue now extends to July 15 (was dying June 18). 98–100 remain (outside cap).
- **2026-06-15** — Analytics pulled (817 impr, top board = Baby First Year Milestones). Generated pins 71–100 (`gen_pins_71_100.py`). All 30 images uploaded to Supabase CDN. Scheduling blocked by background-tab React rendering issue.
- **2026-06-10** — Scheduled pins 41–70 (May 21–Jun 18 at 12:00 PM). Discovered Pinterest 30-day cap. Rewrote stale marketing/pinterest/pinterest.md. Adopted sessions/+STATUS.md protocol.
- **~2026-05-20** — Scheduled pins 1–40 (prior session).

---

## Standing morning routine (trigger: Dan opens with just "good morning" or no specific task)
1. Re-read CLAUDE.md, this brief, and the top of STATUS.md - start with the latest dispatcher NIGHTLY CLOSE / agenda entry.
2. Cross-check the board against your planned first task: if another session's entry conflicts with it, blocks it, gates it on a Dan decision, or already did it, surface that instead of proceeding.
3. Reply with: (a) your first task and why it's first, (b) what you're blocked on, (c) anything on the board that affects you. Then WAIT for Dan's go before starting any work.

## Standing shutdown routine (trigger: Dan says "goodnight", "end of session", "wrap up", or similar)
1. Update this brief: bump "Last session" to today, add a log bullet for today's work, rewrite Open items so the next session knows exactly what's next (mark anything waiting on Dan as "Blocked on Dan").
2. Update your detail file(s) (marketing/<platform>/<platform>.md, TODO.md, ops/, docs/ - whatever you touched) with anything from today's conversation not yet written down.
3. Add ONE entry to the top of STATUS.md in the documented format (Did / Others should know / Blocked on Dan).
4. If you have uncommitted changes that are complete work, commit ONLY your own files with a clear message. Never commit other sessions' files. Never push a deploy unless Dan agreed to it this session.
5. End with a 3-line goodnight summary for Dan to carry to the Dispatcher: what shipped today / what's first tomorrow / what you need from Dan.
6. Do not start anything new after the trigger.
