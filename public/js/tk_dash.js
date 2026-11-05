import{h}from'./util.js'
import{THREE,stage,turkey,pie,tree,ground,leaves,burst,mat,rng,audio,shake,disposeObj}from'./tk3d.js'
const BK='tk3_dash_best'
const LX=[-2.6,0,2.6]
const TL=48
const FACE=Math.PI
const AREA=Object.assign([34,16,60],{x:34,y:16,z:60,w:34,h:16,d:60})
const shade=(o,c,r)=>o.traverse(m=>{if(m.isMesh){m.castShadow=c;m.receiveShadow=r}})
const clamp=(v,a,b)=>v<a?a:v>b?b:v
export default function launch(host,api){
if(!document.getElementById('tk3dcss'))document.head.append(h('link',{id:'tk3dcss',rel:'stylesheet',href:'/tk3d.css'}))
const red=api.reduced(),lite=api.lite()
let best=0
try{best=+localStorage.getItem(BK)||0}catch{}
const R=rng(7)
const st=stage(host,{lite,fog:0xe6a763,sky:0xf3c98b,exp:1.08})
const scene=st.scene,cam=st.camera,sun=st.sun
scene.background=new THREE.Color(0xf3c98b)
scene.fog=new THREE.Fog(0xe9ad6c,30,100)
let lights=0
scene.traverse(o=>{if(o.isLight)lights++})
if(!lights)scene.add(new THREE.HemisphereLight(0xfff1d0,0x6b4a2a,.95))
if(sun){
sun.castShadow=true
sun.position.set(10,22,-4)
sun.target.position.set(0,0,-12)
scene.add(sun.target)
const sc=sun.shadow.camera
sc.left=-24;sc.right=24;sc.top=24;sc.bottom=-24;sc.near=1;sc.far=70
sc.updateProjectionMatrix()
sun.shadow.mapSize.set(lite?512:1024,lite?512:1024)
sun.shadow.bias=-.0006
}
const M={bark:mat(0x6b4423),cap:mat(0xc99a5f),wood:mat(0x8a5a2e),dark:mat(0x4a2f18),fox:mat(0xd9631e),foxw:mat(0xf5ead2),foxk:mat(0x2a1a12),leaf1:mat(0xd2501c),leaf2:mat(0xe8a21c),hay:mat(0xd9b44a),pump:mat(0xe0731a),path:mat(0x9b6b3a),rock:mat(0x8b8277)}
const G={log:new THREE.CylinderGeometry(.55,.55,2.3,14),post:new THREE.BoxGeometry(.28,1.3,.28),rail:new THREE.BoxGeometry(2.4,.2,.14),box:new THREE.BoxGeometry(1,1,1),sph:new THREE.SphereGeometry(1,14,10),cone:new THREE.ConeGeometry(1,1,10),hay:new THREE.CylinderGeometry(.8,.8,1.1,14),rock:new THREE.DodecahedronGeometry(1,0),plane:new THREE.PlaneGeometry(1,1)}
const mk=(g,m,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o}
const makeLog=()=>{const g=new THREE.Group();const l=new THREE.Mesh(G.log,[M.bark,M.cap,M.cap]);l.rotation.z=Math.PI/2;l.position.y=.55;g.add(l,mk(G.cone,M.dark,0,1.1,.1,.2,.3,.2));g.userData={k:'log',hw:1.15,hh:1.15,hd:.55};return g}
const makeFence=()=>{const g=new THREE.Group();for(let i=0;i<3;i++){const x=LX[i];g.add(mk(G.rail,M.wood,x,.5,0,1,1,1),mk(G.rail,M.wood,x,.9,0,1,1,1),mk(G.post,M.wood,x-1.15,.65,0,1,1,1),mk(G.post,M.wood,x+1.15,.65,0,1,1,1))}g.userData={k:'fence',hw:4.1,hh:1.25,hd:.3};return g}
const makeBranch=()=>{const g=new THREE.Group();g.add(mk(G.box,M.bark,0,1.85,0,10.6,.42,.5),mk(G.box,M.bark,-5.2,1.9,0,.55,3.8,.55),mk(G.box,M.bark,5.2,1.9,0,.55,3.8,.55));for(let i=0;i<16;i++)g.add(mk(G.sph,i%2?M.leaf1:M.leaf2,-4.8+i*.64+Math.random()*.3,1.45+Math.random()*.3,(Math.random()-.5)*.4,.38,.28,.3));g.userData={k:'branch',hw:5,hh:0,hd:.35};return g}
const makeFox=()=>{
const g=new THREE.Group(),b=new THREE.Group()
const nose=mk(G.cone,M.foxk,0,.82,1.04,.1,.2,.1)
nose.rotation.x=Math.PI/2
b.add(mk(G.box,M.fox,0,.7,0,.55,.5,1.15),mk(G.sph,M.fox,0,.88,.7,.34,.32,.38),mk(G.cone,M.fox,-.17,1.2,.65,.1,.26,.1),mk(G.cone,M.fox,.17,1.2,.65,.1,.26,.1),mk(G.sph,M.foxk,-.12,.95,.98,.05,.05,.05),mk(G.sph,M.foxk,.12,.95,.98,.05,.05,.05),nose,mk(G.sph,M.foxw,0,.6,.55,.22,.2,.3))
const tail=new THREE.Group()
tail.position.set(0,.75,-.55)
tail.add(mk(G.sph,M.fox,0,0,-.3,.2,.2,.55),mk(G.sph,M.foxw,0,0,-.78,.17,.17,.28))
b.add(tail)
for(const[x,z]of[[-.18,.4],[.18,.4],[-.18,-.4],[.18,-.4]])b.add(mk(G.box,M.foxk,x,.2,z,.12,.4,.12))
g.add(b)
g.userData={k:'fox',hw:.55,hh:1.15,hd:.8,tail,b,vx:0,tx:null,go:Math.random()<.6,ph:Math.random()*6}
return g
}
const tiles=[]
for(let i=0;i<3;i++){
const g=new THREE.Group()
const gr=ground(44,TL,i+3)
shade(gr,false,true)
g.add(gr)
const p=new THREE.Mesh(G.plane,M.path)
p.rotation.x=-Math.PI/2
p.scale.set(9.4,TL,1)
p.position.y=.32
p.receiveShadow=true
g.add(p)
for(let k=0;k<(lite?8:16);k++){
const s=k%2?1:-1,x=s*(5.8+R()*10),z=(R()-.5)*TL,r=R()
if(r<.36){const o=mk(G.hay,M.hay,x,.6,z,1,1,1);o.rotation.set(Math.PI/2*(R()<.6?1:0),R()*3,0);o.scale.setScalar(.8+R()*.5);g.add(o)}
else if(r<.7){const o=mk(G.sph,M.pump,x,.4,z,.55,.45,.55);o.scale.multiplyScalar(.8+R()*.8);g.add(o)}
else g.add(mk(G.rock,M.rock,x,.25,z,.5+R()*.5,.35+R()*.3,.5+R()*.5))
}
g.position.z=-i*TL
scene.add(g)
tiles.push(g)
}
const kinds=['maple','oak','birch','pine','maple','oak']
const trees=[]
const NT=lite?16:30
const placeTree=(t,z)=>{const s=R()<.5?1:-1;t.position.set(s*(6.8+R()*11),0,z);t.rotation.y=R()*6.28}
for(let i=0;i<NT;i++){
const t=tree(kinds[i%kinds.length],i+11)
t.scale.setScalar(1.1+R()*.8)
placeTree(t,-(i/NT)*150+10)
scene.add(t)
trees.push(t)
}
const lv=leaves(scene,red?40:lite?90:180,AREA)
const bs=burst(scene)
const sk=shake(cam)
const pivot=new THREE.Group()
const tk=turkey({pilgrim:true,scale:1})
tk.group.rotation.y=FACE
pivot.add(tk.group)
scene.add(pivot)
shade(pivot,true,false)
const pool={apple:[],pecan:[],pumpkin:[]}
const getPie=k=>{let p=pool[k].find(x=>!x.visible);if(!p){p=pie(k);shade(p,true,false);scene.add(p);pool[k].push(p)}p.visible=true;return p}
const obs=[],pies=[]
let ph='ready',t=0,clock=0,dist=0,score=0,lives=3,combo=0,mult=1,speed=0,px=0,lane=1,py=0,vy=0,slide=0,inv=0,hitT=0,sinceRow=0,rows=0,finished=false,muted=false,dustT=0,au=null,dead=false,ls=-1,ll=-1,lc=-1
const el={score:h('div',{class:'t3-score'},'0'),best:h('div',{class:'t3-best'},'Best '+best),lives:h('div',{class:'t3-lives'},...[0,1,2].map(()=>h('span',{class:'t3-life'}))),combo:h('div',{class:'t3-combo'}),flash:h('div',{class:'t3-flash'})}
const mute=h('button',{class:'btn sm t3-mute',type:'button',on:{pointerdown:e=>e.stopPropagation(),click:()=>toggleMute()}},'Sound on')
const hud=h('div',{class:'t3-hud'},h('div',{class:'t3-top'},h('div',null,el.score,el.best),el.lives),el.combo,el.flash,mute)
const box=h('div',{class:'t3-box'})
const card=h('div',{class:'t3-card',on:{pointerdown:e=>e.stopPropagation(),pointerup:e=>e.stopPropagation()}},box)
host.append(hud,card)
const sfx=(f,d,ty,v)=>{if(muted||!au)return;try{au.tone(f,d,ty||'sine',v||.2)}catch{}}
const nz=(d,v)=>{if(muted||!au)return;try{au.noise(d,v||.2)}catch{}}
const setMusic=()=>{if(!au)return;try{au.music(!muted&&ph==='play')}catch{}}
function toggleMute(){muted=!muted;mute.textContent=muted?'Sound off':'Sound on';setMusic()}
function ui(f){
const s=Math.floor(score)
if(f||s!==ls){ls=s;el.score.textContent=String(s)}
if(f||lives!==ll){ll=lives;[...el.lives.children].forEach((c,i)=>c.classList.toggle('off',i>=lives))}
const cc=combo>=4?combo*10+mult:0
if(f||cc!==lc){lc=cc;el.combo.classList.toggle('on',combo>=4);el.combo.replaceChildren(h('b',null,'x'+mult),' '+combo+' pies')}
}
function showCard(over,s,nb,secs){
box.replaceChildren()
if(!over){
box.append(h('h2',null,'Turkey Dash'),h('p',null,'Swipe or use the arrow keys to change lanes. Space or tap to jump logs and fences. Down to slide under branches. Grab every pie.'),h('div',{class:'t3-btns'},h('button',{class:'btn pri',type:'button',on:{click:begin}},'Run')))
}else{
const pe=h('p',null,'Saving score')
box.append(h('h2',null,nb?'New best':'Run over'),h('div',{class:'t3-big'},String(s)),h('p',null,'Best '+best),pe,h('div',{class:'t3-btns'},h('button',{class:'btn pri',type:'button',on:{click:begin}},'Run again'),h('button',{class:'btn',type:'button',on:{click:()=>api.close()}},'Exit')))
api.finish(s,secs).then(r=>{pe.textContent=r&&r.pars>0?'+'+r.pars+' Pars':'Run 15 seconds or more to earn Pars'})
}
card.hidden=false
}
function begin(){
if(!au){try{au=audio()}catch{au=null}}else{try{au.ctx.resume()}catch{}}
for(const o of obs)scene.remove(o)
obs.length=0
for(const e of pies)e.m.visible=false
pies.length=0
t=0;dist=0;score=0;lives=3;combo=0;mult=1;speed=13;px=0;lane=1;py=0;vy=0;slide=0;inv=0;hitT=0;sinceRow=14;rows=0;finished=false
ph='play'
card.hidden=true
setMusic()
ui(true)
sfx(440,.12,'triangle',.18)
}
function end(){
ph='over'
finished=true
setMusic()
sfx(180,.5,'sawtooth',.2)
const s=Math.floor(score)
const nb=s>best
if(nb){best=s;try{localStorage.setItem(BK,String(best))}catch{}}
el.best.textContent='Best '+best
showCard(true,s,nb,Math.floor(t))
}
function hurt(o){
lives--
combo=0;mult=1
inv=1.6;hitT=.5
sk.add(red?.25:.8)
if(!red){el.flash.classList.remove('on');void el.flash.offsetWidth;el.flash.classList.add('on')}
bs.emit(new THREE.Vector3(px,1,0),26,0xc0562a,6)
nz(.3,.3);sfx(130,.3,'square',.2)
ui(true)
if(lives<=0)end()
}
function pieAt(x,y,z,k){
const kind=k||(Math.random()<.5?'apple':'pecan')
const m=getPie(kind)
m.position.set(x,y,z)
pies.push({m,x,y,z,g:k==='pumpkin',ph:Math.random()*6})
}
function pieLine(l,z,n){for(let i=0;i<n;i++)pieAt(LX[l],1,z-i*1.8,i===2&&rows%5===0?'pumpkin':null)}
function pieArc(l,z){for(let i=0;i<7;i++){const u=(i-3)/3;pieAt(LX[l],1+2.1*(1-u*u),z+(i-3)*1.6,i===3&&rows%5===0?'pumpkin':null)}}
function addObs(o,x,z){o.position.set(x,0,z);scene.add(o);shade(o,true,false);obs.push(o);return o}
function spawnRow(){
const z=-105
rows++
const free=Math.floor(Math.random()*3)
const others=[0,1,2].filter(i=>i!==free).sort(()=>Math.random()-.5)
const r=Math.random()
const kind=rows<3?'none':r<.28?'log':r<.5?'fence':r<.68?'branch':r<.9?'fox':'none'
if(kind==='log'){for(const l of others.slice(0,Math.random()<.5?1:2))addObs(makeLog(),LX[l],z);pieLine(free,z+3,5)}
else if(kind==='fence'){addObs(makeFence(),0,z);pieArc(free,z)}
else if(kind==='branch'){addObs(makeBranch(),0,z);pieLine(free,z+9,4)}
else if(kind==='fox'){for(const l of others.slice(0,Math.random()<.5?1:2)){const f=addObs(makeFox(),LX[l],z);f.userData.li=l}pieLine(free,z+3,5)}
else pieLine(Math.floor(Math.random()*3),z,6)
}
function jump(){if(ph!=='play'||py>.001)return;vy=14.5;slide=0;sfx(520,.14,'triangle',.16);bs.emit(new THREE.Vector3(px,.1,.4),6,0xc9a36a,2)}
function dive(){if(ph!=='play')return;if(py>.001)vy=-30;else slide=.7}
function go(d){if(ph!=='play')return;const n=clamp(lane+d,0,2);if(n!==lane){lane=n;sfx(300+n*60,.06,'sine',.1)}}
const kd=e=>{
const k=e.key
if(k==='m'||k==='M'){toggleMute();return}
if(ph!=='play'){if((k===' '||k==='Enter')&&!card.hidden&&!e.repeat){e.preventDefault();begin()}return}
if(k==='ArrowLeft'||k==='a'||k==='A')go(-1)
else if(k==='ArrowRight'||k==='d'||k==='D')go(1)
else if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){e.preventDefault();jump()}
else if(k==='ArrowDown'||k==='s'||k==='S'){e.preventDefault();dive()}
}
let pd=null
const pdn=e=>{pd={x:e.clientX,y:e.clientY}}
const pup=e=>{
if(!pd)return
const dx=e.clientX-pd.x,dy=e.clientY-pd.y
pd=null
if(ph!=='play')return
if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))go(dx>0?1:-1)
else if(dy<-40)jump()
else if(dy>40)dive()
else jump()
}
addEventListener('keydown',kd)
host.addEventListener('pointerdown',pdn)
host.addEventListener('pointerup',pup)
function play(dt){
t+=dt
speed=Math.min(32,13+t*.16)
const adv=speed*dt
dist+=adv
score+=adv*.25
sinceRow+=adv
if(sinceRow>=Math.max(11,17-speed*.18)){sinceRow=0;spawnRow()}
px+=(LX[lane]-px)*Math.min(1,dt*14)
if(py>0||vy>0){
vy-=38*dt
py+=vy*dt
if(py<=0){py=0;vy=0;bs.emit(new THREE.Vector3(px,.1,.3),8,0xc9a36a,2.5)}
}
if(slide>0)slide-=dt
if(inv>0)inv-=dt
if(hitT>0)hitT-=dt
dustT-=dt
if(py===0&&dustT<=0){dustT=.1;bs.emit(new THREE.Vector3(px,.1,.5),2,0xc9a36a,1.6)}
for(let i=obs.length-1;i>=0;i--){
const o=obs[i],u=o.userData
o.position.z+=adv
if(u.k==='fox'){
if(u.go&&u.tx===null&&o.position.z>-48){u.li=u.li===1?(Math.random()<.5?0:2):1;u.tx=LX[u.li]}
if(u.tx!==null){const d=u.tx-o.position.x;u.vx=clamp(d*3,-4,4);o.position.x+=u.vx*dt}
o.rotation.y=u.vx*.06
u.tail.rotation.y=Math.sin(clock*10+u.ph)*.5
u.b.position.y=Math.abs(Math.sin(clock*12+u.ph))*.1
}
if(o.position.z>10){scene.remove(o);obs.splice(i,1);continue}
if(inv<=0&&Math.abs(o.position.z)<u.hd+.5&&Math.abs(o.position.x-px)<u.hw+.4){
const hit=u.k==='branch'?slide<=0:py<u.hh
if(hit){hurt(o);if(ph!=='play')return}
}
}
for(let i=pies.length-1;i>=0;i--){
const e=pies[i]
e.z+=adv
e.m.position.set(e.x,e.y+Math.sin(clock*4+e.ph)*.12,e.z)
e.m.rotation.y+=dt*2.4
if(e.z>8){e.m.visible=false;pies.splice(i,1);continue}
if(Math.abs(e.z)<1.1&&Math.abs(e.x-px)<1.1&&Math.abs(e.y-(py+.8))<1.3){
e.m.visible=false
pies.splice(i,1)
combo++
mult=Math.min(5,1+Math.floor(combo/8))
if(e.g){if(lives<3){lives++}else score+=50*mult;bs.emit(new THREE.Vector3(e.x,e.y,0),24,0xffd24a,5);sfx(880,.3,'triangle',.2)}
else{score+=10*mult;bs.emit(new THREE.Vector3(e.x,e.y,0),8,0xf0b040,3.5);sfx(520+Math.min(combo,16)*40,.09,'triangle',.16)}
ui(false)
}
}
ui(false)
}
function frame(d){
const dt=Math.min(d,.05)
clock+=dt
if(ph==='play')play(dt)
if(dead)return
const wv=ph==='play'?speed:ph==='ready'?5:0
for(const g of tiles){g.position.z+=wv*dt;if(g.position.z-TL/2>12)g.position.z-=TL*3}
for(const tr of trees){tr.position.z+=wv*dt;if(tr.position.z>14)placeTree(tr,tr.position.z-150-R()*8)}
pivot.position.set(px,py,0)
pivot.scale.set(1,slide>0?.6:1,1)
pivot.rotation.z=(px-LX[lane])*.12
pivot.visible=inv<=0||Math.floor(clock*20)%2===0
tk.tick(dt,speed,hitT>0?'hit':py>.05?'fly':ph==='play'?'run':'idle')
cam.position.set(px*.45,4.3,8.4)
cam.lookAt(px*.3,1.3,-9)
if(!red&&cam.isPerspectiveCamera){const f=56+(speed-13)*.35;if(Math.abs(cam.fov-f)>.1){cam.fov=f;cam.updateProjectionMatrix()}}
sk.tick(dt)
lv.tick(dt)
bs.tick(dt)
}
st.loop(frame)
showCard(false)
return()=>{
dead=true
st.stop()
removeEventListener('keydown',kd)
host.removeEventListener('pointerdown',pdn)
host.removeEventListener('pointerup',pup)
if(ph==='play'&&!finished&&t>=15){finished=true;api.finish(Math.floor(score),Math.floor(t))}
try{if(au){au.music(false);au.ctx.close()}}catch{}
for(const o of obs)scene.remove(o)
for(const k of Object.keys(pool))for(const p of pool[k])disposeObj(p)
for(const tr of trees)disposeObj(tr)
for(const g of tiles)disposeObj(g)
disposeObj(pivot)
for(const g of Object.values(G))g.dispose()
for(const m of Object.values(M))m.dispose()
hud.remove()
card.remove()
st.dispose()
}
}
