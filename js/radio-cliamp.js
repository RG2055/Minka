/* RG × cliamp: termināļa spektri.
   Pārnests no github.com/bjarneo/cliamp (ui/vis_*.go), MIT licence, © Bjarne Øverli.
   Katrs spektrs zīmē rūtiņu režģī (cols × rows) tāpat kā terminālī: braille punkti
   (2×4 katrā rūtiņā), bloku simboli un burti. Zīmē canvas taisnstūros, bez WebGL;
   kadrs tiek pārzīmēts tikai tad, kad spektra pulkstenis pagājis (20–60 fps).
   cliamp licence (MIT): Copyright (c) Bjarne Øverli. Permission is hereby granted, free of charge,
   to any person obtaining a copy of this software and associated documentation files (the "Software"),
   to deal in the Software without restriction, including without limitation the rights to use, copy,
   modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
   persons to whom the Software is furnished to do so, subject to the following conditions: The above
   copyright notice and this permission notice shall be included in all copies or substantial portions
   of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
   INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
(function(){
'use strict';
const TICK_ANIM=1000/60,TICK_FAST=50,TICK_ANALYZE=33;
const SP=32,BR=0x2800,FULL=0x2588,UPPER=0x2580,LOWER=0x2584;
const BBIT=[[0x01,0x08],[0x02,0x10],[0x04,0x20],[0x40,0x80]];
// Krāsu vietas paletē: 1 teksts, 2 blāvs, 3–5 zems/vidējs/augsts, 6–8 to blāvās versijas.
const FG=1,DIM=2,LOW=3,MID=4,HIGH=5,DLOW=6,DMID=7,DHIGH=8;
const P=t=>t<0?FG:LOW+t;
const specTag=n=>n>=.6?2:n>=.3?1:0;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const fl=Math.floor;

// ---------------- rūtiņu režģis ----------------
function Term(){this.cols=0;this.rows=0;this.ch=new Uint32Array(0);this.tg=new Uint8Array(0);this.px=null;}
Term.prototype.size=function(c,r){
 if(c!==this.cols||r!==this.rows){this.cols=c;this.rows=r;this.ch=new Uint32Array(c*r);this.tg=new Uint8Array(c*r);}
 this.ch.fill(SP);this.tg.fill(0);this.px=null;
};
Term.prototype.put=function(c,r,code,tag){if(c<0||r<0||c>=this.cols||r>=this.rows)return;const i=r*this.cols+c;this.ch[i]=code;this.tg[i]=tag;};

// brailleGrid: punktu režģis ar līmeni (tier) katram punktam
function Dots(){this.w=0;this.h=0;this.c=new Int8Array(0);}
Dots.prototype.resize=function(h,w){if(h!==this.h||w!==this.w||this.c.length!==h*w){this.h=h;this.w=w;this.c=new Int8Array(h*w);}};
Dots.prototype.ensure=function(h,w){this.resize(h,w);this.c.fill(0);};
Dots.prototype.set=function(x,y,t){if(x<0||x>=this.w||y<0||y>=this.h)return;const i=y*this.w+x;if(t>this.c[i])this.c[i]=t;};
function gridToTerm(g,T,map){
 if(g.h<T.rows*4||g.w<T.cols*2)return;
 for(let row=0;row<T.rows;row++)for(let col=0;col<T.cols;col++){
  let bits=0,tier=0;
  for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++){const t=g.c[(row*4+dr)*g.w+col*2+dc];if(!t)continue;bits|=BBIT[dr][dc];if(t>tier)tier=t;}
  if(bits)T.put(col,row,BR+bits,map?map(tier):P(tier-1));
 }
}
function packBraille(mask,dotCols,T,rowLevel){
 for(let row=0;row<T.rows;row++){const tag=P(specTag(rowLevel(row,T.rows)));
  for(let col=0;col<T.cols;col++){let bits=0;
   for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++)if(mask[(row*4+dr)*dotCols+col*2+dc])bits|=BBIT[dr][dc];
   if(bits)T.put(col,row,BR+bits,tag);}}
}
const specRowLevel=(row,rows)=>(rows-1-row)/rows;

// ---------------- palīgfunkcijas no cliamp ----------------
function bandLayout(n,cols){if(n<=0||cols<=0)return[0,0];const vis=Math.min(n,cols);return[vis,Math.min(vis-1,Math.max(0,cols-vis))];}
function bandWidth(n,b,cols){const[vis,gaps]=bandLayout(n,cols);if(b<0||b>=vis)return 0;const bc=cols-gaps,base=fl(bc/vis),extra=bc%vis;return b<extra?base+1:base;}
function gapAfter(n,b,cols){const[vis,gaps]=bandLayout(n,cols);const slots=vis-1;if(b<0||b>=slots||gaps<=0)return false;return fl((b+1)*gaps/slots)>fl(b*gaps/slots);}
function sampleLin(b,pos){const n=b.length;if(!n)return 0;if(n===1)return b[0];if(pos<=0)return b[0];const last=n-1;if(pos>=last)return b[last];const i=fl(pos),f=pos-i;return b[i]*(1-f)+b[i+1]*f;}
function resample(b,n){if(n<=0||!b.length)return[];if(b.length===n)return Array.from(b);const out=new Array(n);if(n===1){out[0]=sampleLin(b,(b.length-1)/2);return out;}const last=b.length-1;for(let c=0;c<n;c++)out[c]=sampleLin(b,c/(n-1)*last);return out;}
function interpCols(b,bandCols){const out=[];for(let i=0;i<b.length;i++){const w=bandCols[i];if(w<=0)continue;const next=i+1<b.length?b[i+1]:b[i];for(let c=0;c<w;c++){const t=c/w;out.push(b[i]*(1-t)+next*t);}}return out;}
function fracBlock(level,rb,rt){if(level>=rt)return FULL;if(level>rb){const idx=clamp(fl((level-rb)/(rt-rb)*8),0,8);return idx?0x2580+idx:SP;}return SP;}
function bandAvg(b,lo,hi){lo=Math.max(0,lo);hi=Math.min(b.length,hi);if(hi<=lo)return 0;let s=0;for(let i=lo;i<hi;i++)s+=b[i];return s/(hi-lo);}
function ease(cur,target,rise,fall,dt){const r=target>cur?rise:fall;return cur+(target-cur)*(1-Math.exp(-r*dt));}
function scatterHash(band,row,col,frame){
 const f=fl((frame+row*3+col)/3);
 let h=(Math.imul(band,7919)+Math.imul(row,6271)+Math.imul(col,3037)+Math.imul(f,104729))|0;
 h^=h>>>16;h=Math.imul(h,0x45d9f3b);h^=h>>>16;
 return ((h>>>0)%10000)/10000;
}
function hash01(a,b){let h=Math.imul(a+1,0x9E3779B1)^Math.imul(b+1,0x85EBCA77);h^=h>>>15;h=Math.imul(h,0x2C1B3C6D);h^=h>>>12;h=Math.imul(h,0x297A2D39);h^=h>>>15;return (h>>>0)/4294967296;}
function Rng(seed){let a=seed>>>0;return{next(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return (t^t>>>14)>>>0;},f(){return (this.next()%1000)/1000;}};}
function avgOf(b){if(!b.length)return 0;let s=0;for(const x of b)s+=x;return s/b.length;}

// ---------------- skaņas analīze (kā cliamp Analyze) ----------------
const LEGACY_EDGES=[20,100,200,400,800,1600,3200,6400,12800,16000,20000];
const edgeCache=new Map();
function spectrumEdges(n){let e=edgeCache.get(n);if(e)return e;e=new Array(n+1);const last=LEGACY_EDGES.length-1;
 for(let i=0;i<=n;i++){const num=i*last,idx=fl(num/n);if(idx>=last){e[i]=LEGACY_EDGES[last];continue;}if(num%n===0){e[i]=LEGACY_EDGES[idx];continue;}
  const fr=(num%n)/n,lo=LEGACY_EDGES[idx],hi=LEGACY_EDGES[idx+1];e[i]=Math.pow(10,Math.log10(lo)*(1-fr)+Math.log10(hi)*fr);}
 edgeCache.set(n,e);return e;}
// Web Audio dB → cliamp skala: mastera bass ≈ −25 dB → ~1, klusums −74 dB → 0.
const GAIN_DB=74;
function Feed(){this.sr=44100;this.db=null;this.pw=null;this.wave=new Float32Array(0);this.L=null;this.R=null;this.prev=new Map();this.cache=new Map();this.at=-1e9;this.silent=true;}
Feed.prototype.update=function(src,now){
 if(now-this.at<TICK_ANALYZE)return false;this.at=now;this.cache.clear();src.fill(this,now);
 const db=this.db;if(!db)return true;
 if(!this.pw||this.pw.length!==db.length)this.pw=new Float32Array(db.length);
 let loud=-Infinity;for(let i=0;i<db.length;i++){const d=db[i];this.pw[i]=d>-200?Math.pow(10,d/10):0;if(d>loud)loud=d;}
 this.pw[0]=0;this.silent=!(loud>-140);
 return true;
};
Feed.prototype.bands=function(n){
 let out=this.cache.get(n);if(out)return out;out=new Array(n).fill(0);
 let prev=this.prev.get(n);if(!prev){prev=new Array(n).fill(0);this.prev.set(n,prev);}
 if(!this.pw||this.silent){for(let b=0;b<n;b++){out[b]=prev[b]*.8;prev[b]=out[b];}this.cache.set(n,out);return out;}
 const pw=this.pw,binHz=this.sr/(pw.length*2),edges=spectrumEdges(n),maxPos=pw.length-1;
 for(let b=0;b<n;b++){
  let lo=clamp(edges[b]/binHz,1,maxPos),hi=Math.max(lo,Math.min(maxPos,edges[b+1]/binHz));const span=hi-lo;let sum;
  if(span<=0)sum=sampleLin(pw,lo);else{const cnt=Math.max(4,Math.min(32,Math.ceil(span*2)));sum=0;for(let i=0;i<cnt;i++)sum+=sampleLin(pw,lo+(i+.5)/cnt*span);sum/=cnt;}
  let v=sum>0?(10*Math.log10(sum)+GAIN_DB)/50:0;v=clamp(v,0,1);
  v=v>prev[b]?v*.6+prev[b]*.4:v*.25+prev[b]*.75;prev[b]=v;out[b]=v;
 }
 this.cache.set(n,out);return out;
};
// Avots no Web Audio AnalyserNode (+ pēc izvēles kreisais/labais kanāls).
function analyserSource(an,left,right){
 let w=null,l=null,r=null;
 return{fill(feed){
  if(!an)return;feed.sr=an.context.sampleRate;
  if(!feed.db||feed.db.length!==an.frequencyBinCount)feed.db=new Float32Array(an.frequencyBinCount);
  an.getFloatFrequencyData(feed.db);
  if(!w||w.length!==an.fftSize)w=new Float32Array(an.fftSize);an.getFloatTimeDomainData(w);feed.wave=w;
  if(left&&right){if(!l||l.length!==left.fftSize){l=new Float32Array(left.fftSize);r=new Float32Array(right.fftSize);}left.getFloatTimeDomainData(l);right.getFloatTimeDomainData(r);feed.L=l;feed.R=r;}
  else{feed.L=null;feed.R=null;}
 }};
}
// Bez skaņas: izdomāta dziesma (118 BPM bungas, bass, akordi), lai spektri kustas.
function fakeSource(){
 const N=1024,SR=44100,db=new Float32Array(N),w=new Float32Array(2048),l=new Float32Array(2048),r=new Float32Array(2048),rng=Rng(7);
 const notes=[55,55,65.4,49];
 return{fill(feed,now){
  const t=now/1000,beat=60/118,ph=(t/beat)%1,bar=fl(t/beat/4)%4,bi=fl(t/beat)%4;
  const kick=Math.exp(-ph*7),snare=(bi===1||bi===3)?Math.exp(-ph*9):0,hat=Math.exp(-((t/beat*2)%1)*14);
  const swell=.5+.5*Math.sin(t*.35),bass=notes[bar];
  for(let i=0;i<N;i++){const f=(i+.5)*SR/(N*2);const lf=Math.log2(Math.max(f,25)/60);
   let d=-54-4.2*lf+swell*4;
   if(f<160)d+=22*kick-6;
   if(f>180&&f<7000)d+=13*snare-4;
   if(f>6000)d+=16*hat-10;
   for(let k=1;k<7;k++){const hf=bass*k;if(Math.abs(f-hf)<hf*.04)d+=16-k*2;}
   const lead=220*Math.pow(2,(fl(t*4)%7)/12);if(Math.abs(f-lead)<12||Math.abs(f-lead*2)<20)d+=14*(.6+.4*Math.sin(t*3));
   d+=(rng.f()-.5)*6;db[i]=d;}
  for(let i=0;i<2048;i++){const s=t+i/SR;
   const v=.42*(.5+kick)*Math.sin(2*Math.PI*bass*s)+.25*kick*Math.sin(2*Math.PI*(60-40*ph)*s)+.12*Math.sin(2*Math.PI*bass*3.01*s)+.08*hat*(rng.f()-.5)+.05*snare*(rng.f()-.5)*4;
   w[i]=clamp(v,-1,1);l[i]=clamp(v*(1+.25*Math.sin(t*1.3)),-1,1);r[i]=clamp(v*(1-.25*Math.sin(t*1.3))+.03*(rng.f()-.5),-1,1);}
  feed.sr=SR;feed.db=db;feed.wave=w;feed.L=l;feed.R=r;
 }};
}

// ---------------- spektri ----------------
const MODES=[];
function def(m){m.n=m.n==null?10:m.n;m.iv=m.iv||TICK_FAST;MODES.push(m);}
const ROW=fn=>(v,T)=>{for(let row=0;row<v.rows;row++)fn(v,T,row);};

def({id:'bars',name:'Bars',home:'pioneer',lv:'Gludie stabiņi ar 1/8 bloku soli',iv:TICK_ANIM,render:ROW((v,T,row)=>{
 const H=v.rows,W=v.cols,b=v.sb,n=b.length,rb=(H-1-row)/H,rt=(H-row)/H,tag=P(specTag(rb));let c=0;
 for(let i=0;i<n;i++){const bw=bandWidth(n,i,W),code=fracBlock(b[i],rb,rt);for(let k=0;k<bw;k++)T.put(c++,row,code,tag);if(gapAfter(n,i,W))c++;}
})});
def({id:'barsdot',name:'BarsDot',home:'dither',lv:'Stabiņi no braille punktiem',iv:TICK_ANIM,render:ROW((v,T,row)=>{
 const H=v.rows,W=v.cols,b=v.sb,n=b.length,dotRows=H*4,tag=P(specTag((H-1-row)/H));let c=0;
 for(let i=0;i<n;i++){let bits=0;for(let dr=0;dr<4;dr++){const dotY=(dotRows-1-(row*4+dr))/dotRows;if(dotY<b[i])bits|=BBIT[dr][0]|BBIT[dr][1];}
  const bw=bandWidth(n,i,W);for(let k=0;k<bw;k++){if(bits)T.put(c,row,BR+bits,tag);c++;}if(gapAfter(n,i,W))c++;}
})});
def({id:'barsoutline',name:'BarsOutline',home:'pioneer',lv:'Tikai stabiņu virsotnes kā līnijas',iv:TICK_ANIM,render:ROW((v,T,row)=>{
 const H=v.rows,W=v.cols,b=v.sb,n=b.length,rb=(H-1-row)/H,rt=(H-row)/H,tag=P(specTag(rb));let c=0;
 for(let i=0;i<n;i++){const bw=bandWidth(n,i,W),code=b[i]>=rt?SP:b[i]>rb?0x2500:SP;for(let k=0;k<bw;k++)T.put(c++,row,code,tag);if(gapAfter(n,i,W))c++;}
})});
def({id:'bricks',name:'Bricks',home:'pioneer',lv:'Ķieģelīšu segmenti kā LED displejā',iv:TICK_ANIM,render:ROW((v,T,row)=>{
 const H=v.rows,W=v.cols,b=v.sb,n=b.length,th=(H-1-row)/H,tag=P(specTag(th));let c=0;
 for(let i=0;i<n;i++){const bw=bandWidth(n,i,W),code=b[i]>th?LOWER:SP;for(let k=0;k<bw;k++)T.put(c++,row,code,tag);if(gapAfter(n,i,W))c++;}
})});
def({id:'columns',name:'Columns',home:'pioneer',lv:'Katra kolonna sava, starp joslām gluda pāreja',iv:TICK_ANIM,render(v,T){
 const H=v.rows,W=v.cols,b=v.sb,n=b.length,bc=[];for(let i=0;i<n;i++)bc.push(bandWidth(n,i,W));const cols=interpCols(b,bc);
 for(let row=0;row<H;row++){const rb=(H-1-row)/H,rt=(H-row)/H,tag=P(specTag(rb));let c=0,off=0;
  for(let i=0;i<n;i++){for(let k=0;k<bc[i];k++)T.put(c++,row,fracBlock(cols[off+k],rb,rt),tag);off+=bc[i];if(gapAfter(n,i,W))c++;}}
}});
// ClassicPeak: 64 joslas, virsotnes uzlec un krīt ar gravitāciju
const CP={launchBase:.8,launchGain:1.4,launchMax:1.7,gravity:9.5,hold:.08,rise:34,fall:10,eps:.01};
const cpCols=w=>Math.max(1,fl((w+1)/2));
function cpBands(b,cols){if(cols<=0||cols>=b.length)return resample(b,cols);const out=new Array(cols).fill(0),span=b.length/cols;
 for(let c=0;c<cols;c++){const lo=c*span,hi=(c+1)*span;for(let i=fl(lo);i<b.length&&i<hi;i++){const wgt=Math.min(hi,i+1)-Math.max(lo,i);out[c]+=b[i]*wgt/span;}}return out;}
def({id:'classicpeak',name:'ClassicPeak',home:'pioneer',lv:'Winamp stila stabiņi ar lecošām virsotnēm',n:64,
 iv:v=>1000/clamp(CP.launchMax*Math.max(v.rows||7,7)*4,24,60),make:()=>({bar:[],pk:[],vel:[],hold:[]}),
 tick(v,dt){const s=v.st,lv=cpBands(v.bands,cpCols(v.cols));
  if(lv.length!==s.bar.length){s.bar=lv.slice();s.pk=lv.slice();s.vel=lv.map(()=>0);s.hold=lv.map(()=>0);return;}
  for(let i=0;i<lv.length;i++)if(s.vel[i]===0&&s.pk[i]<=s.bar[i]+CP.eps&&lv[i]>s.pk[i]){const d=lv[i]-s.pk[i];s.pk[i]=lv[i];s.vel[i]=Math.min(CP.launchMax,CP.launchBase+CP.launchGain*d);s.hold[i]=0;}
  for(let i=0;i<lv.length;i++){s.bar[i]=ease(s.bar[i],lv[i],CP.rise,CP.fall,dt);
   if(s.hold[i]>0){s.hold[i]=Math.max(0,s.hold[i]-dt);if(s.hold[i]>0)continue;}
   const pv=s.vel[i];s.pk[i]+=s.vel[i]*dt;s.vel[i]-=CP.gravity*dt;if(s.pk[i]>1)s.pk[i]=1;
   if(pv>0&&s.vel[i]<=0&&s.pk[i]>s.bar[i]+CP.eps){s.vel[i]=0;s.hold[i]=CP.hold;continue;}
   if(s.pk[i]<=s.bar[i]){s.pk[i]=s.bar[i];s.vel[i]=0;s.hold[i]=0;}}},
 render(v,T){const s=v.st,H=v.rows,cols=s.bar.length;if(!cols)return;const pad=Math.max(0,v.cols-(2*cols-1)),dotRows=Math.max(1,H*4),minGap=Math.max(CP.eps,.5/dotRows);
  for(let row=0;row<H;row++){const rb=(H-1-row)/H,rt=(H-row)/H,tag=P(specTag(rb));let c=pad;
   for(let i=0;i<cols;i++){let code=fracBlock(s.bar[i],rb,rt);
    if(s.pk[i]>s.bar[i]+minGap){const dy=Math.round((1-Math.min(1,s.pk[i]))*(dotRows-1));if(fl(dy/4)===row)code=0x23BA+dy%4;}
    T.put(c,row,code,tag);c+=2;}}}});
def({id:'classicled',name:'ClassicLED',home:'pioneer',lv:'LED segmentu stabiņi ar krītošu virsotni',n:v=>Math.max(1,fl((v.cols+1)/3)),iv:1000/30,make:()=>({body:[],pk:[],hold:[]}),
 tick(v,dt){const s=v.st,lv=resample(v.bands,Math.max(1,fl((v.cols+1)/3)));
  if(lv.length!==s.body.length){s.body=lv.slice();s.pk=lv.slice();s.hold=lv.map(()=>0);return;}
  for(let i=0;i<lv.length;i++){s.body[i]=ease(s.body[i],lv[i],60,16,dt);
   if(s.body[i]>=s.pk[i]){s.pk[i]=s.body[i];s.hold[i]=.45;}else if(s.hold[i]>0)s.hold[i]=Math.max(0,s.hold[i]-dt);else s.pk[i]=Math.max(s.body[i],s.pk[i]-.55*dt);}},
 render(v,T){const s=v.st,H=v.rows,bars=s.body.length;if(!bars)return;const pad=Math.max(0,v.cols-(bars*3-1));
  for(let row=0;row<H;row++){const rb=(H-1-row)/H,rfb=H-1-row,tag=P(specTag(rb));let c=pad;
   for(let b=0;b<bars;b++){const lit=fl(s.body[b]*H+1e-6);let ps=fl(s.pk[b]*H+1e-6);if(ps>=H)ps=H-1;
    const show=s.pk[b]>s.body[b]+.5/H&&ps>=lit,code=rfb<lit?LOWER:(show&&rfb===ps)?UPPER:SP;
    T.put(c,row,code,tag);T.put(c+1,row,code,tag);c+=3;}}}});
function stereoDB(a){if(a<=0)return 0;return clamp((20*Math.log10(a)+48)/48,0,1);}
def({id:'stereo',name:'Stereo',home:'pioneer',lv:'Kreisā un labā kanāla skaļuma mērītāji',n:0,iv:TICK_ANIM,make:()=>({lv:[0,0],pk:[0,0],hold:[0,0],tl:[0,0],tp:[0,0],at:-1e9}),
 tick(v,dt,now){const s=v.st,f=v.feed;
  if(v.playing){if(now-s.at>=TICK_ANALYZE){s.at=now;let L=f.L,R=f.R;if(!L||!R){const w=f.wave,h=w.length>>1;L=w.subarray(0,h);R=w.subarray(h);}
    [L,R].forEach((ch,c)=>{let sq=0,p=0;for(let i=0;i<ch.length;i++){const x=ch[i];sq+=x*x;const a=x<0?-x:x;if(a>p)p=a;}s.tl[c]=ch.length?stereoDB(Math.sqrt(sq/ch.length)):0;s.tp[c]=stereoDB(p);});}}
  else{s.tl=[0,0];s.tp=[0,0];}
  for(let c=0;c<2;c++){s.lv[c]=ease(s.lv[c],s.tl[c],36,10,dt);
   if(s.tp[c]>s.pk[c]){s.pk[c]=s.tp[c];s.hold[c]=.45;}else if(s.hold[c]>0)s.hold[c]=Math.max(0,s.hold[c]-dt);else s.pk[c]=Math.max(s.lv[c],s.pk[c]-.65*dt);}},
 render(v,T){const s=v.st,H=v.rows,W=v.cols;
  const meter=(row,label,ch)=>{if(label)T.put(0,row,label.charCodeAt(0),FG);const cells=W-2;if(cells<=0)return;
   const lit=Math.min(cells,Math.round(s.lv[ch]*cells));let pc=-1;if(s.pk[ch]>0)pc=Math.min(cells-1,Math.max(0,Math.round(s.pk[ch]*cells)-1));
   for(let c=0;c<cells;c++){const tag=P(specTag(c/Math.max(1,cells-1)));if(c===pc)T.put(2+c,row,0x25A0,tag);else if(c<lit)T.put(2+c,row,0x25AE,tag);else T.put(2+c,row,0xB7,DIM);}};
  if(H===1){meter(0,'L',0);return;}
  const th=fl(H/2);let row=0;for(let i=0;i<th;i++)meter(row+i,i===fl(th/2)?'L':'',0);row+=th;if(H%2)row++;for(let i=0;i<th;i++)meter(row+i,i===fl(th/2)?'R':'',1);}});
def({id:'mirror',name:'Mirror',home:'pioneer',lv:'Spoguļstabiņi ap viduslīniju',iv:TICK_ANIM,make:()=>({g:new Dots()}),render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2;let span=Math.max(2,fl(dotCols*84/100));span=Math.min(dotCols,span-span%2);
 const barCount=Math.max(1,span/2),x0=fl((dotCols-span)/2),axisY=fl(dotRows/2),maxR=Math.min(axisY,dotRows-1-axisY),g=v.st.g;g.ensure(dotRows,dotCols);
 for(let x=x0;x<x0+span;x++)g.set(x,axisY,1);
 let env=0;for(const l of v.sb)env+=clamp(l,0,1);if(v.sb.length)env/=v.sb.length;
 const t=v.frame*TICK_ANIM/1000,half=(barCount-1)/2;
 for(let i=0;i<barCount;i++){const dist=half>0?Math.abs(i-half)/half:0;const wob=.4+.6*Math.abs(Math.sin(t*4.6+i*.42)*Math.sin(t*1.9-i*.13));
  const amp=dotRows*.8*(1-dist*.55)*(.3+.7*env)*(.35+.65*wob),r=Math.min(maxR,Math.max(1,Math.round(amp))),x=x0+i*2+1;
  for(let y=axisY-r;y<=axisY+r;y++)g.set(x,y,Math.abs(y-axisY)/r>=.75?3:2);}
 gridToTerm(g,T);}});
function traceYs(v,n){if(!v.st.ys||v.st.ys.length!==n)v.st.ys=new Int32Array(n);return v.st.ys;}
def({id:'wave',name:'Wave',home:'pioneer',lv:'Skaņas vilnis kā osciloskopā',n:0,iv:TICK_ANIM,render(v,T){
 const H=v.rows,dotRows=H*4,dotCols=v.cols*2,s=v.feed.wave,n=s.length,ys=traceYs(v,dotCols);
 for(let x=0;x<dotCols;x++){const smp=n?s[Math.min(n-1,fl(x*n/dotCols))]:0;ys[x]=clamp(fl((1-smp)*(dotRows-1)/2),0,dotRows-1);}
 for(let row=0;row<H;row++){const tag=P(specTag((H-1-row)/H));for(let ch=0;ch<v.cols;ch++){let bits=0;
  for(let dc=0;dc<2;dc++){const x=ch*2+dc,y=ys[x],py=x>0?ys[x-1]:y,a=Math.min(y,py),b=Math.max(y,py);for(let dr=0;dr<4;dr++){const dy=row*4+dr;if(dy>=a&&dy<=b)bits|=BBIT[dr][dc];}}
  if(bits)T.put(ch,row,BR+bits,tag);}}}});
def({id:'scope',name:'Scope',home:'pioneer',lv:'XY osciloskops (Lissajous figūra)',n:0,iv:TICK_ANIM,render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2,s=v.feed.wave,n=s.length,g=new Uint8Array(dotRows*dotCols);
 if(n>1){const delay=clamp(fl(n/4)+fl(Math.sin(v.frame*.02)*fl(n/8)),1,n-1),pts=Math.min(n-delay,512),step=Math.max(1,fl((n-delay)/pts));let px=0,py=0,first=true;
  for(let i=0;i+delay<n;i+=step){const dx=clamp(fl((s[i]+1)*.5*(dotCols-1)),0,dotCols-1),dy=clamp(fl((1-s[i+delay])*.5*(dotRows-1)),0,dotRows-1);g[dy*dotCols+dx]=1;
   if(!first){const ddx=dx-px,ddy=dy-py,st=Math.max(Math.abs(ddx),Math.abs(ddy));if(st>0&&st<30)for(let k=1;k<st;k++){const mx=px+fl(ddx*k/st),my=py+fl(ddy*k/st);g[my*dotCols+mx]=1;}}
   px=dx;py=dy;first=false;}}
 packBraille(g,dotCols,T,specRowLevel);}});
def({id:'heartbeat',name:'Heartbeat',home:'pioneer',lv:'Sirdspukstu monitora līnija',n:0,iv:TICK_ANIM,make:()=>({g:new Dots()}),render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2,s=v.feed.wave,n=s.length,ys=traceYs(v,dotCols),cy=dotRows/2,amp=dotRows*.45,base=fl(dotRows/2),g=v.st.g;
 for(let x=0;x<dotCols;x++){const smp=n?s[Math.min(n-1,fl(x*n/dotCols))]:0;ys[x]=clamp(fl(cy-smp*Math.abs(smp)*amp),0,dotRows-1);}
 g.ensure(dotRows,dotCols);const tt=y=>y===base?1:3;
 for(let x=0;x<dotCols;x++){const y=ys[x];g.set(x,y,tt(y));if(x>0){const a=Math.min(y,ys[x-1]),b=Math.max(y,ys[x-1]);for(let fy=a;fy<=b;fy++)g.set(x,fy,tt(fy));}}
 for(let x=0;x<dotCols;x++)if(fl(x/6)%2===0)g.set(x,base,1);
 gridToTerm(g,T);}});
def({id:'retro',name:'Retro',home:'pioneer',lv:'Synthwave saule, perspektīvas režģis un spektra kalni',render(v,T){
 const H=v.rows,dotRows=H*4,dotCols=v.cols*2,b=v.sb,n=b.length,hz=Math.max(fl(dotRows*2/5),2),floorRows=dotRows-hz,cx=(dotCols-1)/2,g=new Uint8Array(dotRows*dotCols),sunR=hz*.85;
 for(let dy=0;dy<hz;dy++){const rd=hz-dy;if(rd>sunR)continue;const hw=Math.sqrt(sunR*sunR-rd*rd);if(rd<sunR*.5){const sw=Math.max(1,fl(sunR*.15));if(fl(rd/sw)%2===1)continue;}
  for(let dx=Math.max(0,fl(cx-hw));dx<=Math.min(dotCols-1,fl(cx+hw));dx++)g[dy*dotCols+dx]=3;}
 for(let dx=0;dx<dotCols;dx++)g[hz*dotCols+dx]=1;
 for(let i=0;i<=18;i++){const bx=i*(dotCols-1)/18;for(let dy=hz+1;dy<dotRows;dy++){const t=(dy-hz)/Math.max(1,floorRows-1),ix=Math.round(cx+(bx-cx)*t);if(ix>=0&&ix<dotCols)g[dy*dotCols+ix]=1;}}
 const scroll=(v.frame*.08)%1;
 for(let i=0;i<10;i++){let z=(i+scroll)/10;if(z>1)z-=1;const dy=hz+1+fl(z*z*Math.max(1,floorRows-2));if(dy>hz&&dy<dotRows)for(let dx=0;dx<dotCols;dx++)g[dy*dotCols+dx]=1;}
 const wy=new Int32Array(dotCols),maxW=hz*.85;
 for(let dx=0;dx<dotCols;dx++){const bf=dx/Math.max(1,dotCols-1)*(n-1),bi=fl(bf),t=(1-Math.cos((bf-bi)*Math.PI))/2;const lvl=Math.max(.03,bi>=n-1?b[n-1]:b[bi]*(1-t)+b[bi+1]*t);wy[dx]=clamp(hz-fl(lvl*maxW),0,dotRows-1);}
 for(let dx=0;dx<dotCols;dx++){const y=wy[dx];g[y*dotCols+dx]=2;if(dx>0){for(let fy=Math.min(y,wy[dx-1]);fy<=Math.max(y,wy[dx-1]);fy++)g[fy*dotCols+dx]=2;}}
 for(let row=0;row<H;row++)for(let ch=0;ch<v.cols;ch++){let bits=0,wave=false,sun=false;
  for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++){const val=g[(row*4+dr)*dotCols+ch*2+dc];if(!val)continue;bits|=BBIT[dr][dc];if(val===2)wave=true;else if(val===3)sun=true;}
  if(bits)T.put(ch,row,BR+bits,P(wave?2:sun?1:0));}}});
def({id:'pulse',name:'Pulse',home:'pioneer',lv:'Pulsējošs aplis ar triecienviļņiem',render(v,T){
 const H=v.rows,W=v.cols,b=v.sb,n=b.length,key=W+'x'+H;let c=v.st.pc;
 if(!c||c.key!==key){const dotRows=H*4,dotCols=W*2,cx=dotCols/2,cy=dotRows/2,xs=cy/cx,size=H*W*8;c={key,maxR:cy-1,dist:new Float32Array(size),ang:new Float32Array(size)};
  for(let row=0;row<H;row++)for(let col=0;col<W;col++)for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++){const dx=(col*2+dc-cx)*xs,dy=row*4+dr-cy,i=((row*W+col)*4+dr)*2+dc;c.dist[i]=Math.sqrt(dx*dx+dy*dy);let a=Math.atan2(dy,dx);if(a<0)a+=2*Math.PI;c.ang[i]=a;}
  v.st.pc=c;}
 const avg=avgOf(b),sp=(v.frame*.1)%1,shR=c.maxR*(.3+.7*sp),shS=avg*avg*(1-sp*sp),breath=Math.sin(v.frame*.05)*.02,rot=v.frame*(.015+avg*.04),TW=2*Math.PI,bs=n/TW;
 for(let row=0;row<H;row++)for(let col=0;col<W;col++){let bits=0,mx=0;
  for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++){const i=((row*W+col)*4+dr)*2+dc,dist=c.dist[i];let ra=c.ang[i]+rot;ra-=Math.floor(ra/TW)*TW;
   const bp=ra*bs,bi=fl(bp)%n,nb=(bi+1)%n,t=(1-Math.cos((bp-fl(bp))*Math.PI))/2,e=b[bi]*(1-t)+b[nb]*t,bl=e*.6+avg*.4,r=c.maxR*(.08+breath+.92*bl*bl);
   if(r>.5&&dist<=r){const nm=dist/r;if(nm>mx)mx=nm;bits|=BBIT[dr][dc];}
   else if(r>.5&&dist<r+1.5){if(scatterHash(bi,row*4+dr,col*2+dc,v.frame)<(1-(dist-r)/1.5)*.7){bits|=BBIT[dr][dc];if(mx<.9)mx=.9;}}
   if(shS>.05){const sd=Math.abs(dist-shR),thk=.6+shS*1.5;if(sd<thk&&1-sd/thk>.4){bits|=BBIT[dr][dc];if(mx<.65)mx=.65;}}}
  if(bits)T.put(col,row,BR+bits,P(specTag(mx)));}}});
def({id:'terrain',name:'Terrain',home:'pioneer',lv:'Skaļuma kalni, kas ritinās no labās',make:()=>({buf:[]}),
 tick(v){const dc=v.cols*2,s=v.st;if(s.buf.length!==dc){const nb=new Array(dc).fill(0),k=Math.min(s.buf.length,dc);for(let i=0;i<k;i++)nb[dc-k+i]=s.buf[s.buf.length-k+i];s.buf=nb;}
  if(dc<2)return;s.buf.copyWithin(0,2);const avg=avgOf(v.sb);s.buf[dc-2]=Math.min(1,avg+scatterHash(0,0,0,v.frame)*.12);s.buf[dc-1]=Math.min(1,avg+scatterHash(0,0,1,v.frame)*.12);},
 render(v,T){const H=v.rows,dotRows=H*4,buf=v.st.buf;if(buf.length!==v.cols*2)return;
  for(let row=0;row<H;row++){const tag=P(specTag((H-1-row)/H));for(let ch=0;ch<v.cols;ch++){let bits=0;
   for(let dc=0;dc<2;dc++){const top=dotRows-1-fl(buf[ch*2+dc]*(dotRows-1));for(let dr=0;dr<4;dr++)if(row*4+dr>=top)bits|=BBIT[dr][dc];}
   if(bits)T.put(ch,row,BR+bits,tag);}}}});
def({id:'butterfly',name:'Butterfly',home:'pixel',lv:'Spārni, kas plešas ar mūziku',render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2,cx=fl(dotCols/2),b=v.sb,n=b.length,g=new Uint8Array(dotRows*dotCols);
 for(let dy=0;dy<dotRows;dy++){const bf=dy/Math.max(1,dotRows-1)*(n-1),bi=fl(bf),fr=bf-bi,e=bi>=n-1?b[n-1]:b[bi]*(1-fr)+b[bi+1]*fr;
  const wob=Math.sin(v.frame*.08+dy*.3)*.15,ww=fl(cx*(e+wob)*.9);
  for(let dx=0;dx<ww;dx++){const nm=dx/Math.max(1,ww);let th=(1-nm*nm)*e;if(nm>.6)th*=.5+.5*Math.sin(v.frame*.1+dy*.5+dx*.3);
   if(scatterHash(bi,dy,dx,fl(v.frame/3))<th){const rx=cx+dx;if(rx<dotCols)g[dy*dotCols+rx]=1;const lx=cx-1-dx;if(lx>=0)g[dy*dotCols+lx]=1;}}
  if(e>.05){g[dy*dotCols+cx]=1;if(cx>0)g[dy*dotCols+cx-1]=1;}}
 packBraille(g,dotCols,T,(row,rows)=>row/Math.max(1,rows-1));}});
def({id:'scatter',name:'Scatter',home:'dither',lv:'Mirgojoši punkti joslu augstumā',render(v,T){
 const H=v.rows,W=v.cols,b=v.sb,n=b.length,dotRows=H*4;
 for(let row=0;row<H;row++){const tag=P(specTag((H-1-row)/H));let c=0;
  for(let i=0;i<n;i++){const cpb=bandWidth(n,i,W);for(let k=0;k<cpb;k++){let bits=0;
    for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++){const dRow=row*4+dr;if(scatterHash(i,dRow,k*2+dc,v.frame)<b[i]*b[i]*(.5+.5*dRow/(dotRows-1)))bits|=BBIT[dr][dc];}
    if(bits)T.put(c,row,BR+bits,tag);c++;}if(gapAfter(n,i,W))c++;}}}});
def({id:'rain',name:'Rain',home:'pixel',lv:'Lietus lāses, kas līst skaļākajās joslās',render(v,T){
 const H=v.rows,W=v.cols,b=v.sb,n=b.length;
 for(let row=0;row<H;row++){let col=0;const rn=(H-1-row)/H;
  for(let i=0;i<n;i++){const bw=bandWidth(n,i,W),lvl=b[i];
   for(let k=0;k<bw;k++,col++){if(rn>=lvl)continue;const seed=col*7919+104729;if(scatterHash(i,0,col,fl(v.frame/12))>lvl*1.6+.1)continue;
    const speed=1+seed%3,dl=2+fl(seed/7)%3,cyc=H+dl+3,off=fl(seed/13)%cyc,pos=(fl(v.frame/speed)+off)%cyc,d=pos-row;
    if(d>=0&&d<dl)T.put(col,row,d===0?0x2503:d===1?0x2502:58,P(d===0?2:d===1?1:0));}
   if(gapAfter(n,i,W))col++;}}}});
const KATA=[...'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789'].map(ch=>ch.codePointAt(0));
def({id:'matrix',name:'Matrix',home:'dither',lv:'Krītoši katakana burti kā filmā',render(v,T){
 const H=v.rows,W=v.cols,b=v.sb,n=b.length;
 for(let row=0;row<H;row++){let col=0;
  for(let i=0;i<n;i++){const w=bandWidth(n,i,W);
   for(let k=0;k<w;k++,col++){const seed=col*7919+104729;if(scatterHash(i,0,col,fl(v.frame/20))>b[i]*1.5+.1)continue;
    const speed=2+seed%3,tl=3+fl(seed/7)%3,cyc=H+tl+4,off=fl(seed/13)%cyc,pos=(fl(v.frame/speed)+off)%cyc,d=pos-row;
    if(d<0||d>tl)continue;const cs=(seed^(row*31+fl(v.frame/4)*17))>>>0;T.put(col,row,KATA[cs%KATA.length],P(d===0?2:d<=2?1:0));}
   if(gapAfter(n,i,W))col++;}}}});
def({id:'binary',name:'Binary',home:'dither',lv:'Nulles un vieninieki, kas ritinās ar mūziku',render(v,T){
 const H=v.rows,W=v.cols,b=v.sb,n=b.length;
 for(let row=0;row<H;row++){let col=0;
  for(let i=0;i<n;i++){const w=bandWidth(n,i,W);
   for(let k=0;k<w;k++,col++){const e=b[i],sp=Math.max(1,4-fl(e*3)),sc=fl(v.frame/sp),one=scatterHash(i,row+sc,col,0)<e*.6+.15;
    T.put(col,row,one?49:48,P(one&&e>.4?2:(one||e>.3)?1:0));}
   if(gapAfter(n,i,W))col++;}}}});
function shadeBlock(l,rb,rt){if(l>=rt)return FULL;if(l>rb){const f=(l-rb)/(rt-rb);if(f>=.75)return 0x2593;if(f>=.5)return 0x2592;if(f>=.25)return 0x2591;}return SP;}
def({id:'ascii',name:'Ascii',home:'dither',lv:'Stabiņi no ░▒▓█ ēnu simboliem',iv:TICK_ANIM,render(v,T){
 const H=v.rows,cols=resample(v.sb,cpCols(v.cols));
 for(let row=0;row<H;row++){const rb=(H-1-row)/H,rt=(H-row)/H,tag=P(specTag(rb));for(let i=0;i<cols.length;i++)T.put(i*2,row,shadeBlock(cols[i],rb,rt),tag);}}});
const SAKURA=[[[0,1],[1,0],[1,1],[1,2],[2,0],[2,1]],[[0,1],[1,0],[1,1],[1,2],[2,1],[2,2]],[[0,1],[0,2],[1,0],[1,1],[1,2],[2,1]],[[0,1],[1,0],[1,1],[2,0]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[0,0],[1,1]],[[0,1],[1,0]],[[0,0],[0,1],[1,0]]];
def({id:'sakura',name:'Sakura',home:'pixel',lv:'Krītošas ķiršu ziedlapiņas',render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2;if(dotRows<4||dotCols<4)return;const g=new Uint8Array(dotRows*dotCols),np=12+fl(avgOf(v.sb)*16);
 for(let p=0;p<np;p++){const seed=p*104729+7919,si=(seed*4391)%SAKURA.length,shape=SAKURA[si],fs=si>=6?2:1,bx=seed%dotCols,wh=dotRows+10,by=(seed*3037)%wh;
  const y=(by+fl(v.frame*fs/8))%wh-5,x=bx+Math.trunc(Math.sin(v.frame*.015+(seed%1000)/1000*2*Math.PI)*3);
  for(const[a,c]of shape){const dr=y+a,dc=x+c;if(dr>=0&&dr<dotRows&&dc>=0&&dc<dotCols)g[dr*dotCols+dc]=1;}}
 packBraille(g,dotCols,T,specRowLevel);}});
def({id:'firework',name:'Firework',home:'pixel',lv:'Salūts: raķetes uzlido un sprāgst',render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2;if(dotRows<4||dotCols<4)return;const g=new Uint8Array(dotRows*dotCols),b=v.sb,nb=5+fl(avgOf(b)*9),CY=48,LL=10;
 for(let i=0;i<nb;i++){const cyc=fl((v.frame+i*7)/CY),seed=cyc*104729+i*7919,off=fl(i*CY/nb)+fl(seed/3)%5,lf=(v.frame+off)%CY;
  const cx=(seed*6271)%dotCols,cy=(seed*4391)%Math.max(1,fl(dotRows/2))+fl(dotRows/8),bi=seed%b.length,e=b[bi];
  if(lf<LL){const ty0=dotRows-1-fl((dotRows-1-cy)*lf/LL);for(let dy=0;dy<4;dy++){const ty=ty0+dy;if(ty>=0&&ty<dotRows&&cx>=0&&cx<dotCols)g[ty*dotCols+cx]=1;}}
  else{const bt=(lf-LL)/(CY-LL),rad=(3+e*8)*Math.min(bt*3,1),grav=bt*bt*5,fade=Math.max(0,1-bt*1.3),np=18+fl(e*18);
   for(let p=0;p<np;p++){const a=p/np*2*Math.PI,ps=seed+p*2909,spd=.6+(ps%400)/1000,px=cx+Math.trunc(Math.cos(a)*rad*spd),py=cy+Math.trunc(Math.sin(a)*rad*spd+grav);
    if(scatterHash(bi,p,seed%100,v.frame)>fade)continue;if(px>=0&&px<dotCols&&py>=0&&py<dotRows)g[py*dotCols+px]=1;}}}
 packBraille(g,dotCols,T,specRowLevel);}});
def({id:'bubbles',name:'Bubbles',home:'pixel',lv:'Burbuļi, kas ceļas un pārplīst',render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2;if(dotRows<4||dotCols<4)return;const g=new Uint8Array(dotRows*dotCols),avg=avgOf(v.sb);
 for(let i=0;i<18;i++){const seed=i*104729+7919,r=1.5+(seed%100)/100*2.5,sd=3+fl(r),wh=dotRows+fl(r*2)+8,by=(seed*3037)%wh;
  const y=wh-1-((by+fl(v.frame/sd))%wh)-fl(r)-2,x=seed%dotCols+Math.trunc(Math.sin(v.frame*.03+(seed%1000)/1000*2*Math.PI)*(1.5+avg*2.5));
  const pz=fl(r)+3,pf=y<pz?Math.max(0,y/pz):1,ri=r-.9,bb=fl(r)+1;
  for(let dy=-bb;dy<=bb;dy++)for(let dx=-bb;dx<=bb;dx++){const d=Math.sqrt(dx*dx+dy*dy);if(d>r||d<ri)continue;if(pf<1&&scatterHash(i,dy+50,dx+50,0)>pf)continue;const gy=y+dy,gx=x+dx;if(gy>=0&&gy<dotRows&&gx>=0&&gx<dotCols)g[gy*dotCols+gx]=1;}
  if(r>=2&&pf>.5){const hx=x-fl(r*.45),hy=y-fl(r*.45);for(const[a,c]of[[0,0],[0,1],[1,0]]){const gy=hy+a,gx=hx+c;if(gy>=0&&gy<dotRows&&gx>=0&&gx<dotCols)g[gy*dotCols+gx]=1;}}}
 packBraille(g,dotCols,T,specRowLevel);}});
def({id:'firefly',name:'Firefly',home:'pixel',lv:'Jāņtārpiņi virs zāles, mirgo ar augstajām',make:()=>({g:new Dots()}),render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2;if(dotRows<4||dotCols<8)return;const b=v.sb,bass=bandAvg(b,0,fl(b.length/3)),high=bandAvg(b,fl(2*b.length/3),b.length),g=v.st.g;g.ensure(dotRows,dotCols);
 const grass=(x,y)=>g.c[y*dotCols+x]===1;
 for(let x=0;x<dotCols;x++){const h=1+fl(2.5+1.5*Math.sin(x*.41)+Math.sin(x*.17+2.3));for(let d=0;d<h;d++)g.set(x,dotRows-1-d,1);}
 const t=v.frame,wind=bass*1.5;
 for(let i=0;i<26;i++){const seed=i*2246822519+11,fx=.012+(seed%17)/3500,fy=.018+(fl(seed/16)%19)/2900,phx=(seed%1000)/1000*2*Math.PI,phy=(fl(seed/256)%1000)/1000*2*Math.PI;
  const bx=fl(dotCols/2)+Math.cos(t*fx+phx)*(dotCols-6)*.45,by=(dotRows-4)*.5+Math.sin(t*fy+phy)*(dotRows-6)*.4,x=Math.trunc(bx+wind*Math.sin(t*.02+phx)),y=Math.trunc(by);
  if(x<0||x>=dotCols||y<0||y>=dotRows-1||grass(x,y))continue;
  if(Math.sin(t*.18+i*1.31)*.5+.5+high*.4<=.55){g.set(x,y,2);continue;}
  g.set(x,y,3);for(const[a,c]of[[-1,0],[1,0],[0,-1],[0,1]]){const gx=x+c,gy=y+a;if(gx>=0&&gx<dotCols&&gy>=0&&gy<dotRows&&!grass(gx,gy))g.set(gx,gy,2);}}
 gridToTerm(g,T);}});
def({id:'flame',name:'Flame',home:'pixel',lv:'Liesmas, ko kurina katra josla',make:()=>({heat:null,w:0,h:0,rng:Rng(0xF1A3C0DE)}),
 tick(v){const dotRows=v.rows*4,dotCols=v.cols*2,s=v.st;if(dotRows<4||dotCols<4)return;if(s.w!==dotCols||s.h!==dotRows){s.heat=new Float32Array(dotRows*dotCols);s.w=dotCols;s.h=dotRows;}
  const h=s.heat,b=v.sb,n=b.length,r=s.rng;
  for(let x=0;x<dotCols;x++){const src=n?sampleLin(b,x/Math.max(1,dotCols-1)*(n-1)):0;h[x]=n?Math.min(1.05,.3+.7*src+(r.next()%100)/100*.18):.3+(r.next()%100)/100*.2;}
  // cliamp liesma rēķināta 7 rindām (28 punktiem); zemākā joslā dziest ātrāk, lai paliek liesma, nevis siena.
  const k=Math.max(1,28/dotRows);
  for(let y=dotRows-1;y>=1;y--){const db=(.01+.028*y/Math.max(1,dotRows-1))*k;for(let x=0;x<dotCols;x++){const q=r.next(),sx=clamp(x+q%3-1,0,dotCols-1),j=((q>>>2)%100)/100*.018;h[y*dotCols+x]=Math.max(0,h[(y-1)*dotCols+sx]-db-j);}}},
 render(v,T){const s=v.st,dotRows=v.rows*4,dotCols=v.cols*2;if(!s.heat||s.w!==dotCols||s.h!==dotRows)return;
  for(let row=0;row<v.rows;row++)for(let col=0;col<v.cols;col++){let bits=0,ct=-1;
   for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++){const y=row*4+dr,x=col*2+dc,h=s.heat[(dotRows-1-y)*dotCols+x];if(h<.1)continue;if(h<.25&&scatterHash(0,y,x,v.frame)>h*4)continue;const t=h>=.55?1:2;bits|=BBIT[dr][dc];if(t>ct)ct=t;}
   if(bits)T.put(col,row,BR+bits,P(Math.max(0,ct)));}}});
def({id:'geyser',name:'Geyser',home:'pixel',lv:'Strūklaka, kas izšauj daļiņas ar basu',make:()=>({g:new Dots(),parts:[],rng:Rng(0xFEED5EED),prev:0}),
 tick(v){const dotRows=v.rows*4,dotCols=v.cols*2,s=v.st;if(dotRows<4||dotCols<4)return;s.g.ensure(dotRows,dotCols);const b=v.sb;if(!b.length)return;
  const n=b.length,bass=bandAvg(b,0,Math.max(1,fl(n/3))),mid=bandAvg(b,fl(n/3),fl(2*n/3)),high=bandAvg(b,fl(2*n/3),n),delta=bass-s.prev;s.prev=bass;
  const jx=fl(dotCols/2),js=Math.max(2,fl(dotCols/16)),r=s.rng;
  const spawn=(spread,vy)=>{const x=jx+fl(r.f()*(2*spread+1))-spread,vyj=vy*(.6+r.f()*.5),vxj=(r.f()-.5)*(1+vy*.4),q=r.f();s.parts.push({x,y:dotRows-1,vx:vxj,vy:-vyj,t:q<bass?3:q<bass+mid?2:1,life:0});};
  const steady=bass*.85+mid*.25+high*.08;for(let i=0;i<fl(steady*6);i++)spawn(js,1.5+steady*4.5);
  if(delta>.06&&bass>.15){const burst=40+fl(delta*180);for(let i=0;i<burst;i++)spawn(js*2,4.5+delta*10+bass*4);}
  const live=[];for(const p of s.parts){p.vy+=.3;p.vx*=.992;p.x+=p.vx;p.y+=p.vy;p.life++;let ix=Math.trunc(p.x),iy=Math.trunc(p.y);if(iy>=dotRows||ix<0||ix>=dotCols||p.life>200)continue;if(iy<0)iy=0;s.g.set(ix,iy,p.t);live.push(p);}
  s.parts=live;},
 render(v,T){const g=v.st.g;if(g.h!==v.rows*4||g.w!==v.cols*2)return;gridToTerm(g,T);}});
const MOSAIC=[[SP,-1],[0x2591,0],[0x2592,0],[0x2593,0],[FULL,0],[FULL,1],[FULL,2]];
const mosaicLevel=i=>i>=.85?MOSAIC[6]:i>=.65?MOSAIC[5]:i>=.45?MOSAIC[4]:i>=.28?MOSAIC[3]:i>=.15?MOSAIC[2]:i>=.05?MOSAIC[1]:MOSAIC[0];
def({id:'mosaic',name:'Mosaic',home:'pixel',lv:'Flīžu siena, kas iedegas pa joslām',make:()=>({rows:0,tiles:0,cells:[]}),
 tick(v){const s=v.st,rows=v.rows,tiles=v.cols<2?0:fl((v.cols+1)/3),b=v.sb,n=b.length||10;if(rows<=0||tiles<=0)return;
  if(s.rows!==rows||s.tiles!==tiles){s.rows=rows;s.tiles=tiles;s.cells=[];const r=Rng(0xC1AB1A10);
   for(let y=0;y<rows;y++){const base=rows>1?fl((rows-1-y)*(n-1)/(rows-1)):fl(n/2);for(let x=0;x<tiles;x++){const band=clamp(base+(r.next()%5)-2,0,n-1);s.cells.push({b:band,th:.04+(r.next()%1000)/1000*.74,v:0});}}}
  for(const c of s.cells){const l=b[c.b]||0;if(l>c.th){const ig=Math.min(l,1.05);if(ig>c.v)c.v=ig;}c.v*=.88;if(c.v<.001)c.v=0;}},
 render(v,T){const s=v.st;if(!s.cells.length)return;for(let y=0;y<s.rows;y++)for(let x=0;x<s.tiles;x++){const[code,tier]=mosaicLevel(s.cells[y*s.tiles+x].v);if(code===SP)continue;T.put(x*3,y,code,P(tier));T.put(x*3+1,y,code,P(tier));}}});
def({id:'sand',name:'Sand',home:'pixel',lv:'Smiltis birst, bass tās uzmet, pilnas sprāgst',make:()=>({g:new Dots(),rng:Rng(0x5A4D5A4D),prev:0,parts:[],ttl:0}),
 tick(v){const dotRows=v.rows*4,dotCols=v.cols*2,s=v.st;if(dotRows<4||dotCols<4)return;s.g.resize(dotRows,dotCols);const G=s.g.c,b=v.sb,n=b.length,r=s.rng,bass=bandAvg(b,0,Math.max(1,fl(n/3)));
  if(s.ttl>0||s.parts.length){G.fill(0);const live=[];for(const p of s.parts){p.vy+=.5;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;const ix=Math.trunc(p.x),iy=Math.trunc(p.y);if(iy<0||iy>=dotRows||ix<0||ix>=dotCols)continue;G[iy*dotCols+ix]=p.t;live.push(p);}
   s.parts=live;if(s.ttl>0)s.ttl--;if(!s.parts.length)s.ttl=0;s.prev=bass;return;}
  for(let i=0;i<n;i++){const l=b[i];if(l<.1||r.f()>l*.85)continue;const ce=fl((i*2+1)*dotCols/(2*n)),sp=Math.max(1,fl(dotCols/(n*2)));const x=clamp(ce+fl(r.f()*2*sp)-sp,0,dotCols-1);
   if(!G[x])G[x]=i<fl(n/3)?3:i<fl(2*n/3)?2:1;}
  const delta=bass-s.prev;s.prev=bass;
  if(delta>.06&&bass>.15){let fill=0;for(let i=0;i<G.length;i++)if(G[i])fill++;
   if(fill/G.length>.3){s.parts=[];for(let y=0;y<dotRows;y++){const df=y/Math.max(1,dotRows-1);for(let x=0;x<dotCols;x++){const t=G[y*dotCols+x];if(!t)continue;G[y*dotCols+x]=0;s.parts.push({x,y,vx:(r.f()-.5)*8,vy:-(2+r.f()*5+df*2),t});}}s.ttl=80;return;}
   const str=Math.min(1.4,delta*3.5+bass*.8);
   for(let y=0;y<dotRows;y++){const df=y/Math.max(1,dotRows-1),lp=Math.min(.95,str*(.3+.7*df)),lm=2+fl(str*7*(.4+.6*df)),jr=1+fl(str*5);
    for(let x=0;x<dotCols;x++){const t=G[y*dotCols+x];if(!t||r.f()>lp)continue;const ny=Math.max(0,y-(1+fl(r.f()*lm))),nx=clamp(x+fl(r.f()*(2*jr+1))-jr,0,dotCols-1);if(!G[ny*dotCols+nx]){G[ny*dotCols+nx]=t;G[y*dotCols+x]=0;}}}}
  if(bass>.3){const rum=Math.min(.6,(bass-.3)*1.8),minY=fl(dotRows/2);
   for(let y=minY;y<dotRows;y++){const df=(y-minY)/Math.max(1,dotRows-1-minY),pr=rum*(.15+.55*df);
    for(let x=0;x<dotCols;x++){const t=G[y*dotCols+x];if(!t||r.f()>pr)continue;const ny=Math.max(0,y-(1+fl(r.f()*2))),nx=clamp(x+fl(r.f()*5)-2,0,dotCols-1);if(!G[ny*dotCols+nx]){G[ny*dotCols+nx]=t;G[y*dotCols+x]=0;}}}}
  for(let y=dotRows-2;y>=0;y--){const lf=v.frame%2===0;for(let k=0;k<dotCols;k++){const x=lf?k:dotCols-1-k,t=G[y*dotCols+x];if(!t)continue;
    if(!G[(y+1)*dotCols+x]){G[(y+1)*dotCols+x]=t;G[y*dotCols+x]=0;continue;}const d1=r.f()<.5?1:-1;
    for(const dx of[d1,-d1]){const nx=x+dx;if(nx<0||nx>=dotCols)continue;if(!G[(y+1)*dotCols+nx]){G[(y+1)*dotCols+nx]=t;G[y*dotCols+x]=0;break;}}}}
  for(let x=0;x<dotCols;x++)if(G[(dotRows-1)*dotCols+x]&&r.f()<.04)G[(dotRows-1)*dotCols+x]=0;},
 render(v,T){const g=v.st.g;if(g.h!==v.rows*4||g.w!==v.cols*2)return;gridToTerm(g,T);}});
// Logo: cliamp raksta "CLIAMP", RG raksta "RG RADIO" (5×7 pikseļu burti).
const GLYPH={R:[0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],G:[0x0E,0x11,0x10,0x17,0x11,0x11,0x0F],A:[0x0E,0x11,0x11,0x1F,0x11,0x11,0x11],D:[0x1E,0x11,0x11,0x11,0x11,0x11,0x1E],I:[0x1F,0x04,0x04,0x04,0x04,0x04,0x1F],O:[0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],' ':[0,0,0,0,0,0,0]};
const LOGO='RG RADIO',LOGO_BAND=[0,1,2,3,5,6,8,9];
def({id:'logo',name:'Logo',home:'dither',lv:'"RG RADIO" pikseļu burti, kas piepildās ar skaņu',render(v,T){
 const dotRows=v.rows*4,dotCols=v.cols*2,g=new Uint8Array(dotRows*dotCols),L=LOGO.length,totalW=L*5+(L-1)*2,b=v.sb;
 const sx=Math.max(1,fl(dotCols/totalW)),sy=Math.max(1,fl(fl(dotRows*3/4)/7)),ox=fl((dotCols-totalW*sx)/2),oy=fl((dotRows-7*sy)/2);
 for(let li=0;li<L;li++){const gl=GLYPH[LOGO[li]],e=b[LOGO_BAND[li]]||0,bounce=Math.trunc(e*oy*.3+Math.sin(v.frame*.06+li*.9)*1.5),lx=ox+li*7*sx,ly=oy-bounce,fill=e*e*.75+.15;
  for(let py=0;py<7;py++){const rw=gl[py];for(let px=0;px<5;px++){if(!(rw&(1<<(4-px))))continue;
   for(let yy=0;yy<sy;yy++)for(let xx=0;xx<sx;xx++){const dx=lx+px*sx+xx,dy=ly+py*sy+yy;if(dx<0||dx>=dotCols||dy<0||dy>=dotRows)continue;if(scatterHash(li,py*sy+yy,px*sx+xx,v.frame)>fill)continue;g[dy*dotCols+dx]=1;}}}}
 packBraille(g,dotCols,T,specRowLevel);}});
// Omarchy lauks: dreifējošs troksnis caur Bayer matricu; Omarchy zīmes vietā RG zīme.
const OM_BAYER=[0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
const OM_NOISE=(()=>{const r=Rng(0x9E3779B9),a=new Float32Array(64*64);for(let i=0;i<a.length;i++)a[i]=(r.next()%100000)/100000;return a;})();
function omNoise(u,w){u-=Math.floor(u/64)*64;w-=Math.floor(w/64)*64;const x0=fl(u),y0=fl(w),x1=(x0+1)%64,y1=(y0+1)%64,fx=u-x0,fy=w-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const a=OM_NOISE[y0*64+x0],b=OM_NOISE[y0*64+x1],c=OM_NOISE[y1*64+x0],d=OM_NOISE[y1*64+x1];return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;}
const omJit=(r,c)=>hash01(r*6271+7,c*3037+13);
const RG_MARK=(()=>{const w=12,h=7,on=new Uint8Array(w*h);['R','G'].forEach((ch,k)=>GLYPH[ch].forEach((rw,y)=>{for(let x=0;x<5;x++)if(rw&(1<<(4-x)))on[y*w+k*7+x]=1;}));return{w,h,on};})();
def({id:'omarchy',name:'Omarchy',home:'dither',lv:'Dither trokšņa lauks ar RG zīmi vidū',iv:TICK_ANIM,render(v,T){
 const rows=v.rows,cols=v.cols,pR=rows*2,pC=cols,t=v.frame*.03,b=v.sb,n=b.length,amp=avgOf(b),M=RG_MARK;
 const scale=(pR<M.h+2||pC<M.w+2)?0:Math.min(fl((pR-2)/M.h),fl((pC-2)/M.w),3),mw=M.w*scale,mh=M.h*scale,mx=fl((pC-mw)/2),my=fl((pR-mh)/2);
 const levelAt=pc=>{if(!n)return 0;const half=pC/2,side=Math.min(1,Math.abs(pc+.5-half)/Math.max(half,1)),pos=(1-side)*n-.5,b0=clamp(fl(pos),0,n-1),b1=Math.min(b0+1,n-1),m=clamp(pos-b0,0,1);return Math.max(0,(b[b0]*(1-m)+b[b1]*m-.06)/.94);};
 const pix=(pr,pc)=>{
  if(scale>0&&pc>=mx&&pr>=my&&pc<mx+mw&&pr<my+mh&&M.on[fl((pr-my)/scale)*M.w+fl((pc-mx)/scale)])return specTag(.34+levelAt(pc)*.35+amp*.45);
  let shade=1;if(scale>0){const dx=Math.max(0,mx-pc,pc-(mx+mw-1)),dy=Math.max(0,my-pr,pr-(my+mh-1));shade=Math.pow(Math.min(1,Math.hypot(dx,dy)/6),3);}
  if(shade<.004)return -1;let spec=0;const l=levelAt(pc);if(l>0){const up=pR-1-pr,tall=l*pR*.95;if(up<tall)spec=l*Math.pow(1-up/tall,.85);}
  const u=pc/6,w=pr/6,base=.6*omNoise(u+t*.14,w-t*.055)+.4*omNoise(u*.55-t*.08,w*.55+t*.06),tw=.5+.5*Math.sin(t*1.1+omJit(pr,pc)*2*Math.PI);
  const lum=shade*(.3+.52*base*base+.18*tw+amp*.22)*.34+spec*.72*Math.min(1,shade*3),th=.55*(OM_BAYER[(pr&7)*8+(pc&7)]+.5)/64+.45*omJit(pr+7,pc+13);
  return lum<=th?-1:specTag(spec*.55+amp*.12);};
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const u=pix(row*2,col),l=pix(row*2+1,col);
  if(u>=0&&l>=0)T.put(col,row,FULL,P(Math.max(u,l)));else if(u>=0)T.put(col,row,UPPER,P(u));else if(l>=0)T.put(col,row,LOWER,P(l));}}});
// Red Sector Inc. megademo (Amiga 1989): pieci stieples stabiņi griežas, aiz tiem zvaigznes.
const RS={bars:5,hw:.26,hd:.26,pitch:.78,ground:-1.05,minH:.4,maxH:2.3,focal:3.2,camZ:6,zoomA:1.5,maxStretch:2,comfort:40,spinY:.105,spinX:.073,zoomR:.011,relax:.001,minEnv:.06};
const RS_CX=[-1,1,1,-1,-1,1,1,-1],RS_CZ=[-1,-1,-1,-1,1,1,1,1],RS_TOP=[0,0,1,1,0,0,1,1],RS_FACES=[[0,1,2,3],[5,4,7,6],[0,3,7,4],[1,5,6,2],[3,2,6,7],[0,4,5,1]];
const RS_MAP=[0,DIM,DLOW,DMID,DHIGH,LOW,MID,HIGH];
function rsPlace(x,y,z,cX,sX,cY,sY,camZ){const x1=x*cY+z*sY,z1=-x*sY+z*cY,y1=y*cX-z1*sX,z2=y*sX+z1*cX,f=RS.focal/Math.max(.35,z2+camZ);return[x1,y1,z2,x1*f,y1*f];}
def({id:'redsector',name:'RedSector',home:'dither',lv:'Amiga megademo: rotējoši stieples stabiņi un zvaigznes',make:()=>({g:new Dots(),ceil:[0,0,0,0,0],floor:[1,1,1,1,1],hts:[.4,.4,.4,.4,.4]}),
 tick(v){const s=v.st,b=v.sb;for(let i=0;i<RS.bars;i++){const lvl=Math.max(clamp(b[i*2]||0,0,1),clamp(b[i*2+1]||0,0,1));
  if(lvl>s.ceil[i])s.ceil[i]=lvl;else s.ceil[i]-=RS.relax;if(lvl<s.floor[i])s.floor[i]=lvl;else s.floor[i]+=RS.relax;if(s.ceil[i]<s.floor[i]+RS.minEnv)s.ceil[i]=s.floor[i]+RS.minEnv;
  const nm=clamp((lvl-s.floor[i])/(s.ceil[i]-s.floor[i]),0,1),tg=RS.minH+nm*(RS.maxH-RS.minH);s.hts[i]+=(tg-s.hts[i])*(tg>s.hts[i]?.75:.28);}},
 render(v,T){const dotRows=v.rows*4,dotCols=v.cols*2;if(dotRows<4||dotCols<16)return;const g=v.st.g;g.ensure(dotRows,dotCols);const fr=v.frame;
  const cnt=Math.min(90,Math.max(6,fl(dotRows*dotCols/130)));
  for(let i=1;i<=cnt;i++){const sp=.1+(i%3)*.09;let x=(hash01(i,0)*dotCols-fr*sp)%dotCols;if(x<0)x+=dotCols;g.set(fl(x),fl(hash01(i,1)*dotRows),Math.min(4,1+fl(hash01(i,2)*4)));}
  const cY=Math.cos(fr*RS.spinY),sY=Math.sin(fr*RS.spinY),cX=Math.cos(fr*RS.spinX),sX=Math.sin(fr*RS.spinX),camZ=RS.camZ+Math.sin(fr*RS.zoomR)*RS.zoomA;
  const hull=(RS.bars-1)/2*RS.pitch+RS.hw;let mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity;
  for(const sx of[-1,1])for(const y of[RS.ground,RS.ground+RS.maxH])for(const sz of[-1,1]){const p=rsPlace(sx*hull,y,sz*RS.hd,cX,sX,cY,sY,camZ);mnX=Math.min(mnX,p[3]);mxX=Math.max(mxX,p[3]);mnY=Math.min(mnY,p[4]);mxY=Math.max(mxY,p[4]);}
  const zoom=.55+.3*(.5+.5*Math.sin(fr*RS.zoomR)),fitY=(dotRows-1)/Math.max(mxY-mnY,.001)*zoom,stretch=Math.min(RS.maxStretch,Math.max(1,RS.comfort/dotRows)),fitX=Math.min(fitY*stretch,(dotCols-1)/Math.max(mxX-mnX,.001));
  const ccx=dotCols/2-(mnX+mxX)/2*fitX,ccy=dotRows/2+(mnY+mxY)/2*fitY;
  const line=(x0,y0,x1,y1,tag)=>{const dx=x1-x0,dy=y1-y0,span=Math.max(Math.abs(dx),Math.abs(dy));if(!isFinite(span))return;const st=Math.min(512,fl(span)+1);for(let k=0;k<=st;k++){const t=k/st;g.set(fl(x0+dx*t+.5),fl(y0+dy*t+.5),tag);}};
  for(let bar=0;bar<RS.bars;bar++){const bx=(bar-(RS.bars-1)/2)*RS.pitch,h=v.st.hts[bar],top=RS.ground+h,shown=(h-RS.minH)/(RS.maxH-RS.minH),tag=shown>=.6?7:shown>=.3?6:5,R=[],Px=[],Py=[];
   for(let c=0;c<8;c++){const p=rsPlace(bx+RS_CX[c]*RS.hw,RS_TOP[c]?top:RS.ground,RS_CZ[c]*RS.hd,cX,sX,cY,sY,camZ);R.push(p);Px.push(ccx+p[3]*fitX);Py.push(ccy-p[4]*fitY);}
   for(const f of RS_FACES){const p1=R[f[0]],p2=R[f[1]],p3=R[f[2]],ux=p2[0]-p1[0],uy=p2[1]-p1[1],uz=p2[2]-p1[2],vx=p3[0]-p2[0],vy=p3[1]-p2[1],vz=p3[2]-p2[2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;if(nx*p1[0]+ny*p1[1]+nz*(p1[2]+camZ)<=0)continue;
    for(let e=0;e<4;e++){const a=f[e],c=f[(e+1)%4];line(Px[a],Py[a],Px[c],Py[c],tag);}}}
  gridToTerm(g,T,t=>RS_MAP[t]||FG);}});
// YinYang: divas koi zivis riņķo ap lotosu (platā logā – S līknē); bungas sit astes.
const YY={J:13,seg:1.5,flick:8,maxPow:1.4,swirl:12,stand:1.5,rest:20,bassSteps:40,quiet:.02,pace:2.5,arc:64,gap:36,half:6.3,nose:2.6,tail:1};
const YY_R=[2.5,2.9,2.9,2.7,2.4,2.05,1.75,1.45,1.2,1,.85,.7,.6];
const WATER=0,YDIM=1,PAD=2,RED=3,INK=4,GOLD=5,YY_MAP=[0,DIM,LOW,HIGH,FG,MID];
const YY_PAT=[{body:RED,back:[0,INK,INK,0,INK,INK,0,0,INK,INK,0,INK,0]},{body:INK,back:[0,RED,RED,0,0,RED,RED,RED,0,0,0,0,0]}];
const YY_PETAL=(()=>{const w=[];for(let i=0;i<=64;i++)w.push(.36*Math.pow(Math.sin(Math.PI*Math.pow(i/64,.8)),.6));return w;})();
function yyOnset(from,to,k,floor,gap){return{from,to,k,floor,gap,mean:.03,dev:.02,since:gap};}
function yyStep(o,b,prev){const n=b.length;let flux=0;for(let i=fl(o.from*n);i<fl(o.to*n)&&i<prev.length;i++)flux+=Math.max(0,b[i]-prev[i]);
 const th=Math.max(o.mean+o.k*o.dev,o.floor),hit=flux>th&&o.since>=o.gap;o.mean=o.mean*.92+flux*.08;o.dev=o.dev*.92+Math.abs(flux-o.mean)*.08;if(hit)o.since=0;else o.since++;return[hit,flux/th];}
function yyKoi(){return{j:[],pj:[],offset:0,phase:0,phaseStep:0,stroke:.6,flick:0,flickRest:0,flickPower:0,flickDir:1};}
function YYState(){this.w=0;this.h=0;this.angle=0;this.loud=.3;this.mood=.3;this.bloom=.4;this.breath=0;this.bass=new Float32Array(YY.bassSteps);this.bn=0;this.bc=0;this.lo=null;this.hi=null;this.prev=null;
 this.kick=yyOnset(0,.3,2,.05,6);this.snare=yyOnset(.3,.6,2,.04,5);this.hat=yyOnset(.6,1,1.8,.025,4);this.koi=[yyKoi(),yyKoi()];this.swirls=[];this.px=null;}
YYState.prototype.layout=function(w,h){
 this.w=w;this.h=h;this.cx=w/2;this.cy=h/2;this.strip=w>h*3;
 if(this.strip){this.size=Math.min(h*.84/(2*YY.half),w/80);this.radius=Math.min(h*.3,this.size*4.5);const hidden=YY.seg*(YY.J-1)+YY.nose+YY.tail;this.lap=Math.round(w+hidden*this.size);this.waves=Math.max(1,Math.round(this.lap/(55*this.size)));this.pad=0;
  const wave=this.lap/this.waves;this.arc=[0];for(let i=1;i<=YY.arc;i++){const x0=(i-1)*wave/YY.arc,x1=i*wave/YY.arc,dy=(Math.cos(2*Math.PI*x1/wave)-Math.cos(2*Math.PI*x0/wave))*this.radius;this.arc.push(this.arc[i-1]+Math.hypot(x1-x0,dy));}
  this.track=this.waves*this.arc[YY.arc];}
 else{const m=Math.min(w,h,160);this.radius=m*.36;this.lap=2*Math.PI*this.radius;this.track=this.lap;this.pad=m*.17;this.size=Math.min(m*.34*1.35/18,(w/2-this.radius)/YY.half,(h/2-this.radius)/YY.half);}
 this.koi=[yyKoi(),yyKoi()];this.koi[1].offset=Math.PI;this.koi[1].phase=1.5;
 if(this.strip){this.koi[0].offset=-this.toAngle(YY.gap);this.koi[1].offset=0;}
 for(const k of this.koi){this.lineUp(k);k.pj=k.j.map(p=>({x:p.x,y:p.y}));}this.swirls=[];
};
YYState.prototype.toAngle=function(d){return d*this.size*2*Math.PI/this.track;};
YYState.prototype.trackPoint=function(a){
 if(!this.strip)return{x:this.cx+Math.cos(a)*this.radius,y:this.cy+Math.sin(a)*this.radius};
 const per=this.arc[YY.arc];let s=a/(2*Math.PI)*this.track;const n=Math.floor(s/per);s-=n*per;
 let lo=0,hi=this.arc.length;while(lo<hi){const m=(lo+hi)>>1;if(this.arc[m]<s)lo=m+1;else hi=m;}const i=Math.max(1,Math.min(YY.arc,lo));
 const t=(s-this.arc[i-1])/(this.arc[i]-this.arc[i-1]),wave=this.lap/this.waves,x=(i-1+t)*wave/YY.arc;
 return{x:n*wave+x+this.w*.6,y:this.cy+Math.cos(2*Math.PI*x/wave)*this.radius};
};
YYState.prototype.lineUp=function(k){let a=this.angle+k.offset;k.j=[];for(let i=0;i<YY.J;i++){k.j.push(this.trackPoint(a));a-=this.toAngle(YY.seg);}this.follow(k);};
YYState.prototype.follow=function(k){const seg=YY.seg*this.size;for(let i=1;i<YY.J;i++){const a=k.j[i-1],b=k.j[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0){b.x=a.x+dx/d*seg;b.y=a.y+dy/d*seg;}}};
YYState.prototype.advance=function(b,playing){
 const n=b.length;if(!this.lo||this.lo.length!==n){this.lo=new Array(n).fill(1);this.hi=new Array(n).fill(0);this.prev=null;}
 let energy=0,avg=0;for(let i=0;i<n;i++){energy+=b[i];this.hi[i]=Math.max(b[i],this.hi[i]-.004);this.lo[i]=Math.min(b[i],this.lo[i]+.004);avg+=clamp((b[i]-this.lo[i])/Math.max(this.hi[i]-this.lo[i],.12),0,1);}
 if(n){energy/=n;avg/=n;}const quiet=!playing||energy<YY.quiet;
 if(playing){this.loud+=(avg-this.loud)*.05;this.mood+=(avg-this.mood)*.01;const bl=quiet?0:clamp((this.mood-.1)/.5,0,1);this.bloom+=(bl-this.bloom)*.02;}
 if(this.prev){for(const[o,ki,here]of[[this.kick,0,this.strip],[this.snare,0,!this.strip],[this.hat,1,true]]){const[hit,str]=yyStep(o,b,this.prev),k=this.koi[ki];
  if(hit&&here&&!quiet&&str>=YY.stand&&k.flickRest===0){const pw=Math.min(YY.maxPow,.6+.3*str);if(k.flick===0){k.flickPower=pw;k.flickDir=-k.flickDir;}k.flick=Math.max(k.flick,YY.flick-k.flick);k.flickRest=YY.rest;}}}
 this.prev=b.slice();this.breath*=.8;
 if(playing&&n){let lvl=0;const low=Math.max(1,fl(n/5));for(let i=0;i<low;i++)lvl+=b[i]/low;this.bass[this.bn]=lvl;this.bn=(this.bn+1)%YY.bassSteps;this.bc=Math.min(this.bc+1,YY.bassSteps);
  if(!quiet&&!this.strip){let lo=lvl,hi=lvl;for(let i=0;i<this.bc;i++){lo=Math.min(lo,this.bass[i]);hi=Math.max(hi,this.bass[i]);}this.breath=(lvl-lo)/Math.max(hi-lo,.08);}}
 let pace=0;if(playing){pace=quiet?.066:this.strip?.11+.22*this.loud:.09+.13*this.mood;if(this.strip)pace=Math.max(pace*YY.pace,(quiet?.7:1+this.loud)/this.size);this.angle+=this.toAngle(pace);}
 const stroke=quiet?.1:.3+this.mood,beat=quiet?.09:.125+.085*this.mood;
 for(const k of this.koi){k.pj=k.j.map(p=>({x:p.x,y:p.y}));k.phaseStep=0;k.flickRest=Math.max(0,k.flickRest-1);k.stroke+=(stroke-k.stroke)*.02;
  if(playing){k.phaseStep=beat;k.phase+=beat;k.j[0]=this.trackPoint(this.angle+k.offset);this.follow(k);}
  if(k.flick===YY.flick&&!this.strip){const tl=k.j[YY.J-1],rt=k.j[YY.J-2],out=Math.atan2(tl.y-rt.y,tl.x-rt.x)+k.flickDir*Math.PI/2;
   this.swirls.push({x:tl.x+Math.cos(out)*1.2*this.size,y:tl.y+Math.sin(out)*1.2*this.size,angle:out,spin:k.flickDir,life:YY.swirl});}
  if(k.flick>0)k.flick--;}
 this.swirls=this.swirls.filter(s=>--s.life>0);
};
function yyCanvas(w,h,size,strip,lap){return{w,h,size,strip,lap,px:new Int8Array(w*h)};}
function yySet(c,x,y,t){if(c.strip){const L=fl(c.lap);x%=L;if(x<0)x+=L;}if(t<0||x<0||y<0||x>=c.w||y>=c.h)return;c.px[y*c.w+x]=t;}
function yyDisc(c,cx,cy,r,shade){if(r<=0)return;for(let y=Math.max(0,fl(cy-r));y<=Math.min(c.h-1,Math.ceil(cy+r));y++)for(let x=Math.max(0,fl(cx-r));x<=Math.min(c.w-1,Math.ceil(cx+r));x++){const dx=(x+.5-cx)/r,dy=(y+.5-cy)/r;if(dx*dx+dy*dy<=1)yySet(c,x,y,shade(dx,dy));}}
function yyFill(c,cx,cy,r,t){yyDisc(c,cx,cy,r,()=>t);}
function yyShape(c,k,pat,swim){
 const j=k.j.map(p=>({x:p.x,y:p.y})),size=c.size;let wag=.5;
 if(swim){wag=.6*k.stroke;for(let i=4;i<YY.J;i++){const a=k.j[i-1],b=k.j[i],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d>0){const f=(i-3)/(YY.J-4),off=Math.sin(k.phase-f*2.5)*f*f*k.stroke*1.8*size;j[i].x-=dy/d*off;j[i].y+=dx/d*off;}}}
 if(k.flick>0){const w=Math.sin(Math.PI*k.flick/YY.flick),bend=.6*w*w*k.flickPower*k.flickDir,root=j[YY.J-5],prev=j[YY.J-6],hx=root.x-prev.x,hy=root.y-prev.y,d=Math.hypot(hx,hy);
  if(d>0){const px=-hy/d,py=hx/d;for(let i=YY.J-5;i<YY.J;i++){const off=(i-(YY.J-6))/5*bend*size*1.5;j[i].x+=px*off;j[i].y+=py*off;}}}
 const head=Math.atan2(j[0].y-j[2].y,j[0].x-j[2].x),flap=Math.sin(k.phase*.5)*.25;
 for(const side of[-1,1]){const a=head+Math.PI+side*(1.25+flap);for(let t=0;t<3;t++){const off=(YY_R[2]+.6+t)*size;yyFill(c,j[2].x+Math.cos(a)*off,j[2].y+Math.sin(a)*off,(1.5-t*.35)*size,pat.body);}}
 const back=Math.atan2(j[7].y-j[6].y,j[7].x-j[6].x);for(const side of[-1,1]){const a=back+side*1.9;yyFill(c,j[7].x+Math.cos(a)*1.6*size,j[7].y+Math.sin(a)*1.6*size,.8*size,pat.body);}
 const last=j[YY.J-1],bef=j[YY.J-2],tail=Math.atan2(last.y-bef.y,last.x-bef.x)+Math.sin(k.phase-2)*wag;
 yyFill(c,last.x+Math.cos(tail)*1.2*size,last.y+Math.sin(tail)*1.2*size,.75*size,pat.body);yyFill(c,last.x+Math.cos(tail)*.6*size,last.y+Math.sin(tail)*.6*size,.65*size,pat.body);
 for(let i=YY.J-1;i>=0;i--){yyFill(c,j[i].x,j[i].y,YY_R[i]*size,pat.body);if(i>0)yyFill(c,(j[i].x+j[i-1].x)/2,(j[i].y+j[i-1].y)/2,(YY_R[i]+YY_R[i-1])/2*size,pat.body);}
 for(let i=YY.J-1;i>=0;i--){const p=pat.back[i];if(p!==WATER)yyFill(c,j[i].x,j[i].y,YY_R[i]*size*.62,p);}
 return j;
}
function yyCloseGaps(px,w,fill){const h=px.length/w;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(px[i]===WATER&&((x>0&&x<w-1&&px[i-1]&&px[i+1])||(y>0&&y<h-1&&px[i-w]&&px[i+w])))px[i]=fill;}}
function yyDraw(s){
 const c=yyCanvas(s.w,s.h,s.size,s.strip,s.lap);
 for(const sw of s.swirls){const open=(YY.swirl-sw.life)/YY.swirl,r=(1+2.5*open)*s.size;for(let i=0;i<=14;i++){const t=i/14;if(t>=1-open*.6)break;const a=sw.angle+t*4.5*sw.spin,rr=r*(.4+.6*t);yySet(c,fl(sw.x+Math.cos(a)*rr),fl(sw.y+Math.sin(a)*rr),YDIM);}}
 s.koi.forEach((k,ki)=>{const pat=YY_PAT[ki],reach=Math.ceil(YY.half*s.size)+2;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of k.j){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);}
  const ox=Math.floor(x0)-reach,oy=Math.floor(y0)-reach,bw=Math.ceil(x1)+reach-ox+1,bh=Math.ceil(y1)+reach-oy+1;if(!(bw>0&&bh>0)||bw*bh>400000)return;
  const loc=yyCanvas(bw,bh,s.size,false,0),lk={...k,j:k.j.map(p=>({x:p.x-ox,y:p.y-oy}))},jj=yyShape(loc,lk,pat,!s.strip);yyCloseGaps(loc.px,bw,pat.body);
  const head=Math.atan2(jj[0].y-jj[2].y,jj[0].x-jj[2].x),r=YY_R[0]*s.size*.75;for(const side of[-1,1]){const a=head+side*1.1;const ex=fl(jj[0].x+Math.cos(a)*r),ey=fl(jj[0].y+Math.sin(a)*r);if(ex>=0&&ey>=0&&ex<bw&&ey<bh)loc.px[ey*bw+ex]=WATER;}
  for(let i=0;i<loc.px.length;i++)if(loc.px[i]!==WATER)yySet(c,ox+i%bw,oy+fl(i/bw),loc.px[i]);});
 if(s.pad>0){const nx=Math.cos(.9),ny=Math.sin(.9),nt=Math.tan(.28);
  yyDisc(c,s.cx,s.cy,s.pad,(dx,dy)=>{const ah=dx*nx+dy*ny,as=dx*ny-dy*nx;return(ah>0&&Math.abs(as)<nt*ah&&dx*dx+dy*dy>.04)?-1:PAD;});
  const outer=.5+.12*s.bloom+.2*s.breath,inner=.3+.08*s.bloom+.08*s.breath;
  for(const[len,turn,tag]of[[s.pad*outer,0,INK],[s.pad*inner,Math.PI/6,RED]])yyDisc(c,s.cx,s.cy,len,(dx,dy)=>{let a=Math.atan2(dy,dx)-turn;a-=Math.round(a/(2*Math.PI/6))*2*Math.PI/6;const r=Math.hypot(dx,dy),al=r*Math.cos(a),ac=r*Math.sin(a);if(al>0&&al<1){const f=al*64,i=fl(f);if(Math.abs(ac)<=YY_PETAL[i]+(YY_PETAL[i+1]-YY_PETAL[i])*(f-i))return tag;}return -1;});
  yyFill(c,s.cx,s.cy,s.pad*inner*.35,GOLD);}
 return c.px;
}
def({id:'yinyang',name:'YinYang',home:'pixel',lv:'Divas koi zivis riņķo ap lotosu, bungas sit astes',make:()=>({yy:new YYState()}),
 tick(v){const s=v.st.yy,w=v.cols*2,h=v.rows*4;if(w<=0||h<=0)return;if(w!==s.w||h!==s.h)s.layout(w,h);s.advance(v.sb,v.playing);},
 render(v,T){const s=v.st.yy;if(s.w!==v.cols*2||s.h!==v.rows*4)return;const px=yyDraw(s);T.px=px;T.pw=s.w;T.ph=s.h;T.pmap=YY_MAP;}});

const BY_ID=new Map(MODES.map(m=>[m.id,m]));

// ---------------- viena spektra eksemplārs ----------------
function Vis(id){this.mode=BY_ID.get(id)||MODES[0];this.T=new Term();this.frame=0;this.st=this.mode.make?this.mode.make():{};this.sb=[];this.bands=[];this.last=0;this.acc=0;this.cols=0;this.rows=0;this.playing=false;this.feed=null;}
Vis.prototype.interval=function(){const iv=this.mode.iv;return typeof iv==='function'?iv(this):iv;};
Vis.prototype.bandCount=function(){const n=this.mode.n;return typeof n==='function'?n(this):n;};
// Atgriež true, ja kadrs mainījās (tad jāzīmē).
Vis.prototype.step=function(feed,now,cols,rows,playing){
 const iv=this.interval();this.feed=feed;this.playing=playing;
 const resized=cols!==this.cols||rows!==this.rows;this.cols=cols;this.rows=rows;
 if(!this.last){this.last=now;this.tick(now,iv);this.render();return true;}
 this.acc+=now-this.last;this.last=now;let steps=fl(this.acc/iv);
 if(steps<1){if(resized){this.render();return true;}return false;}
 if(steps>4){steps=4;this.acc=0;}else this.acc-=steps*iv;
 for(let s=0;s<steps;s++){this.frame++;this.tick(now-(steps-1-s)*iv,iv);}
 this.render();return true;
};
Vis.prototype.tick=function(now,iv){
 const n=this.bandCount(),dt=iv/1000;
 if(n>0){this.bands=this.feed.bands(n);
  if(this.sb.length!==n)this.sb=this.bands.slice();
  else for(let i=0;i<n;i++)this.sb[i]=ease(this.sb[i],this.bands[i],34,10,dt);}
 if(this.mode.tick)this.mode.tick(this,dt,now);
};
Vis.prototype.render=function(){this.T.size(this.cols,this.rows);if(this.mode.n!==0&&!this.sb.length)return;this.mode.render(this,this.T);};

// ---------------- zīmēšana ----------------
function dimColor(c,k){const m=/^#?([0-9a-f]{6})$/i.exec(c);if(!m)return c;const v=parseInt(m[1],16);return`rgb(${fl((v>>16&255)*k)},${fl((v>>8&255)*k)},${fl((v&255)*k)})`;}
// {fg,dim,low,mid,high} → masīvs pēc vietām 1–8
function palette(o){return[null,o.fg,o.dim,o.low,o.mid,o.high,dimColor(o.low,.6),dimColor(o.mid,.6),dimColor(o.high,.6)];}
function fit(w,h,rows){rows=rows||clamp(Math.round(h/17),4,14);const chh=h/rows;return{rows,cols:Math.max(8,fl(w/(chh*.52)))};}
const SHADE_DOTS={0x2591:[[0,0],[1,2]],0x2592:[[0,0],[1,1],[0,2],[1,3]],0x2593:[[0,0],[1,0],[0,1],[1,2],[0,2],[1,3]]};
// crisp: veseli pikseļi (Dither skatuvei, kur rūtiņas izmērs ir vesels skaitlis).
function paint(ctx,T,W,H,pal,font,crisp){
 if(!crisp)ctx.clearRect(0,0,W,H);if(!T.cols||!T.rows)return;
 const cw=W/T.cols,chh=H/T.rows,dw=cw/2,dh=chh/4,ds=crisp?Math.max(1,Math.round(Math.min(dw,dh)*.67)):Math.max(1,Math.min(dw,dh)*.82),lw=Math.max(1,crisp?Math.round(chh*.1):chh*.1),dof=crisp?(a=>Math.floor((a-ds)/2)):(a=>(a-ds)/2);
 if(T.px){const map=T.pmap||[],pw=T.pw,ph=T.ph,sx=W/pw,sy=H/ph;
  for(let slot=1;slot<pal.length;slot++){let any=false;ctx.beginPath();
   for(let y=0;y<ph;y++){let run=-1;for(let x=0;x<=pw;x++){const t=x<pw?map[T.px[y*pw+x]]:0;const on=t===slot;if(on&&run<0)run=x;else if(!on&&run>=0){ctx.rect(run*sx,y*sy,(x-run)*sx+.5,sy+.5);run=-1;any=true;}}}
   if(any){ctx.fillStyle=pal[slot];ctx.fill();}}
  return;}
 const paths=[],texts=[];
 for(let r=0;r<T.rows;r++)for(let c=0;c<T.cols;c++){const i=r*T.cols+c,code=T.ch[i];if(code===SP||code===BR)continue;const slot=T.tg[i]||FG;
  const x=c*cw,y=r*chh;let p=paths[slot];if(!p)p=paths[slot]=new Path2D();
  if(code>BR&&code<=0x28FF){const bits=code-BR;for(let dr=0;dr<4;dr++)for(let dc=0;dc<2;dc++)if(bits&BBIT[dr][dc])p.rect(x+dc*dw+dof(dw),y+dr*dh+dof(dh),ds,ds);}
  else if(code>=0x2581&&code<=0x2588){const k=code-0x2580;p.rect(x,y+chh*(1-k/8),cw+.5,chh*k/8+.5);}
  else if(code===UPPER)p.rect(x,y,cw+.5,chh/2);
  else if(SHADE_DOTS[code]){for(const[dc,dr]of SHADE_DOTS[code])p.rect(x+dc*dw,y+dr*dh,dw,dh);}
  else if(code===0x2500)p.rect(x,y+chh/2-lw/2,cw+.5,lw);
  else if(code===0x2502)p.rect(x+cw/2-lw/2,y,lw,chh+.5);
  else if(code===0x2503)p.rect(x+cw/2-lw,y,lw*2,chh+.5);
  else if(code>=0x23BA&&code<=0x23BD)p.rect(x,y+(code-0x23BA+.5)*dh-lw*.7,cw+.5,lw*1.4);
  else if(code===0x25AE)p.rect(x+cw*.18,y+chh*.18,cw*.64,chh*.64);
  else if(code===0x25A0){const s=Math.min(cw,chh)*.72;p.rect(x+(cw-s)/2,y+(chh-s)/2,s,s);}
  else if(code===0xB7){const s=Math.max(1,cw*.2);p.rect(x+(cw-s)/2,y+(chh-s)/2,s,s);}
  else texts.push(i);}
 for(let s=1;s<paths.length;s++)if(paths[s]){ctx.fillStyle=pal[s];ctx.fill(paths[s]);}
 if(texts.length){ctx.font=`700 ${Math.round(chh*.74)}px ${font||'ui-monospace,Menlo,Consolas,monospace'}`;ctx.textAlign='center';ctx.textBaseline='middle';
  for(const i of texts){ctx.fillStyle=pal[T.tg[i]||FG];ctx.fillText(String.fromCodePoint(T.ch[i]),(i%T.cols+.5)*cw,(fl(i/T.cols)+.54)*chh);}}
}

window.rgCliamp={modes:MODES.map(m=>({id:m.id,name:m.name,home:m.home,lv:m.lv})),create:id=>new Vis(id),Feed,analyserSource,fakeSource,palette,paint,fit};
})();
