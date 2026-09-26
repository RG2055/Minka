(function(){
  /* ── MAIŅU STATISTIKA: M3 dialogs ─────────────────────────────────────────
     Open is a container transform out of whatever launched it (the dock's
     Statistika button, the mood curve) or, without an origin, the standard
     M3 dialog enter. Close is the same relationship backwards. State is set
     at once (data-state, aria, the shell message); the animation only shows
     it, and reopening during a close simply cancels the close. */
  let opener = null;        // element focused before opening, for focus return
  let origin = null;        // launcher element or rect in this document
  function isOpen(modal) { return !!modal && modal.dataset.state === 'open'; }
  window.__minkaStatsIsOpen = function () { return isOpen(document.getElementById('stats-modal')); };
  function focusables(root) {
    return [].slice.call(root.querySelectorAll('button:not([disabled]),select,[href],input,[tabindex]:not([tabindex="-1"])'))
      .filter(function (el) { return el.offsetWidth || el.offsetHeight; });
  }

  window.openStatsModal = function(opts) {
    const modal = document.getElementById('stats-modal');
    const wrap = document.getElementById('stats-table-wrap');
    const monthLabel = document.getElementById('stats-month-label');
    if (!modal || !wrap) return;
    if (isOpen(modal)) return;
    // The header shows the dock's own Statistika icon, in the current icon set.
    try {
      const mark = modal.querySelector('.mk-stats-mark');
      const icon = window.parent !== window && window.parent.__mkDockIcon ? window.parent.__mkDockIcon('statsDocBtn') : '';
      if (mark && icon) { mark.innerHTML = icon; mark.classList.add('is-dock-icon'); }
    } catch (_e) {}
    const reopening = modal.dataset.state === 'closing';
    opts = opts || {};
    // An element is re-measured on close (it may have moved); a rect is used as is.
    origin = opts.from || opts.origin || null;
    const active = document.activeElement;
    opener = opts.from || (active && active !== document.body && !modal.contains(active) ? active : null);

    const store = window.__grafiksStore || {};
    const storeRad = window.__grafiksStoreRad || {};
    const activeMonth = window.__activeMonth || '';
    monthLabel.textContent = activeMonth;

    // Gather all workers for the month
    function getShiftType(w) {
      const hrs = parseInt(String(w.shift||'').replace(/\D/g,'')) || 0;
      const t = String(w.type||'').toUpperCase();
      if (t === 'DIENNAKTS' || hrs >= 24) return 'diennakts';
      if (t === 'NAKTS') return 'nakts';
      return 'diena';
    }

    const rgStats = {};
    const rdStats = {};
    // Parse target month/year from activeMonth label (e.g. "APRĪLIS 2026")
    const _amUp = String(activeMonth || '').toUpperCase();
    const _amYear = (_amUp.match(/20\d{2}/) || [''])[0];
    const _mNums = {'JANVĀRIS':1,'JANVARIS':1,'FEBRUĀRIS':2,'FEBRUARIS':2,'MARTS':3,
      'APRĪLIS':4,'APRILIS':4,'MAIJS':5,'JŪNIJS':6,'JUNIJS':6,
      'JŪLIJS':7,'JULIJS':7,'AUGUSTS':8,'SEPTEMBRIS':9,'OKTOBRIS':10,'NOVEMBRIS':11,'DECEMBRIS':12};
    const _mKey = Object.keys(_mNums).find(k => _amUp.includes(k));
    const _amMM = _mKey ? _mNums[_mKey] : null; // numeric month 1-12
    function processStore(s, statsObj) {
      const seen = new Set();
      // Iterate ALL months (same as personal modal) so key-format differences don't matter
      for (const monthKey of Object.keys(s)) {
        const days = s[monthKey];
        if (!Array.isArray(days)) continue;
        for (const day of days) {
          if (!day) continue;
          const dp = (day.date || '').split('.');
          if (dp.length !== 3) continue;
          const [dd, mm, yy] = dp.map(Number);
          // Filter to active month/year exactly like personal modal
          if (_amMM && _amYear) {
            if (mm !== _amMM || String(yy) !== _amYear) continue;
          }
          const normDate = String(dd).padStart(2,'0') + '.' + String(mm).padStart(2,'0') + '.' + yy;
          for (const w of (day.workers || [])) {
            if (!w.name || !w.shift) continue;
            const dedupKey = normDate + '|' + w.name + '|' + w.shift;
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);
            const name = w.name;
            if (!statsObj[name]) statsObj[name] = { name, d12:0, n12:0, h24:0, h8:0, hOther:0, total:0, totalHrs:0 };
            const st = getShiftType(w);
            const hrs = parseInt(String(w.shift||'').replace(/\D/g,'')) || 0;
            statsObj[name].totalHrs += hrs;
            statsObj[name].total++;
            if (st === 'diennakts') statsObj[name].h24++;
            else if (st === 'nakts') statsObj[name].n12++;
            else if (hrs >= 12) statsObj[name].d12++;
            else if (hrs >= 8)  statsObj[name].h8++;
            else                statsObj[name].hOther++;
          }
        }
      }
    }

    function renderTable(workers, title, accent) {
      if (!workers.length) return '';
      const rows = workers.map(w => {
        const name = w.name.split(' ').map((p,i) => i===0 ? p : p[0]+'.').join(' ');
        const bar = Math.min(100, Math.round(w.totalHrs / 200 * 100));
        return `<tr>
          <td style="padding:7px 10px;font-size:11px;font-weight:700;color:#e0e0e0;white-space:nowrap;">${name}</td>
          <td style="padding:7px 10px;text-align:center;font-size:12px;font-weight:800;color:#00ff7f;">${w.totalHrs}h</td>
          <td style="padding:7px 10px;text-align:center;font-size:11px;color:#60a5fa;">${w.d12 || '-'}</td>
          <td style="padding:7px 10px;text-align:center;font-size:11px;color:#c084fc;">${w.n12 || '-'}</td>
          <td style="padding:7px 10px;text-align:center;font-size:11px;color:#fb923c;">${w.h24 || '-'}</td>
          <td style="padding:7px 10px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">${w.h8||w.hOther ? (w.h8||0)+(w.hOther||0) : '-'}</td>
          <td style="padding:7px 10px;min-width:80px;">
            <div style="height:4px;border-radius:99px;background:rgba(255,255,255,0.07);">
              <div style="height:100%;width:${bar}%;background:${accent};border-radius:99px;"></div>
            </div>
          </td>
        </tr>`;
      }).join('');
      return `<div style="margin-bottom:20px;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.12em;color:${accent};text-transform:uppercase;margin-bottom:8px;">${title}</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.07);">
              <th style="padding:5px 10px;text-align:left;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;">Darbinieks</th>
              <th style="padding:5px 10px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;">Kopā</th>
              <th style="padding:5px 10px;font-size:9px;font-weight:700;color:#60a5fa;letter-spacing:.08em;text-transform:uppercase;">12h D</th>
              <th style="padding:5px 10px;font-size:9px;font-weight:700;color:#c084fc;letter-spacing:.08em;text-transform:uppercase;">12h N</th>
              <th style="padding:5px 10px;font-size:9px;font-weight:700;color:#fb923c;letter-spacing:.08em;text-transform:uppercase;">24h</th>
              <th style="padding:5px 10px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;">Citas</th>
              <th style="padding:5px 10px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;">Slodze</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }

    // Render the statistics synchronously, before the dialog shows, so the
    // first frame already has content. The plain table is only a fallback
    // if levels.js failed, and only then is it computed at all.
    // A reopen during the close keeps what is already on screen.
    if (!reopening || !wrap.firstChild) {
      if (window.MinkaLevels && typeof window.MinkaLevels.injectIntoStats === 'function') {
        window.MinkaLevels.injectIntoStats();
      } else {
        processStore(store, rgStats);
        processStore(storeRad, rdStats);
        const radiografers = Object.values(rgStats).sort((a,b) => b.totalHrs - a.totalHrs);
        const radiologi    = Object.values(rdStats).sort((a,b) => b.totalHrs - a.totalHrs);
        wrap.innerHTML = renderTable(radiografers, '● Radiogrāferi', '#1fe091') +
                         renderTable(radiologi, '● Radiologi', '#3f9bff');
      }
    }
    modal.style.display = 'flex';
    modal.dataset.state = 'open';
    modal.setAttribute('aria-hidden', 'false');
    const sheet = modal.querySelector('.mk-stats-sheet');
    if (window.MinkaMotion && sheet) window.MinkaMotion.openSurface(sheet, { key: 'stats', origin: origin, scrim: modal });
    // Focus moves into the dialog: the selected tab, else the close button.
    const target = modal.querySelector('#stats-table-wrap [role="tab"][aria-selected="true"]') || modal.querySelector('.mk-stats-close');
    // No ring for a mouse open: the ring appears once the keyboard is used.
    if (target) { try { target.focus({ preventScroll: true, focusVisible: false }); } catch (_e) {} }
    try { window.parent && window.parent.postMessage({ type: 'mk_stats_opened' }, window.location.origin); } catch(_e) {}
  };

  window.closeStatsModal = function() {
    const m = document.getElementById('stats-modal');
    if (!m || m.dataset.state === 'closing' || m.style.display === 'none') return;
    m.dataset.state = 'closing';
    m.setAttribute('aria-hidden', 'true');
    try { window.parent && window.parent.postMessage({ type: 'mk_stats_closed' }, window.location.origin); } catch(_e) {}
    const back = opener;
    opener = null;
    const finish = function () {
      if (m.dataset.state !== 'closing') return;      // reopened meanwhile
      m.dataset.state = 'closed';
      m.style.display = 'none';
      // Free the DOM the statistics hold — it is rebuilt on every open.
      const w = document.getElementById('stats-table-wrap');
      if (w) w.innerHTML = '';
      if (window.MinkaDaybookStats && window.MinkaDaybookStats.reset) window.MinkaDaybookStats.reset();
      if (back && back.isConnected && typeof back.focus === 'function') { try { back.focus({ preventScroll: true }); } catch (_e) {} }
    };
    const sheet = m.querySelector('.mk-stats-sheet');
    // Back into the launcher when it is still there, else the M3 dialog exit.
    if (window.MinkaMotion && sheet) window.MinkaMotion.closeSurface(sheet, { key: 'stats', origin: origin, scrim: m }, finish);
    else finish();
  };

  document.addEventListener('keydown', e => {
    const m = document.getElementById('stats-modal');
    if (!isOpen(m)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      // A day or person view goes back one level first.
      if (window.MinkaDaybookStats && window.MinkaDaybookStats.back && window.MinkaDaybookStats.back()) return;
      window.closeStatsModal();
      return;
    }
    if (e.key === 'Tab') {
      // Keep keyboard focus inside the dialog while it is open.
      const list = focusables(m.querySelector('.mk-stats-sheet') || m);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !m.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !m.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });

})();
