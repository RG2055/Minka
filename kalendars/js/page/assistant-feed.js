/* v34 single recurring assistant loop ï¿½ news + weather + namedays + moon (offline calc) */
(function(){
  'use strict';
  const isMobileShell = document.documentElement.classList.contains('mk-mobile-shell');
  const getNamedayDB = () => (window.LATVIAN_NAMEDAYS && typeof window.LATVIAN_NAMEDAYS === 'object' ? window.LATVIAN_NAMEDAYS : {});
  const input = document.getElementById('minkaBarInput');
  const aiPanel = document.getElementById('minkaAiPanel');
  const RSS = 'https://api.rss2json.com/v1/api.json';
  const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather?q=Riga&appid=e91db7aba1dd5745f52eb99e7cc38e8e&units=metric';
  // LSM's current public integration is still RSS. Use the broad news feed
  // plus the staff-relevant health feed; the former Rīga feed is currently
  // valid but empty, so polling it only added a request without any headlines.
  const FEEDS = [
    { label:'Ziņas', url:'https://www.lsm.lv/rss/?lang=lv&catid=14' },
    { label:'Veselība', url:'https://www.lsm.lv/rss/?lang=lv&catid=51' }
  ];
  const NEWS_STORAGE_KEY = 'minka_lsm_news_v2';
  const NEWS_STORAGE_MAX_AGE = 12 * 60 * 60 * 1000;
  const DESCMAP = {
    'clear sky':'skaidrs',
    'few clouds':'daži mākoņi',
    'scattered clouds':'mainīgi mākoņains',
    'broken clouds':'mākoņains',
    'overcast clouds':'apmācies',
    'light rain':'viegls lietus',
    'moderate rain':'lietus',
    'heavy intensity rain':'stiprs lietus',
    'rain':'lietus',
    'thunderstorm':'pērkona negaiss',
    'snow':'sniegs',
    'light snow':'viegls sniegs',
    'mist':'migla',
    'fog':'bieza migla',
    'drizzle':'smidzina',
    'sleet':'slapjš sniegs'
  };

  let newsCache = loadStoredNews();
  window.__minkaNewsCache = newsCache.slice();
  let newsIdx = 0;
  let seen = [];
  let tickTimer = 0;
  let cycle = 0;
  let slotIndex = 0;
  let lastNamedaySig = '';
  let lastNewsSig = '';
  let lastWeatherSig = '';
  let lastNamedayCycle = -999;
  let lastWeatherCycle = -999;
  let lastTop5Cycle = -999;
  let lastBolusCycle = -999;
  let newsBusy = false;
  let weatherBusy = false;
  let weatherCache = null;

  function loadStoredNews(){
    try {
      const saved = JSON.parse(localStorage.getItem(NEWS_STORAGE_KEY) || 'null');
      if (!saved || !Array.isArray(saved.items) || !saved.savedAt) return [];
      if ((Date.now() - Number(saved.savedAt)) > NEWS_STORAGE_MAX_AGE) return [];
      return saved.items.filter(it => it && typeof it.text === 'string' && it.text.length > 8).slice(0, 12);
    } catch (_e) {
      return [];
    }
  }
  function storeNews(items){
    try {
      localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), items: items.slice(0, 12) }));
    } catch (_e) {}
  }
  function newsIdentity(item){
    const link = String(item && item.link || '').trim();
    if (link) {
      try {
        const url = new URL(link);
        ['utm_source','utm_campaign','utm_medium'].forEach(key => url.searchParams.delete(key));
        return url.origin + url.pathname + url.search;
      } catch (_e) {}
    }
    return String(item && item.text || '').trim().toLowerCase();
  }
  async function fetchJsonWithTimeout(url, timeoutMs){
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : 0;
    try {
      const response = await fetch(url, { cache:'no-store', signal: controller ? controller.signal : undefined });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  if (isMobileShell) {
    try {
      const chip = document.getElementById('minkaNamedayChip');
      if (chip) chip.style.display = 'none';
      if (aiPanel) {
        aiPanel.classList.remove('open', 'news-clickable');
        aiPanel.style.cursor = '';
        aiPanel.onclick = null;
        aiPanel.title = '';
      }
    } catch(_e) {}
    return;
  }

function getTauriInvoke(){
  try {
    return window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function'
      ? window.__TAURI__.core.invoke
      : null;
  } catch (_e) {
    return null;
  }
}


  function clean(list){
  return (Array.isArray(list) ? list : []).map(v => String(v || '').trim()).filter(v => v && v !== '–' && v !== '-');
  }
  function pad2(v){ return String(v).padStart(2, '0'); }
  function resolveSelectedDateState(){
    let st = null;
    try { if (typeof window.__minkaGetSelectedDayState === 'function') st = window.__minkaGetSelectedDayState(); } catch (_e) {}
    let ds = st && st.activeDateStr ? String(st.activeDateStr) : '';
    if (!ds && window.__activeDateStr) ds = String(window.__activeDateStr);
    if (!ds) {
      try {
        const cal = window.__minkaCalendarState && typeof window.__minkaCalendarState.getSelectedDayState === 'function'
          ? window.__minkaCalendarState.getSelectedDayState() : null;
        if (cal && cal.activeDateStr) {
          ds = String(cal.activeDateStr);
          st = st || cal;
        }
      } catch (_e) {}
    }
    return {
      dateStr: ds,
      isToday: !!(st && st.isToday),
      state: st
    };
  }
  function getSelectedDate(){
    const sel = resolveSelectedDateState();
    const ds = String(sel.dateStr || '');
    const m = ds.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) {
      const dd = pad2(+m[1]);
      const mm = pad2(+m[2]);
      const norm = dd + '.' + mm + '.' + m[3];
      const today = new Date();
      const todayStr = pad2(today.getDate()) + '.' + pad2(today.getMonth()+1) + '.' + today.getFullYear();
      return { day:+m[1], month:+m[2], year:+m[3], dateStr: norm, isToday: norm === todayStr || !!sel.isToday };
    }
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth()+1, year: now.getFullYear(), dateStr: pad2(now.getDate()) + '.' + pad2(now.getMonth()+1) + '.' + now.getFullYear(), isToday: true };
  }
  function keyFromState(){
    const d = getSelectedDate();
    return { key: pad2(d.month) + '-' + pad2(d.day), isToday: d.isToday, dateStr: d.dateStr };
  }
  function buildNameday(){
    const info = keyFromState();
    const names = clean(getNamedayDB()[info.key] || []);
    if (!names.length) {
      try { const chip = document.getElementById('minkaNamedayChip'); if (chip) chip.style.display='none'; } catch(e){}
      return null;
    }
  const text = (info.isToday ? 'Šodien vārdadienu svin ' : 'Šajā dienā vārdadienu svin ') + (names.length > 1 ? names.slice(0,-1).join(', ') + ' un ' + names[names.length-1] : names[0]) + '.';
    // Nameday chip suppressed — nameday now shown in #mkNamedayBar inside the main bar
    return { text, sig: (info.dateStr || info.key || 'today') + '|' + text };
  }
  window.isUiNavigationBusy = window.isUiNavigationBusy || function(){
    return Number(window.__minkaUiBusyUntil || 0) > Date.now();
  };
  function isLowPerformance(){
    return document.documentElement.getAttribute('data-performance') === 'low' ||
      document.documentElement.classList.contains('mk-low-spec') ||
      document.documentElement.classList.contains('mk-no-anim');
  }
  function isIdle(){
    const typing = !!(input && String(input.textContent || '').trim());
    const open = !!(aiPanel && aiPanel.classList.contains('open'));
    return !isLowPerformance() && !document.hidden && !typing && !open && !(window.isUiNavigationBusy && window.isUiNavigationBusy());
  }
  function queue(text, mode, link){
    if (!text || typeof window.__minkaQueueMessage !== 'function' || !isIdle()) return false;
    window.__minkaQueueMessage(text, mode || 'info', link || '');
    return true;
  }

  function normalizeDesc(raw){
    const s = String(raw || '').toLowerCase().trim();
  return DESCMAP[s] || s || 'laikapstākļi nav zināmi';
  }
  function moonPhaseInfo(year, month, day){
    const c = Math.floor;
    let y = year, m = month;
    if (m < 3) { y -= 1; m += 12; }
    m += 1;
    const jd = 365.25 * y + 30.6 * m + day - 694039.09;
    const phase = ((jd / 29.5305882) % 1 + 1) % 1;
    let index = c(phase * 8 + 0.5) & 7;
    const names = [
    'jauns mēness',
    'augošs sirpis',
      'pirmais ceturksnis',
    'augošs mēness',
    'pilnmēness',
    'dilstošs mēness',
    'pēdējais ceturksnis',
    'dilstošs sirpis'
    ];
  const icons = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
    // Illumination % from phase angle
    const illum = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
    const dayOfCycle = Math.round(phase * 29.53);
    return { name: names[index], icon: icons[index], index, illum, dayOfCycle, sig: `${year}-${pad2(month)}-${pad2(day)}|${index}` };
  }
  function currentMoon(){
    const d = getSelectedDate();
    return moonPhaseInfo(d.year, d.month, d.day);
  }
  window.currentMoon = currentMoon;
  window.addEventListener('daySelected', function(){
    if (typeof syncMoon === 'function') syncMoon();
    // Refresh moon chip when day changes
    if (typeof window.mkBarRefresh === 'function') window.mkBarRefresh();
  });

  async function refreshWeather(){
    if (weatherBusy) return;
    weatherBusy = true;
    try {
      const r = await fetch(WEATHER_URL, { cache:'no-store' });
      const w = await r.json();
      const condition = w && w.weather && w.weather[0] || {};
      const raw = String(condition.description || '').toLowerCase();
      const temp = Math.round(Number(w && w.main && w.main.temp || 0));
      const feels = Math.round(Number(w && w.main && w.main.feels_like || temp));
      const wind = Math.round(Number(w && w.wind && w.wind.speed || 0) * 10) / 10;
      weatherCache = {
        desc: normalizeDesc(raw),
        temp,
        feels,
        wind,
        conditionId: Number(condition.id) || 0,
        main: String(condition.main || ''),
        rawDesc: raw,
        icon: String(condition.icon || ''),
        sig: [normalizeDesc(raw), temp, feels, wind].join('|')
      };
      // Feed bar chip + rebuild ticker so weather item appears
      window.__mkBarWeatherData = { t: weatherCache.temp, desc: weatherCache.desc, wind: weatherCache.wind, conditionId:weatherCache.conditionId, main:weatherCache.main, rawDesc:weatherCache.rawDesc, icon:weatherCache.icon };
      if (typeof window.mkBarRefresh === 'function') window.mkBarRefresh();
      // Rebuild ticker with updated weather prepended (pass current newsCache)
      if (typeof window.mkTickerFeed === 'function') window.mkTickerFeed(newsCache);
    } catch(_e) {}
    weatherBusy = false;
  }
  function buildWeatherMessage(){
    const moon = currentMoon();
    if (weatherCache && weatherCache.desc) {
      const text = `Rīgā ${weatherCache.desc} ${weatherCache.temp}°C sajūta ${weatherCache.feels}°C vējš ${weatherCache.wind} m/s ${moon.icon} ${moon.name.toLowerCase()} (${moon.illum}%).`;
      return { text, sig: `${weatherCache.sig}|${moon.sig}` };
    }
    return { text: `${moon.icon} Mēness fāze: ${moon.name}.`, sig: `moon|${moon.sig}` };
  }


async function refreshNews(){
  if (newsBusy) return;
  newsBusy = true;
  try {
    const invoke = getTauriInvoke();
    if (invoke) {
      const items = await invoke('fetch_news', { feeds: FEEDS });
      newsCache = (Array.isArray(items) ? items : [])
        .map(it => ({
          sig: String(it && it.sig || '').trim(),
          link: String(it && it.link || '').trim(),
          pub: Number(it && it.pub || 0) || 0,
          text: String(it && it.text || '').trim()
        }))
        .filter(it => it.text && it.text.length > 8);
      newsIdx = 0;
      if (!newsCache.length) console.warn('[Minka] Tauri news cache empty');
      window.__minkaNewsCache = newsCache.slice();
      if (typeof window.mkTickerFeed === 'function') window.mkTickerFeed(newsCache);
      newsBusy = false;
      return;
    }

    const chunks = await Promise.all(FEEDS.map(async (feed) => {
      try {
        const d = await fetchJsonWithTimeout(RSS + '?rss_url=' + encodeURIComponent(feed.url), 9000);
        const ok = !d || !('status' in d) || d.status === 'ok';
        if (!ok) {
          console.warn('[Minka] RSS fetch failed for', feed.label, d && d.message ? d.message : d);
          return [];
        }
        const items = Array.isArray(d && d.items) ? d.items : [];
        return items.slice(0, 6).map(it => ({
          sig: String(feed.label + '|' + (it && it.link || '') + '|' + (it && it.title || '')).trim(),
          link: String(it && it.link || '').trim(),
          pub: Date.parse(String(it && it.pubDate || '')) || 0,
          text: feed.label + ': ' + String(it && it.title || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        })).filter(it => it.text && it.text.length > 8);
      } catch(e) {
        console.warn('[Minka] RSS network error for', feed.label, e);
        return [];
      }
    }));
    const identities = new Set();
    const fresh = chunks.flat()
      .sort((a,b) => (b.pub || 0) - (a.pub || 0))
      .filter(item => {
        const key = newsIdentity(item);
        if (!key || identities.has(key)) return false;
        identities.add(key);
        return true;
      })
      .slice(0, 12);
    if (fresh.length) {
      newsCache = fresh;
      newsIdx = 0;
      storeNews(newsCache);
      window.__minkaNewsCache = newsCache.slice();
    }
    else {
      console.warn('[Minka] News fetch returned no items — keeping stale cache');
    }
    // Feed bar ticker
    if (typeof window.mkTickerFeed === 'function') window.mkTickerFeed(newsCache);
  } catch(e) {
    console.warn('[Minka] refreshNews failed', e);
  }
  newsBusy = false;
}

function nextNews(){

    if (!newsCache.length) {
      if (!newsBusy) refreshNews();
      return null;
    }
    for (let i = 0; i < newsCache.length; i++) {
      const item = newsCache[(newsIdx + i) % newsCache.length];
      if (!item || !item.text) continue;
      newsIdx = (newsIdx + i + 1) % newsCache.length;
      if (item.sig === lastNewsSig) continue;
      if (seen.includes(item.sig)) continue;
      seen.push(item.sig);
      if (seen.length > 24) seen = seen.slice(-24);
      lastNewsSig = item.sig;
      return item;
    }
    const fallback = newsCache[(newsIdx++) % newsCache.length];
    if (fallback && fallback.text) {
      lastNewsSig = fallback.sig || '';
      return fallback;
    }
    return null;
  }

  function schedule(ms){
    clearTimeout(tickTimer);
    tickTimer = setTimeout(tick, ms);
  }

  function queueNews(){
    const news = nextNews();
    if (news && queue(news.text, 'news', news.link)) return true;
    return false;
  }
  function queueWeather(weather, forceRepeat){
    if (!weather) return false;
    const allow = forceRepeat || weather.sig !== lastWeatherSig || (cycle - lastWeatherCycle) >= 4;
    if (!allow) return false;
    if (queue(weather.text, 'weather')) {
      lastWeatherSig = weather.sig;
      lastWeatherCycle = cycle;
      return true;
    }
    return false;
  }
  function queueNameday(nameday, forceRepeat){
    if (!nameday) return false;
    const allow = forceRepeat || nameday.sig !== lastNamedaySig || (cycle - lastNamedayCycle) >= 8;
    if (!allow) return false;
    if (queue(nameday.text, 'info')) {
      lastNamedaySig = nameday.sig;
      lastNamedayCycle = cycle;
      return true;
    }
    return false;
  }

  function queueTop5() {
    if ((cycle - lastTop5Cycle) < 6) return false;
    try {
      const allW = window.MinkaLevels && typeof window.MinkaLevels.buildAllTimeStats === 'function' ? window.MinkaLevels.buildAllTimeStats() : {};
      const top5 = Object.values(allW).filter(function(w){ return !w.isRad && w.xp > 0; }).sort(function(a,b){ return b.xp - a.xp; }).slice(0,5);
      if (!top5.length) return false;
      const medals = ['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49','4)','5)'];
      const parts = top5.map(function(w,i) {
        const lvl = w.levelData && w.levelData.current ? w.levelData.current.lvl : '?';
        const col = (w.levelData && w.levelData.current && w.levelData.current.color) || '#a78bfa';
        const safeName = tickerEsc(String(w.name || '').split(' ')[0]);
        const safeCol = /^#[0-9a-f]{3,8}$/i.test(String(col)) ? col : '#a78bfa';
        const safeXp = Math.max(0, Math.round(Number(w.xp) || 0));
        const safeLvl = tickerEsc(String(lvl));
        return medals[i] + ' <b>' + safeName + '</b> <span style="color:' + safeCol + ';font-weight:700;">Lv.' + safeLvl + '</span> <span style="color:#4ade80;font-weight:700;">' + safeXp + ' XP</span>';
      });
      const html = '<span style="font-weight:800;opacity:.7">LĪDERI:</span> ' + parts.join(' &nbsp; ');
      if (queue(html, 'top')) { lastTop5Cycle = cycle; return true; }
    } catch(_e) {}
    return false;
  }

  function queueBolus() {
    if (window.MINKA_APP === 'rad') return false;   // Bolus is the radiographers' only
    if ((cycle - lastBolusCycle) < 10) return false;
    const html = 'Samaini <span style="color:#ff3b30;font-weight:800;">bolusu</span>, atzīmē — saņem <span style="color:#4ade80;font-weight:700;">20 XP</span>! 💉';
    if (queue(html, 'bolus')) { lastBolusCycle = cycle; return true; }
    return false;
  }

  function tick(){
    cycle++;
    if (!isIdle()) return schedule(5000);

    // Every 5th cycle show top5, every 9th show bolus
    if (cycle % 5 === 0 && queueTop5()) return schedule(17000);
    if (cycle % 9 === 0 && queueBolus()) return schedule(17000);

    const nameday = buildNameday();
    const weather = buildWeatherMessage();
    const order = [
      ['news', 'weather', 'nameday'],
      ['weather', 'news', 'nameday'],
      ['nameday', 'news', 'weather']
    ][slotIndex % 3];

    for (const slot of order) {
      let spoken = false;
      if (slot === 'news') spoken = queueNews();
      else if (slot === 'weather') spoken = queueWeather(weather, slotIndex % 3 === 1);
      else if (slot === 'nameday') spoken = queueNameday(nameday, slotIndex % 3 === 2);
      if (spoken) {
        slotIndex = (slotIndex + 1) % 3;
        return schedule(17000);
      }
    }

    if (!newsCache.length && !newsBusy) refreshNews();
    if (!weatherCache && !weatherBusy) refreshWeather();
    schedule(9000);
  }

  function announceSelectedDay(prefer){
    const nameday = buildNameday();
    const weather = buildWeatherMessage();

    if (prefer === 'nameday') {
      if (queueNameday(nameday, true)) {
        slotIndex = 0;
        return schedule(17000);
      }
      if (queueWeather(weather, true)) {
        slotIndex = 0;
        return schedule(17000);
      }
      return;
    }

    if (queueWeather(weather, true)) {
      slotIndex = 0;
      return schedule(17000);
    }
    if (queueNameday(nameday, true)) {
      slotIndex = 0;
      return schedule(17000);
    }
  }

  let dataLoopStarted = false;
  function startDataLoop(){
    if (dataLoopStarted) return;
    dataLoopStarted = true;
    // Paint the last successful LSM result immediately, then refresh it.
    if (newsCache.length && typeof window.mkTickerFeed === 'function') window.mkTickerFeed(newsCache);
    setTimeout(refreshNews, 600);
    setTimeout(refreshWeather, 900);
    setTimeout(() => { announceSelectedDay('weather'); }, 1500);
    schedule(11000);
    // While the app is hidden a poll is only marked as due; it runs the moment
    // the app is visible again, so nobody sees data older than the interval.
    let newsDue = false, weatherDue = false;
    setInterval(() => { if (document.hidden) newsDue = true; else refreshNews(); }, 8 * 60 * 1000);
    setInterval(() => { if (document.hidden) weatherDue = true; else refreshWeather(); }, 20 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (newsDue) { newsDue = false; refreshNews(); }
      if (weatherDue) { weatherDue = false; refreshWeather(); }
    });
  }
  // This block can be restored by the service worker after the load event has
  // already fired. Ready-state handling keeps the data loop reliable in both
  // a normal tab and an installed PWA.
  if (document.readyState === 'complete') startDataLoop();
  else window.addEventListener('load', startDataLoop, { once:true });

  let _namedayTimer = null;
  function forceSelectedDayNameday(e){
    lastNamedaySig = '';
    lastNamedayCycle = -999;
    if (_namedayTimer) { clearTimeout(_namedayTimer); _namedayTimer = null; }

    const capturedDate = String((e && e.detail && e.detail.date) ? e.detail.date : (window.__activeDateStr || '')).trim();

    _namedayTimer = setTimeout(function() {
      _namedayTimer = null;
      if (!capturedDate) return;

      const m = capturedDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!m) {
        announceSelectedDay('nameday');
        return;
      }

      const ds = pad2(+m[1]) + '.' + pad2(+m[2]) + '.' + m[3];
      const key = pad2(+m[2]) + '-' + pad2(+m[1]);
      const db = getNamedayDB();
      const names = clean(db[key] || []);
      if (!names.length) return;

      const now = new Date();
      const todayStr = pad2(now.getDate()) + '.' + pad2(now.getMonth()+1) + '.' + now.getFullYear();
      const isToday = ds === todayStr;
  const text = (isToday ? 'Šodien vārdadienu svin ' : 'Šajā dienā vārdadienu svin ') + (names.length > 1 ? names.slice(0,-1).join(', ') + ' un ' + names[names.length-1] : names[0]) + '.';
      const sig = ds + '|' + text;

      lastNamedaySig = sig;
      lastNamedayCycle = cycle;

      if (typeof window.__minkaShowPriorityMessage === 'function') {
        window.__minkaShowPriorityMessage(text, 'info', '', { clearModes: ['info'], durationMs: 9000 });
      } else if (typeof window.__minkaQueueMessage === 'function') {
        if (typeof window.__minkaClearQueuedMessages === 'function') window.__minkaClearQueuedMessages('info');
        window.__minkaQueueMessage(text, 'info', '');
      }
    }, 720);

    setTimeout(() => { schedule(9000); }, 1200);
  }

  window.addEventListener('daySelected', forceSelectedDayNameday);
  // Note: click on .day-btn triggers g_selectDay ï¿½  daySelected event ï¿½  forceSelectedDayNameday
  // No need for separate click handler which would fire without correct event.detail
})();

/* ── Bar info chips + news carousel ── */
(function() {
  function pad2(n) { return String(n).padStart(2,'0'); }

  /* Fade-swap a chip's text */
  function chipSet(el, text) {
    if (!el || el.textContent === text) return;
    el.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(5px)';
    setTimeout(function() {
      el.textContent = text;
      el.style.opacity = '';
      el.style.transform = '';
    }, 200);
  }

  function compactNameday(names) {
    var list = (names || []).map(function(n){ return String(n || '').trim(); }).filter(Boolean);
    if (!list.length) return '';
    var regular = [];
    var hasSpecial = false;
    list.forEach(function(n) {
      if (/neparasto|neierakst/i.test(n)) hasSpecial = true;
      else regular.push(n);
    });
    var out = regular.join(', ');
    if (hasSpecial) out += (out ? ' + ' : '') + 'neierakstītie vārdi';
    return out || 'neierakstītie vārdi';
  }

  /* Moon + weather refresh */
  window.mkBarRefresh = function() {
    var moon = (typeof window.currentMoon === 'function') ? window.currentMoon() : null;
    var moonChip = document.getElementById('mkMoonChip');
    if (window.MinkaHeaderWeather && typeof window.MinkaHeaderWeather.renderMoon === 'function') {
      window.MinkaHeaderWeather.renderMoon(moonChip, moon);
    } else {
      chipSet(moonChip, moon ? moon.icon + ' ' + moon.illum + '%' : '');
    }
    var wd = window.__mkBarWeatherData;
    var tempChip = document.getElementById('mkTempChip');
    if (window.MinkaHeaderWeather && typeof window.MinkaHeaderWeather.renderTemperature === 'function') {
      window.MinkaHeaderWeather.renderTemperature(tempChip, wd);
    } else {
      chipSet(tempChip, wd ? wd.t + '°C' : '');
    }
  };

  /* ── Svinamās / atceres / pasaules dienas (data/svinamas-dienas.js) ──
     Saraksts ir kurēts ar roku; katrs ieraksts nes savu datuma likumu, tāpēc
     te nav ne API, ne gada failu — tikai izvērsums pa gadiem kešā. */
  var _svinamasCache = {};
  var SVINAMA_ORDER = { sv: 0, lv: 1, at: 2, med: 3, folk: 4, world: 5, fun: 6 };
  function svRank(k) { return Object.prototype.hasOwnProperty.call(SVINAMA_ORDER, k) ? SVINAMA_ORDER[k] : 9; }
  function svEaster(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }
  function svResolve(e, y) {
    var d;
    if (typeof e.easter === 'number') { d = svEaster(y); d.setDate(d.getDate() + e.easter); return d; }
    if (typeof e.doy === 'number') return new Date(y, 0, e.doy);
    var m = e.m - 1;
    if (typeof e.wd === 'number' && typeof e.before === 'number') {
      d = new Date(y, m, e.before - 1);
      d.setDate(d.getDate() - ((d.getDay() - e.wd + 7) % 7));
      return d;
    }
    if (typeof e.wd === 'number') {
      if (e.n > 0) {
        d = new Date(y, m, 1);
        return new Date(y, m, 1 + ((e.wd - d.getDay() + 7) % 7) + (e.n - 1) * 7);
      }
      d = new Date(y, m + 1, 0);
      d.setDate(d.getDate() - ((d.getDay() - e.wd + 7) % 7));
      return d;
    }
    if (e.d === -1) return new Date(y, m + 1, 0);
    return new Date(y, m, e.d);
  }
  function svYearMap(y) {
    if (_svinamasCache[y]) return _svinamasCache[y];
    var db = window.MK_SVINAMAS_DIENAS;
    var map = {};
    var list = db && Array.isArray(db.days) ? db.days : [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i], d;
      try { d = svResolve(e, y); } catch (_err) { continue; }
      if (!d || isNaN(d)) continue;
      var key = pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1);
      (map[key] = map[key] || []).push(e);
    }
    Object.keys(map).forEach(function(k) {
      map[k].sort(function(x, z) { return svRank(x.k) - svRank(z.k); });
    });
    return (_svinamasCache[y] = map);
  }
  /* Visas dienas datumam DD.MM.YYYY, sakārtotas: svētku → atzīmējamā → atceres → medicīna → gadskārtu → pasaules → jautrā */
  window.mkSvinamasDienas = function(dateStr) {
    var m = String(dateStr || '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!m) return [];
    return svYearMap(+m[3])[pad2(+m[1]) + '.' + pad2(+m[2])] || [];
  };
  function svEsc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* Dienas birka. Ja datumam ir vairāki ieraksti, tie mainās pamīšus ik pēc
     7 s (bez "+N" birkas — tā neko nepasaka). Pilnais saraksts paliek tooltipā. */
  var _svRotTimer = 0, _svRotList = [], _svRotIdx = 0, _svRotKey = '';
  function svRenderOne(chip, e) {
    var html = '<span class="mk-svinama-emoji" aria-hidden="true">' + svEsc(e.e) + '</span>'
             + '<span class="mk-svinama-text">' + svEsc(e.s || e.t) + '</span>';
    chip.setAttribute('data-kind', e.k);
    if (chip.innerHTML !== html) {
      if (!chip.hidden && chip.firstChild) {
        chip.classList.add('is-swapping');
        setTimeout(function() { chip.innerHTML = html; chip.classList.remove('is-swapping'); }, 180);
      } else {
        chip.innerHTML = html;
      }
    }
  }
  window.mkBarSvinama = function(dateStr) {
    var chip = document.getElementById('mkDayChip');
    if (!chip) return;
    var list = window.mkSvinamasDienas(dateStr);
    var key = String(dateStr || '');
    if (!list.length) {
      clearInterval(_svRotTimer); _svRotTimer = 0; _svRotList = []; _svRotKey = '';
      chip.hidden = true; chip.innerHTML = ''; chip.removeAttribute('title');
      return;
    }
    chip.title = list.map(function(e) { return e.e + ' ' + e.t; }).join('\n');
    if (key !== _svRotKey) {
      _svRotKey = key; _svRotList = list; _svRotIdx = 0;
      clearInterval(_svRotTimer); _svRotTimer = 0;
      svRenderOne(chip, list[0]);
      if (list.length > 1) {
        _svRotTimer = setInterval(function() {
          if (document.hidden) return;
          _svRotIdx = (_svRotIdx + 1) % _svRotList.length;
          svRenderOne(chip, _svRotList[_svRotIdx]);
        }, 7000);
      }
    }
    chip.hidden = false;
  };

  /* Nameday for a date string DD.MM.YYYY */
  window.mkBarNameday = function(dateStr) {
    try { window.mkBarSvinama(dateStr); } catch (_svErr) {}
    var chip = document.getElementById('mkNamedayBar');
    if (!chip) return;
    var db = window.LATVIAN_NAMEDAYS;
    if (!db || !dateStr) { chip.hidden = true; return; }
    var m = String(dateStr).match(/^(\d{1,2})\.(\d{1,2})/);
    if (!m) { chip.hidden = true; return; }
    var key = pad2(+m[2]) + '-' + pad2(+m[1]);
    var names = (db[key] || []).filter(function(n) {
      return n && n.trim() && n !== '–' && n !== '-';
    });
    if (!names.length) { chip.hidden = true; return; }
    /* Compact text for the header; full value stays in the tooltip. */
    var text = compactNameday(names);
    chip.title = names.join(', ');
    if (chip.hidden) {
      chip.hidden = false;
      chip.style.opacity = '0'; chip.style.transform = 'translateY(5px)';
      chip.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
      setTimeout(function() { chip.textContent = text; chip.style.opacity = ''; chip.style.transform = ''; }, 60);
    } else if (chip.textContent !== text) {
      chipSet(chip, text);
    }
  };

  /* ── Calm rotating news headline ── */
  /* Category → CSS class map */
  var CAT_CLASS = {
    'ziņas':'zinas','zinas':'zinas',
    'latvija':'latvija','rīga':'riga','riga':'riga',
    'veselība':'veseliba','veseliba':'veseliba',
    'sports':'sports','hokejs':'hokejs',
    'politika':'politika','kultūra':'kultura','kultura':'kultura',
    'ekonomika':'ekonomika','bizness':'ekonomika',
    'laiks':'laiks','laiks':'laiks'
  };
  function catClass(cat) {
    return 'mk-cat-' + (CAT_CLASS[String(cat||'').toLowerCase()] || 'default');
  }
	  function fmtPub(ts) {
	    if (!ts) return '';
	    var d = new Date(ts);
	    if (isNaN(d)) return '';
	    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
	  }
	  function tickerEsc(value) {
	    return String(value == null ? '' : value)
	      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	  }
	  function safeTickerUrl(value) {
	    var raw = String(value == null ? '' : value).trim();
	    if (!raw) return '';
	    try {
	      var parsed = new URL(raw, window.location.href);
	      return /^(?:https?):$/.test(parsed.protocol) ? parsed.href : '';
	    } catch (_e) { return ''; }
	  }
	  function renderTickerItem(d) {
	    var href = safeTickerUrl(d.link);
	    var label = String(d.cat ? d.cat + ': ' : '') + String(d.text || '');
	    var tag = href ? 'a' : 'span';
	    var open = '<' + tag + ' class="mk-news-item" title="' + tickerEsc(label) + '"'
	      + (href ? ' href="' + tickerEsc(href) + '" target="_blank" rel="noopener noreferrer" data-href="' + tickerEsc(href) + '"' : '') + '>';
	    var time = d.time ? '<span class="mk-tick-time">' + tickerEsc(d.time) + '</span>' : '';
	    var badge = d.cat ? '<span class="mk-ticker-cat ' + catClass(d.cat) + '">' + tickerEsc(d.cat) + '</span>' : '';
	    var meta = (time || badge) ? '<span class="mk-news-meta">' + time + badge + '</span>' : '';
	    var text = '<span class="mk-news-headline">' + tickerEsc(d.text) + '</span>';
	    return open + meta + text + '</' + tag + '>';
	  }

  /* Static fallback shown until live data arrives */
  var FALLBACK_ITEMS = [
    { cat: 'Latvija', text: 'Ielādē jaunākās ziņas no LSM…', link: '', time: '' },
    { cat: 'Laiks',   text: 'Iegūst laika apstākļus Rīgai…', link: '', time: '' },
    { cat: 'Sports',  text: 'Sporta jaunumi tiek ielādēti…', link: '', time: '' },
  ];

  window.mkTickerFeed = function(newsItems) {
    var track = document.getElementById('mkTickerTrack');
    if (!track) return;

    var items = [];

    /* Weather item first */
    var wd = window.__mkBarWeatherData;
    if (wd && wd.desc && wd.t !== undefined) {
      var moon = (typeof window.currentMoon === 'function') ? window.currentMoon() : null;
      var wText = 'Rīgā ' + wd.desc + ' ' + wd.t + '°C'
        + (wd.wind ? ' vējš ' + wd.wind + ' m/s' : '')
        + (moon ? ' ' + moon.icon + ' ' + moon.name : '');
      items.push({ cat: 'Laiks', text: wText, link: '', time: '' });
    } else {
      items.push({ cat: 'Laiks', text: 'Iegūst aktuālos laikapstākļus Rīgā…', link: '', time: '' });
    }

    /* News items from v34 cache — format: "Category: headline" */
    (newsItems || []).forEach(function(d) {
      var raw = String(d.text || '');
      var colon = raw.indexOf(': ');
      var cat = colon > 0 ? raw.slice(0, colon) : '';
      var headline = colon > 0 ? raw.slice(colon + 2) : raw;
      headline = headline.replace(/^[•●◦\s\-–]+/, '').trim();
      if (headline) items.push({ cat: cat, text: headline, link: d.link || '', time: fmtPub(d.pub) });
    });

    /* If nothing loaded yet, keep fallback visible */
    if (!items.length) items = FALLBACK_ITEMS;

    /* The whole static headline is a comfortable click target. */
    if (!track._mkEvt) {
      track._mkEvt = true;
      track.addEventListener('click', function(e) {
        var item = e.target.closest('.mk-news-item');
        if (!item || !track.contains(item)) return;
        if (item.tagName === 'A' && item.getAttribute('href')) return;
        var href = safeTickerUrl(item.getAttribute('data-href'));
        if (href) openExternalLink(href);
      });
      track.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var item = e.target.closest('.mk-news-item');
        if (!item || !track.contains(item)) return;
        if (item.tagName === 'A' && item.getAttribute('href')) return;
        var href = safeTickerUrl(item.getAttribute('data-href'));
        if (!href) return;
        e.preventDefault();
        openExternalLink(href);
      });
      track.addEventListener('mouseenter', function() { track._mkHeld = true; }, { passive:true });
      track.addEventListener('mouseleave', function() { track._mkHeld = false; }, { passive:true });
      track.addEventListener('focusin', function() { track._mkHeld = true; });
      track.addEventListener('focusout', function() { track._mkHeld = false; });
    }

    /* One calm presentation for every device: only one headline exists in the
       DOM. It stays readable for 18 seconds, fades out, is replaced, and fades
       back in. There is no marquee, wide promoted layer or animation loop. */
    var newsFirst = items.filter(function(item) { return item.cat !== 'Laiks'; });
    var weatherItems = items.filter(function(item) { return item.cat === 'Laiks'; });
    /* Keep current Riga weather regular in the calm rotation: after every
       two headlines. This also works when a refreshed list preserves a later
       active headline instead of restarting from index zero. */
    var nextItems = [];
    newsFirst.forEach(function(item, index) {
      nextItems.push(item);
      if (weatherItems.length && (index + 1) % 2 === 0) {
        nextItems = nextItems.concat(weatherItems);
      }
    });
    if (weatherItems.length && (newsFirst.length < 2 || newsFirst.length % 2 !== 0)) {
      nextItems = nextItems.concat(weatherItems);
    }
    var currentKey = track._mkActiveKey || '';
    var currentIndex = nextItems.findIndex(function(item) {
      return [item.cat, item.text, item.link].join('|') === currentKey;
    });
    track._mkItems = nextItems;
    track._mkIndex = currentIndex >= 0 ? currentIndex : Math.min(Number(track._mkIndex) || 0, Math.max(0, nextItems.length - 1));
    track.style.transform = 'none';

    track._mkPaint = function() {
      var list = track._mkItems || [];
      if (!list.length) {
        track._mkActiveKey = '';
        track.innerHTML = '';
        return;
      }
      track._mkIndex = (Number(track._mkIndex) || 0) % list.length;
      var active = list[track._mkIndex];
      track._mkActiveKey = [active.cat, active.text, active.link].join('|');
      track.innerHTML = renderTickerItem(active);
    };

    track._mkSchedule = function(delay) {
      clearTimeout(track._mkSwapTimer);
      track._mkSwapTimer = setTimeout(function swapHeadline() {
        var bar = document.getElementById('minkaBar');
        var searchOpen = !!(bar && (bar.classList.contains('focused') || bar.classList.contains('has-text') || bar.classList.contains('search-open')));
        var userReading = track._mkHeld
          || (track.matches && track.matches(':hover'))
          || track.contains(document.activeElement);
        if (document.hidden || userReading || searchOpen) {
          track._mkSchedule(1200);
          return;
        }
        track.classList.add('is-changing');
        clearTimeout(track._mkFadeTimer);
        track._mkFadeTimer = setTimeout(function() {
          var list = track._mkItems || [];
          if (list.length) track._mkIndex = ((Number(track._mkIndex) || 0) + 1) % list.length;
          track._mkPaint();
          requestAnimationFrame(function() { track.classList.remove('is-changing'); });
          track._mkSchedule(18000);
        }, 320);
      }, Math.max(600, Number(delay) || 18000));
    };

    track._mkPaint();
    track._mkSchedule(18000);

  };

  /* Seed ticker immediately so it's never blank on load */
  window.mkTickerFeed(Array.isArray(window.__minkaNewsCache) ? window.__minkaNewsCache : []);

  /* Events */
  window.addEventListener('daySelected', function(e) {
    window.mkBarRefresh();
    var date = e && e.detail && e.detail.date ? e.detail.date : (window.__activeDateStr || '');
    window.mkBarNameday(date);
  });
  document.addEventListener('minka:storeReady', function() {
    setTimeout(window.mkBarRefresh, 300);
    window.mkBarNameday(window.__g_todayStr || '');
  });
  /* Fallback: try after 2s regardless */
	  setTimeout(function() {
	    window.mkBarRefresh();
	    var ds = window.__activeDateStr || window.__g_todayStr || '';
	    window.mkBarNameday(ds);
	    window.mkTickerFeed(Array.isArray(window.__minkaNewsCache) ? window.__minkaNewsCache : []);
	  }, 2000);
	  setTimeout(function() {
	    window.mkBarRefresh();
	    window.mkBarNameday(window.__activeDateStr || window.__g_todayStr || '');
	    window.mkTickerFeed(Array.isArray(window.__minkaNewsCache) ? window.__minkaNewsCache : []);
	  }, 4500);
	})();
