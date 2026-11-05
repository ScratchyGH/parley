import{h}from'./util.js'
const sty=(e,o)=>{for(const k in o)e.style.setProperty(k,o[k])}
const PAL=[['#e8913a','#a8561a','#ffd28f'],['#c9473b','#86261f','#f4a794'],['#8f5d36','#563219','#dcab72'],['#d9a441','#9a6b17','#fff1b5'],['#86456f','#4b2142','#d9a3cb']]
const NOTES=[523,587,659,784,880,1047,1175]
export default function launch(host,api){
const LH=36,W0=210,KEY='tk_best_stack'
const cv=document.createElement('canvas')
sty(cv,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block'})
host.append(cv)
const g=cv.getContext('2d')
let w=1,hh=1,dpr=1,s=1,range=220
let st='ready',t=0,secs=0,score=0,chain=0,maxChain=0,cam=0,camT=0,shake=0,flash=0,doneT=0
let layers=[],cur=null,parts=[],debris=[],pops=[],leaves=[],stars=[]
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
function thud(v){
tone(110,.16,'sine',.45*v,42)
tone(70,.12,'triangle',.3*v,35)
}
function chime(c){
const f=NOTES[Math.min(c-1,NOTES.length-1)]
tone(f,.35,'sine',.22)
tone(f*2,.3,'triangle',.1,0,.03)
tone(f*1.5,.4,'sine',.08,0,.06)
}
function fit(){
w=host.clientWidth||innerWidth
hh=host.clientHeight||innerHeight
dpr=Math.min(devicePixelRatio||1,2)
cv.width=Math.round(w*dpr)
cv.height=Math.round(hh*dpr)
s=Math.max(.35,Math.min(w/520,hh/800))
range=Math.max(110,Math.min(300,w/(2*s)-W0/2+30))
const n=red()?5:lite()?9:20
leaves=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*hh,r:Math.random()*6,vr:(Math.random()-.5)*3,vy:22+Math.random()*34,sw:Math.random()*6,c:['#d9742a','#b3402a','#e4a63a','#8f5d36'][Math.floor(Math.random()*4)],z:.6+Math.random()*.8}))
stars=Array.from({length:30},()=>({x:Math.random()*w,y:Math.random()*hh*.35,p:Math.random()*6}))
}
function mk(){
const top=layers[layers.length-1]
return{x:cur&&cur.dir>0?range:-range,dir:cur&&cur.dir>0?-1:1,w:top.w,y:-(top.i+1)*LH-5*LH,vy:0,drop:false,p:(top.i+1)%PAL.length,hide:false}
}
function reset(){
layers=[{x:0,w:W0,i:0,p:0,sq:0}]
parts=[];debris=[];pops=[]
score=0;chain=0;maxChain=0;cam=0;camT=0;secs=0;shake=0;flash=0;t=0
cur=null
cur=mk()
cur.x=-range
st='ready'
if(ov){ov.remove();ov=null}
}
function spawn(n,x,y,cols,sp,up){
const cap=lite()?60:240
for(let i=0;i<n&&parts.length<cap;i++){
const a=Math.random()*Math.PI*2,v=sp*(.3+Math.random())
parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-up,life:0,max:.5+Math.random()*.6,c:cols[i%cols.length],sz:2+Math.random()*4})
}
}
function pop(txt,x,y,c,big){
pops.push({x,y,txt,c,life:0,max:big?1.3:.9,big})
}
function speedNow(){return 190+Math.min(layers.length,40)*8.5}
function land(){
const top=layers[layers.length-1]
const dx=cur.x-top.x
const cl=cur.x-cur.w/2,cr=cur.x+cur.w/2,tl=top.x-top.w/2,tr=top.x+top.w/2
const l=Math.max(cl,tl),r=Math.min(cr,tr),ow=r-l
const y=cur.y
if(ow<8){
debris.push({x:cur.x,y,w:cur.w,vx:cur.dir*70,vy:-140,rot:0,vr:cur.dir*1.6,p:cur.p})
cur.hide=true
thud(1)
tone(240,.6,'sawtooth',.16,50)
if(!red())shake=16
chain=0
st='dying';doneT=0
return
}
let nx,nw,perf=false
if(Math.abs(dx)<=7){
perf=true
nx=top.x
nw=Math.min(W0,cur.w+(chain>=2?9:0))
chain++
}else{
chain=0
nx=(l+r)/2
nw=ow
if(cl<tl)debris.push({x:(cl+tl)/2,y,w:tl-cl,vx:-50,vy:-60,rot:0,vr:-1.8,p:cur.p})
if(cr>tr)debris.push({x:(cr+tr)/2,y,w:cr-tr,vx:50,vy:-60,rot:0,vr:1.8,p:cur.p})
}
maxChain=Math.max(maxChain,chain)
const L={x:nx,w:nw,i:top.i+1,p:cur.p,sq:1}
layers.push(L)
let add=10
if(perf){
add+=chain*8
if(chain%5===0){add+=50;pop('Feast bonus +50',nx,y-LH*2,'#ffe27a',true)}
chime(chain)
spawn(lite()?10:26,nx,y-LH/2,['#ffe27a','#fff6c8','#ffb347'],240,120)
pops.push({x:nx,y:y-LH/2,life:0,max:.55,ring:true,c:'#ffe27a'})
pop(chain>1?'Perfect x'+chain:'Perfect',nx,y-LH*1.6,'#fff2b8',chain>1)
if(!red())flash=.35
}else{
thud(.7)
spawn(lite()?5:12,nx,y,['#ffd28f','#e8913a','#a8561a'],150,80)
}
score+=add
if(!red())shake=Math.max(shake,perf?5:8)
camT=Math.max(0,(L.i-2)*LH)
cur=mk()
}
function update(dt){
t+=dt
if(st==='play')secs+=dt
cam+=(camT-cam)*Math.min(1,dt*5)
shake*=Math.max(0,1-dt*9)
flash*=Math.max(0,1-dt*5)
for(const l of layers)l.sq*=Math.max(0,1-dt*8)
if(cur&&!cur.hide&&(st==='play'||st==='ready')){
if(!cur.drop){
cur.x+=cur.dir*speedNow()*dt*(st==='ready'?.6:1)
if(cur.x>range){cur.x=range;cur.dir=-1}
if(cur.x<-range){cur.x=-range;cur.dir=1}
}else{
const top=layers[layers.length-1]
const ty=-(top.i+1)*LH
cur.vy+=4400*dt
cur.y+=cur.vy*dt
if(cur.y>=ty){cur.y=ty;land()}
}
}
if(st==='dying'){
doneT+=dt
if(doneT>1)showOver()
}
for(const d of debris){
d.vy+=1500*dt
d.x+=d.vx*dt
d.y+=d.vy*dt
d.rot+=d.vr*dt
}
debris=debris.filter(d=>d.y<cam+1400)
for(const p of parts){
p.life+=dt
p.vy+=520*dt
p.x+=p.vx*dt
p.y+=p.vy*dt
}
parts=parts.filter(p=>p.life<p.max)
for(const p of pops){
p.life+=dt
if(!p.ring)p.y-=40*dt
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
function sway(hgt){
let com=0
for(const l of layers)com+=l.x
com/=layers.length
const wob=Math.min(.06,Math.abs(com)/900+layers.length*.00028)*(red()?.35:1)
return Math.sin(t*2.1)*wob*hgt
}
function pie(x,y,wd,p,sq,top){
const c=PAL[p%PAL.length]
g.save()
g.translate(x,y)
g.scale(1,1-sq*.22)
g.beginPath()
g.roundRect(-wd/2,-LH,wd,LH,12)
const gr=g.createLinearGradient(0,-LH,0,0)
gr.addColorStop(0,c[2])
gr.addColorStop(.3,c[0])
gr.addColorStop(1,c[1])
g.fillStyle=gr
g.fill()
g.save()
g.clip()
g.fillStyle=c[2]
g.globalAlpha=.75
for(let k=-wd/2;k<wd/2+10;k+=12){
g.beginPath()
g.arc(k+6,-LH+3,6.5,0,Math.PI*2)
g.fill()
}
g.globalAlpha=.4
g.fillStyle=c[1]
for(let k=0;k<wd;k+=17){
g.beginPath()
g.arc(-wd/2+8+k,-LH*.45+Math.sin(k*1.7)*4,2.6,0,Math.PI*2)
g.fill()
}
g.globalAlpha=1
const sh=g.createLinearGradient(-wd/2,0,wd/2,0)
sh.addColorStop(0,'rgba(255,255,255,.22)')
sh.addColorStop(.35,'rgba(255,255,255,0)')
sh.addColorStop(1,'rgba(0,0,0,.25)')
g.fillStyle=sh
g.fillRect(-wd/2,-LH,wd,LH)
g.restore()
g.beginPath()
g.roundRect(-wd/2,-LH,wd,LH,12)
g.strokeStyle='rgba(45,18,6,.6)'
g.lineWidth=2
g.stroke()
if(top&&!red()){
g.strokeStyle='rgba(255,255,255,.35)'
g.lineWidth=3
g.lineCap='round'
for(let k=0;k<3;k++){
const bx=(k-1)*wd*.22
g.beginPath()
g.moveTo(bx,-LH-4)
g.bezierCurveTo(bx+10*Math.sin(t*2+k),-LH-16,bx-10*Math.sin(t*2+k),-LH-26,bx+6*Math.sin(t*3+k),-LH-38)
g.globalAlpha=.35+.2*Math.sin(t*2+k)
g.stroke()
}
g.globalAlpha=1
}
g.restore()
}
function bg(){
g.setTransform(dpr,0,0,dpr,0,0)
const sk=g.createLinearGradient(0,0,0,hh)
sk.addColorStop(0,'#1d0f2b')
sk.addColorStop(.45,'#7a2f35')
sk.addColorStop(.8,'#ef9a4a')
sk.addColorStop(1,'#ffd48a')
g.fillStyle=sk
g.fillRect(0,0,w,hh)
for(const q of stars){
g.globalAlpha=.4+.4*Math.sin(t*2+q.p)
g.fillStyle='#fff4d6'
g.fillRect(q.x,q.y+cam*s*.02,1.6,1.6)
}
g.globalAlpha=1
const sx=w*.74,sy=hh*.3+cam*s*.05
const sg=g.createRadialGradient(sx,sy,0,sx,sy,hh*.3)
sg.addColorStop(0,'rgba(255,230,160,.95)')
sg.addColorStop(.18,'rgba(255,200,110,.6)')
sg.addColorStop(1,'rgba(255,170,80,0)')
g.fillStyle=sg
g.fillRect(0,0,w,hh)
const cols=['#5b2744','#44203a','#2d1630']
for(let k=0;k<3;k++){
const base=hh*(.58+.1*k)+cam*s*(.05+.05*k)
g.fillStyle=cols[k]
g.beginPath()
g.moveTo(0,hh+40)
for(let x=0;x<=w+16;x+=16)g.lineTo(x,base-(Math.sin(x*.006+k*2.1)*34+Math.sin(x*.015+k)*14)*s*1.2)
g.lineTo(w,hh+40)
g.fill()
}
}
function world(){
const ox=(Math.random()-.5)*shake*dpr,oy=(Math.random()-.5)*shake*dpr
g.setTransform(dpr*s,0,0,dpr*s,dpr*w/2+ox,dpr*(hh*.8+cam*s)+oy)
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
world()
const tb=g.createLinearGradient(0,0,0,300)
tb.addColorStop(0,'#7a3b24')
tb.addColorStop(1,'#3a170f')
g.fillStyle=tb
g.fillRect(-3000,0,6000,3000)
g.fillStyle='#e9b25c'
g.fillRect(-3000,0,6000,4)
g.strokeStyle='rgba(0,0,0,.18)'
g.lineWidth=2
for(let k=1;k<8;k++){
g.beginPath()
g.moveTo(-3000,k*42)
g.lineTo(3000,k*42)
g.stroke()
}
g.fillStyle='rgba(0,0,0,.28)'
g.beginPath()
g.ellipse(0,6,W0/2+50,12,0,0,Math.PI*2)
g.fill()
g.fillStyle='#f1e7d1'
g.beginPath()
g.ellipse(0,2,W0/2+34,11,0,0,Math.PI*2)
g.fill()
g.strokeStyle='#c9b78f'
g.lineWidth=2
g.stroke()
for(let i=0;i<layers.length;i++){
const l=layers[i]
pie(l.x+sway(i*LH),-i*LH,l.w,l.p,l.sq,i===layers.length-1&&st!=='dying')
}
if(cur&&!cur.hide)pie(cur.x+(cur.drop?0:0),cur.y,cur.w,cur.p,0,false)
for(const d of debris){
g.save()
g.translate(d.x,d.y-LH/2)
g.rotate(d.rot)
g.translate(0,LH/2)
pie(0,0,d.w,d.p,0,false)
g.restore()
}
for(const p of parts){
g.globalAlpha=1-p.life/p.max
g.fillStyle=p.c
g.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz)
}
g.globalAlpha=1
g.textAlign='center'
for(const p of pops){
const k=p.life/p.max
if(p.ring){
g.strokeStyle=p.c
g.globalAlpha=1-k
g.lineWidth=4*(1-k)+1
g.beginPath()
g.ellipse(p.x,p.y,40+k*130,12+k*30,0,0,Math.PI*2)
g.stroke()
g.globalAlpha=1
continue
}
g.globalAlpha=k<.7?1:1-(k-.7)/.3
g.font='bold '+(p.big?30:24)+'px Georgia,serif'
g.lineWidth=5
g.strokeStyle='rgba(40,12,4,.85)'
g.strokeText(p.txt,p.x,p.y)
g.fillStyle=p.c
g.fillText(p.txt,p.x,p.y)
}
g.globalAlpha=1
g.setTransform(dpr,0,0,dpr,0,0)
if(flash>.01){
g.fillStyle='rgba(255,236,170,'+flash*.5+')'
g.fillRect(0,0,w,hh)
}
const vg=g.createRadialGradient(w/2,hh/2,hh*.35,w/2,hh/2,hh*.85)
vg.addColorStop(0,'rgba(0,0,0,0)')
vg.addColorStop(1,'rgba(10,2,0,.5)')
g.fillStyle=vg
g.fillRect(0,0,w,hh)
g.textAlign='center'
g.font='bold '+Math.round(54*Math.max(.7,s))+'px Georgia,serif'
g.lineWidth=7
g.strokeStyle='rgba(40,12,4,.8)'
g.strokeText(score,w/2,Math.round(hh*.12))
g.fillStyle='#fff3de'
g.fillText(score,w/2,Math.round(hh*.12))
g.font='16px Georgia,serif'
g.fillStyle='rgba(255,236,200,.85)'
g.fillText('Best '+best+(chain>1?'   Chain x'+chain:''),w/2,Math.round(hh*.12)+26)
if(st==='ready'){
g.globalAlpha=.7+.3*Math.sin(t*4)
g.font='bold 24px Georgia,serif'
g.lineWidth=5
g.strokeStyle='rgba(40,12,4,.85)'
g.strokeText('Tap or press Space to drop',w/2,hh*.3)
g.fillStyle='#fff3de'
g.fillText('Tap or press Space to drop',w/2,hh*.3)
g.globalAlpha=1
}
}
function showOver(){
st='over'
if(score>best){
best=score
try{localStorage.setItem(KEY,String(best))}catch{}
}
const title=h('h2',null,'The tower fell')
sty(title,{margin:'0','font-size':'30px'})
const sc=h('div',null,String(score))
sty(sc,{'font-size':'72px','font-weight':'bold','line-height':'1','color':'#ffe27a'})
const info=h('div',null,'Best '+best+'   Tallest chain x'+maxChain+'   Height '+(layers.length-1))
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
function press(){
au()
if(st==='ready'){st='play';return}
if(st==='play'&&cur&&!cur.drop&&!cur.hide){cur.drop=true;cur.vy=260}
}
const onKey=e=>{
if(e.code==='Space'||e.key==='Enter'||e.key==='ArrowDown'){
if(ov)return
e.preventDefault()
if(!e.repeat)press()
}
if(e.key==='m'||e.key==='M')mute=!mute
}
const onDown=e=>{
e.preventDefault()
press()
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
cv.addEventListener('pointerdown',onDown)
raf=requestAnimationFrame(t0=>{last=t0;frame(t0)})
return()=>{
dead=true
cancelAnimationFrame(raf)
ro.disconnect()
removeEventListener('keydown',onKey)
cv.removeEventListener('pointerdown',onDown)
if(ac){try{ac.close()}catch{}}
cv.remove()
if(ov)ov.remove()
}
}
