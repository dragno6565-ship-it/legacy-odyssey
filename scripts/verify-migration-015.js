require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const r1 = await s.from('recipes').select('id, title, slug, story, prep_time, cook_time, servings, difficulty, directions, notes').limit(3);
  console.log('recipes sample:', JSON.stringify(r1.data, null, 2), r1.error || '');
  const r2 = await s.from('recipe_photos').select('id, recipe_id, photo_path, caption').limit(5);
  console.log('recipe_photos sample:', JSON.stringify(r2.data, null, 2), r2.error || '');
  const r3 = await s.from('recipes').select('id', { count: 'exact', head: true });
  console.log('recipes count:', r3.count);
  const r4 = await s.from('recipe_photos').select('id', { count: 'exact', head: true });
  console.log('recipe_photos count:', r4.count);
  const r5 = await s.from('recipes').select('id, slug').is('slug', null);
  console.log('recipes with null slug:', r5.data?.length);
})();
