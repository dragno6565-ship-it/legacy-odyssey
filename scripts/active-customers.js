require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await s.from('families')
    .select('email, plan, subscription_status, archived_at, created_at')
    .is('archived_at', null)
    .neq('subscription_status', 'canceled')
    .order('created_at');
  console.log(`Active (non-archived, non-canceled) families: ${data?.length || 0}`);
  for (const f of (data || [])) {
    console.log(`  ${f.email.padEnd(38)} plan=${f.plan} status=${f.subscription_status}`);
  }
})();
