"""The Nakts rooms, rendered: a dark tray room with a glowing inner rim, a plank
floor and a door with a small light in the front wall (the look of the first
rooms), in proportions that fit the row beside the history list: three beds
stand side by side along the back wall, the floor in front is for the cats.

    Blender -b -P scripts/blender/nakts_rooms.py -- OUT_DIR [main|nmp] [SAMPLES]

Writes room-<kind>-<w>.png (1x and 2x) and room-<kind>.json (where the floor and
the front wall are in the picture, for the page's layout).
"""
import json
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
KINDS = [argv[1]] if len(argv) > 1 and argv[1] in ('main', 'nmp') else ['main', 'nmp']
SAMPLES = int(argv[2]) if len(argv) > 2 else 384
os.makedirs(OUT, exist_ok=True)

# Floor (inside the walls) in metres, wall thickness and height, rim colour.
ROOMS = {
    'main': dict(w=4.1, d=3.55, px=440, rim=(0.0, 0.62, 1.0)),
    'nmp': dict(w=2.0, d=3.55, px=236, rim=(1.0, 0.6, 0.04)),
}
# Thin walls and a camera mostly from above: the floor is most of the picture,
# so the two beds stacked on the left can be large.
WALL_T, WALL_H, R_OUT = 0.17, 0.42, 0.26
TILT = math.radians(33)          # camera from vertical


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences
        pr.compute_device_type = 'METAL'
        pr.get_devices()
        for d in pr.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception:
        pass
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    w = bpy.data.worlds.new('w'); sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.016, 0.024, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    return sc


def rounded_rect(w, d, r, n=10):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def prism(name, outline, z0, z1, mat, hole=None):
    """A flat outline extruded from z0 to z1 (with an optional hole: a ring)."""
    bm = bmesh.new()
    def ring(pts, z):
        return [bm.verts.new((x, y, z)) for x, y in pts]
    if hole is None:
        b, t = ring(outline, z0), ring(outline, z1)
        bm.faces.new(b[::-1]); bm.faces.new(t)
        for i in range(len(b)):
            j = (i + 1) % len(b)
            bm.faces.new((b[i], b[j], t[j], t[i]))
    else:
        ob, ot, ib, it = ring(outline, z0), ring(outline, z1), ring(hole, z0), ring(hole, z1)
        n = len(outline)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ob[i], ob[j], ot[j], ot[i]))      # outer side
            bm.faces.new((ib[j], ib[i], it[i], it[j]))      # inner side
            bm.faces.new((ot[i], ot[j], it[j], it[i]))      # top
            bm.faces.new((ob[j], ob[i], ib[i], ib[j]))      # bottom
    me = bpy.data.meshes.new(name)
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(mat)
    bv = o.modifiers.new('bevel', 'BEVEL'); bv.width = 0.035; bv.segments = 5; bv.limit_method = 'ANGLE'
    ws = o.modifiers.new('wn', 'WEIGHTED_NORMAL'); ws.keep_sharp = True
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def mat_tray():
    m = bpy.data.materials.new('tray'); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (0.02, 0.028, 0.042, 1)
    p.inputs['Roughness'].default_value = 0.38
    for k in ('Coat Weight', 'Clearcoat'):
        if k in p.inputs:
            p.inputs[k].default_value = 0.35
    return m


def mat_floor():
    """Dark planks with a fine brushed grain and thin seams."""
    m = bpy.data.materials.new('floor'); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.006
    br.inputs['Brick Width'].default_value = 30.0     # long boards: no end joints in view
    br.inputs['Row Height'].default_value = 0.2
    br.offset = 0.45
    br.inputs['Color1'].default_value = (0.009, 0.012, 0.02, 1)
    br.inputs['Color2'].default_value = (0.011, 0.015, 0.024, 1)
    br.inputs['Mortar'].default_value = (0.006, 0.008, 0.012, 1)
    sh = nt.nodes.new('ShaderNodeMapping'); sh.inputs['Location'].default_value = (3.37, 0.1, 0)
    nt.links.new(tc.outputs['Object'], sh.inputs['Vector'])
    nt.links.new(sh.outputs['Vector'], br.inputs['Vector'])
    # brushed grain: noise stretched along the planks
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (4, 160, 1)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 6
    nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 0.35
    nt.links.new(br.outputs['Color'], mix.inputs['A'])
    nt.links.new(nz.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = 0.42; rr.inputs['To Max'].default_value = 0.62
    nt.links.new(nz.outputs['Fac'], rr.inputs['Value'])
    nt.links.new(rr.outputs['Result'], p.inputs['Roughness'])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.25
    nt.links.new(br.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m


def mat_glow(rgb, strength):
    m = bpy.data.materials.new('glow'); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*rgb, 1)
    # brighter along the back wall, fading towards the front (object Y)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = -1.75; mr.inputs['From Max'].default_value = 1.2
    mr.inputs['To Min'].default_value = strength * 0.04; mr.inputs['To Max'].default_value = strength
    nt.links.new(sep.outputs['Y'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], em.inputs['Strength'])
    nt.links.new(em.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
    return m


def build(kind):
    R = ROOMS[kind]
    sc = reset()
    w, d = R['w'], R['d']
    ow, od = w + WALL_T * 2, d + WALL_T * 2
    tray, flr = mat_tray(), mat_floor()
    # floor slab and walls (a ring)
    prism('floor', rounded_rect(w + 0.02, d + 0.02, R_OUT - WALL_T + 0.02), -0.06, 0.0, flr)
    prism('walls', rounded_rect(ow, od, R_OUT), -0.08, WALL_H, tray, hole=rounded_rect(w, d, max(0.04, R_OUT - WALL_T)))
    # the glowing rim: a thin strip just inside the top edge of the walls
    rim = prism('rim', rounded_rect(w - 0.004, d - 0.004, max(0.04, R_OUT - WALL_T)), WALL_H - 0.05, WALL_H - 0.02,
                mat_glow(R['rim'], 7), hole=rounded_rect(w - 0.03, d - 0.03, max(0.03, R_OUT - WALL_T - 0.015)))
    rim.modifiers['bevel'].width = 0.006
    # a soft inner bounce of the rim's colour on the floor edge
    lamp = bpy.data.lights.new('rimfill', 'AREA'); lamp.shape = 'RECTANGLE'; lamp.size = w * 0.9; lamp.size_y = 0.25
    lamp.energy = 1.2 if kind == 'main' else 0.8; lamp.color = R['rim']
    lo = bpy.data.objects.new('rimfill', lamp); sc.collection.objects.link(lo)
    lo.location = (0, d / 2 - 0.1, WALL_H - 0.02); lo.rotation_euler = (math.radians(-35), 0, 0)
    # the door in the front wall: a rounded block, a darker panel and a small light
    door = prism('door', rounded_rect(0.5, 0.2, 0.07), -0.08, WALL_H + 0.02, tray)
    door.location = (0, -od / 2 + 0.02, 0)
    panel = prism('panel', rounded_rect(0.3, 0.05, 0.035), 0.02, WALL_H - 0.06, mat_tray())
    panel.location = (-0.02, -od / 2 - 0.08, 0)
    panel.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.02, 0.028, 0.04, 1)
    knob_m = bpy.data.materials.new('knob'); knob_m.use_nodes = True
    kp = knob_m.node_tree.nodes['Principled BSDF']
    kp.inputs['Base Color'].default_value = (0.55, 0.58, 0.62, 1); kp.inputs['Metallic'].default_value = 1.0; kp.inputs['Roughness'].default_value = 0.28
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.026, location=(0.08, -od / 2 - 0.115, 0.2), segments=32, ring_count=16)
    kn = bpy.context.active_object; kn.data.materials.append(knob_m)
    for pp in kn.data.polygons:
        pp.use_smooth = True
    # key light from above-left, a cool fill, and the room's own dark
    # night: a dim cool key (moonlight) and a faint fill
    for loc, size, e, col in (((-2.5, -2.5, 6), 6, 210, (0.62, 0.72, 1.0)), ((3, 2, 5), 5, 50, (0.5, 0.6, 0.85))):
        L = bpy.data.lights.new('k', 'AREA'); L.size = size; L.energy = e; L.color = col
        o = bpy.data.objects.new('k', L); sc.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    # camera: from the front, TILT from vertical, a long lens (little perspective)
    cd = bpy.data.cameras.new('cam'); cd.lens = 85
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
    dist = 15.0
    cam.location = (0, -math.sin(TILT) * dist, math.cos(TILT) * dist + 0.1)
    cam.rotation_euler = (TILT, 0, 0)
    sc.camera = cam
    # One scale for both rooms (the main room is 440 px wide); each picture is cut
    # to its tray, so there is no empty band around it.
    from bpy_extras.object_utils import world_to_camera_view
    cd.sensor_fit = 'HORIZONTAL'; cd.sensor_width = 36
    sc.render.resolution_x, sc.render.resolution_y = 1000, 1000
    bpy.context.view_layer.update()

    def spans(rw, rd):
        ow2, od2 = rw + WALL_T * 2, rd + WALL_T * 2
        cs = [Vector((x * ow2 / 2, y * od2 / 2, z)) for x in (-1, 1) for y in (-1, 1) for z in (-0.08, WALL_H + 0.02)]
        cs.append(Vector((0, -od2 / 2 - 0.12, -0.08)))
        pp = [world_to_camera_view(sc, cam, c) for c in cs]
        return min(p.x for p in pp), max(p.x for p in pp), min(p.y for p in pp), max(p.y for p in pp)
    mx0, mx1, _, _ = spans(ROOMS['main']['w'], ROOMS['main']['d'])
    f = ROOMS['main']['px'] / (mx1 - mx0)                 # px per unit of the 36 mm frame
    x0, x1, y0, y1 = spans(w, d)
    pw, ph = int(round((x1 - x0) * f)), int(round((y1 - y0) * f))
    # the frame: exactly this span (sensor width), centred on it (shift)
    cd.sensor_width = 36 * (x1 - x0)
    cd.shift_x = ((x0 + x1) / 2 - 0.5) / (x1 - x0)
    cd.shift_y = ((y0 + y1) / 2 - 0.5) / (x1 - x0)
    sc.render.resolution_x, sc.render.resolution_y = pw * 2, ph * 2
    bpy.context.view_layer.update()

    def uv(p):
        v = world_to_camera_view(sc, cam, Vector(p))
        return [round(v.x, 4), round(1 - v.y, 4)]
    info = {
        'size': [pw, ph],
        # the floor's corners (x, y as a fraction of the picture, from the top left)
        'floor': [uv((-w / 2, d / 2, 0)), uv((w / 2, d / 2, 0)), uv((w / 2, -d / 2, 0)), uv((-w / 2, -d / 2, 0))],
        # where the front wall's top edge is: the part drawn over things on the floor
        'frontTop': uv((0, -d / 2, WALL_H))[1],
        'pxPerMetre': abs(uv((1, 0, 0))[0] - uv((0, 0, 0))[0]) * pw,
    }
    for scale in (2, 1):
        sc.render.resolution_x, sc.render.resolution_y = pw * scale, ph * scale
        sc.render.filepath = os.path.join(OUT, 'room-%s-%d.png' % (kind, pw * scale))
        bpy.ops.render.render(write_still=True)
        if scale == 2:
            sc.cycles.samples = max(64, SAMPLES // 3)
    json.dump(info, open(os.path.join(OUT, 'room-%s.json' % kind), 'w'), indent=1)
    print('room', kind, info)


for k in KINDS:
    build(k)
