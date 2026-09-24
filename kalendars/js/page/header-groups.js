/* Desktop header groups related information; mobile keeps its existing strip. */
(function() {
  var wrap       = document.getElementById('shift-progress-wrap');
  var timesSlot  = document.getElementById('mk-times-under-date');   /* under date */
  var scrollRow  = document.querySelector('.scroll-row');
  var searchDate = document.getElementById('mkSearchDate');
  var actionSlot = document.getElementById('mkHeaderActions');
  if (!wrap || !timesSlot || !scrollRow || !searchDate || !actionSlot) return;

  var _raf = 0;
  function rehome() {
    cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(function() {
      var isDesktop = !document.documentElement.classList.contains('mk-mobile-shell');

      /* 1. Times strip → under date.
         Vienotajā desktopa galvenē .top-row ir display:none, tāpēc šī pārcelšana
         tikai pazudinātu joslu un atstātu galvenē mirušu dublikātu ar to pašu
         id="sl-buddy-slot" — vecāku čaula tad Buddy noenkurotu uz 0x0 taisnstūra
         un aizmestu viņu ārpus galvenes. Pārceļam tikai tad, ja mērķis tiešām
         ir redzams (mobilajā čaulā). */
      var slotVisible = !!(timesSlot.offsetParent || timesSlot.getClientRects().length);
      var stale = timesSlot.querySelector('.sl-times-strip');
      if (stale && (!slotVisible || wrap.querySelector('.sl-times-strip'))) {
        stale.parentNode.removeChild(stale);
      }
      var strip = slotVisible ? wrap.querySelector('.sl-times-strip') : null;
      if (strip) timesSlot.appendChild(strip);

      /* 2. Desktop: birthday + nameday form one people-events group. The
         status chips and the two controls form two calmer groups below. */
      var ns = document.getElementById('ns-bar-toggle');
      var lanes = document.getElementById('lanes-mini-toggle');
      if (isDesktop) {
        var nameday = document.getElementById('mkNamedayBar');
        var birthday = document.getElementById('mkBdayBadge');
        var mainRow = searchDate.querySelector('.mk-search-date-main');
        var metaRow = searchDate.querySelector('.mk-search-date-meta');
        var people = document.getElementById('mkPeopleEvents');
        var status = document.getElementById('mkStatusGroup');
        if (!people && mainRow) {
          people = document.createElement('span');
          people.id = 'mkPeopleEvents';
          people.className = 'mk-people-events';
          mainRow.appendChild(people);
        }
        if (!status && metaRow) {
          status = document.createElement('span');
          status.id = 'mkStatusGroup';
          status.className = 'mk-status-group';
          metaRow.insertBefore(status, metaRow.firstChild);
        }
        if (birthday && people && birthday.parentElement !== people) people.appendChild(birthday);
        if (nameday && people && nameday.parentElement !== people) people.appendChild(nameday);
        var dayChip = document.getElementById('mkDayChip');
        if (dayChip && people && dayChip.parentElement !== people) people.appendChild(dayChip);
        ['mkTempChip', 'mkMoonChip'].forEach(function(id) {
          var chip = document.getElementById(id);
          if (chip && status && chip.parentElement !== status) status.appendChild(chip);
        });
        var today = document.getElementById('mkSearchToday');
        if (today && metaRow && today.parentElement !== metaRow) metaRow.insertBefore(today, status);
        if (metaRow && actionSlot.parentElement !== metaRow) metaRow.appendChild(actionSlot);
        /* 3. Weather + moon leave the date box for the centre column: they sit
           on the top row beside the date, and the news/weather ticker drops
           under them. One flex column (#mkCenterStack) holds both. */
        var inner = document.getElementById('minkaBarInner');
        var ticker = document.getElementById('mkTickerWrap');
        var stack = document.getElementById('mkCenterStack');
        if (inner && ticker && !stack) {
          stack = document.createElement('div');
          stack.id = 'mkCenterStack';
          stack.className = 'mk-center-stack';
          ticker.parentElement.insertBefore(stack, ticker);
          stack.appendChild(ticker);
        }
        if (status && stack) {
          if (status.parentElement !== stack) stack.insertBefore(status, stack.firstChild);
        } else if (status && actionSlot.previousElementSibling !== status) metaRow.insertBefore(status, actionSlot);
        var railModes = document.getElementById('mkRailModes');
        if (lanes && railModes && lanes.parentElement !== railModes) railModes.appendChild(lanes);
        else if (lanes && !railModes && lanes.parentElement !== actionSlot) actionSlot.appendChild(lanes);
        if (ns && railModes && ns.parentElement !== railModes) railModes.appendChild(ns);
        else if (ns && !railModes && ns.parentElement !== actionSlot) actionSlot.appendChild(ns);
      } else {
        var mobileMain = searchDate.querySelector('.mk-search-date-main');
        var mobileMeta = searchDate.querySelector('.mk-search-date-meta');
        var mobilePeople = document.getElementById('mkPeopleEvents');
        var mobileStatus = document.getElementById('mkStatusGroup');
        var mobileStack = document.getElementById('mkCenterStack');
        if (mobileStack) {
          var mobileTicker = document.getElementById('mkTickerWrap');
          if (mobileTicker && mobileTicker.parentElement === mobileStack) mobileStack.parentElement.insertBefore(mobileTicker, mobileStack);
          if (mobileStatus && mobileStatus.parentElement === mobileStack && mobileMeta) mobileMeta.insertBefore(mobileStatus, mobileMeta.firstChild);
          mobileStack.remove();
        }
        var mobileBday = document.getElementById('mkBdayBadge');
        var mobileNameday = document.getElementById('mkNamedayBar');
        if (mobileBday && mobileMain && mobileBday.parentElement !== mobileMain) mobileMain.appendChild(mobileBday);
        if (mobileStatus && mobileMeta) {
          while (mobileStatus.firstChild) mobileMeta.insertBefore(mobileStatus.firstChild, mobileStatus);
          mobileStatus.remove();
        }
        if (mobileNameday && mobileMeta && mobileNameday.parentElement !== mobileMeta) mobileMeta.appendChild(mobileNameday);
        /* Mobilajā kolonnā svinamā diena ir trešā rinda zem meta rindas, nevis
           vēl viens elements jau pilnajā vārdadienu rindā. */
        var mobileDayChip = document.getElementById('mkDayChip');
        if (mobileDayChip && mobileDayChip.parentElement !== searchDate) searchDate.appendChild(mobileDayChip);
        if (mobilePeople) mobilePeople.remove();
        var liveStrip = timesSlot.querySelector('.sl-times-strip');
        var lanesSlot = liveStrip && liveStrip.querySelector('#sl-lanes-slot');
        var nsSlot = liveStrip && liveStrip.querySelector('#sl-ns-slot');
        if (lanes && lanesSlot && lanes.parentElement !== lanesSlot) lanesSlot.appendChild(lanes);
        if (ns && nsSlot && ns.parentElement !== nsSlot) nsSlot.appendChild(ns);
      }
    });
  }

  new MutationObserver(rehome).observe(wrap, { childList: true });
  new MutationObserver(rehome).observe(searchDate, { childList: true, subtree: true });
  /* .sl-times-strip nav tiešais #shift-progress-wrap bērns — to no innerHTML
     pārbūvē calendar.js iekšā #shift-lanes-wrap. Bez šī novērotāja rehome()
     pēc pārbūves vairs neizpildījās: pārceltā josla palika zem datuma, bet
     galvenē parādījās jauna → mobilajā “ATLIKUŠAS” rādījās divas reizes.
     Novērojam tieši to konteineru, kurā josla piedzimst (childList, bez
     subtree — pulksteņa tikšķi neko nemaina, tāpēc lieku darbu nerada). */
  var lanesWrap = document.getElementById('shift-lanes-wrap');
  if (lanesWrap) new MutationObserver(rehome).observe(lanesWrap, { childList: true });
  rehome();
})();
