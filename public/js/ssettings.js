import{programPage}from'./exp.js'
import{h,mount,menuAt,icon,GET,POST,PATCH,PUT,DEL,avatar,toast,fail,dialog,confirmBox,field,toggle,fmtStamp,debounce,copyText,saveBlob}from'./util.js'
import{S,P,PERM_INFO,emit,can,cacheUser,loadServers,loadServer,loadMembers,applyThemeObj,applyServerTheme}from'./state.js'
import{go}from'./nav.js'
import{casesPage,warnDialog,templateShare,caseFilter}from'./modcases.js'
import{pickImage,uploadImage,CATEGORIES,inviteDialog}from'./dialogs.js'
import{pickCropped}from'./cropper.js'
import{fileUrl,gtag}from'./util.js'


const row=(label,sub,control)=>h('div',{class:'row sp',style:{padding:'8px 0',borderBottom:'1px solid var(--border)'}},h('div',null,h('div',{style:{color:'var(--strong)'}},label),sub?h('div',{class:'hint',style:{margin:0}},sub):null),control)
const errBox=()=>h('div',{class:'err',role:'alert'})

export async function leaveServer(sid){
const s=S.servers.find(x=>x.id===sid)
if(!await confirmBox('Leave '+(s?.name||'server'),'You will need a new invite to rejoin unless the server is public.','Leave server',true))return
try{
await POST(`/api/servers/${sid}/leave`,{})
await loadServers()
delete S.sdata[sid]
go('/')
}catch(e){fail(e)}
}

function reasonDialog(title,label,btnLabel,fn,withMinutes){
const reason=h('input',{class:'inp',maxLength:300,placeholder:'Reason (optional)',autofocus:true})
const err=errBox()
const btn=h('button',{class:'btn dng'},btnLabel)
const d=dialog(title,h('div',{class:'bd'},h('p',null,label),field('Reason',reason),err),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),btn]})
btn.onclick=async()=>{
btn.disabled=true
try{await fn(reason.value.trim());d.close()}catch(e){err.textContent=e.message;btn.disabled=false}
}
}
function textDialog(title,label,initial,fn,max=32){
const inp=h('input',{class:'inp',maxLength:max,value:initial||'',autofocus:true})
const err=errBox()
const btn=h('button',{class:'btn pri'},'Save')
const d=dialog(title,h('div',{class:'bd'},field(label,inp),err),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),btn]})
btn.onclick=async()=>{btn.disabled=true;try{await fn(inp.value.trim());d.close()}catch(e){err.textContent=e.message;btn.disabled=false}}
}

export function memberMenu(sid,m){
const d=S.sdata[sid]
if(!d||m.id===S.me.id)return[{label:'Change nickname',icon:'edit',fn:()=>textDialog('Change nickname','Nickname',m.nickname||'',async v=>{await PATCH(`/api/servers/${sid}/members/${S.me.id}`,{nickname:v||null});await loadMembers(sid,true)})}]
const items=[]
const manage=can(sid,P.MANAGE_ROLES)
if(manage){
items.push({head:'Roles'})
for(const r of d.roles.filter(r=>!r.is_everyone)){
const has=(m.roles||[]).includes(r.id)
items.push({label:(has?'✓ ':'')+r.name,fn:async()=>{
try{
if(has)await DEL(`/api/servers/${sid}/members/${m.id}/roles/${r.id}`)
else await PUT(`/api/servers/${sid}/members/${m.id}/roles/${r.id}`,{})
await loadMembers(sid,true)
}catch(e){fail(e)}
}})
}
items.push('-')
}
if(can(sid,P.MANAGE_SERVER))items.push({icon:'edit',label:'Change nickname',fn:()=>textDialog('Change nickname','Nickname',m.nickname||'',async v=>{await PATCH(`/api/servers/${sid}/members/${m.id}`,{nickname:v||null});await loadMembers(sid,true)})})
if(can(sid,P.MODERATE)){
const t=async mins=>{try{await POST(`/api/servers/${sid}/members/${m.id}/timeout`,{minutes:mins});await loadMembers(sid,true);toast(mins?'Member timed out':'Timeout removed','ok')}catch(e){fail(e)}}
items.push({icon:'flag',label:'Warn',fn:()=>warnDialog(sid,m)},{icon:'list',label:'View cases',fn:()=>{caseFilter.user=m.id;caseFilter.name=m.display_name;go('/s/'+sid+'/settings/cases')}},'-',{head:'Timeout'},{label:'60 seconds',fn:()=>t(1)},{label:'10 minutes',fn:()=>t(10)},{label:'1 hour',fn:()=>t(60)},{label:'1 day',fn:()=>t(1440)},{label:'1 week',fn:()=>t(10080)})
if(m.timeout_until>Date.now())items.push({label:'Remove timeout',fn:()=>t(0)})
items.push('-')
}
if(can(sid,P.KICK))items.push({icon:'leave',label:'Kick',danger:true,fn:()=>reasonDialog('Kick '+m.display_name,'They can rejoin with a new invite.','Kick',async r=>{await POST(`/api/servers/${sid}/members/${m.id}/kick`,{reason:r});await loadMembers(sid,true)})})
if(can(sid,P.BAN))items.push({icon:'ban',label:'Ban',danger:true,fn:()=>reasonDialog('Ban '+m.display_name,'They will be removed and cannot rejoin until unbanned.','Ban',async r=>{await POST(`/api/servers/${sid}/members/${m.id}/ban`,{reason:r});await loadMembers(sid,true)})})
items.push({icon:'flag',label:'Report user',fn:()=>emit('ui:report',{type:'user',id:m.id})})
return items
}

export function openServerSettings(sid,page){go('/s/'+sid+'/settings'+(page?'/'+page:''))}

export function serverSettingsPage(sid,page,topBar,icon_){
const d0=S.sdata[sid]
const pages=[]
if(can(sid,P.MANAGE_SERVER))pages.push(['overview','Overview'])
if(can(sid,P.MANAGE_CHANNELS))pages.push(['channels','Channels'])
if(can(sid,P.MANAGE_ROLES))pages.push(['roles','Roles'])
if(can(sid,P.MANAGE_SERVER))pages.push(['emoji','Emoji'],['stickers','Stickers'],['automod','AutoMod and safety'],['hooks','Webhooks'],['template','Template'],['theme','Theme'])
pages.push(['members','Members'])
if(can(sid,P.CREATE_INVITE))pages.push(['invites','Invites'])
if(can(sid,P.BAN))pages.push(['bans','Bans'])
if(can(sid,P.BAN))pages.push(['appeals','Ban appeals'])
if(can(sid,P.MODERATE))pages.push(['cases','Mod cases'])
if(can(sid,P.MODERATE))pages.push(['reports','Reports'])
if(can(sid,P.MODERATE|P.MANAGE_SERVER|P.BAN|P.KICK))pages.push(['log','Audit log'])
if(d0.me.owner)pages.push(['program','Experimental program'])
if(d0.me.owner)pages.push(['danger','Ownership and deletion'])
let cur=pages.some(x=>x[0]===page)?page:pages[0][0]
const nav=h('nav',{'aria-label':'Server settings sections'})
const pg=h('div',{class:'pg'})
const dlg={close:()=>go('/s/'+sid)}
function draw(){
mount(nav,pages.map(([k,l])=>h('button',{class:cur===k?'on':'','aria-current':cur===k?'page':null,on:{click:()=>go('/s/'+sid+'/settings/'+k)}},l)),
h('button',{on:{click:()=>go('/s/'+sid)}},'Back to server'))
mount(pg)
const fn={overview,channels,roles,emoji,stickers,automod,hooks,template,theme,members,invites,bans,appeals,reports,log,danger,cases:casesPage,program:programPage}[cur]
fn(pg,sid,dlg,draw)
}
draw()
return{nodes:[topBar({lead:icon_('sliders'),title:d0.server.name,topic:'Server settings'}),h('div',{class:'split sp-page'},nav,pg)],title:d0.server.name+' settings • Parley'}
}

function overview(pg,sid){
const s=S.sdata[sid].server
const name=h('input',{class:'inp',value:s.name,maxLength:60})
const desc=h('textarea',{class:'inp',rows:3,maxLength:500},s.description||'')
const welcome=h('textarea',{class:'inp',rows:3,maxLength:1000},s.welcome||'')
const rules=h('textarea',{class:'inp',rows:4,maxLength:3000},s.rules||'')
const tag=h('input',{class:'inp',maxLength:4,value:s.tag||'',placeholder:'None','aria-label':'Server tag'})
const temo=h('input',{class:'inp',maxLength:8,value:s.tag_emoji||'',placeholder:'🙂','aria-label':'Tag emoji',style:{width:'80px'}})
const tprev=h('div')
let ticon=s.tag_icon_id||null
const drawTag=()=>mount(tprev,h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},h('span',{class:'hint'},'Preview'),gtag(tag.value.trim().toUpperCase()||'TAG',ticon?null:temo.value.trim(),ticon),h('button',{class:'btn sm',type:'button',on:{click:async()=>{
const f=await pickCropped({aspect:1,round:false,width:128,title:'Crop tag icon'});if(!f)return
try{const up=await uploadImage('server_icon',{server:sid},f);ticon=up.id;drawTag()}catch(e){fail(e)}
}}},'Upload image'),ticon?h('button',{class:'btn sm',type:'button',on:{click:()=>{ticon=null;drawTag()}}},'Remove image'):null))
tag.addEventListener('input',drawTag);temo.addEventListener('input',drawTag)
drawTag()
const cat=h('select',{class:'sel'},h('option',{value:''},'None'),CATEGORIES.map(c=>h('option',{value:c,selected:s.category===c},c[0].toUpperCase()+c.slice(1))))
const ver=h('select',{class:'sel'},[['0','None'],['1','Account must be older than 5 minutes'],['2','Account must be older than 10 minutes']].map(([v,l])=>h('option',{value:v,selected:String(s.verification)===v},l)))
let pub=!!s.is_public
let age=!!s.age_restricted,scan=!!s.scan_explicit,ext=!!s.block_ext_emoji
const ret=h('select',{class:'sel'},[['0','Keep forever'],['30','30 days'],['90','90 days'],['365','1 year']].map(([v,l])=>h('option',{value:v,selected:String(s.retention_days||0)===v},l)))
const scanBox=h('div')
const drawScan=()=>mount(scanBox,age?h('div',{class:'perm'},toggle(scan,v=>{scan=v},'Scan for explicit content'),h('span',null,'Remove explicit links and images, and block explicit text')):h('div',{class:'hint'},'Explicit text, links and images are always blocked in this server because it is not 18+ Only.'))
drawScan()
const ageRow=h('div',{class:'perm',style:{marginTop:'12px'}},toggle(age,async v=>{
if(v&&!S.me.adult_ok){
const yes=await confirmBox('Confirm your age','Servers marked 18+ Only are limited to members who say they are 18 or older. Do you confirm that you are 18 or older?','I am 18 or older')
if(!yes){age=false;overview(pg,sid);return}
try{const r=await POST('/api/me/adult',{confirm:true});S.me.adult_ok=r.adult_ok}catch(e){fail(e);age=false;overview(pg,sid);return}
}
age=v
if(!v)scan=false
drawScan()
},'18+ Only'),h('span',null,'18+ Only (members must confirm they are 18 or older to join)'))
const SW=['#8b949e','#521525','#57ab5a','#c69026','#e5534b','#986ee2','#c96198']
let accent=s.accent||''
const sws=h('div',{class:'swatches'})
const drawSw=()=>mount(sws,SW.map(c=>h('button',{type:'button',style:{background:c},'aria-pressed':String(accent===c),'aria-label':c,on:{click:()=>{accent=c;drawSw()}}})),h('button',{type:'button',class:'btn sm',on:{click:()=>{accent='';drawSw()}}},'None'))
drawSw()
const img=(kind,key,label)=>h('div',{class:'row'},s[key]?avatar({id:sid,icon_id:s[key],display_name:s.name},'sm'):null,h('button',{class:'btn sm',on:{click:async()=>{
const f=await pickCropped(kind==='server_icon'?{aspect:1,round:true,width:512,title:'Crop server icon'}:{aspect:16/9,width:1600,title:'Crop server banner'});if(!f)return
try{const up=await uploadImage(kind,{server:sid},f);await PATCH('/api/servers/'+sid,{[key]:up.id});await loadServer(sid);await loadServers();overview(pg,sid)}catch(e){fail(e)}
}}},'Upload '+label),s[key]?h('button',{class:'btn sm',on:{click:async()=>{try{await PATCH('/api/servers/'+sid,{[key]:null});await loadServer(sid);await loadServers();overview(pg,sid)}catch(e){fail(e)}}}},'Remove'):null)
mount(pg,h('h3',null,'Overview'),
field('Server name',name),field('Description',desc),field('Server tag',tag,'2 to 4 letters or numbers. Members can show it next to their name.'),field('Tag emoji',temo,'Optional. Shown before the tag. An uploaded image replaces it.'),tprev,field('Icon',img('server_icon','icon_id','icon')),field('Banner',img('server_banner','banner_id','banner')),field('Accent colour',sws),
field('Welcome message',welcome,'Shown to new members. Markdown is supported.'),field('Rules',rules,'Markdown is supported.'),
field('Discovery category',cat),
h('div',{class:'perm',style:{marginTop:'12px'}},toggle(pub,v=>{pub=v},'Listed in Discover'),h('span',null,'Listed in Discover (anyone can join without an invite)')),
field('Verification level',ver),ageRow,scanBox,
h('div',{class:'perm',style:{marginTop:'12px'}},toggle(ext,v=>{ext=v},'Only this server\'s emoji and stickers'),h('span',null,'Block emoji and stickers from other servers in messages here')),
field('Message retention',ret,'Older messages are removed automatically (pinned messages are kept). This cannot be undone.'),
h('div',{style:{marginTop:'16px'}},h('button',{class:'btn pri',on:{click:async()=>{
try{
await PATCH('/api/servers/'+sid,{name:name.value.trim(),tag:tag.value.trim(),tag_emoji:temo.value.trim(),tag_icon_id:ticon,description:desc.value.trim(),welcome:welcome.value.trim(),rules:rules.value.trim(),category:cat.value,is_public:pub,accent:accent||null,verification:+ver.value,age_restricted:age,scan_explicit:scan,block_ext_emoji:ext,retention_days:+ret.value})
await loadServer(sid);await loadServers();toast('Saved','ok')
}catch(e){fail(e)}
}}},'Save changes')))
}

function channels(pg,sid,dlg,redraw){
const d=S.sdata[sid]
const cats=[...d.categories].sort((a,b)=>a.position-b.position)
const byCat={}
for(const c of d.channels)(byCat[c.category_id||'_']||=[]).push(c)
const save=async()=>{
try{
await POST(`/api/servers/${sid}/reorder`,{channels:d.channels.map(c=>({id:c.id,position:c.position,category_id:c.category_id||null})),categories:d.categories.map(c=>({id:c.id,position:c.position}))})
await loadServer(sid)
redraw()
}catch(e){fail(e);await loadServer(sid);redraw()}
}
const moveChan=(c,dir)=>{
const list=(byCat[c.category_id||'_']||[]).sort((a,b)=>a.position-b.position)
const i=list.indexOf(c),j=i+dir
if(j<0||j>=list.length)return
const t=list[j].position
list[j].position=c.position===t?t+dir:c.position
c.position=t===list[j].position?t+dir:t
save()
}
const moveCat=(c,dir)=>{
const i=cats.indexOf(c),j=i+dir
if(j<0||j>=cats.length)return
const t=cats[j].position
cats[j].position=c.position
c.position=t
save()
}
const item=c=>h('div',{class:'li'},icon(c.type==='voice'?'volume':c.type==='announce'?'mega':'hash','s'),h('div',{class:'grow'},c.name),
h('button',{class:'ib',title:'Move up','aria-label':'Move '+c.name+' up',on:{click:()=>moveChan(c,-1)}},icon('down','s')),
h('button',{class:'ib',title:'Edit','aria-label':'Edit '+c.name,on:{click:()=>channelSettings(sid,c.id)}},icon('edit','s')))
mount(pg,h('h3',null,'Channels'),
h('div',{class:'row'},h('button',{class:'btn',on:{click:()=>emit('ui:newchannel',sid)}},icon('plus','s'),'Channel'),h('button',{class:'btn',on:{click:()=>emit('ui:newcategory',sid)}},icon('plus','s'),'Category')),
h('div',{class:'hint'},'Use the arrows to reorder within a category. To move a channel to another category, open it and change its category.'),
h('div',{class:'list'},(byCat._||[]).sort((a,b)=>a.position-b.position).map(item)),
cats.map(c=>h('div',null,h('div',{class:'cat'},h('span',null,c.name),
h('button',{class:'ib',title:'Move category up','aria-label':'Move category up',on:{click:()=>moveCat(c,-1)}},icon('down','s')),
h('button',{class:'ib',title:'Rename','aria-label':'Rename category',on:{click:()=>textDialog('Rename category','Name',c.name,async v=>{await PATCH(`/api/servers/${sid}/categories/${c.id}`,{name:v});await loadServer(sid);redraw()},40)}},icon('edit','s')),
h('button',{class:'ib dng',title:'Delete','aria-label':'Delete category',on:{click:async()=>{if(!await confirmBox('Delete category','Channels in it will be kept without a category.','Delete',true))return;try{await DEL(`/api/servers/${sid}/categories/${c.id}`);await loadServer(sid);redraw()}catch(e){fail(e)}}}},icon('trash','s'))),
h('div',{class:'list'},(byCat[c.id]||[]).sort((a,b)=>a.position-b.position).map(item)))))
}

const CHAN_PERMS=['VIEW','SEND','ATTACH','REACT','MENTION_ALL','CONNECT','MANAGE_MESSAGES','CREATE_INVITE']
const SLOW=[[0,'Off'],[5,'5 seconds'],[10,'10 seconds'],[15,'15 seconds'],[30,'30 seconds'],[60,'1 minute'],[120,'2 minutes'],[300,'5 minutes'],[600,'10 minutes'],[900,'15 minutes'],[1800,'30 minutes'],[3600,'1 hour'],[7200,'2 hours'],[21600,'6 hours']]

export function channelSettings(sid,cid){
const d=S.sdata[sid]
const ch=d.channels.find(c=>c.id===cid)
if(!ch)return
let tab='overview'
const body=h('div',{class:'bd'})
const dlg=dialog('#'+ch.name,body,{cls:'wide'})
function draw(){
const tabs=h('div',{class:'tabs'},[['overview','Overview'],['perms','Permissions']].map(([k,l])=>h('button',{class:tab===k?'on':'',on:{click:()=>{tab=k;draw()}}},l)))
const inner=h('div')
mount(body,tabs,inner)
if(tab==='overview')chanOverview(inner,sid,ch,dlg)
else chanPerms(inner,sid,ch)
}
draw()
}
function chanOverview(el,sid,ch,dlg){
const d=S.sdata[sid]
const name=h('input',{class:'inp',value:ch.name,maxLength:40})
const topic=h('input',{class:'inp',value:ch.topic||'',maxLength:200})
const cat=h('select',{class:'sel'},h('option',{value:''},'No category'),d.categories.map(c=>h('option',{value:c.id,selected:c.id===ch.category_id},c.name)))
const slow=h('select',{class:'sel'},SLOW.map(([v,l])=>h('option',{value:v,selected:ch.slowmode===v},l)))
let ro=!!ch.readonly,lock=!!ch.locked
mount(el,field('Name',name),field('Topic',topic),field('Category',cat),field('Slow mode',slow,'Members without Manage Messages or Manage Channels wait between messages.'),
ch.type!=='voice'?h('div',{class:'perm',style:{marginTop:'8px'}},toggle(ro,v=>{ro=v},'Read-only'),h('span',null,'Read-only (only members who can manage messages may post)')):null,
h('div',{class:'perm'},toggle(lock,v=>{lock=v},'Locked'),h('span',null,'Locked (members cannot send or react)')),
h('div',{class:'row sp',style:{marginTop:'16px'}},
h('button',{class:'btn dng',on:{click:async()=>{
if(!await confirmBox('Delete #'+ch.name,'All messages and files in this channel will be deleted.','Delete channel',true))return
try{await DEL('/api/channels/'+ch.id);await loadServer(sid);dlg.close();go('/s/'+sid)}catch(e){fail(e)}
}}},'Delete channel'),
h('button',{class:'btn pri',on:{click:async()=>{
try{
await PATCH('/api/channels/'+ch.id,{name:name.value.trim(),topic:topic.value.trim(),category_id:cat.value||null,slowmode:+slow.value,readonly:ro,locked:lock})
await loadServer(sid);toast('Saved','ok')
}catch(e){fail(e)}
}}},'Save changes')))
}
async function chanPerms(el,sid,ch){
mount(el,h('div',{class:'hint'},'Loading…'))
const d=S.sdata[sid]
let ovs
try{ovs=(await GET(`/api/channels/${ch.id}/overrides`)).overrides}catch(e){mount(el,h('div',{class:'err'},e.message));return}
const members=await loadMembers(sid).catch(()=>[])
let sel=ovs[0]?`${ovs[0].target_type}:${ovs[0].target_id}`:`role:${d.roles.find(r=>r.is_everyone)?.id}`
const label=(t,id)=>t==='role'?(d.roles.find(r=>r.id===id)?.name||'role'):(members.find(m=>m.id===id)?.display_name||S.users.get(id)?.display_name||id)
function draw(){
const[t,id]=sel.split(':')
const cur=ovs.find(o=>o.target_type===t&&o.target_id===id)||{target_type:t,target_id:id,allow:0,deny:0}
const state=bit=>cur.allow&bit?'allow':cur.deny&bit?'deny':'inherit'
const set=async(bit,v)=>{
let{allow,deny}=cur
allow&=~bit;deny&=~bit
if(v==='allow')allow|=bit
if(v==='deny')deny|=bit
try{
if(!allow&&!deny){await DEL(`/api/channels/${ch.id}/overrides/${t}/${id}`);ovs=ovs.filter(o=>o!==cur)}
else{
await PUT(`/api/channels/${ch.id}/overrides`,{target_type:t,target_id:id,allow,deny})
const n={target_type:t,target_id:id,allow,deny}
const i=ovs.findIndex(o=>o.target_type===t&&o.target_id===id)
if(i>=0)ovs[i]=n;else ovs.push(n)
}
await loadServer(sid)
draw()
}catch(e){fail(e);draw()}
}
const addRole=h('select',{class:'sel',style:{width:'auto'},on:{change:e=>{if(e.target.value){sel='role:'+e.target.value;draw()}}}},h('option',{value:''},'Add role…'),d.roles.map(r=>h('option',{value:r.id},r.name)))
const addMem=h('select',{class:'sel',style:{width:'auto'},on:{change:e=>{if(e.target.value){sel='user:'+e.target.value;draw()}}}},h('option',{value:''},'Add member…'),members.slice(0,200).map(m=>h('option',{value:m.id},m.display_name+' (@'+m.username+')')))
const targets=[...new Set([...ovs.map(o=>o.target_type+':'+o.target_id),sel])]
mount(el,h('p',{class:'hint'},'Overrides apply in this order: @everyone, then roles, then the member. Deny beats allow within a layer.'),
h('div',{class:'row',style:{flexWrap:'wrap',marginBottom:'8px'}},targets.map(k=>{const[tt,ii]=k.split(':');return h('button',{class:'btn sm'+(k===sel?' pri':''),on:{click:()=>{sel=k;draw()}}},(tt==='user'?'@':'')+label(tt,ii))}),addRole,addMem),
h('table',{class:'t'},h('tbody',null,CHAN_PERMS.map(n=>{
const bit=P[n]
const info=PERM_INFO.find(x=>x[0]===n)
const st=state(bit)
return h('tr',null,h('td',null,h('div',{style:{color:'var(--strong)'}},info[1]),h('div',{class:'hint',style:{margin:0}},info[2])),
h('td',{style:{whiteSpace:'nowrap'}},h('div',{class:'tabs',style:{margin:0}},[['deny','Deny'],['inherit','Inherit'],['allow','Allow']].map(([v,l])=>h('button',{class:st===v?'on':'','aria-pressed':String(st===v),'aria-label':`${info[1]}: ${l}`,on:{click:()=>set(bit,v)}},l)))))
}))))
}
draw()
}

function roles(pg,sid){
const d=S.sdata[sid]
let sel=d.roles.find(r=>!r.is_everyone)?.id||d.roles[0]?.id
const draw=()=>{
const list=[...d.roles].sort((a,b)=>b.position-a.position)
const r=d.roles.find(x=>x.id===sel)||list[0]
const name=h('input',{class:'inp',value:r.name,maxLength:32,disabled:!!r.is_everyone})
const col=h('input',{type:'color',value:r.color||'#8b949e',disabled:!!r.is_everyone,'aria-label':'Role colour',style:{width:'48px',height:'34px'}})
let perms=r.perms
const checks=PERM_INFO.map(([n,l,sub])=>{
const bit=P[n]
if(r.is_everyone&&(n==='ADMIN'))return null
return h('div',{class:'perm'},toggle(!!(perms&bit),v=>{perms=v?perms|bit:perms&~bit},l),h('div',null,h('div',{style:{color:'var(--strong)'}},l),h('div',{class:'hint',style:{margin:0}},sub)))
})
mount(pg,h('h3',null,'Roles'),
h('div',{class:'row',style:{alignItems:'flex-start',flexWrap:'wrap'}},
h('div',{style:{width:'200px'}},
h('button',{class:'btn',style:{width:'100%',marginBottom:'8px'},on:{click:async()=>{try{const x=await POST(`/api/servers/${sid}/roles`,{name:'New role',color:'#8b949e',perms:P.VIEW|P.SEND|P.REACT|P.ATTACH|P.CONNECT});await loadServer(sid);sel=x.id;draw()}catch(e){fail(e)}}}},icon('plus','s'),'Create role'),
h('div',{class:'list'},list.map(x=>h('button',{class:'ci'+(x.id===sel?' on':''),on:{click:()=>{sel=x.id;draw()}}},h('span',{style:{width:'10px',height:'10px',borderRadius:'50%',background:x.color||'var(--neutral)',flex:'none'}}),h('span',{class:'nm'},x.name))))),
h('div',{class:'grow',style:{minWidth:'260px'}},
field('Role name',name),field('Colour',col),
h('label',{class:'f'},'Permissions'),...checks,
h('div',{class:'row sp',style:{marginTop:'16px'}},
r.is_everyone?h('span'):h('button',{class:'btn dng',on:{click:async()=>{if(!await confirmBox('Delete role '+r.name,'Members lose this role.','Delete',true))return;try{await DEL(`/api/servers/${sid}/roles/${r.id}`);await loadServer(sid);sel=null;roles(pg,sid)}catch(e){fail(e)}}}},'Delete role'),
h('div',{class:'row'},
r.is_everyone?null:h('button',{class:'btn',title:'Raise',on:{click:async()=>{
const i=list.indexOf(r)
const up=list[i-1]
if(!up||up.is_everyone)return
try{await PATCH(`/api/servers/${sid}/roles/${r.id}`,{position:up.position});await PATCH(`/api/servers/${sid}/roles/${up.id}`,{position:r.position});await loadServer(sid);draw()}catch(e){fail(e);await loadServer(sid);draw()}
}}},'Move up'),
h('button',{class:'btn pri',on:{click:async()=>{
try{await PATCH(`/api/servers/${sid}/roles/${r.id}`,r.is_everyone?{perms}:{name:name.value.trim(),color:col.value,perms});await loadServer(sid);toast('Saved','ok');draw()}catch(e){fail(e)}
}}},'Save role'))))))
}
draw()
}

async function members(pg,sid){
const d=S.sdata[sid]
const q=h('input',{class:'inp',type:'search',placeholder:'Search members','aria-label':'Search members'})
const list=h('div',{class:'list'})
const roleMap=Object.fromEntries(d.roles.map(r=>[r.id,r]))
async function load(){
try{
const r=await GET(`/api/servers/${sid}/members?limit=100${q.value.trim()?'&q='+encodeURIComponent(q.value.trim()):''}`)
mount(list,r.members.map(m=>{
cacheUser({id:m.id,username:m.username,display_name:m.display_name,avatar_id:m.avatar_id,accent:m.accent})
const b=h('div',{class:'li'},avatar(m,'sm'),h('div',{class:'grow'},h('b',null,(m.nickname||m.display_name)+(m.id===d.server.owner_id?' (owner)':'')),h('small',null,'@'+m.username+' · '+m.roles.filter(id=>roleMap[id]).map(id=>roleMap[id].name).join(', '))),
m.timeout_until>Date.now()?h('span',{class:'hint',style:{margin:0}},'timed out'):null,
h('button',{class:'ib','aria-label':'Actions for '+m.display_name,title:'Actions',on:{click:e=>menuAt(e.currentTarget,memberMenu(sid,m))}},icon('more')))
return b
}))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
q.oninput=debounce(load,250)
mount(pg,h('h3',null,'Members'),q,list)
load()
}

function invites(pg,sid){
mount(pg,h('h3',null,'Invites'),h('button',{class:'btn pri',on:{click:()=>inviteDialog(sid)}},'Manage invites'))
}

async function bans(pg,sid){
mount(pg,h('h3',null,'Bans'),h('div',{class:'hint'},'Loading…'))
try{
const r=await GET(`/api/servers/${sid}/bans`)
mount(pg,h('h3',null,'Bans'),h('div',{class:'list'},r.bans.length?r.bans.map(b=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,b.display_name+' (@'+b.username+')'),h('small',null,(b.reason||'No reason')+' · '+fmtStamp(b.created_at))),h('button',{class:'btn sm',on:{click:async()=>{try{await DEL(`/api/servers/${sid}/bans/${b.user_id}`);bans(pg,sid)}catch(e){fail(e)}}}},'Unban'))):h('div',{class:'hint'},'No bans')))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}

async function appeals(pg,sid){
mount(pg,h('h3',null,'Ban appeals'),h('div',{class:'hint'},'Loading…'))
try{
const r=await GET(`/api/servers/${sid}/appeals`)
mount(pg,h('h3',null,'Ban appeals'),h('div',{class:'list'},r.appeals.length?r.appeals.map(a=>h('div',{class:'li',style:{alignItems:'flex-start'}},h('div',{class:'grow'},h('b',null,'@'+a.username),h('div',null,a.message),h('small',null,fmtStamp(a.created_at))),
h('button',{class:'btn sm',on:{click:async()=>{try{await POST(`/api/servers/${sid}/appeals/${a.id}`,{accept:true});appeals(pg,sid)}catch(e){fail(e)}}}},'Accept'),
h('button',{class:'btn sm dng',on:{click:async()=>{try{await POST(`/api/servers/${sid}/appeals/${a.id}`,{accept:false});appeals(pg,sid)}catch(e){fail(e)}}}},'Deny'))):h('div',{class:'hint'},'No open appeals')))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}

async function reports(pg,sid){
mount(pg,h('h3',null,'Reports'),h('div',{class:'hint'},'Loading…'))
try{
const r=await GET(`/api/servers/${sid}/reports`)
mount(pg,h('h3',null,'Open reports'),h('div',{class:'list'},r.reports.length?r.reports.map(x=>h('div',{class:'li',style:{alignItems:'flex-start'}},h('div',{class:'grow'},h('b',null,`${x.target_type} reported by @${x.reporter}`),h('div',null,x.reason),x.content?h('div',{class:'card',style:{margin:'4px 0',padding:'6px 8px'}},x.content.slice(0,300)):null,h('small',null,fmtStamp(x.created_at))),
h('button',{class:'btn sm',on:{click:async()=>{try{await POST(`/api/servers/${sid}/reports/${x.id}`,{});reports(pg,sid)}catch(e){fail(e)}}}},'Resolve'))):h('div',{class:'hint'},'No open reports')))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}

async function log(pg,sid){
mount(pg,h('h3',null,'Audit log'),h('div',{class:'hint'},'Loading…'))
try{
const r=await GET(`/api/servers/${sid}/modlog`)
mount(pg,h('h3',null,'Audit log'),h('table',{class:'t'},h('thead',null,h('tr',null,h('th',null,'When'),h('th',null,'Actor'),h('th',null,'Action'),h('th',null,'Detail'))),h('tbody',null,r.entries.map(e=>h('tr',null,h('td',null,fmtStamp(e.created_at)),h('td',null,'@'+e.actor),h('td',null,e.action),h('td',null,(e.detail||e.target_id||'').slice(0,80)))))),r.entries.length?null:h('div',{class:'hint'},'No entries'))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}

function danger(pg,sid,dlg){
const s=S.sdata[sid].server
const nm=h('input',{class:'inp',placeholder:'Type the server name to confirm','aria-label':'Server name'})
const target=h('input',{class:'inp',placeholder:'Username of the new owner','aria-label':'New owner username'})
mount(pg,h('h3',null,'Ownership and deletion'),
field('Transfer ownership',h('div',{class:'row'},target,h('button',{class:'btn',on:{click:async()=>{
try{
const u=await GET('/api/users/by-name/'+encodeURIComponent(target.value.trim().replace(/^@/,'')))
if(!await confirmBox('Transfer ownership','Transfer '+s.name+' to '+u.user.display_name+'? You will lose owner privileges.','Transfer',true))return
await POST(`/api/servers/${sid}/transfer`,{user_id:u.user.id})
await loadServer(sid);toast('Ownership transferred','ok');dlg.close()
}catch(e){fail(e)}
}}},'Transfer')),'The new owner must already be a member.'),
h('h3',{style:{marginTop:'28px',color:'var(--err)'}},'Delete server'),
h('p',null,'Deletes every channel, message and file in this server. This cannot be undone.'),
nm,
h('div',{style:{marginTop:'8px'}},h('button',{class:'btn dng',on:{click:async()=>{
try{
await POST(`/api/servers/${sid}/delete`,{name:nm.value})
await loadServers();delete S.sdata[sid];dlg.close();go('/')
}catch(e){fail(e)}
}}},'Delete server')))
}

const PRESETS=[['Midnight',{bg:'#0d1117',text:'#c9d1d9',accent:'#388bfd'}],['Forest',{bg:'#142018',text:'#cfe3d4',accent:'#3fa25a'}],['Sunset',{bg:'#2a1a1f',text:'#f0d9d2',accent:'#e0734a'}],['Grape',{bg:'#1d1630',text:'#ddd3f2',accent:'#9a6ee8'}],['Paper',{bg:'#f4f0e6',text:'#2b2a26',accent:'#a4472b'}]]
function theme(pg,sid){
const s=S.sdata[sid].server
const t0=s.theme||{}
let t={...t0}
const err=errBox()
const preview=()=>applyThemeObj(t)
const col=(k,label,def)=>h('label',{class:'row',style:{gap:'8px'}},h('input',{type:'color','aria-label':label,value:t[k]||def,on:{input:e=>{t[k]=e.target.value;preview()}}}),h('span',null,label),t[k]?h('button',{type:'button',class:'btn sm',on:{click:e=>{e.preventDefault();delete t[k];preview();theme(pg,sid)}}},'Clear'):null)
const dim=h('input',{type:'range',min:0,max:90,value:t.dim??55,'aria-label':'Background dim',on:{input:e=>{t.dim=+e.target.value;preview()}}})
mount(pg,h('h3',null,'Theme'),h('p',{class:'hint'},'Colours and a background image that apply only inside this server. Members see them whenever they open it, and their own theme comes back when they leave.'),
h('div',{class:'row',style:{flexWrap:'wrap'}},PRESETS.map(([n,v])=>h('button',{type:'button',class:'btn sm',on:{click:()=>{t={...t,...v};preview();theme(pg,sid)}}},n))),
col('bg','Background','#212829'),col('side','Sidebar','#1a2021'),col('panel','Panels','#293133'),col('text','Text','#bccacc'),col('accent','Accent','#521525'),
field('Background image',h('div',{class:'row'},h('button',{type:'button',class:'btn sm',on:{click:async()=>{
const f=await pickCropped({aspect:16/9,width:1920,title:'Crop background image'});if(!f)return
try{const up=await uploadImage('server_bg',{server:sid},f);t.image=up.id;preview();theme(pg,sid)}catch(e){fail(e)}
}}},'Upload image'),t.image?h('button',{type:'button',class:'btn sm',on:{click:()=>{delete t.image;preview();theme(pg,sid)}}},'Remove image'):null),t.image?'Darkening over the image':'PNG, JPEG, WebP or GIF'),
t.image?field('Image darkening',dim):null,
err,
h('div',{class:'row',style:{marginTop:'16px'}},h('button',{class:'btn pri',on:{click:async()=>{
err.textContent=''
try{await PATCH('/api/servers/'+sid,{theme:t});await loadServer(sid);applyServerTheme();toast('Theme saved','ok')}catch(e){err.textContent=e.message}
}}},'Save theme'),h('button',{class:'btn',on:{click:async()=>{
try{await PATCH('/api/servers/'+sid,{theme:null});await loadServer(sid);t={};applyServerTheme();theme(pg,sid);toast('Theme reset','ok')}catch(e){fail(e)}
}}},'Reset to default')))
}

function template(pg,sid){
const err=errBox()
const roles=h('input',{type:'checkbox',checked:true,id:'tpr'}),text=h('input',{type:'checkbox',id:'tpt'})
const file=h('input',{type:'file',accept:'application/json,.json','aria-label':'Template file'})
const out=h('div',{class:'hint'})
mount(pg,h('h3',null,'Template'),h('p',{class:'hint'},'Export the channels, categories and roles of this server as a JSON file, or add a template to this server. Applying only adds. Nothing is deleted or overwritten. Role permissions are not included.'),
h('div',{class:'row'},h('button',{class:'btn',on:{click:async()=>{
try{
const d=await GET(`/api/servers/${sid}/template`)
saveBlob(new Blob([JSON.stringify(d.layout,null,2)],{type:'application/json'}),'parley-template.json')
}catch(e){fail(e)}
}}},'Export template')),
h('h4',null,'Apply a template'),file,
h('label',{class:'row',for:'tpr'},roles,'Add its roles too'),
h('label',{class:'row',for:'tpt'},text,'Replace description, welcome and rules'),
err,
h('button',{class:'btn pri',on:{click:async e=>{
err.textContent=''
const f=file.files[0]
if(!f){err.textContent='Choose a template file';return}
if(f.size>200000){err.textContent='That file is too large';return}
const b=e.currentTarget
b.disabled=true
try{
let layout
try{layout=JSON.parse(await f.text())}catch{throw new Error('That file is not valid JSON')}
const r=await POST(`/api/servers/${sid}/template`,{layout,roles:roles.checked,text:text.checked})
await loadServer(sid)
out.textContent=`Added ${r.categories} categories, ${r.channels} channels and ${r.roles} roles`
}catch(x){err.textContent=x.message}
b.disabled=false
}}},'Apply'),out)
const sh=h('div',{style:{marginTop:'24px'}})
pg.append(sh)
templateShare(sh,sid)
}

function emoji(pg,sid){
const list=h('div',{class:'grid',style:{gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))'}})
const name=h('input',{class:'inp',maxLength:32,placeholder:'name','aria-label':'Emoji name'})
const err=errBox()
async function draw(items){
let e=items
if(!e){try{e=(await GET(`/api/servers/${sid}/emoji`)).emoji}catch(x){mount(list,h('div',{class:'err'},x.message));return}}
mount(list,e.length?e.map(x=>h('div',{class:'sc',style:{padding:'8px'}},h('div',{class:'row'},h('img',{src:fileUrl(x.file_id),alt:x.name,style:{width:'32px',height:'32px',objectFit:'contain'}}),h('code',null,':'+x.name+':')),h('button',{class:'btn sm dng',style:{marginTop:'6px'},on:{click:async()=>{if(!await confirmBox('Delete emoji','This also removes its reactions.','Delete',true))return;try{await DEL(`/api/servers/${sid}/emoji/${x.id}`);await loadServer(sid);draw()}catch(y){fail(y)}}}},'Delete'))):h('div',{class:'empty'},'No custom emoji yet'))
}
mount(pg,h('h3',null,'Custom emoji'),h('p',{class:'hint'},'Up to 50 per server, 1 MB each. PNG, GIF, WebP or JPEG. Members use them as :name: from the emoji picker.'),
h('div',{class:'row'},name,h('button',{class:'btn pri',on:{click:async()=>{
err.textContent=''
try{
const n=name.value.trim()
if(!n)throw new Error('Enter a name first')
const f=await pickImage()
if(!f)return
const up=await uploadImage('emoji',{server:sid},f)
const r=await POST(`/api/servers/${sid}/emoji`,{name:n,file_id:up.id})
name.value=''
await loadServer(sid)
draw(r.emoji)
}catch(x){err.textContent=x.message}
}}},icon('plus','s'),'Choose image and add')),err,list)
draw()
}

function automod(pg,sid){
const err=errBox()
const words=h('textarea',{class:'inp',rows:5,placeholder:'One blocked word or phrase per line'})
const mm=h('input',{class:'inp',type:'number',min:0,max:50,style:{width:'100px'}})
const rj=h('input',{class:'inp',type:'number',min:0,max:200,style:{width:'100px'}})
const tin=h('input',{class:'inp',maxLength:200,placeholder:'Type a message to check against these rules','aria-label':'Test message'})
const tout=h('div',{class:'hint'})
const testBox=h('div',{style:{margin:'8px 0 12px'}},h('div',{class:'row'},tin,h('button',{class:'btn',type:'button',on:{click:async()=>{
try{
await PUT(`/api/servers/${sid}/automod`,{words:words.value.split('\n'),block_links:links,max_mentions:parseInt(mm.value)||0,raid_joins:parseInt(rj.value)||0})
const r=await POST(`/api/servers/${sid}/automod/test`,{text:tin.value})
tout.textContent=r.blocked?'Blocked: '+r.reason:'Allowed. Nothing in the saved rules matches this message.'
}catch(x){tout.textContent=x.message}
}}},'Save and test')),tout)
const van=h('input',{class:'inp',maxLength:32,placeholder:'my-server',value:S.sdata[sid].server.vanity||''})
const lk=h('div')
const drawLock=async()=>{try{const l=await GET(`/api/servers/${sid}/lockdown`);mount(lk,l.lockdown_until?h('div',{class:'row'},h('span',null,'Joins are locked until '+fmtStamp(l.lockdown_until)),h('button',{class:'btn sm',on:{click:async()=>{try{await POST(`/api/servers/${sid}/lockdown`,{on:false});drawLock()}catch(e){fail(e)}}}},'Unlock')):h('button',{class:'btn sm',on:{click:async()=>{try{await POST(`/api/servers/${sid}/lockdown`,{on:true,minutes:60});drawLock()}catch(e){fail(e)}}}},'Lock new joins for 1 hour'))}catch(e){mount(lk,h('div',{class:'err'},e.message))}}
drawLock()
let links=false
const holder=h('div')
GET(`/api/servers/${sid}/automod`).then(d=>{
words.value=d.automod.words.join('\n')
mm.value=d.automod.max_mentions
rj.value=d.automod.raid_joins
links=d.automod.block_links
mount(holder,row('Block links','Messages containing http(s) links are rejected.',toggle(links,v=>{links=v},'Block links')))
},e=>mount(holder,h('div',{class:'err'},e.message)))
mount(pg,h('h3',null,'AutoMod'),h('p',{class:'hint'},'Word, link and mention rules run when a message is sent, edited or posted in a poll. Owners, admins and members with Manage Messages or Moderate are exempt from those rules, so test with the box below instead of your own account. Words of 4 or more letters also match with spaces, dots, dashes and look-alike characters (b4d w0rd), and shorter words only match as whole words. Servers that are not 18+ Only always block explicit content for everyone, including moderators.'),
field('Blocked words and phrases',words,'Up to 100 entries, 2 to 40 characters each.'),testBox,
field('Maximum mentions per message (0 = no limit)',mm),holder,
h('h4',{style:{marginTop:'16px'}},'Raid protection'),field('Lock joins when this many people join within a minute (0 = off)',rj,'The lock lasts 10 minutes. You can unlock earlier.'),lk,
h('h4',{style:{marginTop:'16px'}},'Vanity invite link'),field('Custom link',h('div',{class:'row'},h('span',{class:'hint',style:{margin:0}},location.host+'/invite/'),van,h('button',{class:'btn sm',on:{click:async()=>{try{const r=await PUT(`/api/servers/${sid}/vanity`,{slug:van.value.trim()||null});S.sdata[sid].server.vanity=r.vanity;toast('Vanity link saved','ok')}catch(e){fail(e)}}}},'Save')),'3 to 32 letters, numbers or dashes. Unlock vanity links for a server in Settings > Pars (25 Pars).'),err,
h('div',{style:{marginTop:'12px'}},h('button',{class:'btn pri',on:{click:async()=>{
err.textContent=''
try{
await PUT(`/api/servers/${sid}/automod`,{words:words.value.split('\n'),block_links:links,max_mentions:parseInt(mm.value)||0,raid_joins:parseInt(rj.value)||0})
toast('AutoMod saved','ok')
}catch(x){err.textContent=x.message}
}}},'Save')))
}

function hooks(pg,sid){
const d=S.sdata[sid]
const list=h('div',{class:'list'})
const out=h('div')
const chs=d.channels.filter(c=>c.type==='text'||c.type==='announce')
const sel=h('select',{class:'sel','aria-label':'Channel'},chs.map(c=>h('option',{value:c.id},'#'+c.name)))
const name=h('input',{class:'inp',maxLength:32,placeholder:'Webhook name','aria-label':'Webhook name'})
async function draw(){
try{
const r=await GET(`/api/servers/${sid}/webhooks`)
mount(list,r.webhooks.length?r.webhooks.map(w=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,w.name),h('small',null,'#'+(d.channels.find(c=>c.id===w.channel_id)?.name||'unknown'))),h('button',{class:'btn sm dng',on:{click:async()=>{if(!await confirmBox('Delete webhook','Anything posting to it will stop working.','Delete',true))return;try{await DEL(`/api/servers/${sid}/webhooks/${w.id}`);draw()}catch(e){fail(e)}}}},'Delete'))):h('div',{class:'empty'},'No webhooks'))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
mount(pg,h('h3',null,'Webhooks'),h('p',{class:'hint'},'A webhook lets an outside script post plain-text messages to a channel with a POST request. The URL contains a secret token that is shown once.'),
h('div',{class:'row'},name,sel,h('button',{class:'btn pri',on:{click:async()=>{
try{
const r=await POST(`/api/channels/${sel.value}/webhooks`,{name:name.value.trim()})
name.value=''
const url=location.origin+r.path
mount(out,h('div',{class:'card',style:{marginTop:'8px'}},h('p',{class:'hint',style:{margin:'0 0 6px'}},'Copy this URL now. It will not be shown again.'),h('code',{style:{wordBreak:'break-all',userSelect:'all'}},url),h('div',{style:{marginTop:'6px'}},h('button',{class:'btn sm',on:{click:()=>copyText(url)}},'Copy'))))
draw()
}catch(e){fail(e)}
}}},'Create')),out,list)
draw()
}

function stickers(pg,sid){
const list=h('div',{class:'stkgrid'})
const name=h('input',{class:'inp',maxLength:32,placeholder:'name','aria-label':'Sticker name'})
const err=errBox()
async function draw(){
try{
const r=await GET('/api/stickers')
const mine=(r.servers.find(x=>x.server_id===sid)||{stickers:[]}).stickers
mount(list,mine.length?mine.map(x=>h('div',{class:'stkc'},h('img',{src:fileUrl(x.file_id),alt:x.name}),h('div',null,x.name),h('button',{class:'btn sm dng',on:{click:async()=>{if(!await confirmBox('Delete sticker','It stops showing in past messages.','Delete',true))return;try{await DEL('/api/stickers/'+x.id);draw()}catch(e){fail(e)}}}},'Delete'))):h('div',{class:'empty'},'No server stickers yet'))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
mount(pg,h('h3',null,'Server stickers'),h('p',{class:'hint'},'Up to 60 per server, 2 MB each. PNG, GIF or WebP. Every member can send them, and members can use them in other servers too.'),
h('div',{class:'row'},name,h('button',{class:'btn pri',on:{click:async()=>{
err.textContent=''
try{
const n=name.value.trim()
if(n.length<2)throw new Error('Enter a name first')
const f=await pickImage()
if(!f)return
const up=await uploadImage('sticker',{server:sid},f)
await POST(`/api/servers/${sid}/stickers`,{name:n,file_id:up.id})
name.value=''
draw()
}catch(x){err.textContent=x.message}
}}},icon('plus','s'),'Choose image and add')),err,list)
draw()
}
