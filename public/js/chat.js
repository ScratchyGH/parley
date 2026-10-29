import{scheduleDialog}from'./schedule.js'
import{recorderButton}from'./voiceclip.js'
import{translateMsg,catchUp,remind,remindDialog,parseDelay}from'./tools.js'
import{h,mount,clear,icon,gtag,GET,POST,PATCH,PUT,DEL,fmtSize,fmtDate,fmtStamp,avatar,toast,fail,menu,menuAt,confirmBox,copyText,debounce,rid,dayKey,tzo}from'./util.js'
import{render,plain}from'./md.js'
import{emojiPicker}from'./emoji.js'
import{S,P,on,emit,cacheUser,user,isDm,chanInfo,conv,convTitle,roomPerms,setting,hubOf,loadMembers,can}from'./state.js'
import{send as wsSend}from'./net.js'
import{renderAttachments,renderPoll,threadChip,reactionFace,renderSticker}from'./chatx.js'
import{uploadAttachment}from'./uploader.js'
import{joinRoom,pageFromPeers,recordMessages,forgetMessage,seedFile}from'./p2p/index.js'
import{pollDialog,threadDialog,forwardDialog,stickerDialog}from'./dialogs2.js'
import{gifPicker,importGif}from'./gifs.js'
import{slash}from'./slash.js'
import{warnDialog}from'./modcases.js'
import{tw}from'./tweaks.js'
import{go}from'./nav.js'

let C=null
const drafts=new Map()
const unfurlCache=new Map()
let unfurlObs=null

export const currentRoom=()=>C?.room||null

function nearBottom(){return C.scroller.scrollHeight-C.scroller.scrollTop-C.scroller.clientHeight<80}
function toBottom(){C.scroller.scrollTop=C.scroller.scrollHeight}

export function openChat(root,room,jump){
closeChat()
const info=isDm(room)?null:chanInfo(room)
C={room,root,list:[],wraps:new Map(),moreBefore:false,moreAfter:false,lastRead:'',divider:null,loading:false,stick:true,replyTo:null,editing:null,files:[],typers:new Map(),readUpTo:'',gen:0,slow:0,slowTimer:null,mentionIdx:0,mentions:[]}
C.content=h('div',{class:'mcontent'})
C.scroller=h('div',{class:'msgs',role:'log','aria-live':'off','aria-label':'Messages',tabindex:'0',on:{scroll:onScroll}},C.content)
C.jumpBar=h('button',{class:'btn sm',style:{position:'absolute',left:'50%',bottom:'8px',transform:'translateX(-50%)',display:'none',zIndex:'3'},on:{click:()=>jumpPresent()}},icon('down','s'),'Jump to present')
C.typing=h('div',{class:'typing','aria-live':'polite'})
C.compWrap=h('div',{class:'comp'})
const body=h('div',{style:{position:'relative',flex:'1',minHeight:'0',display:'flex',flexDirection:'column'}},C.scroller,C.jumpBar)
mount(root,body,C.typing,C.compWrap)
new ResizeObserver(()=>{if(C&&C.stick)toBottom()}).observe(C.content)
buildComposer()
root.ondragover=e=>{if(e.dataTransfer?.types?.includes('Files')){e.preventDefault();root.classList.add('drop')}}
root.ondragleave=e=>{if(e.target===root)root.classList.remove('drop')}
root.ondrop=e=>{root.classList.remove('drop');if(e.dataTransfer?.files?.length){e.preventDefault();addFiles([...e.dataTransfer.files])}}
loadInitial(jump)
if(!isDm(room)&&info)loadMembers(info.sid).catch(()=>{})
joinRoom(room)
}

export function closeChat(){
if(!C)return
drafts.set(C.room,{text:C.ta.value,reply:C.replyTo})
try{if(C.ta.value.trim())localStorage.setItem('parley:draft:'+C.room,C.ta.value);else localStorage.removeItem('parley:draft:'+C.room)}catch{}
for(const f of C.files)if(!f.id&&f.p)f.p.abort()
clearTimeout(C.slowTimer)
C.root.ondragover=C.root.ondragleave=C.root.ondrop=null
C=null
}

async function loadInitial(jump){
const g=++C.gen
C.loading=true
try{
const q=jump?`around=${encodeURIComponent(jump)}`:'limit=50'
const d=await GET(`/api/rooms/${C.room}/messages?${q}`)
if(!C||C.gen!==g)return
C.list=d.messages
for(const m of C.list)cacheUser(m.author)
C.moreBefore=d.more_before
C.moreAfter=d.more_after
if(d.messages.length)recordMessages(C.room,d.messages,[d.more_before?d.messages[0].id:'',d.messages[d.messages.length-1].id])
C.lastRead=d.last_read
const firstNew=C.list.find(m=>m.id>C.lastRead&&m.author.id!==S.me.id)
C.divider=C.lastRead&&firstNew&&!jump?firstNew.id:null
drawAll()
if(jump){
C.stick=false
focusMsg(jump)
}else if(C.divider&&d.mentions!==undefined){
C.stick=false
const el=C.wraps.get(C.divider)
if(el&&C.moreAfter===false){
const total=C.list.filter(m=>m.id>=C.divider).length
if(total>8){el.scrollIntoView({block:'start'})}else{toBottom();C.stick=true}
}else toBottom()
}else{toBottom();C.stick=true}
updateJump()
maybeRead()
if(!C.list.length&&!C.moreBefore)showEmpty()
}catch(e){
if(!C||C.gen!==g)return
mount(C.content,h('div',{class:'empty'},h('div',null,h('p',null,e.message),h('button',{class:'btn',on:{click:()=>openChat(C.root,C.room,jump)}},'Retry'))))
}finally{if(C)C.loading=false}
}

function showEmpty(){
const info=isDm(C.room)?null:chanInfo(C.room)
const t=info?`Welcome to #${info.ch.name}`:'This is the start of your conversation'
mount(C.content,h('div',{class:'empty'},h('div',null,h('h3',{style:{color:'var(--strong)',margin:'0 0 4px'}},t),h('div',null,info?.ch.topic||'No messages yet. Say something.'))))
}

function sameGroup(prev,m){
return prev&&prev.author.id===m.author.id&&!m.reply&&!m.pending_sep&&m.created_at-prev.created_at<420000&&dayKey(prev.created_at)===dayKey(m.created_at)&&!m.failed
}

function buildWrap(i){
const m=C.list[i],prev=C.list[i-1]
const w=h('div',{class:'mw',dataset:undefined})
w.dataset.id=m.id
if(!prev||dayKey(prev.created_at)!==dayKey(m.created_at))w.append(h('div',{class:'sepd',role:'separator'},fmtDate(m.created_at)))
if(C.divider===m.id)w.append(h('div',{class:'sepd new',role:'separator'},'New messages'))
w.append(buildMsg(m,sameGroup(prev,m)&&C.divider!==m.id))
return w
}

function drawAll(){
C.wraps.clear()
const frag=document.createDocumentFragment()
if(C.moreBefore)frag.append(h('div',{class:'hint',style:{textAlign:'center',padding:'8px'}},'Loading earlier messages…'))
for(let i=0;i<C.list.length;i++){
const w=buildWrap(i)
C.wraps.set(C.list[i].id,w)
frag.append(w)
}
mount(C.content,frag)
}

function rebuild(id){
const i=C.list.findIndex(m=>m.id===id)
if(i<0)return
const old=C.wraps.get(id)
const w=buildWrap(i)
C.wraps.set(id,w)
if(old)old.replaceWith(w)
}

function insertMsg(m){
cacheUser(m.author)
if(C.wraps.has(m.id))return
if(C.moreAfter&&m.id>C.list[C.list.length-1]?.id){updateJump();return}
let lo=0,hi=C.list.length
while(lo<hi){const mid=(lo+hi)>>1;if(C.list[mid].id<m.id)lo=mid+1;else hi=mid}
C.list.splice(lo,0,m)
const w=buildWrap(lo)
C.wraps.set(m.id,w)
const next=C.list[lo+1]
const stick=C.stick||nearBottom()||m.author.id===S.me.id
if(next)C.wraps.get(next.id).before(w)
else C.content.append(w)
if(next)rebuild(next.id)
if(C.list.length===1)C.content.querySelector('.empty')?.remove()
else C.content.querySelector('.empty')?.remove()
if(stick){C.stick=true;toBottom()}
trim()
updateJump()
if(m.author.id!==S.me.id)maybeRead()
}

function trim(){
if(!C.stick||C.list.length<=350)return
const drop=C.list.splice(0,C.list.length-300)
for(const m of drop){C.wraps.get(m.id)?.remove();C.wraps.delete(m.id)}
C.moreBefore=true
rebuild(C.list[0].id)
}

function removeMsg(id){
const i=C.list.findIndex(m=>m.id===id)
if(i<0)return
C.list.splice(i,1)
C.wraps.get(id)?.remove()
C.wraps.delete(id)
if(C.list[i])rebuild(C.list[i].id)
if(!C.list.length&&!C.moreBefore)showEmpty()
}

function patchMsg(m){
const i=C.list.findIndex(x=>x.id===m.id)
if(i<0)return
cacheUser(m.author)
C.list[i]=m
rebuild(m.id)
}

async function onScroll(){
C.stick=nearBottom()
updateJump()
if(C.loading)return
const s=C.scroller
if(s.scrollTop<250&&C.moreBefore&&C.list.length){
C.loading=true
const g=C.gen
try{
const before=C.list[0].id
const pg=await pageFromPeers(C.room,before,50)
const d=pg?{messages:pg.msgs,more_before:!pg.end}:await GET(`/api/rooms/${C.room}/messages?limit=50&before=${encodeURIComponent(before)}`)
if(!C||C.gen!==g)return
if(d.messages.length)recordMessages(C.room,d.messages,[d.more_before?d.messages[0].id:'',before])
const prevH=s.scrollHeight,prevT=s.scrollTop
for(const m of d.messages)cacheUser(m.author)
C.list=d.messages.filter(m=>!C.wraps.has(m.id)).concat(C.list)
C.moreBefore=d.more_before
drawAll()
s.scrollTop=prevT+(s.scrollHeight-prevH)
C.stick=false
}catch(e){fail(e)}finally{if(C)C.loading=false}
}else if(nearBottom()&&C.moreAfter&&C.list.length){
C.loading=true
const g=C.gen
try{
const d=await GET(`/api/rooms/${C.room}/messages?limit=50&after=${encodeURIComponent(C.list[C.list.length-1].id)}`)
if(!C||C.gen!==g)return
for(const m of d.messages)cacheUser(m.author)
C.list=C.list.concat(d.messages.filter(m=>!C.wraps.has(m.id)))
C.moreAfter=d.more_after
drawAll()
updateJump()
}catch(e){fail(e)}finally{if(C)C.loading=false}
}else maybeRead()
}

function updateJump(){
C.jumpBar.style.display=(C.moreAfter||!nearBottom())&&C.list.length?'flex':'none'
}

async function jumpPresent(){
if(C.moreAfter){
C.list=[];C.gen++
C.moreAfter=false
await loadInitial()
}else{
C.scroller.scrollTo({top:C.scroller.scrollHeight,behavior:setting('reduced_motion',false)?'auto':'smooth'})
}
}

export async function jumpTo(id){
if(!C)return
if(C.wraps.has(id)){focusMsg(id);return}
C.list=[];C.gen++
await loadInitial(id)
}

function focusMsg(id){
const w=C.wraps.get(id)
if(!w)return
w.scrollIntoView({block:'center'})
const el=w.querySelector('.m')
el.classList.add('hl')
el.focus({preventScroll:true})
setTimeout(()=>el.classList.remove('hl'),2200)
}

const readNow=debounce(async()=>{
if(!C||!C.list.length)return
const last=C.list.filter(m=>!m.pending&&!m.failed).pop()
if(!last||last.id<=C.readUpTo)return
C.readUpTo=last.id
try{await POST(`/api/rooms/${C.room}/read`,{message_id:last.id})}catch{}
},700)
export function maybeRead(){
if(!C||!document.hasFocus()||document.hidden)return
if(C.moreAfter||!nearBottom())return
if(S.unread[C.room]){delete S.unread[C.room];emit('unread')}
readNow()
}
addEventListener('focus',()=>maybeRead())

function userFor(m){return m.author}

function openProfile(e,u){emit('ui:profile',{id:u.id,x:e.clientX,y:e.clientY,el:e.currentTarget})}

function buildMsg(m,cont){
const me=S.me
const own=m.author.id===me.id
const ctx={urls:[],onMention:n=>emit('ui:mention',n),who:whoIs,chan:chanLink}
const el=h('div',{class:'m'+(m.author.bubble?' '+m.author.bubble:'')+(cont?' cont':'')+(m.pending?' sending':'')+(m.failed?' failed':''),tabindex:'-1',role:'article','aria-label':`${m.author.display_name}, ${fmtStamp(m.created_at)}`,on:{
contextmenu:e=>{if(e.target.closest('a,img,video,audio'))return;e.preventDefault();msgMenu(m,e.clientX,e.clientY)},
click:e=>{if(matchMedia('(max-width:820px)').matches&&!e.target.closest('a,button,img,video,audio,.sp'))el.classList.toggle('tap')}
}})
const av=cont?h('div',{class:'av'}):avatar(m.author)
if(!cont){av.style.cursor='pointer';av.addEventListener('click',e=>openProfile(e,m.author))}
const main=h('div',{style:{minWidth:'0'}})
if(m.reply){
const r=m.reply
main.append(r.deleted?h('div',{class:'rp'},icon('reply','s'),'Original message was deleted'):h('div',{class:'rp',role:'button',tabindex:'0',on:{click:()=>jumpTo(r.id),keydown:e=>{if(e.key==='Enter')jumpTo(r.id)}}},icon('reply','s'),h('b',null,r.author),h('span',null,plain(r.content,100))))
}
if(!cont){
const nm=h('b',{class:m.author.nameplate?'np '+m.author.nameplate:null,on:{click:e=>openProfile(e,m.author)}},m.author.namefx?h('span',{class:'nf '+m.author.namefx},m.author.display_name):m.author.display_name)
const un=tw('show_username')&&m.author.username?h('span',{class:'hint tw-un'},'@'+m.author.username):null
const bdg=m.author.badge?h('span',{class:'bdg-i '+m.author.badge,title:'Badge'}):null
const ttl=m.author.title?h('span',{class:'ttl '+m.author.title}):null
const inNp=!!m.author.nameplate
if(inNp){if(bdg)nm.append(bdg);if(ttl)nm.append(ttl)}
main.append(h('div',{class:'mh'},nm,un,inNp?null:bdg,inNp?null:ttl,gtag(m.author.guild_tag,m.author.guild_tag_emoji,m.author.guild_tag_icon_id),h('time',{dateTime:new Date(m.created_at).toISOString(),title:new Date(m.created_at).toLocaleString(undefined,tzo()),'data-t':m.created_at},fmtStamp(m.created_at)),m.pinned?icon('pin','s'):null))
}
if(m.content){
const body=h('div',{class:'mb'},render(m.content,ctx))
if(m.edited_at)body.append(' ',h('span',{class:'ed',title:'Edited '+new Date(m.edited_at).toLocaleString()},'(edited)'))
main.append(body)
}
if(m.poll)main.append(renderPoll(m,x=>rebuild(x.id)))
if(m.attachments?.length)main.append(renderAttachments(m))
if(m.sticker?.file_id)main.append(renderSticker(m))
if(m.thread&&!m.room.startsWith('th_')){
const tc=threadChip(m,chanInfo(m.room)?.sid)
if(tc)main.append(tc)
}
if(m.content&&ctx.urls.length&&setting('link_previews',true)&&!m.pending)main.append(unfurlSlot(ctx.urls[0]))
if(m.reactions?.length){
main.append(h('div',{class:'rx'},m.reactions.map(r=>h('button',{class:r.me?'me':'','aria-pressed':String(r.me),title:r.me?'Remove reaction':'React',on:{click:()=>react(m,r.emoji,!r.me)}},reactionFace(r.emoji),h('span',null,r.count)))))
}
if(m.failed){
main.append(h('div',{class:'hint',style:{color:'var(--err)'}},'Failed to send. ',h('button',{class:'btn sm',on:{click:()=>retry(m)}},'Retry'),' ',h('button',{class:'btn sm',on:{click:()=>removeMsg(m.id)}},'Discard')))
}
el.append(av,main)
if(!m.pending&&!m.failed){
const perms=roomPerms(C.room)
const bar=h('div',{class:'mact',role:'toolbar','aria-label':'Message actions'})
const btn=(ic,t,fn)=>h('button',{class:'ib',title:t,'aria-label':t,on:{click:e=>{e.stopPropagation();fn(e)}}},icon(ic))
if(perms&P.REACT)bar.append(btn('smile','Add reaction',e=>emojiPicker(e.currentTarget,em=>react(m,em,true),chanInfo(C.room)?.sid)))
if(perms&P.SEND)bar.append(btn('reply','Reply',()=>setReply(m)))
if(own&&perms&P.SEND)bar.append(btn('edit','Edit',()=>startEdit(m)))
bar.append(btn('more','More',e=>msgMenu(m,0,0,e.currentTarget)))
el.append(bar)
}
return el
}

function ytId(u){
try{
const x=new URL(u)
const h=x.hostname.replace(/^www\./,'').replace(/^m\./,'')
let id=''
if(h==='youtu.be')id=x.pathname.slice(1)
else if(h==='youtube.com'||h==='music.youtube.com')id=x.pathname==='/watch'?x.searchParams.get('v')||'':(x.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)||[])[1]||''
return/^[A-Za-z0-9_-]{11}$/.test(id)?id:''
}catch{return''}
}
function unfurlSlot(url){
const slot=h('div',{class:'unf-slot'})
const go=async()=>{
let d=unfurlCache.get(url)
if(d===undefined){
d=null
unfurlCache.set(url,null)
try{d=await GET('/api/unfurl?url='+encodeURIComponent(url));unfurlCache.set(url,d)}catch{}
}
const yt=ytId(url)
if(d&&(d.title||d.description))slot.append(h('div',{class:'unf'},yt?h('a',{href:d.url||url,target:'_blank',rel:'noopener noreferrer nofollow',class:'unf-th'},h('img',{src:'/api/yt-thumb/'+yt,alt:'Video thumbnail',loading:'lazy',width:320,height:180}),h('span',{class:'unf-play','aria-hidden':'true'})):null,h('span',null,d.site||''),h('b',null,h('a',{href:d.url||url,target:'_blank',rel:'noopener noreferrer nofollow'},d.title||url)),d.description?h('span',null,d.description.slice(0,200)):null))
}
if(unfurlCache.has(url)){const d=unfurlCache.get(url);if(d)go();return slot}
unfurlObs||=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){unfurlObs.unobserve(e.target);e.target.__go()}},{rootMargin:'100px'})
slot.__go=go
unfurlObs.observe(slot)
return slot
}

async function react(m,emoji,add){
try{
const key=emoji.startsWith('<:')?'e:'+emoji.match(/(f_[a-z0-9]{16})>$/)[1]:emoji
const p=`/api/rooms/${C.room}/messages/${m.id}/reactions/${encodeURIComponent(key)}`
if(add)await PUT(p)
else await DEL(p)
}catch(e){fail(e)}
}

function msgMenu(m,x,y,anchor){
const own=m.author.id===S.me.id
const perms=roomPerms(C.room)
const info=isDm(C.room)?null:chanInfo(C.room)
const items=[]
if(perms&P.SEND)items.push({icon:'reply',label:'Reply',fn:()=>setReply(m)})
if(perms&P.REACT)items.push({icon:'smile',label:'Add reaction',fn:()=>emojiPicker(anchor||C.scroller,em=>react(m,em,true),info?.sid)})
if(info&&!C.room.startsWith('th_')&&info.ch.type!=='forum'&&(perms&P.SEND)&&!m.thread)items.push({icon:'chat',label:'Start thread',fn:()=>threadDialog(info.sid,C.room,m)})
if((m.content||m.attachments?.length)&&!m.poll)items.push({icon:'forward',label:'Forward message',fn:()=>forwardDialog(m)})
if(own&&perms&P.SEND)items.push({icon:'edit',label:'Edit message',fn:()=>startEdit(m)})
if(!own&&['parleyofficial','ᴄᴀɴᴅʏʏʏ'].includes(String(S.me.username||'').toLowerCase()))items.push({icon:'flag',label:'Use ban hammer on '+(m.author.display_name||m.author.username),fn:()=>import('./dialogs.js').then(d=>d.banhammerDialog({id:m.author.id,username:m.author.username,display_name:m.author.display_name||m.author.username}))})
const canPin=isDm(C.room)||(perms&P.MANAGE_MESSAGES)
if(canPin)items.push({icon:'pin',label:m.pinned?'Unpin message':'Pin message',fn:async()=>{try{if(m.pinned)await DEL(`/api/rooms/${C.room}/pins/${m.id}`);else await PUT(`/api/rooms/${C.room}/pins/${m.id}`)}catch(e){fail(e)}}})
items.push('-')
if(m.content)items.push({icon:'copy',label:'Copy text',fn:()=>copyText(m.content)})
const path=isDm(C.room)?`/dm/${C.room}`:`/s/${info?.sid}/${C.room}`
items.push({icon:'link',label:'Copy link',fn:()=>copyText(`${location.origin}${path}?m=${m.id}`)})
if(tw('dev_ids')){items.push({icon:'copy',label:'Copy message ID',fn:()=>copyText(m.id)},{icon:'copy',label:'Copy user ID',fn:()=>copyText(m.author.id)},{icon:'copy',label:'Copy channel ID',fn:()=>copyText(C.room)})}
if(m.content)items.push({icon:'globe',label:'Translate',fn:()=>translateMsg(m.content)})
items.push({icon:'clock',label:'Remind me',fn:()=>remindDialog(m)})
items.push({icon:'bookmark',label:'Save message',fn:async()=>{try{await PUT('/api/saved/'+m.id);toast('Saved','ok')}catch(e){fail(e)}}})
if(!own&&info&&can(info.sid,P.MODERATE)&&m.author.id!==S.me.id)items.push({icon:'flag',label:'Warn author',fn:()=>warnDialog(info.sid,m.author,m.id)})
if(!own)items.push({icon:'flag',label:'Report message',fn:()=>emit('ui:report',{type:'message',id:m.id})})
if(own||perms&P.MANAGE_MESSAGES)items.push('-',{icon:'trash',label:'Delete message',danger:true,fn:()=>delMsg(m)})
if(anchor)menuAt(anchor,items)
else menu(items,x,y)
}

async function delMsg(m){
if(!await confirmBox('Delete message','This message will be removed for everyone. This cannot be undone.','Delete',true))return
try{await DEL(`/api/rooms/${C.room}/messages/${m.id}`);removeMsg(m.id)}catch(e){fail(e)}
}

function setReply(m){
C.replyTo=m
C.editing=null
barUpdate()
C.ta.focus()
}
function startEdit(m){
C.editing=m
C.replyTo=null
C.ta.value=decodeMentions(m.content)
barUpdate()
autoGrow()
C.ta.focus()
}
function barUpdate(){
clear(C.bar)
if(C.editing){
C.bar.style.display='flex'
C.bar.append(h('span',null,'Editing message. Press Escape to cancel.'),h('button',{class:'ib',title:'Cancel edit','aria-label':'Cancel edit',on:{click:cancelEdit}},icon('x','s')))
}else if(C.replyTo){
C.bar.style.display='flex'
C.bar.append(h('span',null,'Replying to ',h('b',null,C.replyTo.author.display_name),': ',plain(C.replyTo.content,80)),h('button',{class:'ib',title:'Cancel reply','aria-label':'Cancel reply',on:{click:()=>{C.replyTo=null;barUpdate()}}},icon('x','s')))
}else C.bar.style.display='none'
}
function cancelEdit(){
C.editing=null
C.ta.value=''
barUpdate()
autoGrow()
}

function wrapSel(a,b=a){
const t=C.ta,s=t.selectionStart,e=t.selectionEnd
const sel=t.value.slice(s,e)
t.setRangeText(a+sel+b,s,e,'end')
if(!sel)t.setSelectionRange(s+a.length,s+a.length)
t.focus()
autoGrow()
}
function prefix(p){
const t=C.ta,v=t.value,s=t.selectionStart,e=t.selectionEnd
const ls=v.lastIndexOf('\n',s-1)+1
let le=v.indexOf('\n',e);if(le<0)le=v.length
const seg=v.slice(ls,le).split('\n').map(x=>x.startsWith(p)?x.slice(p.length):p+x).join('\n')
t.setRangeText(seg,ls,le,'end')
t.focus()
autoGrow()
}
function link(){
const t=C.ta,s=t.selectionStart,e=t.selectionEnd,sel=t.value.slice(s,e)
if(/^https?:\/\//.test(sel)){t.setRangeText('[link]('+sel+')',s,e,'end')}
else{t.setRangeText('['+(sel||'text')+'](https://)',s,e,'end');const p=t.selectionEnd-1;t.setSelectionRange(p-8,p)}
t.focus()
autoGrow()
}
function stampIns(){insert('<t:'+Math.floor(Date.now()/1000+3600)+':R>')}
function insert(text){
const t=C.ta
t.setRangeText(text,t.selectionStart,t.selectionEnd,'end')
t.focus()
autoGrow()
}
export function insertText(t){if(C)insert(t)}
function autoGrow(){
const t=C.ta
t.style.height='auto'
t.style.height=Math.min(t.scrollHeight,Math.round(innerHeight*.4))+'px'
}

function composerState(){
const perms=roomPerms(C.room)
const info=isDm(C.room)?null:chanInfo(C.room)
let why=''
if(isDm(C.room)){
const cv=conv(C.room)
if(cv&&!(perms&P.SEND))why='You cannot send messages in this conversation'
}else if(!(perms&P.SEND)){
const d=S.sdata[info?.sid]
if(d?.me.timeout_until>Date.now())why='You are timed out until '+new Date(d.me.timeout_until).toLocaleString()
else if(info?.ch.type==='announce'||info?.ch.readonly)why='This channel is read-only'
else if(info?.ch.locked)why='This channel is locked'
else why='You do not have permission to send messages here'
}
return why
}

function buildComposer(){
const why=composerState()
const info=isDm(C.room)?null:chanInfo(C.room)
if(why){
mount(C.compWrap,h('div',{class:'ban',style:{borderRadius:'6px',border:'1px solid var(--border)',background:'var(--panel)',borderBottom:'1px solid var(--border)'}},icon('lock','s'),why))
C.ta=h('textarea')
C.bar=h('div')
return
}
const name=isDm(C.room)?convTitle(conv(C.room)):('#'+info?.ch.name)
C.bar=h('div',{class:'cbar',style:{display:'none'}})
C.chips=h('div',{class:'chips',style:{display:'none'}})
C.ac=null
C.ta=h('textarea',{rows:1,maxLength:10000,placeholder:'Message '+name,'aria-label':'Message '+name,enterKeyHint:'send',on:{
input:()=>{autoGrow();typingPing();mentionCheck()},
keydown:onKey,
paste:e=>{const fs=[...(e.clipboardData?.files||[])];if(fs.length){e.preventDefault();addFiles(fs)}},
blur:()=>setTimeout(closeAc,150)
}})
const tx=(l,t,fn)=>h('button',{type:'button',class:'ib t',title:t,'aria-label':t,on:{click:fn}},l)
const tb=(ic,t,fn)=>h('button',{type:'button',class:'ib',title:t,'aria-label':t,on:{click:fn}},icon(ic,'s'))
C.fileIn=h('input',{type:'file',multiple:true,style:{display:'none'},on:{change:e=>{addFiles([...e.target.files]);e.target.value=''}}})
C.sendBtn=h('button',{type:'button',class:'ib',title:'Send','aria-label':'Send message',on:{click:submit}},icon('send'))
const perms=roomPerms(C.room)
mount(C.compWrap,h('div',{class:'cbox'},
C.bar,C.chips,
h('div',{class:'ctb',role:'toolbar','aria-label':'Formatting'},
tx('B','Bold (Ctrl+B)',()=>wrapSel('**')),tx('I','Italic (Ctrl+I)',()=>wrapSel('*')),tx('U','Underline',()=>wrapSel('__')),tx('S','Strikethrough',()=>wrapSel('~~')),tx('H','Highlight',()=>wrapSel('==')),h('span',{class:'sep'}),
tx('H1','Heading',()=>prefix('## ')),tx('•','Bulleted list',()=>prefix('- ')),tx('1.','Numbered list',()=>prefix('1. ')),tx('☑','Task list',()=>prefix('- [ ] ')),tx('❝','Quote',()=>prefix('> ')),h('span',{class:'sep'}),
tb('code','Inline code',()=>wrapSel('`')),tb('file','Code block',()=>wrapSel('```\n','\n```')),tb('link','Link',()=>link()),tb('eyeoff','Spoiler',()=>wrapSel('||')),tb('clock','Insert a time that shows in everyone\'s timezone',()=>stampIns())),
h('div',{class:'crow'},
perms&P.ATTACH?h('button',{type:'button',class:'ib',title:'Attach files','aria-label':'Attach files',on:{click:()=>C.fileIn.click()}},icon('clip')):null,
C.fileIn,C.ta,
h('button',{type:'button',class:'ib',title:'Schedule message','aria-label':'Schedule message',on:{click:()=>scheduleDialog(C.room,C.ta.value,()=>{C.ta.value='';autoGrow()})}},icon('clock')),
h('button',{type:'button',class:'ib',title:'Create poll','aria-label':'Create poll',on:{click:()=>pollDialog(C.room)}},icon('list')),
h('button',{type:'button',class:'ib',title:'Stickers','aria-label':'Stickers',on:{click:()=>stickerDialog(C.room)}},icon('image')),
perms&P.ATTACH?recorderButton(addFiles):null,
perms&P.ATTACH?h('button',{type:'button',class:'ib',title:'GIF','aria-label':'Send a GIF',on:{click:()=>openGif('')}},icon('gif')):null,
h('button',{type:'button',class:'ib',title:'Emoji','aria-label':'Emoji',on:{click:e=>emojiPicker(e.currentTarget,em=>insert(em),info?.sid)}},icon('smile')),
C.sendBtn)))
let d=drafts.get(C.room)
if(!d){try{const t=localStorage.getItem('parley:draft:'+C.room);if(t)d={text:t}}catch{}}
if(d){C.ta.value=d.text||'';C.replyTo=d.reply||null;barUpdate();autoGrow()}
if(info&&info.ch.slowmode)C.slow=info.ch.slowmode
if(matchMedia('(pointer:fine)').matches)setTimeout(()=>C?.ta.focus(),0)
}

let lastTyping=0
function typingPing(){
if(tw('silent_typing')||!C.ta.value.trim()||Date.now()-lastTyping<3000)return
lastTyping=Date.now()
const hub=hubOf(C.room)
if(hub)wsSend(hub,{t:'typing',ch:C.room})
}

function onKey(e){
if(C.ac&&C.ac.children.length){
if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();C.mentionIdx=(C.mentionIdx+(e.key==='ArrowDown'?1:-1)+C.mentions.length)%C.mentions.length;drawAc();return}
if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();pickMention(C.mentions[C.mentionIdx]);return}
if(e.key==='Escape'){e.preventDefault();closeAc();return}
}
const mod=e.ctrlKey||e.metaKey
if(mod&&e.key==='b'){e.preventDefault();wrapSel('**');return}
if(mod&&e.key==='i'){e.preventDefault();wrapSel('*');return}
if(e.key==='Escape'){
if(C.editing){cancelEdit();return}
if(C.replyTo){C.replyTo=null;barUpdate();return}
}
if(e.key==='ArrowUp'&&!C.ta.value&&!e.shiftKey){
const mine=[...C.list].reverse().find(m=>m.author.id===S.me.id&&!m.pending&&!m.failed)
if(mine){e.preventDefault();startEdit(mine)}
return
}
if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){
const ctrl=setting('send_ctrl_enter',false)
if(ctrl&&!mod)return
e.preventDefault()
submit()
}
}

function rolesHere(){
if(isDm(C.room))return[]
const sid=chanInfo(C.room)?.sid
return sid?(S.sdata[sid]?.roles||[]).filter(r=>!r.is_everyone):[]
}
function pool(){
if(isDm(C.room))return conv(C.room)?.members||[]
const sid=chanInfo(C.room)?.sid
return sid?(S.sdata[sid]?.memberList||[]):[]
}
function chanLink(id){
for(const sid of Object.keys(S.sdata)){
const c=S.sdata[sid]?.channels?.find(x=>x.id===id)
if(c)return{label:'#'+c.name,go:()=>go(`/s/${sid}/${id}`)}
}
return null
}
function whoIs(t){
if(t==='everyone')return{label:'@everyone'}
if(t[0]==='u'){const u=S.users.get(t)||(t===S.me.id?S.me:null);return u?{label:'@'+(u.nickname||u.display_name)}:{label:'@unknown'}}
const r=(S.sdata[chanInfo(C.room)?.sid]?.roles||[]).find(x=>x.id===t.slice(1))
return r?{label:'@'+r.name,color:r.color||null}:{label:'@deleted-role'}
}
function encodeMentions(text){
const users=new Map(pool().map(u=>[u.username.toLowerCase(),u.id]))
users.set(S.me.username.toLowerCase(),S.me.id)
const roles=new Map(rolesHere().map(r=>[r.name.toLowerCase(),r.id]))
const chans=new Map((S.sdata[chanInfo(C.room)?.sid]?.channels||[]).map(c=>[c.name.toLowerCase(),c.id]))
return text.split(/(```[\s\S]*?```|`[^`\n]*`)/).map((p,i)=>i%2?p:p.replace(/(^|[^\w#<&])#([a-zA-Z0-9_-]{1,60})(?![\w-])/g,(all,pre,n)=>chans.has(n.toLowerCase())?pre+'<#'+chans.get(n.toLowerCase())+'>':all).replace(/(^|[^\w@<])@([a-zA-Z0-9_.-]{1,40})/g,(all,pre,n)=>{
const k=n.toLowerCase()
if(k==='everyone')return pre+'<@everyone>'
if(users.has(k))return pre+'<@'+users.get(k)+'>'
if(roles.has(k))return pre+'<@&'+roles.get(k)+'>'
return all
})).join('')
}
function decodeMentions(text){
text=text.replace(/<#(ch_[a-z0-9]{16})>/g,(all,id)=>{const w=chanLink(id);return w?w.label:all})
return text.replace(/<@(everyone|u_[a-z0-9]{16}|&r_[a-z0-9]{16})>/g,(all,t)=>{
const w=whoIs(t)
return w.label==='@unknown'||w.label==='@deleted-role'?all:w.label
})
}
function closeAc(){if(C?.ac){C.ac.remove();C.ac=null}}
async function mentionCheck(){
const t=C.ta
const before=t.value.slice(0,t.selectionStart)
const cm=before.match(/(?:^|\s)#([a-zA-Z0-9_-]{0,40})$/)
if(cm&&!isDm(C.room)){
const sid=chanInfo(C.room)?.sid
const q=cm[1].toLowerCase()
C.mentions=(S.sdata[sid]?.channels||[]).filter(c=>c.name.toLowerCase().includes(q)).sort((a,b)=>(a.name.toLowerCase().startsWith(q)?0:1)-(b.name.toLowerCase().startsWith(q)?0:1)||a.position-b.position).slice(0,8).map(c=>({chan:true,id:c.id,username:c.name,display_name:c.topic||c.type}))
C.mentionIdx=0
if(!C.mentions.length){closeAc();return}
if(!C.ac){C.ac=h('div',{class:'ac',role:'listbox'});C.compWrap.append(C.ac)}
drawAc()
return
}
const m=before.match(/(?:^|\s)@([\p{L}\p{M}\p{N}_.-]{0,24})$/u)
if(!m){closeAc();return}
const q=m[1].toLowerCase()
let pool=[]
if(isDm(C.room))pool=(conv(C.room)?.members||[]).filter(u=>u.id!==S.me.id)
else{
const sid=chanInfo(C.room)?.sid
if(!sid)return
pool=(S.sdata[sid]?.memberList)||await loadMembers(sid).catch(()=>[])
if(can(sid,P.MENTION_ALL))pool=[{id:'everyone',username:'everyone',display_name:'Notify everyone in this channel',special:true},...rolesHere().map(r=>({id:r.id,username:r.name,display_name:'Notify this role',special:true})),...pool]
}
C.mentions=pool.filter(u=>u.username.toLowerCase().startsWith(q)||u.display_name.toLowerCase().includes(q)).slice(0,8)
C.mentionIdx=0
if(!C.mentions.length){closeAc();return}
if(!C.ac){C.ac=h('div',{class:'ac',role:'listbox'});C.compWrap.append(C.ac)}
drawAc()
}
function drawAc(){
mount(C.ac,C.mentions.map((u,i)=>h('button',{type:'button',role:'option',class:i===C.mentionIdx?'on':'','aria-selected':String(i===C.mentionIdx),on:{mousedown:e=>{e.preventDefault();pickMention(u)}}},u.chan?icon('hash','s'):u.special?icon('users','s'):avatar(u,'sm'),h('b',null,(u.chan?'#':'@')+u.username),h('span',{class:'hint',style:{margin:'0'}},u.special?u.display_name:u.display_name))))
}
function pickMention(u){
const t=C.ta
const pos=t.selectionStart
const sig=u.chan?'#':'@'
const before=t.value.slice(0,pos).replace(u.chan?/#[a-zA-Z0-9_-]{0,40}$/:/@[\p{L}\p{M}\p{N}_.-]{0,24}$/u,'')
t.value=before+sig+u.username+' '+t.value.slice(pos)
const np=(before+sig+u.username+' ').length
t.setSelectionRange(np,np)
closeAc()
t.focus()
autoGrow()
}

function renderChips(){
const c=C.chips
if(!C.files.length){c.style.display='none';return}
c.style.display='flex'
mount(c,C.files.map(f=>h('div',{class:'chip',title:f.name},icon(f.file.type.startsWith('image/')?'file':'file','s'),h('span',null,f.name+' ('+fmtSize(f.file.size)+')'+(f.stage?' · '+f.stage+'…':'')),f.err?h('span',{style:{color:'var(--err)'}},f.err):null,
h('div',{class:'pg',style:{width:Math.round((f.prog||0)*100)+'%',display:f.id?'none':'block'}}),
h('button',{class:'ib',style:{width:'22px',height:'22px'},title:'Remove','aria-label':'Remove '+f.name,on:{click:()=>removeFile(f)}},icon('x','s')))))
C.sendBtn.disabled=C.files.some(f=>!f.id&&!f.err)
}
function removeFile(f){
if(!f.id&&f.p)f.p.abort()
C.files=C.files.filter(x=>x!==f)
if(f.id)DEL('/api/files/'+f.id).catch(()=>{})
renderChips()
}
function addFiles(fs){
if(!C||!C.chips)return
if(!(roomPerms(C.room)&P.ATTACH)){toast('You cannot attach files here','err');return}
for(const file of fs){
if(C.files.length>=24){toast('You can attach up to 24 files per message','err');break}
const f={file,name:file.name,prog:0}
C.files.push(f)
const room=C.room
f.p=uploadAttachment(file,{room},(p,stage)=>{if(stage)f.stage=stage;if(p!=null){f.prog=p;f.stage=null}if(C&&C.room===room)renderChips()})
f.p.then(d=>{f.id=d.id;f.mime=d.mime;f.size=d.size;f.name=d.name;f.stage=null;seedFile({id:d.id,room,name:d.name,mime:d.mime,sha256:d.sha256},d.file);if(C&&C.room===room)renderChips()},e=>{if(e.cancelled)return;f.err=e.message;toast(`${file.name}: ${e.message}`,'err');if(C&&C.room===room)renderChips()})
}
renderChips()
}

function startSlow(){
if(!C.slow)return
const info=chanInfo(C.room)
if(info&&(info.ch.perms&(P.MANAGE_MESSAGES|P.MANAGE_CHANNELS)))return
let left=C.slow
const room=C.room
C.sendBtn.disabled=true
const tick=()=>{
if(!C||C.room!==room)return
if(left<=0){C.ta.placeholder=C.ta.getAttribute('aria-label');renderChips();if(!C.files.some(f=>!f.id&&!f.err))C.sendBtn.disabled=false;return}
C.ta.placeholder=`Slow mode: wait ${left}s`
left--
C.slowTimer=setTimeout(tick,1000)
}
tick()
}

function openGif(query){
if(!C||!(roomPerms(C.room)&P.ATTACH)){toast('You cannot attach files here','err');return}
const room=C.room
gifPicker({query,onPick:async g=>{
try{
const f=await importGif(g,'attachment',room)
const d=await POST(`/api/rooms/${room}/messages`,{content:'',nonce:rid(),attachments:[f.id]})
if(C&&C.room===room)insertMsg(d.message)
}catch(e){fail(e)}
}})
}

async function submit(){
if(!C||!C.ta||C.sendBtn?.disabled)return
let raw=C.ta.value.replace(/\s+$/,'')
if(!C.editing){
const sl=slash(raw)
if(sl.error){toast(sl.error,'err');return}
if(sl.gif!==undefined){C.ta.value='';autoGrow();openGif(sl.gif);return}
if(sl.catchup){C.ta.value='';autoGrow();catchUp(C.room);return}
if(sl.remind){const mn=parseDelay(sl.remind.when);if(!mn){toast('Use a time like 30m, 2h or 1d','err');return}C.ta.value='';autoGrow();remind(mn,sl.remind.note);return}
raw=sl.text
}
const text=encodeMentions(raw)
if(C.files.some(f=>!f.id&&!f.err)){toast('Wait for uploads to finish','err');return}
const ready=C.files.filter(f=>f.id)
if(C.editing){
if(!text)return
const m=C.editing
cancelEdit()
if(text===m.content)return
try{const d=await PATCH(`/api/rooms/${C.room}/messages/${m.id}`,{content:text});if(d?.message)patchMsg(d.message)}catch(e){fail(e);C.ta.value=text;autoGrow()}
return
}
if(!text&&!ready.length)return
if(text.length>10000){toast('Message is too long (10000 characters max)','err');return}
const nonce=rid()
const body={content:text,nonce}
if(C.replyTo)body.reply_to=C.replyTo.id
if(ready.length)body.attachments=ready.map(f=>f.id)
const tmp={id:'~'+nonce,room:C.room,author:{id:S.me.id,username:S.me.username,display_name:S.me.display_name,avatar_id:S.me.avatar_id,accent:S.me.accent,guild_tag:S.servers.find(x=>x.id===S.me.tag_server)?.tag||null,guild_tag_emoji:S.servers.find(x=>x.id===S.me.tag_server)?.tag_emoji||null,guild_tag_icon_id:S.servers.find(x=>x.id===S.me.tag_server)?.tag_icon_id||null},content:text,created_at:Date.now(),edited_at:null,pinned:false,reply:C.replyTo?{id:C.replyTo.id,author:C.replyTo.author.display_name,content:C.replyTo.content.slice(0,140)}:null,attachments:ready.map(f=>({id:f.id,name:f.name,mime:f.mime,size:f.size})),reactions:[],pending:true,body}
C.ta.value=''
try{localStorage.removeItem('parley:draft:'+tmp.room)}catch{}
C.files=[]
C.replyTo=null
renderChips()
barUpdate()
autoGrow()
closeAc()
await post(tmp)
}

async function post(tmp){
const room=tmp.room
tmp.pending=true
tmp.failed=false
if(C&&C.room===room){
if(C.wraps.has(tmp.id)){patchMsg(tmp)}else{C.moreAfter&&await jumpPresentSilent();insertMsg(tmp)}
}
try{
const d=await POST(`/api/rooms/${room}/messages`,tmp.body)
if(!C||C.room!==room)return
removeMsg(tmp.id)
insertMsg(d.message)
startSlow()
transcribeAll(d.message)
}catch(e){
if(!C||C.room!==room)return
tmp.pending=false
tmp.failed=true
patchMsg(tmp)
toast(e.message,'err')
}
}
function transcribeAll(m){
const q=(m.files||[]).filter(f=>/^voice-clip/i.test(f.name)&&!f.transcript).map(f=>f.id)
const run=async()=>{while(q.length){const id=q.shift();try{await POST(`/api/files/${id}/transcribe`,{})}catch{}}}
for(let i=0;i<Math.min(4,q.length);i++)run()
}
async function jumpPresentSilent(){C.list=[];C.gen++;C.moreAfter=false;await loadInitial()}
function retry(m){
if(!m.body)return
post(m)
}

export function chatEvent(room,ev){
if(!C)return
if(ev.t==='typing'){
if(ev.ch!==C.room||ev.uid===S.me.id)return
clearTimeout(C.typers.get(ev.uid))
C.typers.set(ev.uid,setTimeout(()=>{C?.typers.delete(ev.uid);drawTyping()},5500))
drawTyping()
return
}
if(ev.t==='msg.new'){
if(ev.m.room!==C.room)return
if(ev.m.author.id!==S.me.id){clearTimeout(C.typers.get(ev.m.author.id));C.typers.delete(ev.m.author.id);drawTyping()}
const prev=!C.moreAfter?C.list.filter(x=>!x.pending&&!x.failed).pop():null
if(ev.m.sig)recordMessages(ev.m.room,[ev.m],prev?[prev.id,ev.m.id]:null)
insertMsg(ev.m)
C.wraps.get(ev.m.id)?.querySelector('.m')?.classList.add('new-in')
}else if(ev.t==='msg.update'){if(ev.m.room===C.room){if(ev.m.sig)recordMessages(ev.m.room,[ev.m],null);patchMsg(ev.m)}}
else if(ev.t==='msg.delete'){if(ev.room===C.room){forgetMessage(ev.room,ev.id);removeMsg(ev.id)}}
else if(ev.t==='poll.update'){
if(ev.room!==C.room)return
const m=C.list.find(x=>x.id===ev.id)
if(!m||!m.poll)return
m.poll.options.forEach((o,i)=>{o.votes=ev.options[i]??o.votes})
m.poll.total=ev.total
m.poll.closed=ev.closed
rebuild(m.id)
}else if(ev.t==='thread.new'){
if(ev.thread.channel_id!==C.room||!ev.message_id)return
const m=C.list.find(x=>x.id===ev.message_id)
if(!m)return
m.thread={id:ev.thread.id,name:ev.thread.name,count:0}
rebuild(m.id)
}else if(ev.t==='thread.update'){
const m=C.list.find(x=>x.thread&&x.thread.id===ev.thread.id)
if(!m)return
m.thread.name=ev.thread.name
m.thread.count=ev.thread.count
rebuild(m.id)
}
else if(ev.t==='att.delete'){
if(ev.room!==C.room)return
const m=C.list.find(x=>x.id===ev.message_id)
if(m){m.attachments=m.attachments.filter(a=>a.id!==ev.file_id);rebuild(m.id)}
}else if(ev.t==='reaction'){
if(ev.room!==C.room)return
const m=C.list.find(x=>x.id===ev.mid)
if(!m)return
let r=m.reactions.find(x=>x.emoji===ev.emoji)
if(ev.add){
if(r){r.count++;if(ev.uid===S.me.id)r.me=true}
else m.reactions.push({emoji:ev.emoji,count:1,me:ev.uid===S.me.id})
}else if(r){
r.count--
if(ev.uid===S.me.id)r.me=false
if(r.count<=0)m.reactions=m.reactions.filter(x=>x!==r)
}
rebuild(m.id)
}
}
function drawTyping(){
const names=[...C.typers.keys()].map(id=>user(id)?.display_name||'Someone')
C.typing.textContent=!names.length?'':names.length===1?`${names[0]} is typing…`:names.length===2?`${names[0]} and ${names[1]} are typing…`:'Several people are typing…'
}

export function resyncChat(){
if(!C)return
C.gen++
const keep=C.ta?.value
loadInitial().then(()=>{if(C&&keep!==undefined&&C.ta&&!C.ta.value)C.ta.value=keep})
}
export function refreshComposer(){
if(!C)return
const v=C.ta?.value||''
buildComposer()
if(C.ta&&v)C.ta.value=v
}
export const chatAtBottom=()=>C?nearBottom()&&!C.moreAfter:false
