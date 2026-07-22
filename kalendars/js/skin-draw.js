(function MinkaSkinDraw() {
  'use strict';

  var SIZE = 384;
  var PREVIEW_SIZE = 220;
  var MAX_BYTES = 96 * 1024;
  var MAX_UNDO_STROKES = 160;

  function toast(message, type) {
    if (typeof window._mkToast === 'function') window._mkToast(message, type || 'ok');
  }

  function canvasBlob(canvas, quality) {
    return new Promise(function(resolve) { canvas.toBlob(resolve, 'image/webp', quality); });
  }

  async function compactWebp(canvas) {
    var qualities = [0.84, 0.70, 0.56, 0.44];
    for (var i = 0; i < qualities.length; i++) {
      var blob = await canvasBlob(canvas, qualities[i]);
      if (blob && blob.type === 'image/webp' && blob.size <= MAX_BYTES) return blob;
    }
    return null;
  }

  function initials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2).map(function(part) { return part.charAt(0); }).join('').toUpperCase();
  }

  function open(options) {
    options = options || {};
    var old = document.querySelector('.mk-draw-overlay');
    if (old) old.remove();

    var name = String(options.name || 'Darbinieks').trim();
    var nameParts = name.split(/\s+/);
    var firstName = nameParts.shift() || 'Darbinieks';
    var lastName = nameParts.join(' ');
    var overlay = document.createElement('div');
    overlay.className = 'mk-draw-overlay';
    overlay.innerHTML = ''
      + '<section class="mk-draw-dialog" role="dialog" aria-modal="true" aria-labelledby="mkDrawTitle">'
      + '  <header class="mk-draw-head"><div><h3 id="mkDrawTitle">Kartes zīmējums</h3><span class="mk-draw-worker"></span></div><button type="button" class="mk-draw-close" aria-label="Aizvērt" title="Aizvērt">×</button></header>'
      + '  <div class="mk-draw-toolbar">'
      + '    <div class="mk-draw-tools" role="group" aria-label="Zīmēšanas rīki">'
      + '      <button type="button" class="mk-draw-tool is-active" data-tool="pen" title="Brīva līnija">✎ Zīmulis</button>'
      + '      <button type="button" class="mk-draw-tool" data-tool="eraser" title="Dzēšgumija">⌫ Dzēst</button>'
      + '      <button type="button" class="mk-draw-tool" data-tool="line" title="Taisna līnija">╱ Līnija</button>'
      + '      <button type="button" class="mk-draw-tool" data-tool="rect" title="Taisnstūris">□</button>'
      + '      <button type="button" class="mk-draw-tool" data-tool="circle" title="Aplis">○</button>'
      + '      <button type="button" class="mk-draw-tool" data-tool="star" title="Zvaigznes zīmogs">★</button>'
      + '      <button type="button" class="mk-draw-tool" data-tool="heart" title="Sirds zīmogs">♥</button>'
      + '      <button type="button" class="mk-draw-tool" data-tool="spark" title="Dzirksts zīmogs">✦</button>'
      + '    </div>'
      + '    <label class="mk-draw-control"><span>Krāsa</span><input type="color" class="mk-draw-color" value="#f8fafc"></label>'
      + '    <label class="mk-draw-control mk-draw-size-control"><span>Ota</span><input type="range" class="mk-draw-size" min="2" max="36" step="1" value="7"><output class="mk-draw-size-value">7</output></label>'
      + '    <label class="mk-draw-control mk-draw-fill-shape"><input type="checkbox" class="mk-draw-shape-fill"> Pildīts</label>'
      + '  </div>'
      + '  <div class="mk-draw-subbar">'
      + '    <label class="mk-draw-control"><span>Fons</span><input type="color" class="mk-draw-bg" value="#0b1019"></label>'
      + '    <button type="button" class="mk-draw-action mk-draw-fill">Aizpildīt fonu</button>'
      + '    <span class="mk-draw-subtitle">Efekti</span>'
      + '    <button type="button" class="mk-draw-effect" data-effect="stars">✦ Zvaigznes</button>'
      + '    <button type="button" class="mk-draw-effect" data-effect="dots">· Punkti</button>'
      + '    <button type="button" class="mk-draw-effect" data-effect="grid"># Režģis</button>'
      + '    <button type="button" class="mk-draw-effect" data-effect="vignette">◉ Vinjete</button>'
      + '    <span class="mk-draw-spacer"></span>'
      + '    <button type="button" class="mk-draw-icon mk-draw-undo" aria-label="Atsaukt" title="Atsaukt">↶</button>'
      + '    <button type="button" class="mk-draw-icon mk-draw-clear" aria-label="Notīrīt" title="Notīrīt">⌧</button>'
      + '  </div>'
      + '  <div class="mk-draw-workspace">'
      + '    <div class="mk-draw-editor"><div class="mk-draw-label">Zīmējums · 1:1</div><canvas class="mk-draw-canvas" width="384" height="384"></canvas></div>'
      + '    <aside class="mk-draw-preview-wrap"><div class="mk-draw-label">Priekšskatījums kartē</div><div class="mk-draw-card-preview">'
      + '      <canvas class="mk-draw-preview" width="220" height="220"></canvas><div class="mk-draw-card-scrim"></div>'
      + '      <strong class="mk-draw-card-initials"></strong><span class="mk-draw-card-month"><b></b><small>MĒNESĪ</small></span>'
      + '      <span class="mk-draw-card-shift"></span><span class="mk-draw-card-name"></span><span class="mk-draw-card-last"></span>'
      + '      <span class="mk-draw-card-fatigue"><i><em></em></i><b></b></span>'
      + '    </div><p class="mk-draw-preview-note">Fons ar kartes tumšo pārklājumu un īstajiem maiņas datiem.</p></aside>'
      + '  </div>'
      + '  <footer class="mk-draw-actions"><span class="mk-draw-status" role="status"></span><button type="button" class="mk-draw-cancel">Atcelt</button><button type="button" class="mk-draw-save">Saglabāt zīmējumu</button></footer>'
      + '</section>';
    document.body.appendChild(overlay);

    overlay.querySelector('.mk-draw-worker').textContent = name;
    overlay.querySelector('.mk-draw-card-initials').textContent = initials(name);
    overlay.querySelector('.mk-draw-card-month b').textContent = String(options.monthHours || '0h');
    overlay.querySelector('.mk-draw-card-shift').textContent = String(options.shiftHours || '');
    overlay.querySelector('.mk-draw-card-name').textContent = firstName;
    overlay.querySelector('.mk-draw-card-last').textContent = lastName;
    overlay.querySelector('.mk-draw-card-fatigue b').textContent = String(options.fatigue || '');
    var fatigueValue = Math.max(0, Math.min(100, parseFloat(options.fatigue) || 0));
    overlay.querySelector('.mk-draw-card-fatigue em').style.width = fatigueValue + '%';
    if (options.role === 'rd') overlay.querySelector('.mk-draw-card-preview').classList.add('is-rd');
    var canvas = overlay.querySelector('.mk-draw-canvas');
    var ctx = canvas.getContext('2d', { alpha: true });
    var preview = overlay.querySelector('.mk-draw-preview');
    var previewCtx = preview.getContext('2d', { alpha: false });
    var base = document.createElement('canvas');
    base.width = SIZE;
    base.height = SIZE;
    var baseCtx = base.getContext('2d', { alpha: true });
    var strokes = [];
    var current = null;
    var tool = 'pen';
    var color = '#f8fafc';
    var brushSize = 7;
    var bg = '#0b1019';
    var shapeFill = false;
    var closed = false;
    var dirty = false;
    var previewFrame = 0;

    function pathStar(target, x, y, radius, points) {
      target.beginPath();
      for (var i = 0; i < points * 2; i++) {
        var angle = -Math.PI / 2 + i * Math.PI / points;
        var r = i % 2 ? radius * 0.42 : radius;
        var px = x + Math.cos(angle) * r;
        var py = y + Math.sin(angle) * r;
        if (!i) target.moveTo(px, py); else target.lineTo(px, py);
      }
      target.closePath();
    }

    function pathHeart(target, x, y, radius) {
      var r = radius / 2;
      target.beginPath();
      target.moveTo(x, y + radius * 0.75);
      target.bezierCurveTo(x - radius * 1.35, y, x - r, y - radius, x, y - radius * 0.35);
      target.bezierCurveTo(x + r, y - radius, x + radius * 1.35, y, x, y + radius * 0.75);
      target.closePath();
    }

    function drawEffect(target, stroke) {
      target.save();
      if (stroke.effect === 'vignette') {
        var gradient = target.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.2, SIZE / 2, SIZE / 2, SIZE * 0.72);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,.68)');
        target.fillStyle = gradient;
        target.fillRect(0, 0, SIZE, SIZE);
      } else if (stroke.effect === 'grid') {
        target.strokeStyle = stroke.color;
        target.globalAlpha = .24;
        target.lineWidth = 1;
        for (var g = 24; g < SIZE; g += 24) {
          target.beginPath(); target.moveTo(g, 0); target.lineTo(g, SIZE); target.stroke();
          target.beginPath(); target.moveTo(0, g); target.lineTo(SIZE, g); target.stroke();
        }
      } else {
        target.fillStyle = stroke.color;
        stroke.points.forEach(function(point, index) {
          target.globalAlpha = point.a;
          if (stroke.effect === 'stars') {
            pathStar(target, point.x, point.y, point.r, index % 3 ? 4 : 5);
            target.fill();
          } else {
            target.beginPath();
            target.arc(point.x, point.y, point.r, 0, Math.PI * 2);
            target.fill();
          }
        });
      }
      target.restore();
    }

    function drawStroke(target, stroke) {
      if (!stroke) return;
      if (stroke.tool === 'effect') { drawEffect(target, stroke); return; }
      if (!stroke.points || !stroke.points.length) return;
      target.save();
      target.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      target.strokeStyle = stroke.color;
      target.fillStyle = stroke.color;
      target.lineWidth = stroke.size;
      target.lineCap = 'round';
      target.lineJoin = 'round';
      var first = stroke.points[0];
      var last = stroke.points[stroke.points.length - 1];
      if (stroke.tool === 'line') {
        target.beginPath(); target.moveTo(first.x, first.y); target.lineTo(last.x, last.y); target.stroke();
      } else if (stroke.tool === 'rect') {
        var rw = last.x - first.x, rh = last.y - first.y;
        if (stroke.fill) target.fillRect(first.x, first.y, rw, rh); else target.strokeRect(first.x, first.y, rw, rh);
      } else if (stroke.tool === 'circle') {
        var cx = (first.x + last.x) / 2, cy = (first.y + last.y) / 2;
        target.beginPath();
        target.ellipse(cx, cy, Math.abs(last.x - first.x) / 2, Math.abs(last.y - first.y) / 2, 0, 0, Math.PI * 2);
        if (stroke.fill) target.fill(); else target.stroke();
      } else if (stroke.tool === 'star') {
        pathStar(target, first.x, first.y, stroke.size * 1.8, 5); target.fill();
      } else if (stroke.tool === 'heart') {
        pathHeart(target, first.x, first.y, stroke.size * 1.7); target.fill();
      } else if (stroke.tool === 'spark') {
        pathStar(target, first.x, first.y, stroke.size * 2, 4); target.fill();
      } else if (stroke.points.length === 1) {
        target.beginPath(); target.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2); target.fill();
      } else {
        target.beginPath(); target.moveTo(first.x, first.y);
        for (var i = 1; i < stroke.points.length; i++) target.lineTo(stroke.points[i].x, stroke.points[i].y);
        target.stroke();
      }
      target.restore();
    }

    function syncPreview() {
      previewFrame = 0;
      previewCtx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      previewCtx.drawImage(canvas, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    }

    function schedulePreview() {
      if (previewFrame || closed) return;
      previewFrame = requestAnimationFrame(syncPreview);
    }

    function redraw() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(base, 0, 0);
      strokes.forEach(function(stroke) { drawStroke(ctx, stroke); });
      if (current) drawStroke(ctx, current);
      overlay.querySelector('.mk-draw-undo').disabled = strokes.length === 0;
      schedulePreview();
    }

    function commitStroke(stroke) {
      if (strokes.length >= MAX_UNDO_STROKES) drawStroke(baseCtx, strokes.shift());
      strokes.push(stroke);
      dirty = true;
      overlay.querySelector('.mk-draw-undo').disabled = false;
      schedulePreview();
    }

    function drawLatestSegment(stroke) {
      var count = stroke.points.length;
      if (count === 1) drawStroke(ctx, stroke);
      else drawStroke(ctx, { tool: stroke.tool, color: stroke.color, size: stroke.size, points: [stroke.points[count - 2], stroke.points[count - 1]] });
      schedulePreview();
    }

    function fillBase(nextColor, resetStrokes) {
      bg = nextColor;
      baseCtx.save();
      baseCtx.globalCompositeOperation = 'source-over';
      baseCtx.fillStyle = bg;
      baseCtx.fillRect(0, 0, SIZE, SIZE);
      baseCtx.restore();
      if (resetStrokes) strokes = [];
      dirty = true;
      redraw();
    }

    function pointFromEvent(event) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(SIZE, (event.clientX - rect.left) * SIZE / rect.width)),
        y: Math.max(0, Math.min(SIZE, (event.clientY - rect.top) * SIZE / rect.height))
      };
    }

    function finishStroke(event) {
      if (!current) return;
      if (event && canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      commitStroke(current);
      current = null;
      redraw();
    }

    function close() {
      if (closed) return;
      closed = true;
      if (previewFrame) cancelAnimationFrame(previewFrame);
      window.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      strokes.length = 0;
      current = null;
      canvas.width = canvas.height = preview.width = preview.height = base.width = base.height = 1;
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') close();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        strokes.pop();
        dirty = true;
        redraw();
      }
    }

    function seededPoints(count) {
      var points = [];
      var seed = (Date.now() >>> 0) || 1;
      function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      for (var i = 0; i < count; i++) points.push({ x: random() * SIZE, y: random() * SIZE, r: 1.5 + random() * 5, a: .22 + random() * .58 });
      return points;
    }

    function applyEffect(effect) {
      var points = effect === 'stars' ? seededPoints(34) : effect === 'dots' ? seededPoints(54) : [];
      commitStroke({ tool: 'effect', effect: effect, color: color, points: points });
      redraw();
    }

    canvas.addEventListener('pointerdown', function(event) {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      var point = pointFromEvent(event);
      var stamp = tool === 'star' || tool === 'heart' || tool === 'spark';
      if (stamp) {
        commitStroke({ tool: tool, color: color, size: brushSize, fill: true, points: [point] });
        redraw();
        return;
      }
      canvas.setPointerCapture(event.pointerId);
      current = { tool: tool, color: color, size: brushSize, fill: shapeFill, points: [point] };
      if (tool === 'pen' || tool === 'eraser') drawLatestSegment(current); else redraw();
    });
    canvas.addEventListener('pointermove', function(event) {
      if (!current) return;
      event.preventDefault();
      var point = pointFromEvent(event);
      if (tool === 'pen' || tool === 'eraser') {
        var previous = current.points[current.points.length - 1];
        if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1.2) return;
        current.points.push(point);
        drawLatestSegment(current);
      } else {
        current.points[1] = point;
        redraw();
      }
    });
    canvas.addEventListener('pointerup', finishStroke);
    canvas.addEventListener('pointercancel', finishStroke);

    overlay.querySelectorAll('.mk-draw-tool').forEach(function(button) {
      button.addEventListener('click', function() {
        tool = button.dataset.tool;
        overlay.querySelectorAll('.mk-draw-tool').forEach(function(item) { item.classList.toggle('is-active', item === button); });
        overlay.querySelector('.mk-draw-fill-shape').classList.toggle('is-visible', tool === 'rect' || tool === 'circle');
      });
    });
    overlay.querySelectorAll('.mk-draw-effect').forEach(function(button) {
      button.addEventListener('click', function() { applyEffect(button.dataset.effect); });
    });
    overlay.querySelector('.mk-draw-color').addEventListener('input', function(event) { color = event.target.value; });
    overlay.querySelector('.mk-draw-size').addEventListener('input', function(event) {
      brushSize = Number(event.target.value) || 7;
      overlay.querySelector('.mk-draw-size-value').value = String(brushSize);
    });
    overlay.querySelector('.mk-draw-shape-fill').addEventListener('change', function(event) { shapeFill = event.target.checked; });
    overlay.querySelector('.mk-draw-bg').addEventListener('input', function(event) { bg = event.target.value; });
    overlay.querySelector('.mk-draw-fill').addEventListener('click', function() { fillBase(bg, false); });
    overlay.querySelector('.mk-draw-undo').addEventListener('click', function() { strokes.pop(); dirty = true; redraw(); });
    overlay.querySelector('.mk-draw-clear').addEventListener('click', function() { fillBase(bg, true); });
    overlay.querySelector('.mk-draw-close').addEventListener('click', close);
    overlay.querySelector('.mk-draw-cancel').addEventListener('click', close);
    overlay.addEventListener('pointerdown', function(event) { if (event.target === overlay) close(); });
    window.addEventListener('keydown', onKeyDown);

    overlay.querySelector('.mk-draw-save').addEventListener('click', async function() {
      var save = overlay.querySelector('.mk-draw-save');
      var status = overlay.querySelector('.mk-draw-status');
      save.disabled = true;
      status.textContent = 'Sagatavo...';
      try {
        var blob = await compactWebp(canvas);
        if (!blob) throw new Error('Zīmējums pārsniedz 96 KB');
        status.textContent = 'Saglabā...';
        await options.onSave(blob);
        toast('Zīmējums saglabāts — redzēs visi', 'ok');
        close();
      } catch (error) {
        status.textContent = error && error.message ? error.message : 'Neizdevās saglabāt';
        save.disabled = false;
      }
    });

    if (options.numberColor) overlay.querySelector('.mk-draw-card-shift').style.color = options.numberColor;
    if (options.textColor) {
      overlay.querySelector('.mk-draw-card-name').style.color = options.textColor;
      overlay.querySelector('.mk-draw-card-last').style.color = options.textColor;
      overlay.querySelector('.mk-draw-card-initials').style.color = options.textColor;
    }
    baseCtx.fillStyle = bg;
    baseCtx.fillRect(0, 0, SIZE, SIZE);
    redraw();
    if (options.initialUrl) {
      var image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = function() {
        if (closed || dirty) return;
        var scale = Math.max(SIZE / image.width, SIZE / image.height);
        var width = image.width * scale, height = image.height * scale;
        baseCtx.clearRect(0, 0, SIZE, SIZE);
        baseCtx.drawImage(image, (SIZE - width) / 2, (SIZE - height) / 2, width, height);
        redraw();
      };
      image.src = options.initialUrl;
    }
  }

  window.MinkaSkinDraw = { open: open };
})();
