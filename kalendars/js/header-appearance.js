/* Local header appearance. Deliberately independent of shared worker skins. */
(function (host) {
  'use strict';
  const KEY = 'mk_header_appearance_v1';
  const skins = ['panorama', 'hybrid'];
  const seeds = { olive: '#d9ce7f', mint: '#a5d4ba', peach: '#f1c59e', rose: '#efb4cb', lilac: '#d5b7e8', blue: '#afccec' };
  const palettes = ['scene', ...Object.keys(seeds), 'radio'];
  const backgrounds = ['coast', 'riga', 'mix'];
  // The collection is the default everywhere. Version 1 wrote 'coast' for
  // anyone who never chose, so a v1 'coast' is treated as unchosen; a coast
  // picked on purpose from now on is saved as version 2 and stays.
  function normalize(value) {
    const s = value && typeof value === 'object' ? value : {};
    const legacyCoast = s.version !== 2 && s.background === 'coast';
    return { version: 2, skin: s.skin === 'material' ? 'hybrid' : skins.includes(s.skin) ? s.skin : 'panorama',
      palette: palettes.includes(s.palette) ? s.palette : 'scene', daily: s.daily === true,
      motion: s.motion !== false, background: backgrounds.includes(s.background) && !legacyCoast ? s.background : 'mix', day: /^\d{4}-\d{2}-\d{2}$/.test(s.day || '') ? s.day : '' };
  }
  function dayKey(now = new Date()) {
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }
  function shuffle(value, day = dayKey(), random = Math.random) {
    const s = normalize(value);
    const choose = list => list[Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)))];
    return { ...s, skin: choose(skins.filter(x => x !== s.skin)),
      palette: choose(['scene', ...Object.keys(seeds)].filter(x => x !== s.palette)), day };
  }
  function resolveDay(value, day = dayKey(), random = Math.random) {
    const s = normalize(value);
    return s.daily && s.day !== day ? shuffle(s, day, random) : s;
  }
  function read(storage) { try { return normalize(JSON.parse(storage.getItem(KEY))); } catch (_) { return normalize(); } }
  function write(storage, value) { try { storage.setItem(KEY, JSON.stringify(normalize(value))); return true; } catch (_) { return false; } }
  function rgb(hex) { return hex.match(/[a-f\d]{2}/gi).map(n => parseInt(n, 16)); }
  function hex(values) { return '#' + values.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, weight) { const next = rgb(b); return hex(rgb(a).map((v, i) => v * (1 - weight) + next[i] * weight)); }
  function palette(seed) {
    if (!/^#[a-f\d]{6}$/i.test(seed || '')) seed = seeds.mint;
    let accent = mix(seed, '#ffffff', .38);
    while (contrast('#101b19', accent) < 7) accent = mix(accent, '#ffffff', .15);
    return { surface: mix(seed, '#0c1418', .78), raised: mix(seed, '#182025', .73),
      text: mix(seed, '#ffffff', .9), muted: mix(seed, '#ffffff', .58),
      accent, ink: '#101b19' };
  }
  function contrast(a, b) {
    const luminance = c => rgb(c).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
      .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }
  function resolveColor(value, radio, scene, radioAccent = scene) {
    const s = normalize(value);
    if (radio?.open && /^#[a-f\d]{6}$/i.test(radio.album || '')) return { source: 'album', seed: radio.album };
    return { source: 'palette', seed: seeds[s.palette] || (s.palette === 'radio' ? radioAccent : scene) };
  }
  const core = { KEY, seeds, normalize, dayKey, shuffle, resolveDay, read, write, palette, contrast, resolveColor };
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (!host || !host.document) return;
  const doc = host.document, root = doc.documentElement;
  if (root.classList.contains('mk-mobile-shell')) return;
  let storage;
  try { storage = host.localStorage; } catch (_) {}
  let state = resolveDay(read(storage));
  root.dataset.headerSkin = state.skin;
  root.dataset.headerPalette = state.palette;
  if (state.daily) write(storage, state);

  function mount() {
    const header = doc.getElementById('minkaBarWrap');
    if (!header) return;
    let dialog, opener, saveOK = true, radioObserver, radioBodyObserver, radioNode, scheduled = false;
    const imageColors = new Map(), boundImages = new WeakSet(), numberValues = new WeakMap();
    const reduced = host.matchMedia('(prefers-reduced-motion: reduce)');
    const modest = !!host.__mkPerfProfile?.lowSpec || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4);
    const iconPaths = {
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
      moon: '<path d="M20.4 13.4A8.5 8.5 0 0 1 10.6 3.6 8.5 8.5 0 1 0 20.4 13.4Z"/>'
    };
    function glyph(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + iconPaths[name] + '</svg>'; }
    function sceneSeed() {
      const img = header.querySelector('.mk-header-scenic-img');
      if (img && !boundImages.has(img)) {
        boundImages.add(img);
        img.addEventListener('load', schedule);
        img.addEventListener('error', schedule);
      }
      const src = img?.currentSrc || img?.src;
      if (img?.complete && img.naturalWidth && !imageColors.has(src)) {
        imageColors.set(src, null);
        host.MinkaImagePalette?.extract(img).then(result => {
          if (result) { imageColors.set(src, mix(result.dominant, '#ffffff', .25)); schedule(); }
        });
      }
      const period = header.querySelector('#minkaBarInner')?.dataset.headerPeriod || root.dataset.minkaHeaderPeriod || header.dataset.weatherPeriod;
      return imageColors.get(src) || ({ morning: seeds.peach, day: seeds.mint, sunset: seeds.olive, night: seeds.blue })[period] || seeds.mint;
    }
    function getRadio() {
      try { return host.parent !== host ? host.parent.document.getElementById('radioWindow') : null; } catch (_) { return null; }
    }
    function radioSeed() {
      const node = getRadio();
      if (!node) return sceneSeed();
      const style = host.parent.getComputedStyle(node);
      const raw = style.getPropertyValue('--pixel-accent').trim();
      if (node.dataset.radioLayout === 'pixel' && /^#[a-f\d]{6}$/i.test(raw)) return raw;
      const channels = style.getPropertyValue('--radio-accent-rgb').trim().split(',').map(Number);
      return channels.length === 3 && channels.every(n => Number.isFinite(n) && n >= 0 && n <= 255) ? hex(channels) : sceneSeed();
    }
    function watchRadio() {
      const next = getRadio();
      if (next === radioNode) return;
      radioObserver?.disconnect(); radioNode = next;
      if (next) {
        radioObserver = new MutationObserver(schedule);
        radioObserver.observe(next, { attributes: true, attributeFilter: ['style', 'data-radio-layout', 'hidden'] });
        radioBodyObserver?.disconnect();
        radioBodyObserver = new MutationObserver(schedule);
        radioBodyObserver.observe(next.ownerDocument.body, { attributes: true, attributeFilter: ['class'] });
      }
    }
    function radioStatus() {
      const node = getRadio();
      if (!node) return { open: false, album: '' };
      const style = host.parent.getComputedStyle(node), classes = node.ownerDocument.body.classList;
      return { open: !classes.contains('radio-hidden') && !classes.contains('radio-idle') && !node.hidden && style.display !== 'none',
        album: style.getPropertyValue('--radio-album-color').trim() };
    }
    function paint() {
      scheduled = false;
      root.dataset.headerSkin = state.skin;
      host.MinkaHeaderScenic?.setScene(state.background);
      const effective = resolveColor(state, radioStatus(), sceneSeed(), state.palette === 'radio' ? radioSeed() : undefined);
      root.dataset.headerPalette = effective.source === 'album' ? 'album' : state.palette;
      root.dataset.headerColorSource = effective.source;
      const p = palette(effective.seed);
      [header, dialog].filter(Boolean).forEach(node => {
        for (const [name, value] of Object.entries(p)) {
          if (node.style.getPropertyValue('--hs-' + name) !== value) node.style.setProperty('--hs-' + name, value);
        }
        node.style.setProperty('--hs-surface-rgb', rgb(p.surface).join(','));
      });
      root.classList.toggle('mk-header-motion', state.motion && !reduced.matches && !modest && !root.classList.contains('mk-no-anim'));
      watchRadio();
      syncControls();
    }
    function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(paint); } }
    function persist() { saveOK = write(storage, state); paint(); }
    function set(value) {
      state = normalize({ ...state, ...value });
      // A deliberate selection wins over a daily shuffle immediately.
      if ('skin' in value || 'palette' in value) state.daily = false;
      persist();
    }
    function syncControls() {
      if (!dialog) return;
      dialog.querySelectorAll('[data-skin]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skin === state.skin)));
      dialog.querySelectorAll('[data-background]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.background === state.background)));
      const rotate = dialog.querySelector('[data-rotate]'); if (rotate) rotate.hidden = state.background !== 'mix';
      dialog.querySelector('#hsBackgroundHint').textContent = state.background === 'mix'
        ? 'Nejauši no kolekcijas — gaišie attēli rītā un dienā, siltie vakarā, tumšie naktī; piekraste un Rīga arī piedalās. Mainās ik pēc 25 minūtēm un pēc Rīgas laika.'
        : 'Rīts, diena, vakars un nakts mainās automātiski pēc Rīgas laika.';
      dialog.querySelectorAll('[data-palette]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.palette === state.palette)));
      dialog.querySelector('#hsDaily').checked = state.daily;
      dialog.querySelector('#hsMotion').checked = state.motion;
      dialog.querySelector('#hsStatus').textContent = saveOK ? 'Saglabāts šajā pārlūkā' : 'Izvēle darbojas, bet pārlūks neļauj to saglabāt.';
      dialog.querySelector('#hsPaletteHint').textContent = root.dataset.headerColorSource === 'album'
        ? 'Radio atvērts: krāsa seko albumam. Izvēlētā palete atgriezīsies, aizverot radio.'
        : state.palette === 'radio' && !getRadio()
        ? 'Radio nav atvērts šajā skatā — pagaidām krāsa seko panorāmai.'
        : state.skin === 'panorama' ? 'Panorāmā palete maina izvēlētās dienas akcentu. Material skinos — visu galveni.'
        : 'No panorāmas: krāsa seko diennakts attēlam. Izvēloties paleti, tā paliek nemainīga.';
    }
    function open() {
      if (!dialog) buildDialog();
      if (dialog.open) return;
      opener = doc.activeElement;
      paint(); dialog.showModal();
      doc.getElementById('headerAppearanceBtn')?.setAttribute('aria-expanded', 'true');
    }
    function buildDialog() {
      dialog = doc.createElement('dialog'); dialog.id = 'headerAppearance';
      dialog.setAttribute('aria-labelledby', 'hsTitle');
      dialog.innerHTML = '<div class="hs-heading"><div><span class="hs-eyebrow">Izskats</span><h2 id="hsTitle">Galvene</h2></div><button type="button" data-close aria-label="Aizvērt galvenes izskatu">×</button></div>' +
        '<p class="hs-intro">Tas pats izkārtojums. Cita noskaņa.</p>' +
        '<div class="hs-skins" role="group" aria-label="Galvenes skins">' +
        [['panorama', 'Panorāma', 'Tavs pašreizējais skats'], ['hybrid', 'Panorāma + Material', 'Panorāmas fons, maigas pogas']].map(([key, title, detail]) =>
          '<button type="button" data-skin="' + key + '" aria-pressed="false"><span class="hs-preview hs-preview-' + key + '" aria-hidden="true"><i></i><i></i><i></i><b></b><em></em></span><span class="hs-choice-title">' + title + '</span><small>' + detail + '</small></button>').join('') + '</div>' +
        '<h3>Panorāma</h3><div class="hs-backgrounds" role="group" aria-label="Panorāma"><button type="button" data-background="coast" aria-pressed="false">Latvijas piekraste</button><button type="button" data-background="riga" aria-pressed="false">Rīga</button><button type="button" data-background="mix" aria-pressed="false">Kolekcija</button><button type="button" data-rotate class="hs-rotate" hidden>Cits attēls</button></div><p id="hsBackgroundHint" class="hs-hint"></p>' +
        '<h3>Krāsas</h3><div class="hs-palettes" role="group" aria-label="Galvenes palete">' +
        [['scene', 'No panorāmas'], ['olive', 'Olīva'], ['mint', 'Piparmētra'], ['peach', 'Persiks'], ['rose', 'Roze'], ['lilac', 'Ceriņi'], ['blue', 'Zils'], ['radio', 'Sekot radio']].map(([key, label]) =>
          '<button type="button" data-palette="' + key + '" aria-pressed="false"><i aria-hidden="true" style="--swatch:' + (seeds[key] || '#ded3b5') + '"></i>' + label + '</button>').join('') + '</div>' +
        '<p id="hsPaletteHint" class="hs-hint"></p><div class="hs-options"><label><span>Jauns skins katru dienu<small>Mainās, pirmoreiz atverot vai atgriežoties jaunā dienā.</small></span><input id="hsDaily" type="checkbox"></label>' +
        '<label><span>Maigas pārejas<small>Datuma izvēlei un vadības pogām.</small></span><input id="hsMotion" type="checkbox"></label></div>' +
        '<div class="hs-footer"><button type="button" data-shuffle>Sajaukt tagad</button><button type="button" data-reset>Sākotnējais skats</button></div><p id="hsStatus" role="status"></p>';
      doc.body.appendChild(dialog);
      dialog.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.hasAttribute('data-close')) dialog.close();
        else if (b.dataset.skin) set({ skin: b.dataset.skin });
        else if (b.dataset.palette) set({ palette: b.dataset.palette });
        else if (b.dataset.background) set({ background: b.dataset.background });
        else if (b.hasAttribute('data-rotate')) host.MinkaHeaderScenic?.rotate?.();
        else if (b.hasAttribute('data-shuffle')) { state = shuffle(state); persist(); }
        else if (b.hasAttribute('data-reset')) { state = normalize(); persist(); }
      });
      dialog.addEventListener('change', e => {
        if (e.target.id === 'hsDaily') set({ daily: e.target.checked, day: dayKey() });
        if (e.target.id === 'hsMotion') set({ motion: e.target.checked });
      });
      dialog.addEventListener('close', () => {
        if (opener?.isConnected) opener.focus({ preventScroll: true });
        doc.getElementById('headerAppearanceBtn')?.setAttribute('aria-expanded', 'false');
      });
      dialog.addEventListener('click', e => {
        if (e.target !== dialog) return;
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
      });
    }
    const scroller = doc.getElementById('grafiks-scroller');
    function enhanceDays() {
      if (!scroller) return;
      const now = new Date();
      scroller.setAttribute('aria-label', 'Izvēlēties dienu');
      const active = scroller.querySelector('.pill.active');
      scroller.querySelectorAll('.pill').forEach((pill, i) => {
        pill.setAttribute('role', 'button');
        pill.tabIndex = pill === active || (!active && i === 0) ? 0 : -1;
        pill.setAttribute('aria-pressed', String(pill === active));
        const date = pill.id.replace(/^p-/, '').replace(/-/g, '.');
        const parts = date.split('.').map(Number);
        const isToday = parts[0] === now.getDate() && parts[1] === now.getMonth() + 1 && parts[2] === now.getFullYear();
        pill.classList.toggle('is-calendar-today', isToday);
        const weekday = new Date(parts[2], parts[1] - 1, parts[0]).getDay();
        const short = ['Sv', 'Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se'][weekday];
        const full = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'][weekday];
        const label = pill.querySelector('.weekday');
        if (short && label && label.textContent !== short) label.textContent = short;
        pill.setAttribute('aria-label', (full ? full + ', ' : '') + date + (isToday ? ', šodien' : ''));
        if (isToday) pill.setAttribute('aria-current', 'date');
        else pill.removeAttribute('aria-current');
      });
    }
    scroller?.addEventListener('keydown', e => {
      const pill = e.target.closest('.pill'); if (!pill) return;
      const days = [...scroller.querySelectorAll('.pill')]; let next;
      if (e.key === 'ArrowRight') next = days[Math.min(days.length - 1, days.indexOf(pill) + 1)];
      if (e.key === 'ArrowLeft') next = days[Math.max(0, days.indexOf(pill) - 1)];
      if (e.key === 'Home') next = days[0];
      if (e.key === 'End') next = days.at(-1);
      if (next) { e.preventDefault(); next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pill.click(); }
    });
    const numberSelector = '.mk-count-item > strong';
    function enhanceHeader() {
      header.querySelectorAll('.mk-duty-sentence-icon,.mk-duty-crowded-icon').forEach(node => {
        if (node.querySelector('svg')) return;
        const text = node.textContent.trim();
        const kind = text.includes('☀') ? 'sun' : text.includes('🌙') ? 'moon' : null;
        if (!kind) return;
        // Retain the original inline box exactly; the overlay replaces only ink.
        const original = doc.createElement('span'); original.className = 'hs-original-icon'; original.textContent = text;
        node.replaceChildren(original); node.insertAdjacentHTML('beforeend', glyph(kind)); node.classList.add('hs-weather-icon');
      });
      header.querySelectorAll(numberSelector).forEach(node => {
        const value = node.textContent;
        if (numberValues.has(node) && numberValues.get(node) !== value && root.classList.contains('mk-header-motion') && !doc.hidden && node.animate) {
          node.getAnimations().forEach(a => a.cancel());
          node.animate([{ opacity: .62, transform: 'translateY(1px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 160, easing: 'ease-out' });
        }
        numberValues.set(node, value);
      });
    }
    let enhancePending = false;
    const observer = new MutationObserver(records => {
      if (records.some(r => r.type === 'attributes' && (r.attributeName === 'src' || r.attributeName === 'data-header-period'))) schedule();
      if (enhancePending) return;
      enhancePending = true;
      requestAnimationFrame(() => { enhancePending = false; enhanceHeader(); enhanceDays(); });
    });
    observer.observe(header, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['src', 'data-header-period'] });
    host.addEventListener('daySelected', () => requestAnimationFrame(enhanceDays));
    function resume() {
      if (doc.hidden) return;
      const next = resolveDay(state);
      if (JSON.stringify(next) !== JSON.stringify(state)) { state = next; persist(); } else schedule();
    }
    doc.addEventListener('visibilitychange', resume);
    host.addEventListener('pageshow', resume);
    host.addEventListener('pagehide', () => {
      radioObserver?.disconnect(); radioBodyObserver?.disconnect(); radioNode = null;
    });
    host.addEventListener('storage', e => { if (e.key === KEY || e.key === null) { state = resolveDay(read(storage)); paint(); } });
    host.addEventListener('message', e => {
      if (e.origin !== location.origin || e.source !== host.parent) return;
      if (e.data?.type === 'mk_open_header_appearance') open();
    });
    reduced.addEventListener('change', schedule);
    // This event-driven bridge is also usable by a future profile adapter.
    host.MinkaHeaderAppearance = { open, close: () => dialog?.close(), snapshot: () => ({ ...state }), set,
      shuffle: () => { state = shuffle(state); persist(); } };
    function installHeaderButton() {
      const actions = doc.getElementById('mkRailActions') || header.querySelector('.mk-date-controls');
      if (!actions) return;
      const button = doc.createElement('button');
      button.id = 'headerAppearanceBtn'; button.type = 'button'; button.className = 'arrow';
      button.title = 'Galvenes izskats'; button.setAttribute('aria-label', 'Galvenes izskats');
      button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'headerAppearance');
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.3-3.5 1.8 1.8 0 0 1 1.2-3.2H17a4 4 0 0 0 4-4C21 6.3 17 3 12 3Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="10.5" cy="6.8" r=".8"/><circle cx="15" cy="7.5" r=".8"/></svg>';
      button.addEventListener('click', open);
      actions.appendChild(button);
      // Remove the superseded dock entry even when the parent shell is cached.
      function removeOldDockEntry() {
        try {
          if (host.parent === host) return;
          host.parent.document.getElementById('headerAppearanceDockBtn')?.remove();
          host.parent.document.getElementById('headerAppearanceDockStyle')?.remove();
        } catch (_) {}
      }
      removeOldDockEntry();
      try { if (host.parent !== host && host.parent.document.readyState === 'loading') host.parent.document.addEventListener('DOMContentLoaded', removeOldDockEntry, { once: true }); } catch (_) {}
    }
    installHeaderButton();
    enhanceHeader(); enhanceDays(); paint();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})(typeof window === 'undefined' ? null : window);
