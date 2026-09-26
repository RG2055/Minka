import test from 'node:test';
import assert from 'node:assert/strict';

import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../../cloudflare/minka-api/src/index.js', import.meta.url), 'utf8');
const { validSchedule } = new Function(source.replace('export default worker;', 'return { validSchedule };'))();
const month = (n, people = 1) => Array.from({ length: n }, (_, i) => ({ date: String(i + 1).padStart(2, '0') + '.09.2026', workers: Array.from({ length: people }, () => ({ name: 'X', shift: '12' })) }));

test('only a complete Apps Script reply may replace the schedule copy', () => {
  assert.equal(validSchedule({ success: true, radiographers: { 'SEPTEMBRIS 2026': month(30) }, radiologists: {} }), true);
  assert.equal(validSchedule({ success: true, radiographers: { 'SEPTEMBRIS 2026': month(30) } }), true);
  assert.equal(validSchedule({ success: false, error: 'Exception' }), false);
  assert.equal(validSchedule({ success: true, radiographers: { 'SEPTEMBRIS 2026': [] }, radiologists: {} }), false);
  assert.equal(validSchedule({ success: true, radiographers: { 'SEPTEMBRIS 2026': month(12) } }), false);
  assert.equal(validSchedule({ success: true, radiographers: { 'SEPTEMBRIS 2026': month(30, 0) } }), false);
  assert.equal(validSchedule({ success: true, radiographers: { 'SEPTEMBRIS 2026': month(30) }, radiologists: [] }), false);
  assert.equal(validSchedule(null), false);
});
