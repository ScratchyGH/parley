export const W=2600
export const H=1900
export const T=20
export const D=80
export const BUILDINGS=[
{x:260,y:240,w:440,h:320,side:'s',off:220},
{x:1000,y:200,w:360,h:360,side:'w',off:180},
{x:1750,y:300,w:460,h:300,side:'s',off:230},
{x:300,y:1100,w:380,h:400,side:'e',off:200},
{x:1050,y:1250,w:500,h:340,side:'n',off:250},
{x:1900,y:1150,w:400,h:420,side:'w',off:210}
]
const NORM={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]}
const g=D/2
export const DOORS=BUILDINGS.map((b,i)=>{
const r={n:{x:b.x+b.off-g,y:b.y,w:D,h:T},s:{x:b.x+b.off-g,y:b.y+b.h-T,w:D,h:T},w:{x:b.x,y:b.y+b.off-g,w:T,h:D},e:{x:b.x+b.w-T,y:b.y+b.off-g,w:T,h:D}}[b.side]
const cx=r.x+r.w/2,cy=r.y+r.h/2,[nx,ny]=NORM[b.side]
return{i,rect:r,cx,cy,ox:cx+nx*(T/2+34),oy:cy+ny*(T/2+34),ix:cx-nx*(T/2+34),iy:cy-ny*(T/2+34),fx:cx+nx*130,fy:cy+ny*130}
})
export const WALLS=(()=>{
const r=[]
BUILDINGS.forEach(b=>{
const hor=(y,d)=>{if(d)r.push({x:b.x,y,w:b.off-g,h:T},{x:b.x+b.off+g,y,w:b.w-b.off-g,h:T});else r.push({x:b.x,y,w:b.w,h:T})}
const ver=(x,d)=>{if(d)r.push({x,y:b.y,w:T,h:b.off-g},{x,y:b.y+b.off+g,w:T,h:b.h-b.off-g});else r.push({x,y:b.y,w:T,h:b.h})}
hor(b.y,b.side==='n');hor(b.y+b.h-T,b.side==='s');ver(b.x,b.side==='w');ver(b.x+b.w-T,b.side==='e')
})
r.push({x:-60,y:-60,w:W+120,h:60},{x:-60,y:H,w:W+120,h:60},{x:-60,y:0,w:60,h:H},{x:W,y:0,w:60,h:H})
return r
})()
export const rectsFor=bars=>{
const o=WALLS.slice()
DOORS.forEach((d,i)=>{if(bars[i]>0)o.push({...d.rect,bar:i})})
return o
}
export const buildingAt=o=>BUILDINGS.findIndex(b=>o.x>b.x+T&&o.x<b.x+b.w-T&&o.y>b.y+T&&o.y<b.y+b.h-T)
export function push(o,rs){
let hit=null
for(const q of rs){
const cx=Math.max(q.x,Math.min(o.x,q.x+q.w)),cy=Math.max(q.y,Math.min(o.y,q.y+q.h))
let dx=o.x-cx,dy=o.y-cy,d=Math.hypot(dx,dy)
if(d<o.r){
if(d<.001){dx=0;dy=-1;d=1;o.y-=o.r}else{o.x+=dx/d*(o.r-d);o.y+=dy/d*(o.r-d)}
hit=q
}
}
return hit
}
const hitWall=(x,y,rs)=>rs.some(q=>x>q.x&&x<q.x+q.w&&y>q.y&&y<q.y+q.h)
export const WP=[
{cd:.38,dmg:10,sp:560,life:.8,pierce:0},
{cd:.85,dmg:38,sp:380,lob:1,rng:430,aoe:78},
{cd:1.1,dmg:0,sp:380,lob:1,rng:430,aoe:62,pud:4.5},
{cd:.6,dmg:24,sp:760,life:.7,pierce:4}
]
export const ET={
wisp:{r:9,hp:8,sp:112,dmg:5},
ghoul:{r:14,hp:32,sp:52,dmg:9},
bone:{r:12,hp:22,sp:72,dmg:7},
reaper:{r:20,hp:210,sp:62,dmg:16},
boss:{r:56,hp:1450,sp:40,dmg:14}
}
export const WINS=10
const rnd=(a,b)=>a+Math.random()*(b-a)
export function createSim(list){
const n=list.length
const pl=new Map()
list.forEach((m,i)=>pl.set(m.u,{u:m.u,n:m.n,x:W/2+(i-(n-1)/2)*44,y:H/2,r:13,hp:100,max:100,s:'up',ang:0,w:0,cd:0,ammo:[99,6,3,4],wood:4,hold:0,held:0,rv:0,bleed:0,k:i}))
const S={pl,en:[],pj:[],pd:[],pk:[],bars:DOORS.map(()=>0),ev:[],wave:0,st:'wait',timer:3,queue:[],spawn:0,kills:0,id:1,time:0}
const alive=()=>[...pl.values()].filter(p=>p.s==='up')
const drop=(x,y,big)=>{
const r=Math.random()
if(big||r<.2)S.pk.push({id:S.id++,k:'a',x,y,life:20})
else if(r<.36)S.pk.push({id:S.id++,k:'w',x,y,life:20})
}
const hurt=(e,d)=>{
e.hp-=d
if(e.hp<=0&&!e.dead){e.dead=1;S.kills++;drop(e.x,e.y,e.t==='reaper'||e.t==='boss')}
}
const boom=(x,y,w)=>{
const s=WP[w]
S.ev.push([Math.round(x),Math.round(y),s.aoe,w])
for(const e of S.en){const d=Math.hypot(e.x-x,e.y-y);if(d<s.aoe+e.r&&s.dmg)hurt(e,s.dmg*(1-.4*Math.min(1,d/s.aoe)))}
if(s.pud)S.pd.push({x,y,r:s.aoe,life:s.pud})
}
S.throw=(u,w,tx,ty)=>{
const p=pl.get(u)
if(!p||p.s!=='up'||p.cd>0||!(w>=0&&w<4)||!(p.ammo[w]>0))return
const s=WP[w]
p.cd=s.cd
if(w)p.ammo[w]--
const a=Math.atan2(ty-p.y,tx-p.x)
p.ang=a
const d=s.lob?Math.min(Math.hypot(tx-p.x,ty-p.y),s.rng):0
S.pj.push({id:S.id++,k:w,x:p.x+Math.cos(a)*16,y:p.y+Math.sin(a)*16,vx:Math.cos(a)*s.sp,vy:Math.sin(a)*s.sp,life:s.lob?Math.max(.12,d/s.sp):s.life,pr:s.pierce||0,hit:new Set(),a,tot:s.lob?Math.max(.12,d/s.sp):0})
}
S.input=(u,x,y,a,w)=>{
const p=pl.get(u)
if(!p||p.s!=='up'||!(x>=0&&x<=W&&y>=0&&y<=H))return
p.x=x;p.y=y;p.ang=a
if(w>=0&&w<4)p.w=w
}
S.holdSet=(u,v)=>{const p=pl.get(u);if(p)p.hold=v?1:0}
const door=p=>{
let best=null,bd=75
for(const d of DOORS){const k=Math.hypot(d.cx-p.x,d.cy-p.y);if(k<bd){bd=k;best=d}}
if(!best)return
const i=best.i
if(S.bars[i]>0){S.bars[i]=0;p.wood=Math.min(12,p.wood+1)}
else if(p.wood>=2){p.wood-=2;S.bars[i]=140}
}
const queueWave=n=>{
const m=1+.45*(n-1>=0?pl.size-1:0)
const q=[],add=(t,c)=>{for(let i=0;i<Math.round(c*m);i++)q.push(t)}
add('wisp',6+3*n)
if(n>=2)add('ghoul',2*n)
if(n>=3)add('bone',2+n)
if(n>=4)add('reaper',Math.floor(n/2))
if(n===5)q.push('boss')
if(n===10){q.push('boss');q.push('boss')}
for(let i=q.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[q[i],q[j]]=[q[j],q[i]]}
return q
}
const edge=()=>{
for(let k=0;k<12;k++){
const s=Math.floor(Math.random()*4),x=s<2?rnd(40,W-40):s===2?40:W-40,y=s===0?40:s===1?H-40:rnd(40,H-40)
if(buildingAt({x,y})<0&&alive().every(p=>Math.hypot(p.x-x,p.y-y)>500))return[x,y]
}
return[40,40]
}
S.step=dt=>{
S.time+=dt
const rs=rectsFor(S.bars)
for(const p of pl.values()){
p.cd=Math.max(0,p.cd-dt)
if(p.s==='down'){p.bleed-=dt;if(p.bleed<=0)p.s='dead'}
}
for(const p of pl.values()){
if(p.s!=='up'){p.held=p.hold;continue}
let near=null
for(const q of pl.values())if(q.s==='down'&&Math.hypot(q.x-p.x,q.y-p.y)<56)near=q
if(p.hold&&near){near.rv+=dt;near.rvBy=p.u;if(near.rv>=2.5){near.s='up';near.hp=40;near.rv=0}}
else if(p.hold&&!p.held)door(p)
p.held=p.hold
}
for(const q of pl.values())if(q.s==='down'&&!(q.rvBy&&pl.get(q.rvBy)&&pl.get(q.rvBy).hold&&Math.hypot(pl.get(q.rvBy).x-q.x,pl.get(q.rvBy).y-q.y)<56))q.rv=Math.max(0,q.rv-dt*2)
if(S.st==='wait'){S.timer-=dt;if(S.timer<=0){S.wave++;S.queue=queueWave(S.wave);S.st='run';S.spawn=0}}
else if(S.st==='run'){
S.spawn-=dt
if(S.queue.length&&S.spawn<=0&&S.en.length<70){
S.spawn=.45
const t=S.queue.pop(),sp=ET[t],[x,y]=edge()
const hp=sp.hp*(1+.07*(S.wave-1))
S.en.push({id:S.id++,t,x,y,hp,max:hp,r:sp.r,sp:sp.sp*(1+.015*S.wave),dmg:sp.dmg,cd:0})
}
if(!S.queue.length&&!S.en.length){if(S.wave>=WINS){S.st='win'}else{S.st='wait';S.timer=7}}
}
const up=alive()
for(const e of S.en){
e.cd=Math.max(0,e.cd-dt)
let t=null,bd=1e9
for(const p of up){const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<bd){bd=d;t=p}}
if(!t)continue
let tx=t.x,ty=t.y
const eb=buildingAt(e),tb=buildingAt(t)
if(e.lv!==undefined){const d=DOORS[e.lv];tx=eb>=0?d.ox:d.fx;ty=eb>=0?d.oy:d.fy;if(Math.hypot(e.x-tx,e.y-ty)<30)delete e.lv}
else if(e.en!==undefined){const d=DOORS[e.en];tx=d.ix;ty=d.iy;if(eb===e.en||tb!==e.en)delete e.en}
else if(eb>=0&&eb!==tb){const d=DOORS[eb];tx=d.ix;ty=d.iy;if(Math.hypot(e.x-tx,e.y-ty)<28)e.lv=eb}
else if(tb>=0&&eb!==tb){const d=DOORS[tb];tx=d.ox;ty=d.oy;if(Math.hypot(e.x-tx,e.y-ty)<28)e.en=tb}
const dx=tx-e.x,dy=ty-e.y,l=Math.hypot(dx,dy)||1
e.x+=dx/l*e.sp*dt;e.y+=dy/l*e.sp*dt
const hit=push(e,rs)
if(hit&&hit.bar!==undefined){S.bars[hit.bar]=Math.max(0,S.bars[hit.bar]-e.dmg*dt*2.2)}
else if(hit){
e.sc=(e.sc||0)+dt
if(e.sc>8){e.sc=0;e.side=-(e.side||1)}
const sd=e.side||(e.side=Math.random()<.5?1:-1)
if(hit.w>hit.h)e.x+=sd*e.sp*dt;else e.y+=sd*e.sp*dt
push(e,rs)
}else e.sc=Math.max(0,(e.sc||0)-dt)
if(bd<e.r+13&&e.cd<=0){t.hp-=e.dmg;e.cd=.8;if(t.hp<=0){t.hp=0;if(pl.size>1&&alive().length>1){t.s='down';t.bleed=25;t.rv=0}else t.s=pl.size>1?'down':'dead';if(t.s==='down')t.bleed=25}}
}
for(const p of S.pj){
p.life-=dt
const s=WP[p.k]
p.x+=p.vx*dt;p.y+=p.vy*dt
if(s.lob){if(p.life<=0){p.dead=1;boom(p.x,p.y,p.k)}continue}
if(hitWall(p.x,p.y,rs)||p.life<=0){p.dead=1;continue}
for(const e of S.en){
if(e.dead||p.hit.has(e.id))continue
if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+6){p.hit.add(e.id);hurt(e,s.dmg);if(p.pr--<=0){p.dead=1;break}}
}
}
for(const d of S.pd){d.life-=dt;for(const e of S.en)if(Math.hypot(e.x-d.x,e.y-d.y)<d.r+e.r)hurt(e,14*dt)}
for(const k of S.pk){
k.life-=dt
for(const p of up)if(!k.got&&Math.hypot(p.x-k.x,p.y-k.y)<24){
k.got=1
if(k.k==='w')p.wood=Math.min(12,p.wood+2)
else{const i=1+Math.floor(Math.random()*3);p.ammo[i]=Math.min(12,p.ammo[i]+3)}
}
}
S.en=S.en.filter(e=>!e.dead)
S.pj=S.pj.filter(p=>!p.dead)
S.pd=S.pd.filter(d=>d.life>0)
S.pk=S.pk.filter(k=>k.life>0&&!k.got)
if(!alive().length&&S.st!=='lose'&&S.st!=='win')S.st='lose'
}
S.snap=()=>{
const r=Math.round
const o={k:'s',w:S.wave,st:S.st,tm:Math.ceil(S.timer),n:S.en.length+S.queue.length,kl:S.kills,
p:[...pl.values()].map(p=>[p.u,r(p.x),r(p.y),r(p.hp),p.s,Math.round(p.ang*100)/100,p.w,p.ammo.map(x=>Math.min(x,99)),p.wood,Math.round(p.rv*10)/10]),
e:S.en.map(e=>[e.id,e.t,r(e.x),r(e.y),r(e.hp),r(e.max)]),
j:S.pj.map(p=>[p.id,p.k,r(p.x),r(p.y),Math.round(p.a*100)/100]),
d:S.pd.map(d=>[r(d.x),r(d.y),r(d.r)]),
c:S.pk.map(k=>[k.id,k.k,r(k.x),r(k.y)]),
b:S.bars.map(r),
v:S.ev}
S.ev=[]
return o
}
return S
}
