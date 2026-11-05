import{stage,THREE,pie,fruit,turkey,cornucopia,burst,mat,audio,disposeObj}from'./tk3d.js'
const BK='tk_stack_best'
const LH=.8
const D=6
const PLATE=.2
const NOTES=[523,587,659,784,880,1047,1175,1319,1568]
const KINDS=['pumpkin','apple','pecan']
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function unit(o){
const g=new THREE.Group()
g.add(o)
const b=new THREE.Box3().setFromObject(g)
const s=new THREE.Vector3()
b.getSize(s)
o.scale.set(o.scale.x/Math.max(s.x,1e-6),o.scale.y/Math.max(s.y,1e-6),o.scale.z/Math.max(s.z,1e-6))
const b2=new THREE.Box3().setFromObject(g)
const c=new THREE.Vector3()
b2.getCenter(c)
o.position.set(o.position.x-c.x,o.position.y-b2.min.y,o.position.z-c.z)
return g
}
function fit(o,d){
const g=new THREE.Group()
g.add(o)
const b=new THREE.Box3().setFromObject(g)
const s=new THREE.Vector3()
b.getSize(s)
o.scale.multiplyScalar(d/Math.max(s.x,s.y,s.z,1e-6))
const b2=new THREE.Box3().setFromObject(g)
const c=new THREE.Vector3()
b2.getCenter(c)
o.position.set(o.position.x-c.x,o.position.y-b2.min.y,o.position.z-c.z)
return g
}
function shade(o,on){
if(!on)return
o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}})
}
function glowTex(){
const c=document.createElement('canvas')
c.width=c.height=128
const x=c.getContext('2d')
const g=x.createRadialGradient(64,64,0,64,64,64)
g.addColorStop(0,'rgba(255,220,150,1)')
g.addColorStop(.25,'rgba(255,160,60,.55)')
g.addColorStop(1,'rgba(255,120,20,0)')
x.fillStyle=g
x.fillRect(0,0,128,128)
const t=new THREE.CanvasTexture(c)
t.colorSpace=THREE.SRGBColorSpace
return t
}
function bgTex(){
const c=document.createElement('canvas')
c.width=4
c.height=256
const x=c.getContext('2d')
const g=x.createLinearGradient(0,0,0,256)
g.addColorStop(0,'#0d0705')
g.addColorStop(.55,'#2a150a')
g.addColorStop(1,'#5a2c10')
x.fillStyle=g
x.fillRect(0,0,4,256)
const t=new THREE.CanvasTexture(c)
t.colorSpace=THREE.SRGBColorSpace
return t
}
export default function launch(host,api){
if(!document.getElementById('tk3css')){
const l=document.createElement('link')
l.id='tk3css'
l.rel='stylesheet'
l.href='/tk3d2.css'
document.head.append(l)
}
const red=api.reduced()
const lite=api.lite()
let best=0
try{best=+localStorage.getItem(BK)||0}catch{}
const s=stage(host,{lite,exp:1.05})
const scene=s.scene
const camera=s.camera
camera.fov=38
camera.updateProjectionMatrix()
scene.background=bgTex()
scene.fog=new THREE.Fog(0x1b0f08,34,90)
scene.add(new THREE.HemisphereLight(0xffe2b8,0x2a1608,.6))
const sun=s.sun
if(sun){
sun.color.set(0xffe0b0)
sun.intensity=Math.max(sun.intensity||0,1.6)
sun.castShadow=!lite
sun.shadow.camera.left=-16
sun.shadow.camera.right=16
sun.shadow.camera.top=16
sun.shadow.camera.bottom=-16
sun.shadow.camera.far=120
sun.shadow.bias=-.0008
scene.add(sun.target)
}
const AU=audio()
const ctx=AU&&AU.ctx
let muted=false
function tone(f,d,ty,v,sl){
if(muted||!ctx)return
try{
const t=ctx.currentTime
const o=ctx.createOscillator()
const g=ctx.createGain()
o.type=ty||'sine'
o.frequency.setValueAtTime(f,t)
if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*sl),t+d)
g.gain.setValueAtTime(0,t)
g.gain.linearRampToValueAtTime(v||.1,t+.01)
g.gain.exponentialRampToValueAtTime(.0001,t+d)
o.connect(g)
g.connect(ctx.destination)
o.start(t)
o.stop(t+d+.05)
}catch{}
}
function setMuted(m){
muted=m
mb.textContent=m?'Off':'Snd'
try{if(AU&&AU.music)AU.music(!m)}catch{}
}
const table=new THREE.Group()
scene.add(table)
const wood=mat(0x6b3a1c,{roughness:.62})
const slab=new THREE.Mesh(new THREE.BoxGeometry(38,1.2,24),wood)
slab.position.y=-.6
table.add(slab)
for(let i=-5;i<=5;i++){
const g=new THREE.Mesh(new THREE.BoxGeometry(.04,.02,24),mat(0x3d2010,{roughness:.9}))
g.position.set(i*3.4,.01,0)
table.add(g)
}
const linen=new THREE.Mesh(new THREE.BoxGeometry(26,.06,13),mat(0xf0e2c6,{roughness:.95}))
linen.position.y=.03
table.add(linen)
const trim=new THREE.Mesh(new THREE.BoxGeometry(26.2,.05,.5),mat(0xb2432a,{roughness:.9}))
trim.position.set(0,.065,5.7)
table.add(trim)
const trim2=trim.clone()
trim2.position.z=-5.7
table.add(trim2)
const plate=new THREE.Mesh(new THREE.CylinderGeometry(4.3,3.6,.2,48),mat(0xf6f0e4,{roughness:.35}))
plate.position.y=.14
table.add(plate)
const rim=new THREE.Mesh(new THREE.TorusGeometry(4.2,.12,10,56),mat(0xc9a24a,{roughness:.3,metalness:.5}))
rim.rotation.x=Math.PI/2
rim.position.y=.24
table.add(rim)
const glow=glowTex()
const candles=[]
const cpos=[[-9,-4],[9,-4],[-8.5,4.6],[8.8,4.2]]
for(const[x,z]of cpos){
const g=new THREE.Group()
const st=new THREE.Mesh(new THREE.CylinderGeometry(.7,.85,.18,20),mat(0xc9a24a,{roughness:.3,metalness:.6}))
st.position.y=.15
g.add(st)
const body=new THREE.Mesh(new THREE.CylinderGeometry(.3,.32,2.2,18),mat(0xf3e6c8,{roughness:.6}))
body.position.y=1.3
g.add(body)
const fl=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshBasicMaterial({color:0xffd27a}))
fl.scale.set(1,1.8,1)
fl.position.y=2.65
g.add(fl)
const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}))
sp.scale.set(3.2,3.2,1)
sp.position.y=2.7
g.add(sp)
let pl=null
if(!lite&&candles.length<3){
pl=new THREE.PointLight(0xffa84a,38,16,2)
pl.position.y=2.9
g.add(pl)
}
g.position.set(x,0,z)
table.add(g)
candles.push({fl,sp,pl,ph:Math.random()*6})
}
function dish(o,d,x,z,y){
const f=fit(o,d)
f.position.set(x,y||.06,z)
f.rotation.y=Math.random()*6
table.add(f)
}
const pl1=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.2,.14,32),mat(0xf6f0e4,{roughness:.35}))
pl1.position.set(-6.5,.13,-1.8)
table.add(pl1)
dish(fruit('pumpkin'),2,-6.5,-1.8,.2)
const pl2=pl1.clone()
pl2.position.set(7,.13,-2)
table.add(pl2)
dish(fruit('apple'),1.6,6.7,-2.1,.2)
dish(fruit('apple'),1.4,7.6,-1.6,.2)
dish(fruit('corn'),2.4,-7.6,3,.06)
dish(fruit('acorn'),1,7.4,2.2,.06)
dish(fruit('grapes'),1.6,-5.4,3.6,.06)
const cc=fit(cornucopia(),5)
cc.position.set(0,.06,-6)
cc.rotation.y=.3
table.add(cc)
const tk=turkey({pilgrim:true,scale:1})
const tg=fit(tk.group,3)
tg.position.set(-10.5,.06,.4)
table.add(tg)
tg.rotation.y=Math.PI*.5
shade(table,!lite)
const protos=KINDS.map(k=>unit(pie(k)))
const tower=new THREE.Group()
scene.add(tower)
const bursts=burst(scene)
const deb=[]
const rings=[]
const embers=(()=>{
const n=lite?60:160
const g=new THREE.BufferGeometry()
const p=new Float32Array(n*3)
for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*40;p[i*3+1]=Math.random()*40;p[i*3+2]=(Math.random()-.5)*30}
g.setAttribute('position',new THREE.BufferAttribute(p,3))
const m=new THREE.Points(g,new THREE.PointsMaterial({map:glow,size:.5,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.7}))
m.frustumCulled=false
scene.add(m)
return{m,p,n}
})()
const hud=el('div','tk3-hud')
const sc=el('div','tk3-score')
const scN=el('b',null,'0')
const scS=el('span',null,'')
sc.append(scN,scS)
const side=el('div','tk3-side')
const sideB=el('b',null,'0')
side.append(el('div',null,'Best'),sideB)
const flash=el('div','tk3-flash')
const mb=el('button','tk3-mute','Snd')
mb.type='button'
mb.setAttribute('aria-label','Toggle sound')
const hint=el('div','tk3-hint','Click, tap or press Space to drop')
hud.append(sc,side,flash,mb,hint)
host.append(hud)
sideB.textContent=best
let st='ready'
let score=0
let chain=0
let perfects=0
let n=0
let t0=0
let clock=0
let shakeA=0
let camY=2
let camD=15
let az=.72
let panel=null
let cur=null
let top=null
let tilt=0
let overT=0
let finished=false
let dead=false
function showFlash(txt,big){
flash.textContent=txt
flash.classList.remove('go','big')
void flash.offsetWidth
flash.classList.add('go')
if(big)flash.classList.add('big')
}
function makePanel(h,lines,big,btns){
if(panel)panel.remove()
panel=el('div','tk3-panel')
panel.append(el('h2',null,h))
if(big!=null)panel.append(el('div','big',big))
for(const l of lines)panel.append(el('p',l[1]||null,l[0]))
const row=el('div','tk3-row')
for(const b of btns){
const x=el('button','tk3-btn'+(b[2]?' pri':''),b[0])
x.type='button'
x.addEventListener('pointerdown',e=>e.stopPropagation())
x.addEventListener('click',b[1])
row.append(x)
}
panel.append(row)
hud.append(panel)
return panel
}
function clearPanel(){
if(panel){panel.remove();panel=null}
}
function layerObj(k,sx,sz){
const o=protos[k%3].clone(true)
o.scale.set(sx,LH,sz)
shade(o,!lite)
return o
}
function reset(){
for(const l of [...tower.children])tower.remove(l)
for(const d of deb)scene.remove(d.o)
deb.length=0
score=0
chain=0
perfects=0
n=0
finished=false
scN.textContent='0'
scS.textContent=''
const o=layerObj(2,D,D)
o.position.set(0,PLATE,0)
tower.add(o)
top={o,x:0,z:0,sx:D,sz:D,y:PLATE}
spawnCur()
}
function spawnCur(){
n++
const axis=n%2
const o=layerObj(n,top.sx,top.sz)
const y=top.y+LH
o.position.set(top.x,y,top.z)
tower.add(o)
cur={o,axis,ph:axis?Math.PI*.5:-Math.PI*.5,sx:top.sx,sz:top.sz,y,range:D*.95+1}
}
function begin(){
reset()
clearPanel()
hint.style.setProperty('opacity','0')
st='play'
t0=clock
if(ctx&&ctx.state==='suspended')ctx.resume()
try{if(AU&&AU.music&&!muted)AU.music(true)}catch{}
}
function addDebris(k,x,y,z,sx,sz,vx,vz){
const o=layerObj(k,sx,sz)
o.position.set(x,y,z)
scene.add(o)
deb.push({o,vx,vy:0,vz,rx:(Math.random()-.5)*3,rz:(Math.random()-.5)*3})
}
function ring(y,sx,sz){
const g=new THREE.Mesh(new THREE.TorusGeometry(.5,.035,8,48),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95}))
g.rotation.x=Math.PI/2
g.position.set(top.x,y,top.z)
g.scale.set(Math.max(sx,.5)*1.02,Math.max(sz,.5)*1.02,1)
scene.add(g)
rings.push({g,t:0,sx:Math.max(sx,.5),sz:Math.max(sz,.5)})
}
function drop(){
if(st!=='play'||!cur)return
const ax=cur.axis
const pos=ax?cur.o.position.z:cur.o.position.x
const c0=ax?top.z:top.x
const s0=ax?top.sz:top.sx
const sp=ax?cur.sz:cur.sx
const lo=Math.max(c0-s0/2,pos-sp/2)
const hi=Math.min(c0+s0/2,pos+sp/2)
const ov=hi-lo
const delta=pos-c0
const k=n
if(ov<=.06){
st='over'
overT=0
deb.push({o:cur.o,vx:ax?0:Math.sign(delta||1)*1.2,vy:0,vz:ax?Math.sign(delta||1)*1.2:0,rx:(Math.random()-.5)*2,rz:(Math.random()-.5)*2,keep:true})
tower.remove(cur.o)
scene.add(cur.o)
tone(180,.5,'sawtooth',.12,.4)
tone(120,.7,'sine',.14,.3)
chain=0
shakeA=red?0:.5
cur=null
return
}
const perfect=Math.abs(delta)<.15
let nc=(lo+hi)/2
let ns=ov
if(perfect){
nc=c0
ns=s0
perfects++
chain++
if(chain>=5&&ns<D)ns=Math.min(D,ns+.35)
}else{
chain=0
const dc=delta>0?(hi+pos+sp/2)/2:(pos-sp/2+lo)/2
const dw=delta>0?pos+sp/2-hi:lo-(pos-sp/2)
const dp=ax?[top.x,dc]:[dc,top.z]
addDebris(k,dp[0],cur.y,dp[1],ax?cur.sx:Math.max(dw,.05),ax?Math.max(dw,.05):cur.sz,ax?0:Math.sign(delta)*1.6,ax?Math.sign(delta)*1.6:0)
}
const nx=ax?top.x:nc
const nz=ax?nc:top.z
const nsx=ax?cur.sx:ns
const nsz=ax?ns:cur.sz
cur.o.scale.set(nsx,LH,nsz)
cur.o.position.set(nx,cur.y,nz)
top={o:cur.o,x:nx,z:nz,sx:nsx,sz:nsz,y:cur.y}
let gain=1
if(perfect){
gain+=Math.min(chain,8)
if(chain%5===0)gain+=10
ring(cur.y+LH,nsx,nsz)
bursts.emit(new THREE.Vector3(nx,cur.y+LH,nz),red?6:18,0xffd27a,3.5)
tone(NOTES[Math.min(chain-1,NOTES.length-1)],.35,'triangle',.14)
tone(NOTES[Math.min(chain-1,NOTES.length-1)]*2,.5,'sine',.07)
showFlash(chain>1?'Perfect x'+chain:'Perfect',chain>=5)
shakeA=red?0:.12
}else{
tone(260,.12,'sine',.12,.6)
bursts.emit(new THREE.Vector3(nx,cur.y+LH*.5,nz),red?3:8,0xc98a3c,2)
shakeA=red?0:.05
}
score+=gain
scN.textContent=score
scS.textContent=chain>1?'Chain x'+chain:''
spawnCur()
}
function end(){
if(finished)return
finished=true
const secs=(clock-t0)
const nb=score>best
if(nb){best=score;try{localStorage.setItem(BK,String(best))}catch{}}
sideB.textContent=best
const lines=[[nb&&score>0?'New best':'Best '+best,'dim']]
const pn=makePanel('Tower fell',lines,score,[['Play again',()=>begin(),true],['Close',()=>api.close()]])
const pars=el('p',null,'Saving score')
pn.insertBefore(pars,pn.querySelector('.tk3-row'))
Promise.resolve(api.finish(score,secs)).then(r=>{pars.textContent=r&&r.pars>0?'+'+r.pars+' Pars':'No Pars this run'}).catch(()=>{pars.textContent=''})
}
function act(){
if(dead)return
if(ctx&&ctx.state==='suspended')ctx.resume()
if(st==='ready')begin()
else if(st==='play')drop()
}
const onDown=e=>{if(e.button!=null&&e.button>0)return;act()}
const onKey=e=>{
if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowDown'){e.preventDefault();if(!e.repeat)act()}
else if(e.code==='KeyM'){setMuted(!muted)}
else if(e.code==='KeyR'&&st==='over'&&finished)begin()
}
host.addEventListener('pointerdown',onDown)
addEventListener('keydown',onKey)
mb.addEventListener('pointerdown',e=>e.stopPropagation())
mb.addEventListener('click',()=>setMuted(!muted))
makePanel('Pie Stack',[['Time each drop to stack the pies. Anything that overhangs gets cut off.'],['Land one dead center for a Perfect, and chain them to grow the pie back.','dim'],['Best '+best,'dim']],null,[['Start',()=>begin(),true]])
reset()
const tmpV=new THREE.Vector3()
function frame(dt0,t){
let dt=dt0
if(dt>1)dt/=1000
dt=Math.min(dt||.016,.05)
clock+=dt
const e=embers
for(let i=0;i<e.n;i++){
e.p[i*3+1]+=dt*(.5+(i%5)*.12)
e.p[i*3]+=Math.sin(clock*.5+i)*dt*.3
if(e.p[i*3+1]>camY+28)e.p[i*3+1]=camY-14
if(e.p[i*3+1]<camY-16)e.p[i*3+1]=camY+20
}
e.m.geometry.attributes.position.needsUpdate=true
for(const c of candles){
if(red)continue
const f=.85+Math.sin(clock*9+c.ph)*.08+Math.sin(clock*23+c.ph*2)*.05
c.fl.scale.set(1,1.8*f,1)
c.sp.material.opacity=.7+f*.3
if(c.pl)c.pl.intensity=36*f
}
if(tk&&tk.tick)tk.tick(dt,0,'idle')
bursts.tick(dt)
if(cur&&st==='play'){
const om=Math.min(3.2,1.3+n*.025)
cur.ph+=dt*om
const off=Math.sin(cur.ph)*cur.range
if(cur.axis)cur.o.position.set(top.x,cur.y,top.z+off)
else cur.o.position.set(top.x+off,cur.y,top.z)
}
for(let i=deb.length-1;i>=0;i--){
const d=deb[i]
d.vy-=22*dt
d.o.position.x+=d.vx*dt
d.o.position.y+=d.vy*dt
d.o.position.z+=d.vz*dt
d.o.rotation.x+=d.rx*dt
d.o.rotation.z+=d.rz*dt
if(d.o.position.y<-30){scene.remove(d.o);deb.splice(i,1)}
}
for(let i=rings.length-1;i>=0;i--){
const r=rings[i]
r.t+=dt
const p=r.t/.55
const k=1+p*.9
r.g.scale.set(r.sx*k,r.sz*k,1)
r.g.material.opacity=Math.max(0,.95*(1-p))
if(p>=1){scene.remove(r.g);r.g.geometry.dispose();r.g.material.dispose();rings.splice(i,1)}
}
const topY=top?top.y+LH:1
const sway=red?0:Math.min(1,n/40)*.035
tower.rotation.z=Math.sin(clock*1.1)*sway
tower.rotation.x=Math.cos(clock*.9)*sway*.7
if(st==='over'){
overT+=dt
tilt=Math.min(1,overT/1.4)
}
const ty=st==='over'?Math.max(2,topY*.5):Math.max(2.2,topY-.5)
camY+=(ty-camY)*Math.min(1,dt*2.6)
const asp=s.w()/Math.max(1,s.h())
const baseD=Math.max(14,6.2/(Math.tan(camera.fov*Math.PI/360)*Math.min(asp,1.6)))
const td=st==='over'?baseD+topY*.7:baseD+Math.min(8,topY*.12)
camD+=(td-camD)*Math.min(1,dt*1.8)
az+=dt*(red?0:.03)
const el0=.42+tilt*.1
camera.position.set(Math.sin(az)*camD*Math.cos(el0),camY+camD*Math.sin(el0)+1.2,Math.cos(az)*camD*Math.cos(el0))
if(shakeA>0){
camera.position.x+=(Math.random()-.5)*shakeA
camera.position.y+=(Math.random()-.5)*shakeA
shakeA=Math.max(0,shakeA-dt*1.4)
}
camera.lookAt(0,camY+.8,0)
if(sun){
sun.position.set(7,topY+16,9)
sun.target.position.set(0,topY-2,0)
sun.target.updateMatrixWorld()
}
if(st==='over'&&!finished&&overT>1.5)end()
if(tg){
tmpV.set(top?top.x:0,0,top?top.z:0)
tg.rotation.y=Math.atan2(tmpV.x-tg.position.x,tmpV.z-tg.position.z)
}
}
s.loop(frame)
return()=>{
dead=true
removeEventListener('keydown',onKey)
host.removeEventListener('pointerdown',onDown)
try{if(AU&&AU.music)AU.music(false)}catch{}
try{s.stop()}catch{}
try{disposeObj(scene)}catch{}
try{s.dispose()}catch{}
hud.remove()
try{if(ctx&&ctx.close)ctx.close()}catch{}
}
}
