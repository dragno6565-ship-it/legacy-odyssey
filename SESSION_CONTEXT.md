# Legacy Odyssey - Session Context (March 5, 2026)

## Project Overview
Legacy Odyssey is a subscription SaaS baby book / memory book platform. Users create digital
memory books via a mobile app (React Native / Expo), and the content is published as a public
website (EJS templates on Express). Backend is hosted on Railway, database is Supabase (PostgreSQL).

## What Was Done This Session (March 4-5)

### 1. Fixed GitHub Remote & Railway Deployment
- Discovered two GitHub remotes: `origin` → `dragno6565-ship-it` and `dragno65` → `dragno65`
- Railway was connected to `dragno65` repo, but pushes were going to `dragno6565-ship-it`
- Fixed: removed old origin, renamed `dragno65` to `origin`
- Now single remote: `origin` → `https://github.com/dragno65/legacy-odyssey.git`
- Railway deployments now work correctly with auto-deploy

### 2. Admin Dashboard (deployed)
- **`src/public/css/admin.css`** (NEW) — Full admin stylesheet using design system (gold, ink, cream, ivory)
- **`src/views/admin/login.ejs`** — Styled login with Legacy Odyssey branding
- **`src/views/admin/dashboard.ejs`** — KPI cards (total/active/trialing/canceled), searchable customer table, "Add Customer" button
- **`src/views/admin/family-detail.ejs`** — Editable customer form (account, website, subscription), book progress, quick links
- **`src/routes/admin.js`** — POST handler for family edits, toggle-active endpoint
- Admin user registered in `admin_users` table for `dragno65@hotmail.com` (owner role)
- Accessible at: `https://legacy-odyssey-production-a9d1.up.railway.app/admin/login`

### 3. Add Customer Flow (deployed)
- **`src/views/admin/add-customer.ejs`** (NEW) — Form with Customer Name, email, temp password, book viewing password, custom domain, subdomain, subscription status/trial
- **`src/views/admin/customer-created.ejs`** (NEW) — Success page with login credentials, ready-to-send invite message (iPhone + Android instructions), copy button, quick actions
- **`src/routes/admin.js`** — GET/POST `/admin/customers/new`:
  - Creates Supabase Auth user (with email_confirm: true to skip verification)
  - Creates family record with domain, subscription status, trial period
  - Creates book with default seed data via `createBookWithDefaults()`
  - Validates for duplicate subdomains/domains/emails
  - Rolls back auth user if family creation fails
  - Shows success page with invite message
- Child Information section intentionally removed — customer fills in their own details through the app (could be a child, pet, friend, family, etc.)

### 4. Expo Go / EAS Update (published)
- Published app to EAS Update for iPhone users (Expo Go)
- EAS Update group ID: `6eb62faf-2a25-4892-a438-7339b8d9df19`
- Expo Go URL: `https://expo.dev/accounts/dragno65/projects/legacy-odyssey/updates/6eb62faf-2a25-4892-a438-7339b8d9df19`
- `mobile/app.json` updated with `runtimeVersion` and `updates.url`
- `expo-updates` package installed
- Invite message now includes both iPhone (Expo Go) and Android (APK) instructions

### 5. Database Cleanup
- Deleted old test "emmacherry" family (ID: `939f715d-be1b-4e8a-8912-ffd7562e4a50`) and its orphaned auth user
- "emmacherry" subdomain is now available for Lindsey Cherry's account

## Key Database Records

### Primary Family (Eowyn's Book)
- Family ID: `fb16691d-7ea4-4c93-9827-ffe8904ced6b`
- Book ID: `501e0807-d950-4004-8b4c-9b0f0ce0c910`
- Subdomain: `eowynragno`
- Custom Domain: `eowynhoperagno.com`
- Auth User ID: `ef8926bc-908a-43f0-afb3-2117913b85b9`
- Email: `dragno65@hotmail.com`

### Second Family (Test Site)
- Family ID: `a71cbf4b-5abe-4530-bc1d-7544af8e45af`
- Book ID: `39f7e7bb-dce0-4490-b7a0-74ebb259e892`
- Subdomain: `legacyodyssy`
- Custom Domain: `legacyodyssy.com`
- Auth User ID: NULL (linked via user_metadata)

### Admin User
- admin_users ID: `fde66de0-6607-4aad-bf47-43672cc90151`
- Email: `dragno65@hotmail.com`
- Role: `owner`

## Infrastructure

### GitHub
- Repo: `https://github.com/dragno65/legacy-odyssey.git`
- Remote: `origin` (single remote, cleaned up)
- Branch: `main`
- Latest commit: `a52f7a7` — EAS Update config for Expo Go

### Railway
- App URL: `legacy-odyssey-production-a9d1.up.railway.app`
- Auto-deploys from `dragno65/legacy-odyssey` GitHub repo
- Health: `/health` → `{ status: 'ok', version: '2.1.0' }`

### Expo / EAS
- Account: `dragno65`
- EXPO_TOKEN: `guD7MQm59Viv43AxQl5PgjS9blzS9ILhhgjnbKQ8`
- EAS project ID: `14daf713-2b41-4ac0-b413-1179afa6e6a9`
- Android APK: `https://expo.dev/artifacts/eas/dEWDhAKzbdohggvEofzuEy.apk`
- Expo Go URL: `https://expo.dev/accounts/dragno65/projects/legacy-odyssey/updates/6eb62faf-2a25-4892-a438-7339b8d9df19`

### Supabase
- URL: `https://vesaydfwwdbbajydbzmq.supabase.co`
- Keys in `.env`
- Cannot run DDL (ALTER TABLE) — only PostgREST data operations

## Remaining Tasks
1. **Create test customer** — Lindsey Cherry (emmacherry.com), email TBD, use admin Add Customer page
2. **Run SQL in Supabase Dashboard** — Drop UNIQUE constraints, add visible_sections column
3. **Point eowynhoperagno.com DNS to Railway**
4. **Set up emmacherry.com DNS** → Railway
5. **Set up legacyodyssy.com DNS** → Railway
6. **Set up www.legacyodyssey.com DNS** → Railway
7. **Test checkout flow end-to-end**
8. **Set up welcome email with Resend**
9. **UI/UX polish on mobile app**
10. **App store submission** (Google Play $25, Apple $99/yr)

## Files Modified This Session
- `src/public/css/admin.css` (NEW) — Admin stylesheet
- `src/views/admin/login.ejs` — Restyled login
- `src/views/admin/dashboard.ejs` — Full dashboard with KPIs and table
- `src/views/admin/family-detail.ejs` — Editable customer detail
- `src/views/admin/add-customer.ejs` (NEW) — Add customer form
- `src/views/admin/customer-created.ejs` (NEW) — Success/invite page
- `src/routes/admin.js` — All admin routes including Add Customer POST
- `src/server.js` — Added version to health endpoint
- `mobile/app.json` — EAS Update config
- `mobile/package.json` — Added expo-updates dependency
