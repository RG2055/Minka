/* MŪZIKA as Webamp (Winamp): Lācītis search and songs in
   the Media Library, a stream through Webamp's own audio when one answers
   (real EQ and spectrum), the official YouTube player otherwise. Classic
   Winamp is the default look. Loaded on
   the first MŪZIKA press; RADIO keeps its own player and the two never play
   together. The old Lācītis console stays reachable for a while with
   localStorage minkaMusicEngine = "lacitis" (js/radio-source.js). */
(function () {
  'use strict';
  var VERSION = '20260927wa8';
  var BASE = new URL('integrations/webamp/player/', document.baseURI).href;
  var DEFAULT_PLAYLIST = 'RDCLAK5uy_nlHCD7Y3YATeFPwGmGRiZv4pKXW57yN8o';
  // Winamp's own greeting, from YouTube: first in the playlist, and what
  // plays whenever WINAMP opens with nothing playing.
  var INTRO = { id: 'HaF-nRS_CWM', title: "It Really Whips the Llama's Ass", author: 'Winamp 2.91', lengthSeconds: 6 };
  var pending = null;
  var player = null;
  var host = null;
  var head = null;
  var tools = null;
  var now = null; // cover + "artist — title" in the head (Classic has no ALBUM ART window)
  var barHome = null; // where #radioSourceBar lives while RADIO shows
  var menu = null;

  // The old console's first screen, so "Lācītis" is never an empty list.
  var STARTER = [
    ['4NRXx6U8ABQ', 'Blinding Lights', 'The Weeknd', 200],
    ['TUVcZfQe-Kw', 'Levitating', 'Dua Lipa', 203],
    ['5NV6Rdv1a3I', 'Get Lucky', 'Daft Punk', 369],
    ['dwDns8x3Jb4', 'Around the World', 'Daft Punk', 427],
    ['bpOSxM0rNPM', 'Do I Wanna Know?', 'Arctic Monkeys', 272],
    ['hTWKbfoikeg', 'Smells Like Teen Spirit', 'Nirvana', 301],
    ['DyDfgMOUjCI', 'bad guy', 'Billie Eilish', 194],
    ['G7KNmW9a75Y', 'Flowers', 'Miley Cyrus', 200]
  ];

  function addCSS(href) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return new Promise(function (resolve, reject) { link.onload = resolve; link.onerror = reject; });
  }
  function shell() { return document.getElementById('radioWindow'); }
  function status(text) {
    var el = document.getElementById('radioSourceStatus');
    if (el) el.textContent = text || '';
  }
  function button(label, title, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mw-tool';
    b.textContent = label;
    if (title) b.title = title;
    b.addEventListener('click', onClick);
    return b;
  }

  // Two rows: a head (sign-in + RADIO/WINAMP on the left, the player's
  // tools on the right, one height and one style) and the player under it.
  function ensureHost() {
    var rw = shell();
    if (!host) {
      head = document.createElement('div');
      head.id = 'rgMusicWebampHead';
      tools = document.createElement('div');
      tools.id = 'rgMusicWebampTools';
      tools.append(
        button('MEKLĒT', 'Lācītis: meklēt dziesmas', function () { player && player.openLibrary('lacitis'); }),
        button('BIBLIOTĒKA', 'Favorīti un vēsture', function () { player && player.openLibrary(); }),
        button('SKINI', 'Winamp skini', openSkinMenu)
      );
      now = document.createElement('div');
      now.id = 'rgMusicNow';
      now.hidden = true;
      now.innerHTML = '<img alt="" width="32" height="32" decoding="async"><span></span>';
      head.append(now, tools);
      host = document.createElement('div');
      host.id = 'rgMusicWebamp';
      host.setAttribute('aria-label', 'Winamp (Lācītis)');
    }
    if (head.parentNode !== rw) rw.appendChild(head);
    if (host.parentNode !== rw) rw.appendChild(host);
    return host;
  }
  function takeBar() {
    var bar = document.getElementById('radioSourceBar');
    if (!bar || !head || bar.parentNode === head) return;
    barHome = { parent: bar.parentNode, next: bar.nextSibling };
    head.insertBefore(bar, head.firstChild);
  }
  function returnBar() {
    var bar = document.getElementById('radioSourceBar');
    if (!bar || !head || bar.parentNode !== head || !barHome) return;
    barHome.parent.insertBefore(bar, barHome.next && barHome.next.parentNode === barHome.parent ? barHome.next : null);
    barHome = null;
  }

  function updateNow() {
    if (!player || !now) return;
    var st = player.webamp.store.getState();
    var tr = st.playlist.currentTrack == null ? null : st.tracks[st.playlist.currentTrack];
    if (!tr) { now.hidden = true; return; }
    var img = now.querySelector('img'), text = now.querySelector('span');
    var art = tr.albumArtUrl || '';
    now.dataset.art = art;
    img.hidden = !art;
    if (art && img.getAttribute('src') !== art) img.src = art;
    var label = tr.artist ? tr.artist + ' — ' + (tr.title || '') : (tr.title || tr.defaultName || '');
    text.textContent = label;
    now.title = label;
    now.hidden = !label && !art;
  }

  function openSkinMenu(event) {
    if (!player) return;
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'rgMusicWebampSkins';
      menu.setAttribute('popover', 'auto');
      menu.setAttribute('aria-label', 'Skini');
      document.body.appendChild(menu);
    }
    menu.replaceChildren();
    function item(label, action, current) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (current) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () {
        menu.hidePopover();
        Promise.resolve().then(action).then(function () { player.refit(); window.syncShellLayout && window.syncShellLayout(); })
          .catch(function (error) { console.warn('Webamp skin:', error); status('Skinu neizdevās ielādēt.'); });
      });
      menu.appendChild(b);
    }
    var mode = player.getSkinMode();
    player.getBuiltinModernSkins().forEach(function (skin) { item(skin.label, function () { return player.setBuiltinModernSkin(skin.id); }); });
    item('Classic Winamp', function () { return player.showClassicSkin(); }, mode === 'classic');
    menu.appendChild(document.createElement('hr'));
    item('Citi Classic skini…', function () { player.showClassicSkin(); return player.openSkinBrowser(); });
    var r = event.currentTarget.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - 238)) + 'px';
    menu.style.bottom = (innerHeight - r.top + 8) + 'px';
    menu.showPopover();
  }

  function starterRows(module) {
    return STARTER.map(function (s) { return module.toMusicRow({ id: s[0], title: s[1], author: s[2], lengthSeconds: s[3] }); });
  }

  function mount() {
    if (pending) return pending;
    pending = (async function () {
      status('Ielādē Webamp…');
      var el = ensureHost();
      var loaded = await Promise.all([
        addCSS('css/music-webamp.css?v=' + VERSION),
        addCSS(BASE + 'webamp-radio.css?v=' + VERSION),
        import(BASE + 'webamp-radio.js?v=' + VERSION)
      ]);
      var module = loaded[2];
      // Featured YouTube Music playlists, from what was listened to (ytify's
      // Library "Featured"); the starter songs seed it the first time.
      var featured = [];
      try {
        featured = await module.featuredPlaylists({ fallbackIds: STARTER.map(function (s) { return s[0]; }), waitMs: 1000 });
      } catch (_) {}
      player = await module.mountWebampRadio(el, {
        assetsBase: BASE,
        stations: [],
        libraryNodes: ['bookmarks', 'history'],
        libraryTitle: 'LACITIS', // the skin's pixel font has no Ā or Ī
        // The opening playlist (a YouTube Music list); the starter rows only
        // when it cannot be read.
        lacitis: { playlistId: DEFAULT_PLAYLIST, featured: featured, intro: module.toMusicRow(INTRO), starter: function () { return starterRows(module); } },
        proxy: false,
        theme: null,
        lowSpec: 'auto',
        // Pixel-art skins stay crisp only at whole multiples.
        scale: 'auto',
        maxScale: 2,
        switchButton: false,
        overlayZIndex: 100000,
        barHeight: { max: null }
      });
      window.rgMusicWebamp = player;
      // Classic Winamp is the default look (the user's choice); a Modern skin
      // picked in SKINI comes back next time even if the player itself could
      // not restore it.
      var lastModern = false;
      try { lastModern = localStorage.getItem('webamp.skin.mode.v1') === 'modern'; } catch (_) {}
      if (lastModern && player.getSkinMode() !== 'modern') {
        try { await player.setBuiltinModernSkin('winamp-modern'); }
        catch (error) { console.warn('Winamp Modern unavailable; Classic stays.', error); }
      }
      player.on('track', updateNow);
      player.webamp.store.subscribe(function () {
        var st = player.webamp.store.getState(), tr = st.tracks[st.playlist.currentTrack];
        if (tr && now && now.dataset.art !== (tr.albumArtUrl || '')) updateNow();
      });
      // One player at a time: music starting stops the radio.
      player.on('status', function (state) {
        if (state === 'PLAYING') {
          window.__mkRadioSupersededByLacitis = true;
          if (typeof window.__mkPauseRadioForLacitis === 'function') window.__mkPauseRadioForLacitis();
          status('');
        }
      });
      player.on('error', function (error) { status((error && error.reason) || 'Neizdevās atskaņot.'); });
      ['layout', 'skin'].forEach(function (name) { player.on(name, function () { window.syncShellLayout && window.syncShellLayout(); }); });
      status('');
      player.refit();
      return player;
    })().catch(function (error) {
      pending = null;
      console.error('Webamp music:', error);
      status('Neizdevās ielādēt. Nospied MŪZIKA, lai mēģinātu vēlreiz.');
      throw error;
    });
    return pending;
  }

  // The radio's own looks (Amp, Dither) re-home the switch into their shells
  // when they apply, also while music shows; take it back into the head.
  var barWatch = null;
  function watchBar() {
    if (barWatch || !window.MutationObserver) return;
    barWatch = new MutationObserver(function () {
      var rw = shell(), bar = document.getElementById('radioSourceBar');
      if (rw && rw.classList.contains('webamp-music') && bar && head && bar.parentNode !== head) takeBar();
    });
    barWatch.observe(shell(), { childList: true, subtree: true });
  }
  function setVisible(visible) {
    var rw = shell();
    if (visible) { takeBar(); watchBar(); } else returnBar();
    if (rw) rw.classList.toggle('webamp-music', visible);
    if (!visible && player) {
      player.closeLibrary();
      player.closeVideoWindow && player.closeVideoWindow();
      if (menu && menu.matches(':popover-open')) menu.hidePopover();
    }
    if (player && player.setPresentationVisible) player.setPresentationVisible(visible);
  }

  // Opening WINAMP plays: from the intro (the playlist's first song) when
  // nothing is playing; a song already playing (minimized) just carries on.
  function playOnOpen(p) {
    if (p.getStatus() === 'PLAYING') return;
    var st = p.webamp.store.getState();
    var first = st.playlist.trackOrder[0];
    if (first != null) p.webamp.store.dispatch({ type: 'PLAY_TRACK', id: first });
  }

  window.openWebampMusic = async function () {
    ensureHost();
    setVisible(true);
    var p = await mount();
    p.refit();
    playOnOpen(p);
    window.syncShellLayout && window.syncShellLayout();
    return p;
  };
  // Minimize: the panel goes, the song keeps playing.
  window.hideWebampMusic = function () { setVisible(false); };
  // Back to RADIO: the music stops too.
  window.stopWebampMusic = function () {
    setVisible(false);
    if (player && player.getStatus() === 'PLAYING') player.pause();
  };
  // Pointer near WINAMP: fetch (and compile) the player before the click.
  var warmed = false;
  window.warmWebampMusic = function () {
    if (warmed || pending) return;
    warmed = true;
    [['modulepreload', BASE + 'webamp-radio.js?v=' + VERSION], ['preload', BASE + 'webamp-radio.css?v=' + VERSION, 'style'], ['preload', 'css/music-webamp.css?v=' + VERSION, 'style']]
      .forEach(function (item) {
        var link = document.createElement('link');
        link.rel = item[0];
        link.href = item[1];
        if (item[2]) link.as = item[2];
        document.head.appendChild(link);
      });
  };
  window.isWebampMusicPlaying = function () { return !!player && player.getStatus() === 'PLAYING'; };
  // The radio's own buttons (index.html toggleRadio / radioIdleClick) call
  // this when broadcast radio takes over; the old console defined it.
  if (typeof window.__hideLacMiniForRadio !== 'function') window.__hideLacMiniForRadio = window.stopWebampMusic;
})();
