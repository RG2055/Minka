#!/usr/bin/env python3
"""Dithered backgrounds for the login gate and the loader scrims.

A smooth CSS gradient laid over 1-bit art turns its pixels into a grey
smudge. Here the fade toward the middle is part of the dither itself: pixel
density thins out, every pixel stays crisp.

  data/gate-bg-dither.png        x-ray collage, grey pixels, empty centre
  data/loader-scrim.png          black pixels, dense in the middle (480x270)
  data/loader-scrim-portrait.png same for the portrait clip (270x480)

Run: python3 scripts/build-gate-bg.py   (needs Pillow only)
"""
import math
from pathlib import Path
from PIL import Image

DATA = Path(__file__).resolve().parent.parent / 'data'
B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def ellipse(x, y, w, h, cx, cy, rx, ry):
    return math.hypot((x / w - cx) / rx, (y / h - cy) / ry)


def gate():
    src = Image.open(DATA / 'gate-bg.webp').convert('L').resize((700, 896), Image.BOX)
    lo, hi = 26 / 255, 150 / 255
    px = src.load()
    out = Image.new('L', src.size, 0)
    op = out.load()
    for y in range(src.height):
        for x in range(src.width):
            v = (px[x, y] / 255 - lo) / (hi - lo)
            # the login column sits in the middle: art fades out around it
            v *= smooth(.55, 1.05, ellipse(x, y, src.width, src.height, .5, .46, .36, .44))
            if v > (B4[y & 3][x & 3] + .5) / 16:
                op[x, y] = 118                     # quiet grey pixels, no CSS dimming
    out.save(DATA / 'gate-bg-dither.png', optimize=True)


def scrim(w, h, rx, ry, name):
    img = Image.new('LA', (w, h), (0, 0))
    p = img.load()
    for y in range(h):
        for x in range(w):
            cover = 1 - smooth(.55, 1.0, ellipse(x, y, w, h, .5, .5, rx, ry))
            if cover > (B4[y & 3][x & 3] + .5) / 16:
                p[x, y] = (0, 255)
    img.save(DATA / name, optimize=True)


if __name__ == '__main__':
    gate()
    scrim(480, 270, .24, .40, 'loader-scrim.png')
    scrim(270, 480, .44, .26, 'loader-scrim-portrait.png')
