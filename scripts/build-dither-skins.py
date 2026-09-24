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


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for sid, fn, ink, paper_c, method in SKINS:
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
