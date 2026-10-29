import{kit,txt}from'./kit.js'
import{lg,rg,draw}from'./dsart.js'
import{pcap}from'/js/perf.js'
const VW=960,VH=540,WW=2400,WH=1600,TAU=6.283
const F='Georgia,"Times New Roman",serif'
const cl=(v,a,b)=>Math.max(a,Math.min(b,v))
const rnd=(a,b)=>a+Math.random()*(b-a)
const LAVA=[[800,520,120],[1640,500,110],[520,1020,130],[1900,1040,120],[1200,1120,95]]
const CH=[[320,320],[2080,280],[420,1260],[2040,1240],[1200,1500],[740,820],[1680,820],[260,780],[2150,760]]
const seed=n=>{let s=n;return()=>(s=(s*16807)%2147483647)/2147483647}
function ground(S){
const c=document.createElement('canvas');c.width=Math.ceil(WW*S);c.height=Math.ceil(WH*S)
const g=c.getContext('2d');g.scale(S,S);g.lineJoin='round';g.lineCap='round'
const R=seed(11)
g.fillStyle=lg(g,0,0,0,WH,[[0,'#1a0a1e'],[1,'#2a0a14']]);g.fillRect(0,0,WW,WH)
for(let i=0;i<260;i++){const x=R()*WW,y=R()*WH,w=40+R()*120,h=30+R()*80;g.beginPath();g.ellipse(x,y,w,h,R()*3,0,TAU);g.fillStyle='rgba('+(30+R()*30|0)+',10,'+(26+R()*20|0)+',.35)';g.fill()}
g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=3
for(let i=0;i<150;i++){let x=R()*WW,y=R()*WH;g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++){x+=rnd(-70,70);y+=rnd(-70,70);g.lineTo(x,y)}g.stroke()}
g.strokeStyle='rgba(255,90,40,.18)';g.lineWidth=1.5
for(let i=0;i<90;i++){let x=R()*WW,y=R()*WH;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=rnd(-50,50);y+=rnd(-50,50);g.lineTo(x,y)}g.stroke()}
for(const[x,y,r]of LAVA){g.fillStyle=rg(g,x,y,r*.4,r*1.9,[[0,'rgba(255,120,30,.5)'],[1,'rgba(255,60,20,0)']]);g.fillRect(x-r*2,y-r*2,r*4,r*4);g.beginPath();g.ellipse(x,y,r*1.15,r*.82,0,0,TAU);g.fillStyle='#2a0806';g.fill();g.beginPath();g.ellipse(x,y,r,r*.7,0,0,TAU);g.fillStyle=rg(g,x-r*.2,y-r*.15,4,r,[[0,'#fff0a0'],[.35,'#ffb030'],[.75,'#e8481a'],[1,'#9a1a0a']]);g.fill();g.strokeStyle='#140404';g.lineWidth=4;g.stroke()}
g.beginPath();g.ellipse(1200,520,330,200,0,0,TAU);g.fillStyle='#241222';g.fill();g.strokeStyle='#0c040c';g.lineWidth=5;g.stroke()
g.beginPath();g.ellipse(1200,520,290,170,0,0,TAU);g.strokeStyle='rgba(255,100,160,.35)';g.lineWidth=3;g.stroke()
for(let i=0;i<10;i++){const a=i/10*TAU,x=1200+Math.cos(a)*230,y=520+Math.sin(a)*130;g.fillStyle='rgba(255,100,160,.5)';g.font='700 26px serif';g.textAlign='center';g.fillText('✧',x,y+8)}
for(let i=0;i<70;i++){const x=R()*WW,y=R()*WH;let near=false;for(const[lx,ly,lr]of LAVA)if(Math.hypot(x-lx,y-ly)<lr*1.3)near=true;if(near)continue;g.fillStyle='#d8d0b8';g.beginPath();g.ellipse(x,y,9,6,R(),0,TAU);g.fill();g.strokeStyle='#140b1c';g.lineWidth=1.6;g.stroke();g.fillStyle='#d8d0b8';g.fillRect(x+6,y-3,16,4)}
for(let i=0;i<26;i++){const x=R()*WW,y=R()*WH;g.fillStyle='#0c040c';g.beginPath();g.moveTo(x,y);g.lineTo(x+6,y-90);g.lineTo(x+16,y-130);g.lineTo(x+10,y-90);g.lineTo(x+40,y-120);g.lineTo(x+14,y-70);g.lineTo(x+14,y);g.fill()}
return c
}
export function death(box,A,B,done){
const touch=matchMedia('(pointer:coarse)').matches
const S=Math.min(1,.55+((window.__perf||{gpu:2}).gpu)*.15)
const G=ground(S)
const vig=document.createElement('canvas');vig.width=VW;vig.height=VH
{const g=vig.getContext('2d');g.fillStyle=rg(g,VW/2,VH/2,VH*.28,VW*.65,[[0,'rgba(0,0,0,0)'],[1,'rgba(14,0,10,.85)']]);g.fillRect(0,0,VW,VH)}
let sc=1,ox=0,oy=0,time=0
let P,boss,en,bu,eb,chests,fx,tx,cam,cap,banner,shake,flash,phase,intro,over,result,hit,tries=0,endT=0,slow=1
const reset=()=>{
P={x:1200,y:1380,vx:0,vy:0,hp:100,max:100,pot:2,bag:0,f:1,walk:0,dash:0,dashCd:0,inv:0,cd:0,dm:1,form:0,kits:0,pc:0}
boss={x:1200,y:480,hp:2600,max:2600,st:'wait',t:2,tx:0,ty:0,fr:0,pat:0,hurt:0,sm:0,cd:0,aim:0,wt:0,dir:1,slam2:0}
en=[];bu=[];eb=[];fx=[];tx=[];cam={x:1200-VW/2,y:1380-VH/2}
chests=CH.map(([x,y])=>({x,y,o:0}))
cap={t:'',s:0};banner={t:'DEEP DEATH',s:3.4};shake=0;flash=0;phase=1;intro=4.2;over=0;result=null;hit=0;endT=0;slow=1
say('Welcome to where the fear goes. I harvested every last drop of you.',4)
}
const say=(t,s)=>{cap={t,s}}
const burst=(x,y,n,col,sp,life)=>{for(let i=0;i<n&&fx.length<pcap()*2;i++){const a=Math.random()*TAU,v=rnd(.3,1)*(sp||160);fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.3,1)*(life||.7),m:life||.7,c:col||'#ffb347',r:rnd(2,5)})}}
const num=(x,y,s,c)=>tx.push({x,y,s,c:c||'#fff',l:.9})
const hurt=(d,src)=>{if(P.inv>0||over)return;const dd=Math.round(d*(P.form?.65:1));P.hp-=dd;P.inv=.5;shake=Math.max(shake,8);flash=.25;num(P.x,P.y-60,'-'+dd,'#ff6a6a');burst(P.x,P.y-30,10,'#ff4a4a',200)}
const nearest=()=>{let b=null,bd=1e9;const all=boss.hp>0&&boss.st!=='wait'?[boss,...en]:en;for(const e of all){const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}return b}
const shoot=(ax,ay)=>{const a=Math.atan2(ay-P.y+30,ax-P.x),v=720,n=P.form?3:1;for(let i=0;i<n;i++){const aa=a+(n>1?(i-1)*.14:0);bu.push({x:P.x,y:P.y-30,vx:Math.cos(aa)*v,vy:Math.sin(aa)*v,l:.9,d:Math.round(16*P.dm*(P.form?1.7:1)),p:P.form?2:0,r:P.form?9:6,hit:[]})}P.cd=P.form?.17:.25;burst(P.x+Math.cos(a)*24,P.y-30+Math.sin(a)*24,3,'#bfe6ff',120,.25)}
const spawnBlob=()=>{const a=Math.random()*TAU;en.push({x:cl(boss.x+Math.cos(a)*120,60,WW-60),y:cl(boss.y+Math.sin(a)*100,60,WH-60),hp:48,max:48,fr:Math.random()*2,cd:0,hurt:0,blob:1});burst(boss.x,boss.y,14,'#8a4a2a',200)}
const usePot=()=>{if(P.pot>0&&P.hp<P.max&&!over){P.pot--;P.hp=Math.min(P.max,P.hp+45);num(P.x,P.y-70,'+45','#7dffa0');burst(P.x,P.y-30,14,'#7dffa0',140)}}
const useKit=()=>{if(P.kits>0&&!P.form&&!over){P.kits--;P.form=18;shake=14;flash=.6;burst(P.x,P.y-40,40,'#c88aff',320,1);say('TRUE FORM. Whatever you were afraid of, you are now.',2.6)}}
const dash=()=>{if(P.dashCd>0||over||intro>0)return;const mx=(k.keys.d||k.keys.arrowright?1:0)-(k.keys.a||k.keys.arrowleft?1:0),my=(k.keys.s||k.keys.arrowdown?1:0)-(k.keys.w||k.keys.arrowup?1:0);let dx=mx,dy=my;if(!dx&&!dy)dx=P.f;const l=Math.hypot(dx,dy);P.vx=dx/l*760;P.vy=dy/l*760;P.dash=.2;P.inv=Math.max(P.inv,.32);P.dashCd=1.1;burst(P.x,P.y-20,10,'#bfe6ff',100,.3)}
const openChest=c=>{
c.o=1;burst(c.x,c.y-20,24,'#ffe27a',260,.9);shake=Math.max(shake,5)
const r=Math.random()
if(r<.1){P.kits++;num(c.x,c.y-50,'True Form Kit','#c88aff');say('A True Form Kit. Press R to unleash it.',3)}
else if(r<.1+.42){const n=Math.random()<.4?2:1,cp=3+2*P.bag;const g=Math.min(n,cp-P.pot);P.pot+=Math.max(0,g);num(c.x,c.y-50,'Life Potion x'+n,'#ff9aa8')}
else if(r<.1+.42+.2){if(P.bag<3){P.bag++;num(c.x,c.y-50,'Backpack: +2 potion slots','#8ae88a')}else{P.pot=Math.min(3+2*P.bag,P.pot+2);num(c.x,c.y-50,'Life Potion x2','#ff9aa8')}}
else if(r<.1+.42+.2+.14){P.dm*=1.18;num(c.x,c.y-50,'Dream Shard: +18% damage','#9ad8ff')}
else{P.max+=25;P.hp=Math.min(P.max,P.hp+40);num(c.x,c.y-50,'Heart Fruit: +25 max health','#ff7aa0')}
}
const bossHurt=(d,x,y)=>{boss.hp-=d;boss.hurt=.1;num(x,y,String(d),'#ffe9a8');burst(x,y,4,'#8a4a2a',160,.4);if(phase===1&&boss.hp<boss.max*.66){phase=2;shake=16;banner={t:'PHASE TWO',s:2};say('You cannot harvest what is already empty!',3)}else if(phase===2&&boss.hp<boss.max*.33){phase=3;shake=20;banner={t:'ENRAGED',s:2};say('SWEET DREAMS. SWEET DREAMS. SWEET DREAMS.',3)}
if(boss.hp<=0&&!over){over=1;result='win';endT=0;slow=.25;shake=26;flash=1;burst(boss.x,boss.y-80,90,'#ffb347',520,1.4);for(const e of en)e.hp=0}}
const step=(rdt,k)=>{
const dt=rdt*slow
time+=rdt
sc=Math.min(k.W/VW,k.H/VH);ox=(k.W-VW*sc)/2;oy=(k.H-VH*sc)/2
if(banner.s>0)banner.s-=rdt
if(cap.s>0)cap.s-=rdt
if(intro>0){intro-=rdt;if(intro<=0)boss.st='idle'}
shake=Math.max(0,shake-rdt*30);flash=Math.max(0,flash-rdt*1.6)
if(over===1){endT+=rdt;slow=Math.min(1,.25+endT*.15);if(result==='win'&&endT>3.2){over=2;done&&done('win')}return}
if(over===2)return
P.inv=Math.max(0,P.inv-dt);P.cd=Math.max(0,P.cd-dt);P.dashCd=Math.max(0,P.dashCd-dt)
if(P.form>0){P.form-=dt;if(P.form<=0){P.form=0;say('The form fades. You are small again.',2)}}
if(P.dash>0){P.dash-=dt;P.x+=P.vx*dt;P.y+=P.vy*dt;if(Math.random()<.6)fx.push({x:P.x,y:P.y-20,vx:0,vy:0,l:.25,m:.25,c:'#bfe6ff',r:6})}
else{
let mx=(k.keys.d||k.keys.arrowright?1:0)-(k.keys.a||k.keys.arrowleft?1:0),my=(k.keys.s||k.keys.arrowdown?1:0)-(k.keys.w||k.keys.arrowup?1:0)
if(touch&&k.down&&!btnHit){const wx=(k.px-ox)/sc+cam.x,wy=(k.py-oy)/sc+cam.y,dx=wx-P.x,dy=wy-P.y,d=Math.hypot(dx,dy);if(d>26){mx=dx/d;my=dy/d}}
const l=Math.hypot(mx,my)
const sp=210*(P.form?1.18:1)
if(l){P.vx+=(mx/l*sp-P.vx)*Math.min(1,dt*12);P.vy+=(my/l*sp-P.vy)*Math.min(1,dt*12);P.walk+=dt;if(mx)P.f=mx>0?1:-1}else{P.vx*=Math.max(0,1-dt*12);P.vy*=Math.max(0,1-dt*12)}
P.x+=P.vx*dt;P.y+=P.vy*dt
}
P.x=cl(P.x,40,WW-40);P.y=cl(P.y,60,WH-40)
for(const[lx,ly,lr]of LAVA){const dx=(P.x-lx)/(lr*1.0),dy=(P.y-ly)/(lr*.7);if(dx*dx+dy*dy<1&&P.dash<=0){P.hp-=16*dt;P.pc+=dt;if(P.pc>.25){P.pc=0;num(P.x,P.y-60,'-4','#ff9a3a');burst(P.x,P.y,4,'#ff8a1a',100,.4);P.inv=Math.max(P.inv,0)}}}
if(P.hp<=0&&!over){over=1;result='lose';endT=0;slow=.3;burst(P.x,P.y-30,40,'#9ad8ff',300,1)}
let ax=null,ay=null
if(touch){if(k.down&&!btnHit){const t=nearest();if(t){ax=t.x;ay=t.y-30}}}
else{if(k.down&&!btnHit){ax=(k.px-ox)/sc+cam.x;ay=(k.py-oy)/sc+cam.y}else if(k.keys.j||k.keys.enter){const t=nearest();if(t){ax=t.x;ay=t.y-30}}}
if(ax!=null&&P.cd<=0&&intro<=0)shoot(ax,ay)
for(const c of chests)if(!c.o&&Math.hypot(P.x-c.x,P.y-c.y)<50)openChest(c)
if(boss.hp>0&&boss.st!=='wait')bossAI(dt)
boss.hurt=Math.max(0,boss.hurt-dt);boss.fr+=dt
for(const e of en){if(e.hp<=0)continue;e.fr+=dt*6;e.hurt=Math.max(0,e.hurt-dt);e.cd=Math.max(0,e.cd-dt);const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*(phase===3?120:98)*dt;e.y+=dy/d*(phase===3?120:98)*dt;if(d<34&&e.cd<=0){e.cd=.7;hurt(9)}}
for(const b of bu){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt
if(boss.hp>0&&boss.st!=='wait'&&!b.hit.includes('b')&&Math.hypot(b.x-boss.x,b.y-(boss.y-70))<70){b.hit.push('b');bossHurt(b.d,b.x,b.y-10);if(b.p--<=0)b.l=0}
for(const e of en)if(e.hp>0&&!b.hit.includes(e)&&Math.hypot(b.x-e.x,b.y-(e.y-20))<30){b.hit.push(e);e.hp-=b.d;e.hurt=.1;num(e.x,e.y-40,String(b.d),'#ffe9a8');burst(e.x,e.y-20,6,'#8a4a2a',160,.4);if(e.hp<=0){burst(e.x,e.y-20,18,'#8a4a2a',240);if(Math.random()<.22&&P.pot<3+2*P.bag){P.pot++;num(e.x,e.y-60,'Life Potion','#ff9aa8')}}if(b.p--<=0)b.l=0}}
bu=bu.filter(b=>b.l>0&&b.x>0&&b.x<WW&&b.y>0&&b.y<WH)
en=en.filter(e=>e.hp>0)
for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;if(Math.hypot(b.x-P.x,b.y-(P.y-26))<20){b.l=0;hurt(b.d)}}
eb=eb.filter(b=>b.l>0)
for(const f of fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.96;f.vy*=.96;f.l-=dt}
fx=fx.filter(f=>f.l>0)
for(const t of tx){t.y-=36*dt;t.l-=dt}
tx=tx.filter(t=>t.l>0)
const tx2=P.x-VW/2,ty2=P.y-VH/2
cam.x+=(cl(tx2,0,WW-VW)-cam.x)*Math.min(1,dt*6);cam.y+=(cl(ty2,0,WH-VH)-cam.y)*Math.min(1,dt*6)
}
let btnHit=false
function bossAI(dt){
const b=boss,dx=P.x-b.x,dy=P.y-b.y,d=Math.hypot(dx,dy)||1
b.dir=dx>0?1:-1
b.cd=Math.max(0,b.cd-dt)
const spd=[0,92,112,138][phase]
if(b.st==='idle'){
b.x+=dx/d*spd*dt;b.y+=dy/d*spd*dt
b.t-=dt
if(d<80&&b.cd<=0){b.cd=.8;hurt(18)}
if(b.t<=0){
const opts=phase===1?['slam','lunge']:phase===2?['slam','lunge','volley','summon']:['slam','lunge','volley','summon','ring']
let a=opts[Math.floor(Math.random()*opts.length)]
if(a==='summon'&&en.length>=(phase===2?3:4))a='slam'
b.st=a;b.t=a==='slam'?.95:a==='lunge'?.65:a==='summon'?1:.8;b.tx=P.x;b.ty=P.y;b.sm=0
if(a==='lunge'){b.aim=Math.atan2(dy,dx)}
}
}else if(b.st==='slam'){
b.t-=dt;b.sm=1-b.t/.95
if(b.t<=0){const r=130;burst(b.tx,b.ty,40,'#ff8a3a',380,.8);shake=Math.max(shake,14);if(Math.hypot(P.x-b.tx,P.y-b.ty)<r)hurt(36);if(phase===3&&b.slam2<1){b.slam2=1;b.st='slam';b.t=.7;b.tx=P.x+P.vx*.4;b.ty=P.y+P.vy*.4}else{b.slam2=0;b.st='idle';b.t=[0,2.2,1.7,1.3][phase]}}
}else if(b.st==='lunge'){
b.t-=dt
if(b.t>0){b.aim=Math.atan2(P.y-b.y,P.x-b.x)}
else{b.x+=Math.cos(b.aim)*760*dt;b.y+=Math.sin(b.aim)*760*dt;b.wt+=dt;if(Math.random()<.7)fx.push({x:b.x,y:b.y-40,vx:0,vy:0,l:.3,m:.3,c:'#8a4a2a',r:12});if(d<80&&b.cd<=0){b.cd=.6;hurt(28)}if(b.wt>.4||b.x<60||b.x>WW-60||b.y<60||b.y>WH-60){b.wt=0;b.st='idle';b.t=[0,2.2,1.7,1.3][phase]}}
}else if(b.st==='volley'){
b.t-=dt
if(b.t<=0){const a0=Math.atan2(dy,dx);for(let i=-3;i<=3;i++)eb.push({x:b.x,y:b.y-60,vx:Math.cos(a0+i*.2)*300,vy:Math.sin(a0+i*.2)*300,l:3,d:10});shake=Math.max(shake,6);b.st='idle';b.t=[0,2.2,1.7,1.3][phase]}
}else if(b.st==='ring'){
b.t-=dt
if(b.t<=0){for(let i=0;i<18;i++){const a=i/18*TAU;eb.push({x:b.x,y:b.y-60,vx:Math.cos(a)*250,vy:Math.sin(a)*250,l:3.4,d:10})}shake=Math.max(shake,8);b.st='idle';b.t=[0,2.2,1.7,1.3][phase]}
}else if(b.st==='summon'){
b.t-=dt
if(b.t<=0){const n=Math.min(2,(phase===2?3:4)-en.length);for(let i=0;i<n;i++)spawnBlob();b.st='idle';b.t=[0,2.4,2,1.6][phase]}
}
b.x=cl(b.x,70,WW-70);b.y=cl(b.y,100,WH-60)
}
const draw2=(c,k)=>{
c.fillStyle='#000';c.fillRect(0,0,k.W,k.H)
c.save();c.translate(ox,oy);c.scale(sc,sc);c.beginPath();c.rect(0,0,VW,VH);c.clip()
const sx=shake?(Math.random()-.5)*shake:0,sy=shake?(Math.random()-.5)*shake:0
c.translate(-Math.round(cam.x)+sx,-Math.round(cam.y)+sy)
c.drawImage(G,0,0,WW,WH)
for(const[lx,ly,lr]of LAVA){c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,120,40,'+(.12+.05*Math.sin(time*3+lx))+')';c.beginPath();c.ellipse(lx,ly,lr*1.5,lr*1.1,0,0,TAU);c.fill();c.restore()}
for(const ch of chests)draw(c,A2.chest[ch.o],ch.x,ch.y,1.2)
const ents=[]
ents.push({y:P.y,f:()=>{c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(P.x,P.y+2,P.form?34:22,P.form?10:7,0,0,TAU);c.fill();const fr=Math.floor(P.walk*8)%2,fl=P.inv>0&&Math.floor(time*30)%2;if(fl)c.globalAlpha=.45;if(P.form){draw(c,A2.form[fr],P.x,P.y+Math.sin(time*6)*2,1.15,P.f<0)}else{draw(c,A.kid.cloud[(Math.abs(P.vx)+Math.abs(P.vy)>20)?fr:0],P.x,P.y-(Math.abs(P.vx)+Math.abs(P.vy)>20?Math.abs(Math.sin(P.walk*8))*3:0),1.25,P.f<0)}c.globalAlpha=1}})
for(const e of en)ents.push({y:e.y,f:()=>{if(e.hurt>0)c.globalAlpha=.6;draw(c,A2.blob[Math.floor(e.fr)%2],e.x,e.y,1.1);c.globalAlpha=1}})
if(boss.hp>0||over===1)ents.push({y:boss.y,f:()=>{
const b=boss,st=b.st,fr=st==='slam'||st==='summon'||st==='volley'||st==='ring'?2:(Math.floor(b.fr*3)%2)
if(over===1&&b.hp<=0){c.globalAlpha=Math.max(0,1-endT*.4)}
c.save();c.translate(b.x,b.y);c.fillStyle='rgba(0,0,0,.42)';c.beginPath();c.ellipse(0,2,90,20,0,0,TAU);c.fill()
if(st==='wait')c.globalAlpha=Math.min(1,(4.2-intro)/2)
if(b.hurt>0){c.filter='brightness(2.2)'}
const sq=st==='lunge'&&b.t>0?1-.12*(1-b.t/.65):1
c.scale((b.dir<0?-1:1)*1.15*(2-sq),1.15*sq);c.drawImage(B.boss[fr].c,-120,-244,240,250);c.restore();c.filter='none';c.globalAlpha=1
c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(c,b.x,b.y-120,0,170,[[0,'rgba(255,140,60,'+(.18+.06*Math.sin(time*4))+')'],[1,'rgba(0,0,0,0)']]);c.fillRect(b.x-170,b.y-290,340,340);c.restore()}})
ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f()
if(boss.st==='slam'||boss.st==='lunge'){const sl=boss.st==='slam';c.save();c.globalAlpha=.25+.3*(sl?boss.sm:1-boss.t/.65);c.fillStyle='#ff3a2a';if(sl){c.beginPath();c.ellipse(boss.tx,boss.ty,130,130*.7,0,0,TAU);c.fill();c.strokeStyle='#ff8a6a';c.lineWidth=4;c.globalAlpha=.9;c.stroke();c.beginPath();c.ellipse(boss.tx,boss.ty,130*boss.sm,130*boss.sm*.7,0,0,TAU);c.stroke()}else{c.translate(boss.x,boss.y);c.rotate(boss.aim);c.fillRect(0,-34,520,68)}c.restore()}
for(const b of bu){c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(c,b.x,b.y,0,b.r*3,[[0,'rgba(190,230,255,.9)'],[1,'rgba(60,120,255,0)']]);c.fillRect(b.x-b.r*3,b.y-b.r*3,b.r*6,b.r*6);c.restore();c.fillStyle='#fff';c.beginPath();c.arc(b.x,b.y,b.r*.6,0,TAU);c.fill()}
for(const b of eb){c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.fillStyle='#6a3a1e';c.beginPath();c.moveTo(14,0);c.lineTo(-10,-6);c.lineTo(-6,0);c.lineTo(-10,6);c.closePath();c.fill();c.strokeStyle='#140b1c';c.lineWidth=2;c.stroke();c.restore();c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(c,b.x,b.y,0,18,[[0,'rgba(255,120,50,.5)'],[1,'rgba(0,0,0,0)']]);c.fillRect(b.x-18,b.y-18,36,36);c.restore()}
c.save();c.globalCompositeOperation='lighter';for(const f of fx){const a=Math.max(0,f.l/f.m);c.fillStyle=f.c;c.globalAlpha=a;c.beginPath();c.arc(f.x,f.y,f.r*a+1,0,TAU);c.fill()}c.restore()
for(const t of tx){c.globalAlpha=Math.min(1,t.l*2);txt(c,t.s,t.x,t.y,t.s.length>6?18:22,t.c,'center')}c.globalAlpha=1
for(let i=0;i<5;i++){const y=700+i*220,o=(time*18*(1+i*.3)+i*300)%3000;c.fillStyle='rgba(120,40,80,.06)';c.beginPath();c.ellipse(o-300,y,500,40,0,0,TAU);c.fill()}
c.restore()
c.save();c.translate(ox,oy);c.scale(sc,sc);c.drawImage(vig,0,0)
if(flash>0){c.fillStyle='rgba(255,255,255,'+Math.min(.8,flash)+')';c.fillRect(0,0,VW,VH)}
hud(c)
c.restore()
}
const A2=B
function hud(c){
c.fillStyle='rgba(10,6,16,.8)';c.beginPath();c.roundRect(14,14,236,64,16);c.fill();c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=1.5;c.stroke()
c.fillStyle='#2a1018';c.beginPath();c.roundRect(24,24,216,16,8);c.fill();c.fillStyle=lg(c,0,24,0,40,[[0,'#ff7a8a'],[1,'#c81e3a']]);c.beginPath();c.roundRect(24,24,Math.max(0,216*P.hp/P.max),16,8);c.fill()
txt(c,Math.max(0,Math.ceil(P.hp))+' / '+P.max,132,37,12,'#fff','center')
for(let i=0;i<3+2*P.bag;i++){c.globalAlpha=i<P.pot?1:.22;draw(c,B.potion,34+i*22,70,.7)}c.globalAlpha=1
if(P.bag)draw(c,B.pack,226,70,.7)
if(P.kits)draw(c,B.kit,198,70,.7)
if(P.form>0){c.fillStyle='rgba(10,6,16,.8)';c.beginPath();c.roundRect(14,86,236,22,11);c.fill();c.fillStyle=lg(c,0,0,236,0,[[0,'#c88aff'],[1,'#6a2ad0']]);c.beginPath();c.roundRect(18,90,228*P.form/18,14,7);c.fill();txt(c,'TRUE FORM',132,102,11,'#fff','center')}
const opened=chests.filter(x=>x.o).length
txt(c,'Chests '+opened+'/'+chests.length,VW-16,30,15,'#e8e0c8','right')
if(!touch)txt(c,'Aim and fire: mouse  |  Dash: Space  |  Potion: Q  |  True Form: R  |  Pause: P',VW/2,VH-12,12,'rgba(255,255,255,.4)','center')
if(boss.hp>0&&boss.st!=='wait'){const w=520,x=(VW-w)/2;c.fillStyle='rgba(10,6,16,.82)';c.beginPath();c.roundRect(x-8,10,w+16,40,12);c.fill();c.fillStyle='#2a1018';c.beginPath();c.roundRect(x,32,w,10,5);c.fill();c.fillStyle=lg(c,x,0,x+w,0,[[0,'#ffb347'],[1,'#e8481a']]);c.beginPath();c.roundRect(x,32,w*Math.max(0,boss.hp/boss.max),10,5);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.fillRect(x+w*.33,30,2,14);c.fillRect(x+w*.66,30,2,14);txt(c,'DR. COCOA, THE FARMER',VW/2,26,14,'#ffd9a0','center')}
if(touch){c.globalAlpha=.7;for(const[b,l]of[[[VW-70,VH-70],'Dash'],[[VW-160,VH-60],'Potion'],[[VW-240,VH-50],'Form']]){c.fillStyle='rgba(20,10,30,.8)';c.beginPath();c.arc(b[0],b[1],32,0,TAU);c.fill();c.strokeStyle='rgba(255,255,255,.3)';c.stroke();txt(c,l,b[0],b[1]+5,13,'#fff','center')}c.globalAlpha=1}
if(banner.s>0){const a=Math.min(1,banner.s,(3.4-banner.s)*2+.0);c.globalAlpha=Math.min(1,banner.s*1.2);c.font='900 74px '+F;c.textAlign='center';c.fillStyle='rgba(0,0,0,.6)';c.fillText(banner.t,VW/2+3,VH/2-60+3);c.fillStyle='#ff4a3a';c.shadowColor='#ff2010';c.shadowBlur=24;c.fillText(banner.t,VW/2,VH/2-60);c.shadowBlur=0;c.textAlign='left';c.globalAlpha=1}
if(cap.s>0&&cap.t){c.globalAlpha=Math.min(1,cap.s*2);c.fillStyle='rgba(10,6,16,.86)';c.beginPath();c.roundRect(110,VH-92,VW-220,56,16);c.fill();c.font='italic 600 19px '+F;c.fillStyle='#ffe9c8';c.textAlign='center';c.fillText(cap.t,VW/2,VH-58);c.textAlign='left';c.globalAlpha=1}
if(over===1&&result==='lose'&&endT>1.2){c.fillStyle='rgba(0,0,0,.65)';c.fillRect(0,0,VW,VH);txt(c,'You fall.',VW/2,VH/2-10,54,'#fff','center');txt(c,'Tap or press Enter to rise again',VW/2,VH/2+30,18,'#c9c8c1','center')}
}
const k=kit(box,step,draw2)
k.press=c=>{if(over===1&&result==='lose'&&endT>1.2&&c==='enter'){tries++;reset();return}if(c===' '||c==='shift')dash();else if(c==='q'||c==='1')usePot();else if(c==='r')useKit()}
k.tap=(x,y)=>{const wx=(x-ox)/sc,wy=(y-oy)/sc;btnHit=false;if(over===1&&result==='lose'&&endT>1.2){tries++;reset();return}if(touch){for(const[bx,by,fn]of[[VW-70,VH-70,dash],[VW-160,VH-60,usePot],[VW-240,VH-50,useKit]])if(Math.hypot(wx-bx,wy-by)<40){btnHit=true;fn();return}}}
reset()
return()=>k.stop()
}
