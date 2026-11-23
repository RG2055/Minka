"""The RG creatures ("Būtne"): one sculpted master character and its family of twelve, not balls with hair on them.

The body is one continuous surface, modelled as a sum of soft volumes (the mass, cheeks, muzzle, brow, ears, paws)
with hollows taken out of it (the eye sockets, the dish of each ear): BLOBS below. Every vertex of a dense sphere
is moved out along its ray to where that sum crosses a threshold, so the volumes melt into each other the way clay
does and the mesh keeps the sphere's UV map, which the fur needs to hold on to.
The eyes are whole eyeballs set into the sockets, each under a lid of its own (a shell round the eyeball, furred like
the face), so an expression is the lid moving, not another eye. The fur is short and in three lengths (body, face
and ears, lids), gathered into small locks, each strand its own length and shade, lying in directions that wander
over the body instead of all pointing out or down.

    Blender -b -P scripts/blender/rg_master.py -- OUT_DIR [--kind mizi] [--only tired] [--size 768] [--samples 128] [--clay]

--clay renders the bare sculpt, without fur: for judging the form.
"""
import json
import math
import time
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Quaternion, Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0]) if ARGS and not ARGS[0].startswith('--') else os.path.abspath('rg-master-out')


def opt(name, default=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS and ARGS.index(name) + 1 < len(ARGS) else default


SIZE, SAMPLES, ONLY, CLAY = int(opt('--size', 768)), int(opt('--samples', 128)), opt('--only'), '--clay' in ARGS

GREEN = (0.054, 0.694, 0.283)    # the app's level colours (fatigue.js FATIGUE_LEVELS), linear
YELLOW = (0.930, 0.640, 0.020)
ORANGE = (1.000, 0.346, 0.056)
RED = (1.000, 0.107, 0.162)

# The family: one master (the same mass, face, eyes, paws, fur and light), told apart by what is on their heads.
# The body's colour is the app's colour for the step of fatigue. What is each one's own, and stays through every
# state, is its accents: the cheeks, the inside of the ears, and whatever it wears (bobs, leaves, gills, horns).
PINK = (1.0, 0.30, 0.28)
KINDS = {
    'pufs':    dict(cheek=PINK),                                              # a plain round puff
    'astonis': dict(cheek=(1.0, 0.24, 0.12)),                                 # four stubby legs, a forelock
    'lacis':   dict(cheek=PINK, ear=(1.0, 0.80, 0.52)),                       # a bear cub: round ears, cream inside
    'zakis':   dict(cheek=PINK, ear=(1.0, 0.42, 0.50)),                       # a rabbit: long ears standing, pink inside
    'antenas': dict(cheek=PINK, bob=(1.0, 0.74, 0.16)),                        # two feelers with golden bobs (golden cheeks went olive on green fur)
    'cekuls':  dict(cheek=(1.0, 0.46, 0.26)),                                 # a lock of hair standing on its head
    'mizi':    dict(cheek=(0.30, 0.58, 1.0), ear=(0.94, 0.94, 0.94)),         # a kitten: pointed ears, white inside, a white muzzle and chest
    'lumo':    dict(cheek=PINK),                                             # a lop rabbit: long ears in an arc, hanging
    'koro':    dict(cheek=PINK),                                              # a little monster: two horns, a crest, two tiny fangs
    'aksi':    dict(cheek=PINK, gill=(1.0, 0.26, 0.20)),                      # an axolotl: three gills on each side, a pale belly
    'asns':    dict(cheek=PINK, leaf=(0.05, 0.42, 0.07)),                     # two leaves growing on its head
    'pele':    dict(cheek=PINK, ear=(1.0, 0.46, 0.50)),                       # a mouse: large round ears on its head, pink inside; a pink nose
}
KIND = opt('--kind', 'lacis')
assert KIND in KINDS, KIND
EARS = {'lacis': (0.72, 0.72), 'mizi': (0.70, 0.70)}   # the ears that are part of the head: where
RISE = {'pele': 0.14, 'zakis': 0.26, 'antenas': 0.24, 'asns': 0.24, 'koro': 0.12, 'lumo': 0.10, 'cekuls': 0.18}   # the frame moves up for what stands tall

# Tiredness is told the way a sleepy pet tells it, and every state has to be lovable: soft lids coming down, the
# ears relaxing, the paws sliding, the head leaning a little, a tiny yawn, and at last the creature lying down
# asleep with a smile. Never by a hollow eye or a heavy brow. The colour is the level's.
# lid: how far the upper lid is down over the eye (0 .. 1); under: the lower lid, raised by a smile; mouth: its
# kind; ears: how relaxed (0 .. 1); paws: how far they have slid down and apart; tilt: the head's lean, degrees;
# lie: lying down (0 sitting, 1 asleep on its paws).
EXPRESSIONS = {
    'happy':      dict(col=GREEN,  lid=0.05, under=0.12, mouth='open',  ears=0.0, paws=0.0, tilt=0, lie=0.0),
    'normal':     dict(col=YELLOW, lid=0.10, under=0.05, mouth='smile', ears=0.1, paws=0.2, tilt=0, lie=0.0),
    'tired':      dict(col=ORANGE, lid=0.30, under=0.00, mouth='smile', ears=0.5, paws=0.5, tilt=4, lie=0.0),
    'very-tired': dict(col=RED,    lid=0.44, under=0.00, mouth='yawn',  ears=0.8, paws=0.8, tilt=7, lie=0.12),
    'exhausted':  dict(col=RED,    lid=1.00, under=0.00, mouth='smile', ears=1.0, paws=1.0, tilt=0, lie=1.0),
}

# A drink, as one movement (--scene drink): the sleepy creature notices a can standing by it, leans to it, puts a paw
# on it, lifts it, brings its top to its mouth and tips it up as its eyes open, swallows, lowers it, and is awake
# with the can in its paw beside it, waves once and puts the can away. No loop: afterwards its still picture is shown.
# The can is in the scene and in the paw: the paw is at the end of a short furry arm, set on the can's side and a
# little in front of it, and paw and can are moved by the same keys, so they go together.
# KEYS: (seconds, pose). Every number in a pose is eased from key to key (FPS frames a second), so nothing jumps:
# lid, under, ears, tilt (the body's lean, degrees), squash, pawL / pawR (where a paw is), can (x, y, z, its lean to
# the side in degrees: negative lays its top over to the creature's mouth).
FPS, CAN_H, CAN_R = 12.5, 0.66, 0.165
LIPS = (0.0, -1.36, -0.205)   # where the can's top goes to be drunk from, seen from the front
REST_L, REST_R = (-0.31, -0.86, -0.58), (0.31, -0.86, -0.58)   # as paws_at puts them when lively: the film ends in the still picture's pose


def _up(back, at=LIPS):
    """The can held under the mouth, its top at the lips, tipped back this far (its foot comes up towards us)."""
    a = math.radians(back)
    return (at[0], at[1] - math.sin(a) * CAN_H / 2, at[2] - math.cos(a) * CAN_H / 2 - 0.02, 0, back)


def _both(can):
    """Both paws on a can held in front: one on each side, a little before it."""
    return dict(can=can, pawL=(can[0] - CAN_R - 0.07, can[1] - 0.09, can[2] - 0.03), pawR=(can[0] + CAN_R + 0.07, can[1] - 0.09, can[2] - 0.03))


def _grip(can, dx=0.17, dz=-0.12):
    """One paw on a can: on its side away from the face, a little before it."""
    a = math.radians(can[3])
    return (can[0] + math.cos(a) * dx + math.sin(a) * dz, can[1] - 0.11, can[2] - math.sin(a) * dx + math.cos(a) * dz)


_stand = (0.76, -1.42, -0.66 + CAN_H / 2 - 0.02, 0, 0)   # standing on the floor by the creature
_front = (0.30, -1.44, -0.38, 0, 0)                      # held before it in both paws, beside its mouth
_down = (0.78, -1.32, -0.30, -8, 0)                      # in the right paw, at its side: inside its own outline, so the picture is no wider for it
_wave = (-0.82, -0.90, -0.12)                            # the left paw, up
# One action, played once when a drink is logged: asleep -> a can -> a paw on it -> both paws -> to the mouth, tipped
# up, a swallow -> down, pleased -> the can beside it in one paw, a smile, one wave. It ends holding the drink, and
# keeps holding it while the caffeine works; another drink logged replaces it.
KEYS = [
    (0.00, dict(lid=0.52, under=0.00, ears=0.8, tilt=5,  squash=0.0,   pawL=REST_L, pawR=REST_R, can=_stand)),       # asleep on its feet
    (0.35, dict(lid=0.36, under=0.00, ears=0.6, tilt=1,  squash=0.0,   pawL=REST_L, pawR=REST_R, can=_stand)),       # a can?
    (0.70, dict(lid=0.26, under=0.00, ears=0.4, tilt=-4, squash=0.01,  pawL=REST_L, pawR=_grip(_stand), can=_stand)),    # it leans, a paw on it
    (1.05, dict(lid=0.20, under=0.00, ears=0.3, tilt=0,  squash=0.0,   **_both(_front))),                            # before it, in both paws
    (1.35, dict(lid=0.18, under=0.00, ears=0.2, tilt=0,  squash=0.0,   **_both(_up(20)))),                           # up to its mouth
    (1.60, dict(lid=0.36, under=0.06, ears=0.1, tilt=0,  squash=-0.02, **_both(_up(58)))),                           # tipped up: it drinks, eyes half shut with it
    (1.85, dict(lid=0.14, under=0.06, ears=0.0, tilt=0,  squash=0.03,  **_both(_up(24)))),                           # a swallow
    (2.10, dict(lid=0.05, under=0.10, ears=0.0, tilt=0,  squash=0.0,   **_both(_front))),                            # down: oh, that is good
    (2.40, dict(lid=0.03, under=0.12, ears=0.0, tilt=0,  squash=0.0,   pawL=REST_L, pawR=_grip(_down), can=_down)),  # the can beside it, a smile
    (2.65, dict(lid=0.03, under=0.14, ears=0.0, tilt=2,  squash=0.02,  pawL=_wave, pawR=_grip(_down), can=_down)),   # one wave
    (2.95, dict(lid=0.03, under=0.12, ears=0.0, tilt=0,  squash=0.0,   pawL=REST_L, pawR=_grip(_down), can=_down)),
]   # and there it stays: the drink is in its paw for as long as the caffeine is in the body (the last frame is the card's picture until then)
MOUTHS = ((0.0, 'smile'), (1.25, 'sip'), (2.00, 'open'))   # from when on
CAN_FROM = 0.20                                            # the can is there from this moment


def _mix(a, b, u):
    return tuple(x + (y - x) * u for x, y in zip(a, b)) if isinstance(a, tuple) else a + (b - a) * u


# Coffee does not beat fatigue. The film is the same movement at every step of fatigue (--level), and it starts
# from that step's own still picture (EXPRESSIONS: its colour, face, ears, paws, lean, and lying down at the very
# top), so the card goes from picture to film without a jump. While it drinks the creature is as awake as that step
# allows (the lids' most open), and it ends holding the drink, half-way back to its own face: a rested one just
# enjoys it; a worn-out one stays red and heavy-lidded; the most worn-out sits up from its sleep to drink and lies
# down again with the can in its paw.
# (the still it starts from, its lids at their most open, the mouth afterwards, how high the wave goes)
LEVELS = {
    'low':  ('happy',      0.03, 'open',  1.0),    #  0 .. 20
    'mid':  ('normal',     0.05, 'open',  1.0),    # 21 .. 45
    'high': ('tired',      0.20, 'smile', 0.7),    # 46 .. 70
    'crit': ('very-tired', 0.38, 'smile', 0.4),    # 71 .. 85
    'exh':  ('exhausted',  0.52, 'smile', 0.0),    # 86 .. 100: asleep lying down
}
LEVEL = opt('--level', 'low')
STILLS = EXPRESSIONS


def pose_at(t):
    mood, lid_up, after, wave = LEVELS[LEVEL]
    base = STILLS[mood]
    for (t0, a), (t1, b) in zip(KEYS, KEYS[1:]):
        if t <= t1:
            u = min(1.0, max(0.0, (t - t0) / (t1 - t0)))
            u = u * u * (3 - 2 * u)
            key = {k: _mix(a[k], b[k], u) for k in a}
            break
    else:
        key = dict(KEYS[-1][1])
    ease = lambda u: (lambda v: v * v * (3 - 2 * v))(min(1.0, max(0.0, u)))
    woke = ease(t / 0.9)                          # 0 its own still .. 1 in the action
    alert = woke * (1 - (1.0 if base['lie'] > 0.9 else 0.5) * ease((t - 2.4) / 0.55))    # how awake: all the way while it drinks, half-way after (the sleeper: asleep again)
    risen = ease((t - 0.45) / 0.55) * (1 - ease((t - 2.15) / 0.75))   # sat up from lying
    lie = base['lie'] * (1 - 0.80 * risen)
    low = 0.22 * lie                              # the face, and what is held to it, is that much lower
    rest = paws_at(dict(base, pawL=None, pawR=None))   # where the still has its paws
    rest = [rest[1], rest[3]] if KIND == 'astonis' else rest   # the octopus: its front pair (the outer legs stay where they are)
    out = dict(col=base['col'], paws=base['paws'], arms=1, lie=lie, squash=key['squash'], under=base['under'] + (key['under'] - base['under']) * woke,
               tilt=base['tilt'] * (1 - woke) + key['tilt'] * woke, ears=base['ears'] * (1 - 0.6 * alert),
               lid=min(1.0, base['lid'] + (min(base['lid'], lid_up) - base['lid']) * alert + (0.12 if 1.45 < t < 1.75 else 0)))
    if out['lid'] > 0.9 and risen > 0.15:         # shut eyes are drawn another way: do not sit up with them
        out['lid'] = 0.9
    for name, home, at in (('pawL', REST_L, rest[0]), ('pawR', REST_R, rest[1])):
        p = tuple(k + (r - h) * (1 - woke) for k, h, r in zip(key[name], home, at))
        if name == 'pawL' and key[name][2] > REST_L[2] + 0.01:   # the wave: lower when tired
            p = _mix(tuple(at), p, wave)
        out[name] = (p[0], p[1], max(-0.62, p[2] - (low if t > 0.9 else 0)))
    if t >= CAN_FROM:
        c = key['can']
        foot = -0.66 + CAN_H / 2 * math.cos(math.radians(c[4])) - 0.02
        # in one paw at its side, the drink sits further in than the paw: the paw is on its edge, its face shows
        out['can'] = (c[0] - 0.11 * ease((t - 2.10) / 0.30), c[1], max(foot, c[2] - (low if t > 0.75 else 0)), c[3], c[4])
    sip = [m for at, m in MOUTHS if t >= at][-1]
    out['mouth'] = base['mouth'] if sip == 'smile' else after if sip == 'open' else sip
    if out['mouth'] == 'yawn' and woke > 0.5:
        out['mouth'] = 'smile'
    return out



# A dance, as a loop (--scene dance): the dancing rats of the cupboard-rave clip, move for move, on the clip's own
# beat (about 140 a minute, B = one beat), shown while the radio is open. Four parts as in the clip: arms out wide and
# the hips swaying; jumping with the paws up high, waving; one paw up and one out, then a paw on the forehead, first
# one then the other; at the end the arms flung wide and the head back, singing. It ends in its first pose: a loop.
# DANCE: (seconds, pose): pawL / pawR (where a paw is), tilt (the lean, degrees), squash (+ squat, - stretched up),
# hop (how high off the floor), sway (to the side). The face: joyful, eyes open, mouth open.
B = 0.43
_Lw, _Rw = (-1.55, -0.55, -0.02), (1.55, -0.55, -0.02)       # arms out wide
_Lf, _Rf = (-1.50, -0.55, 0.22), (1.50, -0.55, -0.22)         # ... one a little up, the other down (the flap)
_Lu, _Ru = (-0.80, -0.48, 1.22), (0.80, -0.48, 1.22)          # up high
_Lh, _Rh = (-0.95, -0.50, 0.78), (0.95, -0.50, 0.78)          # up, lower: the wave's other end
_Lo, _Ro = (-1.30, -0.58, -0.32), (1.30, -0.58, -0.32)        # out and down
_Rb, _Lb = (0.30, -0.50, 1.02), (-0.30, -0.50, 1.02)          # a paw on top of the head (the elbow out)


def _d(t, l, r, tilt=0, sq=0.0, hop=0.0, sway=0.0):
    return (round(t, 3), dict(pawL=l, pawR=r, tilt=tilt, squash=sq, hop=hop, sway=sway))


DANCE = []
for i in range(6):            # 1: arms wide, the hips sway, a squat on each beat
    s_ = 1 if i % 2 == 0 else -1
    DANCE += [_d(i * B, _Lw, _Rw, 12 * s_, 0.07, 0.0, 0.16 * s_), _d(i * B + B / 2, _Lf if s_ > 0 else _Lw, _Rw if s_ > 0 else _Rf, 4 * s_, -0.05, 0.05, 0.05 * s_)]
t0 = 6 * B                    # 2: the arms go up, waving
DANCE += [_d(t0, _Lh, _Rw, -4, 0.0), _d(t0 + B / 2, _Lu, _Rh, 4, -0.03, 0.04), _d(t0 + B, _Lh, _Ru, -4, 0.02)]
t0 += 1.5 * B                 # 3: jumping, the paws up high, waving left and right
for i in range(7):
    s_ = 1 if i % 2 == 0 else -1
    DANCE += [_d(t0 + i * B, _Lu if s_ > 0 else _Lh, _Rh if s_ > 0 else _Ru, 7 * s_, 0.09, 0.0, 0.07 * s_),
              _d(t0 + i * B + B / 2, _Lh if s_ > 0 else _Lu, _Ru if s_ > 0 else _Rh, 2 * s_, -0.12, 0.38, 0.0)]
t0 += 7 * B                   # 4: one paw up, one out, swaying ...
for i in range(3):
    s_ = 1 if i % 2 == 0 else -1
    DANCE += [_d(t0 + i * B, _Lu if s_ > 0 else _Lo, _Ro if s_ > 0 else _Ru, 10 * s_, 0.06, 0.0, 0.12 * s_), _d(t0 + i * B + B / 2, _Lh if s_ > 0 else _Lo, _Ro if s_ > 0 else _Rh, 3 * s_, -0.05, 0.06)]
t0 += 3 * B                   # ... then a paw on the forehead, the other down and out: right, then left
for i in range(4):
    s_ = 1 if i % 2 == 0 else -1
    right = i < 2
    DANCE += [_d(t0 + i * B, _Lo if right else _Lb, _Rb if right else _Ro, (-8 if right else 8) + 3 * s_, 0.05, 0.0, 0.06 * s_),
              _d(t0 + i * B + B / 2, _Lo if right else _Lb, _Rb if right else _Ro, (-6 if right else 6), -0.02, 0.03)]
t0 += 4 * B                   # 5: arms flung wide, the head back, singing; back to the first pose
for i in range(3):
    s_ = 1 if i % 2 == 0 else -1
    DANCE += [_d(t0 + i * B, _Lu if s_ > 0 else _Lw, _Rw if s_ > 0 else _Ru, -6 * s_, 0.04, 0.0, -0.06 * s_), _d(t0 + i * B + B / 2, _Lw, _Rw, 0, -0.04, 0.06)]
DANCE += [_d(t0 + 3 * B, _Lw, _Rw, 12, 0.07, 0.0, 0.16)]   # = the first key: the loop closes
DANCE_LEN = DANCE[-1][0]


def dance_at(t):
    mood = LEVELS[LEVEL][0]
    base = STILLS[mood]
    for (t0_, a), (t1_, b) in zip(DANCE, DANCE[1:]):
        if t <= t1_:
            u = min(1.0, max(0.0, (t - t0_) / (t1_ - t0_)))
            u = u * u * (3 - 2 * u)
            key = {k: _mix(a[k], b[k], u) for k in a}
            break
    else:
        key = dict(DANCE[-1][1])
    return dict(col=base['col'], paws=0.0, arms=1, lie=0.0, under=0.12, ears=0.0, lid=0.04, mouth='open', **key)


# A dance from a video (--scene mocap --moves file.json, scripts/blender/dance/mocap_to_dance.py): per frame where
# its paws and feet are, its lean, sway and hop, read from a dancing rat by MoCapAnything V2. It stands on short
# furry legs for it; the face is the joyful one, as in the dance above.
LEGS_HIP = {'L': (-0.40, -0.40, -0.62), 'R': (0.40, -0.40, -0.62)}


def mocap_at(f):
    base = STILLS[LEVELS[LEVEL][0]]
    return dict(col=base['col'], paws=0.0, arms=1, lie=0.0, under=0.12, ears=0.0, lid=0.04, mouth='open', squash=0.0,
                pawL=tuple(f['pawL']), pawR=tuple(f['pawR']), footL=tuple(f['footL']), footR=tuple(f['footR']),
                tilt=f['tilt'], sway=f['sway'], hop=f['hop'])


# The meme, danced (--scene meme --moves file.json, scripts/blender/dance/meme_from_mocap.py): the creature's round head
# as it is (face, eyes, ears), on a dance body: a furry torso, arms with elbows, legs with knees, feet on the floor.
# Per frame the file gives the body's joints; each part is placed between its two, the head turned by 'up'.
MEME_PARTS = {'belly': (0.52, 0.46, 0.58), 'chest': (0.44, 0.40, 0.52), 'uarm': (0.105, 0.105, 0.31),
              'farm': (0.095, 0.095, 0.28), 'thigh': (0.16, 0.16, 0.21), 'shin': (0.135, 0.135, 0.20), 'mfoot': (0.17, 0.28, 0.10)}
MEME_HEAD = 0.56   # the round creature's whole self, as the dance body's head: about a third of the body's width wider


def meme_at(f):
    base = STILLS[LEVELS[LEVEL][0]]
    return dict(col=base['col'], paws=0.0, lie=0.0, under=0.12, ears=0.0, lid=0.04, mouth='open', squash=0.0, tilt=0.0,
                meme=1, joints=f)


# The round dance (--scene round --moves file.json): the ORIGINAL creature (its round body, fur, face, tiny paws) moved
# as a whole: it bounces, squashes and stretches, leans, turns a little, lifts a small foot, raises its short arms.
# Per frame: pawL / pawR (short arms, never long), footL / footR (small feet tucked under the body), sq (+ squash,
# - stretch), lift (off the floor, for a jump), tilt (lean, degrees), yaw (turn, degrees), look (the eyes, -1..1).
ROUND_SH = 0.78   # the shoulders' half width (as the drink film's arms)


def round_at(f):
    base = STILLS[LEVELS[LEVEL][0]]
    grin = f.get('mouth') == 'grin'   # showing off its grillz: smug, the lower lids push up
    return dict(col=base['col'], paws=0.0, arms=1, lie=0.0, under=0.85 if grin else 0.12, ears=0.0, lid=0.04, mouth=f.get('mouth', 'open'), squash=0.0,
                tilt=0.0, pawL=tuple(f['pawL']), pawR=tuple(f['pawR']), footL=tuple(f['footL']), footR=tuple(f['footR']),
                nolegs=1, f=f)

SCENE = opt('--scene')
LAYER = opt('--layer')   # 'body': the creature without the drink; 'drink': the drink alone, cut by the paws in front of it; laid one on the other they are the whole picture, and any drink goes with any creature
# The drink in its paws: one of the app's own (calendar.js coffeeSourceMeta), named by its source.
DRINK_IS = opt('--drink', 'monsterultra')
DRINKS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'drinks')   # the app's drink icons as pictures, and drinks.json (shape, size, colours)
DRINK_INFO = json.load(open(os.path.join(DRINKS_DIR, 'drinks.json')))

EYE = Vector((0.37, -0.705, 0.07))   # the right eyeball's centre (the left is its mirror)
ER = 0.212                           # its radius
T = 0.3                              # the threshold: a lone volume of weight 1 shows at 0.575 of its reach


def ear_at(e, s):
    x, z = EARS.get(KIND, (0.70, 0.70))
    return Vector((s * (x + 0.07 * e['ears'] + 0.08 * e['lie']), 0.02, z - 0.06 * e['ears'] - 0.30 * e['lie']))


def paws_at(e):
    """The paws, left then right; the octopus has four legs: on each side an outer one, then the front one."""
    out = []
    for s in (-1, 1):
        held = e.get('pawL' if s < 0 else 'pawR')
        if KIND == 'astonis':   # its outer legs stand out at its sides whatever the front ones do
            out += [Vector((s * (0.90 + 0.06 * e['paws'] + 0.05 * e['lie']), -0.52, -0.60))]
        if held:
            out += [Vector(held)]
        elif KIND == 'astonis':
            out += [Vector((s * (0.25 + 0.05 * e['paws']), -0.92 - 0.05 * e['lie'], -0.63))]
        else:
            out += [Vector((s * (0.31 + 0.09 * e['paws'] + 0.08 * e['lie']), -0.86 - 0.07 * e['lie'], -0.58 - 0.06 * e['paws']))]
    return out


def eye_at(e, s):
    return Vector((s * EYE.x, EYE.y, EYE.z - 0.22 * e['lie']))


def volumes(e):
    """(centre, visible radii, weight): weight < 0 hollows out."""
    lie = e['lie']
    sq = e.get('squash', 0.0)
    out = [((0, 0, -0.22 * lie - 0.5 * sq), ((1.10 + 0.05 * lie) * (1 + 0.5 * sq), 0.98 + 0.04 * lie, (0.87 - 0.25 * lie) * (1 - sq)), 1.0)]   # the mass (lying it is flatter, hardly wider: the frame is the same)
    out += [((0, -0.62, -0.16 - 0.22 * lie), (0.40, 0.30, 0.30), 0.22)]              # the muzzle: a little forward
    out += [((0, -0.55, 0.36 - 0.30 * lie), (0.62, 0.34, 0.26), 0.16)]               # the brow
    for s in (-1, 1):
        ear, eye = ear_at(e, s), eye_at(e, s)
        out += [((s * (0.60 + 0.03 * lie), -0.50, -0.24 - 0.14 * lie), (0.36, 0.32, 0.30), 0.34)]   # a cheek
        if KIND == 'lacis':
            out += [(ear, (0.29, 0.19, 0.28 - 0.03 * e['ears']), 1.0)]                # a round ear
            out += [(ear + Vector((0, -0.22, 0.03)), (0.15, 0.13, 0.15), -0.50)]      # its dish
        if KIND == 'mizi':                                                            # a pointed ear: a base and a tip
            lean = Vector((s * (0.06 + 0.10 * e['ears']), 0, 0.20 - 0.07 * e['ears']))
            out += [(ear + Vector((-s * 0.06, 0, -0.04)), (0.25, 0.17, 0.20), 0.95), (ear + lean, (0.13, 0.11, 0.17), 0.85)]
            out += [(ear + Vector((-s * 0.03, -0.20, 0.03)), (0.13, 0.12, 0.15), -0.45)]
        if s == 1:   # what stands on the middle of the head
            top = 0.86 - 0.47 * lie   # the head's top: lower when it lies down
            if KIND == 'koro':      # a crest
                out += [((0, 0.02, top + 0.06), (0.10, 0.12, 0.17), 0.9), ((-0.19, 0.02, top - 0.02), (0.08, 0.10, 0.13), 0.8), ((0.19, 0.02, top - 0.02), (0.08, 0.10, 0.13), 0.8)]
            if KIND == 'cekuls':    # a lock of hair, leaning; it lies down as the creature tires
                out += [((0.10 + 0.20 * e['ears'], 0.02, top + 0.20 - 0.14 * e['ears']), (0.16, 0.15, 0.36 - 0.10 * e['ears']), 1.0), ((0.02, 0.02, top - 0.02), (0.20, 0.17, 0.17), 0.6)]
    for s in (-1, 1):
        eye = eye_at(e, s)
        if e['lid'] < 0.98:   # asleep there is no hollow: the face is whole and furred, with a lash line on it
            out += [(eye + Vector((0, -0.20, 0)), (ER * 1.20, 0.20, ER * 1.22), -0.42)]   # a shallow eye socket
    return [(Vector(c), tuple(v / 0.575 for v in r), w) for c, r, w in out]


def field(p, vols):
    f = 0.0
    for c, r, w in vols:
        d = ((p.x - c.x) / r[0]) ** 2 + ((p.y - c.y) / r[1]) ** 2 + ((p.z - c.z) / r[2]) ** 2
        if d < 1:
            f += w * (1 - d) ** 3
    return f


def sculpt(e):
    """The body: a dense sphere, each vertex moved along its ray to the outermost place the volumes' sum reaches T."""
    vols = volumes(e)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=144 if SCENE else 192, ring_count=72 if SCENE else 96, radius=1)   # a film's frames are small: a lighter mesh
    body = bpy.context.object
    body.name = 'body'
    # every vertex at once (numpy): the same search as one vertex at a time, a tenth of the wait
    n = len(body.data.vertices)
    co = np.empty(n * 3)
    body.data.vertices.foreach_get('co', co)
    way = co.reshape(n, 3)
    way = way / np.linalg.norm(way, axis=1)[:, None]
    C, R, W = np.array([tuple(c) for c, _, _ in vols]), np.array([r for _, r, _ in vols]), np.array([w for _, _, w in vols])

    def at(rad):
        d = (((way * rad[:, None])[:, None, :] - C[None]) / R[None]) ** 2
        d = d.sum(-1)
        return (np.where(d < 1, (1 - np.minimum(d, 1)) ** 3, 0.0) * W[None]).sum(-1)

    r = np.full(n, 2.3)
    while True:   # in along the ray, a step at a time, to the first place the sum reaches T
        go = (r > 0.05) & (at(r) < T)
        if not go.any():
            break
        r[go] -= 0.02
    lo, hi = r.copy(), r + 0.02
    for _ in range(12):
        mid = (lo + hi) / 2
        inside = at(mid) >= T
        lo, hi = np.where(inside, mid, lo), np.where(inside, hi, mid)
    p = way * lo[:, None]
    p[:, 2] = np.where(p[:, 2] < -0.66, -0.66 - (-0.66 - p[:, 2]) * 0.45, p[:, 2])   # it sits: soft and a little flat underneath
    body.data.vertices.foreach_set('co', p.ravel())
    body.data.update()
    bpy.ops.object.shade_smooth()
    return body


def material(name, color, rough=0.5, coat=0.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = tuple(color) + (1,)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = tuple(color) + (1,)
        p.inputs['Emission Strength'].default_value = emit
    return m


def eye_material():
    """Mostly pupil, wet and black; a ring of warm brown iris round it, brighter low down where the light comes
    through; a dark edge. Drawn by the distance from the eye's middle as seen from the front (object space)."""
    m = bpy.data.materials.new('eye')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.02
    p.inputs['Coat Weight'].default_value = 1.0
    p.inputs['Coat Roughness'].default_value = 0.02
    at = nt.nodes.new('ShaderNodeTexCoord')
    xyz = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(at.outputs['Object'], xyz.inputs[0])
    flat = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(xyz.outputs['X'], flat.inputs['X'])
    nt.links.new(xyz.outputs['Z'], flat.inputs['Z'])
    r = nt.nodes.new('ShaderNodeVectorMath')
    r.operation = 'LENGTH'
    nt.links.new(flat.outputs[0], r.inputs[0])
    ring = nt.nodes.new('ShaderNodeValToRGB')
    cr = ring.color_ramp
    cr.elements[0].position, cr.elements[0].color = 0.0, (0.004, 0.002, 0.002, 1)
    cr.elements[1].position, cr.elements[1].color = 1.0, (0.006, 0.002, 0.001, 1)
    for pos, c in ((0.60, (0.004, 0.002, 0.002, 1)), (0.68, (0.060, 0.019, 0.004, 1)), (0.84, (0.170, 0.058, 0.010, 1)), (0.93, (0.016, 0.005, 0.002, 1))):
        cr.elements.new(pos).color = c
    nt.links.new(r.outputs['Value'], ring.inputs[0])
    low = nt.nodes.new('ShaderNodeMapRange')
    low.inputs['From Min'].default_value, low.inputs['From Max'].default_value = 0.5, -0.9
    low.inputs['To Min'].default_value, low.inputs['To Max'].default_value = 0.5, 1.7
    nt.links.new(xyz.outputs['Z'], low.inputs['Value'])
    lit = nt.nodes.new('ShaderNodeVectorMath')
    lit.operation = 'SCALE'
    nt.links.new(ring.outputs['Color'], lit.inputs[0])
    nt.links.new(low.outputs['Result'], lit.inputs['Scale'])
    nt.links.new(lit.outputs[0], p.inputs['Base Color'])
    return m


def fur_material(color, patches):
    """Cycles' hair shader, by colour. Each strand its own shade, deeper at the root. patches: (centre, from, to,
    colour, strength): fur that turns another colour near a point (cheeks, the ears' dishes)."""
    m = bpy.data.materials.new('fur')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    hair = nt.nodes.new('ShaderNodeBsdfHairPrincipled')
    hair.parametrization = 'COLOR'
    for key, val in (('Roughness', 0.50), ('Radial Roughness', 0.70), ('Random Color', 0.30), ('Random Roughness', 0.2)):
        if key in hair.inputs:
            hair.inputs[key].default_value = val
    nt.links.new(hair.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    strand = nt.nodes.new('ShaderNodeHairInfo')
    tip = nt.nodes.new('ShaderNodeMix')
    tip.data_type = 'RGBA'
    tip.inputs[6].default_value = tuple(c * 0.50 for c in color) + (1,)
    tip.inputs[7].default_value = tuple(c * 0.86 for c in color) + (1,)   # the hair shader scatters light: it comes out lighter than it is told
    nt.links.new(strand.outputs['Intercept'], tip.inputs[0])
    shade = tip.outputs[2]
    where = nt.nodes.new('ShaderNodeNewGeometry')
    for centre, near, far, tint, much in patches:
        d = nt.nodes.new('ShaderNodeVectorMath')
        d.operation = 'DISTANCE'
        d.inputs[1].default_value = centre
        nt.links.new(where.outputs['Position'], d.inputs[0])
        r = nt.nodes.new('ShaderNodeMapRange')
        r.inputs['From Min'].default_value, r.inputs['From Max'].default_value = near, far
        r.inputs['To Min'].default_value, r.inputs['To Max'].default_value = much, 0.0
        nt.links.new(d.outputs['Value'], r.inputs['Value'])
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.inputs[7].default_value = tuple(tint) + (1,)
        nt.links.new(r.outputs['Result'], mix.inputs[0])
        nt.links.new(shade, mix.inputs[6])
        shade = mix.outputs[2]
    nt.links.new(shade, hair.inputs['Color'])
    return m


def node_group(name):
    if name not in bpy.data.node_groups:
        lib = os.path.join(bpy.utils.system_resource('DATAFILES'), 'assets', 'nodes', 'procedural_hair_node_assets.blend')
        with bpy.data.libraries.load(lib) as (src, dst):
            dst.node_groups = [name]
    return bpy.data.node_groups[name]


def groom_group(length, sweep, sag):
    """The comb. Each strand is cut to a length of its own (55 .. 100 %), then laid over: its tip is carried
    sideways by a direction that wanders slowly over the body (sweep), and down a little (sag); both grow with the
    square of the way along the strand, so the root stays put and the strand bends."""
    g = bpy.data.node_groups.new('groom', 'GeometryNodeTree')
    g.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    g.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    n, link = g.nodes, g.links.new
    src, out = n.new('NodeGroupInput'), n.new('NodeGroupOutput')
    pos, along, strand = n.new('GeometryNodeInputPosition'), n.new('GeometryNodeSplineParameter'), n.new('GeometryNodeCurveOfPoint')
    first = n.new('GeometryNodePointsOfCurve')
    link(strand.outputs['Curve Index'], first.inputs['Curve Index'])
    root = n.new('GeometryNodeFieldAtIndex')
    root.domain, root.data_type = 'POINT', 'FLOAT_VECTOR'
    link(first.outputs['Point Index'], root.inputs['Index'])
    link(pos.outputs[0], root.inputs['Value'])
    # its own length
    rnd = n.new('FunctionNodeRandomValue')
    rnd.data_type = 'FLOAT'
    for i in rnd.inputs:   # the float pair among the node's sockets of every type
        if i.enabled and i.type == 'VALUE' and i.name in ('Min', 'Max'):
            i.default_value = 0.55 if i.name == 'Min' else 1.0
    link(strand.outputs['Curve Index'], rnd.inputs['ID'])
    off = n.new('ShaderNodeVectorMath')
    off.operation = 'SUBTRACT'
    link(pos.outputs[0], off.inputs[0])
    link(root.outputs['Value'], off.inputs[1])
    cut = n.new('ShaderNodeVectorMath')
    cut.operation = 'SCALE'
    link(off.outputs[0], cut.inputs[0])
    link(next(o for o in rnd.outputs if o.enabled), cut.inputs['Scale'])
    # where the comb went: a slow noise of the root's place, as a direction
    noise = n.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 1.7
    noise.inputs['Detail'].default_value = 1.0
    link(root.outputs['Value'], noise.inputs['Vector'])
    centre = n.new('ShaderNodeVectorMath')
    centre.operation = 'SUBTRACT'
    centre.inputs[1].default_value = (0.5, 0.5, 0.5)
    link(noise.outputs['Color'], centre.inputs[0])
    swing = n.new('ShaderNodeVectorMath')
    swing.operation = 'SCALE'
    swing.inputs['Scale'].default_value = 2.0 * sweep * length
    link(centre.outputs[0], swing.inputs[0])
    lean = n.new('ShaderNodeVectorMath')
    lean.operation = 'ADD'
    lean.inputs[1].default_value = (0, 0, -sag * length)
    link(swing.outputs[0], lean.inputs[0])
    sq = n.new('ShaderNodeMath')
    sq.operation = 'MULTIPLY'
    link(along.outputs['Factor'], sq.inputs[0])
    link(along.outputs['Factor'], sq.inputs[1])
    bend = n.new('ShaderNodeVectorMath')
    bend.operation = 'SCALE'
    link(lean.outputs[0], bend.inputs[0])
    link(sq.outputs[0], bend.inputs['Scale'])
    both = n.new('ShaderNodeVectorMath')
    both.operation = 'ADD'
    link(cut.outputs[0], both.inputs[0])
    link(bend.outputs[0], both.inputs[1])
    place = n.new('ShaderNodeVectorMath')
    place.operation = 'ADD'
    link(root.outputs['Value'], place.inputs[0])
    link(both.outputs[0], place.inputs[1])
    move = n.new('GeometryNodeSetPosition')
    link(src.outputs[0], move.inputs['Geometry'])
    link(place.outputs[0], move.inputs['Position'])
    link(move.outputs[0], out.inputs[0])
    return g


def fur(obj, length, mat, mask=None, locks=0.5, sweep=0.5, sag=0.25, thick=0.0020, lock_size=None):
    """Quick Fur (hair curves, interpolated, noise and frizz), then gathered into locks and combed."""
    before = set(bpy.data.objects)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.quick_fur(density=opt('--fur', 'HIGH'), length=length, radius=thick * (1.5 if opt('--fur') == 'MEDIUM' else 1), view_percentage=0.01, apply_hair_guides=True, use_noise=True, use_frizz=True)   # MEDIUM: fewer, thicker strands, for frames shown small
    hair = (set(bpy.data.objects) - before).pop()
    hair.data.materials.clear()
    hair.data.materials.append(mat)
    for m in list(hair.modifiers):
        if m.name == 'Hair Dynamics':
            hair.modifiers.remove(m)
    if mask:
        where = hair.modifiers['Interpolate Hair Curves'].properties.inputs.Input_14   # "Density Mask"
        where.type, where.attribute_name = 'ATTRIBUTE', mask
    if locks:
        m = hair.modifiers.new('clump', 'NODES')
        m.node_group = node_group('Clump Hair Curves')
        ins = m.properties.inputs
        ins.Input_7.value, ins.Input_6.value, ins.Input_9.value, ins.Input_8.value, ins.Input_10.value = locks, 0.5, lock_size or max(0.035, length * 0.75), False, length * 0.08
        names = [x.name for x in hair.modifiers]
        hair.modifiers.move(len(names) - 1, names.index('Interpolate Hair Curves') + 1)
    hair.modifiers.new('groom', 'NODES').node_group = groom_group(length, sweep, sag)
    # While the scene is being put together nothing needs the fur grown; only the render does. Left on, every later
    # step (each paw, each accent) waited for all the fur made so far to be grown again in full: four minutes a frame.
    for m in hair.modifiers:
        m.show_viewport = False
    return hair


def sphere(name, radius, loc, scale=(1, 1, 1), mat=None, seg=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.shade_smooth()
    if mat:
        o.data.materials.append(mat)
    return o


def cap(obj, height, tilt, keep_above=True):
    """Keep the part of a unit sphere above (or below) a plane at this height, the plane tipped forward by tilt
    (degrees): seen from the front its edge is then an arc, as a lid's is."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    t = math.radians(tilt)
    no = Vector((0, -math.sin(t), math.cos(t)))
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=no * height, plane_no=no, clear_inner=keep_above, clear_outer=not keep_above)
    bm.to_mesh(obj.data)
    bm.free()


def arc(radius, thick, loc, mat, squash=0.6):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=thick, major_segments=40, minor_segments=10, location=loc, rotation=(math.radians(90), 0, 0))
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


# --- the grin (koro's close-up, the "iced-out grillz" meme): a wide smile, its corners turned up, and in it a grill
# as the meme's: two rows of small rounded teeth fitted close, each covered all over in tiny diamonds (micro pave).
# The diamonds are a picture (pave_image), laid on the smooth teeth, not geometry: modelled stones at this size were
# chrome blocks and black mirror facets. The teeth's shape, their curve along the jaw and the light on them are 3D.
GRIN_W = 0.45   # its half width: cheek to cheek


def grin_edges(x, ez):
    """(top, bottom) of the grin's opening at x: a crescent, its two edges both turned up towards the corners
    (the teeth follow it in two rows), its ends round."""
    u = min(1.0, abs(x) / GRIN_W)
    top = ez - 0.25 + 0.075 * u * u + 0.03 * max(-1.0, min(1.0, x / GRIN_W))   # a smirk: its right corner a little higher
    return top, top - 0.205 * (1 - 0.45 * u * u) * math.sqrt(1 - u ** 8)


def in_grin(x, z, ez, pad=0.0):
    if abs(x) >= GRIN_W + pad:
        return False
    top, bot = grin_edges(max(-GRIN_W, min(GRIN_W, x)), ez)
    return bot - pad < z < top + pad


def surface(x, z, vols):
    """The body's surface at x, z seen from the front, found exactly (a bisection), so the normals are smooth."""
    lo, hi = -1.8, 0.0
    for _ in range(28):
        mid = (lo + hi) / 2
        if field(Vector((x, mid, z)), vols) >= T:
            hi = mid
        else:
            lo = mid
    return Vector((x, hi, z))


PAVE_STONES = 26     # across the picture (a tile: it repeats); 15 double rows down make the hexagons all but exact
PAVE_TILE = 0.26     # the picture's width on a tooth: a stone is 0.01 across, nine or so to a front tooth


def pave_image(n=1024):
    """Micro pave as a picture (RGB, and the height in alpha): round brilliant stones packed in hexagons, each cut
    into a table and sixteen crown facets lit each its own way (white to a cool grey, never black), a thin dark
    girdle round each, bright silver metal and beads between them."""
    pitch, rows = n / PAVE_STONES, n / 15 / 2
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float64) + 0.5
    best = None
    for ox, oy, lat in ((0.0, 0.0, 0), (pitch / 2, rows, 1)):   # a hexagon lattice: two rectangular ones, one offset
        i, j = np.round((xs - ox) / pitch), np.round((ys - oy) / (2 * rows))
        dx, dy = xs - ox - i * pitch, ys - oy - j * 2 * rows
        d = np.hypot(dx, dy)
        cand = (d, dx, dy, (i % PAVE_STONES) * 131 + (j % 15) * 977 + lat * 50021)
        if best is None:
            best = cand
        else:
            near = cand[0] < best[0]
            best = tuple(np.where(near, c, b_) for c, b_ in zip(cand, best))
    d, dx, dy, sid = best
    rnd = lambda k: np.modf(np.sin(sid * 12.9898 + k * 78.233) * 43758.5453)[0] % 1.0   # a stone's own random numbers
    R = pitch * 0.46
    r = d / R
    ang = (np.arctan2(dy, dx) + rnd(1) * 6.283) % 6.283
    sector = np.floor(ang / (6.283 / 16))
    facet = 0.5 + 0.5 * np.sin(sector * 2.39996 + rnd(2) * 40 + (r > 0.72) * 1.7)    # each facet its own light
    fire = rnd(3)
    stone = np.where(r < 0.42, 0.78 + 0.22 * rnd(4), 0.46 + 0.54 * facet)            # the table, the crown facets
    stone = np.clip(stone * (0.80 + 0.32 * fire), 0, 1)
    glint = (fire > 0.86) & (np.hypot(dx + R * 0.25, dy + R * 0.25) < R * 0.16)       # a few stones caught by the light
    stone = np.where(glint, 1.0, stone)
    metal = 0.80 + 0.12 * np.clip((d - R) / (pitch * 0.12), 0, 1)                      # silver, brightest at the beads
    v = np.where(r < 0.93, stone, np.where(r < 1.0, 0.30, metal))                      # the girdle: a thin dark line
    rgb = np.stack([v * 0.97, v * 0.985, v * 1.0], -1)
    rgb[..., 2] = np.where((r < 0.93) & (fire > 0.93), np.minimum(1, v * 1.08), rgb[..., 2])   # a little cold fire
    h = np.where(r < 1.0, 0.35 + 0.65 * np.sqrt(np.clip(1 - r * r, 0, 1)), 0.25)
    img = bpy.data.images.new('pave', n, n, alpha=True)
    img.alpha_mode = 'CHANNEL_PACKED'
    px = np.concatenate([rgb, h[..., None]], -1)[::-1].astype(np.float32)   # Blender's rows go bottom up
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


def pave_material():
    """The grill's surface: the pave picture as colour (and a little light of its own, so it stays white, never a
    mirror of the dark room), its stones' domes as a bump; a clear coat gives the smooth tooth its gloss."""
    m = bpy.data.materials.get('pave')
    if m:
        return m
    m = bpy.data.materials.new('pave')
    m.use_nodes = True
    nt = m.node_tree
    pb = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image, tex.interpolation = pave_image(), 'Cubic'
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value, bump.inputs['Distance'].default_value = 0.45, 0.003
    nt.links.new(tex.outputs['Alpha'], bump.inputs['Height'])
    nt.links.new(tex.outputs['Color'], pb.inputs['Base Color'])
    nt.links.new(tex.outputs['Color'], pb.inputs['Emission Color'])
    nt.links.new(bump.outputs['Normal'], pb.inputs['Normal'])
    pb.inputs['Emission Strength'].default_value = 0.32
    pb.inputs['Metallic'].default_value, pb.inputs['Roughness'].default_value = 0.35, 0.30
    pb.inputs['Coat Weight'].default_value, pb.inputs['Coat Roughness'].default_value = 1.0, 0.05
    return m


def faceted(name, verts, faces, mat):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(mat)
    return o


def grillz(surf, ez):
    def normal(x, z, d=0.03):
        tx, tz = surf(x + d, z) - surf(x - d, z), surf(x, z + d) - surf(x, z - d)
        return tx.cross(tz).normalized()   # out of the face, towards the camera

    # the opening: a dark lining laid on the face inside the outline, just proud of it (the teeth stand on it)
    hole = material('grin_in', (0.05, 0.010, 0.012), rough=0.9)
    nx, nz, vs, fs = 40, 14, [], []
    for i in range(nx + 1):
        x = -GRIN_W + 2 * GRIN_W * i / nx
        top, bot = grin_edges(x, ez)
        for j in range(nz + 1):
            z = bot + (top - bot) * j / nz
            vs.append(surf(x, z) + normal(x, z) * 0.006)
    for i in range(nx):
        for j in range(nz):
            a = i * (nz + 1) + j
            fs.append((a, a + nz + 1, a + nz + 2, a + 1))
    for poly in faceted('grin_in', vs, fs, hole).data.polygons:
        poly.use_smooth = True

    m = pave_material()

    def tooth(x, z_top, z_bot, w, upper, seed, square=0.5, fang=False, ahead=0.0):
        """A small rounded tooth: x its middle, z_top / z_bot its edges, w its width; soft corners (square: 0.5 a
        soft square, towards 1 rounder), a domed front, narrower at the biting edge (as a tooth is), on the face's
        curve. A fang narrows to a rounded point: koro's own two, as the creature has them, only iced."""
        h, mid = z_top - z_bot, (z_top + z_bot) / 2
        at, n = surf(x, mid), normal(x, mid)
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=20, radius=1.0)
        uvl = bm.loops.layers.uv.new('UVMap')
        for v in bm.verts:
            px_, py_, pz_ = v.co
            sx, sz = math.copysign(abs(px_) ** square, px_), math.copysign(abs(pz_) ** square, pz_)
            edge = max(0.0, -sz if upper else sz)                                                 # towards the biting edge
            narrow = 0.90 * edge ** 1.15 if fang else 0.08 * edge
            v.co = Vector((sx * w / 2 * (1 - narrow), py_ * 0.024 * (1 - 0.35 * narrow), sz * h / 2))
        for f_ in bm.faces:
            for lo_ in f_.loops:
                lo_[uvl].uv = (lo_.vert.co.x / PAVE_TILE + seed * 0.37, lo_.vert.co.z / PAVE_TILE + seed * 0.21)
        me = bpy.data.meshes.new('tooth')
        bm.to_mesh(me)
        bm.free()
        for poly in me.polygons:
            poly.use_smooth = True
        o = bpy.data.objects.new('tooth', me)
        bpy.context.scene.collection.objects.link(o)
        o.data.materials.append(m)
        o.location, o.rotation_mode, o.rotation_quaternion = at + n * (0.014 + ahead), 'QUATERNION', n.to_track_quat('-Y', 'Z')

    # the upper row hangs from the upper edge, fitted close, not all alike: the two front teeth biggest, then one
    # each side, then the fangs (pointed, longer than the rest, a little ahead of them), small round ones at the
    # corners. The lower row, smaller and rounder, stands between the fangs right under the upper one.
    gap = 0.005
    upper = ((0.82, 0.92, 0.72, False), (0.95, 1.50, 0.5, True), (0.95, 0.94, 0.55, False), (1.12, 1.0, 0.5, False))   # (width, height, roundness, fang): corner to middle
    upper = upper + upper[::-1]
    unit = (0.80 - gap * (len(upper) - 1)) / sum(u[0] for u in upper)
    x = -0.40
    for k, (wf, hf, sq_, fang) in enumerate(upper):
        w = wf * unit
        x += w / 2
        top, bot = grin_edges(x, ez)
        hu = min((top - bot) * 0.54 - 0.008, 0.12)
        tooth(x, top - 0.004, top - 0.004 - hu * hf, w, True, k, sq_, fang, 0.008 if fang else 0.0)
        x += w / 2 + gap
    for k in range(5):
        x = (k - 2) * 0.085
        top, bot = grin_edges(x, ez)
        hu = min((top - bot) * 0.54 - 0.008, 0.12)
        zt = top - 0.004 - hu - 0.008
        tooth(x, zt, zt - (top - bot) * 0.40, 0.080, False, 10 + k, 0.6)


def build(expr):   # of KIND
    e = EXPRESSIONS[expr]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    col = e['col']
    skin = material('skin', [c * 0.62 for c in col], rough=0.9)
    DL = LAYER == 'drink'   # only the drink is wanted: the paws that hold it are built to hide what they cover, nothing else is
    body = None if DL else sculpt(e)
    if body:
        body.data.materials.append(skin)
    vols = volumes(e)

    def front(x, z):
        """The body's surface at x, z, seen from the camera."""
        y = -1.6
        while y < 0 and field(Vector((x, y, z)), vols) < T:
            y += 0.004
        return Vector((x, y, z))

    ez = eye_at(e, 1).z
    blush = [front(s * (0.66 + 0.08 * e['lie']), ez - 0.27) for s in (-1, 1)]
    k, cream, patches = KINDS[KIND], (1.0, 0.98, 0.96), []
    if KIND == 'mizi':    # a white muzzle and chest
        patches += [(front(0.0, ez - 0.27), 0.19, 0.33, cream, 1.0), (front(0.0, -0.58), 0.26, 0.46, cream, 1.0)]
    if KIND == 'aksi':    # a pale belly
        patches += [(front(0.0, -0.52), 0.22, 0.50, tuple(c + (1 - c) * 0.72 for c in col), 1.0)]
    # the accents: patches of fur of their own colour, each sunk into the coat, which leaves room for it (a colour
    # mixed into the coat itself goes muddy). (centre, half-sizes, colour, fur length)
    # a blush has to be told from the fur it is on: on red a deeper red (a paler one reads as a grey spot), on yellow and orange warm (a cool pink goes lilac there)
    rosy = (0.80, 0.015, 0.09) if col is RED and k['cheek'] == PINK else (1.0, 0.20, 0.10) if col in (YELLOW, ORANGE) and k['cheek'] == PINK else k['cheek']
    accents = [(b + Vector((0, 0.085, 0)), (0.105, 0.05, 0.078), rosy, 0.085) for b in blush]   # small: a blush, not a patch
    if 'ear' in k and KIND in EARS:
        size, back = {'lacis': ((0.150, 0.045, 0.150), 0.085), 'pele': ((0.165, 0.045, 0.165), 0.060), 'mizi': ((0.085, 0.045, 0.115), 0.075)}[KIND]
        accents += [(ear_at(e, s) + Vector((0, -back, 0.02)), size, k['ear'], 0.050) for s in (-1, 1)]
    furm = fur_material(col, patches)
    eyes = [eye_at(e, s) for s in (-1, 1)]

    if not DL:
        # --- the coats: by where on the body. Nothing grows inside the eye sockets.
        long, short = body.vertex_groups.new(name='long'), body.vertex_groups.new(name='short')
        mid = front(0, ez - 0.06)
        for v in body.data.vertices:
            p = v.co
            face = 0.0 if p.y > -0.2 else 1 - min(1.0, max(0.0, (math.hypot(p.x - mid.x, p.z - mid.z) - 0.50) / 0.20))
            ear = 1 - min(1.0, max(0.0, (min((p - ear_at(e, s)).length for s in (-1, 1)) - 0.24) / 0.10)) if KIND in EARS else 0.0
            paw = 1 - min(1.0, max(0.0, (min((p - q - Vector((0, -0.06, 0))).length for q in paws_at(e)) - 0.20) / 0.10))
            fine = max(face, ear, paw)
            room = min([1.0] + [max(0.0, (math.hypot(p.x - c.x, p.z - c.z) - sz[0] * 0.52) / 0.07) for c, sz, _, _ in accents if p.y < c.y + 0.10])   # an accent's own fur grows here
            if e['mouth'] == 'grin' and p.y < 0 and in_grin(p.x, p.z, ez, 0.012):   # the grin's opening: bare
                long.add([v.index], 0.0, 'REPLACE')
                short.add([v.index], 0.0, 'REPLACE')
                continue
            if e['lid'] < 0.98 and p.y < 0 and min(math.hypot(p.x - c.x, p.z - c.z) for c in eyes) < ER * 0.98:
                long.add([v.index], 0.0, 'REPLACE')
                short.add([v.index], 0.0, 'REPLACE')
            else:
                long.add([v.index], (1 - fine) * room, 'REPLACE')
                short.add([v.index], fine * room, 'REPLACE')
        if not CLAY:
            fur(body, 0.165, furm, 'long', locks=0.80, sweep=0.55, sag=0.30, lock_size=0.17)
            fur(body, 0.075, furm, 'short', locks=0.50, sweep=0.45, sag=0.10)

    def fuzzy(name, loc, scale, length, mat, turn=0.0, shape=None, locks=0.30, under=None):
        """A furry part of its own (a cheek's blush, a long ear, a gill): a sphere, its scale baked in, reshaped, turned."""
        o = sphere(name, 1.0, loc, scale, under or skin, 48, 24)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if shape:
            for v in o.data.vertices:
                v.co = shape(*v.co)
            o.data.update()
        o.rotation_euler[1] = turn
        if not CLAY:
            fur(o, length, mat, locks=locks, sweep=0.4, sag=0.15)
        return o

    def top(x, sink=0.0):
        """The top of the head above x."""
        z = 1.7
        while z > 0 and field(Vector((x, 0.0, z)), vols) < T:
            z -= 0.004
        return Vector((x, 0.0, z - sink))

    # the paws: small furry things of their own, so they read as paws and can take hold of something
    for at in paws_at(e):
        def toes(x, y, z, w=0.17 if KIND == 'astonis' else 0.185):   # three toes along the paw's upper front edge
            lobe = math.cos(x / w * 1.5 * math.pi) ** 2 * max(0.0, 1 - abs(x) / (w * 1.05))
            up = max(0.0, z + 0.02) / 0.155 if y < 0.03 else 0.0
            return x, y - 0.045 * lobe * up, z + 0.085 * lobe * up
        fuzzy('paw', at, (0.19, 0.17, 0.15) if KIND == 'astonis' else (0.185, 0.16, 0.135), 0.060, furm, shape=toes, locks=0.10)
        if e.get('arms'):   # a short arm from the shoulder to the paw: the paw reaches because the arm does
            sh = Vector((math.copysign(0.78, at.x), -0.66, -0.30))
            arm = fuzzy('arm', (sh + at) / 2, (0.125, 0.125, (at - sh).length / 2 + 0.04), 0.085, furm, locks=0.12)
            arm.rotation_euler = (at - sh).to_track_quat('Z', 'Y').to_euler()
    if e.get('meme'):   # the dance body's parts, made upright at the origin; the frame loop places them
        pear = lambda x, y, z: (x * (1.0 - 0.10 * z), y * (1.0 - 0.06 * z), z)   # wider low down, as the rat's belly
        fuzzy('belly', (0, 0, 0), MEME_PARTS['belly'], 0.12, furm, shape=pear, locks=0.22)   # soft, as the head's fur: big locks read as scales
        fuzzy('chest', (0, 0, 0), MEME_PARTS['chest'], 0.12, furm, locks=0.22)
        for side in ('L', 'R'):
            for part in ('uarm', 'farm', 'thigh', 'shin', 'mfoot'):
                fuzzy(part, (0, 0, 0), MEME_PARTS[part], 0.075 if part != 'mfoot' else 0.06, furm, locks=0.12)
    if e.get('footL'):   # short furry legs from its hips to its feet (the mocap dance stands on them)
        for side in ('L', 'R'):
            hip, ft = Vector(LEGS_HIP[side]), Vector(e['foot' + side])
            if not e.get('nolegs'):
                leg = fuzzy('leg', (hip + ft) / 2, (0.15, 0.15, (ft - hip).length / 2 + 0.05), 0.085, furm, locks=0.12)
                leg.rotation_euler = (ft - hip).to_track_quat('Z', 'Y').to_euler()
            fuzzy('foot', ft, (0.17, 0.21, 0.10), 0.060, furm, locks=0.10)   # a small foot tucked under the round body

    def tint(c):
        """An accent colour as (the skin under it, its fur)."""
        return material('accent', [v * 0.6 for v in c], rough=0.9), fur_material(c, [])

    for at, size, c, length in ([] if DL else accents):
        under, hairs = tint(c)
        fuzzy('accent', at, size, length, hairs, locks=0.0, under=under)

    # --- what makes the kind
    relax, kind = e['ears'], None if DL else KIND
    if kind == 'lumo':
        half, bow = 0.60, math.radians(150 + 55 * relax)
        for s in (-1, 1):
            def arch(x, y, z, s=s, r=2 * half / bow):   # one long soft shape bent up, out and over, its end the heavier
                h = (z + half) / (2 * half)
                fat = 0.80 + 0.60 * h
                d = r - s * x * fat
                return s * (r - d * math.cos(h * bow)), y * fat, d * math.sin(h * bow)
            fuzzy('ear', top(s * 0.30, 0.16), (0.125, 0.10, half), 0.11, furm, s * math.radians(4 + 20 * relax), arch)
    if kind == 'pele':   # a mouse: two large round ears standing on its head, pink inside
        under, hairs = tint(k['ear'])
        for s in (-1, 1):
            t = s * math.radians(20 + 46 * relax)
            mid = top(s * 0.50, 0.12) + Vector((math.sin(t), 0, math.cos(t))) * 0.30
            fuzzy('ear', mid, (0.30, 0.09, 0.30), 0.06, furm, t)
            fuzzy('inner', mid + Vector((0, -0.075, 0)), (0.20, 0.03, 0.20), 0.04, hairs, t, locks=0.0, under=under)
    if kind == 'zakis':
        under, hairs = tint(k['ear'])
        for s in (-1, 1):
            t = s * math.radians(8 + 80 * relax)   # asleep they lie out to the sides, still to be seen
            way, root = Vector((math.sin(t), 0, math.cos(t))), top(s * (0.30 + 0.20 * relax), 0.14)
            fuzzy('ear', root + way * 0.34, (0.14, 0.10, 0.38), 0.10, furm, t)
            fuzzy('inner', root + way * 0.36 + Vector((0, -0.105, 0)), (0.075, 0.035, 0.27), 0.045, hairs, t, locks=0.0, under=under)
    if kind == 'antenas':
        under, hairs = tint(k['bob'])
        for s in (-1, 1):
            t = s * math.radians(14 + 46 * relax)
            way, base = Vector((math.sin(t), 0, math.cos(t))), top(s * 0.34, 0.06)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.56, location=base + way * 0.28, rotation=(0, t, 0))
            bpy.context.object.data.materials.append(skin)
            fuzzy('bob', base + way * 0.60, (0.125, 0.125, 0.125), 0.07, hairs, locks=0.2, under=under)
    if kind == 'asns':
        under, hairs = tint(k['leaf'])
        for s in (-1, 1):
            t = s * math.radians(34 + 68 * relax)

            def blade(x, y, z):   # a leaf: widest low down, a point at its end
                u = z / 0.46
                return x * (1 - 0.72 * max(0.0, u) ** 1.4) * (1 + 0.25 * min(0.0, u)), y, z
            fuzzy('leaf', top(s * 0.10, 0.10) + Vector((math.sin(t), 0, math.cos(t))) * 0.44, (0.30, 0.06, 0.46), 0.05, hairs, t, blade, locks=0.15, under=under)
    if kind == 'koro':
        horn = material('horn', (0.80, 0.68, 0.46), rough=0.42)
        for s in (-1, 1):
            cu = bpy.data.curves.new('horn', 'CURVE')
            cu.dimensions, cu.bevel_depth, cu.bevel_resolution, cu.use_fill_caps = '3D', 1.0, 8, True
            sp = cu.splines.new('NURBS')
            n, at = 7, top(s * 0.60, 0.14)
            sp.points.add(n - 1)
            for i in range(n):
                t = i / (n - 1)
                sp.points[i].co = (at.x, at.y, at.z, 1)
                sp.points[i].radius = 0.135 * (1 - t) ** 0.85 + 0.014
                lean = s * math.radians(54 - 96 * t)   # out at the root, in at the tip
                at = at + Vector((math.sin(lean), 0, math.cos(lean))) * (0.62 / (n - 1))
            sp.use_endpoint_u, sp.order_u = True, 4
            o = bpy.data.objects.new('horn', cu)
            scene.collection.objects.link(o)
            o.data.materials.append(horn)
    if kind == 'aksi':
        under, deep = tint(k['gill'])
        for s in (-1, 1):
            for up, high in ((52, 0.30), (16, 0.10), (-18, -0.10)):
                t = s * math.radians(90 - up + 26 * relax)
                root = Vector((s * (0.93 + 0.08 * e['lie']), 0.06, high - 0.24 * e['lie']))
                fuzzy('gill', root + Vector((math.sin(t), 0, math.cos(t))) * 0.16, (0.075, 0.07, 0.20), 0.070, deep, t, under=under, shape=
                      lambda x, y, z: (x * (1 - 0.45 * max(0.0, z / 0.20)), y, z))

    if not DL:
        # --- the eyes: an eyeball in its socket, an upper lid over it and a lower one under it
        black, lidm = eye_material(), material('lid', [c * 0.58 for c in col], rough=1.0)   # a smooth soft lid, like felt: fur on it reads as lashes
        lidm.node_tree.nodes['Principled BSDF'].inputs['Sheen Weight'].default_value = 0.1
        dark = material('line', [c * 0.16 + 0.012 for c in col], rough=0.8)   # the lines of a shut eye and a smile: the fur's own colour, deep
        white = material('glint', (1, 1, 1), rough=0.2, emit=1.4)
        for s, at in zip((-1, 1), eyes):
            if e['lid'] >= 0.98:
                arc(ER * 0.66, 0.027, front(at.x, at.z - ER * 0.10) + Vector((0, -0.080, 0)), dark, 0.62)
                continue
            if e['lid'] < 0.98:
                sphere('eye', 1.0, at, (ER, ER, ER), black, 64, 32)
                sphere('glint', ER * 0.15, at + Vector((-ER * 0.30, -ER * 0.90, ER * 0.34)), (1, 0.4, 1), white, 16, 8)
                sphere('glint2', ER * 0.065, at + Vector((ER * 0.34, -ER * 0.86, -ER * 0.30)), (1, 0.4, 1), white, 16, 8)
            up = sphere('lid', 1.0, at, (ER * 1.035,) * 3, lidm, 64, 32)
            cap(up, 0.80 - 1.72 * e['lid'], -(30 - 26 * e['lid']))
            if e['under']:
                dn = sphere('lid2', 1.0, at, (ER * 1.03,) * 3, lidm, 64, 32)
                cap(dn, -(0.92 - 1.0 * e['under']), 26, keep_above=False)
            for o in ([up] + ([dn] if e['under'] else [])):
                bpy.context.view_layer.objects.active = o
                o.select_set(True)
                bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

        # --- the mouth: small, close under the eyes
        mouth = front(0.0, ez - 0.25)
        pink, tooth = material('tongue', (1.0, 0.34, 0.42), rough=0.5), material('tooth', (0.95, 0.93, 0.88), rough=0.4)
        inside = material('mouth', (0.16, 0.02, 0.035), rough=1.0)
        if KIND == 'pele':
            sphere('nose', 1.0, mouth + Vector((0, -0.075, 0.085)), (0.046, 0.034, 0.036), pink, 24, 12)
        if e['mouth'] == 'sip':     # lips round a straw
            sphere('lips', 1.0, mouth + Vector((0, -0.062, 0.0)), (0.042, 0.030, 0.036), pink, 24, 12)
        elif e['mouth'] == 'smile':
            for s in (-1, 1):   # two small arcs meeting in the middle: a cat's smile
                arc(0.060, 0.021, mouth + Vector((s * 0.060, -0.090, 0.03)), dark, 0.6)
        elif e['mouth'] == 'grin':   # the meme's grin: wide, cheek to cheek, two rows of iced-out grillz
            grillz(lambda x, z: surface(x, z, vols), ez)
        else:
            w, h = {'open': (0.115, 0.095), 'yawn': (0.088, 0.112)}[e['mouth']]
            low = Vector((0, 0, -0.045 if e['mouth'] == 'yawn' else 0))   # a yawn opens downwards, clear of the eyes
            m = sphere('mouth', 1.0, mouth + low + Vector((0, -0.05, -0.01)), (w, 0.05, h), inside, 32, 16)
            if e['mouth'] == 'open':
                cap(m, 0.25, 0, keep_above=False)
            if True:
                sphere('tongue', 1.0, mouth + low + Vector((0, -0.072, -0.01 - h * 0.52)), (w * 0.58, 0.035, h * 0.30), pink, 24, 12)

    held_back = set(bpy.data.objects)
    if e.get('can') and LAYER != 'body':
        # The drink: the app's own drink (scripts/blender/drinks: its icon, cut out, and drinks.json), as the thing one
        # holds. A can (a cylinder with a narrower shoulder, a lid and a foot), a paper cup with a lid, or an open cup
        # of coffee, as wide for its height as the icon is; and it wears the icon: the picture is laid on it from
        # the front, so it is the same drink the person chose in the menu. The two coffee machines give a cup in
        # the machine's colours.
        x, y, z, lean = e['can'][:4]
        back = e['can'][4] if len(e['can']) > 4 else 0
        info = DRINK_INFO[DRINK_IS]
        shape, h, r = info['shape'], info['h'], info['w'] / 2
        z += (h - CAN_H) / 2   # the keys are written for the tallest can: a shorter drink stands on the same floor
        parts = []

        def piece(kind_, ra, rb, depth, along):
            if kind_ == 'cyl':
                bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=ra, depth=depth, location=(0, 0, along))
            else:
                bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=ra, radius2=rb, depth=depth, location=(0, 0, along))
            parts.append(bpy.context.object)

        if shape == 'can':
            piece('cyl', r, r, h - 0.11, -0.005)
            piece('cone', r, r * 0.80, 0.05, h / 2 - 0.035)
            piece('cyl', r * 0.83, r * 0.83, 0.016, h / 2 - 0.008)
            piece('cone', r * 0.86, r, 0.035, -h / 2 + 0.0175)
        else:
            piece('cone', r * 0.74, r * 0.94, h * (0.84 if shape == 'cup' or info.get('lid') else 1.0), -h * (0.08 if shape == 'cup' or info.get('lid') else 0.0))
            if shape == 'cup' or info.get('lid'):
                piece('cyl', r, r, h * 0.10, h * 0.39)
                piece('cyl', r * 0.80, r * 0.80, h * 0.06, h * 0.47)
            else:   # an open cup: the coffee shows
                piece('cyl', r * 0.86, r * 0.86, 0.012, h / 2 - 0.004)
        bpy.ops.object.select_all(action='DESELECT')
        for o in parts:
            o.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        cupo = bpy.context.object
        bpy.ops.object.shade_auto_smooth() if hasattr(bpy.ops.object, 'shade_auto_smooth') else bpy.ops.object.shade_smooth()
        m = bpy.data.materials.new('drink')
        m.use_nodes = True
        nt = m.node_tree
        pb = nt.nodes['Principled BSDF']
        pb.inputs['Roughness'].default_value = 0.34 if shape == 'can' else 0.75
        pb.inputs['Metallic'].default_value = 0.30 if shape == 'can' else 0.0
        at = nt.nodes.new('ShaderNodeTexCoord')
        xyz = nt.nodes.new('ShaderNodeSeparateXYZ')
        nt.links.new(at.outputs['Object'], xyz.inputs[0])
        if shape == 'plain':   # no picture: the cup, a band round it, the lid or the coffee on top, by height
            ramp = nt.nodes.new('ShaderNodeValToRGB')
            ramp.color_ramp.interpolation = 'CONSTANT'
            cup_c, band_c, lid_c = info['cup'], info['band'], info.get('lid') or [0.10, 0.045, 0.02]
            stops = ((0.0, cup_c), (0.34, band_c), (0.56, cup_c), (0.86 if info.get('lid') else 0.985, lid_c))
            ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = stops[0][0], tuple(stops[0][1]) + (1,)
            ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = stops[1][0], tuple(stops[1][1]) + (1,)
            for pos, c in stops[2:]:
                ramp.color_ramp.elements.new(pos).color = tuple(c) + (1,)
            up01 = nt.nodes.new('ShaderNodeMapRange')
            up01.inputs['From Min'].default_value, up01.inputs['From Max'].default_value = -h / 2, h / 2
            nt.links.new(xyz.outputs['Z'], up01.inputs['Value'])
            nt.links.new(up01.outputs['Result'], ramp.inputs[0])
            nt.links.new(ramp.outputs['Color'], pb.inputs['Base Color'])
        else:   # the icon, seen from the front: across the drink's width, up its height
            uv = nt.nodes.new('ShaderNodeCombineXYZ')
            for axis, half, sock in (('X', r, 'X'), ('Z', h / 2, 'Y')):
                to01 = nt.nodes.new('ShaderNodeMapRange')
                to01.inputs['From Min'].default_value, to01.inputs['From Max'].default_value = -half, half
                nt.links.new(xyz.outputs[axis], to01.inputs['Value'])
                nt.links.new(to01.outputs['Result'], uv.inputs[sock])
            pic = nt.nodes.new('ShaderNodeTexImage')
            pic.image = bpy.data.images.load(os.path.join(DRINKS_DIR, DRINK_IS + '.png'))
            pic.interpolation, pic.extension = 'Closest' if pic.image.size[0] < 100 else 'Linear', 'EXTEND'
            nt.links.new(uv.outputs[0], pic.inputs['Vector'])
            mix = nt.nodes.new('ShaderNodeMix')   # where the picture has a hole (its corners), the drink's own colour
            mix.data_type = 'RGBA'
            mix.inputs[6].default_value = tuple(info['fill']) + (1,)
            nt.links.new(pic.outputs['Alpha'], mix.inputs[0])
            nt.links.new(pic.outputs['Color'], mix.inputs[7])
            nt.links.new(mix.outputs[2], pb.inputs['Base Color'])
        cupo.data.materials.clear()
        cupo.data.materials.append(m)
        cupo.location, cupo.rotation_euler = Vector((x, y, z)), (math.radians(-back), math.radians(lean), 0)

    if DL:   # what is in front of the drink (a paw, an arm) cuts its shape out of the drink's picture
        for o in held_back:
            o.is_holdout = True

    if KIND == 'koro' and not DL and e['mouth'] not in ('yawn', 'sip', 'grin'):   # two tiny fangs peeping out under the smile (the grin has its grillz)
        for s in (-1, 1):
            sphere('fang', 1.0, mouth + Vector((s * 0.085, -0.090, -0.035)), (0.020, 0.018, 0.034), tooth, 16, 8)

    # --- three lights: a large key from the upper left, a gentle fill from the right, a rim from behind; little
    # ambient light, so the form shows
    def area(loc, energy, size, color=(1, 1, 1)):
        bpy.ops.object.light_add(type='AREA', location=loc)
        l = bpy.context.object
        l.data.energy, l.data.size, l.data.color = energy, size, color
        l.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

    area((-3.4, -4.8, 4.0), 1150, 5.0, (1.0, 0.98, 0.95))
    area((4.6, -3.4, 0.8), 80, 6.0, (0.95, 0.97, 1.0))
    area((1.4, 4.4, 3.4), 190, 3.0)
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.5, 0.5, 0.5, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.09
    scene.world = world

    rise = RISE.get(KIND, 0.0)   # the same for every state: the five pictures are cropped by one box
    bpy.ops.object.camera_add(location=(0, -9, 1.0 + rise))
    cam = bpy.context.object
    cam.data.type, cam.data.ortho_scale = 'ORTHO', 2.9
    cam.rotation_euler = (Vector((0, 0, 0.10 + rise)) - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    cam.rotation_euler.rotate_axis('Z', math.radians(e['tilt']))   # the head leans: the whole small creature does
    if SCENE in ('dance', 'mocap'):   # room for the arms out wide and the jumps; the creature hops and sways in a frame that stays
        cam.data.ortho_scale = 4.8
        cam.location.x -= e.get('sway', 0.0)
        cam.location.z += 0.35 - e.get('hop', 0.0)
    scene.camera = cam

    scene.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = 'GPU'
    except Exception as err:
        print('rg_master: GPU not used:', err)
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = SIZE
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    return scene


os.makedirs(OUT, exist_ok=True)
if SCENE == 'drink':
    EXPRESSIONS = {'f%02d' % i: pose_at(i / FPS) for i in range(int(round(KEYS[-1][0] * FPS)) + 1)}
if SCENE == 'round':
    MOVES = json.load(open(opt('--moves')))['frames']
    EXPRESSIONS = {'r%03d' % i: round_at(f) for i, f in enumerate(MOVES)}
if SCENE == 'meme':
    MOVES = json.load(open(opt('--moves')))['frames']
    EXPRESSIONS = {'x%03d' % i: meme_at(f) for i, f in enumerate(MOVES)}
if SCENE == 'mocap':
    MOVES = json.load(open(opt('--moves')))['frames']
    EXPRESSIONS = {'m%03d' % i: mocap_at(f) for i, f in enumerate(MOVES)}
if SCENE == 'dance':   # the last key is the first again: it is left out, the loop shows the first frame after it
    EXPRESSIONS = {'d%03d' % i: dance_at(i / FPS) for i in range(int(round(DANCE_LEN * FPS)))}
if SCENE == 'round':
    names = ONLY.split(',') if ONLY else list(EXPRESSIONS)
    scene = build(names[0])
    scene.render.use_persistent_data = True
    obs = bpy.data.objects
    paws = sorted([o for o in obs if o.name.split('.')[0] == 'paw' and o.type == 'MESH'], key=lambda o: o.name)
    arms = sorted([o for o in obs if o.name.split('.')[0] == 'arm' and o.type == 'MESH'], key=lambda o: o.name)
    feet = sorted([o for o in obs if o.name.split('.')[0] == 'foot' and o.type == 'MESH'], key=lambda o: o.name)
    shoulder = lambda at: Vector((math.copysign(ROUND_SH, at.x), -0.66, -0.30))
    len0 = [(Vector(EXPRESSIONS[names[0]]['paw' + sd]) - shoulder(Vector(EXPRESSIONS[names[0]]['paw' + sd]))).length / 2 + 0.04 for sd in 'LR']
    eyes_o = [o for o in obs if o.name.split('.')[0] == 'eye']
    shut = []
    for lo in [o for o in obs if o.name.split('.')[0] == 'lid']:
        sl = sphere('blink', 1.0, lo.location.copy(), (ER * 1.04,) * 3, lo.active_material, 64, 32)
        cap(sl, 0.80 - 1.72 * 0.97, -(30 - 26 * 0.97))
        sl.hide_render = True
        shut.append(sl)
    rig = bpy.data.objects.new('rig', None)   # the whole creature, its pivot on the floor under its middle
    scene.collection.objects.link(rig)
    rig.location = (0, 0, -0.95)
    bpy.context.view_layer.update()
    for o in [o for o in obs if o.type in ('MESH', 'CURVES', 'CURVE') and o.parent is None and o is not rig]:   # the horns are curves: they go with it too
        o.parent = rig
        o.matrix_parent_inverse = rig.matrix_world.inverted()
    cam = scene.camera
    cam.data.ortho_scale = 5.0   # room for the jump with horns and antennae, and the paws out wide
    cam.location = (0, -9, 0.50)
    cam.rotation_euler = (Vector((0, 0, 0.50)) - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    if opt('--zoom'):   # a test: a close look at the face (--zoom 4 --aim -0.3: the mouth)
        cam.data.ortho_scale = 5.0 / float(opt('--zoom'))
        cam.location = (0, -9, float(opt('--aim', '0.5')))
    for name in names:
        path = os.path.join(OUT, '%s-%s-%s.png' % (KIND, LEVEL, name))
        if not ONLY and os.path.exists(path):
            continue
        e = EXPRESSIONS[name]
        f = e['f']
        for i, sd in enumerate('LR'):
            at = Vector(f['paw' + sd])
            sh = shoulder(at)
            paws[i].location = at
            arms[i].location = (sh + at) / 2
            arms[i].rotation_euler = (at - sh).to_track_quat('Z', 'Y').to_euler()
            arms[i].scale = (1.0, 1.0, ((at - sh).length / 2 + 0.04) / len0[i])
            feet[i].location = Vector(f['foot' + sd])
        sq = f.get('sq', 0.0)
        rig.scale = (1 + 0.5 * sq, 1 + 0.5 * sq, 1 - sq)
        rig.location = (f.get('shift', 0.0), 0, -0.95 + f.get('lift', 0.0))
        rig.rotation_euler = (math.radians(f.get('pitch', 0.0)), math.radians(f.get('tilt', 0.0)), math.radians(f.get('yaw', 0.0)))
        near = f.get('near', 0.0)
        if near > 0:   # koro's close-up: a camera coming near with a wider lens, the creature's middle kept the same size
            d = 1 / (1 / 60 + near * (1 / 3.2 - 1 / 60))   # (far off it is all but the orthographic one the dance has)
            cam.data.type, cam.data.sensor_fit, cam.data.lens = 'PERSP', 'HORIZONTAL', 36 * d / 5.0
            cam.location = (0, -d, 0.50 - 0.50 * near)   # and lower: near the camera it is bigger, its feet stay in the frame
        else:
            cam.data.type, cam.location = 'ORTHO', (0, -9, 0.50)
        for eo in eyes_o:
            eo.rotation_euler = (0.05, 0.0, 0.30 * f.get('look', 0.0))
        for sl in shut:
            sl.hide_render = not f.get('blink')
        scene.render.filepath = path
        t_ = time.time()
        bpy.ops.render.render(write_still=True)
        print('rg_master: rendered', path, '%.1fs' % (time.time() - t_))
    raise SystemExit(0)
if SCENE == 'meme':
    names = ONLY.split(',') if ONLY else list(EXPRESSIONS)
    scene = build(names[0])
    scene.render.use_persistent_data = True
    obs = bpy.data.objects
    parts = {}
    for base_ in ('belly', 'chest', 'uarm', 'farm', 'thigh', 'shin', 'mfoot'):
        found = sorted([o for o in obs if o.name.split('.')[0] == base_ and o.type == 'MESH'], key=lambda o: o.name)
        parts[base_] = found
    hands = sorted([o for o in obs if o.name.split('.')[0] == 'paw' and o.type == 'MESH'], key=lambda o: o.name)
    limb = {o for v in parts.values() for o in v} | set(hands)
    head = bpy.data.objects.new('head', None)   # the round creature as it was: its face, eyes, ears, fur
    scene.collection.objects.link(head)
    bpy.context.view_layer.update()
    for o in [o for o in obs if o.type in ('MESH', 'CURVES') and o.parent is None and o not in limb and o is not head]:
        o.parent = head
        o.matrix_parent_inverse = head.matrix_world.inverted()
    for o in limb:
        o.rotation_mode = 'QUATERNION'
    head.rotation_mode = 'QUATERNION'
    eyes_o = [o for o in obs if o.name.split('.')[0] == 'eye']
    shut = []
    for lo in [o for o in obs if o.name.split('.')[0] == 'lid']:
        sl = sphere('blink', 1.0, lo.location.copy(), (ER * 1.04,) * 3, lo.active_material, 64, 32)
        cap(sl, 0.80 - 1.72 * 0.97, -(30 - 26 * 0.97))
        sl.hide_render = True
        sl.parent = head
        sl.matrix_parent_inverse = head.matrix_world.inverted()
        shut.append(sl)
    blink_at = {k for b in range(0, 400, 29) for k in (b + 7, b + 8)}
    Z = Vector((0, 0, 1))

    def put(o, a, b):
        a, b = Vector(a), Vector(b)
        o.location = (a + b) / 2
        o.rotation_quaternion = Z.rotation_difference((b - a).normalized())

    def aim(o, centre, up, side):
        """a part centred here, its length along up, turned about it so its width lies along side (hips, shoulders)"""
        up = Vector(up).normalized()
        q = Z.rotation_difference(up)
        want = Vector(side) - up * Vector(side).dot(up)
        if want.length > 1e-4:
            have = q @ Vector((1, 0, 0))
            ang = have.angle(want.normalized())
            if have.cross(want).dot(up) < 0:
                ang = -ang
            q = Quaternion(up, ang) @ q
        o.location = Vector(centre)
        o.rotation_quaternion = q

    cam = scene.camera
    cam.data.ortho_scale = 4.2
    cam.location = (0, -9, -0.55)
    cam.rotation_euler = (Vector((0, 0, -0.55)) - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    for name in names:
        path = os.path.join(OUT, '%s-%s-%s.png' % (KIND, LEVEL, name))
        if not ONLY and os.path.exists(path):
            continue
        j, fi = EXPRESSIONS[name]['joints'], int(name[1:])
        H_, N_, up_ = Vector(j['hips']), Vector(j['neck']), Vector(j['up'])
        tdir = (N_ - H_).normalized()
        cdir = (tdir + up_ * 0.5).normalized()   # the chest leans a little on to where the head goes
        head.location = N_ + up_ * 0.20
        head.scale = (MEME_HEAD,) * 3
        head.rotation_quaternion = Z.rotation_difference(up_)
        aim(parts['belly'][0], H_ + tdir * 0.50, tdir, Vector(j['hipR']) - Vector(j['hipL']))   # the hips sway with the rat's
        aim(parts['chest'][0], N_ - cdir * 0.42, cdir, Vector(j['shR']) - Vector(j['shL']))
        for k, sd in enumerate(('L', 'R')):
            put(parts['uarm'][k], j['sh' + sd], j['el' + sd])
            put(parts['farm'][k], j['el' + sd], j['hand' + sd])
            put(parts['thigh'][k], j['hip' + sd], j['knee' + sd])
            put(parts['shin'][k], j['knee' + sd], j['foot' + sd])
            hands[k].location = Vector(j['hand' + sd])
            ft = parts['mfoot'][k]
            ft.location = Vector(j['foot' + sd]) + Vector((0, -0.08, 0))
            ft.rotation_quaternion = Z.rotation_difference(Z)
        look_x = 0.14 * math.sin(fi * 0.23)
        for eo in eyes_o:
            eo.rotation_euler = (0.06, 0.0, look_x)
        for sl in shut:
            sl.hide_render = fi not in blink_at
        scene.render.filepath = path
        t_ = time.time()
        bpy.ops.render.render(write_still=True)
        print('rg_master: rendered', path, '%.1fs' % (time.time() - t_))
    raise SystemExit(0)
if SCENE in ('dance', 'mocap'):
    # The dance is built once (the creature, its fur, the light): from frame to frame only the paws, the arms and the
    # camera (the lean, the hop, the sway) move, so a frame is a render, not a rebuild. Frames already there are kept.
    names = ONLY.split(',') if ONLY else list(EXPRESSIONS)
    scene = build(names[0])
    scene.render.use_persistent_data = True
    obs = bpy.data.objects
    paws, arms = [obs['paw'], obs['paw.001']], [obs['arm'], obs['arm.001']]
    shoulder = lambda at: Vector((math.copysign(0.78, at.x), -0.66, -0.30))
    len0 = [(at - shoulder(at)).length / 2 + 0.04 for at in paws_at(EXPRESSIONS[names[0]])]
    legs = [(obs['leg'], obs['foot'], 'L'), (obs['leg.001'], obs['foot.001'], 'R')] if 'leg' in obs else []
    # alive: the eyes look about (an eyeball turned turns its iris: it is drawn in the ball's own space) and blink
    # (a shut lid over each, shown for two frames); the whole creature squashes and stretches on its hops, from the floor
    eyes_o = [o for o in obs if o.name.split('.')[0] == 'eye']
    lids_o = [o for o in obs if o.name.split('.')[0] == 'lid']
    shut = []
    for lo in lids_o:
        sl = sphere('blink', 1.0, lo.location.copy(), (ER * 1.04,) * 3, lo.active_material, 64, 32)
        cap(sl, 0.80 - 1.72 * 0.97, -(30 - 26 * 0.97))
        sl.hide_render = True
        shut.append(sl)
    rig = bpy.data.objects.new('rig', None)
    scene.collection.objects.link(rig)
    rig.location = (0, 0, -1.0)
    bpy.context.view_layer.update()
    for o in [o for o in obs if o.type in ('MESH', 'CURVES') and o.parent is None]:
        o.parent = rig
        o.matrix_parent_inverse = rig.matrix_world.inverted()
    blink_at = {k for b in range(0, 400, 29) for k in (b + 7, b + 8)}   # about every 2.3 seconds, two frames
    leg0 = [(Vector(EXPRESSIONS[names[0]]['foot' + sd]) - Vector(LEGS_HIP[sd])).length / 2 + 0.05 for _, _, sd in legs]
    cam, rise = scene.camera, RISE.get(KIND, 0.0)
    for name in names:
        path = os.path.join(OUT, '%s-%s-%s.png' % (KIND, LEVEL, name))
        if not ONLY and os.path.exists(path):
            continue
        e = EXPRESSIONS[name]
        for i, at in enumerate(paws_at(e)):
            sh = shoulder(at)
            paws[i].location = at
            arms[i].location = (sh + at) / 2
            arms[i].rotation_euler = (at - sh).to_track_quat('Z', 'Y').to_euler()
            arms[i].scale = (1.0, 1.0, ((at - sh).length / 2 + 0.04) / len0[i])
        for (leg, foot, sd), l0 in zip(legs, leg0):
            hip, ft = Vector(LEGS_HIP[sd]), Vector(e['foot' + sd])
            foot.location = ft
            leg.location = (hip + ft) / 2
            leg.rotation_euler = (ft - hip).to_track_quat('Z', 'Y').to_euler()
            leg.scale = (1.0, 1.0, ((ft - hip).length / 2 + 0.05) / l0)
        fi = int(name[1:])
        sq = max(-0.07, min(0.07, -e.get('hop', 0.0) * 0.5))   # lower (knees bent): squashed; up: stretched
        rig.scale = (1 + 0.5 * sq, 1 + 0.5 * sq, 1 - sq)
        look_x = max(-0.30, min(0.30, e.get('sway', 0.0) * 3 + 0.12 * math.sin(fi * 0.21)))
        look_z = max(-0.15, min(0.22, ((e['pawL'][2] + e['pawR'][2]) / 2 + 0.3) * 0.18))
        for eo in eyes_o:
            eo.rotation_euler = (look_z, 0.0, look_x)
        for sl in shut:
            sl.hide_render = fi not in blink_at
        cam.location = (0, -9, 1.0 + rise)
        cam.rotation_euler = (Vector((0, 0, 0.10 + rise)) - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
        cam.rotation_euler.rotate_axis('Z', math.radians(e['tilt']))
        cam.location.x -= e['sway']
        cam.location.z += 0.35 - e['hop']
        scene.render.filepath = path
        t_ = time.time()
        bpy.ops.render.render(write_still=True)
        print('rg_master: rendered', path, '%.1fs' % (time.time() - t_))
    raise SystemExit(0)
for name in (ONLY.split(',') if ONLY else list(EXPRESSIONS)):
    stem = 'dz-%s-%s' % (DRINK_IS, LEVEL) if LAYER == 'drink' else '%s-%s' % (KIND, LEVEL) if LAYER == 'body' else '%s-%s%s' % (KIND, DRINK_IS, '-' + LEVEL if LEVEL != 'low' else '')
    path = os.path.join(OUT, '%s%s%s.png' % (stem + '-' if SCENE else KIND + '-', name, '-clay' if CLAY else ''))
    if SCENE and (not ONLY or ',' in ONLY) and os.path.exists(path):   # a film's frames: two runs can share the work, and a stopped one goes on
        continue
    open(path, 'wb').close() if SCENE and (not ONLY or ',' in ONLY) else None   # taken
    scene = build(name)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print('rg_master: rendered', scene.render.filepath)
