const { stripe } = require('../../config/stripe');
const axios = require('axios');
const { pass, warn, fail } = require('./helpers');

module.exports = {
  blockName: 'checkout',
  blockLabel: 'Checkout & Domain Purchase',
  checks: [
    {
      id: 'stripe-api',
      name: 'Stripe API reachable',
      fn: async () => {
        if (!stripe) return fail('STRIPE_SECRET_KEY not set');
        try {
          const acct = await stripe.accounts.retrieve();
          if (!acct?.id) return fail('No account returned');
          return pass(`Account ${acct.id}`);
        } catch (err) {
          return fail(err.message);
        }
      },
    },
    {
      id: 'stripe-prices',
      name: 'All required Stripe Price IDs exist',
      fn: async () => {
        if (!stripe) return fail('Stripe not configured');
        const required = {
          STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
          STRIPE_PRICE_ANNUAL: process.env.STRIPE_PRICE_ANNUAL,
          STRIPE_PRICE_ANNUAL_INTRO: process.env.STRIPE_PRICE_ANNUAL_INTRO,
          STRIPE_PRICE_ADDITIONAL_DOMAIN: process.env.STRIPE_PRICE_ADDITIONAL_DOMAIN,
          STRIPE_PRICE_SETUP: process.env.STRIPE_PRICE_SETUP,
        };
        const missing = Object.entries(required).filter(([_, v]) => !v).map(([k]) => k);
        if (missing.length) return fail(`Env vars missing: ${missing.join(', ')}`);

        const errors = [];
        for (const [envName, priceId] of Object.entries(required)) {
          try {
            const p = await stripe.prices.retrieve(priceId);
            if (!p.active) errors.push(`${envName} (${priceId}) is inactive`);
          } catch (err) {
            errors.push(`${envName} (${priceId}) lookup failed: ${err.message}`);
          }
        }
        if (errors.length) return fail(errors.join('; '));
        return pass(`${Object.keys(required).length} prices verified active`);
      },
    },
    {
      id: 'stripe-webhook-secret',
      name: 'Stripe webhook secret configured',
      fn: async () => {
        if (!process.env.STRIPE_WEBHOOK_SECRET) return fail('STRIPE_WEBHOOK_SECRET not set');
        return pass('Set');
      },
    },
    {
      id: 'spaceship-api',
      name: 'Spaceship API reachable',
      fn: async () => {
        if (!process.env.SPACESHIP_API_KEY || !process.env.SPACESHIP_API_SECRET) {
          return fail('SPACESHIP_API_KEY/SECRET not set');
        }
        try {
          // Check availability of a known-registered domain — fast probe that
          // exercises auth + DNS without actually purchasing anything
          const r = await axios.get('https://spaceship.dev/api/v1/domains/legacyodyssey.com', {
            headers: {
              'X-Api-Key': process.env.SPACESHIP_API_KEY,
              'X-Api-Secret': process.env.SPACESHIP_API_SECRET,
            },
            timeout: 8000, validateStatus: () => true,
          });
          if (r.status === 401 || r.status === 403) return fail(`Auth rejected (${r.status})`);
          if (r.status !== 200) return fail(`HTTP ${r.status}`);
          return pass('Reachable + authenticated');
        } catch (err) {
          return fail(err.message);
        }
      },
    },
  ],
};
