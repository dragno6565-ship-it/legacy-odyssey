-- CCPA/CPRA "Do Not Sell or Share My Personal Information" opt-outs (C-009).
-- NOT YET APPLIED: run in the Supabase SQL editor before (or right after) the
-- legal-fixes-2026-10 branch deploys. Until it exists, the /do-not-sell-or-share
-- form still works (it sets the lo_optout cookie for that browser) and simply
-- logs that the email could not be recorded.
--
-- Written by POST /do-not-sell-or-share (src/routes/book.js). Read by
-- utils/privacyOptOut.isEmailOptedOut(), which makes utils/metaCapi.js skip
-- server-side Meta Conversions API events for these email addresses.
-- Service-role only (RLS on, no policies), like every other table.
create table if not exists public.privacy_optouts (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  email       text,                 -- lower-cased; null when the visitor gave no email
  gpc         boolean not null default false,  -- browser sent Global Privacy Control
  source      text not null default 'web_form'
);
create index if not exists privacy_optouts_email_idx on public.privacy_optouts (email) where email is not null;
alter table public.privacy_optouts enable row level security;
