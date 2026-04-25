const { supabaseAdmin } = require('../../config/supabase');
const { isSiteLive } = require('../siteHealthCheck');
const { pass, warn, fail } = require('./helpers');

/**
 * For every active customer with a custom_domain, both apex and www must
 * respond. We don't run this as one fan-out check (would explode the
 * report); instead we aggregate per-result into a single "domain reach"
 * check, and add a per-domain entry only when it fails.
 */
module.exports = {
  blockName: 'domains',
  blockLabel: 'Customer Domains',
  checks: [
    {
      id: 'all-active-customers-reachable',
      name: 'All active customers’ custom domains reachable',
      fn: async () => {
        const { data: families } = await supabaseAdmin
          .from('families')
          .select('id, email, custom_domain, subscription_status, archived_at')
          .in('subscription_status', ['active', 'trialing'])
          .is('archived_at', null)
          .not('custom_domain', 'is', null)
          .eq('is_active', true);

        if (!families?.length) return pass('No customers with custom domains');

        const broken = [];
        for (const f of families) {
          const r = await isSiteLive(f.custom_domain);
          if (!r.live) broken.push({ domain: f.custom_domain, email: f.email, urls: r.checkedUrls });
        }
        if (!broken.length) return pass(`All ${families.length} customer domain(s) reachable`);
        return fail(`${broken.length} of ${families.length} domain(s) unreachable: ${broken.map(b => b.domain).join(', ')}`,
          { broken });
      },
    },
    {
      id: 'recent-failed-orders',
      name: 'No domain orders failed in last 24h',
      fn: async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: failed } = await supabaseAdmin
          .from('domain_orders')
          .select('id, domain, error_message, created_at')
          .eq('status', 'failed')
          .gte('created_at', yesterday);
        if (!failed?.length) return pass('No recent failures');
        return fail(`${failed.length} failed order(s) in last 24h: ${failed.map(o => o.domain).join(', ')}`,
          { failed });
      },
    },
    {
      id: 'orders-stuck-in-progress',
      name: 'No domain orders stuck in progress > 1h',
      fn: async () => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: stuck } = await supabaseAdmin
          .from('domain_orders')
          .select('id, domain, status, created_at')
          .neq('status', 'active')
          .neq('status', 'failed')
          .lt('created_at', hourAgo);
        if (!stuck?.length) return pass('No stuck orders');
        return warn(`${stuck.length} order(s) >1h in transitional state: ${stuck.map(o => `${o.domain}(${o.status})`).join(', ')}`,
          { stuck });
      },
    },
  ],
};
