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
  // One 24 px line icon per tab (the bottom bar): same stroke as the rest of the window.
  var ICONS = {
    presets: '<path d="M11 4.5l1.5 4.2 4.2 1.5-4.2 1.5L11 15.9l-1.5-4.2-4.2-1.5 4.2-1.5z"/><path d="M17.6 14.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/>',
    background: '<rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><path d="M3.8 16.2l4.6-4.6 3.9 3.9 2.4-2.4 5.5 5.3"/><circle cx="15.6" cy="9.2" r="1.5"/>',
    layout: '<rect x="3.5" y="3.5" width="7.5" height="9.5" rx="2.2"/><rect x="13" y="3.5" width="7.5" height="5.5" rx="2.2"/><rect x="3.5" y="15" width="7.5" height="5.5" rx="2.2"/><rect x="13" y="11" width="7.5" height="9.5" rx="2.2"/>',
    colors: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.9-.8 1.9-1.8 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.7 1.8-1.7h2.1c2.1 0 3.7-1.6 3.7-3.7 0-3.9-3.8-7.2-8.5-7.2z"/><circle class="f" cx="7.6" cy="11.4" r="1.25"/><circle class="f" cx="9.8" cy="7.6" r="1.25"/><circle class="f" cx="14.2" cy="7.6" r="1.25"/>',
    effects: '<circle class="f" cx="6" cy="6" r="1"/><circle class="f" cx="12" cy="6" r="1.5"/><circle class="f" cx="18" cy="6" r="1"/><circle class="f" cx="6" cy="12" r="1.5"/><circle class="f" cx="12" cy="12" r="2.1"/><circle class="f" cx="18" cy="12" r="1.5"/><circle class="f" cx="6" cy="18" r="1"/><circle class="f" cx="12" cy="18" r="1.5"/><circle class="f" cx="18" cy="18" r="1"/>'
  };
  // /rad opens on the pictures (Fons); the radiographers keep Gatavie first.
  var current = window.MINKA_APP === 'rad' ? 'background' : 'presets';

  // Small-thumbnail settings of every picture effect (also used by the Būvētājs).
  function thumbModes(ink, k) {
    return {
      '': null,
      dither: { mode: 'bayer', ink: ink, paper: [6, 6, 6], normalize: true, contrast: 1.2, dot: 1 / k },
      xray: { mode: 'xray', normalize: true, contrast: .95, sharpen: .2, dot: 1 / k },
      focus: { mode: 'focus', normalize: true, contrast: 1.1, sharpen: .25, dot: 1 / k },
      split: { mode: 'mono', normalize: true, contrast: 1.08, sharpen: .25, dot: 1 / k },
      poster: { mode: 'poster', ink: ink, normalize: true, contrast: 1.12, sharpen: .3, dot: 1 / k },
      led: { mode: 'led', ink: ink, normalize: true, contrast: 1.15, scale: k, dot: 1, cell: .8 },
      mosaic: { mode: 'mosaic', normalize: true, contrast: 1.05, scale: k, dot: 1, cell: .8 },
      bricks: { mode: 'bricks', normalize: true, contrast: 1.05, scale: k, dot: 1, cell: .8 },
      pixelate: { mode: 'pixelate', normalize: true, contrast: 1.05, scale: k, dot: 1, cell: .8 },
      pointillism: { mode: 'pointillism', normalize: true, contrast: 1.05, scale: k, dot: 1, cell: .8 },
      lines: { mode: 'lines', ink: ink, normalize: true, contrast: 1.1, dot: 1 / k, cell: .8 },
      cmyk: { mode: 'cmyk', normalize: true, contrast: 1.08, dot: 1 / k, cell: .8 },
      riso: { mode: 'riso', ink: ink, normalize: true, contrast: 1.08, dot: 1 / k },
      heatmap: { mode: 'heatmap', normalize: true, contrast: 1.08, dot: 1 / k },
      threshold: { mode: 'threshold', ink: ink, normalize: true, contrast: 1.08, dot: 1 / k },
      outline: { mode: 'outline', normalize: true, contrast: 1, sharpen: 0, dot: 1 / k },
      posterize: { mode: 'posterize', normalize: true, contrast: 1.08, dot: 1 / k },
      halftone: { mode: 'halftone', ink: ink, normalize: true, contrast: 1.15, scale: k, dot: 1 },
      duotone: { mode: 'duotone', ink: ink, normalize: true, contrast: 1.05, dot: 1 / k },
      ascii: { mode: 'ascii', ink: ink, normalize: true, contrast: 1.15, scale: k, dot: 1 },
      ditherpaper: { mode: 'bayer', ink: ink.map(function (v) { return Math.round(v * .45); }), paper: [239, 236, 228], normalize: true, contrast: 1.2, dot: 1 / k },
      dithercolor: { mode: 'palette', colors: 8, contrast: 1.06, dot: 1 / k }
    };
  }
  window.MinkaEffectThumbModes = thumbModes;

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
      // short tile titles: the tile's own controls say the rest
      if (/^Stikla tonis/.test(t) || t === 'Cipars') h.textContent = 'Cipari';
      else if (t === 'Teksts') h.textContent = 'Teksts';
    });
    var look = face.querySelector('.wf-look .wf-label'); if (look && look.firstChild) look.firstChild.textContent = 'Kartītes tonis ';
    // Emoji (its look: Fluent / system / black / white, and the one in the background) is a
    // tile of its own at the top of the right column, in sight without scrolling.
    var emojiTool = tools && tools.querySelector('.mk-skin-tool-emoji'), emojiStyle = null, emojiHead = null;
    // One place for each thing: the emoji's look sits with the emoji (Izkārtojums → Emoji,
    // and the Emoji tab), the faint emoji behind the numeral joins "Emoji fonā" in Fons as
    // "Aiz cipara". The old tile stays hidden, only as the look's home between uses.
    if (emojiTool) {
      var eh = emojiTool.querySelector('.mk-skin-tool-head');
      var style = emojiTool.querySelector('.mk-emoji-style'); if (style && eh) { eh.after(style); emojiStyle = style; emojiHead = eh; }
      var wmHome = bg.querySelector('[data-bg-panel="emoji"]'), wmSwitch = emojiTool.querySelector('.mk-switch'), wmRange = emojiTool.querySelector('.mk-emoji-op');
      if (wmHome && wmSwitch && wmRange) {
        var wm = document.createElement('div'); wm.className = 'org-wm'; wm.title = 'Blāvs emoji aiz cipara';
        var wb = wmSwitch.querySelector('b'); if (wb) wb.textContent = 'Aiz cipara';
        wm.append(wmSwitch, wmRange); var wv = emojiTool.querySelector('.mk-emoji-op-val'); if (wv) wm.append(wv);
        wmHome.append(wm);
      }
      emojiTool.hidden = true;
    }
    var metalLbl = face.querySelector('.wf-metal .wf-label'); if (metalLbl && metalLbl.firstChild) metalLbl.firstChild.textContent = 'Ietvars ';
    // The chosen element's own settings sit together under its name (Izkārtojums):
    // the numeral's style joins its colour and size there; in Krāsas it is back
    // among the card's colours. Both places are inside the face panel.
    var finish = face.querySelector('.wf-finish'), metalSec = face.querySelector('.wf-metal');
    var finishLbl = finish && finish.querySelector('.wf-label'); if (finishLbl) finishLbl.textContent = 'Ciparu stils';
    // The emoji's look (Fluent / system / black / white) likewise joins the Emoji element.
    var emojiLook = document.createElement('div'); emojiLook.className = 'org-emoji-look';
    emojiLook.innerHTML = '<span>Emoji izskats</span>';
    function placeInspector() {
      var partColor = face.querySelector('.wf-part-color');
      if (finish) {
        var here = current === 'layout' && face.dataset.sel === 'hours' && partColor;
        if (here) { if (finish.previousElementSibling !== partColor) partColor.after(finish); }
        else if (metalSec && finish.previousElementSibling !== metalSec) metalSec.after(finish);
      }
      if (emojiStyle && emojiHead) {
        var anchor = face.querySelector('.wf-part-plate') || partColor;
        if (current === 'layout' && face.dataset.sel === 'emoji' && anchor) {
          if (anchor.nextElementSibling !== emojiLook) anchor.after(emojiLook);
          if (emojiStyle.parentElement !== emojiLook) emojiLook.append(emojiStyle);
        } else if (emojiHead.nextElementSibling !== emojiStyle) { emojiHead.after(emojiStyle); emojiLook.remove(); }
      }
    }
    if (window.MutationObserver) {
      if (host.__orgSel) host.__orgSel.disconnect();
      host.__orgSel = new MutationObserver(placeInspector);
      host.__orgSel.observe(face, { attributes: true, attributeFilter: ['data-sel'] });
    }
    // a rebuilt editor keeps the chosen element: its settings go back under it at once
    requestAnimationFrame(placeInspector);
    // Izkārtojums: short names on the actions, the explanations in their tooltips
    var rs = face.querySelector('.wf-reset'); if (rs) { rs.textContent = 'Atjaunot'; rs.title = 'Izkārtojums kā sākumā'; }
    var mn = face.querySelector('.wf-minimal'); if (mn) mn.textContent = 'Tikai svarīgais';
    var no = face.querySelector('.wf-nooverlap'), noText = no && no.querySelector('small');
    if (no && noText) no.title = noText.textContent;

    // ---- Efekti: dither + sparkle effects on top of the decorations ----
    var effects = document.createElement('div'); effects.className = 'org-effects';
    var dither = bg.querySelector('.mk-dither-switch'), fx = details.querySelector('.mk-skin-effects');
    if (dither) { var dh = document.createElement('div'); dh.className = 'org-sub'; dh.textContent = 'Attēla efekts'; effects.append(dh, dither); }
    // The old static sparkles give way to the animated layers in Dekori ("Kustīgi").
    if (fx) fx.hidden = true;
    var effectsPanel = addons || details;
    effectsPanel.prepend(effects);
    if (addons) {
      // "Dekori" heads the decorations (they stay on the right; the picture effect goes left)
      var ah = document.createElement('div'); ah.className = 'org-sub org-sub-top'; ah.textContent = 'Dekori'; addons.prepend(ah);
      // The panel's own header (hidden here) holds "Noņemt dekoru": it moves onto this line.
      var rm = addons.querySelector('.mk-addon-remove');
      if (rm) { ah.classList.add('org-sub-row'); ah.append(rm); }
    }

    // ---- Fons: the picture categories behind one button (a menu), not 17 chips ----
    var catNav = bg.querySelector('.mk-skin-category-nav');
    if (catNav) {
      var catBtn = document.createElement('button');
      catBtn.type = 'button'; catBtn.className = 'org-cat-btn'; catBtn.setAttribute('aria-haspopup', 'true'); catBtn.setAttribute('aria-expanded', 'false');
      catBtn.innerHTML = '<span class="org-cat-k">Kategorija</span><b></b><i></i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>';
      catNav.before(catBtn); catNav.classList.add('org-cat-pop');
      var syncCat = function () {
        var a = catNav.querySelector('.mk-skin-category.is-active'); if (!a) return;
        var n = a.querySelector('span');
        catBtn.querySelector('b').textContent = (a.firstChild && a.firstChild.textContent || '').trim();
        catBtn.querySelector('i').textContent = n ? n.textContent : '';
      };
      var openCat = function (on) { catNav.classList.toggle('is-open', on); catBtn.setAttribute('aria-expanded', String(on)); };
      catBtn.addEventListener('click', function () { openCat(!catNav.classList.contains('is-open')); });
      catNav.addEventListener('click', function (e) { if (e.target.closest('.mk-skin-category')) setTimeout(function () { syncCat(); openCat(false); catBtn.focus({ preventScroll: true }); }, 0); });
      // anywhere else (the shell is rebuilt with every render, so this never piles up)
      var shellEl = host.querySelector('.mk-skin-shell');
      if (shellEl) {
        shellEl.addEventListener('pointerdown', function (e) { if (catNav.classList.contains('is-open') && !e.target.closest('.org-cat-pop, .org-cat-btn')) openCat(false); }, true);
        shellEl.addEventListener('keydown', function (e) { if (e.key === 'Escape' && catNav.classList.contains('is-open')) { e.stopPropagation(); openCat(false); catBtn.focus({ preventScroll: true }); } });
      }
      syncCat();
    }

    // ---- own tab row ----
    var row = document.createElement('div'); row.className = 'org-tabs'; row.setAttribute('role', 'tablist'); row.setAttribute('aria-label', 'Izskats');
    row.innerHTML = TABS.map(function (t) { return '<button type="button" role="tab" data-org-tab="' + t[0] + '"><svg class="org-ico" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[t[0]] + '</svg><span>' + t[1] + '</span></button>'; }).join('');
    // The row is a floating bar at the bottom of the editor, outside the scrolling
    // settings, so it never moves with them (on a phone it sticks to the bottom).
    var band = document.createElement('div'); band.className = 'org-tabs-band';
    var shell = host.querySelector('.mk-skin-shell'), aside = host.querySelector('.mk-skin-aside');
    if (shell) { shell.classList.add('org-shell'); shell.append(band); } else tabs.before(band);
    band.append(row); tabs.hidden = true;

    // ---- the card's other side: a second sheet, so the choices are all in reach ----
    // Left: what to pick from (ready looks, pictures, layouts, colours, the picture
    // effect); right: the details. Only controls with their own listeners move (and
    // the layouts, which card-faces adopts), so everything keeps working.
    var left = document.createElement('div'); left.className = 'org-left';
    if (shell && editor.parentNode === shell) shell.insertBefore(left, editor);
    var leftTop = document.createElement('div'); leftTop.className = 'org-left-top';
    [q('.mk-skin-quick'), q('.mk-contrast')].forEach(function (n) { if (n) leftTop.append(n); });
    left.append(leftTop);
    function slot(tab, nodes) {
      var d = document.createElement('div'); d.className = 'org-slot'; d.dataset.tab = tab;
      nodes.forEach(function (n) { if (n) d.append(n); }); left.append(d); return d;
    }
    // Gatavie: the categories stay with the looks they filter (right); the left side
    // offers building your own card (its own entry sits in the list, hidden here).
    var bldBtn = null;
    if (window.MinkaSkinBuilder && window.MinkaSkinBuilder.start) {
      bldBtn = document.createElement('button'); bldBtn.type = 'button'; bldBtn.className = 'bld-entry org-bld';
      bldBtn.innerHTML = '<span class="bld-entry-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg></span>'
        + '<span><b>Būvē savu kartīti</b><small>7 soļi ar ieteikumiem, salasāmības pārbaude un punkti</small></span><i aria-hidden="true">→</i>';
      bldBtn.addEventListener('click', function () { window.MinkaSkinBuilder.start(host); });
    }
    slot('presets', [bldBtn]);
    slot('background', [bg.querySelector('.mk-bg-images')]);
    var layoutSlot = slot('layout', [face.querySelector('[data-wf-group="layout"]')]);
    if (window.MinkaCardFaces && window.MinkaCardFaces.adopt) window.MinkaCardFaces.adopt(layoutSlot);
    slot('colors', [colorsBox]);
    slot('effects', [effects]);
    // "Noņemt visu izskatu" stays in sight, under Remix (never at the end of a scroll)
    var clearRow = host.querySelector(':scope > .mk-skin-footer'); if (clearRow) leftTop.append(clearRow);
    // Beside the card: which section is open, the layout's name and the picture's.
    var label = document.createElement('div'); label.className = 'org-label';
    label.innerHTML = '<small></small><strong></strong><span></span>';
    if (aside) aside.prepend(label);
    function syncLabel() {
      var f = host.querySelector('.wf-face-choice[aria-pressed="true"] strong');
      var pic = host.querySelector('.mk-skin-thumb[aria-pressed="true"], .mk-skin-thumb.is-active, .mk-skin-grad-sw.is-active');
      var tab = TABS.filter(function (t) { return t[0] === current; })[0];
      var parts = [tab ? tab[1] : '', f ? f.textContent.trim() : 'Klasika', pic ? (pic.getAttribute('title') || pic.getAttribute('aria-label') || '').trim() : ''];
      label.querySelectorAll('small,strong,span').forEach(function (el, i) { if (el.textContent !== parts[i]) el.textContent = parts[i]; });
    }

    // Liquid pill behind the selected tab (MinkaMotion.liquid, CSS springs).
    var pill = document.createElement('span'); pill.className = 'org-tab-pill'; pill.setAttribute('aria-hidden', 'true'); row.prepend(pill);
    // Width changes (window resize, the panel first shown) re-seat it without motion.
    // One observer per editor, replaced on each render: an observer left running keeps
    // its old elements (and the whole previous editor with them) in memory.
    if (host.__orgRO) host.__orgRO.disconnect();
    host.__orgRO = window.ResizeObserver ? new ResizeObserver(function () {
      var t = row.querySelector('.is-active');
      if (t && window.MinkaMotion && window.MinkaMotion.liquid && window.MinkaMotion.liquid(pill, row, t, { animate: false })) row.classList.add('has-pill');
    }) : null;
    if (host.__orgRO) host.__orgRO.observe(row);
    function show(name) {
      current = name;
      var prevTab = row.querySelector('.is-active');
      row.querySelectorAll('[data-org-tab]').forEach(function (b) { var on = b.dataset.orgTab === name; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
      var MM = window.MinkaMotion, nextTab = row.querySelector('.is-active');
      if (MM && MM.liquid && nextTab && MM.liquid(pill, row, nextTab, { from: prevTab, animate: !!prevTab && prevTab !== nextTab })) row.classList.add('has-pill');
      // on a narrow phone the row scrolls: keep the chosen tab in view
      if (nextTab && row.scrollWidth > row.clientWidth) row.scrollTo({ left: Math.max(0, nextTab.offsetLeft - (row.clientWidth - nextTab.offsetWidth) / 2), behavior: prevTab ? 'smooth' : 'auto' });
      var faceTab = orig('face');
      if (shell) shell.dataset.orgTab = name;
      syncLabel();
      if (window.MinkaCardFaces && window.MinkaCardFaces.quiet) window.MinkaCardFaces.quiet(name === 'presets' || name === 'background');
      placeInspector();
      // each section starts at its top (the settings scroll on their own)
      if (prevTab && prevTab !== nextTab) { editor.scrollTop = 0; left.scrollTop = 0; }
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
      var k = Math.max(1, Math.round(window.devicePixelRatio || 1)), box = [64, 64];   // small square tiles
      var modes = thumbModes(ink, k);
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
    // A hint under a control that still works (unlike lock, nothing is greyed out).
    function note(el, text) {
      if (!el) return;
      var n = el.nextElementSibling && el.nextElementSibling.classList.contains('org-note') ? el.nextElementSibling : null;
      if (text && !n) { n = document.createElement('div'); n.className = 'org-lock-note org-note'; el.after(n); }
      if (n) { if (text) { if (n.textContent !== text) n.textContent = text; } else n.remove(); }
    }
    function syncLocks() {
      var card = previewList && previewList.querySelector('.mk-mid-card');
      if (!card) return;
      var dither = card.matches('[data-watch-face="dither"], .mk-fx-dither');
      // Kartītes izskats (tonis) works on the dithered picture too, so it is never locked.
      // The Dither face hides the material section altogether (card-dither.css) — no orphan note there.
      var ditherFace = card.matches('[data-watch-face="dither"]');
      lock(face.querySelector('.wf-metal'), ditherFace ? 'Dither izkārtojumam ir savs punktotais ietvars akcenta krāsā: to maini ar Akcenta krāsu.' : '');
      lock(face.querySelector('.wf-finish'), ditherFace ? 'Dither izkārtojumā cipari ir punktoti, tāpēc stils tos nemaina.' : dither ? 'Ar Dither efektu cipari ir punktoti, tāpēc materiāls tos nemaina. Ciparu krāsu maini ar Akcenta krāsu, Ciparu krāsu vai Izkārtojums → Šī elementa krāsa.' : '');
      lock(host.querySelector('.org-wm'), dither ? 'Ar Dither efektu emoji aiz cipara netiek rādīts.' : '');
      // Tonēts: one hue over the whole card decides the number and text colours.
      var tinted = card.getAttribute('data-full-tint') === 'tinted', tools = colorsBox.querySelectorAll('.mk-skin-tool');
      lock(tools[0], tinted ? 'Tonētajā izskatā ciparu krāsu nosaka tonis (zemāk: Kartītes tonis).' : '');
      var inked = card.matches('[data-watch-face="winamp"], [data-watch-face="gameboy"], [data-watch-face="thermo"], [data-watch-face="dots"], [data-watch-face="lines"]');
      lock(colorsBox.querySelector('.mk-skin-tool-text'), tinted ? 'Tonētajā izskatā teksta krāsu nosaka tonis.' : inked ? 'Šim izkārtojumam teksts ir daļa no dizaina (sava tinte). Atsevišķam elementam krāsu var mainīt: Izkārtojums → izvēlies elementu → Krāsa.' : '');
      // Dither: the name and values sit on dark chips (light ones on paper); a text
      // colour that would vanish there is not used — say so under the tile.
      var dth = card.matches('[data-watch-face="dither"], .mk-fx-dither'), paper = card.classList.contains('mk-fx-ditherpaper');
      var autoOn = !!(host.querySelector('.mk-auto-palette-toggle') || {}).checked;   // Auto picks its own colours: nothing to say then
      var unreadable = !tinted && !autoOn && dth && card.classList.contains('mk-has-txt') && card.classList.contains('mk-txt-dark') !== paper;
      note(colorsBox.querySelector('.mk-skin-tool-text'), unreadable ? (paper ? 'Uz Dither papīra teksts ir uz gaišām plāksnītēm: izvēlies tumšāku krāsu.' : 'Dither kartītē teksts ir uz tumšām plāksnītēm: izvēlies gaišāku krāsu, tumša tur nebūtu redzama.') : '');
      // Layouts with a background of their own (a screen, paper, a thermostat) show no
      // picture: Fons says so at the top and dims what would do nothing, with a way out.
      var ownBg = card.matches('[data-watch-face="winamp"], [data-watch-face="gameboy"], [data-watch-face="thermo"], [data-watch-face="dots"], [data-watch-face="lines"]');
      var bgSlot = left.querySelector('.org-slot[data-tab="background"]'), fname = host.querySelector('.wf-face-choice[aria-pressed="true"] strong');
      var banner = bgSlot && bgSlot.querySelector(':scope > .org-banner');
      if (ownBg && bgSlot) {
        if (!banner) {
          banner = document.createElement('div'); banner.className = 'org-banner';
          banner.innerHTML = '<p></p><button type="button">Izvēlēties izkārtojumu ar attēlu</button>';
          banner.querySelector('button').addEventListener('click', function () { show('layout'); });
          bgSlot.prepend(banner);
        }
        var msg = 'Izkārtojumam „' + (fname ? fname.textContent.trim() : '') + '” ir savs fons, tāpēc attēls, krāsa un zīmējums nav redzami. Attēlu rāda Klasika, Foto stikls, Loks, Moduļi un Dither.';
        if (banner.firstChild.textContent !== msg) banner.firstChild.textContent = msg;
      } else if (banner) banner.remove();
      [host.querySelector('.mk-bg-images'), bg.querySelector('.mk-bg-workspace'), face.querySelector('details.wf-background')].forEach(function (el) {
        if (el) { el.classList.toggle('org-locked', ownBg); el.setAttribute('aria-disabled', String(ownBg)); }
      });
      var effected = card.matches('.mk-fx-dither, .mk-fx-pic, [data-watch-face="dither"]');
      lock(face.querySelector('.wf-depth-control'), effected ? 'Ar attēla efektu izgrieztais objekts netiek likts priekšā ciparam — tas būtu bez efekta.' : '');
    }
    var lockFrame = 0;
    if (host.__orgMO) host.__orgMO.disconnect();
    host.__orgMO = previewList && window.MutationObserver ? new MutationObserver(function () {
      if (!lockFrame) lockFrame = requestAnimationFrame(function () { lockFrame = 0; syncLocks(); syncLabel(); syncGlow(); });
    }) : null;
    if (host.__orgMO) host.__orgMO.observe(previewList, { attributes: true, subtree: true, attributeFilter: ['class', 'data-watch-face', 'data-full-tint'] });
    // The host element outlives every re-render: its listeners are bound once and
    // always talk to the latest render (older closures would point at old cards).
    // The light behind the card takes the card's own number colour (one static
    // gradient, repainted only when the colour changes).
    function syncGlow() {
      var card = previewList && previewList.querySelector('.mk-mid-card');
      if (!card || !aside) return;
      var c = getComputedStyle(card).getPropertyValue('--mk-num-color').trim().split(',').map(Number);
      var v = c.length === 3 && c.every(isFinite) ? 'rgb(' + c.join(',') + ')' : '';
      if (aside.style.getPropertyValue('--org-glow') !== v) aside.style.setProperty('--org-glow', v);
      // The window takes the card's colour (M3 dynamic colour): the number's colour
      // when it has one, else the card's accent. A grey seed leaves the window as is.
      var modal = document.getElementById('worker-modal'); if (!modal) return;
      var seed = c.length === 3 && c.every(isFinite) && Math.max.apply(null, c) - Math.min.apply(null, c) > 40 ? c : null;
      if (!seed) { var t = (getComputedStyle(card).getPropertyValue('--wf-tint') || '').trim().match(/^#([0-9a-f]{6})$/i); if (t) { var tc = t[1].match(/../g).map(function (h) { return parseInt(h, 16); }); if (Math.max.apply(null, tc) - Math.min.apply(null, tc) > 40) seed = tc; } }
      // never a purple window: hues around violet leave it neutral (tinted blues stay on the blue side)
      if (seed) { var mx = Math.max.apply(null, seed), mn = Math.min.apply(null, seed), d = mx - mn, hh = 0;
        if (d) hh = mx === seed[0] ? ((seed[1] - seed[2]) / d + 6) % 6 : mx === seed[1] ? (seed[2] - seed[0]) / d + 2 : (seed[0] - seed[1]) / d + 4;
        hh *= 60; if (hh > 228 && hh < 330) seed = null; }
      var sv = seed ? 'rgb(' + seed.join(',') + ')' : '';
      if (modal.style.getPropertyValue('--org-seed') !== sv) { if (sv) modal.style.setProperty('--org-seed', sv); else modal.style.removeProperty('--org-seed'); }
      modal.classList.toggle('org-tinted', !!sv);
    }
    function syncAll() { syncLabel(); syncGlow(); }
    host.__org = { paint: paint, paintAll: paintAll, effectThumbs: effectThumbs, syncLocks: syncLocks, sync: syncAll, tab: function () { return current; } };
    if (!host.__orgBound) {
      host.__orgBound = true;
      host.addEventListener('input', function (e) { if (e.target.type === 'range' && host.__org) host.__org.paint(e.target); }, true);
      host.addEventListener('click', function () { setTimeout(function () { if (host.__org) { host.__org.paintAll(); host.__org.sync(); } }, 0); }, true);
      // A quiet save (effect / colour) keeps the editor; only the previews follow a colour change.
      host.addEventListener('mk-skin-quiet', function () { var o = host.__org; if (!o) return; if (o.tab() === 'effects') o.effectThumbs(); o.syncLocks(); o.sync(); });
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
    // A click (no drag) on the decoration opens its own settings: Efekti → Dekori,
    // in the decoration's group, its tile in view.
    var addonDown = null;
    if (previewList) previewList.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      // the decoration found at the press (by its drawn pixels): with its own effect it is
      // painted by another layer, so the click itself may land on something else
      var addon = addonDown && addonDown[2];
      if (!addon || !addon.isConnected || Math.abs(e.clientX - addonDown[0]) + Math.abs(e.clientY - addonDown[1]) > 6) return;
      selectFrame(false); selectBackground(false);
      if (current !== 'effects') show('effects');
      var grp = addon.dataset.addonGroup, gb = grp && host.querySelector('.mk-addon-group[data-addon-group="' + grp + '"]');
      if (gb && !gb.classList.contains('is-active')) gb.click();
      // its menu (size, side, effect, colour) sits at the top of Dekori: shown from there
      setTimeout(function () {
        var sec = host.querySelector('.mk-addon-section');
        var menu = sec && (sec.querySelector('.mk-addon-controls:not([hidden])') || sec.querySelector('.mk-addon-look:not([hidden])'));
        if (editor.scrollTop) editor.scrollTo({ top: 0, behavior: 'smooth' });
        if (menu) { menu.classList.add('org-flash'); setTimeout(function () { menu.classList.remove('org-flash'); }, 900); }
      }, 60);
    }, true);
    // Click what you want to change: an element → its settings, the picture → Fons.
    if (previewList) previewList.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !e.target.closest('.mk-mid-card')) return;
      // What was pressed is decided by what is drawn there (card-faces pick): the
      // smallest element under the pointer, a decoration or the object only on
      // their opaque pixels. The face editor handles the same press the same way.
      var F = window.MinkaCardFaces, hit = F && F.pick ? F.pick(e) : undefined;
      var addonEl = hit === undefined ? e.target.closest('.mk-card-addon') : hit && hit.kind === 'addon' ? hit.el : null;
      // The decoration drags on its own; a click without moving opens its menu (above).
      if (addonEl) { addonDown = [e.clientX, e.clientY, addonEl]; return; }
      addonDown = null;
      var part = hit === undefined || (!hit && e.target.closest('[data-wf-part]')) ? e.target.closest('[data-wf-part]') : hit && hit.kind === 'part' ? hit.el : null, card = e.target.closest('.mk-mid-card');
      if (hit && hit.kind === 'depth') {
        // The object in front of the numeral is part of the picture: Fons, its position below.
        selectFrame(false); selectBackground(false);
        if (current !== 'background') show('background');
        setTimeout(function () { var pos = face.querySelector('details.wf-background'); if (pos) pos.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
        return;
      }
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
      // (the original classic card gets a layout on this press: card-faces becomeLayout)
      if (current !== 'layout') show('layout');
      // the face editor selects the part on this same pointerdown; then bring its settings into view
      setTimeout(function () { var head = face.querySelector('.wf-part-head'); if (head) head.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
    }, true);
    // M3 sliders paint their active track from --p (values are also set from code: repaint after clicks).
    function paint(r) { var min = +r.min || 0, max = +r.max || 100, v = +r.value; r.style.setProperty('--p', ((v - min) / ((max - min) || 1) * 100).toFixed(1) + '%'); }
    function paintAll() { host.querySelectorAll('input[type="range"]').forEach(paint); }
    show(current); paintAll(); syncLocks(); syncGlow();
    // The card was sized before this layout existed (a narrow column): size it again
    // now, before the first paint, or every rebuild (a colour, a look) jumps 300 → 440 px.
    if (window.MinkaCardFaces && window.MinkaCardFaces.refreshPreview) window.MinkaCardFaces.refreshPreview();
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
