require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
(async () => {
  // 1) Service role can still read both tables
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const r1 = await admin.from('celebration_photos').select('id', { count: 'exact', head: true });
  const r2 = await admin.from('recipe_photos').select('id', { count: 'exact', head: true });
  console.log('service_role celebration_photos rows:', r1.count, r1.error?.message || 'ok');
  console.log('service_role recipe_photos rows    :', r2.count, r2.error?.message || 'ok');

  // 2) Anon role gets nothing (after RLS enable, no policies)
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const r3 = await anon.from('celebration_photos').select('id');
  const r4 = await anon.from('recipe_photos').select('id');
  console.log('anon celebration_photos:', JSON.stringify(r3.data), r3.error?.message || 'no error (empty)');
  console.log('anon recipe_photos    :', JSON.stringify(r4.data), r4.error?.message || 'no error (empty)');
})();
