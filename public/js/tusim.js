export const CS=1000
export const T=20
export const D=80
const TAU=Math.PI*2
const g=D/2
const hs=(i,j,k)=>{let h=Math.imul(i,73856093)^Math.imul(j,19349663)^Math.imul(k,83492791);h=Math.imul(h^(h>>>15),2246822507);h=Math.imul(h^(h>>>13),3266489909);return(h^(h>>>16))>>>0}
const rf=(i,j,k)=>hs(i,j,k)/4294967296
const KB={chapel:[440,320],house:[360,360],armory:[420,300],cabin:[300,240]}
const SOL={tower:[24,12],crypt:[48,22],well:[28,14],shrine:[20,12],campfire:[18,8],altar:[26,12]}
const FORCE={'1,0':'chapel','-1,0':'armory','0,1':'campfire','0,-1':'cabin','1,1':'crypt','-1,-1':'tower','-1,1':'well','2,0':'hole','-2,0':'hole','0,2':'altar','1,-1':'house','-1,2':'shrine'}
const SIDES=['n','s','w','e']
const NORM={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]}
const doorOf=b=>{
const r={n:{x:b.x+b.off-g,y:b.y,w:D,h:T},s:{x:b.x+b.off-g,y:b.y+b.h-T,w:D,h:T},w:{x:b.x,y:b.y+b.off-g,w:T,h:D},e:{x:b.x+b.w-T,y:b.y+b.off-g,w:T,h:D}}[b.side]
const cx=r.x+r.w/2,cy=r.y+r.h/2,[nx,ny]=NORM[b.side]
r.bar=b.id
return{rect:r,cx,cy,ox:cx+nx*(T/2+34),oy:cy+ny*(T/2+34),ix:cx-nx*(T/2+34),iy:cy-ny*(T/2+34),fx:cx+nx*130,fy:cy+ny*130}
}
const wallsOf=b=>{
const r=[]
const hor=(y,d)=>{if(d)r.push({x:b.x,y,w:b.off-g,h:T},{x:b.x+b.off+g,y,w:b.w-b.off-g,h:T});else r.push({x:b.x,y,w:b.w,h:T})}
const ver=(x,d)=>{if(d)r.push({x,y:b.y,w:T,h:b.off-g},{x,y:b.y+b.off+g,w:T,h:b.h-b.off-g});else r.push({x,y:b.y,w:T,h:b.h})}
hor(b.y,b.side==='n');hor(b.y+b.h-T,b.side==='s');ver(b.x,b.side==='w');ver(b.x+b.w-T,b.side==='e')
return r
}
const cache=new Map()
export function chunk(i,j){
const key=i+','+j
let c=cache.get(key)
if(c)return c
c={i,j,id:key,b:null,o:null,ch:[],walls:[]}
const ox=i*CS,oy=j*CS
const r=rf(i,j,1)
let k=FORCE[key]||null
if(!k&&!(i===0&&j===0)){
const T0=[['chapel',.07],['house',.15],['armory',.2],['cabin',.3],['tower',.37],['crypt',.45],['well',.5],['shrine',.55],['campfire',.62],['altar',.67],['hole',.77],['graveyard',.82]]
const f=T0.find(q=>r<q[1]);k=f?f[0]:null
}
if(k&&KB[k]){
const[w,h]=KB[k]
const b={id:key,kind:k,w,h,x:ox+70+Math.floor(rf(i,j,2)*(CS-140-w)),y:oy+70+Math.floor(rf(i,j,3)*(CS-140-h)),side:SIDES[hs(i,j,4)%4]}
const len=b.side==='n'||b.side==='s'?w:h
b.off=Math.floor(100+rf(i,j,6)*(len-200))
b.door=doorOf(b)
c.b=b
c.walls.push(...wallsOf(b),b.door.rect)
}else if(k){
c.o={id:key,kind:k,x:Math.round(ox+250+rf(i,j,2)*500),y:Math.round(oy+250+rf(i,j,3)*500)}
const sl=SOL[k]
if(sl)c.walls.push({x:c.o.x-sl[0]/2,y:c.o.y-sl[1],w:sl[0],h:sl[1],cr:k==='crypt'?c.o.id:undefined})
if(k==='graveyard')c.ch.push({id:key+'g0',x:c.o.x-70,y:c.o.y+30},{id:key+'g1',x:c.o.x+70,y:c.o.y+40})
}
if(c.b&&c.b.kind==='cabin')c.ch.push({id:key+'in',x:Math.round(c.b.x+c.b.w/2),y:Math.round(c.b.y+c.b.h/2+26)})
const n=hs(i,j,5)%3
for(let q=0;q<n;q++){
const x=Math.round(ox+80+rf(i,j,10+q)*(CS-160)),y=Math.round(oy+80+rf(i,j,20+q)*(CS-160))
if(c.b&&x>c.b.x-50&&x<c.b.x+c.b.w+50&&y>c.b.y-50&&y<c.b.y+c.b.h+50)continue
if(c.o&&Math.hypot(x-c.o.x,y-c.o.y)<90)continue
c.ch.push({id:key+'c'+q,x,y})
}
cache.set(key,c)
return c
}
const pc=new Map()
export function partnerOf(o){
let r=pc.get(o.id)
if(r!==undefined)return r
const[i,j]=o.id.split(',').map(Number)
r=null
for(let d=2;d<=5&&!r;d++)for(let dx=-d;dx<=d&&!r;dx++)for(let dy=-d;dy<=d;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;const q=chunk(i+dx,j+dy).o;if(q&&q.kind==='hole'){r=q;break}}
pc.set(o.id,r)
return r
}
const nb=new Map()
export function near(x,y){
const i=Math.floor(x/CS),j=Math.floor(y/CS),key=i+','+j
let a=nb.get(key)
if(!a){a=[];for(let u=i-1;u<=i+1;u++)for(let v=j-1;v<=j+1;v++)a.push(...chunk(u,v).walls);nb.set(key,a)}
return a
}
export function around(x,y,n){
const i=Math.floor(x/CS),j=Math.floor(y/CS),a=[]
for(let u=i-n;u<=i+n;u++)for(let v=j-n;v<=j+n;v++)a.push(chunk(u,v))
return a
}
export const buildingAt=o=>{
const b=chunk(Math.floor(o.x/CS),Math.floor(o.y/CS)).b
return b&&o.x>b.x+T&&o.x<b.x+b.w-T&&o.y>b.y+T&&o.y<b.y+b.h-T?b:null
}
const solid=(q,st)=>q.bar!==undefined?st.bars[q.bar]>0:q.cr!==undefined?!st.dead.has(q.cr):true
export function push(o,rs,st){
let hit=null
for(const q of rs){
if(!solid(q,st))continue
const cx=Math.max(q.x,Math.min(o.x,q.x+q.w)),cy=Math.max(q.y,Math.min(o.y,q.y+q.h))
let dx=o.x-cx,dy=o.y-cy,d=Math.hypot(dx,dy)
if(d<o.r){
if(d<.001){dx=0;dy=-1;d=1;o.y-=o.r}else{o.x+=dx/d*(o.r-d);o.y+=dy/d*(o.r-d)}
hit=q
}
}
return hit
}
export const hitWall=(x,y,st)=>{
for(const q of near(x,y))if(x>q.x&&x<q.x+q.w&&y>q.y&&y<q.y+q.h&&solid(q,st))return true
return false
}
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
boss:{r:56,hp:1450,sp:40,dmg:14,xp:120},
crawler:{r:11,hp:14,sp:125,dmg:6,xp:2},
bat:{r:7,hp:5,sp:150,dmg:4,xp:1},
wraith:{r:13,hp:38,sp:58,dmg:8,xp:5},
lurker:{r:13,hp:42,sp:72,dmg:14,xp:5},
stitched:{r:20,hp:160,sp:48,dmg:18,xp:12}
}
export const ABN=['dash','flare','ward','rift','drain']
export const ABI={
dash:['Dash','SPACE','#8fe3ff',3.2],
flare:['Flare','G','#ff8a3a',12],
ward:['Ward','Q','#ffe27a',16],
rift:['Grave Rift','R','#b48aff',20],
drain:['Soul Drain','F','#ff4a6a',18]
}
const ab=n=>p=>{p.ab[n]=(p.ab[n]||0)+1}
export const UPS=[
['dmg','Hotter Wax','Flames and bombs hit 25% harder',6,p=>{p.dmg*=1.25}],
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
['mend','Squad Medic','Revive teammates 35% faster',3,p=>{p.mend*=.65}],
['plate','Plate Mail','+25 armor that soaks damage first',4,p=>{p.arm+=25;p.ar+=25}],
['arreg','Mending Plates','Armor regrows when you stay unhurt',3,p=>{p.arr++}],
['crit','Lucky Charm','+8% critical hit chance',4,p=>{p.crit+=.08}],
['ls','Sweet Tooth','Heal 1 health for every kill',3,p=>{p.ls++}],
['area','Big Bang','Bombs and grenades blast 20% wider',3,p=>{p.area*=1.2}],
['xpg','Scholar','Gain 15% more experience',3,p=>{p.xm*=1.15}],
['thorn','Thorn Coat','Enemies that hit you take damage back',3,p=>{p.thorn+=22}],
['a_dash','Dash Mastery','Dash recharges faster and goes further',3,ab('dash')],
['a_flare','Flare [G]','Throw a flare that stuns and scares enemies',3,ab('flare')],
['a_ward','Ward [Q]','A shield that soaks up hits for a few seconds',3,ab('ward')],
['a_rift','Grave Rift [R]','Drag every nearby enemy in and crush them',3,ab('rift')],
['a_drain','Soul Drain [F]','Rip life out of everything around you',3,ab('drain')]
].map(u=>u[0].startsWith('a_')?[u[0],u[1],u[2],u[3],u[4]]:u)
export const DIFFS=[
{n:'I dont wanna die',t:'Easy mode',hp:.7,dmg:.6,sp:.65,php:1.35,xp:1.25,spd:.95},
{n:'Im a man',t:'Neutral',hp:1,dmg:1,sp:1,php:1,xp:1,spd:1},
{n:'I CAN FUCKING TAKE IT',t:'Hard',hp:1.35,dmg:1.3,sp:1.3,php:1,xp:1,spd:1.04},
{n:'GIVE ME ALL YOU GOT',t:'Extreme',hp:1.8,dmg:1.8,sp:1.7,php:.85,xp:.9,spd:1.12}
]
export const LENS=[1,5,10,30,60,0]
const BN=[['The Hollowgrin','The Hollowgrin Returns','The Last Harvest'],['The Gravedigger','The Pale Choir','Mother Night']]
const rnd=(a,b)=>a+Math.random()*(b-a)
export function createSim(list,rules){
const R=Object.assign({mode:'rush',diff:1,len:6,phys:1},rules||{})
const DF=DIFFS[R.diff]||DIFFS[1]
const TM=R.mode==='terror'
const KB2=[0,1,2.2][R.phys]??1
const PRP=[0,1,2][R.phys]??1
const dur=R.len>0?R.len*60:0
const pace=dur?Math.max(.6,Math.min(6,360/dur)):1
const n=list.length
const pl=new Map()
list.forEach((m,i)=>pl.set(m.u,{u:m.u,n:m.n,x:500+(i-(n-1)/2)*44,y:560,r:13,hp:Math.round((TM?170:120)*DF.php),max:Math.round((TM?170:120)*DF.php),s:'up',ang:0,spd:TM?170:150,dmg:12,rate:.5,count:1,pierce:0,mag:72,orb:0,nova:0,reg:0,lv:1,xp:0,next:6,cd:0,nv:0,hit:0,inv:0,tcd:0,ammo:[6,3,4],wood:4,hold:0,held:0,rv:0,rvBy:null,bleed:0,mend:1,up:{},offer:null,ot:0,pend:0,k:i,ar:0,arm:0,arr:0,ahit:0,crit:.12,ls:0,area:1,xm:DF.xp,thorn:0,tpc:0,ig:0,ward:0,wt:0,ab:{dash:1},acd:{}}))
const PR=new Map(),pch=new Set()
const bt=dur?[.25,.55,.85].map(f=>Math.max(12,Math.floor(dur*f))):[90]
const S={dur,te:0,nev:55,bm:0,dc:[],pl,en:[],pj:[],eb:[],pd:[],pk:[],gm:[],hp:[],bars:{},dead:new Set(),opened:new Set(),bs:new Map(),cr:new Map(),tw:new Map(),ev:[],out:[],st:'run',kills:0,id:1,time:0,acc:0,bi:0,boss:null,orbA:0}
const alive=()=>[...pl.values()].filter(p=>p.s==='up')
const ev=(...a)=>{if(S.ev.length<80)S.ev.push(a)}
const burst=(x,y,c,k)=>ev('b',Math.round(x),Math.round(y),c,k)
const txt=(x,y,v,c,big)=>ev('t',Math.round(x),Math.round(y),String(v),c,big?1:0)
const wall=(x,y)=>hitWall(x,y,S)
const los=(x0,y0,x1,y1)=>{
const d=Math.hypot(x1-x0,y1-y0),k=Math.ceil(d/22)
for(let i=1;i<k;i++){const f=i/k;if(wall(x0+(x1-x0)*f,y0+(y1-y0)*f))return false}
return true
}
const cd=id=>(S.bs.get(id)||0)
const gain=(p,v)=>{
p.xp+=v*p.xm*(S.bm>0?2:1)
while(p.xp>=p.next){p.xp-=p.next;p.next=Math.floor(p.next*1.32+4);p.lv++;p.pend++}
}
const offer=p=>{
if(p.offer||p.pend<=0||p.s==='dead')return
const pool=UPS.filter(u=>(p.up[u[0]]||0)<u[3])
p.pend--
if(!pool.length){p.hp=Math.min(p.max,p.hp+25);return}
const ids=[]
while(ids.length<3&&pool.length)ids.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0][0])
p.offer=ids;p.ot=16
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
const eh=T0.hp*sc*(hm||1)*DF.hp
S.en.push({id:S.id++,k,x,y,r:T0.r,hp:eh,mx:eh,sp:T0.sp*(.92+Math.random()*.16)*DF.spd,dmg:T0.dmg*DF.dmg,xp:T0.xp,fl:0,oc:0,ph:Math.random()*6,ch:0,bs:Math.random()*2,kx:0,ky:0,sx:1,stun:0})
}
const spawnPos=()=>{
const ps=alive()
if(!ps.length)return null
for(let k=0;k<10;k++){
const p=ps[Math.floor(Math.random()*ps.length)],a=Math.random()*TAU,d=470+Math.random()*60
const x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d
if(!buildingAt({x,y})&&!wall(x,y)&&ps.every(q=>Math.hypot(q.x-x,q.y-y)>380))return[x,y]
}
return null
}
const kindNow=()=>{
const r=Math.random(),t=S.te
if(TM){
if(t>110&&r<.03)return'stitched'
if(t>80&&r<.08)return'wraith'
if(t>60&&r<.12)return'lurker'
if(t>40&&r<.2)return'bat'
if(t>12&&r<.5)return'crawler'
if(t>30&&r<.6)return'ghoul'
return r<.8?'wisp':'bone'
}
let k='wisp'
if(t>150&&r<.03)k='stitched'
else if(t>120&&r<.075)k='reaper'
else if(t>90&&r<.12)k='lurker'
else if(t>70&&r<.17)k='wraith'
else if(t>40&&r<.24)k='bat'
else if(t>25&&r<.34)k='crawler'
else if(t>45&&r<.52)k='ghoul'
else if(t>14&&r<.72)k='bone'
return k
}
const pickE=()=>{
const sp=spawnPos()
if(!sp)return
spawnE(kindNow(),sp[0],sp[1],1+S.te/130,1+.15*(n-1))
}
const ring=(x,y,c,d)=>{for(let i=0;i<c;i++){const a=i/c*TAU,xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d;if(!wall(xx,yy)&&!buildingAt({x:xx,y:yy}))spawnE(kindNow(),xx,yy,1+S.te/130,1+.15*(n-1))}}
const kill=e=>{
S.kills++
e.dead=1
const by=pl.get(e.last)
if(by&&by.ls&&by.s==='up')by.hp=Math.min(by.max,by.hp+by.ls)
if(e.k==='boss'){
S.boss=null
for(let j=0;j<18;j++)S.gm.push({id:S.id++,x:e.x+rnd(-50,50),y:e.y+rnd(-50,50),v:8})
S.hp.push({id:S.id++,x:e.x,y:e.y})
burst(e.x,e.y,'#ffb347',70)
ev('sh',16)
if(dur&&S.bi>=bt.length)S.st='win'
}else{
S.gm.push({id:S.id++,x:e.x,y:e.y,v:e.xp,vx:KB2?rnd(-140,140):0,vy:KB2?rnd(-140,140):0})
if(Math.random()<.035)S.hp.push({id:S.id++,x:e.x+8,y:e.y})
if(Math.random()<.05)S.pk.push({id:S.id++,k:Math.random()<.5?'a':'w',x:e.x-8,y:e.y,life:20})
burst(e.x,e.y,e.k==='wisp'?'#8fe3ff':e.k==='ghoul'?'#8fc060':'#e8e2cc',8)
}
}
const hit=(e,d,crit,by)=>{
if(e.dead)return
e.hp-=d;e.fl=.09;if(by)e.last=by
txt(e.x,e.y-e.r-24,Math.round(d),crit?'#ffe27a':'#ffffff',crit)
if(e.hp<=0)kill(e)
}
const hurtP=(p,d)=>{
if(p.s!=='up'||p.hit>0||p.inv>0)return false
p.hit=.5;p.ahit=0
if(p.ward>0){const a=Math.min(p.ward,d);p.ward-=a;d-=a;burst(p.x,p.y-10,'#ffe27a',8)}
if(d>0&&p.ar>0){const a=Math.min(p.ar,d);p.ar-=a;d-=a;burst(p.x,p.y-10,'#9ab4d8',8)}
if(d<=.1)return true
p.hp-=d
burst(p.x,p.y-10,'#ff4a3a',12)
txt(p.x,p.y-40,'-'+Math.round(d),'#ff6a5a')
ev('hurt',p.u)
if(p.hp<=0){
p.hp=0
if(n>1&&alive().length>1){p.s='down';p.bleed=25;p.rv=0;ev('down',p.u)}
else p.s=n>1?'down':'dead'
if(p.s==='down')p.bleed=25
}
return true
}
const wreck=(o,d,by)=>{
const c=S.cr.get(o.id)||{hp:180}
c.hp-=d;S.cr.set(o.id,c)
if(c.hp<=0){
S.dead.add(o.id)
for(let j=0;j<10;j++)S.gm.push({id:S.id++,x:o.x+rnd(-40,40),y:o.y+rnd(-30,20),v:8})
S.hp.push({id:S.id++,x:o.x,y:o.y+14})
burst(o.x,o.y-12,'#4aff7a',50)
ev('cd',o.id);ev('sh',10);txt(o.x,o.y-60,'Crypt destroyed','#7dff9a',1)
}
}
const crypts=(x,y,r,d,by)=>{
for(const c of around(x,y,1))if(c.o&&c.o.kind==='crypt'&&!S.dead.has(c.o.id)&&Math.hypot(c.o.x-x,c.o.y-12-y)<r+34)wreck(c.o,d,by)
}
const kbP=(p,vx,vy)=>{if(p.s==='up')S.out.push({to:p.u,m:{k:'kb',vx:Math.round(vx),vy:Math.round(vy)}})}
const smash=(o,by)=>{
if(!PR.delete(o.id))return
if(o.k==='b'){blast(o.x,o.y,80,70,by)}
else{burst(o.x,o.y-8,'#a8794a',16);for(let j=0;j<3;j++)S.gm.push({id:S.id++,x:o.x+rnd(-14,14),y:o.y+rnd(-10,10),v:3,vx:rnd(-100,100),vy:rnd(-100,100)});if(Math.random()<.5)S.pk.push({id:S.id++,k:Math.random()<.5?'a':'w',x:o.x,y:o.y,life:20})}
}
const thrust=(x,y,aoe,dmg,by)=>{
for(const o of[...PR.values()]){const dx=o.x-x,dy=o.y-y,d=Math.hypot(dx,dy);if(d<aoe+o.r){o.vx+=dx/(d||1)*380*KB2;o.vy+=dy/(d||1)*380*KB2;o.hp-=dmg*.5;if(o.hp<=0)smash(o,by)}}
}
const blast=(x,y,aoe,dmg,by)=>{
ev('x',Math.round(x),Math.round(y),aoe,3);ev('sh',7)
for(const e of S.en){const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<aoe+e.r){hit(e,dmg*(1-.5*Math.min(1,d/aoe)),false,by);if(e.k!=='boss'){e.kx+=dx/(d||1)*320*KB2;e.ky+=dy/(d||1)*320*KB2}}}
for(const p of alive()){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<aoe){hurtP(p,dmg*.3);kbP(p,dx/(d||1)*420*KB2,dy/(d||1)*420*KB2)}}
thrust(x,y,aoe,dmg,by)
}
const boom=(x,y,w,p)=>{
const s=WP[w],aoe=s.aoe*(p?p.area:1)
ev('x',Math.round(x),Math.round(y),aoe,w)
const k=p?p.dmg/12:1
for(const e of S.en){const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<aoe+e.r){if(s.dmg)hit(e,s.dmg*k*(1-.4*Math.min(1,d/aoe)),false,p&&p.u);if(e.k!=='boss'){e.kx+=dx/(d||1)*260*KB2;e.ky+=dy/(d||1)*260*KB2}}}
if(s.dmg)crypts(x,y,aoe,s.dmg*k)
thrust(x,y,aoe,s.dmg*k,p&&p.u)
if(p&&KB2){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<aoe*.9)kbP(p,dx/(d||1)*300*KB2,dy/(d||1)*300*KB2)}
if(s.pud)S.pd.push({x,y,r:aoe,life:s.pud,k,by:p&&p.u})
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
if(!p||p.s!=='up'||p.ig>0||!isFinite(x)||!isFinite(y))return
p.x=x;p.y=y;p.ang=a
if(dash)p.inv=Math.max(p.inv,.3)
}
S.holdSet=(u,v)=>{const p=pl.get(u);if(p)p.hold=v?1:0}
S.cast=(u,nm)=>{
const p=pl.get(u),lv=p&&p.ab[nm]
if(!p||p.s!=='up'||!lv||nm==='dash'||(p.acd[nm]||0)>0)return
p.acd[nm]=ABI[nm][3]*Math.pow(.85,lv-1)
const k=p.dmg/12,r=Math.round
if(nm==='flare'){
const x=p.x+Math.cos(p.ang)*170,y=p.y+Math.sin(p.ang)*170
ev('x',r(x),r(y),170,4)
for(const e of S.en){const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<170+e.r&&e.k!=='boss'){e.stun=2.5+lv*.8;e.kx+=dx/(d||1)*220;e.ky+=dy/(d||1)*220;hit(e,10*k,false,u)}else if(d<170+e.r)hit(e,10*k,false,u)}
}else if(nm==='ward'){
p.ward=18+lv*14;p.wt=8
ev('x',r(p.x),r(p.y),60,2);txt(p.x,p.y-50,'Ward','#ffe27a',1)
}else if(nm==='rift'){
ev('x',r(p.x),r(p.y),340,5);ev('sh',8)
for(const e of S.en){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);if(d<340&&e.k!=='boss'){const f=Math.max(0,(d-60)/d);e.x+=dx*f*.8;e.y+=dy*f*.8;e.stun=1.2;hit(e,(30+lv*20)*k,false,u)}else if(d<340)hit(e,(30+lv*20)*k,false,u)}
}else if(nm==='drain'){
ev('x',r(p.x),r(p.y),210,6)
let c=0
for(const e of S.en)if(Math.hypot(e.x-p.x,e.y-p.y)<210+e.r){c++;hit(e,(18+lv*12)*k,false,u)}
const h=Math.min(12+lv*10,c*3)
for(const q of alive())if(Math.hypot(q.x-p.x,q.y-p.y)<260){q.hp=Math.min(q.max,q.hp+(q===p?h:h/2));txt(q.x,q.y-44,'+'+Math.round(q===p?h:h/2),'#7dff9a')}
}
}
const seedProps=p=>{
if(!PRP)return
for(const c of around(p.x,p.y,1)){
if(pch.has(c.id))continue
pch.add(c.id)
const k0=hs(c.i,c.j,30)%(PRP>1?7:3)
for(let q=0;q<k0;q++){
const x=c.i*CS+80+rf(c.i,c.j,31+q)*(CS-160),y=c.j*CS+80+rf(c.i,c.j,41+q)*(CS-160)
if(c.b&&x>c.b.x-30&&x<c.b.x+c.b.w+30&&y>c.b.y-30&&y<c.b.y+c.b.h+30)continue
if(c.o&&Math.hypot(x-c.o.x,y-c.o.y)<80)continue
const k=rf(c.i,c.j,51+q)<.5?'b':'c'
PR.set(S.id,{id:S.id++,k,x,y,vx:0,vy:0,hp:k==='b'?30:24,r:12})
}
}
}
const doors=p=>{
let best=null,bd=75
for(const c of around(p.x,p.y,1))if(c.b){const d=c.b.door,k=Math.hypot(d.cx-p.x,d.cy-p.y);if(k<bd){bd=k;best=c.b}}
if(!best)return false
if(S.bars[best.id]>0){S.bars[best.id]=0;p.wood=Math.min(12,p.wood+1)}
else if(p.wood>=2){p.wood-=2;S.bars[best.id]=140}
return true
}
const crate=p=>{
for(const c of around(p.x,p.y,1)){
const b=c.b
if(!b||b.kind!=='armory'||cd(b.id)>0)continue
if(Math.hypot(b.x+b.w/2-p.x,b.y+b.h/2-p.y)<56){S.bs.set(b.id,50);for(let k=0;k<3;k++)p.ammo[k]=Math.min(14,p.ammo[k]+4);p.wood=Math.min(12,p.wood+3);txt(p.x,p.y-48,'Restocked','#ffe27a');burst(p.x,p.y-10,'#ffb347',16);return true}
}
return false
}
const loot=(p,ch)=>{
S.opened.add(ch.id);ev('o',ch.id)
S.dc=S.dc.filter(d=>d.id!==ch.id)
burst(ch.x,ch.y-10,'#ffd93b',24)
for(let j=0;j<4;j++)S.gm.push({id:S.id++,x:ch.x+rnd(-30,30),y:ch.y+rnd(-20,20),v:3})
const r=Math.random()
if(r<.22){p.arm=Math.max(p.arm,40);p.ar=Math.min(p.arm,p.ar+30);txt(p.x,p.y-52,'+30 armor','#9ab4d8',1)}
else if(r<.42){for(let k=0;k<3;k++)p.ammo[k]=Math.min(14,p.ammo[k]+5);txt(p.x,p.y-52,'Ammo stocked','#ffe27a',1)}
else if(r<.58){S.hp.push({id:S.id++,x:ch.x-14,y:ch.y},{id:S.id++,x:ch.x+14,y:ch.y});p.hp=Math.min(p.max,p.hp+30);txt(p.x,p.y-52,'+30 health','#7dff9a',1)}
else if(r<.72){for(const n2 of ABN)p.acd[n2]=0;p.wood=Math.min(12,p.wood+4);txt(p.x,p.y-52,'Abilities ready','#8fe3ff',1)}
else if(r<.86){for(let j=0;j<8;j++)S.gm.push({id:S.id++,x:ch.x+rnd(-40,40),y:ch.y+rnd(-30,30),v:6});txt(p.x,p.y-52,'Gem hoard','#c9a8ff',1)}
else{p.pend++;txt(p.x,p.y-52,'Free level','#ffb347',1)}
tone9()
}
const tone9=()=>ev('sh',3)
const open=(p,ch)=>{
if(TM&&!ch.rich&&((ch.id.length*7+ch.x)|0)%6===0){S.opened.add(ch.id);ev('o',ch.id);ev('n','It was a mimic');ev('sh',10);ring(ch.x,ch.y,5,26);spawnE('lurker',ch.x,ch.y,1+S.te/130,1);return}
loot(p,ch)
if(ch.rich)loot(p,{id:ch.id,x:ch.x,y:ch.y})
}
const chest=p=>{
for(const c of around(p.x,p.y,1))for(const ch of c.ch)if(!S.opened.has(ch.id)&&Math.hypot(ch.x-p.x,ch.y-p.y)<56){open(p,ch);return true}
for(const d of S.dc)if(!S.opened.has(d.id)&&Math.hypot(d.x-p.x,d.y-p.y)<60){open(p,d);return true}
return false
}
const altar=p=>{
for(const c of around(p.x,p.y,1)){
const o=c.o
if(!o||o.kind!=='altar'||cd(o.id)>0||Math.hypot(o.x-p.x,o.y-p.y)>64)continue
S.bs.set(o.id,120)
const r=Math.random()
ev('sh',6);burst(o.x,o.y-14,'#b48aff',30)
if(r<.15){p.dmg*=1.25;txt(p.x,p.y-52,'Power surges','#ffb347',1)}
else if(r<.3){p.max+=40;p.hp=p.max;txt(p.x,p.y-52,'Vitality','#7dff9a',1)}
else if(r<.45){p.arm=Math.max(p.arm,50);p.ar=p.arm;txt(p.x,p.y-52,'Armor of the dead','#9ab4d8',1)}
else if(r<.6){p.pend++;txt(p.x,p.y-52,'Free level','#ffb347',1)}
else{txt(p.x,p.y-52,'Cursed','#ff6a5a',1);p.hp=Math.max(1,p.hp-25);ring(o.x,o.y,8,150);ev('n','The altar bites back')}
return true
}
return false
}
const structs=(p,seen,dt)=>{
for(const c of around(p.x,p.y,1)){
const o=c.o,b=c.b
if(o&&o.kind==='campfire'&&Math.hypot(p.x-o.x,p.y-o.y)<95){p.hp=Math.min(p.max,p.hp+4*dt)}
if(o&&o.kind==='hole'&&p.tpc<=0&&Math.hypot(p.x-o.x,p.y-o.y)<26){
const q=partnerOf(o)
if(q){p.tpc=4;p.x=q.x;p.y=q.y+44;p.ig=.7;p.inv=Math.max(p.inv,1.5);S.out.push({to:p.u,m:{k:'tp',x:Math.round(p.x),y:Math.round(p.y)}});ev('tp',Math.round(o.x),Math.round(o.y));ev('tp',Math.round(q.x),Math.round(q.y));txt(p.x,p.y-48,'Through the tunnel','#c9a8ff',1)}
}
if(o&&!seen.has(o.id)){
seen.add(o.id)
const dd=Math.hypot(p.x-o.x,p.y-o.y)
if(o.kind==='well'&&cd(o.id)<=0&&dd<46){S.bs.set(o.id,40);gain(p,10);txt(p.x,p.y-48,'+10 XP','#8fe3ff');burst(p.x,p.y-10,'#8fe3ff',16)}
else if(o.kind==='shrine'&&cd(o.id)<=0&&dd<44){S.bs.set(o.id,60);for(const k of ABN)p.acd[k]=0;for(let k=0;k<3;k++)p.ammo[k]=Math.min(14,p.ammo[k]+2);if(p.arm)p.ar=Math.min(p.arm,p.ar+15);txt(p.x,p.y-48,'Refreshed','#ffe27a',1);burst(p.x,p.y-10,'#ffe27a',20)}
else if(o.kind==='tower'&&dd<700){
const t=(S.tw.get(o.id)||0)-dt
if(t<=0){
let te=null,bd=380*380
for(const e of S.en){const dx=e.x-o.x,dy=e.y-o.y-40,d=dx*dx+dy*dy;if(d<bd){bd=d;te=e}}
if(te){const a=Math.atan2(te.y-o.y+40,te.x-o.x);S.pj.push({id:S.id++,k:0,x:o.x,y:o.y-40,vx:Math.cos(a)*430,vy:Math.sin(a)*430,life:.9,pr:1,hit:new Set(),a,own:null,d:22});S.tw.set(o.id,.9)}else S.tw.set(o.id,.3)
}else S.tw.set(o.id,t)
}else if(o.kind==='crypt'&&!S.dead.has(o.id)&&dd<650){
const t=(S.tw.get(o.id)||3)-dt
if(t<=0){S.tw.set(o.id,5);if(S.en.length<150)spawnE('crawler',o.x+rnd(-30,30),o.y+20,1+S.time/160,1)}else S.tw.set(o.id,t)
}
}
if(b&&!seen.has(b.id)){
seen.add(b.id)
if(b.kind==='house'&&cd(b.id)<=0&&Math.hypot(b.x+b.w/2-p.x,b.y+b.h/2-p.y)<600){S.bs.set(b.id,90);for(let k=0;k<3;k++)S.gm.push({id:S.id++,x:b.x+b.w/2+rnd(-60,60),y:b.y+b.h/2+rnd(-50,50),v:3})}
}
}
}
S.step=dt=>{
if(S.st!=='run')return
S.time+=dt
S.te=S.time*pace
S.orbA+=dt*2.7
if(S.bm>0)S.bm-=dt
for(const[k,v]of S.bs)if(v>0)S.bs.set(k,Math.max(0,v-dt))
for(const p of pl.values()){
p.cd-=dt;p.tcd=Math.max(0,p.tcd-dt);p.hit-=dt;p.inv-=dt;p.ahit+=dt;p.tpc-=dt;p.ig-=dt
for(const k in p.acd)p.acd[k]=Math.max(0,p.acd[k]-dt)
if(p.wt>0){p.wt-=dt;if(p.wt<=0)p.ward=0}
if(p.s==='down'){p.bleed-=dt;if(p.bleed<=0)p.s='dead'}
if(p.offer){p.ot-=dt;if(p.ot<=0)S.pick(p.u,p.offer[0])}
else if(p.pend>0)offer(p)
if(p.s==='up'&&p.reg)p.hp=Math.min(p.max,p.hp+p.reg*dt)
if(p.s==='up'&&p.arr&&p.ahit>4)p.ar=Math.min(p.arm,p.ar+2*p.arr*dt)
if(p.s==='up'){const b=buildingAt(p);if(b&&b.kind==='chapel')p.hp=Math.min(p.max,p.hp+3.2*dt)}
}
for(const p of pl.values()){
if(p.s!=='up'){p.held=p.hold;continue}
let nr=null
for(const q of pl.values())if(q.s==='down'&&Math.hypot(q.x-p.x,q.y-p.y)<56)nr=q
if(p.hold&&nr){nr.rv+=dt/p.mend;nr.rvBy=p.u;if(nr.rv>=2.5){nr.s='up';nr.hp=nr.max*.4;nr.rv=0;nr.inv=1.5;txt(nr.x,nr.y-44,'Revived','#7dff9a',1)}}
else if(p.hold&&!p.held){if(!chest(p)&&!altar(p)&&!doors(p))crate(p)}
p.held=p.hold
}
for(const q of pl.values())if(q.s==='down'){const r=q.rvBy&&pl.get(q.rvBy);if(!(r&&r.hold&&r.s==='up'&&Math.hypot(r.x-q.x,r.y-q.y)<56))q.rv=Math.max(0,q.rv-dt*2)}
const ps=alive()
const seen=new Set()
for(const p of ps){structs(p,seen,dt);seedProps(p)}
if(S.time>=S.nev&&ps.length){
S.nev=S.time+rnd(70,110)
const r=Math.random(),p=ps[Math.floor(Math.random()*ps.length)]
if(r<.34){S.bm=40;ev('n','Blood moon rises');ev('sh',8)}
else if(r<.68){
const a=Math.random()*TAU,d=320+Math.random()*130,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d
if(!wall(x,y)&&!buildingAt({x,y})){S.dc.push({id:'d'+S.id++,x:Math.round(x),y:Math.round(y),rich:1});ev('n','Supply drop landed')}
}else{ev('n','A horde approaches');ring(p.x,p.y,22,480)}
}
S.acc+=dt*Math.min(7,.65+S.te/40)*(1+.5*(n-1))*DF.sp*(S.bm>0?1.8:1)*(TM?1.15:1)
const cap=Math.min(230,70+Math.min(190,S.te*.62))*(1+.35*(n-1))
while(S.acc>=1){S.acc--;if(S.en.length<Math.min(210,cap)&&ps.length)pickE()}
if(!dur&&S.bi>=bt.length)bt.push(bt[bt.length-1]+110)
if(S.bi<bt.length&&S.time>=bt[S.bi]&&!S.boss&&ps.length){
const sp=spawnPos()
if(sp){
const bh=dur?Math.max(.35,Math.min(1,dur/360)):1+S.bi*.25
spawnE('boss',sp[0],sp[1],1+S.bi*.5,(1+.6*(n-1))*bh)
const nm=BN[TM?1:0]
S.boss=S.en[S.en.length-1];S.boss.name=nm[S.bi%3]+(S.bi>=3?' '+(Math.floor(S.bi/3)+1):'');S.bi++
ev('n',S.boss.name)
}
}
if(dur&&S.time>=dur&&S.st==='run')S.st='win'
for(const p of ps){
if(p.cd<=0){
let t=null,bd=420*420
for(const e of S.en){const dx=e.x-p.x,dy=e.y-p.y,d=dx*dx+dy*dy;if(d<bd&&los(p.x,p.y,e.x,e.y)){bd=d;t=e}}
if(t){
p.cd=p.rate
const a=Math.atan2(t.y-p.y,t.x-p.x),sp=p.count>1?.17:0
p.ang=a
for(let i=0;i<p.count;i++){const o=a+(i-(p.count-1)/2)*sp;S.pj.push({id:S.id++,k:0,x:p.x,y:p.y,vx:Math.cos(o)*430,vy:Math.sin(o)*430,life:1.05,pr:p.pierce,hit:new Set(),a:o,own:p.u,d:p.dmg})}
}
}
if(p.nova){p.nv-=dt;if(p.nv<=0){p.nv=p.nova;ev('x',Math.round(p.x),Math.round(p.y),210,9);for(const e of S.en){const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<210*210){hit(e,p.dmg*2.6,false,p.u);const d=Math.hypot(dx,dy)||1;e.kx+=dx/d*260;e.ky+=dy/d*260}}}}
for(let i=0;i<p.orb;i++){
const a=S.orbA+i*TAU/p.orb,x=p.x+Math.cos(a)*66,y=p.y+Math.sin(a)*66
for(const e of S.en){const dx=e.x-x,dy=e.y-y,mm=e.r+12;if(e.oc<=0&&dx*dx+dy*dy<mm*mm){hit(e,p.dmg*.9,false,p.u);e.oc=.35}}
}
}
for(const e of S.en){
if(e.dead)continue
e.cd=Math.max(0,(e.cd||0)-dt)
e.fl-=dt;e.oc-=dt
let t=null,bd=1e9
for(const p of ps){const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<bd){bd=d;t=p}}
if(!t)continue
if(bd>1300&&e.k!=='boss'){e.dead=1;continue}
if(e.stun>0){e.stun-=dt;e.x+=e.kx*dt;e.y+=e.ky*dt;e.kx*=.86;e.ky*=.86;push(e,near(e.x,e.y),S);continue}
const eb=buildingAt(e),tb=buildingAt(t)
let tx=t.x,ty=t.y
if(e.lv){const d=e.lv.door;tx=eb?d.ox:d.fx;ty=eb?d.oy:d.fy;if(Math.hypot(e.x-tx,e.y-ty)<30)e.lv=null}
else if(e.en){const d=e.en.door;tx=d.ix;ty=d.iy;if(eb===e.en||tb!==e.en)e.en=null}
else if(eb&&eb!==tb){const d=eb.door;tx=d.ix;ty=d.iy;if(Math.hypot(e.x-tx,e.y-ty)<28)e.lv=eb}
else if(tb&&eb!==tb){const d=tb.door;tx=d.ox;ty=d.oy;if(Math.hypot(e.x-tx,e.y-ty)<28)e.en=tb}
const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1
let sp=e.sp,ux=dx/d,uy=dy/d
const cx=t.x-e.x,cy=t.y-e.y,dp=Math.hypot(cx,cy)||1
if(eb&&eb.kind==='chapel')sp*=.5
if(e.k==='boss'){
e.bs+=dt
if(e.bs>4.6){e.bs=0;for(let j=0;j<2;j++)spawnE('wisp',e.x+rnd(-50,50),e.y+rnd(-50,50),1+S.te/130)}
e.ch+=dt
if(e.ch>8.5)e.ch=-1
if(e.ch<0){sp*=2.2;e.ch-=dt;if(e.ch<-.8)e.ch=0}
}else if(e.k==='ghoul'||e.k==='lurker'){
e.ch+=dt
if(e.ch>3.6+e.ph*.2)e.ch=-.45
if(e.ch<0){sp*=3.4;e.ch+=dt*2}
}else if(e.k==='bone'){
e.bs+=dt
if(dp<300&&dp>110&&eb===tb){sp*=.35;if(e.bs>2.4){e.bs=0;const a=Math.atan2(cy,cx);S.eb.push({x:e.x,y:e.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170,life:3,a:0,d:e.dmg,id:S.id++})}}
}
const w=Math.sin(S.time*(e.k==='bat'?9:3)+e.ph)*(e.k==='bat'?.9:.3)
const mx=(ux+(-uy)*w)*sp*dt+e.kx*dt,my=(uy+ux*w)*sp*dt+e.ky*dt
e.x+=mx;e.y+=my
if(Math.abs(cx)>3)e.sx=cx>0?1:-1
e.kx*=.86;e.ky*=.86
const rs=near(e.x,e.y)
const h=push(e,rs,S)
if(h&&h.bar!==undefined)S.bars[h.bar]=Math.max(0,S.bars[h.bar]-e.dmg*dt*2.2)
else if(h){
e.sc=(e.sc||0)+dt
if(e.sc>8){e.sc=0;e.side=-(e.side||1)}
const sd=e.side||(e.side=Math.random()<.5?1:-1)
if(h.w>h.h)e.x+=sd*e.sp*dt;else e.y+=sd*e.sp*dt
push(e,rs,S)
}else e.sc=Math.max(0,(e.sc||0)-dt)
if(bd<e.r+9&&hurtP(t,e.dmg)&&t.thorn)hit(e,t.thorn,false,t.u)
}
for(const o of PR.values()){
if(!ps.some(p=>Math.abs(p.x-o.x)<900&&Math.abs(p.y-o.y)<700))continue
if(o.vx*o.vx+o.vy*o.vy>.5){o.x+=o.vx*dt;o.y+=o.vy*dt;const f=Math.pow(.04,dt);o.vx*=f;o.vy*=f}
for(const p of ps){const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy),m=o.r+p.r;if(d<m&&d>.01){o.x+=dx/d*(m-d);o.y+=dy/d*(m-d);o.vx+=dx/d*30*KB2;o.vy+=dy/d*30*KB2}}
for(const e of S.en){const dx=o.x-e.x;if(dx>60||dx<-60)continue;const dy=o.y-e.y,d=Math.hypot(dx,dy),m=o.r+e.r;if(d<m&&d>.01){o.x+=dx/d*(m-d)*.6;o.y+=dy/d*(m-d)*.6;o.vx+=dx/d*(e.k==='boss'?160:40)*KB2;o.vy+=dy/d*(e.k==='boss'?160:40)*KB2;if(o.vx*o.vx+o.vy*o.vy>40000&&e.k!=='boss')hit(e,o.k==='b'?8:5,false,null)}}
const q=push(o,near(o.x,o.y),S)
if(q){if(q.w>q.h)o.vy*=-.4;else o.vx*=-.4}
}
for(const g2 of S.gm){
if(g2.vx||g2.vy){const nx=g2.x+g2.vx*dt,ny=g2.y+g2.vy*dt;if(wall(nx,g2.y))g2.vx*=-.5;else g2.x=nx;if(wall(g2.x,ny))g2.vy*=-.5;else g2.y=ny;const f=Math.pow(.02,dt);g2.vx*=f;g2.vy*=f;if(Math.abs(g2.vx)+Math.abs(g2.vy)<5)g2.vx=g2.vy=0}
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
if(wall(p.x,p.y)||p.life<=0){p.dead=1;continue}
const own=pl.get(p.own),dm=s?s.dmg*(own?own.dmg/12:1):p.d
const cc=own?own.crit:.12
for(const c of around(p.x,p.y,0))if(c.o&&c.o.kind==='crypt'&&!S.dead.has(c.o.id)&&Math.hypot(c.o.x-p.x,c.o.y-12-p.y)<34&&p.own!==null){wreck(c.o,dm,p.own);p.dead=1}
for(const o of PR.values()){if(Math.abs(o.x-p.x)<o.r+8&&Math.abs(o.y-p.y)<o.r+8){o.hp-=dm;o.vx+=p.vx*.18*KB2;o.vy+=p.vy*.18*KB2;burst(p.x,p.y,'#ffd27a',3);p.dead=1;if(o.hp<=0)smash(o,p.own);break}}
if(p.dead)continue
for(const e of S.en){
if(e.dead||p.hit.has(e.id))continue
const dx=e.x-p.x,dy=e.y-p.y-4,mm=e.r+5
if(dx*dx+dy*dy<mm*mm){
p.hit.add(e.id)
const crit=Math.random()<cc
hit(e,dm*(crit?2:1),crit,p.own)
e.kx+=p.vx*.12;e.ky+=p.vy*.12
burst(p.x,p.y,'#ffd27a',3)
if(p.pr--<=0){p.dead=1;break}
}
}
}
for(const b of S.eb){
b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.a+=dt*14
if(wall(b.x,b.y)){b.life=0;continue}
for(const p of ps)if(Math.hypot(p.x-b.x,p.y-b.y)<14){hurtP(p,b.d);b.life=0;break}
}
for(const d of S.pd){d.life-=dt;for(const e of S.en)if(Math.hypot(e.x-d.x,e.y-d.y)<d.r+e.r)hit(e,14*d.k*dt,false,d.by)}
for(const g2 of S.gm){
let best=null,bd=1e9
for(const p of ps){const d=Math.hypot(p.x-g2.x,p.y-g2.y);if(d<bd){bd=d;best=p}}
if(!best)continue
if(bd<best.mag||g2.pull){g2.pull=1;const s=260+(1-Math.min(1,bd/500))*300;g2.x+=(best.x-g2.x)/(bd||1)*s*dt;g2.y+=(best.y-g2.y)/(bd||1)*s*dt}
if(bd<14){gain(best,g2.v);g2.got=1}
}
for(const h2 of S.hp)for(const p of ps)if(!h2.got&&Math.hypot(p.x-h2.x,p.y-h2.y)<22&&p.hp<p.max){p.hp=Math.min(p.max,p.hp+18);h2.got=1;txt(p.x,p.y-44,'+18','#7dff9a');burst(h2.x,h2.y,'#ff7a8a',10)}
for(const k of S.pk){k.life-=dt;for(const p of ps)if(!k.got&&Math.hypot(p.x-k.x,p.y-k.y)<24){k.got=1;if(k.k==='w')p.wood=Math.min(12,p.wood+2);else{const i=Math.floor(Math.random()*3);p.ammo[i]=Math.min(14,p.ammo[i]+3)}}}
S.en=S.en.filter(e=>!e.dead)
S.pj=S.pj.filter(p=>!p.dead)
S.eb=S.eb.filter(b=>b.life>0)
S.pd=S.pd.filter(d=>d.life>0)
S.gm=S.gm.filter(g2=>!g2.got)
S.hp=S.hp.filter(h2=>!h2.got)
S.pk=S.pk.filter(k=>k.life>0&&!k.got)
if(!alive().length)S.st='lose'
}
S.snap=()=>{
const r=Math.round,r2=x=>Math.round(x*100)/100
const all=[...pl.values()]
const nr=o=>all.some(p=>Math.abs(p.x-o.x)<760&&Math.abs(p.y-o.y)<520)
const o={k:'s',tm:r2(S.time),st:S.st,kl:S.kills,
p:all.map(p=>[p.u,r(p.x),r(p.y),r(p.hp),r(p.max),p.s,r2(p.ang),p.lv,r(p.xp),p.next,p.orb,p.ammo,p.wood,r2(p.rv),p.inv>0?1:0,p.hit>0?1:0,p.offer?1:0,r(p.ar),r(p.arm),ABN.map(k=>[p.ab[k]||0,Math.ceil(p.acd[k]||0)]),r(p.ward),p.spd]),
e:S.en.filter(nr).map(e=>[e.id,e.k,r(e.x),r(e.y),r(e.hp),r(e.mx),e.ch<0?1:0,r(e.ph*10),e.sx,e.fl>0?1:0,e.stun>0?1:0]),
j:S.pj.filter(nr).map(p=>[p.id,p.k,r(p.x),r(p.y),r(p.vx),r(p.vy),r2(p.a)]),
q:S.eb.filter(nr).map(b=>[b.id,r(b.x),r(b.y),r(b.vx),r(b.vy)]),
g:S.gm.filter(nr).map(g2=>[r(g2.x),r(g2.y),g2.v]),
l:S.hp.filter(nr).map(h2=>[r(h2.x),r(h2.y)]),
d:S.pd.map(d=>[r(d.x),r(d.y),r(d.r)]),
c:S.pk.map(k=>[k.id,k.k,r(k.x),r(k.y)]),
b:Object.entries(S.bars).filter(a=>a[1]>0).map(a=>[a[0],r(a[1])]),
z:[...S.bs].filter(a=>a[1]>0).map(a=>[a[0],r(a[1])]),
pr:[...PR.values()].filter(nr).map(o=>[o.id,o.k,r(o.x),r(o.y)]),dc:S.dc.map(d=>[d.id,d.x,d.y]),bm:Math.ceil(S.bm),bo:S.boss&&!S.boss.dead?[S.boss.name,r(S.boss.hp),r(S.boss.mx)]:0,
v:S.ev}
S.ev=[]
return o
}
return S
}
