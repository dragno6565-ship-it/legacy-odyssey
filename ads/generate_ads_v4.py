# -*- coding: utf-8 -*-
"""
Legacy Odyssey — Facebook Ads v4
9 ads · Cormorant Garamond + Jost · your-childs-name.com palette
Photos: smiling baby + baby feet + baby hands
Research-driven copy angles
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os, math

OUTPUT = r"E:\Claude\legacy-odyssey\ads"
FONTS  = r"E:\Claude\legacy-odyssey\ads\fonts"
PHOTOS = r"E:\Claude\legacy-odyssey\ads\photos"
W = H  = 1080

# Palette — exact your-childs-name.com
CREAM      = (250, 247, 242)
IVORY      = (255, 253, 248)
GOLD       = (200, 169, 110)
GOLD_LT    = (212, 187, 138)
GOLD_DK    = (176, 142,  74)
INK        = ( 26,  21,  16)
INK_MID    = ( 44,  36,  22)
INK_LIGHT  = (138, 126, 107)
CARD       = (240, 232, 220)
BORDER     = (224, 213, 196)
WHITE      = (255, 255, 255)

def F(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONTS, name), size)
    except:
        return ImageFont.load_default()

CG_REG  = lambda s: F("CormorantGaramond-Regular.ttf", s)
CG_SB   = lambda s: F("CormorantGaramond-SemiBold.ttf", s)
CG_BOLD = lambda s: F("CormorantGaramond-Bold.ttf", s)
CG_IT   = lambda s: F("CormorantGaramond-Italic.ttf", s)
CG_SBIT = lambda s: F("CormorantGaramond-SemiBoldItalic.ttf", s)
JOST_LT  = lambda s: F("Jost-Light.ttf", s)
JOST_REG = lambda s: F("Jost-Regular.ttf", s)
JOST_MED = lambda s: F("Jost-Medium.ttf", s)
JOST_SB  = lambda s: F("Jost-SemiBold.ttf", s)

def tw(d, t, f):
    bb = d.textbbox((0,0), t, font=f); return bb[2]-bb[0]
def th(d, t, f):
    bb = d.textbbox((0,0), t, font=f); return bb[3]-bb[1]

def wrap(draw, text, font, max_w):
    words = text.split(); lines, cur = [], []
    for w in words:
        test = ' '.join(cur+[w])
        if tw(draw, test, font) > max_w and cur:
            lines.append(' '.join(cur)); cur=[w]
        else: cur.append(w)
    if cur: lines.append(' '.join(cur))
    return lines

def draw_left(draw, text, x, y, font, color, max_w=460, gap=10):
    for line in wrap(draw, text, font, max_w):
        draw.text((x, y), line, font=font, fill=color)
        y += th(draw, line, font) + gap
    return y

def draw_center(draw, text, y, font, color, max_w=940, gap=10):
    for line in wrap(draw, text, font, max_w):
        draw.text(((W - tw(draw, line, font))//2, y), line, font=font, fill=color)
        y += th(draw, line, font) + gap
    return y

def grad(img, direction, color, a0, a1, span=0.6):
    ov = Image.new('RGBA', img.size, (0,0,0,0))
    od = ImageDraw.Draw(ov)
    steps = int(H * span)
    for i in range(steps):
        t = (i/max(steps-1,1))**1.5
        a = int(a0 + (a1-a0)*t)
        if   direction=='bottom': y=H-steps+i; od.line([(0,y),(W,y)], fill=(*color,a))
        elif direction=='top':              od.line([(0,i),(W,i)], fill=(*color,a))
        elif direction=='left':             od.line([(i,0),(i,H)], fill=(*color,a))
        elif direction=='right': x=W-steps+i; od.line([(x,0),(x,H)], fill=(*color,a))
    return Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB')

def cta_btn(draw, text, cx, y, font, bg=GOLD, fg=WHITE, px=56, py=22):
    btw=tw(draw,text,font); bth=th(draw,text,font)
    bw=btw+px*2; bh=bth+py*2
    x0=cx-bw//2; x1=cx+bw//2
    draw.rounded_rectangle([x0,y,x1,y+bh], radius=3, fill=bg)
    draw.text((cx-btw//2, y+py), text, font=font, fill=fg)
    return y+bh

def cta_left(draw, text, x, y, w, font, bg=GOLD, fg=WHITE, py=20):
    bth=th(draw,text,font); bh=bth+py*2
    draw.rounded_rectangle([x,y,x+w,y+bh], radius=3, fill=bg)
    draw.text((x+(w-tw(draw,text,font))//2, y+py), text, font=font, fill=fg)
    return y+bh

def brand_gold(draw, y=44, cx=W//2):
    f = JOST_REG(21)
    t = "legacyodyssey.com"
    draw.text((cx - tw(draw,t,f)//2, y), t, font=f, fill=GOLD)
    draw.line([(cx-40,y+28),(cx+40,y+28)], fill=GOLD, width=1)

def brand_left(draw, x=54, y=44):
    f = JOST_REG(20)
    draw.text((x, y), "legacyodyssey.com", font=f, fill=GOLD)
    draw.line([(x, y+27),(x+150,y+27)], fill=(70,55,28), width=1)

def eyebrow_center(draw, text, y, color=None):
    f = JOST_REG(19)
    c = color or GOLD_LT
    draw.text(((W-tw(draw,text,f))//2, y), text, font=f, fill=c)
    return y + th(draw,text,f) + 8

def photo(fname, box=None, warm=10, contrast=1.08, brightness=1.03):
    img = Image.open(os.path.join(PHOTOS, fname)).convert('RGB')
    img = img.resize((W,H), Image.LANCZOS)
    if box: img = img.crop(box).resize((W,H), Image.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Brightness(img).enhance(brightness)
    r,g,b = img.split()
    r = r.point(lambda x: min(255, x+warm))
    return Image.merge('RGB',(r,g,b))

def vline(draw, x, color=GOLD, margin=60):
    draw.line([(x, margin),(x, H-margin)], fill=color, width=1)

def hline(draw, y, x0=54, x1=W-54, color=GOLD):
    draw.line([(x0,y),(x1,y)], fill=color, width=1)

# ─────────────────────────────────────────────────────────────────────────────
# 1. "Cyber real estate" — smiling baby, full-bleed, bold centered
# ─────────────────────────────────────────────────────────────────────────────
def ad01():
    img = photo("smiling_baby.jpg", warm=12)
    img = grad(img, 'top',    INK,  200,  0, span=0.22)
    img = grad(img, 'bottom', INK,    0, 250, span=0.60)
    d   = ImageDraw.Draw(img)

    brand_gold(d, y=44)

    eyebrow_center(d, "LEGACY ODYSSEY  ·  DIGITAL BABY BOOK", 90, GOLD_LT)

    hline(d, 122, W//2-70, W//2+70, GOLD)

    hy = H - 370
    l1f = CG_SB(74); l2f = CG_SBIT(74)
    l1 = "Give your baby their own"
    l2 = "piece of the internet."
    d.text(((W-tw(d,l1,l1f))//2, hy), l1, font=l1f, fill=WHITE)
    hy += th(d,l1,l1f) - 6
    d.text(((W-tw(d,l2,l2f))//2, hy), l2, font=l2f, fill=GOLD)
    hy += th(d,l2,l2f) + 16

    hline(d, hy, W//2-60, W//2+60)
    hy += 20

    bf = JOST_LT(28)
    body = "A real .com domain — exclusively your baby's. Beautifully designed, private, and built to last."
    hy = draw_center(d, body, hy, bf, (215,205,188), max_w=860)
    hy += 30

    cta_btn(d, "Claim Their Domain  \u2192", W//2, hy, JOST_SB(28))

    img.save(os.path.join(OUTPUT, "01_cyber_real_estate.png"))
    print("01 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 2. "The baby book grandma can actually visit" — smiling baby, cream top panel
# ─────────────────────────────────────────────────────────────────────────────
def ad02():
    PANEL = 400
    canvas = Image.new('RGB', (W,H), CREAM)

    # Cream panel
    d = ImageDraw.Draw(canvas)
    brand_left(d, 54, 44)
    d.text((54, 96), "FAMILY CONNECTION", font=JOST_REG(19), fill=INK_LIGHT)

    hf = CG_SB(88); hfi = CG_SBIT(88)
    while tw(d,"can actually visit.", hf) > W-108:
        hf = CG_SB(hf.size-2); hfi = CG_SBIT(hfi.size-2)

    hy = 126
    d.text(((W-tw(d,"The baby book",hf))//2, hy), "The baby book", font=hf, fill=INK)
    hy += th(d,"The baby book",hf) - 10
    d.text(((W-tw(d,"grandma can",hf))//2, hy), "grandma can", font=hf, fill=INK)
    hy += th(d,"grandma can",hf) - 10
    d.text(((W-tw(d,"actually visit.",hfi))//2, hy), "actually visit.", font=hfi, fill=GOLD_DK)
    hy += th(d,"actually visit.",hfi) + 16

    bf = JOST_LT(27)
    body = "Share a link — family anywhere in the world can see every milestone, photo, and letter."
    hy = draw_center(d, body, hy, bf, INK_LIGHT, max_w=840)
    hy += 22
    cta_btn(d, "Start for $29  \u2192", W//2, hy, JOST_SB(27), bg=INK, fg=CREAM)

    # Photo strip
    img = photo("smiling_baby.jpg", warm=8)
    strip = img.crop((0,250,W,H)).resize((W,H-PANEL), Image.LANCZOS)
    fade = Image.new('RGBA', strip.size, (0,0,0,0))
    fd = ImageDraw.Draw(fade)
    for y in range(70):
        t = 1-y/70
        fd.line([(0,y),(W,y)], fill=(*CREAM, int(255*t**2)))
    strip = Image.alpha_composite(strip.convert('RGBA'), fade).convert('RGB')
    canvas.paste(strip, (0, PANEL))
    d = ImageDraw.Draw(canvas)
    d.line([(0,PANEL),(W,PANEL)], fill=GOLD, width=2)

    canvas.save(os.path.join(OUTPUT, "02_grandma_can_visit.png"))
    print("02 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 3. "You already document everything" — smiling baby, left photo / right cream
# ─────────────────────────────────────────────────────────────────────────────
def ad03():
    SPLIT = 520
    canvas = Image.new('RGB', (W,H), CREAM)

    img = photo("smiling_baby.jpg", warm=10)
    margin = (W-SPLIT)//2
    left = img.crop((margin,0,margin+SPLIT,H))
    fade = Image.new('RGBA', (SPLIT,H), (0,0,0,0))
    fd = ImageDraw.Draw(fade)
    for x in range(90):
        t=x/90; a=int(255*t**1.5)
        fd.line([(SPLIT-90+x,0),(SPLIT-90+x,H)], fill=(*CREAM,a))
    left = Image.alpha_composite(left.convert('RGBA'), fade).convert('RGB')
    canvas.paste(left, (0,0))

    d = ImageDraw.Draw(canvas)
    vline(d, SPLIT)

    rx = SPLIT+42; rw = W-rx-40
    brand_left(d, rx, 50)
    d.text((rx,92), "FOR MODERN PARENTS", font=JOST_REG(18), fill=INK_LIGHT)

    hf = CG_SB(72); hfi = CG_SBIT(72)
    while tw(d,"Now it has a home.", hf) > rw:
        hf = CG_SB(hf.size-2); hfi = CG_SBIT(hfi.size-2)

    hy = 130
    for txt, f, c in [("You already", hf, INK),
                       ("document", hf, INK),
                       ("everything.", hf, INK),
                       ("Now it has", hfi, GOLD_DK),
                       ("a home.", hfi, GOLD_DK)]:
        d.text((rx, hy), txt, font=f, fill=c)
        hy += th(d,txt,f) - 2
    hy += 22

    hline(d, hy, rx, rx+80)
    hy += 18

    bf = JOST_LT(23)
    hy = draw_left(d, "A curated baby book at a real .com domain — filled in from your phone in minutes.", rx, hy, bf, INK_LIGHT, max_w=rw)
    hy += 22

    cta_left(d, "Start for $29  \u2192", rx, hy, rw, JOST_SB(25))

    canvas.save(os.path.join(OUTPUT, "03_document_everything.png"))
    print("03 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 4. "While you're falling in love" — smiling baby, full bleed, poetic
# ─────────────────────────────────────────────────────────────────────────────
def ad04():
    img = photo("smiling_baby.jpg", warm=15, contrast=1.05)
    img = grad(img, 'bottom', INK, 0, 240, span=0.65)
    img = grad(img, 'top', INK, 120, 0, span=0.15)
    d = ImageDraw.Draw(img)

    brand_gold(d, 44)
    eyebrow_center(d, "LEGACY ODYSSEY", 88, (140,118,78))

    hy = H-390
    hf = CG_IT(72); hf2 = CG_SB(72); hfi = CG_SBIT(72)
    lines = [
        ("While you're busy", CG_IT(72), WHITE),
        ("falling in love —", CG_IT(72), WHITE),
        ("we're busy", CG_SB(72), WHITE),
        ("preserving it.", hfi, GOLD),
    ]
    for txt, f, c in lines:
        d.text(((W-tw(d,txt,f))//2, hy), txt, font=f, fill=c)
        hy += th(d,txt,f) - 4
    hy += 24

    hline(d, hy, W//2-60, W//2+60)
    hy += 20

    bf = JOST_LT(27)
    hy = draw_center(d, "A private .com website that holds every milestone, photo, and letter from your baby's first years.", hy, bf, (212,200,178), max_w=850)
    hy += 30
    cta_btn(d, "Start for $29  \u2192", W//2, hy, JOST_SB(28))

    img.save(os.path.join(OUTPUT, "04_falling_in_love.png"))
    print("04 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 5. "Every tiny detail" — baby feet, full bleed, minimal
# ─────────────────────────────────────────────────────────────────────────────
def ad05():
    img = photo("baby_feet.jpg", warm=18, contrast=1.1, brightness=1.05)
    img = grad(img, 'bottom', INK, 0, 235, span=0.55)
    img = grad(img, 'top', CREAM, 80, 0, span=0.12)
    d = ImageDraw.Draw(img)

    brand_gold(d, 44)

    hy = H-320
    hf = CG_SB(92); hfi = CG_SBIT(92)
    l1 = "Every tiny detail."
    l2 = "Beautifully kept."
    d.text(((W-tw(d,l1,hf))//2, hy), l1, font=hf, fill=WHITE)
    hy += th(d,l1,hf) - 8
    d.text(((W-tw(d,l2,hfi))//2, hy), l2, font=hfi, fill=GOLD)
    hy += th(d,l2,hfi) + 22

    bf = JOST_LT(28)
    hy = draw_center(d, "A curated digital baby book at their own .com — for the parents who want more than a camera roll.", hy, bf, (215,205,188), max_w=840)
    hy += 30
    cta_btn(d, "Start for $29  \u2192", W//2, hy, JOST_SB(28))

    img.save(os.path.join(OUTPUT, "05_every_tiny_detail.png"))
    print("05 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 6. "Their .com is waiting" — baby feet, cream right panel
# ─────────────────────────────────────────────────────────────────────────────
def ad06():
    SPLIT = 510
    canvas = Image.new('RGB', (W,H), CREAM)

    img = photo("baby_feet.jpg", warm=15, contrast=1.08)
    margin = (W-SPLIT)//2 - 40
    left = img.crop((margin, 0, margin+SPLIT, H))
    fade = Image.new('RGBA', (SPLIT,H), (0,0,0,0))
    fd = ImageDraw.Draw(fade)
    for x in range(100):
        t=x/100; a=int(255*t**1.4)
        fd.line([(SPLIT-100+x,0),(SPLIT-100+x,H)], fill=(*CREAM,a))
    left = Image.alpha_composite(left.convert('RGBA'), fade).convert('RGB')
    canvas.paste(left, (0,0))

    d = ImageDraw.Draw(canvas)
    vline(d, SPLIT)

    rx = SPLIT+44; rw = W-rx-40
    brand_left(d, rx, 50)
    d.text((rx,92), "DOMAIN OWNERSHIP", font=JOST_REG(18), fill=INK_LIGHT)

    hline(d, 118, rx, rx+100)

    hf = CG_SB(80); hfi = CG_SBIT(80)
    while tw(d,"is waiting.", hf) > rw:
        hf = CG_SB(hf.size-2); hfi = CG_SBIT(hfi.size-2)

    hy = 136
    d.text((rx,hy), "Their .com", font=hf, fill=INK);  hy+=th(d,"Their .com",hf)-4
    d.text((rx,hy), "is waiting.", font=hfi, fill=GOLD_DK); hy+=th(d,"is waiting.",hfi)+28

    # Big domain display
    dom_f = CG_REG(42)
    dom = "yourbabyname.com"
    while tw(d,dom,dom_f)>rw: dom_f=CG_REG(dom_f.size-2)
    d.rounded_rectangle([rx-4, hy-8, rx+rw, hy+th(d,dom,dom_f)+8], radius=3, fill=CARD, outline=BORDER, width=1)
    d.text((rx+8, hy), dom, font=dom_f, fill=INK_LIGHT)
    hline(d, hy+th(d,dom,dom_f)+16, rx, rx+rw, GOLD)
    hy += th(d,dom,dom_f)+30

    bf = JOST_LT(23)
    hy = draw_left(d, "Register it at checkout. Share it with everyone. Keep it for a lifetime.", rx, hy, bf, INK_LIGHT, max_w=rw)
    hy += 22
    cta_left(d, "Claim Their Domain  \u2192", rx, hy, rw, JOST_SB(24))

    canvas.save(os.path.join(OUTPUT, "06_their_com_waiting.png"))
    print("06 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 7. "From tiny feet to first word" — baby feet, cream bottom strip
# ─────────────────────────────────────────────────────────────────────────────
def ad07():
    STRIP = 310
    img = photo("baby_feet.jpg", warm=20, contrast=1.1, brightness=1.04)
    img = grad(img, 'bottom', CREAM, 0, 255, span=0.32)
    img = grad(img, 'top', INK, 150, 0, span=0.14)

    canvas = Image.new('RGB', (W,H), CREAM)
    canvas.paste(img, (0,0))

    d = ImageDraw.Draw(canvas)
    brand_gold(d, 44)

    # Bottom cream text area
    ty = H - STRIP + 20
    eyebrow_center(d, "LEGACY ODYSSEY  ·  DIGITAL BABY BOOK", ty, INK_LIGHT)
    ty += 30

    hline(d, ty, W//2-60, W//2+60)
    ty += 18

    hf = CG_SB(72); hfi = CG_SBIT(72)
    while tw(d,"all at their own .com.", hf) > W-120:
        hf = CG_SB(hf.size-2); hfi = CG_SBIT(hfi.size-2)

    d.text(((W-tw(d,"From tiny feet to first words —",hf))//2, ty), "From tiny feet to first words —", font=CG_IT(hf.size), fill=INK)
    ty += th(d,"From",hf) - 2
    d.text(((W-tw(d,"all at their own .com.",hfi))//2, ty), "all at their own .com.", font=hfi, fill=GOLD_DK)
    ty += th(d,"all",hfi) + 16

    bf = JOST_LT(25)
    ty = draw_center(d, "Start for just $29 — the most personal website on the internet.", ty, bf, INK_LIGHT, max_w=800)
    ty += 20
    cta_btn(d, "Start for $29  \u2192", W//2, ty, JOST_SB(26), bg=INK, fg=CREAM)

    canvas.save(os.path.join(OUTPUT, "07_tiny_feet_to_first_word.png"))
    print("07 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 8. "A private corner of the internet" — baby hands, editorial full bleed
# ─────────────────────────────────────────────────────────────────────────────
def ad08():
    img = photo("baby_hands.jpg", warm=14, contrast=1.1, brightness=1.02)
    img = grad(img, 'bottom', INK, 0, 255, span=0.62)
    img = grad(img, 'top', INK, 180, 0, span=0.20)
    d = ImageDraw.Draw(img)

    brand_gold(d, 44)
    eyebrow_center(d, "EXCLUSIVE  \u00b7  PRIVATE  \u00b7  YOURS", 88, (155,128,78))
    hline(d, 118, W//2-55, W//2+55)

    hy = H-370
    lines = [
        ("A private corner", CG_SB(78), WHITE),
        ("of the internet —", CG_SB(78), WHITE),
        ("entirely theirs.", CG_SBIT(78), GOLD),
    ]
    for txt, f, c in lines:
        while tw(d,txt,f)>W-80: f=CG_SB(f.size-2) if c==WHITE else CG_SBIT(f.size-2)
        d.text(((W-tw(d,txt,f))//2, hy), txt, font=f, fill=c)
        hy += th(d,txt,f) - 6
    hy += 24

    hline(d, hy, W//2-60, W//2+60)
    hy += 20

    bf = JOST_LT(28)
    hy = draw_center(d, "Every milestone, photo, letter, and recipe — beautifully preserved at a .com that belongs only to your family.", hy, bf, (212,200,178), max_w=840)
    hy += 30
    cta_btn(d, "Start for $29  \u2192", W//2, hy, JOST_SB(28))

    img.save(os.path.join(OUTPUT, "08_private_corner.png"))
    print("08 saved")

# ─────────────────────────────────────────────────────────────────────────────
# 9. "The gift that keeps their whole story" — baby feet, ink split, gift angle
# ─────────────────────────────────────────────────────────────────────────────
def ad09():
    canvas = Image.new('RGB', (W,H), INK)

    PHOTO_H = 580
    img = photo("baby_feet.jpg", warm=18, contrast=1.08)
    top = img.crop((0,0,W,600)).resize((W,PHOTO_H), Image.LANCZOS)

    # Bottom fade into ink
    fade = Image.new('RGBA', (W,PHOTO_H), (0,0,0,0))
    fd = ImageDraw.Draw(fade)
    for y in range(120):
        t=y/120; a=int(255*t**1.6)
        fd.line([(0,PHOTO_H-120+y),(W,PHOTO_H-120+y)], fill=(*INK,a))
    top = Image.alpha_composite(top.convert('RGBA'), fade).convert('RGB')
    canvas.paste(top, (0,0))

    d = ImageDraw.Draw(canvas)
    brand_gold(d, 44)

    # Ink text zone
    hy = PHOTO_H + 10
    eyebrow_center(d, "THE PERFECT GIFT FOR YOUR FAMILY", hy, (130,108,65))
    hy += 32
    hline(d, hy, W//2-60, W//2+60, (80,62,28))
    hy += 20

    hf = CG_SB(84); hfi = CG_SBIT(84)
    while tw(d,"keeps their story.", hf)>W-80:
        hf=CG_SB(hf.size-2); hfi=CG_SBIT(hfi.size-2)

    d.text(((W-tw(d,"The gift that",hf))//2, hy), "The gift that", font=hf, fill=WHITE)
    hy += th(d,"The gift that",hf) - 8
    d.text(((W-tw(d,"keeps their story.",hfi))//2, hy), "keeps their story.", font=hfi, fill=GOLD)
    hy += th(d,"keeps their story.",hfi) + 22

    bf = JOST_LT(27)
    hy = draw_center(d, "Give a Legacy Odyssey subscription — a private .com website your baby will have forever. Starting at $29.", hy, bf, (175,158,125), max_w=840)
    hy += 28
    cta_btn(d, "Give the Gift  \u2192", W//2, hy, JOST_SB(27), bg=GOLD, fg=WHITE)

    canvas.save(os.path.join(OUTPUT, "09_the_gift.png"))
    print("09 saved")

# ── Run ────────────────────────────────────────────────────────────────────────
print("Building 9 ads...")
ad01(); ad02(); ad03(); ad04(); ad05()
ad06(); ad07(); ad08(); ad09()
print("All done ->", OUTPUT)
