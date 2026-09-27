#!/usr/bin/env python3
"""Chrome / glass / holo pieces for the Focus kit (pure PIL, no numpy).

- decorations (kalendars/data/card-addons/focus-v1): chrome shapes with a
  chromatic streak and grain, a holographic stripe frame (transparent centre)
- card backgrounds (kalendars/data/skins/skin-focus-*.webp): grainy blue
  ribbons (cool and warm), chrome set on black, holo stripes on ultramarine
No violet anywhere (house rule). Run: python3 scripts/build-chrome-art.py
"""
import colorsys, math, os, random
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'kalendars', 'data')
DECOR = os.path.join(ROOT, 'card-addons', 'focus-v1')
SKINS = os.path.join(ROOT, 'skins')
random.seed(5)

def clamp(v): return 0 if v < 0 else 255 if v > 255 else int(v)
def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))) if b != a else 0.0
    return t * t * (3 - 2 * t)
def grain(size, sigma=22):
    return Image.effect_noise(size, sigma)

# ---------- chrome shapes ----------
def shape_mask(kind, S, k=4):
    m = Image.new('L', (S * k, S * k), 0); d = ImageDraw.Draw(m)
    p, e = 0.06 * S * k, S * k - 0.06 * S * k
    r = (e - p) / 2
    if kind == 'circle': d.ellipse((p, p, e, e), fill=255)
    elif kind == 'd':      # flat right, round left
        d.ellipse((p, p, e, e), fill=255); d.rectangle((p + r, p, e, e), fill=255)
    elif kind == 'half':   # round right, flat left
        d.ellipse((p, p, e, e), fill=255); d.rectangle((p, p, p + r, e), fill=255)
    elif kind == 'drop':   # three round corners, square top right
        d.ellipse((p, p, e, e), fill=255); d.rectangle((p + r, p, e, p + r), fill=255)
    elif kind == 'pill':
        d.rounded_rectangle((p, p + r * .45, e, e - r * .45), radius=r * .55, fill=255)
    return m.resize((S, S), Image.LANCZOS)

def chrome(kind, S=360, light=(-1, -.3), seed=1):
    rnd = random.Random(seed)
    mask = shape_mask(kind, S)
    inner = mask.filter(ImageFilter.MinFilter(9))                 # body inset from the rim
    depth = inner.filter(ImageFilter.GaussianBlur(S * .2))        # 0.5 at the edge → 1 deep inside
    g = grain((S, S), 16)
    lx, ly = light; ln = math.hypot(lx, ly); lx, ly = lx / ln, ly / ln
    d0 = .27 + rnd.uniform(-.03, .04)
    px = []
    dp, ip, gp = depth.load(), inner.load(), g.load()
    for y in range(S):
        for x in range(S):
            a = ip[x, y]
            if not a: px.append((0, 0, 0, 0)); continue
            t = max(0.0, (dp[x, y] / 255 - .5) * 2)                 # 0 at the rim … 1 deep inside
            proj = (x / S - .5) * lx + (y / S - .5) * ly            # toward the lit side
            side = smooth(.38, .95, .5 + proj * 1.9) ** 1.2
            shade = max(0.0, min(1.0, .5 - proj * 1.6))             # the far side falls into soft grey
            streak = math.exp(-((t - d0) / .075) ** 2) * side
            warm = math.exp(-((t - d0 + .1) / .04) ** 2) * side    # orange edge outside the streak
            cool = math.exp(-((t - d0 - .1) / .045) ** 2) * side     # blue edge inside it
            n = (gp[x, y] - 128) * .5
            base = 252 - 70 * shade * (1 - t * .5)
            r = base - 222 * streak + 18 * warm - 150 * cool + n
            gg = base - 218 * streak - 55 * warm - 70 * cool + n
            b = base + 6 - 208 * streak - 150 * warm + 8 * cool + n
            px.append((clamp(r), clamp(gg), clamp(b), a))
    body = Image.new('RGBA', (S, S)); body.putdata(px)
    # metal rim: the full outline in steel with a dark gap before the body
    rim = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ring = ImageChops.subtract(mask, mask.filter(ImageFilter.MinFilter(5)))
    gap = ImageChops.subtract(mask.filter(ImageFilter.MinFilter(5)), inner)
    rim.paste((214, 218, 226, 255), (0, 0), ring)
    rim.paste((34, 36, 42, 255), (0, 0), gap)
    rim.alpha_composite(body)
    return rim

def save(im, path, q=80):
    im.save(path, 'WEBP', quality=q, method=6)

pieces = {'chrome-d': ('d', (-1, -.4)), 'chrome-half': ('half', (1, -.6)), 'chrome-drop': ('drop', (-1, .2)),
          'chrome-circle': ('circle', (.9, -.2)), 'chrome-pill': ('pill', (-.4, -1))}
made = {}
for i, (name, (kind, lt)) in enumerate(pieces.items()):
    made[name] = chrome(kind, light=lt, seed=i)
    save(made[name], os.path.join(DECOR, name + '.webp'))

# the whole set, stacked like a logo (also a card background on black)
def chrome_set(size=512, bg=None):
    cell = size // 3
    canvas = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    lay = [('chrome-d', 0, 0), ('chrome-half', 1, 0), ('chrome-drop', 0, 1), ('chrome-circle', 1, 1), ('chrome-drop', 0, 2)]
    ox = (size - cell * 2) // 2
    for name, cx, cy in lay:
        im = made[name].resize((cell, cell), Image.LANCZOS)
        if cy == 2: im = im.transpose(Image.FLIP_TOP_BOTTOM)
        canvas.alpha_composite(im, (ox + cx * cell, 6 + cy * cell - (cy * 8)))
    return canvas
save(chrome_set(), os.path.join(DECOR, 'chrome-set.webp'))
save(chrome_set(640, (4, 5, 8, 255)).convert('RGB'), os.path.join(SKINS, 'skin-focus-chrome.webp'), 82)

# ---------- grainy ribbons (backgrounds) ----------
def ribbons(W=640, H=640, warm=False, seed=3):
    rnd = random.Random(seed)
    ang = math.radians(-28); ca, sa = math.cos(ang), math.sin(ang)
    band = W / 3.7
    mott = Image.effect_noise((W // 16, H // 16), 60).resize((W, H), Image.BICUBIC)
    g = grain((W, H), 28); mp, gp = mott.load(), g.load()
    ph = [rnd.uniform(0, 6.28) for _ in range(3)]
    out = []
    for y in range(H):
        for x in range(W):
            u = x * ca - y * sa; v = x * sa + y * ca
            wave = 52 * math.sin(u / W * 4.6 + ph[0]) + 14 * math.sin(u / W * 10 + ph[1])
            q = (v - wave) / band
            t = q - math.floor(q)                                   # 0 … 1 across one ribbon
            body = math.sin(math.pi * min(1, t * 1.08)) ** 1.25     # round, a little flat at the far edge
            hi = math.exp(-((t - .36) / .07) ** 2)                  # the glossy highlight
            m = (mp[x, y] - 128) / 128 * .16
            n = (gp[x, y] - 128) * .55
            lum = max(0.0, .04 + .66 * body + m * body)
            r, gg, b = 14 + 150 * lum, 26 + 165 * lum, 70 + 190 * lum
            if warm: r, gg, b = 8 + 70 * lum, 34 + 175 * lum, 44 + 165 * lum   # teal (no violet)
            r += 205 * hi + 95 * math.exp(-((t - .27) / .035) ** 2)   # orange fringe before the highlight
            gg += 200 * hi + 35 * math.exp(-((t - .27) / .035) ** 2)
            b += 170 * hi + 120 * math.exp(-((t - .45) / .035) ** 2)  # blue fringe after it
            if t > .93:                                              # the deep shadow into the next ribbon
                k = (t - .93) / .07; r, gg, b = r * (1 - k) + 6 * k, gg * (1 - k) + 8 * k, b * (1 - k) + 28 * k
            if t < .05:                                              # the saturated blue lip at the ribbon's edge
                k = 1 - t / .05; r, gg, b = r * (1 - k) + 26 * k, gg * (1 - k) + 46 * k, b * (1 - k) + 250 * k
            out.append((clamp(r + n), clamp(gg + n), clamp(b + n)))
    im = Image.new('RGB', (W, H)); im.putdata(out)
    return im
save(ribbons(), os.path.join(SKINS, 'skin-focus-ribbons.webp'), 72)
save(ribbons(warm=True, seed=9), os.path.join(SKINS, 'skin-focus-ribbons-teal.webp'), 72)

# ---------- holographic stripe frame ----------
HUES = [(0, 188), (.25, 214), (.45, 176), (.6, 142), (.78, 46), (.9, 14), (1, 188)]   # cyan, blue, mint, amber, coral (never through violet)
def holo_hue(t):
    t = t % 1
    for (a, ha), (b, hb) in zip(HUES, HUES[1:]):
        if a <= t <= b:
            f = (t - a) / (b - a)
            return (ha + (hb - ha) * f) % 360          # straight, not the short way round (that crosses violet)
    return HUES[0][1]
def holo(W=512, H=512, bg=None, seed=4):
    rnd = random.Random(seed)
    g = grain((W, H), 40); gp = g.load()
    period = W / 7.5
    out = []
    for y in range(H):
        for x in range(W):
            e = min(x, y, W - x, H - y) / W                           # distance to the nearest edge
            s = ((x + y) % period) / period                           # position across a stripe
            stripe = s < .56
            # the inner edge follows the stripes, like torn holo foil
            edge = .2 + .06 * math.sin((x - y) / W * 9) + .05 * (s if stripe else 0)
            f = smooth(edge + .03, edge - .05, e + (gp[x, y] - 128) / 128 * .035)
            if not stripe or f <= 0:
                out.append(bg if bg else (0, 0, 0, 0)); continue
            h = holo_hue(x / W * .7 + y / H * .5 + .08 * math.sin(y / H * 6))
            lum = .56 + .3 * math.sin(s / .56 * math.pi) + (gp[x, y] - 128) / 128 * .12
            smear = math.exp(-((s - .5) / .08) ** 2) * .55                  # dark blue smear at the stripe's end
            r, gg, b = colorsys.hls_to_rgb(h / 360, max(.1, min(.92, lum * (1 - smear))), .85)
            r, gg, b = r * 255, gg * 255, b * 255
            if smear > .3 and rnd.random() < .08: r, gg, b = 255, 90, 60     # the odd red grain in the smear
            b += 60 * smear
            a = int(255 * f)
            if bg:
                k = f; out.append((clamp(bg[0] * (1 - k) + r * k), clamp(bg[1] * (1 - k) + gg * k), clamp(bg[2] * (1 - k) + b * k), 255))
            else:
                out.append((clamp(r), clamp(gg), clamp(b), a))
    im = Image.new('RGBA', (W, H)); im.putdata(out)
    return im
save(holo(), os.path.join(DECOR, 'frame-holo.webp'))
save(holo(640, 640, (20, 30, 128, 255)).convert('RGB'), os.path.join(SKINS, 'skin-focus-holo.webp'), 82)
print('ok')
