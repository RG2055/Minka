function doGet(e) {
  var p = e ? (e.parameter || {}) : {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bolusSheet = getOrCreateSheet_(ss, 'Bolus');
  var planSheet = getOrCreateSheet_(ss, 'RadiologistPlan');

  if (p.action === 'write' && p.room && p.ts) {
    ensureBolusHeader_(bolusSheet);
    var d = new Date(Number(p.ts));
    var readable = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
    var who = p.name ? decodeURIComponent(p.name) : 'Anonīms';
    var roomLabel = String(p.room).toUpperCase() === 'GE' ? 'GE kabinets' : 'PHILIPS kabinets';
    bolusSheet.appendRow([roomLabel, readable, who]);
    return jsonOut_({ ok: true });
  }

  if (p.action === 'rad_plan_get' && p.date) {
    ensureRadiologistPlanHeader_(planSheet);
    var dateStr = normalizeDate_(p.date);
    var data = planSheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (normalizeDate_(data[i][0]) === dateStr) {
        return jsonOut_({
          ok: true,
          date: dateStr,
          text: String(data[i][1] || ''),
          updatedAt: data[i][2] || '',
          clearedAtShift: String(data[i][3] || '')
        });
      }
    }
    return jsonOut_({ ok: true, date: dateStr, text: '' });
  }

  if (p.action === 'rad_plan_write' && p.date) {
    ensureRadiologistPlanHeader_(planSheet);
    var writeDate = normalizeDate_(p.date);
    var text = String(p.text || '').replace(/\r\n/g, '\n');
    var shiftDate = normalizeDate_(p.shiftDate) || currentShiftDate_();
    var row = findPlanRow_(planSheet, writeDate);
    var values = [[writeDate, text, new Date(), text ? '' : shiftDate]];

    if (row > 0) {
      planSheet.getRange(row, 1, 1, 4).setValues(values);
    } else {
      planSheet.appendRow(values[0]);
    }

    return jsonOut_({
      ok: true,
      date: writeDate,
      text: text,
      cleared: !String(text).trim(),
      clearedAtShift: !String(text).trim() ? shiftDate : ''
    });
  }

  ensureBolusHeader_(bolusSheet);

  var data = bolusSheet.getDataRange().getValues();
  var result = { ge: { changedAt: null, history: [] }, philips: { changedAt: null, history: [] } };
  for (var j = 1; j < data.length; j++) {
    var roomRaw = String(data[j][0]).toLowerCase().trim();
    var room = roomRaw.indexOf('ge') !== -1 ? 'ge' : roomRaw.indexOf('philips') !== -1 ? 'philips' : null;
    if (!room) continue;
    var dateStr = String(data[j][1]).trim();
    var whoRead = String(data[j][2] || 'Anonīms').trim();
    if (!dateStr) continue;
    var dp = dateStr.split(' ');
    var dd = (dp[0] || '').split('.');
    var tt = (dp[1] || '0:0').split(':');
    var ts = new Date(Number(dd[2]), Number(dd[1]) - 1, Number(dd[0]), Number(tt[0]), Number(tt[1])).getTime();
    if (ts > 0) {
      result[room].history.push({ ts: ts, name: whoRead });
      if (!result[room].changedAt || ts > result[room].changedAt) result[room].changedAt = ts;
    }
  }
  result.ge.history.sort(function(a, b) { return b.ts - a.ts; });
  result.philips.history.sort(function(a, b) { return b.ts - a.ts; });

  return jsonOut_(result);
}

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureBolusHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Kabinets', 'Datums un laiks', 'Nomainīja']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#d9e1f2');
  }
}

function ensureRadiologistPlanHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Datums', 'Teksts', 'Atjaunots', 'Notīrīts maiņā']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f4cccc');
  }
}

function normalizeDate_(value) {
  var str = String(value || '').trim();
  var m = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? m[1] + '.' + m[2] + '.' + m[3] : '';
}

function currentShiftDate_() {
  var now = new Date();
  if (now.getHours() < 8) now.setDate(now.getDate() - 1);
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy');
}

function findPlanRow_(sheet, dateStr) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (normalizeDate_(data[i][0]) === dateStr) return i + 1;
  }
  return -1;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
