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
  const websiteDisplay = customDomain || `legacyodyssy.com/book/${subdomain}`;

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
            <td align="center" style="padding:30px 40px 20px;background-color:#1A1A2E;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-family:'Georgia','Times New Roman',serif;font-size:28px;color:#C9A96E;letter-spacing:1px;">
                Legacy Odyssey
              </h1>
              <p style="margin:8px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#A0A0B8;letter-spacing:3px;text-transform:uppercase;">
                Premium Digital Baby Book
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;background-color:#FFFFFF;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">

              <h2 style="margin:0 0 20px;font-family:'Georgia','Times New Roman',serif;font-size:22px;color:#1A1A2E;">
                Welcome, ${firstName}!
              </h2>

              <p style="margin:0 0 20px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A5A;line-height:1.6;">
                Your Legacy Odyssey baby book is ready! We're so excited for you to start capturing your family's most precious moments.
              </p>

              <p style="margin:0 0 24px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A5A;line-height:1.6;">
                Here's everything you need to get started:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;background-color:#FAF7F0;border:1px solid #E8E0D0;border-radius:8px;">
                    <h3 style="margin:0 0 16px;font-family:'Georgia','Times New Roman',serif;font-size:16px;color:#1A1A2E;">
                      Your Account Details
                    </h3>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8A9A;width:120px;">
                          App Password:
                        </td>
                        <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:14px;color:#1A1A2E;font-weight:bold;">
                          ${tempPassword}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8A9A;">
                          Book Password:
                        </td>
                        <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:14px;color:#1A1A2E;font-weight:bold;">
                          ${bookPassword}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8A9A;">
                          Your Book:
                        </td>
                        <td style="padding:6px 0;">
                          <a href="${bookUrl}" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#C9A96E;text-decoration:none;font-weight:bold;">
                            ${websiteDisplay}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Step 1: Download App -->
              <h3 style="margin:0 0 12px;font-family:'Georgia','Times New Roman',serif;font-size:17px;color:#1A1A2E;">
                Step 1: Download the App
              </h3>
              <p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                Download the Legacy Odyssey app to start building your baby book. Tap the button below on your Android phone:
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="background-color:#C9A96E;border-radius:6px;">
                    <a href="${apkUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#FFFFFF;text-decoration:none;font-weight:bold;letter-spacing:0.5px;">
                      Download App (Android)
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <h3 style="margin:0 0 12px;font-family:'Georgia','Times New Roman',serif;font-size:17px;color:#1A1A2E;">
                Step 2: Sign In
              </h3>
              <p style="margin:0 0 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                Open the app and sign in with your email address and the <strong>App Password</strong> listed above. Once signed in, you can add photos, write stories, and fill in all the special details of your little one's journey.
              </p>

              <!-- Step 3 -->
              <h3 style="margin:0 0 12px;font-family:'Georgia','Times New Roman',serif;font-size:17px;color:#1A1A2E;">
                Step 3: Share Your Book
              </h3>
              <p style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A5A;line-height:1.6;">
                Your book is already live at <a href="${bookUrl}" style="color:#C9A96E;text-decoration:none;font-weight:bold;">${websiteDisplay}</a>. Share the link and the <strong>Book Password</strong> with family and friends so they can enjoy the story too!
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 40px;background-color:#1A1A2E;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8A8A9A;">
                Questions? Just reply to this email &mdash; we're here to help.
              </p>
              <p style="margin:0;font-family:'Georgia','Times New Roman',serif;font-size:14px;color:#C9A96E;">
                Legacy Odyssey
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
