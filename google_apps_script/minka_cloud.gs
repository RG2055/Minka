function doGet(e) {
  var p = e ? (e.parameter || {}) : {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bolusSheet = getOrCreateSheet_(ss, 'Bolus');
  var planSheet = getOrCreateSheet_(ss, 'RadiologistPlan');

  if (p.action === 'write' && p.room && p.ts) {
    ensureBolusHeader_(bolusSheet);
    var writeTs = normalizeBolusTs_(p.ts);
    var roomKey = normalizeBolusRoom_(p.room);
    if (!writeTs || !roomKey) return jsonOut_({ ok: false, error: 'invalid_bolus' });
    var d = new Date(writeTs);
    var readable = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
    var who = normalizeBolusName_(p.name) || 'Anonīms';
    var roomLabel = roomKey === 'ge' ? 'GE kabinets' : 'PHILIPS kabinets';
    var leftConc = normalizeBolusConcentration_(p.leftConc);
    var leftMl = normalizeBolusContrastMl_(p.leftMl);
    var naclMl = normalizeBolusNaclMl_(p.naclMl);
    var rightConc = normalizeBolusConcentration_(p.rightConc);
    var rightMl = normalizeBolusContrastMl_(p.rightMl);
    bolusSheet.appendRow([
      roomLabel,
      readable,
      who,
      leftConc && leftMl ? 'Ultravist ' + leftConc : '',
      leftConc && leftMl ? leftMl : '',
      naclMl || '',
      rightConc && rightMl ? 'Ultravist ' + rightConc : '',
      rightConc && rightMl ? rightMl : ''
    ]);
    return jsonOut_({ ok: true });
  }

  // Edit or delete one bolus history row. Rows are matched by room + the
  // stored timestamp at minute precision (that is what the sheet keeps).
  if ((p.action === 'edit_entry' || p.action === 'delete_entry') && p.room && p.ts) {
    ensureBolusHeader_(bolusSheet);
    var matchTs = normalizeBolusTs_(p.action === 'edit_entry' ? (p.oldTs || p.ts) : p.ts);
    var nextTs = normalizeBolusTs_(p.ts);
    if (!matchTs || !nextTs) return jsonOut_({ ok: false, error: 'invalid_timestamp' });
    var matchMin = Math.floor(matchTs / 60000);
    var roomKey = normalizeBolusRoom_(p.room);
    var rows = bolusSheet.getDataRange().getValues();
    for (var k = rows.length - 1; k >= 1; k--) {
      if (normalizeBolusRoom_(rows[k][0]) !== roomKey) continue;
      var rowTs = parseBolusTs_(rows[k][1]);
      if (!rowTs || Math.floor(rowTs / 60000) !== matchMin) continue;
      if (p.action === 'delete_entry') {
        bolusSheet.deleteRow(k + 1);
      } else {
        var newReadable = Utilities.formatDate(new Date(nextTs), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
        var newWho = normalizeBolusName_(p.name) || normalizeBolusName_(rows[k][2]) || 'Anonīms';
        bolusSheet.getRange(k + 1, 2, 1, 2).setValues([[newReadable, newWho]]);
      }
      return jsonOut_({ ok: true, action: p.action });
    }
    return jsonOut_({ ok: false, error: 'not_found' });
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
      result[room].history.push({ ts: ts, name: whoRead, media: bolusMediaFromRow_(data[j]) });
      if (!result[room].changedAt || ts > result[room].changedAt) result[room].changedAt = ts;
    }
  }
  result.ge.history.sort(function(a, b) { return b.ts - a.ts; });
  result.philips.history.sort(function(a, b) { return b.ts - a.ts; });

  return jsonOut_(result);
}

function parseBolusTs_(cell) {
  if (cell instanceof Date) return cell.getTime();
  var dp = String(cell || '').trim().split(' ');
  var dd = (dp[0] || '').split('.');
  var tt = (dp[1] || '0:0').split(':');
  var ts = new Date(Number(dd[2]), Number(dd[1]) - 1, Number(dd[0]), Number(tt[0]), Number(tt[1])).getTime();
  return ts > 0 ? ts : null;
}

function normalizeBolusRoom_(value) {
  var raw = String(value || '').toLowerCase().trim();
  if (raw.indexOf('ge') !== -1) return 'ge';
  if (raw.indexOf('philips') !== -1 || raw.indexOf('ph') !== -1) return 'philips';
  return raw === 'ge' ? 'ge' : raw === 'ph' ? 'philips' : '';
}

function normalizeBolusTs_(value) {
  var ts = Math.floor(Number(value));
  if (!isFinite(ts)) return null;
  var min = new Date(2020, 0, 1).getTime();
  // Bolus entries can be corrected later from a phone, including entries
  // from previous days or months. Keep only a practical future guard.
  var max = Date.now() + 366 * 24 * 60 * 60 * 1000;
  return ts >= min && ts <= max ? ts : null;
}

function normalizeBolusName_(value) {
  var text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  if (!text || text.length > 64) return '';
  return text.replace(/[<>&`\u0000-\u001f\u007f]/g, '').trim();
}

function normalizeBolusConcentration_(value) {
  var match = String(value == null ? '' : value).match(/(?:^|\D)(300|370)(?:\D|$)/);
  return match ? Number(match[1]) : null;
}

function normalizeBolusContrastMl_(value) {
  var ml = Number(value);
  return ml === 200 || ml === 500 ? ml : null;
}

function normalizeBolusNaclMl_(value) {
  // 1000 ml is the standard bag; 500 ml stays valid for older rows.
  var ml = Number(value);
  return ml === 500 || ml === 1000 ? ml : null;
}

function bolusMediaFromRow_(row) {
  var leftConc = normalizeBolusConcentration_(row[3]);
  var leftMl = normalizeBolusContrastMl_(row[4]);
  var naclMl = normalizeBolusNaclMl_(row[5]);
  var rightConc = normalizeBolusConcentration_(row[6]);
  var rightMl = normalizeBolusContrastMl_(row[7]);
  if (!leftConc && !naclMl && !rightConc) return null;
  return {
    left: { enabled: !!(leftConc && leftMl), concentration: leftConc || 370, volumeMl: leftMl || 500 },
    nacl: { enabled: !!naclMl, volumeMl: naclMl || 1000 },
    right: { enabled: !!(rightConc && rightMl), concentration: rightConc || 300, volumeMl: rightMl || 500 }
  };
}

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureBolusHeader_(sheet) {
  var headers = [
    'Kabinets',
    'Datums un laiks',
    'Nomainīja',
    'Kreisais kontrasts',
    'Kreisais tilpums ml',
    'NaCl ml',
    'Labais kontrasts',
    'Labais tilpums ml'
  ];
  // Existing installations already have the first three columns. Extend the
  // header once, without turning every periodic GET into a Sheet write.
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#d9e1f2');
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
  if (!m) return '';
  var day = Number(m[1]);
  var month = Number(m[2]);
  var year = Number(m[3]);
  if (year < 2020 || year > 2100) return '';
  var d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return '';
  return m[1] + '.' + m[2] + '.' + m[3];
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
