"""The gallery's props as real models with their light baked in (as the cats' statue):
built here from simple shapes with rounded edges, unwrapped, the room's light baked
into one texture, written for the gallery's own rasterizer (mood-gallery-3d.js).

    Blender -b -P scripts/blender/gallery_props.py -- OUT_DIR machine [more...]

OUT_DIR/<name>-mesh.json (vertices in the game's local a, b, z: a forward, the front
faces +a; the floor at z = 0; quantized), OUT_DIR/<name>-tex.png (the baked texture).
Blender's axes here: x across (b = -x), -y is the front (a = -y), z up.
"""
import json
import math
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, NAMES = argv[0], argv[1:]
TEX = 1024


def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 160
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for d in prefs.devices: d.use = True
        sc.cycles.device = 'GPU'
    except Exception:
        pass
    return sc


def mat(name, col, rough=0.5, metal=0.0, coat=0.0, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = col + (1,)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if 'Coat Weight' in p.inputs: p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = emit + (1,)
        p.inputs['Emission Strength'].default_value = 2.0
    return m


def hexc(h):
    h = h.lstrip('#'); return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.0, seg=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.object; o.name = name; o.scale = (x1 - x0, y1 - y0, z1 - z0)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = min(seg, 2) if bevel < 0.006 else seg; b.limit_method = 'ANGLE'
    o.data.materials.append(m)
    return o


def cut(target, cutter):
    b = target.modifiers.new('cut', 'BOOLEAN'); b.object = cutter; b.operation = 'DIFFERENCE'; b.solver = 'EXACT'
    cutter.hide_render = True; cutter.hide_set(True)


def text(body, x, y, z, size, m, rot=(math.radians(90), 0, 0), font=None, depth=0.002):
    bpy.ops.object.text_add(location=(x, y, z), rotation=rot)
    t = bpy.context.object; t.data.body = body; t.data.size = size; t.data.extrude = depth
    t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    t.data.resolution_u = 2
    if font:
        try: t.data.font = bpy.data.fonts.load(font)
        except Exception: pass
    t.data.materials.append(m)
    return t


# ── the Löfbergs machine: 0.452 wide, 0.206 deep, 0.74 high (as the game's) ──
def machine():
    W, D, H = 0.452, 0.206, 0.74
    u = H / 144                                                    # the old front drawing's unit, so the layout matches it
    X = lambda px: -W / 2 + (px - 4) * u                           # drawing x (4..92) to Blender x
    Z = lambda py: H - py * u                                      # drawing y (0..144) down to z
    FY = -D / 2                                                    # the front face
    purple = mat('purple', hexc('#4d1f73'), rough=0.38, coat=0.6)
    crownm = mat('crown', hexc('#5f2c87'), rough=0.35, coat=0.6)
    dark = mat('dark', hexc('#1d0c2c'), rough=0.6)
    white = mat('white', hexc('#f1ecf6'), rough=0.3, coat=0.4)
    logo = mat('logo', hexc('#461c69'), rough=0.4)
    yellow = mat('yellow', hexc('#e9d98f'), rough=0.3, emit=hexc('#5a4d10'))
    glass = mat('glass', hexc('#16203a'), rough=0.12, coat=1.0)
    screen = mat('screen', hexc('#55c7dc'), rough=0.2, emit=hexc('#1f6f80'))
    chrome = mat('chrome', hexc('#b9bfc6'), rough=0.18, metal=1.0)
    rubber = mat('rubber', hexc('#2a2630'), rough=0.8)
    lilac = mat('lilac', hexc('#c79fe0'), rough=0.3, emit=hexc('#6a3f8a'))
    parts = []
    body = box('body', -W / 2, W / 2, -D / 2, D / 2, 0.02, H - 22 * u, purple, bevel=0.012)
    # the cup bay: a real recess where the old drawing had it
    bay = box('baycut', X(28), X(68), FY - 0.05, FY + 0.075, Z(134), Z(98), dark)
    cut(body, bay)
    parts.append(body)
    parts.append(box('bayback', X(28) + 0.002, X(68) - 0.002, FY + 0.07, FY + 0.074, Z(134), Z(98), dark))
    parts.append(box('tray', X(29), X(67), FY + 0.004, FY + 0.07, Z(134), Z(131), chrome, bevel=0.002, seg=2))
    for i in range(7):                                             # the drip grille's slots
        x = X(31) + i * (X(65) - X(31)) / 6
        parts.append(box('slot%d' % i, x - 0.002, x + 0.002, FY + 0.01, FY + 0.066, Z(131) - 0.0005, Z(131) + 0.0015, rubber))
    parts.append(box('crown', -W / 2 - 0.006, W / 2 + 0.006, -D / 2 - 0.008, D / 2 + 0.004, H - 22 * u, H, crownm, bevel=0.014))
    parts.append(box('lamp', X(70), X(80), FY - 0.012, FY - 0.004, Z(16), Z(6), lilac, bevel=0.002, seg=2))
    parts.append(box('logo', X(12), X(84), FY - 0.006, FY + 0.002, Z(42), Z(28), white, bevel=0.003, seg=2))
    parts.append(text('Löfbergs', (X(12) + X(84)) / 2, FY - 0.0068, (Z(42) + Z(28)) / 2, 13 * u, logo,
                      font='/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf', depth=0.0008))
    for i in range(4):
        parts.append(box('btn%d' % i, X(12), X(42), FY - 0.012, FY + 0.001, Z(58 + i * 12), Z(50 + i * 12), yellow, bevel=0.004, seg=3))
    parts.append(box('display', X(54), X(82), FY - 0.004, FY + 0.002, Z(76), Z(50), glass, bevel=0.003, seg=2))
    parts.append(box('screen', X(62), X(72), FY - 0.0055, FY - 0.003, Z(68), Z(58), screen))
    parts.append(box('kick', -W / 2 + 0.01, W / 2 - 0.01, -D / 2 + 0.012, D / 2 - 0.01, 0, 0.03, rubber, bevel=0.004))
    for sx in (-1, 1):                                             # the side vents
        for i in range(8):
            z = 0.22 + i * 0.045
            parts.append(box('vent%d%d' % (sx, i), sx * W / 2 - 0.003, sx * W / 2 + 0.003, -0.05, 0.05, z, z + 0.012, dark, bevel=0.002, seg=2))
    return parts, H


# ── helpers in the game's own axes (a forward, b left, z up) ──
def G(a, b, z): return Vector((-b, -a, z))


def gbox(name, a0, a1, b0, b1, z0, z1, m, bevel=0.0, seg=3):
    return box(name, -b1, -b0, -a1, -a0, z0, z1, m, bevel, seg)


def rod(name, p0, p1, r, m, verts=12, r1=None):
    """a cylinder (or a cone, r1) between two game points"""
    A, B = G(*p0), G(*p1); d = B - A
    if r1 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(A + B) / 2)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r1, depth=d.length, location=(A + B) / 2, end_fill_type='NOTHING')
    o = bpy.context.object; o.name = name
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    o.data.materials.append(m)
    for f in o.data.polygons: f.use_smooth = True
    return o


def disc(name, a, b, z0, z1, r, m, verts=32, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=z1 - z0, location=G(a, b, (z0 + z1) / 2))
    o = bpy.context.object; o.name = name; o.data.materials.append(m)
    if bevel:
        bv = o.modifiers.new('bev', 'BEVEL'); bv.width = bevel; bv.segments = 2; bv.limit_method = 'ANGLE'
    return o


def tube(name, pts, r, m, res=10):
    """a bent rod through game points (bentwood, wire)"""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 2; cu.resolution_u = 4
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for i, q in enumerate(pts): v = G(*q); sp.points[i].co = (v.x, v.y, v.z, 1)
    cu.use_fill_caps = True
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o); o.data.materials.append(m)
    return o


WOOD_DK = None


def chair():
    wood = mat('wood', hexc('#4a2f1b'), rough=0.35, coat=0.5)
    seatm = mat('seat', hexc('#6e4a2c'), rough=0.4, coat=0.6)
    parts, seat = [], 0.26
    for la, lb in ((0.09, 0.09), (0.09, -0.09), (-0.09, 0.09), (-0.09, -0.09)):
        parts.append(rod('leg', (la * 0.85, lb * 0.85, seat - 0.02), (la * 1.15, lb * 1.15, 0), 0.011, wood))
    parts.append(tube('ring', [(math.cos(t / 16 * 2 * math.pi) * 0.088, math.sin(t / 16 * 2 * math.pi) * 0.088, 0.1) for t in range(17)], 0.006, wood))
    hoop = [(-0.12, math.cos(i / 14 * math.pi) * 0.12, seat + math.sin(i / 14 * math.pi) * 0.24) for i in range(15)]
    parts.append(tube('hoop', hoop, 0.013, wood))
    parts.append(tube('rail', [(-0.12, 0.1, seat + 0.13), (-0.12, -0.1, seat + 0.13)], 0.008, wood))
    parts.append(tube('rail2', [(-0.12, 0.07, seat + 0.07), (-0.12, -0.07, seat + 0.07)], 0.007, wood))
    parts.append(disc('seat', 0, 0, seat - 0.03, seat, 0.13, seatm, bevel=0.008))
    return parts, 0.52


def table():
    top = mat('top', hexc('#f4efe6'), rough=0.25, coat=0.6)
    rim = mat('rim', hexc('#b3ab9e'), rough=0.4)
    iron = mat('iron', hexc('#2d2e31'), rough=0.45, metal=0.6)
    glass = mat('glass', hexc('#bcd7ea'), rough=0.08, coat=1.0)
    stem = mat('stem', hexc('#3f7a3a'), rough=0.5)
    petal = mat('petal', hexc('#d64541'), rough=0.4)
    parts = [disc('top', 0, 0, 0.318, 0.336, 0.24, top, verts=48, bevel=0.006), disc('rim', 0, 0, 0.31, 0.318, 0.236, rim, verts=48),
             rod('post', (0, 0, 0.012), (0, 0, 0.31), 0.018, iron), disc('base', 0, 0, 0, 0.014, 0.12, iron, verts=40, bevel=0.004),
             disc('collar', 0, 0, 0.29, 0.31, 0.04, iron, verts=24)]
    parts.append(disc('vase', 0.05, -0.07, 0.336, 0.40, 0.018, glass, verts=20))
    parts.append(rod('stalk', (0.05, -0.07, 0.38), (0.05, -0.07, 0.47), 0.003, stem, verts=6))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.018, location=G(0.05, -0.07, 0.485))
    t = bpy.context.object; t.scale = (1, 1, 1.4); t.data.materials.append(petal); parts.append(t)
    return parts, 0.5


def easel():
    wood = mat('wood', hexc('#7a5130'), rough=0.45, coat=0.3)
    wood2 = mat('wood2', hexc('#5f3e22'), rough=0.5)
    canvasm = mat('canvas', hexc('#efe8d8'), rough=0.85)
    mark = mat('mark', hexc('#b9ad97'), rough=0.85)
    pal = mat('palette', hexc('#c8a26a'), rough=0.5, coat=0.4)
    apex = (0.02, 0, 0.66)
    parts = [rod('legL', apex, (0.08, 0.2, 0), 0.014, wood, verts=8), rod('legR', apex, (0.08, -0.2, 0), 0.014, wood, verts=8),
             rod('legB', (0, 0, 0.6), (-0.28, 0, 0), 0.013, wood2, verts=8),
             gbox('ledge', 0.05, 0.13, -0.24, 0.24, 0.19, 0.23, wood, bevel=0.006),
             gbox('canvas', 0.06, 0.08, -0.19, 0.19, 0.23, 0.60, canvasm, bevel=0.004)]
    parts.append(gbox('crossV', 0.0795, 0.083, -0.006, 0.006, 0.36, 0.48, mark))
    parts.append(gbox('crossH', 0.0795, 0.083, -0.06, 0.06, 0.414, 0.426, mark))
    parts.append(disc('palette', 0.09, 0.09, 0.23, 0.236, 0.065, pal, verts=24))
    for i, c in enumerate(('#d64541', '#f2c94c', '#3a7bd5', '#4c8a44')):
        parts.append(disc('dab%d' % i, 0.07 + (i % 2) * 0.03, 0.06 + i * 0.022, 0.236, 0.242, 0.011, mat('p%d' % i, hexc(c), rough=0.3), verts=10))
    return parts, 0.7


def gramophone():
    wood = mat('wood', hexc('#6b4424'), rough=0.35, coat=0.6)
    dark = mat('dark', hexc('#4a2f17'), rough=0.4, coat=0.5)
    vinyl = mat('vinyl', hexc('#161616'), rough=0.25, coat=0.8)
    label = mat('label', hexc('#c0392b'), rough=0.4)
    brass = mat('brass', hexc('#d9b24c'), rough=0.22, metal=1.0)
    parts = [gbox('case', -0.14, 0.14, -0.16, 0.16, 0.02, 0.2, wood, bevel=0.01), gbox('plinth', -0.15, 0.15, -0.17, 0.17, 0, 0.025, dark, bevel=0.006),
             disc('record', 0, 0.02, 0.2, 0.208, 0.13, vinyl, verts=48), disc('label', 0, 0.02, 0.208, 0.21, 0.035, label, verts=24),
             rod('pole', (-0.1, -0.12, 0.2), (-0.1, -0.12, 0.42), 0.012, brass)]
    parts.append(rod('arm', (-0.1, -0.12, 0.25), (-0.02, 0.06, 0.215), 0.005, brass, verts=8))
    horn = rod('horn', (-0.1, -0.12, 0.42), (0.12, -0.02, 0.62), 0.02, brass, verts=32, r1=0.13)
    so = horn.modifiers.new('thick', 'SOLIDIFY'); so.thickness = 0.004
    parts.append(horn)
    parts.append(gbox('crank', -0.02, 0.02, -0.17, -0.19, 0.1, 0.12, brass))
    return parts, 0.66


CAN_IMG = __import__('os').path.abspath('kalendars/assets/gallery/monster-can.webp')   # run from the repo's root


def can_mesh(name, a, b, z0, r, h, m):
    """a White Monster can: the real can's picture wrapped round it (front and back), a slim neck and lid"""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    N, rings = 28, [(0.0, r * 0.92), (0.03, r), (0.88, r), (0.95, r * 0.86), (1.0, r * 0.84)]
    vs = [[bm.verts.new(G(a + math.cos(k / N * 2 * math.pi) * rr, b + math.sin(k / N * 2 * math.pi) * rr, z0 + f * h)) for k in range(N)] for f, rr in rings]
    for ri in range(len(rings) - 1):
        for k in range(N):
            k2 = (k + 1) % N
            f = bm.faces.new((vs[ri][k], vs[ri][k2], vs[ri + 1][k2], vs[ri + 1][k]))
            for l, (kk, rr) in zip(f.loops, ((k, ri), (k + 1, ri), (k + 1, ri + 1), (k, ri + 1))):
                # u: twice round (the picture on the front and on the back), its middle facing +a (the front)
                u = ((kk / N) * 2 + 0.5) % 2.0
                l[uv].uv = (min(u, 2 - u) if False else (u if u <= 1 else u - 1), rings[rr][0])
    top = bm.faces.new(vs[-1])
    for l in top.loops: l[uv].uv = (0.5, 0.995)
    bmesh.ops.reverse_faces(bm, faces=bm.faces[:])                 # outward (the side faces were wound inward: they baked black)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); me.materials.append(m)
    for f in me.polygons: f.use_smooth = True
    return o


def monsterbox():
    card = mat('card', hexc('#f4f5f4'), rough=0.7)
    ink = mat('ink', hexc('#3a3f3a'), rough=0.5)
    claw = mat('claw', hexc('#8f978f'), rough=0.4)
    can = bpy.data.materials.new('can'); can.use_nodes = True
    nt = can.node_tree; p = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(CAN_IMG); tex.extension = 'EXTEND'
    uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'UVMap'; nt.links.new(uvn.outputs['UV'], tex.inputs['Vector'])
    nt.links.new(tex.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Metallic'].default_value = 0.35; p.inputs['Roughness'].default_value = 0.28
    Wd, D, h = 0.5, 0.27, 0.09
    parts = [gbox('tray', -D / 2, D / 2, -Wd / 2, Wd / 2, 0, h, card, bevel=0.003)]
    for row in range(3):
        for c in range(6):
            ca, cb = -D / 2 + 0.045 + row * 0.09, -Wd / 2 + 0.042 + c * 0.083
            parts.append(can_mesh('can', ca, cb, h * 0.35, 0.036, 0.17, can))
    parts.append(text('ULTRA', 0.02, -(D / 2 + 0.0008), h / 2 + 0.003, 0.034, ink, depth=0.0006))   # Blender's axes: the front is -y
    for x in (0.004, 0.011, 0.018):
        parts.append(gbox('mark', D / 2, D / 2 + 0.002, -0.2 + x, -0.2 + x + 0.004, 0.02, 0.07, claw))
    return parts, 0.27


def bed():
    wood = mat('wood', hexc('#7a5434'), rough=0.35, coat=0.5)
    wood2 = mat('wood2', hexc('#5c3d24'), rough=0.4, coat=0.4)
    sheet = mat('sheet', hexc('#eef1f5'), rough=0.8)
    pillow = mat('pillow', hexc('#f7f8fa'), rough=0.85)
    L, Wd = 1.0, 0.66
    parts = [gbox('frame', -L / 2, L / 2, -Wd / 2, Wd / 2, 0.07, 0.17, wood, bevel=0.01),
             gbox('mattress', -L / 2 + 0.02, L / 2 - 0.02, -Wd / 2 + 0.02, Wd / 2 - 0.02, 0.17, 0.26, sheet, bevel=0.03, seg=4),
             gbox('pillow', -L / 2 + 0.07, -L / 2 + 0.3, -Wd / 2 + 0.1, Wd / 2 - 0.1, 0.25, 0.33, pillow, bevel=0.035, seg=4),
             gbox('head', -L / 2 - 0.04, -L / 2 + 0.02, -Wd / 2 - 0.03, Wd / 2 + 0.03, 0, 0.5, wood2, bevel=0.015),
             gbox('foot', L / 2 - 0.02, L / 2 + 0.04, -Wd / 2 - 0.03, Wd / 2 + 0.03, 0, 0.3, wood2, bevel=0.012)]
    for a in (-L / 2 + 0.03, L / 2 - 0.03):
        for b in (-Wd / 2 + 0.03, Wd / 2 - 0.03):
            parts.append(gbox('leg', a - 0.025, a + 0.025, b - 0.025, b + 0.025, 0, 0.08, wood2, bevel=0.005))
    return parts, 0.5


def oldpc():
    """a beige 1998 computer on a small desk: CRT monitor, tower, keyboard, mouse (the screen's picture is the game's)"""
    beige = mat('beige', hexc('#d8cfb8'), rough=0.55, coat=0.15)
    beige2 = mat('beige2', hexc('#c4baa0'), rough=0.6)
    darkp = mat('darkp', hexc('#2b2b2e'), rough=0.5)
    glass = mat('glass', hexc('#10141c'), rough=0.08, coat=1.0)
    keys = mat('keys', hexc('#e8e2d0'), rough=0.6)
    led = mat('led', hexc('#3fd060'), rough=0.3, emit=hexc('#20a040'))
    wood = mat('wood', hexc('#8a6440'), rough=0.4, coat=0.4)
    wood2 = mat('wood2', hexc('#6b4a2c'), rough=0.45)
    parts = []
    # the desk: 0.62 wide (b), 0.42 deep (a), top at 0.36
    parts.append(gbox('desktop', -0.21, 0.21, -0.31, 0.31, 0.33, 0.36, wood, bevel=0.006))
    for a0 in (-0.19, 0.17):
        for b0 in (-0.29, 0.27):
            parts.append(gbox('leg', a0, a0 + 0.025, b0, b0 + 0.025, 0, 0.33, wood2, bevel=0.003))
    parts.append(gbox('shelf', -0.18, 0.18, -0.28, 0.28, 0.08, 0.1, wood2, bevel=0.003))
    # the monitor: a bezel box, the tube's back narrowing behind it, a foot
    z0 = 0.375
    parts.append(gbox('foot', -0.1, 0.04, -0.07, 0.07, 0.36, z0, beige2, bevel=0.004))
    parts.append(gbox('bezel', -0.02, 0.06, -0.13, 0.13, z0, z0 + 0.22, beige, bevel=0.01))
    parts.append(gbox('tube', -0.17, -0.02, -0.1, 0.1, z0 + 0.02, z0 + 0.19, beige2, bevel=0.03, seg=4))
    parts.append(gbox('glass', 0.059, 0.062, -0.105, 0.105, z0 + 0.04, z0 + 0.2, glass, bevel=0.002, seg=2))
    parts.append(gbox('chin', 0.058, 0.064, 0.07, 0.1, z0 + 0.012, z0 + 0.03, darkp, bevel=0.002, seg=2))
    parts.append(gbox('mled', 0.06, 0.066, 0.105, 0.113, z0 + 0.018, z0 + 0.026, led))
    # the tower beside it on the desk
    parts.append(gbox('tower', -0.17, 0.07, -0.29, -0.17, 0.36, 0.66, beige, bevel=0.008))
    parts.append(gbox('cdrom', 0.069, 0.074, -0.28, -0.18, 0.6, 0.625, beige2, bevel=0.002, seg=2))
    parts.append(gbox('floppy', 0.069, 0.074, -0.27, -0.19, 0.57, 0.582, beige2, bevel=0.002, seg=2))
    parts.append(gbox('fslot', 0.073, 0.076, -0.255, -0.205, 0.574, 0.578, darkp))
    parts.append(gbox('power', 0.069, 0.076, -0.245, -0.215, 0.42, 0.44, beige2, bevel=0.003, seg=2))
    parts.append(gbox('tled', 0.07, 0.077, -0.205, -0.195, 0.46, 0.468, led))
    # the keyboard and the mouse
    parts.append(gbox('keyboard', 0.08, 0.2, -0.15, 0.13, 0.36, 0.38, beige2, bevel=0.006))
    for r in range(4):
        for c in range(12):
            parts.append(gbox('key', 0.09 + r * 0.026, 0.11 + r * 0.026, -0.14 + c * 0.0225, -0.122 + c * 0.0225, 0.38, 0.388, keys, bevel=0.002, seg=1))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=0.03, location=G(0.15, 0.2, 0.37))
    m = bpy.context.object; m.scale = (0.8, 1.2, 0.45); m.data.materials.append(beige); parts.append(m)
    return parts, 0.66


def arcade(cols=('#8f6ad8', '#4a2fb0', '#ff5fb0', '#802050')):
    """a Konfektes 98 arcade cabinet: lilac body, a slanted screen (its picture is the game's), a lit marquee, buttons"""
    body = mat('body', hexc(cols[0]), rough=0.35, coat=0.5)
    side = mat('side', hexc(cols[1]), rough=0.4, coat=0.4)
    black = mat('black', hexc('#141018'), rough=0.3, coat=0.8)
    trim = mat('trim', hexc(cols[2]), rough=0.3, emit=hexc(cols[3]))
    btnr = mat('btnr', hexc('#ff4f7a'), rough=0.25, coat=0.8)
    btny = mat('btny', hexc('#ffd23f'), rough=0.25, coat=0.8)
    btnb = mat('btnb', hexc('#5aa8ff'), rough=0.25, coat=0.8)
    stick = mat('stick', hexc('#1d1a22'), rough=0.3)
    parts = []
    W, D = 0.42, 0.4
    parts.append(gbox('base', -D / 2, D / 2, -W / 2, W / 2, 0, 0.5, body, bevel=0.01))
    parts.append(gbox('panel', 0.0, D / 2 + 0.08, -W / 2, W / 2, 0.5, 0.56, side, bevel=0.01))
    parts.append(gbox('screenbox', -D / 2, 0.06, -W / 2, W / 2, 0.56, 1.02, body, bevel=0.01))
    parts.append(gbox('top', -D / 2, 0.14, -W / 2, W / 2, 1.02, 1.18, side, bevel=0.012))
    parts.append(gbox('marquee', 0.139, 0.146, -W / 2 + 0.03, W / 2 - 0.03, 1.04, 1.16, trim, bevel=0.004, seg=2))
    parts.append(gbox('bezel', 0.059, 0.064, -W / 2 + 0.03, W / 2 - 0.03, 0.6, 0.98, black, bevel=0.004, seg=2))
    for sx in (-1, 1):
        parts.append(gbox('sidepanel', -D / 2 - 0.004, D / 2 + 0.08, sx * W / 2 - (0.012 if sx > 0 else 0), sx * W / 2 + (0.012 if sx < 0 else 0), 0, 1.18, side, bevel=0.006))
    parts.append(rod('stick', (0.14, 0.09, 0.56), (0.14, 0.09, 0.62), 0.008, stick, verts=10))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.018, location=G(0.14, 0.09, 0.625)); b = bpy.context.object; b.data.materials.append(btnr); parts.append(b)
    for i, m in enumerate((btnr, btny, btnb)):
        parts.append(disc('btn%d' % i, 0.13 + (i % 2) * 0.03, -0.02 - i * 0.045, 0.56, 0.572, 0.016, m, verts=16))
    parts.append(gbox('coin', D / 2 - 0.003, D / 2 + 0.002, -0.03, 0.03, 0.3, 0.36, black, bevel=0.003, seg=2))
    parts.append(gbox('coinslot', D / 2 + 0.002, D / 2 + 0.004, -0.004, 0.004, 0.315, 0.345, trim))
    return parts, 1.18


def arcademines():
    """the same cabinet for Mīnas 98, in Windows 98 teal with a yellow marquee (the game is smaller: scaled in the gallery)"""
    return arcade(('#2f9e98', '#16605c', '#ffd23f', '#806010'))


def pinball():
    """a pinball machine: legs, the cabinet with its glass (the table's picture is the game's), the backbox, plunger and buttons"""
    body = mat('body', hexc('#1f4fd0'), rough=0.35, coat=0.5)
    side = mat('side', hexc('#12307e'), rough=0.4, coat=0.4)
    black = mat('black', hexc('#0b1030'), rough=0.3, coat=0.8)
    chrome = mat('chrome', hexc('#c8ccd4'), rough=0.18, metal=1.0)
    trim = mat('trim', hexc('#ff8a1f'), rough=0.3, emit=hexc('#803a08'))
    btn = mat('btn', hexc('#ffd23f'), rough=0.25, coat=0.8)
    red = mat('red', hexc('#e0303a'), rough=0.25, coat=0.8)
    parts = []
    L, W = 0.45, 0.22                                                 # half length (a, to the player), half width (b)
    for a0 in (-L + 0.05, L - 0.05):
        for b0 in (-W + 0.03, W - 0.03):
            parts.append(rod('leg', (a0, b0, 0), (a0, b0, 0.56), 0.016, chrome, verts=10))
            parts.append(disc('foot', a0, b0, 0, 0.012, 0.026, chrome, verts=12))
    parts.append(gbox('cab', -L, L, -W, W, 0.54, 0.72, body, bevel=0.01))
    for sx in (-1, 1):
        parts.append(gbox('rail', -L, L, sx * W - (0.02 if sx > 0 else 0), sx * W + (0.02 if sx < 0 else 0), 0.72, 0.78, chrome, bevel=0.004, seg=2))
        parts.append(gbox('flipbtn', L - 0.1, L - 0.07, sx * (W + 0.004) - 0.004, sx * (W + 0.004) + 0.004, 0.66, 0.69, btn, bevel=0.002, seg=2))
    parts.append(gbox('apron', L - 0.02, L, -W, W, 0.72, 0.77, side, bevel=0.004))
    parts.append(gbox('glassfloor', -L + 0.06, L - 0.02, -W + 0.02, W - 0.02, 0.72, 0.73, black))
    # the backbox at the far end, its glass facing the player
    parts.append(gbox('backbox', -L - 0.02, -L + 0.08, -W, W, 0.72, 1.4, body, bevel=0.01))
    parts.append(gbox('backtop', -L - 0.03, -L + 0.11, -W - 0.01, W + 0.01, 1.4, 1.44, side, bevel=0.006))
    parts.append(gbox('backglass', -L + 0.079, -L + 0.084, -W + 0.025, W - 0.025, 0.98, 1.37, black, bevel=0.002, seg=2))
    parts.append(gbox('speaker', -L + 0.079, -L + 0.084, -W + 0.025, W - 0.025, 0.8, 0.94, side, bevel=0.002, seg=2))
    parts.append(gbox('marquee', -L + 0.08, -L + 0.086, -W + 0.04, W - 0.04, 0.75, 0.78, trim))
    # the plunger at the front, right of the player, and the coin door
    parts.append(rod('plunger', (L, -W + 0.05, 0.66), (L + 0.06, -W + 0.05, 0.66), 0.008, chrome, verts=10))
    parts.append(disc('knob', L + 0.06, -W + 0.05, 0.645, 0.675, 0.016, red, verts=14))
    parts.append(gbox('coin', L - 0.003, L + 0.004, -0.07, 0.07, 0.57, 0.68, black, bevel=0.003, seg=2))
    parts.append(gbox('coinslot', L + 0.004, L + 0.006, -0.004, 0.004, 0.6, 0.64, trim))
    return parts, 1.44


BUILD = {'arcade': arcade, 'arcademines': arcademines, 'pinball': pinball, 'oldpc': oldpc, 'machine': machine, 'chair': chair, 'table': table, 'easel': easel, 'gramophone': gramophone, 'monsterbox': monsterbox, 'bed': bed}
TILE_MIN = {}


def bake_export(name, objs, H):
    sc = bpy.context.scene
    # every part made real (modifiers, text) and joined into one mesh
    dg = bpy.context.evaluated_depsgraph_get()
    meshes = []
    for o in objs:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), depsgraph=dg)
        me.transform(o.matrix_world)
        ob = bpy.data.objects.new('m_' + o.name, me); sc.collection.objects.link(ob)
        meshes.append(ob)
    for o in list(sc.objects):
        if o not in meshes and o.type in ('MESH', 'FONT', 'CURVE'): o.hide_render = True
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    low = bpy.context.view_layer.objects.active
    bm = bmesh.new(); bm.from_mesh(low.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0002)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(low.data); bm.free()
    # the bake's own unwrap in its own layer (a part's picture mapping, the can's, stays as it is)
    bl = low.data.uv_layers.new(name='BakeUV'); low.data.uv_layers.active = bl
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(50), island_margin=0.006, area_weight=1.0)
    bpy.ops.object.mode_set(mode='OBJECT')
    # the bake: the room's light (a soft grey sky, a key from the front left above, a fill)
    img = bpy.data.images.new(name + 'Tex', TEX, TEX, alpha=True)
    for m in low.data.materials:
        n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.5, 0.48, 0.46, 1); bg.inputs['Strength'].default_value = 0.7
    for nm, loc, e in (('key', (-0.9, -1.2, 1.6), 55), ('fill', (1.1, -0.9, 0.7), 18), ('top', (0, 0, 2.2), 30)):
        L = bpy.data.lights.new(nm, 'AREA'); L.energy = e; L.size = 1.2
        o = bpy.data.objects.new(nm, L); sc.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, H / 2)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.select_all(action='DESELECT'); low.select_set(True); bpy.context.view_layer.objects.active = low
    bpy.ops.object.bake(type='COMBINED', pass_filter={'DIRECT', 'INDIRECT', 'DIFFUSE', 'GLOSSY', 'EMIT'}, margin=12)
    img.filepath_raw = '%s/%s-tex.png' % (OUT, name); img.file_format = 'PNG'; img.save()
    me = low.data
    q, uq = 4000, 8192
    uvl = me.uv_layers.active.data
    verts, uvs, idx, nrm, seen = [], [], [], [], {}
    for p in me.polygons:
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            u, v = uvl[li].uv
            key = (round(-co.y * q), round(-co.x * q), round(co.z * q), round(u * uq), round(v * uq))
            if key not in seen:
                seen[key] = len(verts) // 3; verts += key[:3]; uvs += [key[3], uq - key[4]]
            idx.append(seen[key])
        n = p.normal
        nrm += [round(-n.y * 127), round(-n.x * 127), round(n.z * 127)]
    json.dump({'q': q, 'uq': uq, 'v': verts, 't': uvs, 'f': idx, 'n': nrm}, open('%s/%s-mesh.json' % (OUT, name), 'w'), separators=(',', ':'))
    print('PROP', name, len(verts) // 3, 'verts', len(idx) // 3, 'tris')


for name in NAMES:
    clean()
    objs, H = BUILD[name]()
    bake_export(name, objs, H)
