# -*- coding: utf-8 -*-
"""
Legacy Odyssey — App Redesign Comparison
Side-by-side phone mockups: Current vs Proposed (your-childs-name.com aesthetic)
Shows: Dashboard + Content Screen for each
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

OUTPUT = r"E:\Claude\legacy-odyssey\ads"
FONTS  = r"E:\Claude\legacy-odyssey\ads\fonts"
W2     = 2600   # canvas width
H2     = 1900   # canvas height

# ── Palette ──────────────────────────────────────────────────────────────────
CREAM     = (250, 247, 242)
GOLD      = (200, 169, 110)
GOLD_LT   = (212, 187, 138)
GOLD_DK   = (176, 142,  74)
INK       = ( 26,  21,  16)
INK_MID   = ( 44,  36,  22)
INK_LIGHT = (138, 126, 107)
CARD      = (240, 232, 220)
BORDER    = (224, 213, 196)
WHITE     = (255, 255, 255)
BG        = (245, 242, 238)   # comparison canvas bg

def F(name, size):
    try:   return ImageFont.truetype(os.path.join(FONTS, name), size)
    except: return ImageFont.load_default()

CG_SB   = lambda s: F("CormorantGaramond-SemiBold.ttf", s)
CG_IT   = lambda s: F("CormorantGaramond-Italic.ttf", s)
CG_SBIT = lambda s: F("CormorantGaramond-SemiBoldItalic.ttf", s)
CG_REG  = lambda s: F("CormorantGaramond-Regular.ttf", s)
JLT  = lambda s: F("Jost-Light.ttf", s)
JREG = lambda s: F("Jost-Regular.ttf", s)
JMed = lambda s: F("Jost-Medium.ttf", s)
JSB  = lambda s: F("Jost-SemiBold.ttf", s)

def tw(d,t,f):
    bb=d.textbbox((0,0),t,font=f); return bb[2]-bb[0]
def th(d,t,f):
    bb=d.textbbox((0,0),t,font=f); return bb[3]-bb[1]

def phone_frame(w=380, h=780, bg=CREAM):
    """Draw an iPhone-style phone frame, return (frame_img, screen_rect)"""
    fw, fh = w+20, h+80
    frame = Image.new('RGBA', (fw, fh), (0,0,0,0))
    d = ImageDraw.Draw(frame)
    # Outer shell
    d.rounded_rectangle([0,0,fw-1,fh-1], radius=44, fill=(48,44,40), outline=(70,62,50), width=2)
    # Screen area
    sx, sy, sw, sh = 10, 30, w, h
    d.rounded_rectangle([sx,sy,sx+sw,sy+sh], radius=36, fill=bg)
    # Notch
    nx = fw//2-28; ny = sy-1
    d.rounded_rectangle([nx,ny,nx+56,ny+20], radius=10, fill=(48,44,40))
    # Home indicator
    hx = fw//2-20; hy2 = sy+sh+10
    d.rounded_rectangle([hx,hy2,hx+40,hy2+4], radius=2, fill=(100,90,75))
    # Side buttons
    d.rounded_rectangle([-2,80,4,140], radius=2, fill=(60,55,48))
    d.rounded_rectangle([-2,155,4,200], radius=2, fill=(60,55,48))
    d.rounded_rectangle([fw-4,100,fw+2,170], radius=2, fill=(60,55,48))
    return frame, (sx, sy, sw, sh)

def paste_screen(frame, screen, screen_rect, radius=36):
    """Paste screen content into phone frame with rounded corners"""
    sx,sy,sw,sh = screen_rect
    screen = screen.resize((sw,sh), Image.LANCZOS)
    # Apply rounded mask
    mask = Image.new('L', (sw,sh), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0,0,sw-1,sh-1], radius=radius, fill=255)
    frame_rgba = frame.convert('RGBA')
    screen_rgba = screen.convert('RGBA')
    screen_rgba.putalpha(mask)
    frame_rgba.paste(screen_rgba, (sx,sy), screen_rgba)
    return frame_rgba

# ═══════════════════════════════════════════════════════════════════════════
# CURRENT DESIGN — Dashboard
# ═══════════════════════════════════════════════════════════════════════════
def current_dashboard(w=380, h=780):
    img = Image.new('RGB', (w,h), CREAM)
    d = ImageDraw.Draw(img)

    # Status bar
    d.rectangle([0,0,w,28], fill=INK)
    d.text((16,8), "9:41", font=F("Jost-SemiBold.ttf",13), fill=WHITE)
    d.text((w-50,8), "100%", font=F("Jost-Regular.ttf",11), fill=WHITE)

    # Dark header
    HEADER_H = 110
    d.rectangle([0,28,w,28+HEADER_H], fill=INK)

    # Title
    tf = F("Jost-SemiBold.ttf", 22)
    d.text((20, 38), "Legacy Odyssey", font=tf, fill=GOLD)
    sf = F("Jost-Regular.ttf", 13)
    d.text((20, 66), "Eowyn's Baby Book", font=sf, fill=GOLD_LT)
    d.text((20, 84), "eowynhoperagno.com", font=F("Jost-Regular.ttf",11), fill=(GOLD_LT[0],GOLD_LT[1],GOLD_LT[2]))

    # Sites switcher button
    sw_f = F("Jost-Medium.ttf", 12)
    sw_t = "My Sites  \u25be"
    sw_tw = tw(d,sw_t,sw_f)
    d.rounded_rectangle([w-sw_tw-28, 44, w-12, 44+28], radius=10,
                         fill=(200,169,110,50) if False else (50,42,28), outline=GOLD, width=1)
    d.text((w-sw_tw-14, 50), sw_t, font=sw_f, fill=GOLD)

    y = 28+HEADER_H+12
    d.rectangle([0,28+HEADER_H,w,h], fill=CREAM)

    # Card grid — 2 columns
    cards = [
        ("👶","Child Info","Add details"),
        ("📖","Birth Story","Write story"),
        ("🏠","Coming Home","First days"),
        ("📅","Months 1–12","Milestones"),
        ("👨‍👩‍👧","Our Family","Members"),
        ("⭐","Your Firsts","Moments"),
        ("🎉","Celebrations","Holidays"),
        ("💌","Letters","Write letters"),
    ]
    CARD_W = (w-48)//2
    CARD_H = 88
    col, row = 0, 0
    cx0 = 16
    for i,(icon,title,sub) in enumerate(cards):
        cx = cx0 + col*(CARD_W+16)
        cy = y + row*(CARD_H+12)
        d.rounded_rectangle([cx,cy,cx+CARD_W,cy+CARD_H], radius=16,
                              fill=CARD, outline=BORDER, width=1)
        d.text((cx+CARD_W//2-8, cy+14), icon, font=F("Jost-Regular.ttf",24), fill=INK)
        tf2 = F("Jost-SemiBold.ttf", 13)
        d.text((cx+(CARD_W-tw(d,title,tf2))//2, cy+46), title, font=tf2, fill=INK)
        sf2 = F("Jost-Regular.ttf", 11)
        d.text((cx+(CARD_W-tw(d,sub,sf2))//2, cy+64), sub, font=sf2, fill=GOLD)
        col += 1
        if col == 2: col=0; row+=1

    return img

# ═══════════════════════════════════════════════════════════════════════════
# CURRENT DESIGN — Content Screen (ChildInfo)
# ═══════════════════════════════════════════════════════════════════════════
def current_content(w=380, h=780):
    img = Image.new('RGB', (w,h), WHITE)
    d = ImageDraw.Draw(img)

    # Status bar
    d.rectangle([0,0,w,28], fill=INK)
    d.text((16,8), "9:41", font=F("Jost-SemiBold.ttf",13), fill=WHITE)

    # Nav header
    d.rectangle([0,28,w,80], fill=WHITE)
    d.line([(0,80),(w,80)], fill=BORDER, width=1)
    d.text((20,38), "\u2190", font=F("Jost-Regular.ttf",22), fill=GOLD)
    title_f = F("Jost-SemiBold.ttf", 17)
    d.text(((w-tw(d,"Child Info",title_f))//2, 42), "Child Info", font=title_f, fill=INK)
    save_f = F("Jost-SemiBold.ttf",14)
    d.text((w-tw(d,"Save",save_f)-16, 45), "Save", font=save_f, fill=GOLD)

    y = 96
    # Section title
    d.text((20,y), "Your Baby", font=F("Jost-SemiBold.ttf",20), fill=INK); y+=28
    d.text((20,y), "Tell us about your little one", font=F("Jost-Regular.ttf",13), fill=INK_LIGHT); y+=26

    d.line([(20,y),(w-20,y)], fill=BORDER, width=1); y+=18

    # Fields
    fields = [("Baby's Name","Eowyn Hope"), ("Nickname","Winnie"), ("Date of Birth","March 15, 2024")]
    lf = F("Jost-Medium.ttf",13)
    inf = F("Jost-Regular.ttf",15)
    for label,val in fields:
        d.text((20,y), label, font=lf, fill=INK); y+=20
        d.rounded_rectangle([20,y,w-20,y+44], radius=10, fill=WHITE, outline=BORDER, width=1)
        d.text((32,y+14), val, font=inf, fill=INK_MID); y+=56

    y+=4
    d.text((20,y), "Birth Weight", font=lf, fill=INK); y+=20
    d.rounded_rectangle([20,y,w-20,y+44], radius=10, fill=WHITE, outline=BORDER, width=1)
    d.text((32,y+14), "7 lbs 4 oz", font=inf, fill=INK_MID); y+=60

    # Save button
    y = h-80
    d.rounded_rectangle([20,y,w-20,y+48], radius=10, fill=GOLD)
    btn_f = F("Jost-SemiBold.ttf",16)
    d.text(((w-tw(d,"Save Changes",btn_f))//2, y+15), "Save Changes", font=btn_f, fill=WHITE)

    return img

# ═══════════════════════════════════════════════════════════════════════════
# PROPOSED REDESIGN — Dashboard (your-childs-name.com aesthetic)
# ═══════════════════════════════════════════════════════════════════════════
def proposed_dashboard(w=380, h=780):
    img = Image.new('RGB', (w,h), CREAM)
    d = ImageDraw.Draw(img)

    # Status bar — cream instead of dark
    d.rectangle([0,0,w,28], fill=CREAM)
    d.text((16,8), "9:41", font=F("Jost-Medium.ttf",12), fill=INK_LIGHT)
    d.text((w-50,8), "100%", font=F("Jost-Regular.ttf",11), fill=INK_LIGHT)

    # Elegant cream header with gold rule at bottom
    HEADER_H = 96
    d.rectangle([0,28,w,28+HEADER_H], fill=CREAM)
    d.line([(0,28+HEADER_H),(w,28+HEADER_H)], fill=GOLD, width=1)

    # Brand mark — small Jost label
    brand_f = F("Jost-Regular.ttf",11)
    d.text((20,36), "LEGACY ODYSSEY", font=brand_f, fill=GOLD)

    # Book name — Cormorant Garamond large
    name_f = CG_SB(32)
    d.text((20,52), "Eowyn's Book", font=name_f, fill=INK)

    # Domain — subtle
    dom_f = F("Jost-Light.ttf",12)
    d.text((20,88), "eowynhoperagno.com", font=dom_f, fill=INK_LIGHT)

    # Switch sites — elegant text button top right
    sw_f = F("Jost-Regular.ttf",12)
    sw_t = "Switch  \u25be"
    d.text((w-tw(d,sw_t,sw_f)-20, 56), sw_t, font=sw_f, fill=GOLD)

    y = 28+HEADER_H+20

    # Section list — elegant, full-width list cards instead of grid
    sections = [
        ("Child Info",       "Baby details & birthday"),
        ("Birth Story",      "Mom & dad's perspectives"),
        ("Coming Home",      "The first days"),
        ("Months 1–12",      "Milestones & memories"),
        ("Our Family",       "Family members"),
        ("Your Firsts",      "First smile, word & more"),
        ("Celebrations",     "Birthdays & holidays"),
    ]

    ITEM_H = 62
    for title, sub in sections:
        # Subtle card — just a bottom rule
        d.rectangle([0,y,w,y+ITEM_H], fill=CREAM)

        # Gold left accent bar
        d.rectangle([0,y+12,3,y+ITEM_H-12], fill=GOLD)

        # Title — Cormorant Garamond
        title_f = CG_SB(22)
        d.text((18, y+10), title, font=title_f, fill=INK)

        # Subtitle — Jost Light
        sub_f = F("Jost-Light.ttf",12)
        d.text((18, y+36), sub, font=sub_f, fill=INK_LIGHT)

        # Arrow
        arrow_f = F("Jost-Light.ttf",18)
        d.text((w-28, y+20), "\u203a", font=arrow_f, fill=GOLD)

        # Bottom rule
        d.line([(16, y+ITEM_H-1),(w-16, y+ITEM_H-1)], fill=BORDER, width=1)

        y += ITEM_H

    return img

# ═══════════════════════════════════════════════════════════════════════════
# PROPOSED REDESIGN — Content Screen (ChildInfo)
# ═══════════════════════════════════════════════════════════════════════════
def proposed_content(w=380, h=780):
    img = Image.new('RGB', (w,h), CREAM)
    d = ImageDraw.Draw(img)

    # Status bar
    d.rectangle([0,0,w,28], fill=CREAM)
    d.text((16,8), "9:41", font=F("Jost-Medium.ttf",12), fill=INK_LIGHT)

    # Elegant nav header — cream with gold bottom rule
    d.rectangle([0,28,w,96], fill=CREAM)
    d.line([(0,96),(w,96)], fill=GOLD, width=1)

    # Back
    d.text((20,44), "\u2190", font=F("Jost-Light.ttf",20), fill=GOLD)

    # Screen title — Cormorant Garamond
    nav_f = CG_SB(26)
    d.text(((w-tw(d,"Child Info",nav_f))//2, 40), "Child Info", font=nav_f, fill=INK)

    # Save — Jost Regular gold
    save_f = F("Jost-Regular.ttf",13)
    d.text((w-tw(d,"Save",save_f)-20, 50), "Save", font=save_f, fill=GOLD)

    y = 112

    # Section heading — Cormorant Garamond
    sh_f = CG_SB(28)
    d.text((24,y), "Your Baby", font=sh_f, fill=INK); y+=34
    sf2 = F("Jost-Light.ttf",13)
    d.text((24,y), "Tell us about your little one", font=sf2, fill=INK_LIGHT); y+=20

    # Gold rule
    d.line([(24,y),(w-24,y)], fill=GOLD, width=1); y+=20

    # Fields — more refined styling
    fields = [("Baby's Name","Eowyn Hope"), ("Nickname","Winnie"), ("Date of Birth","March 15, 2024")]
    lf  = F("Jost-Regular.ttf",12)
    inf = CG_REG(18)   # Cormorant for input values — more elegant

    for label,val in fields:
        d.text((24,y), label.upper(), font=lf, fill=INK_LIGHT); y+=18
        # Borderless input — just a bottom line
        d.text((24,y), val, font=inf, fill=INK); y+=28
        d.line([(24,y),(w-24,y)], fill=BORDER, width=1); y+=20

    y+=8
    d.text((24,y), "BIRTH WEIGHT".upper(), font=lf, fill=INK_LIGHT); y+=18
    d.text((24,y), "7 lbs 4 oz", font=inf, fill=INK); y+=28
    d.line([(24,y),(w-24,y)], fill=BORDER, width=1); y+=28

    # Save button — refined, full width with letter spacing feel
    y = h-76
    d.rectangle([0,y-1,w,y-1+1], fill=BORDER)  # top rule
    d.rectangle([0,y,w,h], fill=CREAM)
    btn_w = w-48
    btn_h = 48
    bx = 24
    d.rounded_rectangle([bx,y+8,bx+btn_w,y+8+btn_h], radius=3, fill=INK)
    btn_f = F("Jost-Regular.ttf",14)
    btn_t = "SAVE  \u2192"
    d.text((bx+(btn_w-tw(d,btn_t,btn_f))//2, y+8+(btn_h-th(d,btn_t,btn_f))//2),
           btn_t, font=btn_f, fill=CREAM)

    return img

# ═══════════════════════════════════════════════════════════════════════════
# ASSEMBLE COMPARISON
# ═══════════════════════════════════════════════════════════════════════════
def build_comparison():
    canvas = Image.new('RGB', (W2,H2), BG)
    d = ImageDraw.Draw(canvas)

    # Header band
    d.rectangle([0,0,W2,90], fill=INK)
    hf = CG_SB(38)
    title = "Legacy Odyssey — App Redesign Proposal"
    d.text(((W2-tw(d,title,hf))//2, 24), title, font=hf, fill=GOLD)

    # Column headers
    COL_LABELS = ["Current App", "Proposed Redesign"]
    COL_X = [160, W2//2+100]
    for label,cx in zip(COL_LABELS,COL_X):
        cf = F("Jost-Regular.ttf",18)
        d.text((cx,108), label, font=cf, fill=INK_LIGHT)
        d.line([(cx,132),(cx+240,132)], fill=GOLD, width=1)

    # Row labels
    ROW_Y = [155, 155+870]
    ROW_LABELS = ["Dashboard", "Content Screen"]
    for label,ry in zip(ROW_LABELS,ROW_Y):
        rf = CG_IT(26)
        d.text((36, ry+340), label, font=rf, fill=INK_LIGHT)

    # Render screens
    screens = {
        'cur_dash':  current_dashboard(380,780),
        'cur_cont':  current_content(380,780),
        'pro_dash':  proposed_dashboard(380,780),
        'pro_cont':  proposed_content(380,780),
    }

    phone_w, phone_h = 400, 860
    positions = {
        'cur_dash':  (160,  155),
        'pro_dash':  (W2//2+80, 155),
        'cur_cont':  (160,  155+870),
        'pro_cont':  (W2//2+80, 155+870),
    }

    for key,(px,py) in positions.items():
        screen = screens[key]
        frame, rect = phone_frame(380, 780, bg=CREAM)
        frame = paste_screen(frame, screen, rect)
        # Drop shadow
        shadow = Image.new('RGBA', (frame.width+16, frame.height+16), (0,0,0,0))
        shadow_d = ImageDraw.Draw(shadow)
        for i in range(8,0,-1):
            shadow_d.rounded_rectangle([i,i,frame.width+i,frame.height+i], radius=44,
                                        fill=(0,0,0,int(18*(9-i)/9)))
        canvas_rgba = canvas.convert('RGBA')
        canvas_rgba.paste(shadow, (px-8, py-8), shadow)
        canvas_rgba.paste(frame, (px,py), frame)
        canvas = canvas_rgba.convert('RGB')

    d = ImageDraw.Draw(canvas)

    # Dividing line between columns
    d.line([(W2//2,100),(W2//2,H2-40)], fill=BORDER, width=1)

    # Key changes callout — right margin
    d.rectangle([W2-260, 155, W2-20, 155+580], fill=IVORY if False else CREAM,
                outline=BORDER, width=1)
    d = ImageDraw.Draw(canvas)
    d.rectangle([W2-260, 155, W2-20, 155+580], fill=(245,241,234), outline=BORDER, width=1)
    changes_title = CG_SB(22)
    d.text((W2-248, 168), "Key Changes", font=changes_title, fill=INK)
    d.line([(W2-248,194),(W2-32,194)], fill=GOLD, width=1)

    changes = [
        ("Typography",     "Cormorant Garamond\nfor all headings.\nJost for body text."),
        ("Navigation",     "Full-width list with\ngold left accent bar.\nMore scannable."),
        ("Header",         "Cream background\nwith gold rule.\nAiry, not heavy."),
        ("Input Fields",   "Bottom-line only.\nCormorant for values.\nMore editorial."),
        ("Buttons",        "Ink background,\nall caps with arrow.\nMore refined."),
        ("Spacing",        "More breathing room.\nGenererous whitespace\nthroughout."),
    ]
    cy2 = 206
    for heading, body in changes:
        hf2 = F("Jost-SemiBold.ttf",13)
        bf2 = F("Jost-Light.ttf",12)
        d.text((W2-248, cy2), heading, font=hf2, fill=INK)
        cy2 += 18
        for line in body.split('\n'):
            d.text((W2-248, cy2), line, font=bf2, fill=INK_LIGHT)
            cy2 += 15
        cy2 += 10

    # Footer
    d.rectangle([0,H2-40,W2,H2], fill=INK)
    ff = F("Jost-Light.ttf",13)
    d.text(((W2-tw(d,"All changes require explicit approval before any builds are submitted.",ff))//2,
           H2-28), "All changes require explicit approval before any builds are submitted.", font=ff, fill=GOLD_LT)

    out = os.path.join(OUTPUT, "app_redesign_comparison.png")
    canvas.save(out)
    print("Saved:", out)

build_comparison()
