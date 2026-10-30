import{h}from'./util.js'
const TAU=Math.PI*2
const NS='http://www.w3.org/2000/svg'
const LIM=[[-1,-.55,-.9],[1,-.55,-.9],[-1,.1,.2],[1,.1,.2],[-1,.95,1.5],[1,.95,1.5]]
export function limbs(ctx,x,y,t,n,gr,s){
ctx.save();ctx.translate(x,y);ctx.scale(s||1,s||1)
ctx.lineCap='round';ctx.lineJoin='round'
for(let i=0;i<Math.min(6,Math.ceil(n));i++){
const[sd,vy,ang]=LIM[i],k=i<n-1?1:(gr==null?1:gr)
if(k<=0)continue
const ax=sd*44,ay=-14+vy*34,sw=Math.sin(t*3+i*1.7)*.35,a1=sd*(.9+sw)+(vy>.5?sd*.1:0),l1=44*k,l2=40*k
const mx=ax+Math.sin(a1)*l1*(vy>.5?.5:1)*sd*sd,my=ay+(vy>.5?Math.abs(Math.cos(a1))*l1:vy*18+Math.cos(a1)*l1*.4)
const ex=mx+sd*Math.cos(t*4+i)*l2*.7,ey=my+(vy>.5?l2*.8:Math.sin(t*4+i)*l2*.5+ang*14)
ctx.strokeStyle='#07040c';ctx.lineWidth=13*k
ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(mx,my);ctx.lineTo(ex,ey);ctx.stroke()
ctx.strokeStyle=i%2?'#2e3350':'#3a4166';ctx.lineWidth=8*k
ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(mx,my);ctx.lineTo(ex,ey);ctx.stroke()
ctx.fillStyle='#58ffd0';ctx.beginPath();ctx.arc(mx,my,3.4*k,0,TAU);ctx.fill()
ctx.fillStyle='#07040c';ctx.beginPath();ctx.arc(ex,ey,7*k,0,TAU);ctx.fill()
ctx.strokeStyle='#ff5a9a';ctx.lineWidth=2
for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+sd*10+j*6,ey+10+Math.abs(j)*-2);ctx.stroke()}
}
ctx.restore()
}
export function tvBody(ctx,x,y,s,t,o){
o=o||{}
const bn=o.bn?Math.abs(Math.sin(t*5))*34*s:0
ctx.save()
ctx.translate(x,y-bn)
ctx.scale(s,s)
if(o.gl&&Math.random()<.6)ctx.translate((Math.random()-.5)*26,0)
if(o.lv>0)limbs(ctx,0,0,t,o.lv,o.gr,1)
const w=!!o.wh
if(o.case){
ctx.save();ctx.translate(-130,52)
ctx.fillStyle='#07040c';ctx.fillRect(-4,-4,88,52)
ctx.fillStyle='#7a5a38';ctx.fillRect(0,0,80,46)
ctx.fillStyle='#5a3f26';ctx.fillRect(0,18,80,4)
ctx.fillStyle='#c9a86a';ctx.fillRect(34,14,12,12)
ctx.fillStyle='rgba(220,210,190,.35)';for(let i=0;i<14;i++)ctx.fillRect((i*37)%78,(i*23)%44,2,2)
if(o.case===2){ctx.fillStyle='#07040c';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-18,-34);ctx.lineTo(60,-40);ctx.lineTo(80,0);ctx.fill();ctx.fillStyle='#5a3f26';ctx.beginPath();ctx.moveTo(2,-2);ctx.lineTo(-14,-30);ctx.lineTo(56,-35);ctx.lineTo(76,-2);ctx.fill();ctx.fillStyle='#1a0e24';ctx.fillRect(4,2,72,14)}
if(o.pot===1){ctx.fillStyle='#58ffd0';ctx.shadowColor='#58ffd0';ctx.shadowBlur=18;ctx.fillRect(30,-12,16,24);ctx.shadowBlur=0}
ctx.restore()
}
if(o.back){
ctx.fillStyle='#07040c';ctx.beginPath();ctx.roundRect(-52,-52,104,86,12);ctx.fill()
ctx.fillStyle='#161826';ctx.beginPath();ctx.roundRect(-48,-48,96,78,10);ctx.fill()
ctx.fillStyle='#07040c';for(let i=0;i<7;i++)ctx.fillRect(-36,-38+i*9,72,3)
ctx.strokeStyle='#58ffd0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,32);ctx.bezierCurveTo(20,60,-30,70,-10,96);ctx.stroke()
ctx.restore();return
}
ctx.strokeStyle=w?'#fff':'#9aa4c0';ctx.lineWidth=3
ctx.beginPath();ctx.moveTo(-12,-48);ctx.lineTo(-26,-76);ctx.moveTo(12,-48);ctx.lineTo(28,-72);ctx.stroke()
ctx.fillStyle=w?'#fff':'#07040c';ctx.fillRect(-34,-3,68,10);ctx.fillRect(-26,28,14,14);ctx.fillRect(12,28,14,14)
ctx.fillStyle=w?'#fff':'#1b1e2c';ctx.beginPath();ctx.roundRect(-50,-50,100,82,10);ctx.fill()
if(!w){
ctx.fillStyle='#2e3350';ctx.beginPath();ctx.roundRect(-46,-46,92,74,8);ctx.fill()
ctx.fillStyle='#03060a';ctx.beginPath();ctx.roundRect(-40,-40,80,56,6);ctx.fill()
const m=o.m2||0,sg=ctx.createLinearGradient(0,-40,0,16)
sg.addColorStop(0,m?'#ff3a8a':'#1affd0');sg.addColorStop(1,m>1?'#ff1a1a':m?'#6a1aff':'#0a6a8a')
ctx.fillStyle=sg;ctx.globalAlpha=.9;ctx.beginPath();ctx.roundRect(-38,-38,76,52,5);ctx.fill();ctx.globalAlpha=1
const e=o.eyes||0,ex=e===0?15:e===1?7:0,er=e===2?19:10
ctx.fillStyle=o.sip?'#ff3a4a':'#04141c'
if(e<2){ctx.fillRect(-ex-er/2-2,-22,er,9);ctx.fillRect(ex-er/2+2,-22,er,9)}
else{ctx.beginPath();ctx.ellipse(0,-17,24,13,0,0,TAU);ctx.fillStyle='#ff2a2a';ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(Math.sin(t*3)*6,-17,5,0,TAU);ctx.fill()}
ctx.fillStyle='#04141c'
const op=o.sip||o.m2?8:0
if(op){ctx.beginPath();ctx.ellipse(0,0,16,4+op*Math.abs(Math.sin(t*6)),0,0,TAU);ctx.fill()}
else for(let i=-5;i<=5;i++){const hh=2+Math.abs(Math.sin(t*9+i*1.3))*6;ctx.fillRect(i*5-1,-3-hh/2+5,3,hh)}
ctx.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<26;i++)ctx.fillRect(-38+Math.random()*76,-38+Math.random()*52,2,1.5)
ctx.fillStyle='rgba(0,0,0,.18)';for(let yy=-38;yy<14;yy+=3)ctx.fillRect(-38,yy,76,1)
}
if(o.pot===2){
const sp=o.sip?Math.sin(t*8)*3:0
ctx.save();ctx.translate(42,-30+sp);ctx.rotate(o.sip?-1.1:-.3)
ctx.fillStyle='#07040c';ctx.fillRect(-9,-4,18,34)
ctx.fillStyle='#58ffd0';ctx.shadowColor='#58ffd0';ctx.shadowBlur=14;ctx.fillRect(-7,6,14,22);ctx.shadowBlur=0
ctx.fillStyle='#c9a86a';ctx.fillRect(-5,-12,10,9)
ctx.fillStyle='#07040c';ctx.font='700 7px monospace';ctx.textAlign='center';ctx.fillText('DEBUG',0,20)
ctx.restore()
}
ctx.restore()
}
export function mkStage(box){
const c=h('canvas',{class:'cs-stage'})
box.append(c)
const g=c.getContext('2d')
let S={lv:0,gr:1},raf=0,t0=performance.now(),on=1
const fit=()=>{const r=box.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);return d}
let d=fit()
const loop=now=>{
if(!on)return
raf=requestAnimationFrame(loop)
if(Math.abs(c.width-box.clientWidth*d)>4)d=fit()
const W=c.width,H=c.height,t=(now-t0)/1000,s=Math.min(W,H)/150
g.setTransform(1,0,0,1,0,0)
g.fillStyle=S.bg==='white'?'#fff':S.bg==='black'?'#000':'#07040c'
g.fillRect(0,0,W,H)
if(S.bg!=='white'){const gr=g.createRadialGradient(W/2,H*.55,0,W/2,H*.55,H*.7);gr.addColorStop(0,S.bg==='black'?'#000':'rgba(40,20,70,.7)');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,W,H)
g.strokeStyle='rgba(88,255,208,.07)';g.lineWidth=1;for(let x=0;x<W;x+=44*d){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke()}for(let y=0;y<H;y+=44*d){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}}
const sc=s*(S.m2===2?1.35:S.lv>=6?1.2:1)
tvBody(g,W/2,H*.52,sc,t,S)
if(S.gl){for(let i=0;i<6;i++){const y=Math.random()*H,sh=4+Math.random()*30;g.drawImage(c,0,y,W,sh,(Math.random()-.5)*60*d,y,W,sh)}}
if(S.wh&&S.bg==='black'){g.globalCompositeOperation='source-atop';g.fillStyle='#fff';g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over'}
}
raf=requestAnimationFrame(loop)
return{
el:c,
set:o=>{Object.assign(S,o)},
end:()=>{on=0;cancelAnimationFrame(raf);c.remove()}
}
}
export const FC={on:0,g:0,x:0,y:0,el:null,mx:0,my:0,box:null,mv:null}
export function curOn(box){
if(FC.on)return
FC.on=1;FC.box=box
const el=h('div',{class:'tcur'})
document.body.append(el)
FC.el=el
FC.mv=e=>{FC.mx=e.clientX;FC.my=e.clientY;if(!FC.g){FC.x=e.clientX;FC.y=e.clientY}}
addEventListener('pointermove',FC.mv)
box.classList.add('tcur-h')
}
export function curGrab(){FC.g=1}
export function curOff(){
if(!FC.on)return
FC.on=0;FC.g=0
removeEventListener('pointermove',FC.mv)
if(FC.el)FC.el.remove()
FC.el=null
if(FC.box)FC.box.classList.remove('tcur-h')
}
export function curFrame(dt,hx,hy,t){
if(!FC.on||!FC.el)return
if(FC.g){const k=Math.min(1,dt*9);FC.x+=(hx-FC.x)*k+(Math.random()-.5)*5;FC.y+=(hy-FC.y)*k+(Math.random()-.5)*5}
FC.el.style.transform='translate('+Math.round(FC.x)+'px,'+Math.round(FC.y)+'px) rotate('+(FC.g?Math.sin(t*20)*.25:0)+'rad)'
}
export function cursorGlyph(ctx,s,c,glow){
ctx.save();ctx.scale(s,s)
if(glow){ctx.shadowColor=c;ctx.shadowBlur=glow}
ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,17);ctx.lineTo(4.5,13);ctx.lineTo(8,21);ctx.lineTo(11,19.6);ctx.lineTo(7.6,12);ctx.lineTo(13,12);ctx.closePath()
ctx.fillStyle=c;ctx.fill();ctx.strokeStyle='#07040c';ctx.lineWidth=1.6;ctx.stroke()
ctx.restore()
}
let UI=null
const uiEls=box=>{
const app=document.getElementById('app')
if(!app)return[]
return[...app.querySelectorAll('*')].filter(e=>e!==box&&!e.contains(box)&&!box.contains(e)&&e.parentElement&&e.parentElement.contains(box))
}
const uiSave=box=>{
if(UI)return
const els=uiEls(box)
UI={els,old:els.map(e=>[e.style.transform,e.style.opacity,e.style.filter,e.style.transition,e.style.visibility,e.style.pointerEvents]),iv:0}
}
const rr=(a,b)=>a+Math.random()*(b-a)
export function uiFx(mode,box,tone){
if(mode==='restore'){
if(!UI)return
clearInterval(UI.iv)
const b=UI
UI=null
document.documentElement.classList.remove('tes-bug')
b.els.forEach((e,i)=>{e.classList.remove('tes-fl');e.style.visibility=b.old[i][4];e.style.transition='transform .9s cubic-bezier(.2,.8,.2,1) '+(i*30)+'ms,opacity .8s ease,filter .8s ease';e.style.transform=b.old[i][0];e.style.opacity=b.old[i][1];e.style.filter=b.old[i][2];e.style.pointerEvents=b.old[i][5]})
setTimeout(()=>b.els.forEach((e,i)=>{e.style.transition=b.old[i][3]}),1800)
return
}
uiSave(box)
if(!UI)return
const vw=innerWidth,vh=innerHeight,bb=box.getBoundingClientRect(),bx=bb.left+bb.width/2,by=bb.top+bb.height/2
clearInterval(UI.iv)
UI.els.forEach(e=>{e.style.pointerEvents='none'})
if(mode==='throw'){
UI.els.forEach((e,i)=>{
const r=e.getBoundingClientRect(),dx=r.left+r.width/2-bx,dy=r.top+r.height/2-by,d=Math.hypot(dx,dy)||1
e.style.transition='transform 1.1s cubic-bezier(.5,0,.9,.4) '+(i*40)+'ms,opacity .9s ease '+(i*40+300)+'ms'
e.style.transform='translate('+(dx/d*vw*1.4)+'px,'+(dy/d*vh*1.4-120)+'px) rotate('+((i%2?1:-1)*rr(120,520))+'deg) scale(.7)'
e.style.opacity='0'
})
tone&&tone(90,1.2,.08,'sawtooth',.4)
}else if(mode==='lift'){
const n=UI.els.length
UI.els.forEach((e,i)=>{
const r=e.getBoundingClientRect(),a=i/n*TAU,R=Math.min(vw,vh)*(.34+(i%3)*.07),tx=bx+Math.cos(a)*R*1.25,ty=by+Math.sin(a)*R*.8
e.style.visibility='visible'
e.style.transition='transform 1.8s cubic-bezier(.2,.8,.2,1) '+(i*35)+'ms,opacity 1s ease '+(i*35)+'ms,filter 1s ease'
e.style.transform='translate('+(tx-(r.left+r.width/2))+'px,'+(ty-(r.top+r.height/2))+'px) rotate('+rr(-14,14)+'deg) scale(.55)'
e.style.opacity='.95'
e.style.filter='drop-shadow(0 0 12px #58ffd0)'
e.classList.add('tes-fl')
})
tone&&tone(330,1.6,.05,'sine',2.4)
}else if(mode==='jumble'){
document.documentElement.classList.add('tes-bug')
const j=()=>{
UI.els.forEach(e=>{
e.classList.remove('tes-fl')
e.style.transition='transform .12s steps(2),filter .12s'
e.style.transform='translate('+rr(-vw*.45,vw*.45)+'px,'+rr(-vh*.45,vh*.45)+'px) rotate('+rr(-180,180)+'deg) scale('+rr(.3,1.2)+','+rr(.3,1.2)+')'
e.style.filter='hue-rotate('+Math.floor(rr(0,360))+'deg) drop-shadow(0 0 8px #ff3aff)'
})
tone&&tone(rr(200,2400),.07,.05,'square')
}
UI.iv=setInterval(j,130)
}else if(mode==='hide'){
clearInterval(UI.iv)
document.documentElement.classList.remove('tes-bug')
UI.els.forEach(e=>{e.style.transition='opacity .4s ease';e.style.opacity='0'})
}
}
export function shatter(box,cv){
const r=cv.getBoundingClientRect(),br=box.getBoundingClientRect(),n=16,out=[]
const w=cv.width,hh=cv.height
const cx=.5+Math.random()*.1,cy=.45
const pts=[]
for(let i=0;i<n;i++)pts.push([cx+Math.cos(i/n*TAU)*(.8+Math.random()*.1)*1.2,cy+Math.sin(i/n*TAU)*(.8+Math.random()*.1)*1.2])
const crk=document.createElementNS(NS,'svg')
crk.setAttribute('class','tes-crk');crk.setAttribute('viewBox','0 0 100 100');crk.setAttribute('preserveAspectRatio','none')
for(let i=0;i<n;i++){
const p=document.createElementNS(NS,'polyline'),a=i/n*TAU+rr(-.1,.1);let s='50,45 ';let x=50,y=45
for(let k=1;k<5;k++){x+=Math.cos(a+rr(-.25,.25))*rr(10,16);y+=Math.sin(a+rr(-.25,.25))*rr(10,16);s+=x+','+y+' '}
p.setAttribute('points',s);crk.append(p)
}
box.append(crk)
setTimeout(()=>{
crk.remove()
for(let i=0;i<n;i++){
const a=pts[i],b=pts[(i+1)%n],c=document.createElement('canvas')
c.width=w;c.height=hh;c.className='tes-sh'
const g=c.getContext('2d')
g.save();g.beginPath();g.moveTo(cx*w,cy*hh);g.lineTo(a[0]*w,a[1]*hh);g.lineTo(b[0]*w,b[1]*hh);g.closePath();g.clip();g.drawImage(cv,0,0);g.restore()
c.style.left=(r.left-br.left)+'px';c.style.top=(r.top-br.top)+'px';c.style.width=r.width+'px';c.style.height=r.height+'px'
box.append(c);out.push(c)
}
cv.classList.add('tes-void')
requestAnimationFrame(()=>out.forEach((c,i)=>{
c.style.transition='transform '+(1.2+Math.random()*.8)+'s cubic-bezier(.5,0,.9,.5) '+(i*30)+'ms,opacity 1.6s ease '+(i*30)+'ms'
c.style.transform='translate('+rr(-160,160)+'px,'+rr(520,900)+'px) rotate('+rr(-90,90)+'deg)'
c.style.opacity='0'
}))
setTimeout(()=>{out.forEach(c=>c.remove());cv.classList.remove('tes-void')},2600)
},700)
}
export function arenaWorld(ctx,W,H,D,Z,cx,cy,t,a,k,lite,fall){
const sx=(a.x-cx)*Z,sy=(a.y-cy)*Z,R=a.r*Z
ctx.save()
ctx.setTransform(D,0,0,D,0,0)
ctx.beginPath();ctx.rect(0,0,W,H);ctx.arc(sx,sy,R,0,TAU)
ctx.fillStyle='rgba(2,0,10,'+(.96*k)+')'
ctx.fill('evenodd')
ctx.save()
ctx.beginPath();ctx.arc(sx,sy,R,0,TAU);ctx.clip()
ctx.fillStyle='rgba(12,4,30,'+(.78*k)+')';ctx.fillRect(0,0,W,H)
const st=84*Z
ctx.globalCompositeOperation='lighter'
for(let gx=-8;gx<=8;gx++)for(let gy=-8;gy<=8;gy++){
const x=sx+gx*st,y=sy+gy*st
if(Math.hypot(x-sx,y-sy)>R+st)continue
const f=.5+.5*Math.sin(t*2+gx*.9+gy*1.3)
ctx.strokeStyle='rgba('+((gx+gy)&1?'0,255,220':'255,60,200')+','+((.1+.16*f)*k)+')'
ctx.lineWidth=1.4
ctx.strokeRect(x+4,y+4,st-8,st-8)
if(!lite&&(gx*7+gy*3+8)%5===0){ctx.fillStyle='rgba(120,160,255,'+(.08*k)+')';ctx.fillRect(x+4,y+4,st-8,10*Z)
ctx.fillStyle='rgba(255,255,255,'+(.25*k)+')';ctx.fillRect(x+9,y+7,3*Z,3*Z);ctx.fillRect(x+16*Z,y+7,3*Z,3*Z)}
}
ctx.globalCompositeOperation='source-over'
ctx.restore()
ctx.save();ctx.globalCompositeOperation='lighter'
for(let i=0;i<3;i++){ctx.strokeStyle=['rgba(0,255,220,','rgba(255,60,200,','rgba(160,120,255,'][i]+(.8*k)+')';ctx.lineWidth=(5-i)*Z*.6+Math.sin(t*3+i)*1.5;ctx.beginPath();ctx.arc(sx,sy,R+i*6*Z,0,TAU);ctx.stroke()}
ctx.restore()
const n=lite?9:22
for(let i=0;i<n;i++){
const an=t*.12*(i%2?1:-1)+i*TAU/n,rr2=R*(1.12+(i%5)*.09)+Math.sin(t+i)*14,x=sx+Math.cos(an)*rr2,y=sy+Math.sin(an)*rr2*.92,w=(34+(i%4)*14)*Z,hh=w*.62
ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.6+i)*.5+i)
ctx.fillStyle='rgba(30,22,60,'+(.9*k)+')';ctx.fillRect(-w/2,-hh/2,w,hh)
ctx.fillStyle='rgba(88,255,208,'+(.7*k)+')';ctx.fillRect(-w/2,-hh/2,w,hh*.2)
ctx.strokeStyle='rgba(255,80,200,'+(.8*k)+')';ctx.lineWidth=1.4;ctx.strokeRect(-w/2,-hh/2,w,hh)
ctx.restore()
}
ctx.restore()
}
export function pondDraw(ctx,D,Z,cx,cy,t,ox,orbs,k){
const x0=(ox+120-cx)*Z,y0=(240-cy)*Z,w=760*Z,hh=520*Z
ctx.save();ctx.setTransform(D,0,0,D,0,0)
ctx.beginPath();ctx.rect(x0,y0,w,hh);ctx.clip()
const g=ctx.createLinearGradient(0,y0,0,y0+hh);g.addColorStop(0,'rgba(20,90,150,.55)');g.addColorStop(1,'rgba(6,30,80,.7)')
ctx.fillStyle=g;ctx.fillRect(x0,y0,w,hh)
ctx.strokeStyle='rgba(160,230,255,.35)';ctx.lineWidth=1.6
for(let r=0;r<14;r++){ctx.beginPath();for(let i=0;i<=40;i++){const x=x0+i/40*w,y=y0+(r+.5)/14*hh+Math.sin(t*1.6+i*.5+r)*5*Z;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
ctx.globalCompositeOperation='lighter'
for(const o of orbs){
const x=(o[0]-cx)*Z,y=(o[1]-cy)*Z+Math.sin(t*2+o[0])*4*Z,p=1+Math.sin(t*5+o[1])*.15
const rg=ctx.createRadialGradient(x,y,0,x,y,26*Z*p);rg.addColorStop(0,'rgba(255,255,255,1)');rg.addColorStop(.35,'rgba(120,230,255,.9)');rg.addColorStop(1,'rgba(60,120,255,0)')
ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,26*Z*p,0,TAU);ctx.fill()
}
ctx.restore()
}
export function sinkDraw(ctx,s,t,cx,cy){
const x=s[0],y=s[1],r=s[2],a=s[3]
ctx.save();ctx.translate(x,y)
if(a<0){
const k=1-(-a/1.3)
ctx.strokeStyle='rgba(190,90,255,'+(.4+.4*Math.sin(t*20))+')';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(0,0,r*k,0,TAU);ctx.stroke();ctx.setLineDash([])
}else{
const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.6,'rgba(30,0,60,.95)');g.addColorStop(1,'rgba(150,60,255,.25)')
ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill()
ctx.strokeStyle='rgba(200,120,255,.8)';ctx.lineWidth=3
for(let i=0;i<3;i++){ctx.beginPath();for(let j=0;j<=30;j++){const q=j/30,an=q*TAU*1.4+t*(2+i)+i*2.1,rr2=r*(1-q*.9);j?ctx.lineTo(Math.cos(an)*rr2,Math.sin(an)*rr2):ctx.moveTo(Math.cos(an)*rr2,Math.sin(an)*rr2)}ctx.stroke()}
}
ctx.restore()
}
export function pick10(box,list,onDone){
const sel=[]
let fin=0
const cnt=h('div',{class:'p10-c'},'0 / 10')
const grid=h('div',{class:'p10-g'})
const root=h('div',{class:'p10'},h('h3',null,'Pick 10 powers'),h('p',null,'Anything in the game. Choose fast.'),cnt,grid)
const done=()=>{if(fin)return;fin=1;clearInterval(iv);root.remove();onDone(sel)}
for(const[id,n,d]of list){
const b=h('button',{type:'button',class:'p10-b',title:d},n)
b.addEventListener('click',()=>{if(fin||sel.length>=10)return;sel.push(id);b.classList.add('on');b.dataset.n=(Number(b.dataset.n||0)+1);b.textContent=n+' x'+b.dataset.n;cnt.textContent=sel.length+' / 10';if(sel.length>=10)setTimeout(done,350)})
grid.append(b)
}
box.append(root)
let left=40
const iv=setInterval(()=>{left--;cnt.textContent=sel.length+' / 10   '+left+'s';if(left<=0)done()},1000)
return done
}
let bz=0
export function bugOn(tone){
clearInterval(bz)
document.documentElement.classList.add('tes-bug')
bz=setInterval(()=>tone&&tone(Math.random()<.5?880:1320+Math.random()*900,.05,.04,'square'),90)
}
export function bugOff(){
clearInterval(bz)
document.documentElement.classList.remove('tes-bug')
}
