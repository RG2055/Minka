/* Compact, versioned appearance data. No DOM, timers, or network work. */
(function (root) {
  'use strict';
  var faces = ['classic', 'photo', 'orbit', 'modular', 'winamp', 'dither', 'gameboy', 'thermo', 'dots', 'lines'];
  var parts = ['hours', 'name', 'initials', 'month', 'coffee', 'fatigue', 'remaining', 'emoji', 'clock', 'moon'];
  // Elements that sit on a plate (the watch's complications), and the plate each can
  // take: 0 as the card, 1 dark, 2 clear (no plate), 3 tinted, 4 light.
  var plateParts = ['initials', 'month', 'coffee', 'fatigue', 'remaining', 'emoji', 'clock'];
  /* Centre x/y (%), size (%), visibility. Positions scale with the actual card.
     Every layout sits on the same grid, so nothing is ever drawn over anything:
       top row  (y ≈ 15) — the sun/moon, the name, the month's hours;
       middle   (y ≈ 50) — the big number in its own zone, the coffee cup and the
                           emoji at its sides;
       bottom   (y ≈ 86) — fatigue and the shift time.
     The top and bottom rows keep in from the rounded corners (usable ≈ 12–88 %).
     Each face keeps its character on that grid (Foto: the number to the right;
     Loks: the name under the number; Moduļi: a 2×2 grid; Gameboy: the buttons on
     its body). Order: hours, name, initials, month, coffee, fatigue, remaining,
     emoji, clock; the sun/moon is in moonLayouts. */
  var layouts = {
    classic: [[50,50,90,1],[45,15,80,1],[16,12,100,0],[79,16,66,1],[13,50,80,1],[29,86,80,1],[67,86,84,1],[87,50,80,1],[50,20,100,0]],
    photo:   [[64,50,92,1],[40,15,80,1],[16,12,100,0],[80,16,64,1],[16,50,80,1],[29,86,80,1],[67,86,84,1],[16,68,78,1],[50,20,100,0]],
    orbit:   [[50,44,84,1],[50,70,72,1],[16,12,100,0],[78,16,64,1],[22,16,78,1],[27,86,66,1],[58,87,70,1],[83,85,68,1],[50,20,100,0]],
    modular: [[50,36,74,1],[42,13,76,1],[16,12,100,0],[73,64,86,1],[27,64,86,1],[27,87,86,1],[73,87,86,1],[84,14,70,1],[50,45,90,0]],
    // Player face: positions are percentages of the display window (card-winamp.css draws its own layout).
    winamp: [[56,40,100,1],[50,66,90,1],[83,76,100,0],[85,15,85,1],[13,91,70,1],[17,58,90,1],[52,93,85,1],[83,76,95,1],[50,30,90,0]],
    // Dither: the classic grid; the look comes from card-dither.css.
    dither:  [[50,50,90,1],[45,15,80,1],[16,12,100,0],[79,16,66,1],[13,50,80,1],[29,86,80,1],[67,86,84,1],[87,50,80,1],[50,20,100,0]],
    // Gameboy: everything on the LCD (top 78 %); coffee and emoji are its buttons on the body.
    gameboy: [[50,42,78,1],[40,16,74,1],[16,12,100,0],[76,17,62,1],[28,89,76,1],[30,68,72,1],[70,68,76,1],[79,89,76,1],[50,20,100,0]],
    // Termostats: the reading top left, like a thermostat; the dial fills the lower right and
    // holds the outdoor temperature (card-faces.js), so the chips keep to the left and the top.
    thermo:  [[38,49,88,1],[36,15,78,1],[16,12,100,0],[82,17,60,1],[84,54,74,1],[25,84,70,1],[57,87,72,1],[84,36,74,1],[50,20,100,0]],
    // Punkti: a dot-matrix sign, the reading in the middle, the name small under it.
    dots:    [[50,45,92,1],[50,75,76,1],[16,12,100,0],[80,16,60,1],[22,88,70,1],[24,16,64,1],[50,89,74,1],[80,88,70,1],[50,20,100,0]],
    // Līnijas: line drawings on paper, the reading to the right of the circles; the circles stay
    // clear — the cup leads the bottom row, the emoji sits in the top row between name and hours.
    lines:   [[62,50,90,1],[34,14,78,1],[16,12,100,0],[82,17,60,1],[16,85,70,1],[38,85,66,1],[68,85,68,1],[65,15,60,1],[50,20,100,0]]
  };
  var moonLayouts={classic:[15,16,70,1],photo:[16,32,70,1],orbit:[50,16,64,1],modular:[16,36,70,1],winamp:[26,15,95,1],dither:[15,16,70,1],gameboy:[17,42,66,1],thermo:[62,15,62,1],dots:[50,15,60,1],lines:[16,40,64,1]};
  // Default sun/moon spots saved by earlier versions: recognised as "not moved by the person".
  var OLD_MOONS=[[14,68,100,1],[14,76,100,1],[82,39,90,1],[57,12,80,1],[57,11,75,1],[17,34,90,1],[16,34,78,1],[12,13,70,1],[50,13,70,1],[86,40,70,1],[60,12,62,1]];
  /* Faces that bring their own palette (ink, frame, digits): taken when a card
     switches to them, so a light accent never ends up on a light LCD or paper. */
  var looks={winamp:{tint:'9dff4a'},gameboy:{tint:'2f4a1f',metal:7,finish:7},thermo:{tint:'8fd8ff',metal:9,finish:8},dots:{tint:'1f1f24',metal:3,finish:6},lines:{tint:'1f1c17',metal:10,finish:2}};
  function bounded(n, min, max, fallback) {
    n = Number(n);
    return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n))) : fallback;
  }
  // Default only: sit beside the upper-left shoulder of the large numeral.
  // Once moved, the symbol keeps its own coordinates independently of the hours.
  function symbolPlacement(values, face) {
    var hours=values.hours||[68,38,100,1],scale=hours[2]/100;
    if(moonLayouts[face])return moonLayouts[face].slice();   // its place on the face's grid
    // The uncondensed numeral needs a full symbol-width of extra clearance.
    // High-set photo bundles also leave the top-left row for the coffee buttons.
    if(face==='classic')return fitPart([Math.round(hours[0]-38*scale),Math.round(Math.max(hours[1]<36?24:16,hours[1]-21*scale)),90,1],14.4,14.4);
    return fitPart([Math.round(hours[0]-20*scale),Math.round(hours[1]-21*scale),100,1],16,16);
  }
  function clean(value, keepSymbolPosition) {
    value = value && typeof value === 'object' ? value : {};
    var face = faces.indexOf(value.face) >= 0 ? value.face : 'classic';
    var out = { face: face, tint: /^[a-f0-9]{6}$/i.test(value.tint || '') ? value.tint.toLowerCase() : 'd5e6ef',
      metal: bounded(value.metal, 0, 23, 0), finish: bounded(value.finish, 0, 8, 0),
      imageX: bounded(value.imageX, 0, 100, 50), imageY: bounded(value.imageY, 0, 100, 50),
      imageZoom: bounded(value.imageZoom, 100, 180, 100), parts: {} };
    out.coffeeMode=bounded(value.coffeeMode,0,1,1);
    // Chosen by the person (stored), or not: then the app's default applies,
    // which is the coffee icon that opens into − / + (see effectiveCoffeeMode).
    out.coffeeExplicit=value.coffeeExplicit&&out.coffeeMode===1?1:0;   // only "always − / +" needs the mark
    out.coffeeContrast=bounded(value.coffeeContrast,0,2,0);
    // Per-element colour overrides (empty = the shared glass tint) and the
    // iOS-style full tint strength (0 = off) that recolours the whole card.
    out.colors={};
    parts.forEach(function (key) { var c=value.colors&&value.colors[key]; out.colors[key]=/^[a-f0-9]{6}$/i.test(c||'')?String(c).toLowerCase():''; });
    // Whole-card look: 0 default, 1 dark, 2 clear, 3 tinted (hue/light, or
    // the picture's own palette when auto is on).
    out.fullTintMode=bounded(value.fullTintMode,0,3,0);
    out.fullTintHue=bounded(value.fullTintHue,0,360,210);
    out.fullTintIntensity=bounded(value.fullTintIntensity,0,100,80);
    out.fullTintAuto=value.fullTintAuto===1||value.fullTintAuto===true?1:0;
    out.fullTintScheme=bounded(value.fullTintScheme,0,2,0); // 0 auto, 1 light, 2 dark
    out.plates={};
    parts.forEach(function (key) { out.plates[key]=plateParts.indexOf(key)>=0?bounded(value.plates&&value.plates[key],0,4,0):0; });
    parts.forEach(function (key, i) {
      var base = layouts[face][i] || moonLayouts[face], p = value.parts && value.parts[key];
      if (!Array.isArray(p)) p = base;
      out.parts[key] = [bounded(p[0], 5, 95, base[0]), bounded(p[1], 5, 95, base[1]), bounded(p[2], 50, key==='hours'?300:170, base[2]), p[3] === 0 ? 0 : 1];
    });
    var oldSymbol=value.parts&&value.parts.moon;
    // A sun/moon still at any default spot (today's, or one an older version stored) takes the face's designed spot.
    if(!keepSymbolPosition&&(!oldSymbol||Object.values(moonLayouts).concat(OLD_MOONS).some(function(p){return p.slice(0,3).join()===oldSymbol.slice(0,3).join();}))){
      var visibility=out.parts.moon[3];out.parts.moon=symbolPlacement(out.parts,face);out.parts.moon[3]=visibility;
    }
    return out;
  }
  function preset(face, previous) {
    var value = Object.assign({}, previous || {}, { face: face, parts: null });
    if (!previous) {
      value.tint = face === 'orbit' ? 'c8e69f' : face === 'photo' ? 'f4cec7' : face === 'modular' ? '73e2de' : face === 'winamp' ? '9dff4a' : face === 'dither' ? 'eceae4' : 'd5e6ef';
      value.metal = face === 'photo' ? 3 : face === 'orbit' ? 2 : 0;
    }
    // A new arrangement uses the compact coffee cup (tap opens − / +), unless the person chose "always − / +".
    if (!value.coffeeExplicit) value.coffeeMode = 0;
    // Switching into a face with its own palette takes that palette; leaving one for a
    // plain face gives back that face's own colours (dark ink on dark glass is unreadable).
    // Per-element colours belong to the palette they were chosen for: entering or leaving
    // a face with its own palette starts them fresh (a turquoise numeral on a Gameboy LCD clashes).
    var paletteChange = (looks[face] && (!previous || previous.face !== face)) || (previous && looks[previous.face] && !looks[face]);
    if (paletteChange) { value.colors = {}; value.fullTintMode = 0; }
    if (looks[face] && (!previous || previous.face !== face)) Object.assign(value, looks[face]);
    else if (previous && looks[previous.face] && !looks[face]) { var plain = preset(face, null); value.tint = plain.tint; value.metal = plain.metal; value.finish = plain.finish; }
    return clean(value);
  }
  function pack(value) {
    var v = clean(value, true);
    // v5 adds each element's plate (only when one is chosen, so older looks keep their text)
    var plated=parts.some(function (key) { return v.plates[key]; });
    var colored=plated||parts.some(function (key) { return v.colors[key]; })||v.fullTintMode>0;
    var extra=colored||v.coffeeExplicit||v.coffeeMode!==1||v.coffeeContrast!==0;
    return [plated?5:colored?4:extra?3:2, faces.indexOf(v.face), v.tint, v.metal, v.finish, v.imageX, v.imageY, v.imageZoom]
      .concat(parts.map(function (key) { return v.parts[key].join(','); }))
      .concat(extra?[v.coffeeMode,v.coffeeContrast]:[])
      .concat(colored?[parts.map(function (key) { return v.colors[key]||'-'; }).join(','),[v.fullTintMode,v.fullTintHue,v.fullTintIntensity,v.fullTintAuto,v.fullTintScheme].join(',')]:[])
      .concat(plated?[parts.map(function (key) { return v.plates[key]; }).join('')]:[]).join('~');
  }
  function unpack(text) {
    var a = String(text || '').split('~');
    var legacy=a.length===17&&a[0]==='1';
    var coffee=a.length===20&&a[0]==='3';
    var plated=a.length===23&&a[0]==='5';
    var colored=(a.length===22&&a[0]==='4')||plated;
    if ((!legacy && !coffee && !colored && !(a.length===18&&a[0]==='2')) || !/^[0-9]$/.test(a[1]) || !/^[a-f0-9]{6}$/.test(a[2])) return null;
    if (!a.slice(3,8).every(function (n) { return /^\d{1,3}$/.test(n); })) return null;
    var value = { face: faces[+a[1]], tint: a[2], metal: +a[3], finish: +a[4], imageX: +a[5], imageY: +a[6], imageZoom: +a[7], parts: {} };
    if(coffee||colored){if(!/^[01]$/.test(a[18])||!/^[0-2]$/.test(a[19]))return null;value.coffeeMode=+a[18];value.coffeeContrast=+a[19];
      // A stored coffee setting counts as chosen (colour-only looks store the default too).
      value.coffeeExplicit=a[18]==='1'&&(coffee||a[19]!=='0')?1:0;}
    if(colored){
      var colors=a[20].split(',');
      var look=a[21].split(',');
      if(colors.length!==parts.length||!colors.every(function (c) { return c==='-'||/^[a-f0-9]{6}$/.test(c); })||look.length!==5||!/^[0-3]$/.test(look[0])||!/^\d{1,3}$/.test(look[1])||!/^\d{1,3}$/.test(look[2])||!/^[01]$/.test(look[3])||!/^[0-2]$/.test(look[4]))return null;
      value.colors={};parts.forEach(function (key, i) { value.colors[key]=colors[i]==='-'?'':colors[i]; });
      if(plated){ if(!/^[0-4]{10}$/.test(a[22]))return null; value.plates={}; parts.forEach(function (key, i) { value.plates[key]=+a[22][i]; }); }
      value.fullTintMode=+look[0];value.fullTintHue=+look[1];value.fullTintIntensity=+look[2];value.fullTintAuto=+look[3];value.fullTintScheme=+look[4];
    }
    for (var i = 0; i < (legacy?9:10); i++) {
      if (!/^\d{1,2},\d{1,2},\d{2,3},[01]$/.test(a[i + 8])) return null;
      value.parts[parts[i]] = a[i + 8].split(',').map(Number);
    }
    var result = clean(value, true);
    // Reject noncanonical/out-of-range payloads rather than silently accepting them.
    var canonical=pack(result).split('~');
    if(legacy){canonical[0]='1';canonical.pop();}
    return canonical.join('~') === text ? clean(result) : null;
  }
  function coffeeColors(rgb, useTint) {
    var c=String(rgb||'100,150,190').split(',').map(Number);
    if(c.length!==3||c.some(function(n){return !Number.isFinite(n)||n<0||n>255;}))c=[100,150,190];
    var light=(c[0]*.2126+c[1]*.7152+c[2]*.0722)>148;
    if(useTint)return {background:'rgb('+c.map(function(n){return Math.round(12+n*.15);}).join(',')+')',foreground:'rgb('+c.map(function(n){return light?n:Math.round(191+n*.25);}).join(',')+')'};
    return {background:'rgb('+c.map(function(n){return Math.round(light?220+n*.12:12+n*.15);}).join(',')+')',foreground:light?'#15202c':'#ffffff'};
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
  // Coffee on a card. /rad: the person's own choice, otherwise the icon (0).
  // The radiographers (RG) keep the stored mode as it always was.
  function effectiveCoffeeMode(v) {
    if (!v) return 0;
    if (root.MINKA_APP !== 'rad') return v.coffeeMode;
    return v.coffeeExplicit ? v.coffeeMode : 0;
  }
  /* Analog timer placement. The dial (31 % of the card at scale 1) is much bigger
     than the digital chip a layout was drawn for, so where it would cover another
     element it moves to the nearest free spot (or gets a little smaller). Sizes are
     the elements' measured boxes at scale 1, in % of the card; the big numeral is
     avoided when there is room, otherwise the dial may sit over it. Pure data: the
     same answer on every card, no measuring. */
  var PART_BOX={name:[55,21],initials:[20,20],month:[26,23],coffee:[30,20],fatigue:[32,21],remaining:[30,16],emoji:[17,17],clock:[26,20],moon:[16,16],hours:[60,51]};
  function boxOf(key,p){var sz=PART_BOX[key],s=p[2]/100;return [p[0]-sz[0]*s/2,p[1]-sz[1]*s/2,p[0]+sz[0]*s/2,p[1]+sz[1]*s/2];}
  function overlapArea(a,b){var w=Math.min(a[2],b[2])-Math.max(a[0],b[0]),h=Math.min(a[3],b[3])-Math.max(a[1],b[1]);return w>0&&h>0?w*h:0;}
  function fitDial(value){
    var p=value&&value.parts&&value.parts.remaining;
    if(!p||!p[3])return value;
    var near=parts.filter(function(k){return k!=='remaining'&&k!=='hours'&&value.parts[k]&&value.parts[k][3];}).map(function(k){return boxOf(k,value.parts[k]);});
    var withHours=value.parts.hours&&value.parts.hours[3]?near.concat([boxOf('hours',value.parts.hours)]):near;
    function free(x,y,s,obstacles){
      var h=31*s/2;if(x-h<1||x+h>99||y-h<1||y+h>99)return false;
      var b=[x-h,y-h,x+h,y+h];
      return obstacles.every(function(o){return overlapArea(b,o)<=.5;});
    }
    var s0=Math.max(.5,p[2]/100);
    if(free(p[0],p[1],s0,near))return value;   // already fine where it is (the numeral may stay under it)
    var scales=[1,.9,.8,.7,.6];
    // Off the numeral first (a little smaller if need be), over it only when nothing else is free.
    for(var t=0;t<2;t++){
      for(var i=0;i<scales.length;i++){
        var s=Math.max(.45,s0*scales[i]);
        var best=null;
        for(var y=4;y<=96;y+=2)for(var x=4;x<=96;x+=2){
          if(!free(x,y,s,t?near:withHours))continue;
          var dist=Math.hypot(x-p[0],y-p[1]);
          if(!best||dist<best.d)best={x:x,y:y,d:dist};
        }
        if(best){p[0]=best.x;p[1]=best.y;p[2]=Math.round(s*100);return value;}
      }
    }
    return value;
  }

  root.MinkaCardFaceModel = { fitDial: fitDial, faces: faces, looks: looks, parts: parts, plateParts: plateParts, clean: clean, preset: preset, pack: pack, unpack: unpack, fitPart: fitPart, symbolPlacement: symbolPlacement, coffeeColors: coffeeColors, effectiveCoffeeMode: effectiveCoffeeMode };
})(globalThis);
