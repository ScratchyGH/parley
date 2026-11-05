import{h}from'./util.js'
const sty=(e,o)=>{for(const k in o)e.style.setProperty(k,o[k])}
const KINDS={
apple:{v:10,w:5},
pumpkin:{v:15,w:3},
corn:{v:10,w:4},
pie:{v:25,w:2},
acorn:{v:10,w:4}
}
const BAG=Object.entries(KINDS).flatMap(([k,o])=>Array(o.w).fill(k))
export default function launch(host,api){
const KEY='tk_best_catch'
const cv=document.createElement('canvas')
sty(cv,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block',cursor:'none'})
host.append(cv)
const g=cv.getContext('2d')
let w=1,hh=1,dpr=1,s=1
let st='ready',t=0,secs=0,score=0,combo=0,maxCombo=0,lives=3,feast=0,spawnT=0,shake=0,flash=0,hurt=0,squash=0
let px=0,tx=0,pvx=0,keyDir=0,doneT=0
let items=[],parts=[],pops=[],leaves=[]
let best=0,ov=null,last=0,raf=0,dead=false,ac=null,mute=false
try{best=+localStorage.getItem(KEY)||0}catch{}
const red=()=>api.reduced()
const lite=()=>api.lite()
function au(){
if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)()}catch{}}
if(ac&&ac.state==='suspended')ac.resume()
return ac
}
function tone(f,d,type,v,sl,delay){
if(mute)return
const a=au()
if(!a)return
const t0=a.currentTime+(delay||0)
const o=a.createOscillator(),gn=a.createGain()
o.type=type
o.frequency.setValueAtTime(f,t0)
if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,sl),t0+d)
gn.gain.setValueAtTime(v,t0)
gn.gain.exponentialRampToValueAtTime(0.001,t0+d)
o.connect(gn)
gn.connect(a.destination)
o.start(t0)
o.stop(t0+d+0.03)
}
const SC=[392,440,494,587,659,784,880]
function pw(){return(feast>0?190:140)*s}
function ph(){return 74*s}
function py(){return hh-96*s}
function fit(){
w=host.clientWidth||innerWidth
hh=host.clientHeight||innerHeight
dpr=Math.min(devicePixelRatio||1,2)
cv.width=Math.round(w*dpr)
cv.height=Math.round(hh*dpr)
s=Math.max(.5,Math.min(w/520,hh/760))
if(!px){px=w/2;tx=w/2}
const n=red()?5:lite()?8:18
leaves=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*hh,r:Math.random()*6,vr:(Math.random()-.5)*3,vy:24+Math.random()*34,sw:Math.random()*6,c:['#d9742a','#b3402a','#e4a63a','#8f5d36'][Math.floor(Math.random()*4)],z:.6+Math.random()*.8}))
}
function reset(){
items=[];parts=[];pops=[]
score=0;combo=0;maxCombo=0;lives=3;feast=0;spawnT=.6;secs=0;shake=0;flash=0;hurt=0;t=0
st='ready'
if(ov){ov.remove();ov=null}
}
function spawnP(n,x,y,cols,sp,up){
const cap=lite()?60:220
for(let i=0;i<n&&parts.length<cap;i++){
const a=Math.random()*Math.PI*2,v=sp*(.3+Math.random())
parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-up,life:0,max:.4+Math.random()*.6,c:cols[i%cols.length],sz:(2+Math.random()*4)*s})
}
}
function pop(txt,x,y,c,big){pops.push({x,y,txt,c,life:0,max:big?1.2:.8,big})}
function diff(){return Math.min(1,secs/110)}
function spawnItem(){
const d=diff()
const r=Math.random()
let k
if(r<.025+d*.015)k='gold'
else if(r<.12+d*.2)k='rotten'
else k=BAG[Math.floor(Math.random()*BAG.length)]
const rad=(k==='pumpkin'?30:k==='pie'?26:24)*s
items.push({k,x:rad+Math.random()*(w-rad*2),y:-rad,vy:(210+d*300)*(.85+Math.random()*.3)*s,rad,rot:Math.random()*6,vr:(Math.random()-.5)*3,ph:Math.random()*6,gone:false})
}
function mult(){return Math.min(5,1+Math.floor(combo/5))*(feast>0?2:1)}
function catchItem(it){
it.gone=true
const x=it.x,y=py()
if(it.k==='rotten'){
lives--
combo=0
hurt=.5
if(!red())shake=14
flash=.4
tone(160,.4,'sawtooth',.2,60)
tone(90,.3,'square',.12,40,.05)
spawnP(lite()?8:18,x,y,['#6e8a2e','#3f5a1a','#8a7a3a'],200,100)
pop('Rotten',x,y-30*s,'#b9d65a',true)
if(lives<=0){st="dying";doneT=0}
return
}
combo++
maxCombo=Math.max(maxCombo,combo)
squash=1
if(it.k==='gold'){
feast=7
const add=50*mult()
score+=add
tone(784,.5,'sine',.25)
tone(1175,.6,'triangle',.15,0,.06)
tone(1568,.7,'sine',.1,0,.12)
spawnP(lite()?16:40,x,y,['#ffe27a','#fff6c8','#ffb347'],320,160)
pop('Feast +'+add,x,y-40*s,'#ffe27a',true)
flash=.35
return
}
const add=KINDS[it.k].v*mult()
score+=add
const f=SC[Math.min(Math.floor(combo/3),SC.length-1)]
tone(f,.22,'triangle',.22)
tone(f*2,.16,'sine',.08,0,.02)
spawnP(lite()?5:12,x,y,['#ffd28f','#e8913a','#fff1b5'],170,90)
pop('+'+add,x,y-30*s,mult()>1?'#ffe27a':'#fff3de',false)
if(combo%5===0){
pop('Combo x'+combo,x,y-70*s,'#ffcf6a',true)
tone(f*1.5,.4,'sine',.2,0,.1)
}
}

function update(dt){
t+=dt
if(st==='play')secs+=dt
shake*=Math.max(0,1-dt*9)
flash*=Math.max(0,1-dt*4)
hurt=Math.max(0,hurt-dt)
squash*=Math.max(0,1-dt*9)
if(feast>0)feast=Math.max(0,feast-dt)
if(keyDir)tx=Math.max(0,Math.min(w,tx+keyDir*(st==='play'||st==='ready'?900*s:0)*dt))
const old=px
px+=(tx-px)*Math.min(1,dt*16)
pvx=(px-old)/Math.max(dt,.001)
if(st==='play'){
spawnT-=dt
if(spawnT<=0){
spawnItem()
const d=diff()
spawnT=(1.0-d*.66)*(.75+Math.random()*.5)
}
}
const yy=py()
for(const it of items){
if(it.gone)continue
it.rot+=it.vr*dt
it.ph+=dt*4
const py0=it.y
it.y+=it.vy*dt
if(st==='play'&&it.y>=yy-it.rad*.3&&py0<yy+it.rad&&Math.abs(it.x-px)<=pw()/2-4*s+it.rad*.25&&it.y<yy+ph()*.5){
catchItem(it)
continue
}
if(it.y>hh-26*s){
it.gone=true
if(st==='play'&&it.k!=='rotten'&&it.k!=='gold'){
combo=0
tone(200,.2,'sine',.1,120)
}
spawnP(lite()?3:7,it.x,hh-26*s,it.k==='rotten'?['#6e8a2e','#3f5a1a']:['#d9742a','#8f5d36'],110,60)
}
}
items=items.filter(i=>!i.gone)
if(st==='dying'){
doneT+=dt
if(doneT>.9)showOver()
}
for(const p of parts){
p.life+=dt
p.vy+=620*dt
p.x+=p.vx*dt
p.y+=p.vy*dt
}
parts=parts.filter(p=>p.life<p.max)
for(const p of pops){
p.life+=dt
p.y-=44*dt*s
}
pops=pops.filter(p=>p.life<p.max)
for(const l of leaves){
l.y+=l.vy*l.z*dt
l.sw+=dt*1.6
l.x+=Math.sin(l.sw)*30*dt+10*dt
l.r+=l.vr*dt
if(l.y>hh+10){l.y=-10;l.x=Math.random()*w}
if(l.x>w+10)l.x=-10
}
}
function fruit(k,r,ph0){
switch(k){
case'apple':
case'gold':
case'rotten':{
const col=k==='gold'?['#fff1a8','#f2b52a','#a8710d']:k==='rotten'?['#a9b45a','#6b7a2c','#3a4416']:['#ff7a6a','#d02f2a','#7a1512']
const gr=g.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.1)
gr.addColorStop(0,col[0]);gr.addColorStop(.5,col[1]);gr.addColorStop(1,col[2])
g.fillStyle=gr
g.beginPath()
g.moveTo(0,-r*.75)
g.bezierCurveTo(r*.35,-r*1.05,r*1.1,-r*.7,r*.95,r*.1)
g.bezierCurveTo(r*.8,r*.8,r*.35,r*1.0,0,r*.85)
g.bezierCurveTo(-r*.35,r*1.0,-r*.8,r*.8,-r*.95,r*.1)
g.bezierCurveTo(-r*1.1,-r*.7,-r*.35,-r*1.05,0,-r*.75)
g.fill()
g.strokeStyle='#4a2a14';g.lineWidth=2.5*s;g.lineCap='round'
g.beginPath();g.moveTo(0,-r*.7);g.quadraticCurveTo(r*.1,-r*1.1,r*.25,-r*1.25);g.stroke()
g.fillStyle=k==='rotten'?'#5a6a22':'#5aa03a'
g.beginPath();g.ellipse(r*.4,-r*1.0,r*.33,r*.16,-.5,0,Math.PI*2);g.fill()
g.fillStyle='rgba(255,255,255,.4)'
g.beginPath();g.ellipse(-r*.4,-r*.2,r*.14,r*.28,.4,0,Math.PI*2);g.fill()
if(k==='rotten'){
g.fillStyle='rgba(40,28,10,.65)'
g.beginPath();g.arc(r*.3,r*.25,r*.22,0,Math.PI*2);g.arc(-r*.25,r*.5,r*.14,0,Math.PI*2);g.fill()
g.strokeStyle='rgba(150,190,60,.8)';g.lineWidth=2*s
for(let i=-1;i<=1;i++){
g.beginPath()
g.moveTo(i*r*.5,-r*1.2)
g.quadraticCurveTo(i*r*.5+Math.sin(ph0+i)*r*.3,-r*1.5,i*r*.5,-r*1.8)
g.stroke()
}
}
if(k==='gold'){
g.fillStyle='#fff'
for(let i=0;i<4;i++){
const a=ph0*.6+i*Math.PI/2
g.globalAlpha=.5+.5*Math.sin(ph0+i)
g.beginPath()
g.arc(Math.cos(a)*r*1.3,Math.sin(a)*r*1.3,2.5*s,0,Math.PI*2)
g.fill()
}
g.globalAlpha=1
}
break
}
case'pumpkin':{
const gr=g.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r*1.2)
gr.addColorStop(0,'#ffb258');gr.addColorStop(.6,'#e8731c');gr.addColorStop(1,'#8f3a0c')
g.fillStyle=gr
for(const o of[-.55,.55,0]){
g.beginPath()
g.ellipse(o*r,0,r*(o===0?.7:.55),r*.88,0,0,Math.PI*2)
g.fill()
g.strokeStyle='rgba(90,30,6,.45)';g.lineWidth=1.5*s;g.stroke()
}
g.fillStyle='#5a7a2a'
g.beginPath();g.roundRect(-r*.1,-r*1.15,r*.22,r*.4,3*s);g.fill()
break
}
case'corn':{
g.fillStyle='#6fa83c'
g.beginPath();g.ellipse(-r*.35,r*.1,r*.4,r*1.15,.25,0,Math.PI*2);g.fill()
g.beginPath();g.ellipse(r*.35,r*.1,r*.4,r*1.15,-.25,0,Math.PI*2);g.fill()
const gr=g.createLinearGradient(0,-r,0,r)
gr.addColorStop(0,'#ffe36a');gr.addColorStop(1,'#e0a21a')
g.fillStyle=gr
g.beginPath();g.ellipse(0,-r*.1,r*.42,r*1.05,0,0,Math.PI*2);g.fill()
g.fillStyle='rgba(160,100,10,.5)'
for(let y=-r*.8;y<r*.8;y+=r*.28)for(let x=-r*.25;x<=r*.3;x+=r*.25){
g.beginPath();g.arc(x,y,r*.07,0,Math.PI*2);g.fill()
}
break
}
case'pie':{
g.fillStyle='#d9a051'
g.beginPath();g.moveTo(-r*1.1,r*.7);g.lineTo(r*1.1,r*.7);g.lineTo(0,-r*.9);g.closePath();g.fill()
g.fillStyle='#e8913a'
g.beginPath();g.moveTo(-r*.8,r*.5);g.lineTo(r*.8,r*.5);g.lineTo(0,-r*.5);g.closePath();g.fill()
g.strokeStyle='#8f5a1c';g.lineWidth=2*s;g.stroke()
g.fillStyle='#fff6e0'
g.beginPath();g.arc(0,-r*.55,r*.2,0,Math.PI*2);g.fill()
break
}
default:{
const gr=g.createRadialGradient(-r*.2,r*.1,r*.1,0,0,r)
gr.addColorStop(0,'#c58a4a');gr.addColorStop(1,'#6b3f1a')
g.fillStyle=gr
g.beginPath();g.ellipse(0,r*.25,r*.65,r*.85,0,0,Math.PI*2);g.fill()
g.fillStyle='#8a5a2c'
g.beginPath();g.ellipse(0,-r*.4,r*.78,r*.42,0,Math.PI,Math.PI*2);g.fill()
g.fillStyle='#4a2a12'
g.fillRect(-r*.08,-r*.95,r*.16,r*.3)
}
}
}
function horn(){
const W=pw(),H=ph()
const y=py()
g.save()
g.translate(px,y)
g.rotate(Math.max(-.2,Math.min(.2,pvx/4000)))
g.scale(1+squash*.1,1-squash*.12)
g.fillStyle='#2a140a'
g.beginPath()
g.ellipse(0,0,W/2,12*s,0,0,Math.PI*2)
g.fill()
const cols=['#e8913a','#d9484a','#ffd24a','#8f5d36']
for(let i=0;i<6;i++){
g.save()
g.translate((i-2.5)*W*.14,-8*s-Math.abs(Math.sin(i*1.9))*8*s)
fruit(i%3===0?'apple':i%3===1?'pumpkin':'pie',16*s,0)
g.restore()
}
const bg2=g.createLinearGradient(-W/2,0,W/2,H)
bg2.addColorStop(0,'#c98c4a')
bg2.addColorStop(.5,'#a46a2e')
bg2.addColorStop(1,'#5e3414')
g.fillStyle=bg2
g.beginPath()
g.moveTo(-W/2,0)
g.bezierCurveTo(-W/2,H*.95,W/2,H*.95,W/2,0)
g.quadraticCurveTo(0,14*s,-W/2,0)
g.fill()
g.save()
g.clip()
g.strokeStyle='rgba(60,28,8,.4)'
g.lineWidth=2*s
for(let k=-W;k<W;k+=14*s){
g.beginPath();g.moveTo(k,0);g.lineTo(k+H*.9,H);g.stroke()
g.beginPath();g.moveTo(k+H*.9,0);g.lineTo(k,H);g.stroke()
}
g.restore()
g.strokeStyle='#e8c07a'
g.lineWidth=5*s
g.lineCap='round'
g.beginPath()
g.moveTo(-W/2,0)
g.quadraticCurveTo(0,14*s,W/2,0)
g.stroke()
g.strokeStyle='#8a5522'
g.lineWidth=7*s
g.beginPath()
g.moveTo(W/2-4*s,H*.35)
g.bezierCurveTo(W/2+34*s,H*.3,W/2+38*s,-H*.1,W/2+16*s,-H*.25)
g.stroke()
if(feast>0){
g.strokeStyle='rgba(255,226,122,'+(.5+.4*Math.sin(t*10))+')'
g.lineWidth=4*s
g.beginPath()
g.ellipse(0,0,W/2+8*s,18*s,0,0,Math.PI*2)
g.stroke()
}
g.restore()
}
function bg(){
g.setTransform(dpr,0,0,dpr,0,0)
const sk=g.createLinearGradient(0,0,0,hh)
sk.addColorStop(0,'#2a1634')
sk.addColorStop(.5,'#b04a3a')
sk.addColorStop(1,'#ffc97a')
g.fillStyle=sk
g.fillRect(0,0,w,hh)
const sx=w*.3,sy=hh*.34
const sg=g.createRadialGradient(sx,sy,0,sx,sy,hh*.34)
sg.addColorStop(0,'rgba(255,236,170,.95)')
sg.addColorStop(.2,'rgba(255,200,110,.55)')
sg.addColorStop(1,'rgba(255,170,80,0)')
g.fillStyle=sg
g.fillRect(0,0,w,hh)
const off=(px-w/2)/w
const cols=['#6b2f48','#4b2438','#2f1828']
for(let k=0;k<3;k++){
const base=hh*(.58+.09*k)
const sh=-off*(30+k*50)*s
g.fillStyle=cols[k]
g.beginPath()
g.moveTo(0,hh+40)
for(let x=0;x<=w+16;x+=16)g.lineTo(x,base-(Math.sin((x-sh)*.006+k*2.1)*34+Math.sin((x-sh)*.015+k)*14)*s*1.2)
g.lineTo(w,hh+40)
g.fill()
}
const tc=['#d9742a','#b3402a','#e4a63a']
const sp=150*s
const sh2=-off*90*s
for(let i=-1;i<w/sp+2;i++){
const x=i*sp+((sh2%sp)+sp)%sp
const by=hh*.77
g.fillStyle='#2a1420'
g.fillRect(x-4*s,by-60*s,8*s,60*s)
for(let c=0;c<3;c++){
g.fillStyle=tc[(i+c+300)%3]
g.globalAlpha=.9
g.beginPath()
g.ellipse(x+(c-1)*18*s,by-72*s-(c===1?18*s:0),30*s,24*s,0,0,Math.PI*2)
g.fill()
}
g.globalAlpha=1
}
const gd=g.createLinearGradient(0,hh-60*s,0,hh)
gd.addColorStop(0,'#5a3a1c')
gd.addColorStop(1,'#26140a')
g.fillStyle=gd
g.fillRect(0,hh-40*s,w,40*s)
g.fillStyle='#8a5a2a'
g.fillRect(0,hh-40*s,w,4*s)
}
function draw(){
bg()
g.setTransform(dpr,0,0,dpr,0,0)
for(const l of leaves){
g.save()
g.translate(l.x,l.y)
g.rotate(l.r)
g.fillStyle=l.c
g.globalAlpha=.8
g.beginPath()
g.ellipse(0,0,6*l.z,3*l.z,0,0,Math.PI*2)
g.fill()
g.restore()
}
const ox=(Math.random()-.5)*shake*dpr,oy=(Math.random()-.5)*shake*dpr
g.setTransform(dpr,0,0,dpr,ox,oy)
for(const it of items){
if(it.k==='gold'){
const r=it.rad*2.4
const gg=g.createRadialGradient(it.x,it.y,0,it.x,it.y,r)
gg.addColorStop(0,'rgba(255,226,122,.7)')
gg.addColorStop(1,'rgba(255,200,80,0)')
g.fillStyle=gg
g.fillRect(it.x-r,it.y-r,r*2,r*2)
}
g.save()
g.translate(it.x,it.y)
g.rotate(Math.sin(it.rot)*.35)
g.fillStyle='rgba(0,0,0,.0)'
fruit(it.k,it.rad,it.ph)
g.restore()
}
horn()
for(const p of parts){
g.globalAlpha=1-p.life/p.max
g.fillStyle=p.c
g.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz)
}
g.globalAlpha=1
g.textAlign='center'
for(const p of pops){
const k=p.life/p.max
g.globalAlpha=k<.7?1:1-(k-.7)/.3
g.font='bold '+Math.round((p.big?30:22)*Math.max(.8,s))+'px Georgia,serif'
g.lineWidth=5
g.strokeStyle='rgba(40,12,4,.85)'
g.strokeText(p.txt,p.x,p.y)
g.fillStyle=p.c
g.fillText(p.txt,p.x,p.y)
}
g.globalAlpha=1
g.setTransform(dpr,0,0,dpr,0,0)
if(flash>.01){
g.fillStyle=hurt>0?'rgba(190,40,30,'+flash*.5+')':'rgba(255,236,170,'+flash*.5+')'
g.fillRect(0,0,w,hh)
}
const vg=g.createRadialGradient(w/2,hh/2,hh*.35,w/2,hh/2,hh*.85)
vg.addColorStop(0,'rgba(0,0,0,0)')
vg.addColorStop(1,'rgba(10,2,0,.5)')
g.fillStyle=vg
g.fillRect(0,0,w,hh)
g.textAlign='center'
const fs=Math.round(52*Math.max(.7,s))
g.font='bold '+fs+'px Georgia,serif'
g.lineWidth=7
g.strokeStyle='rgba(40,12,4,.8)'
g.strokeText(score,w/2,Math.round(hh*.11))
g.fillStyle='#fff3de'
g.fillText(score,w/2,Math.round(hh*.11))
g.font='16px Georgia,serif'
g.fillStyle='rgba(255,236,200,.85)'
g.fillText('Best '+best+(combo>1?'   Combo x'+combo+'   Score x'+mult():''),w/2,Math.round(hh*.11)+26)
for(let i=0;i<3;i++){
g.save()
g.translate(26+i*30,34)
g.globalAlpha=i<lives?1:.25
fruit('apple',11,0)
g.restore()
}
if(feast>0){
g.fillStyle='rgba(0,0,0,.4)'
g.fillRect(w/2-80,Math.round(hh*.11)+38,160,8)
g.fillStyle='#ffe27a'
g.fillRect(w/2-80,Math.round(hh*.11)+38,160*feast/7,8)
}
if(st==='ready'){
g.globalAlpha=.7+.3*Math.sin(t*4)
g.font='bold 24px Georgia,serif'
g.lineWidth=5
g.strokeStyle='rgba(40,12,4,.85)'
const m='Move to catch the harvest. Avoid the rotten.'
g.strokeText(m,w/2,hh*.35)
g.fillStyle='#fff3de'
g.fillText(m,w/2,hh*.35)
g.globalAlpha=1
}
}
function showOver(){
st='over'
if(score>best){
best=score
try{localStorage.setItem(KEY,String(best))}catch{}
}
const title=h('h2',null,'The basket is spoiled')
sty(title,{margin:'0','font-size':'30px'})
const sc=h('div',null,String(score))
sty(sc,{'font-size':'72px','font-weight':'bold','line-height':'1',color:'#ffe27a'})
const info=h('div',null,'Best '+best+'   Longest combo x'+maxCombo)
sty(info,{opacity:'.85'})
const pr=h('div',null,secs<15?'Play 15 seconds or more to earn Pars':'Saving score')
sty(pr,{color:'#ffd9a0','font-size':'18px','min-height':'24px'})
const again=h('button',{class:'btn',type:'button'},'Play again')
const quit=h('button',{class:'btn sm',type:'button'},'Close')
again.addEventListener('click',reset)
quit.addEventListener('click',()=>api.close())
const row=h('div',null,again,quit)
sty(row,{display:'flex',gap:'10px','margin-top':'8px'})
ov=h('div',{class:'tk-go'},title,sc,info,pr,row)
sty(ov,{position:'absolute',inset:'0',display:'flex','flex-direction':'column','align-items':'center','justify-content':'center',gap:'12px',background:'rgba(18,8,4,.72)','backdrop-filter':'blur(4px)',color:'#fff3de','font-family':'Georgia,serif','text-align':'center'})
host.append(ov)
api.finish(score,secs).then(d=>{
if(dead||!d)return
if(secs>=15)pr.textContent=d.pars>0?'+'+d.pars+' Pars':'No Pars this run'
})
}
function begin(){
au()
if(st==='ready')st='play'
}
const onMove=e=>{
const r=cv.getBoundingClientRect()
tx=Math.max(0,Math.min(w,e.clientX-r.left))
if(e.pointerType!=='mouse')begin()
}
const onDown=e=>{
onMove(e)
begin()
}
const onKey=e=>{
if(ov)return
if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){keyDir=-1;begin();e.preventDefault()}
else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){keyDir=1;begin();e.preventDefault()}
else if(e.key==='m'||e.key==='M')mute=!mute
}
const onUp=e=>{
if((e.key==='ArrowLeft'||e.key==='a'||e.key==='A')&&keyDir<0)keyDir=0
if((e.key==='ArrowRight'||e.key==='d'||e.key==='D')&&keyDir>0)keyDir=0
}
function frame(now){
if(dead)return
raf=requestAnimationFrame(frame)
const dt=Math.min(.05,(now-last)/1000||0)
last=now
update(dt)
draw()
}
fit()
reset()
const ro=new ResizeObserver(fit)
ro.observe(host)
addEventListener('keydown',onKey)
addEventListener('keyup',onUp)
cv.addEventListener('pointermove',onMove)
cv.addEventListener('pointerdown',onDown)
raf=requestAnimationFrame(t0=>{last=t0;frame(t0)})
return()=>{
dead=true
cancelAnimationFrame(raf)
ro.disconnect()
removeEventListener('keydown',onKey)
removeEventListener('keyup',onUp)
cv.removeEventListener('pointermove',onMove)
cv.removeEventListener('pointerdown',onDown)
if(ac){try{ac.close()}catch{}}
cv.remove()
if(ov)ov.remove()
}
}
