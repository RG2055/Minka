(function () {
  'use strict';
  /* Klases, kurās stāv DARBINIEKA emoji. Izvēlnes režģis te apzināti nav —
     tur emoji ir simti, un animēt tos, kad pele slīd pāri, būtu tieši tā
     nepārtrauktā slodze, no kuras izvairāmies. */
  /* `mk-side-wm` te apzināti NAV: tā ir kartītes fona ūdenszīme, absolūti
     pozicionēta un ar nolūku blāva. Kad tā bija sarakstā, tā dabūja gan
     statisko kadru, gan `position: relative`, ielēca plūsmā un pastūma tekstu —
     kartītes apakšā parādījās milzīgs kaķis. */
  var HOVER_ON = ['mk-emoji-side', 'mk-mid-person-emoji', 'mk-mid-meta-emoji-fly', 'mk-emoji-badge'];
  /* Kartītēm virsū ir savs slānis, tāpēc pele emoji elementu neaizsniedz —
     notikuma mērķis vienmēr ir tas virsslānis. Tāpēc meklējam arī kartīti un
     paņemam emoji no tās iekšienes; blakus efekts ir labs — animācija sākas,
     uzejot jebkur uz kartītes. */
  var CARDS = ['mk-side-card', 'duty-block', 'mk-mid-card', 'swc-card'];
  /* Animāciju joslas nāk no tā paša domēna, kur appa. Vietne dzīvo uz GitHub
     Pages, tāpēc iekomitētie faili JAU ir GitHub — atsevišķs CDN te neko nedod,
     tikai pieliek svešu atkarību, ko darba tīkls var bloķēt. Vienāda izcelsme
     turklāt nozīmē, ka service worker tos kešo parastajā ceļā un tie strādā
     bezsaistē. */
  var BASE = 'assets/emoji-anim/';
  var manifest = null, loading = false, playing = null, nudging = null, activeText = '';

  /* Kartītes pārzīmējas reizi sekundē (pulkstenis), un tad animētais elements
     tiek izmests un uzlikts no jauna. Animācija sāktos no nulles katru sekundi,
     tāpēc 1,9 s apgrieziens nekad nepaspētu pabeigties — uz ekrāna izskatījās,
     ka nekas nenotiek. Tāpēc atceramies, kad kustība sākās, un jaunajam
     elementam uzliekam negatīvu animation-delay: tas turpina no tās pašas
     vietas, kur vecais palika. */
  var motionStart = {}, MOTION_KEEP_MS = 4000;
  function motionDelay(key, durMs) {
    var now = Date.now();
    var t0 = motionStart[key];
    if (!t0 || now - t0 > durMs + MOTION_KEEP_MS) { motionStart[key] = now; return 0; }
    return -((now - t0) % durMs);
  }

  function loadManifest() {
    if (manifest || loading) return;
    loading = true;
    /* Versija URL beigās ar nolūku: manifests ir DATU fails, un service worker
       to kešo kā jebkuru citu resursu. Bez versijas pārlūks paņēma jauno kodu,
       bet veco sarakstu — un visi tikko pievienotie emoji izskatījās tā, it kā
       animācijas tiem nebūtu (apgriezās, nevis spēlēja savu animāciju).

       Marķieris te ir burtisks, nevis `window.__minkaLocalBuild`: tas tiek
       uzstādīts krietni tālāk failā nekā šis skripts, tāpēc te tas vēl būtu
       tukšs. Bumpo to kopā ar pārējiem. */
    fetch(BASE + 'manifest.json?v=20260824perfaudit3')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) { manifest = m || { emoji: {} }; applyStatics(); })
      .catch(function () { manifest = { emoji: {} }; });
  }

  function targetOf(node) {
    while (node && node.nodeType === 1) {
      if (node.classList) {
        for (var i = 0; i < HOVER_ON.length; i++) {
          if (node.classList.contains(HOVER_ON[i])) return node;
        }
        for (var j = 0; j < CARDS.length; j++) {
          if (node.classList.contains(CARDS[j])) {
            /* Vidus kartītē animējam tieši apakšējās joslas emoji — tas ir tas
               pats mezgls, kas uz hover aizlido uz stundas cipara vietu. */
            var inner = node.classList.contains('mk-mid-card')
              ? (node.querySelector('.mk-mid-meta-emoji:not(.is-initials) .mk-mid-meta-emoji-fly')
                || node.querySelector('.' + HOVER_ON.join(', .')))
              : node.querySelector('.' + HOVER_ON.join(', .'));
            if (inner) return inner;
          }
        }
      }
      node = node.parentNode;
    }
    return null;
  }

  /* Vai Fluent fonts šo emoji tiešām uzzīmēja. Saliktas secības (🐈‍⬛ = kaķis +
     savienotājs + melns kvadrāts) sadalīts fonts salīmēt nevar, ja daļas nokļuvušas
     dažādos gabalos, un tad klusi atkāpjas uz sistēmas emoji. Pazīme ir platums:
     Fluent glifam tas atšķiras no sistēmas glifa. Mērām vienu reizi uz emoji. */
  /* Kuriem emoji fonts nepalīdz.

     Vienīgais gadījums ir saliktas secības: 🐈‍⬛ ir kaķis + savienotājs U+200D +
     melns kvadrāts. Fonts ir sadalīts unicode-range gabalos, secības daļas
     nokļūst dažādos gabalos, un pārlūks ligatūru salikt nevar — tāpēc klusi
     atkāpjas uz sistēmas emoji.

     Sākotnēji es to noteicu, mērot glifa platumu, un tas bija nepareizi: mērījums
     atkarīgs no tā, vai fonta gabals TAJĀ brīdī jau ir ielādēts, tāpēc statiskās
     bildes tika uzliktas arī 🦖, 😈, 🚑 — visiem, un vienā skatā tas nozīmētu ap
     megabaitu lieku lejupielādes. Pazīme ir nosakāma tieši, bez mērīšanas. */
  function needsStatic(text) {
    if (text.indexOf('\u200D') >= 0) return true;
    /* Noto emoji: Fluent fontā tie ir citā stilā, tāpēc, ja mierā rādītu fontu,
       bet uzejot Noto, sanāktu redzams krāsas lēciens. Rādām Noto abos. */
    var i = manifest && manifest.emoji && manifest.emoji[text];
    return !!(i && i.noto);
  }

  function makeBox(el, info) {
    var fs = parseFloat(getComputedStyle(el).fontSize) || 24;
    /* Kaste ir centrēta un absolūta, tāpēc drīkst mazliet pārkarāties pāri
       elementa robežām — griežot to līdz elementa kastei, zīmējums iznāktu
       manāmi mazāks par glifu, ko tas aizstāj. */
    var side = Math.round(fs * 1.18);
    var box = document.createElement('span');
    box.className = 'mk-emoji-film-box';
    box.style.width = side + 'px';
    box.style.height = side + 'px';
    /* Kaste sākumā ir neredzama, un glifs paliek. Ja glifu paslēptu uzreiz,
       starp tā pazušanu un bildes pirmo uzzīmēšanu paliktu viens tukšs kadrs —
       tas ir tas mirkļa uzplaiksnījums, ko redz uzejot. */
    box.style.visibility = 'hidden';

    var film = document.createElement('img');
    film.className = 'mk-emoji-film';
    film.alt = '';

    var reveal = function () {
      if (!el.isConnected || box.parentNode !== el) return;
      /* Kadru skaits tiek ņemts no paša attēla, nevis no manifesta: ja kešā ir
         vecāka josla ar citu kadru skaitu, steps() nesakristu ar joslas garumu un
         animācija vienmērīgi slīdētu, nevis pārslēgtos pa kadriem. */
      var n = film.naturalWidth ? Math.max(1, Math.round(film.naturalHeight / film.naturalWidth)) : info.frames;
      el.style.setProperty('--mk-anim-frames', n);
      /* Glifs un bilde nomainās vienā un tajā pašā kadrā. */
      el.style.setProperty('color', 'transparent', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      box.style.visibility = '';
    };

    /* `position` tiek aiztikts TIKAI tad, ja elements ir statisks. Ja tas jau ir
       absolūts vai fiksēts, `relative` to ievilktu plūsmā un izjauktu kartītes
       izkārtojumu. */
    if (getComputedStyle(el).position === 'static') {
      el.style.setProperty('position', 'relative', 'important');
    }
    el.style.setProperty('--mk-anim-dur', info.ms + 'ms');
    el.style.setProperty('--mk-anim-frames', info.frames);
    box.appendChild(film);
    el.appendChild(box);

    /* Avots tiek uzstādīts un atklāšana pārbaudīta TIKAI PĒC tam, kad kaste jau
       ir kokā. Iepriekš tas notika pirms tam, tāpēc reveal() savā pārbaudē
       `box.parentNode !== el` izgāja tukšā, un kešotai bildei nekas nenostrādāja —
       glifs palika redzams vēl vienu kadru. Tas arī bija tas palēciens,
       pārslēdzot dienu. */
    film.src = BASE + info.file;
    if (film.complete && film.naturalWidth) reveal();
    else if (film.decode) film.decode().then(reveal, reveal);
    else film.onload = reveal;
    return film;
  }

  /* Emoji, ko fonts nesalīmē, dabū statisku Fluent kadru arī miera stāvoklī —
     citādi kartītē sēž vecais sistēmas emoji, un uzejot tas pēkšņi nomainītos
     pret citu zīmējumu. */
  function ensureStatic(el) {
    if (!manifest || el.querySelector('.mk-emoji-film-box')) return;
    var text = (el.textContent || '').trim();
    if (!text || !needsStatic(text)) return;
    var info = manifest.emoji && manifest.emoji[text];
    if (info) makeBox(el, info);
  }

  function stop() {
    if (nudging) {
      var nb = nudging.querySelector('.mk-emoji-nudge-box');
      /* Atdodam tekstu atpakaļ vecākam tieši tādu, kāds tas bija. */
      if (nb) { var t = nb.textContent; nb.remove(); nudging.textContent = t; }
      nudging.style.removeProperty('position');
      nudging = null;
    }
    if (!playing) return;
    var film = playing.querySelector('.mk-emoji-film');
    if (film) film.classList.remove('is-playing');
    var text = (playing.textContent || '').trim();
    /* Statiskais kadrs paliek; parastajam emoji ligzdu noņemam pavisam. */
    if (!needsStatic(text)) {
      var box = playing.querySelector('.mk-emoji-film-box');
      if (box) box.remove();
      ['position', 'color', '-webkit-text-fill-color', '--mk-anim-frames', '--mk-anim-dur']
        .forEach(function (k) { playing.style.removeProperty(k); });
    }
    playing = null;
    activeText = '';
  }

  function start(el) {
    /* `nudging` jāpārbauda tāpat kā `playing`. Bez tā: kustības elementa
       pievienošana ir DOM izmaiņa, novērotājs to pamana, redz, ka `playing` ir
       tukšs, un izsauc start() vēlreiz — tas noņem elementu un uzliek atpakaļ.
       Katrā kadrā. Animācija sākās no nulles un nekad neaizgāja tālāk par
       pirmo kadru, tāpēc uz ekrāna nekas nekustējās. */
    var text = (el.textContent || '').trim();
    /* Pārbaudām arī TEKSTU, ne tikai elementu: kartītes pārzīmēšana var atstāt
       to pašu mezglu, bet nomainīt tajā emoji. Ar pārbaudi tikai pēc elementa
       jaunais emoji paliktu bez animācijas. */
    if (!manifest) return;
    if ((el === playing || el === nudging) && text === activeText) return;
    var info = manifest.emoji && manifest.emoji[text];
    stop();
    activeText = text;
    if (!info) {
      /* Animācijas šim emoji nav nekur — dodam paša glifa kustību. */
      if (!text) return;
      var nb = document.createElement('span');
      nb.className = 'mk-emoji-nudge-box';
      nb.textContent = text;
      if (getComputedStyle(el).position === 'static') {
        el.style.setProperty('position', 'relative', 'important');
      }
      /* Teksts tiek PĀRVIETOTS bērnā, nevis dublēts. Pirmajā versijā bērns tika
         pielikts klāt, bet vecāka glifs palika — un kartītē bija divi vienādi
         emoji. Krāsas slēpšana te neder, jo krāsu fonta glifs pats nes savas
         krāsas. */
      nb.style.animationDelay = motionDelay('nudge:' + text, 1900) + 'ms';
      el.textContent = '';
      el.appendChild(nb);
      nudging = el;
      return;
    }
    var film = el.querySelector('.mk-emoji-film') || makeBox(el, info);
    film.style.animationDelay = motionDelay('film:' + text, info.ms || 3000) + 'ms';
    film.classList.add('is-playing');
    playing = el;
  }

  document.addEventListener('mouseover', function (e) {
    loadManifest();
    var el = targetOf(e.target);
    if (el) start(el); else stop();
  }, { passive: true });

  document.addEventListener('mouseout', function (e) {
    var active = playing || nudging;
    if (!active) return;
    if (targetOf(e.relatedTarget) !== active) stop();
  }, { passive: true });
  window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });

  /* Kartītes pārzīmējas reizi sekundē (pulkstenis), un tad animētais elements
     tiek izmests no DOM. Pele nekustas, tāpēc jauns mouseover nenotiek, un
     animācija pazustu līdz nākamajai kustībai. Tāpēc atceramies kursora vietu
     un pēc pārzīmēšanas paņemam to elementu, kas tagad ir zem tā.
     Pārbaude ir lēta: strādā tikai tad, kad kaut kas tiešām spēlēja un pazuda. */
  var lastX = -1, lastY = -1;
  document.addEventListener('mousemove', function (e) { lastX = e.clientX; lastY = e.clientY; },
                            { passive: true });

  var pending = false;
  var observer = new MutationObserver(function () {
    /* Sinhrona izsaukšana te bija kļūda: appa maina DOM nepārtraukti (pulkstenis
       tikšķ katru sekundi), un applyStatics pati pievieno mezglus, tāpēc lapa
       nokārās. Paliek rAF ar `pending` slēdzi — viena pārbaude uz kadru. */
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      applyStatics();
      if (playing && document.contains(playing)) return;
      if (nudging && document.contains(nudging)) return;
      playing = null;                       /* vecais mezgls ir atdalīts */
      if (lastX < 0) return;
      var el = targetOf(document.elementFromPoint(lastX, lastY));
      if (el) start(el);
    });
  });

  /* Dīkstāvē klusi ievelkam tikai to emoji, kas šobrīd ir ekrānā — tā pirmā
     uzejšana nesākas ar tukšu vietu un tīkla gaidīšanu. */
  /* Atkārtotas ieiešanas aizsargs. applyStatics pati pievieno mezglus, tos
     pamana MutationObserver un izsauc to vēlreiz — un, tā kā tagad tas notiek
     sinhroni, bez šī karoga sanāca bezgalīgs cikls, kas nokāra lapu. */
  var applying = false;
  function applyStatics() {
    if (applying || !manifest || !manifest.emoji) return;
    applying = true;
    try {
      document.querySelectorAll('.' + HOVER_ON.join(', .')).forEach(ensureStatic);
    } finally {
      applying = false;
    }
  }

  function prefetchVisible() {
    if (!manifest || !manifest.emoji) return;
    var seen = {}, n = 0;
    document.querySelectorAll('.' + HOVER_ON.join(', .')).forEach(function (el) {
      /* Bija 12, kas nozīmēja 1,2 MB dīkstāvē. Kopš glifs paliek redzams, līdz
         bilde ir atkodēta, priekšielāde vairs nav vajadzīga uzplaiksnījuma dēļ —
         tā tikai saīsina gaidīšanu pirmajai uzejšanai. Četri pietiek. */
      if (n >= 4) return;
      var t = (el.textContent || '').trim();
      if (!t || seen[t] || !manifest.emoji[t]) return;
      seen[t] = 1; n++;
      (new Image()).src = BASE + manifest.emoji[t].file;
    });
  }
  function idle(fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 4000 });
    else setTimeout(fn, 2500);
  }
  /* Manifests (mazs JSON) tiek prasīts uzreiz, nevis dīkstāvē: no tā ir atkarīgs,
     vai emoji, ko fonts nesalīmē, jau pirmajā mirklī parādās kā Fluent. Gaidot
     `load`+idle, tie brīdi mirgotu kā vecie sistēmas emoji.
     Pašas joslas (~80 KB) joprojām tiek vilktas tikai dīkstāvē. */
  loadManifest();

  /* Šis skripts atrodas <head>, tāpēc `document.body` vēl neeksistē. Agrāk
     observer.observe(document.body) te meta izņēmumu, un tas pārtrauca visu, kas
     rakstīts tālāk — arī periodisko pārbaudi. Tāpēc viss, kas prasa body, tiek
     palaists tikai tad, kad tas ir. */
  function boot() {
    observer.observe(document.body, { childList: true, subtree: true });
    /* Kartītes pārzīmējas reizi sekundē, un tad statiskie kadri pazūd līdz ar
       visu kartītes saturu. Novērotājs to ne vienmēr noķer — pārzīmēšana un
       novērotāja rāmis var sakrist tā, ka pārbaude notiek pirms jaunā satura.
       Šī pārbaude ir lēta (ap 12 elementu, mērījumi kešoti) un neatkarīga. */
    setInterval(function(){ if(!document.hidden) applyStatics(); }, 5000);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) applyStatics(); }, { passive:true });
    applyStatics();
    idle(prefetchVisible);
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
