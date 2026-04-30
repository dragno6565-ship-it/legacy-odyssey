"""
Legacy Odyssey — Facebook Ad Generator v2
5 x 1080x1080px ads with real Unsplash baby photos
"""

import os, math, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

OUTPUT = r"E:\Claude\legacy-odyssey\ads"
FONTS  = r"C:\Users\dragn\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\53a9a6b5-518b-4e90-823a-2b9d07d423ac\1b085ba1-6866-4b9b-a8da-0fc329e29de1\skills\canvas-design\canvas-fonts"
PHOTOS = os.path.join(OUTPUT, "photos")
os.makedirs(PHOTOS, exist_ok=True)

W = H = 1080

# ── Brand palette ──────────────────────────────────────────────────────────────
CREAM   = (250, 247, 242)
DARK    = (26,  21,  16)
GOLD    = (200, 169, 110)
GOLD_DK = (170, 138,  74)
MUTED   = (120, 108,  88)
WHITE   = (255, 255, 255)

# ── Unsplash photo IDs  (free commercial use — Unsplash License) ──────────────
PHOTO_URLS = {
    "hands":   "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1080&h=1080&fit=crop&q=85",
    "smile":   "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=1080&h=1080&fit=crop&q=85",
    "mom":     "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=1080&h=1080&fit=crop&q=85",
    "newborn": "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=1080&h=1080&fit=crop&q=85",
    "family":  "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1080&h=1080&fit=crop&q=85",
}

FALLBACK_URLS = {
    "hands":   "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=1080&h=1080&fit=crop&q=85",
    "smile":   "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1080&h=1080&fit=crop&q=85",
    "mom":     "https://images.unsplash.com/photo-1565012010820-8f35c1d5c96a?w=1080&h=1080&fit=crop&q=85",
    "newborn": "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=1080&h=1080&fit=crop&q=85",
    "family":  "https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=1080&h=1080&fit=crop&q=85",
}

def download_photo(key):
    path = os.path.join(PHOTOS, f"{key}.jpg")
    if os.path.exists(path):
        print(f"  photo cached: {key}")
        return path
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    for url_dict in [PHOTO_URLS, FALLBACK_URLS]:
        url = url_dict[key]
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as r, open(path, 'wb') as f:
                f.write(r.read())
            img = Image.open(path)
            print(f"  downloaded {key}: {img.size}")
            return path
        except Exception as e:
            print(f"  failed {url[:60]}: {e}")
    return None

def load_photo(key, size=(W, H)):
    path = download_photo(key)
    if not path:
        img = Image.new('RGB', size, (200, 180, 155))
        return img
    img = Image.open(path).convert('RGB')
    img = img.resize(size, Image.LANCZOS)
    return img

# ── Font helpers ───────────────────────────────────────────────────────────────
def F(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONTS, name), size)
    except:
        return ImageFont.load_default()

def tw(draw, text, font):
    bb = draw.textbbox((0,0), text, font=font)
    return bb[2] - bb[0]

def th(draw, text, font):
    bb = draw.textbbox((0,0), text, font=font)
    return bb[3] - bb[1]

def draw_centered(draw, text, y, font, color, max_w=960, line_gap=8):
    words = text.split()
    lines, cur = [], []
    for w in words:
        test = ' '.join(cur + [w])
        if tw(draw, test, font) > max_w and cur:
            lines.append(' '.join(cur)); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(' '.join(cur))
    for line in lines:
        x = (W - tw(draw, line, font)) // 2
        draw.text((x, y), line, font=font, fill=color)
        y += th(draw, line, font) + line_gap
    return y

def draw_shadow_text(draw, text, x, y, font, color, shadow=(0,0,0,120), offset=3):
    draw.text((x+offset, y+offset), text, font=font, fill=shadow)
    draw.text((x, y), text, font=font, fill=color)

def cta_btn(draw, text, cx, y, font, bg=GOLD, fg=WHITE, px=54, py=22):
    btw = tw(draw, text, font)
    bth = th(draw, text, font)
    bw, bh = btw + px*2, bth + py*2
    x0 = cx - bw//2; y0 = y
    x1 = cx + bw//2; y1 = y + bh
    draw.rounded_rectangle([x0, y0, x1, y1], radius=6, fill=bg)
    draw.text((cx - btw//2, y0 + py), text, font=font, fill=fg)
    return y1

def vignette(img, strength=140, spread=0.55):
    vig = Image.new('L', img.size, 0)
    vd  = ImageDraw.Draw(vig)
    cx, cy = W//2, H//2
    steps = 120
    for i in range(steps):
        t   = i / steps
        r   = int(max(W, H) * spread * (1 - t))
        alpha = int(strength * (1 - t)**1.6)
        vd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=alpha)
    mask = vig.filter(ImageFilter.GaussianBlur(60))
    dark = Image.new('RGB', img.size, (0,0,0))
    img_rgba = img.convert('RGBA')
    dark_rgba = dark.convert('RGBA')
    result = Image.composite(img_rgba, dark_rgba, ImageChops.invert(mask) if False else mask)
    # Use paste with mask
    img.paste(dark, mask=ImageChops.invert(mask))
    return img

def gradient_overlay(img, direction='bottom', color=(0,0,0), start_alpha=0, end_alpha=200, span=0.65):
    overlay = Image.new('RGBA', img.size, (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    steps = int(H * span)
    for i in range(steps):
        t = (i / steps) ** 1.4
        a = int(start_alpha + (end_alpha - start_alpha) * t)
        if direction == 'bottom':
            y = H - steps + i
            od.line([(0, y), (W, y)], fill=(*color, a))
        elif direction == 'top':
            od.line([(0, i), (W, i)], fill=(*color, a))
        elif direction == 'left':
            od.line([(i, 0), (i, H)], fill=(*color, a))
        elif direction == 'right':
            od.line([(W-steps+i, 0), (W-steps+i, H)], fill=(*color, a))
    base = img.convert('RGBA')
    return Image.alpha_composite(base, overlay).convert('RGB')

from PIL import ImageChops

def warm_grade(img, warmth=12, contrast=1.08, brightness=1.02):
    """Apply warm color grade to photo"""
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Brightness(img).enhance(brightness)
    r, g, b = img.split()
    r = r.point(lambda x: min(255, x + warmth))
    g = g.point(lambda x: min(255, x + warmth//3))
    return Image.merge('RGB', (r, g, b))

# ─────────────────────────────────────────────────────────────────────────────
# AD 1 — "The Website"
# Full-bleed baby hands photo · Heavy bottom gradient · Large headline
# ─────────────────────────────────────────────────────────────────────────────
def ad1():
    photo = load_photo("hands")
    photo = warm_grade(photo, warmth=15, contrast=1.1)

    # Bottom gradient for text legibility
    photo = gradient_overlay(photo, 'bottom', DARK, start_alpha=0, end_alpha=230, span=0.62)

    d = ImageDraw.Draw(photo)

    # Top brand bar
    d.text((54, 52), "legacyodyssey.com", font=F("WorkSans-Regular.ttf", 24), fill=GOLD)

    # Decorative gold rule
    d.line([(54, 88), (190, 88)], fill=GOLD, width=1)

    # Eyebrow
    eyebrow = "LEGACY ODYSSEY  |  DIGITAL BABY BOOK"
    d.text((54, 108), eyebrow, font=F("WorkSans-Regular.ttf", 20), fill=(180, 155, 110))

    # Main headline — Lora Bold, very large
    hf   = F("Lora-Bold.ttf", 72)
    hfi  = F("Lora-BoldItalic.ttf", 72)
    l1   = "They're not your"
    l2   = "parents' baby books."
    hy   = H - 340

    draw_shadow_text(d, l1, (W - tw(d, l1, hf))//2, hy, hf, WHITE)
    hy += th(d, l1, hf) + 8
    draw_shadow_text(d, l2, (W - tw(d, l2, hfi))//2, hy, hfi, GOLD)
    hy += th(d, l2, hfi) + 28

    # Thin gold rule
    d.line([(W//2 - 80, hy), (W//2 + 80, hy)], fill=GOLD, width=1)
    hy += 24

    # Body
    bf   = F("WorkSans-Regular.ttf", 30)
    body = "A private .com website for your baby — beautifully designed and simple to use."
    hy   = draw_centered(d, body, hy, bf, (220, 210, 195), max_w=860)
    hy  += 32

    # CTA
    cta_btn(d, "Start for $29  →", W//2, hy, F("WorkSans-Bold.ttf", 30))

    photo.save(os.path.join(OUTPUT, "ad1_the_website.png"))
    print("AD 1 saved")

# ─────────────────────────────────────────────────────────────────────────────
# AD 2 — "The App"
# Left dark panel | Right: baby smiling photo
# ─────────────────────────────────────────────────────────────────────────────
def ad2():
    # Full photo as base, split layout on top
    photo = load_photo("smile")
    photo = warm_grade(photo, warmth=10, contrast=1.12)

    # Right half only — crop to right side
    right = photo.crop((W//2, 0, W, H)).resize((W//2, H), Image.LANCZOS)

    canvas = Image.new('RGB', (W, H), DARK)

    # Left panel — dark with subtle warm gradient
    left_panel = Image.new('RGB', (W//2, H), DARK)
    lp_d = ImageDraw.Draw(left_panel)
    # Very subtle warm gradient on dark panel
    for y in range(H):
        t = y / H
        warmth = int(8 * math.sin(math.pi * t))
        lp_d.line([(0, y), (W//2, y)], fill=(26+warmth, 21+warmth//2, 16))
    canvas.paste(left_panel, (0, 0))

    # Right photo panel
    # Add left-fade so it blends into dark panel
    right_rgba = right.convert('RGBA')
    fade = Image.new('RGBA', (W//2, H), (0,0,0,0))
    fd   = ImageDraw.Draw(fade)
    for x in range(150):
        t = 1 - x/150
        a = int(255 * t**1.6)
        fd.line([(x, 0), (x, H)], fill=(26, 21, 16, a))
    right_rgba = Image.alpha_composite(right_rgba, fade)
    canvas.paste(right_rgba.convert('RGB'), (W//2, 0))

    d = ImageDraw.Draw(canvas)

    # Vertical gold rule at split
    d.line([(W//2, 60), (W//2, H-60)], fill=(80, 65, 45), width=1)

    # Brand
    d.text((54, 54), "legacyodyssey.com", font=F("WorkSans-Regular.ttf", 22), fill=GOLD)
    d.line([(54, 84), (210, 84)], fill=(70, 58, 38), width=1)

    # Eyebrow
    d.text((54, 156), "DIGITAL BABY BOOK", font=F("WorkSans-Regular.ttf", 20), fill=(130, 108, 72))

    # Headline
    hf  = F("Lora-Bold.ttf", 66)
    hfi = F("Lora-BoldItalic.ttf", 66)
    lines = [("They're not", WHITE), ("your parents'", WHITE), ("baby books.", GOLD)]
    hy = 202
    for text, col in lines:
        d.text((54, hy), text, font=hf if col==WHITE else hfi, fill=col)
        hy += th(d, text, hf) + 2
    hy += 32

    # Body copy
    body_lines = [
        "Fill in milestones, photos,",
        "letters & recipes from",
        "your phone in minutes.",
        "",
        "Your baby. Their own .com.",
    ]
    bf = F("WorkSans-Regular.ttf", 26)
    for line in body_lines:
        if line:
            d.text((54, hy), line, font=bf, fill=(165, 148, 118))
        hy += th(d, "A", bf) + 7
    hy += 24

    # CTA button — full left-panel width
    cf   = F("WorkSans-Bold.ttf", 27)
    cta  = "Start for $29  →"
    ctw_val  = tw(d, cta, cf)
    btn_w    = W//2 - 108
    btn_h    = 60
    bx0, by0 = 54, hy
    bx1, by1 = 54 + btn_w, hy + btn_h
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=5, fill=GOLD)
    d.text((bx0 + (btn_w - ctw_val)//2, by0 + (btn_h - th(d, cta, cf))//2),
           cta, font=cf, fill=WHITE)

    # Right panel — small text overlay
    rtext_x = W//2 + 48
    rtext_y = H - 110
    d.text((rtext_x, rtext_y), "Every milestone. One URL.", font=F("Lora-Italic.ttf", 28), fill=(230, 215, 188))

    canvas.save(os.path.join(OUTPUT, "ad2_the_app.png"))
    print("AD 2 saved")

# ─────────────────────────────────────────────────────────────────────────────
# AD 3 — "Exclusive"
# Mom holding baby, full-bleed · Top gradient · Large centered type
# ─────────────────────────────────────────────────────────────────────────────
def ad3():
    photo = load_photo("mom")
    photo = warm_grade(photo, warmth=18, contrast=1.06, brightness=1.04)

    # Top dark gradient for brand area
    photo = gradient_overlay(photo, 'top', DARK, start_alpha=200, end_alpha=0, span=0.38)
    # Bottom dark gradient for CTA area
    photo = gradient_overlay(photo, 'bottom', DARK, start_alpha=0, end_alpha=210, span=0.50)

    d = ImageDraw.Draw(photo)

    # Brand
    brand_text = "legacyodyssey.com"
    bf_brand = F("WorkSans-Regular.ttf", 24)
    d.text(((W - tw(d, brand_text, bf_brand))//2, 48), brand_text, font=bf_brand, fill=GOLD)

    # Small decorative element
    d.line([(W//2 - 50, 82), (W//2 + 50, 82)], fill=GOLD, width=1)

    # Eyebrow centered
    ey = "EXCLUSIVE  ·  ELEGANT  ·  AFFORDABLE"
    ef = F("WorkSans-Regular.ttf", 20)
    d.text(((W - tw(d, ey, ef))//2, 100), ey, font=ef, fill=(175, 150, 105))

    # Bottom text area
    hf  = F("Lora-Bold.ttf", 74)
    hfi = F("Lora-BoldItalic.ttf", 74)
    l1  = "They're not your"
    l2  = "parents' baby books."
    hy  = H - 350

    draw_shadow_text(d, l1, (W - tw(d, l1, hf))//2, hy, hf, WHITE)
    hy += th(d, l1, hf) + 6
    draw_shadow_text(d, l2, (W - tw(d, l2, hfi))//2, hy, hfi, GOLD)
    hy += th(d, l2, hfi) + 26

    # Body
    body = "A private website at a real .com — designed for parents who want something more."
    bf   = F("WorkSans-Regular.ttf", 28)
    hy   = draw_centered(d, body, hy, bf, (218, 205, 185), max_w=840)
    hy  += 30

    # CTA
    cta_btn(d, "Start for $29  →", W//2, hy, F("WorkSans-Bold.ttf", 29))

    photo.save(os.path.join(OUTPUT, "ad3_exclusive.png"))
    print("AD 3 saved")

# ─────────────────────────────────────────────────────────────────────────────
# AD 4 — "The Domain"
# Newborn baby photo · Top cream bar with domain name hero · Gold accents
# ─────────────────────────────────────────────────────────────────────────────
def ad4():
    photo = load_photo("newborn")
    photo = warm_grade(photo, warmth=20, contrast=1.08)

    # Bottom gradient
    photo = gradient_overlay(photo, 'bottom', DARK, start_alpha=10, end_alpha=220, span=0.55)

    d = ImageDraw.Draw(photo)

    # Top cream bar
    bar_h = 160
    bar = Image.new('RGB', (W, bar_h), CREAM)
    bd  = ImageDraw.Draw(bar)
    bd.line([(0, bar_h - 1), (W, bar_h - 1)], fill=GOLD, width=2)

    # Brand in top bar
    brand_f = F("WorkSans-Regular.ttf", 22)
    bd.text((54, 30), "legacyodyssey.com", font=brand_f, fill=GOLD)

    # Domain name as hero in the bar — the typographic moment
    dom_f   = F("Lora-Bold.ttf", 44)
    dom_txt = "yourbabyname.com"
    dom_x   = W - tw(bd, dom_txt, dom_f) - 54
    bd.text((dom_x, 22), dom_txt, font=dom_f, fill=DARK)
    # Underline
    bd.line([(dom_x, 80), (W - 54, 80)], fill=GOLD, width=2)
    bd.text((dom_x, 86), "Available  •  Register at checkout", font=F("WorkSans-Regular.ttf", 18), fill=MUTED)

    photo.paste(bar, (0, 0))
    d = ImageDraw.Draw(photo)

    # Main headline
    hf  = F("Lora-Bold.ttf", 76)
    hfi = F("Lora-BoldItalic.ttf", 76)
    l1  = "They're not your"
    l2  = "parents' baby books."
    hy  = H - 360

    draw_shadow_text(d, l1, (W - tw(d, l1, hf))//2, hy, hf, WHITE)
    hy += th(d, l1, hf) + 6
    draw_shadow_text(d, l2, (W - tw(d, l2, hfi))//2, hy, hfi, GOLD)
    hy += th(d, l2, hfi) + 26

    d.line([(W//2 - 70, hy), (W//2 + 70, hy)], fill=GOLD, width=1)
    hy += 22

    body = "Your baby gets their own .com domain — shared with grandparents and family from anywhere. Starting at $29."
    bf   = F("WorkSans-Regular.ttf", 27)
    hy   = draw_centered(d, body, hy, bf, (215, 200, 178), max_w=850)
    hy  += 30

    cta_btn(d, "Claim Their Domain  →", W//2, hy, F("WorkSans-Bold.ttf", 28))

    photo.save(os.path.join(OUTPUT, "ad4_the_domain.png"))
    print("AD 4 saved")

# ─────────────────────────────────────────────────────────────────────────────
# AD 5 — "Modern Family"
# Happy family photo · Warm grade · Feature strip at bottom
# ─────────────────────────────────────────────────────────────────────────────
def ad5():
    photo = load_photo("family")
    photo = warm_grade(photo, warmth=22, contrast=1.05, brightness=1.06)

    # Heavier bottom gradient
    photo = gradient_overlay(photo, 'bottom', DARK, start_alpha=0, end_alpha=245, span=0.68)
    # Light top gradient
    photo = gradient_overlay(photo, 'top', DARK, start_alpha=160, end_alpha=0, span=0.22)

    d = ImageDraw.Draw(photo)

    # Brand
    d.text((54, 50), "legacyodyssey.com", font=F("WorkSans-Regular.ttf", 24), fill=GOLD)
    d.line([(54, 84), (220, 84)], fill=(80, 65, 40), width=1)

    eyebrow = "FOR FAMILIES WHO LIVE ONLINE"
    d.text((54, 104), eyebrow, font=F("WorkSans-Regular.ttf", 20), fill=(165, 140, 95))

    # Headline
    hf  = F("Lora-Bold.ttf", 78)
    hfi = F("Lora-BoldItalic.ttf", 78)
    l1  = "They're not your"
    l2  = "parents' baby books."
    hy  = H - 390

    draw_shadow_text(d, l1, (W - tw(d, l1, hf))//2, hy, hf, WHITE)
    hy += th(d, l1, hf) + 6
    draw_shadow_text(d, l2, (W - tw(d, l2, hfi))//2, hy, hfi, GOLD)
    hy += th(d, l2, hfi) + 24

    d.line([(W//2 - 70, hy), (W//2 + 70, hy)], fill=GOLD, width=1)
    hy += 22

    body = "A curated digital baby book at a real .com — the most personal website on the internet."
    bf   = F("WorkSans-Regular.ttf", 29)
    hy   = draw_centered(d, body, hy, bf, (215, 200, 178), max_w=840)
    hy  += 30

    cta_btn(d, "Start for $29  →", W//2, hy, F("WorkSans-Bold.ttf", 30))

    hy += 72

    # Feature strip
    d.line([(60, hy), (W - 60, hy)], fill=(80, 65, 40), width=1)
    hy += 18

    features = ["Unlimited Photos", "Real .com Domain", "Mobile App", "Private & Secure"]
    ff  = F("WorkSans-Regular.ttf", 22)
    dot_f = F("WorkSans-Regular.ttf", 22)
    total = sum(tw(d, f, ff) for f in features) + 3 * tw(d, "  |  ", dot_f)
    fx = (W - total) // 2
    for i, feat in enumerate(features):
        d.text((fx, hy), feat, font=ff, fill=(175, 155, 115))
        fx += tw(d, feat, ff)
        if i < len(features) - 1:
            sep = "  |  "
            d.text((fx, hy), sep, font=dot_f, fill=(80, 65, 40))
            fx += tw(d, sep, dot_f)

    photo.save(os.path.join(OUTPUT, "ad5_modern_family.png"))
    print("AD 5 saved")


print("Downloading photos from Unsplash...")
for key in PHOTO_URLS:
    download_photo(key)

print("\nGenerating ads...")
ad1()
ad2()
ad3()
ad4()
ad5()
print("\nDone ->", OUTPUT)
