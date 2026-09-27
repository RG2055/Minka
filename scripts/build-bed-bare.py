#!/usr/bin/env python3
"""The Nakts bed with no duvet: for when a cat has pulled it off (the sleeper
shows, lying on the sheet). From the neutral bed picture: where the duvet and
its turned-down fold were (the linen mask's R and B), the mattress goes on
flat under a sheet to the footboard, its sides straight down (nothing hangs
over them any more), and the footboard's top shows where the duvet's corners
covered it.

    python3 scripts/build-bed-bare.py
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOMS = os.path.join(ROOT, 'kalendars/assets/rooms')

bed = np.asarray(Image.open(os.path.join(ROOMS, 'bed-neutral-512.webp')).convert('RGBA')).astype(float)
mask = np.asarray(Image.open(os.path.join(ROOMS, 'beds/linen-mask-256.webp')).convert('RGBA').resize((512, 728), Image.BILINEAR)).astype(float)
H, W = bed.shape[:2]
zone = (mask[..., 0] + mask[..., 2]) > 24
zone = ndimage.binary_dilation(zone, iterations=3)

TOP, FOOT = 259, 497          # the sheet's last clean row above the fold; the footboard's top
X0, X1 = 70, 448              # the mattress's edges (where the sheet row turns dark)
out = bed.copy()
sheet = np.median(bed[252:259], axis=0)                     # the sheet across, under the pillow's shade
# smooth across (a single row copied down would leave streaks), not at the edges
sm = ndimage.uniform_filter1d(sheet[:, :3], 15, axis=0)
inner = np.arange(W)
w_in = np.clip(np.minimum(inner - (X0 + 4), (X1 - 4) - inner) / 10.0, 0, 1)[:, None]
sheet[:, :3] = sheet[:, :3] * (1 - w_in) + sm * w_in
# the footboard rail's top corners: arcs fitted to its visible outline below the duvet
# (x 25 at y 525, 19 at 540, 16 at 558): centre (88.6, 560), radius 72.6, mirrored about x 255
RAIL = (88.6, 560.0, 72.6)
for y in range(TOP, H):
    for_row = zone[y]
    if not for_row.any():
        continue
    if y < FOOT:
        k = (y - TOP) / (FOOT - TOP)
        lift = 1.0 + 0.035 * k - 0.07 * max(0.0, (y - (FOOT - 10)) / 10)   # a little lighter to the foot, a shade at the footboard
        row = sheet.copy()
        row[:, :3] = np.clip(row[:, :3] * lift, 0, 255)
        row[:, 3] = 0
        row[X0:X1 + 1, 3] = 255
        for i, a in enumerate((0.35, 0.7)):                   # soft edges
            row[X0 - 1 - i, :3] = sheet[X0, :3] * 0.8; row[X0 - 1 - i, 3] = 255 * a
            row[X1 + 1 + i, :3] = sheet[X1, :3] * 0.8; row[X1 + 1 + i, 3] = 255 * a
        out[y, for_row] = row[for_row]
    else:
        # the footboard's rail under the duvet's corners: its profile is the same along
        # x; its top corners are round
        cx, cy, r = RAIL
        xl = cx - np.sqrt(max(0.0, r * r - (y - cy) ** 2)) if y < cy else 16.0
        xr = 510.0 - xl
        xs = np.arange(W, dtype=float)
        cover = np.clip(np.minimum(xs - xl, xr - xs) + 0.5, 0, 1)
        src = bed[y, 256].copy()
        row = np.tile(src, (W, 1)); row[:, 3] = 255 * cover
        out[y, for_row] = row[for_row]

img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
# the page dresses the bed at 256 px (as the other bed pictures, q92)
img.resize((256, 364), Image.LANCZOS).save(os.path.join(ROOMS, 'bed-bare-256.webp'), 'WEBP', quality=92, alpha_quality=100, method=6)
print('bed-bare', img.size)
