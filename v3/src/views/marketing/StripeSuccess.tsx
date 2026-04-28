/**
 * Post-checkout success page. Direct port of src/views/marketing/success.ejs.
 *
 * Customer lands here from Stripe Checkout success_url; the URL has
 * ?session_id=cs_live_… The route handler:
 *   1. Retrieves the session from Stripe (validates payment_status='paid')
 *   2. Looks up the family the webhook should have created (by subdomain
 *      or stripe_customer_id) — race-tolerant: if the webhook is slow,
 *      shows the page anyway with whatever info we have
 *   3. Renders this page
 *
 * Self-contained styling; no /css/book.css dep. Includes the same Meta
 * Pixel + Pinterest + GA tracking script tags Express ships.
 */
import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';

type Props = {
  email: string;
  subdomain: string | null;
  appDomain: string;
  plan: string;
  planValue: number;
  domain: string | null;
  tempPassword: string | null;
  bookPassword: string | null;
  purchaseEventId: string;
};

const STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Jost', sans-serif;
    background: #faf7f2;
    color: #2c2416;
    min-height: 100vh;
    padding: 2rem 1rem;
  }
  .success-wrap { max-width: 640px; margin: 0 auto; }
  .success-header { text-align: center; margin-bottom: 2rem; }
  .success-icon { font-size: 3.5rem; margin-bottom: 0.75rem; }
  h1 { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600; margin-bottom: 0.5rem; }
  .subtitle { color: #8a7e6b; font-size: 1.05rem; line-height: 1.6; }
  .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); padding: 1.75rem; margin-bottom: 1.25rem; }
  .card h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
  .card-icon { font-size: 1.4rem; }
  .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0ebe3; }
  .summary-row:last-child { border-bottom: none; }
  .summary-label { color: #8a7e6b; font-size: 0.9rem; }
  .summary-value { font-weight: 500; font-size: 0.95rem; word-break: break-all; }
  .summary-value a { color: #c8a96e; text-decoration: none; }
  .summary-value a:hover { text-decoration: underline; }
  .domain-status { background: #f0f7f1; border: 1px solid #a8c5ab; border-radius: 8px; padding: 1rem 1.25rem; margin-top: 1rem; font-size: 0.9rem; color: #3d6b42; line-height: 1.5; }
  .domain-status strong { color: #2c2416; }
  .steps-list { list-style: none; counter-reset: step-counter; }
  .steps-list li { counter-increment: step-counter; display: flex; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid #f0ebe3; align-items: flex-start; }
  .steps-list li:last-child { border-bottom: none; }
  .step-num { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: #c8a96e; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; }
  .step-content h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.2rem; }
  .step-content p { font-size: 0.9rem; color: #6b5f4f; line-height: 1.5; }
  .password-box { background: #faf7f2; border: 2px dashed #c8a96e; border-radius: 8px; padding: 1.25rem; margin-top: 1rem; text-align: center; }
  .password-label { font-size: 0.85rem; color: #8a7e6b; margin-bottom: 0.4rem; }
  .password-value { font-family: monospace; font-size: 1.15rem; font-weight: 600; color: #2c2416; letter-spacing: 0.5px; user-select: all; }
  .password-warning { font-size: 0.8rem; color: #c0392b; margin-top: 0.6rem; font-weight: 500; }
  .password-note { font-size: 0.85rem; color: #8a7e6b; margin-top: 0.6rem; }
  .cta-section { text-align: center; margin-top: 2rem; }
  .btn-primary { display: inline-block; padding: 1rem 2.5rem; background: #c8a96e; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; transition: background 0.2s; }
  .btn-primary:hover { background: #b08e4a; }
  .cta-note { margin-top: 0.75rem; font-size: 0.85rem; color: #8a7e6b; }
  .email-note { text-align: center; margin-top: 1.5rem; padding: 1rem; background: #fff8f0; border: 1px solid #e0d5c4; border-radius: 8px; font-size: 0.85rem; color: #6b5f4f; line-height: 1.5; }
  .success-footer { text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e0d5c4; font-size: 0.85rem; color: #8a7e6b; }
  .success-footer a { color: #c8a96e; text-decoration: none; }
`;

// Inline analytics scripts ported verbatim from success.ejs. We use the
// same event IDs Express does for Meta dedupe.
const ANALYTICS_HEAD = `
  // Google Analytics 4
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-LMJVX82M3Q');

  // Meta Pixel
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

  // Pinterest
  !function(e){if(!window.pintrk){window.pintrk = function () {
  window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
    n=window.pintrk;n.queue=[],n.version="3.0";var
    t=document.createElement("script");t.async=!0,t.src=e;var
    r=document.getElementsByTagName("script")[0];
    r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
  pintrk('load', '2613467907928');
  pintrk('page');
`;

const purchaseScript = (purchaseEventId: string, planValue: number) => `
  const purchaseEventId = ${JSON.stringify(purchaseEventId)};
  fbq('track', 'Purchase', { value: ${planValue}, currency: 'USD' }, { eventID: purchaseEventId });
  fbq('track', 'StartTrial', {}, { eventID: 'trial_' + purchaseEventId });
  pintrk('track', 'signup');
  pintrk('track', 'checkout', { value: ${planValue}, order_quantity: 1, currency: 'USD' });
`;

export const StripeSuccess: FC<Props> = (props) => {
  const planLabel = props.plan.charAt(0).toUpperCase() + props.plan.slice(1);
  const bookHref = `https://${props.appDomain}/book/${props.subdomain || ''}`;

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="p:domain_verify" content="b146e195f22b09a16cdab391ec6f75c1" />
        <title>Welcome to Legacy Odyssey!</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{STYLE}</style>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LMJVX82M3Q"></script>
        {/* raw() — Hono JSX silently drops dangerouslySetInnerHTML on <script>. */}
        <script>{raw(ANALYTICS_HEAD)}</script>
      </head>
      <body>
        <div class="success-wrap">
          <div class="success-header">
            <div class="success-icon">🎉</div>
            <h1>Payment Successful!</h1>
            <p class="subtitle">
              Welcome to Legacy Odyssey! Your account has been created and your family's
              story is ready to begin.
            </p>
          </div>

          <div class="card">
            <h2><span class="card-icon">📋</span> Your Order</h2>
            <div class="summary-row">
              <span class="summary-label">Plan</span>
              <span class="summary-value">{planLabel}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Email</span>
              <span class="summary-value">{props.email}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Your Book</span>
              <span class="summary-value">
                <a href={bookHref}>{props.appDomain}/book/{props.subdomain}</a>
              </span>
            </div>
            {props.domain && (
              <>
                <div class="summary-row">
                  <span class="summary-label">Custom Domain</span>
                  <span class="summary-value">www.{props.domain}</span>
                </div>
                <div class="domain-status">
                  ⏳ <strong>www.{props.domain}</strong> is being registered and configured now.
                  DNS records can take anywhere from a few minutes to a couple of hours to fully
                  propagate. <strong>Don't worry — you don't need to wait!</strong> You can
                  start building your site right away using the link above. Once DNS is ready,
                  your custom domain will automatically point to your site.
                </div>
              </>
            )}
          </div>

          <div class="card">
            <h2><span class="card-icon">🚀</span> What To Do Next</h2>
            <ol class="steps-list">
              <li>
                <div class="step-num">1</div>
                <div class="step-content">
                  <h3>Save Your Password</h3>
                  <p>Below is your temporary password. Write it down or save it somewhere safe. You'll need it to log in.</p>
                </div>
              </li>
              <li>
                <div class="step-num">2</div>
                <div class="step-content">
                  <h3>Download the App</h3>
                  <p>Search for <strong>"Legacy Odyssey"</strong> in the App Store or Google Play and install it on your phone.</p>
                </div>
              </li>
              <li>
                <div class="step-num">3</div>
                <div class="step-content">
                  <h3>Log In</h3>
                  <p>
                    Open the app and sign in with your email (<strong>{props.email}</strong>) and the
                    temporary password below. You'll be prompted to create a new password.
                  </p>
                </div>
              </li>
              <li>
                <div class="step-num">4</div>
                <div class="step-content">
                  <h3>Start Building Your Site</h3>
                  <p>
                    Don't wait for your custom domain — start right away! Upload photos, write
                    letters, track milestones, and fill your book with the memories that matter
                    most. Everything will appear on your custom domain automatically once it's ready.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div class="card">
            <h2><span class="card-icon">🔐</span> Your Temporary Password</h2>
            {props.tempPassword ? (
              <div class="password-box">
                <div class="password-label">Your temporary app password is:</div>
                <div class="password-value">{props.tempPassword}</div>
                <div class="password-warning">⚠ Save this now! This is the only time it will be shown.</div>
              </div>
            ) : (
              <div class="password-box">
                <div class="password-label">Password reset required</div>
                <div class="password-note">
                  A password reset link will be sent to <strong>{props.email}</strong>.
                  Check your inbox (and spam folder) to set your password and get started.
                </div>
              </div>
            )}
          </div>

          {props.bookPassword && (
            <div class="card">
              <h2><span class="card-icon">📖</span> Your Book Password</h2>
              <p style="font-size: 0.9rem; color: #6b5f4f; margin-bottom: 0.75rem; line-height: 1.5;">
                Share this password with family and friends so they can view your book. You can
                change it anytime from the app.
              </p>
              <div class="password-box">
                <div class="password-label">Book viewing password:</div>
                <div class="password-value">{props.bookPassword}</div>
                <div class="password-note">
                  Share this with grandparents, aunts, uncles — anyone you want to see the book.
                </div>
              </div>
            </div>
          )}

          <div class="cta-section">
            <a class="btn-primary" href={bookHref}>View Your Book →</a>
            <p class="cta-note">
              You can view your site right now, even while your custom domain is being set up.
            </p>
          </div>

          <div class="email-note">
            📧 We've sent a confirmation email to <strong>{props.email}</strong> with these same
            instructions.
            <br />
            If you don't see it, check your spam folder.
          </div>

          <div class="success-footer">
            <p>
              Questions? Reach out to{' '}
              <a href="mailto:hello@legacyodyssey.com">hello@legacyodyssey.com</a>
            </p>
            <p style="margin-top: 0.5rem;">© 2026 Legacy Odyssey</p>
          </div>
        </div>

        <script>{raw(purchaseScript(props.purchaseEventId, props.planValue))}</script>
      </body>
    </html>
  );
};
