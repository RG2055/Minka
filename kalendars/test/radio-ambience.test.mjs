import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/radio-ambience.js', import.meta.url), 'utf8');
function element() {
  const classes=new Set(), attrs=new Map(), props=new Map(), events={};
  return {isConnected:true, events, children:[], style:{display:'',setProperty:(k,v)=>props.set(k,v),getPropertyValue:k=>props.get(k)||''},
    classList:{contains:c=>classes.has(c),add:c=>classes.add(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c);}},
    setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k),hasAttribute:k=>attrs.has(k),
    appendChild(el){this.children.push(el);el.parentNode=this;},querySelectorAll:()=>[],querySelector:()=>null,
    addEventListener:(k,fn)=>events[k]=fn};
}
function harness({child=false,cores=8,reduced=false}={}) {
  const root=element(), body=element(), radio=element(), frame=element(), overlay=element();
  const devents={},wevents={},observers=[],intersections=[],messages=[];
  body.classList.add('radio-idle');
  const parent={postMessage:(data,origin)=>messages.push({data,origin})};
  frame.contentWindow={postMessage:(data,origin)=>messages.push({data,origin})};
  const media={matches:reduced,addEventListener:(type,fn)=>media.change=fn};
  const document={documentElement:root,body,hidden:false,createElement:element,addEventListener:(k,fn)=>devents[k]=fn,
    getElementById:id=>({radioWindow:child?null:radio,calIframe:child?null:frame,nsOverlay:child?overlay:null}[id]||null)};
  const window={location:{origin:'http://localhost:8012'},navigator:{hardwareConcurrency:cores},matchMedia:()=>media,
    addEventListener:(k,fn)=>wevents[k]=fn};
  window.parent=child?parent:window;
  vm.runInNewContext(source,{window,document,
    MutationObserver:class {constructor(fn){this.fn=fn;}observe(target){observers.push({target,fn:this.fn});}},
    IntersectionObserver:class {constructor(fn){this.fn=fn;intersections.push(this);this.targets=new Set();}observe(el){this.targets.add(el);}unobserve(el){this.targets.delete(el);}}
    // Intentionally no fetch, timers or requestAnimationFrame: the controller
    // must work entirely through visibility, intersection and state events.
  });
  return {root,body,radio,frame,overlay,document,window,media,messages,intersections,
    changed(target){observers.filter(o=>o.target===target).forEach(o=>o.fn());},
    visibility(hidden){document.hidden=hidden;devents.visibilitychange();},
    receive(data,from=parent,origin=window.location.origin){wevents.message({data,source:from,origin});},
    host(expanded,visible=true){this.receive({type:'minka-radio-ambient',expanded,visible,color:'83,201,232'});}};
}
const has=(h,c)=>h.root.classList.contains(c);

test('radio ambience follows open/minimized/closed state and sends only changes',()=>{
  const h=harness();assert.equal(has(h,'minka-ambient-active'),false);
  assert.equal(h.body.children.length,1,'one background across the whole PWA');
  assert.equal(h.radio.children.length,0,'radio retains its own original surface');
  h.body.classList.toggle('radio-idle',false);h.changed(h.body);
  assert.equal(has(h,'minka-ambient-moving'),true);
  const count=h.messages.length;h.changed(h.body);assert.equal(h.messages.length,count);
  h.body.classList.add('radio-hidden');h.changed(h.body);
  assert.equal(has(h,'minka-ambient-active'),false);assert.equal(has(h,'minka-ambient-moving'),false);
  h.body.classList.toggle('radio-hidden',false);h.changed(h.body);
  assert.equal(has(h,'minka-ambient-active'),true);
  h.radio.style.display='none';h.changed(h.radio);assert.equal(has(h,'minka-ambient-active'),false);
});
test('hidden PWA pauses immediately and restores the latest palette',()=>{
  const h=harness();h.body.classList.toggle('radio-idle',false);h.changed(h.body);
  h.visibility(true);assert.equal(has(h,'minka-ambient-moving'),false);
  assert.equal(h.messages.at(-1).data.visible,false);
  h.radio.style.setProperty('--radio-ambient-rgb','227,61,53');h.changed(h.radio);
  assert.equal(has(h,'minka-ambient-active'),false);
  h.visibility(false);assert.equal(has(h,'minka-ambient-moving'),true);
  assert.equal(h.root.style.getPropertyValue('--radio-ambient-rgb'),'227,61,53');
});
test('full-screen music stops the covered calendar ambience and dreams',()=>{
  const h=harness();h.body.classList.toggle('radio-idle',false);h.changed(h.body);
  h.body.classList.add('lacitis-full');h.changed(h.body);
  assert.equal(has(h,'minka-ambient-active'),false);
  assert.equal(h.messages.at(-1).data.visible,false);
  h.body.classList.toggle('lacitis-full',false);h.changed(h.body);
  assert.equal(has(h,'minka-ambient-moving'),true);
});
test('calendar accepts only its own parent and validates message shape',()=>{
  const h=harness({child:true});
  assert.equal(h.body.children.length,0,'no separate rectangular glow inside the calendar');
  const data={type:'minka-radio-ambient',expanded:true,visible:true,color:'83,201,232'};
  h.receive(data,{});assert.equal(has(h,'minka-ambient-active'),false);
  h.receive(data,undefined,'https://untrusted.example');assert.equal(has(h,'minka-ambient-active'),false);
  h.receive({...data,expanded:'true'});assert.equal(has(h,'minka-ambient-active'),false);
  h.receive(data);assert.equal(has(h,'minka-ambient-active'),true);
  h.host(true,false);assert.equal(has(h,'minka-ambient-active'),false);
  h.host(true);assert.equal(has(h,'minka-ambient-active'),true);
});
test('dreams animate only in an open visible night panel with the radio minimized',()=>{
  const h=harness({child:true});h.overlay.classList.add('open');h.changed(h.overlay);
  assert.equal(has(h,'ns-motion-active'),true);
  h.host(true);assert.equal(has(h,'ns-motion-active'),false);
  h.host(false);assert.equal(has(h,'ns-motion-active'),true);
  h.host(false,false);assert.equal(has(h,'ns-motion-active'),false);
  h.host(false);h.visibility(true);assert.equal(has(h,'ns-motion-active'),false);
  h.visibility(false);assert.equal(has(h,'ns-motion-active'),true);
  h.overlay.classList.toggle('open',false);h.changed(h.overlay);assert.equal(has(h,'ns-motion-active'),false);
});
test('modest devices and reduced-motion preferences retain static visuals',()=>{
  for(const options of [{cores:2},{reduced:true}]){
    const h=harness(options);h.body.classList.toggle('radio-idle',false);h.changed(h.body);
    assert.equal(has(h,'minka-ambient-active'),true);assert.equal(has(h,'minka-ambient-moving'),false);
    const child=harness({...options,child:true});child.overlay.classList.add('open');child.changed(child.overlay);
    assert.equal(has(child,'ns-motion-active'),false);
  }
  const h=harness();h.body.classList.toggle('radio-idle',false);h.changed(h.body);
  h.media.matches=true;h.media.change();assert.equal(has(h,'minka-ambient-moving'),false);
});
test('Fluent strips load only on screen, pause off screen, and old beds are released',()=>{
  const h=harness({child:true}), dream=element(), film=element(), sprite=element();
  film.setAttribute('data-src','assets/emoji-anim/cat.webp');film.parentNode=sprite;
  dream.querySelector=()=>film;h.window.__nsObserveDream(dream);
  assert.equal(film.src,undefined);
  h.overlay.classList.add('open');h.changed(h.overlay);assert.equal(film.src,undefined);
  const io=h.intersections[0];io.fn([{target:dream,isIntersecting:true}]);
  assert.equal(film.src,'assets/emoji-anim/cat.webp');assert.equal(dream.classList.contains('is-in-view'),true);
  film.naturalWidth=72;film.naturalHeight=72*72;film.onload();
  assert.equal(sprite.classList.contains('is-ready'),true);
  assert.equal(sprite.style.getPropertyValue('--dream-frames'),72);
  io.fn([{target:dream,isIntersecting:false}]);assert.equal(dream.classList.contains('is-in-view'),false);
  dream.isConnected=false;h.window.__nsObserveDream(element());assert.equal(io.targets.has(dream),false);
});

test('every dream has an existing Fluent strip, a matching frame count and stable markup',()=>{
  const ns=fs.readFileSync(new URL('../js/nightsplit.js',import.meta.url),'utf8');
  const code=ns.slice(ns.indexOf('  var dreamScenes='),ns.indexOf('  function refreshBedDream('));
  const manifest=JSON.parse(fs.readFileSync(new URL('../assets/emoji-anim/manifest.json',import.meta.url),'utf8'));
  let phones=false, date='08.09.2026', randomCalls=0;
  const c=vm.createContext({_nameHash:name=>Number(name),dreamPhones:()=>phones,activeDateKey:()=>date,Math:{floor:Math.floor,random:()=>{randomCalls++;return .31;}}});vm.runInContext(code,c);
  const files=new Set();
  for(let i=0;i<16;i++){
    const html=c.dreamContents(String(i));assert.equal(html,c.dreamContents(String(i)));
    const file=html.match(/data-src="assets\/emoji-anim\/([^"]+)"/)[1];
    files.add(file);
    assert.equal(html.match(/<img /g).length,1);
    const info=Object.values(manifest.emoji).find(v=>v.file===file);assert.ok(info);
    assert.equal(Number(html.match(/--dream-frames:(\d+)/)[1]),info.frames);
    assert.ok(fs.existsSync(new URL('../assets/emoji-anim/'+file,import.meta.url)));
    assert.doesNotMatch(html,/card-addons|☁|🌈|rainbow/);
    assert.match(html,/<svg class="ns-dream-cloud"/);
  }
  assert.equal(files.size,16,'a shuffled set has sixteen distinct subjects');
  assert.equal([...files].filter(file=>file.includes('cat')).length,2,'cats remain part of a broader mix');
  const choices=Array.from({length:16},(_,i)=>c.pickDreamScene(String(i)));
  assert.equal(choices.filter(scene=>scene.object).length,8,'half the dreams show objects');
  for(let i=1;i<choices.length;i++) assert.notEqual(!!choices[i].object,!!choices[i-1].object,'neighbours mix objects and animals');
  const calls=randomCalls;
  c.dreamContents('1');assert.equal(randomCalls,calls,'ordinary redraw does not shuffle or change scenes');
  date='09.09.2026';c.dreamContents('1');assert.ok(randomCalls>calls,'another roster date gets a fresh shuffle');
  phones=true;
  assert.equal(c.dreamContents('1').match(/ns-room-device /g).length,4);
  assert.match(c.dreamContents('1'),/ns-dream-scene is-phones/);
});
