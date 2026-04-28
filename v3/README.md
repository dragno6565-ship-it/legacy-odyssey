# Legacy Odyssey v3 — Cloudflare Workers + Hono

The long-term replacement for the Express-on-Railway custom-domain layer.
Lives on the `v3-workers` branch until cutover.

**Plan:** see `docs/projects/v3-workers-rewrite.md` at the repo root.
**Status (Apr 28 2026):** Phase 0 — scaffolding + smoke-test deploy.

## Quick start (dev)

```bash
cd v3
npm install
npx wrangler login              # Opens browser for Cloudflare OAuth
npm run dev                     # Local dev at http://localhost:8787
npm run deploy                  # Deploy to legacy-odyssey-v3.<subdomain>.workers.dev
```

## Files

- `wrangler.toml` — Worker config (compatibility date, env vars, observability)
- `src/index.ts` — Hono app entry point. Phase 0: just `/` and `/health` placeholders.
- `tsconfig.json` — TypeScript config for Workers + Hono JSX
- `package.json` — pinned to wrangler 3.78+, hono 4.6+, Node 20+

## Phase status

- [x] Phase 0 — Scaffolding + first deploy
- [ ] Phase 1 — Hono app skeleton + auth + book viewer (~5 days)
- [ ] Phase 2 — Mobile API parity (~5-7 days)
- [ ] Phase 3 — Marketing site, /admin, /account, gift flow (~7 days)
- [ ] Phase 4 — Custom domain layer (~5 days)
- [ ] Phase 5 — Parallel-run validation (~5-7 days)
- [ ] Phase 6 — Cutover (one weekend)
- [ ] Phase 7 — Decommission Approximated + Railway custom-domain entries

## Production code (NOT v3) lives in the parent directory

`../src/` is the current Express app on Railway. **Do not change it from this branch
unless you're fixing a production bug** — keep `main` and `v3-workers` cleanly separated
so we can rebase / cherry-pick during the parallel-run phase.
