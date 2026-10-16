import{h,mount,icon,GET,POST,PATCH,DEL,upload,avatar,accentBg,toast,fail,dialog,confirmBox,field,toggle,copyText,popup,menu,closeMenu,fmtRel}from'./util.js'
import{render}from'./md.js'
import{S,emit,cacheUser,user,conv,convTitle,convOther,can,loadServers,loadServer,loadConvs,loadFriends}from'./state.js'
import{go}from'./nav.js'
import{memberMenu}from'./ssettings.js'
import{pickCropped}from'./cropper.js'

export const CATEGORIES=['gaming','tech','art','music','education','science','community','other']

function errBox(){return h('div',{class:'err',role:'alert'})}
function submitter(btn,err,fn){
return async e=>{
e?.preventDefault?.()
err.textContent=''
btn.disabled=true
try{await fn()}catch(x){err.textContent=x.message;btn.disabled=false}
}
}

export function pickImage(accept='image/png,image/jpeg,image/webp,image/gif'){
return new Promise(res=>{
const i=h('input',{type:'file',accept,style:{display:'none'}})
i.onchange=()=>res(i.files[0]||null)
i.oncancel=()=>res(null)
document.body.append(i)
i.click()
setTimeout(()=>i.remove(),60000)
})
}
export async function uploadImage(kind,params,file){
const t=toast('Uploading…')
try{
const d=await upload(file,{kind,...params})
return d
}finally{t.remove()}
}

export function createServerDialog(){
let tab='create'
const body=h('div',{class:'bd'})
const d=dialog('Add a server',body,{})
draw()
function draw(){
const tabs=h('div',{class:'tabs'},...[['create','Create'],['join','Join with invite']].map(([k,l])=>h('button',{class:tab===k?'on':'',on:{click:()=>{tab=k;draw()}}},l)))
if(tab==='create'){
const err=errBox()
const name=h('input',{class:'inp',maxLength:60,required:true,autofocus:true,placeholder:`${S.me.display_name}'s server`})
const desc=h('input',{class:'inp',maxLength:500})
const cat=h('select',{class:'sel'},h('option',{value:''},'None'),CATEGORIES.map(c=>h('option',{value:c},c[0].toUpperCase()+c.slice(1))))
let pub=false
const btn=h('button',{class:'btn pri',type:'submit'},'Create server')
mount(body,tabs,h('form',{on:{submit:submitter(btn,err,async()=>{
const r=await POST('/api/servers',{name:name.value.trim(),description:desc.value.trim(),is_public:pub,category:cat.value})
await loadServers()
d.close()
go(`/s/${r.id}/${r.default_channel}`)
})}},field('Server name',name),field('Description (optional)',desc),field('Category',cat),
h('div',{class:'perm',style:{marginTop:'12px'}},toggle(false,v=>{pub=v},'List in Discover'),h('span',null,'List in Discover (anyone can join)')),
err,h('div',{class:'row',style:{justifyContent:'flex-end'}},h('button',{class:'btn',type:'button',on:{click:()=>d.close()}},'Cancel'),btn)))
}else{
const err=errBox()
const code=h('input',{class:'inp',placeholder:'Invite link or code',autofocus:true})
const btn=h('button',{class:'btn pri',type:'submit'},'Continue')
mount(body,tabs,h('form',{on:{submit:submitter(btn,err,async()=>{
const c=code.value.trim().split('/').filter(Boolean).pop()
if(!c)throw new Error('Enter an invite code')
d.close()
inviteJoinDialog(c)
})}},field('Invite',code),err,h('div',{class:'row',style:{justifyContent:'flex-end'}},btn)))
}
}
return d
}

export async function inviteJoinDialog(code){
const body=h('div',{class:'bd'},h('div',{class:'hint'},'Loading invite…'))
const d=dialog('Server invite',body,{})
try{
const inv=await GET('/api/invites/'+encodeURIComponent(code))
const already=S.servers.find(s=>s.id===inv.server.id)
const err=errBox()
const btn=h('button',{class:'btn pri',on:{click:async()=>{
if(already){d.close();go('/s/'+already.id);return}
btn.disabled=true
try{
const r=await POST(`/api/invites/${encodeURIComponent(code)}/join`,{})
await loadServers()
d.close()
go('/s/'+r.server_id)
}catch(e){err.textContent=e.message;btn.disabled=false}
}}},already?'Open server':'Accept invite')
mount(body,h('div',{class:'row'},avatar({id:inv.server.id,name:inv.server.name,icon_id:inv.server.icon_id,display_name:inv.server.name},'lg'),h('div',null,h('h3',{style:{margin:0,color:'var(--strong)'}},inv.server.name),h('div',{class:'hint'},inv.members+' members'+(inv.inviter?' · invited by '+inv.inviter:'')))),inv.server.description?h('p',null,inv.server.description):null,err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},h('button',{class:'btn',on:{click:d.close}},'Cancel'),btn))
}catch(e){mount(body,h('div',{class:'err'},e.message),h('div',{class:'row',style:{justifyContent:'flex-end'}},h('button',{class:'btn',on:{click:d.close}},'Close')))}
}

export async function inviteDialog(sid){
const body=h('div',{class:'bd'})
const d=dialog('Invite people',body,{})
const list=h('div',{class:'list'})
const err=errBox()
const age=h('select',{class:'sel'},[['1','1 hour'],['24','1 day'],['168','7 days'],['720','30 days'],['0','Never']].map(([v,l])=>h('option',{value:v,selected:v==='168'},l)))
const uses=h('select',{class:'sel'},[['0','Unlimited'],['1','1 use'],['5','5 uses'],['10','10 uses'],['25','25 uses'],['100','100 uses']].map(([v,l])=>h('option',{value:v},l)))
const out=h('div')
const link=c=>`${location.origin}/invite/${c}`
async function load(){
try{
const r=await GET(`/api/servers/${sid}/invites`)
mount(list,r.invites.length?r.invites.map(i=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,i.code),h('small',null,`${i.uses||0}${i.max_uses?'/'+i.max_uses:''} uses · ${i.expires_at?'expires '+fmtRel(i.expires_at).replace(' ago',' (past)'):'never expires'}`)),
h('button',{class:'ib',title:'Copy link','aria-label':'Copy link',on:{click:()=>copyText(link(i.code))}},icon('copy')),
h('button',{class:'ib dng',title:'Revoke','aria-label':'Revoke invite',on:{click:async()=>{try{await DEL('/api/invites/'+i.code);load()}catch(e){fail(e)}}}},icon('trash')))):h('div',{class:'hint'},'No active invites'))
}catch(e){mount(list,h('div',{class:'hint'},'Only people with the Manage Server permission can see existing invites.'))}
}
const btn=h('button',{class:'btn pri'},'Create invite link')
btn.onclick=submitter(btn,err,async()=>{
const r=await POST(`/api/servers/${sid}/invites`,{max_age_hours:+age.value,max_uses:+uses.value||null})
mount(out,h('div',{class:'row',style:{marginTop:'8px'}},h('input',{class:'inp',readOnly:true,value:link(r.code),'aria-label':'Invite link',on:{focus:e=>e.target.select()}}),h('button',{class:'btn',on:{click:()=>copyText(link(r.code))}},'Copy')))
btn.disabled=false
load()
})
mount(body,h('div',{class:'row'},field('Expires after',age),field('Max uses',uses)),h('div',{style:{marginTop:'12px'}},btn),err,out,h('label',{class:'f'},'Active invites'),list)
load()
}

export function channelDialog(sid,categoryId){
const d0=S.sdata[sid]
const err=errBox()
const name=h('input',{class:'inp',maxLength:40,required:true,autofocus:true,placeholder:'new-channel'})
const type=h('select',{class:'sel'},h('option',{value:'text'},'Text'),h('option',{value:'announce'},'Announcement (read-only for most members)'),h('option',{value:'voice'},'Voice'),h('option',{value:'forum'},'Forum (one thread per post)'))
const topic=h('input',{class:'inp',maxLength:200})
const cat=h('select',{class:'sel'},h('option',{value:''},'No category'),d0.categories.map(c=>h('option',{value:c.id,selected:c.id===categoryId},c.name)))
const btn=h('button',{class:'btn pri',type:'submit'},'Create channel')
const form=h('form',{on:{submit:submitter(btn,err,async()=>{
const r=await POST(`/api/servers/${sid}/channels`,{name:name.value.trim(),type:type.value,topic:topic.value.trim(),category_id:cat.value||null})
await loadServer(sid)
d.close()
go(`/s/${sid}/${r.id}`)
})}},field('Channel name',name),field('Type',type),field('Topic (optional)',topic),field('Category',cat),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},btn))
const d=dialog('Create channel',h('div',{class:'bd'},form),{})
}
export function categoryDialog(sid){
const err=errBox()
const name=h('input',{class:'inp',maxLength:40,required:true,autofocus:true})
const btn=h('button',{class:'btn pri',type:'submit'},'Create category')
const d=dialog('Create category',h('div',{class:'bd'},h('form',{on:{submit:submitter(btn,err,async()=>{await POST(`/api/servers/${sid}/categories`,{name:name.value.trim()});await loadServer(sid);d.close()})}},field('Category name',name),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},btn))),{})
}

export async function openDm(userId){
const r=await POST('/api/conversations',{user_id:userId})
await loadConvs()
go('/dm/'+r.id)
}

export async function newDmDialog(){
const picked=new Set()
const body=h('div',{class:'bd'})
const d=dialog('New message',body,{})
if(!S.fr.friends.length)await loadFriends().catch(()=>{})
const err=errBox()
const groupName=h('input',{class:'inp',maxLength:50,placeholder:'Group name (optional)'})
const q=h('input',{class:'inp',placeholder:'Search friends or type a username',autofocus:true,'aria-label':'Search friends'})
const list=h('div',{class:'list',style:{maxHeight:'260px',overflow:'auto',margin:'8px 0'}})
const go_=h('button',{class:'btn pri',disabled:true},'Start conversation')
function draw(){
const t=q.value.trim().toLowerCase()
const fs=S.fr.friends.filter(u=>!t||u.display_name.toLowerCase().includes(t)||u.username.toLowerCase().includes(t))
mount(list,fs.map(u=>{
const cb=h('input',{type:'checkbox',checked:picked.has(u.id),id:'f'+u.id,on:{change:e=>{e.target.checked?picked.add(u.id):picked.delete(u.id);upd()}}})
return h('label',{class:'li',for:'f'+u.id,style:{cursor:'pointer'}},cb,avatar(u,'sm'),h('div',{class:'grow'},h('b',null,u.display_name),h('small',null,'@'+u.username)))
}),!fs.length?h('div',{class:'hint'},t?`No friends match. Press Enter to message @${t} directly.`:'You have no friends yet. Type a username to message someone directly.'):null)
}
function upd(){
go_.disabled=!picked.size&&!q.value.trim()
go_.textContent=picked.size>1?'Create group':'Start conversation'
}
q.oninput=()=>{draw();upd()}
go_.onclick=submitter(go_,err,async()=>{
if(picked.size>=2){
const r=await POST('/api/conversations/group',{user_ids:[...picked],name:groupName.value.trim()||undefined})
await loadConvs();d.close();go('/dm/'+r.id)
}else if(picked.size===1){
await openDm([...picked][0]);d.close()
}else{
const u=await GET('/api/users/by-name/'+encodeURIComponent(q.value.trim().replace(/^@/,'')))
await openDm(u.user.id);d.close()
}
})
q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(!go_.disabled)go_.click()}}
mount(body,q,list,picked.size>1?groupName:h('div',{class:'hint'},'Select two or more friends to create a group (up to 10 members).'),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},go_))
draw()
}

export function quickSwitcher(){
const input=h('input',{class:'inp',placeholder:'Where would you like to go?','aria-label':'Quick switcher',autofocus:true})
const list=h('div',{class:'list',role:'listbox',style:{maxHeight:'50vh',overflow:'auto',marginTop:'8px'}})
const body=h('div',{class:'bd'},input,list)
const d=dialog('Quick switcher',body,{bare:true})
let items=[],idx=0
const all=()=>{
const out=[]
for(const s of S.servers){
out.push({label:s.name,sub:'Server',icon:'compass',path:'/s/'+s.id})
const dd=S.sdata[s.id]
if(dd)for(const c of dd.channels)out.push({label:c.name,sub:s.name,icon:c.type==='voice'?'volume':'hash',path:`/s/${s.id}/${c.id}`})
}
for(const c of S.convs)out.push({label:convTitle(c),sub:'Direct message',icon:c.type==='group'?'users':'chat',path:'/dm/'+c.id,av:convOther(c)})
for(const u of S.fr.friends)out.push({label:u.display_name,sub:'@'+u.username,icon:'user',fn:()=>openDm(u.id)})
return out
}
const pool=all()
function draw(){
const t=input.value.trim().toLowerCase().replace(/^[#@]/,'')
items=(t?pool.filter(x=>x.label.toLowerCase().includes(t)||x.sub.toLowerCase().includes(t)).sort((a,b)=>(b.label.toLowerCase().startsWith(t)?1:0)-(a.label.toLowerCase().startsWith(t)?1:0)):pool).slice(0,30)
if(idx>=items.length)idx=0
mount(list,items.map((it,i)=>h('button',{class:'ci'+(i===idx?' on':''),role:'option','aria-selected':String(i===idx),style:{padding:'6px 10px'},on:{click:()=>pick(it),mousemove:()=>{if(idx!==i){idx=i;draw()}}}},it.av?avatar(it.av,'sm'):icon(it.icon,'s'),h('span',{class:'nm'},it.label),h('small',{class:'hint',style:{margin:0}},it.sub))),!items.length?h('div',{class:'hint',style:{padding:'8px'}},'No matches'):null)
list.querySelector('.on')?.scrollIntoView({block:'nearest'})
}
function pick(it){d.close();if(it.fn)it.fn().catch(fail);else go(it.path)}
input.oninput=()=>{idx=0;draw()}
input.onkeydown=e=>{
if(e.key==='ArrowDown'){e.preventDefault();idx=(idx+1)%Math.max(1,items.length);draw()}
else if(e.key==='ArrowUp'){e.preventDefault();idx=(idx-1+items.length)%Math.max(1,items.length);draw()}
else if(e.key==='Enter'&&items[idx]){e.preventDefault();pick(items[idx])}
}
draw()
}

export async function profileCard({id,x,y,sid}){
let data
try{data=await GET('/api/users/'+id)}catch(e){fail(e);return}
const u=cacheUser(data.user)
const rel=data.relationship
const own=u.id===S.me.id
const el=h('div',{class:'pcard'})
const act=h('div',{class:'row',style:{flexWrap:'wrap',marginTop:'10px'}})
const refresh=async()=>{await loadFriends();closeMenu();profileCard({id,x,y,sid})}
const btn=(label,fn,cls='')=>h('button',{class:'btn sm '+cls,on:{click:async()=>{try{await fn()}catch(e){fail(e)}}}},label)
if(own)act.append(btn('Edit profile',()=>{closeMenu();emit('ui:settings','profile')}))
else{
act.append(btn('Message',async()=>{closeMenu();await openDm(u.id)},'pri'))
if(rel.friend)act.append(btn('Remove friend',async()=>{await DEL('/api/friends/'+u.id);refresh()}))
else if(rel.pending==='incoming')act.append(btn('Accept request',async()=>{await POST(`/api/friends/${u.id}/accept`,{});refresh()}))
else if(rel.pending==='outgoing')act.append(btn('Cancel request',async()=>{await DEL('/api/friends/'+u.id);refresh()}))
else act.append(btn('Add friend',async()=>{await POST('/api/friends/request',{username:u.username});toast('Friend request sent','ok');refresh()}))
act.append(btn(rel.blocked?'Unblock':'Block',async()=>{if(rel.blocked)await DEL('/api/blocks/'+u.id);else{if(!await confirmBox('Block '+u.display_name,'They will not be able to message you or call you, and you will not see their direct messages.','Block',true))return;await POST('/api/blocks/'+u.id,{})}refresh()}))
}
const hero=h('div',{class:'hero',style:{background:accentBg(u.accent)||'var(--surf2)'}})
if(u.banner_id)hero.style.backgroundImage=`url(/api/files/${u.banner_id})`
const mem=sid?S.sdata[sid]?.memberList?.find(m=>m.id===u.id):null
el.append(hero,h('div',{class:'bd'},avatar(u,'lg',S.pres[u.id]||(own?S.me.presence:null)),
h('h3',{style:{margin:'8px 0 0',color:'var(--strong)'}},mem?.nickname||u.display_name),
h('div',{class:'hint',style:{margin:0}},'@'+u.username+(u.pronouns?' · '+u.pronouns:'')),
u.status_text?h('div',{style:{margin:'6px 0'}},u.status_text):null,
u.bio?h('div',{class:'mb',style:{margin:'8px 0',maxHeight:'120px',overflow:'auto'}},render(u.bio,{})):null,
h('div',{class:'hint'},`${data.mutual_servers} mutual server${data.mutual_servers===1?'':'s'} · Joined ${new Date(u.created_at).toLocaleDateString()}`),
act,
!own?h('div',{class:'row',style:{marginTop:'8px'}},btn('Report user',()=>{closeMenu();emit('ui:report',{type:'user',id:u.id})}),sid&&mem?btn('Moderation',()=>{closeMenu();const items=memberMenu(sid,mem);menu(items,x,y)}):null):null))
popup(el,Math.min(x,innerWidth-310),Math.min(y,innerHeight-380),'')
}

export function reportDialog({type,id}){
const err=errBox()
const reason=h('textarea',{class:'inp',rows:4,maxLength:1000,required:true,autofocus:true,placeholder:'What is wrong? Moderators will see this together with the reported content.'})
const btn=h('button',{class:'btn pri',type:'submit'},'Submit report')
const d=dialog('Report '+type,h('div',{class:'bd'},h('form',{on:{submit:submitter(btn,err,async()=>{
if(reason.value.trim().length<5)throw new Error('Please describe the problem (at least 5 characters)')
await POST('/api/reports',{type,id,reason:reason.value.trim()})
d.close()
toast('Report sent to the moderators','ok')
})}},field('Reason',reason),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},btn))),{})
}

export function shortcutsDialog(){
const rows=[
['Ctrl/Cmd + K','Quick switcher'],
['Ctrl/Cmd + /','Show this list'],
['Ctrl/Cmd + ,','User settings'],
['Ctrl/Cmd + Shift + F','Search messages'],
['Alt + Up / Down','Previous / next channel'],
['Alt + Shift + Up / Down','Previous / next unread channel'],
['Ctrl/Cmd + Shift + M','Mute / unmute in voice'],
['Ctrl/Cmd + Shift + D','Deafen / undeafen in voice'],
['Esc','Close dialog, menu or cancel reply / edit'],
['Enter / Shift + Enter','Send / new line'],
['Up (empty box)','Edit your last message'],
['Ctrl/Cmd + B / I','Bold / italic'],
['@ then name','Mention autocomplete']
]
dialog('Keyboard shortcuts',h('div',{class:'bd'},h('table',{class:'t'},h('tbody',null,rows.map(([k,v])=>h('tr',null,h('td',null,h('span',{class:'kbd'},k)),h('td',null,v)))))),{})
}

export async function groupSettingsDialog(room){
const c=conv(room)
if(!c)return
const owner=c.owner_id===S.me.id
const body=h('div',{class:'bd'})
const d=dialog('Group settings',body,{})
if(!S.fr.friends.length)await loadFriends().catch(()=>{})
const err=errBox()
const name=h('input',{class:'inp',maxLength:50,value:c.name||'',disabled:!owner})
function draw(){
const cur=conv(room)
if(!cur){d.close();return}
const memberIds=new Set(cur.members.map(m=>m.id))
mount(body,
field('Group name',h('div',{class:'row'},name,owner?h('button',{class:'btn',on:{click:async()=>{try{await PATCH('/api/conversations/'+room,{name:name.value.trim()});await loadConvs();toast('Saved','ok')}catch(e){fail(e)}}}},'Save'):null)),
owner?field('Group icon',h('div',{class:'row'},avatar({id:room,name:convTitle(cur),icon_id:cur.icon_id},'sm'),h('button',{class:'btn sm',on:{click:async()=>{
const f=await pickCropped({aspect:1,round:true,width:512,title:'Crop group icon'});if(!f)return
try{const up=await uploadImage('conv_icon',{room},f);await PATCH('/api/conversations/'+room,{icon_id:up.id});await loadConvs();draw()}catch(e){fail(e)}
}}},'Upload'),cur.icon_id?h('button',{class:'btn sm',on:{click:async()=>{try{await PATCH('/api/conversations/'+room,{icon_id:null});await loadConvs();draw()}catch(e){fail(e)}}}},'Remove'):null)):null,
h('label',{class:'f'},`Members (${cur.members.length}/10)`),
h('div',{class:'list'},cur.members.map(m=>h('div',{class:'li'},avatar(m,'sm'),h('div',{class:'grow'},h('b',null,m.display_name+(m.id===cur.owner_id?' (owner)':'')),h('small',null,'@'+m.username)),
owner&&m.id!==S.me.id?h('button',{class:'btn sm dng',on:{click:async()=>{try{await DEL(`/api/conversations/${room}/members/${m.id}`);await loadConvs();draw()}catch(e){fail(e)}}}},'Remove'):null))),
owner?h('div',null,h('label',{class:'f'},'Add a friend'),h('div',{class:'list',style:{maxHeight:'140px',overflow:'auto'}},S.fr.friends.filter(f=>!memberIds.has(f.id)).map(f=>h('div',{class:'li'},avatar(f,'sm'),h('div',{class:'grow'},f.display_name),h('button',{class:'btn sm',on:{click:async()=>{try{await POST(`/api/conversations/${room}/members`,{user_id:f.id});await loadConvs();draw()}catch(e){fail(e)}}}},'Add'))))):null,
err,
h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'16px'}},h('button',{class:'btn dng',on:{click:async()=>{
if(!await confirmBox('Leave group','You will stop receiving messages from this group.','Leave',true))return
try{await DEL(`/api/conversations/${room}/members/${S.me.id}`);await loadConvs();d.close();go('/')}catch(e){fail(e)}
}}},'Leave group')))
}
draw()
}
