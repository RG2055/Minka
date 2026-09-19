/* Original Web Audio EQ. Shared by the radio layouts and the Lācītis player. */
(function () {
  'use strict';
  const bands = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const presets = {
    flat: {label:'Oriģināls', gains:[0,0,0,0,0,0,0,0,0,0]},
    bass: {label:'Bass', gains:[5,5,4,2,0,-1,0,0,1,1]},
    voice: {label:'Balss', gains:[-4,-3,-2,0,2,3,4,2,0,-1]},
    night: {label:'Nakts', gains:[-4,-3,-1,0,1,2,1,0,-2,-3]},
    rock: {label:'Roks', gains:[4,3,2,0,-1,-1,1,3,3,2]},
    electronic: {label:'Elektronika', gains:[4,4,2,0,-2,0,1,3,4,3]},
    acoustic: {label:'Akustika', gains:[0,1,2,2,1,1,2,2,1,0]}
  };
  function create(key = 'minka:eq:v1') {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(key)); } catch (_) {}
    let gains = Array.isArray(saved?.gains) && saved.gains.length === bands.length
      ? saved.gains.map(v => Number.isFinite(v) ? Math.max(-12, Math.min(12, v)) : 0) : bands.map(() => 0);
    let enabled = saved?.enabled !== false, context, filters, preamp;
    const snapshot = () => ({enabled, gains:[...gains], headroom:enabled ? Math.max(0, ...gains) : 0});
    function apply() {
      if (!context) return;
      // Attenuate before boosting; the existing output compressor remains last.
      preamp.gain.setTargetAtTime(Math.pow(10, -snapshot().headroom / 20), context.currentTime, .035);
      filters.forEach((n, i) => n.gain.setTargetAtTime(enabled ? gains[i] : 0, context.currentTime, .035));
    }
    function save() { try { localStorage.setItem(key, JSON.stringify(snapshot())); } catch (_) {} apply(); }
    return {
      snapshot,
      connect(ctx, input, outputs) {
        if (context) return;
        context = ctx;
        preamp = ctx.createGain();
        filters = bands.map((frequency, i) => {
          const filter = ctx.createBiquadFilter();
          filter.type = i === 0 ? 'lowshelf' : i === bands.length - 1 ? 'highshelf' : 'peaking';
          filter.frequency.value = frequency; filter.Q.value = 1.4;
          return filter;
        });
        input.connect(preamp); preamp.connect(filters[0]);
        filters.slice(0, -1).forEach((filter, i) => filter.connect(filters[i + 1]));
        outputs.forEach(output => filters.at(-1).connect(output));
        apply();
      },
      setBand(index, value) {
        if (!Number.isInteger(index) || index < 0 || index >= bands.length || !Number.isFinite(value)) return;
        gains[index] = Math.max(-12, Math.min(12, value)); save();
      },
      setEnabled(value) { enabled = !!value; save(); },
      preset(name) { if (!presets[name]) return; gains = [...presets[name].gains]; enabled = true; save(); }
    };
  }
  window.MinkaEqualizer = {create, bands, presets};
})();
