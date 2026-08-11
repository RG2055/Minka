(function initMinkaHeaderWeather() {
  'use strict';

  var STATES = ['clear', 'partly-cloudy', 'cloudy', 'rain', 'heavy-rain', 'snow', 'sleet', 'hail', 'fog', 'thunderstorm'];
  var PERIODS = ['morning', 'day', 'sunset', 'night'];
  var PERIOD_LABELS = {
    morning: '🌅 Rīts',
    day: '☀️ Diena',
    sunset: '🌇 Krēsla',
    night: '🌙 Nakts'
  };
  var STATE_LABELS = {
    'clear': 'Skaidrs',
    'partly-cloudy': 'Daļēji mākoņains',
    'cloudy': 'Apmācies',
    'rain': 'Lietus',
    'heavy-rain': 'Stiprs lietus',
    'snow': 'Sniegs',
    'sleet': 'Slapjš sniegs',
    'hail': 'Krusa',
    'fog': 'Migla',
    'thunderstorm': 'Pērkona negaiss'
  };
  var MOON_ICONS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  var MOON_NAMES = ['Jauns mēness','Augošs sirpis','Pirmais ceturksnis','Augošs mēness','Pilnmēness','Dilstošs mēness','Pēdējais ceturksnis','Dilstošs sirpis'];
  var header = document.getElementById('minkaBarWrap');
  if (!header) return;

  var preview = '';
  var previewPeriod = '';
  var demoMode = false;
  var demoMoonIndex = -1;
  try {
    var ownParams = new URLSearchParams(location.search);
    var parentParams = window.parent !== window ? new URLSearchParams(window.parent.location.search) : null;
    var ownPreview = ownParams.get('weatherfx') || '';
    var parentPreview = parentParams ? parentParams.get('weatherfx') || '' : '';
    var requestedPreview = parentPreview || ownPreview;
    var requestedPeriod = (parentParams ? parentParams.get('weatherperiod') || '' : '') || ownParams.get('weatherperiod') || '';
    demoMode = requestedPreview === 'demo';
    if (demoMode) demoMoonIndex = 4;
    preview = STATES.indexOf(requestedPreview) >= 0 ? requestedPreview : '';
    previewPeriod = PERIODS.indexOf(requestedPeriod) >= 0 ? requestedPeriod : '';
  } catch (_e) {}

  var layer = document.createElement('div');
  layer.className = 'mk-weather-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.dataset.weatherState = 'off';
  layer.dataset.weatherPeriod = 'day';

  var atmosphere = document.createElement('div');
  atmosphere.className = 'mk-weather-atmosphere';
  for (var cloudIndex = 0; cloudIndex < 2; cloudIndex += 1) {
    var cloud = document.createElement('span');
    cloud.className = 'mk-weather-cloud';
    atmosphere.appendChild(cloud);
  }
  var moonNode = document.createElement('i');
  moonNode.className = 'mk-weather-moon';
  atmosphere.appendChild(moonNode);
  for (var fogIndex = 0; fogIndex < 2; fogIndex += 1) {
    var fog = document.createElement('span');
    fog.className = 'mk-weather-fog';
    atmosphere.appendChild(fog);
  }
  for (var glassIndex = 0; glassIndex < 2; glassIndex += 1) {
    var glass = document.createElement('span');
    glass.className = 'mk-weather-glass-drop';
    atmosphere.appendChild(glass);
  }

  var particles = document.createElement('div');
  particles.className = 'mk-weather-particles';
  for (var i = 0; i < 18; i += 1) {
    var particle = document.createElement('span');
    particle.className = 'mk-weather-particle';
    particle.style.setProperty('--particle-x', ((i * 37 + 7) % 97) + '%');
    particle.style.setProperty('--particle-delay', (-((i * 17) % 31) / 10).toFixed(1) + 's');
    particle.style.setProperty('--rain-width', (1.1 + (i % 3) * 0.35).toFixed(2) + 'px');
    particle.style.setProperty('--rain-size', (15 + (i % 5) * 2) + 'px');
    particle.style.setProperty('--heavy-rain-size', (20 + (i % 5) * 2) + 'px');
    particle.style.setProperty('--rain-opacity', (0.30 + (i % 4) * 0.06).toFixed(2));
    particle.style.setProperty('--heavy-rain-opacity', (0.40 + (i % 4) * 0.06).toFixed(2));
    particle.style.setProperty('--rain-drift', (1 + (i % 4) * 1.25).toFixed(2) + 'px');
    particle.style.setProperty('--rain-duration', (1.06 + (i % 6) * 0.10).toFixed(2) + 's');
    particle.style.setProperty('--heavy-rain-duration', (0.72 + (i % 5) * 0.07).toFixed(2) + 's');
    particle.style.setProperty('--snow-size', (1.6 + ((i * 7) % 5) * 0.72).toFixed(2) + 'px');
    particle.style.setProperty('--snow-opacity', (0.32 + (i % 5) * 0.10).toFixed(2));
    particle.style.setProperty('--snow-duration', (7.8 + (i % 7) * 0.78).toFixed(2) + 's');
    particle.style.setProperty('--snow-drift-a', (-7 + ((i * 5) % 15)) + 'px');
    particle.style.setProperty('--snow-drift-b', (-10 + ((i * 11) % 21)) + 'px');
    particle.style.setProperty('--snow-drift-c', (-6 + ((i * 13) % 13)) + 'px');
    var snowSpin = 120 + (i % 6) * 34;
    particle.style.setProperty('--snow-spin-a', Math.round(snowSpin * 0.28) + 'deg');
    particle.style.setProperty('--snow-spin-b', Math.round(snowSpin * 0.57) + 'deg');
    particle.style.setProperty('--snow-spin-c', Math.round(snowSpin * 0.80) + 'deg');
    particle.style.setProperty('--snow-spin', snowSpin + 'deg');
    particle.style.setProperty('--hail-size', (2.5 + ((i * 3) % 4) * 0.65).toFixed(2) + 'px');
    particle.style.setProperty('--hail-opacity', (0.54 + (i % 5) * 0.07).toFixed(2));
    particle.style.setProperty('--hail-duration', (1.28 + (i % 6) * 0.17).toFixed(2) + 's');
    var hailDrift = -6 + ((i * 7) % 15);
    var hailSpin = 150 + (i % 5) * 47;
    particle.style.setProperty('--hail-drift-a', (hailDrift * 0.38).toFixed(1) + 'px');
    particle.style.setProperty('--hail-drift-b', (hailDrift * 0.76).toFixed(1) + 'px');
    particle.style.setProperty('--hail-drift', hailDrift + 'px');
    particle.style.setProperty('--hail-spin-a', Math.round(hailSpin * 0.38) + 'deg');
    particle.style.setProperty('--hail-spin-b', Math.round(hailSpin * 0.76) + 'deg');
    particle.style.setProperty('--hail-spin', hailSpin + 'deg');
    particles.appendChild(particle);
  }

  layer.appendChild(atmosphere);
  layer.appendChild(particles);
  var scenicBackground = header.querySelector('.mk-header-scenic-bg');
  if (scenicBackground) scenicBackground.insertAdjacentElement('afterend', layer);
  else header.prepend(layer);

  function fallbackMoonIndex(date) {
    var lunarDays = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
    var phase = ((lunarDays / 29.5305882) % 1 + 1) % 1;
    return Math.floor(phase * 8 + 0.5) & 7;
  }

  function moonSvgByIndex(index) {
    var phaseByIndex = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
    var phase = phaseByIndex[index == null ? 4 : index];
    var cx = 32, cy = 32, radius = 18;
    var lit = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    var shadow = '';
    if (lit < 0.02) {
      shadow = '<circle cx="32" cy="32" r="18" fill="rgba(7,13,25,.96)"/>';
    } else if (lit < 0.98) {
      var shadowPhase = (0.5 - phase + 1) % 1;
      var waxing = shadowPhase < 0.5;
      var edge = Math.cos(2 * Math.PI * shadowPhase) * radius;
      var rx = Math.max(0.2, Math.abs(edge)).toFixed(2);
      var top = cy - radius, bottom = cy + radius;
      var path;
      if (waxing) {
        path = edge > 0
          ? 'M 32 ' + top + ' A 18 18 0 0 0 32 ' + bottom + ' A ' + rx + ' 18 0 0 1 32 ' + top + ' Z'
          : 'M 32 ' + top + ' A 18 18 0 0 0 32 ' + bottom + ' A ' + rx + ' 18 0 0 0 32 ' + top + ' Z';
      } else {
        path = edge > 0
          ? 'M 32 ' + top + ' A 18 18 0 0 1 32 ' + bottom + ' A ' + rx + ' 18 0 0 0 32 ' + top + ' Z'
          : 'M 32 ' + top + ' A 18 18 0 0 1 32 ' + bottom + ' A ' + rx + ' 18 0 0 1 32 ' + top + ' Z';
      }
      shadow = '<path d="' + path + '" fill="rgba(7,13,25,.96)"/>';
    }
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'
      + '<defs><radialGradient id="mkHeaderMoonSurface" cx="38%" cy="32%" r="68%">'
      + '<stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#dce8f5"/><stop offset="1" stop-color="#95acc4"/>'
      + '</radialGradient><clipPath id="mkHeaderMoonClip"><circle cx="32" cy="32" r="18"/></clipPath></defs>'
      + '<circle cx="32" cy="32" r="18" fill="url(#mkHeaderMoonSurface)"/>'
      + '<g clip-path="url(#mkHeaderMoonClip)" fill="#7f96ad" opacity=".20">'
      + '<circle cx="24" cy="24" r="3.2"/><circle cx="39" cy="29" r="2.3"/><circle cx="29" cy="41" r="2.1"/><circle cx="43" cy="39" r="1.4"/>'
      + '</g><g clip-path="url(#mkHeaderMoonClip)">' + shadow + '</g></svg>';
  }

  function syncMoonPhase() {
    var phaseInfo = null;
    if (demoMoonIndex >= 0) {
      phaseInfo = {
        index: demoMoonIndex,
        illum: demoMoonIndex === 0 ? 4 : [4,25,50,75,100,75,50,25][demoMoonIndex],
        name: MOON_NAMES[demoMoonIndex]
      };
    } else {
      try { phaseInfo = typeof window.currentMoon === 'function' ? window.currentMoon() : null; } catch (_e) {}
    }
    var index = phaseInfo && typeof phaseInfo.index === 'number' ? phaseInfo.index : fallbackMoonIndex(new Date());
    var illumination = phaseInfo && typeof phaseInfo.illum === 'number' ? phaseInfo.illum : (index === 0 ? 0 : 50);
    moonNode.innerHTML = moonSvgByIndex(index);
    moonNode.dataset.moonPhase = String(index);
    moonNode.dataset.moonIllumination = String(illumination);
    moonNode.classList.toggle('is-dark-phase', illumination < 4);
    moonNode.title = phaseInfo && phaseInfo.name ? phaseInfo.name : 'Mēness fāze';
  }
  syncMoonPhase();
  window.addEventListener('daySelected', syncMoonPhase, { passive: true });

  function syncHeight() {
    var height = Math.max(36, Math.round(layer.getBoundingClientRect().height || header.getBoundingClientRect().height || 60));
    layer.style.setProperty('--mk-weather-height', (height + 18) + 'px');
    layer.style.setProperty('--mk-weather-mid', Math.round((height + 18) * 0.45) + 'px');
  }
  syncHeight();
  if (typeof ResizeObserver === 'function') {
    var resizeObserver = new ResizeObserver(syncHeight);
    resizeObserver.observe(header);
  } else {
    window.addEventListener('resize', syncHeight, { passive: true });
  }

  function conditionState(weather) {
    weather = weather || {};
    var id = Number(weather.conditionId || weather.id || 0);
    var iconCode = String(weather.icon || '').toLowerCase();
    var text = [weather.main, weather.rawDesc, weather.desc, weather.description]
      .map(function(value) { return String(value || '').toLowerCase(); }).join(' ');

    if (/hail|krusa/.test(text)) return 'hail';
    if ((id >= 200 && id < 300) || iconCode.indexOf('11') === 0 || /thunder|lightning|pērkon|negaiss/.test(text)) return 'thunderstorm';
    if (id === 771 || id === 781 || /squall|tornado|vētr|virpuļviesul/.test(text)) return 'thunderstorm';
    if ([611, 612, 613, 615, 616].indexOf(id) >= 0 || /sleet|slapjš sniegs|rain and snow/.test(text)) return 'sleet';
    if ((id >= 600 && id < 700) || iconCode.indexOf('13') === 0 || /snow|snieg/.test(text)) return 'snow';
    if ([701, 711, 721, 731, 741, 751, 761, 762].indexOf(id) >= 0 || iconCode.indexOf('50') === 0 || /mist|fog|haze|smoke|dust|sand|ash|migla|dūmak/.test(text)) return 'fog';
    if ([302, 312, 314, 502, 503, 504, 511, 522, 531].indexOf(id) >= 0 || /heavy|extreme|ļoti stiprs|stiprs lietus/.test(text)) return 'heavy-rain';
    if ((id >= 300 && id < 600) || iconCode.indexOf('09') === 0 || iconCode.indexOf('10') === 0 || /rain|drizzle|lietus|smidz/.test(text)) return 'rain';
    if (id === 800 || iconCode.indexOf('01') === 0 || /clear|skaidrs/.test(text)) return 'clear';
    if (id === 801 || id === 802 || iconCode.indexOf('02') === 0 || /few clouds|scattered|daži mākoņi|mainīgi mākoņains/.test(text)) return 'partly-cloudy';
    if ((id >= 803 && id <= 804) || iconCode.indexOf('03') === 0 || iconCode.indexOf('04') === 0 || /cloud|mākoņ|apmācies/.test(text)) return 'cloudy';
    return 'partly-cloudy';
  }

  function conditionPeriod(weather) {
    var iconCode = String((weather && weather.icon) || '').toLowerCase();
    if (/n$/.test(iconCode)) return 'night';
    if (/d$/.test(iconCode)) return 'day';
    var hour = new Date().getHours();
    return hour >= 20 || hour < 7 ? 'night' : 'day';
  }

  function syncDemoScenic(period) {
    if (!demoMode) return;
    if (window.MinkaHeaderScenic && typeof window.MinkaHeaderScenic.setPreviewPeriod === 'function') {
      window.MinkaHeaderScenic.setPreviewPeriod(period);
    }
    var scenic = header.querySelector(':scope > .mk-header-scenic-bg') || header.querySelector('.mk-header-scenic-bg');
    var scenicImage = scenic && scenic.querySelector('.mk-header-scenic-img');
    var headerInner = document.getElementById('minkaBarInner');
    var next = PERIODS.indexOf(period) >= 0 ? period : 'day';
    var scenicAssets = {
      morning: { src: 'data/header-backgrounds/header-morning-20260701.jpg', position: '54% 46%' },
      day: { src: 'data/header-backgrounds/header-day-20260701.jpg', position: '56% 48%' },
      sunset: { src: 'data/header-backgrounds/header-sunset-20260701.jpg', position: '58% 48%' },
      night: { src: 'data/header-backgrounds/header-night-20260701.jpg', position: '58% 48%' }
    };
    var asset = scenicAssets[next];
    var src = asset.src;
    var position = asset.position;
    if (headerInner) headerInner.dataset.headerPeriod = next;
    document.documentElement.dataset.minkaHeaderPeriod = next;
    header.dataset.weatherDemoPeriod = next;
    if (!scenic || !scenicImage) return;
    scenic.classList.remove('is-loaded');
    scenicImage.style.objectPosition = position;
    scenicImage.onload = function() { scenic.classList.add('is-loaded'); };
    scenicImage.onerror = function() { scenic.classList.remove('is-loaded'); };
    if (scenicImage.getAttribute('src') === src && scenicImage.complete) scenic.classList.add('is-loaded');
    else scenicImage.src = src;
  }

  function setPeriod(period) {
    var next = PERIODS.indexOf(period) >= 0 ? period : 'day';
    layer.dataset.weatherPeriod = next === 'night' ? 'night' : 'day';
    header.dataset.weatherPeriod = next;
    syncDemoScenic(next);
    if (next === 'night') syncMoonPhase();
    var periodSelect = document.querySelector('[data-mk-weather-period-select]');
    if (periodSelect) periodSelect.value = next;
    var periodButton = document.querySelector('[data-mk-weather-period-toggle]');
    if (periodButton) {
      periodButton.textContent = next === 'night' ? '🌙' : '☀️';
      periodButton.setAttribute('aria-label', next === 'night' ? 'Parādīt dienas režīmu' : 'Parādīt nakts režīmu');
      periodButton.title = next === 'night' ? 'Nakts efekti — pārslēgt uz dienu' : 'Dienas efekti — pārslēgt uz nakti';
    }
    return next;
  }

  function setState(state) {
    var next = STATES.indexOf(state) >= 0 ? state : 'partly-cloudy';
    if (layer.dataset.weatherState !== next) layer.dataset.weatherState = next;
    var demoLabel = document.querySelector('[data-mk-weather-demo-label]');
    if (demoLabel) {
      if (demoLabel.tagName === 'SELECT') demoLabel.value = next;
      else demoLabel.textContent = STATE_LABELS[next] + '  ·  ' + (STATES.indexOf(next) + 1) + '/' + STATES.length;
    }
    return next;
  }

  function sync(weather) {
    if (demoMode) return layer.dataset.weatherState;
    setPeriod(previewPeriod || conditionPeriod(weather));
    return setState(preview || conditionState(weather));
  }

  function renderTemperature(chip, weather) {
    if (!chip) return;
    if (!weather || weather.t === undefined || weather.t === null || weather.t === '') {
      chip.replaceChildren();
      chip.classList.remove('mk-weather-temp');
      chip.removeAttribute('aria-label');
      return;
    }

    var icon = chip.querySelector('.mk-weather-temp-icon');
    var value = chip.querySelector('.mk-weather-temp-value');
    if (!icon || !value) {
      icon = document.createElement('img');
      icon.className = 'mk-weather-temp-icon';
      icon.src = 'data/meteocons/partly-cloudy-day.svg';
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      icon.decoding = 'async';
      value = document.createElement('span');
      value.className = 'mk-weather-temp-value';
      chip.replaceChildren(icon, value);
    }
    value.textContent = weather.t + '°C';
    chip.classList.add('mk-weather-temp');
    chip.setAttribute('aria-label', (weather.desc ? weather.desc + ', ' : '') + weather.t + ' grādi');
    sync(weather);
  }

  function visibilityChanged() {
    document.documentElement.classList.toggle('mk-weather-paused', document.hidden);
    var icon = document.querySelector('.mk-weather-temp-icon');
    if (icon) icon.hidden = document.hidden;
  }
  visibilityChanged();
  document.addEventListener('visibilitychange', visibilityChanged, { passive: true });

  window.MinkaHeaderWeather = {
    sync: sync,
    setState: setState,
    setPeriod: setPeriod,
    getState: function() { return layer.dataset.weatherState; },
    getPeriod: function() { return layer.dataset.weatherPeriod; },
    mapCondition: conditionState,
    mapPeriod: conditionPeriod,
    syncMoon: syncMoonPhase,
    renderTemperature: renderTemperature,
    diagnostics: function() {
      return {
        state: layer.dataset.weatherState,
        period: layer.dataset.weatherPeriod,
        paused: document.documentElement.classList.contains('mk-weather-paused'),
        effectLayers: 2,
        particles: particles.children.length,
        visibleParticles: Array.prototype.filter.call(particles.children, function(node) {
          return getComputedStyle(node).display !== 'none';
        }).length
      };
    }
  };

  if (demoMode) {
    var demoIndex = 0;
    var demoPlaying = true;
    var demoTimer = 0;
    var controls = document.createElement('div');
    controls.className = 'mk-weather-demo-controls';
    controls.setAttribute('aria-label', 'Laikapstākļu animāciju demonstrācija');

    var previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.textContent = '‹';
    previousButton.setAttribute('aria-label', 'Iepriekšējā animācija');

    var playButton = document.createElement('button');
    playButton.type = 'button';
    playButton.textContent = 'Ⅱ';
    playButton.setAttribute('aria-label', 'Apturēt automātisko demonstrāciju');

    var periodSelect = document.createElement('select');
    periodSelect.className = 'mk-weather-demo-period-select';
    periodSelect.setAttribute('data-mk-weather-period-select', '');
    periodSelect.setAttribute('aria-label', 'Izvēlies headera laiku');
    periodSelect.title = 'Headera laiks';
    PERIODS.forEach(function(period) {
      var option = document.createElement('option');
      option.value = period;
      option.textContent = PERIOD_LABELS[period];
      periodSelect.appendChild(option);
    });

    var stateSelect = document.createElement('select');
    stateSelect.setAttribute('data-mk-weather-demo-label', '');
    stateSelect.setAttribute('aria-label', 'Izvēlies laikapstākļu animāciju');
    stateSelect.title = 'Izvēlies laikapstākļu animāciju';
    STATES.forEach(function(state, index) {
      var option = document.createElement('option');
      option.value = state;
      option.textContent = (index + 1) + '/10 · ' + STATE_LABELS[state];
      stateSelect.appendChild(option);
    });

    var moonSelect = document.createElement('select');
    moonSelect.className = 'mk-weather-demo-moon-select';
    moonSelect.setAttribute('aria-label', 'Izvēlies mēness fāzi');
    moonSelect.title = 'Mēness fāze nakts režīmā';
    MOON_NAMES.forEach(function(name, index) {
      var option = document.createElement('option');
      option.value = String(index);
      option.textContent = MOON_ICONS[index] + ' ' + name;
      moonSelect.appendChild(option);
    });
    moonSelect.value = String(demoMoonIndex);

    var nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.textContent = '›';
    nextButton.setAttribute('aria-label', 'Nākamā animācija');

    controls.append(previousButton, playButton, periodSelect, stateSelect, moonSelect, nextButton);
    document.body.appendChild(controls);

    function showDemo(index) {
      demoIndex = (index + STATES.length) % STATES.length;
      setState(STATES[demoIndex]);
    }
    function scheduleDemo() {
      clearTimeout(demoTimer);
      if (!demoPlaying || document.hidden) return;
      demoTimer = window.setTimeout(function() {
        showDemo(demoIndex + 1);
        scheduleDemo();
      }, 4800);
    }
    previousButton.addEventListener('click', function() { showDemo(demoIndex - 1); scheduleDemo(); });
    nextButton.addEventListener('click', function() { showDemo(demoIndex + 1); scheduleDemo(); });
    stateSelect.addEventListener('change', function() {
      demoPlaying = false;
      playButton.textContent = '▶';
      playButton.setAttribute('aria-label', 'Turpināt automātisko demonstrāciju');
      showDemo(STATES.indexOf(stateSelect.value));
      scheduleDemo();
    });
    moonSelect.addEventListener('change', function() {
      demoMoonIndex = Number(moonSelect.value) || 0;
      syncMoonPhase();
    });
    playButton.addEventListener('click', function() {
      demoPlaying = !demoPlaying;
      playButton.textContent = demoPlaying ? 'Ⅱ' : '▶';
      playButton.setAttribute('aria-label', demoPlaying ? 'Apturēt automātisko demonstrāciju' : 'Turpināt automātisko demonstrāciju');
      scheduleDemo();
    });
    periodSelect.addEventListener('change', function() {
      setPeriod(periodSelect.value);
    });
    document.addEventListener('visibilitychange', scheduleDemo, { passive: true });
    setPeriod(previewPeriod || conditionPeriod(window.__mkBarWeatherData));
    syncMoonPhase();
    showDemo(0);
    scheduleDemo();
  } else if (preview) { setPeriod(previewPeriod || conditionPeriod(window.__mkBarWeatherData)); setState(preview); }
  else if (window.__mkBarWeatherData) sync(window.__mkBarWeatherData);
})();
