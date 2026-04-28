/**
 * Gift code lifecycle. Direct port of src/services/giftService.js.
 *
 * Phase 3 first cut covers code generation, lookup, and redeem. createGiftCode
 * is called from the Stripe webhook on `checkout.session.completed` with
 * metadata.type='gift' (Phase 3 webhook port logs a TODO for it pending the
 * Resend port — landing here so the webhook handler can switch over once
 * Resend ships).
 *
 * Skipped vs Express until later:
 *   - sendWelcomeEmail at the end of redeem (Resend port pending — logged)
 *   - domain order kickoff at the end of redeem (domain registration port
 *     pending — logged)
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './supabase';
import { adminClient } from './supabase';
import { stripeClient } from './stripeClient';
import { createFamily } from './familyService';
import { createBookWithDefaults, type FullBook } from './bookService';
import { updateFamily } from './familyService';
import { sendWelcomeEmail } from './email';
import * as seedData from './seedData';
import type { Family } from './types';

type Row = Record<string, any>;

// Avoid ambiguous chars: 0/O, 1/I/L. Same alphabet as the Express helper so
// codes generated on either side parse on the other.
const GIFT_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateGiftCode(): string {
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  const groups: string[] = [];
  for (let g = 0; g < 3; g++) {
    let group = '';
    for (let i = 0; i < 4; i++) {
      group += GIFT_CODE_ALPHABET[buf[g * 4 + i] % GIFT_CODE_ALPHABET.length];
    }
    groups.push(group);
  }
  return `GIFT-${groups.join('-')}`;
}

export async function createGiftCode(
  supabase: SupabaseClient,
  args: {
    buyerEmail: string;
    buyerName?: string | null;
    recipientName?: string | null;
    recipientEmail?: string | null;
    recipientMessage?: string | null;
    stripeSessionId: string;
  }
): Promise<Row> {
  const code = generateGiftCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { data, error } = await supabase
    .from('gift_codes')
    .insert({
      code,
      buyer_email: args.buyerEmail,
      buyer_name: args.buyerName || null,
      recipient_name: args.recipientName || null,
      recipient_email: args.recipientEmail || null,
      recipient_message: args.recipientMessage || null,
      stripe_session_id: args.stripeSessionId,
      months_prepaid: 12,
      status: 'purchased',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Row;
}

export async function findByCode(supabase: SupabaseClient, code: string): Promise<Row | null> {
  const { data } = await supabase
    .from('gift_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();
  return (data as Row | null) ?? null;
}

function randomTempPassword(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Redeem a gift code: create the recipient's auth user (or reuse an existing
 * one), family, book, and Stripe subscription with the prepaid months as a
 * trial. Mirrors giftService.redeemGiftCode from Express.
 */
export async function redeemGiftCode(
  env: Env,
  args: { code: string; email: string; domain?: string | null }
): Promise<{ family: Family; gift: Row; domain: string | null; setPasswordUrl: string | null }> {
  const supabase = adminClient(env);

  // 1. Validate
  const gift = await findByCode(supabase, args.code);
  if (!gift) throw new Error('Invalid gift code.');
  if (gift.status !== 'purchased') throw new Error('This gift code has already been redeemed.');
  if (new Date(gift.expires_at) < new Date()) throw new Error('This gift code has expired.');

  // 2. Create or reuse auth user. If the email already has an account
  // (e.g. a former customer redeeming a gift), reuse it instead of erroring.
  let authUserId: string | null = null;
  const tempPassword = randomTempPassword();
  const { data: createData, error: authError } = await supabase.auth.admin.createUser({
    email: args.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createData?.user) {
    authUserId = createData.user.id;
  } else if (authError && /already (been )?registered|already exists|email_exists|duplicate/i.test(authError.message || '')) {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listError) throw listError;
    const existing = (listData.users || []).find(
      (u) => (u.email || '').toLowerCase() === args.email.toLowerCase()
    );
    if (!existing) {
      throw new Error(
        `Gift redemption: email ${args.email} reported as existing but not found in user list.`
      );
    }
    authUserId = existing.id;
    console.log(`Gift redemption reusing existing auth user for ${args.email} (${authUserId})`);
  } else if (authError) {
    throw authError;
  } else {
    throw new Error('Gift redemption: unexpected createUser response (no user, no error).');
  }

  // Generate a recovery link so the recipient can set their own password.
  let setPasswordUrl: string | null = null;
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: args.email,
      options: { redirectTo: `https://${env.APP_DOMAIN || 'legacyodyssey.com'}/set-password` },
    });
    setPasswordUrl = (linkData as any)?.properties?.action_link || null;
  } catch (e: any) {
    console.error('Failed to generate recovery link for gift redemption:', e.message);
  }

  // 3. Derive subdomain from the chosen domain (or null if none yet).
  const subdomain = args.domain
    ? args.domain.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
    : null;

  // 4. Create family
  const family = await createFamily(supabase, {
    email: args.email,
    authUserId,
    subdomain,
    displayName: subdomain ? `The ${subdomain} Family` : 'My Family',
    customerName: gift.recipient_name || undefined,
  });

  // 5. Create Stripe customer + subscription with prepaid trial.
  if (env.STRIPE_SECRET_KEY) {
    try {
      const stripe = stripeClient(env);
      const customer = await stripe.customers.create({
        email: args.email,
        metadata: { family_id: family.id },
      });

      const trialEnd = new Date(gift.created_at);
      trialEnd.setMonth(trialEnd.getMonth() + (gift.months_prepaid || 12));

      // Use ANNUAL price (matches the disclosed $49.99/yr post-trial price
      // shown on /gift). DON'T use MONTHLY here.
      const priceId = env.STRIPE_PRICE_ANNUAL;
      if (!priceId) throw new Error('STRIPE_PRICE_ANNUAL not configured');

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_end: Math.floor(trialEnd.getTime() / 1000),
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
      });

      await updateFamily(supabase, family.id, {
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        subscription_status: 'active',
        billing_period: 'annual',
      });
    } catch (stripeErr: any) {
      console.error('Gift redemption Stripe setup error:', stripeErr.message);
      // Match Express: still continue — family + book are created.
      await updateFamily(supabase, family.id, { subscription_status: 'active' });
    }
  } else {
    await updateFamily(supabase, family.id, { subscription_status: 'active' });
  }

  // 6. Seed the book
  await createBookWithDefaults(supabase, family.id, seedData);

  // 7. Mark gift redeemed
  await supabase
    .from('gift_codes')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      family_id: family.id,
    })
    .eq('id', gift.id);

  if (args.domain) {
    console.warn(
      `[gift.redeem] domain registration for ${args.domain} (family ${family.id}) deferred (domainService port pending)`
    );
  }

  // Welcome email — best-effort. Match Express: never throw out of redeem.
  await sendWelcomeEmail(env, {
    to: args.email,
    displayName: family.display_name || subdomain,
    setPasswordUrl,
    bookPassword: family.book_password,
    subdomain,
    customDomain: args.domain || null,
  });

  return { family, gift, domain: args.domain || null, setPasswordUrl };
}
// FullBook re-export so consumers don't need a second import path
export type { FullBook };
