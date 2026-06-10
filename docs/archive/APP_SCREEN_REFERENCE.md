# Legacy Odyssey - App Screen Reference Guide

Use the reference numbers below when reporting bugs or requesting changes.
Format: **[W-1]** = Web screen 1, **[M-1]** = Mobile screen 1

---

## PART A: MARKETING WEBSITE (legacyodyssey.com)

### [W-1] Landing Page - Hero Section
- **URL:** `https://legacyodyssey.com`
- **Elements:**
  - [W-1a] Top nav bar: "Legacy Odyssey" logo, FEATURES, HOW IT WORKS, PRICING, GET STARTED button
  - [W-1b] "BABY BOOKS & FAMILY ALBUMS" badge
  - [W-1c] Hero headline: "Every Moment Deserves to Be Remembered"
  - [W-1d] Subtext describing the product
  - [W-1e] "Start Your Family's Site" CTA button (gold)
  - [W-1f] "See How It Works" button (outline)
  - [W-1g] "Plans start at just $4.99/mo" text

### [W-2] Landing Page - Features Section
- **Elements:**
  - [W-2a] "Everything Your Family Needs" heading
  - [W-2b] Feature card: "Your Own Exclusive Domain" (globe icon)
  - [W-2c] Feature card: "Photos & Videos" (camera icon)
  - [W-2d] Feature card: "Baby Books" (baby icon)
  - [W-2e] Feature card: "Family Photo Albums" (film icon)
  - [W-2f] Feature card: "Letters & Messages" (envelope icon)
  - [W-2g] Feature card: "Password Protected" (lock icon)

### [W-3] Landing Page - How It Works Section
- **Elements:**
  - [W-3a] "Simple to Start, Beautiful to Keep" heading
  - [W-3b] Step 1: "Download the App"
  - [W-3c] Step 2: "Choose Your Domain"
  - [W-3d] Step 3: "Fill in the Memories"
  - [W-3e] Step 4: "Share & Treasure"

### [W-4] Landing Page - Domain Claim Section
- **Elements:**
  - [W-4a] "Claim Your Family's Domain" heading (dark background)
  - [W-4b] Example domain cards (EowynHopeRagno.com, TheSmithFamily.com, etc.)
  - [W-4c] Urgency text: "Every day, thousands of domain names are registered..."

### [W-5] Landing Page - Pricing Section
- **Elements:**
  - [W-5a] "Invest in Memories That Last" heading
  - [W-5b] Monthly/Annual toggle
  - [W-5c] Starter plan card: $4.99/mo (1 site, 100 photos, 500 MB)
  - [W-5d] Family plan card: $8.99/mo "BEST VALUE" (3 sites, unlimited photos, 2 GB)
  - [W-5e] Legacy plan card: $13.99/mo (unlimited sites, 5 GB, PDF export coming)
  - [W-5f] "Get Started" buttons on each plan
  - [W-5g] "All plans include..." footer text

### [W-6] Landing Page - Testimonials Section
- **Elements:**
  - [W-6a] "Loved by Families" heading
  - [W-6b] Testimonial cards (Sarah M., James T., Priya K., Marcus & Lena W.)

### [W-7] Landing Page - Final CTA & Footer
- **Elements:**
  - [W-7a] "They're Only Little Once" heading (dark background)
  - [W-7b] "Claim Your Domain & Start Today" CTA button
  - [W-7c] Footer: Legacy Odyssey logo, Features, Pricing, Contact links
  - [W-7d] Copyright: "2026 Legacy Odyssey. All rights reserved."

---

## PART B: BABY BOOK (Web Viewer)

**URL:** `https://legacyodyssey.com/book/eowynragno`
**Password:** `legacy`

### [W-8] Password Gate
- **Elements:**
  - [W-8a] "LEGACY ODYSSEY" brand text with decorative stars
  - [W-8b] Child name display: "Eowyn Ragno" (italic, large)
  - [W-8c] "A LIVING BABY BOOK & FAMILY HEIRLOOM" subtitle
  - [W-8d] Password input field
  - [W-8e] "OPEN BOOK" submit button (outline, gold)
  - [W-8f] "Demo password: legacy" hint text
- **Known Bug:** Password form action `/verify-password` does NOT work with path-based access (`/book/:slug`). The family context is lost on POST. Only works when accessed via subdomain.

### [W-9] Sidebar Navigation (persistent on all book pages)
- **Elements:**
  - [W-9a] "LEGACY ODYSSEY" header text
  - [W-9b] Child name: "Eowyn Ragno"
  - [W-9c] "BORN . ." (birth date - currently blank)
  - [W-9d] THE BOOK section header
  - [W-9e] Welcome link
  - [W-9f] Before You Arrived link
  - [W-9g] Birth Story link
  - [W-9h] Coming Home link
  - [W-9i] Month by Month link
  - [W-9j] FAMILY & MEMORIES section header
  - [W-9k] Our Family link
  - [W-9l] Your Firsts link
  - [W-9m] Celebrations link
  - [W-9n] Letters To You link
  - [W-9o] Family Recipes link
  - [W-9p] THE VAULT section header
  - [W-9q] Locked Until 18 link
  - [W-9r] "Crafted with love by Legacy Odyssey" footer

### [W-10] Welcome Page (Chapter: Welcome)
- **Elements:**
  - [W-10a] "WELCOME TO THE BOOK OF" header
  - [W-10b] Child first name in italic: "Eowyn"
  - [W-10c] Child last name in regular: "Ragno"
  - [W-10d] NOTE: Middle name NOT showing (should it show "Hope" if added?)
  - [W-10e] Parent quote: "A name chosen with love, meaning, and intention"
  - [W-10f] Vital stats grid:
    - BORN: (empty)
    - TIME: (empty)
    - WEIGHT: 7 lbs 8 oz
    - LENGTH: 20 inches
    - BORN IN: Mesa, AZ
    - HOSPITAL: Scottsdale
  - [W-10g] Full parent quote block with gold left border
  - [W-10h] "- MOM & DAD" attribution

### [W-11] Before You Arrived (Chapter One)
- **Elements:**
  - [W-11a] "CHAPTER ONE" label
  - [W-11b] "Before You Arrived" heading (mixed italic/regular)
  - [W-11c] Description text
  - [W-11d] Photo card grid (2x2 layout):
    - "THE MOMENT WE FOUND OUT" - The Pregnancy (has photo)
    - "PREPARING YOUR ROOM" - The Nursery (has photo)
    - "THE BABY SHOWER" (placeholder - no photo)
    - "THE FIRST ULTRASOUND" (placeholder - no photo)

### [W-12] Birth Story (Chapter Two)
- **Elements:**
  - [W-12a] "CHAPTER TWO" label
  - [W-12b] "The Birth Story" heading
  - [W-12c] Vital stats row: DATE (empty), TIME (empty), WEIGHT (7 lbs 8 oz), LENGTH (20 inches), FIRST HELD BY (Mom / Dad)
  - [W-12d] "FROM MOM'S POINT OF VIEW" quote block
  - [W-12e] "FROM DAD'S POINT OF VIEW" quote block

### [W-13] Coming Home (Chapter Three)
- **Elements:**
  - [W-13a] "CHAPTER THREE" label
  - [W-13b] "Coming Home" heading
  - [W-13c] Photo card grid:
    - "THE FIRST CAR RIDE" - The Ride Home
    - "THE FIRST NIGHT HOME" - First Night
    - "MEETING THE FAMILY"
    - "THE FIRST WEEK"

### [W-14] Month by Month (Chapter Four - The First Year)
- **Elements:**
  - [W-14a] "CHAPTER FOUR - THE FIRST YEAR" label
  - [W-14b] "Month by Month" heading
  - [W-14c] Year timeline bar: "YEAR ONE" ... "BIRTH -> FIRST BIRTHDAY"
  - [W-14d] Month cards grid (4 columns x 3 rows = 12 months):
    - Each card shows: month icon, month number, age label, milestone text, weight, length
    - Month 1: "First smile sighted..." (9 lbs 2 oz, 21 in)
    - Month 2: "Discovering your voice" (10 lbs 8 oz, 22 in)
    - Month 3: "First real laugh" (12 lbs, 23.5 in)
    - Month 4: "Rolling over milestone" (13 lbs 4 oz, 24.5 in)
    - Month 5-12: continues with milestones and measurements

### [W-15] Our Family (Chapter Five)
- **Elements:**
  - [W-15a] "CHAPTER FIVE" label
  - [W-15b] "Our Family" heading
  - [W-15c] "The People Who Make Up Your World" section title
  - [W-15d] "MOM & DAD" subsection
  - [W-15e] Mom's card: emoji avatar, "Mom's Name", "MOTHER", "Tap to read more."
  - [W-15f] Dad's card: emoji avatar, "Dad's Name", "FATHER", "Tap to read more."
  - [W-15g] Additional family member sections (grandparents, etc.) below

### [W-16] Your Firsts (Chapter Six)
- **Elements:**
  - [W-16a] "CHAPTER SIX" label
  - [W-16b] "Your Firsts" heading
  - [W-16c] Milestones grid (3 columns x 3 rows):
    - First Real Smile (emoji)
    - First Belly Laugh (emoji)
    - First Solid Food (emoji)
    - First Tooth (emoji)
    - First Steps (emoji)
    - First Word (emoji)
    - First Bath (emoji)
    - First Night of Sleep (emoji)
    - First Trip (emoji)

### [W-17] Celebrations & Traditions (Chapter Seven)
- **Elements:**
  - [W-17a] "CHAPTER SEVEN" label
  - [W-17b] "Celebrations & Traditions" heading
  - [W-17c] "FIRST MAJOR HOLIDAY" - "First Holiday Season" card with photo placeholder
  - [W-17d] "CULTURAL TRADITIONS" - "Your Heritage Celebration" card

### [W-18] Letters To You (Chapter Eight)
- **Elements:**
  - [W-18a] "CHAPTER EIGHT" label
  - [W-18b] "Letters To You" heading
  - [W-18c] Letter cards (each with large quote marks):
    - "FROM MOM" - "My darling,"
    - "FROM DAD" - "Dear little one,"
    - "FROM GRANDMA" - "My precious grandchild,"

### [W-19] Family Recipes & Traditions (Chapter Nine)
- **Elements:**
  - [W-19a] "CHAPTER NINE" label
  - [W-19b] "Family Recipes & Traditions" heading
  - [W-19c] Description paragraph about food and memory
  - [W-19d] Recipe cards:
    - "GRANDMA'S RECIPE" - "Grandma's Special Recipe"
    - "DAD'S FAMILY RECIPE" - "A Recipe From Dad's Side"
    - Additional recipe cards below

### [W-20] The Vault (Locked Until 18)
- **Elements:**
  - [W-20a] Lock icon (gold padlock)
  - [W-20b] "THE LEGACY VAULT" label
  - [W-20c] "Sealed Until Your 18th Birthday" heading
  - [W-20d] Description about sealed letters and memories
  - [W-20e] Countdown timer box: "UNLOCKS IN" with YEARS / MONTHS / DAYS (currently showing "--" since no birth date set)
  - [W-20f] "SEALED BY LEGACY ODYSSEY - PROTECTED FOREVER" badge

### [W-21] Book Not Found Page
- **URL:** Shows when family/book doesn't exist or is deactivated
- **Elements:**
  - [W-21a] "Book Not Found" heading
  - [W-21b] "This baby book doesn't exist or has been deactivated."
  - [W-21c] "Visit Legacy Odyssey" link

---

## PART C: MOBILE APP (React Native / Expo)

> Note: These are documented from source code. Use the APK to test on device.
> **APK Download:** https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds/d9bc9bb2-1f33-47e5-8de1-ede6c21c0d66

### [M-1] Login Screen
- **File:** `mobile/src/auth/LoginScreen.js`
- **Elements:**
  - [M-1a] Email input field
  - [M-1b] Password input field (with visibility toggle)
  - [M-1c] "Log In" button
  - [M-1d] "Don't have an account? Sign Up" link

### [M-2] Signup Screen
- **File:** `mobile/src/auth/SignupScreen.js`
- **Elements:**
  - [M-2a] Email input field
  - [M-2b] Password input field (with visibility toggle)
  - [M-2c] Confirm password field
  - [M-2d] "Sign Up" button
  - [M-2e] "Already have an account? Log In" link

### [M-3] Dashboard Screen (Home)
- **File:** `mobile/src/screens/DashboardScreen.js`
- **Elements:**
  - [M-3a] Child name display at top
  - [M-3b] Navigation cards/buttons for each book section
  - [M-3c] Settings gear icon
  - [M-3d] Preview/link to web book

### [M-4] Child Info Screen
- **File:** `mobile/src/screens/ChildInfoScreen.js`
- **Elements:**
  - [M-4a] First Name input
  - [M-4b] Middle Name input (NEW - recently added)
  - [M-4c] Last Name input
  - [M-4d] Birth date picker
  - [M-4e] Birth time picker
  - [M-4f] Weight (lbs/oz) inputs
  - [M-4g] Length (inches) input
  - [M-4h] Birth city input
  - [M-4i] Hospital name input
  - [M-4j] Save button

### [M-5] Before You Arrived Screen
- **File:** `mobile/src/screens/BeforeScreen.js`
- **Elements:**
  - [M-5a] Photo upload slots for each sub-section
  - [M-5b] Text/caption fields
  - [M-5c] PhotoPicker component (recently fixed: no forced crop, correct URL handling)

### [M-6] Birth Story Screen
- **File:** `mobile/src/screens/BirthStoryScreen.js`
- **Elements:**
  - [M-6a] Birth details fields (weight, length, first held by)
  - [M-6b] Mom's point of view text area
  - [M-6c] Dad's point of view text area
  - [M-6d] Photo upload for birth photos

### [M-7] Coming Home Screen
- **File:** `mobile/src/screens/ComingHomeScreen.js`
- **Elements:**
  - [M-7a] Photo slots for ride home, first night, meeting family, first week
  - [M-7b] Caption fields for each sub-section

### [M-8] Month by Month (Overview) Screen
- **File:** `mobile/src/screens/MonthsScreen.js`
- **Elements:**
  - [M-8a] Grid of 12 month cards
  - [M-8b] Each card shows month number and milestone preview
  - [M-8c] Tap to open individual month detail

### [M-9] Month Detail Screen
- **File:** `mobile/src/screens/MonthDetailScreen.js`
- **Elements:**
  - [M-9a] Month photo upload
  - [M-9b] Milestone text field
  - [M-9c] Weight input
  - [M-9d] Length input
  - [M-9e] Notes field
  - [M-9f] Save button

### [M-10] Our Family Screen
- **File:** `mobile/src/screens/FamilyScreen.js`
- **Elements:**
  - [M-10a] Family member cards (Mom, Dad, grandparents, etc.)
  - [M-10b] Add family member button
  - [M-10c] Tap to edit individual member

### [M-11] Family Member Detail Screen
- **File:** `mobile/src/screens/FamilyMemberScreen.js`
- **Elements:**
  - [M-11a] Photo upload for family member
  - [M-11b] Name field
  - [M-11c] Role/relationship field
  - [M-11d] Bio/description text area

### [M-12] Your Firsts Screen
- **File:** `mobile/src/screens/FirstsScreen.js`
- **Elements:**
  - [M-12a] Grid of milestone cards (First Smile, First Word, etc.)
  - [M-12b] Date field for each milestone
  - [M-12c] Photo upload for each
  - [M-12d] Notes field

### [M-13] Celebrations Screen
- **File:** `mobile/src/screens/CelebrationsScreen.js`
- **Elements:**
  - [M-13a] Celebration entry cards
  - [M-13b] Photo upload slots
  - [M-13c] Description fields

### [M-14] Letters To You Screen
- **File:** `mobile/src/screens/LettersScreen.js`
- **Elements:**
  - [M-14a] Letter cards (From Mom, From Dad, From Grandma, etc.)
  - [M-14b] Text editor for each letter
  - [M-14c] Author attribution field

### [M-15] Family Recipes Screen
- **File:** `mobile/src/screens/RecipesScreen.js`
- **Elements:**
  - [M-15a] Recipe cards
  - [M-15b] Recipe photo upload
  - [M-15c] Recipe title, ingredients, instructions fields

### [M-16] The Vault Screen
- **File:** `mobile/src/screens/VaultScreen.js`
- **Elements:**
  - [M-16a] Vault unlock date display
  - [M-16b] Sealed message entries
  - [M-16c] Add new vault message

### [M-17] Settings Screen
- **File:** `mobile/src/screens/SettingsScreen.js`
- **Elements:**
  - [M-17a] Book password management
  - [M-17b] Account settings
  - [M-17c] Sign out button

### [M-18] Book Preview Screen
- **File:** `mobile/src/screens/PreviewScreen.js`
- **Elements:**
  - [M-18a] WebView showing the live book site
  - [M-18b] Navigation controls

### [M-19] PhotoPicker Component (used across multiple screens)
- **File:** `mobile/src/components/PhotoPicker.js`
- **Elements:**
  - [M-19a] Photo thumbnail display
  - [M-19b] "Add Photo" button / tap to select
  - [M-19c] Image picker (gallery selection, no forced crop)
  - [M-19d] Upload progress indicator
- **Recent Fixes:**
  - Disabled forced cropping (allowsEditing: false)
  - Removed forced aspect ratio
  - Changed URL preference: uses full public URL (`res.data.url`) over raw storage path

---

## KNOWN BUGS / ISSUES

| Ref | Description | Severity |
|-----|-------------|----------|
| BUG-1 | **[W-8] Password form breaks on path-based access.** The form POSTs to `/verify-password` but the `resolveFamily` middleware can't find the family because the path is no longer `/book/:slug`. Only works via subdomain access. | High |
| BUG-2 | **[W-10] Birth date shows empty.** The BORN field and sidebar "BORN . ." show no date, even though data may exist in DB. | Medium |
| BUG-3 | **[W-10] Middle name not visible.** Eowyn's middle name (if set) does not appear on the Welcome page between first and last name. Need to verify if middle name was actually saved via mobile app. | Medium |
| BUG-4 | **[W-20] Vault countdown shows "--".** Because birth date is empty, the vault timer can't calculate the unlock date. | Low (depends on BUG-2) |
| BUG-5 | **[W-9c] Sidebar birth date blank.** "BORN . ." needs to show the actual birth date. | Medium |

---

## QUICK REFERENCE: Screen IDs at a Glance

### Web (Marketing)
| ID | Screen |
|----|--------|
| W-1 | Landing - Hero |
| W-2 | Landing - Features |
| W-3 | Landing - How It Works |
| W-4 | Landing - Domain Claim |
| W-5 | Landing - Pricing |
| W-6 | Landing - Testimonials |
| W-7 | Landing - Final CTA & Footer |

### Web (Book)
| ID | Screen |
|----|--------|
| W-8 | Password Gate |
| W-9 | Sidebar Navigation |
| W-10 | Welcome |
| W-11 | Before You Arrived |
| W-12 | Birth Story |
| W-13 | Coming Home |
| W-14 | Month by Month |
| W-15 | Our Family |
| W-16 | Your Firsts |
| W-17 | Celebrations |
| W-18 | Letters To You |
| W-19 | Family Recipes |
| W-20 | The Vault |
| W-21 | Book Not Found |

### Mobile App
| ID | Screen |
|----|--------|
| M-1 | Login |
| M-2 | Signup |
| M-3 | Dashboard |
| M-4 | Child Info |
| M-5 | Before You Arrived |
| M-6 | Birth Story |
| M-7 | Coming Home |
| M-8 | Month by Month (grid) |
| M-9 | Month Detail |
| M-10 | Our Family |
| M-11 | Family Member Detail |
| M-12 | Your Firsts |
| M-13 | Celebrations |
| M-14 | Letters To You |
| M-15 | Family Recipes |
| M-16 | The Vault |
| M-17 | Settings |
| M-18 | Book Preview |
| M-19 | PhotoPicker (component) |
