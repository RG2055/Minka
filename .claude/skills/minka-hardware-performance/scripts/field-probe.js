/* Minka field probe: measures the app itself on the real PC, apart from the rest of Chrome.
   Paste into the DevTools console of the Minka window (top frame) and press Enter. Nothing is installed,
   stored or sent anywhere; reloading the page removes it. It reads only browser performance APIs.

     MinkaProbe.start()              begin (default 5 minutes, then it prints the summary by itself)
     MinkaProbe.start({ minutes: 30, frames: false })
     MinkaProbe.report()             print the summary now (also returned as an object, copy() it)
     MinkaProbe.stop()

   What it records, per same-origin document (the shell and the calendar iframe):
   - Long animation frames (LoAF, >50 ms): count, time, forced style+layout, and the scripts behind them.
   - Interactions (Event Timing): p50/p90/max latency per kind, split into input delay / processing / presentation.
   - CPU pressure (PressureObserver, Chrome 125+): time in nominal / fair / serious / critical. This is the whole
     machine, not Minka: read it next to the Chrome Task Manager.
   - JS heap and DOM size every minute (heap growth over hours = a leak candidate).
   - frames: true counts frames with requestAnimationFrame. That itself wakes the page 60 times a second and
     changes idle cost, so it is off by default; use it only for short runs of scrolling/switching/radio. */
(function () {
  if (window.MinkaProbe && window.MinkaProbe.stop) window.MinkaProbe.stop();
  const docs = () => {
    const out = [['shell', window]];
    for (const f of document.querySelectorAll('iframe')) {
      try { const w = f.contentWindow; if (w && w.document && w.location.href !== 'about:blank') out.push([w.location.pathname.split('/').slice(-2).join('/'), w]); } catch (_) { /* other origin */ }
    }
    return out;
  };
  let S = null;
  const pct = (a, q) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]); };
  function start(opt) {
    opt = Object.assign({ minutes: 5, frames: false }, opt || {});
    stop();
    S = { t0: performance.now(), opt, obs: [], timers: [], loaf: {}, events: {}, pressure: { state: null, since: performance.now(), ms: {} }, mem: [], frames: { n: 0, long: 0 } };
    for (const [name, w] of docs()) {
      const L = (S.loaf[name] = { n: 0, ms: 0, blockingMs: 0, forcedMs: 0, scripts: {} });
      try {
        const o = new w.PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            L.n++; L.ms += e.duration; L.blockingMs += e.blockingDuration || 0;
            for (const s of e.scripts || []) {
              L.forcedMs += s.forcedStyleAndLayoutDuration || 0;
              const k = (s.sourceURL || '').replace(/^.*?\/\/[^/]+\//, '').replace(/\?.*/, '') + ' ' + (s.sourceFunctionName || s.invoker || '');
              const r = (L.scripts[k] ||= [0, 0, 0]); r[0]++; r[1] += s.duration; r[2] += s.forcedStyleAndLayoutDuration || 0;
            }
          }
        });
        o.observe({ type: 'long-animation-frame', buffered: false }); S.obs.push(o);
      } catch (_) { L.unsupported = true; }
      try {
        const o = new w.PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (!e.interactionId) continue;
            const k = name + ' ' + e.name;
            const r = (S.events[k] ||= { d: [], input: [], proc: [], pres: [] });
            r.d.push(e.duration); r.input.push(e.processingStart - e.startTime); r.proc.push(e.processingEnd - e.processingStart); r.pres.push(e.startTime + e.duration - e.processingEnd);
          }
        });
        o.observe({ type: 'event', durationThreshold: 16, buffered: false }); S.obs.push(o);
      } catch (_) {}
    }
    if ('PressureObserver' in window) {
      try {
        const P = S.pressure;
        const po = new PressureObserver((recs) => { const now = performance.now(); for (const r of recs) { if (P.state) P.ms[P.state] = (P.ms[P.state] || 0) + (now - P.since); P.state = r.state; P.since = now; } });
        po.observe('cpu', { sampleInterval: 2000 }).catch(() => {}); S.obs.push(po);
      } catch (_) {}
    }
    const sampleMem = () => {
      const row = { min: +((performance.now() - S.t0) / 60000).toFixed(1) };
      for (const [name, w] of docs()) { row[name + ' nodes'] = w.document.getElementsByTagName('*').length; }
      if (performance.memory) { row.heapMB = +(performance.memory.usedJSHeapSize / 1048576).toFixed(1); }
      S.mem.push(row);
    };
    sampleMem(); S.timers.push(setInterval(sampleMem, 60000));
    if (opt.frames) {
      let last = 0; const F = S.frames;
      const tick = (t) => { if (!S) return; if (last) { F.n++; if (t - last > 25) F.long++; } last = t; S.raf = requestAnimationFrame(tick); };
      S.raf = requestAnimationFrame(tick);
    }
    S.timers.push(setTimeout(() => { console.log('MinkaProbe: time is up'); report(); stop(); }, opt.minutes * 60000));
    console.log('MinkaProbe: recording for ' + opt.minutes + ' min' + (opt.frames ? ' (frame counter on)' : '') + '. Use the app as usual; MinkaProbe.report() any time.');
  }
  function report() {
    if (!S) { console.log('MinkaProbe: not running'); return null; }
    const secs = (performance.now() - S.t0) / 1000;
    if (S.pressure.state) { S.pressure.ms[S.pressure.state] = (S.pressure.ms[S.pressure.state] || 0) + (performance.now() - S.pressure.since); S.pressure.since = performance.now(); }
    const out = { seconds: Math.round(secs), ua: navigator.userAgent.replace(/^.*(Chrome\/[\d.]+).*$/, '$1'), dpr: devicePixelRatio, screen: screen.width + 'x' + screen.height, threads: navigator.hardwareConcurrency, memoryGB: navigator.deviceMemory, longFrames: {}, interactions: [], cpuPressureSeconds: {}, memory: S.mem };
    for (const [name, L] of Object.entries(S.loaf)) {
      out.longFrames[name] = L.unsupported ? 'unsupported' : { perMinute: +(L.n / (secs / 60)).toFixed(1), msPerMinute: Math.round(L.ms / (secs / 60)), forcedStyleLayoutMs: Math.round(L.forcedMs), top: Object.entries(L.scripts).sort((a, b) => b[1][1] - a[1][1]).slice(0, 8).map(([k, v]) => ({ script: k.slice(0, 90), n: v[0], ms: Math.round(v[1]), forcedMs: Math.round(v[2]) })) };
    }
    for (const [k, r] of Object.entries(S.events)) out.interactions.push({ kind: k, n: r.d.length, p50: pct(r.d, 0.5), p90: pct(r.d, 0.9), max: pct(r.d, 1), inputP90: pct(r.input, 0.9), processingP90: pct(r.proc, 0.9), presentationP90: pct(r.pres, 0.9) });
    out.interactions.sort((a, b) => b.p90 - a.p90);
    for (const [k, v] of Object.entries(S.pressure.ms)) out.cpuPressureSeconds[k] = Math.round(v / 1000);
    if (S.opt.frames) out.frames = { perSecond: +(S.frames.n / secs).toFixed(1), slowFramesPct: S.frames.n ? +(100 * S.frames.long / S.frames.n).toFixed(1) : 0 };
    console.log('MinkaProbe summary', out);
    if (out.interactions.length) console.table(out.interactions);
    return out;
  }
  function stop() {
    if (!S) return;
    S.obs.forEach((o) => { try { o.disconnect(); } catch (_) {} });
    S.timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
    if (S.raf) cancelAnimationFrame(S.raf);
    S = null;
  }
  window.MinkaProbe = { start, report, stop };
  console.log('MinkaProbe ready: MinkaProbe.start() / .report() / .stop()');
})();
