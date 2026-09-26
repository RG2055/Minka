(function () {
  let musicLoad = null;
  let requestedSource = 'radio';
  const mobileView = window.matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 950px)');
  window.isRadioMobileView = () => mobileView.matches;
  function closeMobileRadio() {
    if (!mobileView.matches) return;
    requestedSource = 'radio';
    window.__mkRadioSupersededByLacitis = true;
    window.__mkPauseRadioForLacitis?.();
    window.stopWebampMusic?.();
    window.__hideLacMiniForRadio?.();
    document.getElementById('radioWindow')?.classList.remove('music-source');
    document.body.classList.remove('radio-anim');
    document.body.classList.add('radio-hidden', 'radio-idle');
    document.getElementById('mediaProfile')?.close();
    window.__mkSyncRadioVisuals?.();
    window.syncShellLayout?.();
  }
  mobileView.addEventListener('change', closeMobileRadio);
  closeMobileRadio();
  // The Winamp logo (assets/icons/winamp-logo.svg) while music is the source.
  const BOLT_PX = '<path d="M640 0 1280 643 640 1288 0 638Z" fill="#000"/><path d="M640 85 1195 643 640 1200 86 638Z" fill="#fff"/><path d="M1062 88Q1103 102 1112 116Q1121 132 1124 157L1116 280 1016 378 910 484 969 506 972 580 969 709 188 1216 145 1226 112 1190 112 1002 350 766 330 766Q285 764 281 715L285 578Q287 548 315 523L1005 121Z" fill="#000"/><path d="M1066 142 1075 158 1070 258 822 503 922 540 925 580 921 683 170 1170 160 1172 160 1022 467 718 328 717 333 572 340 565Z" fill="#faa700"/><path d="M1032 175 988 225 717 466 773 390Z" fill="#fde2a6"/><path d="M1032 175 1000 237 732 465 717 466 988 225Z" fill="#f07706"/><path d="M380 568 415 563 662 558 182 1025 195 1000 611 572Z" fill="#fde2a6"/><path d="M360 578 611 572 585 597 398 589Z" fill="#f07706"/><path d="M900 546 908 556 200 1017 190 1016 318 922 668 688Z" fill="#ec5a06"/>';
  let radioPx = null;
  let radioViewBox = null;
  function updateDock(music, hidden = false) {
    document.getElementById('radioToggleLabel').textContent = music ? (useWebamp() ? 'WINAMP' : 'MŪZIKA') : 'RADIO';
    const button = document.getElementById('radioToggle');
    const px = button.querySelector('.dock-px');
    if (px) {
      if (radioPx == null) radioPx = px.innerHTML;
      const bolt = music && useWebamp();
      if (radioViewBox == null) radioViewBox = px.getAttribute('viewBox');
      px.innerHTML = bolt ? BOLT_PX : radioPx;
      px.setAttribute('viewBox', bolt ? '0 0 1280 1288' : radioViewBox);
      px.setAttribute('shape-rendering', bolt ? 'geometricPrecision' : 'crispEdges');
      button.classList.toggle('is-winamp', bolt);
    }
    button.setAttribute('aria-expanded', String(!hidden));
    button.setAttribute('title', music ? (hidden ? 'Atvērt mūziku' : 'Minimizēt mūziku — turpināt atskaņošanu') : 'Paslēpt/Rādīt Radio');
  }
  window.minimizeRadioMusic = function () {
    if (requestedSource !== 'music') return;
    if (window.hideWebampMusic) window.hideWebampMusic();
    if (window.__minimizeMusicPanel) window.__minimizeMusicPanel();
    if (!(window.__mkRadioReveal && window.__mkRadioReveal.run(false))) document.body.classList.add('radio-hidden');
    updateDock(true, true);
    window.syncShellLayout();
  };
  window.toggleRadioMusicVisibility = function () {
    if (mobileView.matches) { closeMobileRadio(); return true; }
    if (requestedSource !== 'music') return false;
    const reveal = window.__mkRadioReveal;
    if (reveal ? !reveal.logicalOpen() : document.body.classList.contains('radio-hidden')) {
      if (!(reveal && reveal.run(true))) document.body.classList.remove('radio-hidden', 'radio-idle');
      window.setRadioSource('music');
    } else window.minimizeRadioMusic();
    return true;
  };
  // MŪZIKA is Webamp (js/music-webamp.js); the old Lācītis console stays
  // reachable with localStorage minkaMusicEngine = "lacitis" while Webamp
  // settles in.
  function useWebamp() {
    try { return localStorage.getItem('minkaMusicEngine') !== 'lacitis'; } catch (_) { return true; }
  }
  function loadMusic() {
    if (musicLoad) return musicLoad;
    musicLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = useWebamp() ? 'js/music-webamp.js?v=20260927wa2' : 'js/radio-music.js?v=20260908header2';
      script.onload = resolve;
      script.onerror = () => {
        musicLoad = null;
        script.remove();
        reject(new Error('Music controls could not load'));
      };
      document.head.appendChild(script);
    });
    return musicLoad;
  }
  // Radio / Mūzika: the selected pill slides between the two (MinkaMotion.liquid).
  function sourcePill(prevBtn, nextBtn) {
    const MM = window.MinkaMotion, bar = nextBtn && nextBtn.parentElement;
    if (!MM || !MM.liquid || !bar || typeof bar.querySelector !== 'function') return;
    let pill = bar.querySelector(':scope > .radio-source-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'radio-source-pill';
      pill.setAttribute('aria-hidden', 'true');
      bar.prepend(pill);
    }
    if (MM.liquid(pill, bar, nextBtn, { from: prevBtn, animate: !!prevBtn && prevBtn !== nextBtn })) bar.classList.add('has-pill');
  }
  window.setRadioSource = async function (source) {
    if (mobileView.matches) { closeMobileRadio(); return; }
    const prevSource = requestedSource;
    requestedSource = source === 'music' ? 'music' : 'radio';
    const music = requestedSource === 'music';
    const shell = document.getElementById('radioWindow');
    const status = document.getElementById('radioSourceStatus');
    const broadcastBtn = document.getElementById('radioSourceBroadcast'), musicBtn = document.getElementById('radioSourceMusic');
    const prevBtn = prevSource === 'music' ? musicBtn : prevSource === 'radio' ? broadcastBtn : null;
    broadcastBtn.setAttribute('aria-pressed', String(!music));
    musicBtn.setAttribute('aria-pressed', String(music));
    sourcePill(prevBtn, music ? musicBtn : broadcastBtn);
    status.textContent = '';
    if (!music) {
      if (window.stopWebampMusic) window.stopWebampMusic();
      if (window.__hideLacMiniForRadio) window.__hideLacMiniForRadio();
      shell.classList.remove('music-source');
      updateDock(false, document.body.classList.contains('radio-hidden'));
      window.__mkRadioSupersededByLacitis = false;
      window.syncShellLayout();
      // Returning to stations leaves playback under the user's Play control.
      return;
    }
    window.__mkRadioSupersededByLacitis = true;
    if (window.__mkPauseRadioForLacitis) window.__mkPauseRadioForLacitis();
    status.textContent = 'Ielādē mūziku…';
    try {
      await loadMusic();
      if (mobileView.matches || requestedSource !== 'music' || document.body.classList.contains('radio-hidden') || document.body.classList.contains('radio-idle')) return;
      shell.classList.add('music-source');
      shell.style.display = '';
      document.body.classList.remove('radio-hidden', 'radio-idle');
      if (window.openWebampMusic) await window.openWebampMusic();
      else window.openLacMini();
      updateDock(true);
      status.textContent = '';
    } catch (_) {
      if (requestedSource === 'music') status.textContent = 'Neizdevās ielādēt. Nospied vēlreiz, lai mēģinātu.';
    }
  };
})();
