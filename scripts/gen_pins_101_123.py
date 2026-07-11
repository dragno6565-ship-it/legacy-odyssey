import os, textwrap
from PIL import Image, ImageDraw, ImageFont

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
        for ln in textwrap.wrap(attribution, width=38):
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
        print(f"  WARN: could not open {photo_path}: {e} - falling back to DARK bg")
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


# --- Generate pins 101-123 (July 19 - August 10, one/day at 12 PM) ---
# Board weighting (data-driven; Baby First Year Milestones = top board):
#   Baby First Year Milestones: 101,103,105,108,110,113,116,118,120,123 (10)
#   Digital Baby Book Ideas:    102,106,109,111,115,119,122 (7)
#   Baby Shower Gift Ideas:     107,112,117 (3)
#   Letters to My Child:        104,114,121 (3)
# NO price mentions anywhere. No real names. No "forever"/"chapter"/"family book".

print("Generating pins 101-123...\n")

# 101 - Baby First Year Milestones - Jul 19
cream_list_pin("pin101_first_foods_checklist.png",
    "First foods: what to write down as they happen",
    ["The very first thing they ever tasted",
     "The face they made (photo or words)",
     "What they loved and what they spat out",
     "The date of their first real meal",
     "Who was there feeding them",
     "The first food they asked for again",
     "Their first time holding the spoon",
     "The mess. Always record the mess."],
    subtext="Save this list   legacyodyssey.com")

# 102 - Digital Baby Book Ideas - Jul 20
dark_headline_pin("pin102_one_place.png",
    "One place for every photo, milestone, and letter.",
    subtext="Legacy Odyssey is a digital baby book at your child's own .com. Everything about them, together, instead of scattered across your phone.",
    cta_text="See how it works",
    tag="Digital baby book")

# 103 - Baby First Year Milestones - Jul 21
dark_photo_pin("pin103_forget_the_details.png",
    os.path.join(PHOTOS, "baby3.jpg"),
    "You'll forget the details. Write them down now.",
    subtext="The exact weight. The sound they made. What today felt like. Six months from now, you'll wish you had.",
    tag="Baby first year milestones")

# 104 - Letters to My Child - Jul 22
dark_quote_pin("pin104_what_the_world_was_like.png",
    "Tell them what the world was like the day they arrived.",
    attribution="A letter they'll open at an age you can't picture yet. Write it while you remember.",
    tag="Letters to my child")

# 105 - Baby First Year Milestones - Jul 23
cream_list_pin("pin105_milestones_nobody_mentions.png",
    "Milestones nobody tells you to write down",
    ["The first time they recognised your voice",
     "The day they reached for you on purpose",
     "The first food they refused",
     "Their first belly laugh",
     "The night they finally slept",
     "The first time they said something almost-a-word",
     "The day they outgrew their newborn clothes",
     "The first time they made you cry happy tears"],
    subtext="Write them in their book   legacyodyssey.com")

# 106 - Digital Baby Book Ideas - Jul 24
cream_comparison_pin("pin106_camera_roll_vs_book.png",
    "Your camera roll vs. a digital baby book",
    "Camera roll",
    ["10,000 photos, no order",
     "No context, no words",
     "Buried by next week",
     "Only on your phone"],
    "Legacy Odyssey",
    ["Photos with the story",
     "Milestones + letters too",
     "Their own .com address",
     "Family can see it anywhere"])

# 107 - Baby Shower Gift Ideas - Jul 25
dark_headline_pin("pin107_still_there_at_18.png",
    "The baby shower gift that's still there when they turn 18.",
    subtext="A private digital baby book at the baby's own .com. Everything the parents write, waiting for the day the child reads it.",
    cta_text="Give as a gift",
    tag="Baby shower gift ideas")

# 108 - Baby First Year Milestones - Jul 26
cream_resource_pin("pin108_first_month_record.png",
    "The New Parent's First-Month Record",
    "The things worth writing down before the newborn blur ends.",
    [
        ("Facts", ["Birth weight, length, time", "Their full name and why", "Who was in the room"]),
        ("Feelings", ["Your first thought when you saw them", "What surprised you most", "One fear, one hope"]),
        ("Firsts", ["First feed, first bath", "First time home", "First night you all slept"]),
    ])

# 109 - Digital Baby Book Ideas - Jul 27
dark_quote_pin("pin109_before_they_could_remember.png",
    "Someday they'll want to know who they were before they could remember.",
    attribution="That's what a digital baby book at their own .com is for. You're the only one who can write it.",
    tag="Digital baby book")

# 110 - Baby First Year Milestones - Jul 28
cream_list_pin("pin110_what_to_write_hard_days.png",
    "What to write on the hard days",
    ["That today was hard, and you showed up anyway",
     "The 3am hour and what got you through it",
     "What they did that made it worth it",
     "One thing you learned about yourself",
     "What you'd tell another new parent tonight",
     "That you love them even on no sleep",
     "The small win nobody else noticed"],
    subtext="The honest pages matter most   legacyodyssey.com")

# 111 - Digital Baby Book Ideas - Jul 29
dark_photo_pin("pin111_whole_life_journey.png",
    os.path.join(PHOTOS, "baby5.jpg"),
    "Their whole life journey, starting now.",
    subtext="Not just a baby book. A private website at your child's own .com that grows with them, year after year.",
    cta_text="Start their site",
    tag="Digital baby book")

# 112 - Baby Shower Gift Ideas - Jul 30
cream_list_pin("pin112_gifts_parents_keep.png",
    "Baby shower gifts new parents actually keep",
    ["A private digital baby book at the baby's .com",
     "Their own domain name, reserved for them",
     "A place for every photo and milestone",
     "Something the grandparents can visit too",
     "A gift that isn't outgrown in a month",
     "Words the child will read years from now"],
    subtext="The one they'll remember   legacyodyssey.com")

# 113 - Baby First Year Milestones - Jul 31
dark_headline_pin("pin113_end_of_month_one.png",
    "The end of month one. Write it down before month two erases it.",
    subtext="How they've already changed. What they do now that they didn't on day one. Who they're becoming.",
    tag="Baby first year milestones")

# 114 - Letters to My Child - Aug 1
cream_list_pin("pin114_letter_to_one_year_old.png",
    "Prompts for a letter to your one-year-old",
    ["What you love most about them right now",
     "The hardest and best part of this year",
     "What they're obsessed with at twelve months",
     "A promise you're making for year two",
     "Who they lit up for this year",
     "What you hope they never lose",
     "Sign it with your name, not just 'Mom' or 'Dad'"],
    subtext="Write it on their birthday   legacyodyssey.com")

# 115 - Digital Baby Book Ideas - Aug 2
dark_headline_pin("pin115_private_by_default.png",
    "Private by default. Yours to share.",
    subtext="A digital baby book at your child's own .com. Password protected. You decide who gets the link - grandparents, aunts, nobody at all.",
    cta_text="See how it works",
    tag="Digital baby book")

# 116 - Baby First Year Milestones - Aug 3
cream_list_pin("pin116_firsts_before_one.png",
    "Firsts to capture before they turn one",
    ["First smile that was really for you",
     "First time rolling over",
     "First solid food",
     "First tooth",
     "First time sitting up alone",
     "First word, however it came out",
     "First steps (or first cruising)",
     "First birthday - and how you felt"],
    subtext="Don't trust your memory. Write it.   legacyodyssey.com")

# 117 - Baby Shower Gift Ideas - Aug 4
dark_photo_pin("pin117_family_opens_for_years.png",
    os.path.join(PHOTOS_ADS, "family.jpg"),
    "A gift the whole family opens for years.",
    subtext="Give the baby their own .com and a private digital baby book. Grandparents bookmark it. Everyone watches the story fill in.",
    cta_text="Give as a gift",
    tag="Baby shower gift ideas")

# 118 - Baby First Year Milestones - Aug 5
dark_photo_pin("pin118_face_never_again.png",
    os.path.join(PHOTOS, "baby7.jpg"),
    "The face they'll never make again.",
    subtext="Every week they become someone slightly new. Write down who they are this week before it's gone.",
    tag="Baby first year milestones")

# 119 - Digital Baby Book Ideas - Aug 6
cream_resource_pin("pin119_start_today.png",
    "How to Start a Digital Baby Book Today",
    "You don't need to be caught up. Start where you are.",
    [
        ("Today", ["Claim their .com name", "Add one photo you love", "Write three sentences about them"]),
        ("This week", ["Their birth story, in your words", "Current weight and milestones", "One letter, even a short one"]),
        ("Ongoing", ["A photo when it matters", "A note when they surprise you", "Invite the family to visit"]),
    ])

# 120 - Baby First Year Milestones - Aug 7
cream_list_pin("pin120_questions_before_they_ask.png",
    "Questions to answer before they can ask them",
    ["How did you choose my name?",
     "What was I like as a newborn?",
     "What did you sing to me?",
     "What was the hardest night?",
     "When did you know you loved me?",
     "What did I do that made you laugh?",
     "What did you hope for me?"],
    subtext="Answer them in their book   legacyodyssey.com")

# 121 - Letters to My Child - Aug 8
dark_quote_pin("pin121_read_alone_someday.png",
    "The words you write today are the ones they'll read alone someday.",
    attribution="Keep them somewhere real - a digital baby book at their own .com, not a caption that scrolls away.",
    tag="Letters to my child")

# 122 - Digital Baby Book Ideas - Aug 9
dark_headline_pin("pin122_not_a_feed.png",
    "Not a feed. Not an app someone else owns.",
    subtext="A digital baby book at your child's own .com - a private website that belongs to them, built to be read, not scrolled past.",
    cta_text="Start their site",
    tag="Digital baby book")

# 123 - Baby First Year Milestones - Aug 10
cream_resource_pin("pin123_keepsake_checklist.png",
    "The First-Year Keepsake Checklist",
    "Print it. Work through it slowly. No rush, no perfect.",
    [
        ("Write", ["Birth story in your words", "One letter per season", "The name origin"]),
        ("Capture", ["Monthly photo, same spot", "First smile, laugh, steps", "Their voice at least once"]),
        ("Record", ["Monthly weight + length", "First foods + reactions", "What surprised you most"]),
    ])

print(f"\nDone! Pins 101-123 saved to {OUTPUT}")
