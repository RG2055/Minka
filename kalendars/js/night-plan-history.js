/* Saved plans describe intended work, not verified sleep or actual call-outs. */
(function (root) {
  'use strict';
  const MAX_REVISIONS = 64;
  function shape(value) {
    if (!value || !Array.isArray(value.order) || value.order.length < 2 || value.order.length > 8) return null;
    const order=value.order.map(n=>String(n||'').trim());
    if (order.some(n=>!n || n.length>64 || /[<>&"'`\\\u0000-\u001f]/.test(n)) || new Set(order).size!==order.length) return null;
    const sh=Number(value.sh),ei=Number(value.ei);
    if (![23,23.5,0,0.5,1].includes(sh) || ![0,1,2].includes(ei)) return null;
    return {order,sh,ei};
  }
  function same(a,b) {return !!a && !!b && a.sh===b.sh && a.ei===b.ei && JSON.stringify(a.order)===JSON.stringify(b.order);}
  function revisions(value) {
    if (!value) return [];
    const list=Array.isArray(value.revisions)?value.revisions:[{...value,from:value.savedAt}];
    const out=[];
    for (const r of list.slice(0,MAX_REVISIONS)) {
      const p=shape(r),from=Number(r.from);
      if (p && Number.isFinite(from) && from>0) out.push({...p,from});
    }
    return out.sort((a,b)=>a.from-b.from).filter((r,i,all)=>!i || r.from!==all[i-1].from);
  }
  function save(previous,next,now=Date.now()) {
    const p=shape(next); if (!p) throw new Error('Invalid night plan');
    const history=revisions(previous);
    if (!same(history[history.length-1],p)) {
      if(history.length>=MAX_REVISIONS) throw new Error('Night plan history is full');
      history.push({...p,from:Math.max(now,(history.at(-1)?.from||0)+1)});
    }
    return {...next,...p,revisions:history,savedAt:now};
  }
  function receive(previous,remote) {
    // Old servers/clients may omit revisions. Preserve the history this device
    // already knows and date the received change instead of rewriting the night.
    if(Array.isArray(remote.revisions) && remote.revisions.length) return {...remote,revisions:revisions(remote)};
    return save(previous,remote,Number(remote.savedAt)||Date.now());
  }
  root.MinkaNightHistory={shape,revisions,save,receive};
})(globalThis);
