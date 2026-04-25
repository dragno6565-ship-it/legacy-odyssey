const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabase');
const { isSiteLive } = require('../services/siteHealthCheck');
const { sendSiteLiveEmail } = require('../services/emailService');

/**
 * Detect when a newly-purchased customer's site has actually come up
 * (DNS propagated + Railway TLS provisioned + server reachable) and send
 * the customer a "Your site is live!" confirmation email.
 *
 * Runs every 5 minutes. For each domain_order with status='active' that we
 * haven't yet sent a live email for, HEAD-check both apex and www. On
 * first success: set site_live_at + site_live_email_sent_at and email
 * the customer.
 *
 * Stops polling an order after 24 hours of no detection — at that point
 * we mark the live-email-sent timestamp anyway so we don't poll forever
 * (the customer will hear about a stuck order via the daily failed-order
 * alert cron instead).
 */

const POLL_INTERVAL_CRON = '*/5 * * * *';   // every 5 minutes
const GIVE_UP_AFTER_HOURS = 24;

async function runSiteLiveDetect() {
  const cutoff = new Date(Date.now() - GIVE_UP_AFTER_HOURS * 60 * 60 * 1000).toISOString();

  // Find candidates: active orders with no live-email sent, created
  // within the give-up window, that have a family attached.
  const { data: orders, error } = await supabaseAdmin
    .from('domain_orders')
    .select('id, domain, family_id, created_at')
    .eq('status', 'active')
    .is('site_live_email_sent_at', null)
    .gte('created_at', cutoff)
    .not('family_id', 'is', null);

  if (error) {
    console.error('[site-live] query failed:', error.message);
    return;
  }
  if (!orders?.length) return;

  console.log(`[site-live] checking ${orders.length} pending order(s)`);

  for (const order of orders) {
    try {
      const { live, checkedUrls } = await isSiteLive(order.domain);
      if (!live) {
        const summary = checkedUrls.map(c => `${c.url}=${c.status || c.error}`).join(' ');
        console.log(`[site-live] not yet live: ${order.domain} (${summary})`);
        continue;
      }

      // Look up the family for the email
      const { data: family } = await supabaseAdmin
        .from('families')
        .select('id, email, customer_name, display_name, subdomain, custom_domain, book_password')
        .eq('id', order.family_id)
        .maybeSingle();

      if (!family || !family.email) {
        console.log(`[site-live] ${order.domain} is live but family/email missing — marking sent to stop polling`);
        await supabaseAdmin.from('domain_orders').update({
          site_live_at: new Date().toISOString(),
          site_live_email_sent_at: new Date().toISOString(),
        }).eq('id', order.id);
        continue;
      }

      console.log(`[site-live] ${order.domain} is live — emailing ${family.email}`);
      const liveAt = new Date().toISOString();

      await sendSiteLiveEmail({
        to: family.email,
        displayName: family.customer_name || family.display_name,
        customDomain: family.custom_domain,
        subdomain: family.subdomain,
        bookPassword: family.book_password,
      });

      await supabaseAdmin.from('domain_orders').update({
        site_live_at: liveAt,
        site_live_email_sent_at: liveAt,
      }).eq('id', order.id);
    } catch (err) {
      console.error(`[site-live] error processing ${order.domain}:`, err.message);
    }
  }

  // Give-up sweep: orders older than the cutoff that we've never detected
  // live and never given up on. Mark them so we stop polling.
  const { data: stuck } = await supabaseAdmin
    .from('domain_orders')
    .select('id, domain')
    .eq('status', 'active')
    .is('site_live_email_sent_at', null)
    .lt('created_at', cutoff)
    .not('family_id', 'is', null);

  if (stuck?.length) {
    console.log(`[site-live] giving up on ${stuck.length} order(s) >${GIVE_UP_AFTER_HOURS}h old (will not email)`);
    for (const o of stuck) {
      await supabaseAdmin.from('domain_orders').update({
        site_live_email_sent_at: new Date().toISOString(),
      }).eq('id', o.id);
    }
  }
}

function startSiteLiveDetectScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('site-live-detect', runSiteLiveDetect);
  cron.schedule(POLL_INTERVAL_CRON, tracked);
  console.log(`[site-live] Scheduler started — polls every 5 min, gives up after ${GIVE_UP_AFTER_HOURS}h`);

  // First run on startup, after a 2-minute delay so the server is fully ready
  setTimeout(tracked, 120000);
}

module.exports = { startSiteLiveDetectScheduler, runSiteLiveDetect };
