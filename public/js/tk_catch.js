import{h}from'./util.js'
import{THREE,stage,turkey,pie,fruit,cornucopia,tree,ground,leaves,burst,mat,rng,audio,shake,disposeObj}from'./tk3d.js'
const BK='tk3_catch_best'
const IS=1.3
const CY=1.75
const K={apple:['f','apple',10],pear:['f','pear',10],corn:['f','corn',15],grapes:['f','grapes',20],acorn:['f','acorn',5],pumpkin:['f','pumpkin',25],pie_apple:['p','apple',40],pie_pecan:['p','pecan',40],pie_pumpkin:['p','pumpkin',50],golden:['f','leaf',0],rotten:['f','rotten',0]}
const GOOD=['apple','apple','apple','pear','pear','corn','corn','grapes','acorn','acorn','pumpkin','pie_apple','pie_pecan','pie_pumpkin']
const AREA=Object.assign([40,18,30],{x:40,y:18,z:30,w:40,h:18,d:30})
const shade=(o,c,r)=>o.traverse(m=>{if(m.isMesh){m.castShadow=c;m.receiveShadow=r}})
const clamp=(v,a,b)=>v<a?a:v>b?b:v
export default function launch(host,api){
if(!document.getElementById('tk3dcss'))document.head.append(h('link',{id:'tk3dcss',rel:'stylesheet',href:'/tk3d.css'}))
const red=api.reduced(),lite=api.lite()
let best=0
try{best=+localStorage.getItem(BK)||0}catch{}
const R=rng(21)
const st=stage(host,{lite,fog:0xe8b070,sky:0xf6d093,exp:1.1})
const scene=st.scene,cam=st.camera,sun=st.sun
scene.background=new THREE.Color(0xf6d093)
scene.fog=new THREE.Fog(0xeab97a,26,70)
let lights=0
scene.traverse(o=>{if(o.isLight)lights++})
if(!lights)scene.add(new THREE.HemisphereLight(0xfff1d0,0x6b4a2a,.95))
const sun0=sun?sun.intensity:1
if(sun){
sun.castShadow=true
sun.position.set(7,20,9)
sun.target.position.set(0,0,0)
scene.add(sun.target)
const sc=sun.shadow.camera
sc.left=-16;sc.right=16;sc.top=16;sc.bottom=-16;sc.near=1;sc.far=60
sc.updateProjectionMatrix()
sun.shadow.mapSize.set(lite?512:1024,lite?512:1024)
sun.shadow.bias=-.0006
}
const M={wood:mat(0x8a5a2e),hay:mat(0xd9b44a),hayd:mat(0xb48a2c),pump:mat(0xe0731a),dark:mat(0x4a2f18),hg:new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.32,depthWrite:false}),hr:new THREE.MeshBasicMaterial({color:0x7ccf3a,transparent:true,opacity:.26,depthWrite:false})}
const G={sph:new THREE.SphereGeometry(1,14,10),box:new THREE.BoxGeometry(1,1,1),hay:new THREE.CylinderGeometry(.9,.9,1.2,14),post:new THREE.BoxGeometry(.3,1.6,.3),rail:new THREE.BoxGeometry(3.4,.22,.14)}
const mk=(g,m,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o}
const gr=ground(70,60,5)
shade(gr,false,true)
gr.position.z=-8
scene.add(gr)
const treeKinds=['maple','oak','birch','maple','oak','pine']
const trees=[]
const NT=lite?10:18
for(let i=0;i<NT;i++){
const t=tree(treeKinds[i%treeKinds.length],i+31)
t.scale.setScalar(1.5+R()*1)
const row=i%3
t.position.set(-30+(i/NT)*60+R()*3,0,-10-row*7-R()*3)
t.rotation.y=R()*6.28
scene.add(t)
trees.push(t)
}
const back=new THREE.Group()
for(let i=0;i<9;i++)back.add(mk(G.hay,i%2?M.hay:M.hayd,-16+i*4+R()*1.5,.7,-4.5-R()*1.2,1,1,1))
for(let i=0;i<5;i++)back.add(mk(G.rail,M.wood,-14+i*7,.6,-3,1,1,1),mk(G.rail,M.wood,-14+i*7,1.2,-3,1,1,1),mk(G.post,M.wood,-15.6+i*7,.8,-3,1,1,1))
for(let i=0;i<8;i++){const p=mk(G.sph,M.pump,-13+i*3.8+R()*2,.45,-2.2-R()*.6,.6,.5,.6);p.scale.multiplyScalar(.8+R()*.7);back.add(p)}
scene.add(back)
shade(back,false,true)
const lv=leaves(scene,red?30:lite?70:140,AREA)
const bs=burst(scene)
const sk=shake(cam)
const horn=cornucopia()
horn.scale.setScalar(1.25)
scene.add(horn)
shade(horn,true,false)
const tk=turkey({pilgrim:true,scale:1.15})
tk.group.position.set(0,0,-1.8)
scene.add(tk.group)
shade(tk.group,true,false)
const pool={}
const getItem=kind=>{
const l=pool[kind]||(pool[kind]=[])
let m=l.find(x=>!x.visible)
if(!m){
const[tp,nm]=K[kind]
m=tp==='f'?fruit(nm):pie(nm)
if(kind==='golden'||kind==='rotten')m.add(mk(G.sph,kind==='golden'?M.hg:M.hr,0,0,0,.7,.7,.7))
shade(m,true,false)
scene.add(m)
l.push(m)
}
m.visible=true
m.scale.setScalar(IS)
return m
}
const items=[]
let ph='ready',t=0,clock=0,score=0,lives=3,combo=0,mult=1,cx=0,tx=0,HW=6,acc=0,feast=0,squash=0,kl=0,kr=0,finished=false,muted=false,au=null,dead=false,ls=-1,ll=-1,lc=-1,lf=-1
const el={score:h('div',{class:'t3-score'},'0'),best:h('div',{class:'t3-best'},'Best '+best),lives:h('div',{class:'t3-lives'},...[0,1,2].map(()=>h('span',{class:'t3-life'}))),combo:h('div',{class:'t3-combo'}),flash:h('div',{class:'t3-flash'}),feast:h('div',{class:'t3-feast'},h('i'))}
const mute=h('button',{class:'btn sm t3-mute',type:'button',on:{pointerdown:e=>e.stopPropagation(),click:()=>toggleMute()}},'Sound on')
const hud=h('div',{class:'t3-hud'},h('div',{class:'t3-top'},h('div',null,el.score,el.best),el.lives),el.combo,el.feast,el.flash,mute)
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
if(f||cc!==lc){lc=cc;el.combo.classList.toggle('on',combo>=4);el.combo.replaceChildren(h('b',null,'x'+mult),' '+combo+' caught')}
const fe=feast>0?Math.ceil(feast*10):0
if(f||fe!==lf){lf=fe;el.feast.classList.toggle('on',feast>0);el.feast.style.setProperty('--p',String(clamp(feast/7,0,1)))}
}
function pop(text,x,y,bad){
const v=new THREE.Vector3(x,y,0).project(cam)
const p=h('div',{class:'t3-pop'+(bad?' bad':'')},text)
p.style.setProperty('--x',((v.x*.5+.5)*host.clientWidth)+'px')
p.style.setProperty('--y',((-v.y*.5+.5)*host.clientHeight)+'px')
hud.append(p)
setTimeout(()=>p.remove(),800)
}
function showCard(over,s,nb,secs){
box.replaceChildren()
if(!over){
box.append(h('h2',null,'Cornucopia Catch'),h('p',null,'Move with the mouse, your finger or the arrow keys. Catch the harvest, dodge anything rotten, and grab golden leaves for a double score feast.'),h('div',{class:'t3-btns'},h('button',{class:'btn pri',type:'button',on:{click:begin}},'Start')))
}else{
const pe=h('p',null,'Saving score')
box.append(h('h2',null,nb?'New best':'Harvest over'),h('div',{class:'t3-big'},String(s)),h('p',null,'Best '+best),pe,h('div',{class:'t3-btns'},h('button',{class:'btn pri',type:'button',on:{click:begin}},'Play again'),h('button',{class:'btn',type:'button',on:{click:()=>api.close()}},'Exit')))
api.finish(s,secs).then(r=>{pe.textContent=r&&r.pars>0?'+'+r.pars+' Pars':'Play 15 seconds or more to earn Pars'})
}
card.hidden=false
}
function begin(){
if(!au){try{au=audio()}catch{au=null}}else{try{au.ctx.resume()}catch{}}
for(const e of items)e.m.visible=false
items.length=0
t=0;score=0;lives=3;combo=0;mult=1;acc=0;feast=0;finished=false
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
function spawn(){
const rot=Math.min(.32,.1+t*.0035)
const r=Math.random()
const kind=feast<=0&&r<rot?'rotten':feast<=0&&Math.random()<.025?'golden':GOOD[Math.floor(Math.random()*GOOD.length)]
const m=getItem(kind)
const x=(Math.random()*2-1)*HW
m.position.set(x,13.5,(Math.random()-.5)*.6)
items.push({m,k:kind,x,y:13.5,v:5.5+Math.min(t*.1,7)+Math.random()*2,sp:[Math.random()*3,Math.random()*3,Math.random()*3]})
}
function catchIt(e,i){
e.m.visible=false
items.splice(i,1)
const pos=new THREE.Vector3(e.x,CY,0)
if(e.k==='rotten'){
lives--;combo=0;mult=1
sk.add(red?.25:.7)
if(!red){el.flash.classList.remove('on');void el.flash.offsetWidth;el.flash.classList.add('on')}
bs.emit(pos,22,0x7ccf3a,5)
nz(.3,.3);sfx(120,.35,'square',.2)
pop('Rotten',e.x,CY+1,true)
ui(true)
if(lives<=0)end()
return
}
squash=.25
if(e.k==='golden'){
feast=7
bs.emit(pos,40,0xffd24a,7)
sfx(660,.4,'triangle',.22);sfx(990,.5,'sine',.16)
pop('Feast',e.x,CY+1)
}else{
combo++
mult=Math.min(5,1+Math.floor(combo/6))
const pts=K[e.k][2]*mult*(feast>0?2:1)
score+=pts
bs.emit(pos,10,e.k.startsWith('pie')?0xf0b040:0xff9a3a,4)
sfx(480+Math.min(combo,18)*35,.1,'triangle',.16)
pop('+'+pts,e.x,CY+1)
}
ui(false)
}
const kd=e=>{
const k=e.key
if(k==='m'||k==='M'){toggleMute();return}
if(ph!=='play'){if((k===' '||k==='Enter')&&!card.hidden&&!e.repeat){e.preventDefault();begin()}return}
if(k==='ArrowLeft'||k==='a'||k==='A')kl=1
else if(k==='ArrowRight'||k==='d'||k==='D')kr=1
}
const ku=e=>{
const k=e.key
if(k==='ArrowLeft'||k==='a'||k==='A')kl=0
else if(k==='ArrowRight'||k==='d'||k==='D')kr=0
}
const rc=new THREE.Raycaster()
const pl=new THREE.Plane(new THREE.Vector3(0,1,0),-CY)
const hit=new THREE.Vector3()
const ndcX=nx=>{cam.updateMatrixWorld();rc.setFromCamera({x:nx,y:-.4},cam);return rc.ray.intersectPlane(pl,hit)?hit.x:nx*HW}
const pm=e=>{if(ph!=='play')return;const r=host.getBoundingClientRect();tx=clamp(ndcX((e.clientX-r.left)/r.width*2-1),-HW,HW)}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
host.addEventListener('pointermove',pm)
host.addEventListener('pointerdown',pm)
function play(dt){
t+=dt
if(feast>0){feast-=dt;if(feast<=0){feast=0;ui(true)}else if(Math.floor(feast*10)!==lf)ui(false)}
acc+=dt
const gap=feast>0?.2:Math.max(.3,.95-t*.011)
while(acc>=gap){acc-=gap;spawn()}
tx=clamp(tx+(kr-kl)*16*dt,-HW,HW)
for(let i=items.length-1;i>=0;i--){
const e=items[i]
e.y-=e.v*dt
e.m.position.set(e.x,e.y,e.m.position.z)
e.m.rotation.x+=e.sp[0]*dt
e.m.rotation.y+=e.sp[1]*dt
e.m.rotation.z+=e.sp[2]*dt*.5
if(e.y<=CY&&e.y>.9&&Math.abs(e.x-cx)<(feast>0?1.9:1.5)){catchIt(e,i);if(ph!=='play')return;continue}
if(e.y<=.35){
bs.emit(new THREE.Vector3(e.x,.3,0),6,e.k==='rotten'?0x7ccf3a:0xc9a36a,3)
e.m.visible=false
items.splice(i,1)
if(e.k!=='rotten'&&e.k!=='golden'&&combo>0){combo=0;mult=1;ui(true)}
}
}
ui(false)
}
function frame(d){
const dt=Math.min(d,.05)
clock+=dt
cam.position.set(cx*.12,6.2,11.8)
cam.lookAt(cx*.1,3.1,0)
HW=clamp(Math.abs(ndcX(1))*.9,3,9)
if(ph==='play')play(dt)
if(dead)return
const mv=tx-cx
cx+=mv*Math.min(1,dt*18)
squash=Math.max(0,squash-dt)
horn.position.set(cx,.5,0)
horn.rotation.z=-mv*.06
horn.scale.set(1.25*(1+squash*.4),1.25*(1-squash*.8),1.25)
tk.group.position.x=cx*.9
tk.tick(dt,Math.abs(mv)*4,Math.abs(mv)>.2?'run':'idle')
if(sun)sun.intensity=sun0*(feast>0?1.25:1)
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
removeEventListener('keyup',ku)
host.removeEventListener('pointermove',pm)
host.removeEventListener('pointerdown',pm)
if(ph==='play'&&!finished&&t>=15){finished=true;api.finish(Math.floor(score),Math.floor(t))}
try{if(au){au.music(false);au.ctx.close()}}catch{}
for(const k of Object.keys(pool))for(const m of pool[k])disposeObj(m)
for(const tr of trees)disposeObj(tr)
disposeObj(gr)
disposeObj(back)
disposeObj(horn)
disposeObj(tk.group)
for(const g of Object.values(G))g.dispose()
for(const m of Object.values(M))m.dispose()
hud.remove()
card.remove()
st.dispose()
}
}
