const { supabaseAdmin } = require('../../config/supabase');
const { stripe } = require('../../config/stripe');
const { pass, warn, fail } = require('./helpers');

const PROTECTED_EMAILS = new Set(['review@legacyodyssey.com']);

/**
 * Per-customer integrity checks. We don't generate one row per customer —
 * we run all customers and aggregate into a few high-signal checks.
 */
module.exports = {
  blockName: 'customers',
  blockLabel: 'Customer Records',
  checks: [
    {
      id: 'all-have-books',
      name: 'Every active customer has a book record',
      fn: async () => {
        const { data: families } = await supabaseAdmin
          .from('families')
          .select('id, email')
          .in('subscription_status', ['active', 'trialing'])
          .is('archived_at', null)
          .eq('is_active', true);
        if (!families?.length) return pass('No customers');
        const familyIds = families.map((f) => f.id);
        const { data: books } = await supabaseAdmin.from('books').select('family_id').in('family_id', familyIds);
        const haveBookIds = new Set((books || []).map((b) => b.family_id));
        const missing = families.filter((f) => !haveBookIds.has(f.id));
        if (missing.length) return fail(`${missing.length} family/families missing books: ${missing.map((m) => m.email).join(', ')}`);
        return pass(`All ${families.length} customer(s) have books`);
      },
    },
    {
      id: 'stripe-subs-match',
      name: 'Stripe subscription status matches DB',
      fn: async () => {
        if (!stripe) return fail('Stripe not configured');
        const { data: families } = await supabaseAdmin
          .from('families')
          .select('id, email, stripe_subscription_id, subscription_status, archived_at')
          .not('stripe_subscription_id', 'is', null);
        if (!families?.length) return pass('No customers with Stripe subs');

        const mismatches = [];
        for (const f of families) {
          try {
            const sub = await stripe.subscriptions.retrieve(f.stripe_subscription_id);
            // For ARCHIVED families, our DB says canceled — Stripe may say
            // active until period_end. That's expected; skip.
            if (f.archived_at) continue;
            // Stripe says canceled but DB doesn't reflect it
            if (sub.status === 'canceled' && f.subscription_status !== 'canceled') {
              mismatches.push(`${f.email}: Stripe=canceled, DB=${f.subscription_status}`);
            }
            // Stripe says past_due but DB says active
            if (sub.status === 'past_due' && f.subscription_status === 'active') {
              mismatches.push(`${f.email}: Stripe=past_due, DB=active`);
            }
          } catch (err) {
            if (err?.statusCode === 404) {
              mismatches.push(`${f.email}: Stripe sub ${f.stripe_subscription_id} not found`);
            } else {
              mismatches.push(`${f.email}: ${err.message}`);
            }
          }
        }
        if (mismatches.length) return warn(`${mismatches.length} mismatch(es): ${mismatches.slice(0, 3).join('; ')}${mismatches.length > 3 ? '...' : ''}`,
          { mismatches });
        return pass(`${families.length} subscription(s) match`);
      },
    },
    {
      id: 'apple-review-demo-intact',
      name: 'Apple Review Demo account exists and is active',
      fn: async () => {
        const { data: f } = await supabaseAdmin.from('families').select('id, email, subscription_status, is_active, archived_at')
          .eq('email', 'review@legacyodyssey.com').maybeSingle();
        if (!f) return fail('review@legacyodyssey.com NOT FOUND — Apple App Store reviews will fail');
        if (!f.is_active) return fail('Apple Review Demo is_active=false');
        if (f.archived_at) return fail('Apple Review Demo is archived');
        if (f.subscription_status !== 'active') return warn(`Status is "${f.subscription_status}" (expected "active")`);
        return pass('Active');
      },
    },
    {
      id: 'admin-not-archived',
      name: 'Admin account(s) not accidentally archived',
      fn: async () => {
        const { data: admins } = await supabaseAdmin.from('admin_users').select('email');
        if (!admins?.length) return warn('No admin_users rows');
        const emails = admins.map((a) => a.email).filter(Boolean);
        if (!emails.length) return pass('No admin emails to check');
        const { data: archived } = await supabaseAdmin.from('families')
          .select('email, archived_at').in('email', emails).not('archived_at', 'is', null);
        if (archived?.length) return fail(`Admin family archived: ${archived.map((f) => f.email).join(', ')}`);
        return pass(`${emails.length} admin(s) safe`);
      },
    },
  ],
};
