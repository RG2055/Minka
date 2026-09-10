"""Convert Carozerra's complete LKD collection once; no decoder runs in the PWA.
Usage: python3 scripts/import-pioneer.py /path/to/carozerra
Requires Pillow. Source format documented by Carozerra (see docs/licenses).
"""
import gzip, io, json, re, struct, sys, tarfile
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
out = root / 'data/pioneer'
out.mkdir(parents=True, exist_ok=True)
text = (source / 'web/index.html').read_text()
block = text.split('const BUILTIN_CLIPS = {', 1)[1].split('\n};', 1)[0]
groups = {'Movies':'Animācijas', 'Backgrounds':'Foni', 'Stills':'Attēli', 'Level Meters':'Indikatori', 'Color':'Krāsainie'}
labels = {'airship':'Dirižablis', 'diverdolphins':'Nirējs un delfīni', 'dragonrider':'Pūķa jātnieks', 'metropolis':'Metropole', 'waterboard':'Veikbords', 'wildlife':'Savvaļa', 'wrc':'Rallijs', 'nightcruising':'Nakts brauciens', 'greatbarrierreef':'Koraļļu rifs', 'redplanet':'Sarkanā planēta', 'island':'Sala', 'firedragon':'Uguns pūķis', 'racingcart':'Kartings', 'motogp':'Moto GP'}
clips = []
for category, content in re.findall(r"'([^']+)': \[(.*?)\]", block, re.S):
    for ordinal, filename in enumerate(re.findall(r'"([^\"]+\.lkd)"', content), 1):
        raw = (source / 'assets/clips' / filename).read_bytes()
        assert raw[:4] == b'zLKD'
        count = struct.unpack_from('<I', raw, 16)[0]
        with tarfile.open(fileobj=io.BytesIO(gzip.decompress(raw[20:]))) as archive:
            strip = Image.open(io.BytesIO(archive.extractfile(archive.getmembers()[0]).read())).convert('RGB')
        assert count > 0 and strip.height % count == 0
        height = strip.height // count
        frames = [strip.crop((0, i*height, strip.width, (i+1)*height)) for i in range(count)]
        key = Path(filename).stem
        # Lossless, original pixels, original 60ms timing. Browser decodes one selection.
        frames[0].save(out / (key+'.webp'), save_all=True, append_images=frames[1:], duration=60, loop=0, lossless=True, method=4)
        levels = count//2 if category == 'Level Meters' else 0
        if levels:
            # Original sheets contain ascending left states, then right states.
            # Pair both at each level; the browser crops one row per audio level.
            atlas = Image.new('RGB', (strip.width*2, height*levels))
            for level in range(levels):
                atlas.paste(frames[level], (0, level*height))
                atlas.paste(frames[level+levels], (strip.width, level*height))
            atlas.save(out/(key+'-levels.webp'), lossless=True, method=4)
        poster = frames[count//4] if levels else frames[count//2]
        if not poster.getbbox(): poster = max(frames, key=lambda im: sum(im.convert('L').getdata()))
        poster = poster.copy()
        poster.thumbnail((192, 48))
        choices=[]
        for options in [dict(lossless=True),dict(quality=78)]:
            buffer=io.BytesIO();poster.save(buffer,format='WEBP',method=4,**options);choices.append(buffer.getvalue())
        (out/(key+'-poster.webp')).write_bytes(min(choices,key=len))
        label = next((value for token, value in labels.items() if token in key), None)
        if not label: label = {'Movies':'Animācija', 'Backgrounds':'Fons', 'Stills':'Attēls', 'Level Meters':'Indikators', 'Color':'Krāsainais skats'}[category]+' '+str(ordinal)
        clips.append(dict(id=key, label=label, category=groups[category], color=category=='Color', levels=levels, frames=count, width=strip.width, height=height, bytes=(out/(key+'.webp')).stat().st_size))
# Keep the user's current dolphin exactly as it was, alongside all source clips.
with Image.open(root/'data/dolphin.webp') as im:
    im.seek(im.n_frames//2)
    im.convert('RGB').save(out/'original-poster.webp', lossless=True, method=4)
(out/'clips.json').write_text(json.dumps(clips,ensure_ascii=False,separators=(',',':'))+'\n')
print(len(clips), 'clips;', sum(c['bytes'] for c in clips), 'animation bytes;', sum(p.stat().st_size for p in out.glob('*-poster.webp')), 'poster bytes')
