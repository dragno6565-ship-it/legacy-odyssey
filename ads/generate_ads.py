"""
Legacy Odyssey — Facebook Ad Generator
5 x 1080x1080px premium editorial ads
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os, random

OUTPUT = r"E:\Claude\legacy-odyssey\ads"
FONTS  = r"C:\Users\dragn\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\53a9a6b5-518b-4e90-823a-2b9d07d423ac\1b085ba1-6866-4b9b-a8da-0fc329e29de1\skills\canvas-design\canvas-fonts"

os.makedirs(OUTPUT, exist_ok=True)
W = H = 1080

# ── Brand palette ──────────────────────────────────────────────────────────────
CREAM    = (250, 247, 242)
DARK     = (26,  21,  16)
GOLD     = (200, 169, 110)
GOLD_DK  = (170, 138,  74)
MUTED    = (120, 108,  88)
CARD     = (240, 232, 220)
WHITE    = (255, 255, 255)

# ── Font helpers ───────────────────────────────────────────────────────────────
def F(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONTS, name), size)
    except Exception as e:
        print(f"  font warning: {e}")
        return ImageFont.load_default()

# ── Drawing helpers ────────────────────────────────────────────────────────────
def text_w(draw, text, font):
    bb = draw.textbbox((0,0), text, font=font)
    return bb[2] - bb[0]

def text_h_val(draw, text, font):
    bb = draw.textbbox((0,0), text, font=font)
    return bb[3] - bb[1]

def draw_centered(draw, text, y, font, color, max_w=W-100):
    words = text.split()
    lines, cur = [], []
    for w in words:
        test = ' '.join(cur + [w])
        if text_w(draw, test, font) > max_w and cur:
            lines.append(' '.join(cur)); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(' '.join(cur))
    for line in lines:
        x = (W - text_w(draw, line, font)) // 2
        draw.text((x, y), line, font=font, fill=color)
        y += text_h_val(draw, line, font) + 6
    return y

def draw_left(draw, text, x, y, font, color, max_w=860):
    words = text.split()
    lines, cur = [], []
    for w in words:
        test = ' '.join(cur + [w])
        if text_w(draw, test, font) > max_w and cur:
            lines.append(' '.join(cur)); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(' '.join(cur))
    for line in lines:
        draw.text((x, y), line, font=font, fill=color)
        y += text_h_val(draw, line, font) + 8
    return y

def cta_button(draw, text, cx, y, font, bg=GOLD, fg=WHITE, px=50, py=20):
    tw = text_w(draw, text, font)
    th = text_h_val(draw, text, font)
    bw, bh = tw + px*2, th + py*2
    x0, y0 = cx - bw//2, y
    x1, y1 = cx + bw//2, y + bh
    draw.rounded_rectangle([x0, y0, x1, y1], radius=5, fill=bg)
    draw.text((cx - tw//2, y0 + py), text, font=font, fill=fg)
    return y1

def brand_tag(draw, y=52, x=54):
    f = F("InstrumentSans-Regular.ttf", 22)
    draw.text((x, y), "legacyodyssey.com", font=f, fill=GOLD)
    draw.line([(x, y + 30), (x + 38, y + 30)], fill=GOLD, width=1)

def gradient_rect(draw, x0, y0, x1, y1, c1, c2, vertical=True):
    for i in range(y1 - y0 if vertical else x1 - x0):
        t = i / max(1, (y1-y0 if vertical else x1-x0) - 1)
        r = int(c1[0]*(1-t) + c2[0]*t)
        g = int(c1[1]*(1-t) + c2[1]*t)
        b = int(c1[2]*(1-t) + c2[2]*t)
        if vertical:
            draw.line([(x0, y0+i), (x1, y0+i)], fill=(r,g,b))
        else:
            draw.line([(x0+i, y0), (x0+i, y1)], fill=(r,g,b))

def soft_vignette(img, strength=80):
    """Add a soft dark vignette around edges"""
    vig = Image.new('RGBA', img.size, (0,0,0,0))
    vd  = ImageDraw.Draw(vig)
    cx, cy = W//2, H//2
    for r in range(max(W,H)//2, 0, -4):
        t = (r / (max(W,H)//2))
        alpha = int(strength * (1 - t)**1.8)
        vd.ellipse([cx-r, cy-r, cx+r, cy+r], outline=(0,0,0, alpha), width=4)
    img_rgba = img.convert('RGBA')
    return Image.alpha_composite(img_rgba, vig).convert('RGB')

def noise_texture(img, amount=6):
    """Subtle film-grain noise for warmth"""
    arr = img.load()
    rng = random.Random(42)
    for y in range(0, H, 1):
        for x in range(0, W, 1):
            px = arr[x, y]
            d = rng.randint(-amount, amount)
            arr[x, y] = tuple(max(0, min(255, c+d)) for c in px)
    return img

def warm_photo_bg(w, h, palette, seed=0):
    """
    Create a warm, luminous photographic-feeling background using
    layered radial gradients — evokes golden-hour skin and soft light.
    """
    img = Image.new('RGB', (w, h), palette[0])
    d   = ImageDraw.Draw(img)

    # Base gradient
    gradient_rect(d, 0, 0, w, h, palette[0], palette[1])

    # Layered soft glows
    rng = random.Random(seed)
    for _ in range(18):
        cx = rng.randint(w//4, 3*w//4)
        cy = rng.randint(h//6, 5*h//6)
        r  = rng.randint(80, 300)
        c  = rng.choice(palette[2:]) if len(palette) > 2 else palette[0]
        alpha = rng.randint(10, 35)
        for dr in range(r, 0, -6):
            a = int(alpha * (1 - dr/r)**1.5)
            x0,y0,x1,y1 = cx-dr, cy-dr, cx+dr, cy+dr
            d.ellipse([x0,y0,x1,y1], fill=(*c, a) if False else c)

    # Blur for softness
    img = img.filter(ImageFilter.GaussianBlur(radius=24))
    return img


# ══════════════════════════════════════════════════════════════════════════════
# AD 1 — "The Website"
# Layout: Large warm photo-feeling top panel · Clean cream text strip below
# Palette: honey amber → antique rose · Evokes warm hands & soft light
# ══════════════════════════════════════════════════════════════════════════════
def ad1():
    img = Image.new('RGB', (W, H), CREAM)
    d   = ImageDraw.Draw(img)

    PHOTO_H = 596

    # Photo panel — warm amber/honey palette
    palette = [
        (235, 200, 162),   # warm honey amber
        (210, 170, 128),   # deeper amber
        (248, 225, 190),   # bright warm highlight
        (220, 185, 145),   # antique rose
        (245, 215, 175),   # pale gold
    ]
    photo = warm_photo_bg(W, PHOTO_H, palette, seed=1)

    # Soft central highlight — the "light falling on hands" moment
    glow = Image.new('RGBA', (W, PHOTO_H), (0,0,0,0))
    gd   = ImageDraw.Draw(glow)
    for r in range(340, 0, -8):
        t = 1 - r/340
        a = int(32 * t**1.6)
        cx, cy = W//2 + 30, PHOTO_H//2 - 20
        gd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 240, 210, a))
    photo = Image.alpha_composite(photo.convert('RGBA'), glow).convert('RGB')

    # Two large abstract organic forms — suggest interlocked hands
    shapes = Image.new('RGBA', (W, PHOTO_H), (0,0,0,0))
    sd = ImageDraw.Draw(shapes)
    sd.ellipse([180, 120, 620, 500], fill=(255, 235, 205, 22))   # large hand form
    sd.ellipse([460, 160, 900, 520], fill=(240, 210, 175, 18))   # overlapping form
    sd.ellipse([290, 200, 790, 460], fill=(255, 245, 220, 14))   # bright center
    photo = Image.alpha_composite(photo.convert('RGBA'), shapes).convert('RGB')

    # Gradient fade into cream at bottom
    fade = Image.new('RGBA', (W, PHOTO_H), (0,0,0,0))
    fd   = ImageDraw.Draw(fade)
    for y in range(PHOTO_H-140, PHOTO_H):
        t   = (y - (PHOTO_H-140)) / 140
        a   = int(255 * t**1.4)
        fd.line([(0, y), (W, y)], fill=(*CREAM, a))
    photo = Image.alpha_composite(photo.convert('RGBA'), fade).convert('RGB')

    img.paste(photo, (0, 0))
    d = ImageDraw.Draw(img)

    # Brand + rule
    brand_tag(d, y=48)

    # Small italic label on photo
    d.text((54, 510), "LEGACY ODYSSEY  ·  DIGITAL BABY BOOKS",
           font=F("InstrumentSans-Regular.ttf", 18), fill=(120, 90, 55))

    # Cream text zone
    d.rectangle([0, PHOTO_H, W, H], fill=CREAM)

    # Thin gold rule
    d.line([(W//2 - 40, PHOTO_H + 28), (W//2 + 40, PHOTO_H + 28)], fill=GOLD, width=1)

    # Headline — Italiana, very large
    hf  = F("Italiana-Regular.ttf", 88)
    hf2 = F("Italiana-Regular.ttf", 88)
    line1 = "They're not your parents'"
    line2 = "baby books."

    hy = PHOTO_H + 44
    d.text(((W - text_w(d, line1, hf))//2, hy),  line1, font=hf,  fill=DARK)
    hy += text_h_val(d, line1, hf) - 14
    d.text(((W - text_w(d, line2, hf2))//2, hy), line2, font=hf2, fill=GOLD_DK)
    hy += text_h_val(d, line2, hf2) + 22

    # Body
    bf  = F("InstrumentSans-Regular.ttf", 27)
    body = "A private .com website for your baby — beautifully designed, simple to use."
    hy  = draw_centered(d, body, hy, bf, MUTED, max_w=820)
    hy += 30

    # CTA
    cta_button(d, "Start for $29 →", W//2, hy, F("InstrumentSans-Bold.ttf", 28))

    img = noise_texture(img, 5)
    img.save(os.path.join(OUTPUT, "ad1_the_website.png"))
    print("AD 1 saved")


# ══════════════════════════════════════════════════════════════════════════════
# AD 2 — "The App"
# Layout: Left-side dark panel with type · Right warm lifestyle photo-feeling
# Palette: Deep forest dark + warm golden right side
# ══════════════════════════════════════════════════════════════════════════════
def ad2():
    img = Image.new('RGB', (W, H), DARK)
    d   = ImageDraw.Draw(img)

    SPLIT = 480  # left panel width

    # Right photo panel — warm lifestyle / phone + baby vibes
    palette = [
        (230, 195, 155),
        (215, 178, 132),
        (248, 220, 185),
        (205, 168, 122),
        (240, 208, 165),
    ]
    photo = warm_photo_bg(W - SPLIT, H, palette, seed=2)

    # Soft circular highlight — suggests phone screen glow
    glow = Image.new('RGBA', (W-SPLIT, H), (0,0,0,0))
    gd   = ImageDraw.Draw(glow)
    for r in range(300, 0, -8):
        t = 1 - r/300
        a = int(28 * t**1.5)
        cx, cy = (W-SPLIT)//2 + 30, H//2 - 40
        gd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 245, 215, a))
    photo = Image.alpha_composite(photo.convert('RGBA'), glow).convert('RGB')

    # Abstract phone silhouette — soft rounded rect
    ps = Image.new('RGBA', (W-SPLIT, H), (0,0,0,0))
    pd = ImageDraw.Draw(ps)
    # Phone shape suggestion
    px0, py0, px1, py1 = 155, 220, 335, 480
    pd.rounded_rectangle([px0, py0, px1, py1], radius=24,
                          fill=(255, 250, 240, 12), outline=(220, 185, 140, 30), width=2)
    # Screen glow
    pd.rounded_rectangle([px0+12, py0+20, px1-12, py1-20], radius=16,
                          fill=(255, 250, 240, 18))
    photo = Image.alpha_composite(photo.convert('RGBA'), ps).convert('RGB')

    # Gradient fade left edge into dark
    fade = Image.new('RGBA', (W-SPLIT, H), (0,0,0,0))
    fd   = ImageDraw.Draw(fade)
    for x in range(120):
        t = 1 - x/120
        a = int(240 * t**1.8)
        fd.line([(x, 0), (x, H)], fill=(*DARK, a))
    photo = Image.alpha_composite(photo.convert('RGBA'), fade).convert('RGB')
    img.paste(photo, (SPLIT, 0))

    d = ImageDraw.Draw(img)

    # Left dark panel
    d.rectangle([0, 0, SPLIT, H], fill=DARK)

    # Subtle vertical gold rule left edge
    d.line([(SPLIT, 60), (SPLIT, H-60)], fill=GOLD, width=1)

    # Brand mark
    d.text((54, 54), "legacyodyssey.com", font=F("InstrumentSans-Regular.ttf", 20), fill=GOLD)
    d.line([(54, 82), (200, 82)], fill=(80, 65, 45), width=1)

    # Eyebrow
    d.text((54, 160), "DIGITAL BABY BOOK", font=F("InstrumentSans-Regular.ttf", 20),
           fill=(140, 118, 85))

    # Headline — vertical, generous
    hf  = F("Italiana-Regular.ttf", 74)
    lines = ["They're not", "your parents'", "baby books."]
    hy = 200
    for i, line in enumerate(lines):
        col = GOLD_DK if i == 2 else (240, 235, 225)
        d.text((54, hy), line, font=hf, fill=col)
        hy += text_h_val(d, line, hf) - 8

    hy += 32

    # Body
    bf  = F("InstrumentSans-Regular.ttf", 24)
    body_lines = [
        "Fill in every milestone",
        "from your phone in minutes.",
        "",
        "Legacy Odyssey — the elegant",
        "digital baby book with its",
        "own .com domain.",
    ]
    for line in body_lines:
        if line:
            d.text((54, hy), line, font=bf, fill=(160, 145, 120))
        hy += text_h_val(d, "A", bf) + 6

    hy += 30

    # CTA Button — full width of left panel
    cf   = F("InstrumentSans-Bold.ttf", 26)
    cta_text = "Start for $29 →"
    ctw  = text_w(d, cta_text, cf)
    btn_w, btn_h = SPLIT - 108, 60
    d.rounded_rectangle([54, hy, 54+btn_w, hy+btn_h], radius=5, fill=GOLD)
    d.text((54 + (btn_w - ctw)//2, hy + (btn_h - text_h_val(d, cta_text, cf))//2),
           cta_text, font=cf, fill=WHITE)

    # Small decorative gold dots
    for i, cy in enumerate(range(870, 920, 18)):
        d.ellipse([54+i*10-3, cy-3, 54+i*10+3, cy+3],
                  fill=GOLD if i < 3 else (80, 65, 45))

    img = noise_texture(img, 4)
    img.save(os.path.join(OUTPUT, "ad2_the_app.png"))
    print("AD 2 saved")


# ══════════════════════════════════════════════════════════════════════════════
# AD 3 — "Exclusive"
# Layout: Full-bleed centered portrait feel · Large type centered · Minimal
# Palette: Pale champagne + blush — evokes soft baby portrait studio shot
# ══════════════════════════════════════════════════════════════════════════════
def ad3():
    # Full-bleed soft portrait palette
    palette = [
        (242, 228, 210),
        (228, 210, 188),
        (250, 238, 222),
        (235, 218, 196),
        (245, 230, 212),
    ]
    img = warm_photo_bg(W, H, palette, seed=3)
    d   = ImageDraw.Draw(img)

    # Large central soft oval — baby portrait feeling
    shapes = Image.new('RGBA', (W, H), (0,0,0,0))
    sd     = ImageDraw.Draw(shapes)
    # Layered ovals building a luminous center
    for r_x, r_y, opacity in [(360, 440, 30), (300, 370, 25), (240, 300, 20), (180, 240, 15)]:
        sd.ellipse([W//2 - r_x, H//2 - r_y - 60, W//2 + r_x, H//2 + r_y - 60],
                    fill=(255, 248, 235, opacity))
    img = Image.alpha_composite(img.convert('RGBA'), shapes).convert('RGB')

    # Soft vignette
    img = soft_vignette(img, strength=70)
    d   = ImageDraw.Draw(img)

    # Top brand
    brand_tag(d, y=52)

    # Three-word eyebrow — the three adjectives as headline
    ef = F("InstrumentSans-Regular.ttf", 22)
    eyebrow = "EXCLUSIVE  ·  ELEGANT  ·  AFFORDABLE"
    d.text(((W - text_w(d, eyebrow, ef))//2, 52), eyebrow, font=ef, fill=GOLD)

    # Thin gold horizontal rule
    rule_y = 86
    d.line([(W//2 - 80, rule_y), (W//2 + 80, rule_y)], fill=GOLD, width=1)

    # Main headline — very large, centered
    hf   = F("Italiana-Regular.ttf", 96)
    hf2  = F("Italiana-Regular.ttf", 96)
    l1, l2, l3 = "They're not", "your parents'", "baby books."
    hy = 310
    for i, line in enumerate([l1, l2, l3]):
        col = GOLD_DK if i == 2 else DARK
        x   = (W - text_w(d, line, hf))//2
        d.text((x, hy), line, font=hf, fill=col)
        hy += text_h_val(d, line, hf) - 16

    hy += 36

    # Thin rule below headline
    d.line([(W//2 - 60, hy), (W//2 + 60, hy)], fill=(170, 145, 100), width=1)
    hy += 28

    # Body — italic, centered, spacious
    bf = F("InstrumentSans-Regular.ttf", 28)
    body = "A private website at a real .com domain — designed for parents who want something more than a camera roll."
    hy = draw_centered(d, body, hy, bf, (95, 80, 58), max_w=800)
    hy += 36

    # CTA
    cta_button(d, "Start for $29 →", W//2, hy,
               F("InstrumentSans-Bold.ttf", 28), bg=DARK, fg=CREAM)

    # Small bottom brand
    bottom_text = "legacyodyssey.com"
    bf2 = F("InstrumentSans-Regular.ttf", 20)
    d.text(((W - text_w(d, bottom_text, bf2))//2, H - 56),
           bottom_text, font=bf2, fill=(140, 120, 90))

    img = noise_texture(img, 5)
    img.save(os.path.join(OUTPUT, "ad3_exclusive.png"))
    print("AD 3 saved")


# ══════════════════════════════════════════════════════════════════════════════
# AD 4 — "The Domain"
# Layout: Overhead flat-lay feeling · Domain URL as typography hero element
# Palette: Warm ivory + sage + gold — evokes blanket/nursery flat lay
# ══════════════════════════════════════════════════════════════════════════════
def ad4():
    img = Image.new('RGB', (W, H), (244, 238, 226))
    d   = ImageDraw.Draw(img)

    # Flat lay background — very subtle warm texture
    palette = [
        (244, 238, 226),
        (232, 224, 210),
        (248, 242, 232),
        (238, 230, 215),
    ]
    bg = warm_photo_bg(W, H, palette, seed=4)
    img.paste(bg)
    d = ImageDraw.Draw(img)

    # Subtle grid lines — suggest woven fabric / blanket texture
    for x in range(0, W, 36):
        d.line([(x, 0), (x, H)], fill=(220, 212, 196, 60) if False else (226, 218, 204), width=1)
    for y in range(0, H, 36):
        d.line([(0, y), (W, y)], fill=(226, 218, 204), width=1)

    # Large abstract "overhead object" — a rounded square suggesting baby item on blanket
    obj_layer = Image.new('RGBA', (W, H), (0,0,0,0))
    od = ImageDraw.Draw(obj_layer)
    # Main object — soft rounded rect (book/phone)
    od.rounded_rectangle([320, 220, 760, 600], radius=40, fill=(250, 245, 235, 50),
                          outline=(210, 190, 160, 80), width=2)
    # Shadow
    od.rounded_rectangle([328, 230, 768, 608], radius=40, fill=(0,0,0, 12))
    img = Image.alpha_composite(img.convert('RGBA'), obj_layer).convert('RGB')
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    d = ImageDraw.Draw(img)

    # Brand
    brand_tag(d, y=52)

    # Eyebrow
    ef = F("InstrumentSans-Regular.ttf", 21)
    d.text((W - text_w(d, "LEGACY ODYSSEY", ef) - 54, 52),
           "LEGACY ODYSSEY", font=ef, fill=GOLD)

    # Headline — left-aligned, editorial
    hf = F("Italiana-Regular.ttf", 82)
    hy = 140
    lines = ["They're not", "your parents'", "baby books."]
    for i, line in enumerate(lines):
        col = GOLD_DK if i == 2 else DARK
        d.text((60, hy), line, font=hf, fill=col)
        hy += text_h_val(d, line, hf) - 10
    hy += 20

    # THE BIG TYPOGRAPHIC MOMENT — domain name as giant decorative element
    dom_f = F("Italiana-Regular.ttf", 52)
    domain_text = "yourbabyname.com"
    dtw = text_w(d, domain_text, dom_f)
    # Background pill
    px, py = (W - dtw)//2, hy
    d.rounded_rectangle([px - 32, py - 12, px + dtw + 32, py + text_h_val(d, domain_text, dom_f) + 12],
                          radius=6, fill=(240, 232, 218), outline=GOLD, width=1)
    d.text((px, py), domain_text, font=dom_f, fill=DARK)
    hy += text_h_val(d, domain_text, dom_f) + 48

    # Divider
    d.line([(60, hy), (W-60, hy)], fill=(210, 196, 172), width=1)
    hy += 28

    # Body
    bf = F("InstrumentSans-Regular.ttf", 27)
    body = "Share it with grandparents, aunts, uncles, and friends — from anywhere in the world. Starting at just $29."
    hy = draw_centered(d, body, hy, bf, MUTED, max_w=840)
    hy += 32

    # CTA
    cta_button(d, "Claim Their Domain →", W//2, hy, F("InstrumentSans-Bold.ttf", 27))

    img = noise_texture(img, 5)
    img.save(os.path.join(OUTPUT, "ad4_the_domain.png"))
    print("AD 4 saved")


# ══════════════════════════════════════════════════════════════════════════════
# AD 5 — "Modern Family"
# Layout: Top-to-bottom golden light wash · Big joyful headline · Open, airy
# Palette: Warm golden-hour — sunrise glow, happy and candid
# ══════════════════════════════════════════════════════════════════════════════
def ad5():
    # Golden-hour palette
    palette = [
        (248, 220, 168),   # warm golden top
        (235, 195, 132),   # deeper amber bottom
        (255, 235, 185),   # bright highlight
        (240, 205, 148),   # mid gold
        (252, 228, 175),   # pale gold
    ]
    img = warm_photo_bg(W, H, palette, seed=5)

    # Multiple overlapping warm glows — sunshine scattering effect
    glow_layer = Image.new('RGBA', (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(glow_layer)
    glows = [(200, 180, 340, (255,245,210)), (780, 220, 260, (255,240,195)),
             (520, 420, 400, (255,248,215)), (160, 650, 200, (240,220,175)),
             (880, 700, 220, (245,225,180))]
    for gx, gy, gr, gc in glows:
        for r in range(gr, 0, -8):
            t = 1 - r/gr
            a = int(22 * t**1.8)
            gd.ellipse([gx-r, gy-r, gx+r, gy+r], fill=(*gc, a))
    img = Image.alpha_composite(img.convert('RGBA'), glow_layer).convert('RGB')
    img = img.filter(ImageFilter.GaussianBlur(radius=18))

    # Soft vignette — pulls the eye to center
    img = soft_vignette(img, strength=60)
    d   = ImageDraw.Draw(img)

    # Large abstract family silhouette shapes — joyful composition
    sil = Image.new('RGBA', (W, H), (0,0,0,0))
    sd  = ImageDraw.Draw(sil)
    # Two adult figures (large ovals) + small baby oval
    sd.ellipse([220, 300, 520, 720], fill=(200, 155, 90, 20))    # parent 1
    sd.ellipse([560, 280, 860, 700], fill=(195, 148, 82, 18))    # parent 2
    sd.ellipse([370, 380, 590, 590], fill=(255, 235, 195, 25))   # baby center
    img = Image.alpha_composite(img.convert('RGBA'), sil).convert('RGB')

    d = ImageDraw.Draw(img)

    # Top: brand
    brand_tag(d, y=52)

    # Eyebrow
    ef = F("InstrumentSans-Regular.ttf", 21)
    eyebrow = "FOR FAMILIES WHO LIVE ONLINE"
    d.text(((W - text_w(d, eyebrow, ef))//2, 52), eyebrow, font=ef, fill=(100, 72, 28))

    # Main headline — very large, centered, joyful
    hf = F("Italiana-Regular.ttf", 94)
    lines = ["They're not", "your parents'", "baby books."]
    hy = 200
    for i, line in enumerate(lines):
        col = (60, 38, 8) if i < 2 else GOLD_DK
        x   = (W - text_w(d, line, hf))//2
        d.text((x, hy), line, font=hf, fill=col)
        hy += text_h_val(d, line, hf) - 16

    hy += 30

    # Thin rule
    d.line([(W//2 - 70, hy), (W//2 + 70, hy)], fill=(150, 110, 50), width=1)
    hy += 32

    # Body
    bf = F("InstrumentSans-Regular.ttf", 29)
    body = "A curated digital baby book at a real .com — the most personal website on the internet."
    hy = draw_centered(d, body, hy, bf, (75, 52, 18), max_w=830)
    hy += 36

    # CTA — dark bg on golden ad
    cta_button(d, "Start for $29 →", W//2, hy,
               F("InstrumentSans-Bold.ttf", 29), bg=DARK, fg=CREAM)

    hy += 68 + 36  # button height + spacing

    # Bottom feature strip
    features = ["📸  Unlimited photos", "🌐  Real .com domain", "📱  Mobile app"]
    ff = F("InstrumentSans-Regular.ttf", 22)
    strip_y = H - 90
    total_w = sum(text_w(d, f, ff) for f in features) + 80*(len(features)-1)
    fx = (W - total_w) // 2
    for feat in features:
        d.text((fx, strip_y), feat, font=ff, fill=(80, 58, 20))
        fx += text_w(d, feat, ff) + 80
    # Rule above features
    d.line([(80, strip_y - 16), (W-80, strip_y - 16)], fill=(160, 120, 60), width=1)

    img = noise_texture(img, 4)
    img.save(os.path.join(OUTPUT, "ad5_modern_family.png"))
    print("AD 5 saved")


# ── Design Philosophy .md ──────────────────────────────────────────────────────
philosophy = """# Warm Inheritance

A design philosophy rooted in the luminosity of memory — the quality of light
that seems to exist only in recollection. Form is built from warmth, not geometry.
Composition is felt before it is read. Every element earns its place through the
weight of emotional truth.

## Space and Form

Space breathes here. Large zones of uninterrupted warm tone carry the eye with
the same unhurried gentleness as golden-hour light falling through a window.
Forms are soft, rounded, organic — never mechanical. The canvas holds its
breath between elements. Negative space is not emptiness; it is the pause
between heartbeats, meticulous in its calibration by a master who knows that
restraint is the highest craft.

## Color and Material

The palette is excavated from the warmth of skin, linen, honey, and morning
light. Amber, antique rose, pale champagne, deep honey — colors that exist in
the temperature range between comfort and memory. Gold is used sparingly, the
way a goldsmith uses leaf: one true accent rather than ornament. Every color
decision is the product of painstaking calibration, tested against dozens of
variations until the precise warmth is achieved.

## Scale and Rhythm

Typography moves in two registers: the monumental and the whispered. Headlines
occupy grand architectural scale — classical serif forms given room to stand
as sculpture. Body text retreats into quiet service, lending context without
competing. The rhythm between these scales is the result of countless
refinements, the kind of labor that only a practitioner at the absolute top
of their field would undertake.

## Composition and Hierarchy

Information flows from warmth to clarity: from the luminous, impressionistic
field that captures feeling, into the precise typographic zone that anchors
meaning. Each panel, each layer, each transition is crafted with the care
of a darkroom photographer making a final print — painstaking in its attention
to gradation, edge, and tone. Nothing is placed casually. Every margin,
every leading, every color temperature is the product of deep expertise.

## Visual Expression

The work reads as artifact before it reads as advertisement — a piece that
belongs in the pages of a high-design magazine, or above a fireplace in a
home where beauty is taken seriously. It proves that commercial intent and
aesthetic integrity are not opposites. The viewer should feel, before they
think. They should want to hold it.
"""

with open(os.path.join(OUTPUT, "design_philosophy.md"), 'w', encoding='utf-8') as f:
    f.write(philosophy)
print("Design philosophy saved")

# ── Run all ────────────────────────────────────────────────────────────────────
print("\nGenerating 5 Legacy Odyssey Facebook ads...")
ad1()
ad2()
ad3()
ad4()
ad5()
print("\nAll 5 ads complete -> " + OUTPUT)
