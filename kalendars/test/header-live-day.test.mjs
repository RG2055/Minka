import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../js/calendar.js', import.meta.url), 'utf8');
const live = source.slice(source.indexOf('  function g_updateLive(force)'), source.indexOf('  function buildCircadianChartHtml('));
const todayUI = source.slice(source.indexOf('  function g_applyTodayUI(){'), source.indexOf('  function createDateFromDateTime('));
function boot(selected, hour = 12, today = '19.09.2026') {
  const progress = { hidden: false }, state = {
    Date, g_todayStr: today, activeDateStr: selected,
    g_now: () => new Date(2026, 8, 19, hour),
    document: { hidden: false, getElementById: id => id === 'shift-progress-wrap' ? progress : null },
    window: {}, requestAnimationFrame() {},
    g_refreshTodayPill() {}, g_rolloverPreviewTrace() {}, g_init() {},
    __minkaCalendarLowPerf() { throw new Error('live-work'); }
  };
  vm.createContext(state); vm.runInContext(todayUI + live, state);
  return { state, progress };
}
test('past and future dates hide the entire segment and skip live work, even when forced', () => {
  for (const day of ['18.09.2026', '20.09.2026']) {
    const { state, progress } = boot(day);
    state.g_applyTodayUI(); assert.equal(progress.hidden, true);
    assert.doesNotThrow(() => state.g_updateLive(true));
    state.activeDateStr = '19.09.2026'; state.g_applyTodayUI();
    assert.equal(progress.hidden, false);
    assert.throws(() => state.g_updateLive(true), /live-work/);
  }
});
test('browsing another date still advances the live duty-day at 08:00', () => {
  const { state, progress } = boot('21.09.2026', 8, '18.09.2026');
  state.g_updateLive();
  assert.equal(state.g_todayStr, '19.09.2026');
  assert.equal(state.activeDateStr, '21.09.2026');
  assert.equal(progress.hidden, true);
});
test('before 08:00 the previous date remains the active duty-day', () => {
  const { state, progress } = boot('18.09.2026', 7, '18.09.2026');
  state.g_applyTodayUI(); assert.equal(progress.hidden, false);
  assert.throws(() => state.g_updateLive(), /live-work/);
});
