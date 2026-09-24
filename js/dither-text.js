/* 1-bit dithered text on a canvas, same Bayer matrix as the dither art.
   Stroke cores are always solid and only the anti-aliased edges break into
   dither, so the text stays readable. The real text belongs in the page
   too (visually hidden) for screen readers; the canvas is aria-hidden.

   MinkaDitherText.draw(canvas, text, opts)
   MinkaDitherText.bind(canvas, sourceEl, opts)   repaints when the text changes
   opts: size (dither px), weight, family, scale (CSS px per dither px),
         fade (0..1, darker toward the bottom) */
(function () {
  'use strict';
  if (window.MinkaDitherText) return;
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var MONO = 'ui-monospace, Menlo, Consolas, "Liberation Mono", monospace';

  function draw(canvas, text, opts) {
    opts = opts || {};
    var size = opts.size || 13;
    var font = (opts.weight || 700) + ' ' + size + 'px ' + (opts.family || MONO);
    var fadeBy = opts.fade == null ? .2 : opts.fade;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.font = font;
    var w = Math.max(1, Math.ceil(ctx.measureText(text).width) + 4);
    var h = Math.ceil(size * 1.35) + 2;
    var scale = opts.scale || 2;
    // Too wide for the screen: one dither pixel per CSS pixel instead.
    if (w * scale > window.innerWidth * .9) scale = 1;
    canvas.width = w;
    canvas.height = h;
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 2, h / 2 + .5);
    var img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (var y = 0; y < h; y++) {
      var fade = 1 - fadeBy * (y / h);
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var on = d[i + 3] / 255 * fade > .2 + .5 * (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16;
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = on ? 255 : 0;
      }
    }
    ctx.putImageData(img, 0, 0);
    canvas.style.width = w * scale + 'px';
    canvas.style.height = h * scale + 'px';
  }

  function bind(canvas, source, opts) {
    var last = null;
    function paint() {
      var text = (source.textContent || '').trim();
      if (text === last) return;
      last = text;
      draw(canvas, text, opts);
    }
    paint();
    new MutationObserver(paint).observe(source, { childList: true, characterData: true, subtree: true });
    // Webfonts arrive later than the first paint: redraw once they are in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { last = null; paint(); });
  }

  window.MinkaDitherText = { draw: draw, bind: bind };
})();
