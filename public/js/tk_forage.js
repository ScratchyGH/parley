const TAU=Math.PI*2
const B=1800
const rnd=(a,b)=>a+Math.random()*(b-a)
const clamp=(v,a,b)=>v<a?a:v>b?b:v
function hs(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967296}
function mul(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ITEMS={
volley:{n:'Feather Volley',w:1,d:'Quills fly at the nearest foes'},
nova:{n:'Cinnamon Nova',w:1,d:'A spicy shockwave bursts outward'},
corn:{n:'Corn Cannon',w:1,d:'Piercing kernels blast through packs'},
pie:{n:'Pie Boomerang',w:1,d:'A flaky pie arcs out and returns'},
acorns:{n:'Acorn Orbit',w:1,d:'Acorns circle you and smack foes'},
gravy:{n:'Gravy Trail',w:1,d:'Sticky gravy slows and burns foes'},
heart:{n:'Drumstick',d:'+25 max HP and a bite to heal'},
sage:{n:'Sage Stuffing',d:'+10% move speed'},
cran:{n:'Cranberry Sauce',d:'+12% damage'},
spice:{n:'Pumpkin Spice',d:'8% faster weapons'},
leaf:{n:'Magnet Leaf',d:'+35% pickup range'},
plume:{n:'Thick Plumage',d:'10% less contact damage'},
moon:{n:'Harvest Moon',d:'+10% weapon area'},
heal:{n:'Roast Dinner',d:'Restore 40% of your health'}
}
const LEAF=['#d9641c','#c23a1b','#e8a21f','#a8481a','#8f2d14','#f0c23a']
const BASE={fox:{r:13,hp:14,sp:100,d:7,xp:1,m:1},crow:{r:11,hp:9,sp:125,d:5,xp:1,m:.7},boar:{r:20,hp:55,sp:62,d:13,xp:3,m:2.5},stag:{r:48,hp:1800,sp:70,d:22,xp:60,m:22}}
export default function launch(host,api){
const red=api.reduced(),lite=api.lite()
const cv=document.createElement('canvas')
for(const[k,v]of[['position','absolute'],['inset','0'],['width','100%'],['height','100%'],['display','block'],['touch-action','none']])cv.style.setProperty(k,v)
host.append(cv)
const g=cv.getContext('2d')
let W=0,H=0,dpr=1,z=1,vw=0,vh=0,vig=null
function size(){dpr=lite?1:Math.min(2,devicePixelRatio||1);W=host.clientWidth||innerWidth;H=host.clientHeight||innerHeight;cv.width=Math.floor(W*dpr);cv.height=Math.floor(H*dpr);z=clamp(Math.min(W,H)/700,.65,1.3);vw=W/z;vh=H/z;vig=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.hypot(W,H)*.6);vig.addColorStop(0,'rgba(20,8,0,0)');vig.addColorStop(1,'rgba(20,8,0,.6)')}
size()
const tiles=[]
function mkTile(seed,base,cols){
const c=document.createElement('canvas');c.width=c.height=64
const x=c.getContext('2d'),r=mul(seed)
x.fillStyle=base;x.fillRect(0,0,64,64)
for(let i=0;i<46;i++){x.fillStyle=cols[(r()*cols.length)|0];x.globalAlpha=.35+r()*.4;x.fillRect(r()*62,r()*62,1+r()*3,1+r()*2)}
x.globalAlpha=1
for(let i=0;i<9;i++){const px=r()*60+2,py=r()*60+4;x.strokeStyle=cols[(r()*cols.length)|0];x.lineWidth=1;x.beginPath();x.moveTo(px,py);x.lineTo(px+(r()-.5)*3,py-3-r()*3);x.stroke()}
return c
}
const gc=['#7b8a32','#9aa33c','#5c6e26','#b0a03a','#6f7f2c']
tiles.push(mkTile(11,'#667a2c',gc),mkTile(22,'#6d7f2e',gc),mkTile(33,'#627528',gc),mkTile(44,'#6b7a2b',gc),mkTile(55,'#7a5a2c',['#8c6a34','#5e4220','#a07a3c']))
const dark=mkTile(66,'#2a1a0c',['#3a2410','#1c1108','#4a2e14'])
let ac=null,nb=null,mgain=null,mute=false
function audio(){
if(ac){if(ac.state==='suspended')ac.resume();return}
try{
ac=new(window.AudioContext||window.webkitAudioContext)()
nb=ac.createBuffer(1,ac.sampleRate*.3,ac.sampleRate)
const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1
mgain=ac.createGain();mgain.gain.value=1;mgain.connect(ac.destination)
}catch{ac=null}
}
const lastS={}
function ok(n,gap){const now=performance.now();if(lastS[n]&&now-lastS[n]<gap)return false;lastS[n]=now;return ac&&!mute}
function tone(n,f,d,ty,v,sl,gap=45){
if(!ok(n,gap))return
const t0=ac.currentTime,o=ac.createOscillator(),gn=ac.createGain()
o.type=ty;o.frequency.setValueAtTime(f,t0);o.frequency.exponentialRampToValueAtTime(Math.max(25,f*sl),t0+d)
gn.gain.setValueAtTime(v,t0);gn.gain.exponentialRampToValueAtTime(.001,t0+d)
o.connect(gn);gn.connect(mgain);o.start(t0);o.stop(t0+d+.02)
}
function noise(n,d,v,f,gap=45){
if(!ok(n,gap))return
const t0=ac.currentTime,s=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain()
s.buffer=nb;fl.type='bandpass';fl.frequency.value=f
gn.gain.setValueAtTime(v,t0);gn.gain.exponentialRampToValueAtTime(.001,t0+d)
s.connect(fl);fl.connect(gn);gn.connect(mgain);s.start(t0);s.stop(t0+d)
}
const sfx={
shoot:()=>tone('shoot',620,.07,'square',.025,.45,60),
hit:()=>noise('hit',.06,.05,900,40),
kill:()=>tone('kill',320,.12,'triangle',.06,.4,50),
gem:()=>tone('gem',760,.07,'sine',.04,1.6,35),
nova:()=>tone('nova',180,.35,'sine',.12,4,200),
corn:()=>noise('corn',.12,.09,300,150),
pie:()=>tone('pie',300,.18,'triangle',.05,1.8,200),
hurt:()=>{tone('hurt',170,.25,'sawtooth',.1,.3,120);noise('hurt2',.15,.1,200,120)},
level:()=>{for(let i=0;i<4;i++)setTimeout(()=>tone('lv'+i,440*Math.pow(1.26,i),.18,'triangle',.08,1,0),i*90)},
pick:()=>tone('pick',520,.15,'square',.05,2,0),
roar:()=>{tone('roar',95,.7,'sawtooth',.14,.4,0);noise('roar2',.6,.08,160,0)},
over:()=>tone('over',300,.8,'sawtooth',.1,.2,0),
wave:()=>tone('wave',260,.4,'triangle',.07,1.5,0)
}
const scale=[220,261.6,293.7,329.6,392,440,523.3]
let noteT=0,barN=0
function music(dt){
if(!ac||mute)return
noteT-=dt
if(noteT>0)return
noteT=.5;barN++
tone('mn',scale[(Math.random()*scale.length)|0]*(Math.random()<.3?2:1),.9,'triangle',.022,.98,0)
if(barN%4===0)tone('mb',scale[[0,2,3,1][(barN/4|0)%4]]/2,1.8,'sine',.05,.98,0)
}
const kd=new Set()
const joy={on:false,id:-1,ox:0,oy:0,x:0,y:0}
let mx=-1,my=-1
let st='play',t=0,time=0,kills=0,lvl=1,xp=0,pend=0,bossN=0,bossK=0,nextBoss=180,nextElite=60,wave=1,spawnAcc=0,shk=0,hurtF=0,banner=null,opts=[],res=null,best=0,saved=false,paused=false,idc=0,raf=0,last=0
let p,en,pj,ep,gems,pa,dn,pools,rings,q,lv,cdt,orb,cam,btns
try{best=+localStorage.getItem('tk_forage_best')||0}catch{}
function init(){
p={x:0,y:0,hp:100,max:100,r:14,inv:0,fx:1,ph:0,dmg:1,cd:1,area:1,spdm:1,mag:70,arm:0,mv:false}
en=[];pj=[];ep=[];gems=[];pa=[];dn=[];pools=[];rings=[];q=[]
lv={volley:1};cdt={};orb=0;cam={x:-vw/2,y:-vh/2};btns=[]
st='play';t=0;time=0;kills=0;lvl=1;xp=0;pend=0;bossN=0;bossK=0;nextBoss=180;nextElite=60;wave=1;spawnAcc=0;shk=0;hurtF=0;res=null;saved=false;paused=false
banner={s:'Hold the clearing',s2:'Move with WASD, arrows or touch',t:4,m:4}
}
function need(){return 4+Math.floor(lvl*lvl*1.5+lvl*5)}
function lvOf(k){return lv[k]||0}
function recalc(){
p.dmg=1+.12*lvOf('cran');p.cd=Math.pow(.92,lvOf('spice'));p.area=1+.1*lvOf('moon');p.spdm=1+.1*lvOf('sage');p.mag=70*(1+.35*lvOf('leaf'));p.arm=lvOf('plume');p.max=100+25*lvOf('heart')
}
function scoreNow(){return kills*12+Math.floor(t)*4+(lvl-1)*80+bossK*1500}
function shake(n){if(!red)shk=Math.min(14,shk+n)}
function pr(x,y,vx,vy,l,s,c,gv=0){const cap=lite?220:600;if(pa.length<cap)pa.push({x,y,vx,vy,l,m:l,s,c,gv})}
function burst(x,y,n,c,sp,l,s,gv){n=red?n>>1:lite?n>>1:n;for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(sp*.3,sp);pr(x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(l*.5,l),s*rnd(.6,1.3),Array.isArray(c)?c[(Math.random()*c.length)|0]:c,gv)}}
function num(x,y,v,c,s){if(dn.length<40)dn.push({x:x+rnd(-8,8),y,v:Math.round(v),c,s,l:.7})}
function near(n,md){const a=[],m2=md*md;for(const e of en){const dx=e.x-p.x,dy=e.y-p.y,d=dx*dx+dy*dy;if(d<m2)a.push([d,e])}a.sort((u,v)=>u[0]-v[0]);return a.slice(0,n).map(u=>u[1])}
function mk(k,x,y,el){
const b=BASE[k],s=k==='stag'?(1+bossN*.9):1+t/90
const e={k,x,y,r:b.r,hp:b.hp*s,mx:0,sp:b.sp,d:b.d*(1+t/600),xp:b.xp,m:b.m,kx:0,ky:0,fl:0,sl:0,ph:rnd(0,TAU),el:!!el,oc:0,cs:rnd(1,3),tel:0,chg:0,cx:0,cy:0,sh:5,fx:1,i:idc++,dead:false}
if(el){e.hp*=7;e.r*=1.45;e.d*=1.4;e.xp*=8;e.m*=1.5;e.sp*=.95}
e.mx=e.hp
en.push(e);return e
}
function spawnPos(){
let a=rnd(0,TAU);const d=Math.hypot(vw,vh)/2+60
let x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d
if(Math.abs(x)>B-30||Math.abs(y)>B-30){a+=Math.PI;x=p.x+Math.cos(a)*d;y=p.y+Math.sin(a)*d}
return[clamp(x,-B+30,B-30),clamp(y,-B+30,B-30)]
}
function pickK(){
const r=Math.random()
if(t>90&&r<Math.min(.3,(t-90)/600))return'boar'
if(t>40&&r<.45)return'crow'
return'fox'
}
function drop(x,y,v){
const n=Math.min(10,Math.ceil(v/6))
for(let i=0;i<n;i++){
if(gems.length>380){addXp(v/n);continue}
gems.push({x:x+rnd(-14,14),y:y+rnd(-14,14),v:v/n,mg:false,sp:0,ph:rnd(0,TAU)})
}
}
function addXp(v){
xp+=v
while(xp>=need()){xp-=need();lvl++;pend++}
if(pend>0&&st==='play')openLevel()
}
function offer(){
const wc=Object.keys(lv).filter(k=>ITEMS[k].w).length
const pool=Object.keys(ITEMS).filter(k=>k!=='heal'&&lvOf(k)<5&&!(ITEMS[k].w&&!lvOf(k)&&wc>=4))
for(let i=pool.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[pool[i],pool[j]]=[pool[j],pool[i]]}
const o=pool.slice(0,3)
while(o.length<3)o.push('heal')
return o
}
function openLevel(){st='level';opts=offer();sfx.level()}
function choose(i){
const k=opts[i];if(!k)return
if(k==='heal')p.hp=Math.min(p.max,p.hp+p.max*.4)
else{lv[k]=lvOf(k)+1;recalc();if(k==='heart')p.hp=Math.min(p.max,p.hp+25)}
sfx.pick();pend--
if(pend>0)openLevel();else st='play'
}
function hitE(e,d,ox,oy,kb,col){
if(e.dead)return
const crit=Math.random()<.1
d*=crit?2:1
e.hp-=d;e.fl=.08
const a=Math.atan2(e.y-oy,e.x-ox),k=kb/e.m
e.kx+=Math.cos(a)*k;e.ky+=Math.sin(a)*k
num(e.x,e.y-e.r,d,crit?'#ffd23a':col||'#fff',crit?17:13)
burst(e.x,e.y,2,e.k==='crow'?'#222':'#e8a05a',90,.3,2.5,0)
sfx.hit()
if(e.hp<=0)kill(e)
}
function kill(e){
e.dead=true;kills++
burst(e.x,e.y,e.k==='stag'?60:e.el?24:8,[...LEAF,'#fff'],e.k==='stag'?320:180,.7,3.5,120)
sfx.kill()
drop(e.x,e.y,e.xp)
if(e.el||Math.random()<.015)gems.push({x:e.x,y:e.y,v:0,h:true,mg:false,sp:0,ph:0})
if(e.k==='stag'){bossK++;shake(10);banner={s:'The Great Stag has fallen',s2:'+1500 score',t:4,m:4};for(let i=0;i<3;i++)gems.push({x:e.x+rnd(-40,40),y:e.y+rnd(-40,40),v:0,h:true,mg:false,sp:0,ph:0})}
else if(e.el)shake(4)
}
function hurtP(d){
if(p.inv>0||st!=='play')return
d=Math.max(1,d*(1-.1*p.arm))
p.hp-=d;p.inv=.55;hurtF=.4;shake(6);sfx.hurt()
num(p.x,p.y-24,d,'#ff6a5a',16)
burst(p.x,p.y,10,['#d6332b','#7a4a26'],200,.5,3,0)
}
function aim(e,sp){const a=Math.atan2(e.y-p.y,e.x-p.x);return[Math.cos(a)*sp,Math.sin(a)*sp,a]}
const WF={
volley(L){
const tg=near(L+1,640);if(!tg.length)return 0
for(let i=0;i<L+1;i++){const e=tg[i%tg.length];q.push({t:i*.06,f:()=>{const[vx,vy,a]=aim(e,520),j=rnd(-.06,.06),c=Math.cos(a+j),s=Math.sin(a+j);pj.push({k:'f',x:p.x,y:p.y,vx:c*520,vy:s*520,r:6,d:(9+3*L)*p.dmg,l:1,pi:1+(L>=3?1:0)+(L>=5?1:0),hit:new Set(),a:a+j});sfx.shoot()}})}
return(1.15-.07*L)*p.cd
},
nova(L){
rings.push({r:0,max:(110+25*L)*p.area,d:(14+6*L)*p.dmg,hit:new Set(),t:0})
if(L>=4)q.push({t:.3,f:()=>rings.push({r:0,max:(110+25*L)*p.area*.8,d:(14+6*L)*p.dmg*.8,hit:new Set(),t:0})})
sfx.nova();shake(2)
return(3.4-.3*L)*p.cd
},
corn(L){
const tg=near(L>=5?3:L>=3?2:1,700);if(!tg.length)return 0
tg.forEach(e=>{const[vx,vy,a]=aim(e,270);pj.push({k:'c',x:p.x,y:p.y,vx,vy,r:12+L*2,d:(18+7*L)*p.dmg,l:1.7,pi:99,hit:new Set(),a})})
sfx.corn()
return(2.6-.2*L)*p.cd
},
pie(L){
const tg=near(1,700);const a0=tg.length?Math.atan2(tg[0].y-p.y,tg[0].x-p.x):rnd(0,TAU)
const n=L>=5?3:L>=3?2:1
for(let i=0;i<n;i++){const a=a0+i*TAU/n;pj.push({k:'p',x:p.x,y:p.y,vx:Math.cos(a)*340,vy:Math.sin(a)*340,r:16*p.area,d:(16+5*L)*p.dmg,dist:0,max:(250+30*L)*p.area,back:false,hit:new Set(),a:0})}
sfx.pie()
return(2.9-.2*L)*p.cd
}
}
function spawnWave(dt){
const rate=Math.min(12,1.4+t*.035)
spawnAcc+=rate*dt
const cap=lite?150:240
while(spawnAcc>=1&&en.length<cap){
const[x,y]=spawnPos(),k=pickK()
const n=k==='fox'?1+(t>60?(Math.random()*4)|0:0):1
for(let i=0;i<n;i++)mk(k,x+rnd(-30,30),y+rnd(-30,30),false)
spawnAcc-=n
}
if(spawnAcc>6)spawnAcc=6
}
function update(dt){
t+=dt;time+=dt
const w=Math.floor(t/30)+1
if(w!==wave){wave=w;banner={s:'Wave '+w,s2:'',t:2.2,m:2.2};sfx.wave()}
if(t>=nextElite&&t<nextBoss-5){nextElite+=60;if(!(Math.abs(t-nextBoss)<10)){const[x,y]=spawnPos();mk(pickK()==='fox'?'boar':'boar',x,y,true);banner={s:'An elite approaches',s2:'',t:2.5,m:2.5};sfx.wave()}}
if(t>=nextBoss){nextBoss+=300;const[x,y]=spawnPos();mk('stag',x,y,false);bossN++;banner={s:'The Great Stag awakens',s2:'',t:3.5,m:3.5};sfx.roar();shake(8)}
let ix=0,iy=0
if(kd.has('a')||kd.has('arrowleft'))ix--
if(kd.has('d')||kd.has('arrowright'))ix++
if(kd.has('w')||kd.has('arrowup'))iy--
if(kd.has('s')||kd.has('arrowdown'))iy++
if(joy.on){ix=joy.x;iy=joy.y}
const il=Math.hypot(ix,iy)
if(il>1){ix/=il;iy/=il}
const sp=150*p.spdm
p.mv=il>.05
p.x=clamp(p.x+ix*sp*dt,-B+20,B-20);p.y=clamp(p.y+iy*sp*dt,-B+20,B-20)
if(p.mv)p.ph+=dt*14
if(Math.abs(ix)>.1)p.fx=ix>0?1:-1
p.inv=Math.max(0,p.inv-dt);hurtF=Math.max(0,hurtF-dt)
for(const id of Object.keys(WF)){
if(!lv[id])continue
cdt[id]=(cdt[id]??.3)-dt
if(cdt[id]<=0)cdt[id]=WF[id](lv[id])||.2
}
for(let i=q.length-1;i>=0;i--){q[i].t-=dt;if(q[i].t<=0){q[i].f();q.splice(i,1)}}
if(lv.acorns){
orb+=dt*3.2
const L=lv.acorns,n=L+1,R=(80+8*L)*p.area
for(let i=0;i<n;i++){
const a=orb+i*TAU/n,ax=p.x+Math.cos(a)*R,ay=p.y+Math.sin(a)*R
for(const e of en)if(!e.dead&&e.oc<=time&&Math.hypot(e.x-ax,e.y-ay)<11+e.r){e.oc=time+.45;hitE(e,(7+3*L)*p.dmg,p.x,p.y,160,'#e0c07a')}
}
}
if(lv.gravy){
const L=lv.gravy
cdt.gp=(cdt.gp??0)-dt
if(cdt.gp<=0&&pools.length<30){cdt.gp=.45;pools.push({x:p.x,y:p.y,l:3+L*.5,m:3+L*.5,r:(30+5*L)*p.area,tk:0})}
for(const o of pools){
o.l-=dt;o.tk-=dt
const tick=o.tk<=0;if(tick)o.tk=.3
for(const e of en){if(e.dead||Math.hypot(e.x-o.x,e.y-o.y)>o.r+e.r)continue;e.sl=.25;if(tick)hitE(e,(6+3*L)*.3*p.dmg*3,o.x,o.y,0,'#c98a3a')}
}
pools=pools.filter(o=>o.l>0)
}
spawnWave(dt)
const grid=new Map()
for(const e of en){
if(e.dead)continue
e.fl=Math.max(0,e.fl-dt);e.sl=Math.max(0,e.sl-dt)
const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d
const s=e.sp*(e.sl>0?.55:1)
let mx=nx*s,my=ny*s
if(e.k==='crow'){const wv=Math.sin(time*3+e.ph)*.9;mx=(nx*Math.cos(wv)-ny*Math.sin(wv))*s;my=(nx*Math.sin(wv)+ny*Math.cos(wv))*s}
if(e.k==='boar'||e.k==='stag'){
const st2=e.k==='stag'
e.cs-=dt
if(e.tel>0){e.tel-=dt;mx=my=0;if(e.tel<=0){e.chg=st2?.9:.7;e.cx=nx;e.cy=ny}}
else if(e.chg>0){e.chg-=dt;const cs=st2?400:300;mx=e.cx*cs;my=e.cy*cs}
else if(e.cs<=0&&d<(st2?520:300)){e.tel=st2?.8:.55;e.cs=st2?4.5:3}
if(st2){
e.sh-=dt
if(e.sh<=0){
e.sh=6
const n=Math.min(24,12+bossN*4)
for(let i=0;i<n;i++){const a=i*TAU/n+e.ph;ep.push({x:e.x,y:e.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,r:7,d:10,l:4})}
shake(4);sfx.roar()
}
}
}
e.x+=(mx+e.kx)*dt;e.y+=(my+e.ky)*dt
const kf=Math.max(0,1-dt*9);e.kx*=kf;e.ky*=kf
if(Math.abs(mx)>5)e.fx=mx>0?1:-1
if(d>1300&&e.k!=='stag'){const[x,y]=spawnPos();e.x=x;e.y=y}
const gk=((e.x/40)|0)*4096+((e.y/40)|0)
let c=grid.get(gk);if(!c){c=[];grid.set(gk,c)};c.push(e)
if(d<e.r+p.r)hurtP(e.d)
}
for(const e of en){
if(e.dead||e.k==='stag')continue
const cx=(e.x/40)|0,cy=(e.y/40)|0
for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
const c=grid.get((cx+a)*4096+cy+b);if(!c)continue
for(const o of c){
if(o.i<=e.i||o.dead)continue
const dx=o.x-e.x,dy=o.y-e.y,d=Math.hypot(dx,dy)||.01,m=e.r+o.r
if(d<m*.85){const f=(m*.85-d)*.5/d;if(o.k!=='stag'){o.x+=dx*f;o.y+=dy*f}e.x-=dx*f;e.y-=dy*f}
}
}
}
for(const j of pj){
if(j.k==='p'){
j.a+=dt*14
if(!j.back){j.x+=j.vx*dt;j.y+=j.vy*dt;j.dist+=340*dt;if(j.dist>=j.max){j.back=true;j.hit.clear()}}
else{const dx=p.x-j.x,dy=p.y-j.y,d=Math.hypot(dx,dy)||1;j.x+=dx/d*400*dt;j.y+=dy/d*400*dt;if(d<24)j.dead=true}
}else{j.x+=j.vx*dt;j.y+=j.vy*dt;j.l-=dt;if(j.l<=0)j.dead=true;if(j.k==='c'&&Math.random()<.6)pr(j.x,j.y,rnd(-30,30),rnd(-30,30),.3,3,'#f5c831')}
if(j.dead)continue
for(const e of en){
if(e.dead||j.hit.has(e))continue
if(Math.hypot(e.x-j.x,e.y-j.y)<j.r+e.r){
j.hit.add(e);hitE(e,j.d,j.x-j.vx*.01,j.y-j.vy*.01,j.k==='c'?280:j.k==='p'?200:150,j.k==='c'?'#f5c831':null)
if(j.k==='f'){j.pi--;if(j.pi<0){j.dead=true;break}}
}
}
}
pj=pj.filter(j=>!j.dead)
for(const o of ep){
o.x+=o.vx*dt;o.y+=o.vy*dt;o.l-=dt
if(Math.hypot(o.x-p.x,o.y-p.y)<o.r+p.r-2){hurtP(o.d);o.l=0}
}
ep=ep.filter(o=>o.l>0)
for(const r of rings){
r.t+=dt
const k=clamp(r.t/.45,0,1)
r.r=r.max*(1-(1-k)*(1-k))
for(const e of en)if(!e.dead&&!r.hit.has(e)&&Math.hypot(e.x-p.x,e.y-p.y)<r.r+e.r){r.hit.add(e);hitE(e,r.d,p.x,p.y,320,'#e07a3a')}
if(r.t>=.45)r.dead=true
}
rings=rings.filter(r=>!r.dead)
en=en.filter(e=>!e.dead)
for(const o of gems){
o.ph+=dt*4
const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy)||1
if(!o.mg&&d<p.mag)o.mg=true
if(o.mg){o.sp=Math.min(900,o.sp+1600*dt);o.x+=dx/d*o.sp*dt;o.y+=dy/d*o.sp*dt}
if(d<18){
o.dead=true
if(o.h){p.hp=Math.min(p.max,p.hp+p.max*.25);num(p.x,p.y-26,p.max*.25,'#7be07a',15);sfx.pick()}
else{addXp(o.v);sfx.gem()}
}
}
gems=gems.filter(o=>!o.dead)
for(const o of pa){o.l-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=o.gv*dt;o.vx*=Math.max(0,1-dt*2)}
pa=pa.filter(o=>o.l>0)
for(const d of dn){d.l-=dt;d.y-=34*dt}
dn=dn.filter(d=>d.l>0)
if(banner){banner.t-=dt;if(banner.t<=0)banner=null}
shk=Math.max(0,shk-dt*28)
const k=Math.min(1,dt*8)
cam.x+=(p.x-vw/2-cam.x)*k;cam.y+=(p.y-vh/2-cam.y)*k
music(dt)
if(p.hp<=0)die()
}
function fxOnly(dt){
for(const o of pa){o.l-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=o.gv*dt}
pa=pa.filter(o=>o.l>0)
for(const d of dn){d.l-=dt;d.y-=34*dt}
dn=dn.filter(d=>d.l>0)
shk=Math.max(0,shk-dt*28)
}
function die(){
if(st==='over')return
st='over';sfx.over();shake(10)
burst(p.x,p.y,40,['#7a4a26','#c4621a','#e0a028'],260,1,4,200)
const sc=scoreNow()
try{if(sc>best){best=sc;localStorage.setItem('tk_forage_best',String(sc))}}catch{}
if(!saved){saved=true;api.finish(sc,t).then(d=>{res=d||{pars:0}})}
}
function ell(x,y,rx,ry,rot,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,TAU);g.fill()}
function shadow(x,y,r){ell(x,y+r*.7,r,r*.45,0,'rgba(0,0,0,.28)')}
function drawGround(){
const x0=Math.floor(cam.x/64)-1,y0=Math.floor(cam.y/64)-1,x1=Math.ceil((cam.x+vw)/64)+1,y1=Math.ceil((cam.y+vh)/64)+1
for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
const px=cx*64,py=cy*64,out=Math.abs(px+32)>B||Math.abs(py+32)>B
if(out){
g.drawImage(dark,px,py)
const v=hs(cx,cy)
ell(px+32+(v-.5)*20,py+32,44+v*14,40+v*12,0,LEAF[(v*40|0)%4]+'')
g.globalAlpha=.55;ell(px+26,py+24,30,26,0,'#1a0d05');g.globalAlpha=1
ell(px+36,py+28,22+v*10,18+v*8,0,LEAF[((v*97)|0)%LEAF.length])
continue
}
const v=hs(cx,cy)
g.drawImage(tiles[hs(cx*7,cy*3)>.94?4:(v*4)|0],px,py)
const d=hs(cx+999,cy-777)
if(d<.05){g.fillStyle='#e8dcc0';g.fillRect(px+30,py+34,3,8);ell(px+31,py+33,7,4,0,'#c23a1b');ell(px+29,py+32,2,1.2,0,'#fff')}
else if(d<.1){ell(px+32,py+40,10,6,0,'rgba(0,0,0,.25)');ell(px+32,py+36,10,7,0,'#7b7468');ell(px+29,py+34,5,3,0,'#a39c8d')}
else if(d<.22){for(let i=0;i<5;i++){const h=hs(cx*13+i,cy*5);ell(px+10+h*44,py+10+hs(cx,cy*9+i)*44,4,2.2,h*TAU,LEAF[(h*50|0)%LEAF.length])}}
else if(d<.25){ell(px+32,py+42,9,4,0,'rgba(0,0,0,.25)');ell(px+32,py+34,10,8,0,'#d9751c');ell(px+32,py+34,4,8,0,'#c4621a');g.fillStyle='#4a6a1c';g.fillRect(px+31,py+24,3,4)}
else if(d<.28){ell(px+32,py+42,12,5,0,'rgba(0,0,0,.25)');g.fillStyle='#5a3a1c';g.fillRect(px+22,py+30,20,12);ell(px+32,py+30,10,5,0,'#a07a45');ell(px+32,py+30,5,2.5,0,'#7a5a30')}
}
}
function drawPlayer(){
const x=p.x,y=p.y,b=p.mv?Math.sin(p.ph)*2:0
shadow(x,y+8,15)
if(p.inv>.3&&Math.floor(time*30)%2)g.globalAlpha=.5
g.save();g.translate(x,y+b*.5);g.scale(p.fx,1)
const tc=['#8a3b12','#c4621a','#e0a028','#6e2a0e','#c4621a','#e0a028','#8a3b12']
for(let i=0;i<7;i++){g.save();g.translate(-7,-6);g.rotate(Math.PI+(-.95+i*.32));ell(19,0,16,5.5,0,tc[i]);ell(24,0,6,3,0,'#f0d27a');g.restore()}
const leg=p.mv?Math.sin(p.ph)*4:0
g.strokeStyle='#d08a2a';g.lineWidth=2.5;g.beginPath();g.moveTo(-3,9);g.lineTo(-3+leg,18);g.moveTo(4,9);g.lineTo(4-leg,18);g.stroke()
ell(0,0,15,12,0,'#7a4a26');ell(3,3,10,7,0,'#9a6a3e');ell(-3,0,9,6,.3+Math.sin(p.ph)*.1,'#5a3418')
ell(10,-10,4,10,.2,'#7a4a26')
ell(14,-17,6.5,6,0,'#7fa6c9')
ell(17,-11,2.6,5,0,'#d6332b')
g.fillStyle='#f0b72a';g.beginPath();g.moveTo(19,-19);g.lineTo(26,-16);g.lineTo(19,-14);g.fill()
ell(15,-19,1.8,1.8,0,'#111')
g.fillStyle='#1b1b1b';g.fillRect(8,-30,13,9);g.fillRect(5,-22,19,3);g.fillStyle='#e0a028';g.fillRect(11,-27,7,4)
g.restore();g.globalAlpha=1
}
function drawEnemy(e){
const fl=e.fl>0,x=e.x,y=e.y,r=e.r
shadow(x,y+r*.4,r)
if(e.tel>0){g.strokeStyle='rgba(255,60,40,.7)';g.lineWidth=3;g.beginPath();g.arc(x,y,r+8+Math.sin(time*30)*3,0,TAU);g.stroke()}
g.save();g.translate(x,y);g.scale(e.fx,1)
if(e.k==='fox'){
ell(-r*.9,0,r*.9,r*.4,-.3,fl?'#fff':'#d9641c');ell(-r*1.5,-r*.2,r*.35,r*.3,0,fl?'#fff':'#f5ece0')
ell(0,0,r,r*.65,0,fl?'#fff':'#e8742a');ell(r*.2,r*.2,r*.6,r*.35,0,fl?'#fff':'#f5ece0')
ell(r*.85,-r*.2,r*.55,r*.45,0,fl?'#fff':'#e8742a')
g.fillStyle=fl?'#fff':'#c4501a';g.beginPath();g.moveTo(r*.6,-r*.55);g.lineTo(r*.75,-r*1.1);g.lineTo(r*1,-r*.55);g.fill()
ell(r*1.3,-r*.1,r*.18,r*.15,0,'#111');ell(r*.95,-r*.3,1.6,1.6,0,'#111')
}else if(e.k==='crow'){
const fl2=Math.sin(time*18+e.ph)*r*.8
ell(0,-r*.2,r*.9,r*.6,0,fl?'#fff':'#1d1a26')
g.fillStyle=fl?'#fff':'#2a2636';g.beginPath();g.moveTo(-r*.3,-r*.4);g.lineTo(-r*1.2,-r*.4-fl2);g.lineTo(r*.3,-r*.5);g.fill()
ell(r*.85,-r*.45,r*.45,r*.4,0,fl?'#fff':'#1d1a26')
g.fillStyle='#e0a028';g.beginPath();g.moveTo(r*1.2,-r*.55);g.lineTo(r*1.8,-r*.4);g.lineTo(r*1.2,-r*.3);g.fill()
ell(r*.95,-r*.55,1.6,1.6,0,'#ffd23a')
}else if(e.k==='boar'){
ell(0,0,r*1.1,r*.8,0,fl?'#fff':'#5a3a28');ell(-r*.2,-r*.5,r*.8,r*.3,0,fl?'#fff':'#3a2418')
ell(r*.95,r*.1,r*.55,r*.5,0,fl?'#fff':'#6a4632')
ell(r*1.4,r*.2,r*.25,r*.2,0,fl?'#fff':'#c98a8a')
g.strokeStyle='#f0e8d0';g.lineWidth=2.5;g.beginPath();g.moveTo(r*1.1,r*.4);g.quadraticCurveTo(r*1.4,r*.8,r*1.5,r*.4);g.stroke()
ell(r*.95,-r*.1,2.2,2.2,0,e.tel>0||e.chg>0?'#ff3a2a':'#111')
g.fillStyle=fl?'#fff':'#3a2418';g.fillRect(-r*.7,r*.5,3,r*.5);g.fillRect(r*.3,r*.5,3,r*.5)
}else{
ell(0,0,r*1.15,r*.75,0,fl?'#fff':'#6a4026');ell(-r*.3,-r*.2,r*.7,r*.4,0,fl?'#fff':'#7a4c2e')
g.fillStyle=fl?'#fff':'#5a3418';g.fillRect(-r*.8,r*.4,6,r*.7);g.fillRect(-r*.2,r*.4,6,r*.7);g.fillRect(r*.4,r*.4,6,r*.7)
ell(r*1,-r*.35,r*.5,r*.4,0,fl?'#fff':'#7a4c2e')
ell(r*1.4,-r*.2,r*.22,r*.16,0,'#111')
g.strokeStyle=fl?'#fff':'#d8c9a0';g.lineWidth=4;g.lineCap='round'
for(const s of[-1,1]){g.beginPath();g.moveTo(r*.9+s*3,-r*.7);g.lineTo(r*.7+s*r*.5,-r*1.5);g.lineTo(r*.3+s*r*.7,-r*2);g.moveTo(r*.7+s*r*.5,-r*1.5);g.lineTo(r*1.2+s*r*.5,-r*1.9);g.stroke()}
ell(r*1.1,-r*.4,3,3,0,e.tel>0||e.chg>0?'#ff3a2a':'#ffd23a')
}
g.restore()
if(e.el){g.strokeStyle='#ffd23a';g.lineWidth=2;g.setLineDash([6,5]);g.lineDashOffset=-time*20;g.beginPath();g.arc(x,y,r+7,0,TAU);g.stroke();g.setLineDash([])}
if(e.hp<e.mx&&e.k!=='stag'){const w=r*2;g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x-w/2,y-r-12,w,4);g.fillStyle=e.el?'#ffd23a':'#e0463a';g.fillRect(x-w/2,y-r-12,w*Math.max(0,e.hp/e.mx),4)}
}
function drawGem(o){
if(o.h){const b=Math.sin(o.ph)*2;ell(o.x,o.y+b,7,4.5,.6,'#f0e0c0');ell(o.x-3,o.y+b-2,5,3.5,.6,'#b8602a');ell(o.x+5,o.y+b+3,2,2,0,'#f0e0c0');return}
const b=Math.sin(o.ph)*1.5,c=o.v>=20?'#d6332b':o.v>=5?'#f5c831':'#9a5a24',s=3.5+Math.min(4,o.v*.3)
ell(o.x,o.y+3,s,s*.4,0,'rgba(0,0,0,.25)');ell(o.x,o.y+b,s,s*1.15,0,c);ell(o.x,o.y+b-s*.9,s*1.05,s*.55,0,'#5a3418');ell(o.x-s*.3,o.y+b-s*.2,s*.25,s*.4,0,'rgba(255,255,255,.5)')
}
function drawProj(j){
if(j.k==='f'){g.save();g.translate(j.x,j.y);g.rotate(j.a);ell(0,0,11,3.2,0,'#e8a21f');ell(-5,0,6,2.4,0,'#c23a1b');g.fillStyle='#fff';g.fillRect(6,-.8,5,1.6);g.restore()}
else if(j.k==='c'){ell(j.x,j.y,j.r,j.r*.75,j.a,'#f5c831');ell(j.x-j.r*.2,j.y-j.r*.2,j.r*.5,j.r*.3,j.a,'#fff3a0');g.strokeStyle='#8fb02a';g.lineWidth=3;g.beginPath();g.arc(j.x,j.y,j.r,j.a+2.2,j.a+4.1);g.stroke()}
else{g.save();g.translate(j.x,j.y);g.rotate(j.a);ell(0,0,j.r,j.r,0,'#c98a3a');ell(0,0,j.r*.8,j.r*.8,0,'#e8742a');g.strokeStyle='#f0d27a';g.lineWidth=1.5;g.beginPath();g.moveTo(-j.r*.7,0);g.lineTo(j.r*.7,0);g.moveTo(0,-j.r*.7);g.lineTo(0,j.r*.7);g.stroke();g.restore()}
}
const leaves=[]
for(let i=0;i<(lite?8:22);i++)leaves.push({x:Math.random(),y:Math.random(),s:rnd(.4,1),a:rnd(0,TAU),c:LEAF[i%LEAF.length]})
function drawLeaves(dt){
if(red)return
for(const o of leaves){
o.y+=dt*.05*o.s;o.x+=dt*.03*o.s+Math.sin(time*o.s+o.a)*dt*.01;o.a+=dt*o.s*2
if(o.y>1.05){o.y=-.05;o.x=Math.random()}
if(o.x>1.05)o.x=-.05
g.save();g.translate(o.x*W,o.y*H);g.rotate(o.a);ell(0,0,6*o.s+2,3*o.s+1,0,o.c);g.restore()
}
}
function txt(s,x,y,sz,c,al,wt){g.font=(wt||'700')+' '+sz+'px system-ui,sans-serif';g.textAlign=al||'left';g.textBaseline='middle';g.fillStyle='rgba(0,0,0,.6)';g.fillText(s,x+1.5,y+1.5);g.fillStyle=c;g.fillText(s,x,y)}
function rr(x,y,w,h,r){g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)}
function btn(x,y,w,h,label,fn,pri){
const hv=mx>=x&&mx<=x+w&&my>=y&&my<=y+h
rr(x,y,w,h,10);g.fillStyle=pri?(hv?'#f0a23a':'#d9841c'):(hv?'#4a3020':'#33200f');g.fill()
g.strokeStyle=pri?'#ffd98a':'#7a5a38';g.lineWidth=2;g.stroke()
txt(label,x+w/2,y+h/2,Math.min(18,h*.42),pri?'#2a1404':'#f5e6c8','center')
btns.push({x,y,w,h,fn})
}
function ico(id,x,y,s){
g.save();g.translate(x,y);g.scale(s/40,s/40)
if(id==='volley'){for(let i=-1;i<=1;i++){g.save();g.rotate(i*.45-.6);ell(2,0,15,3.5,0,i?'#e8a21f':'#c23a1b');g.restore()}}
else if(id==='nova'){g.strokeStyle='#e07a3a';g.lineWidth=4;g.beginPath();g.arc(0,0,14,0,TAU);g.stroke();g.strokeStyle='#f0c23a';g.lineWidth=2;g.beginPath();g.arc(0,0,7,0,TAU);g.stroke()}
else if(id==='corn'){ell(0,0,8,15,.5,'#f5c831');ell(-6,4,6,12,.5,'#6a9a2a');ell(-2,-5,2,4,.5,'#fff3a0')}
else if(id==='pie'){ell(0,0,15,15,0,'#c98a3a');ell(0,0,11,11,0,'#e8742a');g.strokeStyle='#f0d27a';g.lineWidth=2;g.beginPath();g.moveTo(-10,0);g.lineTo(10,0);g.moveTo(0,-10);g.lineTo(0,10);g.stroke()}
else if(id==='acorns'){ell(0,2,8,10,0,'#b8782a');ell(0,-6,10,6,0,'#5a3418');g.fillStyle='#5a3418';g.fillRect(-1,-14,2,5)}
else if(id==='gravy'){ell(0,3,16,10,0,'#7a4a1c');ell(-3,0,8,5,0,'#a8702c');ell(6,-4,3,2,0,'#d8a050')}
else if(id==='heart'){ell(-3,2,11,9,-.6,'#b8602a');ell(5,-8,3,3,0,'#f0e0c0');ell(9,-5,3,3,0,'#f0e0c0')}
else if(id==='sage'){ell(0,0,8,15,.6,'#7a9a4a');g.strokeStyle='#4a6a2a';g.lineWidth=1.5;g.beginPath();g.moveTo(-8,9);g.lineTo(8,-9);g.stroke()}
else if(id==='cran'){ell(-6,3,8,8,0,'#c4203a');ell(6,5,7,7,0,'#d6334a');ell(0,-6,6,6,0,'#a41a30')}
else if(id==='spice'){ell(0,2,12,11,0,'#d9751c');ell(0,2,4,11,0,'#b8601a');g.fillStyle='#4a6a1c';g.fillRect(-1,-10,3,6)}
else if(id==='leaf'){ell(0,0,8,15,-.5,'#e8a21f');g.strokeStyle='#8f2d14';g.lineWidth=2;g.beginPath();g.arc(0,2,13,Math.PI*.1,Math.PI*.9);g.stroke()}
else if(id==='plume'){ell(0,0,7,16,.3,'#4a8ac9');ell(0,0,3,15,.3,'#9ad0f0')}
else if(id==='moon'){ell(0,0,14,14,0,'#f0e0a0');ell(6,-3,12,12,0,'#2a1a0c')}
else{ell(0,6,16,5,0,'#d8d0c0');ell(0,0,11,8,0,'#a8501a');ell(-3,-3,5,3,0,'#e08a3a')}
g.restore()
}
function drawHud(){
const bw=Math.min(240,W*.4)
g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,0,W,10)
g.fillStyle='#7be07a';g.fillRect(0,0,W*clamp(xp/need(),0,1),10)
g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,0,W*clamp(xp/need(),0,1),4)
rr(14,22,bw,18,9);g.fillStyle='rgba(0,0,0,.6)';g.fill()
rr(14,22,Math.max(0,bw*clamp(p.hp/p.max,0,1)),18,9);g.fillStyle=p.hp/p.max<.3?'#e0463a':'#d6532b';g.fill()
txt(Math.ceil(Math.max(0,p.hp))+' / '+p.max,14+bw/2,31,12,'#fff','center')
txt('Lv '+lvl,14,56,16,'#ffd98a')
txt(kills+' foes',14,76,13,'#f5e6c8')
const m=Math.floor(t/60),s=Math.floor(t%60)
txt(m+':'+(s<10?'0':'')+s,W/2,28,22,'#fff','center')
txt('Wave '+wave,W/2,50,13,'#ffd98a','center')
const boss=en.find(e=>e.k==='stag')
if(boss){
const w2=Math.min(420,W*.6),x=W/2-w2/2
rr(x,66,w2,12,6);g.fillStyle='rgba(0,0,0,.6)';g.fill()
rr(x,66,Math.max(0,w2*boss.hp/boss.mx),12,6);g.fillStyle='#b8302a';g.fill()
txt('Great Stag',W/2,92,13,'#ffd0c0','center')
}
const ks=Object.keys(lv)
let ox=14
const oy=H-48
for(const k of ks){
rr(ox,oy,40,40,8);g.fillStyle='rgba(0,0,0,.55)';g.fill()
g.strokeStyle=ITEMS[k].w?'#e0a028':'#7a9a4a';g.lineWidth=2;g.stroke()
ico(k,ox+20,oy+19,30)
for(let i=0;i<lv[k];i++){g.fillStyle='#ffd98a';g.fillRect(ox+4+i*7,oy+34,5,3)}
ox+=46
if(ox>W-60)break
}
btn(W-150,14,62,34,'Pause',()=>{paused=true;st='pause'},false)
if(banner){
const a=clamp(Math.min(banner.t,banner.m-banner.t)*3,0,1);g.globalAlpha=a
txt(banner.s,W/2,H*.28,Math.min(40,W*.07),'#ffe0a0','center','800')
if(banner.s2)txt(banner.s2,W/2,H*.28+34,15,'#f5e6c8','center')
g.globalAlpha=1
}
if(joy.on){
g.globalAlpha=.4;g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.arc(joy.ox,joy.oy,50,0,TAU);g.stroke()
g.fillStyle='#fff';g.beginPath();g.arc(joy.ox+joy.x*50,joy.oy+joy.y*50,22,0,TAU);g.fill();g.globalAlpha=1
}
}
function panel(h){
g.fillStyle='rgba(10,4,0,.72)';g.fillRect(0,0,W,H)
}
function drawLevel(){
panel()
txt('Level '+lvl+'!',W/2,Math.max(40,H*.14),Math.min(44,W*.08),'#ffe0a0','center','800')
txt('Choose a harvest upgrade',W/2,Math.max(40,H*.14)+36,15,'#f5e6c8','center')
const narrow=W<640,cw=narrow?Math.min(W-40,420):Math.min(250,(W-80)/3),ch=narrow?96:270,gap=16
const tw=narrow?cw:cw*3+gap*2,x0=(W-tw)/2,y0=narrow?H*.14+70:H/2-ch/2+20
opts.forEach((k,i)=>{
const x=narrow?x0:x0+i*(cw+gap),y=narrow?y0+i*(ch+10):y0
const hv=mx>=x&&mx<=x+cw&&my>=y&&my<=y+ch
rr(x,hv?y-4:y,cw,ch,14);g.fillStyle=hv?'#4a2e16':'#33200f';g.fill()
g.strokeStyle=ITEMS[k].w?'#e0a028':k==='heal'?'#7be07a':'#7a9a4a';g.lineWidth=hv?4:2;g.stroke()
const L=lvOf(k),yy=hv?y-4:y
if(narrow){ico(k,x+44,yy+ch/2,50);txt(ITEMS[k].n,x+84,yy+28,17,'#ffe0a0');txt(L?'Lv '+L+' to '+(L+1):ITEMS[k].w?'New weapon':'New boost',x+84,yy+50,12,'#e0a028');txt(ITEMS[k].d,x+84,yy+72,12,'#f5e6c8')}
else{ico(k,x+cw/2,yy+62,76);txt(ITEMS[k].n,x+cw/2,yy+130,19,'#ffe0a0','center');txt(k==='heal'?'Instant':L?'Lv '+L+' to '+(L+1):ITEMS[k].w?'New weapon':'New boost',x+cw/2,yy+158,13,'#e0a028','center');txt(ITEMS[k].d,x+cw/2,yy+196,12,'#f5e6c8','center');txt(String(i+1),x+cw/2,yy+ch-22,14,'#8a6a44','center')}
btns.push({x,y,w:cw,h:ch,fn:()=>choose(i)})
})
}
function drawPause(){
panel()
txt('Paused',W/2,H*.3,Math.min(48,W*.09),'#ffe0a0','center','800')
btn(W/2-110,H*.4,220,50,'Resume',()=>{paused=false;st='play'},true)
btn(W/2-110,H*.4+64,220,50,mute?'Sound off':'Sound on',()=>{mute=!mute},false)
btn(W/2-110,H*.4+128,220,50,'Quit',()=>api.close(),false)
}
function drawOver(){
panel()
const y=Math.max(50,H*.16)
txt('The thicket is quiet',W/2,y,Math.min(42,W*.08),'#ffe0a0','center','800')
const sc=scoreNow(),m=Math.floor(t/60),s=Math.floor(t%60)
const rows=[['Time',m+':'+(s<10?'0':'')+s],['Foes defeated',String(kills)],['Level reached',String(lvl)],['Great Stags felled',String(bossK)],['Score',String(sc)],['Best',String(Math.max(best,sc))]]
rows.forEach((r,i)=>{txt(r[0],W/2-130,y+60+i*30,16,'#f5e6c8');txt(r[1],W/2+130,y+60+i*30,18,'#ffd98a','right')})
txt(res?(res.pars>0?'+'+res.pars+' Pars earned':'No Pars this run'):'Saving your score',W/2,y+60+rows.length*30+14,18,res&&res.pars>0?'#7be07a':'#f5e6c8','center')
const by=y+60+rows.length*30+44
btn(W/2-110,by,220,50,'Play again',()=>init(),true)
btn(W/2-110,by+62,220,50,'Exit',()=>api.close(),false)
}
function draw(dt){
btns=[]
g.setTransform(dpr,0,0,dpr,0,0)
g.fillStyle='#2a1a0c';g.fillRect(0,0,W,H)
const ox=!red&&shk>0?rnd(-shk,shk):0,oy=!red&&shk>0?rnd(-shk,shk):0
g.save();g.scale(z,z);g.translate(-cam.x+ox,-cam.y+oy)
drawGround()
for(const o of pools){g.globalAlpha=Math.min(1,o.l/o.m*1.5)*.8;ell(o.x,o.y,o.r,o.r*.7,0,'#6a3e18');ell(o.x-o.r*.2,o.y-o.r*.1,o.r*.5,o.r*.3,0,'#9a6428');g.globalAlpha=1}
for(const o of gems)drawGem(o)
const vis=en.filter(e=>e.x>cam.x-80&&e.x<cam.x+vw+80&&e.y>cam.y-80&&e.y<cam.y+vh+80)
vis.sort((a,b)=>a.y-b.y)
let pd=false
for(const e of vis){if(!pd&&e.y>p.y){drawPlayer();pd=true}drawEnemy(e)}
if(!pd&&st!=='over')drawPlayer()
if(lv.acorns){const L=lv.acorns,n=L+1,R=(80+8*L)*p.area;for(let i=0;i<n;i++){const a=orb+i*TAU/n,ax=p.x+Math.cos(a)*R,ay=p.y+Math.sin(a)*R;ell(ax,ay+3,7,3,0,'rgba(0,0,0,.25)');ell(ax,ay,6,7.5,0,'#b8782a');ell(ax,ay-5,7,4,0,'#5a3418')}}
for(const j of pj)drawProj(j)
for(const o of ep){ell(o.x,o.y,o.r,o.r,0,'#e8c8a0');ell(o.x,o.y,o.r*.55,o.r*.55,0,'#b8302a')}
for(const r of rings){const a=1-r.t/.45;g.globalAlpha=a*.85;g.strokeStyle='#e07a3a';g.lineWidth=10*a+2;g.beginPath();g.arc(p.x,p.y,r.r,0,TAU);g.stroke();g.strokeStyle='#f0c23a';g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,r.r*.94,0,TAU);g.stroke();g.globalAlpha=1}
for(const o of pa){g.globalAlpha=clamp(o.l/o.m,0,1);g.fillStyle=o.c;g.fillRect(o.x-o.s/2,o.y-o.s/2,o.s,o.s)}
g.globalAlpha=1
for(const d of dn){g.globalAlpha=clamp(d.l/.3,0,1);g.font='800 '+d.s+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#000';g.fillText(d.v,d.x+1,d.y+1);g.fillStyle=d.c;g.fillText(d.v,d.x,d.y)}
g.globalAlpha=1
g.restore()
g.fillStyle=vig;g.fillRect(0,0,W,H)
if(hurtF>0&&!red){g.fillStyle='rgba(200,20,10,'+(hurtF*.4)+')';g.fillRect(0,0,W,H)}
if(p.hp/p.max<.3&&st==='play'&&!red){g.fillStyle='rgba(160,10,0,'+(.1+Math.sin(time*6)*.05)+')';g.fillRect(0,0,W,H)}
drawLeaves(dt)
drawHud()
if(st==='level')drawLevel()
else if(st==='pause')drawPause()
else if(st==='over')drawOver()
}
function frame(ts){
raf=requestAnimationFrame(frame)
const dt=Math.min(.05,(ts-last)/1000||.016);last=ts
if(st==='play')update(dt)
else if(st==='over'){time+=dt;fxOnly(dt)}
draw(dt)
}
function pos(e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('pointerdown',e=>{
audio()
const[x,y]=pos(e);mx=x;my=y
for(const b of btns)if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return}
if(st==='play'&&!joy.on){joy.on=true;joy.id=e.pointerId;joy.ox=x;joy.oy=y;joy.x=0;joy.y=0;try{cv.setPointerCapture(e.pointerId)}catch{}}
})
cv.addEventListener('pointermove',e=>{
const[x,y]=pos(e);mx=x;my=y
if(joy.on&&e.pointerId===joy.id){const dx=x-joy.ox,dy=y-joy.oy,d=Math.hypot(dx,dy),k=d>50?50/d:1;joy.x=dx*k/50;joy.y=dy*k/50}
})
function endJoy(e){if(e.pointerId===joy.id){joy.on=false;joy.x=0;joy.y=0}}
cv.addEventListener('pointerup',endJoy)
cv.addEventListener('pointercancel',endJoy)
function key(e){
const k=e.key.toLowerCase()
audio()
if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(k))e.preventDefault()
kd.add(k)
if(st==='level'&&['1','2','3'].includes(k))choose(+k-1)
else if(k==='p'){if(st==='play'){paused=true;st='pause'}else if(st==='pause'){paused=false;st='play'}}
else if(k==='m')mute=!mute
else if(k==='enter'&&st==='over')init()
}
function keyUp(e){kd.delete(e.key.toLowerCase())}
function pauseNow(){kd.clear();joy.on=false;if(st==='play'){paused=true;st='pause'}}
function vis(){if(document.hidden)pauseNow()}
addEventListener('keydown',key)
addEventListener('keyup',keyUp)
addEventListener('resize',size)
addEventListener('blur',pauseNow)
document.addEventListener('visibilitychange',vis)
init();recalc()
raf=requestAnimationFrame(ts=>{last=ts;frame(ts)})
return()=>{
cancelAnimationFrame(raf)
removeEventListener('keydown',key);removeEventListener('keyup',keyUp);removeEventListener('resize',size);removeEventListener('blur',pauseNow)
document.removeEventListener('visibilitychange',vis)
if(st!=='over'&&!saved&&t>=15){saved=true;api.finish(scoreNow(),t)}
try{ac&&ac.close()}catch{}
cv.remove()
}
}
