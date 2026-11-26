# RG Engine: budget and plan (2026-11-26)

Target: HP ProDesk 400 G6 Mini, i5-10500T (6C/12T, 35 W), Intel UHD 630 sharing 8 GB RAM, Windows 11, Chrome ~153
PWA, open 24 hours. Proxy in the cloud/Mac: Playwright, `deviceMemory=8` (the app's low-spec gate), CPU throttling x4,
1920x1080 at DPR 1.25. Philosophy: do as little unnecessary work as possible; no framework; a mechanism stays only if it
measurably helps on this hardware; the old render layer is removed, never covered over.

## Budget (on the proxy; a number over budget blocks a release)

| Area | Budget | Measured how |
|---|---|---|
| Day switch, click to painted | p50 <= 150 ms, p95 <= 300 ms, p99 <= 450 ms | dayswitch.js, 40 switches, cold and warm neighbours |
| Frames during interactions (switch, hover, open a window, scroll) | p95 <= 16.7 ms, p99 <= 33 ms; no LoAF > 100 ms | LoAF observer + rAF deltas |
| Input response (INP) | p75 <= 100 ms, worst <= 200 ms | Event Timing |
| Pointer move over the calendar | 0 forced layouts in handlers; <= 1 layout per frame | CDP Performance metrics, trace |
| Idle (nothing happening) | main thread <= 1 %, 0 rAF loops, timers <= 1/s total | idle-loops.js, idle-frames.js (NOCLOCK=1) |
| Radio playing (big or mini) | main thread <= 15 % | wave-perf script |
| Night panel closed | 0 animations running, 0 rAF | getAnimations(), rAF count |
| JS heap | <= 60 MB steady; growth after 24 h simulated <= 5 % | performance.memory sampling |
| Renderer process memory | <= 320 MB; DOM nodes flat after 1000 day switches | CDP SystemInfo / process metrics, node count |
| Caches | every cache bounded (tinted beds 24, thumbs 120, blob URLs revoked); canvases <= 40 | inventory + counters |
| Startup | first final paint <= 2.5 s; never the old look first (one reveal, no re-layout after it) | screencast frames |
| Code | executed / loaded JS >= 60 % (now ~37 %), CSS used >= 60 % (now ~32 %) | coverage.js over every state |

The "24 h" check is accelerated: a scripted soak of day switches, window opens/closes, radio play/pause, hovers and night
panel opens, at a rate that covers a full shift in ~20 minutes, sampling heap, nodes, listeners and canvases every minute.

## Platform features (Chrome 153 stable, Windows) and what they are for here

| Feature | Use in RG | Status |
|---|---|---|
| scheduler.postTask (background, TaskController abort) / scheduler.yield | neighbour-day preparation at background priority, aborted on a switch; yield inside long builds | adopt if the day-switch p95 improves |
| Element.moveBefore() | move person cards between columns/days without restarting their animations or images | adopt where cards move today by re-creation |
| content-visibility: hidden / auto | closed dock windows and the parked night panel keep their DOM, skip layout and paint | partly in use; extend after measuring |
| Long Animation Frames + Event Timing | the field metrics on the hospital PC (a small in-app recorder, off by default) | adopt (measurement only) |
| Compute Pressure (PressureObserver) | shed decorative work at "serious"/"critical" | only as an extra signal: it reports only while the window has focus |
| navigator.cpuPerformance (Chrome 152) | none: it is a core-count tier, the i5-10500T lands high | do not use as a gate |
| navigator.deviceMemory | the low-spec gate; since Chrome 147 desktops report up to 32, so 16 GB machines are no longer "low-spec" | re-check every use of the gate |
| Element-scoped View Transitions (Chrome 147) | the held day switch already uses #grafiks-app.startViewTransition | keep |
| OffscreenCanvas in a worker | spectrum | no: the wave now draws in ~0.1 ms/frame, the posting would cost more |
| HTML-in-Canvas | none | origin trial only, API still changing |

Principles kept from Jetpack Compose's performance skill, SwiftUI (WWDC25) and ArkUI: read a changing value in the
latest phase that needs it (transform/opacity or canvas, never a rebuild); never read layout after writing styles in the
same frame; skip by identity (a version counter per card), not deep comparison; key nodes by person id and reuse them;
no allocation in draw loops; one delegated listener per container; stop everything a hidden part does; measure before
and after every change.

## Removing the old render layer (order)

1. One reveal: the boot gate waits for the final look (side card faces, middle cards and mood, corridor placement) so the
   old look is never shown; the 7 s safety net stays only as a failure path.
2. Side cards: the legacy face builders that calendar.js runs before mk-side-faces.js rewrites them.
3. Radio: the old per-skin layouts and visualizers in js/radio.js that the one skeleton (#rmx) never shows on desktop.
4. Calendar cards: paths the RG Engine morph made redundant (rebuild-then-patch observers already replaced by rg:patched).
5. CSS: rules that never match (mk-layer-fix-v1.css, bundle.css), then the overridden ones.
Each step: coverage proves the code never runs in any state; screenshots identical; e2e and unit tests pass; the budget
table re-measured.

## Ideas taken from microsoft/webui, pmndrs/scheduler, vercel-labs/wterm, dashersw/gea, RaananW/underglass (read, not installed)

Ranked by gain for code; each is adopted only after its benchmark passes on the proxy.

1. One frame scheduler, three lanes: a rAF lane that stops itself when no job has work and restarts on invalidate()
   (pmndrs/scheduler idea), flushed in phases read -> write (wterm); a timer lane for anything at 10 Hz or slower (clock,
   weather) so it never rides rAF (pmndrs' fps limit still wakes every frame: not copied); an idle lane
   (requestIdleCallback with a timeout / scheduler.postTask background). After a pause reset the clock, never catch up
   (underglass). Only existing JS loops move into it; working CSS animations stay. Proof: rAF callbacks/s, idle CPU,
   timers, frames p99.
2. Final look first: one <template> per card type, cloneNode(true), then write only bound text/attributes (WebUI's
   cached templates; their "server renders the initial view" done in the browser from the roster JSON). This is how the
   old render layer goes away. Proof: boot style recalcs/layouts, time to final paint, heap after boot, pixel identity.
3. Activate heavy dock windows on first interaction: capture pointerdown/focusin on the button, load, replay the click
   (WebUI interaction hydration). Proof: boot heap and script-eval ms, first-open p95.
4. Release at idle, bounded caches: neighbour days +-1 only, closed windows' DOM/templates freed at idle (WebUI lazy
   release, wterm's 200-row bound), node/heap asserts in the soak. Proof: heap and node slope over the 24 h soak.
5. content-visibility:auto + contain-intrinsic-size:auto on offscreen panels (WebUI w-render="lazy"). Proof: layout/paint ms.
6. One delegated document listener per event type, handlers on the elements (gea). Proof: listener count, heap.
7. Write only when the value differs; nodeValue on existing text nodes (gea patch, wterm rows): check the morph does it.
8. Measurement discipline (WebUI perf guide): JS heap and renderer private memory reported apart, GC before heap reads,
   several runs, 10 s sampling in the soak (wterm harness).

Not adopted: WebUI's Rust SSR / protocol.bin / template packs (need a server and a build step; our data is the Sheets
API in the browser); Shadow DOM on repeated cards (WebUI itself advises Light DOM there); gea's compiler/Proxy stores
(need Vite; its no-build path re-renders with innerHTML, worse than our morph); pmndrs/scheduler as a dependency
(pre-1.0 npm TS, more than we need); underglass (Chrome 157 HTML-in-Canvas + WebGPU, ~3x slower than DOM in its own
numbers, more GPU memory on a UHD 630 that shares RAM); wterm's WASM/WebGL renderer.

## RG Card Engine (design inputs, 2026-11-26)

One card structure for every skin; a skin is a declaration (static layer, dynamic fields, tokens), never its own renderer.
Strategies to benchmark in the Lab (real data, x1/x4/x6; Style, Layout, Paint, Compositing ms per switch, not node counts):
A cards kept by person id; B a shared card pool; C hybrid (a person's card kept when they work the next day, the rest
from a bounded pool). Plus a 50-synthetic-skin test: switch time with 50 skins must stay ~ with 5.

Techniques taken (sources read, not installed):
- Render signature that skips all work: every field the skin reads, listed explicitly, + size, DPR, theme
  (XMage CardView.getRenderSignature / imageKey; Aurora's identity check per entity).
- Static vs dynamic split: a fixed skeleton; timers, fatigue %, emoji in their own nodes, text/transform updates only
  (XMage draws tap as a paint-time rotation).
- Skin Cache: static layers (texture, frame, dither, glass) pre-composited once into an OffscreenCanvas -> blob URL /
  ImageBitmap, keyed skinId|w|h|DPR|theme|assetVersion, shared by all cards and days; the promise is cached so
  concurrent requests share one load, misses cached too, one master size stepped down (MTG Crucible; XMage cache).
- LRU with a byte budget (e.g. 32 MB), close()/revokeObjectURL on eviction spread over frames (~5/frame, PixiJS), one
  clearAll registry (XMage ImageCaches).
- Pool reset discipline: everything a skin sets is removed on reuse (PixiJS pooling, XMage transferResources); a test
  diffs a card switched A->B against a fresh B.
- No per-card filter / backdrop-filter / mix-blend-mode / masks: baked into the skin bitmap (PixiJS: filters and masks
  break batches and cost memory).
- contain: strict per card; content-visibility: auto + contain-intrinsic-size for off-screen cards.
- Async decode with a stale guard (img.decode(), XMage's stamp counter); neighbour days' skins prefetched while idle.
- Skin CSS scoped (@scope / data-skin attribute), so 50 skins do not add selector cost to every style recalc.
