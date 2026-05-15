require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await s.from('gift_codes').select('*').or('recipient_name.ilike.%Giulia%,recipient_name.ilike.%Busetto%,recipient_email.ilike.%giulia%,recipient_email.ilike.%busetto%');
  if (error) { console.error(error); process.exit(1); }
  console.log(`Found ${data.length} gift rows for Giulia/Busetto:`);
  for (const g of data) {
    console.log('---');
    console.log(`  id:                 ${g.id}`);
    console.log(`  code:               ${g.code}`);
    console.log(`  status:             ${g.status}`);
    console.log(`  buyer_name:         ${g.buyer_name}`);
    console.log(`  buyer_email:        ${g.buyer_email}`);
    console.log(`  recipient_name:     ${g.recipient_name}`);
    console.log(`  recipient_email:    ${g.recipient_email}`);
    console.log(`  stripe_session_id:  ${g.stripe_session_id || '(none)'}`);
    console.log(`  stripe_payment:     ${g.stripe_payment_intent_id || g.stripe_charge_id || '(none)'}`);
    console.log(`  amount_cents:       ${g.amount_cents || '(none)'}`);
    console.log(`  created_at:         ${g.created_at}`);
    console.log(`  certificate_token:  ${g.certificate_token || '(none)'}`);
  }
})();
