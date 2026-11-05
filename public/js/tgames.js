import{h,POST}from'./util.js'
const W=480,H=300
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')
const lite=()=>document.documentElement.classList.contains('perf')
const R=(c,x,y,w,hh,r,f)=>{c.beginPath();c.roundRect(x,y,w,hh,r);c.fillStyle=f;c.fill()}
const C=(c,x,y,r,f)=>{c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=f;c.fill()}
function pie(c,x,y,w,hh,seed){
R(c,x,y,w,hh,hh/2.4,'#c98a45')
R(c,x+2,y+2,w-4,hh*.45,hh/3,['#e0a35a','#d9783a','#b5532c'][seed%3])
c.fillStyle='#fff3d6'
for(let i=6;i<w-6;i+=12){c.beginPath();c.arc(x+i,y+hh*.62,2.4,0,7);c.fill()}
}
function turkey(c,x,y,t,jump){
const f=['#d9532c','#e8a32c','#8a5a2b','#c43a2a','#e8a32c']
for(let i=0;i<5;i++){const a=-2.6+i*.55;c.save();c.translate(x-6,y-18);c.rotate(a+Math.PI/2*0);c.fillStyle=f[i];c.beginPath();c.ellipse(0,-18,6,15,0,0,7);c.fill();c.restore()}
C(c,x,y-6,14,'#7a4a22')
C(c,x+9,y-17,7,'#7a4a22')
C(c,x+12,y-18,1.8,'#fff')
c.fillStyle='#f2a22a';c.beginPath();c.moveTo(x+15,y-16);c.lineTo(x+22,y-14);c.lineTo(x+15,y-12);c.fill()
c.fillStyle='#d12d2d';c.beginPath();c.arc(x+13,y-10,2.6,0,7);c.fill()
c.strokeStyle='#f2a22a';c.lineWidth=3
const s=jump?0:Math.sin(t*18)*5
c.beginPath();c.moveTo(x-3,y+7);c.lineTo(x-3+s,y+18);c.moveTo(x+4,y+7);c.lineTo(x+4-s,y+18);c.stroke()
}
function hat(c,x,y){
c.fillStyle='#1d1a22';c.beginPath();c.moveTo(x+4,y+8);c.lineTo(x+8,y-22);c.lineTo(x+26,y-22);c.lineTo(x+30,y+8);c.fill()
R(c,x-3,y+6,40,6,3,'#1d1a22')
R(c,x+8,y-4,18,5,1,'#e8c14a')
}
function sky(c,t){
const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#f2a65a');g.addColorStop(1,'#ffd9a0');c.fillStyle=g;c.fillRect(0,0,W,H)
C(c,380,70,34,'#fff0c2')
}
function dash(){
const o={score:0,over:false,t:0,y:0,vy:0,sp:240,ob:[],next:1,pies:0,d:0}
o.press=()=>{if(o.y>=0&&!o.over){o.vy=-520;o.y=-.01}}
o.update=dt=>{
o.t+=dt;o.sp=Math.min(520,240+o.t*6);o.d+=o.sp*dt
if(o.y<0||o.vy<0){o.vy+=1500*dt;o.y+=o.vy*dt;if(o.y>=0){o.y=0;o.vy=0}}
o.next-=dt
if(o.next<=0){const r=Math.random();o.ob.push(r<.6?{k:'h',x:W+20}:{k:'p',x:W+20,y:-70-Math.random()*40});o.next=.9+Math.random()*1.1-Math.min(.5,o.t/90)}
for(const b of o.ob)b.x-=o.sp*dt
o.ob=o.ob.filter(b=>b.x>-50&&!b.gone)
for(const b of o.ob){
if(b.k==='h'&&b.x<92&&b.x+30>62&&o.y>-26){o.over=true}
if(b.k==='p'&&!b.gone&&Math.abs(b.x+20-78)<28&&Math.abs(b.y-(o.y-20))<34){b.gone=true;o.pies++}
}
o.score=Math.floor(o.d/10)+o.pies*50
}
o.draw=c=>{
sky(c,o.t)
c.fillStyle='#7a4a22';c.fillRect(0,240,W,60)
c.fillStyle='#a3652e'
for(let i=0;i<W;i+=40)c.fillRect(((i-o.d)%W+W)%W,246,22,4)
for(const b of o.ob){if(b.k==='h')hat(c,b.x,232);else pie(c,b.x,240+b.y,40,20,1)}
turkey(c,78,222+o.y,o.t,o.y<0)
c.fillStyle='#3a1f0e';c.font='700 18px system-ui,sans-serif';c.textAlign='left'
c.fillText('Score '+o.score,12,26)
}
return o
}
function stack(){
const o={score:0,over:false,t:0,tiers:[{x:W/2-80,w:160}],cur:{x:0,w:160,dir:1},sp:150,cam:0}
o.press=()=>{
if(o.over)return
const p=o.tiers[o.tiers.length-1],c=o.cur
const l=Math.max(p.x,c.x),r=Math.min(p.x+p.w,c.x+c.w)
if(r-l<6){o.over=true;return}
o.tiers.push({x:l,w:r-l})
o.score=o.tiers.length-1
o.cur={x:o.dir?0:W-(r-l),w:r-l,dir:1}
o.dir=!o.dir
o.sp=Math.min(380,150+o.score*9)
}
o.dir=false
o.cur.x=0
o.update=dt=>{
o.t+=dt
const c=o.cur
c.x+=c.dir*o.sp*dt
if(c.x<0){c.x=0;c.dir=1}
if(c.x+c.w>W){c.x=W-c.w;c.dir=-1}
const want=Math.max(0,(o.tiers.length-6)*22)
o.cam+=(want-o.cam)*(still()?1:Math.min(1,dt*6))
}
o.draw=c=>{
sky(c,o.t)
c.fillStyle='#7a4a22';c.fillRect(0,270+o.cam,W,60)
o.tiers.forEach((t,i)=>pie(c,t.x,248-i*22+o.cam,t.w,20,i))
if(!o.over)pie(c,o.cur.x,248-o.tiers.length*22+o.cam,o.cur.w,20,o.tiers.length)
c.fillStyle='#3a1f0e';c.font='700 18px system-ui,sans-serif';c.textAlign='left'
c.fillText('Tiers '+o.score,12,26)
}
return o
}
const SYM=[
(c,x,y)=>{C(c,x,y+2,13,'#e8761c');R(c,x-2,y-14,4,7,1,'#4a7a2a')},
(c,x,y)=>{c.fillStyle='#f2c23a';c.beginPath();c.ellipse(x,y,8,15,0,0,7);c.fill();c.strokeStyle='#c28a1a';c.lineWidth=1.5;for(let i=-4;i<=4;i+=4){c.beginPath();c.moveTo(x+i,y-12);c.lineTo(x+i,y+12);c.stroke()}},
(c,x,y)=>{C(c,x,y+2,12,'#c43a2a');c.fillStyle='#4a7a2a';c.beginPath();c.ellipse(x+5,y-12,6,3,-.6,0,7);c.fill()},
(c,x,y)=>{c.fillStyle='#c9501c';c.beginPath();c.moveTo(x,y-14);c.lineTo(x+13,y);c.lineTo(x,y+14);c.lineTo(x-13,y);c.fill();c.strokeStyle='#6a2a0c';c.lineWidth=2;c.beginPath();c.moveTo(x,y-14);c.lineTo(x,y+14);c.stroke()},
(c,x,y)=>{c.fillStyle='#e0a35a';c.beginPath();c.moveTo(x-14,y+10);c.lineTo(x+14,y+10);c.lineTo(x,y-12);c.fill();c.fillStyle='#fff3d6';c.fillRect(x-12,y+6,24,4)},
(c,x,y)=>{c.fillStyle='#8a5a2b';c.beginPath();c.ellipse(x,y+3,9,12,0,0,7);c.fill();R(c,x-11,y-12,22,8,3,'#5a3a1b')},
(c,x,y)=>{C(c,x,y+4,9,'#7a4a22');C(c,x+6,y-6,5,'#7a4a22');C(c,x-2,y-14,6,'#d9532c');C(c,x+5,y-15,6,'#e8a32c');C(c,x-8,y-9,5,'#c43a2a')},
(c,x,y)=>{for(const[a,b]of[[-6,-4],[5,-5],[0,5],[-8,6],[8,4]])C(c,x+a,y+b,6,'#b3122a')}
]
function match(){
const o={score:0,over:false,t:0,moves:0,sel:[],cur:0,lock:0,done:0}
const ids=[...Array(8).keys(),...Array(8).keys()].sort(()=>Math.random()-.5)
o.cards=ids.map(k=>({k,up:false,ok:false}))
const cw=96,ch=62,gx=(W-4*cw)/2,gy=34
const flip=i=>{
const a=o.cards[i]
if(o.over||o.lock>0||a.up||a.ok)return
a.up=true;o.sel.push(i)
if(o.sel.length===2){
o.moves++
const[p,q]=o.sel.map(j=>o.cards[j])
if(p.k===q.k){p.ok=q.ok=true;o.sel=[];o.done++;if(o.done===8){o.over=true;o.score=Math.max(0,Math.round(120-o.moves*5-o.t/2))}}
else o.lock=.8
}
}
o.press=(x,y)=>{
if(x==null){flip(o.cur);return}
const cx=Math.floor((x-gx)/cw),cy=Math.floor((y-gy)/ch)
if(cx>=0&&cx<4&&cy>=0&&cy<4){o.cur=cy*4+cx;flip(o.cur)}
}
o.key=e=>{
const m={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4}[e.code]
if(!m)return false
o.cur=Math.max(0,Math.min(15,o.cur+m));return true
}
o.update=dt=>{
o.t+=dt
if(o.lock>0){o.lock-=dt;if(o.lock<=0){for(const j of o.sel)o.cards[j].up=false;o.sel=[]}}
}
o.draw=c=>{
sky(c,o.t)
o.cards.forEach((a,i)=>{
const x=gx+(i%4)*cw+4,y=gy+Math.floor(i/4)*ch+4
R(c,x,y,cw-8,ch-8,10,a.up||a.ok?'#fff3d6':'#7a4a22')
if(a.up||a.ok){SYM[a.k](c,x+(cw-8)/2,y+(ch-8)/2)}
else{c.strokeStyle='#c98a45';c.lineWidth=2;c.strokeRect(x+8,y+8,cw-24,ch-24)}
if(i===o.cur){c.strokeStyle='#3a1f0e';c.lineWidth=3;c.beginPath();c.roundRect(x-2,y-2,cw-4,ch-4,12);c.stroke()}
})
c.fillStyle='#3a1f0e';c.font='700 16px system-ui,sans-serif';c.textAlign='left'
c.fillText('Moves '+o.moves,12,22)
}
return o
}
const GAMES={dash:['Turkey Dash','Press space or tap to jump. Grab pies, dodge pilgrim hats.',dash],stack:['Pie Stack','Press space or tap to drop the sliding pie. Overhang gets trimmed.',stack],match:['Gobble Match','Flip two cards at a time to find all eight autumn pairs. Arrow keys and Enter work too.',match]}
export function openTg(kind){
const[title,desc,make]=GAMES[kind]
const cv=h('canvas',{width:W,height:H,class:'tkg-cv',tabindex:0,'aria-label':title})
const left=h('div',{class:'tkg-left'})
const x=h('button',{class:'btn sm tkg-x',type:'button'},'Close')
const box=h('div',{class:'tkg-box',role:'dialog','aria-modal':'true','aria-label':title},h('h3',null,title),cv,left,x)
const root=h('div',{class:'tkg'},box)
document.body.append(root)
const c=cv.getContext('2d')
let g=null,state='start',raf=0,last=0,paused=false,sent=false,t0=0,res=''
const msg=(a,b)=>{
c.fillStyle='rgba(40,20,8,.72)';c.fillRect(0,0,W,H)
c.fillStyle='#fff3d6';c.textAlign='center';c.font='800 28px system-ui,sans-serif';c.fillText(a,W/2,H/2-22)
c.font='500 14px system-ui,sans-serif';const w=b.split('\n');w.forEach((l,i)=>c.fillText(l,W/2,H/2+4+i*20))
}
const start=()=>{g=make();state='play';sent=false;t0=Date.now();last=0;res='';cv.focus()}
const finish=async()=>{
state='over'
if(sent)return
sent=true
try{const d=await POST('/api/games/turkey/finish',{game:kind,score:g.score,secs:Math.floor((Date.now()-t0)/1000)});res=d.pars>0?'You earned '+d.pars+' Pars.':'No Pars this time.'}catch(e){res=e.message||''}
}
const press=(px,py)=>{
if(state==='start')start()
else if(state==='over'){if(Date.now()-t0>600)start()}
else if(!paused)g.press(px,py)
}
let skip=false
const loop=ts=>{
raf=requestAnimationFrame(loop)
if(lite()&&(skip=!skip))return
const dt=Math.min(.05,(ts-(last||ts))/1000);last=ts
if(state==='play'&&!paused){g.update(dt);if(g.over)finish()}
if(g)g.draw(c);else{sky(c,0)}
if(state==='start')msg(title,desc)
if(state==='over')msg('Score '+g.score,res+'\nPress space or tap to play again')
if(paused&&state==='play')msg('Paused','Click to resume')
}
const key=e=>{
if(e.code==='Escape'){close();return}
if(state==='play'&&g.key&&g.key(e)){e.preventDefault();return}
if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowUp'){e.preventDefault();if(e.repeat)return;if(paused){paused=false;return}press()}
}
const blur=()=>{if(state==='play')paused=true}
cv.addEventListener('pointerdown',e=>{
if(paused){paused=false;return}
const r=cv.getBoundingClientRect()
press((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)
})
document.addEventListener('keydown',key)
addEventListener('blur',blur)
document.addEventListener('visibilitychange',()=>{if(document.hidden)blur()})
function close(){cancelAnimationFrame(raf);document.removeEventListener('keydown',key);removeEventListener('blur',blur);root.remove()}
x.addEventListener('click',close)
raf=requestAnimationFrame(loop)
cv.focus()
}
