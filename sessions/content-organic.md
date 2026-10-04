# Session: Content & Organic Social

> Instagram, TikTok, and blog content. (Facebook page has its own session.)

**Last session:** ~2026-05-20 (blog work)

## Scope
- Owns `marketing/content-organic/content-organic.md` (detail) + `marketing/blog/`
  (drafts; live blog pages are EJS in `src/views/marketing/` — publishing changes route
  to the CODING session).

## Read first (beyond CLAUDE.md + STATUS.md)
- `marketing/content-organic/content-organic.md` — the detail file.
- `marketing/blog/README.md` — blog pipeline.
- `marketing/_BRIEF.md` + memory hard rules (no real names, no "forever"/"chapter"/
  "family book", canonical product description verbatim).

## Current state
- 9 blog articles live on the site (light-theme fix shipped 2026-05-22).
- See the detail file for IG/TikTok state.

## Open items
- [ ] Detail file is stale (2026-05-03) — refresh from session history (prompt in
      `marketing/HANDOFF-other-sessions.md`).

## Log
- **2026-06-10** — (dispatcher) File created during the cross-session reorg.

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

## Archive review 2026-10-04 (retired content-organic and email sessions)
- Two live blog posts duplicate each other: /blog/getting-started-guide and /blog/getting-started-with-legacy-odyssey (both routed in src/routes/book.js and the sitemap). Dan has not picked the canonical one (open).
- Never written though flagged as deserving a post: the /demo walkthrough (write it around plain legacyodyssey.com, never link /demo), gift options (gifting a site, gift codes) and Their Keepsakes. The eco post `marketing/blog/11-sustainable-baby-book.md` was approved by Dan 2026-06-30 ("I want the blog posted") but no blog-*.ejs exists for it as of 2026-10-04.
- Live blog `blog-circles-sharing.ejs` still says "circles" 21 times and some audit edits may never have been published; blog-what-to-write-in-baby-book.ejs has old banned words (leave per the do-not-chase rule unless Dan asks).
- UI labels change: verify the live editor before quoting nav labels in posts (the hub was "My Book" with Your Contacts > Contact List and Circles in June).
- Canva brand kit "Legacy Odyssey" (id kAHFKVqrch0): generate-design with cream #faf7f2 and soft gold returned on-brand text cards.
- Lessons: check the roster and role before building a deliverable (a full 2-week calendar duplicated facebook's job); verify product claims against shipped code before writing walkthroughs (a draft claimed the editor ships with preset family members; it is a clean slate). Dan iterates heavily per post, so build one sample and get approval before batching.
- TikTok stand-up (Reel candidates 1, 5, 8) was blocked on Dan's greenlight; no answer recorded.
