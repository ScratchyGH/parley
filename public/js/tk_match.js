import{stage,THREE,pie,fruit,turkey,cornucopia,burst,mat,audio,disposeObj}from'./tk3d.js'
const BK='tk_match_best'
const N=7
const CS=1.1
const TOP=.26
const DUR=75
const COL=[0xf08a1a,0xd8322c,0xf2c230,0x9a6a34,0xc98a3c,0xcfd04a]
const NOTES=[523,587,659,784,880,1047,1175,1319,1568]
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
const eo=p=>1-Math.pow(1-p,3)
const eb=p=>{const c=1.4;return 1+(c+1)*Math.pow(p-1,3)+c*Math.pow(p-1,2)}
const cx=c=>(c-(N-1)/2)*CS
const cz=r=>(r-(N-1)/2)*CS
function fit(o,d,hmax){
const g=new THREE.Group()
g.add(o)
const b=new THREE.Box3().setFromObject(g)
const s=new THREE.Vector3()
b.getSize(s)
let k=d/Math.max(s.x,s.z,1e-6)
if(hmax)k=Math.min(k,hmax/Math.max(s.y,1e-6))
o.scale.multiplyScalar(k)
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
g.addColorStop(.6,'#2a150a')
g.addColorStop(1,'#4a230d')
x.fillStyle=g
x.fillRect(0,0,4,256)
const t=new THREE.CanvasTexture(c)
t.colorSpace=THREE.SRGBColorSpace
return t
}
function rrp(p,w,r){
const x=-w/2
const y=-w/2
p.moveTo(x+r,y)
p.lineTo(x+w-r,y)
p.quadraticCurveTo(x+w,y,x+w,y+r)
p.lineTo(x+w,y+w-r)
p.quadraticCurveTo(x+w,y+w,x+w-r,y+w)
p.lineTo(x+r,y+w)
p.quadraticCurveTo(x,y+w,x,y+w-r)
p.lineTo(x,y+r)
p.quadraticCurveTo(x,y,x+r,y)
return p
}
function ringGeo(wo,wi,r){
const s=rrp(new THREE.Shape(),wo,r)
s.holes.push(rrp(new THREE.Path(),wi,r*.7))
const g=new THREE.ShapeGeometry(s)
g.rotateX(-Math.PI/2)
return g
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
camera.fov=40
camera.updateProjectionMatrix()
scene.background=bgTex()
scene.fog=new THREE.Fog(0x1b0f08,30,80)
scene.add(new THREE.HemisphereLight(0xffe2b8,0x2a1608,.7))
const sun=s.sun
if(sun){
sun.color.set(0xffe0b0)
sun.intensity=Math.max(sun.intensity||0,1.7)
sun.castShadow=!lite
sun.shadow.camera.left=-12
sun.shadow.camera.right=12
sun.shadow.camera.top=12
sun.shadow.camera.bottom=-12
sun.shadow.camera.far=60
sun.shadow.bias=-.0008
sun.position.set(5,16,9)
sun.target.position.set(0,0,0)
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
const glow=glowTex()
const table=new THREE.Group()
scene.add(table)
const slab=new THREE.Mesh(new THREE.BoxGeometry(40,1.2,26),mat(0x6b3a1c,{roughness:.62}))
slab.position.y=-.6
table.add(slab)
for(let i=-6;i<=6;i++){
const pk=new THREE.Mesh(new THREE.BoxGeometry(.05,.02,26),mat(0x3d2010,{roughness:.9}))
pk.position.set(i*3.1,.01,0)
table.add(pk)
}
const burl=new THREE.Mesh(new THREE.BoxGeometry(N*CS+4.4,.06,N*CS+3.4),mat(0xb89a68,{roughness:1}))
burl.position.y=.03
table.add(burl)
const edge=new THREE.Mesh(new THREE.BoxGeometry(N*CS+4.7,.04,N*CS+3.7),mat(0x7a5a2a,{roughness:1}))
edge.position.y=.015
table.add(edge)
const bd=new THREE.Group()
scene.add(bd)
const W=N*CS
const felt=new THREE.Mesh(new THREE.BoxGeometry(W+.1,.14,W+.1),mat(0x24140a,{roughness:.9}))
felt.position.y=.1
table.add(felt)
for(const[x,z,w,d]of [[0,-(W/2+.2),W+.9,.4],[0,W/2+.2,W+.9,.4],[-(W/2+.2),0,.4,W],[W/2+.2,0,.4,W]]){
const f=new THREE.Mesh(new THREE.BoxGeometry(w,.44,d),mat(0x4a2812,{roughness:.55}))
f.position.set(x,.22,z)
table.add(f)
}
const tileGeo=(()=>{
const sh=rrp(new THREE.Shape(),CS-.06,.14)
const g=new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.05,bevelSize:.04,bevelSegments:2,curveSegments:6})
g.rotateX(-Math.PI/2)
g.translate(0,.05,0)
return g
})()
const tm=[mat(0x93622f,{roughness:.5}),mat(0x7a4d22,{roughness:.5})]
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const t=new THREE.Mesh(tileGeo,tm[(r+c)&1])
t.position.set(cx(c),0,cz(r))
table.add(t)
}
const candles=[]
for(const[x,z]of [[-7.4,-5.6],[7.4,-5.6],[-7.6,5.6],[7.6,5.6]]){
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
if(!lite&&candles.length<2){
pl=new THREE.PointLight(0xffa84a,34,18,2)
pl.position.y=2.9
g.add(pl)
}
g.position.set(x,0,z)
table.add(g)
candles.push({fl,sp,pl,ph:Math.random()*6})
}
function dish(o,d,x,z,y,hm){
const f=fit(o,d,hm)
f.position.set(x,y||.06,z)
f.rotation.y=Math.random()*6
table.add(f)
}
dish(fruit('pumpkin'),1.8,-8.6,-1.4)
dish(fruit('pumpkin'),1.3,-9.2,.7)
dish(fruit('apple'),1,8.7,-1.8)
dish(fruit('apple'),1,9.5,-.8)
dish(fruit('corn'),2.4,8.8,2.6,.06,1)
dish(fruit('grapes'),1.4,-8.8,3.6)
const cc=fit(cornucopia(),4.6)
cc.position.set(-3.2,.06,-8.6)
cc.rotation.y=.4
table.add(cc)
const tk=turkey({pilgrim:true,scale:1})
const tg=fit(tk.group,3)
tg.position.set(5.6,.06,-8)
tg.rotation.y=Math.PI*-.15
table.add(tg)
shade(table,!lite)
const raw=[fruit('pumpkin'),fruit('apple'),fruit('corn'),fruit('acorn'),pie('pecan'),fruit('pear')]
const protos=raw.map((o,i)=>fit(o,.84,i===2?.9:1.0))
protos.forEach(p=>shade(p,!lite))
const bursts=burst(scene)
const selMesh=new THREE.Mesh(ringGeo(CS-.02,CS-.2,.14),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95,depthWrite:false}))
selMesh.position.y=TOP+.02
selMesh.visible=false
scene.add(selMesh)
const curMesh=new THREE.Mesh(ringGeo(CS-.02,CS-.14,.14),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,depthWrite:false}))
curMesh.position.y=TOP+.025
curMesh.visible=false
scene.add(curMesh)
const hud=el('div','tk3-hud')
const sc=el('div','tk3-score')
const scN=el('b',null,'0')
const scS=el('span',null,'')
sc.append(scN,scS)
const side=el('div','tk3-side')
const sideB=el('b',null,String(best))
side.append(el('div',null,'Best'),sideB)
const chainBox=el('div','tk3m-chain')
const chainB=el('b',null,'')
chainBox.append(el('div',null,'Combo'),chainB)
const timeBar=el('div','tk3m-time')
const timeFill=el('i')
timeBar.append(timeFill)
const secsEl=el('div','tk3m-secs','75')
const flash=el('div','tk3-flash')
const mb=el('button','tk3-mute','Snd')
mb.type='button'
mb.setAttribute('aria-label','Toggle sound')
hud.append(sc,side,chainBox,timeBar,secsEl,flash,mb)
host.append(hud)
let panel=null
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
const timers=[]
const tmpV=new THREE.Vector3()
function pop(x,y,z,txt,big){
tmpV.set(x,y,z).project(camera)
const e=el('div','tk3-pop'+(big?' big':''),txt)
e.style.setProperty('left',((tmpV.x*.5+.5)*s.w())+'px')
e.style.setProperty('top',((-tmpV.y*.5+.5)*s.h())+'px')
hud.append(e)
timers.push(setTimeout(()=>e.remove(),1050))
}
let g=[]
let st='ready'
let score=0
let shown=0
let timeL=DUR
let clock=0
let t0=0
let busy=false
let dead=false
let finished=false
let pendingEnd=false
let idle=0
let hintM=null
let sel=null
let cur={r:3,c:3}
let kbd=false
let drag=null
let comboN=0
let shakeA=0
let px=0
let py=0
let camD=14
const tws=[]
function tw(d,f){
return new Promise(res=>{tws.push({t:0,d,f,res})})
}
const wait=d=>tw(d,()=>{})
function tickTw(dt){
for(const x of [...tws]){
x.t+=dt
const p=Math.min(1,x.t/x.d)
x.f(p)
if(p>=1){tws.splice(tws.indexOf(x),1);x.res()}
}
}
function mk(t,r,c){
const w=new THREE.Group()
const m=protos[t].clone(true)
w.add(m)
w.position.set(cx(c),TOP,cz(r))
bd.add(w)
return{t,sp:0,w,m,r,c,k:1,badge:null,bs:0}
}
function addBadge(p){
if(p.badge){p.w.remove(p.badge);p.badge=null}
if(!p.sp)return
const b=new THREE.Group()
if(p.sp===1){
const a=new THREE.Mesh(new THREE.BoxGeometry(.62,.07,.14),new THREE.MeshBasicMaterial({color:0xffe9a8}))
const c=a.clone()
c.rotation.y=Math.PI/2
b.add(a,c)
}else{
const o=new THREE.Mesh(new THREE.OctahedronGeometry(.26,0),new THREE.MeshBasicMaterial({color:0xfff0b0}))
o.scale.set(.8,1.2,.8)
b.add(o)
}
const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,color:p.sp===2?0xffd060:0x9fd8ff}))
sp.scale.set(1.7,1.7,1)
b.add(sp)
b.position.y=1.12
p.w.add(b)
p.badge=b
p.bs=0
}
function types(){
return g.map(r=>r.map(p=>p?p.t:-1))
}
function anyMatch(T){
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const t=T[r][c]
if(t<0)continue
if(c+2<N&&T[r][c+1]===t&&T[r][c+2]===t)return true
if(r+2<N&&T[r+1][c]===t&&T[r+2][c]===t)return true
}
return false
}
function moves(T){
const out=[]
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
for(const[dr,dc]of [[0,1],[1,0]]){
const r2=r+dr
const c2=c+dc
if(r2>=N||c2>=N)continue
const a=T[r][c]
T[r][c]=T[r2][c2]
T[r2][c2]=a
const ok=anyMatch(T)
T[r2][c2]=T[r][c]
T[r][c]=a
if(ok)out.push([{r,c},{r:r2,c:c2}])
}
}
return out
}
function hasStar(){
for(const row of g)for(const p of row)if(p&&p.sp===2)return true
return false
}
function hasMove(){
return hasStar()||moves(types()).length>0
}
function findHint(){
const m=moves(types())
if(hasStar()){
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const p=g[r][c]
if(p&&p.sp===2){
const nb=[[r,c+1],[r,c-1],[r+1,c],[r-1,c]].find(q=>q[0]>=0&&q[0]<N&&q[1]>=0&&q[1]<N)
if(nb)m.push([{r,c},{r:nb[0],c:nb[1]}])
}
}
}
return m.length?m[(Math.random()*m.length)|0]:null
}
function scan(pref){
const T=types()
const runs=[]
for(let r=0;r<N;r++){
let c=0
while(c<N){
let e=c
while(T[r][c]>=0&&e+1<N&&T[r][e+1]===T[r][c])e++
if(e-c>=2){const cells=[];for(let i=c;i<=e;i++)cells.push([r,i]);runs.push(cells)}
c=e+1
}
}
for(let c=0;c<N;c++){
let r=0
while(r<N){
let e=r
while(T[r][c]>=0&&e+1<N&&T[e+1][c]===T[r][c])e++
if(e-r>=2){const cells=[];for(let i=r;i<=e;i++)cells.push([i,c]);runs.push(cells)}
r=e+1
}
}
const clear=new Set()
const make=new Map()
const cnt=new Map()
for(const run of runs){
for(const q of run){
const k=q[0]*N+q[1]
clear.add(k)
cnt.set(k,(cnt.get(k)||0)+1)
}
if(run.length>=4){
let m=run[(run.length/2)|0]
if(pref)for(const pr of pref){const f=run.find(q=>q[0]===pr.r&&q[1]===pr.c);if(f){m=f;break}}
const k=m[0]*N+m[1]
const sp=run.length>=5?2:1
if((make.get(k)||0)<sp)make.set(k,sp)
}
}
for(const[k,v]of cnt)if(v>1&&!make.get(k))make.set(k,1)
for(const k of make.keys())clear.delete(k)
return{clear,make}
}
function layout(p){
p.w.position.set(cx(p.c),TOP,cz(p.r))
}
function fill(anim){
for(const row of g)for(const p of row)if(p)bd.remove(p.w)
g=[]
let T
let tries=0
do{
T=[]
for(let r=0;r<N;r++){
T.push([])
for(let c=0;c<N;c++){
let t
do{t=(Math.random()*6)|0}while((c>=2&&T[r][c-1]===t&&T[r][c-2]===t)||(r>=2&&T[r-1][c]===t&&T[r-2][c]===t))
T[r].push(t)
}
}
tries++
}while(moves(T).length<3&&tries<40)
for(let r=0;r<N;r++){
g.push([])
for(let c=0;c<N;c++){
const p=mk(T[r][c],r,c)
if(anim)p.k=.001
g[r].push(p)
}
}
if(anim)return tw(.5,pr=>{
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const p=g[r][c]
const q=Math.min(1,Math.max(0,pr*1.6-(r+c)*.05))
p.k=Math.max(.001,eb(q))
}
}).then(()=>{for(const row of g)for(const p of row)p.k=1})
}
async function slide(list){
const d=.16
await tw(d,pr=>{
const e=eo(pr)
for(const x of list){
x.p.w.position.x=x.fx+(cx(x.p.c)-x.fx)*e
x.p.w.position.z=x.fz+(cz(x.p.r)-x.fz)*e
x.p.w.position.y=TOP+Math.sin(pr*Math.PI)*(red?0:.28)*x.h
}
})
for(const x of list)layout(x.p)
}
function clearSel(){
sel=null
selMesh.visible=false
}
function adj(a,b){
return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1
}
async function trySwap(a,b){
if(busy||st!=='play'||dead||timeL<=0)return
const pa=g[a.r][a.c]
const pb=g[b.r][b.c]
if(!pa||!pb)return
busy=true
idle=0
hintM=null
clearSel()
const ia={p:pa,fx:cx(a.c),fz:cz(a.r),h:1}
const ib={p:pb,fx:cx(b.c),fz:cz(b.r),h:1}
g[a.r][a.c]=pb
g[b.r][b.c]=pa
pa.r=b.r
pa.c=b.c
pb.r=a.r
pb.c=a.c
tone(420,.07,'square',.05)
await slide([ia,ib])
if(dead)return
if(pa.sp===2||pb.sp===2){
const star=pa.sp===2?pa:pb
const other=star===pa?pb:pa
const set=new Set()
const both=other.sp===2
if(!both)star.sp=0
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const p=g[r][c]
if(p&&(both||p.t===other.t||p===star))set.add(r*N+c)
}
await resolve(null,set)
}else if(scan([a,b]).clear.size===0&&scan([a,b]).make.size===0){
tone(150,.14,'sawtooth',.08)
g[a.r][a.c]=pa
g[b.r][b.c]=pb
pa.r=a.r
pa.c=a.c
pb.r=b.r
pb.c=b.c
await slide([{p:pa,fx:cx(b.c),fz:cz(b.r),h:.4},{p:pb,fx:cx(a.c),fz:cz(a.r),h:.4}])
}else{
await resolve([a,b],null)
}
if(dead)return
busy=false
idle=0
if(timeL<=0||pendingEnd)endGame()
}
async function resolve(pref,forced){
let ch=0
if(forced){
ch=1
await clearSet(forced,new Map(),ch)
await settle()
}
for(;;){
if(dead)return
const m=scan(pref)
pref=null
if(!m.clear.size&&!m.make.size)break
ch++
await clearSet(m.clear,m.make,ch)
await settle()
}
comboN=0
chainB.textContent=''
if(!dead&&timeL>0&&!hasMove()){
showFlash('Reshuffling')
await tw(.35,pr=>{for(const row of g)for(const p of row)if(p)p.k=Math.max(.001,1-eo(pr))})
await fill(true)
}
}
async function clearSet(set,make,ch){
const all=new Set(set)
const q=[...set]
const add=k=>{if(!all.has(k)){all.add(k);q.push(k)}}
let usedSpecial=0
while(q.length){
const k=q.pop()
const r=(k/N)|0
const c=k%N
const p=g[r][c]
if(!p||!p.sp)continue
usedSpecial++
if(p.sp===1){for(let i=0;i<N;i++){add(r*N+i);add(i*N+c)}}
else{for(let rr=0;rr<N;rr++)for(let cc=0;cc<N;cc++){const o=g[rr][cc];if(o&&o.t===p.t)add(rr*N+cc)}}
}
const list=[]
for(const k of all){
const r=(k/N)|0
const c=k%N
const p=g[r][c]
if(p){list.push(p);g[r][c]=null}
}
comboN=Math.max(comboN,ch)
let bonus=0
for(const v of make.values())bonus+=v===2?3:2
if(ch>=2)bonus+=1
timeL=Math.min(99,timeL+bonus)
const pts=list.length*10*ch+make.size*25
score+=pts
let ax=0
let az=0
for(const p of list){ax+=p.w.position.x;az+=p.w.position.z}
ax/=Math.max(1,list.length)
az/=Math.max(1,list.length)
const n=Math.min(ch-1,NOTES.length-1)
tone(NOTES[n],.3,'triangle',.13)
tone(NOTES[n]*1.5,.4,'sine',.06)
if(list.length>=5)tone(NOTES[Math.min(n+2,NOTES.length-1)],.35,'triangle',.08)
if(usedSpecial){tone(300,.5,'sawtooth',.07,2.4);tone(880,.4,'sine',.07,.5)}
chainB.textContent=ch>1?'x'+ch:''
const per=list.length>20?1:list.length>10?2:3
for(const p of list)bursts.emit(new THREE.Vector3(p.w.position.x,TOP+.5,p.w.position.z),red?2:per*(lite?1:2),COL[p.t],2.8+ch*.3)
if(!red)shakeA=Math.min(.5,.05+list.length*.012+usedSpecial*.15)
pop(ax,TOP+.8,az,'+'+pts,ch>1||list.length>=6)
if(ch>1)showFlash('Chain x'+ch,ch>=3)
const dd=.26
await tw(dd,pr=>{
const k=Math.max(.001,1-eo(pr))
for(const p of list){
p.k=k
p.w.rotation.y+=.25
p.w.position.y=TOP+Math.sin(pr*Math.PI*.5)*.5
}
})
for(const p of list)bd.remove(p.w)
for(const[k,v]of make){
const r=(k/N)|0
const c=k%N
const p=g[r][c]
if(!p)continue
if(p.sp<v){
p.sp=v
addBadge(p)
tone(v===2?988:740,.4,'triangle',.1)
tone(v===2?1319:988,.5,'sine',.06)
bursts.emit(new THREE.Vector3(p.w.position.x,TOP+.6,p.w.position.z),red?4:14,0xffe08a,3)
showFlash(v===2?'Harvest Star':'Cross',true)
}
}
}
async function settle(){
const mv=[]
for(let c=0;c<N;c++){
let wr=N-1
for(let r=N-1;r>=0;r--){
const p=g[r][c]
if(p){
if(r!==wr){
g[wr][c]=p
g[r][c]=null
mv.push({p,z0:p.w.position.z,z1:cz(wr),d:0,sp:false})
}
p.r=wr
p.c=c
wr--
}
}
const empt=wr+1
for(let r=wr;r>=0;r--){
const p=mk((Math.random()*6)|0,r,c)
g[r][c]=p
p.k=.001
const z0=cz(r-empt)
p.w.position.z=z0
mv.push({p,z0,z1:cz(r),d:0,sp:true})
}
}
if(!mv.length)return
let mx=0
for(const m of mv){
m.d=.2+Math.abs(m.z1-m.z0)/CS*.075
if(m.d>mx)mx=m.d
}
await tw(mx,pr=>{
const t=pr*mx
for(const m of mv){
const q=Math.min(1,t/m.d)
const e=eo(q)
m.p.w.position.z=m.z0+(m.z1-m.z0)*e
m.p.w.position.y=TOP+Math.sin(q*Math.PI)*(red?0:.1)
if(m.sp)m.p.k=Math.max(.001,eb(Math.min(1,q*1.6)))
}
})
for(const m of mv){m.p.k=1;layout(m.p)}
tone(200,.1,'sine',.07,.5)
}
function begin(){
if(ctx&&ctx.state==='suspended')ctx.resume()
clearPanel()
tws.length=0
score=0
shown=0
timeL=DUR
busy=false
finished=false
pendingEnd=false
comboN=0
chainB.textContent=''
idle=0
hintM=null
clearSel()
fill(true)
st='play'
t0=clock
try{if(AU&&AU.music&&!muted)AU.music(true)}catch{}
}
function endGame(){
if(finished)return
finished=true
pendingEnd=false
st='over'
clearSel()
hintM=null
const secs=Math.max(0,clock-t0)
const nb=score>best
if(nb){best=score;try{localStorage.setItem(BK,String(best))}catch{}}
sideB.textContent=best
const pn=makePanel("Time's up",[[nb&&score>0?'New best':'Best '+best,'dim']],score,[['Play again',()=>begin(),true],['Close',()=>api.close()]])
const pars=el('p',null,'Saving score')
pn.insertBefore(pars,pn.querySelector('.tk3-row'))
Promise.resolve(api.finish(Math.floor(score/60),Math.floor(secs))).then(r=>{pars.textContent=r&&r.pars>0?'+'+r.pars+' Pars':'No Pars this run'}).catch(()=>{pars.textContent=''})
}
const ray=new THREE.Raycaster()
const pl=new THREE.Plane(new THREE.Vector3(0,1,0),-TOP)
const hitV=new THREE.Vector3()
const ndc=new THREE.Vector2()
function pick(e){
const rc=host.getBoundingClientRect()
ndc.set(((e.clientX-rc.left)/rc.width)*2-1,-(((e.clientY-rc.top)/rc.height)*2-1))
ray.setFromCamera(ndc,camera)
if(!ray.ray.intersectPlane(pl,hitV))return null
const c=Math.round(hitV.x/CS+(N-1)/2)
const r=Math.round(hitV.z/CS+(N-1)/2)
if(r<0||r>=N||c<0||c>=N)return null
return{r,c}
}
function select(c){
sel={r:c.r,c:c.c}
selMesh.position.set(cx(c.c),TOP+.02,cz(c.r))
selMesh.visible=true
tone(620,.06,'sine',.06)
}
const onDown=e=>{
if(e.button!=null&&e.button>0)return
if(ctx&&ctx.state==='suspended')ctx.resume()
if(st!=='play'||busy||dead)return
const c=pick(e)
if(!c)return
kbd=false
curMesh.visible=false
idle=0
hintM=null
if(sel&&adj(sel,c)){trySwap(sel,c);return}
if(sel&&sel.r===c.r&&sel.c===c.c){clearSel();return}
select(c)
drag={r:c.r,c:c.c,x:e.clientX,y:e.clientY}
try{host.setPointerCapture(e.pointerId)}catch{}
}
const onMove=e=>{
const rc=host.getBoundingClientRect()
px=(e.clientX-rc.left)/rc.width-.5
py=(e.clientY-rc.top)/rc.height-.5
if(!drag||busy||st!=='play')return
const dx=e.clientX-drag.x
const dy=e.clientY-drag.y
if(Math.hypot(dx,dy)<18)return
const b=Math.abs(dx)>Math.abs(dy)?{r:drag.r,c:drag.c+Math.sign(dx)}:{r:drag.r+Math.sign(dy),c:drag.c}
const a={r:drag.r,c:drag.c}
drag=null
if(b.r<0||b.r>=N||b.c<0||b.c>=N)return
trySwap(a,b)
}
const onUp=()=>{drag=null}
const onKey=e=>{
if(e.code==='KeyM'){setMuted(!muted);return}
if(e.code==='KeyR'&&st==='over'&&finished){begin();return}
if(st==='ready'&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();begin();return}
if(st!=='play'||busy)return
const dirs={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0],KeyA:[0,-1],KeyD:[0,1],KeyW:[-1,0],KeyS:[1,0]}
const d=dirs[e.code]
if(d){
e.preventDefault()
kbd=true
idle=0
hintM=null
if(sel){
const b={r:sel.r+d[0],c:sel.c+d[1]}
if(b.r>=0&&b.r<N&&b.c>=0&&b.c<N)trySwap(sel,b)
}else{
cur.r=Math.min(N-1,Math.max(0,cur.r+d[0]))
cur.c=Math.min(N-1,Math.max(0,cur.c+d[1]))
}
}else if(e.code==='Space'||e.code==='Enter'){
e.preventDefault()
kbd=true
idle=0
if(sel)clearSel()
else select(cur)
}
}
host.addEventListener('pointerdown',onDown)
host.addEventListener('pointermove',onMove)
host.addEventListener('pointerup',onUp)
host.addEventListener('pointercancel',onUp)
addEventListener('keydown',onKey)
mb.addEventListener('pointerdown',e=>e.stopPropagation())
mb.addEventListener('click',()=>setMuted(!muted))
fill(false)
makePanel('Harvest Match',[['Swap neighbors to line up three or more. Drag a piece or tap two.'],['Four makes a Cross that clears a row and column. Five makes a Harvest Star that clears a whole kind. Big matches add seconds.','dim'],['Best '+best,'dim']],null,[['Start',()=>begin(),true]])
function frame(dt0){
let dt=dt0
if(dt>1)dt/=1000
dt=Math.min(dt||.016,.05)
clock+=dt
tickTw(dt)
for(const c of candles){
if(red)continue
const f=.85+Math.sin(clock*9+c.ph)*.08+Math.sin(clock*23+c.ph*2)*.05
c.fl.scale.set(1,1.8*f,1)
c.sp.material.opacity=.7+f*.3
if(c.pl)c.pl.intensity=32*f
}
if(tk&&tk.tick)tk.tick(dt,0,'idle')
bursts.tick(dt)
if(st==='play'){
timeL-=dt
if(timeL<=0){
timeL=0
if(busy)pendingEnd=true
else endGame()
}
if(!busy){
idle+=dt
if(idle>5&&!hintM)hintM=findHint()
}
}
const sc0=score
shown+=(sc0-shown)*Math.min(1,dt*8)
if(Math.abs(sc0-shown)<.6)shown=sc0
scN.textContent=Math.round(shown)
const tl=Math.max(0,timeL)
timeFill.style.setProperty('transform','scaleX('+(Math.min(1,tl/DUR))+')')
timeBar.classList.toggle('low',tl<10&&st==='play')
secsEl.textContent=Math.ceil(tl)
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const p=g[r]&&g[r][c]
if(!p)continue
let m=p.k
let lift=0
const isSel=sel&&sel.r===r&&sel.c===c
const isHint=hintM&&((hintM[0].r===r&&hintM[0].c===c)||(hintM[1].r===r&&hintM[1].c===c))
if(isHint&&!red)m*=1+.11*Math.sin(clock*9)
if(isSel){m*=1.1;lift=.12+Math.sin(clock*6)*.05}
p.w.scale.setScalar(m)
p.m.position.y+=(lift-p.m.position.y)*Math.min(1,dt*14)
p.m.rotation.y=isSel&&!red?Math.sin(clock*4)*.35:p.m.rotation.y*(1-Math.min(1,dt*10))
if(p.badge){
p.bs=Math.min(1,p.bs+dt*4)
p.badge.rotation.y=clock*(red?0:2)
p.badge.scale.setScalar(eb(p.bs)*(1+(red?0:Math.sin(clock*5+r+c)*.08)))
p.badge.position.y=1.12+(red?0:Math.sin(clock*3+r)*.06)
}
}
curMesh.visible=kbd&&st==='play'&&!sel
if(curMesh.visible)curMesh.position.set(cx(cur.c),TOP+.025,cz(cur.r))
selMesh.material.opacity=.7+Math.sin(clock*7)*.25
const asp=s.w()/Math.max(1,s.h())
const th=Math.tan(camera.fov*Math.PI/360)
const need=Math.max(W*.62/(th*Math.min(asp,1.5)),11)
camD+=(need+1.5-camD)*Math.min(1,dt*3)
const el0=1.0
const camx=red?0:px*1.8
const camz=red?0:py*1.2
camera.position.set(camx,Math.sin(el0)*camD,Math.cos(el0)*camD+camz+.8)
if(shakeA>0){
camera.position.x+=(Math.random()-.5)*shakeA
camera.position.y+=(Math.random()-.5)*shakeA
shakeA=Math.max(0,shakeA-dt*1.5)
}
camera.lookAt(camx*.3,0,-.9)
}
s.loop(frame)
return()=>{
dead=true
for(const t of timers)clearTimeout(t)
tws.length=0
removeEventListener('keydown',onKey)
host.removeEventListener('pointerdown',onDown)
host.removeEventListener('pointermove',onMove)
host.removeEventListener('pointerup',onUp)
host.removeEventListener('pointercancel',onUp)
try{if(AU&&AU.music)AU.music(false)}catch{}
try{s.stop()}catch{}
try{disposeObj(scene)}catch{}
try{s.dispose()}catch{}
hud.remove()
try{if(ctx&&ctx.close)ctx.close()}catch{}
}
}
