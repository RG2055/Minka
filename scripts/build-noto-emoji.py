#!/usr/bin/env python3
"""Noto emoji for the emoji picker, card stickers and backgrounds (js/emoji3d.js).

The picker's whole catalogue (kalendars/js/emoji.js, read by
scripts/export-emoji-catalogue.mjs) as looks a person can choose for their
emoji (beside Fluent), plus Emoji 18.0:
  noto      Noto 3D (Google, 2026) for every emoji in the catalogue.
  noto18    the nine new Emoji 18.0 pictures in Noto 3D.
            Apache License 2.0 (github.com/googlefonts/noto-emoji, 3D/png).
  notoanim  Noto, the classic flat Google emoji, for every catalogue emoji that
            has an animation: a still picture that moves under the pointer,
            like the Fluent ones. CC BY 4.0
            (googlefonts.github.io/noto-emoji-animation).

Each picture: kalendars/assets/emoji3d/<id>-128.webp and -320.webp; an
animated one also <id>-anim.webp (112 px, every second frame); its stills are
its classic static picture (Apache 2.0, the same repository).

Ids are three characters, "n"/"a" + two base-36 digits, kept in
kalendars/assets/emoji3d/noto-ids.json: an id is saved in people's emoji, so it
never changes; a new emoji gets the next free one. (Three, like r07/b27:
Chrome 153 does not match longer tag ids with emoji3d's TAG_RE quantifier.)
The list goes into js/emoji3d.js between the noto:begin/end markers.

    python3 scripts/build-noto-emoji.py [--list-only]   (only the list, pictures as they are)
"""
import io
import json
import os
import re
from concurrent.futures import ProcessPoolExecutor
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'kalendars' / 'assets' / 'emoji3d'
CACHE = ROOT / '.cache' / 'noto-emoji'
IDS_FILE = OUT / 'noto-ids.json'
URL_3D = 'https://fonts.gstatic.com/s/e/noto3demoji/latest/{cp}/512.png'
URL_ANIM = 'https://fonts.gstatic.com/s/e/notoemoji/latest/{cp}/512.webp'
URL_2D = 'https://fonts.gstatic.com/s/e/notoemoji/latest/{cp}/512.png'
URL_ANIM_API = 'https://googlefonts.github.io/noto-emoji-animation/data/api.json'
LIST_ONLY = '--list-only' in sys.argv
DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

# Emoji 18.0 (Unicode, 16 Sep 2026)
NOTO18 = [('🫫', 'Plaisājoša seja'), ('🫹', 'Īkšķis pa kreisi'), ('🫺', 'Īkšķis pa labi'), ('🫌', 'Monarha tauriņš'),
          ('🫝', 'Gurķītis'), ('🛙', 'Bāka'), ('🪋', 'Meteors'), ('🪌', 'Dzēšgumija'), ('🪍', 'Tauriņu tīkliņš')]


def catalogue():
    out = subprocess.run(['node', str(ROOT / 'scripts' / 'export-emoji-catalogue.mjs')], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def cp_of(e, keep_fe0f=False):
    return '_'.join('%x' % ord(c) for c in e if keep_fe0f or ord(c) != 0xFE0F)


def fetch(url, name):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / name
    if not f.exists():
        req = urllib.request.Request(url, headers={'User-Agent': 'minka-build'})
        f.write_bytes(urllib.request.urlopen(req, timeout=30).read())
    return f.read_bytes()


def still(im, eid):
    if LIST_ONLY:
        return
    im = im.convert('RGBA')
    for size in (128, 320):
        im.resize((size, size), Image.LANCZOS).save(OUT / f'{eid}-{size}.webp', 'WEBP', quality=84, method=4)


def coverage(im):
    return im.getchannel('A').point(lambda a: 255 if a > 40 else 0).histogram()[255]


def animated(data, eid, still_data=None):
    if LIST_ONLY:
        return
    src = Image.open(io.BytesIO(data))
    frames, durations, covs = [], [], []
    for i, fr in enumerate(ImageSequence.Iterator(src)):
        rgba = fr.convert('RGBA')
        if i % 2 == 0:
            covs.append((coverage(rgba.resize((64, 64))), rgba.copy()))
        if i % 2:                                            # every second frame: half the size, still smooth
            durations[-1] += fr.info.get('duration', 33)
            continue
        frames.append(rgba.resize((112, 112), Image.LANCZOS))
        durations.append(fr.info.get('duration', 33))
    # The still: the emoji's own classic picture (an animation often starts from a
    # plain face, so 😀 😃 😄 would all look alike); else its first nearly whole frame.
    if still_data:
        still(Image.open(io.BytesIO(still_data)), eid)
    else:
        full = max(c for c, _ in covs)
        still(next(im for c, im in covs if c >= .8 * full), eid)
    frames[0].save(OUT / f'{eid}-anim.webp', 'WEBP', save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, quality=62, method=4)


def make_anim(job):
    url_cp, eid = job
    try:
        data = fetch(URL_ANIM.format(cp=url_cp), url_cp + '-anim.webp')
    except urllib.error.HTTPError:
        return None
    try:
        still_data = fetch(URL_2D.format(cp=url_cp), url_cp + '-2d.png')
    except urllib.error.HTTPError:
        still_data = None
    animated(data, eid, still_data)
    return eid


def id_maker():
    ids = json.loads(IDS_FILE.read_text()) if IDS_FILE.exists() else {}

    def make(prefix, cp):
        key = prefix + cp
        if key not in ids:
            used = set(ids.values())
            n = 0
            while prefix + DIGITS[n // 36] + DIGITS[n % 36] in used:
                n += 1
            ids[key] = prefix + DIGITS[n // 36] + DIGITS[n % 36]
        return ids[key]
    return make, ids


def make_3d(job):
    cp, eid = job
    still(Image.open(io.BytesIO(fetch(URL_3D.format(cp=cp), cp + '-3d.png'))), eid)
    return eid


def main():
    cat = catalogue()
    names = cat['names']
    emoji = cat['bySection']['all']
    make_id, ids = id_maker()
    anim_cps = {}
    for icon in json.loads(fetch(URL_ANIM_API, 'anim-api.json'))['icons']:
        anim_cps[icon['codepoint'].replace('_fe0f', '')] = icon['codepoint']
    out, jobs3d, jobsanim, anim_items = [], [], [], []
    for e in emoji:
        cp = cp_of(e)
        eid = make_id('n', cp)
        jobs3d.append((cp, eid))
        out.append({'id': eid, 'set': 'noto', 'label': names.get(e, 'Emoji'), 'e': e})
    for e, label in NOTO18:
        cp = cp_of(e)
        eid = make_id('n', cp)
        jobs3d.append((cp, eid))
        out.append({'id': eid, 'set': 'noto18', 'label': label, 'e': e})
    for e in emoji:
        cp = cp_of(e)
        if cp in anim_cps:
            eid = make_id('a', cp)
            jobsanim.append((anim_cps[cp], eid))
            anim_items.append({'id': eid, 'set': 'notoanim', 'label': names.get(e, 'Emoji'), 'e': e, 'anim': 1})
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as pool:
        list(pool.map(make_3d, jobs3d, chunksize=4))
        print('3D', len(jobs3d), flush=True)
        made = set(filter(None, pool.map(make_anim, jobsanim, chunksize=2)))
        print('anim', len(made), flush=True)
    out += [x for x in anim_items if x['id'] in made]
    missing = [x['e'] for x in out if x['label'] == 'Emoji']
    if missing:
        print('no Latvian name:', ' '.join(missing))
    IDS_FILE.write_text(json.dumps(ids, indent=0, sort_keys=True) + '\n')
    js = ROOT / 'kalendars' / 'js' / 'emoji3d.js'
    src = js.read_text()
    data = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    src, k = re.subn(r'/\*noto:begin\*/.*?/\*noto:end\*/', lambda _m: '/*noto:begin*/' + data + '/*noto:end*/', src, flags=re.S)
    assert k == 1, 'noto markers missing in emoji3d.js'
    js.write_text(src)
    keep = {x['id'] for x in out}
    for f in OUT.glob('[na]*.webp'):                        # pictures of ids no longer listed
        if f.name.split('-')[0] not in keep and not LIST_ONLY:
            f.unlink()
    total = sum(f.stat().st_size for f in OUT.glob('[na]*.webp'))
    print(len(out), 'pictures,', total // 1024, 'KB')


if __name__ == '__main__':
    main()
