# Hardware — Recommendations & Priority

> What to buy, why, what it costs, and what it unlocks. Sorted by ROI for a
> solo founder shipping a live React Native app + Express web stack on
> Windows. Dan buys; this file tracks what's open and what's done.

Last updated: 2026-06-04

---

## P0 — Buy this week. Highest ROI.

### 1. Dedicated iOS test device (iPhone)
- **Why:** Every recent release (1.0.13, 1.0.14, 1.0.16, 1.0.17) was submitted
  to Apple WITHOUT a device test, per CLAUDE.md. We are gambling each
  release on the simulator + Expo web. A bad ship reaches paying parents
  and damages the brand for the cost of one device.
- **Recommendation:** **iPhone 14 (used, 128GB) on Swappa / Backmarket** —
  ~$350–400. Supports iOS 18+, runs all current features (camera, photos,
  Stream playback). Don't buy new — a 1-gen-old used device is the sweet
  spot.
- **Set up:** TestFlight install of every EAS build before submit. Dan
  works the golden path (signup → photo upload → video upload → preview)
  before the "Submit for Review" click.
- **Estimated cost:** $400 used, $700 new
- **Status:** 🔴 NOT BOUGHT

### 2. Dedicated Android test device
- **Why:** Same reason as iOS. Different rendering quirks; Dan's own
  Galaxy S25 Ultra is mentioned in TODO but isn't being used as a test
  fixture (it's his daily driver — risky to install dev builds on).
- **Recommendation:** **Pixel 8a** — $499 new, ~$350 used. Stock Android,
  fastest OS-update cycle, lowest-quirk reference device. Skip Samsung
  for testing (good-for-users, bad-for-test-fixtures — too many OEM
  variations).
- **Estimated cost:** $350–500
- **Status:** 🔴 NOT BOUGHT

**Combined P0 buy: ~$750 for a tested-release pipeline. Pays back the first
time we avoid a bad ship.**

---

## P1 — Buy this month. Real efficiency unlocks.

### 3. Second monitor (or upgrade primary)
- **Why:** ASC + Play Console + Supabase + a code editor + Chrome DevTools
  is a 4–6 pane workflow. The "ASC rendering bug — any scroll blanks the
  page" note in CLAUDE.md is partly a screen-real-estate problem.
- **Recommendation:**
  - If currently on 1×24": add a 27" 1440p (~$200 Dell S2722DC) as primary.
  - If already 27"+: add a vertical-mounted 24" for ASC/Play/log tailing.
- **Estimated cost:** $200–400
- **Status:** VERIFY current setup

### 4. UPS (uninterruptible power supply) for the workstation
- **Why:** A power blip mid-`git push` mid-`eas submit` mid-Supabase-DDL
  can leave the deploy in a broken half-state. Cheap insurance.
- **Recommendation:** APC BR1000MS2 (~$150) — 600W, 30+ minutes for a
  desktop + monitor + router.
- **Estimated cost:** $150
- **Status:** 🔴 NOT BOUGHT

### 5. External backup drive + offsite copy
- **Why:** Local `F:\legacy-odyssey` is the working tree. There's already
  an `F:\backups\backup.py` (per memory) — verify it's running on schedule
  and that backups also land OFFSITE (not just on the same machine).
- **Recommendation:**
  - 2 TB external SSD (Samsung T7 ~$130) for fast local restore.
  - Backblaze Personal ($9/mo) for unlimited offsite of the whole machine.
- **Estimated cost:** $130 + $9/mo
- **Status:** VERIFY current backup destination

---

## P2 — Buy this quarter. Quality-of-life + future-proofing.

### 6. Better internet / redundancy
- **Why:** Every customer signup, every Stripe webhook, every EAS upload
  goes through Dan's home connection. If it goes down for half a day, the
  business is functionally offline (for Dan as operator — customers are
  on Railway, unaffected).
- **Recommendation:** Verify current speed + uptime. If on cable, consider
  a 5G cellular backup ($25–50/mo) that auto-fails-over via a dual-WAN
  router (Synology RT6600ax ~$300).
- **Estimated cost:** $300 router + $25–50/mo cellular
- **Status:** VERIFY

### 7. Dev machine refresh
- **Why:** Expo web + Node + 3 Chrome windows + Cursor + a Supabase tab is
  RAM-hungry. If the current machine is < 32GB RAM, dev-loop drag is real.
- **Recommendation:** Only act on this AFTER verifying actual specs.
  If < 16GB RAM or HDD-not-SSD → priority. Otherwise hold.
- **Estimated cost:** $0–2000
- **Status:** VERIFY current specs first

### 8. iPad (for second-look on web book viewer)
- **Why:** App-store screenshots already include iPad variants
  (`screenshot4-ipad.png`, `screenshot5-ipad.png` per git status). The
  iPad layout of the customer book viewer should be QA'd on a real device.
- **Recommendation:** iPad (10th gen, base) — $349 new. One-time.
- **Estimated cost:** $349
- **Status:** ⚪ defer — nice to have, not blocking

---

## P3 — Defer / reconsider later

- NAS for local file storage (Synology DS224+) — overkill while solo.
- Mechanical keyboard / standing desk / chair upgrade — personal call, not
  business decision.
- Capture card for marketing video — only when actually shooting demo
  videos (C19 in TODO is on hold).

---

## Summary of recommended near-term spend

| When | Item | $ |
|---|---|---|
| P0 (this week) | iPhone test device | $400 |
| P0 (this week) | Android test device | $400 |
| P1 (this month) | 27" 1440p monitor (if needed) | $200 |
| P1 (this month) | UPS | $150 |
| P1 (this month) | Backup SSD + Backblaze | $130 + $9/mo |
| **P0+P1 one-time total** | | **~$1,280** |
| **Recurring add** | | **+$9/mo** |

Cheaper than one bad-release refund/chargeback storm, by a lot.
