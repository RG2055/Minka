/* 3D emoji pictures (assets/emoji3d): shared by decorations, the emoji background
   and the night bed pillows. Each is a small WebP in two sizes (128, 320), loaded only
   when shown. Sources, both CC BY 4.0 (Figma Community):
     Roji x Moji, by Dmitrij Matvejchuk (roji);
     Emoji Balloons Pack, by DESIGNRIP / Entropy Cg Assets (balloon).
   Left out: one with a rude word, one with a flag, the purple ones, empty templates. */
(function () {
  'use strict';
  var V = '20260929e3d1';
  var LIST = [{"id": "r01", "set": "roji", "label": "Roji 1"}, {"id": "r02", "set": "roji", "label": "Roji 2"}, {"id": "r03", "set": "roji", "label": "Roji 3"}, {"id": "r04", "set": "roji", "label": "Roji 4"}, {"id": "r05", "set": "roji", "label": "Roji 5"}, {"id": "r06", "set": "roji", "label": "Roji 6"}, {"id": "r07", "set": "roji", "label": "Roji 7"}, {"id": "r08", "set": "roji", "label": "Roji 8"}, {"id": "r09", "set": "roji", "label": "Roji 9"}, {"id": "r10", "set": "roji", "label": "Roji 10"}, {"id": "r11", "set": "roji", "label": "Roji 11"}, {"id": "r12", "set": "roji", "label": "Roji 12"}, {"id": "r13", "set": "roji", "label": "Roji 13"}, {"id": "r14", "set": "roji", "label": "Roji 14"}, {"id": "r15", "set": "roji", "label": "Roji 15"}, {"id": "r16", "set": "roji", "label": "Roji 16"}, {"id": "r17", "set": "roji", "label": "Roji 17"}, {"id": "r18", "set": "roji", "label": "Roji 18"}, {"id": "r19", "set": "roji", "label": "Roji 19"}, {"id": "r20", "set": "roji", "label": "Roji 20"}, {"id": "r21", "set": "roji", "label": "Roji 21"}, {"id": "r22", "set": "roji", "label": "Roji 22"}, {"id": "r23", "set": "roji", "label": "Roji 23"}, {"id": "r24", "set": "roji", "label": "Roji 24"}, {"id": "r25", "set": "roji", "label": "Roji 25"}, {"id": "r26", "set": "roji", "label": "Roji 26"}, {"id": "r27", "set": "roji", "label": "Roji 27"}, {"id": "r28", "set": "roji", "label": "Roji 28"}, {"id": "r29", "set": "roji", "label": "Roji 29"}, {"id": "r30", "set": "roji", "label": "Roji 30"}, {"id": "r31", "set": "roji", "label": "Roji 31"}, {"id": "r32", "set": "roji", "label": "Roji 32"}, {"id": "r33", "set": "roji", "label": "Roji 33"}, {"id": "r34", "set": "roji", "label": "Roji 34"}, {"id": "r35", "set": "roji", "label": "Roji 35"}, {"id": "r36", "set": "roji", "label": "Roji 36"}, {"id": "r37", "set": "roji", "label": "Roji 37"}, {"id": "r38", "set": "roji", "label": "Roji 38"}, {"id": "r39", "set": "roji", "label": "Roji 39"}, {"id": "r40", "set": "roji", "label": "Roji 40"}, {"id": "r41", "set": "roji", "label": "Roji 41"}, {"id": "r42", "set": "roji", "label": "Roji 42"}, {"id": "r43", "set": "roji", "label": "Roji 43"}, {"id": "r44", "set": "roji", "label": "Roji 44"}, {"id": "r45", "set": "roji", "label": "Roji 45"}, {"id": "r46", "set": "roji", "label": "Roji 46"}, {"id": "r47", "set": "roji", "label": "Roji 47"}, {"id": "r48", "set": "roji", "label": "Roji 48"}, {"id": "r49", "set": "roji", "label": "Roji 49"}, {"id": "r50", "set": "roji", "label": "Roji 50"}, {"id": "r51", "set": "roji", "label": "Roji 51"}, {"id": "r52", "set": "roji", "label": "Roji 52"}, {"id": "r53", "set": "roji", "label": "Roji 53"}, {"id": "r54", "set": "roji", "label": "Roji 54"}, {"id": "r55", "set": "roji", "label": "Roji 55"}, {"id": "r56", "set": "roji", "label": "Roji 56"}, {"id": "r57", "set": "roji", "label": "Roji 57"}, {"id": "b01", "set": "balloon", "label": "Balons: smaids"}, {"id": "b02", "set": "balloon", "label": "Balons: smaids"}, {"id": "b03", "set": "balloon", "label": "Balons: prieks"}, {"id": "b04", "set": "balloon", "label": "Balons: mirkšķis"}, {"id": "b05", "set": "balloon", "label": "Balons: smiekli"}, {"id": "b06", "set": "balloon", "label": "Balons: plats smaids"}, {"id": "b07", "set": "balloon", "label": "Balons: svilpo"}, {"id": "b08", "set": "balloon", "label": "Balons: dusmas"}, {"id": "b09", "set": "balloon", "label": "Balons: acis uz augšu"}, {"id": "b10", "set": "balloon", "label": "Balons: neveikli"}, {"id": "b11", "set": "balloon", "label": "Balons: mierīgs"}, {"id": "b12", "set": "balloon", "label": "Balons: smejas"}, {"id": "b13", "set": "balloon", "label": "Balons: neitrāls"}, {"id": "b14", "set": "balloon", "label": "Balons: mēle"}, {"id": "b15", "set": "balloon", "label": "Balons: mēle ārā"}, {"id": "b16", "set": "balloon", "label": "Balons: miegains"}, {"id": "b17", "set": "balloon", "label": "Balons: bēdīgs"}, {"id": "b18", "set": "balloon", "label": "Balons: prieka asaras"}, {"id": "b19", "set": "balloon", "label": "Balons: raud"}, {"id": "b20", "set": "balloon", "label": "Balons: siekalas"}, {"id": "b21", "set": "balloon", "label": "Balons: buča"}, {"id": "b22", "set": "balloon", "label": "Balons: iemīlējies"}, {"id": "b23", "set": "balloon", "label": "Balons: satraukts"}, {"id": "b24", "set": "balloon", "label": "Balons: slikti"}, {"id": "b25", "set": "balloon", "label": "Balons: bučo"}, {"id": "b26", "set": "balloon", "label": "Balons: maska"}, {"id": "b27", "set": "balloon", "label": "Balons: nauda"}];
  var BY = Object.create(null);
  LIST.forEach(function (it) { BY[it.id] = it; });
  function url(id, size) { return BY[id] ? 'assets/emoji3d/' + id + '-' + (size > 128 ? 320 : 128) + '.webp?v=' + V : ''; }
  /* As a person's own emoji: a plain emoji that looks alike, then the picture's id in
     invisible Unicode tag characters ("3d" + id, cancel tag). An app without this file
     (and the server) sees just the plain emoji; this one shows the picture. */
  var FALLBACK = { 'smaids': '😀', 'prieks': '😊', 'mirkšķis': '😉', 'smiekli': '😆', 'plats smaids': '😁', 'svilpo': '😗', 'dusmas': '😠',
    'acis uz augšu': '🙄', 'neveikli': '😅', 'mierīgs': '😌', 'smejas': '🤣', 'neitrāls': '😐', 'mēle': '😜', 'mēle ārā': '😛', 'miegains': '😴',
    'bēdīgs': '😢', 'prieka asaras': '😂', 'raud': '😭', 'siekalas': '🤤', 'buča': '😘', 'iemīlējies': '😍', 'satraukts': '😟', 'slikti': '🤢',
    'bučo': '😙', 'maska': '😷', 'nauda': '🤑' };
  function fallback(id) { var it = BY[id]; if (!it) return ''; var k = it.label.replace(/^Balons:\s*/, ''); return FALLBACK[k] || '🙂'; }
  function tags(str) { return Array.from(str).map(function (c) { return String.fromCodePoint(0xE0000 + c.charCodeAt(0)); }).join('') + String.fromCodePoint(0xE007F); }
  function encode(id) { return BY[id] ? fallback(id) + tags('3d' + id) : ''; }
  var TAG_RE = /\u{E0033}\u{E0064}((?:[\u{E0061}-\u{E007A}]|[\u{E0030}-\u{E0039}]){2,6})\u{E007F}$/u;
  function decode(value) {
    var m = TAG_RE.exec(String(value || '')); if (!m) return null;
    var id = Array.from(m[1]).map(function (c) { return String.fromCharCode(c.codePointAt(0) - 0xE0000); }).join('');
    return BY[id] ? id : null;
  }
  // The emoji as HTML: the picture for a 3D one (null for any other emoji).
  function html(value, big, cls) {
    var id = decode(value); if (!id) return null;
    return '<img class="mk-e3d' + (cls ? ' ' + cls : '') + '" src="' + url(id, big ? 320 : 128) + '" alt="' + BY[id].label.replace(/"/g, '') + '" draggable="false" decoding="async">';
  }
  // Put an emoji into an element: the picture, or the text as before; the value stays on
  // the element (data-mk-emoji) for whoever reads it (the mood card reads the cards).
  function paint(el, value, big) {
    if (!el) return;
    var h = html(value, big);
    if (h) { if (el.getAttribute('data-mk-emoji') !== value || !el.querySelector('.mk-e3d')) { el.innerHTML = h; el.setAttribute('data-mk-emoji', value); } }
    else { if (el.hasAttribute('data-mk-emoji')) el.removeAttribute('data-mk-emoji'); if (el.textContent !== value) el.textContent = value; }
  }
  window.MinkaEmoji3D = {
    list: function (set) { return LIST.filter(function (it) { return !set || it.set === set; }); },
    get: function (id) { return BY[id] || null; },
    url: url,
    encode: encode, decode: decode, html: html, paint: paint, fallback: fallback,
    sets: [['roji', 'Roji'], ['balloon', 'Baloni']]
  };
})();
