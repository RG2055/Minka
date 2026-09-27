"""Cats (and a mouse) for the Nakts rooms, as small sprite sheets.

The cat is the rigged cat of the intro video (cat-base/rigged.blend). Legs are
driven by IK targets, the body by the spine bones; every motion is made here
as a function of the frame, in place (the page moves the sprite), and rendered
from a camera 52 deg from vertical (lower than the rooms' 33 deg, so a cat reads
as a cat and not as a shape seen from above), orthographic, at the rooms'
scale, with real fur (particle hair), in three directions: side (facing right; the page mirrors it for left),
front (towards the viewer) and back.

    Blender -b RIGGED_BLEND -P scripts/blender/nakts_cats.py -- OUT_DIR [anims...] [--check]

OUT_DIR/<variant>/<anim>-<dir>-<frame>.png, and cats.json (frame size, the
point of the frame that stands on the floor, frames per animation).
"""
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
CHECK = '--check' in argv
ONLY = [a for a in argv[1:] if not a.startswith('--')]
os.makedirs(OUT, exist_ok=True)

TILT = math.radians(52)
PX_PER_M = 89.7 * 2          # the rooms' scale, at 2x
SCALE = 1.3                  # cats a little larger than life, so they read at this size
FRAME = 192                  # frame size at 2x (square)
FPS = 12

sc = bpy.context.scene
arm = bpy.data.objects['CatRig']
cat = bpy.data.objects['Cat']
arm.scale = (SCALE,) * 3
bpy.context.view_layer.update()


# ── IK controls (as in the intro's pose_anim.py) ──
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
pb = arm.pose.bones
for L in ('L', 'R'):
    c = pb['forearm.' + L].constraints.new('IK'); c.target = arm; c.subtarget = 'ik_hand.' + L; c.chain_count = 2
    c.pole_target = arm; c.pole_subtarget = 'pole_elbow.' + L; c.pole_angle = math.radians(90)
    c = pb['hand.' + L].constraints.new('COPY_ROTATION'); c.target = arm; c.subtarget = 'ik_hand.' + L
    c = pb['shin.' + L].constraints.new('IK'); c.target = arm; c.subtarget = 'ik_foot.' + L; c.chain_count = 2
    c.pole_target = arm; c.pole_subtarget = 'pole_knee.' + L; c.pole_angle = math.radians(-90)
    c = pb['foot.' + L].constraints.new('COPY_ROTATION'); c.target = arm; c.subtarget = 'ik_foot.' + L
for b in pb:
    b.rotation_mode = 'XYZ'
rest = {b.name: b.bone.matrix_local.copy() for b in pb}


def clear():
    for b in pb:
        b.location = (0, 0, 0); b.rotation_euler = (0, 0, 0); b.scale = (1, 1, 1)


def set_matrix(name, m):
    pb[name].matrix = m
    bpy.context.view_layer.update()


def body(dz=0.0, dy=0.0, pitch=0.0, roll=0.0, spine=(0, 0, 0), bend=0.0):
    """Pelvis moved (dy along the body, dz up) and pitched (nose up +); the spine
    bones bent in x (arch) and z (side bend)."""
    r = rest['pelvis']
    m = Matrix.Translation(r.translation + Vector((0, dy, dz))) @ Matrix.Rotation(pitch, 4, 'X') @ Matrix.Rotation(roll, 4, 'Y') @ r.to_3x3().to_4x4()
    set_matrix('pelvis', m)
    for bn, a in zip(('spine2', 'spine3', 'chest'), spine):
        pb[bn].rotation_euler.x = a
        pb[bn].rotation_euler.z = bend / 3


def head(pitch=0.0, yaw=0.0, tilt=0.0, jaw=0.0, ears=0.0, blink=0.0):
    pb['neck1'].rotation_euler.x = pitch * 0.4
    pb['neck2'].rotation_euler.x = pitch * 0.3
    pb['head'].rotation_euler.x = pitch * 0.3
    pb['neck1'].rotation_euler.z = yaw * 0.4; pb['neck2'].rotation_euler.z = yaw * 0.3; pb['head'].rotation_euler.z = yaw * 0.3
    pb['head'].rotation_euler.y = tilt
    pb['jaw'].rotation_euler.x = jaw
    for L in ('L', 'R'):
        pb['ear.' + L].rotation_euler.x = ears
        pb['eye.' + L].scale = (1, 1, max(0.08, 1 - blink))


def tail(curl=(0.0,) * 6, side=(0.0,) * 6, puff=1.0):
    for i in range(6):
        b = pb['tail%d' % (i + 1)]
        b.rotation_euler.x = curl[i]; b.rotation_euler.z = side[i]
        b.scale = (puff, 1, puff)


def foot(name, dx=0.0, dy=0.0, dz=0.0, rot=0.0):
    """An IK target moved from its rest place (dx out, dy back, dz up), turned in x."""
    r = rest[name.replace('ik_', '')]
    m = Matrix.Translation(r.translation + Vector((dx, dy, dz))) @ Matrix.Rotation(rot, 4, 'X') @ r.to_3x3().to_4x4()
    set_matrix(name, m)


# ── motions: pose(f) for frame f of n ──
def gait(f, n, stride, lift, duty, phases, bob, tailwag):
    t = f / n
    clear(); place(); bpy.context.view_layer.update()
    body(dz=-bob * (0.5 - 0.5 * math.cos(4 * math.pi * t)), pitch=math.sin(2 * math.pi * t) * 0.02, spine=(0.02, 0, -0.02), bend=math.sin(2 * math.pi * t) * 0.06)
    head(pitch=0.05 + math.sin(4 * math.pi * t) * 0.03, yaw=math.sin(2 * math.pi * t) * 0.05)
    tail(curl=(-0.5, -0.25, -0.1, 0.1, 0.25, 0.3), side=tuple(math.sin(2 * math.pi * t - i * 0.6) * tailwag for i in range(6)))
    bpy.context.view_layer.update()
    for name, ph in phases.items():
        p = (t + ph) % 1.0
        if p < duty:                       # on the ground, sliding back under the body
            k = p / duty
            dy, dz, rot = -stride / 2 + stride * k, 0.0, 0.0
        else:                              # in the air, swinging forward
            k = (p - duty) / (1 - duty)
            dy = stride / 2 - stride * (0.5 - 0.5 * math.cos(math.pi * k))
            dz = lift * math.sin(math.pi * k)
            rot = -0.6 * math.sin(math.pi * k)
        foot(name, dy=dy, dz=dz, rot=rot)


def walk(f, n=8):
    gait(f, n, 0.13, 0.035, 0.62, {'ik_foot.L': 0.0, 'ik_hand.L': 0.25, 'ik_foot.R': 0.5, 'ik_hand.R': 0.75}, 0.006, 0.12)


def run(f, n=6):
    gait(f, n, 0.22, 0.06, 0.42, {'ik_foot.L': 0.0, 'ik_hand.R': 0.05, 'ik_foot.R': 0.5, 'ik_hand.L': 0.55}, 0.018, 0.2)


STATE = {'yaw': 0.0}


def place(roll=0.0, h=0.0, yaw=None):
    """The whole cat laid down: rolled about its long axis (around the body's
    middle, 0.2 m up) and lifted by h."""
    y = STATE['yaw'] if yaw is None else yaw
    mid = Matrix.Translation((0, 0, 0.2)) @ Matrix.Rotation(roll, 4, 'Y') @ Matrix.Translation((0, 0, -0.2))
    lift = Matrix.Translation((0, 0, (h - 0.2 * (1 - math.cos(roll))) if roll else 0))
    arm.matrix_world = Matrix.Rotation(y, 4, 'Z') @ Matrix.Scale(SCALE, 4) @ lift @ mid


def base(roll=0.0, h=0.0):
    clear(); place(roll, h); bpy.context.view_layer.update()


SIT = dict(dy=-0.0625, dz=-0.1357, pitch=-math.radians(55), spine=(math.radians(22), math.radians(6), math.radians(6)))


def sit_body(breath=0.0):
    body(dy=SIT['dy'], dz=SIT['dz'], pitch=SIT['pitch'] + breath * 0.01, spine=SIT['spine'])
    pb['chest'].scale = (1 + breath * 0.025, 1, 1 + breath * 0.02)


def sit_legs():
    foot('ik_foot.L', dx=-0.0005, dy=-0.0822, dz=-0.046, rot=-0.75)
    foot('ik_foot.R', dx=0.0005, dy=-0.0822, dz=-0.046, rot=-0.75)
    foot('ik_hand.L', dx=-0.0016, dy=-0.0128)
    foot('ik_hand.R', dx=0.0016, dy=-0.0128)


def sit_tail(t):
    # down to the floor behind, then round the side to the front paws; the tip twitches
    sw = math.sin(2 * math.pi * t)
    tail(curl=(0.28, 0.06, 0.0, 0.0, 0.05, 0.1), side=(0.3, 0.45, 0.5, 0.5, 0.45 + sw * 0.15, 0.4 + sw * 0.3))


def sit(f, n=8):
    t = f / n; base()
    sit_body(math.sin(2 * math.pi * t))
    head(pitch=0.28, yaw=math.sin(2 * math.pi * t) * 0.12, ears=(-0.3 if f == 5 else 0.0), blink=(0.9 if f == 3 else 0.0))
    sit_tail(t); bpy.context.view_layer.update(); sit_legs()


def groom(f, n=8):
    t = f / n; base()
    sit_body(0.0)
    k = math.sin(math.pi * ((f % 4) / 4))              # two licks per loop
    head(pitch=0.55 + k * 0.2, tilt=-0.25, jaw=k * 0.25, blink=0.85)
    sit_tail(t * 0.5); bpy.context.view_layer.update(); sit_legs()
    mouth = pb['jaw'].tail.copy()
    rh = rest['hand.L']
    tgt = mouth + Vector((0.004, 0.012 - k * 0.006, -0.028 + k * 0.008))
    set_matrix('ik_hand.L', Matrix.Translation(tgt) @ Matrix.Rotation(-math.radians(115), 4, 'X') @ Matrix.Rotation(math.radians(-25), 4, 'Z') @ rh.to_3x3().to_4x4())


def sleep(f, n=8):
    """Curled on its side, breathing."""
    t = f / n; br = math.sin(2 * math.pi * t)
    base(roll=math.pi / 2, h=0.07)
    body(dz=-0.03, spine=(0.15, 0.12, 0.1), bend=0.0)
    pb['chest'].scale = (1 + br * 0.03, 1, 1 + br * 0.025)
    head(pitch=0.45, tilt=0.2, blink=1.0, ears=-0.15)
    tail(curl=(-0.9, -0.3, -0.1, 0.0, 0.0, 0.0), side=(0.45, 0.45, 0.45, 0.4, 0.35, 0.3))
    bpy.context.view_layer.update()
    for nm, dy, dz in (('ik_hand.L', -0.05, 0.02), ('ik_hand.R', -0.06, 0.035), ('ik_foot.L', -0.07, 0.03), ('ik_foot.R', -0.08, 0.05)):
        foot(nm, dy=dy, dz=dz, rot=-0.5)


def belly(f, n=8):
    """On its back, paws up, wriggling."""
    t = f / n; w = math.sin(2 * math.pi * t)
    base(roll=math.pi, h=0.27)
    body(spine=(-0.08, -0.06, -0.04), bend=w * 0.04)           # a lazy stretch, no wriggling
    head(pitch=-0.2, tilt=w * 0.05, blink=0.6)
    tail(curl=(-0.2, -0.1, 0, 0.1, 0.1, 0.1), side=tuple(0.15 + math.sin(2 * math.pi * t + i * 0.5) * 0.06 for i in range(6)))
    bpy.context.view_layer.update()
    for nm, sx, ph in (('ik_hand.L', 1, 0.0), ('ik_hand.R', -1, 0.5), ('ik_foot.L', 1, 0.25), ('ik_foot.R', -1, 0.75)):
        k = math.sin(2 * math.pi * (t + ph))
        foot(nm, dx=sx * 0.01, dy=0.006 * k, dz=0.055 + 0.006 * k, rot=-1.0)


def loaf(f, n=8):
    """Tucked up like a loaf of bread (in the box): paws under the chest, tail
    round the body, head up, a slow breath and a blink."""
    t = f / n; br = math.sin(2 * math.pi * t)
    base()
    body(dz=-0.125, dy=0.01, pitch=0.02, spine=(0.05, 0.03, 0.02))
    pb['chest'].scale = (1 + br * 0.02, 1, 1 + br * 0.015)
    head(pitch=-0.12, yaw=math.sin(2 * math.pi * t) * 0.08, blink=(0.9 if f == 5 else 0.0))
    tail(curl=(0.35, 0.1, 0.0, 0.0, 0.0, 0.0), side=(0.55, 0.6, 0.6, 0.55, 0.5, 0.45))
    bpy.context.view_layer.update()
    for L in ('L', 'R'):
        foot('ik_hand.' + L, dy=0.05, dz=0.01, rot=-1.6)
        foot('ik_foot.' + L, dy=-0.06, dz=-0.02, rot=-0.9)


def jump(f, n=6):
    """Crouch, spring, fly, tuck, reach, land (the page lifts the sprite)."""
    base()
    P = [dict(dz=-0.05, pitch=0.05, fl=(0, 0, 0), hl=(0, 0, 0)),
         dict(dz=0.0, pitch=-0.45, fl=(-0.05, 0.1, -1.0), hl=(0.1, 0.0, 0.3)),
         dict(dz=0.02, pitch=-0.1, fl=(-0.1, 0.08, -1.2), hl=(0.12, 0.05, 0.6)),
         dict(dz=0.03, pitch=0.05, fl=(-0.02, 0.1, -1.0), hl=(0.02, 0.08, -0.8)),
         dict(dz=0.01, pitch=0.3, fl=(-0.06, 0.0, 0.2), hl=(0.06, 0.1, -0.6)),
         dict(dz=-0.04, pitch=0.1, fl=(0, 0, 0), hl=(0.02, 0.0, 0.0))][f]
    body(dz=P['dz'], pitch=P['pitch'], spine=(0.05, 0.02, 0.0))
    head(pitch=-P['pitch'] * 0.6 + 0.05, ears=-0.1)
    tail(curl=(-0.4, -0.2, 0.0, 0.1, 0.15, 0.2))
    bpy.context.view_layer.update()
    fy, fz, fr = P['fl'][0], P['fl'][1], P['fl'][2]
    hy, hz, hr = P['hl'][0], P['hl'][1], P['hl'][2]
    for L in ('L', 'R'):
        foot('ik_hand.' + L, dy=fy, dz=fz + P['dz'] * 0.3, rot=fr)
        foot('ik_foot.' + L, dy=hy, dz=hz, rot=hr)


def pounce(f, n=6):
    base()
    P = [(-0.06, 0.1, 0.0), (-0.065, 0.14, 0.0), (-0.02, -0.3, 0.06), (0.0, -0.05, 0.08), (-0.02, 0.25, 0.02), (-0.05, 0.08, 0.0)][f]
    dz, pitch, lift = P
    body(dz=dz, pitch=pitch, spine=(0.08, 0.04, 0.0))
    head(pitch=0.1 - pitch * 0.8, ears=-0.05)
    wig = 0.25 if f < 2 else 0.0
    tail(curl=(-0.2, 0.0, 0.1, 0.1, 0.1, 0.1), side=tuple((math.sin(f * 2.5 + i) * wig) for i in range(6)))
    bpy.context.view_layer.update()
    for L in ('L', 'R'):
        foot('ik_hand.' + L, dy=(-0.1 if f in (2, 3) else 0.0), dz=lift + (0.02 if f == 3 else 0.0), rot=(-0.8 if f in (2, 3) else 0.0))
        foot('ik_foot.' + L, dy=(0.08 if f == 2 else 0.0), dz=(lift * 0.5 if f in (2, 3) else 0.0), rot=(0.5 if f == 2 else 0.0))


def bat(f, n=6):
    """Sitting, swiping with a front paw."""
    t = f / n; base()
    sit_body(0.0)
    head(pitch=0.4, yaw=0.1)
    sit_tail(t); bpy.context.view_layer.update(); sit_legs()
    k = [0.0, 0.5, 1.0, 0.7, 0.3, 0.0][f]
    foot('ik_hand.R', dx=0.0016 - 0.01 * k, dy=-0.0128 - 0.08 * k, dz=0.09 * k, rot=-1.4 * k)


def hiss(f, n=6):
    """Back arched, tail up and puffed, ears flat, mouth open, trembling."""
    base()
    k = math.sin(math.pi * f / n)                                  # rises into the arch and holds it
    body(dz=0.012 + 0.013 * k, spine=(-0.25 - 0.1 * k, -0.22 - 0.08 * k, -0.15 - 0.05 * k))
    head(pitch=0.25, jaw=0.15 + 0.2 * k, ears=-0.7)
    tail(curl=(-0.9, -0.3, 0.1, 0.2, 0.2, 0.3), side=(0, 0.05, 0.1, 0.05, 0, -0.05), puff=1.7)
    bpy.context.view_layer.update()
    for L, sx in (('L', 1), ('R', -1)):
        foot('ik_hand.' + L, dx=sx * 0.01, dy=0.015)
        foot('ik_foot.' + L, dx=sx * 0.01, dy=-0.02)


def foot_world(name, p, rot=0.0):
    """An IK target put at a world point (the cat as it stands in the frame)."""
    r = rest[name.replace('ik_', '')]
    local = arm.matrix_world.inverted() @ Vector(p)
    set_matrix(name, Matrix.Translation(local) @ Matrix.Rotation(rot, 4, 'X') @ r.to_3x3().to_4x4())


def scratch(f, n=6):
    """Up on the hind legs against a bed's side (a plane 0.09 m in front of the cat,
    facing it), the front paws in turn reaching up and pulling the claws down it."""
    t = f / n; base()
    bob = math.sin(4 * math.pi * t)
    body(dz=0.02 + 0.008 * bob, dy=0.03, pitch=-math.radians(62), spine=(math.radians(-8), 0.0, 0.0))
    head(pitch=0.55 + 0.05 * bob, ears=-0.1)
    tail(curl=(0.4, 0.3, 0.2, 0.1, 0.05, 0.0), side=tuple(math.sin(2 * math.pi * t + i * 0.6) * 0.15 for i in range(6)))
    bpy.context.view_layer.update()
    fwd = Matrix.Rotation(STATE['yaw'], 4, 'Z')          # the cat's forward (-y at rest) turned as it stands
    for L, sy, ph in (('L', 1, 0.0), ('R', -1, 0.5)):
        k = 0.5 - 0.5 * math.cos(2 * math.pi * (t + ph))    # 0 high on the bed's side, 1 pulled down
        up, down = Vector((0.0, -0.085, 0.64)), Vector((0.0, -0.075, 0.48))
        p = up.lerp(down, k); p.x = sy * 0.04
        foot_world('ik_hand.' + L, fwd @ p, rot=-1.2 - 0.3 * k)
        foot('ik_foot.' + L, dy=-0.02)


def tug(f, n=6):
    """Pulling something backwards with the teeth (the blanket), little steps back."""
    t = f / n; base()
    body(dz=-0.02, pitch=0.12, dy=0.01 * math.sin(2 * math.pi * t), spine=(0.06, 0.04, 0.02))
    head(pitch=0.6, jaw=0.08, ears=-0.2)
    tail(curl=(-0.3, -0.1, 0.1, 0.2, 0.2, 0.2), side=tuple(math.sin(2 * math.pi * t + i * 0.7) * 0.2 for i in range(6)))
    bpy.context.view_layer.update()
    for nm, ph in (('ik_foot.L', 0.0), ('ik_hand.R', 0.25), ('ik_foot.R', 0.5), ('ik_hand.L', 0.75)):
        p = (t + ph) % 1
        foot(nm, dy=0.03 * math.sin(2 * math.pi * p) + (0.03 if 'hand' in nm else 0.0), dz=max(0.0, math.sin(2 * math.pi * p)) * 0.02)


ANIMS = {
    'walk': (walk, 8, ('side', 'front', 'back')),
    'run': (run, 6, ('side', 'front', 'back')),
    'sit': (sit, 8, ('side', 'front')),
    'groom': (groom, 8, ('front', 'side')),
    'loaf': (loaf, 8, ('front',)),
    'sleep': (sleep, 8, ('front',)),
    'belly': (belly, 8, ('front',)),
    'jump': (jump, 6, ('side',)),
    'pounce': (pounce, 6, ('side',)),
    'bat': (bat, 6, ('side',)),
    'hiss': (hiss, 6, ('side',)),
    'scratch': (scratch, 6, ('side',)),
    'tug': (tug, 6, ('side',)),
}


# ── fur ──
def fur(variant):
    m = bpy.data.materials['Fur']; m.use_nodes = True
    nt = m.node_tree; p = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
    for n in list(nt.nodes):
        if n.type not in ('BSDF_PRINCIPLED', 'OUTPUT_MATERIAL'):
            nt.nodes.remove(n)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    if variant == 'ginger':
        # tabby: stripes around the body, distorted by noise, a pale belly
        wave = nt.nodes.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'Y'
        wave.inputs['Scale'].default_value = 13.0; wave.inputs['Distortion'].default_value = 11.0; wave.inputs['Detail'].default_value = 4
        wave.inputs['Detail Scale'].default_value = 2.5
        nt.links.new(tc.outputs['Object'], wave.inputs['Vector'])
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position = 0.18; ramp.color_ramp.elements[0].color = (0.5, 0.17, 0.035, 1)
        ramp.color_ramp.elements[1].position = 0.55; ramp.color_ramp.elements[1].color = (0.92, 0.45, 0.12, 1)
        nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
        belly = nt.nodes.new('ShaderNodeMapRange'); belly.inputs['From Min'].default_value = 0.035; belly.inputs['From Max'].default_value = 0.09
        belly.inputs['To Min'].default_value = 1.0; belly.inputs['To Max'].default_value = 0.0
        nt.links.new(sep.outputs['Z'], belly.inputs['Value'])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        nt.links.new(belly.outputs['Result'], mix.inputs['Factor'])
        nt.links.new(ramp.outputs['Color'], mix.inputs['A'])
        mix.inputs['B'].default_value = (0.98, 0.8, 0.58, 1)
        nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
    elif variant == 'black':
        p.inputs['Base Color'].default_value = (0.012, 0.011, 0.013, 1)
    elif variant == 'grey':
        p.inputs['Base Color'].default_value = (0.3, 0.32, 0.36, 1)
    black = variant == 'black'
    p.inputs['Roughness'].default_value = 0.8 if black else 0.62
    for k, v in (('Sheen Weight', 0.5 if black else 0.8), ('Sheen Roughness', 0.5), ('Subsurface Weight', 0.0 if black else 0.08), ('Specular IOR Level', 0.25 if black else 0.5)):
        if k in p.inputs:
            p.inputs[k].default_value = v
    if 'Sheen Tint' in p.inputs:
        try:
            p.inputs['Sheen Tint'].default_value = (0.9, 0.9, 1.0, 1)
        except Exception:
            pass


# ── fur: particle hair on the fur faces, lying back along the body ──
def add_fur(variant):
    me = cat.data
    fur_i = [i for i, m in enumerate(me.materials) if m and m.name == 'Fur'][0]
    vg = cat.vertex_groups.get('fur') or cat.vertex_groups.new(name='fur')
    vg.add(sorted({v for p in me.polygons if p.material_index == fur_i for v in p.vertices}), 1.0, 'REPLACE')
    if 'FurHair' not in cat.modifiers:
        cat.modifiers.new('FurHair', 'PARTICLE_SYSTEM')
    ps = cat.particle_systems[-1]
    ps.vertex_group_density = 'fur'
    st = ps.settings
    st.type = 'HAIR'; st.use_advanced_hair = False          # the length is hair_length itself
    st.count = 20000
    st.hair_length = 0.0065                                   # short, dense fur
    st.emit_from = 'FACE'; st.use_emit_random = True; st.use_even_distribution = True
    st.child_type = 'INTERPOLATED'; st.rendered_child_count = 4; st.child_percent = 1
    st.clump_factor = 0.25; st.clump_shape = 0.3
    st.roughness_1 = 0.003; st.roughness_1_size = 0.6; st.roughness_endpoint = 0.004; st.roughness_end_shape = 1.2
    st.child_length = 1.0; st.child_length_threshold = 0.3
    st.root_radius = 0.9; st.tip_radius = 0.0; st.radius_scale = 0.0012; st.use_close_tip = True
    st.display_step = 3; st.render_step = 4
    m = bpy.data.materials.get('FurHairMat') or bpy.data.materials.new('FurHairMat')
    m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    hb = nt.nodes.new('ShaderNodeBsdfHairPrincipled')
    hb.inputs['Roughness'].default_value = 0.42 if variant != 'black' else 0.55
    hb.inputs['Radial Roughness'].default_value = 0.55
    if 'Coat' in hb.inputs:
        hb.inputs['Coat'].default_value = 0.15
    if 'Random Color' in hb.inputs:
        hb.inputs['Random Color'].default_value = 0.15
    if variant == 'black':
        hb.parametrization = 'MELANIN'
        hb.inputs['Melanin'].default_value = 0.97; hb.inputs['Melanin Redness'].default_value = 0.3
    else:
        hb.parametrization = 'COLOR'
        tc = nt.nodes.new('ShaderNodeTexCoord')
        if variant == 'ginger':
            wave = nt.nodes.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'Y'
            wave.inputs['Scale'].default_value = 13.0; wave.inputs['Distortion'].default_value = 11.0; wave.inputs['Detail'].default_value = 4
            nt.links.new(tc.outputs['Object'], wave.inputs['Vector'])
            ramp = nt.nodes.new('ShaderNodeValToRGB')
            ramp.color_ramp.elements[0].position = 0.2; ramp.color_ramp.elements[0].color = (0.62, 0.22, 0.05, 1)
            ramp.color_ramp.elements[1].position = 0.55; ramp.color_ramp.elements[1].color = (0.98, 0.56, 0.2, 1)
            nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
            sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
            belly = nt.nodes.new('ShaderNodeMapRange'); belly.inputs['From Min'].default_value = 0.035; belly.inputs['From Max'].default_value = 0.09
            belly.inputs['To Min'].default_value = 1.0; belly.inputs['To Max'].default_value = 0.0
            nt.links.new(sep.outputs['Z'], belly.inputs['Value'])
            mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
            nt.links.new(belly.outputs['Result'], mix.inputs['Factor'])
            nt.links.new(ramp.outputs['Color'], mix.inputs['A']); mix.inputs['B'].default_value = (1.0, 0.9, 0.76, 1)
            nt.links.new(mix.outputs['Result'], hb.inputs['Color'])
        else:
            hb.inputs['Color'].default_value = (0.5, 0.53, 0.6, 1)
    nt.links.new(hb.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    if m.name not in [s.material.name for s in cat.material_slots if s.material]:
        cat.data.materials.append(m)
    st.material_slot = m.name


# ── render setup ──
def setup():
    sc.render.engine = 'CYCLES'
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences
        pr.compute_device_type = 'METAL'; pr.get_devices()
        for d in pr.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception:
        pass
    sc.cycles.samples = 64 if CHECK else 160
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'
    sc.render.resolution_x = sc.render.resolution_y = FRAME
    for o in list(sc.objects):
        if o.type in ('CAMERA', 'LIGHT') or (o.type == 'MESH' and o.name not in ('Cat',)):
            o.hide_render = True
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.05, 0.06, 0.09, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    # the rooms' moonlight: a cool key from the front left, a soft rim from behind
    for loc, size, e, col in (((-1.2, -1.4, 2.2), 1.6, 70, (0.8, 0.86, 1.0)), ((1.0, 1.4, 1.6), 1.2, 45, (0.65, 0.75, 1.0))):
        L = bpy.data.lights.new('k', 'AREA'); L.size = size; L.energy = e; L.color = col
        o = bpy.data.objects.new('k', L); sc.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 0.15)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    # a shadow catcher on the floor
    bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, 0))
    fl = bpy.context.active_object; fl.name = 'ShadowFloor'; fl.is_shadow_catcher = True
    cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'
    cd.ortho_scale = FRAME / PX_PER_M
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
    cam.location = (0, -math.sin(TILT) * 5, math.cos(TILT) * 5 + 0.12)
    cam.rotation_euler = (TILT, 0, 0)
    cd.shift_y = 0.12
    sc.camera = cam
    return cam


def floor_anchor(cam):
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    return [round(v.x, 4), round(1 - v.y, 4)]


DIRS = {'side': math.pi / 2, 'front': 0.0, 'back': math.pi}   # the cat faces -Y at rest (towards the camera)

cam = setup()
if os.environ.get('PROBE'):
    # where the mouth and the front paws are in the frame (2x px from the top left), per frame
    from bpy_extras.object_utils import world_to_camera_view

    def px(v):
        c = world_to_camera_view(sc, cam, v)
        return [round(c.x * FRAME, 1), round((1 - c.y) * FRAME, 1)]
    for name in (os.environ['PROBE'].split(',')):
        fn, n, dirs = ANIMS[name]
        STATE['yaw'] = DIRS['side']; place()
        for f in range(n):
            fn(f, n); bpy.context.view_layer.update()
            mw = arm.matrix_world
            sh = mw @ pb['upperarm.L'].head
            reach = (pb['upperarm.L'].length + pb['forearm.L'].length) * SCALE
            print('PROBE', name, f, 'mouth', px(mw @ pb['jaw'].tail), 'handL', px(mw @ pb['hand.L'].head), 'handR', px(mw @ pb['hand.R'].head),
                  'ikL', px(mw @ pb['ik_hand.L'].head), 'shoulder', [round(x, 3) for x in sh], 'reach', round(reach, 3),
                  'ikLw', [round(x, 3) for x in (mw @ pb['ik_hand.L'].head)])
    sys.exit(0)
variants = [v for v in ('ginger', 'black', 'grey') if not os.environ.get('VARIANT') or v == os.environ['VARIANT']]
manifest = {'frame': FRAME, 'fps': FPS, 'anchor': floor_anchor(cam), 'anims': {}}
for variant in variants:
    fur(variant)
    add_fur(variant)
    vdir = os.path.join(OUT, variant); os.makedirs(vdir, exist_ok=True)
    for name, (fn, n, dirs) in ANIMS.items():
        if ONLY and name not in ONLY:
            continue
        manifest['anims'][name] = {'frames': n, 'dirs': list(dirs)}
        for d in dirs:
            STATE['yaw'] = DIRS[d]
            place()
            for f in range(n):
                fn(f, n)
                bpy.context.view_layer.update()
                sc.render.filepath = os.path.join(vdir, '%s-%s-%02d.png' % (name, d, f))
                bpy.ops.render.render(write_still=True)
            print('rendered', variant, name, d)
    if CHECK:
        break
mf = os.path.join(OUT, 'cats.json')
if os.path.exists(mf):
    old = json.load(open(mf)); old['anims'].update(manifest['anims']); manifest = old
json.dump(manifest, open(mf, 'w'), indent=1)
print('manifest', manifest)
