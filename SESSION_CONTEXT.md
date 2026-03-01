# Legacy Odyssey - Session Context (March 1, 2026)

## What We're Working On
The mobile app is NOT showing photos and text that exist on www.eowynhoperagno.com.

## Root Cause Found & Fixed (Server-Side)
The `/api/families/mine` endpoint was crashing because it tried to SELECT a `plan` column
that doesn't exist in the `families` table. This blocked the mobile app's session restore
(AuthContext.fetchUserData calls this endpoint first), which prevented content from loading.

**Fix:** Removed `plan` from the select query in `src/routes/api/families.js`.
**Deployed:** Commit 31b99b4, pushed to Railway, endpoint now returns correct data.

## Current Status
- Server fix is LIVE and verified working via curl
- User has the latest APK installed (EAS Build: d00f6de8-00fc-4089-b27f-d40cc9b37504)
- User needs to log out and log back in (or reinstall) to clear stale session state
- User has NOT yet confirmed if content now shows after re-login

## API Verification (all confirmed working)
- `GET /api/families/mine` → returns family with childName "Eowyn Ragno", hasBook: true
- `GET /api/books/mine` → returns full book with child info, 12 months, password, subdomain
- `GET /api/books/mine/before` → returns 4 cards with photos and text
- Database has content: before_arrived_cards (4 with photos), months (12, 1 with photo),
  family_members (6 with photos), birth_stories (1)

## Key Database Records
- Family ID: fb16691d-7ea4-4c93-9827-ffe8904ced6b
- Auth User ID: ef8926bc-908a-43f0-afb3-2117913b85b9
- Email: dragno65@hotmail.com
- Book ID: 501e0807-d950-4004-8b4c-9b0f0ce0c910
- Subdomain: eowynragno
- Custom Domain: eowynhoperagno.com
- Book Password: legacy

## Changes Made This Session

### 1. Token Refresh + Session Restore (mobile/src/api/client.js)
- Added automatic 401 retry with refresh token in response interceptor
- Handles concurrent requests during refresh (queue pattern)
- Sends `X-Family-Id` header with every request for multi-book support

### 2. AuthContext Rewrite (mobile/src/auth/AuthContext.js)
- Session restore now validates token by fetching family data from API
- If token expired, tries refresh before logging out
- Tracks `families` array and `activeFamilyId` state
- New `switchFamily()` and `refreshFamilies()` methods
- Login stores refresh token and fetches families list

### 3. Multi-Book Dashboard (mobile/src/screens/DashboardScreen.js)
- Shows current book's domain in header (e.g., eowynhoperagno.com)
- "Switch" button appears when user has 2+ books
- Bottom sheet modal lists all books with child name and domain
- Tapping a different book switches active family and reloads content

### 4. Backend: Multi-Book Support
- `src/middleware/requireAuth.js` - Accepts `X-Family-Id` header, falls back to first family
- `src/routes/api/families.js` - NEW: `GET /api/families/mine` lists all families for user
- `src/routes/api/auth.js` - Added `POST /api/auth/logout` endpoint
- `src/server.js` - Registered families route

## Git Info
- All code pushed to: github.com/dragno65/legacy-odyssey (main branch)
- PAT: stored in .env (not committed)
- Latest commit: 31b99b4 (Fix families endpoint)

## Credentials
- All credentials stored in .env file and Railway env vars (not in repo)
- Railway API: legacy-odyssey-production-a9d1.up.railway.app
- Stripe (test mode): configured on Railway with 6 price IDs

## Pending Tasks
1. **ACTIVE: Verify mobile app shows content** - user needs to log out/in or reinstall
2. Test the new success page end-to-end (another test checkout)
3. Set up welcome email with Resend (user wants to defer)
4. Set up www.legacyodyssey.com DNS (CNAME record)
5. UI/UX polish on mobile app (page-by-page review)
6. Final production APK + app store submission (Google $25, Apple $99/yr)

## EAS Build
- Latest APK: https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds/d00f6de8-00fc-4089-b27f-d40cc9b37504
- Build profile: preview (outputs APK)
- Expo account: dragno65
