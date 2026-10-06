"""Kaķis ar balonu (the hand drawing "Kaķis ar balonu" in the gallery) as a model: a black cat curled
round on its back, its tail round its side, a paw up to a pink balloon's string, drawn with ink lines
(Freestyle) as the drawing is. Alive: it breathes and rocks, turns and tilts its head, flicks an
ear, blinks once, tugs the string with its front paw, paddles the air with the others, waves its
tail; the balloon sways after the paw. Rendered as Doom's monsters are: 8 sides (0 = as the drawing
shows it, then round by the cat's left, 45° a step), 16 frames of one loop, on a clear ground, at
the gallery's own size (the ink lines a pixel), for scripts/build-balloon-cat.py.

    Blender -b -P scripts/blender/balloon_cat.py -- OUT_DIR [size, 136]

Blender's axes: x right, z up, the drawing seen from -y.
"""
import math
import sys

import bpy
from mathutils import Euler, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
RES = int(argv[1]) if len(argv) > 1 else 136
ORTHO = 0.95                       # metres across the picture
N = 16                             # frames of the loop


def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x = sc.render.resolution_y = RES
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    # ink lines as the drawing's
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = max(1.0, RES / 136)
    if not bpy.context.view_layer.freestyle_settings.linesets:
        bpy.context.view_layer.freestyle_settings.linesets.new('ink')
    for l in bpy.context.view_layer.freestyle_settings.linesets:
        l.select_by_visibility = True
        l.select_silhouette = True; l.select_border = True; l.select_crease = True
        if not l.linestyle: l.linestyle = bpy.data.linestyles.new('ink')
        l.linestyle.color = (0.04, 0.04, 0.045)
        l.linestyle.thickness = max(1.0, RES / 136)
    return sc


def mat(name, col, rough=0.55, emit=0.0, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = col + (1,)
    p.inputs['Roughness'].default_value = rough
    if sheen and 'Sheen Weight' in p.inputs: p.inputs['Sheen Weight'].default_value = sheen
    if emit:
        p.inputs['Emission Color'].default_value = col + (1,)
        p.inputs['Emission Strength'].default_value = emit
    return m


def hexc(h):
    h = h.lstrip('#'); return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


sc = clean()
CAT = bpy.data.collections.new('cat'); sc.collection.children.link(CAT)
FUR = mat('fur', hexc('#2a2a2f'), 0.82, sheen=0.25)
INNER = mat('inner', hexc('#3a3238'), 0.7)
PINK = mat('pads', hexc('#e88aa6'), 0.5)
EYE = mat('eye', hexc('#d8e070'), 0.25, emit=0.35)
PUPIL = mat('pupil', hexc('#101010'), 0.2)
BALLOON = mat('balloon', hexc('#f290b6'), 0.5)
STRING = mat('string', hexc('#8a8a90'), 0.6)


def link(o):
    for c in list(o.users_collection): c.objects.unlink(o)
    CAT.objects.link(o)
    return o


def tube(name, pts, radii, m, res=12):
    """a round tube along points, its radius from point to point"""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = 1.0; cu.bevel_resolution = 4; cu.resolution_u = res; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for bp, p, r in zip(sp.bezier_points, pts, radii):
        bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'; bp.radius = r
    o = bpy.data.objects.new(name, cu); CAT.objects.link(o)
    cu.materials.append(m)
    return o


def ball(name, c, r, m, scale=(1, 1, 1), seg=24, rot=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=c, segments=seg, ring_count=seg // 2)
    o = bpy.context.object; o.name = name; o.scale = scale
    if rot is not None: o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = rot
    bpy.ops.object.shade_smooth()
    o.data.materials.append(m)
    return link(o)


def cone(name, base, tip, r, m):
    d = Vector(tip) - Vector(base)
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0.002, depth=d.length, location=(Vector(base) + Vector(tip)) / 2, vertices=12)
    o = bpy.context.object; o.name = name
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    bpy.ops.object.shade_smooth()
    o.data.materials.append(m)
    return link(o)


NECK = Vector((0.03, -0.01, 0.11))
MID = Vector((-0.03, 0.0, 0.0))


def build(f):
    """the cat at frame f of the loop: every part placed anew"""
    for o in list(CAT.objects): bpy.data.objects.remove(o, do_unlink=True)
    ph = f / N * 2 * math.pi
    s1 = math.sin(ph)
    # the whole cat rocks and bobs a little; its head turns and tilts on the neck
    rock = Euler((0, math.radians(5) * s1, math.radians(3) * math.sin(ph + 0.8))).to_matrix()
    bob = Vector((0, 0, 0.012 * math.sin(ph + 0.4)))
    W = lambda p: MID + rock @ (Vector(p) - MID) + bob
    hrot = Euler((math.radians(-6) * math.sin(ph * 2 + 0.5), math.radians(9) * math.sin(ph + 1.6), math.radians(16) * s1)).to_matrix()
    Hd = lambda p: W(NECK + hrot @ (Vector(p) - NECK))
    hq = (rock @ hrot).to_quaternion()
    breath = 1 + 0.03 * math.sin(ph * 2)

    tube('body', [W(p) for p in [(0.03, 0.0, 0.10), (-0.08, 0.01, 0.06), (-0.135, 0.01, -0.04), (-0.09, 0.0, -0.13), (0.01, 0.0, -0.16)]],
         [r * breath for r in (0.072, 0.08, 0.082, 0.078, 0.066)], FUR)
    # the head: turned, an ear flicking now and then, a blink near the loop's end
    ball('head', Hd((0.045, -0.025, 0.16)), 0.068, FUR, (1.08, 0.95, 0.92), rot=hq)
    ball('muzzle', Hd((0.05, -0.078, 0.135)), 0.03, FUR, (1.25, 0.8, 0.8), rot=hq)
    flick = math.radians(28) * max(0.0, math.sin(ph * 2 - 1.0)) ** 6
    for side, base, tip, r in (('l', (0.0, -0.02, 0.205), (-0.02, -0.03, 0.27), 0.03), ('r', (0.09, -0.02, 0.2), (0.12, -0.03, 0.26), 0.03)):
        tp = Vector(tip)
        if side == 'r': tp = Vector(base) + Euler((0, flick, 0)).to_matrix() @ (tp - Vector(base))
        cone('ear.' + side, Hd(base), Hd(tp), r, FUR)
        ib = Vector(base) + Vector((0, -0.014, 0.003)); it = tp + Vector((0, -0.012, -0.012)) + (Vector(base) - tp) * 0.15
        cone('ear.%si' % side, Hd(ib), Hd(it), r * 0.56, INNER)
    blink = 0.12 if f in (N - 3, N - 2) else 1.0
    for side, x in (('l', 0.018), ('r', 0.078)):
        ball('eye.' + side, Hd((x, -0.084, 0.17)), 0.015, EYE, (1.25, 0.6, blink), 20, rot=hq)
        if blink == 1.0: ball('pupil.' + side, Hd((x + 0.002, -0.093, 0.17)), 0.006, PUPIL, (0.7, 0.4, 1.6), 12, rot=hq)
    ball('tongue', Hd((0.058, -0.098, 0.118 - 0.004 * max(0, s1))), 0.011, PINK, (1.0, 0.6, 0.7), 16, rot=hq)
    ball('nose', Hd((0.05, -0.105, 0.143)), 0.007, PINK, (1.3, 0.7, 0.8), 12, rot=hq)
    # the legs: the front one tugs the string, the other paddles, the hind ones kick in turn
    tug = Vector((0.012 * math.sin(ph * 2), 0, 0.028 * s1))
    paddle = Vector((0.026 * math.cos(ph * 2), -0.006 * math.sin(ph * 2), 0.024 * math.sin(ph * 2)))
    kick = lambda o: Vector((0.03 * math.cos(ph + o), 0, 0.03 * math.sin(ph + o)))
    legs = [((0.05, -0.03, 0.07), (0.12, -0.06, 0.15), tug), ((-0.02, -0.03, 0.05), (-0.02, -0.08, -0.03), paddle),
            ((0.0, -0.03, -0.13), (0.12, -0.07, -0.06), kick(0)), ((0.02, -0.02, -0.17), (0.13, -0.05, -0.17), kick(math.pi))]
    paw = None
    for i, (a, b, d) in enumerate(legs):
        a, b = Vector(a), Vector(b) + d
        knee = (a + b) / 2 + Vector((0.0, -0.02, 0.02 if i != 1 else -0.02))
        tube('leg%d' % i, [W(a), W(knee), W(b)], [0.03, 0.026, 0.022], FUR)
        ball('pad%d' % i, W(b + (b - a).normalized() * 0.006), 0.016, PINK, (1, 0.7, 1), 16)
        if i == 0: paw = W(b + (b - a).normalized() * 0.008)
    # the tail: a wave running down it
    base = [(-0.08, 0.01, -0.15), (-0.17, 0.03, -0.22), (-0.27, 0.04, -0.14), (-0.3, 0.04, -0.01), (-0.26, 0.03, 0.09), (-0.2, 0.02, 0.12)]
    pts = []
    for i, p in enumerate(base):
        a = 0.008 * i * i / 2
        w = math.sin(ph - i * 0.9)
        pts.append(W(Vector(p) + Vector((a * w, 0.4 * a * math.cos(ph - i * 0.9), 0.6 * a * w))))
    tube('tail', pts, [0.03, 0.028, 0.026, 0.024, 0.022, 0.018], FUR)
    # the balloon on its string from the paw, swaying after it
    sway = Euler((math.radians(5) * math.sin(ph - 0.9), math.radians(9) * math.sin(ph - 1.4), 0)).to_matrix()
    B = lambda v: paw + sway @ Vector(v)
    tube('string', [B((0, 0, 0)), B((0.03, 0.01, 0.06)), B((0.07, 0.025, 0.12)), B((0.095, 0.03, 0.172))], [0.004] * 4, STRING, 16)
    ball('balloon', B((0.1, 0.03, 0.31)), 0.1, BALLOON, (1.0, 0.95, 1.28), 40, rot=sway.to_quaternion())
    cone('knot', B((0.095, 0.03, 0.17)), B((0.098, 0.03, 0.188)), 0.012, BALLOON)


# ---- light: soft key from the upper left, a cool rim behind, a fill
for name, kind, loc, energy, col, size in (
        ('key', 'AREA', (-0.6, -0.9, 1.0), 38, (1.0, 0.96, 0.9), 0.8),
        ('rim', 'AREA', (0.6, 0.9, 0.6), 45, (0.8, 0.88, 1.0), 0.6),
        ('fill', 'AREA', (0.9, -0.6, -0.2), 18, (1.0, 0.95, 0.95), 1.0)):
    ld = bpy.data.lights.new(name, kind); ld.energy = energy; ld.color = col; ld.size = size
    lo = bpy.data.objects.new(name, ld); sc.collection.objects.link(lo); lo.location = loc
    lo.rotation_mode = 'QUATERNION'; lo.rotation_quaternion = (Vector((0, 0, 0.12)) - Vector(loc)).to_track_quat('-Z', 'Y')
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.5, 0.52, 0.56, 1); world.node_tree.nodes['Background'].inputs[1].default_value = 0.6

# ---- the camera: orthographic, round the cat, a little above
cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cd.ortho_scale = ORTHO
cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
CENTER = Vector((0.0, 0.0, 0.17))
EL = math.radians(6)
for f in range(N):
    build(f)
    for k in range(8):
        az = k * math.pi / 4                         # round by the cat's left: from -y towards -x
        d = Vector((-math.sin(az) * math.cos(EL), -math.cos(az) * math.cos(EL), math.sin(EL)))
        cam.location = CENTER + d * 3.0
        cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = (-d).to_track_quat('-Z', 'Y')
        sc.render.filepath = '%s/fc-%d-%d.png' % (OUT, f, k)
        bpy.ops.render.render(write_still=True)
print('done', OUT)
