#!/usr/bin/env python3
"""Statue dither art: card pictures and header bands from cut-out sculpture
photos, dithered to one ink on a plain ground.

The dithering is a port of lenxism/dither (MIT, github.com/lenxism/dither,
the Linear "dithered particles" look): the picture is blurred, put through
contrast / gamma / highlight compression and then Floyd-Steinberg
(serpentine) against a fixed threshold. Only the cut-out subject gets dots;
the ground stays plain. Everything is static: computed once here, served as
small lossless WebP files, nothing runs in the browser.

Dots are square and drawn at a whole-pixel size (DOT), so they stay crisp.

    python3 scripts/build-statue-dither.py CUT_DIR [--proof OUT.png]

CUT_DIR holds the transparent PNG cut-outs (swift scripts/cutout.swift).
Without --proof the files go to kalendars/data/skins (cards) and
kalendars/data/header-backgrounds/pool (header).
"""
import argparse
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CARD_OUT = ROOT / 'kalendars' / 'data' / 'skins'
HEADER_OUT = ROOT / 'kalendars' / 'data' / 'header-backgrounds' / 'pool'

# lenxism/dither defaults (particle-canvas.tsx): threshold 181, gamma 1.03,
# blur 3.75 px at the source size, error strength 1, serpentine.
THRESHOLD = 181
GAMMA = 1.03
ERROR = 1.0

# Grounds and inks: one ink on one plain ground each, no purple.
PALETTES = {
    'nakts':    ('#0b0d10', '#e9e4d8'),   # marble dots on near-black
    'papirs':   ('#ece6d8', '#16181c'),   # black ink on warm paper
    'kobalts':  ('#e8ecf2', '#1d3fae'),   # cobalt ink on cool white
    'terakota': ('#f1e4d4', '#a8452a'),   # terracotta ink on sand
    'menta':    ('#0a1a14', '#3ee0a0'),   # Minka mint on deep green
    'zelts':    ('#121010', '#e8b44a'),   # gold dots on black
    'navy':     ('#0a1230', '#7d96ff'),   # cobalt dots on deep navy
    'ogles':    ('#1a0e09', '#ff8a5c'),   # ember dots on dark brown
}


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def load_cutout(path):
    """The subject cropped to its outline, plus the sides where the photo
    itself cut it off (a bust's base, a head running out of frame)."""
    im = Image.open(path).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox() or (0, 0, *im.size)
    edge = 3
    cut = {'left': box[0] <= edge, 'top': box[1] <= edge,
           'right': box[2] >= im.width - edge, 'bottom': box[3] >= im.height - edge}
    return im.crop(box), cut


def place(cutout, gw, gh, height, cx, top, side):
    """Scale the cut-out to `height` x grid height and centre it at cx (0..1),
    top edge at `top`. Returns the placed RGBA layer and a fade layer (L).

    With side 'left' or 'right' a side the photo cut off is pushed against
    that canvas edge (mirroring the statue if needed). With side None the
    statue stays where it is put and a cut side dissolves instead: the dots
    thin out over the last part of the figure, so no straight cut line
    floats in the picture. The base always reaches the bottom edge."""
    cut, edges = cutout
    if (side == 'left' and edges['right'] and not edges['left']) or \
       (side == 'right' and edges['left'] and not edges['right']):
        cut = cut.transpose(Image.FLIP_LEFT_RIGHT)
        edges = dict(edges, left=edges['right'], right=edges['left'])
    s = height * gh / cut.height
    w, h = max(1, round(cut.width * s)), max(1, round(cut.height * s))
    small = cut.resize((w, h), Image.LANCZOS)
    x = round(cx * gw - w / 2)
    if side == 'left' and edges['left']:
        x = 0
    if side == 'right' and edges['right']:
        x = gw - w
    y = round(top * gh)
    if edges['bottom']:
        y = max(y, gh - h)
    fade = Image.new('L', (w, h), 255)
    span = max(1, round(w * .35))
    for name, at_canvas in (('left', x <= 0), ('right', x + w >= gw)):
        if not edges[name] or at_canvas:
            continue
        for i in range(span):
            v = round(255 * (i / span) ** 1.6)
            col = i if name == 'left' else w - 1 - i
            fade.paste(v, (col, 0, col + 1, h))
    layer = Image.new('RGBA', (gw, gh), (0, 0, 0, 0))
    layer.alpha_composite(small, (x, y))
    fades = Image.new('L', (gw, gh), 255)
    fades.paste(fade, (x, y))
    return layer, fades


def tone(layer, fades, blur, contrast, invert, highlights):
    """Grey levels (0..255) and a hard alpha mask, as processImage() does."""
    alpha = layer.getchannel('A')
    rgb = Image.new('RGB', layer.size, (0, 0, 0))
    rgb.paste(layer.convert('RGB'), mask=alpha)
    if blur > 0:
        rgb = rgb.filter(ImageFilter.GaussianBlur(blur))
        soft = alpha.filter(ImageFilter.GaussianBlur(blur))
    else:
        soft = alpha
    cf = (259 * (contrast + 255)) / (255 * (259 - contrast))
    grey, mask = [], []
    for (r, g, b), a, hard, f in zip(rgb.getdata(), soft.getdata(), alpha.getdata(), fades.getdata()):
        ua = a / 255
        luma = (0.299 * r + 0.587 * g + 0.114 * b) / ua if ua > 0.01 else 0
        if contrast:
            luma = cf * (luma - 128) + 128
        luma = 255 * max(0.0, luma / 255) ** (1 / GAMMA)
        if highlights > 0:
            n = luma / 255
            luma = 255 * (n if n < .5 else .5 + (n - .5) * (1 - highlights))
        luma = max(0, min(255, luma))
        ink = 255 - luma if invert else luma        # how much ink this spot wants
        grey.append(ink * f / 255)
        mask.append(hard >= 128)
    return grey, mask


def floyd_steinberg(grey, mask, w, h, threshold):
    err = [float(v) for v in grey]
    on = bytearray(w * h)
    for y in range(h):
        ltr = y % 2 == 0
        xs = range(w) if ltr else range(w - 1, -1, -1)
        step = 1 if ltr else -1
        for x in xs:
            i = y * w + x
            if not mask[i]:
                continue
            old = err[i]
            new = 255 if old > threshold else 0
            if new:
                on[i] = 1
            e = (old - new) * ERROR
            for nx, ny, wt in ((x + step, y, 7 / 16), (x - step, y + 1, 3 / 16),
                               (x, y + 1, 5 / 16), (x + step, y + 1, 1 / 16)):
                if 0 <= nx < w and ny < h:
                    j = ny * w + nx
                    if mask[j]:
                        err[j] += e * wt
    return on


def render(on, w, h, dot, palette):
    ground, ink = (hexrgb(c) for c in PALETTES[palette])
    im = Image.new('P', (w, h))
    im.putpalette(list(ground) + list(ink))
    im.putdata(on)
    return im.resize((w * dot, h * dot), Image.NEAREST).convert('RGB')


def dither(cut, gw, gh, dot, palette, height, cx, top, side, blur=.8, contrast=12,
           highlights=0, threshold=THRESHOLD):
    ground, ink = (hexrgb(c) for c in PALETTES[palette])
    # A light ink on a dark ground draws the marble's light; a dark ink on a
    # light ground draws its shadows.
    invert = sum(ink) < sum(ground)
    layer, fades = place(cut, gw, gh, height, cx, top, side)
    grey, mask = tone(layer, fades, blur, contrast, invert, highlights)
    return render(floyd_steinberg(grey, mask, gw, gh, threshold), gw, gh, dot, palette)


# Card: 480x270 like every other skin, 2 px dots on a 240x135 grid. Cards
# are close to square and the picture is drawn centre/cover, so only the
# middle ~55% of the width is sure to show: the statue stands there, a
# little left of centre, under the big shift number.
CARD = dict(gw=240, gh=135, dot=2)
# Header: 2400x432, 2 px dots. The head sits in the middle band so a
# wide monitor (header up to ~9:1) still shows the face.
HEADER = dict(gw=1200, gh=216, dot=2)

# id -> source cut-out, palette, tone tuning, card and header placement.
# `card_pal` overrides the palette on cards: the card faces darken a light
# ground, so cards always get a dark one; the header keeps light grounds
# for the day.
# (height x grid height, centre x, top). Bright white marble gets highlight
# compression so the light planes keep some texture instead of going solid.
STATUES = {
    'hadrians':  dict(src='s18', pal='kobalts',  card_pal='navy',  card=(1.15, .42, -.02), header=(1.25, .74, -.04)),
    'marks':     dict(src='s44', pal='terakota', card_pal='ogles', card=(1.10, .42, -.02), header=(1.25, .76, -.04)),
    'dovids':    dict(src='s38', pal='menta',    card=(1.15, .42, -.04), header=(1.25, .74, -.04)),
    'profils':   dict(src='s66', pal='zelts',    card=(1.15, .42, -.04), header=(1.25, .78, -.04)),
    'muza':      dict(src='s64', pal='papirs',   card_pal='nakts', card=(1.10, .42, -.02), header=(1.25, .76, -.04), threshold=150),
    'jauneklis': dict(src='s73', pal='nakts',    card=(1.15, .42, -.04), header=(1.25, .74, -.04), highlights=.45),
    'romietis':  dict(src='s75', pal='nakts',    card=(1.10, .42, -.02), header=(1.25, .76, -.04), highlights=.45),
    'madonna':   dict(src='s22', pal='nakts',    card=(1.15, .42, -.06), header=(1.25, .74, -.04), contrast=20),
}
TUNE = ('contrast', 'highlights', 'threshold', 'blur')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cut_dir')
    ap.add_argument('--proof')
    ap.add_argument('--only', nargs='*')
    a = ap.parse_args()
    cut_dir = Path(a.cut_dir)
    cards, bands = [], []
    for sid, st in STATUES.items():
        if a.only and sid not in a.only:
            continue
        cut = load_cutout(cut_dir / (st['src'] + '.png'))
        tune = {k: st[k] for k in TUNE if k in st}
        card_tune = {k: v for k, v in tune.items() if k != 'threshold' or 'card_pal' not in st}
        card = dither(cut, CARD['gw'], CARD['gh'], CARD['dot'], st.get('card_pal', st['pal']), *st['card'], None, **card_tune)
        band = dither(cut, HEADER['gw'], HEADER['gh'], HEADER['dot'], st['pal'], *st['header'], 'right', **tune)
        if a.proof:
            cards.append(card)
            bands.append(band)
            continue
        card.save(CARD_OUT / f'skin-statue-{sid}.webp', 'WEBP', lossless=True, method=6)
        band.save(HEADER_OUT / f'statue-{sid}.webp', 'WEBP', lossless=True, method=6)
        print('wrote', sid)
    if a.proof:
        cols = 3
        rows = (len(cards) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * 500, rows * 290 + len(bands) * 276 + 20), (30, 30, 30))
        for i, c in enumerate(cards):
            sheet.paste(c, ((i % cols) * 500 + 10, (i // cols) * 290 + 10))
        y = rows * 290 + 10
        for b in bands:
            sheet.paste(b.resize((1480, 266), Image.LANCZOS), (10, y))
            y += 276
        sheet.save(a.proof)
        print('proof', a.proof)


if __name__ == '__main__':
    main()
