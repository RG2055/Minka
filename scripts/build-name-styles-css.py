#!/usr/bin/env python3
"""Writes kalendars/css/name-styles.css: the card text fonts (skin `nf`, and per
element `data-wf-font` on the watch faces).

  card style (skin nf, lower case)  every text on the card in that font; the
                                    name also gets the style's effect
  card style, name only (UPPER)     class mk-nf-only: only the name
  one element (data-wf-font)        that element in that font (its own effect
                                    if it is the name); "x" = the usual font

    python3 scripts/build-name-styles-css.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'kalendars' / 'css' / 'name-styles.css'

# Texts other than the first name (the effect stays on the name; small text only
# takes the font, in its own colour, so it stays readable).
OTHERS = ('.name-sub,.mk-mid-month-num,.mk-mid-month-label,.mk-mid-meta-value,.mk-mid-meta-label,'
          '.mk-mid-meta-time,.mk-mid-timer,.mk-mid-initials,.mk-coffee-num,[data-wf-part="remaining"] .val')

# letter: font (all texts), extra for small text, name effect, watch-face size, plain-card size, sample size
S = {
 'c': ("font-family:'Pacifico',cursive !important;font-weight:400 !important;font-style:normal !important;text-transform:none !important;",
       "",
       """background:linear-gradient(180deg,#ffffff 4%,#c9defd 30%,#5a7fe0 46%,#0d1748 50%,#ffb48c 54%,#ff5e62 72%,#fff3ef 96%) !important;
  -webkit-background-clip:text !important;background-clip:text !important;color:transparent !important;-webkit-text-fill-color:transparent !important;
  -webkit-text-stroke:.03em rgba(8,12,30,.7) !important;text-shadow:none !important;
  filter:drop-shadow(0 .05em 0 #070a18) drop-shadow(0 0 .1em rgba(150,195,255,.45)) !important;rotate:-5deg;""",
       "min(10cqw,calc(70cqw / var(--wf-name-chars,10)))", "clamp(13px,8cqw,22px)", 22),
 'n': ("font-family:'Righteous',sans-serif !important;font-weight:400 !important;font-style:normal !important;", "",
       """color:#fffdf6 !important;-webkit-text-fill-color:#fffdf6 !important;-webkit-text-stroke:.015em rgb(var(--nf-ink)) !important;
  text-shadow:0 0 .04em #fff,0 0 .14em rgb(var(--nf-ink)),0 0 .32em rgb(var(--nf-ink)),0 0 .7em rgba(var(--nf-ink),.7),0 .04em .1em rgba(0,0,0,.6) !important;""",
       "min(10.5cqw,calc(80cqw / var(--wf-name-chars,10)))", "clamp(13px,8.5cqw,24px)", 22),
 'z': ("font-family:'Playfair Display',Georgia,serif !important;font-style:italic !important;font-weight:800 !important;text-transform:none !important;", "",
       """background:linear-gradient(180deg,#fff6cf 0%,#f3c962 38%,#a8721b 52%,#f6d47c 66%,#8a5a12 100%) !important;
  -webkit-background-clip:text !important;background-clip:text !important;color:transparent !important;-webkit-text-fill-color:transparent !important;
  -webkit-text-stroke:.02em rgba(60,34,4,.75) !important;text-shadow:none !important;
  filter:drop-shadow(0 .04em 0 #2b1a03) drop-shadow(0 0 .08em rgba(0,0,0,.5)) !important;""",
       "min(11cqw,calc(82cqw / var(--wf-name-chars,10)))", "clamp(13px,8.5cqw,24px)", 22),
 'r': ("font-family:'Monoton',sans-serif !important;font-weight:400 !important;font-style:normal !important;", "zoom:.72;",
       """background:linear-gradient(180deg,#7ff6ff 0%,#2fb8ff 45%,#ff7a59 55%,#ffd08a 100%) !important;
  -webkit-background-clip:text !important;background-clip:text !important;color:transparent !important;-webkit-text-fill-color:transparent !important;
  text-shadow:none !important;filter:drop-shadow(0 0 .05em rgba(0,0,0,.95)) drop-shadow(0 0 .14em rgba(47,184,255,.6)) !important;""",
       "min(8cqw,calc(52cqw / var(--wf-name-chars,10)))", "clamp(11px,6.5cqw,19px)", 15),
 'b': ("font-family:'Bungee',sans-serif !important;font-weight:400 !important;font-style:normal !important;", "zoom:.85;",
       """-webkit-text-stroke:.02em #0b0d12 !important;paint-order:stroke fill;
  text-shadow:.03em .03em 0 rgb(var(--nf-ink)),.06em .06em 0 rgb(var(--nf-ink)),.09em .09em 0 #0b0d12,.1em .12em .08em rgba(0,0,0,.55) !important;""",
       "min(9cqw,calc(62cqw / var(--wf-name-chars,10)))", "clamp(11px,6.5cqw,19px)", 17),
 'k': ("font-family:'Bangers',sans-serif !important;font-weight:400 !important;font-style:normal !important;letter-spacing:.03em !important;", "",
       """color:#ffd23f !important;-webkit-text-fill-color:#ffd23f !important;-webkit-text-stroke:.07em #111 !important;paint-order:stroke fill;
  text-shadow:.07em .08em 0 #111 !important;""",
       "min(12cqw,calc(96cqw / var(--wf-name-chars,10)))", "clamp(14px,9cqw,26px)", 22),
 'a': ("font-family:'Anton',Impact,sans-serif !important;font-weight:400 !important;font-style:normal !important;", "",
       "text-transform:uppercase !important;letter-spacing:.03em !important;text-shadow:var(--nf-halo) !important;",
       "min(11cqw,calc(96cqw / var(--wf-name-chars,10)))", "clamp(14px,9cqw,26px)", 22),
 'd': ("font-family:'Dancing Script',cursive !important;font-weight:700 !important;font-style:normal !important;text-transform:none !important;", "",
       "text-shadow:var(--nf-halo) !important;",
       "min(12cqw,calc(92cqw / var(--wf-name-chars,10)))", "clamp(14px,9cqw,26px)", 22),
 'l': ("font-family:'Lobster',cursive !important;font-weight:400 !important;font-style:normal !important;text-transform:none !important;", "",
       """-webkit-text-stroke:.02em rgba(0,0,0,.5) !important;paint-order:stroke fill;
  text-shadow:.06em .06em 0 rgba(var(--nf-ink),.9),.08em .09em .06em rgba(0,0,0,.6) !important;""",
       "min(11cqw,calc(84cqw / var(--wf-name-chars,10)))", "clamp(13px,8.5cqw,24px)", 22),
 'p': ("font-family:'Press Start 2P',monospace !important;font-weight:400 !important;font-style:normal !important;", "zoom:.62;",
       "line-height:1.5 !important;text-shadow:.125em .125em 0 rgba(0,0,0,.75),0 0 2px rgba(0,0,0,.6) !important;",
       "min(6.4cqw,calc(52cqw / var(--wf-name-chars,10)))", "clamp(9px,5cqw,14px)", 11),
 'e': ("font-family:'Playfair Display',Georgia,serif !important;font-style:italic !important;font-weight:800 !important;text-transform:none !important;", "",
       "text-shadow:var(--nf-halo) !important;",
       "min(11cqw,calc(82cqw / var(--wf-name-chars,10)))", "clamp(13px,8.5cqw,24px)", 22),
}

C = '.card.mk-mid-card'
NOT_OWN = ':not([data-wf-font]):not([data-wf-font] *)'   # an element with its own font is left alone


def names(l):
    """Every place the name takes style l: the card's style, an element's own, the picker sample."""
    return (f'{C}.mk-nf-{l} .name-main{NOT_OWN}', f'{C} [data-wf-font="{l}"] .name-main', f'.mk-nf-sample.mk-nf-{l}')


def others(l):
    return (f'{C}.mk-nf-{l}:not(.mk-nf-only) :is({OTHERS}){NOT_OWN}',
            f'{C} [data-wf-font="{l}"]:is({OTHERS})', f'{C} [data-wf-font="{l}"] :is({OTHERS})')


def main():
    o = ["""/* Card text fonts: generated by scripts/build-name-styles-css.py, do not edit.
   Skin `nf` (minka-skins.js NAME_STYLES) sets the card's style: every text in the
   style's font and the name with its effect; `mk-nf-only` keeps it to the name.
   An element's own font (watch-face inspector, data-wf-font) overrides the card's;
   "x" is the usual font. Fonts: assets/fonts/name-styles (a face downloads only
   when a card uses it). Static: a fill, an outline, a shadow; no images, no animation.
   A layer: its !important beats the older unlayered text rules, while faces with
   their own ink (layer mk-fx, declared earlier) keep theirs. */
@layer mk-nf {
"""]
    all_names = ',\n'.join(n for l in S for n in names(l))
    o.append(f"""{all_names} {{
  --nf-fill: rgb(var(--mk-txt-color, 246, 247, 249)); --nf-ink: var(--mk-num-color, 41, 230, 255);
  --nf-halo: 0 0 1px rgba(0,0,0,.9), 0 0 2px rgba(0,0,0,.8), 0 0 5px rgba(0,0,0,.55);
  position: relative !important; letter-spacing: 0 !important; text-transform: none !important;
  line-height: 1.3 !important; padding: 0 .12em !important; overflow: visible !important;
  color: var(--nf-fill) !important; -webkit-text-fill-color: var(--nf-fill) !important;
}}
{C}.mk-txt-dark .name-main {{ --nf-halo: 0 0 1px rgba(255,255,255,.95), 0 0 2px rgba(255,255,255,.9), 0 0 5px rgba(255,255,255,.6); }}
""")
    for l, (font, small, effect, wf, plain, sample) in S.items():
        o.append(f"/* {l} */\n{','.join(names(l))} {{\n  {font}\n  {effect}\n}}\n")
        o.append(f"{','.join(others(l))} {{ {font}{small} }}\n")
        o.append(f"{C}.mk-watch-face.mk-nf-{l} [data-wf-part=\"name\"]{NOT_OWN} .name-main, {C}.mk-watch-face [data-wf-part=\"name\"][data-wf-font=\"{l}\"] .name-main {{ font-size: {wf} !important; }}\n")
        o.append(f"{C}.mk-nf-{l}:not(.mk-watch-face) .name-main {{ font-size: {plain} !important; white-space: nowrap !important; }}\n")
        o.append(f".mk-nf-sample.mk-nf-{l} {{ font-size: {sample}px; }}\n")
    # Chrome glints
    glint = ', '.join(f'{n}::{p}' for n in names('c') for p in ('before', 'after'))
    o.append(f"""{glint} {{
  content: "✦"; position: absolute; font-family: system-ui, sans-serif; line-height: 1; color: #fff; -webkit-text-fill-color: #fff;
  -webkit-text-stroke: 0; text-shadow: 0 0 .25em #fff, 0 0 .6em #a9cfff; pointer-events: none; rotate: 5deg;
}}
{', '.join(f'{n}::before' for n in names('c'))} {{ left: .1em; top: .28em; font-size: .32em; }}
{', '.join(f'{n}::after' for n in names('c'))} {{ right: -.05em; top: .05em; font-size: .42em; }}

/* The pickers: tiles with the person's own name in each style, on a dark plate. */
.mk-nf-grid {{display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px;}}
.mk-nf-grid > button {{all: unset; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  min-height: 74px; padding: 10px 6px 8px; border-radius: 16px; cursor: pointer; overflow: hidden;
  background: radial-gradient(120% 90% at 50% 20%, #232a36, #0d1015); color: var(--pp-on, #e3e7ee); transition: border-radius .3s var(--pp-spring, ease);}}
.mk-nf-grid > button:hover {{border-radius: 10px;}}
.mk-nf-grid > button:focus-visible {{outline: 2px solid var(--pp-primary, #a8c7fa); outline-offset: 2px;}}
.mk-nf-grid > button[aria-pressed="true"] {{box-shadow: 0 0 0 2px var(--pp-bg, #11151b), 0 0 0 4px var(--pp-primary, #a8c7fa);}}
.mk-nf-grid > button b {{font: 600 12px/1.2 var(--pp-font, system-ui) !important; color: var(--pp-on, #e3e7ee); -webkit-text-fill-color: currentColor;}}
.mk-nf-sample {{display: block; max-width: 100%; white-space: nowrap; font-style: normal; font-size: 22px;
  --mk-txt-color: 246, 247, 249; --mk-num-color: 41, 230, 255; font-family: var(--pp-font, system-ui); font-weight: 700;}}
.mk-nf-only-switch {{margin-top: 10px;}}
}}
""")
    OUT.write_text(''.join(o))
    print('wrote', OUT, OUT.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
