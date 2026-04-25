const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendCapiEvent } = require('../../utils/metaCapi');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many messages. Please try again later.' },
});

router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, topic, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Send via Resend to help@legacyodyssey.com
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!resend) {
      return res.status(500).json({ error: 'Email service not configured.' });
    }

    const topicLabels = {
      general: 'General Question',
      account: 'Account Help',
      billing: 'Billing Question',
      bug: 'Bug Report',
      feature: 'Feature Request',
    };

    // Send to both help@legacyodyssey.com (the public-facing alias) AND the
    // catch-all gmail directly. The @legacyodyssey.com → legacyodysseyapp@gmail.com
    // forwarding has been unreliable in the past, so we send to the gmail
    // explicitly to guarantee delivery. Customers see help@legacyodyssey.com
    // as the brand-consistent contact destination; we receive it regardless.
    const adminEmail = process.env.ADMIN_EMAIL || 'legacyodysseyapp@gmail.com';
    const recipients = ['help@legacyodyssey.com'];
    if (adminEmail && !recipients.includes(adminEmail)) recipients.push(adminEmail);

    const { data, error } = await resend.emails.send({
      from: 'Legacy Odyssey <noreply@legacyodyssey.com>',
      to: recipients,
      replyTo: email,
      subject: `[${topicLabels[topic] || 'Contact'}] from ${name}`,
      html: `
        <h3>New contact form submission</h3>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Topic:</strong> ${topicLabels[topic] || topic}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color:#999;font-size:12px;">Reply directly to this email to respond to ${name}.</p>
      `,
    });

    if (error) {
      console.error('Contact form email error:', error);
      return res.status(500).json({ error: 'Failed to send message.' });
    }

    console.log(`Contact form: ${topic} from ${email} (${data.id})`);

    sendCapiEvent({
      eventName: 'Lead',
      eventId: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userData: {
        email,
        firstName: name?.split(' ')[0],
        lastName: name?.split(' ').slice(1).join(' '),
      },
      eventSourceUrl: 'https://legacyodyssey.com',
      clientIpAddress: req.ip || req.headers['x-forwarded-for'],
      clientUserAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
