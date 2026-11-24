/* A Nogurumiņš says the person's name (a press on the creature; mk-side-faces.js loads this on the first press).
   It is the creature's own squeak that talks: a squeeze toy, a mosquito, not a voice (the user, 2026-11-24:
   "lai ir kā moskītis, nu spēļu mantiņa"). The first try was a small speaking voice with a throat's buzz and
   hissing for s: he heard a robot and an old radio's hiss. So now:
   - the sound is the squeak itself, high and thin, and every syllable is one little squeak: the pitch jumps up
     and comes back down, as the toy does when it is squeezed;
   - the squeak is coloured by the vowel (an "a" is open, an "i" thin and bright, an "u" dark): that is what lets
     a name be heard syllable by syllable;
   - no noise anywhere. The other sounds are gestures of the same squeak: m, n, l, v, j dip it; r flutters it;
     p, t, k, b, d, g cut it short so the next syllable pops; s and š are a pause with one small peep.
   The fatigue sets it as it sets the squeak: the more tired, the lower and the slower.
   No file, no library; everything is scheduled once on the sound card's own clock and nothing runs after it.
   The numbers in T can be tried by ear on tests/tools/say-tune.html (a local page with sliders). */
(function () {
  'use strict';
  // what one can turn (MinkaSayName.tune({ ... }) changes them)
  // (the values are the user's own, set by ear on the sliders, 2026-11-24)
  var T = {
    pitch: 560,      // Hz, a fresh creature (the toy's squeak is 420 to 980)
    chirp: .4,       // how far a syllable's squeak jumps up (0 = a flat whine)
    wobble: .02,     // the mosquito's waver (share of the pitch)
    wobbleHz: 24,
    body: .5,        // the plain squeak under the vowel's colour (0 = only the coloured part)
    mouth: 1.15,     // the coloured part
    size: 1.46,      // how small the mouth is: the vowels' colours this much higher
    sharp: 6.5,      // how narrow the colours are (higher = more "wah", lower = softer)
    peep: 0,         // a little peep for s, š: off (the user still heard a squeak for s); s is a pause, and at the end of a name the squeak just fades
    speed: 1.3,      // 1 = as written; higher = quicker
    vol: .22
  };
  // vowels: the two colours that carry them (Hz for a grown mouth), and a third
  var PH = {
    a: { f: [800, 1300, 2600], d: 125, vowel: 1 }, e: { f: [500, 1950, 2700], d: 115, vowel: 1 },
    i: { f: [320, 2350, 3100], d: 105, vowel: 1 }, o: { f: [500, 900, 2500], d: 120, vowel: 1 },
    u: { f: [340, 760, 2300], d: 110, vowel: 1 },
    // the squeak dipped: how loud it stays, where its colour goes, ms
    m: { f: [280, 1000, 2200], av: .4, d: 60 }, n: { f: [280, 1500, 2500], av: .4, d: 55 }, 'ņ': { f: [280, 2000, 2800], av: .4, d: 60 },
    l: { f: [360, 1250, 2600], av: .55, d: 55 }, 'ļ': { f: [320, 1900, 2800], av: .55, d: 58 }, j: { f: [300, 2250, 3000], av: .55, d: 50 },
    v: { f: [320, 1000, 2300], av: .38, d: 55 }, z: { f: [280, 1700, 2600], av: .3, d: 60 }, 'ž': { f: [280, 1800, 2500], av: .3, d: 60 },
    r: { f: [500, 1350, 2400], av: .85, d: 80, trill: 1 },
    // a pause with a peep (Hz), or with nothing
    s: { gap: 70, peep: 5200 }, 'š': { gap: 70, peep: 3500 }, f: { gap: 60 }, h: { gap: 45 },
    // cut short: the silence before the next syllable pops
    p: { stop: 1 }, t: { stop: 1 }, k: { stop: 1 }, 'ķ': { stop: 1 }, b: { stop: 1, soft: 1 }, d: { stop: 1, soft: 1 }, g: { stop: 1, soft: 1 }, 'ģ': { stop: 1, soft: 1 }
  };
  var LONG = { 'ā': 'a', 'ē': 'e', 'ī': 'i', 'ū': 'u', 'ō': 'o' };
  var SAME = { w: 'v', y: 'i', q: 'k', 'ŗ': 'r' };
  var TWO = { c: ['t', 's'], 'č': ['t', 'š'], x: ['k', 's'] };

  // the name's sounds, in order: [sound, how long it is held (1 = as written above)]
  function plan(name) {
    var word = String(name || '').toLowerCase().split(/[\s\-]+/)[0] || '', out = [];
    for (var i = 0; i < word.length; i++) {
      var ch = word[i], nx = word[i + 1];
      if (ch === 'd' && (nx === 'z' || nx === 'ž')) { out.push(['d', 1], [nx, .8]); i++; continue; }
      if (TWO[ch]) { out.push([TWO[ch][0], 1], [TWO[ch][1], .7]); continue; }
      if (LONG[ch]) { out.push([LONG[ch], 1.8]); continue; }
      ch = SAME[ch] || ch;
      if (!PH[ch]) continue;                                  // a digit, a dot: not a sound
      if (out.length && out[out.length - 1][0] === ch && !PH[ch].stop) { out[out.length - 1][1] += .5; continue; }   // "nn": one, held
      out.push([ch, 1]);
    }
    // two vowels side by side glide into each other (one squeak for both): each a little shorter
    for (var j = 0; j < out.length - 1; j++) if (PH[out[j][0]].vowel && PH[out[j + 1][0]].vowel) { out[j][1] *= .75; out[j + 1][1] *= .8; }
    return out.slice(0, 14);
  }

  var last = null;
  /* say(ac, name, { score: fatigue 0..100, seed: a number of the person's own }) -> its length in seconds
     (0 when there is nothing to say). ac: a running AudioContext (an OfflineAudioContext for the tests). */
  function say(ac, name, opt) {
    var seq = plan(name);
    if (!seq.length || !ac) return 0;
    opt = opt || {};
    var u = Math.max(0, Math.min(100, +opt.score || 0)) / 100;
    var own = 1 + (((+opt.seed || 0) % 9) - 4) * .02;                     // everyone's creature a shade of its own
    var k = (1 - .5 * u) * own * (opt.steady ? 1 : .97 + Math.random() * .06);   // the squeak's law: tired = lower
    var w = (1 + 1.6 * u) / T.speed, wc = (1 + (1 + 1.6 * u - 1) * .45) / T.speed;   // and slower: vowels stretch, the rest less
    var f0 = T.pitch * k;
    hush(ac);

    var t = ac.currentTime + (ac.state === 'running' ? .012 : .03), T0 = t;
    var saw = ac.createOscillator(), tri = ac.createOscillator(), lfo = ac.createOscillator(), lfoG = ac.createGain();
    var amp = ac.createGain(), bodyLP = ac.createBiquadFilter(), bodyG = ac.createGain(), pre = ac.createBiquadFilter();
    var peepO = ac.createOscillator(), peepG = ac.createGain(), out = ac.createGain();
    saw.type = 'sawtooth'; tri.type = 'triangle'; lfo.type = 'sine'; peepO.type = 'sine';
    lfo.frequency.value = T.wobbleHz; lfoG.gain.value = f0 * T.wobble;
    lfo.connect(lfoG); lfoG.connect(saw.frequency); lfoG.connect(tri.frequency);
    bodyLP.type = 'lowpass'; bodyLP.frequency.value = 2600; bodyG.gain.value = T.body;       // the squeak as it is (mk-side-faces.js)
    pre.type = 'lowpass'; pre.frequency.value = 4200; pre.Q.value = .5;                       // the edge off the coloured part
    amp.gain.value = 0; peepG.gain.value = 0; out.gain.value = T.vol;
    tri.connect(bodyLP); bodyLP.connect(bodyG); bodyG.connect(amp);
    saw.connect(pre);
    var F = [0, 1, 2].map(function (n) {
      var b = ac.createBiquadFilter(), g = ac.createGain();
      b.type = 'bandpass'; b.Q.value = T.sharp * [1, 1.25, 1.4][n]; g.gain.value = T.mouth * [1, .9, .4][n];
      pre.connect(b); b.connect(g); g.connect(amp);
      return b.frequency;
    });
    amp.connect(out); peepO.connect(peepG); peepG.connect(out); out.connect(ac.destination);

    var now = { a: 0 };
    function loud(value, at, ramp) { amp.gain.setValueAtTime(now.a, at); amp.gain.linearRampToValueAtTime(value, at + ramp); now.a = value; }
    function colour(f, at, ramp) { f.forEach(function (hz, n) { var p = F[n], v = hz * T.size; if (now['f' + n] == null) p.setValueAtTime(v, at); else { p.setValueAtTime(now['f' + n], at); p.linearRampToValueAtTime(v, at + ramp); } now['f' + n] = v; }); }
    function pitchAt(mult, at) { var hz = f0 * mult; saw.frequency.linearRampToValueAtTime(hz, at); tri.frequency.linearRampToValueAtTime(hz, at); }
    for (var a = 0; a < seq.length; a++) if (PH[seq[a][0]].f) { colour(PH[seq[a][0]].f, t, 0); break; }
    saw.frequency.setValueAtTime(f0, T0); tri.frequency.setValueAtTime(f0, T0);

    // which syllable a sound belongs to: a new squeak starts at each vowel that does not follow a vowel
    var total = seq.filter(function (s, i) { return PH[s[0]].vowel && !(i && PH[seq[i - 1][0]].vowel); }).length, syl = 0, pop = false;
    seq.forEach(function (item, i) {
      var p = PH[item[0]], hold = item[1], prev = i ? PH[seq[i - 1][0]] : null, next = seq[i + 1] && PH[seq[i + 1][0]];
      if (p.stop) {
        // the squeak is cut; the syllable after it starts at once, from higher up
        var shut = (i ? (p.soft ? .034 : .048) : .004) * wc * hold;
        loud(0, t, .018); t += shut; pop = !p.soft || !i;
        if (!next) t += .02;
        return;
      }
      if (p.gap) {
        // at the end of the name (most names end in -s) the squeak fades out instead of being cut, and the peep
        // is lower, softer and longer: the user heard the first one as a chop with a hiss
        var g = p.gap / 1000 * wc * hold, final = !next;
        loud(0, t, final ? .05 : .022);
        if (p.peep && T.peep) {
          // one small peep, falling: not a hiss
          var hz = p.peep * (final ? .68 : 1), at = t + (final ? .03 : Math.min(.02, g * .3)), len = final ? .09 : Math.min(.05, g * .65);
          peepO.frequency.setValueAtTime(hz * 1.1, at); peepO.frequency.exponentialRampToValueAtTime(hz * .8, at + len);
          peepG.gain.setValueAtTime(0, at); peepG.gain.linearRampToValueAtTime(T.peep * (final ? .6 : 1), at + (final ? .02 : .01));
          peepG.gain.exponentialRampToValueAtTime(.0004, at + len); peepG.gain.linearRampToValueAtTime(0, at + len + .01);
        }
        t += final ? (p.peep && T.peep ? Math.max(g, .13) : .06) : g;
        return;
      }
      var d = p.d / 1000 * hold * (p.vowel ? w : wc), ramp = Math.min(.045 * Math.sqrt(w), d * .55);
      if (!next && p.vowel) d *= 1.2;
      colour(p.f, t, ramp);
      if (p.vowel) {
        var glide = prev && prev.vowel;                         // the second half of "ei": the same squeak goes on
        if (!glide) {
          // one squeak: up fast, back down; the first syllable highest (Latvian stresses it), each next a step
          // lower; the more tired, the further the steps sink; a fresh one's last squeak ends upward
          var step = total > 1 ? syl / (total - 1) : 0, lvl = 1.06 - step * (.14 + .12 * u), jump = T.chirp * (pop ? 1.35 : 1) * (opt.steady ? 1 : .85 + Math.random() * .3);
          var span = d; for (var q = i + 1; q < seq.length && PH[seq[q][0]].vowel; q++) span += PH[seq[q][0]].d / 1000 * seq[q][1] * w;
          pitchAt(lvl * (pop ? 1 + jump * .5 : 1 - jump * .25), t);
          pitchAt(lvl * (1 + jump), t + Math.min(.05 * Math.sqrt(w), span * .32));
          pitchAt(lvl * (syl === total - 1 && u < .35 && total > 1 ? 1 + jump * .35 : 1 - jump * .3), t + span);
          syl++; pop = false;
        }
        loud(1, t, glide ? .01 : .008);
      } else if (p.trill) {
        // the tongue taps: the squeak flutters
        var taps = hold > 1.2 ? 3 : 2, beat = d / taps;
        for (var n = 0; n < taps; n++) { loud(.1, t + n * beat, beat * .28); loud(p.av, t + n * beat + beat * .45, beat * .3); }
      } else loud(p.av, t, .014);
      t += d;
    });
    loud(0, t, .045);
    var end = t + .06;
    [saw, tri, lfo, peepO].forEach(function (o) { o.start(T0); o.stop(end); });
    last = { out: out, oscs: [saw, tri, lfo, peepO], ac: ac };
    saw.onended = function () { try { out.disconnect(); } catch (_) {} if (last && last.out === out) last = null; };
    return end - ac.currentTime;
  }
  // a new press while it still speaks: the old word stops short, without a click
  function hush(ac) {
    if (!last || last.ac !== ac) return;
    try {
      var at = ac.currentTime;
      last.out.gain.cancelScheduledValues(at); last.out.gain.setValueAtTime(last.out.gain.value, at); last.out.gain.linearRampToValueAtTime(0, at + .02);
      last.oscs.forEach(function (o) { o.stop(at + .03); });
    } catch (_) {}
    last = null;
  }
  window.MinkaSayName = { say: say, plan: plan, tune: function (v) { if (v) for (var key in v) if (key in T && isFinite(v[key])) T[key] = +v[key]; return JSON.parse(JSON.stringify(T)); } };
})();
