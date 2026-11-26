# Pixel compare of two screenshots: changed pixels, max channel difference, and where (bounding box).
# python3 pixdiff.py a.png b.png [threshold]   (threshold: per-channel difference counted as changed, default 0)
import sys
from PIL import Image
import numpy as np
a = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
b = np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(int)
t = int(sys.argv[3]) if len(sys.argv) > 3 else 0
if a.shape != b.shape: print('size differs', a.shape, b.shape); sys.exit(1)
d = np.abs(a - b).max(axis=2)
ch = d > t
n = int(ch.sum())
hist = {k: int(((d > k)).sum()) for k in (0, 2, 4, 8, 16, 32, 64)}
box = None
if n:
    ys, xs = np.nonzero(ch); box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
print(f'changed px (>{t}): {n} of {d.size} ({100*n/d.size:.3f}%), max diff {int(d.max())}, counts over k: {hist}, box {box}')
