import{h}from'./util.js'
import{buildArt}from'./rushart.js'
import{terrorArt}from'./rushterror.js'
import{createSim,CS,chunk,near,around,buildingAt,push,UPS,WIN_AT,ET,ABN,ABI}from'./tusim.js'
const TAU=Math.PI*2
const R=Math.random
const COL=['#ff9d2e','#6ec1ff','#9be564']
const TC=['#ff5fa2','#ffd93b','#ff3b30']
const TN=['Candy bomb','Spice grenade','Ghost pepper']
const RC={1:'255,95,162',2:'255,217,59',3:'255,59,48',4:'255,138,58',5:'180,138,255',6:'255,74,106',9:'255,200,120'}
const FONT='Georgia,"Times New Roman",serif'
const hash=(i,j)=>((i*73856093)^(j*19349663))>>>0
const mmss=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0')
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
const mkL=rgb=>{const c=el('canvas');c.width=c.height=128;const g=c.getContext('2d');const q=g.createRadialGradient(64,64,0,64,64,64);q.addColorStop(0,'rgba('+rgb+',1)');q.addColorStop(.35,'rgba('+rgb+',.7)');q.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=q;g.fillRect(0,0,128,128);return c}
const LS={w:mkL('255,255,255'),warm:mkL('255,150,50'),cyan:mkL('90,200,255'),red:mkL('255,60,50'),vio:mkL('170,110,255')}
const KIND={chapel:['#243a5c','#8fe3ff'],armory:['#4a2f1c','#ffb347'],well:['#1f3a3a','#8fe3ff'],house:['#3a2a4a','#ffb347']}
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
export function playTeamup({box,me,list,host,hostUid,send,onEnd}){
const names=new Map(list.map(m=>[m.u,m.n]))
const idx=new Map(list.map((m,i)=>[m.u,i]))
const sim=host?createSim(list):null
const cv=el('canvas','rs-cv'),cards=el('div','tu-cards'),endBox=el('div','tu-end')
const ctx=cv.getContext('2d')
const dk=el('canvas'),dctx=dk.getContext('2d')
box.classList.add('rs','tu-play')
box.append(cv,cards,endBox)
const lite=document.documentElement.classList.contains('perf')
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')
const A=buildArt(4)
Object.assign(A,terrorArt(3))
const CHEST=chestArt()
const fade=new Map()
const flashes=new Map()
const flashOf=s=>{let c=flashes.get(s);if(c)return c;c=el('canvas');c.width=s.c.width;c.height=s.c.height;const g=c.getContext('2d');g.drawImage(s.c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);flashes.set(s,c);return c}
let VW=800,VH=500,Wd=800,Hd=500,Z=2,D=1
const fit=()=>{D=Math.max(.5,Math.min(1.5,(devicePixelRatio||1)*[.6,.8,1,1.1,1.25][(window.__perf||{gpu:2}).gpu]));Wd=box.clientWidth||800;Hd=box.clientHeight||500;cv.width=Math.round(Wd*D);cv.height=Math.round(Hd*D);Z=Math.max(1.5,Math.min(2.6,Math.min(Wd,Hd)/270));VW=Wd/Z;VH=Hd/Z;const k=lite?.35:.5;dk.width=Math.round(Wd*k);dk.height=Math.round(Hd*k)}
fit()
const ro=new ResizeObserver(fit);ro.observe(box)
const V={pl:new Map(),en:new Map(),pj:new Map(),eb:new Map(),gm:[],hp:[],pd:[],pk:[],bars:{},dead:new Set(),opened:new Set(),bz:new Map(),tm:0,st:'run',kl:0,bo:0,sn:performance.now()}
const F=[],X=[],RG=[]
const L={keys:new Set(),mx:0,my:0,fire:false,aid:null,jid:null,jx:0,jy:0,jdx:0,jdy:0,slot:1,dash:0,dcd:0,dx:1,dy:0,sent:0,hold:0,tcd:0,walk:0,face:1,ang:0,offer:null,cx:0,cy:0}
let clock=0,shake=0,note='',noteT=0,done=false,raf=0,last=performance.now(),acc=0,snapAcc=0,muted=false,ac=null,mg=null,mt=0,pg=false,over=null,beep=0,hurtT=0,mus=0
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
V.tm=sn.tm;V.st=sn.st;V.kl=sn.kl;V.bars=Object.fromEntries(sn.b);V.bz=new Map(sn.z);V.bo=sn.bo;V.sn=t0
const seen=new Set()
for(const a of sn.p){
const[u,x,y,hp,max,s,ang,lv,xp,next,orb,ammo,wood,rv,inv,hit,off,ar,arm,abl,ward,spd]=a
seen.add(u)
let o=V.pl.get(u)
if(!o){o={u,x,y,tx:x,ty:y,face:1,walk:0,hit:0};V.pl.set(u,o)}
if(u===me&&Math.hypot(o.x-x,o.y-y)>140){o.x=x;o.y=y}
o.tx=x;o.ty=y;o.hp=hp;o.max=max;o.s=s;o.lv=lv;o.xp=xp;o.next=next;o.orb=orb;o.ammo=ammo;o.wood=wood;o.rv=rv;o.inv=inv;o.hurt=hit;o.ar=ar;o.arm=arm;o.ab=abl;o.ward=ward;o.spd=spd
if(u!==me)o.ang=ang
}
const ids=new Set()
for(const[id,k,x,y,hp,mx,ch,ph,sx,fl,st]of sn.e){
ids.add(id)
let o=V.en.get(id)
if(!o){o={id,k,x,y,r:ET[k].r,ph:ph/10,fl:0};V.en.set(id,o)}
o.tx=x;o.ty=y;o.hp=hp;o.mx=mx;o.ch=ch;o.sx=sx;o.st=st;if(fl)o.fl=.09
}
for(const k of[...V.en.keys()])if(!ids.has(k))V.en.delete(k)
const pj=new Set()
for(const[id,k,x,y,vx,vy,a]of sn.j){pj.add(id);let o=V.pj.get(id);if(!o){o={id,k};V.pj.set(id,o)};o.x=x;o.y=y;o.vx=vx;o.vy=vy;o.a=a;o.t=t0}
for(const k of[...V.pj.keys()])if(!pj.has(k))V.pj.delete(k)
const eb=new Set()
for(const[id,x,y,vx,vy]of sn.q){eb.add(id);let o=V.eb.get(id);if(!o){o={id,a:0};V.eb.set(id,o)};o.x=x;o.y=y;o.vx=vx;o.vy=vy;o.t=t0}
for(const k of[...V.eb.keys()])if(!eb.has(k))V.eb.delete(k)
V.gm=sn.g;V.hp=sn.l;V.pd=sn.d;V.pk=sn.c
for(const e of sn.v){
if(e[0]==='b')burst(e[1],e[2],e[3],Math.min(e[4],14))
else if(e[0]==='t')text(e[1],e[2],e[3],e[4],e[5])
else if(e[0]==='x'){RG.push({x:e[1],y:e[2],r:e[3],w:e[4],l:.5,m:.5});tone(e[4]===9?220:90,.3,.05,e[4]===9?'sine':'sawtooth',.5);if(e[4]<4)shake=Math.max(shake,6)}
else if(e[0]==='o'){V.opened.add(e[1]);tone(520,.15,.05,'triangle');tone(780,.25,.04,'triangle')}
else if(e[0]==='cd'){V.dead.add(e[1]);tone(70,.6,.09,'sawtooth',.4)}
else if(e[0]==='sh')shake=Math.max(shake,e[1])
else if(e[0]==='n'){say(e[1]);tone(70,1,.09,'sawtooth',.6)}
else if(e[0]==='hurt'&&e[1]===me){hurtT=.5;shake=Math.max(shake,7);tone(120,.16,.07,'sawtooth',.6)}
else if(e[0]==='down')say((names.get(e[1])||'A teammate')+' is down')
}
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
const m=Math.hypot(kx,ky)
if(m>1){kx/=m;ky/=m}
const spd=p.spd||150
const px=p.x,py=p.y
if(m>.05){p.x+=kx*spd*dt;p.y+=ky*spd*dt;L.dx=kx/m;L.dy=ky/m;if(Math.abs(kx)>.1)p.face=kx>0?1:-1}
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
const person=(o,self)=>{
if(o.s==='dead')return
const i=idx.get(o.u)||0
ctx.save()
ctx.strokeStyle=COL[i%3];ctx.globalAlpha=.8;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(o.x,o.y,15,5.5,0,0,TAU);ctx.stroke();ctx.globalAlpha=1
if(o.s==='down'){
ctx.translate(o.x,o.y-6);ctx.rotate(Math.PI/2);ctx.globalAlpha=.75
const s=A.player[0];ctx.drawImage(s.c,-s.ax,-s.ay+10,s.w,s.h)
ctx.restore()
ctx.save()
ctx.strokeStyle='rgba(8,4,14,.9)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(o.x,o.y-14,15,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,o.rv/2.5));ctx.stroke()
ctx.strokeStyle='#7dff9a';ctx.lineWidth=3;ctx.stroke()
ctx.restore()
return
}
ctx.restore()
if(o.inv&&Math.floor(clock*20)%2)ctx.globalAlpha=.5
const s=A.player[Math.floor(o.walk*9)%2]
shadow(o.x,o.y,13)
draw1(s,o.x,o.y,o.face,o.hurt&&Math.floor(clock*30)%2===0)
ctx.globalAlpha=1
if(!self)ctext(names.get(o.u)||'',o.x,o.y-s.h+8,'700 9px system-ui,sans-serif',COL[i%3],3)
}
const enemy=e=>{
const sp=A[e.k]
const s=sp[Math.floor(clock*6+e.ph)%2]
const bob=e.k==='wisp'||e.k==='bat'?Math.sin(clock*5+e.ph)*3-8:e.k==='reaper'||e.k==='wraith'?Math.sin(clock*3+e.ph)*3-6:0
shadow(e.x,e.y,e.r*1.05)
draw1(s,e.x,e.y+bob,e.sx,e.fl>0)
if(e.ch&&(e.k==='ghoul'||e.k==='lurker')){ctx.fillStyle='rgba(255,60,50,.35)';ctx.beginPath();ctx.arc(e.x,e.y-26,16,0,TAU);ctx.fill()}
if(e.st){ctx.strokeStyle='rgba(143,227,255,.9)';ctx.lineWidth=2;for(let i=0;i<3;i++){const a=clock*5+i*2.1;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*9,e.y-e.r*2-8+Math.sin(a)*3,2,0,TAU);ctx.stroke()}}
if(e.hp<e.mx&&e.k!=='boss'){const bw=e.r*2+4;ctx.fillStyle='rgba(8,4,14,.85)';ctx.fillRect(e.x-bw/2,e.y-e.r*2-30,bw,4);ctx.fillStyle='#ff5a4a';ctx.fillRect(e.x-bw/2+.5,e.y-e.r*2-29.5,(bw-1)*Math.max(0,e.hp/e.mx),3)}
if(e.k==='wisp')lights.push([e.x,e.y-12,42,.55,'cyan'])
else if(e.k==='reaper')lights.push([e.x,e.y-30,60,.5,'vio'])
else if(e.k==='wraith')lights.push([e.x,e.y-20,50,.5,'cyan'])
else if(e.k==='boss')lights.push([e.x,e.y-40,170,.9,'warm'])
}
const OSP={tower:['tower',1.3],crypt:['crypt',1.4],well:['well',1.5],shrine:['shrine',1.5]}
const world=(dt)=>{
const p=mine()
const sx=calm?0:(R()-.5)*shake,sy=calm?0:(R()-.5)*shake
const cx=(p?p.x:500)-VW/2+sx,cy=(p?p.y-8:560)-VH/2+sy
L.cx=cx-sx;L.cy=cy-sy
ctx.setTransform(D*Z,0,0,D*Z,-cx*D*Z,-cy*D*Z)
const G0=A.ground,Tt=G0.T
ctx.fillStyle='#120c20'
ctx.fillRect(cx,cy,VW,VH)
const x0=Math.floor(cx/Tt)*Tt,y0=Math.floor(cy/Tt)*Tt
for(let x=x0;x<cx+VW;x+=Tt)for(let y=y0;y<cy+VH;y+=Tt)ctx.drawImage(G0.c,x,y,Tt+.7,Tt+.7)
items.length=0;lights.length=0
const inb=p?buildingAt(p):null
for(const pp of V.pl.values())if(pp.s!=='dead')lights.push([pp.x,pp.y-10,pp.u===me?250:170,1,'w'])
const i0=Math.floor((cx-120)/CS),i1=Math.floor((cx+VW+120)/CS),j0=Math.floor((cy-160)/CS),j1=Math.floor((cy+VH+160)/CS)
const vc=[]
for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)vc.push(chunk(i,j))
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
else lights.push([bx,by,110,.7,'warm'])
}
for(const c of vc){
const o=c.o
if(o){
if(o.kind==='crypt'&&V.dead.has(o.id))items.push({y:o.y,x:o.x,s:A.skull})
else{
const sp=OSP[o.kind],cdn=(V.bz.get(o.id)||0)>0
items.push({y:o.y,x:o.x,s:A[sp[0]],sc:sp[1],dim:cdn})
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
for(let i=ci0;i<=ci1;i++)for(let j=cj0;j<=cj1;j++){
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
}
for(const g of V.gm)items.push({y:g[1],x:g[0],s:A.gem[g[2]>=8?1:0],bob:Math.sin(clock*4+g[0])*1.5-6,lt:'vio'})
for(const hp of V.hp)items.push({y:hp[1],x:hp[0],s:A.heart,bob:Math.sin(clock*5)*2-8,lt:'red'})
for(const k of V.pk)items.push({y:k[3],x:k[2],pk:k[1]})
for(const e of V.en.values())items.push({y:e.y,en:e})
for(const o of V.pl.values())items.push({y:o.y,pl:o})
items.sort((a,b)=>a.y-b.y)
for(const it of items){
const x=it.x,y=it.y
if(it.en){if(it.en.x<cx-90||it.en.x>cx+VW+90||it.en.y<cy-60||it.en.y>cy+VH+170)continue;enemy(it.en);continue}
if(it.pl){person(it.pl,it.pl.u===me);continue}
if(x<cx-110||x>cx+VW+110||y<cy-80||y>cy+VH+180)continue
if(it.pk){ctx.fillStyle='#140b1c';ctx.fillRect(x-8,y-14,16,12);ctx.fillStyle=it.pk==='a'?'#ff5fa2':'#a8794a';ctx.fillRect(x-6,y-12,12,8);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(x-6,y-12,12,2);lights.push([x,y-8,34,.6,it.pk==='a'?'red':'warm']);continue}
const s=it.s
const sc=it.sc||1
ctx.globalAlpha=it.dim?.45:1
ctx.drawImage(s.c,x-s.ax*sc,y-s.ay*sc+(it.bob||0),s.w*sc,s.h*sc)
ctx.globalAlpha=1
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
for(const b of V.eb.values()){ctx.save();ctx.translate(b.x,b.y-10);ctx.rotate(b.a);ctx.drawImage(A.ebone.c,-A.ebone.ax,-A.ebone.ay,A.ebone.w,A.ebone.h);ctx.restore()}
for(const b of V.pj.values()){
if(b.k===0){ctx.save();ctx.translate(b.x,b.y-12);ctx.rotate(b.a);ctx.drawImage(A.bullet.c,-A.bullet.ax,-A.bullet.ay,A.bullet.w,A.bullet.h);ctx.restore();lights.push([b.x,b.y-12,52,.8,'warm'])}
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
dctx.fillStyle='rgba(7,3,16,.84)'
dctx.fillRect(0,0,dk.width,dk.height)
dctx.globalCompositeOperation='destination-out'
for(const l of lights){
const r=l[2]*s,x=(l[0]-cx)*s,y=(l[1]-cy)*s
if(x<-r||y<-r||x>dk.width+r||y>dk.height+r)continue
dctx.globalAlpha=Math.min(1,l[3])
dctx.drawImage(LS.w,x-r,y-r,r*2,r*2)
}
dctx.globalAlpha=1
ctx.setTransform(1,0,0,1,0,0)
ctx.imageSmoothingEnabled=true
ctx.drawImage(dk,0,0,cv.width,cv.height)
if(!lite){
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
if(o&&(o.kind==='well'||o.kind==='shrine')&&Math.hypot(o.x-p.x,o.y-p.y)<80&&(V.bz.get(o.id)||0)>0)tip('Ready in '+Math.ceil(V.bz.get(o.id))+'s',o.x,o.y-50)
}
}
ctx.setTransform(D,0,0,D,0,0)
}
const vignette=()=>{
const g=ctx.createRadialGradient(Wd/2,Hd/2,Math.min(Wd,Hd)*.35,Wd/2,Hd/2,Math.max(Wd,Hd)*.75)
g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)')
ctx.fillStyle=g;ctx.fillRect(0,0,Wd,Hd)
if(hurtT>0){ctx.fillStyle='rgba(200,20,20,'+Math.min(.28,hurtT*.6)+')';ctx.fillRect(0,0,Wd,Hd)}
const p=mine()
if(p&&p.hp<p.max*.3&&p.s==='up'){ctx.fillStyle='rgba(180,0,0,'+(.1+Math.sin(clock*6)*.05)+')';ctx.fillRect(0,0,Wd,Hd)}
}
const MK={chapel:'#8fe3ff',house:'#ffb347',armory:'#ffb347',tower:'#ffe27a',crypt:'#4aff7a',well:'#6ec1ff',shrine:'#ff9d2e'}
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
for(const o of V.pl.values()){if(o.u===me||o.s==='dead')continue;ctx.fillStyle=COL[(idx.get(o.u)||0)%3];ctx.beginPath();ctx.arc(cx+(o.x-p.x)*sc,cy+(o.y-p.y)*sc,3.5,0,TAU);ctx.fill()}
ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,3,0,TAU);ctx.fill()
ctx.restore()
}
const hud=()=>{
const p=mine()
const pw=Math.min(290,Wd-32)
if(p){
plate(14,14,pw,88,12)
ctx.save();ctx.beginPath();ctx.arc(52,48,26,0,TAU);ctx.fillStyle='#1c0f2c';ctx.fill();ctx.strokeStyle=COL[(idx.get(me)||0)%3];ctx.lineWidth=2.5;ctx.stroke();ctx.clip()
const ps=A.player[0];ctx.drawImage(ps.c,26,24,ps.w*1.15,ps.h*1.15);ctx.restore()
bar(88,24,pw-88,18,p.hp/p.max,'#ff6a5a','#b01a2a')
ctext(Math.ceil(p.hp)+' / '+p.max,88+(pw-88)/2,33,'700 12px system-ui,sans-serif','#fff',3)
bar(88,46,pw-88,10,p.arm?p.ar/p.arm:0,'#a8c4e8','#4a6a94')
if(p.arm)ctext('Armor '+Math.ceil(p.ar),88+(pw-88)/2,51,'700 9px system-ui,sans-serif','#fff',3)
bar(88,60,pw-88,8,p.xp/p.next,'#c9a8ff','#6a3fd0')
ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#e8d6ff';ctx.fillText('Level '+p.lv,90,82)
ctx.textAlign='right';ctx.fillText(V.kl+' defeated',pw+4,82)
radar(p)
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
const tw=130
plate(Wd/2-tw/2,12,tw,44,12)
ctext(mmss(Math.max(0,WIN_AT-V.tm)),Wd/2,29,'800 26px '+FONT,'#ffe9c4',4)
ctx.font='700 10px system-ui,sans-serif';ctx.fillStyle='#b79ad6';ctx.textAlign='center';ctx.fillText('UNTIL DAWN',Wd/2,48)
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
ctx.fillStyle=cdv>0?'#3a2a40':inf[2];ctx.beginPath();ctx.arc(x+sw/2,by+sw*.4,10,0,TAU);ctx.fill();ctx.strokeStyle='#140b1c';ctx.lineWidth=2;ctx.stroke()
ctext(inf[1]==='SPACE'?'SPC':inf[1],x+sw-9,by+10,'800 10px system-ui,sans-serif','#8a72a6',3)
ctext(inf[0].split(' ').pop()+' '+lv,x+sw/2,by+sw-11,'700 10px system-ui,sans-serif','#e8d6ff',3)
if(cdv>0){ctx.save();ctx.beginPath();ctx.roundRect(x,by,sw,sw,10);ctx.clip();ctx.fillStyle='rgba(6,2,12,.7)';ctx.fillRect(x,by,sw,sw*Math.min(1,cdv/full));ctx.restore();ctext(Math.ceil(cdv)+'',x+sw/2,by+sw*.4,'800 15px system-ui,sans-serif','#fff',3)}
abBtn.push({act:b.act,x,y:by,w:sw,h:sw})
}
})
if(!coarse){
ctx.font='600 11px system-ui,sans-serif';ctx.textAlign='left';ctx.fillStyle='rgba(220,200,240,.55)'
ctx.fillText('WASD move   Click throw   E use   SPACE dash   M '+(muted?'unmute':'mute'),16,Hd-14)
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
if(snapAcc>=.1){snapAcc=0;const sn=sim.snap();apply(sn);send(sn);for(const o of sim.out.splice(0)){if(o.to===me){if(o.m.k==='lv')showCards(o.m.ids,o.m.lv);else{L.offer=null;cards.classList.remove('on')}}else send(o.m,o.to)}}
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
const t1=now
for(const b of V.pj.values()){const e=Math.min(.14,(t1-b.t)/1000);b.x+=b.vx*dt;b.y+=b.vy*dt}
for(const b of V.eb.values()){b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=dt*14}
for(let i=F.length-1;i>=0;i--){const f=F[i];f.l-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.94;f.vy*=.94;if(f.l<=0){F[i]=F[F.length-1];F.pop()}}
for(let i=X.length-1;i>=0;i--){const x=X[i];x.l-=dt;x.y-=dt*34;if(x.l<=0){X[i]=X[X.length-1];X.pop()}}
for(let i=RG.length-1;i>=0;i--){RG[i].l-=dt;if(RG[i].l<=0)RG.splice(i,1)}
shake=Math.max(0,shake-dt*30);noteT-=dt;hurtT-=dt
const p=mine()
ctx.setTransform(D,0,0,D,0,0)
const w=world(dt)
lighting(w.cx,w.cy)
overlays(w.cx,w.cy,w.inb)
vignette()
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
else if(d.k==='lv'&&f===hostUid)showCards(d.ids,d.lv)
else if(d.k==='lvdone'){L.offer=null;cards.classList.remove('on')}
},
left(u){
if(!host&&u===hostUid&&!done){V.st='lose';say('The host left the match');finish()}
},
stop(){
cancelAnimationFrame(raf);clearInterval(mus);ro.disconnect()
removeEventListener('keydown',kd);removeEventListener('keyup',ku)
try{ac&&ac.close()}catch{}
box.classList.remove('rs','tu-play')
box.replaceChildren()
}
}
}
