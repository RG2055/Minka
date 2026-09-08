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
    window.__hideLacMiniForRadio?.();
    document.getElementById('radioWindow')?.classList.remove('music-source');
    document.body.classList.add('radio-hidden', 'radio-idle');
    document.getElementById('mediaProfile')?.close();
    window.__mkSyncRadioVisuals?.();
    window.syncShellLayout?.();
  }
  mobileView.addEventListener('change', closeMobileRadio);
  closeMobileRadio();
  function updateDock(music, hidden = false) {
    document.getElementById('radioToggleLabel').textContent = music ? 'MŪZIKA' : 'RADIO';
    const button = document.getElementById('radioToggle');
    button.setAttribute('aria-expanded', String(!hidden));
    button.setAttribute('title', music ? (hidden ? 'Atvērt mūziku' : 'Minimizēt mūziku — turpināt atskaņošanu') : 'Paslēpt/Rādīt Radio');
  }
  window.minimizeRadioMusic = function () {
    if (requestedSource !== 'music') return;
    if (window.__minimizeMusicPanel) window.__minimizeMusicPanel();
    document.body.classList.add('radio-hidden');
    updateDock(true, true);
    window.syncShellLayout();
  };
  window.toggleRadioMusicVisibility = function () {
    if (mobileView.matches) { closeMobileRadio(); return true; }
    if (requestedSource !== 'music') return false;
    if (document.body.classList.contains('radio-hidden')) {
      document.body.classList.remove('radio-hidden', 'radio-idle');
      window.setRadioSource('music');
    } else window.minimizeRadioMusic();
    return true;
  };
  function loadMusic() {
    if (musicLoad) return musicLoad;
    musicLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'js/radio-music.js?v=20260908header2';
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
  window.setRadioSource = async function (source) {
    if (mobileView.matches) { closeMobileRadio(); return; }
    requestedSource = source === 'music' ? 'music' : 'radio';
    const music = requestedSource === 'music';
    const shell = document.getElementById('radioWindow');
    const status = document.getElementById('radioSourceStatus');
    document.getElementById('radioSourceBroadcast').setAttribute('aria-pressed', String(!music));
    document.getElementById('radioSourceMusic').setAttribute('aria-pressed', String(music));
    status.textContent = '';
    if (!music) {
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
      window.openLacMini();
      updateDock(true);
      status.textContent = '';
    } catch (_) {
      if (requestedSource === 'music') status.textContent = 'Neizdevās ielādēt. Nospied MŪZIKA, lai mēģinātu vēlreiz.';
    }
  };
})();
