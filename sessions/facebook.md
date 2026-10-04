# Session: Facebook (organic page)

> Runs the Legacy Odyssey Facebook page + Instagram (@legacyodysseyapp): organic
> posts, page setup, engagement. Paid Meta ads are a SEPARATE session
> (`meta-ads.md`) — ad strategy/creative concepts may originate here but campaign
> execution belongs there.

**Last session:** 2026-06-10 (night — video post live; cross-posting investigated)

## Scope
- Owns `marketing/facebook/` — `facebook.md` (account/state detail),
  `BRAND-VOICE-GUIDE.md`, `fb-posts/` (drafts/queue/posted).
- Cross-link: video-ad creative drafts in `fb-posts/drafts/video-ad/` will hand off
  to `sessions/meta-ads.md` when Dan is ready to launch.

## Read first (beyond CLAUDE.md + STATUS.md)
- `marketing/facebook/facebook.md` — the detail file (state, posts, accounts,
  queue, ad concepts, known issues, open items). **Treat that as source of truth.**
- `marketing/facebook/BRAND-VOICE-GUIDE.md` — voice rules.
- `marketing/_BRIEF.md` — shared marketing brief.
- Memory hard rules: no real family names, canonical product description verbatim,
  no `forever` / `chapter` / `Time Vault` / `family book`.

## Standing rules (project-wide, but enforced strongly here)
- **No pricing in ad creative or organic posts** unless Dan explicitly says so
  (rule set 2026-06-05).
- **Vault is not a featured product angle on its own** — only mention in
  combination with another feature (e.g., video letters opened at 18).
- **App-not-required** — never imply mobile app is necessary; web editor is equal.

## Current state
- See `marketing/facebook/facebook.md`. Highlights:
  - 32 FB followers; growing.
  - 8-post approved queue lives permanently in `fb-posts/queue/` (1 posted, 7 to go).
  - Video announcement explainer posted today (2026-06-10) to FB + IG.
  - Privacy Test Meta Ads campaign ended 2026-06-05 — needs final read from
    meta-ads session.
- Several brand-voice violations remain in production that Dan opted not to fix:
  Time Vault in bio, "Forever yours" in Featured post, CHAPTER labels in demo.

## Open items

### Blocked on Dan
- [ ] **Flip the IG → FB cross-post toggle in the IG mobile app**
      (Profile → ☰ → Accounts Center → Sharing across profiles → Posts →
      Share to Facebook → pick Legacy Odyssey). Confirm when done. The
      browser-side path is broken; mobile is the only working route.
- [ ] **Decide how to handle the Rayan Collab backfill** (Jun 3 carousel,
      17.9K views, in collaboration with @legacyodysseyapp — Business Suite
      blocked the share to FB because Dan is co-author, not publisher):
      either (A) Claude downloads + reposts natively on FB with credit
      "@rayanved", or (B) Dan DMs rayanved asking them to share-to-FB.

### Ready for next session
- [ ] **Test "Share to Facebook"** in Business Suite Content view on a
      Dan-published past IG post (Journey to Us Jun 5 first). If it works,
      mirror it + the video announcement (Jun 10 IG post). Likely works
      since Dan is the publisher, not a co-author — the Collab limit only
      hit on rayanved's post.
- [ ] If share-to-FB works on Dan's own IG posts, batch-mirror past organic
      IG posts to close the IG/FB gap fast.
- [ ] **Continue the approved-8 queue.** Next likely: V5 deadpan field note
      or a funny one (#1 outgrow, #2 slept-through). **#6 (videos) is blocked**
      on revising the oversized play-button overlay before posting.
- [ ] If Dan re-opens video ad work: build a **no-pricing** creative
      (concept-4 grandma is the best direction) and hand to `meta-ads.md`
      for launch.
- [ ] Reels production is the unbuilt growth lever (the only format Meta
      pushes to non-followers). No face-to-camera needed.

### Eventually
- [ ] "Time Vault" still in FB page bio.
- [ ] "Forever yours." + "family's most precious moments" still in the
      April-3 Featured post.
- [ ] CHAPTER labels in the live demo — for `sessions/coding.md`.

## Log
- **2026-06-10 (night)** — Cross-posting investigation. Drove Meta Business
  Suite to find the IG → FB auto-toggle (lives ONLY on the IG side, mobile
  app is the practical path). Pulled up the published-posts table — found
  the **rayanved Collab from Jun 3 (17.9K views, 266 likes, 76 shares, in
  collaboration with @legacyodysseyapp)** as the highest-value mirror
  candidate, but the post `...` menu only offered "Reshare to story" /
  "Copy post ID" because Dan is co-author, not publisher. Documented the
  full path forward + Meta limitation in `marketing/facebook/facebook.md`.
- **2026-06-10 (day)** — Posted the **video announcement explainer card**
  (hero photo of laughing baby + 3-section explainer: where videos appear,
  what people can save) to FB + IG. Built at `drafts/video-posts/POST-
  explainer-hero.png` after iterating through V1-V5, A1-A3, and a typography
  variant — Dan wanted plain "explain what it does, where, what they can do"
  format. Drafted 5 video-feature ad concepts (`drafts/video-ad/concept-1..5`,
  including a no-pricing concept-5 announcement) — none launched, Dan
  prefers concept-4 grandma direction for emotional pull. Walked Dan through
  the **Share-arrow → Share to your Feed** flow as the right way to amplify
  brand posts to his personal timeline. Confirmed Privacy Test campaign
  ended 2026-06-05.
- **2026-06-10 (day)** — Adopted the sessions/+STATUS.md protocol mid-day;
  rewrote `marketing/facebook/facebook.md` from stale May-7 state.
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


## Archive review 2026-10-04 (retired facebook transcript, 2026-05-15 to 2026-08-05)

**How the session ended:** nothing posted after 2026-07-14 (wake-windows, FB + IG). On 2026-08-05 Claude asked whether to start the content-organic 24-post batch (P2 swaddle vs sleep-sack, or P1 tummy time) and shelve the funny experiment; no answer recorded. All 6 funny-batch candidates (marketing/facebook/fb-posts/drafts/funny-batch/) were REJECTED by Dan; four funny batches have failed in total. Per-post "post it" approval is still required.

**Standing rules confirmed (full text in memory):** emojis ARE allowed in social posts (banned only in the product UI; corrected 2026-10-04); feature announcements are plain "now has X / what it does / where it lives / what you can do"; stock-photo babies are gender-neutral and photos must literally match the caption; privacy-first when a post touches the .com angle; never claim "100% private"; funny posts need a photo and the image must be the joke; photos first, captions after (07-20); Dan sometimes posts on FB by hand and says "I posted it" (do not redo).

**Posting procedure (used 20+ times):**
1. Open the page in a NEW tab and confirm the account: FB page "Legacy Odyssey" (facebook.com/profile.php?id=61575479945803, no vanity URL) and IG @legacyodysseyapp (logged-in name top right).
2. FB: click "What's on your mind?" (NOT "Note", which opens a 24-hour Note). Type the caption and verify it by reading the contenteditable text via JS (a screenshot once showed stale text). Photo/video opens the native picker: Dan selects the F: file and says "done". Next; settings must read Public / Publish now / Boost OFF (a misclick turned Boost on once). Publish. Dismiss the WhatsApp / "Call Now" upsell ("Not now"). Confirm the post is on the timeline (once only the caption had been staged).
3. IG web: Create (+) > Post (the icon can open Notifications or the Professional dashboard by mistake) > Select from computer (Dan picks the file) > Crop (already square) > Next > Filter = Original (a stray click applied Clarendon once) > Next > caption > check the "Share to" toggles > Share; wait for "Your post has been shared" (the first Share click sometimes does not register). Convert cards to JPG first (the uploader hung on PNGs). If the Create dialog freezes, reload instagram.com.
4. The IG "Share to Facebook" toggle shares to Dan's PERSONAL profile ("Share to Dan Ragno") and is sticky: check it and ask on every IG post.
5. Scheduling: FB composer > Next > Post settings > Scheduling options > Schedule for later > date/time > Save > "Schedule". IG web has no native scheduler; Meta Business Suite Planner/Composer is the route (needs IG linked; it demanded an IG login once). Never completed or tested.
6. Showing creatives to Dan: the image viewer opens behind Chrome; open the containing F: folder in Explorer and let him double-click.
7. Never put the placeholder domain as a bare or www URL in a FB caption: it generated a dead link-preview card that ranked in FB search (05-12 post).

**Creative sourcing:** Pexels only (free, commercial use, no attribution). Pexels returns 403 to scripts and blocks headless Playwright: use the connected Chrome to collect image ids, then download the ORIGINAL from the CDN without ?w= / auto=compress, or use Dan's own download in Downloads. Good search terms for real candids: messy baby, baby crying, surprised baby, baby unimpressed, tired parent newborn, baby yawning, baby hand to mouth. Square-crop to 1080 with PIL. Brand fonts for creatives: F:\legacy-odyssey\ads\fonts\ (Cormorant Garamond display, Jost body); colors cream #faf7f2, dark #1a1510, gold #c8a96e. Demo screenshot posts: capture from the LIVE demo at post time (never the repo images), FB = native landscape, IG = square framed card (voice-test/demo_ig_frame.py); a banned word in a capture can be painted out with a background-colored rectangle. PNG export pipeline: export_server.py on port 9880 + html2canvas; open each PNG in a fresh tab.

**Posts that went live 2026-05-15 to 05-27 but were missing from the log:** yawn (POST-TODAY.jpg), wet-diaper count (POST-TODAY-2.jpg, posted with the UNCORRECTED numbers at Dan's choice; it predates the AAP/Mayo sourcing rule), messy eater (POST-TODAY-3.jpg), Keepsakes (POST-TODAY-4.jpg), Funny 1 (POST-F1), Witching hour (POST-U1), Product 1 website (POST-P1), Funny 2 (POST-F2), Hunger cues (05-27, photo only, Dan picked Pexels 5936271). Pexels IDs per post are in review_6.py / make_mockups.py.

**Facts:** organic IG Features post is instagram.com/p/DZ5ffimD1vA/ (the negative comments were on the boosted ad object). The 2026-05-15 page audit found no CTA button, no reviews, no Group; those hygiene items were never decided. Phishing DMs ("Notification of page" with an identical PDF from two personal profiles, plus "Meta Maneger") remain in the Business Suite inbox; Dan said leave them; 2FA on the page admin account was never confirmed. An IG collab failed with "no access to Instagram Music" because @legacyodysseyapp is a Business account (restricted music library); fixes: switch to Creator (phone app only, reversible) or the collaborator uses a business-available track. Dan has not decided. Do not call a trusted contact's error a scam without researching it first.

**If the session output degenerates** (it once printed one word thousands of times), restart or compact the session instead of continuing.
