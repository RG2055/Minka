"""Žurka Miltons (the dancing rat of the meme): "Dancing Rat" by toothboi (Sketchfab, CC BY 4.0), a
Mixamo rig, in red-black-white high-top sneakers made here. Two loops, posed here frame by frame:
  the dance, as the meme's (its 2.4 s loop: four beats at 100 a minute): on every beat it hops out to
  a wide squat and flings one arm out to the side (left, right, left, right), turned away from it;
  between the beats it hops its feet together, the paws back at its chest, turning on;
  standing: the arms down, breathing, its weight from foot to foot.
Rendered as Doom's monsters are: 8 sides (0 = its face, then round by its left, 45° a step), the
dance's DANCE frames then the standing IDLE frames, on a clear ground, for scripts/build-dancing-rat.py.

    Blender -b -P scripts/blender/dancing_rat.py -- FLAIR.fbx OUT_DIR [size, 144] [--check]

FLAIR.fbx is the model's own file (source/Flair.fbx in its download, its own animation a breakdance
flair, not used; its texture in ../textures). World axes after the import: z up, the rat faces -y, its
left is +x; the rig's own (Mixamo) axes: y up, z forward, x its left.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
FBX, OUT = argv[0], argv[1]
RES = int(argv[2]) if len(argv) > 2 and argv[2].isdigit() else 144
CHECK = '--check' in argv
DANCE, IDLE = 32, 8                 # the dance: 4 beats, 8 frames a beat; standing: 8 frames
FRAMES = DANCE + IDLE
ORTHO = 7.4                        # metres across the picture

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX)
sc = bpy.context.scene
arm = bpy.data.objects['Armature']
rat = bpy.data.objects['Rat']
for o in list(bpy.data.objects):
    if o.type in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o, do_unlink=True)
# its own dance is let go: ours is posed frame by frame
if arm.animation_data: arm.animation_data.action = None
for pb in arm.pose.bones:
    pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)

# the texture: the file names a path on its maker's computer
tex = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(FBX))), 'textures', 'Handle1_diff.png')
for img in bpy.data.images:
    img.filepath = tex; img.reload()
for m in rat.data.materials:
    if not m.use_nodes: continue
    p = m.node_tree.nodes.get('Principled BSDF')
    # all of it solid: the texture's alpha made it see-through in places
    for l in list(m.node_tree.links):
        if l.to_socket.name == 'Alpha': m.node_tree.links.remove(l)
    if hasattr(m, 'blend_method'): m.blend_method = 'OPAQUE'
    if hasattr(m, 'surface_render_method'): m.surface_render_method = 'DITHERED'
    if p:
        p.inputs['Alpha'].default_value = 1.0
        p.inputs['Roughness'].default_value = 0.78
        if 'Specular IOR Level' in p.inputs: p.inputs['Specular IOR Level'].default_value = 0.25

for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
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
sc.render.filter_size = 0.9


def mat(name, hexcol, rough=0.6):
    h = hexcol.lstrip('#'); col = tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = col + (1,)
    p.inputs['Roughness'].default_value = rough
    return m


RED, BLACK, WHITE, LACE = mat('red', '#c8102e', 0.5), mat('black', '#151515', 0.45), mat('white', '#f4f2ee', 0.55), mat('lace', '#ffffff', 0.7)
AW = arm.matrix_world


def bone_world(name, tail=False):
    b = arm.data.bones[name]
    return AW @ (b.tail_local if tail else b.head_local)


# ── the sneakers: a high-top (red toe and heel, black over the middle and the collar, white sole and
# laces) round each foot, weighted to the foot and toe bones so it moves as the foot does ──
def sneaker(L):
    foot, toe, toe_end = 'mixamorig:%sFoot' % L, 'mixamorig:%sToeBase' % L, 'mixamorig:%sToe_End' % L
    ankle, tip = bone_world(foot), bone_world(toe_end)
    fwd = Vector((tip.x - ankle.x, tip.y - ankle.y, 0)).normalized()
    side = Vector((-fwd.y, fwd.x, 0))
    # along the foot from the heel (s=0) to the toe (s=1): the rat's own foot fits inside
    heel = ankle - fwd * 0.30
    heel.z = 0.0
    length = (tip - heel).dot(fwd) + 0.12
    sole_h, ground = 0.11, -0.04
    # cross sections: (s, half width, top height above the sole, material of that band)
    secs = [(0.0, 0.21, 0.78, RED), (0.16, 0.235, 0.80, RED), (0.36, 0.25, 0.62, BLACK), (0.58, 0.255, 0.42, BLACK),
            (0.76, 0.25, 0.30, RED), (0.92, 0.215, 0.24, RED), (1.0, 0.16, 0.19, RED)]
    bm = bmesh.new()
    rings = []
    for s, hw, top, m in secs:
        c = heel + fwd * (length * s)
        z0 = ground + sole_h
        ring = [bm.verts.new(c + side * (hw * x) + Vector((0, 0, z0 + top * z))) for x, z in
                ((-1, 0), (-1.02, 0.55), (-0.8, 1), (0, 1.04), (0.8, 1), (1.02, 0.55), (1, 0))]
        rings.append((ring, m))
    mats = [RED, BLACK, WHITE, LACE]
    faces = []
    for (a, ma), (b, mb) in zip(rings, rings[1:]):
        for i in range(len(a) - 1):
            f = bm.faces.new((a[i], b[i], b[i + 1], a[i + 1])); f.material_index = mats.index(ma)
            faces.append(f)
        f = bm.faces.new((a[-1], b[-1], b[0], a[0])); f.material_index = 2   # the bottom (hidden by the sole)
    # the collar top stays open at the back (the leg goes in), the toe closed
    f = bm.faces.new(list(reversed(rings[-1][0]))); f.material_index = 0
    f = bm.faces.new(rings[0][0]); f.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('shoe.' + L); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new('shoe.' + L, me); sc.collection.objects.link(o)
    sub = o.modifiers.new('round', 'SUBSURF'); sub.levels = sub.render_levels = 2
    # the sole: white, a little wider than the upper, rounded
    bm = bmesh.new()
    rim = []
    for s in (0.0, 0.08, 0.3, 0.6, 0.85, 0.97, 1.03):
        hw = 0.235 if s < 0.2 else 0.27 if s < 0.9 else 0.2
        c = heel + fwd * (length * s - 0.03)
        rim.append([bm.verts.new(c + side * (hw * x) + Vector((0, 0, ground + sole_h * z))) for x, z in ((-1, 0), (-1, 1), (1, 1), (1, 0))])
    sf = []
    for a, b in zip(rim, rim[1:]):
        for i in range(4): sf.append(bm.faces.new((a[i], b[i], b[(i + 1) % 4], a[(i + 1) % 4])))
    sf.append(bm.faces.new(list(reversed(rim[0])))); sf.append(bm.faces.new(rim[-1]))
    bmesh.ops.recalc_face_normals(bm, faces=sf)
    me2 = bpy.data.meshes.new('sole.' + L); bm.to_mesh(me2); bm.free(); me2.materials.append(WHITE)
    so = bpy.data.objects.new('sole.' + L, me2); sc.collection.objects.link(so)
    sub = so.modifiers.new('round', 'SUBSURF'); sub.levels = sub.render_levels = 2
    # laces: white bars across the black middle, the tongue black behind them
    lace = []
    for k in range(4):
        s = 0.40 + k * 0.08
        c = heel + fwd * (length * s)
        top = [t for t in secs if t[0] <= s][-1]
        nxt = [t for t in secs if t[0] > s][0]
        u = (s - top[0]) / (nxt[0] - top[0])
        z = ground + sole_h + (top[2] * (1 - u) + nxt[2] * u) * 1.04 + 0.02
        bpy.ops.mesh.primitive_cube_add(size=1, location=c + Vector((0, 0, z)))
        lo = bpy.context.object; lo.scale = (0.16, 0.035, 0.025)
        lo.rotation_euler = (0, 0, math.atan2(fwd.y, fwd.x) + math.pi / 2)
        lo.data.materials.append(LACE)
        lace.append(lo)
    parts = [o, so] + lace
    # all of it rides on the foot bone (a stiff shoe: the toe bone is never bent)
    bpy.context.view_layer.update()
    for p in parts:
        mw = p.matrix_world.copy()
        p.parent = arm; p.parent_type = 'BONE'; p.parent_bone = foot
        bpy.context.view_layer.update()
        p.matrix_world = mw
    return parts


SHOES = sneaker('Left') + sneaker('Right')

# the rat's own feet are hidden inside the shoes: shrink them a little so no pink shows through
gi = {g.name: g.index for g in rat.vertex_groups}
for L in ('Left', 'Right'):
    f = gi.get('mixamorig:%sFoot' % L); t = gi.get('mixamorig:%sToeBase' % L)
    ids = [v.index for v in rat.data.vertices if any(g.group in (f, t) and g.weight > 0.35 for g in v.groups)]
    if not ids: continue
    cen = sum((rat.data.vertices[i].co for i in ids), Vector()) / len(ids)
    for i in ids:
        v = rat.data.vertices[i]
        v.co = cen + (v.co - cen) * 0.82

# ── legs on IK (the feet stay on the ground while the hips bounce), feet turned by their targets ──
targets = {}
for L in ('Left', 'Right'):
    foot = 'mixamorig:%sFoot' % L
    t = bpy.data.objects.new('ik.' + L, None); sc.collection.objects.link(t)
    t.matrix_world = AW @ arm.data.bones[foot].matrix_local
    pole = bpy.data.objects.new('pole.' + L, None); sc.collection.objects.link(pole)
    pole.location = bone_world('mixamorig:%sLeg' % L) + Vector(((1 if L == 'Left' else -1) * 0.9, -2.0, 0))   # the knees over the toes
    c = arm.pose.bones['mixamorig:%sLeg' % L].constraints.new('IK')
    c.target = t; c.pole_target = pole; c.chain_count = 2; c.pole_angle = math.radians(-90)
    cr = arm.pose.bones[foot].constraints.new('COPY_ROTATION'); cr.target = t
    targets[L] = (t, t.matrix_world.copy())

# ── the dance: bone rotations about the rig's rest axes (x its left, y up, z forward) ──
REST = {pb.name: arm.data.bones[pb.name].matrix_local.to_3x3() for pb in arm.pose.bones}


def rot(name, axis, deg):
    """turn a bone about an axis given in the rig's rest space (on top of what it has)"""
    pb = arm.pose.bones['mixamorig:' + name]
    R = REST[pb.name]
    q = Quaternion(R.inverted() @ Vector(axis), math.radians(deg))
    pb.rotation_quaternion = pb.rotation_quaternion @ q


X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)


def ease(x):
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, x)))


def keys(u, ks):
    """a value through the loop from keys at the half beats (eased between them)"""
    n = len(ks) - 1
    x = (u % 4.0) / 4.0 * n
    i = int(x)
    return ks[i] + (ks[i + 1] - ks[i]) * ease(x - i)


def pulse(u, at, width=0.36):
    """1 on a beat, falling to 0 a little either side of it (the loop wraps)"""
    d = abs(((u - at + 2) % 4.0) - 2)
    return math.cos(math.pi / 2 * d / width) ** 2 if d < width else 0.0


def clear():
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)


def feet(spread, turn_out, lift):
    """the feet: out to the sides (m from where they stand), turned out (°), up off the ground (m)"""
    for L, sgn in (('Left', 1), ('Right', -1)):
        t, rest = targets[L]
        pos = rest.translation + Vector((sgn * spread, 0, lift))
        rz = Matrix.Rotation(math.radians(sgn * turn_out), 4, 'Z')
        t.matrix_world = Matrix.Translation(pos) @ rz @ rest.to_3x3().to_4x4()


def hips_at(side_m, drop_m):
    hips = arm.pose.bones['mixamorig:Hips']
    hips.location = REST['mixamorig:Hips'].inverted() @ Vector((side_m * 100, -drop_m * 100, 0))


def arm_pose(L, fling, tuck):
    """an arm between the paw at its chest (tuck 1) and flung out to the side (fling 1); both 0: down"""
    sgn = 1 if L == 'Left' else -1
    # the upper arm: from down at its side out to level (fling) or forward-down with the elbow out (tuck)
    rot(L + 'Arm', Z, sgn * (-14 + 66 * fling + 18 * tuck))
    rot(L + 'Arm', X, -40 * tuck - 8 * fling)
    rot(L + 'ForeArm', X, -118 * tuck * (1 - fling) - 10 * fling)
    rot(L + 'ForeArm', Z, sgn * (-18 * tuck + 8 * fling))
    rot(L + 'Hand', Z, sgn * (14 * fling))
    for k in (1, 2, 3):
        rot(L + 'HandIndex%d' % k, X, 18 + 22 * tuck)


def pose(f):
    clear()
    if f >= DANCE:
        return stand(f - DANCE)
    u = f / (DANCE / 4)                        # 0..4, the beats
    # out wide on the beat, together between; a hop each way (both feet up halfway)
    wide = 0.5 + 0.5 * math.cos(2 * math.pi * u)
    hop = abs(math.sin(2 * math.pi * u))
    feet(-0.16 + 0.62 * wide, 26 * wide, 0.12 * hop)
    hips_at(0, 0.42 * wide - 0.05 * hop)
    # turned away from the arm it flings: to its right on beats 1 and 3, its left on 2 and 4, the
    # last turn the most (as the meme's: almost side-on before it turns back)
    twist = keys(u, [-26, -8, 24, 32, -30, 16, 30, 48, -26])
    rot('Hips', Y, twist * 0.55)
    rot('Spine', Y, twist * 0.15); rot('Spine1', Y, twist * 0.15); rot('Spine2', Y, twist * 0.1)
    rot('Spine1', X, -6 + 10 * wide)           # leaning in over the squat
    rot('Spine', Z, -4 * math.sin(math.pi * u))
    rot('Neck', Y, twist * 0.18)
    rot('Head', Y, twist * 0.22)
    rot('Head', X, -4 + 6 * wide)
    rot('Head', Z, 5 * math.sin(math.pi * u + 0.6))
    # the arms: left out on beats 1 and 3, right on 2 and 4; the other at its chest
    fl = pulse(u, 0) + pulse(u, 2)
    fr = pulse(u, 1) + pulse(u, 3)
    arm_pose('Left', fl, 1 - fl * 0.9)
    arm_pose('Right', fr, 1 - fr * 0.9)
    bpy.context.view_layer.update()


def stand(i):
    """standing, arms down: breathing, the weight shifting a little from foot to foot"""
    ph = i / IDLE * 2 * math.pi
    feet(0.0, 8, 0.0)
    hips_at(0.05 * math.sin(ph), 0.02 + 0.015 * math.cos(2 * ph))
    rot('Hips', Z, -2.5 * math.sin(ph))
    rot('Spine1', X, -1.5 * math.cos(2 * ph)); rot('Spine2', X, -1.5 * math.cos(2 * ph))
    rot('Spine', Z, 2 * math.sin(ph))
    rot('Head', Y, 8 * math.sin(ph + 0.8))
    rot('Head', X, 2 * math.cos(2 * ph))
    for L in ('Left', 'Right'):
        arm_pose(L, 0.0, 0.0)
        rot(L + 'Arm', Z, (1 if L == 'Left' else -1) * -16)       # down along its sides
        rot(L + 'Arm', X, -6 + 2 * math.cos(2 * ph))
        rot(L + 'ForeArm', X, -16)
    bpy.context.view_layer.update()


# ── light: a warm key from the upper left front, a cool rim behind, a soft fill ──
for name, loc, energy, col, size in (('key', (-4, -6, 7), 900, (1.0, 0.96, 0.9), 4),
                                     ('rim', (4, 6, 5), 700, (0.85, 0.9, 1.0), 3),
                                     ('fill', (6, -4, 1.5), 280, (1.0, 0.97, 0.95), 6)):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy; ld.color = col; ld.size = size
    lo = bpy.data.objects.new(name, ld); sc.collection.objects.link(lo); lo.location = loc
    lo.rotation_euler = (Vector((0, 0, 2.0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
LIGHTS = [o for o in sc.objects if o.type == 'LIGHT']
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.32, 0.31, 0.3, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6

cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = ORTHO
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
MID = Vector((0, 0, 3.15))


def place(k):
    """side k: the camera round by the rat's left, 45° a step, from its face (-y); the lights go
    round with it, so every side is lit the same way"""
    a = math.radians(45 * k)
    d = Vector((math.sin(a), -math.cos(a), 0))
    cam.location = MID + d * 20 + Vector((0, 0, 1.6))
    cam.rotation_euler = (MID - cam.location).to_track_quat('-Z', 'Y').to_euler()
    R = Matrix.Rotation(a, 4, 'Z')
    for lo, base in zip(LIGHTS, BASE):
        lo.location = R @ base
        lo.rotation_euler = (Vector((0, 0, 2.0)) - lo.location).to_track_quat('-Z', 'Y').to_euler()


BASE = [lo.location.copy() for lo in LIGHTS]
os.makedirs(OUT, exist_ok=True)
frames = list(range(0, DANCE, 2)) + [DANCE, DANCE + 4] if CHECK else range(FRAMES)
sides = (0, 2) if CHECK else range(8)
for f in frames:
    pose(f)
    for k in sides:
        place(k)
        sc.render.filepath = os.path.join(OUT, 'rat-%d-%d.png' % (f, k))
        bpy.ops.render.render(write_still=True)
print('done', len(frames) * len(sides))
