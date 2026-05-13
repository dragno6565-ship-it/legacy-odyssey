require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const a = await s.from('keepsakes').select('id, title, category, age_text, date_made, attribution, description, story, slug').limit(1);
  console.log('keepsakes table:', a.error ? a.error.message : 'OK, rows=' + (a.data?.length ?? 0));
  const b = await s.from('keepsake_photos').select('id, keepsake_id, photo_path, caption, focal_x, focal_y, sort_order').limit(1);
  console.log('keepsake_photos table:', b.error ? b.error.message : 'OK, rows=' + (b.data?.length ?? 0));

  // Verify the anon role gets nothing (RLS on, no policies)
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const c = await anon.from('keepsakes').select('id');
  console.log('anon keepsakes:', JSON.stringify(c.data));
})();
