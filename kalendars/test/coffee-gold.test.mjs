import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({ document: { addEventListener() {} }, setTimeout() {}, clearTimeout() {} });
ctx.window = ctx;
vm.runInContext(fs.readFileSync(new URL('../js/page/coffee-gold.js', import.meta.url), 'utf8'), ctx);
const gold = ctx.MkCoffeeGold;

test('a golden can is the same on every device and comes about once in fifteen drinks', () => {
  assert.equal(gold.is('Anna Bērziņa', 'monster', 3), gold.is('  ANNA   BĒRZIŅA ', 'monster', 3));
  let n = 0;
  for (let i = 1; i <= 30000; i++) if (gold.is('Tests Testiņš', 'philips', i)) n++;
  assert.ok(Math.abs(n / 30000 - 1 / 15) < .01, String(n));
});
