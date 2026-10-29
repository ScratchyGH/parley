import'./perf.js'
import'./halloween.js'
import{VC,h,mount,icon,GET,POST,PATCH,toast,fail,dialog,closeMenu,closeTopDialog,dialogOpen,debounce,fmtStamp}from'./util.js'
import{render}from'./md.js'
import{deviceRequest}from'./devblock.js'
import{S,P,can,on,emit,cacheUser,ensureThread,noteThread,applySettings,applyCachedLook,loadServers,loadServer,loadConvs,loadFriends,loadUnread,loadNotifCount,loadMembers,conv,convTitle,convOther,chanInfo,isDm,hubOf,unreadOf,muteLevel}from'./state.js'
import{setRooms,sendAll,stopAll}from'./net.js'
import{go,parse,setRouteHandler,lastChan,setLastChan}from'./nav.js'
import{renderAuth,renderAppeal}from'./auth.js'
import{buildShell,renderRail,renderCtx,setPanel,currentPanel,chatTop,topBar,layoutMain,closeDrawers,el}from'./shell.js'
import{openChat,closeChat,chatEvent,currentRoom,resyncChat,refreshComposer,chatAtBottom}from'./chat.js'
import{V,voiceEvent,joinVoice,toggleMute,toggleDeaf,mountVoiceRoom,ringToast,stopRing,voiceSettingsView}from'./voice.js'
import{friendsPage,discoverPage,welcomePage,forumPage}from'./pages.js'
import{maybeOnboard}from'./onboard.js'
import{homePage}from'./home.js'
import{botsPage,labPage}from'./botspage.js'
import{inviteJoinDialog,profileCard,reportDialog,shortcutsDialog,quickSwitcher,channelDialog,categoryDialog,groupSettingsDialog}from'./dialogs.js'
import{openSettings,settingsPage}from'./settings.js'
import{serverSettingsPage}from'./ssettings.js'
import{ping,desktop}from'./notify.js'
import{startP2P}from'./p2p/index.js'
import{startPars,parsPage,parIcon}from'./pars.js'
import{startHollow,hollowPage,pumpkinSvg}from'./hollow.js'
import{showOverlay,hideOverlay}from'./overlay.js'
import{startDiag}from'./diag.js'
import{whatsNew}from'./whatsnew.js'
import{tosGate}from'./legal.js'
import{checkOffer}from'./exp.js'
import{startRevamp}from'./revamp.js'
import{startUpdates}from'./update.js'
import{startStreaks}from'./streakui.js'
import{maybeTour}from'./tour.js'

const root=document.getElementById('app')
let cleanup=null
let booted=false
let routeGen=0
let lastPath=null

async function boot(){
applyCachedLook()
const r=parse()
const ae=new URLSearchParams(location.search).get('autherror')
if(ae){history.replaceState(null,'','/');setTimeout(()=>toast(ae,'err'),600)}
if(r.name==='appeal'){renderAppeal(root,()=>{history.replaceState(null,'','/');boot()});return}
try{
const d=await GET('/api/me')
await start(d.user)
}catch(e){
if(e.status===401)showAuth()
else{
mount(root,e.status===503?h('div',{class:'auth'},h('div',{class:'card mt'},h('img',{class:'au-m',src:'/mascot.webp',alt:'',width:56,height:56}),h('h1',null,'Down for maintenance'),h('p',null,'Parley is being updated. This usually takes a few minutes.'),h('div',{class:'row',style:{justifyContent:'center'}},h('button',{class:'btn pri',on:{click:()=>location.reload()}},'Try again'),h('button',{class:'btn',on:{click:async()=>{try{await POST('/api/auth/logout',{})}catch{}location.reload()}}},'Sign out')))):h('div',{class:'auth'},h('div',{class:'card'},h('h1',null,'Parley'),h('p',null,'Could not reach the server: '+e.message),h('button',{class:'btn pri',on:{click:()=>location.reload()}},'Retry'))))
}
}
}
function showAuth(note){
stopAll()
booted=false
cleanup?.();cleanup=null
closeChat()
S.me=null
applySettingsDefault()
renderAuth(root,async u=>{await start(u)},note)
}
function applySettingsDefault(){
if(!applyCachedLook())document.documentElement.dataset.theme='dimmed'
document.title='Parley'
}

async function start(user){
S.me=user
cacheUser(user)
applySettings()
if(!user.tos_ok)await tosGate()
S.servers=[];S.sdata={};S.convs=[];S.unread={};S.pres={};S.voice={}
buildShell(root)
booted=true
await Promise.all([loadServers(),loadConvs(),loadFriends(),loadUnread().catch(()=>{}),loadNotifCount().catch(()=>{})]).catch(fail)
setRouteHandler(route)
await route()
startPars()
startHollow()
startDiag()
startRevamp()
startUpdates()
startStreaks(()=>renderCtx())
{const tc=new URLSearchParams(location.search).get('tu');if(tc&&/^[A-Z0-9]{6}$/.test(tc)){history.replaceState(null,'','/');setTimeout(()=>import('/js/teamup.js').then(x=>x.openTeamup(tc)),900)}}
setTimeout(whatsNew,1200)
setTimeout(maybeTour,2600)
}

function desiredRooms(){
const rooms=['u_'+S.me.id]
const n=S.nav
if(n.kind==='server'&&n.sid)rooms.push('s_'+n.sid)
if(n.kind==='dm'&&n.room)rooms.push(n.room)
if(V.hub)rooms.push(V.hub)
return rooms
}

async function route(){
if(!booted)return
const gen=++routeGen
const r=parse()
cleanup?.();cleanup=null
closeChat()
closeDrawers()
if(r.name!=='pars'&&r.name!=='hollow'&&r.name!=='settings'){hideOverlay();lastPath=location.pathname+location.search}
const closeOv=()=>go(lastPath||'/')
const needBack=async()=>{if(lastPath===null){lastPath='/';await renderHome('overview')}}
if(r.name==='invite'){
history.replaceState(null,'','/')
S.nav={kind:'home',page:'overview'}
await renderHome('overview')
inviteJoinDialog(r.code)
return
}
if(r.name==='discover'){
S.nav={kind:'discover'}
syncChrome()
const p=discoverPage()
layoutMain(...p.nodes)
document.title='Discover • Parley'
return
}
if(r.name==='pars'){
await needBack()
S.nav={kind:'pars'}
syncChrome()
const pg=h('div',{class:'par-page'})
parsPage(pg)
showOverlay('pars','Pars shop',parIcon(20),pg,closeOv)
document.title='Pars shop • Parley'
return
}
if(r.name==='hollow'){
await needBack()
S.nav={kind:'hollow'}
syncChrome()
const pg=h('div',{class:'par-page'})
hollowPage(pg)
showOverlay('hollow','Haunted Hollow',pumpkinSvg(20),pg,closeOv)
document.title='Haunted Hollow • Parley'
return
}
if(r.name==='settings'&&r.page==='pars'){go('/pars',true);return}
if(r.name==='settings'){
await needBack()
S.nav={kind:'settings'}
syncChrome()
const p=settingsPage(r,topBar,icon)
showOverlay('settings','Settings',icon('sliders'),p.nodes[1],closeOv)
document.title=p.title
return
}
if(r.name==='bots'||r.name==='lab'){
S.nav={kind:r.name}
syncChrome()
const p=r.name==='lab'?labPage(r):botsPage(r)
layoutMain(...p.nodes)
document.title=p.title
await p.ready
return
}
if(r.name==='server'||r.name==='ssettings'){
const sid=r.sid
if(!S.servers.some(s=>s.id===sid)){toast('You are not a member of that server','err');go('/',true);return}
if(!S.sdata[sid]){
try{await loadServer(sid)}catch(e){fail(e);go('/',true);return}
if(gen!==routeGen)return
}
const d=S.sdata[sid]
checkOffer(sid)
if(r.name==='ssettings'){
S.nav={kind:'server',sid,room:null}
syncChrome()
if(!(can(sid,P.MANAGE_SERVER|P.MANAGE_ROLES|P.MANAGE_CHANNELS|P.MODERATE|P.BAN|P.KICK|P.CREATE_INVITE)||d.me.owner)){go('/s/'+sid,true);return}
const sp=serverSettingsPage(sid,r.page,topBar,icon)
layoutMain(...sp.nodes)
document.title=sp.title
return
}
if(r.ch&&r.ch.startsWith('th_')){
let th
try{th=await ensureThread(r.ch,sid)}catch(e){toast('That thread is not available','err');go('/s/'+sid,true);return}
if(gen!==routeGen)return
const pc=d.channels.find(c=>c.id===th.channel_id)
if(!pc){go('/s/'+sid,true);return}
S.nav={kind:'server',sid,room:th.id}
syncChrome()
const tpane=h('div',{style:{flex:'1',display:'flex',flexDirection:'column',minHeight:0,position:'relative'}})
layoutMain(chatTop(th.id),tpane)
openChat(tpane,th.id,r.m||null)
if(r.m)history.replaceState(null,'',`/s/${sid}/${th.id}`)
document.title=`${th.name} • ${d.server.name}`
return
}
maybeOnboard(sid)
let ch=r.ch&&d.channels.find(c=>c.id===r.ch)
if(!ch&&r.ch){toast('That channel is not available','err')}
if(!ch){
const last=lastChan(sid)
ch=d.channels.find(c=>c.id===last)
if(!ch){
const order=[...d.channels].sort((a,b)=>{
const ca=d.categories.find(c=>c.id===a.category_id)?.position??-1
const cb=d.categories.find(c=>c.id===b.category_id)?.position??-1
return ca-cb||a.position-b.position
})
ch=order.find(c=>!VC(c.type))||order[0]
}
if(ch){go(`/s/${sid}/${ch.id}`,true);return}
S.nav={kind:'server',sid,room:null}
syncChrome()
layoutMain(topBar({title:d.server.name,topic:''}),welcomePage(sid))
return
}
setLastChan(sid,ch.id)
S.nav={kind:'server',sid,room:ch.id}
syncChrome()
if(VC(ch.type)){
const box=h('div',{style:{flex:'1',display:'flex',flexDirection:'column',minHeight:0}})
layoutMain(chatTop(ch.id),box)
cleanup=mountVoiceRoom(box,ch.id,`${ch.name} / ${d.server.name}`,'s_'+sid,`/s/${sid}/${ch.id}`,ch.type==='stage')
document.title=`${ch.name} • ${d.server.name}`
return
}
if(ch.type==='forum'){
const fp=forumPage(ch,sid)
cleanup=fp.cleanup
layoutMain(chatTop(ch.id),fp.node)
document.title=`${ch.name} • ${d.server.name}`
return
}
const pane=h('div',{style:{flex:'1',display:'flex',flexDirection:'column',minHeight:0,position:'relative'}})
layoutMain(chatTop(ch.id),pane)
openChat(pane,ch.id,r.m||null)
if(r.m)history.replaceState(null,'',`/s/${sid}/${ch.id}`)
document.title=`#${ch.name} • ${d.server.name}`
return
}
if(r.name==='dm'){
if(!r.room){go('/',true);return}
if(!conv(r.room))await loadConvs().catch(()=>{})
const c=conv(r.room)
if(!c){toast('Conversation not found','err');go('/',true);return}
S.nav={kind:'dm',room:c.id}
syncChrome()
const pane=h('div',{style:{flex:'1',display:'flex',flexDirection:'column',minHeight:0,position:'relative'}})
const chatBox=h('div',{style:{flex:'1',display:'flex',flexDirection:'column',minHeight:0,position:'relative'}})
if(!c.accepted)pane.append(requestBanner(c))
const callBox=h('div',{class:'dmcall'})
const stopRoom=mountVoiceRoom(callBox,c.id,convTitle(c),c.id,'/dm/'+c.id)
const syncCall=()=>{callBox.hidden=!(V.ch===c.id||Object.keys(S.voice[c.id]||{}).length)}
syncCall()
const offCall=on('voice:update',syncCall)
cleanup=()=>{stopRoom?.();offCall()}
pane.append(callBox,chatBox)
layoutMain(chatTop(c.id),pane)
openChat(chatBox,c.id,r.m||null)
if(r.m)history.replaceState(null,'','/dm/'+c.id)
document.title=convTitle(c)+' • Parley'
return
}
await renderHome(r.page)
}

async function renderHome(page){
S.nav={kind:'home',page}
syncChrome()
const p=page==='overview'?homePage():friendsPage(page)
cleanup=p.cleanup
layoutMain(...p.nodes)
document.title=(page==='overview'?'Home':'Friends')+' • Parley'
}

function syncChrome(){
const p=currentPanel()
if(p){
if(p.kind==='members'&&(S.nav.kind==='server'||S.nav.kind==='dm')&&S.nav.room)setPanel({kind:'members',arg:S.nav.room})
else setPanel(null)
}
renderRail()
renderCtx()
setRooms(desiredRooms())
}

function requestBanner(c){
const o=convOther(c)
return h('div',{class:'ban'},icon('chat','s'),h('span',{class:'grow'},`${o?o.display_name:'Someone'} wants to message you. They cannot see whether you read it.`),
h('button',{class:'btn sm pri',on:{click:async()=>{try{await PATCH(`/api/conversations/${c.id}/me`,{accepted:true});await loadConvs();route()}catch(e){fail(e)}}}},'Accept'),
h('button',{class:'btn sm',on:{click:async()=>{try{await POST(`/api/conversations/${c.id}/decline`,{});await loadConvs();go('/')}catch(e){fail(e)}}}},'Decline'),
o?h('button',{class:'btn sm dng',on:{click:async()=>{try{await POST('/api/blocks/'+o.id,{});await POST(`/api/conversations/${c.id}/decline`,{}).catch(()=>{});await loadConvs();await loadFriends();go('/')}catch(e){fail(e)}}}},'Block'):null)
}

function isMention(ev,sid){
const m=ev.ment
if(!m)return false
if(m.users?.includes(S.me.id))return true
if(m.everyone)return true
const mine=S.sdata[sid]?.me.role_ids||[]
return !!m.roles?.some(r=>mine.includes(r))
}

const reloadConvs=debounce(()=>loadConvs().catch(()=>{}),400)
const reloadUnread=debounce(()=>loadUnread().catch(()=>{}),600)
const reloadFriends=debounce(()=>{loadFriends().catch(()=>{});loadNotifCount().catch(()=>{})},400)
const reloadMembers=debounce(sid=>{if(S.sdata[sid]?.memberList)loadMembers(sid,true).catch(()=>{})},800)
const refreshPresence=debounce(()=>{emit('members',S.nav.sid);renderCtx()},400)

on('ev',({room,m})=>{
if(!S.me)return
if(m.t==='ready'){
for(const p of m.presence||[])S.pres[p.uid]=p.s
refreshPresence()
}
if(voiceEvent(room,m))return
switch(m.t){
case'presence':
if(m.s==='offline')delete S.pres[m.uid];else S.pres[m.uid]=m.s
refreshPresence()
break
case'msg.new':onNewMessage(m);break
case'thread.new':case'thread.update':
if(m.thread)noteThread(m.thread,room.startsWith('s_')?room.slice(2):S.nav.sid)
chatEvent(room,m)
emit('threads',m.thread)
if(m.t==='thread.update'&&S.nav.room===m.thread?.id)refreshTop()
break
case'events.changed':emit('events',m.server_id);break
case'emoji.changed':if(room.startsWith('s_'))loadServer(room.slice(2)).then(()=>emit('emoji',room.slice(2))).catch(()=>{});break
case'poll.update':case'msg.update':case'msg.delete':case'reaction':case'att.delete':case'typing':
chatEvent(room,m)
break
case'safety.removed':toast('A message of yours was removed because this server scans for explicit content','err');break
case'pars.gift':emit('pars.gift',m);break
case'banhammer.hit':import('./banhammerfx.js').then(x=>x.banhammerHit(m.uid,m.by));break
case'banhammer.cake':import('./banhammerfx.js').then(x=>x.birthdayCake(m.uid,m.by));break
case'streak':emit('streak',m);break
case'streak.sync':emit('streak.sync',m);break
case'notif':
if(m.remind)toast('Reminder: '+m.remind,'ok')
S.notifN++
emit('notifn')
reloadUnread()
break
case'conv.update':reloadConvs();break
case'friend':reloadFriends();break
case'read':
if(S.unread[m.room]){delete S.unread[m.room];emit('unread')}
break
case'me.update':
GET('/api/me').then(d=>{S.me=d.user;applySettings();renderCtx();refreshComposer()}).catch(()=>{})
break
case'server.update':
if(room.startsWith('s_')){
const sid=room.slice(2)
loadServer(sid).then(()=>{loadServers();if(S.nav.sid===sid&&S.nav.room&&!chanInfo(S.nav.room)){toast('That channel was removed','err');go('/s/'+sid,true)}else refreshComposer()}).catch(()=>{})
}
break
case'member.join':case'member.leave':case'member.update':
if(room.startsWith('s_'))reloadMembers(room.slice(2))
break
case'server.removed':
case'server.deleted':{
const id=m.id
delete S.sdata[id]
loadServers().then(()=>{if(S.nav.sid===id){toast(m.t==='server.deleted'?'This server was deleted':`You were ${m.reason||'removed'} from this server`,'err');go('/',true)}})
break
}
case'notice':toast(m.text);break
case'tu.invite':import('/js/teamup.js').then(x=>x.showInvite(m));break
case'bot.device':deviceRequest(m);break
case'call.ring':
if(V.ch){POST(`/api/conversations/${m.room}/ring/decline`,{busy:true}).catch(()=>{});break}
ringToast(m.from,m.room,()=>startCall(m.room))
break
case'call.cancel':
stopRing(m.room)
break
case'call.declined':
clearTimeout(calling.get(m.room))
calling.delete(m.room)
toast(m.busy?`${m.by.display_name} is on another call`:`${m.by.display_name} declined the call`)
break
}
})

function onNewMessage(ev){
const msg=ev.m
const room=msg.room
if(room.startsWith('th_')&&currentRoom()!==room&&!isMention(ev,S.threads[room]?.sid))return
const own=msg.author.id===S.me.id
chatEvent(room,ev)
if(msg.author.username==='ᴄᴀɴᴅʏʏʏ'&&/\bkaboom\b/i.test(msg.content||''))kaboom(msg)
if(own)return
cacheUser(msg.author)
const dm=isDm(room)
const info=dm?null:chanInfo(room)
const sid=info?.sid||null
if(dm&&!conv(room))reloadConvs()
const viewing=currentRoom()===room&&document.hasFocus()&&!document.hidden&&chatAtBottom()
const mention=isMention(ev,sid)
if(!viewing){
const u=S.unread[room]||(S.unread[room]={count:0,mentions:0,sid})
u.count=Math.min(99,u.count+1)
if(mention||dm)u.mentions++
emit('unread')
}
const lvl=Math.max(['none','mentions','all'].indexOf(muteLevel(room)),0)
const srvLvl=sid?['none','mentions','all'].indexOf(muteLevel(sid)):2
const eff=Math.min(lvl,srvLvl<0?2:srvLvl)
const wants=eff===2?(dm||mention):eff===1?mention:false
if(wants&&!viewing){
ping()
const title=dm?convTitle(conv(room)):`${msg.author.display_name} in #${info?.ch.name||'channel'}`
desktop(title,dm?`${msg.author.display_name}: ${msg.content}`:msg.content,room,()=>go(dm?'/dm/'+room:`/s/${sid}/${room}`))
}
if(dm)reloadConvs()
}

async function startCall(room){
const c=conv(room)
if(!c)return
if(S.nav.room!==room)go('/dm/'+room)
await joinVoice({ch:room,hub:room,label:convTitle(c),path:'/dm/'+room})
}
const calling=new Map()
on('voice:update',()=>{
for(const[room,t]of calling)if(V.ch!==room){clearTimeout(t);calling.delete(room);POST(`/api/conversations/${room}/ring/cancel`,{}).catch(()=>{})}
})
on('ui:call',async room=>{
await startCall(room)
if(V.ch!==room)return
POST(`/api/conversations/${room}/ring`,{}).catch(()=>{})
clearTimeout(calling.get(room))
calling.set(room,setTimeout(()=>{
calling.delete(room)
const others=Object.keys(S.voice[room]||{}).filter(u=>u!==S.me.id)
if(V.ch===room&&!others.length){POST(`/api/conversations/${room}/ring/cancel`,{}).catch(()=>{});toast('No answer')}
},45000))
})

function refreshTop(){
const r=S.nav.room
if((S.nav.kind==='server'||S.nav.kind==='dm')&&r&&el.main.firstChild)el.main.firstChild.replaceWith(chatTop(r))
}
on('ui:refreshtop',refreshTop)
on('ui:panel',p=>{
const cur=currentPanel()
if(p&&cur&&cur.kind===p.kind&&p.kind!=='search'&&p.arg===cur.arg){setPanel(null);refreshTop();return}
if(p&&p.kind!=='saved'&&p.kind!=='inbox'&&!p.arg)p.arg=S.nav.room
setPanel(p)
refreshTop()
})
on('ui:profile',o=>profileCard(o))
on('ui:mention',id=>profileCard({id,x:innerWidth/2-150,y:140,sid:S.nav.sid}))
on('ui:report',o=>reportDialog(o))
on('ui:settings',p=>openSettings(p))
on('ui:newchannel',sid=>channelDialog(sid))
on('ui:newcategory',sid=>categoryDialog(sid))
on('ui:groupsettings',room=>groupSettingsDialog(room))
on('ui:voicesettings',()=>dialog('Voice and video settings',h('div',{class:'bd'},voiceSettingsView()),{}))
on('ui:serverinfo',sid=>{
const d=S.sdata[sid]
if(!d)return
dialog(d.server.name,h('div',{class:'bd'},d.server.description?h('p',null,d.server.description):null,d.server.welcome?h('div',null,h('label',{class:'f'},'Welcome'),h('div',{class:'mb'},render(d.server.welcome,{}))):null,d.server.rules?h('div',null,h('label',{class:'f'},'Rules'),h('div',{class:'mb'},render(d.server.rules,{}))):null,h('div',{class:'hint'},d.members+' members')),{})
})
on('ws:open',({room,again})=>{
if(!again)return
if(room==='u_'+S.me.id){loadUnread().catch(()=>{});loadConvs().catch(()=>{});loadFriends().catch(()=>{});loadNotifCount().catch(()=>{})}
else if(room.startsWith('s_')){
const sid=room.slice(2)
loadServer(sid).then(()=>{renderCtx();refreshComposer();if(hubOf(currentRoom())===room)resyncChat()}).catch(()=>{})
reloadMembers(sid)
}else if(room===hubOf(currentRoom()))resyncChat()
})
on('ws:authcheck',async()=>{
try{await GET('/api/me')}catch(e){if(e.status===401)showAuth('Your session has expired. Please sign in again.')}
})
on('voice:update',()=>{
if(S.me)setRooms(desiredRooms())
})
const retime=()=>document.querySelectorAll('.mh time[data-t]').forEach(e=>{const t=fmtStamp(+e.dataset.t);if(e.textContent!==t)e.textContent=t})
on('settings',()=>{renderCtx();refreshComposer();retime()})
setInterval(retime,30000)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)retime()})

addEventListener('keydown',e=>{
if(!S.me)return
const mod=e.ctrlKey||e.metaKey
const k=e.key
if(mod&&k.toLowerCase()==='k'){e.preventDefault();closeMenu();quickSwitcher();return}
if(mod&&k==='/'){e.preventDefault();shortcutsDialog();return}
if(mod&&k===','){e.preventDefault();openSettings();return}
if(mod&&e.shiftKey&&k.toLowerCase()==='f'){e.preventDefault();const r=S.nav.room;if(r)emit('ui:panel',{kind:'search',arg:r});return}
if(mod&&e.shiftKey&&k.toLowerCase()==='m'&&V.ch){e.preventDefault();toggleMute();return}
if(mod&&e.shiftKey&&k.toLowerCase()==='d'&&V.ch){e.preventDefault();toggleDeaf();return}
if(e.altKey&&(k==='ArrowUp'||k==='ArrowDown')){
e.preventDefault()
const dir=k==='ArrowUp'?-1:1
if(S.nav.kind==='server'&&S.sdata[S.nav.sid]){
const d=S.sdata[S.nav.sid]
let list=[...d.channels].sort((a,b)=>{
const ca=d.categories.find(c=>c.id===a.category_id)?.position??-1
const cb=d.categories.find(c=>c.id===b.category_id)?.position??-1
return ca-cb||a.position-b.position
})
if(e.shiftKey)list=list.filter(c=>c.id===S.nav.room||unreadOf(c.id))
const i=list.findIndex(c=>c.id===S.nav.room)
const n=list[(i+dir+list.length)%list.length]
if(n)go(`/s/${S.nav.sid}/${n.id}`)
}else{
let list=S.convs.filter(c=>c.accepted)
if(e.shiftKey)list=list.filter(c=>c.id===S.nav.room||unreadOf(c.id))
const i=list.findIndex(c=>c.id===S.nav.room)
const n=list[(i+dir+list.length)%list.length]
if(n)go('/dm/'+n.id)
}
return
}
if(k==='Escape'&&dialogOpen()){closeTopDialog()}
})

let idleT=null
let idle=false
function activity(){
if(!S.me)return
if(idle&&S.me.presence==='online'){idle=false;sendAll({t:'presence',s:'online'})}
clearTimeout(idleT)
idleT=setTimeout(()=>{if(S.me?.presence==='online'&&!V.ch){idle=true;sendAll({t:'presence',s:'idle'})}},300000)
}
for(const ev of['pointerdown','keydown','focus'])addEventListener(ev,activity,{passive:true})

setInterval(()=>{if(S.me&&!document.hidden)loadUnread().catch(()=>{})},180000)
on('unread',()=>{
let m=0,any=false
for(const r of Object.keys(S.unread)){const u=unreadOf(r);if(u){m+=u.mentions;any=true}}
document.title=document.title.replace(/^\(\d+\) /,'')
if(m)document.title=`(${m}) ${document.title}`
})
addEventListener('beforeunload',()=>{})

startP2P()
addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__pwa=e})
addEventListener('appinstalled',()=>{window.__pwa=null})
if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.t==='goto'&&S.me)go(e.data.url)})
boot()

function kaboom(msg){let n=0;const t=setInterval(()=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>=8&&r.height>=8};const w=document.querySelector('.mw[data-id="'+msg.id+'"] .av');let a=w&&vis(w)?w:null;if(!a){const l=[...document.querySelectorAll('.av[data-uid="'+msg.author.id+'"]')].filter(vis);a=l[l.length-1]}if(a){clearInterval(t);import('./cakefx.js').then(m=>m.throwCake(a))}else if(++n>8)clearInterval(t)},200)}
