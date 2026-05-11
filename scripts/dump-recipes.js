require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await supabase.from('recipes').select('*');
  if (error) { console.error(error); process.exit(1); }
  const outDir = 'F:/backups/recipes-redesign-20260511';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `recipes-data-dump-${new Date().toISOString().slice(0,10)}.json`);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Dumped ${data.length} recipes to ${outPath}`);
})();
