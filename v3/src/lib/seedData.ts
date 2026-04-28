/**
 * Default placeholder content for a new book — same as the demo site.
 * Direct port of src/utils/seedData.js.
 *
 * Edit cautiously: the existing free customers see whatever lives here on
 * the day they signed up, so changing copy here only affects new signups.
 */

export const defaultMonths = [
  { month_number: 1, label: 'One Month Old', highlight: 'First smile sighted...', weight: '9 lbs 2 oz', length: '21 in' },
  { month_number: 2, label: 'Two Months Old', highlight: 'Discovering your voice', weight: '10 lbs 8 oz', length: '22 in' },
  { month_number: 3, label: 'Three Months Old', highlight: 'First real laugh', weight: '12 lbs', length: '23.5 in' },
  { month_number: 4, label: 'Four Months Old', highlight: 'Rolling over milestone', weight: '13 lbs 4 oz', length: '24.5 in' },
  { month_number: 5, label: 'Five Months Old', highlight: 'Grabbing everything!', weight: '14 lbs 6 oz', length: '25.5 in' },
  { month_number: 6, label: 'Six Months Old', highlight: 'First taste of food', weight: '15 lbs 8 oz', length: '26 in' },
  { month_number: 7, label: 'Seven Months Old', highlight: 'Sitting up!', weight: '16 lbs 10 oz', length: '26.5 in' },
  { month_number: 8, label: 'Eight Months Old', highlight: 'Starting to crawl', weight: '17 lbs 8 oz', length: '27 in' },
  { month_number: 9, label: 'Nine Months Old', highlight: 'Pulling to stand', weight: '18 lbs 4 oz', length: '27.5 in' },
  { month_number: 10, label: 'Ten Months Old', highlight: 'First words forming', weight: '19 lbs', length: '28 in' },
  { month_number: 11, label: 'Eleven Months Old', highlight: 'Cruising furniture', weight: '19 lbs 10 oz', length: '28.5 in' },
  { month_number: 12, label: 'Twelve Months Old', highlight: 'Happy first birthday!', weight: '20 lbs 4 oz', length: '29 in' },
];

export const defaultFamilyMembers = [
  { member_key: 'mom', name: "Mom's Name", relation: 'Mother', emoji: '👩', sort_order: 0 },
  { member_key: 'dad', name: "Dad's Name", relation: 'Father', emoji: '👨', sort_order: 1 },
  { member_key: 'grandma-maternal', name: "Grandma's Name", relation: 'Maternal Grandmother', emoji: '👵', sort_order: 2 },
  { member_key: 'grandpa-maternal', name: "Grandpa's Name", relation: 'Maternal Grandfather', emoji: '👴', sort_order: 3 },
  { member_key: 'grandma-paternal', name: "Grandma's Name", relation: 'Paternal Grandmother', emoji: '👵', sort_order: 4 },
  { member_key: 'grandpa-paternal', name: "Grandpa's Name", relation: 'Paternal Grandfather', emoji: '👴', sort_order: 5 },
];

export const defaultBeforeCards = [
  { sort_order: 0, title: 'THE PREGNANCY', subtitle: 'The Moment We Found Out' },
  { sort_order: 1, title: 'THE NURSERY', subtitle: 'Preparing Your Room' },
  { sort_order: 2, title: 'THE BABY SHOWER', subtitle: 'The Baby Shower' },
  { sort_order: 3, title: 'FIRST LOOK', subtitle: 'The First Ultrasound' },
];

export const defaultComingHomeCards = [
  { sort_order: 0, title: 'THE RIDE HOME', subtitle: 'The First Car Ride' },
  { sort_order: 1, title: 'FIRST NIGHT', subtitle: 'The First Night Home' },
  { sort_order: 2, title: 'MEETING EVERYONE', subtitle: 'Meeting the Family' },
  { sort_order: 3, title: 'WEEK ONE', subtitle: 'The First Week' },
];

export const defaultFirsts = [
  { sort_order: 0, emoji: '😊', title: 'First Real Smile' },
  { sort_order: 1, emoji: '😂', title: 'First Belly Laugh' },
  { sort_order: 2, emoji: '🍼', title: 'First Solid Food' },
  { sort_order: 3, emoji: '🦷', title: 'First Tooth' },
  { sort_order: 4, emoji: '👣', title: 'First Steps' },
  { sort_order: 5, emoji: '💬', title: 'First Word' },
  { sort_order: 6, emoji: '🛁', title: 'First Bath' },
  { sort_order: 7, emoji: '🌙', title: 'First Night of Sleep' },
  { sort_order: 8, emoji: '✈️', title: 'First Trip' },
];

export const defaultCelebrations = [
  { sort_order: 0, eyebrow: 'First Major Holiday', title: 'First Holiday Season' },
  { sort_order: 1, eyebrow: 'Cultural Traditions', title: 'Your Heritage Celebration' },
  { sort_order: 2, eyebrow: 'New Family Tradition', title: 'A Tradition We Started For You' },
];

export const defaultLetters = [
  { sort_order: 0, from_label: 'From Mom', occasion: 'Written on Your Birth Day', salutation: 'My darling,' },
  { sort_order: 1, from_label: 'From Dad', occasion: 'The Night You Were Born', salutation: 'Dear little one,' },
  { sort_order: 2, from_label: 'From Grandma', occasion: 'When I First Held You', salutation: 'My precious grandchild,' },
];

export const defaultRecipes = [
  { sort_order: 0, origin_label: "Grandma's Recipe", title: "Grandma's Special Recipe" },
  { sort_order: 1, origin_label: "Dad's Family Recipe", title: 'A Recipe From Dad\'s Side' },
  { sort_order: 2, origin_label: 'Birthday Tradition', title: 'Your Birthday Cake Recipe' },
  { sort_order: 3, origin_label: 'Holiday Favorite', title: 'Holiday Treat Recipe' },
];
