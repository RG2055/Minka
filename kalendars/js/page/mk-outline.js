/* MkOutline: the one way a progress outline is drawn, for a round avatar and for a card's rounded edge alike
   (the user's brief, 2026-11-24: one continuous path, one thickness, no stitched shapes, a wearable's quality).

   - The outline's shape is ONE path (a circle, a rounded rectangle), defined once and reused by reference for
     everything: the track, the line and the colours. Nothing has a geometry of its own.
   - The line itself is that path as a mask: one width, round at its two open ends, as long as the fatigue plus
     the caffeine's boost. So its edges and its thickness cannot change where a colour does.
   - The colours only fill behind the mask, wider than the line (their own edges never show): the fatigue's all the
     way round, then the caffeine's part from where the fatigue ends, cut straight across the line. The caffeine's
     part is a run of steps along the path's own length (so it follows the corners), from a deeper tone where it
     starts to a brighter one at its leading end.
   - That tone comes from the last drink (tone below): its hue, adapted so it is never the fatigue's own colour
     beside it, never violet, and always readable on the dark card.
   - A change (more fatigue, another drink) moves from what was drawn before: the length along the path, the tone
     through oklch. Nothing runs when nothing changes.
   Lengths are in the path's own units through three variables the place sets on the svg: --mko-run (the whole
   path), --mko-u (one percent of it) and --mko-off (where along the path the top's middle is). Styles: the
   .mko rules in css/page/mk-side-faces.css. */
(function () {
  'use strict';
  var n = 0, drawn = {}, STEPS = 16;
  // the signs, drawn round 0,0 in a box of 24: [its silhouette (what is cut from the line), the sign itself].
  // The bolt is a bold one with a wide top: a pointed one ended in a one-pixel tip that read as cut off (the user).
  var BOLT = '<path d="M-.5-11.5H7L2.5-2.5H8L-4.5 11.5-1.2 1.8h-6.3z"/>', BEAN = '<ellipse rx="6.7" ry="9.3" transform="rotate(34)"/>';
  var ICON = { bolt: [BOLT, BOLT], bean: [BEAN, BEAN + '<path class="mko-ks" d="M0-9c-3.4 3.1 3.4 5.9 0 9s3.4 5.9 0 9" transform="rotate(34)"/>'] };
  // a colour as oklch: [lightness 0..1, chroma, hue 0..360]; null when it is not #rrggbb
  function oklchOf(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var lin = function (v) { v = parseInt(v, 16) / 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    var r = lin(m[1]), g = lin(m[2]), b = lin(m[3]);
    var l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), mm = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    var L = .2104542553 * l + .793617785 * mm - .0040720468 * s, A = 1.9779984951 * l - 2.428592205 * mm + .4505937099 * s, B = .0259040371 * l + .7827717662 * mm - .808675766 * s;
    return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
  }
  /* The caffeine's two tones from the last drink's colour and the fatigue colour beside it: [deep, bright] as
     oklch() strings. The drink gives the hue; the rest is ours:
     - a drink with no colour of its own (white, grey) is an icy blue;
     - violet is never used here: its hues go to the blue or the rose next to them;
     - within 48 degrees of the fatigue's hue it would read as the same segment: it is moved away to 48, to the side
       it was already on (exactly the fatigue's own hue: toward the cooler side);
     - one chroma range and two fixed lightnesses for every drink (deep where it starts, bright at its leading
       end), so every tone is as readable on the dark card as any other. */
  function outlineTone(drink, beside) {
    var d = oklchOf(drink) || [.7, 0, 0], f = oklchOf(beside), h = d[2], c = d[1];
    var violet = function (x) { return x > 275 && x < 330; };
    if (c < .04) { h = 232; c = .11; }
    if (violet(h)) h = h < 302 ? 258 : 348;
    if (f && f[1] > .04) {
      var gap = ((h - f[2] + 540) % 360) - 180;              // -180..180, + = the drink's hue is further round
      if (Math.abs(gap) < 48) {
        var cool = ((232 - f[2] + 540) % 360) - 180, dir = gap > 0 ? 1 : gap < 0 ? -1 : (cool >= 0 ? 1 : -1);   // (a yellow can beside yellow fatigue goes to orange: the user liked that one)
        h = (f[2] + dir * 48 + 360) % 360;
        if (violet(h)) h = (f[2] - dir * 48 + 360) % 360;
      }
    }
    c = Math.max(.1, Math.min(.165, c));
    var fmt = function (L, C) { return 'oklch(' + L + ' ' + C.toFixed(3) + ' ' + h.toFixed(1) + ')'; };
    return [fmt(.67, c), fmt(.89, c * .66)];   // (deeper than .67 a warm hue turns brown on the dark card)
  }
  /* The outline's markup. path: the one shape, without an id (a <path ... pathLength="100"/> or a <rect/>).
     o: cls (the svg's classes), attrs (its other attributes), before (what is drawn under the outline: an
     avatar's disc), box (the mask's region), key (who it is: a change then moves from what was drawn for them),
     pf and pb (fatigue and boost, percent of the path), tone ([deep, bright] of the boost), marks (signs in the line). */
  function outlineSvg(path, o) {
    var id = 'mko' + (++n), now = { pf: +o.pf || 0, pb: +o.pb || 0, b0: (o.tone && o.tone[0]) || '', b1: (o.tone && o.tone[1]) || '' };
    var was = o.key && drawn[o.key] && !matchMedia('(prefers-reduced-motion: reduce)').matches ? drawn[o.key] : null;
    if (o.key) drawn[o.key] = now;
    var from = was && (was.pf !== now.pf || was.pb !== now.pb || was.b0 !== now.b0) ? was : now, steps = '';
    if (now.pb || from.pb) for (var k = 0; k < STEPS; k++) steps += '<use href="#' + id + 'g" class="mko-b" style="--k:' + (k / STEPS).toFixed(4) + '"/>';
    var vars = function (v) { return '--mko-pf:' + v.pf + ';--mko-pb:' + v.pb + (v.b0 || now.b0 ? ';--mko-b0:' + (v.b0 || now.b0) + ';--mko-b1:' + (v.b1 || now.b1) : ''); };
    // marks (o.marks: [{ at: percent of the path, icon: 'bolt' | 'bean' }]): a sign set into the line itself, as on a
    // wristband's charging line. Its silhouette, a little larger, is cut out of the line and the track (black in
    // their masks: the line stops a hair short of the sign all round, no box), and the sign is drawn in the
    // opening in the line's own colour there. Where it stands is the place's CSS (.mko-k: a transform from --at).
    // What is under the outline (an avatar's disc) keeps the same hair of room from a sign.
    var box = o.box || 'x="-20" y="-20" width="300%" height="300%"', marks = o.marks || [];
    var at = function (m, inner) { return '<g class="mko-k mko-k-' + m.icon + '" style="--at:' + m.at + '">' + inner + '</g>'; };
    var cuts = marks.map(function (m) { return at(m, '<g class="mko-kp mko-kc">' + ICON[m.icon][0] + '</g>'); }).join('');
    var signs = marks.map(function (m) { return at(m, '<g class="mko-kp mko-kd">' + ICON[m.icon][1] + '</g>'); }).join('');
    var head = '<svg class="mko ' + (o.cls || '') + '" ' + (o.attrs || '') + ' shape-rendering="geometricPrecision" aria-hidden="true" style="' + vars(from) + '"' + (from !== now ? ' data-mko-to="' + vars(now) + '"' : '') + '>'
      + '<defs>' + path.replace(/^<(\w+)/, '<$1 id="' + id + 'g" class="mko-g"');
    var line = '<g mask="url(#' + id + ')"><use href="#' + id + 'g" class="mko-f"/>' + steps + '</g>';
    /* o.cut 'paint': the room round a sign is painted (its silhouette in the place's own background, --mko-bg,
       over the line's band only), in the same pass as the sign, so the two always sit on each other exactly. A
       card under CSS zoom needs this: there a mask's cut and the sign landed a part of a pixel apart, and one
       side of the sign looked dark (the user). Elsewhere the room is cut out of the masks (see-through, right
       on any background). */
    if (cuts && o.cut === 'paint') return head + '<mask id="' + id + '" maskUnits="userSpaceOnUse" ' + box + '><use href="#' + id + 'g" class="mko-m"/></mask>'
      + '<mask id="' + id + 'b" maskUnits="userSpaceOnUse" ' + box + '><use href="#' + id + 'g" class="mko-mb"/></mask></defs>'
      + (o.before || '') + '<use href="#' + id + 'g" class="mko-t"/>' + line + '<g mask="url(#' + id + 'b)">' + cuts + '</g>' + signs + '</svg>';
    return head + '<mask id="' + id + '" maskUnits="userSpaceOnUse" ' + box + '><use href="#' + id + 'g" class="mko-m"/>' + cuts + '</mask>'
      + (cuts ? '<mask id="' + id + 'n" maskUnits="userSpaceOnUse" ' + box + '><rect x="-2000" y="-2000" width="6000" height="6000" fill="#fff"/>' + cuts + '</mask>' : '') + '</defs>'
      + (cuts ? '<g mask="url(#' + id + 'n)">' : '') + (o.before || '') + '<use href="#' + id + 'g" class="mko-t"/>' + (cuts ? '</g>' : '') + line + signs + '</svg>';
  }
  // after the markup is in the page: the outlines drawn at their old values take the new ones (the sheet's
  // transitions carry them: the length along the path, the tone)
  function outlineSettle(root) {
    var list = (root || document).querySelectorAll('svg.mko[data-mko-to]');
    if (!list.length) return;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      [].forEach.call(list, function (svg) {
        svg.getAttribute('data-mko-to').split(';').forEach(function (pair) { var i = pair.indexOf(':'); if (i > 0) svg.style.setProperty(pair.slice(0, i), pair.slice(i + 1)); });
        svg.removeAttribute('data-mko-to');
      });
    }); });
  }
  /* What the outlines and their numbers show: the energy that is left (the default) or the fatigue as before. One
     switch for every place (the team's number in the mood card, page/mood-feedback.js); kept on this computer; whoever shows a
     number listens for "mk-energy-view" and draws again. */
  function energyView() { try { return localStorage.getItem('mkEnergyView') !== '0'; } catch (_) { return true; } }
  function setEnergyView(on) {
    try { if (on) localStorage.removeItem('mkEnergyView'); else localStorage.setItem('mkEnergyView', '0'); } catch (_) {}
    window.dispatchEvent(new CustomEvent('mk-energy-view', { detail: { energy: !!on } }));
  }
  window.MkOutline = { svg: outlineSvg, tone: outlineTone, settle: outlineSettle, energyView: energyView, setEnergyView: setEnergyView };
})();
