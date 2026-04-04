const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email to:', to);
    return;
  }
  try {
    await resend.emails.send({
      from: 'Legacy Odyssey <hello@legacyodyssey.com>',
      to,
      subject,
      html,
    });
    console.log('Email sent to:', to);
  } catch (err) {
    console.error('Email send error (non-fatal):', err.message);
  }
}

module.exports = { sendEmail };
