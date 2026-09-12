/* Compact, versioned appearance data. No DOM, timers, or network work. */
(function (root) {
  'use strict';
  var faces = ['classic', 'photo', 'orbit', 'modular'];
  var parts = ['hours', 'name', 'initials', 'month', 'coffee', 'fatigue', 'remaining', 'emoji', 'clock'];
  // Centre x/y (%), size (%), visibility. Positions scale with the actual card.
  var layouts = {
    classic: [[50,45,100,1],[35,12,100,1],[16,12,100,0],[84,13,90,1],[14,39,90,1],[23,85,90,1],[53,85,90,1],[82,85,95,1],[50,20,100,0]],
    photo: [[68,38,130,1],[37,78,100,1],[17,14,100,0],[81,14,90,0],[16,16,90,1],[19,58,90,0],[64,92,80,1],[18,51,100,1],[50,14,90,0]],
    orbit: [[50,46,112,1],[50,71,85,1],[50,13,90,0],[78,19,85,1],[19,20,95,1],[21,83,85,1],[52,87,85,1],[83,80,110,1],[50,12,85,0]],
    modular: [[50,32,85,1],[50,12,80,1],[16,14,90,0],[77,58,95,1],[25,58,100,1],[25,83,95,1],[72,84,100,1],[85,16,100,1],[50,45,90,0]]
  };
  function bounded(n, min, max, fallback) {
    n = Number(n);
    return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n))) : fallback;
  }
  function clean(value) {
    value = value && typeof value === 'object' ? value : {};
    var face = faces.indexOf(value.face) >= 0 ? value.face : 'classic';
    var out = { face: face, tint: /^[a-f0-9]{6}$/i.test(value.tint || '') ? value.tint.toLowerCase() : 'd5e6ef',
      metal: bounded(value.metal, 0, 11, 0), finish: bounded(value.finish, 0, 2, 0),
      imageX: bounded(value.imageX, 0, 100, 50), imageY: bounded(value.imageY, 0, 100, 50),
      imageZoom: bounded(value.imageZoom, 100, 180, 100), parts: {} };
    parts.forEach(function (key, i) {
      var base = layouts[face][i], p = value.parts && value.parts[key];
      if (!Array.isArray(p)) p = base;
      out.parts[key] = [bounded(p[0], 5, 95, base[0]), bounded(p[1], 5, 95, base[1]), bounded(p[2], 50, 170, base[2]), p[3] === 0 ? 0 : 1];
    });
    return out;
  }
  function preset(face, previous) {
    var value = Object.assign({}, previous || {}, { face: face, parts: null });
    if (!previous) {
      value.tint = face === 'orbit' ? 'c8e69f' : face === 'photo' ? 'f4cec7' : face === 'modular' ? '73e2de' : 'd5e6ef';
      value.metal = face === 'photo' ? 3 : face === 'orbit' ? 2 : 0;
    }
    return clean(value);
  }
  function pack(value) {
    var v = clean(value);
    return [1, faces.indexOf(v.face), v.tint, v.metal, v.finish, v.imageX, v.imageY, v.imageZoom]
      .concat(parts.map(function (key) { return v.parts[key].join(','); })).join('~');
  }
  function unpack(text) {
    var a = String(text || '').split('~');
    if (a.length !== 17 || a[0] !== '1' || !/^[0-3]$/.test(a[1]) || !/^[a-f0-9]{6}$/.test(a[2])) return null;
    if (!a.slice(3,8).every(function (n) { return /^\d{1,3}$/.test(n); })) return null;
    var value = { face: faces[+a[1]], tint: a[2], metal: +a[3], finish: +a[4], imageX: +a[5], imageY: +a[6], imageZoom: +a[7], parts: {} };
    for (var i = 0; i < parts.length; i++) {
      if (!/^\d{1,2},\d{1,2},\d{2,3},[01]$/.test(a[i + 8])) return null;
      value.parts[parts[i]] = a[i + 8].split(',').map(Number);
    }
    var result = clean(value);
    // Reject noncanonical/out-of-range payloads rather than silently accepting them.
    return pack(result) === text ? result : null;
  }
  root.MinkaCardFaceModel = { faces: faces, parts: parts, clean: clean, preset: preset, pack: pack, unpack: unpack };
})(globalThis);
