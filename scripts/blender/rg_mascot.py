"""The RG mascots ("Būtne"): small plush creatures in long, soft fur (Blender's Quick Fur: hair curves with noise and
frizz), with two large dark glossy eyes, a tiny mouth and pink cheeks. Several kinds (KINDS), so that each person can have their own; five expressions for the steps of fatigue,
each in the app's colour for that step (kalendars/js/fatigue.js FATIGUE_LEVELS). Every picture comes from the same
camera, light and frame, so they can be swapped in place:

    happy       green    wide eyes, an open smile
    normal      yellow   a small smile
    tired       orange   eyes half shut
    very-tired  red      eyes half shut and drooping, small worn brows, a yawn
    exhausted   red      eyes shut, asleep

Each picture is built from scratch and rendered on a transparent background (Cycles), then saved as a PNG master
named <kind>-<expression>.png; --webp also writes 384 and 256 px WebP files with cwebp. --blend keeps the last built
scene as a .blend.

    Blender -b -P scripts/blender/rg_mascot.py -- OUT_DIR [--kind zakis] [--only tired] [--size 768] [--samples 128] [--webp] [--blend]

Tired never means angry. There are no eyelids to slam down over a bulging eye: a sleepy eye is the eye itself cut
flat on top, with its outer corner lower. Shut eyes are two soft arcs bulging down. Ears and feelers hang lower the
more tired the creature is.
"""
import math
import os
import subprocess
import sys

import bmesh
import bpy
from mathutils import Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0]) if ARGS and not ARGS[0].startswith('--') else os.path.abspath('rg-mascot-out')


def opt(name, default=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS and ARGS.index(name) + 1 < len(ARGS) else default


SIZE = int(opt('--size', 768))
SAMPLES = int(opt('--samples', 128))
ONLY = opt('--only')
KIND = opt('--kind')

# The fur's colour per level: the app's level colours (FATIGUE_LEVELS) in linear RGB.
GREEN = (0.054, 0.694, 0.283)    # #42d991
YELLOW = (0.930, 0.640, 0.020)   # #e7d34b, warmer: yellow fur goes olive in its own shadow
ORANGE = (1.000, 0.346, 0.056)   # #ff9f43
RED = (1.000, 0.107, 0.162)      # #ff5c70

# shut: how far the eyes are shut (0 open .. 1 shut); roll: outer corners down, degrees; brow: small worn brows;
# mouth: its kind; sx / sz: the body's posture; eye: the eyes' size; flop: how far ears and feelers hang (0 .. 1).
EXPRESSIONS = {
    'happy':      dict(col=GREEN,  shut=0.00, roll=0,  brow=0, mouth='open',  sx=0.98, sz=1.04, eye=1.14, flop=0.00),
    'normal':     dict(col=YELLOW, shut=0.00, roll=0,  brow=0, mouth='smile', sx=1.00, sz=1.00, eye=1.00, flop=0.10),
    'tired':      dict(col=ORANGE, shut=0.42, roll=9,  brow=0, mouth='smile', sx=1.02, sz=0.97, eye=1.04, flop=0.40),
    'very-tired': dict(col=RED,    shut=0.56, roll=15, brow=1, mouth='yawn',  sx=1.04, sz=0.94, eye=1.04, flop=0.70),
    'exhausted':  dict(col=RED,    shut=1.00, roll=8,  brow=0, mouth='o',     sx=1.08, sz=0.88, eye=1.00, flop=1.00),
}

# body: half-axes before shaping; up: lifted or sunk in the frame, to leave room for legs or ears; eye: where the
# eyes sit (x, z on the unshaped body); tuft: longer fur on top (0 none .. 1 a crest).
KINDS = {
    'pufs':    dict(body=(1.10, 1.06, 1.06), up=0.00,  eye=(0.44, 0.10), tuft=0.0),   # a round puff with two paws
    'astonis': dict(body=(0.98, 0.98, 0.92), up=0.04,  eye=(0.44, 0.00), tuft=0.5),   # four stubby legs, a forelock
    'lacis':   dict(body=(1.04, 1.02, 0.98), up=-0.10, eye=(0.42, 0.08), tuft=0.0),   # round ears
    'zakis':   dict(body=(0.96, 0.96, 0.88), up=-0.26, eye=(0.40, 0.08), tuft=0.0),   # long ears that flop when tired
    'antenas': dict(body=(1.00, 1.00, 0.92), up=-0.26, eye=(0.42, 0.08), tuft=0.0),   # two feelers with fuzzy ends
    'cekuls':  dict(body=(1.02, 1.00, 0.98), up=-0.10, eye=(0.42, 0.08), tuft=1.0),   # round, with a tuft of long hair
}

BODY, UP = KINDS['pufs']['body'], 0.0   # the kind being built (set in build)
FUR = 0.20                              # the fur's length; on the face it is about half of that


def material(name, color, rough=0.5, coat=0.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = color
    p.inputs['Roughness'].default_value = rough
    if 'Coat Weight' in p.inputs:
        p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = color
        p.inputs['Emission Strength'].default_value = emit
    return m


def fur_material(color, cheeks):
    """The fur, as in the walkthrough the look comes from: plain Principled on hair curves. The roots are a little
    deeper, the tips lighter, and at the cheeks the fur itself turns pink."""
    m = bpy.data.materials.new('fur')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.5
    strand = nt.nodes.new('ShaderNodeHairInfo')
    tip = nt.nodes.new('ShaderNodeMix')
    tip.data_type = 'RGBA'
    tip.inputs[6].default_value = tuple(c * 0.88 for c in color) + (1,)
    tip.inputs[7].default_value = tuple(c + (1 - c) * 0.22 for c in color) + (1,)
    nt.links.new(strand.outputs['Intercept'], tip.inputs[0])
    where = nt.nodes.new('ShaderNodeNewGeometry')
    near = None
    for c in cheeks:
        d = nt.nodes.new('ShaderNodeVectorMath')
        d.operation = 'DISTANCE'
        d.inputs[1].default_value = c
        nt.links.new(where.outputs['Position'], d.inputs[0])
        r = nt.nodes.new('ShaderNodeMapRange')
        r.inputs['From Min'].default_value = 0.08
        r.inputs['From Max'].default_value = 0.25
        r.inputs['To Min'].default_value = 0.9
        r.inputs['To Max'].default_value = 0.0
        nt.links.new(d.outputs['Value'], r.inputs['Value'])
        if near:
            mx = nt.nodes.new('ShaderNodeMath')
            mx.operation = 'MAXIMUM'
            nt.links.new(near, mx.inputs[0])
            nt.links.new(r.outputs['Result'], mx.inputs[1])
            near = mx.outputs[0]
        else:
            near = r.outputs['Result']
    blush = nt.nodes.new('ShaderNodeMix')
    blush.data_type = 'RGBA'
    blush.inputs[7].default_value = (1.0, 0.42, 0.52, 1)
    nt.links.new(tip.outputs[2], blush.inputs[6])
    if near:
        nt.links.new(near, blush.inputs[0])
    else:
        blush.inputs[0].default_value = 0
    nt.links.new(blush.outputs[2], p.inputs['Base Color'])
    return m


def sphere(name, radius, loc, scale=(1, 1, 1), mat=None, seg=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.shade_smooth()
    if mat:
        o.data.materials.append(mat)
    return o


def arc(radius, thick, loc, mat, squash=0.6):
    """A soft arc bulging down (a smile, a shut eye): the lower half of a ring, facing the camera."""
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=thick, major_segments=40, minor_segments=10,
                                     location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.object
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > 0.004], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    o.scale = (1.0, squash, 1.0)
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    return o


def cut_top(obj, z):
    """Cut the mesh flat at local height z and close the cut."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z), plane_no=(0, 0, 1), clear_outer=True)
    edges = [g for g in res['geom_cut'] if isinstance(g, bmesh.types.BMEdge)]
    if edges:
        bmesh.ops.edgeloop_fill(bm, edges=edges)
    bm.to_mesh(obj.data)
    bm.free()


def flatten(z):
    """The body is soft and a little flat underneath."""
    return z if z >= -0.55 else -0.55 - (-0.55 - z) * 0.62


def shape_body(z, x, sx, sz):
    """The body's silhouette: a dome, a little wider low down. The posture (sx, sz) squashes it onto its base, so a
    tired creature sinks instead of rising off the ground."""
    floor = flatten(-BODY[2])
    z = flatten(z)
    x *= 1.0 + 0.07 * (0.5 - z) / 1.5
    x += 0.02 * z
    return x * sx, (z - floor) * sz + floor + UP


def surface_y(x, z):
    """The front of the body (towards the camera, -Y) at x, z: where the face sits."""
    q = 1 - (x / BODY[0]) ** 2 - (z / BODY[2]) ** 2
    return -BODY[1] * math.sqrt(max(q, 0.02))


def fur(obj, length, mat, mask=None):
    """Quick Fur on obj: hair curves, interpolated, with noise and frizz. mask: a vertex group that says where."""
    before = set(bpy.data.objects)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.quick_fur(density='HIGH', length=length, radius=0.0022, view_percentage=1.0, apply_hair_guides=True, use_noise=True, use_frizz=True)
    hair = (set(bpy.data.objects) - before).pop()
    hair.data.materials.clear()
    hair.data.materials.append(mat)
    for m in list(hair.modifiers):
        if m.name == 'Hair Dynamics':   # no simulation: a still picture
            hair.modifiers.remove(m)
    if mask:
        where = hair.modifiers['Interpolate Hair Curves'].properties.inputs.Input_14   # "Density Mask"
        where.type = 'ATTRIBUTE'
        where.attribute_name = mask
    return hair


def build(kind, expr):
    global BODY, UP
    k, e = KINDS[kind], EXPRESSIONS[expr]
    BODY, UP = k['body'], k['up']
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    col = e['col']
    skin = material('skin', tuple(c * 0.8 for c in col) + (1,), rough=0.85)
    rimm = material('rim', tuple(c + (1 - c) * 0.78 for c in col) + (1,), rough=0.6)
    black = material('eye', (0.030, 0.008, 0.006, 1), rough=0.03, coat=1.0)
    tooth = material('tooth', (0.95, 0.93, 0.88, 1), rough=0.4)
    white = material('glint', (1, 1, 1, 1), rough=0.2, emit=1.6)
    dark = material('mouth', (0.14, 0.03, 0.03, 1), rough=0.6)
    pink = material('tongue', (1.0, 0.34, 0.42, 1), rough=0.5)

    # --- the body
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1)
    body = bpy.context.object
    body.name = 'body'
    for v in body.data.vertices:
        x, z = shape_body(v.co.z * BODY[2], v.co.x * BODY[0], e['sx'], e['sz'])
        v.co = (x, v.co.y * BODY[1], z)
    bpy.ops.object.shade_smooth()
    body.data.materials.append(skin)
    floor = shape_body(-BODY[2], 0, e['sx'], e['sz'])[1]

    def face(x, z, lift=0.0):
        """A point on the front of the body; lift < 0 stands out in front of it."""
        fx, fz = shape_body(z, x, e['sx'], e['sz'])
        return Vector((fx, surface_y(x, z) + lift, fz))

    def crown(x, sink=0.0):
        """A point on top of the body, above x."""
        fx, fz = shape_body(BODY[2] * math.sqrt(max(1 - (x / BODY[0]) ** 2, 0.02)), x, e['sx'], e['sz'])
        return Vector((fx, 0, fz - sink))

    def fuzzy(name, loc, scale, length=FUR * 0.6, turn=0.0):
        """A furry part (a paw, an ear). Its scale is baked into the mesh: fur grows crooked on a scaled object."""
        o = sphere(name, 1.0, loc, scale, skin, 48, 24)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        o.rotation_euler[1] = turn
        fur(o, length, furm)
        return o

    eye_x, eye_z = k['eye']
    eyes = [face(-eye_x, eye_z, -0.035), face(eye_x, eye_z, -0.035)]
    mouth_at = face(0.0, eye_z - 0.16, -0.075)

    er = 0.205 * e['eye']
    furm = fur_material(col, [face(sgn * (eye_x + 0.30), eye_z - 0.24, -0.06) for sgn in (-1, 1)])

    # Where the fur grows: long on the body, short on the face (two coats that fade into each other), none where
    # the open part of an eye is.
    centre = face(0.0, eye_z - 0.06)
    coats = body.vertex_groups.new(name='long'), body.vertex_groups.new(name='short')
    for v in body.data.vertices:
        on_face = 0.0 if v.co.y > 0 else 1 - min(1.0, max(0.0, (math.hypot(v.co.x - centre.x, v.co.z - centre.z) - 0.46) / 0.22))
        for sgn, at in zip((-1, 1), eyes):
            dx, dz = v.co.x - at.x, v.co.z - at.z
            lid = er * (1 - 2 * e['shut']) + 0.02 - sgn * dx * math.tan(math.radians(e['roll']))
            if v.co.y < 0 and e['shut'] < 0.98 and math.hypot(dx, dz) < er * 1.04 and dz < lid:
                on_face = None
        coats[0].add([v.index], 0.0 if on_face is None else 1 - on_face, 'REPLACE')
        coats[1].add([v.index], 0.0 if on_face is None else on_face, 'REPLACE')
    fur(body, FUR, furm, 'long')
    fur(body, FUR * 0.5, furm, 'short')
    if k['tuft']:
        fuzzy('tuft', crown(0.0, 0.06), (0.13, 0.12, 0.08), FUR * (1.2 + 0.7 * k['tuft']))   # sunk in: only its long hair shows

    # --- what makes the kind: legs, paws, ears, feelers
    a = math.radians(1)
    if kind == 'astonis':
        for x, y in ((-0.66, -0.26), (-0.24, -0.60), (0.24, -0.60), (0.66, -0.26)):
            fuzzy('leg', (x * e['sx'], y, floor - 0.08), (0.22, 0.22, 0.30), FUR * 0.8)
    else:
        for sgn in (-1, 1):
            fuzzy('paw', (sgn * 0.34 * e['sx'], -BODY[1] * 0.85, floor + 0.14), (0.20, 0.16, 0.13), FUR * 0.5)
    if kind == 'lacis':
        for sgn in (-1, 1):
            fuzzy('ear', crown(sgn * 0.66, 0.06), (0.27, 0.15, 0.27), FUR * 0.6)
    if kind == 'zakis':
        for sgn in (-1, 1):
            t = sgn * (10 + 140 * e['flop']) * a
            root = crown(sgn * (0.36 + 0.42 * e['flop']), 0.10) + Vector((0, -0.40 * e['flop'], 0))
            fuzzy('ear', root + Vector((math.sin(t), 0, math.cos(t))) * 0.34, (0.15, 0.10, 0.37), FUR * 0.55, t)
    if kind == 'antenas':
        for sgn in (-1, 1):
            t = sgn * (14 + 46 * e['flop']) * a
            base, way = crown(sgn * 0.36, 0.06), Vector((math.sin(t), 0, math.cos(t)))
            bpy.ops.mesh.primitive_cylinder_add(radius=0.024, depth=0.64, location=base + way * 0.32, rotation=(0, t, 0))
            bpy.context.object.data.materials.append(skin)
            fuzzy('bob', base + way * 0.66, (0.13, 0.13, 0.13), FUR * 0.5)

    # --- the eyes: large, round, dark brown and glossy, each in a pale socket. A sleepy eye is the same eye cut flat
    # on top, its outer corner lower; the fur closes over the cut.
    for sgn, at in zip((-1, 1), eyes):
        if e['shut'] >= 0.98:
            lash = arc(er * 0.95, 0.034, at + Vector((0, -0.11, er * 0.10)), dark, 0.6)
            lash.rotation_euler[1] = math.radians(sgn * e['roll'])
        else:
            eye = sphere('eye', er, at, (1.0, 0.60, 1.06), black, 48, 24)
            rim = sphere('rim', er * 1.13, at + Vector((0, 0.05, 0)), (1.0, 0.30, 1.06), rimm, 48, 24)
            low = e['shut'] > 0.02
            if low:
                for o in (eye, rim):
                    cut_top(o, er * (1 - 2 * e['shut']))
                    o.rotation_euler[1] = math.radians(sgn * e['roll'])
            sphere('glint', er * (0.14 if low else 0.20), at + Vector((-er * 0.26, -er * 0.56, er * (-0.22 if low else 0.34))), (1, 0.5, 1), white, 16, 8)
            if not low:
                sphere('glint2', er * 0.09, at + Vector((er * 0.32, -er * 0.56, -er * 0.34)), (1, 0.5, 1), white, 16, 8)
        if e['brow']:
            # a short soft brow, its inner end raised: worn, never frowning
            b = sphere('brow', 0.028, at + Vector((sgn * 0.02, -0.14, er * 1.0)), (2.8, 0.7, 0.7), dark, 24, 12)
            b.rotation_euler = (0, math.radians(sgn * 20), 0)

    # --- the mouth: tiny, standing just in front of the short fur
    m = e['mouth']
    if m == 'smile':
        arc(0.085, 0.026, mouth_at + Vector((0, -0.07, 0.04)), dark)
    else:
        w, h = {'open': (0.17, 0.14), 'yawn': (0.080, 0.100), 'o': (0.058, 0.064)}[m]
        mouth = sphere('mouth', 1.0, mouth_at + Vector((0, -0.03, -0.01)), (w, 0.06, h), dark, 32, 16)
        if m == 'open':
            cut_top(mouth, 0.22)   # an open smile: flat on top, round below
            for sgn in (-1, 1):
                sphere('tooth', 1.0, mouth_at + Vector((sgn * 0.034, -0.085, h * 0.12 - 0.01)), (0.030, 0.02, 0.034), tooth, 16, 8)
        if m != 'o':
            sphere('tongue', 1.0, mouth_at + Vector((0, -0.058, -0.01 - h * 0.42)), (w * 0.62, 0.04, h * 0.42), pink, 24, 12)

    # --- the light: soft and frontal, a fill from each side, a strong rim from behind that lights the fur's edge;
    # the same for every picture
    def area(loc, energy, size, color=(1, 1, 1)):
        bpy.ops.object.light_add(type='AREA', location=loc)
        l = bpy.context.object
        l.data.energy = energy
        l.data.size = size
        l.data.color = color
        l.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return l

    area((-0.8, -6.0, 3.0), 600, 8.0, (1.0, 0.98, 0.95))
    area((-4.5, -3.0, 1.5), 210, 6.0)
    area((4.5, -3.0, 1.5), 210, 6.0)
    area((0.4, 4.0, 3.8), 620, 3.0)
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.46, 0.46, 0.46, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.70
    scene.world = world

    # --- the camera: orthographic, a little from above; the frame holds every kind and posture
    bpy.ops.object.camera_add(location=(0, -9, 1.05))
    cam = bpy.context.object
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 3.05
    cam.rotation_euler = (Vector((0, 0, -0.06)) - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    # --- the render
    scene.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = 'GPU'
    except Exception as err:   # no GPU here: the CPU renders the same picture, slower
        print('rg_mascot: GPU not used:', err)
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = SIZE
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    return scene


def main():
    os.makedirs(OUT, exist_ok=True)
    for kind in ([KIND] if KIND else list(KINDS)):
        for name in ([ONLY] if ONLY else list(EXPRESSIONS)):
            scene = build(kind, name)
            png = os.path.join(OUT, '%s-%s.png' % (kind, name))
            scene.render.filepath = png
            bpy.ops.render.render(write_still=True)
            print('rg_mascot: rendered', png)
            if '--webp' in ARGS:
                for px in (384, 256):
                    webp = os.path.join(OUT, '%s-%s-%d.webp' % (kind, name, px))
                    subprocess.run(['cwebp', '-quiet', '-q', '86', '-alpha_q', '90', '-m', '6', '-resize', str(px), str(px), png, '-o', webp], check=True)
                    print('rg_mascot: wrote', webp, os.path.getsize(webp) // 1024, 'KB')
    if '--blend' in ARGS:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'rg-mascot.blend'))


main()
