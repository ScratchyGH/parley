import{kit,txt}from'./kit.js'
import{rg,lg,draw}from'./dsart.js'
import{art,art2,island,lab,room,ready,fr}from'./custom.js'
import{death}from'./deepdeath.js'
const VW=960,VH=540,TAU=6.283
const SK='parley.ds'
const load=()=>{try{return JSON.parse(localStorage.getItem(SK)||'{}')}catch{return{}}}
const save=o=>{try{localStorage.setItem(SK,JSON.stringify({...load(),...o}))}catch{}}
const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2
const cl=(v,a,b)=>Math.max(a,Math.min(b,v))
const F='Georgia,"Times New Roman",serif'
const R=(c,x,y,w,h,f)=>{c.fillStyle=f;c.fillRect(x,y,w,h)}
const O=(c,x,y,r,f)=>{c.fillStyle=f;c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
const orb=(c,x,y,r,col)=>{c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(c,x,y,0,r,[[0,col],[1,'rgba(0,0,0,0)']]);c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
const shadow=(c,x,y,w)=>{c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(x,y,w,w*.26,0,0,TAU);c.fill()}
const sky=c=>{c.fillStyle=lg(c,0,0,0,VH,[[0,'#ffd0ea'],[.55,'#cfe4ff'],[1,'#b6f1e6']]);c.fillRect(0,0,VW,VH)}
const clouds=(c,t,k)=>{for(let i=0;i<7;i++){const x=((i*260+t*(8+i*3)*k)%1300)-170,y=60+(i%3)*70;c.fillStyle='rgba(255,255,255,.55)';for(const[dx,dy,r]of[[0,0,34],[38,6,28],[-38,8,26],[14,-14,26]]){c.beginPath();c.arc(x+dx,y+dy,r,0,TAU);c.fill()}}}
const wrap=(c,s,w)=>{const o=[];let l='';for(const t of s.split(' ')){const n=l?l+' '+t:t;if(c.measureText(n).width>w&&l){o.push(l);l=t}else l=n}if(l)o.push(l);return o}
const NAME={'You':'#a9c7ff','Mom':'#ffb3c7','Dr. Cocoa':'#ffcf8a','Panel':'#86efac','Poster':'#fca5a5','Scribble':'#fca5a5','Cell 1':'#9ad8ff','Cell 2':'#9ad8ff','Cell 3':'#9ad8ff','Cell 4':'#9ad8ff'}
function cap(c,who,s,done){
c.save()
c.fillStyle='rgba(10,8,18,.88)';c.beginPath();c.roundRect(50,VH-112,VW-100,98,18);c.fill()
c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=1.5;c.stroke()
if(who){c.font='800 15px Figtree,sans-serif';const w=c.measureText(who).width+26;c.fillStyle=NAME[who]||'#d4d3cc';c.beginPath();c.roundRect(72,VH-126,w,26,13);c.fill();c.fillStyle='#10101a';c.fillText(who,85,VH-108)}
c.font='italic 600 23px '+F;c.fillStyle='#f6f2e8'
wrap(c,s,VW-170).slice(0,2).forEach((l,i)=>c.fillText(l,76,VH-62+i*30))
if(done&&Math.sin(performance.now()/260)>0){c.fillStyle='#d4d3cc';c.beginPath();c.moveTo(VW-86,VH-34);c.lineTo(VW-70,VH-34);c.lineTo(VW-78,VH-24);c.fill()}
c.restore()
}
function pill(c,x,y,s,w){c.save();c.fillStyle='rgba(10,8,18,.82)';c.beginPath();c.roundRect(x-w/2,y,w,38,19);c.fill();c.strokeStyle='rgba(255,255,255,.16)';c.stroke();c.font='700 17px Figtree,sans-serif';c.fillStyle='#f6f5ef';c.textAlign='center';c.fillText(s,x,y+25);c.restore()}
const vigC=document.createElement('canvas')
vigC.width=VW;vigC.height=VH
{const g=vigC.getContext('2d');g.fillStyle=rg(g,VW/2,VH/2,VH*.35,VW*.62,[[0,'rgba(0,0,0,0)'],[1,'rgba(4,2,12,.75)']]);g.fillRect(0,0,VW,VH)}
const terror=(c,t)=>{
c.fillStyle=lg(c,0,0,0,VH,[[0,'#06000a'],[1,'#2e0712']]);c.fillRect(0,0,VW,VH)
orb(c,700,120,160,'rgba(220,40,50,.45)');O(c,700,120,46,'#b3202c');O(c,700,120,38,'#e04050')
c.fillStyle='#0c0408';c.beginPath();c.moveTo(0,420);for(let x=0;x<=VW;x+=40)c.lineTo(x,410+Math.sin(x*.05)*12);c.lineTo(VW,VH);c.lineTo(0,VH);c.fill()
for(let i=0;i<9;i++){const x=60+i*108;c.fillStyle='#160a10';c.beginPath();c.roundRect(x,370+(i%3)*8,34,56,[14,14,0,0]);c.fill()}
for(let i=0;i<9;i++){const x=90+i*100+Math.sin(t*1.4+i)*18,y=300+(i%4)*38,b=Math.sin(t*3+i*2)>-.7?1:.1;orb(c,x-7,y,16,'rgba(255,40,50,'+(.7*b)+')');orb(c,x+7,y,16,'rgba(255,40,50,'+(.7*b)+')');O(c,x-7,y,2.6*b,'#fff');O(c,x+7,y,2.6*b,'#fff')}
for(let i=0;i<3;i++){const y=380+i*34,o=(t*20*(i+1))%200;c.fillStyle='rgba(180,60,70,.1)';c.beginPath();c.ellipse(300+i*220+o-100,y,260,22,0,0,TAU);c.fill()}
}
const dreamBg=(c,t,I)=>{sky(c);clouds(c,t,1);c.save();c.translate(-160,-110);c.scale(.92,.92);c.drawImage(I.c,0,0,I.W,I.H);c.restore()}
const bedroom=(c,A)=>{
c.fillStyle=lg(c,0,0,0,VH,[[0,'#101830'],[1,'#0a0e20']]);c.fillRect(0,0,VW,VH)
c.fillStyle=lg(c,0,430,0,VH,[[0,'#241a30'],[1,'#120c1c']]);c.fillRect(0,430,VW,110)
c.fillStyle='#1a2548';c.beginPath();c.roundRect(110,80,170,200,6);c.fill();c.strokeStyle='#3a4a7a';c.lineWidth=5;c.stroke()
c.fillStyle=lg(c,0,86,0,274,[[0,'#2a3f80'],[1,'#121c48']]);c.fillRect(116,86,158,188)
O(c,225,135,22,'#f1f5ff');c.strokeStyle='#3a4a7a';c.beginPath();c.moveTo(195,86);c.lineTo(195,274);c.moveTo(116,180);c.lineTo(274,180);c.stroke()
c.save();c.globalCompositeOperation='lighter';c.fillStyle=lg(c,200,200,520,520,[[0,'rgba(150,180,255,.22)'],[1,'rgba(150,180,255,0)']]);c.beginPath();c.moveTo(116,274);c.lineTo(274,274);c.lineTo(560,540);c.lineTo(300,540);c.fill();c.restore()
}
const bed=(c,x,y,b)=>{
c.fillStyle='#3a2616';c.beginPath();c.roundRect(x-10,y-20,330,84,10);c.fill();c.strokeStyle='#140b1c';c.lineWidth=2;c.stroke()
c.fillStyle=lg(c,0,y-30,0,y+8,[[0,'#e6e9f6'],[1,'#a8aed0']]);c.beginPath();c.roundRect(x,y-30,310,40,12);c.fill();c.stroke()
c.fillStyle=lg(c,0,y-44,0,y-20,[[0,'#ffffff'],[1,'#d3d8f0']]);c.beginPath();c.roundRect(x+8,y-44,70,26,12);c.fill();c.stroke()
if(b>0){const w=Math.min(1,b)*270;c.fillStyle=lg(c,0,y-52,0,y+10,[[0,'#8a76ee'],[1,'#4a3aa8']]);c.beginPath();c.moveTo(x+300,y+8);c.lineTo(x+300,y-34);c.quadraticCurveTo(x+300-w/2,y-60,x+300-w,y-32);c.lineTo(x+300-w,y+8);c.closePath();c.fill();c.stroke();c.strokeStyle='rgba(255,255,255,.18)';c.beginPath();for(let i=1;i<4;i++){c.moveTo(x+300-w*i/4,y-30);c.lineTo(x+300-w*i/4,y+6)}c.stroke()}
}
const SEG=[
{d:4.6,l:[[.05,.48,'You','Goodnight, Mom.'],[.5,.98,'Mom','Goodnight, sweetheart. Sleep tight.']],f:(c,p,t,A,X)=>{
c.drawImage(X.liv.c,0,0,VW,VH)
orb(c,860,200,260,'rgba(255,190,110,.35)');R(c,857,230,6,230,'#2a1810');c.fillStyle='#ffd48a';c.beginPath();c.moveTo(835,230);c.lineTo(885,230);c.lineTo(875,190);c.lineTo(845,190);c.fill()
c.save();c.globalCompositeOperation='lighter';c.fillStyle=lg(c,200,150,420,450,[[0,'rgba(170,190,255,.25)'],[1,'rgba(170,190,255,0)']]);c.beginPath();c.moveTo(126,96);c.lineTo(264,96);c.lineTo(520,470);c.lineTo(250,470);c.fill();c.restore()
shadow(c,300+p*40,474,60);draw(c,A.kid.skin[0],300+p*40,474+Math.sin(t*2)*1.5,2.5)
shadow(c,700,476,90);draw(c,A.mom,700,476+Math.sin(t*1.5)*1.2,1.7)
}},
{d:3.6,l:[[.15,.9,'','Up the stairs.']],f:(c,p,t,A,X)=>{
const e=ease(p),cam=e*640
c.save();c.translate(-cam,0)
c.drawImage(X.liv.c,0,0,VW,VH)
c.fillStyle=lg(c,0,0,0,VH,[[0,'#2a1d2a'],[1,'#1a1220']]);c.fillRect(960,0,900,VH)
for(let x=960;x<1860;x+=60){c.fillStyle='rgba(255,255,255,.035)';c.fillRect(x,0,30,430)}
c.fillStyle='#2a1810';c.fillRect(960,430,900,110)
for(let i=0;i<9;i++){const x=1040+i*46,h=(i+1)*26;c.fillStyle=lg(c,0,430-h,0,430,[[0,'#6a4a30'],[1,'#3a2414']]);c.fillRect(x,430-h,46,h+6);c.fillStyle='#8a6a4a';c.fillRect(x,430-h,46,5)}
c.strokeStyle='#cfa070';c.lineWidth=7;c.beginPath();c.moveTo(1040,370);c.lineTo(1454,140);c.stroke();c.lineWidth=3;for(let i=0;i<9;i++){c.beginPath();c.moveTo(1040+i*46+10,370-i*26);c.lineTo(1040+i*46+10,430-i*26-24);c.stroke()}
orb(c,1620,260,200,'rgba(255,200,120,.25)');c.fillStyle='#120c0a';c.fillRect(1500,120,260,310)
const x=300+e*1130,st=cl((x-1040)/46,0,9),y=474-st*26
shadow(c,x,474,60);draw(c,fr(A.kid.skin,1,t*.7),x,y,2.4)
c.restore()
}},
{d:3.2,l:[[.62,.98,'','Click.']],f:(c,p,t,A,X)=>{
bedroom(c,A)
const w=250*(1-ease(cl((p-.25)/.6,0,1)))
c.fillStyle='#04030a';c.fillRect(630,110,250,330)
if(w>2){c.fillStyle='#ffd48a';c.fillRect(630,110,w,330);c.save();c.globalCompositeOperation='lighter';c.fillStyle=lg(c,0,0,500,0,[[0,'rgba(255,210,140,'+(.3*(w/250))+')'],[1,'rgba(255,210,140,0)']]);c.beginPath();c.moveTo(630,440);c.lineTo(630+w,440);c.lineTo(300,540);c.lineTo(-60,540);c.fill();c.restore()}
c.fillStyle=lg(c,630+w,0,880,0,[[0,'#7a5232'],[1,'#4a2e1a']]);c.fillRect(630+w,110,250-w,330);c.strokeStyle='#140b1c';c.lineWidth=3;c.strokeRect(630+w,110,250-w,330)
if(250-w>40){c.fillStyle='#d9b98a';c.beginPath();c.arc(630+w+20,280,7,0,TAU);c.fill()}
c.strokeStyle='#3a2616';c.lineWidth=12;c.strokeRect(624,104,262,342)
shadow(c,460,474,60);draw(c,A.kid.skin[0],460,474+Math.sin(t*2),2.5)
}},
{d:3.6,l:[],f:(c,p,t,A,X)=>{
bedroom(c,A)
const on=p<.4||(p<.66&&Math.sin(p*110)>0)
bed(c,610,452,0)
c.strokeStyle='#6a6a7a';c.lineWidth=3;c.beginPath();c.moveTo(480,0);c.lineTo(480,96);c.stroke();c.fillStyle='#e8e0c8';c.beginPath();c.moveTo(450,128);c.lineTo(510,128);c.lineTo(496,96);c.lineTo(464,96);c.fill();O(c,480,132,10,on?'#fff6c0':'#33333f')
if(on){orb(c,480,140,300,'rgba(255,236,170,.5)');c.save();c.globalCompositeOperation='lighter';c.fillStyle=lg(c,0,130,0,540,[[0,'rgba(255,236,170,.2)'],[1,'rgba(255,236,170,0)']]);c.beginPath();c.moveTo(462,130);c.lineTo(498,130);c.lineTo(720,540);c.lineTo(240,540);c.fill();c.restore()}
shadow(c,480,474,60);draw(c,A.kid.skin[0],480,474+Math.sin(t*2),2.5)
const k=on?0:Math.min(.93,(p-.4)*3.2);c.fillStyle='rgba(2,2,8,'+k+')';c.fillRect(0,0,VW,VH)
}},
{d:5.4,l:[[.12,.52,'','The light is moving.'],[.58,.98,'','It is coming for you.']],f:(c,p,t,A,X)=>{
c.fillStyle='#02020a';c.fillRect(0,0,VW,VH)
const e=ease(p),y=130+e*(300),r=10+e*30
c.save();c.globalAlpha=.35;shadow(c,480,474,60);draw(c,A.kid.skin[0],480,474,2.5);c.restore()
for(let i=0;i<14;i++){const k=i/14,yy=y-i*14*(1-e*.5);orb(c,480+Math.sin(t*3+i)*(6+i),yy,r*(1-k)*1.4,'rgba(255,236,170,'+(.3*(1-k))+')')}
orb(c,480,y,r*6,'rgba(255,236,170,.14)');orb(c,480,y,r*2.4,'rgba(255,236,170,.4)');O(c,480,y,r,'#fffbe0')
c.save();c.globalAlpha=Math.min(1,e*1.5);draw(c,A.kid.skin[0],480,474,2.5);c.restore()
if(p>.9){c.fillStyle='rgba(255,246,200,'+(p-.9)*4+')';c.fillRect(0,0,VW,VH)}
}},
{d:5.2,l:[[.08,.4,'','Just sleep.']],f:(c,p,t,A,X)=>{
bedroom(c,A)
bed(c,610,452,p>.72?(p-.72)/.22:0)
const wk=cl(p/.4,0,1),jp=cl((p-.4)/.28,0,1)
if(p<.68){const x=260+wk*330+jp*130,y=474-Math.sin(jp*Math.PI)*150-(jp>=1?80:0);shadow(c,x,474,50);draw(c,(p<.4?fr(A.kid.skin,1,t*.7):A.kid.skin[0]),x,y,2.4)}
else{c.save();c.translate(780,400);c.rotate(-Math.PI/2);c.scale(2.2,2.2);{const q=A.kid.skin[0];c.drawImage(q.c,-q.ax,-q.ay,q.w,q.h)};c.restore();if(p>.74)bed(c,610,452,(p-.72)/.22)}
if(p>.78)for(let i=0;i<3;i++){const q=((t*.6+i*.33)%1);c.fillStyle='rgba(200,220,255,'+(1-q)+')';c.font='800 '+(18+i*8)+'px '+F;c.fillText('z',700+i*30+q*40,350-q*110)}
c.fillStyle='rgba(2,2,10,'+(p>.9?(p-.9)*4:0)+')';c.fillRect(0,0,VW,VH)
}},
{d:3,l:[],f:(c,p,t,A,X)=>{
c.fillStyle='#05020e';c.fillRect(0,0,VW,VH)
const n=Math.pow(p,1.6)
for(let r=0;r<18;r++){const q=((r/18+t*.5)%1),rad=10+q*q*700;c.strokeStyle='hsla('+(250+r*8)+',90%,'+(50+q*30)+'%,'+(1-q)*.6+')';c.lineWidth=2+q*10;c.beginPath();c.arc(480,270,rad,0,TAU);c.stroke()}
for(let i=0;i<160;i++){const a=i*2.399,d=30+n*500+(i%9)*30,l=20+n*340;c.strokeStyle='hsla('+(230+i%90)+',95%,'+(60+i%30)+'%,'+(.3+n*.6)+')';c.lineWidth=1+n*3;c.beginPath();c.moveTo(480+Math.cos(a)*d,270+Math.sin(a)*d*.6);c.lineTo(480+Math.cos(a)*(d+l),270+Math.sin(a)*(d+l)*.6);c.stroke()}
c.save();c.translate(480,270);c.rotate(t*3);const s=2.2*(1-p*.7);{const q=A.kid.skin[0];c.drawImage(q.c,-q.ax*s,-q.h/2*s,q.w*s,q.h*s)};c.restore()
c.fillStyle='rgba(255,255,255,'+cl((p-.82)*5.5,0,1)+')';c.fillRect(0,0,VW,VH)
}},
{d:8,l:[],f:(c,p,t,A,X)=>{
const f=Math.sin(p*80*(.35+p)+Math.sin(p*27)*3)>.25-p*.55,sc=p>.9
if(f)dreamBg(c,t,X.isl);else terror(c,t)
const edge=Math.abs(Math.sin(p*80*(.35+p)+Math.sin(p*27)*3))<.14
if(edge)for(let i=0;i<7;i++){c.save();c.beginPath();c.rect(0,i*80,VW,40);c.clip();c.translate((Math.random()-.5)*60,0);if(f)terror(c,t);else dreamBg(c,t,X.isl);c.restore()}
const sh=sc?(Math.random()-.5)*16:0
shadow(c,480+sh,478,70);draw(c,fr(A.kid.pumpkin,1,t*.6),480+sh,478,3.2)
if(f)orb(c,480,330,150,'rgba(255,220,150,.18)');else orb(c,480,330,150,'rgba(255,60,60,.25)')
if(p>.86){const s=(p-.86)/.14;c.save();c.font='900 '+(80+s*180)+'px '+F;c.textAlign='center';c.fillStyle='rgba(255,0,60,.8)';c.fillText('AAAAAAAAH',480+sh-5,200);c.fillStyle='rgba(0,220,255,.8)';c.fillText('AAAAAAAAH',480+sh+5,200);c.fillStyle='#fff';c.fillText('AAAAAAAAH',480+sh,200);c.restore();c.fillStyle='rgba(255,255,255,'+cl((p-.9)*10,0,1)+')';c.fillRect(0,0,VW,VH)}
}},
{d:4,l:[[.42,.98,'You','...why do I feel so light?']],f:(c,p,t,A,X)=>{
dreamBg(c,t,X.isl)
const b=p<.4?'pumpkin':'cloud',pop=p>=.4?1+Math.max(0,.3-(p-.4)*1.2):1
shadow(c,480,478,70);draw(c,A.kid[b][0],480,478+Math.sin(t*3)*3,3.2*pop)
if(p>.38&&p<.6){for(let i=0;i<14;i++){const a=i*.45;orb(c,480+Math.cos(a)*(30+(p-.4)*500),340+Math.sin(a)*(30+(p-.4)*500),24,'rgba(255,255,255,.7)')}}
c.fillStyle='rgba(255,255,255,'+Math.max(0,.95-p*3)+')';c.fillRect(0,0,VW,VH)
}}
]
const poly=(g,a,f,s)=>{g.beginPath();a.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fillStyle=f;g.fill();if(s){g.strokeStyle=s;g.lineWidth=1;g.stroke()}}
function doomFrame(g,w,h){
g.save();g.scale(w/320,h/200);g.fillStyle='#050202';g.fillRect(0,0,320,200)
for(let i=0;i<8;i++){const x0=i*18,y0=i*11,x1=x0+18,y1=y0+11,d=1-i/9
poly(g,[[x0,y0],[320-x0,y0],[320-x1,y1],[x1,y1]],'rgb('+(46*d|0)+','+(24*d|0)+','+(22*d|0)+')','rgba(0,0,0,.4)')
poly(g,[[x0,200-y0],[320-x0,200-y0],[320-x1,200-y1],[x1,200-y1]],'rgb('+(86*d|0)+','+(52*d|0)+','+(36*d|0)+')','rgba(0,0,0,.4)')
poly(g,[[x0,y0],[x1,y1],[x1,200-y1],[x0,200-y0]],'rgb('+(132*d|0)+','+(44*d|0)+','+(36*d|0)+')','rgba(0,0,0,.45)')
poly(g,[[320-x0,y0],[320-x1,y1],[320-x1,200-y1],[320-x0,200-y0]],'rgb('+(132*d|0)+','+(44*d|0)+','+(36*d|0)+')','rgba(0,0,0,.45)')}
g.fillStyle='#000';g.fillRect(144,88,32,24)
g.fillStyle='#120606';g.beginPath();g.moveTo(138,112);g.lineTo(138,96);g.quadraticCurveTo(160,70,182,96);g.lineTo(182,112);g.fill()
g.fillStyle='#0a0303';g.beginPath();g.ellipse(160,110,15,22,0,Math.PI,0);g.fill();g.fillRect(145,108,30,16)
g.fillStyle='#ff2a1a';g.fillRect(152,100,4,3);g.fillRect(164,100,4,3)
g.fillStyle='#d8d0b8';g.fillRect(120,118,8,40);g.fillRect(122,112,4,8)
g.fillStyle='#2a2a30';poly(g,[[176,200],[196,200],[170,138],[162,142]],'#2a2a30','#000')
poly(g,[[186,200],[214,200],[176,142],[168,146]],'#3a3a44','#000')
g.fillStyle='#6a4a2a';g.fillRect(164,176,40,24);g.fillStyle='#8a6a40';g.fillRect(168,180,30,6)
g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,0,320,200)
g.fillStyle='rgba(255,40,30,.92)';g.font='900 38px monospace';g.textAlign='center';g.fillText('PAUSED',160,108)
g.fillStyle='#1a0a0a';g.fillRect(0,184,320,16);g.fillStyle='#d8c070';g.font='700 10px monospace';g.fillText('HEALTH 073   AMMO 004   ARMOR 000',160,195)
g.restore()}
let BU=[],AB=[]
function run(box,go,o,A,X){
const S=load()
let scene=o.scene||(S.seen?'island':'intro')
let seg=0,st=0,sc=1,ox=0,oy=0,time=0,tut=0,D=null,near=null,walk=0
let P={x:620,y:520,f:1},cam={x:0,y:0},wisps=[1,1,1]
const M={pats:0,wishes:0,bench:0,lab:0,fails:0,pc:0,...(S.m||{})}
const sv=()=>save({m:M})
const B=X.B
const nw=()=>wisps.filter(x=>!x).length
let post=!!(S.freed&&!S.dd&&!o.betray),brk=S.dd?[1,1,1,1]:[0,0,0,0],pr=[null,null,null],shk=0,cut=-1,sh=[],dmc=null
const dr=(c,s,x,y,k,f,sx,sy)=>{c.save();c.translate(x,y);c.scale((f?-1:1)*k*(sx||1),k*(sy||1));c.drawImage(s.c,-s.ax,-s.ay,s.w,s.h);c.restore()}
const smash=i=>{brk[i]=1;shk=18;const cx=[185,315,675,805][i];for(let j=0;j<26;j++)sh.push({x:cx+(Math.random()-.5)*100,y:120+Math.random()*80,vx:(Math.random()-.5)*260,vy:-Math.random()*200,l:1.4,r:2+Math.random()*4})
const L=[['Subject 01','Thank you. I could not wake up. I could not wake up.'],['Subject 02','He told me running was the only thing keeping me alive.'],['Subject 07','Thirty years. I almost forgot I had a name. Do not laugh at the pumpkin.'],['','The last case holds nothing but a scorched brass key tag. It reads: HARVEST COMPLETE.']][i]
if(i<3)pr[i]={x:cx,y:205,t:0,tx:cx+(i-1)*30,ty:340+i*14}
if(brk.every(x=>x)){talk([L,['Dr. Cocoa','(from the doorway, very calm) Thank you. I could not break them myself. Glass that old only opens for a dreamer who is not afraid.'],['You','You used me.'],['Dr. Cocoa','They were ripe. You were the key. Now, hold still.']],()=>{cut=0})}else talk([L])}
const cocoa=()=>{const r=[];
if(S.dd)return[['','Nobody is here. Just a pair of cracked goggles in the grass.']]
r.push('Ah. A new dreamer, and a cloud for a head. Lovely.')
if(M.fails>0)r.push('You came out of the lab pale. The night is not kind, is it. Rest. Try again when you are less afraid.')
if(M.lab>0&&!S.freed)r.push('You went inside, did you not. I can smell the cold on you. I told you not to.')
if(S.freed)r.push('You beat the night. Remarkable. Go and see to the cases when you are ready.')
if(M.pats>=3)r.push('The sheep adores you. It does not do that for just anyone.')
if(M.wishes>=2)r.push('Do not wish at that pond too often. It tells the truth, and the truth is a poor bedtime story.')
if(nw()===3)r.push('You collected every wisp. How thorough. How very patient.')
else if(nw()>0)r.push('I see you are collecting the wisps. '+nw()+' of 3, so far.')
if(!r[1])r.push('Rest here as long as you like. The island is safe. Pat the sheep, make a wish, collect the wisps.','But do not go into the science lab. The door hums for a reason.')
return r.map(t=>['Dr. Cocoa',t])}
const talk=(lines,after)=>{D={lines,i:0,n:0,after}}
const adv=()=>{if(!D)return false;const l=D.lines[D.i];if(D.n<l[1].length){D.n=l[1].length;return true}D.i++;D.n=0;if(D.i>=D.lines.length){const a=D.after;D=null;a&&a()}return true}
const IS=[
{x:520,y:470,r:90,t:()=>S.dd?'Look at the goggles':'Talk to Dr. Cocoa',a:()=>talk(cocoa())},
{x:900,y:380,r:90,t:'Pat the cloud sheep',a:()=>{M.pats++;sv();talk([['Cloud Sheep',S.dd?'Baaa. (It leans against your leg and does not let go.)':M.pats<3?'Baaaa. (It is warm and smells like rain.)':M.pats<6?'Baaa. (It slips a wisp of cloud onto your head like a crown.)':'Baaa. (It has stopped being a sheep and started being a friend.)']])}},
{x:700,y:650,r:100,t:'Make a wish',a:()=>{M.wishes++;sv();const w=['The pond ripples. A voice that sounds like your mom hums one note and stops.','The pond shows a tall chocolate figure at a window, watching you.','The pond shows a long row of beds. Nobody in them is dreaming.'];const l=[['Pond',S.dd?'The pond shows your room, morning light on the floor. Someone is making breakfast.':w[(M.wishes-1)%3]]];if(M.wishes>=4&&!S.dd)l.push(['Pond','It shows the lab door. Behind it, four glass cases. One of them is already cracked.']);talk(l)}},
{x:350,y:430,r:90,t:'Sit on the bench',a:()=>{M.bench++;sv();talk([['Bench','You sit. Somewhere far away, someone is humming the song your mom sings at night.'],['You',S.dd?'It is quieter now. I think it is over.':M.lab?'I should not have gone in there. The humming sounds different now.':'Why can I remember it so clearly here?']])}},
{x:820,y:260,r:60,w:0},{x:420,y:300,r:60,w:1},{x:1050,y:560,r:60,w:2},
{x:1000,y:350,r:80,t:'Enter the science lab',a:()=>{M.lab++;sv();talk(S.dd?[['You','The door hangs open. Nothing hums behind it anymore.']]:S.freed?[['You','Time to open those cases.']]:nw()<3?[['Dr. Cocoa','(from far behind you) I told you not to!'],['You','The door slides open.']]:[['Dr. Cocoa','(from far behind you) Every wisp. Then you already suspect. Fine. Look. Then forget.'],['You','The door slides open.']],()=>{scene='lab';P={x:480,y:430,f:1};save({seen:1})})}}
]
const gate=()=>{if(S.dd)return talk([['You','Quiet. The feeds are dark, and the HARVEST meter reads zero.']]);if(post)return talk([['Panel','The feeds are frozen on the last second. The meter is full. The cases are what matter now.']]);return null}
const cellA=(i,l)=>()=>{if(post&&!brk[i])return smash(i);if(brk[i])return;talk(M.fails>1&&i===0?[['Cell 1','Her eyes follow you. She mouths: you came back.']]:l)}
const cellT=i=>()=>brk[i]?'':post?'Smash the case':'Look in the cell'
const LI=[
{x:185,y:225,r:75,t:cellT(0),a:cellA(0,[['Cell 1','A girl sleeps standing up, eyes open. Her breath fogs the glass. The tag reads: SUBJECT 01, afraid of the dark.']])},
{x:315,y:225,r:75,t:cellT(1),a:cellA(1,[['Cell 2','A boy presses both hands to the glass and mouths one word over and over: run.']])},
{x:675,y:225,r:75,t:cellT(2),a:cellA(2,[['Cell 3','A boy with a pumpkin for a head sits perfectly still. His tag: SUBJECT 07. He has dreamt of the same hallway for thirty years.']])},
{x:805,y:225,r:75,t:cellT(3),a:cellA(3,[['Cell 4','The cell is empty. Scratched on the wall: he lets you out when you are not afraid. He never lets you out.']])},
{x:480,y:235,r:95,t:'Read the panel',a:()=>{if(gate())return;talk([['Panel','Four live feeds. Each prisoner is trapped in the same place: Terror Night. Monsters circle them in the dark. The lights are almost out.'],['Panel','Every minute they survive, a meter on the side fills. It is labelled HARVEST.'],['You','He is feeding on their fear. Dr. Cocoa is not a scientist. He is a farmer.'],['Panel',M.fails?'You have failed '+M.fails+' time'+(M.fails>1?'s':'')+'. The meter is higher each time. Enter Terror Night again?':'Sending yourself into the feed could cut a cell open. Enter Terror Night?']],()=>talk([['','Hold on. Survive the night.']],()=>go('terror')))}},
{x:100,y:360,r:80,t:'Read the poster',a:()=>talk([['Poster','A faded poster. Six silhouettes behind a reinforced wall, a drone on the floor, one hatch in the ceiling. HOLD THE LINE. Reinforce. Breach. Win the round.'],['Scribble','drone first. always drone first.']])},
{x:880,y:360,r:80,t:'Use the terminal',a:()=>{tut=1}},
{x:740,y:490,r:75,t:'Check the computer',a:()=>{M.pc++;sv();talk(M.pc>1?[['You','Still paused. The crawler has not moved. Neither has the shotgun.']]:[['Computer','A first-person game is frozen mid-fight. A stone corridor, a red eyed crawler three steps away, a shotgun with four shells left.'],['Sticky note','DO NOT UNPAUSE. I mean it. It is the only level I never beat. -- C.'],['You','Dr. Cocoa plays horror games on his lunch break. Somehow that is worse.']],()=>{tut=2})}},
{x:480,y:515,r:60,t:'Leave the lab',a:()=>{if(post&&!brk.every(x=>x))return talk([['You','The door will not open while those cases are still sealed.']]);scene='island';P={x:1000,y:390,f:1}}}
]
const toIsland=()=>{scene='island';save({seen:1})}
const k=kit(box,(dt,k)=>{
time+=dt
shk=Math.max(0,shk-dt*40)
for(const q of sh){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=520*dt;q.l-=dt}
sh=sh.filter(q=>q.l>0)
for(const q of pr)if(q&&q.t<1){q.t=Math.min(1,q.t+dt*.7)}
if(cut>=0){cut+=dt;if(cut>2.0&&cut<2.1)shk=24;if(cut>2.5&&cut<2.6)shk=24;if(cut>3&&cut<3.1)shk=24;if(cut>4.2&&cut<4.3)shk=40;if(cut>7){const f=cut;cut=-1;go('death')}return}
sc=Math.min(k.W/VW,k.H/VH);ox=(k.W-VW*sc)/2;oy=(k.H-VH*sc)/2
if(scene==='intro'){st+=dt;if(st>=SEG[seg].d){seg++;st=0;if(seg>=SEG.length)toIsland()}return}
if(D){D.n=Math.min(D.lines[D.i][1].length,D.n+dt*50);return}
if(tut)return
let mx=0,my=0
const K=k.keys
if(K.arrowleft||K.a)mx--
if(K.arrowright||K.d)mx++
if(K.arrowup||K.w)my--
if(K.arrowdown||K.s)my++
if(k.down&&!(near&&(k.py-oy)/sc>VH-76)){const wx=(k.px-ox)/sc,wy=(k.py-oy)/sc,sx=scene==='island'?P.x-cam.x:P.x,sy=scene==='island'?P.y-cam.y:P.y,dx=wx-sx,dy=wy-sy,d=Math.hypot(dx,dy);if(d>16){mx=dx/d;my=dy/d}}
const l=Math.hypot(mx,my)
if(l){P.x+=mx/l*240*dt;P.y+=my/l*240*dt;walk+=dt}
if(mx)P.f=mx>0?1:-1
if(scene==='island'){const ex=(P.x-700)/540,ey=(P.y-450)/310,d=Math.hypot(ex,ey);if(d>1){P.x=700+ex/d*540;P.y=450+ey/d*310}
cam.x=cl(P.x-VW/2,0,1400-VW);cam.y=cl(P.y-VH/2,0,900-VH)
for(const e of IS)if(e.w!=null&&wisps[e.w]&&Math.hypot(P.x-e.x,P.y-e.y)<50)wisps[e.w]=0}
else{P.x=cl(P.x,110,850);P.y=cl(P.y,225,505)}
},(c,k)=>{
c.fillStyle='#000';c.fillRect(0,0,k.W,k.H)
c.save();c.translate(ox,oy);c.scale(sc,sc);c.beginPath();c.rect(0,0,VW,VH);c.clip()
if(scene==='intro'){const s=SEG[seg],p=st/s.d;s.f(c,p,time,A,X);c.drawImage(vigC,0,0)
const b=26;R(c,0,0,VW,b,'#000');R(c,0,VH-b,VW,b,'#000')
for(const l of s.l)if(p>=l[0]&&p<=l[1])cap(c,l[2],l[3],false)
c.font='700 15px Figtree,sans-serif';c.fillStyle='rgba(255,255,255,.6)';c.textAlign='right';c.fillText('Skip',VW-24,22);c.textAlign='left'}
else if(scene==='island')island_(c)
else{c.save();if(shk>0)c.translate((Math.random()-.5)*shk,(Math.random()-.5)*shk);lab_(c);c.restore()}
if(D){const l=D.lines[D.i];cap(c,l[0],l[1].slice(0,Math.floor(D.n)),D.n>=l[1].length)}
c.restore()
})
function prompt(c,list){
if(D||tut||cut>=0)return null
for(const e of list){if(e.w!=null||!e.t)continue;const tt=typeof e.t==='function'?e.t():e.t;if(!tt)continue;if(Math.hypot(P.x-e.x,P.y-e.y)<e.r){pill(c,VW/2,VH-62,tt+'   [E]',Math.max(280,tt.length*11+90));return e}}
return null
}
function island_(c){
const t=time
sky(c);clouds(c,t,1)
for(let i=0;i<4;i++){const x=((i*330-cam.x*.25+t*3*(i+1))%1500+1500)%1500-200,y=70+i*38+Math.sin(t*.5+i)*6,w=60+i%2*30;c.fillStyle='rgba(120,90,140,.35)';c.beginPath();c.ellipse(x,y+10,w,14,0,0,TAU);c.fill();c.fillStyle='rgba(140,220,170,.55)';c.beginPath();c.ellipse(x,y,w,9,0,0,TAU);c.fill();c.fillStyle='rgba(200,235,255,.4)';c.fillRect(x-4,y+12,5,50+Math.sin(t*3+i)*6)}
const bob=Math.sin(t*.8)*5
c.save();c.translate(-cam.x,-cam.y+bob)
c.drawImage(X.isl.c,0,0,X.isl.W,X.isl.H)
for(let i=0;i<34;i++){const gx=(i*173)%1100+150,gy=(i*97)%520+300,w=Math.sin(t*1.6+i)*3.5;c.strokeStyle=i%3?'#4fa34a':'#6cc060';c.lineWidth=2;c.beginPath();c.moveTo(gx,gy);c.quadraticCurveTo(gx+w*.5,gy-8,gx+w,gy-15);c.stroke()}
c.save();c.globalCompositeOperation='lighter';for(let i=0;i<12;i++){const sx=700+Math.cos(t*.3+i*2.3)*(60+i*40),sy=660+Math.sin(t*.4+i)*50;c.fillStyle='rgba(255,255,255,'+(.25+.25*Math.sin(t*4+i))+')';c.fillRect(sx,sy,3,2)}c.restore()
const E=[]
for(const[x,y]of[[300,300],[1180,420],[250,560],[1130,640],[560,240]])E.push([y,()=>{shadow(c,x,y+4,34);c.save();c.translate(x,y);c.rotate(Math.sin(t*1.1+x)*.018);draw(c,A.tree,0,0,1.1);c.restore()}])
E.push([445,()=>draw(c,A.bench,350,445,1)])
if(!S.dd)E.push([478,()=>{shadow(c,520,476,34);const br=1+Math.sin(t*2)*.012;dr(c,A.cocoa[0],520,478,1.1,false,1/br,br)}])
E.push([392,()=>{shadow(c,900,392,40);dr(c,A.sheep,900,392,1.1,false,1+Math.sin(t*2.2)*.02,1-Math.sin(t*2.2)*.02)}])
E.push([360,()=>draw(c,A.lab,1000,360,1)])
for(let i=0;i<3;i++)if(wisps[i]){const e=IS.find(z=>z.w===i);E.push([e.y,()=>{orb(c,e.x,e.y+Math.sin(t*3+i)*7-10,46,'rgba(190,230,255,.45)');draw(c,A.wisp,e.x,e.y+Math.sin(t*3+i)*7,1.3)}])}
const moving=!D&&(k.keys.a||k.keys.d||k.keys.w||k.keys.s||k.keys.arrowleft||k.keys.arrowright||k.keys.arrowup||k.keys.arrowdown||k.down)
E.push([P.y,()=>{shadow(c,P.x,P.y+2,26);const q=moving?Math.sin(walk*16):Math.sin(t*2)*.4;dr(c,fr(A.kid.cloud,moving,walk),P.x,P.y+(moving?-Math.abs(Math.sin(walk*8))*3:0),1.15,P.f<0,1-q*.025,1+q*.035)}])
E.sort((a,b)=>a[0]-b[0]);for(const e of E)e[1]()
for(let i=0;i<26;i++){const fx=700+Math.cos(t*.2+i*1.7)*(200+i*18),fy=450+Math.sin(t*.27+i*2.1)*(120+i*7);orb(c,fx,fy,16,'rgba(255,240,150,'+(.35+.35*Math.sin(t*2.4+i*3))+')')}
c.restore()
c.save();c.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const x=120+i*240+Math.sin(t*.3+i)*30;c.fillStyle=lg(c,x,0,x+120,VH,[[0,'rgba(255,240,200,.14)'],[1,'rgba(255,240,200,0)']]);c.beginPath();c.moveTo(x,0);c.lineTo(x+70,0);c.lineTo(x+210,VH);c.lineTo(x+90,VH);c.fill()}c.restore()
c.fillStyle=lg(c,0,0,0,VH,[[0,'rgba(255,170,220,.12)'],[.6,'rgba(0,0,0,0)'],[1,'rgba(60,20,120,.16)']]);c.fillRect(0,0,VW,VH)
c.drawImage(vigC,0,0)
pill(c,92,14,'Wisps '+(3-wisps.reduce((a,b)=>a+b,0))+'/3',150)
near=prompt(c,IS)
}
function lab_(c){
const t=time
c.drawImage(X.lab.c,0,0,VW,VH)
const al=.06+.05*Math.sin(t*3);c.fillStyle='rgba(255,40,50,'+al+')';c.fillRect(0,0,VW,VH)
const ps=[[185,0],[315,1],[675,2]]
for(const[x,i]of ps){if(brk[i])continue;c.save();c.beginPath();c.rect(x-60,112,118,92);c.clip();c.globalAlpha=.85;draw(c,A.pris[i],x,198+Math.sin(t*1.3+i)*1.5,1.25);c.fillStyle='rgba(30,120,180,.25)';c.fillRect(x-60,112,118,92);c.restore()}
c.fillStyle='rgba(180,240,255,.1)';for(const x of[120,250,610,740]){c.beginPath();c.moveTo(x+60,108);c.lineTo(x+100,108);c.lineTo(x+60,204);c.lineTo(x+30,204);c.fill()}
c.save();c.beginPath();c.rect(378,98,204,108);c.clip();c.fillStyle='#14040a';c.fillRect(378,98,204,108)
for(let i=0;i<4;i++){const bx=384+i*50,by=104;c.fillStyle='#1c0610';c.fillRect(bx,by,46,50);for(let j=0;j<2;j++){const ex=bx+23+Math.sin(t*2+i+j*3)*14,ey=by+26+Math.cos(t*1.7+i*2+j)*8;orb(c,ex-4,ey,8,'rgba(255,50,60,.8)');orb(c,ex+4,ey,8,'rgba(255,50,60,.8)')}}
c.fillStyle='rgba(255,60,70,.9)';c.fillRect(384,164,192,6);c.fillStyle='rgba(30,0,6,1)';c.fillRect(384,164+0,192,6);c.fillStyle='#e03040';c.fillRect(384,164,192*(.25+.7*((t*.05)%1)),6);c.font='800 11px Figtree,sans-serif';c.fillStyle='#ffb3bb';c.fillText('HARVEST',386,186)
for(let y=98;y<206;y+=3){c.fillStyle='rgba(0,0,0,.18)';c.fillRect(378,y,204,1)}
c.restore()
c.save();c.beginPath();c.rect(860,304,48,52);c.clip();c.fillStyle='#86efac';c.font='700 8px monospace';for(let i=0;i<6;i++){c.globalAlpha=.4+.6*((t*2+i)%2<1.2);c.fillText(['> TERROR.NIGHT','> BUILDINGS','> ABILITIES','> [E] READ','> _','> ...'][i],863,316+i*8)}c.restore()
orb(c,880,330,60,'rgba(120,255,160,.18)')
if(!dmc){dmc=document.createElement('canvas');dmc.width=196;dmc.height=128;doomFrame(dmc.getContext('2d'),196,128)}
dr(c,B.desk,740,500,1.4)
{const D=B.desk,r=D.scr,sx=740-D.ax*1.4+r.x*1.4,sy=500-D.ay*1.4+r.y*1.4,sw=r.w*1.4,sh=r.h*1.4,q=Math.max(sw/196,sh/128);c.save();c.beginPath();c.rect(sx,sy,sw,sh);c.clip();c.fillStyle='#000';c.fillRect(sx,sy,sw,sh);c.drawImage(dmc,sx+(sw-196*q)/2,sy+(sh-128*q)/2,196*q,128*q);c.restore()}
orb(c,740,420,70,'rgba(255,60,40,'+(.12+.04*Math.sin(t*2))+')')
for(let i=0;i<4;i++)if(brk[i]){const x=[185,315,675,805][i];c.save();c.beginPath();c.rect(x-60,112,118,92);c.clip();c.fillStyle='rgba(6,10,16,.78)';c.fillRect(x-60,112,118,92);c.strokeStyle='rgba(190,235,255,.8)';c.lineWidth=1.5;for(let j=0;j<9;j++){const a=j*.7+i;c.beginPath();c.moveTo(x,158);c.lineTo(x+Math.cos(a)*80,158+Math.sin(a)*60);c.stroke()}c.restore()
c.fillStyle='rgba(190,235,255,.55)';for(let j=0;j<7;j++){c.beginPath();c.moveTo(x-40+j*13,206);c.lineTo(x-34+j*13,212);c.lineTo(x-30+j*13,205);c.fill()}}
for(const q of sh){c.globalAlpha=Math.max(0,q.l);c.fillStyle='#bfeaff';c.fillRect(q.x,q.y,q.r,q.r);c.globalAlpha=1}
const out=[];pr.forEach((q,i)=>{if(!q)return;const e=1-Math.pow(1-q.t,2);const x=q.x+(q.tx-q.x)*e,y=q.y+(q.ty-q.y)*e;out.push([x,y,i])})
const shot=cut-2.0
for(const[x,y,i]of out){const f=cut>=0&&shot>i*.5?Math.min(1,(shot-i*.5)*2.5):0;shadow(c,x,y+2,26);c.save();c.translate(x,y);c.rotate(f*1.5);c.globalAlpha=1-Math.max(0,f-.8)*3;if(f>0)c.translate(0,f*6);draw(c,A.pris[i],0,0,1.25);c.restore()}
if(cut>=0){
const mono=cut>3.3
if(cut<4.6){const cx=480,cy=470-Math.min(1,cut/1.2)*30;shadow(c,cx,cy+2,36);if(!mono){dr(c,A.cocoa[0],cx,cy,1.3+Math.min(0,0),false,1,1);if(cut>1.2&&cut<3.1){const a=Math.atan2(out[0]?out[0][1]-cy:0,(out[Math.floor((cut-1.2)/.6)%out.length]||[480])[0]-cx);c.strokeStyle='#2a2a30';c.lineWidth=7;c.beginPath();c.moveTo(cx+14,cy-50);c.lineTo(cx+14+Math.cos(a)*34,cy-50+Math.sin(a)*20);c.stroke()}}
else{const g=cl((cut-3.3)/1.3,0,1);dr(c,B.boss.idle,cx,cy,.35+g*1.0,false,1+Math.sin(cut*40)*.02,1);orb(c,cx,cy-90*g,200*g+10,'rgba(255,140,60,'+(.3+.4*g)+')')}}
else{const g=cl((cut-4.6)/2.4,0,1);dr(c,[B.boss.idle,B.boss.walk][Math.floor(t*2)%2],480,470,1.1,false,1,1)}
for(let i=0;i<3;i++){const w=cl((cut-2.0-i*.5)*4,0,1)*(1-cl((cut-2.4-i*.5)*3,0,1));if(w>0){c.fillStyle='rgba(255,240,180,'+w*.8+')';c.fillRect(0,0,VW,VH)}}
if(cut>3.3&&cut<4.7){c.fillStyle='rgba(255,255,255,'+(.25+.35*Math.sin(cut*30)**2)+')';c.fillRect(0,0,VW,VH)}
if(cut>4.7){const g=cl((cut-4.7)/2.2,0,1);c.fillStyle='rgba(20,0,10,'+g+')';const r=Math.max(1,(1-g)*900);c.save();c.fillStyle='rgba(20,0,10,1)';c.beginPath();c.rect(0,0,VW,VH);c.arc(480,300,r,0,TAU,true);c.fill('evenodd');c.restore();c.font='900 '+(30+g*50)+'px '+F;c.textAlign='center';c.fillStyle='rgba(255,70,50,'+g+')';c.fillText('DEEP DEATH',480,280);c.textAlign='left'}
if(cut>2.0&&cut<4.7){c.font='italic 700 24px '+F;c.textAlign='center';c.fillStyle='#ffe9c8';c.fillText(cut<3.2?'Bang.':cut<4.3?'Sweet dreams, little harvests.':'Now. The real harvest.',480,90);c.textAlign='left'}}
const moving=!D&&(k.keys.a||k.keys.d||k.keys.w||k.keys.s||k.down)
if(cut<0){shadow(c,P.x,P.y+2,28);const q=moving?Math.sin(walk*16):0;dr(c,fr(A.kid.cloud,moving,walk),P.x,P.y,1.3,P.f<0,1-q*.025,1+q*.035)}
c.drawImage(vigC,0,0)
near=prompt(c,LI)
if(tut===2){c.fillStyle='rgba(0,0,0,.88)';c.fillRect(0,0,VW,VH);const w=720,h=w*128/196;c.drawImage(dmc,(VW-w)/2,(VH-h)/2-20,w,h);c.strokeStyle='#bfb59a';c.lineWidth=10;c.strokeRect((VW-w)/2-5,(VH-h)/2-25,w+10,h+10);c.font='600 15px Figtree,sans-serif';c.fillStyle='#8f8d84';c.textAlign='center';c.fillText('Tap or press E to close',VW/2,VH-40);c.textAlign='left'}
if(tut===1){
c.fillStyle='rgba(3,6,12,.94)';c.beginPath();c.roundRect(70,50,VW-140,VH-100,20);c.fill();c.strokeStyle='rgba(134,239,172,.5)';c.lineWidth=2;c.stroke()
c.font='800 26px '+F;c.fillStyle='#86efac';c.fillText('Terror Night: what everything does',100,98)
BU.forEach((b,i)=>{c.font='800 18px Figtree,sans-serif';c.fillStyle='#f6f5ef';c.fillText(b[1],100,138+i*28);c.font='600 16px Figtree,sans-serif';c.fillStyle='#a1a1aa';c.fillText(b[2],270,138+i*28)})
c.font='800 22px '+F;c.fillStyle='#86efac';c.fillText('Abilities',100,334)
AB.forEach((b,i)=>{c.font='800 16px Figtree,sans-serif';c.fillStyle=b[5];c.fillText(b[1]+'  ['+b[2]+']',100,362+i*24);c.font='600 15px Figtree,sans-serif';c.fillStyle='#a1a1aa';c.fillText(b[3],290,362+i*24)})
c.font='600 15px Figtree,sans-serif';c.fillStyle='#8f8d84';c.textAlign='center';c.fillText('Tap or press E to close',VW/2,VH-68);c.textAlign='left'}
}
const act=()=>{
if(scene==='intro'){seg++;st=0;if(seg>=SEG.length)toIsland();return}
if(adv())return
if(tut){tut=0;return}
if(near&&near.a)near.a()
}
k.press=c=>{if(c==='e'||c==='enter'||c===' ')act();if(c==='escape'&&scene==='intro')toIsland()}
k.tap=(x,y)=>{const wx=(x-ox)/sc,wy=(y-oy)/sc;if(scene==='intro'){if(wx>VW-120&&wy<40)toIsland();else act();return}if(D||tut||(near&&wy>VH-76))act()}
if(o.betray){brk=[1,1,1,1];pr=[185,315,675].map((x,i)=>({x,y:205,t:1,tx:x+(i-1)*30,ty:340+i*14}));P={x:480,y:430,f:1};cut=0}
else if(o.after){scene='island';P={x:560,y:500,f:1};talk([['','The island is quiet. Colour comes back to the edges of things, one pixel at a time.'],['You','They are awake. All of them. I felt it.'],['Cloud Sheep','Baaa. (It nudges a pair of cracked goggles toward you, then lies down beside them.)'],['','Chapter 2 complete: Deep Death. The dream is yours now. Sleep well.']])}
else if(o.res!=null){scene='lab';P={x:480,y:430,f:1};if(!o.res){M.fails++;sv()}talk(o.res?[['',"The cells hum, then go quiet. Locks release, but every glass case stays sealed."],['Dr. Cocoa','(from the doorway, very calm) Well done. You may go home now. Please use the door.'],['You','Not until the cases are open. All of them.']]:[['',"The feed cuts out. The cells stay shut. Dr. Cocoa's voice drifts down the hall."],['Dr. Cocoa','Come back when you are less afraid.']])}
return()=>k.stop()
}
export function play(box,opt){
const rp=opt&&opt.replay
let stopCur=null,dead=false
const S=[1,1.25,1.5,2,2.5][(window.__perf||{gpu:2}).gpu]
let A,X
import('/js/rushterror.js').then(m=>{BU=m.BUILD;AB=m.ABIL}).catch(()=>{})
const boot=o=>{stopCur=run(box,go,o||{},A,X)}
const go=what=>{
stopCur&&stopCur();stopCur=null
if(what==='death'){stopCur=death(box,A,X.B,()=>{if(!rp)save({dd:1});setTimeout(()=>{if(dead)return;stopCur&&stopCur();stopCur=null;boot({scene:'island',after:1})},700)});return}
if(what==='terror')import('/js/rush.js').then(m=>{
if(dead)return
let fin=false
stopCur=m.playRush(box,r=>{
if(fin)return
fin=true
setTimeout(()=>{if(dead)return;stopCur&&stopCur();stopCur=null;if(r.ok)save({freed:1});boot({scene:'lab',res:!!r.ok})},900)
},'terror')
})
}
ready().then(()=>{if(dead)return;A=art(S);X={isl:island(Math.min(S,1.25)),lab:lab(Math.min(S,1.5)),liv:room(Math.min(S,1.5),'living'),B:art2(S)};if(rp==='intro')boot({scene:'intro'});else if(rp==='betrayal')boot({scene:'lab',betray:1});else if(rp==='death')go('death');else boot()})
return()=>{dead=true;stopCur&&stopCur()}
}
