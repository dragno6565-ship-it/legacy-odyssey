# Next App Build — SINGLE submit at end of day

> Accumulate ALL app changes here, then build + submit **once** at end of day.
> Last shipped: **v1.0.26** (Hindi) — in review. Next version: **v1.0.27**.
> Do NOT trigger an EAS build until everything below is in.

## To include in v1.0.27
- [ ] In-app **Imperial/Metric unit toggle** for month weight/length (reads/writes book `unit_system`; depends on Phase 2 backend)
- [ ] **Multi-video select upload** (#1) — UploadContext queue rework so several videos can be picked + queued at once
- [ ] **Native video playback** (#4) — swap the WebView for a native player. ONLY needed if Dan's retest of 1.0.26 shows the preview still just spins. (Pending Dan retest.)
- [ ] Verify the app honors a book's `default_language` if one was chosen at purchase/gift (app already auto-detects + has manual override — likely no change)

## Notes
- All items are JS-only **except** the native-video swap (#4), which adds a native module → genuinely needs a build. The rest would be OTA-able if OTA were ever set up.
- Backend/web (Phase 2) lands first so the app has `unit_system` + `default_language` to talk to.
