# Radio background quality investigation

The owner asked for a solution without increasing the original image file size or adding sustained CPU/GPU work. The selected `skin-aesthetic-cyborg.webp` is 480×480 and about 19 KB. Existing `background-size: cover` expands and crops it across a wide radio window. No larger local original was found. The source image and production radio quality path were not changed during this investigation.

## Tested candidate: Pica

Source: https://github.com/nodeca/pica — MIT, version 10.0.2. Downloaded package integrity was checked against npm's SHA-512 value. The library was used only in `/tmp/minka-radio-quality`, not installed in the PWA. Its minified browser build is 54,180 bytes, or 15,287 bytes gzipped.

An isolated comparison at http://127.0.0.1:8013/ displays the original browser-scaled image, Pica's default `mks2013` result, and Pica with mild unsharp masking (80 / 0.6 / 2). All use the same 480×480 file, crop and display dimensions. Only the visible banner crop is processed. One worker, tile size 512 and zero idle retention were configured. There is no continuous processing loop.

On the current computer, producing a 2400×400 result took 122 ms for the first default run and 76 ms for the subsequent sharpened run. These are cold/warm samples in that order, not proof that sharpening is faster or an old-PC benchmark. Visual inspection found crisper edges, but the improvement is modest and does not recover lost detail. The original image file stays unchanged. A 2400×400 RGBA output alone occupies roughly 3.84 MB before accounting for source, working buffers and browser copies.

A production integration would need lazy loading, processing only on selecting/resizing the current image, a bounded result cache, one worker, cancellation on minimization/hidden state, stale-result rejection, and an immediate original-image fallback. No AI models or frame-by-frame filters are required. It should be enabled only if the visible improvement justifies the one-time cost.

## Other findings

- CSS `image-rendering: high-quality` is not implemented in browsers; changing that declaration is not a reliable fix. `crisp-edges`/`pixelated` target pixel art, not smooth photographic backgrounds: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering
- Cover/contain changes the crop and scaling, not source detail: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-size
- AI browser upscalers require models and computation, which conflicts with the preference for minimal overhead: https://upscalerjs.com/documentation/
- Animated blur adds painting cost and is unnecessary for a static quality pass: https://web.dev/articles/animations-guide
