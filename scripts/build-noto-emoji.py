#!/usr/bin/env python3
"""Noto emoji for the emoji picker, card stickers and backgrounds (js/emoji3d.js).

Three extra sets next to Roji and Baloni:
  noto      Noto 3D (Google, 2026): a picked set of faces, hearts and hands,
            medicine, animals, things. Apache License 2.0
            (github.com/googlefonts/noto-emoji, 3D/png).
  noto18    the nine new Emoji 18.0 pictures in Noto 3D (same source).
  notoanim  animated Noto Emoji (classic flat style, the only animated Noto):
            a still frame for the grid, a small animation shown on hover.
            CC BY 4.0 (googlefonts.github.io/noto-emoji-animation).

Each picture: kalendars/assets/emoji3d/<id>-128.webp and -320.webp; an
animated one also <id>-anim.webp (160 px). Ids are three characters, "n"/"a" +
two base-36 digits, kept in kalendars/assets/emoji3d/noto-ids.json: an id is
saved in people's emoji, so it never changes; a new emoji gets the next free one.
(Three, like r07/b27: Chrome 153 does not match longer tag ids with emoji3d's
TAG_RE quantifier.)
Writes the list into js/emoji3d.js (between the noto:begin/end markers).

    python3 scripts/build-noto-emoji.py [--list-only]   (only the list, pictures as they are)
"""
import io
import json
import re
import sys
import urllib.request
from pathlib import Path
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'kalendars' / 'assets' / 'emoji3d'
CACHE = ROOT / '.cache' / 'noto-emoji'
URL_3D = 'https://fonts.gstatic.com/s/e/noto3demoji/latest/{cp}/512.png'
URL_ANIM = 'https://fonts.gstatic.com/s/e/notoemoji/latest/{cp}/512.webp'

NOTO = ('🙂 😀 😃 😄 😁 😆 😅 😂 🤣 🥲 🥹 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 😎 🤓 🧐 🤔 🫡 🤗 🤭 🫢 🫣 '
        '😏 😴 🥱 🤯 🥳 😤 😡 🥶 🥵 😱 😭 🥺 😬 🙄 🫠 💀 👻 🤖 👾 😷 🤒 🤕 '
        '❤️ 🧡 💛 💚 💙 🩵 🤍 🖤 💔 👍 👏 🙌 🫶 💪 ✌️ 🤞 '
        '🩻 💉 🩺 💊 🩹 🧬 🫀 🫁 🧠 🦷 🩸 🧪 🔬 🚑 🏥 🌡️ '
        '🦊 🦔 🦉 🐻 🐼 🐨 🐯 🦁 🐺 🦝 🦦 🦫 🦘 🦙 🐧 🦭 🐬 🐙 🦀 🦎 🐸 🦩 🦢 🦆 🐝 🦋 🐞 🦒 🦓 🦬 🐴 🦄 🐰 🐹 🐱 🐭 🦇 🐉 '
        '☕ 🍕 🎮 🎧 🎸 🎁 🏆 👑 💎 🔥 ⚡ ✨ 🌙 ⭐ 🚀 🌈 🍀 🌸 🌻').split()
# Emoji 18.0 (Unicode, 16 Sep 2026)
NOTO18 = [('🫫', 'Plaisājoša seja'), ('🫹', 'Īkšķis pa kreisi'), ('🫺', 'Īkšķis pa labi'), ('🫌', 'Monarha tauriņš'),
          ('🫝', 'Gurķītis'), ('🛙', 'Bāka'), ('🪋', 'Meteors'), ('🪌', 'Dzēšgumija'), ('🪍', 'Tauriņu tīkliņš')]
ANIM = ('😀 😂 🤣 😊 😍 🥰 😘 😎 🤩 🥳 😴 🥱 🤯 😭 😱 🥶 🥵 🤔 🫡 🥺 '
        '👍 👏 🙌 ❤️ 🔥 ✨ 🎉 🦊 🐼 🦄 🐉 🦋 ☕ 🚀').split()

# Latvian names: the picker's own (kalendars/js/emoji.js), then these.
EXTRA_NAMES = {'❤️': 'Sirds', '🧡': 'Oranža sirds', '💛': 'Dzeltena sirds', '💚': 'Zaļa sirds', '💙': 'Zila sirds',
               '🩵': 'Gaiši zila sirds', '🤍': 'Balta sirds', '🖤': 'Melna sirds', '💔': 'Salauzta sirds',
               '👍': 'Īkšķis augšā', '👏': 'Aplausi', '🙌': 'Rokas augšā', '✌️': 'Uzvara', '🤞': 'Turu īkšķus',
               '🎉': 'Svētki', '🌙': 'Mēness', '🤓': 'Gudrinieks', '😇': 'Eņģelītis', '🤒': 'Slims', '🤕': 'Savainots',
               '😊': 'Smaidīgs', '🥰': 'Mīlestība', '😍': 'Iemīlējies', '🤩': 'Sajūsmā', '😘': 'Gaisa buča',
               '😜': 'Mēle un mirkšķis', '🤪': 'Trakulīgs', '🧐': 'Ar monokli', '🤔': 'Domā', '🤗': 'Apskāviens',
               '😏': 'Smīns', '🥳': 'Ballīte', '😤': 'Niknums', '🥶': 'Salst', '🥵': 'Karsti', '🥺': 'Lūdzoši',
               '😬': 'Saspringts', '💀': 'Galvaskauss', '👻': 'Spoks', '👾': 'Citplanētietis', '🫶': 'Sirds rokas',
               '💪': 'Spēks', '🦷': 'Zobs', '🌡️': 'Termometrs', '🎸': 'Ģitāra', '🎁': 'Dāvana', '✨': 'Dzirkstis',
               '⭐': 'Zvaigzne', '🌸': 'Ķiršu zieds', '🌻': 'Saulespuķe'}


def names_from_picker():
    src = (ROOT / 'kalendars' / 'js' / 'emoji.js').read_text()
    out = {}
    m = re.search(r'var EMOJI_NAMES = \{(.*?)\n  \};', src, re.S)
    for k, v in re.findall(r"'([^']+)':'([^']+)'", m.group(1) if m else ''):
        out[k] = v
    m = re.search(r'var CRITTERS = \[(.*?)\n  \];', src, re.S)
    for k, v in re.findall(r"\['([^']+)','([^']+)'\]", m.group(1) if m else ''):
        out[k] = v
    return out


def cp_of(e):
    return '_'.join('%x' % ord(c) for c in e if ord(c) != 0xFE0F)


def fetch(url, name):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / name
    if not f.exists():
        req = urllib.request.Request(url, headers={'User-Agent': 'minka-build'})
        f.write_bytes(urllib.request.urlopen(req, timeout=30).read())
    return f.read_bytes()


LIST_ONLY = '--list-only' in sys.argv


def still(im, eid):
    if LIST_ONLY:
        return
    im = im.convert('RGBA')
    for size in (128, 320):
        im.resize((size, size), Image.LANCZOS).save(OUT / f'{eid}-{size}.webp', 'WEBP', quality=84, method=6)


def animated(data, eid):
    if LIST_ONLY:
        return
    src = Image.open(io.BytesIO(data))
    frames, durations = [], []
    for i, fr in enumerate(ImageSequence.Iterator(src)):
        if i == 0:
            still(fr.copy(), eid)
        if i % 2:                                  # every second frame: half the size, still smooth
            durations[-1] += fr.info.get('duration', 33)
            continue
        frames.append(fr.convert('RGBA').resize((160, 160), Image.LANCZOS))
        durations.append(fr.info.get('duration', 33))
    frames[0].save(OUT / f'{eid}-anim.webp', 'WEBP', save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, quality=72, method=4)


IDS_FILE = OUT / 'noto-ids.json'
DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'


def id_maker():
    ids = json.loads(IDS_FILE.read_text()) if IDS_FILE.exists() else {}
    def make(prefix, cp):
        key = prefix + cp
        if key not in ids:
            used = {v for v in ids.values() if v[0] == prefix}
            n = 0
            while prefix + DIGITS[n // 36] + DIGITS[n % 36] in used:
                n += 1
            ids[key] = prefix + DIGITS[n // 36] + DIGITS[n % 36]
        return ids[key]
    return make, ids


def main():
    names = dict(names_from_picker(), **EXTRA_NAMES)
    make_id, ids = id_maker()
    out = []
    for e in NOTO:
        cp = cp_of(e)
        if '_' in cp:
            continue
        eid = make_id('n', cp)
        still(Image.open(io.BytesIO(fetch(URL_3D.format(cp=cp), cp + '-3d.png'))), eid)
        out.append({'id': eid, 'set': 'noto', 'label': names.get(e, 'Emoji'), 'e': e})
    for e, label in NOTO18:
        cp = cp_of(e)
        eid = make_id('n', cp)
        still(Image.open(io.BytesIO(fetch(URL_3D.format(cp=cp), cp + '-3d.png'))), eid)
        out.append({'id': eid, 'set': 'noto18', 'label': label, 'e': e})
    for e in ANIM:
        cp = cp_of(e)
        url_cp = cp + ('_fe0f' if '️' in e else '')
        eid = make_id('a', cp)
        animated(fetch(URL_ANIM.format(cp=url_cp), url_cp + '-anim.webp'), eid)
        out.append({'id': eid, 'set': 'notoanim', 'label': names.get(e, 'Emoji'), 'e': e, 'anim': 1})
    missing = [x['e'] for x in out if x['label'] == 'Emoji']
    if missing:
        print('no Latvian name:', ' '.join(missing))
    IDS_FILE.write_text(json.dumps(ids, indent=0, sort_keys=True) + '\n')
    js = ROOT / 'kalendars' / 'js' / 'emoji3d.js'
    src = js.read_text()
    data = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    src, n = re.subn(r'/\*noto:begin\*/.*?/\*noto:end\*/', lambda _m: '/*noto:begin*/' + data + '/*noto:end*/', src, flags=re.S)
    assert n == 1, 'noto markers missing in emoji3d.js'
    js.write_text(src)
    total = sum(f.stat().st_size for f in OUT.glob('[na]*.webp'))
    print(len(out), 'pictures,', total // 1024, 'KB')


if __name__ == '__main__':
    main()
