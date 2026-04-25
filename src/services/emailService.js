const { Resend } = require('resend');

let resend = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';

// Where customer replies should land. Defaults to the catch-all gmail because
// the @legacyodyssey.com → gmail forwarding via Spacemail has been unreliable.
// Once Spacemail aliases are confirmed working, this can be set to
// hello@legacyodyssey.com via env var to keep replies fully on-brand.
const REPLY_TO = process.env.EMAIL_REPLY_TO || process.env.ADMIN_EMAIL || 'legacyodysseyapp@gmail.com';

// Words that appear as first word of a family/display name but aren't a real first name
const NON_NAME_WORDS = new Set(['the', 'your', 'our', 'my', 'a', 'an', 'apple', 'google', 'sample', 'demo', 'test', 'family', 'review']);

/**
 * Safely extract a first name from a display name or email.
 * Handles family names like "The Smith Family" → falls back to email prefix.
 */
function getFirstName(displayName, email) {
  if (displayName && displayName.trim()) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0];
    if (first && !NON_NAME_WORDS.has(first.toLowerCase())) {
      return first;
    }
  }
  // Fall back to email prefix, capitalized
  if (email) {
    const prefix = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
  }
  return 'there';
}

/**
 * Send welcome email to a new customer with a set-password link,
 * book URL, and app download links.
 */
async function sendWelcomeEmail({ to, displayName, setPasswordUrl, bookPassword, subdomain, customDomain }) {
  const client = getResend();
  if (!client) {
    console.warn('Resend not configured — skipping welcome email');
    return null;
  }

  const bookUrl = customDomain
    ? `https://www.${customDomain}`
    : `https://www.legacyodyssey.com/book/${subdomain}`;

  const html = buildWelcomeHtml({
    displayName,
    email: to,
    setPasswordUrl,
    bookPassword,
    bookUrl,
    subdomain,
    customDomain,
  });

  const { data, error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    replyTo: REPLY_TO,
    subject: `Welcome to Legacy Odyssey, ${getFirstName(displayName, to)}!`,
    html,
  });

  if (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }

  console.log(`Welcome email sent to ${to} (id: ${data.id})`);
  return data;
}

/**
 * Build the welcome email HTML.
 * Inline styles for maximum email client compatibility.
 */
function buildWelcomeHtml({ displayName, email, setPasswordUrl, bookPassword, bookUrl, subdomain, customDomain }) {
  const firstName = getFirstName(displayName, email);
  const websiteDisplay = customDomain ? `www.${customDomain}` : `legacyodyssey.com/book/${subdomain}`;
  const hasDomain = !!customDomain;
  const setPasswordHref = setPasswordUrl || 'https://legacyodyssey.com/account';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Legacy Odyssey</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFDF7;font-family:'Georgia','Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFDF7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:36px 40px 24px;background-color:#1A1A2E;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-family:'Georgia','Times New Roman',serif;font-size:30px;color:#C9A96E;letter-spacing:1px;">
                Legacy Odyssey
              </h1>
              <p style="margin:10px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#A0A0B8;letter-spacing:3px;text-transform:uppercase;">
                A Baby Book as Unique as Your Family
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;background-color:#FFFFFF;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">

              <h2 style="margin:0 0 20px;font-family:'Georgia','Times New Roman',serif;font-size:24px;color:#1A1A2E;">
                Welcome, ${firstName}!
              </h2>

              <p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A5A;line-height:1.7;">
                Thank you for choosing Legacy Odyssey! Your very own digital baby book account is all set up and waiting for you.${hasDomain ? ` Your custom website <a href="${bookUrl}" style="color:#C9A96E;font-weight:bold;text-decoration:none;">${websiteDisplay}</a> is being set up right now &mdash; we'll email you again as soon as it's live (usually within 15 minutes).` : ''}
              </p>

              <p style="margin:0 0 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A5A;line-height:1.7;">
                First, set your password using the button below, then download the app to start building your book.
              </p>

              <!-- Set Password Button (prominent) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${setPasswordHref}" style="display:inline-block;padding:16px 36px;background-color:#C9A96E;border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;color:#FFFFFF;text-decoration:none;font-weight:bold;letter-spacing:0.3px;">
                      Set Your Password &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#A0A0B8;">
                      This link expires in 24 hours. Use it to choose your password, then sign in to the app.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:28px;background-color:#FAF7F0;border:1px solid #E8E0D0;border-radius:10px;">
                    <h3 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:17px;color:#1A1A2E;">
                      &#128272; Your Account Info
                    </h3>
                    <p style="margin:0 0 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8A8A9A;line-height:1.5;">
                      Keep these handy &mdash; you'll need them to sign in to the app and share your book.
                    </p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8A9A;vertical-align:top;">
                          Book Password
                        </td>
                        <td style="padding:8px 0;font-family:'Courier New',monospace;font-size:15px;color:#1A1A2E;font-weight:bold;">
                          ${bookPassword}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:2px 0;">
                          <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A0A0B8;line-height:1.4;">
                            Share this with family &amp; friends so they can view the baby book online.
                          </p>
                        </td>
                      </tr>
                      <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid #E8E0D0;margin:0;"></td></tr>
                      <tr>
                        <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8A9A;vertical-align:top;">
                          Your Book URL
                        </td>
                        <td style="padding:8px 0;">
                          <a href="${bookUrl}" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#C9A96E;text-decoration:none;font-weight:bold;">
                            ${websiteDisplay}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Getting Started Steps -->
              <h3 style="margin:0 0 20px;font-family:'Georgia','Times New Roman',serif;font-size:19px;color:#1A1A2E;text-align:center;">
                Getting Started
              </h3>

              <!-- Step 1: Set Password -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#C9A96E;text-align:center;line-height:28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:bold;">1</div>
                  </td>
                  <td style="padding-left:12px;">
                    <h4 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#1A1A2E;">
                      Set Your Password
                    </h4>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      Click the <strong>Set Your Password</strong> button above to choose your password. You'll use it with your email to sign in to the app.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2: Download App -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#C9A96E;text-align:center;line-height:28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:bold;">2</div>
                  </td>
                  <td style="padding-left:12px;">
                    <h4 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#1A1A2E;">
                      Download the App
                    </h4>
                    <p style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      Available on iPhone and Android:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:10px;">
                          <a href="https://apps.apple.com/app/id6760883565" target="_blank" style="display:inline-block;padding:12px 20px;background-color:#1A1A2E;border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;text-decoration:none;font-weight:bold;letter-spacing:0.3px;">
                            &#127822; App Store
                          </a>
                        </td>
                        <td>
                          <a href="https://play.google.com/store/apps/details?id=com.legacyodyssey.app" target="_blank" style="display:inline-block;padding:12px 20px;background-color:#C9A96E;border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;text-decoration:none;font-weight:bold;letter-spacing:0.3px;">
                            &#129302; Google Play
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Step 3: Sign In -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;margin-top:16px;">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#C9A96E;text-align:center;line-height:28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:bold;">3</div>
                  </td>
                  <td style="padding-left:12px;">
                    <h4 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#1A1A2E;">
                      Sign In &amp; Start Building
                    </h4>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      Open the app and sign in with your email and new password. Add photos, write stories, record milestones, and fill in all the special details of your little one's journey.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 4: Share -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#C9A96E;text-align:center;line-height:28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:bold;">4</div>
                  </td>
                  <td style="padding-left:12px;">
                    <h4 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#1A1A2E;">
                      Share with Family &amp; Friends
                    </h4>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      Your book is already live at <a href="${bookUrl}" style="color:#C9A96E;text-decoration:none;font-weight:bold;">${websiteDisplay}</a>. Send the link along with the <strong>Book Password</strong> to grandparents, aunts, uncles &mdash; anyone you want to share the journey with.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Walkthrough box — link to the comprehensive Getting Started guide -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;margin-bottom:16px;">
                <tr>
                  <td style="padding:20px 22px;background-color:#FAF7F0;border:1px solid #E8E0D0;border-radius:10px;text-align:center;">
                    <h3 style="margin:0 0 8px;font-family:'Georgia','Times New Roman',serif;font-size:17px;color:#1A1A2E;">
                      Want a thorough walkthrough?
                    </h3>
                    <p style="margin:0 0 14px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      We wrote a complete guide that walks you through every section of your book, both passwords, sharing with family, and how the Time Vault works.
                    </p>
                    <a href="https://legacyodyssey.com/blog/getting-started-with-legacy-odyssey" style="display:inline-block;padding:11px 26px;background-color:transparent;border:1px solid #C9A96E;border-radius:6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#C9A96E;text-decoration:none;font-weight:600;">
                      Read the Getting Started Guide &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tip Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                <tr>
                  <td style="padding:18px 20px;background-color:#F0F7F0;border-left:4px solid #7CAE7C;border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4A5A4A;line-height:1.6;">
                      <strong>Tip:</strong> Start with a hero photo &mdash; it's the first thing visitors see when they open your book! You can always come back and add more sections whenever inspiration strikes.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 40px;background-color:#1A1A2E;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#C8C8D8;line-height:1.6;">
                Questions? Just reply to this email &mdash; a real human will get back to you.
              </p>
              <p style="margin:0 0 4px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#C9A96E;">
                Legacy Odyssey
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6A6A8A;">
                Every family has a story worth telling.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send a simple onboarding nudge email.
 * Used for the drip campaign (day 1, 3, 7, 13).
 *
 * unsubscribeUrl is appended to the footer and a List-Unsubscribe header
 * is set so Gmail/Apple Mail render a native unsubscribe button. If
 * unsubscribeUrl is omitted, the email goes out without one (transactional).
 */
async function sendOnboardingEmail({ to, subject, preheader, heading, body, ctaText, ctaUrl, unsubscribeUrl }) {
  const client = getResend();
  if (!client) return null;

  const unsubscribeFooter = unsubscribeUrl
    ? `<p style="font-size:11px;color:#a09080;margin:8px 0 0;">Don't want these emails? <a href="${unsubscribeUrl}" style="color:#a09080;text-decoration:underline;">Unsubscribe</a></p>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader || ''}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#c8a96e;letter-spacing:2px;">LEGACY ODYSSEY</span>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a2e;margin:0 0 16px;">${heading}</h1>
          <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 24px;">${body}</p>
          ${ctaText ? `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${ctaUrl}" style="display:inline-block;background:#c8a96e;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">${ctaText}</a>
          </td></tr></table>` : ''}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f0ece6;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">Legacy Odyssey &mdash; Your family's story, beautifully told</p>
          <p style="font-size:12px;color:#999;margin:4px 0 0;"><a href="mailto:help@legacyodyssey.com" style="color:#c8a96e;">help@legacyodyssey.com</a></p>
          ${unsubscribeFooter}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // List-Unsubscribe headers (RFC 8058) — Gmail/Apple Mail render a native
  // "Unsubscribe" button next to the sender when these are present.
  const headers = unsubscribeUrl
    ? {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@legacyodyssey.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }
    : undefined;

  const { data, error } = await client.emails.send({
    from: FROM_ADDRESS,
    to,
    replyTo: REPLY_TO,
    subject,
    html,
    headers,
  });

  if (error) {
    console.error(`Onboarding email error (${subject}):`, error);
    return null;
  }

  console.log(`Onboarding email sent to ${to}: "${subject}" (id: ${data.id})`);
  return data;
}

function buildUnsub(familyId) {
  if (!familyId) return null;
  try {
    const { buildUnsubscribeUrl } = require('./unsubscribeTokens');
    return buildUnsubscribeUrl(familyId);
  } catch (err) {
    console.warn('buildUnsubscribeUrl failed:', err.message);
    return null;
  }
}

/**
 * Send Day 1 nudge: "Upload your first photo"
 */
async function sendDay1Email({ to, displayName, familyId }) {
  const firstName = getFirstName(displayName, to);
  return sendOnboardingEmail({
    to,
    subject: `${firstName}, your book is waiting for its first photo`,
    preheader: 'Upload a photo to get started with your Legacy Odyssey book.',
    heading: `Hey ${firstName}, ready to get started?`,
    body: `Your Legacy Odyssey book is set up and ready to go! The best way to start is by uploading your first photo. Open the app, tap any section, and add a photo that means something to your family. It only takes a minute, and it'll make your book feel like home.`,
    ctaText: 'Open the App',
    ctaUrl: 'https://legacyodyssey.com/download',
    unsubscribeUrl: buildUnsub(familyId),
  });
}

/**
 * Send Day 3 nudge: "Your book is waiting"
 */
async function sendDay3Email({ to, displayName, familyId }) {
  const firstName = getFirstName(displayName, to);
  return sendOnboardingEmail({
    to,
    subject: `Your family's story is waiting to be told`,
    preheader: 'Add milestones, letters, and memories to your Legacy Odyssey book.',
    heading: `${firstName}, there's so much to capture`,
    body: `Did you know your book has sections for milestones, family recipes, letters to your little one, and so much more? Each section is designed to help you preserve the moments that matter most. Pick one and start filling it in today.`,
    ctaText: 'Add a Memory',
    ctaUrl: 'https://legacyodyssey.com/download',
    unsubscribeUrl: buildUnsub(familyId),
  });
}

/**
 * Send Day 7 nudge: "Share your book"
 */
async function sendDay7Email({ to, displayName, subdomain, customDomain, familyId }) {
  const firstName = getFirstName(displayName, to);
  const bookUrl = customDomain
    ? `https://www.${customDomain}`
    : subdomain
      ? `https://${subdomain}.legacyodyssey.com`
      : 'https://legacyodyssey.com/download';
  const bookDisplay = customDomain
    ? `www.${customDomain}`
    : subdomain
      ? `${subdomain}.legacyodyssey.com`
      : 'your book';
  return sendOnboardingEmail({
    to,
    subject: `Share your book with the people who matter`,
    preheader: 'Your family and friends would love to see your book.',
    heading: `${firstName}, your book is ready to share`,
    body: `Your Legacy Odyssey book is looking great! Now's the perfect time to share it with grandparents, aunts, uncles, and friends. Send them <strong>${bookDisplay}</strong> along with your book password and they'll be able to see everything you've added from any device.`,
    ctaText: 'View Your Book',
    ctaUrl: bookUrl,
    unsubscribeUrl: buildUnsub(familyId),
  });
}

/**
 * Send Day 13 check-in: "Have you shared your book yet?"
 */
async function sendDay13Email({ to, displayName, subdomain, customDomain, familyId }) {
  const firstName = getFirstName(displayName, to);
  const bookUrl = customDomain
    ? `https://www.${customDomain}`
    : subdomain
      ? `https://${subdomain}.legacyodyssey.com`
      : 'https://legacyodyssey.com/download';
  return sendOnboardingEmail({
    to,
    subject: `${firstName}, have you shared your book yet?`,
    preheader: "Your family would love to see what you've built.",
    heading: `${firstName}, your book is ready to share`,
    body: `It's been two weeks since you set up your Legacy Odyssey book — how's it coming along? Now's the perfect time to share it with the people who matter most. Send the link to grandparents, aunts, uncles, and friends. They can visit from any device, anywhere in the world, anytime they miss your little one.`,
    ctaText: 'View & Share Your Book',
    ctaUrl: bookUrl,
    unsubscribeUrl: buildUnsub(familyId),
  });
}

/**
 * Send gift purchase confirmation email to the buyer.
 */
async function sendGiftPurchaseEmail({ to, buyerName, giftCode, redeemUrl }) {
  const firstName = getFirstName(buyerName, to);
  return sendOnboardingEmail({
    to,
    subject: 'Your Legacy Odyssey gift is ready!',
    preheader: `Gift code: ${giftCode} — share it with someone special.`,
    heading: `Hey ${firstName}, your gift is ready!`,
    body: `Thank you for purchasing a Legacy Odyssey gift! Here's the gift code to share:<br><br>
      <div style="background:#f5f0eb;border:2px dashed #c8a96e;border-radius:8px;padding:16px;text-align:center;font-size:20px;font-weight:bold;letter-spacing:2px;color:#1a1a2e;margin:8px 0;">${giftCode}</div><br>
      The recipient can redeem this at:<br>
      <a href="${redeemUrl}" style="color:#c8a96e;">${redeemUrl}</a><br><br>
      This gift includes one year of Legacy Odyssey plus a custom domain setup (one-time, non-recurring). The code is valid for one year from today.`,
    ctaText: 'Copy Redemption Link',
    ctaUrl: redeemUrl,
  });
}

/**
 * Send gift notification email to the recipient (optional).
 */
async function sendGiftNotificationEmail({ to, buyerName, message, redeemUrl }) {
  const from = buyerName || 'Someone special';
  return sendOnboardingEmail({
    to,
    subject: `${from} sent you a Legacy Odyssey gift!`,
    preheader: 'You received a gift — a beautiful digital baby book or family album.',
    heading: `${from} sent you a gift!`,
    body: `You've been gifted a year of Legacy Odyssey — a beautiful digital baby book or family album with your own custom .com domain.${message ? `<br><br><em>"${message}"</em>` : ''}<br><br>Click below to redeem your gift, create your account, and pick your domain.`,
    ctaText: 'Redeem Your Gift',
    ctaUrl: redeemUrl,
  });
}

/**
 * Send a branded password reset email.
 */
async function sendPasswordResetEmail({ to, resetUrl }) {
  const client = getResend();
  if (!client) {
    console.warn('Resend not configured — skipping password reset email');
    return null;
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#c8a96e;letter-spacing:2px;">LEGACY ODYSSEY</span>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a2e;margin:0 0 16px;">Reset your password</h1>
          <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 8px;">
            We received a request to reset the password for your Legacy Odyssey account.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 28px;">
            Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px;">
            <a href="${resetUrl}" style="display:inline-block;background:#c8a96e;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Reset Password</a>
          </td></tr></table>
          <p style="font-size:13px;line-height:1.6;color:#8a8a8a;margin:0;">
            If you didn't request this, you can safely ignore this email — your password won't change.
          </p>
          <p style="font-size:12px;line-height:1.6;color:#b0b0b0;margin:16px 0 0;word-break:break-all;">
            Or copy this link: <a href="${resetUrl}" style="color:#c8a96e;">${resetUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f0ece6;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">Legacy Odyssey &mdash; Your family's story, beautifully told</p>
          <p style="font-size:12px;color:#999;margin:4px 0 0;"><a href="mailto:help@legacyodyssey.com" style="color:#c8a96e;">help@legacyodyssey.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { data, error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    replyTo: REPLY_TO,
    subject: 'Reset your Legacy Odyssey password',
    html,
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }

  console.log(`Password reset email sent to ${to} (id: ${data.id})`);
  return data;
}

/**
 * Send a cancellation confirmation email when admin cancels or deletes an account.
 *
 * type='archive' — soft cancel (Stripe at period end, data preserved 1 yr)
 * type='delete'  — hard delete (everything wiped, unrecoverable)
 *
 * Best-effort: logs and swallows errors so the cancel flow doesn't fail just
 * because email couldn't go out (the account state is already correct).
 */
async function sendCancellationEmail({ to, displayName, type, periodEnd, customDomain, subdomain }) {
  const client = getResend();
  if (!client) {
    console.warn('Resend not configured — skipping cancellation email');
    return null;
  }
  if (!to) {
    console.warn('No recipient — skipping cancellation email');
    return null;
  }

  const firstName = getFirstName(displayName, to);
  const isHard = type === 'delete';
  const bookUrl = customDomain
    ? `https://www.${customDomain}`
    : subdomain ? `https://${subdomain}.legacyodyssey.com` : null;
  const niceDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const subject = isHard
    ? 'Your Legacy Odyssey account has been removed'
    : 'Your Legacy Odyssey subscription has been canceled';

  const heading = isHard
    ? `${firstName}, your account has been removed`
    : `${firstName}, your subscription has been canceled`;

  // Body content — different by type
  const body = isHard
    ? `<p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 16px;">
         We're confirming that your Legacy Odyssey account has been permanently removed at your request. All photos, stories, and content associated with your book have been deleted, and your custom domain auto-renewal has been turned off.
       </p>
       <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 24px;">
         This action cannot be undone. If you'd like to start fresh in the future, we'd love to have you back &mdash; just visit <a href="https://legacyodyssey.com" style="color:#c8a96e;">legacyodyssey.com</a> to create a new account.
       </p>`
    : `<p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 16px;">
         We're confirming that your Legacy Odyssey subscription has been canceled${niceDate ? `. You'll continue to have access to your book until <strong>${niceDate}</strong>` : ''}, after which your book site will go offline and your custom domain auto-renewal will stop.
       </p>
       <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 16px;">
         <strong>Your photos and stories are safe.</strong> We'll keep them stored securely for one full year. If you change your mind during that time, just reply to this email and we'll bring everything back exactly as you left it.
       </p>
       ${bookUrl ? `<p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 24px;">Want to download your photos before then? Reply to this email and we'll help.</p>` : ''}
       <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
         <a href="https://legacyodyssey.com/account" style="display:inline-block;background:#c8a96e;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Reactivate My Subscription</a>
       </td></tr></table>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#c8a96e;letter-spacing:2px;">LEGACY ODYSSEY</span>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a2e;margin:0 0 16px;">${heading}</h1>
          ${body}
          <p style="font-size:13px;line-height:1.6;color:#8a8a8a;margin:24px 0 0;">
            Questions? Just reply to this email &mdash; a real human will get back to you.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f0ece6;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">Legacy Odyssey &mdash; Every family has a story worth telling</p>
          <p style="font-size:12px;color:#999;margin:4px 0 0;"><a href="mailto:hello@legacyodyssey.com" style="color:#c8a96e;">hello@legacyodyssey.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });
    if (error) {
      console.error('Failed to send cancellation email:', error);
      return null;
    }
    console.log(`Cancellation email (${type}) sent to ${to} (id: ${data.id})`);
    return data;
  } catch (err) {
    console.error('Cancellation email error:', err.message);
    return null;
  }
}

/**
 * Welcome-back email sent when a previously-archived family is reactivated.
 * Triggered by the webhook safety net when Stripe reports the subscription
 * went back to 'active' on an archived family.
 */
async function sendReactivationEmail({ to, displayName, customDomain, subdomain }) {
  const client = getResend();
  if (!client || !to) return null;
  const firstName = getFirstName(displayName, to);
  const bookUrl = customDomain
    ? `https://www.${customDomain}`
    : subdomain ? `https://${subdomain}.legacyodyssey.com` : 'https://legacyodyssey.com';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#c8a96e;letter-spacing:2px;">LEGACY ODYSSEY</span>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a2e;margin:0 0 16px;">Welcome back, ${firstName}!</h1>
          <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 16px;">
            Your Legacy Odyssey subscription is active again and your book is back online. All your photos, stories, and content are right where you left them.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${bookUrl}" style="display:inline-block;background:#c8a96e;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Visit Your Book</a>
          </td></tr></table>
          <p style="font-size:13px;line-height:1.6;color:#8a8a8a;margin:0;">Glad to have you back. Reply if you need anything.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f0ece6;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">Legacy Odyssey &mdash; Every family has a story worth telling</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { data, error } = await client.emails.send({
      from: FROM_ADDRESS, to: [to],
      replyTo: REPLY_TO,
      subject: `Welcome back to Legacy Odyssey, ${firstName}!`,
      html,
    });
    if (error) { console.error('Reactivation email failed:', error); return null; }
    console.log(`Reactivation email sent to ${to} (id: ${data.id})`);
    return data;
  } catch (err) {
    console.error('Reactivation email error:', err.message);
    return null;
  }
}

/**
 * Sent when the site-live detection cron sees a customer's site responding
 * for the first time. Confirms the URL works and reminds them of the book
 * password to share with family.
 */
async function sendSiteLiveEmail({ to, displayName, customDomain, subdomain, bookPassword }) {
  const client = getResend();
  if (!client || !to) return null;
  const firstName = getFirstName(displayName, to);
  const url = customDomain
    ? `https://www.${customDomain}`
    : subdomain
      ? `https://${subdomain}.legacyodyssey.com`
      : 'https://legacyodyssey.com';
  const display = customDomain ? `www.${customDomain}` : subdomain ? `${subdomain}.legacyodyssey.com` : 'your book';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#c8a96e;letter-spacing:2px;">LEGACY ODYSSEY</span>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1a2e;margin:0 0 16px;">${firstName}, your site is live! 🎉</h1>
          <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 22px;">
            Your custom site at <a href="${url}" style="color:#c8a96e;font-weight:bold;text-decoration:none;">${display}</a> is now online and password-protected. It works with or without "www" in front, on any device.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#c8a96e;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Visit Your Site &rarr;</a>
          </td></tr></table>
          ${bookPassword ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
            <tr><td style="padding:18px 22px;background:#FAF7F0;border:1px solid #E8E0D0;border-radius:10px;">
              <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8A8A9A;text-transform:uppercase;letter-spacing:0.5px;">Book password (share this with family)</p>
              <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:bold;color:#1a1a2e;letter-spacing:1px;">${bookPassword}</p>
            </td></tr>
          </table>` : ''}
          <p style="font-size:15px;line-height:1.7;color:#4a4a4a;margin:0 0 16px;">
            <strong>Ready to share?</strong> Send <em>${display}</em> and the book password above to grandparents, aunts, uncles, and friends. Anyone with the link and password can view from anywhere.
          </p>
          <p style="font-size:13px;line-height:1.6;color:#8a8a8a;margin:24px 0 0;">
            Want a complete walkthrough of every section in your book? Read the <a href="https://legacyodyssey.com/blog/getting-started-with-legacy-odyssey" style="color:#c8a96e;">Getting Started guide</a>.
          </p>
          <p style="font-size:13px;line-height:1.6;color:#8a8a8a;margin:8px 0 0;">
            Questions? Just reply &mdash; a real human will get back to you.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f0ece6;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">Legacy Odyssey &mdash; Every family has a story worth telling</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { data, error } = await client.emails.send({
      from: FROM_ADDRESS, to: [to], replyTo: REPLY_TO,
      subject: `${firstName}, your site is live!`,
      html,
    });
    if (error) { console.error('Site-live email failed:', error); return null; }
    console.log(`Site-live email sent to ${to} (id: ${data.id})`);
    return data;
  } catch (err) {
    console.error('Site-live email error:', err.message);
    return null;
  }
}

module.exports = {
  sendWelcomeEmail,
  sendOnboardingEmail,
  sendDay1Email,
  sendDay3Email,
  sendDay7Email,
  sendDay13Email,
  sendGiftPurchaseEmail,
  sendGiftNotificationEmail,
  sendPasswordResetEmail,
  sendCancellationEmail,
  sendReactivationEmail,
  sendSiteLiveEmail,
};
