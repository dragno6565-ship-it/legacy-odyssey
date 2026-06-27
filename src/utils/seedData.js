// Default placeholder content for a new book (same as the demo site).
// NOTE: months are seeded with the month NAME only — no example highlight/weight/
// length. Those are shown as greyed example placeholders in the editor instead, and
// a month only appears on the public site once the parent fills in a real field.
const defaultMonths = [
  { month_number: 1, label: 'One Month Old' },
  { month_number: 2, label: 'Two Months Old' },
  { month_number: 3, label: 'Three Months Old' },
  { month_number: 4, label: 'Four Months Old' },
  { month_number: 5, label: 'Five Months Old' },
  { month_number: 6, label: 'Six Months Old' },
  { month_number: 7, label: 'Seven Months Old' },
  { month_number: 8, label: 'Eight Months Old' },
  { month_number: 9, label: 'Nine Months Old' },
  { month_number: 10, label: 'Ten Months Old' },
  { month_number: 11, label: 'Eleven Months Old' },
  { month_number: 12, label: 'Twelve Months Old' },
];

const defaultFamilyMembers = [
  { member_key: 'mom', name: "Mom's Name", relation: 'Mother', emoji: '👩', sort_order: 0 },
  { member_key: 'dad', name: "Dad's Name", relation: 'Father', emoji: '👨', sort_order: 1 },
  { member_key: 'grandma-maternal', name: "Grandma's Name", relation: 'Maternal Grandmother', emoji: '👵', sort_order: 2 },
  { member_key: 'grandpa-maternal', name: "Grandpa's Name", relation: 'Maternal Grandfather', emoji: '👴', sort_order: 3 },
  { member_key: 'grandma-paternal', name: "Grandma's Name", relation: 'Paternal Grandmother', emoji: '👵', sort_order: 4 },
  { member_key: 'grandpa-paternal', name: "Grandpa's Name", relation: 'Paternal Grandfather', emoji: '👴', sort_order: 5 },
];

const defaultBeforeCards = [
  { sort_order: 0, title: 'THE PREGNANCY', subtitle: 'The Moment We Found Out' },
  { sort_order: 1, title: 'THE NURSERY', subtitle: 'Preparing Your Room' },
  { sort_order: 2, title: 'THE BABY SHOWER', subtitle: 'The Baby Shower' },
  { sort_order: 3, title: 'FIRST LOOK', subtitle: 'The First Ultrasound' },
];

const defaultComingHomeCards = [
  { sort_order: 0, title: 'THE RIDE HOME', subtitle: 'The First Car Ride' },
  { sort_order: 1, title: 'FIRST NIGHT', subtitle: 'The First Night Home' },
  { sort_order: 2, title: 'MEETING EVERYONE', subtitle: 'Meeting the Family' },
  { sort_order: 3, title: 'WEEK ONE', subtitle: 'The First Week' },
];

const defaultFirsts = [
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

const defaultCelebrations = [
  { sort_order: 0, eyebrow: 'First Major Holiday', title: 'First Holiday Season' },
  { sort_order: 1, eyebrow: 'Cultural Traditions', title: 'Your Heritage Celebration' },
  { sort_order: 2, eyebrow: 'New Family Tradition', title: 'A Tradition We Started For You' },
];

const defaultLetters = [
  { sort_order: 0, from_label: 'From Mom', occasion: 'Written on Your Birth Day', salutation: 'My darling,' },
  { sort_order: 1, from_label: 'From Dad', occasion: 'The Night You Were Born', salutation: 'Dear little one,' },
  { sort_order: 2, from_label: 'From Grandma', occasion: 'When I First Held You', salutation: 'My precious grandchild,' },
];

const defaultRecipes = [
  { sort_order: 0, origin_label: "Grandma's Recipe", title: "Grandma's Special Recipe" },
  { sort_order: 1, origin_label: "Dad's Family Recipe", title: 'A Recipe From Dad\'s Side' },
  { sort_order: 2, origin_label: 'Birthday Tradition', title: 'Your Birthday Cake Recipe' },
  { sort_order: 3, origin_label: 'Holiday Favorite', title: 'Holiday Treat Recipe' },
];

module.exports = {
  defaultMonths,
  defaultFamilyMembers,
  defaultBeforeCards,
  defaultComingHomeCards,
  defaultFirsts,
  defaultCelebrations,
  defaultLetters,
  defaultRecipes,
};
