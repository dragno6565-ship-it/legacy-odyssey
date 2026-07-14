# Next App Build — SINGLE submit at end of day

> Accumulate ALL app changes here, then build + submit **once** at end of day.
> Last shipped: **v1.0.28** (book -> website wording pass, EN/ES/HI) — BUILT + SUBMITTED
> 2026-07-14 (Dan GO): Android submitted to Play production (versionCode 42, COMPLETED);
> iOS binary uploaded to App Store Connect (build 42, processing) — may need the
> "Submit for Review" click in ASC once processing finishes (Dan). Next version: **v1.0.29**.
> Do NOT trigger an EAS build until everything below is in.
> (2026-07-14: this file had gone stale — it still called 1.0.27 unbuilt two weeks after
> it shipped. Keep it current: update it in the SAME commit as a build/submit.)

## To include in v1.0.29
- (v1.0.28 shipped the wording pass. Dan ruled 2026-07-14: leave the public-site nav
  "The Book" and the App Store listing name ALONE — do not rename them.)
- [ ] **Native video playback (#4)** — swap the WebView for a native player. ONLY needed
  if Dan's retest of the shipped video player shows the preview still just spins.
  (Still pending Dan retest — carried over from 1.0.27 planning.)
- [ ] Verify the app honors a book's `default_language` if one was chosen at
  purchase/gift. Checked 2026-07-14: no `default_language` reference in mobile/src —
  the app auto-detects device language + has manual override, which likely covers it,
  but confirm the intended behavior before closing.

## Notes
- The wording pass + default_language check are JS-only. The native-video swap (#4)
  adds a native module → genuinely needs a build.
