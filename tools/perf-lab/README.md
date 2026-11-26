# RG Engine Performance Lab

Local only (MacBook, real Google Chrome with GPU on, real RG data). Not shipped: scripts/build-pages.mjs ships a fixed list
of folders. Results, screenshots and traces go to ~/RG-perf-lab/runs/<time>/ (outside the repo: they hold real names).

1. Servers: the version under test on :8028 (`minka-perf-lan`, the working tree), the original RG on :8041 (`rg1-real`,
   a detached worktree ../Minka-baseline at f07f8134). Both serve real data (scripts/local-daybook-server.mjs).
2. Once: `node tools/perf-lab/lab.mjs --login` and log in to RG in each window (own profiles in ~/RG-perf-lab).
3. Gate for every RG Engine change: `node tools/perf-lab/lab.mjs` (CPU x1 and x4, every scenario, short counts).
   Full: `--full` (x1 x2 x4 x6, 1000-switch soak, 100 radio cycles). Traces: `--trace`.
4. Open ~/RG-perf-lab/runs/<time>/report.html: Before/After with p50/p95/p99, frames, dropped frames, long frames,
   INP, renderer/GPU CPU, memory, soak curves (heap, nodes, listeners, renderer MB) and visual diffs.

CPU throttling models the CPU only; it is not an Intel UHD 630. GPU numbers compare versions on this Mac, not machines.
