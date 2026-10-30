import*as T from'/vendor/three.module.min.js'
import{EffectComposer}from'/vendor/EffectComposer.js'
import{RenderPass}from'/vendor/RenderPass.js'
import{UnrealBloomPass}from'/vendor/UnrealBloomPass.js'
import{OutputPass}from'/vendor/OutputPass.js'
const TAU=Math.PI*2
let GT=null
const glow=()=>{
if(GT)return GT
const c=document.createElement('canvas');c.width=c.height=128
const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64)
r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.22,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)')
g.fillStyle=r;g.fillRect(0,0,128,128)
GT=new T.CanvasTexture(c)
return GT
}
const pts=(n,f,col,size,op)=>{
const a=new Float32Array(n*3)
for(let i=0;i<n;i++){const p=f(i);a[i*3]=p[0];a[i*3+1]=p[1];a[i*3+2]=p[2]}
const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(a,3))
const p=new T.Points(g,new T.PointsMaterial({map:glow(),color:col,size,transparent:true,opacity:op==null?1:op,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true}))
p.userData.bs=size
p.frustumCulled=false
return p
}
const shellF=r=>()=>{const u=Math.random()*2-1,t=Math.random()*TAU,s=Math.sqrt(1-u*u),k=r*(.9+Math.random()*.35);return[k*s*Math.cos(t),k*u,k*s*Math.sin(t)]}
const diskF=(r0,r1,th)=>()=>{const t=Math.random()*TAU,k=r0+(r1-r0)*Math.pow(Math.random(),.7);return[k*Math.cos(t),(Math.random()-.5)*th*(k/r0),k*Math.sin(t)]}
const sprite=(col,s,op)=>{const m=new T.Sprite(new T.SpriteMaterial({map:glow(),color:col,transparent:true,opacity:op==null?1:op,depthWrite:false,blending:T.AdditiveBlending}));m.scale.set(s,s,1);return m}
const RIM=()=>new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{c:{value:new T.Color(.82,.45,1)},p:{value:3}},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 m=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-m.xyz);gl_Position=projectionMatrix*m;}',fragmentShader:'uniform vec3 c;uniform float p;varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),p);gl_FragColor=vec4(c*f*2.4,f);}'})
const ring=(r,w,col)=>new T.Mesh(new T.TorusGeometry(r,w,10,96),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}))
const orb=(col,em,r)=>{
const g=new T.Group()
const core=new T.Mesh(new T.SphereGeometry(r,48,32),new T.MeshStandardMaterial({color:0x110000,emissive:em,emissiveIntensity:1.6,roughness:.25,metalness:.1}))
g.add(core)
g.add(sprite(col,r*5.2,.85))
const sh=pts(700,shellF(r*1.55),col,r*.16,.9);g.add(sh)
const r1=ring(r*1.9,r*.03,col),r2=ring(r*2.3,r*.02,col);r1.rotation.x=1.2;r2.rotation.y=1.1;g.add(r1,r2)
g.userData={sh,r1,r2,core}
return g
}
const purple=r=>{
const g=new T.Group()
g.add(new T.Mesh(new T.SphereGeometry(r,64,48),new T.MeshBasicMaterial({color:0x040008})))
g.add(new T.Mesh(new T.SphereGeometry(r*1.045,64,48),RIM()))
g.add(sprite(0xb060ff,r*9,.7))
const disk=new T.Group()
const d1=pts(4200,diskF(r*1.5,r*3.6,r*.1),0xd49aff,r*.1,.9),d2=pts(2400,diskF(r*1.3,r*2.4,r*.06),0xffffff,r*.07,.8)
disk.add(d1,d2);disk.rotation.x=.42;disk.rotation.z=.18
g.add(disk)
const jets=pts(1200,()=>{const s=Math.random()<.5?1:-1,y=r*(1.1+Math.pow(Math.random(),1.6)*6.5),k=r*.22*(1-y/(r*8));return[(Math.random()-.5)*k*2,s*y,(Math.random()-.5)*k*2]},0xb070ff,r*.09,.7)
g.add(jets)
g.userData={disk,d1,d2,jets}
return g
}
export function hp3d(box,done,o){
let R
try{R=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{done&&done();return{stop(){}}}
const W=box.clientWidth||960,H=box.clientHeight||540
R.setPixelRatio(Math.min(1.5,devicePixelRatio||1));R.setSize(W,H);R.setClearColor(0x020006,1)
const cv=R.domElement;cv.className='cs-3d';cv.style.opacity='0';box.append(cv)
const sc=new T.Scene(),cam=new T.PerspectiveCamera(52,W/H,.1,300)
sc.add(new T.AmbientLight(0x404060,1.2))
const L1=new T.PointLight(0xffffff,40,40);L1.position.set(0,3,6);sc.add(L1)
const comp=new EffectComposer(R);comp.addPass(new RenderPass(sc,cam))
const bl=new UnrealBloomPass(new T.Vector2(W,H),1.25,.75,.02);comp.addPass(bl);comp.addPass(new OutputPass())
const red=orb(0xff3a2a,0xff2010,.8),blue=orb(0x3a7bff,0x1a50ff,.8)
sc.add(red,blue)
const pu=purple(1);pu.visible=false;sc.add(pu)
const SN=520,sp=new Float32Array(SN*6),sv=[]
for(let i=0;i<SN;i++){const a=Math.random()*TAU,d=4+Math.random()*26,z=-120+Math.random()*130;sp[i*6]=Math.cos(a)*d;sp[i*6+1]=Math.sin(a)*d;sp[i*6+2]=z;sp[i*6+3]=sp[i*6];sp[i*6+4]=sp[i*6+1];sp[i*6+5]=z-1;sv.push(.6+Math.random()*1.4)}
const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3))
const stars=new T.LineSegments(sg,new T.LineBasicMaterial({color:0x7a5aff,transparent:true,opacity:.55,blending:T.AdditiveBlending}))
sc.add(stars)
const waves=[]
const flash=sprite(0xffffff,30,0);flash.position.set(0,0,0);sc.add(flash)
const boom=()=>{for(let i=0;i<3;i++){const w=ring(1,.05+i*.03,i===0?0xffffff:0xc58aff);w.userData.t=-i*.09;w.rotation.x=1.2+i*.3;waves.push(w);sc.add(w)}}
const T0=performance.now()
const now=()=>o&&o.t?o.t():(performance.now()-T0)/1000
let raf=0,dead=false,bo=0,lt=0
const end=()=>{
if(dead)return
dead=true;cancelAnimationFrame(raf)
try{comp.dispose&&comp.dispose();R.dispose();sc.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material)m.material.dispose&&m.material.dispose()})}catch{}
cv.remove()
done&&done()
}
const ss=x=>x<=0?0:x>=1?1:x*x*(3-2*x)
const frame=()=>{
if(dead)return
raf=requestAnimationFrame(frame)
const t=now(),dt=Math.max(0,Math.min(.1,t-lt));lt=t
if(t>7.8)return end()
const fi=Math.min(1,t/.6),fo=t>7?Math.max(0,(7.8-t)/.8):1
cv.style.opacity=String(Math.min(fi,fo))
const e=ss(t/2.7)
const sh=t>2.4&&t<3.15?(Math.random()-.5)*.12:0
if(t<3.05){
red.visible=blue.visible=true;pu.visible=false
const sx=3.9-e*3.35,wy=Math.sin(t*3)*.35*(1-e)
red.position.set(-sx,wy,Math.sin(t*2)*.8);blue.position.set(sx,-wy,-Math.sin(t*2)*.8)
const spin=t*2.6,pl=1+Math.sin(t*14)*.05
for(const[g,s]of[[red,1],[blue,-1]]){g.userData.sh.rotation.y=spin*s;g.userData.sh.rotation.x=t*.9*s;g.userData.r1.rotation.z=t*3*s;g.userData.r2.rotation.x=t*2.4*s;g.scale.setScalar(pl*(1+e*.35))}
cam.position.set(Math.sin(t*.5)*1.6+sh,.5+Math.cos(t*.6)*.3+sh,9.5-e*2.2);cam.lookAt(0,0,0)
flash.material.opacity=e>.9?(e-.9)*5:0
}else{
const u=t-3.05
if(!bo){bo=1;red.visible=blue.visible=false;pu.visible=true;boom();flash.material.opacity=1}
flash.material.opacity=Math.max(0,1-u/.5)
const gr=1-Math.pow(1-Math.min(1,u/1),3),r=.25+gr*1.25
pu.scale.setScalar(r)
const ud=pu.userData
ud.disk.rotation.y=u*2.2;ud.d2.rotation.y=-u*1.1;ud.jets.rotation.y=u*.8
pu.rotation.y=u*.3
const fire=u>3.2?Math.min(1,(u-3.2)/1.35):0
cam.position.set(Math.sin(u*.45)*2.4,1.1+Math.sin(u*.35)*.5,8.2-gr*1.2-fire*fire*7.4)
cam.lookAt(0,0,0)
cv.style.filter=fire>0?'brightness('+(1+fire*fire*7)+')':''
if(fire>.7)cv.style.opacity=String(Math.max(0,1-(fire-.7)/.3)*fo)
}
for(let i=waves.length-1;i>=0;i--){const w=waves[i];w.userData.t+=dt;const k=w.userData.t;if(k<0){w.visible=false;continue}w.visible=true;w.scale.setScalar(.5+k*14);w.material.opacity=Math.max(0,.9-k*1.5);if(k>.8){sc.remove(w);waves.splice(i,1)}}
const p=sg.attributes.position.array
for(let i=0;i<SN;i++){const v=sv[i]*(t<3.05?.4:2.8+Math.max(0,t-6)*6);p[i*6+2]+=v*dt*20;p[i*6+5]=p[i*6+2]-(t<3.05?1:3+v);if(p[i*6+2]>12){const z=-130;p[i*6+2]=z;p[i*6+5]=z-1}}
sg.attributes.position.needsUpdate=true
comp.render()
}
raf=requestAnimationFrame(frame)
return{stop:end}
}
export function hpLive(box){
let R
try{R=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{return null}
R.setClearColor(0x000000,0)
const cv=R.domElement
cv.className='tu-hp3d'
box.append(cv)
const sc=new T.Scene(),cam=new T.PerspectiveCamera(40,1,10,4000)
sc.add(new T.AmbientLight(0x555577,1.4))
const dl=new T.DirectionalLight(0xffffff,2.2);dl.position.set(-200,300,500);sc.add(dl)
const items=new Map(),booms=[]
let W=0,H=0,F=0
const fit=()=>{const w=box.clientWidth||800,h=box.clientHeight||500;if(w===W&&h===H)return;W=w;H=h;R.setPixelRatio(Math.min(1.5,devicePixelRatio||1));R.setSize(W,H);cam.aspect=W/H;F=H/2/Math.tan(cam.fov*Math.PI/360);cam.position.set(0,0,F);cam.lookAt(0,0,0);cam.updateProjectionMatrix()}
const P=(x,y,z)=>[x-W/2,H/2-y,z||0]
const mkCast=()=>{
const g=new T.Group()
const a=orb(0xff3a2a,0xff2010,1),b=orb(0x3a7bff,0x1a50ff,1),p=purple(1)
p.visible=false
g.add(a,b,p)
sc.add(g)
return{g,a,b,p,tr:pts(80,()=>[0,0,0],0xc58aff,14,.8),bt:0}
}
const frame=(list,clock)=>{
fit()
let any=booms.length>0
const seen=new Set()
for(const c of list){
any=true;seen.add(c)
let it=items.get(c)
if(!it){it=mkCast();sc.add(it.tr);items.set(c,it)}
const fz=sz=>{it.g.traverse(m=>{if(m.isPoints&&m.userData.bs&&m!==it.tr)m.material.size=m.userData.bs*sz})}
const k=Math.min(1.2,c.t/c.d),ch=.38
const R0=17,s0=P(c.sx0,c.sy0,0)
if(k<ch){
const cc=k/ch,rad=70*(1-cc*cc)+6,an=c.t*13,z=Math.sin(c.t*9)*30
it.a.visible=it.b.visible=true;it.p.visible=false
it.a.position.set(s0[0]+Math.cos(an)*rad,s0[1]+Math.sin(an)*rad*.7,z)
it.b.position.set(s0[0]-Math.cos(an)*rad,s0[1]-Math.sin(an)*rad*.7,-z)
const sz=R0*(.35+cc*.85);it.a.scale.setScalar(sz);it.b.scale.setScalar(sz);fz(sz)
for(const g of[it.a,it.b]){g.userData.sh.rotation.y=c.t*6;g.userData.r1.rotation.z=c.t*8;g.userData.r2.rotation.x=c.t*7}
it.p.visible=false
}else{
it.a.visible=it.b.visible=false;it.p.visible=true
const kk=Math.min(1,(k-ch)/(1-ch)),x=c.sx0+(c.sx1-c.sx0)*kk,y=c.sy0+(c.sy1-c.sy0)*kk-Math.sin(kk*Math.PI)*c.arc
const q=P(x,y,0)
it.p.position.set(q[0],q[1],0)
const sz=R0*(.9+Math.min(1,(k-ch)*4)*.6)
it.p.scale.setScalar(sz);fz(sz)
it.p.userData.disk.rotation.y=c.t*7;it.p.userData.d2.rotation.y=-c.t*4;it.p.userData.jets.rotation.y=c.t*3
it.p.rotation.y=c.t*2
if(c.t>c.d&&!c.bz){c.bz=1;const w=P(c.sx1,c.sy1,0);for(let i=0;i<3;i++){const m=ring(1,.07+i*.04,i===0?0xffffff:0xc58aff);m.position.set(w[0],w[1],0);m.userData.t=-i*.08;m.rotation.x=1.15;booms.push(m);sc.add(m)}}
if(c.t>c.d)it.p.visible=false
}
const tp=it.tr.geometry.attributes.position.array
if(it.p.visible){for(let i=tp.length/3-1;i>0;i--){tp[i*3]=tp[(i-1)*3];tp[i*3+1]=tp[(i-1)*3+1];tp[i*3+2]=tp[(i-1)*3+2]}tp[0]=it.p.position.x+(Math.random()-.5)*14;tp[1]=it.p.position.y+(Math.random()-.5)*14;tp[2]=(Math.random()-.5)*14}else for(let i=0;i<tp.length;i++)tp[i]=0
it.tr.geometry.attributes.position.needsUpdate=true
}
for(const[c,it]of items)if(!seen.has(c)){sc.remove(it.g);sc.remove(it.tr);items.delete(c)}
for(let i=booms.length-1;i>=0;i--){const m=booms[i];m.userData.t+=1/60;const k=m.userData.t;if(k<0){m.visible=false;continue}m.visible=true;m.scale.setScalar(20+k*520);m.material.opacity=Math.max(0,.9-k*1.6);if(k>.6){sc.remove(m);booms.splice(i,1)}}
cv.style.display=any?'block':'none'
if(any)R.render(sc,cam)
}
return{frame,dispose(){try{R.dispose()}catch{}cv.remove()}}
}
