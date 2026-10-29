export const W=2600
export const H=1900
export const T=20
export const D=80
export const BUILDINGS=[
{x:260,y:240,w:440,h:320,side:'s',off:220,kind:'chapel'},
{x:1000,y:200,w:360,h:360,side:'w',off:180,kind:'house'},
{x:1750,y:300,w:460,h:300,side:'s',off:230,kind:'armory'},
{x:300,y:1100,w:380,h:400,side:'e',off:200,kind:'house'},
{x:1050,y:1250,w:500,h:340,side:'n',off:250,kind:'chapel'},
{x:1900,y:1150,w:400,h:420,side:'w',off:210,kind:'well'}
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
null,
{cd:.85,dmg:38,sp:380,rng:430,aoe:78,nm:'Candy bomb'},
{cd:1.1,dmg:0,sp:380,rng:430,aoe:62,pud:4.5,nm:'Spice grenade'},
{cd:.6,dmg:24,sp:760,life:.7,pierce:4,nm:'Ghost pepper'}
]
export const ET={
wisp:{r:9,hp:8,sp:112,dmg:5,xp:1},
ghoul:{r:14,hp:32,sp:52,dmg:9,xp:3},
bone:{r:12,hp:22,sp:72,dmg:7,xp:2},
reaper:{r:20,hp:210,sp:62,dmg:16,xp:14},
boss:{r:56,hp:1450,sp:40,dmg:14,xp:120}
}
export const UPS=[
['dmg','Hotter Wax','Flames hit 25% harder',6,p=>{p.dmg*=1.25}],
['rate','Quick Hands','Fire 18% faster',6,p=>{p.rate*=.82}],
['count','Twin Flames','One more flame each volley',3,p=>{p.count++}],
['pierce','Sharp Seeds','Flames pass through one more enemy',3,p=>{p.pierce++}],
['spd','Fleet Boots','Move 12% faster',5,p=>{p.spd*=1.12}],
['mag','Candy Magnet','Pick up from 60% farther away',4,p=>{p.mag*=1.6}],
['orb','Orbit Lanterns','One more lantern circles you',5,p=>{p.orb++}],
['nova','Hollow Nova','A ring of light bursts every few seconds',4,p=>{p.nova=p.nova?p.nova*.78:5.5}],
['hp','Thick Rind','+30 max health and heal 30',5,p=>{p.max+=30;p.hp=Math.min(p.max,p.hp+30)}],
['reg','Warm Soup','Regain 1 health every second',3,p=>{p.reg+=1}],
['thr','Deep Pockets','+3 candy bombs, grenades and peppers',3,p=>{for(let i=0;i<3;i++)p.ammo[i]=Math.min(14,p.ammo[i]+3)}],
['mend','Squad Medic','Revive teammates 35% faster',3,p=>{p.mend*=.65}]
]
export const WIN_AT=360
export const BOSS_AT=[90,200,300]
export const BOSS_NAMES=['The Hollowgrin','The Hollowgrin Returns','The Last Harvest']
const rnd=(a,b)=>a+Math.random()*(b-a)
const TAU=Math.PI*2
export function createSim(list){
const n=list.length
const pl=new Map()
list.forEach((m,i)=>pl.set(m.u,{u:m.u,n:m.n,x:W/2+(i-(n-1)/2)*44,y:H/2,r:13,hp:120,max:120,s:'up',ang:0,spd:150,dmg:12,rate:.5,count:1,pierce:0,mag:72,orb:0,nova:0,reg:0,lv:1,xp:0,next:6,cd:0,nv:0,hit:0,inv:0,tcd:0,ammo:[6,3,4],wood:4,hold:0,held:0,rv:0,rvBy:null,bleed:0,mend:1,up:{},offer:null,ot:0,oc:0,pend:0,k:i}))
const S={pl,en:[],pj:[],eb:[],pd:[],pk:[],gm:[],hp:[],bars:DOORS.map(()=>0),bs:BUILDINGS.map(()=>({cd:0})),ev:[],out:[],st:'run',kills:0,id:1,time:0,acc:0,bi:0,boss:null,orbA:0}
const alive=()=>[...pl.values()].filter(p=>p.s==='up')
const ev=(...a)=>{if(S.ev.length<60)S.ev.push(a)}
const burst=(x,y,c,k)=>ev('b',Math.round(x),Math.round(y),c,k)
const txt=(x,y,v,c,big)=>ev('t',Math.round(x),Math.round(y),String(v),c,big?1:0)
const los=(x0,y0,x1,y1,rs)=>{
const d=Math.hypot(x1-x0,y1-y0),k=Math.ceil(d/22)
for(let i=1;i<k;i++){const f=i/k;if(hitWall(x0+(x1-x0)*f,y0+(y1-y0)*f,rs))return false}
return true
}
const gain=(p,v)=>{
p.xp+=v
while(p.xp>=p.next){p.xp-=p.next;p.next=Math.floor(p.next*1.32+4);p.lv++;p.pend++}
}
const offer=p=>{
if(p.offer||p.pend<=0||p.s==='dead')return
const pool=UPS.filter(u=>(p.up[u[0]]||0)<u[3])
p.pend--
if(!pool.length){p.hp=Math.min(p.max,p.hp+25);return}
const ids=[]
while(ids.length<3&&pool.length)ids.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0][0])
p.offer=ids;p.ot=14
S.out.push({to:p.u,m:{k:'lv',ids,lv:p.lv}})
}
S.pick=(u,id)=>{
const p=pl.get(u)
if(!p||!p.offer||!p.offer.includes(id))return
const up=UPS.find(x=>x[0]===id)
up[4](p);p.up[id]=(p.up[id]||0)+1;p.offer=null
S.out.push({to:u,m:{k:'lvdone'}})
}
const spawnE=(k,x,y,sc,hm)=>{
const T0=ET[k]
S.en.push({id:S.id++,k,x,y,r:T0.r,hp:T0.hp*sc*(hm||1),mx:T0.hp*sc*(hm||1),sp:T0.sp*(.92+Math.random()*.16),dmg:T0.dmg,xp:T0.xp,fl:0,oc:0,ph:Math.random()*6,ch:0,bs:Math.random()*2,kx:0,ky:0,sx:1})
}
const spawnPos=()=>{
const ps=alive()
if(!ps.length)return[40,40]
const rs=WALLS
for(let k=0;k<10;k++){
const p=ps[Math.floor(Math.random()*ps.length)],a=Math.random()*TAU,d=470+Math.random()*60
const x=Math.max(30,Math.min(W-30,p.x+Math.cos(a)*d)),y=Math.max(30,Math.min(H-30,p.y+Math.sin(a)*d))
if(buildingAt({x,y})<0&&!hitWall(x,y,rs)&&ps.every(q=>Math.hypot(q.x-x,q.y-y)>380))return[x,y]
}
return[40,40]
}
const pickE=()=>{
const sc=1+S.time/130,r=Math.random(),m=1+.45*(n-1)
let k='wisp'
if(S.time>120&&r<.045)k='reaper'
else if(S.time>45&&r<.3)k='ghoul'
else if(S.time>14&&r<.62)k='bone'
const[x,y]=spawnPos()
spawnE(k,x,y,sc,1+.15*(n-1))
}
const kill=e=>{
S.kills++
e.dead=1
if(e.k==='boss'){
S.boss=null
for(let j=0;j<18;j++)S.gm.push({id:S.id++,x:e.x+rnd(-50,50),y:e.y+rnd(-50,50),v:8})
S.hp.push({id:S.id++,x:e.x,y:e.y})
burst(e.x,e.y,'#ffb347',70)
ev('sh',16)
if(S.bi>=BOSS_AT.length)S.st='win'
}else{
S.gm.push({id:S.id++,x:e.x,y:e.y,v:e.xp})
if(Math.random()<.035)S.hp.push({id:S.id++,x:e.x+8,y:e.y})
if(Math.random()<.05)S.pk.push({id:S.id++,k:Math.random()<.5?'a':'w',x:e.x-8,y:e.y,life:20})
burst(e.x,e.y,e.k==='wisp'?'#8fe3ff':e.k==='ghoul'?'#8fc060':'#e8e2cc',8)
}
}
const hit=(e,d,crit)=>{
if(e.dead)return
e.hp-=d;e.fl=.09
txt(e.x,e.y-e.r-24,Math.round(d),crit?'#ffe27a':'#ffffff',crit)
if(e.hp<=0)kill(e)
}
const hurtP=(p,d)=>{
if(p.s!=='up'||p.hit>0||p.inv>0)return
p.hp-=d;p.hit=.5
burst(p.x,p.y-10,'#ff4a3a',12)
txt(p.x,p.y-40,'-'+Math.round(d),'#ff6a5a')
ev('hurt',p.u)
if(p.hp<=0){
p.hp=0
if(n>1&&alive().length>1){p.s='down';p.bleed=25;p.rv=0;ev('down',p.u)}
else p.s=n>1?'down':'dead'
if(p.s==='down')p.bleed=25
}
}
const boom=(x,y,w,p)=>{
const s=WP[w]
ev('x',Math.round(x),Math.round(y),s.aoe,w)
const k=p?p.dmg/12:1
for(const e of S.en){const d=Math.hypot(e.x-x,e.y-y);if(d<s.aoe+e.r&&s.dmg)hit(e,s.dmg*k*(1-.4*Math.min(1,d/s.aoe)))}
if(s.pud)S.pd.push({x,y,r:s.aoe,life:s.pud,k:p?p.dmg/12:1})
}
S.throw=(u,w,tx,ty)=>{
const p=pl.get(u)
if(!p||p.s!=='up'||p.tcd>0||!(w>=1&&w<=3)||!(p.ammo[w-1]>0))return
const s=WP[w]
p.tcd=s.cd;p.ammo[w-1]--
const a=Math.atan2(ty-p.y,tx-p.x),lob=!s.life
const d=lob?Math.min(Math.hypot(tx-p.x,ty-p.y),s.rng):0
const life=lob?Math.max(.12,d/s.sp):s.life
S.pj.push({id:S.id++,k:w,x:p.x+Math.cos(a)*16,y:p.y+Math.sin(a)*16,vx:Math.cos(a)*s.sp,vy:Math.sin(a)*s.sp,life,pr:s.pierce||0,hit:new Set(),a,lob,own:u})
}
S.input=(u,x,y,a,dash)=>{
const p=pl.get(u)
if(!p||p.s!=='up'||!(x>=0&&x<=W&&y>=0&&y<=H))return
p.x=x;p.y=y;p.ang=a
if(dash)p.inv=Math.max(p.inv,.3)
}
S.holdSet=(u,v)=>{const p=pl.get(u);if(p)p.hold=v?1:0}
const door=p=>{
let best=null,bd=75
for(const d of DOORS){const k=Math.hypot(d.cx-p.x,d.cy-p.y);if(k<bd){bd=k;best=d}}
if(!best)return false
const i=best.i
if(S.bars[i]>0){S.bars[i]=0;p.wood=Math.min(12,p.wood+1)}
else if(p.wood>=2){p.wood-=2;S.bars[i]=140}
return true
}
const crate=p=>{
BUILDINGS.forEach((b,i)=>{
if(b.kind!=='armory'||S.bs[i].cd>0)return
if(Math.hypot(b.x+b.w/2-p.x,b.y+b.h/2-p.y)<56){S.bs[i].cd=50;for(let k=0;k<3;k++)p.ammo[k]=Math.min(14,p.ammo[k]+4);p.wood=Math.min(12,p.wood+3);txt(p.x,p.y-48,'Restocked','#ffe27a');burst(p.x,p.y-10,'#ffb347',16)}
})
}
S.step=dt=>{
if(S.st!=='run')return
S.time+=dt
S.orbA+=dt*2.7
const rs=rectsFor(S.bars)
for(const p of pl.values()){
p.cd-=dt;p.tcd=Math.max(0,p.tcd-dt);p.hit-=dt;p.inv-=dt
if(p.s==='down'){p.bleed-=dt;if(p.bleed<=0)p.s='dead'}
if(p.offer){p.ot-=dt;if(p.ot<=0)S.pick(p.u,p.offer[0])}
else if(p.pend>0)offer(p)
if(p.s==='up'&&p.reg)p.hp=Math.min(p.max,p.hp+p.reg*dt)
if(p.s==='up'&&buildingAt(p)>=0&&BUILDINGS[buildingAt(p)].kind==='chapel')p.hp=Math.min(p.max,p.hp+3.2*dt)
}
for(const p of pl.values()){
if(p.s!=='up'){p.held=p.hold;continue}
let near=null
for(const q of pl.values())if(q.s==='down'&&Math.hypot(q.x-p.x,q.y-p.y)<56)near=q
if(p.hold&&near){near.rv+=dt/p.mend;near.rvBy=p.u;if(near.rv>=2.5){near.s='up';near.hp=near.max*.4;near.rv=0;near.inv=1.5;txt(near.x,near.y-44,'Revived','#7dff9a',1)}}
else if(p.hold&&!p.held){if(!door(p))crate(p)}
p.held=p.hold
}
for(const q of pl.values())if(q.s==='down'){const r=q.rvBy&&pl.get(q.rvBy);if(!(r&&r.hold&&r.s==='up'&&Math.hypot(r.x-q.x,r.y-q.y)<56))q.rv=Math.max(0,q.rv-dt*2)}
BUILDINGS.forEach((b,i)=>{
const s=S.bs[i]
s.cd=Math.max(0,s.cd-dt)
if(b.kind==='well'&&s.cd<=0)for(const p of alive())if(Math.hypot(b.x+b.w/2-p.x,b.y+b.h/2-p.y)<46){s.cd=40;gain(p,10);txt(p.x,p.y-48,'+10 XP','#8fe3ff');burst(p.x,p.y-10,'#8fe3ff',16)}
if(b.kind==='house'&&s.cd<=0){s.cd=90;for(let k=0;k<3;k++)S.gm.push({id:S.id++,x:b.x+b.w/2+rnd(-60,60),y:b.y+b.h/2+rnd(-50,50),v:3})}
})
const ps=alive()
S.acc+=dt*Math.min(7,.65+S.time/40)*(1+.5*(n-1))
const cap=Math.min(230,70+Math.min(190,S.time*.62))*(1+.35*(n-1))
while(S.acc>=1){S.acc--;if(S.en.length<Math.min(210,cap)&&ps.length)pickE()}
if(S.bi<BOSS_AT.length&&S.time>=BOSS_AT[S.bi]&&!S.boss&&ps.length){
const[x,y]=spawnPos()
spawnE('boss',x,y,1+S.bi*.5,1+.6*(n-1))
S.boss=S.en[S.en.length-1];S.boss.name=BOSS_NAMES[S.bi];S.bi++
ev('n',S.boss.name)
}
if(S.time>=WIN_AT&&S.st==='run')S.st='win'
for(const p of ps){
if(p.cd<=0){
let t=null,bd=420*420
for(const e of S.en){const dx=e.x-p.x,dy=e.y-p.y,d=dx*dx+dy*dy;if(d<bd&&los(p.x,p.y,e.x,e.y,rs)){bd=d;t=e}}
if(t){
p.cd=p.rate
const a=Math.atan2(t.y-p.y,t.x-p.x),sp=p.count>1?.17:0
p.ang=a
for(let i=0;i<p.count;i++){const o=a+(i-(p.count-1)/2)*sp;S.pj.push({id:S.id++,k:0,x:p.x,y:p.y,vx:Math.cos(o)*430,vy:Math.sin(o)*430,life:1.05,pr:p.pierce,hit:new Set(),a:o,own:p.u,d:p.dmg})}
}
}
if(p.nova){p.nv-=dt;if(p.nv<=0){p.nv=p.nova;ev('x',Math.round(p.x),Math.round(p.y),210,9);for(const e of S.en){const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<210*210){hit(e,p.dmg*2.6);const d=Math.hypot(dx,dy)||1;e.kx+=dx/d*260;e.ky+=dy/d*260}}}}
for(let i=0;i<p.orb;i++){
const a=S.orbA+i*TAU/p.orb,x=p.x+Math.cos(a)*66,y=p.y+Math.sin(a)*66
for(const e of S.en){const dx=e.x-x,dy=e.y-y,mm=e.r+12;if(e.oc<=0&&dx*dx+dy*dy<mm*mm){hit(e,p.dmg*.9);e.oc=.35}}
}
}
for(const e of S.en){
if(e.dead)continue
e.cd=Math.max(0,(e.cd||0)-dt)
e.fl-=dt;e.oc-=dt
let t=null,bd=1e9
for(const p of ps){const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<bd){bd=d;t=p}}
if(!t)continue
const eb=buildingAt(e),tb=buildingAt(t)
let tx=t.x,ty=t.y
if(e.lv!==undefined){const d=DOORS[e.lv];tx=eb>=0?d.ox:d.fx;ty=eb>=0?d.oy:d.fy;if(Math.hypot(e.x-tx,e.y-ty)<30)delete e.lv}
else if(e.en!==undefined){const d=DOORS[e.en];tx=d.ix;ty=d.iy;if(eb===e.en||tb!==e.en)delete e.en}
else if(eb>=0&&eb!==tb){const d=DOORS[eb];tx=d.ix;ty=d.iy;if(Math.hypot(e.x-tx,e.y-ty)<28)e.lv=eb}
else if(tb>=0&&eb!==tb){const d=DOORS[tb];tx=d.ox;ty=d.oy;if(Math.hypot(e.x-tx,e.y-ty)<28)e.en=tb}
const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1
let sp=e.sp,ux=dx/d,uy=dy/d
const cx=t.x-e.x,cy=t.y-e.y,dp=Math.hypot(cx,cy)||1
if(eb>=0&&BUILDINGS[eb].kind==='chapel')sp*=.5
if(e.k==='boss'){
e.bs+=dt
if(e.bs>4.6){e.bs=0;for(let j=0;j<2;j++)spawnE('wisp',e.x+rnd(-50,50),e.y+rnd(-50,50),1+S.time/130)}
e.ch+=dt
if(e.ch>8.5)e.ch=-1
if(e.ch<0){sp*=2.2;e.ch-=dt;if(e.ch<-.8)e.ch=0}
}else if(e.k==='ghoul'){
e.ch+=dt
if(e.ch>3.6+e.ph*.2)e.ch=-.45
if(e.ch<0){sp*=3.4;e.ch+=dt*2}
}else if(e.k==='bone'){
e.bs+=dt
if(dp<300&&dp>110&&eb===tb){sp*=.35;if(e.bs>2.4){e.bs=0;const a=Math.atan2(cy,cx);S.eb.push({x:e.x,y:e.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170,life:3,a:0,d:e.dmg,id:S.id++})}}
}
const w=Math.sin(S.time*3+e.ph)*.3
const mx=(ux+(-uy)*w)*sp*dt+e.kx*dt,my=(uy+ux*w)*sp*dt+e.ky*dt
e.x+=mx;e.y+=my
if(Math.abs(cx)>3)e.sx=cx>0?1:-1
e.kx*=.86;e.ky*=.86
const h=push(e,rs)
if(h&&h.bar!==undefined)S.bars[h.bar]=Math.max(0,S.bars[h.bar]-e.dmg*dt*2.2)
else if(h){
e.sc=(e.sc||0)+dt
if(e.sc>8){e.sc=0;e.side=-(e.side||1)}
const sd=e.side||(e.side=Math.random()<.5?1:-1)
if(h.w>h.h)e.x+=sd*e.sp*dt;else e.y+=sd*e.sp*dt
push(e,rs)
}else e.sc=Math.max(0,(e.sc||0)-dt)
if(bd<e.r+9)hurtP(t,e.dmg)
}
for(let i=0;i<S.en.length;i++){
const a=S.en[i]
for(let j=i+1;j<S.en.length&&j<i+9;j++){
const b=S.en[j],dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,mm=a.r+b.r
if(d<mm*mm&&d>.01){const q=Math.sqrt(d),f=(mm-q)*.5;if(a.k!=='boss'){a.x-=dx/q*f;a.y-=dy/q*f}if(b.k!=='boss'){b.x+=dx/q*f;b.y+=dy/q*f}}
}
}
for(const p of S.pj){
p.life-=dt
p.x+=p.vx*dt;p.y+=p.vy*dt
const s=WP[p.k]
if(s&&p.lob){if(p.life<=0){p.dead=1;boom(p.x,p.y,p.k,pl.get(p.own))}continue}
if(hitWall(p.x,p.y,rs)||p.life<=0){p.dead=1;continue}
const own=pl.get(p.own),dm=s?s.dmg*(own?own.dmg/12:1):p.d
for(const e of S.en){
if(e.dead||p.hit.has(e.id))continue
const dx=e.x-p.x,dy=e.y-p.y-4,mm=e.r+5
if(dx*dx+dy*dy<mm*mm){
p.hit.add(e.id)
const crit=Math.random()<.12
hit(e,dm*(crit?2:1),crit)
e.kx+=p.vx*.12;e.ky+=p.vy*.12
burst(p.x,p.y,'#ffd27a',3)
if(p.pr--<=0){p.dead=1;break}
}
}
}
for(const b of S.eb){
b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.a+=dt*14
if(hitWall(b.x,b.y,rs)){b.life=0;continue}
for(const p of ps)if(Math.hypot(p.x-b.x,p.y-b.y)<14){hurtP(p,b.d);b.life=0;break}
}
for(const d of S.pd){d.life-=dt;for(const e of S.en)if(Math.hypot(e.x-d.x,e.y-d.y)<d.r+e.r)hit(e,14*d.k*dt)}
for(const g of S.gm){
let best=null,bd=1e9
for(const p of ps){const d=Math.hypot(p.x-g.x,p.y-g.y);if(d<bd){bd=d;best=p}}
if(!best)continue
if(bd<best.mag||g.pull){g.pull=1;const s=260+(1-Math.min(1,bd/500))*300;g.x+=(best.x-g.x)/(bd||1)*s*dt;g.y+=(best.y-g.y)/(bd||1)*s*dt}
if(bd<14){gain(best,g.v);g.got=1}
}
for(const h of S.hp)for(const p of ps)if(!h.got&&Math.hypot(p.x-h.x,p.y-h.y)<22&&p.hp<p.max){p.hp=Math.min(p.max,p.hp+18);h.got=1;txt(p.x,p.y-44,'+18','#7dff9a');burst(h.x,h.y,'#ff7a8a',10)}
for(const k of S.pk){k.life-=dt;for(const p of ps)if(!k.got&&Math.hypot(p.x-k.x,p.y-k.y)<24){k.got=1;if(k.k==='w')p.wood=Math.min(12,p.wood+2);else{const i=Math.floor(Math.random()*3);p.ammo[i]=Math.min(14,p.ammo[i]+3)}}}
S.en=S.en.filter(e=>!e.dead)
S.pj=S.pj.filter(p=>!p.dead)
S.eb=S.eb.filter(b=>b.life>0)
S.pd=S.pd.filter(d=>d.life>0)
S.gm=S.gm.filter(g=>!g.got)
S.hp=S.hp.filter(h=>!h.got)
S.pk=S.pk.filter(k=>k.life>0&&!k.got)
if(!alive().length)S.st='lose'
}
S.snap=()=>{
const r=Math.round,r2=x=>Math.round(x*100)/100
const all=[...pl.values()]
const nr=o=>all.some(p=>Math.abs(p.x-o.x)<760&&Math.abs(p.y-o.y)<520)
const o={k:'s',tm:r2(S.time),st:S.st,kl:S.kills,
p:[...pl.values()].map(p=>[p.u,r(p.x),r(p.y),r(p.hp),r(p.max),p.s,r2(p.ang),p.lv,r(p.xp),p.next,p.orb,p.ammo,p.wood,r2(p.rv),p.inv>0?1:0,p.hit>0?1:0,p.offer?1:0]),
e:S.en.filter(nr).map(e=>[e.id,e.k,r(e.x),r(e.y),r(e.hp),r(e.mx),e.ch<0?1:0,r(e.ph*10),e.sx,e.fl>0?1:0]),
j:S.pj.filter(nr).map(p=>[p.id,p.k,r(p.x),r(p.y),r(p.vx),r(p.vy),r2(p.a)]),
q:S.eb.filter(nr).map(b=>[b.id,r(b.x),r(b.y),r(b.vx),r(b.vy)]),
g:S.gm.filter(nr).map(g=>[r(g.x),r(g.y),g.v]),
l:S.hp.filter(nr).map(h=>[r(h.x),r(h.y)]),
d:S.pd.map(d=>[r(d.x),r(d.y),r(d.r)]),
c:S.pk.map(k=>[k.id,k.k,r(k.x),r(k.y)]),
b:S.bars.map(r),
z:S.bs.map(s=>r(s.cd)),
bo:S.boss&&!S.boss.dead?[S.boss.name,r(S.boss.hp),r(S.boss.mx)]:0,
v:S.ev}
S.ev=[]
return o
}
return S
}
