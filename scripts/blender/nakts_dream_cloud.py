"""The Nakts dream cloud: a soft, round cloud of puffs with two small puffs
trailing down to the sleeper (the tail at the lower left; the page mirrors it
for a bed on the other side), in the rooms' night light. White, so the page
can warm it with the sleeper's colour.

    Blender -b -P scripts/blender/nakts_dream_cloud.py -- OUT_DIR [--check]

OUT_DIR/dream-cloud.png, 240 x 200 px (2x of 120 x 100).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
CHECK = '--check' in argv
os.makedirs(OUT, exist_ok=True)

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
sc.cycles.samples = 64 if CHECK else 384
sc.cycles.use_denoising = True
sc.render.film_transparent = True
sc.view_settings.view_transform = 'AgX'
sc.render.resolution_x, sc.render.resolution_y = 240, 200

# the cloud: metaball puffs (they melt into one soft surface), a flatter underside
mb = bpy.data.metaballs.new('cloud'); mb.resolution = 0.02; mb.render_resolution = 0.008; mb.threshold = 0.6
PUFFS = [(0.0, 0.12, 0.33), (-0.4, 0.0, 0.27), (0.42, 0.02, 0.28), (-0.22, 0.34, 0.25), (0.2, 0.36, 0.26),
         (-0.66, -0.16, 0.2), (0.68, -0.14, 0.21), (0.0, -0.16, 0.28), (-0.4, -0.24, 0.22), (0.4, -0.24, 0.22)]
for x, z, r in PUFFS:
    e = mb.elements.new(); e.co = (x, 0, z); e.radius = r * 1.32; e.stiffness = 2.0
cloud = bpy.data.objects.new('cloud', mb); sc.collection.objects.link(cloud)
tail = bpy.data.metaballs.new('tail'); tail.resolution = 0.02; tail.render_resolution = 0.006; tail.threshold = 0.6
for x, z, r in ((-0.62, -0.62, 0.1), (-0.8, -0.82, 0.062)):
    e = tail.elements.new(); e.co = (x, 0, z); e.radius = r * 1.6; e.stiffness = 2.0
puffs = bpy.data.objects.new('tail', tail); sc.collection.objects.link(puffs)

m = bpy.data.materials.new('cloud'); m.use_nodes = True
p = m.node_tree.nodes['Principled BSDF']
p.inputs['Base Color'].default_value = (0.97, 0.97, 0.99, 1)
p.inputs['Roughness'].default_value = 0.85
if 'Subsurface Weight' in p.inputs:
    p.inputs['Subsurface Weight'].default_value = 0.6
    p.inputs['Subsurface Radius'].default_value = (0.3, 0.3, 0.35)
    p.inputs['Subsurface Scale'].default_value = 0.2
if 'Sheen Weight' in p.inputs:
    p.inputs['Sheen Weight'].default_value = 0.5
cloud.data.materials.append(m); puffs.data.materials.append(m)

w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.4, 0.55, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.55
# moonlight from the upper left, a soft cool fill below
for loc, size, e, col in (((-2.0, -3.0, 3.0), 3.0, 380, (0.95, 0.97, 1.0)), ((2.0, -2.5, -1.5), 3.0, 60, (0.7, 0.78, 1.0))):
    L = bpy.data.lights.new('k', 'AREA'); L.size = size; L.energy = e; L.color = col
    o = bpy.data.objects.new('k', L); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cd.ortho_scale = 2.3; cd.sensor_fit = 'HORIZONTAL'
cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
cam.location = (0.02, -5, -0.1); cam.rotation_euler = (math.radians(90), 0, 0)
sc.camera = cam
sc.render.filepath = os.path.join(OUT, 'dream-cloud.png')
bpy.ops.render.render(write_still=True)
print('rendered cloud')
