(function () {
  'use strict';

  var canvas = null;
  var ctx = null;
  var particles = [];
  var frame = 0;
  var lastTime = 0;
  var width = 0;
  var height = 0;
  var dpr = 1;
  var maxParticles = 48;
  var emojiCache = new Map();

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function quality() {
    var profile = window.__mkPerfProfile || {};
    var cores = Number(profile.hardwareConcurrency || navigator.hardwareConcurrency || 0);
    var memory = Number(profile.deviceMemory || navigator.deviceMemory || 0);
    if ((cores && cores <= 2) || (memory && memory <= 2)) return .34;
    if ((cores && cores <= 4) || (memory && memory <= 4)) return .65;
    return 1;
  }

  function ensureCanvas() {
    if (canvas && canvas.isConnected) return true;
    canvas = document.createElement('canvas');
    canvas.id = 'mkEmojiParticles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'pointer-events:none', 'z-index:2147482000', 'contain:strict'
    ].join(';');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) {
      canvas.remove();
      canvas = null;
      return false;
    }
    resizeCanvas();
    return true;
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    var q = quality();
    dpr = q < .5 ? 1 : Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    // A bigger celebration on capable machines, but a hard ceiling on weak
    // workstations. Most confetti pieces are cheap geometric strips; emoji are
    // still sparse and raster-cached.
    maxParticles = q < .5 ? 32 : (q < .8 ? 56 : 84);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function point(value, fallbackX, fallbackY) {
    if (value && typeof value.getBoundingClientRect === 'function') {
      var rect = value.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    if (value && Number.isFinite(value.x) && Number.isFinite(value.y)) {
      return { x: value.x, y: value.y };
    }
    return { x: fallbackX, y: fallbackY };
  }

  function emojiFrom(glyphs, index) {
    var list = Array.isArray(glyphs) ? glyphs : [glyphs || '✨'];
    return String(list[index % list.length] || '✨');
  }

  function push(particle) {
    particles.push(particle);
    if (particles.length > maxParticles) particles.splice(0, particles.length - maxParticles);
  }

  function start() {
    if (!frame && particles.length && !document.hidden) {
      lastTime = performance.now();
      frame = requestAnimationFrame(draw);
    }
  }

  function easeOutBack(t) {
    var c1 = 1.28;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function easeInOut(t) {
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function bezier(a, b, c, t) {
    var inv = 1 - t;
    return inv * inv * a + 2 * inv * t * b + t * t * c;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function emojiSprite(glyph, size) {
    var roundedSize = Math.max(8, Math.round(size));
    var key = glyph + '|' + roundedSize + '|' + dpr;
    if (emojiCache.has(key)) return emojiCache.get(key);
    var cssSize = Math.ceil(roundedSize * 1.8);
    var sprite = document.createElement('canvas');
    sprite.width = Math.ceil(cssSize * dpr);
    sprite.height = Math.ceil(cssSize * dpr);
    var spriteCtx = sprite.getContext('2d', { alpha: true });
    if (!spriteCtx) return null;
    spriteCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spriteCtx.font = roundedSize + 'px "Fluent Emoji Color", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    spriteCtx.textAlign = 'center';
    spriteCtx.textBaseline = 'middle';
    spriteCtx.fillText(glyph, cssSize / 2, cssSize / 2);
    var cached = { canvas: sprite, size: cssSize };
    emojiCache.set(key, cached);
    if (emojiCache.size > 72) emojiCache.delete(emojiCache.keys().next().value);
    return cached;
  }

  function paintGlyph(p) {
    if (p.kind === 'fusionMist') {
      // A restrained cinematic energy mist: no flash, rays, rings or blur.
      // Three translucent lobes and two wisps make it read as gas while still
      // remaining a single inexpensive Canvas particle.
      var haze = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      haze.addColorStop(0, 'rgba(255,255,255,.34)');
      haze.addColorStop(.28, 'rgba(235,247,255,.17)');
      haze.addColorStop(.62, 'rgba(194,220,255,.07)');
      haze.addColorStop(1, 'rgba(194,220,255,0)');
      ctx.fillStyle = haze;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * .66, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,.065)';
      ctx.beginPath();
      ctx.ellipse(-p.size * .32, -p.size * .12, p.size * .48, p.size * .25, -.34, 0, Math.PI * 2);
      ctx.ellipse(p.size * .28, p.size * .08, p.size * .52, p.size * .22, .28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(235,248,255,.12)';
      ctx.lineWidth = Math.max(.7, p.size * .025);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-p.size * .7, p.size * .1);
      ctx.bezierCurveTo(-p.size * .28, -p.size * .42, p.size * .18, p.size * .35, p.size * .72, -p.size * .08);
      ctx.stroke();
      return;
    }
    if (p.kind === 'confetti') {
      ctx.fillStyle = p.color || '#ffffff';
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * .34, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size * .42, -p.size * .16, p.size * .84, p.size * .32);
      }
      return;
    }
    if (p.textMode) {
      var radius = p.size * .55;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(7, 18, 31, .92)';
      ctx.fill();
      ctx.lineWidth = Math.max(1.4, p.size * .055);
      ctx.strokeStyle = 'rgba(112, 255, 188, .58)';
      ctx.stroke();
      ctx.font = '800 ' + Math.round(p.size * .62) + 'px Inter, system-ui, sans-serif';
      ctx.fillStyle = p.color || '#d9ffe9';
      ctx.fillText(p.glyph, 0, 1);
      return;
    }
    var sprite = emojiSprite(p.glyph, p.size);
    if (sprite) ctx.drawImage(sprite.canvas, -sprite.size / 2, -sprite.size / 2, sprite.size, sprite.size);
  }

  function draw(now) {
    frame = 0;
    if (!ctx || document.hidden) return;
    var dt = Math.min(50, Math.max(0, now - lastTime));
    lastTime = now;
    ctx.clearRect(0, 0, width, height);
    var alive = [];

    particles.forEach(function (p) {
      p.age += dt;
      if (p.age < p.delay) {
        alive.push(p);
        return;
      }
      var raw = Math.min(1, (p.age - p.delay) / p.duration);
      if (raw >= 1) {
        // Run landing work from the next task. Calling it while this array is
        // being replaced would drop particles created by the callback.
        if (typeof p.onComplete === 'function') {
          var onComplete = p.onComplete;
          p.onComplete = null;
          window.setTimeout(onComplete, 0);
        }
        return;
      }
      var t = p.kind === 'pop' ? easeOutBack(raw) : (p.kind === 'confetti' || p.kind === 'confettiEmoji' ? raw : easeInOut(raw));
      var x = bezier(p.sx, p.cx, p.ex, t);
      var y = bezier(p.sy, p.cy, p.ey, t);
      var fadeIn = Math.min(1, raw / .12);
      var fadeOut = raw > .82 ? (1 - raw) / .18 : 1;
      var peakAt = p.peakAt || .3;
      var scale = raw < peakAt
        ? lerp(p.startScale, p.peakScale, easeOutBack(raw / peakAt))
        : lerp(p.peakScale, p.endScale, easeInOut((raw - peakAt) / (1 - peakAt)));
      var rotation = p.rotation + p.spin * t;

      if (p.trail && raw > .08) {
        var trailRaw = Math.max(0, raw - .065);
        var trailT = easeInOut(trailRaw);
        var trailX = bezier(p.sx, p.cx, p.ex, trailT);
        var trailY = bezier(p.sy, p.cy, p.ey, trailT);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(.22, fadeOut * p.opacity * .18));
        ctx.translate(trailX, trailY);
        ctx.rotate(p.rotation + p.spin * trailT);
        ctx.scale(scale * .82, scale * .82);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        paintGlyph(p);
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, fadeIn * fadeOut * p.opacity));
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      if (p.kind === 'fusionMist') {
        ctx.globalCompositeOperation = 'screen';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      paintGlyph(p);
      ctx.restore();
      alive.push(p);
    });

    particles = alive;
    if (particles.length) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, width, height);
  }

  function flyTo(source, target, glyphs, options) {
    options = options || {};
    if (reducedMotion() || !ensureCanvas()) return;
    resizeCanvas();
    var q = quality();
    var requested = Math.max(1, Number(options.count) || 5);
    var count = Math.max(1, Math.round(requested * q));
    var from = point(source, width / 2, height * .72);
    var to = point(target, width / 2, height / 2);
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var normalX = -dy;
    var normalY = dx;
    var normalLen = Math.max(1, Math.sqrt(normalX * normalX + normalY * normalY));

    for (var i = 0; i < count; i++) {
      var lane = (i - (count - 1) / 2) / Math.max(1, count - 1);
      var arcSpread = Number(options.arcSpread) || 74;
      var lift = Number(options.lift) || 24;
      var arc = lane * arcSpread + (Math.random() - .5) * Math.min(24, arcSpread * .34);
      push({
        kind: 'fly',
        glyph: emojiFrom(glyphs, i),
        textMode: !!options.textMode,
        color: options.color || '',
        sx: from.x + (Math.random() - .5) * 12,
        sy: from.y + (Math.random() - .5) * 10,
        cx: from.x + dx * (.42 + Math.random() * .12) + normalX / normalLen * arc,
        cy: from.y + dy * (.42 + Math.random() * .12) + normalY / normalLen * arc - lift,
        ex: to.x + (Math.random() - .5) * (options.targetSpread || 12),
        ey: to.y + (Math.random() - .5) * (options.targetSpread || 12),
        size: (Number(options.size) || 25) * (.86 + Math.random() * .28),
        startScale: .42 + Math.random() * .16,
        peakScale: Number(options.peakScale) || 1.18,
        peakAt: Number(options.peakAt) || .28,
        endScale: options.endScale == null ? .28 : Number(options.endScale),
        rotation: (Math.random() - .5) * .42,
        spin: (Math.random() - .5) * 1.35,
        opacity: .96,
        trail: q < .5 ? false : options.trail !== false,
        age: 0,
        delay: Math.max(0, Number(options.delay) || 0) + i * 24 + Math.random() * 34,
        duration: (Number(options.duration) || 620) * (.88 + Math.random() * .18),
        onComplete: i === count - 1 && typeof options.onComplete === 'function'
          ? options.onComplete
          : null
      });
    }
    start();
  }

  function morningRollover(target) {
    if (reducedMotion() || !ensureCanvas()) return;
    resizeCanvas();
    var q = quality();
    var destination = point(target, width * .5, Math.min(height * .34, 210));
    var glyphs = ['🌙', '💤', '✨', '☀️', '☕', '👋', '✨', '☀️'];
    var count = Math.max(10, Math.round(18 * q));

    for (var i = 0; i < count; i++) {
      var incoming = i >= Math.floor(count * .34);
      var glyph = incoming ? glyphs[2 + (i % (glyphs.length - 2))] : glyphs[i % 2];
      var sx = incoming ? width + 36 + Math.random() * 90 : width * (.36 + Math.random() * .28);
      var sy = incoming ? height * (.18 + Math.random() * .58) : height * (.30 + Math.random() * .25);
      var ex = incoming ? destination.x + (Math.random() - .5) * Math.min(250, width * .46) : -60 - Math.random() * 90;
      var ey = incoming ? destination.y + (Math.random() - .5) * 110 : sy - 70 - Math.random() * 100;
      push({
        kind: 'fly', glyph: glyph,
        sx: sx, sy: sy,
        cx: (sx + ex) / 2 + (Math.random() - .5) * 90,
        cy: Math.min(sy, ey) - 70 - Math.random() * 60,
        ex: ex, ey: ey,
        size: 28 + Math.random() * 20,
        startScale: incoming ? .36 : .68,
        peakScale: incoming ? 1.22 : 1.12,
        peakAt: .3,
        endScale: incoming ? .82 : .55,
        rotation: (Math.random() - .5) * .5,
        spin: (Math.random() - .5) * 2,
        opacity: .94,
        trail: true,
        age: 0,
        delay: incoming ? 90 + (i % 6) * 34 : i * 28,
        duration: 1050 + Math.random() * 360
      });
    }
    start();
  }

  function confetti(glyphs, options) {
    options = options || {};
    if (reducedMotion() || !ensureCanvas()) return;
    resizeCanvas();
    var q = quality();
    var requested = Math.max(12, Number(options.count) || 42);
    var count = Math.max(q < .5 ? 12 : 16, Math.round(requested * q));
    var colors = ['#73f7bd', '#64d8ff', '#ffd45f', '#ff7f9d', '#a98cff', '#ffffff'];
    var emojiList = Array.isArray(glyphs) && glyphs.length ? glyphs : ['✨', '🎉'];

    for (var i = 0; i < count; i++) {
      var emojiStride = q < .5 ? 5 : (q < .8 ? 4 : 3);
      var isEmoji = i % emojiStride === 1;
      var fromSide = i % 5 === 0 || i % 5 === 3;
      var fromLeft = i % 2 === 0;
      var sx = fromSide ? (fromLeft ? -28 : width + 28) : Math.random() * width;
      var sy = fromSide
        ? height * (.10 + Math.random() * .62)
        : -24 - Math.random() * Math.min(110, height * .18);
      var ex = fromSide
        ? width * (.12 + Math.random() * .76)
        : Math.max(-30, Math.min(width + 30, sx + (Math.random() - .5) * Math.min(420, width * .48)));
      var ey = height + 45 + Math.random() * 100;
      push({
        kind: isEmoji ? 'confettiEmoji' : 'confetti',
        glyph: isEmoji ? emojiFrom(emojiList, i) : '',
        color: colors[i % colors.length],
        shape: i % 3 === 0 ? 'circle' : 'strip',
        sx: sx,
        sy: sy,
        cx: (sx + ex) / 2 + (Math.random() - .5) * 210,
        cy: height * (.28 + Math.random() * .28),
        ex: ex,
        ey: ey,
        size: isEmoji ? 25 + Math.random() * 17 : 12 + Math.random() * 11,
        startScale: isEmoji ? .72 : .9,
        peakScale: isEmoji ? 1.22 : 1,
        peakAt: .32,
        endScale: isEmoji ? .78 : .86,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * (isEmoji ? 5 : 12),
        opacity: isEmoji ? .96 : .9,
        trail: false,
        age: 0,
        delay: Math.random() * (Number(options.delaySpread) || 220),
        duration: (Number(options.duration) || (q < .5 ? 1500 : 1800))
          + Math.random() * (Number(options.durationSpread) || (q < .5 ? 400 : 550))
      });
    }
    start();
  }

  function fusion(target, options) {
    options = options || {};
    if (reducedMotion() || !ensureCanvas()) return;
    resizeCanvas();
    var q = quality();
    var at = point(target, width / 2, height / 2);
    push({
      kind: 'fusionMist', glyph: '',
      sx: at.x, sy: at.y, cx: at.x, cy: at.y, ex: at.x, ey: at.y,
      size: q < .5 ? 23 : 29,
      startScale: .22, peakScale: 1, peakAt: .4, endScale: 1.38,
      rotation: (Math.random() - .5) * .8, spin: (Math.random() - .5) * .32,
      opacity: q < .5 ? .48 : .58, trail: false,
      age: 0, delay: 0, duration: q < .5 ? 360 : 460
    });
    start();
  }

  function haptic(kind) {
    if (reducedMotion() || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    var patterns = { light: 12, selection: 16, success: [22, 42, 28] };
    try { navigator.vibrate(patterns[kind] || patterns.light); } catch (_error) {}
  }

  function cancel() {
    particles = [];
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (ctx) ctx.clearRect(0, 0, width, height);
  }

  window.addEventListener('resize', function () {
    if (particles.length) resizeCanvas();
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancel();
  }, { passive: true });

  window.MinkaEmojiParticles = {
    flyTo: flyTo,
    morningRollover: morningRollover,
    confetti: confetti,
    fusion: fusion,
    haptic: haptic,
    cancel: cancel,
    get activeCount() { return particles.length; }
  };
})();
