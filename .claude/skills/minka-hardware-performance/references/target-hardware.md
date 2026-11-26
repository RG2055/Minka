# Target hardware and what it means for Chrome

Primary PC: HP ProDesk 400 G6 Mini, Windows 11, Chrome (installed PWA), Minka open up to 24 hours.
Items marked *(verify)* are spec-sheet knowledge; confirm on the PC with the read-only checks at the end.

## Parts

| Part | Facts | Consequence for Minka |
|---|---|---|
| CPU | Intel Core i5-10500T, Comet Lake (Skylake-family cores), 6 cores / 12 threads, 2.3 GHz base, up to 3.8 GHz turbo, 12 MB L3, **35 W TDP** (T-series), AVX2, no AVX-512 | Blink's main thread is one thread: single-core speed decides style/layout/JS latency. In a mini case at 35 W, long busy periods drop toward base clock. Spare cores help raster threads, workers and the GPU process, not the main thread. |
| GPU | Intel UHD Graphics 630 (Gen9.5 GT2, 24 EUs, ~350 MHz base, ~1.1 GHz max) *(verify name in chrome://gpu)* | Modest fill rate. Chrome on Windows composites with ANGLE → Direct3D 11 and DirectComposition. Full-screen layers, blends, blur, large canvases and overdraw cost bandwidth on every frame. |
| Memory | 8 GB DDR4-2666 shared by CPU and GPU; 2 SO-DIMM slots, so 8 GB may be **one stick = single channel** *(verify "Slots used")* | No VRAM: every GPU texture (composited layer tiles, canvases, decoded images uploaded to the GPU) is system RAM, counted partly in Chrome's GPU process. Single channel halves bandwidth, and the iGPU feels it first. |
| Display | likely 1920×1080, DPR 1 or 1.25 *(verify: field-probe prints dpr and screen)* | Tile memory and raster scale with CSS px × DPR². |
| OS | Windows 11 DWM composes Chrome's swap chain | Every frame Chrome presents also costs `dwm.exe`, which is outside Chrome's numbers. Idle frames are paid twice. |
| Browser | Chrome stable; navigator reports hardwareConcurrency 12, deviceMemory 8 (Chrome caps at 8) | Minka's tiers read these (see minka-findings.md → tiers): lowSpec is **on** (memory ≤ 8), but code that tests only cores (≤ 4) takes the "fast PC" branch. |

## Rules of thumb for this machine

- **Wakeups and frames dominate idle cost.** A requestAnimationFrame loop wakes the renderer, compositor, GPU
  process and DWM each vsync even when it draws less often. Frame-rate gating inside rAF does not save the
  wakeups; schedule at the drawing rate instead.
- **Compositor-only is cheap, repaint is not.** Transform and opacity on an already composited layer avoid raster.
  Animating box-shadow, filter, background-position, colours or size re-rasters every step.
- **Layers are memory.** Each composited layer holds tiles in shared RAM (measured: 48 layers ≈ 65 MB of tiles at
  1080p idle, 54 layers ≈ 77 MB with radio open). Do not add `will-change` broadly; promote only what animates,
  and only while it animates.
- **No backdrop-filter / large blur.** Minka's theme already removed glass blur ("Void" background,
  `--glass-blur: 0px`); keep it that way.
- **Area matters more than count.** A 10×10 px paint is nothing; a full-viewport layer invalidated once a second
  is 2 Mpx of raster and composite on a 24-EU GPU.
- **Main-thread spikes hurt twice**: the 35 W budget lowers clocks under sustained load, so batch work and let
  the CPU idle between bursts rather than spreading constant small work.
- **WebGL works but is not free**: Minka's live dither picture renders in a worker at 15 frames a second only
  where a real GPU exists (it falls back to a still frame in software). Its cost exists only on the PC.

## Read-only checks on the PC (no settings change)

1. `chrome://version`: Chrome version and command line (look for unusual flags set by IT).
2. `chrome://gpu`: Graphics Feature Status (Canvas, Compositing, Rasterization, WebGL, WebGPU should say
   "Hardware accelerated"), GPU0 vendor and device, **driver version and date**, "Problems Detected" (driver
   bug workarounds / blocklisted features). Use the "Copy Report to Clipboard" button and save the text.
   Old Intel drivers may have features disabled; we adapt measurements to that, we never change the driver.
3. `chrome://policy`: whether DevTools are allowed (DeveloperToolsAvailability); decides whether
   `field-probe.js` can run.
4. Windows Task Manager → Performance → Memory: speed, **Slots used** (1 of 2 = single channel), hardware
   reserved. → GPU 0: Shared GPU memory, 3D engine load.
5. `field-probe.js` output header: Chrome version, dpr, screen size, threads, memoryGB.
