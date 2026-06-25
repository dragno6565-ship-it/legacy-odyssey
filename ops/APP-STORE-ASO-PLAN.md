# App Store Listing Optimization (ASO) — make the listings sell

> Goal (Dan, 2026-06-25): get the iOS + Android store listings looking great so they
> actually sell the app. Copy below is ready to paste into App Store Connect + Play
> Console. **Per rules #1/#2: do NOT submit for review without Dan's explicit go.**
> **Per rule #8/#9: iOS + Android stay matched (parity).** Word bans + canonical
> description respected; no real names (use "Your Child's Name").

## Current state (pulled 2026-06-25)
**App Store (App ID 6760883565):**
- Name: `Legacy Odyssey` · Subtitle: `Your Baby's Own .com Domain`
- Category: Lifestyle · Rating: **5.0 (only 2 ratings)** · Free + IAP ($29 yr1 → $49.99/yr)
- Description leads with the canonical hook; mentions a "Time Vault."
- **Play listing: could not read programmatically (JS-rendered) — VERIFY in Play Console; must mirror the below.**

## The 3 problems killing discoverability + conversion
1. **No search keywords in the Name or Subtitle.** Neither contains "baby book" — the #1
   term parents actually search. Apple weights the app NAME highest, then subtitle, then the
   keyword field. We're invisible for our own category.
2. **Only 2 ratings.** Ratings drive both ranking and tap→install conversion. Competitors have
   thousands (Tinybeans 150k+, Qeepsake ~17k). 2→20+ is a fast, high-impact lift.
3. **Screenshots aren't selling the wedge first.** The first 1–2 screenshots are ~80% of the
   conversion decision; they must lead with "your baby gets their name as a website."

---

## DRAFTED COPY — paste-ready

### App Store
Name (≤30): 
```
Legacy Odyssey: Baby Book
```
Subtitle (≤30):
```
A baby book at their own .com
```
Keywords field (100/100, hidden; commas, NO spaces; single words):
```
digital,milestone,tracker,journal,memories,newborn,first,year,keepsake,website,pregnancy,shower,gift
```
> Maxed 100/100 with highest-value terms (Dan: "really get the best" + add journal). Single words,
> commas, no spaces — Apple auto-combines with name+subtitle ("baby/book/.com") → digital baby book,
> baby milestones, milestone tracker, baby journal, pregnancy journal, baby memories, newborn,
> baby's first year, baby keepsake, baby book website, baby shower gift, baby gift. `journal` is a
> HIDDEN discovery term only (Dan approved; not customer-facing). Dropped infant/growth/photos/album
> as lower-value. Volumes directional; ~$0–70 AppTweak trial would confirm before lock.

Promotional Text (≤170, updatable anytime WITHOUT a review) — NO price:
```
Your baby gets their name as a website. Add milestones, photos, and letters from your phone. Family visits the private site at your-childs-name.com, in any browser.
```
Description (NO price; website-led per rule #14; current shipped features only — NO video Moments):
```
Legacy Odyssey is a digital baby book, built as a real website at your child's own .com domain. Your baby gets their name as a website (your-childs-name.com): you fill it in from your phone, and your family visits it in any browser. Private and password-protected.

There's only one your-childs-name.com. This is where it lives.

FILL IT IN FROM YOUR PHONE
• Your Birth Day and the birth story
• Month-by-month milestones (months 1 to 12)
• Growth tracking (weight and length)
• Letters to your child, kept in The Vault to open later
• Custom photo galleries, up to 50 photos each
• Family member pages and family recipes
• Your Journey to Us, for every kind of family

SHARE IT WITH EXACTLY WHO YOU CHOOSE
Add your contacts, then share the site with the people who matter. When you add something new, send them an update. They tap a private link and the website opens. No app to download, no account to make.

PRIVATE BY DESIGN
No ads. No algorithms. No public profiles. Your child's site is password-protected and seen only by the people you invite.

THE APP AND THE WEBSITE
You create in the app; your family sees the finished website at their .com, on any phone, tablet, or computer, anywhere.

WHAT'S INCLUDED
The .com domain, hosting, unlimited photos, and the iOS and Android app.

Give your child their own corner of the internet.
```
> NOTES: (1) canonical description's closing "$29 for the first year" dropped per no-price rule.
> (2) Website-led per rule #14 (kept "digital baby book" only in the opener for the ASO keyword).
> (3) Excludes video "Moments" — NOT shipped; don't list unavailable features (Apple rejection + brand-truth).
> (4) Word bans clear: no forever/permanent, no chapter, no Time Vault, no family-book/story, no scrapbook/journal/album analogy.

### Google Play (mirror — verify current state in Console first)
Title (≤30):
```
Legacy Odyssey: Baby Book
```
Short description (≤80):
```
A digital baby book at your child's own .com. Milestones, photos, and letters.
```
Full description: use the App Store description above (Play allows 4000 chars and rewards
the keyword "baby book" appearing a few times naturally — it already does).

---

## Screenshots (the real conversion lever) — first 3 matter most
All: brand fonts (Cormorant + Jost), cream/gold, emoji-free, ONE caption overlay each, placeholder
"Your Child's Name" (NEVER a real name or real-looking domain — only your-childs-name.com).
1. **Hero — "Your baby gets their name as a website."** Clean mock of `your-childs-name.com`.
2. **"Fill it in from your phone."** App editor — Your Birth Day / a milestone.
3. **"Family visits the website. Password-protected."** Live site in a browser + lock.
4. **"The whole first year, month by month."** Month-by-month grid.
5. **"Share with exactly who you choose."** Contacts + send-an-update.
6. **"Letters to open later. Galleries. Recipes."** Calm section collage.
(iPad variants already exist; keep them matched. Owner: coding/design.)

## Marketing video brief (Dan camera-shy — NO face-to-camera; screen-capture + text + music)
**A. App Store App Preview (≤30s, caption-driven):** (0–4s) "Your baby gets their name as a
website." · (4–12s) type a name → your-childs-name.com appears available · (12–20s) quick app
editing (photo, milestone, letter) · (20–27s) finished site on a laptop, family scrolling, lock
icon "Private. Password-protected." · (27–30s) logo + "their own corner of the internet." NO price.
**B. Short social videos (content-organic, on-voice):** "There's only one your-childs-name.com.
Right now it's still available." (name-search screen-capture; homepage link only, never /demo, no
price) + the "quote the funny thing your kid said" recurring series (funny AND shows what the site saves).
Owners: App Preview + screenshots = coding/design; social videos = content-organic.

## Reviews play (2 → 20+) — biggest single ranking + conversion lift
- **In-app prompt (coding):** `SKStoreReviewController` (iOS) / In-App Review API (Android) fired
  after a positive moment — e.g., after the user saves their 3rd entry or completes a share.
  Apple caps it at 3 prompts/user/year; let the OS handle throttling.
- **Direct ask (Dan):** email the 7 paying customers + the comp influencers a one-line request
  with the write-a-review deep link. Even 10–15 genuine reviews transforms the listing.

## How this reframes the ASA question (correcting the earlier brief)
The earlier report leaned too hard on "Meta proved paid fails." Dan's right — Meta was broad
interruption to cold audiences; App Store **search** is high-intent (people typing "baby book
app"). That's a fundamentally different, better audience. The honest position:
- **Fix the listing first** (this doc). It lifts organic ASO now AND is the prerequisite for any
  fair ASA test — you can't judge ads against a listing that doesn't convert.
- **Then a small, targeted ASA test** on high-intent exact terms is a legitimate experiment
  (not a foregone loss like Meta). Judge it on real install→pay CAC vs the $29/$49.99 economics.

## Ownership / next steps
- **Copy + screenshots:** ready here. Screenshot production = coding/design (brand assets exist).
- **Implement:** edit metadata in App Store Connect + Play Console (coding/Dan). Promo text can
  go live immediately (no review); name/subtitle/keywords need a version submission — **bundle
  with the next build, and DO NOT submit without Dan's go (rules #1/#2).**
- **Parity:** apply to iOS + Android together.
