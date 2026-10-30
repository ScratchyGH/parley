import{h}from'./util.js'
import{CSD}from'./tusim.js'
import{kandieArt}from'./kandie.js'
const TAU=Math.PI*2
const CH={
parley:{n:'Parley',c:'#c9a8ff',img:'/mascot-sm.webp'},
brit:{n:'Brit',c:'#7ad7ff',img:'/brit.webp'},
kandie:{n:'Kandie',c:'#ff9ac2',art:1},
tesvin:{n:'Tesvin',c:'#58ffd0',tv:1},
narr:{n:'',c:'#d8d8e0'}
}
const SC={
intro:[
{w:'narr',t:'The harvest moon rose over Gourd Hollow, and every lantern in the village went out at once.',z:1.25,y:20},
{w:'parley',t:'Okay. Nobody panic. Technically I already knew the lanterns going out was a bad sign.',z:1.5},
{w:'brit',t:'Parley, my sensors are pinned. Whatever is out there is hungry, and your squad is the loudest signal for a hundred miles.',z:1.35},
{w:'parley',t:'So we are bait. Great. Love that for us.',z:1.5},
{w:'kandie',k:1,t:'Relax, nerd. I came to keep the admin in one piece. Try to keep up, okay?',z:1.4},
{w:'brit',t:'Hold the line until dawn. I will keep the field relay running from the lab, and I will log everything.',z:1.3},
{w:'parley',t:'He is going to log everything. Of course he is.',z:1.15,fx:'flash'}
],
moon:[
{w:'narr',t:'The moon bled red. The whole hollow held its breath.',z:1.3,fx:'shake'},
{w:'brit',t:'Blood moon. Spawn rates are doubling. Parley, I would like a note in my journal that I predicted this.',z:1.35},
{w:'parley',t:'You predicted it in the same breath as it happening, Brit.',z:1.5},
{w:'kandie',k:1,t:'Both of you stop flirting with the science and start shooting things.',z:1.4}
],
lair:[
{w:'parley',t:'Stairs. Under a graveyard. Who builds stairs under a graveyard on purpose?',z:1.5},
{w:'brit',t:'Someone who wanted to hide something worth finding. Three pedestals, three potions. Take one, the lair seals itself behind you.',z:1.3},
{w:'kandie',k:1,t:'So pick the good one. No pressure.',z:1.4}
],
boss:[
{w:'narr',t:'The ground split open, and something very large decided it was done waiting.',z:1.2,fx:'shake'},
{w:'brit',t:'That is not a normal anomaly. Big, loud, and politely ignoring physics.',z:1.3},
{w:'parley',t:'It is ignoring me too, which is rude. I have been very visible.',z:1.5},
{w:'kandie',k:1,t:'Aim for the glowing parts. There is always a glowing part.',z:1.4},
{w:'narr',t:'{b}',z:1.9,fx:'flash'}
],
bossend:[
{w:'brit',t:'Signal is clear. The anomaly is gone. That was textbook, if the textbook had a lot of screaming in it.',z:1.3},
{w:'parley',t:'I will take the credit and also a snack.',z:1.5},
{w:'kandie',k:1,t:'You two are unbearable. Good job, though. Really.',z:1.4}
],
tes1:[
{w:'narr',t:'Every window in Gourd Hollow flickered to the same channel.',z:1.2,fx:'glitch'},
{w:'tesvin',t:'Good evening, viewers. You are watching the last broadcast you will ever see.',z:1.5,fx:'glitch'},
{w:'parley',t:'Is that a TV? Why is the TV talking? Why does it sound like it paid for the good microphone?',z:1.5},
{w:'brit',t:'Tesvin. He has been rewriting pixels across the entire network. Parley, this is very, very bad.',z:1.3},
{w:'tesvin',t:'I do not break the rules. I split them. I split atoms, and I split your reality at the seams.',z:1.7,fx:'shake'},
{w:'kandie',k:1,t:'Okay, that is the creepiest thing I have heard all week, and I live with you two.',z:1.4},
{w:'brit',t:'Everyone, brace. He is about to pull the render layer.',z:1.2,fx:'glitch'}
],
tes2:[
{w:'tesvin',t:'Look closely. This page is only a texture. Allow me to peel it off.',z:1.6,fx:'glitch'},
{w:'parley',t:'Brit, the whole site is getting pulled in!',z:1.4,fx:'shake'},
{w:'brit',t:'He is ripping it into his dimension. Hold on to something solid and keep moving!',z:1.3}
],
tes3:[
{w:'tesvin',t:'Impossible. I was supposed to be the last signal.',z:1.7,fx:'glitch'},
{w:'brit',t:'Textures reloading. Reality is restoring itself. Welcome back, everyone.',z:1.25,fx:'flash'},
{w:'parley',t:'Ugh. My head. Did we just beat a television?',z:1.5},
{w:'kandie',k:1,t:'We beat a television. Write that down, Brit.',z:1.4},
{w:'brit',t:'Already writing it down. I am going to need a bigger notebook.',z:1.25}
]
}
export function scene(box,id,o){
const raw=SC[id]
if(!raw)return Promise.resolve()
const steps=raw.filter(s=>!s.k||o.kan)
const cap=((CSD[id]||13)*1000)-1500
const per=Math.min(7000,cap/steps.length)
const cv=o.cv
return new Promise(done=>{
const bt=h('div',{class:'cs-bar t'}),bb=h('div',{class:'cs-bar b'})
const pt=h('div',{class:'cs-pt'}),nm=h('div',{class:'cs-n'}),tx=h('div',{class:'cs-t'})
const sk=h('button',{type:'button',class:'cs-sk'},'Skip')
const fl=h('div',{class:'cs-fl'})
const pn=h('div',{class:'cs-p'},pt,h('div',{class:'cs-pb'},nm,tx))
const root=h('div',{class:'cs'},fl,bt,bb,pn,sk)
box.append(root)
requestAnimationFrame(()=>root.classList.add('on'))
let i=-1,iv=0,to=0,full='',pos=0,ended=false
const cam=(z,y)=>{if(!cv)return;cv.style.transition='transform 1.4s cubic-bezier(.2,.7,.2,1)';cv.style.transform='scale('+(z||1)+') translateY('+(y||0)+'px)'}
const fx=f=>{
if(!f)return
if(f==='flash'){fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go')}
else{const k=f==='shake'?'cs-shake':'cs-gl';box.classList.add(k);setTimeout(()=>box.classList.remove(k),f==='shake'?600:900)}
}
const fin=()=>{
if(ended)return
ended=true
clearInterval(iv);clearTimeout(to)
removeEventListener('keydown',key)
root.classList.remove('on')
if(cv){cv.style.transition='transform .8s ease';cv.style.transform=''}
setTimeout(()=>{root.remove();if(cv)cv.style.transition=''},700)
done()
}
const show=()=>{
clearInterval(iv);clearTimeout(to)
i++
if(i>=steps.length)return fin()
const s=steps[i],c=CH[s.w]
full=(s.t||'').replace('{b}',o.name||'')
pos=0
nm.textContent=c.n
nm.style.color=c.c
pt.replaceChildren()
pt.style.borderColor=c.c
if(c.img)pt.append(h('img',{src:c.img,alt:c.n}))
else if(c.art)pt.append(kandieArt(64))
else if(c.tv)pt.append(h('div',{class:'cs-tv'},h('i'),h('i'),h('b')))
pn.classList.toggle('nr',s.w==='narr')
tx.textContent=''
cam(s.z,s.y)
fx(s.fx)
iv=setInterval(()=>{
pos++
tx.textContent=full.slice(0,pos)
if(pos>=full.length){clearInterval(iv);to=setTimeout(show,Math.min(per,full.length*42+1500))}
},28)
}
const adv=()=>{if(pos<full.length){pos=full.length;tx.textContent=full}else show()}
const key=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();adv()}else if(e.key==='Escape')fin()}
addEventListener('keydown',key)
root.addEventListener('pointerdown',e=>{if(e.target===sk)return;adv()})
sk.addEventListener('click',e=>{e.stopPropagation();fin()})
setTimeout(show,700)
})
}
let ts=null,bk=null
const fil=()=>{
if(ts)return ts
const n='http://www.w3.org/2000/svg',s=document.createElementNS(n,'svg')
s.setAttribute('width','0');s.setAttribute('height','0');s.style.position='absolute'
const f=document.createElementNS(n,'filter');f.setAttribute('id','tesw')
const t=document.createElementNS(n,'feTurbulence');t.setAttribute('type','fractalNoise');t.setAttribute('baseFrequency','.006 .012');t.setAttribute('numOctaves','2');t.setAttribute('result','n')
const d=document.createElementNS(n,'feDisplacementMap');d.setAttribute('in','SourceGraphic');d.setAttribute('in2','n');d.setAttribute('scale','0');d.setAttribute('xChannelSelector','R');d.setAttribute('yChannelSelector','G')
f.append(t,d);s.append(f);document.body.append(s)
ts={s,t,d}
return ts
}
export function rip(on,box){
const app=document.getElementById('app')
if(!app||!box)return
if(on){
if(bk)return
const F=fil()
const els=[...app.querySelectorAll('*')].filter(e=>e!==box&&!e.contains(box)&&!box.contains(e)&&e.parentElement&&e.parentElement.contains(box))
const bb=box.getBoundingClientRect(),bx=bb.left+bb.width/2,by=bb.top+bb.height/2
bk={els,old:els.map(e=>[e.style.transform,e.style.opacity,e.style.filter,e.style.transition,e.style.visibility])}
app.style.filter='url(#tesw)'
const t0=performance.now()
const tick=()=>{
if(!bk)return
const k=(performance.now()-t0)/1500
F.d.setAttribute('scale',String(Math.round(Math.min(1,k)*70*(1+Math.sin(k*18)*.3))))
F.t.setAttribute('baseFrequency',(.006+Math.sin(k*9)*.004)+' '+(.012+Math.cos(k*7)*.006))
if(k<1.1)requestAnimationFrame(tick)
else app.style.filter=''
}
tick()
setTimeout(()=>{
if(!bk)return
els.forEach((e,i)=>{
const r=e.getBoundingClientRect()
const dx=bx-(r.left+r.width/2),dy=by-(r.top+r.height/2)
e.style.transition='transform 1.5s cubic-bezier(.65,0,.9,.35) '+(i*70)+'ms,opacity 1.2s ease '+(i*70+300)+'ms,filter 1.2s ease '+(i*70)+'ms'
e.style.transform='translate('+dx+'px,'+dy+'px) scale(.02) rotate('+((i%2?1:-1)*(180+i*25))+'deg)'
e.style.opacity='0'
e.style.filter='blur(8px) hue-rotate(120deg)'
})
setTimeout(()=>{if(bk)els.forEach(e=>{e.style.visibility='hidden'})},2400+els.length*70)
},1300)
box.classList.add('tes-ar')
}else{
box.classList.remove('tes-ar')
const b=bk
bk=null
if(!b)return
app.style.filter=''
b.els.forEach((e,i)=>{e.style.visibility=b.old[i][4];e.style.transition='transform .9s cubic-bezier(.2,.8,.2,1) '+(i*50)+'ms,opacity .8s ease '+(i*50)+'ms,filter .8s ease';e.style.transform=b.old[i][0];e.style.opacity=b.old[i][1];e.style.filter=b.old[i][2]})
setTimeout(()=>b.els.forEach((e,i)=>{e.style.transition=b.old[i][3]}),1800)
}
}
let sl=null
const scan=()=>{
if(sl)return sl
const c=document.createElement('canvas');c.width=4;c.height=4
const g=c.getContext('2d');g.fillStyle='rgba(0,0,0,.5)';g.fillRect(0,0,4,1)
sl=c
return c
}
export function arenaFx(ctx,cv,W,H,D,Z,cx,cy,t,k,lite){
ctx.save()
ctx.setTransform(D,0,0,D,0,0)
ctx.fillStyle='rgba(6,0,22,'+(.6*k)+')'
ctx.fillRect(0,0,W,H)
ctx.globalCompositeOperation='lighter'
const st=70*Z,ox=-((cx*Z)%st),oy=-((cy*Z)%st)
ctx.lineWidth=1.6
for(let x=ox;x<W;x+=st){ctx.strokeStyle='rgba(0,255,220,'+((.16+.1*Math.sin(t*2+x*.02))*k)+')';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
for(let y=oy;y<H;y+=st){ctx.strokeStyle='rgba(255,60,200,'+((.16+.1*Math.sin(t*2+y*.02))*k)+')';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
const n=lite?5:11
for(let i=0;i<n;i++){
const bx=((i*977+t*(8+i*2))%(W+160))-80,by=((i*533)%H)+Math.sin(t*.7+i)*30
ctx.strokeStyle='rgba(120,255,235,'+(.5*k)+')'
ctx.lineWidth=1.2
for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(bx,by,26,9,j*Math.PI/3+t*.6,0,TAU);ctx.stroke()}
ctx.fillStyle='rgba(255,255,255,'+(.8*k)+')'
ctx.beginPath();ctx.arc(bx,by,3.2,0,TAU);ctx.fill()
for(let j=0;j<3;j++){const a=t*2.2+j*TAU/3+i,ex=Math.cos(a)*26,ey=Math.sin(a)*9,r=j*Math.PI/3+t*.6,rx=ex*Math.cos(r)-ey*Math.sin(r),ry=ex*Math.sin(r)+ey*Math.cos(r);ctx.fillStyle='rgba(255,90,220,'+k+')';ctx.beginPath();ctx.arc(bx+rx,by+ry,2.2,0,TAU);ctx.fill()}
}
ctx.globalCompositeOperation='source-over'
const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75)
g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(90,0,160,'+(.55*k)+')')
ctx.fillStyle=g;ctx.fillRect(0,0,W,H)
ctx.restore()
if(lite)return
ctx.save()
ctx.setTransform(1,0,0,1,0,0)
const w=cv.width,hh=cv.height
for(let i=0;i<7;i++){
const y=Math.floor(Math.random()*hh),sh=Math.floor(hh*(.01+Math.random()*.04)),dx=Math.floor((Math.random()-.5)*60*D*k)
if(Math.random()<.55)ctx.drawImage(cv,0,y,w,sh,dx,y,w,sh)
}
const bands=14,bw=Math.ceil(w/bands)
for(let i=0;i<bands;i++){
const dy=Math.round(Math.sin(t*2.6+i*.9)*5*D*k)
if(dy)ctx.drawImage(cv,i*bw,0,bw,hh,i*bw,dy,bw,hh)
}
ctx.globalAlpha=.22*k
ctx.fillStyle=ctx.createPattern(scan(),'repeat')
ctx.fillRect(0,0,w,hh)
ctx.restore()
}
export function tesvin(ctx,e,t,pp,tg){
const x=e.x,y=e.y,b=Math.sin(t*3)*4
ctx.save()
ctx.translate(x,y-34+b)
const gl=Math.random()<.06+(tg>0?.2:0)
if(gl)ctx.translate((Math.random()-.5)*10,0)
ctx.strokeStyle='#07040c';ctx.lineWidth=4
ctx.beginPath();ctx.moveTo(-12,-46);ctx.lineTo(-24,-70);ctx.moveTo(12,-46);ctx.lineTo(26,-66);ctx.stroke()
ctx.strokeStyle='#9aa4c0';ctx.lineWidth=2
ctx.beginPath();ctx.moveTo(-12,-46);ctx.lineTo(-24,-70);ctx.moveTo(12,-46);ctx.lineTo(26,-66);ctx.stroke()
ctx.fillStyle='#07040c';ctx.fillRect(-34,-3,68,10);ctx.fillRect(-26,26,14,14);ctx.fillRect(12,26,14,14)
ctx.fillStyle='#1b1e2c'
ctx.beginPath();ctx.roundRect(-48,-48,96,78,10);ctx.fill()
ctx.fillStyle='#2e3350'
ctx.beginPath();ctx.roundRect(-44,-44,88,70,8);ctx.fill()
ctx.fillStyle='#03060a'
ctx.beginPath();ctx.roundRect(-38,-38,76,52,6);ctx.fill()
const sg=ctx.createLinearGradient(0,-38,0,14)
sg.addColorStop(0,pp>=3?'#ff3a8a':'#1affd0');sg.addColorStop(1,pp>=3?'#6a1aff':'#0a6a8a')
ctx.fillStyle=sg;ctx.globalAlpha=.88
ctx.beginPath();ctx.roundRect(-36,-36,72,48,5);ctx.fill()
ctx.globalAlpha=1
ctx.fillStyle='#04141c'
const bl=Math.sin(t*1.7)>.93?2:9
ctx.fillRect(-22,-22,12,bl);ctx.fillRect(10,-22,12,bl)
if(tg>0){ctx.fillStyle='#ff3a4a';ctx.fillRect(-22,-22,12,9);ctx.fillRect(10,-22,12,9)}
ctx.fillStyle='#04141c'
for(let i=-5;i<=5;i++){const hh=2+Math.abs(Math.sin(t*9+i*1.3))*7;ctx.fillRect(i*5-1,-2-hh/2+4,3,hh)}
ctx.fillStyle='rgba(255,255,255,.55)'
for(let i=0;i<22;i++)ctx.fillRect(-36+Math.random()*72,-36+Math.random()*48,2,1.5)
ctx.fillStyle='rgba(0,0,0,.18)'
for(let yy=-36;yy<12;yy+=3)ctx.fillRect(-36,yy,72,1)
if(pp>=2){ctx.globalAlpha=.4;ctx.fillStyle='#ff2a5a';ctx.fillRect(-38,-36,3,48);ctx.fillStyle='#2affff';ctx.fillRect(35,-36,3,48);ctx.globalAlpha=1}
ctx.fillStyle='#ff5a7a';ctx.beginPath();ctx.arc(34,20,2.6,0,TAU);ctx.fill();ctx.fillStyle='#7affd0';ctx.beginPath();ctx.arc(26,20,2.6,0,TAU);ctx.fill()
ctx.restore()
}
export function kandieDraw(ctx,spr,x,y,t){
const bob=Math.sin(t*5)*1.6
ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+2,10,3.6,0,0,TAU);ctx.fill()
ctx.drawImage(spr,x-spr.width/2,y-spr.height+3+bob)
}
export function bubble(ctx,x,y,text,k){
ctx.save()
ctx.globalAlpha=Math.min(1,k*3)
ctx.font='700 11px system-ui,sans-serif'
const w=Math.min(190,ctx.measureText(text).width+16)
const words=text.split(' '),lines=[]
let cur=''
for(const wd of words){if(ctx.measureText(cur+' '+wd).width>w-12&&cur){lines.push(cur);cur=wd}else cur=cur?cur+' '+wd:wd}
lines.push(cur)
const hh=lines.length*13+8,bx=x-w/2,by=y-hh-8
ctx.fillStyle='rgba(20,10,28,.92)';ctx.strokeStyle='#ff9ac2';ctx.lineWidth=1.5
ctx.beginPath();ctx.roundRect(bx,by,w,hh,6);ctx.fill();ctx.stroke()
ctx.beginPath();ctx.moveTo(x-4,by+hh);ctx.lineTo(x,by+hh+6);ctx.lineTo(x+4,by+hh);ctx.fill()
ctx.fillStyle='#ffe0ee';ctx.textAlign='center'
lines.forEach((l,i)=>ctx.fillText(l,x,by+14+i*13))
ctx.restore()
}
