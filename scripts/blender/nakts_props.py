"""Things the Nakts cats play with, rendered like the cats (the rooms' camera,
33 deg from vertical, orthographic, at the rooms' scale, 2x):

- mouse: a small grey mouse running (side, front, back) and sitting up;
- fight: a cartoon dust cloud with stars and tufts of both cats' fur;
- box: an open cardboard box for a corner, as its back and its front wall.

    Blender -b -P scripts/blender/nakts_props.py -- OUT_DIR [--check]
"""
import json
import math
import os
import random
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
CHECK = '--check' in argv
os.makedirs(OUT, exist_ok=True)
TILT = math.radians(33)
PX_PER_M = 89.7 * 2


def reset(frame):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences
        pr.compute_device_type = 'METAL'; pr.get_devices()
        for d in pr.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception:
        pass
    sc.cycles.samples = 48 if CHECK else 160
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'
    sc.render.resolution_x = sc.render.resolution_y = frame
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.05, 0.06, 0.09, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    for loc, size, e, col in (((-1.2, -1.4, 2.2), 1.6, 70, (0.8, 0.86, 1.0)), ((1.0, 1.4, 1.6), 1.2, 45, (0.65, 0.75, 1.0))):
        L = bpy.data.lights.new('k', 'AREA'); L.size = size; L.energy = e; L.color = col
        o = bpy.data.objects.new('k', L); sc.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 0.15)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, 0))
    bpy.context.active_object.is_shadow_catcher = True
    cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cd.ortho_scale = frame / PX_PER_M
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
    cam.location = (0, -math.sin(TILT) * 5, math.cos(TILT) * 5 + 0.05)
    cam.rotation_euler = (TILT, 0, 0)
    sc.camera = cam
    return sc, cam


def mat(name, rgb, rough=0.6, sheen=0.0, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough
    if sheen and 'Sheen Weight' in p.inputs:
        p.inputs['Sheen Weight'].default_value = sheen
    if emit:
        p.inputs['Emission Color'].default_value = (*rgb, 1); p.inputs['Emission Strength'].default_value = emit
    return m


def ball(r, loc, m, scale=(1, 1, 1), parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.active_object; o.scale = scale
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    if parent:
        o.parent = parent
    return o


def save(sc, path):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def anchor(sc, cam):
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    return [round(v.x, 4), round(1 - v.y, 4)]


manifest = {}

# ── the mouse (2.2x life size, so it reads next to the cats) ──
MOUSE_FRAME = 96


def mouse_scene():
    sc, cam = reset(MOUSE_FRAME)
    grey, pink, eye = mat('grey', (0.42, 0.42, 0.45), 0.7, 0.6), mat('pink', (0.95, 0.62, 0.66), 0.5), mat('eye', (0.01, 0.01, 0.012), 0.15)
    root = bpy.data.objects.new('mouse', None); sc.collection.objects.link(root)
    S = 2.2
    parts = {}
    parts['body'] = ball(0.03 * S, (0, 0.005 * S, 0.028 * S), grey, (1.0, 1.55, 0.9), root)
    parts['head'] = ball(0.022 * S, (0, -0.045 * S, 0.034 * S), grey, (1, 1.2, 0.95), root)
    ball(0.006 * S, (0, -0.073 * S, 0.032 * S), pink, parent=root)
    for sx in (-1, 1):
        ball(0.013 * S, (sx * 0.016 * S, -0.04 * S, 0.056 * S), grey, (1, 0.35, 1), root)
        ball(0.009 * S, (sx * 0.016 * S, -0.043 * S, 0.056 * S), pink, (1, 0.3, 1), root)
        ball(0.0045 * S, (sx * 0.011 * S, -0.06 * S, 0.043 * S), eye, parent=root)
    feet = []
    for sx, sy in ((1, -0.025), (-1, -0.025), (1, 0.035), (-1, 0.035)):
        feet.append(ball(0.007 * S, (sx * 0.014 * S, sy * S, 0.006 * S), pink, (1, 1.4, 0.6), root))
    cu = bpy.data.curves.new('tail', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.0028 * S; cu.bevel_resolution = 4
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(4)
    tail = bpy.data.objects.new('tail', cu); sc.collection.objects.link(tail); tail.parent = root
    tail.data.materials.append(pink)
    for bp in sp.bezier_points:
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    return sc, cam, root, feet, sp


def mouse_pose(feet, sp, t, run=True):
    for i, (f, ph) in enumerate(zip(feet, (0.0, 0.5, 0.5, 0.0))):
        k = math.sin(2 * math.pi * (t + ph))
        base = f.get('base') or tuple(f.location); f['base'] = base
        f.location = (base[0], base[1] + (0.012 * 2.2 * k if run else 0), base[2] + (max(0, k) * 0.006 * 2.2 if run else 0))
    for i, bp in enumerate(sp.bezier_points):
        w = math.sin(2 * math.pi * t * (2 if run else 1) + i * 0.9) * 0.012 * 2.2 * i / 4
        bp.co = (w, (0.055 + i * 0.03) * 2.2, (0.02 - i * 0.004) * 2.2)


sc, cam, root, feet, sp = mouse_scene()
manifest['mouse'] = {'frame': MOUSE_FRAME, 'anchor': anchor(sc, cam), 'anims': {'run': {'frames': 4, 'dirs': ['side', 'front', 'back']}, 'sit': {'frames': 4, 'dirs': ['front']}}}
os.makedirs(os.path.join(OUT, 'mouse'), exist_ok=True)
for d, yaw in (('side', math.pi / 2), ('front', 0.0), ('back', math.pi)):
    root.rotation_euler = (0, 0, yaw)
    for f in range(4):
        root.location.z = abs(math.sin(math.pi * f / 2)) * 0.006
        mouse_pose(feet, sp, f / 4, True)
        save(sc, os.path.join(OUT, 'mouse', 'run-%s-%02d.png' % (d, f)))
root.rotation_euler = (0, 0, 0.35)
for f in range(4):
    root.location.z = 0
    mouse_pose(feet, sp, f / 4, False)
    root.rotation_euler.x = -0.35 + 0.05 * math.sin(math.pi * f / 2)          # up on its haunches, nibbling
    save(sc, os.path.join(OUT, 'mouse', 'sit-front-%02d.png' % f))
print('mouse done')

# ── the fight: a dust cloud, stars, tufts of fur ──
CLOUD_FRAME = 320
sc, cam = reset(CLOUD_FRAME)
dust = mat('dust', (0.78, 0.74, 0.68), 0.95)
star = mat('star', (1.0, 0.85, 0.25), 0.3, emit=2.5)
furs = [mat('ginger', (0.92, 0.45, 0.12), 0.6, 0.7), mat('black', (0.03, 0.03, 0.035), 0.55, 0.8)]
rnd = random.Random(7)
C = 1.75                                  # a big cartoon cloud
blobs = [(rnd.uniform(0, math.tau), rnd.uniform(0.02, 0.2), rnd.uniform(0.06, 0.12)) for _ in range(20)]
manifest['fight'] = {'frame': CLOUD_FRAME, 'anchor': anchor(sc, cam), 'frames': 6}
os.makedirs(os.path.join(OUT, 'fight'), exist_ok=True)
for f in range(6):
    for o in [o for o in sc.objects if o.type in ('MESH', 'CURVE') and not o.is_shadow_catcher]:
        bpy.data.objects.remove(o, do_unlink=True)
    for i, (a, r, s) in enumerate(blobs):
        a2 = a + f * 0.35 * (1 if i % 2 else -1); rr = r * (0.9 + 0.2 * math.sin(f * 1.7 + i))
        ball(C * s * (0.85 + 0.25 * math.sin(f * 2.1 + i * 1.3)), (C * math.cos(a2) * rr, C * math.sin(a2) * rr * 0.7, C * (0.1 + abs(math.sin(a2 * 2)) * 0.06 + s * 0.4)), dust)
    for i in range(5):                     # stars circling above
        a = f * 0.9 + i * math.tau / 5
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.05, radius2=0.0, depth=0.016, location=(C * math.cos(a) * 0.2, C * math.sin(a) * 0.12, C * 0.33 + 0.02 * math.sin(a * 3)))
        o = bpy.context.active_object; o.rotation_euler = (0, 0, a); o.data.materials.append(star)
    for i in range(6):                     # tufts of fur flying out
        a = rnd.uniform(0, math.tau)
        ball(0.03, (C * math.cos(a) * 0.26, C * math.sin(a) * 0.18, C * (0.14 + rnd.uniform(0, 0.12))), furs[i % 2], (1.6, 0.7, 0.7))
    save(sc, os.path.join(OUT, 'fight', 'fight-%02d.png' % f))
print('fight done')

# ── a cardboard box in a corner (the cats love it): the back part and the front
#    wall as two pictures, so a cat can sit inside between them ──
BOX_FRAME = 224


def cardboard():
    m = bpy.data.materials.new('card'); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    wave = nt.nodes.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'Z'
    wave.inputs['Scale'].default_value = 60; wave.inputs['Distortion'].default_value = 0.4
    nt.links.new(tc.outputs['Object'], wave.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 18; nz.inputs['Detail'].default_value = 6
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.36, 0.22, 0.1, 1); ramp.color_ramp.elements[1].color = (0.62, 0.43, 0.24, 1)
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.12
    nt.links.new(wave.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    p.inputs['Roughness'].default_value = 0.9
    return m


def slab(size, loc, rot, m, name):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bv = o.modifiers.new('b', 'BEVEL'); bv.width = 0.003; bv.segments = 2
    o.data.materials.append(m)
    return o


def box_scene():
    sc, cam = reset(BOX_FRAME)
    m = cardboard(); tape = mat('tape', (0.72, 0.6, 0.42), 0.35)
    W, D, Hb, t = 0.46, 0.36, 0.26, 0.008
    parts = {'back': [], 'front': []}
    parts['back'].append(slab((W, D, t), (0, 0, t / 2), (0, 0, 0), m, 'bottom'))
    parts['back'].append(slab((W, t, Hb), (0, D / 2, Hb / 2), (0, 0, 0), m, 'wallB'))
    for sx in (-1, 1):
        parts['back'].append(slab((t, D, Hb), (sx * W / 2, 0, Hb / 2), (0, 0, 0), m, 'wall%d' % sx))
        # side flaps, open outwards and a little down
        parts['back'].append(slab((0.15, D, t), (sx * (W / 2 + 0.07), 0, Hb + 0.02), (0, sx * math.radians(-28), 0), m, 'flapS%d' % sx))
    parts['back'].append(slab((W, 0.14, t), (0, D / 2 + 0.065, Hb + 0.03), (math.radians(35), 0, 0), m, 'flapB'))
    parts['back'].append(slab((0.06, 0.005, 0.06), (0, D / 2 + 0.005, Hb - 0.03), (0, 0, 0), tape, 'tapeB'))
    parts['front'].append(slab((W, t, Hb), (0, -D / 2, Hb / 2), (0, 0, 0), m, 'wallF'))
    parts['front'].append(slab((W, 0.14, t), (0, -D / 2 - 0.065, Hb + 0.03), (math.radians(-35), 0, 0), m, 'flapF'))
    parts['front'].append(slab((0.06, 0.004, Hb * 0.8), (0, -D / 2 - 0.005, Hb * 0.45), (0, 0, 0), tape, 'tapeF'))
    return sc, cam, parts


sc, cam, parts = box_scene()
bpy.context.scene.objects.get('Plane').is_shadow_catcher = True
os.makedirs(os.path.join(OUT, 'box'), exist_ok=True)
manifest['box'] = {'frame': BOX_FRAME, 'anchor': anchor(sc, cam)}
for o in parts['front']:
    o.hide_render = True
save(sc, os.path.join(OUT, 'box', 'box-back.png'))
for o in parts['back']:
    o.visible_camera = False           # still casts light and shadow on the front wall
for o in parts['front']:
    o.hide_render = False
sc.objects['Plane'].hide_render = True
save(sc, os.path.join(OUT, 'box', 'box-front.png'))
print('box done')

json.dump(manifest, open(os.path.join(OUT, 'props.json'), 'w'), indent=1)
print('manifest', manifest)
