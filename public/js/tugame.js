import{h}from'./util.js'
import{buildArt}from'./rushart.js'
import{terrorArt}from'./rushterror.js'
import{createSim,CS,LI,POT,chunk,near,around,buildingAt,push,UPS,ET,ABN,ABI}from'./tusim.js'
import{V as VC,setPeerVolume,toggleMute}from'./voice.js'
const TAU=Math.PI*2
const R=Math.random
const COL=['#ff9d2e','#6ec1ff','#9be564']
const TC=['#ff5fa2','#ffd93b','#ff3b30']
const TN=['Candy bomb','Spice grenade','Ghost pepper']
const RC={1:'255,95,162',2:'255,217,59',3:'255,59,48',4:'255,138,58',5:'180,138,255',6:'255,74,106',7:'255,90,60',9:'255,200,120',10:'255,255,255',11:'176,74,255',12:'120,90,255',13:'200,216,255',14:'125,255,122',15:'110,50,170'}
const FONT='Georgia,"Times New Roman",serif'
const hash=(i,j)=>((i*73856093)^(j*19349663))>>>0
const mmss=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0')
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
const mkL=rgb=>{const c=el('canvas');c.width=c.height=128;const g=c.getContext('2d');const q=g.createRadialGradient(64,64,0,64,64,64);q.addColorStop(0,'rgba('+rgb+',1)');q.addColorStop(.35,'rgba('+rgb+',.7)');q.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=q;g.fillRect(0,0,128,128);return c}
const LS={w:mkL('255,255,255'),warm:mkL('255,150,50'),cyan:mkL('90,200,255'),red:mkL('255,60,50'),vio:mkL('170,110,255')}
const KIND={chapel:['#243a5c','#8fe3ff'],armory:['#4a2f1c','#ffb347'],well:['#1f3a3a','#8fe3ff'],house:['#3a2a4a','#ffb347'],cabin:['#3a2c1c','#ffd27a'],barn:['#4a2a1c','#e07a4a'],tavern:['#3a2418','#ffd27a'],mansion:['#2a1a3a','#ffd93b'],bunker:['#2a2e3a','#9ab4d8'],mill:['#3a3326','#e8e2cc']}
const art=(w,h,ax,ay,fn)=>{const c=el('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn((x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh)},g);return{c,w,h,ax,ay}}
const K0='#07040c'
const PROP={
b:art(24,30,12,28,r=>{r(2,4,20,24,K0);r(4,6,16,20,'#7a4a22');r(4,10,16,2,'#3a2412');r(4,18,16,2,'#3a2412');r(4,6,16,2,'#a8743a');r(9,13,6,4,'#ff5a2a');r(10,14,4,2,'#ffd93b')}),
c:art(26,24,13,22,r=>{r(1,2,24,20,K0);r(3,4,20,16,'#a8794a');r(3,4,20,3,'#c8955a');r(3,11,20,2,'#6a4a2a');r(11,4,4,16,'#6a4a2a');r(3,19,20,1,'#6a4a2a')})
}
const ALTAR=art(34,34,17,32,r=>{r(2,20,30,12,K0);r(4,22,26,8,'#5a4a78');r(4,22,26,2,'#8a74b0');r(8,10,18,12,K0);r(10,12,14,8,'#4a3a68');r(13,2,8,8,K0);r(14,3,6,6,'#b48aff');r(15,4,2,2,'#fff')})
const LOGS=art(30,16,15,14,r=>{r(2,8,26,6,K0);r(3,9,24,4,'#5a3a1c');r(6,4,18,6,K0);r(7,5,16,4,'#7a4a22');r(5,11,6,2,'#3a2412');r(19,11,6,2,'#3a2412')})
const chestArt=()=>{
const mk=open=>{
const c=el('canvas');c.width=40;c.height=32
const g=c.getContext('2d')
const r=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)}
r(2,12,36,18,'#07040c');r(4,14,32,14,'#7a4a22');r(4,22,32,2,'#4a2c12');r(4,14,32,3,'#9a6232')
if(open){r(2,0,36,10,'#07040c');r(4,2,32,6,'#9a6232');r(4,14,32,8,'#1a0e08');r(10,15,4,3,'#ffd93b');r(18,16,5,3,'#ff5fa2');r(26,15,4,3,'#8fe3ff')}
else{r(2,4,36,10,'#07040c');r(4,6,32,7,'#9a6232');r(4,6,32,2,'#c28a4a');r(17,12,6,8,'#07040c');r(18,13,4,6,'#ffd93b')}
return{c,w:40,h:32,ax:20,ay:30}
}
return[mk(0),mk(1)]
}
const OBEL=art(22,44,11,42,r=>{r(4,34,14,8,K0);r(5,35,12,6,'#4a4468');r(6,6,10,30,K0);r(7,8,8,28,'#5a5478');r(7,8,3,28,'#7a74a0');r(8,0,6,8,K0);r(9,1,4,6,'#9a94c0');r(10,14,2,8,'#b48aff');r(10,26,2,4,'#b48aff')})
const SCARE=art(30,44,15,42,r=>{r(13,10,4,32,K0);r(14,10,2,32,'#6a4a2a');r(3,18,24,4,K0);r(4,19,22,2,'#6a4a2a');r(9,0,12,12,K0);r(10,1,10,10,'#d8a850');r(12,4,2,2,K0);r(16,4,2,2,K0);r(12,8,6,1,K0);r(6,2,18,3,K0);r(8,0,14,3,'#4a3a1c');r(5,20,4,8,'#b88a3a');r(21,20,4,8,'#b88a3a')})
const RUINS=art(52,36,26,34,r=>{r(2,20,12,14,K0);r(3,21,10,12,'#5a5478');r(18,8,10,26,K0);r(19,9,8,24,'#6a6488');r(19,9,3,24,'#8a84a8');r(34,22,14,12,K0);r(35,23,12,10,'#4a4468');r(24,28,8,6,'#3a3458')})
const FOUNT=art(44,34,22,32,r=>{r(2,20,40,12,K0);r(4,22,36,8,'#6a6488');r(6,24,32,4,'#4aa8e8');r(18,6,8,16,K0);r(19,7,6,14,'#8a84a8');r(16,2,12,6,K0);r(17,3,10,3,'#8fe3ff');r(20,0,4,4,'#cfeeff')})
const MAUSO=art(56,48,28,46,r=>{r(2,22,52,24,K0);r(4,24,48,20,'#4a4468');r(4,24,48,4,'#6a6488');r(10,8,36,16,K0);r(12,10,32,12,'#5a5478');r(22,2,12,8,K0);r(24,3,8,6,'#7a74a0');r(20,30,16,16,K0);r(22,32,12,14,'#0a0614');r(26,34,4,3,'#4aff7a')})
const BARN=art(40,30,20,28,r=>{r(2,8,36,20,K0);r(4,10,32,16,'#8a3a2a');r(4,10,32,3,'#c85a3a');r(16,16,8,12,K0);r(17,17,6,10,'#3a1410');r(6,2,28,8,K0);r(8,4,24,4,'#a84a34')})
const TAV=art(36,32,18,30,r=>{r(8,8,20,22,K0);r(10,10,16,18,'#c8924a');r(10,10,16,4,'#e8b25a');r(26,12,8,12,K0);r(27,14,6,8,K0);r(12,16,12,3,'#fff6d0');r(4,26,28,4,K0)})
const MANS=art(52,40,26,38,r=>{r(2,10,48,28,K0);r(4,12,44,24,'#3a2a5a');r(4,12,44,4,'#5a4a8a');r(20,22,12,16,K0);r(22,24,8,14,'#ffd93b');r(8,18,6,6,'#ffe27a');r(38,18,6,6,'#ffe27a');r(22,2,8,10,K0);r(24,3,4,8,'#8a74b0')})
const BUNK=art(34,26,17,24,r=>{r(2,6,30,18,K0);r(4,8,26,14,'#4a5060');r(4,8,26,3,'#6a7488');r(11,12,12,10,K0);r(12,13,10,8,'#2a2e38');r(16,16,2,4,'#ffd93b')})
const MILL=art(36,44,18,42,r=>{r(10,14,16,28,K0);r(12,16,12,24,'#c8b898');r(14,34,8,8,K0);r(2,2,32,4,K0);r(16,0,4,18,K0);r(3,3,30,2,'#e8e2cc');r(17,1,2,16,'#e8e2cc');r(4,10,28,2,'#6a5a3a')})
const NB={barn:BARN,tavern:TAV,mansion:MANS,bunker:BUNK,mill:MILL}
const NO={obelisk:[OBEL,1.5],scarecrow:[SCARE,1.5],ruins:[RUINS,1.4],fountain:[FOUNT,1.5],mausoleum:[MAUSO,1.6]}
const roofs=new Map()
const roofOf=b=>{
let c=roofs.get(b.id)
if(c)return c
c=el('canvas');c.width=b.w;c.height=b.h
const y=c.getContext('2d')
y.fillStyle='#2c1e44';y.fillRect(0,0,b.w,b.h)
for(let j=0;j<b.h;j+=24){y.fillStyle=j%48?'#3a2858':'#32234d';y.fillRect(0,j,b.w,23)}
for(let i=0;i<b.w;i+=36){y.fillStyle='rgba(0,0,0,.22)';y.fillRect(i,0,2,b.h)}
y.fillStyle=KIND[b.kind][1];y.globalAlpha=.5;y.fillRect(0,b.h/2-3,b.w,6);y.globalAlpha=1
y.strokeStyle='#140b1c';y.lineWidth=6;y.strokeRect(3,3,b.w-6,b.h-6)
roofs.set(b.id,c)
return c
}
export function playTeamup({box,me,list,host,hostUid,send,onEnd,rules}){
const RU=Object.assign({mode:'rush',diff:1,len:6,phys:1},rules||{})
const GF=Object.assign({shake:1,light:2,parts:1},RU.gfx||{})
const TERR=RU.mode==='terror'
const DUR=RU.len>0?RU.len*60:0
const names=new Map(list.map(m=>[m.u,m.n]))
const idx=new Map(list.map((m,i)=>[m.u,i]))
const sim=host?createSim(list,RU):null
const cv=el('canvas','rs-cv'),cards=el('div','tu-cards'),endBox=el('div','tu-end')
const ctx=cv.getContext('2d')
const dk=el('canvas'),dctx=dk.getContext('2d')
box.classList.add('rs','tu-play')
box.append(cv,cards,endBox)
const lite=document.documentElement.classList.contains('perf')
const calm=!GF.shake||matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')
const A=buildArt(4)
Object.assign(A,terrorArt(3))
const CHEST=chestArt()
A.xbow=A.bone
A.dzom=A.ghoul.map(s=>{const c=el('canvas');c.width=s.c.width;c.height=s.c.height;const g=c.getContext('2d');g.filter='hue-rotate(205deg) saturate(1.6)';g.drawImage(s.c,0,0);return{c,w:s.w,h:s.h,ax:s.ax,ay:s.ay}})
const fade=new Map()
const PS=[0,1,2].map(i=>A.player.map(s=>{if(!i)return s;const c=el('canvas');c.width=s.c.width;c.height=s.c.height;const g=c.getContext('2d');g.filter='hue-rotate('+[0,175,70][i]+'deg)';g.drawImage(s.c,0,0);return{c,w:s.w,h:s.h,ax:s.ax,ay:s.ay}}))
let Q=GF.light,ft=.016,qt=0
const GP=ctx.createPattern(A.ground.c,'repeat')
GP.setTransform(new DOMMatrix([A.ground.T/A.ground.c.width,0,0,A.ground.T/A.ground.c.height,0,0]))
const LP=(()=>{const c=el('canvas');c.width=c.height=80;const g=c.getContext('2d');g.fillStyle='#1d1530';g.fillRect(0,0,80,80);g.strokeStyle='#120b20';g.lineWidth=2;g.strokeRect(1,1,78,78);g.fillStyle='rgba(255,255,255,.035)';g.fillRect(4,4,36,36);g.fillRect(44,44,32,32);return ctx.createPattern(c,'repeat')})()
const scr=el('canvas'),sg=scr.getContext('2d')
let vgc=null
const flashes=new Map()
const flashOf=s=>{let c=flashes.get(s);if(c)return c;c=el('canvas');c.width=s.c.width;c.height=s.c.height;const g=c.getContext('2d');g.drawImage(s.c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);flashes.set(s,c);return c}
let VW=800,VH=500,Wd=800,Hd=500,Z=2,D=1
const fit=()=>{D=Math.max(.5,Math.min(1.5,(devicePixelRatio||1)*[.6,.8,1,1.1,1.25][(window.__perf||{gpu:2}).gpu]));Wd=box.clientWidth||800;Hd=box.clientHeight||500;cv.width=Math.round(Wd*D);cv.height=Math.round(Hd*D);Z=Math.max(1.5,Math.min(2.6,Math.min(Wd,Hd)/270));VW=Wd/Z;VH=Hd/Z;const k=lite||Q<1?.3:Q<2?.4:.5;dk.width=Math.round(Wd*k);dk.height=Math.round(Hd*k);vgc=el('canvas');vgc.width=Math.round(Wd);vgc.height=Math.round(Hd);const g=vgc.getContext('2d');const q=g.createRadialGradient(Wd/2,Hd/2,Math.min(Wd,Hd)*.35,Wd/2,Hd/2,Math.max(Wd,Hd)*.75);q.addColorStop(0,'rgba(0,0,0,0)');q.addColorStop(1,TERR?'rgba(20,0,0,.88)':'rgba(0,0,0,.55)');g.fillStyle=q;g.fillRect(0,0,Wd,Hd)}
fit()
const ro=new ResizeObserver(fit);ro.observe(box)
const V={pt:[],ts:0,pl:new Map(),en:new Map(),pj:new Map(),eb:new Map(),gm:[],hp:[],pd:[],pk:[],bars:{},dead:new Set(),opened:new Set(),bz:new Map(),pr:new Map(),dc:[],bm:0,tm:0,st:'run',kl:0,bo:0,sn:performance.now()}
const F=[],X=[],RG=[]
const L={inv:0,keys:new Set(),mx:0,my:0,fire:false,aid:null,jid:null,jx:0,jy:0,jdx:0,jdy:0,slot:1,dash:0,dcd:0,dx:1,dy:0,sent:0,hold:0,tcd:0,walk:0,face:1,ang:0,offer:null,cx:0,cy:0,kx:0,ky:0}
let glitchT=0,pxT=0,proxOn=true,fpsT=60,beatT=1,bolt=8,whT=4,scare=0,clock=0,shake=0,note='',noteT=0,done=false,raf=0,last=performance.now(),acc=0,snapAcc=0,muted=false,ac=null,mg=null,mt=0,pg=false,over=null,beep=0,hurtT=0,mus=0
const lights=[],items=[],abBtn=[]
const audio=()=>{try{if(!ac){ac=new AudioContext();mg=ac.createGain();mg.gain.value=muted?0:1;mg.connect(ac.destination)}if(ac.state==='suspended')ac.resume()}catch{}}
const tone=(f,d,v,ty,sl)=>{try{if(!ac||muted)return;const o=ac.createOscillator(),g=ac.createGain();o.type=ty||'square';o.frequency.value=f;if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*sl),ac.currentTime+d);g.gain.value=v||.03;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(g);g.connect(mg);o.start();o.stop(ac.currentTime+d)}catch{}}
const NOTES=[110,130.8,146.8,164.8,196,220,261.6,293.7]
const music=()=>{try{if(!ac||muted)return;const f=NOTES[Math.floor(R()*NOTES.length)]*(R()<.3?2:1),o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.05;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+1.8);o.connect(g);g.connect(mg);o.start();o.stop(ac.currentTime+1.9);if(mt++%8===0){const b=ac.createOscillator(),bg=ac.createGain();b.type='triangle';b.frequency.value=55;bg.gain.value=.07;bg.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+4);b.connect(bg);bg.connect(mg);b.start();b.stop(ac.currentTime+4.1)}}catch{}}
mus=setInterval(music,520)
const burst=(x,y,c,n)=>{for(let i=0;i<n&&F.length<(lite?60:300);i++){const a=R()*TAU,v=(.3+R())*100;F.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.3+R()*.35,m:.65,c,s:1.4+R()*2.2})}}
const text=(x,y,v,c,big)=>{if(X.length<40)X.push({x:x+(R()-.5)*10,y,v,c,big,l:.8})}
const say=s=>{note=s;noteT=2.8}
const mine=()=>V.pl.get(me)
const apply=sn=>{
const t0=performance.now()
V.tm=sn.tm;V.st=sn.st;V.kl=sn.kl;V.bars=Object.fromEntries(sn.b);V.bz=new Map(sn.z);V.bo=sn.bo;V.bm=sn.bm;V.dc=sn.dc;V.sn=t0
const pids=new Set()
for(const[id,k,x,y]of sn.pr){pids.add(id);let o=V.pr.get(id);if(!o){o={id,k,x,y};V.pr.set(id,o)};o.tx=x;o.ty=y}
for(const k of[...V.pr.keys()])if(!pids.has(k))V.pr.delete(k)
const seen=new Set()
for(const a of sn.p){
const[u,x,y,hp,max,s,ang,lv,xp,next,orb,ammo,wood,rv,inv,hit,off,ar,arm,abl,ward,spd,fxs,lair,hpt]=a
seen.add(u)
let o=V.pl.get(u)
if(!o){o={u,x,y,tx:x,ty:y,face:1,walk:0,hit:0};V.pl.set(u,o)}
if(u===me&&Math.hypot(o.x-x,o.y-y)>140){o.x=x;o.y=y}
o.tx=x;o.ty=y;o.hp=hp;o.max=max;o.s=s;o.lv=lv;o.xp=xp;o.next=next;o.orb=orb;o.ammo=ammo;o.wood=wood;o.rv=rv;o.inv=inv;o.hurt=hit;o.ar=ar;o.arm=arm;o.ab=abl;o.ward=ward;o.spd=spd;o.fx=fxs;o.lair=lair;o.hpt=hpt
if(u!==me)o.ang=ang
}
const ids=new Set()
for(const[id,k,x,y,hp,mx,ch,ph,sx,fl,st,al,tg,pop,pp,at,lax,lay]of sn.e){
ids.add(id)
let o=V.en.get(id)
if(!o){o={id,k,x,y,r:ET[k].r,ph:ph/10,fl:0};V.en.set(id,o)}
o.tx=x;o.ty=y;o.hp=hp;o.mx=mx;o.ch=ch;o.sx=sx;o.st=st;o.al=al;o.tg=tg;o.pop=pop;o.pp=pp;o.at=at;o.lax=lax;o.lay=lay;o.tt=t0;if(fl)o.fl=.09
}
for(const k of[...V.en.keys()])if(!ids.has(k))V.en.delete(k)
const pj=new Set()
for(const[id,k,x,y,vx,vy,a]of sn.j){pj.add(id);let o=V.pj.get(id);if(!o){o={id,k};V.pj.set(id,o)};o.x=x;o.y=y;o.vx=vx;o.vy=vy;o.a=a;o.t=t0}
for(const k of[...V.pj.keys()])if(!pj.has(k))V.pj.delete(k)
const eb=new Set()
for(const[id,x,y,vx,vy,kd]of sn.q){eb.add(id);let o=V.eb.get(id);if(!o){o={id,a:0};V.eb.set(id,o)};o.x=x;o.y=y;o.vx=vx;o.vy=vy;o.kd=kd;o.t=t0}
for(const k of[...V.eb.keys()])if(!eb.has(k))V.eb.delete(k)
V.gm=sn.g;V.hp=sn.l;V.pd=sn.d;V.pk=sn.c;V.pt=sn.pt;V.ts=sn.ts
for(const e of sn.v){
if(e[0]==='b')burst(e[1],e[2],e[3],Math.min(e[4],14))
else if(e[0]==='t')text(e[1],e[2],e[3],e[4],e[5])
else if(e[0]==='x'){RG.push({x:e[1],y:e[2],r:e[3],w:e[4],l:.5,m:.5});tone(e[4]===9?220:90,.3,.05,e[4]===9?'sine':'sawtooth',.5);if(e[4]<4)shake=Math.max(shake,6)}
else if(e[0]==='tp'){RG.push({x:e[1],y:e[2],r:60,w:5,l:.6,m:.6});tone(180,.4,.06,'sine',3);burst(e[1],e[2],'#b48aff',16)}
else if(e[0]==='o'){V.opened.add(e[1]);tone(520,.15,.05,'triangle');tone(780,.25,.04,'triangle')}
else if(e[0]==='cd'){V.dead.add(e[1]);tone(70,.6,.09,'sawtooth',.4)}
else if(e[0]==='sh')shake=Math.max(shake,e[1])
else if(e[0]==='n'){say(e[1]);tone(70,1,.09,'sawtooth',.6)}
else if(e[0]==='gl')glitchT=Math.max(glitchT,e[1])
else if(e[0]==='hurt'&&e[1]===me){hurtT=.5;shake=Math.max(shake,7);tone(120,.16,.07,'sawtooth',.6)}
else if(e[0]==='down')say((names.get(e[1])||'A teammate')+' is down')
}
}
const onM=m=>{
if(m.k==='lv')showCards(m.ids,m.lv)
else if(m.k==='lvdone'){L.offer=null;cards.classList.remove('on')}
else if(m.k==='tp'){const p=mine();if(p){p.x=m.x;p.y=m.y;p.tx=m.x;p.ty=m.y;L.kx=L.ky=0}}
else if(m.k==='ctl'){L.inv=m.t;say('Controls inverted')}
else if(m.k==='kb'){L.kx+=m.vx;L.ky+=m.vy;shake=Math.max(shake,5)}
}
const take=id=>{
if(!L.offer)return
L.offer=null;cards.classList.remove('on')
if(host)sim.pick(me,id);else send({k:'p',id})
tone(660,.1,.04,'triangle')
}
const showCards=(ids,lv)=>{
L.offer=ids
cards.replaceChildren(el('h3','rs-lv','Level '+lv))
const row=el('div','rs-row')
ids.forEach((id,i)=>{const u=UPS.find(x=>x[0]===id),b=el('button','rs-card');b.type='button';b.append(el('i','rs-k',String(i+1)),el('b',null,u[1]),el('span',null,u[2]));b.addEventListener('click',()=>take(id));row.append(b)})
cards.append(row)
cards.classList.add('on')
tone(660,.12,.05,'triangle');tone(880,.2,.04,'triangle')
}
const setHold=v=>{if(L.hold===v)return;L.hold=v;if(host)sim.holdSet(me,v);else send({k:'h',v})}
const throwAt=(ax,ay)=>{
const p=mine()
if(!p||p.s!=='up'||L.tcd>0||!(p.ammo[L.slot-1]>0))return
L.tcd=[0,.85,1.1,.6][L.slot]
if(host)sim.throw(me,L.slot,ax,ay);else send({k:'t',w:L.slot,x:Math.round(ax),y:Math.round(ay)})
tone(380,.08,.03,'triangle',.6)
}
const dash=()=>{const p=mine();if(!p||p.s!=='up'||L.dcd>0)return;const lv=p.ab?p.ab[0][0]||1:1;L.dcd=3.2*Math.pow(.85,lv-1);L.dash=.14+.03*lv;tone(260,.15,.05,'sawtooth',1.8)}
const cast=n=>{
const p=mine(),i=ABN.indexOf(n)
if(n==='dash')return dash()
if(!p||p.s!=='up'||!p.ab||!p.ab[i][0]||p.ab[i][1]>0)return
p.ab[i][1]=Math.ceil(ABI[n][3]*Math.pow(.85,p.ab[i][0]-1))
if(host)sim.cast(me,n);else send({k:'a',n})
tone(n==='ward'?520:n==='rift'?90:n==='drain'?150:330,.25,.06,'sawtooth',n==='rift'?.4:1.5)
}
const kd=e=>{
const k=e.key.toLowerCase()
audio()
if(L.offer&&k>='1'&&k<='3'){const id=L.offer[Number(k)-1];if(id){take(id);e.preventDefault()}return}
if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){L.keys.add(k);e.preventDefault()}
else if(k>='1'&&k<='3')L.slot=Number(k)
else if(k==='q')cast('ward')
else if(k==='e')setHold(1)
else if(k===' '){e.preventDefault();dash()}
else if(k==='g')cast('flare')
else if(k==='r')cast('rift')
else if(k==='f')cast('drain')
else if(k==='h')cast('purple')
else if(k==='v'){proxOn=!proxOn;say(proxOn?'Proximity voice on':'Proximity voice off');if(!proxOn)restoreVol()}
else if(k==='b'&&VC.ch)toggleMute()
else if(k==='m'){muted=!muted;if(mg)mg.gain.value=muted?0:1}
}
const ku=e=>{const k=e.key.toLowerCase();L.keys.delete(k);if(k==='e')setHold(0)}
const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('contextmenu',e=>e.preventDefault())
cv.addEventListener('pointerdown',e=>{
audio()
const[x,y]=pos(e)
for(const b of abBtn)if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){if(b.slot)L.slot=b.slot;else if(b.act==='use'){setHold(1);setTimeout(()=>setHold(0),180)}else if(b.act)cast(b.act);return}
cv.setPointerCapture(e.pointerId)
if(e.pointerType==='touch'&&x<Wd*.42&&L.jid===null){L.jid=e.pointerId;L.jx=x;L.jy=y;L.jdx=0;L.jdy=0;return}
L.aid=e.pointerId;L.mx=x;L.my=y
const p=mine()
if(p){const ax=x/Z+L.cx,ay=y/Z+L.cy;throwAt(ax,ay)}
})
cv.addEventListener('pointermove',e=>{
const[x,y]=pos(e)
if(e.pointerId===L.jid){L.jdx=x-L.jx;L.jdy=y-L.jy;const d=Math.hypot(L.jdx,L.jdy);if(d>50){L.jdx*=50/d;L.jdy*=50/d}return}
L.mx=x;L.my=y
})
const up=e=>{if(e.pointerId===L.jid){L.jid=null;L.jdx=0;L.jdy=0}if(e.pointerId===L.aid)L.aid=null}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up)
addEventListener('keydown',kd);addEventListener('keyup',ku)
L.cx=0;L.cy=0
const move=dt=>{
const p=mine()
if(!p||p.s!=='up')return
let kx=(L.keys.has('d')||L.keys.has('arrowright')?1:0)-(L.keys.has('a')||L.keys.has('arrowleft')?1:0)
let ky=(L.keys.has('s')||L.keys.has('arrowdown')?1:0)-(L.keys.has('w')||L.keys.has('arrowup')?1:0)
if(L.jid!==null){kx=L.jdx/50;ky=L.jdy/50}
if(RU.test){const a=clock*.6;kx=Math.cos(a);ky=Math.sin(a*1.3)}
if(L.inv>0){L.inv-=dt;kx=-kx;ky=-ky}
const m=Math.hypot(kx,ky)
if(m>1){kx/=m;ky/=m}
const spd=p.spd||150
const px=p.x,py=p.y
if(m>.05){p.x+=kx*spd*dt;p.y+=ky*spd*dt;L.dx=kx/m;L.dy=ky/m;if(Math.abs(kx)>.1)p.face=kx>0?1:-1}
if(L.kx||L.ky){p.x+=L.kx*dt;p.y+=L.ky*dt;const f=Math.pow(.03,dt);L.kx*=f;L.ky*=f;if(Math.abs(L.kx)+Math.abs(L.ky)<4)L.kx=L.ky=0}
L.dcd=Math.max(0,L.dcd-dt);L.tcd=Math.max(0,L.tcd-dt)
if(L.dash>0){L.dash-=dt;p.x+=L.dx*640*dt;p.y+=L.dy*640*dt;if(F.length<200)F.push({x:p.x,y:p.y,vx:0,vy:0,l:.25,m:.25,c:'#8fe3ff',s:5})}
p.r=13
push(p,near(p.x,p.y),V)
p.tx=p.x;p.ty=p.y
p.walk+=Math.hypot(p.x-px,p.y-py)/150
L.ang=Math.atan2((L.my)/Z+L.cy-p.y,(L.mx)/Z+L.cx-p.x);p.ang=L.ang
if(spd>0&&p.hurt)hurtT=Math.max(hurtT,.2)
}
const netIn=()=>{
const p=mine()
if(!p)return
if(host)sim.input(me,p.x,p.y,L.ang,L.dash>0)
else send({k:'i',x:Math.round(p.x),y:Math.round(p.y),a:Math.round(L.ang*100)/100,d:L.dash>0?1:0})
}
const draw1=(s,x,y,flip,fl)=>{
const img=fl?flashOf(s):s.c
if(flip<0){ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(img,-s.ax,-s.ay,s.w,s.h);ctx.restore()}
else ctx.drawImage(img,x-s.ax,y-s.ay,s.w,s.h)
}
const shadow=(x,y,rx)=>{ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(x,y,rx,rx*.34,0,0,TAU);ctx.fill()}
const plate=(x,y,w,hh,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,hh,r);ctx.fillStyle='rgba(14,8,22,.82)';ctx.fill();ctx.strokeStyle='#5a3a7a';ctx.lineWidth=2;ctx.stroke()}
const bar=(x,y,w,hh,v,c0,c1)=>{
ctx.beginPath();ctx.roundRect(x,y,w,hh,hh/2);ctx.fillStyle='#0a0612';ctx.fill()
if(v>0){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,hh,hh/2);ctx.clip();const g=ctx.createLinearGradient(0,y,0,y+hh);g.addColorStop(0,c0);g.addColorStop(1,c1);ctx.fillStyle=g;ctx.fillRect(x,y,w*Math.min(1,v),hh);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x,y,w*Math.min(1,v),hh*.4);ctx.restore()}
ctx.beginPath();ctx.roundRect(x,y,w,hh,hh/2);ctx.strokeStyle='#2a1a3a';ctx.lineWidth=1.5;ctx.stroke()
}
const ctext=(s,x,y,font,c,sc)=>{ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=sc||4;ctx.strokeStyle='rgba(8,4,14,.9)';ctx.strokeText(s,x,y);ctx.fillStyle=c;ctx.fillText(s,x,y)}
const base={}
const restoreVol=()=>{for(const u in base){try{setPeerVolume(u,base[u])}catch{}}}
const prox=()=>{
if(!VC.ch||!proxOn)return
const p=mine()
if(!p)return
for(const o of V.pl.values()){
if(o.u===me)continue
const pr=VC.peers.get(o.u)
if(!pr)continue
if(!(o.u in base))base[o.u]=pr.vol==null?1:pr.vol
const d=Math.hypot(o.x-p.x,o.y-p.y),f=d<220?1:Math.max(0,1-(d-220)/880)
setPeerVolume(o.u,base[o.u]*f*f)
}
}
const nearP=(x,y)=>{let b=null,bd=1e9;for(const o of V.pl.values()){if(o.s!=='up')continue;const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;b=o}}return b}
const auras=o=>{
const f=o.fx
if(o.hpt>0){
const t=1-o.hpt/1.3,sep=(1-t)*64,a=o.ang||0,fx=o.x+Math.cos(a)*44,fy=o.y-14+Math.sin(a)*44,px=-Math.sin(a),py=Math.cos(a)
for(const q of[[1,'255,60,60'],[-1,'60,120,255']]){
const x=fx+px*sep*q[0],y=fy+py*sep*q[0]
const g=ctx.createRadialGradient(x,y,0,x,y,22);g.addColorStop(0,'rgba('+q[1]+',1)');g.addColorStop(1,'rgba('+q[1]+',0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,22,0,TAU);ctx.fill()
lights.push([x,y,90,1,q[0]>0?'red':'cyan'])
}
if(t>.8){ctx.fillStyle='rgba(190,90,255,'+(t-.8)*4+')';ctx.beginPath();ctx.arc(fx,fy,14+Math.sin(clock*40)*3,0,TAU);ctx.fill()}
}
if(!f)return
if(f[1]>0){ctx.strokeStyle='rgba(90,160,255,'+(.55+Math.sin(clock*12)*.25)+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(o.x,o.y,24+Math.sin(clock*9)*3,9,0,0,TAU);ctx.stroke();lights.push([o.x,o.y-12,90,.9,'cyan'])}
if(f[0]>0&&F.length<200&&R()<.5)F.push({x:o.x-(o.face||1)*8,y:o.y-8,vx:0,vy:0,l:.3,m:.3,c:'#4aff9a',s:4})
if(f[3]>0){ctx.strokeStyle='rgba(255,50,90,'+(.45+Math.sin(clock*7)*.2)+')';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(o.x,o.y,20,7,0,0,TAU);ctx.stroke()}
}
const person=(o,self)=>{
if(o.s==='dead')return
const i=idx.get(o.u)||0
ctx.save()
ctx.strokeStyle=COL[i%3];ctx.globalAlpha=.8;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(o.x,o.y,15,5.5,0,0,TAU);ctx.stroke();ctx.globalAlpha=1
if(o.s==='down'){
ctx.translate(o.x,o.y-6);ctx.rotate(Math.PI/2);ctx.globalAlpha=.75
const s=PS[i%3][0];ctx.drawImage(s.c,-s.ax,-s.ay+10,s.w,s.h)
ctx.restore()
ctx.save()
ctx.strokeStyle='rgba(8,4,14,.9)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(o.x,o.y-14,15,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,o.rv/2.5));ctx.stroke()
ctx.strokeStyle='#7dff9a';ctx.lineWidth=3;ctx.stroke()
ctx.restore()
return
}
ctx.restore()
if(o.inv&&Math.floor(clock*20)%2)ctx.globalAlpha=.5
const s=PS[i%3][Math.floor(o.walk*9)%2]
auras(o)
const gi=o.fx&&o.fx[2]>0?1.55:1
if(gi>1){ctx.save();ctx.translate(o.x,o.y);ctx.scale(gi,gi);ctx.translate(-o.x,-o.y)}
if(o.ward>0){ctx.strokeStyle='rgba(255,226,122,'+(.5+Math.sin(clock*8)*.2)+')';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(o.x,o.y-14,22,0,TAU);ctx.stroke()}
shadow(o.x,o.y,13)
draw1(s,o.x,o.y,o.face,o.hurt&&Math.floor(clock*30)%2===0)
if(gi>1)ctx.restore()
ctx.globalAlpha=1
if(VC.speaking&&VC.speaking.has(o.u)){ctx.strokeStyle='rgba(125,255,154,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y-s.h-6,5+Math.sin(clock*14)*1.5,0,TAU);ctx.stroke()}
if(!self)ctext(names.get(o.u)||'',o.x,o.y-s.h+8,'700 9px system-ui,sans-serif',COL[i%3],3)
}
const ARM={mimic:'#8a5a3a',gmimic:'#e0b030',smimic:'#2a1a3a',bmimic:'#7a4a22'}
const mimic=e=>{
const k=e.k,pl=Math.max(0,(e.pop||0)-(performance.now()-(e.tt||0))/1000),pp=1-Math.min(1,pl/.9),es=1-Math.pow(1-pp,3)
const me2=mine(),dm=me2?Math.hypot(me2.x-e.x,me2.y-e.y):999
const hop=pl>0?0:Math.abs(Math.sin(clock*9+e.ph))*6
ctx.save()
ctx.translate(e.x,e.y)
shadow(0,0,17)
ctx.globalAlpha=k==='smimic'?Math.max(.14,Math.min(1,1.25-dm/230)):1
if(k==='gmimic')ctx.filter='sepia(1) saturate(4) brightness(1.25)'
const b=k==='bmimic'?PROP.b:CHEST[1],sc=1.5
ctx.drawImage(b.c,-b.ax*sc,-b.ay*sc-hop,b.w*sc,b.h*sc)
ctx.filter='none'
const ty=-b.ay*sc*.55-hop
ctx.fillStyle='#fff'
for(let i=0;i<5;i++){const x=-17+i*8.5;ctx.beginPath();ctx.moveTo(x,ty-5);ctx.lineTo(x+4,ty+1);ctx.lineTo(x+8,ty-5);ctx.fill();ctx.beginPath();ctx.moveTo(x,ty+9);ctx.lineTo(x+4,ty+3);ctx.lineTo(x+8,ty+9);ctx.fill()}
ctx.fillStyle=k==='gmimic'?'#ffe27a':'#ff3a2a'
ctx.fillRect(-10,ty-12,5,4);ctx.fillRect(5,ty-12,5,4)
ctx.fillStyle='#ff5a8a';ctx.fillRect(-3,ty+3+Math.sin(clock*12+e.ph)*3,6,4)
const col=ARM[k]||'#8a5a3a'
for(const sd of[-1,1]){
const L2=es*17,w0=sd*(26+(1-es)*-18),y0=-18-hop+(1-es)*14
const a1=sd*(-.55-es*.55+Math.sin(clock*7+e.ph+sd)*.45*es)
const x1=w0+Math.cos(a1)*L2*sd,y1=y0+Math.sin(a1)*L2
const a2=a1+sd*(.9+Math.sin(clock*9+e.ph)*.6)
const x2=x1+Math.cos(a2)*L2*sd,y2=y1+Math.sin(a2)*L2
for(const[lw,c]of[[7,'#07040c'],[4,col]]){ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(w0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
ctx.fillStyle='#07040c';ctx.beginPath();ctx.arc(x2,y2,5.5,0,TAU);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x2,y2,3.6,0,TAU);ctx.fill()
ctx.strokeStyle=col;ctx.lineWidth=2
for(let f=-1;f<=1;f++){ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2+Math.cos(a2+f*.6)*sd*7,y2+Math.sin(a2+f*.6)*7);ctx.stroke()}
}
if(pl>.55){ctx.strokeStyle='rgba(255,255,255,'+(pl-.55)*2+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-14,(1-pl/.9)*60+8,0,TAU);ctx.stroke()}
ctx.globalAlpha=1
ctx.restore()
if(e.hp<e.mx){const bw=30;ctx.fillStyle='rgba(8,4,14,.85)';ctx.fillRect(e.x-bw/2,e.y-52,bw,4);ctx.fillStyle='#ff5a4a';ctx.fillRect(e.x-bw/2+.5,e.y-51.5,(bw-1)*Math.max(0,e.hp/e.mx),3)}
if(k==='gmimic')lights.push([e.x,e.y-20,90,.8,'warm'])
else if(k!=='smimic')lights.push([e.x,e.y-14,44,.4,'red'])
}
const dzom=e=>{
const s=A.dzom[Math.floor(clock*6+e.ph)%2],sc=1.3,n=14,hh=s.h*sc/n,sh=s.c.height/n
shadow(e.x,e.y,e.r*1.1)
ctx.save()
ctx.translate(e.x,e.y)
ctx.scale(e.sx<0?-1:1,1)
for(let i=0;i<n;i++){
const k=1+Math.sin(clock*7+i*1.7+e.ph)*.3*(i%3===0?1.7:1)
const jx=R()<.04?(R()-.5)*30:0
ctx.drawImage(s.c,0,i*sh,s.c.width,sh,-s.ax*sc*k+jx,-s.ay*sc+i*hh,s.w*sc*k,hh+.6)
}
for(let i=0;i<4;i++){ctx.fillStyle=['#ff3aff','#3affff','#ffffff','#9a5aff'][i];ctx.fillRect((R()-.5)*60,-R()*s.h*sc,2+R()*5,2+R()*3)}
ctx.restore()
ctx.font='700 8px monospace';ctx.textAlign='center';ctx.fillStyle='#c9a8ff';ctx.fillText(R()<.1?'0xDEAD':'DEBUG',e.x+(R()<.1?3:0),e.y-s.h*sc-4)
if(e.hp<e.mx){const bw=e.r*2+4;ctx.fillStyle='rgba(8,4,14,.85)';ctx.fillRect(e.x-bw/2,e.y-s.h*sc-14,bw,4);ctx.fillStyle='#c9a8ff';ctx.fillRect(e.x-bw/2+.5,e.y-s.h*sc-13.5,(bw-1)*Math.max(0,e.hp/e.mx),3)}
lights.push([e.x,e.y-26,100,.7,'vio'])
}
const bossFx=e=>{
const tg=Math.max(0,(e.tg||0)-(performance.now()-(e.tt||0))/1000),ph=e.pp||1,a=e.at
const sc=1+(ph-1)*.08+Math.sin(clock*3)*.02
ctx.strokeStyle=ph===1?'rgba(255,170,60,.55)':ph===2?'rgba(255,90,60,.65)':'rgba(190,60,255,.8)'
ctx.lineWidth=3;ctx.setLineDash([14,10]);ctx.lineDashOffset=-clock*40
ctx.beginPath();ctx.ellipse(e.x,e.y,e.r*1.7*sc,e.r*.7*sc,0,0,TAU);ctx.stroke();ctx.setLineDash([])
if(a&&tg>0){
const k=1-Math.min(1,tg)
const rr=a===1?190:a===4?150:a===5?460:a===3?160:120
const tx=a===4?e.lax:e.x,ty=a===4?e.lay:e.y
ctx.fillStyle='rgba(255,60,40,'+(.08+k*.14)+')';ctx.beginPath();ctx.arc(tx,ty,rr,0,TAU);ctx.fill()
ctx.strokeStyle='rgba(255,'+(a===5?200:90)+',60,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(tx,ty,a===5?rr*(1-k):rr*k,0,TAU);ctx.stroke()
ctx.beginPath();ctx.arc(tx,ty,rr,0,TAU);ctx.lineWidth=1.5;ctx.stroke()
if(a===2){for(let i=0;i<12;i++){const q=i/12*TAU+clock;ctx.beginPath();ctx.moveTo(e.x+Math.cos(q)*60,e.y+Math.sin(q)*60);ctx.lineTo(e.x+Math.cos(q)*130,e.y+Math.sin(q)*130);ctx.stroke()}}
}
}
const crown=e=>{
if((e.pp||1)<2)return
const s=A.boss[0],y=e.y-s.ay+10,x=e.x
ctx.fillStyle='#07040c';ctx.beginPath();ctx.moveTo(x-30,y+8);ctx.lineTo(x-30,y-16);ctx.lineTo(x-16,y-4);ctx.lineTo(x,y-22);ctx.lineTo(x+16,y-4);ctx.lineTo(x+30,y-16);ctx.lineTo(x+30,y+8);ctx.closePath();ctx.fill()
ctx.fillStyle=e.pp===3?'#c06aff':'#ffd93b';ctx.beginPath();ctx.moveTo(x-27,y+5);ctx.lineTo(x-27,y-11);ctx.lineTo(x-15,y-1);ctx.lineTo(x,y-17);ctx.lineTo(x+15,y-1);ctx.lineTo(x+27,y-11);ctx.lineTo(x+27,y+5);ctx.closePath();ctx.fill()
ctx.fillStyle='#ff3a5a';ctx.fillRect(x-3,y-6,6,6)
}
const xbow=e=>{
const t=nearP(e.x,e.y),a=t?Math.atan2(t.y-e.y,t.x-e.x):0,tg=Math.max(0,(e.tg||0)-(performance.now()-(e.tt||0))/1000)
if(tg>0&&t){ctx.strokeStyle='rgba(255,50,40,'+(.35+Math.sin(clock*40)*.25)+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,e.y-22);ctx.lineTo(e.x+Math.cos(a)*520,e.y-22+Math.sin(a)*520);ctx.stroke()}
ctx.save();ctx.translate(e.x,e.y-22);ctx.rotate(a)
ctx.strokeStyle='#07040c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(18,0);ctx.moveTo(10,-11);ctx.quadraticCurveTo(15,0,10,11);ctx.stroke()
ctx.strokeStyle='#8a5a2a';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(18,0);ctx.moveTo(10,-11);ctx.quadraticCurveTo(15,0,10,11);ctx.stroke()
ctx.strokeStyle='#e8e2cc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(10,-11);ctx.lineTo(tg>0?4:10,0);ctx.lineTo(10,11);ctx.stroke()
ctx.fillStyle='#ffd27a';ctx.fillRect(4,-1,16,2)
ctx.restore()
}
const enemy=e=>{
if(e.k==='mimic'||e.k==='gmimic'||e.k==='smimic'||e.k==='bmimic')return mimic(e)
if(e.k==='dzom')return dzom(e)
const sp=A[e.k]
const s=sp[Math.floor(clock*6+e.ph)%2]
const bob=e.k==='wisp'||e.k==='bat'?Math.sin(clock*5+e.ph)*3-8:e.k==='reaper'||e.k==='wraith'?Math.sin(clock*3+e.ph)*3-6:0
shadow(e.x,e.y,e.r*1.05)
if(e.k==='boss')bossFx(e)
draw1(s,e.x,e.y+bob,e.sx,e.fl>0)
if(e.k==='boss')crown(e)
if(e.k==='xbow')xbow(e)
if(e.al){ctx.strokeStyle='#7dff9a';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(e.x,e.y,e.r+6,(e.r+6)*.36,0,0,TAU);ctx.stroke();ctx.fillStyle='#7dff9a';ctx.fillRect(e.x-2,e.y-e.r*2-16,4,4);lights.push([e.x,e.y-16,60,.6,'cyan'])}
if(e.ch&&(e.k==='ghoul'||e.k==='lurker')){ctx.fillStyle='rgba(255,60,50,.35)';ctx.beginPath();ctx.arc(e.x,e.y-26,16,0,TAU);ctx.fill()}
if(e.st){ctx.strokeStyle='rgba(143,227,255,.9)';ctx.lineWidth=2;for(let i=0;i<3;i++){const a=clock*5+i*2.1;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*9,e.y-e.r*2-8+Math.sin(a)*3,2,0,TAU);ctx.stroke()}}
if(e.hp<e.mx&&e.k!=='boss'){const bw=e.r*2+4;ctx.fillStyle='rgba(8,4,14,.85)';ctx.fillRect(e.x-bw/2,e.y-e.r*2-30,bw,4);ctx.fillStyle='#ff5a4a';ctx.fillRect(e.x-bw/2+.5,e.y-e.r*2-29.5,(bw-1)*Math.max(0,e.hp/e.mx),3)}
if(e.k==='wisp')lights.push([e.x,e.y-12,42,.55,'cyan'])
else if(e.k==='reaper')lights.push([e.x,e.y-30,60,.5,'vio'])
else if(e.k==='wraith')lights.push([e.x,e.y-20,50,.5,'cyan'])
else if(e.k==='boss')lights.push([e.x,e.y-40,170,.9,'warm'])
}
const EYES=[]
const OSP={tower:['tower',1.3],crypt:['crypt',1.4],well:['well',1.5],shrine:['shrine',1.5]}
const world=(dt)=>{
const p=mine()
const sx=calm?0:(R()-.5)*shake,sy=calm?0:(R()-.5)*shake
const cx=(p?p.x:500)-VW/2+sx,cy=(p?p.y-8:560)-VH/2+sy
L.cx=cx-sx;L.cy=cy-sy
ctx.setTransform(D*Z,0,0,D*Z,-cx*D*Z,-cy*D*Z)
const inl=!!(p&&p.x>=LI*CS)
ctx.fillStyle=inl?'#0a0612':GP;ctx.fillRect(cx-1,cy-1,VW+2,VH+2)
if(TERR){ctx.fillStyle='rgba(70,0,10,.28)';ctx.fillRect(cx,cy,VW,VH)}
items.length=0;lights.length=0
const inb=p?buildingAt(p):null
for(const pp of V.pl.values())if(pp.s!=='dead')lights.push([pp.x,pp.y-10,pp.u===me?(TERR?150+Math.sin(clock*13)*7:250):(TERR?110:170),1,'w'])
EYES.length=0
const i0=Math.floor((cx-120)/CS),i1=Math.floor((cx+VW+120)/CS),j0=Math.floor((cy-160)/CS),j1=Math.floor((cy+VH+160)/CS)
const vc=[]
for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)vc.push(chunk(i,j))
for(const c of vc)if(c.lr){
const r=c.lr,ox=c.i*CS
ctx.fillStyle=LP;ctx.fillRect(r.x,r.y,r.w,r.h)
for(const q of c.walls){ctx.fillStyle='#07040c';ctx.fillRect(q.x-3,q.y-3,q.w+6,q.h+6);ctx.fillStyle='#3a2a52';ctx.fillRect(q.x,q.y,q.w,q.h);ctx.fillStyle='#5a4478';ctx.fillRect(q.x,q.y,q.w,Math.min(5,q.h))}
for(const px of[280,500,720]){ctx.fillStyle='#07040c';ctx.beginPath();ctx.ellipse(ox+px,544,26,10,0,0,TAU);ctx.fill();ctx.fillStyle='#4a3a68';ctx.beginPath();ctx.ellipse(ox+px,542,22,8,0,0,TAU);ctx.fill()}
ctx.fillStyle='#07040c';ctx.beginPath();ctx.ellipse(ox+500,292,44,17,0,0,TAU);ctx.fill()
ctx.fillStyle='rgba(125,255,154,'+(.25+Math.sin(clock*3)*.1)+')';ctx.beginPath();ctx.ellipse(ox+500,292,38,14,0,0,TAU);ctx.fill()
ctext('EXIT',ox+500,292,'800 11px system-ui,sans-serif','#7dff9a',3)
lights.push([ox+500,284,120,.9,'cyan'])
for(const[tx,ty]of[[r.x+36,r.y+36],[r.x+r.w-36,r.y+36],[r.x+36,r.y+r.h-36],[r.x+r.w-36,r.y+r.h-36]]){ctx.fillStyle='#07040c';ctx.fillRect(tx-4,ty-6,8,14);const fh=8+Math.sin(clock*13+tx)*3;ctx.fillStyle='#ff7a1a';ctx.fillRect(tx-3,ty-6-fh,6,fh);ctx.fillStyle='#ffd93b';ctx.fillRect(tx-1.5,ty-6-fh*.6,3,fh*.6);lights.push([tx,ty-10,170,1,'warm'])}
}
for(const c of vc){
const b=c.b
if(!b)continue
const k=KIND[b.kind]
ctx.fillStyle=k[0];ctx.fillRect(b.x,b.y,b.w,b.h)
for(let j=b.y;j<b.y+b.h;j+=20){ctx.fillStyle=hash(j,b.x)%2?'rgba(255,255,255,.04)':'rgba(0,0,0,.14)';ctx.fillRect(b.x,j,b.w,19)}
ctx.fillStyle='rgba(0,0,0,.2)'
for(let i=b.x+30;i<b.x+b.w;i+=64)ctx.fillRect(i,b.y,2,b.h)
for(const q of c.walls){
if(q.bar!==undefined){ctx.fillStyle='#5a4228';ctx.fillRect(q.x,q.y,q.w,q.h);ctx.fillStyle='rgba(0,0,0,.35)';q.w>q.h?ctx.fillRect(q.x,q.y+q.h/2-1,q.w,2):ctx.fillRect(q.x+q.w/2-1,q.y,2,q.h);continue}
ctx.fillStyle='#140b1c';ctx.fillRect(q.x-2,q.y-2,q.w+4,q.h+4)
ctx.fillStyle='#2f2442';ctx.fillRect(q.x,q.y,q.w,q.h)
ctx.fillStyle='#4a3a66';ctx.fillRect(q.x,q.y,q.w,Math.min(5,q.h));ctx.fillRect(q.x,q.y,Math.min(4,q.w),q.h)
}
const bx=b.x+b.w/2,by=b.y+b.h/2
if(b.kind==='chapel'){items.push({y:by,x:bx,s:A.chapel,sc:1.6});lights.push([bx,by-20,170,.9,'warm'])}
else if(b.kind==='armory'){items.push({y:by,x:bx,s:A.shrine,sc:1.6,dim:(V.bz.get(b.id)||0)>0});lights.push([bx,by-30,(V.bz.get(b.id)||0)>0?30:130,.9,'warm'])}
else if(NB[b.kind]){items.push({y:by,x:bx,s:NB[b.kind],sc:1.6,dim:(V.bz.get(b.id)||0)>0});lights.push([bx,by-20,130,.8,'warm'])}
else lights.push([bx,by,110,.7,'warm'])
}
for(const c of vc){
const o=c.o
if(o){
const cdn0=(V.bz.get(o.id)||0)>0
if(o.kind==='hole'){
ctx.fillStyle='#2a1a3a';ctx.beginPath();ctx.ellipse(o.x,o.y,31,15,0,0,TAU);ctx.fill()
const hg=ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,27);hg.addColorStop(0,'#000');hg.addColorStop(1,'#1a0e2a');ctx.fillStyle=hg;ctx.beginPath();ctx.ellipse(o.x,o.y,27,12,0,0,TAU);ctx.fill()
ctx.strokeStyle='rgba(180,138,255,.7)';ctx.lineWidth=2;for(let q=0;q<3;q++){const a2=clock*2+q*2.1;ctx.beginPath();ctx.ellipse(o.x,o.y,10+q*6,4+q*2.5,0,a2,a2+1.6);ctx.stroke()}
lights.push([o.x,o.y-4,70,.7,'vio'])
}else if(o.kind==='campfire'){
items.push({y:o.y,x:o.x,s:LOGS,fire:1})
lights.push([o.x,o.y-14,150+Math.sin(clock*11+o.x)*10,1,'warm'])
}else if(o.kind==='altar'){
items.push({y:o.y,x:o.x,s:ALTAR,dim:cdn0})
lights.push([o.x,o.y-26,cdn0?30:110,.9,'vio'])
}else if(o.kind==='graveyard'){
for(let q=0;q<6;q++){const hh=hash(o.x+q*7,o.y+q*13);items.push({y:o.y+((hh>>3)%60)-20,x:o.x+((hh>>9)%160)-80,s:A.tomb[hh%3]})}
lights.push([o.x,o.y-10,80,.5,'cyan'])
}else if(o.kind==='sinkhole'){
ctx.fillStyle='#07040c';ctx.beginPath();ctx.ellipse(o.x,o.y,74,32,0,0,TAU);ctx.fill()
const sgd=ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,64);sgd.addColorStop(0,'#000');sgd.addColorStop(1,'#241838');ctx.fillStyle=sgd;ctx.beginPath();ctx.ellipse(o.x,o.y,66,27,0,0,TAU);ctx.fill()
ctx.strokeStyle='rgba(180,138,255,.55)';ctx.lineWidth=2
for(let q=0;q<5;q++){const rr=12+q*12,a2=clock*(1.4+q*.3);ctx.beginPath();ctx.ellipse(o.x,o.y,rr,rr*.42,0,a2,a2+2.2);ctx.stroke()}
lights.push([o.x,o.y,130,.6,'vio'])
}else if(o.kind==='lair'){
ctx.fillStyle='#07040c';ctx.fillRect(o.x-34,o.y-12,68,34)
for(let q=0;q<4;q++){ctx.fillStyle=['#5a4478','#46345e','#34264a','#1a1028'][q];ctx.fillRect(o.x-28+q*3,o.y-8+q*6,56-q*6,6)}
ctx.fillStyle='#ff4a6a';ctx.fillRect(o.x-30,o.y-30,4,18);ctx.fillRect(o.x+26,o.y-30,4,18)
lights.push([o.x,o.y,110,.8,'red'])
}else if(o.kind==='crypt'&&V.dead.has(o.id))items.push({y:o.y,x:o.x,s:A.skull})
else{
const sp=OSP[o.kind],cdn=(V.bz.get(o.id)||0)>0,nq=sp?null:NO[o.kind]
items.push({y:o.y,x:o.x,s:sp?A[sp[0]]:nq[0],sc:sp?sp[1]:nq[1],dim:cdn})
lights.push([o.x,o.y-20,o.kind==='crypt'?90:cdn?30:o.kind==='tower'?120:130,.85,o.kind==='crypt'?'cyan':o.kind==='well'||o.kind==='shrine'&&!cdn?'cyan':'warm'])
}
}
for(const ch of c.ch){
const op=V.opened.has(ch.id)
items.push({y:ch.y,x:ch.x,s:CHEST[op?1:0],dim:op})
if(!op)lights.push([ch.x,ch.y-10,60,.8,'warm'])
}
}
const cs=150,ci0=Math.floor((cx-120)/cs),ci1=Math.floor((cx+VW+120)/cs),cj0=Math.floor((cy-120)/cs),cj1=Math.floor((cy+VH+160)/cs)
for(let i=ci0;i<=ci1;i++)for(let j=cj0;j<=cj1&&!inl;j++){
const hh=hash(i,j),r=(hh%1000)/1000,x=i*cs+((hh>>10)%100)*.9+20,y=j*cs+((hh>>17)%100)*.9+30
if(Math.hypot(x-500,y-560)<170)continue
const c=chunk(Math.floor(x/CS),Math.floor(y/CS))
if(c.b&&x>c.b.x-60&&x<c.b.x+c.b.w+60&&y>c.b.y-40&&y<c.b.y+c.b.h+80)continue
if(c.o&&Math.hypot(x-c.o.x,y-c.o.y)<90)continue
if(c.ch.some(q=>Math.hypot(x-q.x,y-q.y)<45))continue
if(r<.28)items.push({y,x,s:A.tomb[hh%3]})
else if(r<.34)items.push({y,x,s:A.tree})
else if(r<.385){items.push({y,x,s:A.lamp});lights.push([x,y-70,190,.9+Math.sin(clock*7+i*3.1)*.06,'warm'])}
else if(r<.43)items.push({y,x,s:A.patch})
else if(r<.47)items.push({y,x,s:A.fence})
else if(r<.52)items.push({y,x,s:A.skull})
else if(TERR&&r<.62)EYES.push({x,y,p:hh%97})
}
for(const o of V.pr.values())items.push({y:o.y,x:o.x,s:PROP[o.k]})
for(const d of V.dc){items.push({y:d[2],x:d[1],s:CHEST[V.opened.has(d[0])?1:0],drop:1});lights.push([d[1],d[2]-10,150,1,'warm'])}
for(const g of V.gm)items.push({y:g[1],x:g[0],s:A.gem[g[2]>=8?1:0],bob:Math.sin(clock*4+g[0])*1.5-6,lt:'vio'})
for(const hp of V.hp)items.push({y:hp[1],x:hp[0],s:A.heart,bob:Math.sin(clock*5)*2-8,lt:'red'})
for(const q of V.pt)items.push({y:q[3],x:q[2],pt:q})
for(const k of V.pk)items.push({y:k[3],x:k[2],pk:k[1]})
for(const e of V.en.values())items.push({y:e.y,en:e})
for(const o of V.pl.values())items.push({y:o.y,pl:o})
items.sort((a,b)=>a.y-b.y)
for(const it of items){
const x=it.x,y=it.y
if(it.en){if(it.en.x<cx-90||it.en.x>cx+VW+90||it.en.y<cy-60||it.en.y>cy+VH+170)continue;enemy(it.en);continue}
if(it.pl){person(it.pl,it.pl.u===me);continue}
if(x<cx-110||x>cx+VW+110||y<cy-80||y>cy+VH+180)continue
if(it.pt){
const k=it.pt[1],c=POT[k][1],by2=Math.sin(clock*3+x)*3
ctx.fillStyle=c;ctx.globalAlpha=.22+Math.sin(clock*4)*.06;ctx.beginPath();ctx.arc(x,y-14+by2,16,0,TAU);ctx.fill();ctx.globalAlpha=1
ctx.fillStyle='#07040c';ctx.fillRect(x-8,y-23+by2,16,18);ctx.fillRect(x-4,y-29+by2,8,8)
ctx.fillStyle=k==='blackhole'?'#000':c;ctx.fillRect(x-6,y-21+by2,12,14)
ctx.fillStyle='#cfd8e8';ctx.fillRect(x-2.5,y-27+by2,5,6);ctx.fillStyle='#8a5a2a';ctx.fillRect(x-3,y-30+by2,6,3)
ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(x-4,y-20+by2,2,8)
if(k==='blackhole'){ctx.strokeStyle='#b48aff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-14+by2,4+Math.sin(clock*8)*1.5,0,TAU);ctx.stroke()}
lights.push([x,y-14,76,.9,'vio'])
continue
}
if(it.pk){ctx.fillStyle='#140b1c';ctx.fillRect(x-8,y-14,16,12);ctx.fillStyle=it.pk==='a'?'#ff5fa2':'#a8794a';ctx.fillRect(x-6,y-12,12,8);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(x-6,y-12,12,2);lights.push([x,y-8,34,.6,it.pk==='a'?'red':'warm']);continue}
const s=it.s
const sc=it.sc||1
ctx.globalAlpha=it.dim?.45:1
ctx.drawImage(s.c,x-s.ax*sc,y-s.ay*sc+(it.bob||0),s.w*sc,s.h*sc)
ctx.globalAlpha=1
if(it.fire){const fh=10+Math.sin(clock*14+x)*3;ctx.fillStyle='#ff7a1a';ctx.fillRect(x-6,y-14-fh,12,fh);ctx.fillStyle='#ffd93b';ctx.fillRect(x-3,y-14-fh*.6,6,fh*.6);ctx.fillStyle='#fff3b0';ctx.fillRect(x-1,y-14-fh*.3,2,fh*.3)}
if(it.drop){const bg=ctx.createLinearGradient(0,y-140,0,y);bg.addColorStop(0,'rgba(255,226,122,0)');bg.addColorStop(1,'rgba(255,226,122,.45)');ctx.fillStyle=bg;ctx.fillRect(x-5,y-140,10,140)}
if(it.lt)lights.push([x,y-6,it.lt==='red'?40:34,.7,it.lt])
}
for(const c of vc){
const b=c.b
if(!b)continue
const hp=V.bars[b.id]||0
if(hp<=0)continue
const r=b.door.rect,bb=A.barricade
ctx.save();ctx.translate(r.x+r.w/2,r.y+r.h/2);if(r.w<=r.h)ctx.rotate(Math.PI/2)
const sw=Math.max(r.w,r.h)/bb.w*1.05
ctx.globalAlpha=.55+.45*Math.min(1,hp/140)
ctx.drawImage(bb.c,-bb.ax*sw,-bb.ay*sw+4,bb.w*sw,bb.h*sw)
ctx.restore();ctx.globalAlpha=1
}
for(const d of V.pd){ctx.fillStyle='rgba(255,217,59,.2)';ctx.beginPath();ctx.arc(d[0],d[1],d[2],0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,217,59,.55)';ctx.lineWidth=2;ctx.stroke();lights.push([d[0],d[1],d[2]*1.4,.7,'warm'])}
for(const b of V.eb.values()){
ctx.save();ctx.translate(b.x,b.y-10)
if(b.kd===1){ctx.rotate(Math.atan2(b.vy,b.vx));ctx.fillStyle='#07040c';ctx.fillRect(-14,-2.5,30,5);ctx.fillStyle='#d8d0b0';ctx.fillRect(-12,-1,26,2);ctx.fillStyle='#ff8a3a';ctx.beginPath();ctx.moveTo(16,-4);ctx.lineTo(24,0);ctx.lineTo(16,4);ctx.fill();lights.push([b.x,b.y-10,50,.6,'warm'])}
else if(b.kd===2){ctx.fillStyle='#07040c';ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.fill();ctx.fillStyle='#ffd93b';ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();ctx.fillStyle='#fff6b0';ctx.fillRect(-1,-3,2,6);lights.push([b.x,b.y-10,50,.7,'warm'])}
else if(b.kd===3){ctx.fillStyle='#07040c';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.fillStyle='#ff6a2a';ctx.beginPath();ctx.arc(0,0,6.5,0,TAU);ctx.fill();ctx.fillStyle='#ffd93b';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill();lights.push([b.x,b.y-10,64,.8,'warm'])}
else{ctx.rotate(b.a);ctx.drawImage(A.ebone.c,-A.ebone.ax,-A.ebone.ay,A.ebone.w,A.ebone.h)}
ctx.restore()
}
for(const b of V.pj.values()){
if(b.k===9){ctx.save();ctx.translate(b.x,b.y-12);const r9=34+Math.sin(clock*20)*3,g9=ctx.createRadialGradient(0,0,0,0,0,r9*1.7);g9.addColorStop(0,'rgba(255,255,255,1)');g9.addColorStop(.3,'rgba(210,130,255,.95)');g9.addColorStop(.65,'rgba(120,40,255,.6)');g9.addColorStop(1,'rgba(80,0,200,0)');ctx.fillStyle=g9;ctx.beginPath();ctx.arc(0,0,r9*1.7,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;for(let q=0;q<3;q++){ctx.beginPath();ctx.ellipse(0,0,r9*(.5+q*.25),r9*(.2+q*.1),clock*3+q,0,TAU);ctx.stroke()}ctx.restore();lights.push([b.x,b.y-12,240,1,'vio'])}
else if(b.k===0){ctx.save();ctx.translate(b.x,b.y-12);ctx.rotate(b.a);ctx.drawImage(A.bullet.c,-A.bullet.ax,-A.bullet.ay,A.bullet.w,A.bullet.h);ctx.restore();lights.push([b.x,b.y-12,52,.8,'warm'])}
else{ctx.save();ctx.translate(b.x,b.y-12);ctx.rotate(b.a);ctx.fillStyle='#140b1c';ctx.beginPath();ctx.arc(0,0,b.k===3?5.5:8,0,TAU);ctx.fill();ctx.fillStyle=TC[b.k-1];ctx.beginPath();ctx.arc(0,0,b.k===3?4:6.5,0,TAU);ctx.fill();ctx.restore();lights.push([b.x,b.y-12,60,.8,b.k===3?'red':'warm'])}
}
for(const o of V.pl.values()){
if(o.s==='dead'||!o.orb)continue
for(let i=0;i<o.orb;i++){const a=clock*2.7+i*TAU/o.orb,x=o.x+Math.cos(a)*66,y=o.y-8+Math.sin(a)*66;ctx.drawImage(A.lantern.c,x-A.lantern.ax,y-A.lantern.ay,A.lantern.w,A.lantern.h);lights.push([x,y,72,.9,'warm'])}
}
for(const f of F){ctx.globalAlpha=Math.max(0,f.l/f.m);ctx.fillStyle=f.c;ctx.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s);ctx.globalAlpha=1}
for(const g of RG){const k=g.l/g.m,c=RC[g.w]||RC[9];ctx.strokeStyle='rgba('+c+','+k+')';ctx.lineWidth=6;ctx.beginPath();ctx.arc(g.x,g.y-8,g.r*(1.05-k*.85),0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,240,200,'+k*.8+')';ctx.lineWidth=2;ctx.stroke();lights.push([g.x,g.y-8,g.r+40,Math.min(1,k*1.5),'warm'])}
for(const c of vc){
const b=c.b
if(!b)continue
const a=1-(fade.get(b.id)||0)
if(a>.02){ctx.globalAlpha=a;ctx.drawImage(roofOf(b),b.x,b.y);ctx.globalAlpha=1}
}
for(const c of vc)if(c.b){const t=inb&&inb.id===c.b.id?1:0,v=fade.get(c.b.id)||0;fade.set(c.b.id,v+(t-v)*Math.min(1,dt*6))}
return{cx,cy,inb}
}
const lighting=(cx,cy)=>{
const kx=dk.width/Wd,s=Z*kx
dctx.globalCompositeOperation='source-over'
dctx.fillStyle=TERR?'rgba(8,0,6,.95)':'rgba(7,3,16,.84)'
dctx.fillRect(0,0,dk.width,dk.height)
dctx.globalCompositeOperation='destination-out'
let nl=0
for(const l of lights){
if(++nl>70)break
const r=l[2]*s,x=(l[0]-cx)*s,y=(l[1]-cy)*s
if(x<-r||y<-r||x>dk.width+r||y>dk.height+r)continue
dctx.globalAlpha=Math.min(1,l[3])
dctx.drawImage(LS.w,x-r,y-r,r*2,r*2)
}
dctx.globalAlpha=1
ctx.setTransform(1,0,0,1,0,0)
ctx.imageSmoothingEnabled=true
ctx.drawImage(dk,0,0,cv.width,cv.height)
if(!lite&&Q>=2){
ctx.globalCompositeOperation='lighter'
const sc=Z*D
for(const l of lights){
const tint=LS[l[4]],r=l[2]*sc*(l[4]==='w'?.9:1.1),x=(l[0]-cx)*sc,y=(l[1]-cy)*sc
if(x<-r||y<-r||x>cv.width+r||y>cv.height+r)continue
ctx.globalAlpha=Math.min(.34,l[3]*(l[4]==='w'?.2:.3))
ctx.drawImage(tint,x-r,y-r,r*2,r*2)
}
ctx.globalAlpha=1
ctx.globalCompositeOperation='source-over'
}
ctx.setTransform(D,0,0,D,0,0)
}
const overlays=(cx,cy,inb)=>{
ctx.setTransform(D*Z,0,0,D*Z,-cx*D*Z,-cy*D*Z)
const fv=inb&&fade.get(inb.id)||0
if(inb&&fv>.02){
ctx.save();ctx.beginPath();ctx.rect(cx-10,cy-10,VW+20,VH+20);ctx.rect(inb.x,inb.y,inb.w,inb.h);ctx.fillStyle='rgba(4,2,10,'+.94*fv+')';ctx.fill('evenodd');ctx.restore()
}
if(TERR&&Q>0){const pe=mine();for(const e of EYES){const d=pe?Math.hypot(e.x-pe.x,e.y-pe.y):999;if(d<150||Math.sin(clock*1.7+e.p)<-.85)continue;ctx.globalAlpha=Math.min(1,(d-150)/120)*.9;ctx.fillStyle='#ff2a2a';ctx.fillRect(e.x-1,e.y,3,2);ctx.fillRect(e.x+6,e.y,3,2)};ctx.globalAlpha=1}
for(const q of V.pt){const pm=mine();if(!pm||Math.hypot(q[2]-pm.x,q[3]-pm.y)>150)continue;ctx.font='800 10px system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(8,2,6,.95)';ctx.strokeText(POT[q[1]][0]+' potion',q[2],q[3]-38);ctx.fillStyle=POT[q[1]][1]==='#2a1a3a'?'#b48aff':POT[q[1]][1];ctx.fillText(POT[q[1]][0]+' potion',q[2],q[3]-38)}
for(const x of X){ctx.globalAlpha=Math.min(1,x.l*2);ctx.font=(x.big?'800 15px ':'700 11px ')+'system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(10,4,16,.95)';ctx.strokeText(x.v,x.x,x.y);ctx.fillStyle=x.c;ctx.fillText(x.v,x.x,x.y)}
ctx.globalAlpha=1
const p=mine()
const tip=(s,x,y)=>{ctx.font='700 9px system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(8,2,6,.95)';ctx.strokeText(s,x,y);ctx.fillStyle='#ffe27a';ctx.fillText(s,x,y)}
if(p&&p.s==='up'){
for(const c of around(p.x,p.y,1)){
const b=c.b
if(b){
const d=b.door
if(Math.hypot(d.cx-p.x,d.cy-p.y)<75)tip(V.bars[b.id]>0?'Hold E to open':p.wood>=2?'Hold E to board up (2 wood)':'Need 2 wood',d.cx,d.cy-18)
if(b.kind==='armory'&&Math.hypot(b.x+b.w/2-p.x,b.y+b.h/2-p.y)<70){const z=Math.ceil(V.bz.get(b.id)||0);tip(z>0?'Restocking '+z+'s':'Hold E to restock',b.x+b.w/2,b.y+b.h/2+26)}
}
for(const ch of c.ch)if(!V.opened.has(ch.id)&&Math.hypot(ch.x-p.x,ch.y-p.y)<56)tip('Hold E to open chest',ch.x,ch.y-26)
const o=c.o
if(o&&o.kind==='lair'&&Math.hypot(o.x-p.x,o.y-p.y)<90)tip('Walk in to go underground',o.x,o.y-40)
if(o&&(o.kind==='well'||o.kind==='shrine')&&Math.hypot(o.x-p.x,o.y-p.y)<80&&(V.bz.get(o.id)||0)>0)tip('Ready in '+Math.ceil(V.bz.get(o.id))+'s',o.x,o.y-50)
}
}
ctx.setTransform(D,0,0,D,0,0)
}
const vignette=()=>{
ctx.drawImage(vgc,0,0,Wd,Hd)
if(V.bm>0){ctx.fillStyle='rgba(130,0,12,'+(.14+Math.sin(clock*2)*.04)+')';ctx.fillRect(0,0,Wd,Hd)}
if(TERR&&scare>0){ctx.fillStyle='rgba(255,235,235,'+Math.min(.4,scare*.6)+')';ctx.fillRect(0,0,Wd,Hd)}
if(hurtT>0){ctx.fillStyle='rgba(200,20,20,'+Math.min(.28,hurtT*.6)+')';ctx.fillRect(0,0,Wd,Hd)}
const p=mine()
if(p&&p.hp<p.max*.3&&p.s==='up'){ctx.fillStyle='rgba(180,0,0,'+(.1+Math.sin(clock*6)*.05)+')';ctx.fillRect(0,0,Wd,Hd)}
}
const MK={cabin:'#ffd27a',campfire:'#ff9d2e',altar:'#b48aff',hole:'#c9a8ff',graveyard:'#8a8aa0',chapel:'#8fe3ff',house:'#ffb347',armory:'#ffb347',tower:'#ffe27a',crypt:'#4aff7a',well:'#6ec1ff',shrine:'#ff9d2e',barn:'#e07a4a',tavern:'#ffd27a',mansion:'#ffd93b',bunker:'#9ab4d8',mill:'#e8e2cc',obelisk:'#b48aff',scarecrow:'#ffb347',ruins:'#8a8aa0',fountain:'#6ec1ff',mausoleum:'#4aff7a',sinkhole:'#c9a8ff',lair:'#ff4a6a'}
const radar=p=>{
const r=58,cx=Wd-r-16,cy=r+58,sc=r/1500
ctx.save()
ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fillStyle='rgba(14,8,22,.78)';ctx.fill();ctx.strokeStyle='#5a3a7a';ctx.lineWidth=2;ctx.stroke();ctx.clip()
for(const c of around(p.x,p.y,2)){
const b=c.b,o=c.o
if(b){ctx.fillStyle=MK[b.kind];ctx.fillRect(cx+(b.x+b.w/2-p.x)*sc-3,cy+(b.y+b.h/2-p.y)*sc-3,6,6)}
if(o&&!(o.kind==='crypt'&&V.dead.has(o.id))){ctx.fillStyle=MK[o.kind];ctx.beginPath();ctx.arc(cx+(o.x-p.x)*sc,cy+(o.y-p.y)*sc,3.5,0,TAU);ctx.fill()}
for(const ch of c.ch)if(!V.opened.has(ch.id)){ctx.fillStyle='#ffd93b';ctx.fillRect(cx+(ch.x-p.x)*sc-1.5,cy+(ch.y-p.y)*sc-1.5,3,3)}
}
for(const d of V.dc){if(V.opened.has(d[0]))continue;ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.arc(cx+Math.max(-r+4,Math.min(r-4,(d[1]-p.x)*sc)),cy+Math.max(-r+4,Math.min(r-4,(d[2]-p.y)*sc)),4+Math.sin(clock*6)*1.2,0,TAU);ctx.fill()}
for(const o of V.pl.values()){if(o.u===me||o.s==='dead')continue;const ex=(o.x-p.x)*sc,ey=(o.y-p.y)*sc,m=Math.hypot(ex,ey),k=m>r-5?(r-5)/m:1;ctx.fillStyle=COL[(idx.get(o.u)||0)%3];ctx.beginPath();ctx.arc(cx+ex*k,cy+ey*k,4.5,0,TAU);ctx.fill();ctx.strokeStyle='#07040c';ctx.lineWidth=1.5;ctx.stroke()}
ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,3,0,TAU);ctx.fill()
ctx.restore()
}
const blackhole=o=>{
const sc=Z*D,x=(o.x-L.cx)*sc,y=(o.y-8-L.cy)*sc
const amp=RU.test?.55+.45*Math.sin(clock*.7):1
const Rr=Math.min(Wd,Hd)*D*.3*(1+Math.sin(clock*2)*.05),S2=Math.ceil(Rr*2.8)
const sx=Math.max(0,Math.round(x-S2/2)),sy=Math.max(0,Math.round(y-S2/2)),sw=Math.min(cv.width-sx,S2),sh=Math.min(cv.height-sy,S2)
if(sw<16||sh<16)return
if(scr.width<sw)scr.width=sw
if(scr.height<sh)scr.height=sh
sg.clearRect(0,0,scr.width,scr.height)
sg.drawImage(cv,sx,sy,sw,sh,0,0,sw,sh)
const cl=x-sx,cy2=y-sy,t=clock,st=Math.max(3,Math.round(4*D)),sc2=st*2
ctx.setTransform(1,0,0,1,0,0)
ctx.save()
ctx.beginPath();ctx.arc(x,y,Rr*1.35,0,TAU);ctx.clip()
for(let row=0;row<sh;row+=st){
const fy=1-Math.abs(row-cy2)/(S2/2)
if(fy<=0)continue
const k=1+fy*fy*1.8*amp*(.55+.45*Math.sin(t*2.2+row*.045)),o2=Math.sin(t*4+row*.11)*46*fy*fy*amp
ctx.drawImage(scr,0,row,sw,st,sx+cl-cl*k+o2,sy+row,sw*k,st)
}
ctx.globalAlpha=.65
for(let col=0;col<sw;col+=sc2){
const fx=1-Math.abs(col-cl)/(S2/2)
if(fx<=0)continue
const ky=1+fx*fx*1.5*amp*(.5+.5*Math.sin(t*3+col*.05))
ctx.drawImage(scr,col,0,sc2,sh,sx+col,sy+cy2-cy2*ky,sc2,sh*ky)
}
ctx.globalAlpha=1
const nb=Math.round(34*amp)
for(let i=0;i<nb;i++){
const bw=(10+R()*34)|0,bh=(6+R()*22)|0,a=R()*TAU,rr=R()*Rr*1.2
const bx=Math.max(0,Math.min(sw-bw,cl+Math.cos(a)*rr-bw/2))|0,by=Math.max(0,Math.min(sh-bh,cy2+Math.sin(a)*rr-bh/2))|0
ctx.drawImage(scr,bx,by,bw,bh,sx+((R()*(sw-bw))|0),sy+((R()*(sh-bh))|0),bw,bh)
if(R()<.5){ctx.fillStyle='#04010a';ctx.fillRect(sx+bx,sy+by,bw,bh)}
}
for(let i=0;i<90*amp;i++)ctx.drawImage(scr,(R()*(sw-3))|0,(R()*(sh-3))|0,3,3,sx+((R()*sw)|0),sy+((R()*sh)|0),3,3)
for(let i=0;i<64;i++){
const a=i/64*TAU+t*.3,r0=Rr*(.75+R()*.55),px=cl+Math.cos(a)*r0,py=cy2+Math.sin(a)*r0
if(px<2||py<2||px>sw-4||py>sh-4)continue
ctx.save();ctx.translate(x,y);ctx.rotate(a)
ctx.drawImage(scr,px|0,py|0,3,3,r0*.12,-(2+R()*3),r0*.88*(.6+.4*amp),5)
ctx.restore()
}
ctx.restore()
const g=ctx.createRadialGradient(x,y,Rr*.1,x,y,Rr*.62)
g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.55,'rgba(2,0,8,.96)');g.addColorStop(1,'rgba(10,0,30,0)')
ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,Rr*.62,0,TAU);ctx.fill()
ctx.save();ctx.translate(x,y);ctx.rotate(-.32);ctx.scale(1,.3)
const dg=ctx.createRadialGradient(0,0,Rr*.3,0,0,Rr*.78)
dg.addColorStop(0,'rgba(255,230,160,0)');dg.addColorStop(.35,'rgba(255,170,70,.95)');dg.addColorStop(.6,'rgba(180,70,255,.7)');dg.addColorStop(1,'rgba(60,0,160,0)')
ctx.fillStyle=dg;ctx.beginPath();ctx.arc(0,0,Rr*.78,0,TAU);ctx.arc(0,0,Rr*.3,0,TAU);ctx.fill('evenodd')
ctx.restore()
ctx.fillStyle='#000';ctx.beginPath();ctx.arc(x,y,Rr*.3,0,TAU);ctx.fill()
ctx.strokeStyle='rgba(255,200,120,.85)';ctx.lineWidth=3*D;ctx.beginPath();ctx.arc(x,y,Rr*.33,Math.PI*1.05,Math.PI*1.95);ctx.stroke()
ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1.5*D;ctx.beginPath();ctx.arc(x,y,Rr*.3,0,TAU);ctx.stroke()
ctx.setTransform(D*Z,0,0,D*Z,-L.cx*D*Z,-L.cy*D*Z)
}
const glitch=()=>{
ctx.setTransform(1,0,0,1,0,0)
const k=Math.min(1,glitchT)
for(let i=0;i<9;i++){const y=(R()*cv.height)|0,hh=(6+R()*40)|0;ctx.drawImage(cv,0,y,cv.width,hh,(R()-.5)*80*k,y,cv.width,hh)}
ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,0,110,'+.06*k+')';ctx.fillRect(0,0,cv.width,cv.height);ctx.globalCompositeOperation='source-over'
for(let i=0;i<5;i++){ctx.fillStyle=['#ff2aff','#2affff','#fff'][i%3];ctx.globalAlpha=.5*k;ctx.fillRect(R()*cv.width,R()*cv.height,20+R()*120,2+R()*4)}
ctx.globalAlpha=1
ctx.setTransform(D,0,0,D,0,0)
}
const stopFx=()=>{
ctx.setTransform(1,0,0,1,0,0)
ctx.globalCompositeOperation='saturation';ctx.fillStyle='#808080';ctx.fillRect(0,0,cv.width,cv.height);ctx.globalCompositeOperation='source-over'
ctx.fillStyle='rgba(120,140,255,.1)';ctx.fillRect(0,0,cv.width,cv.height)
ctx.setTransform(D,0,0,D,0,0)
}
const glyph=(n,x,y,c)=>{
ctx.save();ctx.translate(x,y);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round'
if(n==='dash'){for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-9+i*6,-7);ctx.lineTo(-3+i*6,0);ctx.lineTo(-9+i*6,7);ctx.stroke()}}
else if(n==='flare'){for(let i=0;i<8;i++){const a=i*TAU/8;ctx.beginPath();ctx.moveTo(Math.cos(a)*4,Math.sin(a)*4);ctx.lineTo(Math.cos(a)*10,Math.sin(a)*10);ctx.stroke()}ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill()}
else if(n==='ward'){ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(9,-6);ctx.lineTo(7,4);ctx.lineTo(0,10);ctx.lineTo(-7,4);ctx.lineTo(-9,-6);ctx.closePath();ctx.stroke();ctx.globalAlpha=.35;ctx.fill()}
else if(n==='rift'){ctx.beginPath();for(let i=0;i<30;i++){const a=i*.45,r=1+i*.32;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.stroke()}
else if(n==='purple'){ctx.globalAlpha=.9;ctx.fillStyle='#ff3a3a';ctx.beginPath();ctx.arc(-5,0,6.5,0,TAU);ctx.fill();ctx.fillStyle='#3a7aff';ctx.beginPath();ctx.arc(5,0,6.5,0,TAU);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill()}
else{ctx.beginPath();ctx.moveTo(0,-10);ctx.quadraticCurveTo(10,2,0,10);ctx.quadraticCurveTo(-10,2,0,-10);ctx.fill()}
ctx.restore()
}
const arrows=p=>{
if(!p)return
const pts=[]
for(const o of V.pl.values())if(o.u!==me&&o.s!=='dead')pts.push([o.x,o.y,COL[(idx.get(o.u)||0)%3],(names.get(o.u)||'').slice(0,10),o.s==='down'])
for(const d of V.dc)if(!V.opened.has(d[0]))pts.push([d[1],d[2],'#ffe27a','Supply',0])
for(const q of pts){
const sx=(q[0]-L.cx)*Z,sy=(q[1]-L.cy)*Z
if(sx>40&&sx<Wd-40&&sy>70&&sy<Hd-110)continue
const dx=q[0]-p.x,dy=q[1]-p.y,a=Math.atan2(dy,dx)
const cx=Wd/2,cy=Hd/2,ex=Wd/2-52,ey=Hd/2-96
const k=Math.min(ex/Math.max(.001,Math.abs(Math.cos(a))),ey/Math.max(.001,Math.abs(Math.sin(a))))
const ax=cx+Math.cos(a)*k,ay=cy+Math.sin(a)*k
ctx.save();ctx.translate(ax,ay);ctx.rotate(a)
ctx.fillStyle=q[2];ctx.strokeStyle='#07040c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-3,0);ctx.lineTo(-8,10);ctx.closePath();ctx.stroke();ctx.fill()
ctx.restore()
const m=Math.round(Math.hypot(dx,dy)/50)+'m'
const tx=ax-Math.cos(a)*30,ty=ay-Math.sin(a)*30
ctext(q[4]?q[3]+' DOWN':q[3],tx,ty-6,'700 11px system-ui,sans-serif',q[2],3)
ctext(m,tx,ty+7,'600 10px system-ui,sans-serif','#d8c9f0',3)
}
}
const hud=()=>{
const p=mine()
const pw=Math.min(290,Wd-32)
if(p){
plate(14,14,pw,88,12)
ctx.save();ctx.beginPath();ctx.arc(52,48,26,0,TAU);ctx.fillStyle='#1c0f2c';ctx.fill();ctx.strokeStyle=COL[(idx.get(me)||0)%3];ctx.lineWidth=2.5;ctx.stroke();ctx.clip()
const ps=PS[(idx.get(me)||0)%3][0];ctx.drawImage(ps.c,26,24,ps.w*1.15,ps.h*1.15);ctx.restore()
bar(88,24,pw-88,18,p.hp/p.max,'#ff6a5a','#b01a2a')
ctext(Math.ceil(p.hp)+' / '+p.max,88+(pw-88)/2,33,'700 12px system-ui,sans-serif','#fff',3)
bar(88,46,pw-88,10,p.arm?p.ar/p.arm:0,'#a8c4e8','#4a6a94')
if(p.arm)ctext('Armor '+Math.ceil(p.ar),88+(pw-88)/2,51,'700 9px system-ui,sans-serif','#fff',3)
bar(88,60,pw-88,8,p.xp/p.next,'#c9a8ff','#6a3fd0')
ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#e8d6ff';ctx.fillText('Level '+p.lv,90,82)
ctx.textAlign='right';ctx.fillText(V.kl+' defeated',pw+4,82)
radar(p)
arrows(p)
}
let y=112
for(const o of V.pl.values()){
if(o.u===me)continue
const i=idx.get(o.u)||0
plate(14,y,pw*.72,30,10)
ctx.font='700 11px system-ui,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=COL[i%3];ctx.fillText((names.get(o.u)||'').slice(0,12),24,y+10)
ctx.fillStyle='#b79ad6';ctx.textAlign='right';ctx.fillText(o.s==='up'?'Lv '+o.lv:o.s==='down'?'DOWN':'OUT',14+pw*.72-10,y+10)
bar(24,y+19,pw*.72-20,6,o.s==='up'?o.hp/o.max:0,'#ff6a5a','#b01a2a')
y+=36
}
const tw=140
plate(Wd/2-tw/2,12,tw,44,12)
ctext(DUR?mmss(Math.max(0,DUR-V.tm)):mmss(V.tm),Wd/2,29,'800 26px '+FONT,V.bm>0?'#ff8a7a':'#ffe9c4',4)
ctx.font='700 10px system-ui,sans-serif';ctx.fillStyle=V.bm>0?'#ff6a5a':'#b79ad6';ctx.textAlign='center';ctx.fillText(V.bm>0?'BLOOD MOON '+V.bm+'s':DUR?'UNTIL DAWN':'SURVIVED',Wd/2,48)
if(V.bo){
const bw=Math.min(480,Wd-40),bx=Wd/2-bw/2,by=Hd-54
ctext(V.bo[0],Wd/2,by-12,'800 18px '+FONT,'#ffb347',4)
bar(bx,by,bw,16,Math.max(0,V.bo[1]/V.bo[2]),'#ff9a3a','#b8400a')
}
if(noteT>0){ctx.globalAlpha=Math.min(1,noteT);ctext(note,Wd/2,Hd*.2,'800 '+Math.min(46,Wd/12)+'px '+FONT,'#ffb347',6);ctx.globalAlpha=1}
abBtn.length=0
const coarse=matchMedia('(pointer:coarse)').matches
const btns=[1,2,3].map(i=>({slot:i}))
if(coarse)btns.push({act:'use'})
ABN.forEach((n,i)=>{if(!p||!p.ab||p.ab[i][0]>0)btns.push({act:n,i})})
const gap=6,sw=Math.max(40,Math.min(58,(Wd-24)/btns.length-gap))
const tot=btns.length*(sw+gap)-gap
const by=Hd-sw-30
btns.forEach((b,k)=>{
const x=Wd/2-tot/2+k*(sw+gap)
ctx.beginPath();ctx.roundRect(x,by,sw,sw,10);ctx.fillStyle='rgba(14,4,10,.88)';ctx.fill()
if(b.slot){
const i=b.slot,on=L.slot===i,n=p?p.ammo[i-1]:0
ctx.strokeStyle=on?TC[i-1]:'#3a2030';ctx.lineWidth=on?3:2;ctx.stroke()
ctx.fillStyle=n>0?TC[i-1]:'#3a2a40';ctx.beginPath();ctx.arc(x+sw/2,by+sw*.4,i===3?8:11,0,TAU);ctx.fill();ctx.strokeStyle='#140b1c';ctx.lineWidth=2;ctx.stroke()
ctext(String(i),x+9,by+10,'800 10px system-ui,sans-serif','#8a72a6',3)
ctext('x'+n,x+sw/2,by+sw-11,'700 12px system-ui,sans-serif',n>0?'#e8d6ff':'#6a5060',3)
abBtn.push({slot:i,x,y:by,w:sw,h:sw})
}else if(b.act==='use'){
ctx.strokeStyle='#ffe27a';ctx.lineWidth=2;ctx.stroke()
ctext('USE',x+sw/2,by+sw*.4,'800 13px system-ui,sans-serif','#ffe27a',3)
ctext(p?p.wood+' wood':'',x+sw/2,by+sw-11,'700 10px system-ui,sans-serif','#e8d6ff',3)
abBtn.push({act:'use',x,y:by,w:sw,h:sw})
}else{
const inf=ABI[b.act],lv=p&&p.ab?p.ab[b.i][0]:1
const cdv=b.act==='dash'?L.dcd:p&&p.ab?p.ab[b.i][1]:0
const full=b.act==='dash'?3.2*Math.pow(.85,Math.max(0,lv-1)):inf[3]*Math.pow(.85,Math.max(0,lv-1))
ctx.strokeStyle=cdv>0?'#3a2a40':inf[2];ctx.lineWidth=2;ctx.stroke()
glyph(b.act,x+sw/2,by+sw*.4,cdv>0?'#6a5a80':inf[2])
ctext(inf[1]==='SPACE'?'SPC':inf[1],x+sw-9,by+10,'800 10px system-ui,sans-serif','#8a72a6',3)
ctext(inf[0].split(' ').pop()+' '+lv,x+sw/2,by+sw-11,'700 10px system-ui,sans-serif','#e8d6ff',3)
if(cdv>0){ctx.save();ctx.beginPath();ctx.roundRect(x,by,sw,sw,10);ctx.clip();ctx.fillStyle='rgba(6,2,12,.7)';ctx.fillRect(x,by,sw,sw*Math.min(1,cdv/full));ctx.restore();ctext(Math.ceil(cdv)+'',x+sw/2,by+sw*.4,'800 15px system-ui,sans-serif','#fff',3)}
abBtn.push({act:b.act,x,y:by,w:sw,h:sw})
}
})
const fxs=p&&p.fx
if(fxs){let cyy=by-22;[['SPEED','speed'],['BLUE LOCK','bluelock'],['GIANT','giant'],['VAMPIRE','vamp'],['BLACK HOLE','blackhole']].forEach((q,i)=>{if(fxs[i]>0){ctext(q[0]+' '+fxs[i]+'s',Wd/2,cyy,'800 12px system-ui,sans-serif',POT[q[1]][1]==='#2a1a3a'?'#b48aff':POT[q[1]][1],3);cyy-=16}})}
if(V.ts>0)ctext('TIME STOPPED '+V.ts,Wd/2,Hd*.28,'800 26px '+FONT,'#c8d8ff',5)
if(L.inv>0)ctext('CONTROLS INVERTED',Wd/2,Hd*.36,'800 18px system-ui,sans-serif','#ff6ad0',4)
if(RU.test)ctext('ADMIN TEST: BLACK HOLE   '+Math.round(1/Math.max(.001,ft))+' fps',Wd/2,Hd*.14,'800 16px system-ui,sans-serif','#b48aff',4)
ctx.font='600 11px system-ui,sans-serif';ctx.textAlign='left';ctx.fillStyle='rgba(220,200,240,.55)'
ctx.fillText(VC.ch?'Voice: '+(proxOn?'proximity':'everyone')+' (V)   Mic '+(VC.muted?'off':'on')+' (B)':'Join a voice channel to talk',16,Hd-32)
if(!coarse){
ctx.fillText('WASD move   Click throw   E use   SPACE dash   H purple   M '+(muted?'unmute':'mute'),16,Hd-14)
if(p)ctx.fillText('Wood '+p.wood,Wd-80,Hd-14)
}
if(p&&p.s==='down'){ctext('You are down',Wd/2,Hd*.32,'800 28px '+FONT,'#ff6a5a',5);ctext('A teammate can revive you',Wd/2,Hd*.32+30,'700 14px system-ui,sans-serif','#e8d6ff',3)}
else if(p&&p.s==='dead')ctext('You were knocked out',Wd/2,Hd*.32,'800 26px '+FONT,'#ff6a5a',5)
const dn=[...V.pl.values()].find(o=>o.s==='down'&&o.u!==me&&p&&p.s==='up'&&Math.hypot(o.x-p.x,o.y-p.y)<70)
if(dn)ctext('Hold E to revive '+(names.get(dn.u)||''),Wd/2,Hd*.7,'700 15px system-ui,sans-serif','#7dff9a',4)
if(L.jid!==null){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(L.jx,L.jy,50,0,TAU);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(L.jx+L.jdx,L.jy+L.jdy,22,0,TAU);ctx.fill()}
}
const finish=()=>{
if(done)return
done=true
const win=V.st==='win'
if(win){tone(523,.3,.06,'triangle');setTimeout(()=>tone(659,.3,.06,'triangle'),150);setTimeout(()=>tone(784,.5,.06,'triangle'),300)}else tone(110,.9,.08,'sawtooth',.4)
const rows=[['Time survived',mmss(V.tm)],['Enemies defeated',String(V.kl)],...[...V.pl.values()].map(o=>[names.get(o.u)||'',o.s==='dead'?'Level '+o.lv+' (out)':'Level '+o.lv])]
endBox.replaceChildren(h('h2',null,win?'Dawn breaks':'Consumed'),h('div',{class:'tu-rows'},...rows.map(r=>h('div',null,h('span',null,r[0]),h('b',null,r[1])))),h('button',{class:'btn pri',type:'button',on:{click:()=>onEnd()}},'Back to lobby'))
endBox.classList.add('on')
}
const loop=now=>{
raf=requestAnimationFrame(loop)
const dt=Math.max(0,Math.min(.05,(now-last)/1000||0));last=now
clock+=dt
if(host&&!done){
acc+=dt
let n=0
while(acc>=1/30&&n++<3){acc-=1/30;sim.step(1/30)}
if(acc>.2)acc=0
snapAcc+=dt
if(snapAcc>=.1){snapAcc=0;const sn=sim.snap();apply(sn);send(sn);for(const o of sim.out.splice(0)){if(o.to===me)onM(o.m);else send(o.m,o.to)}}
}
if(!done)move(dt)
L.sent+=dt
if(L.sent>=.066&&!done){L.sent=0;netIn()}
if(L.aid!==null&&L.fire)throwAt(L.mx/Z+L.cx,L.my/Z+L.cy)
const k=Math.min(1,dt*16)
for(const o of V.pl.values()){
if(o.u!==me||o.s!=='up'){const px=o.x;o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k;if(Math.abs(o.x-px)>.05){o.face=o.x>px?1:-1;o.walk+=dt*.9}}
}
for(const o of V.en.values()){o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k;o.fl-=dt}
for(const o of V.pr.values()){o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k}
ft=ft*.95+dt*.05;qt+=dt
if(qt>2.5){qt=0;if(ft>.027&&Q>0){Q--;fit()}}
if(TERR){beatT-=dt;let nn=0;const pp=mine();if(pp)for(const e of V.en.values()){const dx=e.x-pp.x,dy=e.y-pp.y;if(dx*dx+dy*dy<67600)nn++};const th=Math.min(1,nn/9+(pp?(1-pp.hp/pp.max)*.6:0));if(beatT<=0){beatT=1.25-th*.75;tone(52,.16,.14,'sine',.6);setTimeout(()=>tone(46,.18,.1,'sine',.6),180)};bolt-=dt;if(bolt<=0){bolt=14+R()*16;scare=.55;shake=Math.max(shake,5);tone(38,1.2,.12,'sawtooth',.4)};whT-=dt;if(whT<=0){whT=3+R()*6;tone(300+R()*200,.9,.012,'sine',.5)};scare=Math.max(0,scare-dt*1.4)}
const t1=now
for(const b of V.pj.values()){const e=Math.min(.14,(t1-b.t)/1000);b.x+=b.vx*dt;b.y+=b.vy*dt}
for(const b of V.eb.values()){b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=dt*14}
for(let i=F.length-1;i>=0;i--){const f=F[i];f.l-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.94;f.vy*=.94;if(f.l<=0){F[i]=F[F.length-1];F.pop()}}
for(let i=X.length-1;i>=0;i--){const x=X[i];x.l-=dt;x.y-=dt*34;if(x.l<=0){X[i]=X[X.length-1];X.pop()}}
for(let i=RG.length-1;i>=0;i--){RG[i].l-=dt;if(RG[i].l<=0)RG.splice(i,1)}
shake=Math.max(0,shake-dt*30);noteT-=dt;hurtT-=dt;glitchT=Math.max(0,glitchT-dt)
pxT+=dt
if(pxT>.25){pxT=0;prox()}
const p=mine()
ctx.setTransform(D,0,0,D,0,0)
const w=world(dt)
for(const o of V.pl.values())if(o.fx&&o.fx[4]>0&&o.s!=='dead')blackhole(o)
lighting(w.cx,w.cy)
overlays(w.cx,w.cy,w.inb)
vignette()
if(V.ts>0)stopFx()
if(glitchT>0)glitch()
hud()
if(V.st==='win'||V.st==='lose')finish()
}
raf=requestAnimationFrame(loop)
return{
msg(f,d){
if(host){
if(d.k==='i')sim.input(f,d.x,d.y,d.a,d.d)
else if(d.k==='t')sim.throw(f,d.w,d.x,d.y)
else if(d.k==='h')sim.holdSet(f,d.v)
else if(d.k==='p')sim.pick(f,d.id)
else if(d.k==='a')sim.cast(f,d.n)
}else if(d.k==='s'&&f===hostUid)apply(d)
else if(f===hostUid)onM(d)
},
left(u){
if(!host&&u===hostUid&&!done){V.st='lose';say('The host left the match');finish()}
},
stop(){
cancelAnimationFrame(raf);clearInterval(mus);ro.disconnect();restoreVol()
removeEventListener('keydown',kd);removeEventListener('keyup',ku)
try{ac&&ac.close()}catch{}
box.classList.remove('rs','tu-play')
box.replaceChildren()
}
}
}
