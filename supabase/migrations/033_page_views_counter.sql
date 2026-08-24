-- Blocker-proof server-side pageview log (2026-08-24). Applied via Supabase
-- management API (mcp apply_migration). Recorded here for repo history.
--
-- Clarity/GA4 are client-side and blocked by Brave/Safari/ad-blockers, so they
-- undercount real visitors ("nobody here" while people are actually on the
-- site). middleware/recordPageView logs human marketing-page GETs server-side
-- (bots filtered in the app); the admin health page reports the true count.
create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path       text,
  ref_host   text,
  ip         text,
  ua         text
);
create index if not exists page_views_created_idx on public.page_views (created_at desc);
-- Server (service role) is the only reader/writer; RLS on with no policy = closed to anon.
alter table public.page_views enable row level security;
