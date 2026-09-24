#!/usr/bin/env python3
"""RG brand in 1-bit dither: a lit torus (CT gantry ring) around the letters
RG, white pixels on black, ordered (Bayer) dither with square pixels.

  data/rg-brand.svg          face-on mark (96 px), pixels as merged runs
  data/rg-*.png              PWA / favicon / apple-touch icons (same frame)
  data/rg-loader-ring.gif    loader: the ring spins round the static letters

The ring is drawn by splatting surface points into a z-buffer, so the front
of the ring passes in front of the letters and the back behind them.
Run: python3 scripts/build-dither-brand.py   (needs Pillow only)
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
FONT = '/System/Library/Fonts/Supplemental/Arial Black.ttf'
BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
RING_R, RING_A, TILT = .66, .21, math.radians(14)


def unit(v):
    n = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / n for c in v)


LIGHT = unit((-.5, -.62, .6))
HALF = unit((LIGHT[0], LIGHT[1], LIGHT[2] + 1))


def shade(n):
    d = max(0.0, sum(a * b for a, b in zip(n, LIGHT)))
    s = max(0.0, sum(a * b for a, b in zip(n, HALF))) ** 24
    return min(1.0, .06 + .80 * d + .6 * s)


def letter_points(res):
    """Pixels of the letters RG on the z = 0 plane, in -1..1 units."""
    S = res * 4
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    font = ImageFont.truetype(FONT, 100)
    bb = d.textbbox((0, 0), 'RG', font=font)
    font = ImageFont.truetype(FONT, int(100 * S * .36 / (bb[2] - bb[0])))
    bb = d.textbbox((0, 0), 'RG', font=font)
    d.text(((S - (bb[2] - bb[0])) / 2 - bb[0], (S - (bb[3] - bb[1])) / 2 - bb[1]), 'RG', font=font, fill=255)
    m = m.resize((res, res), Image.BOX)
    px = m.load()
    return [(x, y, px[x, y] / 255) for y in range(res) for x in range(res) if px[x, y] > 40]


def frame(res, spin, letters):
    """Grey frame: ring rotated `spin` about the vertical axis, then tilted."""
    zbuf = [[-9.0] * res for _ in range(res)]
    lum = [[0.0] * res for _ in range(res)]
    for x, y, cov in letters:                      # flat, lit face on
        zbuf[y][x] = 0.0
        lum[y][x] = .95 * cov
    cs, sn = math.cos(spin), math.sin(spin)
    ct, st = math.cos(TILT), math.sin(TILT)
    nu, nv = res * 7, res * 3
    half = res / 2
    for i in range(nu):
        u = 2 * math.pi * i / nu
        cu, su = math.cos(u), math.sin(u)
        for j in range(nv):
            v = 2 * math.pi * j / nv
            cv, sv = math.cos(v), math.sin(v)
            # torus in its own frame: ring in the x/y plane, facing +z
            px, py, pz = (RING_R + RING_A * cv) * cu, (RING_R + RING_A * cv) * su, RING_A * sv
            nx, ny, nz = cv * cu, cv * su, sv
            # spin about y, then tilt about x
            px, pz = px * cs + pz * sn, -px * sn + pz * cs
            nx, nz = nx * cs + nz * sn, -nx * sn + nz * cs
            py, pz = py * ct - pz * st, py * st + pz * ct
            ny, nz = ny * ct - nz * st, ny * st + nz * ct
            if nz < -.05:
                continue                           # back faces never win the z test
            sx, sy = int(half + px * half * .92), int(half + py * half * .92)
            if 0 <= sx < res and 0 <= sy < res and pz > zbuf[sy][sx]:
                zbuf[sy][sx] = pz
                lum[sy][sx] = shade((nx, ny, nz))
    return lum


def dither(lum, res):
    img = Image.new('1', (res, res), 0)
    p = img.load()
    for y in range(res):
        row = BAYER4[y & 3]
        for x in range(res):
            if lum[y][x] > (row[x & 3] + .5) / 16:
                p[x, y] = 1
    return img


def icon(size, scale, rounded, path):
    """Each icon is rendered for its own size and scaled by whole pixels."""
    art_px = int(size * scale)
    k = max(1, art_px // 96)                        # 72..128 dither pixels across
    res = art_px // k
    art = dither(frame(res, 0.0, letter_points(res)), res).convert('L').resize((res * k, res * k), Image.NEAREST)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bg = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    if rounded:
        m = Image.new('L', (size * 4, size * 4), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=size * 4 * 112 // 512, fill=255)
        img.paste(bg, (0, 0), m.resize((size, size), Image.LANCZOS))
    else:
        img = bg
    off = (size - art.width) // 2
    img.paste(Image.new('RGBA', art.size, (255, 255, 255, 255)), (off, off), art)
    img.save(path, optimize=True)


def svg(bits, path):
    res = bits.width
    p = bits.load()
    runs = []
    for y in range(res):
        x = 0
        while x < res:
            if p[x, y]:
                s = x
                while x < res and p[x, y]:
                    x += 1
                runs.append(f'M{s} {y}h{x - s}v1h-{x - s}z')
            else:
                x += 1
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {res} {res}" shape-rendering="crispEdges" role="img" aria-label="RG">'
        f'<rect width="{res}" height="{res}" rx="{res * 112 / 512:.1f}" fill="#000"/>'
        f'<path fill="#fff" d="{"".join(runs)}"/></svg>', encoding='utf-8')


def main():
    # Mark: ring face on. The SVG uses 96 pixels; icons render their own.
    res = 96
    svg(dither(frame(res, 0.0, letter_points(res)), res), DATA / 'rg-brand.svg')
    for name, size, scale, rounded in [
        ('rg-cal-192.png', 192, 1, True), ('rg-cal-512.png', 512, 1, True),
        ('rg-any-192.png', 192, 1, True), ('rg-any-512.png', 512, 1, True),
        ('rg-cal-maskable-192.png', 192, .75, False), ('rg-cal-maskable-512.png', 512, .75, False),
        ('rg-maskable-192.png', 192, .75, False), ('rg-maskable-512.png', 512, .75, False),
        ('rg-apple-touch-180.png', 180, 1, False),
    ]:
        icon(size, scale, rounded, DATA / name)

    # Loader: 128 px, the ring turns half a revolution (it is symmetric), the
    # letters stay. 24 frames at 80 ms, like a 12.5 fps retro render.
    res = 128
    letters = letter_points(res)
    frames = [dither(frame(res, math.pi * k / 24, letters), res).convert('P') for k in range(24)]
    frames[0].save(DATA / 'rg-loader-ring.gif', save_all=True, append_images=frames[1:],
                   duration=80, loop=0, optimize=True, disposal=1)


if __name__ == '__main__':
    main()
