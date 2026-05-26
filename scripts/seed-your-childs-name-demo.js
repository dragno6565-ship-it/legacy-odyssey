/**
 * seed-your-childs-name-demo.js
 * -----------------------------
 * Creates (if needed) and fully seeds the PUBLIC SALES DEMO book that renders
 * through the shared book viewer at https://your-childs-name.com.
 *
 * This is the company's #1 sales asset. It must look amazing and complete, so
 * this script populates EVERY major section with warm, premium, generic content
 * and beautiful photos.
 *
 * SCOPE GUARD (read this before running):
 *   • The script resolves the family by custom_domain = 'your-childs-name.com'.
 *   • If that family/book does not exist yet, it CREATES it (via
 *     bookService.createBookWithDefaults) — this is the one and only book this
 *     script will ever write to.
 *   • Once resolved/created, the resolved book id is locked in. Every single
 *     insert/update/delete below is scoped to that book_id (and the child rows
 *     that belong to it). There is NO path in this script that can write to any
 *     other book.
 *   • As a belt-and-suspenders guard, if EXPECTED_BOOK_ID is set (after the
 *     first run, paste the printed id here) the script ABORTS if the resolved
 *     book id ever differs.
 *
 * DATA ONLY — no DDL. All writes go through the Supabase service-role client,
 * which works fine for inserts/updates/deletes.
 *
 * Names are GENERIC stand-ins only (child "Sophia Rose"; "Mom & Dad",
 * "Grandma Ruth", "Grandpa Joe", etc.). No banned words ("forever", "chapter",
 * "family book"/"family's story").
 *
 * Photos are remote Unsplash URLs stored directly in photo_path columns
 * (getPublicUrl returns http(s) URLs as-is). Every URL is validated to return
 * 200 before the script proceeds — a 404 aborts the run with the offending URL.
 *
 * Re-running is safe and idempotent: it clears this demo book's section rows
 * (and their photo children) and re-inserts the canonical set below.
 *
 * Usage:  node scripts/seed-your-childs-name-demo.js
 */
require('dotenv').config();
const https = require('https');
const { supabaseAdmin } = require('../src/config/supabase');
const bookService = require('../src/services/bookService');

const DEMO_DOMAIN = 'your-childs-name.com';
const SUBDOMAIN = 'your-childs-name';
// After the first run prints the book id, you may paste it here to enable the
// extra abort-on-mismatch guard. Leave null on the very first run (the family
// doesn't exist yet, so there's nothing to match against).
const EXPECTED_BOOK_ID = '79ea410f-90ec-45d3-b574-d018a9c008f3';

// ── Photo URLs (remote Unsplash; rendered as-is via getPublicUrl) ────────────
const PH = {
  // hero / welcome
  hero: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=1400&h=1600&fit=crop&auto=format&q=85',

  // before you arrived
  pregnancy: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1000&h=1000&fit=crop&auto=format&q=80',
  nursery: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=1000&h=1000&fit=crop&auto=format&q=80',
  shower: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1000&h=1000&fit=crop&auto=format&q=80',
  ultrasound: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1000&h=1000&fit=crop&auto=format&q=80',

  // birth story
  birthMom: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1000&h=1200&fit=crop&auto=format&q=80',
  birthDad: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1000&h=1200&fit=crop&auto=format&q=80',

  // coming home
  rideHome: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1000&h=1000&fit=crop&auto=format&q=80',
  firstNight: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=1000&h=1000&fit=crop&auto=format&q=80',
  meeting: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1000&h=1000&fit=crop&auto=format&q=80',
  weekOne: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=1000&h=1000&fit=crop&auto=format&q=80',

  // months (12)
  m1: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=900&h=900&fit=crop&auto=format&q=80',
  m2: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=900&h=900&fit=crop&auto=format&q=80',
  m3: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=900&h=900&fit=crop&auto=format&q=80',
  m4: 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=900&h=900&fit=crop&auto=format&q=80',
  m5: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=900&h=900&fit=crop&auto=format&q=80',
  m6: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=900&h=900&fit=crop&auto=format&q=80',
  m7: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=900&h=900&fit=crop&auto=format&q=80',
  m8: 'https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=900&h=900&fit=crop&auto=format&q=80',
  m9: 'https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=900&h=900&fit=crop&auto=format&q=80',
  m10: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=900&h=900&fit=crop&auto=format&q=80',
  m11: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=900&h=900&fit=crop&auto=format&q=80',
  m12: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900&h=900&fit=crop&auto=format&q=80',

  // family
  mom: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&h=1100&fit=crop&auto=format&q=80',
  dad: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=1100&fit=crop&auto=format&q=80',
  grandma: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=900&h=1100&fit=crop&auto=format&q=80',
  grandpa: 'https://images.unsplash.com/photo-1559963110-71b394e7494d?w=900&h=1100&fit=crop&auto=format&q=80',
  momAlbum1: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800&h=800&fit=crop&auto=format&q=80',
  momAlbum2: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=800&h=800&fit=crop&auto=format&q=80',
  dadAlbum1: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=800&fit=crop&auto=format&q=80',
  grandmaAlbum1: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=800&h=800&fit=crop&auto=format&q=80',
  grandpaAlbum1: 'https://images.unsplash.com/photo-1533483595632-c5f0e57a1936?w=800&h=800&fit=crop&auto=format&q=80',

  // celebrations
  christmas: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=1600&h=800&fit=crop&auto=format&q=85',
  christmasG1: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=700&h=875&fit=crop&auto=format&q=80',
  christmasG2: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=700&h=875&fit=crop&auto=format&q=80',
  spring: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&h=800&fit=crop&auto=format&q=85',
  springG1: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=700&h=875&fit=crop&auto=format&q=80',
  birthday1: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=1600&h=800&fit=crop&auto=format&q=85',
  birthday1G1: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&h=875&fit=crop&auto=format&q=80',
  firstSteps: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1600&h=800&fit=crop&auto=format&q=85',
  firstStepsG1: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=700&h=875&fit=crop&auto=format&q=80',

  // recipes
  pancakes: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&h=900&fit=crop&auto=format&q=80',
  pancakes2: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=900&h=900&fit=crop&auto=format&q=80',
  sauce: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&h=900&fit=crop&auto=format&q=80',
  sauce2: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&h=900&fit=crop&auto=format&q=80',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=900&fit=crop&auto=format&q=80',
  cake2: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900&h=900&fit=crop&auto=format&q=80',
  cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&h=900&fit=crop&auto=format&q=80',
  cookies2: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=900&h=900&fit=crop&auto=format&q=80',

  // journey
  journey1: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=1000&fit=crop&auto=format&q=80',
  journey2: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&h=1000&fit=crop&auto=format&q=80',
};

// ─────────────────────────────────────────────────────────────────────────────
// Section content
// ─────────────────────────────────────────────────────────────────────────────

const BOOK_FIELDS = {
  child_first_name: 'Sophia',
  child_middle_name: 'Rose',
  child_last_name: 'Bennett',
  birth_date: '2025-04-18',
  birth_time: '6:42 AM',
  birth_weight_lbs: 7,
  birth_weight_oz: 9,
  birth_length_inches: 20,
  birth_city: 'Portland',
  birth_state: 'Oregon',
  birth_hospital: 'Riverside General Hospital',
  name_meaning: 'Sophia means "wisdom"; Rose for the garden where we read the news that you were on your way.',
  name_quote: 'Wisdom, and a garden in bloom — chosen with love, meaning, and intention.',
  hero_image_path: PH.hero,
  parent_quote: 'From the moment we first saw your face, our whole world rearranged itself around you. This is your story — every moment, every milestone, every memory — written just for you.',
  parent_quote_attribution: 'Mom & Dad',
  vault_unlock_date: '2043-04-18',
  celebration_years: ['Your First Year', 'Your Second Year'],
  welcome_fields: { born: true, time: true, weight: true, length: true, birthplace: true, hospital: true },
  visible_sections: {
    before: true, birth: true, journey: true, home: true, months: true,
    family: true, firsts: true, holidays: true, letters: true, recipes: true,
    keepsakes: true, vault: true,
  },
};

const BEFORE_CARDS = [
  {
    title: 'THE PREGNANCY', subtitle: 'The Moment We Found Out', photo_path: PH.pregnancy,
    body: 'We found out on a rainy Tuesday in August. Mom read the test three times just to be sure, then sat on the bathroom floor and laughed and cried at the same time. We told no one for two whole weeks — it was the best secret we have ever kept.',
  },
  {
    title: 'THE NURSERY', subtitle: 'Preparing Your Room', photo_path: PH.nursery,
    body: 'Your dad painted your room a soft sage green over a long weekend, then repainted it twice because the first two greens were "not the right green." We hung a mobile of paper stars and stood in the doorway imagining you here. We could not wait.',
  },
  {
    title: 'THE BABY SHOWER', subtitle: 'The Afternoon Everyone Came', photo_path: PH.shower,
    body: 'Everyone we love crowded into Grandma Ruth\'s living room with lemonade and too much cake. There were tiny socks and a hand-knit blanket and a card from every person who already loved you. The whole room was waiting for you.',
  },
  {
    title: 'FIRST LOOK', subtitle: 'The First Ultrasound', photo_path: PH.ultrasound,
    body: 'A grainy little photo and a heartbeat like a galloping horse. We kept the printout on the refrigerator and looked at it every single morning. That was the first time you were really, truly real to us.',
  },
];

const CHECKLIST = [
  { label: 'Painted the nursery', is_checked: true },
  { label: 'Assembled the crib', is_checked: true },
  { label: 'Packed the hospital bag', is_checked: true },
  { label: 'Installed the car seat', is_checked: true },
  { label: 'Chose your name', is_checked: true },
  { label: 'Washed all the tiny clothes', is_checked: true },
  { label: 'Stocked the freezer', is_checked: true },
  { label: 'Waited (the hardest one)', is_checked: true },
];

const BIRTH_STORY = {
  first_held_by: 'Mom',
  person1_label: 'Mom',
  person2_label: 'Dad',
  mom_title: '"The moment I heard you cry, the whole world went quiet."',
  mom_narrative:
    'Labor started just after midnight, soft at first, then not soft at all. Your dad timed everything on his phone and pretended to be calm. By the time the sky started getting light, you were almost here.\n\n' +
    'And then — one long, furious cry, and they laid you on my chest, and every single thing I had been afraid of just dissolved. You were warm and impossibly small and entirely ours. I would do all of it again ten times over for that one minute.',
  mom_photo_1: PH.birthMom,
  dad_title: '"I was completely unprepared for how much I would love you."',
  dad_narrative:
    'I thought I understood what was coming. I had read the books. I had practiced the breathing with your mom in the living room and felt very prepared.\n\n' +
    'I was not prepared. The second I saw your face I forgot every fact I had ever learned. I just stood there holding your tiny hand between two of my fingers, completely undone, promising you quietly that I would always show up. I still mean it.',
  dad_photo_1: PH.birthDad,
};

const COMING_HOME_CARDS = [
  {
    title: 'THE RIDE HOME', subtitle: 'The First Car Ride', photo_path: PH.rideHome,
    body: 'Your dad drove twelve miles an hour the whole way home and apologized to every pothole. You slept through all of it, perfectly unbothered, while we both kept turning around to make sure you were still breathing.',
  },
  {
    title: 'FIRST NIGHT', subtitle: 'The First Night Home', photo_path: PH.firstNight,
    body: 'We did not sleep at all. We took turns just watching you in the little bassinet beside the bed. It was the most tired and the most awake we have ever been at the same time.',
  },
  {
    title: 'MEETING EVERYONE', subtitle: 'Meeting the Family', photo_path: PH.meeting,
    body: 'Grandma Ruth cried before she even got through the door. Grandpa Joe held you like you were made of spun glass. By the end of the week you had been passed gently around every set of arms that loves you.',
  },
  {
    title: 'WEEK ONE', subtitle: 'The First Week Home', photo_path: PH.weekOne,
    body: 'A blur of feedings and tiny socks and the dishwasher we never quite got around to running. We learned your cries, your faces, the particular weight of you asleep on a shoulder. We were figuring it out, together, all three of us.',
  },
];

const MONTHS = [
  { month_number: 1, label: 'One Month Old', highlight: 'First real eye contact', weight: '9 lbs 2 oz', length: '21 in', photo_path: PH.m1, note: 'You started really looking at us this month — long, serious stares like you were taking notes. We could watch you all day, and most days we did.' },
  { month_number: 2, label: 'Two Months Old', highlight: 'First social smile', weight: '10 lbs 8 oz', length: '22 in', photo_path: PH.m2, note: 'The first time you smiled at us on purpose, your dad nearly dropped his coffee. We have spent every day since trying to make it happen again.' },
  { month_number: 3, label: 'Three Months Old', highlight: 'First belly laugh', weight: '12 lbs', length: '23.5 in', photo_path: PH.m3, note: 'A real laugh, out of nowhere, at the dog sneezing. The best sound either of us has ever heard.' },
  { month_number: 4, label: 'Four Months Old', highlight: 'Rolling over', weight: '13 lbs 4 oz', length: '24.5 in', photo_path: PH.m4, note: 'You rolled from your back to your belly and then looked extremely surprised about it. Tummy time finally has a fan.' },
  { month_number: 5, label: 'Five Months Old', highlight: 'Grabbing everything', weight: '14 lbs 6 oz', length: '25.5 in', photo_path: PH.m5, note: 'Nothing within arm\'s reach was safe this month. Glasses, hair, the cat\'s tail — all fair game.' },
  { month_number: 6, label: 'Six Months Old', highlight: 'First taste of food', weight: '15 lbs 8 oz', length: '26 in', photo_path: PH.m6, note: 'Mashed banana. You made the most betrayed face we have ever seen, then immediately asked for more.' },
  { month_number: 7, label: 'Seven Months Old', highlight: 'Sitting up on your own', weight: '16 lbs 10 oz', length: '26.5 in', photo_path: PH.m7, note: 'You figured out how to sit unassisted and used it mostly to survey your kingdom of toys with great seriousness.' },
  { month_number: 8, label: 'Eight Months Old', highlight: 'Started crawling', weight: '17 lbs 8 oz', length: '27 in', photo_path: PH.m8, note: 'Backwards first, for a confusing week, and then forward — straight for every electrical outlet in the house.' },
  { month_number: 9, label: 'Nine Months Old', highlight: 'Pulling up to stand', weight: '18 lbs 4 oz', length: '27.5 in', photo_path: PH.m9, note: 'You discovered you could pull yourself up on the couch, and the whole world got taller and much more interesting.' },
  { month_number: 10, label: 'Ten Months Old', highlight: 'First word: "dada"', weight: '19 lbs', length: '28 in', photo_path: PH.m10, note: '"Dada," clear as a bell, at breakfast. Your dad has not stopped bringing it up since.' },
  { month_number: 11, label: 'Eleven Months Old', highlight: 'Cruising the furniture', weight: '19 lbs 10 oz', length: '28.5 in', photo_path: PH.m11, note: 'You traveled the entire living room without ever touching the floor, gripping every coffee table edge like a tiny mountaineer.' },
  { month_number: 12, label: 'Twelve Months Old', highlight: 'Happy first birthday!', weight: '20 lbs 4 oz', length: '29 in', photo_path: PH.m12, note: 'One whole year. We blinked and you went from a sleepy newborn to a person with opinions, a wave, and a laugh we would do anything for.' },
];

const FAMILY_MEMBERS = [
  {
    member_key: 'mom', name: 'Mom', relation: 'Mother', emoji: '👩', sort_order: 0, photo_path: PH.mom,
    meta_1_label: 'From', meta_1_value: 'Portland, Oregon',
    meta_2_label: 'Loves', meta_2_value: 'Long walks, strong coffee, you',
    meta_3_label: 'Known for', meta_3_value: 'The best hugs in the family',
    story: 'Your mom is the calm at the center of everything. She is the one who remembers every appointment, sings off-key on purpose to make you laugh, and somehow always knows exactly what you need before you do.',
    story2: 'She wanted to be your mom for a very long time before you arrived. Now that you are here, she says she finally understands what everyone meant — that the love just keeps getting bigger, with no end in sight.',
    quote_text: 'I didn\'t know my heart could hold this much. And then it just kept growing.',
    quote_cite: 'Mom, the week you came home',
    album_1_path: PH.momAlbum1, album_1_caption: 'A quiet morning, just the two of you.',
    album_2_path: PH.momAlbum2, album_2_caption: 'Reading your favorite book for the hundredth time.',
  },
  {
    member_key: 'dad', name: 'Dad', relation: 'Father', emoji: '👨', sort_order: 1, photo_path: PH.dad,
    meta_1_label: 'From', meta_1_value: 'Boise, Idaho',
    meta_2_label: 'Loves', meta_2_value: 'Bad puns, the outdoors, you',
    meta_3_label: 'Known for', meta_3_value: 'Making everyone laugh',
    story: 'Your dad is the one who will get down on the floor and stay there for an hour, building towers just to watch you knock them down. He is patient in a way that surprises even him, and he is endlessly, hopelessly proud of you.',
    story2: 'He keeps a list on his phone of every funny thing you do. It is already very long. He says he is saving it all up to embarrass you at your wedding one day.',
    quote_text: 'Being your dad is the best job I will ever have.',
    quote_cite: 'Dad',
    album_1_path: PH.dadAlbum1, album_1_caption: 'Your first big adventure outside.',
  },
  {
    member_key: 'grandma-maternal', name: 'Grandma Ruth', relation: 'Grandmother', emoji: '👵', sort_order: 2, photo_path: PH.grandma,
    meta_1_label: 'From', meta_1_value: 'A little town by the sea',
    meta_2_label: 'Famous for', meta_2_value: 'Sunday pancakes',
    story: 'Grandma Ruth has been waiting for you her whole life. She knit the blanket you came home in and cried happy tears the first time she held you. Her house smells like cinnamon and her hugs last exactly as long as you need them to.',
    quote_text: 'I have loved you since before I met you.',
    quote_cite: 'Grandma Ruth',
    album_1_path: PH.grandmaAlbum1, album_1_caption: 'The first time she held you.',
  },
  {
    member_key: 'grandpa-maternal', name: 'Grandpa Joe', relation: 'Grandfather', emoji: '👴', sort_order: 3, photo_path: PH.grandpa,
    meta_1_label: 'From', meta_1_value: 'The farm out east',
    meta_2_label: 'Famous for', meta_2_value: 'Tall tales and bear hugs',
    story: 'Grandpa Joe holds you like you are the most precious thing in the world, because to him you are. He hums old songs none of us recognize and promises to teach you how to fish the moment you can hold a rod. He cannot wait.',
    quote_text: 'You are going to do great things, little one. I just know it.',
    quote_cite: 'Grandpa Joe',
    album_1_path: PH.grandpaAlbum1, album_1_caption: 'Asleep in his arms after lunch.',
  },
];

const FIRSTS = [
  { sort_order: 0, emoji: '😊', title: 'First Real Smile', date_text: 'June 12, 2025', note: 'Six weeks old, on the changing table, right at your mom. We have a blurry photo and a very clear memory.' },
  { sort_order: 1, emoji: '😂', title: 'First Belly Laugh', date_text: 'July 20, 2025', note: 'The dog sneezed and you absolutely lost it. We made the dog sneeze approximately forty more times that afternoon.' },
  { sort_order: 2, emoji: '🍼', title: 'First Solid Food', date_text: 'October 4, 2025', note: 'Mashed banana. A look of pure betrayal, followed immediately by demanding seconds.' },
  { sort_order: 3, emoji: '🦷', title: 'First Tooth', date_text: 'November 18, 2025', note: 'Bottom front, discovered by accident on your dad\'s finger. Worth all the fussy nights that came before it.' },
  { sort_order: 4, emoji: '👣', title: 'First Steps', date_text: 'April 2, 2026', note: 'Three wobbling steps from the couch to the coffee table, on an ordinary Tuesday. We both saw it. We are so glad we both saw it.' },
  { sort_order: 5, emoji: '💬', title: 'First Word', date_text: 'February 9, 2026', note: '"Dada," at breakfast, clear as anything. Your dad has been insufferable about it ever since.' },
  { sort_order: 6, emoji: '🛁', title: 'First Bath', date_text: 'April 25, 2025', note: 'You were skeptical for exactly thirty seconds, then decided splashing was the greatest invention of all time.' },
  { sort_order: 7, emoji: '✈️', title: 'First Trip', date_text: 'August 16, 2025', note: 'A weekend at the coast. You slept through the ocean entirely but loved the sand between your toes.' },
];

const LETTERS = [
  {
    sort_order: 0, from_label: 'From Mom', occasion: 'Written on Your Birth Day', salutation: 'My darling Sophia,',
    body:
      'You are four hours old as I write this, asleep on my chest, and I already cannot remember what life was like before you.\n\n' +
      'I want you to know that you were wanted. So deeply, so completely wanted. Whatever else happens in your life, however far you go, you began as the most hoped-for wish of two people who love you beyond anything words can hold.\n\n' +
      'Be brave. Be kind. Come home whenever you need to. I will always be right here.',
    signature: 'All my love,\nMom',
  },
  {
    sort_order: 1, from_label: 'From Dad', occasion: 'The Night You Were Born', salutation: 'Dear little one,',
    body:
      'It is late, and you and your mom are finally asleep, and I am sitting here in the quiet trying to find words big enough for today. There aren\'t any. So I will just tell you the true things.\n\n' +
      'I will show up. I will be there for the small days and the big ones. I will teach you everything I know and learn right alongside you for everything I don\'t. And I will love you exactly as you are, always.\n\n' +
      'Welcome to the world, kiddo. We\'ve been waiting for you.',
    signature: 'Love,\nDad',
  },
  {
    sort_order: 2, from_label: 'From Grandma Ruth', occasion: 'When I First Held You', salutation: 'My precious grandchild,',
    body:
      'I have loved you since before I ever met you. Today I finally got to hold you, and you wrapped your whole hand around just one of my fingers, and that was that — I was yours.\n\n' +
      'When you are older, come find me. I will teach you to make the Sunday pancakes, and I will tell you all the stories about your mom that she would rather I didn\'t.\n\n' +
      'You are so loved, little one. More than you will ever know.',
    signature: 'With all my heart,\nGrandma Ruth',
  },
];

const CELEBRATIONS = [
  {
    year_label: 'Your First Year', title: 'Your First Holiday Season', eyebrow: 'December 25 · Home with everyone',
    celebration_date: '2025-12-25', location: 'Home, with the whole crowd',
    attendees: 'Mom, Dad, Grandma Ruth, Grandpa Joe, Aunt Sarah, Uncle Mike, and a great many cousins',
    gifts: 'A handmade quilt of yellow stars\nWooden alphabet blocks\nYour first cloth book\nA silver spoon engraved with the date\nA stocking with your name stitched on it',
    body:
      'Your first holiday season was a quiet, bright one — your first time meeting your great-grandparents, your first time near a tree taller than the ceiling, and the first morning the whole house woke up early just to watch your face.\n\n' +
      'You pointed at the lights and said something that was almost a word. We have decided to believe you made it up just for the moment. The afternoon was leftovers and a puzzle nobody finished, and you asleep in Grandpa Joe\'s arms while he hummed something none of us recognized.',
    photos: [
      { photo_path: PH.christmas, caption: 'The morning the whole house woke up early.' },
      { photo_path: PH.christmasG1, caption: 'You pointed at the lights and almost said a word.' },
      { photo_path: PH.christmasG2, caption: 'Asleep in Grandpa Joe\'s arms by the afternoon.' },
    ],
  },
  {
    year_label: 'Your First Year', title: 'A Spring Morning Outside', eyebrow: 'April · Your first warm day',
    celebration_date: '2025-04-26', location: 'The backyard, under the big tree',
    attendees: 'Mom, Dad, and you', gifts: '',
    body:
      'The first truly warm morning of the year, we put a blanket down under the tree and just let the day be slow. You found a single dandelion and studied it like it was the most serious thing in the world.\n\n' +
      'Nothing happened, and it was one of our favorite days.',
    photos: [
      { photo_path: PH.spring, caption: 'A blanket under the tree, nowhere to be.' },
      { photo_path: PH.springG1, caption: 'One dandelion, studied very seriously.' },
    ],
  },
  {
    year_label: 'Your First Year', title: 'A Tradition We Started For You', eyebrow: 'Sunday evenings',
    celebration_date: '', location: 'The kitchen table', attendees: 'Whoever is home', gifts: '',
    body:
      'Every Sunday evening we light a candle at dinner and each say one good thing from the week. We started it the month you were born, and we mean to keep it going.\n\n' +
      'You are too small to say your good thing yet. For now, you are everyone else\'s.',
    photos: [],
  },
  {
    year_label: 'Your Second Year', title: 'Your First Birthday', eyebrow: 'One whole year',
    celebration_date: '2026-04-18', location: 'The backyard, balloons and all',
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
    year_label: 'Your Second Year', title: 'The Day You Walked', eyebrow: 'A Tuesday, of all days',
    celebration_date: '2026-04-02', location: 'The living room',
    attendees: 'Mom and Dad (and a very surprised dog)', gifts: '',
    body:
      'It was an ordinary Tuesday. You let go of the couch, took three wobbling steps toward the coffee table, and looked up at us like you had just discovered something nobody else knew about.\n\n' +
      'We both saw it. We are very glad we both saw it.',
    photos: [
      { photo_path: PH.firstSteps, caption: 'Three wobbling steps toward the coffee table.' },
      { photo_path: PH.firstStepsG1, caption: 'The look of someone who just discovered something.' },
    ],
  },
];

const RECIPES = [
  {
    title: 'Sunday Morning Pancakes',
    origin_label: 'From Grandma Ruth · The recipe that started every weekend',
    description: 'Light, golden, and just a little sweet — the pancakes that mean the weekend has finally begun.',
    prep_time: '10 min', cook_time: '15 min', servings: '4', difficulty: 'Easy',
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
    prep_time: '20 min', cook_time: '4 hours', servings: '8', difficulty: 'Worth it',
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
    prep_time: '30 min', cook_time: '30 min', servings: '12', difficulty: 'Medium',
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
    prep_time: '25 min', cook_time: '12 min', servings: '36 cookies', difficulty: 'Easy',
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

const JOURNEY = {
  title: 'Your Journey to Us',
  intro: 'Every family begins somewhere. This is where ours found its way to you.',
  story_title: 'How you came home',
  story:
    'Our story did not follow a straight line, and we would not change a single turn of it, because every one of them led to you.\n\n' +
    'There were years of hoping, a season of waiting that tested us, and then one ordinary phone call that split our lives cleanly into before and after. We drove through the night. We met you in the morning. And the moment we held you, the long road behind us went quiet, and all that was left was you.\n\n' +
    'You did not grow under one heart. You grew inside the whole story of how badly you were wanted. That is its own kind of beginning, and it is yours.',
  milestones: [
    { label: 'The day we decided', date: '2024-06-01' },
    { label: 'The call that changed everything', date: '2025-04-16' },
    { label: 'The morning we met you', date: '2025-04-18' },
    { label: 'The day you came home', date: '2025-04-21' },
  ],
  letter_text:
    'However you came to be ours, you are ours completely. We chose you, and somehow it has always felt like you chose us right back. We will tell you this story as many times as you want to hear it, for as long as you want to hear it.',
  letter_sign: 'Mom & Dad',
  photos: [
    { photo_path: PH.journey1, caption: 'The morning we met you.' },
    { photo_path: PH.journey2, caption: 'The day you came home.' },
  ],
};

const KEEPSAKES = [
  {
    title: 'Your Hospital Bracelet', category: 'memorabilia', age_text: 'Day One',
    date_made: '2025-04-18', attribution: 'From the hospital',
    description: 'The tiny paper band that first said your name out loud to the world.',
    story: 'It is impossibly small now — it would not even fit around your thumb anymore. For the first three days of your life it told everyone who you were. We will keep the photo of it right here, where it cannot get lost.',
    photos: [{ photo_path: PH.m1, caption: 'Smaller than we remembered.' }],
  },
  {
    title: 'Your First Finger Painting', category: 'artwork', age_text: 'Age 1',
    date_made: '2026-05-02', attribution: 'Made by Sophia (with a great deal of help)',
    description: 'Mostly blue, slightly on the table, technically a masterpiece.',
    story: 'You were far more interested in eating the paint than applying it, but in a brief window of cooperation you produced this. It hung on the refrigerator for a month. We took a photo so we could let the original go and still keep it.',
    photos: [{ photo_path: PH.spring, caption: 'Abstract, blue period.' }],
  },
  {
    title: 'A Lock of Your Hair', category: 'memorabilia', age_text: 'First haircut',
    date_made: '2026-04-30', attribution: 'From your first trim',
    description: 'A wisp from your very first haircut, soft as anything.',
    story: 'We could not quite bring ourselves to do a real haircut, so this is more of a single brave snip. It is tucked into an envelope with the date on it. One day it will be hard to believe your hair was ever this fine and this fair.',
    photos: [],
  },
];

const VAULT_ITEMS = [
  {
    item_type: 'letter', title: 'A Letter for When You Turn Eighteen',
    sealed_by: 'Mom & Dad',
    body: 'Sealed on the day you were born, to be opened on your 18th birthday. By then you will be taller than us and rolling your eyes at this, and we will love you exactly as much as we do right now — which is to say, completely.',
  },
  {
    item_type: 'letter', title: 'The World on the Day You Arrived',
    sealed_by: 'Mom & Dad',
    body: 'A note about what the world looked like the week you were born — the songs we played in the car, what a gallon of milk cost, the news we were and weren\'t paying attention to. Saved here for the grown-up you to find.',
  },
  {
    item_type: 'memory', title: 'Grandma Ruth\'s Recipe Box',
    sealed_by: 'Grandma Ruth',
    body: 'A photo of every handwritten recipe card in Grandma Ruth\'s box, in her own handwriting. Tucked away so that one day the kitchen can still smell like her house, long after.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function headOk(url) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
        // Unsplash sometimes 302s a HEAD; follow one redirect, otherwise accept 2xx.
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve({ ok: true, status: res.statusCode });
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Try GET on the redirect target as a fallback validation.
          return resolve(getOk(res.headers.location));
        }
        resolve({ ok: false, status: res.statusCode });
      });
      req.on('error', (e) => resolve({ ok: false, status: 'ERR ' + e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'TIMEOUT' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 'EX ' + e.message });
    }
  });
}

function getOk(url) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'GET', timeout: 15000 }, (res) => {
        res.resume();
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
      });
      req.on('error', (e) => resolve({ ok: false, status: 'ERR ' + e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'TIMEOUT' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 'EX ' + e.message });
    }
  });
}

async function validateAllPhotos() {
  const urls = Array.from(new Set(Object.values(PH)));
  console.log(`\nValidating ${urls.length} unique photo URLs...`);
  const failures = [];
  // Validate with limited concurrency.
  const CONC = 6;
  for (let i = 0; i < urls.length; i += CONC) {
    const batch = urls.slice(i, i + CONC);
    const results = await Promise.all(batch.map((u) => headOk(u).then((r) => ({ u, r }))));
    for (const { u, r } of results) {
      if (!r.ok) { failures.push({ u, status: r.status }); console.log(`  ✗ ${r.status}  ${u}`); }
    }
  }
  if (failures.length) {
    throw new Error(`PHOTO VALIDATION FAILED — ${failures.length} URL(s) did not return 200:\n` +
      failures.map((f) => `  ${f.status}  ${f.u}`).join('\n'));
  }
  console.log('  All photo URLs return 200.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // STEP 0 — validate every photo URL up-front. Abort before touching the DB
  // if anything 404s.
  await validateAllPhotos();

  // STEP 1 — resolve or create the demo family.
  let { data: fam } = await supabaseAdmin
    .from('families').select('*').eq('custom_domain', DEMO_DOMAIN).maybeSingle();

  if (!fam) {
    console.log(`\nNo family for ${DEMO_DOMAIN} — creating it.`);
    const { data: created, error: cErr } = await supabaseAdmin
      .from('families')
      .insert({
        email: `sample@${DEMO_DOMAIN}`,
        display_name: 'The Bennett Family',
        book_password: 'legacy',
        subdomain: SUBDOMAIN,
        custom_domain: DEMO_DOMAIN,
        subscription_status: 'active',
        is_active: true,
        plan: 'paid',
        billing_period: 'annual',
        book_type: 'baby_book',
      })
      .select('*')
      .single();
    if (cErr) throw new Error(`family create failed: ${cErr.message}`);
    fam = created;
    console.log(`  Created family ${fam.id}`);
  } else {
    console.log(`\nFound existing family ${fam.id} for ${DEMO_DOMAIN}`);
    // Make sure the demo flags are right even if the row pre-existed.
    await supabaseAdmin.from('families').update({
      book_password: 'legacy',
      subdomain: SUBDOMAIN,
      subscription_status: 'active',
      is_active: true,
      plan: 'paid',
      book_type: 'baby_book',
    }).eq('id', fam.id);
  }

  // STEP 2 — resolve or create the book.
  let book = await bookService.getBookByFamilyId(fam.id);
  if (!book) {
    console.log('  No book yet — creating with defaults.');
    book = await bookService.createBookWithDefaults(fam.id);
    console.log(`  Created book ${book.id}`);
  } else {
    console.log(`  Found existing book ${book.id}`);
  }

  // ── SCOPE GUARD ────────────────────────────────────────────────────────────
  if (EXPECTED_BOOK_ID && book.id !== EXPECTED_BOOK_ID) {
    throw new Error(`SAFETY ABORT: resolved book id ${book.id} != EXPECTED_BOOK_ID ${EXPECTED_BOOK_ID}. Refusing to write.`);
  }
  // Hard cross-check: the book MUST belong to the family that owns the demo
  // domain. This makes it impossible to write to anyone else's book.
  if (book.family_id !== fam.id || fam.custom_domain !== DEMO_DOMAIN) {
    throw new Error(`SAFETY ABORT: book.family_id (${book.family_id}) / family.custom_domain (${fam.custom_domain}) do not line up with ${DEMO_DOMAIN}.`);
  }
  const BOOK_ID = book.id;
  console.log(`\nScope confirmed: ${DEMO_DOMAIN} -> family ${fam.id} -> book ${BOOK_ID}\n`);

  // STEP 3 — book-level fields (welcome / child info / vault date / sections).
  await bookService.updateBook(BOOK_ID, BOOK_FIELDS);
  console.log('  book fields updated (welcome/child info, vault date, celebration_years, visible_sections)');

  // STEP 4 — Before You Arrived (cards + checklist)
  await supabaseAdmin.from('before_arrived_cards').delete().eq('book_id', BOOK_ID);
  await supabaseAdmin.from('before_arrived_cards').insert(
    BEFORE_CARDS.map((c, i) => ({ book_id: BOOK_ID, sort_order: i, ...c }))
  ).then(throwOn('before_arrived_cards'));
  await supabaseAdmin.from('before_arrived_checklist').delete().eq('book_id', BOOK_ID);
  await supabaseAdmin.from('before_arrived_checklist').insert(
    CHECKLIST.map((c, i) => ({ book_id: BOOK_ID, sort_order: i, ...c }))
  ).then(throwOn('before_arrived_checklist'));
  console.log(`  before: ${BEFORE_CARDS.length} cards + ${CHECKLIST.length} checklist items`);

  // STEP 5 — Birth Story
  await bookService.upsertBirthStory(BOOK_ID, BIRTH_STORY);
  console.log('  birth story: both perspectives w/ titles, narratives, photos');

  // STEP 6 — Coming Home
  await supabaseAdmin.from('coming_home_cards').delete().eq('book_id', BOOK_ID);
  await supabaseAdmin.from('coming_home_cards').insert(
    COMING_HOME_CARDS.map((c, i) => ({ book_id: BOOK_ID, sort_order: i, ...c }))
  ).then(throwOn('coming_home_cards'));
  console.log(`  coming home: ${COMING_HOME_CARDS.length} cards`);

  // STEP 7 — Months (all 12). months rows are seeded by createBookWithDefaults;
  // upsert each by month_number to be safe whether they exist or not.
  for (const m of MONTHS) {
    await bookService.upsertMonth(BOOK_ID, m.month_number, m);
  }
  console.log(`  months: ${MONTHS.length} months w/ photo + note + stats`);

  // STEP 8 — Our Family (delete + insert by member_key)
  await supabaseAdmin.from('family_members').delete().eq('book_id', BOOK_ID);
  await supabaseAdmin.from('family_members').insert(
    FAMILY_MEMBERS.map((fm) => ({ book_id: BOOK_ID, ...fm }))
  ).then(throwOn('family_members'));
  console.log(`  family: ${FAMILY_MEMBERS.length} members (mom, dad, 2 grandparents)`);

  // STEP 9 — Firsts
  await supabaseAdmin.from('firsts').delete().eq('book_id', BOOK_ID);
  await supabaseAdmin.from('firsts').insert(
    FIRSTS.map((f, i) => ({ book_id: BOOK_ID, sort_order: i, ...f }))
  ).then(throwOn('firsts'));
  console.log(`  firsts: ${FIRSTS.length}`);

  // STEP 10 — Letters
  await supabaseAdmin.from('letters').delete().eq('book_id', BOOK_ID);
  await supabaseAdmin.from('letters').insert(
    LETTERS.map((l, i) => ({ book_id: BOOK_ID, sort_order: i, ...l }))
  ).then(throwOn('letters'));
  console.log(`  letters: ${LETTERS.length}`);

  // STEP 11 — Celebrations (+ photos)
  const { data: oldCelebs } = await supabaseAdmin.from('celebrations').select('id').eq('book_id', BOOK_ID);
  const oldCelebIds = (oldCelebs || []).map((c) => c.id);
  if (oldCelebIds.length) await supabaseAdmin.from('celebration_photos').delete().in('celebration_id', oldCelebIds);
  await supabaseAdmin.from('celebrations').delete().eq('book_id', BOOK_ID);
  for (let i = 0; i < CELEBRATIONS.length; i++) {
    const { photos, ...cel } = CELEBRATIONS[i];
    const row = { book_id: BOOK_ID, sort_order: i, ...cel };
    if (row.celebration_date === '') row.celebration_date = null;
    const { data: inserted, error } = await supabaseAdmin.from('celebrations').insert(row).select('id').single();
    if (error) throw new Error(`celebration insert failed (${cel.title}): ${error.message}`);
    if (photos && photos.length) {
      const rows = photos.map((p, j) => ({ celebration_id: inserted.id, photo_path: p.photo_path, caption: p.caption || '', sort_order: j }));
      const { error: pErr } = await supabaseAdmin.from('celebration_photos').insert(rows);
      if (pErr) throw new Error(`celebration_photos insert failed (${cel.title}): ${pErr.message}`);
    }
  }
  console.log(`  celebrations: ${CELEBRATIONS.length} across 2 years (+ gallery photos)`);

  // STEP 12 — Recipes (+ photos)
  const { data: oldRecipes } = await supabaseAdmin.from('recipes').select('id').eq('book_id', BOOK_ID);
  const oldRecipeIds = (oldRecipes || []).map((r) => r.id);
  if (oldRecipeIds.length) await supabaseAdmin.from('recipe_photos').delete().in('recipe_id', oldRecipeIds);
  await supabaseAdmin.from('recipes').delete().eq('book_id', BOOK_ID);
  for (let i = 0; i < RECIPES.length; i++) {
    const { photos, ...rec } = RECIPES[i];
    const { data: inserted, error } = await supabaseAdmin.from('recipes').insert({ book_id: BOOK_ID, sort_order: i, ...rec }).select('id').single();
    if (error) throw new Error(`recipe insert failed (${rec.title}): ${error.message}`);
    if (photos && photos.length) {
      const rows = photos.map((p, j) => ({ recipe_id: inserted.id, photo_path: p.photo_path, caption: p.caption || '', sort_order: j }));
      const { error: pErr } = await supabaseAdmin.from('recipe_photos').insert(rows);
      if (pErr) throw new Error(`recipe_photos insert failed (${rec.title}): ${pErr.message}`);
    }
  }
  console.log(`  recipes: ${RECIPES.length} (+ photos each)`);

  // STEP 13 — Journey (+ photos)
  const journeyRow = await bookService.upsertJourneyStory(BOOK_ID, {
    title: JOURNEY.title, intro: JOURNEY.intro, story_title: JOURNEY.story_title,
    story: JOURNEY.story, milestones: JOURNEY.milestones,
    letter_text: JOURNEY.letter_text, letter_sign: JOURNEY.letter_sign,
  });
  await supabaseAdmin.from('journey_photos').delete().eq('journey_id', journeyRow.id);
  if (JOURNEY.photos.length) {
    await supabaseAdmin.from('journey_photos').insert(
      JOURNEY.photos.map((p, j) => ({ journey_id: journeyRow.id, photo_path: p.photo_path, caption: p.caption || '', sort_order: j }))
    ).then(throwOn('journey_photos'));
  }
  console.log(`  journey: story + ${JOURNEY.milestones.length} milestones + letter + ${JOURNEY.photos.length} photos`);

  // STEP 14 — Keepsakes (+ photos)
  const { data: oldKeeps } = await supabaseAdmin.from('keepsakes').select('id').eq('book_id', BOOK_ID);
  const oldKeepIds = (oldKeeps || []).map((k) => k.id);
  if (oldKeepIds.length) await supabaseAdmin.from('keepsake_photos').delete().in('keepsake_id', oldKeepIds);
  await supabaseAdmin.from('keepsakes').delete().eq('book_id', BOOK_ID);
  for (let i = 0; i < KEEPSAKES.length; i++) {
    const { photos, ...k } = KEEPSAKES[i];
    const slug = (k.title || 'keepsake').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const row = { book_id: BOOK_ID, sort_order: i, slug, ...k };
    if (row.date_made === '') row.date_made = null;
    const { data: inserted, error } = await supabaseAdmin.from('keepsakes').insert(row).select('id').single();
    if (error) throw new Error(`keepsake insert failed (${k.title}): ${error.message}`);
    if (photos && photos.length) {
      const rows = photos.map((p, j) => ({ keepsake_id: inserted.id, photo_path: p.photo_path, caption: p.caption || '', sort_order: j }));
      const { error: pErr } = await supabaseAdmin.from('keepsake_photos').insert(rows);
      if (pErr) throw new Error(`keepsake_photos insert failed (${k.title}): ${pErr.message}`);
    }
  }
  console.log(`  keepsakes: ${KEEPSAKES.length} (+ photos)`);

  // STEP 15 — Vault items
  await supabaseAdmin.from('vault_items').delete().eq('book_id', BOOK_ID);
  await supabaseAdmin.from('vault_items').insert(
    VAULT_ITEMS.map((v) => ({ book_id: BOOK_ID, ...v }))
  ).then(throwOn('vault_items'));
  console.log(`  vault: ${VAULT_ITEMS.length} sealed items`);

  console.log(`\nDONE. Demo book fully seeded.`);
  console.log(`  FAMILY ID: ${fam.id}`);
  console.log(`  BOOK ID:   ${BOOK_ID}`);
  console.log(`  (Optionally paste the BOOK ID into EXPECTED_BOOK_ID at the top for an extra guard.)`);
}

function throwOn(label) {
  return ({ error }) => { if (error) throw new Error(`${label} insert failed: ${error.message}`); };
}

main().catch((e) => { console.error('\nSEED FAILED:', e.message); process.exit(1); });
