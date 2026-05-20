"""Keepsakes feature post mockup."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
PHOTO = os.path.join(HERE, "POST-TODAY-4.jpg")
CAPTION = """Drawings pile up. We made a section for them.

The new Keepsakes section in your child's book — tap a drawing, take a photo, add a one-line label. It saves to your-childs-name.com under their name, and the paper can go.

A small mercy for the parents drowning in paper turkeys."""
W=1080; IMG=1080; PAD=56; HEADER_H=132; LINE_H=52
DARK=(26,21,16); GRAY=(138,126,107); GOLD=(200,169,110); WHITE=(255,255,255)
def F(s,b=False):
    p="C:/Windows/Fonts/"+("segoeuib.ttf" if b else "segoeui.ttf")
    return ImageFont.truetype(p, s) if os.path.exists(p) else ImageFont.load_default()
def wrap(d, text, fnt, max_w):
    lines=[]
    for para in text.split("\n"):
        if not para.strip(): lines.append(""); continue
        cur=""
        for w in para.split():
            test=(cur+" "+w).strip()
            if d.textlength(test, font=fnt)<=max_w: cur=test
            else: lines.append(cur); cur=w
        if cur: lines.append(cur)
    return lines
cap=F(40); name=F(34,True); sub=F(26)
tmp=ImageDraw.Draw(Image.new("RGB",(10,10)))
lines=wrap(tmp, CAPTION, cap, W-2*PAD)
cap_h=len(lines)*LINE_H+2*PAD
card=Image.new("RGB",(W, HEADER_H+IMG+cap_h),WHITE)
d=ImageDraw.Draw(card)
d.ellipse([PAD,30,PAD+72,102],fill=DARK)
d.text((PAD+36,66),"LO",font=name,fill=GOLD,anchor="mm")
d.text((PAD+96,44),"Legacy Odyssey",font=name,fill=DARK)
d.text((PAD+96,84),"Just now",font=sub,fill=GRAY)
im=Image.open(PHOTO).convert("RGB")
w,h=im.size; s=min(w,h)
card.paste(im.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s)).resize((IMG,IMG)),(0,HEADER_H))
y=HEADER_H+IMG+PAD
for ln in lines:
    d.text((PAD,y),ln,font=cap,fill=DARK); y+=LINE_H
out=os.path.join(HERE,"mockup_keepsakes.png")
card.save(out)
print("saved",out)
