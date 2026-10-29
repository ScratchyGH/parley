import{kit,txt,over,best}from'./kit.js'
export function play(box){
let x,ob,sp,dist,dead,t,fl
const rs=()=>{x=.5;ob=[];sp=.35;dist=0;dead=false;t=0}
rs()
fl=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),s:Math.random()*2+1}))
const k=kit(box,(dt,k)=>{
for(const f of fl){f.y+=dt*.15*f.s;if(f.y>1){f.y=0;f.x=Math.random()}}
if(dead)return
if(k.keys.arrowleft||k.keys.a)x-=dt*.9
if(k.keys.arrowright||k.keys.d)x+=dt*.9
if(k.down)x+=(k.px/k.W-x)*Math.min(1,dt*10)
x=Math.max(.05,Math.min(.95,x))
sp=Math.min(.95,sp+dt*.01)
dist+=sp*dt*100
t-=dt
if(t<=0){t=.5+Math.random()*.6-sp*.3;ob.push({x:Math.random()*.9+.05,y:-.05,k:Math.random()<.25?'gift':'tree'})}
for(const o of ob)o.y+=sp*dt
for(const o of ob){if(Math.abs(o.x-x)<.04&&Math.abs(o.y-.8)<.04){if(o.k==='gift'){dist+=100;o.y=2}else{dead=true;best('snowrun',Math.floor(dist))}}}
ob=ob.filter(o=>o.y<1.1)
},(c,k)=>{
const g=c.createLinearGradient(0,0,0,k.H);g.addColorStop(0,'#10151c');g.addColorStop(1,'#d9e2ea');c.fillStyle=g;c.fillRect(0,0,k.W,k.H)
c.fillStyle='#fff'
for(const f of fl)c.fillRect(f.x*k.W,f.y*k.H,f.s,f.s)
for(const o of ob){const X=o.x*k.W,Y=o.y*k.H
if(o.k==='tree'){c.fillStyle='#2f4a3a';c.beginPath();c.moveTo(X,Y-34);c.lineTo(X+18,Y+8);c.lineTo(X-18,Y+8);c.fill();c.fillStyle='#fff';c.beginPath();c.moveTo(X,Y-34);c.lineTo(X+8,Y-18);c.lineTo(X-8,Y-18);c.fill()}
else{c.fillStyle='#b91c1c';c.fillRect(X-10,Y-10,20,20);c.fillStyle='#fde68a';c.fillRect(X-2,Y-10,4,20);c.fillRect(X-10,Y-2,20,4)}}
const X=x*k.W,Y=.8*k.H
c.fillStyle='#e8e6df';c.beginPath();c.arc(X,Y-8,8,0,6.283);c.fill();c.fillStyle='#6f6d66';c.fillRect(X-9,Y,18,10);c.fillStyle='#111';c.fillRect(X-14,Y+12,28,3)
txt(c,Math.floor(dist)+' m   Best '+best('snowrun'),12,24,18,'#0b0b0d')
if(dead)over(c,k,Math.floor(dist),best('snowrun'))
})
k.press=c=>{if(dead&&c==='enter')rs()}
k.tap=(a,b)=>{if(dead)rs()}
return k.stop
}
