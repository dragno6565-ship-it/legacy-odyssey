/**
 * /gift/success — confirmation page after a buyer completes a gift purchase.
 * Direct port of marketing/gift-success.ejs.
 *
 * Server retrieves the Stripe session by ?session_id=…, looks up the
 * gift_codes row by stripe_session_id, renders the code + redeem link.
 * If the webhook hasn't fired yet, the route handler creates the gift code
 * on-the-fly so the buyer never sees a missing-data error.
 */
import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';

type Props = {
  giftCode: string;
  redeemUrl: string;
  buyerEmail: string;
};

const PAGE_STYLE = `
  .success-page { padding-top: 100px; min-height: 100vh; }
  .success-container { max-width: 600px; margin: 0 auto; padding: 3rem 2rem 4rem; text-align: center; }
  .success-icon { font-size: 3rem; margin-bottom: 1rem; }
  .success-heading { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; font-weight: 400; color: var(--ink); margin-bottom: 0.75rem; line-height: 1.2; }
  .success-subtext { color: var(--ink-light); font-weight: 300; font-size: 1.05rem; margin-bottom: 2.5rem; line-height: 1.6; }
  .gift-code-box { border: 2px dashed var(--gold); border-radius: 12px; padding: 2rem 1.5rem; margin-bottom: 1.5rem; background: var(--cream); }
  .gift-code-label { font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-light); margin-bottom: 0.75rem; }
  .gift-code-value { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600; color: var(--gold-dark); letter-spacing: 0.08em; word-break: break-all; user-select: all; }
  .copy-btn { display: inline-block; margin-top: 1rem; padding: 0.6rem 1.5rem; background: var(--gold); color: var(--white); border: none; border-radius: 6px; font-family: 'Jost', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background 0.2s ease; }
  .copy-btn:hover { background: var(--gold-dark); }
  .redeem-link-box { background: var(--white); border: 1px solid rgba(184, 147, 90, 0.2); border-radius: 10px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
  .redeem-link-label { font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-light); margin-bottom: 0.5rem; }
  .redeem-link-url { font-size: 0.95rem; color: var(--gold-dark); word-break: break-all; }
  .redeem-link-url a { color: var(--gold-dark); text-decoration: underline; text-underline-offset: 3px; }
  .redeem-link-url a:hover { color: var(--gold); }
  .success-instructions { font-size: 1.05rem; font-weight: 500; color: var(--ink); margin-bottom: 0.75rem; }
  .success-note { font-size: 0.9rem; color: var(--ink-light); font-weight: 300; line-height: 1.6; margin-bottom: 0.5rem; }
  .buyer-email-note { font-size: 0.85rem; color: var(--ink-light); font-weight: 300; margin-top: 2rem; }
`;

const COPY_SCRIPT = `
  function copyCode() {
    const code = document.getElementById('giftCodeValue').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('copyBtn');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy Code'; }, 2000);
    });
  }
  window.copyCode = copyCode;
`;

export const GiftSuccess: FC<Props> = ({ giftCode, redeemUrl, buyerEmail }) => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="p:domain_verify" content="b146e195f22b09a16cdab391ec6f75c1" />
      <title>Your Gift is Ready! — Legacy Odyssey</title>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="/css/marketing.css" />
      <style>{PAGE_STYLE}</style>
    </head>
    <body>
      <nav class="marketing-nav">
        <div class="nav-inner">
          <a href="https://legacyodyssey.com" class="nav-logo">
            Legacy <span>Odyssey</span>
          </a>
        </div>
      </nav>

      <main class="success-page">
        <div class="success-container">
          <div class="success-icon">✨</div>
          <h1 class="success-heading">Your Gift is Ready!</h1>
          <p class="success-subtext">
            Share the code or link below with the recipient so they can set up their very own
            Legacy Odyssey site.
          </p>

          <div class="gift-code-box">
            <div class="gift-code-label">Gift Code</div>
            <div class="gift-code-value" id="giftCodeValue">{giftCode}</div>
            <button class="copy-btn" id="copyBtn" onclick="copyCode()">
              Copy Code
            </button>
          </div>

          <div class="redeem-link-box">
            <div class="redeem-link-label">Redemption Link</div>
            <div class="redeem-link-url">
              <a href={redeemUrl} id="redeemLink">{redeemUrl}</a>
            </div>
          </div>

          <p class="success-instructions">Share this code or link with the recipient.</p>
          <p class="success-note">
            This code is valid for 1 year and includes a custom domain setup.
          </p>

          <p class="buyer-email-note">
            A confirmation has been sent to <strong>{buyerEmail}</strong>.
          </p>
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

      <script>{raw(COPY_SCRIPT)}</script>
    </body>
  </html>
);
