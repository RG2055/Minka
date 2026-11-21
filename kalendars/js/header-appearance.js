/* Local header appearance. Deliberately independent of shared worker skins. */
(function (host) {
  'use strict';
  const KEY = 'mk_header_appearance_v1';
  const skins = ['panorama', 'hybrid'];
  const seeds = { olive: '#d9ce7f', mint: '#a5d4ba', peach: '#f1c59e', rose: '#efb4cb', lilac: '#d5b7e8', blue: '#afccec' };
  const palettes = ['scene', ...Object.keys(seeds), 'radio'];
  // The coast scene is gone (2026-09-22): its 3:1 frames could not survive a
  // 12:1 header box, so anyone who had it chosen lands on the collection.
  const backgrounds = ['riga', 'mix'];
  // Skin pack: the shift progress line, and the bottom bar's icons and surface.
  const progressStyles = ['classic', 'm3', 'cat', 'pixel', 'dither', 'ekg'];
  // The top block's arrangement: the classic rows, or widget tiles (css/page/mk-header-x.css, "Flīzes").
  const layouts = ['classic', 'tiles'];
  // Tiles: which ones stand in the row and in what order. Three ready profiles and the user's own;
  // the tools tile is in every one (the way back to this panel is in it).
  // the first seven are the header's own tiles; the rest are extra widgets (js/page/mk-header-widgets.js)
  const tileIds = ['rg', 'date', 'shift', 'wx', 'news', 'tools', 'rd', 'clock', 'dots', 'ring', 'month', 'year', 'sun', 'hours', 'wind'];
  const coreTiles = tileIds.slice(0, 7);
  const tileProfiles = { full: coreTiles, duty: ['rg', 'rd', 'shift', 'date', 'tools'], calm: ['date', 'shift', 'wx', 'news', 'tools'] };
  function ownTiles(list) {
    const out = (Array.isArray(list) ? list : coreTiles).filter((t, i, a) => tileIds.includes(t) && a.indexOf(t) === i);
    return out.includes('tools') ? out : out.concat('tools');
  }
  function tilesFor(s) { return s.profile === 'own' ? s.ownTiles : tileProfiles[s.profile] || coreTiles; }
  const dockIconSets = ['pixel', 'm3', 'line', 'dither'];
  const dockTints = ['color', 'white', 'accent', 'muted'];
  const dockBars = ['default', 'dark', 'dots', 'fade', 'grid', 'kapas', 'tors', 'signals', 'rezgis'];
  function normalize(value) {
    const s = value && typeof value === 'object' ? value : {};
    return { version: 2, skin: s.skin === 'material' ? 'hybrid' : skins.includes(s.skin) ? s.skin : 'panorama',
      palette: palettes.includes(s.palette) ? s.palette : 'scene', daily: s.daily === true,
      motion: s.motion !== false, background: backgrounds.includes(s.background) ? s.background : 'mix', day: /^\d{4}-\d{2}-\d{2}$/.test(s.day || '') ? s.day : '',
      progress: progressStyles.includes(s.progress) ? s.progress : 'classic',
      layout: layouts.includes(s.layout) ? s.layout : 'tiles',   // tiles are the default; "Klasiskais" stays a choice
      profile: s.profile === 'own' || tileProfiles[s.profile] ? s.profile : 'full', ownTiles: ownTiles(s.ownTiles),
      dockIcons: dockIconSets.includes(s.dockIcons) ? s.dockIcons : 'pixel',
      dockTint: dockTints.includes(s.dockTint) ? s.dockTint : 'color',
      dockBar: dockBars.includes(s.dockBar) ? s.dockBar : s.dockBar === 'amoled' ? 'dark' : s.dockBar === 'dither' ? 'dots' : 'default' };
  }
  function dayKey(now = new Date()) {
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }
  function shuffle(value, day = dayKey(), random = Math.random) {
    const s = normalize(value);
    const choose = list => list[Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)))];
    const next = { ...s, skin: choose(skins.filter(x => x !== s.skin)),
      palette: choose(['scene', ...Object.keys(seeds)].filter(x => x !== s.palette)), day };
    // The daily shuffle also deals a new skin-pack combination (progress line, bottom bar).
    next.progress = choose(progressStyles.filter(x => x !== s.progress));
    next.dockIcons = choose(dockIconSets.filter(x => x !== s.dockIcons));
    next.dockTint = choose(dockTints.filter(x => x !== s.dockTint));
    next.dockBar = choose(dockBars.filter(x => x !== s.dockBar));
    return next;
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
  const core = { KEY, seeds, tileIds, tilesFor, normalize, dayKey, shuffle, resolveDay, read, write, palette, contrast, resolveColor };
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (!host || !host.document) return;
  const doc = host.document, root = doc.documentElement;
  // Phone: no header panel here, but the dock and the page take the picture's
  // tones as on the computer: the same seed and palette, mirrored onto both
  // <html> as --hxr-surface / --hxr-accent (mk-header-x.js does it there).
  if (root.classList.contains('mk-mobile-shell')) { tintPhone(); return; }
  function tintPhone() {
    let shell = null, storage;
    try { shell = host.parent !== host ? host.parent.document.documentElement : null; } catch (_) {}
    if (!shell || host.MINKA_APP === 'rad' || shell.classList.contains('minka-rad')) return;
    try { storage = host.localStorage; } catch (_) {}
    const colors = new Map();
    let queued = false, last = '';
    function seed() {
      const chosen = seeds[read(storage).palette];
      if (chosen) return chosen;
      const img = doc.querySelector('#minkaBarWrap .mk-header-scenic-img'), src = img?.currentSrc || img?.src;
      if (img?.complete && img.naturalWidth && !colors.has(src)) {
        colors.set(src, null);
        host.MinkaImagePalette?.extract(img).then(result => {
          if (result) { colors.set(src, mix(result.dominant, '#ffffff', .25)); queue(); }
        });
      }
      const period = doc.getElementById('minkaBarInner')?.dataset.headerPeriod || root.dataset.minkaHeaderPeriod;
      return colors.get(src) || ({ morning: seeds.peach, day: seeds.mint, sunset: seeds.olive, night: seeds.blue })[period] || seeds.mint;
    }
    function apply() {
      queued = false;
      const p = palette(seed());
      if (p.accent + p.surface === last) return;
      last = p.accent + p.surface;
      [root, shell].forEach(n => { n.style.setProperty('--hxr-accent', p.accent); n.style.setProperty('--hxr-surface', p.surface); });
      root.toggleAttribute('data-page-tint', !shell.classList.contains('has-wallpaper-bg'));
    }
    function queue() { if (!queued) { queued = true; host.requestAnimationFrame(apply); } }
    // A new picture (rotation, another day) fires load on its <img>; load does not bubble.
    doc.addEventListener('load', e => { if (e.target.classList?.contains('mk-header-scenic-img')) queue(); }, true);
    host.addEventListener('storage', e => { if (e.key === KEY || e.key === null) queue(); });
    queue();
  }
  let storage;
  try { storage = host.localStorage; } catch (_) {}
  let state = resolveDay(read(storage));
  root.dataset.headerSkin = state.skin;
  root.dataset.headerPalette = state.palette;
  root.dataset.headerProgress = state.progress;
  root.dataset.headerLayout = state.layout;
  root.dataset.headerTiles = tilesFor(state).join(' ');
  if (state.daily) write(storage, state);

  function mount() {
    const header = doc.getElementById('minkaBarWrap');
    if (!header) return;
    let dialog, opener, saveOK = true, radioObserver, radioBodyObserver, radioNode, scheduled = false;
    const imageColors = new Map(), imageVivid = new Map(), boundImages = new WeakSet(), numberValues = new WeakMap();
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
          if (result) { imageColors.set(src, mix(result.dominant, '#ffffff', .25)); imageVivid.set(src, result.accent); schedule(); }
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
      root.dataset.headerProgress = state.progress;
      if (root.dataset.headerLayout !== state.layout) root.dataset.headerLayout = state.layout;
      const tileList = tilesFor(state).join(' ');
      if (root.dataset.headerTiles !== tileList) root.dataset.headerTiles = tileList;
      if (state.progress === 'cat') syncPet();
      // The bottom bar lives in the shell document; it reads the same saved state (index.html),
      // this keeps it in step while the panel is open.
      try {
        const pr = host.parent !== host ? host.parent.document.documentElement : null;
        if (pr) { pr.dataset.dockIcons = state.dockIcons; pr.dataset.dockBar = state.dockBar; pr.dataset.dockTint = state.dockTint; }
      } catch (_) {}
      host.MinkaHeaderScenic?.setScene(state.background);
      const effective = resolveColor(state, radioStatus(), sceneSeed(), state.palette === 'radio' ? radioSeed() : undefined);
      root.dataset.headerPalette = effective.source === 'album' ? 'album' : state.palette;
      root.dataset.headerColorSource = effective.source;
      lastDockAccent = effective.seed;
      const p = palette(effective.seed);
      // The header's text roles (css/page/mk-header-x.css, --hxm-*) are mixed from the colour itself, not from
      // the pale glass tints: the picture's most vivid swatch for a scene, else the seed of the palette or album.
      const sceneImg = header.querySelector('.mk-header-scenic-img');
      p.vivid = (effective.source === 'palette' && state.palette === 'scene' && imageVivid.get(sceneImg?.currentSrc || sceneImg?.src)) || effective.seed;
      // "Akcents" icon colour in the bottom bar follows the header palette.
      try { if (host.parent !== host) host.parent.document.documentElement.style.setProperty('--dock-accent', effective.seed); } catch (_) {}
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
    let lastDockAccent = '#d9ce7f';
    // Running-cat progress line: the pet of the day runs at the end of the fill.
    function syncPet(url) {
      const u = url || host.__minkaDailyCat?.getCurrent?.()?.spritesheetUrl || '';
      if (!/^https:\/\/[^"'()\s]+\.webp$/.test(u)) return;
      [header, dialog].filter(Boolean).forEach(n => { n.style.setProperty('--hs-pet-sheet', 'url("' + u + '")'); n.classList.add('hs-has-pet'); });
    }
    host.addEventListener('minka:daily-pet', e => syncPet(e.detail && e.detail.spritesheetUrl));
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
      const press = (key, value) => dialog.querySelectorAll('[data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + ']').forEach(b => b.setAttribute('aria-pressed', String(b.dataset[key] === value)));
      ['layout', 'skin', 'background', 'palette', 'progress', 'dockIcons', 'dockBar', 'dockTint'].forEach(key => press(key, state[key]));
      dialog.querySelector('[data-rotate]').hidden = state.background !== 'mix';
      dialog.querySelector('[data-widgets]').hidden = state.layout !== 'tiles';
      // pixel icons carry their own colours: the colour row is dimmed and does nothing
      const tintRow = dialog.querySelector('.hs-dock-tints'), locked = state.dockIcons === 'pixel';
      tintRow.classList.toggle('is-locked', locked); tintRow.setAttribute('aria-disabled', String(locked));
      dialog.style.setProperty('--dock-accent', lastDockAccent);
      dialog.querySelector('#hsDaily').checked = state.daily;
      dialog.querySelector('#hsMotion').checked = state.motion;
      dialog.querySelector('#hsStatus').textContent = saveOK ? '' : 'Pārlūks neļauj saglabāt izvēli.';
    }
    // The panel's own styles load with its first opening, not with the page (css/page/mk-header-settings.css).
    let cssReady = null;
    function settingsCss() {
      return cssReady || (cssReady = new Promise(done => {
        const link = doc.createElement('link');
        link.rel = 'stylesheet'; link.href = 'css/page/mk-header-settings.css?v=20261121s1';
        link.onload = link.onerror = done;
        doc.head.appendChild(link);
      }));
    }
    function open() {
      return settingsCss().then(() => {
        if (!dialog) buildDialog();
        if (dialog.open) return;
        opener = doc.activeElement;
        paint(); dialog.showModal();
        doc.getElementById('headerAppearanceBtn')?.setAttribute('aria-expanded', 'true');
      });
    }
    /* One row per thing to choose, a word on the left and the choices as pictures or short words on the right:
       no descriptions to read. A picture's name is its tooltip and its accessible name. */
    function buildDialog() {
      dialog = doc.createElement('dialog'); dialog.id = 'headerAppearance';
      dialog.setAttribute('aria-labelledby', 'hsTitle');
      const row = (label, body) => '<div class="hs-row"><span class="hs-k">' + label + '</span><div class="hs-v">' + body + '</div></div>';
      const words = (attr, items) => '<div class="hs-backgrounds" role="group">' + items.map(([key, label]) =>
        '<button type="button" data-' + attr + '="' + key + '" aria-pressed="false">' + label + '</button>').join('') + '</div>';
      const pictures = (attr, cls, items, inner) => '<div class="' + cls + '" role="group">' + items.map(([key, label]) =>
        '<button type="button" data-' + attr + '="' + key + '" aria-pressed="false" aria-label="' + label + '" title="' + label + '">' + inner(key) + '</button>').join('') + '</div>';
      dialog.innerHTML = '<div class="hs-heading"><h2 id="hsTitle">Izskats</h2><button type="button" data-close aria-label="Aizvērt">×</button></div>' +
        row('Izkārtojums', words('layout', [['tiles', 'Flīzes'], ['classic', 'Klasiskais']]) + '<button type="button" data-widgets class="hs-link">Logrīki</button>') +
        row('Stils', words('skin', [['panorama', 'Panorāma'], ['hybrid', 'Material']])) +
        row('Fons', words('background', [['riga', 'Rīga'], ['mix', 'Kolekcija']]) + '<button type="button" data-rotate class="hs-link" hidden>Cits attēls</button>') +
        row('Krāsa', pictures('palette', 'hs-palettes', [['scene', 'No panorāmas'], ['olive', 'Olīva'], ['mint', 'Piparmētra'], ['peach', 'Persiks'], ['rose', 'Roze'], ['lilac', 'Ceriņi'], ['blue', 'Zils'], ['radio', 'Sekot radio']],
          key => '<i aria-hidden="true" class="hs-sw-' + key + '" style="--swatch:' + (seeds[key] || '#ded3b5') + '"></i>')) +
        row('Laika josla', pictures('progress', 'hs-pack hs-progress', [['classic', 'Klasiskā'], ['m3', 'Vilnis'], ['cat', 'Skrienošs kaķis'], ['pixel', 'Pikseļi'], ['dither', 'Dither'], ['ekg', 'EKG']],
          key => '<span class="hs-pp hs-pp-' + key + '" aria-hidden="true"><i></i></span>')) +
        row('Doka ikonas', pictures('dock-icons', 'hs-pack hs-dock-icons', [['pixel', 'Pikseļu'], ['m3', 'M3'], ['line', 'Līnijas'], ['dither', 'Dither']],
          key => '<span class="hs-di hs-di-' + key + '" aria-hidden="true"><i></i><i></i><i></i></span>') +
          pictures('dock-tint', 'hs-dock-tints', [['color', 'Krāsainas'], ['white', 'Baltas'], ['accent', 'Akcents'], ['muted', 'Klusinātas']],
            key => '<i class="hs-tint hs-tint-' + key + '" aria-hidden="true"></i>')) +
        row('Doka fons', pictures('dock-bar', 'hs-pack hs-dock-bars', [['default', 'Parasts'], ['dark', 'Tumšs'], ['dots', 'Punkti'], ['fade', 'Pāreja'], ['grid', 'Tīkls'], ['kapas', 'Kāpas'], ['tors', 'Tors'], ['signals', 'Signāls'], ['rezgis', 'Režģis']],
          key => '<span class="hs-db hs-db-' + key + '" aria-hidden="true"></span>')) +
        '<div class="hs-options"><label><span>Katru dienu cits</span><input id="hsDaily" type="checkbox"></label><label><span>Kustība</span><input id="hsMotion" type="checkbox"></label></div>' +
        '<div class="hs-footer"><button type="button" data-shuffle>Sajaukt</button><button type="button" data-reset>Atiestatīt</button></div><p id="hsStatus" role="status"></p>';
      doc.body.appendChild(dialog);
      dialog.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.hasAttribute('data-close')) dialog.close();
        else if (b.dataset.skin) set({ skin: b.dataset.skin });
        else if (b.dataset.palette) set({ palette: b.dataset.palette });
        else if (b.dataset.background) set({ background: b.dataset.background });
        else if (b.hasAttribute('data-rotate')) host.MinkaHeaderScenic?.rotate?.();
        else if (b.dataset.progress) set({ progress: b.dataset.progress });
        else if (b.dataset.layout) set({ layout: b.dataset.layout });
        else if (b.hasAttribute('data-widgets')) { dialog.close(); host.MkHeaderX?.editTiles?.(); }
        else if (b.dataset.dockIcons) set({ dockIcons: b.dataset.dockIcons });
        else if (b.dataset.dockBar) set({ dockBar: b.dataset.dockBar });
        else if (b.dataset.dockTint) { if (state.dockIcons !== 'pixel') set({ dockTint: b.dataset.dockTint }); }
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
      if (scroller.getAttribute('aria-label') !== 'Izvēlēties dienu') scroller.setAttribute('aria-label', 'Izvēlēties dienu');
      const active = scroller.querySelector('.pill.active');
      // Only what changed is written: a day switch touches two pills, not all thirty
      // (every attribute write re-styles the strip).
      const put = (el, name, value) => { if (el.getAttribute(name) !== value) el.setAttribute(name, value); };
      scroller.querySelectorAll('.pill').forEach((pill, i) => {
        put(pill, 'role', 'button');
        const tab = pill === active || (!active && i === 0) ? 0 : -1;
        if (pill.tabIndex !== tab) pill.tabIndex = tab;
        put(pill, 'aria-pressed', String(pill === active));
        const date = pill.id.replace(/^p-/, '').replace(/-/g, '.');
        const parts = date.split('.').map(Number);
        const isToday = parts[0] === now.getDate() && parts[1] === now.getMonth() + 1 && parts[2] === now.getFullYear();
        if (pill.classList.contains('is-calendar-today') !== isToday) pill.classList.toggle('is-calendar-today', isToday);
        const weekday = new Date(parts[2], parts[1] - 1, parts[0]).getDay();
        const short = ['Sv', 'Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se'][weekday];
        const full = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'][weekday];
        const label = pill.querySelector('.weekday');
        if (short && label && label.textContent !== short) label.textContent = short;
        put(pill, 'aria-label', (full ? full + ', ' : '') + date + (isToday ? ', šodien' : ''));
        if (isToday) put(pill, 'aria-current', 'date');
        else if (pill.hasAttribute('aria-current')) pill.removeAttribute('aria-current');
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
    const ruler = doc.getElementById('shift-progress-wrap');
    const observer = new MutationObserver(records => {
      if (records.some(r => r.type === 'attributes' && (r.attributeName === 'src' || r.attributeName === 'data-header-period'))) schedule();
      // The ruler's clock text changes every second; nothing here reads it, so
      // those ticks must not re-scan the duty icons and all thirty day pills.
      if (ruler && records.every(r => ruler.contains(r.target))) return;
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
    host.MinkaHeaderAppearance = { open, close: () => dialog?.close(), snapshot: () => ({ ...state }), set, tileIds,
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
