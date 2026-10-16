import{h,mount,POST,PATCH,fail,toast,field}from'./util.js'
import{S,P,can,loadServer,loadServers}from'./state.js'

const BRIEF='Parley Community is the official home of Parley, a free, open Discord alternative that runs on Cloudflare. Members chat, report bugs, suggest features, share bots and themes built in the Bot Lab, and hang out in voice. Tone: friendly, welcoming, a little playful. Brand colours: deep fjord teal backgrounds with a maroon accent.'
const SHAPE='Reply with one JSON object only, no markdown. Shape: {"tag":"2 to 4 letters or numbers","accent":"#rrggbb","description":"under 200 characters","welcome":"under 500 characters","rules":"numbered plain text rules, under 1200 characters","theme":{"bg":"#rrggbb","side":"#rrggbb","panel":"#rrggbb","text":"#rrggbb","accent":"#rrggbb","dim":55},"categories":[{"name":"decorated category name","channels":[{"name":"channel-name","type":"text|announce|voice|forum","topic":"under 120 characters"}]}],"roles":[{"name":"Role name","color":"#rrggbb"}]}. Rules: at most 8 categories, 10 channels each, 10 roles. Category names may use a few Unicode symbols for style such as ✦ ❖ ◆ ➤ ☾ but no emoji. Channel names are lowercase with hyphens. Include welcome, rules, announcements, general chat, help, bug reports, feature ideas, a showcase for bots and themes, off-topic, and voice lounges. Dark theme with readable contrast. Safe for work.'
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
gen.disabled=redo.disabled=true
status.textContent='Designing. This can take a minute.'
try{
const r=await POST('/api/admin/studio',{prompt})
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
mount(pg,h('h3',null,'Server studio'),
h('p',{class:'hint'},'Uses OpenRouter through the Worker secret OPENROUTER_API_KEY to design a styled server: colour theme, server tag, categories with decorated names, channels, roles, welcome text and rules. Nothing changes until you press Build this server. Building only adds channels and roles; it never deletes or overwrites existing ones, and the theme and tag replace the current ones.'),
field('Server to build',target),field('Brief',brief,'Pre-filled for Parley Community. Edit it to design a different server.'),
h('div',{class:'row',style:{gap:'8px',margin:'8px 0'}},gen,status),
field('Change request',note),redo,out)
}
