(function(){
  // ï¿½ï¿½ï¿½ï¿½ MAIï¿½&U STATISTIKA MODÄ¬LS ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½
  window.openStatsModal = function() {
    const modal = document.getElementById('stats-modal');
    const wrap = document.getElementById('stats-table-wrap');
    const monthLabel = document.getElementById('stats-month-label');
    if (!modal || !wrap) return;

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
    processStore(store, rgStats);
    processStore(storeRad, rdStats);

    const radiografers = Object.values(rgStats).sort((a,b) => b.totalHrs - a.totalHrs);
    const radiologi    = Object.values(rdStats).sort((a,b) => b.totalHrs - a.totalHrs);

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

    // Render the gamified leaderboard synchronously so the legacy table never
    // flashes. The plain table below is only a fallback if levels.js failed.
    if (window.MinkaLevels && typeof window.MinkaLevels.injectIntoStats === 'function') {
      window.MinkaLevels.injectIntoStats();
    } else {
      wrap.innerHTML = renderTable(radiografers, '● Radiogrāferi', '#00ff7f') +
                       renderTable(radiologi, '● Radiologi', '#a78bfa');
    }
    modal.style.display = 'flex';
    try { window.parent && window.parent.postMessage({ type: 'mk_stats_opened' }, window.location.origin); } catch(_e) {}
  };

  window.closeStatsModal = function() {
    const m = document.getElementById('stats-modal');
    if (m) m.style.display = 'none';
    // Free the ~2000 DOM nodes the table/leaderboard holds — it is fully
    // rebuilt on every open, so keeping it around only wastes RAM.
    const w = document.getElementById('stats-table-wrap');
    if (w) w.innerHTML = '';
    try { window.parent && window.parent.postMessage({ type: 'mk_stats_closed' }, window.location.origin); } catch(_e) {}
  };

  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeStatsModal?.(); });

})();
