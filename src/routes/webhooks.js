const { Router } = require('express');
const { stripe } = require('../config/stripe');
const stripeService = require('../services/stripeService');

const router = Router();

// POST /stripe/webhook — Stripe webhook handler
// Note: raw body middleware is set up in server.js before JSON parser
router.post('/stripe/webhook', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.metadata?.type === 'gift') {
          const giftService = require('../services/giftService');
          const { sendGiftPurchaseEmail, sendGiftNotificationEmail } = require('../services/emailService');
          const gift = await giftService.createGiftCode({
            buyerEmail: session.customer_email || session.customer_details?.email,
            buyerName: session.metadata.buyer_name,
            recipientEmail: session.metadata.recipient_email,
            recipientMessage: session.metadata.gift_message,
            stripeSessionId: session.id,
          });
          const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
          const redeemUrl = `https://${appDomain}/redeem?code=${gift.code}`;
          await sendGiftPurchaseEmail({
            to: gift.buyer_email,
            buyerName: gift.buyer_name,
            giftCode: gift.code,
            redeemUrl,
          });
          if (gift.recipient_email) {
            await sendGiftNotificationEmail({
              to: gift.recipient_email,
              buyerName: gift.buyer_name,
              message: gift.recipient_message,
              redeemUrl,
            });
          }
        } else {
          await stripeService.handleCheckoutComplete(session);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await stripeService.syncSubscriptionStatus(sub.customer, sub.status);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await stripeService.syncSubscriptionStatus(sub.customer, 'canceled');
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await stripeService.syncSubscriptionStatus(invoice.customer, 'past_due');
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    // Don't return error to Stripe — it would retry
  }

  res.json({ received: true });
});

module.exports = router;
