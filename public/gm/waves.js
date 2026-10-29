import{kit,txt,over,best}from'./kit.js'
export function play(box){
let y,vy,ob,sp,dist,dead,t,ph
const rs=()=>{y=0;vy=0;ob=[];sp=.4;dist=0;dead=false;t=1;ph=0}
rs()
const jump=()=>{if(dead){rs();return}if(y<=0){vy=1.5}}
const k=kit(box,(dt,k)=>{
ph+=dt
if(dead)return
vy-=3.6*dt;y=Math.max(0,y+vy*dt);if(y===0)vy=0
sp=Math.min(1,sp+dt*.008)
dist+=sp*dt*120
t-=dt
if(t<=0){t=.9+Math.random()*.9-sp*.4;ob.push({x:1.05,k:Math.random()<.35?'shark':'rock'})}
for(const o of ob)o.x-=sp*dt
for(const o of ob)if(Math.abs(o.x-.2)<.035&&y<(o.k==='shark'?.07:.1)){dead=true;best('waves',Math.floor(dist))}
ob=ob.filter(o=>o.x>-.1)
},(c,k)=>{
const g=c.createLinearGradient(0,0,0,k.H);g.addColorStop(0,'#f6c177');g.addColorStop(.5,'#7dd3fc');g.addColorStop(1,'#0369a1');c.fillStyle=g;c.fillRect(0,0,k.W,k.H)
const wy=k.H*.72
c.fillStyle='rgba(255,255,255,.35)'
for(let i=0;i<k.W;i+=6)c.fillRect(i,wy+Math.sin(i/30+ph*3)*5,6,3)
for(const o of ob){const X=o.x*k.W,Y=wy+Math.sin(X/30+ph*3)*5
if(o.k==='rock'){c.fillStyle='#475569';c.beginPath();c.arc(X,Y,16,Math.PI,0);c.fill()}
else{c.fillStyle='#64748b';c.beginPath();c.moveTo(X-14,Y+4);c.lineTo(X,Y-26);c.lineTo(X+14,Y+4);c.fill()}}
const X=.2*k.W,Y=wy+Math.sin(X/30+ph*3)*5-y*k.H*.5
c.fillStyle='#fef3c7';c.fillRect(X-22,Y,44,6);c.fillStyle='#f97316';c.fillRect(X-4,Y-24,8,24);c.fillStyle='#fde68a';c.beginPath();c.arc(X,Y-30,7,0,6.283);c.fill()
txt(c,Math.floor(dist)+' m   Best '+best('waves'),12,24,18,'#0b2a40')
if(dead)over(c,k,Math.floor(dist),best('waves'))
})
k.press=c=>{if(c===' '||c==='arrowup'||c==='w')jump();else if(dead&&c==='enter')rs()}
k.tap=jump
return k.stop
}
