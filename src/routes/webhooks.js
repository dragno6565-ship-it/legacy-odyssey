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
          const { supabaseAdmin } = require('../config/supabase');
          const { sendGiftPurchaseEmail, sendGiftNotificationEmail } = require('../services/emailService');

          const deliveryMethod = session.metadata.delivery_method || 'email_now';
          const scheduledDate = session.metadata.scheduled_date || null;
          // Gift tier: 'childhood' (18 years, $450) prepays 216 months; default 'annual' = 12.
          const giftPlan = session.metadata.gift_plan === 'childhood' ? 'childhood' : 'annual';
          const monthsPrepaid = giftPlan === 'childhood' ? 216 : 12;

          const gift = await giftService.createGiftCode({
            buyerEmail: session.customer_email || session.customer_details?.email,
            buyerName: session.metadata.buyer_name,
            recipientName: session.metadata.recipient_name || null,
            recipientEmail: session.metadata.recipient_email,
            recipientMessage: session.metadata.gift_message,
            stripeSessionId: session.id,
            deliveryMethod,
            scheduledDate,
            monthsPrepaid,
          });

          // Webhook idempotency: if Stripe retried this delivery (slow
          // response, etc.) and the gift row already existed, skip the
          // email sends so the buyer and recipient don't get duplicates.
          if (gift._alreadyExisted) {
            console.log(`[webhook] gift session ${session.id} already processed (gift ${gift.code}) — skipping duplicate emails`);
            res.json({ received: true });
            return;
          }

          const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
          const redeemUrl = `https://${appDomain}/redeem?code=${gift.code}`;
          const certificateUrl = `https://${appDomain}/gift/certificate/${gift.certificate_token}`;

          // Buyer always gets the confirmation email immediately, with the
          // printable certificate link inside.
          await sendGiftPurchaseEmail({
            to: gift.buyer_email,
            buyerName: gift.buyer_name,
            giftCode: gift.code,
            redeemUrl,
            certificateUrl,
            recipientName: gift.recipient_name,
            deliveryMethod: gift.delivery_method,
            deliverAt: gift.deliver_at,
            monthsPrepaid: gift.months_prepaid,
          });

          // Recipient email: only send NOW if delivery_method=email_now AND we
          // have an email. For 'email_scheduled' the giftDeliveries cron picks
          // it up on/after deliver_at.
          if (gift.recipient_email && gift.delivery_method === 'email_now') {
            await sendGiftNotificationEmail({
              to: gift.recipient_email,
              buyerName: gift.buyer_name,
              message: gift.recipient_message,
              redeemUrl,
              monthsPrepaid: gift.months_prepaid,
            });
            // Mark sent so the cron doesn't re-send.
            await supabaseAdmin
              .from('gift_codes')
              .update({ recipient_email_sent_at: new Date().toISOString() })
              .eq('id', gift.id);
          }
        } else if (session.metadata?.type === 'reactivation') {
          // Customer-initiated reactivation: a previously-archived family
          // just paid for a new subscription. Un-archive, restore Spaceship
          // auto-renew, send the welcome-back email, and bind the new sub
          // to the family so future Stripe events route correctly.
          const familyService = require('../services/familyService');
          const subscriptionService = require('../services/subscriptionService');
          const familyId = session.metadata.family_id;
          if (familyId) {
            const family = await familyService.findById(familyId);
            if (family) {
              if (session.subscription) {
                await familyService.update(family.id, {
                  stripe_subscription_id: session.subscription,
                  stripe_customer_id: session.customer || family.stripe_customer_id,
                });
              }
              await subscriptionService.reactivateFamily(family, { source: 'reactivation-checkout' });
              console.log(`[webhook] reactivation-checkout completed for family ${family.id}`);
            } else {
              console.error(`[webhook] reactivation-checkout: family ${familyId} not found`);
            }
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
        //
        // Two guards against false-positive reactivation:
        //   1. Stripe also fires this event when WE cancel (cancel_at_period_end=true is
        //      set, status stays 'trialing'/'active' until the period ends). That is NOT
        //      a reactivation — the customer is leaving.
        //   2. We archive ~100ms before Stripe fires the event, so a "just-archived" family
        //      hasn't actually had time to be reactivated by anyone. 60s window is plenty
        //      to ride out the post-cancel event burst.
        if ((sub.status === 'active' || sub.status === 'trialing') && !sub.cancel_at_period_end) {
          const familyService = require('../services/familyService');
          const subscriptionService = require('../services/subscriptionService');
          const fam = await familyService.findByStripeCustomerId(sub.customer);
          if (fam?.archived_at) {
            const archivedMsAgo = Date.now() - new Date(fam.archived_at).getTime();
            if (archivedMsAgo < 60_000) {
              console.log(`[webhook] skipping reactivation for family ${fam.id} — archived ${Math.round(archivedMsAgo)}ms ago (post-cancel event burst)`);
              break;
            }
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
      case 'charge.refunded': {
        // When a gift purchase is refunded in Stripe, mark the gift_code
        // as refunded so the recipient can no longer redeem it. (For
        // subscription refunds, this is a no-op — we only act when the
        // charge maps to a gift_code row.)
        const charge = event.data.object;
        if (!charge.payment_intent) break;

        // Find the original Checkout session for this payment_intent.
        // For gifts we used mode='payment', so 1:1 with the session.
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: charge.payment_intent,
          limit: 1,
        });
        const session = sessions.data[0];
        // Hosted checkout stores the Checkout Session id in gift_codes.stripe_session_id;
        // the embedded checkout (Payment Element) stores the PaymentIntent id there.
        // Use whichever applies so refunds invalidate gifts from either flow.
        const giftKey = session ? session.id : charge.payment_intent;

        const { supabaseAdmin } = require('../config/supabase');
        const { data: gift } = await supabaseAdmin
          .from('gift_codes')
          .select('id, code, status, redeemed_at, family_id')
          .eq('stripe_session_id', giftKey)
          .single();
        if (!gift) {
          console.log(`[webhook] charge.refunded ${charge.id}: no gift_code for key ${giftKey} — likely a non-gift refund`);
          break;
        }

        if (gift.status === 'redeemed' || gift.redeemed_at || gift.family_id) {
          // The gift has already been redeemed — invalidating now would
          // strand the recipient's account. Log loudly; manual handling
          // (cancel the subscription, talk to the buyer) is required.
          console.error(`[webhook] charge.refunded but gift ${gift.code} is already REDEEMED to family ${gift.family_id} — NOT invalidating; manual action required`);
          break;
        }

        await supabaseAdmin
          .from('gift_codes')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', gift.id);
        console.log(`[webhook] gift ${gift.code} marked refunded after charge.refunded ${charge.id}`);
        break;
      }
      case 'payment_intent.succeeded': {
        // Gift fulfillment for the on-brand embedded checkout (Payment Element).
        // GUARD: only PaymentIntents WE created via createGiftPaymentIntent carry
        // metadata.type==='gift'. PaymentIntents auto-created by a hosted Checkout
        // Session have empty metadata, so they fall through here untouched and are
        // fulfilled by the checkout.session.completed handler instead — no
        // double-fulfillment. A given purchase only ever matches one path.
        const pi = event.data.object;
        if (pi.metadata?.type === 'gift') {
          const giftService = require('../services/giftService');
          const { gift, alreadyExisted } = await giftService.fulfillGiftForPaymentIntent(pi);
          if (alreadyExisted) {
            console.log(`[webhook] gift PI ${pi.id} already processed (gift ${gift?.code}) — skipping duplicate emails`);
          } else if (gift) {
            console.log(`[webhook] fulfilled gift ${gift.code} from PI ${pi.id}`);
          }
        }
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
