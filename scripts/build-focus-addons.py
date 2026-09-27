#!/usr/bin/env python3
"""Focus-kit card decorations (kalendars/data/card-addons/focus-v1).

Raster items are made from our own cut-outs (realistic-v1): a thermal-style
gradient map with film grain ("fokuss") or a round-dot halftone ("rastrs").
Vector items (labels, frames, charms, tapes) are small hand-written SVGs.
Run: python3 scripts/build-focus-addons.py
"""
import math, os, random
from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = os.path.join(os.path.dirname(__file__), '..', 'kalendars', 'data', 'card-addons')
SRC = os.path.join(ROOT, 'realistic-v1')
OUT = os.path.join(ROOT, 'focus-v1')
RAMP = [(8, 13, 58), (30, 60, 192), (44, 98, 228), (22, 150, 140), (244, 116, 22), (255, 196, 104)]
WHITE = '#f4f2ec'

def ramp_lut():
    luts = ([], [], [])
    n = len(RAMP) - 1
    for v in range(256):
        f = v / 255 * n
        i = min(n - 1, int(f)); t = f - i
        for c in range(3):
            luts[c].append(round(RAMP[i][c] + (RAMP[i + 1][c] - RAMP[i][c]) * t))
    return luts

def load(name):
    return Image.open(os.path.join(SRC, name + '.webp')).convert('RGBA')

def focus_map(im, grain=34):
    alpha = im.getchannel('A')
    mask = alpha.point(lambda a: 255 if a > 60 else 0)
    lum = ImageOps.autocontrast(im.convert('RGB').convert('L'), cutoff=2, mask=mask)
    random.seed(7)
    noise = Image.effect_noise(im.size, grain)
    lum = ImageChops.add(lum, noise, 1.0, -128)
    r, g, b = ramp_lut()
    out = Image.merge('RGB', (lum.point(r), lum.point(g), lum.point(b))).convert('RGBA')
    out.putalpha(alpha)
    return out

def halftone(im, cell=7, ink=(244, 242, 236)):
    k = 2
    w, h = im.size
    alpha = im.getchannel('A')
    lum = ImageOps.autocontrast(im.convert('RGB').convert('L'), cutoff=2, mask=alpha.point(lambda a: 255 if a > 60 else 0))
    cols, rows = max(1, w // cell), max(1, h // cell)
    small = lum.resize((cols, rows), Image.BOX)
    small_a = alpha.resize((cols, rows), Image.BOX)
    big = Image.new('RGBA', (w * k, h * k), (0, 0, 0, 0))
    # A quiet silhouette under the dots keeps the shape readable on light cards.
    back = Image.new('RGBA', im.size, (10, 11, 14, 0)); back.putalpha(alpha.point(lambda a: int(a * .34)))
    big.alpha_composite(back.resize(big.size, Image.LANCZOS))
    d = ImageDraw.Draw(big)
    for y in range(rows):
        for x in range(cols):
            a = small_a.getpixel((x, y)) / 255
            if a < .2: continue
            v = small.getpixel((x, y)) / 255
            r = cell * k * .64 * math.sqrt(v) * min(1, a * 1.2)
            if r < .6: continue
            cx, cy = (x + .5) * cell * k, (y + .5) * cell * k
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ink + (255,))
    return big.resize(im.size, Image.LANCZOS)

def crop_marks(im, pad=18, sq=15, line=2):
    """Focus framing around the subject: thin box, four corner squares, a centre cross."""
    bbox = im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox() or (0, 0) + im.size
    w, h = im.size
    out = Image.new('RGBA', (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    out.alpha_composite(im, (pad, pad))
    k = 3
    ov = Image.new('RGBA', (out.width * k, out.height * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    x0, y0, x1, y1 = [(v + pad) * k for v in bbox]
    x0 -= 6 * k; y0 -= 6 * k; x1 += 6 * k; y1 += 6 * k
    col = (244, 242, 236, 225)
    d.rectangle((x0, y0, x1, y1), outline=col, width=line * k // 2 + 1)
    s = sq * k / 2
    for cx, cy in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
        d.rectangle((cx - s, cy - s, cx + s, cy + s), outline=(244, 242, 236, 245), width=line * k)
    mx, my, c = (x0 + x1) / 2, (y0 + y1) / 2, 11 * k
    d.line((mx - c, my, mx + c, my), fill=col, width=line * k // 2 + 1)
    d.line((mx, my - c, mx, my + c), fill=col, width=line * k // 2 + 1)
    out.alpha_composite(ov.resize(out.size, Image.LANCZOS))
    return out

def fit512(im):
    s = 512 / max(im.size)
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS) if s < 1 else im

def save(im, name):
    fit512(im).save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=78, method=6)

def svg(name, body, vb, extra=''):
    with open(os.path.join(OUT, name + '.svg'), 'w') as f:
        w, h = vb.split()[2:]
        # Intrinsic size = the viewBox: <img> then knows its aspect (and naturalWidth for effects).
        f.write('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="%s"%s>%s</svg>\n' % (w, h, vb, extra, body))

FONT = "font-family='Helvetica Neue,Helvetica,Arial,sans-serif'"
MONO = "font-family='SF Mono,Menlo,Consolas,monospace'"

# ---------- raster: toppers + objects ----------
save(focus_map(load('topper-happy-tabby')), 'topper-focus-tabby')
save(halftone(load('topper-space-cat'), cell=6), 'topper-halftone-cat')
for src, name, kind in [('object-david', 'object-david-focus', 'focus'), ('object-owl', 'object-owl-focus', 'focus'),
                        ('object-astronaut', 'object-astronaut-focus', 'focus'), ('object-floral-skull', 'object-skull-focus', 'focus'),
                        ('object-skeleton-peace', 'object-skeleton-halftone', 'dots'), ('object-crystal-cat', 'object-cat-halftone', 'dots'),
                        ('object-glitch-statue', 'object-statue-halftone', 'dots')]:
    im = load(src)
    save(crop_marks(focus_map(im)) if kind == 'focus' else halftone(im, cell=7), name)

# ---------- vector: labels (Zīmes) ----------
svg('label-focus', f"<g fill='{WHITE}' {FONT}><text x='6' y='70' font-size='66' font-weight='300' letter-spacing='-2'>Focus</text></g>"
    f"<g stroke='{WHITE}' stroke-width='1.6'><path d='M14 92v14M7 99h14M132 92v14M125 99h14'/></g>", '0 0 200 112')
svg('label-light-shine', f"<g fill='{WHITE}' {FONT} font-size='17' font-weight='400'><text x='4' y='24'>light</text><text x='120' y='24' text-anchor='middle'>focus</text><text x='236' y='24' text-anchor='end'>shine</text></g>", '0 0 240 36')
svg('label-rec', f"<g fill='none' stroke='{WHITE}' stroke-width='1.6' stroke-linecap='square'><path d='M3 14V3h11M186 3h11v11M3 56v11h11M186 67h11V56'/></g>"
    f"<circle cx='26' cy='35' r='7' fill='#ff4b3e'/><g fill='{WHITE}' {MONO} font-weight='600'><text x='40' y='41' font-size='17' letter-spacing='1'>REC</text><text x='182' y='41' font-size='15' text-anchor='end'>00:24:00</text></g>", '0 0 200 70')
ticks = ''.join("<path d='M%.1f %d v%d'/>" % (20 + i * 10, 42 if i % 5 else 38, 6 if i % 5 else 10) for i in range(21))
svg('label-exposure', f"<g fill='{WHITE}' {MONO} font-size='13' font-weight='500'><text x='18' y='20'>ISO 800</text><text x='120' y='20' text-anchor='middle'>f/1.8</text><text x='222' y='20' text-anchor='end'>1/60</text></g>"
    f"<g stroke='{WHITE}' stroke-width='1.2'>{ticks}</g><path d='M120 58l-5 7h10z' fill='#f67a18'/><g fill='{WHITE}' {MONO} font-size='9'><text x='20' y='66' text-anchor='middle'>-2</text><text x='220' y='66' text-anchor='middle'>+2</text></g>", '0 0 240 70')
svg('label-night', f"<path d='M30 12a17 17 0 1 0 17 24 13 13 0 1 1-17-24z' fill='#ffd680'/><g fill='{WHITE}' {FONT}><text x='58' y='26' font-size='12' font-weight='600' letter-spacing='3'>NIGHT SHIFT</text><text x='56' y='60' font-size='34' font-weight='300' letter-spacing='-1'>20—08</text></g>", '0 0 200 72')
svg('label-lens-dot', "<defs><path id='r' d='M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0'/></defs><circle cx='60' cy='60' r='58' fill='#f67a18'/>"
    f"<text fill='#0a0b0e' {FONT} font-size='10' font-weight='700'><textPath href='#r' textLength='272' lengthAdjust='spacing'>IN FOCUS — ON DUTY — IN FOCUS — ON DUTY —</textPath></text>"
    "<circle cx='60' cy='60' r='24' fill='#2248cd'/><g stroke='#f4f2ec' stroke-width='1.6'><path d='M60 44v32M44 60h32'/></g>", '0 0 120 120')
random.seed(11)
bars, x = '', 6
while x < 190:
    bw = random.choice((1.5, 1.5, 3, 4.5)); bars += "<rect x='%.1f' y='8' width='%.1f' height='44'/>" % (x, bw); x += bw + random.choice((1.5, 3, 3))
svg('label-barcode', f"<g fill='{WHITE}'>{bars}</g><g fill='{WHITE}' {MONO} font-size='13' font-weight='600' letter-spacing='2'><text x='6' y='70'>RG—24H</text><text x='192' y='70' text-anchor='end'>00427</text></g>", '0 0 198 76')

# ---------- vector: full-card frames (Kadri) ----------
NS = "vector-effect='non-scaling-stroke'"
def frame(name, body):
    svg(name, "<g fill='none' stroke='%s' stroke-width='1' %s>%s</g>" % (WHITE, NS, body[0]) + body[1], '0 0 100 100', " preserveAspectRatio='none'")
sq = lambda x, y, s=3.4: "<rect x='%.1f' y='%.1f' width='%.1f' height='%.1f'/>" % (x - s / 2, y - s / 2, s, s)
frame('frame-focus', ("<rect x='12' y='14' width='76' height='72' opacity='.85'/>" + sq(12, 14) + sq(88, 14) + sq(12, 86) + sq(88, 86)
    + "<path d='M47 50h6M50 47v6M20 93v4M18 95h4M62 93v4M60 95h4'/>",
    ''))   # no top words: they landed on the card's name
frame('frame-viewfinder', ("<path d='M6 15V6h9M85 6h9v9M6 85v9h9M94 85v9h-9M48 50h4M50 48v4'/><rect x='80' y='89.2' width='8' height='3.6'/><path d='M88.6 90.3v1.4'/>",
    f"<circle cx='9.5' cy='11' r='1.5' fill='#ff4b3e'/><g fill='{WHITE}' {MONO} font-size='3.6' font-weight='600'><text x='12.5' y='12.3'>REC</text><text x='91' y='12.3' text-anchor='end'>00:00:24</text><text x='9' y='92.2'>4K 25P</text></g><rect x='80.8' y='90' width='5' height='2' fill='{WHITE}'/>"))
frame('frame-thirds', ("<path d='M33.3 4v92M66.7 4v92M4 33.3h92M4 66.7h92' opacity='.55'/><circle cx='50' cy='50' r='3'/><path d='M50 44v3M50 53v3M44 50h3M53 50h3'/>", ''))
reg = lambda x, y: "<circle cx='%g' cy='%g' r='2.2'/><path d='M%g %gh7M%g %gv7'/>" % (x, y, x - 3.5, y, x, y - 3.5)
bars2 = ''.join("<rect x='%g' y='94.5' width='5' height='2.6' fill='%s'/>" % (36 + i * 5, c) for i, c in enumerate(['#0a0b0e', '#f4f2ec', '#f67a18', '#2248cd', '#16968e', '#ffd680']))
frame('frame-registration', (reg(7, 7) + reg(93, 7) + reg(7, 93) + reg(93, 93), bars2))
rt = ''.join("<path d='M%g 0v%g'/>" % (x, 5 if x % 10 == 0 else 2.6) for x in range(10, 100, 2)) + ''.join("<path d='M0 %gh%g'/>" % (y, 5 if y % 10 == 0 else 2.6) for y in range(10, 100, 2))
frame('frame-ruler', (rt, f"<g fill='{WHITE}' {MONO} font-size='2.6'>" + ''.join("<text x='%g' y='8.4' text-anchor='middle'>%d</text>" % (x, x // 10) for x in range(20, 100, 20)) + '</g>'))

# ---------- vector: charms ----------
CLASP = ("<defs><linearGradient id='m' x1='0' x2='1'><stop offset='0' stop-color='#8d9097'/><stop offset='.45' stop-color='#f1f2f4'/><stop offset='1' stop-color='#6c7078'/></linearGradient></defs>"
         "<circle cx='100' cy='20' r='13' fill='none' stroke='url(#m)' stroke-width='6'/>"
         + ''.join("<ellipse cx='100' cy='%d' rx='4.4' ry='7' fill='none' stroke='url(#m)' stroke-width='2.6'/>" % y for y in range(42, 196, 12)))
def charm(name, pendant):
    svg(name, CLASP + pendant, '0 0 200 512')
charm('charm-lens', "<defs><radialGradient id='g' cx='.42' cy='.4' r='.7'><stop offset='0' stop-color='#16968e'/><stop offset='.45' stop-color='#2248cd'/><stop offset='.8' stop-color='#0a1046'/><stop offset='1' stop-color='#f67a18'/></radialGradient></defs>"
      "<circle cx='100' cy='290' r='86' fill='#15171c'/><circle cx='100' cy='290' r='86' fill='none' stroke='url(#m)' stroke-width='4'/>"
      + ''.join("<path d='M%.1f %.1fL%.1f %.1f' stroke='#3a3d45' stroke-width='3'/>" % (100 + 80 * math.cos(a), 290 + 80 * math.sin(a), 100 + 86 * math.cos(a), 290 + 86 * math.sin(a)) for a in [i * math.pi / 24 for i in range(48)])
      + "<circle cx='100' cy='290' r='62' fill='url(#g)'/><circle cx='100' cy='290' r='62' fill='none' stroke='#000' stroke-opacity='.6' stroke-width='5'/>"
      "<path d='M62 262a48 48 0 0 1 40-26' fill='none' stroke='#fff' stroke-opacity='.85' stroke-width='6' stroke-linecap='round'/><circle cx='128' cy='318' r='5' fill='#fff' fill-opacity='.55'/>"
      f"<text x='100' y='226' fill='{WHITE}' {MONO} font-size='9' text-anchor='middle' letter-spacing='2'>50mm 1:1.8</text>")
charm('charm-reticle', "<circle cx='100' cy='290' r='74' fill='#0a0b0e' fill-opacity='.55'/><circle cx='100' cy='290' r='74' fill='none' stroke='url(#m)' stroke-width='9'/>"
      "<circle cx='100' cy='290' r='40' fill='none' stroke='#f4f2ec' stroke-width='2'/><g stroke='#f4f2ec' stroke-width='2.4'><path d='M100 222v38M100 320v38M32 290h38M130 290h38'/></g><circle cx='100' cy='290' r='4' fill='#f67a18'/>")
dots = ''
r_, cx0, cy0 = 76, 100, 292
lut = ramp_lut()
for gy in range(-r_, r_ + 1, 9):
    for gx in range(-r_, r_ + 1, 9):
        dd = math.hypot(gx, gy)
        if dd > r_: continue
        z = math.sqrt(max(0, r_ * r_ - dd * dd)) / r_
        light = max(0, (-.45 * gx - .55 * gy) / r_ + .75 * z)  # lit from the top left
        v = min(255, int(light * 230) + 18)
        rad = 4.6 * math.sqrt(min(1, light * .9 + .12))
        dots += "<circle cx='%d' cy='%d' r='%.1f' fill='#%02x%02x%02x'/>" % (cx0 + gx, cy0 + gy, rad, lut[0][v], lut[1][v], lut[2][v])
charm('charm-halftone-orb', dots)
charm('charm-focus-tag', "<rect x='38' y='204' width='124' height='190' rx='14' fill='#0a0b0e'/><circle cx='100' cy='226' r='7' fill='none' stroke='url(#m)' stroke-width='3'/>"
      "<rect x='38' y='356' width='124' height='14' fill='#f67a18'/><rect x='38' y='370' width='124' height='10' fill='#2248cd'/>"
      f"<g fill='none' stroke='{WHITE}' stroke-width='2'><rect x='56' y='250' width='88' height='88'/><rect x='51' y='245' width='10' height='10'/><rect x='139' y='245' width='10' height='10'/><rect x='51' y='333' width='10' height='10'/><rect x='139' y='333' width='10' height='10'/><path d='M100 286v16M92 294h16'/></g>"
      f"<text x='100' y='278' fill='{WHITE}' {FONT} font-size='15' font-weight='300' text-anchor='middle'>Focus</text>")

# ---------- vector: light (Gaisma) — full-card overlays, gradients only (no filters) ----------
def light(name, defs, body):
    svg(name, '<defs>%s</defs>%s' % (defs, body), '0 0 100 100', " preserveAspectRatio='none'")
def rg(id_, stops, cx=.5, cy=.5, r=.5):
    return "<radialGradient id='%s' cx='%s' cy='%s' r='%s'>%s</radialGradient>" % (id_, cx, cy, r, ''.join("<stop offset='%s' stop-color='%s' stop-opacity='%s'/>" % st for st in stops))
light('light-leak-warm', rg('a', [(0, '#ffb35a', .85), (.35, '#f67a18', .45), (1, '#f25a1e', 0)]) + rg('b', [(0, '#ff5a3c', .5), (1, '#ff5a3c', 0)]),
      "<ellipse cx='96' cy='4' rx='62' ry='54' fill='url(#a)'/><ellipse cx='100' cy='40' rx='16' ry='30' fill='url(#b)'/>")
light('light-leak-cool', rg('a', [(0, '#5fe0d0', .7), (.4, '#16968e', .35), (1, '#2248cd', 0)]) + rg('b', [(0, '#3f6bff', .55), (1, '#2248cd', 0)]),
      "<ellipse cx='2' cy='98' rx='64' ry='56' fill='url(#a)'/><ellipse cx='0' cy='60' rx='18' ry='34' fill='url(#b)'/>")
random.seed(21)
bok = ''
for i in range(14):
    x, y, r = random.uniform(4, 96), random.uniform(4, 96), random.uniform(3, 11)
    bok += "<circle cx='%.1f' cy='%.1f' r='%.1f' fill='url(#%s)'/>" % (x, y, r, random.choice('wwo'))
light('light-bokeh', rg('w', [(0, '#ffffff', .0), (.72, '#ffffff', .1), (.94, '#ffffff', .32), (1, '#ffffff', 0)]) + rg('o', [(0, '#ffb35a', .05), (.75, '#f67a18', .14), (.95, '#ffb35a', .34), (1, '#ffb35a', 0)]), bok)
ghost = ''.join("<circle cx='%.1f' cy='%.1f' r='%.1f' fill='url(#g)'/>" % (14 + t * 80, 12 + t * 80, rr) for t, rr in ((.35, 3), (.5, 5.5), (.62, 2.2), (.8, 8), (.93, 3.6)))
light('light-flare', rg('c', [(0, '#ffffff', 1), (.12, '#fff3d6', .85), (.4, '#ffb35a', .3), (1, '#f67a18', 0)]) + rg('g', [(0, '#5fe0d0', .02), (.8, '#5fe0d0', .16), (1, '#5fe0d0', 0)])
      + "<linearGradient id='s' x1='0' x2='1'><stop offset='0' stop-color='#fff' stop-opacity='0'/><stop offset='.5' stop-color='#fff' stop-opacity='.75'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient>",
      "<circle cx='14' cy='12' r='26' fill='url(#c)'/><rect x='-10' y='11.4' width='60' height='1.2' fill='url(#s)'/>" + ghost)
light('light-shine', "<linearGradient id='s' x1='0' y1='0' x2='1' y2='1'><stop offset='.28' stop-color='#fff' stop-opacity='0'/><stop offset='.42' stop-color='#fff' stop-opacity='.2'/><stop offset='.46' stop-color='#fff' stop-opacity='.05'/><stop offset='.52' stop-color='#fff' stop-opacity='.16'/><stop offset='.62' stop-color='#fff' stop-opacity='0'/></linearGradient>",
      "<rect width='100' height='100' fill='url(#s)'/>")
print('ok', sorted(os.listdir(OUT)))
