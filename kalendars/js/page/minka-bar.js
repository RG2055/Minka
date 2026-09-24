/* ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½
   MINKA BAR v3 ï¿½ lightweight, fast, proactive AI assistant
   - contenteditable input (no form/label issues)
   - Web Audio sounds (no files)
   - Proactive messages: weather, news, fatigue, vÄrdadienas
   - AI: instant responses via Anthropic API
   - RSS news cycling from LSM.lv
ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ */
(function() {
  'use strict';

  /* ï¿½ï¿½ï¿½ï¿½ DOM refs ï¿½ï¿½ï¿½ï¿½ */
  const bar     = document.getElementById('minkaBar');
  const inner   = document.getElementById('minkaBarInner');
  const input   = document.getElementById('minkaBarInput');
  const hint    = document.getElementById('minkaBarHint');
  const pill    = document.getElementById('minkaBarPill');
  const clearB  = document.getElementById('minkaBarClear');
  const muteB   = document.getElementById('minkaBarMute');
  const searchLaunch = document.getElementById('mkSearchLaunch');
  const results = document.getElementById('minkaResults');
  const aiPanel = document.getElementById('minkaAiPanel');
  const mainPanel = document.querySelector('.main-panel');
  const aiMode  = document.getElementById('minkaAiMode');
  const aiText  = document.getElementById('minkaAiText');
  if (!bar || !input) return;

  /* ï¿½ï¿½ï¿½ï¿½ Sound engine (Web Audio, zero files) ï¿½ï¿½ï¿½ï¿½ */
  let _ac = null;
  let __minkaMuted = false;
  try { __minkaMuted = localStorage.getItem('minka_muted') === '1'; } catch(e) {}
  function setMuteUI() {
    if (!muteB) return;
  muteB.textContent = __minkaMuted ? '🔇' : '🔊';
  muteB.title = __minkaMuted ? 'Skaņa izslēgta' : 'Skaņa ieslēgta';
  muteB.setAttribute('aria-label', __minkaMuted ? 'Ieslēgt skaņu' : 'Izslēgt skaņu');
    muteB.style.opacity = __minkaMuted ? '0.85' : '1';
  }
  setMuteUI();
  if (muteB) muteB.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    __minkaMuted = !__minkaMuted;
    try { localStorage.setItem('minka_muted', __minkaMuted ? '1' : '0'); } catch(err) {}
    setMuteUI();
  });
  function ac() {
    if (!_ac) try { _ac = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){}
    if (_ac && _ac.state === 'suspended') _ac.resume().catch(()=>{});
    return _ac;
  }
  // Modern soft chime: two sine waves + gentle gain envelope
  function chime(notes, vol) {
    if (__minkaMuted) return;
    const c = ac(); if (!c) return;
    try {
      const master = c.createGain();
      master.gain.setValueAtTime(0, c.currentTime);
      master.gain.linearRampToValueAtTime(vol || 0.04, c.currentTime + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (notes[0][1] || 0.18));
      master.connect(c.destination);
      notes.forEach(([freq, dur], i) => {
        setTimeout(() => {
          if (__minkaMuted) return;
          try {
            const o = c.createOscillator(), g = c.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, c.currentTime);
            g.gain.linearRampToValueAtTime(1, c.currentTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
            o.connect(g); g.connect(master);
            o.start(); o.stop(c.currentTime + dur + 0.02);
          } catch(e) {}
        }, i * 55);
      });
    } catch(e) {}
  }
  const snd = {
    click:  () => chime([[1047, 0.10], [1319, 0.08]], 0.035),          // C6→E6 soft tap
    nav:    () => chime([[880, 0.10], [1109, 0.09]], 0.030),           // A5→C#6
    open:   () => chime([[659, 0.14], [880, 0.12], [1047, 0.10]], 0.032), // E5→A5→C6 open chord
    close:  () => chime([[1047, 0.10], [784, 0.12]], 0.028),           // C6→G5 descend
    type:   () => chime([[1319 + Math.random()*220, 0.04]], 0.012),    // random high tap
    ai:     () => chime([[523, 0.08], [659, 0.10], [784, 0.12]], 0.030), // C5→E5→G5 arpeggio
    warn:   () => chime([[392, 0.16], [349, 0.18]], 0.045),            // G4→F4 descending warn
    news:   () => chime([[1047, 0.07], [1175, 0.09]], 0.022),          // C6→D6 gentle ping
  };

  /* ï¿½ï¿½ï¿½ï¿½ Global click sounds ï¿½ï¿½ï¿½ï¿½ */
  document.addEventListener('click', e => {
    const el = e.target.closest('button,.day-btn,.card,.duty-block,.pill,[onclick],.result-item');
    if (!el || el === clearB || el.id === 'minkaBarMenu' || el.id === 'minkaBarMute') return;
    if (el.classList.contains('pill') || el.classList.contains('arrow')) snd.nav();
    else if (el.classList.contains('card') || el.classList.contains('duty-block')) snd.open();
    else snd.click();
  }, true);

  /* ï¿½ï¿½ï¿½ï¿½ Typing sounds ï¿½ï¿½ï¿½ï¿½ */
  let _typeN = 0;
  document.addEventListener('keydown', e => {
    if (document.activeElement === input && e.key.length === 1) {
      if (++_typeN % 4 === 0) snd.type();
    }
  }, true);

  /* ï¿½ï¿½ï¿½ï¿½ State ï¿½ï¿½ï¿½ï¿½ */
  let _text = '';
  let _hintTimer, _hintErase, _hintIdx = 0;
  let _aiDebounce, _aiOpen = false;
  let _msgQueue = [], _msgBusy = false;
  let _msgHideTimer = 0, _msgRunToken = 0;
  let _newsItems = [], _newsFeedIdx = {v:0,l:0,r:0};
  let _cbId = 0;

  const _dn = ['Svētdiena','Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena'];
  const _td = new Date();
  const _todayStr = _dn[_td.getDay()] + ', ' + _td.getDate() + '.' + String(_td.getMonth()+1).padStart(2,'0') + '.' + _td.getFullYear();
  const HINTS = [
    'Meklē nodaļu, numuru vai darbinieku...',
    _todayStr,
  ];
  const RSS  = 'https://api.rss2json.com/v1/api.json';
  const FEEDS = {
    v:  'https://www.lsm.lv/rss/?lang=lv&catid=51',    // VeselÄ«ba
    l:  'https://www.lsm.lv/rss/?lang=lv&catid=20',    // Latvija
    r:  'https://www.lsm.lv/rss/?lang=lv&catid=22695', // RÄ«ga
    sv: 'https://www.lsm.lv/rss/?lang=lv&catid=16',    // SabiedrÄ«ba
    ek: 'https://www.lsm.lv/rss/?lang=lv&catid=14',    // Ekonomika
    pa: 'https://www.lsm.lv/rss/?lang=lv&catid=29',    // Pasaule
    sp: 'https://www.lsm.lv/rss/?lang=lv&catid=12',    // Sports
  };
  const FEEDS_LABELS = {v:'Veselība',l:'Latvija',r:'Rīga',sv:'Sabiedrība',ek:'Ekonomika',pa:'Pasaule',sp:'Sports'};
  /* VARDA ï¿½ tiek izmantots no data/varda.js (window.LATVIAN_NAMEDAYS) */
  function openExternalLink(url) {
    const target = String(url || '').trim();
    if (!target) return;
    // Tauri v2: invoke open_external Rust command (uses open crate)
    try {
      const invoke = window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function'
        ? window.__TAURI__.core.invoke : null;
      if (invoke) {
        invoke('open_external', { url: target }).catch(function(err){
          console.warn('[Minka] open_external failed:', err);
          try { window.open(target, '_blank', 'noopener'); } catch (_e) {}
        });
        return;
      }
    } catch (_e) {}
    try { window.open(target, '_blank', 'noopener'); } catch (_e) {}
  }

  /* ï¿½ï¿½ï¿½ï¿½ Hint animation ï¿½ï¿½ï¿½ï¿½ */
  /* Static hint — no typewriter animation */
  const _dn2 = ['Svētdiena','Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena'];
  const _d2  = new Date();
  const _staticHint = _dn2[_d2.getDay()] + ', '
    + String(_d2.getDate()).padStart(2,'0') + '.'
    + String(_d2.getMonth()+1).padStart(2,'0') + '.'
    + _d2.getFullYear();
  const _searchIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const _searchDateEl = document.getElementById('mkSearchDate');
  const _searchWeekdayEl = document.getElementById('mkSearchWeekday');
  const _searchDateNumEl = document.getElementById('mkSearchDateNum');
  const _searchTodayEl = document.getElementById('mkSearchToday');

  function mkNormalizeDateStr(dateStr) {
    const m = String(dateStr || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return '';
    return String(m[1]).padStart(2, '0') + '.' + String(m[2]).padStart(2, '0') + '.' + m[3];
  }
  function mkTodayStr() {
    const now = new Date();
    return String(now.getDate()).padStart(2, '0') + '.'
      + String(now.getMonth() + 1).padStart(2, '0') + '.'
      + now.getFullYear();
  }
  function mkFormatWeekday(dateStr) {
    const m = String(dateStr || '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m) return _dn2[new Date().getDay()];
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return _dn2[d.getDay()];
  }
  function updateSearchDate(dateStr) {
    const normalized = mkNormalizeDateStr(dateStr) || mkTodayStr();
    const isToday = normalized === mkTodayStr();
    if (_searchWeekdayEl) _searchWeekdayEl.textContent = mkFormatWeekday(normalized);
    if (_searchDateNumEl) _searchDateNumEl.textContent = normalized;
    if (_searchTodayEl) _searchTodayEl.hidden = !isToday;
    if (_searchDateEl) _searchDateEl.classList.toggle('is-today', isToday);
    if (input) input.setAttribute('data-ph', mkFormatWeekday(normalized) + ', ' + normalized);
  }

  function typeHint()  { /* disabled — static only */ }
  function eraseHint(cb) { if (cb) cb(); }
  function startHints() {
    if (_text) return;
    hint.innerHTML = '<span>Meklē nodaļu, numuru vai darbinieku...</span>';
    hint.style.opacity = '1';
    hint.style.visibility = 'visible';
  }
  function stopHints() {
    hint.style.opacity = '0';
    hint.style.visibility = 'hidden';
  }
  function openSearchMode() {
    bar.classList.add('search-open');
    setMode('search');
    focusMinkaInput();
    if (!_text) {
      hint.innerHTML = '<span>Meklē nodaļu, numuru vai darbinieku...</span>';
      hint.style.opacity = '1';
      hint.style.visibility = 'visible';
    }
  }
  function closeSearchMode() {
    if (_text) return;
    bar.classList.remove('search-open');
    setMode('idle');
    stopHints();
  }

  /* ï¿½ï¿½ï¿½ï¿½ Input handling (contenteditable) ï¿½ï¿½ï¿½ï¿½ */
  function getText() { return input.textContent.trim(); }
  function clearText() { input.textContent = ''; _text = ''; updateState(); }

  input.addEventListener('focus', () => { bar.classList.add('focused'); stopHints(); });
  input.addEventListener('blur',  () => {
    bar.classList.remove('focused');
    if (!_text) { closeSearchMode(); setTimeout(drainMsgs, 1500); }
  });
  /* Kill hint on first keydown — fires BEFORE any character is inserted */
  input.addEventListener('keydown', () => { stopHints(); }, { capture: true, passive: true });

  input.addEventListener('input', () => {
    stopHints(); // belt-and-suspenders: hide on every input event too
    _text = getText();
    updateState();
    clearTimeout(_aiDebounce);

    // If user starts typing ï¿½ immediately stop any proactive message
    if (_text && _msgBusy) {
      abortTypewrite();
      _msgBusy = false;
      closeAi();
    }

    if (!_text) { setMode('search'); closeAi(); closeResults(); startHints(); setTimeout(drainMsgs, 2000); return; }

    // AI Q&A removed — it was a broken direct api.anthropic.com call (no key,
    // always failed). Typed text now always goes to search.
    setMode('search');
    closeAi();
    doSearch(_text);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { clearText(); closeAi(); closeResults(); input.blur(); closeSearchMode(); snd.close(); }
    if (e.key === 'Enter') { e.preventDefault(); }
  });

  clearB.addEventListener('click', () => { clearText(); closeAi(); closeResults(); input.focus(); snd.click(); });
  if (searchLaunch) {
    searchLaunch.addEventListener('click', function(e) {
      e.preventDefault();
      openSearchMode();
      snd.click();
    });
  }

  /* ï¿½ï¿½ï¿½ï¿½ Make contenteditable behave like input ï¿½ï¿½ï¿½ï¿½ */
  // contenteditable/inputmode/autocorrect live in the #minkaBarInput markup:
  // switching contenteditable on from here, mid-parse, forced a full layout.
  function focusMinkaInput() {
    try { input.focus({ preventScroll:true }); } catch(e) { input.focus(); }
  }
  [input].forEach(function(el) {
    if (!el) return;
    el.addEventListener('touchend', function(e) {
      var t = e.target;
      if (t === clearB || t === muteB || (t && t.id === 'minkaBarMenu')) return;
      focusMinkaInput();
    }, { passive:true });
    el.addEventListener('click', function(e) {
      var t = e.target;
      if (t === clearB || t === muteB || (t && t.id === 'minkaBarMenu')) return;
      focusMinkaInput();
    });
  });
  input.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData||window.clipboardData).getData('text/plain').replace(/\n/g,' ').slice(0,100);
    document.execCommand('insertText', false, text);
  });

  /* ï¿½ï¿½ï¿½ï¿½ State management ï¿½ï¿½ï¿½ï¿½ */
  function updateState() {
    bar.classList.toggle('has-text', !!_text);
  }
  function setMode(m) {
    bar.classList.toggle('ai-mode', m==='ai');
    bar.classList.remove('ai-mode');
    if (m==='ai') { pill.textContent='?'; bar.classList.add('ai-mode'); }
    else if (m==='search') { pill.textContent='MEKLĒ'; }
    else { pill.textContent='MINKA'; }
  }

  /* ï¿½ï¿½ï¿½ï¿½ Results ï¿½ï¿½ï¿½ï¿½ */
  function closeResults() { results.style.display='none'; results.innerHTML=''; }
  function doSearch(q) {
    const query = String(q || '').trim();
    if (query.length < 2) { closeResults(); return; }
    if (typeof renderSearchResults === 'function') {
      renderSearchResults(query, results);
      requestAnimationFrame(() => { results.style.display = results.innerHTML.trim() ? 'block' : 'none'; });
    } else {
      closeResults();
    }
  }

  updateSearchDate(window.__activeDateStr || window.__g_todayStr || mkTodayStr());
  window.addEventListener('daySelected', function(e) {
    const ds = e && e.detail && e.detail.date ? e.detail.date : '';
    updateSearchDate(ds);
  });

  /* ï¿½ï¿½ï¿½ï¿½ AI panel ï¿½ï¿½ï¿½ï¿½ */
  function openAi() { aiPanel.classList.add('open'); document.body.classList.remove('ai-collapsed'); _aiOpen = true; }
  function closeAi() { aiPanel.classList.remove('open'); document.body.classList.add('ai-collapsed'); _aiOpen = false; aiText.innerHTML = ''; }

  /* ï¿½ï¿½ï¿½ï¿½ Typewriter ï¿½ï¿½ï¿½ï¿½ */
  let _twRunId = 0;
  let _twTimer = 0;

  function abortTypewrite() {
    _twRunId++;
    clearTimeout(_twTimer);
    _twTimer = 0;
  }

  function typewrite(el, text, speed) {
    speed = speed || 22; // faster base speed
    abortTypewrite();
    const runId = _twRunId;
    text = String(text || '');

    if (document.hidden || text.length > 180) {
      el.textContent = text;
      return Promise.resolve();
    }

    // Use a text node + caret span ï¿½ no textContent rebuild on every char
    el.innerHTML = '';
    const textNode = document.createTextNode('');
    const caret = document.createElement('span');
    caret.id = 'minkaAiCaret';
    el.appendChild(textNode);
    el.appendChild(caret);

    return new Promise(resolve => {
      let i = 0;
      // Batch characters so message typing does not repaint on every single letter.
      const batchSize = text.length > 120 ? 6 : 4;

      (function tick() {
        if (runId !== _twRunId) {
          resolve();
          return;
        }
        if (i < text.length) {
          // Write batchSize chars at once
          const chunk = text.slice(i, i + batchSize);
          textNode.nodeValue += chunk;
          i += batchSize;

          const lastChar = chunk[chunk.length - 1];
          let d = speed + Math.random() * 8;
          if ('.!?'.includes(lastChar)) d += 60;  // reduced from 160
          else if (',;:'.includes(lastChar)) d += 30; // reduced from 80

          _twTimer = setTimeout(tick, Math.max(16, d * 0.55));
        } else {
          // Done ï¿½ remove caret cleanly
          if (caret.parentNode) caret.parentNode.removeChild(caret);
          resolve();
        }
      })();
    });
  }

  /* ---- HTML-aware typewriter ---- */
  function sanitizeTypewriterHtml(html) {
    var source = document.createElement('template');
    source.innerHTML = String(html == null ? '' : html);
    var output = document.createDocumentFragment();
    var allowedTags = { B: true, STRONG: true, EM: true, BR: true, SPAN: true };

    function copyChildren(from, to) {
      Array.prototype.forEach.call(from.childNodes, function(child) {
        if (child.nodeType === 3) {
          to.appendChild(document.createTextNode(child.nodeValue || ''));
          return;
        }
        if (child.nodeType !== 1) return;
        if (!allowedTags[child.tagName]) {
          copyChildren(child, to);
          return;
        }
        var clean = document.createElement(child.tagName.toLowerCase());
        if (child.tagName === 'SPAN') {
          var color = child.style && child.style.color;
          var weight = child.style && child.style.fontWeight;
          if (color && (/^#[0-9a-f]{3,8}$/i.test(color) || /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(color))) {
            clean.style.color = color;
          }
          if (/^(?:[4-9]00|bold)$/i.test(weight || '')) clean.style.fontWeight = weight;
        }
        to.appendChild(clean);
        copyChildren(child, clean);
      });
    }

    copyChildren(source.content, output);
    return output;
  }

  function typewriteHtml(el, html, speed) {
    speed = speed || 30;
    abortTypewrite();
    var runId = _twRunId;

    // Parse HTML once into real DOM, collect text-node segments
    var tmp = document.createElement('div');
    tmp.appendChild(sanitizeTypewriterHtml(html));
    el.innerHTML = '';
    if (document.hidden || tmp.textContent.length > 220) {
      while (tmp.firstChild) el.appendChild(tmp.firstChild);
      return Promise.resolve();
    }

    var segments = []; // {node: TextNode, full: string}
    function cloneTree(src, dest) {
      src.childNodes.forEach(function(child) {
        if (child.nodeType === 3 /* TEXT_NODE */) {
          var tn = document.createTextNode('');
          dest.appendChild(tn);
          if (child.nodeValue) segments.push({node: tn, full: child.nodeValue});
        } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
          var el2 = document.createElement(child.tagName);
          if (child.tagName === 'SPAN') {
            el2.style.color = child.style.color || '';
            el2.style.fontWeight = child.style.fontWeight || '';
          }
          dest.appendChild(el2);
          cloneTree(child, el2);
        }
      });
    }
    cloneTree(tmp, el);

    var caret = document.createElement('span');
    caret.id = 'minkaAiCaret';
    el.appendChild(caret);

    var segIdx = 0, charIdx = 0;
    var batchSize = tmp.textContent.length > 120 ? 6 : 4;
    return new Promise(function(resolve) {
      (function tick() {
        if (runId !== _twRunId) { resolve(); return; }
        // advance to next non-empty segment if current is done
        while (segIdx < segments.length && charIdx >= segments[segIdx].full.length) {
          segments[segIdx].node.nodeValue = segments[segIdx].full;
          segIdx++; charIdx = 0;
        }
        if (segIdx >= segments.length) {
          if (caret.parentNode) caret.parentNode.removeChild(caret);
          resolve(); return;
        }
        charIdx += batchSize;
        segments[segIdx].node.nodeValue = segments[segIdx].full.slice(0, charIdx);
        _twTimer = setTimeout(tick, Math.max(16, speed * 0.55 + Math.random() * 5));
      })();
    });
  }


  /* ï¿½ï¿½ï¿½ï¿½ Ask AI ï¿½ï¿½ï¿½ï¿½ */

  /* ï¿½ï¿½ï¿½ï¿½ Proactive message queue ï¿½ï¿½ï¿½ï¿½ */
  function getModeLabel(mode) {
  const modeLabels = {weather:'LAIKS', warning:'NOGURUMS', news:'ZIŅAS', info:'MINKA', top:'TOP', bolus:'BOLUS'};
    return modeLabels[mode] || 'MINKA';
  }

  function setupPanelLink(mode, link) {
    const chip = document.getElementById('minkaNamedayChip');
    if (mode === 'news' && link) {
      aiPanel.style.cursor = 'pointer';
      aiPanel.classList.add('news-clickable');
      aiPanel.onclick = () => openExternalLink(link);
  aiPanel.title = 'Atvērt ziņu';
      if (chip) {
        chip.classList.add('news-clickable');
        chip.style.cursor = 'pointer';
        chip.onclick = () => openExternalLink(link);
  chip.title = 'Atvērt ziņu';
      }
    } else {
      aiPanel.style.cursor = '';
      aiPanel.classList.remove('news-clickable');
      aiPanel.onclick = null;
      aiPanel.title = '';
      if (chip) {
        chip.classList.remove('news-clickable');
        chip.style.cursor = '';
        chip.onclick = null;
        chip.title = '';
      }
    }
  }

  function presentMessage(item, durationMs) {
    const text = item && item.text ? String(item.text) : '';
    if (!text) {
      _msgBusy = false;
      setTimeout(drainMsgs, 0);
      return;
    }

    const mode = item && item.mode ? item.mode : 'info';

    // These modes are now displayed inside the main bar (ticker, chips) — skip the panel.
    if (mode === 'info' || mode === 'weather' || mode === 'news') {
      _msgBusy = false;
      setTimeout(drainMsgs, 0);
      return;
    }
    const link = item && item.link ? item.link : '';
    const token = ++_msgRunToken;

    _msgBusy = true;
    clearTimeout(_msgHideTimer);
    abortTypewrite();
    aiText.innerHTML = '';

    aiMode.textContent = getModeLabel(mode);
    if (mode === 'warning') snd.warn();
    else if (mode === 'news') snd.news();
    else snd.ai();

    setupPanelLink(mode, link);
    openAi();
    setMode('ai');

    const isProactive = (mode === 'bolus' || mode === 'top');
    const twFn = isProactive ? typewriteHtml : typewrite;
    twFn(aiText, text, 35).then(() => {
      if (token !== _msgRunToken) return;
      clearTimeout(_msgHideTimer);
      _msgBusy = false;
      if (_msgQueue.length) {
        _msgHideTimer = setTimeout(() => { if (token === _msgRunToken) drainMsgs(); }, Math.max(4000, durationMs || 10000));
      } else if (isProactive) {
        // Auto-close proactive messages so panel doesn't block future messages
        _msgHideTimer = setTimeout(() => { if (token === _msgRunToken) closeAi(); }, 8000);
      }
    });
  }

  function qMsg(text, mode, link) {
    _msgQueue.push({text, mode: mode||'info', link: link||''});
    if (!_msgBusy) drainMsgs();
  }
  window.__minkaQueueMessage = qMsg;

  window.__minkaClearQueuedMessages = function(mode) {
    if (!mode) {
      _msgQueue = [];
      return;
    }
    const target = String(mode);
    _msgQueue = _msgQueue.filter(item => String(item && item.mode || '') !== target);
  };

  window.isUiNavigationBusy = window.isUiNavigationBusy || function(){
    return Number(window.__minkaUiBusyUntil || 0) > Date.now();
  };

  window.__minkaShowPriorityMessage = function(text, mode, link, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    if (o.clearAll) {
      _msgQueue = [];
    } else if (Array.isArray(o.clearModes) && o.clearModes.length) {
      const clearSet = new Set(o.clearModes.map(v => String(v)));
      _msgQueue = _msgQueue.filter(item => !clearSet.has(String(item && item.mode || '')));
    }
    if (window.isUiNavigationBusy && window.isUiNavigationBusy()) {
      window.__minkaQueueMessage(text, mode || 'info', link || '');
      return;
    }
    clearTimeout(_msgHideTimer);
    _msgBusy = false;
    presentMessage({ text, mode: mode || 'info', link: link || '' }, o.durationMs || 9000);
  };

  function drainMsgs() {
    if (_msgBusy || !_msgQueue.length) return;
    if (_text || document.activeElement===input || _aiOpen) { setTimeout(drainMsgs, 4000); return; }
    const item = _msgQueue.shift();
    presentMessage(item, 10000);
  }

  /* ï¿½ï¿½ï¿½ï¿½ RSS ï¿½ï¿½ï¿½ï¿½ */
  function fetchRSS(url) {
    return fetch(RSS + '?rss_url=' + encodeURIComponent(url), {cache:'no-store'})
      .then(r => r.json())
      .then(d => (d?.status==='ok' ? d.items : []).map(x => ({
        title: String(x.title||'').replace(/<[^>]*>/g,' ').trim(),
        link:  String(x.link||x.url||'').trim()
      })).filter(x => x.title))
      .catch(() => []);
  }
  async function fetchNews() {
    // News ticker is now fed by v34 refreshNews() → window.mkTickerFeed()
    // This stub exists only for legacy callers (e.g. the proactive interval)
  }
  let _newsFeedRobin = 0;
  let _lastNewsLink = '';
  function nextNews() {
    if (!_newsItems.length) return null;
    let tries = _newsItems.length;
    while (tries-- > 0) {
      const src = _newsItems[_newsFeedRobin % _newsItems.length];
      _newsFeedRobin++;
      const k = src.key;
      if (!src.items.length) continue;
      const idx = (_newsFeedIdx[k]||0) % src.items.length;
      _newsFeedIdx[k] = idx + 1;
      const item = src.items[idx];
      _lastNewsLink = item.link || '';
      return src.cat + ': ' + item.title;
    }
    return null;
  }

  /* ï¿½ï¿½ï¿½ï¿½ Also expose searchInput alias for old code ï¿½ï¿½ï¿½ï¿½ */
  Object.defineProperty(window, '__minkaBarGetText', {get:()=>getText});
  // Legacy: if calendar.js uses #searchInput ID directly for results rendering
  // redirect results to our new container
  const legacyResultsEl = document.getElementById('results');
  if (legacyResultsEl) {
    // Mirror results to our new container
    const observer = new MutationObserver(() => {
      if (legacyResultsEl.innerHTML !== results.innerHTML) {
        results.innerHTML = legacyResultsEl.innerHTML;
        results.style.display = results.innerHTML.trim() ? 'block' : 'none';
      }
    });
    observer.observe(legacyResultsEl, {childList:true, subtree:true, characterData:true});
  }

  /* ï¿½ï¿½ï¿½ï¿½ Click outside closes panels ï¿½ï¿½ï¿½ï¿½ */
  document.addEventListener('mousedown', e => {
    if (!bar.contains(e.target)) {
      if (!_msgBusy) closeAi();
      closeResults();
      if (document.activeElement===input) input.blur();
    }
  });

  /* ï¿½ï¿½ï¿½ï¿½ Start ï¿½ï¿½ï¿½ï¿½ */
  setMode('idle');
  startHints();
})();
