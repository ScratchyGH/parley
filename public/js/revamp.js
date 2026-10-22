import{h,GET}from'./util.js'
export const REVAMP_AT=Date.UTC(2027,0,1,5,0,0)
const KEY='parley.rv.preview'
const mem={p:false}
const get=()=>{try{return localStorage.getItem(KEY)==='1'}catch{return mem.p}}
const set=v=>{mem.p=v;try{v?localStorage.setItem(KEY,'1'):localStorage.removeItem(KEY)}catch{}}
const flag=(k,v)=>{try{v===undefined?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch{}}
const getFlag=k=>{try{return sessionStorage.getItem(k)}catch{return null}}
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
let skew=0
const T0=()=>Date.now()+skew-REVAMP_AT
const live=()=>T0()>=0
export const revampOn=()=>live()||get()
export const previewActive=get
function loadCss(){
let l=document.getElementById('rvcss')
if(!l){l=document.createElement('link');l.id='rvcss';l.rel='stylesheet';l.href='/revamp27.css';document.head.append(l)}
return new Promise(r=>{if(l.sheet)return r();l.addEventListener('load',r,{once:true});l.addEventListener('error',r,{once:true});setTimeout(r,2500)})
}
function apply(on){
document.documentElement.classList.toggle('rv27',on)
return on?loadCss():Promise.resolve()
}
export function previewToggle(on){set(on);apply(on)}
apply(revampOn())
const q=s=>document.querySelector(s)
const qa=s=>[...document.querySelectorAll(s)]
const rnd=(a,b)=>a+Math.random()*(b-a)
const layers=(txt,n,cls)=>{
const w=h('span',{class:'rvx '+(cls||'')})
for(let i=n;i>=0;i--){const s=h('span',{class:i?'rvl':'rvf','aria-hidden':'true'},txt);if(i)s.style.transform=`translateZ(${-i*3}px)`;w.append(s)}
return w
}
function digit(n){
const d=h('div',{class:'rvd'},layers(String(n),14))
return d
}
function banner(){
const b=h('div',{class:'rvb'})
const words=['Happy','New','Year']
words.forEach((wd,wi)=>{
const row=h('div',{class:'rvw'})
;[...wd].forEach((c,i)=>{const l=layers(c,9);l.style.animationDelay=(wi*.28+i*.07)+'s';row.append(l)})
b.append(row)
})
b.append(h('div',{class:'rvy'},'2027'))
return b
}
function fireworks(cv){
const c=cv.getContext('2d')
const dpr=Math.min(devicePixelRatio||1,2)
const fit=()=>{cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;c.setTransform(dpr,0,0,dpr,0,0)}
fit()
const P=[]
const cols=['#fcd34d','#f472b6','#a78bfa','#38bdf8','#34d399','#fff','#fb923c']
const burst=(x,y)=>{
const col=[cols[Math.floor(rnd(0,cols.length))],cols[Math.floor(rnd(0,cols.length))]]
const n=90
for(let i=0;i<n;i++){const a=i/n*Math.PI*2,s=rnd(60,300);P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,d:rnd(.5,.9),c:col[i%2],r:rnd(1.2,2.6)})}
}
let last=performance.now(),next=0,stop=false,acc=0
const loop=now=>{
if(stop||!cv.isConnected)return
const dt=Math.min(.05,(now-last)/1000);last=now;acc+=dt
if(acc>=next){acc=0;next=rnd(.18,.5);burst(rnd(innerWidth*.12,innerWidth*.88),rnd(innerHeight*.12,innerHeight*.5))}
c.globalCompositeOperation='destination-out';c.fillStyle='rgba(0,0,0,.22)';c.fillRect(0,0,innerWidth,innerHeight)
c.globalCompositeOperation='lighter'
for(let i=P.length-1;i>=0;i--){
const p=P[i];p.vy+=160*dt;p.vx*=.992;p.vy*=.992;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt/p.d
if(p.l<=0){P.splice(i,1);continue}
c.globalAlpha=p.l;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill()
}
c.globalAlpha=1
requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
return()=>{stop=true}
}
function fall(clones){
const g=1900
const it=clones.map((el,i)=>({el,x:0,y:0,z:0,vx:rnd(-260,260),vy:rnd(-520,-180),vz:rnd(-60,260),rx:0,ry:0,rz:0,vrx:rnd(-260,260),vry:rnd(-260,260),vrz:rnd(-180,180),t:i*.09,done:false}))
let last=performance.now()
const step=now=>{
const dt=Math.min(.04,(now-last)/1000);last=now
let alive=0
for(const p of it){
if(p.done)continue
p.t-=dt
if(p.t>0){alive++;continue}
p.vy+=g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rx+=p.vrx*dt;p.ry+=p.vry*dt;p.rz+=p.vrz*dt
p.el.style.transform=`perspective(900px) translate3d(${p.x}px,${p.y}px,${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`
if(p.y>innerHeight+500){p.done=true;p.el.remove()}else alive++
}
if(alive)requestAnimationFrame(step)
}
requestAnimationFrame(step)
}
function takeAway(){
const lay=h('div',{class:'rvfall'})
document.body.append(lay)
const want=[...qa('.msgs .m').filter(e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}).slice(-9),...qa('.comp .cbox').slice(0,1),...qa('.ctx-b .ci').slice(0,4),...qa('.home .hsec').slice(0,2),...qa('.home .hh').slice(0,1)]
const clones=[]
for(const e of want){
const r=e.getBoundingClientRect()
if(r.width<20||r.height<10)continue
const c=e.cloneNode(true)
c.classList.add('rvc')
c.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;z-index:2147482000;backface-visibility:visible;transform-origin:50% 50%;background:${getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'?'var(--panel)':getComputedStyle(e).backgroundColor};border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5)`
lay.append(c);clones.push(c)
e.style.visibility='hidden'
}
fall(clones)
setTimeout(()=>lay.remove(),4500)
}
let running=false
async function sequence(clock,done){
if(running)return
running=true
await loadCss()
const quiet=still()
const o=h('div',{id:'rvlay',role:'status','aria-live':'polite'})
const stage=h('div',{class:'rvs'})
const cv=h('canvas',{class:'rvcv'})
o.append(cv,stage)
document.body.append(o)
let stopFw=null,cur=null,did={}
const at=(t,k,fn)=>{if(!did[k]&&clock()>=t){did[k]=1;fn()}}
const sh=document.querySelector('.shell')
const tick=()=>{
const t=clock()
for(const n of[3,2,1])at(-n*1000,'d'+n,()=>{if(cur)cur.remove();cur=digit(n);stage.append(cur);cur.classList.add('rvin')})
at(0,'go',async()=>{
if(cur){cur.classList.add('rvout');const x=cur;setTimeout(()=>x.remove(),600)}
const b=banner();stage.append(b)
o.classList.add('rvgo')
if(!quiet)stopFw=fireworks(cv)
if(sh){
document.documentElement.classList.add('rvx-out')
sh.classList.add('rvq')
if(!quiet)setTimeout(takeAway,250)
}
})
at(1800,'swap',async()=>{
await apply(true)
document.documentElement.classList.remove('rvx-out')
document.documentElement.classList.add('rvx-in')
qa('.rvc').forEach(e=>e.remove())
qa('.shell *').forEach(e=>{if(e.style.visibility==='hidden')e.style.visibility=''})
})
at(8200,'fade',()=>o.classList.add('rvend'))
if(t>=9000&&!did.rl){did.rl=1;flag('parley.rv.welcome','1');if(stopFw)stopFw();done?done():location.reload();return}
requestAnimationFrame(tick)
}
tick()
}
export function previewRestart(){
set(false)
apply(false)
const s=performance.now()
sequence(()=>performance.now()-s-3000,()=>{set(true);location.reload()})
}
function welcome(){
if(getFlag('parley.rv.welcome')!=='1')return
flag('parley.rv.welcome')
const p=h('div',{class:'rvw8'},h('b',null,'Welcome to Parley 2027'),h('span',null,'A fresh look, same people.'))
document.body.append(p)
setTimeout(()=>p.classList.add('out'),4200)
setTimeout(()=>p.remove(),5000)
}
let fired=false
export function startRevamp(){
if(document.documentElement.classList.contains('rv27'))setTimeout(welcome,900)
GET('/api/health').then(r=>{if(r&&r.time)skew=r.time-Date.now()}).catch(()=>{})
setInterval(()=>{
if(fired||running||get())return
const t=T0()
if(document.documentElement.classList.contains('rv27')){fired=true;return}
if(t>=-3000&&t<6000){fired=true;sequence(T0,()=>location.reload())}
else if(t>=6000&&!document.documentElement.classList.contains('rv27')){fired=true;flag('parley.rv.welcome','1');location.reload()}
},250)
}
