"""Build the useful-post mockup: photo + multi-paragraph caption."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTO = os.path.join(HERE, "u_diaper_6393191.jpg")

CAPTION = """Nobody warns you how much of newborn care is just math.

One of the simplest signs your baby is getting enough milk is the diaper count. A rough guide for the first week:

— Day 1: about 1 wet diaper
— Day 2: about 2
— Day 3: about 3
— Day 5 and on: 6+ wet diapers a day, plus 3 or more dirty ones

Consistently fewer than that — or dark, scant urine — is worth a call to your pediatrician. When you're not sure, ask. That's what they're there for."""

W = 1080
IMG = 1080
PAD = 56
HEADER_H = 132
DARK = (26, 21, 16)
GRAY = (138, 126, 107)
GOLD = (200, 169, 110)
WHITE = (255, 255, 255)
LINE_H = 52

def font(sz, bold=False):
    p = "C:/Windows/Fonts/" + ("segoeuib.ttf" if bold else "segoeui.ttf")
    return ImageFont.truetype(p, sz) if os.path.exists(p) else ImageFont.load_default()

def wrap(draw, text, fnt, max_w):
    lines = []
    for para in text.split("\n"):
        if para.strip() == "":
            lines.append("")
            continue
        cur = ""
        for w in para.split():
            test = (cur + " " + w).strip()
            if draw.textlength(test, font=fnt) <= max_w:
                cur = test
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
    return lines

def crop_square(im):
    w, h = im.size
    s = min(w, h)
    return im.crop(((w-s)//2, (h-s)//2, (w-s)//2+s, (h-s)//2+s)).resize((IMG, IMG))

cap_font = font(40)
name_font = font(34, bold=True)
sub_font = font(26)

tmp = ImageDraw.Draw(Image.new("RGB", (10, 10)))
lines = wrap(tmp, CAPTION, cap_font, W - 2*PAD)
cap_h = len(lines)*LINE_H + 2*PAD

total_h = HEADER_H + IMG + cap_h
card = Image.new("RGB", (W, total_h), WHITE)
draw = ImageDraw.Draw(card)

# header
draw.ellipse([PAD, 30, PAD+72, 102], fill=DARK)
draw.text((PAD+36, 66), "LO", font=name_font, fill=GOLD, anchor="mm")
draw.text((PAD+96, 44), "Legacy Odyssey", font=name_font, fill=DARK)
draw.text((PAD+96, 84), "Just now", font=sub_font, fill=GRAY)

# photo
card.paste(crop_square(Image.open(PHOTO).convert("RGB")), (0, HEADER_H))

# caption
y = HEADER_H + IMG + PAD
for ln in lines:
    draw.text((PAD, y), ln, font=cap_font, fill=DARK)
    y += LINE_H

out = os.path.join(HERE, "mockup_useful_1.png")
card.save(out)
print(f"saved {out}  ({W}x{total_h})")
