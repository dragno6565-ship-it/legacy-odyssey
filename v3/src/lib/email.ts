/**
 * Resend email helper — sends transactional mail directly via the Resend
 * REST API. No SDK needed, just fetch().
 *
 * Phase 3 first cut ships MINIMAL versions of the most-impactful templates
 * (cancellation, welcome, reactivation, gift). The full Express templates
 * (852 LOC of styled HTML across 10+ functions) are ported in a follow-up.
 * Until then v3 sends content-correct but visually plain emails — better
 * than the silent "TODO: Resend port pending" warnings the call sites
 * currently log.
 *
 * Failure mode: email send errors are LOGGED, not thrown. The calling
 * orchestration (cancellation, signup, etc.) must succeed even if Resend
 * is down — same behavior as Express.
 */
import type { Env } from './supabase';

export type EmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional reply-to. Default reply-to=legacyodysseyapp@gmail.com matches Express. */
  replyTo?: string;
};

const FROM = 'Legacy Odyssey <noreply@legacyodyssey.com>';
const DEFAULT_REPLY_TO = 'legacyodysseyapp@gmail.com';

/**
 * Send via Resend. Returns true on success, false on any failure.
 * Errors are logged but never thrown so callers don't unwind their state.
 */
export async function sendEmail(env: Env, args: EmailArgs): Promise<boolean> {
  const apiKey = (env as any).RESEND_API_KEY as string | undefined;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        reply_to: args.replyTo || DEFAULT_REPLY_TO,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[email] Resend ${res.status}: ${text}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[email] send failed:', err?.message);
    return false;
  }
}

// --- Shared HTML chrome ---
function shell(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
  <style>
    body{margin:0;padding:0;background:#faf7f2;font-family:'Helvetica Neue',Arial,sans-serif;color:#2c2416;line-height:1.6}
    .wrap{max-width:560px;margin:0 auto;padding:2.5rem 1.5rem}
    h1{font-family:Georgia,serif;color:#b08e4a;font-weight:400;font-size:1.75rem;margin:0 0 1rem}
    p{margin:0 0 1rem}
    a.btn{display:inline-block;background:#c8a96e;color:#1a1510;font-weight:600;padding:.85rem 1.75rem;text-decoration:none;border-radius:2px;letter-spacing:.05em}
    .small{color:#8a7e6b;font-size:.85rem}
  </style></head><body><div class="wrap">${body}</div></body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

// --- Specific emails (minimal templates) ---

export async function sendWelcomeEmail(
  env: Env,
  args: {
    to: string;
    displayName?: string | null;
    setPasswordUrl?: string | null;
    bookPassword?: string | null;
    subdomain?: string | null;
    customDomain?: string | null;
  }
): Promise<boolean> {
  const name = (args.displayName || 'there').replace(/[<>]/g, '');
  const bookHost = args.customDomain || `${args.subdomain || 'your-baby'}.legacyodyssey.com`;
  const passwordLine = args.bookPassword
    ? `<p>Your book password (share this with family + friends so they can view the book): <strong>${escapeHtml(args.bookPassword)}</strong></p>`
    : '';
  const setPasswordCta = args.setPasswordUrl
    ? `<p><a class="btn" href="${escapeHtml(args.setPasswordUrl)}">Set your password</a></p>`
    : '';
  const html = shell(
    'Welcome to Legacy Odyssey',
    `<h1>Welcome to Legacy Odyssey</h1>
     <p>Hi ${escapeHtml(name)} — your baby book is being created.</p>
     ${setPasswordCta}
     ${passwordLine}
     <p>Your book will live at <a href="https://${escapeHtml(bookHost)}">${escapeHtml(bookHost)}</a> once your custom domain finishes setting up. Open the Legacy Odyssey app on your phone to start filling it in.</p>
     <p class="small">Need help? Just reply to this email.</p>`
  );
  return sendEmail(env, { to: args.to, subject: '✨ Welcome to Legacy Odyssey', html });
}

export async function sendCancellationEmail(
  env: Env,
  args: {
    to: string;
    displayName?: string | null;
    periodEnd?: string | null;
    customDomain?: string | null;
    subdomain?: string | null;
  }
): Promise<boolean> {
  const name = (args.displayName || 'there').replace(/[<>]/g, '');
  const accessUntil = args.periodEnd
    ? new Date(args.periodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'the end of your current billing period';
  const host = args.customDomain || `${args.subdomain}.legacyodyssey.com`;
  const html = shell(
    'Your Legacy Odyssey subscription has been cancelled',
    `<h1>Your subscription has been cancelled</h1>
     <p>Hi ${escapeHtml(name)},</p>
     <p>We've received your cancellation request. Your book at <a href="https://${escapeHtml(host)}">${escapeHtml(host)}</a> stays online until <strong>${escapeHtml(accessUntil)}</strong> — no further charges.</p>
     <p>After that, your book is paused but your photos and content are retained for 1 year in case you'd like to come back.</p>
     <p>If this was a mistake, just reply to this email and we'll restore everything.</p>
     <p class="small">— The Legacy Odyssey team</p>`
  );
  return sendEmail(env, { to: args.to, subject: 'Your subscription has been cancelled', html });
}

export async function sendReactivationEmail(
  env: Env,
  args: {
    to: string;
    displayName?: string | null;
    customDomain?: string | null;
    subdomain?: string | null;
  }
): Promise<boolean> {
  const name = (args.displayName || 'there').replace(/[<>]/g, '');
  const host = args.customDomain || `${args.subdomain}.legacyodyssey.com`;
  const html = shell(
    'Welcome back to Legacy Odyssey',
    `<h1>Welcome back!</h1>
     <p>Hi ${escapeHtml(name)} — your subscription is active again. Your book is live at <a href="https://${escapeHtml(host)}">${escapeHtml(host)}</a>.</p>
     <p>Everything you'd added before is still there — pick up exactly where you left off.</p>
     <p class="small">— The Legacy Odyssey team</p>`
  );
  return sendEmail(env, { to: args.to, subject: '✨ Welcome back to Legacy Odyssey', html });
}

export async function sendGiftPurchaseEmail(
  env: Env,
  args: { to: string; buyerName?: string | null; giftCode: string; redeemUrl: string }
): Promise<boolean> {
  const name = (args.buyerName || 'there').replace(/[<>]/g, '');
  const html = shell(
    'Your Legacy Odyssey gift is ready',
    `<h1>Your gift is ready 🎁</h1>
     <p>Hi ${escapeHtml(name)} — thank you for gifting Legacy Odyssey!</p>
     <p>Your gift code is:</p>
     <p style="font-family:Menlo,Consolas,monospace;font-size:1.4rem;letter-spacing:0.1em;background:#f0e8dc;padding:1rem 1.5rem;border-radius:4px;text-align:center;">${escapeHtml(args.giftCode)}</p>
     <p>Share this with your recipient, or send them the redeem link directly:</p>
     <p><a class="btn" href="${escapeHtml(args.redeemUrl)}">Redeem this gift</a></p>
     <p class="small">The code is good for 1 year. Happy gifting.</p>`
  );
  return sendEmail(env, { to: args.to, subject: '🎁 Your Legacy Odyssey gift is ready', html });
}

export async function sendGiftNotificationEmail(
  env: Env,
  args: {
    to: string;
    buyerName?: string | null;
    message?: string | null;
    redeemUrl: string;
  }
): Promise<boolean> {
  const buyer = (args.buyerName || 'a friend').replace(/[<>]/g, '');
  const messageBlock = args.message
    ? `<p style="font-style:italic;border-left:3px solid #c8a96e;padding-left:1rem;color:#8a7e6b;">${escapeHtml(args.message)}</p>`
    : '';
  const html = shell(
    "You've received a Legacy Odyssey gift",
    `<h1>You've received a gift 🎁</h1>
     <p>${escapeHtml(buyer)} has gifted you a year of Legacy Odyssey — a beautiful, private digital baby book at your own .com domain.</p>
     ${messageBlock}
     <p><a class="btn" href="${escapeHtml(args.redeemUrl)}">Redeem your gift</a></p>
     <p class="small">No payment needed today. Set up your account, choose your domain, and start filling in your book.</p>`
  );
  return sendEmail(env, {
    to: args.to,
    subject: "🎁 You've received a Legacy Odyssey gift",
    html,
  });
}
