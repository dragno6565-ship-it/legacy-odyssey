-- Keep access until the end of the paid period after cancelling (Terms section 4).
-- NOT YET APPLIED: run in the Supabase SQL editor BEFORE deploying the
-- legal-fixes-2026-10 branch (after 034 and 035).
--
-- cancel_effective_at = when a cancelled website goes offline (end of the paid
-- period). Set by subscriptionService.softCancelFamily while the website stays
-- live; the customer.subscription.deleted webhook (Stripe families) or the hourly
-- jobs/cancellationSweep.js (no-subscription comps) archives the family then.
-- Cleared when the customer resumes or reactivates.
--
-- The code tolerates this column being absent (it retries the write without it),
-- but the dashboard "stays live until <date>" message and the comp sweep need it.
alter table public.families add column if not exists cancel_effective_at timestamptz;

create index if not exists idx_families_cancel_effective_at on public.families (cancel_effective_at)
  where cancel_effective_at is not null and archived_at is null;
