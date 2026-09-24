(function(){
  if (document.documentElement.classList.contains('mk-mobile-shell')) return;

  var mounted = false;
  var framePending = false;
  var dutyObserver = null;
  var headerResizeObserver = null;

  function ensureWingLayer(wrap) {
    var layer = document.getElementById('mkDutyWingLayer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'mkDutyWingLayer';
    layer.setAttribute('aria-label', 'Dežūru kopsavilkums');
    layer.innerHTML =
      '<section class="mk-duty-wing mk-duty-wing-rg" aria-label="Radiogrāferi"><div id="mkDutyWingRg" class="mk-duty-wing-slot"></div></section>' +
      '<section class="mk-duty-wing mk-duty-wing-rd" aria-label="Radiologi"><div id="mkDutyWingRd" class="mk-duty-wing-slot"></div></section>';
    wrap.insertBefore(layer, wrap.firstChild);
    return layer;
  }

  function moveHeaderControls(wrap) {
    if (!wrap) return;
    var dateControls = wrap.querySelector('.scroll-row .mk-date-controls');
    var search = document.getElementById('mkSearchLaunch');
    var menu = document.getElementById('minkaBarMenu');
    if (!dateControls || !search || !menu) return;
    var actions = document.getElementById('mkRailActions');
    if (!actions) {
      actions = document.createElement('span');
      actions.id = 'mkRailActions';
      actions.setAttribute('aria-label', 'Meklēšana un kontaktu saraksts');
      dateControls.insertBefore(actions, dateControls.firstChild);
    }
    if (search.parentElement !== actions) actions.appendChild(search);
    if (menu.parentElement !== actions) actions.appendChild(menu);

    var lanes = document.getElementById('lanes-mini-toggle');
    var night = document.getElementById('ns-bar-toggle');
    var modes = document.getElementById('mkRailModes');
    if (!modes) {
      modes = document.createElement('span');
      modes.id = 'mkRailModes';
      modes.setAttribute('aria-label', 'Maiņu skata režīmi');
      dateControls.insertBefore(modes, actions);
    }
    if (lanes && lanes.parentElement !== modes) modes.appendChild(lanes);
    if (night && night.parentElement !== modes) modes.appendChild(night);
  }

  function moveNamedayToDateLane(wrap) {
    if (!wrap) return;
    var people = wrap.querySelector('#mkPeopleEvents');
    var nameday = document.getElementById('mkNamedayBar');
    if (!people || !nameday) return;
    if (nameday.parentElement !== people) people.appendChild(nameday);
    var dayChip = document.getElementById('mkDayChip');
    if (dayChip && dayChip.parentElement !== people) people.appendChild(dayChip);
    var staleDock = document.getElementById('mkHeaderNamedayDock');
    if (staleDock) staleDock.remove();
  }

  function moveDutyNodes() {
    var rgSlot = document.getElementById('mkDutyWingRg');
    var rdSlot = document.getElementById('mkDutyWingRd');
    if (!rgSlot || !rdSlot) return;
    var rgTag = document.querySelector('.status-tag.radiographers');
    var rdTag = document.querySelector('.status-tag.radiologists');
    var rgStrip = document.getElementById('radiographers-shift-count-strip');
    var rdStrip = document.getElementById('radiologists-shift-count-strip');
    if (rgTag && rgTag.parentElement !== rgSlot) rgSlot.appendChild(rgTag);
    if (rgStrip && rgStrip.parentElement !== rgSlot) rgSlot.appendChild(rgStrip);
    if (rdTag && rdTag.parentElement !== rdSlot) rdSlot.appendChild(rdTag);
    if (rdStrip && rdStrip.parentElement !== rdSlot) rdSlot.appendChild(rdStrip);
    [rgSlot, rdSlot].forEach(function(slot) {
      var wing = slot.closest('.mk-duty-wing');
      var rows = slot.querySelectorAll('.mk-duty-strip .mk-duty-avatar-group').length;
      if (!wing) return;
      wing.classList.toggle('mk-duty-few', rows <= 2);
      wing.classList.toggle('mk-duty-many', rows >= 4);
      wing.setAttribute('data-duty-rows', String(rows));
    });
  }

  function syncGeometry() {
    framePending = false;
    var app = document.getElementById('grafiks-app');
    var wrap = document.getElementById('minkaBarWrap');
    var left = app && app.querySelector(':scope > .left-panel');
    var right = app && app.querySelector(':scope > .right-panel');
    if (!app || !wrap || !left || !right) return;
    var appWidth = app.getBoundingClientRect().width;
    var leftWidth = left.getBoundingClientRect().width;
    var rightWidth = right.getBoundingClientRect().width;
    var compact = appWidth <= 1180;
    var desktopWing = Math.min(appWidth >= 1700 ? 380 : 300, appWidth * .20);
    app.style.setProperty('--mk-wing-left', Math.round(compact ? Math.max(leftWidth, 250) : Math.max(leftWidth, desktopWing)) + 'px');
    app.style.setProperty('--mk-wing-right', Math.round(compact ? Math.max(rightWidth, 250) : Math.max(rightWidth, desktopWing)) + 'px');
    // Let wrapped names grow the scenic top row instead of clipping them.
    // Uses the existing resize/day-change scheduling, never a polling loop.
    var dutyHeight = 108;
    wrap.querySelectorAll('.mk-duty-wing-slot').forEach(function(slot) {
      dutyHeight = Math.max(dutyHeight, Math.ceil(slot.getBoundingClientRect().height) + 8);
    });
    var dutyHeightValue = dutyHeight + 'px';
    if (wrap.style.getPropertyValue('--mk-duty-summary-height') !== dutyHeightValue) {
      wrap.style.setProperty('--mk-duty-summary-height', dutyHeightValue);
    }
    var dayScroller = wrap.querySelector('.scroll-row .scroller');
    var activeDay = dayScroller && dayScroller.querySelector('.pill.active');
    if (dayScroller && activeDay) {
      var scrollerRect = dayScroller.getBoundingClientRect();
      var activeRect = activeDay.getBoundingClientRect();
      if (activeRect.left < scrollerRect.left + 4) {
        dayScroller.scrollLeft -= (scrollerRect.left + 4 - activeRect.left);
      } else if (activeRect.right > scrollerRect.right - 4) {
        dayScroller.scrollLeft += (activeRect.right - scrollerRect.right + 4);
      }
    }
    var headerHeight = Math.ceil(wrap.getBoundingClientRect().height);
    if (headerHeight > 0) app.style.setProperty('--mk-header-h', headerHeight + 'px');
  }

  function scheduleGeometry() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(syncGeometry);
  }

  function mount() {
    if (mounted) return;
    var app = document.getElementById('grafiks-app');
    var wrap = document.getElementById('minkaBarWrap');
    var scrollRow = document.querySelector('.main-panel > .scroll-row');
    if (!app || !wrap || !scrollRow) return;
    mounted = true;
    app.appendChild(wrap);
    ensureWingLayer(wrap);
    wrap.appendChild(scrollRow);
    moveHeaderControls(wrap);
    moveNamedayToDateLane(wrap);
    moveDutyNodes();

    dutyObserver = new MutationObserver(function(){
      moveDutyNodes();
      scheduleGeometry();
    });
    ['radiographers-duty', 'radiologists-duty'].forEach(function(id){
      var node = document.getElementById(id);
      if (node && node.parentElement) dutyObserver.observe(node.parentElement, { childList: true, subtree: false });
    });

    if (window.ResizeObserver) {
      headerResizeObserver = new ResizeObserver(scheduleGeometry);
      headerResizeObserver.observe(wrap);
      headerResizeObserver.observe(app);
      wrap.querySelectorAll('.mk-duty-wing-slot').forEach(function(slot) { headerResizeObserver.observe(slot); });
    }
    window.addEventListener('resize', scheduleGeometry, { passive: true });
    window.addEventListener('daySelected', scheduleGeometry, { passive: true });
    document.addEventListener('minka:monthReady', function(){
      moveDutyNodes();
      scheduleGeometry();
    });
    scheduleGeometry();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  window.addEventListener('load', function(){
    var wrap = document.getElementById('minkaBarWrap');
    mount();
    moveHeaderControls(wrap);
    moveNamedayToDateLane(wrap);
    moveDutyNodes();
    scheduleGeometry();
  }, { once: true });
})();
