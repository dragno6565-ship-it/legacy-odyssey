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
            recipientName: session.metadata.recipient_name || null,
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
        } else if (session.metadata?.type === 'additional_site') {
          // Handle additional site purchase for existing customer
          const familyService = require('../services/familyService');
          const bookService = require('../services/bookService');
          const domainService = require('../services/domainService');
          const { supabaseAdmin } = require('../config/supabase');

          const authUserId = session.metadata.auth_user_id;
          const subdomain = session.metadata.subdomain;
          const domain = session.metadata.domain || null;
          const bookName = session.metadata.book_name || '';

          // Get existing user's email for the new family record
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);
          const baseEmail = authUser?.user?.email || '';
          const familyEmail = `${baseEmail.split('@')[0]}+${subdomain}@${baseEmail.split('@')[1]}`;

          // Create new family (auth_user_id = null to avoid UNIQUE constraint)
          const family = await familyService.create({
            email: familyEmail,
            auth_user_id: null,
            subdomain,
            display_name: bookName || subdomain,
            stripe_customer_id: session.customer,
            subscription_status: 'active',
            custom_domain: domain,
          });

          // Link to user via metadata
          const existingMeta = authUser?.user?.user_metadata || {};
          const linkedIds = existingMeta.linked_family_ids || [];
          linkedIds.push(family.id);
          await supabaseAdmin.auth.admin.updateUserById(authUserId, {
            user_metadata: { ...existingMeta, linked_family_ids: linkedIds },
          });

          // Create book with defaults
          await bookService.createBookWithDefaults(family.id);

          // If custom domain requested, start async domain setup
          if (domain) {
            const order = await domainService.createDomainOrder(family.id, domain);
            domainService.purchaseAndSetupDomain(order.id).catch(err => {
              console.error(`Domain setup failed for ${domain}:`, err);
            });
          }

          console.log(`Additional site created: ${subdomain} for user ${authUserId}`);
        } else {
          await stripeService.handleCheckoutComplete(session);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        // Safety net: if the family is archived but Stripe says the sub is back to active,
        // un-archive them. Catches Stripe-Portal renewal of a previously cancelled sub.
        if (sub.status === 'active' || sub.status === 'trialing') {
          const familyService = require('../services/familyService');
          const subscriptionService = require('../services/subscriptionService');
          const fam = await familyService.findByStripeCustomerId(sub.customer);
          if (fam?.archived_at) {
            console.log(`[webhook] reactivating archived family ${fam.id} (Stripe subscription went ${sub.status})`);
            await subscriptionService.reactivateFamily(fam, { source: 'stripe-webhook' });
            break;
          }
        }
        await stripeService.syncSubscriptionStatus(sub.customer, sub.status);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        // Safety net: if the customer cancelled directly via Stripe Customer Portal
        // (bypassing our app), run the full soft-cancel orchestration so Spaceship
        // auto-renew gets disabled and the confirmation email fires. The check for
        // archived_at prevents double-running when we initiated the cancel ourselves
        // (admin/customer-app routes set archived_at first, then call Stripe).
        const familyService = require('../services/familyService');
        const subscriptionService = require('../services/subscriptionService');
        const fam = await familyService.findByStripeCustomerId(sub.customer);
        if (fam && !fam.archived_at) {
          console.log(`[webhook] auto-archiving family ${fam.id} after Stripe Portal cancellation`);
          await subscriptionService.softCancelFamily(fam, { source: 'stripe-webhook' });
        } else {
          await stripeService.syncSubscriptionStatus(sub.customer, 'canceled');
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.customer) {
          await stripeService.syncSubscriptionStatus(invoice.customer, 'active');
        }
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
