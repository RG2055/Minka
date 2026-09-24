#!/usr/bin/env python3
"""Loader background: lit primitives (icosahedron, cube, cone, torus,
cylinder) turning slowly on black, 1-bit Bayer dither, 12.5 fps.
Landscape 480x270 (data/loader-shapes.gif) and portrait 270x480 for phones
(data/loader-shapes-portrait.gif).

Each shape turns a whole symmetry step over the loop, so the GIF repeats
without a jump. The middle stays empty for the RG ring.
Run: python3 scripts/build-loader-shapes.py   (needs Pillow only)
"""
import math
import os
from pathlib import Path
from PIL import Image

DATA = Path(__file__).resolve().parent.parent / 'data'
FRAMES = 60
B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def unit(v):
    n = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / n for c in v)


LIGHT = unit((-.45, -.7, .55))


def rot(p, ax, ay):
    x, y, z = p
    c, s = math.cos(ay), math.sin(ay)
    x, z = x * c + z * s, -x * s + z * c
    c, s = math.cos(ax), math.sin(ax)
    y, z = y * c - z * s, y * s + z * c
    return (x, y, z)


# Meshes: list of triangles, each vertex (position, normal). Unit size.
def flat(tris):
    out = []
    for a, b, c in tris:
        n = unit(cross(sub(b, a), sub(c, a)))
        out.append(((a, n), (b, n), (c, n)))
    return out


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def cube():
    v = [(x, y, z) for x in (-.5, .5) for y in (-.5, .5) for z in (-.5, .5)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    tris = []
    for a, b, c, d in f:
        tris += [(v[a], v[b], v[c]), (v[a], v[c], v[d])]
    return flat(tris)


def icosa():
    t = (1 + 5 ** .5) / 2
    v = [unit(p) for p in [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t),
                           (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]]
    f = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
         (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    return flat([tuple(tuple(c * .62 for c in v[i]) for i in tri) for tri in f])


def lathe(profile, seg=32):
    """Smooth surface of revolution about y; profile = [(radius, y), ...]."""
    tris = []
    for i in range(seg):
        a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
        for (r0, y0), (r1, y1) in zip(profile, profile[1:]):
            dr, dy = r1 - r0, y1 - y0
            nr, ny = unit((dy, -dr))[0], unit((dy, -dr))[1]
            def P(r, y, a):
                return (r * math.cos(a), y, r * math.sin(a))
            def N(a):
                return unit((nr * math.cos(a), ny, nr * math.sin(a)))
            q = [(P(r0, y0, a0), N(a0)), (P(r1, y1, a0), N(a0)), (P(r1, y1, a1), N(a1)), (P(r0, y0, a1), N(a1))]
            tris += [(q[0], q[1], q[2]), (q[0], q[2], q[3])]
    return tris


def cap(r, y, up, seg=32):
    n = (0, -1 if up else 1, 0)
    return [(((0, y, 0), n), ((r * math.cos(2 * math.pi * i / seg), y, r * math.sin(2 * math.pi * i / seg)), n),
             ((r * math.cos(2 * math.pi * (i + 1) / seg), y, r * math.sin(2 * math.pi * (i + 1) / seg)), n)) for i in range(seg)]


def cone():
    return lathe([(0, -.55), (.42, .45)]) + cap(.42, .45, False)


def cylinder():
    return lathe([(.36, -.45), (.36, .45)]) + cap(.36, -.45, True) + cap(.36, .45, False)


def torus(R=.38, a=.16, nu=40, nv=20):
    def pt(i, j):
        u, v = 2 * math.pi * i / nu, 2 * math.pi * j / nv
        p = ((R + a * math.cos(v)) * math.cos(u), a * math.sin(v), (R + a * math.cos(v)) * math.sin(u))
        n = (math.cos(v) * math.cos(u), math.sin(v), math.cos(v) * math.sin(u))
        return (p, n)
    tris = []
    for i in range(nu):
        for j in range(nv):
            q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]
            tris += [(q[0], q[1], q[2]), (q[0], q[2], q[3])]
    return tris


# (mesh, centre x, centre y, size px, tilt, turn per loop (radians))
LAYOUTS = {
    'loader-shapes.gif': (480, 270, [
        (icosa(), 392, 64, 58, .5, 2 * math.pi / 5),
        (cube(), 92, 72, 50, .6, math.pi / 2),
        (cone(), 402, 196, 58, .35, 2 * math.pi),
        (torus(), 96, 200, 66, 1.05, math.pi),
        (cylinder(), 250, 238, 34, .5, 2 * math.pi),
    ]),
    'loader-shapes-portrait.gif': (270, 480, [
        (icosa(), 196, 78, 50, .5, 2 * math.pi / 5),
        (cube(), 68, 118, 44, .6, math.pi / 2),
        (cone(), 208, 356, 50, .35, 2 * math.pi),
        (torus(), 70, 384, 58, 1.05, math.pi),
        (cylinder(), 140, 448, 30, .5, 2 * math.pi),
    ]),
}


def render(k, W, H, SHAPES):
    zb = [[-1e9] * W for _ in range(H)]
    lum = [[0.0] * W for _ in range(H)]
    t = k / FRAMES
    for mesh, cx, cy, size, tilt, turn in SHAPES:
        ang = turn * t
        for tri in mesh:
            pts = []
            for p, n in tri:
                rp, rn = rot(p, tilt, ang), rot(n, tilt, ang)
                pts.append((cx + rp[0] * size, cy + rp[1] * size, rp[2], rn))
            (x0, y0, z0, n0), (x1, y1, z1, n1), (x2, y2, z2, n2) = pts
            area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
            if abs(area) < 1e-9:
                continue
            for py in range(max(0, int(min(y0, y1, y2))), min(H, int(max(y0, y1, y2)) + 1)):
                for px in range(max(0, int(min(x0, x1, x2))), min(W, int(max(x0, x1, x2)) + 1)):
                    sx, sy = px + .5, py + .5
                    w0 = ((x1 - sx) * (y2 - sy) - (x2 - sx) * (y1 - sy)) / area
                    w1 = ((x2 - sx) * (y0 - sy) - (x0 - sx) * (y2 - sy)) / area
                    w2 = 1 - w0 - w1
                    if w0 < 0 or w1 < 0 or w2 < 0:
                        continue
                    z = w0 * z0 + w1 * z1 + w2 * z2
                    if z <= zb[py][px]:
                        continue
                    zb[py][px] = z
                    n = unit(tuple(w0 * n0[i] + w1 * n1[i] + w2 * n2[i] for i in range(3)))
                    if n[2] < 0:                   # viewer is on +z; face it
                        n = (-n[0], -n[1], -n[2])
                    d = max(0.0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
                    lum[py][px] = min(1.0, .16 + .84 * d ** 1.3)
    img = Image.new('1', (W, H), 0)
    p = img.load()
    for y in range(H):
        row = B4[y & 3]
        for x in range(W):
            if lum[y][x] > (row[x & 3] + .5) / 16:
                p[x, y] = 1
    return img.convert('P')


def main():
    for name, (W, H, shapes) in LAYOUTS.items():
        out = DATA / name
        frames = [render(k, W, H, shapes) for k in range(FRAMES)]
        frames[0].save(out, save_all=True, append_images=frames[1:], duration=80, loop=0, optimize=True, disposal=1)
        print(name, FRAMES, 'frames', round(os.path.getsize(out) / 1024), 'KB')


if __name__ == '__main__':
    main()
