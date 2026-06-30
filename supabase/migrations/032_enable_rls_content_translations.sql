-- Security fix (2026-06-30): enable Row-Level Security on content_translations.
-- It was the ONLY public table with RLS disabled (Supabase advisor
-- rls_disabled_in_public, ERROR), meaning anyone with the anon key could
-- read/write/delete it. It's a server-side DeepL translation cache accessed
-- only via the service-role key (supabaseAdmin in translateService.js), which
-- bypasses RLS — so enabling RLS with no policy (deny-all to anon/authenticated)
-- closes the exposure with zero app impact, matching every other table.
alter table public.content_translations enable row level security;
