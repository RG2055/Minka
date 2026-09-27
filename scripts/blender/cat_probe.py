import bpy, math, os, sys
out = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
arm = bpy.data.objects['CatRig']; cat = bpy.data.objects['Cat']
sc.render.engine = 'CYCLES'
try:
    pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'METAL'; pr.get_devices()
    for d in pr.devices: d.use = True
    sc.cycles.device = 'GPU'
except Exception: pass
sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = 256
for o in list(sc.objects):
    if o.type in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o)
fur = bpy.data.materials['Fur']; fur.use_nodes = True
fur.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.55, .25, .08, 1)
def cam(name, loc, rot, scale):
    cd = bpy.data.cameras.new(name); cd.type = 'ORTHO'; cd.ortho_scale = scale
    c = bpy.data.objects.new(name, cd); sc.collection.objects.link(c); c.location = loc; c.rotation_euler = rot; return c
ld = bpy.data.lights.new('sun', 'SUN'); ld.energy = 3.5; lo = bpy.data.objects.new('sun', ld); sc.collection.objects.link(lo); lo.rotation_euler = (math.radians(20), math.radians(-15), 0)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = .8
pb = arm.pose.bones
for b in pb: b.rotation_mode = 'XYZ'
def shot(tag):
    for nm, c in (('top', cam('t', (0, 0, 3), (0, 0, 0), .7)), ('side', cam('s', (3, 0, .2), (math.radians(90), 0, math.radians(90)), .7))):
        sc.camera = c; sc.render.filepath = os.path.join(out, '%s-%s.png' % (tag, nm)); bpy.ops.render.render(write_still=True)
shot('rest')
pb['thigh.L'].rotation_euler = (math.radians(35), 0, 0)
pb['upperarm.L'].rotation_euler = (math.radians(35), 0, 0)
pb['tail2'].rotation_euler = (0, 0, math.radians(30))
pb['head'].rotation_euler = (0, 0, math.radians(30))
shot('probeX')
