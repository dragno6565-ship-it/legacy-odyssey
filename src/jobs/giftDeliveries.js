const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabase');
const { sendGiftNotificationEmail } = require('../services/emailService');

/**
 * Scheduled gift email delivery.
 *
 * Runs hourly. Finds gift_codes where:
 *   - status = 'purchased'                  (paid for, not yet redeemed)
 *   - delivery_method = 'email_scheduled'   (buyer chose a future date)
 *   - deliver_at <= now()                   (the chosen date has arrived)
 *   - recipient_email_sent_at IS NULL       (haven't sent yet)
 *   - recipient_email IS NOT NULL           (we have somewhere to send)
 *
 * For each match, send the recipient gift email and stamp recipient_email_sent_at.
 *
 * The webhook also sends recipient emails immediately for delivery_method='email_now'
 * AND stamps recipient_email_sent_at, so this cron will skip those automatically.
 */
async function runGiftDeliveries() {
  console.log('[gift-deliveries] Checking for gift emails to send...');

  try {
    const nowIso = new Date().toISOString();

    const { data: gifts, error } = await supabaseAdmin
      .from('gift_codes')
      .select('id, code, buyer_name, recipient_email, recipient_message, deliver_at, status, delivery_method')
      .eq('status', 'purchased')
      .eq('delivery_method', 'email_scheduled')
      .lte('deliver_at', nowIso)
      .is('recipient_email_sent_at', null)
      .not('recipient_email', 'is', null);

    if (error) {
      console.error('[gift-deliveries] Query failed:', error.message);
      return;
    }

    if (!gifts || gifts.length === 0) {
      console.log('[gift-deliveries] No scheduled gifts due right now.');
      return;
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    let sent = 0;
    let failed = 0;

    for (const gift of gifts) {
      const redeemUrl = `https://${appDomain}/redeem?code=${gift.code}`;
      try {
        await sendGiftNotificationEmail({
          to: gift.recipient_email,
          buyerName: gift.buyer_name,
          message: gift.recipient_message,
          redeemUrl,
          monthsPrepaid: gift.months_prepaid,
        });
        // Stamp before logging so even if logging throws we don't double-send
        const { error: updateError } = await supabaseAdmin
          .from('gift_codes')
          .update({ recipient_email_sent_at: new Date().toISOString() })
          .eq('id', gift.id);
        if (updateError) {
          // Couldn't stamp — log loudly because next run will re-send.
          console.error(`[gift-deliveries] Sent ${gift.code} to ${gift.recipient_email} but FAILED to stamp recipient_email_sent_at:`, updateError.message);
        }
        sent++;
        console.log(`[gift-deliveries] Sent ${gift.code} to ${gift.recipient_email}`);
      } catch (err) {
        failed++;
        console.error(`[gift-deliveries] Failed to send ${gift.code} to ${gift.recipient_email}:`, err.message);
      }
    }

    console.log(`[gift-deliveries] Done. Sent ${sent}, failed ${failed}.`);
  } catch (err) {
    console.error('[gift-deliveries] Unexpected error:', err.message);
  }
}

function startGiftDeliveriesScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('gift-deliveries', runGiftDeliveries);

  // Run every hour at :17 (offset to spread load across the hour vs other crons).
  // Hourly is fine because the buyer chose a date, not a precise time — anything
  // within a few hours of the chosen morning feels prompt.
  cron.schedule('17 * * * *', tracked);
  console.log('[gift-deliveries] Scheduler started — runs hourly at :17');

  // Also run once 45s after server start so a fresh deploy catches anything
  // that came due while we were down.
  setTimeout(tracked, 45000);
}

module.exports = { startGiftDeliveriesScheduler, runGiftDeliveries };
