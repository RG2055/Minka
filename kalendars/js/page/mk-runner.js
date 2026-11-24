/* Skrējiens: a small endless runner in the mood's place (the user: a jump-over-things game with their own
   Nogurumiņš; every level in another tint; never a load on an old computer). Opened from the layout switch beside
   Konfektes (card-layout.js mountGame); this file is fetched only then.
   The creature runs by itself, a press jumps (a short press: a low jump); the shift's drinks stand in the way:
   cups, cans, a stack, and from the second level birds: a low one to jump over, a high one to run under (a jump
   then is a bump). Every 250 points a level: a little faster, another tint. Short dry sounds for a jump, a bump
   and a new level (the sound card sleeps again 15 s after the last one). The best score is kept on this computer.
   Its own small engine and its own pictures: the creature is a strip of frames from the dance's renders
   (scripts/blender/dance/runner_strip.py: run 0-11, jump 12-23, squash 24-29), the rest is drawn here.
   Cost: one small canvas. Nothing runs before the first press, after a bump, in a hidden tab or off screen; while
   it runs, one frame is drawn per display frame (every other one on a weak computer), flat fills only. */
(function () {
  var V = '20261124rn2';
  var root = document.documentElement, LOW = root.classList.contains('mk-low-spec');
  var ART = new URL('assets/butnes/', location.href).href;
  var FW = 143, FH = 128, BEST = 'mkRunnerBest';
  // the levels' tints, in turn (no violet: the user)
  var TINTS = ['#2dd4bf', '#f7a43a', '#ff6b5f', '#60a5fa', '#3ad07a', '#ffc857', '#fb7185'];
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function mix(a, b, t) { return a.map(function (v, i) { return Math.round(v * t + b[i] * (1 - t)); }); }
  function css(c, a) { return a == null ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')'; }

  function open(o) {
    var box = o.mount, cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.className = 'mk-run';
    cv.tabIndex = 0;
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Skrējiens: spied vai atstarpe, lai lektu');
    cv.style.cssText = 'display:block;width:100%;height:100%;outline-offset:-2px;cursor:pointer;touch-action:manipulation';
    box.appendChild(cv);

    var W = 0, H = 0, dpr = 1, raf = 0, last = 0, skip = false, closed = false;
    var state = 'idle', sprite = null, over = false;   // idle | run | over
    var score = 0, best = 0, level = 1, speed = 0, tintFrom = rgb(TINTS[0]), tintTo = tintFrom, tintAt = 0, levelAt = -9;
    var y = 0, vy = 0, onGround = true, held = false, runT = 0, jumpT = 0, landAt = -9, clock = 0;
    var things = [], nextIn = 0, dashes = 0, clouds = [], overAt = 0;
    try { best = Number(localStorage.getItem(BEST)) || 0; } catch (_e) {}
    // the sounds: one short note that slides, full from its first moment (never a dull start: the user)
    var ac = null, acT = 0;
    function note(f0, f1, dur, vol, type, wait) {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
        var t = ac.currentTime + 0.004 + (wait || 0), osc = ac.createOscillator(), g = ac.createGain();
        osc.type = type || 'triangle';
        osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + dur + 0.02);
        clearTimeout(acT); acT = setTimeout(function () { if (ac) ac.suspend(); }, 15000);
      } catch (_e) {}
    }

    // the picture: one strip, decoded once
    if (window.createImageBitmap && window.fetch) {
      fetch(ART + 'runner-' + (o.kind || 'koro') + '.webp?v=' + V).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (b) { return createImageBitmap(b); })
        .then(function (bmp) { if (closed) { bmp.close(); return; } sprite = bmp; if (state !== 'run') draw(); }, function () {});
    }

    function ground() { return H - Math.max(26, Math.round(H * 0.16)); }
    function size() { return Math.max(44, Math.min(64, Math.round(H * 0.24))); }   // the creature's height on the screen (64: its picture's own pixels on a dense screen)
    function resize() {
      var r = box.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = LOW ? 1 : Math.min(2, window.devicePixelRatio || 1);
      W = Math.round(r.width); H = Math.round(r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!clouds.length) for (var i = 0; i < 4; i++) clouds.push([Math.random() * W, 18 + Math.random() * (H * 0.3), 26 + Math.random() * 34]);
      if (state !== 'run') draw();
    }
    var ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(box); else resize();

    function reset() {
      score = 0; level = 1; speed = 250; things = []; nextIn = 0.9; y = 0; vy = 0; onGround = true; over = false;
      tintFrom = tintTo = rgb(TINTS[0]); tintAt = 0; levelAt = -9; clock = 0;
    }
    function tint() { var t = Math.min(1, (clock - tintAt) / 0.6); return t >= 1 ? tintTo : mix(tintTo, tintFrom, t); }
    function spawn() {
      var kinds = level < 2 ? ['cup', 'can'] : level < 4 ? ['cup', 'can', 'pair'] : ['cup', 'can', 'pair', 'stack'];
      var k = kinds[Math.floor(Math.random() * kinds.length)], s = size() / 60, fly = 0;
      // a bird now and then from the second level: low (jump over it) or high, over the creature's head (run under)
      if (level > 1 && Math.random() < (level > 3 ? 0.34 : 0.24)) { k = 'bird'; fly = Math.random() < 0.5 ? size() * 0.1 : size() * 1.12; }
      var w = (k === 'bird' ? 34 : k === 'pair' ? 46 : k === 'can' ? 18 : 24) * s, h = (k === 'bird' ? 16 : k === 'can' ? 38 : k === 'stack' ? 46 : 26) * s;
      things.push({ k: k, x: W + w, w: w, h: h, fly: fly });
      // never closer than a jump and a breath: the gap is in time, so it holds at every speed
      nextIn = 0.85 + Math.random() * 0.9 - Math.min(0.25, level * 0.03);
    }
    function press() {
      if (closed) return;
      if (state !== 'run') { if (state === 'over' && performance.now() - overAt < 450) return; reset(); state = 'run'; last = 0; loop(); return; }   // (not at once after a bump: the press that was meant as a jump)
      if (onGround) { vy = -Math.sqrt(2 * 2600 * size() * 2.05); onGround = false; jumpT = 0; held = true; note(520, 900, 0.075, 0.09); }
    }
    function release() { held = false; if (!onGround && vy < 0) vy *= 0.55; }   // a short press: a low jump

    function step(dt) {
      clock += dt;
      score += dt * speed / 22;
      var lv = Math.floor(score / 250) + 1;
      if (lv !== level) { level = lv; speed = Math.min(560, 250 + (lv - 1) * 26); tintFrom = tint(); tintTo = rgb(TINTS[(lv - 1) % TINTS.length]); tintAt = clock; levelAt = clock; note(660, 990, 0.06, 0.07); note(990, 1320, 0.08, 0.07, 'triangle', 0.08); }
      runT += dt * (speed / 250);
      if (!onGround) {
        vy += 2600 * dt; y += vy * dt; jumpT += dt;
        if (y >= 0) { y = 0; vy = 0; onGround = true; landAt = clock; }
      }
      dashes = (dashes + speed * dt) % 46;
      clouds.forEach(function (c) { c[0] -= speed * 0.12 * dt; if (c[0] < -c[2]) { c[0] = W + c[2]; c[1] = 18 + Math.random() * (H * 0.3); } });
      nextIn -= dt;
      if (nextIn <= 0) spawn();
      var s = size(), px = Math.max(40, W * 0.16), pw = s * FW / FH;
      // the creature's body, not its picture's whole box: forgiving at the fur's edge
      var bx0 = px - pw * 0.24, bx1 = px + pw * 0.24, by1 = ground() + y, by0 = by1 - s * 0.7;
      for (var i = things.length - 1; i >= 0; i--) {
        var t = things[i];
        t.x -= speed * dt;
        if (t.x + t.w < -10) { things.splice(i, 1); continue; }
        if (bx1 > t.x + 3 && bx0 < t.x + t.w - 3 && by1 > ground() - t.fly - t.h + 4 && by0 < ground() - t.fly - 3) {
          over = true; state = 'over'; landAt = clock; overAt = performance.now(); note(190, 70, 0.17, 0.12, 'square');
          if (score > best) { best = Math.floor(score); try { localStorage.setItem(BEST, String(best)); } catch (_e) {} }
        }
      }
    }

    function thing(t, ink) {
      var g = ground(), x = t.x, w = t.w, h = t.h;
      ctx.fillStyle = ink;
      var cup = function (cx, cw, ch, base) {
        ctx.beginPath(); ctx.moveTo(cx, base - ch); ctx.lineTo(cx + cw, base - ch); ctx.lineTo(cx + cw * 0.84, base); ctx.lineTo(cx + cw * 0.16, base); ctx.closePath(); ctx.fill();
        ctx.fillRect(cx - cw * 0.06, base - ch - 3, cw * 1.12, 4);   // the lid
      };
      if (t.k === 'bird') {   // a round body, a beak ahead of it, one wing that beats
        var by = g - t.fly - h / 2, up = Math.floor(clock * 7 + x * 0.01) % 2;
        ctx.beginPath(); ctx.ellipse(x + w * 0.55, by, w * 0.36, h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, by + h * 0.05); ctx.lineTo(x + w * 0.26, by - h * 0.22); ctx.lineTo(x + w * 0.26, by + h * 0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w * 0.42, by); ctx.lineTo(x + w * 0.86, by); ctx.lineTo(x + w * 0.78, by + (up ? -h * 1.05 : h * 0.95)); ctx.closePath(); ctx.fill();
      } else if (t.k === 'can') {
        ctx.beginPath(); ctx.roundRect(x, g - h, w, h, 4); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x, g - h * 0.62, w, h * 0.2);
      } else if (t.k === 'pair') { cup(x, w * 0.46, h, g); cup(x + w * 0.54, w * 0.46, h * 0.82, g); }
      else if (t.k === 'stack') { cup(x, w, h * 0.56, g); cup(x + w * 0.1, w * 0.8, h * 0.44, g - h * 0.56 - 2); }
      else cup(x, w, h, g);
    }
    function draw() {
      if (!W) return;
      var c = tint(), g = ground(), s = size(), night = root.dataset.mbSky === 'night';
      ctx.fillStyle = css(mix(c, [12, 17, 18], night ? 0.07 : 0.12)); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = css(c, 0.1);
      clouds.forEach(function (k) { ctx.beginPath(); ctx.roundRect(k[0], k[1], k[2], k[2] * 0.3, k[2] * 0.15); ctx.fill(); });
      ctx.fillStyle = css(c, 0.5); ctx.fillRect(0, g, W, 2);
      ctx.fillStyle = css(c, 0.22);
      for (var x = -dashes; x < W; x += 46) ctx.fillRect(x, g + 8 + ((x + dashes) / 46 % 2 | 0) * 6, 14, 2);
      var ink = css(mix(c, [255, 255, 255], 0.86));
      things.forEach(function (t) { thing(t, ink); });
      // the creature
      var px = Math.max(40, W * 0.16), pw = s * FW / FH, f = 0;
      if (over) f = 27;
      else if (!onGround) f = 12 + Math.min(11, Math.floor(jumpT / 0.62 * 12));
      else if (state === 'run') f = clock - landAt < 0.1 ? 26 : Math.floor(runT * 15) % 12;
      ctx.imageSmoothingQuality = 'high';
      if (sprite) ctx.drawImage(sprite, f * FW, 0, FW, FH, Math.round(px - pw / 2), Math.round(g + y - s + s * 0.06), Math.round(pw), s);
      else { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(px, g + y - s * 0.45, s * 0.4, 0, Math.PI * 2); ctx.fill(); }
      // the numbers: the level left, the score right, the best under it
      var light = css(mix(c, [255, 255, 255], 0.55));
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = light; ctx.textAlign = 'right';
      ctx.font = "700 26px 'M3 Digits', 'Geist Sans', system-ui, sans-serif"; ctx.fillText(String(Math.floor(score)), W - 12, 30);
      ctx.font = "600 11px 'Geist Sans', system-ui, sans-serif";
      ctx.fillStyle = css(c, 0.75); if (best) ctx.fillText('labākais ' + best, W - 12, 46);
      ctx.textAlign = 'left'; ctx.fillStyle = light;
      ctx.font = "700 12px 'Geist Sans', system-ui, sans-serif";
      var pop = Math.max(0, 1 - (clock - levelAt) / 0.5);   // the level's number steps forward for a moment
      ctx.save(); ctx.translate(12, 24); ctx.scale(1 + pop * 0.35, 1 + pop * 0.35); ctx.fillText('Līm. ' + level, 0, 0); ctx.restore();
      if (state !== 'run') {
        ctx.textAlign = 'center'; ctx.fillStyle = css(mix(c, [255, 255, 255], 0.3));
        ctx.font = "700 15px 'Geist Sans', system-ui, sans-serif";
        ctx.fillText(state === 'over' ? 'Vēlreiz' : 'Spied, lai lektu', W / 2, Math.round(H * 0.42));
      }
    }

    function loop(now) {
      if (closed || state !== 'run') { raf = 0; draw(); return; }
      raf = requestAnimationFrame(loop);
      if (!now) return;
      if (LOW && (skip = !skip)) return;                     // a weak computer: every other frame
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (dt) step(dt);
      draw();
    }
    function pause() { if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; }
    function resume() { if (state === 'run' && !raf && !document.hidden) loop(); }

    function down(e) { e.preventDefault(); cv.focus({ preventScroll: true }); press(); }
    function key(e) {
      if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // only when the game is what the person is at: it runs, or it has the focus or the pointer
      if (state !== 'run' && document.activeElement !== cv && !cv.matches(':hover')) return;
      e.preventDefault();
      if (e.type === 'keyup') { release(); return; }
      if (!e.repeat) press();
    }
    function vis() { if (document.hidden) pause(); else resume(); }
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    document.addEventListener('visibilitychange', vis);
    var io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(function (en) { if (en[en.length - 1].isIntersecting) resume(); else pause(); }) : null;
    if (io) io.observe(cv);

    return {
      close: function () {
        closed = true; pause();
        cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointerup', release); cv.removeEventListener('pointercancel', release);
        window.removeEventListener('keydown', key); window.removeEventListener('keyup', key);
        document.removeEventListener('visibilitychange', vis);
        if (ro) ro.disconnect(); if (io) io.disconnect();
        if (sprite) { try { sprite.close(); } catch (_e) {} sprite = null; }
        clearTimeout(acT); if (ac) { try { ac.close(); } catch (_e) {} ac = null; }
        cv.remove();
      },
      // for the tests: the state, and a press
      state: function () { var px = Math.max(40, W * 0.16), near = things.filter(function (t) { return t.x + t.w > px; }).sort(function (a, b) { return a.x - b.x; })[0]; return { state: state, score: Math.floor(score), level: level, things: things.length, running: !!raf, y: Math.round(y), ahead: near ? Math.round(near.x - px) : -1, high: !!(near && near.fly > size() * 0.5), speed: Math.round(speed) }; },
      // for the tests: straight to a level
      level: function (n) { score = (n - 1) * 250 + 1; },
      press: press, release: release
    };
  }
  window.MinkaRunner = { open: open };
})();
