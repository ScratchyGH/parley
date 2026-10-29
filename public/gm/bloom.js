import{kit,txt,over,best}from'./kit.js'
export function play(box){
let x,it,score,lives,dead,t
const rs=()=>{x=.5;it=[];score=0;lives=5;dead=false;t=0}
rs()
const k=kit(box,(dt,k)=>{
if(dead)return
if(k.keys.arrowleft||k.keys.a)x-=dt*1.1
if(k.keys.arrowright||k.keys.d)x+=dt*1.1
if(k.down)x=k.px/k.W
x=Math.max(.07,Math.min(.93,x))
t-=dt
if(t<=0){t=Math.max(.25,.8-score*.006);it.push({x:Math.random()*.9+.05,y:-.05,k:Math.random()<.22?'bee':'petal',c:['#f9a8d4','#fde68a','#c4b5fd','#fca5a5'][Math.floor(Math.random()*4)]})}
const sp=.3+Math.min(.4,score*.004)
for(const o of it){o.y+=sp*dt;if(o.y>.88&&o.y<.97&&Math.abs(o.x-x)<.08){o.y=2;if(o.k==='bee'){lives--;if(lives<=0){dead=true;best('bloom',score)}}else score++}}
for(const o of it)if(o.y>1&&o.y<1.5){o.y=2;if(o.k==='petal'){lives--;if(lives<=0){dead=true;best('bloom',score)}}}
it=it.filter(o=>o.y<1.5)
},(c,k)=>{
const g=c.createLinearGradient(0,0,0,k.H);g.addColorStop(0,'#cfe8d4');g.addColorStop(1,'#7fae86');c.fillStyle=g;c.fillRect(0,0,k.W,k.H)
for(const o of it){const X=o.x*k.W,Y=o.y*k.H
if(o.k==='bee'){c.fillStyle='#facc15';c.beginPath();c.ellipse(X,Y,11,8,0,0,6.283);c.fill();c.fillStyle='#111';c.fillRect(X-3,Y-8,3,16);c.fillRect(X+3,Y-7,3,14);c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.ellipse(X-4,Y-10,6,4,-.4,0,6.283);c.fill()}
else{c.fillStyle=o.c;c.beginPath();c.ellipse(X,Y,9,5,Y/30,0,6.283);c.fill()}}
const X=x*k.W,Y=.92*k.H
c.fillStyle='#8a5a2b';c.beginPath();c.moveTo(X-34,Y-10);c.lineTo(X+34,Y-10);c.lineTo(X+26,Y+18);c.lineTo(X-26,Y+18);c.fill()
txt(c,'Petals '+score+'   Lives '+lives+'   Best '+best('bloom'),12,24,18,'#16311f')
if(dead)over(c,k,score,best('bloom'))
})
k.press=c=>{if(dead&&c==='enter')rs()}
k.tap=()=>{if(dead)rs()}
return k.stop
}
