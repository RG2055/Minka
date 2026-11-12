(function () {
  // The radio is the only source here: music moved to RG Music (dock button, music.rgapp.page).
  const mobileView = window.matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 950px)');
  window.isRadioMobileView = () => mobileView.matches;
  function closeMobileRadio() {
    if (!mobileView.matches) return;
    window.__mkRadioSupersededByLacitis = true;
    window.__mkPauseRadioForLacitis?.();
    document.body.classList.remove('radio-anim');
    document.body.classList.add('radio-hidden', 'radio-idle');
    document.getElementById('mediaProfile')?.close();
    window.__mkSyncRadioVisuals?.();
    window.syncShellLayout?.();
  }
  mobileView.addEventListener('change', closeMobileRadio);
  closeMobileRadio();
  // The phone has no radio window: the dock's radio button only closes it there.
  window.toggleRadioMusicVisibility = function () {
    if (!mobileView.matches) return false;
    closeMobileRadio();
    return true;
  };
  // The pressed button sits on a pill (MinkaMotion.liquid).
  function sourcePill(nextBtn) {
    const MM = window.MinkaMotion, bar = nextBtn && nextBtn.parentElement;
    if (!MM || !MM.liquid || !bar || typeof bar.querySelector !== 'function') return;
    let pill = bar.querySelector(':scope > .radio-source-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'radio-source-pill';
      pill.setAttribute('aria-hidden', 'true');
      bar.prepend(pill);
    }
    if (MM.liquid(pill, bar, nextBtn, { animate: false })) bar.classList.add('has-pill');
  }
  window.__syncRadioSourcePill = function () {
    const pressed = document.querySelector('#radioSourceBar > button[aria-pressed="true"]');
    if (pressed) sourcePill(pressed);
  };
  // Anything that moves the buttons inside the bar (the sign-in pills added
  // or relabelled by js/media-profile.js, a font arriving, a new look) would
  // leave the pill where the pressed button used to be: follow every resize
  // of the bar and its buttons.
  (function followBar() {
    const bar = document.getElementById('radioSourceBar');
    if (!bar || !window.ResizeObserver) return;
    let frame = 0;
    const resync = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; window.__syncRadioSourcePill(); });
    };
    const sizes = new ResizeObserver(resync);
    const watchAll = () => bar.querySelectorAll(':scope > *:not(.radio-source-pill)').forEach((el) => sizes.observe(el));
    sizes.observe(bar);
    watchAll();
    new MutationObserver(() => { watchAll(); resync(); }).observe(bar, { childList: true });
  })();
  window.setRadioSource = function () {
    if (mobileView.matches) { closeMobileRadio(); return; }
    const button = document.getElementById('radioToggle');
    document.getElementById('radioSourceBroadcast').setAttribute('aria-pressed', 'true');
    window.__syncRadioSourcePill();
    document.getElementById('radioSourceStatus').textContent = '';
    button.setAttribute('aria-expanded', String(!document.body.classList.contains('radio-hidden')));
    window.__mkRadioSupersededByLacitis = false;
    window.syncShellLayout();
  };
})();
