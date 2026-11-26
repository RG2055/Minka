# Minka: measured baseline and hot spots

Measured 2026-11 in the cloud harness (headless Chromium, software compositing, 1920×1080, synthetic data)
unless marked **PC**. "x4" = main thread CPU-throttled 4x. Numbers are for comparing before/after; time on the
hospital PC must be measured there. Add new rows with date and method.

## Field observation (PC, user, Windows Task Manager)

Idle 7 % CPU · card hover 22 % · with radio 27 % · Chrome RAM 1410 MB (all Chrome processes, not split).
Not yet split into Minka renderer / GPU process / DWM / other Chrome: do the field protocol first.

## App device tiers on the target PC (navigator: 12 threads, 8 GB)

| Where | Rule | On target | On a 4-core cloud box without emulation |
|---|---|---|---|
| `index.html` `__mkPerfProfile.lowSpec` → `html.mk-low-spec` | memory ≤ 8 or cores ≤ 4 | **on** | on |
| `kalendars/index.html` | always lowSpec | on | on |
| `kalendars/js/theme.js` tier | ≤ 4 GB/≤ 2 cores low, ≤ 8 GB/≤ 4 cores medium | medium | medium |
| `kalendars/js/header-appearance.js` modest | lowSpec or ≤ 4 cores or ≤ 4 GB | on | on |
| `js/radio-dither-layout.js:42` lowSpec | cores ≤ 4 or memory ≤ 4 | **off** (fftSize 1024) | on (512) |
| `kalendars/js/emoji-particles.js` quality | ≤ 4 cores or ≤ 4 GB → 0.65 | **1.0** | 0.65 |
| `js/radio-max.js:261` spectrum frame gap | `mk-low-spec` → 66 ms | 15 fps | 15 fps |
| `js/radio_extras_v4.js:376` wave | lowSpec → 20 fps | 20 fps | 20 fps |
| `kalendars/js/page/mk-dither.js` live picture | real GPU → worker WebGL, 15 fps (`setInterval`, line 231) | **animates** | still frame (software GL) |

## Idle (nobody touching the app)

| State | Renderer CPU | GPU process CPU | Other |
|---|---|---|---|
| Day, radio closed (fixed 10:30) | ~39 ms/s (all non-GPU processes) | ~79 ms/s | total ~118 ms/s |
| Night, radio closed (real clock, stars) | 65–78 ms/s | **317–329 ms/s** | 9.2 commits/s, ~5 presented frames/s, raster 22 ms/s |
| Radio open, paused | ~94 ms/s | ~356 ms/s (night) | |
| Radio playing, spectrum | ~271 ms/s | ~709 ms/s | audio service 9 ms/s; rAF 36/s in headless (60/s at 60 Hz) |

Idle work by source (night, `idle-frames.js`, 6 s): ~2,900 star style invalidations (`s-star`, `s-star-core`;
`kalendars/js/page/stars-overlay.js` `step()` on `MinkaMotion.onSlowTick`, half the stars every other tick);
daily cat sprite: inline `backgroundPosition` 1/s (`kalendars/js/daily-cat.js:875,883`) paints in the
document's own layer (paint clip = whole 1920×1080 layer; actual raster is the 96×96 sprite).
Callbacks: `MinkaMotion` clock 15/s (`js/mk-motion.js:499-540`; subscribers: stars, mood-trend sky, header
weather drift, card-layout dither when main-thread), 1 s intervals in shell and calendar
(`js/radio.js:977` writes `#timeDisp`, which is always `display:none`), rAF ≈ 0.
No running CSS/WAAPI animations at idle (the app steps paused animations by hand on purpose) and no
backdrop-filter in the default theme.

## Memory

Renderer PSS 268–311 MB; GPU process 124–134 MB; browser 44; network 28; audio 21 (playing).
JS heap only 10–13 MB used, so RAM is DOM, style and graphics, not JS objects.
- Documents: shell (4,301 CSS rules, 1,200 nodes) + calendar iframe (12,342 rules, 2,722 nodes) + 6 empty
  `about:blank` frames; `Performance.getMetrics`: 24 frames, 27 documents, ~9,200 nodes, 948 listeners.
- CSS: ~14,700 rules in the calendar's sheets, 21,235 `!important`, 1,677 specificity hacks, 23 override files.
- Composited layers: 48 drawing 36 ≈ 65 MB tiles (idle), 54 / 41 ≈ 77 MB (radio open).
- Images fetched at start while hidden: 6 bolus guide photos (`js/bolus.js:1833`, up to 19.5 MB if decoded;
  decoded only when painted), radiologi/radiograferi SVGs 800×800 ×2 each, header art 2400×432 shown at
  1894×170.
- Soak, 60 cycles of switching/modals/radio: no leak, heap ≈ 17.5 MB stable.

## Startup (cold, x4)

243 requests, 8.9 MB (JS 3.6 MB, CSS 2.7 MB), 141 scripts. Usable ≈ 1.7 s, task time 7.6 s (style 4.0 s).
428 forced style/layout passes (2.96 s) + 434 in-frame passes (4.0 s). CSS parse only 91 ms.
Top forcers: `fitTiles` (`kalendars/js/page/mk-header-x.js:2155`), `calendarHasPainted` (`index.html:1097`,
polled every 200 ms at `:1129` with getComputedStyle in the iframe; `minka:appReady` message exists),
`mk-side-faces`, `ledSource` (`mk-header-x.js:438`), corridor, mood-trend, `autoSizeCards`,
`mk-integrated-duty-header`.

## Day switching (x4)

| | before stage 0 | after stage 0 |
|---|---|---|
| forced style+layout per switch | 674 ms | 298 ms |
| click → settled, radio closed | 1100 ms | 595 ms |
| radio open | 588 ms | 342 ms |
| radio + spectrum | 756 ms | 363 ms |
| first visit (closed / open / spectrum) | 1074 / 1064 / 697 ms | 666 / 631 / 372 ms |
| whole benchmark interaction p90 | 584 ms | 416 ms |
| hover p90 | 232 ms | 168 ms |

Stage 0 (uncommitted in the 2026-11 cloud session, diff `rg-perf-stage0.diff`): `:has()` count rules in
`kalendars/css/page/mk-side-glass-v1.css` → `#grafiks-app[data-mk-side-n]` set by `g_syncSideCount` in
`kalendars/js/calendar.js` (the `:has()` restyled ~354 elements on every DOM change); `contain: layout size`
on `#hxTop` (`kalendars/css/page/mk-header-x.css`); day pill selects on `pointerdown`.
Remaining forced work per switch (field-probe, cloud): `ViewTransitionCallback` (calendar.js), `nightsplit.js
run`, `mood-feedback.js run`, `g_sizeMonthPicker`. Event Timing for a day click: ~250 ms is presentation
delay (the view-transition hold), processing ~1 ms.

## Card hover with the radio open (2026-11-26, x4, target navigator, NOCLOCK, pointer kept moving)

The shell (radio) and the calendar iframe are same-origin: **one main thread**. With the spectrum running the
radio's loop competed with the hover: presented frames 27 → 17.5/s, dropped 27 → 39.5/s (radio closed vs
spectrum). Per hover ~1.2 s main-thread work in all states; main-thread self time while hovering: **Commit 26 %**
(layer tree push; 48-54 layers), JS 14 % (mostly `card-initials-dither.js` frame), style 9 %, canvas resource
8 %, PaintArtifactCompositor 5 %, hit testing 4 %.
Fixed locally (uncommitted, not pushed), measured before → after:
- `js/radio.js` MacScape parallax removed: wrote `--mx/--my` on the shell `<html>` every mouse frame over the
  radio/dock → 354-element restyle each frame; its only readers (`#macscapeBg` orbs) live in the calendar
  document, display:none, where the variables never arrive. `.mk-note` (other `--mx` reader) is never created.
- `js/radio-max.js` spectrum loop: timer to ~12 ms before the due vsync instead of rAF every vsync; same frames
  (simulated: 15 fps, 67 ms gaps, also with 10 ms timer jitter), wakeups 60 → 30/s on lowSpec; loop JS
  557 → 397 ms per run, calls 533 → 302.
- `kalendars/js/page/card-initials-dither.js`: pointermove only notes the pointer; the card is measured once per
  frame in rAF and set up on entering a card. Handler 598 → 61 ms per run, but the forced style moved into the
  frame (frame 1.9 → 2.8 s): net per-hover −2-3 %. Pixels identical (lit cells 34,363 vs 34,323).
- Net, spectrum running: presented 17.5 → 19.8/s, dropped 39.5 → 36.6/s, task per hover 1272 → 1239 ms.
Not measurable in the cloud (software compositing): the GPU cost of ~20 Mpx of drawn layers with radio open
(radioWindow 1176×310 will-change, header 6 stacked 1894×170 layers, full-screen body::before gradient and
body::after 2 % overlay-blend noise, `#worker-modal-backdrop` 1908×986 layer while closed). Check on the PC.

## RG 2.0 prototypes (2026-11-26, cloud, target navigator)

| Prototype | Result | Decision |
|---|---|---|
| Spectrum loop on a timer (`radio-max.js`) | wakeups 60 → 30/s (lowSpec), frames identical (simulated 15 fps, 67 ms) | in tree |
| Spectrum in a Worker + OffscreenCanvas (all 5 skins' code moved verbatim; proto/radio-max.worker.js) | vs the timer loop: main busy ~10-14 vs ~10-11 ms/s, hover-with-spectrum frames 26.5-28.9 vs 26.2-27.8/s: noise | not adopted (PC check optional) |
| Star sky without paused WAAPI animations (`stars-overlay.js`: same keyframes/easing computed, 2D transform/opacity) | night layers 304 → 47, commit 17 → 12.7 ms/s, browser proc 70 → 44, GPU proc 369 → 345, total −7 %; pixels: sub-pixel AA at star edges only (2,715 px, 0.13 %) | in tree; look at it on the PC at night |
| Held finished animations → `fill: backwards` (`#grafiks-app` appReveal, `#bottomBtnBar` dockRise) | −2/−3 layers by day, no opacity render surfaces; pixel diff below base-vs-base noise | in tree |
| Ambient glow without its paused animation while hidden | layers 48 → 51 (squashing changed): worse | reverted |
| Cascade size (css-prune: 10,572 calendar style rules, 3,870 ever live = 37 %) | day-switch style −8…−23 %, task −2…−10 % (noisy) | CSS consolidation worth it, not the main lever |
| Day switch anatomy (switch-restyle) | 81 style passes per switch, 1,540 of 3,198 elements restyled, 91 ms style at x1; top: corridor.js `place` reads, calendar_extras_v4.js accents re-set on every card | single-pass card pipeline + registry (RG 2.0) |
| Pre-rendered day swap (park/swapways, x4) | rebuild 536 ms vs parked-in-list 158 ms; blocked by ~111 DOM queries of `#grafiks-list .card` | needs card registry first |
| Initials dither frame (dither-bench, 326×441, DPR 1) | A drawImage/cell 3.0 ms, B JS blit+putImageData 1.9 ms, C Rust/WASM 1.7 ms; B and C pixel-identical to A | B candidate after a PC check (GPU canvas upload); WASM not worth its toolchain |
| JS profile (js-profile) | no pure-compute hotspot: top JS self time is forced layout (`fitsHeight` 1.24 s per 8 switches x4 = the switch's own style+layout paid by the first reader), getAnimations 0.66 s, getBoundingClientRect | Rust/WASM has no target in Minka today |

## RG 2.0 foundation shoot-out (2026-11-26, cloud, target navigator, day view with the same captured DOM/CSS)

Scope: the calendar's day view as RG renders it (10 captured days, every region a switch changes, after all of
RG's decorators; blob pictures inlined), the same stylesheets, the same three hover scripts, a radio bar with the
Pioneer skin code. Not in the prototypes: header/mood canvases, live clocks and timers, dock windows, search.
Switch = pointerdown → new day on screen, CPU x4; CPU per process x1; means of 1-3 runs.

| Engine (bundle) | switch median / p90 ms | CPU while switching ms/s | hover dropped frames/s | renderer MB | JS heap MB | correct DOM | 60 more switches |
|---|---|---|---|---|---|---|---|
| RG today | 595 / 1069 | 1303 | 22.9 | 298 | 15.7 | — | stable |
| vanilla replace (3.4 KB) | 342 / 427 | 822 | 2.0 | 235 | 3.4 | yes | stable |
| own minimal morph "rgmorph" (4.9 KB) | 274 / 592 | **264** | 0.1 | 266 | 3.7 | yes | stable |
| SolidJS 2.0.4 compiled JSX (41.7 KB) | 390 / 517 | 844 | 1.7 | 234 | 3.8 | yes after key fix | stable |
| Lit 3.3.3 light DOM (21.7 KB) | 293 / 480 | 808 | 0.5 | 237 | 3.7 | yes | stable |
| idiomorph 0.8.0 | 180 / 381 | 267 | 0.2 | 288 | 5.0 | — | **leaks ~5,100 nodes per switch** |
Radio playing: RG 524 / 1071 ms, 1331 ms/s; rgmorph 278 / 416, 478; Solid 395 / 500, 987; Lit 301 / 593, 942.
Idle is not comparable (prototype has no live elements; with its 2 CSS sparks paused it idles at ~2 ms/s).
Lessons: the leap comes from dropping the reactive module layer (dropped hover frames −90…−99 %, switch ~2x) and
from touching only what changes (switch CPU −80 % with a morph); the framework choice itself does not move it. A
keyed framework silently showed a stale card when the key was not unique (fixed by hashing content). idiomorph
retains detached nodes: not usable for a 24 h app. Leptos (WASM DOM glue, full rewrite) and ArrowJS (small, young)
were assessed, not built.

## RG Engine 1.0 in the app (2026-11-26, cloud, target navigator, branch rg-engine-1)

`kalendars/js/rg-engine.js`: the day's card list is built apart (`g_updateList` into a fragment) and morphed into
`#grafiks-list` against the previous build (a detached shadow copy): only changed attributes, class tokens, inline
style properties, text and nodes are written; what other modules added is left alone; a card whose builder content a
module rewrote is replaced whole. `rg:patched` (microtask, after the finaliser) replaces the list-level
MutationObservers of corridor, coverflow, card-layout, calendar_extras_v4, design_v1, emoji, nameday, fatigue.
Neighbour days built while idle with their pictures decoded; the hold (`DAY_HOLD_MS`) only for an unprepared day, on
`#grafiks-app.startViewTransition` where it exists. The closed night panel is no longer rebuilt on a switch.

| x4 unless noted | before (stage 0 in tree) | RG Engine 1.0 |
|---|---|---|
| day switch radio closed, median / p90 (dayswitch.js) | 654 / 877 ms | 250 / 888 ms |
| radio open / spectrum, median | 370 / 394 ms | 193 / 196 ms |
| task / style / layout per switch | 868 / 319 / 71 ms | 626 / 161 / 39 ms |
| elements restyled per switch, passes, style ms x1 (switch-restyle.js) | 1537, 79.3, 78.7 ms | 767, 72.5, 46.2 ms |
| card hover (hover-radio.js WIGGLE=1) | dropped 22.1-23.0/s | 21.3-24.2/s (unchanged: hover is not the engine's) |
| night panel rebuilt while closed, 3 switches | 3 | 0 |
DOM after the same clicks equal to the old code (dom-compare.js; ids of generated SVG masks aside); screenshot after
switching: 31 px over 8 vs 198 between two runs of the old code. Found on the way: the inline glass-tint script in
kalendars/index.html painted the cards present at start only (a rebuild dropped it); the day's cards are now left out.
p90 stays high: a switch before the neighbour is prepared (clicks 0.7 s apart at x4) takes the held path.

## Radio

789 KB JS, 505 KB never ran on desktop; CSS 264 KB, 208 KB unused. Engine `js/radio.js` 303 KB.
Two AnalyserNodes: `js/radio.js:2206` (shared as `window.__mkRadioAnalyser`) and a second one in
`js/radio-dancers.js:68` (fftSize 256). Spectrum loop `js/radio-max.js:256-275`: rAF every vsync, draws
every 66 ms (lowSpec). Five desktop skins: hills, pixel, pioneer, amp, dither.
Prototype (not shipped): spectrum in an OffscreenCanvas worker cut total CPU 17 % (609/632 → 503/523 ms/s),
GPU about the same, RAM +10 MB.

## Code size

JS 4,013 KB loaded, 63 % never ran in any session (desktop with every dock window, rad, mobile).
CSS 2,818 KB, 68 % never matched. Duplication (jscpd) low: JS 0.5 %, CSS 0.3 %. Biome: 72 provably unused
declarations. Knip does not apply (script-tag globals, no ES modules).

## Open plan (2026-11-26, priority order)

| # | Step | Why on this PC | Proof |
|---|---|---|---|
| P0 | Field baseline on the PC: chrome://gpu report, memory slots, Chrome Task Manager split (visible vs minimised), day/night/hover/radio/switch states, field-probe 30 min | 7/22/27 % and 1410 MB are whole-Chrome numbers; without the split no change can be judged | table per state |
| P1 | Ship stage 0 (bump `?v=` + SW version) | measured: forced style+layout per switch 674 → 298 ms (x4), switch 1.7–2.1x faster | PC: field-probe day-click processing/presentation |
| P2 | Wakeups: radio spectrum rAF → timer at its 15 fps draw rate; drop the hidden `#timeDisp` 1 s tick; replace the 200 ms paint poll with `minka:appReady` | 60 → 15 wakeups/s while radio plays; fewer frames for GPU + DWM | `idle-loops.js` rAF/s; PC GPU Process + dwm.exe, radio playing |
| P3 | Forced reflow batching: startup (`fitTiles`, `ledSource`, `calendarHasPainted`, side faces, corridor, mood-trend) and day switch (`ViewTransitionCallback`, `nightsplit run`, `mood-feedback run`, `g_sizeMonthPicker`) | single-thread speed at 35 W is the limit | `forced.js`, `startup-trace.js` pass counts |
| P4 | Radio spectrum bus: one AnalyserNode for all consumers (`radio-dancers.js:68`), then worker OffscreenCanvas | prototype −17 % total CPU | `bench.js` spectrum scenario; PC radio state |
| P5 | Night idle: star sky (~490 restyles/s, 9 commits/s; GPU process ~4x day) and the daily-cat sprite painting in the document layer | Minka runs all night; frames cost GPU + DWM | `NIGHT=1`/night `NOCLOCK=1` `idle-frames.js`; PC night vs day; pixel check |
| P6 | Hover: invalidation scope, emoji/initials effects on pointer events | PC hover 22 % | `hover.js` invalidations; PC hover state |
| P7 | RAM: bolus photos on demand, header art at shown size, empty iframes, then CSS consolidation (14.7k rules) | shared 8 GB with the iGPU | `ram-census.js`, PC memory footprint |
| P8 | Safe deletion: 72 Biome-proven declarations; per-feature lazy load from coverage | less parse/compile, less memory | protocol in playbook.md §6 |
