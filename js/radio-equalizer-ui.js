/* Accessible, native controls over the shared ten-band audio engine. */
(function () {
  'use strict';
  window.MinkaEqualizer.mount = function ({engine, trigger, ensure, balance}) {
    let dialog;
    function render() {
      const state = engine.snapshot();
      dialog.querySelector('[data-enable]').checked = state.enabled;
      dialog.querySelectorAll('[data-band]').forEach(input => {
        const value = state.gains[Number(input.dataset.band)];
        input.value = value;
        input.disabled = !state.enabled;
        input.setAttribute('aria-valuetext', `${value > 0 ? '+' : ''}${value} dB`);
        input.nextElementSibling.value = `${value > 0 ? '+' : ''}${value}`;
      });
      dialog.querySelectorAll('[data-preset]').forEach(button => {
        const match = state.enabled && window.MinkaEqualizer.presets[button.dataset.preset].gains.every((v, i) => v === state.gains[i]);
        button.setAttribute('aria-pressed', String(match));
      });
      dialog.querySelector('polyline').setAttribute('points', state.gains.map((v, i) => `${i * 100 / 9},${25 - (state.enabled ? v : 0) * 1.6}`).join(' '));
      dialog.querySelector('[data-headroom]').textContent = state.enabled ? `Līmeņa rezerve: −${state.headroom} dB` : 'EQ izslēgts · tava līkne ir saglabāta';
      trigger.dataset.eqActive = String(state.enabled && state.gains.some(v => v !== 0));
    }
    function change(action) {
      try { ensure(); action(); render(); dialog.querySelector('[data-error]').textContent = ''; }
      catch (_) { dialog.querySelector('[data-error]').textContent = 'Šajā pārlūkā skaņas apstrāde nav pieejama.'; }
    }
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Atvērt 10 joslu ekvalaizeru');
    trigger.title = '10 joslu ekvalaizers';
    trigger.addEventListener('click', () => {
      if (!dialog) {
        dialog = document.createElement('dialog'); dialog.className = 'minka-eq';
        dialog.setAttribute('aria-label', 'Ekvalaizers');
        dialog.innerHTML = `<header><div><span class="minka-eq-kicker">Tava skaņa</span><h2>Ekvalaizers</h2></div><button type="button" data-close aria-label="Aizvērt ekvalaizeru">×</button></header>
          <div class="minka-eq-switch"><label><input type="checkbox" data-enable> Ieslēgts</label><span>10 joslas · ±12 dB</span></div>
          <div class="minka-eq-presets" role="group" aria-label="Skaņas preseti">${Object.entries(window.MinkaEqualizer.presets).map(([id, p]) => `<button type="button" data-preset="${id}" aria-pressed="false">${p.label}</button>`).join('')}</div>
          <svg class="minka-eq-curve" viewBox="-2 0 104 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 25H100"/><polyline fill="none"/></svg>
          <div class="minka-eq-bands">${window.MinkaEqualizer.bands.map((hz, i) => `<label><span>${hz >= 1000 ? hz / 1000 + 'k' : hz}</span><input type="range" orient="vertical" min="-12" max="12" step="1" value="0" data-band="${i}" aria-label="${hz} herci"><output>0</output></label>`).join('')}</div>
          ${balance ? '<label class="minka-eq-balance">Balanss <span>Kreisā</span><input type="range" min="-1" max="1" step="0.05" value="0" data-balance aria-label="Kreisā un labā kanāla balanss"><span>Labā</span></label>' : ''}
          <footer><span data-headroom></span><button type="button" data-reset>Atiestatīt</button></footer><p data-error role="status"></p>`;
        document.body.append(dialog);
        dialog.querySelector('[data-close]').onclick = () => dialog.close();
        dialog.addEventListener('close', () => { trigger.setAttribute('aria-expanded', 'false'); trigger.focus({preventScroll:true}); });
        dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
        dialog.querySelector('[data-enable]').onchange = e => change(() => engine.setEnabled(e.target.checked));
        dialog.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => change(() => engine.preset(b.dataset.preset)));
        dialog.querySelectorAll('[data-band]').forEach(input => input.oninput = () => change(() => engine.setBand(Number(input.dataset.band), Number(input.value))));
        dialog.querySelector('[data-balance]')?.addEventListener('input', e => change(() => balance(Number(e.target.value))));
        dialog.querySelector('[data-reset]').onclick = () => change(() => { engine.preset('flat'); if (balance) { balance(0); dialog.querySelector('[data-balance]').value = 0; } });
      }
      render(); dialog.showModal(); trigger.setAttribute('aria-expanded', 'true');
    });
    return {refresh:() => { if (dialog) render(); }};
  };
})();
