# Extra "actual product" screenshots: the FINISHED WEBSITE (published baby book)
# in a browser frame, captioned. Built at BOTH iOS (1242x2688) and Play (1080x1920)
# sizes so they can be dropped into either store. Shows the real product a family sees.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"F:\legacy-odyssey"
FONTS = os.path.join(ROOT, "ads", "fonts")
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

def shadow(canvas, box, rad, blur, alpha=70):
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([x0, y0 + 14, x1, y1 + 14], rad, fill=(26, 21, 16, alpha))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))

def cover_eyebrow(im):
    d = ImageDraw.Draw(im); bg = im.getpixel((296, 70))
    d.rectangle([296, 100, 650, 136], fill=bg); return im

def browser_frame(src, target_w, url, lock, cover, s):
    im = Image.open(src).convert("RGB")
    if cover: im = cover_eyebrow(im)
    inner_w = target_w; inner_h = int(inner_w * im.height / im.width)
    im = im.resize((inner_w, inner_h), Image.LANCZOS)
    bar = int(78 * s); fw, fh = inner_w, inner_h + bar
    frame = Image.new("RGBA", (fw, fh), (255, 255, 255, 255)); d = ImageDraw.Draw(frame)
    frame.paste(im.convert("RGBA"), (0, bar))
    d.rectangle([0, 0, fw, bar], fill=(245, 240, 232))
    r = int(9 * s)
    for i, c in enumerate([(224, 122, 95), (224, 190, 110), (140, 180, 130)]):
        cx = int(30 * s) + i * int(36 * s)
        d.ellipse([cx, bar // 2 - r, cx + 2 * r, bar // 2 + r], fill=c)
    px0 = int(160 * s)
    d.rounded_rectangle([px0, int(17 * s), fw - int(44 * s), bar - int(17 * s)], int(22 * s), fill=(255, 255, 255), outline=BORDER, width=2)
    tx = px0 + int(30 * s); ly = bar // 2
    if lock:
        d.rounded_rectangle([tx, ly - 2, tx + int(22 * s), ly + int(15 * s)], 4, fill=GOLDD)
        d.arc([tx + int(4 * s), ly - int(16 * s), tx + int(18 * s), ly + int(4 * s)], 180, 360, fill=GOLDD, width=int(4 * s)); tx += int(38 * s)
    d.text((tx, ly), url, font=font(JOSTR, int(31 * s)), fill=(90, 80, 66), anchor="lm")
    return rounded(frame, int(40 * s))

SHOTS = [
    ("Their whole story, at their own .com.", "demo-site/01-welcome.jpg", "your-childs-name.com", True),
    ("The birth story, beautifully told.", "demo-site/03-birth-story.jpg", "your-childs-name.com", True),
    ("Letters for when they're older.", "demo-site/09-letters-to-you.jpg", "your-childs-name.com", True),
    ("Every celebration, year by year.", "demo-site/08-celebrations.jpg", "your-childs-name.com", True),
    ("Sealed in The Vault until they're 18.", "demo-site/11-the-vault.jpg", "your-childs-name.com", True),
    ("Family recipes, kept for good.", "demo-site/10-family-recipes.jpg", "your-childs-name.com", True),
]

def build(name, W, H, outdir):
    os.makedirs(outdir, exist_ok=True)
    s = W / 1242.0
    for i, (caption, rel, url, cover) in enumerate(SHOTS, 1):
        src = os.path.join(ROOT, "marketing", "screenshots", rel.replace("/", os.sep))
        canvas = Image.new("RGBA", (W, H), CREAM + (255,)); d = ImageDraw.Draw(canvas)
        cf = font(CORM, int(94 * s))
        lines = wrap(d, caption, cf, W - int(180 * s)); y = int(150 * s)
        for ln in lines:
            d.text((W // 2, y), ln, font=cf, fill=DARK, anchor="ma"); y += int(106 * s)
        d.rounded_rectangle([W // 2 - int(62 * s), y + int(26 * s), W // 2 + int(62 * s), y + int(34 * s)], 4, fill=GOLD)
        top = y + int(120 * s)
        fr = browser_frame(src, int(1120 * s), url, False, cover, s)
        avail = H - top - int(140 * s)
        if fr.height > avail:
            sc = avail / fr.height; fr = fr.resize((int(fr.width * sc), int(fr.height * sc)), Image.LANCZOS)
        fx, fy = (W - fr.width) // 2, top
        shadow(canvas, (fx, fy, fx + fr.width, fy + fr.height), int(50 * s), int(45 * s))
        canvas.alpha_composite(fr, (fx, fy))
        d.text((W // 2, H - int(72 * s)), "Legacy Odyssey", font=font(CORM, int(48 * s)), fill=GOLDD, anchor="mm")
        canvas.convert("RGB").save(os.path.join(outdir, f"product-{i:02d}.png"), "PNG")
        print("  wrote", name, i, rel)

DESK = r"C:\Users\dragn\Desktop\LO-reports\product-extra"
for name, W, H, sub in [("ios", 1242, 2688, "ios"), ("play", 1080, 1920, "play")]:
    out = os.path.join(ROOT, "marketing", "app-store", "product-extra", sub)
    print("building", name, f"{W}x{H}"); build(name, W, H, out)
    try: build(name, W, H, os.path.join(DESK, sub))
    except Exception as e: print("  (desktop copy skipped:", e, ")")
print("DONE")
