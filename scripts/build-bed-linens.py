#!/usr/bin/env python3
"""Bedding for the Nakts beds: the linen of the classic bed (bed-neutral-512.webp)
as a picture of its own (pillow, sheet, turned-down fold and duvet; transparent
everywhere else). In the room it lies over the bed tinted in the sleeper's
colour, so the frame keeps the sleeper's colour and the linen has its own:
bold kids' prints and real fabrics, each set clearly different from the next.

Zones: a watershed on the bed's own shading with seeds in every part, so the
edges follow the render (no drawn rectangles). Prints: SVG tiles rasterised with
headless Chrome. Fabrics: ambientCG (CC0) 1K colour and normal maps, in their own
colours or recoloured. Everything keeps the bed's 3D shading.

    python3 scripts/build-bed-linens.py --fabrics DIR_WITH_AMBIENTCG_FOLDERS [ids...]

TILE_DIR=dir also saves each print's tile (scripts/blender/bed_accessories.py
uses them for the matching cushions). Needs numpy, scipy, scikit-image, Pillow.
"""
import argparse
import glob
import os
import random
import subprocess
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import filters, segmentation

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BED = os.path.join(ROOT, 'kalendars/assets/rooms/bed-neutral-512.webp')
OUT = os.path.join(ROOT, 'kalendars/assets/rooms/beds')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
W, H = 512, 728
FORESHORTEN = .8     # the duvet lies tilted away from the camera

# ── motifs (viewBox around 0,0, ~40 units) ──
SYM = {
    'heart': '<path d="M0 12C-14 2-18-6-12-12C-7-16-2-13 0-9C2-13 7-16 12-12C18-6 14 2 0 12Z"/>',
    'daisy': ''.join('<ellipse cx="0" cy="-11" rx="5.5" ry="10" fill="#fffdf6" transform="rotate(%d)"/>' % a for a in range(0, 360, 36))
             + '<circle r="6.5" fill="#f5c542"/><circle r="6.5" fill="none" stroke="#e0a92a" stroke-width="1.2"/>',
    'leaf': '<path d="M0 14C-9 4-7-10 0-15C7-10 9 4 0 14Z"/><path d="M0 13V-12" stroke="rgba(0,0,0,.18)" stroke-width="1.4"/>',
    'cloud': '<path d="M-20 8H20C27 8 27-4 20-5C21-14 11-17 6-11C2-19-11-18-12-8C-21-9-24 8-20 8Z" fill="#fffdf8"/>',
    'moon': '<path d="M4-13A13 13 0 1 0 4 13A10 10 0 1 1 4-13Z"/>',
    'star': '<path d="M0-12L3.5-4 12-3.5 5.5 2 7.5 11 0 6-7.5 11-5.5 2-12-3.5-3.5-4Z"/>',
    'twinkle': '<path d="M0-8C1-2 2-1 8 0C2 1 1 2 0 8C-1 2-2 1-8 0C-2-1-1-2 0-8Z"/>',
    'cherry': '<path d="M-7 4C-7-8 0-15 6-17M7 5C5-6 4-12 6-17" stroke="#4f7b3a" stroke-width="2" fill="none" stroke-linecap="round"/>'
              '<path d="M6-17C10-20 16-18 17-14C12-13 8-14 6-17Z" fill="#6fa148"/>'
              '<circle cx="-7" cy="8" r="7" fill="#d9383a"/><circle cx="7" cy="9" r="7" fill="#c92f31"/>'
              '<circle cx="-9" cy="6" r="2" fill="#ff8f86"/><circle cx="5" cy="7" r="2" fill="#ff8f86"/>',
    'flower': ''.join('<circle cx="0" cy="-6" r="5" transform="rotate(%d)"/>' % a for a in range(0, 360, 72)) + '<circle r="3.2" fill="#f7e7b4"/>',
    'balloon': '<path d="M0-22C12-22 16-10 12-2C9 4 4 8 2 10H-2C-4 8-9 4-12-2C-16-10-12-22 0-22Z" fill="#f08a4b"/>'
               '<path d="M0-22C5-22 6-10 4 0C3 5 1 9 1 10H-1C-1 9-3 5-4 0C-6-10-5-22 0-22Z" fill="#fbd98a"/>'
               '<path d="M-2 10L-4 16M2 10L4 16" stroke="#8a6a4a" stroke-width="1"/><rect x="-5" y="16" width="10" height="6" rx="1.5" fill="#b07a4a"/>',
    'plane': '<path d="M-18 0C-18-3 14-4 18-1C19 0 19 1 18 2C14 4-18 3-18 0Z" fill="#f4f7fb"/>'
             '<path d="M-2-1L-10-14H-5L6-1ZM-2 2L-10 15H-5L6 2Z" fill="#e3574b"/><path d="M-16-1L-20-8H-17L-12-1Z" fill="#e3574b"/>'
             '<circle cx="10" cy="0" r="1.6" fill="#6f9ccf"/><circle cx="5" cy="0" r="1.6" fill="#6f9ccf"/>',
    'mushroom': '<path d="M-5 4H5L4 16H-4Z" fill="#fbf1e2"/><path d="M-16 5C-16-9-8-15 0-15C8-15 16-9 16 5Z" fill="#d9573f"/>'
                '<circle cx="-7" cy="-5" r="2.6" fill="#fff4e8"/><circle cx="3" cy="-9" r="2.2" fill="#fff4e8"/><circle cx="9" cy="-2" r="2.4" fill="#fff4e8"/>',
    'dino': '<path d="M-22 10C-20 2-12-2-6-2C-4-10 2-16 10-16C16-16 20-12 20-8C20-4 16-4 12-5C10-2 10 4 12 10H6L4 4H-6L-8 10H-14L-14 6C-18 8-20 10-22 10Z" fill="#4f9a5a"/>'
            + ''.join('<path d="M%d %dL%d %dL%d %dZ" fill="#f08a4b"/>' % (x, y, x + 3, y - 6, x + 6, y) for x, y in ((-10, -2), (-4, -6), (2, -12)))
            + '<circle cx="13" cy="-11" r="1.6" fill="#1f2a1c"/>',
    'rainbow': ''.join('<path d="M%d 8A%d %d 0 0 1 %d 8" stroke="%s" stroke-width="4" fill="none"/>' % (-r, r, r, r, c)
                       for r, c in ((18, '#f26b5b'), (13.5, '#f7b733'), (9, '#62b87a'), (4.5, '#4a90d9'))),
    'catface': '<path d="M-14-6L-12-18L-4-11H4L12-18L14-6C16 6 8 13 0 13C-8 13-16 6-14-6Z" fill="#f4a261"/>'
               '<circle cx="-5" cy="0" r="1.8" fill="#2b2b2b"/><circle cx="5" cy="0" r="1.8" fill="#2b2b2b"/>'
               '<path d="M-2 4H2L0 6Z" fill="#e5737a"/><path d="M-12 4H-5M-12 7H-5M12 4H5M12 7H5" stroke="#7a5a44" stroke-width=".8"/>',
    'lemon': '<ellipse rx="13" ry="9" fill="#f7d74a" transform="rotate(-20)"/><path d="M8-10C12-14 16-14 18-12C15-9 11-9 8-10Z" fill="#7aa846"/>'
             '<ellipse cx="-3" cy="-2" rx="4" ry="2" fill="#fff3a8" transform="rotate(-20)"/>',
    'cross': '<path d="M-3-9H3V-3H9V3H3V9H-3V3H-9V-3H-3Z"/>',
    'dot': '<circle r="7"/>',
    'bone': '<rect x="-12" y="-3" width="24" height="6"/><circle cx="-13" cy="-3.5" r="4.5"/><circle cx="-13" cy="3.5" r="4.5"/>'
            '<circle cx="13" cy="-3.5" r="4.5"/><circle cx="13" cy="3.5" r="4.5"/>',
    'skull': '<path d="M0-16C-11-16-16-8-16 0C-16 6-12 9-9 10V15H9V10C12 9 16 6 16 0C16-8 11-16 0-16Z"/>'
             '<circle cx="-6" cy="-1" r="4.2" fill="#000" opacity=".72"/><circle cx="6" cy="-1" r="4.2" fill="#000" opacity=".72"/>'
             '<path d="M0 4L-2.4 8.5H2.4Z" fill="#000" opacity=".72"/><path d="M-5 12V15M0 12V15M5 12V15" stroke="#000" stroke-opacity=".5" stroke-width="1.2"/>',
    'spine': ''.join('<rect x="-7" y="%d" width="14" height="7" rx="3"/><rect x="-11" y="%d" width="22" height="2.4" rx="1.2" opacity=".8"/>' % (y, y + 2) for y in range(-20, 20, 10)),
    'ribs': '<path d="M0-18V18" stroke="{c}" stroke-width="3.5" stroke-linecap="round" fill="none"/>'
            + ''.join('<path d="M0 %dC-8 %d-16 %d-17 %d M0 %dC8 %d 16 %d 17 %d" stroke="{c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
                      % (y, y - 3, y, y + 8, y, y - 3, y, y + 8) for y in (-14, -7, 0, 7)),
    'trefoil': '<circle r="3.4"/><path d="M2.75 -4.76L8.00 -13.86A16.0 16.0 0 0 0 -8.00 -13.86L-2.75 -4.76A5.5 5.5 0 0 1 2.75 -4.76Z"/><path d="M-5.50 -0.00L-16.00 -0.00A16.0 16.0 0 0 0 -8.00 13.86L-2.75 4.76A5.5 5.5 0 0 1 -5.50 -0.00Z"/><path d="M2.75 4.76L8.00 13.86A16.0 16.0 0 0 0 16.00 0.00L5.50 0.00A5.5 5.5 0 0 1 2.75 4.76Z"/>',
    'ctring': '<circle r="13" fill="none" stroke="{c}" stroke-width="7"/><rect x="-22" y="4" width="44" height="4" rx="2"/>',
    'pulse': '<path d="M-24 0H-10L-6-10 0 12 5-16 9 0H24" stroke="{c}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>',
    'rocket': '<path d="M0-22C8-14 9-2 6 8H-6C-9-2-8-14 0-22Z" fill="#f4f6fb"/><circle cy="-6" r="4" fill="#4aa3df"/>'
              '<path d="M-6 0L-13 10H-6ZM6 0L13 10H6Z" fill="#f26b5b"/><path d="M-4 9Q0 22 4 9Z" fill="#f7a93b"/>',
    'planet': '<circle r="11" fill="#f7a93b"/><ellipse rx="20" ry="5" fill="none" stroke="#fde2cf" stroke-width="2.5" transform="rotate(-18)"/>'
              '<path d="M-8-6Q0-10 9-5" stroke="#e0782c" stroke-width="2" fill="none"/>',
    'globe': '<circle r="9" fill="#4aa3df"/><path d="M-6-3Q-2-7 2-4T6 2Q2 6-3 4Z" fill="#62b87a"/>',
    'comet': '<circle r="4.5" fill="#fff6d8"/><path d="M-3-3L-22-14M-3 0L-24-4M0 3L-18 8" stroke="#fff6d8" stroke-width="2" stroke-linecap="round" opacity=".7"/>',
    'fish': '<path d="M-14 0C-8-9 6-9 12 0C6 9-8 9-14 0ZM12 0L20-7V7Z"/><circle cx="-6" cy="-2" r="1.6" fill="#fff"/>',
    'bee': '<ellipse rx="11" ry="8" fill="#f7c948"/><path d="M-4-8V8M3-8V8" stroke="#2b2b2b" stroke-width="3"/>'
           '<ellipse cx="-3" cy="-11" rx="6" ry="4" fill="#fff" opacity=".9"/><ellipse cx="5" cy="-11" rx="6" ry="4" fill="#fff" opacity=".9"/>',
}


def solid(c):
    return '<rect width="300" height="300" fill="%s"/>' % c


def scatter(items, seed=1):
    """Deterministic scatter of (symbol, fill, scale, count) over the tile, wrapped."""
    rnd = random.Random(seed)
    out, spots = [], []
    for sym, fill, sc, n in items:
        for _ in range(n):
            for _try in range(60):
                x, y = rnd.uniform(0, 300), rnd.uniform(0, 300)
                if all(min(abs(x - a), 300 - abs(x - a)) ** 2 + min(abs(y - b), 300 - abs(y - b)) ** 2 > (20 * sc + 14) ** 2 for a, b in spots):
                    break
            spots.append((x, y))
            rot = rnd.uniform(-22, 22)
            for dx in (-300, 0, 300):
                for dy in (-300, 0, 300):
                    out.append('<g transform="translate(%.1f %.1f) rotate(%.0f) scale(%.2f)" fill="%s">%s</g>' % (x + dx, y + dy, rot, sc, fill, SYM[sym].replace('{c}', fill)))
    return ''.join(out)


def gingham(a, b, size=50, op=.5):
    return (solid(b)
            + ''.join('<rect x="%d" y="0" width="%d" height="300" fill="%s" opacity="%s"/>' % (x, size // 2, a, op) for x in range(0, 300, size))
            + ''.join('<rect x="0" y="%d" width="300" height="%d" fill="%s" opacity="%s"/>' % (y, size // 2, a, op) for y in range(0, 300, size)))


def stripes(colours, width):
    n = len(colours)
    return ''.join('<rect x="%d" y="0" width="%d" height="300" fill="%s"/>' % (x, width, colours[(x // width) % n]) for x in range(0, 300, width))


def dots(bg, fg, r, step):
    out = [solid(bg)]
    for j, y in enumerate(range(0, 300 + step, step)):
        for x in range(-step, 300 + step, step):
            out.append('<circle cx="%d" cy="%d" r="%d" fill="%s"/>' % (x + (step // 2 if j % 2 else 0), y, r, fg))
    return ''.join(out)


def chevron(a, b, h=50):
    out = [solid(b)]
    for y in range(-h, 300 + h, h):
        pts = ' '.join('%d,%d' % (x, y + (h // 2 if (x // 50) % 2 else 0)) for x in range(0, 301, 50))
        out.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="%d" stroke-linejoin="miter"/>' % (pts, a, h // 2 - 4))
    return ''.join(out)


def patchwork(colours, seed=5):
    rnd = random.Random(seed)
    out = []
    for y in range(0, 300, 75):
        for x in range(0, 300, 75):
            out.append('<rect x="%d" y="%d" width="75" height="75" fill="%s"/>' % (x, y, rnd.choice(colours)))
    out.append(''.join('<path d="M%d 0V300M0 %dH300" stroke="#fffaf0" stroke-width="2" stroke-dasharray="6 5" opacity=".8"/>' % (v, v) for v in range(0, 300, 75)))
    return ''.join(out)


GLOW = ('<defs><filter id="glow" x="-50%%" y="-50%%" width="200%%" height="200%%"><feGaussianBlur stdDeviation="%s" result="b"/>'
        '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')


def glow(body, blur=2.6):
    return GLOW % blur + '<g filter="url(#glow)">%s</g>' % body


def neon_lines(colours, h=60):
    out = []
    for i, y in enumerate(range(0, 300, h)):
        c = colours[i % len(colours)]
        pts = ' '.join('%d,%d' % (x, y + (h // 3 if (x // 50) % 2 else 0)) for x in range(-50, 351, 50))
        out.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="3.2" stroke-linejoin="round"/>' % (pts, c))
    return out


def foil(stops, angle=35, bands=3):
    st = ''.join('<stop offset="%.3f" stop-color="%s"/>' % (i / (len(stops) - 1), c) for i, c in enumerate(stops))
    g = ('<defs><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="%d" y2="0" spreadMethod="reflect" gradientTransform="rotate(%d 150 150)">%s</linearGradient></defs>'
         % (300 // bands, angle, st))
    return g + '<rect width="300" height="300" fill="url(#f)"/>'


def nebula(bg, blobs, seed=3):
    rnd = random.Random(seed)
    out = ['<defs><filter id="neb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter></defs>', solid(bg)]
    for c, r, n in blobs:
        for _ in range(n):
            x, y = rnd.uniform(0, 300), rnd.uniform(0, 300)
            for dx in (-300, 0, 300):
                for dy in (-300, 0, 300):
                    out.append('<circle cx="%.0f" cy="%.0f" r="%d" fill="%s" opacity=".55" filter="url(#neb)"/>' % (x + dx, y + dy, r, c))
    for _ in range(70):
        x, y, r = rnd.uniform(0, 300), rnd.uniform(0, 300), rnd.choice((.6, .8, 1, 1.4, 2))
        out.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff" opacity="%.2f"/>' % (x, y, r, rnd.uniform(.5, 1)))
    return ''.join(out)


def buffalo(a, b, size=100):
    return gingham(a, b, size, .62)


# Each set: id, label, kind (p printed, f fabric), duvet, fold, sheet, pillow, options.
# A part is '#rrggbb', ('svg', body, tile px) or ('tex', ambientCG asset, colour or None, tile px).
# opts: weave=(asset, strength) adds a fabric's grain and relief to every part.
SETS = [
    ('hearts', 'Sirsniņas', 'p', ('svg', gingham('#f07f9c', '#fde3ea', 60) + scatter([('heart', '#d6336c', 2.1, 5)], 3), 300), '#ffffff', '#fff1f4', '#f6a5b9', {}),
    ('daisy', 'Margrietiņas', 'p', ('svg', solid('#6f9e6a') + scatter([('daisy', '#fff', 2.2, 5), ('leaf', '#4f7f4a', 1.3, 4)], 5), 300), '#fffdf3', '#f3f7ee', '#f7d154', {}),
    ('sky', 'Sapņu debesis', 'p', ('svg', solid('#5f95e6') + scatter([('cloud', '#fff', 2.4, 4), ('twinkle', '#fff4c2', 1.1, 5)], 7), 300), '#fff3c4', '#eef3ff', '#ffffff', {}),
    ('cherry', 'Ķirši', 'p', ('svg', solid('#fff3d6') + scatter([('cherry', '#d9383a', 2.1, 5)], 11), 300), '#d9383a', '#fffaf0', ('svg', gingham('#d9383a', '#ffffff', 40, .6), 220), {}),
    ('floral', 'Ziedi', 'p', ('svg', solid('#f07b62') + scatter([('flower', '#fff3ea', 2.2, 5), ('flower', '#ffd36b', 1.6, 4), ('leaf', '#7fae7a', 1.1, 5)], 13), 300), '#fff6ef', '#fff6ef', '#ffd36b', {}),
    ('starlight', 'Zvaigznes', 'p', ('svg', solid('#243469') + scatter([('star', '#ffd964', 1.6, 7), ('twinkle', '#dfe6ff', 1.0, 7), ('moon', '#ffd964', 1.8, 2)], 17), 300), '#dfe6ff', '#e8ecfa', '#ffd964', {}),
    ('balloons', 'Gaisa baloni', 'p', ('svg', solid('#8fd6bf') + scatter([('balloon', '#f08a4b', 2.3, 4), ('cloud', '#fff', 1.6, 3)], 19), 300), '#ffffff', '#f2fbf7', '#f08a4b', {}),
    ('planes', 'Lidmašīnas', 'p', ('svg', stripes(['#a9cdf0', '#e7f2fc'], 30) + scatter([('plane', '#fff', 2.3, 4)], 23), 300), '#ffffff', '#f4f9fe', '#e3574b', {}),
    ('bluecheck', 'Zilās rūtiņas', 'p', ('svg', gingham('#2f63b3', '#eef3fb', 75, .55), 300), '#ffffff', '#f5f8fb', '#2f63b3', {}),
    ('mushrooms', 'Sēnes', 'p', ('svg', solid('#8c9a5b') + scatter([('mushroom', '#d9573f', 2.2, 5), ('leaf', '#dfe3b8', 1.1, 4)], 29), 300), '#f7f0e6', '#f7f0e6', '#d9573f', {}),
    ('dinos', 'Dinozauri', 'p', ('svg', solid('#f6c64f') + scatter([('dino', '#4f9a5a', 2.3, 4), ('leaf', '#4f9a5a', 1.2, 4)], 31), 300), '#ffffff', '#fffbee', '#4f9a5a', {}),
    ('rainbows', 'Varavīksnes', 'p', ('svg', solid('#fde2cf') + scatter([('rainbow', '#fff', 2.6, 4), ('cloud', '#fff', 1.4, 3)], 37), 300), '#4a90d9', '#fff7f0', '#f26b5b', {}),
    ('cats', 'Kaķīši', 'p', ('svg', solid('#56657a') + scatter([('catface', '#f4a261', 2.2, 5), ('heart', '#f3a0ae', 1.0, 5)], 41), 300), '#e9e6e2', '#eef0f3', '#f4a261', {}),
    ('lemons', 'Citroni', 'p', ('svg', solid('#3d86c6') + scatter([('lemon', '#f7d74a', 2.2, 5), ('leaf', '#8ac26a', 1.1, 5)], 43), 300), '#ffffff', '#f4f9fe', '#f7d74a', {}),
    ('ward', 'Nodaļas', 'p', ('svg', solid('#1f9d8f') + scatter([('cross', '#ffffff', 2.0, 6), ('heart', '#ffb3bf', 1.2, 4)], 47), 300), '#c9efe8', '#effaf8', '#ffffff', {}),
    ('polka', 'Punktiņi', 'p', ('svg', dots('#e04848', '#fff6ee', 11, 50), 300), '#ffffff', '#fff6f3', ('svg', dots('#ffffff', '#e04848', 8, 36), 200), {}),
    ('chevron', 'Zigzagi', 'p', ('svg', chevron('#f28a3c', '#fff4e6', 50), 300), '#f28a3c', '#fff8ef', '#fff4e6', {}),
    ('patchwork', 'Lāpītā', 'p', ('svg', patchwork(['#f26b5b', '#f7b733', '#62b87a', '#4a90d9', '#f3a0ae', '#8fd6bf', '#fff1d6']), 300), '#fffaf0', '#fffaf0', '#f7b733', {}),
    ('colorstripe', 'Krāsu svītras', 'p', ('svg', stripes(['#f26b5b', '#f7a93b', '#f6d44e', '#6cc07f', '#4aa3df', '#2f63b3'], 50), 300), '#ffffff', '#ffffff', '#ffffff', {}),
    ('fish', 'Zivtiņas', 'p', ('svg', solid('#bfe8f2') + scatter([('fish', '#f08a4b', 2.0, 4), ('fish', '#2f7fb8', 1.7, 3), ('dot', '#ffffff', .6, 6)], 53), 300), '#2f7fb8', '#f2fbfd', '#f08a4b', {}),
    ('bees', 'Bitītes', 'p', ('svg', solid('#fff0b8') + scatter([('bee', '#f7c948', 2.2, 5), ('flower', '#ffffff', 1.3, 4)], 59), 300), '#3a3a3a', '#fffbea', '#f7c948', {}),
    # dark, neon, shiny, space, radiology (kind x)
    ('midnight', 'Melns satīns', 'x', '#1b1d24', '#2a2d36', '#23252d', '#2a2d36', {'gloss': 1.0}),
    ('winesatin', 'Vīna satīns', 'x', '#7a1f35', '#f3e6e8', '#f7eef0', '#9a2a45', {'gloss': 1.0}),
    ('emerald', 'Smaragda samts', 'x', ('tex', 'Carpet016', '#0f6b57', 110), '#e9e2d0', '#efe9da', ('tex', 'Carpet016', '#138a70', 100), {'gloss': .55}),
    ('gold', 'Zelta folija', 'x', ('svg', foil(['#8a5a14', '#f6d77a', '#b8862b', '#fff1b8', '#9a6a1c'], 30, 3), 760), '#fff7df', '#fffaf0', ('svg', foil(['#b8862b', '#fff1b8', '#8a5a14'], 30, 2), 420), {'gloss': 1.0}),
    ('silver', 'Sudraba folija', 'x', ('svg', foil(['#6f7680', '#eef2f6', '#9aa3ad', '#ffffff', '#7d858f'], 30, 3), 760), '#eef1f4', '#f4f6f8', ('svg', foil(['#9aa3ad', '#ffffff', '#6f7680'], 30, 2), 420), {'gloss': 1.0}),
    ('holo', 'Hologramma', 'x', ('svg', foil(['#8ff0e6', '#c8f7b0', '#fff2a8', '#ffc9a8', '#ffb3cf', '#9fe3ff', '#8ff0e6'], 40, 2), 760), '#ffffff', '#f6fbff', ('svg', foil(['#ffb3cf', '#9fe3ff', '#fff2a8'], 40, 2), 420), {'gloss': .8}),
    ('neon', 'Neons', 'x', ('svg', solid('#0b0d14') + glow(''.join(neon_lines(['#27f3ff', '#ff3fa4', '#b6ff3b']))), 300), '#15181f', '#101218', ('svg', solid('#0b0d14') + glow('<rect x="30" y="30" width="240" height="240" rx="40" fill="none" stroke="#ff3fa4" stroke-width="7"/>'), 220), {'gloss': .5}),
    ('neonhearts', 'Neona sirdis', 'x', ('svg', solid('#0d0b12') + glow(scatter([('heart', '#ff3fa4', 2.0, 4), ('star', '#27f3ff', 1.4, 4)], 61), 2.4), 300), '#1a1720', '#141218', '#ff3fa4', {'gloss': .5}),
    ('glow', 'Spīd tumsā', 'x', ('svg', solid('#101a2e') + glow(scatter([('star', '#c6ff6b', 1.5, 7), ('moon', '#c6ff6b', 1.9, 2), ('twinkle', '#eaffc4', 1.0, 6)], 67), 3), 300), '#1a2740', '#16223a', '#c6ff6b', {}),
    ('space', 'Kosmoss', 'x', ('svg', nebula('#0a1024', [('#1fb5b0', 70, 3), ('#ff5d8f', 60, 2), ('#f7a93b', 45, 2), ('#2f63d3', 80, 2)], 71), 300), '#0f1730', '#121a33', ('svg', nebula('#0a1024', [('#ff5d8f', 60, 2), ('#1fb5b0', 60, 2)], 73), 220), {'gloss': .35}),
    ('planets', 'Planētas', 'x', ('svg', solid('#14204a') + scatter([('planet', '#f7a93b', 2.0, 3), ('rocket', '#fff', 2.0, 2), ('globe', '#4aa3df', 1.8, 2), ('comet', '#fff', 1.4, 2), ('twinkle', '#fff6d8', .9, 7)], 79), 300), '#f7a93b', '#e8ecfa', '#f7a93b', {}),
    ('xray', 'Rentgens', 'x', ('svg', solid('#08121f') + glow(scatter([('skull', '#e8f6ff', 1.9, 2), ('bone', '#cfeaff', 1.9, 3), ('ribs', '#cfeaff', 1.9, 2), ('spine', '#cfeaff', 1.7, 2)], 83), 2.2), 300), '#0f1b2c', '#0c1726', ('svg', solid('#08121f') + glow(scatter([('bone', '#e8f6ff', 2.0, 3)], 89), 2.2), 220), {'gloss': .4}),
    ('radiology', 'Radioloģija', 'x', ('svg', solid('#d8eef6') + scatter([('ctring', '#1f5f8b', 1.6, 3), ('trefoil', '#f2b82e', 1.4, 3), ('bone', '#1f5f8b', 1.5, 3), ('pulse', '#e04848', 1.4, 2), ('skull', '#1f5f8b', 1.3, 2)], 97), 300), '#1f5f8b', '#f2f9fc', '#f2b82e', {}),
    # fabrics
    ('knit', 'Adījums', 'f', ('tex', 'Fabric016', None, 150), '#f3e9e1', '#fbf6f2', ('tex', 'Fabric016', None, 110), {}),
    ('quilted', 'Stepēta', 'f', ('tex', 'Fabric008', '#8fae8b', 230), '#f6f1e6', '#f6f1e6', ('tex', 'Fabric008', '#b9d0b5', 170), {'relief': 2.2}),
    ('waffle', 'Vafeļu', 'f', ('tex', 'Fabric048', '#7fb8e6', 150), '#ffffff', '#f3f8fc', ('tex', 'Fabric048', '#ffffff', 120), {}),
    ('tartan', 'Tartāns', 'f', ('tex', 'Fabric054', None, 300), '#f3eadf', '#f7f1ea', ('tex', 'Fabric054', None, 200), {}),
    ('gingham', 'Rūtiņas', 'f', ('svg', gingham('#2f8f57', '#f4faf5', 60, .55), 300), '#ffffff', '#f4faf5', '#2f8f57', {'weave': ('Fabric036', .8)}),
    ('stripes', 'Svītras', 'f', ('tex', 'Fabric071', None, 260), '#ffffff', '#f4f7fb', '#1f2f5c', {}),
    ('linen', 'Lins', 'f', ('tex', 'Fabric036', '#c96f4a', 170), '#f4e6dc', '#f7ede6', ('tex', 'Fabric036', '#e3a383', 130), {}),
    ('jersey', 'Trikotāža', 'f', ('tex', 'Fabric034', '#9aa3ad', 170), '#e9edf1', '#eef1f4', ('tex', 'Fabric034', '#c9d0d7', 130), {}),
    ('denim', 'Džinss', 'f', ('tex', 'Fabric077', None, 150), '#f1ede4', '#f1ede4', ('tex', 'Fabric077', '#8fb0d6', 120), {}),
    ('plush', 'Plīšs', 'f', ('tex', 'Carpet016', '#f19db0', 120), '#fff1f4', '#fff1f4', ('tex', 'Carpet016', '#ffffff', 100), {}),
    ('wool', 'Vilna', 'f', ('tex', 'Fabric031', '#454a55', 140), '#efe6d6', '#f3ece0', ('tex', 'Fabric031', '#efe6d6', 110), {}),
    ('flannel', 'Flanelis', 'f', ('tex', 'Fabric080', None, 300), '#ffffff', '#fbf7f2', ('tex', 'Fabric080', None, 200), {}),
    ('buffalo', 'Lielās rūtis', 'f', ('svg', buffalo('#1d2a24', '#2e7d4f', 120), 300), '#f3eadf', '#f7f1ea', '#2e7d4f', {'weave': ('Fabric031', 1.0)}),
    ('mustard', 'Sinepju', 'f', ('tex', 'Fabric039', '#e0a526', 150), '#ffffff', '#fffaf0', ('tex', 'Fabric039', '#fff1c8', 120), {}),
]


# ── zones ──
def zones():
    """Soft masks (0..1, 512 x 728) of pillow, sheet, fold and duvet, from a
    watershed on the bed's shading at 2x, averaged back down (anti-aliased)."""
    S = 2
    big = Image.open(BED).convert('RGBA').resize((W * S, H * S), Image.LANCZOS)
    a = np.asarray(big).astype(float)
    lum = ndi.gaussian_filter(a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722, 1.0)
    grad = filters.sobel(lum)
    mk = np.zeros(lum.shape, int)
    yy, xx = np.ogrid[:lum.shape[0], :lum.shape[1]]

    def dot(lbl, x, y, r):
        mk[((xx - x * S) ** 2 + (yy - y * S) ** 2) <= (r * S) ** 2] = lbl
    BG, FRAME, PIL, SHEET, FOLD, DUV = 1, 2, 3, 4, 5, 6
    mk[a[..., 3] < 20] = BG
    for p in [(256, 30), (60, 120), (452, 120), (256, 560), (256, 610), (30, 650), (482, 650), (256, 515), (30, 560), (482, 560), (40, 690), (472, 690)]:
        dot(FRAME, *p, 6)
    for p in [(256, 140), (180, 120), (330, 120), (200, 190), (320, 190)]:
        dot(PIL, *p, 8)
    for p in [(92, 225), (425, 225), (256, 248), (150, 250), (360, 250)]:
        dot(SHEET, *p, 4)
    for p in [(256, 295), (90, 295), (420, 295), (160, 300), (350, 300)]:
        dot(FOLD, *p, 6)
    for p in [(256, 420), (80, 420), (440, 420), (160, 470), (360, 470), (256, 360)]:
        dot(DUV, *p, 8)
    lab = segmentation.watershed(grad, mk)
    rows = np.arange(lab.shape[0])[:, None] / S
    lab[(lab == FOLD) & (rows > 335)] = DUV      # the duvet's sides, hanging down
    lab[(lab == SHEET) & (rows > 500)] = FRAME   # a sliver under the footboard

    # Soft, smooth edges: each part blurred a little, the parts share every
    # inner seam (weights sum to 1), the outline is the blurred union.
    def down(m):
        return m.reshape(H, S, W, S).mean(axis=(1, 3))
    parts = {k: ndi.gaussian_filter((lab == v).astype(float), 1.4) for k, v in (('pillow', PIL), ('sheet', SHEET), ('fold', FOLD), ('duvet', DUV))}
    total = sum(parts.values())
    union = np.clip(ndi.gaussian_filter(np.isin(lab, (PIL, SHEET, FOLD, DUV)).astype(float), .9), 0, 1)
    z = {k: down(np.where(total > 1e-4, m / np.maximum(total, 1e-4), 0) * union) for k, m in parts.items()}
    return z


# ── parts ──
def render_tile(svg_body, px, tmp, name):
    T = 600
    html = ('<!doctype html><html><body style="margin:0;background:transparent">'
            '<svg width="%d" height="%d" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">%s</svg></body></html>' % (T, T, svg_body))
    page = os.path.join(tmp, name + '.html')
    shot = os.path.join(tmp, name + '.png')
    with open(page, 'w') as f:
        f.write(html)
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
                    '--window-size=%d,%d' % (T, T), '--screenshot=' + shot, 'file://' + page], check=True, capture_output=True)
    tile = Image.open(shot).convert('RGB').crop((0, 0, T, T))
    if os.environ.get('TILE_DIR') and name.endswith('-duvet'):
        os.makedirs(os.environ['TILE_DIR'], exist_ok=True)
        tile.save(os.path.join(os.environ['TILE_DIR'], name[:-6] + '.png'))
    return tile.resize((px, max(1, round(px * FORESHORTEN))), Image.LANCZOS)


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)


def tiled(img, box):
    t = np.asarray(img).astype(float)
    reps = (box[0] // t.shape[0] + 1, box[1] // t.shape[1] + 1) + (1,) * (t.ndim - 2)
    return np.tile(t, reps)[:box[0], :box[1]]


def texture(fab_dir, asset, colour, px):
    """Colour (h, w, 3) and relief (h, w, around 1) of an ambientCG fabric."""
    col = Image.open(glob.glob(os.path.join(fab_dir, asset, '*_Color.jpg'))[0]).convert('RGB')
    nrm = Image.open(glob.glob(os.path.join(fab_dir, asset, '*_NormalGL.jpg'))[0]).convert('RGB')
    size = (px, max(1, round(px * FORESHORTEN)))
    c = tiled(col.resize(size, Image.LANCZOS), (H, W))
    n = tiled(nrm.resize(size, Image.LANCZOS), (H, W))
    relief = 1 + ((255 - n[..., 0]) + n[..., 1] - 255) / 255 * .5     # lit from the top left
    if colour is not None:
        l = c @ np.array([.2126, .7152, .0722])
        l = l / max(1, np.percentile(l, 60))
        c = hexrgb(colour)[None, None, :] * np.clip(l, .55, 1.35)[..., None]
    return c, relief


def part_colour(spec, fab_dir, tmp, name):
    """(h, w, 3) colour and (h, w) relief for one part of a set."""
    if isinstance(spec, str):
        return np.broadcast_to(hexrgb(spec), (H, W, 3)).copy(), np.ones((H, W))
    if spec[0] == 'svg':
        return tiled(render_tile(spec[1], spec[2], tmp, name), (H, W)), np.ones((H, W))
    return texture(fab_dir, spec[1], spec[2], spec[3])


def weave(fab_dir, asset, k):
    c, relief = texture(fab_dir, asset, None, 160)
    l = c @ np.array([.2126, .7152, .0722])
    l = l / max(1, l.mean())
    return 1 + (l - 1) * .5 * k, 1 + (relief - 1) * k


def build(fab_dir, only):
    bed = np.asarray(Image.open(BED).convert('RGBA')).astype(float)
    lum = bed[..., :3] @ np.array([.2126, .7152, .0722])
    z = zones()
    refs = {k: np.median(lum[m > .9]) for k, m in z.items()}
    alpha_all = np.clip(sum(z.values()), 0, 1)
    tmp = tempfile.mkdtemp()
    # The zones as one picture for the page's own "like the card" linen:
    # R duvet, G pillow, B fold; A the whole linen (the rest of it is the sheet).
    mask = np.dstack([z['duvet'], z['pillow'], z['fold'], alpha_all * bed[..., 3] / 255]) * 255
    mimg = Image.fromarray(np.clip(mask, 0, 255).astype(np.uint8), 'RGBA').resize((256, 364), Image.LANCZOS)
    mimg.save(os.path.join(OUT, 'linen-mask-256.webp'), 'WEBP', lossless=True)
    print('refs (256 px lum of each zone):', {k: round(float(v), 1) for k, v in refs.items()})
    frames = [np.array(c, float) for c in ((239, 200, 163), (120, 170, 200), (150, 110, 90), (200, 200, 205))]
    board = Image.new('RGBA', (len(SETS) * 110 + 20, 4 * 160 + 20), (20, 24, 32, 255))
    for i, (sid, label, kind, duvet, fold, sheet, pillow, opts) in enumerate(SETS):
        if only and sid not in only:
            continue
        out = np.zeros((H, W, 3))
        wl, wr = weave(fab_dir, *opts['weave']) if opts.get('weave') else (np.ones((H, W)), np.ones((H, W)))
        for zone, spec in (('sheet', sheet), ('fold', fold), ('duvet', duvet), ('pillow', pillow)):
            col, relief = part_colour(spec, fab_dir, tmp, '%s-%s' % (sid, zone))
            k = opts.get('relief', 1.0) if not isinstance(spec, str) else 0
            relief = 1 + (relief - 1) * k
            s = (lum / refs[zone])[..., None]
            g = opts.get('gloss', 0)
            shaded = np.where(s <= 1, col * s ** (1 + 1.4 * g), col + (255 - col) * np.clip((s - 1) * 1.6 * (1 + 2 * g), 0, 1))
            if g:   # satin, foil: a bright sheen along the lit folds
                shaded = shaded + (np.clip((s - .93) / .2, 0, 1) ** 2 * 150 * g)
            shaded = shaded * (relief * wr * wl)[..., None]
            m = z[zone][..., None]
            out = out * (1 - m) + shaded * m
        a = alpha_all * bed[..., 3] / 255
        rgba = np.dstack([np.clip(out, 0, 255), a * 255]).astype(np.uint8)
        img = Image.fromarray(rgba, 'RGBA')
        img.resize((256, 364), Image.LANCZOS).save(os.path.join(OUT, 'linen-%s-256.webp' % sid), 'WEBP', quality=94 if kind == 'x' else 86, method=6)
        # Proof: the set over beds tinted in a few sleepers' colours.
        for j, fc in enumerate(frames):
            l3 = (lum / 255)[..., None]
            ch = 64 + fc * .68
            tint = np.where(l3 < .65, ch * l3 / .65, ch + (255 - ch) * (l3 - .65) / .35)
            base = Image.fromarray(np.dstack([np.clip(tint, 0, 255), bed[..., 3]]).astype(np.uint8), 'RGBA')
            base.alpha_composite(img)
            board.alpha_composite(base.resize((100, 142), Image.LANCZOS), (20 + i * 110, 20 + j * 160))
        print('linen', sid, label)
    board.convert('RGB').save(os.path.join(tmp, 'linens.png'))
    print('board', os.path.join(tmp, 'linens.png'))


def export_textures(fab_dir, only):
    """Each set's duvet cloth, flat, one pattern period square (linen-tex-<id>.webp),
    and the period in px of the 512 px bed (linen-tex.json): the page lays it on the
    simulated duvet (scripts/blender/nakts_duvet.py) by its UV map."""
    import json
    tmp = tempfile.mkdtemp()
    info = {}
    for sid, label, kind, duvet, fold, sheet, pillow, opts in SETS:
        if only and sid not in only:
            continue
        if isinstance(duvet, str):
            img = Image.new('RGB', (64, 64), tuple(int(v) for v in hexrgb(duvet))); period = 128
        elif duvet[0] == 'svg':
            period = duvet[2]
            html_tile = render_tile(duvet[1], 600, tmp, sid + '-flat')      # square: 600 px for one period
            img = html_tile.resize((600, 600), Image.LANCZOS) if html_tile.size != (600, 600) else html_tile
        else:
            period = duvet[3]
            col = Image.open(glob.glob(os.path.join(fab_dir, duvet[1], '*_Color.jpg'))[0]).convert('RGB').resize((256, 256), Image.LANCZOS)
            nrm = Image.open(glob.glob(os.path.join(fab_dir, duvet[1], '*_NormalGL.jpg'))[0]).convert('RGB').resize((256, 256), Image.LANCZOS)
            c = np.asarray(col).astype(float); n = np.asarray(nrm).astype(float)
            relief = 1 + ((255 - n[..., 0]) + n[..., 1] - 255) / 255 * .5 * opts.get('relief', 1.0)
            if duvet[2] is not None:
                l = c @ np.array([.2126, .7152, .0722]); l = l / max(1, np.percentile(l, 60))
                c = hexrgb(duvet[2])[None, None, :] * np.clip(l, .55, 1.35)[..., None]
            img = Image.fromarray(np.clip(c * relief[..., None], 0, 255).astype(np.uint8))
        if opts.get('weave'):
            wl, wr = weave(fab_dir, *opts['weave'])
            a = np.asarray(img.convert('RGB').resize((256, 256), Image.LANCZOS)).astype(float)
            k = (wl * wr)[:256, :256]
            img = Image.fromarray(np.clip(a * k[..., None], 0, 255).astype(np.uint8))
        img.convert('RGB').resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, 'linen-tex-%s.webp' % sid), 'WEBP', quality=88, method=6)
        info[sid] = period
        print('texture', sid, period)
    path = os.path.join(OUT, 'linen-tex.json')
    old = json.load(open(path)) if os.path.exists(path) else {}
    old.update(info)
    json.dump(old, open(path, 'w'), indent=0)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--fabrics', required=True)
    ap.add_argument('--textures', action='store_true', help='only the flat duvet textures')
    ap.add_argument('only', nargs='*')
    args = ap.parse_args()
    if args.textures:
        export_textures(args.fabrics, set(args.only))
    else:
        build(args.fabrics, set(args.only))
