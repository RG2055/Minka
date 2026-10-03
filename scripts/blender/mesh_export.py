"""The statue as a small mesh for the gallery's own rasterizer: every part's posed,
modified shape copied (the high one), a decimated copy of it (the low one) with one
atlas, the marble's light baked from the high shapes onto it, written as
OUT (json: vertices in the game's local a, b, z; uvs; triangles; face normals) and
OUT with .png (the atlas).

Game local axes: a forward (the statue's front faces +a), b to the viewer's left
when looking at the front, z up; the plinth's bottom at z = 0.
"""
import json
import math

import bmesh
import bpy

TARGET_H = 0.62            # game units, the plinth's foot to the top of the tail
TRIS = {'Cat': 1000, 'Cat.001': 1000, 'Cube': 360}
TEX = 1024


def copy_eval(o, name):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=False, depsgraph=dg)
    me.transform(o.matrix_world)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def tri_count(me):
    return sum(len(p.vertices) - 2 for p in me.polygons)


def run(out, parts, texts, stone):
    sc = bpy.context.scene
    for m in bpy.data.materials:
        if m.use_nodes:
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    n.inputs['Subsurface Weight'].default_value = 0.0

    highs, lows = [], []
    for o in parts + texts:
        h = copy_eval(o, 'hi_' + o.name)
        if o.type == 'MESH' and o.name.startswith('Cat'):
            h.data.materials.clear(); h.data.materials.append(stone)
        highs.append(h)
    for o in parts:
        lo = copy_eval(o, 'lo_' + o.name)
        want = TRIS.get(o.name)
        n = tri_count(lo.data)
        if want and n > want:
            d = lo.modifiers.new('dec', 'DECIMATE'); d.ratio = want / n
            l2 = copy_eval(lo, 'lo2_' + o.name)
            l2.matrix_world.identity()
            bpy.data.objects.remove(lo); lo = l2
            # copy_eval applied matrix_world again: lo had identity, so nothing moved
        lows.append(lo)
        print('LOW', o.name, n, '->', tri_count(lo.data))
    for o in parts + texts:
        o.hide_render = True; o.hide_set(True)

    # one low object
    bpy.ops.object.select_all(action='DESELECT')
    for lo in lows:
        lo.select_set(True)
    bpy.context.view_layer.objects.active = lows[0]
    bpy.ops.object.join()
    low = bpy.context.view_layer.objects.active
    low.name = 'Low'
    bm = bmesh.new(); bm.from_mesh(low.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(low.data); bm.free()
    for p in low.data.polygons:
        p.use_smooth = False
    print('LOW TOTAL', len(low.data.polygons))

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.003)
    bpy.ops.object.mode_set(mode='OBJECT')

    img = bpy.data.images.new('statueTex', TEX, TEX, alpha=True)
    mat = bpy.data.materials.new('LowMat'); mat.use_nodes = True
    node = mat.node_tree.nodes.new('ShaderNodeTexImage'); node.image = img
    mat.node_tree.nodes.active = node
    low.data.materials.clear(); low.data.materials.append(mat)
    low.visible_shadow = False; low.visible_diffuse = False; low.visible_glossy = False

    # walked round in the game: light from every side (a bright room, a key from above
    # front left, another from behind right), not the photo's dark museum
    bg = sc.world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.62, 0.62, 0.64, 1); bg.inputs['Strength'].default_value = 1.0
    for nm, loc, e in (('back', (1.2, 1.5, 1.3), 140), ('top', (0.0, 0.0, 2.0), 120)):
        L = bpy.data.lights.new(nm, 'AREA'); L.energy = e; L.size = 1.2
        o = bpy.data.objects.new(nm, L); sc.collection.objects.link(o); o.location = loc
        from mathutils import Vector
        o.rotation_euler = (Vector((0, 0, 0.1)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 96
    bpy.ops.object.select_all(action='DESELECT')
    for h in highs:
        h.select_set(True)
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT', 'COLOR'}, use_selected_to_active=True,
                        cage_extrusion=0.02, max_ray_distance=0.08, margin=8)
    img.filepath_raw = out.replace('.json', '.png'); img.file_format = 'PNG'; img.save()

    # the mesh in the game's axes
    me = low.data
    zs = [v.co.z for v in me.vertices]
    z0, z1 = min(zs), max(zs)
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    k = TARGET_H / (z1 - z0)
    uvl = me.uv_layers.active.data
    verts, uvs, idx, nrm, seen = [], [], [], [], {}
    for p in me.polygons:
        tri = []
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            a, b, z = -(co.y - cy) * k, -(co.x - cx) * k, (co.z - z0) * k
            u, v = uvl[li].uv
            key = (round(a * 4000), round(b * 4000), round(z * 4000), round(u * 8192), round(v * 8192))
            if key not in seen:
                seen[key] = len(verts) // 3
                verts += key[:3]; uvs += [key[3], 8192 - key[4]]
            tri.append(seen[key])
        idx += tri
        n = p.normal
        nrm += [round(-n.y * 127), round(-n.x * 127), round(n.z * 127)]
    json.dump({'q': 4000, 'uq': 8192, 'v': verts, 't': uvs, 'f': idx, 'n': nrm}, open(out, 'w'), separators=(',', ':'))
    print('MESH', len(verts) // 3, 'verts', len(idx) // 3, 'tris', 'h', TARGET_H, 'w', (max(xs) - min(xs)) * k, 'd', (max(ys) - min(ys)) * k)
