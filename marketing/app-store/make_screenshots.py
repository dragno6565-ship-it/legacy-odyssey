# Generate App Store screenshots (1242x2688, 6.5") for Legacy Odyssey.
# Composites real app/site captures into branded frames with captions.
# Site (public book) captures have a banned "CHAPTER X" eyebrow -> covered.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"F:\legacy-odyssey"
FONTS = os.path.join(ROOT, "ads", "fonts")
OUT = os.path.join(ROOT, "marketing", "app-store", "6.5")
DESK = r"C:\Users\dragn\Desktop\LO-reports\app-store-screenshots"
os.makedirs(OUT, exist_ok=True); os.makedirs(DESK, exist_ok=True)

W, H = 1242, 2688
CREAM = (250, 247, 242); DARK = (26, 21, 16); GOLD = (200, 169, 110); GOLDD = (176, 142, 74)
BORDER = (224, 213, 196)
CORM = "CormorantGaramond-SemiBold.ttf"; JOSTR = "Jost-Regular.ttf"
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

def shadow(canvas, box, rad, blur=45, alpha=70):
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([x0, y0 + 16, x1, y1 + 16], rad, fill=(26, 21, 16, alpha))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))

def cover_eyebrow(im):
    # im is the raw site capture (dark header top-left has "CHAPTER X" gold small-caps)
    d = ImageDraw.Draw(im)
    bg = im.getpixel((296, 70))  # sample flat dark header bg
    d.rectangle([296, 100, 650, 136], fill=bg)
    return im

def phone_frame(src, target_w):
    im = Image.open(src).convert("RGB")
    inner_w = target_w - 36; inner_h = int(inner_w * im.height / im.width)
    im = im.resize((inner_w, inner_h), Image.LANCZOS)
    fw, fh = inner_w + 36, inner_h + 36
    frame = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle([0, 0, fw, fh], 70, fill=(26, 21, 16, 255))
    frame.paste(rounded(im.convert("RGBA"), 52), (18, 18)); return frame

def browser_frame(src, target_w, url="your-childs-name.com", lock=False, cover=False):
    im = Image.open(src).convert("RGB")
    if cover: im = cover_eyebrow(im)
    inner_w = target_w; inner_h = int(inner_w * im.height / im.width)
    im = im.resize((inner_w, inner_h), Image.LANCZOS)
    bar = 78; fw, fh = inner_w, inner_h + bar
    frame = Image.new("RGBA", (fw, fh), (255, 255, 255, 255)); d = ImageDraw.Draw(frame)
    frame.paste(im.convert("RGBA"), (0, bar))
    d.rectangle([0, 0, fw, bar], fill=(245, 240, 232))
    for i, c in enumerate([(224, 122, 95), (224, 190, 110), (140, 180, 130)]):
        d.ellipse([30 + i * 36, bar // 2 - 9, 30 + i * 36 + 18, bar // 2 + 9], fill=c)
    px0 = 160
    d.rounded_rectangle([px0, 17, fw - 44, bar - 17], 22, fill=(255, 255, 255), outline=BORDER, width=2)
    tx = px0 + 30
    if lock:
        ly = bar // 2
        d.rounded_rectangle([tx, ly - 2, tx + 22, ly + 15], 4, fill=GOLDD)
        d.arc([tx + 4, ly - 16, tx + 18, ly + 4], 180, 360, fill=GOLDD, width=4); tx += 38
    d.text((tx, bar // 2), url, font=font(JOSTR, 31), fill=(90, 80, 66), anchor="lm")
    return rounded(frame, 40)

SHOTS = [
    ("Your baby gets their name as a website.", "marketing/screenshots/demo-site/05-month-by-month.jpg", "browser", False, True, "your-childs-name.com"),
    ("Fill it in from your phone.", "marketing/screenshots/app/02-dashboard.jpg", "phone", False, False, ""),
    ("Private and password protected.", "marketing/screenshots/demo-site/06-our-family.jpg", "browser", True, True, "your-childs-name.com"),
    ("Letters to open later, kept in The Vault.", "marketing/screenshots/app/14-the-vault.jpg", "phone", False, False, ""),
    ("Custom galleries. Up to 50 photos each.", "marketing/screenshots/features/09-gallery-grid.jpg", "browser", False, False, "legacyodyssey.com"),
    ("Milestones, firsts, and every celebration.", "marketing/screenshots/app/11-celebrations.jpg", "phone", False, False, ""),
]

for i, (caption, rel, kind, lock, cover, url) in enumerate(SHOTS, 1):
    src = os.path.join(ROOT, rel.replace("/", os.sep))
    canvas = Image.new("RGBA", (W, H), CREAM + (255,)); d = ImageDraw.Draw(canvas)
    cf = font(CORM, 94)
    lines = wrap(d, caption, cf, W - 180)
    y = 150
    for ln in lines:
        d.text((W // 2, y), ln, font=cf, fill=DARK, anchor="ma"); y += 106
    d.rounded_rectangle([W // 2 - 62, y + 26, W // 2 + 62, y + 34], 4, fill=GOLD)
    if kind == "auto":
        im0 = Image.open(src); kind = "phone" if im0.height >= im0.width else "browser"
    top = y + 120
    fr = phone_frame(src, 760) if kind == "phone" else browser_frame(src, 1120, url=(url or "your-childs-name.com"), lock=lock, cover=cover)
    avail = H - top - 140
    if fr.height > avail:
        sc = avail / fr.height; fr = fr.resize((int(fr.width * sc), int(fr.height * sc)), Image.LANCZOS)
    fx, fy = (W - fr.width) // 2, top
    shadow(canvas, (fx, fy, fx + fr.width, fy + fr.height), 50)
    canvas.alpha_composite(fr, (fx, fy))
    d.text((W // 2, H - 72), "Legacy Odyssey", font=font(CORM, 48), fill=GOLDD, anchor="mm")
    canvas.convert("RGB").save(os.path.join(OUT, f"appstore-{i:02d}.png"), "PNG")
    canvas.convert("RGB").save(os.path.join(DESK, f"appstore-{i:02d}.png"), "PNG")
    print("wrote", i, kind, rel)
print("DONE")
