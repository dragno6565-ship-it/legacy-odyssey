"""Realign 8 pins in the 98-123 batch to rule #16 (not just a baby book / whole
life journey) + privacy-first. Regenerates INTO THE SAME filenames (CDN upsert
overwrites). Fixes: first-year/first-month caps, a 'story' word-ban slip (pin117),
and strengthens the core product pins to lead lifelong + private."""
import os, textwrap
from PIL import Image, ImageDraw, ImageFont

OUTPUT = r"F:\legacy-odyssey\pinterest-pins"
PHOTOS = r"F:\legacy-odyssey\marketing\facebook\fb-posts"
PHOTOS_ADS = r"F:\legacy-odyssey\ads\photos"
W, H = 1000, 1500
CREAM=(248,242,230); DARK=(30,24,18); GOLD=(184,147,90); GOLD_DIM=(140,110,65)
MID=(120,110,95); OLIVE=(72,80,50)
FONT_DIR = r"C:\Windows\Fonts"

def fnt(name, size):
    try: return ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    except: return ImageFont.load_default()

def gold_rule(draw, y, pad=90):
    draw.rectangle([(pad, y), (W - pad, y + 2)], fill=GOLD)

def logo_footer(img, dark_bg=True):
    draw = ImageDraw.Draw(img)
    gold_rule(draw, H - 190)
    lf = fnt("georgiab.ttf", 34); text = "LEGACY ODYSSEY"
    bbox = draw.textbbox((0, 0), text, font=lf)
    draw.text(((W - bbox[2]) // 2, H - 168), text, font=lf, fill=GOLD if dark_bg else DARK)
    uf = fnt("calibri.ttf", 26); url = "legacyodyssey.com"
    bbox2 = draw.textbbox((0, 0), url, font=uf)
    draw.text(((W - bbox2[2]) // 2, H - 122), url, font=uf, fill=MID if dark_bg else (150,135,110))

def dark_headline_pin(filename, headline, subtext=None, cta_text=None, tag=None):
    img = Image.new("RGB", (W, H), DARK); d = ImageDraw.Draw(img)
    gold_rule(d, 100); y = 165
    if tag:
        tf = fnt("calibri.ttf", 30); bbox = d.textbbox((0, 0), tag.upper(), font=tf)
        d.text(((W - bbox[2]) // 2, y), tag.upper(), font=tf, fill=GOLD); y += 65
    hf = fnt("georgiab.ttf", 72)
    for ln in textwrap.wrap(headline, width=20):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, y), ln, font=hf, fill=CREAM); y += int((bbox[3]-bbox[1])*1.25)
    if subtext:
        y += 44; sf = fnt("calibri.ttf", 38)
        for ln in textwrap.wrap(subtext, width=32):
            bbox = d.textbbox((0, 0), ln, font=sf)
            d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=MID); y += 52
    if cta_text:
        y += 44; cf = fnt("calibrib.ttf", 36); bbox = d.textbbox((0, 0), cta_text, font=cf)
        bw = bbox[2] + 64; bx = (W - bw) // 2
        d.rounded_rectangle([(bx, y), (bx + bw, y + 60)], radius=30, outline=GOLD, width=2)
        d.text((bx + 32, y + 12), cta_text, font=cf, fill=GOLD)
    logo_footer(img, dark_bg=True); img.save(os.path.join(OUTPUT, filename)); print(f"  ok {filename}")

def cream_list_pin(filename, headline, items, subtext=None):
    img = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(img)
    gold_rule(d, 80); y = 120; hf = fnt("georgiab.ttf", 62)
    for ln in textwrap.wrap(headline, width=22):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, y), ln, font=hf, fill=DARK); y += int((bbox[3]-bbox[1])*1.2)
    y += 28; gold_rule(d, y); y += 38; bf = fnt("calibri.ttf", 36)
    for item in items:
        d.ellipse([(82, y + 13), (95, y + 26)], fill=GOLD)
        d.text((115, y), item, font=bf, fill=DARK); y += 54
    if subtext:
        y += 22; sf = fnt("calibrii.ttf", 32)
        for ln in textwrap.wrap(subtext, width=40):
            bbox = d.textbbox((0, 0), ln, font=sf)
            d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=MID); y += 44
    logo_footer(img, dark_bg=False); img.save(os.path.join(OUTPUT, filename)); print(f"  ok {filename}")

def cream_resource_pin(filename, headline, intro, sections):
    img = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(img)
    d.rectangle([(0, 0), (W, 230)], fill=OLIVE); hf = fnt("georgiab.ttf", 58); hy = 28
    for ln in textwrap.wrap(headline, width=26):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, hy), ln, font=hf, fill=CREAM); hy += int((bbox[3]-bbox[1])*1.15)
    gold_rule(d, 230); y = 262; sf = fnt("calibrii.ttf", 34)
    for ln in textwrap.wrap(intro, width=40):
        bbox = d.textbbox((0, 0), ln, font=sf)
        d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=MID); y += 46
    y += 18; stf = fnt("georgiab.ttf", 36); bf = fnt("calibri.ttf", 32)
    for sec_title, items in sections:
        d.rectangle([(70, y), (W - 70, y + 52)], fill=GOLD)
        bbox = d.textbbox((0, 0), sec_title, font=stf)
        d.text(((W - bbox[2]) // 2, y + 8), sec_title, font=stf, fill=DARK); y += 68
        for item in items:
            d.ellipse([(82, y + 10), (92, y + 20)], fill=DARK)
            d.text((108, y), item, font=bf, fill=DARK); y += 46
        y += 14
    logo_footer(img, dark_bg=False); img.save(os.path.join(OUTPUT, filename)); print(f"  ok {filename}")

def dark_photo_pin(filename, photo_path, headline, subtext=None, tag=None, cta_text=None):
    try: photo = Image.open(photo_path).convert("RGB")
    except Exception as e:
        print(f"  WARN {photo_path}: {e}"); dark_headline_pin(filename, headline, subtext, cta_text, tag); return
    pw, ph = photo.size; tr = W / H
    if pw / ph > tr:
        nw = int(ph * tr); left = (pw - nw) // 2; photo = photo.crop((left, 0, left + nw, ph))
    else:
        nh = int(pw / tr); top = (ph - nh) // 2; photo = photo.crop((0, top, pw, top + nh))
    photo = photo.resize((W, H), Image.LANCZOS)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(overlay)
    for i in range(H):
        t = i / H
        alpha = int(200 - t*180) if t < 0.45 else (120 if t < 0.55 else int(120 + (t-0.55)*340))
        alpha = min(220, max(90, alpha)); od.line([(0, i), (W, i)], fill=(20, 15, 10, alpha))
    img = Image.alpha_composite(photo.convert("RGBA"), overlay).convert("RGB"); d = ImageDraw.Draw(img)
    gold_rule(d, 100); y = 155
    if tag:
        tf = fnt("calibri.ttf", 30); bbox = d.textbbox((0, 0), tag.upper(), font=tf)
        d.text(((W - bbox[2]) // 2, y), tag.upper(), font=tf, fill=GOLD); y += 65
    hf = fnt("georgiab.ttf", 72)
    for ln in textwrap.wrap(headline, width=20):
        bbox = d.textbbox((0, 0), ln, font=hf)
        d.text(((W - bbox[2]) // 2, y), ln, font=hf, fill=CREAM); y += int((bbox[3]-bbox[1])*1.25)
    if subtext:
        y += 44; sf = fnt("calibri.ttf", 38)
        for ln in textwrap.wrap(subtext, width=30):
            bbox = d.textbbox((0, 0), ln, font=sf)
            d.text(((W - bbox[2]) // 2, y), ln, font=sf, fill=CREAM); y += 52
    if cta_text:
        y += 44; cf = fnt("calibrib.ttf", 36); bbox = d.textbbox((0, 0), cta_text, font=cf)
        bw = bbox[2] + 64; bx = (W - bw) // 2
        d.rounded_rectangle([(bx, y), (bx + bw, y + 60)], radius=30, outline=GOLD, width=2)
        d.text((bx + 32, y + 12), cta_text, font=cf, fill=GOLD)
    logo_footer(img, dark_bg=True); img.save(os.path.join(OUTPUT, filename)); print(f"  ok {filename}")


print("Realigning 8 pins to rule #16 + privacy-first...\n")

# 100 - was "Complete First-Year Baby Book Checklist" -> lifelong keepsake
cream_resource_pin("pin100_complete_first_year.png",
    "Your Child's Keepsake Checklist",
    "Not just a baby book - the record that keeps growing with them.",
    [
        ("Now", ["Birth story in your words", "First photos + measurements", "Their name and lineage"]),
        ("Each year", ["Birthdays, holidays, big firsts", "Report cards, awards, artwork", "A letter on their birthday"]),
        ("Private, always", ["Their own .com domain", "Password-protected, invite-only", "Never public or searchable"]),
    ])

# 102 - was neutral product pin -> lead lifelong + private
dark_headline_pin("pin102_one_place.png",
    "One place for their whole life journey.",
    subtext="Not just a baby book. Every photo, milestone, birthday, award, and letter - on a private website at your child's own .com that grows with them.",
    cta_text="See how it works", tag="Digital baby book")

# 108 - was "The New Parent's First-Month Record" -> uncapped, grows
cream_resource_pin("pin108_first_month_record.png",
    "The New Parent's Record",
    "Start it as a baby book. It becomes their whole life journey.",
    [
        ("Facts", ["Birth weight, length, time", "Their full name and why", "Who was in the room"]),
        ("Feelings", ["Your first thought when you saw them", "What surprised you most", "One fear, one hope"]),
        ("Keeps growing", ["Milestones + birthdays for years", "Report cards, awards, artwork", "Private, at their own .com"]),
    ])

# 113 - was "The end of month one" -> implies continuation
dark_headline_pin("pin113_end_of_month_one.png",
    "Month one goes fast. So does every month after.",
    subtext="Write down who they are right now - and keep writing, year after year, on a private website at your child's own .com that's truly theirs.")

# 116 - was "Firsts to capture before they turn one" -> spans childhood
cream_list_pin("pin116_firsts_before_one.png",
    "The firsts worth capturing",
    ["First smile that was really for you",
     "First words, first steps",
     "First day of school, years from now",
     "First time they made you cry happy",
     "Every birthday, big and small",
     "The firsts you don't see coming",
     "Write them as they happen"],
    subtext="On a private site that grows with them   legacyodyssey.com")

# 117 - fix 'story' word-ban slip + keep gift/lifelong + private
dark_photo_pin("pin117_family_opens_for_years.png",
    os.path.join(PHOTOS_ADS, "family.jpg"),
    "A gift the whole family opens for years.",
    subtext="Give the baby their own private .com - a digital baby book that grows into their whole life journey. Grandparents bookmark it and watch it fill in.",
    cta_text="Give as a gift", tag="Baby shower gift ideas")

# 119 - add lifelong + privacy to the resource
cream_resource_pin("pin119_start_today.png",
    "How to Start Today",
    "It begins as a baby book and becomes their whole life journey.",
    [
        ("Today", ["Claim their .com name", "Add one photo you love", "Write three sentences about them"]),
        ("This year and beyond", ["Milestones, birthdays, firsts", "Report cards, awards, artwork", "A letter when it matters"]),
        ("Private always", ["Password-protected + invite-only", "Never public or searchable", "A site that's truly theirs"]),
    ])

# 123 - was "The First-Year Keepsake Checklist" -> lifelong
cream_resource_pin("pin123_keepsake_checklist.png",
    "The Keepsake Checklist",
    "Not just a baby book - it grows with your child for years.",
    [
        ("Write", ["Birth story in your words", "A letter each birthday", "The name and lineage"]),
        ("Capture", ["Milestones at every age", "Report cards, awards, artwork", "Photos and videos that matter"]),
        ("Keep it private", ["Their own .com domain", "Password-protected, invite-only", "Never public, never searchable"]),
    ])

print(f"\nDone! 8 realigned pins saved to {OUTPUT}")
