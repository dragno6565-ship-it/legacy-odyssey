# Generate Google Play assets for Legacy Odyssey:
#   - Phone screenshots at 1080x1920 (9:16, Play-compliant; iOS 6.5" is too tall)
#   - Feature graphic at 1024x500 (brand-clean copy: no banned words)
# Same branded frames + captions as the iOS builder, scaled to Play's canvas.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"F:\legacy-odyssey"
FONTS = os.path.join(ROOT, "ads", "fonts")
OUT = os.path.join(ROOT, "marketing", "app-store", "play")
DESK = r"C:\Users\dragn\Desktop\LO-reports\play-assets"
os.makedirs(OUT, exist_ok=True)
try: os.makedirs(DESK, exist_ok=True)
except Exception: DESK = OUT

CREAM = (250, 247, 242); DARK = (26, 21, 16); GOLD = (200, 169, 110); GOLDD = (176, 142, 74)
BORDER = (224, 213, 196)
CORM = "CormorantGaramond-SemiBold.ttf"; CORMI = "CormorantGaramond-SemiBoldItalic.ttf"
JOSTR = "Jost-Regular.ttf"; JOSTM = "Jost-Medium.ttf"
def font(n, s): return ImageFont.truetype(os.path.join(FONTS, n), s)

def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= maxw: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def rounded(img, rad):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0], img.size[1]], rad, fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0)); out.paste(img, (0, 0), mask); return out

def shadow(canvas, box, rad, blur=40, alpha=70):
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([x0, y0 + 14, x1, y1 + 14], rad, fill=(26, 21, 16, alpha))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))

def cover_eyebrow(im):
    d = ImageDraw.Draw(im); bg = im.getpixel((296, 70))
    d.rectangle([296, 100, 650, 136], fill=bg); return im

def phone_frame(src, target_w):
    im = Image.open(src).convert("RGB")
    inner_w = target_w - 32; inner_h = int(inner_w * im.height / im.width)
    im = im.resize((inner_w, inner_h), Image.LANCZOS)
    fw, fh = inner_w + 32, inner_h + 32
    frame = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle([0, 0, fw, fh], 62, fill=(26, 21, 16, 255))
    frame.paste(rounded(im.convert("RGBA"), 46), (16, 16)); return frame

def browser_frame(src, target_w, url="your-childs-name.com", lock=False, cover=False):
    im = Image.open(src).convert("RGB")
    if cover: im = cover_eyebrow(im)
    inner_w = target_w; inner_h = int(inner_w * im.height / im.width)
    im = im.resize((inner_w, inner_h), Image.LANCZOS)
    bar = 68; fw, fh = inner_w, inner_h + bar
    frame = Image.new("RGBA", (fw, fh), (255, 255, 255, 255)); d = ImageDraw.Draw(frame)
    frame.paste(im.convert("RGBA"), (0, bar))
    d.rectangle([0, 0, fw, bar], fill=(245, 240, 232))
    for i, c in enumerate([(224, 122, 95), (224, 190, 110), (140, 180, 130)]):
        d.ellipse([26 + i * 32, bar // 2 - 8, 26 + i * 32 + 16, bar // 2 + 8], fill=c)
    px0 = 140
    d.rounded_rectangle([px0, 15, fw - 38, bar - 15], 20, fill=(255, 255, 255), outline=BORDER, width=2)
    tx = px0 + 26
    if lock:
        ly = bar // 2
        d.rounded_rectangle([tx, ly - 2, tx + 19, ly + 13], 4, fill=GOLDD)
        d.arc([tx + 3, ly - 14, tx + 16, ly + 3], 180, 360, fill=GOLDD, width=4); tx += 34
    d.text((tx, bar // 2), url, font=font(JOSTR, 27), fill=(90, 80, 66), anchor="lm")
    return rounded(frame, 34)

# ── Phone screenshots (1080x1920) ────────────────────────────────────────────
W, H = 1080, 1920
SHOTS = [
    ("Your baby gets their name as a website.", "marketing/screenshots/demo-site/05-month-by-month.jpg", "browser", False, True, "your-childs-name.com"),
    ("Fill it in from your phone.", "marketing/screenshots/app/02-dashboard.jpg", "phone", False, False, ""),
    ("Private and password protected.", "marketing/screenshots/demo-site/06-our-family.jpg", "browser", True, True, "your-childs-name.com"),
    ("The whole first year, month by month.", "marketing/screenshots/app/08-month-by-month.jpg", "phone", False, False, ""),
    ("Letters to open later, kept in The Vault.", "marketing/screenshots/app/14-the-vault.jpg", "phone", False, False, ""),
    ("Custom galleries. Up to 50 photos each.", "marketing/screenshots/features/09-gallery-grid.jpg", "browser", False, False, "legacyodyssey.com"),
]
for i, (caption, rel, kind, lock, cover, url) in enumerate(SHOTS, 1):
    src = os.path.join(ROOT, rel.replace("/", os.sep))
    canvas = Image.new("RGBA", (W, H), CREAM + (255,)); d = ImageDraw.Draw(canvas)
    cf = font(CORM, 82)
    lines = wrap(d, caption, cf, W - 150)
    y = 132
    for ln in lines:
        d.text((W // 2, y), ln, font=cf, fill=DARK, anchor="ma"); y += 92
    d.rounded_rectangle([W // 2 - 54, y + 22, W // 2 + 54, y + 29], 4, fill=GOLD)
    top = y + 100
    fr = phone_frame(src, 660) if kind == "phone" else browser_frame(src, 968, url=(url or "your-childs-name.com"), lock=lock, cover=cover)
    avail = H - top - 120
    if fr.height > avail:
        sc = avail / fr.height; fr = fr.resize((int(fr.width * sc), int(fr.height * sc)), Image.LANCZOS)
    fx, fy = (W - fr.width) // 2, top
    shadow(canvas, (fx, fy, fx + fr.width, fy + fr.height), 44)
    canvas.alpha_composite(fr, (fx, fy))
    d.text((W // 2, H - 60), "Legacy Odyssey", font=font(CORM, 42), fill=GOLDD, anchor="mm")
    canvas.convert("RGB").save(os.path.join(OUT, f"play-{i:02d}.png"), "PNG")
    canvas.convert("RGB").save(os.path.join(DESK, f"play-{i:02d}.png"), "PNG")
    print("wrote screenshot", i, kind, rel)

# ── Feature graphic (1024x500) ───────────────────────────────────────────────
fw, fh = 1024, 500
g = Image.new("RGBA", (fw, fh), CREAM + (255,)); d = ImageDraw.Draw(g)
# subtle gold hairline border
d.rectangle([0, 0, fw - 1, fh - 1], outline=BORDER, width=3)
# eyebrow
d.text((fw // 2, 92), "✦  L E G A C Y   O D Y S S E Y  ✦", font=font(JOSTM, 30), fill=GOLDD, anchor="mm")
# headline (".com" accented gold) — auto-fit width, then center the two-color line
pre, accent = "A baby book at their own ", ".com"
hsize = 84
while hsize > 40:
    h1 = font(CORM, hsize)
    wpre = d.textlength(pre, font=h1); wacc = d.textlength(accent, font=h1)
    if wpre + wacc <= fw - 130: break
    hsize -= 2
x0 = (fw - (wpre + wacc)) // 2
hy = 210
d.text((x0, hy), pre, font=h1, fill=DARK)
d.text((x0 + wpre, hy), accent, font=h1, fill=GOLDD)
# browser pill: lock + your-childs-name.com
pill_w, pill_h = 470, 64; px = (fw - pill_w) // 2; py = 348
d.rounded_rectangle([px, py, px + pill_w, py + pill_h], 32, fill=(255, 255, 255), outline=BORDER, width=2)
lx = px + 40; ly = py + pill_h // 2
d.rounded_rectangle([lx, ly - 3, lx + 22, ly + 15], 5, fill=GOLDD)
d.arc([lx + 4, ly - 17, lx + 18, ly + 5], 180, 360, fill=GOLDD, width=5)
d.text((lx + 44, ly), "your-childs-name.com", font=font(JOSTR, 34), fill=(90, 80, 66), anchor="lm")
g.convert("RGB").save(os.path.join(OUT, "play-feature-graphic.png"), "PNG")
g.convert("RGB").save(os.path.join(DESK, "play-feature-graphic.png"), "PNG")
print("wrote feature graphic 1024x500")
print("DONE ->", OUT)
