import{THREE,stage,turkey,pie,fruit,tree,ground,leaves,burst,mat,rng,disposeObj}from'./tk3d.js'
const TAU=Math.PI*2
const B=1800
const S=.05
const OFF=Math.PI/2
const CH=40
const CZ=28
const rnd=(a,b)=>a+Math.random()*(b-a)
const clamp=(v,a,b)=>v<a?a:v>b?b:v
const cc=c=>typeof c==='number'?c:parseInt(c.length===4?c.slice(1).split('').map(x=>x+x).join(''):c.slice(1),16)
const el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
const ITEMS={
volley:{n:'Feather Volley',w:1,d:'Quills fly at the nearest foes'},
nova:{n:'Cinnamon Nova',w:1,d:'A spicy shockwave bursts outward'},
corn:{n:'Corn Cannon',w:1,d:'Piercing kernels blast through packs'},
pie:{n:'Pie Boomerang',w:1,d:'A flaky pie arcs out and returns'},
acorns:{n:'Acorn Orbit',w:1,d:'Acorns circle you and smack foes'},
gravy:{n:'Gravy Trail',w:1,d:'Sticky gravy slows and burns foes'},
heart:{n:'Drumstick',d:'+25 max HP and a bite to heal'},
sage:{n:'Sage Stuffing',d:'+10% move speed'},
cran:{n:'Cranberry Sauce',d:'+12% damage'},
spice:{n:'Pumpkin Spice',d:'8% faster weapons'},
leaf:{n:'Magnet Leaf',d:'+35% pickup range'},
plume:{n:'Thick Plumage',d:'10% less contact damage'},
moon:{n:'Harvest Moon',d:'+10% weapon area'},
heal:{n:'Roast Dinner',d:'Restore 40% of your health'}
}
const LEAF=['#d9641c','#c23a1b','#e8a21f','#a8481a','#8f2d14','#f0c23a']
const BASE={fox:{r:13,hp:14,sp:100,d:7,xp:1,m:1},crow:{r:11,hp:9,sp:125,d:5,xp:1,m:.7},boar:{r:20,hp:55,sp:62,d:13,xp:3,m:2.5},stag:{r:48,hp:1800,sp:70,d:22,xp:60,m:22}}
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_eu=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3(),_c=new THREE.Color()
function merge(list){
const P=[],N=[],C=[]
for(const[geo,col,px,py,pz,sx,sy,sz,rx,ry,rz]of list){
const g=geo.index?geo.toNonIndexed():geo.clone()
_eu.set(rx||0,ry||0,rz||0);_q.setFromEuler(_eu);_p.set(px,py,pz);_s.set(sx,sy,sz);_m4.compose(_p,_q,_s)
g.applyMatrix4(_m4)
const pa=g.attributes.position.array,na=g.attributes.normal.array
_c.set(col)
for(let i=0;i<pa.length;i++){P.push(pa[i]);N.push(na[i])}
for(let i=0;i<pa.length/3;i++)C.push(_c.r,_c.g,_c.b)
g.dispose()
}
const o=new THREE.BufferGeometry()
o.setAttribute('position',new THREE.Float32BufferAttribute(P,3))
o.setAttribute('normal',new THREE.Float32BufferAttribute(N,3))
o.setAttribute('color',new THREE.Float32BufferAttribute(C,3))
return o
}
function ell(g,x,y,rx,ry,rot,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,TAU);g.fill()}
function icoDraw(g,id){
const e=(...a)=>ell(g,...a)
if(id==='volley'){for(let i=-1;i<=1;i++){g.save();g.rotate(i*.45-.6);e(2,0,15,3.5,0,i?'#e8a21f':'#c23a1b');g.restore()}}
else if(id==='nova'){g.strokeStyle='#e07a3a';g.lineWidth=4;g.beginPath();g.arc(0,0,14,0,TAU);g.stroke();g.strokeStyle='#f0c23a';g.lineWidth=2;g.beginPath();g.arc(0,0,7,0,TAU);g.stroke()}
else if(id==='corn'){e(0,0,8,15,.5,'#f5c831');e(-6,4,6,12,.5,'#6a9a2a');e(-2,-5,2,4,.5,'#fff3a0')}
else if(id==='pie'){e(0,0,15,15,0,'#c98a3a');e(0,0,11,11,0,'#e8742a');g.strokeStyle='#f0d27a';g.lineWidth=2;g.beginPath();g.moveTo(-10,0);g.lineTo(10,0);g.moveTo(0,-10);g.lineTo(0,10);g.stroke()}
else if(id==='acorns'){e(0,2,8,10,0,'#b8782a');e(0,-6,10,6,0,'#5a3418');g.fillStyle='#5a3418';g.fillRect(-1,-14,2,5)}
else if(id==='gravy'){e(0,3,16,10,0,'#7a4a1c');e(-3,0,8,5,0,'#a8702c');e(6,-4,3,2,0,'#d8a050')}
else if(id==='heart'){e(-3,2,11,9,-.6,'#b8602a');e(5,-8,3,3,0,'#f0e0c0');e(9,-5,3,3,0,'#f0e0c0')}
else if(id==='sage'){e(0,0,8,15,.6,'#7a9a4a');g.strokeStyle='#4a6a2a';g.lineWidth=1.5;g.beginPath();g.moveTo(-8,9);g.lineTo(8,-9);g.stroke()}
else if(id==='cran'){e(-6,3,8,8,0,'#c4203a');e(6,5,7,7,0,'#d6334a');e(0,-6,6,6,0,'#a41a30')}
else if(id==='spice'){e(0,2,12,11,0,'#d9751c');e(0,2,4,11,0,'#b8601a');g.fillStyle='#4a6a1c';g.fillRect(-1,-10,3,6)}
else if(id==='leaf'){e(0,0,8,15,-.5,'#e8a21f');g.strokeStyle='#8f2d14';g.lineWidth=2;g.beginPath();g.arc(0,2,13,Math.PI*.1,Math.PI*.9);g.stroke()}
else if(id==='plume'){e(0,0,7,16,.3,'#4a8ac9');e(0,0,3,15,.3,'#9ad0f0')}
else if(id==='moon'){e(0,0,14,14,0,'#f0e0a0');e(6,-3,12,12,0,'#2a1a0c')}
else{e(0,6,16,5,0,'#d8d0c0');e(0,0,11,8,0,'#a8501a');e(-3,-3,5,3,0,'#e08a3a')}
}
function icon(id,big){
const sz=big?72:34
const c=document.createElement('canvas')
c.width=c.height=sz*2
c.className=big?'tk3-ic big':'tk3-ic'
const g=c.getContext('2d')
g.translate(sz,sz);const k=sz*2/40*.85;g.scale(k,k)
icoDraw(g,id)
return c
}
export default function launch(host,api){
const red=api.reduced(),lite=api.lite()
if(!document.getElementById('tk3css')){const l=document.createElement('link');l.id='tk3css';l.rel='stylesheet';l.href='/tk3d3.css';document.head.append(l)}
const root=el('div','tk3'),cvh=el('div','tk3-cv'),ui=el('div','tk3-ui')
root.append(cvh,ui);host.append(root)
const sg=stage(cvh,{lite,exp:1.05,fog:{color:0x3b2412,near:52,far:125}})
const scene=sg.scene,cam=sg.camera
scene.background=new THREE.Color(0x3b2412)
scene.fog=new THREE.Fog(0x3b2412,52,125)
cam.fov=42;cam.near=.5;cam.far=260;cam.updateProjectionMatrix()
const sun=sg.sun
if(sun){
sun.castShadow=!lite
sun.color.set(0xffd9a0)
if(sun.shadow){const sc=sun.shadow.camera;sc.left=-46;sc.right=46;sc.top=46;sc.bottom=-46;sc.near=1;sc.far=180;sc.updateProjectionMatrix()}
}
const MV=mat(0xffffff,{vertexColors:true,roughness:.82,metalness:.02})
const MW=mat(0xffffff,{emissive:0xffffff,emissiveIntensity:.9,roughness:.6})
const MR=mat(0xff3a2a,{emissive:0xff2010,emissiveIntensity:.85,roughness:.6})
const SP=new THREE.SphereGeometry(1,12,9),CY=new THREE.CylinderGeometry(1,1,1,9),CO=new THREE.ConeGeometry(1,1,9),BX=new THREE.BoxGeometry(1,1,1)
const pair=(list,hipX,col,rad,len)=>merge(list.map(([x,z])=>[CY,col,x,-len/2,z,rad,len,rad]))
const MODELS={}
MODELS.fox={
body:merge([[SP,0xe8742a,0,1,0,1.15,.55,.5],[SP,0xf5ece0,.55,.8,0,.62,.34,.4],[SP,0xe8742a,1.2,1.2,0,.52,.44,.4],[SP,0xf5ece0,1.62,1.08,0,.42,.2,.2],[SP,0x111111,2.02,1.1,0,.08,.08,.08],[SP,0x111111,1.5,1.3,.22,.07,.07,.07],[SP,0x111111,1.5,1.3,-.22,.07,.07,.07],[CO,0xc4501a,1.05,1.75,.26,.14,.4,.12,0,0,-.2],[CO,0xc4501a,1.05,1.75,-.26,.14,.4,.12,0,0,-.2],[SP,0xd9641c,-1.4,1.15,0,.85,.28,.28,0,0,.5],[SP,0xf5ece0,-2,1.5,0,.3,.22,.22]]),
la:pair([[.65,.28],[-.65,-.28]],0,0x3a2210,.11,.72),
lb:pair([[.65,-.28],[-.65,.28]],0,0x3a2210,.11,.72),
hip:.72
}
MODELS.crow={
body:merge([[SP,0x1d1a26,0,0,0,.75,.45,.4],[SP,0x1d1a26,.85,.25,0,.38,.35,.32],[CO,0xe0a028,1.4,.22,0,.18,.45,.16,0,0,-Math.PI/2],[SP,0xffd23a,1.1,.4,.22,.06,.06,.06],[SP,0xffd23a,1.1,.4,-.22,.06,.06,.06],[BX,0x2a2636,-.95,0,0,.5,.06,.35,0,0,.15]]),
wl:merge([[SP,0x2a2636,0,0,.95,.4,.05,.95],[SP,0x3a3648,-.2,.02,1.55,.25,.04,.5]]),
wr:merge([[SP,0x2a2636,0,0,-.95,.4,.05,.95],[SP,0x3a3648,-.2,.02,-1.55,.25,.04,.5]]),
hip:0
}
MODELS.boar={
body:merge([[SP,0x5a3a28,0,1,0,1.25,.8,.72],[SP,0x3a2418,-.1,1.55,0,.95,.3,.5],[SP,0x6a4632,1.3,.95,0,.62,.55,.5],[SP,0xc98a8a,1.8,.85,0,.3,.26,.3],[SP,0x111111,1.5,1.18,.3,.07,.07,.07],[SP,0x111111,1.5,1.18,-.3,.07,.07,.07],[CO,0xf0e8d0,1.7,.62,.24,.07,.42,.07,.5,0,.2],[CO,0xf0e8d0,1.7,.62,-.24,.07,.42,.07,-.5,0,.2],[CO,0x3a2418,1.1,1.5,.3,.15,.35,.12],[CO,0x3a2418,1.1,1.5,-.3,.15,.35,.12],[SP,0x3a2418,-1.3,1.2,0,.18,.18,.18]]),
la:pair([[.7,.34],[-.7,-.34]],0,0x3a2418,.15,.62),
lb:pair([[.7,-.34],[-.7,.34]],0,0x3a2418,.15,.62),
hip:.62
}
const antlers=[]
for(const s of[-1,1]){
antlers.push([CY,0xd8c9a0,1.5,3.75,s*.3,.07,1.3,.07,s*.35,0,-.3])
for(let i=0;i<3;i++)antlers.push([CY,0xd8c9a0,1.35-i*.2,3.6+i*.4,s*(.5+i*.2),.05,.6,.05,s*.9,0,.4])
}
MODELS.stag={
body:merge([[SP,0x6a4026,0,2,0,1.3,.8,.65],[SP,0xf0e0c0,.7,1.75,0,.7,.4,.5],[SP,0x7a4c2e,1.15,2.5,0,.45,.75,.4,0,0,-.5],[SP,0x7a4c2e,1.7,3,0,.55,.4,.35],[SP,0x8a5c3e,2.05,2.9,0,.35,.22,.22],[SP,0x111111,2.38,2.92,0,.08,.08,.08],[SP,0xffd23a,1.8,3.14,.28,.08,.08,.08],[SP,0xffd23a,1.8,3.14,-.28,.08,.08,.08],[CO,0x5a3418,1.5,3.4,.3,.12,.4,.1],[CO,0x5a3418,1.5,3.4,-.3,.12,.4,.1],[SP,0xf0e0c0,-1.35,2.1,0,.2,.2,.2],...antlers]),
la:pair([[.75,.3],[-.75,-.3]],0,0x4a2c18,.14,1.5),
lb:pair([[.75,-.3],[-.75,.3]],0,0x4a2c18,.14,1.5),
hip:1.5
}
const GEO_FEATHER=merge([[CY,0xf0d27a,0,0,0,.04,1.3,.04,0,0,Math.PI/2],[SP,0xc23a1b,-.25,0,0,.6,.05,.22],[SP,0xe8a21f,.2,0,0,.5,.05,.2]])
const GEO_ACORN=merge([[SP,0xffffff,0,0,0,1,1.15,1],[SP,0x666666,0,.75,0,1.08,.55,1.08],[CY,0x444444,0,1.35,0,.12,.4,.12]])
const GEO_ROCK=new THREE.IcosahedronGeometry(1,0)
const GEO_STUMP=merge([[CY,0x5a3a1c,0,.4,0,1,.8,1],[CY,0xa07a45,0,.81,0,.88,.04,.88],[CY,0x4a2e14,0,.1,0,1.2,.2,1.2]])
const GEO_PILE=new THREE.SphereGeometry(1,10,6)
const GEO_RING=new THREE.RingGeometry(.92,1,56).rotateX(-Math.PI/2)
const GEO_RING2=new THREE.RingGeometry(1.5,1.7,40).rotateX(-Math.PI/2)
const GEO_DISC=new THREE.CircleGeometry(1,24).rotateX(-Math.PI/2)
const GEO_PLANE=new THREE.PlaneGeometry(1,1)
const MA=mat(0xffffff,{roughness:1,flatShading:true})
const MP=mat(0xffffff,{roughness:1})
const MROCK=mat(0x7b7468,{roughness:.95,flatShading:true})
const MNOVA=new THREE.MeshBasicMaterial({color:0xe07a3a,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})
const MGRAVY=new THREE.MeshStandardMaterial({color:0x7a4a1c,roughness:.4,transparent:true,opacity:.85,depthWrite:false})
const MGOLD=new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide})
const MTEL=new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide})
const MSHARD=new THREE.MeshStandardMaterial({color:0xe8c8a0,emissive:0xb8302a,emissiveIntensity:.7,roughness:.5})
const BARB=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.6,depthTest:false})
const BARF=new THREE.MeshBasicMaterial({color:0xffd23a,depthTest:false})
const tplCorn=fruit('corn'),tplApple=fruit('apple'),tplAcorn=fruit('acorn'),tplPie=pie('pumpkin')
const gr=ground(210,210,5)
gr.traverse(o=>{if(o.isMesh)o.receiveShadow=true})
scene.add(gr)
const dark=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x1d1108}))
dark.position.y=-.05
scene.add(dark)
const rg=rng(77)
const kinds=['maple','oak','birch','pine','maple','maple']
const TN=lite?42:92
for(let i=0;i<TN;i++){
const a=(rg()*2-1)*112,b=(rg()<.5?-1:1)*(94+rg()*16)
const t=tree(kinds[(rg()*kinds.length)|0],(rg()*1e5)|0)
if(i%2)t.position.set(a,0,b);else t.position.set(b,0,a)
t.rotation.y=rg()*TAU
t.scale.multiplyScalar(1.4+rg()*1.1)
t.traverse(o=>{if(o.isMesh){o.castShadow=!lite;o.receiveShadow=true}})
scene.add(t)
}
function inst(geo,m,n,fn){
const im=new THREE.InstancedMesh(geo,m,n)
const d=new THREE.Object3D()
for(let i=0;i<n;i++){fn(d,i,im);d.updateMatrix();im.setMatrixAt(i,d.matrix)}
im.instanceMatrix.needsUpdate=true
if(im.instanceColor)im.instanceColor.needsUpdate=true
im.receiveShadow=true
im.frustumCulled=false
scene.add(im)
return im
}
const dr=rng(311)
const AR=B*S-4
inst(GEO_ROCK,MROCK,lite?16:26,(d,i)=>{const s=.4+dr()*.9;d.position.set((dr()*2-1)*AR,s*.3,(dr()*2-1)*AR);d.rotation.set(dr()*3,dr()*3,dr()*3);d.scale.set(s*1.3,s*.7,s)})
inst(GEO_STUMP,MV,lite?8:16,(d,i,im)=>{const s=.7+dr()*.6;d.position.set((dr()*2-1)*AR,0,(dr()*2-1)*AR);d.rotation.set(0,dr()*TAU,0);d.scale.set(s,s,s);im.setColorAt(i,_c.set(0xffffff))})
const pileCols=[0xd9641c,0xc23a1b,0xe8a21f,0xa8481a,0x8f2d14,0xf0c23a]
inst(GEO_PILE,MP,lite?24:46,(d,i,im)=>{const s=1.1+dr()*1.6;d.position.set((dr()*2-1)*AR,.05,(dr()*2-1)*AR);d.rotation.set(0,dr()*TAU,0);d.scale.set(s,.14+dr()*.1,s*(.7+dr()*.5));im.setColorAt(i,_c.set(pileCols[(dr()*pileCols.length)|0]))})
const tplPump=fruit('pumpkin')
for(let i=0;i<(lite?10:22);i++){
const o=tplPump.clone()
const s=.6+dr()*.6
o.scale.multiplyScalar(s)
o.position.set((dr()*2-1)*AR,0,(dr()*2-1)*AR)
o.rotation.y=dr()*TAU
o.traverse(m=>{if(m.isMesh){m.castShadow=!lite;m.receiveShadow=true}})
scene.add(o)
}
const fx=burst(scene)
const lvs=red?null:leaves(scene,lite?40:120,60)
const pivot=new THREE.Group()
const tk=turkey({pilgrim:true,scale:1})
tk.group.traverse(o=>{if(o.isMesh)o.castShadow=!lite})
pivot.add(tk.group)
scene.add(pivot)
const GM=420
const gi=new THREE.InstancedMesh(GEO_ACORN,MV,GM)
gi.count=0;gi.frustumCulled=false;gi.castShadow=false
scene.add(gi)
const _o=new THREE.Object3D(),_v=new THREE.Vector3()
let W=0,H=0,vhp=782,vwp=1300
let errs=0
const dnL=el('div','tk3-dnl'),dnP=[]
for(let i=0;i<40;i++){const d=el('div','tk3-dn');dnL.append(d);dnP.push(d)}
const xpB=el('div','tk3-xp'),xpF=el('div','tk3-xpf')
xpB.append(xpF)
const hpB=el('div','tk3-hp'),hpF=el('div','tk3-hpf'),hpT=el('span','tk3-hpt')
hpB.append(hpF,hpT)
const lvT=el('div','tk3-lv'),kT=el('div','tk3-k')
const stat=el('div','tk3-stat');stat.append(hpB,lvT,kT)
const tmT=el('div','tk3-tm'),wvT=el('div','tk3-wv')
const mid=el('div','tk3-mid');mid.append(tmT,wvT)
const bossB=el('div','tk3-boss'),bossF=el('div','tk3-bossf'),bossT=el('div','tk3-bosst','Great Stag')
bossB.append(bossF);mid.append(bossB,bossT)
const itemsE=el('div','tk3-items')
const pb=el('button','tk3-btn tk3-pause','Pause');pb.type='button'
const bn=el('div','tk3-bn'),bnT=el('b'),bnS=el('span')
bn.append(bnT,bnS)
const hurtE=el('div','tk3-hurt'),lowE=el('div','tk3-low'),vigE=el('div','tk3-vig')
const joyE=el('div','tk3-joy'),joyK=el('i');joyE.append(joyK)
ui.append(vigE,hurtE,lowE,dnL,xpB,stat,mid,itemsE,pb,bn,joyE)
let ac=null,nb=null,mgain=null,mute=false
function initAudio(){
if(ac){if(ac.state==='suspended')ac.resume();return}
try{
ac=new(window.AudioContext||window.webkitAudioContext)()
nb=ac.createBuffer(1,ac.sampleRate*.3,ac.sampleRate)
const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1
mgain=ac.createGain();mgain.gain.value=1;mgain.connect(ac.destination)
}catch{ac=null}
}
const lastS={}
function ok(n,gap){const now=performance.now();if(lastS[n]&&now-lastS[n]<gap)return false;lastS[n]=now;return ac&&!mute}
function tone(n,f,d,ty,v,sl,gap=45){
if(!ok(n,gap))return
const t0=ac.currentTime,o=ac.createOscillator(),gn=ac.createGain()
o.type=ty;o.frequency.setValueAtTime(f,t0);o.frequency.exponentialRampToValueAtTime(Math.max(25,f*sl),t0+d)
gn.gain.setValueAtTime(v,t0);gn.gain.exponentialRampToValueAtTime(.001,t0+d)
o.connect(gn);gn.connect(mgain);o.start(t0);o.stop(t0+d+.02)
}
function noise(n,d,v,f,gap=45){
if(!ok(n,gap))return
const t0=ac.currentTime,s=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain()
s.buffer=nb;fl.type='bandpass';fl.frequency.value=f
gn.gain.setValueAtTime(v,t0);gn.gain.exponentialRampToValueAtTime(.001,t0+d)
s.connect(fl);fl.connect(gn);gn.connect(mgain);s.start(t0);s.stop(t0+d)
}
const sfx={
shoot:()=>tone('shoot',620,.07,'square',.025,.45,60),
hit:()=>noise('hit',.06,.05,900,40),
kill:()=>tone('kill',320,.12,'triangle',.06,.4,50),
gem:()=>tone('gem',760,.07,'sine',.04,1.6,35),
nova:()=>tone('nova',180,.35,'sine',.12,4,200),
corn:()=>noise('corn',.12,.09,300,150),
pie:()=>tone('pie',300,.18,'triangle',.05,1.8,200),
hurt:()=>{tone('hurt',170,.25,'sawtooth',.1,.3,120);noise('hurt2',.15,.1,200,120)},
level:()=>{for(let i=0;i<4;i++)setTimeout(()=>tone('lv'+i,440*Math.pow(1.26,i),.18,'triangle',.08,1,0),i*90)},
pick:()=>tone('pick',520,.15,'square',.05,2,0),
roar:()=>{tone('roar',95,.7,'sawtooth',.14,.4,0);noise('roar2',.6,.08,160,0)},
over:()=>tone('over',300,.8,'sawtooth',.1,.2,0),
wave:()=>tone('wave',260,.4,'triangle',.07,1.5,0)
}
const scl=[220,261.6,293.7,329.6,392,440,523.3]
let noteT=0,barN=0
function music(dt){
if(!ac||mute)return
noteT-=dt
if(noteT>0)return
noteT=.5;barN++
tone('mn',scl[(Math.random()*scl.length)|0]*(Math.random()<.3?2:1),.9,'triangle',.022,.98,0)
if(barN%4===0)tone('mb',scl[[0,2,3,1][(barN/4|0)%4]]/2,1.8,'sine',.05,.98,0)
}
const kd=new Set()
const joy={on:false,id:-1,ox:0,oy:0,x:0,y:0}
let st='play',t=0,time=0,kills=0,lvl=1,xp=0,pend=0,bossN=0,bossK=0,nextBoss=180,nextElite=60,wave=1,spawnAcc=0,shk=0,hurtF=0,banner=null,opts=[],res=null,best=0,saved=false,idc=0,orb=0,cx=0,cz=0,ov=null,parsEl=null,itemKey='',lastHp=-1,lastXp=-1,lastK=-1,lastT=-1,lastW=-1,lastLv=-1,lastBoss=-1
let p,en,pj,ep,gems,dn,pools,rings,q,lv,cdt,orbM=[]
try{best=+localStorage.getItem('tk_forage_best')||0}catch{}
function clearOv(){if(ov){ov.remove();ov=null;parsEl=null}}
function clearWorld(){
if(en)for(const e of en){scene.remove(e.o);if(e.bar)scene.remove(e.bar)}
if(pj)for(const j of pj)scene.remove(j.o)
if(ep)for(const o of ep)scene.remove(o.o)
if(rings)for(const r of rings){scene.remove(r.o);r.o.material.dispose()}
if(pools)for(const o of pools)scene.remove(o.o)
if(gems)for(const o of gems)if(o.m)scene.remove(o.m)
for(const o of orbM)scene.remove(o)
orbM=[]
}
function setBanner(s,s2,m){
banner={t:m,m}
bnT.textContent=s;bnS.textContent=s2||''
bn.style.setProperty('--d',m+'s')
bn.className='tk3-bn'
void bn.offsetWidth
bn.className='tk3-bn on'
}
function init(){
clearWorld();clearOv()
p={x:0,y:0,hp:100,max:100,r:14,inv:0,hd:Math.PI/2,vh:Math.PI/2,dmg:1,cd:1,area:1,spdm:1,mag:70,arm:0,mv:false}
en=[];pj=[];ep=[];gems=[];dn=[];pools=[];rings=[];q=[]
lv={volley:1};cdt={};orb=0;itemKey='';lastHp=-1
st='play';t=0;time=0;kills=0;lvl=1;xp=0;pend=0;bossN=0;bossK=0;nextBoss=180;nextElite=60;wave=1;spawnAcc=0;shk=0;hurtF=0;res=null;saved=false;cx=0;cz=0
setBanner('Hold the clearing','Move with WASD, arrows or touch',4)
pivot.visible=true
}
function need(){return 4+Math.floor(lvl*lvl*1.5+lvl*5)}
function lvOf(k){return lv[k]||0}
function recalc(){
p.dmg=1+.12*lvOf('cran');p.cd=Math.pow(.92,lvOf('spice'));p.area=1+.1*lvOf('moon');p.spdm=1+.1*lvOf('sage');p.mag=70*(1+.35*lvOf('leaf'));p.arm=lvOf('plume');p.max=100+25*lvOf('heart')
}
function scoreNow(){return kills*12+Math.floor(t)*4+(lvl-1)*80+bossK*1500}
function shake(n){if(!red)shk=Math.min(14,shk+n)}
function pf(x,y,n,c,sp,h){
n=red||lite?n>>1:n
if(n<1)return
const cs=Array.isArray(c)?c:[c],per=Math.max(1,Math.ceil(n/cs.length))
for(const col of cs)fx.emit(new THREE.Vector3(x*S,h==null?1:h,y*S),per,cc(col),sp*S)
}
function num(x,y,v,c,s,h){if(dn.length<40)dn.push({x:x+rnd(-8,8),y,v:Math.round(v),c,s,l:.7,h:h||1.5})}
function near(n,md){const a=[],m2=md*md;for(const e of en){const dx=e.x-p.x,dy=e.y-p.y,d=dx*dx+dy*dy;if(d<m2)a.push([d,e])}a.sort((u,v)=>u[0]-v[0]);return a.slice(0,n).map(u=>u[1])}
function mk(k,x,y,el0){
const b=BASE[k],s=k==='stag'?(1+bossN*.9):1+t/90
const e={k,x,y,r:b.r,hp:b.hp*s,mx:0,sp:b.sp,d:b.d*(1+t/600),xp:b.xp,m:b.m,kx:0,ky:0,fl:0,sl:0,ph:rnd(0,TAU),el:!!el0,oc:0,cs:rnd(1,3),tel:0,chg:0,cx:0,cy:0,sh:5,hd:0,vh:0,ap:rnd(0,TAU),vm:0,i:idc++,dead:false}
if(el0){e.hp*=7;e.r*=1.45;e.d*=1.4;e.xp*=8;e.m*=1.5;e.sp*=.95}
e.mx=e.hp
const M=MODELS[k],g=new THREE.Group()
const bm=new THREE.Mesh(M.body,MV);bm.castShadow=!lite;g.add(bm)
e.parts=[bm]
if(k==='crow'){e.wl=new THREE.Mesh(M.wl,MV);e.wr=new THREE.Mesh(M.wr,MV);g.add(e.wl,e.wr);e.parts.push(e.wl,e.wr)}
else{e.la=new THREE.Mesh(M.la,MV);e.lb=new THREE.Mesh(M.lb,MV);e.la.position.y=M.hip;e.lb.position.y=M.hip;e.la.castShadow=e.lb.castShadow=!lite;g.add(e.la,e.lb);e.parts.push(e.la,e.lb)}
e.bm=bm
g.scale.setScalar(e.r*S)
e.o=g
if(el0||k==='stag'||k==='boar'){
const rm=new THREE.Mesh(GEO_RING2,el0?MGOLD:MTEL)
rm.position.y=.05;rm.visible=!!el0
g.add(rm);e.ring=rm
}
if(el0){
const bg=new THREE.Group()
const bk=new THREE.Mesh(GEO_PLANE,BARB),fg=new THREE.Mesh(GEO_PLANE,BARF)
bk.scale.set(2.6,.24,1);fg.scale.set(2.6,.24,1);fg.position.z=.01;bk.renderOrder=10;fg.renderOrder=11
bg.add(bk,fg);bg.visible=false
e.bar=bg;e.barF=fg
scene.add(bg)
}
scene.add(g)
en.push(e);return e
}
function spawnPos(){
let a=rnd(0,TAU);const d=Math.hypot(vwp,vhp)/2*1.05+70
let x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d
if(Math.abs(x)>B-30||Math.abs(y)>B-30){a+=Math.PI;x=p.x+Math.cos(a)*d;y=p.y+Math.sin(a)*d}
return[clamp(x,-B+30,B-30),clamp(y,-B+30,B-30)]
}
function pickK(){
const r=Math.random()
if(t>90&&r<Math.min(.3,(t-90)/600))return'boar'
if(t>40&&r<.45)return'crow'
return'fox'
}
function drop(x,y,v){
const n=Math.min(10,Math.ceil(v/6))
for(let i=0;i<n;i++){
if(gems.length>380){addXp(v/n);continue}
gems.push({x:x+rnd(-14,14),y:y+rnd(-14,14),v:v/n,mg:false,sp:0,ph:rnd(0,TAU)})
}
}
function addXp(v){
xp+=v
while(xp>=need()){xp-=need();lvl++;pend++}
if(pend>0&&st==='play')openLevel()
}
function offer(){
const wc=Object.keys(lv).filter(k=>ITEMS[k].w).length
const pool=Object.keys(ITEMS).filter(k=>k!=='heal'&&lvOf(k)<5&&!(ITEMS[k].w&&!lvOf(k)&&wc>=4))
for(let i=pool.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[pool[i],pool[j]]=[pool[j],pool[i]]}
const o=pool.slice(0,3)
while(o.length<3)o.push('heal')
return o
}
function showLevel(){
clearOv()
const o=el('div','tk3-ov'),row=el('div','tk3-cards')
o.append(el('h2','tk3-ot','Level '+lvl+'!'),el('p','tk3-os','Choose a harvest upgrade'),row)
opts.forEach((k,i)=>{
const b=el('button','tk3-card '+(ITEMS[k].w?'w':k==='heal'?'h':'u'));b.type='button'
const L=lvOf(k)
b.append(icon(k,true),el('b','',ITEMS[k].n),el('i','',k==='heal'?'Instant':L?'Lv '+L+' to '+(L+1):ITEMS[k].w?'New weapon':'New boost'),el('span','',ITEMS[k].d),el('em','',String(i+1)))
b.addEventListener('click',()=>choose(i))
row.append(b)
})
ui.append(o);ov=o
}
function openLevel(){st='level';opts=offer();sfx.level();showLevel()}
function choose(i){
const k=opts[i];if(!k||st!=='level')return
if(k==='heal')p.hp=Math.min(p.max,p.hp+p.max*.4)
else{lv[k]=lvOf(k)+1;recalc();if(k==='heart')p.hp=Math.min(p.max,p.hp+25)}
sfx.pick();pend--
if(pend>0)openLevel();else{st='play';clearOv()}
}
function showPause(){
clearOv()
const o=el('div','tk3-ov'),c=el('div','tk3-pn')
const r=el('button','tk3-btn pri','Resume'),m=el('button','tk3-btn',mute?'Sound off':'Sound on'),x=el('button','tk3-btn','Quit')
r.type=m.type=x.type='button'
r.addEventListener('click',unpause)
m.addEventListener('click',()=>{mute=!mute;m.textContent=mute?'Sound off':'Sound on'})
x.addEventListener('click',()=>api.close())
c.append(r,m,x)
o.append(el('h2','tk3-ot','Paused'),c)
ui.append(o);ov=o
}
function pauseGame(){if(st==='play'){st='pause';showPause()}}
function unpause(){if(st==='pause'){st='play';clearOv()}}
function showOver(){
clearOv()
const sc=scoreNow(),m=Math.floor(t/60),s=Math.floor(t%60)
const o=el('div','tk3-ov'),tb=el('div','tk3-rows')
const rows=[['Time',m+':'+(s<10?'0':'')+s],['Foes defeated',String(kills)],['Level reached',String(lvl)],['Great Stags felled',String(bossK)],['Score',String(sc)],['Best',String(Math.max(best,sc))]]
for(const r of rows){const d=el('div','tk3-row');d.append(el('span','',r[0]),el('b','',r[1]));tb.append(d)}
parsEl=el('p','tk3-pars','Saving your score')
const a=el('button','tk3-btn pri','Play again'),b=el('button','tk3-btn','Exit')
a.type=b.type='button'
a.addEventListener('click',()=>init())
b.addEventListener('click',()=>api.close())
const bx=el('div','tk3-pn');bx.append(a,b)
o.append(el('h2','tk3-ot','The thicket is quiet'),tb,parsEl,bx)
ui.append(o);ov=o
if(res)setPars()
}
function setPars(){
if(!parsEl)return
parsEl.textContent=res&&res.pars>0?'+'+res.pars+' Pars earned':'No Pars this run'
if(res&&res.pars>0)parsEl.className='tk3-pars ok'
}
function hitE(e,d,ox,oy,kb,col){
if(e.dead)return
const crit=Math.random()<.1
d*=crit?2:1
e.hp-=d;e.fl=.08
const a=Math.atan2(e.y-oy,e.x-ox),k=kb/e.m
e.kx+=Math.cos(a)*k;e.ky+=Math.sin(a)*k
num(e.x,e.y,d,crit?'#ffd23a':col||'#fff',crit?17:13,e.r*S*2.4)
pf(e.x,e.y,2,e.k==='crow'?'#222222':'#e8a05a',90,e.r*S)
sfx.hit()
if(e.hp<=0)kill(e)
}
function kill(e){
e.dead=true;kills++
pf(e.x,e.y,e.k==='stag'?60:e.el?24:8,[...LEAF,'#ffffff'],e.k==='stag'?320:180,e.r*S)
sfx.kill()
drop(e.x,e.y,e.xp)
if(e.el||Math.random()<.015)gems.push({x:e.x,y:e.y,v:0,h:true,mg:false,sp:0,ph:0})
if(e.k==='stag'){bossK++;shake(10);setBanner('The Great Stag has fallen','+1500 score',4);for(let i=0;i<3;i++)gems.push({x:e.x+rnd(-40,40),y:e.y+rnd(-40,40),v:0,h:true,mg:false,sp:0,ph:0})}
else if(e.el)shake(4)
}
function hurtP(d){
if(p.inv>0||st!=='play')return
d=Math.max(1,d*(1-.1*p.arm))
p.hp-=d;p.inv=.55;hurtF=.4;shake(6);sfx.hurt()
num(p.x,p.y,d,'#ff6a5a',16,2.6)
pf(p.x,p.y,10,['#d6332b','#7a4a26'],200,1)
}
function aim(e,sp){const a=Math.atan2(e.y-p.y,e.x-p.x);return[Math.cos(a)*sp,Math.sin(a)*sp,a]}
function addPj(j){
let o
if(j.k==='f'){o=new THREE.Mesh(GEO_FEATHER,MV);o.castShadow=!lite}
else if(j.k==='c'){o=new THREE.Group();const c=tplCorn.clone();c.rotation.z=-Math.PI/2;c.scale.multiplyScalar(j.r*S);o.add(c)}
else{o=new THREE.Group();const c=tplPie.clone();c.scale.multiplyScalar(j.r*S/1.2);o.add(c)}
j.o=o;scene.add(o);pj.push(j)
}
const WF={
volley(L){
const tg=near(L+1,640);if(!tg.length)return 0
for(let i=0;i<L+1;i++){const e=tg[i%tg.length];q.push({t:i*.06,f:()=>{const[vx,vy,a]=aim(e,520),j=rnd(-.06,.06),c=Math.cos(a+j),s=Math.sin(a+j);addPj({k:'f',x:p.x,y:p.y,vx:c*520,vy:s*520,r:6,d:(9+3*L)*p.dmg,l:1,pi:1+(L>=3?1:0)+(L>=5?1:0),hit:new Set(),a:a+j});sfx.shoot()}})}
return(1.15-.07*L)*p.cd
},
nova(L){
const mkR=(mx,d)=>{const m=MNOVA.clone();const o=new THREE.Mesh(GEO_RING,m);o.position.set(p.x*S,.2,p.y*S);scene.add(o);rings.push({r:0,max:mx,d,hit:new Set(),t:0,o})}
mkR((110+25*L)*p.area,(14+6*L)*p.dmg)
if(L>=4)q.push({t:.3,f:()=>mkR((110+25*L)*p.area*.8,(14+6*L)*p.dmg*.8)})
sfx.nova();shake(2)
return(3.4-.3*L)*p.cd
},
corn(L){
const tg=near(L>=5?3:L>=3?2:1,700);if(!tg.length)return 0
tg.forEach(e=>{const[vx,vy,a]=aim(e,270);addPj({k:'c',x:p.x,y:p.y,vx,vy,r:12+L*2,d:(18+7*L)*p.dmg,l:1.7,pi:99,hit:new Set(),a})})
sfx.corn()
return(2.6-.2*L)*p.cd
},
pie(L){
const tg=near(1,700);const a0=tg.length?Math.atan2(tg[0].y-p.y,tg[0].x-p.x):rnd(0,TAU)
const n=L>=5?3:L>=3?2:1
for(let i=0;i<n;i++){const a=a0+i*TAU/n;addPj({k:'p',x:p.x,y:p.y,vx:Math.cos(a)*340,vy:Math.sin(a)*340,r:16*p.area,d:(16+5*L)*p.dmg,dist:0,max:(250+30*L)*p.area,back:false,hit:new Set(),a:0})}
sfx.pie()
return(2.9-.2*L)*p.cd
}
}
function spawnWave(dt){
const rate=Math.min(12,1.4+t*.035)
spawnAcc+=rate*dt
const cap=lite?150:240
while(spawnAcc>=1&&en.length<cap){
const[x,y]=spawnPos(),k=pickK()
const n=k==='fox'?1+(t>60?(Math.random()*4)|0:0):1
for(let i=0;i<n;i++)mk(k,x+rnd(-30,30),y+rnd(-30,30),false)
spawnAcc-=n
}
if(spawnAcc>6)spawnAcc=6
}
function update(dt){
t+=dt;time+=dt
const w=Math.floor(t/30)+1
if(w!==wave){wave=w;setBanner('Wave '+w,'',2.2);sfx.wave()}
if(t>=nextElite&&t<nextBoss-5){nextElite+=60;if(!(Math.abs(t-nextBoss)<10)){const[x,y]=spawnPos();mk('boar',x,y,true);setBanner('An elite approaches','',2.5);sfx.wave()}}
if(t>=nextBoss){nextBoss+=300;const[x,y]=spawnPos();mk('stag',x,y,false);bossN++;setBanner('The Great Stag awakens','',3.5);sfx.roar();shake(8)}
let ix=0,iy=0
if(kd.has('a')||kd.has('arrowleft'))ix--
if(kd.has('d')||kd.has('arrowright'))ix++
if(kd.has('w')||kd.has('arrowup'))iy--
if(kd.has('s')||kd.has('arrowdown'))iy++
if(joy.on){ix=joy.x;iy=joy.y}
const il=Math.hypot(ix,iy)
if(il>1){ix/=il;iy/=il}
const sp=150*p.spdm
p.mv=il>.05
p.x=clamp(p.x+ix*sp*dt,-B+20,B-20);p.y=clamp(p.y+iy*sp*dt,-B+20,B-20)
if(p.mv)p.hd=Math.atan2(iy,ix)
p.inv=Math.max(0,p.inv-dt);hurtF=Math.max(0,hurtF-dt)
for(const id of Object.keys(WF)){
if(!lv[id])continue
cdt[id]=(cdt[id]??.3)-dt
if(cdt[id]<=0)cdt[id]=WF[id](lv[id])||.2
}
for(let i=q.length-1;i>=0;i--){q[i].t-=dt;if(q[i].t<=0){q[i].f();q.splice(i,1)}}
if(lv.acorns){
orb+=dt*3.2
const L=lv.acorns,n=L+1,R=(80+8*L)*p.area
for(let i=0;i<n;i++){
const a=orb+i*TAU/n,ax=p.x+Math.cos(a)*R,ay=p.y+Math.sin(a)*R
for(const e of en)if(!e.dead&&e.oc<=time&&Math.hypot(e.x-ax,e.y-ay)<11+e.r){e.oc=time+.45;hitE(e,(7+3*L)*p.dmg,p.x,p.y,160,'#e0c07a')}
}
}
if(lv.gravy){
const L=lv.gravy
cdt.gp=(cdt.gp??0)-dt
if(cdt.gp<=0&&pools.length<30){cdt.gp=.45;const o=new THREE.Mesh(GEO_DISC,MGRAVY);o.position.set(p.x*S,.04,p.y*S);scene.add(o);pools.push({x:p.x,y:p.y,l:3+L*.5,m:3+L*.5,r:(30+5*L)*p.area,tk:0,o})}
for(const o of pools){
o.l-=dt;o.tk-=dt
const tick=o.tk<=0;if(tick)o.tk=.3
for(const e of en){if(e.dead||Math.hypot(e.x-o.x,e.y-o.y)>o.r+e.r)continue;e.sl=.25;if(tick)hitE(e,(6+3*L)*.3*p.dmg*3,o.x,o.y,0,'#c98a3a')}
}
for(const o of pools)if(o.l<=0)scene.remove(o.o)
pools=pools.filter(o=>o.l>0)
}
spawnWave(dt)
const grid=new Map()
for(const e of en){
if(e.dead)continue
e.fl=Math.max(0,e.fl-dt);e.sl=Math.max(0,e.sl-dt)
const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d
const s=e.sp*(e.sl>0?.55:1)
let mx=nx*s,my=ny*s
if(e.k==='crow'){const wv=Math.sin(time*3+e.ph)*.9;mx=(nx*Math.cos(wv)-ny*Math.sin(wv))*s;my=(nx*Math.sin(wv)+ny*Math.cos(wv))*s}
if(e.k==='boar'||e.k==='stag'){
const st2=e.k==='stag'
e.cs-=dt
if(e.tel>0){e.tel-=dt;mx=my=0;if(e.tel<=0){e.chg=st2?.9:.7;e.cx=nx;e.cy=ny}}
else if(e.chg>0){e.chg-=dt;const cs=st2?400:300;mx=e.cx*cs;my=e.cy*cs}
else if(e.cs<=0&&d<(st2?520:300)){e.tel=st2?.8:.55;e.cs=st2?4.5:3}
if(st2){
e.sh-=dt
if(e.sh<=0){
e.sh=6
const n=Math.min(24,12+bossN*4)
for(let i=0;i<n;i++){const a=i*TAU/n+e.ph;const o=new THREE.Mesh(SP,MSHARD);o.scale.setScalar(.36);scene.add(o);ep.push({x:e.x,y:e.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,r:7,d:10,l:4,o})}
shake(4);sfx.roar()
}
}
}
e.x+=(mx+e.kx)*dt;e.y+=(my+e.ky)*dt
const kf=Math.max(0,1-dt*9);e.kx*=kf;e.ky*=kf
if(Math.abs(mx)+Math.abs(my)>5)e.hd=Math.atan2(my,mx)
if(e.tel>0)e.hd=Math.atan2(dy,dx)
if(d>1300&&e.k!=='stag'){const[x,y]=spawnPos();e.x=x;e.y=y}
const gk=((e.x/40)|0)*4096+((e.y/40)|0)
let c=grid.get(gk);if(!c){c=[];grid.set(gk,c)};c.push(e)
if(d<e.r+p.r)hurtP(e.d)
}
for(const e of en){
if(e.dead||e.k==='stag')continue
const cx0=(e.x/40)|0,cy0=(e.y/40)|0
for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
const c=grid.get((cx0+a)*4096+cy0+b);if(!c)continue
for(const o of c){
if(o.i<=e.i||o.dead)continue
const dx=o.x-e.x,dy=o.y-e.y,d=Math.hypot(dx,dy)||.01,m=e.r+o.r
if(d<m*.85){const f=(m*.85-d)*.5/d;if(o.k!=='stag'){o.x+=dx*f;o.y+=dy*f}e.x-=dx*f;e.y-=dy*f}
}
}
}
for(const j of pj){
if(j.k==='p'){
j.a+=dt*14
if(!j.back){j.x+=j.vx*dt;j.y+=j.vy*dt;j.dist+=340*dt;if(j.dist>=j.max){j.back=true;j.hit.clear()}}
else{const dx=p.x-j.x,dy=p.y-j.y,d=Math.hypot(dx,dy)||1;j.x+=dx/d*400*dt;j.y+=dy/d*400*dt;if(d<24)j.dead=true}
}else{j.x+=j.vx*dt;j.y+=j.vy*dt;j.l-=dt;if(j.l<=0)j.dead=true;if(j.k==='c'&&Math.random()<.6)pf(j.x,j.y,1,'#f5c831',30,1)}
if(j.dead)continue
for(const e of en){
if(e.dead||j.hit.has(e))continue
if(Math.hypot(e.x-j.x,e.y-j.y)<j.r+e.r){
j.hit.add(e);hitE(e,j.d,j.x-j.vx*.01,j.y-j.vy*.01,j.k==='c'?280:j.k==='p'?200:150,j.k==='c'?'#f5c831':null)
if(j.k==='f'){j.pi--;if(j.pi<0){j.dead=true;break}}
}
}
}
for(const j of pj)if(j.dead)scene.remove(j.o)
pj=pj.filter(j=>!j.dead)
for(const o of ep){
o.x+=o.vx*dt;o.y+=o.vy*dt;o.l-=dt
if(Math.hypot(o.x-p.x,o.y-p.y)<o.r+p.r-2){hurtP(o.d);o.l=0}
}
for(const o of ep)if(o.l<=0)scene.remove(o.o)
ep=ep.filter(o=>o.l>0)
for(const r of rings){
r.t+=dt
const k=clamp(r.t/.45,0,1)
r.r=r.max*(1-(1-k)*(1-k))
for(const e of en)if(!e.dead&&!r.hit.has(e)&&Math.hypot(e.x-p.x,e.y-p.y)<r.r+e.r){r.hit.add(e);hitE(e,r.d,p.x,p.y,320,'#e07a3a')}
if(r.t>=.45)r.dead=true
}
for(const r of rings)if(r.dead){scene.remove(r.o);r.o.material.dispose()}
rings=rings.filter(r=>!r.dead)
for(const e of en)if(e.dead){scene.remove(e.o);if(e.bar)scene.remove(e.bar)}
en=en.filter(e=>!e.dead)
for(const o of gems){
o.ph+=dt*4
const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy)||1
if(!o.mg&&d<p.mag)o.mg=true
if(o.mg){o.sp=Math.min(900,o.sp+1600*dt);o.x+=dx/d*o.sp*dt;o.y+=dy/d*o.sp*dt}
if(d<18){
o.dead=true
if(o.h){p.hp=Math.min(p.max,p.hp+p.max*.25);num(p.x,p.y,p.max*.25,'#7be07a',15,2.8);sfx.pick();if(o.m)scene.remove(o.m)}
else{addXp(o.v);sfx.gem()}
}
}
gems=gems.filter(o=>!o.dead)
for(const d of dn){d.l-=dt;d.h+=1.6*dt}
dn=dn.filter(d=>d.l>0)
if(banner){banner.t-=dt;if(banner.t<=0){banner=null;bn.className='tk3-bn'}}
shk=Math.max(0,shk-dt*28)
music(dt)
if(p.hp<=0)die()
}
function fxOnly(dt){
for(const d of dn){d.l-=dt;d.h+=1.6*dt}
dn=dn.filter(d=>d.l>0)
shk=Math.max(0,shk-dt*28)
}
function die(){
if(st==='over')return
st='over';sfx.over();shake(10)
pf(p.x,p.y,40,['#7a4a26','#c4621a','#e0a028'],260,1)
const sc=scoreNow()
try{if(sc>best){best=sc;localStorage.setItem('tk_forage_best',String(sc))}}catch{}
if(!saved){saved=true;api.finish(sc,t).then(d=>{res=d||{pars:0};setPars()})}
showOver()
}
function setMats(e,m){
const mm=m===1?MW:m===2?MR:MV
for(const o of e.parts)o.material=mm
e.vm=m
}
function syncEnemies(dt){
for(const e of en){
const o=e.o
const dx=e.x*S-cx,dz=e.y*S-cz
o.position.x=e.x*S;o.position.z=e.y*S
if(dx*dx+dz*dz>3600){o.visible=false;if(e.bar)e.bar.visible=false;continue}
o.visible=true
let da=e.hd-e.vh;da=Math.atan2(Math.sin(da),Math.cos(da));e.vh+=da*Math.min(1,dt*10)
o.rotation.y=-e.vh
const sc=e.r*S,hit=e.fl>0
o.scale.set(sc*(hit?1.1:1),sc*(hit?.9:1),sc*(hit?1.1:1))
const want=hit?1:(e.tel>0&&((time*14)|0)%2)?2:0
if(want!==e.vm)setMats(e,want)
e.ap+=dt*(6+e.sp*.05)*(e.chg>0?1.6:1)
if(e.k==='crow'){
const f=Math.sin(time*18+e.ph)*.9
e.wl.rotation.x=f;e.wr.rotation.x=-f
o.position.y=sc*1.5+Math.sin(time*5+e.ph)*.15
o.rotation.z=Math.sin(time*5+e.ph)*.08
}else{
const s=e.tel>0?0:Math.sin(e.ap)*.7
e.la.rotation.z=s;e.lb.rotation.z=-s
e.bm.position.y=Math.abs(Math.sin(e.ap))*.08*(e.tel>0?0:1)
if(e.ring){
e.ring.visible=e.el||e.tel>0
e.ring.material=e.tel>0?MTEL:MGOLD
e.ring.rotation.y=time*(e.el?1.5:0)
const rs=e.tel>0?1+Math.sin(time*30)*.08:1
e.ring.scale.set(rs,1,rs)
}
}
if(e.bar){
const fr=clamp(e.hp/e.mx,0,1)
e.bar.visible=e.hp<e.mx
e.bar.position.set(e.x*S,sc*3.4+1.2,e.y*S)
e.bar.quaternion.copy(cam.quaternion)
e.barF.scale.x=2.6*fr;e.barF.position.x=-1.3*(1-fr)
}
}
}
function syncGems(){
let n=0
for(const o of gems){
if(o.h){
if(!o.m){o.m=tplApple.clone();o.m.scale.multiplyScalar(.9);scene.add(o.m)}
o.m.position.set(o.x*S,.45+Math.sin(o.ph)*.15,o.y*S);o.m.rotation.y=o.ph*.5
continue
}
if(n>=GM)continue
const s=.3+Math.min(.28,o.v*.02)
_o.position.set(o.x*S,.35+s+Math.sin(o.ph)*.1,o.y*S);_o.rotation.set(0,o.ph*.7,0);_o.scale.set(s,s,s);_o.updateMatrix()
gi.setMatrixAt(n,_o.matrix);_c.set(o.v>=20?0xd6332b:o.v>=5?0xf5c831:0x9a6a2a);gi.setColorAt(n,_c);n++
}
gi.count=n
gi.instanceMatrix.needsUpdate=true
if(gi.instanceColor)gi.instanceColor.needsUpdate=true
}
function syncOrbit(){
const n=lv&&lv.acorns?lv.acorns+1:0
if(orbM.length!==n){
for(const o of orbM)scene.remove(o)
orbM=[]
for(let i=0;i<n;i++){const o=tplAcorn.clone();o.scale.multiplyScalar(.8);o.traverse(m=>{if(m.isMesh)m.castShadow=!lite});scene.add(o);orbM.push(o)}
}
if(n){
const L=lv.acorns,R=(80+8*L)*p.area
for(let i=0;i<n;i++){const a=orb+i*TAU/n;orbM[i].position.set((p.x+Math.cos(a)*R)*S,.5,(p.y+Math.sin(a)*R)*S);orbM[i].rotation.y=orb*2+i}
}
}
function syncFx(dt){
for(const j of pj){
const o=j.o
if(j.k==='f'){o.position.set(j.x*S,1.1,j.y*S);o.rotation.y=-j.a}
else if(j.k==='c'){o.position.set(j.x*S,1,j.y*S);o.rotation.y=-Math.atan2(j.vy,j.vx)}
else{o.position.set(j.x*S,.7,j.y*S);o.rotation.y=j.a}
}
for(const o of ep)o.o.position.set(o.x*S,1.1,o.y*S)
for(const r of rings){
const a=1-r.t/.45,s=r.r*S
r.o.position.set(p.x*S,.2,p.y*S);r.o.scale.set(s,1,s);r.o.material.opacity=Math.max(0,a*.85)
}
for(const o of pools){const s=o.r*S*Math.min(1,o.l/o.m*3);o.o.scale.set(s,1,s)}
}
function syncHud(){
const pr=clamp(p.hp/p.max,0,1)
if(pr!==lastHp){lastHp=pr;hpF.style.setProperty('--w',pr.toFixed(3));hpT.textContent=Math.ceil(Math.max(0,p.hp))+' / '+p.max;hpB.classList.toggle('lo',pr<.3)}
const xr=clamp(xp/need(),0,1)
if(xr!==lastXp){lastXp=xr;xpF.style.setProperty('--w',xr.toFixed(3))}
if(lvl!==lastLv){lastLv=lvl;lvT.textContent='Lv '+lvl}
if(kills!==lastK){lastK=kills;kT.textContent=kills+' foes'}
const ts=Math.floor(t)
if(ts!==lastT){lastT=ts;const m=Math.floor(ts/60),s=ts%60;tmT.textContent=m+':'+(s<10?'0':'')+s}
if(wave!==lastW){lastW=wave;wvT.textContent='Wave '+wave}
let boss=null
for(const e of en)if(e.k==='stag'){boss=e;break}
const bv=boss?clamp(boss.hp/boss.mx,0,1):-1
if(bv!==lastBoss){lastBoss=bv;mid.classList.toggle('bs',!!boss);if(boss)bossF.style.setProperty('--w',bv.toFixed(3))}
const key=Object.keys(lv).map(k=>k+lv[k]).join(',')
if(key!==itemKey){
itemKey=key
itemsE.textContent=''
for(const k of Object.keys(lv)){
const s=el('div','tk3-it '+(ITEMS[k].w?'w':'u'));s.append(icon(k,false))
const pips=el('div','tk3-pips');for(let i=0;i<lv[k];i++)pips.append(el('i'))
s.append(pips);itemsE.append(s)
}
}
hurtE.style.opacity=red?0:String(hurtF*.9)
lowE.classList.toggle('on',p.hp/p.max<.3&&st==='play'&&!red)
}
function syncDn(){
for(let i=0;i<dnP.length;i++){
const d=dn[i],n=dnP[i]
if(!d){if(n.dataset.on){n.dataset.on='';n.style.display='none'}continue}
_v.set(d.x*S,d.h,d.y*S).project(cam)
if(_v.z>1){n.style.display='none';continue}
n.style.display='block';n.dataset.on='1'
n.textContent=d.v;n.style.color=d.c
n.className=d.s>14?'tk3-dn big':'tk3-dn'
n.style.transform='translate('+((_v.x*.5+.5)*W).toFixed(1)+'px,'+((-_v.y*.5+.5)*H).toFixed(1)+'px)'
n.style.opacity=String(clamp(d.l/.3,0,1))
}
}
function syncAll(dt){
const k=Math.min(1,dt*7)
const px=p.x*S,pz=p.y*S
cx+=(px-cx)*k;cz+=(pz-cz)*k
let ox=0,oy=0,oz=0
if(!red&&shk>0){ox=rnd(-1,1)*shk*.05;oy=rnd(-1,1)*shk*.04;oz=rnd(-1,1)*shk*.05}
cam.position.set(cx+ox,CH+oy,cz+CZ+oz)
cam.lookAt(cx+ox*.5,0,cz+oz*.5)
if(sun){sun.position.set(px+26,46,pz+16);sun.target.position.set(px,0,pz)}
pivot.position.set(px,0,pz)
let da=p.hd-p.vh;da=Math.atan2(Math.sin(da),Math.cos(da));p.vh+=da*Math.min(1,dt*12)
pivot.rotation.y=-p.vh+OFF
pivot.visible=st!=='over'&&!(p.inv>.3&&Math.floor(time*30)%2)
tk.tick(dt,p.mv?1:0,p.mv?'run':'idle')
if(lvs){lvs.center.set(px,0,pz);lvs.tick(dt)}
fx.tick(dt)
syncEnemies(dt);syncGems();syncOrbit();syncFx(dt);syncHud();syncDn()
}
function frame(){
const now=performance.now()
const dt=Math.min(.05,(now-lastNow)/1000||.016);lastNow=now
try{
if(st==='play')update(dt)
else if(st==='over'){time+=dt;fxOnly(dt)}
syncAll(dt)
}catch(e){
errs++
if(errs>30){sg.stop();root.textContent='Thicket Survivors hit an error: '+(e&&e.message)}
}
}
let lastNow=performance.now()
function pos(e){const r=root.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
function down(e){
initAudio()
if(e.target.closest&&e.target.closest('button'))return
const[x,y]=pos(e)
if(st==='play'&&!joy.on){joy.on=true;joy.id=e.pointerId;joy.ox=x;joy.oy=y;joy.x=0;joy.y=0;joyE.classList.add('on');joyE.style.transform='translate('+x+'px,'+y+'px)';joyK.style.transform='translate(0px,0px)';try{root.setPointerCapture(e.pointerId)}catch{}}
}
function move(e){
if(joy.on&&e.pointerId===joy.id){const[x,y]=pos(e),dx=x-joy.ox,dy=y-joy.oy,d=Math.hypot(dx,dy),k=d>50?50/d:1;joy.x=dx*k/50;joy.y=dy*k/50;joyK.style.transform='translate('+(joy.x*50)+'px,'+(joy.y*50)+'px)'}
}
function endJoy(e){if(e.pointerId===joy.id){joy.on=false;joy.x=0;joy.y=0;joyE.classList.remove('on')}}
root.addEventListener('pointerdown',down)
root.addEventListener('pointermove',move)
root.addEventListener('pointerup',endJoy)
root.addEventListener('pointercancel',endJoy)
pb.addEventListener('click',pauseGame)
function key(e){
const k=e.key.toLowerCase()
initAudio()
if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(k))e.preventDefault()
kd.add(k)
if(st==='level'&&['1','2','3'].includes(k))choose(+k-1)
else if(k==='p'){if(st==='play')pauseGame();else if(st==='pause')unpause()}
else if(k==='m')mute=!mute
else if(k==='enter'&&st==='over')init()
}
function keyUp(e){kd.delete(e.key.toLowerCase())}
function pauseNow(){kd.clear();joy.on=false;joyE.classList.remove('on');pauseGame()}
function vis(){if(document.hidden)pauseNow()}
function size(){
W=root.clientWidth||innerWidth;H=root.clientHeight||innerHeight
vhp=782;vwp=vhp*W/H
}
addEventListener('keydown',key)
addEventListener('keyup',keyUp)
addEventListener('resize',size)
addEventListener('blur',pauseNow)
document.addEventListener('visibilitychange',vis)
size()
init();recalc()
sg.loop(frame)
return()=>{
sg.stop()
removeEventListener('keydown',key);removeEventListener('keyup',keyUp);removeEventListener('resize',size);removeEventListener('blur',pauseNow)
document.removeEventListener('visibilitychange',vis)
if(st!=='over'&&!saved&&t>=15){saved=true;api.finish(scoreNow(),t)}
clearWorld()
try{ac&&ac.close()}catch{}
try{disposeObj(scene)}catch{}
try{sg.dispose()}catch{}
root.remove()
}
}
