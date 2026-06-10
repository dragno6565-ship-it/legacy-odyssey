# Store Listing Copy — v1.0.7

> **DAN: paste these into App Store Connect / Play Console manually. Do not submit through Claude.**
> Updated: April 29, 2026
> Build IDs:
>   - Android (AAB): `2c5ce049-1bdb-4ee6-94d7-b2381fbd0f16` — versionCode 17
>   - iOS:           `148d3e2d-1d10-4dfb-8cdb-f8c85297e61f` — buildNumber 19
> Watch builds: https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds

---

## 🍎 APPLE APP STORE (App Store Connect)

URL: https://appstoreconnect.apple.com/apps/6760883565/distribution/ios/version/inflight

### App Name (no change)
```
Legacy Odyssey
```

### Subtitle  ← CHANGE THIS  (current: "Baby Books & Photo Albums")

```
Your Baby's Own .com Domain
```

### Keywords  (comma-separated, 100-char max)

```
baby book,baby milestone,newborn,digital baby book,family album,baby memories,pregnancy journal,infant
```

### Description

```
Your baby deserves their own corner of the internet.

Legacy Odyssey gives every child a real .com domain — like your-childs-name.com — a private, beautifully designed baby book that lives on their own website for as long as you choose.

Not a social media post. Not a camera roll. A permanent piece of the internet dedicated entirely to your child's story.

———

YOUR BABY'S OWN .COM
Every family gets a real .com domain, automatically purchased and configured the moment you sign up. It belongs to your family. Nobody else can ever claim it.

BABY BOOKS & FAMILY ALBUMS
Document your baby's first year chapter by chapter — or build a family album that spans generations. Both products are beautifully designed and ready to fill in from your phone.

WHAT'S INSIDE YOUR BOOK
✦ Birth story, coming home, and monthly milestones (months 1–12)
✦ Growth tracking — weight, length, and every first
✦ The Time Vault — letters written today, sealed until their 18th birthday
✦ Family member profiles with photos and stories
✦ Family recipes passed down through generations
✦ Before You Arrived — pregnancy journey and nursery memories

SHARE WITH EVERYONE YOU LOVE
Give grandparents, aunts, uncles, and friends your book's web address and shared password. They can watch your child grow from anywhere in the world — no account needed to view.

COMPLETELY PRIVATE
Password-protected. No ads. No algorithm. No public profile. Your family's memories are visible only to the people you choose. Unlike Instagram or Facebook, no platform change can hide your content or shut it down.

EASY TO USE
Fill in sections whenever you have a spare moment. Add photos directly from your phone. Changes appear on the website instantly. No technical skills needed.

———

PLANS
✦ $29 your first year — introductory offer
✦ Then $49.99/year — cancel anytime
✦ Or $4.99/month + one-time $5.99 setup fee
✦ Everything included: .com domain, hosting, unlimited photos, app access

Check if your baby's name is still available at legacyodyssey.com
```

### What's New in v1.0.7

```
This update brings Lucide line-art icons throughout the app — replacing emoji with elegant, consistent icons in the Legacy Odyssey gold. Cleaner, more refined, and consistent across all devices.

Also in this version: performance improvements and bug fixes.
```

---

## 🤖 GOOGLE PLAY (Play Console)

URL: https://play.google.com/console/u/2/developers/7255543911428830238/app/4975186349665269659/app-dashboard

### App Title (no change)

```
Legacy Odyssey
```

### Short Description  (80-char max)

```
Your baby's own .com. A private, beautiful baby book on their own website.
```

### Full Description  (4,000-char max)

```
Your baby deserves their own corner of the internet.

Legacy Odyssey gives every child a real .com domain — like your-childs-name.com — a private, beautifully designed baby book that lives on their own website for as long as you choose.

Not a social media post. Not a camera roll. A permanent piece of the internet dedicated entirely to your child's story.

YOUR BABY'S OWN .COM
Every family gets a real .com domain, automatically purchased and configured the moment you sign up. It belongs to your family. Nobody else can ever claim it.

BABY BOOKS & FAMILY ALBUMS
Document your baby's first year chapter by chapter — or build a family album that spans generations. Both products are beautifully designed and ready to fill in from your phone.

WHAT'S INSIDE YOUR BOOK
✦ Birth story, coming home, and monthly milestones (months 1–12)
✦ Growth tracking — weight, length, and every first
✦ The Time Vault — letters written today, sealed until their 18th birthday
✦ Family member profiles with photos and stories
✦ Family recipes passed down through generations
✦ Before You Arrived — pregnancy journey and nursery memories

SHARE WITH EVERYONE YOU LOVE
Give grandparents, aunts, uncles, and friends your book's web address and shared password. They can watch your child grow from anywhere in the world — no account needed to view.

COMPLETELY PRIVATE
Password-protected. No ads. No algorithm. No public profile. Your family's memories are visible only to the people you choose. Unlike Instagram or Facebook, no platform change can hide your content or shut it down.

EASY TO USE
Fill in sections whenever you have a spare moment. Add photos directly from your phone. Changes appear on the website instantly. No technical skills needed.

PLANS
✦ $29 your first year — introductory offer
✦ Then $49.99/year — cancel anytime
✦ Or $4.99/month + one-time $5.99 setup fee
✦ Everything included: .com domain, hosting, unlimited photos, app access

Check if your baby's name is still available at legacyodyssey.com
```

### Release Notes for v1.0.7  (500-char max)

```
This update brings Lucide line-art icons throughout the app — replacing emoji with elegant, consistent icons in the Legacy Odyssey gold. Cleaner, more refined, and consistent across all devices.

Performance improvements and bug fixes.
```

---

## SUBMISSION SEQUENCE  (when you're ready)

### iOS

1. Go to App Store Connect → Apps → Legacy Odyssey → +Version (`1.0.7`)
2. Update **Subtitle** to `Your Baby's Own .com Domain`
3. Update **Keywords** (above)
4. Update **Description** (above)
5. Paste **What's New** (above)
6. **Build:** select Build 19 once it shows up under TestFlight Build Uploads (auto-uploaded by EAS)
7. Submit for Review

### Android

1. Play Console → Legacy Odyssey → Production → Create new release
2. **Add from library:** select the v1.0.7 (versionCode 17) AAB once EAS finishes uploading
3. Update **Short Description** + **Full Description** (above)
4. Add **Release Notes** (above) under "What's new in this release"
5. Save → Review release → Start rollout to Production

---

## CHECKLIST BEFORE YOU SUBMIT

- [ ] Both EAS builds finished green (check expo.dev links above)
- [ ] iOS Build 19 visible in App Store Connect under TestFlight → Build Uploads
- [ ] Android v1.0.7 (versionCode 17) visible under Play Console → App library
- [ ] App Store screenshots still accurate for v1.0.7 (the new Lucide icons may show in some screens — re-take if conspicuous)
- [ ] Quick smoke test of the new build via TestFlight / internal track before pushing to production

---

**Build artifacts will appear in EAS once builds finish. Auto-uploads to ASC + Play Console are NOT enabled — you submit when you're ready.**
