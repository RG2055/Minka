/* Compact, versioned appearance data. No DOM, timers, or network work. */
(function (root) {
  'use strict';
  var faces = ['classic', 'photo', 'orbit', 'modular'];
  var parts = ['hours', 'name', 'initials', 'month', 'coffee', 'fatigue', 'remaining', 'emoji', 'clock', 'moon'];
  // Centre x/y (%), size (%), visibility. Positions scale with the actual card.
  var layouts = {
    classic: [[50,45,100,1],[35,12,100,1],[16,12,100,0],[78,21,80,1],[14,39,90,1],[23,85,90,1],[53,85,90,1],[82,85,95,1],[50,20,100,0]],
    photo: [[68,38,130,1],[37,78,100,1],[17,14,100,0],[78,21,80,0],[16,16,90,1],[19,58,90,0],[64,92,80,1],[18,51,100,1],[50,14,90,0]],
    orbit: [[50,47,96,1],[50,72,78,1],[50,13,80,0],[77,19,80,1],[26,19,85,1],[24,84,72,1],[50,92,65,1],[78,84,78,1],[50,12,80,0]],
    modular: [[50,32,85,1],[50,12,80,1],[16,14,90,0],[77,58,95,1],[25,58,100,1],[25,83,95,1],[72,84,100,1],[85,16,100,1],[50,45,90,0]]
  };
  var moonLayouts={classic:[82,39,90,1],photo:[57,12,80,1],orbit:[57,11,75,1],modular:[17,34,90,1]};
  function bounded(n, min, max, fallback) {
    n = Number(n);
    return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n))) : fallback;
  }
  // Default only: sit beside the upper-left shoulder of the large numeral.
  // Once moved, the symbol keeps its own coordinates independently of the hours.
  function symbolPlacement(values, face) {
    var hours=values.hours||[68,38,100,1],scale=hours[2]/100;
    // The uncondensed numeral needs a full symbol-width of extra clearance.
    // High-set photo bundles also leave the top-left row for the coffee buttons.
    if(face==='classic')return fitPart([Math.round(hours[0]-38*scale),Math.round(Math.max(hours[1]<36?24:16,hours[1]-21*scale)),90,1],14.4,14.4);
    return fitPart([Math.round(hours[0]-20*scale),Math.round(hours[1]-21*scale),100,1],16,16);
  }
  function clean(value, keepSymbolPosition) {
    value = value && typeof value === 'object' ? value : {};
    var face = faces.indexOf(value.face) >= 0 ? value.face : 'classic';
    var out = { face: face, tint: /^[a-f0-9]{6}$/i.test(value.tint || '') ? value.tint.toLowerCase() : 'd5e6ef',
      metal: bounded(value.metal, 0, 11, 0), finish: bounded(value.finish, 0, 5, 0),
      imageX: bounded(value.imageX, 0, 100, 50), imageY: bounded(value.imageY, 0, 100, 50),
      imageZoom: bounded(value.imageZoom, 100, 180, 100), parts: {} };
    parts.forEach(function (key, i) {
      var base = layouts[face][i] || moonLayouts[face], p = value.parts && value.parts[key];
      if (!Array.isArray(p)) p = base;
      out.parts[key] = [bounded(p[0], 5, 95, base[0]), bounded(p[1], 5, 95, base[1]), bounded(p[2], 50, key==='hours'?300:170, base[2]), p[3] === 0 ? 0 : 1];
    });
    var oldSymbol=value.parts&&value.parts.moon;
    if(!keepSymbolPosition&&(!oldSymbol||Object.values(moonLayouts).concat([[14,68,100,1],[14,76,100,1]]).some(function(p){return p.slice(0,3).join()===oldSymbol.slice(0,3).join();}))){
      var visibility=out.parts.moon[3];out.parts.moon=symbolPlacement(out.parts,face);out.parts.moon[3]=visibility;
    }
    return out;
  }
  function preset(face, previous) {
    var value = Object.assign({}, previous || {}, { face: face, parts: null });
    if (!previous) {
      value.tint = face === 'orbit' ? 'c8e69f' : face === 'photo' ? 'f4cec7' : face === 'modular' ? '73e2de' : 'd5e6ef';
      value.metal = face === 'photo' ? 3 : face === 'orbit' ? 2 : 0;
    }
    return clean(value);
  }
  function pack(value) {
    var v = clean(value, true);
    return [2, faces.indexOf(v.face), v.tint, v.metal, v.finish, v.imageX, v.imageY, v.imageZoom]
      .concat(parts.map(function (key) { return v.parts[key].join(','); })).join('~');
  }
  function unpack(text) {
    var a = String(text || '').split('~');
    var legacy=a.length===17&&a[0]==='1';
    if ((!legacy && !(a.length===18&&a[0]==='2')) || !/^[0-3]$/.test(a[1]) || !/^[a-f0-9]{6}$/.test(a[2])) return null;
    if (!a.slice(3,8).every(function (n) { return /^\d{1,3}$/.test(n); })) return null;
    var value = { face: faces[+a[1]], tint: a[2], metal: +a[3], finish: +a[4], imageX: +a[5], imageY: +a[6], imageZoom: +a[7], parts: {} };
    for (var i = 0; i < a.length-8; i++) {
      if (!/^\d{1,2},\d{1,2},\d{2,3},[01]$/.test(a[i + 8])) return null;
      value.parts[parts[i]] = a[i + 8].split(',').map(Number);
    }
    var result = clean(value, true);
    // Reject noncanonical/out-of-range payloads rather than silently accepting them.
    var canonical=pack(result).split('~');
    if(legacy){canonical[0]='1';canonical.pop();}
    return canonical.join('~') === text ? clean(result) : null;
  }
  // Fit the measured element inside the rounded face, not just its rectangle.
  // Measurements are percentages, so this works at every preview/radio size.
  function fitPart(part, width, height, keepSize) {
    var p=part.slice();
    if (!(width>0&&height>0)) return p;
    if(keepSize&&(width>84||height>80))return p;
    var fit=keepSize?1:Math.min(1,84/width,80/height);
    var scale=Math.max(50,Math.floor(p[2]*fit)), ratio=scale/p[2];
    p[2]=scale;width*=ratio;height*=ratio;
    var hx=width/2,hy=height/2;
    function inside(x,y) {
      if(x<4||x>96||y<4||y>96)return false;
      var dx=Math.max(0,22-x,x-78),dy=Math.max(0,22-y,y-78);
      return !dx||!dy||dx*dx+dy*dy<=18*18;
    }
    function fits(x,y){return [-1,1].every(function(a){return [-1,1].every(function(b){return inside(x+a*hx,y+b*hy);});});}
    var x=Math.max(6+hx,Math.min(94-hx,p[0])),y=Math.max(8+hy,Math.min(92-hy,p[1]));
    // Moving toward the centre converges within this fixed, tiny edit-time loop.
    for(var i=0;i<50&&!fits(Math.round(x),Math.round(y));i++){x+=(50-x)*.12;y+=(50-y)*.12;}
    p[0]=Math.round(x);p[1]=Math.round(y);
    return p;
  }
  root.MinkaCardFaceModel = { faces: faces, parts: parts, clean: clean, preset: preset, pack: pack, unpack: unpack, fitPart: fitPart, symbolPlacement: symbolPlacement };
})(globalThis);
