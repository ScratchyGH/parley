import{h,mount,icon,GET,POST,DEL,avatar,toast,fail,field,debounce,dialog,fmtRel,rid}from'./util.js'
import{S,on,emit,loadFriends,loadServers,noteThread,P,can}from'./state.js'
import{go}from'./nav.js'
import{openDm,CATEGORIES,inviteDialog}from'./dialogs.js'
import{topBar}from'./shell.js'

export function friendsPage(tab){
let cur=['all','pending','blocked','add'].includes(tab)?tab:'all'
const body=h('div',{class:'pgh'})
const nav=h('div',{class:'tabs',style:{margin:0}})
const bar=topBar({lead:icon('users'),title:'Friends',topic:'',actions:nav})
function draw(){
const inc=S.fr.incoming.length
mount(nav,[['all','All'],['pending','Pending'+(inc?` (${inc})`:'')],['blocked','Blocked'],['add','Add friend']].map(([k,l])=>h('button',{class:cur===k?'on':'','aria-pressed':String(cur===k),style:{padding:'4px 10px'},on:{click:()=>{cur=k;history.replaceState(null,'','/friends/'+k);draw()}}},l)))
const person=(u,actions)=>h('div',{class:'li'},avatar(u,'',S.pres[u.id]||null),h('div',{class:'grow'},h('b',null,u.display_name),h('small',null,'@'+u.username)),...actions)
const ib=(ic,t,fn,cls)=>h('button',{class:'ib '+(cls||''),title:t,'aria-label':t,on:{click:async()=>{try{await fn()}catch(e){fail(e)}}}},icon(ic))
if(cur==='all'){
mount(body,h('h2',null,'Friends — '+S.fr.friends.length),h('div',{class:'list'},S.fr.friends.length?S.fr.friends.map(u=>person(u,[
ib('chat','Message',()=>openDm(u.id)),
ib('user','Profile',()=>emit('ui:profile',{id:u.id,x:innerWidth/2-150,y:120})),
ib('x','Remove friend',async()=>{await DEL('/api/friends/'+u.id);await loadFriends()},'dng')])):h('div',{class:'empty'},'No friends yet. Use Add friend to send a request by username.')))
}else if(cur==='pending'){
mount(body,h('h2',null,'Incoming — '+S.fr.incoming.length),h('div',{class:'list'},S.fr.incoming.map(u=>person(u,[
ib('check','Accept',async()=>{await POST(`/api/friends/${u.id}/accept`,{});await loadFriends()}),
ib('x','Decline',async()=>{await DEL('/api/friends/'+u.id);await loadFriends()},'dng')]))),
h('h2',{style:{marginTop:'24px'}},'Sent — '+S.fr.outgoing.length),h('div',{class:'list'},S.fr.outgoing.map(u=>person(u,[
ib('x','Cancel request',async()=>{await DEL('/api/friends/'+u.id);await loadFriends()},'dng')]))),
!S.fr.incoming.length&&!S.fr.outgoing.length?h('div',{class:'empty'},'No pending requests'):null)
}else if(cur==='blocked'){
mount(body,h('h2',null,'Blocked — '+S.fr.blocked.length),h('div',{class:'list'},S.fr.blocked.length?S.fr.blocked.map(u=>person(u,[h('button',{class:'btn sm',on:{click:async()=>{try{await DEL('/api/blocks/'+u.id);await loadFriends()}catch(e){fail(e)}}}},'Unblock')])):h('div',{class:'empty'},'You have not blocked anyone')))
}else{
const err=h('div',{class:'err'})
const un=h('input',{class:'inp',placeholder:'Username',maxLength:40,autofocus:true,'aria-label':'Username'})
mount(body,h('h2',null,'Add friend'),h('form',{style:{maxWidth:'420px'},on:{submit:async e=>{
e.preventDefault()
err.textContent=''
try{await POST('/api/friends/request',{username:un.value.trim().replace(/^@/,'')});toast('Friend request sent','ok');un.value='';await loadFriends()}catch(x){err.textContent=x.message}
}}},field('Send a request by username',un),err,h('button',{class:'btn pri',type:'submit'},'Send request')))
}
}
const off=on('friends',draw)
draw()
return{nodes:[bar,body],cleanup:off}
}

export function discoverPage(){
const body=h('div',{style:{display:'flex',flexDirection:'column',flex:'1',minHeight:0}})
const bar=topBar({lead:icon('compass'),title:'Discover',topic:'Public servers anyone can join'})
const q=h('input',{class:'inp',type:'search',placeholder:'Search public servers','aria-label':'Search public servers',style:{maxWidth:'360px'}})
const cat=h('select',{class:'sel','aria-label':'Category',style:{width:'auto'}},h('option',{value:''},'All categories'),CATEGORIES.map(c=>h('option',{value:c},c[0].toUpperCase()+c.slice(1))))
const grid=h('div',{class:'grid'})
let offset=0
async function run(more){
if(!more)offset=0
try{
const d=await GET(`/api/discover?limit=24&offset=${offset}&q=${encodeURIComponent(q.value.trim())}&category=${cat.value}`)
const cards=d.servers.map(s=>{
const joined=S.servers.some(x=>x.id===s.id)
return h('div',{class:'sc'},h('div',{class:'row'},avatar({id:s.id,name:s.name,icon_id:s.icon_id,display_name:s.name}),h('div',{class:'grow'},h('h4',null,s.name,s.age_restricted?h('span',{class:'b18'},'18+'):null),h('small',{class:'hint',style:{margin:0}},s.members+' members'+(s.category?' · '+s.category:'')))),
h('p',null,s.description||'No description'),
h('button',{class:'btn'+(joined?'':' pri'),on:{click:async e=>{
if(joined){go('/s/'+s.id);return}
e.currentTarget.disabled=true
try{await POST(`/api/servers/${s.id}/join`,{});await loadServers();go('/s/'+s.id)}catch(x){fail(x);e.target.disabled=false}
}}},joined?'Open':'Join'))
})
if(more){grid.querySelector('.morebtn')?.remove();grid.append(...cards)}
else mount(grid,cards.length?cards:h('div',{class:'empty',style:{gridColumn:'1/-1'}},'No public servers match'))
if(d.servers.length===24){grid.append(h('button',{class:'btn morebtn',on:{click:()=>{offset+=24;run(true)}}},'Load more'))}
}catch(e){mount(grid,h('div',{class:'err'},e.message))}
}
q.oninput=debounce(()=>run(false),300)
cat.onchange=()=>run(false)
mount(body,h('div',{class:'row',style:{padding:'16px 16px 0'}},q,cat),grid)
run(false)
return{nodes:[bar,body]}
}

export function welcomePage(sid){
const d=S.sdata[sid]
const s=d.server
const chans=[...d.channels].sort((a,b)=>a.position-b.position).slice(0,8)
return h('div',{class:'swel',style:s.accent?{'--c':s.accent}:{}},
h('div',{class:'swel-b'},avatar({id:sid,name:s.name,icon_id:s.icon_id,display_name:s.name},'lg'),h('h1',null,s.name,s.age_restricted?h('span',{class:'b18'},'18+'):null),s.description?h('p',null,s.description):null,
s.welcome?h('p',{class:'swel-w'},s.welcome):null,
h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap',justifyContent:'center'}},can(sid,P.CREATE_INVITE)?h('button',{class:'btn pri',on:{click:()=>inviteDialog(sid)}},'Invite people'):null,
...chans.map(c=>h('button',{class:'btn',on:{click:()=>go(`/s/${sid}/${c.id}`)}},(c.type==='voice'?'Voice  ':'#')+c.name)))))
}

export function forumPage(ch,sid){
const body=h('div',{class:'forum'})
const canPost=!!(ch.perms&P.SEND)&&!ch.locked
let arch=false
async function draw(){
try{
const d=await GET(`/api/channels/${ch.id}/threads?archived=${arch?1:0}`)
for(const t of d.threads)noteThread(t,sid)
mount(body,
h('div',{class:'row',style:{marginBottom:'12px'}},
h('button',{class:'btn sm'+(arch?'':' pri'),on:{click:()=>{arch=false;draw()}}},'Active'),
h('button',{class:'btn sm'+(arch?' pri':''),on:{click:()=>{arch=true;draw()}}},'Archived'),
h('span',{class:'grow'}),
canPost?h('button',{class:'btn pri',on:{click:()=>postDialog(ch,sid)}},icon('plus','s'),'New post'):null),
d.threads.length?d.threads.map(t=>h('button',{class:'fpost',on:{click:()=>go(`/s/${sid}/${t.id}`)}},
h('b',null,t.name),
h('div',{class:'fprev'},t.preview||''),
h('small',{class:'hint',style:{margin:'0'}},`${t.owner_name} · ${t.count} ${t.count===1?'reply':'replies'} · ${fmtRel(t.last_at)}`))):h('div',{class:'empty'},arch?'No archived posts':'No posts yet'))
}catch(e){mount(body,h('div',{class:'err'},e.message))}
}
draw()
const off=on('threads',()=>draw())
return{node:h('div',{class:'pgh',style:{flex:'1',overflow:'auto'}},body),cleanup:off}
}

function postDialog(ch,sid){
const err=h('div',{class:'err',role:'alert'})
const title=h('input',{class:'inp',maxLength:80,required:true,autofocus:true,placeholder:'Post title'})
const text=h('textarea',{class:'inp',rows:5,maxLength:4000,required:true,placeholder:'What do you want to discuss?'})
const btn=h('button',{class:'btn pri',type:'submit'},'Post')
const d=dialog('New post',h('div',{class:'bd'},h('form',{on:{submit:async e=>{
e.preventDefault()
err.textContent=''
btn.disabled=true
try{
const r=await POST(`/api/channels/${ch.id}/posts`,{title:title.value.trim()})
noteThread(r.thread,sid)
await POST(`/api/rooms/${r.thread.id}/messages`,{content:text.value.trim(),nonce:rid()})
d.close()
go(`/s/${sid}/${r.thread.id}`)
}catch(x){err.textContent=x.message;btn.disabled=false}
}}},field('Title',title),field('First message',text),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},btn))),{})
}
