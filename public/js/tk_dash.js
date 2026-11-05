export default function launch(host,api){
const cv=document.createElement('canvas')
cv.style.setProperty('display','block')
cv.style.setProperty('width','100%')
cv.style.setProperty('height','100%')
cv.style.setProperty('touch-action','none')
host.append(cv)
const g=cv.getContext('2d')
const red=api.reduced(),lite=api.lite()
const VH=540,GY=432,BK='tk_dash_best'
let VW=960,sc=1,DPR=1,TW=1600
let best=0
try{best=+localStorage.getItem(BK)||0}catch{}
const rng=seed=>{let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash=k=>Math.abs(Math.sin(k*127.1)*43758.5453)%1
const mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k))
const rgb=a=>'rgb('+a[0]+','+a[1]+','+a[2]+')'
const LC=[
{f:.05,tr:'#7a4a48',cn:['#c98a5a','#d6a066','#b9704c'],base:GY-46,h:[120,190],n:16,w:9,haze:.5},
{f:.12,tr:'#6a3c32',cn:['#d9772e','#e8a43a','#c2552a'],base:GY-26,h:[150,240],n:12,w:13,haze:.34},
{f:.24,tr:'#4e2a22',cn:['#c9451f','#e08a24','#a83a1c','#efb53a'],base:GY-8,h:[200,320],n:8,w:20,haze:.18},
{f:.46,tr:'#33180f',cn:['#8e2c16','#b8581a','#7a2a12'],base:GY+14,h:[300,460],n:4,w:34,haze:0}
]
let layers=[],vig=null
const rayG=g.createLinearGradient(0,0,900,0)
rayG.addColorStop(0,'rgba(255,236,170,.2)')
rayG.addColorStop(1,'rgba(255,236,170,0)')
function build(){
layers=LC.map((L,i)=>{
const o=document.createElement('canvas')
o.width=Math.ceil(TW*sc)
o.height=Math.ceil(VH*sc)
const x=o.getContext('2d')
x.scale(sc,sc)
const r=rng(i*77+3)
const seg=TW/L.n
for(let k=0;k<L.n;k++){
const px=(k+.2+r()*.6)*seg
const h=L.h[0]+r()*(L.h[1]-L.h[0])
const w=L.w*(.8+r()*.5)
const cols=[]
for(let j=0;j<6;j++)cols.push([(r()-.5)*h*.55,-h*(.62+r()*.38),h*(.16+r()*.14),L.cn[Math.floor(r()*L.cn.length)]])
for(const ox of [-TW,0,TW]){
const bx=px+ox
if(bx<-300||bx>TW+300)continue
x.fillStyle=L.tr
x.fillRect(bx-w/2,L.base-h*.7,w,h*.7+40)
for(const c of cols){
x.fillStyle=c[3]
x.beginPath()
x.arc(bx+c[0],L.base+c[1],c[2],0,7)
x.fill()
}
}
}
if(L.haze){
x.globalCompositeOperation='source-atop'
x.fillStyle='rgba(255,214,150,'+L.haze+')'
x.fillRect(0,0,TW,VH)
}
return o
})
vig=g.createRadialGradient(VW/2,VH/2,VH*.45,VW/2,VH/2,Math.max(VW,VH)*.78)
vig.addColorStop(0,'rgba(30,10,0,0)')
vig.addColorStop(1,'rgba(30,10,0,.5)')
}
function resize(){
DPR=Math.min(2,window.devicePixelRatio||1)
const w=Math.max(2,host.clientWidth),h=Math.max(2,host.clientHeight)
cv.width=Math.round(w*DPR)
cv.height=Math.round(h*DPR)
sc=cv.height/VH
VW=cv.width/sc
TW=Math.max(1600,Math.ceil(VW)+240)
build()
}
const ro=new ResizeObserver(resize)
ro.observe(host)
resize()
let ac=null,master=null,nbuf=null,mute=false,nextN=0,step=0
function aud(){
if(ac){if(ac.state==='suspended')ac.resume();return}
const C=window.AudioContext||window.webkitAudioContext
if(!C)return
ac=new C()
master=ac.createGain()
master.gain.value=.5
master.connect(ac.destination)
nbuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate)
const d=nbuf.getChannelData(0)
for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1
nextN=ac.currentTime+.1
}
function tone(f,d,ty,v,sl,at){
if(!ac||mute)return
const o=ac.createOscillator(),gn=ac.createGain(),t0=at||ac.currentTime
o.type=ty
o.frequency.setValueAtTime(f,t0)
if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,sl),t0+d)
gn.gain.setValueAtTime(v,t0)
gn.gain.exponentialRampToValueAtTime(.0001,t0+d)
o.connect(gn)
gn.connect(master)
o.start(t0)
o.stop(t0+d+.03)
}
function noise(d,v,f){
if(!ac||mute)return
const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t0=ac.currentTime
s.buffer=nbuf
fl.type='lowpass'
fl.frequency.setValueAtTime(f,t0)
fl.frequency.exponentialRampToValueAtTime(100,t0+d)
gn.gain.setValueAtTime(v,t0)
gn.gain.exponentialRampToValueAtTime(.0001,t0+d)
s.connect(fl)
fl.connect(gn)
gn.connect(master)
s.start(t0)
s.stop(t0+d+.03)
}
const PEN=[220,261.63,293.66,329.63,392,440,523.25,587.33]
const BASS=[110,110,98,82.41]
function music(){
if(!ac||mute||state!=='play')return
const dur=60/(104+speed*.06)/2
while(nextN<ac.currentTime+.15){
const bar=Math.floor(step/8)%4
if(step%2===0)tone(BASS[bar],dur*1.6,'triangle',.07,0,nextN)
if(step%4===2)noise(.05,.02,5000)
if(step%2===1||Math.random()<.3)tone(PEN[Math.floor(Math.random()*PEN.length)]*(bar===2?.75:1),dur*1.2,'sine',.035,0,nextN)
step++
nextN+=dur
}
}
const T={x:150,y:GY,vy:0,air:false,jumps:0,duck:false,run:0,inv:0,lives:3,sq:0}
let state='ready',t=0,time=0,dist=0,bonus=0,combo=0,mult=1,speed=170,slow=1,scroll=0,shake=0,freeze=0,flash=0,overT=0,resP=-1,newBest=false,gapLeft=200,lastType='',duckHeld=false
let obs=[],pies=[],parts=[],pops=[],leaves=[]
const score=()=>Math.floor(dist/14)+bonus
const LN=lite||red?10:26
for(let i=0;i<LN;i++)leaves.push({x:Math.random()*VW,y:Math.random()*VH,vx:-30-Math.random()*60,vy:30+Math.random()*50,r:3+Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*3,ph:Math.random()*6,c:['#e8741c','#c9331a','#f2b134','#a6521a'][i%4]})
function reset(){
t=0;dist=0;bonus=0;combo=0;mult=1;slow=1;shake=0;flash=0;freeze=0
obs=[];pies=[];parts=[];pops=[]
T.y=GY;T.vy=0;T.air=false;T.jumps=0;T.duck=false;T.inv=0;T.lives=3;T.sq=0
gapLeft=260;lastType='';newBest=false;resP=-1
step=0
if(ac)nextN=ac.currentTime+.1
}
function burst(x,y,n,cols,sp,l,k){
if(parts.length>260)return
for(let i=0;i<n;i++){
const a=Math.random()*6.283,s=sp*(.3+Math.random())
parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-sp*.3,l:l*(.6+Math.random()*.6),m:l,c:cols[i%cols.length],r:2+Math.random()*3,k,rot:Math.random()*6,vr:(Math.random()-.5)*10})
}
}
function pop(x,y,s,c,sz){pops.push({x,y,s,c,sz:sz||24,l:.9,m:.9})}
function start(){
aud()
reset()
state='play'
sfxStart()
}
function sfxStart(){
tone(392,.12,'triangle',.12)
tone(523.25,.12,'triangle',.12,0,ac&&ac.currentTime+.08)
tone(659.25,.2,'triangle',.12,0,ac&&ac.currentTime+.16)
}
function jump(){
if(state!=='play'||T.jumps>=2)return
const first=T.jumps===0
T.vy=first?-780:-660
T.jumps++
T.air=true
T.sq=-.3
tone(first?330:440,.16,'square',.07,first?660:880)
if(first)burst(T.x,GY,6,['#a47a4c','#c9a070'],90,.4,0)
else burst(T.x,T.y-10,8,['#f2c230','#ffe9a0','#e8741c'],120,.45,1)
}
function spawn(){
const r=Math.random()
let k='log'
if(r<.28)k='stump'
else if(r<.52)k='branch'
else if(r<.7&&t>20)k='fox'
if(k===lastType&&k!=='log'&&Math.random()<.6)k='log'
lastType=k
const x=VW+90
const o=k==='log'?{k,x,w:58,y0:GY-36,y1:GY,ex:0}:k==='stump'?{k,x,w:44,y0:GY-62,y1:GY,ex:0}:k==='branch'?{k,x,w:110,y0:GY-190,y1:GY-46,ex:0}:{k,x,w:62,y0:GY-34,y1:GY,ex:150}
obs.push(o)
if(k==='branch')for(let i=0;i<4;i++)pies.push({x:x+8+i*30,y:GY-24,ph:i})
else if(k!=='fox')for(let i=0;i<5;i++)pies.push({x:x+o.w/2+(i-2)*46,y:GY-50-Math.sin(i/4*Math.PI)*108,ph:i})
gapLeft=speed*(.95+Math.random()*.75)+100
if(Math.random()<.6){
const fx=x+gapLeft*.5,fy=Math.random()<.5?GY-30:GY-96
for(let i=0;i<4;i++)pies.push({x:fx+i*36,y:fy,ph:i})
}
}
function hit(){
if(T.inv>0)return
T.lives--
combo=0;mult=1
shake=.6;freeze=.09;flash=1
burst(T.x,T.y-36,22,['#7a4a22','#c9772e','#e8a43a','#a02c18'],260,.9,2)
noise(.35,.3,2400)
tone(160,.3,'sawtooth',.14,60)
if(T.lives<=0){end();return}
T.inv=1.6
slow=.6
}
function end(){
state='over'
overT=0
const s=score()
newBest=s>best
if(newBest){best=s;try{localStorage.setItem(BK,String(best))}catch{}}
tone(330,.3,'triangle',.12,165)
tone(220,.5,'triangle',.12,98,ac&&ac.currentTime+.25)
const p=api.finish(s,t)
if(p&&p.then)p.then(d=>{resP=d&&d.pars||0})
else resP=0
}
function collect(p){
combo++
mult=1+Math.min(4,Math.floor(combo/4))
const gain=10*mult
bonus+=gain
pop(p.x,p.y-14,'+'+gain,mult>1?'#ffe08a':'#fff',mult>1?28:22)
burst(p.x,p.y,10,['#ffe08a','#f2b134','#fff'],180,.5,1)
const n=Math.min(PEN.length-1,combo%8)
tone(PEN[n]*2,.14,'triangle',.1)
tone(PEN[n]*3,.1,'sine',.05,0,ac&&ac.currentTime+.04)
}
function update(dt){
time+=dt
if(freeze>0){freeze-=dt;return}
shake=Math.max(0,shake-dt*2.2)
flash=Math.max(0,flash-dt*3)
slow=Math.min(1,slow+dt*.5)
if(state==='play'){t+=dt;speed=(330+Math.min(430,t*5.2))*slow}
else if(state==='ready')speed=170
else speed=Math.max(0,speed-dt*600)
scroll+=speed*dt
T.sq*=Math.pow(.001,dt)
T.run+=dt*(5+speed*.018)
T.inv=Math.max(0,T.inv-dt)
if(state==='play'){
dist+=speed*dt
T.duck=duckHeld
T.vy+=(T.duck&&T.air?4400:2150)*dt
T.y+=T.vy*dt
if(T.y>=GY){
if(T.air){
T.sq=.32
burst(T.x,GY,7,['#a47a4c','#c9a070','#8a6038'],110,.45,0)
tone(110,.08,'sine',.12,60)
}
T.y=GY;T.vy=0;T.air=false;T.jumps=0
}
gapLeft-=speed*dt
if(gapLeft<=0)spawn()
const ducking=T.duck&&!T.air
const bx0=T.x-17,bx1=T.x+17,by1=T.y-4,by0=T.y-(ducking?32:64)
for(const o of obs){
o.x-=(speed+o.ex)*dt
if(T.inv<=0&&bx1>o.x+4&&bx0<o.x+o.w-4&&by1>o.y0+4&&by0<o.y1-4)hit()
}
const cx=T.x,cy=T.y-(ducking?18:38)
for(let i=pies.length-1;i>=0;i--){
const p=pies[i]
p.x-=speed*dt
const dx=p.x-cx,dy=p.y-cy
if(dx*dx+dy*dy<1600){pies.splice(i,1);collect(p)}
else if(p.x<-60)pies.splice(i,1)
}
obs=obs.filter(o=>o.x>-220)
music()
}else{
T.y=GY
if(state==='over'){overT+=dt}
}
for(const o of obs){if(state!=='play')o.x-=speed*dt}
for(let i=parts.length-1;i>=0;i--){
const p=parts[i]
p.l-=dt
if(p.l<=0){parts.splice(i,1);continue}
p.vy+=(p.k===1?-40:520)*dt
p.x+=p.vx*dt-speed*dt*.3
p.y+=p.vy*dt
p.rot+=p.vr*dt
}
for(let i=pops.length-1;i>=0;i--){
const p=pops[i]
p.l-=dt
p.y-=50*dt
if(p.l<=0)pops.splice(i,1)
}
const lf=red?.25:1
for(const l of leaves){
l.ph+=dt*2
l.x+=(l.vx-speed*.5)*dt*lf
l.y+=l.vy*dt*lf+Math.sin(l.ph)*20*dt*lf
l.rot+=l.vr*dt*lf
if(l.x<-20){l.x=VW+20;l.y=Math.random()*VH*.7}
if(l.y>VH+20){l.y=-20;l.x=Math.random()*(VW+100)}
}
}
function rr(x,y,w,h,r){
g.beginPath()
g.moveTo(x+r,y)
g.arcTo(x+w,y,x+w,y+h,r)
g.arcTo(x+w,y+h,x,y+h,r)
g.arcTo(x,y+h,x,y,r)
g.arcTo(x,y,x+w,y,r)
g.closePath()
}
function tx(s,x,y,sz,col,al,w){
g.font=(w||700)+' '+sz+'px Georgia,serif'
g.textAlign=al||'left'
g.textBaseline='alphabetic'
g.fillStyle='rgba(40,18,6,.6)'
g.fillText(s,x+2,y+3)
g.fillStyle=col
g.fillText(s,x,y)
}
function pie(x,y,ph){
const bob=Math.sin(time*5+ph)*3
g.save()
g.translate(x,y+bob)
g.fillStyle='rgba(255,220,120,.25)'
g.beginPath()
g.arc(0,0,22,0,7)
g.fill()
g.fillStyle='#8a5a2a'
g.beginPath()
g.ellipse(0,5,15,6,0,0,7)
g.fill()
g.fillStyle='#e0a050'
g.beginPath()
g.ellipse(0,0,15,9,0,0,7)
g.fill()
g.fillStyle='#c8601c'
g.beginPath()
g.ellipse(0,-1,11,6,0,0,7)
g.fill()
g.strokeStyle='#e8bf70'
g.lineWidth=1.5
g.beginPath()
g.moveTo(-8,-4);g.lineTo(8,2);g.moveTo(-8,2);g.lineTo(8,-4);g.moveTo(0,-6);g.lineTo(0,4)
g.stroke()
g.fillStyle='rgba(255,255,255,.6)'
g.beginPath()
g.ellipse(-5,-3,3,1.4,-.4,0,7)
g.fill()
g.restore()
}
function turkey(){
const blink=T.inv>0&&Math.floor(time*16)%2===0
if(blink)return
const ducking=T.duck&&!T.air&&state==='play'
const ph=T.run
g.save()
g.translate(T.x,T.y)
g.fillStyle='rgba(0,0,0,.25)'
g.beginPath()
g.ellipse(0,2,26*(1-(GY-T.y)/400),6,0,0,7)
g.fill()
const sy=ducking?.62:1+T.sq*.5,sx=ducking?1.15:1-T.sq*.3
g.scale(sx,sy)
const air=T.air
const lift=air?0:Math.abs(Math.sin(ph))*3
g.translate(0,-lift)
const fc=['#8e2c16','#c9451f','#e08a24','#efb53a','#e08a24','#c9451f','#8e2c16']
for(let i=0;i<7;i++){
const a=-1.5-.15-i*.2+Math.sin(time*3+i)*.03+(air?.12:0)
const px=-12+Math.cos(a)*26,py=-34+Math.sin(a)*26
g.fillStyle=fc[i]
g.beginPath()
g.ellipse(px,py,26,7.5,a,0,7)
g.fill()
g.fillStyle='rgba(255,240,200,.35)'
g.beginPath()
g.ellipse(-12+Math.cos(a)*40,-34+Math.sin(a)*40,6,3,a,0,7)
g.fill()
}
g.strokeStyle='#d98a2c'
g.lineWidth=3
g.lineCap='round'
const l1=air?[-4,-14,-10,0]:[-4,-16+0,Math.sin(ph)*10-4,0-Math.max(0,Math.cos(ph))*6]
const l2=air?[6,-14,12,-4]:[6,-16,Math.sin(ph+3.14)*10+6,0-Math.max(0,Math.cos(ph+3.14))*6]
for(const l of [l1,l2]){
g.beginPath()
g.moveTo(l[0],-16)
g.lineTo(l[2],l[3])
g.lineTo(l[2]+6,l[3])
g.stroke()
}
const bg=g.createRadialGradient(-4,-42,4,0,-34,26)
bg.addColorStop(0,'#a8683a')
bg.addColorStop(1,'#6a3a1a')
g.fillStyle=bg
g.beginPath()
g.ellipse(0,-34,24,19,-.05,0,7)
g.fill()
g.fillStyle='#d9a066'
g.beginPath()
g.ellipse(8,-30,11,10,0,0,7)
g.fill()
g.fillStyle='#4e2a12'
g.beginPath()
g.ellipse(-6,-34,12,8,.3+(air?-.6:Math.sin(ph*2)*.12),0,7)
g.fill()
g.strokeStyle='#8a5a30'
g.lineWidth=7
g.beginPath()
g.moveTo(14,-44)
g.quadraticCurveTo(22,-52,22+(air?2:0),-60)
g.stroke()
g.fillStyle='#d9604a'
g.beginPath()
g.arc(24,-64,8.5,0,7)
g.fill()
g.fillStyle='#4a7fb0'
g.beginPath()
g.arc(22,-68,3.5,0,7)
g.fill()
g.fillStyle='#e8c030'
g.beginPath()
g.moveTo(30,-66);g.lineTo(39,-62);g.lineTo(30,-60)
g.fill()
g.fillStyle='#c42a1c'
g.beginPath()
g.ellipse(31,-57,3.2,6,.2,0,7)
g.fill()
g.beginPath()
g.ellipse(33,-70,2.5,5,.5,0,7)
g.fill()
g.fillStyle='#fff'
g.beginPath()
g.arc(26,-66,3,0,7)
g.fill()
g.fillStyle='#1a0e06'
g.beginPath()
g.arc(27,-66,1.5,0,7)
g.fill()
g.restore()
}
function fox(o){
const ph=time*16
g.save()
g.translate(o.x+o.w/2,GY)
g.scale(-1,1)
g.fillStyle='rgba(0,0,0,.25)'
g.beginPath()
g.ellipse(0,2,30,5,0,0,7)
g.fill()
g.fillStyle='#e8741c'
g.beginPath()
g.ellipse(-30,-22+Math.sin(ph)*2,20,8,-.5+Math.sin(ph)*.1,0,7)
g.fill()
g.fillStyle='#fff'
g.beginPath()
g.ellipse(-46,-30+Math.sin(ph)*3,7,4,-.5,0,7)
g.fill()
g.strokeStyle='#3a1e0e'
g.lineWidth=4
g.lineCap='round'
for(const k of [0,1.6,3.1,4.7]){
const sx=(k<2?-14:14)+(k%3.1<1?0:4)
g.beginPath()
g.moveTo(sx,-16)
g.lineTo(sx+Math.sin(ph+k)*12,-2-Math.max(0,Math.cos(ph+k))*6)
g.stroke()
}
g.fillStyle='#e8741c'
g.beginPath()
g.ellipse(0,-22,26,12,0,0,7)
g.fill()
g.fillStyle='#fff3dc'
g.beginPath()
g.ellipse(6,-17,14,6,0,0,7)
g.fill()
g.fillStyle='#e8741c'
g.beginPath()
g.ellipse(24,-28,12,9,.1,0,7)
g.fill()
g.beginPath()
g.moveTo(16,-34);g.lineTo(18,-46);g.lineTo(25,-35)
g.moveTo(26,-35);g.lineTo(31,-45);g.lineTo(33,-31)
g.fill()
g.fillStyle='#fff3dc'
g.beginPath()
g.moveTo(30,-24);g.lineTo(40,-25);g.lineTo(32,-20)
g.fill()
g.fillStyle='#1a0e06'
g.beginPath()
g.arc(40,-25,2,0,7)
g.arc(26,-30,1.8,0,7)
g.fill()
g.restore()
}
function obstacle(o){
if(o.k==='fox'){fox(o);return}
g.save()
if(o.k==='log'){
g.translate(o.x,GY)
g.fillStyle='rgba(0,0,0,.25)'
g.beginPath()
g.ellipse(o.w/2,2,o.w/2+6,5,0,0,7)
g.fill()
const lg=g.createLinearGradient(0,-36,0,0)
lg.addColorStop(0,'#8a5a30')
lg.addColorStop(1,'#4a2a14')
g.fillStyle=lg
rr(0,-36,o.w,36,12)
g.fill()
g.strokeStyle='rgba(30,14,6,.5)'
g.lineWidth=2
for(let i=1;i<4;i++){g.beginPath();g.moveTo(10+i*10,-30);g.lineTo(12+i*10,-6);g.stroke()}
g.fillStyle='#d9a066'
g.beginPath()
g.ellipse(o.w-6,-18,7,17,0,0,7)
g.fill()
g.strokeStyle='#8a5a30'
g.beginPath()
g.ellipse(o.w-6,-18,3.5,9,0,0,7)
g.stroke()
g.fillStyle='#d6322c'
g.beginPath()
g.arc(14,-37,6,Math.PI,0)
g.fill()
g.fillStyle='#fff'
g.fillRect(11,-41,2,2)
g.fillRect(16,-40,2,2)
}else if(o.k==='stump'){
g.translate(o.x,GY)
g.fillStyle='rgba(0,0,0,.25)'
g.beginPath()
g.ellipse(o.w/2,2,o.w/2+8,5,0,0,7)
g.fill()
const sg=g.createLinearGradient(0,0,o.w,0)
sg.addColorStop(0,'#5a3418')
sg.addColorStop(.5,'#8a5a30')
sg.addColorStop(1,'#4a2a14')
g.fillStyle=sg
g.beginPath()
g.moveTo(-6,0);g.quadraticCurveTo(6,-14,4,-56);g.lineTo(o.w-4,-56);g.quadraticCurveTo(o.w-6,-14,o.w+6,0)
g.fill()
g.fillStyle='#d9a066'
g.beginPath()
g.ellipse(o.w/2,-58,o.w/2-2,8,0,0,7)
g.fill()
g.strokeStyle='#8a5a30'
g.lineWidth=1.5
g.beginPath()
g.ellipse(o.w/2,-58,10,4,0,0,7)
g.ellipse(o.w/2,-58,18,6,0,0,7)
g.stroke()
}else{
g.translate(o.x,0)
g.strokeStyle='#3a2010'
g.lineWidth=5
g.beginPath()
g.moveTo(18,0);g.lineTo(18,o.y1-30)
g.moveTo(o.w-20,0);g.lineTo(o.w-20,o.y1-20)
g.stroke()
g.strokeStyle='#5a3418'
g.lineWidth=14
g.lineCap='round'
g.beginPath()
g.moveTo(0,o.y1-30)
g.quadraticCurveTo(o.w/2,o.y1-4,o.w,o.y1-24)
g.stroke()
const lc=['#c9451f','#e08a24','#efb53a','#a83a1c']
for(let i=0;i<9;i++){
g.fillStyle=lc[i%4]
g.beginPath()
g.ellipse(6+i*12,o.y1-22+Math.sin(i*2+time*2)*3+Math.sin(i)*6,9,5,i,0,7)
g.fill()
}
}
g.restore()
}
function leafShape(l){
g.save()
g.translate(l.x,l.y)
g.rotate(l.rot)
g.scale(1,.55+Math.abs(Math.sin(l.ph))*.45)
g.fillStyle=l.c
g.beginPath()
g.ellipse(0,0,l.r*1.6,l.r,0,0,7)
g.fill()
g.restore()
}
function drawSky(dusk){
const a=mix([244,185,110],[88,52,110],dusk),b=mix([255,226,170],[226,110,80],dusk)
const sk=g.createLinearGradient(0,0,0,GY)
sk.addColorStop(0,rgb(a))
sk.addColorStop(1,rgb(b))
g.fillStyle=sk
g.fillRect(0,0,VW,VH)
const sx=VW*.72,sy=GY*.46+dusk*130
const gl=g.createRadialGradient(sx,sy,10,sx,sy,260)
gl.addColorStop(0,'rgba(255,240,190,.9)')
gl.addColorStop(.25,'rgba(255,210,130,.35)')
gl.addColorStop(1,'rgba(255,200,120,0)')
g.fillStyle=gl
g.fillRect(0,0,VW,VH)
if(!lite){
g.save()
g.translate(sx,sy)
g.globalCompositeOperation='lighter'
g.fillStyle=rayG
const n=12
for(let i=0;i<n;i++){
g.save()
g.rotate((red?0:time*.04)+i*6.283/n)
g.beginPath()
g.moveTo(0,0);g.lineTo(900,-60);g.lineTo(900,60)
g.fill()
g.restore()
}
g.restore()
}
g.fillStyle='#fff6d6'
g.beginPath()
g.arc(sx,sy,44,0,7)
g.fill()
}
function draw(){
g.setTransform(1,0,0,1,0,0)
g.clearRect(0,0,cv.width,cv.height)
g.setTransform(sc,0,0,sc,0,0)
const dusk=Math.min(1,t/150)*.85
const sh=shake*14
g.save()
if(sh>0&&!red)g.translate((Math.random()-.5)*sh,(Math.random()-.5)*sh)
drawSky(dusk)
g.save()
g.setTransform(1,0,0,1,0,0)
for(let i=0;i<layers.length;i++){
const w=TW*sc
const off=((scroll*LC[i].f*sc)%w+w)%w
g.drawImage(layers[i],-off,0)
g.drawImage(layers[i],w-off,0)
if(i===1&&dusk>0){
g.fillStyle='rgba(70,20,90,'+dusk*.22+')'
g.fillRect(0,0,cv.width,cv.height)
}
}
g.restore()
const gg=g.createLinearGradient(0,GY,0,VH)
gg.addColorStop(0,'#6a4424')
gg.addColorStop(.15,'#4a2c16')
gg.addColorStop(1,'#241208')
g.fillStyle=gg
g.fillRect(-20,GY,VW+40,VH-GY+20)
const base=Math.floor(scroll/28),off=scroll-base*28
for(let i=0;i*28-off<VW+30;i++){
const k=base+i,x=i*28-off,hh=8+hash(k)*12
g.fillStyle=k%3===0?'#a8561a':k%3===1?'#7a4a1a':'#c27a22'
g.beginPath()
g.moveTo(x,GY+3);g.lineTo(x+5+hash(k+9)*4,GY-hh);g.lineTo(x+11,GY+3)
g.fill()
if(hash(k+3)>.8){
g.fillStyle='rgba(0,0,0,.25)'
g.beginPath()
g.ellipse(x+6,GY+28+hash(k)*40,6,3,0,0,7)
g.fill()
}
}
g.fillStyle='rgba(255,220,150,.08)'
g.fillRect(0,GY,VW,3)
for(const o of obs)obstacle(o)
for(const p of pies)pie(p.x,p.y,p.ph)
turkey()
for(const p of parts){
const a=Math.max(0,p.l/p.m)
g.globalAlpha=a
g.fillStyle=p.c
if(p.k===1){
g.globalCompositeOperation='lighter'
g.beginPath()
g.arc(p.x,p.y,p.r*a+1,0,7)
g.fill()
g.globalCompositeOperation='source-over'
}else if(p.k===2){
g.save()
g.translate(p.x,p.y)
g.rotate(p.rot)
g.beginPath()
g.ellipse(0,0,p.r*2.2,p.r*.9,0,0,7)
g.fill()
g.restore()
}else{
g.beginPath()
g.arc(p.x,p.y,p.r,0,7)
g.fill()
}
}
g.globalAlpha=1
for(const l of leaves)leafShape(l)
for(const p of pops){
g.globalAlpha=Math.min(1,p.l/p.m*1.6)
tx(p.s,p.x,p.y,p.sz,p.c,'center')
}
g.globalAlpha=1
g.restore()
g.fillStyle=vig
g.fillRect(0,0,VW,VH)
if(flash>0){
g.fillStyle='rgba(255,60,30,'+flash*.35+')'
g.fillRect(0,0,VW,VH)
}
hud()
}
function hud(){
if(state!=='ready'){
tx('Score '+score(),24,44,28,'#fff6d6')
tx('Best '+best,24,70,16,'#ffd98a',0,600)
for(let i=0;i<3;i++){
g.fillStyle=i<T.lives?'#efb53a':'rgba(40,18,6,.45)'
g.beginPath()
g.ellipse(34+i*28,94,10,8,0,0,7)
g.fill()
g.fillStyle=i<T.lives?'#c9451f':'rgba(40,18,6,.45)'
g.beginPath()
g.ellipse(34+i*28,98,6,5,0,0,7)
g.fill()
}
if(combo>1){
const k=(combo%4)/4
tx('x'+mult+'  '+combo+' pies',24,134,22,mult>1?'#ffe08a':'#fff')
g.fillStyle='rgba(40,18,6,.5)'
rr(24,142,130,8,4)
g.fill()
g.fillStyle='#f2b134'
rr(24,142,Math.max(8,130*(mult>=5?1:k)),8,4)
g.fill()
}
}
g.fillStyle='rgba(40,18,6,.45)'
rr(24,VH-62,40,34,8)
g.fill()
g.fillStyle='#fff6d6'
g.beginPath()
g.moveTo(34,VH-50);g.lineTo(40,VH-50);g.lineTo(48,VH-56);g.lineTo(48,VH-34);g.lineTo(40,VH-40);g.lineTo(34,VH-40)
g.fill()
if(mute){
g.strokeStyle='#ff9a7a'
g.lineWidth=3
g.beginPath()
g.moveTo(52,VH-54);g.lineTo(60,VH-36);g.moveTo(60,VH-54);g.lineTo(52,VH-36)
g.stroke()
}
if(state==='ready'){
g.fillStyle='rgba(30,10,0,.45)'
g.fillRect(0,0,VW,VH)
tx('Turkey Dash',VW/2,190,72,'#ffe08a','center',800)
tx('Outrun the thicket. Collect pies. Keep your feathers.',VW/2,238,22,'#fff6d6','center',600)
tx('Space / Up: jump (twice)    Down: duck    Tap: jump, hold low: duck',VW/2,284,18,'#ffd98a','center',600)
const s=1+Math.sin(time*4)*.04
g.save()
g.translate(VW/2,350)
g.scale(s,s)
tx('Press Space or tap to run',0,0,30,'#fff','center')
g.restore()
}
if(state==='over'){
const k=Math.min(1,overT*3)
g.fillStyle='rgba(20,6,0,'+k*.55+')'
g.fillRect(0,0,VW,VH)
g.save()
g.translate(VW/2,VH/2)
g.scale(.85+k*.15,.85+k*.15)
g.globalAlpha=k
g.fillStyle='rgba(60,28,10,.92)'
rr(-230,-140,460,290,22)
g.fill()
g.strokeStyle='#e8a43a'
g.lineWidth=3
g.stroke()
tx('Run over',0,-90,44,'#ffe08a','center',800)
tx(String(score()),0,-30,64,'#fff','center',800)
tx(newBest?'New best':'Best '+best,0,4,22,newBest?'#9aff9a':'#ffd98a','center',700)
tx(resP<0?'Counting Pars...':resP>0?'+'+resP+' Pars':'Run longer than 15s for Pars',0,48,24,'#fff6d6','center',700)
if(overT>.7)tx('Space or tap to run again',0,110,22,'#fff','center',700)
g.restore()
}
}
let raf=0,last=0
function frame(ts){
raf=requestAnimationFrame(frame)
const dt=Math.min(.05,(ts-last)/1000||0)
last=ts
update(dt)
draw()
}
raf=requestAnimationFrame(frame)
function press(){
if(state==='ready')start()
else if(state==='over'){if(overT>.7)start()}
else jump()
}
function cut(){if(T.vy<-260)T.vy=-260}
const kd=e=>{
if(e.repeat&&(e.code==='Space'||e.key==='ArrowUp'))return
if(e.code==='Space'||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){e.preventDefault();press()}
else if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){e.preventDefault();duckHeld=true}
else if(e.key==='m'||e.key==='M')mute=!mute
}
const ku=e=>{
if(e.code==='Space'||e.key==='ArrowUp'||e.key==='w'||e.key==='W')cut()
else if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')duckHeld=false
}
let ptr=-1
const pd=e=>{
e.preventDefault()
const r=cv.getBoundingClientRect()
const lx=(e.clientX-r.left)/r.width*VW,ly=(e.clientY-r.top)/r.height*VH
try{cv.setPointerCapture(e.pointerId)}catch{}
if(lx>24&&lx<64&&ly>VH-62&&ly<VH-28){aud();mute=!mute;return}
if(state==='play'&&ly>VH*.74){duckHeld=true;ptr=e.pointerId;return}
press()
ptr=e.pointerId
}
const pu=e=>{
if(e.pointerId!==ptr)return
ptr=-1
duckHeld=false
cut()
}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
cv.addEventListener('pointerdown',pd)
cv.addEventListener('pointerup',pu)
cv.addEventListener('pointercancel',pu)
return()=>{
cancelAnimationFrame(raf)
ro.disconnect()
removeEventListener('keydown',kd)
removeEventListener('keyup',ku)
cv.removeEventListener('pointerdown',pd)
cv.removeEventListener('pointerup',pu)
cv.removeEventListener('pointercancel',pu)
if(ac){try{ac.close()}catch{}}
}
}
