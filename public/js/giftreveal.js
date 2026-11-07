import{h,GET,POST,icon,sleep,toast}from'./util.js'
import{gaming}from'./gamebar.js'
import{swatch,parIcon}from'./pars.js'
import{acornSvg as candySvg}from'./thicket.js'
import{sv,svg}from'./svg.js'
let busy=false
const shown=new Set()
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
const plate=()=>svg(260,'0 0 260 70',sv('defs',null,sv('linearGradient',{id:'gxp',x1:'0',y1:'0',x2:'0',y2:'1'},sv('stop',{offset:'0',['stop-color']:'#f3f4f6'}),sv('stop',{offset:'1',['stop-color']:'#9ca3af'})),sv('radialGradient',{id:'gxq',cx:'.5',cy:'.4',r:'.6'},sv('stop',{offset:'0',['stop-color']:'#e5e7eb'}),sv('stop',{offset:'1',['stop-color']:'#b6bcc6'}))),sv('ellipse',{cx:'130',cy:'38',rx:'126',ry:'28',fill:'#6b7280'}),sv('ellipse',{cx:'130',cy:'34',rx:'126',ry:'28',fill:'url(#gxp)'}),sv('ellipse',{cx:'130',cy:'36',rx:'92',ry:'18',fill:'url(#gxq)',stroke:'#cbd5e1','stroke-width':'2'}),sv('path',{d:'M20 30Q130 4 240 30',fill:'none',stroke:'#fff','stroke-opacity':'.8','stroke-width':'2','stroke-linecap':'round'}))
const dome=()=>svg(200,'0 0 200 150',sv('defs',null,sv('linearGradient',{id:'gxd',x1:'0',y1:'0',x2:'1',y2:'0'},sv('stop',{offset:'0',['stop-color']:'#9ca3af'}),sv('stop',{offset:'.35',['stop-color']:'#f9fafb'}),sv('stop',{offset:'.7',['stop-color']:'#cbd5e1'}),sv('stop',{offset:'1',['stop-color']:'#6b7280'}))),sv('path',{d:'M8 132Q8 36 100 36Q192 36 192 132Z',fill:'url(#gxd)',stroke:'#4b5563','stroke-width':'2'}),sv('rect',{x:'0',y:'130',width:'200',height:'12',rx:'6',fill:'url(#gxd)',stroke:'#4b5563','stroke-width':'2'}),sv('path',{d:'M26 112Q30 62 74 50',fill:'none',stroke:'#fff','stroke-opacity':'.85','stroke-width':'5','stroke-linecap':'round'}),sv('rect',{x:'92',y:'24',width:'16',height:'14',rx:'3',fill:'#9ca3af',stroke:'#4b5563','stroke-width':'2'}),sv('circle',{cx:'100',cy:'18',r:'11',fill:'url(#gxd)',stroke:'#4b5563','stroke-width':'2'}))
function item(g){
if(g.kind==='candy')return h('div',{class:'gx-item'},h('div',{class:'gx-cd'},candySvg(84)),h('b',null,g.label))
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
const dm=h('div',{class:'gx-dome'},dome(),h('i',{class:'gx-puff'}),h('i',{class:'gx-puff b'}),h('i',{class:'gx-puff c'}))
const stage=h('div',{class:'gx-stage'},h('div',{class:'gx-shadow'}),h('div',{class:'gx-plate'},plate()),it,dm)
const ok=h('button',{class:'btn pri gx-ok',on:{click:()=>{root.classList.add('gx-out');setTimeout(()=>{root.remove();done()},350)}}},'Nice!')
root.append(h('div',{class:'gx-glow'}),title,stage,ok)
document.body.append(root)
if(reduce()){root.classList.add('gx-calm','gx-rise');return}
const go=(ms,f)=>setTimeout(()=>{if(root.isConnected)f();else done()},ms)
root.classList.add('gx-drop')
go(900,()=>{root.classList.remove('gx-drop');dm.classList.add('gx-shake')})
go(2600,()=>{dm.classList.remove('gx-shake');dm.classList.add('gx-fling');root.classList.add('gx-rise')})
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
