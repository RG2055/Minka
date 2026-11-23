"""Where koro's grillz are in its close-up (for the page's glints): rows full of white below the eyes, the
middle box of the grinning frames, in the common frame's pixels.  python3 teeth_box.py koroE_dir x0 y0"""
import sys
from statistics import median
from PIL import Image
d, x0, y0 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
boxes = []
for f in range(24, 72):
    im = Image.open('%s/koro-high-r%03d.png' % (d, f)).convert('RGBA')
    w, h = im.size
    px = im.load()
    xs, ys = [], []
    for y in range(240, h):   # rows full of white: the teeth (the eyes' glints are white too, but small)
        row = [x for x in range(0, w, 2) if px[x, y][3] > 200 and min(px[x, y][:3]) > 135 and max(px[x, y][:3]) - min(px[x, y][:3]) < 55]
        if len(row) >= 12:
            xs += row; ys += [y] * len(row)
    if xs:
        boxes.append((min(xs), min(ys), max(xs), max(ys)))
m = [median(b[i] for b in boxes) for i in range(4)]
print(round(m[0] / 2 - x0), round(m[1] / 2 - y0), round((m[2] - m[0]) / 2), round((m[3] - m[1]) / 2))
