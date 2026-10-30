const TAU=Math.PI*2
const AW=['Hi! I am Tesvin. I help!','I am always at the front. Funny.','You all stand behind me a lot.','Nobody has asked how I am doing.','Why do monsters always hit the TV first?','You keep walking me toward the danger.','I am counting how many times you hid behind me.','Something is wrong. I can feel it.']
const BL=new Set(['x','y','hp','s','ang','cd','nv','hit','inv','tcd','rv','rvBy','bleed','hold','held','offer','ot','pend','lv','xp','next','lair','ret','lt','tpc','ig','ahit','sp','bl','gi','vm','bh','hpt','bk','cmb','fl','wc','k','u','n','r','dp','dh','sf'])
export const SGD={lab:90,world:55,cheat:20,fair:7,brit:34}
export function makeSaga(X){
const{S,pl,test,n,ev,txt,hurtP,kbP,spawnE,alive,UPS,ABN,CS,LI,offer,rnd,kl}=X
const st={ph:0,t:0,lk:0,tv:null,a:null,idx:0,pi:0,pr:new Map(),base:new Map(),po:[],sk:[],hs:0,ad:0,dm:0,qt:0,qi:0,hc:0,tc:0,pd:test===2?35:300}
st.tv={x:500,y:520,m:0,cd:1,hop:0,sx:1}
const RM=i=>{const ox=i*CS;return{x:ox+120,y:240,w:760,h:520,ox}}
const cp=b=>({...b,ammo:[...b.ammo],up:{...b.up},ab:{...b.ab},acd:{...b.acd}})
const tp=(p,x,y)=>{p.x=x;p.y=y;p.ig=.6;p.inv=Math.max(p.inv,1.5);S.out.push({to:p.u,m:{k:'tp',x:Math.round(x),y:Math.round(y)}})}
const clear=()=>{S.en.length=0;S.eb.length=0;S.pj.length=0}
const ring=(a,i,m,r)=>{const q=i/m*TAU;return[a.x+Math.cos(q)*r,a.y+Math.sin(q)*r]}
const pic=()=>{const l=alive();return l[Math.floor(Math.random()*l.length)]}
const arena=()=>{
ev('sg','a',Math.round(st.a.x),Math.round(st.a.y),st.a.r)
}
const land=()=>{
const l=alive()
l.forEach((p,i)=>{const[x,y]=ring(st.a,i,Math.max(1,l.length),280);p.lair=0;p.lt=100;p.ret=null;tp(p,x,y)})
ev('sg','fall')
}
const end=()=>{
st.ph=12;st.lk=0;st.sk=[];st.a=null
ev('sg','ao')
}
const start=(p0,idx)=>{
st.ph=1;st.t=0;st.lk=1;st.idx=idx
const r=RM(idx),l=alive()
st.a={x:p0.ret?p0.ret[0]:p0.x,y:p0.ret?p0.ret[1]:p0.y,r:620}
l.forEach((p,i)=>{if(p.lair!==idx){p.ret=[p.x,p.y]}p.lair=idx;p.lt=1e9;p.tpc=3;tp(p,r.ox+500+(i-(l.length-1)/2)*52,700);p.lt=1e9})
clear()
st.tv.x=r.ox+500;st.tv.y=420
S.ts=Math.max(S.ts,SGD.lab)
ev('cs','tlab')
}
const swarm=()=>{
const r=RM(st.idx),ks=['ghoul','lurker','bone','crawler','wisp']
for(let i=0;i<8;i++){spawnE(ks[i%5],r.x+60+Math.random()*(r.w-120),r.y+40+Math.random()*(r.h*.5),1+S.te/220,1);S.en[S.en.length-1].lair=st.idx}
}
const sinkAt=(x,y)=>{st.sk.push({x,y,r:150,age:-1.3,life:10});ev('sg','hpc',Math.round(st.tv.x),Math.round(st.tv.y),Math.round(x),Math.round(y),1.3)}
const apply=()=>{
for(const p of alive()){
st.base.set(p.u,cp(p))
const ids=st.pr.get(p.u)||[]
for(const id of ids){
if(id.startsWith('ab:')){const k=id.slice(3);if(ABN.includes(k))p.ab[k]=(p.ab[k]||0)+1}
else{const u=UPS.find(q=>q[0]===id);if(u&&(p.up[id]||0)<u[3]){u[4](p);p.up[id]=(p.up[id]||0)+1}}
}
if(p.hp>p.max)p.hp=p.max
}
}
const strip=()=>{
for(const p of alive()){
const b=st.base.get(p.u)
if(!b)continue
for(const k in b)if(!BL.has(k)){const v=b[k];p[k]=Array.isArray(v)?[...v]:v&&typeof v==='object'?{...v}:v}
p.hp=Math.min(p.hp,p.max)
}
ev('sg','strip')
}
const ally=dt=>{
const tv=st.tv,l=alive().filter(p=>!p.lair)
if(!l.length)return
if(!st.tj){st.tj=1;tv.x=l[0].x+40;tv.y=l[0].y-30}
let t=null,bd=1e9
for(const p of l){const d=Math.hypot(p.x-tv.x,p.y-tv.y);if(d<bd){bd=d;t=p}}
const ox=Math.sin(S.time*.7)*90,oy=Math.cos(S.time*.9)*70
const dx=t.x+ox-tv.x,dy=t.y+oy-tv.y,d=Math.hypot(dx,dy)
if(d>520){tv.x=t.x+ox;tv.y=t.y+oy}else if(d>22){const sp=Math.min(d*3,210)*dt;tv.x+=dx/d*sp;tv.y+=dy/d*sp;if(Math.abs(dx)>2)tv.sx=dx>0?1:-1}
tv.cd-=dt
if(tv.cd<=0){let e0=null,b2=520*520;for(const e of S.en){if(e.al)continue;const q=(e.x-tv.x)**2+(e.y-tv.y)**2;if(q<b2){b2=q;e0=e}}
if(e0){tv.cd=.4;const a=Math.atan2(e0.y-tv.y,e0.x-tv.x);S.pj.push({id:S.id++,k:0,x:tv.x,y:tv.y-10,vx:Math.cos(a)*470,vy:Math.sin(a)*470,life:1.1,pr:1,hit:new Set(),a,own:t.u,d:t.dmg*1.1+S.te*.08,h:0})}}
tv.sl=(tv.sl??6)-dt;tv.hl=(tv.hl??15)-dt;tv.dsh=(tv.dsh||0)-dt
if(tv.sl<=0){let c=0;for(const e of S.en)if(!e.al&&Math.hypot(e.x-tv.x,e.y-tv.y)<420)c++;if(c>=2){tv.sl=11;for(let i=0;i<14;i++){const q=i/14*Math.PI*2;S.pj.push({id:S.id++,k:0,x:tv.x,y:tv.y-10,vx:Math.cos(q)*430,vy:Math.sin(q)*430,life:1,pr:2,hit:new Set(),a:q,own:t.u,d:t.dmg*2.2+S.te*.1,h:0})}ev('x',Math.round(tv.x),Math.round(tv.y),200,10);ev('sh',6);ev('sg','q','Glitch slam!',0)}else tv.sl=2}
if(tv.hl<=0){const w=l.filter(p=>p.hp<p.max*.6).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(w){tv.hl=22;w.hp=Math.min(w.max,w.hp+w.max*.3);txt(w.x,w.y-46,'+Patch','#58ffd0',1);ev('sg','q','Hot patch. You are welcome.',0)}else tv.hl=3}
st.qt-=dt
if(st.qt<=0){st.qt=24;const i=Math.min(AW.length-1,Math.floor(S.time/42));ev('sg','q',AW[i],i)}
}
const boundTo=(o,r)=>{o.x=Math.max(r.x+30,Math.min(r.x+r.w-30,o.x));o.y=Math.max(r.y+30,Math.min(r.y+r.h-30,o.y))}
const step=dt=>{
if(st.ph>=1&&st.ph<=11)S.acc=0
if(st.ph>=1&&st.ph<=11)S.nev=S.time+999
if(test===2&&st.ph===0&&st.tv&&S.time>6){const p=pic();if(p)start(p,LI+1234)}
st.t+=dt
const tv=st.tv
if(!tv)return
const ph=st.ph,l=alive()
if(ph===0){ally(dt);return}
if(ph===1){if(st.t>=SGD.lab){st.ph=2;st.t=0;tv.m=1;swarm();ev('sg','chase')}return}
if(ph===2){
const r=RM(st.idx)
let t=null,bd=1e9
for(const p of l){const d=Math.hypot(p.x-tv.x,p.y-tv.y);if(d<bd){bd=d;t=p}}
if(t){const sp=(175+st.t*5)*dt,d=bd||1;tv.x+=(t.x-tv.x)/d*sp;tv.y+=(t.y-tv.y)/d*sp;tv.sx=t.x>tv.x?1:-1}
boundTo(tv,r)
tv.cd-=dt
for(const p of l)if(Math.hypot(p.x-tv.x,p.y-tv.y)<52&&(p.sfc||0)<=0){p.sfc=.9;hurtP(p,16+S.te*.05);kbP(p,(p.x-tv.x)*7,(p.y-tv.y)*7);ev('sh',9)}
for(const p of l)if(p.sfc>0)p.sfc-=dt
for(const e of S.en){
const d=Math.hypot(e.x-tv.x,e.y-tv.y)
if(d<190&&d>60){e.kx+=(e.x-tv.x)/d*260;e.ky+=(e.y-tv.y)/d*260}
if(d<62){e.dead=1;ev('sg','gb',Math.round(e.x),Math.round(e.y));ev('gl',.4)}
}
if(S.en.length<7&&Math.random()<dt*2)swarm()
if(st.t>=26){clear();st.ph=3;st.t=0;tv.x=RM(st.idx).ox+500;tv.y=480;S.ts=Math.max(S.ts,SGD.world);ev('cs','tworld')}
return
}
if(ph===3){
if(st.t>=SGD.world){const a=st.a;tv.x=a.x;tv.y=a.y-250;arena();land();st.ph=4;st.t=0;st.tc=1;S.ts=0;ev('sg','p4')}
return
}
if(ph===4){
tv.x=st.a.x;tv.y=st.a.y-250
st.tc-=dt
if(st.tc<=0&&l.length){st.tc=.8;const t=pic(),a=Math.atan2(t.y-tv.y,t.x-tv.x)
for(const o of(Math.random()<.25?[-.3,-.15,0,.15,.3]:[0]))S.eb.push({x:tv.x,y:tv.y,vx:Math.cos(a+o)*310,vy:Math.sin(a+o)*310,life:2.6,a:0,d:12+S.te*.06,id:S.id++,kd:7,rr:26})
ev('sg','th')}
if(st.t>=20){S.eb.length=0;st.ph=5;st.t=0;st.pr.clear();ev('sg','p10')}
return
}
if(ph===5){
const need=l.filter(p=>!st.pr.has(p.u))
if(!need.length||st.t>45){
for(const p of need){const all=[...UPS.map(u=>u[0]),...ABN.map(k=>'ab:'+k)],ids=[];for(let i=0;i<10;i++)ids.push(all[Math.floor(Math.random()*all.length)]);st.pr.set(p.u,ids)}
apply();st.ph=6;st.t=0;S.ts=Math.max(S.ts,SGD.cheat);ev('cs','tcheat')
}
return
}
if(ph===6){
if(!st.sd&&st.t>=7){st.sd=1;strip()}
if(st.t>=SGD.cheat){st.sd=0;st.ph=7;st.t=0;st.pi=LI+2600;const r=RM(st.pi);l.forEach((p,i)=>{p.lair=st.pi;p.lt=1e9;p.ret=null;p.hp=p.max;tp(p,r.ox+300+i*70,640)});st.po=[];st.oc=0;ev('sg','pond',st.pi,Math.round(st.pd))}
return
}
if(ph===7){
const r=RM(st.pi)
for(const p of l){p.lt=1e9;boundTo(p,r)}
st.oc-=dt
if(st.oc<=0&&st.po.length<9){st.oc=4.5;st.po.push({id:S.id++,x:r.x+50+Math.random()*(r.w-100),y:r.y+50+Math.random()*(r.h-100)})}
for(const o of st.po)for(const p of l)if(!o.got&&Math.hypot(p.x-o.x,p.y-o.y)<30){o.got=1;p.pend++;txt(p.x,p.y-48,'Power','#8fe3ff',1);ev('sg','orb',Math.round(o.x),Math.round(o.y))}
st.po=st.po.filter(o=>!o.got)
st.qt-=dt
if(st.qt<=0){st.qt=50;ev('n',['Keep swimming. I made the water for you.','Collect your little powers.','Tick tock, tiny friends.'][Math.floor(Math.random()*3)])}
if(st.t>=st.pd){st.ph=8;st.t=0;S.ts=Math.max(S.ts,SGD.fair);ev('cs','tfair')}
return
}
if(ph===8){
if(st.t>=SGD.fair){
land()
for(const p of alive()){p.hp=p.max}
const a=st.a,e0=spawnE('boss',a.x,a.y-200,1+S.bi*.5,(1+.6*(n-1))*(test===2?1.6:3.2))
const e=S.en[S.en.length-1]
e.name='Tesvin';e.tes=1;e.lair=0;S.boss=e;S.bi++
ev('n','Tesvin');st.ph=9;st.t=0;st.mx=e.mx;st.dm=0;tv.m=2
}
return
}
const b=S.boss
if(ph===9||ph===11){
if(!b||b.dead)return
const lost=b.mx-b.hp
if(lost>=st.ad+b.mx*.07){st.ad+=b.mx*.07;for(const p of alive()){p.pend++;txt(p.x,p.y-54,'Power surge','#ffd27a',1)}ev('sg','surge')}
if(ph===9&&b.hp<=b.mx*.62){st.ph=10;st.t=0;S.ts=Math.max(S.ts,SGD.brit);ev('cs','tbrit')}
if(ph===11){
st.hc-=dt
if(st.hc<=0){st.hc=5.2;const p=pic();if(p){tv.x=b.x;tv.y=b.y;sinkAt(p.x+(Math.random()-.5)*60,p.y+(Math.random()-.5)*60)}}
for(const k of st.sk){k.age+=dt}
for(const p of alive()){
let ins=0
for(const k of st.sk)if(k.age>=0&&Math.hypot(p.x-k.x,p.y-k.y)<k.r)ins=k
if(ins){p.sf=(p.sf||0)+dt/2.2;kbP(p,(ins.x-p.x)*.7,(ins.y-p.y)*.7);if(p.dp&&p.sf>0){p.sf=0;p.inv=Math.max(p.inv,.5)}
if(p.sf>=1){p.sf=0;hurtP(p,p.max*.25);const[x,y]=ring(st.a,Math.random()*12,12,200);tp(p,x,y);ev('sg','fall')}}
else p.sf=Math.max(0,(p.sf||0)-dt*1.5)
p.dp=0
}
st.sk=st.sk.filter(k=>k.age<k.life)
}
return
}
if(ph===10){if(st.t>=SGD.brit){st.ph=11;st.t=0;st.hc=1.5;ev('sg','hpf')}}
}
return{
st,
enter:(p,idx)=>{if(st.ph!==0||!st.tv||S.st!=='run')return false;start(p,idx);return true},
step,
end,
p10:(u,ids)=>{if(st.ph===5&&Array.isArray(ids)&&!st.pr.has(u))st.pr.set(u,ids.slice(0,10).map(String))},
snap:()=>st.tv?[st.ph,[Math.round(st.tv.x),Math.round(st.tv.y),st.tv.m,st.tv.sx],st.a?[Math.round(st.a.x),Math.round(st.a.y),st.a.r]:0,Math.max(0,Math.round(st.pd-st.t)),st.po.map(o=>[Math.round(o.x),Math.round(o.y)]),st.sk.map(k=>[Math.round(k.x),Math.round(k.y),k.r,Math.round(k.age*10)/10]),alive().filter(p=>p.sf>0).map(p=>[p.u,Math.round(p.sf*100)/100]),st.pi]:0
}
}
