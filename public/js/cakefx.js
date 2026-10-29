const rnd=(a,b)=>a+Math.random()*(b-a)
function cakePath(c,x,y,s,rot,t){
c.save()
c.translate(x,y)
c.rotate(rot)
c.scale(s,s)
c.lineJoin='round'
c.lineWidth=2.4
c.strokeStyle='#1b1030'
c.fillStyle='#e5e7eb'
c.beginPath()
c.ellipse(0,19,34,6,0,0,Math.PI*2)
c.fill()
c.stroke()
c.fillStyle='#231a17'
c.beginPath()
c.roundRect(-27,6,54,13,4)
c.fill()
c.stroke()
c.fillStyle='#fff'
c.fillRect(-26,10,52,4)
c.fillStyle='#f6e7c8'
c.beginPath()
c.roundRect(-27,-8,54,16,4)
c.fill()
c.stroke()
c.fillStyle='#2a201c'
for(const p of[[-18,-3],[-6,2],[8,-4],[19,1],[0,-6]]){c.beginPath();c.arc(p[0],p[1],2.4,0,Math.PI*2);c.fill()}
c.fillStyle='#fff'
c.beginPath()
c.roundRect(-24,-17,48,10,5)
c.fill()
c.stroke()
c.beginPath()
c.moveTo(-14,-17)
c.quadraticCurveTo(-8,-30,0,-26)
c.quadraticCurveTo(10,-34,14,-17)
c.closePath()
c.fill()
c.stroke()
c.fillStyle='#231a17'
c.beginPath()
c.roundRect(-9,-24,8,5,2)
c.fill()
c.beginPath()
c.roundRect(3,-23,8,5,2)
c.fill()
c.fillStyle='#dc2626'
c.beginPath()
c.arc(0,-31,4.2,0,Math.PI*2)
c.fill()
c.stroke()
c.restore()
}
export function throwCake(host){
const r=host.getBoundingClientRect()
if(r.width<8)return
const dpr=Math.min(2,devicePixelRatio||1)
const W=innerWidth,H=innerHeight
const cv=document.createElement('canvas')
cv.width=W*dpr
cv.height=H*dpr
cv.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483000;pointer-events:none'
document.body.append(cv)
const c=cv.getContext('2d')
c.scale(dpr,dpr)
const cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2
const fromLeft=cx>W/2
const sx=fromLeft?cx-Math.min(cx,520):cx+Math.min(W-cx,520),sy=cy-Math.min(cy,260)
const floor=cy+R*1.9+30
const FL=0.62
let parts=[],blobs=[],drips=[],puddles=[],ring=null,hit=false,t0=performance.now(),last=t0
const sc=Math.max(0.8,R/26)
function splat(){
hit=true
ring={r:R*.4,a:.9}
host.animate([{transform:'none'},{transform:'scale(.82,1.1)'},{transform:'scale(1.12,.92)'},{transform:'none'}],{duration:420})
for(let i=0;i<70;i++){
const a=rnd(0,Math.PI*2),sp=rnd(120,620)
parts.push({k:'c',x:cx+Math.cos(a)*R*.3,y:cy+Math.sin(a)*R*.3,vx:Math.cos(a)*sp+(fromLeft?-1:1)*-80,vy:Math.sin(a)*sp-rnd(80,260),r:rnd(2.5,9)*Math.max(.7,sc*.7),life:rnd(1.6,2.6),age:0})
}
for(let i=0;i<46;i++){
const a=rnd(0,Math.PI*2),sp=rnd(160,560)
parts.push({k:'o',x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-rnd(120,300),r:rnd(1.8,4.6)*Math.max(.7,sc*.7),rot:rnd(0,6),vr:rnd(-14,14),life:rnd(1.8,2.8),age:0,b:0})
}
for(let i=0;i<10;i++){
const a=rnd(0,Math.PI*2),sp=rnd(200,500)
parts.push({k:'s',x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-200,r:rnd(1.5,2.6),col:['#f472b6','#fbbf24','#38bdf8','#34d399'][i%4],life:2,age:0})
}
blobs.push({x:0,y:0,r:R*.52,c:'#fffaf0'})
for(let i=0;i<22;i++){
const a=rnd(0,Math.PI*2),d=rnd(.1,.85)*R
blobs.push({x:Math.cos(a)*d,y:Math.sin(a)*d,r:rnd(.1,.32)*R,c:Math.random()<.2?'#f6e7c8':'#fffaf0'})
}
for(let i=0;i<14;i++){
const a=rnd(0,Math.PI*2),d=rnd(.1,.9)*R
blobs.push({x:Math.cos(a)*d,y:Math.sin(a)*d,r:rnd(.04,.1)*R,c:'#231a17'})
}
for(let i=0;i<7;i++){
const bx=rnd(-.7,.7)*R
drips.push({x:cx+bx,y:cy+Math.sqrt(Math.max(0,R*R-bx*bx))*rnd(.2,.95),len:0,max:rnd(.5,1.5)*R,sp:rnd(18,44),w:rnd(.1,.2)*R})
}
}
function frame(now){
const dt=Math.min(.033,(now-last)/1000)
last=now
const T=(now-t0)/1000
c.clearRect(0,0,W,H)
if(!hit){
const p=Math.min(1,T/FL)
const e=p*p*(3-2*p)*.35+p*.65
const x=sx+(cx-sx)*e,y=sy+(cy-sy)*e-Math.sin(Math.PI*p)*R*1.6
cakePath(c,x,y,sc*(.6+.55*p),-.8+p*Math.PI*5,p)
c.strokeStyle='rgba(255,255,255,.35)'
c.lineWidth=2
c.beginPath()
for(let i=1;i<6;i++){
const q=Math.max(0,p-i*.05),eq=q*q*(3-2*q)*.35+q*.65
c.lineTo(sx+(cx-sx)*eq,sy+(cy-sy)*eq-Math.sin(Math.PI*q)*R*1.6)
}
c.stroke()
if(p>=1)splat()
}else{
const A=T-FL
if(ring){
ring.r+=dt*R*7
ring.a-=dt*2.4
if(ring.a>0){c.strokeStyle='rgba(255,255,255,'+ring.a+')';c.lineWidth=5*ring.a;c.beginPath();c.arc(cx,cy,ring.r,0,Math.PI*2);c.stroke()}
}
c.save()
c.beginPath()
c.arc(cx,cy,R,0,Math.PI*2)
c.clip()
const fade=A>4.6?Math.max(0,1-(A-4.6)/1.4):1
c.globalAlpha=fade
for(const b of blobs){
c.fillStyle=b.c
c.beginPath()
c.arc(cx+b.x,cy+b.y,b.r*Math.min(1,A*9+.2),0,Math.PI*2)
c.fill()
}
c.restore()
c.globalAlpha=fade
for(const d of drips){
d.len=Math.min(d.max,d.len+d.sp*dt*(1-d.len/d.max*.6))
c.fillStyle='#fffaf0'
c.strokeStyle='rgba(0,0,0,.18)'
c.lineWidth=1
c.beginPath()
c.roundRect(d.x-d.w/2,d.y,d.w,d.len,d.w/2)
c.fill()
c.stroke()
c.beginPath()
c.arc(d.x,d.y+d.len,d.w*.75,0,Math.PI*2)
c.fill()
}
for(const q of puddles){
q.a=Math.max(0,q.a-dt*.35)
c.fillStyle='rgba(255,250,240,'+q.a+')'
c.beginPath()
c.ellipse(q.x,floor,q.r*Math.min(1,q.age*8+.3),q.r*.28,0,0,Math.PI*2)
c.fill()
q.age+=dt
}
c.globalAlpha=1
for(let i=parts.length-1;i>=0;i--){
const q=parts[i]
q.age+=dt
q.vy+=1500*dt
q.vx*=1-1.1*dt
q.x+=q.vx*dt
q.y+=q.vy*dt
if(q.y>floor&&q.vy>0){
if(q.k==='c'){
puddles.push({x:q.x,r:q.r*1.8,a:.85,age:0})
if(q.r>4)for(let j=0;j<2;j++)parts.push({k:'c',x:q.x,y:floor-2,vx:rnd(-160,160),vy:-Math.abs(q.vy)*rnd(.18,.4),r:q.r*.4,life:1,age:0,d:1})
parts.splice(i,1)
continue
}
q.y=floor
q.vy*=-.42
q.vx*=.7
q.b++
}
if(q.age>q.life||q.b>3||q.x<-50||q.x>W+50){parts.splice(i,1);continue}
const al=Math.min(1,(q.life-q.age)*2)
c.globalAlpha=al
if(q.k==='c'){
const sp=Math.hypot(q.vx,q.vy)
c.save()
c.translate(q.x,q.y)
c.rotate(Math.atan2(q.vy,q.vx))
c.fillStyle='#fffaf0'
c.strokeStyle='rgba(0,0,0,.2)'
c.lineWidth=1
c.beginPath()
c.ellipse(0,0,q.r*(1+sp/650),q.r/(1+sp/1500),0,0,Math.PI*2)
c.fill()
c.stroke()
c.restore()
}else if(q.k==='o'){
q.rot+=q.vr*dt
c.save()
c.translate(q.x,q.y)
c.rotate(q.rot)
c.fillStyle='#231a17'
c.fillRect(-q.r,-q.r*.7,q.r*2,q.r*1.4)
c.restore()
}else{
c.fillStyle=q.col
c.fillRect(q.x-q.r,q.y-q.r,q.r*2,q.r*2)
}
}
c.globalAlpha=1
}
if(T<FL+6.2)requestAnimationFrame(frame)
else cv.remove()
}
requestAnimationFrame(frame)
}
