/* The "GTA" tab of the station list (js/radio.js renderStationPickerList): the chosen game's stations on a wheel
   and the games in a row under it (the search row is hidden there: the wheel needs the height). A slot is an ordinary [data-station-index] button, so the list's own click handler
   plays it through the radio like any other station. Audio and logos live on the home server, never in this repo.
   Nothing here runs between interactions: the wheel is laid out on render and on a resize, moves are CSS transitions. */
(function () {
  const CSS = `
#stationOverlay#stationOverlay#stationOverlay .station-picker-list[data-mode="gta"]{display:block!important;overflow:hidden!important;padding-top:10px!important;padding-bottom:14px!important}
#stationOverlay#stationOverlay#stationOverlay[data-station-view="gta"] .station-picker-head{display:none!important}
#stationOverlay#stationOverlay#stationOverlay[data-station-view="gta"]{grid-template-rows:auto minmax(0,1fr)!important}
.gta{display:grid;grid-template-rows:minmax(0,1fr) 46px;gap:8px;height:100%;min-height:0}
.gta-games{grid-row:2;display:grid;grid-template-columns:repeat(12,minmax(0,88px));justify-content:center;gap:6px;min-height:0}
.gta-games button{display:grid;place-items:center;min-height:0;padding:5px 10px;border:0;border-radius:var(--rmx-tile-r,16px);background:var(--st-1,#15181d);color:#e9edf2;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s,box-shadow .15s}
.gta-games button:hover{background:var(--st-2,#1f242c)}
.gta-games button[aria-selected="true"]{background:var(--rmx-on,#2a3038)}
.gta-games img{max-width:100%;max-height:100%;min-height:0;object-fit:contain;pointer-events:none}
.gta-ring{grid-row:1;position:relative;min-width:0;min-height:0;animation:gta-in .22s cubic-bezier(.2,0,0,1)}
@keyframes gta-in{from{opacity:0;scale:.94}}
.gta-slot{position:absolute;left:50%;top:50%;width:var(--gta-slot,52px);height:var(--gta-slot,52px);margin:calc(var(--gta-slot,52px)/-2) 0 0 calc(var(--gta-slot,52px)/-2);padding:0;border:0;border-radius:50%;background:var(--st-2,#1c2027);color:var(--rmx-sub,#c9d0d9);display:grid;place-items:center;cursor:pointer;
  transition:translate .32s cubic-bezier(.2,0,0,1),scale .12s cubic-bezier(.22,.61,.36,1)}
.gta-slot img{width:72%;height:72%;object-fit:contain;pointer-events:none;opacity:.8;transition:opacity .12s}
.gta-slot svg{width:40%;height:40%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.gta-slot:is(:hover,:focus-visible){scale:min(1.08,var(--gta-grow,1.08));background:color-mix(in srgb,var(--rmx-ink,#fff) 18%,transparent);z-index:1}
/* The white ring is a layer of its own: the list's focus styles reset a button's box-shadow and draw an accent outline.
   One ring at a time: it follows the pointer, and rests on the playing station when nothing else is aimed at. */
.gta-slot::after{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 3px #fff;opacity:0;pointer-events:none}
.gta-slot:is(:hover,:focus-visible,.is-current)::after{opacity:1}
.gta-aim .gta-slot.is-current:not(:hover)::after{opacity:0}
#stationOverlay#stationOverlay#stationOverlay .gta-slot:is(:focus,:focus-visible){outline:0!important}
.gta-slot:is(:hover,:focus-visible,.is-current) img{opacity:1}
.gta-slot.is-current{scale:var(--gta-grow,1.14);background:color-mix(in srgb,var(--gta-c,#8a9099) 40%,transparent);z-index:2}
.gta-mid{position:absolute;left:50%;top:50%;translate:-50% -50%;width:var(--gta-mid,160px);text-align:center;pointer-events:none}
.gta-mid strong{display:block;font-size:clamp(15px,calc(var(--gta-mid,160px)/11),22px);font-weight:700;line-height:1.2;color:var(--rmx-ink,#f2f4f7);text-wrap:balance}
.gta-mid small{display:block;margin-top:4px;font-size:clamp(12px,calc(var(--gta-mid,160px)/17),14px);font-weight:500;line-height:1.2;color:var(--rmx-sub,rgba(255,255,255,.62))}
@media (prefers-reduced-motion:reduce){.gta-ring{animation:none}.gta-slot{transition:none}}`;
  const esc = text => String(text).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
  let games = [], base = '', game = localStorage.getItem('mk_gta_game') || 'vc', indexOf = new Map(), playing = () => -1;

  // Always a circle as tall as the room, the slots as big as fit round it: n slots of one size touch on a circle
  // of the room's height when 2π((H - grown·size)/2 - 3) = n(size + gap).
  function layout(ring) {
    const slots = [...ring.querySelectorAll('.gta-slot')], n = slots.length, H = Math.min(ring.clientWidth, ring.clientHeight);
    if (!n || H < 80) return;
    const grown = 1.14, gap = n > 14 ? 4 : 12;   // grown: the playing slot's most scale, kept inside the room
    const size = Math.max(20, Math.min(92, (Math.PI * (H - 6) - n * gap) / (n + grown * Math.PI))), r = (H - size * grown) / 2 - 3;
    slots.forEach((slot, i) => {
      const t = -Math.PI / 2 + i / n * 2 * Math.PI;   // from 12 o'clock, clockwise
      slot.style.translate = (r * Math.cos(t)).toFixed(1) + 'px ' + (r * Math.sin(t)).toFixed(1) + 'px';
    });
    ring.style.setProperty('--gta-slot', size.toFixed(1) + 'px');
    // The playing or pointed-at slot grows only into its own gap: it never covers a neighbour.
    ring.style.setProperty('--gta-grow', Math.min(grown, (size + gap) / size).toFixed(3));
    ring.style.setProperty('--gta-mid', Math.max(90, 2 * r - size * 1.4).toFixed(0) + 'px');
  }

  // The middle names the slot under the pointer, else the station on air, else the game.
  function mid(list, slot) {
    const root = list && list.querySelector('.gta'), now = games.find(g => g.id === game);
    if (!root || !now) return;
    const el = slot || root.querySelector('.gta-slot.is-current');
    root.querySelector('.gta-ring').classList.toggle('gta-aim', !!slot && !slot.classList.contains('is-current'));
    root.querySelector('.gta-mid strong').textContent = el ? el.dataset.name : now.title.replace('Grand Theft Auto: ', '');
    root.querySelector('.gta-mid small').textContent = el && !el.dataset.gtaOff ? now.short : el ? '' : now.stations.length + ' stacijas';
  }

  function ringHTML(current) {
    const now = games.find(g => g.id === game) || games[0];
    game = now.id;
    return `<div class="gta-ring"><button type="button" class="gta-slot" data-gta-off="1" data-name="Izslēgt" aria-label="Izslēgt radio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v8M7.5 6.8a7 7 0 1 0 9 0"/></svg></button>${
      now.stations.map(([id, name, , tint]) => {   // tint: the logo's own colour (data/wheel-stations.json), shown when it plays
        const index = indexOf.get('gta:' + now.id + '/' + id), on = index === current;
        return `<button type="button" class="gta-slot${on ? ' is-current' : ''}" data-station-index="${index}" style="--gta-c:#${/^[0-9a-f]{6}$/.test(tint) ? tint : '8a9099'}" data-name="${esc(name)}" aria-label="Atskaņot ${esc(name)}" aria-current="${on}"><img src="${esc(base + now.id + '/' + id)}.webp" alt="" decoding="async"></button>`;
      }).join('')}<div class="gta-mid" aria-live="polite"><strong></strong><small></small></div></div>`;
  }

  function show(list) {
    const root = list.querySelector('.gta');
    root.querySelector('.gta-ring')?.remove();
    root.insertAdjacentHTML('beforeend', ringHTML(playing()));
    root.querySelectorAll('[data-gta-game]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.gtaGame === game)));
    layout(root.querySelector('.gta-ring'));
    mid(list);
  }

  // current: a function returning the playing station's index in stations.
  function render(list, allGames, baseUrl, stations, current) {
    if (!document.getElementById('gtaWheelCss')) document.head.insertAdjacentHTML('beforeend', '<style id="gtaWheelCss">' + CSS + '</style>');
    games = allGames; base = baseUrl; playing = current;
    indexOf = new Map(stations.flatMap((station, index) => station && station.gta ? [[station.catalogKey, index]] : []));
    const onAir = stations[current()];
    if (onAir && onAir.gta) game = onAir.gta.game;   // open on the game that is playing
    list.innerHTML = `<div class="gta"><div class="gta-games" role="tablist" aria-label="Spēle">${games.map(g =>
      `<button type="button" role="tab" data-gta-game="${esc(g.id)}" title="${esc(g.title)}"><img src="${esc(base + g.id)}/game.webp" alt="${esc(g.short)}" decoding="async"></button>`).join('')}</div></div>`;
    show(list);
    if (list._gtaBound) return;
    list._gtaBound = true;
    list.addEventListener('click', event => {
      const pick = event.target.closest('[data-gta-game]');
      if (pick && pick.dataset.gtaGame !== game) {
        game = pick.dataset.gtaGame;
        try { localStorage.setItem('mk_gta_game', game); } catch (_) {}
        show(list);
      } else if (event.target.closest('[data-gta-off]') && !document.querySelector('#playBtn .fa-play')) document.getElementById('playBtn').click();
    });
    list.addEventListener('pointerover', event => { const slot = event.target.closest('.gta-slot'); if (slot) mid(list, slot); });
    list.addEventListener('pointerout', event => { if (event.target.closest('.gta-slot')) mid(list); });
    new ResizeObserver(() => { const ring = list.querySelector('.gta-ring'); if (ring) layout(ring); }).observe(list);
  }

  window.rgGta = { render, mid };
})();
