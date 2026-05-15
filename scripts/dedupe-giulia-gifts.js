// One-off cleanup: remove the duplicate gift_codes rows for the Giulia Busetto
// purchase (Stripe session cs_live_a1YOhPAhyZTlAmMzg6S5qF04fFQ2APcCukzov5w1h7lmZW7CMpG442jk09).
// Keep the earliest row (id e9fdfea8-47a7-468c-be3b-8342149da166, code
// GIFT-HUUU-6PJJ-QU73, created 17:46:42.936Z, has cert token).
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_ID = 'e9fdfea8-47a7-468c-be3b-8342149da166';
const DELETE_IDS = [
  '4039c7e8-fa4c-4e16-bde8-4a1fd4698008', // GIFT-S2YM-4KP9-N38K, no cert token
  '2ba2c1dd-b9bb-426e-85fa-506be6aea1be', // GIFT-F3M7-XNGY-C4HP, has cert token, latest
];

(async () => {
  // Safety: verify none of these have been redeemed (status != 'purchased' would be alarming).
  const { data: rows, error } = await s.from('gift_codes').select('id, code, status, family_id, recipient_email_sent_at').in('id', [KEEP_ID, ...DELETE_IDS]);
  if (error) { console.error(error); process.exit(1); }
  console.log('Current state of the 3 rows:');
  for (const r of rows) {
    console.log(`  ${r.id.substring(0,8)}…  code=${r.code}  status=${r.status}  family_id=${r.family_id || 'none'}  emailed_at=${r.recipient_email_sent_at || 'never'}`);
  }
  const redeemed = rows.find((r) => r.status === 'redeemed' || r.family_id);
  if (redeemed) {
    console.error('STOP: one of these rows has been redeemed — manual review required.');
    process.exit(1);
  }

  // Delete the two duplicates.
  const { error: delErr } = await s.from('gift_codes').delete().in('id', DELETE_IDS);
  if (delErr) { console.error('Delete failed:', delErr); process.exit(1); }
  console.log(`Deleted ${DELETE_IDS.length} duplicate rows. Kept ${KEEP_ID.substring(0,8)}…`);

  // Verify the remaining row.
  const { data: remaining } = await s.from('gift_codes').select('id, code, certificate_token').eq('stripe_session_id', 'cs_live_a1YOhPAhyZTlAmMzg6S5qF04fFQ2APcCukzov5w1h7lmZW7CMpG442jk09');
  console.log('Remaining gift_codes for this session:', JSON.stringify(remaining, null, 2));
})();
