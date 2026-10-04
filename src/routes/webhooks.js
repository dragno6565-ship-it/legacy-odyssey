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
          // Additional site purchased from inside the account (authenticated "Add a
          // site"). Provision a linked family under the SAME auth_user_id so it shows
          // up in findAllByAuthUserId / the dashboard site switcher.
          const stripeService = require('../services/stripeService');
          const { supabaseAdmin } = require('../config/supabase');

          const authUserId = session.metadata.auth_user_id;
          const subdomain = session.metadata.subdomain;
          const domain = session.metadata.domain || null;
          const bookName = session.metadata.book_name || '';

          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);
          const email = authUser?.user?.email || '';

          // Skip if this exact site was already provisioned (webhook retry).
          const familyService = require('../services/familyService');
          const existing = await familyService.findBySubdomain(subdomain);
          if (existing) {
            console.log(`[webhook] additional_site ${subdomain} already exists — skipping`);
          } else {
            await stripeService.provisionAdditionalSite({
              authUserId,
              email,
              subdomain,
              domain,
              period: 'annual',
              bookType: 'baby_book',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              sessionId: session.id,
              customerName: '',
              displayName: bookName || `The ${subdomain} Family`,
            });
            console.log(`Additional site created: ${subdomain} for user ${authUserId}`);
          }
        } else {
          await stripeService.handleCheckoutComplete(session);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const familyService = require('../services/familyService');
        const subscriptionService = require('../services/subscriptionService');
        const fam = await familyService.findForStripeSubscription(sub);
        const pendingInStripe = !!(sub.cancel_at_period_end || sub.cancel_at);
        // Safety net: if the family is archived but Stripe says the sub is back to active,
        // un-archive them. Catches Stripe-Portal renewal of a subscription that was still
        // running when its family was archived (families archived before the
        // keep-access-until-period-end change, 2026-10).
        //
        // Two guards against false-positive reactivation:
        //   1. Stripe also fires this event when WE cancel (cancel_at_period_end=true is
        //      set, status stays 'trialing'/'active' until the period ends). That is NOT
        //      a reactivation — the customer is leaving.
        //   2. A "just-archived" family hasn't actually had time to be reactivated by
        //      anyone. 60s window is plenty to ride out the post-cancel event burst.
        if ((sub.status === 'active' || sub.status === 'trialing') && !pendingInStripe && fam?.archived_at) {
          const archivedMsAgo = Date.now() - new Date(fam.archived_at).getTime();
          if (archivedMsAgo < 60_000) {
            console.log(`[webhook] skipping reactivation for family ${fam.id} — archived ${Math.round(archivedMsAgo)}ms ago (post-cancel event burst)`);
            break;
          }
          console.log(`[webhook] reactivating archived family ${fam.id} (Stripe subscription went ${sub.status})`);
          await subscriptionService.reactivateFamily(fam, { source: 'stripe-webhook' });
          break;
        }
        // Scheduled-cancellation bookkeeping (website stays live until period end).
        // Only for the family's CURRENT subscription.
        const isCurrentSub = fam && !fam.archived_at
          && (!fam.stripe_subscription_id || fam.stripe_subscription_id === sub.id);
        if (isCurrentSub && pendingInStripe && !fam.cancel_effective_at
            && sub.status !== 'canceled' && (sub.metadata || {}).cancel_source !== 'app') {
          // Cancelled in the Stripe Customer Portal (our own cancels tag
          // metadata.cancel_source='app' and record the date themselves): record
          // the end date, stop domain auto-renew, send the confirmation email.
          console.log(`[webhook] Stripe-portal cancellation scheduled for family ${fam.id}`);
          await subscriptionService.softCancelFamily(fam, { source: 'stripe-portal' });
        } else if (isCurrentSub && !pendingInStripe && fam.cancel_effective_at
            && (sub.status === 'active' || sub.status === 'trialing')) {
          // Cancellation undone (Stripe portal "Renew", or our own resume). Events
          // can arrive out of order, so confirm against the live subscription.
          const { stripe } = require('../config/stripe');
          const live = stripe ? await stripe.subscriptions.retrieve(sub.id) : sub;
          if (!live.cancel_at_period_end && !live.cancel_at && live.status !== 'canceled') {
            console.log(`[webhook] pending cancellation undone for family ${fam.id}`);
            await subscriptionService.resumeCancellation(fam, { source: 'stripe-webhook', skipStripe: true });
          }
        }
        await stripeService.syncSubscriptionStatus(sub.customer, sub.status);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        // The subscription has ENDED. Fires (a) at period end for a cancel_at_period_end
        // cancellation (ours or the Stripe portal's), or (b) immediately when the
        // subscription is cancelled outright in Stripe (dashboard / portal "cancel now"
        // / unpaid). Either way the paid period is over: archive the website now and
        // start the 1-year retention clock. The customer was already emailed if they
        // scheduled the cancellation (cancel_effective_at set); otherwise email now.
        const familyService = require('../services/familyService');
        const subscriptionService = require('../services/subscriptionService');
        const fam = await familyService.findForStripeSubscription(sub);
        if (fam && !fam.archived_at) {
          if (fam.stripe_subscription_id && fam.stripe_subscription_id !== sub.id) {
            // An old/replaced subscription ended; the family's current one is still live.
            console.log(`[webhook] ignoring deletion of non-current sub ${sub.id} for family ${fam.id} (current ${fam.stripe_subscription_id})`);
            break;
          }
          console.log(`[webhook] subscription ${sub.id} ended; archiving family ${fam.id}${fam.cancel_effective_at ? ' (scheduled cancellation)' : ' (ended in Stripe)'}`);
          await subscriptionService.archiveFamily(fam, { source: 'stripe-webhook', sendEmail: !fam.cancel_effective_at });
        } else {
          await stripeService.syncSubscriptionStatus(sub.customer, 'canceled');
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // API-version-proof subscription id: older versions expose
        // invoice.subscription; Basil+ (2025-03+) moved it to
        // invoice.parent.subscription_details.subscription. The payload shape
        // follows the WEBHOOK ENDPOINT's pinned version, so handle both.
        const invoiceSubId = invoice.subscription
          || (invoice.parent && invoice.parent.subscription_details && invoice.parent.subscription_details.subscription)
          || null;
        // Embedded signup (Payment Element): the FIRST invoice of a subscription
        // created via the embedded flow. Provision account + book + domain.
        // Guarded by signup_flow==='embedded' on the subscription metadata, so
        // hosted-Checkout subscriptions (which provision via
        // checkout.session.completed) are untouched. Idempotent.
        if (invoice.billing_reason === 'subscription_create' && invoiceSubId) {
          try {
            const sub = await stripe.subscriptions.retrieve(invoiceSubId);
            if (sub.metadata && sub.metadata.signup_flow === 'embedded') {
              const m = sub.metadata;
              const r = await stripeService.provisionEmbeddedSignup({
                email: m.email || invoice.customer_email,
                customerName: null,
                subdomain: m.subdomain,
                domain: m.domain || null,
                period: m.period || 'annual',
                bookType: m.book_type || 'baby_book',
                referralCode: m.ref || null,
                stripeCustomerId: invoice.customer,
                stripeSubscriptionId: invoiceSubId,
                provisioningRef: invoiceSubId,
              });
              console.log(`[webhook] embedded signup provisioned (sub ${invoiceSubId}) family ${r.family && r.family.id} alreadyProvisioned=${r.alreadyProvisioned}`);
            }
          } catch (err) {
            console.error('[webhook] embedded signup provisioning failed:', err.message);
          }
        }
        if (invoice.customer) {
          await stripeService.syncSubscriptionStatus(invoice.customer, 'active');
        }
        // Rewardful: record affiliate conversion for embedded-signup subscriptions
        // (PaymentIntent flows can't use client_reference_id). Safe no-op without
        // REWARDFUL_API_SECRET / a referral. Only on the first invoice.
        if (invoice.billing_reason === 'subscription_create' && invoiceSubId) {
          try {
            const sub = await stripe.subscriptions.retrieve(invoiceSubId);
            const refId = sub.metadata && sub.metadata.rewardful_referral;
            if (refId) {
              await require('../services/rewardfulService').recordConversion({
                referralId: refId,
                email: (sub.metadata && sub.metadata.email) || invoice.customer_email,
                stripeCustomerId: invoice.customer,
                amountCents: invoice.amount_paid,
                currency: invoice.currency,
              });
            }
          } catch (e) { console.error('[webhook] rewardful conversion (subscription) error:', e.message); }
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
        } else if (pi.metadata?.type === 'signup_childhood' && pi.metadata?.signup_flow === 'embedded') {
          // Embedded Childhood signup ($450 one-time). Provision account + domain.
          try {
            const m = pi.metadata;
            const r = await stripeService.provisionEmbeddedSignup({
              email: m.email || pi.receipt_email,
              customerName: null,
              subdomain: m.subdomain,
              domain: m.domain || null,
              period: 'childhood',
              bookType: m.book_type || 'baby_book',
              referralCode: m.ref || null,
              stripeCustomerId: pi.customer || null,
              stripeSubscriptionId: null,
              provisioningRef: pi.id,
            });
            console.log(`[webhook] embedded childhood signup provisioned (pi ${pi.id}) family ${r.family && r.family.id} alreadyProvisioned=${r.alreadyProvisioned}`);
          } catch (err) {
            console.error('[webhook] embedded childhood provisioning failed:', err.message);
          }
        }
        // Rewardful: record affiliate conversion for gift + childhood-signup
        // PaymentIntents (can't use client_reference_id). Safe no-op without
        // REWARDFUL_API_SECRET / a referral.
        if (pi.metadata?.rewardful_referral) {
          try {
            await require('../services/rewardfulService').recordConversion({
              referralId: pi.metadata.rewardful_referral,
              email: pi.metadata.buyer_email || pi.metadata.email || pi.receipt_email,
              stripeCustomerId: pi.customer || null,
              amountCents: pi.amount_received || pi.amount,
              currency: pi.currency,
            });
          } catch (e) { console.error('[webhook] rewardful conversion (payment_intent) error:', e.message); }
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
