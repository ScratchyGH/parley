import{h,mount,icon,GET,POST,DEL,avatar,fail,fmtStamp,fmtRel,ctxMenu}from'./util.js'
import{render}from'./md.js'
import{S,on,emit,cacheUser,isDm,chanInfo,conv,convTitle,loadMembers,noteThread}from'./state.js'
import{go}from'./nav.js'
import{memberMenu}from'./ssettings.js'

function roomLabel(room){
if(isDm(room))return convTitle(conv(room))
const i=chanInfo(room)
return i?'#'+i.ch.name:'unknown'
}
export function gotoMessage(room,mid){
if(isDm(room))go(`/dm/${room}?m=${mid}`)
else{
const i=chanInfo(room)
if(i)go(`/s/${i.sid}/${room}?m=${mid}`)
}
}

function resultItem(m,showRoom){
cacheUser(m.author)
return h('div',{class:'card',style:{margin:'0 0 8px',padding:'8px 10px'}},
h('div',{class:'row'},avatar(m.author,'sm'),h('b',{style:{color:'var(--strong)'}},m.author.display_name),h('span',{class:'hint',style:{margin:'0'}},fmtStamp(m.created_at))),
showRoom?h('div',{class:'hint',style:{margin:'2px 0'}},roomLabel(m.room)):null,
h('div',{class:'mb',style:{margin:'4px 0',maxHeight:'120px',overflow:'hidden'}},render(m.content||(m.attachments?.length?'[attachment]':''),{})),
h('button',{class:'btn sm',on:{click:()=>gotoMessage(m.room,m.id)}},'Jump'))
}

export function pinsPanel(room){
const body=h('div',{class:'ctx-b'},h('div',{class:'hint'},'Loading…'))
GET(`/api/rooms/${room}/pins`).then(d=>mount(body,d.messages.length?d.messages.map(m=>resultItem(m,false)):h('div',{class:'empty'},'No pinned messages')),e=>mount(body,h('div',{class:'err'},e.message)))
return panelFrame('Pinned messages',body)
}

export function threadsPanel(room){
const info=chanInfo(room)
const body=h('div',{class:'ctx-b'},h('div',{class:'hint'},'Loading…'))
const show=async arch=>{
try{
const d=await GET(`/api/channels/${room}/threads?archived=${arch?1:0}`)
for(const t of d.threads)noteThread(t,info.sid)
mount(body,h('div',{class:'row',style:{marginBottom:'8px'}},h('button',{class:'btn sm'+(arch?'':' pri'),on:{click:()=>show(false)}},'Active'),h('button',{class:'btn sm'+(arch?' pri':''),on:{click:()=>show(true)}},'Archived')),
d.threads.length?d.threads.map(t=>h('button',{class:'ci',style:{flexDirection:'column',alignItems:'flex-start',height:'auto'},on:{click:()=>go(`/s/${info.sid}/${t.id}`)}},h('b',null,t.name),h('small',{class:'hint',style:{margin:'0'}},`${t.count} ${t.count===1?'reply':'replies'} · ${fmtRel(t.last_at)} · ${t.owner_name}`))):h('div',{class:'empty'},arch?'No archived threads':'No threads yet. Use the message menu to start one.'))
}catch(e){mount(body,h('div',{class:'err'},e.message))}
}
show(false)
return panelFrame('Threads',body)
}

export function savedPanel(){
const body=h('div',{class:'ctx-b'},h('div',{class:'hint'},'Loading…'))
GET('/api/saved').then(d=>mount(body,d.messages.length?d.messages.map(m=>{
const w=resultItem(m,true)
w.append(' ',h('button',{class:'btn sm',on:{click:async e=>{try{await DEL('/api/saved/'+m.id);w.remove()}catch(x){fail(x)}}}},'Remove'))
return w
}):h('div',{class:'empty'},'No saved messages')),e=>mount(body,h('div',{class:'err'},e.message)))
return panelFrame('Saved messages',body)
}

export function inboxPanel(){
const body=h('div',{class:'ctx-b'},h('div',{class:'hint'},'Loading…'))
const mark=async()=>{try{await POST('/api/notifications/read',{});S.notifN=0;emit('notifn');load()}catch(e){fail(e)}}
async function load(){
try{
const d=await GET('/api/notifications')
S.notifN=d.unread
emit('notifn')
mount(body,d.notifications.length?d.notifications.map(n=>{
const x=n.data
let text='',fn=null
if(n.type==='mention'){text=`${x.from} mentioned you in ${roomLabel(x.room)}`;fn=()=>gotoMessage(x.room,x.message_id)}
else if(n.type==='friend_request'){text=`${x.name} sent you a friend request`;fn=()=>go('/friends/pending')}
else text=n.type
return h('button',{class:'ci'+(n.read_at?'':' un'),style:{flexDirection:'column',alignItems:'flex-start',height:'auto'},on:{click:()=>{fn?.();POST('/api/notifications/read',{ids:[n.id]}).catch(()=>{})}}},h('span',null,text),h('small',{class:'hint',style:{margin:'0'}},fmtRel(n.created_at)))
}):h('div',{class:'empty'},'You are all caught up'))
}catch(e){mount(body,h('div',{class:'err'},e.message))}
}
load()
return panelFrame('Inbox',body,h('button',{class:'btn sm',on:{click:mark}},'Mark all read'))
}

export function searchPanel(room,initial){
const info=isDm(room)?null:chanInfo(room)
const results=h('div',{class:'ctx-b'},h('div',{class:'hint'},'Enter a search term. Matching is on message text.'))
const q=h('input',{class:'inp',type:'search',placeholder:'Search messages',value:initial||'','aria-label':'Search messages',autofocus:true})
const scope=h('select',{class:'sel','aria-label':'Search scope'},
h('option',{value:'room'},isDm(room)?'This conversation':'This channel'),
info?h('option',{value:'server'},'Entire server'):null,
isDm(room)?h('option',{value:'dm'},'All direct messages'):null)
const has=h('select',{class:'sel','aria-label':'Filter'},h('option',{value:''},'Any message'),h('option',{value:'attachment'},'Has attachment'),h('option',{value:'link'},'Has link'),h('option',{value:'pinned'},'Pinned only'))
let cursor=null
async function run(more){
const text=q.value.trim()
if(!text&&!has.value){mount(results,h('div',{class:'hint'},'Enter a search term.'));return}
const p=new URLSearchParams({scope:scope.value,q:text})
if(scope.value==='room')p.set('room',room)
if(scope.value==='server')p.set('server',info.sid)
if(has.value==='pinned')p.set('pinned','1');else if(has.value)p.set('has',has.value)
if(more&&cursor)p.set('cursor',cursor)
try{
const d=await GET('/api/search?'+p)
cursor=d.next
const items=d.messages.map(m=>resultItem(m,scope.value!=='room'))
if(more){results.querySelector('.more')?.remove();results.append(...items)}
else mount(results,items.length?items:h('div',{class:'empty'},'No results'))
if(d.next)results.append(h('button',{class:'btn sm more',on:{click:()=>run(true)}},'Load more'))
}catch(e){mount(results,h('div',{class:'err'},e.message))}
}
const form=h('form',{style:{padding:'8px',display:'flex',flexDirection:'column',gap:'6px',borderBottom:'1px solid var(--border)'},on:{submit:e=>{e.preventDefault();run(false)}}},q,h('div',{class:'row'},scope,has),h('button',{class:'btn pri',type:'submit'},icon('search','s'),'Search'))
if(initial)setTimeout(()=>run(false),0)
return panelFrame('Search',h('div',{style:{display:'flex',flexDirection:'column',minHeight:'0',flex:'1'}},form,results))
}

export function membersPanel(target){
const body=h('div',{class:'ctx-b'})
const draw=()=>{
if(isDm(target)){
const c=conv(target)
mount(body,h('div',{class:'cat'},h('span',null,'Members — '+(c?.members.length||0))),(c?.members||[]).map(u=>memberRow(u,null,null)))
return
}
const info=chanInfo(target)
const sid=info?.sid||target
const d=S.sdata[sid]
const list=d?.memberList
if(!list){mount(body,h('div',{class:'hint'},'Loading…'));loadMembers(sid).catch(fail);return}
const roleMap=Object.fromEntries(d.roles.map(r=>[r.id,r]))
const colorOf=m=>{
let best=null
for(const id of m.roles){const r=roleMap[id];if(r&&r.color&&(!best||r.position>best.position))best=r}
return best?.color||null
}
const sorted=[...list].sort((a,b)=>(a.nickname||a.display_name).localeCompare(b.nickname||b.display_name))
const isOn=m=>m.id===S.me.id?S.me.presence!=='invisible':!!S.pres[m.id]
const online=sorted.filter(isOn),off=sorted.filter(m=>!isOn(m))
mount(body,h('div',{class:'cat'},h('span',null,'Online — '+online.length)),online.map(m=>memberRow(m,sid,colorOf(m))),h('div',{class:'cat'},h('span',null,'Offline — '+off.length)),off.map(m=>memberRow(m,sid,colorOf(m),true)))
}
const row=panelFrame('Members',body)
row.__draw=draw
draw()
return row
}
function memberRow(m,sid,color,off){
const st=m.id===S.me.id?(S.me.presence==='invisible'?null:S.me.presence):S.pres[m.id]
const name=m.nickname||m.display_name
const b=h('button',{class:'mem'+(off?' off':''),on:{click:e=>emit('ui:profile',{id:m.id,x:e.clientX,y:e.clientY,el:b,sid}),contextmenu:e=>{if(sid)ctxMenu(e,memberMenu(sid,m))}}},avatar(m,'sm',off?null:st||'online'),h('span',{style:color?{color}:{}},name),m.timeout_until>Date.now()?icon('clock','s'):null)
return b
}

function panelFrame(title,body,extra){
return h('aside',{class:'panel',style:{width:'300px'},'aria-label':title},
h('div',{class:'ctx-h'},h('span',null,title),extra||null,h('button',{class:'ib',title:'Close panel','aria-label':'Close panel',on:{click:()=>emit('ui:panel',null)}},icon('x'))),
body)
}
