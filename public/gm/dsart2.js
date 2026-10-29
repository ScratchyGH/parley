import{rg,lg,glow}from'./dsart.js'
const O='#140b1c'
const mk=(w,h,S)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*S);c.height=Math.ceil(h*S);const g=c.getContext('2d');g.scale(S,S);g.lineJoin='round';g.lineCap='round';return[c,g]}
const out=(g,w,c)=>{g.strokeStyle=c||O;g.lineWidth=w||2;g.stroke()}
const spr=(w,h,ax,ay,S,fn)=>{const[c,g]=mk(w,h,S);fn(g);return{c,w,h,ax,ay}}
const ch=(g,x,y,w,h,r)=>{g.beginPath();g.roundRect(x,y,w,h,r||4);g.fillStyle=lg(g,0,y,0,y+h,[[0,'#9a6038'],[.5,'#6a3a1e'],[1,'#3e200e']]);g.fill();out(g,2.2);g.strokeStyle='rgba(255,210,160,.35)';g.lineWidth=1.4;g.beginPath();g.moveTo(x+3,y+h-3);g.lineTo(x+3,y+3);g.lineTo(x+w-3,y+3);g.stroke();g.strokeStyle='rgba(0,0,0,.4)';g.beginPath();g.moveTo(x+w-3,y+3);g.lineTo(x+w-3,y+h-3);g.lineTo(x+3,y+h-3);g.stroke()}
const vein=(g,pts,w)=>{g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.strokeStyle='#ffb347';g.lineWidth=w||3;g.shadowColor='#ff7a1a';g.shadowBlur=8;g.stroke();g.shadowBlur=0}
export function art2(S){
const A={}
A.boss=[0,1,2].map(f=>spr(240,250,120,244,S,g=>{
const b=f===1?6:0,a=f===2
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(120,240,80,14,0,0,6.283);g.fill()
ch(g,64,150,44,84+(f===1?0:b),10);ch(g,132,150,44,84+(f===1?b:0),10)
g.beginPath();g.roundRect(56,226+(f===1?0:b)*0,60,16,6);g.roundRect(124,226,60,16,6);g.fillStyle='#1c0e08';g.fill();out(g,2)
g.beginPath();g.moveTo(54,168);g.lineTo(48,236);g.lineTo(66,224);g.lineTo(80,238);g.lineTo(96,222);g.lineTo(110,236);g.lineTo(130,222);g.lineTo(146,238);g.lineTo(164,224);g.lineTo(182,236);g.lineTo(188,168);g.closePath();g.fillStyle=lg(g,0,168,0,238,[[0,'#d7dbea'],[1,'#7e86a6']]);g.fill();out(g,2.2)
g.fillStyle='rgba(60,40,80,.5)';g.beginPath();g.moveTo(60,180);g.lineTo(76,206);g.lineTo(64,214);g.closePath();g.fill()
for(let r=0;r<3;r++)for(let c=0;c<3;c++)ch(g,70+c*34,70+r*34,32,32,5)
vein(g,[74,84,96,104,92,120,112,134],3);vein(g,[150,76,142,98,160,112,152,136],3);vein(g,[104,160,116,148,126,166],2.5)
g.fillStyle='rgba(255,170,60,.2)';g.fillRect(70,70,102,102)
const ay=a?20:0
ch(g,6,76-ay,48,96,12);ch(g,0,150-ay*2,60,56,16);vein(g,[16,96-ay,30,120-ay,22,144-ay],2.5)
g.beginPath();g.moveTo(186,92-ay);g.lineTo(226,60-ay);g.lineTo(232,84-ay);g.lineTo(200,120-ay);g.closePath();g.fillStyle=lg(g,0,60,0,120,[[0,'#d9a066'],[1,'#6a3a1e']]);g.fill();out(g,2.2)
g.beginPath();g.moveTo(200,120-ay);g.lineTo(240,110-ay);g.lineTo(226,150-ay);g.lineTo(190,160-ay);g.closePath();g.fillStyle='#4a2614';g.fill();out(g,2.2)
for(const[x,y]of[[214,104],[228,132]]){g.beginPath();g.moveTo(x,y);g.lineTo(x+16,y-10);g.lineTo(x+10,y+8);g.closePath();g.fillStyle='#e8c89a';g.fill();out(g,1.6)}
g.beginPath();g.roundRect(70,10,100,64,12);g.fillStyle=lg(g,0,10,0,74,[[0,'#8a5434'],[1,'#3e200e']]);g.fill();out(g,2.6)
g.strokeStyle='rgba(20,8,2,.7)';g.lineWidth=2;g.beginPath();g.moveTo(70,42);g.lineTo(170,42);g.moveTo(120,10);g.lineTo(120,74);g.moveTo(96,10);g.lineTo(90,28);g.lineTo(100,42);g.stroke()
vein(g,[142,12,150,26,140,40],2.5)
g.beginPath();g.moveTo(82,10);g.lineTo(70,-8+4);g.lineTo(96,6);g.closePath();g.moveTo(158,10);g.lineTo(172,-8+4);g.lineTo(144,6);g.closePath();g.fillStyle='#e8c89a';g.fill();out(g,1.8)
g.beginPath();g.roundRect(76,24,88,22,10);g.fillStyle='#10202a';g.fill();out(g,2)
glow(g,102,35,26,'rgba(120,230,255,.85)');glow(g,142,35,24,'rgba(120,230,255,.6)')
g.beginPath();g.arc(102,35,8,0,6.283);g.fillStyle='#bff6ff';g.fill();g.beginPath();g.arc(102,35,3.4,0,6.283);g.fillStyle='#0a1218';g.fill()
g.beginPath();g.moveTo(134,26);g.lineTo(150,44);g.strokeStyle='#e8f6ff';g.lineWidth=1.6;g.stroke();g.moveTo(150,26);g.lineTo(136,44);g.stroke()
g.beginPath();g.moveTo(88,58);g.lineTo(96,52);g.lineTo(104,60);g.lineTo(112,52);g.lineTo(120,60);g.lineTo(128,52);g.lineTo(136,60);g.lineTo(144,52);g.lineTo(152,58);g.strokeStyle='#f0d9b8';g.lineWidth=2.4;g.stroke()
}))
A.blob=[0,1].map(f=>spr(56,50,28,46,S,g=>{
const w=f?4:0
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(28,45,22,5,0,0,6.283);g.fill()
g.beginPath();g.moveTo(4,44);g.quadraticCurveTo(0,20,14,12-w/2);g.quadraticCurveTo(28,-4+w,42,12-w/2);g.quadraticCurveTo(56,20,52,44);g.quadraticCurveTo(40,48,28,45);g.quadraticCurveTo(16,48,4,44);g.closePath()
g.fillStyle=rg(g,22,16,2,40,[[0,'#b8744a'],[.6,'#6a3a1e'],[1,'#3a1c0c']]);g.fill();out(g,2.2)
g.fillStyle='rgba(255,220,170,.55)';g.beginPath();g.ellipse(18,16,7,4,-.5,0,6.283);g.fill()
for(const x of[20,36]){g.beginPath();g.arc(x,26,5,0,6.283);g.fillStyle='#fff';g.fill();g.beginPath();g.arc(x+1,27,2.4,0,6.283);g.fillStyle='#1a0f0a';g.fill()}
g.beginPath();g.arc(28,36,5,.2,2.9);g.strokeStyle='#2a1208';g.lineWidth=2;g.stroke()
}))
A.chest=[0,1].map(o=>spr(64,56,32,52,S,g=>{
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(32,52,28,5,0,0,6.283);g.fill()
g.beginPath();g.roundRect(6,24,52,26,4);g.fillStyle=lg(g,0,24,0,50,[[0,'#8a5a2a'],[1,'#4a2810']]);g.fill();out(g,2.2)
g.fillStyle='#d9b03a';g.fillRect(6,34,52,4);g.strokeStyle=O;g.lineWidth=1.4;g.strokeRect(6,34,52,4)
if(o){glow(g,32,26,34,'rgba(255,230,140,.7)');g.beginPath();g.moveTo(6,24);g.lineTo(10,6);g.lineTo(54,6);g.lineTo(58,24);g.closePath();g.fillStyle=lg(g,0,6,0,24,[[0,'#b07a3a'],[1,'#6a3e18']]);g.fill();out(g,2.2)}
else{g.beginPath();g.moveTo(6,24);g.quadraticCurveTo(32,2,58,24);g.closePath();g.fillStyle=lg(g,0,4,0,24,[[0,'#b07a3a'],[1,'#6a3e18']]);g.fill();out(g,2.2);g.fillStyle='#d9b03a';g.fillRect(28,28,8,10);g.strokeRect(28,28,8,10)}
for(const x of[12,48]){g.fillStyle='#d9b03a';g.fillRect(x,o?7:15,4,o?17:9)}
}))
A.potion=spr(28,34,14,32,S,g=>{g.beginPath();g.roundRect(10,2,8,8,2);g.fillStyle='#c9a06a';g.fill();out(g,1.6);g.beginPath();g.moveTo(10,10);g.lineTo(5,22);g.quadraticCurveTo(5,31,14,31);g.quadraticCurveTo(23,31,23,22);g.lineTo(18,10);g.closePath();g.fillStyle=rg(g,11,20,1,14,[[0,'#ff9aa8'],[1,'#d11a3a']]);g.fill();out(g,1.8);g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.ellipse(10,20,2,4,.3,0,6.283);g.fill()})
A.pack=spr(34,36,17,34,S,g=>{g.beginPath();g.roundRect(5,8,24,24,7);g.fillStyle=lg(g,0,8,0,32,[[0,'#6fbf6a'],[1,'#2e7a3a']]);g.fill();out(g,2);g.beginPath();g.roundRect(9,18,16,10,3);g.fillStyle='#235a2c';g.fill();out(g,1.4);g.beginPath();g.arc(17,8,6,Math.PI,0);g.strokeStyle=O;g.lineWidth=3.2;g.stroke();g.strokeStyle='#8a5a2a';g.lineWidth=1.6;g.stroke()})
A.kit=spr(34,36,17,34,S,g=>{glow(g,17,18,20,'rgba(190,120,255,.7)');g.beginPath();g.roundRect(14,3,6,22,3);g.fillStyle='#e8e0ff';g.fill();out(g,1.6);g.beginPath();g.roundRect(10,20,14,10,3);g.fillStyle=lg(g,0,20,0,30,[[0,'#c88aff'],[1,'#6a2ad0']]);g.fill();out(g,1.6);g.beginPath();g.moveTo(17,30);g.lineTo(17,35);g.strokeStyle='#e8e0ff';g.lineWidth=2;g.stroke()})
A.form=[0,1].map(f=>spr(110,130,55,124,S,g=>{
g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(55,122,40,8,0,0,6.283);g.fill()
const b=f?5:0
glow(g,55,60,64,'rgba(170,80,255,.38)')
g.beginPath();g.moveTo(10,70);g.quadraticCurveTo(-6,40,6,14);g.quadraticCurveTo(24,40,36,52);g.closePath();g.moveTo(100,70);g.quadraticCurveTo(116,40,104,14);g.quadraticCurveTo(86,40,74,52);g.closePath();g.fillStyle=lg(g,0,10,0,70,[[0,'#7a2ad0'],[1,'#2a0f50']]);g.fill();out(g,2.2)
g.beginPath();g.moveTo(34,70);g.lineTo(30,118+b);g.lineTo(46,118+b);g.lineTo(54,86);g.lineTo(62,118-b+5);g.lineTo(78,118-b+5);g.lineTo(76,70);g.closePath();g.fillStyle=lg(g,0,70,0,118,[[0,'#3a1a6a'],[1,'#180a30']]);g.fill();out(g,2.2)
g.beginPath();g.moveTo(28,70);g.quadraticCurveTo(26,40,40,34);g.lineTo(70,34);g.quadraticCurveTo(84,40,82,70);g.closePath();g.fillStyle=lg(g,0,34,0,72,[[0,'#6a30b8'],[1,'#2a1058']]);g.fill();out(g,2.4)
g.strokeStyle='#c88aff';g.lineWidth=1.6;g.beginPath();g.moveTo(40,44);g.lineTo(48,62);g.lineTo(42,70);g.moveTo(70,44);g.lineTo(62,62);g.lineTo(68,70);g.stroke()
for(const[x,y,r]of[[40,24,12],[55,16,15],[70,24,12],[55,30,12]]){g.beginPath();g.arc(x,y,r,0,6.283);g.fillStyle=rg(g,x-3,y-4,1,r+2,[[0,'#f4eaff'],[1,'#9a7ad0']]);g.fill();out(g,1.8,'#3a1a6a')}
glow(g,47,26,14,'rgba(255,90,170,.9)');glow(g,63,26,14,'rgba(255,90,170,.9)')
for(const x of[47,63]){g.beginPath();g.ellipse(x,26,3,4.4,0,0,6.283);g.fillStyle='#fff';g.fill()}
g.beginPath();g.moveTo(44,36);g.lineTo(50,40);g.lineTo(55,36);g.lineTo(60,40);g.lineTo(66,36);g.strokeStyle='#fff';g.lineWidth=2;g.stroke()
}))
A.desk=spr(170,110,85,104,S,g=>{
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(85,102,76,8,0,0,6.283);g.fill()
g.beginPath();g.roundRect(4,58,162,12,3);g.fillStyle=lg(g,0,58,0,70,[[0,'#a8774a'],[1,'#6a4220']]);g.fill();out(g,2)
for(const x of[12,142]){g.beginPath();g.roundRect(x,70,12,32,2);g.fillStyle='#5a3618';g.fill();out(g,1.8)}
g.beginPath();g.roundRect(44,6,82,60,6);g.fillStyle=lg(g,0,6,0,66,[[0,'#d8d2bc'],[1,'#a29c84']]);g.fill();out(g,2.2)
g.beginPath();g.roundRect(78,64,14,10,2);g.fillStyle='#b8b29a';g.fill();out(g,1.6)
g.beginPath();g.roundRect(30,70,110,6,2);g.fillStyle='#cfc9b2';g.fill();out(g,1.6)
g.beginPath();g.roundRect(120,40,28,18,3);g.fillStyle='#c0b9a0';g.fill();out(g,1.4)
g.fillStyle='#e04b4b';g.beginPath();g.arc(30,52,6,0,6.283);g.fill();out(g,1.4)
g.fillStyle='#fff';g.fillRect(150,44,10,14);g.strokeStyle=O;g.strokeRect(150,44,10,14)
})
return A
}
