// One full-window screenshot at the fixed clock (day), radio closed, then open: res/shot-<LABEL>-{closed,open}.png.
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
const LABEL = process.env.LABEL || 'run';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  await ctx.addInitScript(`(() => { let s = 1234567; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`);
  console.log('variant:', await applyVariant(ctx), LABEL);
  const p = await ctx.newPage();
  await applyVariant.setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(14000);
  await p.screenshot({ path: `${__dirname}/res/shot-${LABEL}-closed.png` });
  await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(3000);
  await p.screenshot({ path: `${__dirname}/res/shot-${LABEL}-open.png` });
  await b.close();
})();
