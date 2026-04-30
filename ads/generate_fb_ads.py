"""
Legacy Odyssey — Facebook Ads Campaign
Heirloom Modern design philosophy.
Generates five 1080x1080 PNG compositions.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W = H = 1080
OUT = os.path.dirname(os.path.abspath(__file__))

# Palette
CREAM   = (250, 247, 242)
DARK    = (26, 21, 16)
GOLD    = (200, 169, 110)
GOLD_DK = (176, 142, 74)
MUTED   = (138, 126, 107)
CARD    = (240, 232, 220)
HAIR    = (210, 198, 178)

F = os.path.join(OUT, "fonts")
def font(name, size):
    return ImageFont.truetype(os.path.join(F, name), size)

# Font helpers
def serif(sz, italic=False, bold=False, semi=False):
    if bold:   return font("CormorantGaramond-Bold.ttf", sz)
    if semi:   return font("CormorantGaramond-SemiBold.ttf", sz)
    if italic: return font("CormorantGaramond-Italic.ttf", sz)
    return font("CormorantGaramond-Regular.ttf", sz)

def sans(sz, weight="regular"):
    return font({
        "light":    "Jost-Light.ttf",
        "regular":  "Jost-Regular.ttf",
        "medium":   "Jost-Medium.ttf",
        "semi":     "Jost-SemiBold.ttf",
    }[weight], sz)

# ── utilities ────────────────────────────────────────────────────────────────
def text_w(draw, txt, fnt, tracking=0):
    bbox = draw.textbbox((0,0), txt, font=fnt)
    base = bbox[2] - bbox[0]
    if tracking and len(txt) > 1:
        base += tracking * (len(txt) - 1)
    return base

def draw_tracked(draw, xy, txt, fnt, fill, tracking=0, anchor="la"):
    x, y = xy
    if anchor == "mm":
        total = text_w(draw, txt, fnt, tracking)
        bbox = draw.textbbox((0,0), txt, font=fnt)
        h = bbox[3] - bbox[1]
        x -= total / 2
        y -= h / 2 + bbox[1]
    cx = x
    for ch in txt:
        draw.text((cx, y), ch, font=fnt, fill=fill)
        cx += text_w(draw, ch, fnt) + tracking

def wrap(draw, text, fnt, maxw):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if text_w(draw, test, fnt) <= maxw:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def load_photo(name, target_w, target_h, focus_y=0.5):
    img = Image.open(os.path.join(OUT, "photos", name)).convert("RGB")
    src_w, src_h = img.size
    # scale so that the target fits entirely
    sc = max(target_w / src_w, target_h / src_h)
    new_w, new_h = int(src_w * sc), int(src_h * sc)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    # center crop with vertical focus
    left = (new_w - target_w) // 2
    top  = int((new_h - target_h) * focus_y)
    top  = max(0, min(top, new_h - target_h))
    return img.crop((left, top, left + target_w, top + target_h))

def warm_tone(img, strength=0.06):
    """Subtle warm grade — lift shadows in red/yellow, cool the blues slightly."""
    r, g, b = img.split()
    r = r.point(lambda v: min(255, int(v + 255*strength*0.7)))
    g = g.point(lambda v: min(255, int(v + 255*strength*0.25)))
    b = b.point(lambda v: max(0, int(v - 255*strength*0.5)))
    return Image.merge("RGB", (r,g,b))

def soft_vignette(img, amount=0.22):
    w, h = img.size
    mask = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(mask)
    # radial-ish gradient using stacked ellipses
    steps = 40
    for i in range(steps):
        alpha = int(255 * (1 - (i / steps) * amount))
        pad = int((i / steps) * w * 0.35)
        d.ellipse([-pad, -pad, w + pad, h + pad], fill=alpha)
    mask = mask.filter(ImageFilter.GaussianBlur(60))
    shade = Image.new("RGB", (w,h), (20, 14, 8))
    return Image.composite(img, shade, mask)

def hairline(draw, x1, y1, x2, y2, color=HAIR, width=1):
    draw.line([(x1,y1),(x2,y2)], fill=color, width=width)

def gold_pill(canvas, cx, cy, text, w=None, h=62, tracking=2):
    d = ImageDraw.Draw(canvas)
    f = sans(18, "medium")
    tw = text_w(d, text, f, tracking)
    if w is None:
        w = tw + 80
    x1, y1 = int(cx - w/2), int(cy - h/2)
    x2, y2 = int(cx + w/2), int(cy + h/2)
    # pill with rounded ends
    r = h // 2
    d.rounded_rectangle([x1, y1, x2, y2], radius=r, fill=GOLD)
    # faint inner line for that engraved feel
    d.rounded_rectangle([x1+3, y1+3, x2-3, y2-3], radius=r-3, outline=(220,195,148), width=1)
    # text — uppercase tracked
    draw_tracked(d, (cx, cy), text, f, CREAM, tracking=tracking, anchor="mm")

def wordmark(draw, x, y, anchor="la", color=None):
    color = color or DARK
    f = serif(22, semi=True)
    txt = "LEGACY ODYSSEY"
    # tracked small caps
    draw_tracked(draw, (x, y), txt, sans(13, "medium"), color, tracking=3, anchor=anchor)

def corner_mark(canvas, x, y, color=DARK):
    d = ImageDraw.Draw(canvas)
    # small monogram: L·O inside a thin circle
    r = 22
    d.ellipse([x-r, y-r, x+r, y+r], outline=color, width=1)
    f = serif(22, semi=True)
    draw_tracked(d, (x, y+1), "LO", f, color, tracking=1, anchor="mm")

# ── Ad 1: "The Website" — editorial top-photo / bottom-text ─────────────────
def ad1():
    photo_h = 640
    img = Image.new("RGB", (W, H), CREAM)
    d   = ImageDraw.Draw(img)

    ph = load_photo("baby_hands.jpg", W, photo_h, focus_y=0.45)
    ph = warm_tone(ph, 0.05)
    img.paste(ph, (0, 0))

    # caption rail at top of photo
    d2 = ImageDraw.Draw(img)
    draw_tracked(d2, (64, 44), "ISSUE 01 · A PRIVATE WEBSITE", sans(13, "light"), CREAM, tracking=3)
    draw_tracked(d2, (W-64, 44), "LEGACYODYSSEY.COM", sans(13, "light"), CREAM, tracking=3, anchor="ra")

    # hairline under photo
    hairline(d, 64, photo_h + 40, W - 64, photo_h + 40)

    # small eyebrow
    draw_tracked(d, (64, photo_h + 62), "NO. 01  —  THE WEBSITE", sans(12, "medium"), GOLD_DK, tracking=4)

    # headline
    hy = photo_h + 96
    head_font = serif(62, semi=True)
    l1 = "They're not your parents'"
    l2 = "baby books."
    d.text((64, hy), l1, font=head_font, fill=DARK)
    d.text((64, hy + 66), l2, font=serif(62, italic=True), fill=DARK)

    # body
    by = hy + 158
    body_font = sans(20, "light")
    body = ("Legacy Odyssey gives your baby their own .com website — "
            "beautiful, private, and built to last. Every milestone, "
            "photo, and letter, elegantly preserved.")
    for line in wrap(d, body, body_font, 640):
        d.text((64, by), line, font=body_font, fill=MUTED)
        by += 30

    # CTA + wordmark
    gold_pill(img, 64 + 150, H - 78, "START FOR $29", w=300, tracking=3)
    draw_tracked(d, (W - 64, H - 72), "LEGACY ODYSSEY", sans(13, "medium"), DARK, tracking=4, anchor="ra")
    draw_tracked(d, (W - 64, H - 52), "a family heirloom, online.", serif(18, italic=True), MUTED, anchor="ra")

    img.save(os.path.join(OUT, "fb_ad_1_website.png"))
    print("Saved fb_ad_1_website.png")

# ── Ad 2: "The App" — photo left / text right ────────────────────────────────
def ad2():
    img = Image.new("RGB", (W, H), CREAM)
    d   = ImageDraw.Draw(img)

    pw = 600
    ph = load_photo("mom.jpg", pw, H, focus_y=0.4)
    ph = warm_tone(ph, 0.04)
    img.paste(ph, (0, 0))

    # thin gold vertical rule right of photo
    d.line([(pw + 0, 0), (pw, H)], fill=HAIR, width=1)

    # right column
    col_x = pw + 60
    col_w = W - col_x - 64

    # small eyebrow
    draw_tracked(d, (col_x, 120), "NO. 02  —  THE APP", sans(12, "medium"), GOLD_DK, tracking=4)
    hairline(d, col_x, 146, col_x + 60, 146, color=GOLD, width=2)

    # headline — stacked
    hf = serif(54, semi=True)
    hi = serif(54, italic=True)
    y = 190
    d.text((col_x, y),       "They're not",          font=hf, fill=DARK)
    d.text((col_x, y + 58),  "your parents'",        font=hf, fill=DARK)
    d.text((col_x, y + 116), "baby books.",          font=hi, fill=DARK)

    # body
    by = y + 220
    body_font = sans(18, "light")
    body = ("Fill in your baby's story from your phone in minutes. "
            "Legacy Odyssey — the elegant digital baby book with its "
            "own .com domain.")
    for line in wrap(d, body, body_font, col_w):
        d.text((col_x, by), line, font=body_font, fill=MUTED)
        by += 28

    # small meta line
    hairline(d, col_x, by + 18, col_x + col_w, by + 18)
    draw_tracked(d, (col_x, by + 36), "IOS  ·  ANDROID  ·  WEB", sans(12, "medium"), DARK, tracking=5)

    # CTA
    gold_pill(img, col_x + 150, H - 110, "START FOR $29", w=300, tracking=3)

    # corner wordmark
    draw_tracked(d, (col_x, H - 52), "LEGACYODYSSEY.COM", sans(12, "light"), MUTED, tracking=3)

    img.save(os.path.join(OUT, "fb_ad_2_app.png"))
    print("Saved fb_ad_2_app.png")

# ── Ad 3: "Exclusive" — portrait with engraved nameplate bar ────────────────
def ad3():
    img = Image.new("RGB", (W, H), CREAM)
    d   = ImageDraw.Draw(img)

    photo_h = 720
    # Use a portrait image
    ph = load_photo("smiling_baby.jpg", W - 120, photo_h, focus_y=0.4)
    ph = warm_tone(ph, 0.04)
    img.paste(ph, (60, 60))

    # corner marks on photo (editorial crop marks)
    cm = 18
    for (x, y) in [(60, 60), (W - 60, 60), (60, 60 + photo_h), (W - 60, 60 + photo_h)]:
        pass  # rely on hairline border instead

    # thin border
    d.rectangle([60, 60, W - 60, 60 + photo_h], outline=(255, 253, 247), width=1)

    # top-left caption on photo
    draw_tracked(d, (84, 84), "PORTRAIT · N. 03", sans(12, "medium"), CREAM, tracking=4)
    draw_tracked(d, (W - 84, 84), "EXCLUSIVE", sans(12, "medium"), CREAM, tracking=4, anchor="ra")

    # headline under photo
    hy = 60 + photo_h + 44
    d.text((W // 2, hy),
           "They're not your parents'",
           font=serif(44, semi=True), fill=DARK, anchor="mm")
    d.text((W // 2, hy + 44),
           "baby books.",
           font=serif(44, italic=True), fill=DARK, anchor="mm")

    # body — centered, narrow
    by = hy + 96
    body_font = sans(17, "light")
    body = ("Exclusive. Elegant. Affordable. A private website "
            "at a real .com domain — designed for parents who want "
            "something more than a camera roll.")
    lines = wrap(d, body, body_font, 760)
    for line in lines:
        d.text((W // 2, by), line, font=body_font, fill=MUTED, anchor="mm")
        by += 26

    # CTA centered
    gold_pill(img, W // 2, H - 58, "START FOR $29", w=320, tracking=3)

    img.save(os.path.join(OUT, "fb_ad_3_exclusive.png"))
    print("Saved fb_ad_3_exclusive.png")

# ── Ad 4: "The Domain" — text left / photo right (mirror) ──────────────────
def ad4():
    img = Image.new("RGB", (W, H), CREAM)
    d   = ImageDraw.Draw(img)

    pw = 600
    px = W - pw
    ph = load_photo("baby_feet.jpg", pw, H, focus_y=0.5)
    ph = warm_tone(ph, 0.04)
    img.paste(ph, (px, 0))

    d.line([(px, 0), (px, H)], fill=HAIR, width=1)

    # left column
    col_x = 64
    col_w = px - col_x - 60

    draw_tracked(d, (col_x, 120), "NO. 04  —  THE DOMAIN", sans(12, "medium"), GOLD_DK, tracking=4)
    hairline(d, col_x, 146, col_x + 60, 146, color=GOLD, width=2)

    hf = serif(52, semi=True)
    hi = serif(52, italic=True)
    y = 190
    d.text((col_x, y),       "They're not",        font=hf, fill=DARK)
    d.text((col_x, y + 56),  "your parents'",      font=hf, fill=DARK)
    d.text((col_x, y + 112), "baby books.",        font=hi, fill=DARK)

    by = y + 216
    body_font = sans(18, "light")
    body = ("Your baby gets their own .com domain. Share it with "
            "grandparents, aunts, uncles, and friends — from anywhere "
            "in the world. Starting at just $29.")
    for line in wrap(d, body, body_font, col_w):
        d.text((col_x, by), line, font=body_font, fill=MUTED)
        by += 28

    # a sample-domain line — subtle
    hairline(d, col_x, by + 18, col_x + col_w, by + 18)
    sample_y = by + 42
    d.text((col_x, sample_y), "yourbaby", font=serif(34, italic=True), fill=DARK)
    dw = text_w(d, "yourbaby", serif(34, italic=True))
    d.text((col_x + dw, sample_y), ".com", font=serif(34, semi=True), fill=GOLD_DK)

    # CTA
    gold_pill(img, col_x + 185, H - 110, "CLAIM THEIR DOMAIN", w=370, tracking=3)
    draw_tracked(d, (col_x, H - 52), "LEGACYODYSSEY.COM", sans(12, "light"), MUTED, tracking=3)

    img.save(os.path.join(OUT, "fb_ad_4_domain.png"))
    print("Saved fb_ad_4_domain.png")

# ── Ad 5: "Modern Family" — full bleed photo + inset card ──────────────────
def ad5():
    img = Image.new("RGB", (W, H), CREAM)

    ph = load_photo("family.jpg", W, H, focus_y=0.4)
    ph = warm_tone(ph, 0.05)
    ph = soft_vignette(ph, amount=0.18)
    img.paste(ph, (0, 0))

    d = ImageDraw.Draw(img)

    # top meta
    draw_tracked(d, (64, 48), "NO. 05  —  MODERN FAMILY", sans(12, "medium"), CREAM, tracking=4)
    draw_tracked(d, (W - 64, 48), "LEGACYODYSSEY.COM", sans(12, "light"), CREAM, tracking=3, anchor="ra")

    # inset "nameplate card" in lower area — cream panel
    cx1, cy1 = 64, 640
    cx2, cy2 = W - 64, H - 64
    # soft shadow beneath
    shadow = Image.new("RGBA", (W, H), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([cx1+6, cy1+10, cx2+6, cy2+10], radius=6, fill=(0,0,0,70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    img.paste(shadow, (0,0), shadow)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([cx1, cy1, cx2, cy2], radius=4, fill=CREAM)
    # gold hairline inside
    d.rounded_rectangle([cx1+10, cy1+10, cx2-10, cy2-10], radius=3, outline=GOLD, width=1)

    # content in card
    pad_x = cx1 + 48
    # eyebrow
    draw_tracked(d, (pad_x, cy1 + 44), "AN HEIRLOOM FOR THE INTERNET AGE",
                 sans(12, "medium"), GOLD_DK, tracking=4)

    # headline
    hy = cy1 + 82
    d.text((pad_x, hy),       "They're not your parents'",
           font=serif(42, semi=True), fill=DARK)
    d.text((pad_x, hy + 46),  "baby books.",
           font=serif(42, italic=True), fill=DARK)

    # body
    by = hy + 118
    body_font = sans(16, "light")
    body = ("Built for families who live online. A curated digital "
            "baby book at a real .com — the most personal website on "
            "the internet.")
    for line in wrap(d, body, body_font, cx2 - cx1 - 96):
        d.text((pad_x, by), line, font=body_font, fill=MUTED)
        by += 24

    # CTA right, meta left
    gold_pill(img, cx2 - 190, cy2 - 58, "START FOR $29", w=280, tracking=3)
    draw_tracked(d, (pad_x, cy2 - 48), "LEGACY ODYSSEY  ·  EST. MMXXVI",
                 sans(11, "medium"), DARK, tracking=4)

    img.save(os.path.join(OUT, "fb_ad_5_modern_family.png"))
    print("Saved fb_ad_5_modern_family.png")


if __name__ == "__main__":
    ad1()
    ad2()
    ad3()
    ad4()
    ad5()
    print("Campaign complete.")
