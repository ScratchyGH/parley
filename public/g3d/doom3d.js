const MAPW=24,MAPH=24,TS=64
const hash=(x,y,s)=>{let h=(x*374761393+y*668265263+s*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295}
const noise=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const fbm=(x,y,s)=>noise(x,y,s)*.5+noise(x*2,y*2,s+1)*.3+noise(x*4,y*4,s+2)*.2
const px=(r,g,b)=>(255<<24)|((b&255)<<16)|((g&255)<<8)|(r&255)
const cl=v=>v<0?0:v>255?255:v|0
function tex(fn){const a=new Uint32Array(TS*TS);for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){const c=fn(x,y);a[y*TS+x]=px(cl(c[0]),cl(c[1]),cl(c[2]))}return a}
function makeTextures(){
const brick=tex((x,y)=>{
const row=y>>4,off=(row&1)*16,bx=(x+off)%32,by=y%16
const id=Math.floor((x+off)/32)+row*7
if(by<2||bx<2)return[52+noise(x*.4,y*.4,3)*14,46+noise(x*.4,y*.4,4)*12,44]
const n=fbm(x*.18,y*.18,id)
const v=(hash(id,row,9)-.5)*34
return[118+v+n*46-30,48+v*.4+n*18-8,40+v*.3+n*12-6]
})
const stone=tex((x,y)=>{
const n=fbm(x*.09,y*.09,5),m=fbm(x*.07+9,y*.07,6)
let r=96+n*70-20,g=96+n*68-20,b=104+n*66-20
const seam=((x%32<1)||(y%32<1))?-34:0
const crack=Math.abs(fbm(x*.11,y*.11,7)-.5)<.018?-52:0
const moss=m>.62?(m-.62)*320:0
return[r+seam+crack-moss*.5,g+seam+crack+moss*.35,b+seam+crack-moss*.5]
})
const metal=tex((x,y)=>{
const n=noise(x*.9,y*.04,2)*16
let v=82+n,r=v,g=v+4,b=v+14
if(x%32<1||y%32<1||x%32===31||y%32===31){r-=34;g-=34;b-=30}
const rx=x%32,ry=y%32
for(const[cx,cy]of[[5,5],[26,5],[5,26],[26,26]]){const d=Math.hypot(rx-cx,ry-cy);if(d<2.6){const k=(2.6-d)*18;r+=k;g+=k;b+=k}}
if(y>=52&&y<60){const s=((x+y)>>3)&1;if(s){r=210;g=170;b=30}else{r=24;g=24;b=24}}
return[r,g,b]
})
const flesh=tex((x,y)=>{
const n=fbm(x*.1,y*.1,11),w=Math.sin(x*.28+n*7)*Math.sin(y*.21+n*5)
const v=Math.abs(w)<.12?1:0
return[v?160+n*40:104+n*60,v?22:26+n*20,v?38:34+n*20]
})
const floor=tex((x,y)=>{
const n=fbm(x*.12,y*.12,21),t=((x>>5)+(y>>5))&1
let v=58+n*34+(t?10:0)
if(x%32<1||y%32<1)v-=24
const c=Math.abs(fbm(x*.14,y*.14,22)-.5)<.014?-26:0
return[v+c+4,v+c,v+c-2]
})
const ceil=tex((x,y)=>{
const n=fbm(x*.15,y*.15,31)
let v=34+n*26
if(y%32<3||x%32<2)v=20+noise(x*.5,y*.5,32)*10
return[v+10,v+4,v]
})
return{walls:[brick,stone,metal,flesh],floor,ceil}
}
function mk(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const d=g.getImageData(0,0,w,h);return{w,h,d:new Uint32Array(d.data.buffer.slice(0)),c}}
function art(){
const crawler=mk(64,64,(g,w,h)=>{
g.lineJoin='round';g.lineCap='round'
g.fillStyle='#4a1414';g.strokeStyle='#150404';g.lineWidth=2
g.beginPath();g.ellipse(32,44,22,12,0,0,7);g.fill();g.stroke()
g.fillStyle='#7a2a22'
g.beginPath();g.ellipse(32,40,18,9,0,0,7);g.fill()
g.strokeStyle='#150404';g.lineWidth=4
for(const[a,b,c,d]of[[14,48,6,60],[22,52,16,62],[42,52,48,62],[50,48,58,60]]){g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke()}
g.strokeStyle='#c9b79a';g.lineWidth=2
for(const x of[4,8,12,52,56,60]){g.beginPath();g.moveTo(x,59);g.lineTo(x+1,63);g.stroke()}
g.fillStyle='#8f3a2e';g.strokeStyle='#150404';g.lineWidth=2
g.beginPath();g.ellipse(32,27,12,11,0,0,7);g.fill();g.stroke()
g.fillStyle='#ffd23a';g.beginPath();g.ellipse(27,25,3,2.4,0,0,7);g.ellipse(37,25,3,2.4,0,0,7);g.fill()
g.fillStyle='#000';g.beginPath();g.arc(27,25,1,0,7);g.arc(37,25,1,0,7);g.fill()
g.fillStyle='#220606';g.beginPath();g.ellipse(32,33,6,3,0,0,7);g.fill()
g.fillStyle='#e8dcc2'
for(let i=0;i<5;i++){g.beginPath();g.moveTo(27+i*2.5,31);g.lineTo(28.2+i*2.5,34.5);g.lineTo(29.4+i*2.5,31);g.fill()}
g.fillStyle='#b03a2a';g.fillRect(20,38,4,2);g.fillRect(38,42,5,2)
})
const screamer=mk(64,64,(g,w,h)=>{
const gr=g.createRadialGradient(32,30,4,32,30,30);gr.addColorStop(0,'rgba(190,90,255,.55)');gr.addColorStop(1,'rgba(120,30,200,0)')
g.fillStyle=gr;g.fillRect(0,0,64,64)
g.fillStyle='rgba(150,70,220,.55)'
g.beginPath();g.moveTo(14,40);g.quadraticCurveTo(10,60,20,62);g.quadraticCurveTo(22,52,26,56);g.quadraticCurveTo(32,66,38,56);g.quadraticCurveTo(42,52,44,62);g.quadraticCurveTo(54,60,50,40);g.closePath();g.fill()
g.fillStyle='#e9e2f2';g.strokeStyle='#241038';g.lineWidth=2.4
g.beginPath();g.ellipse(32,28,15,17,0,0,7);g.fill();g.stroke()
g.fillStyle='#120820'
g.beginPath();g.ellipse(25,26,4.6,6,-.2,0,7);g.ellipse(39,26,4.6,6,.2,0,7);g.fill()
g.fillStyle='#ff5ad8';g.beginPath();g.arc(25,27,1.6,0,7);g.arc(39,27,1.6,0,7);g.fill()
g.fillStyle='#120820';g.beginPath();g.ellipse(32,40,6.5,8,0,0,7);g.fill()
g.fillStyle='#e9e2f2'
for(const x of[27,31,35])g.fillRect(x,33.5,2.4,3.4)
g.strokeStyle='#8a7aa0';g.lineWidth=1.4;g.beginPath();g.moveTo(32,13);g.lineTo(30,20);g.moveTo(40,16);g.lineTo(37,22);g.stroke()
})
const brute=mk(64,64,(g,w,h)=>{
g.lineJoin='round';g.lineCap='round'
g.fillStyle='#2f4a2c';g.strokeStyle='#0c1a0b';g.lineWidth=2.4
g.beginPath();g.moveTo(8,62);g.quadraticCurveTo(4,34,16,28);g.lineTo(48,28);g.quadraticCurveTo(60,34,56,62);g.closePath();g.fill();g.stroke()
g.fillStyle='#3d5d38'
g.beginPath();g.ellipse(14,40,8,10,.3,0,7);g.ellipse(50,40,8,10,-.3,0,7);g.fill();g.stroke()
g.fillStyle='#4b6e44';g.beginPath();g.ellipse(32,44,16,16,0,0,7);g.fill()
g.fillStyle='#355131';g.strokeStyle='#0c1a0b'
g.beginPath();g.ellipse(32,20,13,12,0,0,7);g.fill();g.stroke()
g.fillStyle='#d8cfb8';g.strokeStyle='#0c1a0b';g.lineWidth=1.8
g.beginPath();g.moveTo(21,13);g.lineTo(15,2);g.lineTo(26,10);g.closePath();g.moveTo(43,13);g.lineTo(49,2);g.lineTo(38,10);g.closePath();g.fill();g.stroke()
g.fillStyle='#ff2a1a';g.beginPath();g.ellipse(27,19,2.8,2,0,0,7);g.ellipse(37,19,2.8,2,0,0,7);g.fill()
g.fillStyle='#0c1a0b';g.beginPath();g.moveTo(25,26);g.lineTo(39,26);g.lineTo(36,31);g.lineTo(28,31);g.closePath();g.fill()
g.fillStyle='#e8e0c6';for(const x of[27,30,33,36])g.fillRect(x,26,1.6,3)
g.strokeStyle='#243b21';g.lineWidth=1.4;g.beginPath();g.moveTo(24,40);g.lineTo(40,52);g.moveTo(40,40);g.lineTo(24,52);g.stroke()
})
const pack=mk(64,64,(g,w,h)=>{
g.fillStyle='#f4f4f4';g.strokeStyle='#222';g.lineWidth=2.6
g.beginPath();g.roundRect(14,26,36,26,4);g.fill();g.stroke()
g.fillStyle='#d92b2b';g.fillRect(29,30,6,18);g.fillRect(23,36,18,6)
g.strokeStyle='#222';g.lineWidth=2.4;g.beginPath();g.arc(32,26,7,Math.PI,0);g.stroke()
})
const torch=mk(64,64,(g,w,h)=>{
const gr=g.createRadialGradient(32,22,2,32,22,24);gr.addColorStop(0,'rgba(255,200,90,.9)');gr.addColorStop(1,'rgba(255,120,20,0)')
g.fillStyle=gr;g.fillRect(0,0,64,64)
g.fillStyle='#3b2412';g.strokeStyle='#120a04';g.lineWidth=2;g.fillRect(29,28,6,30);g.strokeRect(29,28,6,30)
g.fillStyle='#ff8a1a';g.beginPath();g.moveTo(32,6);g.quadraticCurveTo(44,18,38,28);g.lineTo(26,28);g.quadraticCurveTo(20,18,32,6);g.fill()
g.fillStyle='#ffe27a';g.beginPath();g.moveTo(32,14);g.quadraticCurveTo(38,22,35,28);g.lineTo(29,28);g.quadraticCurveTo(26,22,32,14);g.fill()
})
return{crawler,screamer,brute,pack,torch}
}
function genMap(seed){
const m=new Array(MAPW*MAPH).fill(1)
let s=seed
const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}
const stack=[[1,1]]
m[MAPW+1]=0
while(stack.length){
const[x,y]=stack[stack.length-1]
const dirs=[[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>{const nx=x+dx,ny=y+dy;return nx>0&&nx<MAPW-1&&ny>0&&ny<MAPH-1&&m[ny*MAPW+nx]===1})
if(!dirs.length){stack.pop();continue}
const[dx,dy]=dirs[Math.floor(rnd()*dirs.length)]
m[(y+dy/2)*MAPW+(x+dx/2)]=0
m[(y+dy)*MAPW+(x+dx)]=0
stack.push([x+dx,y+dy])
}
for(let i=0;i<70;i++){
const x=2+Math.floor(rnd()*(MAPW-4)),y=2+Math.floor(rnd()*(MAPH-4))
if(rnd()<.5)m[y*MAPW+x]=0
}
for(let i=0;i<3;i++){
const rx=3+Math.floor(rnd()*(MAPW-8)),ry=3+Math.floor(rnd()*(MAPH-8))
for(let y=ry;y<ry+3;y++)for(let x=rx;x<rx+3;x++)m[y*MAPW+x]=0
}
const kind=new Array(MAPW*MAPH).fill(0)
for(let y=0;y<MAPH;y++)for(let x=0;x<MAPW;x++){
const r=hash(x>>1,y>>1,seed)
kind[y*MAPW+x]=r<.5?0:r<.75?1:r<.93?2:3
}
return{m,kind}
}
export function playNight(night,mount,done,fp){
const T=makeTextures(),A=art()
const wrap=document.createElement('div')
wrap.style.cssText='position:absolute;inset:0;background:#000;overflow:hidden;touch-action:none;user-select:none'
const cv=document.createElement('canvas')
cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair;image-rendering:pixelated'
wrap.append(cv)
mount.appendChild(wrap)
const ctx=cv.getContext('2d')
const buf=document.createElement('canvas')
const bctx=buf.getContext('2d')
let SW=320,SH=200,img=null,pix=null,zb=null
function size(){
const w=wrap.clientWidth||800,h=wrap.clientHeight||500
cv.width=w;cv.height=h
SH=Math.round(Math.max(150,Math.min(240,h/3)))
SW=Math.round(Math.max(200,Math.min(520,SH*w/h)))
buf.width=SW;buf.height=SH
img=bctx.createImageData(SW,SH)
pix=new Uint32Array(img.data.buffer)
zb=new Float32Array(SW)
}
size()
const ro=new ResizeObserver(size)
ro.observe(wrap)
const{m:map,kind}=genMap(night*7+13)
const cell=(x,y)=>x<0||y<0||x>=MAPW||y>=MAPH?1:map[y*MAPW+x]
let posX=1.5,posY=1.5,ang=0.2
const free=[]
for(let y=1;y<MAPH-1;y++)for(let x=1;x<MAPW-1;x++)if(map[y*MAPW+x]===0)free.push([x,y])
const torches=[]
for(const[x,y]of free){
if(hash(x,y,77)<.045&&(cell(x+1,y)||cell(x-1,y)||cell(x,y+1)||cell(x,y-1)))torches.push({x:x+.5+(cell(x+1,y)?.38:cell(x-1,y)?-.38:0),y:y+.5+(cell(x,y+1)?.38:cell(x,y-1)?-.38:0),k:'torch',ph:hash(x,y,5)*6})
}
const TYPES={crawler:{hp:22,spd:1.5,dmg:6,r:.3,sz:.62,pts:4,sp:'crawler'},screamer:{hp:15,spd:2.5,dmg:5,r:.26,sz:.7,pts:5,sp:'screamer',fly:1},brute:{hp:70,spd:1.0,dmg:15,r:.42,sz:1.05,pts:12,sp:'brute'}}
const counts=fp?{crawler:fp.g,screamer:fp.p,brute:fp.j}:{crawler:3+night*2,screamer:1+night,brute:Math.floor(night/2)}
let enemies=[],pickups=[],wave=1,maxWave=fp?.inf?999:5,hp=100,t=0,over=false,shotCd=0,kills=0,flash=0,hurt=0,bob=0,recoil=0,bannerT=0,banner='',waitNext=0,raf=0,lastT=performance.now(),locked=false,fireHeld=false
const keys={}
function spawnWave(){
const k=fp?.inf?1+(wave-1)*.35:1+(wave-1)*.5
const list=[]
for(const ty of['crawler','screamer','brute']){
let n=Math.round((counts[ty]||0)*k/ (fp?1:2))
if(!fp&&ty==='crawler')n=Math.max(2,Math.round((3+night*2)*k*.6))
for(let i=0;i<n;i++)list.push(ty)
}
if(!list.length)list.push('crawler')
for(const ty of list){
let tries=0,c
do{c=free[Math.floor(Math.random()*free.length)];tries++}while(tries<60&&Math.hypot(c[0]+.5-posX,c[1]+.5-posY)<7)
const d=TYPES[ty]
enemies.push({ty,x:c[0]+.5,y:c[1]+.5,hp:d.hp*(1+(wave-1)*.1),max:d.hp*(1+(wave-1)*.1),d,cd:0,fl:0,ph:Math.random()*6})
}
banner='Wave '+wave+(fp?.inf?'':' of '+maxWave)
bannerT=2.2
}
spawnWave()
const kd=e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')e.preventDefault()}
const ku=e=>{keys[e.key.toLowerCase()]=false}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
const onmove=e=>{if(document.pointerLockElement===cv)ang+=e.movementX*.0024}
document.addEventListener('mousemove',onmove)
const onlock=()=>{locked=document.pointerLockElement===cv}
document.addEventListener('pointerlockchange',onlock)
let tx=null
const down=e=>{
if(e.pointerType==='touch'){tx={x:e.clientX,id:e.pointerId,moved:0,t:performance.now()};cv.setPointerCapture?.(e.pointerId);return}
if(!locked)cv.requestPointerLock?.()
fireHeld=true
}
const up=e=>{
if(e.pointerType==='touch'&&tx){if(performance.now()-tx.t<260&&tx.moved<12)shoot();tx=null;return}
fireHeld=false
}
const mv=e=>{if(tx&&e.pointerId===tx.id){const dx=e.clientX-tx.x;tx.x=e.clientX;tx.moved+=Math.abs(dx);ang+=dx*.006}}
cv.addEventListener('pointerdown',down)
addEventListener('pointerup',up)
cv.addEventListener('pointermove',mv)
const wallDist=(ox,oy,dx,dy)=>{
let mx=Math.floor(ox),my=Math.floor(oy)
const ddx=Math.abs(1/(dx||1e-9)),ddy=Math.abs(1/(dy||1e-9))
let sx,sy,sdx,sdy
if(dx<0){sx=-1;sdx=(ox-mx)*ddx}else{sx=1;sdx=(mx+1-ox)*ddx}
if(dy<0){sy=-1;sdy=(oy-my)*ddy}else{sy=1;sdy=(my+1-oy)*ddy}
let side=0,n=0
while(n++<64){
if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}
if(cell(mx,my)){return side===0?sdx-ddx:sdy-ddy}
}
return 64
}
function shoot(){
if(shotCd>0||over)return
shotCd=.62
recoil=1
flash=.09
for(let p=0;p<9;p++){
const a=ang+(Math.random()-.5)*.1,dx=Math.cos(a),dy=Math.sin(a)
const wd=wallDist(posX,posY,dx,dy)
let best=null,bd=wd
for(const e of enemies){
const ex=e.x-posX,ey=e.y-posY,d=ex*dx+ey*dy
if(d<.1||d>bd)continue
const perp=Math.abs(ex*dy-ey*dx)
if(perp<e.d.r*1.1){best=e;bd=d}
}
if(best){best.hp-=(14+Math.random()*6)*(bd<3?1.2:bd<6?1:.6);best.fl=.12}
}
}
function collide(x,y,r){
return cell(Math.floor(x-r),Math.floor(y-r))||cell(Math.floor(x+r),Math.floor(y-r))||cell(Math.floor(x-r),Math.floor(y+r))||cell(Math.floor(x+r),Math.floor(y+r))
}
function finish(ok){
if(over)return
over=true
document.exitPointerLock?.()
const secs=Math.floor(t)
const box=document.createElement('div')
box.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(8,2,2,.78);color:#f3e6d0;font:800 34px system-ui,sans-serif;letter-spacing:.04em;text-align:center'
const a=document.createElement('div');a.textContent=ok?'Chapel cleared':'You were overrun'
a.style.color=ok?'#9be37a':'#ff6a5a'
const b=document.createElement('div');b.textContent=kills+' slain in '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');b.style.cssText='font:600 16px system-ui,sans-serif;opacity:.8'
box.append(a,b)
wrap.append(box)
setTimeout(()=>done({ok,secs,kills}),900)
}
function render(){
const dirX=Math.cos(ang),dirY=Math.sin(ang)
const plX=-dirY*.66,plY=dirX*.66
const rdx0=dirX-plX,rdy0=dirY-plY,rdx1=dirX+plX,rdy1=dirY+plY
const half=SH>>1
const fl=T.floor,ce=T.ceil
const fk=1+flash*2.2
for(let y=0;y<SH;y++){
const p=y-half
if(p===0){for(let x=0;x<SW;x++)pix[y*SW+x]=0;continue}
const rowD=half/Math.abs(p)
const sh=Math.min(1,1.25/(1+rowD*.42))*fk
const stx=rowD*(rdx1-rdx0)/SW,sty=rowD*(rdy1-rdy0)/SW
let fx=posX+rowD*rdx0,fy=posY+rowD*rdy0
const src=p>0?fl:ce
const ro=y*SW
for(let x=0;x<SW;x++){
const tx=((fx*TS)&(TS-1)),ty=((fy*TS)&(TS-1))
const c=src[ty*TS+tx]
const r=(c&255)*sh,g=((c>>8)&255)*sh,b=((c>>16)&255)*sh
pix[ro+x]=(255<<24)|((b>255?255:b|0)<<16)|((g>255?255:g|0)<<8)|(r>255?255:r|0)
fx+=stx;fy+=sty
}
}
for(let x=0;x<SW;x++){
const cx=2*x/SW-1
const rdx=dirX+plX*cx,rdy=dirY+plY*cx
let mx=Math.floor(posX),my=Math.floor(posY)
const ddx=Math.abs(1/(rdx||1e-9)),ddy=Math.abs(1/(rdy||1e-9))
let sx,sy,sdx,sdy
if(rdx<0){sx=-1;sdx=(posX-mx)*ddx}else{sx=1;sdx=(mx+1-posX)*ddx}
if(rdy<0){sy=-1;sdy=(posY-my)*ddy}else{sy=1;sdy=(my+1-posY)*ddy}
let side=0,n=0
while(n++<64){
if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}
if(cell(mx,my))break
}
const pd=Math.max(.05,side===0?sdx-ddx:sdy-ddy)
zb[x]=pd
const lh=Math.floor(SH/pd)
let ds=Math.floor(half-lh/2),de=Math.floor(half+lh/2)
let wx=side===0?posY+pd*rdy:posX+pd*rdx
wx-=Math.floor(wx)
let tx=Math.floor(wx*TS)
if(side===0&&rdx>0)tx=TS-1-tx
if(side===1&&rdy<0)tx=TS-1-tx
const tk=T.walls[kind[Math.max(0,Math.min(MAPH-1,my))*MAPW+Math.max(0,Math.min(MAPW-1,mx))]]
const sh=Math.min(1.15,1.6/(1+pd*pd*.12))*(side?.72:1)*fk
const step=TS/lh
let tp=(ds<0?-ds:0)*step
if(ds<0)ds=0
if(de>=SH)de=SH-1
for(let y=ds;y<=de;y++){
const c=tk[(tp|0)*TS+tx]
tp+=step
const r=(c&255)*sh,g=((c>>8)&255)*sh,b=((c>>16)&255)*sh
pix[y*SW+x]=(255<<24)|((b>255?255:b|0)<<16)|((g>255?255:g|0)<<8)|(r>255?255:r|0)
}
}
const sprites=[]
for(const o of torches)sprites.push({x:o.x,y:o.y,img:A.torch,sz:.5,z:.1,glow:1,ph:o.ph})
for(const o of pickups)sprites.push({x:o.x,y:o.y,img:A.pack,sz:.4,z:.85,glow:0,ph:0})
for(const e of enemies)sprites.push({x:e.x,y:e.y,img:A[e.d.sp],sz:e.d.sz,z:e.d.fly?.35+Math.sin(t*3+e.ph)*.08:.5,fl:e.fl,e})
for(const s of sprites){const dx=s.x-posX,dy=s.y-posY;s.d=dx*dx+dy*dy}
sprites.sort((a,b)=>b.d-a.d)
const inv=1/(plX*dirY-dirX*plY)
for(const s of sprites){
const rx=s.x-posX,ry=s.y-posY
const tX=inv*(dirY*rx-dirX*ry),tY=inv*(-plY*rx+plX*ry)
if(tY<=.15)continue
const scrX=Math.floor((SW/2)*(1+tX/tY))
const sh=Math.abs(Math.floor(SH/tY*s.sz*1.6)),sw=sh
const vo=Math.floor(((.5-s.z)*SH)/tY)
const y0=Math.floor(half-sh/2+vo),x0=Math.floor(scrX-sw/2)
const fog=Math.min(1.2,1.7/(1+tY*tY*.1))*fk*(s.glow?1.4+Math.sin(t*9+s.ph)*.2:1)
const im=s.img
for(let sx=Math.max(0,x0);sx<Math.min(SW,x0+sw);sx++){
if(tY>=zb[sx])continue
const u=Math.floor((sx-x0)/sw*im.w)
for(let yy=Math.max(0,y0);yy<Math.min(SH,y0+sh);yy++){
const v=Math.floor((yy-y0)/sh*im.h)
const c=im.d[v*im.w+u]
if((c>>>24)<40)continue
let r=(c&255)*fog,g=((c>>8)&255)*fog,b=((c>>16)&255)*fog
if(s.fl>0){r+=120;g+=100;b+=100}
if(s.glow){pix[yy*SW+sx]=(255<<24)|((Math.min(255,((pix[yy*SW+sx]>>16)&255)+b*.6)|0)<<16)|((Math.min(255,((pix[yy*SW+sx]>>8)&255)+g*.6)|0)<<8)|(Math.min(255,(pix[yy*SW+sx]&255)+r*.6)|0);continue}
pix[yy*SW+sx]=(255<<24)|((b>255?255:b|0)<<16)|((g>255?255:g|0)<<8)|(r>255?255:r|0)
}
}
}
bctx.putImageData(img,0,0)
ctx.imageSmoothingEnabled=false
ctx.drawImage(buf,0,0,cv.width,cv.height)
}
function hud(){
const W=cv.width,H=cv.height
if(hurt>0){
const g=ctx.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,H*.85)
g.addColorStop(0,'rgba(200,0,0,0)');g.addColorStop(1,'rgba(200,0,0,'+Math.min(.65,hurt)+')')
ctx.fillStyle=g;ctx.fillRect(0,0,W,H)
}
const vg=ctx.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*.95)
vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)')
ctx.fillStyle=vg;ctx.fillRect(0,0,W,H)
const u=H/520
const bx=Math.sin(bob*1)*6*u,by=Math.abs(Math.cos(bob))*5*u+recoil*26*u
const cx=W/2+bx,cy=H-by
if(flash>0){
const g=ctx.createRadialGradient(cx,cy-190*u,4,cx,cy-190*u,150*u)
g.addColorStop(0,'rgba(255,240,170,.95)');g.addColorStop(.4,'rgba(255,150,40,.55)');g.addColorStop(1,'rgba(255,90,0,0)')
ctx.fillStyle=g;ctx.fillRect(cx-200*u,cy-360*u,400*u,300*u)
}
ctx.save()
ctx.translate(cx,cy)
ctx.scale(u,u)
ctx.lineJoin='round'
ctx.strokeStyle='#0d0d10';ctx.lineWidth=4
const gb=ctx.createLinearGradient(-26,0,26,0);gb.addColorStop(0,'#3a3d45');gb.addColorStop(.45,'#9096a2');gb.addColorStop(1,'#2a2c33')
ctx.fillStyle=gb
ctx.beginPath();ctx.roundRect(-24,-205,48,200,6);ctx.fill();ctx.stroke()
ctx.fillStyle='#17181c';ctx.beginPath();ctx.ellipse(0,-205,24,7,0,0,7);ctx.fill();ctx.stroke()
ctx.fillStyle=gb
ctx.beginPath();ctx.roundRect(-58,-150,32,150,6);ctx.fill();ctx.stroke()
ctx.fillStyle='#2b2d33';ctx.beginPath();ctx.ellipse(-42,-150,16,5,0,0,7);ctx.fill();ctx.stroke()
const gw=ctx.createLinearGradient(-60,0,60,0);gw.addColorStop(0,'#5a3418');gw.addColorStop(.5,'#8c5a2b');gw.addColorStop(1,'#4a2a12')
ctx.fillStyle=gw
ctx.beginPath();ctx.roundRect(-40,-110+recoil*30,80,60,10);ctx.fill();ctx.stroke()
ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2
for(let i=-30;i<=30;i+=10){ctx.beginPath();ctx.moveTo(i,-104+recoil*30);ctx.lineTo(i,-58+recoil*30);ctx.stroke()}
ctx.strokeStyle='#0d0d10';ctx.lineWidth=4
ctx.fillStyle=gw
ctx.beginPath();ctx.moveTo(-50,-60);ctx.lineTo(50,-60);ctx.lineTo(70,0);ctx.lineTo(-70,0);ctx.closePath();ctx.fill();ctx.stroke()
ctx.fillStyle='#c9a37a';ctx.beginPath();ctx.ellipse(-10,-48,22,16,.2,0,7);ctx.fill();ctx.stroke()
ctx.restore()
ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2
ctx.beginPath();ctx.moveTo(W/2-9,H/2);ctx.lineTo(W/2-3,H/2);ctx.moveTo(W/2+3,H/2);ctx.lineTo(W/2+9,H/2);ctx.moveTo(W/2,H/2-9);ctx.lineTo(W/2,H/2-3);ctx.moveTo(W/2,H/2+3);ctx.lineTo(W/2,H/2+9);ctx.stroke()
const f=Math.max(12,Math.min(18,H/34))
ctx.font='800 '+f+'px system-ui,sans-serif'
ctx.textBaseline='top'
ctx.fillStyle='rgba(8,4,8,.62)';ctx.fillRect(14,14,200,f*3.3+14)
ctx.fillStyle='#ffe9c4'
ctx.fillText('HP',24,22)
ctx.fillStyle='#2a1010';ctx.fillRect(58,22,140,f)
ctx.fillStyle=hp>40?'#53c46a':'#e0483a';ctx.fillRect(58,22,Math.max(0,140*hp/100),f)
ctx.fillStyle='#ffe9c4'
ctx.fillText(fp?.inf?'Endless wave '+wave:'Wave '+wave+' / '+maxWave,24,22+f*1.4)
ctx.fillText(kills+' slain    '+Math.floor(t/60)+':'+String(Math.floor(t)%60).padStart(2,'0'),24,22+f*2.7)
const ms=5,mx0=W-14-MAPW*ms,my0=14
ctx.fillStyle='rgba(8,4,8,.6)';ctx.fillRect(mx0-4,my0-4,MAPW*ms+8,MAPH*ms+8)
for(let y=0;y<MAPH;y++)for(let x=0;x<MAPW;x++)if(map[y*MAPW+x]){ctx.fillStyle='#4b3a5a';ctx.fillRect(mx0+x*ms,my0+y*ms,ms,ms)}
ctx.fillStyle='#ff4a3a'
for(const e of enemies)ctx.fillRect(mx0+e.x*ms-1.5,my0+e.y*ms-1.5,3,3)
ctx.fillStyle='#6ff'
ctx.beginPath();ctx.arc(mx0+posX*ms,my0+posY*ms,2.6,0,7);ctx.fill()
ctx.strokeStyle='#6ff';ctx.beginPath();ctx.moveTo(mx0+posX*ms,my0+posY*ms);ctx.lineTo(mx0+(posX+Math.cos(ang)*2)*ms,my0+(posY+Math.sin(ang)*2)*ms);ctx.stroke()
if(bannerT>0){
ctx.globalAlpha=Math.min(1,bannerT)
ctx.font='900 '+Math.round(H/12)+'px system-ui,sans-serif'
ctx.textAlign='center'
ctx.fillStyle='#000';ctx.fillText(banner,W/2+3,H*.2+3)
ctx.fillStyle='#ffe9c4';ctx.fillText(banner,W/2,H*.2)
ctx.textAlign='left'
ctx.globalAlpha=1
}
if(!locked&&t<8){
ctx.font='700 '+Math.round(f)+'px system-ui,sans-serif'
ctx.textAlign='center'
ctx.fillStyle='rgba(8,4,8,.65)';ctx.fillRect(W/2-250,H-54,500,34)
ctx.fillStyle='#d8c9b0';ctx.fillText('WASD move, mouse or arrows turn, click to fire',W/2,H-46)
ctx.textAlign='left'
}
}
function tick(now){
raf=requestAnimationFrame(tick)
const dt=Math.min(.05,(now-lastT)/1000)
lastT=now
if(over){render();hud();return}
t+=dt
shotCd=Math.max(0,shotCd-dt)
recoil=Math.max(0,recoil-dt*3.2)
flash=Math.max(0,flash-dt)
hurt=Math.max(0,hurt-dt*1.5)
bannerT=Math.max(0,bannerT-dt)
if(keys['arrowleft'])ang-=2.4*dt
if(keys['arrowright'])ang+=2.4*dt
const mvF=(keys['w']||keys['arrowup']?1:0)-(keys['s']||keys['arrowdown']?1:0)
const mvS=(keys['d']?1:0)-(keys['a']?1:0)
const sp=3.1*(keys['shift']?1.5:1)
if(mvF||mvS){
const dx=(Math.cos(ang)*mvF-Math.sin(ang)*mvS),dy=(Math.sin(ang)*mvF+Math.cos(ang)*mvS)
const l=Math.hypot(dx,dy)||1
const nx=posX+dx/l*sp*dt,ny=posY+dy/l*sp*dt
if(!collide(nx,posY,.22))posX=nx
if(!collide(posX,ny,.22))posY=ny
bob+=dt*9
}
if(fireHeld||keys[' '])shoot()
for(let i=enemies.length-1;i>=0;i--){
const e=enemies[i]
e.fl=Math.max(0,e.fl-dt)
if(e.hp<=0){
kills++
if(Math.random()<.28)pickups.push({x:e.x,y:e.y})
enemies.splice(i,1)
continue
}
const dx=posX-e.x,dy=posY-e.y,d=Math.hypot(dx,dy)||1
if(d>e.d.r+.35){
const sp2=e.d.spd*(1+(wave-1)*.05)*dt
const nx=e.x+dx/d*sp2,ny=e.y+dy/d*sp2
if(!collide(nx,e.y,e.d.r*.6))e.x=nx
else if(!collide(e.x,e.y+Math.sign(dy)*sp2,e.d.r*.6))e.y+=Math.sign(dy)*sp2
if(!collide(e.x,ny,e.d.r*.6))e.y=ny
else if(!collide(e.x+Math.sign(dx)*sp2,e.y,e.d.r*.6))e.x+=Math.sign(dx)*sp2
}else{
e.cd-=dt
if(e.cd<=0){e.cd=.9;hp-=e.d.dmg;hurt=.7}
}
}
for(let i=pickups.length-1;i>=0;i--){
const p=pickups[i]
if(Math.hypot(p.x-posX,p.y-posY)<.5){hp=Math.min(100,hp+20);pickups.splice(i,1)}
}
if(hp<=0){hp=0;finish(false)}
else if(!enemies.length){
if(!waitNext){waitNext=2.4;if(wave>=maxWave){finish(true)}}
else{
waitNext-=dt
if(waitNext<=0){waitNext=0;wave++;spawnWave()}
}
}
render()
hud()
}
raf=requestAnimationFrame(tick)
return()=>{
cancelAnimationFrame(raf)
removeEventListener('keydown',kd)
removeEventListener('keyup',ku)
removeEventListener('pointerup',up)
document.removeEventListener('mousemove',onmove)
document.removeEventListener('pointerlockchange',onlock)
ro.disconnect()
document.exitPointerLock?.()
wrap.remove()
}
}
