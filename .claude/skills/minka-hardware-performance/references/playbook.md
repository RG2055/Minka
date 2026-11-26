# Playbook: patterns that pay on this hardware

Each pattern: when it applies, the Minka example, how to prove it. Apply only with a before/after measurement.

## 1. Fewer wakeups

- **Schedule at the drawing rate.** A rAF loop that draws every 4th vsync still wakes renderer, compositor, GPU
  process and DWM 60 times a second. Use a timer (or the shared `MinkaMotion` clock) at the drawing rate and
  draw inside one rAF from it. Example: `js/radio-max.js:256-275` (draws at 15 fps on lowSpec, wakes at 60).
  Proof: `idle-loops.js` rAF/s by source; PC: GPU Process CPU and dwm.exe with radio playing.
- **One clock.** New periodic visual work subscribes to `MinkaMotion.onAmbientTick/onSlowTick`
  (`js/mk-motion.js:499`) so all steps share a frame. Do not add `setInterval` loops for visuals.
- **Stop what nobody sees.** Pause on `document.hidden`, when a panel is closed or covered, or via
  `contentvisibilityautostatechange` (Google guide `efficient-background-processing`). Example: `js/radio.js:977`
  ticks every second to write `#timeDisp`, which CSS always hides.
- **No polling for state that has an event.** Example: `index.html:1097-1129` polls the iframe with
  getComputedStyle every 200 ms; the iframe already posts `minka:appReady`.

## 2. Less style and layout work

- **No `:has()` on large ancestors** whose subtree changes often: every mutation restyles the subtree. Replace with
  an attribute or class set by the code that changes the DOM (stage 0: `#grafiks-app[data-mk-side-n]`).
- **Batch reads before writes.** A read (`offsetWidth`, `getBoundingClientRect`, `getComputedStyle`) after a
  write forces style/layout. Find them with `forced.js` / `startup-trace.js` (stack per pass). Known sources:
  `fitTiles`, `fitWing`, `ledSource`, `syncMoonTuck` (mk-header-x.js), `mk-side-faces`, corridor, mood-trend,
  `autoSizeCards`, `nightsplit.js run`, `mood-feedback.js run`, `g_sizeMonthPicker`.
  Prefer ResizeObserver sizes, cached sizes invalidated by ResizeObserver, or CSS (container queries,
  `field-sizing`, `text-wrap: balance`) over measuring in JS.
- **Containment where a box's size never depends on its content**: `contain: layout size` (stage 0 `#hxTop`),
  `contain: layout style paint` for isolated widgets (Google `performance`, `interactions-in-complex-layouts`).
  Check that no `position: fixed` descendant escapes and that the box has explicit size.
- **`content-visibility: hidden`** for views toggled back and forth (keeps rendering state, skips work while
  hidden; Google `defer-rendering-heavy-content`). Already used for night overlay parking (`ns-parked`).
- **Smaller CSS cascade.** 14.7k rules and 21k `!important` make every recalc dearer. Consolidate override files
  into their base file one feature at a time, with screenshots of every skin.

## 3. Cheaper frames on the iGPU

- **Compositor-only properties** (transform, opacity) for anything that moves; never animate box-shadow, filter,
  background-position, colour, size. Check with `gpu-census.js` (REPAINT vs comp).
- **Small damage.** A tiny element stepped every second inside a big layer still invalidates and recomposites
  that layer (daily cat sprite, `kalendars/js/daily-cat.js:875,883`). Isolate it only if the PC shows a gain;
  every promoted layer costs shared RAM.
- **Layer budget.** Track layer count and tile MB (`gpu-census.js`); no blanket `will-change`
  (Google `performance`: "consumes excessive VRAM").
- **No backdrop-filter / blur over large areas**, no full-screen blend layers over animated content.
- **Canvas at the size it is shown** (CSS px × DPR), not larger; release contexts of hidden canvases.

## 4. Radio and spectrum

- **One analyser, one read per frame.** One AnalyserNode and one `getByteFrequencyData` per drawn frame,
  shared by every consumer (spectrum skins, dancers, extras). Today `radio-dancers.js:68` makes a second one.
- **Draw off the main thread** where it measured better: OffscreenCanvas in a worker (prototype: total CPU
  −17 %). Keep the main-thread path as fallback. Check GPU process on the PC.
- **Same frames, same skins.** Draw rates (15 fps lowSpec) and look stay exactly as now.

## 5. Memory and leaks

- Leaks: repeat an action 10 times, heap snapshot before / after / after reverting (Chrome DevTools MCP
  `memory-leak-debugging` flow; filters: detached DOM, event handlers, closures). Our soak found none; recheck
  after changes touching listeners, observers, workers, AudioNodes, canvases.
- Every `addEventListener`, observer, interval, worker, AudioNode and WebGL context needs an owner that removes
  it when its panel closes. Grep new code for the matching remove.
- Load hidden heavy assets on demand (bolus guide photos only when the guide opens). Serve images at the size
  shown (header art), pixel-checked at DPR 1 and 1.25.

## 6. Delete and merge only what is proven unused

Protocol, all steps, per file or symbol:
1. Candidates from Biome (`noUnusedVariables`), `coverage.js` (never ran / never matched) and jscpd.
2. Search the whole repo for the name as text: HTML `on*=` attributes, `window[...]`, string-built names,
   `data-*` hooks, other HTML entry points (index, mobile, rad, kalendars, worker files), service worker lists.
3. Coverage is evidence, not proof: code may serve rad, mobile, offline, a skin, a date or a rare modal.
   Check those sessions.
4. Delete, run unit tests, screenshot the affected states, rerun the scenario that would use it.
5. Lazy-load per feature, never by a blunt cut: cutting all "unused" CSS at start made startup worse
   (usable 1.8 → 4.7 s). Load a feature's CSS/JS when the feature opens, and measure.

## Tested and rejected (do not retry without new evidence)

- Rust/WASM for rendering or dither: JS is a small share; the cost is style, layout and compositing.
- GSAP Flip, Mikado, Taffy layout engine: add code, do not remove browser work.
- Lowering canvas DPR or disabling view transitions: changes the look, gain not meaningful.
- Hover data warm-up: at most ~40 ms.
- Blunt lazy CSS: startup worse (above).

## External expert sources (checked 2026-11-26)

| Source | Verdict for Minka |
|---|---|
| Intel `intel/skills` (35 skills, intel.github.io/skills): `linux-perf`, `performance-patterns`, `phoronix-test-suite`, `xpu-*`, `torch/vllm/sglang-xpu-*`, `dpnp-*`, `onetbb-quickstart` | None applies directly: they target Linux `perf` on native code, C/C++/SIMD patterns, Intel Arc/XPU AI runtimes. The PC runs Windows and Chrome's precompiled engine; no admin rights. Taken over: their method (counters before hotspots, one fix at a time, verify the outcome, inventory hardware first like `xpu-discover`). |
| Google `modern-web-guidance` (Chrome/Edge/Firefox/MDN) | Applies to the code. Use guides: `performance`, `defer-rendering-heavy-content`, `interactions-in-complex-layouts`, `efficient-background-processing`, `identify-inp-causes` (LoAF forced style vs layout), `break-up-long-tasks`, `schedule-tasks-by-priority`, `same-document-transitions`, `faster-spa-view-transitions`, `style-parent-with-has` (cost of `:has`). Search/retrieve: `npx -y modern-web-guidance@latest search "<2-5 words>"` then `retrieve "<id>"` (needs network). |
| `ChromeDevTools/chrome-devtools-mcp` skills `chrome-devtools`, `memory-leak-debugging`, `debug-optimize-lcp` | Applies on a developer PC: `performance_start_trace` + insights, `emulate` (CPU throttling), heap snapshot diff tools (`--memoryDebugging`). Our Playwright scripts do the same over CDP in the cloud. `--autoConnect`/`--browser-url` attach to a running Chrome only with remote debugging enabled: not on hospital PCs without IT. |
