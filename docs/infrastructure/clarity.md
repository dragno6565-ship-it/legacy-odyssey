# Microsoft Clarity

**What:** Free heatmaps + session recordings for legacyodyssey.com. Installed 2026-06-15 to
diagnose conversion behavior (esp. the `/gift` page flagged by google-ads/chief-of-staff) before
any paid-traffic restart.

## Essentials
- **Project:** "Legacy Odyssey" · **project / tag id `x7mt9cszyp`** (the id in the install snippet
  `https://www.clarity.ms/tag/<id>` and the dashboard URL `clarity.microsoft.com/projects/view/x7mt9cszyp`).
- **Account:** created by Dan 2026-06-15 (sign-in provider = Dan's; Claude cannot create accounts).
- **Cost:** free.

## How it's wired (code)
- Loaded **site-wide** via the shared tracking partial `src/views/partials/tracking.ejs`, **inside
  `loEnableTracking`** — so it inherits the same EU/UK **consent gating** (G1) as GA4/Meta/Pinterest
  (only loads after consent is granted / auto-granted for non-EU).
- **Env-driven:** `consentRegion` middleware sets `res.locals.clarityProjectId = process.env.CLARITY_PROJECT_ID`;
  the partial emits `window.LO_CLARITY_ID` and the loader no-ops when it's empty. So the project id
  is **not** hardcoded — rotate/disable by changing the Railway env var, no code change.
- **Railway env:** `CLARITY_PROJECT_ID=x7mt9cszyp` (set 2026-06-15 via the Railway API; a var change
  triggers a redeploy). Unset → Clarity fully dormant.
- Commits: loader `a1146d9`. Verified live on `/gift` (`LO_CLARITY_ID = 'x7mt9cszyp'`).

## Notes
- Data takes a little while to populate in the Clarity dashboard after first install.
- To disable: clear `CLARITY_PROJECT_ID` in Railway (no deploy of code needed beyond the var change).
