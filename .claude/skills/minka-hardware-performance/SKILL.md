---
name: minka-hardware-performance
description: >-
  Make the Minka/RG duty-roster PWA cheaper to run on its real target PC: HP ProDesk 400 G6 Mini, Intel
  i5-10500T (6C/12T, 35 W), Intel UHD Graphics 630 sharing 8 GB of RAM, Windows 11, Chrome PWA, open 24 hours.
  Use for any request about Minka speed or resource use: CPU/GPU/RAM, idle load, frame drops, slow day
  switching, slow dock windows or modals, card hover cost, radio spectrum cost, memory growth, leaks, extra
  listeners, timers or render loops, dead or duplicate code, replacing complex code with Chrome-native features,
  or checking a change before/after. Holds the measured Minka baseline, the target hardware model, a cloud
  measurement harness and a field protocol for the hospital PC. Trigger on: lēns, ātrāk, CPU, GPU, RAM,
  atmiņa, slodze, hover, dienu pārslēgšana, radio spektrs, frame drops, performance, optimize, leak, idle.
---

# Minka hardware performance

Goal: less work for the browser on an old Intel PC with integrated graphics, measured on that PC, with the app
looking and behaving exactly as before. Less code and fewer wakeups beat clever code.

Talk to the user in Latvian. Code, comments and commit text stay in English.

## Hard rules

1. **Identical look and function.** Every skin, animation, emoji, pet, effect, radio skin, mobile, desktop, rad,
   PWA and offline mode stays. A change that alters pixels or timing the eye can follow is not an optimisation.
   Exception only with the user's explicit OK, per change.
2. **Measure before and after, on the same harness, sequentially** (parallel runs contaminate each other).
   Report losses and null results too. No change without a measured gain; revert what does not pay.
3. **Count work, then confirm time on the PC.** The cloud has no GPU (software compositing) and a different CPU.
   Work counts (style/layout passes and elements, forced reflows, commits, paints and paint area, layers and
   tile MB, callbacks and wakeups per second, bytes loaded) transfer to the PC; milliseconds do not. See
   `references/measurement.md`.
4. **Emulate the target's navigator** (12 threads, 8 GB). Minka picks code paths from them; the scripts here do
   it by default (`scripts/variant.js`). Measure idle both by day and at night: the star sky makes night idle
   several times dearer (cloud: GPU process ~79 ms/s by day vs ~320 ms/s at night). Most faithful: `NOCLOCK=1` while it is really night in Riga; `NIGHT=1` approximates it any time.
5. **No system changes on hospital PCs.** No driver, Windows, power plan, Chrome flag or policy changes, no
   installs, no remote-debugging switches without IT's consent. Field measurement is read-only:
   Chrome Task Manager, `chrome://gpu`, Windows Task Manager, `scripts/field-probe.js` pasted in DevTools.
6. **Safe data only.** The synthetic server (`node scripts/local-audit-server.mjs`) and its fixtures; never real
   staff schedules or tokens in traces, screenshots, artifacts or external requests.
7. **No new framework, Rust, WASM or WebGPU because it is modern.** JS execution is a small share of Minka's
   cost (measured: style, layout, compositing dominate). Such a proposal needs a prototype that wins on the
   harness *and* on the PC.
8. **No push** unless the user says so in this conversation. Bump the `?v=` cache keys and the service-worker
   version in any change that ships.

## Workflow

1. **Frame the question** as a state and a metric: e.g. "night idle, radio closed: GPU process CPU and
   commits/s", "day switch with radio open: forced style+layout ms and presentation delay".
2. **Read the baseline** in `references/minka-findings.md` (numbers, hot spots with file:line, app tiers). Do not
   re-derive what is there; re-measure only what your change touches.
3. **Measure the current state** with the matching script (table below). Start the synthetic server first.
4. **Find the cause**, not the symptom: trace with stacks (`forced.js`, `startup-trace.js`), invalidation
   tracking (`idle-frames.js`, `hover.js`), callback census (`idle-loops.js`).
5. **Pick the pattern** from `references/playbook.md`. Check the relevant Google Modern Web Guidance guide
   (ids listed there) before writing new DOM/CSS/scheduling code.
6. **Change the smallest thing.** Keep one change per measurement.
7. **Verify**: same script before (`BASE=1`) and after; unit tests `node --test kalendars/test/*.test.mjs`;
   screenshots of the affected states (pixel-compare against a second base run to separate real changes from
   known races). Never call a visual "identical" without that comparison.
8. **Plan the PC check** (`references/measurement.md` → field protocol) and say exactly what the user should
   look at on the hospital PC. Cloud-only results are labelled as such.
9. **Record** new facts in `references/minka-findings.md` (date, state, numbers, how measured).

## Scripts (`scripts/`, Playwright with the preinstalled Chromium)

| Script | Answers | Notes |
|---|---|---|
| `bench.js` + `table.js` | whole-app CPU per process, latency, dropped frames per scenario | CPU x4 for latency, x1 for total CPU |
| `dayswitch.js [rate] [n]` | click→settled day, radio closed/open/spectrum | `COLD=1` first visits |
| `forced.js` | every style/layout pass during day switches with the JS that forced it | `RATE`, `NOVT=1` |
| `startup-trace.js` | cold start: forced passes by source, top scripts, CSS parse | CPU x4 |
| `hover.js` | card hover: JS, style recalcs, invalidations, paints, leftover animations | |
| `hover-radio.js` | card hover with radio closed / open / spectrum: per-hover main-thread cost, frames, JS, invalidations | `WIGGLE=1` keeps the pointer moving (as a hand does); `NOCLOCK=1` |
| `layers.js` | composited layers by size with their compositing reasons (idle, radio open) | `TOP=60` |
| `idle-loops.js` | rAF/timer/observer callbacks per second by source, process CPU and PSS | use `NOCLOCK=1` |
| `idle-frames.js` | idle frames/s, commits, paints and area, invalidations by element | real clock; `RADIO=1` |
| `gpu-census.js` | running animations (compositor vs repaint), backdrop-filter area, layers | |
| `ram-census.js` | documents, CSS rules, decoded image and canvas bytes per frame | |
| `coverage.js` | JS bytes never run / CSS never matched across desktop, rad, mobile sessions | candidates, not proof |
| `js-profile.js` | JS self time by function per scenario (switch, hover, modals, radio) next to style/layout totals | WASM/worker candidates; `SCEN=` |
| `switch-restyle.js` | per day switch: elements restyled, number of style passes, invalidations behind big passes | `RADIO=1` |
| `night-bench.js` | star sky on: layers, main-thread busy/commits, per-process CPU; seeded screenshot `res/night-<LABEL>.png` | `LABEL=` |
| `spectrum-bench.js` | radio playing: per-process CPU, main busy, commits; per-skin screenshots with a fixed analyser | `SKIN=`, `LABEL=` |
| `dither-bench.js` | initials-dither frame: drawImage per cell vs JS blit vs Rust/WASM, ms and pixel diff | `WASM=<.wasm>`, `RATE=` |
| `css-prune.js` | EXPERIMENT: copies of the calendar CSS without never-live style rules + ROUTES, to size the cascade's share | never ship output |
| `dom-compare.js` | the card list and side columns after the same clicks on two servers (old code on `A=8013`, new on `B=8012`): attributes, class tokens, inline style properties, text | `SEQ=`, `DAY=`; run the old tree with `MINKA_AUDIT_PORT=8013` |
| `shot.js` + `pixdiff.py` | seeded day screenshots (radio closed/open) and a pixel compare with counts per threshold | compare against a 2nd base run |
| `field-probe.js` | **on the PC**: LoAF, interaction latency split, CPU pressure, heap/DOM over time | paste in DevTools |

Env for all: `BASE=1` (changed files from git HEAD), `TARGET=cloud` (no navigator emulation), `NIGHT=1`, `INIT_CSS=` (inject a rule: restore an old rule of a page the server rewrites, e.g. index.html),
`NOCLOCK=1`, `ROUTES=url=/abs/file;...` (serve experimental files). Output in `scripts/res/` (git-ignored).

```sh
node scripts/local-audit-server.mjs &          # port 8012 (MINKA_AUDIT_PORT to change; scripts expect 8012)
cd .claude/skills/minka-hardware-performance/scripts
BASE=1 node dayswitch.js 4 12 && node dayswitch.js 4 12
NOCLOCK=1 node idle-loops.js
```

## References

- `references/target-hardware.md`: the PC, what its parts mean for Chrome's pipeline, what to check read-only.
- `references/measurement.md`: cloud harness rules, metric definitions, field protocol, separating Minka
  from the rest of Chrome, why CPU throttling does not model the iGPU.
- `references/minka-findings.md`: measured baseline and hot spots (2026-11), app device tiers.
- `references/playbook.md`: optimisation patterns with Minka examples, safe deletion protocol, what was
  tested and rejected, external expert sources and how far each applies.
