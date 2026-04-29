/**
 * /redeem — gift code redemption page.
 *
 * Direct port of marketing/redeem.ejs. Uses /css/marketing.css for the
 * shared nav + footer chrome (already proxied to production by Phase 5).
 * The page-specific styles are inlined.
 *
 * Form posts go to /api/stripe/redeem-gift (Phase 3 — already on v3).
 * Domain availability uses /api/domains/search (Phase 2 — already on v3).
 */
import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';

type Props = {
  /** Pre-fill the gift code field from ?code=… query string */
  code?: string | null;
  /** Optional server-side error to surface (e.g. "Code already redeemed") */
  error?: string | null;
};

const PAGE_STYLE = `
  .redeem-page { padding-top: 100px; min-height: 100vh; }
  .redeem-container { max-width: 560px; margin: 0 auto; padding: 3rem 2rem 4rem; }
  .redeem-heading { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; font-weight: 400; color: var(--ink); text-align: center; line-height: 1.2; margin-bottom: 0.75rem; }
  .redeem-subtext { text-align: center; color: var(--ink-light); font-weight: 300; font-size: 1.05rem; margin-bottom: 2.5rem; line-height: 1.6; }
  .redeem-form { display: flex; flex-direction: column; gap: 1.25rem; }
  .redeem-form label { font-size: 0.85rem; font-weight: 500; color: var(--ink-mid); letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 0.3rem; display: block; }
  .redeem-form input { width: 100%; padding: 0.85rem 1rem; border: 1px solid rgba(184, 147, 90, 0.25); border-radius: 8px; font-family: 'Jost', sans-serif; font-size: 1rem; background: var(--white); color: var(--ink); transition: border-color 0.2s ease; }
  .redeem-form input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(184, 147, 90, 0.1); }
  .domain-input-group { display: flex; align-items: stretch; gap: 0; flex-wrap: wrap; }
  .domain-input-group input { flex: 1 1 140px; min-width: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; border-right: none; }
  .domain-suffix { padding: 0.85rem 0.75rem; background: var(--cream); border-top: 1px solid rgba(184, 147, 90, 0.25); border-bottom: 1px solid rgba(184, 147, 90, 0.25); font-family: 'Jost', sans-serif; font-size: 1rem; color: var(--ink-light); white-space: nowrap; display: flex; align-items: center; }
  .domain-check-btn { flex: 0 0 auto; padding: 0.85rem 1.1rem; background: var(--gold); color: var(--white); border: none; border-radius: 0 8px 8px 0; font-family: 'Jost', sans-serif; font-size: 0.95rem; font-weight: 500; cursor: pointer; white-space: nowrap; }
  .domain-check-btn:hover { background: var(--gold-dark); }
  .domain-check-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .domain-hint { font-size: 0.8rem; color: var(--ink-light); font-weight: 300; margin-top: 0.3rem; }
  .domain-result { font-size: 0.9rem; margin-top: 0.4rem; min-height: 1.2rem; }
  .domain-result.available { color: #2e7d32; font-weight: 500; }
  .domain-result.unavailable { color: var(--rose); }
  .domain-result.checking { color: var(--ink-light); font-style: italic; }
  .redeem-btn { display: block; width: 100%; padding: 1rem; margin-top: 0.5rem; background: var(--gold); color: var(--white); border: none; border-radius: 8px; font-family: 'Jost', sans-serif; font-size: 1.05rem; font-weight: 500; letter-spacing: 0.03em; cursor: pointer; transition: background 0.2s ease, transform 0.15s ease; }
  .redeem-btn:hover { background: var(--gold-dark); }
  .redeem-btn:active { transform: scale(0.98); }
  .redeem-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .redeem-error { color: var(--rose); text-align: center; font-size: 0.9rem; margin-top: 0.5rem; }
  .redeem-error:empty { display: none; }
  .redeem-success { display: none; text-align: center; padding: 2rem; background: var(--cream); border-radius: 12px; margin-top: 1.5rem; }
  .redeem-success h2 { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 400; color: var(--ink); margin-bottom: 0.75rem; }
  .redeem-success p { color: var(--ink-mid); font-weight: 300; line-height: 1.6; margin-bottom: 0.5rem; }
  .redeem-success a { color: var(--gold-dark); text-decoration: underline; text-underline-offset: 3px; font-weight: 500; }
  .redeem-success a:hover { color: var(--gold); }
`;

const ANALYTICS_HEAD = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-LMJVX82M3Q');

  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '839009299208301');
  fbq('track', 'PageView');

  !function(e){if(!window.pintrk){window.pintrk = function () {
  window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
    n=window.pintrk;n.queue=[],n.version="3.0";var
    t=document.createElement("script");t.async=!0,t.src=e;var
    r=document.getElementsByTagName("script")[0];
    r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
  pintrk('load', '2613467907928');
  pintrk('page');
`;

const REDEEM_SCRIPT = `
  let selectedDomain = null;
  function setRedeemEnabled(enabled) { document.getElementById('redeemBtn').disabled = !enabled; }
  function confirmDomain(fullDomain) {
    selectedDomain = fullDomain;
    const r = document.getElementById('domainResult');
    r.className = 'domain-result available';
    r.innerHTML = '✓ ' + fullDomain + ' is available — ready to redeem.';
    setRedeemEnabled(true);
  }
  function clearDomainSelection() { selectedDomain = null; setRedeemEnabled(false); }

  async function searchDomain() {
    const input = document.getElementById('domain');
    const r = document.getElementById('domainResult');
    const btn = document.getElementById('domainCheckBtn');
    const raw = input.value.trim().replace(/\\.[a-z]+$/i, '').replace(/[^a-zA-Z0-9-]/g, '');
    if (!raw || raw.length < 2) {
      r.className = 'domain-result unavailable';
      r.textContent = 'Please enter at least 2 characters.';
      clearDomainSelection();
      return;
    }
    const domain = raw.toLowerCase() + '.com';
    r.className = 'domain-result checking';
    r.textContent = 'Checking availability…';
    clearDomainSelection();
    btn.disabled = true;
    try {
      const res = await fetch('/api/domains/search?name=' + encodeURIComponent(raw));
      const data = await res.json();
      const primary = (data.results || []).find(x => x.domain === domain);
      if (primary && primary.available && primary.underBudget) {
        confirmDomain(domain);
      } else if (primary) {
        r.className = 'domain-result unavailable';
        r.innerHTML = '✗ ' + domain + ' is taken.';
        if (data.alternatives && data.alternatives.length) {
          const hint = document.createElement('div');
          hint.style.cssText = 'margin-top:0.5rem;font-size:0.85rem;color:var(--ink-light);';
          hint.textContent = 'Try one of these:';
          r.appendChild(hint);
          const wrap = document.createElement('div');
          wrap.style.cssText = 'margin-top:0.4rem;display:flex;flex-wrap:wrap;gap:0.4rem;';
          data.alternatives.slice(0,6).forEach(function(alt) {
            const a = document.createElement('button');
            a.type = 'button';
            a.style.cssText = 'padding:0.4rem 0.75rem;background:var(--cream);border:1px solid rgba(184,147,90,0.3);border-radius:6px;color:var(--ink);font-size:0.85rem;cursor:pointer;font-family:Jost,sans-serif;';
            a.textContent = alt.domain;
            a.onclick = function() { input.value = alt.domain.replace(/\\.[a-z]+$/i, ''); confirmDomain(alt.domain); };
            wrap.appendChild(a);
          });
          r.appendChild(wrap);
        }
      } else {
        r.className = 'domain-result unavailable';
        r.textContent = 'Could not check availability. Try again.';
      }
    } catch(err) {
      r.className = 'domain-result unavailable';
      r.textContent = 'Connection error — please try again.';
    }
    btn.disabled = false;
  }

  document.getElementById('domainCheckBtn').addEventListener('click', searchDomain);
  document.getElementById('domain').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); searchDomain(); }
  });
  document.getElementById('domain').addEventListener('input', clearDomainSelection);

  document.getElementById('redeemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('redeemBtn');
    const errorEl = document.getElementById('redeemError');
    errorEl.textContent = '';
    if (!selectedDomain) {
      errorEl.textContent = 'Please check domain availability first.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Redeeming…';
    try {
      const res = await fetch('/api/stripe/redeem-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: document.getElementById('giftCode').value.trim(),
          email: document.getElementById('recipientEmail').value.trim(),
          domain: selectedDomain,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      document.getElementById('redeemForm').style.display = 'none';
      document.getElementById('redeemSuccess').style.display = 'block';
      if (data.loginUrl) document.getElementById('loginLink').href = data.loginUrl;
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Redeem Gift';
    }
  });
`;

export const Redeem: FC<Props> = ({ code, error }) => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="p:domain_verify" content="b146e195f22b09a16cdab391ec6f75c1" />
      <title>Redeem Your Gift — Legacy Odyssey</title>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      {/* Proxied from Railway by /css/marketing.css route in routes/marketing.tsx */}
      <link rel="stylesheet" href="/css/marketing.css" />
      <style>{PAGE_STYLE}</style>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-LMJVX82M3Q"></script>
      <script>{raw(ANALYTICS_HEAD)}</script>
    </head>
    <body>
      <nav class="marketing-nav">
        <div class="nav-inner">
          <a href="https://legacyodyssey.com" class="nav-logo">
            Legacy <span>Odyssey</span>
          </a>
        </div>
      </nav>

      <main class="redeem-page">
        <div class="redeem-container">
          <h1 class="redeem-heading">Redeem Your Gift</h1>
          <p class="redeem-subtext">
            Enter your gift code below to set up your Legacy Odyssey site with a custom domain.
          </p>

          {error && <p class="redeem-error">{error}</p>}

          <form id="redeemForm" class="redeem-form">
            <div>
              <label for="giftCode">
                Gift Code <span style="color: var(--rose);">*</span>
              </label>
              <input
                type="text"
                id="giftCode"
                name="giftCode"
                required
                placeholder="e.g. GIFT-XXXX-XXXX"
                value={code || ''}
              />
            </div>

            <div>
              <label for="recipientEmail">
                Your Email <span style="color: var(--rose);">*</span>
              </label>
              <input type="email" id="recipientEmail" name="recipientEmail" required placeholder="you@example.com" />
            </div>

            <div>
              <label for="domain">
                Choose Your Domain <span style="color: var(--rose);">*</span>
              </label>
              <div class="domain-input-group">
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  required
                  placeholder="yourchildsname"
                  pattern="[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]"
                  title="Letters, numbers, and hyphens only"
                />
                <span class="domain-suffix">.com</span>
                <button type="button" class="domain-check-btn" id="domainCheckBtn">Check</button>
              </div>
              <p class="domain-result" id="domainResult"></p>
              <p class="domain-hint">
                Click Check to confirm the .com is available before redeeming.
              </p>
            </div>

            <button type="submit" class="redeem-btn" id="redeemBtn" disabled>
              Redeem Gift
            </button>
            <p class="redeem-error" id="redeemError"></p>
          </form>

          <p style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--ink-light);">
            Can't find your code?{' '}
            <a href="mailto:help@legacyodyssey.com" style="color: var(--gold);">
              Contact us
            </a>{' '}
            and we'll look it up for you.
          </p>

          <div class="redeem-success" id="redeemSuccess">
            <h2>Welcome to Legacy Odyssey!</h2>
            <p>
              Your account has been created. We sent you an email with a link to set your password
              — please open that first.
            </p>
            <p style="margin-top:1rem;">Once your password is set, you can sign in here:</p>
            <p style="margin-top:0.75rem;">
              <a href="/account" id="loginLink">Sign in to your account</a>
            </p>
            <p style="margin-top:1rem;font-size:0.9rem;color:var(--ink-light);">
              Then download the app to start filling in your book:
            </p>
            <p style="margin-top:0.5rem;">
              <a
                href="https://apps.apple.com/app/id6760883565"
                target="_blank"
                style="margin-right:0.5rem;"
              >
                App Store
              </a>{' '}
              ·{' '}
              <a
                href="https://play.google.com/store/apps/details?id=com.legacyodyssey.app"
                target="_blank"
                style="margin-left:0.5rem;"
              >
                Google Play
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer class="marketing-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            Legacy <span>Odyssey</span>
          </div>
          <ul class="footer-links">
            <li>
              <a href="https://legacyodyssey.com">Home</a>
            </li>
            <li>
              <a href="/terms">Terms</a>
            </li>
            <li>
              <a href="/privacy">Privacy</a>
            </li>
          </ul>
          <div class="footer-copy">© 2026 Legacy Odyssey. All rights reserved.</div>
        </div>
      </footer>

      <script>{raw(REDEEM_SCRIPT)}</script>
    </body>
  </html>
);
