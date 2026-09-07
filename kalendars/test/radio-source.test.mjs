import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../../js/radio-source.js', import.meta.url), 'utf8');
function setup() {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set();
      nodes.set(id, { style: {}, textContent: '', attributes: {}, classList: {
        add: (...args) => args.forEach(x => classes.add(x)),
        remove: (...args) => args.forEach(x => classes.delete(x)),
        contains: x => classes.has(x)
      }, setAttribute(k,v) { this.attributes[k] = v; }, remove() {} });
    }
    return nodes.get(id);
  }
  const scripts = [];
  const calls = { open:0, close:0, pause:0, minimize:0 };
  const document = { getElementById: node, body:node('body'), createElement:()=>node('script'+scripts.length), head:{ appendChild:s=>scripts.push(s) } };
  const window = { __minimizeMusicPanel(){calls.minimize++;}, syncShellLayout(){}, openLacMini(){calls.open++;}, __hideLacMiniForRadio(){calls.close++;}, __mkPauseRadioForLacitis(){calls.pause++;} };
  vm.runInNewContext(source, {document,window});
  return {window,document,scripts,calls,node};
}
test('music stays dormant until selected and shares one script load', async () => {
  const s=setup(); assert.equal(s.scripts.length,0);
  const pending=s.window.setRadioSource('music');
  assert.equal(s.calls.pause,1); assert.equal(s.calls.open,0); assert.equal(s.scripts.length,1);
  s.scripts[0].onload(); await pending;
  assert.equal(s.calls.open,1);
  await s.window.setRadioSource('radio');
  assert.equal(s.calls.close,1); assert.equal(s.node('radioWindow').classList.contains('music-source'),false);
  await s.window.setRadioSource('music'); assert.equal(s.scripts.length,1);
});
test('late music load cannot reopen after selecting radio or hiding the shell',async()=>{
  for (const action of ['radio','hide']) {
    const s=setup();const pending=s.window.setRadioSource('music');
    if(action==='radio') await s.window.setRadioSource('radio');
    else s.document.body.classList.add('radio-hidden');
    s.scripts[0].onload();await pending;
    assert.equal(s.calls.open,0);
  }
});
test('failed lazy load can retry without starting two players',async()=>{
  const s=setup();const failed=s.window.setRadioSource('music');s.scripts[0].onerror();await failed;
  assert.equal(s.calls.open,0);assert.match(s.node('radioSourceStatus').textContent,/Neizdevās/);
  const retry=s.window.setRadioSource('music');s.scripts[1].onload();await retry;
  assert.equal(s.calls.open,1);
});

test('minimize and restore preserve the player; switching sources closes it', async()=>{
  const s=setup();
  const pending=s.window.setRadioSource('music');s.scripts[0].onload();await pending;
  s.window.minimizeRadioMusic();
  assert.equal(s.calls.minimize,1);assert.equal(s.calls.close,0);
  assert.equal(s.node('radioToggleLabel').textContent,'MŪZIKA');
  assert.equal(s.node('radioToggle').attributes['aria-expanded'],'false');
  assert.equal(s.window.toggleRadioMusicVisibility(),true);
  await Promise.resolve();
  assert.equal(s.calls.open,2);assert.equal(s.scripts.length,1);assert.equal(s.calls.close,0);
  assert.equal(s.node('radioToggle').attributes['aria-expanded'],'true');
  await s.window.setRadioSource('radio');
  assert.equal(s.calls.close,1);assert.equal(s.window.toggleRadioMusicVisibility(),false);
});
