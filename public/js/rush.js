const TAU=Math.PI*2
const R=Math.random
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
let cssOn=false
const TYPES={
wisp:{r:8,hp:7,sp:112,dmg:5,xp:1,c:'#8fe9ff'},
ghoul:{r:14,hp:36,sp:54,dmg:9,xp:3,c:'#6fae52'},
bone:{r:11,hp:20,sp:78,dmg:7,xp:2,c:'#e8e2cc'},
reaper:{r:19,hp:200,sp:62,dmg:16,xp:14,c:'#4a3470'},
boss:{r:52,hp:2600,sp:48,dmg:24,xp:120,c:'#ff7a1a'}
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
export function playRush(mount,done){
if(!cssOn){cssOn=true;const l=el('link');l.rel='stylesheet';l.href='/rush.css';document.head.append(l)}
const box=el('div','rs'),cv=el('canvas','rs-cv'),cards=el('div','rs-cards')
box.append(cv,cards)
mount.append(box)
const ctx=cv.getContext('2d')
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')
let W=0,H=0
const fit=()=>{const d=Math.min(1.5,devicePixelRatio||1);W=box.clientWidth||800;H=box.clientHeight||500;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
fit()
const ro=new ResizeObserver(fit)
ro.observe(box)
const P={x:0,y:0,hp:100,max:100,spd:150,dmg:10,rate:.62,count:1,pierce:0,mag:72,orb:0,nova:0,reg:0,lv:1,xp:0,next:6,cd:0,nv:0,hit:0,fx:1,fy:0,up:{}}
const E=[],B=[],G=[],F=[]
let t=0,kills=0,acc=0,bi=0,paused=false,over=false,raf=0,last=0,shake=0,boss=null,orbA=0,note='',noteT=0,id=0,endT=0,won=false,jx=0,jy=0,jo=null,ac=null,beep=0
const keys={}
const tone=(f,d,v,ty)=>{try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.type=ty||'square';o.frequency.value=f;g.gain.value=v||.03;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch{}}
const burst=(x,y,n,c,s)=>{for(let i=0;i<n&&F.length<260;i++){const a=R()*TAU,v=(.3+R())*(s||90);F.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.35+R()*.3,m:.65,c,s:1.5+R()*2})}}
const say=s=>{note=s;noteT=2.6}
const spawnE=(k,x,y,sc)=>{const T=TYPES[k];E.push({id:++id,k,x,y,r:T.r,hp:T.hp*sc,mx:T.hp*sc,sp:T.sp*(.92+R()*.16),dmg:T.dmg,xp:T.xp,c:T.c,fl:0,oc:0,ph:R()*TAU,sk:0,ch:0})}
const ring=()=>{const a=R()*TAU,d=Math.max(W,H)*.62+40;return[P.x+Math.cos(a)*d,P.y+Math.sin(a)*d]}
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
for(let j=0;j<18;j++)G.push({x:e.x+(R()-.5)*90,y:e.y+(R()-.5)*90,v:8})
P.hp=Math.min(P.max,P.hp+40)
burst(e.x,e.y,60,'#ffb347',220)
shake=14
tone(90,.6,.07,'sawtooth')
if(bi>=BOSS_AT.length){won=true;finish()}
}else{
G.push({x:e.x,y:e.y,v:e.xp})
burst(e.x,e.y,7,e.c,110)
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
let cur=[]
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
if(over)return
over=true
endT=0
}
const fire=()=>{
let n=null,bd=560*560
for(const e of E){const dx=e.x-P.x,dy=e.y-P.y,d=dx*dx+dy*dy;if(d<bd){bd=d;n=e}}
if(!n)return false
const a=Math.atan2(n.y-P.y,n.x-P.x),sp=P.count>1?.16:0
for(let i=0;i<P.count;i++){
const o=a+(i-(P.count-1)/2)*sp
B.push({x:P.x,y:P.y,vx:Math.cos(o)*420,vy:Math.sin(o)*420,l:1.1,pr:P.pierce,d:P.dmg,h:[]})
}
return true
}
const hurt=d=>{
if(P.hit>0)return
P.hp-=d
P.hit=.45
shake=Math.max(shake,6)
burst(P.x,P.y,10,'#ff3b30',140)
tone(120,.15,.06,'sawtooth')
if(P.hp<=0){P.hp=0;finish()}
}
const step=dt=>{
t+=dt
let kx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+jx
let ky=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+jy
const m=Math.hypot(kx,ky)
if(m>1){kx/=m;ky/=m}
if(m>.05){P.x+=kx*P.spd*dt;P.y+=ky*P.spd*dt;P.fx=kx;P.fy=ky}
P.hit-=dt
if(P.reg)P.hp=Math.min(P.max,P.hp+P.reg*dt)
acc+=dt*Math.min(7,.9+t/42)
while(acc>=1){acc--;if(E.length<70+Math.min(190,t*.62))pick()}
if(bi<BOSS_AT.length&&t>=BOSS_AT[bi]&&!boss){
const[x,y]=ring()
spawnE('boss',x,y,1+bi*.85)
boss=E[E.length-1]
boss.bs=0
boss.name=['The Hollowgrin','The Hollowgrin Returns','The Last Harvest'][bi]
bi++
say(boss.name.toUpperCase())
tone(70,.9,.08,'sawtooth')
}
if(t>=WIN_AT&&!over){won=true;finish()}
P.cd-=dt
if(P.cd<=0&&fire()){P.cd=P.rate;if(beep<=0){tone(520,.05,.012,'square');beep=.08}}
beep-=dt
orbA+=dt*2.7
if(P.nova){P.nv-=dt;if(P.nv<=0){P.nv=P.nova;F.push({x:P.x,y:P.y,ring:1,r:10,l:.45,m:.45});for(const e of E){const dx=e.x-P.x,dy=e.y-P.y;if(dx*dx+dy*dy<200*200){e.hp-=P.dmg*2.6;e.fl=.1;const d=Math.hypot(dx,dy)||1;e.x+=dx/d*40;e.y+=dy/d*40}}tone(200,.25,.04,'sine')}}
for(let i=E.length-1;i>=0;i--){
const e=E[i]
if(e.hp<=0){kill(e);continue}
const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1
let sp=e.sp
if(e.k==='boss'){
e.bs+=dt
if(e.bs>2.8){e.bs=0;for(let j=0;j<3;j++)spawnE('wisp',e.x+(R()-.5)*80,e.y+(R()-.5)*80,1+t/130)}
e.ch+=dt
if(e.ch>6)e.ch=-1
if(e.ch<0){sp*=3.2;e.ch-=dt;if(e.ch<-1.1)e.ch=0}
}
const w=Math.sin(t*3+e.ph)*.35
e.x+=(dx/d+(-dy/d)*w)*sp*dt
e.y+=(dy/d+(dx/d)*w)*sp*dt
e.fl-=dt;e.oc-=dt
if(d<e.r+10)hurt(e.dmg)
}
for(let i=0;i<E.length;i++){
const a=E[i]
for(let j=i+1;j<E.length&&j<i+9;j++){
const b=E[j],dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,m=a.r+b.r
if(d<m*m&&d>.01){const q=Math.sqrt(d),f=(m-q)*.5;if(a.k!=='boss'){a.x-=dx/q*f;a.y-=dy/q*f}if(b.k!=='boss'){b.x+=dx/q*f;b.y+=dy/q*f}}
}
}
for(let i=B.length-1;i>=0;i--){
const b=B[i]
b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt
let dead=b.l<=0
if(!dead)for(const e of E){
const dx=e.x-b.x,dy=e.y-b.y,m=e.r+4
if(dx*dx+dy*dy<m*m&&b.h.indexOf(e.id)<0){
e.hp-=b.d;e.fl=.08;b.h.push(e.id);burst(b.x,b.y,2,'#ffd27a',80)
if(b.pr--<=0){dead=true;break}
}
}
if(dead){B[i]=B[B.length-1];B.pop()}
}
for(let i=0;i<P.orb;i++){
const a=orbA+i*TAU/P.orb,x=P.x+Math.cos(a)*64,y=P.y+Math.sin(a)*64
for(const e of E){
const dx=e.x-x,dy=e.y-y,m=e.r+10
if(e.oc<=0&&dx*dx+dy*dy<m*m){e.hp-=P.dmg*.9;e.oc=.35;e.fl=.08;burst(x,y,2,'#ffb347',70)}
}
}
const mg=P.mag
for(let i=G.length-1;i>=0;i--){
const g=G[i],dx=P.x-g.x,dy=P.y-g.y,d=Math.hypot(dx,dy)
if(d<mg||g.pull){g.pull=1;const s=260+(1-Math.min(1,d/500))*300;g.x+=dx/(d||1)*s*dt;g.y+=dy/(d||1)*s*dt}
if(d<14){gain(g.v);G[i]=G[G.length-1];G.pop();if(beep<=0){tone(900+Math.min(600,P.xp*20),.05,.015,'triangle');beep=.06}}
}
for(let i=F.length-1;i>=0;i--){
const f=F[i]
f.l-=dt
if(f.ring)f.r+=dt*420
else{f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.94;f.vy*=.94}
if(f.l<=0){F[i]=F[F.length-1];F.pop()}
}
shake=Math.max(0,shake-dt*30)
noteT-=dt
}
const hash=(i,j)=>((i*73856093)^(j*19349663))>>>0
const face=(x,y,s,c)=>{
ctx.fillStyle=c
ctx.beginPath()
ctx.moveTo(x-s*.55,y-s*.1);ctx.lineTo(x-s*.2,y-s*.1);ctx.lineTo(x-s*.38,y-s*.42)
ctx.moveTo(x+s*.55,y-s*.1);ctx.lineTo(x+s*.2,y-s*.1);ctx.lineTo(x+s*.38,y-s*.42)
ctx.moveTo(x-s*.5,y+s*.22);ctx.lineTo(x-s*.25,y+s*.45);ctx.lineTo(x,y+s*.25);ctx.lineTo(x+s*.25,y+s*.45);ctx.lineTo(x+s*.5,y+s*.22);ctx.lineTo(x,y+s*.1)
ctx.fill()
}
const draw=()=>{
const sx=calm?0:(R()-.5)*shake,sy=calm?0:(R()-.5)*shake
const cx=P.x-W/2+sx,cy=P.y-H/2+sy
ctx.fillStyle='#181228'
ctx.fillRect(0,0,W,H)
const gs=96,i0=Math.floor(cx/gs),j0=Math.floor(cy/gs)
ctx.strokeStyle='#231a38'
ctx.lineWidth=1
ctx.beginPath()
for(let i=i0;i<=i0+W/gs+1;i++){const x=i*gs-cx;ctx.moveTo(x,0);ctx.lineTo(x,H)}
for(let j=j0;j<=j0+H/gs+1;j++){const y=j*gs-cy;ctx.moveTo(0,y);ctx.lineTo(W,y)}
ctx.stroke()
for(let i=i0;i<=i0+W/gs+1;i++)for(let j=j0;j<=j0+H/gs+1;j++){
const h=hash(i,j),x=i*gs-cx+(h%60)+18,y=j*gs-cy+((h>>8)%60)+18
if(h%9===0){
ctx.fillStyle='#352a4d'
ctx.beginPath();ctx.moveTo(x-9,y+14);ctx.lineTo(x-9,y-4);ctx.arc(x,y-4,9,Math.PI,0);ctx.lineTo(x+9,y+14);ctx.fill()
ctx.fillStyle='#17112280'
ctx.fillRect(x-4,y,8,2);ctx.fillRect(x-1,y-6,2,10)
}else if(h%13===0){
ctx.fillStyle='#4a2a14'
ctx.beginPath();ctx.arc(x,y,8,0,TAU);ctx.fill()
ctx.fillStyle='#ffb347aa'
face(x,y,12,'#ffb34766')
}
}
for(const g of G){
const x=g.x-cx,y=g.y-cy
ctx.fillStyle=g.v>=8?'#ffb347':'#b794ff'
ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x+4,y);ctx.lineTo(x,y+5);ctx.lineTo(x-4,y);ctx.fill()
}
for(const f of F){
const x=f.x-cx,y=f.y-cy
if(f.ring){ctx.strokeStyle='rgba(255,200,120,'+(f.l/f.m)+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,f.r,0,TAU);ctx.stroke()}
else{ctx.globalAlpha=Math.max(0,f.l/f.m);ctx.fillStyle=f.c;ctx.fillRect(x-f.s/2,y-f.s/2,f.s,f.s);ctx.globalAlpha=1}
}
for(const e of E){
const x=e.x-cx,y=e.y-cy,r=e.r
if(x<-80||y<-80||x>W+80||y>H+80)continue
ctx.fillStyle='rgba(0,0,0,.35)'
ctx.beginPath();ctx.ellipse(x,y+r*.8,r*.9,r*.35,0,0,TAU);ctx.fill()
const fl=e.fl>0
ctx.fillStyle=fl?'#ffffff':e.c
if(e.k==='wisp'){
const a=Math.atan2(P.y-e.y,P.x-e.x)
ctx.globalAlpha=.3
ctx.beginPath();ctx.arc(x,y,r*1.7,0,TAU);ctx.fill()
ctx.globalAlpha=1
ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()
ctx.beginPath();ctx.moveTo(x-Math.cos(a)*r*2.6,y-Math.sin(a)*r*2.6);ctx.lineTo(x+Math.cos(a+1.57)*r,y+Math.sin(a+1.57)*r);ctx.lineTo(x+Math.cos(a-1.57)*r,y+Math.sin(a-1.57)*r);ctx.fill()
ctx.fillStyle='#06202a'
ctx.fillRect(x-3,y-2,2,3);ctx.fillRect(x+1,y-2,2,3)
}else if(e.k==='ghoul'){
ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()
ctx.fillStyle=fl?'#fff':'#3d6b2a'
ctx.fillRect(x-r*.7,y+r*.2,r*1.4,r*.25)
ctx.fillStyle='#e9ff9a'
ctx.fillRect(x-6,y-5,4,4);ctx.fillRect(x+2,y-5,4,4)
}else if(e.k==='bone'){
ctx.beginPath();ctx.arc(x,y-2,r,0,TAU);ctx.fill()
ctx.fillRect(x-r*.6,y+r*.5,r*1.2,r*.8)
ctx.fillStyle='#17112a'
ctx.fillRect(x-5,y-5,3,4);ctx.fillRect(x+2,y-5,3,4);ctx.fillRect(x-3,y+2,6,2)
}else if(e.k==='reaper'){
ctx.beginPath();ctx.moveTo(x,y-r*1.3);ctx.lineTo(x+r*1.1,y+r);ctx.lineTo(x-r*1.1,y+r);ctx.fill()
ctx.fillStyle='#ff3b30'
ctx.fillRect(x-5,y-5,3,3);ctx.fillRect(x+2,y-5,3,3)
ctx.strokeStyle=fl?'#fff':'#8d6bd1'
ctx.lineWidth=2
ctx.beginPath();ctx.moveTo(x+r*1.2,y-r*1.3);ctx.lineTo(x+r*1.2,y+r*1.2);ctx.stroke()
}else{
ctx.globalAlpha=.22
ctx.beginPath();ctx.arc(x,y,r*1.5,0,TAU);ctx.fill()
ctx.globalAlpha=1
ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()
ctx.fillStyle='#4f7a1c'
ctx.fillRect(x-4,y-r-12,8,14)
face(x,y,r*1.4,'#fff1a8')
}
if(e.k!=='wisp'&&e.k!=='boss'&&e.hp<e.mx){ctx.fillStyle='#000a';ctx.fillRect(x-r,y-r-8,r*2,3);ctx.fillStyle='#ff5a4a';ctx.fillRect(x-r,y-r-8,r*2*e.hp/e.mx,3)}
}
for(const b of B){
const x=b.x-cx,y=b.y-cy
ctx.fillStyle='rgba(255,190,90,.28)'
ctx.beginPath();ctx.arc(x,y,9,0,TAU);ctx.fill()
ctx.fillStyle='#ffe08a'
ctx.beginPath();ctx.arc(x,y,4,0,TAU);ctx.fill()
}
for(let i=0;i<P.orb;i++){
const a=orbA+i*TAU/P.orb,x=P.x+Math.cos(a)*64-cx,y=P.y+Math.sin(a)*64-cy
ctx.fillStyle='rgba(255,170,60,.3)'
ctx.beginPath();ctx.arc(x,y,16,0,TAU);ctx.fill()
ctx.fillStyle='#ffb347'
ctx.fillRect(x-5,y-6,10,12)
ctx.fillStyle='#fff3b0'
ctx.fillRect(x-2,y-3,4,6)
}
const px=P.x-cx,py=P.y-cy
ctx.fillStyle='rgba(0,0,0,.4)'
ctx.beginPath();ctx.ellipse(px,py+11,11,4,0,0,TAU);ctx.fill()
const blink=P.hit>0&&Math.floor(t*30)%2===0
ctx.fillStyle=blink?'#fff':'#ff8a1e'
ctx.beginPath();ctx.arc(px,py,11,0,TAU);ctx.fill()
ctx.fillStyle='#4f7a1c'
ctx.fillRect(px-2,py-16,4,7)
face(px,py,15,'#2a0d02')
const gr=ctx.createRadialGradient(px,py,90,px,py,Math.max(W,H)*.6)
gr.addColorStop(0,'rgba(8,4,14,0)')
gr.addColorStop(.5,'rgba(8,4,14,.2)')
gr.addColorStop(1,'rgba(8,4,14,.8)')
ctx.fillStyle=gr
ctx.fillRect(0,0,W,H)
ctx.fillStyle='#000a'
ctx.fillRect(16,16,206,16)
ctx.fillStyle='#e0332b'
ctx.fillRect(18,18,202*P.hp/P.max,12)
ctx.fillStyle='#000a'
ctx.fillRect(16,36,206,8)
ctx.fillStyle='#b794ff'
ctx.fillRect(18,38,202*P.xp/P.next,4)
ctx.font='700 13px ui-monospace,Menlo,Consolas,monospace'
ctx.textBaseline='top'
ctx.fillStyle='#fde8c4'
ctx.textAlign='left'
ctx.fillText('LV '+P.lv+'   KILLS '+kills,18,52)
ctx.textAlign='center'
ctx.font='700 22px ui-monospace,Menlo,Consolas,monospace'
const left=Math.max(0,WIN_AT-t)
ctx.fillText(String(Math.floor(left/60)).padStart(2,'0')+':'+String(Math.floor(left%60)).padStart(2,'0'),W/2,16)
if(boss&&boss.hp>0){
const bw=Math.min(420,W-40)
ctx.fillStyle='#000b';ctx.fillRect(W/2-bw/2,H-44,bw,14)
ctx.fillStyle='#ff7a1a';ctx.fillRect(W/2-bw/2+2,H-42,(bw-4)*Math.max(0,boss.hp/boss.mx),10)
ctx.font='700 12px ui-monospace,Menlo,Consolas,monospace'
ctx.fillStyle='#ffe9c4'
ctx.fillText(boss.name,W/2,H-62)
}
if(noteT>0){ctx.globalAlpha=Math.min(1,noteT);ctx.font='700 30px Georgia,serif';ctx.fillStyle='#ffb347';ctx.fillText(note,W/2,H*.22);ctx.globalAlpha=1}
if(over){
const a=Math.min(.82,endT*.9)
ctx.fillStyle='rgba(4,2,8,'+a+')'
ctx.fillRect(0,0,W,H)
ctx.globalAlpha=Math.min(1,endT*1.4)
ctx.font='700 '+Math.min(72,W/9)+'px Georgia,serif'
ctx.fillStyle=won?'#ffe9a8':'#ff5a4a'
ctx.fillText(won?'Dawn breaks':'Consumed',W/2,H*.36)
ctx.font='700 16px ui-monospace,Menlo,Consolas,monospace'
ctx.fillStyle='#fde8c4'
ctx.fillText(Math.floor(t)+' seconds   '+kills+' kills   level '+P.lv,W/2,H*.36+Math.min(90,W/8))
ctx.globalAlpha=1
}
}
const loop=now=>{
raf=requestAnimationFrame(loop)
const dt=Math.min(.05,(now-last)/1000||0)
last=now
if(over){endT+=dt;if(endT>2.4&&!box.dataset.done){box.dataset.done='1';done({ok:won,score:kills*10+Math.floor(t)*5,kills,secs:Math.floor(t),lv:P.lv})}}
else if(!paused)step(dt)
draw()
}
const kd=e=>{
const k=e.key.toLowerCase()
if(paused&&cards.classList.contains('on')){const n=Number(k)-1;if(cur[n])take(cur[n]);return}
if(k in{w:1,a:1,s:1,d:1,arrowup:1,arrowdown:1,arrowleft:1,arrowright:1}){keys[k]=1;e.preventDefault()}
}
const ku=e=>{delete keys[e.key.toLowerCase()]}
const pd=e=>{if(e.pointerType==='mouse')return;jo={x:e.clientX,y:e.clientY,id:e.pointerId}}
const pm=e=>{if(!jo||e.pointerId!==jo.id)return;const dx=e.clientX-jo.x,dy=e.clientY-jo.y,d=Math.hypot(dx,dy)||1,m=Math.min(1,d/50);jx=dx/d*m;jy=dy/d*m}
const pu=()=>{jo=null;jx=0;jy=0}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
cv.addEventListener('pointerdown',pd)
addEventListener('pointermove',pm)
addEventListener('pointerup',pu)
addEventListener('pointercancel',pu)
say('SURVIVE UNTIL DAWN')
last=performance.now()
raf=requestAnimationFrame(loop)
return()=>{
cancelAnimationFrame(raf)
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
