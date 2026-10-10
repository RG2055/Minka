#!/usr/bin/env python3
"""Dither art for cards and the header: whole photographs (temples, statues,
pyramids) turned into one-ink prints, in the "dither monumentalism" look.

What makes it read as print and not as noise:
  1. tone first: the grey picture is stretched between its 2nd and 98th
     percentile, given a gamma and an unsharp mask, so shadows go solid,
     highlights go clean and edges stay sharp;
  2. then one of a few patterns: Atkinson (the classic Mac dither: clean
     whites and blacks), Floyd-Steinberg (fine grain), Bayer 8x8 (ordered,
     crisp) or a 45 degree line screen (bitmap poster look);
  3. one ink on one plain paper, square dots drawn at a whole-pixel size.
Optionally the ink fades out towards one side, so the header text sits on
plain paper. Floyd-Steinberg and the lenxism/dither tone controls follow
github.com/lenxism/dither (MIT). Everything is computed here once; the app
gets small static lossless WebP files.

    python3 scripts/build-dither-art.py SRC_DIR [--proof OUT.png] [--only ID ...]
"""
import argparse
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
CARD_OUT = ROOT / 'kalendars' / 'data' / 'skins'
HEADER_OUT = ROOT / 'kalendars' / 'data' / 'header-backgrounds' / 'pool'

# paper, ink (no purple anywhere)
STYLES = {
    'kobalts': ('#d6e1ff', '#1730b8'),   # cobalt print on pale blue paper
    'nakts':   ('#0a0a0b', '#ece8dc'),   # bone ink on black
    'papirs':  ('#efe9dc', '#121212'),   # black ink on warm paper
    'ciana':   ('#05080c', '#22a6ff'),   # electric blue on black
    'menta':   ('#a6f0cc', '#0d0f0e'),   # black on mint (bitmap poster)
    'ogles':   ('#0c0806', '#ff7a3d'),   # ember on black
    'zelts':   ('#0d0c0a', '#f0be52'),   # gold on black
    'smilts':  ('#f2e3c6', '#7a3418'),   # burnt sienna on sand
    'tinte':   ('#e3f2ff', '#0b5cbf'),   # blue print on sky white
    'persiks': ('#ffe8d6', '#c4410f'),   # orange ink on peach
    'olivs':   ('#e8edd8', '#2c4a1c'),   # forest ink on pale olive
}
# Dark papers only for photos with a dark ground (a bright sky on a dark
# paper turns into one flat block of ink); sky scenes get a light paper.

BAYER8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
          12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
          3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
          15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21]


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def frame(src, w, h, fx, fy, zoom):
    """Crop the photo to w:h around the focal point (fractions), `zoom` > 1
    tightens the crop, then resize to the dot grid."""
    im = ImageOps.exif_transpose(Image.open(src)).convert('L')
    target = w / h
    cw, ch = (im.width, im.width / target) if im.width / im.height < target else (im.height * target, im.height)
    cw, ch = cw / zoom, ch / zoom
    x = min(max(0, im.width * fx - cw / 2), im.width - cw)
    y = min(max(0, im.height * fy - ch / 2), im.height - ch)
    return im.resize((w, h), Image.LANCZOS, box=(x, y, x + cw, y + ch))


def tone(im, gamma, lo, hi, sharpen):
    """Levels between percentiles lo..hi, gamma, unsharp mask: 0..255 floats."""
    hist = im.histogram()
    total = sum(hist)

    def pct(p):
        acc = 0
        for v, n in enumerate(hist):
            acc += n
            if acc >= total * p:
                return v
        return 255
    a, b = pct(lo), pct(hi)
    b = max(b, a + 1)
    lut = [max(0, min(255, round(255 * ((max(0, min(1, (v - a) / (b - a)))) ** (1 / gamma))))) for v in range(256)]
    im = im.point(lut)
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=sharpen, percent=160, threshold=1))
    return list(im.getdata())


def diffuse(vals, w, h, kernel):
    err = [float(v) for v in vals]
    out = bytearray(w * h)
    for y in range(h):
        ltr = y % 2 == 0
        step = 1 if ltr else -1
        for x in (range(w) if ltr else range(w - 1, -1, -1)):
            i = y * w + x
            old = err[i]
            new = 255 if old >= 128 else 0
            out[i] = 1 if new else 0
            e = old - new
            for dx, dy, wt in kernel:
                nx, ny = x + dx * step, y + dy
                if 0 <= nx < w and ny < h:
                    err[ny * w + nx] += e * wt
    return out


FS = ((1, 0, 7 / 16), (-1, 1, 3 / 16), (0, 1, 5 / 16), (1, 1, 1 / 16))
# Atkinson passes on only 6/8 of the error: highlights and shadows stay clean.
ATKINSON = ((1, 0, 1 / 8), (2, 0, 1 / 8), (-1, 1, 1 / 8), (0, 1, 1 / 8), (1, 1, 1 / 8), (0, 2, 1 / 8))


def ordered(vals, w, h, pattern):
    out = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            v = vals[y * w + x] / 255
            if pattern == 'bayer':
                t = (BAYER8[(y & 7) * 8 + (x & 7)] + .5) / 64
            else:   # 45 degree line screen, period 6, with a little Bayer to smooth steps
                p = 6
                tri = abs(((x + y) % p) - p / 2) / (p / 2)
                t = .85 * tri + .15 * (BAYER8[(y & 7) * 8 + (x & 7)] + .5) / 64
            out[y * w + x] = 1 if v > t else 0
    return out


def make(src, w, h, dot, style, fx=.5, fy=.5, zoom=1.0, pattern='atkinson', gamma=1.0,
         lo=.02, hi=.98, sharpen=1.2, fade=None, pocket=0):
    paper, ink = (hexrgb(c) for c in STYLES[style])
    im = frame(src, w, h, fx, fy, zoom)
    vals = tone(im, gamma, lo, hi, sharpen)
    # "ink amount" per spot: a light ink on dark paper draws the light,
    # a dark ink on light paper draws the shadows.
    if sum(ink) < sum(paper):
        vals = [255 - v for v in vals]
    if fade:   # (side, start, end): no ink at `start`, full ink from `end` (fractions of width)
        side, a, b = fade
        for x in range(w):
            f = x / (w - 1) if side == 'left' else 1 - x / (w - 1)
            k = max(0.0, min(1.0, (f - a) / (b - a))) ** 1.3
            if k < 1:
                for y in range(h):
                    vals[y * w + x] *= k
    if pocket:   # thin the ink where the card's big number sits (centre)
        import math
        for y in range(h):
            for x in range(w):
                d = ((x / w - .5) / .15) ** 2 + ((y / h - .5) / .3) ** 2
                vals[y * w + x] *= 1 - pocket * math.exp(-d)
    if pattern == 'atkinson':
        on = diffuse(vals, w, h, ATKINSON)
    elif pattern == 'fs':
        on = diffuse(vals, w, h, FS)
    else:
        on = ordered(vals, w, h, pattern)
    img = Image.new('P', (w, h))
    img.putpalette(list(paper) + list(ink))
    img.putdata(on)
    return img.resize((w * dot, h * dot), Image.NEAREST).convert('RGB')


# Card: 480x270 (2 px dots); square cards show the middle, so the focal
# point is the subject, and the ink thins out under the big shift number. Header: 2400x432 (2 px dots); the ink fades out
# to the left so the header text sits on plain paper.
CARD = (240, 135, 2)
HEADER = (1200, 216, 2)

# id -> source, style, pattern, card framing (fx, fy, zoom), header framing, extra tone
ART = {
    'partenons':  dict(src='a017', style='kobalts', pattern='fs',       card=(.5, .55, 1.3), header=(.5, .55, 1.0)),
    'kolonnas':   dict(src='a097', style='kobalts', pattern='atkinson', card=(.5, .4, 1.2),  header=(.5, .35, 1.0)),
    'piramidas':  dict(src='a042', style='papirs',  pattern='atkinson', card=(.5, .5, 1.2),  header=(.5, .6, 1.0), hi=.8),
    'sfinksa':    dict(src='a041', style='smilts',  pattern='atkinson', card=(.35, .5, 1.5), header=(.4, .55, 1.0)),
    'herakls':    dict(src='a089', style='menta',   pattern='lines',    card=(.5, .35, 1.0), header=(.5, .35, 1.0), gamma=.9),
    'atena':      dict(src='a032', style='tinte',   pattern='atkinson', card=(.5, .35, 1.3), header=(.2, .14, 1.9), hi=.75),
    'kariatides': dict(src='a014', style='persiks', pattern='atkinson', card=(.55, .45, 1.2), header=(.5, .45, 1.0)),
    'apolons':    dict(src='a084', style='zelts',   pattern='fs',       card=(.58, .4, 1.3),  header=(.45, .35, 1.0)),
    'domatajs':   dict(src='a088', style='papirs',  pattern='lines',    card=(.5, .45, 1.2), header=(.5, .45, 1.0)),
    'konkordija': dict(src='a105', style='olivs',   pattern='fs',       card=(.5, .55, 1.4), header=(.5, .55, 1.0)),
    'herkuls':    dict(src='a076', style='ogles',   pattern='atkinson', card=(.5, .4, 1.2),  header=(.5, .4, 1.0)),
}
TONE = ('pattern', 'gamma', 'lo', 'hi', 'sharpen')


def build(aid, a, src_dir):
    src = next(Path(src_dir).glob(a['src'] + '.*'))
    t = {k: a[k] for k in TONE if k in a}
    card = make(src, *CARD, a['style'], *a['card'], pocket=.8, **t)
    band = make(src, *HEADER, a['style'], *a['header'], fade=('left', .18, .55), **t)
    return card, band


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src_dir')
    ap.add_argument('--proof')
    ap.add_argument('--only', nargs='*')
    o = ap.parse_args()
    cards, bands = [], []
    for aid, a in ART.items():
        if o.only and aid not in o.only:
            continue
        card, band = build(aid, a, o.src_dir)
        if o.proof:
            cards.append(card)
            bands.append(band)
            continue
        card.save(CARD_OUT / f'skin-art-{aid}.webp', 'WEBP', lossless=True, method=6)
        band.save(HEADER_OUT / f'art-{aid}.webp', 'WEBP', lossless=True, method=6)
        print('wrote', aid)
    if o.proof:
        # Cards as a square card shows them (the middle 270x270), at 1:1.
        cols = 4
        rows = (len(cards) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * 280 + 10, rows * 280 + 10), (40, 40, 40))
        for i, c in enumerate(cards):
            sheet.paste(c.crop((105, 0, 375, 270)), (10 + (i % cols) * 280, 10 + (i // cols) * 280))
        sheet.save(o.proof)
        bsheet = Image.new('RGB', (1200, len(bands) * 222), (40, 40, 40))
        for i, b in enumerate(bands):
            bsheet.paste(b.resize((1200, 216), Image.LANCZOS), (0, i * 222))
        bsheet.save(o.proof.replace('.png', '-header.png'))
        print('proof', o.proof)


if __name__ == '__main__':
    main()
