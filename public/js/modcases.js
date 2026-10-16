import{h,mount,icon,GET,POST,PATCH,DEL,toast,fail,dialog,confirmBox,field,fmtStamp,copyText}from'./util.js'
import{S}from'./state.js'

const errBox=()=>h('div',{class:'err',role:'alert'})
const STATUS=[['open','Open'],['appealed','Appealed'],['resolved','Resolved'],['overturned','Overturned']]
const KINDS=[['','All actions'],['warn','Warnings'],['timeout','Timeouts'],['kick','Kicks'],['ban','Bans'],['unban','Unbans'],['note','Notes']]
export const caseFilter={user:null,name:''}

export function warnDialog(sid,m,messageId){
const reason=h('input',{class:'inp',maxLength:500,placeholder:'What did they do?',autofocus:true})
const err=errBox()
const btn=h('button',{class:'btn pri'},'Send warning')
const d=dialog('Warn '+m.display_name,h('div',{class:'bd'},h('p',{class:'hint'},'They get a notice with this reason, and it is saved as a case moderators can review.'),field('Reason',reason),err),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),btn]})
btn.onclick=async()=>{
btn.disabled=true
try{await POST(`/api/servers/${sid}/members/${m.id}/warn`,{reason:reason.value.trim(),message_id:messageId||undefined});toast('Warning sent','ok');d.close()}catch(e){err.textContent=e.message;btn.disabled=false}
}
}

export function casesPage(pg,sid){
const canDelete=S.sdata[sid].me.owner||S.sdata[sid].me.admin
const list=h('div',{class:'bh-col'})
const more=h('div')
let type='',status='',next=null
const err=errBox()
const kind=h('select',{class:'sel','aria-label':'Action type',on:{change:e=>{type=e.target.value;load(true)}}},KINDS.map(([v,l])=>h('option',{value:v},l)))
const st=h('select',{class:'sel','aria-label':'Status',on:{change:e=>{status=e.target.value;load(true)}}},h('option',{value:''},'Any status'),STATUS.map(([v,l])=>h('option',{value:v},l)))
const who=h('div',{class:'row'})
const drawWho=()=>mount(who,caseFilter.user?h('span',{class:'pill'},'Only '+caseFilter.name,h('button',{class:'ib',type:'button','aria-label':'Clear member filter',on:{click:()=>{caseFilter.user=null;caseFilter.name='';drawWho();load(true)}}},icon('x','s'))):null)
function card(c){
const sel=h('select',{class:'sel','aria-label':'Case status',on:{change:async e=>{try{await PATCH(`/api/servers/${sid}/cases/${c.num}`,{status:e.target.value});toast('Case updated','ok')}catch(x){fail(x);e.target.value=c.status}}}},STATUS.map(([v,l])=>h('option',{value:v,selected:c.status===v},l)))
const body=h('div',{class:'grow'},
h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},h('b',null,'Case '+c.num),h('span',{class:'pill'},c.type),h('span',null,c.display_name?c.display_name+' (@'+c.username+')':'Deleted user')),
h('p',{style:{margin:'6px 0'}},c.reason||'No reason given'),
c.evidence?h('pre',{class:'mb',style:{whiteSpace:'pre-wrap',margin:'0 0 6px'}},c.evidence):null,
h('div',{class:'hint'},'By '+(c.mod_name||'unknown')+' on '+fmtStamp(c.created_at)))
const acts=h('div',{class:'row',style:{gap:'6px',flexWrap:'wrap'}},sel,
h('button',{class:'btn sm',type:'button',on:{click:()=>editDialog(sid,c,()=>load(true))}},'Edit'),
h('button',{class:'btn sm',type:'button',on:{click:()=>{caseFilter.user=c.user_id;caseFilter.name=c.display_name||c.username||'member';drawWho();load(true)}}},'All for member'),
canDelete?h('button',{class:'btn sm dng',type:'button',on:{click:async()=>{if(!await confirmBox('Delete case '+c.num,'The case is removed for good. The audit log keeps a note that it was deleted.','Delete',true))return;try{await DEL(`/api/servers/${sid}/cases/${c.num}`);load(true)}catch(x){fail(x)}}}},'Delete'):null)
return h('div',{class:'bh-row',style:{flexDirection:'column',alignItems:'stretch',gap:'8px'}},body,acts)
}
async function load(reset){
err.textContent=''
if(reset){next=null;mount(list)}
const q=new URLSearchParams()
if(type)q.set('type',type)
if(status)q.set('status',status)
if(caseFilter.user)q.set('user',caseFilter.user)
if(next)q.set('before',next)
try{
const r=await GET(`/api/servers/${sid}/cases?${q}`)
list.append(...r.cases.map(card))
if(reset&&!r.cases.length)mount(list,h('div',{class:'empty'},'No cases match. Warnings, timeouts, kicks and bans appear here as they happen.'))
next=r.next
mount(more,next?h('button',{class:'btn',type:'button',on:{click:()=>load(false)}},'Load older cases'):null)
}catch(e){err.textContent=e.message}
}
mount(pg,h('h3',null,'Mod cases'),h('p',{class:'hint'},'Every warning, timeout, kick, ban and unban gets a case number, a reason and a status. Warn people from a member\'s menu, then edit the reason, add evidence or mark the case resolved here. A ban appeal moves its case to Appealed, then Resolved or Overturned.'),
h('div',{class:'row',style:{flexWrap:'wrap'}},kind,st),who,err,list,more)
drawWho()
load(true)
}

function editDialog(sid,c,done){
const reason=h('input',{class:'inp',maxLength:500,value:c.reason||''})
const ev=h('textarea',{class:'inp',rows:4,maxLength:2000},c.evidence||'')
const err=errBox()
const btn=h('button',{class:'btn pri'},'Save')
const d=dialog('Edit case '+c.num,h('div',{class:'bd'},field('Reason',reason),field('Evidence',ev,'Paste message text, links or notes. It is kept with the case.'),err),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),btn]})
btn.onclick=async()=>{
btn.disabled=true
try{await PATCH(`/api/servers/${sid}/cases/${c.num}`,{reason:reason.value.trim(),evidence:ev.value.trim()});d.close();done()}catch(e){err.textContent=e.message;btn.disabled=false}
}
}

export function templateShare(box,sid){
const name=h('input',{class:'inp',maxLength:60,placeholder:'Template name','aria-label':'Template name'})
const desc=h('input',{class:'inp',maxLength:300,placeholder:'What is it for? (optional)','aria-label':'Template description'})
let withText=true
const txt=h('input',{type:'checkbox',checked:true,on:{change:e=>{withText=e.target.checked}}})
const err=errBox()
const list=h('div',{class:'bh-col'})
async function load(){
try{
const r=await GET(`/api/servers/${sid}/templates`)
mount(list,r.templates.length?r.templates.map(t=>h('div',{class:'bh-row',style:{alignItems:'center'}},h('div',{class:'grow'},h('b',null,t.name),h('div',{class:'hint'},'Code '+t.code+', used '+t.uses+' times')),
h('button',{class:'btn sm',type:'button',on:{click:async()=>{await copyText(t.code);toast('Code copied','ok')}}},icon('copy','s'),'Copy code'),
h('button',{class:'btn sm dng',type:'button',on:{click:async()=>{if(!await confirmBox('Delete template','The code stops working. Servers already made from it are not affected.','Delete',true))return;try{await DEL(`/api/servers/${sid}/templates/${t.code}`);load()}catch(e){fail(e)}}}},'Delete'))):h('div',{class:'hint'},'No shared templates yet'))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
mount(box,h('h4',null,'Share this server as a template'),h('p',{class:'hint'},'Publishes a snapshot of the channels, categories and role names (not role permissions, members or messages) under a short code. Anyone with the code can start a new server from it. Up to 5 templates per server.'),
field('Name',name),field('Description',desc),h('label',{class:'row'},txt,'Include description, welcome message and rules'),err,
h('button',{class:'btn pri',type:'button',on:{click:async()=>{
err.textContent=''
try{const r=await POST(`/api/servers/${sid}/templates`,{name:name.value.trim(),description:desc.value.trim(),text:withText});name.value='';desc.value='';toast('Template published. Code '+r.code,'ok');load()}catch(e){err.textContent=e.message}
}}},'Publish template'),list)
load()
}

export function templateCreate(body,after){
const code=h('input',{class:'inp',maxLength:8,placeholder:'Template code',autofocus:true,'aria-label':'Template code'})
const name=h('input',{class:'inp',maxLength:60,placeholder:`${S.me.display_name}'s server`,'aria-label':'Server name'})
const info=h('div',{class:'hint'})
const err=errBox()
let found=null
const look=async()=>{
err.textContent='';found=null;mount(info)
const c=code.value.trim()
if(c.length<8)return
try{
const r=await GET('/api/templates/'+encodeURIComponent(c))
found=r.template
const chs=found.categories.reduce((n,x)=>n+x.channels.length,0)
mount(info,h('b',null,found.name),' from '+found.server_name+': '+found.categories.length+' categories, '+chs+' channels, '+found.roles.length+' roles'+(found.description?'. '+found.description:''))
}catch(e){err.textContent=e.message}
}
code.addEventListener('input',look)
const btn=h('button',{class:'btn pri',type:'button',on:{click:async()=>{
err.textContent=''
if(!found){err.textContent='Enter a valid template code';return}
btn.disabled=true
try{const r=await POST(`/api/templates/${found.code}/create`,{name:name.value.trim()||`${S.me.display_name}'s server`});await after(r)}catch(e){err.textContent=e.message;btn.disabled=false}
}}},'Create from template')
mount(body,field('Template code',code),info,field('Server name',name),err,h('div',{class:'row',style:{justifyContent:'flex-end'}},btn))
}
