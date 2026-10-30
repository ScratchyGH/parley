import{h}from'./util.js'
export function term2d(box,done){
const W=560,H=330
const cv=h('canvas',{width:W,height:H,class:'tu-tc'})
const bar=h('div',{class:'tu-tb'},h('b',null,'HOLLOW SIEGE // TERMINAL 03'),h('span',null,'WASD move, click fire, Esc exit'))
const root=h('div',{class:'tu-term'},bar,cv)
box.append(root)
const ctx=cv.getContext('2d')
const K=new Set()
const P={x:W/2,y:H-60,hp:100,cd:0,ang:-1.57}
const M={x:W/2,y:0,d:0}
const B=[],E=[]
const wl=[[0,0,W,14],[0,H-14,W,14],[0,0,14,H],[W-14,0,14,H],[120,100,60,60],[W-180,100,60,60],[W/2-30,160,60,40]]
const hitW=(x,y,r)=>{for(const w of wl)if(x>w[0]-r&&x<w[0]+w[2]+r&&y>w[1]-r&&y<w[1]+w[3]+r)return true;return false}
let t=0,sc=0,sp=0,raf=0,last=performance.now(),dead=0
const kd=e=>{
if(e.key==='Escape'){stop();e.stopImmediatePropagation();e.preventDefault();return}
K.add(e.key.toLowerCase());e.stopImmediatePropagation();e.preventDefault()
}
const ku=e=>{K.delete(e.key.toLowerCase());e.stopImmediatePropagation()}
const mm=e=>{const r=cv.getBoundingClientRect();M.x=(e.clientX-r.left)/r.width*W;M.y=(e.clientY-r.top)/r.height*H}
const md=e=>{M.d=1;mm(e)}
const mu=()=>{M.d=0}
addEventListener('keydown',kd,true);addEventListener('keyup',ku,true)
cv.addEventListener('pointermove',mm);cv.addEventListener('pointerdown',md);addEventListener('pointerup',mu)
const tick=()=>{
const n=performance.now(),dt=Math.min(.05,(n-last)/1000);last=n;t+=dt
if(!dead){
let dx=(K.has('d')||K.has('arrowright')?1:0)-(K.has('a')||K.has('arrowleft')?1:0),dy=(K.has('s')||K.has('arrowdown')?1:0)-(K.has('w')||K.has('arrowup')?1:0)
const m=Math.hypot(dx,dy)||1;dx=dx/m*150*dt;dy=dy/m*150*dt
if(!hitW(P.x+dx,P.y,9))P.x+=dx
if(!hitW(P.x,P.y+dy,9))P.y+=dy
P.ang=Math.atan2(M.y-P.y,M.x-P.x)
P.cd-=dt
if(M.d&&P.cd<=0){P.cd=.16;B.push({x:P.x,y:P.y,vx:Math.cos(P.ang)*520,vy:Math.sin(P.ang)*520,l:.9})}
sp-=dt
if(sp<=0){sp=Math.max(.35,1.1-t*.03);const s=Math.random()*4|0,x=s===0?30:s===1?W-30:Math.random()*W,y=s===2?30:s===3?H-30:Math.random()*H;if(!hitW(x,y,12)&&Math.hypot(x-P.x,y-P.y)>140)E.push({x,y,hp:2,f:Math.random()*6})}
}
for(let i=B.length-1;i>=0;i--){const b=B[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;let k=b.l<=0||hitW(b.x,b.y,0);if(!k)for(const e of E)if(Math.hypot(e.x-b.x,e.y-b.y)<13){e.hp--;k=true;if(e.hp<=0){e.dead=1;sc++}break}if(k)B.splice(i,1)}
for(let i=E.length-1;i>=0;i--){const e=E[i];if(e.dead){E.splice(i,1);continue}const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,s=62*dt;const nx=e.x+dx/d*s,ny=e.y+dy/d*s;if(!hitW(nx,e.y,10))e.x=nx;if(!hitW(e.x,ny,10))e.y=ny;e.f+=dt*8;if(d<20&&!dead){P.hp-=34*dt;if(P.hp<=0){dead=1}}}
ctx.fillStyle='#120a14';ctx.fillRect(0,0,W,H)
ctx.fillStyle='#1a1018'
for(let x=0;x<W;x+=40)for(let y=0;y<H;y+=40)if((x+y)/40%2===0)ctx.fillRect(x,y,40,40)
ctx.fillStyle='#4a3a4e'
for(const w of wl)ctx.fillRect(w[0],w[1],w[2],w[3])
ctx.fillStyle='#ffd27a'
for(const b of B){ctx.beginPath();ctx.arc(b.x,b.y,3,0,6.3);ctx.fill()}
for(const e of E){ctx.fillStyle='#b8302a';ctx.beginPath();ctx.arc(e.x,e.y,11,0,6.3);ctx.fill();ctx.fillStyle='#ffe27a';ctx.fillRect(e.x-6,e.y-3+Math.sin(e.f)*1.5,4,3);ctx.fillRect(e.x+2,e.y-3+Math.sin(e.f)*1.5,4,3)}
ctx.save();ctx.translate(P.x,P.y);ctx.rotate(P.ang)
ctx.fillStyle=dead?'#555':'#8fe3ff';ctx.beginPath();ctx.arc(0,0,9,0,6.3);ctx.fill();ctx.fillStyle='#e8e8f0';ctx.fillRect(4,-3,13,6)
ctx.restore()
ctx.fillStyle='#000a';ctx.fillRect(14,H-34,120,14);ctx.fillStyle='#d94a4a';ctx.fillRect(16,H-32,116*Math.max(0,P.hp)/100,10)
ctx.fillStyle='#e8e8f0';ctx.font='700 14px system-ui';ctx.textAlign='right';ctx.fillText('KILLS '+sc,W-20,H-22)
if(dead){ctx.textAlign='center';ctx.font='800 26px system-ui';ctx.fillText('YOU DIED',W/2,H/2)}
raf=requestAnimationFrame(tick)
}
raf=requestAnimationFrame(tick)
function stop(){
cancelAnimationFrame(raf)
removeEventListener('keydown',kd,true);removeEventListener('keyup',ku,true);removeEventListener('pointerup',mu)
root.remove()
if(done)done()
}
return{stop}
}
