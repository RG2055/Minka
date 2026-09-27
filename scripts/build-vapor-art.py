#!/usr/bin/env python3
"""Two vaporwave card looks (original compositions, pure PIL):
- skin-vapor-secret.webp: hot pink, a Win95 window "SECRET_"
- skin-vapor-floral.webp: salmon pink, perspective checker floor, teal title,
  a VHS sunset window
- card-addons/focus-v1/object-david-vapor.webp: the bust as blue/white dither
Run: python3 scripts/build-vapor-art.py
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.join(os.path.dirname(__file__), '..', 'kalendars', 'data')
SKINS = os.path.join(ROOT, 'skins')
DECOR = os.path.join(ROOT, 'card-addons', 'focus-v1')
UNI = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
S = 640

def bevel(d, box, up=True):
    x0, y0, x1, y1 = box
    hi, lo = ('#ffffff', '#6e6e6e') if up else ('#6e6e6e', '#ffffff')
    d.line((x0, y0, x1, y0), fill=hi, width=3); d.line((x0, y0, x0, y1), fill=hi, width=3)
    d.line((x0, y1, x1, y1), fill=lo, width=3); d.line((x1, y0, x1, y1), fill=lo, width=3)

# ---------- SECRET_ ----------
pink = (229, 67, 138)
im = Image.new('RGB', (S, S), pink)
d = ImageDraw.Draw(im)
win = (96, 168, 552, 520)
d.rectangle(win, fill=(192, 192, 192)); bevel(d, win)
d.rectangle((win[0] + 8, win[1] + 8, win[2] - 8, win[1] + 44), fill=(214, 62, 134))
f = ImageFont.truetype(BOLD, 22)
d.text((win[0] + 20, win[1] + 13), 'SECRET_', font=f, fill='white')
for i, sym in enumerate(['X', '', '_']):
    bx = win[2] - 44 - i * 36
    b = (bx, win[1] + 12, bx + 30, win[1] + 40)
    d.rectangle(b, fill=(192, 192, 192)); bevel(d, b)
    if sym == 'X': d.line((bx + 8, win[1] + 18, bx + 22, win[1] + 34), fill='black', width=3); d.line((bx + 22, win[1] + 18, bx + 8, win[1] + 34), fill='black', width=3)
    elif sym == '_': d.line((bx + 8, win[1] + 32, bx + 20, win[1] + 32), fill='black', width=3)
    else: d.rectangle((bx + 8, win[1] + 18, bx + 22, win[1] + 33), outline='black', width=2)
inner = (win[0] + 12, win[1] + 52, win[2] - 12, win[3] - 12)
d.rectangle(inner, fill=pink); bevel(d, inner, up=False)
# a few dithered sparkles (blue pixels) so the plain pink is not flat
rnd = random.Random(2)
for _ in range(260):
    x, y = rnd.randrange(S), rnd.randrange(S)
    if win[0] - 6 < x < win[2] + 6 and win[1] - 6 < y < win[3] + 6: continue
    if rnd.random() < .5: d.point((x, y), fill=(58, 43, 242))
im.save(os.path.join(SKINS, 'skin-vapor-secret.webp'), 'WEBP', quality=86, method=6)

# ---------- blue/white dither bust ----------
src = Image.open(os.path.join(ROOT, 'card-addons', 'realistic-v1', 'object-david.webp')).convert('RGBA')
small = src.resize((src.width // 2, src.height // 2), Image.LANCZOS)
lum = ImageOps.autocontrast(small.convert('RGB').convert('L'), cutoff=1)
bw = lum.convert('1', dither=Image.Dither.FLOYDSTEINBERG)
alpha = small.getchannel('A').point(lambda a: 255 if a > 110 else 0)
blue, white = (58, 43, 242, 255), (250, 250, 255, 255)
out = Image.new('RGBA', small.size, (0, 0, 0, 0))
px, bp, ap = out.load(), bw.load(), alpha.load()
for y in range(small.height):
    for x in range(small.width):
        if ap[x, y]: px[x, y] = white if bp[x, y] else blue
out = out.resize(src.size, Image.NEAREST)
out.save(os.path.join(DECOR, 'object-david-vapor.webp'), 'WEBP', lossless=True, method=6)

# ---------- FLORAL ----------
salmon = (246, 166, 160)
K = 2; W = S * K
im = Image.new('RGB', (W, W), salmon)
px = im.load()
horizon, cx, fcam = int(W * .6), W / 2, W * .9
for y in range(horizon + 1, W):
    z = fcam / (y - horizon)                      # depth
    for x in range(W):
        xw = (x - cx) * z / fcam * 2.6
        zw = z * .55
        if (math.floor(xw) + math.floor(zw)) % 2: px[x, y] = (22, 22, 24)
im = im.resize((S, S), Image.LANCZOS)
d = ImageDraw.Draw(im)
teal = (79, 224, 176)
jp = ImageFont.truetype(UNI, 40); jp2 = ImageFont.truetype(UNI, 27)
d.text((300, 62), 'マインカ＋', font=jp, fill=teal)
d.rectangle((296, 118, 606, 124), fill=teal)
d.text((300, 132), 'シフトの時間', font=jp2, fill=teal)
# pixel cube: three faces in teal steps
for i in range(6):
    for j in range(6):
        x0, y0 = 560 + (i - j) * 4, 60 + (i + j) * 2
        d.rectangle((x0, y0, x0 + 4, y0 + 4), fill=(120, 240, 200) if (i + j) % 2 else (60, 200, 150))
# VHS sunset window
box = (318, 196, 610, 370)
vhs = Image.new('RGB', (box[2] - box[0], box[3] - box[1]))
vp = vhs.load(); vw, vh = vhs.size
for y in range(vh):
    t = y / vh
    for x in range(vw):
        if t < .58:
            k = t / .58
            c = (int(255 - 40 * k), int(150 - 70 * k), int(60 + 40 * k))       # orange into coral
        else:
            k = (t - .58) / .42
            c = (int(236 - 30 * k), int(96 + 40 * k), int(120 + 50 * k))        # the water
        if y % 3 == 0: c = tuple(int(v * .82) for v in c)                        # scanlines
        vp[x, y] = c
vd = ImageDraw.Draw(vhs)
rnd = random.Random(5)
x = 6
while x < vw - 6:
    bw_ = rnd.randint(10, 22); bh = rnd.randint(18, 60)
    if 80 < x < 120: bh = 88                                                    # two tall towers
    vd.rectangle((x, int(vh * .58) - bh, x + bw_, int(vh * .58)), fill=(38, 28, 48))
    x += bw_ + rnd.randint(1, 5)
for y in range(int(vh * .6), vh, 4):
    vd.line((rnd.randint(0, vw // 2), y, rnd.randint(vw // 2, vw), y), fill=(255, 214, 150), width=1)
im.paste(vhs, box[:2])
d.rectangle(box, outline=(20, 20, 20), width=2)
im.save(os.path.join(SKINS, 'skin-vapor-floral.webp'), 'WEBP', quality=86, method=6)
print('ok')
