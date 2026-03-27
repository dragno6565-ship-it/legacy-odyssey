const { Resend } = require('resend');

let resend = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';

/**
 * Send welcome email to a new customer with their login credentials,
 * book URL, and APK download link.
 */
async function sendWelcomeEmail({ to, displayName, tempPassword, bookPassword, subdomain, customDomain, apkUrl, expoGoUrl }) {
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
    tempPassword,
    bookPassword,
    bookUrl,
    subdomain,
    customDomain,
    apkUrl,
    expoGoUrl,
  });

  const { data, error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    subject: `Welcome to Legacy Odyssey, ${displayName.split(' ')[0]}!`,
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
function buildWelcomeHtml({ displayName, tempPassword, bookPassword, bookUrl, subdomain, customDomain, apkUrl, expoGoUrl }) {
  const firstName = displayName.split(' ')[0];
  const websiteDisplay = customDomain ? `www.${customDomain}` : `legacyodyssey.com/book/${subdomain}`;
  const hasDomain = !!customDomain;

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
                Welcome, ${firstName}! &#127881;
              </h2>

              <p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A5A;line-height:1.7;">
                Thank you for choosing Legacy Odyssey! Your very own digital baby book is all set up and waiting for you.${hasDomain ? ` Your custom website <a href="${bookUrl}" style="color:#C9A96E;font-weight:bold;text-decoration:none;">${websiteDisplay}</a> is live and ready to share with the world.` : ''}
              </p>

              <p style="margin:0 0 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A5A;line-height:1.7;">
                Below you'll find your login details and a quick guide to get started. It only takes a few minutes!
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:28px;background-color:#FAF7F0;border:1px solid #E8E0D0;border-radius:10px;">
                    <h3 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:17px;color:#1A1A2E;">
                      &#128272; Your Login Credentials
                    </h3>
                    <p style="margin:0 0 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8A8A9A;line-height:1.5;">
                      Keep these handy &mdash; you'll need them to sign in to the app and share your book.
                    </p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8A9A;width:130px;vertical-align:top;">
                          App Password
                        </td>
                        <td style="padding:8px 0;font-family:'Courier New',monospace;font-size:15px;color:#1A1A2E;font-weight:bold;">
                          ${tempPassword}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:2px 0;">
                          <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A0A0B8;line-height:1.4;">
                            Use this with your email to sign in to the Legacy Odyssey app.
                          </p>
                        </td>
                      </tr>
                      <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid #E8E0D0;margin:0;"></td></tr>
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

              <!-- Step 1: Download App -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#C9A96E;text-align:center;line-height:28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:bold;">1</div>
                  </td>
                  <td style="padding-left:12px;">
                    <h4 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#1A1A2E;">
                      Get the App
                    </h4>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      Choose your device below to install Legacy Odyssey:
                    </p>
                  </td>
                </tr>
              </table>

              <!-- iPhone / Android buttons side by side -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 12px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        ${expoGoUrl ? `<td align="center" style="padding-right:10px;">
                          <a href="https://apps.apple.com/app/expo-go/id982107779" target="_blank" style="display:inline-block;padding:14px 24px;background-color:#1A1A2E;border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;text-decoration:none;font-weight:bold;letter-spacing:0.3px;">
                            &#127822; iPhone
                          </a>
                        </td>` : ''}
                        ${apkUrl ? `<td align="center" style="padding-left:10px;">
                          <a href="${apkUrl}" target="_blank" style="display:inline-block;padding:14px 24px;background-color:#C9A96E;border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;text-decoration:none;font-weight:bold;letter-spacing:0.3px;">
                            &#129302; Android
                          </a>
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${expoGoUrl ? `<!-- iPhone Instructions -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="padding:16px 20px;background-color:#F5F0FF;border:1px solid #E0D8F0;border-radius:8px;">
                    <p style="margin:0 0 8px;font-family:'Georgia','Times New Roman',serif;font-size:14px;color:#1A1A2E;font-weight:bold;">
                      &#127822; iPhone Instructions
                    </p>
                    <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4A4A5A;line-height:1.6;">
                      1. Tap the <strong>iPhone</strong> button above to install the free <strong>Expo Go</strong> app from the App Store.
                    </p>
                    <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4A4A5A;line-height:1.6;">
                      2. Once installed, tap this link to open Legacy Odyssey:
                    </p>
                    <p style="margin:0;text-align:center;">
                      <a href="${expoGoUrl}" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#C9A96E;text-decoration:none;font-weight:bold;">
                        &#128279; Open in Expo Go
                      </a>
                    </p>
                  </td>
                </tr>
              </table>` : `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;"><tr><td>&nbsp;</td></tr></table>`}

              <!-- Step 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#C9A96E;text-align:center;line-height:28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:bold;">2</div>
                  </td>
                  <td style="padding-left:12px;">
                    <h4 style="margin:0 0 6px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#1A1A2E;">
                      Sign In &amp; Start Building
                    </h4>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      Open the app and sign in with your email and <strong>App Password</strong> above. From there you can add photos, write stories, record milestones, and fill in all the special details of your little one's journey.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#C9A96E;text-align:center;line-height:28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:bold;">3</div>
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

              <!-- Tip Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                <tr>
                  <td style="padding:18px 20px;background-color:#F0F7F0;border-left:4px solid #7CAE7C;border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4A5A4A;line-height:1.6;">
                      <strong>&#128161; Tip:</strong> Start with a hero photo &mdash; it's the first thing visitors see when they open your book! You can always come back and add more sections whenever inspiration strikes.
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
 */
async function sendOnboardingEmail({ to, subject, preheader, heading, body, ctaText, ctaUrl }) {
  const client = getResend();
  if (!client) return null;

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
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { data, error } = await client.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`Onboarding email error (${subject}):`, error);
    return null;
  }

  console.log(`Onboarding email sent to ${to}: "${subject}" (id: ${data.id})`);
  return data;
}

/**
 * Send Day 1 nudge: "Upload your first photo"
 */
async function sendDay1Email({ to, displayName }) {
  const firstName = displayName?.split(' ')[0] || 'there';
  return sendOnboardingEmail({
    to,
    subject: `${firstName}, your book is waiting for its first photo`,
    preheader: 'Upload a photo to get started with your Legacy Odyssey book.',
    heading: `Hey ${firstName}, ready to get started?`,
    body: `Your Legacy Odyssey book is set up and ready to go! The best way to start is by uploading your first photo. Open the app, tap any section, and add a photo that means something to your family. It only takes a minute, and it'll make your book feel like home.`,
    ctaText: 'Open the App',
    ctaUrl: 'https://legacyodyssey.com',
  });
}

/**
 * Send Day 3 nudge: "Your book is waiting"
 */
async function sendDay3Email({ to, displayName }) {
  const firstName = displayName?.split(' ')[0] || 'there';
  return sendOnboardingEmail({
    to,
    subject: `Your family's story is waiting to be told`,
    preheader: 'Add milestones, letters, and memories to your Legacy Odyssey book.',
    heading: `${firstName}, there's so much to capture`,
    body: `Did you know your book has sections for milestones, family recipes, letters to your little one, and so much more? Each section is designed to help you preserve the moments that matter most. Pick one and start filling it in today.`,
    ctaText: 'Add a Memory',
    ctaUrl: 'https://legacyodyssey.com',
  });
}

/**
 * Send Day 7 nudge: "Share your book"
 */
async function sendDay7Email({ to, displayName }) {
  const firstName = displayName?.split(' ')[0] || 'there';
  return sendOnboardingEmail({
    to,
    subject: `Share your book with the people who matter`,
    preheader: 'Your family and friends would love to see your book.',
    heading: `${firstName}, your book is ready to share`,
    body: `Your Legacy Odyssey book is looking great! Now's the perfect time to share it with grandparents, aunts, uncles, and friends. Just send them your book's website link and password. They'll be able to see everything you've added from any device.`,
    ctaText: 'View Your Book',
    ctaUrl: 'https://legacyodyssey.com',
  });
}

/**
 * Send Day 13 nudge: "Trial ending soon"
 */
async function sendTrialEndingEmail({ to, displayName }) {
  const firstName = displayName?.split(' ')[0] || 'there';
  return sendOnboardingEmail({
    to,
    subject: `${firstName}, your free trial ends tomorrow`,
    preheader: 'Keep your family memories safe — subscribe to Legacy Odyssey.',
    heading: `Your trial ends tomorrow`,
    body: `${firstName}, your Legacy Odyssey trial is ending soon. If you've been enjoying building your family's book, subscribe now to keep your memories safe and your website live. All your photos, stories, and milestones will be preserved exactly as you left them.`,
    ctaText: 'Subscribe Now',
    ctaUrl: 'https://legacyodyssey.com',
  });
}

/**
 * Send gift purchase confirmation email to the buyer.
 */
async function sendGiftPurchaseEmail({ to, buyerName, giftCode, redeemUrl }) {
  const firstName = buyerName?.split(' ')[0] || 'there';
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

module.exports = {
  sendWelcomeEmail,
  sendOnboardingEmail,
  sendDay1Email,
  sendDay3Email,
  sendDay7Email,
  sendTrialEndingEmail,
  sendGiftPurchaseEmail,
  sendGiftNotificationEmail,
};
