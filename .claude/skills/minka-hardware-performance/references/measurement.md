# Measuring Minka

Two places, two kinds of truth: the **cloud harness** tells what work the app asks the browser to do (exact,
repeatable, comparable before/after); the **hospital PC** tells what that work costs on the real CPU/iGPU.

## Cloud harness

Server: `node scripts/local-audit-server.mjs` (synthetic data only, port 8012). Browser: the preinstalled
Playwright Chromium, headless, 1920×1080, timezone Europe/Riga. Scripts in `scripts/`, see SKILL.md.

Rules:
- One measurement at a time. Parallel browsers contaminate CPU numbers.
- Before/after on the same server: `BASE=1` serves changed files from git HEAD.
- Navigator emulation on (default). Without it a 4-core box takes Minka's low-core branches.
- Fixed clock (default, 10:30) for repeatable interaction tests. Idle and power numbers with `NOCLOCK=1`:
  Playwright's fake clock itself adds ~60 timer callbacks a second per frame. Night (star sky) idle: best with
  `NOCLOCK=1` during real Riga night hours; `NIGHT=1` (22:30, time flowing on Playwright's fake timers) works any
  time but drives the ticks differently (measured: ~1 presented frame/s vs ~5 with the real clock), so compare
  NIGHT runs only with NIGHT runs. A frozen clock freezes the stars and under-measures night.
- Total CPU = utime+stime of every Chrome process from `/proc`, unthrottled (rate 1). CPU throttling inflates
  CPU totals, so throttled runs are for latency only.
- `Emulation.setCPUThrottlingRate` 4 makes the main thread slow like a weak PC. It does **not** slow the GPU
  process, raster threads, compositor or DWM, and does not model: iGPU fill rate and memory bandwidth, shared
  RAM, single-channel memory, the 35 W turbo budget, Windows timer and scheduler behaviour, driver quirks, real
  vsync. Headless has no GPU: compositing and WebGL run in software (SwiftShader), so GPU-process time is a
  proxy for compositing *work*, not its cost on UHD 630, and GPU-only paths (live dither worker) do not run.

### Metrics that transfer to the PC (report these)

| Metric | Source | Why it transfers |
|---|---|---|
| style recalcs/s and elements restyled | trace `UpdateLayoutTree` (`elementCount`) | same DOM, same CSS → same work |
| forced style/layout passes and their JS | trace with `disabled-by-default-devtools.timeline.stack` | caused by code, not hardware |
| commits/s, frames presented/s at idle | trace `Commit`, `PipelineReporter` | each frame costs GPU + DWM on the PC |
| paints/s and paint area | trace `Paint` (`clip`) | raster work scales with area |
| composited layers and tile MB | `LayerTree` | shared RAM on the PC |
| callbacks/s by source (rAF, timers, observers) | `idle-loops.js` | wakeups |
| bytes loaded, CSS rules, DOM nodes, listeners | network, `Performance.getMetrics`, `ram-census.js` | memory and parse work |
| interaction latency split | Event Timing in `field-probe.js` | the same API runs on the PC |

Milliseconds from the cloud are only comparable with other cloud runs. Say so when reporting them.

## Field protocol: the hospital PC (read-only)

Nothing is installed or changed. Do the read-only hardware checks in `target-hardware.md` first.

### 1. Separate Minka from the rest of Chrome

Chrome Task Manager: in the Minka window press **Shift+Esc** (or ⋮ → More tools → Task manager). Right-click
the header and add: CPU, Memory footprint, GPU memory, Process ID (and Idle wake ups if offered). Rows:

| Row | Belongs to |
|---|---|
| App/Tab: Minka (renderer) | Minka's own JS, style, layout, paint; its iframes (same site) |
| GPU Process | all Chrome windows' compositing, raster, WebGL, video. Minka's share must be isolated (below) |
| Utility: Audio Service | radio playback |
| Utility: Network Service | all fetches, incl. the radio stream |
| Browser | Chrome itself (UI, tabs, profile) |
| Extensions, other tabs, Spare renderer | not Minka |

Minka's GPU share: with only Minka open, note the GPU Process CPU and GPU memory for 2 minutes with Minka visible,
then 2 minutes with the Minka window minimised (Chrome stops producing its frames). The difference is Minka's
rendering cost. Do the same for `dwm.exe` in Windows Task Manager → Details (frames Chrome presents also cost DWM).

The user's "Chrome RAM 1410 MB" is the sum of every row: report Minka's renderer footprint + its GPU memory
delta separately from Browser, extensions and other tabs.

Windows Task Manager notes: the Processes tab's CPU % on Windows 11 is processor *utility*, scaled against the
2.3 GHz base clock, so it reads higher in turbo. Compare like with like (same tab, same column), and prefer
Chrome Task Manager for per-process attribution. 7 % of 12 threads ≈ 0.85 of one thread.

### 2. States to record (2 minutes each, same order, Minka the only tab)

1. Day idle, radio closed. 2. Night idle (after dark: stars) or the same at evening. 3. Card hover sweep
(move over cards continuously). 4. Radio playing with spectrum visible. 5. Day switching (click days for a
minute). 6. A dock window open (stats, month calendar). Table per state: Minka renderer CPU, GPU Process CPU
(visible − minimised), dwm.exe CPU, Minka memory footprint, GPU memory.

### 3. field-probe.js

If DevTools are allowed (`chrome://policy`): F12 in the Minka window → Console → paste
`scripts/field-probe.js` → `MinkaProbe.start({ minutes: 30 })` → work normally → the summary prints itself.
Gives long frames with forced style/layout and the script responsible, interaction p50/p90/max with input /
processing / presentation split, CPU pressure states, heap and DOM per minute. `frames: true` only for short
runs (its rAF counter itself adds wakeups). Day-switch interactions include the view-transition hold
(`DAY_HOLD_MS` in calendar.js), so compare day-switch latency only with the same hold.

### 4. 24 hours

Every few hours note Minka's memory footprint and GPU memory in Chrome Task Manager, or keep `field-probe.js`
running (`minutes: 1440`, memory row every minute). A leak is steady growth across many hours of the same use,
not the first-hour warm-up. Cloud soak (60 cycles of switching/modals/radio) found no leak: heap ≈ 17.5 MB.

## Report format

State, metric, before → after, how measured (cloud work count / cloud ms / PC), and what remains to confirm on
the PC. Losses and null results are reported as plainly as gains.
