import{a as THREE,c as makeRenderer,d as canvasTex}from'/g3d/chunk-FU6IKM4K.js'
export{THREE}
const T=THREE
const TAU=Math.PI*2
const V2=(x,y)=>new T.Vector2(x,y)
export const rng=seed=>{let s=(seed|0)||1;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
export const mat=(color,o)=>new T.MeshStandardMaterial(Object.assign({color,roughness:.75,metalness:.02},o||{}))
export function disposeObj(obj){
if(!obj)return
obj.traverse(o=>{
if(o.geometry)o.geometry.dispose()
const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[]
for(const m of ms){
for(const k in m){const v=m[k];if(v&&v.isTexture)v.dispose()}
m.dispose()
}
})
}
const texCache=new Map()
const tex=(key,w,h,fn,rep)=>{
let t=texCache.get(key)
if(!t){t=canvasTex(w,h,fn);if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep[0],rep[1])}texCache.set(key,t)}
return t
}
const mesh=(geo,m,x,y,z)=>{
const o=new T.Mesh(geo,m)
o.position.set(x||0,y||0,z||0)
o.castShadow=true
o.receiveShadow=true
return o
}
const lathe=(pts,seg,a,b)=>new T.LatheGeometry(pts.map(p=>V2(p[0],p[1])),seg||32,a||0,b||TAU)
const col=c=>c.isColor?c:new T.Color(c)
const paint=(geo,fn)=>{
const p=geo.attributes.position
const n=geo.attributes.normal
const arr=new Float32Array(p.count*3)
for(let i=0;i<p.count;i++){
const c=col(fn(p.getX(i),p.getY(i),p.getZ(i),n?n.getX(i):0,n?n.getY(i):1,n?n.getZ(i):0,i))
arr[i*3]=c.r;arr[i*3+1]=c.g;arr[i*3+2]=c.b
}
geo.setAttribute('color',new T.BufferAttribute(arr,3))
return geo
}
const place=(g,o)=>{
const m=new T.Matrix4()
const q=new T.Quaternion().setFromEuler(new T.Euler(o.rx||0,o.ry||0,o.rz||0))
m.compose(new T.Vector3(o.x||0,o.y||0,o.z||0),q,new T.Vector3(o.sx||o.s||1,o.sy||o.s||1,o.sz||o.s||1))
g.applyMatrix4(m)
return g
}
const merge=list=>{
const gs=list.map(g=>g.index?g.toNonIndexed():g)
let n=0
for(const g of gs)n+=g.attributes.position.count
const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3)
let o=0
for(const g of gs){
const c=g.attributes.position.count
P.set(g.attributes.position.array,o*3)
N.set(g.attributes.normal.array,o*3)
if(g.attributes.color)C.set(g.attributes.color.array,o*3);else C.fill(1,o*3,(o+c)*3)
o+=c
}
const r=new T.BufferGeometry()
r.setAttribute('position',new T.BufferAttribute(P,3))
r.setAttribute('normal',new T.BufferAttribute(N,3))
r.setAttribute('color',new T.BufferAttribute(C,3))
return r
}
const sweep=(curve,seg,rad,radiusAt,colorAt)=>{
const P=[],C=[],UV=[],I=[]
const fr=curve.computeFrenetFrames(seg,false)
for(let i=0;i<=seg;i++){
const u=i/seg
const p=curve.getPointAt(u)
const N=fr.normals[i],B=fr.binormals[i]
const r=radiusAt(u)
const cc=colorAt?col(colorAt(u)):null
for(let j=0;j<=rad;j++){
const a=j/rad*TAU
const ca=Math.cos(a),sa=Math.sin(a)
P.push(p.x+r*(ca*N.x+sa*B.x),p.y+r*(ca*N.y+sa*B.y),p.z+r*(ca*N.z+sa*B.z))
UV.push(j/rad,u)
if(cc)C.push(cc.r,cc.g,cc.b)
}
}
for(let i=0;i<seg;i++)for(let j=0;j<rad;j++){
const a=i*(rad+1)+j,b=a+rad+1
I.push(a,b,a+1,b,b+1,a+1)
}
const g=new T.BufferGeometry()
g.setAttribute('position',new T.Float32BufferAttribute(P,3))
g.setAttribute('uv',new T.Float32BufferAttribute(UV,2))
if(colorAt)g.setAttribute('color',new T.Float32BufferAttribute(C,3))
g.setIndex(I)
g.computeVertexNormals()
return g
}
const lerp=(a,b,k)=>a+(b-a)*k
const leafPath=(c,w,h)=>{
const cx=w/2,cy=h*.55,R=w*.46
c.beginPath()
const n=120
for(let i=0;i<=n;i++){
const a=i/n*TAU
const lobe=.52+.48*Math.pow(Math.abs(Math.cos(2.5*a)),.6)
const r=R*lobe*(1+.12*Math.sin(a*5))
const x=cx+Math.sin(a)*r*.95
const y=cy-Math.cos(a)*r*(a>1.9&&a<4.4?.8:1)
if(i===0)c.moveTo(x,y);else c.lineTo(x,y)
}
c.closePath()
}
const leafTex=()=>tex('leaf',128,128,(c,w,h)=>{
c.clearRect(0,0,w,h)
const g=c.createRadialGradient(w/2,h*.55,4,w/2,h*.55,w*.5)
g.addColorStop(0,'#ffffff');g.addColorStop(1,'#d8d8d8')
c.fillStyle=g
leafPath(c,w,h)
c.fill()
c.strokeStyle='rgba(90,60,30,.55)'
c.lineWidth=2
c.lineCap='round'
const cx=w/2,cy=h*.55
for(let k=0;k<5;k++){
const a=(k-2)*.62
c.beginPath();c.moveTo(cx,cy+h*.2);c.lineTo(cx+Math.sin(a)*w*.4,cy-Math.cos(a)*h*.42);c.stroke()
}
c.beginPath();c.moveTo(cx,h*.98);c.lineTo(cx,cy+h*.2);c.stroke()
c.fillStyle='rgba(0,0,0,.12)'
for(let k=0;k<30;k++){c.beginPath();c.arc(cx+(Math.random()-.5)*w*.7,cy+(Math.random()-.5)*h*.6,1.5,0,TAU);c.fill()}
})
const leafMat=(color,o)=>new T.MeshStandardMaterial(Object.assign({color,map:leafTex(),alphaTest:.5,side:T.DoubleSide,roughness:.8},o||{}))
const leafGeo=()=>{
const g=new T.PlaneGeometry(1,1,3,3)
const p=g.attributes.position
for(let i=0;i<p.count;i++)p.setZ(i,Math.abs(p.getX(i))*.25)
g.computeVertexNormals()
return g
}
export function stage(host,o){
o=o||{}
const R=makeRenderer(host,{lite:o.lite,exp:o.exp||1.1,noShadow:!!o.lite})
const r=R.r
const cv=r.domElement
cv.style.setProperty('position','absolute')
cv.style.setProperty('inset','0')
cv.style.setProperty('width','100%')
cv.style.setProperty('height','100%')
cv.style.setProperty('display','block')
const sk=Array.isArray(o.sky)?o.sky:['#6f93bd','#ffd7a1','#d99a62']
const scene=new T.Scene()
scene.background=new T.Color(sk[1])
if(typeof o.fog==='number'&&o.fog<1)scene.fog=new T.FogExp2(sk[1],o.fog)
else if(typeof o.fog==='number')scene.fog=new T.Fog(o.fog,40,230)
else{const f=o.fog||{};scene.fog=new T.Fog(f.color||sk[1],f.near==null?60:f.near,f.far||260)}
const camera=new T.PerspectiveCamera(55,1,.1,700)
const sun=new T.DirectionalLight(0xffd6a0,2.6)
sun.position.set(28,38,18)
sun.castShadow=!o.lite
sun.shadow.mapSize.set(o.lite?512:2048,o.lite?512:2048)
const sc=sun.shadow.camera
sc.left=-36;sc.right=36;sc.top=36;sc.bottom=-36;sc.near=1;sc.far=160
sc.updateProjectionMatrix()
sun.shadow.bias=-.0004
sun.shadow.normalBias=.04
scene.add(sun,sun.target)
const hemi=new T.HemisphereLight(0xffe4bd,0x5c3b22,1.05)
scene.add(hemi)
const sd=sun.position.clone().normalize()
const skyMat=new T.ShaderMaterial({
side:T.BackSide,depthWrite:false,fog:false,
uniforms:{a:{value:new T.Color(sk[0])},b:{value:new T.Color(sk[1])},c:{value:new T.Color(sk[2])},sd:{value:sd}},
vertexShader:'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
fragmentShader:'uniform vec3 a;uniform vec3 b;uniform vec3 c;uniform vec3 sd;varying vec3 v;void main(){float h=v.y;vec3 col=h>0.?mix(b,a,pow(h,.55)):mix(b,c,pow(-h,.6));float s=max(dot(v,sd),0.);col+=vec3(1.,.78,.45)*(pow(s,48.)*.9+pow(s,6.)*.18);gl_FragColor=vec4(col,1.);\n#include <colorspace_fragment>\n}'
})
const dome=new T.Mesh(new T.SphereGeometry(450,32,16),skyMat)
dome.frustumCulled=false
dome.renderOrder=-10
scene.add(dome)
let W=1,H=1
const resize=()=>{
const s=R.size()
W=s[0];H=s[1]
camera.aspect=W/H
camera.updateProjectionMatrix()
}
resize()
const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null
if(ro)ro.observe(host)
let raf=0,last=0,tt=0,fn=null,run=false,dead=false
const frame=now=>{
if(!run)return
raf=requestAnimationFrame(frame)
const dt=Math.min(.05,last?(now-last)/1000:.016)
last=now
tt+=dt
if(fn)fn(dt,tt)
if(!run)return
dome.position.copy(camera.position)
r.render(scene,camera)
}
const st={
renderer:r,scene,camera,sun,
w:()=>W,h:()=>H,
loop(f){fn=f;if(!run&&!dead){run=true;last=0;raf=requestAnimationFrame(frame)}},
stop(){run=false;cancelAnimationFrame(raf)},
dispose(){
if(dead)return
dead=true
st.stop()
if(ro)ro.disconnect()
disposeObj(scene)
skyMat.dispose()
r.dispose()
if(cv.parentNode)cv.parentNode.removeChild(cv)
}
}
return st
}
const featherTex=()=>tex('feather',128,256,(c,w,h)=>{
c.clearRect(0,0,w,h)
c.save()
c.beginPath()
c.ellipse(w/2,h*.5,w*.47,h*.5,0,0,TAU)
c.clip()
const g=c.createLinearGradient(0,h,0,0)
g.addColorStop(0,'#3d2210')
g.addColorStop(.35,'#7a431c')
g.addColorStop(.62,'#b5702c')
g.addColorStop(.78,'#5a3216')
g.addColorStop(.86,'#d6a459')
g.addColorStop(1,'#f3e3b8')
c.fillStyle=g
c.fillRect(0,0,w,h)
c.strokeStyle='rgba(30,14,6,.35)'
c.lineWidth=1
for(let i=0;i<90;i++){
const y=h*.04+i/90*h*.94
const d=(1-Math.abs(i/90-.5)*1.1)*w*.5
c.beginPath();c.moveTo(w/2,y+8);c.lineTo(w/2-d,y-10);c.moveTo(w/2,y+8);c.lineTo(w/2+d,y-10);c.stroke()
}
c.fillStyle='rgba(255,230,170,.35)'
c.fillRect(w/2-1.5,0,3,h)
c.restore()
})
const bodyTex=()=>tex('tbody',256,256,(c,w,h)=>{
const g=c.createLinearGradient(0,0,0,h)
g.addColorStop(0,'#6b3f1a');g.addColorStop(1,'#4a2a12')
c.fillStyle=g
c.fillRect(0,0,w,h)
const rows=14
for(let y=0;y<rows;y++){
const cy=y*h/rows+h/rows*.5
const n=16
for(let x=0;x<n;x++){
const cx=(x+(y%2?.5:0))*w/n
const t=.5+.5*Math.sin(x*1.7+y*.9)
c.fillStyle='rgb('+Math.round(120+60*t)+','+Math.round(72+40*t)+','+Math.round(30+20*t)+')'
c.beginPath();c.ellipse(cx,cy,w/n*.52,h/rows*.72,0,0,Math.PI);c.fill()
c.strokeStyle='rgba(26,12,4,.65)';c.lineWidth=2
c.beginPath();c.ellipse(cx,cy,w/n*.52,h/rows*.72,0,0,Math.PI);c.stroke()
c.strokeStyle='rgba(240,190,100,.4)';c.lineWidth=1.5
c.beginPath();c.ellipse(cx,cy-1.5,w/n*.4,h/rows*.55,0,.2,Math.PI-.2);c.stroke()
}
}
})
const wingTex=()=>tex('twing',128,128,(c,w,h)=>{
c.fillStyle='#5b3418'
c.fillRect(0,0,w,h)
for(let i=0;i<8;i++){
c.fillStyle=i%2?'#7a4a22':'#a56a30'
c.fillRect(0,i*h/8,w,h/8*.7)
}
c.strokeStyle='rgba(20,10,4,.5)'
for(let i=0;i<40;i++){c.beginPath();c.moveTo(i*w/40,0);c.lineTo(i*w/40+8,h);c.stroke()}
})
export function turkey(o){
o=o||{}
const root=new T.Group()
const body=new T.Group()
body.position.y=1.15
root.add(body)
const bm=mat('#ffffff',{map:bodyTex(),roughness:.7,emissive:'#ff2a10',emissiveIntensity:0})
const torso=mesh(new T.SphereGeometry(1,40,28),bm)
torso.scale.set(.95,.88,1.2)
body.add(torso)
const breast=mesh(new T.SphereGeometry(.7,28,20),mat('#c88a4a',{roughness:.65}),0,-.08,.68)
breast.scale.set(.82,.9,.7)
body.add(breast)
const rump=mesh(new T.SphereGeometry(.7,24,18),mat('#4a2a12'),0,.12,-.85)
rump.scale.set(.9,.8,.9)
body.add(rump)
const neck=new T.Group()
neck.position.set(0,.5,.85)
body.add(neck)
const nl=mesh(new T.CapsuleGeometry(.24,.5,6,18),mat('#6b3f1a'),0,.28,0)
neck.add(nl)
const nu=mesh(new T.CapsuleGeometry(.17,.5,6,18),mat('#8fb6cf',{roughness:.55}),0,.78,.06)
neck.add(nu)
const head=new T.Group()
head.position.set(0,1.15,.1)
neck.add(head)
const skull=mesh(new T.SphereGeometry(.27,24,18),mat('#9cc4dc',{roughness:.5}))
skull.scale.set(.9,1,1.15)
head.add(skull)
for(const sx of[-1,1]){
const cheek=mesh(new T.SphereGeometry(.09,12,10),mat('#e88aa0',{roughness:.5}),sx*.2,-.06,.12)
head.add(cheek)
const eye=mesh(new T.SphereGeometry(.065,14,12),mat('#fffbe8',{roughness:.3}),sx*.2,.07,.14)
head.add(eye)
const pu=mesh(new T.SphereGeometry(.04,12,10),mat('#0a0a0a',{roughness:.2}),sx*.235,.07,.17)
head.add(pu)
}
const beakU=mesh(new T.ConeGeometry(.1,.32,14),mat('#f3b23a',{roughness:.4}),0,-.03,.36)
beakU.rotation.x=Math.PI/2
head.add(beakU)
const beakL=mesh(new T.ConeGeometry(.07,.2,12),mat('#e69a26',{roughness:.4}),0,-.1,.3)
beakL.rotation.x=Math.PI/2
head.add(beakL)
const snood=mesh(new T.CapsuleGeometry(.04,.2,4,10),mat('#d32a2a',{roughness:.4}),0,.04,.4)
snood.rotation.x=Math.PI/2+.5
head.add(snood)
const wattle=mesh(new T.SphereGeometry(.12,16,14),mat('#e02f2f',{roughness:.4}),0,-.3,.16)
wattle.scale.set(.75,2.1,.6)
head.add(wattle)
for(let i=0;i<5;i++){
const b=mesh(new T.SphereGeometry(.035,8,8),mat('#f0a0b0'),(i-2)*.07,.2,-.02)
head.add(b)
}
let hat=null
if(o.pilgrim){
hat=new T.Group()
const bm2=mat('#15110f',{roughness:.6})
hat.add(mesh(lathe([[0,.0],[.3,.0],[.27,.5],[.3,.56],[0,.56]],28),bm2))
hat.add(mesh(lathe([[.28,.0],[.62,-.02],[.64,.04],[.3,.07]],32),bm2))
const band=mesh(lathe([[.3,.06],[.29,.16],[.285,.16],[.295,.06]],28),mat('#3a2a1e'))
hat.add(band)
const buck=mesh(new T.BoxGeometry(.2,.2,.04),mat('#e2b43a',{metalness:.7,roughness:.3}),0,.12,.31)
hat.add(buck)
hat.add(mesh(new T.BoxGeometry(.11,.11,.05),bm2,0,.12,.315))
hat.position.set(0,.2,-.03)
hat.rotation.x=-.12
hat.scale.setScalar(.9)
head.add(hat)
}
const tail=new T.Group()
tail.position.set(0,.3,-1.0)
tail.rotation.x=-.12
body.add(tail)
const fg=new T.PlaneGeometry(.62,1.7,2,6)
const fp=fg.attributes.position
for(let i=0;i<fp.count;i++)fp.setZ(i,-Math.pow(fp.getX(i),2)*.8)
fg.translate(0,.82,0)
fg.computeVertexNormals()
const fm=new T.MeshStandardMaterial({map:featherTex(),alphaTest:.45,side:T.DoubleSide,roughness:.7})
const feathers=[]
const NF=13
for(let i=0;i<NF;i++){
const f=mesh(fg,fm)
f.castShadow=true
f.userData.k=(i-(NF-1)/2)/((NF-1)/2)
f.position.z=-.01*Math.abs(f.userData.k)-(i%2)*.012
f.scale.set(1,1-.12*Math.abs(f.userData.k),1)
tail.add(f)
feathers.push(f)
}
const fm2=new T.MeshStandardMaterial({map:featherTex(),color:'#e8c890',alphaTest:.45,side:T.DoubleSide,roughness:.7})
const cov=[]
for(let i=0;i<7;i++){
const f=mesh(fg,fm2)
f.userData.k=(i-3)/3
f.scale.set(.8,.42,.8)
f.position.z=.03
tail.add(f)
cov.push(f)
}
const wings=[]
for(const sx of[-1,1]){
const w=new T.Group()
w.position.set(sx*.8,.28,.15)
const wmat=mat('#ffffff',{map:wingTex(),roughness:.7})
const wm=mesh(new T.SphereGeometry(1,24,16),wmat,sx*.5,0,-.1)
wm.scale.set(.55,.09,.5)
w.add(wm)
for(let i=0;i<6;i++){
const pf=mesh(fg,fm)
pf.scale.set(.5,.46,.5)
pf.position.set(sx*(.88+i*.02),0,.28-i*.13)
pf.rotation.set(0,0,-sx*(Math.PI/2)+sx*(i-2.5)*.05)
w.add(pf)
}
body.add(w)
wings.push(w)
}
const legs=[]
const lmat=mat('#d98a3d',{roughness:.6})
for(const sx of[-1,1]){
const hip=new T.Group()
hip.position.set(sx*.4,.82,.05)
hip.add(mesh(new T.CylinderGeometry(.11,.09,.42,12),mat('#c97c32'),0,-.21,0))
const knee=new T.Group()
knee.position.y=-.4
hip.add(knee)
const low=mesh(new T.CylinderGeometry(.075,.06,.44,12),lmat,0,-.22,-.02)
low.rotation.x=.12
knee.add(low)
const foot=new T.Group()
foot.position.set(0,-.44,-.05)
knee.add(foot)
for(let t=-1;t<=1;t++){
const toe=mesh(new T.CapsuleGeometry(.05,.3,4,8),lmat,Math.sin(t*.5)*.18,0,Math.cos(t*.5)*.18)
toe.rotation.set(Math.PI/2,0,-t*.5)
foot.add(toe)
const claw=mesh(new T.ConeGeometry(.035,.1,8),mat('#2a1c14'),Math.sin(t*.5)*.36,0,Math.cos(t*.5)*.36+.05)
claw.rotation.x=Math.PI/2
foot.add(claw)
}
const bt=mesh(new T.CapsuleGeometry(.04,.14,4,8),lmat,0,0,-.12)
bt.rotation.x=Math.PI/2
foot.add(bt)
root.add(hip)
legs.push({hip,knee,foot})
}
const sh=new T.Mesh(new T.CircleGeometry(1.4,32),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false}))
sh.rotation.x=-Math.PI/2
sh.position.y=.02
sh.scale.set(.85,1.2,1)
root.add(sh)
root.scale.setScalar(o.scale||1)
const s={by:1.15,pitch:0,roll:0,l0:0,l1:0,k0:0,k1:0,nx:.45,ny:0,wa:-1.25,wb:0,sp:.82,ts:0,fl:0,hy:0,tuck:0}
let t=0,ph=0
const tick=(dt,speed,mode)=>{
speed=speed==null?1:speed
mode=mode||'run'
t+=dt
ph+=dt*(5+Math.max(0,speed)*5)
const k=1-Math.exp(-dt*14)
let by=1.15,pitch=0,roll=0,l0=0,l1=0,k0=0,k1=0,nx=.45,ny=0,wa=-1.25,wb=0,sp=.82,ts=0,fl=0,hy=0,tuck=0
if(mode==='run'){
by=1.15+Math.abs(Math.sin(ph))*.12
pitch=.1
l0=Math.sin(ph)*.95;l1=-Math.sin(ph)*.95
k0=Math.max(0,-Math.cos(ph))*1.1;k1=Math.max(0,Math.cos(ph))*1.1
nx=.5+Math.sin(ph*2)*.09
hy=Math.sin(ph*2)*.07
wa=-1.2+Math.sin(ph*2)*.12
wb=Math.sin(ph)*.05
sp=.86
ts=Math.sin(ph)*.07
roll=Math.sin(ph)*.05
}else if(mode==='idle'){
by=1.15+Math.sin(t*2)*.015
nx=.45+Math.pow(Math.max(0,Math.sin(t*1.7)),8)*.55
ny=Math.sin(t*.8)*.5
sp=.95+Math.sin(t*1.2)*.03
ts=Math.sin(t*.9)*.03
wa=-1.25+Math.sin(t*2)*.02
}else if(mode==='fly'){
const f=Math.sin(ph*1.6)
by=1.15+f*.08
pitch=.25
l0=-.9;l1=-.9;k0=1.4;k1=1.4
nx=.75
wa=.15+f*.95
wb=f*.18
sp=.9
ts=Math.sin(ph)*.05
tuck=1
}else{
by=1.15+Math.sin(t*50)*.02
pitch=-.35
roll=Math.sin(t*38)*.14
l0=Math.sin(t*30)*.8;l1=-Math.sin(t*30)*.8
k0=.7;k1=.7
nx=-.25
ny=Math.sin(t*44)*.25
wa=.8+Math.sin(t*34)*.15
sp=1.18
ts=Math.sin(t*40)*.12
fl=.75
hy=Math.sin(t*50)*.1
}
s.by=lerp(s.by,by,k);s.pitch=lerp(s.pitch,pitch,k);s.roll=lerp(s.roll,roll,mode==='hit'?1:k)
s.l0=lerp(s.l0,l0,k);s.l1=lerp(s.l1,l1,k);s.k0=lerp(s.k0,k0,k);s.k1=lerp(s.k1,k1,k)
s.nx=lerp(s.nx,nx,k);s.ny=lerp(s.ny,ny,mode==='hit'?1:k);s.wa=lerp(s.wa,wa,k);s.wb=lerp(s.wb,wb,k)
s.sp=lerp(s.sp,sp,k);s.ts=lerp(s.ts,ts,mode==='hit'?1:k);s.fl=lerp(s.fl,fl,1-Math.exp(-dt*(fl>s.fl?30:5)));s.hy=lerp(s.hy,hy,k);s.tuck=lerp(s.tuck,tuck,k)
body.position.y=s.by
body.rotation.x=s.pitch
body.rotation.z=s.roll
legs[0].hip.rotation.x=s.l0;legs[1].hip.rotation.x=s.l1
legs[0].knee.rotation.x=s.k0;legs[1].knee.rotation.x=s.k1
legs[0].foot.rotation.x=-s.k0*.6;legs[1].foot.rotation.x=-s.k1*.6
neck.rotation.x=s.nx
neck.rotation.y=s.ny
head.rotation.x=-s.nx*.5+s.hy
wattle.rotation.z=Math.sin(t*9)*.08
wattle.rotation.x=Math.sin(t*7+1)*.08
wings[0].rotation.z=-s.wa
wings[1].rotation.z=s.wa
wings[0].rotation.x=wings[1].rotation.x=s.wb
tail.rotation.y=s.ts
for(const f of feathers){
const a=f.userData.k*1.15*s.sp
f.rotation.z=-a+Math.sin(t*6+f.userData.k*5)*.012*(1+speed*.4)
}
for(const f of cov)f.rotation.z=-f.userData.k*1.0*s.sp*.9
bm.emissiveIntensity=s.fl
if(hat)hat.rotation.z=Math.sin(ph*2)*.02*(mode==='run'?1:0)
}
return{group:root,tick}
}
export function pie(kind){
kind=kind||'pumpkin'
const g=new T.Group()
const tin=mesh(lathe([[0,0],[.9,0],[1.12,.1],[1.3,.5],[1.36,.52],[1.36,.46],[1.2,.04],[0,.0]],40),mat('#b9bcc4',{metalness:.85,roughness:.35}))
g.add(tin)
const crustMat=mat('#d99a45',{roughness:.65})
const fill=lathe([[0,.62],[.3,.6],[.9,.5],[1.18,.44],[1.24,.3],[0,.3]],40)
const fm=kind==='pumpkin'?mat('#d9801f',{roughness:.5}):kind==='apple'?mat('#b86a24',{roughness:.45}):mat('#6a3a16',{roughness:.3,metalness:.05})
g.add(mesh(fill,fm))
const ridges=[]
const RN=30
for(let i=0;i<RN;i++){
const a=i/RN*TAU
const rg=new T.SphereGeometry(.17,12,10)
rg.scale(.55,.9,1.15)
rg.rotateY(a+Math.PI/2)
rg.translate(Math.cos(a)*1.27,.52,Math.sin(a)*1.27)
ridges.push(paint(rg,(x,y)=>new T.Color(i%2?'#e6ab52':'#c98a3a').lerp(new T.Color('#f3c777'),Math.max(0,y-.5)*1.5)))
}
g.add(mesh(merge(ridges),mat('#ffffff',{vertexColors:true,roughness:.65})))
if(kind==='pumpkin'){
const cr=[]
for(let i=0;i<4;i++)cr.push(paint(place(new T.SphereGeometry(.3-i*.055,16,12),{x:.55,y:.72+i*.12,z:.2,sy:.75}),()=>'#fff7ea'))
g.add(mesh(merge(cr),mat('#ffffff',{vertexColors:true,roughness:.5})))
const sp=[]
const sr=rng(5)
for(let i=0;i<60;i++){const q=sr()*1.1,a=sr()*TAU;sp.push(paint(place(new T.SphereGeometry(.018,4,4),{x:Math.cos(a)*q,y:.6-q*.07,z:Math.sin(a)*q}),()=>'#7a3a10'))}
g.add(mesh(merge(sp),mat('#ffffff',{vertexColors:true})))
}else if(kind==='apple'){
const parts=[]
const lw=.1
for(let d=0;d<2;d++){
for(let i=-5;i<=5;i++){
const x=i*.2
const half=Math.sqrt(Math.max(.01,1.22*1.22-x*x))
const b=new T.BoxGeometry(lw,.05,half*2,1,1,1)
const hy=.6-Math.abs(x)*.12-.02+(((i+d)&1)?.03:0)
b.translate(0,hy+.04,0)
if(d)b.rotateY(Math.PI/2)
parts.push(paint(b,(px,py)=>new T.Color('#c98a3a').lerp(new T.Color('#f0b85a'),Math.min(1,Math.max(0,(py-.4)*3)))))
}
}
const lat=mesh(merge(parts),mat('#ffffff',{vertexColors:true,roughness:.6}))
lat.position.y=-.02
g.add(lat)
const cut=mesh(new T.TorusGeometry(1.22,.07,8,48),crustMat,0,.5,0)
cut.rotation.x=Math.PI/2
g.add(cut)
}else{
const nuts=[]
const rings=[[0,1],[.38,6],[.72,11],[1.0,16]]
for(const[rr,n]of rings){
for(let i=0;i<n;i++){
const a=i/n*TAU+rr
const ng=new T.SphereGeometry(.17,12,10)
ng.scale(1,.55,1.5)
ng.rotateY(a+Math.PI/2+.4)
ng.translate(Math.cos(a)*rr,.6-rr*.06,Math.sin(a)*rr)
nuts.push(paint(ng,(x,y,z,nx2,ny2)=>new T.Color(i%3?'#9a5a24':'#7d4418').lerp(new T.Color('#c78a4a'),Math.max(0,ny2)*.6)))
}
}
g.add(mesh(merge(nuts),mat('#ffffff',{vertexColors:true,roughness:.35,metalness:.05})))
}
return g
}
const FRUIT={}
const appleProf=[[0,.0],[.18,.03],[.38,.12],[.5,.3],[.52,.5],[.47,.7],[.34,.86],[.16,.9],[.06,.8],[0,.76]]
FRUIT.apple=()=>{
const g=new T.Group()
const geo=lathe(appleProf,28)
paint(geo,(x,y,z)=>{
const u=Math.atan2(z,x)
const yel=Math.max(0,Math.sin(u*6+y*4))*.35+Math.max(0,.2-Math.abs(y-.1))*2
return new T.Color('#b81c18').lerp(new T.Color('#e24a24'),Math.min(1,y)).lerp(new T.Color('#e8c040'),Math.min(.8,yel))
})
g.add(mesh(geo,mat('#ffffff',{vertexColors:true,roughness:.35})))
const st=mesh(new T.CylinderGeometry(.018,.026,.24,8),mat('#5a3a1a'),0,.9,0)
st.rotation.z=.2
g.add(st)
const lf=mesh(leafGeo(),leafMat('#4a8a2a'),.12,.92,.03)
lf.scale.set(.32,.32,.32)
lf.rotation.set(-1.2,0,-.4)
g.add(lf)
return g
}
FRUIT.pear=()=>{
const g=new T.Group()
const geo=lathe([[0,0],[.15,.02],[.3,.1],[.4,.25],[.38,.42],[.28,.58],[.2,.75],[.15,.92],[.1,1.05],[0,1.1]],28)
paint(geo,(x,y,z)=>new T.Color('#a8b838').lerp(new T.Color('#d8c848'),Math.min(1,y*.8)).lerp(new T.Color('#c27a3a'),Math.max(0,Math.sin(Math.atan2(z,x)*5)*.15)))
g.add(mesh(geo,mat('#ffffff',{vertexColors:true,roughness:.5})))
const st=mesh(new T.CylinderGeometry(.015,.025,.22,8),mat('#5a3a1a'),0,1.15,0)
st.rotation.z=.25
g.add(st)
return g
}
FRUIT.pumpkin=()=>{
const g=new T.Group()
const geo=new T.SphereGeometry(.55,40,28)
const p=geo.attributes.position
for(let i=0;i<p.count;i++){
const x=p.getX(i),y=p.getY(i),z=p.getZ(i)
const u=Math.atan2(z,x)
const f=1+.09*Math.cos(u*10)
p.setXYZ(i,x*f,y*.8,z*f)
}
geo.computeVertexNormals()
paint(geo,(x,y,z)=>new T.Color(Math.cos(Math.atan2(z,x)*10)>0?'#ec7a1a':'#d4640f').lerp(new T.Color('#f29a3a'),Math.max(0,y)*.6))
g.add(mesh(geo,mat('#ffffff',{vertexColors:true,roughness:.5})))
const cv=new T.CatmullRomCurve3([new T.Vector3(0,.4,0),new T.Vector3(.02,.52,0),new T.Vector3(.1,.62,0),new T.Vector3(.18,.62,0)])
g.add(mesh(sweep(cv,10,8,u=>.07*(1-u*.4)),mat('#6a7a2a',{roughness:.8})))
g.position.y=.44
const w=new T.Group()
w.add(g)
return w
}
FRUIT.corn=()=>{
const g=new T.Group()
const geo=lathe([[0,0],[.18,.02],[.24,.2],[.25,.5],[.22,.8],[.14,1.0],[.05,1.08],[0,1.1]],24)
const kt=tex('kern',128,256,(c,w,h)=>{
c.fillStyle='#f0c030'
c.fillRect(0,0,w,h)
for(let y=0;y<32;y++)for(let x=0;x<16;x++){
c.fillStyle=(x+y)%2?'#f6d24a':'#e8b824'
c.beginPath();c.ellipse(x*8+4,y*8+4,3.6,3.6,0,0,TAU);c.fill()
c.fillStyle='rgba(255,255,200,.5)'
c.beginPath();c.arc(x*8+3,y*8+3,1.2,0,TAU);c.fill()
}
})
g.add(mesh(geo,mat('#ffffff',{map:kt,roughness:.35})))
const hm=mat('#7fa83a',{side:T.DoubleSide,roughness:.7})
for(let i=0;i<4;i++){
const h2=mesh(lathe([[.22,.0],[.3,.15],[.34,.4],[.27,.68],[.12,.84],[.02,.86]],12,i*1.6,1.3),hm)
g.add(h2)
}
const sk=mesh(new T.CylinderGeometry(.06,.1,.18,8),mat('#8a6a2a'),0,-.05,0)
g.add(sk)
g.rotation.z=.0
const w=new T.Group()
w.add(g)
g.position.y=.05
return w
}
FRUIT.acorn=()=>{
const g=new T.Group()
const nut=mesh(lathe([[0,0],[.08,.02],[.2,.1],[.26,.25],[.25,.4],[.2,.52]],20),mat('#c78a3a',{roughness:.45}))
g.add(nut)
const ct=tex('acap',64,64,(c,w,h)=>{
c.fillStyle='#6a4426'
c.fillRect(0,0,w,h)
c.strokeStyle='#40260f'
c.lineWidth=1.5
for(let i=-8;i<16;i++){c.beginPath();c.moveTo(i*8,0);c.lineTo(i*8+h,h);c.moveTo(i*8+h,0);c.lineTo(i*8,h);c.stroke()}
},[4,1])
g.add(mesh(lathe([[.0,.44],[.28,.44],[.31,.56],[.27,.7],[.15,.8],[.05,.84],[0,.84]],20),mat('#ffffff',{map:ct,roughness:.8})))
const st=mesh(new T.CylinderGeometry(.02,.03,.14,8),mat('#4a2c10'),0,.9,0)
g.add(st)
return g
}
FRUIT.grapes=()=>{
const g=new T.Group()
const bs=[]
const r=rng(9)
for(let i=0;i<6;i++){
const n=Math.max(1,6-i)
for(let j=0;j<n;j++){
const a=j/n*TAU+i
const rr=(.28-i*.04)*(n>1?1:0)
const b=new T.SphereGeometry(.15,14,12)
b.translate(Math.cos(a)*rr,.8-i*.19,Math.sin(a)*rr)
bs.push(paint(b,(x,y,z,nx,ny)=>new T.Color(r()>.5?'#5a2a82':'#6a3a92').lerp(new T.Color('#b69ad0'),Math.max(0,ny)*.35)))
}
}
g.add(mesh(merge(bs),mat('#ffffff',{vertexColors:true,roughness:.25})))
const st=mesh(new T.CylinderGeometry(.02,.03,.28,8),mat('#5a3a1a'),0,.98,0)
g.add(st)
const lf=mesh(leafGeo(),leafMat('#6a9a2a'),.22,.95,0)
lf.scale.set(.45,.45,.45)
lf.rotation.set(-1.3,0,-.5)
g.add(lf)
return g
}
FRUIT.leaf=()=>{
const g=new T.Group()
const cs=['#c8321e','#e0561e','#f08a24','#f2b631']
const lf=mesh(leafGeo(),leafMat(cs[Math.floor(Math.random()*cs.length)]))
lf.rotation.x=-Math.PI/2
g.add(lf)
return g
}
FRUIT.rotten=()=>{
const g=new T.Group()
const geo=lathe(appleProf,24)
const p=geo.attributes.position
const r=rng(4)
for(let i=0;i<p.count;i++){
const x=p.getX(i),y=p.getY(i),z=p.getZ(i)
const f=1+Math.sin(x*9+y*7)*.05+Math.sin(z*8)*.04
p.setXYZ(i,x*f,y*(.92+Math.sin(x*5)*.03),z*f)
}
geo.computeVertexNormals()
paint(geo,(x,y,z)=>{
const n=Math.sin(x*14)*Math.sin(z*12+y*6)
return new T.Color('#5a4a22').lerp(new T.Color('#3a2a14'),Math.max(0,n)).lerp(new T.Color('#6a7a3a'),Math.max(0,-n)*.6)
})
g.add(mesh(geo,mat('#ffffff',{vertexColors:true,roughness:.9})))
const sp=[]
for(let i=0;i<9;i++){
const a=r()*TAU,y=.2+r()*.55
const rr=.5*(1-Math.pow(Math.abs(y-.45)*1.4,2))+.06
const s=new T.SphereGeometry(.05+r()*.04,8,6)
s.translate(Math.cos(a)*rr,y,Math.sin(a)*rr)
sp.push(paint(s,()=>'#8aa06a'))
}
g.add(mesh(merge(sp),mat('#ffffff',{vertexColors:true,roughness:1})))
const st=mesh(new T.CylinderGeometry(.018,.026,.2,8),mat('#2a1c0a'),0,.88,0)
st.rotation.z=.3
g.add(st)
const flies=[]
for(let i=0;i<2;i++){
const f=new T.Group()
f.add(mesh(new T.SphereGeometry(.04,8,6),mat('#101010')))
const wg=mesh(new T.PlaneGeometry(.1,.05),new T.MeshBasicMaterial({color:0xdfe8f0,transparent:true,opacity:.55,side:T.DoubleSide}),0,.04,0)
wg.rotation.x=-Math.PI/2
f.add(wg)
g.add(f)
flies.push(f)
}
g.userData.tick=t=>{
flies.forEach((f,i)=>{
const a=t*(3+i*1.5)+i*3
f.position.set(Math.cos(a)*.7,.95+Math.sin(t*5+i)*.08,Math.sin(a)*.7)
})
}
return g
}
export function fruit(kind){
const f=FRUIT[kind]||FRUIT.apple
return f()
}
export function cornucopia(){
const g=new T.Group()
const pts=[new T.Vector3(-1.7,1.25,0),new T.Vector3(-1.95,.55,0),new T.Vector3(-1.3,-.1,0),new T.Vector3(0,-.3,0),new T.Vector3(1.1,.1,0)]
const cv=new T.CatmullRomCurve3(pts)
const rf=u=>.12+.66*Math.pow(u,1.5)
const wt=tex('wick',256,256,(c,w,h)=>{
c.fillStyle='#8a5a22'
c.fillRect(0,0,w,h)
const n=8
for(let y=0;y<n*2;y++)for(let x=0;x<n;x++){
const hor=(x+y)%2
const gx=x*w/n,gy=y*h/(n*2)
const gr=c.createLinearGradient(gx,gy,gx,gy+h/(n*2))
gr.addColorStop(0,hor?'#d4a050':'#b88a3a');gr.addColorStop(.5,hor?'#e6b862':'#c89848');gr.addColorStop(1,hor?'#9a6a28':'#7a5220')
c.fillStyle=gr
c.fillRect(gx+1,gy+1,w/n-2,h/(n*2)-2)
}
},[3,3])
const horn=mesh(sweep(cv,48,28,rf),mat('#ffffff',{map:wt,roughness:.75,side:T.DoubleSide}))
g.add(horn)
const end=cv.getPointAt(1),tan=cv.getTangentAt(1).normalize()
const rim=mesh(new T.TorusGeometry(rf(1)*1.02,.07,10,40),mat('#a8742a',{roughness:.7}))
rim.position.copy(end)
rim.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),tan)
g.add(rim)
const dark=new T.Mesh(new T.CircleGeometry(rf(1),32),new T.MeshBasicMaterial({color:0x2a1a0a}))
dark.position.copy(end).addScaledVector(tan,.01)
dark.quaternion.copy(rim.quaternion)
g.add(dark)
const items=[
['pumpkin',1.3,-.05,-.28,.55,0],['apple',1.62,.28,.28,.5,0],['corn',1.5,-.35,.2,.55,1.1],
['grapes',1.15,.5,-.25,.5,0],['pear',1.95,-.2,-.2,.5,.6],['acorn',2.15,.05,.3,.4,0],['apple',1.9,.4,-.05,.42,0]
]
for(const[k,x,y,z,s,rz]of items){
const f=fruit(k)
f.position.set(x,y,z)
f.scale.setScalar(s)
f.rotation.z=rz?-rz:0
f.rotation.y=Math.random()*TAU
g.add(f)
}
for(let i=0;i<4;i++){
const lf=fruit('leaf')
lf.position.set(1.5+i*.2,.45-i*.1,-.1+i*.12)
lf.scale.setScalar(.5)
g.add(lf)
}
return g
}
const treePal={
maple:['#c8321e','#e0561e','#f08a24','#f2b631','#a8281a'],
oak:['#a8541c','#c4742a','#8c4a1e','#6e5a22','#b86a24'],
birch:['#f0c93a','#e8b628','#f5d84e','#d89a22'],
pine:['#24442a','#2f5a30','#3d6a35','#1e3a26']
}
const noise3=(x,y,z,p)=>Math.sin(x*1.7+p)*Math.sin(y*2.1+p*1.3)*Math.sin(z*1.9+p*.7)
export function tree(kind,seed){
kind=treePal[kind]?kind:'maple'
const r=rng(seed==null?1:seed)
const g=new T.Group()
const pal=treePal[kind].map(c=>new T.Color(c))
const fol=[]
const trunk=[]
const barkC=kind==='birch'?'#ece8da':'#5a3a22'
const bark=(u,jit)=>new T.Color(barkC).multiplyScalar(.75+.25*(1-u)+jit)
const branch=(a,b,r0,r1,tw)=>{
const mid=a.clone().lerp(b,.5)
mid.x+=(r()-.5)*tw;mid.z+=(r()-.5)*tw
const cv=new T.CatmullRomCurve3([a,mid,b])
const geo=sweep(cv,10,8,u=>lerp(r0,r1,u),u=>bark(u,(r()-.5)*.08))
if(kind==='birch')paint(geo,(x,y,z)=>Math.sin(y*9+Math.atan2(z,x)*3)>.82?'#2a2a26':bark(0,0))
trunk.push(geo)
}
const blob=(rad,cx,cy,cz,flat)=>{
const geo=new T.IcosahedronGeometry(rad,3)
const p=geo.attributes.position
const ph=r()*10
for(let i=0;i<p.count;i++){
let x=p.getX(i),y=p.getY(i),z=p.getZ(i)
const l=Math.hypot(x,y,z)||1
const d=1+(noise3(x*2.2,y*2.2,z*2.2,ph)*.22+noise3(x*5,y*5,z*5,ph)*.08)
x*=d;y*=d*(flat||1);z*=d
p.setXYZ(i,x,y,z)
}
geo.computeVertexNormals()
const base=pal[Math.floor(r()*pal.length)]
const alt=pal[Math.floor(r()*pal.length)]
paint(geo,(x,y,z,nx,ny)=>{
const m=.5+.5*noise3(x*3,y*3,z*3,ph*2)
const c=base.clone().lerp(alt,m*.8)
const shade=.55+.55*(ny*.5+.5)
return c.multiplyScalar(shade*(.9+r()*.2))
})
geo.translate(cx,cy,cz)
fol.push(geo)
}
if(kind==='pine'){
const h=9
branch(new T.Vector3(0,0,0),new T.Vector3((r()-.5)*.2,h,0),.42,.08,.1)
const tiers=7
for(let i=0;i<tiers;i++){
const u=i/tiers
const rad=lerp(2.5,.7,u)
const geo=new T.ConeGeometry(rad,2.6,14,3,true)
const p=geo.attributes.position
for(let k=0;k<p.count;k++){
const x=p.getX(k),y=p.getY(k),z=p.getZ(k)
const a=Math.atan2(z,x)
const f=1+Math.sin(a*7+i)*.1*(y<0?1:0)
p.setXYZ(k,x*f,y,z*f)
}
geo.computeVertexNormals()
const base=pal[Math.floor(r()*pal.length)]
paint(geo,(x,y,z)=>base.clone().multiplyScalar(.6+.5*(y/2.6+.5)))
geo.translate(0,lerp(2.2,8.2,u),0)
fol.push(geo)
}
}else{
const th=kind==='birch'?5:4
const tr=kind==='birch'?.26:kind==='oak'?.55:.42
branch(new T.Vector3(0,0,0),new T.Vector3((r()-.5)*.5,th,(r()-.5)*.5),tr,tr*.5,.5)
const nb=kind==='oak'?5:4
const crown=kind==='oak'?3.6:kind==='birch'?2.2:3
const topY=th
const bpos=[]
for(let i=0;i<nb;i++){
const a=i/nb*TAU+r()
const rr=crown*.55
const e=new T.Vector3(Math.cos(a)*rr,topY+1+r()*1.4,Math.sin(a)*rr)
branch(new T.Vector3(0,th*.7,0),e,tr*.32,.07,.4)
bpos.push(e)
}
const n=kind==='birch'?9:kind==='oak'?12:11
const br=kind==='birch'?1.15:kind==='oak'?1.9:1.6
for(let i=0;i<n;i++){
const a=r()*TAU
const rr=Math.sqrt(r())*crown
const y=topY+.6+r()*crown*.9
blob(br*(.7+r()*.5),Math.cos(a)*rr,y,Math.sin(a)*rr,.85)
}
blob(br*1.2,0,topY+crown*.9,0,.85)
}
if(trunk.length)g.add(mesh(merge(trunk),mat('#ffffff',{vertexColors:true,roughness:.95})))
if(fol.length){
const fm=mat('#ffffff',{vertexColors:true,roughness:.88,side:kind==='pine'?T.DoubleSide:T.FrontSide})
g.add(mesh(merge(fol),fm))
}
return g
}
export function ground(w,d,seed){
const r=rng(seed==null?3:seed)
const t=canvasTex(1024,1024,(c,W,H)=>{
const gr=c.createLinearGradient(0,0,W,H)
gr.addColorStop(0,'#4d3a22');gr.addColorStop(.5,'#5a4528');gr.addColorStop(1,'#46341f')
c.fillStyle=gr
c.fillRect(0,0,W,H)
const patch=['#6e6a2a','#7c7430','#564e22','#8a7a38','#4e5a24']
for(let i=0;i<500;i++){
c.fillStyle=patch[Math.floor(r()*patch.length)]
c.globalAlpha=.25+r()*.3
c.beginPath();c.ellipse(r()*W,r()*H,10+r()*40,5+r()*20,r()*TAU,0,TAU);c.fill()
}
c.globalAlpha=1
const lc=['#b8301c','#d9501c','#e88a24','#f0b030','#8a3a18','#c4742a','#7a4a1e']
for(let i=0;i<1400;i++){
const x=r()*W,y=r()*H,s=5+r()*9
c.save();c.translate(x,y);c.rotate(r()*TAU)
c.fillStyle=lc[Math.floor(r()*lc.length)]
c.beginPath();c.ellipse(0,0,s,s*.55,0,0,TAU);c.fill()
c.strokeStyle='rgba(40,20,8,.5)';c.lineWidth=1
c.beginPath();c.moveTo(-s,0);c.lineTo(s,0);c.stroke()
c.restore()
}
for(let i=0;i<4000;i++){
c.fillStyle='rgba(20,10,4,'+(.1+r()*.2)+')'
c.fillRect(r()*W,r()*H,1,1+r()*2)
}
})
t.wrapS=t.wrapT=T.RepeatWrapping
t.repeat.set(Math.max(1,w/14),Math.max(1,d/14))
const geo=new T.PlaneGeometry(w,d,Math.min(96,Math.ceil(w/1.5)),Math.min(96,Math.ceil(d/1.5)))
geo.rotateX(-Math.PI/2)
const p=geo.attributes.position
const ph=r()*10
for(let i=0;i<p.count;i++){
const x=p.getX(i),z=p.getZ(i)
p.setY(i,Math.sin(x*.21+ph)*Math.sin(z*.17+ph*1.3)*.22+Math.sin(x*.6+z*.5)*.05)
}
geo.computeVertexNormals()
const m=new T.Mesh(geo,new T.MeshStandardMaterial({map:t,roughness:1}))
m.receiveShadow=true
return m
}
export function leaves(scene,count,area){
const a=typeof area==='number'?{w:area,h:area*.6,d:area}:Array.isArray(area)?{w:area[0],h:area[1],d:area[2]}:Object.assign({w:40,h:20,d:40},area||{})
const m=new T.InstancedMesh(leafGeo(),leafMat('#ffffff',{side:T.DoubleSide}),count)
m.castShadow=false
m.frustumCulled=false
const cs=['#c8321e','#e0561e','#f08a24','#f2b631','#a8541c','#d98a2a']
const rr=rng(77)
const S=[]
for(let i=0;i<count;i++){
S.push({x:(rr()-.5)*a.w,y:rr()*a.h,z:(rr()-.5)*a.d,vy:.6+rr()*.9,ph:rr()*TAU,sw:.6+rr()*1.2,rx:rr()*TAU,ry:rr()*TAU,rz:rr()*TAU,sx:(rr()-.5)*2,sc:.18+rr()*.2})
m.setColorAt(i,new T.Color(cs[Math.floor(rr()*cs.length)]))
}
m.instanceColor.needsUpdate=true
const center=new T.Vector3()
const o=new T.Object3D()
let t=0
scene.add(m)
return{
mesh:m,center,
tick(dt){
t+=dt
for(let i=0;i<count;i++){
const s=S[i]
s.y-=s.vy*dt
s.x+=Math.sin(t*s.sw+s.ph)*.9*dt+s.sx*dt*.4
s.z+=Math.cos(t*s.sw*.8+s.ph)*.7*dt
s.rx+=dt*s.sw*1.4;s.ry+=dt*s.sw;s.rz+=dt*s.sw*.6
if(s.y<0){s.y+=a.h;s.x=(Math.random()-.5)*a.w}
const hw=a.w/2,hd=a.d/2
if(s.x>hw)s.x-=a.w;else if(s.x<-hw)s.x+=a.w
if(s.z>hd)s.z-=a.d;else if(s.z<-hd)s.z+=a.d
o.position.set(center.x+s.x,center.y+s.y,center.z+s.z)
o.rotation.set(s.rx,s.ry,s.rz)
o.scale.setScalar(s.sc)
o.updateMatrix()
m.setMatrixAt(i,o.matrix)
}
m.instanceMatrix.needsUpdate=true
}
}
}
export function burst(scene){
const N=600
const pos=new Float32Array(N*3),colA=new Float32Array(N*3),szA=new Float32Array(N),alA=new Float32Array(N)
const vel=new Float32Array(N*3),life=new Float32Array(N),max=new Float32Array(N),base=new Float32Array(N)
const geo=new T.BufferGeometry()
geo.setAttribute('position',new T.BufferAttribute(pos,3))
geo.setAttribute('color',new T.BufferAttribute(colA,3))
geo.setAttribute('size',new T.BufferAttribute(szA,1))
geo.setAttribute('alpha',new T.BufferAttribute(alA,1))
const sm=new T.ShaderMaterial({
transparent:true,depthWrite:false,blending:T.NormalBlending,
vertexShader:'attribute float size;attribute float alpha;attribute vec3 color;varying float a;varying vec3 c;void main(){a=alpha;c=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*(300./-mv.z);gl_Position=projectionMatrix*mv;}',
fragmentShader:'varying float a;varying vec3 c;void main(){float d=length(gl_PointCoord-.5)*2.;float m=smoothstep(1.,.35,d)*a;gl_FragColor=vec4(c,m);\n#include <colorspace_fragment>\n}'
})
const pts=new T.Points(geo,sm)
pts.frustumCulled=false
scene.add(pts)
let head=0
const tc=new T.Color()
return{
points:pts,
emit(p,n,color,speed){
tc.set(color==null?'#ffd27a':color)
speed=speed||4
for(let k=0;k<(n||12);k++){
const i=head
head=(head+1)%N
pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z
const a=Math.random()*TAU,b=Math.acos(2*Math.random()-1),s=speed*(.4+Math.random()*.8)
vel[i*3]=Math.sin(b)*Math.cos(a)*s
vel[i*3+1]=Math.abs(Math.cos(b))*s*.9+speed*.3
vel[i*3+2]=Math.sin(b)*Math.sin(a)*s
colA[i*3]=Math.min(1,tc.r*(.8+Math.random()*.4));colA[i*3+1]=Math.min(1,tc.g*(.8+Math.random()*.4));colA[i*3+2]=Math.min(1,tc.b*(.8+Math.random()*.4))
max[i]=.5+Math.random()*.7
life[i]=max[i]
base[i]=.18+Math.random()*.3
}
},
tick(dt){
for(let i=0;i<N;i++){
if(life[i]<=0){alA[i]=0;szA[i]=0;continue}
life[i]-=dt
vel[i*3+1]-=9*dt
vel[i*3]*=1-dt*1.2;vel[i*3+2]*=1-dt*1.2
pos[i*3]+=vel[i*3]*dt;pos[i*3+1]+=vel[i*3+1]*dt;pos[i*3+2]+=vel[i*3+2]*dt
const u=Math.max(0,life[i]/max[i])
alA[i]=Math.min(1,u*2)
szA[i]=base[i]*(.4+u*.6)
}
geo.attributes.position.needsUpdate=true
geo.attributes.size.needsUpdate=true
geo.attributes.alpha.needsUpdate=true
geo.attributes.color.needsUpdate=true
}
}
}
export function audio(){
const AC=window.AudioContext||window.webkitAudioContext
let ctx=null
try{ctx=AC?new AC():null}catch{ctx=null}
const a={ctx,muted:false}
const ok=()=>{
if(!ctx||a.muted)return false
if(ctx.state==='suspended')ctx.resume().catch(()=>{})
return true
}
a.tone=(f,d,type,vol)=>{
if(!ok())return
d=d||.15
const t0=ctx.currentTime
const o=ctx.createOscillator(),g=ctx.createGain()
o.type=type||'sine'
o.frequency.setValueAtTime(f,t0)
const v=vol==null?.2:vol
g.gain.setValueAtTime(0,t0)
g.gain.linearRampToValueAtTime(v,t0+.008)
g.gain.exponentialRampToValueAtTime(.0001,t0+d)
o.connect(g).connect(ctx.destination)
o.start(t0)
o.stop(t0+d+.02)
}
a.noise=(d,vol)=>{
if(!ok())return
d=d||.2
const n=Math.max(1,Math.floor(ctx.sampleRate*d))
const b=ctx.createBuffer(1,n,ctx.sampleRate)
const ch=b.getChannelData(0)
for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n)
const s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter()
s.buffer=b
f.type='lowpass'
f.frequency.value=2400
g.gain.value=vol==null?.2:vol
s.connect(f).connect(g).connect(ctx.destination)
s.start()
}
a.chord=(fs,d)=>{
fs.forEach((f,i)=>setTimeout(()=>a.tone(f,d||.4,'triangle',.12),i*35))
}
let mt=null,step=0
const scale=[0,3,5,7,10,12,15,12,10,7,5,3]
a.music=on=>{
if(mt){clearInterval(mt);mt=null}
if(!on)return
step=0
mt=setInterval(()=>{
const n=scale[step%scale.length]
a.tone(220*Math.pow(2,n/12),.3,'triangle',.05)
if(step%4===0)a.tone(110*Math.pow(2,scale[(step>>2)%4]/12),.9,'sine',.07)
step++
},240)
}
a.close=()=>{
a.music(false)
if(ctx){try{ctx.close()}catch{}}
}
return a
}
export function shake(camera){
let tr=0
const off=new T.Vector3()
return{
add(v){tr=Math.min(1,tr+(v||.3))},
tick(dt){
camera.position.sub(off)
camera.rotation.z=0
tr=Math.max(0,tr-dt*1.6)
const m=tr*tr
off.set((Math.random()-.5)*m*.9,(Math.random()-.5)*m*.9,(Math.random()-.5)*m*.5)
camera.position.add(off)
camera.rotation.z=(Math.random()-.5)*m*.08
}
}
}
