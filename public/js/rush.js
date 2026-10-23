import{buildArt}from'./rushart.js'
const TAU=Math.PI*2
const R=Math.random
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
let cssOn=false
const TYPES={
wisp:{r:9,hp:8,sp:112,dmg:5,xp:1,spr:'wisp'},
ghoul:{r:14,hp:38,sp:52,dmg:9,xp:3,spr:'ghoul'},
bone:{r:12,hp:22,sp:72,dmg:7,xp:2,spr:'bone'},
reaper:{r:20,hp:210,sp:62,dmg:16,xp:14,spr:'reaper'},
boss:{r:56,hp:2600,sp:46,dmg:24,xp:120,spr:'boss'}
}
const UPS=[
['dmg','Hotter Wax','Flames hit 25% harder',6,p=>{p.dmg*=1.25}],
['rate','Quick Hands','Fire 18% faster',6,p=>{p.rate*=.82}],
['count','Twin Flames','One more flame each volley',3,p=>{p.count++}],
['pierce','Sharp Seeds','Flames pass through one more enemy',3,p=>{p.pierce++}],
['spd','Fleet Boots','Move 12% faster',5,p=>{p.spd*=1.12}],
['mag','Candy Magnet','Pick up from 60% farther away',4,p=>{p.mag*=1.6}],
['orb','Orbit Lanterns','One more lantern circles you',5,p=>{p.orb++}],
['nova','Hollow Nova','A ring of light bursts every few seconds',4,p=>{p.nova=p.nova?p.nova*.78:5.5}],
['hp','Thick Rind','+30 max health and heal 30',5,p=>{p.max+=30;p.hp=Math.min(p.max,p.hp+30)}],
['reg','Warm Soup','Regain 1 health every second',3,p=>{p.reg+=1}]
]
const BOSS_AT=[90,200,300]
const WIN_AT=360
const hash=(i,j)=>((i*73856093)^(j*19349663))>>>0
const FONT='Georgia,"Times New Roman",serif'
const UI='700 14px system-ui,-apple-system,Segoe UI,sans-serif'
export function playRush(mount,done){
if(!cssOn){cssOn=true;const l=el('link');l.rel='stylesheet';l.href='/rush.css';document.head.append(l)}
const box=el('div','rs'),cv=el('canvas','rs-cv'),cards=el('div','rs-cards')
box.append(cv,cards)
mount.append(box)
const ctx=cv.getContext('2d')
const dk=el('canvas'),dctx=dk.getContext('2d')
const lite=document.documentElement.classList.contains('perf')
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')
let W=800,H=500,Z=2,D=1,VW=400,VH=250
const fit=()=>{D=Math.min(1.5,devicePixelRatio||1);W=box.clientWidth||800;H=box.clientHeight||500;cv.width=Math.round(W*D);cv.height=Math.round(H*D);Z=Math.max(1.5,Math.min(2.6,Math.min(W,H)/270));VW=W/Z;VH=H/Z;const k=lite?.35:.5;dk.width=Math.round(W*k);dk.height=Math.round(H*k)}
fit()
const ro=new ResizeObserver(fit)
ro.observe(box)
const A=buildArt(4)
const LS=(()=>{const mkL=(rgb)=>{const c=el('canvas');c.width=c.height=128;const g=c.getContext('2d');const q=g.createRadialGradient(64,64,0,64,64,64);q.addColorStop(0,'rgba('+rgb+',1)');q.addColorStop(.35,'rgba('+rgb+',.7)');q.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=q;g.fillRect(0,0,128,128);return c};return{w:mkL('255,255,255'),warm:mkL('255,150,50'),cyan:mkL('90,200,255'),red:mkL('255,60,50'),vio:mkL('170,110,255')}})()
const flashOf=s=>{if(s.fc)return s.fc;const c=el('canvas');c.width=s.c.width;c.height=s.c.height;const g=c.getContext('2d');g.drawImage(s.c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);s.fc=c;return c}
const P={x:0,y:0,hp:100,max:100,spd:150,dmg:10,rate:.62,count:1,pierce:0,mag:72,orb:0,nova:0,reg:0,lv:1,xp:0,next:6,cd:0,nv:0,hit:0,fx:1,fy:0,face:1,up:{},walk:0}
const E=[],B=[],EB=[],G=[],F=[],X=[],HP=[]
let t=0,kills=0,acc=0,bi=0,phase='menu',paused=false,raf=0,last=0,shake=0,boss=null,orbA=0,note='',noteT=0,id=0,endT=0,won=false,jx=0,jy=0,jo=null,beep=0,clock=0,novaFx=0,cur=[],muted=false,best=0
try{best=Number(localStorage.getItem('parley.rush.best'))||0}catch{}
const prev=best
const keys={}
let ac=null,mg=null,mt=0
const audio=()=>{try{if(!ac){ac=new AudioContext();mg=ac.createGain();mg.gain.value=muted?0:1;mg.connect(ac.destination)}if(ac.state==='suspended')ac.resume()}catch{}}
const tone=(f,d,v,ty,sl)=>{try{if(!ac||muted)return;const o=ac.createOscillator(),g=ac.createGain();o.type=ty||'square';o.frequency.value=f;if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*sl),ac.currentTime+d);g.gain.value=v||.03;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(g);g.connect(mg);o.start();o.stop(ac.currentTime+d)}catch{}}
const NOTES=[110,130.8,146.8,164.8,196,220,261.6,293.7]
const music=()=>{
try{
if(!ac||muted)return
const f=NOTES[Math.floor(R()*NOTES.length)]*(R()<.3?2:1)
const o=ac.createOscillator(),g=ac.createGain()
o.type='sine';o.frequency.value=f
g.gain.value=.05;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+1.8)
o.connect(g);g.connect(mg);o.start();o.stop(ac.currentTime+1.9)
if(mt++%8===0){const b=ac.createOscillator(),bg=ac.createGain();b.type='triangle';b.frequency.value=55;bg.gain.value=.07;bg.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+4);b.connect(bg);bg.connect(mg);b.start();b.stop(ac.currentTime+4.1)}
}catch{}
}
const mus=setInterval(music,520)
const burst=(x,y,n,c,s)=>{for(let i=0;i<n&&F.length<300;i++){const a=R()*TAU,v=(.3+R())*(s||90);F.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.3+R()*.35,m:.65,c,s:1.4+R()*2.2})}}
const text=(x,y,v,c,big)=>{if(X.length<40)X.push({x:x+(R()-.5)*10,y,v,c,big,l:.8,m:.8})}
const say=s=>{note=s;noteT=2.8}
const spawnE=(k,x,y,sc)=>{const T=TYPES[k];E.push({id:++id,k,x,y,r:T.r,hp:T.hp*sc,mx:T.hp*sc,sp:T.sp*(.92+R()*.16),dmg:T.dmg,xp:T.xp,fl:0,oc:0,ph:R()*6,ch:0,bs:R()*2,sx:1,kx:0,ky:0})}
const ring=()=>{const a=R()*TAU,d=Math.max(VW,VH)*.62+30;return[P.x+Math.cos(a)*d,P.y+Math.sin(a)*d]}
const pick=()=>{
const sc=1+t/130,p=R()
let k='wisp'
if(t>120&&p<.045)k='reaper'
else if(t>28&&p<.34)k='ghoul'
else if(t>8&&p<.66)k='bone'
const[x,y]=ring()
spawnE(k,x,y,sc)
}
const kill=e=>{
kills++
const i=E.indexOf(e)
if(i>=0){E[i]=E[E.length-1];E.pop()}
if(e.k==='boss'){
boss=null
for(let j=0;j<18;j++)G.push({x:e.x+(R()-.5)*100,y:e.y+(R()-.5)*100,v:8})
HP.push({x:e.x,y:e.y})
burst(e.x,e.y,70,'#ffb347',240)
shake=16
tone(90,.7,.08,'sawtooth',.5)
if(bi>=BOSS_AT.length){won=true;finish()}
}else{
G.push({x:e.x,y:e.y,v:e.xp})
if(R()<.035)HP.push({x:e.x+8,y:e.y})
burst(e.x,e.y,8,e.k==='wisp'?'#8fe3ff':e.k==='ghoul'?'#8fc060':'#e8e2cc',120)
}
}
const openCards=()=>{
const pool=UPS.filter(u=>(P.up[u[0]]||0)<u[3])
if(!pool.length){P.hp=Math.min(P.max,P.hp+25);return}
paused=true
const ch=[]
while(ch.length<3&&pool.length)ch.push(pool.splice(Math.floor(R()*pool.length),1)[0])
cards.textContent=''
cards.append(el('h3','rs-lv','Level '+P.lv))
const row=el('div','rs-row')
ch.forEach((u,i)=>{
const b=el('button','rs-card')
b.type='button'
b.append(el('i','rs-k',String(i+1)),el('b',null,u[1]),el('span',null,u[2]),el('em',null,'Rank '+((P.up[u[0]]||0)+1)+' of '+u[3]))
b.addEventListener('click',()=>take(u))
row.append(b)
})
cards.append(row)
cards.classList.add('on')
cur=ch
tone(660,.12,.05,'triangle')
tone(880,.2,.04,'triangle')
}
const take=u=>{
if(!paused||!cards.classList.contains('on'))return
u[4](P)
P.up[u[0]]=(P.up[u[0]]||0)+1
cards.classList.remove('on')
paused=false
cur=[]
}
const gain=v=>{
P.xp+=v
while(P.xp>=P.next){P.xp-=P.next;P.next=Math.floor(P.next*1.32+4);P.lv++;if(!paused)openCards()}
}
const finish=()=>{
if(phase==='end')return
phase='end'
endT=0
P.hit=0
try{if(Math.floor(t)>best){best=Math.floor(t);localStorage.setItem('parley.rush.best',String(best))}}catch{}
if(won){tone(523,.3,.06,'triangle');setTimeout(()=>tone(659,.3,.06,'triangle'),150);setTimeout(()=>tone(784,.5,.06,'triangle'),300)}else tone(110,.9,.08,'sawtooth',.4)
}
const fire=()=>{
let n=null,bd=420*420
for(const e of E){const dx=e.x-P.x,dy=e.y-P.y,d=dx*dx+dy*dy;if(d<bd){bd=d;n=e}}
if(!n)return false
const a=Math.atan2(n.y-P.y,n.x-P.x),sp=P.count>1?.17:0
for(let i=0;i<P.count;i++){
const o=a+(i-(P.count-1)/2)*sp
B.push({x:P.x,y:P.y-12,vx:Math.cos(o)*430,vy:Math.sin(o)*430,a:o,l:1.05,pr:P.pierce,d:P.dmg,h:[]})
}
return true
}
const hurt=d=>{
if(P.hit>0)return
P.hp-=d
P.hit=.5
shake=Math.max(shake,7)
burst(P.x,P.y-10,12,'#ff4a3a',150)
text(P.x,P.y-40,'-'+Math.round(d),'#ff6a5a')
tone(120,.16,.07,'sawtooth',.6)
if(P.hp<=0){P.hp=0;finish()}
}
const step=dt=>{
t+=dt
let kx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+jx
let ky=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+jy
const m=Math.hypot(kx,ky)
if(m>1){kx/=m;ky/=m}
if(m>.05){P.x+=kx*P.spd*dt;P.y+=ky*P.spd*dt;P.fx=kx;P.fy=ky;P.walk+=dt;if(Math.abs(kx)>.1)P.face=kx>0?1:-1}
P.hit-=dt
if(P.reg)P.hp=Math.min(P.max,P.hp+P.reg*dt)
acc+=dt*Math.min(7,.65+t/40)
while(acc>=1){acc--;if(E.length<70+Math.min(190,t*.62))pick()}
if(bi<BOSS_AT.length&&t>=BOSS_AT[bi]&&!boss){
const[x,y]=ring()
spawnE('boss',x,y,1+bi*.85)
boss=E[E.length-1]
boss.name=['The Hollowgrin','The Hollowgrin Returns','The Last Harvest'][bi]
bi++
say(boss.name)
tone(70,1,.09,'sawtooth',.6)
}
if(t>=WIN_AT&&phase==='play'){won=true;finish()}
P.cd-=dt
if(P.cd<=0&&fire()){P.cd=P.rate;if(beep<=0){tone(540,.06,.014,'square',.6);beep=.07}}
beep-=dt
orbA+=dt*2.7
novaFx=Math.max(0,novaFx-dt)
if(P.nova){P.nv-=dt;if(P.nv<=0){P.nv=P.nova;novaFx=.5;F.push({x:P.x,y:P.y,ring:1,r:10,l:.5,m:.5});for(const e of E){const dx=e.x-P.x,dy=e.y-P.y;if(dx*dx+dy*dy<210*210){e.hp-=P.dmg*2.6;e.fl=.1;text(e.x,e.y-e.r-20,String(Math.round(P.dmg*2.6)),'#ffd27a');const d=Math.hypot(dx,dy)||1;e.kx+=dx/d*260;e.ky+=dy/d*260}}tone(220,.3,.05,'sine',.5)}}
for(let i=E.length-1;i>=0;i--){
const e=E[i]
if(e.hp<=0){kill(e);continue}
const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1
let sp=e.sp
if(e.k==='boss'){
e.bs+=dt
if(e.bs>2.8){e.bs=0;for(let j=0;j<3;j++)spawnE('wisp',e.x+(R()-.5)*100,e.y+(R()-.5)*100,1+t/130)}
e.ch+=dt
if(e.ch>6)e.ch=-1
if(e.ch<0){sp*=3.2;e.ch-=dt;if(e.ch<-1.1)e.ch=0}
}else if(e.k==='ghoul'){
e.ch+=dt
if(e.ch>3.6+e.ph*.2){e.ch=-.45}
if(e.ch<0){sp*=3.4;e.ch+=dt*2}
}else if(e.k==='bone'){
e.bs+=dt
if(d<300&&d>110){sp*=.35;if(e.bs>2.4){e.bs=0;const a=Math.atan2(dy,dx);EB.push({x:e.x,y:e.y-10,vx:Math.cos(a)*170,vy:Math.sin(a)*170,l:3,a:0,d:e.dmg})}}
}
const w=Math.sin(t*3+e.ph)*.3
e.x+=(dx/d+(-dy/d)*w)*sp*dt+e.kx*dt
e.y+=(dy/d+(dx/d)*w)*sp*dt+e.ky*dt
e.kx*=.86;e.ky*=.86
if(Math.abs(dx)>3)e.sx=dx>0?1:-1
e.fl-=dt;e.oc-=dt
if(d<e.r+9)hurt(e.dmg)
}
for(let i=0;i<E.length;i++){
const a=E[i]
for(let j=i+1;j<E.length&&j<i+9;j++){
const b=E[j],dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,mm=a.r+b.r
if(d<mm*mm&&d>.01){const q=Math.sqrt(d),f=(mm-q)*.5;if(a.k!=='boss'){a.x-=dx/q*f;a.y-=dy/q*f}if(b.k!=='boss'){b.x+=dx/q*f;b.y+=dy/q*f}}
}
}
for(let i=B.length-1;i>=0;i--){
const b=B[i]
b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt
if(F.length<300&&R()<.5)F.push({x:b.x,y:b.y,vx:0,vy:0,l:.18,m:.18,c:'#ffb347',s:2})
let dead=b.l<=0
if(!dead)for(const e of E){
const dx=e.x-b.x,dy=e.y-(b.y+8),mm=e.r+5
if(dx*dx+dy*dy<mm*mm&&b.h.indexOf(e.id)<0){
const crit=R()<.12,dm=b.d*(crit?2:1)
e.hp-=dm;e.fl=.09;b.h.push(e.id);burst(b.x,b.y,3,'#ffd27a',90)
e.kx+=b.vx*.12;e.ky+=b.vy*.12
text(e.x,e.y-e.r-24,String(Math.round(dm)),crit?'#ffe27a':'#ffffff',crit)
if(b.pr--<=0){dead=true;break}
}
}
if(dead){B[i]=B[B.length-1];B.pop()}
}
for(let i=EB.length-1;i>=0;i--){
const b=EB[i]
b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;b.a+=dt*14
const dx=P.x-b.x,dy=P.y-10-b.y
if(dx*dx+dy*dy<14*14){hurt(b.d);b.l=0}
if(b.l<=0){EB[i]=EB[EB.length-1];EB.pop()}
}
for(let i=0;i<P.orb;i++){
const a=orbA+i*TAU/P.orb,x=P.x+Math.cos(a)*66,y=P.y-8+Math.sin(a)*66
for(const e of E){
const dx=e.x-x,dy=e.y-8-y,mm=e.r+12
if(e.oc<=0&&dx*dx+dy*dy<mm*mm){const dm=P.dmg*.9;e.hp-=dm;e.oc=.35;e.fl=.08;burst(x,y,2,'#ffb347',70);text(e.x,e.y-e.r-24,String(Math.round(dm)),'#ffcf8a')}
}
}
for(let i=G.length-1;i>=0;i--){
const g=G[i],dx=P.x-g.x,dy=P.y-g.y,d=Math.hypot(dx,dy)
if(d<P.mag||g.pull){g.pull=1;const s=260+(1-Math.min(1,d/500))*300;g.x+=dx/(d||1)*s*dt;g.y+=dy/(d||1)*s*dt}
if(d<14){gain(g.v);G[i]=G[G.length-1];G.pop();if(beep<=0){tone(900+Math.min(600,P.xp*20),.05,.015,'triangle');beep=.06}}
}
for(let i=HP.length-1;i>=0;i--){
const h=HP[i],dx=P.x-h.x,dy=P.y-h.y
if(dx*dx+dy*dy<22*22){P.hp=Math.min(P.max,P.hp+18);text(P.x,P.y-44,'+18','#7dff9a');burst(h.x,h.y,10,'#ff7a8a',110);tone(700,.12,.04,'triangle');HP[i]=HP[HP.length-1];HP.pop()}
}
for(let i=F.length-1;i>=0;i--){
const f=F[i]
f.l-=dt
if(f.ring)f.r+=dt*440
else{f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.94;f.vy*=.94}
if(f.l<=0){F[i]=F[F.length-1];F.pop()}
}
for(let i=X.length-1;i>=0;i--){const x=X[i];x.l-=dt;x.y-=dt*34;if(x.l<=0){X[i]=X[X.length-1];X.pop()}}
shake=Math.max(0,shake-dt*30)
noteT-=dt
}
const draw1=(s,x,y,flip,fl)=>{
const img=fl?flashOf(s):s.c
if(flip<0){ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(img,-s.ax,-s.ay,s.w,s.h);ctx.restore()}
else ctx.drawImage(img,x-s.ax,y-s.ay,s.w,s.h)
}
const shadow=(x,y,rx)=>{ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(x,y,rx,rx*.34,0,0,TAU);ctx.fill()}
const plate=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle='rgba(14,8,22,.82)';ctx.fill();ctx.strokeStyle='#5a3a7a';ctx.lineWidth=2;ctx.stroke()}
const bar=(x,y,w,h,v,c0,c1)=>{
ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fillStyle='#0a0612';ctx.fill()
if(v>0){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.clip();const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,c0);g.addColorStop(1,c1);ctx.fillStyle=g;ctx.fillRect(x,y,w*Math.min(1,v),h);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x,y,w*Math.min(1,v),h*.4);ctx.restore()}
ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.strokeStyle='#2a1a3a';ctx.lineWidth=1.5;ctx.stroke()
}
const ctext=(s,x,y,font,c,sc)=>{ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=sc||4;ctx.strokeStyle='rgba(8,4,14,.9)';ctx.strokeText(s,x,y);ctx.fillStyle=c;ctx.fillText(s,x,y)}
const mmss=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0')
let items=[],lights=[]
const world=()=>{
const sx=calm?0:(R()-.5)*shake,sy=calm?0:(R()-.5)*shake
const cx=P.x-VW/2+sx,cy=P.y-8-VH/2+sy
ctx.setTransform(D*Z,0,0,D*Z,-cx*D*Z,-cy*D*Z)
const G0=A.ground,T=G0.T
ctx.fillStyle='#1a1430'
ctx.fillRect(cx,cy,VW,VH)
const x0=Math.floor(cx/T)*T,y0=Math.floor(cy/T)*T
for(let x=x0;x<cx+VW;x+=T)for(let y=y0;y<cy+VH;y+=T)ctx.drawImage(G0.c,x,y,T+.7,T+.7)
items.length=0;lights.length=0
lights.push([P.x,P.y-10,250,1,'w'])
const cs=150,i0=Math.floor((cx-120)/cs),i1=Math.floor((cx+VW+120)/cs),j0=Math.floor((cy-120)/cs),j1=Math.floor((cy+VH+160)/cs)
for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
if(Math.abs(i)<1&&Math.abs(j)<1)continue
const h=hash(i,j),r=(h%1000)/1000,x=i*cs+((h>>10)%100)*.9+20,y=j*cs+((h>>17)%100)*.9+30
if(r<.28)items.push({y,k:'tomb',x,s:A.tomb[h%3]})
else if(r<.34)items.push({y,k:'tree',x,s:A.tree})
else if(r<.385){items.push({y,k:'lamp',x,s:A.lamp});lights.push([x,y-70,190,.9+Math.sin(clock*7+i*3.1)*.06,'warm'])}
else if(r<.43)items.push({y,k:'patch',x,s:A.patch})
else if(r<.47)items.push({y,k:'fence',x,s:A.fence})
else if(r<.52)items.push({y,k:'skull',x,s:A.skull})
}
for(const g of G)items.push({y:g.y,k:'gem',x:g.x,s:A.gem[Math.floor(clock*6+g.x)%2*0+(g.v>=8?1:0)],g})
for(const h of HP)items.push({y:h.y,k:'heart',x:h.x,s:A.heart})
for(const e of E){const s=A[TYPES[e.k].spr][Math.floor(clock*6+e.ph)%2];items.push({y:e.y,k:'en',x:e.x,s,e})}
items.push({y:P.y,k:'pl'})
items.sort((a,b)=>a.y-b.y)
for(const it of items){
const x=it.x,y=it.y
if(x<cx-90||x>cx+VW+90||y<cy-60||y>cy+VH+170){if(it.k!=='pl')continue}
if(it.k==='en'){
const e=it.e,s=it.s,bob=e.k==='wisp'?Math.sin(clock*5+e.ph)*3-8:e.k==='reaper'?Math.sin(clock*3+e.ph)*3-6:0
shadow(e.x,e.y,e.r*1.05)
draw1(s,e.x,e.y+bob,e.sx,e.fl>0)
if(e.ch<0&&e.k==='ghoul'){ctx.fillStyle='rgba(255,60,50,.35)';ctx.beginPath();ctx.arc(e.x,e.y-26,16,0,TAU);ctx.fill()}
if(e.hp<e.mx&&e.k!=='boss'){const bw=e.r*2+4;ctx.fillStyle='rgba(8,4,14,.85)';ctx.fillRect(e.x-bw/2,e.y-TYPES[e.k].r*2-30,bw,4);ctx.fillStyle='#ff5a4a';ctx.fillRect(e.x-bw/2+.5,e.y-TYPES[e.k].r*2-29.5,(bw-1)*Math.max(0,e.hp/e.mx),3)}
if(e.k==='wisp')lights.push([e.x,e.y-12,42,.55,'cyan'])
else if(e.k==='reaper')lights.push([e.x,e.y-30,60,.5,'vio'])
else if(e.k==='boss')lights.push([e.x,e.y-40,170,.9,'warm'])
}else if(it.k==='pl'){
const s=A.player[Math.floor(P.walk*9)%2]
shadow(P.x,P.y,13)
const blink=P.hit>0&&Math.floor(t*30)%2===0
draw1(s,P.x,P.y,P.face,blink)
}else if(it.k==='gem'){
const bob=Math.sin(clock*4+it.g.x)*1.5
ctx.drawImage(it.s.c,x-it.s.ax,y-it.s.ay-6+bob,it.s.w,it.s.h)
lights.push([x,y-6,34,.7,'vio'])
}else if(it.k==='heart'){
ctx.drawImage(it.s.c,x-it.s.ax,y-it.s.ay-8+Math.sin(clock*5)*2,it.s.w,it.s.h)
lights.push([x,y-8,40,.7,'red'])
}else{
ctx.drawImage(it.s.c,x-it.s.ax,y-it.s.ay,it.s.w,it.s.h)
}
}
for(const b of EB){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);ctx.drawImage(A.ebone.c,-A.ebone.ax,-A.ebone.ay,A.ebone.w,A.ebone.h);ctx.restore()}
for(const b of B){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);ctx.drawImage(A.bullet.c,-A.bullet.ax,-A.bullet.ay,A.bullet.w,A.bullet.h);ctx.restore();lights.push([b.x,b.y,52,.8,'warm'])}
for(let i=0;i<P.orb;i++){
const a=orbA+i*TAU/P.orb,x=P.x+Math.cos(a)*66,y=P.y-8+Math.sin(a)*66
ctx.drawImage(A.lantern.c,x-A.lantern.ax,y-A.lantern.ay,A.lantern.w,A.lantern.h)
lights.push([x,y,72,.9,'warm'])
}
for(const f of F){
if(f.ring){ctx.strokeStyle='rgba(255,200,120,'+(f.l/f.m)+')';ctx.lineWidth=6;ctx.beginPath();ctx.arc(f.x,f.y-8,f.r,0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,240,200,'+(f.l/f.m*.8)+')';ctx.lineWidth=2;ctx.stroke();lights.push([f.x,f.y-8,f.r+30,Math.min(1,f.l/f.m*1.5),'warm'])}
else{ctx.globalAlpha=Math.max(0,f.l/f.m);ctx.fillStyle=f.c;ctx.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s);ctx.globalAlpha=1}
}
if(novaFx>0)lights.push([P.x,P.y-8,300,novaFx*1.6,'w'])
return{cx,cy}
}
const lighting=(cx,cy)=>{
const kx=dk.width/W,s=Z*kx
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
const overlays=cx=>{
ctx.setTransform(D*Z,0,0,D*Z,-cx.cx*D*Z,-cx.cy*D*Z)
for(const x of X){ctx.globalAlpha=Math.min(1,x.l*2);ctx.font=(x.big?'800 15px ':'700 11px ')+'system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(10,4,16,.95)';ctx.strokeText(x.v,x.x,x.y);ctx.fillStyle=x.c;ctx.fillText(x.v,x.x,x.y)}
ctx.globalAlpha=1
ctx.setTransform(D,0,0,D,0,0)
}
const vignette=()=>{
const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75)
g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)')
ctx.fillStyle=g;ctx.fillRect(0,0,W,H)
if(P.hit>0){ctx.fillStyle='rgba(200,20,20,'+Math.min(.28,P.hit*.6)+')';ctx.fillRect(0,0,W,H)}
if(P.hp<P.max*.3&&phase==='play'){const a=.1+Math.sin(clock*6)*.05;ctx.fillStyle='rgba(180,0,0,'+a+')';ctx.fillRect(0,0,W,H)}
}
const hud=()=>{
const pw=Math.min(280,W-32)
plate(14,14,pw,70,12)
ctx.save();ctx.beginPath();ctx.arc(52,50,26,0,TAU);ctx.fillStyle='#1c0f2c';ctx.fill();ctx.strokeStyle='#ff9a2e';ctx.lineWidth=2.5;ctx.stroke();ctx.clip()
const ps=A.player[0];ctx.drawImage(ps.c,26,26,ps.w*1.15,ps.h*1.15);ctx.restore()
bar(88,24,pw-88,18,P.hp/P.max,'#ff6a5a','#b01a2a')
ctext(Math.ceil(P.hp)+' / '+P.max,88+(pw-88)/2,33,'700 12px system-ui,sans-serif','#fff',3)
bar(88,48,pw-88,10,P.xp/P.next,'#c9a8ff','#6a3fd0')
ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#e8d6ff';ctx.fillText('Level '+P.lv,90,70)
ctx.textAlign='right';ctx.fillText(kills+' defeated',pw+4,70)
const tw=130
plate(W/2-tw/2,12,tw,44,12)
ctext(mmss(Math.max(0,WIN_AT-t)),W/2,29,'800 26px '+FONT,'#ffe9c4',4)
ctx.font='700 10px system-ui,sans-serif';ctx.fillStyle='#b79ad6';ctx.textAlign='center';ctx.fillText('UNTIL DAWN',W/2,48)
if(boss&&boss.hp>0){
const bw=Math.min(480,W-40),bx=W/2-bw/2,by=H-54
ctext(boss.name,W/2,by-12,'800 18px '+FONT,'#ffb347',4)
bar(bx,by,bw,16,Math.max(0,boss.hp/boss.mx),'#ff9a3a','#b8400a')
}
if(noteT>0){ctx.globalAlpha=Math.min(1,noteT);ctext(note,W/2,H*.2,'800 '+Math.min(46,W/12)+'px '+FONT,'#ffb347',6);ctx.globalAlpha=1}
ctx.font='600 11px system-ui,sans-serif';ctx.textAlign='left';ctx.fillStyle='rgba(220,200,240,.55)';ctx.fillText('M '+(muted?'unmute':'mute')+'   P pause',16,H-16)
}
const menu=()=>{
ctx.fillStyle='rgba(6,3,12,.55)';ctx.fillRect(0,0,W,H)
const cy=H*.22
ctx.save();ctx.globalAlpha=.9;ctx.shadowColor='#ff7a1a';ctx.shadowBlur=40;ctext('GOURD RUSH',W/2,cy,'900 '+Math.min(110,W/6.2)+'px '+FONT,'#ffb347',8);ctx.restore()
ctext('Survive until dawn',W/2,cy+Math.min(70,W/10),'italic 700 '+Math.min(26,W/28)+'px '+FONT,'#e8d6ff',4)
const s=A.player[Math.floor(clock*3)%2],sc=2.6
ctx.shadowColor='rgba(0,0,0,0)'
ctx.drawImage(s.c,W/2-s.ax*sc,H*.66-s.ay*sc+Math.sin(clock*2)*3,s.w*sc,s.h*sc)
const ly=H*.77
ctext('Move  WASD or arrow keys   |   Touch: drag',W/2,ly,'600 15px system-ui,sans-serif','#e8d6ff',3)
ctext('Your lantern fires on its own. Collect gems, pick upgrades, outlast the Hollowgrin.',W/2,ly+24,'600 14px system-ui,sans-serif','#c9b3e6',3)
const a=.6+Math.sin(clock*4)*.4
ctx.globalAlpha=a;ctext('Press SPACE or tap to begin',W/2,ly+62,'800 20px '+FONT,'#ffb347',5);ctx.globalAlpha=1
if(best)ctext('Best  '+mmss(best),W/2,ly+92,'700 13px system-ui,sans-serif','#9a86b3',3)
}
const endScreen=()=>{
const a=Math.min(.86,endT*.9)
ctx.fillStyle='rgba(4,2,8,'+a+')';ctx.fillRect(0,0,W,H)
ctx.globalAlpha=Math.min(1,endT*1.4)
ctx.save();ctx.shadowColor=won?'#ffcf6a':'#ff3b30';ctx.shadowBlur=36
ctext(won?'DAWN BREAKS':'CONSUMED',W/2,H*.3,'900 '+Math.min(90,W/7)+'px '+FONT,won?'#ffe9a8':'#ff6a5a',7);ctx.restore()
const pw=Math.min(380,W-40),px=W/2-pw/2,py=H*.42
plate(px,py,pw,130,14)
const row=(i,l,v)=>{ctx.font='600 15px system-ui,sans-serif';ctx.textAlign='left';ctx.fillStyle='#b79ad6';ctx.fillText(l,px+24,py+30+i*30);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText(v,px+pw-24,py+30+i*30)}
row(0,'Time survived',mmss(t))
row(1,'Enemies defeated',String(kills))
row(2,'Level reached',String(P.lv))
if(Math.floor(t)>prev)ctext('New best time',W/2,py+152,'800 14px system-ui,sans-serif','#7dff9a',3)
if(endT>1){ctx.globalAlpha=.6+Math.sin(clock*4)*.4;ctext('Press SPACE or tap to continue',W/2,H*.86,'800 18px '+FONT,'#ffb347',5)}
ctx.globalAlpha=1
}
const draw=()=>{
ctx.setTransform(D,0,0,D,0,0)
const cx=world()
lighting(cx.cx,cx.cy)
overlays(cx)
vignette()
if(phase==='menu')menu()
else{hud();if(phase==='end')endScreen();if(paused&&!cards.classList.contains('on')){ctx.fillStyle='rgba(4,2,8,.6)';ctx.fillRect(0,0,W,H);ctext('PAUSED',W/2,H/2,'900 60px '+FONT,'#ffe9c4',6);ctext('Press P to resume',W/2,H/2+50,'700 16px system-ui,sans-serif','#c9b3e6',3)}}
}
const loop=now=>{
raf=requestAnimationFrame(loop)
const dt=Math.max(0,Math.min(.05,(now-last)/1000||0))
last=now
clock+=dt
if(phase==='end')endT+=dt
else if(phase==='play'&&!paused)step(dt)
else if(phase==='menu'){P.walk+=dt*.2}
draw()
}
const begin=()=>{if(phase!=='menu')return;audio();phase='play';say('Survive until dawn')}
const leave=()=>{if(box.dataset.done)return;box.dataset.done='1';done({ok:won,score:kills*10+Math.floor(t)*5,kills,secs:Math.floor(t),lv:P.lv})}
const kd=e=>{
const k=e.key.toLowerCase()
if(paused&&cards.classList.contains('on')){const n=Number(k)-1;if(cur[n])take(cur[n]);return}
if(k===' '||k==='enter'){e.preventDefault();if(phase==='menu')begin();else if(phase==='end'&&endT>1)leave();return}
if(k==='m'){muted=!muted;if(mg)mg.gain.value=muted?0:1;return}
if(k==='p'&&phase==='play'){paused=!paused;return}
if(k in{w:1,a:1,s:1,d:1,arrowup:1,arrowdown:1,arrowleft:1,arrowright:1}){keys[k]=1;e.preventDefault()}
}
const ku=e=>{delete keys[e.key.toLowerCase()]}
const pd=e=>{
if(phase==='menu'){begin();return}
if(phase==='end'&&endT>1){leave();return}
if(e.pointerType==='mouse')return
jo={x:e.clientX,y:e.clientY,id:e.pointerId}
}
const pm=e=>{if(!jo||e.pointerId!==jo.id)return;const dx=e.clientX-jo.x,dy=e.clientY-jo.y,d=Math.hypot(dx,dy)||1,m=Math.min(1,d/50);jx=dx/d*m;jy=dy/d*m}
const pu=()=>{jo=null;jx=0;jy=0}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
cv.addEventListener('pointerdown',pd)
addEventListener('pointermove',pm)
addEventListener('pointerup',pu)
addEventListener('pointercancel',pu)
last=performance.now()
raf=requestAnimationFrame(loop)
return()=>{
cancelAnimationFrame(raf)
clearInterval(mus)
removeEventListener('keydown',kd)
removeEventListener('keyup',ku)
removeEventListener('pointermove',pm)
removeEventListener('pointerup',pu)
removeEventListener('pointercancel',pu)
ro.disconnect()
box.remove()
try{ac?.close()}catch{}
}
}
