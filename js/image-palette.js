/* Shared, bounded image sampling; no per-frame work or external runtime CDN. */
(function (host) {
  'use strict';
  function choose(dominant, swatches) {
    const actual = ['Vibrant', 'LightVibrant', 'Muted', 'DarkVibrant', 'DarkMuted', 'LightMuted']
      .map(key => swatches?.[key]).find(s => s?.population > 0 && /^#[a-f\d]{6}$/i.test(s.hex));
    return { dominant, accent: actual?.hex || dominant };
  }
  if (typeof module === 'object' && module.exports) module.exports = { choose };
  if (!host?.document) return;
  // The embedded header and player share one cache and one copy of the libraries.
  try { if (host.parent !== host && host.parent.MinkaImagePalette) { host.MinkaImagePalette = host.parent.MinkaImagePalette; return; } } catch (_) {}
  const doc = host.document, base = new URL('../', doc.currentScript.src), cache = new Map();
  let thiefLoading, vibrantLoading;
  function libraries() {
    if (!host.ColorThief && !thiefLoading) thiefLoading = new Promise((resolve, reject) => {
      const script = doc.createElement('script');
      script.src = new URL('kalendars/vendor/color-thief.global.js?v=3', base);
      script.onload = resolve; script.onerror = reject; doc.head.appendChild(script);
    });
    if (!vibrantLoading) vibrantLoading = import(new URL('vendor/vibrant/4.0.4/vibrant.mjs', base).href);
    return Promise.all([host.ColorThief ? Promise.resolve() : thiefLoading, vibrantLoading]);
  }
  async function extract(image) {
    const src = image.currentSrc || image.src;
    if (!src || !image.complete || !image.naturalWidth) return null;
    if (cache.has(src)) return cache.get(src);
    const pending = (async () => {
      try {
        const [, { Vibrant }] = await libraries();
        await new Promise(resolve => 'requestIdleCallback' in host ? host.requestIdleCallback(resolve, { timeout: 600 }) : host.setTimeout(resolve, 0));
        if ((image.currentSrc || image.src) !== src || !image.complete || !image.naturalWidth) return null;
        const sample = doc.createElement('canvas');
        const ratio = image.naturalWidth / image.naturalHeight;
        sample.width = ratio >= 1 ? 64 : Math.max(1, Math.round(64 * ratio));
        sample.height = ratio >= 1 ? Math.max(1, Math.round(64 / ratio)) : 64;
        sample.getContext('2d', { willReadFrequently: true }).drawImage(image, 0, 0, sample.width, sample.height);
        const dominant = host.ColorThief.getColorSync(sample, { quality: 2, colorSpace: 'rgb' }).hex();
        let swatches;
        try { swatches = await Vibrant.from(sample.toDataURL()).maxDimension(64).quality(2).getPalette(); } catch (_) {}
        return choose(dominant, swatches);
      } catch (_) { return null; }
    })();
    cache.set(src, pending);
    if (cache.size > 64) cache.delete(cache.keys().next().value);
    return pending;
  }
  host.MinkaImagePalette = { extract };
})(typeof window === 'undefined' ? null : window);
