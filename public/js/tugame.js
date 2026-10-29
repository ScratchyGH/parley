import{h}from'./util.js'
import{createSim,W,H,BUILDINGS,DOORS,WALLS,rectsFor,buildingAt,push,WP}from'./tusim.js'
const COL=['#ff9d2e','#6ec1ff','#9be564']
const EC={wisp:'#7fd8ff',ghoul:'#6fa05a',bone:'#e9e4d2',reaper:'#7a3fbf',boss:'#d6353a'}
const WN=['Gourd','Candy bomb','Spice grenade','Ghost pepper']
const WC=['#ff9d2e','#ff5fa2','#ffd93b','#ff3b30']
const hash=(i,j)=>{let x=(i*73856093)^(j*19349663);x=Math.imul(x^x>>>13,1274126177);return((x^x>>>16)>>>0)/4294967295}
const cv=(w,hh)=>{const c=document.createElement('canvas');c.width=w;c.height=hh;return c}
function buildWorld(){
const g=cv(W,H),x=g.getContext('2d')
const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1f2a18');gr.addColorStop(1,'#16200f')
x.fillStyle=gr;x.fillRect(0,0,W,H)
for(let i=0;i<W;i+=26)for(let j=0;j<H;j+=26){
const r=hash(i,j)
if(r<.22){x.fillStyle=r<.1?'rgba(90,120,50,.35)':'rgba(10,18,8,.4)';x.fillRect(i+hash(j,i)*20,j+hash(i+1,j)*20,3+r*14,2)}
}
x.strokeStyle='rgba(88,66,40,.55)';x.lineWidth=46;x.lineCap='round'
x.beginPath()
BUILDINGS.forEach((b,i)=>{const d=DOORS[i];x.moveTo(d.ox,d.oy);x.lineTo(W/2,H/2)})
x.stroke()
x.strokeStyle='rgba(120,92,58,.25)';x.lineWidth=30;x.stroke()
for(let k=0;k<70;k++){
const px=hash(k,3)*W,py=hash(k,9)*H
if(BUILDINGS.some(b=>px>b.x-30&&px<b.x+b.w+30&&py>b.y-30&&py<b.y+b.h+30))continue
if(k%3===0){x.fillStyle='#2b2f2a';x.fillRect(px,py,16,22);x.fillStyle='#3b403a';x.fillRect(px,py,16,5)}
else if(k%3===1){x.fillStyle='#e47a1a';x.beginPath();x.ellipse(px,py,10,8,0,0,7);x.fill();x.fillStyle='#4a6b17';x.fillRect(px-1,py-12,3,5)}
else{x.fillStyle='#12200c';x.beginPath();x.arc(px,py,28,0,7);x.fill();x.fillStyle='#1c3014';x.beginPath();x.arc(px-5,py-6,20,0,7);x.fill()}
}
BUILDINGS.forEach(b=>{
x.fillStyle='#5a3d22';x.fillRect(b.x,b.y,b.w,b.h)
for(let j=b.y;j<b.y+b.h;j+=18){x.fillStyle=hash(j,b.x)<.5?'#6b4a2b':'#634426';x.fillRect(b.x,j,b.w,17)}
x.fillStyle='rgba(0,0,0,.16)'
for(let i=b.x+40;i<b.x+b.w;i+=70)x.fillRect(i,b.y,2,b.h)
})
x.fillStyle='#2a1a0e'
for(const q of WALLS)if(q.x>=0&&q.y>=0&&q.x<W&&q.y<H){x.fillRect(q.x,q.y,q.w,q.h);x.fillStyle='#4a2f19';x.fillRect(q.x,q.y,q.w,Math.min(4,q.h));x.fillStyle='#2a1a0e'}
const roofs=BUILDINGS.map(b=>{
const c=cv(b.w,b.h),y=c.getContext('2d')
y.fillStyle='#6e2a22';y.fillRect(0,0,b.w,b.h)
for(let j=0;j<b.h;j+=22){y.fillStyle=j%44?'#7d3228':'#612219';y.fillRect(0,j,b.w,21)}
for(let i=0;i<b.w;i+=34){y.fillStyle='rgba(0,0,0,.18)';y.fillRect(i,0,2,b.h)}
y.fillStyle='#3b150f';y.fillRect(0,b.h/2-4,b.w,8)
y.strokeStyle='#2a0f0b';y.lineWidth=6;y.strokeRect(3,3,b.w-6,b.h-6)
return c
})
return{g,roofs}
}
export function playTeamup({box,me,list,host,hostUid,send,onEnd}){
const names=new Map(list.map(m=>[m.u,m.n]))
const idx=new Map(list.map((m,i)=>[m.u,i]))
const world=buildWorld()
const cvs=h('canvas',{class:'tu-cv'})
const ctx=cvs.getContext('2d')
const wb=h('div',{class:'tu-wb'})
const eb=h('button',{class:'btn tu-e',type:'button'},'Use')
const info=h('div',{class:'tu-msg'})
const endBox=h('div',{class:'tu-end'})
box.append(cvs,wb,eb,info,endBox)
let sim=null
if(host){sim=createSim(list)}
const V={pl:new Map(),en:new Map(),pj:new Map(),pk:[],pd:[],bars:DOORS.map(()=>0),wave:0,st:'wait',tm:0,n:0,kl:0,fx:[]}
const L={x:W/2,y:H/2,w:0,ang:0,keys:new Set(),mx:0,my:0,fire:false,jid:null,jx:0,jy:0,jdx:0,jdy:0,aid:null,cd:0,hold:0,sent:0}
const fade=BUILDINGS.map(()=>0)
let vw=0,vh=0,sc=1,camx=0,camy=0,dead=false,done=false,raf=0,last=performance.now(),acc=0,snapAcc=0,ping=0
const resize=()=>{const r=box.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);vw=r.width;vh=r.height;cvs.width=vw*d;cvs.height=vh*d;ctx.setTransform(d,0,0,d,0,0);sc=Math.max(.55,Math.min(1.3,Math.min(vw/960,vh/620)))}
resize()
const ro=new ResizeObserver(resize);ro.observe(box)
const mine=()=>V.pl.get(me)
const apply=sn=>{
V.wave=sn.w;V.st=sn.st;V.tm=sn.tm;V.n=sn.n;V.kl=sn.kl;V.bars=sn.b
const seen=new Set()
for(const[u,x,y,hp,s,a,w,am,wood,rv]of sn.p){
seen.add(u)
let o=V.pl.get(u)
if(!o){o={u,x,y,tx:x,ty:y,hp,s,a,w:0,am,wood,rv};V.pl.set(u,o)}
o.tx=x;o.ty=y;o.hp=hp;o.s=s;o.am=am;o.wood=wood;o.rv=rv
if(u!==me){o.a=a;o.w=w}
}
const ids=new Set()
for(const[id,t,x,y,hp,mx]of sn.e){
ids.add(id)
let o=V.en.get(id)
if(!o){o={id,t,x,y,tx:x,ty:y};V.en.set(id,o)}
o.tx=x;o.ty=y;o.hp=hp;o.mx=mx
}
for(const k of[...V.en.keys()])if(!ids.has(k))V.en.delete(k)
const pj=new Set()
for(const[id,k,x,y,a]of sn.j){
pj.add(id)
let o=V.pj.get(id)
if(!o){o={id,k,x,y,tx:x,ty:y,a};V.pj.set(id,o)}
o.tx=x;o.ty=y
}
for(const k of[...V.pj.keys()])if(!pj.has(k))V.pj.delete(k)
V.pk=sn.c;V.pd=sn.d
for(const[x,y,r,w]of sn.v)V.fx.push({x,y,r,w,t:.45})
}
const solid=()=>rectsFor(V.bars)
const key=(e,v)=>{
const k=e.key.toLowerCase()
if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){v?L.keys.add(k):L.keys.delete(k);e.preventDefault()}
if(v&&k>='1'&&k<='4'){L.w=Number(k)-1;draw()}
if(v&&k==='q'){L.w=(L.w+1)%4;draw()}
if(k==='e'){setHold(v?1:0)}
}
const kd=e=>key(e,1),ku=e=>key(e,0)
const setHold=v=>{
if(L.hold===v)return
L.hold=v
if(host)sim.holdSet(me,v);else send({k:'h',v})
}
addEventListener('keydown',kd);addEventListener('keyup',ku)
const pos=e=>{const r=cvs.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cvs.addEventListener('contextmenu',e=>e.preventDefault())
cvs.addEventListener('pointerdown',e=>{
const[x,y]=pos(e)
cvs.setPointerCapture(e.pointerId)
if(e.pointerType==='touch'&&x<vw*.45&&L.jid===null){L.jid=e.pointerId;L.jx=x;L.jy=y;L.jdx=0;L.jdy=0;return}
L.aid=e.pointerId;L.mx=x;L.my=y;L.fire=true
})
cvs.addEventListener('pointermove',e=>{
const[x,y]=pos(e)
if(e.pointerId===L.jid){L.jdx=x-L.jx;L.jdy=y-L.jy;const d=Math.hypot(L.jdx,L.jdy);if(d>50){L.jdx*=50/d;L.jdy*=50/d}return}
if(e.pointerId===L.aid||e.pointerType==='mouse'){L.mx=x;L.my=y}
})
const up=e=>{if(e.pointerId===L.jid){L.jid=null;L.jdx=0;L.jdy=0}if(e.pointerId===L.aid){L.aid=null;L.fire=false}}
cvs.addEventListener('pointerup',up);cvs.addEventListener('pointercancel',up)
eb.addEventListener('pointerdown',e=>{e.preventDefault();setHold(1)})
eb.addEventListener('pointerup',()=>setHold(0));eb.addEventListener('pointerleave',()=>setHold(0))
const wbtn=[0,1,2,3].map(i=>h('button',{type:'button',class:'tu-w',on:{click:()=>{L.w=i;draw()}}}))
wb.append(...wbtn)
let wsig=''
const draw=()=>{
const p=mine()
const s=L.w+'|'+(p?p.am.join(',')+p.wood:'')
if(s===wsig)return
wsig=s
wbtn.forEach((b,i)=>{b.className='tu-w'+(i===L.w?' on':'');b.textContent=WN[i]+(i?' x'+(p?p.am[i]:0):'');b.style.borderColor=i===L.w?WC[i]:''})
eb.textContent='Use ('+(p?p.wood:0)+' wood)'
}
const move=dt=>{
const p=mine()
if(!p||p.s!=='up')return
let dx=0,dy=0
if(L.keys.has('a')||L.keys.has('arrowleft'))dx--
if(L.keys.has('d')||L.keys.has('arrowright'))dx++
if(L.keys.has('w')||L.keys.has('arrowup'))dy--
if(L.keys.has('s')||L.keys.has('arrowdown'))dy++
if(L.jid!==null){dx=L.jdx/50;dy=L.jdy/50}
const l=Math.hypot(dx,dy)
if(l>1){dx/=l;dy/=l}
p.x+=dx*190*dt;p.y+=dy*190*dt
p.r=13
push(p,solid())
p.tx=p.x;p.ty=p.y
const ax=(L.mx)/sc+camx,ay=(L.my)/sc+camy
L.ang=Math.atan2(ay-p.y,ax-p.x);p.a=L.ang;p.w=L.w
L.cd=Math.max(0,L.cd-dt)
if(L.fire&&L.cd<=0&&p.am[L.w]>0){
L.cd=WP[L.w].cd
if(host)sim.throw(me,L.w,ax,ay);else send({k:'t',w:L.w,x:Math.round(ax),y:Math.round(ay)})
}
}
const netIn=()=>{
const p=mine()
if(!p)return
if(host)sim.input(me,p.x,p.y,L.ang,L.w)
else send({k:'i',x:Math.round(p.x),y:Math.round(p.y),a:Math.round(L.ang*100)/100,w:L.w})
}
const circ=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
const person=(o,self)=>{
const i=idx.get(o.u)||0,c=COL[i%3]
if(o.s==='dead')return
ctx.save();ctx.translate(o.x,o.y)
if(o.s==='down'){ctx.globalAlpha=.8;circ(0,0,13,'#444');ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('DOWN',0,-20)
ctx.fillStyle='#000';ctx.fillRect(-16,18,32,4);ctx.fillStyle='#6ec1ff';ctx.fillRect(-16,18,32*Math.min(1,o.rv/2.5),4);ctx.restore();return}
ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,9,13,6,0,0,7);ctx.fill()
circ(0,0,13,c)
ctx.rotate(o.a)
ctx.fillStyle=WC[o.w];ctx.beginPath();ctx.arc(16,0,6,0,7);ctx.fill()
ctx.strokeStyle='#1a0e06';ctx.lineWidth=2;ctx.stroke()
ctx.rotate(-o.a)
ctx.fillStyle='#1a0e06';ctx.beginPath();ctx.moveTo(-6,-3);ctx.lineTo(-2,-7);ctx.lineTo(0,-3);ctx.fill();ctx.beginPath();ctx.moveTo(6,-3);ctx.lineTo(2,-7);ctx.lineTo(0,-3);ctx.fill()
ctx.fillRect(-5,3,10,2)
ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(names.get(o.u)||'',0,-22)
ctx.fillStyle='#000';ctx.fillRect(-16,16,32,4);ctx.fillStyle=o.hp>40?'#6bd36b':'#e5484d';ctx.fillRect(-16,16,32*Math.max(0,o.hp)/100,4)
ctx.restore()
}
const enemy=e=>{
const r={wisp:9,ghoul:14,bone:12,reaper:20,boss:56}[e.t]
ctx.save();ctx.translate(e.x,e.y)
ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,r*.7,r,r*.4,0,0,7);ctx.fill()
if(e.t==='wisp'){ctx.shadowColor='#7fd8ff';ctx.shadowBlur=12;circ(0,0,r,EC.wisp);ctx.shadowBlur=0;circ(-3,-2,2,'#04202c');circ(3,-2,2,'#04202c')}
else if(e.t==='ghoul'){circ(0,0,r,EC.ghoul);circ(-5,-3,3,'#d7ff9a');circ(5,-3,3,'#d7ff9a');ctx.fillStyle='#233';ctx.fillRect(-5,4,10,3)}
else if(e.t==='bone'){circ(0,0,r,EC.bone);circ(-4,-2,3,'#222');circ(4,-2,3,'#222');ctx.fillStyle='#222';ctx.fillRect(-4,4,8,2)}
else if(e.t==='reaper'){circ(0,0,r,'#2a1a3a');circ(0,-2,r*.7,EC.reaper);circ(-5,-3,3,'#ff4');circ(5,-3,3,'#ff4');ctx.strokeStyle='#bbb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r,r);ctx.lineTo(r+10,-r-6);ctx.stroke()}
else{circ(0,0,r,'#4a0f12');circ(0,0,r*.82,EC.boss);circ(-16,-10,8,'#ffe08a');circ(16,-10,8,'#ffe08a');ctx.fillStyle='#220';ctx.fillRect(-24,12,48,8)}
if(e.hp<e.mx){ctx.fillStyle='#000';ctx.fillRect(-r,-r-8,r*2,4);ctx.fillStyle='#e5484d';ctx.fillRect(-r,-r-8,r*2*Math.max(0,e.hp)/e.mx,4)}
ctx.restore()
}
const scene=()=>{
ctx.drawImage(world.g,camx,camy,vw/sc,vh/sc,0,0,vw/sc,vh/sc)
ctx.save();ctx.translate(-camx,-camy)
V.bars.forEach((hp,i)=>{if(hp>0){const r=DOORS[i].rect;ctx.fillStyle='#7a5230';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#2a170a';ctx.lineWidth=3;for(let k=0;k<4;k++){const f=k/4;if(r.w>r.h){ctx.strokeRect(r.x+f*r.w,r.y,r.w/4,r.h)}else ctx.strokeRect(r.x,r.y+f*r.h,r.w,r.h/4)}ctx.fillStyle='rgba(0,0,0,'+(.5*(1-Math.min(1,hp/140)))+')';ctx.fillRect(r.x,r.y,r.w,r.h)}})
for(const d of V.pd){ctx.fillStyle='rgba(255,217,59,.22)';ctx.beginPath();ctx.arc(d[0],d[1],d[2],0,7);ctx.fill();ctx.strokeStyle='rgba(255,217,59,.6)';ctx.lineWidth=2;ctx.stroke()}
for(const k of V.pk){ctx.fillStyle=k[1]==='a'?'#ff5fa2':'#b88a54';ctx.fillRect(k[2]-6,k[3]-6,12,12);ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.strokeRect(k[2]-6,k[3]-6,12,12)}
const items=[...V.en.values()].map(o=>({y:o.y,f:()=>enemy(o)}))
for(const o of V.pl.values())items.push({y:o.y,f:()=>person(o)})
items.sort((a,b)=>a.y-b.y).forEach(i=>i.f())
for(const p of V.pj.values()){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=WC[p.k];ctx.shadowColor=WC[p.k];ctx.shadowBlur=8;if(p.k===3){ctx.fillRect(-8,-3,16,6)}else{ctx.beginPath();ctx.arc(0,0,p.k?8:6,0,7);ctx.fill()}ctx.restore()}
for(const f of V.fx){const k=1-f.t/.45;ctx.strokeStyle=WC[f.w]||'#fff';ctx.globalAlpha=1-k;ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.3+.7*k),0,7);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=(1-k)*.25;ctx.fill();ctx.globalAlpha=1}
ctx.restore()
}
const render=dt=>{
const p=mine()
if(p){camx=Math.max(0,Math.min(W-vw/sc,p.x-vw/sc/2));camy=Math.max(0,Math.min(H-vh/sc,p.y-vh/sc/2))}
const inb=p?buildingAt(p):-1
BUILDINGS.forEach((b,i)=>{fade[i]+=((i===inb?1:0)-fade[i])*Math.min(1,dt*6)})
ctx.save();ctx.scale(sc,sc)
ctx.fillStyle='#10160b';ctx.fillRect(0,0,vw/sc,vh/sc)
scene()
BUILDINGS.forEach((b,i)=>{const a=1-fade[i];if(a>.02){ctx.globalAlpha=a;ctx.drawImage(world.roofs[i],b.x-camx,b.y-camy);ctx.globalAlpha=1}})
if(inb>=0&&fade[inb]>.02){
const b=BUILDINGS[inb]
ctx.fillStyle='rgba(6,5,12,'+.9*fade[inb]+')';ctx.fillRect(0,0,vw/sc,vh/sc)
ctx.save();ctx.beginPath();ctx.rect(b.x-camx,b.y-camy,b.w,b.h);ctx.clip()
ctx.globalAlpha=Math.min(1,fade[inb]*1.4);scene();ctx.globalAlpha=1
ctx.restore()
}
ctx.restore()
if(L.jid!==null){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(L.jx,L.jy,50,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(L.jx+L.jdx,L.jy+L.jdy,22,0,7);ctx.fill()}
ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(10,10,168,22+V.pl.size*18)
ctx.font='bold 12px sans-serif';ctx.textAlign='left'
let y=26
for(const o of V.pl.values()){ctx.fillStyle=COL[(idx.get(o.u)||0)%3];ctx.fillText((names.get(o.u)||'').slice(0,12),18,y);ctx.fillStyle='#000';ctx.fillRect(98,y-9,70,8);ctx.fillStyle=o.s==='up'?'#6bd36b':'#888';ctx.fillRect(98,y-9,70*Math.max(0,o.hp)/100,8);y+=18}
ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif'
ctx.fillText('Wave '+Math.max(1,V.wave)+' of 10   '+V.n+' left   '+V.kl+' kills',vw/2,26)
}
const note=()=>{
const p=mine()
let t=''
if(V.st==='wait')t='Wave '+(V.wave+1)+' starts in '+V.tm
else if(p&&p.s==='down')t='You are down. A teammate can revive you.'
else if(p&&p.s==='dead')t='You were knocked out. Spectating your squad.'
else if(p&&buildingAt(p)<0&&DOORS.some(d=>Math.hypot(d.cx-p.x,d.cy-p.y)<75))t='Hold Use at a door to board it up (2 wood)'
info.textContent=t
}
const finish=()=>{
if(done)return
done=true
const win=V.st==='win'
endBox.replaceChildren(h('h2',null,win?'Dawn breaks. You held out.':'The hollow took your squad.'),h('p',null,'Reached wave '+Math.max(1,V.wave)+' with '+V.kl+' kills.'),h('button',{class:'btn pri',type:'button',on:{click:()=>onEnd()}},'Back to lobby'))
endBox.classList.add('on')
}
const loop=now=>{
raf=requestAnimationFrame(loop)
const dt=Math.min(.1,(now-last)/1000);last=now
if(host&&!done){
acc+=dt
while(acc>=1/30){acc-=1/30;sim.step(1/30)}
snapAcc+=dt
if(snapAcc>=.08){snapAcc=0;const sn=sim.snap();apply(sn);send(sn)}
}
move(dt)
L.sent+=dt
if(L.sent>=.066){L.sent=0;netIn()}
const k=Math.min(1,dt*16)
for(const o of V.pl.values())if(o.u!==me||o.s!=='up'){o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k}
for(const o of V.en.values()){o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k}
for(const o of V.pj.values()){o.x+=(o.tx-o.x)*Math.min(1,dt*30);o.y+=(o.ty-o.y)*Math.min(1,dt*30)}
V.fx=V.fx.filter(f=>(f.t-=dt)>0)
render(dt)
draw();note()
if(V.st==='win'||V.st==='lose')finish()
}
raf=requestAnimationFrame(loop)
return{
msg(f,d){
if(host){
if(!sim)return
if(d.k==='i')sim.input(f,d.x,d.y,d.a,d.w)
else if(d.k==='t')sim.throw(f,d.w,d.x,d.y)
else if(d.k==='h')sim.holdSet(f,d.v)
}else if(d.k==='s'&&f===hostUid)apply(d)
},
left(u){
if(!host&&u===hostUid&&!done){V.st='lose';info.textContent='The host left the match.';finish()}
},
stop(){
cancelAnimationFrame(raf);ro.disconnect()
removeEventListener('keydown',kd);removeEventListener('keyup',ku)
box.replaceChildren()
}
}
}
