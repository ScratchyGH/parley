const O='#140b1c'
const mk=(w,h,S)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*S);c.height=Math.ceil(h*S);const g=c.getContext('2d');g.scale(S,S);g.lineJoin='round';g.lineCap='round';return[c,g]}
const rg=(g,x,y,r0,r1,stops)=>{const q=g.createRadialGradient(x,y,r0,x,y,r1);stops.forEach(([o,c])=>q.addColorStop(o,c));return q}
const lg=(g,x0,y0,x1,y1,stops)=>{const q=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,c])=>q.addColorStop(o,c));return q}
const out=(g,w)=>{g.strokeStyle=O;g.lineWidth=w||2;g.stroke()}
const glow=(g,x,y,r,c)=>{g.fillStyle=rg(g,x,y,0,r,[[0,c],[1,'rgba(0,0,0,0)']]);g.fillRect(x-r,y-r,r*2,r*2)}
const spr=(w,h,ax,ay,S,fn)=>{const[c,g]=mk(w,h,S);fn(g);return{c,w,h,ax,ay}}
const jack=(g,x,y,s,c)=>{
g.fillStyle=c
g.beginPath()
g.moveTo(x-s*.55,y-s*.05);g.lineTo(x-s*.18,y-s*.05);g.lineTo(x-s*.36,y-s*.42)
g.moveTo(x+s*.55,y-s*.05);g.lineTo(x+s*.18,y-s*.05);g.lineTo(x+s*.36,y-s*.42)
g.moveTo(x-s*.55,y+s*.2);g.lineTo(x-s*.3,y+s*.5);g.lineTo(x-s*.1,y+s*.3);g.lineTo(x+s*.1,y+s*.5);g.lineTo(x+s*.3,y+s*.3);g.lineTo(x+s*.55,y+s*.2);g.lineTo(x,y+s*.1)
g.fill()
}
const pumpkinBody=(g,x,y,rx,ry,lobes)=>{
g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2)
g.fillStyle=rg(g,x-rx*.25,y-ry*.35,2,rx*1.2,[[0,'#ffc15a'],[.45,'#ff8a1e'],[1,'#b8400a']])
g.fill();out(g,2)
g.strokeStyle='rgba(120,40,0,.55)';g.lineWidth=1.6
for(let i=1;i<lobes;i++){const k=(i/lobes-.5)*2;g.beginPath();g.ellipse(x+k*rx*.62,y,Math.abs(rx*.36*(1-Math.abs(k)*.2)),ry*.96,0,Math.PI*1.5,Math.PI*.5,k<0);g.stroke()}
}
const stem=(g,x,y,w,h)=>{
g.beginPath();g.moveTo(x-w/2,y+h);g.quadraticCurveTo(x-w*.4,y+h*.3,x-w*.1,y);g.lineTo(x+w*.5,y+h*.1);g.quadraticCurveTo(x+w*.2,y+h*.5,x+w/2,y+h);g.closePath()
g.fillStyle=lg(g,x-w/2,0,x+w/2,0,[[0,'#3d5a14'],[1,'#7da02c']]);g.fill();out(g,1.6)
}
export function buildArt(S){
const A={}
A.player=[0,1].map(f=>spr(44,56,22,52,S,g=>{
const b=f?-1:0
g.beginPath();g.moveTo(15,33+b);g.quadraticCurveTo(8,44,7,50);g.lineTo(33,50);g.quadraticCurveTo(32,44,26,33+b);g.closePath()
g.fillStyle=lg(g,0,30,0,50,[[0,'#4a3590'],[1,'#21123f']]);g.fill();out(g,2)
g.fillStyle='#21123f'
g.beginPath();g.roundRect(12,49+(f?1:0),7,5,2);g.fill();out(g,1.6)
g.beginPath();g.roundRect(22,49+(f?0:1),7,5,2);g.fill();out(g,1.6)
g.fillStyle='#ffb347';g.fillRect(17,33+b,6,2)
stem(g,20,5+b,7,8)
pumpkinBody(g,20,20+b,15,13,5)
glow(g,20,20+b,14,'rgba(255,230,120,.55)')
jack(g,20,20+b,17,'#fff0a0')
g.strokeStyle=O;g.lineWidth=1
g.strokeStyle='#8a6a2a';g.lineWidth=1.6;g.beginPath();g.moveTo(31,35+b);g.lineTo(37,31+b);g.stroke()
g.fillStyle='#ffb347';g.beginPath();g.roundRect(34,32+b,8,11,2);g.fill();out(g,1.6)
glow(g,38,38+b,14,'rgba(255,190,80,.7)')
g.fillStyle='#fff3b0';g.fillRect(36,35+b,4,5)
}))
A.wisp=[-1,1].map(d=>spr(34,40,17,30,S,g=>{
glow(g,17,17,17,'rgba(110,220,255,.38)')
g.beginPath();g.moveTo(17,3);g.bezierCurveTo(28,8,29,22,17,28);g.bezierCurveTo(16,32,17+d*4,34,17+d*6,38);g.bezierCurveTo(12+d*2,34,12+d*3,31,8,24);g.bezierCurveTo(4,14,9,7,17,3)
g.fillStyle=rg(g,15,13,1,17,[[0,'#f4feff'],[.5,'#8fe3ff'],[1,'#2a8fc7']]);g.fill();out(g,1.6)
g.fillStyle='#0a2a3a'
g.beginPath();g.ellipse(13,15,2.4,3.4,0,0,7);g.ellipse(21,15,2.4,3.4,0,0,7);g.fill()
g.fillStyle='#fff';g.fillRect(12,13,1.2,1.4);g.fillRect(20,13,1.2,1.4)
g.fillStyle='#0a2a3a';g.beginPath();g.ellipse(17,22,2.4,1.6,0,0,7);g.fill()
}))
A.ghoul=[0,1].map(f=>spr(52,58,26,54,S,g=>{
const sw=f?3:-3
g.fillStyle='#4a3a2a';g.beginPath();g.roundRect(17,47,7,7,2);g.roundRect(28,47,7,7,2);g.fill();out(g,1.6)
g.beginPath();g.moveTo(14,24);g.quadraticCurveTo(10,40,13,49);g.lineTo(39,49);g.quadraticCurveTo(42,40,38,24);g.closePath()
g.fillStyle=lg(g,0,24,0,50,[[0,'#6b4a35'],[1,'#3b2619']]);g.fill();out(g,2)
g.strokeStyle='#2a1a10';g.lineWidth=1.4;g.beginPath();g.moveTo(18,34);g.lineTo(22,40);g.moveTo(30,30);g.lineTo(34,38);g.stroke()
g.strokeStyle=O;g.lineWidth=7;g.beginPath();g.moveTo(14,28);g.lineTo(5,36+sw);g.moveTo(38,28);g.lineTo(47,36-sw);g.stroke()
g.strokeStyle='#8fc060';g.lineWidth=4;g.beginPath();g.moveTo(14,28);g.lineTo(5,36+sw);g.moveTo(38,28);g.lineTo(47,36-sw);g.stroke()
g.beginPath();g.ellipse(26,16,12,11,0,0,7);g.fillStyle=rg(g,23,12,2,14,[[0,'#a6d479'],[1,'#5f8f3d']]);g.fill();out(g,2)
g.fillStyle='#101a08';g.beginPath();g.ellipse(21,15,3.4,3.8,0,0,7);g.ellipse(31,15,3.4,3.8,0,0,7);g.fill()
g.fillStyle='#e8ff8a';g.fillRect(20,14,2,2.4);g.fillRect(30,14,2,2.4)
g.fillStyle='#1a0e08';g.beginPath();g.moveTo(19,22);g.lineTo(33,22);g.lineTo(31,25);g.lineTo(21,25);g.fill()
g.fillStyle='#f2ecd0';for(let i=0;i<4;i++)g.fillRect(21+i*3,22,1.6,2.6)
g.fillStyle='#2a1a0c';g.beginPath();g.moveTo(16,8);g.lineTo(20,2);g.lineTo(24,8);g.moveTo(28,7);g.lineTo(33,3);g.lineTo(36,10);g.fill()
}))
A.bone=[0,1].map(f=>spr(44,56,22,52,S,g=>{
const sw=f?3:-3
g.strokeStyle=O;g.lineWidth=6;g.beginPath();g.moveTo(17,42);g.lineTo(14+sw,53);g.moveTo(27,42);g.lineTo(30-sw,53);g.moveTo(15,28);g.lineTo(7,38+sw);g.moveTo(29,28);g.lineTo(37,38-sw);g.stroke()
g.strokeStyle='#efe8d2';g.lineWidth=3;g.beginPath();g.moveTo(17,42);g.lineTo(14+sw,53);g.moveTo(27,42);g.lineTo(30-sw,53);g.moveTo(15,28);g.lineTo(7,38+sw);g.moveTo(29,28);g.lineTo(37,38-sw);g.stroke()
g.strokeStyle=O;g.lineWidth=6;g.beginPath();g.moveTo(22,24);g.lineTo(22,43);g.stroke()
g.strokeStyle='#efe8d2';g.lineWidth=3;g.beginPath();g.moveTo(22,24);g.lineTo(22,43);g.stroke()
for(let i=0;i<4;i++){const y=28+i*4.2,w=9-i*1.2;g.strokeStyle=O;g.lineWidth=4;g.beginPath();g.moveTo(22-w,y);g.lineTo(22+w,y);g.stroke();g.strokeStyle='#e4dcc2';g.lineWidth=2;g.beginPath();g.moveTo(22-w,y);g.lineTo(22+w,y);g.stroke()}
g.beginPath();g.ellipse(22,14,10.5,10,0,0,7);g.fillStyle=rg(g,19,10,2,13,[[0,'#fffbe8'],[1,'#cfc6a8']]);g.fill();out(g,2)
g.beginPath();g.roundRect(15,20,14,7,2);g.fillStyle='#e4dcc2';g.fill();out(g,1.6)
g.fillStyle='#1a0c10';g.beginPath();g.ellipse(18,14,3.2,3.8,0,0,7);g.ellipse(26,14,3.2,3.8,0,0,7);g.fill()
g.fillStyle='#ff9a3a';g.fillRect(17.4,13.4,1.6,1.6);g.fillRect(25.4,13.4,1.6,1.6)
g.fillStyle='#1a0c10';g.beginPath();g.moveTo(22,17);g.lineTo(20.5,20);g.lineTo(23.5,20);g.fill()
g.strokeStyle='#1a0c10';g.lineWidth=1;for(let i=0;i<4;i++){g.beginPath();g.moveTo(17+i*3.3,21);g.lineTo(17+i*3.3,26);g.stroke()}
}))
A.reaper=[0,1].map(f=>spr(66,76,33,70,S,g=>{
const w=f?2:-2
glow(g,33,40,32,'rgba(150,70,255,.28)')
g.strokeStyle=O;g.lineWidth=5;g.beginPath();g.moveTo(52,6);g.lineTo(52,68);g.stroke()
g.strokeStyle='#6b4a2a';g.lineWidth=2.6;g.beginPath();g.moveTo(52,6);g.lineTo(52,68);g.stroke()
g.beginPath();g.moveTo(52,8);g.bezierCurveTo(40,2,28,8,24,20);g.bezierCurveTo(32,12,42,12,52,16);g.closePath()
g.fillStyle=lg(g,24,8,52,16,[[0,'#d8e4f0'],[1,'#7a8ca0']]);g.fill();out(g,1.6)
g.beginPath();g.moveTo(33,6);g.bezierCurveTo(14,10,8,32,10,52);g.lineTo(6+w,66);g.lineTo(14,60);g.lineTo(20,70);g.lineTo(27,62);g.lineTo(33,72);g.lineTo(39,62);g.lineTo(46,70);g.lineTo(52,60);g.lineTo(60-w,66);g.bezierCurveTo(58,32,52,10,33,6)
g.fillStyle=lg(g,0,6,0,70,[[0,'#3a2466'],[1,'#120a22']]);g.fill();out(g,2)
g.beginPath();g.ellipse(33,26,12,14,0,0,7);g.fillStyle='#04020a';g.fill()
g.fillStyle='#ff3b30'
g.beginPath();g.ellipse(28,25,2.6,1.8,.3,0,7);g.ellipse(38,25,2.6,1.8,-.3,0,7);g.fill()
glow(g,28,25,7,'rgba(255,60,50,.7)');glow(g,38,25,7,'rgba(255,60,50,.7)')
}))
A.boss=[0,1].map(f=>spr(150,150,75,128,S,g=>{
glow(g,75,76,74,f?'rgba(255,140,40,.4)':'rgba(255,120,30,.26)')
stem(g,75,12,20,26)
g.strokeStyle='#4f7a1c';g.lineWidth=3;g.beginPath();g.moveTo(85,26);g.bezierCurveTo(105,16,118,30,108,42);g.stroke()
pumpkinBody(g,75,78,64,52,7)
g.fillStyle=lg(g,0,50,0,110,[[0,f?'#fff6a8':'#ffe27a'],[1,f?'#ff9a2a':'#ff7a1a']])
g.beginPath();g.moveTo(34,70);g.lineTo(60,64);g.lineTo(44,40);g.closePath();g.moveTo(116,70);g.lineTo(90,64);g.lineTo(106,40);g.closePath()
g.moveTo(38,86);g.lineTo(52,100);g.lineTo(62,88);g.lineTo(75,104);g.lineTo(88,88);g.lineTo(98,100);g.lineTo(112,86);g.lineTo(98,80);g.lineTo(75,74);g.lineTo(52,80);g.closePath()
g.fill();out(g,2.4)
g.fillStyle='#1a0a02';g.beginPath();g.ellipse(50,62,3,3,0,0,7);g.ellipse(100,62,3,3,0,0,7);g.fill()
g.strokeStyle='#5a1a02';g.lineWidth=4;g.beginPath();g.moveTo(34,54);g.lineTo(60,62);g.moveTo(116,54);g.lineTo(90,62);g.stroke()
g.fillStyle='#fff6d0'
for(let i=0;i<4;i++){g.beginPath();g.moveTo(56+i*10,86);g.lineTo(60+i*10,95);g.lineTo(64+i*10,86);g.fill()}
}))
A.bullet=spr(20,12,10,6,S,g=>{
glow(g,10,6,10,'rgba(255,200,90,.55)')
g.beginPath();g.moveTo(18,6);g.lineTo(3,1.5);g.lineTo(3,10.5);g.closePath()
g.fillStyle=lg(g,3,0,18,0,[[0,'#ffd23a'],[.55,'#ff8a1e'],[.8,'#fff'],[1,'#fff']]);g.fill();out(g,1.2)
})
A.ebone=spr(22,10,11,5,S,g=>{
g.strokeStyle=O;g.lineWidth=5;g.beginPath();g.moveTo(5,5);g.lineTo(17,5);g.stroke()
g.strokeStyle='#efe8d2';g.lineWidth=2.6;g.beginPath();g.moveTo(5,5);g.lineTo(17,5);g.stroke()
g.fillStyle='#efe8d2';g.beginPath();g.arc(4,3,2.3,0,7);g.arc(4,7,2.3,0,7);g.arc(18,3,2.3,0,7);g.arc(18,7,2.3,0,7);g.fill()
})
A.gem=[0,1].map(b=>spr(22,26,11,13,S,g=>{
const c=b?['#ffe9a8','#ffb347','#c2570c']:['#e5d6ff','#a78bfa','#5b34b8']
glow(g,11,13,11,b?'rgba(255,190,80,.5)':'rgba(170,130,255,.45)')
g.beginPath();g.moveTo(11,3);g.lineTo(18,11);g.lineTo(11,23);g.lineTo(4,11);g.closePath()
g.fillStyle=lg(g,4,3,18,23,[[0,c[0]],[.5,c[1]],[1,c[2]]]);g.fill();out(g,1.4)
g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1;g.beginPath();g.moveTo(4,11);g.lineTo(18,11);g.moveTo(11,3);g.lineTo(11,23);g.stroke()
}))
A.heart=spr(28,28,14,14,S,g=>{
glow(g,14,14,14,'rgba(255,60,80,.45)')
g.beginPath();g.moveTo(14,23);g.bezierCurveTo(1,15,4,4,10,5);g.bezierCurveTo(12,5.5,13.5,7,14,9);g.bezierCurveTo(14.5,7,16,5.5,18,5);g.bezierCurveTo(24,4,27,15,14,23)
g.fillStyle=rg(g,10,10,1,14,[[0,'#ff9aa8'],[1,'#c4132f']]);g.fill();out(g,1.6)
})
A.lantern=spr(26,34,13,17,S,g=>{
glow(g,13,18,18,'rgba(255,170,60,.55)')
g.strokeStyle=O;g.lineWidth=2;g.beginPath();g.arc(13,6,5,Math.PI,0);g.stroke()
g.beginPath();g.roundRect(7,8,12,5,1.5);g.fillStyle='#5a3a1a';g.fill();out(g,1.4)
g.beginPath();g.roundRect(6,13,14,15,3);g.fillStyle=rg(g,13,20,1,10,[[0,'#fff3b0'],[.6,'#ffb347'],[1,'#c2570c']]);g.fill();out(g,1.6)
g.beginPath();g.roundRect(7,28,12,3,1);g.fillStyle='#5a3a1a';g.fill();out(g,1.2)
})
A.tomb=[0,1,2].map(i=>spr(48,60,24,56,S,g=>{
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(24,54,18,5,0,0,7);g.fill()
g.beginPath()
if(i===0){g.moveTo(9,54);g.lineTo(9,18);g.arc(24,18,15,Math.PI,0);g.lineTo(39,54);g.closePath()}
else if(i===1){g.moveTo(8,54);g.lineTo(8,24);g.lineTo(18,24);g.lineTo(18,12);g.lineTo(30,12);g.lineTo(30,24);g.lineTo(40,24);g.lineTo(40,54);g.closePath()}
else{g.moveTo(10,54);g.lineTo(10,26);g.lineTo(16,20);g.lineTo(22,26);g.lineTo(30,14);g.lineTo(38,24);g.lineTo(38,54);g.closePath()}
g.fillStyle=lg(g,0,10,0,54,[[0,'#6a6a86'],[1,'#34344a']]);g.fill();out(g,2)
g.fillStyle='rgba(80,140,70,.5)';g.beginPath();g.ellipse(14,52,8,3,0,0,7);g.ellipse(34,46,5,2.4,0,0,7);g.fill()
g.strokeStyle='rgba(20,12,30,.7)';g.lineWidth=2
if(i===0){g.beginPath();g.moveTo(24,22);g.lineTo(24,38);g.moveTo(18,28);g.lineTo(30,28);g.stroke()}
else if(i===1){g.beginPath();g.moveTo(14,34);g.lineTo(34,34);g.moveTo(14,40);g.lineTo(30,40);g.stroke()}
else{g.beginPath();g.moveTo(16,36);g.lineTo(32,36);g.moveTo(18,42);g.lineTo(30,42);g.stroke()}
}))
A.tree=spr(110,140,55,132,S,g=>{
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(55,128,28,7,0,0,7);g.fill()
const br=(x,y,a,l,w,d)=>{
if(d<0||w<.8)return
const x2=x+Math.cos(a)*l,y2=y+Math.sin(a)*l
g.strokeStyle=O;g.lineWidth=w+2.4;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke()
g.strokeStyle=lg(g,x,y,x2,y2,[[0,'#3a2a3a'],[1,'#554558']]);g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke()
br(x2,y2,a-.5-d*.05,l*.74,w*.68,d-1)
br(x2,y2,a+.45+d*.04,l*.7,w*.62,d-1)
}
br(55,130,-Math.PI/2,40,9,5)
br(55,96,-Math.PI/2-.7,26,5,3)
br(55,90,-Math.PI/2+.8,24,5,3)
})
A.lamp=spr(40,96,20,90,S,g=>{
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(20,88,10,3.4,0,0,7);g.fill()
g.strokeStyle=O;g.lineWidth=6;g.beginPath();g.moveTo(20,88);g.lineTo(20,26);g.stroke()
g.strokeStyle='#3a3a52';g.lineWidth=3;g.beginPath();g.moveTo(20,88);g.lineTo(20,26);g.stroke()
glow(g,20,18,22,'rgba(255,180,70,.5)')
g.beginPath();g.roundRect(13,10,14,18,3);g.fillStyle=rg(g,20,19,1,10,[[0,'#fff3b0'],[.6,'#ffb347'],[1,'#c2570c']]);g.fill();out(g,2)
g.beginPath();g.moveTo(11,10);g.lineTo(20,2);g.lineTo(29,10);g.closePath();g.fillStyle='#2a2a3e';g.fill();out(g,1.6)
})
A.patch=spr(60,34,30,30,S,g=>{
g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(30,28,24,5,0,0,7);g.fill()
g.strokeStyle='#3d5a14';g.lineWidth=2;g.beginPath();g.moveTo(6,26);g.bezierCurveTo(20,14,40,32,56,20);g.stroke()
;[[16,20,9],[34,22,11],[48,25,7]].forEach(([x,y,r])=>{pumpkinBody(g,x,y,r,r*.82,3);stem(g,x,y-r*.8-3,3,4)})
})
A.fence=spr(70,34,35,30,S,g=>{
g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(35,30,30,4,0,0,7);g.fill()
g.strokeStyle=O;g.lineWidth=6;g.beginPath();g.moveTo(2,18);g.lineTo(68,18);g.moveTo(2,26);g.lineTo(68,26);g.stroke()
g.strokeStyle='#2c2c40';g.lineWidth=3;g.beginPath();g.moveTo(2,18);g.lineTo(68,18);g.moveTo(2,26);g.lineTo(68,26);g.stroke()
for(let i=0;i<6;i++){const x=6+i*12;g.beginPath();g.moveTo(x-2.4,30);g.lineTo(x-2.4,8);g.lineTo(x,3);g.lineTo(x+2.4,8);g.lineTo(x+2.4,30);g.closePath();g.fillStyle='#34344c';g.fill();out(g,1.4)}
})
A.skull=spr(26,20,13,16,S,g=>{
g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(13,16,10,3,0,0,7);g.fill()
g.beginPath();g.ellipse(13,9,8,7,0,0,7);g.fillStyle='#d8d0b8';g.fill();out(g,1.6)
g.fillStyle='#1a0c10';g.beginPath();g.ellipse(10,9,2,2.4,0,0,7);g.ellipse(16,9,2,2.4,0,0,7);g.fill()
})
A.ground=(()=>{
const T=256,[c,g]=mk(T,T,2)
g.fillStyle=lg(g,0,0,T,T,[[0,'#211a38'],[.5,'#1b1530'],[1,'#1f1836']]);g.fillRect(0,0,T,T)
let s=7
const r=()=>(s=(s*16807)%2147483647)/2147483647
for(let i=0;i<220;i++){g.fillStyle=['#2a2146','#150f26','#2e2550','#18122c'][Math.floor(r()*4)];g.globalAlpha=.5;const x=r()*T,y=r()*T,rx=3+r()*16,ry=2+r()*8;for(const a of[-T,0,T])for(const b of[-T,0,T]){g.beginPath();g.ellipse(x+a,y+b,rx,ry,0,0,7);g.fill()}}
g.globalAlpha=1
for(let i=0;i<1600;i++){g.fillStyle=['#2d2450','#120c20','#35305e','#1a1430'][Math.floor(r()*4)];g.fillRect(r()*T,r()*T,1+r()*1.5,1+r()*1.5)}
for(let i=0;i<70;i++){
const x=14+r()*(T-28),y=14+r()*(T-28),n=3+Math.floor(r()*3)
g.globalAlpha=.7;g.strokeStyle=r()>.5?'#27503d':'#203f32';g.lineWidth=1.1
for(let k=0;k<n;k++){g.beginPath();g.moveTo(x+k*1.6,y);g.quadraticCurveTo(x+k*1.6+(k-n/2)*1.2,y-3,x+k*2.2-n,y-5-r()*4);g.stroke()}
g.globalAlpha=1
}
for(let i=0;i<9;i++){const x=20+r()*(T-40),y=20+r()*(T-40);g.strokeStyle='rgba(8,4,16,.5)';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);g.lineTo(x+r()*16-8,y+r()*10);g.lineTo(x+r()*30-15,y+r()*20);g.stroke()}
return{c,T}
})()
return A
}
