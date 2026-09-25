/* Card appearance editor, one level of tabs in working order:
     Gatavie → Fons → Izkārtojums → Krāsas → Efekti
   Every control lives in exactly one place. The editor itself is built by
   three modules (minka-skins: Fons/Pieskaņot/Komplekti, card-faces: Stils,
   card-addons: Dekori); this runs after each render and only re-arranges:
   - its own five tab buttons drive the original (hidden) ones, so each
     module keeps its own activate/sync logic;
   - the Stils panel is shown in three modes (bg: image position,
     layout: faces + elements, colors: accent/look/material/frame). Its
     controls never leave that panel because it listens to them by
     delegation; the directly-bound controls from the other panels (colour
     tools, auto colours, effects, dither) are moved to where they belong. */
(function () {
  'use strict';
  var TABS = [['presets', 'Gatavie'], ['background', 'Fons'], ['layout', 'Izkārtojums'], ['colors', 'Krāsas'], ['effects', 'Efekti']];
  var current = 'presets';

  function organize(host) {
    if (!host || host.querySelector('.org-tabs')) return;
    var q = function (s) { return host.querySelector(s); };
    var tabs = q('.mk-skin-main-tabs'), editor = q('.mk-skin-editor');
    var face = q('[data-skin-panel="face"]'), bg = q('[data-skin-panel="background"]'), details = q('[data-skin-panel="details"]');
    var presets = q('[data-skin-panel="presets"]'), addons = q('[data-skin-panel="addons"]');
    var orig = function (s) { return q('.mk-skin-main-tab[data-skin-section="' + s + '"]'); };
    if (!tabs || !editor || !face || !bg || !details || !presets) return;
    editor.classList.add('org');

    // ---- Krāsas: auto colours + number/text/emoji tools join the face's colour group ----
    var colorsBox = document.createElement('div'); colorsBox.className = 'org-colors';
    var auto = q('.mk-auto-palette'); if (auto) colorsBox.append(auto);
    var tools = details.querySelector('.mk-skin-tools'); if (tools) colorsBox.append(tools);
    var colorGroup = face.querySelector('[data-wf-group="colors"]');
    (colorGroup || face).before(colorsBox);
    // clearer labels
    tools && tools.querySelectorAll('.mk-skin-tool-head').forEach(function (h) {
      var t = h.textContent.trim();
      if (/^Stikla tonis/.test(t)) h.textContent = 'Ciparu krāsa un redzamība';
      else if (t === 'Cipars') h.textContent = 'Ciparu krāsa un redzamība';
      else if (t === 'Teksts') h.textContent = 'Teksta krāsa';
    });
    var look = face.querySelector('.wf-look .wf-label'); if (look && look.firstChild) look.firstChild.textContent = 'Kartītes tonis ';

    // ---- Efekti: dither + sparkle effects on top of the decorations ----
    var effects = document.createElement('div'); effects.className = 'org-effects';
    var dither = bg.querySelector('.mk-dither-switch'), fx = details.querySelector('.mk-skin-effects');
    if (dither) { var dh = document.createElement('div'); dh.className = 'org-sub'; dh.textContent = 'Attēla efekts'; effects.append(dh, dither); }
    // The old static sparkles give way to the animated layers in Dekori ("Kustīgi").
    if (fx) fx.hidden = true;
    var effectsPanel = addons || details;
    effectsPanel.prepend(effects);
    if (addons) { var ah = document.createElement('div'); ah.className = 'org-sub'; ah.textContent = 'Dekori'; effects.append(ah); }

    // ---- own tab row ----
    var row = document.createElement('div'); row.className = 'org-tabs'; row.setAttribute('role', 'tablist'); row.setAttribute('aria-label', 'Izskats');
    row.innerHTML = TABS.map(function (t) { return '<button type="button" role="tab" data-org-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    tabs.before(row); tabs.hidden = true;

    function show(name) {
      current = name;
      row.querySelectorAll('[data-org-tab]').forEach(function (b) { var on = b.dataset.orgTab === name; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
      var faceTab = orig('face');
      if (name === 'presets') { orig('presets') && orig('presets').click(); face.removeAttribute('data-org'); return; }
      if (name === 'effects') { (orig('addons') || orig('details')).click(); face.removeAttribute('data-org'); effectThumbs(); return; }
      // The face panel syncs itself when its own tab opens it.
      if (faceTab) faceTab.click();
      face.setAttribute('data-org', name === 'background' ? 'bg' : name);
      if (name === 'background') {
        orig('background') && orig('background').click();
        face.classList.add('is-active');                     // image position rides along under Fons
        var pos = face.querySelector('details.wf-background'); if (pos) pos.open = true;
      }
    }
    row.addEventListener('click', function (e) { var b = e.target.closest('[data-org-tab]'); if (b) show(b.dataset.orgTab); });
    // Grab an element on the preview from any tab: jump to Izkārtojums first,
    // so the face editor is active and the drag starts from the current layout.
    var previewList = q('.mk-skin-preview-list');
    // Effect buttons show the card's own picture with that effect (once, small, cached).
    var thumbRun = 0;
    function effectThumbs() {
      var run = ++thumbRun;
      var D = window.MinkaDither, card = previewList && previewList.querySelector('.mk-mid-card');
      if (!D || !card) return;
      var m = (card.style.getPropertyValue('--mk-skin-img') || '').match(/url\((['"]?)([^'")]+)\1\)/);
      if (!m) return;
      var src = m[2], cs = getComputedStyle(card);
      var ink = (cs.getPropertyValue('--mk-num-color').trim().split(',').map(Number));
      if (!(ink.length === 3 && ink.every(isFinite))) ink = [236, 234, 228];
      var k = Math.max(1, Math.round(window.devicePixelRatio || 1)), box = [96, 96];
      var modes = {
        '': null,
        dither: { mode: 'bayer', ink: ink, paper: [6, 6, 6], normalize: true, contrast: 1.2, dot: 1 / k },
        xray: { mode: 'xray', normalize: true, contrast: .95, sharpen: .2, dot: 1 / k },
        halftone: { mode: 'halftone', ink: ink, normalize: true, contrast: 1.15, scale: k, dot: 1 },
        duotone: { mode: 'duotone', ink: ink, normalize: true, contrast: 1.05, dot: 1 / k },
        ascii: { mode: 'ascii', ink: ink, normalize: true, contrast: 1.15, scale: k, dot: 1 },
        ditherpaper: { mode: 'bayer', ink: ink.map(function (v) { return Math.round(v * .45); }), paper: [239, 236, 228], normalize: true, contrast: 1.2, dot: 1 / k },
        dithercolor: { mode: 'palette', colors: 8, contrast: 1.06, dot: 1 / k }
      };
      host.querySelectorAll('[data-pic-effect],[data-card-dither]').forEach(function (b) {
        var v = b.hasAttribute('data-card-dither') ? b.dataset.cardDither : b.dataset.picEffect, o = modes[v];
        b.classList.add('has-thumb');
        if (o === null) { var raw = 'url("' + src + '")'; if (b.style.getPropertyValue('--thumb') !== raw) b.style.setProperty('--thumb', raw); return; }
        if (!o) return;
        D.url(src, Object.assign({ box: box, pos: [.5, .5], stale: function () { return run !== thumbRun || !b.isConnected; } }, o)).then(D.ready || function (u) { return u; }).then(function (u) { if (run !== thumbRun || !b.isConnected) return; var v2 = 'url("' + u + '")'; if (b.style.getPropertyValue('--thumb') !== v2) b.style.setProperty('--thumb', v2); }, function () {});
      });
    }
    // Controls that cannot work with the current effect are greyed out with the reason
    // underneath — never silently ignored. Re-evaluated whenever the preview card changes.
    function lock(el, reason) {
      if (!el) return;
      el.classList.toggle('org-locked', !!reason);
      el.setAttribute('aria-disabled', String(!!reason));
      var note = el.nextElementSibling && el.nextElementSibling.classList.contains('org-lock-note') ? el.nextElementSibling : null;
      if (reason && !note) { note = document.createElement('div'); note.className = 'org-lock-note'; el.after(note); }
      if (note) { if (reason) note.textContent = reason; else note.remove(); }
    }
    function syncLocks() {
      var card = previewList && previewList.querySelector('.mk-mid-card');
      if (!card) return;
      var dither = card.matches('[data-watch-face="dither"], .mk-fx-dither');
      lock(face.querySelector('.wf-finish'), dither ? 'Ar Dither efektu cipari ir punktoti — materiāls neko nemaina. Izslēdz Dither (Efekti), lai to izmantotu.' : '');
      lock(face.querySelector('.wf-look'), dither ? 'Dither pats nosaka attēla toni. Izslēdz Dither (Efekti), lai mainītu kartītes toni.' : '');
      lock(colorsBox.querySelector('.mk-skin-tool-emoji'), dither ? 'Ar Dither efektu fona emoji netiek rādīts.' : '');
      var effected = card.matches('.mk-fx-dither, .mk-fx-pic, [data-watch-face="dither"]');
      lock(face.querySelector('.wf-depth-control'), effected ? 'Ar attēla efektu izgrieztais objekts netiek likts priekšā ciparam — tas būtu bez efekta.' : '');
    }
    var lockFrame = 0;
    if (previewList && window.MutationObserver) new MutationObserver(function () {
      if (!lockFrame) lockFrame = requestAnimationFrame(function () { lockFrame = 0; syncLocks(); });
    }).observe(previewList, { attributes: true, subtree: true, attributeFilter: ['class', 'data-watch-face'] });
    // The host element outlives every re-render: its listeners are bound once and
    // always talk to the latest render (older closures would point at old cards).
    host.__org = { paint: paint, paintAll: paintAll, effectThumbs: effectThumbs, syncLocks: syncLocks, tab: function () { return current; } };
    if (!host.__orgBound) {
      host.__orgBound = true;
      host.addEventListener('input', function (e) { if (e.target.type === 'range' && host.__org) host.__org.paint(e.target); }, true);
      host.addEventListener('click', function () { setTimeout(function () { if (host.__org) host.__org.paintAll(); }, 0); }, true);
      // A quiet save (effect / colour) keeps the editor; only the previews follow a colour change.
      host.addEventListener('mk-skin-quiet', function () { var o = host.__org; if (!o) return; if (o.tab() === 'effects') o.effectThumbs(); o.syncLocks(); });
    }
    // The frame is selectable like an element: it lights up on the card and in Krāsas.
    function selectFrame(on) {
      var c = previewList && previewList.querySelector('.mk-mid-card');
      if (c) c.classList.toggle('wf-frame-selected', on);
      var m = face.querySelector('.wf-metal'); if (m) m.classList.toggle('is-selected', on);
      if (on) selectBackground(false);
    }
    // …and so is the background: a dashed inner frame shows it is the thing being edited.
    function selectBackground(on) {
      var c = previewList && previewList.querySelector('.mk-mid-card');
      if (!c) return;
      var h = c.querySelector(':scope > .wf-bg-hilite');
      if (on && !h) { h = document.createElement('span'); h.className = 'wf-bg-hilite'; h.setAttribute('aria-hidden', 'true'); c.append(h); }
      if (!on && h) h.remove();
    }
    row.addEventListener('click', function (e) { selectFrame(false); var b = e.target.closest('[data-org-tab]'); selectBackground(!!b && b.dataset.orgTab === 'background'); });
    // The preview is a picture of the card, never the live card: no click inside it
    // may reach the calendar's own handlers (coffee +/−, opening windows).
    if (previewList) previewList.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
    // Click what you want to change: an element → its settings, the picture → Fons.
    if (previewList) previewList.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !e.target.closest('.mk-mid-card')) return;
      var part = e.target.closest('[data-wf-part]'), card = e.target.closest('.mk-mid-card');
      if (!part) {
        // the rim of the card = its frame → Krāsas, at the metal frame
        var r = card.getBoundingClientRect(), edge = Math.min(14, r.width * .07);
        var onRim = e.clientX - r.left < edge || r.right - e.clientX < edge || e.clientY - r.top < edge || r.bottom - e.clientY < edge;
        if (onRim && card.classList.contains('mk-watch-face')) {
          if (current !== 'colors') show('colors');
          selectFrame(true);
          setTimeout(function () { var m = face.querySelector('.wf-metal'); if (m) m.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
          return;
        }
        selectFrame(false);
        if (current !== 'background') show('background');
        selectBackground(true);
        return;
      }
      selectFrame(false); selectBackground(false);
      if (!previewList.querySelector('.mk-watch-face')) { if (current !== 'colors') show('colors'); return; }
      if (current !== 'layout') show('layout');
      // the face editor selects the part on this same pointerdown; then bring its settings into view
      setTimeout(function () { var head = face.querySelector('.wf-part-head'); if (head) head.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
    }, true);
    // M3 sliders paint their active track from --p (values are also set from code: repaint after clicks).
    function paint(r) { var min = +r.min || 0, max = +r.max || 100, v = +r.value; r.style.setProperty('--p', ((v - min) / ((max - min) || 1) * 100).toFixed(1) + '%'); }
    function paintAll() { host.querySelectorAll('input[type="range"]').forEach(paint); }
    show(current); paintAll(); syncLocks();
  }

  function install() {
    var render = window.mkRenderSkinPicker;
    if (typeof render !== 'function' || render.__organized) return !!render;
    var wrapped = function (host) { var r = render.apply(this, arguments); try { organize(host); } catch (e) { console.warn('skin-organize', e); } return r; };
    wrapped.__organized = true; if (render.__addonsWrapped) wrapped.__addonsWrapped = true;
    window.mkRenderSkinPicker = wrapped;
    return true;
  }
  if (!install()) { var tries = 0, t = setInterval(function () { if (install() || ++tries > 40) clearInterval(t); }, 250); }
})();
