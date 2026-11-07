import{h,GET,POST,icon,sleep,toast}from'./util.js'
import{gaming}from'./gamebar.js'
import{swatch,parIcon}from'./pars.js'
let busy=false
const shown=new Set()
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
const face=(c,r,z)=>h('i',{class:'gx-f '+c,style:{transform:`rotateX(${r[0]}deg) rotateY(${r[1]}deg) translateZ(${z}px)`}})
const sides=(c,z)=>[0,90,180,270].map(a=>face(c,[0,a],z))
function box(){
const bo=h('div',{class:'gx-box'},...sides('gx-side',70),face('gx-bot',[-90,0],70),face('gx-in',[-90,0],64))
const lid=h('div',{class:'gx-lid'},...sides('gx-lside',78),face('gx-ltop',[90,0],22),face('gx-lbot',[-90,0],22),h('div',{class:'gx-bow'},h('i'),h('i'),h('b')))
return h('div',{class:'gx-3d'},bo,lid)
}
function item(g){
if(g.kind==='pars')return h('div',{class:'gx-item'},parIcon(64),h('b',null,g.label))
if((g.kind==='bundle'||g.kind==='multi')&&g.items?.length){
const el=h('div',{class:'gx-item gx-multi'})
g.items.forEach((x,i)=>setTimeout(()=>{const n=h('div',{class:'gx-m'},h('div',{class:'gx-sw'},swatch({kind:x.kind,id:x.id,name:x.name,mb:0})||icon('gift')),h('b',null,x.name));i%2?el.prepend(n):el.append(n)},reduce()?0:2600+i*1100))
return el
}
if(g.kind==='bundle'||g.kind==='multi')return h('div',{class:'gx-item'},h('div',{class:'gx-big'},icon('gift')),h('b',null,g.label))
const sw=swatch({kind:g.kind,id:g.item_id,name:g.label,mb:0})
return h('div',{class:'gx-item'},sw?h('div',{class:'gx-sw'},sw):h('div',{class:'gx-big'},icon('gift')),h('b',null,g.label))
}
function play(g){
return new Promise(done=>{
const root=h('div',{class:'gx',role:'dialog','aria-label':'You received a gift'})
const title=h('div',{class:'gx-t'},h('b',null,g.from_name),g.kind==='multi'?' sent you '+(g.items?.length||'some')+' gifts':' sent you a gift')
const it=item(g)
const bx=box()
const stage=h('div',{class:'gx-stage'},h('div',{class:'gx-shadow'}),bx,it)
const ok=h('button',{class:'btn pri gx-ok',on:{click:()=>{root.classList.add('gx-out');setTimeout(()=>{root.remove();done()},350)}}},'Nice!')
root.append(h('div',{class:'gx-glow'}),title,stage,ok)
document.body.append(root)
if(reduce()){root.classList.add('gx-still');return}
const go=(ms,f)=>setTimeout(()=>{if(root.isConnected)f();else done()},ms)
root.classList.add('gx-drop')
go(900,()=>{root.classList.remove('gx-drop');bx.classList.add('gx-shake')})
go(2400,()=>{bx.classList.remove('gx-shake');root.classList.add('gx-open','gx-rise')})
go(3700,()=>root.classList.add('gx-fall'))
})
}
async function run(){
if(busy)return
if(gaming()){if(!told){told=true;toast('You got a gift. It will open when you finish playing.')}return}
told=false
busy=true
try{
for(let n=0;n<10;n++){
let r
try{r=await GET('/api/pars/gifts')}catch{break}
const list=(r.gifts||[]).filter(g=>!shown.has(g.id))
if(!list.length)break
for(const g of list){
shown.add(g.id)
try{await play(g)}catch(e){document.querySelectorAll('.gx').forEach(x=>x.remove())}
try{await POST('/api/pars/gifts/seen',{ids:[g.id]})}catch{}
await sleep(250)
}
}
}finally{busy=false}
}
let started=false,told=false
export function checkGifts(){
setTimeout(run,300)
if(started)return
started=true
setInterval(run,45000)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(run,300)})
addEventListener('focus',()=>setTimeout(run,300))
addEventListener('online',()=>setTimeout(run,1000))
}
export{play as previewGift}
