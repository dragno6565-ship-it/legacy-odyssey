"""Composite chosen photos + deadpan captions into social post mockups."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))

# (photo file, caption)
POSTS = [
    ("grumpy_14407425.jpg",
     "He has not agreed to a single thing that has happened today."),
    ("grumpy_6219874.jpg",
     "Four months old. Has reviewed our work. Has notes."),
    ("surprised_2505061.jpg",
     "Someone two rooms away said the word “bath.”"),
    ("messy_11787679.jpg",
     "He ate roughly none of it. The high chair did great."),
    ("yawn_30654962.jpg",
     "It's 11 a.m. He is exhausted. From what, we may never know."),
]

W = 1080
IMG = 1080            # square photo
PAD = 48
HEADER_H = 132
CREAM = (250, 247, 242)
DARK = (26, 21, 16)
GRAY = (138, 126, 107)
GOLD = (200, 169, 110)
WHITE = (255, 255, 255)

def font(sz, bold=False):
    base = "C:/Windows/Fonts/"
    for name in (["segoeuib.ttf"] if bold else ["segoeui.ttf"]):
        p = base + name
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=fnt) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

def crop_square(im):
    w, h = im.size
    s = min(w, h)
    return im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((IMG, IMG))

def build(photo, caption, idx):
    cap_font = font(46)
    name_font = font(34, bold=True)
    sub_font = font(26)

    tmp = Image.new("RGB", (10, 10))
    d = ImageDraw.Draw(tmp)
    lines = wrap(d, caption, cap_font, W - 2 * PAD)
    cap_h = len(lines) * 60 + 2 * PAD

    total_h = HEADER_H + IMG + cap_h
    card = Image.new("RGB", (W, total_h), WHITE)
    draw = ImageDraw.Draw(card)

    # header: avatar + page name
    draw.ellipse([PAD, 30, PAD + 72, 102], fill=DARK)
    draw.text((PAD + 36, 66), "LO", font=name_font, fill=GOLD, anchor="mm")
    draw.text((PAD + 96, 44), "Legacy Odyssey", font=name_font, fill=DARK)
    draw.text((PAD + 96, 84), "Just now", font=sub_font, fill=GRAY)

    # photo
    card.paste(crop_square(Image.open(photo).convert("RGB")), (0, HEADER_H))

    # caption
    y = HEADER_H + IMG + PAD
    for ln in lines:
        draw.text((PAD, y), ln, font=cap_font, fill=DARK)
        y += 60

    out = os.path.join(HERE, f"mockup_{idx}.png")
    card.save(out)
    print(f"  mockup_{idx}.png  ({W}x{total_h})")
    return out

if __name__ == "__main__":
    for i, (p, c) in enumerate(POSTS, 1):
        build(os.path.join(HERE, p), c, i)
    print("Done.")
