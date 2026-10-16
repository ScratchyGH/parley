import{h,mount,icon,PATCH,POST,avatar,fail,menu,menuAt,ctxMenu,copyText,coverBg}from'./util.js'
import{applyServerTheme,S,P,on,emit,conv,convTitle,convOther,chanInfo,can,dmUnread,serverUnread,unreadOf,muteLevel,isDm,loadConvs,noteThread}from'./state.js'
import{go}from'./nav.js'
import{sendAll}from'./net.js'
import{V,leaveVoice}from'./voice.js'
import{membersPanel,pinsPanel,searchPanel,savedPanel,inboxPanel,threadsPanel}from'./panels.js'
import{createServerDialog,inviteDialog,channelDialog,categoryDialog,newDmDialog,quickSwitcher}from'./dialogs.js'
import{openSettings}from'./settings.js'
import{openServerSettings,channelSettings,leaveServer}from'./ssettings.js'
import{accountsDialog}from'./accounts.js'
import{eventsDialog}from'./dialogs2.js'

export const el={}
let panel=null
const collapsed=new Set()

export function buildShell(root){
el.shell=h('div',{class:'shell'})
el.rail=h('nav',{class:'ws','aria-label':'Servers'})
el.ctx=h('aside',{class:'ctx','aria-label':'Channels'})
el.main=h('main',{class:'main',id:'main',tabindex:'-1'})
mount(el.shell,el.rail,el.ctx,el.main)
mount(root,h('a',{class:'skip',href:'#main',on:{click:e=>{e.preventDefault();el.main.focus()}}},'Skip to content'),el.shell)
panel=null
}

export function closeDrawers(){el.shell?.classList.remove('nav','pan')}

export async function setMute(id,level){
const cur={...(S.me.settings.mute||{})}
if(level==='all')delete cur[id];else cur[id]=level
try{
const d=await PATCH('/api/me',{settings:{mute:cur}})
S.me=d.user
emit('settings')
renderRail()
renderCtx()
}catch(e){fail(e)}
}
function muteItems(id){
const lvl=muteLevel(id)
return[
{head:'Notifications'},
{label:(lvl==='all'?'✓ ':'')+'All messages',fn:()=>setMute(id,'all')},
{label:(lvl==='mentions'?'✓ ':'')+'Only mentions',fn:()=>setMute(id,'mentions')},
{label:(lvl==='none'?'✓ ':'')+'Muted',fn:()=>setMute(id,'none')}
]
}

async function markRead(rooms){
for(const r of rooms.slice(0,25)){
try{await POST(`/api/rooms/${r}/read`,{});delete S.unread[r]}catch{}
}
emit('unread')
}

function badge(u){
if(!u)return null
if(u.mentions)return h('span',{class:'bdg'},u.mentions>99?'99+':u.mentions)
return null
}

export function renderRail(){
if(!el.rail)return
const kids=[]
const dm=dmUnread()
const homeOn=S.nav.kind==='home'||S.nav.kind==='dm'
kids.push(h('div',{class:'wwrap'},homeOn?h('span',{class:'pip',style:{height:'20px',marginTop:'-10px'}}):dm?h('span',{class:'pip'}):null,
h('button',{class:'wbtn'+(homeOn?' on':''),title:'Home and direct messages','aria-label':'Home and direct messages','aria-current':homeOn?'page':null,on:{click:()=>go('/')}},icon('chat')),
dm?h('span',{class:'bdg'},dm.mentions||'•'):null))
kids.push(h('div',{class:'sep'}))
for(const s of S.servers){
const on_=S.nav.kind==='server'&&S.nav.sid===s.id
const u=serverUnread(s.id)
const b=h('button',{class:'wbtn'+(on_?' on':''),title:s.name,'aria-label':s.name+(u?', unread':''),'aria-current':on_?'page':null,style:s.accent?{borderColor:on_?s.accent:'transparent'}:{},on:{click:()=>go('/s/'+s.id),contextmenu:e=>ctxMenu(e,serverMenu(s.id))}},s.icon_id?h('img',{src:'/api/files/'+s.icon_id,alt:'',loading:'lazy'}):initialsOf(s.name))
kids.push(h('div',{class:'wwrap'},on_?h('span',{class:'pip',style:{height:'20px',marginTop:'-10px'}}):u?h('span',{class:'pip'}):null,b,badge(u)))
}
kids.push(h('button',{class:'wbtn',title:'Create or join a server','aria-label':'Create or join a server',on:{click:()=>createServerDialog()}},icon('plus')))
kids.push(h('button',{class:'wbtn'+(S.nav.kind==='discover'?' on':''),title:'Discover servers','aria-label':'Discover servers',on:{click:()=>go('/discover')}},icon('compass')))
kids.push(h('button',{class:'wbtn'+(S.nav.kind==='bots'?' on':''),title:'Bots','aria-label':'Bots','aria-current':S.nav.kind==='bots'?'page':null,on:{click:()=>go('/bots')}},icon('bot')))
mount(el.rail,kids)
}
const initialsOf=n=>String(n).trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()

function serverMenu(sid){
const d=S.sdata[sid]
const s=S.servers.find(x=>x.id===sid)
const items=[]
if(d){
if(can(sid,P.CREATE_INVITE))items.push({icon:'useradd',label:'Invite people',fn:()=>inviteDialog(sid)})
if(can(sid,P.MANAGE_SERVER|P.MANAGE_ROLES|P.MANAGE_CHANNELS|P.MODERATE|P.BAN|P.KICK)||d.me.owner)items.push({icon:'sliders',label:'Server settings',fn:()=>openServerSettings(sid)})
if(can(sid,P.MANAGE_CHANNELS)){items.push({icon:'plus',label:'Create channel',fn:()=>channelDialog(sid)},{icon:'plus',label:'Create category',fn:()=>categoryDialog(sid)})}
items.push('-')
}
items.push({icon:'check',label:'Mark as read',fn:()=>markRead(Object.keys(S.unread).filter(r=>S.unread[r].sid===sid))})
items.push(...muteItems(sid))
items.push({icon:'calendar',label:'Events',fn:()=>eventsDialog(sid)},{icon:'list',label:'Server info and rules',fn:()=>emit('ui:serverinfo',sid)},'-',{icon:'copy',label:'Copy server ID',fn:()=>copyText(sid)})
if(d&&!d.me.owner)items.push({icon:'flag',label:'Report server',fn:()=>emit('ui:report',{type:'server',id:sid})},{icon:'leave',label:'Leave server',danger:true,fn:()=>leaveServer(sid)})
return items
}

function chanIcon(c){
if(c.type==='voice')return icon('volume','s')
if(c.type==='announce')return icon('mega','s')
if(c.type==='forum')return icon('chat','s')
return c.locked||(c.perms&P.SEND)===0?icon('lock','s'):icon('hash','s')
}
function chanItem(sid,c){
const u=c.type==='voice'?null:unreadOf(c.id)
const active=S.nav.kind==='server'&&S.nav.room===c.id
const inCall=V.ch===c.id
const gear=can(sid,P.MANAGE_CHANNELS)?h('button',{class:'ib gear',title:'Edit channel','aria-label':'Edit '+c.name,on:{click:e=>{e.stopPropagation();channelSettings(sid,c.id)}}},icon('sliders','s')):null
const row=h('div',{class:'ci'+(active?' on':'')+(u&&!active?' un':''),on:{contextmenu:e=>ctxMenu(e,[
c.type!=='voice'?{icon:'check',label:'Mark as read',fn:()=>markRead([c.id])}:null,
...(c.type!=='voice'?muteItems(c.id):[]),
can(sid,P.MANAGE_CHANNELS)?'-':null,
can(sid,P.MANAGE_CHANNELS)?{icon:'sliders',label:'Edit channel',fn:()=>channelSettings(sid,c.id)}:null,
{icon:'copy',label:'Copy channel ID',fn:()=>copyText(c.id)}
])}},
h('button',{class:'cib','aria-current':active?'page':null,on:{click:()=>{go(`/s/${sid}/${c.id}`);closeDrawers()}}},chanIcon(c),h('span',{class:'nm'},c.name),inCall?h('span',{style:{color:'var(--ok)'}},icon('volume','s')):null),
u&&!active&&u.mentions?h('span',{class:'bdg',style:{borderColor:'var(--side)'}},u.mentions):null,
gear)
if(c.type!=='voice')return row
const users=S.voice[c.id]||{}
const ids=Object.keys(users)
return h('div',null,row,ids.map(id=>{
const uu=id===S.me.id?S.me:S.users.get(id)||{id,display_name:'Member'}
return h('div',{class:'vp'+(users[id].sp?' sp':'')},avatar(uu,'sm'),h('span',{class:'nm',style:{flex:'1',overflow:'hidden',textOverflow:'ellipsis'}},uu.display_name),users[id].m?icon('micoff','s'):null,users[id].scr?icon('screen','s'):null,users[id].vid?icon('video','s'):null)
}))
}

function serverBody(sid){
const d=S.sdata[sid]
if(!d)return h('div',{class:'hint',style:{padding:'12px'}},'Loading…')
const kids=[]
const byCat={}
for(const c of d.channels)(byCat[c.category_id||'_']||=[]).push(c)
for(const k of Object.keys(byCat))byCat[k].sort((a,b)=>a.position-b.position)
for(const c of byCat._||[])kids.push(chanItem(sid,c))
for(const cat of [...d.categories].sort((a,b)=>a.position-b.position)){
const list=byCat[cat.id]||[]
if(!list.length&&!can(sid,P.MANAGE_CHANNELS))continue
const key=sid+':'+cat.id
const open=!collapsed.has(key)
kids.push(h('div',{class:'cat',style:{padding:0}},h('button',{class:'catbtn','aria-expanded':String(open),on:{click:()=>{if(open)collapsed.add(key);else collapsed.delete(key);renderCtx()}}},icon(open?'down':'right','s'),h('span',null,cat.name)),
can(sid,P.MANAGE_CHANNELS)?h('button',{class:'ib',style:{width:'22px',height:'22px'},title:'Create channel in '+cat.name,'aria-label':'Create channel in '+cat.name,on:{click:()=>channelDialog(sid,cat.id)}},icon('plus','s')):null))
if(open)for(const c of list)kids.push(chanItem(sid,c))
else for(const c of list)if(unreadOf(c.id)||V.ch===c.id||S.nav.room===c.id)kids.push(chanItem(sid,c))
}
if(!d.channels.length)kids.push(h('div',{class:'hint',style:{padding:'12px'}},'No channels you can see yet.'))
return h('div',{class:'ctx-b'},kids)
}

function dmItem(c){
const o=convOther(c)
const active=S.nav.kind==='dm'&&S.nav.room===c.id
const u=unreadOf(c.id)
const title=convTitle(c)
const st=o?(S.pres[o.id]||null):null
const pending=!c.accepted
return h('div',{class:'ci'+(active?' on':'')+(u&&!active?' un':''),on:{contextmenu:e=>ctxMenu(e,[
{icon:'check',label:'Mark as read',fn:()=>markRead([c.id])},
...muteItems(c.id),'-',
{icon:'x',label:'Hide conversation',fn:async()=>{try{await PATCH(`/api/conversations/${c.id}/me`,{hidden:true});await loadConvs();if(active)go('/')}catch(x){fail(x)}}}
])}},
h('button',{class:'cib','aria-current':active?'page':null,on:{click:()=>{go('/dm/'+c.id);closeDrawers()}}},
c.type==='group'?avatar({id:c.id,name:title,icon_id:c.icon_id},'sm'):avatar(o||{display_name:title},'sm',st),
h('span',{class:'nm'},title),pending?h('span',{class:'hint',style:{margin:0}},'request'):null),
u&&!active?(u.mentions?h('span',{class:'bdg',style:{borderColor:'var(--side)'}},u.mentions):h('span',{style:{width:'8px',height:'8px',borderRadius:'50%',background:'var(--strong)'}})):null)
}

function homeBody(){
const inc=S.fr.incoming.length
const kids=[
h('button',{class:'btn',style:{width:'100%',justifyContent:'flex-start',color:'var(--muted)',marginBottom:'8px'},on:{click:()=>quickSwitcher()}},icon('search','s'),'Find a conversation',h('span',{class:'kbd',style:{marginLeft:'auto'}},'Ctrl K')),
h('button',{class:'ci'+(S.nav.kind==='home'&&S.nav.page==='overview'?' on':''),on:{click:()=>{go('/');closeDrawers()}}},icon('chat'),h('span',{class:'nm'},'Home')),
h('button',{class:'ci'+(S.nav.kind==='home'&&S.nav.page!=='overview'?' on':''),on:{click:()=>{go('/friends');closeDrawers()}}},icon('users'),h('span',{class:'nm'},'Friends'),inc?h('span',{class:'bdg',style:{borderColor:'var(--side)'}},inc):null),
h('button',{class:'ci',on:{click:()=>emit('ui:panel',{kind:'saved'})}},icon('bookmark'),h('span',{class:'nm'},'Saved messages')),
h('div',{class:'cat'},h('span',null,'Direct messages'),h('button',{class:'ib',style:{width:'22px',height:'22px'},title:'New message','aria-label':'New message',on:{click:()=>newDmDialog()}},icon('plus','s')))
]
const reqs=S.convs.filter(c=>!c.accepted)
if(reqs.length){kids.push(h('div',{class:'cat'},h('span',null,'Message requests — '+reqs.length)));for(const c of reqs)kids.push(dmItem(c))}
for(const c of S.convs.filter(c=>c.accepted))kids.push(dmItem(c))
if(!S.convs.length)kids.push(h('div',{class:'hint',style:{padding:'8px'}},'No conversations yet. Add a friend or start one with +.'))
return h('div',{class:'ctx-b'},kids)
}

function presenceMenu(anchor){
const cur=S.me.presence
const set=async p=>{
try{
const d=await PATCH('/api/me',{presence:p})
S.me=d.user
sendAll({t:'presence',s:p})
renderCtx()
}catch(e){fail(e)}
}
menuAt(anchor,[
{label:(cur==='online'?'✓ ':'')+'Online',fn:()=>set('online')},
{label:(cur==='idle'?'✓ ':'')+'Idle',fn:()=>set('idle')},
{label:(cur==='busy'?'✓ ':'')+'Do not disturb',fn:()=>set('busy')},
{label:(cur==='invisible'?'✓ ':'')+'Invisible',fn:()=>set('invisible')},
'-',{icon:'user',label:'Edit profile',fn:()=>openSettings('profile')},
S.me.admin?{icon:'shield',label:'Admin panel',fn:()=>openSettings('admin')}:null,
{icon:'swap',label:'Switch account',fn:()=>accountsDialog()}
])
}

function userPanel(){
const strip=V.ch?h('div',{class:'vstrip'},icon('volume','s'),h('div',{class:'grow'},h('b',null,'Voice connected'),h('small',null,V.label||'')),
h('button',{class:'ib',title:'Open voice room','aria-label':'Open voice room',on:{click:()=>go(V.path)}},icon('screen','s')),
h('button',{class:'ib dng',title:'Disconnect','aria-label':'Disconnect from voice',on:{click:()=>leaveVoice()}},icon('leave','s'))):null
const who=h('button',{class:'who',style:{display:'flex',gap:'8px',alignItems:'center',flex:'1',minWidth:0,textAlign:'left'},on:{click:e=>presenceMenu(e.currentTarget)}},
avatar(S.me,'',S.me.presence==='invisible'?'':S.me.presence),
h('div',{class:'who'},h('b',null,S.me.display_name),h('small',null,S.me.status_text||'@'+S.me.username)))
return h('div',null,strip,h('div',{class:'me'},who,
h('button',{class:'ib',title:'Inbox','aria-label':'Inbox'+(S.notifN?`, ${S.notifN} unread`:''),on:{click:()=>emit('ui:panel',{kind:'inbox'})}},icon('bell'),S.notifN?h('span',{class:'bdg',style:{position:'absolute',top:'-2px',right:'-2px',borderColor:'var(--side)'}},S.notifN>99?'99+':S.notifN):null),
h('button',{class:'ib',title:'User settings','aria-label':'User settings',on:{click:()=>openSettings()}},icon('sliders'))))
}

export function renderCtx(){
applyServerTheme()
if(!el.ctx)return
const k=S.nav.kind
let head,body
if(k==='server'){
const s=S.servers.find(x=>x.id===S.nav.sid)
const sbtn=h('button',{class:'ctx-h',style:{width:'100%',textAlign:'left',border:0},'aria-haspopup':'menu',on:{click:e=>menuAt(e.currentTarget,serverMenu(S.nav.sid))}},h('span',null,s?.name||'Server'),icon('down','s'))
const bid=S.sdata[S.nav.sid]?.server?.banner_id||s?.banner_id
if(bid){sbtn.classList.add('hasb');coverBg(sbtn,bid,'linear-gradient(180deg,transparent 30%,var(--side))')}
head=sbtn
body=serverBody(S.nav.sid)
}else{
head=h('div',{class:'ctx-h'},h('span',null,k==='discover'?'Discover':k==='bots'?'Bots':'Home'))
body=homeBody()
}
mount(el.ctx,head,body,userPanel())
}

export function setPanel(p){
if(el.panelEl){el.panelEl.remove();el.panelEl=null}
panel=p
el.shell.classList.remove('pan')
if(!p)return
let node
if(p.kind==='members')node=membersPanel(p.arg)
else if(p.kind==='pins')node=pinsPanel(p.arg)
else if(p.kind==='threads')node=threadsPanel(p.arg)
else if(p.kind==='search')node=searchPanel(p.arg,p.q)
else if(p.kind==='saved')node=savedPanel()
else if(p.kind==='inbox')node=inboxPanel()
if(!node)return
el.panelEl=node
el.shell.append(node)
el.shell.classList.add('pan')
node.querySelector('[autofocus]')?.focus()
}
export const currentPanel=()=>panel
export function refreshPanel(){
if(panel&&panel.kind==='members'&&el.panelEl?.__draw)el.panelEl.__draw()
}

export function topBar(opts){
const bar=h('header',{class:'top'},
h('button',{class:'ib mobile-only','aria-label':'Open navigation',title:'Navigation',on:{click:()=>el.shell.classList.toggle('nav')}},icon('menu')),
opts.lead||null,
h('h2',null,opts.title),
opts.topic?h('div',{class:'tp',title:opts.topic},opts.topic):h('div',{class:'sp'}),
opts.actions||null)
return bar
}
export const tbtn=(ic,t,fn,on_)=>h('button',{class:'ib'+(on_?' on':''),title:t,'aria-label':t,'aria-pressed':on_===undefined?null:String(!!on_),on:{click:fn}},icon(ic))

export function chatTop(room){
const info=isDm(room)?null:chanInfo(room)
const c=isDm(room)?conv(room):null
const actions=h('div',{class:'row',style:{gap:'2px'}})
const pn=panel?.kind
if(c&&c.accepted&&(c.perms===undefined||c.perms&P.CONNECT))actions.append(tbtn('phone','Start voice call',()=>emit('ui:call',room)))
const voice=!!info&&info.ch.type==='voice'
if(!voice)actions.append(tbtn('pin','Pinned messages',()=>emit('ui:panel',pn==='pins'?null:{kind:'pins',arg:room}),pn==='pins'))
if(info&&!info.thread&&info.ch.type!=='forum'&&!voice)actions.append(tbtn('chat','Threads',()=>emit('ui:panel',pn==='threads'?null:{kind:'threads',arg:room}),pn==='threads'))
if(info&&info.thread){
actions.append(tbtn('right','Back to #'+info.parent.name,()=>go(`/s/${info.sid}/${info.parent.id}`)))
if(info.thread.owner_id===S.me.id||can(info.sid,P.MANAGE_MESSAGES))actions.append(tbtn('check',info.thread.archived?'Unarchive thread':'Archive thread',async()=>{try{const r=await PATCH('/api/threads/'+room,{archived:!info.thread.archived});noteThread(r.thread,info.sid);emit('ui:refreshtop')}catch(e){fail(e)}}))
}
if((info&&!voice)||c?.type==='group')actions.append(tbtn('users','Member list',()=>emit('ui:panel',pn==='members'?null:{kind:'members',arg:room}),pn==='members'))
if(!voice)actions.append(tbtn('search','Search',()=>emit('ui:panel',pn==='search'?null:{kind:'search',arg:room}),pn==='search'))
if(c?.type==='group')actions.append(tbtn('sliders','Group settings',()=>emit('ui:groupsettings',room)))
actions.append(tbtn('menu','Toggle side panel',()=>el.shell.classList.toggle('pan')))
actions.lastChild.classList.add('mobile-only')
const title=info?info.thread?`${info.parent.name} › ${info.ch.name}`:info.ch.name:convTitle(c)
return topBar({lead:info?icon(info.thread||info.ch.type==='forum'?'chat':info.ch.type==='announce'?'mega':voice?'volume':'hash'):c?(c.type==='group'?icon('users'):avatar(convOther(c)||{},'sm')):null,title,topic:info?.ch.topic||'',actions})
}

export function layoutMain(...kids){
mount(el.main,kids)
el.main.classList.remove('enter')
void el.main.offsetWidth
el.main.classList.add('enter')
}

on('unread',()=>{renderRail();renderCtx()})
on('servers',renderRail)
on('convs',()=>{renderCtx();renderRail()})
on('friends',renderCtx)
on('notifn',renderCtx)
on('server',()=>renderCtx())
on('voice:update',()=>renderCtx())
on('members',refreshPanel)
