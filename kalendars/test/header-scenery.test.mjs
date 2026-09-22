import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../js/calendar.js', import.meta.url), 'utf8');
const start = source.indexOf('(function initMinkaHeaderScenicBackground()');
const end = source.indexOf('\n})();', start) + 6;
function boot(background, version = 2) {
  const context = { window: {}, Date, Intl, localStorage: { getItem: () => JSON.stringify({ version, background }) },
    document: { readyState: 'loading', addEventListener() {}, getElementById: () => null } };
  vm.runInNewContext(source.slice(start, end), context);
  return context.window.MinkaHeaderScenic;
}
test('the Latvian scene retains the original Europe/Riga time boundaries', () => {
  for (const scene of ['riga']) {
    const api = boot(scene);
    assert.equal(api.getScene(), scene);
    for (const [time, period] of [['01:59:59','night'], ['02:00:00','morning'], ['06:00:00','day'], ['14:00:00','sunset'], ['19:00:00','night']]) {
      assert.equal(api.getHeaderPeriod(new Date('2026-09-19T' + time + 'Z')), period);
    }
    assert.equal(api.getMillisecondsUntilNextPeriod(new Date('2026-09-19T17:30:00Z')), 90 * 60 * 1000);
  }
});
test('the four local scenery files exist and unknown locations fall back to the collection', () => {
  const api = boot('alps');
  assert.equal(api.getScene(), 'mix', 'the collection is the default');
  assert.equal(boot('coast').getScene(), 'mix', 'the retired coast falls back to the collection');
  api.setScene('riga'); assert.equal(api.getScene(), 'riga');
  api.setScene('unknown'); assert.equal(api.getScene(), 'mix');
  // Riga is the real St Peter's tower panorama (2026-09-20).
  for (const period of ['morning', 'day', 'sunset', 'night']) {
    assert.ok(fs.statSync(new URL(`../data/header-backgrounds/header-riga-${period}-20260920.webp`, import.meta.url)).size > 0);
  }
});
