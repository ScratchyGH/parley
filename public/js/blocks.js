import{h,mount,icon,GET,PUT,POST,fail,confirmBox}from'./util.js'

const SVG='http://www.w3.org/2000/svg'
const sv=(tag,a)=>{const e=document.createElementNS(SVG,tag);for(const[k,v]of Object.entries(a||{}))e.setAttribute(k,v);return e}
const MODES=[['any','any message'],['contains','contains'],['equals','is exactly'],['starts','starts with']]
const OPS=[['contains','contains'],['equals','is'],['starts','starts with'],['ends','ends with'],['gt','is more than'],['lt','is less than'],['empty','is empty'],['notempty','is not empty']]
export const DEFS={
msg:{title:'When a message is sent',tone:'trig',out:['next'],fields:[['mode','Message','select',MODES],['text','Text','text'],['ci','Ignore capital letters','check']],init:{mode:'contains',text:'hello',ci:'1'}},
cmd:{title:'When a command is typed',tone:'trig',out:['next'],fields:[['prefix','Starts with','text'],['name','Command','text']],init:{prefix:'!',name:'ping'}},
if:{title:'If',tone:'logic',out:['yes','no'],fields:[['left','Value','text'],['op','Check','select',OPS],['right','Compare to','text']],init:{left:'{text}',op:'contains',right:''}},
chance:{title:'Random chance',tone:'logic',out:['yes','no'],fields:[['percent','Percent chance','text']],init:{percent:'50'}},
say:{title:'Send a message',tone:'act',out:['next'],fields:[['text','Message','area'],['reply','Reply to the message','check']],init:{text:'Hello {user}!',reply:'0'}},
react:{title:'Add a reaction',tone:'act',out:['next'],fields:[['emoji','Emoji','text']],init:{emoji:'👍'}},
pick:{title:'Pick random text',tone:'data',out:['next'],fields:[['name','Save as','text'],['options','One option per line','area']],init:{name:'choice',options:'Yes\nNo\nMaybe'}},
set:{title:'Set a variable',tone:'data',out:['next'],fields:[['name','Name','text'],['value','Value','text']],init:{name:'greeting',value:'Hi'}},
count:{title:'Add to a saved counter',tone:'data',out:['next'],fields:[['name','Counter','text'],['by','Add','text']],init:{name:'count',by:'1'}}
}
const GROUPS=[['Triggers',['msg','cmd']],['Logic',['if','chance']],['Actions',['say','react']],['Data',['pick','set','count']]]
const T=(nodes,edges)=>({nodes,edges})
const N=(id,type,x,y,p)=>({id,type,x,y,p:{...DEFS[type].init,...p}})
const E=(f,o,t)=>({f,o,t})
const STARTERS=[
['Ping and pong',T([N('a','cmd',40,40,{name:'ping'}),N('b','say',340,40,{text:'Pong, {user}!',reply:'1'})],[E('a','next','b')])],
['Magic 8-ball',T([N('a','cmd',40,40,{name:'8ball'}),N('b','pick',340,40,{name:'answer',options:'Yes\nNo\nAsk again later\nDefinitely\nNot a chance'}),N('c','say',640,40,{text:'{mention} asked "{args}". The ball says: {answer}',reply:'0'})],[E('a','next','b'),E('b','next','c')])],
['Coin flip',T([N('a','cmd',40,40,{name:'flip'}),N('b','chance',340,40,{percent:'50'}),N('c','say',640,0,{text:'Heads!',reply:'1'}),N('d','say',640,170,{text:'Tails!',reply:'1'})],[E('a','next','b'),E('b','yes','c'),E('b','no','d')])],
['Greeter',T([N('a','msg',40,40,{mode:'contains',text:'hello',ci:'1'}),N('b','react',340,40,{emoji:'👋'}),N('c','say',640,40,{text:'Hey {user}, welcome!',reply:'1'})],[E('a','next','b'),E('b','next','c')])],
['Counter',T([N('a','cmd',40,40,{name:'count'}),N('b','count',340,40,{name:'uses',by:'1'}),N('c','say',640,40,{text:'This command has been used {uses} times.',reply:'0'})],[E('a','next','b'),E('b','next','c')])]
]
const uid=()=>'n'+Math.random().toString(36).slice(2,8)

export async function blocksEditor(p){
let g={nodes:[],edges:[]}
try{const d=await GET(`/api/bothub/${p.id}/blocks`);if(d.blocks)g=d.blocks}catch(e){return h('div',{class:'err',style:{padding:'24px'}},e.message)}
let pending=null,dirty=false,ran=new Set()
const canvas=h('div',{class:'bk-canvas'})
const wires=sv('svg',{class:'bk-wires'})
const stage=h('div',{class:'bk-stage'},wires,canvas)
const status=h('span',{class:'hint'})
const mark=()=>{dirty=true;status.textContent='Unsaved changes'}
const els=new Map()
function anchor(id,o){
const el=els.get(id)
if(!el)return null
const port=el.querySelector(`[data-out="${o}"]`)
if(!port)return null
const a=port.getBoundingClientRect(),b=canvas.getBoundingClientRect()
return[a.left-b.left+a.width/2,a.top-b.top+a.height/2]
}
function inPoint(id){
const el=els.get(id)
if(!el)return null
const port=el.querySelector('.bk-in')
const a=port.getBoundingClientRect(),b=canvas.getBoundingClientRect()
return[a.left-b.left+a.width/2,a.top-b.top+a.height/2]
}
function wire(){
while(wires.firstChild)wires.firstChild.remove()
for(const e of g.edges){
const a=anchor(e.f,e.o),b=inPoint(e.t)
if(!a||!b)continue
const dx=Math.max(40,Math.abs(b[0]-a[0])/2)
const path=sv('path',{d:`M${a[0]},${a[1]} C${a[0]+dx},${a[1]} ${b[0]-dx},${b[1]} ${b[0]},${b[1]}`,class:'bk-wire'+(ran.has(e.t)&&ran.has(e.f)?' ran':'')})
wires.append(path)
}
}
function fieldEl(n,f){
const[k,label,kind,opts]=f
const set=v=>{n.p[k]=v;mark()}
let c
if(kind==='select')c=h('select',{class:'inp','aria-label':label,on:{change:e=>set(e.target.value)}},opts.map(([v,t])=>h('option',{value:v,selected:n.p[k]===v},t)))
else if(kind==='area')c=h('textarea',{class:'inp',rows:3,maxLength:1500,'aria-label':label,on:{input:e=>set(e.target.value)}},n.p[k])
else if(kind==='check')return h('label',{class:'bk-check'},h('input',{type:'checkbox',checked:n.p[k]==='1',on:{change:e=>set(e.target.checked?'1':'0')}}),label)
else c=h('input',{class:'inp',value:n.p[k],maxLength:200,'aria-label':label,on:{input:e=>set(e.target.value)}})
return h('label',{class:'bk-f'},h('span',null,label),c)
}
function nodeEl(n){
const d=DEFS[n.type]
const head=h('div',{class:'bk-h '+d.tone},h('span',null,d.title),h('button',{type:'button',class:'ib',title:'Delete block','aria-label':'Delete block',on:{click:()=>{g.nodes=g.nodes.filter(x=>x!==n);g.edges=g.edges.filter(e=>e.f!==n.id&&e.t!==n.id);mark();draw()}}},icon('x','s')))
const el=h('div',{class:'bk-n'+(ran.has(n.id)?' ran':'')+(pending&&d.tone!=='trig'?' target':''),'data-id':n.id,style:{left:n.x+'px',top:n.y+'px'}},
d.tone==='trig'?null:h('button',{type:'button',class:'bk-in',title:'Connect here','aria-label':'Connect here',on:{click:()=>{
if(!pending)return
g.edges=g.edges.filter(e=>!(e.f===pending.id&&e.o===pending.o))
if(pending.id!==n.id)g.edges.push({f:pending.id,o:pending.o,t:n.id})
pending=null;mark();draw()
}}}),
head,h('div',{class:'bk-b'},d.fields.map(f=>fieldEl(n,f))),
h('div',{class:'bk-o'},d.out.map(o=>h('button',{type:'button','data-out':o,class:'bk-out'+(pending&&pending.id===n.id&&pending.o===o?' on':'')+(g.edges.some(e=>e.f===n.id&&e.o===o)?' used':''),title:'Click, then click the input dot of another block. Click again on a connected output to remove it.','aria-label':'Output '+o,on:{click:()=>{
const had=g.edges.some(e=>e.f===n.id&&e.o===o)
if(had&&!pending){g.edges=g.edges.filter(e=>!(e.f===n.id&&e.o===o));mark();draw();return}
pending=pending&&pending.id===n.id&&pending.o===o?null:{id:n.id,o};draw()
}}},o==='next'?'then':o))))
let sx,sy,ox,oy,drag=false
head.addEventListener('pointerdown',e=>{
if(e.target.closest('button'))return
drag=true;sx=e.clientX;sy=e.clientY;ox=n.x;oy=n.y
head.setPointerCapture(e.pointerId)
})
head.addEventListener('pointermove',e=>{
if(!drag)return
n.x=Math.max(0,Math.round(ox+e.clientX-sx));n.y=Math.max(0,Math.round(oy+e.clientY-sy))
el.style.left=n.x+'px';el.style.top=n.y+'px'
requestAnimationFrame(wire)
})
head.addEventListener('pointerup',()=>{if(drag){drag=false;mark()}})
els.set(n.id,el)
return el
}
function draw(){
els.clear()
const w=Math.max(1200,...g.nodes.map(n=>n.x+300)),hh=Math.max(700,...g.nodes.map(n=>n.y+360))
canvas.style.width=w+'px';canvas.style.height=hh+'px'
wires.setAttribute('width',w);wires.setAttribute('height',hh)
mount(canvas,g.nodes.map(nodeEl),h('div',{class:'bk-empty',hidden:g.nodes.length>0},'Add blocks from the left, or start from an example.'))
requestAnimationFrame(wire)
}
function add(type){
const col=g.nodes.length
g.nodes.push({id:uid(),type,x:40+(col%4)*300,y:40+Math.floor(col/4)*260,p:{...DEFS[type].init}})
mark();draw()
}
const palette=h('div',{class:'bk-pal'},GROUPS.map(([t,ids])=>h('div',null,h('h5',null,t),ids.map(id=>h('button',{type:'button',class:'btn sm bk-add '+DEFS[id].tone,on:{click:()=>add(id)}},icon('plus','s'),DEFS[id].title)))),
h('h5',null,'Examples'),STARTERS.map(([n,gr])=>h('button',{type:'button',class:'btn sm',on:{click:async()=>{
if(g.nodes.length&&!await confirmBox('Replace your blocks?','The example replaces what is on the canvas.','Replace',true))return
g=JSON.parse(JSON.stringify(gr));pending=null;ran=new Set();mark();draw()
}}},n)),
h('p',{class:'hint'},'Text fields accept {user}, {username}, {mention}, {args}, {arg1}, {text}, {channel}, {server} and any variable you set.'))
const out=h('div',{class:'bk-out-log'})
const probe=h('input',{class:'inp',placeholder:'Type a test message, for example !ping',maxLength:200,'aria-label':'Test message'})
async function test(){
out.textContent=''
try{
const r=await POST(`/api/bothub/${p.id}/blocks/test`,{blocks:g,text:probe.value})
ran=new Set(r.log.map(x=>x.id))
draw()
mount(out,r.sent.length?r.sent.map(s=>h('div',{class:'bk-line'},s.say!==undefined?(s.reply?'Replies: ':'Says: ')+s.say:'Reacts: '+s.react)):h('div',{class:'hint'},r.log.length?'Ran with nothing to send.':'No trigger matched that message.'))
}catch(e){out.textContent=e.message}
}
async function save(){
try{
const r=await PUT(`/api/bothub/${p.id}/blocks`,{blocks:g.nodes.length?g:null})
if(r.blocks)g=r.blocks
dirty=false;status.textContent='Saved. Your bot runs this in every server where it is added.'
draw()
}catch(e){fail(e)}
}
const bar=h('div',{class:'bk-bar'},h('button',{class:'btn pri',on:{click:save}},'Save blocks'),probe,h('button',{class:'btn',on:{click:test}},'Test'),h('div',{class:'grow'}),status)
draw()
addEventListener('beforeunload',e=>{if(dirty)e.preventDefault()})
return h('div',{class:'bk-wrap'},h('div',{class:'bk-top'},h('h2',null,p.name+' blocks'),h('p',{class:'hint'},'Build how your bot reacts to messages. Connect blocks left to right. It runs inside servers where the bot is added from the Bot hub. It sees only messages sent in text channels where it can read and post.')),
h('div',{class:'bk-main'},palette,h('div',{class:'bk-view'},stage)),bar,out)
}
