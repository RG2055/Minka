"""The group dance of the four original Nogurumiņi (rg_master.py --scene round): four phrases of eight beats, the same
timeline for all of them, laid out per beat so the page can play it on the music's own beat (js/radio-dancers.js):
frame = phrase * 48 + beat * 6 + sub-step. Every phrase starts and ends in the same settled bounce, so any phrase can
follow any other at a phrase's end.
  A  bounce on every beat, paws up on the off beats, a big stretch with both paws up on 8
  B  sway: weight left, right, left, right, a small step (the other foot lifts), one paw out, a lean
  C  alternating arms (left up, right up ...), little turns to one side and the other, the eyes after the raised paw
  D  energy: three big bounces, a deep crouch, the jump, the landing squash, back
The creatures differ a little (how big the bounce, how wide the arms, a frame of lag), the beat is one.
  python3 choreo.py out_dir"""
import json
import math
import os
import sys

STEPS = 12           # frames per beat (6 was steppy)
PHRASES = 'ABCD'     # koro also has E: it comes close to the screen and grins (its own frames, after these)
SH = 0.78
REST = {'L': (-0.42, -0.86, -0.55), 'R': (0.42, -0.86, -0.55)}
FOOT = {'L': (-0.36, -0.30, -0.86), 'R': (0.36, -0.30, -0.86)}
# the creatures' own ways: bounce size, arm spread, lag in frames, a turn's size
CAST = {'pufs': (1.00, 1.00, 0, 1.0), 'koro': (1.18, 0.96, 0, 1.15), 'antenas': (0.92, 1.10, 0, 0.9)}   # (a lag was tried: it read as stutter)


def ease(u):
    return u * u * (3 - 2 * u)


def mix(a, b, u):
    if isinstance(a, (list, tuple)):
        return [x + (y - x) * u for x, y in zip(a, b)]
    return a + (b - a) * u


def paw_up(side, spread, height=0.36):
    s = -1 if side == 'L' else 1
    return (s * (0.86 + 0.48 * spread), -0.50, height)


def paw_out(side, spread):
    s = -1 if side == 'L' else 1
    return (s * (0.90 + 0.52 * spread), -0.52, 0.02)


def foot_up(side, h=0.15):
    x, y, z = FOOT[side]
    return (x * 1.08, y - 0.02, z + h)


def key(**kw):
    base = dict(mouth='open', pawL=REST['L'], pawR=REST['R'], footL=FOOT['L'], footR=FOOT['R'], sq=0.0, lift=0.0, tilt=0.0, shift=0.0, yaw=0.0, look=0.0)
    base.update(kw)
    return base


def phrase_keys(p, amp, spread, turn):
    """the keys on each beat (8) for phrase p: (on the beat, half way to the next)"""
    out = []
    for b in range(8):
        if p == 'A':
            on = key(sq=0.09 * amp)                                       # down on the beat
            up = key(sq=-0.07 * amp, lift=0.07 * amp)                    # up between
            if b % 2 == 1:
                up.update(pawL=paw_up('L', spread), pawR=paw_up('R', spread), look=0.0)
            if b == 7:
                up.update(sq=-0.12 * amp, lift=0.10 * amp, pawL=paw_up('L', spread, 0.48), pawR=paw_up('R', spread, 0.48))
        elif p == 'B':
            s = -1 if b // 2 % 2 == 0 else 1                               # left, left, right, right ...
            side, other = ('L', 'R') if s < 0 else ('R', 'L')
            on = key(sq=0.06 * amp, tilt=9 * s * amp, shift=0.12 * s, look=0.5 * s,
                     **{'paw' + side: paw_out(side, spread), 'foot' + other: foot_up(other, 0.10)})
            up = key(sq=-0.03 * amp, tilt=5 * s * amp, shift=0.08 * s, lift=0.03, look=0.4 * s, **{'paw' + side: paw_out(side, spread * 0.9)})
        elif p == 'C':
            side = 'L' if b % 2 == 0 else 'R'
            yaw = (22 if b in (2, 3) else -22 if b in (6, 7) else 0) * turn
            s = -1 if side == 'L' else 1
            on = key(sq=0.07 * amp, yaw=yaw, look=0.7 * s, **{'paw' + side: paw_up(side, spread, 0.42)})
            up = key(sq=-0.04 * amp, lift=0.04, yaw=yaw * 0.8, look=0.6 * s, tilt=-4 * s, **{'paw' + side: paw_up(side, spread, 0.30)})
        elif p == 'E':   # koro comes close (the page grows it), grins with its teeth, laughs, goes back
            if b < 2:   # two hops up to the camera: down on the beat, up in between
                on = key(sq=0.10 * amp, mouth='open')
                up = key(sq=-0.08 * amp, lift=0.10, mouth='open')
            elif b < 6:
                s_ = 1 if b % 2 == 0 else -1
                # proud of its grillz: one paw up by the mouth's corner pointing at them, the other at its side; the
                # head leans, cheeky, and it nods to the beat
                on = key(sq=0.07 * amp, yaw=-4 + 3 * s_, tilt=6, mouth='grin', pawL=(-0.46, -0.90, -0.62), pawR=(0.66, -1.00, -0.34))
                up = key(sq=-0.03 * amp, lift=0.025, yaw=-4 - 2 * s_, tilt=4, mouth='grin', pawL=(-0.46, -0.90, -0.60), pawR=(0.65, -1.01, -0.30))
            else:       # and two back
                on = key(sq=0.10 * amp, mouth='open')
                up = key(sq=-0.08 * amp, lift=0.10, mouth='open')
        else:   # D
            if b < 3:
                on = key(sq=0.12 * amp)
                up = key(sq=-0.09 * amp, lift=0.12 * amp, pawL=paw_out('L', spread), pawR=paw_out('R', spread))
            elif b == 3:
                on = key(sq=0.16 * amp)                                    # the crouch before it
                up = key(sq=0.20 * amp, pawL=REST['L'], pawR=REST['R'])
            elif b == 4:
                on = key(sq=-0.16 * amp, lift=0.30 * amp, pawL=paw_up('L', spread, 0.5), pawR=paw_up('R', spread, 0.5),
                         footL=foot_up('L', 0.06), footR=foot_up('R', 0.06))
                up = key(sq=-0.14 * amp, lift=0.48 * amp, pawL=paw_up('L', spread, 0.55), pawR=paw_up('R', spread, 0.55),
                         footL=foot_up('L', 0.08), footR=foot_up('R', 0.08))
            elif b == 5:
                on = key(sq=-0.10 * amp, lift=0.36 * amp, pawL=paw_up('L', spread, 0.45), pawR=paw_up('R', spread, 0.45))
                up = key(sq=-0.04 * amp, lift=0.14 * amp, pawL=paw_out('L', spread), pawR=paw_out('R', spread))
            elif b == 6:
                on = key(sq=0.20 * amp)                                    # the landing
                up = key(sq=0.06 * amp)
            else:
                on = key(sq=0.04 * amp)
                up = key(sq=-0.03 * amp, lift=0.03)
        out.append((on, up))
    return out


def frames_for(kind):
    amp, spread, lag, turn = CAST[kind]
    timeline = []
    for p in (PHRASES + 'E' if kind == 'koro' else PHRASES):
        keys = phrase_keys(p, amp, spread, turn)
        settle = key(sq=0.08 * amp)
        keys[0] = (settle, keys[0][1])   # every phrase starts where every phrase ends: switching is seamless
        for b in range(8):
            on, up = keys[b]
            nxt = keys[b + 1][0] if b < 7 else settle      # each phrase ends where every phrase begins
            for k in range(STEPS):
                u = k / STEPS
                f = {}
                for name in on:
                    if name == 'mouth':
                        f[name] = on[name] if u < 0.5 else nxt.get('mouth', on[name])
                        continue
                    if u < 0.5:
                        f[name] = mix(on[name], up[name], ease(u * 2))
                    else:
                        f[name] = mix(up[name], nxt[name], ease((u - 0.5) * 2))
                timeline.append(f)
    n = len(timeline)
    out = []
    for i in range(n):   # a creature's own small lag behind the beat (looped within the dance)
        f = dict(timeline[(i - lag) % n])
        pi, bi, si = i // (8 * STEPS), i // STEPS % 8, i % STEPS
        # the eyes: a blink at each phrase's end, and a happy wink on the big accents (A's 8, D's landing)
        ph = (PHRASES + 'E')[pi]
        f['blink'] = (bi == 7 and si in (8, 9)) or (ph == 'D' and bi == 6 and si in (2, 3)) or (ph == 'A' and bi == 3 and si in (8, 9))
        if ph == 'E':   # it comes up to the camera (the user: "close to the screen", not just bigger): as the page grows it,
            # the camera comes near with a wider lens (the face and paws, nearest, grow most) and it leans in to peer
            t = bi + si / STEPS   # as the page (js/radio-dancers.js): a step nearer with each hop, while in the air
            u = max(0.0, min(1.0, (t % 1 - 0.08) / 0.6))
            near = 1.0 if 2 <= t < 6 else (int(t) + ease(u)) / 2 if t < 2 else 1 - (int(t - 6) + ease(u)) / 2
            f['near'], f['pitch'] = near, 10.0 * near
        out.append({k: ([round(x, 4) for x in v] if isinstance(v, list) else (round(v, 4) if isinstance(v, float) else v)) for k, v in f.items()})
    return out


if __name__ == '__main__':
    dst = sys.argv[1]
    os.makedirs(dst, exist_ok=True)
    for kind in CAST:
        fr = frames_for(kind)
        body = [f for f in fr if f.get('mouth') != 'grin']
        json.dump({'steps': STEPS, 'phrases': PHRASES, 'frames': fr[:len(PHRASES) * 8 * STEPS]}, open(os.path.join(dst, 'choreo-%s.json' % kind), 'w'))
        if kind == 'koro':   # E apart: the grin is built into the creature, so its frames are a run of their own
            json.dump({'steps': STEPS, 'frames': fr[len(PHRASES) * 8 * STEPS:]}, open(os.path.join(dst, 'choreo-koro-E.json'), 'w'))
        print(kind, len(fr))
