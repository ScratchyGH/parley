import{h,GET,POST,icon,sleep,toast}from'./util.js'
import{gaming}from'./gamebar.js'
import{swatch,parIcon}from'./pars.js'
import{sv,svg}from'./svg.js'
let busy=false
const shown=new Set()
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
const bodyArt=()=>svg(200,'0 0 200 130',sv('defs',null,sv('linearGradient',{id:'gpb',x1:'0',y1:'0',x2:'1',y2:'1'},sv('stop',{offset:'0','stop-color':'#818cf8'}),sv('stop',{offset:'1','stop-color':'#3730a3'}))),sv('rect',{x:'20',y:'8',width:'160',height:'114',rx:'10',fill:'url(#gpb)'}),sv('rect',{x:'20',y:'8',width:'160',height:'18',rx:'6',fill:'#000','fill-opacity':'.28'}),sv('rect',{x:'91',y:'8',width:'18',height:'114',fill:'#fbbf24'}),sv('rect',{x:'91',y:'8',width:'18',height:'114',fill:'#fff','fill-opacity':'.18'}),sv('rect',{x:'20',y:'100',width:'160',height:'22',rx:'8',fill:'#000','fill-opacity':'.16'}))
const lidArt=()=>svg(200,'0 0 200 78',sv('defs',null,sv('linearGradient',{id:'gpl',x1:'0',y1:'0',x2:'0',y2:'1'},sv('stop',{offset:'0','stop-color':'#c7d2fe'}),sv('stop',{offset:'1','stop-color':'#6366f1'}))),sv('rect',{x:'10',y:'34',width:'180',height:'38',rx:'9',fill:'url(#gpl)'}),sv('rect',{x:'91',y:'34',width:'18',height:'38',fill:'#fbbf24'}),sv('path',{d:'M100 32C84 6 56 8 60 24c2 8 26 8 40 8z',fill:'none',stroke:'#fbbf24','stroke-width':'9','stroke-linejoin':'round'}),sv('path',{d:'M100 32c16-26 44-24 40-8-2 8-26 8-40 8z',fill:'none',stroke:'#f59e0b','stroke-width':'9','stroke-linejoin':'round'}),sv('circle',{cx:'100',cy:'32',r:'10',fill:'#fde68a',stroke:'#d97706','stroke-width':'3'}))
function box(){return h('div',{class:'gx-pr'},h('div',{class:'gx-pb'},bodyArt()),h('div',{class:'gx-lid'},lidArt()))}
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
