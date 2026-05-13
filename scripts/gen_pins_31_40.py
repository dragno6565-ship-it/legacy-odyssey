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


# ── Generate pins 31–40 ───────────────────────────────────────────────────────

print("Generating pins 31–40...\n")

# Pin 31 — Digital Baby Book Ideas
dark_headline_pin("pin31_own_dot_com.png",
    "Your baby deserves their own .com.",
    subtext="Not a shared app. Not Instagram. A private website built just for them. Password-protected. Beautiful. Yours forever.",
    cta_text="Claim their .com",
    tag="Digital baby book")

# Pin 32 — Digital Baby Book Ideas
cream_list_pin("pin32_what_to_put_in_baby_book.png",
    "What to actually put in a digital baby book",
    ["Their birth story in your own words",
     "A photo from every single month",
     "The first time you heard them laugh",
     "What their room smelled like",
     "Letters from grandparents",
     "Your favourite photo of just the two of you",
     "What you were most afraid of",
     "What surprised you most about parenthood"],
    subtext="Save this   legacyodyssey.com")

# Pin 33 — Baby First Year Milestones
dark_quote_pin("pin33_first_word.png",
    "One day they will ask you what their first word was.",
    attribution="Write it down now, while you still remember.",
    tag="Baby book ideas")

# Pin 34 — Digital Baby Book Ideas
cream_comparison_pin("pin34_app_vs_legacy.png",
    "Your baby's book: shared app vs. their own .com",
    "Baby apps",
    ["Their photos on someone else's server",
     "Shut down if the company closes",
     "Shared with other families",
     "Generic URL no one will remember"],
    "Legacy Odyssey",
    ["Private .com that belongs to them",
     "Yours to keep forever",
     "Password-protected just for family",
     "A real web address. Their name."])

# Pin 35 — Letters to My Child
dark_headline_pin("pin35_imagine_at_18.png",
    "Imagine your child at 18, reading everything you wrote.",
    subtext="Every milestone. Every first. Every letter you were too emotional to say out loud. All waiting for them.",
    cta_text="Start writing now",
    tag="Letters to my child")

# Pin 36 — Digital Baby Book Ideas
cream_list_pin("pin36_baby_book_mistakes.png",
    "8 baby book mistakes new parents make",
    ["Waiting until you have time (you never will)",
     "Only saving the perfect photos",
     "Forgetting to write down the feelings",
     "Not asking grandparents to contribute",
     "Skipping the hard months",
     "Trusting Instagram to preserve memories",
     "No backup plan if the app shuts down",
     "Starting too late to remember the details"],
    subtext="Avoid all of these   legacyodyssey.com")

# Pin 37 — Digital Baby Book Ideas
dark_headline_pin("pin37_their_name_their_com.png",
    "Their name. Their story. Their own .com.",
    subtext="Legacy Odyssey gives your baby a private website from day one. No algorithm. No strangers. Just family.",
    cta_text="Start for $29",
    tag="Digital baby book")

# Pin 38 — Baby First Year Milestones
cream_resource_pin("pin38_first_year_checklist.png",
    "First Year Baby Book Checklist",
    "Save this and work through it at your own pace.",
    [
        ("Birth", ["Write the birth story this week", "Note the exact time, weight, length"]),
        ("Months 1–6", ["One photo milestone per month", "First smile, laugh, roll, food"]),
        ("Months 7–12", ["First word, steps, tooth", "A letter for their first birthday"]),
    ])

# Pin 39 — Baby First Year Milestones
dark_quote_pin("pin39_wont_remember.png",
    "You will not remember every detail. That is what the book is for.",
    attribution="Start small. One sentence. One photo. One memory at a time.",
    tag="New parent reminder")

# Pin 40 — Digital Baby Book Ideas
dark_headline_pin("pin40_not_on_servers.png",
    "Most baby apps store your child's photos on their servers.",
    subtext="With Legacy Odyssey, the story lives at your baby's own .com. Private. Password-protected. No third-party ads.",
    cta_text="See the difference",
    tag="Digital baby book")

print(f"\nDone! Pins 31–40 saved to {OUTPUT}")
