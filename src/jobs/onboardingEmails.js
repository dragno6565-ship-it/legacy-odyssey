const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabase');
const { sendDay1Email, sendDay3Email, sendDay7Email, sendDay13Email } = require('../services/emailService');

/**
 * Onboarding email drip campaign.
 * Runs daily at 9:00 AM and sends emails based on account age:
 *   Day 1  — "Upload your first photo"
 *   Day 3  — "Explore your book sections"
 *   Day 7  — "Share your book"
 *   Day 13 — "Have you shared your book yet?"
 */

const EMAIL_SCHEDULE = [
  { day: 1, key: 'day1_sent', send: sendDay1Email },
  { day: 3, key: 'day3_sent', send: sendDay3Email },
  { day: 7, key: 'day7_sent', send: sendDay7Email },
  { day: 13, key: 'day13_sent', send: sendDay13Email },
];

async function runOnboardingEmails() {
  console.log('[onboarding] Checking for emails to send...');

  try {
    // Get all active/trialing families
    const { data: families, error } = await supabaseAdmin
      .from('families')
      .select('id, email, display_name, subdomain, custom_domain, created_at, onboarding_emails_sent')
      .in('subscription_status', ['active', 'trialing'])
      .eq('is_active', true);

    if (error) {
      console.error('[onboarding] Failed to query families:', error.message);
      return;
    }

    if (!families || families.length === 0) {
      console.log('[onboarding] No active families found.');
      return;
    }

    let sent = 0;

    for (const family of families) {
      const ageInDays = Math.floor(
        (Date.now() - new Date(family.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const alreadySent = family.onboarding_emails_sent || {};

      for (const { day, key, send } of EMAIL_SCHEDULE) {
        if (ageInDays >= day && !alreadySent[key]) {
          try {
            await send({
              to: family.email,
              displayName: family.display_name,
              subdomain: family.subdomain,
              customDomain: family.custom_domain,
            });

            // Mark this email as sent
            const updated = { ...alreadySent, [key]: new Date().toISOString() };
            await supabaseAdmin
              .from('families')
              .update({ onboarding_emails_sent: updated })
              .eq('id', family.id);

            sent++;
            console.log(`[onboarding] Sent ${key} to ${family.email}`);
          } catch (err) {
            console.error(`[onboarding] Failed ${key} for ${family.email}:`, err.message);
          }
        }
      }
    }

    console.log(`[onboarding] Done. Sent ${sent} email(s).`);
  } catch (err) {
    console.error('[onboarding] Unexpected error:', err.message);
  }
}

function startOnboardingScheduler() {
  // Run daily at 9:07 AM (offset to avoid :00 congestion)
  cron.schedule('7 9 * * *', runOnboardingEmails);
  console.log('[onboarding] Scheduler started — runs daily at 9:07 AM');

  // Also run once on startup (after a 30s delay to let the server warm up)
  setTimeout(runOnboardingEmails, 30000);
}

module.exports = { startOnboardingScheduler, runOnboardingEmails };
