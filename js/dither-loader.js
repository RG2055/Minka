/* Startup loader, 1-bit dither look.

   One background clip is picked per load (small dithered GIFs made by
   scripts/build-loader-gif.py / build-loader-shapes.py; Chrome animates GIFs
   off the main thread, so they keep moving while the schedule builds). The
   RG ring spins in the middle, and the status line is dithered pixel text
   (js/dither-text.js). The real text stays in #mklLoadStatus for screen
   readers; the canvas repaints when it changes. Used by index and mobile. */
(function () {
  'use strict';
  var portrait = window.innerHeight > window.innerWidth;
  var BACKGROUNDS = [
    'data/loader-hibiscus.gif?v=20260924d1',
    portrait ? 'data/loader-shapes-portrait.gif?v=20260924d1' : 'data/loader-shapes.gif?v=20260924d1'
  ];
  var loader = document.getElementById('mk-app-loader') || document.getElementById('mobileDataLoader');
  if (!loader) return;
  // /rad has its own monitor (js/rad-loader.js): no RG clips to download.
  if (window.MINKA_APP === 'rad' && loader.id === 'mk-app-loader') return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bg = loader.querySelector('.mkl-bg');
  var scrim = loader.querySelector('.mkl-scrim');
  if (bg && !reduce) {
    var pick = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    bg.src = pick;
    // The ring's clearing is dithered too (black pixels on the clip's own
    // grid, dense in the middle), never a smooth gradient over the pixels.
    if (scrim) scrim.src = /portrait/.test(pick) ? 'data/loader-scrim-portrait.png?v=20260924d1' : 'data/loader-scrim.png?v=20260924d1';
  }
  var status = document.getElementById('mklLoadStatus');
  var canvas = document.getElementById('mklDitherText');
  if (status && canvas && canvas.getContext && window.MinkaDitherText) window.MinkaDitherText.bind(canvas, status, { size: 13 });
})();
