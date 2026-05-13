import os, textwrap
from PIL import Image, ImageDraw, ImageFont

OUTPUT = r"F:\legacy-odyssey\pinterest-pins"
os.makedirs(OUTPUT, exist_ok=True)

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

# ── helpers ──────────────────────────────────────────────────────────────────

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

# ── pin templates ─────────────────────────────────────────────────────────────

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


# ── Generate all 20 pins ──────────────────────────────────────────────────────

print("Generating 20 Pinterest pins...\n")

dark_quote_pin("pin11_days_are_long.png",
    "The days are long, but the years are short.",
    attribution="Write it all down before it is gone.",
    tag="A reminder for new parents")

cream_list_pin("pin12_birth_story_5_things.png",
    "5 things to write in your baby's birth story before you forget",
    ["The exact moment you knew they had arrived",
     "Who was in the room and what they said",
     "Your first thought when you saw their face",
     "What the room smelled and sounded like",
     "The first thing you whispered to them"],
    subtext="Save this   legacyodyssey.com")

dark_quote_pin("pin13_being_your_mom.png",
    "Being your mom is the best thing I have ever done.",
    attribution="A letter sealed for her 18th birthday",
    tag="Write it down")

dark_headline_pin("pin14_greatest_adventure.png",
    "You are my greatest adventure.",
    subtext="Every first. Every milestone. Every tiny moment that changed everything.",
    cta_text="Start your baby's book")

cream_resource_pin("pin15_how_to_start.png",
    "How to Start a Digital Baby Book",
    "A simple guide for overwhelmed new parents.",
    [
        ("The Birth Story", ["Write it from memory  imperfect is fine", "Add photos from the hospital"]),
        ("The First Year", ["One milestone per month is enough", "Short notes beat long essays"]),
        ("Letters to Them", ["Write one now  even if it is just three lines", "Seal it  Open it later"]),
    ])

dark_quote_pin("pin16_love_at_first_sight.png",
    "Before I had you, I never understood love at first sight.",
    attribution="Write your letter   legacyodyssey.com",
    tag="A letter to my child")

cream_list_pin("pin17_monthly_milestones.png",
    "First year baby milestones: what to document each month",
    ["Month 1   First smile and weight check",
     "Month 2   First laugh or coo",
     "Month 3   Holding their head up",
     "Month 4   Reaching and grabbing",
     "Month 6   First solid food",
     "Month 9   First word sounds",
     "Month 12  First steps"],
    subtext="Save this for later")

dark_headline_pin("pin18_time_vault.png",
    "Write letters now. They open on your child's 18th birthday.",
    subtext="The Legacy Odyssey Time Vault. Sealed memories, delivered at exactly the right moment.",
    cta_text="Start the countdown",
    tag="The Time Vault")

dark_headline_pin("pin19_shower_gift.png",
    "The baby shower gift no one thinks to give.",
    subtext="A private digital baby book. Their own .com. A Time Vault sealed until adulthood.",
    cta_text="Give the gift",
    tag="Meaningful gifts for new parents")

cream_comparison_pin("pin20_claim_name.png",
    "Is your child's name available as a .com?",
    "Gone forever",
    ["EllaBrooks.com", "LiamMorris.com", "OliverJames.com", "NoahReed.com"],
    "Legacy Odyssey",
    ["Private and secure", "Unlimited photos", "Time Vault included", "Their story forever"])

dark_headline_pin("pin21_every_first.png",
    "First smile. First laugh. First word.",
    subtext="Every first deserves to be written down before the years blur them together.",
    cta_text="Document every first",
    tag="Baby first year")

cream_list_pin("pin22_milestone_tracker.png",
    "Baby milestones parents wish they had written down",
    ["The way they smelled as a newborn",
     "Their first real belly laugh",
     "What they looked like sleeping",
     "The exact weight at every checkup",
     "What you were feeling at 3 a.m.",
     "Their first word and second word",
     "The day everything felt normal again"],
    subtext="Save this   Document yours at legacyodyssey.com")

cream_list_pin("pin23_grandparents.png",
    "How to include grandparents in your baby's book",
    ["Invite them to write a letter to the child",
     "Ask them to share a family recipe",
     "Record a family story only they know",
     "Add their photo to the family profiles",
     "Let them write a Time Vault entry"],
    subtext="Legacy Odyssey   legacyodyssey.com")

dark_headline_pin("pin24_gift_for_moms.png",
    "The most meaningful gift you can give a new mom.",
    subtext="Help her preserve the story only she can tell. A digital baby book. A Time Vault. Their own .com.",
    cta_text="Gift Legacy Odyssey",
    tag="Gifts for new parents")

dark_quote_pin("pin25_never_too_late.png",
    "It is never too late to start writing it down.",
    attribution="Start today. The memories are still there.",
    tag="For every stage of parenthood")

dark_headline_pin("pin26_not_instagram.png",
    "We stopped sharing baby photos on Instagram.",
    subtext="Private. Password-protected. On your own .com. No algorithm. No strangers.",
    cta_text="See how it works",
    tag="Family privacy")

cream_list_pin("pin27_birth_day_12.png",
    "12 things about your baby's birth day you will want to remember",
    ["The date, time, and exact minute",
     "Who called first when you shared the news",
     "What the weather was like outside",
     "What your partner said when they first held them",
     "The nurse or doctor who delivered them",
     "What you ate afterward (you were starving)",
     "Your first photo together",
     "The first family member to visit",
     "What you were most afraid of",
     "The moment fear turned to love",
     "What you whispered when no one was listening",
     "The song or show playing in the background"],
    subtext="Save this   legacyodyssey.com")

dark_quote_pin("pin28_18th_birthday.png",
    "On your child's 18th birthday, the Time Vault opens.",
    attribution="Every letter. Every photo. Every milestone. Delivered at exactly the right moment.",
    tag="Legacy Odyssey Time Vault")

dark_headline_pin("pin29_private_corner.png",
    "Every family deserves their own private corner of the internet.",
    subtext="Not Instagram. Not Facebook. Your own .com, just for the people who matter most.",
    cta_text="Claim your family's .com",
    tag="Family photo albums")

cream_list_pin("pin30_questions_grandparents.png",
    "10 questions to ask your parents before they forget",
    ["What was I like as a baby?",
     "What was your greatest fear when I was born?",
     "What traditions did you hope I would carry on?",
     "What do you wish you had written down?",
     "What is your earliest memory of me?",
     "What were you most proud of in my first year?",
     "What recipe do you want me to always have?",
     "What family story am I old enough to finally hear?",
     "What do you want me to remember about you?",
     "What would you tell your younger self as a new parent?"],
    subtext="Save this   Capture their answers at legacyodyssey.com")

print(f"\nDone! All 20 pins saved to {OUTPUT}")
