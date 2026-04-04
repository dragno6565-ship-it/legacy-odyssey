const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { sendCapiEvent } = require('../../utils/metaCapi');

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

    res.json({ success: true, message: "You're on the list!" });
  } catch (err) {
    console.error('Waitlist error:', err.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
