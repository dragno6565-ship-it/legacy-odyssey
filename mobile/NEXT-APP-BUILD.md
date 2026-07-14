# Next App Build — SINGLE submit at end of day

> Accumulate ALL app changes here, then build + submit **once** at end of day.
> Last shipped: **v1.0.27** — LIVE on BOTH stores (verified 2026-07-14: Apple lookup API
> and Play Store both report 1.0.27; Apple release date 2026-06-28). Includes the
> multi-video upload + Imperial/Metric unit toggle. Next version: **v1.0.28**.
> Do NOT trigger an EAS build until everything below is in.
> (2026-07-14: this file had gone stale — it still called 1.0.27 unbuilt two weeks after
> it shipped. Keep it current: update it in the SAME commit as a build/submit.)

## To include in v1.0.28
- [ ] **"Book" → "website/site" wording pass** (Dan, 2026-07-14): rename customer-visible
  "book" strings in the app — Settings "Book Password" → "Website Password", dashboard,
  screens, and the en/es/hi locale files (~53 EN strings). Product copy rule is saved in
  memory (feedback_websites_not_books). NOTE: locale files under mobile/src/i18n/locales
  are shared with the public site chrome — coordinate wording there too.
  OPEN DECISION (Dan): rename the public-site nav section "The Book"? And the App Store
  listing name is "Legacy Odyssey: Baby Book" — renaming that happens in App Store
  Connect / Play Console, NOT in a build; needs Dan's explicit OK.
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
