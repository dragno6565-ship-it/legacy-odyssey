/**
 * POST /stripe/webhook — Stripe webhook endpoint.
 *
 * Direct port of src/routes/webhooks.js. Uses Stripe SDK's async signature
 * verification (constructEventAsync) which uses Web Crypto under the hood —
 * the sync constructEvent() needs Node's crypto and isn't safe in Workers.
 *
 * Mounted at the Worker root, NOT under /api, so the path matches Express
 * exactly (https://app.example/stripe/webhook). Don't put resolveFamily
 * upstream — webhook requests don't carry Host headers we'd want to map.
 *
 * Event types handled (mirrors Express):
 *   checkout.session.completed   — new paid signup (or gift / reactivation /
 *                                  additional-site variants by metadata.type)
 *   customer.subscription.updated — sync status; safety-net reactivation
 *   customer.subscription.deleted — sync status; safety-net cancel-via-Portal
 *   invoice.payment_succeeded     — sync status to active
 *   invoice.payment_failed        — sync status to past_due
 *
 * Deferred TODOs (logged in response body so we can track from the dashboard):
 *   - Welcome email after new paid signup       (waits on Resend port)
 *   - Gift code creation + buyer/recipient mail (waits on Resend port)
 *   - Domain registration + DNS via Spaceship/Approximated (waits on
 *     domainService port)
 *   The DB-side family + book creation still happens, so customers can log
 *   in and edit their book even before the deferred features land.
 */
import { Hono } from 'hono';
import type Stripe from 'stripe';
import { adminClient, type Env } from '../lib/supabase';
import { stripeClient } from '../lib/stripeClient';
import {
  findByEmail,
  findById,
  findByStripeCustomerId,
  createFamily,
  updateFamily,
  updateSubscriptionStatus,
} from '../lib/familyService';
import { createBookWithDefaults } from '../lib/bookService';
import * as seedData from '../lib/seedData';
import {
  reactivateFamily,
  softCancelFamily,
} from '../lib/subscriptionService';
import { createGiftCode } from '../lib/giftService';
import {
  sendGiftNotificationEmail,
  sendGiftPurchaseEmail,
  sendWelcomeEmail,
} from '../lib/email';
import { createDomainOrder } from '../lib/domainService';

const webhooks = new Hono<{ Bindings: Env }>();

webhooks.post('/stripe/webhook', async (c) => {
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: 'Stripe not configured' }, 500);
  }
  if (!c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: 'Webhook secret not configured' }, 500);
  }

  const sig = c.req.header('stripe-signature');
  if (!sig) return c.text('Missing stripe-signature header', 400);

  const rawBody = await c.req.text();
  const stripe = stripeClient(c.env);

  // constructEventAsync uses Web Crypto (Workers-safe) and verifies the HMAC.
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return c.text(`Webhook Error: ${err.message}`, 400);
  }

  const supabase = adminClient(c.env);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metaType = (session.metadata as any)?.type;

        if (metaType === 'gift') {
          // Direct port of the Express gift webhook branch.
          const md = (session.metadata || {}) as Record<string, string>;
          const buyerEmail =
            session.customer_email || (session.customer_details as any)?.email || '';
          if (!buyerEmail) {
            console.error('[webhook] gift checkout: no buyer email on session', session.id);
            break;
          }

          // IDEMPOTENCY GUARD (added Apr 29 2026, dual-fire safety):
          // If a gift_codes row already exists for this stripe_session_id,
          // Express already processed this event — no-op so we don't issue
          // a second gift code or send a second buyer email.
          const { data: existingGift } = await supabase
            .from('gift_codes')
            .select('id, code, buyer_email')
            .eq('stripe_session_id', session.id)
            .maybeSingle();
          if (existingGift) {
            console.log(
              `[webhook] gift checkout ${session.id} already processed (code=${
                (existingGift as any).code
              }, buyer=${(existingGift as any).buyer_email}) — skipping (idempotency guard)`
            );
            break;
          }

          const gift = await createGiftCode(supabase, {
            buyerEmail,
            buyerName: md.buyer_name || null,
            recipientName: md.recipient_name || null,
            recipientEmail: md.recipient_email || null,
            recipientMessage: md.gift_message || null,
            stripeSessionId: session.id,
          });
          const appDomain = c.env.APP_DOMAIN || 'legacyodyssey.com';
          const redeemUrl = `https://${appDomain}/redeem?code=${gift.code}`;
          await sendGiftPurchaseEmail(c.env, {
            to: gift.buyer_email,
            buyerName: gift.buyer_name,
            giftCode: gift.code,
            redeemUrl,
          });
          if (gift.recipient_email) {
            await sendGiftNotificationEmail(c.env, {
              to: gift.recipient_email,
              buyerName: gift.buyer_name,
              message: gift.recipient_message,
              redeemUrl,
            });
          }
          console.log(
            `[webhook] gift code ${gift.code} created for buyer ${gift.buyer_email}` +
              (gift.recipient_email ? ` → notified ${gift.recipient_email}` : '')
          );
        } else if (metaType === 'reactivation') {
          const familyId = (session.metadata as any)?.family_id;
          if (familyId) {
            const family = await findById(supabase, familyId);
            if (family) {
              if (session.subscription) {
                await updateFamily(supabase, family.id, {
                  stripe_subscription_id: session.subscription,
                  stripe_customer_id: session.customer || family.stripe_customer_id,
                });
              }
              await reactivateFamily(c.env, family, { source: 'reactivation-checkout' });
              console.log(`[webhook] reactivation-checkout completed for family ${family.id}`);
            } else {
              console.error(`[webhook] reactivation-checkout: family ${familyId} not found`);
            }
          }
        } else if (metaType === 'additional_site') {
          const md = session.metadata as Record<string, string>;
          const authUserId = md.auth_user_id;
          const subdomain = md.subdomain;
          const domain = md.domain || null;
          const bookName = md.book_name || '';

          // IDEMPOTENCY GUARD (added Apr 29 2026, dual-fire safety):
          // If Express already processed this event, the family for this
          // subdomain already exists. No-op so we don't violate the unique
          // constraint or duplicate the linked_family_ids entry.
          const { data: existingSubFamily } = await supabase
            .from('families')
            .select('id, subdomain')
            .eq('subdomain', subdomain)
            .maybeSingle();
          if (existingSubFamily) {
            console.log(
              `[webhook] additional_site subdomain="${subdomain}" already exists (family ${
                (existingSubFamily as any).id
              }) — skipping (idempotency guard)`
            );
            break;
          }

          const { data: authUser } = await supabase.auth.admin.getUserById(authUserId);
          const baseEmail = authUser?.user?.email || '';
          const [local, host] = baseEmail.split('@');
          const familyEmail = `${local}+${subdomain}@${host}`;

          const family = await createFamily(supabase, {
            email: familyEmail,
            authUserId: null,
            subdomain,
            displayName: bookName || subdomain,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
            customDomain: domain,
            plan: 'paid',
          });
          // createFamily defaults subscription_status by plan; force 'active' for paid.
          await updateFamily(supabase, family.id, { subscription_status: 'active' });

          const existingMeta = authUser?.user?.user_metadata || {};
          const linkedIds: string[] = existingMeta.linked_family_ids || [];
          linkedIds.push(family.id);
          await supabase.auth.admin.updateUserById(authUserId, {
            user_metadata: { ...existingMeta, linked_family_ids: linkedIds },
          });

          await createBookWithDefaults(supabase, family.id, seedData);

          if (domain) {
            try {
              const order = await createDomainOrder(supabase, {
                familyId: family.id,
                domain,
                stripeSessionId: session.id,
              });
              console.log(
                `[webhook] additional_site domain order ${order.id} queued for ${domain} (cron will provision)`
              );
            } catch (err: any) {
              console.error(
                `[webhook] failed to enqueue domain order for ${domain}: ${err.message}`
              );
            }
          }

          console.log(`[webhook] additional site created: ${subdomain} for user ${authUserId}`);
        } else {
          // Default flow: brand-new paid customer (or upgrade-from-free).
          await handleCheckoutComplete(c.env, session);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        // Safety net: if family is archived but Stripe says sub went back to
        // active, un-archive. Two guards to avoid false positives:
        //   1. If cancel_at_period_end=true, this is a CANCEL event, not a
        //      reactivation — skip.
        //   2. We archive ~100ms before Stripe fires; ignore if archived
        //      <60s ago to ride out the post-cancel event burst.
        if ((sub.status === 'active' || sub.status === 'trialing') && !sub.cancel_at_period_end) {
          const fam = await findByStripeCustomerId(supabase, String(sub.customer));
          if (fam?.archived_at) {
            const archivedMsAgo = Date.now() - new Date(fam.archived_at).getTime();
            if (archivedMsAgo < 60_000) {
              console.log(
                `[webhook] skipping reactivation for family ${fam.id} — archived ${Math.round(
                  archivedMsAgo
                )}ms ago (post-cancel event burst)`
              );
              break;
            }
            console.log(
              `[webhook] reactivating archived family ${fam.id} (Stripe subscription went ${sub.status})`
            );
            await reactivateFamily(c.env, fam, { source: 'stripe-webhook' });
            break;
          }
        }
        await updateSubscriptionStatus(supabase, String(sub.customer), sub.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const fam = await findByStripeCustomerId(supabase, String(sub.customer));
        if (fam && !fam.archived_at) {
          console.log(`[webhook] auto-archiving family ${fam.id} after Stripe Portal cancellation`);
          await softCancelFamily(c.env, fam, { source: 'stripe-webhook' });
        } else {
          await updateSubscriptionStatus(supabase, String(sub.customer), 'canceled');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          await updateSubscriptionStatus(supabase, String(invoice.customer), 'active');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          await updateSubscriptionStatus(supabase, String(invoice.customer), 'past_due');
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    // Match Express: log but don't bubble — returning non-2xx makes Stripe
    // retry, which would re-execute this handler with the same side effects
    // (e.g. duplicate family rows on transient DB hiccup).
    console.error(`Error handling ${event.type}:`, err);
  }

  return c.json({ received: true });
});

/**
 * The "new paying customer" flow. Direct port of stripeService.handleCheckoutComplete.
 *
 * Two paths preserved exactly from Express:
 *   1. An existing family for this email exists and is either free or
 *      cancelled → reinstate it (attach Stripe customer/sub, clear cancel
 *      fields, mark plan paid).
 *   2. No prior family → create a brand-new auth user + family + seeded book.
 *
 * Deferred (TODOs logged in console):
 *   - Welcome email with set-password link (Resend port)
 *   - Domain order + Spaceship registration + Approximated DNS (domain port)
 */
async function handleCheckoutComplete(env: Env, session: Stripe.Checkout.Session): Promise<void> {
  const email =
    session.customer_email ||
    (session.customer_details as Stripe.Checkout.Session.CustomerDetails | null)?.email ||
    '';
  if (!email) {
    console.error('[webhook] handleCheckoutComplete: no email on session', session.id);
    return;
  }
  const customerName = (session.customer_details as any)?.name || null;
  const meta = (session.metadata || {}) as Record<string, string>;
  const subdomain = meta.subdomain;
  const domain = meta.domain || null;
  const period = meta.period || 'monthly';
  const bookType = meta.book_type || 'baby_book';
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null;

  const supabase = adminClient(env);

  // IDEMPOTENCY GUARD (added Apr 29 2026, dual-fire safety):
  // If a family already exists for this email AND it's already paid+active,
  // Express's webhook already processed this checkout event. No-op so we
  // don't try to create a duplicate auth user / family / book / domain
  // order, and so we don't send a second welcome email.
  const existing = await findByEmail(supabase, email);
  if (existing && existing.plan === 'paid' && existing.subscription_status !== 'canceled') {
    console.log(
      `[webhook] checkout ${session.id} for ${email} already processed (family ${existing.id} is paid+active) — skipping (idempotency guard)`
    );
    return;
  }
  // Path 1: existing free or cancelled family → reinstate.
  if (existing && (existing.plan !== 'paid' || existing.subscription_status === 'canceled')) {
    await updateFamily(supabase, existing.id, {
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: 'active',
      billing_period: period,
      plan: 'paid',
      cancelled_at: null,
      data_retain_until: null,
      ...(customerName ? { customer_name: customerName } : {}),
    });

    if (domain) {
      try {
        const order = await createDomainOrder(supabase, {
          familyId: existing.id,
          domain,
          stripeSessionId: session.id,
        });
        console.log(
          `[webhook] reinstate domain order ${order.id} queued for ${domain} (cron will provision)`
        );
      } catch (err: any) {
        console.error(`[webhook] failed to enqueue domain order for ${domain}: ${err.message}`);
      }
    }
    console.log(`[webhook] reinstated existing family ${existing.id} for ${email}`);
    return;
  }

  // Path 2: brand-new paid signup. Create auth user (auto-confirm so the
  // welcome-email recovery link is the FIRST password they set), then family,
  // then seeded book.
  const tempPassword = randomTempPassword();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError || !authData?.user) {
    console.error('[webhook] auth.admin.createUser failed:', authError);
    return;
  }

  if (!subdomain) {
    console.error(
      `[webhook] new-paid signup ${session.id} missing metadata.subdomain — refusing to create family`
    );
    return;
  }

  const family = await createFamily(supabase, {
    email,
    authUserId: authData.user.id,
    subdomain,
    displayName: `The ${subdomain} Family`,
    stripeCustomerId,
    customerName: customerName || undefined,
    plan: 'paid',
    bookType,
  });

  await updateFamily(supabase, family.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    billing_period: period,
    plan: 'paid',
  });

  await createBookWithDefaults(supabase, family.id, seedData);

  // Generate a Supabase recovery link so the customer can set their own password.
  let setPasswordUrl: string | null = null;
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `https://${env.APP_DOMAIN || 'legacyodyssey.com'}/set-password` },
    });
    setPasswordUrl = (linkData as any)?.properties?.action_link || null;
  } catch (e: any) {
    console.error('[webhook] failed to generate recovery link:', e.message);
  }

  // Welcome email (best-effort — never throw or unwind the family/book creation)
  await sendWelcomeEmail(env, {
    to: email,
    displayName: family.display_name || subdomain,
    setPasswordUrl,
    bookPassword: family.book_password,
    subdomain,
    customDomain: domain,
  });

  if (domain) {
    try {
      const order = await createDomainOrder(supabase, {
        familyId: family.id,
        domain,
        stripeSessionId: session.id,
      });
      console.log(
        `[webhook] new-signup domain order ${order.id} queued for ${domain} (cron will provision)`
      );
    } catch (err: any) {
      console.error(`[webhook] failed to enqueue domain order for ${domain}: ${err.message}`);
    }
  }

  console.log(`[webhook] new paid family ${family.id} created (${email}, slug=${subdomain})`);
}

function randomTempPassword(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default webhooks;
