# -*- coding: utf-8 -*-
"""
Renders the current Legacy Odyssey Dashboard screen as an accurate phone mockup.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT = r"E:\Claude\legacy-odyssey\ads"
FONTS  = r"E:\Claude\legacy-odyssey\ads\fonts"

# Exact app theme values
CREAM     = (250, 247, 242)   # colors.background
DARK      = ( 26,  21,  16)   # colors.dark
GOLD      = (200, 169, 110)   # colors.gold
GOLD_LT   = (212, 187, 138)   # colors.goldLight
INK_MID   = ( 44,  36,  22)   # colors.textPrimary
INK_LIGHT = (138, 126, 107)   # colors.textSecondary
CARD      = (240, 232, 220)   # colors.card
BORDER    = (224, 213, 196)   # colors.border
WHITE     = (255, 255, 255)

def F(name, size):
    try:   return ImageFont.truetype(os.path.join(FONTS, name), size)
    except: return ImageFont.load_default()

# Phone canvas: iPhone 14 Pro proportions at 2x scale
SW, SH = 390, 844   # screen w/h

def tw(d,t,f): bb=d.textbbox((0,0),t,font=f); return bb[2]-bb[0]
def th(d,t,f): bb=d.textbbox((0,0),t,font=f); return bb[3]-bb[1]

def render():
    img = Image.new('RGB', (SW, SH), CREAM)
    d   = ImageDraw.Draw(img)

    # ── Status bar ──
    d.rectangle([0,0,SW,44], fill=DARK)
    d.text((20,14), "9:41", font=F("Jost-SemiBold.ttf",14), fill=WHITE)
    # Battery + signal dots right side
    for i,x in enumerate([SW-22,SW-34,SW-46]):
        d.ellipse([x-4,20,x+4,28], fill=(WHITE if i<3 else (100,100,100)))
    d.rounded_rectangle([SW-16,17,SW-6,27], radius=2, outline=WHITE, width=1)
    d.rectangle([SW-15,19,SW-9,25], fill=WHITE)
    d.rectangle([SW-5,20,SW-4,24], fill=WHITE)

    # ── Dark header ──
    # paddingTop: 48 (xxl), paddingBottom: 24 (lg), paddingHorizontal: 24 (lg)
    HDR_TOP  = 44
    HDR_H    = 120
    d.rectangle([0, HDR_TOP, SW, HDR_TOP+HDR_H], fill=DARK)

    # "Legacy Odyssey" — serif 28px bold gold
    title_f = F("Jost-SemiBold.ttf", 26)
    d.text((24, HDR_TOP+18), "Legacy Odyssey", font=title_f, fill=GOLD)

    # "Eowyn's Book" — serif 16px goldLight italic
    sub_f = F("Jost-Regular.ttf", 15)
    d.text((24, HDR_TOP+50), "Eowyn's Book", font=sub_f, fill=GOLD_LT)

    # Domain — 12px goldLight 70% opacity
    dom_f = F("Jost-Regular.ttf", 12)
    dom_color = (int(GOLD_LT[0]*0.7+DARK[0]*0.3),
                 int(GOLD_LT[1]*0.7+DARK[1]*0.3),
                 int(GOLD_LT[2]*0.7+DARK[2]*0.3))
    d.text((24, HDR_TOP+72), "eowynhoperagno.com", font=dom_f, fill=dom_color)

    # Switch button — top right
    sw_f = F("Jost-SemiBold.ttf", 13)
    sw_t = "\U0001F4DA  Sites"
    sw_tw_val = tw(d, sw_t, sw_f)
    sw_x0 = SW - sw_tw_val - 44
    sw_y0 = HDR_TOP + 20
    sw_x1 = SW - 20
    sw_y1 = sw_y0 + 34
    d.rounded_rectangle([sw_x0, sw_y0, sw_x1, sw_y1], radius=10,
                          fill=(50,42,28), outline=GOLD, width=1)
    d.text((sw_x0+10, sw_y0+8), sw_t, font=sw_f, fill=GOLD)

    # ── Section grid ──
    # padding: 16, gap between cards: 16
    GRID_TOP = HDR_TOP + HDR_H + 8
    PAD      = 16
    GAP      = 12
    CARD_W   = (SW - PAD*2 - GAP) // 2
    CARD_H   = 96

    SECTIONS = [
        ('\U0001F476', 'Welcome / Child Info',  'Edit'),
        ('\U0001F31F', 'Before You Arrived',    'Edit'),
        ('\U0001F382', 'Birth Story',            'Edit'),
        ('\U0001F3E0', 'Coming Home',            'Edit'),
        ('\U0001F4C5', 'Month by Month',         'Edit'),
        ('\U0001F46A', 'Our Family',             'Edit'),
        ('\u2B50',     'Your Firsts',            'Edit'),
        ('\U0001F389', 'Celebrations',           'Edit'),
        ('\U0001F48C', 'Letters to You',         'Edit'),
        ('\U0001F373', 'Family Recipes',         'Edit'),
        ('\U0001F512', 'The Vault',              'Edit'),
        ('\U0001F310', 'Website Sections',       'Edit'),
        ('\u2699\uFE0F','Settings',              'Edit'),
    ]

    icon_f   = F("Jost-Regular.ttf", 28)
    title_cf = F("Jost-SemiBold.ttf", 12)
    action_f = F("Jost-Regular.ttf", 11)

    for i, (icon, title, action) in enumerate(SECTIONS):
        col = i % 2
        row = i // 2
        cx  = PAD + col*(CARD_W + GAP)
        cy  = GRID_TOP + row*(CARD_H + GAP)

        # Card background
        d.rounded_rectangle([cx, cy, cx+CARD_W, cy+CARD_H],
                              radius=16, fill=CARD)
        # Subtle shadow sim — slightly darker bottom edge
        d.rounded_rectangle([cx+1, cy+2, cx+CARD_W+1, cy+CARD_H+2],
                              radius=16, fill=(0,0,0,0) if False else (225,215,200))
        d.rounded_rectangle([cx, cy, cx+CARD_W, cy+CARD_H], radius=16, fill=CARD)

        # Icon
        icon_y = cy + 12
        icon_x = cx + (CARD_W - tw(d, icon, icon_f))//2
        d.text((icon_x, icon_y), icon, font=icon_f, fill=INK_MID)

        # Title — wrap long titles
        title_y = cy + 50
        if tw(d, title, title_cf) > CARD_W-10:
            words = title.split()
            mid   = len(words)//2
            line1 = ' '.join(words[:mid])
            line2 = ' '.join(words[mid:])
            d.text((cx+(CARD_W-tw(d,line1,title_cf))//2, title_y),
                   line1, font=title_cf, fill=INK_MID)
            d.text((cx+(CARD_W-tw(d,line2,title_cf))//2, title_y+16),
                   line2, font=title_cf, fill=INK_MID)
            action_y = title_y + 34
        else:
            d.text((cx+(CARD_W-tw(d,title,title_cf))//2, title_y),
                   title, font=title_cf, fill=INK_MID)
            action_y = title_y + 18

        # Action
        d.text((cx+(CARD_W-tw(d,action,action_f))//2, action_y),
               action, font=action_f, fill=GOLD)

    # ── Phone frame ──
    FW, FH = SW+24, SH+80
    frame = Image.new('RGBA', (FW, FH), (0,0,0,0))
    fd    = ImageDraw.Draw(frame)

    # Outer shell
    fd.rounded_rectangle([0,0,FW-1,FH-1], radius=48,
                           fill=(40,36,30), outline=(65,58,45), width=2)
    # Screen cutout
    fd.rounded_rectangle([12,30,12+SW,30+SH], radius=38, fill=CREAM)

    # Notch / Dynamic Island
    ni_w, ni_h = 120, 34
    ni_x = (FW-ni_w)//2; ni_y = 30
    fd.rounded_rectangle([ni_x,ni_y,ni_x+ni_w,ni_y+ni_h], radius=17, fill=(30,26,20))

    # Home indicator
    hi_x = FW//2-24; hi_y = 30+SH+14
    fd.rounded_rectangle([hi_x,hi_y,hi_x+48,hi_y+5], radius=3, fill=(80,72,55))

    # Side buttons
    fd.rounded_rectangle([-2,90,5,150],   radius=3, fill=(55,50,40))
    fd.rounded_rectangle([-2,165,5,215],  radius=3, fill=(55,50,40))
    fd.rounded_rectangle([FW-5,110,FW+2,185], radius=3, fill=(55,50,40))

    # Paste screen into frame
    frame_rgba = frame.convert('RGBA')
    screen_rgba = img.convert('RGBA')
    # Apply rounded mask to screen
    mask = Image.new('L', (SW,SH), 0)
    md   = ImageDraw.Draw(mask)
    md.rounded_rectangle([0,0,SW-1,SH-1], radius=38, fill=255)
    screen_rgba.putalpha(mask)
    frame_rgba.paste(screen_rgba, (12,30), screen_rgba)

    # Drop shadow
    result_w, result_h = FW+40, FH+40
    result = Image.new('RGB', (result_w, result_h), (232,228,222))
    for i in range(12,0,-1):
        shadow_layer = Image.new('RGBA', (result_w, result_h), (0,0,0,0))
        sl_d = ImageDraw.Draw(shadow_layer)
        sl_d.rounded_rectangle([20+i,20+i,20+FW+i,20+FH+i],
                                 radius=48, fill=(0,0,0,int(15*(13-i)/13)))
        result_rgba = result.convert('RGBA')
        result_rgba = Image.alpha_composite(result_rgba, shadow_layer)
        result = result_rgba.convert('RGB')

    result_rgba = result.convert('RGBA')
    result_rgba.paste(frame_rgba, (20,20), frame_rgba)
    result = result_rgba.convert('RGB')

    out = os.path.join(OUTPUT, "current_dashboard.png")
    result.save(out)
    print("Saved:", out)

render()
