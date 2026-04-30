"""
Legacy Odyssey — Facebook Ads v3
Smiling baby photo · Cormorant Garamond + Jost · your-childs-name.com palette
3 layout variations
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os, math

OUTPUT   = r"E:\Claude\legacy-odyssey\ads"
FONTS    = r"E:\Claude\legacy-odyssey\ads\fonts"
PHOTO    = r"E:\Claude\legacy-odyssey\ads\photos\smiling_baby.jpg"

W = H = 1080

# ── Exact your-childs-name.com palette ────────────────────────────────────────
CREAM      = (250, 247, 242)   # --cream
IVORY      = (255, 253, 248)   # --ivory
GOLD       = (200, 169, 110)   # --gold
GOLD_LIGHT = (212, 187, 138)   # --gold-light
GOLD_DARK  = (176, 142,  74)   # --gold-dark
INK        = ( 26,  21,  16)   # --ink
INK_MID    = ( 44,  36,  22)   # --ink-mid
INK_LIGHT  = (138, 126, 107)   # --ink-light
CARD       = (240, 232, 220)   # --card
BORDER     = (224, 213, 196)   # --border
WHITE      = (255, 255, 255)

# ── Fonts ──────────────────────────────────────────────────────────────────────
def F(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONTS, name), size)
    except Exception as e:
        print(f"  font warn: {e}")
        return ImageFont.load_default()

# Cormorant Garamond variants
CG_REG  = lambda s: F("CormorantGaramond-Regular.ttf", s)
CG_SB   = lambda s: F("CormorantGaramond-SemiBold.ttf", s)
CG_BOLD = lambda s: F("CormorantGaramond-Bold.ttf", s)
CG_IT   = lambda s: F("CormorantGaramond-Italic.ttf", s)
CG_SBIT = lambda s: F("CormorantGaramond-SemiBoldItalic.ttf", s)

# Jost variants
JOST_LT  = lambda s: F("Jost-Light.ttf", s)
JOST_REG = lambda s: F("Jost-Regular.ttf", s)
JOST_MED = lambda s: F("Jost-Medium.ttf", s)
JOST_SB  = lambda s: F("Jost-SemiBold.ttf", s)

# ── Helpers ────────────────────────────────────────────────────────────────────
def tw(draw, text, font):
    bb = draw.textbbox((0,0), text, font=font)
    return bb[2] - bb[0]

def th(draw, text, font):
    bb = draw.textbbox((0,0), text, font=font)
    return bb[3] - bb[1]

def draw_centered(draw, text, y, font, color, max_w=940, gap=10):
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
        y += th(draw, line, font) + gap
    return y

def gradient_overlay(img, direction, color, a_start, a_end, span=0.6):
    ov = Image.new('RGBA', img.size, (0,0,0,0))
    od = ImageDraw.Draw(ov)
    steps = int(H * span)
    for i in range(steps):
        t = (i / max(steps-1,1)) ** 1.5
        a = int(a_start + (a_end - a_start) * t)
        if direction == 'bottom':
            y = H - steps + i
            od.line([(0,y),(W,y)], fill=(*color, a))
        elif direction == 'top':
            od.line([(0,i),(W,i)], fill=(*color, a))
        elif direction == 'left':
            od.line([(i,0),(i,H)], fill=(*color, a))
    return Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB')

def cta(draw, text, cx, y, font, bg=GOLD, fg=WHITE, px=56, py=22):
    btw = tw(draw, text, font); bth = th(draw, text, font)
    bw  = btw + px*2;           bh  = bth + py*2
    x0, y0 = cx - bw//2, y;    x1, y1 = cx + bw//2, y + bh
    draw.rounded_rectangle([x0,y0,x1,y1], radius=3, fill=bg)
    draw.text((cx - btw//2, y0 + py), text, font=font, fill=fg)
    return y1

def load_baby(crop_box=None):
    img = Image.open(PHOTO).convert('RGB')
    img = img.resize((W, H), Image.LANCZOS)
    if crop_box:
        img = img.crop(crop_box).resize((W, H), Image.LANCZOS)
    # Warm grade
    img = ImageEnhance.Contrast(img).enhance(1.08)
    img = ImageEnhance.Brightness(img).enhance(1.03)
    r, g, b = img.split()
    r = r.point(lambda x: min(255, x + 10))
    img = Image.merge('RGB', (r, g, b))
    return img

# ══════════════════════════════════════════════════════════════════════════════
# AD A — Full bleed photo · Heavy ink bottom panel · Classic editorial
# ══════════════════════════════════════════════════════════════════════════════
def ad_a():
    photo = load_baby()

    # Gradient bottom → ink
    photo = gradient_overlay(photo, 'bottom', INK, 0, 245, span=0.58)
    # Soft top fade for brand area
    photo = gradient_overlay(photo, 'top', INK, 180, 0, span=0.18)

    d = ImageDraw.Draw(photo)

    # ── Top brand bar ──
    brand_f  = JOST_REG(22)
    brand_tx = "legacyodyssey.com"
    d.text(((W - tw(d, brand_tx, brand_f))//2, 44), brand_tx, font=brand_f, fill=GOLD)
    d.line([(W//2-40, 76), (W//2+40, 76)], fill=GOLD, width=1)

    # ── Bottom text zone ──
    # Eyebrow
    ey_f  = JOST_REG(20)
    ey_tx = "DIGITAL BABY BOOK  ·  YOUR OWN .COM DOMAIN"
    d.text(((W - tw(d, ey_tx, ey_f))//2, H-370), ey_tx, font=ey_f, fill=GOLD_LIGHT)

    # Gold rule
    d.line([(W//2-60, H-342), (W//2+60, H-342)], fill=GOLD, width=1)

    # Main headline — Cormorant Garamond SemiBold, very large
    hf  = CG_SB(100)
    hfi = CG_SBIT(100)
    l1  = "They're not your"
    l2  = "parents' baby books."
    hy  = H - 326
    d.text(((W - tw(d, l1, hf))//2, hy), l1, font=hf, fill=WHITE)
    hy += th(d, l1, hf) - 8
    d.text(((W - tw(d, l2, hfi))//2, hy), l2, font=hfi, fill=GOLD)
    hy += th(d, l2, hfi) + 28

    # Body — Jost Light
    bf   = JOST_LT(30)
    body = "A private .com website for your baby — beautifully designed and simple to use."
    hy   = draw_centered(d, body, hy, bf, (218, 208, 192), max_w=860)
    hy  += 32

    cta(d, "Start for $29  →", W//2, hy, JOST_SB(29))

    photo.save(os.path.join(OUTPUT, "adA_editorial.png"))
    print("AD A saved")

# ══════════════════════════════════════════════════════════════════════════════
# AD B — Cream top panel · Photo bottom half · Ink/gold type on cream
# ══════════════════════════════════════════════════════════════════════════════
def ad_b():
    canvas = Image.new('RGB', (W, H), CREAM)
    d_c    = ImageDraw.Draw(canvas)

    PANEL_H = 430   # cream text panel height

    # ── Cream panel content ──
    # Brand
    bf_brand = JOST_REG(20)
    d_c.text((56, 44), "legacyodyssey.com", font=bf_brand, fill=GOLD)
    d_c.line([(56, 72), (200, 72)], fill=GOLD, width=1)

    # Eyebrow
    ey = "EXCLUSIVE  ·  ELEGANT  ·  AFFORDABLE"
    d_c.text(((W - tw(d_c, ey, JOST_REG(19)))//2, 56),
             ey, font=JOST_REG(19), fill=INK_LIGHT)

    # Headline
    hf  = CG_SB(98)
    hfi = CG_SBIT(98)
    l1, l2 = "They're not your", "parents' baby books."
    hy = 108
    d_c.text(((W - tw(d_c, l1, hf))//2, hy), l1, font=hf, fill=INK)
    hy += th(d_c, l1, hf) - 12
    d_c.text(((W - tw(d_c, l2, hfi))//2, hy), l2, font=hfi, fill=GOLD_DARK)
    hy += th(d_c, l2, hfi) + 20

    # Thin gold rule
    d_c.line([(W//2-50, hy), (W//2+50, hy)], fill=GOLD, width=1)
    hy += 20

    # Body
    bf   = JOST_LT(28)
    body = "A private .com website — beautifully designed, simple to fill in from your phone."
    hy   = draw_centered(d_c, body, hy, bf, INK_LIGHT, max_w=860)
    hy  += 24

    # CTA
    cta(d_c, "Start for $29  →", W//2, hy, JOST_SB(28), bg=INK, fg=CREAM)

    # ── Photo panel ──
    photo = load_baby()
    # Crop to show the baby's face/smile prominently
    photo_crop = photo.crop((0, 200, W, H)).resize((W, H - PANEL_H), Image.LANCZOS)
    # Top fade into cream
    fade = Image.new('RGBA', photo_crop.size, (0,0,0,0))
    fd   = ImageDraw.Draw(fade)
    for y in range(80):
        t = 1 - y/80
        fd.line([(0,y),(W,y)], fill=(*CREAM, int(255*t**1.8)))
    photo_rgba = Image.alpha_composite(photo_crop.convert('RGBA'), fade).convert('RGB')

    canvas.paste(photo_rgba, (0, PANEL_H))

    # Gold border line between panels
    d_c.line([(0, PANEL_H), (W, PANEL_H)], fill=GOLD, width=2)

    canvas.save(os.path.join(OUTPUT, "adB_split.png"))
    print("AD B saved")

# ══════════════════════════════════════════════════════════════════════════════
# AD C — Photo left (clean crop) · Cream right panel · Ink type
# ══════════════════════════════════════════════════════════════════════════════
def ad_c():
    SPLIT = 530  # photo panel width

    canvas = Image.new('RGB', (W, H), CREAM)

    # ── Left photo panel — crop center of square photo to exact SPLIT:H ratio ──
    photo = load_baby()
    # Crop a SPLIT-wide strip from the horizontal center of the 1080x1080 photo
    margin = (W - SPLIT) // 2
    left   = photo.crop((margin, 0, margin + SPLIT, H))  # exactly SPLIT x H, no resize needed

    # Soft right-edge fade into cream (no distortion — just alpha fade)
    fade = Image.new('RGBA', (SPLIT, H), (0,0,0,0))
    fd   = ImageDraw.Draw(fade)
    fade_w = 100
    for x in range(fade_w):
        t = x / fade_w
        a = int(255 * t ** 1.6)
        fd.line([(SPLIT - fade_w + x, 0), (SPLIT - fade_w + x, H)], fill=(*CREAM, a))
    left_rgba = Image.alpha_composite(left.convert('RGBA'), fade).convert('RGB')
    canvas.paste(left_rgba, (0, 0))

    d = ImageDraw.Draw(canvas)

    # Thin gold vertical rule at split
    d.line([(SPLIT, 60), (SPLIT, H - 60)], fill=GOLD, width=1)

    # ── Right cream panel ──
    rx   = SPLIT + 44
    rmax = W - rx - 40   # max text width in right panel

    # Brand
    d.text((rx, 52), "legacyodyssey.com", font=JOST_REG(20), fill=GOLD)
    d.line([(rx, 78), (rx + 140, 78)], fill=BORDER, width=1)

    # Eyebrow
    d.text((rx, 108), "DIGITAL BABY BOOK", font=JOST_REG(18), fill=INK_LIGHT)

    # Headline — Cormorant Garamond, left-aligned
    hf  = CG_SB(76)
    hfi = CG_SBIT(76)
    # Scale if too wide
    while tw(d, "parents' baby books.", hf) > rmax:
        hf  = CG_SB(hf.size - 2)
        hfi = CG_SBIT(hfi.size - 2)

    hy = 148
    d.text((rx, hy), "They're not", font=hf, fill=INK)
    hy += th(d, "They're not", hf) - 4
    d.text((rx, hy), "your parents'", font=hf, fill=INK)
    hy += th(d, "your parents'", hf) - 4
    d.text((rx, hy), "baby books.", font=hfi, fill=GOLD_DARK)
    hy += th(d, "baby books.", hfi) + 24

    # Gold rule
    d.line([(rx, hy), (rx + 80, hy)], fill=GOLD, width=1)
    hy += 22

    # Body — Jost Light, left aligned, wrapped
    bf = JOST_LT(24)
    body_words = "Built for families who live online. A curated baby book at a real .com — exclusively yours.".split()
    lines, cur = [], []
    for w in body_words:
        test = ' '.join(cur + [w])
        if tw(d, test, bf) > rmax and cur:
            lines.append(' '.join(cur)); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(' '.join(cur))
    for line in lines:
        d.text((rx, hy), line, font=bf, fill=INK_LIGHT)
        hy += th(d, line, bf) + 8
    hy += 24

    # CTA button — full right-panel width
    btn_w = W - rx - 40
    btn_h = 58
    cf    = JOST_SB(26)
    cta_t = "Start for $29  →"
    d.rounded_rectangle([rx, hy, rx + btn_w, hy + btn_h], radius=3, fill=INK)
    ctw_val = tw(d, cta_t, cf)
    d.text((rx + (btn_w - ctw_val)//2, hy + (btn_h - th(d, cta_t, cf))//2),
           cta_t, font=cf, fill=CREAM)
    hy += btn_h + 32

    # Feature list
    d.line([(rx, hy), (W - 40, hy)], fill=BORDER, width=1)
    hy += 16
    feats = ["Unlimited photos", "Real .com domain", "Mobile app"]
    ff = JOST_REG(18)
    for feat in feats:
        d.text((rx, hy), "·  " + feat, font=ff, fill=INK_LIGHT)
        hy += th(d, feat, ff) + 8

    canvas.save(os.path.join(OUTPUT, "adC_panel.png"))
    print("AD C saved")


print("Building 3 ads...")
ad_a()
ad_b()
ad_c()
print("Done ->", OUTPUT)
