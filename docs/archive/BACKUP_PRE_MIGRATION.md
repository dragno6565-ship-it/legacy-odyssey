# Legacy Odyssey — Pre-Migration Backup
# Created: 2026-03-17
# Purpose: Snapshot before adding env vars to Pro Railway project

## Pro Railway Project (dragno6565-ship-it) — KEEPING THIS ONE
- Project ID: 27622203-293e-4720-b019-9efe8eadfdf4
- Service ID: 59190e65-b239-4cf1-842a-3913fabb1838
- Environment ID: a9643517-8aad-441a-81c7-55c462f2fea0
- CNAME Target: legacy-odyssey-production.up.railway.app
- Repo: dragno6565-ship-it/legacy-odyssey
- Custom domains configured: legacyodyssy.com, emmacherry.com, eowynhoperagno.com

### Current Env Vars (8 set):
1. APP_DOMAIN (value unknown — likely legacyodyssy.com or legacyodyssey.com)
2. NODE_ENV
3. PORT
4. RESEND_API_KEY
5. SESSION_SECRET
6. SUPABASE_ANON_KEY
7. SUPABASE_URL
8. SUPABASE_SERVICE_ROLE_KEY

---

## Hobby Railway Project (dragno65) — WILL BE CANCELLED AFTER MIGRATION
- Project ID: 25a7cbc7
- Service ID: a759cd1b-34ae-4171-8e4b-9259e0e95dda
- Environment ID: 067fb530-0dcf-4289-9a48-ee0438fa56b2
- CNAME Target: legacy-odyssey-production-a9d1.up.railway.app
- Repo: dragno65/legacy-odyssey
- Custom domain: legacyodyssey.com
- Has all 23 env vars including Stripe keys (need to grab these)

---

## Values Safe to Copy (from local .env):
- SPACESHIP_API_KEY=2SwgBniE6CGNm8rXgVfc
- SPACESHIP_API_SECRET=rOtZRKXVj8yYnVP8ltVsx2YdjERkZw9X4jmnVbxRvXFSoWk8eIZcHIhps4DEcxhB
- SPACESHIP_CONTACT_ID=2MCFtvqCm3NzdK2ngiR06AuiDsZqy
- RAILWAY_API_TOKEN=0bb2fc70-4913-4374-a374-4857ad237152

## Values Specific to Pro Project (DO NOT use Hobby values):
- RAILWAY_SERVICE_ID=59190e65-b239-4cf1-842a-3913fabb1838
- RAILWAY_ENVIRONMENT_ID=a9643517-8aad-441a-81c7-55c462f2fea0
- RAILWAY_CNAME_TARGET=legacy-odyssey-production.up.railway.app

## Stripe Keys (retrieved from Hobby project via API):
- STRIPE_SECRET_KEY=[REDACTED — test key, stored in Railway env vars]
- STRIPE_PUBLISHABLE_KEY=[REDACTED — test key, stored in Railway env vars]
- STRIPE_WEBHOOK_SECRET=[REDACTED — stored in Railway env vars]
- STRIPE_PRICE_STARTER_MONTHLY=price_1T5uuDQzzNThrLYKrpuS8qpz
- STRIPE_PRICE_STARTER_ANNUAL=price_1T5uuDQzzNThrLYKa8pm1Ur3
- STRIPE_PRICE_FAMILY_MONTHLY=price_1T5uunQzzNThrLYKlqqcY7bh
- STRIPE_PRICE_FAMILY_ANNUAL=price_1T5uvBQzzNThrLYKvBVGT50O
- STRIPE_PRICE_LEGACY_MONTHLY=price_1T5uwGQzzNThrLYKzUxhc9Us
- STRIPE_PRICE_LEGACY_ANNUAL=price_1T5uwdQzzNThrLYKupa806D1

## Complete Hobby Project Env Vars (full backup):
- SESSION_SECRET=legacy-odyssey-prod-secret-x7k9m2p4
- APP_DOMAIN=legacyodyssey.com

---

## Supabase (shared — same for both projects):
- Project: vesaydfwwdbbajydbzmq
- URL: https://vesaydfwwdbbajydbzmq.supabase.co
- ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2F5ZGZ3d2RiYmFqeWRiem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDQzMTYsImV4cCI6MjA4NzI4MDMxNn0.KkyVjCwv1lYO1PE7k2-8C02tNC3rYw08vba-Oer0WxM
- SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2F5ZGZ3d2RiYmFqeWRiem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNDMxNiwiZXhwIjoyMDg3MjgwMzE2fQ.hIepr4IPBV98LWvpb-TNs_LjUaP7_8e_gXDSlc7Jr0k

## Local .env backup:
- File: E:/Claude/legacy-odyssey/.env (already exists on disk)

## Git state:
- Latest commit pushed to railway remote: 5d884eb (iPhone/Expo Go email support)
- Origin push broken (credential conflict)
