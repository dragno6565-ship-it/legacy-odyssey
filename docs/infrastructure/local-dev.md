# Local development and tooling gotchas

**Status:** reference
**Owner:** coding session
**Last touched:** 2026-10-04 (collected from retired coding sessions' transcripts)

## Running the server locally
- Local `.env` has `APP_DOMAIN=localhost`, so the marketing host looks like a customer host. It produced two false root causes (the /health host test and the forgot-password redirect test). Test host-scoped middleware with `APP_DOMAIN=legacyodyssey.com`.
- Local `.env` has no RESEND_API_KEY and no Stripe publishable key. `sendEmail.js` constructs Resend at load, so `npm start` crashes; start with dummies, e.g. `RESEND_API_KEY=re_dummy_local_preview STRIPE_PUBLISHABLE_KEY=pk_dummy PORT=3100 node src/server.js`. Stripe checkout can only really be tested on production.
- Route, server.js and job changes need a server restart; EJS templates are re-read per request.
- Boot test without secrets: dummy SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY plus an `ejs.compile` dry render.
- Use PORT=3100 for previews. On Windows `pkill -f` does not match the node process: find the PID with `netstat -ano | grep :3100` and `taskkill //PID <n> //F`.
- The Browser pane's preview_start launched the wrong `.claude/launch.json` entry (blog-preview on 9900) and cannot reach a Bash-started server; use the Chrome tool or Puppeteer for screenshots.
- Express 5 / path-to-regexp v6: optional params like `router.get('/x/:variant?')` throw at startup and fail the Railway boot ("Build failed!" email, Sentry fatal). Use two literal routes sharing one handler. Sentry alerts carry the release SHA: compare with `git log -1` to tell live from historical.
- FormData fetch to a urlencoded-only route silently empties req.body.

## Shell pitfalls (Windows, Git Bash, PowerShell)
- Windows curl: always `--ssl-no-revoke`.
- `$home` is a reserved PowerShell variable. Here-strings and `->` break `git commit -m`: use single-line ASCII messages.
- Git Bash turns `/c` into `C:/` (MSYS path conversion; use `MSYS_NO_PATHCONV=1`). Node resolves a bare `/tmp` to `F:\tmp`, which does not exist: use a relative or scratch path.
- node fetch failed to parse api.supabase.com URLs once: use curl.
- Inline GraphQL/JSON in shell commands gets mangled: put it in a script file.
- There is no jq on this machine: parse JSON with Python or Node.
- Never `git add -A` / `git add .` (untracked secrets, PDFs and other sessions' work sit in the tree). A `git revert` also deletes unrelated files that were in the reverted commit.
- `npm i ffmpeg-static --no-save` is needed for `marketing/app-store/make_video.py` (it hard-codes `node_modules\ffmpeg-static\ffmpeg.exe`); never commit it to package.json.

## Browser tooling limits
- Claude's browser tools cannot open dashboard.stripe.com (financial-site restriction). Dan clicks Stripe dashboard steps.
- computer-use treats browsers as view-only; use claude-in-chrome for navigation. `javascript_tool` blocks return values that look sensitive (return booleans/numbers). The Chrome `file_upload` tool only accepts allow-listed folders (not F:, not Downloads); Dan drags files in himself. The Chrome extension cannot open file:// URLs: serve with `python -m http.server <port>`.
- Never run `claude mcp list` in a shared transcript: it prints MCP server env values including live keys. Never screenshot a page after a token is revealed.
- Moving a secret from a browser page into config without it entering the chat: Dan clicks Copy; a script reads the clipboard (PowerShell Get-Clipboard), validates its shape, writes it to Railway and .env, tests it, prints only a few characters via explicit string slicing, then clears the clipboard.
- Dan's Chrome: dragno6565@ is the default Google account; legacyodysseyapp@ is /u/1 and is sometimes signed out (GA4, Ads and Search Console need it). Always confirm the account shown before acting.

## Web front-end traps seen in production
- `.lg-page p { margin: 0 0 16px }` outranks `.lg-hero-sub` and kills auto margins: centering failed three ways until measured with getComputedStyle. Fix pattern: `.lg-hero-content .lg-hero-sub`.
- `html { scroll-behavior: smooth }` plus lazy-image layout shift made `/#pricing` land at the top. Landing pages use a `jumpToHash` handler (force `scroll-behavior:auto`, scrollTo the offset minus the 64px nav, retry at +250 ms / +700 ms). New landing pages need it.
- Blog templates must set their own light body background: marketing.css sets a dark body, which made blog text invisible (2026-05-22).
- Keep critical UI (the book lightbox) inline in the server-rendered layout; a stale cached script plus a per-class allowlist broke it.
- Admin pages must work on Dan's phone (top bar below 768 px).
- Filters that hide records need a visible note (the sharing picker silently dropped phone-only contacts; "Send an Update > Everyone" counts only contacts with an email because the update is an emailed magic link).
- When adding a language, grep for `'es'` literals: `translateBook` was hard-gated to Spanish and the sidebar had a hardcoded `es-ES` date locale. Hindi was generated with `.tmp/translate-hi.js` (DeepL, protects `{vars}`, batches of 40); that script is in the gitignored `.tmp/`.

## Related
- `infrastructure/railway.md` (deploy and verify routine), `infrastructure/backups.md`, `infrastructure/mcp-connectors.md`.
