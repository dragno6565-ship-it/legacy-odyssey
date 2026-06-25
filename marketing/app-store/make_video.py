# Build a short vertical promo video (1080x1920) from real captures + caption scenes.
# Features the NEW work: real website/.com, fill from phone, Custom Galleries (50), Your Contacts sharing, private+password.
import os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"F:\legacy-odyssey"
F = os.path.join(ROOT, "ads", "fonts")
FR = os.path.join(ROOT, "marketing", "app-store", "video-frames")
OUTV = os.path.join(ROOT, "marketing", "app-store", "legacy-odyssey-promo.mp4")
DESKV = r"C:\Users\dragn\Desktop\LO-reports\legacy-odyssey-promo.mp4"
FFMPEG = os.path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg.exe")
os.makedirs(FR, exist_ok=True)

W, H = 1080, 1920
CREAM = (250, 247, 242); DARK = (26, 21, 16); GOLD = (200, 169, 110); GOLDD = (176, 142, 74); BORDER = (224, 213, 196)
def fnt(n, s): return ImageFont.truetype(os.path.join(F, n), s)
CORM = "CormorantGaramond-SemiBold.ttf"; JOSTR = "Jost-Regular.ttf"

def wrap(d, t, f, mw):
    out, cur = [], ""
    for w in t.split():
        s = (cur + " " + w).strip()
        if d.textlength(s, font=f) <= mw: cur = s
        else: out.append(cur); cur = w
    if cur: out.append(cur)
    return out

def rounded(img, rad):
    m = Image.new("L", img.size, 0); ImageDraw.Draw(m).rounded_rectangle([0,0,*img.size], rad, fill=255)
    o = Image.new("RGBA", img.size, (0,0,0,0)); o.paste(img, (0,0), m); return o

def shadow(c, box, rad):
    sh = Image.new("RGBA", c.size, (0,0,0,0))
    ImageDraw.Draw(sh).rounded_rectangle([box[0],box[1]+16,box[2],box[3]+16], rad, fill=(26,21,16,75))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(40)))

def cover_eyebrow(im):
    bg = im.getpixel((296,70)); ImageDraw.Draw(im).rectangle([296,100,650,136], fill=bg); return im

def phone(src, tw):
    im = Image.open(src).convert("RGB"); iw = tw-30; ih = int(iw*im.height/im.width)
    im = im.resize((iw,ih), Image.LANCZOS); fw,fh = iw+30, ih+30
    fr = Image.new("RGBA",(fw,fh),(0,0,0,0)); ImageDraw.Draw(fr).rounded_rectangle([0,0,fw,fh],58,fill=(26,21,16,255))
    fr.paste(rounded(im.convert("RGBA"),44),(15,15)); return fr

def browser(src, tw, lock=False, cover=False, url="your-childs-name.com"):
    im = Image.open(src).convert("RGB")
    if cover: im = cover_eyebrow(im)
    iw = tw; ih = int(iw*im.height/im.width); im = im.resize((iw,ih), Image.LANCZOS)
    bar = 66; fw,fh = iw, ih+bar
    fr = Image.new("RGBA",(fw,fh),(255,255,255,255)); d = ImageDraw.Draw(fr)
    fr.paste(im.convert("RGBA"),(0,bar)); d.rectangle([0,0,fw,bar],fill=(245,240,232))
    for i,c in enumerate([(224,122,95),(224,190,110),(140,180,130)]):
        d.ellipse([26+i*32,bar//2-8,26+i*32+16,bar//2+8],fill=c)
    px=140; d.rounded_rectangle([px,15,fw-36,bar-15],19,fill=(255,255,255),outline=BORDER,width=2)
    tx=px+26
    if lock:
        ly=bar//2; d.rounded_rectangle([tx,ly-2,tx+18,ly+13],3,fill=GOLDD); d.arc([tx+3,ly-14,tx+15,ly+3],180,360,fill=GOLDD,width=3); tx+=30
    d.text((tx,bar//2),url,font=fnt(JOSTR,27),fill=(90,80,66),anchor="lm")
    return rounded(fr,32)

def base(caption, sub=None, cap_size=84):
    im = Image.new("RGBA",(W,H),CREAM+(255,)); d = ImageDraw.Draw(im)
    cf = fnt(CORM, cap_size); lines = wrap(d, caption, cf, W-150); y=140
    for ln in lines: d.text((W//2,y),ln,font=cf,fill=DARK,anchor="ma"); y+=cap_size+12
    d.rounded_rectangle([W//2-60,y+22,W//2+60,y+29],4,fill=GOLD)
    if sub:
        d.text((W//2,y+70),sub,font=fnt(JOSTR,36),fill=(138,126,107),anchor="ma")
    return im, y

def media_scene(caption, src, kind, lock=False, cover=False, url="your-childs-name.com"):
    im, y = base(caption)
    top = y + 100
    fr = phone(src, 560) if kind=="phone" else browser(src, 980, lock=lock, cover=cover, url=url)
    avail = H - top - 120
    if fr.height > avail:
        sc = avail/fr.height; fr = fr.resize((int(fr.width*sc),int(fr.height*sc)),Image.LANCZOS)
    fx,fy = (W-fr.width)//2, top
    shadow(im,(fx,fy,fx+fr.width,fy+fr.height),44); im.alpha_composite(fr,(fx,fy))
    return im

def textcard(caption, sub):
    im,_ = base(caption, sub, cap_size=96); return im

def endcard():
    im = Image.new("RGBA",(W,H),DARK+(255,)); d=ImageDraw.Draw(im)
    d.text((W//2,H//2-70),"Legacy",font=fnt(CORM,124),fill=CREAM,anchor="mm")
    d.text((W//2,H//2+62),"Odyssey",font=fnt(CORM,124),fill=GOLD,anchor="mm")
    d.text((W//2,H//2+210),"their own corner of the internet",font=fnt(JOSTR,40),fill=GOLD,anchor="mm")
    return im

S = os.path.join(ROOT, "marketing", "screenshots")
scenes = [
    textcard("Your baby gets their name as a website.", "a digital baby book at your-childs-name.com"),
    media_scene("A real website at their own .com.", os.path.join(S,"demo-site","05-month-by-month.jpg"), "browser", cover=True),
    media_scene("Fill it in from your phone.", os.path.join(S,"app","02-dashboard.jpg"), "phone"),
    media_scene("Custom galleries. Up to 50 photos each.", os.path.join(S,"features","09-gallery-grid.jpg"), "browser", url="legacyodyssey.com"),
    textcard("Share with your family in one tap.", "they open a private link, no password to type"),
    media_scene("Private and password protected.", os.path.join(S,"demo-site","06-our-family.jpg"), "browser", lock=True, cover=True),
    endcard(),
]
paths = []
for i, sc in enumerate(scenes, 1):
    p = os.path.join(FR, f"v{i:02d}.png"); sc.convert("RGB").save(p,"PNG"); paths.append(p)
print("frames:", len(paths))

# Build ffmpeg xfade slideshow
T, X = 3.4, 0.6
inp = []
for p in paths: inp += ["-loop","1","-t",str(T),"-i",p]
labels=[]; fc=[]
for i in range(len(paths)):
    fc.append(f"[{i}:v]fps=30,scale=1080:1920,setsar=1,format=yuva420p[v{i}]")
prev=f"[v0]"; L=T
for i in range(1,len(paths)):
    off = round(L - X, 3); out=f"[x{i}]"
    fc.append(f"{prev}[v{i}]xfade=transition=fade:duration={X}:offset={off}{out}")
    prev=out; L = L + T - X
fc.append(f"{prev}format=yuv420p[outv]")
filt=";".join(fc)
cmd=[FFMPEG,"-y",*inp,"-filter_complex",filt,"-map","[outv]","-r","30","-pix_fmt","yuv420p",OUTV]
print("encoding ~%.1fs video..." % L)
r=subprocess.run(cmd, capture_output=True, text=True)
if r.returncode!=0:
    print("FFMPEG ERR:\n", r.stderr[-1500:])
else:
    import shutil; shutil.copy(OUTV, DESKV); print("OK ->", OUTV); print("copied ->", DESKV)
