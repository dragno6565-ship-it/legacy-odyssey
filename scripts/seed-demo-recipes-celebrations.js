/**
 * seed-demo-recipes-celebrations.js
 * ---------------------------------
 * One-off, idempotent seed of warm, premium demo content for the PUBLIC DEMO
 * book that renders through the shared book viewer.
 *
 * SCOPE GUARD: this script ONLY touches the demo book whose family resolves to
 * custom_domain = 'your-family-photo-album.com'. It verifies that mapping at
 * runtime and ABORTS if the ids don't line up — so it can never accidentally
 * write to a real customer's book. It also only deletes/inserts rows scoped to
 * that single book_id (and the recipe/celebration ids that belong to it).
 *
 * What it seeds (all via the Supabase service-role client — DATA only, no DDL):
 *   - recipes  : 4 rich recipes (ingredients, directions, story, notes, stat
 *                strip, origin label) + a couple of photos each via recipe_photos
 *   - celebrations : 5 celebrations across 2 years (body, location, attendees,
 *                gifts, date) + cover/gallery photos via celebration_photos
 *   - books.celebration_years : ['Your First Year', 'Your Second Year']
 *   - books.visible_sections  : forces recipes + holidays ON for the demo
 *
 * Names are generic stand-ins only. No banned words ("forever", "chapter",
 * "family book/family's story"). Photos are remote Unsplash URLs, stored
 * directly in photo_path (getPublicUrl returns http URLs as-is).
 *
 * Re-running is safe: it deletes the demo book's existing recipes/celebrations
 * (+ their photo rows) and re-inserts the canonical set below.
 *
 * Usage:  node scripts/seed-demo-recipes-celebrations.js
 */
require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

const DEMO_DOMAIN = 'your-family-photo-album.com';
const EXPECTED_BOOK_ID = 'f4804dca-c5a4-4518-b1cc-1829a24cc958';

// ── Unsplash cover/gallery photos (remote URLs, rendered as-is) ───────────────
const PH = {
  pancakes: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&h=900&fit=crop&auto=format&q=80',
  pancakes2: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=900&h=900&fit=crop&auto=format&q=80',
  sauce: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&h=900&fit=crop&auto=format&q=80',
  sauce2: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&h=900&fit=crop&auto=format&q=80',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=900&fit=crop&auto=format&q=80',
  cake2: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900&h=900&fit=crop&auto=format&q=80',
  cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&h=900&fit=crop&auto=format&q=80',
  cookies2: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=900&h=900&fit=crop&auto=format&q=80',
  // celebrations
  christmas: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=1600&h=800&fit=crop&auto=format&q=85',
  christmasG1: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=700&h=875&fit=crop&auto=format&q=80',
  christmasG2: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=700&h=875&fit=crop&auto=format&q=80',
  spring: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&h=800&fit=crop&auto=format&q=85',
  springG1: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=700&h=875&fit=crop&auto=format&q=80',
  birthday1: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=1600&h=800&fit=crop&auto=format&q=85',
  birthday1G1: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&h=875&fit=crop&auto=format&q=80',
  summer: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=1600&h=800&fit=crop&auto=format&q=85',
  firstSteps: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1600&h=800&fit=crop&auto=format&q=85',
  firstStepsG1: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=700&h=875&fit=crop&auto=format&q=80',
};

// ── Recipes ───────────────────────────────────────────────────────────────
const RECIPES = [
  {
    title: 'Sunday Morning Pancakes',
    origin_label: 'From Grandma Ruth · The recipe that started every weekend',
    description: 'Light, golden, and just a little sweet — the pancakes that mean the weekend has finally begun.',
    prep_time: '10 min',
    cook_time: '15 min',
    servings: '4',
    difficulty: 'Easy',
    story:
      'Grandma Ruth made these every Sunday for thirty years, and the smell of them in a warm kitchen still means home to everyone who grew up in that house.\n\n' +
      'The trick, she always said, is to never overmix — leave the lumps, let the batter rest while the pan heats, and flip only once. We are writing it down here so it is never lost, and so that one day these can be your Sunday mornings too.',
    notes: 'Grandma always added a little extra vanilla "for luck." We have never measured it. Serve with warm syrup and whoever you love most at the table.',
    ingredients: [
      { amount: '1½ cups', item: 'all-purpose flour' },
      { amount: '3½ tsp', item: 'baking powder' },
      { amount: '1 tbsp', item: 'sugar' },
      { amount: '¼ tsp', item: 'salt' },
      { amount: '1¼ cups', item: 'milk' },
      { amount: '1', item: 'egg, lightly beaten' },
      { amount: '3 tbsp', item: 'butter, melted' },
      { amount: '1 tsp', item: 'pure vanilla extract' },
    ],
    directions: [
      { text: 'Whisk the flour, baking powder, sugar, and salt together in a large bowl.' },
      { text: 'In a second bowl, combine the milk, egg, melted butter, and vanilla.' },
      { text: 'Pour the wet ingredients into the dry and stir just until combined — the batter should still be lumpy. Let it rest for five minutes.' },
      { text: 'Heat a lightly buttered griddle over medium heat. Pour about ¼ cup of batter per pancake.' },
      { text: 'Cook until bubbles form and the edges look set, then flip once and cook until golden.' },
      { text: 'Stack them high, add a little too much syrup, and call everyone to the table.' },
    ],
    photos: [
      { photo_path: PH.pancakes, caption: 'The first batch of the morning.' },
      { photo_path: PH.pancakes2, caption: 'Worth waking up early for.' },
    ],
  },
  {
    title: 'The Sunday Sauce',
    origin_label: "From Dad's side · Three generations in one pot",
    description: 'A slow Sunday sauce that simmers all afternoon and fills the whole house. Make it when you have nowhere to be.',
    prep_time: '20 min',
    cook_time: '4 hours',
    servings: '8',
    difficulty: 'Worth it',
    story:
      'On Dad\'s side, Sunday was never really Sunday without a pot of sauce going by ten in the morning. Great-Grandpa brought the recipe over in his head — nothing was ever written down — and every cook since has added their own small thing to it.\n\n' +
      'This is our version. It is slow on purpose. The waiting is the point.',
    notes: 'Never rush it. The longer it goes, the better it gets. Save a little to freeze — a jar of this on a hard week is a small kindness to your future self.',
    ingredients: [
      { amount: '3 tbsp', item: 'olive oil' },
      { amount: '1', item: 'large onion, finely diced' },
      { amount: '4 cloves', item: 'garlic, minced' },
      { amount: '2 cans (28 oz)', item: 'whole San Marzano tomatoes' },
      { amount: '1 small can', item: 'tomato paste' },
      { amount: '1 tsp', item: 'sugar' },
      { amount: '2 sprigs', item: 'fresh basil' },
      { amount: 'to taste', item: 'salt and cracked black pepper' },
    ],
    directions: [
      { text: 'Warm the olive oil in a heavy pot over medium-low heat. Add the onion and cook gently until soft and translucent, about 10 minutes.' },
      { text: 'Stir in the garlic and cook for one minute, just until fragrant — do not let it brown.' },
      { text: 'Add the tomato paste and cook for two minutes, stirring, to deepen the flavor.' },
      { text: 'Crush the whole tomatoes by hand into the pot. Add the sugar, basil, salt, and pepper.' },
      { text: 'Bring to a bare simmer, then lower the heat as far as it will go. Cook uncovered for 3–4 hours, stirring now and then.' },
      { text: 'Taste, adjust the salt, and serve over whatever pasta you love.' },
    ],
    photos: [
      { photo_path: PH.sauce, caption: 'Ten in the morning, right on schedule.' },
      { photo_path: PH.sauce2, caption: 'The waiting is the point.' },
    ],
  },
  {
    title: 'Your First Birthday Cake',
    origin_label: 'A new tradition · Made the night before your party',
    description: 'A simple vanilla layer cake with soft buttercream — the one we made the night before your very first birthday.',
    prep_time: '30 min',
    cook_time: '30 min',
    servings: '12',
    difficulty: 'Medium',
    story:
      'We stayed up late the night before your party, frosting this cake at the kitchen counter and laughing about how none of it had to be perfect. You were asleep down the hall. The candle was waiting in the drawer.\n\n' +
      'You wore most of your slice rather than ate it. It was, by every measure that matters, a complete success.',
    notes: 'Double the buttercream if you want tall, dramatic layers. A pinch of salt in the frosting keeps it from being too sweet.',
    ingredients: [
      { amount: '2½ cups', item: 'cake flour' },
      { amount: '2½ tsp', item: 'baking powder' },
      { amount: '1 cup', item: 'unsalted butter, softened' },
      { amount: '1¾ cups', item: 'sugar' },
      { amount: '4', item: 'large eggs, room temperature' },
      { amount: '1 cup', item: 'whole milk' },
      { amount: '1 tbsp', item: 'pure vanilla extract' },
      { amount: '1 batch', item: 'vanilla buttercream' },
    ],
    directions: [
      { text: 'Heat the oven to 350°F. Butter and line two 8-inch round pans.' },
      { text: 'Whisk the cake flour and baking powder together; set aside.' },
      { text: 'Beat the butter and sugar until pale and fluffy, about 4 minutes. Add the eggs one at a time, then the vanilla.' },
      { text: 'Add the flour mixture in three additions, alternating with the milk, beginning and ending with flour.' },
      { text: 'Divide between the pans and bake 28–32 minutes, until a toothpick comes out clean. Cool completely.' },
      { text: 'Frost between the layers and all over the top. Find the candle. Take the picture.' },
    ],
    photos: [
      { photo_path: PH.cake, caption: 'Frosted at the counter, well past bedtime.' },
      { photo_path: PH.cake2, caption: 'One candle, waiting in the drawer.' },
    ],
  },
  {
    title: 'Holiday Spice Cookies',
    origin_label: 'For the cookie tin · Every December, without fail',
    description: 'Soft, spiced, and rolled in sugar — the cookies that fill the house every December.',
    prep_time: '25 min',
    cook_time: '12 min',
    servings: '36 cookies',
    difficulty: 'Easy',
    story:
      'These come out the first cold week of December and do not stop until the tin is empty. There is always one batch that mysteriously disappears before anyone is allowed to have one.\n\n' +
      'We make them together now, flour everywhere, the radio on. We hope you will want to keep doing it.',
    notes: 'Roll them in sugar twice — once before baking, once while still warm. Trust us.',
    ingredients: [
      { amount: '2¼ cups', item: 'all-purpose flour' },
      { amount: '2 tsp', item: 'ground cinnamon' },
      { amount: '1 tsp', item: 'ground ginger' },
      { amount: '½ tsp', item: 'ground cloves' },
      { amount: '1 cup', item: 'butter, softened' },
      { amount: '1¼ cups', item: 'brown sugar, packed' },
      { amount: '1', item: 'egg' },
      { amount: '¼ cup', item: 'molasses' },
      { amount: '½ cup', item: 'coarse sugar, for rolling' },
    ],
    directions: [
      { text: 'Whisk the flour, cinnamon, ginger, and cloves together in a bowl.' },
      { text: 'Cream the butter and brown sugar until fluffy. Beat in the egg and molasses.' },
      { text: 'Add the dry ingredients and mix just until a soft dough forms. Chill for 30 minutes.' },
      { text: 'Heat the oven to 350°F. Roll the dough into balls and roll each in coarse sugar.' },
      { text: 'Bake 10–12 minutes, until the tops crackle. Roll the warm cookies in sugar once more.' },
      { text: 'Cool on the pan a few minutes, then move to a rack — if they make it that far.' },
    ],
    photos: [
      { photo_path: PH.cookies, caption: 'The first cold week of December.' },
      { photo_path: PH.cookies2, caption: 'Flour everywhere, the radio on.' },
    ],
  },
];

// ── Celebrations ────────────────────────────────────────────────────────────
const YEAR_ONE = 'Your First Year';
const YEAR_TWO = 'Your Second Year';

const CELEBRATIONS = [
  {
    year_label: YEAR_ONE,
    title: 'Your First Holiday Season',
    eyebrow: 'December 25 · Home with everyone',
    celebration_date: '2025-12-25',
    location: "Home, with the whole crowd",
    attendees: 'Mom, Dad, Grandma Ruth, Grandpa Joe, Aunt Sarah, Uncle Mike, and a great many cousins',
    gifts: 'A handmade quilt of yellow stars\nWooden alphabet blocks\nYour first cloth book\nA silver spoon engraved with the date\nA stocking with your name stitched on it',
    body:
      'Your first holiday season was a quiet, bright one — your first time meeting your great-grandparents, your first time near a tree taller than the ceiling, and the first morning the whole house woke up early just to watch your face.\n\n' +
      'You pointed at the lights and said something that was almost a word. We have decided to believe you made it up just for the moment. The afternoon was leftovers and a puzzle nobody finished, and you asleep in Grandpa\'s arms while he hummed something none of us recognized.',
    photos: [
      { photo_path: PH.christmas, caption: 'The morning the whole house woke up early.' },
      { photo_path: PH.christmasG1, caption: 'You pointed at the lights and almost said a word.' },
      { photo_path: PH.christmasG2, caption: 'Asleep in Grandpa\'s arms by the afternoon.' },
    ],
  },
  {
    year_label: YEAR_ONE,
    title: 'A Spring Morning Outside',
    eyebrow: 'April · Your first warm day',
    celebration_date: '2026-04-12',
    location: 'The backyard, under the big tree',
    attendees: 'Mom, Dad, and you',
    gifts: '',
    body:
      'The first truly warm morning of the year, we put a blanket down under the tree and just let the day be slow. You found a single dandelion and studied it like it was the most serious thing in the world.\n\n' +
      'Nothing happened, and it was one of our favorite days.',
    photos: [
      { photo_path: PH.spring, caption: 'A blanket under the tree, nowhere to be.' },
      { photo_path: PH.springG1, caption: 'One dandelion, studied very seriously.' },
    ],
  },
  {
    year_label: YEAR_ONE,
    title: 'A Tradition We Started For You',
    eyebrow: 'Sunday evenings',
    celebration_date: '',
    location: 'The kitchen table',
    attendees: 'Whoever is home',
    gifts: '',
    body:
      'Every Sunday evening we light a candle at dinner and each say one good thing from the week. We started it the month you were born, and we mean to keep it going.\n\n' +
      'You are too small to say your good thing yet. For now, you are everyone else\'s.',
    photos: [],
  },
  {
    year_label: YEAR_TWO,
    title: 'Your First Birthday',
    eyebrow: 'One whole year',
    celebration_date: '2026-09-14',
    location: 'The backyard, balloons and all',
    attendees: 'Family, friends, and a cake you mostly wore',
    gifts: 'A wooden push-walker\nA stack of board books\nA tiny pair of boots\nA garden flower planted in your name',
    body:
      'One whole year. We blinked and you went from a bundle we were afraid to hold wrong to a person with opinions and a laugh we would do anything to hear.\n\n' +
      'You wore most of your cake rather than ate it. You waved at everyone. You fell asleep before the last guest left, and we stood in the quiet kitchen and could not believe our luck.',
    photos: [
      { photo_path: PH.birthday1, caption: 'One whole year.' },
      { photo_path: PH.birthday1G1, caption: 'Most of the cake ended up on you.' },
    ],
  },
  {
    year_label: YEAR_TWO,
    title: 'The Day You Walked',
    eyebrow: 'A Tuesday, of all days',
    celebration_date: '2026-10-03',
    location: 'The living room',
    attendees: 'Mom and Dad (and a very surprised dog)',
    gifts: '',
    body:
      'It was an ordinary Tuesday. You let go of the couch, took three wobbling steps toward the coffee table, and looked up at us like you had just discovered something nobody else knew about.\n\n' +
      'We both saw it. We are very glad we both saw it.',
    photos: [
      { photo_path: PH.firstSteps, caption: 'Three wobbling steps toward the coffee table.' },
      { photo_path: PH.firstStepsG1, caption: 'The look of someone who just discovered something.' },
    ],
  },
];

async function main() {
  // ── SCOPE GUARD ────────────────────────────────────────────────────────────
  const { data: fam, error: famErr } = await supabaseAdmin
    .from('families')
    .select('id, custom_domain, is_active')
    .eq('custom_domain', DEMO_DOMAIN)
    .single();
  if (famErr || !fam) {
    throw new Error(`Could not find demo family for ${DEMO_DOMAIN}: ${famErr && famErr.message}`);
  }
  const { data: book, error: bookErr } = await supabaseAdmin
    .from('books')
    .select('id, family_id')
    .eq('family_id', fam.id)
    .single();
  if (bookErr || !book) throw new Error(`Could not find demo book: ${bookErr && bookErr.message}`);
  if (book.id !== EXPECTED_BOOK_ID) {
    throw new Error(`SAFETY ABORT: resolved book id ${book.id} != expected ${EXPECTED_BOOK_ID}. Refusing to write.`);
  }
  const BOOK_ID = book.id;
  console.log(`Scope confirmed: ${DEMO_DOMAIN} -> family ${fam.id} -> book ${BOOK_ID}`);

  // ── RECIPES ────────────────────────────────────────────────────────────────
  // Delete photo rows for this book's recipes, then the recipes, then re-insert.
  const { data: oldRecipes } = await supabaseAdmin.from('recipes').select('id').eq('book_id', BOOK_ID);
  const oldRecipeIds = (oldRecipes || []).map((r) => r.id);
  if (oldRecipeIds.length) {
    await supabaseAdmin.from('recipe_photos').delete().in('recipe_id', oldRecipeIds);
  }
  await supabaseAdmin.from('recipes').delete().eq('book_id', BOOK_ID);

  for (let i = 0; i < RECIPES.length; i++) {
    const { photos, ...rec } = RECIPES[i];
    const { data: inserted, error } = await supabaseAdmin
      .from('recipes')
      .insert({ book_id: BOOK_ID, sort_order: i, ...rec })
      .select('id')
      .single();
    if (error) throw new Error(`recipe insert failed (${rec.title}): ${error.message}`);
    if (photos && photos.length) {
      const rows = photos.map((p, j) => ({ recipe_id: inserted.id, photo_path: p.photo_path, caption: p.caption || '', sort_order: j }));
      const { error: pErr } = await supabaseAdmin.from('recipe_photos').insert(rows);
      if (pErr) throw new Error(`recipe_photos insert failed (${rec.title}): ${pErr.message}`);
    }
    console.log(`  recipe seeded: ${rec.title} (${(photos || []).length} photos)`);
  }

  // ── CELEBRATIONS ─────────────────────────────────────────────────────────
  const { data: oldCelebs } = await supabaseAdmin.from('celebrations').select('id').eq('book_id', BOOK_ID);
  const oldCelebIds = (oldCelebs || []).map((c) => c.id);
  if (oldCelebIds.length) {
    await supabaseAdmin.from('celebration_photos').delete().in('celebration_id', oldCelebIds);
  }
  await supabaseAdmin.from('celebrations').delete().eq('book_id', BOOK_ID);

  for (let i = 0; i < CELEBRATIONS.length; i++) {
    const { photos, ...cel } = CELEBRATIONS[i];
    const row = { book_id: BOOK_ID, sort_order: i, ...cel };
    if (row.celebration_date === '') row.celebration_date = null;
    const { data: inserted, error } = await supabaseAdmin
      .from('celebrations')
      .insert(row)
      .select('id')
      .single();
    if (error) throw new Error(`celebration insert failed (${cel.title}): ${error.message}`);
    if (photos && photos.length) {
      const rows = photos.map((p, j) => ({ celebration_id: inserted.id, photo_path: p.photo_path, caption: p.caption || '', sort_order: j }));
      const { error: pErr } = await supabaseAdmin.from('celebration_photos').insert(rows);
      if (pErr) throw new Error(`celebration_photos insert failed (${cel.title}): ${pErr.message}`);
    }
    console.log(`  celebration seeded: ${cel.title} [${cel.year_label}] (${(photos || []).length} photos)`);
  }

  // ── BOOK FIELDS: years + force sections visible ────────────────────────────
  const { data: curBook } = await supabaseAdmin
    .from('books').select('visible_sections').eq('id', BOOK_ID).single();
  const vis = Object.assign({}, curBook && curBook.visible_sections, { recipes: true, holidays: true });
  const { error: upErr } = await supabaseAdmin
    .from('books')
    .update({ celebration_years: [YEAR_ONE, YEAR_TWO], visible_sections: vis })
    .eq('id', BOOK_ID);
  if (upErr) throw new Error(`book update failed: ${upErr.message}`);
  console.log(`  book updated: celebration_years=[${YEAR_ONE}, ${YEAR_TWO}], visible_sections.recipes/holidays=true`);

  console.log('\nDone. Demo recipes + celebrations seeded and scoped to the demo book only.');
}

main().catch((e) => { console.error('\nSEED FAILED:', e.message); process.exit(1); });
