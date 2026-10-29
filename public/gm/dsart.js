const O='#140b1c'
const mk=(w,h,S)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*S);c.height=Math.ceil(h*S);const g=c.getContext('2d');g.scale(S,S);g.lineJoin='round';g.lineCap='round';return[c,g]}
export const rg=(g,x,y,r0,r1,st)=>{const q=g.createRadialGradient(x,y,r0,x,y,r1);st.forEach(([o,c])=>q.addColorStop(o,c));return q}
export const lg=(g,x0,y0,x1,y1,st)=>{const q=g.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,c])=>q.addColorStop(o,c));return q}
const out=(g,w,c)=>{g.strokeStyle=c||O;g.lineWidth=w||2;g.stroke()}
export const glow=(g,x,y,r,c)=>{g.fillStyle=rg(g,x,y,0,r,[[0,c],[1,'rgba(0,0,0,0)']]);g.fillRect(x-r,y-r,r*2,r*2)}
const spr=(w,h,ax,ay,S,fn)=>{const[c,g]=mk(w,h,S);fn(g);return{c,w,h,ax,ay}}
export const draw=(c,s,x,y,k,flip)=>{k=k||1;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(s.c,-s.ax*k,-s.ay*k,s.w*k,s.h*k);c.restore()}
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.roundRect(x,y,w,h,r)}
const seed=n=>{let s=n;return()=>(s=(s*16807)%2147483647)/2147483647}
const jack=(g,x,y,s,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(x-s*.55,y-s*.05);g.lineTo(x-s*.18,y-s*.05);g.lineTo(x-s*.36,y-s*.42);g.moveTo(x+s*.55,y-s*.05);g.lineTo(x+s*.18,y-s*.05);g.lineTo(x+s*.36,y-s*.42);g.moveTo(x-s*.55,y+s*.2);g.lineTo(x-s*.3,y+s*.5);g.lineTo(x-s*.1,y+s*.3);g.lineTo(x+s*.1,y+s*.5);g.lineTo(x+s*.3,y+s*.3);g.lineTo(x+s*.55,y+s*.2);g.lineTo(x,y+s*.1);g.fill()}
const head=(g,t,cx,cy,b)=>{
if(t==='skin'){
g.beginPath();g.ellipse(cx,cy,14,15,0,0,6.283);g.fillStyle=rg(g,cx-4,cy-6,2,18,[[0,'#ffe9d2'],[1,'#e8b48a']]);g.fill();out(g,2)
g.beginPath();g.moveTo(cx-15,cy-3);g.quadraticCurveTo(cx-16,cy-18,cx,cy-17);g.quadraticCurveTo(cx+15,cy-18,cx+15,cy-3);g.quadraticCurveTo(cx+8,cy-10,cx-2,cy-9);g.quadraticCurveTo(cx-10,cy-8,cx-15,cy-3);g.fillStyle=lg(g,0,cy-18,0,cy-4,[[0,'#6b3f1f'],[1,'#4a2a14']]);g.fill();out(g,2)
for(const d of[-5.5,5.5]){g.beginPath();g.ellipse(cx+d,cy+1,2.8,3.4,0,0,6.283);g.fillStyle='#fff';g.fill();g.beginPath();g.arc(cx+d+.5,cy+1.6,1.8,0,6.283);g.fillStyle='#1a1226';g.fill()}
g.fillStyle='rgba(255,130,130,.4)';g.beginPath();g.arc(cx-9,cy+6,2.6,0,6.283);g.arc(cx+9,cy+6,2.6,0,6.283);g.fill()
g.beginPath();g.arc(cx,cy+7,3,.2,2.9);g.strokeStyle='#8a4a3a';g.lineWidth=1.4;g.stroke()
}else if(t==='pumpkin'){
g.beginPath();g.moveTo(cx-3,cy-12);g.quadraticCurveTo(cx-2,cy-19,cx+1,cy-21);g.lineTo(cx+5,cy-20);g.quadraticCurveTo(cx+3,cy-15,cx+4,cy-12);g.closePath();g.fillStyle=lg(g,cx-4,0,cx+5,0,[[0,'#3d5a14'],[1,'#7da02c']]);g.fill();out(g,1.6)
g.beginPath();g.ellipse(cx,cy,17,14,0,0,6.283);g.fillStyle=rg(g,cx-5,cy-5,2,22,[[0,'#ffc15a'],[.45,'#ff8a1e'],[1,'#b8400a']]);g.fill();out(g,2)
g.strokeStyle='rgba(120,40,0,.5)';g.lineWidth=1.4;for(const k of[-8,0,8]){g.beginPath();g.ellipse(cx+k,cy,4,13,0,0,6.283);g.stroke()}
glow(g,cx,cy,16,'rgba(255,230,120,.55)');jack(g,cx,cy,19,'#fff0a0')
}else{
const bl=[[-10,2,11],[0,-5,13],[10,2,11],[-5,8,10],[6,8,10]]
for(const[x,y,r]of bl){g.beginPath();g.arc(cx+x,cy+y,r,0,6.283);g.fillStyle=rg(g,cx+x-3,cy+y-4,1,r+2,[[0,'#ffffff'],[1,'#c9d8f2']]);g.fill();out(g,1.6,'#6f7fb8')}
for(const[x,y,r]of bl.slice(0,3)){g.beginPath();g.arc(cx+x,cy+y,r-1.4,0,6.283);g.fillStyle=rg(g,cx+x-3,cy+y-4,1,r,[[0,'rgba(255,255,255,.9)'],[1,'rgba(220,230,250,.2)']]);g.fill()}
for(const d of[-5,5]){g.beginPath();g.ellipse(cx+d,cy+2,2.2,3,0,0,6.283);g.fillStyle='#26304f';g.fill();g.beginPath();g.arc(cx+d+.6,cy+1,.8,0,6.283);g.fillStyle='#fff';g.fill()}
g.fillStyle='rgba(255,150,170,.5)';g.beginPath();g.arc(cx-9,cy+7,2.4,0,6.283);g.arc(cx+9,cy+7,2.4,0,6.283);g.fill()
g.beginPath();g.arc(cx,cy+7,2.6,.2,2.9);g.strokeStyle='#4a5486';g.lineWidth=1.3;g.stroke()
}
}
const body=(g,f,hd)=>{
const sw=f?2:-2
g.beginPath();g.moveTo(20,50);g.lineTo(20,70+(f?0:2));g.lineTo(26,70+(f?0:2));g.lineTo(27,56);g.lineTo(29,56);g.lineTo(30,70+(f?2:0));g.lineTo(36,70+(f?2:0));g.lineTo(36,50);g.closePath();g.fillStyle=lg(g,0,50,0,72,[[0,'#3a4a86'],[1,'#222d58']]);g.fill();out(g,2)
g.beginPath();g.roundRect(18,69+(f?0:2),10,6,3);g.roundRect(28,69+(f?2:0),10,6,3);g.fillStyle=lg(g,0,69,0,75,[[0,'#ffffff'],[1,'#c9c6d8']]);g.fill();out(g,1.6)
g.beginPath();g.moveTo(17,58+sw*.3);g.lineTo(14,46);g.lineTo(18,38);g.lineTo(22,40);g.lineTo(21,58+sw*.3);g.closePath();g.fillStyle='#4d3fb0';g.fill();out(g,1.8)
g.beginPath();g.moveTo(39,58-sw*.3);g.lineTo(42,46);g.lineTo(38,38);g.lineTo(34,40);g.lineTo(35,58-sw*.3);g.closePath();g.fillStyle='#4d3fb0';g.fill();out(g,1.8)
g.beginPath();g.moveTo(17,52);g.quadraticCurveTo(14,38,20,36);g.lineTo(36,36);g.quadraticCurveTo(42,38,39,52);g.closePath();g.fillStyle=lg(g,0,36,0,54,[[0,'#7a69e6'],[1,'#4a3aa8']]);g.fill();out(g,2)
g.beginPath();g.roundRect(22,45,12,6,3);g.fillStyle='rgba(20,10,60,.35)';g.fill()
g.beginPath();g.arc(28,36,6,0,Math.PI);g.fillStyle='#5d4bd0';g.fill();out(g,1.6)
head(g,hd,28,22,f)
}
export function art(S){
const A={kid:{}}
for(const t of['skin','pumpkin','cloud'])A.kid[t]=[0,1].map(f=>spr(56,80,28,76,S,g=>body(g,f,t)))
A.mom=spr(100,110,50,106,S,g=>{
g.beginPath();g.roundRect(4,50,92,56,14);g.fillStyle=lg(g,0,50,0,106,[[0,'#8a3a4a'],[1,'#5a2030']]);g.fill();out(g,2.2)
g.beginPath();g.roundRect(10,36,16,70,8);g.roundRect(74,36,16,70,8);g.fillStyle='#74303f';g.fill();out(g,2)
g.beginPath();g.roundRect(30,48,40,48,10);g.fillStyle=lg(g,0,48,0,96,[[0,'#c9a7d8'],[1,'#8f6aa8']]);g.fill();out(g,2)
g.beginPath();g.ellipse(50,34,13,14,0,0,6.283);g.fillStyle=rg(g,46,28,2,18,[[0,'#ffe9d2'],[1,'#e8b48a']]);g.fill();out(g,2)
g.beginPath();g.arc(50,20,16,Math.PI,0);g.lineTo(66,34);g.quadraticCurveTo(50,26,34,34);g.closePath();g.fillStyle='#5a3a24';g.fill();out(g,2)
g.beginPath();g.arc(50,8,7,0,6.283);g.fillStyle='#5a3a24';g.fill();out(g,1.8)
for(const d of[-5,5]){g.beginPath();g.arc(50+d,35,1.8,0,6.283);g.fillStyle='#1a1226';g.fill()}
g.beginPath();g.arc(50,40,3,.2,2.9);g.strokeStyle='#8a4a3a';g.lineWidth=1.4;g.stroke()
g.fillStyle='rgba(255,130,130,.4)';g.beginPath();g.arc(40,39,2.4,0,6.283);g.arc(60,39,2.4,0,6.283);g.fill()
})
A.cocoa=[0,1].map(f=>spr(70,110,35,106,S,g=>{
g.beginPath();g.moveTo(22,60);g.lineTo(20,100);g.lineTo(32,100);g.lineTo(34,70);g.lineTo(36,70);g.lineTo(38,100+(f?2:0));g.lineTo(50,100+(f?2:0));g.lineTo(48,60);g.closePath();g.fillStyle='#2b1810';g.fill();out(g,2)
g.beginPath();g.roundRect(17,98,17,8,3);g.roundRect(37,98+(f?2:0),17,8,3);g.fillStyle='#1a0f0a';g.fill();out(g,1.6)
g.beginPath();g.moveTo(14,44);g.lineTo(10,92);g.lineTo(60,92);g.lineTo(56,44);g.closePath();g.fillStyle=lg(g,0,44,0,92,[[0,'#ffffff'],[1,'#cfd3e6']]);g.fill();out(g,2.2)
g.strokeStyle='#9aa0c0';g.lineWidth=1.4;g.beginPath();g.moveTo(35,48);g.lineTo(35,92);g.stroke()
g.beginPath();g.roundRect(41,62,10,8,2);g.fillStyle='#e04b4b';g.fill();out(g,1.2)
g.beginPath();g.roundRect(12,40,46,16,5);g.fillStyle='#b5b9d4';g.fill();out(g,1.6)
g.beginPath();g.roundRect(8,50,8,34,4);g.roundRect(54,50,8,34,4);g.fillStyle='#fff';g.fill();out(g,1.8)
g.beginPath();g.roundRect(12,2,46,44,8);g.fillStyle=lg(g,0,2,0,46,[[0,'#8a5434'],[1,'#4a2614']]);g.fill();out(g,2.4)
g.strokeStyle='rgba(30,12,4,.55)';g.lineWidth=1.6
for(const x of[27,43])for(const y of[]){}
g.beginPath();g.moveTo(12,24);g.lineTo(58,24);g.moveTo(35,2);g.lineTo(35,46);g.stroke()
g.fillStyle='rgba(255,220,180,.28)';g.beginPath();g.roundRect(15,5,17,17,4);g.fill()
g.beginPath();g.roundRect(14,14,42,13,6);g.fillStyle='#9ee6ff';g.fill();out(g,1.8)
for(const x of[25,45]){g.beginPath();g.arc(x,20,5,0,6.283);g.fillStyle='#fff';g.fill();g.beginPath();g.arc(x+1,20.5,2.4,0,6.283);g.fillStyle='#1a0f0a';g.fill()}
g.beginPath();g.arc(35,36,5,.15,Math.PI-.15);g.strokeStyle='#f6d9b8';g.lineWidth=1.8;g.stroke()
}))
A.sheep=spr(90,70,45,64,S,g=>{
for(const[x,y,r]of[[22,34,16],[40,26,18],[60,32,17],[32,44,16],[52,46,16]]){g.beginPath();g.arc(x,y,r,0,6.283);g.fillStyle=rg(g,x-4,y-5,2,r+2,[[0,'#fff'],[1,'#d7e2f7']]);g.fill();out(g,1.8,'#7a8cc0')}
g.beginPath();g.ellipse(70,40,10,9,0,0,6.283);g.fillStyle='#3a3552';g.fill();out(g,1.8)
g.beginPath();g.arc(73,38,1.6,0,6.283);g.fillStyle='#fff';g.fill()
for(const x of[30,56]){g.beginPath();g.roundRect(x,54,6,10,2);g.fillStyle='#3a3552';g.fill()}
})
A.bench=spr(80,40,40,38,S,g=>{
g.beginPath();g.roundRect(4,8,72,10,3);g.fillStyle=lg(g,0,8,0,18,[[0,'#b57a3a'],[1,'#7a4a1c']]);g.fill();out(g,2)
g.beginPath();g.roundRect(4,20,72,8,3);g.fillStyle=lg(g,0,20,0,28,[[0,'#a56a2c'],[1,'#6a3e14']]);g.fill();out(g,2)
for(const x of[10,64]){g.beginPath();g.roundRect(x,26,6,12,2);g.fillStyle='#4a2a10';g.fill();out(g,1.6)}
})
A.lab=spr(190,170,95,160,S,g=>{
g.beginPath();g.roundRect(14,60,162,100,10);g.fillStyle=lg(g,0,60,0,160,[[0,'#cdd6e8'],[1,'#8f9cbb']]);g.fill();out(g,2.4)
g.beginPath();g.ellipse(95,64,70,52,0,Math.PI,0);g.fillStyle=lg(g,0,12,0,64,[[0,'rgba(180,240,255,.85)'],[1,'rgba(120,180,230,.55)']]);g.fill();out(g,2.4)
g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;g.beginPath();g.arc(95,64,50,Math.PI*1.1,Math.PI*1.5);g.stroke()
g.beginPath();g.roundRect(70,98,50,62,6);g.fillStyle='#10172a';g.fill();out(g,2)
g.beginPath();g.roundRect(76,104,38,30,3);g.fillStyle=lg(g,0,104,0,134,[[0,'#2fd6a1'],[1,'#126b58']]);g.fill()
g.beginPath();g.roundRect(24,82,34,26,3);g.roundRect(132,82,34,26,3);g.fillStyle='#223';g.fill();out(g,1.6)
glow(g,41,95,22,'rgba(120,255,220,.35)');glow(g,149,95,22,'rgba(120,255,220,.35)')
g.beginPath();g.roundRect(46,70,98,14,4);g.fillStyle='#e04b4b';g.fill();out(g,1.8)
g.fillStyle='#fff';g.font='800 10px sans-serif';g.textAlign='center';g.fillText('SCIENCE LAB',95,81)
g.beginPath();g.moveTo(95,12);g.lineTo(95,0);g.strokeStyle='#8f9cbb';g.lineWidth=2;g.stroke();g.beginPath();g.arc(95,0,3,0,6.283);g.fillStyle='#ff6b6b';g.fill()
})
A.wisp=spr(40,40,20,20,S,g=>{glow(g,20,20,20,'rgba(255,240,150,.55)');g.beginPath();g.arc(20,20,6,0,6.283);g.fillStyle=rg(g,18,18,0,7,[[0,'#fff'],[1,'#ffe27a']]);g.fill()})
A.tree=spr(70,100,35,96,S,g=>{
g.beginPath();g.roundRect(30,60,10,36,3);g.fillStyle=lg(g,30,0,40,0,[[0,'#9a6a3a'],[1,'#6a4220']]);g.fill();out(g,2)
for(const[x,y,r]of[[35,36,24],[20,48,17],[50,48,17],[35,22,16]]){g.beginPath();g.arc(x,y,r,0,6.283);g.fillStyle=rg(g,x-5,y-6,2,r+2,[[0,'#ffd6ea'],[1,'#e58fc0']]);g.fill();out(g,2,'#9a4a82')}
})
return A
}
export function island(S){
const W=1400,H=900,[c,g]=mk(W,H,S),R=seed(7)
g.fillStyle=rg(g,700,780,10,420,[[0,'rgba(60,40,90,.35)'],[1,'rgba(0,0,0,0)']]);g.beginPath();g.ellipse(700,800,520,90,0,0,6.283);g.fill()
g.beginPath();g.moveTo(140,470);g.quadraticCurveTo(220,760,700,840);g.quadraticCurveTo(1180,760,1260,470);g.lineTo(140,470);g.fillStyle=lg(g,0,470,0,840,[[0,'#9a6a4a'],[1,'#4a3052']]);g.fill();out(g,3,'#2a1838')
for(let i=0;i<14;i++){const x=220+R()*960,y=500+R()*240,w=20+R()*40;g.beginPath();g.ellipse(x,y,w,w*.4,0,0,6.283);g.fillStyle='rgba(40,20,50,.28)';g.fill()}
g.beginPath();g.ellipse(700,450,560,330,0,0,6.283);g.fillStyle=lg(g,0,120,0,780,[[0,'#baf0a8'],[1,'#6fcf86']]);g.fill();out(g,3,'#2f7a52')
g.beginPath();g.ellipse(700,462,520,296,0,0,6.283);g.fillStyle=rg(g,640,380,20,520,[[0,'#d8ffc4'],[1,'#7fe09a']]);g.fill()
g.save();g.beginPath();g.ellipse(700,450,540,312,0,0,6.283);g.clip()
for(let i=0;i<260;i++){const x=150+R()*1100,y=130+R()*640;g.strokeStyle='rgba(40,140,80,.4)';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x-3,y-9);g.moveTo(x,y);g.lineTo(x+3,y-8);g.stroke()}
for(let i=0;i<70;i++){const x=150+R()*1100,y=130+R()*640,col=['#ffffff','#ffe27a','#ff9ac2','#a9c7ff'][i%4];g.fillStyle=col;for(let k=0;k<5;k++){g.beginPath();g.arc(x+Math.cos(k*1.256)*3.4,y+Math.sin(k*1.256)*3.4,2.4,0,6.283);g.fill()}g.fillStyle='#ffb347';g.beginPath();g.arc(x,y,1.8,0,6.283);g.fill()}
g.beginPath();g.moveTo(480,560);g.bezierCurveTo(620,520,800,470,1000,350);g.lineWidth=40;g.strokeStyle='rgba(235,220,190,.9)';g.stroke();g.lineWidth=34;g.strokeStyle='#e8d8b0';g.stroke()
g.restore()
g.beginPath();g.ellipse(700,660,120,44,0,0,6.283);g.fillStyle=rg(g,700,660,10,130,[[0,'#bff0ff'],[1,'#5bb7e6']]);g.fill();out(g,3,'#3a7ab0')
for(let i=0;i<14;i++){const a=i/14*6.283;g.beginPath();g.arc(700+Math.cos(a)*126,660+Math.sin(a)*47,7,0,6.283);g.fillStyle='#a9a3b8';g.fill();out(g,1.6)}
return{c,W,H}
}
export function lab(S){
const W=960,H=540,[c,g]=mk(W,H,S)
g.fillStyle=lg(g,0,0,0,200,[[0,'#0b1220'],[1,'#17233a']]);g.fillRect(0,0,W,210)
g.fillStyle=lg(g,0,200,0,H,[[0,'#1b2740'],[1,'#0e1626']]);g.fillRect(0,200,W,H-200)
g.strokeStyle='rgba(120,170,255,.08)';g.lineWidth=1
for(let x=-400;x<=1360;x+=70){g.beginPath();g.moveTo(480+(x-480)*.35,210);g.lineTo(x,H);g.stroke()}
for(let y=0;y<9;y++){const yy=210+Math.pow(y/8,1.7)*330;g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke()}
for(let x=20;x<W;x+=120){g.fillStyle='rgba(120,170,255,.08)';g.fillRect(x,30,70,120);g.strokeStyle='rgba(120,170,255,.18)';g.strokeRect(x+.5,30.5,70,120)}
g.fillStyle='#223049';g.fillRect(0,196,W,16);g.fillStyle='#3a4a6a';g.fillRect(0,196,W,3)
for(const x of[120,250,610,740]){
g.beginPath();g.roundRect(x-2,100,134,112,6);g.fillStyle='#202c44';g.fill();out(g,2,'#0a1020')
g.beginPath();g.roundRect(x+6,108,118,96,4);g.fillStyle=lg(g,0,108,0,204,[[0,'#16405a'],[1,'#0a1c2c']]);g.fill()
g.fillStyle='rgba(180,240,255,.1)';g.beginPath();g.moveTo(x+14,108);g.lineTo(x+54,108);g.lineTo(x+20,204);g.lineTo(x+6,204);g.fill()
g.fillStyle='#ff4b4b';g.beginPath();g.arc(x+124,100,3,0,6.283);g.fill()
}
g.beginPath();g.roundRect(372,92,216,120,8);g.fillStyle='#0a0f1c';g.fill();out(g,2.4,'#05080f')
g.beginPath();g.roundRect(60,300,66,112,4);g.fillStyle=lg(g,0,300,0,412,[[0,'#ecdcc0'],[1,'#c9b48e']]);g.fill();out(g,2,'#3a2a14')
g.beginPath();g.roundRect(68,308,50,18,2);g.fillStyle='#8a1d1d';g.fill()
g.fillStyle='#fff';g.font='900 9px sans-serif';g.textAlign='center';g.fillText('HOLD THE LINE',93,320)
g.fillStyle='#3a2a14';for(let i=0;i<6;i++){g.beginPath();g.arc(77+(i%3)*16,344+Math.floor(i/3)*20,5,0,6.283);g.fill();g.fillRect(73+(i%3)*16,349+Math.floor(i/3)*20,8,8)}
g.fillStyle='#8a1d1d';g.fillRect(70,388,46,4);g.fillStyle='#3a2a14';g.font='700 7px sans-serif';g.fillText('REINFORCE. BREACH.',93,401)
g.beginPath();g.roundRect(852,296,62,100,5);g.fillStyle='#1a2236';g.fill();out(g,2,'#05080f')
g.beginPath();g.roundRect(858,302,50,56,3);g.fillStyle='#04160f';g.fill()
g.beginPath();g.roundRect(440,516,80,24,4);g.fillStyle='#05080f';g.fill();g.fillStyle='rgba(120,255,200,.5)';g.fillRect(446,520,68,3)
return{c,W,H}
}
export function room(S,kind){
const W=960,H=540,[c,g]=mk(W,H,S)
if(kind==='living'){
g.fillStyle=lg(g,0,0,0,H,[[0,'#5a3a2a'],[1,'#3a241a']]);g.fillRect(0,0,W,H)
for(let x=0;x<W;x+=48){g.fillStyle=x%96?'rgba(255,210,150,.05)':'rgba(0,0,0,.08)';g.fillRect(x,0,24,430)}
g.fillStyle=lg(g,0,430,0,H,[[0,'#7a4a2a'],[1,'#3a2012']]);g.fillRect(0,430,W,110)
for(let x=0;x<W;x+=90){g.strokeStyle='rgba(0,0,0,.25)';g.beginPath();g.moveTo(x,430);g.lineTo(x-30,H);g.stroke()}
g.fillStyle='#2a1810';g.fillRect(0,424,W,10)
g.beginPath();g.roundRect(120,90,150,210,6);g.fillStyle='#1a2540';g.fill();out(g,5,'#d9b98a')
g.fillStyle=lg(g,0,100,0,290,[[0,'#2b3f78'],[1,'#10183a']]);g.fillRect(126,96,138,198)
g.fillStyle='rgba(255,255,230,.9)';g.beginPath();g.arc(215,150,18,0,6.283);g.fill()
g.strokeStyle='#d9b98a';g.lineWidth=4;g.beginPath();g.moveTo(195,96);g.lineTo(195,294);g.moveTo(126,195);g.lineTo(264,195);g.stroke()
g.beginPath();g.ellipse(480,480,200,36,0,0,6.283);g.fillStyle='#7a2a3a';g.fill();out(g,2,'#2a0a14')
g.beginPath();g.ellipse(480,480,150,24,0,0,6.283);g.strokeStyle='#e8c88a';g.lineWidth=2;g.stroke()
g.beginPath();g.roundRect(330,110,70,90,4);g.fillStyle='#d9b98a';g.fill();g.fillStyle='#5a7aa0';g.fillRect(338,118,54,74)
g.beginPath();g.roundRect(540,130,60,76,4);g.fillStyle='#d9b98a';g.fill();g.fillStyle='#a07a5a';g.fillRect(547,137,46,62)
}else if(kind==='hall'){
g.fillStyle=lg(g,0,0,0,H,[[0,'#2a1d2a'],[1,'#1a1220']]);g.fillRect(0,0,W,H)
for(let x=0;x<1700;x+=60){g.fillStyle='rgba(255,255,255,.03)';g.fillRect(x,0,30,430)}
g.fillStyle='#2a1810';g.fillRect(0,430,W*2,110)
}
return{c,W,H}
}
