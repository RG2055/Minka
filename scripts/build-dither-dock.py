#!/usr/bin/env python3
"""Dither backgrounds for the bottom bar (Galvene → Apakšējā josla → Fons).

The card skins are 16:9 and would be stretched into a 10:1 bar (coarse, uneven
dots). These are drawn in the bar's own proportions: 36 dots tall (≈2 CSS px
per dot on the ~70 px bar), ordered Bayer dither so they tile horizontally with
no seam (width divisible by 4, every scene periodic over the width). White ink
on black: the page recolours them with a luminance mask.
Run: python3 scripts/build-dither-dock.py   (needs Pillow only)
"""
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'kalendars' / 'data' / 'skins'
W, H = 400, 36
BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
TAU = 2 * math.pi


def dunes(x, y):
    # three ridges, each a whole number of waves across the tile
    v = 0.0
    for k, (cycles, base, amp) in enumerate(((2, .42, .13), (3, .62, .1), (5, .82, .06))):
        ridge = base + amp * math.sin(TAU * cycles * x + k * 1.3)
        if y > ridge:
            slope = math.cos(TAU * cycles * x + k * 1.3)
            depth = min(1.0, (y - ridge) * 7)
            v = max(v, (.28 + .5 * (1 - depth) + .25 * slope) * (.55 + k * .15))
    return v


TORUS_W = 96          # the ring gets its own small image, shown once (no repeat)
_torus = None


def torus_image():
    """One lit torus seen from slightly above, splatted into a z-buffer (like the RG logo)."""
    global _torus
    if _torus is not None:
        return _torus
    R, r, tilt = 1.0, .36, math.radians(62)
    ct, st = math.cos(tilt), math.sin(tilt)
    light = (-.45, -.7, .55)
    ln = math.sqrt(sum(c * c for c in light)); light = tuple(c / ln for c in light)
    zbuf = {}
    scale = 22                                   # px per unit
    for i in range(720):
        u = i / 720 * TAU
        for j in range(120):
            v = j / 120 * TAU
            px_ = (R + r * math.cos(v)) * math.cos(u)
            py_ = (R + r * math.cos(v)) * math.sin(u)
            pz_ = r * math.sin(v)
            nx, ny, nz = math.cos(v) * math.cos(u), math.cos(v) * math.sin(u), math.sin(v)
            y2, z2 = py_ * ct - pz_ * st, py_ * st + pz_ * ct
            ny2, nz2 = ny * ct - nz * st, ny * st + nz * ct
            sx, sy = int(TORUS_W / 2 + px_ * scale), int(H / 2 + y2 * scale)
            if 0 <= sx < TORUS_W and 0 <= sy < H and ((sx, sy) not in zbuf or zbuf[(sx, sy)][0] < z2):
                d = max(0.0, nx * light[0] + ny2 * light[1] + nz2 * light[2])
                spec = max(0.0, nz2) ** 18
                zbuf[(sx, sy)] = (z2, min(1.0, .04 + .7 * d + .45 * spec))
    _torus = {k: v[1] for k, v in zbuf.items()}
    return _torus


def signal(x, y):
    bars = 50
    b = int(x * bars)
    h = .25 + .3 * (.5 + .5 * math.sin(TAU * 2 * b / bars)) + .25 * (.5 + .5 * math.sin(TAU * 5 * b / bars + 1))
    top = 1 - h
    if (x * bars) % 1 > .72 or y < top:
        return 0.0
    return .35 + (y - top) * .9


def floor_grid(x, y):
    # perspective floor: horizontal lines crowd toward the horizon, verticals every 25 dots
    px, py = x * W, y * H
    horizon = 3
    if py < horizon:
        return 0.0
    z = 60 / (py - horizon + 1)                 # depth
    row = abs(z - round(z)) < .09 * (1 + (py - horizon) / H)
    col = (px % 25) < 1 and int(py) % 2 == 0
    fade = .3 + .7 * (py - horizon) / (H - horizon)
    return fade if (row or col) else 0.0


SCENES = [('kapas', dunes), ('signals', signal), ('rezgis', floor_grid)]


def main():
    for sid, fn in SCENES:
        img = Image.new('L', (W, H))
        px = img.load()
        for y in range(H):
            for x in range(W):
                v = max(0.0, min(1.0, fn((x + .5) / W, (y + .5) / H)))
                px[x, y] = 255 if v * 16 > BAYER4[y % 4][x % 4] + .5 else 0
        path = OUT / f'dock-dither-{sid}.webp'
        img.convert('RGB').save(path, 'WEBP', lossless=True, method=6)
        print(path.relative_to(ROOT), path.stat().st_size, 'bytes')
    # the torus: one ring in its own image, shown once at the bar's right side
    t = torus_image()
    img = Image.new('L', (TORUS_W, H))
    px = img.load()
    for y in range(H):
        for x in range(TORUS_W):
            v = t.get((x, y), 0.0)
            px[x, y] = 255 if v * 16 > BAYER4[y % 4][x % 4] + .5 else 0
    path = OUT / 'dock-dither-tors.webp'
    img.convert('RGB').save(path, 'WEBP', lossless=True, method=6)
    print(path.relative_to(ROOT), path.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
