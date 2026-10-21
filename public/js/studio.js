import{h,mount,POST,PATCH,DEL,fail,toast,field,confirmBox}from'./util.js'
import{S,P,can,loadServer,loadServers}from'./state.js'
import{chooseProvider}from'./provider.js'

const BRIEF='Parley Community is the official home of Parley, a free, open Discord alternative that runs on Cloudflare. Members chat, report bugs, suggest features, share bots and themes built in the Bot Lab, and hang out in voice. Tone: friendly, welcoming, a little playful. Brand colours: deep fjord teal backgrounds with a maroon accent.'
const SHAPE='Reply with one JSON object only, no markdown. Shape: {"tag":"2 to 4 letters or numbers","accent":"#rrggbb","description":"under 200 characters","welcome":"under 500 characters","rules":"numbered plain text rules, under 1200 characters","theme":{"bg":"#rrggbb","side":"#rrggbb","panel":"#rrggbb","text":"#rrggbb","accent":"#rrggbb","dim":55},"categories":[{"name":"decorated category name","channels":[{"name":"channel-name","type":"text|announce|voice|forum","topic":"under 120 characters"}]}],"roles":[{"name":"Role name","color":"#rrggbb"}]}. Rules: at most 8 categories, 10 channels each, 10 roles. Category names may use a few Unicode symbols for style such as ✦ ❖ ◆ ➤ ☾ but no emoji. Channel names are lowercase with hyphens. Include welcome, rules, announcements, general chat, help, bug reports, feature ideas, a showcase for bots and themes, off-topic, and voice lounges. Dark theme with readable contrast. Safe for work.'
const EDIT_SHAPE='Reply with one JSON object only, no markdown. Shape: {"rename":{"categories":[{"id":"category id","name":"new name"}],"channels":[{"id":"channel id","name":"new-name"}]},"delete":{"categories":["category id"],"channels":["channel id"]}}. Use only ids from the structure given. Include only what the request asks for; empty arrays are fine. Channel names are lowercase with hyphens, up to 40 characters. Category names up to 40 characters.'
const structure=sid=>{const d=S.sdata[sid];if(!d)return'(not loaded)';return JSON.stringify({categories:d.categories.map(c=>({id:c.id,name:c.name,channels:d.channels.filter(x=>x.category_id===c.id).map(x=>({id:x.id,name:x.name}))})),uncategorised:d.channels.filter(x=>!x.category_id).map(x=>({id:x.id,name:x.name}))})}
const HEX=/^#[0-9a-fA-F]{6}$/
const hex=v=>typeof v==='string'&&HEX.test(v)?v.toLowerCase():null
const str=(v,n)=>typeof v==='string'?v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,n):''

function parse(text){
const a=text.indexOf('{'),b=text.lastIndexOf('}')
if(a<0||b<a)throw new Error('The AI did not return JSON (got: '+text.trim().slice(0,160)+'). Try again')
let o
try{o=JSON.parse(text.slice(a,b+1))}catch{throw new Error('The AI returned JSON that could not be read. Try again')}
const theme={}
for(const k of['bg','side','panel','text','accent']){const v=hex(o.theme&&o.theme[k]);if(v)theme[k]=v}
theme.dim=Math.min(90,Math.max(0,parseInt(o.theme&&o.theme.dim,10)||55))
const tag=str(o.tag,4).toUpperCase()
return{
tag:/^[A-Z0-9]{2,4}$/.test(tag)?tag:'',
accent:hex(o.accent)||theme.accent||null,
theme,
layout:{description:str(o.description,500),welcome:str(o.welcome,1000),rules:str(o.rules,3000),categories:Array.isArray(o.categories)?o.categories:[],roles:Array.isArray(o.roles)?o.roles:[]}
}
}

function parseEdits(text,sid){
const a=text.indexOf('{'),b=text.lastIndexOf('}')
if(a<0||b<a)throw new Error('The AI did not return JSON (got: '+text.trim().slice(0,160)+'). Try again')
let o
try{o=JSON.parse(text.slice(a,b+1))}catch{throw new Error('The AI returned JSON that could not be read. Try again')}
const d=S.sdata[sid]
const cats=new Map(d.categories.map(c=>[c.id,c.name])),chs=new Map(d.channels.map(c=>[c.id,c.name]))
const arr=v=>Array.isArray(v)?v:[]
const ren=(list,map,max)=>arr(list).filter(x=>x&&map.has(x.id)&&typeof x.name==='string'&&str(x.name,max)&&str(x.name,max)!==map.get(x.id)).map(x=>({id:x.id,from:map.get(x.id),name:str(x.name,max)}))
const del=(list,map)=>[...new Set(arr(list).filter(x=>map.has(x)))].map(id=>({id,name:map.get(id)}))
const rn=o.rename||{},dl=o.delete||{}
return{rc:ren(rn.categories,cats,40),rh:ren(rn.channels,chs,40).map(x=>({...x,name:x.name.toLowerCase().replace(/[^a-z0-9_\u00c0-\uffff-]+/g,'-').replace(/^-+|-+$/g,'')})).filter(x=>x.name),dc:del(dl.categories,cats),dh:del(dl.channels,chs)}
}

function preview(r){
const sw=Object.entries(r.theme).filter(([k])=>k!=='dim').map(([k,v])=>h('span',{class:'chip',title:k},h('i',{class:'dot',style:{background:v}}),k+' '+v))
const cats=r.layout.categories.slice(0,8).map(c=>h('div',{class:'lcat'},h('b',null,String(c&&c.name||'')),h('ul',null,(Array.isArray(c&&c.channels)?c.channels:[]).slice(0,10).map(ch=>h('li',null,(ch.type==='voice'?'Voice  ':ch.type==='announce'?'News  ':ch.type==='forum'?'Forum  ':'#')+String(ch.name||''),ch.topic?h('span',{class:'hint'},'  '+String(ch.topic)):null)))))
return h('div',null,
h('div',{class:'row',style:{flexWrap:'wrap',gap:'6px',marginBottom:'8px'}},r.tag?h('span',{class:'gtag'},r.tag):null,sw),
r.layout.description?h('p',null,r.layout.description):null,
h('div',{class:'ltree'},cats),
r.layout.roles.length?h('div',{class:'lcat'},h('b',null,'Roles'),h('div',{class:'lroles'},r.layout.roles.slice(0,10).map(x=>h('span',{class:'chip'},hex(x&&x.color)?h('i',{class:'dot',style:{background:x.color}}):null,String(x&&x.name||''))))):null)
}

export function studio(pg){
const mine=S.servers.filter(s=>can(s.id,P.MANAGE_SERVER)||s.owner_id===S.me.id)
const target=h('select',{class:'sel','aria-label':'Server to build'},mine.map(s=>h('option',{value:s.id,selected:/parley community/i.test(s.name)},s.name)))
const brief=h('textarea',{class:'inp',rows:5,maxLength:1500,'aria-label':'Brief'},BRIEF)
const note=h('textarea',{class:'inp',rows:2,maxLength:400,placeholder:'Tweak it: "darker purple theme", "add a events category", "fewer channels"','aria-label':'Change request'})
const status=h('span',{class:'hint'})
const out=h('div')
const gen=h('button',{class:'btn pri',type:'button'},'Generate')
const redo=h('button',{class:'btn',type:'button',hidden:true},'Apply my change request')
let result=null,raw='',via=''
async function run(prompt){
const ch=await chooseProvider()
if(!ch)return
gen.disabled=redo.disabled=true
status.textContent='Designing. This can take a minute.'
try{
const r=await Promise.race([POST('/api/admin/studio',{prompt,...ch}),new Promise((_,no)=>setTimeout(()=>no(new Error('The AI took longer than 2 minutes. Try again')),120000))])
raw=r.text;via=r.via
result=parse(r.text)
status.textContent='Designed with '+via
show()
}catch(e){status.textContent='';fail(e)}finally{gen.disabled=redo.disabled=false}
}
gen.addEventListener('click',()=>{
if(!target.value){toast('You need a server you manage first','err');return}
run('Design a stylish, welcoming Discord-style community server.\nBrief: '+brief.value.trim()+'\n'+SHAPE)
})
redo.addEventListener('click',()=>{
if(!note.value.trim()){toast('Write what to change first','err');return}
run('Here is a server design as JSON:\n'+raw+'\nChange it as follows: '+note.value.trim()+'\nKeep the same JSON shape and limits.\n'+SHAPE)
})
function show(){
redo.hidden=false
const withRoles=h('input',{type:'checkbox',checked:true})
const withTheme=h('input',{type:'checkbox',checked:true})
const withText=h('input',{type:'checkbox',checked:true})
const apply=h('button',{class:'btn pri',type:'button'},'Build this server')
apply.addEventListener('click',async()=>{
apply.disabled=true
const sid=target.value
try{
const lay=await POST('/api/lab/ai/validate',{layout:JSON.stringify(result.layout)}).catch(()=>null)
const layout=lay&&lay.layout?lay.layout:result.layout
const r=await POST(`/api/servers/${sid}/template`,{layout,roles:withRoles.checked,text:withText.checked})
const patch={}
if(withTheme.checked){patch.theme=result.theme;if(result.accent)patch.accent=result.accent}
if(result.tag)patch.tag=result.tag
if(Object.keys(patch).length)await PATCH('/api/servers/'+sid,patch)
await loadServer(sid);await loadServers()
toast(`Added ${r.categories} categories, ${r.channels} channels and ${r.roles} roles`,'ok')
}catch(e){fail(e)}finally{apply.disabled=false}
})
mount(out,preview(result),
h('label',{class:'perm'},withTheme,h('span',null,'Apply the colour theme and accent')),
h('label',{class:'perm'},withRoles,h('span',null,'Create the roles (colour only, no permissions)')),
h('label',{class:'perm'},withText,h('span',null,'Set description, welcome message and rules')),
h('div',{class:'row',style:{marginTop:'10px'}},apply))
}
const editBtn=h('button',{class:'btn',type:'button'},'Rename or delete existing')
const editOut=h('div')
editBtn.addEventListener('click',async()=>{
const req=note.value.trim()
if(!target.value||!req){toast('Write what to rename or delete in the change request first','err');return}
const sid=target.value
const ch=await chooseProvider()
if(!ch)return
editBtn.disabled=true
status.textContent='Reading the server structure. This can take a minute.'
try{
if(!S.sdata[sid])await loadServer(sid)
const r=await Promise.race([POST('/api/admin/studio',{...ch,prompt:'Here is the current structure of a Discord-style server as JSON:\n'+structure(sid)+'\nRequest: '+req+'\n'+EDIT_SHAPE}),new Promise((_,no)=>setTimeout(()=>no(new Error('The AI took longer than 2 minutes. Try again')),120000))])
const e=parseEdits(r.text,sid)
status.textContent='Planned with '+r.via
const total=e.rc.length+e.rh.length+e.dc.length+e.dh.length
if(!total){mount(editOut,h('div',{class:'hint'},'The AI found nothing to rename or delete for that request.'));return}
const doDel=h('input',{type:'checkbox'})
const run=h('button',{class:'btn pri',type:'button'},'Apply these changes')
run.addEventListener('click',async()=>{
const dn=e.dc.length+e.dh.length
if(dn&&!doDel.checked){toast('Tick the box to confirm the deletions, or they will be skipped','err');return}
if(dn&&!await confirmBox('Delete '+dn+' item'+(dn>1?'s':'')+'?','Deleted channels lose all their messages. This cannot be undone.','Delete',true))return
run.disabled=true
let ok=0,bad=[]
const go=async(fn,label)=>{try{await fn();ok++}catch(x){bad.push(label+': '+x.message)}}
for(const x of e.rc)await go(()=>PATCH(`/api/servers/${sid}/categories/${x.id}`,{name:x.name}),x.from)
for(const x of e.rh)await go(()=>PATCH('/api/channels/'+x.id,{name:x.name}),x.from)
if(doDel.checked){
for(const x of e.dh)await go(()=>DEL('/api/channels/'+x.id),x.name)
for(const x of e.dc)await go(()=>DEL(`/api/servers/${sid}/categories/${x.id}`),x.name)
}
await loadServer(sid);await loadServers()
mount(editOut)
toast(ok+' change'+(ok===1?'':'s')+' applied'+(bad.length?', '+bad.length+' failed: '+bad[0]:''),bad.length?'err':'ok')
})
mount(editOut,h('div',{class:'ltree'},
e.rc.length?h('div',{class:'lcat'},h('b',null,'Rename categories'),h('ul',null,e.rc.map(x=>h('li',null,x.from+'  →  '+x.name)))):null,
e.rh.length?h('div',{class:'lcat'},h('b',null,'Rename channels'),h('ul',null,e.rh.map(x=>h('li',null,'#'+x.from+'  →  #'+x.name)))):null,
e.dc.length?h('div',{class:'lcat'},h('b',null,'Delete categories (their channels stay, uncategorised)'),h('ul',null,e.dc.map(x=>h('li',null,x.name)))):null,
e.dh.length?h('div',{class:'lcat'},h('b',null,'Delete channels'),h('ul',null,e.dh.map(x=>h('li',null,'#'+x.name)))):null),
e.dc.length+e.dh.length?h('label',{class:'perm'},doDel,h('span',null,'Also delete the items listed above (permanent)')):null,
h('div',{class:'row',style:{marginTop:'10px'}},run))
}catch(x){status.textContent='';fail(x)}finally{editBtn.disabled=false}
})
mount(pg,h('h3',null,'Server studio'),
h('p',{class:'hint'},'Uses OpenRouter through the Worker secret OPENROUTER_API_KEY to design a styled server: colour theme, server tag, categories with decorated names, channels, roles, welcome text and rules. Nothing changes until you press Build this server. Building only adds channels and roles. To rename or delete existing channels and categories, write the request below and press Rename or delete existing: you see the exact list first and deletions need an extra tick and confirmation.'),
field('Server to build',target),field('Brief',brief,'Pre-filled for Parley Community. Edit it to design a different server.'),
h('div',{class:'row',style:{gap:'8px',margin:'8px 0'}},gen,status),
field('Change request',note),h('div',{class:'row',style:{gap:'8px'}},redo,editBtn),editOut,out)
}
