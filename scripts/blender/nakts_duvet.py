"""The duvet of the Nakts beds as a real cloth: simulated over a sleeper on the
mattress, and in its other states (sliding off the bed's end, crumpled on the
floor), rendered from the bed picture's own camera (44 deg from vertical,
orthographic, 427 px a metre on the 512 px bed; the heap from the rooms'
camera). Two pictures per state, so the page can dress it in any linen or card
picture and keep every fold:

- <state>-shade.png: the cloth in white, lit like the bed (and the shadow it
  casts on the mattress), RGBA;
- <state>-uv.png: where on the cloth each pixel is (R = u, G = v), raw.

    Blender -b -P scripts/blender/nakts_duvet.py -- OUT_DIR [states...] [--check]
"""
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
CHECK = '--check' in argv
STATES = [a for a in argv[1:] if not a.startswith('--')] or ['bed', 'slide', 'floor']
os.makedirs(OUT, exist_ok=True)

BED_TILT = math.radians(44)
BED_PPM = 427.0                 # px a metre on the 512 px bed picture
W, H = 512, 728
# The bed picture's mattress (measured): the duvet spans x 40-474 px (its sides hang
# over the mattress), its front edge meets the footboard at y 500 px, the turned-down
# fold starts at 262 px.
MAT_W = 0.9                      # mattress top width (m)
MAT_T = 0.22                     # mattress thickness
FOOT_Y = 0.0                     # the foot end of the mattress (world y); the head is at -Y... see below


def reset():
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
    sc.render.film_transparent = True
    return sc


def box(name, size, loc, hide=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if hide:
        o.hide_render = True
    return o


def capsule(name, a, b, r):
    """A soft limb or torso from a to b (a body under the duvet: the cloth only needs its shape)."""
    a, b = Vector(a), Vector(b)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=24, ring_count=12, location=(a + b) / 2)
    o = bpy.context.active_object; o.name = name
    d = b - a
    o.scale = (r, d.length / 2 + r, r * 0.8)
    o.rotation_euler = Vector((0, 1, 0)).rotation_difference(d.normalized()).to_euler()
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    o.hide_render = True
    return o


def collide(o, outer=0.012):
    m = o.modifiers.new('col', 'COLLISION')
    o.collision.thickness_outer = outer
    o.collision.cloth_friction = 8.0
    return o


def cloth_plane(name, w, d, loc, rot=(0, 0, 0), cuts=56):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    o.scale = (w, d, 1)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.subdivide(number_cuts=cuts)
    bpy.ops.object.mode_set(mode='OBJECT')
    cl = o.modifiers.new('cloth', 'CLOTH')
    s = cl.settings
    s.quality = 8; s.mass = 1.1                               # a heavy, soft duvet
    s.tension_stiffness = 10; s.compression_stiffness = 10; s.shear_stiffness = 5; s.bending_stiffness = 0.25
    s.air_damping = 1.0
    cl.collision_settings.use_self_collision = True
    cl.collision_settings.self_distance_min = 0.006
    cl.collision_settings.distance_min = 0.006
    cl.collision_settings.collision_quality = 4
    so = o.modifiers.new('thick', 'SOLIDIFY'); so.thickness = 0.03; so.offset = 0
    sub = o.modifiers.new('sub', 'SUBSURF'); sub.levels = sub.render_levels = 1
    for p in o.data.polygons:
        p.use_smooth = True
    return o, cl


def simulate(sc, frames):
    sc.frame_start, sc.frame_end = 1, frames
    for f in range(1, frames + 1):
        sc.frame_set(f)
    return frames


def white_cloth():
    m = bpy.data.materials.new('white'); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1); p.inputs['Roughness'].default_value = 0.9
    if 'Sheen Weight' in p.inputs:
        p.inputs['Sheen Weight'].default_value = 0.3
    return m


def uv_emission():
    m = bpy.data.materials.new('uv'); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    tc = nt.nodes.new('ShaderNodeTexCoord'); em = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(tc.outputs['UV'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
    return m


def bed_camera(sc):
    cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cd.ortho_scale = W / BED_PPM; cd.sensor_fit = 'HORIZONTAL'
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
    # from the foot end (+y) looking towards the head (-y), as the bed pictures are drawn
    cam.rotation_euler = (BED_TILT, 0, math.pi)
    cam.location = (0, math.sin(BED_TILT) * 6, math.cos(BED_TILT) * 6)
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = W, H
    return cam


def place_camera(sc, cam, world, px):
    """Shift the ortho camera so the world point lands on pixel px (x, y from top left)."""
    from bpy_extras.object_utils import world_to_camera_view
    cd = cam.data
    for _ in range(3):
        bpy.context.view_layer.update()
        v = world_to_camera_view(sc, cam, Vector(world))
        tx, ty = px[0] / W, 1 - px[1] / H
        cd.shift_x += (v.x - tx)
        cd.shift_y += (v.y - ty) * H / W


def lights(sc):
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.5, 0.52, 0.56, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.18
    # the bed pictures' light: a soft key from the front left (the foot end), a weak fill
    for loc, size, e in (((-1.6, 2.2, 3.2), 2.5, 95), ((1.8, 1.0, 2.2), 2.0, 22)):
        L = bpy.data.lights.new('k', 'AREA'); L.size = size; L.energy = e
        o = bpy.data.objects.new('k', L); sc.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


def render_passes(sc, cloth, name, catchers, holdouts=()):
    # shading: the white cloth, lit, with its shadow on the mattress
    sc.cycles.samples = 48 if CHECK else 192
    sc.cycles.use_denoising = True
    sc.view_settings.view_transform = 'Standard'
    cloth.data.materials.clear(); cloth.data.materials.append(white_cloth())
    for c in catchers:
        c.hide_render = False; c.is_shadow_catcher = True
    sc.render.filepath = os.path.join(OUT, name + '-shade.png')
    bpy.ops.render.render(write_still=True)
    # uv: raw, the cloth alone
    sc.cycles.samples = 8
    sc.cycles.use_denoising = False
    sc.view_settings.view_transform = 'Raw'
    sc.render.image_settings.color_depth = '16'
    sc.render.filter_size = 0.6
    cloth.data.materials.clear(); cloth.data.materials.append(uv_emission())
    for c in catchers:
        c.hide_render = True
    for c in holdouts:                     # what hides the cloth (the mattress, the footboard)
        c.hide_render = False; c.is_shadow_catcher = False; c.is_holdout = True
    sc.render.filepath = os.path.join(OUT, name + '-uv.png')
    bpy.ops.render.render(write_still=True)
    for c in holdouts:
        c.is_holdout = False
    sc.render.image_settings.color_depth = '8'
    sc.render.filter_size = 1.5
    for c in catchers:
        c.hide_render = False


def bed_scene():
    """Mattress, headboard and footboard as colliders, and a sleeper on the back."""
    sc = reset()
    # world: mattress top at z = 0, the foot end at y = +0.6 (nearest the camera), the head
    # towards -y. The bed picture is a short, stylised bed: from the pillow's edge (y -0.28)
    # to the footboard (y 0.6) there are 0.9 m, so the sleeper is drawn to that length.
    mat = collide(box('mattress', (MAT_W, 1.6, MAT_T), (0, -0.2, -MAT_T / 2)))
    # the footboard: its top a little above the mattress, its front face down to the floor
    foot = collide(box('footboard', (MAT_W + 0.16, 0.12, 0.55), (0, 0.68, -0.215), hide=True))
    body = [
        capsule('torso', (0, -0.3, 0.075), (0, -0.02, 0.075), 0.16),
        capsule('hips', (0, -0.02, 0.065), (0, 0.13, 0.065), 0.14),
        capsule('legL', (-0.075, 0.12, 0.05), (-0.085, 0.5, 0.045), 0.06),
        capsule('legR', (0.075, 0.12, 0.05), (0.085, 0.5, 0.045), 0.06),
        capsule('feetL', (-0.085, 0.5, 0.045), (-0.085, 0.52, 0.12), 0.04),
        capsule('feetR', (0.085, 0.5, 0.045), (0.085, 0.52, 0.12), 0.04),
    ]
    for b in body:
        collide(b, 0.02)
    floor = box('floor', (4, 4, 0.02), (0, 0, -0.45), hide=True)
    collide(floor)
    return sc, mat, foot, floor


if 'bed' in STATES:
    for state in ('bed',):
        sc, mat, foot, floor = bed_scene()
        if state == 'bed':
            cloth, cl = cloth_plane('duvet', 1.22, 0.88, (0, 0.19, 0.22))       # from the chest to the foot end
        else:
            # pulled half off over the foot end: it slides over the footboard and hangs down
            cloth, cl = cloth_plane('duvet', 1.22, 0.88, (0.08, 0.66, 0.26), rot=(0, 0, 0.18))
        simulate(sc, 60 if CHECK else (140 if state == 'bed' else 170))
        cam = bed_camera(sc)
        if state == 'slide':                       # a taller frame: the cloth hangs down to the floor
            sc.render.resolution_y = 1000
        # the mattress's foot-end top edge onto the bed picture's (256, 500 px)
        H = sc.render.resolution_y
        place_camera(sc, cam, (0, 0.6, 0.0), (256, 500))
        lights(sc)
        mat.hide_render = False
        render_passes(sc, cloth, state, [mat])
        print('rendered', state)

if 'floor' in STATES:
    sc = reset()
    floor = collide(box('floor', (4, 4, 0.02), (0, 0, -0.01)))
    # a crumpled heap: the cloth falls over a small lump and draws itself in (shrink)
    lump = collide(box('lump', (0.28, 0.2, 0.12), (0.02, 0.0, 0.06), hide=True))
    cloth, cl = cloth_plane('duvet', 1.22, 0.88, (0, 0, 0.45), rot=(0.5, 0.25, 0.3), cuts=48)
    cl.settings.bending_stiffness = 0.15
    cl.settings.shrink_min = 0.42
    simulate(sc, 60 if CHECK else 110)
    cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
    T = math.radians(33); PPM = 89.7 * 2
    cam.rotation_euler = (T, 0, 0); cam.location = (0, -math.sin(T) * 5, math.cos(T) * 5)
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = 300, 220
    cd.ortho_scale = 300 / PPM
    lights(sc)
    render_passes(sc, cloth, 'floor', [floor])
    print('rendered floor')


# ---------------------------------------------------------------------------
# The sleeper without the duvet (the page shows it when a cat pulls the duvet
# off): a soft, rounded person lying on the back, the head on the pillow (the
# page puts their emoji there, so the head only casts its shadow). Rendered
# from the bed camera like the duvet, two pictures per figure:
# - body-<m|f>-shade.png: in white clay, lit like the bed, with its shadow on
#   the mattress and the pillow;
# - body-<m|f>-zone.png: which garment each pixel is, raw: R the T-shirt,
#   G the trousers, B the skin (neck, arms, hands); black the socks.
def smooth_obj(o, sub=2):
    for p in o.data.polygons:
        p.use_smooth = True
    if sub:
        m = o.modifiers.new('sub', 'SUBSURF'); m.levels = m.render_levels = sub
    o.hide_render = False
    return o


def join(name, parts):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    if len(parts) > 1:
        bpy.ops.object.join()
    o = bpy.context.active_object; o.name = name
    return o


def ellipsoid(loc, r, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=40, ring_count=20, location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = r
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    return smooth_obj(o, 0)


def limb(a, b, ra, rb):
    """A tapered limb from a (radius ra) to b (radius rb): a cone capped with two balls."""
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=ra, radius2=rb, depth=d.length, location=(a + b) / 2, end_fill_type='NOTHING')
    c = bpy.context.active_object
    c.rotation_euler = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_euler()
    bpy.ops.object.transform_apply(rotation=True)
    return [smooth_obj(c, 0), ellipsoid(a, (ra, ra, ra)), ellipsoid(b, (rb, rb, rb))]


def loft(name, stations, n=40, floor=0.006):
    """A smooth body section lying on the mattress: elliptic rings across x (half
    width hw) and z (half depth hd, centre zc) at each y, bridged and capped, the
    underside flattened where it rests on the mattress."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    rings = []
    for (y, hw, hd, zc) in stations:
        ring = []
        for i in range(n):
            t = 2 * math.pi * i / n
            ring.append(bm.verts.new((hw * math.cos(t), y, max(floor, zc + hd * math.sin(t)))))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(n):
            bm.faces.new((r0[i], r0[(i + 1) % n], r1[(i + 1) % n], r1[i]))
    for ring, rev in ((rings[0], True), (rings[-1], False)):
        y = ring[0].co.y; c = bm.verts.new((0, y, sum(v.co.z for v in ring) / n))
        for i in range(n):
            f = (ring[i], ring[(i + 1) % n], c)
            bm.faces.new(f[::-1] if rev else f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return smooth_obj(o, 2)


def sock_foot(name, heel, side):
    """A foot in a sock standing up from the heel (the sole towards the camera at the
    bed's foot, toes up): narrow at the heel, widest at the ball, round at the toes,
    turned out a little as feet fall when lying on the back."""
    me = bpy.data.meshes.new(name); bm = bmesh.new(); n = 36
    # (height above the heel, half width, half thickness, forward offset of the ring)
    st = [(0.0, 0.026, 0.03, 0.0), (0.02, 0.033, 0.036, 0.004), (0.05, 0.036, 0.033, 0.006), (0.085, 0.043, 0.028, 0.004),
          (0.11, 0.045, 0.026, 0.0), (0.13, 0.043, 0.024, -0.003), (0.145, 0.037, 0.021, -0.006), (0.155, 0.026, 0.016, -0.008),
          (0.16, 0.012, 0.009, -0.009)]
    rings = []
    for (h, hw, ht, fy) in st:
        rings.append([bm.verts.new((hw * math.cos(2 * math.pi * i / n), fy + ht * math.sin(2 * math.pi * i / n), h)) for i in range(n)])
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(n):
            bm.faces.new((r0[i], r0[(i + 1) % n], r1[(i + 1) % n], r1[i]))
    for ring, rev in ((rings[0], True), (rings[-1], False)):
        c = bm.verts.new((0, sum(v.co.y for v in ring) / n, ring[0].co.z))
        for i in range(n):
            f = (ring[i], ring[(i + 1) % n], c)
            bm.faces.new(f[::-1] if rev else f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.location = heel
    o.rotation_euler = (-0.22, side * 0.3, 0)          # leaning back a little, toes out
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return smooth_obj(o, 2)


def person(female):
    """A cartoon sleeper on the back, built from clear parts: a T-shirt torso with
    short sleeves, arms (upper arm, elbow, forearm, a mitten hand with a thumb)
    lying a little away from the body, a pelvis in trousers, thighs, knees and
    shins with the sheet showing between them, and the feet up in socks.
    World: mattress top z = 0, head to -y (the emoji on the pillow), feet to +y.
    From the shoulders (y -0.22, the pillow's lower edge) to the heels (0.56):
    legs a little longer than the torso."""
    sh = 0.15 if female else 0.172          # half the shoulders
    ch = 0.15 if female else 0.172          # chest
    wa = 0.118 if female else 0.148         # waist
    hp = 0.158 if female else 0.15          # hips
    # T-shirt: torso loft (y, half width, half depth, centre z)
    torso = loft('torso', [
        (-0.228, 0.07, 0.035, 0.105),
        (-0.222, 0.115, 0.06, 0.1),
        (-0.205, sh - 0.012, 0.074, 0.094),
        (-0.17, ch, 0.084, 0.09),
        (-0.11, ch - 0.004, 0.086, 0.088),
        (-0.05, (ch + wa) / 2, 0.082, 0.085),
        (0.0, wa, 0.078, 0.082),
        (0.045, wa + 0.012, 0.078, 0.08),
        (0.07, wa + 0.016, 0.076, 0.08),
    ])
    shirt = [torso]
    for s in (-1, 1):
        shirt.append(ellipsoid((s * (sh - 0.022), -0.19, 0.088), (0.054, 0.06, 0.052)))          # shoulder cap
        shirt += limb((s * (sh - 0.005), -0.188, 0.085), (s * (sh + 0.03), -0.115, 0.064), 0.058, 0.05)   # short sleeve
        if female:
            shirt.append(ellipsoid((s * 0.06, -0.135, 0.158), (0.052, 0.046, 0.03)))           # a fitted shirt
    pants = [loft('pelvis', [
        (0.04, wa + 0.004, 0.074, 0.078),
        (0.08, hp - 0.004, 0.078, 0.078),
        (0.125, hp, 0.076, 0.076),
        (0.165, hp - 0.02, 0.068, 0.072),
        (0.19, hp - 0.05, 0.052, 0.066),
    ])]
    skin = [ellipsoid((0, -0.255, 0.11), (0.05, 0.05, 0.045))] + limb((0, -0.3, 0.13), (0, -0.23, 0.108), 0.045, 0.048)   # neck
    socks = []
    for s in (-1, 1):
        hip = (s * 0.08, 0.14, 0.07); knee = (s * 0.1, 0.35, 0.054); ank = (s * 0.104, 0.525, 0.042)
        pants += limb(hip, knee, 0.07, 0.047) + limb(knee, ank, 0.047, 0.04) + [ellipsoid((knee[0], knee[1], knee[2] + 0.006), (0.05, 0.05, 0.05))]                        # thigh, knee, shin
        # arm: out of the sleeve to the elbow, a little away from the body, the hand by the thigh
        sho = (s * (sh + 0.018), -0.15, 0.062); elb = (s * (sh + 0.068), -0.01, 0.045); wri = (s * (sh + 0.062), 0.135, 0.036)
        skin += limb(sho, elb, 0.036, 0.032) + limb(elb, wri, 0.032, 0.025)
        skin.append(ellipsoid((s * (sh + 0.058), 0.178, 0.032), (0.03, 0.046, 0.021)))            # mitten
        skin.append(ellipsoid((s * (sh + 0.036), 0.16, 0.038), (0.012, 0.02, 0.012), (0, 0, -s * 0.5)))   # thumb
        # sock: a cuff over the ankle, the heel on the mattress, the foot up, toes splayed a little
        socks += limb((s * 0.104, 0.508, 0.042), (s * 0.105, 0.54, 0.04), 0.039, 0.037)          # the cuff over the ankle
        socks.append(sock_foot('foot', (s * 0.106, 0.548, 0.012), s))
    return {'shirt': join('shirt', shirt), 'pants': join('pants', pants), 'skin': join('skin', skin), 'socks': join('socks', socks)}


def emission(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = rgb + (1,)
    nt.links.new(em.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
    return m


ZONE_RGB = {'shirt': (1, 0, 0), 'pants': (0, 1, 0), 'skin': (0, 0, 1), 'socks': (0, 0, 0)}

if 'body' in STATES:
    for fig in ('m', 'f'):
        sc = reset()
        mat = box('mattress', (MAT_W, 1.6, MAT_T), (0, -0.2, -MAT_T / 2))
        pil = box('pillow', (0.62, 0.38, 0.12), (0, -0.44, 0.045))
        bv = pil.modifiers.new('bv', 'BEVEL'); bv.width = 0.05; bv.segments = 6
        head = ellipsoid((0, -0.39, 0.2), (0.115, 0.11, 0.1)); head.hide_render = False
        head.visible_camera = False                    # their emoji is the head; it casts its shadow
        parts = person(fig == 'f')
        cam = bed_camera(sc)
        place_camera(sc, cam, (0, 0.6, 0.0), (256, 500))
        lights(sc)
        # shade: white clay with its shadow on the mattress and the pillow
        sc.cycles.samples = 48 if CHECK else 256
        sc.cycles.use_denoising = True
        sc.view_settings.view_transform = 'Standard'
        clay = white_cloth()
        clay.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.6
        for o in parts.values():
            o.data.materials.clear(); o.data.materials.append(clay)
        for c in (mat, pil):
            c.is_shadow_catcher = True
        sc.render.filepath = os.path.join(OUT, 'body-%s-shade.png' % fig)
        bpy.ops.render.render(write_still=True)
        # zones: raw colours, the body alone
        sc.cycles.samples = 16
        sc.cycles.use_denoising = False
        sc.view_settings.view_transform = 'Raw'
        sc.render.filter_size = 0.8
        for k, o in parts.items():
            o.data.materials.clear(); o.data.materials.append(emission(k, ZONE_RGB[k]))
        for c in (mat, pil, head):
            c.hide_render = True
        sc.render.filepath = os.path.join(OUT, 'body-%s-zone.png' % fig)
        bpy.ops.render.render(write_still=True)
        print('rendered body', fig)


# ---------------------------------------------------------------------------
# Sliding off: a cat pulls the duvet off the bed's side (the right of the
# picture, world -x). Half of it still lies over the sleeper's legs, the rest
# hangs down the mattress's side to the floor. A wider frame than the bed's
# (800 x 760 px, the bed at the same place), shadows on the sheet and floor.
if 'slide' in STATES:
    sc = reset()
    mat = collide(box('mattress', (MAT_W, 1.6, MAT_T), (0, -0.2, -MAT_T / 2)))
    floor = collide(box('floor', (6, 6, 0.02), (0, 0, -0.46)))
    foot = collide(box('footboard', (MAT_W + 0.16, 0.12, 0.55), (0, 0.68, -0.215)))
    body = person(False)
    for o in body.values():
        collide(o, 0.006)
        o.hide_render = True
    cloth, cl = cloth_plane('duvet', 1.22, 0.88, (-0.44, 0.2, 0.26), rot=(0, 0, -0.08))
    simulate(sc, int(os.environ.get('SLIDE_F', '18')))
    W, H = 800, 760
    cam = bed_camera(sc)
    place_camera(sc, cam, (0, 0.6, 0.0), (256, 500))
    lights(sc)
    render_passes(sc, cloth, 'slide', [mat, floor, foot], [mat, foot])
    print('rendered slide')

# ---------------------------------------------------------------------------
# Carried back: a corner of the duvet in a cat's teeth, the rest dragging on
# the floor behind. From the cats' camera (52 deg, 179.4 px a metre at 2x, as
# scripts/blender/nakts_cats.py), the cat walking to the right: the corner is
# where the walking cat's mouth is, (360, 100) px of a 400 x 200 frame. Four
# frames of the cloth rippling as it is pulled along.
if 'drag' in STATES:
    # The cat takes a corner of the heap in its teeth: the cloth, held there, falls in
    # folds under it (over a lump that then sinks away), then the cat walks off and
    # the heap drags along behind, bunched, not pulled flat nor stretched thin.
    sc = reset()
    floor = collide(box('floor', (12, 6, 0.02), (0, 0, -0.01)))
    floor.hide_render = False
    floor.collision.cloth_friction = 1.6
    lump = collide(box('lump', (0.26, 0.2, 0.14), (-0.3, 0.0, 0.07), hide=True))
    cloth, cl = cloth_plane('duvet', 0.86, 0.62, (-0.3, 0.0, 0.32), rot=(0.45, 0.2, 0.3), cuts=40)
    st = cl.settings
    st.shrink_min = 0.0; st.bending_stiffness = 0.1; st.mass = 0.4; st.quality = 12
    st.tension_stiffness = 80; st.compression_stiffness = 50; st.shear_stiffness = 15
    me = cloth.data; mw = cloth.matrix_world
    tip = max(me.vertices, key=lambda v: (mw @ v.co).x)
    tipw = mw @ tip.co
    vg = cloth.vertex_groups.new(name='pin')
    vg.add([v.index for v in me.vertices if ((mw @ v.co) - tipw).length < 0.09], 1.0, 'REPLACE')
    st.vertex_group_mass = 'pin'
    grip = bpy.data.objects.new('grip', None); sc.collection.objects.link(grip); grip.location = tipw
    hk = cloth.modifiers.new('hook', 'HOOK'); hk.object = grip; hk.vertex_group = 'pin'
    bpy.context.view_layer.update()
    hk.matrix_inverse = grip.matrix_world.inverted() @ cloth.matrix_world      # no jump when bound
    cloth.modifiers.move(cloth.modifiers.find('hook'), 0)                     # before the cloth
    MOUTH_Z = 0.16
    HOLD, END = 40, (70 if CHECK else 104)
    SPEED = 0.26                                                # the cats' walk (23 px/s at 89.7 px/m)
    bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
    start = (tipw.x, tipw.y, MOUTH_Z)
    for f, loc in ((1, tuple(tipw)), (16, start), (HOLD, start), (END, (start[0] + SPEED * (END - HOLD) / 24, start[1], MOUTH_Z))):
        grip.location = loc; grip.keyframe_insert('location', frame=f)
    lump.keyframe_insert('location', frame=24)
    lump.location.z = -0.3; lump.keyframe_insert('location', frame=34)     # the lump sinks away
    sc.frame_start, sc.frame_end = 1, END
    cl.point_cache.frame_start, cl.point_cache.frame_end = 1, END
    for f in range(1, END + 1):                                 # step the cloth through every frame
        sc.frame_set(f)
    cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cd.sensor_fit = 'HORIZONTAL'
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
    T = math.radians(52); PPM = 179.4
    W, H = 400, 200
    sc.render.resolution_x, sc.render.resolution_y = W, H
    cd.ortho_scale = W / PPM
    cam.rotation_euler = (T, 0, 0)
    sc.camera = cam
    lights(sc)
    frames = [END - 9, END - 6, END - 3, END]
    for i, f in enumerate(frames):
        sc.frame_set(f)
        g = grip.matrix_world.translation
        cam.location = (g.x, g.y - math.sin(T) * 5, g.z + math.cos(T) * 5)
        cd.shift_x = cd.shift_y = 0
        place_camera(sc, cam, tuple(g), (360, 100))
        render_passes(sc, cloth, 'drag-%d' % i, [floor])
    print('rendered drag')

# ---------------------------------------------------------------------------
# The duvet on the sleeper: the same figure as 'body' lies under it, the duvet
# from the shoulders to the ankles, the feet up in their socks out of its end.
# Per figure (m, f): bed-<fig>-shade (cloth and figure in white, lit, with the
# shadows), bed-<fig>-uv (the cloth, the figure hiding it where in front) and
# bed-<fig>-zone (what shows of the figure: its garments as in 'body').
if 'bedbody' in STATES:
    for fig in ('m', 'f'):
        sc = reset()
        mat = collide(box('mattress', (MAT_W, 1.6, MAT_T), (0, -0.2, -MAT_T / 2)))
        foot = collide(box('footboard', (MAT_W + 0.16, 0.12, 0.55), (0, 0.68, -0.215), hide=True))
        parts = person(fig == 'f')
        for o in parts.values():
            collide(o, 0.006)
        cloth, cl = cloth_plane('duvet', 1.22, 0.73, (0, 0.125, 0.3))
        simulate(sc, 60 if CHECK else 140)
        cam = bed_camera(sc)
        place_camera(sc, cam, (0, 0.6, 0.0), (256, 500))
        lights(sc)
        clay = white_cloth()
        clay.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.6
        for o in parts.values():
            o.data.materials.clear(); o.data.materials.append(clay)
        # shade: everything white, the mattress catching the shadows
        sc.cycles.samples = 48 if CHECK else 224
        sc.cycles.use_denoising = True
        sc.view_settings.view_transform = 'Standard'
        cloth.data.materials.clear(); cloth.data.materials.append(white_cloth())
        mat.hide_render = False; mat.is_shadow_catcher = True
        sc.render.filepath = os.path.join(OUT, 'bed-%s-shade.png' % fig)
        bpy.ops.render.render(write_still=True)
        # uv: the cloth, the figure in front of it hiding it
        sc.cycles.samples = 8; sc.cycles.use_denoising = False
        sc.view_settings.view_transform = 'Raw'
        sc.render.image_settings.color_depth = '16'; sc.render.filter_size = 0.6
        cloth.data.materials.clear(); cloth.data.materials.append(uv_emission())
        mat.hide_render = True
        for o in parts.values():
            o.is_holdout = True
        sc.render.filepath = os.path.join(OUT, 'bed-%s-uv.png' % fig)
        bpy.ops.render.render(write_still=True)
        # zone: what shows of the figure, the cloth hiding the rest
        sc.render.image_settings.color_depth = '8'; sc.render.filter_size = 0.8; sc.cycles.samples = 16
        for k, o in parts.items():
            o.is_holdout = False
            o.data.materials.clear(); o.data.materials.append(emission(k, ZONE_RGB[k]))
        cloth.is_holdout = True
        sc.render.filepath = os.path.join(OUT, 'bed-%s-zone.png' % fig)
        bpy.ops.render.render(write_still=True)
        print('rendered bedbody', fig)
