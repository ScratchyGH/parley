import{h,mount,icon,GET,PUT,POST,DEL,fail,confirmBox,dialog,ctxMenu,menu,toast,saveBlob,copyText,fmtRel,field}from'./util.js'
import{mergeGraphs}from'./gmerge.js'

const SVG='http://www.w3.org/2000/svg'
const sv=(tag,a)=>{const e=document.createElementNS(SVG,tag);for(const[k,v]of Object.entries(a||{}))e.setAttribute(k,v);return e}
const MODES=[['any','any message'],['contains','contains'],['equals','is exactly'],['starts','starts with']]
const OPS=[['contains','contains'],['notcontains','does not contain'],['equals','is'],['neq','is not'],['starts','starts with'],['ends','ends with'],['oneof','is one of (comma list)'],['gt','is more than'],['lt','is less than'],['empty','is empty'],['notempty','is not empty']]
export const DEFS={
msg:{title:'When a message is sent',tone:'trig',out:['next'],fields:[['mode','Message','select',MODES],['text','Text','text'],['ci','Ignore capital letters','check']],init:{mode:'contains',text:'hello',ci:'1'}},
cmd:{title:'When a command is typed',tone:'trig',out:['next'],fields:[['prefix','Starts with','text'],['name','Command','text']],init:{prefix:'!',name:'ping'}},
if:{title:'If',tone:'logic',out:['yes','no'],fields:[['left','Value','text'],['op','Check','select',OPS],['right','Compare to','text']],init:{left:'{text}',op:'contains',right:''}},
chance:{title:'Random chance',tone:'logic',out:['yes','no'],fields:[['percent','Percent chance','text']],init:{percent:'50'}},
say:{title:'Send a message',tone:'act',out:['next'],fields:[['text','Message','area'],['reply','Reply to the message','check']],init:{text:'Hello {user}!',reply:'0'}},
react:{title:'Add a reaction',tone:'act',out:['next'],fields:[['emoji','Emoji','text']],init:{emoji:'👍'}},
pick:{title:'Pick random text',tone:'data',out:['next'],fields:[['name','Save as','text'],['options','One option per line','area']],init:{name:'choice',options:'Yes\nNo\nMaybe'}},
set:{title:'Set a variable',tone:'data',out:['next'],fields:[['name','Name','text'],['value','Value','text']],init:{name:'greeting',value:'Hi'}},
count:{title:'Add to a saved counter',tone:'data',out:['next'],fields:[['name','Counter','text'],['by','Add','text'],['scope','For','select',[['server','whole server'],['user','each member']]]],init:{name:'count',by:'1',scope:'server'}},
mention:{title:'When the bot is mentioned',tone:'trig',out:['next'],fields:[],init:{}},
join:{title:'When someone joins',tone:'trig',out:['next'],fields:[],init:{}},
link:{title:'When a message has a link',tone:'trig',out:['next'],fields:[],init:{}},
image:{title:'When a message has an attachment',tone:'trig',out:['next'],fields:[],init:{}},
ismod:{title:'Is a moderator?',tone:'logic',out:['yes','no'],fields:[],init:{}},
hasrole:{title:'Has a role?',tone:'logic',out:['yes','no'],fields:[['role','Role name','text']],init:{role:''}},
time:{title:'Time of day (UTC hours)',tone:'logic',out:['yes','no'],fields:[['from','From hour','text'],['to','To hour','text']],init:{from:'0',to:'23'}},
cooldown:{title:'Cooldown',tone:'logic',out:['yes','no'],fields:[['seconds','Seconds','text'],['scope','For','select',[['server','whole server'],['user','each member']]]],init:{seconds:'30',scope:'user'}},
once:{title:'First time only',tone:'logic',out:['yes','no'],fields:[],init:{}},
sayto:{title:'Send to a channel',tone:'act',out:['next'],fields:[['channel','Channel name','text'],['text','Message','area']],init:{channel:'general',text:'Hello!'}},
delete:{title:'Delete the message',tone:'mod',out:['next'],fields:[],init:{}},
pin:{title:'Pin the message',tone:'mod',out:['next'],fields:[],init:{}},
timeout:{title:'Time out the member',tone:'mod',out:['next'],fields:[['minutes','Minutes','text']],init:{minutes:'5'}},
addrole:{title:'Give a role',tone:'mod',out:['next'],fields:[['role','Role name','text']],init:{role:''}},
removerole:{title:'Take a role',tone:'mod',out:['next'],fields:[['role','Role name','text']],init:{role:''}},
stop:{title:'Stop here',tone:'logic',out:[],fields:[],init:{}},
setcount:{title:'Set a saved counter',tone:'data',out:['next'],fields:[['name','Counter','text'],['value','Value','text'],['scope','For','select',[['server','whole server'],['user','each member']]]],init:{name:'count',value:'0',scope:'server'}},
math:{title:'Do maths',tone:'data',out:['next'],fields:[['name','Save as','text'],['a','First number','text'],['op','Operation','select',[['+','add'],['-','subtract'],['*','multiply'],['/','divide'],['%','remainder'],['max','larger of'],['min','smaller of']]],['b','Second number','text']],init:{name:'result',a:'1',op:'+',b:'1'}},
text:{title:'Change text',tone:'data',out:['next'],fields:[['name','Save as','text'],['input','Text','text'],['fn','Do','select',[['upper','UPPERCASE'],['lower','lowercase'],['title','Title Case'],['trim','Trim spaces'],['length','Count characters'],['reverse','Reverse'],['first','First word'],['last','Last word'],['replace','Remove text'],['words','Count words']]],['arg','Text to remove','text']],init:{name:'result',input:'{text}',fn:'upper',arg:''}},
randnum:{title:'Random number',tone:'data',out:['next'],fields:[['name','Save as','text'],['min','Lowest','text'],['max','Highest','text']],init:{name:'roll',min:'1',max:'6'}},
map:{title:'Look up a value',tone:'data',out:['next'],fields:[['name','Save as','text'],['input','Look up','text'],['table','One key=value per line','area'],['fallback','If not found','text']],init:{name:'result',input:'{arg1}',table:'a=Apple\nb=Banana',fallback:'Unknown'}}
}
Object.assign(DEFS,{
gate:{title:'On/off switch',tone:'logic',out:['yes','no'],fields:[['on','Switch','select',[['1','on'],['0','off']]]],init:{on:'1'}},
switch:{title:'Choose a path',tone:'logic',out:['c1','c2','c3','c4','else'],fields:[['input','Look at','text'],['v1','Path 1 when equal to','text'],['v2','Path 2 when equal to','text'],['v3','Path 3 when equal to','text'],['v4','Path 4 when equal to','text']],init:{input:'{arg1}',v1:'',v2:'',v3:'',v4:''}},
sub:{title:'Subflow starts here',tone:'sub',out:['next'],fields:[['name','Subflow name','text']],init:{name:'shared'}},
call:{title:'Run a subflow',tone:'sub',out:['next'],fields:[['name','Subflow name','text']],init:{name:'shared'}},
hook:{title:'When a webhook arrives',tone:'trig',out:['next'],fields:[['name','Hook name','text']],init:{name:'alert'}},
note:{title:'Note',tone:'note',out:[],fields:[['text','Note','area']],init:{text:''}}
})
const OUTL={next:'then',yes:'yes',no:'no',c1:'path 1',c2:'path 2',c3:'path 3',c4:'path 4',else:'otherwise'}
const GROUPS=[['Triggers',['msg','cmd','mention','join','link','image','hook']],['Logic',['if','gate','switch','chance','ismod','hasrole','time','cooldown','once','stop']],['Subflows and notes',['sub','call','note']],['Actions',['say','sayto','react']],['Moderation',['delete','pin','timeout','addrole','removerole']],['Data',['pick','set','count','setcount','math','text','randnum','map']]]
const T=(nodes,edges)=>({nodes,edges})
const N=(id,type,x,y,p)=>({id,type,x,y,p:{...DEFS[type].init,...p}})
const E=(f,o,t)=>({f,o,t})
const STARTERS=[
['Ping and pong',T([N('a','cmd',40,40,{name:'ping'}),N('b','say',340,40,{text:'Pong, {user}!',reply:'1'})],[E('a','next','b')])],
['Magic 8-ball',T([N('a','cmd',40,40,{name:'8ball'}),N('b','pick',340,40,{name:'answer',options:'Yes\nNo\nAsk again later\nDefinitely\nNot a chance'}),N('c','say',640,40,{text:'{mention} asked "{args}". The ball says: {answer}',reply:'0'})],[E('a','next','b'),E('b','next','c')])],
['Coin flip',T([N('a','cmd',40,40,{name:'flip'}),N('b','chance',340,40,{percent:'50'}),N('c','say',640,0,{text:'Heads!',reply:'1'}),N('d','say',640,170,{text:'Tails!',reply:'1'})],[E('a','next','b'),E('b','yes','c'),E('b','no','d')])],
['Greeter',T([N('a','msg',40,40,{mode:'contains',text:'hello',ci:'1'}),N('b','react',340,40,{emoji:'👋'}),N('c','say',640,40,{text:'Hey {user}, welcome!',reply:'1'})],[E('a','next','b'),E('b','next','c')])],
['Counter',T([N('a','cmd',40,40,{name:'count'}),N('b','count',340,40,{name:'uses',by:'1'}),N('c','say',640,40,{text:'This command has been used {uses} times.',reply:'0'})],[E('a','next','b'),E('b','next','c')])],
['Welcome new members',T([N('a','join',40,40,{}),N('b','sayto',340,40,{channel:'general',text:'Welcome to {server}, {mention}!'})],[E('a','next','b')])],
['Link filter',T([N('a','link',40,40,{}),N('b','hasrole',340,40,{role:'Trusted'}),N('c','delete',640,170,{}),N('d','say',940,170,{text:'{mention} links are not allowed here.',reply:'0'})],[E('a','next','b'),E('b','no','c'),E('c','next','d')])],
['Dice roller',T([N('a','cmd',40,40,{name:'roll'}),N('b','randnum',340,40,{name:'dice',min:'1',max:'6'}),N('c','say',640,40,{text:'{mention} rolled a {dice}.',reply:'0'})],[E('a','next','b'),E('b','next','c')])],
['Cooldown command',T([N('a','cmd',40,40,{name:'daily'}),N('b','cooldown',340,40,{seconds:'86400',scope:'user'}),N('c','count',640,0,{name:'streak',by:'1',scope:'user'}),N('d','say',940,0,{text:'Daily claimed! Total: {streak}',reply:'1'}),N('e','say',640,200,{text:'Come back later.',reply:'1'})],[E('a','next','b'),E('b','yes','c'),E('c','next','d'),E('b','no','e')])]
]
const uid=()=>'n'+Math.random().toString(36).slice(2,8)

export async function blocksEditor(p){
let g={nodes:[],edges:[]},rev=0
const role=p.mine?'owner':p.role||'viewer'
const canEdit=role!=='viewer'
let branch=null
try{const d=await GET(`/api/bothub/${p.id}/blocks`);if(d.blocks)g=d.blocks;rev=d.rev||0}catch(e){return h('div',{class:'err',style:{padding:'24px'}},e.message)}
let pending=null,dirty=false,ran=new Set(),warns=[],saving=false
const sel=new Set()
const canvas=h('div',{class:'bk-canvas'})
const wires=sv('svg',{class:'bk-wires'})
const cursors=h('div',{class:'bk-cursors'})
const stage=h('div',{class:'bk-stage'},wires,canvas,cursors)
const status=h('span',{class:'hint',role:'status'})
const peers=h('div',{class:'bk-peers'})
let auto=true
try{auto=localStorage.getItem('bk_auto')!=='0'}catch{}
const setStatus=t=>{status.textContent=t}
const els=new Map()
const ver=()=>branch?`Branch “${branch.name}”`:'Main'
let autoT
const mark=()=>{
if(!canEdit)return
dirty=true;setStatus('Unsaved changes')
clearTimeout(autoT)
if(auto)autoT=setTimeout(()=>save(true),2500)
}
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
if(!port)return null
const a=port.getBoundingClientRect(),b=canvas.getBoundingClientRect()
return[a.left-b.left+a.width/2,a.top-b.top+a.height/2]
}
function wire(){
while(wires.firstChild)wires.firstChild.remove()
for(const e of g.edges){
const a=anchor(e.f,e.o),b=inPoint(e.t)
if(!a||!b)continue
const dx=Math.max(40,Math.abs(b[0]-a[0])/2)
wires.append(sv('path',{d:`M${a[0]},${a[1]} C${a[0]+dx},${a[1]} ${b[0]-dx},${b[1]} ${b[0]},${b[1]}`,class:'bk-wire'+(ran.has(e.t)&&ran.has(e.f)?' ran':'')}))
}
}
const warnFor=id=>warns.filter(w=>w.id===id)
function fieldEl(n,f){
const[k,label,kind,opts]=f
const set=v=>{n.p[k]=v;mark()}
let c
const dis=!canEdit
if(kind==='select')c=h('select',{class:'inp',disabled:dis,'aria-label':label,on:{change:e=>set(e.target.value)}},opts.map(([v,t])=>h('option',{value:v,selected:n.p[k]===v},t)))
else if(kind==='area')c=h('textarea',{class:'inp',rows:3,maxLength:1500,disabled:dis,'aria-label':label,on:{input:e=>set(e.target.value)}},n.p[k])
else if(kind==='check')return h('label',{class:'bk-check'},h('input',{type:'checkbox',disabled:dis,checked:n.p[k]==='1',on:{change:e=>set(e.target.checked?'1':'0')}}),label)
else c=h('input',{class:'inp',value:n.p[k],maxLength:200,disabled:dis,'aria-label':label,on:{input:e=>set(e.target.value)}})
return h('label',{class:'bk-f'},h('span',null,label),c)
}
const isEntry=t=>DEFS[t].tone==='trig'||DEFS[t].tone==='sub'||DEFS[t].tone==='note'
function removeNodes(ids){
g.nodes=g.nodes.filter(x=>!ids.has(x.id));g.edges=g.edges.filter(e=>!ids.has(e.f)&&!ids.has(e.t));sel.clear();mark();draw()
}
const uid=()=>'n'+Math.random().toString(36).slice(2,8)
function dup(ids){
const map=new Map(),made=[]
for(const n of g.nodes)if(ids.has(n.id)){const c=JSON.parse(JSON.stringify(n));c.id=uid();c.x+=30;c.y+=30;map.set(n.id,c.id);made.push(c)}
if(g.nodes.length+made.length>100){toast('A bot can have up to 100 blocks','err');return}
g.nodes.push(...made)
for(const e of [...g.edges])if(map.has(e.f)&&map.has(e.t))g.edges.push({f:map.get(e.f),o:e.o,t:map.get(e.t)})
sel.clear();for(const c of made)sel.add(c.id)
mark();draw()
}
function describe(n){
const d=dialog('Describe this block',h('div',{class:'bd'},field('Description',h('textarea',{class:'inp',rows:3,maxLength:200,id:'bkd',autofocus:true},n.d||''),'Shown under the block title so teammates know what it does.')),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),h('button',{class:'btn pri',on:{click:()=>{const v=d.el.querySelector('#bkd').value.trim().slice(0,200);if(v)n.d=v;else delete n.d;mark();draw();close()}}},'Save')]})
}
function nodeEl(n){
const d=DEFS[n.type]
const w=warnFor(n.id)
const head=h('div',{class:'bk-h '+d.tone},h('span',null,d.title),canEdit?h('button',{type:'button',class:'ib',title:'Delete block','aria-label':'Delete block',on:{click:()=>removeNodes(new Set([n.id]))}},icon('x','s')):null)
const el=h('div',{class:'bk-n'+(ran.has(n.id)?' ran':'')+(sel.has(n.id)?' sel':'')+(pending&&!isEntry(n.type)?' target':'')+(w.some(x=>x.level==='error')?' bad':w.length?' warn':''),'data-id':n.id,style:{left:n.x+'px',top:n.y+'px'}},
isEntry(n.type)?null:h('button',{type:'button',class:'bk-in',title:'Connect here','aria-label':'Connect here',on:{click:()=>{
if(!pending||!canEdit)return
g.edges=g.edges.filter(e=>!(e.f===pending.id&&e.o===pending.o))
if(pending.id!==n.id)g.edges.push({f:pending.id,o:pending.o,t:n.id})
pending=null;mark();draw()
}}}),
head,n.d?h('div',{class:'bk-d'},n.d):null,
w.length?h('div',{class:'bk-w'},w.map(x=>h('div',{class:x.level},x.msg))):null,
h('div',{class:'bk-b'},d.fields.map(f=>fieldEl(n,f))),
d.out.length?h('div',{class:'bk-o'},d.out.map(o=>h('button',{type:'button','data-out':o,disabled:!canEdit,class:'bk-out'+(pending&&pending.id===n.id&&pending.o===o?' on':'')+(g.edges.some(e=>e.f===n.id&&e.o===o)?' used':''),title:'Click, then click the input dot of another block. Click again on a connected output to remove it.','aria-label':'Output '+(OUTL[o]||o),on:{click:()=>{
const had=g.edges.some(e=>e.f===n.id&&e.o===o)
if(had&&!pending){g.edges=g.edges.filter(e=>!(e.f===n.id&&e.o===o));mark();draw();return}
pending=pending&&pending.id===n.id&&pending.o===o?null:{id:n.id,o};draw()
}}},OUTL[o]||o))):null)
el.addEventListener('contextmenu',e=>{
if(!canEdit)return
if(!sel.has(n.id)){sel.clear();sel.add(n.id)}
const ids=new Set(sel)
ctxMenu(e,[
{label:ids.size>1?`Duplicate ${ids.size} blocks`:'Duplicate',icon:'copy',fn:()=>dup(ids)},
{label:'Describe…',fn:()=>describe(n)},
d.out.length&&g.edges.some(x=>x.f===n.id)?{label:'Disconnect outputs',fn:()=>{g.edges=g.edges.filter(x=>x.f!==n.id);mark();draw()}}:null,
g.edges.some(x=>x.t===n.id)?{label:'Disconnect inputs',fn:()=>{g.edges=g.edges.filter(x=>x.t!==n.id);mark();draw()}}:null,
'-',
{label:ids.size>1?`Delete ${ids.size} blocks`:'Delete',danger:true,icon:'trash',fn:()=>removeNodes(ids)}])
})
el.addEventListener('pointerdown',e=>{
if(e.target.closest('button,input,select,textarea,label'))return
if(e.shiftKey||e.ctrlKey||e.metaKey){sel.has(n.id)?sel.delete(n.id):sel.add(n.id)}else if(!sel.has(n.id)){sel.clear();sel.add(n.id)}
for(const[id,x]of els)x.classList.toggle('sel',sel.has(id))
})
let sx,sy,orig,drag=false
head.addEventListener('pointerdown',e=>{
if(e.target.closest('button')||!canEdit)return
drag=true;sx=e.clientX;sy=e.clientY
orig=new Map(g.nodes.filter(x=>sel.has(x.id)||x===n).map(x=>[x,[x.x,x.y]]))
head.setPointerCapture(e.pointerId)
})
head.addEventListener('pointermove',e=>{
if(!drag)return
for(const[x,[ox,oy]]of orig){
x.x=Math.max(0,Math.round(ox+e.clientX-sx));x.y=Math.max(0,Math.round(oy+e.clientY-sy))
const t=els.get(x.id);if(t){t.style.left=x.x+'px';t.style.top=x.y+'px'}
}
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
mount(canvas,g.nodes.map(nodeEl),h('div',{class:'bk-empty',hidden:g.nodes.length>0},'Add blocks from the left, or start from a template.'))
requestAnimationFrame(wire)
}
function add(type,x,y){
if(g.nodes.length>=100){toast('A bot can have up to 100 blocks','err');return}
const col=g.nodes.length
g.nodes.push({id:uid(),type,x:x??40+(col%4)*300,y:y??40+Math.floor(col/4)*260,p:{...DEFS[type].init}})
mark();draw()
}
stage.addEventListener('contextmenu',e=>{
if(e.target.closest('.bk-n')||!canEdit)return
const r=canvas.getBoundingClientRect(),x=Math.max(0,Math.round(e.clientX-r.left)),y=Math.max(0,Math.round(e.clientY-r.top))
ctxMenu(e,[...GROUPS.flatMap(([t,ids])=>[{head:t},...ids.map(id=>({label:DEFS[id].title,fn:()=>add(id,x,y)}))]),'-',{label:'Select all blocks',fn:()=>{g.nodes.forEach(n=>sel.add(n.id));draw()}},{label:'Clear selection',fn:()=>{sel.clear();draw()}}])
})
stage.addEventListener('pointerdown',e=>{if(e.target===stage||e.target===canvas||e.target===wires){if(sel.size){sel.clear();for(const x of els.values())x.classList.remove('sel')}}})
stage.addEventListener('keydown',e=>{
if(!canEdit||e.target.closest('input,textarea,select'))return
if((e.key==='Delete'||e.key==='Backspace')&&sel.size){e.preventDefault();removeNodes(new Set(sel))}
if((e.ctrlKey||e.metaKey)&&e.key==='d'&&sel.size){e.preventDefault();dup(new Set(sel))}
})
stage.tabIndex=0

const palette=h('div',{class:'bk-pal'},canEdit?GROUPS.map(([t,ids])=>h('div',null,h('h5',null,t),ids.map(id=>h('button',{type:'button',class:'btn sm bk-add '+DEFS[id].tone,on:{click:()=>add(id)}},icon('plus','s'),DEFS[id].title)))):h('p',{class:'hint'},'You can view and test this bot. Ask the owner for the editor role to change it.'),
canEdit?h('div',null,h('h5',null,'Examples'),STARTERS.map(([n,gr])=>h('button',{type:'button',class:'btn sm',on:{click:async()=>{
if(g.nodes.length&&!await confirmBox('Replace your blocks?','The example replaces what is on the canvas.','Replace',true))return
g=JSON.parse(JSON.stringify(gr));pending=null;ran=new Set();mark();draw()
}}},n))):null,
h('p',{class:'hint'},'Text fields accept {user}, {username}, {mention}, {args}, {arg1}, {text}, {channel}, {server} and any variable you set. Right-click a block or the canvas for more.'))
const out=h('div',{class:'bk-out-log'})
const probe=h('input',{class:'inp',placeholder:'Type a test message, for example !ping',maxLength:200,'aria-label':'Test message'})
async function test(event,hook){
mount(out)
try{
const r=await POST(`/api/bothub/${p.id}/blocks/test`,{blocks:g.nodes.length?g:null,text:probe.value,event,hook})
ran=new Set(r.log.map(x=>x.id))
warns=r.warnings||warns
draw()
mount(out,r.sent.length?r.sent.map(s=>h('div',{class:'bk-line'},s.say!==undefined?(s.reply?'Replies: ':'Says: ')+s.say:'Reacts: '+s.react)):h('div',{class:'hint'},r.log.length?'Ran with nothing to send.':'No trigger matched that message.'),r.warnings?.length?h('div',{class:'hint'},r.warnings.length+' thing(s) to check, shown on the blocks.'):null)
}catch(e){out.textContent=e.message}
}
async function save(quiet){
if(!canEdit||saving)return
clearTimeout(autoT)
saving=true;setStatus('Saving…')
try{
if(branch){
await PUT(`/api/bothub/${p.id}/branches/${branch.id}`,{blocks:g.nodes.length?g:null})
dirty=false;setStatus(`Saved to branch “${branch.name}”.`)
}else{
const r=await PUT(`/api/bothub/${p.id}/blocks`,{blocks:g.nodes.length?g:null,base_rev:rev})
rev=r.rev??rev
if(r.blocks&&!quiet){g=r.blocks;draw()}
dirty=false;setStatus(quiet?'Saved automatically.':'Saved. Your bot runs this in every server where it is added.')
}
validate()
}catch(e){
if(e.status===409&&e.data?.conflict)await conflict(e.data)
else if(quiet)setStatus('Could not save: '+e.message)
else fail(e)
}finally{saving=false}
}
async function conflict(d){
const theirs=d.blocks,rv=d.rev
const base=lastSaved
const res=mergeGraphs(base,g,theirs,{})
if(!res.conflicts.length){
g=res.graph;rev=rv;lastSaved=JSON.parse(JSON.stringify(theirs));draw();toast('Merged with changes a teammate saved','ok');await save(true);return}
const pick={}
await new Promise(done=>{
const rows=res.conflicts.map(c=>{
const nm=x=>x?(c.kind==='node'?(DEFS[x.type]?.title||x.type)+' · '+Object.values(x.p||{}).filter(Boolean).join(' / ').slice(0,60):x.f+' → '+x.t):'(removed)'
const grp='cf'+c.id
return h('div',{class:'bk-cf'},h('b',null,c.kind==='node'?'Block changed on both sides':'Connection changed on both sides'),
h('label',null,h('input',{type:'radio',name:grp,on:{change:()=>{pick[c.id]='mine'}}}),' Yours: '+nm(c.mine)),
h('label',null,h('input',{type:'radio',name:grp,on:{change:()=>{pick[c.id]='theirs'}}}),' Teammate: '+nm(c.theirs)))
})
dialog('A teammate saved changes first',h('div',{class:'bd'},h('p',null,'Some blocks changed on both sides. Pick which version to keep for each.'),rows),{sticky:true,onclose:()=>done(),footer:close=>[
h('button',{class:'btn',on:{click:()=>{close();g=JSON.parse(JSON.stringify(theirs));rev=rv;lastSaved=JSON.parse(JSON.stringify(theirs));draw();dirty=false;setStatus('Loaded the teammate’s version.');done()}}},'Use theirs'),
h('button',{class:'btn pri',on:{click:async()=>{
if(res.conflicts.some(c=>!pick[c.id])){toast('Pick one for each','err');return}
const m2=mergeGraphs(base,g,theirs,pick)
close();g=m2.graph;rev=rv;lastSaved=JSON.parse(JSON.stringify(theirs));draw();await save(true);done()
}}},'Keep my picks')]})
})
}
let lastSaved=JSON.parse(JSON.stringify(g))
const origSave=save
async function validate(){
try{const r=await POST(`/api/bothub/${p.id}/blocks/validate`,{blocks:g.nodes.length?g:null});warns=r.warnings||[];drawIssues();draw()}catch{}
}
const issues=h('div',{class:'bk-issues',hidden:true})
function drawIssues(){
issues.hidden=!warns.length
mount(issues,h('b',null,warns.length+(warns.length===1?' thing to check':' things to check')),warns.map(w=>h('div',{class:w.level},(w.level==='error'?'Problem: ':w.level==='warn'?'Check: ':'Note: ')+w.msg)))
}
// ---- dialogs
function templates(){
const box=h('div',{class:'bd bk-tpl'},h('p',{class:'hint'},'Loading templates…'))
const tdlg=dialog('Templates',box)
GET('/api/bothub/templates').then(d=>mount(box,d.templates.map(t=>h('div',{class:'bk-tr'},h('div',null,h('b',null,t.name),h('p',{class:'hint',style:{margin:'2px 0 0'}},t.summary)),canEdit?h('button',{class:'btn sm pri',on:{click:async e=>{
if(g.nodes.length&&!await confirmBox('Replace your blocks?','The template replaces what is on the canvas. Earlier saves stay in version history.','Replace',true))return
g=JSON.parse(JSON.stringify(t.blocks));ran=new Set();pending=null;mark();draw();tdlg.close()
}}},'Use'):null)))).catch(e=>mount(box,h('div',{class:'err'},e.message)))
}
async function versions(){
const box=h('div',{class:'bd'},h('p',{class:'hint'},'Loading…'))
const dlg=dialog('Version history',box)
try{
const d=await GET(`/api/bothub/${p.id}/versions`)
mount(box,d.versions.length?d.versions.map(v=>h('div',{class:'bk-tr'},h('div',null,h('b',null,'Version '+v.rev),h('p',{class:'hint',style:{margin:'2px 0 0'}},(v.summary||'Saved')+' · '+(v.author||'someone')+' · '+fmtRel(v.created_at))),
h('div',{class:'row'},h('button',{class:'btn sm',on:{click:async()=>{
try{const x=await GET(`/api/bothub/${p.id}/versions/${v.id}`);preview(x.version.blocks)}catch(e){fail(e)}
}}},'Preview'),canEdit?h('button',{class:'btn sm',on:{click:async()=>{
if(!await confirmBox('Restore version '+v.rev+'?','Your current blocks are saved in history first, so you can undo this.','Restore'))return
try{const r=await POST(`/api/bothub/${p.id}/versions/${v.id}/restore`);g=r.blocks||{nodes:[],edges:[]};rev=r.rev;lastSaved=JSON.parse(JSON.stringify(g));dirty=false;draw();setStatus('Restored version '+v.rev);dlg.close()}catch(e){fail(e)}
}}},'Restore'):null))):h('div',{class:'hint'},'No saved versions yet.'))
}catch(e){mount(box,h('div',{class:'err'},e.message))}
}
function preview(b){
const t=(b?.nodes||[]).map(n=>'• '+(DEFS[n.type]?.title||n.type)+(n.p?.name?' ('+n.p.name+')':n.p?.text?': '+String(n.p.text).slice(0,40):'')).join('\n')
dialog('Version preview',h('div',{class:'bd'},h('pre',{style:{whiteSpace:'pre-wrap',margin:0}},t||'Empty'),h('p',{class:'hint'},(b?.edges?.length||0)+' connections')))
}
async function branches(){
const box=h('div',{class:'bd'},h('p',{class:'hint'},'Loading…'))
const dlg=dialog('Branches',box)
async function load(){
try{
const d=await GET(`/api/bothub/${p.id}/branches`)
const name=h('input',{class:'inp',placeholder:'New branch name',maxLength:30,'aria-label':'Branch name'})
mount(box,h('p',{class:'hint'},'A branch is a private copy to experiment on. Merge it back when it works. You are editing: '+ver()+'.'),
branch?h('div',{class:'row'},h('button',{class:'btn',on:{click:async()=>{if(dirty)await save();branch=null;const m=await GET(`/api/bothub/${p.id}/blocks`);g=m.blocks||{nodes:[],edges:[]};rev=m.rev;lastSaved=JSON.parse(JSON.stringify(g));draw();dlg.close();setBranchLabel();setStatus('Back on main.')}}},'Switch to main')):null,
d.branches.map(b=>h('div',{class:'bk-tr'},h('div',null,h('b',null,b.name),h('p',{class:'hint',style:{margin:'2px 0 0'}},(b.author||'someone')+' · '+fmtRel(b.updated_at))),
h('div',{class:'row'},h('button',{class:'btn sm',on:{click:async()=>{
try{if(dirty)await save();const x=await GET(`/api/bothub/${p.id}/branches/${b.id}`);branch={id:b.id,name:b.name};g=x.branch.blocks||{nodes:[],edges:[]};draw();dlg.close();setBranchLabel();setStatus('Editing branch “'+b.name+'”.')}catch(e){fail(e)}
}}},'Open'),canEdit?h('button',{class:'btn sm pri',on:{click:()=>mergeBranch(b,dlg)}},'Merge into main'):null,canEdit?h('button',{class:'btn sm dng',on:{click:async()=>{if(!await confirmBox('Delete branch?','“'+b.name+'” and its changes will be removed.','Delete',true))return;try{await DEL(`/api/bothub/${p.id}/branches/${b.id}`);if(branch&&branch.id===b.id){branch=null;const m=await GET(`/api/bothub/${p.id}/blocks`);g=m.blocks||{nodes:[],edges:[]};rev=m.rev;draw();setBranchLabel()}load()}catch(e){fail(e)}}}},'Delete'):null))),
!d.branches.length?h('div',{class:'hint'},'No branches yet.'):null,
canEdit&&!branch?h('div',{class:'row'},name,h('button',{class:'btn pri',on:{click:async()=>{
try{if(dirty)await save();const r=await POST(`/api/bothub/${p.id}/branches`,{name:name.value.trim()});branch={id:r.id,name:r.name};g=r.blocks||{nodes:[],edges:[]};draw();dlg.close();setBranchLabel();setStatus('Editing branch “'+r.name+'”.')}catch(e){fail(e)}
}}},'Create from main')):null)
}catch(e){mount(box,h('div',{class:'err'},e.message))}
}
load()
}
async function mergeBranch(b,dlg){
if(dirty&&branch?.id===b.id)await save()
let pick={}
for(;;){
try{
const r=await POST(`/api/bothub/${p.id}/branches/${b.id}/merge`,{pick})
if(branch?.id===b.id){branch=null;setBranchLabel()}
g=r.blocks||{nodes:[],edges:[]};rev=r.rev;lastSaved=JSON.parse(JSON.stringify(g));dirty=false;draw();dlg.close();toast('Merged “'+b.name+'” into main','ok');return
}catch(e){
if(e.status===409&&e.data?.conflicts){
const cs=e.data.conflicts
const ok=await new Promise(res=>{
const np={}
const nm=x=>x?(x.f?x.f+' → '+x.t:(DEFS[x.type]?.title||x.type)+' · '+Object.values(x.p||{}).filter(Boolean).join(' / ').slice(0,60)):'(removed)'
dialog('Resolve conflicts',h('div',{class:'bd'},cs.map(c=>h('div',{class:'bk-cf'},h('b',null,c.kind==='node'?'Block changed on both sides':'Connection changed on both sides'),
h('label',null,h('input',{type:'radio',name:'m'+c.id,on:{change:()=>{np[c.id]='mine'}}}),' Branch: '+nm(c.mine)),
h('label',null,h('input',{type:'radio',name:'m'+c.id,on:{change:()=>{np[c.id]='theirs'}}}),' Main: '+nm(c.theirs))))),{sticky:true,footer:close=>[h('button',{class:'btn',on:{click:()=>{close();res(false)}}},'Cancel'),h('button',{class:'btn pri',on:{click:()=>{if(cs.some(c=>!np[c.id])){toast('Pick one for each','err');return}pick=np;close();res(true)}}},'Merge')]})
})
if(!ok)return
}else{fail(e);return}
}
}
}
function setBranchLabel(){bl.textContent=ver();bl.className='pill '+(branch?'warn':'')}
async function team(){
const box=h('div',{class:'bd'},h('p',{class:'hint'},'Loading…'))
const dlg=dialog('Team',box)
async function load(){
try{
const d=await GET(`/api/bothub/${p.id}/members`)
const un=h('input',{class:'inp',placeholder:'Username',maxLength:32,'aria-label':'Username'})
const rl=h('select',{class:'sel','aria-label':'Role',style:{width:'auto'}},[['viewer','Viewer — can view and test'],['editor','Editor — can change blocks'],['maintainer','Maintainer — also listing and releases']].map(([v,t])=>h('option',{value:v},t)))
const mine=d.role
mount(box,h('div',{class:'bk-tr'},h('div',null,h('b',null,d.owner.display_name),h('p',{class:'hint',style:{margin:'2px 0 0'}},'@'+d.owner.username+' · owner')),null),
d.members.map(m=>h('div',{class:'bk-tr'},h('div',null,h('b',null,m.display_name),h('p',{class:'hint',style:{margin:'2px 0 0'}},'@'+m.username+' · '+m.role+(m.status==='invited'?' (invited)':''))),
h('div',{class:'row'},
mine==='owner'&&m.status==='active'?h('button',{class:'btn sm',on:{click:async()=>{if(!await confirmBox('Transfer ownership?','@'+m.username+' becomes the owner. You stay as a maintainer.','Transfer',true))return;try{await POST(`/api/bothub/${p.id}/transfer`,{username:m.username});toast('Ownership transferred','ok');dlg.close();location.reload()}catch(e){fail(e)}}}},'Make owner'):null,
(mine==='owner'||(mine==='maintainer'&&m.role!=='maintainer'))?h('button',{class:'btn sm dng',on:{click:async()=>{try{await DEL(`/api/bothub/${p.id}/members/${m.user_id}`);load()}catch(e){fail(e)}}}},'Remove'):null))),
mine==='owner'||mine==='maintainer'?h('div',{class:'row'},un,rl,h('button',{class:'btn pri',on:{click:async()=>{try{await POST(`/api/bothub/${p.id}/members`,{username:un.value.trim(),role:rl.value});toast('Invitation sent','ok');load()}catch(e){fail(e)}}}},'Invite')):null,
mine!=='owner'?h('button',{class:'btn dng',on:{click:async()=>{if(!await confirmBox('Leave this project?','You lose access until invited again.','Leave',true))return;try{await DEL(`/api/bothub/${p.id}/members/${myId}`);dlg.close();location.href='/lab'}catch(e){fail(e)}}}},'Leave project'):null)
}catch(e){mount(box,h('div',{class:'err'},e.message))}
}
load()
}
async function exportJson(){
try{
const d=await GET(`/api/bothub/${p.id}/export`)
d.blocks=g.nodes.length?g:null
saveBlob(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),(p.slug||'bot')+'-blocks.json')
}catch(e){fail(e)}
}
function importJson(){
const inp=h('input',{type:'file',accept:'application/json,.json'})
inp.addEventListener('change',async()=>{
const f=inp.files[0];if(!f)return
if(f.size>200000){toast('That file is too large','err');return}
try{
const d=JSON.parse(await f.text())
const b=d.format==='parley-bot-blocks'?d.blocks:d
if(!b||!Array.isArray(b.nodes)||!Array.isArray(b.edges))throw new Error('That file does not contain Parley blocks')
if(g.nodes.length&&!await confirmBox('Replace your blocks?','The import replaces the canvas. Earlier saves stay in version history.','Import',true))return
g=b;ran=new Set();mark();draw();await validate()
if(warns.some(w=>w.level==='error'))toast('Imported, but some blocks have problems','err')
}catch(e){fail(e)}
})
inp.click()
}
async function hookDialog(){
const box=h('div',{class:'bd'},h('p',{class:'hint'},'Loading…'))
dialog('Webhook',box)
try{
const d=await GET(`/api/bothub/${p.id}/hook`)
const show=k=>mount(box,h('p',null,'Outside services can start a “When a webhook arrives” block by sending a POST request. The text they send is available as {text}.'),
k?h('pre',{style:{whiteSpace:'pre-wrap',wordBreak:'break-all'}},`POST ${location.origin}/api/hooks/bot/${p.id}/HOOKNAME?key=${k}\n{"text":"Something happened"}`):h('p',{class:'hint'},'No key yet.'),
h('div',{class:'row'},k?h('button',{class:'btn',on:{click:()=>copyText(`${location.origin}/api/hooks/bot/${p.id}/HOOKNAME?key=${k}`)}},'Copy URL'):null,h('button',{class:'btn '+(k?'':'pri'),on:{click:async()=>{if(k&&!await confirmBox('Make a new key?','The old URL stops working immediately.','Make new key',true))return;try{show((await POST(`/api/bothub/${p.id}/hook`)).key)}catch(e){fail(e)}}}},k?'Make a new key':'Create key')),
h('p',{class:'hint'},'Anyone with the URL can trigger the hook, so keep it private. It runs in every server where the bot is added.'))
show(d.key)
}catch(e){mount(box,h('div',{class:'err'},e.message))}
}
// ---- live collaboration
let ws,wsRetry=0,closed=false
const people=new Map()
function drawPeers(){mount(peers,[...people.values()].filter(x=>x.here).map(x=>h('span',{class:'bk-peer',title:x.name,style:{'--c':x.c}},(x.name||'?').slice(0,1).toUpperCase())))}
const colorOf=id=>{let n=0;for(const ch of id)n=(n*31+ch.charCodeAt(0))>>>0;return`hsl(${n%360} 70% 55%)`}
const curEls=new Map()
function connect(){
if(closed||!document.body.contains(stage)&&wsRetry>0)return
try{
ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws?room=bw_${p.id}`)
}catch{return}
ws.onopen=()=>{wsRetry=0}
ws.onmessage=async ev=>{
let m;try{m=JSON.parse(ev.data)}catch{return}
if(m.t==='bw.cursor'){
let c=curEls.get(m.uid)
if(!c){c=h('div',{class:'bk-cur',style:{'--c':colorOf(m.uid)}},h('i'),h('span',null,people.get(m.uid)?.name||'Teammate'));cursors.append(c);curEls.set(m.uid,c)}
c.style.transform=`translate(${m.x}px,${m.y}px)`
clearTimeout(c._t);c._t=setTimeout(()=>{c.remove();curEls.delete(m.uid)},6000)
}else if(m.t==='bot.blocks'&&!branch){
if(m.by===myId)return
people.set(m.by,{...(people.get(m.by)||{}),name:m.name,here:true,c:colorOf(m.by)});drawPeers()
if(!dirty){try{const d=await GET(`/api/bothub/${p.id}/blocks`);g=d.blocks||{nodes:[],edges:[]};rev=d.rev;lastSaved=JSON.parse(JSON.stringify(g));draw();setStatus(m.name+' saved changes: '+(m.summary||'updated'))}catch{}}
else setStatus(m.name+' saved changes. Yours merge when you save.')
}else if(m.t==='ready'||m.t==='hello'){}
}
ws.onclose=()=>{if(closed||!document.body.contains(stage)){return}wsRetry++;setTimeout(connect,Math.min(30000,1000*2**Math.min(wsRetry,5)))}
}
let myId=''
GET('/api/me').then(d=>{myId=d.user.id}).catch(()=>{})
let lastCur=0
stage.addEventListener('pointermove',e=>{
if(!ws||ws.readyState!==1||Date.now()-lastCur<80)return
lastCur=Date.now()
const r=canvas.getBoundingClientRect()
ws.send(JSON.stringify({t:'bw.cursor',x:e.clientX-r.left,y:e.clientY-r.top,b:branch?branch.id:''}))
})
connect()
const bl=h('span',{class:'pill'},'Main')
const btn=(t,fn,cls='')=>h('button',{type:'button',class:'btn sm '+cls,on:{click:fn}},t)
const more=h('button',{type:'button',class:'btn sm',on:{click:e=>{
const r=e.currentTarget.getBoundingClientRect()
menu([
{label:'Templates…',fn:templates},
{label:'Version history…',fn:versions},
{label:'Branches…',fn:branches},
{label:'Team…',fn:team},
{label:'Webhook…',fn:hookDialog,disabled:role==='editor'||role==='viewer'},
'-',
{label:'Export blocks',fn:exportJson},
canEdit?{label:'Import blocks…',fn:importJson}:null,
{label:'Check blocks',fn:async()=>{await validate();toast(warns.length?warns.length+' thing(s) to check':'No problems found','ok')}}],r.left,r.bottom+4)
}}},'Project',icon('down','s'))
const autoBox=h('label',{class:'bk-check'},h('input',{type:'checkbox',checked:auto,on:{change:e=>{auto=e.target.checked;try{localStorage.setItem('bk_auto',auto?'1':'0')}catch{}}}}),'Autosave')
const bar=h('div',{class:'bk-bar bk-top-bar'},
canEdit?h('button',{class:'btn pri',on:{click:()=>save()}},'Save'):null,
h('button',{class:'btn',on:{click:()=>test()}},'Test'),
probe,
h('button',{class:'btn',on:{click:()=>test('join')}},'Test a join'),
h('button',{class:'btn',title:'Run the first webhook block with this text',on:{click:()=>{const n=g.nodes.find(x=>x.type==='hook');test('hook',n?.p.name||'alert')}}},'Test a webhook'),
bl,canEdit?autoBox:null,more,peers,h('div',{class:'grow'}),status)
draw()
validate()
const guard=e=>{if(!document.body.contains(stage)){removeEventListener('beforeunload',guard);closed=true;try{ws?.close()}catch{};return}if(dirty)e.preventDefault()}
addEventListener('beforeunload',guard)
addEventListener('resize',()=>requestAnimationFrame(wire))
setTimeout(()=>requestAnimationFrame(wire),150)
return h('div',{class:'bk-wrap'},h('div',{class:'bk-top'},h('h2',null,p.name+' blocks'),h('p',{class:'hint'},'Build how your bot reacts to messages. Connect blocks left to right. It runs inside servers where the bot is added from the Bot hub. It sees only messages sent in text channels where it can read and post.')),
bar,issues,
h('div',{class:'bk-main'},palette,h('div',{class:'bk-view'},stage)),out)
}
