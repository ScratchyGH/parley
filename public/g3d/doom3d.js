const MAPW=20,MAPH=20
function genMap(seed){
const m=new Array(MAPW*MAPH).fill(1)
let s=seed
const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}
function carve(x,y){
m[y*MAPW+x]=0
const dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>rnd()-.5)
for(const[dx,dy]of dirs){
const nx=x+dx,ny=y+dy
if(nx>0&&nx<MAPW-1&&ny>0&&ny<MAPH-1&&m[ny*MAPW+nx]===1){
m[(y+dy/2)*MAPW+(x+dx/2)]=0
carve(nx,ny)
}
}
}
carve(1,1)
for(let i=0;i<40;i++){
const x=1+Math.floor(rnd()*(MAPW-2)),y=1+Math.floor(rnd()*(MAPH-2))
if(rnd()<.3)m[y*MAPW+x]=0
}
return m
}
export function playNight(night,mount,done,fp){
const wrap=document.createElement('div')
wrap.style.cssText='position:absolute;inset:0;background:#000;overflow:hidden;touch-action:none'
const cv=document.createElement('canvas')
cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair'
const hud=document.createElement('div')
hud.style.cssText='position:absolute;left:0;right:0;top:0;display:flex;gap:14px;padding:14px 18px;pointer-events:none;font:700 15px system-ui,sans-serif;color:#ffe9c4;text-shadow:0 1px 3px #000;z-index:2'
hud.innerHTML='<div>HP <b id="dhp">100</b></div><div id="dwave">Wave 1</div><div style="margin-left:auto" id="dt">0:00</div>'
const say=document.createElement('div')
say.style.cssText='position:absolute;left:50%;top:20%;transform:translateX(-50%);padding:10px 20px;border-radius:10px;background:rgba(10,5,18,.75);border:1px solid #4a2d63;color:#ffe9c4;font:700 18px system-ui,sans-serif;opacity:0;transition:opacity .3s;pointer-events:none;z-index:2;text-align:center'
const tip=document.createElement('div')
tip.style.cssText='position:absolute;left:50%;bottom:4%;transform:translateX(-50%);padding:8px 16px;border-radius:8px;background:rgba(10,5,18,.6);color:#d8c9b0;font:600 13px system-ui,sans-serif;z-index:2'
tip.textContent='WASD move, mouse look, click to fire'
const end=document.createElement('div')
end.style.cssText='position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(6,3,12,.85);z-index:4;color:#f3e6d0'
wrap.append(cv,hud,say,tip,end)
mount.appendChild(wrap)
const ctx=cv.getContext('2d')
const sz=()=>{cv.width=wrap.clientWidth;cv.height=wrap.clientHeight}
sz()
addEventListener('resize',sz)
const map=genMap(night*7+13)
let px=1.5,py=1.5
while(map[Math.floor(py)*MAPW+Math.floor(px)]===1){px++;if(px>MAPW-2){px=1.5;py++}}
let pa=0,pitch=0
const keys={}
const kd=e=>{keys[e.key.toLowerCase()]=true}
const ku=e=>{keys[e.key.toLowerCase()]=false}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
let locked=false
const onclick=()=>{if(!locked)cv.requestPointerLock?.()}
cv.addEventListener('click',onclick)
const onmove=e=>{if(document.pointerLockElement===cv)pa+=e.movementX*.0022}
document.addEventListener('mousemove',onmove)
const onlock=()=>{locked=document.pointerLockElement===cv}
document.addEventListener('pointerlockchange',onlock)
const TYPES={crawler:{hp:20,spd:1.6,dmg:6,r:.28,col:'#7a1f1f',pts:4},screamer:{hp:14,spd:2.4,dmg:5,r:.26,col:'#8a2fa0',pts:5},brute:{hp:60,spd:1.1,dmg:14,r:.4,col:'#3a2a12',pts:10}}
const counts=fp?{crawler:fp.g,screamer:fp.p,brute:fp.j}:{crawler:3+night*2,screamer:1+night,brute:Math.floor(night/2)}
let enemies=[],wave=1,maxWave=fp?.inf?999:5,hp=100,t=0,over=false,shotCd=0,flash=0
const openCells=[]
for(let y=1;y<MAPH-1;y++)for(let x=1;x<MAPW-1;x++)if(map[y*MAPW+x]===0&&Math.hypot(x-px,y-py)>5)openCells.push([x+.5,y+.5])
function spawnWave(){
say.textContent='Wave '+wave
say.style.opacity=1
setTimeout(()=>say.style.opacity=0,1400)
for(const[k,c]of Object.entries(counts)){
for(let i=0;i<c;i++){
if(!openCells.length)continue
const[x,y]=openCells[Math.floor(Math.random()*openCells.length)]
const T=TYPES[k]
enemies.push({x,y,type:k,hp:T.hp+wave*2,mhp:T.hp+wave*2,...T})
}
}
}
spawnWave()
function canSee(x1,y1,x2,y2){
const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy),steps=Math.ceil(d*4)
for(let i=1;i<steps;i++){
const x=x1+dx*i/steps,y=y1+dy*i/steps
if(map[Math.floor(y)*MAPW+Math.floor(x)]===1)return false
}
return true
}
function cast(x,y,a){
const dx=Math.cos(a),dy=Math.sin(a)
let dist=0
for(let i=0;i<400;i++){
dist+=.02
const cx=x+dx*dist,cy=y+dy*dist
if(map[Math.floor(cy)*MAPW+Math.floor(cx)]===1)return dist
}
return 8
}
function shoot(){
if(shotCd>0||over)return
shotCd=.55
flash=.08
let hitAny=false
for(const e of enemies){
const dx=e.x-px,dy=e.y-py,d=Math.hypot(dx,dy)
if(d>4.5)continue
let ea=Math.atan2(dy,dx)-pa
while(ea>Math.PI)ea-=2*Math.PI
while(ea<-Math.PI)ea+=2*Math.PI
if(Math.abs(ea)<.14&&canSee(px,py,e.x,e.y)){
e.hp-=30/(1+d*.3)
hitAny=true
}
}
enemies=enemies.filter(e=>{
if(e.hp<=0){
hp2score(e)
return false
}
return true
})
if(!hitAny)say.style.opacity=0
}
let score=0
function hp2score(e){score+=e.pts}
cv.addEventListener('mousedown',e=>{if(e.button===0)shoot()})
addEventListener('keydown',e=>{if(e.key===' ')shoot()})
let last=performance.now()
function loop(now){
if(over)return
const dt=Math.min(.05,(now-last)/1000)
last=now
t+=dt
shotCd=Math.max(0,shotCd-dt)
flash=Math.max(0,flash-dt)
if(!locked){
if(keys.arrowleft)pa-=1.8*dt
if(keys.arrowright)pa+=1.8*dt
}
let mx=0,my=0
const fx=Math.cos(pa),fy=Math.sin(pa),sx=Math.cos(pa+Math.PI/2),sy=Math.sin(pa+Math.PI/2)
if(keys.w)
{mx+=fx;my+=fy}
if(keys.s){mx-=fx;my-=fy}
if(keys.a){mx-=sx;my-=sy}
if(keys.d){mx+=sx;my+=sy}
const ml=Math.hypot(mx,my)
if(ml>0){
mx=mx/ml*3*dt;my=my/ml*3*dt
const nx=px+mx
if(map[Math.floor(py)*MAPW+Math.floor(nx)]===0)px=nx
const ny=py+my
if(map[Math.floor(ny)*MAPW+Math.floor(px)]===0)py=ny
}
for(const e of enemies){
const dx=px-e.x,dy=py-e.y,d=Math.hypot(dx,dy)
if(d>.1&&canSee(e.x,e.y,px,py)){
const spd=e.spd*dt
const nx=e.x+dx/d*spd,ny=e.y+dy/d*spd
if(map[Math.floor(e.y)*MAPW+Math.floor(nx)]===0)e.x=nx
if(map[Math.floor(ny)*MAPW+Math.floor(e.x)]===0)e.y=ny
}
if(d<.5){hp-=e.dmg*dt;if(hp<=0&&!over)finish(false)}
}
if(enemies.length===0&&!over){
if(wave>=maxWave){finish(true)}
else{wave++;spawnWave()}
}
render()
document.getElementById('dhp').textContent=Math.max(0,Math.round(hp))
document.getElementById('dwave').textContent=fp?.inf?'Endless · Wave '+wave:'Wave '+wave+' / '+maxWave
document.getElementById('dt').textContent=Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')
requestAnimationFrame(loop)
}
function render(){
const w=cv.width,h=cv.height,fov=Math.PI/3
ctx.fillStyle='#1a1a1a'
ctx.fillRect(0,0,w,h/2)
ctx.fillStyle='#0a0a0a'
ctx.fillRect(0,h/2,w,h/2)
const cols=Math.floor(w/2)
const zbuf=new Array(cols)
for(let i=0;i<cols;i++){
const a=pa-fov/2+fov*i/cols
const d=cast(px,py,a)*Math.cos(a-pa)
zbuf[i]=d
const ch=Math.min(h,h/(d+.0001))
const shade=Math.max(.15,1-d/8)
const col=Math.floor(90*shade)
ctx.fillStyle='rgb('+col+','+Math.floor(col*.4)+','+Math.floor(col*.3)+')'
ctx.fillRect(i*2,h/2-ch/2,2.2,ch)
}
const sprites=enemies.map(e=>{
const dx=e.x-px,dy=e.y-py
let a=Math.atan2(dy,dx)-pa
while(a>Math.PI)a-=2*Math.PI
while(a<-Math.PI)a+=2*Math.PI
return{e,d:Math.hypot(dx,dy),a}
}).filter(s=>Math.abs(s.a)<fov*.8).sort((a,b)=>b.d-a.d)
for(const s of sprites){
const col0=(s.a+fov/2)/fov*cols
const ci=Math.floor(col0)
if(ci<0||ci>=cols)continue
if(s.d>zbuf[ci]+.3)continue
const size=Math.min(h*1.2,h/(s.d+.0001)*TYPES[s.e.type].r*2.2)
const sx=col0*2
const shade=Math.max(.2,1-s.d/6)
ctx.fillStyle=TYPES[s.e.type].col
ctx.globalAlpha=shade
ctx.beginPath()
ctx.ellipse(sx,h/2+size*.08,size*.32,size*.5,0,0,7)
ctx.fill()
ctx.globalAlpha=1
ctx.fillStyle='#000'
ctx.fillRect(sx-size*.3,h/2-size*.62,size*.6,size*.06)
ctx.fillStyle='#ef4444'
ctx.fillRect(sx-size*.3,h/2-size*.62,size*.6*Math.max(0,s.e.hp/s.e.mhp),size*.06)
}
ctx.strokeStyle='rgba(255,220,180,.8)'
ctx.lineWidth=2
ctx.beginPath()
ctx.moveTo(w/2-10,h/2)
ctx.lineTo(w/2+10,h/2)
ctx.moveTo(w/2,h/2-10)
ctx.lineTo(w/2,h/2+10)
ctx.stroke()
if(flash>0){ctx.fillStyle='rgba(255,220,150,'+(flash/.08*.3)+')';ctx.fillRect(0,0,w,h)}
if(hp<30){ctx.fillStyle='rgba(180,10,10,'+(1-hp/30)*.35+')';ctx.fillRect(0,0,w,h)}
}
requestAnimationFrame(loop)
function cleanup(){
removeEventListener('keydown',kd)
removeEventListener('keyup',ku)
removeEventListener('resize',sz)
document.removeEventListener('mousemove',onmove)
document.removeEventListener('pointerlockchange',onlock)
if(document.pointerLockElement===cv)document.exitPointerLock?.()
}
function finish(ok){
if(over)return
over=true
cleanup()
end.style.display='flex'
end.innerHTML='<h2 style="margin:0;font:700 40px Georgia,serif;color:#ffb347">'+(ok?'Cleared':'You died')+'</h2><p style="margin:0">Wave '+wave+' &middot; '+Math.floor(t)+'s</p>'
setTimeout(()=>done({ok,secs:Math.floor(t)}),ok?1800:900)
}
return()=>{over=true;cleanup();wrap.remove()}
}
