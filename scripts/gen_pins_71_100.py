import os, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT = r"F:\legacy-odyssey\pinterest-pins"
os.makedirs(OUTPUT, exist_ok=True)

PHOTOS = r"F:\legacy-odyssey\marketing\facebook\fb-posts"
PHOTOS_ADS = r"F:\legacy-odyssey\ads\photos"

W, H = 1000, 1500

CREAM    = (248, 242, 230)
DARK     = (30, 24, 18)
GOLD     = (184, 147, 90)
GOLD_DIM = (140, 110, 65)
MID      = (120, 110, 95)
OLIVE    = (72, 80, 50)
WARM     = (58, 48, 35)

FONT_DIR = r"C:\Windows\Fonts"

def fnt(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    except:
        return ImageFont.load_default()

def gold_rule(draw, y, pad=90):
    draw.rectangle([(pad, y), (W - pad, y + 2)], fill=GOLD)

def logo_footer(img, dark_bg=True):
    draw = ImageDraw.Draw(img)
    gold_rule(draw, H - 190)
    lf = fnt("georgiab.ttf", 34)
    text = "LEGACY ODYSSEY"
    bbox = draw.textbbox((0, 0), text, font=lf)
    draw.text(((W - bbox[2]) // 2, H - 168), text, font=lf,
              fill=GOLD if dark_bg else DARK)
    uf = fnt("calibri.ttf", 26)
    url = "legacyodyssey.com"
    bbox2 = draw.textbbox((0, 0), url, font=uf)
    draw.text(((W - bbox2[2]) // 2, H - 122), url, font=uf,
              fill=MID if dark_bg else (150, 135, 110))

def dark_quote_pin(filename, quote, attribution=None, tag=None):
    img = Image.new("RGB", (W, H), DARK)
    d = ImageDraw.Draw(img)
    gold_rule(d, 100)
    y = 155
    if tag:
        tf = fnt("calibri.ttf", 30)
        bbox = d.textbbox((0, 0), tag.upper(), font=tf)
        d.text(((W - bbox[2]) // 2, y), tag.upper(), font=tf, fill=GOLD)
        y += 65
    qf = fnt("georgiab.ttf", 140)
    d.text((85, y - 25), "“", font=qf, fill=GOLD_DIM)
    y += 95
    hf = fnt("georgiai.ttf", 62)
    for line in textwrap.wrap(quote, width=24):
        bbox = d.textbbox((0, 0), line, font=hf)
        d.text(((W - bbox[2]) // 2, y), line, font=hf, fill=CREAM)
        y += int((bbox[3] - bbox[1]) * 1.3)
    if attribution:
        y += 35
        af = fnt("calibri.ttf", 34)
        for ln in textwrap.wrap(f"— {attribution}", width=38):
            bbox = d.textbbox((0, 0), ln, font=af)
            d.text(((W - bbox[2]) // 2, y), ln, font=af, fill=MID)
            y += 48
    logo_footer(img, dark_bg=True)
    img.save(os.path.join(OUTPUT, filename))
    print(f"  ok {filename}")

def cream_list_pin(filename, headline, items, subtext=None):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    gold_rule(d, 80)
    y = 120
    hf = fnt("georgiab.ttf", 62)
    for ln in textwrap.wrap(headline, width=22):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, y), ln, font=hf, fill=DARK)
        y += int((bbox[3] - bbox[1]) * 1.2)
    y += 28
    gold_rule(d, y)
    y += 38
    bf = fnt("calibri.ttf", 36)
    for item in items:
        d.ellipse([(82, y + 13), (95, y + 26)], fill=GOLD)
        d.text((115, y), item, font=bf, fill=DARK)
        y += 54
    if subtext:
        y += 22
        sf = fnt("calibrii.ttf", 32)
        for ln in textwrap.wrap(subtext, width=40):
            bbox = d.textbbox((0, 0), ln, font=sf)
            d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=MID)
            y += 44
    logo_footer(img, dark_bg=False)
    img.save(os.path.join(OUTPUT, filename))
    print(f"  ok {filename}")

def dark_headline_pin(filename, headline, subtext=None, cta_text=None, tag=None):
    img = Image.new("RGB", (W, H), DARK)
    d = ImageDraw.Draw(img)
    gold_rule(d, 100)
    y = 165
    if tag:
        tf = fnt("calibri.ttf", 30)
        bbox = d.textbbox((0, 0), tag.upper(), font=tf)
        d.text(((W - bbox[2]) // 2, y), tag.upper(), font=tf, fill=GOLD)
        y += 65
    hf = fnt("georgiab.ttf", 72)
    for ln in textwrap.wrap(headline, width=20):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, y), ln, font=hf, fill=CREAM)
        y += int((bbox[3] - bbox[1]) * 1.25)
    if subtext:
        y += 44
        sf = fnt("calibri.ttf", 38)
        for ln in textwrap.wrap(subtext, width=32):
            bbox = d.textbbox((0, 0), ln, font=sf)
            d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=MID)
            y += 52
    if cta_text:
        y += 44
        cf = fnt("calibrib.ttf", 36)
        bbox = d.textbbox((0, 0), cta_text, font=cf)
        bw = bbox[2] + 64
        bx = (W - bw) // 2
        d.rounded_rectangle([(bx, y), (bx + bw, y + 60)], radius=30,
                             outline=GOLD, width=2)
        d.text((bx + 32, y + 12), cta_text, font=cf, fill=GOLD)
    logo_footer(img, dark_bg=True)
    img.save(os.path.join(OUTPUT, filename))
    print(f"  ok {filename}")

def cream_comparison_pin(filename, headline, left_title, left_items, right_title, right_items):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    gold_rule(d, 80)
    y = 118
    hf = fnt("georgiab.ttf", 58)
    for ln in textwrap.wrap(headline, width=26):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, y), ln, font=hf, fill=DARK)
        y += int((bbox[3] - bbox[1]) * 1.2)
    y += 28
    gold_rule(d, y)
    y += 40
    col = W // 2
    lhf = fnt("georgiab.ttf", 38)
    lbbox = d.textbbox((0, 0), left_title, font=lhf)
    d.text(((col - lbbox[2]) // 2, y), left_title, font=lhf, fill=MID)
    rbbox = d.textbbox((0, 0), right_title, font=lhf)
    d.text((col + (col - rbbox[2]) // 2, y), right_title, font=lhf, fill=GOLD)
    y += 58
    d.line([(col, y), (col, y + len(left_items) * 64 + 10)], fill=(210, 200, 185), width=2)
    bf = fnt("calibri.ttf", 34)
    iy = y + 6
    for li, ri in zip(left_items, right_items):
        lbx = d.textbbox((0, 0), li, font=bf)
        lx = (col - lbx[2]) // 2
        d.text((lx, iy), li, font=bf, fill=(165, 155, 140))
        my = iy + (lbx[3] - lbx[1]) // 2
        d.line([(lx, my), (lx + lbx[2], my)], fill=(185, 170, 150), width=2)
        rbx = d.textbbox((0, 0), ri, font=bf)
        rx = col + (col - rbx[2]) // 2
        d.text((rx, iy), ri, font=bf, fill=DARK)
        iy += 64
    logo_footer(img, dark_bg=False)
    img.save(os.path.join(OUTPUT, filename))
    print(f"  ok {filename}")

def cream_resource_pin(filename, headline, intro, sections):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([(0, 0), (W, 230)], fill=OLIVE)
    hf = fnt("georgiab.ttf", 58)
    hy = 28
    for ln in textwrap.wrap(headline, width=26):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, hy), ln, font=hf, fill=CREAM)
        hy += int((bbox[3] - bbox[1]) * 1.15)
    gold_rule(d, 230)
    y = 262
    sf = fnt("calibrii.ttf", 34)
    for ln in textwrap.wrap(intro, width=40):
        bbox = d.textbbox((0, 0), ln, font=sf)
        d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=MID)
        y += 46
    y += 18
    stf = fnt("georgiab.ttf", 36)
    bf = fnt("calibri.ttf", 32)
    for sec_title, items in sections:
        d.rectangle([(70, y), (W - 70, y + 52)], fill=GOLD)
        bbox = d.textbbox((0, 0), sec_title, font=stf)
        d.text(((W - bbox[2]) // 2, y + 8), sec_title, font=stf, fill=DARK)
        y += 68
        for item in items:
            d.ellipse([(82, y + 10), (92, y + 20)], fill=DARK)
            d.text((108, y), item, font=bf, fill=DARK)
            y += 46
        y += 14
    logo_footer(img, dark_bg=False)
    img.save(os.path.join(OUTPUT, filename))
    print(f"  ok {filename}")

def dark_photo_pin(filename, photo_path, headline, subtext=None, tag=None, cta_text=None):
    try:
        photo = Image.open(photo_path).convert("RGB")
    except Exception as e:
        print(f"  WARN: could not open {photo_path}: {e} — falling back to DARK bg")
        dark_headline_pin(filename, headline, subtext, cta_text, tag)
        return
    pw, ph = photo.size
    target_ratio = W / H
    if pw / ph > target_ratio:
        new_w = int(ph * target_ratio)
        left = (pw - new_w) // 2
        photo = photo.crop((left, 0, left + new_w, ph))
    else:
        new_h = int(pw / target_ratio)
        top = (ph - new_h) // 2
        photo = photo.crop((0, top, pw, top + new_h))
    photo = photo.resize((W, H), Image.LANCZOS)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(H):
        t = i / H
        if t < 0.45:
            alpha = int(200 - t * 180)
        elif t < 0.55:
            alpha = int(120)
        else:
            alpha = int(120 + (t - 0.55) * 340)
        alpha = min(220, max(90, alpha))
        od.line([(0, i), (W, i)], fill=(20, 15, 10, alpha))
    img = photo.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")
    d = ImageDraw.Draw(img)
    gold_rule(d, 100)
    y = 155
    if tag:
        tf = fnt("calibri.ttf", 30)
        bbox = d.textbbox((0, 0), tag.upper(), font=tf)
        d.text(((W - bbox[2]) // 2, y), tag.upper(), font=tf, fill=GOLD)
        y += 65
    hf = fnt("georgiab.ttf", 72)
    for ln in textwrap.wrap(headline, width=20):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, y), ln, font=hf, fill=CREAM)
        y += int((bbox[3] - bbox[1]) * 1.25)
    if subtext:
        y += 44
        sf = fnt("calibri.ttf", 38)
        for ln in textwrap.wrap(subtext, width=30):
            bbox = d.textbbox((0, 0), ln, font=sf)
            d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=CREAM)
            y += 52
    if cta_text:
        y += 44
        cf = fnt("calibrib.ttf", 36)
        bbox = d.textbbox((0, 0), cta_text, font=cf)
        bw = bbox[2] + 64
        bx = (W - bw) // 2
        d.rounded_rectangle([(bx, y), (bx + bw, y + 60)], radius=30,
                             outline=GOLD, width=2)
        d.text((bx + 32, y + 12), cta_text, font=cf, fill=GOLD)
    logo_footer(img, dark_bg=True)
    img.save(os.path.join(OUTPUT, filename))
    print(f"  ok {filename}")


# ── Generate pins 71–100 ─────────────────────────────────────────────────────
# Schedule: June 19 – July 18, 2026 (one per day at 12:00 PM)
# Board distribution (data-driven: Baby First Year Milestones outperforms):
#   Baby First Year Milestones: pins 71,73,75,77,79,81,84,87,89,92
#   Digital Baby Book Ideas:    pins 72,74,76,80,82,85,88,90,93,96
#   Baby Shower Gift Ideas:     pins 83,86,91,94,98
#   Letters to My Child:        pins 78,95,97,99,100

print("Generating pins 71–100...\n")

# Pin 71 — Baby First Year Milestones
cream_list_pin("pin71_first_24_hours.png",
    "Things to photograph in your baby's first 24 hours",
    ["Their face before anyone cleaned them up",
     "The clock showing the exact time of birth",
     "Their first meal",
     "Every person who held them that day",
     "Their hand next to yours",
     "Their feet — both of them",
     "The room where it happened",
     "You and your partner, exhausted and smiling",
     "Their first outfit",
     "The wristband with their name on it"],
    subtext="Save this list   legacyodyssey.com")

# Pin 72 — Digital Baby Book Ideas
dark_headline_pin("pin72_grandparents_visit.png",
    "Grandparents 400 miles away can visit the baby book anytime.",
    subtext="Legacy Odyssey is a private website at your child's own .com. Invite family to view it from any browser. No app required.",
    cta_text="See how it works",
    tag="Digital baby book")

# Pin 73 — Baby First Year Milestones
cream_list_pin("pin73_paed_visits.png",
    "What to record at every paediatrician visit",
    ["Weight and length — exact numbers",
     "Head circumference (they stop measuring later)",
     "Vaccines given that day",
     "Anything the doctor said that surprised you",
     "Questions you forgot to ask until you got home",
     "How they cried after the shot (or didn't)",
     "How they felt the evening after",
     "The name of the nurse who was kind"],
    subtext="Write it in their book   legacyodyssey.com")

# Pin 74 — Digital Baby Book Ideas
dark_quote_pin("pin74_not_a_scrapbook.png",
    "It's not a scrapbook. It's not an album. It's a website. Their website.",
    attribution="A digital baby book at their own .com — built to be read, not just stored.",
    tag="Digital baby book")

# Pin 75 — Baby First Year Milestones
dark_photo_pin("pin75_sneak_up_milestones.png",
    os.path.join(PHOTOS, "baby1.jpg"),
    "The milestones that sneak up on you.",
    subtext="The last time they fit in your arms without reaching the floor. You won't notice until it's already gone.",
    tag="Baby first year milestones")

# Pin 76 — Digital Baby Book Ideas
cream_comparison_pin("pin76_physical_vs_digital.png",
    "Physical baby book vs. digital baby book — which one gets finished?",
    "Physical book",
    ["Needs craft supplies + time",
     "One flood away from gone",
     "Family can't see it remotely",
     "Stalls after month three"],
    "Legacy Odyssey",
    ["Fill it in from your phone",
     "Private website — always there",
     "Family visits at their .com",
     "Works if you start at month nine"])

# Pin 77 — Baby First Year Milestones
cream_resource_pin("pin77_week_before_one.png",
    "The Week Before They Turn One",
    "Things worth doing before the birthday rush.",
    [
        ("Write", ["A letter from their first year", "Your favourite memory from each month", "Three things that surprised you"]),
        ("Capture", ["One last photo in the newborn spot", "Their current height on the door frame", "A video of them doing something you'll miss"]),
        ("Record", ["Their exact weight the day before", "The last meal they ate as a baby", "What they said (or almost said) this week"]),
    ])

# Pin 78 — Letters to My Child
dark_quote_pin("pin78_letter_worst_day.png",
    "Write a letter for the day they're having the worst day of their life.",
    attribution="They won't read it now. But someday they will need to know you thought of this.",
    tag="Letters to my child")

# Pin 79 — Baby First Year Milestones
cream_list_pin("pin79_sounds_to_record.png",
    "9 sounds from baby's first year you'll wish you had saved",
    ["Their very first cry — right after birth",
     "The sound they made when they first fed",
     "A full minute of them just breathing",
     "Their first laugh — the real one",
     "How they said your name for the first time",
     "The noise they made when they were hungry",
     "Their sleep sounds at two weeks old",
     "The way they giggled at something ridiculous",
     "Their voice at exactly twelve months old"],
    subtext="Record it. Save it. legacyodyssey.com")

# Pin 80 — Digital Baby Book Ideas
dark_headline_pin("pin80_start_month_three.png",
    "Started at month three. Still counts.",
    subtext="You don't need to start on day one. Legacy Odyssey works whenever you're ready. Everything from here forward is still worth saving.",
    cta_text="Start whenever",
    tag="Digital baby book")

# Pin 81 — Baby First Year Milestones
dark_photo_pin("pin81_changes_fastest.png",
    os.path.join(PHOTOS_ADS, "smile.jpg"),
    "No stage of childhood changes faster than the first year.",
    subtext="Month one and month twelve are two completely different people. Document both ends of that.",
    tag="Baby first year milestones")

# Pin 82 — Digital Baby Book Ideas
cream_list_pin("pin82_what_makes_worth_using.png",
    "What actually makes a digital baby book worth using",
    ["You can fill it in from anywhere — no desk required",
     "Family can see it without downloading anything",
     "Photos + milestones + letters in one place",
     "Private by default — not a social feed",
     "Their own .com address, not a username",
     "Works if you start early or embarrassingly late",
     "Grandparents can read it on any browser"],
    subtext="That's Legacy Odyssey.   legacyodyssey.com")

# Pin 83 — Baby Shower Gift Ideas
dark_headline_pin("pin83_second_baby_gift.png",
    "A baby shower gift for the second baby.",
    subtext="Parents of a second child rarely get a baby shower. But that baby deserves a book too. Give them a .com of their own.",
    cta_text="Give as a gift",
    tag="Baby shower gift ideas")

# Pin 84 — Baby First Year Milestones
cream_resource_pin("pin84_first_year_timeline.png",
    "How to Build a First-Year Timeline",
    "A simple structure for parents who aren't sure where to start.",
    [
        ("Birth", ["Birth story (what actually happened)", "First photos + measurements", "Who was there"]),
        ("Months 1–3", ["Monthly weight + milestones", "First smile, first laugh", "One letter per month"]),
        ("Months 4–9", ["Rolling, sitting, first solid food", "Funny things they do", "What changed most"]),
        ("Months 10–12", ["Cruising, walking, first words", "Favourite things at this age", "Birthday letter"]),
    ])

# Pin 85 — Digital Baby Book Ideas
dark_quote_pin("pin85_at_sixteen.png",
    "Your child at sixteen will read everything you wrote today.",
    attribution="Legacy Odyssey keeps it there, at their own .com, for as long as you want it.",
    tag="Digital baby book")

# Pin 86 — Baby Shower Gift Ideas
cream_list_pin("pin86_gift_not_on_registry.png",
    "Baby shower gifts that aren't on any registry",
    ["Their own .com domain (yes, that's a thing now)",
     "A private digital baby book at that domain",
     "Milestones, photos, letters — all in one place",
     "Family visits it from any browser",
     "Works for baby #1 or baby #4",
     "Available as a gift — parents set it up",
     "$29 for the first year"],
    subtext="The gift nobody else thought of.   legacyodyssey.com")

# Pin 87 — Baby First Year Milestones
cream_list_pin("pin87_document_not_photograph.png",
    "Things to document — not just photograph",
    ["Why you chose their middle name",
     "What the room smelled like",
     "How you felt when they were exactly one week old",
     "What songs you sang to them in the dark",
     "The first joke they seemed to understand",
     "What they reached for first",
     "Who they went to and who they didn't",
     "Your honest fears at 4am"],
    subtext="Words outlast photos   legacyodyssey.com")

# Pin 88 — Digital Baby Book Ideas
dark_photo_pin("pin88_family_visits.png",
    os.path.join(PHOTOS_ADS, "family.jpg"),
    "Family visits the book at their .com. No login. No app.",
    subtext="You give them the password. They open it on any device. Grandma, aunts, cousins — everyone who should see it.",
    cta_text="Start their website",
    tag="Digital baby book")

# Pin 89 — Baby First Year Milestones
cream_list_pin("pin89_month_twelve.png",
    "Month 12: things to write before you forget them",
    ["Their first word — how they actually said it",
     "How many teeth they have right now",
     "What they eat and what they refuse",
     "Who they light up for when they enter a room",
     "How they fall asleep",
     "Their favourite sound or toy this week",
     "The funniest thing they did this month",
     "A letter from you, on the last night of their first year"],
    subtext="Write it this week   legacyodyssey.com")

# Pin 90 — Digital Baby Book Ideas
cream_comparison_pin("pin90_sharing_vs_documenting.png",
    "There's a difference between sharing and documenting.",
    "Sharing",
    ["Public or semi-public",
     "Built for likes + comments",
     "Today's post, tomorrow's scroll",
     "You curate for an audience"],
    "Documenting",
    ["Private — for the family",
     "Built for the child to read",
     "There when they're eighteen",
     "You write for them, not for us"])

# Pin 91 — Baby Shower Gift Ideas
dark_photo_pin("pin91_gift_grandparents_love.png",
    os.path.join(PHOTOS_ADS, "hands.jpg"),
    "The baby shower gift grandparents use every single day.",
    subtext="A private website at the baby's own .com. Grandma bookmarks it. She checks it every morning.",
    cta_text="Give it as a gift",
    tag="Baby shower gift ideas")

# Pin 92 — Baby First Year Milestones
dark_headline_pin("pin92_before_first_birthday.png",
    "Three things to do before their first birthday.",
    subtext="1. Write them a letter.\n2. Record their voice.\n3. Write down one thing you know now that you didn't on day one.",
    tag="Baby first year milestones")

# Pin 93 — Digital Baby Book Ideas
cream_list_pin("pin93_five_sections_matter.png",
    "5 sections in your baby's book that actually matter",
    ["Birth story — in your own words, not a caption",
     "Monthly milestones — weight, what changed",
     "Letters — write one now, even a short one",
     "Photos with context — not just the photo",
     "The recipes — what you made for them first"],
    subtext="All of this lives at their .com   legacyodyssey.com")

# Pin 94 — Baby Shower Gift Ideas
dark_headline_pin("pin94_dont_know_what_to_get.png",
    "When you have no idea what to get the new parents.",
    subtext="Get the baby their own .com. A private digital baby book. Something nobody else brought. $29.",
    cta_text="Send as a gift",
    tag="Baby shower gift ideas")

# Pin 95 — Letters to My Child
cream_list_pin("pin95_what_to_write_first.png",
    "What to write in the first letter to your newborn",
    ["Today's date and where you are",
     "What they look like right now",
     "The first thing you noticed about them",
     "What you were afraid of before they arrived",
     "What nobody tells you about this feeling",
     "One promise you want to make",
     "What you hope they remember about you",
     "Sign it with your name — not just 'Mom' or 'Dad'"],
    subtext="Write it somewhere they'll find it   legacyodyssey.com")

# Pin 96 — Digital Baby Book Ideas
dark_photo_pin("pin96_private_corner.png",
    os.path.join(PHOTOS, "baby2.jpg"),
    "A private corner of the internet that belongs to your family.",
    subtext="Not a social feed. Not a group chat. Their own .com — password protected, built around their story.",
    tag="Digital baby book")

# Pin 97 — Letters to My Child
dark_headline_pin("pin97_three_am_letter.png",
    "The letter you'll write at 3am when you can't sleep.",
    subtext="You'll have things to say at 3am that you won't remember in the morning. Write them here.",
    cta_text="Start writing",
    tag="Letters to my child")

# Pin 98 — Baby Shower Gift Ideas
dark_quote_pin("pin98_gift_nobody_forgets.png",
    "The baby shower gift nobody forgets — because the child reads it at eighteen.",
    attribution="A private digital baby book at their own .com. Everything their parents wrote, in one place.",
    tag="Baby shower gift ideas")

# Pin 99 — Letters to My Child
dark_photo_pin("pin99_day_before_changed.png",
    os.path.join(PHOTOS_ADS, "mom.jpg"),
    "A letter from the day before everything changed.",
    subtext="Write it now. About who you were before you became their parent. They'll want to know someday.",
    tag="Letters to my child")

# Pin 100 — Baby First Year Milestones
cream_resource_pin("pin100_complete_first_year.png",
    "The Complete First-Year Baby Book Checklist",
    "Print this. Work through it slowly. No rush.",
    [
        ("From birth", ["Birth story in your words", "First-day photos", "Name origin + meaning"]),
        ("Months 1–6", ["Monthly measurements", "First milestones (smile, laugh, roll)", "One letter per quarter"]),
        ("Months 7–12", ["First foods + reactions", "First steps + first words", "Favourite things at each age"]),
        ("At year one", ["A birthday letter", "Year-one summary", "What surprised you most about parenting"]),
    ])

print(f"\nDone! Pins 71–100 saved to {OUTPUT}")
