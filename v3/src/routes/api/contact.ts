/**
 * /api/contact + /api/waitlist — public form endpoints from the marketing site.
 *
 * Direct ports of:
 *   src/routes/api/contact.js   (form submissions from /contact page)
 *   src/routes/api/waitlist.js  (email signups from the landing-page hero)
 *
 * Both deliver via Resend; both are no-op-on-failure (the marketing site's
 * Promise.then on the client side flips a "thanks" message based on the
 * 200 vs non-200 status).
 *
 * No auth — these are public form posts. Hono handles JSON; we don't need
 * an explicit rate limit here because Cloudflare's edge already rate-limits
 * abusive IPs on the workers.dev hostname.
 */
import { Hono } from 'hono';
import { adminClient, type Env } from '../../lib/supabase';
import { sendEmail } from '../../lib/email';

const TOPIC_LABELS: Record<string, string> = {
  general: 'General Question',
  account: 'Account Help',
  billing: 'Billing Question',
  bug: 'Bug Report',
  feature: 'Feature Request',
};

function isValidEmail(s: string): boolean {
  if (!s || !s.includes('@')) return false;
  const local = s.slice(s.indexOf('@'));
  return local.includes('.');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

// ----- /api/contact -----

const contact = new Hono<{ Bindings: Env }>();

contact.post('/', async (c) => {
  const body = await c.req.json<{
    name?: string;
    email?: string;
    topic?: string;
    message?: string;
  }>();
  const { name, email, topic, message } = body;
  if (!name || !email || !message) {
    return c.json({ error: 'Name, email, and message are required.' }, 400);
  }

  const topicLabel = TOPIC_LABELS[topic || ''] || topic || 'Contact';
  const subject = `[${topicLabel}] from ${name}`;

  // Send to BOTH the public alias and the canonical Gmail to defend against
  // forwarding flakiness on the legacyodyssey.com → Gmail relay.
  const recipients = ['help@legacyodyssey.com', 'legacyodysseyapp@gmail.com'];

  const html = `
    <h3>New contact form submission</h3>
    <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
    <p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
    <hr>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    <hr>
    <p style="color:#999;font-size:12px;">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
  `;

  const sent = await sendEmail(c.env, {
    to: recipients,
    subject,
    html,
    replyTo: email,
  });
  if (!sent) return c.json({ error: 'Failed to send message.' }, 500);
  return c.json({ success: true });
});

export const contactRouter = contact;

// ----- /api/waitlist -----

const WAITLIST_WELCOME_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>You're on the list</title></head>
<body style="margin:0;padding:0;background:#F8F2E6;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2E6;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFCF5;border:1px solid #E8DCC8;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
      <tr><td style="background:#1E1812;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#B8935A;letter-spacing:0.1em;">LEGACY ODYSSEY</p>
      </td></tr>
      <tr><td style="padding:40px 40px 32px;">
        <p style="margin:0 0 24px;font-size:26px;color:#1E1812;line-height:1.3;">You're on the list.</p>
        <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">
          Thank you for signing up for Legacy Odyssey. You're eligible for our introductory rate — <strong>$29 for your first year</strong>. That's less than $2.50/month to preserve your family's memories on your own exclusive .com domain.
        </p>
        <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">
          After your first year, the plan renews at $49.99/year. Cancel anytime.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EDD8;border:1px solid #D4B483;border-radius:6px;margin:0 0 24px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:15px;color:#1E1812;font-weight:bold;">Introductory pricing:</p>
            <p style="margin:0 0 6px;font-size:15px;color:#4A3F32;">&#10003; &nbsp;$29 first year &mdash; your family's site + first .com domain</p>
            <p style="margin:0 0 6px;font-size:15px;color:#4A3F32;">&#10003; &nbsp;Renews at $49.99/year &mdash; cancel anytime</p>
            <p style="margin:0 0 6px;font-size:15px;color:#4A3F32;">&#10003; &nbsp;Additional domains available at $12.99/year each</p>
          </td></tr>
        </table>
        <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">
          We'll be in touch when we're ready for you.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

const waitlist = new Hono<{ Bindings: Env }>();

waitlist.post('/', async (c) => {
  const body = await c.req.json<{ email?: string; source?: string }>();
  const email = (body.email || '').trim().toLowerCase();
  const source = body.source || 'landing_page';

  if (!isValidEmail(email)) {
    return c.json({ success: false, message: 'Please enter a valid email address.' }, 400);
  }

  const supabase = adminClient(c.env);
  const { error } = await supabase.from('waitlist').insert({ email, source });
  if (error) {
    if ((error as any).code === '23505') {
      // Unique violation — already on the list. Match Express friendly response.
      return c.json({ success: true, message: "You're already on the list!" });
    }
    console.error('[waitlist] insert error:', error.message);
    return c.json({ success: false, message: 'Something went wrong. Please try again.' }, 500);
  }

  // Fire-and-forget welcome email — never block the response.
  c.executionCtx.waitUntil(
    sendEmail(c.env, {
      to: email,
      subject: "You're on the Legacy Odyssey list",
      html: WAITLIST_WELCOME_HTML,
    }).then(() => undefined)
  );

  return c.json({ success: true, message: "You're on the list!" });
});

export const waitlistRouter = waitlist;
