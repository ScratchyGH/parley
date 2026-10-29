import{K,T,rg,lg,glow,spr,cel,ln,ell,poly,sm,cap,rib,star,moon,band}from'./dsartB.js'
const CH=['#1a0905','#4a210f','#a05c30'],IV=['#6a4a2a','#e6d2a4','#fffbe6'],BR=['#3a2208','#a8701c','#ffd46a'],WH=['#44488f','#bcc4f2','#ffffff'],OR='rgba(255,140,30,.85)',CY='rgba(90,235,255,.8)'
const vein=(g,p,w)=>{ln(g,p,w+3.5,'rgba(255,130,20,.35)');ln(g,p,w,'#ff9a14');ln(g,p,w*.42,'#fff2b0')}
const horn=(g,s,x0)=>{
const X=x=>s>0?x:240-x
cel(g,g=>{g.moveTo(X(102),28);g.bezierCurveTo(X(78),32,X(58),18,X(56),0);g.bezierCurveTo(X(74),8,X(94),10,X(112),18);g.closePath()},IV,{k:1.2,h:1,hs:2,r:'rgba(255,170,60,.8)'})
ln(g,[X(92),22,X(76),24,X(64),16],1.1,'#6a4a2a',.8);ln(g,[X(96),26,X(80),28,X(66),21],1,'#6a4a2a',.7)
cel(g,g=>{g.moveTo(X(60),10);g.bezierCurveTo(X(58),6,X(57),3,X(56),0);g.bezierCurveTo(X(62),3,X(66),5,X(69),10);g.closePath()},['#a84a00','#ff9a14','#ffe27a'],{k:.5,t:.6,w:.8})
}
const fist=(g,x,y,s)=>{
cel(g,g=>g.roundRect(x-18,y-15,36,32,11),CH,{k:1.3,h:1,hs:2,r:OR,s:[[x-9,y-9,5,1.6,-.4]],sc:'rgba(255,220,170,.7)'})
for(const d of[-9,0,9])ln(g,[x+d,y-12,x+d+s,y-5],1.3,K,.8)
ln(g,[x-12,y+4,x+12,y+4],1.1,K,.5)
vein(g,[x-6,y+9,x-4,y+14],1.4)
}
const armB=(g,s,sx,sy,ex,ey,hx,hy)=>{
const X=x=>s>0?x:240-x
cel(g,g=>{cap(g,X(sx),sy,X(ex),ey,17,14.5);cap(g,X(ex),ey,X(hx),hy-8,14.5,13)},CH,{k:1.4,h:1,hs:2,r:OR})
vein(g,[X(ex)-s*2,ey-8,X(ex)+s*2,ey+2,X(ex)-s*1,ey+10],1.6)
fist(g,X(hx),hy,s)
cel(g,g=>{ell(g,X(sx),sy-2,25,21);},CH,{k:1.4,h:1,hs:2,r:OR,s:[[X(sx)-10,sy-12,7,2,-.5]],sc:'rgba(255,220,170,.7)'})
for(const[a,b,r]of[[-14,-16,10],[0,-22,13],[14,-17,10]])cel(g,g=>poly(g,[X(sx)+a-r*.5,sy+b+4,X(sx)+a,sy+b-r,X(sx)+a+r*.5,sy+b+4]),IV,{k:.6,t:.9})
}
const boss=(g,m,f)=>{
const wk=m<4,bob=wk?[3,-2,3,-2][f]:m===4?-5:9,sw=wk?[-3,0,3,0][f]:0,ls=wk?[[10,0],[0,0],[0,10],[0,0]][f]:[0,0]
const leg=(hx,lift)=>{const fy=244-lift
cel(g,g=>g.roundRect(hx-21,164,42,fy-170,12),CH,{k:1.4,h:1,hs:2,r:OR})
vein(g,[hx-4,180,hx+2,194,hx-2,206],1.6)
cel(g,g=>sm(g,[hx-30,fy-12,hx-22,fy-26,hx+10,fy-28,hx+30,fy-16,hx+32,fy,hx+24,fy+1,hx-26,fy+1]),['#0e0503','#2e130a','#6a3a1c'],{k:1.2,r:OR})
for(const d of[-18,-2,14])ln(g,[hx+d,fy-14,hx+d+4,fy-6],1.2,'#6a3a1c',.8)}
leg(88+sw*.5,ls[0]);leg(152+sw*.5,ls[1])
cel(g,g=>{g.moveTo(76+sw,162);g.lineTo(164+sw,162);g.lineTo(170+sw,198);g.lineTo(158+sw,214);g.lineTo(151+sw,198);g.lineTo(139+sw,224);g.lineTo(129+sw,204);g.lineTo(119+sw,226);g.lineTo(109+sw,206);g.lineTo(97+sw,222);g.lineTo(91+sw,202);g.lineTo(80+sw,214);g.lineTo(72+sw,196);g.closePath()},WH,{k:1.3,h:1,hs:2,r:'rgba(255,170,60,.6)'})
for(const[x,y]of[[100,190],[146,196],[122,180]]){g.fillStyle='rgba(60,25,10,.6)';g.beginPath();ell(g,x+sw,y,5,3.2);ell(g,x+sw+3,y+7,1.8,4);g.fill()}
g.save();g.translate(sw,bob)
const tor=g=>{g.moveTo(66,70);g.quadraticCurveTo(120,58,174,70);g.lineTo(192,110);g.lineTo(168,172);g.quadraticCurveTo(120,184,72,172);g.lineTo(48,110);g.closePath()}
cel(g,tor,CH,{k:1.5,r:OR})
g.save();g.beginPath();tor(g);g.clip()
g.fillStyle=lg(g,0,70,0,184,[[0,'#ffe27a'],[.5,'#ff9a14'],[1,'#c83a00']]);g.fillRect(40,60,160,130)
for(let r=0;r<3;r++)for(let c=0;c<3;c++){if(r===1&&c===1)continue;const x=68+c*37,y=76+r*35
cel(g,g=>g.roundRect(x,y,32,31,6),CH,{k:.85,t:1.2,w:.9,a:2,b:4.2,h:1,hs:1.8,r:OR})
}
g.restore()
ln(g,[68,102,100,96,118,112],1.3,K,.7)
g.beginPath();ell(g,120,127,16,16);g.fillStyle='#120503';g.fill()
g.beginPath();ell(g,120,127,13,13);g.fillStyle=rg(g,120,127,0,13,[[0,'#ffffff'],[.35,'#ffe27a'],[.75,'#ff8a14'],[1,'#c83a00']]);g.fill()
g.save();g.beginPath();ell(g,120,127,13,13);g.clip();for(const x of[112,120,128])ln(g,[x,112,x,142],1.6,K,.9);g.restore()
g.beginPath();ell(g,120,127,15,15);g.strokeStyle='#a8701c';g.lineWidth=2.2;g.stroke()
g.beginPath();ell(g,120,127,16.4,16.4);g.strokeStyle=K;g.lineWidth=1.2;g.stroke()
glow(g,120,127,56,'rgba(255,140,30,.55)')
vein(g,[74,150,92,140,98,156],2);vein(g,[168,92,152,102,158,120],2);vein(g,[70,84,82,78],1.6)
const armP=m===4?[[46,100,22,70,28,38],[46,100,22,70,28,38]]:m===5?[[50,106,60,166,86,228],[50,106,60,166,86,228]]:null
const sh=wk?[[-7,0],[0,-6],[7,0],[0,-6]][f]:[0,0]
const sh2=wk?[[7,0],[0,-6],[-7,0],[0,-6]][f]:[0,0]
if(wk){armB(g,1,44,98,34-sh2[0]*.3,140,36-sh2[0]*.8,184+sh2[1]);armB(g,-1,44,98,34+sh[0]*.3,140,36+sh[0]*.8,184+sh[1])}
else{armB(g,1,...armP[0]);armB(g,-1,...armP[1])}
glow(g,120,118,70,'rgba(255,120,20,.22)')
for(const s of[-1,1])horn(g,s)
cel(g,g=>g.roundRect(84,14,72,58,14),CH,{k:1.5,h:1,hs:2,r:OR,s:[[96,22,8,2,-.2]],sc:'rgba(255,220,170,.7)'})
ln(g,[84,50,156,50],1,K,.6);ln(g,[120,14,119,28],1,K,.6)
vein(g,[142,16,138,28,147,40],1.8);vein(g,[92,60,96,52],1.4)
ln(g,[84,42,156,42],7.5,K);ln(g,[84,42,156,42],5,'#3a2208')
for(const x of[105,135]){cel(g,g=>ell(g,x,42,16,16),BR,{k:.9,t:1.2})
g.beginPath();ell(g,x,42,12,12);g.fillStyle=rg(g,x-2,40,0,13,[[0,'#ffffff'],[.4,'#7af0ff'],[1,'#0a78d8']]);g.fill();g.strokeStyle=K;g.lineWidth=1.2;g.stroke()
g.beginPath();ell(g,x+1,43,4,6.4);g.fillStyle='#04202e';g.fill();g.beginPath();ell(g,x-5,36,4,1.6,-.7);g.fillStyle='rgba(255,255,255,.95)';g.fill()}
glow(g,105,42,38,'rgba(90,235,255,.7)');glow(g,135,42,38,'rgba(90,235,255,.7)')
cel(g,g=>poly(g,[82,24,158,24,158,30,136,38,120,31,104,38,82,30]),['#0e0503','#2e130a','#6a3a1c'],{k:.8,t:1.2})
const mo=m>=4?9:0
g.beginPath();g.roundRect(95,56,50,13+mo,4);g.fillStyle='#1a0505';g.fill();g.strokeStyle=K;g.lineWidth=1.4;g.stroke()
g.save();g.beginPath();g.roundRect(95,56,50,13+mo,4);g.clip();g.fillStyle=lg(g,0,56,0,70+mo,[[0,'#7a1a00'],[1,'#ff9a14']]);g.fillRect(95,56,50,13+mo)
g.fillStyle='#fffbe6';for(let i=0;i<5;i++){const x=98+i*9.6;g.beginPath();poly(g,[x,56,x+8,56,x+4,64.5]);g.fill();g.strokeStyle=K;g.lineWidth=.8;g.stroke();g.beginPath();poly(g,[x+2,69+mo,x+10,69+mo,x+6,60.5+mo*.4]);g.fill();g.stroke()}g.restore()
g.restore()
if(m===4){for(const[x,y]of[[30,26],[210,26],[14,52],[226,50],[46,12],[194,10]]){g.fillStyle='#ffd23a';g.beginPath();star(g,x,y,3.4);g.fill()}glow(g,28,40,30,'rgba(255,150,40,.7)');glow(g,212,40,30,'rgba(255,150,40,.7)')}
if(m===5){glow(g,120,238,80,'rgba(255,150,40,.55)');for(const s of[-1,1]){vein(g,[120+s*30,240,120+s*70,236,120+s*100,240,120+s*116,232],2.4)}for(const[x,y,r]of[[40,226,6],[200,226,6],[22,238,4],[218,238,4],[70,214,3],[170,214,3]]){g.fillStyle='#ffb347';g.beginPath();poly(g,[x-r,y+r,x,y-r,x+r,y+r]);g.fill();g.strokeStyle=K;g.lineWidth=1;g.stroke()}}
}
const blob=(g,f)=>{
const[sx,sy]=[[1.14,.84],[.94,1.12],[1.04,.97],[.98,1.05]][f],jx=[0,-1,0,1][f],lift=[0,5,2,0][f]
g.save();g.translate(28,46-lift);g.scale(sx,sy);g.translate(-28,-46)
cel(g,g=>sm(g,[3,45,0,30,8,16,28,9,48,16,56,30,53,45,28,48]),CH,{k:1.1,h:1,hs:2,r:OR,s:[[16,17,6,2.2,-.5]],sc:'rgba(255,225,180,.85)'})
for(const s of[-1,1])cel(g,g=>poly(g,[28+s*13,13,28+s*17,3,28+s*20,15]),IV,{k:.5,t:.7,w:.8})
cel(g,g=>sm(g,[8,30,16,34,14,44,10,44]),['#a84a00','#ff9a14','#ffe27a'],{k:.4,t:.5,w:.7})
vein(g,[38,12,42,19,40,24],1.2)
for(const s of[-1,1]){const x=28+s*9.5;g.beginPath();poly(g,[x-s*6,24,x+s*5,28.5,x+s*3,34,x-s*5,32]);g.fillStyle='#04202e';g.fill();g.strokeStyle=K;g.lineWidth=1.4;g.stroke();g.beginPath();poly(g,[x-s*4,26.4,x+s*3,29.6,x+s*2,32.2,x-s*3.6,31]);g.fillStyle='#8af2ff';g.fill();glow(g,x,30,12,'rgba(90,235,255,.7)')}
g.fillStyle='#ffe27a';ln(g,[18,40,22,38,28,41,34,38,38,40],1.6,'#1a0505')
g.beginPath();poly(g,[21,39.4,23.4,39.2,22.4,42.4]);poly(g,[33,38.6,35.4,39,34.2,42.2]);g.fillStyle='#fffbe6';g.fill()
g.restore()
}
const chest=(g,o)=>{
g.fillStyle='rgba(8,4,24,.45)';g.beginPath();ell(g,32,52,29,5);g.fill()
const WD=['#241008','#7a3a18','#d68a40'],GL=['#6a3a00','#ffb21f','#fff0a0']
if(o){
glow(g,32,22,40,'rgba(255,220,100,.6)')
g.save();g.globalCompositeOperation='lighter';g.fillStyle=lg(g,0,24,0,-4,[[0,'rgba(255,230,120,.5)'],[1,'rgba(255,230,120,0)']]);g.beginPath();poly(g,[14,26,50,26,58,0,6,0]);g.fill();g.restore()
cel(g,g=>{g.moveTo(10,25);g.lineTo(13,5);g.quadraticCurveTo(32,-1,51,5);g.lineTo(54,25);g.closePath()},['#3a0818','#8c1c3a','#d4486a'],{k:.9,h:1,hs:1.8})
cel(g,g=>g.roundRect(6,22,52,28,4),WD,{k:.9,h:1,hs:1.8,r:'rgba(255,190,90,.8)'})
cel(g,g=>sm(g,[9,24,16,18,24,21,32,16,40,21,48,18,55,24,55,28,9,28]),['#a86a00','#ffc21a','#fff7a0'],{k:.6,t:.8})
for(const[x,y]of[[18,20],[34,18],[46,21]]){g.fillStyle='#fff';g.beginPath();star(g,x,y-2,2);g.fill()}
}else{
cel(g,g=>g.roundRect(6,26,52,24,4),WD,{k:.9,h:1,hs:1.8,r:'rgba(255,190,90,.8)'})
cel(g,g=>{g.moveTo(5,28);g.quadraticCurveTo(5,5,32,5);g.quadraticCurveTo(59,5,59,28);g.closePath()},WD,{k:1,h:1,hs:1.8,r:'rgba(255,190,90,.8)',s:[[18,12,7,1.8,-.8]],sc:'rgba(255,240,200,.7)'})
for(const x of[16,40]){ln(g,[x,28,x+1,9],1,K,.5)}
ln(g,[12,22,52,22],.8,K,.5)
}
for(const x of[11,44])cel(g,g=>g.roundRect(x,o?22:7,8,o?28:43),GL,{k:.5,t:.7,w:.8})
cel(g,g=>g.roundRect(5,o?32:30,54,5,1.5),GL,{k:.5,t:.7,w:.8})
cel(g,g=>g.roundRect(26,o?30:26,12,12,3),GL,{k:.5,t:.7,w:.8})
glow(g,32,o?36:32,10,'rgba(255,60,170,.65)')
cel(g,g=>ell(g,32,o?36:32,3.2,3.6),['#6a0a4a','#ff2d9a','#ffc0e8'],{k:.4,t:.6,w:.7})
for(const[x,y]of[[10,28],[54,28],[10,46],[54,46]]){g.fillStyle='#fff0a0';g.beginPath();ell(g,x,y,1,1);g.fill()}
}
const potion=(g)=>{
glow(g,14,22,17,'rgba(255,60,150,.55)')
const bulb=g=>{g.moveTo(10.5,9);g.lineTo(10.5,13);g.bezierCurveTo(3,15,2,25,6,29);g.bezierCurveTo(10,33,18,33,22,29);g.bezierCurveTo(26,25,25,15,17.5,13);g.lineTo(17.5,9);g.closePath()}
cel(g,bulb,['#2a1a5a','#6a58b0','#d8e0ff'],{k:.8,t:1.2})
g.save();g.beginPath();bulb(g);g.clip()
g.fillStyle=lg(g,0,16,0,32,[[0,'#ff7aa8'],[.5,'#e0204a'],[1,'#7a0a34']]);g.beginPath();g.moveTo(0,19.4);g.quadraticCurveTo(7,16.6,14,19.4);g.quadraticCurveTo(21,22,28,19);g.lineTo(28,36);g.lineTo(0,36);g.fill()
g.fillStyle='rgba(255,255,255,.9)';g.beginPath();ell(g,8.2,22.4,1.5,4.2,.2);g.fill();g.beginPath();ell(g,9.4,27.6,.9,.9);g.fill()
g.fillStyle='rgba(255,200,230,.8)';g.beginPath();ell(g,18.6,25,1.2,1.2);ell(g,16.4,28.2,.8,.8);g.fill()
g.restore()
g.beginPath();bulb(g);g.lineWidth=1.3;g.strokeStyle=K;g.stroke()
cel(g,g=>g.roundRect(10,1.6,8,7.4,2),['#4a2208','#a8681e','#f0b868'],{k:.6,t:.8})
ln(g,[10,10,18,10],1.5,'#ffd46a')
}
const pack=(g)=>{
const GR=['#06281c','#14885a','#7af0a8']
cel(g,g=>{g.moveTo(11,9);g.bezierCurveTo(11,1,23,1,23,9)},GR,{k:.3,t:.4,w:.4})
ln(g,[10.5,10,11,3.4,17,1.8,23,3.4,23.5,10],3.4,K);ln(g,[10.5,10,11,3.4,17,1.8,23,3.4,23.5,10],1.6,'#d68a40')
cel(g,g=>g.roundRect(4,8,26,25,8),GR,{k:.9,h:1,hs:1.6,r:CY,s:[[10,13,4,1.4,-.7]],sc:'rgba(255,255,255,.7)'})
cel(g,g=>{g.moveTo(4,16);g.quadraticCurveTo(17,26,30,16);g.lineTo(30,13);g.quadraticCurveTo(17,1,4,13);g.closePath()},['#0a3a2a','#1ca870','#9affc0'],{k:.7,t:1})
cel(g,g=>g.roundRect(8,23,18,8,3),['#06281c','#0e6a44','#3ac888'],{k:.55,t:.8})
ln(g,[10,25.5,24,25.5],.7,'#fff',.45)
glow(g,17,19,6,'rgba(255,200,60,.6)')
cel(g,g=>g.roundRect(14,16.6,6,6.4,1.5),['#6a3a00','#ffb21f','#fff0a0'],{k:.4,t:.6,w:.7})
g.fillStyle=K;g.fillRect(16.4,18.6,1.4,2.4)
}
const kit=(g)=>{
glow(g,17,20,19,'rgba(190,110,255,.75)')
cel(g,g=>g.roundRect(14.4,2,5.2,9,2),['#5a4a90','#c8c0f0','#ffffff'],{k:.5,t:.7,w:.8})
cel(g,g=>g.roundRect(10,0.6,14,3.6,1.8),['#5a4a90','#c8c0f0','#ffffff'],{k:.5,t:.7,w:.8})
cel(g,g=>g.roundRect(11,9.4,12,20,3),['#3a1a88','#8a3ae8','#e0b0ff'],{k:.7,t:1,r:'rgba(255,120,220,.9)',s:[[13.4,14,1,4,0]],sc:'rgba(255,255,255,.85)'})
cel(g,g=>g.roundRect(6.4,10,21,3.4,1.6),['#5a4a90','#c8c0f0','#ffffff'],{k:.5,t:.7,w:.8})
for(const y of[17,21,25])ln(g,[17,y,21,y],.8,'#1a0a40',.7)
g.fillStyle='#fff';g.beginPath();star(g,17,19,3.2);g.fill()
ln(g,[17,29.4,17,35],1.7,K);ln(g,[17,29.4,17,35],.7,'#e8e0ff')
g.fillStyle='#e8c8ff';g.beginPath();star(g,29,6,2.2);g.fill();g.beginPath();star(g,5,26,1.8);g.fill()
}
const form=(g,f)=>{
const bob=[2,-2,2,-2][f],NL=[[-12,0],[0,-8],[12,0],[0,0]][f],FL=[[12,0],[0,0],[-12,0],[0,-8]][f],th=[-1,0,1,0][f]
const VI=['#1a0840','#5a24b0','#b078ff'],VD=['#10052a','#3a1680','#7a48d0']
glow(g,55,66,60,'rgba(170,80,255,.4)')
const lgf=(hx,o,pal)=>{const fx=hx+o[0],fy=118+o[1];cel(g,g=>{cap(g,hx,82+bob,hx+o[0]*.4,100,12,10);cap(g,hx+o[0]*.4,100,fx,fy-4,10,9)},pal,{k:1,h:1,hs:1.8,r:'rgba(255,90,200,.8)'});cel(g,g=>sm(g,[fx-12,fy-4,fx,fy-8,fx+12,fy-4,fx+14,fy+4,fx-14,fy+4]),['#0a0220','#2a1060','#5a30b0'],{k:.8});for(const d of[-8,0,8])ln(g,[fx+d,fy+2,fx+d,fy+7],2.2,K),ln(g,[fx+d,fy+2,fx+d,fy+6],1,'#f0e0ff')}
lgf(70,FL,VD);lgf(40,NL,VI)
cel(g,g=>{poly(g,[12,60+bob,0,28+bob,20,40+bob]);poly(g,[98,60+bob,110,28+bob,90,40+bob])},['#6a0a58','#e0309a','#ffa0e0'],{k:.8,t:1.4})
const arm=(s,t)=>{const sx=55+s*34,hx=sx+s*8+t*s*-4,hy=96+bob-(t*s>0?6:0);cel(g,g=>{cap(g,sx,56+bob,sx+s*11,78+bob,12,10);cap(g,sx+s*11,78+bob,hx,hy,10,9)},s>0?VD:VI,{k:1,h:1,hs:1.8,r:'rgba(255,90,200,.8)'});cel(g,g=>ell(g,hx,hy+4,9,8),s>0?VD:VI,{k:.8});for(const d of[-5,0,5])cel(g,g=>poly(g,[hx+d-2.4,hy+8,hx+d+s*1,hy+17,hx+d+2.4,hy+8]),['#8a6a20','#fff0c0','#ffffff'],{k:.5,t:.7,w:.8})}
arm(1,th);
cel(g,g=>{g.moveTo(24,50+bob);g.quadraticCurveTo(55,36+bob,86,50+bob);g.lineTo(80,92+bob);g.quadraticCurveTo(55,100+bob,30,92+bob);g.closePath()},VI,{k:1.3,h:1,hs:1.8,r:'rgba(255,90,200,.8)'})
cel(g,g=>sm(g,[38,62+bob,55,56+bob,72,62+bob,70,84+bob,55,90+bob,40,84+bob]),['#3a1a70','#8a50e0','#d8b0ff'],{k:.9,t:1})
for(const y of[68,76,84])ln(g,[44,y+bob,66,y+bob],.9,'#2a1060',.7)
for(const[x,y]of[[34,48],[55,42],[76,48]])cel(g,g=>poly(g,[x-5,y+bob+4,x,y+bob-9,x+5,y+bob+4]),['#6a0a58','#e0309a','#ffa0e0'],{k:.5,t:.8})
arm(-1,th)
const hy=24+bob
cel(g,g=>{for(const s of[-1,1])g.moveTo(55+s*14,hy-8),g.bezierCurveTo(55+s*34,hy-8,55+s*34,hy-30,55+s*24,hy-34),g.bezierCurveTo(55+s*26,hy-22,55+s*18,hy-18,55+s*10,hy-14),g.closePath()},['#6a4a2a','#e6d2a4','#fffbe6'],{k:.8,h:1,hs:1.8})
cel(g,g=>{ell(g,36,hy+4,12,11);ell(g,45,hy-8,14,12);ell(g,66,hy-8,14,12);ell(g,75,hy+4,12,11);ell(g,55,hy+10,18,13)},['#6a58b8','#d0c4ff','#fbf8ff'],{k:1.1,h:2,hs:2,r:'rgba(255,90,200,.8)',s:[[42,hy-15,5,1.8,-.5]],sc:'#fff'})
cel(g,g=>sm(g,[40,hy,44,hy-6,66,hy-6,70,hy,68,hy+12,55,hy+18,42,hy+12]),['#0a0220','#24104a','#3a1e78'],{k:.7,t:1})
for(const x of[47,63]){glow(g,x,hy+2,15,'rgba(255,60,170,.9)');g.beginPath();poly(g,[x-5,hy-1,x+5,hy+1,x+3,hy+6,x-4,hy+5]);g.fillStyle='#fff';g.fill();g.strokeStyle='#ff2d9a';g.lineWidth=1;g.stroke()}
g.beginPath();g.moveTo(44,hy+10);for(let i=0;i<6;i++)g.lineTo(44+i*4.4+2.2,hy+(i%2?10:14));g.lineTo(66,hy+10);g.fillStyle='#fff';g.fill();g.strokeStyle=K;g.lineWidth=.8;g.stroke()
}
const desk=(g)=>{
const WD=['#1c0e1a','#5a2a3a','#b0604a'],MT=['#0c1a34','#1c3a74','#5a8ae0']
g.fillStyle='rgba(8,4,24,.45)';g.beginPath();ell(g,85,102,76,6);g.fill()
for(const x of[10,144])cel(g,g=>g.roundRect(x,66,14,36,3),WD,{k:.9,h:1,hs:1.7})
cel(g,g=>g.roundRect(24,68,122,22,3),['#12081c','#2c1640','#583a80'],{k:.8,h:1,hs:1.7})
for(const x of[44,104])cel(g,g=>g.roundRect(x,72,28,12,2),['#12081c','#3a2060','#6a4aa0'],{k:.5,t:.8}),cel(g,g=>ell(g,x+14,78,2.4,2.4),['#6a3a00','#ffb21f','#fff0a0'],{k:.4,t:.5,w:.7})
cel(g,g=>g.roundRect(2,56,166,13,4),WD,{k:1,h:1,hs:1.7,r:'rgba(255,190,120,.7)',s:[[24,58,16,1,0]],sc:'rgba(255,230,190,.8)'})
cel(g,g=>g.roundRect(76,54,18,6,2),MT,{k:.6,t:.9})
cel(g,g=>g.roundRect(51,-.5,86,59,8),['#0c1a34','#243f80','#6a96ee'],{k:1.1,h:1,hs:1.8,r:CY})
g.fillStyle='#021008';g.fillRect(59.3,5.4,70,45.7)
g.strokeStyle=K;g.lineWidth=1.4;g.strokeRect(59.3,5.4,70,45.7)
g.fillStyle='#ff2d6a';g.beginPath();ell(g,132,54,1.4,1.4);g.fill();g.fillStyle='#38ffa8';g.beginPath();ell(g,127,54,1.4,1.4);g.fill()
cel(g,g=>g.roundRect(46,60,56,7,2.4),['#1a1030','#3a2a60','#7a68b8'],{k:.6,t:.9})
for(let i=0;i<9;i++){g.fillStyle=i%2?'#a8a0e0':'#d8d0ff';g.fillRect(49+i*6,61.4,4,1.6)}
cel(g,g=>{g.moveTo(22,56);g.lineTo(16,32);g.lineTo(24,22)},MT,{k:.3,t:.4,w:.6})
ln(g,[22,56,18,38,25,24],3.2,K);ln(g,[22,56,18,38,25,24],1.6,'#5a8ae0')
cel(g,g=>sm(g,[19,20,32,16,38,24,24,28]),['#8c0f55','#e3248d','#ff80c4'],{k:.6,t:.9})
glow(g,28,26,22,'rgba(255,220,120,.55)')
cel(g,g=>g.roundRect(142,42,14,13,3),['#4a0a38','#c0268a','#ff80c4'],{k:.6,t:.9})
ln(g,[156,45,160,47,160,51,156,52],1.5,K);ln(g,[148,38,146,34],1,'rgba(255,255,255,.6)');ln(g,[151,38,153,33],1,'rgba(255,255,255,.6)')
cel(g,g=>g.roundRect(30,50,14,6,1.5),['#8a8aa8','#e8e8ff','#ffffff'],{k:.5,t:.8})
}
export function art2(S){
const A={}
A.boss=[0,1,2,3,4,5].map(f=>spr(240,250,120,244,S,g=>boss(g,f,f<4?f:0),1))
A.blob=[0,1,2,3].map(f=>spr(56,50,28,46,S,g=>blob(g,f),2))
A.chest=[0,1].map(o=>spr(64,56,32,52,S,g=>chest(g,o),2))
A.potion=spr(28,34,14,32,S,potion,2.5)
A.pack=spr(34,36,17,34,S,pack,2.5)
A.kit=spr(34,36,17,34,S,kit,2.5)
A.form=[0,1,2,3].map(f=>spr(110,130,55,124,S,g=>form(g,f),1.4))
A.desk=spr(170,110,85,104,S,desk,1.5)
A.deskScreen={x:59.3,y:5.4,w:70,h:45.7}
return A
}
