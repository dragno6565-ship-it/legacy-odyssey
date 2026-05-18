"""Rebuild the founder-pricing ad creative with banned wording removed."""
import os
from PIL import Image, ImageDraw, ImageFont

FONTS = "F:/legacy-odyssey/ads/fonts/"
OUT = os.path.dirname(os.path.abspath(__file__))
W = H = 1080
CREAM = (250, 247, 242)
DARK = (26, 21, 16)
GOLD = (176, 142, 74)

def corm_si(s): return ImageFont.truetype(FONTS + "CormorantGaramond-SemiBoldItalic.ttf", s)
def jost_r(s):  return ImageFont.truetype(FONTS + "Jost-Regular.ttf", s)
def jost_m(s):  return ImageFont.truetype(FONTS + "Jost-Medium.ttf", s)
def jost_sb(s): return ImageFont.truetype(FONTS + "Jost-SemiBold.ttf", s)

img = Image.new("RGB", (W, H), CREAM)
d = ImageDraw.Draw(img)

def center(text, y, fnt, fill, tracking=0):
    if tracking:
        text = (" " * 0).join(text)
        # manual letter spacing
        total = sum(d.textlength(c, font=fnt) + tracking for c in text) - tracking
        x = (W - total) / 2
        for c in text:
            d.text((x, y), c, font=fnt, fill=fill)
            x += d.textlength(c, font=fnt) + tracking
    else:
        w = d.textlength(text, font=fnt)
        d.text(((W - w) / 2, y), text, font=fnt, fill=fill)

# --- Headline (contrast line) ---
hl = corm_si(76)
center("Your baby's first year deserves", 96, hl, DARK)
center("more than a camera roll.", 184, hl, DARK)

# gold divider
d.line([(W/2 - 70, 312), (W/2 + 70, 312)], fill=GOLD, width=3)

# --- Section label ---
center("FOR NEW PARENTS", 360, jost_m(28), GOLD, tracking=8)

# --- Benefit list ---
bullets = [
    "Your baby's own private .com",
    "A guided digital baby book",
    "Unlimited photos & milestones",
    "The Vault — sealed until age 18",
]
bf = jost_r(40)
# left-align the block, centered as a group
block_w = max(d.textlength("—   " + b, font=bf) for b in bullets)
x0 = (W - block_w) / 2
y = 446
for b in bullets:
    d.text((x0, y), "—", font=jost_m(40), fill=GOLD)
    d.text((x0 + 58, y), b, font=bf, fill=DARK)
    y += 78

# --- Introductory rate box ---
box_top, box_bot = 800, 922
d.rectangle([110, box_top, W - 110, box_bot], outline=GOLD, width=3)
center("Introductory rate", box_top + 22, jost_sb(36), DARK)
center("$29 your first year, then $49.99/year", box_top + 70, jost_r(34), DARK)

# --- URL ---
center("legacyodyssey.com", 980, jost_m(34), GOLD)

path = os.path.join(OUT, "ad_founder_rewrite.png")
img.save(path)
print("saved", path)
