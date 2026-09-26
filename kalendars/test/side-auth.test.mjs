import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// The fetch wrapper in both pages that sends the login token to the coffee and
// feedback workers (and to nothing else).
for (const page of ['../../index.html', '../index.html']) {
  test(`${page}: coffee/feedback requests carry the login token, others do not`, async () => {
    const html = fs.readFileSync(new URL(page, import.meta.url), 'utf8');
    const start = html.indexOf('  // Coffee and feedback workers take the same login token');
    const code = html.slice(start, html.indexOf('  })();', start) + 7);
    const calls = [];
    const c = vm.createContext({ URL, Headers, token: 'secret' });
    c.window = c;
    c.window.location = { href: 'https://rg2055.github.io/Minka/' };
    c.window.fetch = (input, init) => { calls.push({ input, init }); return Promise.resolve('ok'); };
    vm.runInContext('function getToken() { return token; }' + code, c);

    await c.window.fetch('https://coffee.rgapp.page/api/coffee?date=01.09.2026', { cache: 'no-store' });
    await c.window.fetch('https://feedback.rgapp.page/api/radio', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    await c.window.fetch('https://example.com/api/coffee', { cache: 'no-store' });
    await c.window.fetch('assets/x.png');

    assert.equal(calls[0].init.headers.get('authorization'), 'Bearer secret');
    assert.equal(calls[0].init.cache, undefined);
    assert.equal(calls[1].init.headers.get('authorization'), 'Bearer secret');
    assert.equal(calls[1].init.headers.get('content-type'), 'application/json');
    assert.equal(calls[1].init.method, 'POST');
    assert.equal(calls[2].init.cache, 'no-store', 'other hosts are untouched');
    assert.equal(calls[2].init.headers, undefined);
    assert.equal(calls[3].init, undefined);

    c.token = '';
    await c.window.fetch('https://coffee.rgapp.page/api/coffee?totals=1');
    assert.equal(calls[4].init.headers.get('authorization'), null, 'no token, no header');
  });
}
