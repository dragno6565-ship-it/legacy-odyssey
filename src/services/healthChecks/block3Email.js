const axios = require('axios');
const { pass, warn, fail } = require('./helpers');

/**
 * Email pipeline checks. We don't actually send test emails (would clutter
 * the admin's gmail). We DO verify:
 *  - Resend API is reachable + the key is valid
 *  - Every customer-facing template renders without errors when given
 *    sample inputs (catches the "empty conditional dropped the App Store
 *    button" bug we hit on Apr 24)
 *  - Critical link domains in templates resolve to valid URLs
 */
module.exports = {
  blockName: 'email',
  blockLabel: 'Email Pipeline',
  checks: [
    {
      id: 'resend-api',
      name: 'Resend API reachable + key valid',
      fn: async () => {
        const key = process.env.RESEND_API_KEY;
        if (!key) return fail('RESEND_API_KEY not set');
        try {
          const r = await axios.get('https://api.resend.com/domains', {
            headers: { Authorization: `Bearer ${key}` },
            timeout: 5000, validateStatus: () => true,
          });
          if (r.status === 401) return fail('Resend rejected API key (401)');
          if (r.status !== 200) return fail(`HTTP ${r.status}`);
          return pass(`${(r.data?.data || []).length} domain(s) on account`);
        } catch (err) {
          return fail(`Network: ${err.message}`);
        }
      },
    },
    {
      id: 'resend-domain-verified',
      name: 'legacyodyssey.com still verified at Resend',
      fn: async () => {
        const key = process.env.RESEND_API_KEY;
        if (!key) return fail('RESEND_API_KEY not set');
        const r = await axios.get('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${key}` },
          timeout: 5000, validateStatus: () => true,
        });
        if (r.status !== 200) return fail(`HTTP ${r.status}`);
        const domain = (r.data?.data || []).find((d) => d.name === 'legacyodyssey.com');
        if (!domain) return fail('legacyodyssey.com not found on Resend account');
        if (domain.status !== 'verified') return fail(`Status is "${domain.status}" (expected "verified")`);
        return pass('Verified');
      },
    },
    {
      id: 'welcome-template-renders',
      name: 'Welcome email template renders (no missing fields)',
      fn: async () => {
        // Stub Resend so we capture the html string without sending anything
        const captured = [];
        const stub = { Resend: class { constructor() {} get emails() { return { send: async (req) => { captured.push(req); return { data: { id: 'check' } }; } }; } } };
        const cacheKey = require.resolve('resend');
        const orig = require.cache[cacheKey];
        require.cache[cacheKey] = { exports: stub };
        // Re-require emailService with stubbed Resend
        delete require.cache[require.resolve('../emailService')];
        const { sendWelcomeEmail } = require('../emailService');
        try {
          await sendWelcomeEmail({
            to: 'check@example.com', displayName: 'Check', setPasswordUrl: 'https://example.com/sp',
            bookPassword: 'abc1', subdomain: 'checkcheck', customDomain: 'checkcheck.com',
          });
        } finally {
          // Restore
          require.cache[cacheKey] = orig;
          delete require.cache[require.resolve('../emailService')];
        }

        if (!captured[0]?.html) return fail('No HTML captured');
        const html = captured[0].html;
        const needles = ['Set Your Password', 'App Store', 'Google Play', 'apps.apple.com', 'play.google.com', 'abc1'];
        const missing = needles.filter((n) => !html.includes(n));
        if (missing.length) return fail(`Missing in rendered email: ${missing.join(', ')}`);
        return pass('All required content present');
      },
    },
    {
      id: 'app-store-links-valid',
      name: 'App Store + Google Play links resolve',
      fn: async () => {
        const links = [
          'https://apps.apple.com/app/id6760883565',
          'https://play.google.com/store/apps/details?id=com.legacyodyssey.app',
        ];
        const failures = [];
        for (const url of links) {
          try {
            const r = await axios.head(url, { timeout: 5000, validateStatus: () => true, maxRedirects: 5 });
            if (r.status >= 400) failures.push(`${url} → ${r.status}`);
          } catch (err) {
            failures.push(`${url} → ${err.code || err.message}`);
          }
        }
        if (failures.length) return fail(failures.join('; '));
        return pass('Both stores responding');
      },
    },
    {
      id: 'admin-email-set',
      name: 'ADMIN_EMAIL configured',
      fn: async () => {
        const v = process.env.ADMIN_EMAIL;
        if (!v) return warn('ADMIN_EMAIL env var not set — health alerts will use the default (legacyodysseyapp@gmail.com)');
        return pass(`= ${v}`);
      },
    },
  ],
};
