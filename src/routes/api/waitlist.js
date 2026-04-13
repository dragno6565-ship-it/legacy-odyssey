const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { sendCapiEvent } = require('../../utils/metaCapi');
const { sendEmail } = require('../../utils/sendEmail');

const WELCOME_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the list</title>
</head>
<body style="margin:0;padding:0;background:#F8F2E6;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2E6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFCF5;border:1px solid #E8DCC8;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1E1812;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#B8935A;letter-spacing:0.1em;">LEGACY ODYSSEY</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 24px;font-size:26px;color:#1E1812;line-height:1.3;">You're on the list.</p>

              <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">
                Thank you for signing up for Legacy Odyssey. You're eligible for our introductory rate — <strong>$29 for your first year</strong>. That's less than $2.50/month to preserve your family's memories on your own exclusive .com domain.
              </p>

              <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">
                After your first year, the plan renews at $49.99/year. Cancel anytime.
              </p>

              <!-- Pricing box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EDD8;border:1px solid #D4B483;border-radius:6px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:15px;color:#1E1812;font-weight:bold;">Introductory pricing:</p>
                    <p style="margin:0 0 6px;font-size:15px;color:#4A3F32;">&#10003; &nbsp;$29 first year &mdash; your family's site + first .com domain</p>
                    <p style="margin:0 0 6px;font-size:15px;color:#4A3F32;">&#10003; &nbsp;Renews at $49.99/year &mdash; cancel anytime</p>
                    <p style="margin:0 0 6px;font-size:15px;color:#4A3F32;">&#10003; &nbsp;Additional domains available at $12.99/year each</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">
                While you wait, take a look at the live demos to see exactly what you'll get:
              </p>

              <!-- Demo links -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="https://your-childs-name.com" style="display:block;background:#F8F2E6;border:1px solid #D4B483;border-radius:6px;padding:14px 18px;text-decoration:none;color:#1E1812;">
                      <span style="font-size:12px;color:#B8935A;display:block;margin-bottom:3px;letter-spacing:0.08em;">BABY BOOK DEMO</span>
                      <span style="font-size:15px;font-weight:bold;">your-childs-name.com</span>
                      <span style="font-size:12px;color:#6B5B45;display:block;margin-top:2px;">Password: legacy</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="https://your-family-photo-album.legacyodyssey.com" style="display:block;background:#F8F2E6;border:1px solid #D4B483;border-radius:6px;padding:14px 18px;text-decoration:none;color:#1E1812;">
                      <span style="font-size:12px;color:#B8935A;display:block;margin-bottom:3px;letter-spacing:0.08em;">FAMILY ALBUM DEMO</span>
                      <span style="font-size:15px;font-weight:bold;">your-family-photo-album.legacyodyssey.com</span>
                      <span style="font-size:12px;color:#6B5B45;display:block;margin-top:2px;">Password: family</span>
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:16px;color:#4A3F32;line-height:1.7;">
                Every Legacy Odyssey family gets their own private .com &mdash; nine chapters of memories, unlimited photos, and a <strong>Time Vault</strong> where you write letters sealed until your child's 18th birthday.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://legacyodyssey.com" style="display:inline-block;background:#B8935A;color:#1E1812;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">
                      See Legacy Odyssey &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #E8DCC8;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#9C8B78;">Legacy Odyssey &middot; legacyodyssey.com</p>
              <p style="margin:0;font-size:12px;color:#B8A090;">
                You received this because you signed up at legacyodyssey.com.<br>
                Questions? Reply to this email or contact <a href="mailto:help@legacyodyssey.com" style="color:#B8935A;">help@legacyodyssey.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const router = Router();

// POST /api/waitlist
router.post('/', async (req, res) => {
  try {
    const { email, source = 'landing_page' } = req.body;

    if (!email || !email.includes('@') || !email.slice(email.indexOf('@')).includes('.')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert({ email: email.trim().toLowerCase(), source });

    if (error) {
      if (error.code === '23505') {
        // Unique violation — already on the list
        return res.json({ success: true, message: "You're already on the list!" });
      }
      throw error;
    }

    sendCapiEvent({
      eventName: 'Lead',
      eventId: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userData: { email: email.trim().toLowerCase() },
      eventSourceUrl: 'https://legacyodyssey.com',
      clientIpAddress: req.ip || req.headers['x-forwarded-for'],
      clientUserAgent: req.headers['user-agent'],
    });

    // Fire and forget — never block the response
    sendEmail({
      to: email.trim(),
      subject: "You're on the Legacy Odyssey list",
      html: WELCOME_EMAIL_HTML,
    });

    res.json({ success: true, message: "You're on the list!" });
  } catch (err) {
    console.error('Waitlist error:', err.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
