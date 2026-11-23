"""A preview of the group dance as the page plays it (js/radio-dancers.js): one beat for all, creature i dancing
phrase (P + i) % 4, the third mirrored, koro's close-up (E, grown towards the viewer) every fourth phrase.
120 a minute, 12 steps a beat: 24 frames a second.  python preview_group.py frames_dir x0 y0 w h out_dir"""
import math
import os
import sys

from PIL import Image

src, x0, y0, w, h, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
KINDS = [('pufs', 'low'), ('koro', 'high'), ('antenas', 'mid')]   # three dance (the user)
MIRROR = [False, False, True]
PER, LAP, M, GROW = 96, 0.12, 24, 0.6   # GROW: as the page's close-up
os.makedirs(out, exist_ok=True)
step = int(w * (1 - LAP))
W, H = step * 2 + w, int(h * 2.2)
n = 0
for P in range(4):
    for f in range(PER):
        canvas = Image.new('RGBA', (W, H), (22, 26, 33, 255))
        t = f / 12
        order = [0, 2, 1]   # koro drawn last: in front when it comes close
        for i in order:
            kind, lv = KINDS[i]
            grin = i == 1 and P == 3
            m = M if grin else 0   # the close-up may reach past the frame
            if grin:   # rendered twice as big
                im = Image.open(f'{src}/koroE/{kind}-{lv}-r{f:03d}.png').crop((2 * (x0 - m), 2 * (y0 - m), 2 * (x0 + w + m), 2 * (y0 + h + m)))
            else:
                im = Image.open(f'{src}/{kind}/{kind}-{lv}-r{((P + i) % 4) * PER + f:03d}.png').crop((x0, y0, x0 + w, y0 + h))
            if MIRROR[i] and not grin:
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
            g = up = 0.0
            if grin:   # as the page: a hop a beat up to the camera, a step bigger in the air; four beats there; two hops back
                e = lambda u: max(0.0, min(1.0, u)) ** 2 * (3 - 2 * max(0.0, min(1.0, u)))
                if t < 2 or t >= 6:
                    u = max(0.0, min(1.0, (t % 1 - 0.08) / 0.6))
                    g = (int(t if t < 2 else t - 6) + e(u)) / 2
                    g, up = (1 - g if t >= 6 else g), math.sin(math.pi * u) * 0.12
                else:
                    g = 1.0
            sc = 1 + GROW * g
            if im.width != int((w + 2 * m) * sc):
                im = im.resize((int((w + 2 * m) * sc), int((h + 2 * m) * sc)), Image.LANCZOS)
            # as the page: grown from its feet, raised as it comes near
            ox, oy = w / 2, h
            canvas.paste(im, (int(i * step + ox + (-m - ox) * sc), int(H - h + oy + (-m - oy) * sc - (up + 0.2 * g) * h)), im)   # (paste clips at the edges)
        canvas.convert('RGB').save(f'{out}/p{n:04d}.png')
        n += 1
print('frames', n)
