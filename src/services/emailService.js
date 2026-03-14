const { Resend } = require('resend');

let resend = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssy.com>';

/**
 * Send welcome email to a new customer with their login credentials,
 * book URL, and APK download link.
 */
async function sendWelcomeEmail({ to, displayName, tempPassword, bookPassword, subdomain, customDomain, apkUrl }) {
  const client = getResend();
  if (!client) {
    console.warn('Resend not configured — skipping welcome email');
    return null;
  }

  const bookUrl = customDomain
    ? `https://www.${customDomain}`
    : `https://www.legacyodyssy.com/book/${subdomain}`;

  const html = buildWelcomeHtml({
    displayName,
    tempPassword,
    bookPassword,
    bookUrl,
    subdomain,
    customDomain,
    apkUrl,
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
function buildWelcomeHtml({ displayName, tempPassword, bookPassword, bookUrl, subdomain, customDomain, apkUrl }) {
  const firstName = displayName.split(' ')[0];
  const websiteDisplay = customDomain ? `www.${customDomain}` : `legacyodyssy.com/book/${subdomain}`;
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
                      Download the App
                    </h4>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                      Tap the button below on your Android phone to install Legacy Odyssey. <span style="color:#8A8A9A;font-size:12px;">(iOS coming soon!)</span>
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${apkUrl}" target="_blank" style="display:inline-block;padding:16px 40px;background-color:#C9A96E;border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;color:#FFFFFF;text-decoration:none;font-weight:bold;letter-spacing:0.5px;">
                      &#128242; Download App
                    </a>
                  </td>
                </tr>
              </table>

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

module.exports = {
  sendWelcomeEmail,
};
