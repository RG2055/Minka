"""Things to put on a Nakts bed: throw pillows (Poly Haven CC0 "throw_pillows_01"),
a rubber duck and a football (Poly Haven CC0), a teddy bear and a bunny (modelled
here). Each is rendered alone from the classic bed's view (from above, 44 deg
from the foot end, orthographic) at the bed picture's scale, so the room can lay
them on any bed at the right size. Transparent PNGs + sizes.json.

    Blender -b -P scripts/blender/bed_accessories.py -- MODELS_DIR OUT_DIR FABRICS_DIR [only keys...]
"""
import json
import math
import os
import sys

import bpy
from mathutils import Euler, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
MODELS, OUT = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
PPM = 427          # pixels per metre on the 512 px bed picture (1.2 m wide bed)
TILT = math.radians(44)


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
    sc.cycles.samples = 128
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.5, .5, .52, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = .45
    return sc


def lights(sc):
    def area(loc, size, energy, rot):
        ld = bpy.data.lights.new('a', 'AREA')
        ld.size = size
        ld.energy = energy
        lo = bpy.data.objects.new('a', ld)
        lo.location = loc
        lo.rotation_euler = rot
        sc.collection.objects.link(lo)
    area((-2.5, -3, 6), 5, 260, (math.radians(30), math.radians(-22), 0))
    area((3, -1.5, 5), 6, 90, (math.radians(18), math.radians(28), 0))
    area((0, 1.5, 7), 5, 70, (0, 0, 0))


def frame_and_render(sc, path):
    """Camera from the bed's view; the picture is cut to the object at PPM."""
    cd = bpy.data.cameras.new('cam')
    cd.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cd)
    sc.collection.objects.link(cam)
    cam.location = (0, -math.sin(TILT) * 14, math.cos(TILT) * 14 + .4)
    cam.rotation_euler = (TILT, 0, 0)
    sc.camera = cam
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    inv = cam.matrix_world.inverted()
    xs, ys = [], []
    for ob in sc.objects:
        if ob.type != 'MESH' or ob.hide_render:
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            c = inv @ (ev.matrix_world @ v.co)
            xs.append(c.x)
            ys.append(c.y)
        ev.to_mesh_clear()
    pad = .02
    ex, ey = max(xs) - min(xs) + pad * 2, max(ys) - min(ys) + pad * 2
    rx, ry = max(8, round(ex * PPM)), max(8, round(ey * PPM))
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    cd.ortho_scale = max(ex, ey)
    cd.shift_x = ((max(xs) + min(xs)) / 2) / cd.ortho_scale
    cd.shift_y = ((max(ys) + min(ys)) / 2) / cd.ortho_scale
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return rx, ry


def import_gltf(name):
    folder = os.path.join(MODELS, name)
    f = [x for x in os.listdir(folder) if x.endswith('.gltf')][0]
    bpy.ops.import_scene.gltf(filepath=os.path.join(folder, f))
    return [o for o in bpy.context.scene.objects if o.type == 'MESH']


def lay_flat(objs, target_len):
    """Scale to size and set on the bed surface (z = 0)."""
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    size = max(max(p[i] for p in pts) - min(p[i] for p in pts) for i in range(3))
    k = target_len / size
    for o in objs:
        o.scale = o.scale * k
        o.location = o.location * k
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    cx = (max(p[0] for p in pts) + min(p[0] for p in pts)) / 2
    cy = (max(p[1] for p in pts) + min(p[1] for p in pts)) / 2
    mz = min(p[2] for p in pts)
    for o in objs:
        o.location -= Vector((cx, cy, mz))


def plush_mat(name, rgb, fuzz=.35):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = .9
    for key in ('Sheen Weight', 'Sheen'):
        if key in p.inputs:
            p.inputs[key].default_value = .8
            break
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 900
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = fuzz
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m


def blob(r, loc, m, scale=(1, 1, 1), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, rotation=rot, segments=48, ring_count=24)
    o = bpy.context.active_object
    o.scale = scale
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    return o


def teddy(fur, pad, eye):
    """A sitting teddy, facing the foot end (the viewer), ~26 cm."""
    s = .26 / .9
    blob(.26 * s, (0, 0, .28 * s), fur, (1, .85, 1.05))                   # body
    blob(.2 * s, (0, -.02 * s, .66 * s), fur)                              # head
    for x in (-.15, .15):
        blob(.075 * s, (x * s, .02 * s, .82 * s), fur, (1, .55, 1))        # ears
        blob(.045 * s, (x * s, -.02 * s, .82 * s), pad, (1, .4, 1))
        blob(.085 * s, ((x * 1.55) * s, -.06 * s, .36 * s), fur, (.8, .8, 1.35), (0, math.radians(-25 if x < 0 else 25), 0))  # arms
        blob(.1 * s, (x * s, -.2 * s, .1 * s), fur, (.85, 1.35, .75))      # legs
        blob(.06 * s, (x * s, -.33 * s, .1 * s), pad, (.8, .35, .9))       # foot pads
        blob(.026 * s, ((x * .45) * s, -.18 * s, .7 * s), eye)             # eyes
    blob(.08 * s, (0, -.17 * s, .6 * s), pad, (1, .8, .75))                # snout
    blob(.03 * s, (0, -.23 * s, .64 * s), eye)                             # nose


def bunny(fur, pad, eye):
    s = .28 / .95
    blob(.24 * s, (0, 0, .25 * s), fur, (1, .9, 1.05))
    blob(.18 * s, (0, -.03 * s, .6 * s), fur)
    for x in (-.08, .08):
        blob(.06 * s, (x * s, .02 * s, .9 * s), fur, (.8, .5, 2.4), (0, math.radians(-12 if x < 0 else 12), 0))
        blob(.035 * s, (x * s, -.01 * s, .9 * s), pad, (.8, .3, 2.2), (0, math.radians(-12 if x < 0 else 12), 0))
        blob(.08 * s, ((x * 2.2) * s, -.1 * s, .3 * s), fur, (.8, .8, 1.2))
        blob(.09 * s, ((x * 1.8) * s, -.2 * s, .08 * s), fur, (.8, 1.4, .7))
        blob(.022 * s, ((x * .8) * s, -.17 * s, .64 * s), eye)
    blob(.03 * s, (0, -.2 * s, .56 * s), pad)



out = {}
FAB = sys.argv[sys.argv.index('--') + 3] if len(sys.argv) > sys.argv.index('--') + 3 else ''


def save(key, sc):
    rx, ry = frame_and_render(sc, os.path.join(OUT, key + '.png'))
    out[key] = [rx, ry]
    print('rendered', key, rx, ry)


def cone(r1, r2, h, loc, m, rot=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=h, location=loc, rotation=rot, vertices=32)
    o = bpy.context.active_object
    o.scale = scale
    sub = o.modifiers.new('s', 'SUBSURF'); sub.levels = sub.render_levels = 2
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    return o


def M(rgb, fuzz=.35):
    return plush_mat('m', rgb, fuzz)


EYE = None


def eyes(s, y, z, dx=.07, r=.024):
    for x in (-dx, dx):
        blob(r * s, (x * s, y * s, z * s), EYE)


# ── plush toys (sitting, facing the foot end = the viewer), ~22–30 cm ──
def t_teddy(c1, c2):
    teddy(M(c1), M(c2, .1), EYE)


def t_panda():
    w, k = M((.92, .92, .9)), M((.05, .05, .06))
    s = .26 / .9
    blob(.26 * s, (0, 0, .28 * s), w, (1, .85, 1.05))
    blob(.2 * s, (0, -.02 * s, .66 * s), w)
    for x in (-.15, .15):
        blob(.07 * s, (x * s, .02 * s, .82 * s), k, (1, .55, 1))
        blob(.085 * s, ((x * 1.55) * s, -.06 * s, .36 * s), k, (.8, .8, 1.35), (0, math.radians(-25 if x < 0 else 25), 0))
        blob(.1 * s, (x * s, -.2 * s, .1 * s), k, (.85, 1.35, .75))
        blob(.05 * s, ((x * .5) * s, -.16 * s, .7 * s), k, (1, .5, 1.3), (0, math.radians(-30 if x < 0 else 30), 0))
        blob(.018 * s, ((x * .5) * s, -.2 * s, .71 * s), w)
    blob(.07 * s, (0, -.17 * s, .6 * s), w, (1, .8, .75))
    blob(.028 * s, (0, -.23 * s, .63 * s), k)


def t_cat(c1, c2):
    f, pd = M(c1), M(c2, .1)
    s = .25 / .9
    blob(.25 * s, (0, 0, .27 * s), f, (1, .9, 1.05))
    blob(.19 * s, (0, -.03 * s, .64 * s), f, (1.08, 1, .95))
    for x in (-.11, .11):
        cone(.06 * s, 0, .14 * s, (x * s, -.01 * s, .82 * s), f, (0, math.radians(-15 if x < 0 else 15), 0), (1, .6, 1))
        blob(.09 * s, (x * s, -.21 * s, .1 * s), f, (.8, 1.3, .7))
        blob(.028 * s, ((x * .6) * s, -.19 * s, .68 * s), M((.35, .75, .3), .05))
    blob(.06 * s, (0, -.18 * s, .6 * s), pd, (1, .7, .7))
    blob(.022 * s, (0, -.23 * s, .62 * s), M((.9, .45, .5), .05))
    blob(.05 * s, (.22 * s, .15 * s, .1 * s), f, (1, 3.2, .8), (0, 0, math.radians(-35)))


def t_dog():
    f, e = M((.86, .74, .55)), M((.52, .36, .22))
    s = .26 / .9
    blob(.25 * s, (0, 0, .27 * s), f, (1, .9, 1.05))
    blob(.19 * s, (0, -.03 * s, .64 * s), f)
    blob(.1 * s, (0, -.19 * s, .58 * s), f, (1, .9, .75))
    blob(.035 * s, (0, -.28 * s, .62 * s), M((.05, .04, .04), .05))
    for x in (-.17, .17):
        blob(.07 * s, (x * s, -.02 * s, .62 * s), e, (.6, .5, 1.6), (0, math.radians(-20 if x < 0 else 20), 0))
        blob(.09 * s, (x * s, -.2 * s, .1 * s), f, (.8, 1.3, .7))
    eyes(s, -.17, .7, .07, .024)


def t_penguin():
    k, w, o = M((.06, .07, .09)), M((.94, .94, .92)), M((.95, .55, .12), .1)
    s = .26 / .9
    blob(.26 * s, (0, 0, .36 * s), k, (1, .9, 1.35))
    blob(.2 * s, (0, -.08 * s, .34 * s), w, (1, .6, 1.3))
    blob(.18 * s, (0, -.02 * s, .78 * s), k)
    blob(.12 * s, (0, -.1 * s, .76 * s), w, (1, .6, .9))
    cone(.04 * s, 0, .09 * s, (0, -.2 * s, .74 * s), o, (math.radians(90), 0, 0))
    for x in (-.12, .12):
        blob(.07 * s, (x * s, -.12 * s, .04 * s), o, (1, 1.4, .4))
        blob(.08 * s, ((x * 2.2) * s, 0, .4 * s), k, (.45, .8, 1.5), (0, math.radians(-15 if x < 0 else 15), 0))
    eyes(s, -.15, .82, .06, .022)


def t_fox():
    o, w = M((.93, .45, .12)), M((.95, .93, .88))
    s = .25 / .9
    blob(.25 * s, (0, 0, .27 * s), o, (1, .9, 1.05))
    blob(.15 * s, (0, -.12 * s, .3 * s), w, (1, .6, 1))
    blob(.19 * s, (0, -.03 * s, .64 * s), o, (1.1, 1, .9))
    cone(.09 * s, .01 * s, .16 * s, (0, -.2 * s, .6 * s), w, (math.radians(90), 0, 0))
    blob(.022 * s, (0, -.29 * s, .6 * s), M((.05, .04, .04), .05))
    for x in (-.11, .11):
        cone(.065 * s, 0, .17 * s, (x * s, 0, .84 * s), o, (0, math.radians(-15 if x < 0 else 15), 0), (1, .55, 1))
        blob(.09 * s, (x * s, -.2 * s, .1 * s), o, (.8, 1.3, .7))
    eyes(s, -.16, .69, .07, .022)
    blob(.08 * s, (.23 * s, .12 * s, .12 * s), o, (1, 2.8, .9), (0, 0, math.radians(-30)))
    blob(.06 * s, (.34 * s, .31 * s, .12 * s), w, (1, 1.3, .9), (0, 0, math.radians(-30)))


def t_frog():
    g, l = M((.35, .7, .3)), M((.8, .9, .6))
    s = .24 / .9
    blob(.27 * s, (0, 0, .24 * s), g, (1.1, 1, .9))
    blob(.17 * s, (0, -.12 * s, .22 * s), l, (1, .6, .8))
    for x in (-.13, .13):
        blob(.08 * s, (x * s, -.08 * s, .48 * s), g)
        blob(.045 * s, (x * s, -.14 * s, .5 * s), M((.97, .97, .95), .05))
        blob(.025 * s, (x * s, -.18 * s, .5 * s), EYE)
        blob(.09 * s, ((x * 2) * s, -.12 * s, .06 * s), g, (1, 1.5, .5))


def t_elephant():
    g, p = M((.62, .65, .7)), M((.9, .7, .72), .1)
    s = .26 / .9
    blob(.26 * s, (0, 0, .28 * s), g, (1, .9, 1.05))
    blob(.2 * s, (0, -.03 * s, .66 * s), g)
    for x in (-.22, .22):
        blob(.14 * s, (x * s, .02 * s, .66 * s), g, (.35, 1, 1.1))
        blob(.1 * s, ((x * .95) * s, -.01 * s, .66 * s), p, (.3, .8, .85))
        blob(.09 * s, ((x * .5) * s, -.2 * s, .1 * s), g, (.8, 1.3, .7))
    blob(.06 * s, (0, -.2 * s, .5 * s), g, (1, 1, 2.1), (math.radians(20), 0, 0))
    eyes(s, -.17, .72, .08, .022)


def t_dino():
    g, y = M((.38, .66, .45)), M((.96, .82, .35))
    s = .26 / .9
    blob(.26 * s, (0, 0, .28 * s), g, (1, .95, 1.05))
    blob(.15 * s, (0, -.14 * s, .3 * s), y, (1, .5, 1))
    blob(.19 * s, (0, -.08 * s, .66 * s), g, (1, 1.2, .9))
    # spikes along the neck and back, sitting on the surface
    for i in range(5):
        cone(.045 * s, 0, .09 * s, (0, (.1 + i * .045) * s, (.78 - i * .12) * s), y, (math.radians(-40 - i * 8), 0, 0))
    blob(.08 * s, (0, .3 * s, .12 * s), g, (1, 2.4, .8), (math.radians(-10), 0, 0))
    for x in (-.14, .14):
        blob(.09 * s, (x * s, -.2 * s, .1 * s), g, (.8, 1.3, .7))
    eyes(s, -.25, .72, .07, .022)


def t_whale():
    b, w = M((.3, .52, .82)), M((.88, .93, .98))
    s = .3 / 1.0
    blob(.3 * s, (0, 0, .2 * s), b, (1, 1.4, .75))
    blob(.22 * s, (0, -.08 * s, .14 * s), w, (1, 1.3, .5))
    for x in (-.28, .28):
        blob(.1 * s, (x * s, -.12 * s, .12 * s), b, (1.2, .6, .25), (0, 0, math.radians(-25 if x < 0 else 25)))
    blob(.09 * s, (-.09 * s, .5 * s, .18 * s), b, (1.4, .6, .3), (0, 0, math.radians(25)))
    blob(.09 * s, (.09 * s, .5 * s, .18 * s), b, (1.4, .6, .3), (0, 0, math.radians(-25)))
    eyes(s, -.33, .28, .12, .025)


def tube(points, radii, m):
    """A soft tapering limb along a smooth path (a bevelled Bezier curve, then a mesh), round at the tip."""
    cu = bpy.data.curves.new('limb', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth, cu.bevel_resolution, cu.resolution_u, cu.use_fill_caps = 1.0, 8, 20, True
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(points) - 1)
    for bp, co, r in zip(sp.bezier_points, points, radii):
        bp.co, bp.radius = co, r
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    o = bpy.data.objects.new('limb', cu)
    bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    blob(radii[-1], points[-1], m)            # a round tip
    return o


def t_octopus():
    """A plush octopus: a round head on a soft base, eight arms growing out of the
    base, lying on the duvet and curling up at the tips (alternately left and right)."""
    c, cheek = M((.96, .52, .47)), M((.98, .36, .42), .1)
    s = .28 / .9
    blob(.27 * s, (0, .03 * s, .47 * s), c, (1, 1, 1.08))                 # head
    blob(.25 * s, (0, 0, .21 * s), c, (1.05, 1.05, .55))                   # base the arms grow from
    for i in range(8):
        a = (i + .5) / 8 * math.tau
        u, v = Vector((math.cos(a), math.sin(a), 0)), Vector((-math.sin(a), math.cos(a), 0))
        side = 1 if i % 2 else -1
        path = [u * .08 + Vector((0, 0, .24)), u * .24 + Vector((0, 0, .1)), u * .4 + Vector((0, 0, .055)),
                u * .52 + v * .03 * side + Vector((0, 0, .06)), u * .58 + v * .09 * side + Vector((0, 0, .1)),
                u * .54 + v * .14 * side + Vector((0, 0, .15))]
        tube([p * s for p in path], [r * s for r in (.1, .085, .07, .058, .048, .04)], c)
    eyes(s, -.23, .5, .085, .032)
    for x in (-.15, .15):
        blob(.045 * s, (x * s, -.245 * s, .42 * s), cheek, (1, .45, .75))    # blush


def t_chick():
    y, o = M((.98, .84, .3)), M((.95, .55, .12), .1)
    s = .2 / .8
    blob(.3 * s, (0, 0, .3 * s), y)
    cone(.05 * s, 0, .1 * s, (0, -.3 * s, .34 * s), o, (math.radians(90), 0, 0))
    for x in (-.28, .28):
        blob(.1 * s, (x * s, 0, .3 * s), y, (.4, .8, 1.1), (0, math.radians(-20 if x < 0 else 20), 0))
    eyes(s, -.26, .42, .1, .03)


def t_sheep():
    wl, fc = M((.95, .93, .88), .6), M((.18, .16, .15))
    s = .26 / .9
    for x, y, z, r in ((0, 0, .3, .26), (-.16, .05, .22, .16), (.16, .05, .22, .16), (-.1, .12, .42, .16), (.1, .12, .42, .16), (0, -.05, .48, .16)):
        blob(r * s, (x * s, y * s, z * s), wl)
    blob(.12 * s, (0, -.2 * s, .58 * s), fc, (1, 1, 1.2))
    for x in (-.14, .14):
        blob(.05 * s, (x * s, -.16 * s, .66 * s), fc, (1.6, .6, .7))
        blob(.05 * s, (x * s, -.2 * s, .06 * s), fc, (.8, 1, 1.4))
    blob(.018 * s, (-.05 * s, -.3 * s, .64 * s), M((.95, .95, .95), .05))
    blob(.018 * s, (.05 * s, -.3 * s, .64 * s), M((.95, .95, .95), .05))


TOYS = [
    ('teddy', lambda: t_teddy((.36, .2, .09), (.78, .6, .42))),
    ('teddy-cream', lambda: t_teddy((.9, .82, .68), (.97, .9, .82))),
    ('teddy-grey', lambda: t_teddy((.55, .55, .56), (.85, .83, .8))),
    ('panda', t_panda), ('bunny', lambda: bunny(M((.86, .84, .8)), M((.95, .62, .66), .1), EYE)),
    ('cat', lambda: t_cat((.93, .55, .2), (.98, .9, .8))), ('cat-black', lambda: t_cat((.07, .07, .08), (.2, .2, .22))),
    ('dog', t_dog), ('penguin', t_penguin), ('fox', t_fox), ('frog', t_frog), ('elephant', t_elephant),
    ('dino', t_dino), ('whale', t_whale), ('octopus', t_octopus), ('chick', t_chick), ('sheep', t_sheep),
]

def sit_body(fur, s, belly=None):
    blob(.25 * s, (0, 0, .27 * s), fur, (1, .9, 1.05))
    if belly:
        blob(.15 * s, (0, -.12 * s, .28 * s), belly, (1, .6, 1))
    blob(.19 * s, (0, -.03 * s, .64 * s), fur)
    for x in (-.14, .14):
        blob(.09 * s, (x * s, -.2 * s, .1 * s), fur, (.8, 1.3, .7))
        blob(.075 * s, ((x * 1.6) * s, -.06 * s, .36 * s), fur, (.8, .8, 1.3), (0, math.radians(-25 if x < 0 else 25), 0))


def t_owl():
    b, l, y = M((.55, .4, .28)), M((.93, .86, .72)), M((.95, .7, .2), .1)
    s = .24 / .9
    blob(.27 * s, (0, 0, .36 * s), b, (1, .9, 1.2))
    blob(.18 * s, (0, -.1 * s, .34 * s), l, (1, .6, 1.1))
    for x in (-.09, .09):
        blob(.075 * s, (x * s, -.17 * s, .56 * s), M((.98, .97, .95), .05))
        blob(.035 * s, (x * s, -.23 * s, .56 * s), EYE)
        cone(.05 * s, 0, .12 * s, ((x * 1.8) * s, 0, .76 * s), b, (0, math.radians(-10 if x < 0 else 10), 0))
        blob(.1 * s, ((x * 2.6) * s, 0, .36 * s), b, (.45, .9, 1.4))
        blob(.05 * s, (x * s, -.18 * s, .05 * s), y, (1, 1.4, .5))
    cone(.025 * s, 0, .07 * s, (0, -.26 * s, .5 * s), y, (math.radians(100), 0, 0))


def t_koala():
    g, w = M((.62, .64, .66)), M((.9, .9, .88))
    s = .26 / .9
    sit_body(g, s, w)
    for x in (-.2, .2):
        blob(.1 * s, (x * s, 0, .78 * s), g, (1, .5, 1))
        blob(.06 * s, (x * s, -.03 * s, .78 * s), w, (1, .4, 1))
    blob(.06 * s, (0, -.2 * s, .6 * s), M((.12, .12, .13), .05), (.9, .8, 1.2))
    eyes(s, -.16, .7, .08, .02)


def t_lion():
    f, m = M((.95, .72, .35)), M((.78, .45, .18), .6)
    s = .26 / .9
    sit_body(f, s)
    blob(.25 * s, (0, .02 * s, .64 * s), m, (1, .8, 1))
    blob(.18 * s, (0, -.05 * s, .64 * s), f)
    for x in (-.13, .13):
        blob(.05 * s, (x * s, -.02 * s, .8 * s), f, (1, .6, 1))
    blob(.07 * s, (0, -.19 * s, .58 * s), M((.98, .9, .75)), (1, .8, .7))
    blob(.025 * s, (0, -.25 * s, .6 * s), M((.4, .22, .15), .05))
    eyes(s, -.18, .68, .07, .022)


def t_monkey():
    b, l = M((.45, .3, .2)), M((.92, .78, .62))
    s = .26 / .9
    sit_body(b, s, l)
    blob(.12 * s, (0, -.14 * s, .6 * s), l, (1.1, .7, .9))
    for x in (-.2, .2):
        blob(.07 * s, (x * s, -.01 * s, .66 * s), l, (.5, .6, 1))
    eyes(s, -.19, .7, .06, .022)
    blob(.04 * s, (.25 * s, .2 * s, .15 * s), b, (1, 3.2, 1), (0, 0, math.radians(-40)))


def t_pig():
    p, n = M((.97, .72, .74)), M((.93, .56, .6), .1)
    s = .25 / .9
    sit_body(p, s)
    blob(.07 * s, (0, -.2 * s, .6 * s), n, (1.2, .6, .9))
    for x in (-.025, .025):
        blob(.015 * s, (x * s, -.24 * s, .6 * s), M((.55, .25, .3), .05))
    for x in (-.12, .12):
        cone(.06 * s, 0, .1 * s, (x * s, -.02 * s, .82 * s), p, (math.radians(-20), math.radians(-25 if x < 0 else 25), 0), (1, .6, 1))
    eyes(s, -.16, .7, .08, .02)


def t_cow():
    w, k, p = M((.96, .95, .92)), M((.1, .1, .1)), M((.97, .76, .74), .1)
    s = .26 / .9
    sit_body(w, s)
    blob(.08 * s, (-.12 * s, -.18 * s, .36 * s), k, (1, .3, 1))
    blob(.06 * s, (.1 * s, -.1 * s, .5 * s), k, (1, .4, 1))
    blob(.09 * s, (0, -.19 * s, .58 * s), p, (1.2, .7, .8))
    for x in (-.15, .15):
        cone(.03 * s, .01 * s, .08 * s, (x * s, 0, .84 * s), M((.95, .88, .7), .1), (0, math.radians(-40 if x < 0 else 40), 0))
        blob(.05 * s, ((x * 1.5) * s, 0, .7 * s), w, (1.4, .5, .7))
    eyes(s, -.17, .7, .08, .022)


def t_hedgehog():
    sp, f = M((.4, .3, .22), .8), M((.9, .78, .62))
    s = .24 / .9
    blob(.28 * s, (0, .04 * s, .26 * s), sp, (1, 1.1, .9))
    for i in range(24):
        a = i / 24 * math.tau
        cone(.04 * s, 0, .12 * s, (math.cos(a) * .2 * s, .1 * s + math.sin(a) * .16 * s, (.34 + .1 * math.sin(a * 2)) * s), sp, (math.radians(-35), 0, a))
    blob(.16 * s, (0, -.2 * s, .22 * s), f, (1, 1.2, .9))
    blob(.03 * s, (0, -.37 * s, .24 * s), EYE)
    eyes(s, -.3, .3, .05, .02)


def t_turtle():
    sh, sk = M((.36, .55, .32)), M((.62, .78, .45))
    s = .26 / .9
    blob(.3 * s, (0, 0, .16 * s), sh, (1, 1.15, .55))
    for i in range(6):
        a = i / 6 * math.tau
        blob(.07 * s, (math.cos(a) * .16 * s, math.sin(a) * .18 * s, .28 * s), M((.45, .64, .36)), (1, 1, .35))
    blob(.12 * s, (0, -.36 * s, .16 * s), sk)
    for x, y in ((-.25, -.2), (.25, -.2), (-.25, .22), (.25, .22)):
        blob(.07 * s, (x * s, y * s, .06 * s), sk, (1, 1.2, .6))
    eyes(s, -.44, .2, .06, .02)


def t_ladybug():
    r, k = M((.86, .15, .15)), M((.08, .08, .08))
    s = .22 / .9
    blob(.3 * s, (0, .03 * s, .18 * s), r, (1, 1.1, .6))
    blob(.16 * s, (0, -.3 * s, .14 * s), k, (1, .8, .8))
    for x, y in ((-.14, -.05), (.14, -.05), (-.16, .16), (.16, .16), (0, .28)):
        blob(.05 * s, (x * s, y * s, .34 * s), k, (1, 1, .3))
    eyes(s, -.43, .18, .06, .02)


def t_bee():
    y, k, w = M((.98, .8, .2)), M((.1, .09, .08)), M((.9, .95, 1), .05)
    s = .22 / .9
    blob(.3 * s, (0, 0, .28 * s), y, (1, 1.2, .9))
    for yy in (-.05, .12, .28):
        blob(.302 * s, (0, yy * s, .28 * s), k, (1.005, .12, .905))
    for x in (-.2, .2):
        blob(.14 * s, (x * s, .05 * s, .58 * s), w, (1, .6, .3), (0, math.radians(-20 if x < 0 else 20), 0))
    eyes(s, -.32, .36, .09, .025)


def t_dolphin():
    b, l = M((.45, .62, .82)), M((.86, .91, .96))
    s = .3 / 1.0
    blob(.26 * s, (0, 0, .18 * s), b, (.8, 1.6, .7))
    blob(.18 * s, (0, -.05 * s, .12 * s), l, (.7, 1.5, .5))
    cone(.06 * s, 0, .14 * s, (0, -.47 * s, .16 * s), b, (math.radians(90), 0, 0))
    cone(.08 * s, 0, .18 * s, (0, .02 * s, .36 * s), b, (math.radians(-20), 0, 0), (.4, 1, 1))
    blob(.1 * s, (0, .45 * s, .18 * s), b, (1.6, .5, .3))
    eyes(s, -.34, .24, .08, .02)


def t_seal():
    g, w = M((.72, .74, .78)), M((.92, .93, .95))
    s = .28 / .95
    blob(.26 * s, (0, .05 * s, .2 * s), g, (1, 1.3, .8))
    blob(.18 * s, (0, -.25 * s, .3 * s), g)
    blob(.08 * s, (0, -.4 * s, .28 * s), w, (1.2, .7, .8))
    blob(.025 * s, (0, -.46 * s, .31 * s), EYE)
    for x in (-.22, .22):
        blob(.08 * s, (x * s, -.1 * s, .08 * s), g, (1.3, .6, .4), (0, 0, math.radians(-30 if x < 0 else 30)))
    blob(.1 * s, (0, .42 * s, .1 * s), g, (1.6, .6, .35))
    eyes(s, -.38, .36, .07, .022)


def t_raccoon():
    g, k, w = M((.55, .55, .57)), M((.12, .12, .13)), M((.93, .93, .92))
    s = .26 / .9
    sit_body(g, s)
    blob(.1 * s, (0, -.15 * s, .64 * s), w, (1.6, .6, .7))
    for x in (-.07, .07):
        blob(.05 * s, (x * s, -.18 * s, .68 * s), k, (1.3, .5, .7))
        cone(.05 * s, 0, .1 * s, ((x * 2) * s, 0, .82 * s), g, (0, math.radians(-15 if x < 0 else 15), 0), (1, .6, 1))
    blob(.022 * s, (0, -.25 * s, .6 * s), k)
    eyes(s, -.21, .68, .07, .018)
    for i in range(4):
        blob(.07 * s, ((.22 + i * .05) * s, (.12 + i * .08) * s, .1 * s), k if i % 2 else g, (1, .9, .9))


def t_mouse():
    g, p = M((.7, .7, .72)), M((.97, .76, .8), .1)
    s = .2 / .8
    blob(.24 * s, (0, 0, .24 * s), g, (1, 1.2, .95))
    blob(.16 * s, (0, -.26 * s, .26 * s), g, (1, 1.2, 1))
    for x in (-.14, .14):
        blob(.1 * s, (x * s, -.18 * s, .42 * s), g, (1, .35, 1))
        blob(.07 * s, (x * s, -.2 * s, .42 * s), p, (1, .3, 1))
    blob(.025 * s, (0, -.46 * s, .27 * s), p)
    eyes(s, -.38, .32, .06, .02)
    blob(.025 * s, (.1 * s, .38 * s, .06 * s), p, (1, 5, 1), (0, 0, math.radians(-25)))


def t_hamster():
    o, w = M((.9, .62, .32)), M((.97, .93, .86))
    s = .2 / .8
    blob(.3 * s, (0, 0, .28 * s), o, (1, 1, .95))
    blob(.2 * s, (0, -.14 * s, .26 * s), w, (1.1, .7, .9))
    for x in (-.13, .13):
        blob(.06 * s, (x * s, .02 * s, .54 * s), o, (1, .6, 1))
    blob(.025 * s, (0, -.32 * s, .34 * s), M((.9, .55, .6), .05))
    eyes(s, -.27, .42, .1, .025)


def t_unicorn():
    w, pk, bl, g = M((.97, .96, .95)), M((.98, .72, .8)), M((.62, .82, .95)), M((.95, .8, .4), .1)
    s = .26 / .9
    sit_body(w, s)
    cone(.035 * s, 0, .18 * s, (0, -.12 * s, .9 * s), g, (math.radians(-20), 0, 0))
    for i, c in enumerate((pk, bl, pk, bl)):
        blob(.06 * s, (.12 * s, (.02 + i * .05) * s, (.78 - i * .08) * s), c, (.7, 1, 1))
    for x in (-.12, .12):
        cone(.05 * s, 0, .1 * s, (x * s, 0, .83 * s), w, (0, math.radians(-15 if x < 0 else 15), 0), (1, .6, 1))
    blob(.07 * s, (0, -.19 * s, .6 * s), M((.98, .9, .9)), (1, .8, .7))
    eyes(s, -.17, .7, .08, .02)


def t_moon():
    y = M((.98, .9, .55))
    s = .26 / .9
    blob(.3 * s, (0, 0, .3 * s), y, (1, .55, 1))
    blob(.26 * s, (.16 * s, -.05 * s, .38 * s), M((.02, .02, .02)), (1, .56, 1)).hide_render = True
    for x in (-.05,):
        blob(.022 * s, (x * s, -.17 * s, .34 * s), EYE)
    blob(.04 * s, (-.12 * s, -.14 * s, .26 * s), M((.98, .7, .7), .05), (1, .4, .6))


def shape_plush(pts, col):
    def make():
        m = M(col, .4)
        o = curve_cushion(pts, .12, m)
        o.rotation_euler = (math.radians(58), 0, 0)
        o.scale = (.9, .9, .9)
    return make


TOYS += [
    ('owl', t_owl), ('koala', t_koala), ('lion', t_lion), ('monkey', t_monkey), ('pig', t_pig), ('cow', t_cow),
    ('hedgehog', t_hedgehog), ('turtle', t_turtle), ('ladybug', t_ladybug), ('bee', t_bee), ('dolphin', t_dolphin),
    ('seal', t_seal), ('raccoon', t_raccoon), ('mouse', t_mouse), ('hamster', t_hamster), ('unicorn', t_unicorn),
]

only = set(sys.argv[sys.argv.index('--') + 4:]) if len(sys.argv) > sys.argv.index('--') + 4 else set()

for key, fn in TOYS:
    if only and ('toy-' + key) not in only:
        continue
    sc = reset()
    EYE = plush_mat('eye', (.02, .02, .025), 0)
    fn()
    lights(sc)
    save('toy-' + key, sc)

if not only or 'toy-duck' in only:
    sc = reset()
    objs = import_gltf('rubber_duck_toy')
    for o in objs:
        o.rotation_euler.z += math.radians(200)
    lay_flat(objs, .16)
    lights(sc)
    save('toy-duck', sc)


# ── cushions: shape × fabric, neutral grey (tinted in the sleeper's colour) ──
def fabric_mat(name, tex_id):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = .85
    for key in ('Sheen Weight', 'Sheen'):
        if key in p.inputs:
            p.inputs[key].default_value = .6
            break
    import glob
    col = glob.glob(os.path.join(FAB, tex_id, '*Color.jpg'))[0]
    nrm = glob.glob(os.path.join(FAB, tex_id, '*NormalGL.jpg'))[0]
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (5, 5, 5)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    ic = nt.nodes.new('ShaderNodeTexImage'); ic.image = bpy.data.images.load(col); ic.projection = 'BOX'; ic.projection_blend = .3
    nt.links.new(mp.outputs['Vector'], ic.inputs['Vector'])
    bw = nt.nodes.new('ShaderNodeRGBToBW')
    nt.links.new(ic.outputs['Color'], bw.inputs['Color'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = .45
    mr.inputs['To Max'].default_value = .9
    nt.links.new(bw.outputs['Val'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], p.inputs['Base Color'])
    inn = nt.nodes.new('ShaderNodeTexImage'); inn.image = bpy.data.images.load(nrm); inn.image.colorspace_settings.name = 'Non-Color'; inn.projection = 'BOX'; inn.projection_blend = .3
    nt.links.new(mp.outputs['Vector'], inn.inputs['Vector'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.2
    nt.links.new(inn.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    return m


def soft_obj(o, puff=.25, sub=3, bevel=0):
    if bevel:
        b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = 4; b.limit_method = 'NONE'
    s = o.modifiers.new('s', 'SUBSURF'); s.levels = s.render_levels = sub
    c = o.modifiers.new('c', 'CAST'); c.factor = puff; c.cast_type = 'SPHERE'
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def curve_cushion(points2d, thick, m):
    """An outline (x, y in metres) made into a puffy cushion. The outline is filled
    as a 2D curve (right for concave shapes too), then thickened and rounded."""
    cu = bpy.data.curves.new('c', 'CURVE')
    cu.dimensions, cu.fill_mode = '2D', 'BOTH'
    sp = cu.splines.new('POLY')
    sp.points.add(len(points2d) - 1)
    for pt, (x, y) in zip(sp.points, points2d):
        pt.co = (x, y, 0, 1)
    sp.use_cyclic_u = True
    o = bpy.data.objects.new('c', cu)
    bpy.context.scene.collection.objects.link(o)
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object
    so = o.modifiers.new('solid', 'SOLIDIFY'); so.thickness = thick; so.offset = 0
    rm = o.modifiers.new('r', 'REMESH'); rm.mode = 'SMOOTH'; rm.octree_depth = 6
    s = o.modifiers.new('s', 'SUBSURF'); s.levels = s.render_levels = 2
    sm = o.modifiers.new('sm', 'SMOOTH'); sm.iterations = 12; sm.factor = .8
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    return o


def c_square(m):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.scale = (.2, .2, .075)
    bpy.ops.object.transform_apply(scale=True)
    soft_obj(o, .12, 2, .035)
    o.data.materials.append(m)
    o.rotation_euler = (math.radians(55), 0, math.radians(-12))
    return o


def c_round(m):
    bpy.ops.mesh.primitive_cylinder_add(radius=.19, depth=.08, vertices=48)
    o = bpy.context.active_object
    soft_obj(o, .2, 2)
    o.data.materials.append(m)
    o.rotation_euler = (math.radians(55), 0, 0)
    b = blob(.025, (0, 0, 0), m, (1, 1, .5))
    b.parent = o
    b.location = (0, 0, .045)
    return o


def c_bolster(m):
    bpy.ops.mesh.primitive_cylinder_add(radius=.08, depth=.42, vertices=48, rotation=(0, math.radians(90), 0))
    o = bpy.context.active_object
    b = o.modifiers.new('b', 'BEVEL'); b.width = .05; b.segments = 6
    s = o.modifiers.new('s', 'SUBSURF'); s.levels = s.render_levels = 2
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    return o


def heart_pts(sc=.2, n=80):
    pts = []
    for i in range(n):
        t = i / n * math.tau
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x / 17 * sc, y / 17 * sc))
    return pts


def star_pts(r1=.21, r2=.11, n=5):
    pts = []
    for i in range(n * 2):
        a = i / (n * 2) * math.tau + math.pi / 2
        r = r1 if i % 2 == 0 else r2
        pts.append((math.cos(a) * r, math.sin(a) * r))
    return pts


def cloud_pts():
    pts = []
    for i in range(96):
        a = i / 96 * math.tau
        r = .15 + .035 * abs(math.sin(a * 2.5))
        pts.append((math.cos(a) * r * 1.35, math.sin(a) * r))
    return pts


def c_shape(pts):
    def make(m):
        o = curve_cushion(pts, .09, m)
        o.rotation_euler = (math.radians(55), 0, 0)
        return o
    return make


def c_lumbar(m):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.scale = (.27, .13, .07)
    bpy.ops.object.transform_apply(scale=True)
    soft_obj(o, .1, 2, .03)
    o.data.materials.append(m)
    o.rotation_euler = (math.radians(58), 0, math.radians(6))
    return o


# ── more outlines: a union of simple parts, traced from the centre (star-shaped) ──
def sdf_outline(parts, n=220, rmax=.36):
    """parts: ('c', x, y, r), ('e', x, y, rx, ry, deg), ('p', [(x, y), ...]); a part
    starting with '-' is cut away. Returns the outline as seen from (0, 0)."""
    def in_part(pt, x, y):
        k = pt[0].lstrip('-')
        if k == 'c':
            return (x - pt[1]) ** 2 + (y - pt[2]) ** 2 <= pt[3] ** 2
        if k == 'e':
            ca, sa = math.cos(math.radians(pt[5])), math.sin(math.radians(pt[5]))
            dx, dy = x - pt[1], y - pt[2]
            u, v = dx * ca + dy * sa, -dx * sa + dy * ca
            return (u / pt[3]) ** 2 + (v / pt[4]) ** 2 <= 1
        poly, inside, j = pt[1], False, len(pt[1]) - 1
        for i in range(len(poly)):
            xi, yi = poly[i]; xj, yj = poly[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                inside = not inside
            j = i
        return inside

    def inside(x, y):
        return any(in_part(p, x, y) for p in parts if not p[0].startswith('-')) and not any(in_part(p, x, y) for p in parts if p[0].startswith('-'))
    pts = []
    for i in range(n):
        a = i / n * math.tau
        best = 0
        for k in range(1, 361):
            r = k / 360 * rmax
            if inside(r * math.cos(a), r * math.sin(a)):
                best = r
        pts.append((best * math.cos(a), best * math.sin(a)))
    return pts


def polar_pts(fn, n=200):
    return [(math.cos(i / n * math.tau) * fn(i / n * math.tau), math.sin(i / n * math.tau) * fn(i / n * math.tau)) for i in range(n)]


def moon_pts():
    R, cx, cy, r = .2, .1, .06, .17
    outer = [(R * math.cos(t), R * math.sin(t)) for t in (i / 240 * math.tau for i in range(240))]
    inner = [(cx + r * math.cos(t), cy + r * math.sin(t)) for t in (i / 240 * math.tau for i in range(240))]
    o = [p for p in outer if (p[0] - cx) ** 2 + (p[1] - cy) ** 2 > r * r]
    i2 = [p for p in inner if p[0] ** 2 + p[1] ** 2 < R * R]
    # both arcs contiguous: rotate the lists at their gap
    def contiguous(lst, full):
        idx = [full.index(p) for p in lst]
        cut = max(range(len(idx)), key=lambda k: (idx[k] - idx[k - 1]) % len(full))
        return lst[cut:] + lst[:cut]
    o, i2 = contiguous(o, outer), contiguous(i2, inner)
    pts = o + i2[::-1]
    mx = sum(p[0] for p in pts) / len(pts); my = sum(p[1] for p in pts) / len(pts)
    return [(x - mx, y - my) for x, y in pts]


def ngon(n, r, rot=0):
    return [(math.cos(i / n * math.tau + rot) * r, math.sin(i / n * math.tau + rot) * r) for i in range(n)]


def rounded_poly(poly, r=.03, n=10):
    """Rounds a convex polygon's corners."""
    out = []
    for i in range(len(poly)):
        p0, p1, p2 = Vector(poly[i - 1] + (0,)), Vector(poly[i] + (0,)), Vector(poly[(i + 1) % len(poly)] + (0,))
        a, b = (p0 - p1).normalized(), (p2 - p1).normalized()
        c = p1 + (a + b).normalized() * (r / math.sin(a.angle(b) / 2))
        s0, s1 = p1 + a * (r / math.tan(a.angle(b) / 2)), p1 + b * (r / math.tan(a.angle(b) / 2))
        a0, a1 = math.atan2(s0.y - c.y, s0.x - c.x), math.atan2(s1.y - c.y, s1.x - c.x)
        d = (a1 - a0 + math.pi) % math.tau - math.pi
        out += [(c.x + r * math.cos(a0 + d * k / n), c.y + r * math.sin(a0 + d * k / n)) for k in range(n + 1)]
    return out


OUTLINES = {
    'heart': heart_pts(), 'star': star_pts(), 'cloud': cloud_pts(), 'moon': moon_pts(),
    'flower': polar_pts(lambda a: .125 + .075 * abs(math.cos(a * 2.5))),
    'scallop': polar_pts(lambda a: .18 + .014 * math.cos(a * 12)),
    'hexagon': rounded_poly(ngon(6, .2, math.pi / 6), .035),
    'triangle': rounded_poly(ngon(3, .22, math.pi / 2), .05),
    'diamond': rounded_poly([(0, .22), (-.17, 0), (0, -.22), (.17, 0)], .04),
    'oval': polar_pts(lambda a: 1 / math.sqrt((math.cos(a) / .24) ** 2 + (math.sin(a) / .15) ** 2)),
    'squircle': polar_pts(lambda a: .19 / (abs(math.cos(a)) ** 4 + abs(math.sin(a)) ** 4) ** .25),
    'fish': sdf_outline([('e', -.03, 0, .16, .1, 0), ('p', [(.1, 0), (.21, .1), (.21, -.1)])]),
    'bone': sdf_outline([('e', 0, 0, .15, .045, 0), ('c', -.15, .045, .055), ('c', -.15, -.045, .055), ('c', .15, .045, .055), ('c', .15, -.045, .055)]),
    'cathead': sdf_outline([('e', 0, -.02, .17, .145, 0), ('p', [(-.16, .02), (-.13, .2), (-.03, .1)]), ('p', [(.16, .02), (.13, .2), (.03, .1)])]),
    'bunnyhead': sdf_outline([('c', 0, -.05, .14), ('e', -.06, .14, .045, .12, 12), ('e', .06, .14, .045, .12, -12)]),
    'bearhead': sdf_outline([('c', 0, -.02, .15), ('c', -.12, .11, .055), ('c', .12, .11, .055)]),
    'sun': sdf_outline([('c', 0, 0, .13)] + [('p', [(math.cos(a - .18) * .12, math.sin(a - .18) * .12), (math.cos(a) * .21, math.sin(a) * .21), (math.cos(a + .18) * .12, math.sin(a + .18) * .12)]) for a in (i / 10 * math.tau for i in range(10))]),
    'bolt': [(-.02, .22), (-.12, -.01), (-.02, -.01), (-.06, -.22), (.12, .05), (.02, .05), (.08, .22)],
    'strawberry': sdf_outline([('e', 0, .085, .165, .075, 0), ('p', rounded_poly([(-.165, .09), (.165, .09), (0, -.19)], .06))]),
    'avocado': sdf_outline([('c', 0, -.05, .13), ('c', 0, .07, .09)]),
    'capsule': sdf_outline([('e', 0, 0, .21, .09, 0)]),
}


def shaped(name, thick=.09, lean=55):
    def make(m):
        o = curve_cushion(OUTLINES[name], thick, m)
        o.rotation_euler = (math.radians(lean), 0, 0)
        return o
    return make


def on(o, r, x, y, m, scale=(1, 1, 1), z=None, thick=.09):
    """A detail sewn on a cushion's front (in the cushion's own flat frame)."""
    b = blob(r, (0, 0, 0), m, scale)
    b.parent = o
    b.location = (x, y, thick * .42 if z is None else z)
    return b


def face(o, y=0, dx=.045, thick=.09, blush=True):
    for x in (-dx, dx):
        on(o, .016, x, y, EYE, (1, 1, .6), thick=thick)
    if blush:
        ck = plush_mat('ck', (.98, .45, .5), .1)
        for x in (-dx * 1.7, dx * 1.7):
            on(o, .018, x, y - .03, ck, (1, .6, .4), thick=thick)


def k_cat(_m):
    o = shaped('cathead')(M((.62, .64, .68)))
    face(o, -.02); on(o, .012, 0, -.05, plush_mat('n', (.95, .5, .55), .1), (1.2, .8, .6))
    for x in (-.1, .1):
        on(o, .03, x, .1, plush_mat('in', (.96, .7, .72), .1), (.6, 1, .4))
    return o


def k_bunny(_m):
    o = shaped('bunnyhead')(M((.97, .96, .95)))
    face(o, -.06); on(o, .012, 0, -.09, plush_mat('n', (.95, .5, .55), .1), (1.2, .8, .6))
    for x in (-.06, .06):
        on(o, .03, x * 1.05, .15, plush_mat('in', (.97, .72, .76), .1), (.8, 2.6, .4))
    return o


def k_bear(_m):
    o = shaped('bearhead')(M((.6, .42, .28)))
    pad = plush_mat('pad', (.86, .7, .52), .2)
    on(o, .06, 0, -.07, pad, (1.2, .85, .5))
    on(o, .016, 0, -.05, EYE, (1.4, 1, .7))
    for x in (-.12, .12):
        on(o, .03, x, .11, pad, (1, 1, .4))
    face(o, .01, .055, blush=False)
    return o


def k_moon(_m):
    o = shaped('moon')(M((.99, .86, .38)))
    on(o, .014, -.1, .02, EYE, (1.4, .5, .5)); on(o, .018, -.08, -.04, plush_mat('ck', (.98, .5, .45), .1), (1, .6, .4))
    return o


def k_sun(_m):
    o = shaped('sun')(M((.99, .78, .2)))
    face(o, 0, .045)
    return o


def k_cloud(_m):
    o = shaped('cloud')(M((.95, .97, 1)))
    face(o, -.01, .05)
    return o


def k_flower(_m):
    o = shaped('flower')(M((.98, .6, .7)))
    on(o, .07, 0, 0, M((.99, .85, .3)), (1, 1, .5))
    return o


def k_avocado(_m):
    o = shaped('avocado', .1)(M((.28, .45, .2)))
    inner = curve_cushion([(x * .82, y * .82 - .005) for x, y in OUTLINES['avocado']], .1, M((.78, .86, .45)))
    inner.parent = o; inner.location = (0, 0, .02)
    on(o, .055, 0, -.06, M((.55, .33, .18), .15), (1, 1, .8), z=.075)
    return o


def k_cookie(_m):
    o = shaped('scallop')(M((.84, .62, .36), .2))
    ch = plush_mat('choc', (.28, .16, .1), .15)
    for x, y in ((-.08, .06), (.06, .09), (.1, -.03), (-.03, -.08), (-.1, -.05), (.02, .01), (.07, -.1)):
        on(o, .02, x, y, ch, (1, 1, .6))
    return o


def k_donut(_m):
    bpy.ops.mesh.primitive_torus_add(major_radius=.13, minor_radius=.065, major_segments=64, minor_segments=24)
    o = bpy.context.active_object
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(M((.86, .64, .38), .2))
    bpy.ops.mesh.primitive_torus_add(major_radius=.13, minor_radius=.058, major_segments=64, minor_segments=24)
    ic = bpy.context.active_object
    ic.scale = (1.02, 1.02, .6); ic.location = (0, 0, .025)
    for p in ic.data.polygons:
        p.use_smooth = True
    ic.data.materials.append(M((.97, .56, .72), .15))
    ic.parent = o
    rnd = __import__('random').Random(3)
    cols = [(.3, .7, .95), (.99, .9, .3), (.95, .98, 1), (.5, .85, .5)]
    for i in range(22):
        a = rnd.uniform(0, math.tau); rr = rnd.uniform(.09, .17)
        sp = blob(.009, (math.cos(a) * rr, math.sin(a) * rr, .07), M(cols[i % 4], .05), (2.2, 1, 1), (0, 0, rnd.uniform(0, 3)))
        sp.parent = o
    o.rotation_euler = (math.radians(50), 0, 0)
    return o


def k_strawberry(_m):
    o = shaped('strawberry')(M((.9, .2, .25)))
    lf = curve_cushion(star_pts(.08, .035, 6), .04, M((.3, .62, .3)))
    lf.parent = o; lf.location = (0, .1, .03)
    sd = plush_mat('seed', (.99, .88, .45), .05)
    for x, y in ((-.08, 0), (0, .03), (.08, 0), (-.05, -.07), (.05, -.07), (0, -.12), (-.1, .06), (.1, .06)):
        on(o, .008, x, y, sd, (1, 1.5, .5))
    return o


def k_capsule(_m):
    red, white = M((.9, .25, .3)), M((.97, .97, .98))
    half = [(x, y) for x, y in OUTLINES['capsule'] if x <= 0]
    left = curve_cushion(half + [(0, -.09), (0, .09)][::-1][:0] + [(0, -.09)], .1, red)
    right = curve_cushion([(-x, y) for x, y in half][::-1] + [(0, .09)][:0], .1, white)
    right.parent = left
    left.rotation_euler = (math.radians(55), 0, math.radians(-18))
    return left


def k_bone(_m):
    return shaped('bone', .08)(M((.97, .95, .9)))


def k_bolt(_m):
    return shaped('bolt', .08)(M((.99, .8, .15)))



def k_fish(_m):
    o = shaped('fish')(M((.98, .55, .2)))
    on(o, .018, -.1, .02, EYE, (1, 1, .6))
    for x in (-.02, .04):
        on(o, .02, x, 0, M((.99, .8, .5)), (.4, 2.4, .3))
    return o


def k_rainbow(_m):
    cols = [(.93, .35, .33), (.99, .7, .25), (.98, .88, .35), (.45, .78, .5), (.35, .6, .92)]
    first = None
    for i, c in enumerate(cols):
        r1, r2 = .24 - i * .035, .205 - i * .035
        pts = [(math.cos(t) * r1, math.sin(t) * r1) for t in (k / 60 * math.pi for k in range(61))]
        pts += [(math.cos(t) * r2, math.sin(t) * r2) for t in (math.pi - k / 60 * math.pi for k in range(61))]
        o = curve_cushion([(x, y - .1) for x, y in pts], .08, M(c))
        if first is None:
            first = o
        else:
            o.parent = first
    first.rotation_euler = (math.radians(55), 0, 0)
    return first


CHARACTERS = [('cat', k_cat), ('bunny', k_bunny), ('bear', k_bear), ('moon', k_moon), ('sun', k_sun), ('cloud', k_cloud),
              ('flower', k_flower), ('avocado', k_avocado), ('cookie', k_cookie), ('donut', k_donut), ('strawberry', k_strawberry),
              ('capsule', k_capsule), ('bone', k_bone), ('bolt', k_bolt), ('fish', k_fish), ('rainbow', k_rainbow)]
# Fabric cushions (tinted on the page): every one its own shape.
FABRIC_CUSHIONS = [('square', 'knit', c_square), ('round', 'waffle', c_round), ('bolster', 'tartan', c_bolster), ('heart', 'plush', shaped('heart')),
                   ('star', 'knit', shaped('star')), ('lumbar', 'waffle', c_lumbar), ('squircle', 'tartan', shaped('squircle')), ('oval', 'plush', shaped('oval'))]
FABS = dict([('knit', 'Fabric016'), ('waffle', 'Fabric048'), ('tartan', 'Fabric054'), ('plush', 'Carpet016')])
# Printed cushions: each print on its own shape.
PRINT_CUSHIONS = [('hearts', 'heart'), ('daisy', 'flower'), ('sky', 'cloud'), ('cherry', 'round'), ('floral', 'square'), ('starlight', 'moon'),
                  ('balloons', 'hexagon'), ('planes', 'lumbar'), ('bluecheck', 'bolster'), ('mushrooms', 'scallop'), ('dinos', 'triangle'),
                  ('rainbows', 'oval'), ('cats', 'cathead'), ('lemons', 'diamond'), ('ward', 'squircle'), ('polka', 'star'), ('chevron', 'bolster'),
                  ('patchwork', 'square'), ('colorstripe', 'lumbar'), ('fish', 'fish'), ('bees', 'hexagon'), ('space', 'round'), ('xray', 'bone'),
                  ('radiology', 'squircle'), ('neon', 'heart'), ('glow', 'star')]
PRIM = {'square': c_square, 'round': c_round, 'bolster': c_bolster, 'lumbar': c_lumbar}
EYE = plush_mat('eye', (.02, .02, .025), 0)
for key, fn in CHARACTERS:
    key = 'kc-' + key
    if only and key not in only:
        continue
    sc = reset()
    EYE = plush_mat('eye', (.02, .02, .025), 0)
    fn(None)
    bpy.context.view_layer.update()
    lights(sc)
    save(key, sc)

if FAB:
    for shp, fid, fn in FABRIC_CUSHIONS:
        key = 'fc-%s-%s' % (shp, fid)
        if only and key not in only:
            continue
        sc = reset()
        fn(fabric_mat('f', FABS[fid]))
        bpy.context.view_layer.update()
        lights(sc)
        save(key, sc)

# printed cushions: the bed sets' own prints (TILES_DIR = the TILE_DIR of scripts/build-bed-linens.py)
TILES = os.environ.get('TILES_DIR', '')


def print_mat(tile):
    m = bpy.data.materials.new('p')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = .85
    for key in ('Sheen Weight', 'Sheen'):
        if key in p.inputs:
            p.inputs[key].default_value = .5
            break
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (3.2, 3.2, 3.2)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    ic = nt.nodes.new('ShaderNodeTexImage'); ic.image = bpy.data.images.load(tile); ic.projection = 'BOX'; ic.projection_blend = .25
    nt.links.new(mp.outputs['Vector'], ic.inputs['Vector'])
    nt.links.new(ic.outputs['Color'], p.inputs['Base Color'])
    return m


if TILES:
    for pid, shp in PRINT_CUSHIONS:
        key = 'pc-%s-%s' % (shp, pid)
        if only and key not in only:
            continue
        sc = reset()
        (PRIM.get(shp) or shaped(shp))(print_mat(os.path.join(TILES, pid + '.png')))
        bpy.context.view_layer.update()
        lights(sc)
        save(key, sc)
    # plush shapes in plain colours
    for key, pts, col in (('toy-star', star_pts(.2, .1), (.98, .84, .35)), ('toy-heart', heart_pts(.19), (.95, .45, .5)), ('toy-cloud', cloud_pts(), (.95, .96, .98))):
        if only and key not in only:
            continue
        sc = reset()
        o = curve_cushion(pts, .12, plush_mat('c', col, .4))
        o.rotation_euler = (math.radians(58), 0, 0)
        EYE = plush_mat('eye', (.02, .02, .025), 0)
        blob(.014, (-.04, -.07, .05), EYE); blob(.014, (.04, -.07, .05), EYE)
        lights(sc)
        save(key, sc)

old = json.load(open(os.path.join(OUT, 'sizes.json'))) if os.path.exists(os.path.join(OUT, 'sizes.json')) else {}
old.update(out)
json.dump(old, open(os.path.join(OUT, 'sizes.json'), 'w'), indent=1)
