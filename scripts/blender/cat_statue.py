"""Two cats as one marble group in Michelangelo's manner: Špricētājs sitting tall
like David (head turned, a paw raised), Klibais standing on three legs, the hurt
front paw held up; both rising out of a rough-hewn block (non finito) on a plinth
with their names cut in.

    Blender -b rigged.blend -P statue.py -- OUT.png [--check]
"""
import math
import sys

import bmesh
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
CHECK = '--check' in argv

sc = bpy.context.scene
arm = bpy.data.objects['CatRig']
cat = bpy.data.objects['Cat']

# ── no whiskers in stone ──
bm = bmesh.new(); bm.from_mesh(cat.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index == 4], context='FACES')
bm.to_mesh(cat.data); bm.free()

# ── IK controls (as scripts/blender/nakts_cats.py) ──
bpy.context.view_layer.objects.active = arm
with bpy.context.temp_override(object=arm, active_object=arm):
    bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones


def ctl(name, like):
    b = eb.new(name); src = eb[like]
    b.head, b.tail, b.roll = src.head.copy(), src.tail.copy(), src.roll
    b.parent = eb['root']; b.use_deform = False


for L, sx in (('L', 1), ('R', -1)):
    ctl('ik_hand.' + L, 'hand.' + L); ctl('ik_foot.' + L, 'foot.' + L)
    for nm, pt in (('pole_knee.' + L, (sx * 0.06, -0.05, 0.12)), ('pole_elbow.' + L, (sx * 0.04, 0.1, 0.12))):
        b = eb.new(nm); b.head = Vector(pt); b.tail = Vector(pt) + Vector((0, 0, 0.02)); b.parent = eb['root']; b.use_deform = False
with bpy.context.temp_override(object=arm, active_object=arm):
    bpy.ops.object.mode_set(mode='POSE')
for L in ('L', 'R'):
    p = arm.pose.bones
    c = p['forearm.' + L].constraints.new('IK'); c.target = arm; c.subtarget = 'ik_hand.' + L; c.chain_count = 2
    c.pole_target = arm; c.pole_subtarget = 'pole_elbow.' + L; c.pole_angle = math.radians(90)
    c = p['hand.' + L].constraints.new('COPY_ROTATION'); c.target = arm; c.subtarget = 'ik_hand.' + L
    c = p['shin.' + L].constraints.new('IK'); c.target = arm; c.subtarget = 'ik_foot.' + L; c.chain_count = 2
    c.pole_target = arm; c.pole_subtarget = 'pole_knee.' + L; c.pole_angle = math.radians(-90)
    c = p['foot.' + L].constraints.new('COPY_ROTATION'); c.target = arm; c.subtarget = 'ik_foot.' + L
for b in arm.pose.bones:
    b.rotation_mode = 'XYZ'
with bpy.context.temp_override(object=arm, active_object=arm):
    bpy.ops.object.mode_set(mode='OBJECT')
rest = {b.name: b.bone.matrix_local.copy() for b in arm.pose.bones}

# the second cat: its own rig object (its own pose), the same bones and mesh
arm2 = arm.copy(); sc.collection.objects.link(arm2)
for b in arm2.pose.bones:
    for c in b.constraints:
        if getattr(c, 'target', None) == arm: c.target = arm2
        if getattr(c, 'pole_target', None) == arm: c.pole_target = arm2
cat2 = cat.copy(); sc.collection.objects.link(cat2)
cat2.parent = arm2
for m in cat2.modifiers:
    if m.type == 'ARMATURE': m.object = arm2


class Pose:
    def __init__(self, a):
        self.a = a; self.pb = a.pose.bones

    def up(self):
        bpy.context.view_layer.update()

    def setm(self, name, m):
        self.pb[name].matrix = m; self.up()

    def clear(self):
        for b in self.pb:
            b.location = (0, 0, 0); b.rotation_euler = (0, 0, 0); b.scale = (1, 1, 1)

    def body(self, dz=0.0, dy=0.0, pitch=0.0, roll=0.0, spine=(0, 0, 0), bend=0.0):
        r = rest['pelvis']
        self.setm('pelvis', Matrix.Translation(r.translation + Vector((0, dy, dz))) @ Matrix.Rotation(pitch, 4, 'X') @ Matrix.Rotation(roll, 4, 'Y') @ r.to_3x3().to_4x4())
        for bn, a in zip(('spine2', 'spine3', 'chest'), spine):
            self.pb[bn].rotation_euler.x = a; self.pb[bn].rotation_euler.z = bend / 3

    def head(self, pitch=0.0, yaw=0.0, tilt=0.0, jaw=0.0, ears=0.0):
        pb = self.pb
        for n, k in (('neck1', 0.4), ('neck2', 0.3), ('head', 0.3)):
            pb[n].rotation_euler.x = pitch * k; pb[n].rotation_euler.z = yaw * k
        pb['head'].rotation_euler.y = tilt
        pb['jaw'].rotation_euler.x = jaw
        for L in ('L', 'R'):
            pb['ear.' + L].rotation_euler.x = ears

    def tail(self, curl, side):
        for i in range(6):
            b = self.pb['tail%d' % (i + 1)]
            b.rotation_euler.x = curl[i]; b.rotation_euler.z = side[i]

    def foot(self, name, dx=0.0, dy=0.0, dz=0.0, rot=0.0):
        r = rest[name.replace('ik_', '')]
        self.setm(name, Matrix.Translation(r.translation + Vector((dx, dy, dz))) @ Matrix.Rotation(rot, 4, 'X') @ r.to_3x3().to_4x4())


# ── Špricētājs: sits tall, chest out, head turned far to its left, the right paw raised ──
A = Pose(arm)
A.clear(); A.up()
A.body(dy=-0.0625, dz=-0.128, pitch=-math.radians(62), spine=(math.radians(18), math.radians(4), math.radians(2)), bend=0.06)
A.head(pitch=0.42, yaw=-0.75, tilt=0.12, ears=0.1)
A.tail(curl=(1.25, 0.35, 0.1, 0.0, 0.0, 0.0), side=(0.7, 0.6, 0.55, 0.5, 0.45, 0.4))
A.up()
A.foot('ik_foot.L', dx=-0.0005, dy=-0.0822, dz=-0.046, rot=-0.75)
A.foot('ik_foot.R', dx=0.0005, dy=-0.0822, dz=-0.046, rot=-0.75)
A.foot('ik_hand.L', dx=-0.0016, dy=-0.0128)
A.foot('ik_hand.R', dx=-0.004, dy=-0.06, dz=0.075, rot=-1.25)

# ── Klibais: stands, the left front paw lifted and hanging, head low and turned to his friend ──
B = Pose(arm2)
B.clear(); B.up()
B.body(dz=-0.012, pitch=0.06, spine=(0.06, 0.03, 0.0), bend=-0.08)
B.head(pitch=0.25, yaw=0.45, tilt=-0.1, ears=-0.15)
B.tail(curl=(0.85, 0.35, 0.1, -0.1, -0.15, -0.15), side=(-0.2, -0.25, -0.25, -0.2, -0.15, -0.1))
B.up()
B.foot('ik_hand.L', dy=-0.035, dz=0.07, rot=-1.5)
B.foot('ik_hand.R', dx=0.004, dy=0.01)
B.foot('ik_foot.L', dy=0.02)
B.foot('ik_foot.R', dy=-0.03)

# where they stand: Špricētājs left, turned towards the viewer's right; Klibais right, coming towards him
arm.matrix_world = Matrix.Translation((-0.16, 0.05, 0.0)) @ Matrix.Rotation(math.radians(28), 4, 'Z')
arm2.matrix_world = Matrix.Translation((0.165, -0.03, 0.0)) @ Matrix.Rotation(math.radians(-72), 4, 'Z')
bpy.context.view_layer.update()

# ── marble ──
def marble(name, base=(0.74, 0.7, 0.62), rough=0.38, vein=0.18):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 6; n1.inputs['Detail'].default_value = 10; n1.inputs['Distortion'].default_value = 3
    nt.links.new(tc.outputs['Object'], n1.inputs['Vector'])
    w = nt.nodes.new('ShaderNodeTexWave'); w.inputs['Scale'].default_value = 2.5; w.inputs['Distortion'].default_value = 9; w.inputs['Detail'].default_value = 8
    nt.links.new(n1.outputs['Color'], w.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (base[0] * (1 - vein), base[1] * (1 - vein), base[2] * (1 - vein * 0.8), 1)
    ramp.color_ramp.elements[1].position = 0.12; ramp.color_ramp.elements[1].color = base + (1,)
    nt.links.new(w.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    p.inputs['Subsurface Weight'].default_value = 0.25
    p.inputs['Subsurface Radius'].default_value = (0.01, 0.008, 0.006)
    p.inputs['Subsurface Scale'].default_value = 0.05
    return m


STONE = marble('Marble')
for o in (cat, cat2):
    for s in o.material_slots:
        s.link = 'OBJECT'; s.material = STONE
    # finer surface: the statue's skin smooth, not faceted
    if not any(m.type == 'SUBSURF' for m in o.modifiers):
        o.modifiers.new('sub', 'SUBSURF').levels = 1 if CHECK else 1
        o.modifiers['sub'].render_levels = 1

# ── the rough block they rise from, and the plinth ──
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.02, 0.0, -0.04))
blk = bpy.context.object; blk.scale = (0.66, 0.4, 0.1)
bpy.ops.object.transform_apply(scale=True)
bv0 = blk.modifiers.new('bev', 'BEVEL'); bv0.width = 0.03; bv0.segments = 2
ss = blk.modifiers.new('sub', 'SUBSURF'); ss.subdivision_type = 'SIMPLE'; ss.levels = ss.render_levels = 5
tex = bpy.data.textures.new('chisel', 'VORONOI'); tex.noise_scale = 0.045; tex.distance_metric = 'DISTANCE'
d = blk.modifiers.new('chisel', 'DISPLACE'); d.texture = tex; d.strength = 0.022; d.texture_coords = 'GLOBAL'
tex2 = bpy.data.textures.new('grain', 'CLOUDS'); tex2.noise_scale = 0.02
d2 = blk.modifiers.new('grain', 'DISPLACE'); d2.texture = tex2; d2.strength = 0.006; d2.texture_coords = 'GLOBAL'
blk.data.materials.append(marble('Rough', base=(0.68, 0.64, 0.56), rough=0.8))
for p in blk.data.polygons:
    p.use_smooth = True

bpy.ops.mesh.primitive_cube_add(size=1, location=(0.02, 0.0, -0.22))
pl = bpy.context.object; pl.scale = (0.62, 0.4, 0.26)
bpy.ops.object.transform_apply(scale=True)
bev = pl.modifiers.new('bev', 'BEVEL'); bev.width = 0.006; bev.segments = 3
PL = marble('Plinth', base=(0.72, 0.68, 0.6), rough=0.32, vein=0.25)
pl.data.materials.append(PL)
# a moulding at the top of the plinth
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.02, 0.0, -0.085))
mo = bpy.context.object; mo.scale = (0.66, 0.44, 0.025)
bpy.ops.object.transform_apply(scale=True)
b2 = mo.modifiers.new('bev', 'BEVEL'); b2.width = 0.01; b2.segments = 4
mo.data.materials.append(PL)

# the names cut into the front (the plinth's front face is at y = -0.25)
TEXTS = []
CUT = marble('Cut', base=(0.3, 0.28, 0.25), rough=0.8, vein=0.05)
for txt, x in (('ŠPRICĒTĀJS', -0.13), ('KLIBAIS', 0.18)):
    bpy.ops.object.text_add(location=(x, -0.2015, -0.22), rotation=(math.radians(90), 0, 0))
    t = bpy.context.object; t.data.body = txt; t.data.size = 0.036; t.data.extrude = 0.0006
    t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'; t.data.space_character = 1.12
    try:
        t.data.font = bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf')
    except Exception:
        pass
    t.data.materials.append(CUT)
    TEXTS.append(t)

# ── light: a museum, the key high on the left, a cool rim ──
sc.world = sc.world or bpy.data.worlds.new('w')
sc.world.use_nodes = True
bg = sc.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.05, 0.055, 0.07, 1); bg.inputs['Strength'].default_value = 0.12
for o in [o for o in bpy.data.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(o)


def light(name, loc, energy, size, color):
    L = bpy.data.lights.new(name, 'AREA'); L.energy = energy; L.size = size; L.color = color
    o = bpy.data.objects.new(name, L); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0.15)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


light('key', (-1.4, -0.9, 1.3), 190, 0.45, (1.0, 0.95, 0.88))
light('fill', (1.4, -1.0, 0.4), 7, 1.4, (0.85, 0.9, 1.0))
light('rim', (0.6, 1.3, 1.1), 120, 0.6, (0.8, 0.88, 1.0))

# ── camera: a little below the cats' eyes, so they stand up as monuments ──
cam = bpy.data.objects.get('Camera')
if not cam:
    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); sc.collection.objects.link(cam)
sc.camera = cam
cam.data.lens = 85
cam.location = (0.2, -2.3, 0.3)
cam.rotation_euler = (Vector((0.02, 0.0, 0.05)) - cam.location).to_track_quat('-Z', 'Y').to_euler()

r = sc.render
r.engine = 'CYCLES'
sc.cycles.device = 'GPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for dv in prefs.devices: dv.use = True
except Exception:
    pass
sc.cycles.samples = 48 if CHECK else 256
sc.cycles.use_denoising = True
r.film_transparent = True
r.resolution_x, r.resolution_y = (600, 600) if CHECK else (1200, 1200)
r.resolution_percentage = 100
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'AgX'
try:
    sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
r.filepath = OUT
if '--mesh' in argv:
    import mesh_export
    mesh_export.run(OUT, [cat, cat2, blk, pl, mo], TEXTS, STONE)
else:
    bpy.ops.render.render(write_still=True)
print('DONE', OUT)
