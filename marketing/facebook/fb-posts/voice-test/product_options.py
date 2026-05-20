"""Build 5 product-feature post mockups for Dan's review."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W = 1080; IMG = 1080; PAD = 56; HEADER_H = 132; LINE_H = 52
DARK = (26, 21, 16); GRAY = (138, 126, 107); GOLD = (200, 169, 110); WHITE = (255, 255, 255)

POSTS = [
    {
        "label": "1 — Keepsakes",
        "photo": "k_3662630.jpg",
        "caption": "Drawings pile up. We made a section for them.\n\n"
                   "Legacy Odyssey is your child's baby book, built as a real website at your-childs-name.com. In the new Keepsakes section: photograph the drawing, add a one-line label, save. It lives on the website under their name. The paper can go.\n\n"
                   "A small mercy for the parents drowning in paper turkeys.",
    },
    {
        "label": "2 — The website (core hook)",
        "photo": "u_sleep_10998327.jpg",
        "caption": "Your baby's book — as a real website.\n\n"
                   "At checkout, Legacy Odyssey registers your child's name as a .com and turns it into a private, password-protected website at your-childs-name.com. Milestones, photos, letters, recipes — one place, one URL.\n\n"
                   "You text grandma the link. She clicks it. She's in.",
    },
    {
        "label": "3 — The Vault (letters until 18)",
        "photo": "u_sleep_19532665.jpg",
        "caption": "Write the letter now. They open it at 18.\n\n"
                   "The Vault is a section of your child's private website at your-childs-name.com where you can write them letters they don't see until their 18th birthday. The first one. The one you wrote at 3 a.m. The one you forgot you wrote.\n\n"
                   "All of them, waiting.",
    },
    {
        "label": "4 — Sharing with grandparents",
        "photo": "yawn_7828243.jpg",
        "caption": "Grandma doesn't want to download anything.\n\n"
                   "Legacy Odyssey is a real website at your-childs-name.com — password-protected, works on her iPad and her phone, no install. You text her the link, she clicks it, she's in.\n\n"
                   "Add a milestone — she sees it. That's the whole thing.",
    },
    {
        "label": "5 — The Welcome Page (birth stats)",
        "photo": "u_sleep_4621192.jpg",
        "caption": "The homepage is them.\n\n"
                   "Open your-childs-name.com — your child's private website — and the first thing you see is the welcome page: their name, time of birth, weight, length, the exact details from the hospital bracelet. The front door of the book.\n\n"
                   "Everything else lives behind it: months, firsts, letters, the lot.",
    },
]

def F(s, b=False):
    p = "C:/Windows/Fonts/" + ("segoeuib.ttf" if b else "segoeui.ttf")
    return ImageFont.truetype(p, s) if os.path.exists(p) else ImageFont.load_default()

def wrap(d, text, fnt, max_w):
    lines = []
    for para in text.split("\n"):
        if not para.strip(): lines.append(""); continue
        cur = ""
        for w in para.split():
            test = (cur + " " + w).strip()
            if d.textlength(test, font=fnt) <= max_w: cur = test
            else: lines.append(cur); cur = w
        if cur: lines.append(cur)
    return lines

def crop_sq(im):
    w, h = im.size; s = min(w, h)
    return im.crop(((w-s)//2, (h-s)//2, (w-s)//2+s, (h-s)//2+s)).resize((IMG, IMG))

cap_f = F(40); name_f = F(34, True); sub_f = F(26)
tmp = ImageDraw.Draw(Image.new("RGB", (10, 10)))

for idx, p in enumerate(POSTS, 1):
    lines = wrap(tmp, p["caption"], cap_f, W - 2*PAD)
    cap_h = len(lines)*LINE_H + 2*PAD
    card = Image.new("RGB", (W, HEADER_H + IMG + cap_h), WHITE)
    d = ImageDraw.Draw(card)
    d.ellipse([PAD, 30, PAD+72, 102], fill=DARK)
    d.text((PAD+36, 66), "LO", font=name_f, fill=GOLD, anchor="mm")
    d.text((PAD+96, 44), "Legacy Odyssey", font=name_f, fill=DARK)
    d.text((PAD+96, 84), "Just now", font=sub_f, fill=GRAY)
    card.paste(crop_sq(Image.open(os.path.join(HERE, p["photo"])).convert("RGB")), (0, HEADER_H))
    y = HEADER_H + IMG + PAD
    for ln in lines:
        d.text((PAD, y), ln, font=cap_f, fill=DARK); y += LINE_H
    out = os.path.join(HERE, f"product_opt_{idx}.png")
    card.save(out)
    print(f"saved {out}")
