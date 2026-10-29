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
const legs=[[18,40,3,28,1,54],[20,44,5,45,3,62],[24,48,12,57,9,63],[28,50,21,59,18,63],[46,40,61,28,63,54],[44,44,59,45,61,62],[40,48,52,57,55,63],[36,50,43,59,46,63]]
g.strokeStyle='#050102';g.lineWidth=3.4
for(const l of legs){g.beginPath();g.moveTo(l[0],l[1]);g.lineTo(l[2],l[3]);g.lineTo(l[4],l[5]);g.stroke()}
g.strokeStyle='#6a2218';g.lineWidth=1.3
for(const l of legs){g.beginPath();g.moveTo(l[0],l[1]);g.lineTo(l[2],l[3]);g.lineTo(l[4],l[5]);g.stroke()}
g.fillStyle='#2a0a0c';g.strokeStyle='#050102';g.lineWidth=2.4
g.beginPath();g.ellipse(32,44,16,11,0,0,7);g.fill();g.stroke()
g.strokeStyle='#7a1a1c';g.lineWidth=1.2
for(let i=0;i<5;i++){g.beginPath();g.moveTo(20+i*6,36);g.quadraticCurveTo(22+i*6,44,20+i*6,52);g.stroke()}
g.fillStyle='#d9d0b4';g.strokeStyle='#050102';g.lineWidth=2.4
g.beginPath();g.ellipse(32,24,15,14,0,0,7);g.fill();g.stroke()
g.fillStyle='#b4a98a';g.beginPath();g.ellipse(26,17,6,4,.4,0,7);g.fill()
g.strokeStyle='#6a5a40';g.lineWidth=1;g.beginPath();g.moveTo(34,10);g.lineTo(31,18);g.lineTo(35,22);g.stroke()
g.fillStyle='#050102'
g.beginPath();g.ellipse(25,24,5.4,6.4,-.2,0,7);g.ellipse(39,24,5.4,6.4,.2,0,7);g.fill()
const eg=g.createRadialGradient(25,25,0,25,25,5);eg.addColorStop(0,'#ffec5a');eg.addColorStop(.5,'#ff2010');eg.addColorStop(1,'rgba(255,0,0,0)')
g.fillStyle=eg;g.fillRect(18,18,14,14)
const eg2=g.createRadialGradient(39,25,0,39,25,5);eg2.addColorStop(0,'#ffec5a');eg2.addColorStop(.5,'#ff2010');eg2.addColorStop(1,'rgba(255,0,0,0)')
g.fillStyle=eg2;g.fillRect(32,18,14,14)
g.fillStyle='#050102';g.beginPath();g.moveTo(32,28);g.lineTo(29.5,33);g.lineTo(34.5,33);g.closePath();g.fill()
g.fillStyle='#3a0508';g.strokeStyle='#050102';g.lineWidth=1.6
g.beginPath();g.moveTo(21,34);g.quadraticCurveTo(32,48,43,34);g.quadraticCurveTo(32,38,21,34);g.fill();g.stroke()
g.fillStyle='#efe6c8'
for(let i=0;i<7;i++){const x=22.5+i*3.2;g.beginPath();g.moveTo(x,35.2);g.lineTo(x+1.1,40+(i%2)*2.6);g.lineTo(x+2.2,35.6);g.fill()}
g.strokeStyle='#b0121c';g.lineWidth=1.6
g.beginPath();g.moveTo(25,39);g.lineTo(24.4,47);g.moveTo(37,40);g.lineTo(37.6,50);g.moveTo(31,41);g.lineTo(31,45);g.stroke()
})
const screamer=mk(64,64,(g,w,h)=>{
const gr=g.createRadialGradient(32,30,4,32,30,31);gr.addColorStop(0,'rgba(210,70,255,.5)');gr.addColorStop(1,'rgba(120,30,200,0)')
g.fillStyle=gr;g.fillRect(0,0,64,64)
g.fillStyle='rgba(50,16,70,.8)';g.strokeStyle='#0c0414';g.lineWidth=1.6
g.beginPath();g.moveTo(10,30);g.quadraticCurveTo(2,56,14,63);g.quadraticCurveTo(18,50,22,60);g.quadraticCurveTo(28,66,32,58);g.quadraticCurveTo(38,66,42,60);g.quadraticCurveTo(46,50,50,63);g.quadraticCurveTo(62,56,54,30);g.closePath();g.fill();g.stroke()
g.strokeStyle='#14081c';g.lineWidth=2.4
for(let i=0;i<9;i++){g.beginPath();g.moveTo(32,10);g.quadraticCurveTo(10+i*5,20+(i%3)*8,6+i*6.5,40+(i%2)*14);g.stroke()}
g.fillStyle='#ece8f4';g.strokeStyle='#0c0414';g.lineWidth=2
g.beginPath();g.moveTo(18,16);g.quadraticCurveTo(32,6,46,16);g.quadraticCurveTo(48,40,38,52);g.quadraticCurveTo(32,58,26,52);g.quadraticCurveTo(16,40,18,16);g.fill();g.stroke()
g.fillStyle='#c8c0d8';g.beginPath();g.ellipse(32,14,10,3,0,0,7);g.fill()
g.fillStyle='#050008'
g.beginPath();g.ellipse(24.5,26,5.6,8.4,-.14,0,7);g.ellipse(39.5,26,5.6,8.4,.14,0,7);g.fill()
g.fillStyle='#ff1a3a';g.beginPath();g.arc(24.5,28,1.8,0,7);g.arc(39.5,28,1.8,0,7);g.fill()
g.strokeStyle='#a00a1c';g.lineWidth=1.8
g.beginPath();g.moveTo(24.5,34);g.lineTo(23.6,48);g.moveTo(39.5,34);g.lineTo(40.4,50);g.stroke()
g.fillStyle='#050008';g.beginPath();g.ellipse(32,44,8.6,12,0,0,7);g.fill()
g.fillStyle='#4a0610';g.beginPath();g.ellipse(32,48,5.4,6,0,0,7);g.fill()
g.fillStyle='#ece8f4'
for(let i=0;i<5;i++){g.beginPath();g.moveTo(25.4+i*3.3,33);g.lineTo(26.6+i*3.3,38.4);g.lineTo(27.8+i*3.3,33);g.fill()}
for(let i=0;i<4;i++){g.beginPath();g.moveTo(27+i*3.4,55);g.lineTo(28.2+i*3.4,50.4);g.lineTo(29.4+i*3.4,55);g.fill()}
g.strokeStyle='#14081c';g.lineWidth=1.4;g.beginPath();g.moveTo(30,30);g.lineTo(32,35);g.lineTo(34,30);g.stroke()
})
const brute=mk(64,64,(g,w,h)=>{
g.lineJoin='round';g.lineCap='round'
g.fillStyle='#8a1a1c';g.strokeStyle='#150304';g.lineWidth=2.6
g.beginPath();g.moveTo(6,63);g.quadraticCurveTo(0,34,14,28);g.lineTo(50,28);g.quadraticCurveTo(64,34,58,63);g.closePath();g.fill();g.stroke()
g.fillStyle='#b02a28'
g.beginPath();g.ellipse(13,40,9,11,.3,0,7);g.ellipse(51,40,9,11,-.3,0,7);g.fill();g.stroke()
g.strokeStyle='#5a0a0e';g.lineWidth=1.2
for(const x of[8,12,16])g.strokeRect(x-3,32,0,16)
g.beginPath();g.moveTo(9,34);g.lineTo(17,48);g.moveTo(55,34);g.lineTo(47,48);g.stroke()
g.fillStyle='#e8dcbe';g.strokeStyle='#150304';g.lineWidth=1.6
for(let i=0;i<4;i++){g.beginPath();g.moveTo(24,34+i*7);g.quadraticCurveTo(32,31+i*7,40,34+i*7);g.lineTo(40,37+i*7);g.quadraticCurveTo(32,35+i*7,24,37+i*7);g.closePath();g.fill();g.stroke()}
g.beginPath();g.moveTo(32,31);g.lineTo(32,62);g.stroke()
g.fillStyle='#d9ccae';g.strokeStyle='#150304';g.lineWidth=2.2
g.beginPath();g.ellipse(32,18,14,13,0,0,7);g.fill();g.stroke()
g.beginPath();g.moveTo(20,10);g.quadraticCurveTo(10,6,8,0);g.quadraticCurveTo(18,2,24,8);g.closePath();g.moveTo(44,10);g.quadraticCurveTo(54,6,56,0);g.quadraticCurveTo(46,2,40,8);g.closePath();g.fill();g.stroke()
g.fillStyle='#050102';g.beginPath();g.ellipse(26,18,4.4,5,-.2,0,7);g.ellipse(38,18,4.4,5,.2,0,7);g.fill()
const e1=g.createRadialGradient(26,18,0,26,18,5);e1.addColorStop(0,'#fff27a');e1.addColorStop(.5,'#ff3a10');e1.addColorStop(1,'rgba(255,0,0,0)')
g.fillStyle=e1;g.fillRect(19,11,14,14)
const e2=g.createRadialGradient(38,18,0,38,18,5);e2.addColorStop(0,'#fff27a');e2.addColorStop(.5,'#ff3a10');e2.addColorStop(1,'rgba(255,0,0,0)')
g.fillStyle=e2;g.fillRect(31,11,14,14)
g.fillStyle='#050102';g.beginPath();g.moveTo(32,21);g.lineTo(30,25);g.lineTo(34,25);g.closePath();g.fill()
g.beginPath();g.moveTo(22,26);g.lineTo(42,26);g.lineTo(39,31);g.lineTo(25,31);g.closePath();g.fill()
g.fillStyle='#efe6c8';for(const x of[24,27,30,33,36,39]){g.beginPath();g.moveTo(x,26);g.lineTo(x+1.4,30);g.lineTo(x+2.4,26);g.fill()}
g.strokeStyle='#7a7a82';g.lineWidth=2.4
g.beginPath();g.moveTo(14,36);g.quadraticCurveTo(32,58,50,36);g.stroke()
g.strokeStyle='#d02020';g.lineWidth=1.6;g.beginPath();g.moveTo(22,28);g.lineTo(21,38);g.moveTo(44,28);g.lineTo(45,40);g.stroke()
})
const imp=mk(64,64,(g,w,h)=>{
g.lineJoin='round';g.lineCap='round'
g.fillStyle='#4a1010';g.strokeStyle='#0a0203';g.lineWidth=2.4
g.beginPath();g.moveTo(14,62);g.quadraticCurveTo(10,36,22,30);g.lineTo(42,30);g.quadraticCurveTo(54,36,50,62);g.closePath();g.fill();g.stroke()
g.fillStyle='#7a1c14'
g.beginPath();g.ellipse(32,44,11,13,0,0,7);g.fill()
g.fillStyle='#d8c8a0'
for(let i=0;i<5;i++){g.beginPath();g.moveTo(16+i*8,30);g.lineTo(18+i*8,20);g.lineTo(20+i*8,30);g.fill()}
g.fillStyle='#5a1612';g.strokeStyle='#0a0203'
g.beginPath();g.ellipse(32,22,11,10,0,0,7);g.fill();g.stroke()
g.fillStyle='#d8c8a0';g.beginPath();g.moveTo(22,15);g.lineTo(16,4);g.lineTo(27,12);g.closePath();g.moveTo(42,15);g.lineTo(48,4);g.lineTo(37,12);g.closePath();g.fill()
g.fillStyle='#ffa81a';g.beginPath();g.ellipse(27,21,3.2,2,.2,0,7);g.ellipse(37,21,3.2,2,-.2,0,7);g.fill()
g.fillStyle='#000';g.fillRect(26.4,20,1.2,2);g.fillRect(36.4,20,1.2,2)
g.fillStyle='#0a0203';g.beginPath();g.moveTo(24,27);g.quadraticCurveTo(32,34,40,27);g.quadraticCurveTo(32,30,24,27);g.fill()
g.fillStyle='#efe6c8';for(let i=0;i<6;i++){g.beginPath();g.moveTo(25+i*2.8,27.4);g.lineTo(26.2+i*2.8,30.4);g.lineTo(27.4+i*2.8,27.6);g.fill()}
g.strokeStyle='#4a1010';g.lineWidth=5;g.beginPath();g.moveTo(14,38);g.lineTo(5,26);g.stroke()
g.strokeStyle='#d8c8a0';g.lineWidth=1.6;g.beginPath();g.moveTo(5,26);g.lineTo(2,20);g.moveTo(5,26);g.lineTo(8,20);g.stroke()
const fb=g.createRadialGradient(5,20,0,5,20,13);fb.addColorStop(0,'#fff6b0');fb.addColorStop(.35,'#ffb020');fb.addColorStop(1,'rgba(255,60,0,0)')
g.fillStyle=fb;g.fillRect(-8,7,26,26)
})
const bomb=mk(64,64,(g,w,h)=>{
g.lineJoin='round';g.lineCap='round'
g.strokeStyle='#0a0203';g.lineWidth=3
g.beginPath();g.moveTo(26,60);g.lineTo(22,63);g.moveTo(38,60);g.lineTo(42,63);g.stroke()
g.strokeStyle='#3a5a14';g.lineWidth=3;g.beginPath();g.moveTo(32,10);g.quadraticCurveTo(36,4,42,6);g.stroke()
g.fillStyle='#ff8a1a';g.strokeStyle='#4a1a00';g.lineWidth=2.4
g.beginPath();g.ellipse(32,36,24,22,0,0,7);g.fill();g.stroke()
g.strokeStyle='#b8480a';g.lineWidth=1.6
for(const k of[-12,-5,5,12]){g.beginPath();g.ellipse(32+k,36,Math.abs(k)*.4+3,21,0,Math.PI*1.5,Math.PI*.5,k<0);g.stroke()}
g.fillStyle='#1a0800'
g.beginPath();g.moveTo(16,28);g.lineTo(28,32);g.lineTo(18,40);g.closePath();g.moveTo(48,28);g.lineTo(36,32);g.lineTo(46,40);g.closePath();g.fill()
g.beginPath();g.moveTo(14,44);g.lineTo(20,40);g.lineTo(24,48);g.lineTo(28,42);g.lineTo(32,50);g.lineTo(36,42);g.lineTo(40,48);g.lineTo(44,40);g.lineTo(50,44);g.quadraticCurveTo(32,60,14,44);g.fill()
g.fillStyle='#ffe27a'
g.beginPath();g.ellipse(21,34,1.8,2.6,0,0,7);g.ellipse(43,34,1.8,2.6,0,0,7);g.fill()
const fl=g.createRadialGradient(42,5,0,42,5,10);fl.addColorStop(0,'#ffffff');fl.addColorStop(.3,'#ffe27a');fl.addColorStop(1,'rgba(255,90,0,0)')
g.fillStyle=fl;g.fillRect(30,-6,26,24)
})
const fire=mk(32,32,(g,w,h)=>{
const f=g.createRadialGradient(16,16,0,16,16,15);f.addColorStop(0,'#ffffff');f.addColorStop(.25,'#ffe27a');f.addColorStop(.6,'#ff6a10');f.addColorStop(1,'rgba(255,20,0,0)')
g.fillStyle=f;g.fillRect(0,0,32,32)
})
const rage=mk(64,64,(g,w,h)=>{
const f=g.createRadialGradient(32,32,2,32,32,28);f.addColorStop(0,'rgba(255,60,40,.95)');f.addColorStop(1,'rgba(255,0,0,0)')
g.fillStyle=f;g.fillRect(0,0,64,64)
g.fillStyle='#e8e0c8';g.strokeStyle='#150304';g.lineWidth=2
g.beginPath();g.ellipse(32,30,12,12,0,0,7);g.fill();g.stroke()
g.beginPath();g.roundRect(24,38,16,10,3);g.fill();g.stroke()
g.fillStyle='#150304';g.beginPath();g.ellipse(27,30,3.4,4,0,0,7);g.ellipse(37,30,3.4,4,0,0,7);g.fill()
g.fillStyle='#ff2a1a';g.fillRect(26,29,2,2);g.fillRect(36,29,2,2)
g.fillStyle='#150304';for(const x of[27,31,35])g.fillRect(x,42,1.6,5)
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
return{crawler,screamer,brute,imp,bomb,fire,rage,pack,torch}
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
const TYPES={crawler:{hp:22,spd:1.5,dmg:6,r:.3,sz:.62,pts:4,sp:'crawler'},screamer:{hp:15,spd:2.5,dmg:5,r:.26,sz:.7,pts:5,sp:'screamer',fly:1},brute:{hp:70,spd:1.0,dmg:15,r:.42,sz:1.05,pts:12,sp:'brute'},imp:{hp:30,spd:1.3,dmg:8,r:.3,sz:.82,pts:6,sp:'imp'},bomb:{hp:12,spd:3.3,dmg:0,r:.3,sz:.7,pts:5,sp:'bomb'}}
const counts=fp?{crawler:fp.g,screamer:fp.p,brute:fp.j,imp:Math.round(fp.p/2),bomb:Math.round(fp.g/3)}:{crawler:3+night*2,screamer:1+night,brute:Math.floor(night/2),imp:Math.floor(night*1.2),bomb:Math.ceil(night/2)+1}
let fb=[],gibs=[],rageT=0,streak=0,streakT=0,ann='',annT=0,blackT=0,nextBlack=16,shake=0,beatT=0,ac=null
let enemies=[],pickups=[],wave=1,maxWave=fp?.inf?999:5,hp=100,t=0,over=false,shotCd=0,kills=0,flash=0,hurt=0,bob=0,recoil=0,bannerT=0,banner='',waitNext=0,raf=0,lastT=performance.now(),locked=false,fireHeld=false
const keys={}
function spawnWave(){
const k=fp?.inf?1+(wave-1)*.35:1+(wave-1)*.5
const list=[]
for(const ty of['crawler','screamer','brute','imp','bomb']){
let n=Math.round((counts[ty]||0)*k/ (fp?1:2))
if(!fp&&ty==='crawler')n=Math.max(2,Math.round((3+night*2)*k*.6))
if(!fp&&wave<2&&ty==='imp')n=0
if(!fp&&ty==='bomb')n=Math.max(1,n)
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
sfx('growl')
}
const au=()=>{try{if(!ac){ac=new AudioContext();const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=41;f.type='lowpass';f.frequency.value=120;g.gain.value=.05;o.connect(f);f.connect(g);g.connect(ac.destination);o.start()}if(ac.state==='suspended')ac.resume()}catch{}}
const tn=(f,d,v,ty,sl)=>{try{if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;o.type=ty||'sine';o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*sl),n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(n+d+.02)}catch{}}
const nz=(d,v,f0,f1)=>{try{if(!ac)return;const n=ac.currentTime,len=Math.floor(ac.sampleRate*d),b=ac.createBuffer(1,len,ac.sampleRate),c=b.getChannelData(0);for(let i=0;i<len;i++)c[i]=(Math.random()*2-1)*(1-i/len);const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=b;f.type='lowpass';f.frequency.setValueAtTime(f0,n);f.frequency.exponentialRampToValueAtTime(f1,n+d);g.gain.value=v;s.connect(f);f.connect(g);g.connect(ac.destination);s.start()}catch{}}
const sfx=k=>{
if(k==='shot'){nz(.45,.7,2400,150);tn(95,.3,.5,'sine',.4)}
else if(k==='pump'){tn(180,.06,.08,'square',.6);setTimeout(()=>tn(140,.07,.08,'square',.7),170)}
else if(k==='boom'){nz(.9,.9,900,50);tn(60,.6,.6,'sine',.4)}
else if(k==='growl'){tn(95,.6,.12,'sawtooth',.45);nz(.5,.12,300,60)}
else if(k==='screech'){tn(1400,.5,.05,'sawtooth',.4);tn(1100,.5,.04,'square',.5)}
else if(k==='hit'){nz(.12,.3,500,100);tn(120,.14,.2,'sine',.5)}
else if(k==='pick'){tn(500,.15,.07,'triangle',1.8)}
else if(k==='fire'){tn(420,.3,.07,'sawtooth',.35);nz(.25,.1,1800,300)}
else if(k==='beat'){tn(55,.14,.35,'sine',.6);setTimeout(()=>tn(48,.16,.28,'sine',.6),170)}
else if(k==='rage'){tn(220,.5,.1,'sawtooth',2.2)}
else if(k==='kill'){tn(160,.2,.14,'square',.4)}
}
const announce=(m,sec)=>{ann=m;annT=sec||1.6}
const gib=(x,y,n,col,z0)=>{for(let i=0;i<n&&gibs.length<220;i++){const a=Math.random()*6.283,v=.6+Math.random()*2.6;gibs.push({x,y,z:z0??.45,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:1+Math.random()*3,l:1.4+Math.random()*1.4,col:col[Math.floor(Math.random()*col.length)]})}}
const BLOOD=[px(150,10,14),px(190,20,20),px(110,6,10),px(220,60,40)],FIRE=[px(255,230,120),px(255,150,30),px(255,90,10)],BONE=[px(235,225,195),px(200,190,160)]
const explode=(x,y,src)=>{
sfx('boom');shake=Math.max(shake,1);flash=.25
gib(x,y,40,FIRE,.4);gib(x,y,16,BLOOD,.4)
const dp=Math.hypot(posX-x,posY-y)
if(dp<1.9){hp-=Math.round(26*(1-dp/1.9)+4);hurt=.9;shake=1.4}
let c=0
for(const e of enemies)if(e!==src&&Math.hypot(e.x-x,e.y-y)<2.1){e.hp-=48;e.fl=.2;c++}
if(c>=2)announce('CHAIN REACTION',2)
}
const kd=e=>{au();keys[e.key.toLowerCase()]=true;if(e.key===' ')e.preventDefault()}
const ku=e=>{keys[e.key.toLowerCase()]=false}
spawnWave()
addEventListener('keydown',kd)
addEventListener('keyup',ku)
const onmove=e=>{if(document.pointerLockElement===cv)ang+=e.movementX*.0024}
document.addEventListener('mousemove',onmove)
const onlock=()=>{locked=document.pointerLockElement===cv}
document.addEventListener('pointerlockchange',onlock)
let tx=null
const down=e=>{
if(e.pointerType==='touch'){tx={x:e.clientX,id:e.pointerId,moved:0,t:performance.now()};cv.setPointerCapture?.(e.pointerId);return}
au()
if(!locked)cv.requestPointerLock?.()
fireHeld=true
}
const up=e=>{
if(e.pointerType==='touch'&&tx){if(performance.now()-tx.t<260&&tx.moved<12)shoot();tx=null;return}
fireHeld=false
}
const mv=e=>{if(!locked&&e.pointerType!=='touch'&&(e.buttons&1))ang+=e.movementX*.004
if(tx&&e.pointerId===tx.id){const dx=e.clientX-tx.x;tx.x=e.clientX;tx.moved+=Math.abs(dx);ang+=dx*.006}}
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
shotCd=rageT>0?.34:.62
recoil=1
flash=.09
shake=Math.max(shake,.45)
sfx('shot');setTimeout(()=>sfx('pump'),160)
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
if(best){best.hp-=(14+Math.random()*6)*(bd<3?1.2:bd<6?1:.6)*(rageT>0?2:1);best.fl=.12;best.kx=(best.kx||0)+dx*.9;best.ky=(best.ky||0)+dy*.9;if(Math.random()<.5)gib(best.x,best.y,1,BLOOD,.5)}
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
const fk=(1+flash*2.2+(rageT>0?.1:0))*(blackT>0?.16:.88+.12*Math.sin(t*23)*Math.sin(t*7.3))
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
for(const o of pickups)sprites.push({x:o.x,y:o.y,img:o.k==='rage'?A.rage:A.pack,sz:.4,z:.85,glow:o.k==='rage'?1:0,ph:o.x})
for(const f of fb)sprites.push({x:f.x,y:f.y,img:A.fire,sz:.34,z:.5,glow:1,ph:f.x})
for(const g of gibs)sprites.push({x:g.x,y:g.y,col:g.col,sz:.07,z:g.z,glow:0,ph:0})
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
if(s.col){
const sz=Math.max(2,(sh*.9)|0),xa=scrX-(sz>>1),ya=half+vo-(sz>>1)
for(let xx=Math.max(0,xa);xx<Math.min(SW,xa+sz);xx++){if(tY>=zb[xx])continue;for(let yy=Math.max(0,ya);yy<Math.min(SH,ya+sz);yy++)pix[yy*SW+xx]=s.col}
continue
}
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
const sk=shake*10
ctx.drawImage(buf,-8+(Math.random()-.5)*sk,-8+(Math.random()-.5)*sk,cv.width+16,cv.height+16)
}
const gcv=document.createElement('canvas')
gcv.width=88;gcv.height=64
const gctx=gcv.getContext('2d',{willReadFrequently:true})
const FACES=[[1,3,7,5,1,0,0],[0,4,6,2,-1,0,0],[2,6,7,3,0,1,0],[0,1,5,4,0,-1,0],[4,5,7,6,0,0,1],[0,2,3,1,0,0,-1]]
function drawGun(W,H){
const gw=88,gh=64,f=56,bx=gw*.52,by=gh*.3
gctx.clearRect(0,0,gw,gh)
const ph=shotCd>0?1-shotCd/(rageT>0?.34:.62):1
const pump=ph>.28&&ph<.85?Math.sin((ph-.28)/.57*Math.PI)*.45:0
const gx=.3+Math.sin(bob)*.035,gy=-.06+Math.abs(Math.cos(bob))*.03+recoil*.08,gz=-recoil*.34
const yaw=-.15,pitch=recoil*.16
const cy_=Math.cos(yaw),sy_=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch)
const rot=(x,y,z)=>{let X=x*cy_+z*sy_,Z=-x*sy_+z*cy_;let Y=y*cp+Z*sp;Z=-y*sp+Z*cp;return[X,Y,Z]}
const parts=[
[0,-.2,2.15,.1,.1,2.1,[96,100,114]],
[0,-.31,2.0,.085,.085,1.7,[70,74,88]],
[0,-.2,3.2,.13,.13,.07,[34,36,42]],
[0,-.13,3.12,.03,.05,.04,[210,70,40]],
[0,-.22,1.0,.19,.2,.56,[108,112,126]],
[.1,-.2,1.0,.01,.07,.24,[18,18,22]],
[0,-.32,1.85-pump,.17,.13,.5,[150,96,46]],
[0,-.32,1.66-pump,.18,.04,.05,[84,52,26]],
[0,-.32,1.78-pump,.18,.04,.05,[84,52,26]],
[0,-.32,1.9-pump,.18,.04,.05,[84,52,26]],
[0,-.4,.72,.11,.32,.18,[112,70,36]],
[0,-.37,1.85-pump,.19,.09,.26,[210,168,124]],
[.02,-.5,.66,.15,.13,.2,[210,168,124]]
]
const L=[-.35,.8,-.45],ll=Math.hypot(...L)
const draw=[]
for(const[cx,cy,cz,w,h,d,col]of parts){
const cs=[]
for(let i=0;i<8;i++){const[X,Y,Z]=rot(cx+(i&1?w:-w)/2,cy+(i&2?h:-h)/2,cz+(i&4?d:-d)/2);cs.push([X+gx,Y+gy,Z+gz])}
for(const fc of FACES){
const n=rot(fc[4],fc[5],fc[6])
const p0=cs[fc[0]]
if(n[0]*p0[0]+n[1]*p0[1]+n[2]*p0[2]>=0)continue
const sh=(.32+.68*Math.max(0,(n[0]*L[0]+n[1]*L[1]+n[2]*L[2])/ll))*(1+flash*3)
let zs=0;for(let i=0;i<4;i++)zs+=cs[fc[i]][2]
draw.push({z:zs/4,pts:[0,1,2,3].map(i=>cs[fc[i]]),c:'rgb('+Math.min(255,col[0]*sh|0)+','+Math.min(255,col[1]*sh|0)+','+Math.min(255,col[2]*sh|0)+')'})
}
}
draw.sort((a,b)=>b.z-a.z)
gctx.lineWidth=1;gctx.strokeStyle='#0a0a10';gctx.lineJoin='round'
for(const q of draw){
gctx.fillStyle=q.c;gctx.beginPath()
q.pts.forEach((p,i)=>{const x=bx+p[0]/p[2]*f,y=by-p[1]/p[2]*f;i?gctx.lineTo(x,y):gctx.moveTo(x,y)})
gctx.closePath();gctx.fill();gctx.stroke()
}
if(flash>0){
const[X,Y,Z]=rot(0,-.2,3.3),mx=bx+(X+gx)/(Z+gz)*f,my=by-(Y+gy)/(Z+gz)*f
gctx.fillStyle='#ff8a1a';gctx.beginPath()
for(let i=0;i<14;i++){const a=i*Math.PI/7,r=i%2?5:13+Math.random()*4;const x=mx+Math.cos(a)*r,y=my+Math.sin(a)*r*.8;i?gctx.lineTo(x,y):gctx.moveTo(x,y)}
gctx.closePath();gctx.fill()
gctx.fillStyle='#fff3a0';gctx.beginPath();gctx.arc(mx,my,4,0,7);gctx.fill()
}
const id=gctx.getImageData(0,0,gw,gh),d=id.data
for(let i=0;i<d.length;i+=4){d[i+3]=d[i+3]>110?255:0;d[i]=(d[i]>>5)*36;d[i+1]=(d[i+1]>>5)*36;d[i+2]=(d[i+2]>>5)*36}
gctx.putImageData(id,0,0)
const sc=Math.max(3,Math.floor(H*.66/gh)),dw=gw*sc,dh=gh*sc
ctx.imageSmoothingEnabled=false
ctx.drawImage(gcv,Math.round((W-dw)/2),H-dh+Math.round(6*sc*.3),dw,dh)
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
drawGun(W,H)
if(rageT>0){ctx.fillStyle='rgba(255,20,0,'+(.1+Math.sin(t*12)*.04)+')';ctx.fillRect(0,0,W,H)}
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
if(annT>0){
ctx.globalAlpha=Math.min(1,annT)
ctx.font='900 '+Math.round(H/14)+'px system-ui,sans-serif'
ctx.textAlign='center'
ctx.fillStyle='#000';ctx.fillText(ann,W/2+3,H*.3+3)
ctx.fillStyle='#ff5a2a';ctx.fillText(ann,W/2,H*.3)
ctx.textAlign='left'
ctx.globalAlpha=1
}
if(rageT>0){ctx.fillStyle='rgba(8,4,8,.62)';ctx.fillRect(14,14+f*3.3+20,200,f*1.4);ctx.fillStyle='#ff3a1a';ctx.fillRect(18,14+f*3.3+24,192*Math.min(1,rageT/9),f*1.4-8);ctx.fillStyle='#fff';ctx.fillText('RAGE',24,14+f*3.3+25)}
if(!locked&&!tx&&!('ontouchstart' in window)){
ctx.font='700 '+Math.round(f)+'px system-ui,sans-serif'
ctx.textAlign='center'
ctx.fillStyle='rgba(8,4,8,.65)';ctx.fillRect(W/2-250,H-54,500,34)
ctx.fillStyle='#d8c9b0';ctx.fillText('Click to capture the mouse. WASD move, shift sprint, click fire',W/2,H-46)
ctx.textAlign='left'
}
}
function tick(now){
raf=requestAnimationFrame(tick)
const dt=Math.min(.05,(now-lastT)/1000)
lastT=now
if(over){render();hud();return}
t+=dt
rageT=Math.max(0,rageT-dt)
streakT-=dt;if(streakT<=0)streak=0
annT-=dt
shake=Math.max(0,shake-dt*2.2)
nextBlack-=dt
if(nextBlack<=0){nextBlack=14+Math.random()*18;blackT=.4;sfx('growl')}
blackT-=dt
beatT-=dt
if(hp<40&&beatT<=0){beatT=.45+hp/70;sfx('beat')}
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
streak++;streakT=2.4
const nm={2:'DOUBLE KILL',3:'TRIPLE KILL',4:'MULTI KILL',5:'MEGA KILL',6:'MONSTER KILL',8:'UNSTOPPABLE',10:'GODLIKE'}[streak]
if(nm)announce(nm)
sfx('kill')
if(e.d.bomb){if(!e.exp)explode(e.x,e.y,e)}else{gib(e.x,e.y,e.d.sp==='brute'?26:14,BLOOD);gib(e.x,e.y,5,BONE)}
const rr=Math.random()
if(rr<.07)pickups.push({x:e.x,y:e.y,k:'rage'})
else if(rr<.3)pickups.push({x:e.x,y:e.y,k:'med'})
enemies.splice(i,1)
continue
}
if(e.kx||e.ky){
const nx=e.x+e.kx*dt*3,ny=e.y+e.ky*dt*3
if(!collide(nx,e.y,e.d.r*.6))e.x=nx
if(!collide(e.x,ny,e.d.r*.6))e.y=ny
e.kx*=.88;e.ky*=.88
if(Math.abs(e.kx)<.01)e.kx=0
if(Math.abs(e.ky)<.01)e.ky=0
}
const dx=posX-e.x,dy=posY-e.y,d=Math.hypot(dx,dy)||1
const isImp=e.d.sp==='imp'
if(isImp){e.cd-=dt;if(d<8&&e.cd<=0&&wallDist(e.x,e.y,dx/d,dy/d)>d){e.cd=2.3;fb.push({x:e.x,y:e.y,vx:dx/d*3.6,vy:dy/d*3.6,l:4});sfx('fire')}}
if(e.d.bomb&&d<.85){e.exp=1;e.hp=0;explode(e.x,e.y,e)}
else if(isImp&&d<6&&d>2.4){}
else if(d>e.d.r+.35){
const sp2=e.d.spd*(1+(wave-1)*.05)*dt
const nx=e.x+dx/d*sp2,ny=e.y+dy/d*sp2
if(!collide(nx,e.y,e.d.r*.6))e.x=nx
else if(!collide(e.x,e.y+Math.sign(dy)*sp2,e.d.r*.6))e.y+=Math.sign(dy)*sp2
if(!collide(e.x,ny,e.d.r*.6))e.y=ny
else if(!collide(e.x+Math.sign(dx)*sp2,e.y,e.d.r*.6))e.x+=Math.sign(dx)*sp2
}else{
e.cd-=dt
if(e.cd<=0){e.cd=.9;hp-=e.d.dmg;hurt=.7;shake=Math.max(shake,.6);sfx('hit')}
}
}
for(let i=fb.length-1;i>=0;i--){
const f=fb[i]
f.x+=f.vx*dt;f.y+=f.vy*dt;f.l-=dt
if(cell(Math.floor(f.x),Math.floor(f.y))||f.l<=0){fb.splice(i,1);continue}
if(Math.hypot(f.x-posX,f.y-posY)<.35){hp-=9;hurt=.8;shake=Math.max(shake,.7);sfx('hit');fb.splice(i,1)}
}
for(let i=gibs.length-1;i>=0;i--){
const g=gibs[i]
g.l-=dt;g.vz-=9*dt;g.z+=g.vz*dt
const nx=g.x+g.vx*dt,ny=g.y+g.vy*dt
if(!cell(Math.floor(nx),Math.floor(g.y)))g.x=nx;else g.vx*=-.4
if(!cell(Math.floor(g.x),Math.floor(ny)))g.y=ny;else g.vy*=-.4
if(g.z<.03){g.z=.03;g.vz*=-.3;g.vx*=.6;g.vy*=.6}
if(g.l<=0)gibs.splice(i,1)
}
for(let i=pickups.length-1;i>=0;i--){
const p=pickups[i]
if(Math.hypot(p.x-posX,p.y-posY)<.5){
if(p.k==='rage'){rageT=9;announce('RAGE MODE',2);sfx('rage')}else{hp=Math.min(100,hp+20);sfx('pick')}
pickups.splice(i,1)
}
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
try{ac?.close()}catch{}
wrap.remove()
}
}
