const { stripe } = require('../config/stripe');
const familyService = require('./familyService');
const bookService = require('./bookService');

/**
 * Stripe Price IDs — single plan with two billing options + domain add-ons.
 *
 * Subscription: $4.99/month or $49.99/year
 * Custom domain: $5.99 one-time setup fee
 * Setup fee: $5.99 one-time (monthly subscribers only)
 * Additional domains: charged at the regular annual-intro rate
 *   ($29 first year → $49.99/year). The legacy STRIPE_PRICE_ADDITIONAL_DOMAIN
 *   ($12.99/yr) is no longer used for new checkouts.
 */
const PRICES = {
  subscription: {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual: process.env.STRIPE_PRICE_ANNUAL,
    annualIntro: process.env.STRIPE_PRICE_ANNUAL_INTRO, // $49.99/yr with first-year coupon
    // Founder rate: $29/yr flat, no coupon. Used only by the hidden
    // /preview/founder landing page (shared privately with early supporters).
    // Hardcoded fallback so the page works even if the env var isn't set
    // yet on Railway; set STRIPE_PRICE_FOUNDER to override.
    founder: process.env.STRIPE_PRICE_FOUNDER || 'price_1TIVpBJk2GIrL5uS5xg3lRhk',
  },
  // Childhood plan: $450 one-time, covers all 18 years (no recurring billing).
  // Hardcoded fallback so it works before the env var lands on Railway.
  childhood: process.env.STRIPE_PRICE_CHILDHOOD || 'price_1Tb8OlJk2GIrL5uSTV1BVgNS',
  setupFee: process.env.STRIPE_PRICE_SETUP,
  annualIntroCoupon: process.env.STRIPE_ANNUAL_INTRO_COUPON, // $20.99 off first invoice
};

/**
 * Resolve the Stripe subscription price ID for a billing period.
 */
function resolvePriceId(plan, period) {
  const resolvedPeriod = period || 'monthly';
  const priceId = PRICES.subscription[resolvedPeriod];
  if (priceId) return priceId;
  throw new Error(`No Stripe price configured for period="${resolvedPeriod}"`);
}

async function createCheckoutSession({ email, subdomain, domain, period, bookType, ref, referral, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const resolvedPeriod = period || 'monthly';
  const priceId = resolvePriceId(null, resolvedPeriod);

  const metadata = { subdomain, period: resolvedPeriod, book_type: bookType || 'baby_book' };
  if (domain) metadata.domain = domain;
  if (ref) metadata.ref = ref;

  // Build line items: subscription + setup fee for monthly only
  const line_items = [{
    price: priceId,
    quantity: 1,
  }];

  // Add one-time setup fee for monthly subscribers only (annual = no setup fee)
  if (resolvedPeriod === 'monthly') {
    line_items.push({
      price: PRICES.setupFee,
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items,
    metadata,
    allow_promotion_codes: true,
    // Rewardful affiliate attribution — only set when present (Stripe rejects an empty value).
    ...(referral ? { client_reference_id: referral } : {}),
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Provision an ADDITIONAL site for an existing customer (e.g. a second child).
 * Email and auth_user_id are NOT unique on `families`, so we simply add another
 * family row under the same login (same auth_user_id) with a new subdomain /
 * Stripe customer / subscription. Used so a returning email is never charged with
 * nothing provisioned.
 */
async function provisionAdditionalSite({ authUserId, email, subdomain, domain, period, bookType, stripeCustomerId, stripeSubscriptionId, sessionId, customerName, displayName, creditReferral }) {
  const newFamily = await familyService.create({
    email,
    authUserId,
    subdomain,
    displayName: displayName || `The ${subdomain} Family`,
    stripeCustomerId,
    customerName,
    plan: 'paid',
    bookType,
  });
  await familyService.update(newFamily.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    billing_period: period,
    plan: 'paid',
  });
  await bookService.createBookWithDefaults(newFamily.id);

  if (domain) {
    try {
      const domainService = require('./domainService');
      const order = await domainService.createDomainOrder({ familyId: newFamily.id, domain, stripeSessionId: sessionId, price: null });
      domainService.purchaseAndSetupDomain(order.id).catch((err) => console.error(`Background domain setup failed for additional site ${domain}:`, err.message));
    } catch (err) {
      console.error(`Failed to create domain order for additional site ${domain}:`, err.message);
    }
  }

  try {
    const { sendWelcomeEmail } = require('./emailService');
    await sendWelcomeEmail({ to: email, displayName: subdomain, setPasswordUrl: null, bookPassword: newFamily.book_password, subdomain, customDomain: domain || null });
  } catch (e) {
    console.error('additional-site email failed:', e.message);
  }

  if (creditReferral) await creditReferral(newFamily);
  return { family: newFamily, tempPassword: null, setPasswordUrl: null, domain, additionalSite: true };
}

/** Find a Supabase auth user by email (the admin API has no direct getByEmail). */
async function findAuthUserByEmail(email) {
  if (!email) return null;
  const { supabaseAdmin } = require('../config/supabase');
  try {
    for (let page = 1; page <= 25; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) return null;
      const hit = data.users.find((u) => (u.email || '').toLowerCase() === (email || '').toLowerCase());
      if (hit) return hit;
      if (data.users.length < 200) return null;
    }
  } catch (e) { /* fall through to null */ }
  return null;
}

async function handleCheckoutComplete(session) {
  const email = session.customer_email || session.customer_details?.email;
  const customerName = session.customer_details?.name || null;
  const subdomain = session.metadata?.subdomain;
  const domain = session.metadata?.domain || null;
  const period = session.metadata?.period || 'monthly';
  const bookType = session.metadata?.book_type || 'baby_book';
  const referralCode = session.metadata?.ref || null;
  const stripeCustomerId = session.customer;
  const stripeSubscriptionId = session.subscription;

  const { supabaseAdmin } = require('../config/supabase');

  // Referral attribution + reward (B13). A completed subscription checkout is
  // the qualifying event. Best-effort — never let it block account creation.
  const creditReferral = async (family) => {
    if (!referralCode || !family) return;
    try {
      const referralService = require('./referralService');
      // Re-read so we have the freshly-set stripe_customer_id / referred_by.
      const fresh = await familyService.findById(family.id) || family;
      await referralService.attributeSignup(fresh, referralCode);
      await referralService.recordQualifiedReferral(fresh);
    } catch (e) {
      console.error('[referral] attribution failed:', e.message);
    }
  };

  // Check if an existing account (free or cancelled) exists for this email — upgrade or reinstate it
  const existingFamily = await familyService.findByEmail(email);
  if (existingFamily && (existingFamily.plan !== 'paid' || existingFamily.subscription_status === 'canceled')) {
    await familyService.update(existingFamily.id, {
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: 'active',
      billing_period: period,
      plan: 'paid',
      // Clear cancellation fields on reinstatement
      cancelled_at: null,
      data_retain_until: null,
      ...(customerName ? { customer_name: customerName } : {}),
    });

    // Generate a recovery link so they can set their own password
    let setPasswordUrl = null;
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: 'https://legacyodyssey.com/set-password' },
      });
      setPasswordUrl = linkData?.properties?.action_link || null;
    } catch (e) {
      console.error('Failed to generate recovery link for reinstatement:', e.message);
    }

    // If a custom domain was selected, kick off domain purchase
    if (domain) {
      try {
        const domainService = require('./domainService');
        const order = await domainService.createDomainOrder({
          familyId: existingFamily.id,
          domain,
          stripeSessionId: session.id,
          price: null,
        });
        domainService.purchaseAndSetupDomain(order.id).catch((err) => {
          console.error(`Background domain setup failed for ${domain}:`, err.message);
        });
      } catch (err) {
        console.error(`Failed to create domain order for ${domain}:`, err.message);
      }
    }

    await creditReferral(existingFamily);
    return { family: existingFamily, tempPassword: null, setPasswordUrl, domain };
  }

  // Existing PAID, active account buying ANOTHER site (e.g. a second child) → add a
  // linked site under their existing login instead of re-creating the user. Without
  // this, createUser below throws on the duplicate email and the buyer is charged
  // with nothing provisioned (the test-purchase failure). Email/auth_user_id are not
  // unique on `families`, so the new site simply shares their auth_user_id.
  if (existingFamily && existingFamily.auth_user_id) {
    return await provisionAdditionalSite({
      authUserId: existingFamily.auth_user_id,
      email, subdomain, domain, period, bookType,
      stripeCustomerId, stripeSubscriptionId, sessionId: session.id, customerName, creditReferral,
    });
  }

  // No existing free account — create a brand new one
  const tempPassword = require('crypto').randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError) {
    // Edge: the email is already a Supabase auth user but had no family row. Don't
    // fail the (already-charged) purchase — add a linked site under that user.
    if (/already.*regist|already.*exist|exists/i.test(authError.message || '')) {
      const existingUser = await findAuthUserByEmail(email);
      if (existingUser) {
        return await provisionAdditionalSite({
          authUserId: existingUser.id,
          email, subdomain, domain, period, bookType,
          stripeCustomerId, stripeSubscriptionId, sessionId: session.id, customerName, creditReferral,
        });
      }
    }
    throw authError;
  }

  // Generate a recovery link so the customer can set their own password
  let setPasswordUrl = null;
  try {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: 'https://legacyodyssey.com/set-password' },
    });
    setPasswordUrl = linkData?.properties?.action_link || null;
  } catch (e) {
    console.error('Failed to generate recovery link:', e.message);
  }

  // Create family as paid (Stripe checkout = paid plan)
  const family = await familyService.create({
    email,
    authUserId: authData.user.id,
    subdomain,
    displayName: `The ${subdomain} Family`,
    stripeCustomerId,
    customerName,
    plan: 'paid',
    bookType,
  });

  // Update with subscription ID
  await familyService.update(family.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    billing_period: period,
    plan: 'paid',
  });

  // Create book with default content (Baby Book only — Family Album product retired)
  await bookService.createBookWithDefaults(family.id);

  // Send welcome email with set-password link
  try {
    const { sendWelcomeEmail } = require('./emailService');
    await sendWelcomeEmail({
      to: email,
      displayName: family.display_name || subdomain,
      setPasswordUrl,
      bookPassword: family.book_password,
      subdomain,
      customDomain: domain || null,
    });
  } catch (emailErr) {
    console.error('Failed to send welcome email after checkout:', emailErr.message);
    // Non-fatal: account is created, email can be resent from admin
  }

  // If a custom domain was selected, kick off async domain purchase
  if (domain) {
    try {
      const domainService = require('./domainService');
      const order = await domainService.createDomainOrder({
        familyId: family.id,
        domain,
        stripeSessionId: session.id,
        price: null,
      });

      // Fire-and-forget: purchase and set up domain in background
      domainService.purchaseAndSetupDomain(order.id).catch((err) => {
        console.error(`Background domain setup failed for ${domain}:`, err.message);
      });
    } catch (err) {
      console.error(`Failed to create domain order for ${domain}:`, err.message);
      // Non-fatal: family + book are created, domain can be retried
    }
  }

  await creditReferral(family);

  return { family, tempPassword, setPasswordUrl, domain };
}

async function syncSubscriptionStatus(stripeCustomerId, status) {
  await familyService.updateSubscriptionStatus(stripeCustomerId, status);
}

async function createPortalSession(stripeCustomerId, returnUrl) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Create a Stripe Checkout session for the annual intro plan ($29/yr first year).
 */
async function createFounderCheckoutSession({ email, subdomain, domain, bookType, ref, referral, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const priceId = PRICES.subscription.annualIntro || PRICES.subscription.founder;
  if (!priceId) throw new Error('Annual intro price not configured');

  const metadata = { subdomain, period: 'annual', plan: 'annual_intro', book_type: bookType || 'baby_book' };
  if (domain) metadata.domain = domain;
  if (ref) metadata.ref = ref;

  const sessionParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  // Apply first-year intro coupon if configured ($20.99 off → $29 first year, $49.99 after)
  if (PRICES.annualIntroCoupon) {
    sessionParams.discounts = [{ coupon: PRICES.annualIntroCoupon }];
  } else {
    sessionParams.allow_promotion_codes = true;
  }

  // Rewardful affiliate attribution — only set when present (Stripe rejects an empty value).
  if (referral) sessionParams.client_reference_id = referral;

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Founder-page subscription checkout — $29/year flat, no coupon, no
 * promotional pricing. Used only by the hidden /preview/founder
 * landing page (shared privately with friends and early supporters).
 *
 * Identical to createFounderCheckoutSession except:
 *   - Uses STRIPE_PRICE_FOUNDER ($29/yr recurring) instead of the
 *     annualIntro price + first-year coupon
 *   - Does not allow promotion codes (the price is already the deal)
 *   - metadata.plan = 'founder' so the webhook + admin reports can
 *     identify founder signups distinctly from annual_intro signups
 */
async function createFounderPageCheckoutSession({ email, subdomain, domain, bookType, founderNote, referral, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const priceId = PRICES.subscription.founder;
  if (!priceId) throw new Error('Founder price not configured (STRIPE_PRICE_FOUNDER)');

  const metadata = {
    subdomain,
    period: 'annual',
    plan: 'founder',
    book_type: bookType || 'baby_book',
  };
  if (domain) metadata.domain = domain;
  if (founderNote) metadata.founder_note = String(founderNote).slice(0, 450); // Stripe metadata cap is 500/value

  const sessionParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  // Rewardful affiliate attribution — only set when present (Stripe rejects an empty value).
  if (referral) sessionParams.client_reference_id = referral;

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Childhood Plan checkout — a single $450 payment that covers all 18 years of
 * childhood, with NO recurring Stripe subscription. We keep the domain
 * auto-renewing on our side for the full term.
 *
 * Implementation note: this is a one-time `payment`-mode session, but we route
 * it through the same webhook path as a normal signup by tagging
 * metadata.period = 'childhood'. handleCheckoutComplete then provisions a
 * paid family (plan='paid', billing_period='childhood') with no
 * stripe_subscription_id — so nothing will ever mark it past_due or bill again.
 * `customer_creation: 'always'` ensures session.customer is populated so the
 * customer can manage billing and qualify for referral credit.
 */
async function createChildhoodCheckoutSession({ email, subdomain, domain, bookType, ref, referral, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const priceId = PRICES.childhood;
  if (!priceId) throw new Error('Childhood price not configured (STRIPE_PRICE_CHILDHOOD)');

  const metadata = {
    subdomain,
    period: 'childhood',
    plan: 'childhood',
    book_type: bookType || 'baby_book',
  };
  if (domain) metadata.domain = domain;
  if (ref) metadata.ref = ref;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    customer_creation: 'always',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    // Mirror the same metadata onto the PaymentIntent for dashboard clarity.
    payment_intent_data: { metadata },
    // Rewardful affiliate attribution — only set when present (Stripe rejects an empty value).
    ...(referral ? { client_reference_id: referral } : {}),
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}

async function createGiftCheckoutSession({ buyerEmail, buyerName, recipientName, recipientEmail, message, deliveryMethod, scheduledDate, plan, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  // Gift tier: 'annual' (1 year, $29) or 'childhood' (Entire Childhood, 18 years, $450).
  const isChildhood = plan === 'childhood';
  const unitAmount = isChildhood ? 45000 : 2900;
  const productName = isChildhood
    ? `Legacy Odyssey — Entire Childhood Gift (18 years) for ${recipientName || 'your recipient'}`
    : `Legacy Odyssey — 1 Year Gift for ${recipientName || 'your recipient'}`;
  const productDescription = isChildhood
    ? 'Entire Childhood gift — covers all 18 years, no annual renewals. Recipient redeems a gift code to create their own account and choose their custom domain.'
    : 'One-year gift subscription. Recipient redeems a gift code to create their own account and choose their custom domain.';

  // Validate deliveryMethod. Default to email_now if missing/invalid.
  // 'print' = buyer gives the certificate themselves; we never email the recipient.
  const validMethods = ['email_now', 'email_scheduled', 'print'];
  const resolvedMethod = validMethods.includes(deliveryMethod) ? deliveryMethod : 'email_now';

  // Validate scheduledDate when method is email_scheduled.
  // Expect YYYY-MM-DD from <input type="date">. Fall back to immediate-send if
  // missing or in the past — we don't want a paid gift to silently never send.
  let resolvedScheduledDate = '';
  let resolvedMethodFinal = resolvedMethod;
  if (resolvedMethod === 'email_scheduled') {
    if (scheduledDate) {
      const parsed = new Date(scheduledDate + 'T09:00:00Z'); // 9am UTC on the chosen date
      if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        resolvedScheduledDate = parsed.toISOString();
      } else {
        resolvedMethodFinal = 'email_now';
      }
    } else {
      resolvedMethodFinal = 'email_now';
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: productDescription,
            images: ['https://legacyodyssey.com/images/og-image.png'],
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'gift',
      gift_plan: isChildhood ? 'childhood' : 'annual',
      buyer_name: buyerName || '',
      recipient_name: recipientName || '',
      recipient_email: recipientEmail || '',
      gift_message: message || '',
      delivery_method: resolvedMethodFinal,
      scheduled_date: resolvedScheduledDate,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Create a one-time PaymentIntent for a gift purchase — used by the on-brand
 * embedded checkout (Stripe Payment Element + Appearance API). It carries the
 * SAME metadata the gift webhook needs, so fulfillment is identical to the
 * hosted-Checkout path; the only difference is the trigger event
 * (`payment_intent.succeeded` instead of `checkout.session.completed`).
 *
 * The PaymentIntent id doubles as the idempotency key for createGiftCode
 * (stored in gift_codes.stripe_session_id), exactly like the session id is.
 */
async function createGiftPaymentIntent({ buyerEmail, buyerName, recipientName, recipientEmail, message, deliveryMethod, scheduledDate, plan, referral }) {
  if (!stripe) throw new Error('Stripe not configured');

  const isChildhood = plan === 'childhood';
  const amount = isChildhood ? 45000 : 2900;

  // Normalize delivery method + scheduled date (mirrors createGiftCheckoutSession).
  const validMethods = ['email_now', 'email_scheduled', 'print'];
  let method = validMethods.includes(deliveryMethod) ? deliveryMethod : 'email_now';
  let scheduledIso = '';
  if (method === 'email_scheduled') {
    if (scheduledDate) {
      const parsed = new Date(scheduledDate + 'T09:00:00Z'); // 9am UTC on chosen date
      if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) scheduledIso = parsed.toISOString();
      else method = 'email_now';
    } else {
      method = 'email_now';
    }
  }

  const pi = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    receipt_email: buyerEmail || undefined,
    description: isChildhood
      ? 'Legacy Odyssey — Entire Childhood Gift (18 years)'
      : 'Legacy Odyssey — 1 Year Gift',
    metadata: {
      type: 'gift',
      gift_plan: isChildhood ? 'childhood' : 'annual',
      buyer_email: buyerEmail || '',
      buyer_name: buyerName || '',
      recipient_name: recipientName || '',
      recipient_email: recipientEmail || '',
      gift_message: message || '',
      delivery_method: method,
      scheduled_date: scheduledIso,
      // Rewardful affiliate referral — read by the payment_intent.succeeded webhook
      // to record a conversion via the Rewardful API (PaymentIntent flows can't use
      // client_reference_id). Empty when there's no affiliate.
      rewardful_referral: referral || '',
    },
  });

  return { clientSecret: pi.client_secret, paymentIntentId: pi.id, amount, plan: isChildhood ? 'childhood' : 'annual' };
}

/**
 * Create a Stripe Checkout session for purchasing an additional site.
 *
 * As of May 2026 we no longer offer the discounted $12.99/yr add-on. Each
 * additional domain is now a full subscription at the standard annual-intro
 * rate: $29 first year, then $49.99/year (same coupon as a fresh signup).
 *
 * Kept around for any deeplinks / older mobile installs that still hit the
 * `/api/stripe/create-additional-site-checkout` route.
 */
async function createAdditionalSiteCheckout({ email, authUserId, subdomain, domain, bookName, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const priceId = PRICES.subscription.annualIntro;
  if (!priceId) throw new Error('Annual intro price not configured');

  const metadata = {
    type: 'additional_site',
    plan: 'annual_intro',
    auth_user_id: authUserId,
    subdomain,
    book_name: bookName || '',
  };
  if (domain) metadata.domain = domain;

  const sessionParams = {
    mode: 'subscription',
    // Each site gets its OWN Stripe customer (via email), not the existing one —
    // families.stripe_customer_id is UNIQUE, so reusing the customer would make the
    // new family row collide. Matches the public checkout, which also keys on email.
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  // Apply first-year intro coupon if configured ($20.99 off → $29 first year, $49.99 after)
  if (PRICES.annualIntroCoupon) {
    sessionParams.discounts = [{ coupon: PRICES.annualIntroCoupon }];
  } else {
    sessionParams.allow_promotion_codes = true;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Cancel a family's subscription at the end of its current billing period.
 * Customer keeps access through what they've already paid for.
 *
 * No-op if family has no stripe_subscription_id.
 * Returns { canceled: bool, periodEnd: ISO string|null, alreadyCanceled: bool }.
 */
async function cancelSubscriptionAtPeriodEnd(family) {
  if (!stripe) throw new Error('Stripe not configured');
  if (!family || !family.stripe_subscription_id) {
    return { canceled: false, periodEnd: null, alreadyCanceled: false, reason: 'no-subscription' };
  }

  // Read current state — Stripe lets us call update on already-canceled subs but
  // it's cleaner to detect and skip. cancel_at_period_end=true is idempotent.
  const sub = await stripe.subscriptions.retrieve(family.stripe_subscription_id);
  if (sub.status === 'canceled') {
    return { canceled: true, periodEnd: null, alreadyCanceled: true };
  }
  if (sub.cancel_at_period_end) {
    return {
      canceled: true,
      periodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      alreadyCanceled: true,
    };
  }

  const updated = await stripe.subscriptions.update(family.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  return {
    canceled: true,
    periodEnd: updated.current_period_end ? new Date(updated.current_period_end * 1000).toISOString() : null,
    alreadyCanceled: false,
  };
}

// ─── EMBEDDED (Payment Element) SIGNUP FLOW ──────────────────────────────────
// Built behind preview routes; the live hosted-Checkout signup (handleCheckout
// complete) is intentionally left untouched. All three creators tag metadata
// with signup_flow='embedded' so the webhook provisions them via
// provisionEmbeddedSignup WITHOUT colliding with the hosted path.

/**
 * Create a Subscription for the embedded signup (monthly or annual). Uses
 * default_incomplete so the browser confirms the first invoice's PaymentIntent
 * via the Payment Element. Annual gets the intro coupon ($29 first year);
 * monthly adds the one-time setup fee to the first invoice.
 */
async function createSignupSubscription({ email, subdomain, domain, period, ref, referral }) {
  if (!stripe) throw new Error('Stripe not configured');
  const resolvedPeriod = period === 'annual' ? 'annual' : 'monthly';

  const customer = await stripe.customers.create({ email });

  const priceId = resolvedPeriod === 'annual'
    ? (PRICES.subscription.annualIntro || PRICES.subscription.annual)
    : PRICES.subscription.monthly;
  if (!priceId) throw new Error(`No price configured for period="${resolvedPeriod}"`);

  const params = {
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice'],
    metadata: {
      signup_flow: 'embedded',
      email: email || '',
      subdomain: subdomain || '',
      domain: domain || '',
      period: resolvedPeriod,
      book_type: 'baby_book',
      ref: ref || '',
      rewardful_referral: referral || '', // Rewardful affiliate referral (webhook records the conversion)
    },
  };
  // Annual: intro coupon ($20.99 off the first invoice → $29 first year).
  if (resolvedPeriod === 'annual' && PRICES.annualIntroCoupon) {
    params.discounts = [{ coupon: PRICES.annualIntroCoupon }];
  }
  // Monthly: one-time $5.99 setup fee on the first invoice.
  if (resolvedPeriod === 'monthly' && PRICES.setupFee) {
    params.add_invoice_items = [{ price: PRICES.setupFee }];
  }

  const subscription = await stripe.subscriptions.create(params);

  // Resolve the first-invoice client secret in a way that works across Stripe
  // API versions: older versions expose invoice.payment_intent; the Basil+
  // (2025+) versions moved it to invoice.confirmation_secret. Try both.
  const inv = subscription.latest_invoice;
  let clientSecret = null;
  if (inv && inv.payment_intent) {
    const piId = typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent.id;
    try { const pi = await stripe.paymentIntents.retrieve(piId); clientSecret = pi.client_secret; } catch (e) {}
  }
  if (!clientSecret && inv && inv.id) {
    try {
      const freshInv = await stripe.invoices.retrieve(inv.id, { expand: ['confirmation_secret'] });
      if (freshInv && freshInv.confirmation_secret) clientSecret = freshInv.confirmation_secret.client_secret;
    } catch (e) { /* confirmation_secret may not exist on older API versions */ }
  }

  return {
    clientSecret,
    subscriptionId: subscription.id,
    customerId: customer.id,
    period: resolvedPeriod,
  };
}

/**
 * Create a one-time PaymentIntent for the embedded Childhood signup ($450, 18
 * years, no subscription). Creates a Customer so provisioning has a
 * stripe_customer_id, mirroring createChildhoodCheckoutSession's
 * customer_creation:'always'.
 */
async function createSignupChildhoodIntent({ email, subdomain, domain, ref, referral }) {
  if (!stripe) throw new Error('Stripe not configured');
  const customer = await stripe.customers.create({ email });
  const pi = await stripe.paymentIntents.create({
    amount: 45000,
    currency: 'usd',
    customer: customer.id,
    automatic_payment_methods: { enabled: true },
    receipt_email: email || undefined,
    description: 'Legacy Odyssey — Entire Childhood Plan (18 years)',
    metadata: {
      signup_flow: 'embedded',
      type: 'signup_childhood',
      email: email || '',
      subdomain: subdomain || '',
      domain: domain || '',
      period: 'childhood',
      book_type: 'baby_book',
      ref: ref || '',
      rewardful_referral: referral || '', // Rewardful affiliate referral (webhook records the conversion)
    },
  });
  return { clientSecret: pi.client_secret, paymentIntentId: pi.id, customerId: customer.id, period: 'childhood' };
}

/**
 * Provisioning for the embedded signup flow — account + book + domain purchase.
 * Mirrors handleCheckoutComplete but is driven by explicit args (from a
 * Subscription or PaymentIntent) instead of a Checkout Session, and is kept
 * SEPARATE so the live hosted path is untouched while this is in preview.
 * Idempotent: an already-paid family short-circuits, and the domain order is
 * keyed on provisioningRef. (Dedupe with handleCheckoutComplete once primary.)
 */
async function provisionEmbeddedSignup({ email, customerName, subdomain, domain, period, bookType, referralCode, stripeCustomerId, stripeSubscriptionId, provisioningRef }) {
  if (!email) throw new Error('provisionEmbeddedSignup: email required');
  const { supabaseAdmin } = require('../config/supabase');
  bookType = bookType || 'baby_book';

  const creditReferral = async (family) => {
    if (!referralCode || !family) return;
    try {
      const referralService = require('./referralService');
      const fresh = await familyService.findById(family.id) || family;
      await referralService.attributeSignup(fresh, referralCode);
      await referralService.recordQualifiedReferral(fresh);
    } catch (e) { console.error('[referral] attribution failed:', e.message); }
  };
  const genRecovery = async () => {
    try {
      const { data } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery', email,
        options: { redirectTo: 'https://legacyodyssey.com/set-password' },
      });
      return data?.properties?.action_link || null;
    } catch (e) { console.error('recovery link failed:', e.message); return null; }
  };
  const startDomain = async (familyId) => {
    if (!domain) return;
    try {
      const domainService = require('./domainService');
      const order = await domainService.createDomainOrder({ familyId, domain, stripeSessionId: provisioningRef, price: null });
      domainService.purchaseAndSetupDomain(order.id).catch(err => console.error(`Background domain setup failed for ${domain}:`, err.message));
    } catch (err) { console.error(`Failed to create domain order for ${domain}:`, err.message); }
  };

  const existingFamily = await familyService.findByEmail(email);
  if (existingFamily && (existingFamily.plan !== 'paid' || existingFamily.subscription_status === 'canceled')) {
    await familyService.update(existingFamily.id, {
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId || null,
      subscription_status: 'active',
      billing_period: period,
      plan: 'paid',
      cancelled_at: null,
      data_retain_until: null,
      ...(customerName ? { customer_name: customerName } : {}),
    });
    const setPasswordUrl = await genRecovery();
    await startDomain(existingFamily.id);
    await creditReferral(existingFamily);
    return { family: existingFamily, setPasswordUrl, domain, alreadyProvisioned: false };
  }
  // True duplicate of THIS exact site (webhook retry) → idempotent no-op. Keyed on
  // the unique subdomain, NOT on "email is paid" — otherwise a paid customer buying
  // a SECOND site would be wrongly treated as a duplicate and provisioned nothing.
  if (subdomain) {
    const sameSite = await familyService.findBySubdomain(subdomain);
    if (sameSite && sameSite.plan === 'paid') {
      return { family: sameSite, setPasswordUrl: null, domain, alreadyProvisioned: true };
    }
  }

  // Existing PAID customer buying ANOTHER site → add a linked site under their login.
  if (existingFamily && existingFamily.plan === 'paid' && existingFamily.auth_user_id) {
    const added = await provisionAdditionalSite({
      authUserId: existingFamily.auth_user_id,
      email, subdomain, domain, period, bookType,
      stripeCustomerId, stripeSubscriptionId, sessionId: provisioningRef, customerName, creditReferral,
    });
    return { family: added.family, setPasswordUrl: null, domain, alreadyProvisioned: false, additionalSite: true };
  }

  const tempPassword = require('crypto').randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: tempPassword, email_confirm: true });
  if (authError) {
    // Edge: existing auth user but no family row → add a linked site rather than fail.
    if (/already.*regist|already.*exist|exists/i.test(authError.message || '')) {
      const existingUser = await findAuthUserByEmail(email);
      if (existingUser) {
        const added = await provisionAdditionalSite({
          authUserId: existingUser.id,
          email, subdomain, domain, period, bookType,
          stripeCustomerId, stripeSubscriptionId, sessionId: provisioningRef, customerName, creditReferral,
        });
        return { family: added.family, setPasswordUrl: null, domain, alreadyProvisioned: false, additionalSite: true };
      }
    }
    throw authError;
  }
  const setPasswordUrl = await genRecovery();

  const family = await familyService.create({
    email, authUserId: authData.user.id, subdomain,
    displayName: `The ${subdomain} Family`,
    stripeCustomerId, customerName, plan: 'paid', bookType,
  });
  await familyService.update(family.id, {
    stripe_subscription_id: stripeSubscriptionId || null,
    subscription_status: 'active', billing_period: period, plan: 'paid',
  });
  await bookService.createBookWithDefaults(family.id);
  try {
    const { sendWelcomeEmail } = require('./emailService');
    await sendWelcomeEmail({ to: email, displayName: family.display_name || subdomain, setPasswordUrl, bookPassword: family.book_password, subdomain, customDomain: domain || null });
  } catch (e) { console.error('welcome email failed:', e.message); }
  await startDomain(family.id);
  await creditReferral(family);
  return { family, setPasswordUrl, domain, alreadyProvisioned: false };
}

module.exports = {
  PRICES,
  createCheckoutSession,
  createFounderCheckoutSession,
  createFounderPageCheckoutSession,
  createChildhoodCheckoutSession,
  createGiftCheckoutSession,
  createGiftPaymentIntent,
  createSignupSubscription,
  createSignupChildhoodIntent,
  provisionEmbeddedSignup,
  createAdditionalSiteCheckout,
  provisionAdditionalSite,
  handleCheckoutComplete,
  cancelSubscriptionAtPeriodEnd,
  syncSubscriptionStatus,
  createPortalSession,
};
