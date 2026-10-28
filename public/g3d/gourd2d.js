export function playRush(mount,done){
const cv=document.createElement('canvas')
cv.className='rs-cv'
const wrap=document.createElement('div')
wrap.className='rs'
const hud=document.createElement('div')
hud.className='rs3-hud'
hud.innerHTML='<div class="rs3-bar"><i id="g2hp"></i></div><div class="rs3-x"><div class="rs3-bar"><i id="g2xp"></i></div></div><div class="rs3-t" id="g2t">0:00</div>'
const say=document.createElement('div')
say.className='rs3-say'
const cards=document.createElement('div')
cards.className='rs-cards'
const row=document.createElement('div')
row.className='rs-row'
cards.appendChild(row)
const end=document.createElement('div')
end.className='rs3-end'
wrap.append(cv,hud,say,cards,end)
mount.appendChild(wrap)
const ctx=cv.getContext('2d')
const sz=()=>{cv.width=wrap.clientWidth;cv.height=wrap.clientHeight}
sz()
addEventListener('resize',sz)
const keys={}
const kd=e=>{keys[e.key.toLowerCase()]=true}
const ku=e=>{keys[e.key.toLowerCase()]=false}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
const W=3000,H=3000
const p={x:W/2,y:H/2,r:14,hp:100,mhp:100,spd:230,xp:0,lv:1,need:20,fireT:0,fireI:.55,dmg:10,rng:260,bolt:1,speedUp:0}
const bolts=[]
const enemies=[]
const pops=[]
let t=0,over=false,dead=false,paused=false,boss=null
function announce(s){say.textContent=s;say.classList.add('on');setTimeout(()=>say.classList.remove('on'),1400)}
function spawnWave(){
const n=Math.min(2+Math.floor(t/6),9)
for(let i=0;i<n;i++){
const a=Math.random()*Math.PI*2,d=420+Math.random()*120
enemies.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,r:13,hp:14+t*1.3,mhp:14+t*1.3,spd:70+Math.min(60,t*1.2),dmg:8})
}
}
function spawnBoss(){
boss={x:p.x-500,y:p.y,r:34,hp:600+t*4,mhp:600+t*4,spd:60,dmg:20,boss:true}
announce('The Hollowgrin rises')
}
const CARDS=[
{n:'Sharper lantern',d:'+40% damage',a:()=>p.dmg*=1.4},
{n:'Wider wick',d:'+30% fire rate',a:()=>p.fireI*=.7},
{n:'Longer reach',d:'+25% range',a:()=>p.rng*=1.25},
{n:'Twin flame',d:'+1 bolt',a:()=>p.bolt++},
{n:'Fleet feet',d:'+15% speed',a:()=>p.spd*=1.15},
{n:'Stout heart',d:'+30 max HP, full heal',a:()=>{p.mhp+=30;p.hp=p.mhp}}
]
function levelUp(){
p.lv++
p.need=Math.floor(p.need*1.35)
paused=true
row.innerHTML=''
const pick=[...CARDS].sort(()=>Math.random()-.5).slice(0,3)
for(const c of pick){
const b=document.createElement('button')
b.className='rs-card'
b.innerHTML='<b>'+c.n+'</b><span>'+c.d+'</span>'
b.onclick=()=>{c.a();cards.classList.remove('on');paused=false}
row.appendChild(b)
}
cards.classList.add('on')
}
function hit(e,dmg){
e.hp-=dmg
pops.push({x:e.x,y:e.y,t:0,s:dmg})
if(e.hp<=0){
if(e.boss){
p.xp+=200
boss=null
announce('The Hollowgrin falls')
}else{
p.xp+=6
enemies.splice(enemies.indexOf(e),1)
}
if(p.xp>=p.need)levelUp()
}
}
function fire(dt){
p.fireT-=dt
if(p.fireT>0)return
let tgt=null,bd=p.rng
const all=boss?[...enemies,boss]:enemies
for(const e of all){
const d=Math.hypot(e.x-p.x,e.y-p.y)
if(d<bd){bd=d;tgt=e}
}
if(!tgt)return
p.fireT=p.fireI
for(let i=0;i<p.bolt;i++){
const spread=(i-(p.bolt-1)/2)*.18
const a=Math.atan2(tgt.y-p.y,tgt.x-p.x)+spread
bolts.push({x:p.x,y:p.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,life:1,dmg:p.dmg})
}
}
let last=performance.now()
function loop(now){
if(over)return
const dt=Math.min(.05,(now-last)/1000)
last=now
if(!paused){
t+=dt
let dx=0,dy=0
if(keys.w||keys.arrowup)dy--
if(keys.s||keys.arrowdown)dy++
if(keys.a||keys.arrowleft)dx--
if(keys.d||keys.arrowright)dx++
const m=Math.hypot(dx,dy)||1
p.x=Math.max(20,Math.min(W-20,p.x+dx/m*p.spd*dt))
p.y=Math.max(20,Math.min(H-20,p.y+dy/m*p.spd*dt))
fire(dt)
for(const b of bolts){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt}
for(let i=bolts.length-1;i>=0;i--)if(bolts[i].life<=0)bolts.splice(i,1)
const all=boss?[...enemies,boss]:enemies
for(const e of all){
const a=Math.atan2(p.y-e.y,p.x-e.x)
e.x+=Math.cos(a)*e.spd*dt
e.y+=Math.sin(a)*e.spd*dt
if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r){p.hp-=e.dmg*dt;if(p.hp<=0&&!dead){dead=true;finish(false)}}
for(let i=bolts.length-1;i>=0;i--){
const b=bolts[i]
if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+6){hit(e,b.dmg);bolts.splice(i,1)}
}
}
for(const pp of pops)pp.t+=dt
for(let i=pops.length-1;i>=0;i--)if(pops[i].t>.5)pops.splice(i,1)
if(t>8&&enemies.length<3&&Math.floor(t)%6===0)spawnWave()
if(t>=180&&!boss)spawnBoss()
if(t>=240&&boss){finish(true)}
}
ctx.setTransform(1,0,0,1,0,0)
ctx.fillStyle='#0c0913'
ctx.fillRect(0,0,cv.width,cv.height)
const cx=cv.width/2-p.x,cy=cv.height/2-p.y
ctx.save()
ctx.translate(cx,cy)
ctx.strokeStyle='rgba(255,154,46,.08)'
ctx.lineWidth=1
for(let x=0;x<W;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
for(let y=0;y<H;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
ctx.fillStyle='#ffb347'
ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()
ctx.fillStyle='rgba(255,180,60,.12)'
ctx.beginPath();ctx.arc(p.x,p.y,p.rng,0,7);ctx.fill()
for(const b of bolts){ctx.fillStyle='#ffe066';ctx.beginPath();ctx.arc(b.x,b.y,5,0,7);ctx.fill()}
for(const e of enemies){
ctx.fillStyle='#c2410c'
ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill()
ctx.fillStyle='#000';ctx.fillRect(e.x-14,e.y-e.r-8,28,4)
ctx.fillStyle='#ef4444';ctx.fillRect(e.x-14,e.y-e.r-8,28*Math.max(0,e.hp/e.mhp),4)
}
if(boss){
ctx.fillStyle='#7c2d12'
ctx.beginPath();ctx.arc(boss.x,boss.y,boss.r,0,7);ctx.fill()
ctx.fillStyle='#000';ctx.fillRect(boss.x-34,boss.y-boss.r-10,68,6)
ctx.fillStyle='#f97316';ctx.fillRect(boss.x-34,boss.y-boss.r-10,68*Math.max(0,boss.hp/boss.mhp),6)
}
for(const pp of pops){ctx.fillStyle='rgba(255,255,255,'+(1-pp.t/.5)+')';ctx.font='700 14px system-ui';ctx.fillText('-'+Math.round(pp.s),pp.x-10,pp.y-pp.t*30-20)}
ctx.restore()
document.getElementById('g2hp').style.width=Math.max(0,p.hp/p.mhp*100)+'%'
document.getElementById('g2xp').style.width=Math.max(0,p.xp/p.need*100)+'%'
document.getElementById('g2t').textContent=Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')
requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
function finish(ok){
over=true
removeEventListener('keydown',kd)
removeEventListener('keyup',ku)
removeEventListener('resize',sz)
end.innerHTML='<h2>'+(ok?'Dawn breaks':'You fell')+'</h2><p>Level '+p.lv+' &middot; '+Math.floor(t)+'s survived</p>'
end.classList.add('on')
setTimeout(()=>done({ok,score:p.lv*100+Math.floor(t),kills:Math.floor(p.xp/6),secs:Math.floor(t),lv:p.lv}),ok?1800:900)
}
return()=>{over=true;removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('resize',sz);wrap.remove()}
}
