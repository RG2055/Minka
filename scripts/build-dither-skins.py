#!/usr/bin/env python3
"""Dither card backgrounds: procedural scenes drawn at dot resolution
(160×90), dithered to two tones (ink on paper), stored ×3 nearest-neighbour
as kalendars/data/skins/skin-dither-<id>.webp (480×270, the size of every
other skin), so each dot stays a crisp 3×3 square.

Every scene keeps a darker pocket where the card's big number sits, so the
number stays readable on top of the dither.
Run: python3 scripts/build-dither-skins.py   (needs Pillow only)
"""
import math
import random
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'kalendars' / 'data' / 'skins'
W, H, SCALE = 160, 90, 3
BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def unit(v):
    n = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / n for c in v)


LIGHT = unit((-.45, -.65, .62))


def lit(n, spec=18):
    d = max(0.0, sum(a * b for a, b in zip(n, LIGHT)))
    half = unit((LIGHT[0], LIGHT[1], LIGHT[2] + 1))
    s = max(0.0, sum(a * b for a, b in zip(n, half))) ** spec
    return min(1.0, .05 + .78 * d + .55 * s)


def pocket(x, y, depth=.55):
    """Darker middle for the number (x, y in 0..1)."""
    return 1 - depth * math.exp(-(((x - .5) / .26) ** 2 + ((y - .45) / .3) ** 2))


# ---------- scenes: f(x, y) -> 0..1, x/y in 0..1 (y down) ----------
TORUS = None


def torus_buffer():
    """Splat a tilted torus into a z-buffer once (like the RG logo ring)."""
    zbuf = {}
    R, r, tilt, cx, cy, size = .62, .26, math.radians(58), .7, .52, .5
    ct, st = math.cos(tilt), math.sin(tilt)
    for i in range(900):
        u = i / 900 * 2 * math.pi
        for j in range(160):
            v = j / 160 * 2 * math.pi
            px = (R + r * math.cos(v)) * math.cos(u)
            py = (R + r * math.cos(v)) * math.sin(u)
            pz = r * math.sin(v)
            nx, ny, nz = math.cos(v) * math.cos(u), math.cos(v) * math.sin(u), math.sin(v)
            # tilt round the x axis: the ring leans back, seen from the front
            y2, z2 = py * ct - pz * st, py * st + pz * ct
            ny2, nz2 = ny * ct - nz * st, ny * st + nz * ct
            sx = int((cx + px * size * 9 / 16) * W)
            sy = int((cy + y2 * size) * H)
            if 0 <= sx < W and 0 <= sy < H and ((sx, sy) not in zbuf or zbuf[(sx, sy)][0] < z2):
                zbuf[(sx, sy)] = (z2, lit(unit((nx, ny2, nz2)), 26))
    return zbuf


def torus(x, y):
    global TORUS
    if TORUS is None:
        TORUS = torus_buffer()
    hit = TORUS.get((int(x * W), int(y * H)))
    return (hit[1] if hit else 0.0) * pocket(x, y, .3)


def sphere(x, y):
    cx, cy, R = .2, 1.02, .62
    X, Y = (x - cx) * 16 / 9, y - cy
    d2 = X * X + Y * Y
    v = 0.0
    if d2 < R * R:
        z = math.sqrt(R * R - d2)
        v = lit(unit((X / R, Y / R, z / R)), 30) * .82
    rnd = random.Random(int(x * W) * 131 + int(y * H) * 7)
    if not v and rnd.random() < .012:
        v = .9
    return v * pocket(x, y, .45)


def dunes(x, y):
    v = 0.0
    for k in range(5):
        base = .38 + k * .15
        ridge = base + .06 * math.sin(x * 7.5 + k * 1.7) + .03 * math.sin(x * 17 + k)
        if y > ridge:
            slope = math.cos(x * 7.5 + k * 1.7) * .45
            depth = min(1.0, (y - ridge) * 9)
            v = max(0.0, .25 + .55 * (1 - depth) + slope * .35) * (.45 + k * .12)
    return min(1.0, v) * pocket(x, y, .5)


def ribbons(x, y):
    v = 0.0
    for k, (amp, ph, w) in enumerate(((.16, 0, .06), (.12, 1.9, .045), (.1, 3.6, .035))):
        cy = .5 + amp * math.sin(x * 5.2 + ph) + (k - 1) * .2
        d = (y - cy) / w
        if abs(d) < 1:
            n = unit((-.4 * math.cos(x * 5.2 + ph), d, math.sqrt(1 - d * d)))
            v = max(v, lit(n, 14) * (1 - .18 * k))
    return v * pocket(x, y, .45)


def grid(x, y):
    horizon = .52
    if y < horizon:
        # sun: banded disc
        d = math.hypot((x - .5) * 16 / 9, (y - .36) / .9)
        if d < .22:
            band = (y * 40) % 2 < (1.3 - (horizon - y) * 2.2)
            return (.95 - d * 1.4) if band else .08
        rnd = random.Random(int(x * W) * 97 + int(y * H) * 13)
        return .9 if rnd.random() < .01 else 0.0
    t = (y - horizon) / (1 - horizon)
    z = 1 / max(.02, t)
    gx = ((x - .5) * z * 2.2) % 1
    gz = (z * .9) % 1
    line = gx < .06 * z ** .3 or gz < .08
    return (.2 + .75 * t) if line else .04 + .1 * t


def signal(x, y):
    bars = 40
    b = int(x * bars)
    rnd = random.Random(b * 7919)
    hgt = .18 + .5 * math.exp(-((b / bars - .28) / .22) ** 2) + .22 * math.exp(-((b / bars - .74) / .12) ** 2) + rnd.random() * .12
    top = 1 - hgt
    if (x * bars) % 1 > .78 or y < top:
        return .03
    return min(1.0, .25 + (y - top) * 1.6) * pocket(x, y, .5)


def paper(x, y):
    # Light skin: soft blobs, drawn as ink amount (inverted later).
    v = 0.0
    for cx, cy, r in ((.16, .22, .3), (.86, .78, .36), (.62, .1, .16)):
        d = math.hypot((x - cx) * 16 / 9, y - cy) / r
        if d < 1:
            v = max(v, (1 - d) ** .8 * .9)
    return v * (1 - .7 * math.exp(-(((x - .5) / .25) ** 2 + ((y - .45) / .3) ** 2)))


# ---------- radiology scenes for /rad resident cards ----------
# X-ray look: bone bright, soft tissue faint, air dark. Cards are about
# square and show the middle of the 16:9 picture, so the anatomy is centred;
# card_mask() dims the number's area and the name/chip bands a little.
AR = 16 / 9


def smooth(d, w=.012):
    """1 inside (d<0), 0 outside, soft edge of width w."""
    return max(0.0, min(1.0, .5 - d / (2 * w)))


def ellipse_d(x, y, cx, cy, rx, ry):
    return math.hypot((x - cx) / rx, (y - cy) / ry) - 1


def card_mask(x, y):
    m = 1 - .35 * math.exp(-(((x - .5) / .2) ** 2 + ((y - .45) / .26) ** 2))
    if y < .2:
        m *= .55 + .45 * (y / .2)
    if y > .76:
        m *= .55 + .45 * ((1 - y) / .24)
    return m


def xray(v, x, y, grain=.04):
    rnd = (math.sin(x * 812.3 + y * 1311.7) * 43758.5453) % 1
    return max(0.0, min(1.0, (v + (rnd - .5) * grain) * card_mask(x, y)))


def rtg_chest(x, y):
    X, Y = (x - .5) * AR, y - .5
    v = .03
    body = ellipse_d(X, Y, 0, .02, .44, .5)
    v = max(v, .2 * smooth(body, .04))                                         # soft tissue
    for side in (-1, 1):                                                       # dark lungs
        if ellipse_d(X, Y, side * .17, -.02, .14, .33) < 0:
            v = .07
    for i in range(10):                                                        # ribs over the lungs
        yy = -.32 + i * .066
        for side in (-1, 1):
            xx = X * side
            if .02 < xx < .33:
                d = abs(Y - (yy + .5 * (xx - .12) ** 2 + .05 * xx))
                v = max(v, .66 * smooth(d - .009, .006))
    v = max(v, .78 * smooth(abs(X) - .03, .008) * smooth(abs(Y) - .47, .02))  # spine
    for side in (-1, 1):                                                       # clavicles
        xx = X * side
        if .03 < xx < .32:
            v = max(v, .75 * smooth(abs(Y - (-.36 + .16 * (xx - .15) ** 2 - .05 * xx)) - .011, .007))
    v = max(v, .34 * smooth(ellipse_d(X, Y, .07, .13, .12, .15), .05))       # heart shadow
    return xray(v, x, y)


def rtg_hand(x, y):
    X, Y = (x - .5) * AR, y - .56
    v = .05
    palm = ellipse_d(X, Y, 0, .12, .2, .2)
    v = max(v, .13 * smooth(palm, .06))
    rays = [(-.62, 3), (-.28, 4), (-.05, 4), (.17, 4), (.4, 4)]              # thumb .. little finger
    for i, (ang, bones) in enumerate(rays):
        ca, sa = math.sin(ang), -math.cos(ang)
        bx, by = X - (-.05 + i * .06 - (.08 if i == 0 else 0)), Y - (.18 if i else .26)
        along = bx * ca + by * sa
        across = -bx * sa + by * ca
        seg = [0, .16, .27, .35, .41][:bones + 1] if i else [0, .14, .24, .32]
        for a, b in zip(seg, seg[1:]):
            mid, half = (a + b) / 2, (b - a) / 2 - .008
            d = max(abs(along - mid) - half, abs(across) - .028 * (1.2 if a == 0 else 1))
            v = max(v, .78 * smooth(d, .008))
        v = max(v, .12 * smooth(max(along - seg[-1] - .02, abs(across) - .04), .02) * smooth(-along + 0, .02) if False else 0)
    for i in range(8):                                                         # carpals
        cx, cy = -.09 + (i % 4) * .055, .33 + (i // 4) * .06
        v = max(v, .7 * smooth(ellipse_d(X, Y, cx, cy, .026, .024), .01))
    return xray(v, x, y)


def rtg_brain(x, y):
    X, Y = (x - .5) * AR, y - .5
    v = .04
    head = ellipse_d(X, Y, 0, 0, .3, .38)
    v = max(v, .65 * smooth(abs(head) - .02, .01))
    inner = ellipse_d(X, Y, 0, 0, .27, .35)
    if inner < 0:
        gyri = .5 + .5 * math.sin(38 * math.hypot(X, Y * .8) + 5 * math.sin(7 * math.atan2(Y, X)))
        v = max(v, .18 + .28 * gyri * min(1, -inner * 4))
    for side in (-1, 1):                                                       # ventricles
        v = min(v, .05 + 1 - smooth(ellipse_d(X * side, Y, .05, -.02, .035, .12), .01)) if ellipse_d(X * side, Y, .05, -.02, .035, .12) < 0 else v
    return xray(v, x, y)


# Kept what reads at a glance on a card. Tried and dropped: knee and pelvis
# (could read as something else), a drawn skull and spine (not clear).
def rtg_flower(x, y):
    """X-ray flower (the photographic genre): petals translucent, where they
    overlap it gets brighter; fine veins; a stem and one leaf."""
    X, Y = (x - .5) * AR, y - .42
    v = .03
    n = 7
    r = math.hypot(X, Y)
    a = math.atan2(Y, X)
    petals = 0.0
    for i in range(n):
        ang = i * 2 * math.pi / n + .3
        # distance along/across this petal's axis
        along = X * math.cos(ang) + Y * math.sin(ang)
        across = -X * math.sin(ang) + Y * math.cos(ang)
        if along > 0:
            d = ellipse_d(along, across, .17, 0, .17, .07)
            if d < 0:
                petals += .3 * (1 - (-d) ** 3) + .1          # translucent, brighter at the rim
                if abs(across) < .004 + .01 * (along / .34):  # midrib
                    petals += .25
    v = max(v, min(.9, petals))
    v = max(v, .8 * smooth(r - .045, .01))                       # centre
    if .045 < r < .075:
        v = max(v, .5 + .3 * math.sin(a * 24))                   # stamens
    if Y > .05:                                                  # stem
        v = max(v, .55 * smooth(abs(X - .02 * (Y - .05)) - .008, .005) * smooth(Y - .56, .02))
    leaf = ellipse_d(X - .1, Y - .38, 0, 0, .11, .035)
    if leaf < 0:
        v = max(v, .35 + .35 * smooth(abs(Y - .38 - (X - .1) * .1) - .003, .003))
    return xray(v, x, y)


def rtg_ct(x, y):
    """Axial CT of the abdomen: body outline, spine, aorta, liver, kidneys, gantry rings."""
    X, Y = (x - .5) * AR, y - .5
    v = .03
    body = ellipse_d(X, Y, 0, 0, .4, .3)
    v = max(v, .2 * smooth(body, .01))
    v = max(v, .5 * smooth(abs(body) - .008, .006))                            # skin line
    v = max(v, .8 * smooth(ellipse_d(X, Y, 0, .17, .06, .05), .01))           # vertebral body
    v = max(v, .7 * smooth(ellipse_d(X, Y, 0, .24, .02, .045), .01))          # spinous process
    v = max(v, .6 * smooth(ellipse_d(X, Y, .03, .07, .035, .035), .01))       # aorta
    v = max(v, .42 * smooth(ellipse_d(X, Y, -.2, -.02, .16, .14), .02))       # liver
    for side in (-1, 1):
        v = max(v, .55 * smooth(ellipse_d(X, Y, side * .15, .13, .05, .07), .012))   # kidneys
    for r in (.47, .53):                                                       # gantry rings
        v = max(v, .25 * smooth(abs(math.hypot(X, Y) - r) - .004, .004))
    return xray(v, x, y, .08)


RTG = [('krutis', rtg_chest), ('plauksta', rtg_hand), ('mr', rtg_brain), ('zieds', rtg_flower), ('ct', rtg_ct)]
# More pictures (brain, skulls, skeleton) come from reference images:
# scripts/build-rad-photo-skins.py.
# Inks: three warm ("f": rose, coral, peach) and three cool ("m": ice, teal,
# green); /rad picks one by name, and everyone can change it. Never violet.
RTG_INKS = [('f1', '#ffb3cf', '#0d0609'), ('f2', '#ff9e8f', '#0d0706'), ('f3', '#ffc9a8', '#0d0906'),
            ('m1', '#8fd0ff', '#050a10'), ('m2', '#5ee0d0', '#040c0b'), ('m3', '#a8e67a', '#070c05')]

SKINS = [
    ('tors', torus, '#eceae4', '#070707', 'atkinson'),
    ('lode', sphere, '#64d2ff', '#04080c', 'atkinson'),
    ('kapas', dunes, '#1fe091', '#040a07', 'atkinson'),
    ('lentes', ribbons, '#f5b73f', '#0a0703', 'atkinson'),
    ('rezgis', grid, '#23cdcf', '#030909', 'bayer'),
    ('signals', signal, '#ff5c5c', '#0b0404', 'bayer'),
    ('papirs', paper, '#141414', '#e9e6dc', 'atkinson'),
]


def dither(field, method):
    out = [[0] * W for _ in range(H)]
    if method == 'bayer':
        for y in range(H):
            for x in range(W):
                out[y][x] = 1 if field[y][x] * 16 > BAYER4[y % 4][x % 4] + .5 else 0
        return out
    buf = [row[:] for row in field]
    for y in range(H):
        for x in range(W):
            old = buf[y][x]
            new = 1 if old >= .5 else 0
            out[y][x] = new
            err = (old - new) / 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < W and yy < H:
                    buf[yy][xx] += err
    return out


def save_fine(sid, fn, ink, paper_c, w=240, h=135):
    """Finer dots for the radiology pictures (2×2 per dot, same 480×270 size)."""
    field = [[max(0.0, min(1.0, fn((x + .5) / w, (y + .5) / h))) for x in range(w)] for y in range(h)]
    buf = [row[:] for row in field]
    bits = [[0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            old = buf[y][x]
            new = 1 if old >= .5 else 0
            bits[y][x] = new
            err = (old - new) / 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < w and yy < h:
                    buf[yy][xx] += err
    ink_c, pap_c = hexrgb(ink), hexrgb(paper_c)
    img = Image.new('RGB', (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = ink_c if bits[y][x] else pap_c
    img = img.resize((480, 270), Image.NEAREST)
    path = OUT / f'skin-dither-{sid}.webp'
    img.save(path, 'WEBP', lossless=True, method=6)
    print(path.relative_to(ROOT), path.stat().st_size, 'bytes')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rtg = [('rtg-' + name + '-' + tone, fn, ink, pap, 'atkinson') for name, fn in RTG for tone, ink, pap in RTG_INKS]
    only = __import__('sys').argv[1:]
    for sid, fn, ink, paper_c, method in SKINS + rtg:
        if only and not any(sid.startswith(o) for o in only):
            continue
        if sid.startswith('rtg-'):
            save_fine(sid, fn, ink, paper_c)
            continue
        field = [[max(0.0, min(1.0, fn((x + .5) / W, (y + .5) / H))) for x in range(W)] for y in range(H)]
        bits = dither(field, method)
        ink_c, pap_c = hexrgb(ink), hexrgb(paper_c)
        img = Image.new('RGB', (W, H))
        px = img.load()
        for y in range(H):
            for x in range(W):
                px[x, y] = ink_c if bits[y][x] else pap_c
        img = img.resize((W * SCALE, H * SCALE), Image.NEAREST)
        path = OUT / f'skin-dither-{sid}.webp'
        img.save(path, 'WEBP', lossless=True, method=6)
        print(path.relative_to(ROOT), path.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
