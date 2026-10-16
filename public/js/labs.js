import{h,mount,GET,POST,fail,toast,field}from'./util.js'
import{S,loadServer}from'./state.js'

let frame=null,loaded=null,puterOn=false,seq=0
const waiting=new Map()
let puterNote=()=>{}

function bridge(host){
if(!frame){
frame=h('iframe',{src:'/lab/puter',title:'Puter connection',class:'puterframe'})
loaded=new Promise(r=>frame.addEventListener('load',()=>r()))
addEventListener('message',e=>{
if(e.origin!==location.origin||e.source!==frame.contentWindow)return
const d=e.data||{}
if(d.type==='state'){puterOn=!!d.on;puterNote()}
else if(d.type==='reply'&&waiting.has(d.id)){waiting.get(d.id)(d);waiting.delete(d.id)}
})
}
host.append(frame)
}
async function puterCall(op,data){
await loaded
return new Promise((res,rej)=>{
const id=++seq
const t=setTimeout(()=>{waiting.delete(id);rej(new Error('Puter took too long'))},90000)
waiting.set(id,d=>{clearTimeout(t);d.ok?res(d):rej(new Error(d.error||'Puter failed'))})
frame.contentWindow.postMessage({id,op,...data},location.origin)
})
}

function block(title,sub,...kids){
return h('section',{class:'lab'},h('h3',null,title),sub?h('p',{class:'hint'},sub):null,...kids)
}
function serverPick(onchange){
const own=[...S.servers].sort((a,b)=>(b.owner_id===S.me.id)-(a.owner_id===S.me.id))
const sel=h('select',{class:'sel',on:{change:()=>onchange&&onchange(sel.value)}},own.map(s=>h('option',{value:s.id},s.name+(s.owner_id===S.me.id?' (yours)':''))))
return sel
}
async function channelsOf(sid){
await loadServer(sid)
return(S.sdata[sid]?.channels||[]).filter(c=>c.type!=='voice')
}
function chanPick(){
const sel=h('select',{class:'sel'})
const fill=async sid=>{
mount(sel,h('option',{value:''},'Loading'))
try{
const l=await channelsOf(sid)
mount(sel,l.length?l.map(c=>h('option',{value:c.id},'#'+c.name)):h('option',{value:''},'No text channels'))
}catch{mount(sel,h('option',{value:''},'Unavailable'))}
}
return{sel,fill}
}
function modelPick(){
const sel=h('select',{class:'sel'},h('option',{value:''},'Loading models'))
const ready=GET('/api/lab/models').then(d=>{
mount(sel,d.models.map(m=>h('option',{value:m.name,title:m.description},m.name)))
const pref=d.models.find(m=>m.name==='openai')||d.models[0]
if(pref)sel.value=pref.name
}).catch(e=>{mount(sel,h('option',{value:''},'Models unavailable'));return e})
return{sel,ready}
}
function tree(layout){
const box=h('div',{class:'ltree'})
for(const c of layout.categories)box.append(h('div',{class:'lcat'},h('b',null,c.name),h('ul',null,c.channels.map(ch=>h('li',null,(ch.type==='voice'?'Voice  ':ch.type==='announce'?'News  ':ch.type==='forum'?'Forum  ':'#')+ch.name,ch.topic?h('span',{class:'hint'},'  '+ch.topic):null)))))
if(layout.roles.length)box.append(h('div',{class:'lcat'},h('b',null,'Roles'),h('div',{class:'lroles'},layout.roles.map(r=>h('span',{class:'chip'},r.color?h('i',{class:'dot',style:{background:r.color}}):null,r.name)))))
return box
}

function maker(){
const model=modelPick()
const target=serverPick()
const prompt=h('textarea',{class:'inp',rows:4,maxLength:600,placeholder:'A study server for university students with channels per subject, a quiet voice room and a help desk'})
const out=h('div')
const gen=h('button',{class:'btn pri'},'Generate layout')
let layout=null
const note=h('div',{class:'hint'})
const pnote=h('span',{class:'hint'})
const pmodel=h('input',{class:'inp',placeholder:'Puter model (blank for default)'})
const pbox=h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}})
const wrap=h('div')
puterNote=()=>{pnote.textContent=puterOn?'Puter is connected':'Connect Puter in the box below to use it'}
function show(){
if(!layout){mount(out);return}
const roles=h('input',{type:'checkbox',checked:true})
const text=h('input',{type:'checkbox'})
const apply=h('button',{class:'btn pri'},'Add to server')
apply.addEventListener('click',async()=>{
apply.disabled=true
try{
const r=await POST(`/api/lab/servers/${target.value}/apply`,{layout,roles:roles.checked,text:text.checked})
toast(`Added ${r.categories} categories, ${r.channels} channels and ${r.roles} roles`,'ok')
await loadServer(target.value)
}catch(e){fail(e)}finally{apply.disabled=false}
})
const refine=h('button',{class:'btn'},'Refine with Puter')
refine.addEventListener('click',async()=>{
refine.disabled=true
try{
const r=await puterCall('chat',{model:pmodel.value.trim(),prompt:'Improve this community server layout. Keep the same JSON shape, keep it safe for work, add missing useful channels, fix naming. Reply with JSON only.\n'+JSON.stringify(layout)})
const v=await POST('/api/lab/ai/validate',{layout:r.text})
layout=v.layout
show()
toast('Layout refined','ok')
}catch(e){fail(e)}finally{refine.disabled=false}
})
mount(out,tree(layout),
h('label',{class:'perm'},roles,h('span',null,'Also create the roles (no permissions, colour only)')),
h('label',{class:'perm'},text,h('span',null,'Replace description, welcome message and rules (needs Manage Server)')),
h('div',{class:'row',style:{gap:'8px',marginTop:'10px',flexWrap:'wrap'}},apply,refine))
}
gen.addEventListener('click',async()=>{
if(prompt.value.trim().length<8){toast('Describe the server in a sentence or two','err');return}
gen.disabled=true
note.textContent='Asking '+model.sel.value+'. This can take up to 40 seconds.'
try{
const r=await POST('/api/lab/ai/layout',{prompt:prompt.value.trim(),model:model.sel.value})
layout=r.layout
note.textContent=''
show()
}catch(e){note.textContent='';fail(e)}finally{gen.disabled=false}
})
const connect=h('button',{class:'btn sm'},'Use Puter to refine')
connect.addEventListener('click',()=>{
connect.hidden=true
bridge(pbox)
pbox.append(pnote,pmodel)
puterNote()
puterCall('models').then(d=>{if(d.models.length){pmodel.setAttribute('list','puterlist');wrap.append(h('datalist',{id:'puterlist'},d.models.map(m=>h('option',{value:m}))))}}).catch(()=>{})
})
mount(wrap,field('Model (Pollinations)',model.sel),field('Add the layout to',target),field('What should the server be about?',prompt),
h('div',{class:'row',style:{gap:'8px',marginTop:'8px',flexWrap:'wrap'}},gen,connect),note,pbox,out)
return block('AI Server Maker','Pollinations drafts the layout from your prompt. Puter can optionally refine it with a second model you choose. Nothing changes in your server until you press Add to server.',wrap,h('p',{class:'hint'},'Your prompt is sent to Pollinations by this Parley server. Anonymous use is rate limited, so wait a few seconds between tries.'))
}

function summariser(){
const model=modelPick()
const sv=serverPick(sid=>ch.fill(sid))
const ch=chanPick()
if(S.servers.length)ch.fill(sv.value)
const res=h('pre',{class:'labout'})
const go=h('button',{class:'btn pri'},'Summarise last 120 messages')
go.addEventListener('click',async()=>{
if(!ch.sel.value){toast('Pick a channel','err');return}
go.disabled=true
res.textContent='Working'
try{
const r=await POST('/api/lab/ai/summary',{room:ch.sel.value,model:model.sel.value})
res.textContent=r.summary
}catch(e){res.textContent='';fail(e)}finally{go.disabled=false}
})
return block('Channel summariser','Catches you up on a busy channel.',field('Server',sv),field('Channel',ch.sel),field('Model (Pollinations)',model.sel),h('div',{style:{marginTop:'8px'}},go),res,h('p',{class:'hint'},'The recent messages are sent to Pollinations. Use it on channels where that is fine for everyone in them.'))
}

function health(){
const sv=serverPick()
const res=h('div')
const go=h('button',{class:'btn pri'},'Check server health')
go.addEventListener('click',async()=>{
go.disabled=true
try{
const r=await GET('/api/lab/health/'+sv.value)
const t=r.totals
const stat=(n,l)=>h('div',{class:'lstat'},h('b',null,String(n)),h('span',null,l))
mount(res,h('div',{class:'lstats'},stat(t.members,'members'),stat(t.joined,'joined this week'),stat(t.msgs,'messages this week'),stat(t.active,'people spoke'),stat(t.channels,'channels'),stat(t.roles,'roles'),stat(t.bans,'bans')),
r.busiest.length?h('p',null,'Busiest: ',r.busiest.map(x=>'#'+x.name+' ('+x.n+')').join(', ')):h('p',{class:'hint'},'No messages in the last 7 days.'),
r.posters.length?h('p',null,'Most active: ',r.posters.map(x=>x.name+' ('+x.n+')').join(', ')):null,
r.quiet.length?h('p',null,'No messages for 30 days: ',r.quiet.map(x=>'#'+x.name).join(', ')):h('p',{class:'hint'},'Every text channel was used in the last 30 days.'))
}catch(e){fail(e)}finally{go.disabled=false}
})
return block('Server health','Activity numbers from your own data, with no AI involved.',field('Server',sv),h('div',{style:{marginTop:'8px'}},go),res)
}

function exporter(){
const sv=serverPick(sid=>ch.fill(sid))
const ch=chanPick()
if(S.servers.length)ch.fill(sv.value)
const fmt=h('select',{class:'sel'},h('option',{value:'txt'},'Plain text'),h('option',{value:'json'},'JSON'))
const go=h('a',{class:'btn pri',href:'#',role:'button'},'Download transcript')
go.addEventListener('click',e=>{
if(!ch.sel.value){e.preventDefault();toast('Pick a channel','err');return}
go.href=`/api/lab/export/${encodeURIComponent(ch.sel.value)}?fmt=${fmt.value}&limit=2000`
})
return block('Transcript export','Saves up to the last 2000 messages of a channel to a file. Text only, no attachments.',field('Server',sv),field('Channel',ch.sel),field('Format',fmt),h('div',{style:{marginTop:'8px'}},go))
}

export function labsPage(pg){
mount(pg,h('h3',null,'Experimental'),
h('p',{class:'hint'},'Early features that only a few accounts can see. They may change or disappear.'),
maker(),summariser(),health(),exporter())
}
