import{beforeSend as labsBefore,afterSend as labsAfter,onReaction as labsReact}from'./xlabs.js'
import{fireHooks}from'./devhooks.js'
import{GTAG}from'./auth.js'
import{stickerFor}from'./perks.js'
import{fail,now,newId,msgId,str,limit,body,json,clamp,placeholders}from'./util.js'
import{P,resolveRoom,loadMember,chanPerms,visibleChannels}from'./perms.js'
import{automod,pollData}from'./extras.js'
import{signMsg}from'./sign.js'
import{runBlocks}from'./blocks.js'
import{pushTo}from'./push.js'
import{urlsIn,inspectLink,imageExplicit,filterOn}from'./safety.js'

const MAX_LEN=10000
const floorId=t=>t.toString(36).padStart(9,'0')

async function extBlock(env,rr,content,stk){
if(rr.kind!=='channel'||!rr.m.server.block_ext_emoji)return
const sid=rr.m.server.id
if(stk&&stk.server_id!==sid)fail(422,'This server only allows its own stickers')
const ids=[...new Set([...String(content).matchAll(/<:[a-zA-Z0-9_]{2,32}:(f_[a-z0-9]{16})>/g)].map(x=>x[1]))].slice(0,30)
if(!ids.length)return
const own=(await env.DB.prepare(`select file_id from emoji where server_id=? and file_id in (${placeholders(ids)})`).bind(sid,...ids).all()).results.map(x=>x.file_id)
if(ids.some(i=>!own.includes(i)))fail(422,'This server only allows its own emoji')
}

export async function hydrate(env,rows,meId){
if(!rows.length)return[]
const ids=rows.map(r=>r.id)
const authors=[...new Set(rows.map(r=>r.author_id))]
const replies=[...new Set(rows.map(r=>r.reply_to).filter(Boolean))]
const q=(s,...a)=>env.DB.prepare(s).bind(...a).all().then(x=>x.results)
const pollIds=rows.filter(r=>r.has_poll).map(r=>r.id)
const thIds=[...new Set(rows.map(r=>r.thread_id).filter(Boolean))]
const[au,at,rx,rp,pd,th]=await Promise.all([
q(`select u.id,u.username,u.display_name,u.avatar_id,u.accent,u.nameplate,u.frame,u.effect,u.namefx,u.badge,u.title,u.bubble,${GTAG} from users u where u.id in (${placeholders(authors)})`,...authors),
q(`select id,message_id,name,mime,size,sha256 from files where message_id in (${placeholders(ids)})`,...ids),
q(`select message_id,emoji,count(*) n,max(user_id=?) me from reactions where message_id in (${placeholders(ids)}) group by message_id,emoji order by min(rowid)`,meId,...ids),
replies.length?q(`select m.id,m.content,m.deleted_at,u.id uid,u.display_name from messages m join users u on u.id=m.author_id where m.id in (${placeholders(replies)})`,...replies):[],
pollIds.length?pollData(env,pollIds,meId):{},
thIds.length?q(`select id,name,count from threads where id in (${placeholders(thIds)})`,...thIds):[]
])
const stIds=[...new Set(rows.filter(m=>m.sticker_id).map(m=>m.sticker_id))]
const STK=stIds.length?Object.fromEntries((await env.DB.prepare(`select id,name,file_id from stickers where id in (${placeholders(stIds)})`).bind(...stIds).all()).results.map(x=>[x.id,x])):{}
const A=Object.fromEntries(au.map(x=>[x.id,x]))
const R=Object.fromEntries(rp.map(x=>[x.id,x]))
return rows.map(m=>{
const rep=m.reply_to?R[m.reply_to]:null
return{
id:m.id,room:m.room,author:A[m.author_id]||{id:m.author_id,username:'unknown',display_name:'Unknown'},
content:m.content,created_at:m.created_at,edited_at:m.edited_at,pinned:!!m.pinned,
reply:m.reply_to?(rep&&!rep.deleted_at?{id:rep.id,author:rep.display_name,content:rep.content.slice(0,140)}:{id:m.reply_to,deleted:true}):null,
attachments:at.filter(f=>f.message_id===m.id).map(f=>({id:f.id,name:f.name,mime:f.mime,size:f.size,sha256:f.sha256||null})),
reactions:rx.filter(x=>x.message_id===m.id).map(x=>({emoji:x.emoji,count:x.n,me:!!x.me})),
sig:m.sig||null,
sticker:m.sticker_id?STK[m.sticker_id]||{id:m.sticker_id,name:'sticker',file_id:null}:null,
poll:m.has_poll?pd[m.id]||null:null,
thread:m.thread_id?th.find(x=>x.id===m.thread_id)||null:null
}
})
}

export async function publishMsg(c,rr,event,opts={}){
if(rr.kind==='channel')c.pub(rr.hub,event,{ch:rr.gate||rr.room,...opts})
else{
const mem=(await c.env.DB.prepare('select user_id from conv_members where conv_id=?').bind(rr.room).all()).results
for(const m of mem.slice(0,25))c.pub('u_'+m.user_id,event)
}
}

const emojiOk=e=>typeof e==='string'&&e.length>=1&&e.length<=40&&!/[\s<>\u0000-\u001f]/.test(e)
const likeEsc=s=>'%'+s.replace(/[\\%_]/g,'\\$&')+'%'

async function getMsg(c,rr,mid){
const m=await c.env.DB.prepare('select * from messages where id=? and room=? and deleted_at is null').bind(mid,rr.room).first()
if(!m)fail(404,'Message not found')
return m
}

export default function(r){
r.add('GET','/api/rooms/:room/messages',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const sp=c.url.searchParams
const lim=clamp(sp.get('limit'),50,1,50)
const db=c.env.DB
const sel='select * from messages where room=? and deleted_at is null'
let rows,moreBefore=false,moreAfter=false
if(sp.get('around')){
const mid=sp.get('around')
const a=(await db.prepare(sel+' and id<=? order by id desc limit 26').bind(rr.room,mid).all()).results
const b=(await db.prepare(sel+' and id>? order by id asc limit 26').bind(rr.room,mid).all()).results
moreBefore=a.length>25;moreAfter=b.length>25
rows=[...a.slice(0,25).reverse(),...b.slice(0,25)]
}else if(sp.get('after')){
const x=(await db.prepare(sel+' and id>? order by id asc limit ?').bind(rr.room,sp.get('after'),lim+1).all()).results
moreAfter=x.length>lim
rows=x.slice(0,lim)
}else{
const x=(await db.prepare(sel+(sp.get('before')?' and id<?':' and id<>?')+' order by id desc limit ?').bind(rr.room,sp.get('before')||'',lim+1).all()).results
moreBefore=x.length>lim
rows=x.slice(0,lim).reverse()
}
const rs=await db.prepare('select last_read,mentions from read_state where user_id=? and room=?').bind(c.user.id,rr.room).first()
return{messages:await hydrate(c.env,rows,c.user.id),more_before:moreBefore,more_after:moreAfter,last_read:rs?.last_read||'',mentions:rs?.mentions||0}
})

r.add('POST','/api/rooms/:room/messages',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
if(!(rr.perms&P.SEND))fail(403,rr.kind==='dm'?'You cannot message this person':'You cannot send messages here')
limit('msg:'+c.user.id,20,10000)
const b=await body(c.req,40000)
let content=typeof b.content==='string'?b.content.replace(/\r\n/g,'\n'):''
if(b.forward_of){
const src=await c.env.DB.prepare('select m.*,u.display_name from messages m join users u on u.id=m.author_id where m.id=? and m.deleted_at is null').bind(String(b.forward_of)).first()
if(!src)fail(404,'Original message not found')
await resolveRoom(c.env,src.room,c.user.id)
content=src.content.split('\n').map(l=>'> '+l).join('\n')+`\n*Forwarded from ${src.display_name}*`
}
content=content.trim()
if(content.length>MAX_LEN)fail(413,`Messages can be up to ${MAX_LEN} characters`)
const attIds=Array.isArray(b.attachments)?[...new Set(b.attachments.map(String))].slice(0,10):[]
let stk=null
if(b.sticker_id){stk=await stickerFor(c.env,String(b.sticker_id),c.user.id);if(!stk)fail(400,'Sticker not available')}
if(!content&&!attIds.length&&!stk)fail(400,'Message is empty')
const nonce=typeof b.nonce==='string'&&b.nonce.length<=40?b.nonce:null
if(nonce){
const ex=await c.env.DB.prepare('select * from messages where author_id=? and nonce=?').bind(c.user.id,nonce).first()
if(ex)return{message:(await hydrate(c.env,[ex],c.user.id))[0],duplicate:true}
}
await automod(c.env,rr,content)
await extBlock(c.env,rr,content,stk)
await labsBefore(c,rr,content)
const last=await c.env.DB.prepare('select content,created_at from messages where room=? and author_id=? order by id desc limit 1').bind(rr.room,c.user.id).first()
if(last){
const priv=rr.kind==='channel'&&(rr.perms&(P.MANAGE_MESSAGES|P.MODERATE))
if(rr.kind==='channel'&&rr.ch.slowmode&&!priv&&now()-last.created_at<rr.ch.slowmode*1000)fail(429,`Slow mode is on. Wait ${Math.ceil((rr.ch.slowmode*1000-(now()-last.created_at))/1000)}s before sending again.`)
if(content.length>5&&last.content===content&&now()-last.created_at<30000)fail(429,'You already sent that message')
}
if(rr.kind==='dm'&&rr.conv.type==='dm'){
const o=await c.env.DB.prepare('select accepted from conv_members where conv_id=? and user_id!=?').bind(rr.room,c.user.id).first()
if(o&&!o.accepted){
const n=await c.env.DB.prepare('select count(*) n from (select 1 from messages where room=? and author_id=? limit 5)').bind(rr.room,c.user.id).first()
if(n.n>=5)fail(403,'Wait for them to accept your message request before sending more')
}
}
let reply=null
if(b.reply_to){
reply=await c.env.DB.prepare('select id from messages where id=? and room=? and deleted_at is null').bind(String(b.reply_to),rr.room).first()
if(!reply)fail(400,'The message you are replying to no longer exists')
}
let files=[]
if(attIds.length){
files=(await c.env.DB.prepare(`select id from files where id in (${placeholders(attIds)}) and owner_id=? and kind='attachment' and room=? and message_id is null`).bind(...attIds,c.user.id,rr.room).all()).results
if(files.length!==attIds.length)fail(400,'One or more attachments are invalid or already used')
}
const id=msgId()
const t=now()
const users=[...new Set([...content.matchAll(/<@(u_[a-z0-9]{16})>/g)].map(x=>x[1]))].filter(x=>x!==c.user.id).slice(0,10)
const wantEveryone=content.includes('<@everyone>')&&rr.kind==='channel'&&!!(rr.perms&P.MENTION_ALL)
const roleIds=rr.kind==='channel'&&(rr.perms&P.MENTION_ALL)?[...new Set([...content.matchAll(/<@&(r_[a-z0-9]{16})>/g)].map(x=>x[1]))].slice(0,5):[]
const stmts=[
c.env.DB.prepare('insert into messages(id,room,server_id,author_id,content,reply_to,created_at,nonce,sig) values(?,?,?,?,?,?,?,?,?)').bind(id,rr.room,rr.serverId||null,c.user.id,content,reply?reply.id:null,t,nonce,await signMsg(c.env,{id,room:rr.room,author_id:c.user.id,created_at:t,edited_at:null,content})),
c.env.DB.prepare('insert into read_state(user_id,room,last_read,mentions) values(?,?,?,0) on conflict(user_id,room) do update set last_read=excluded.last_read,mentions=0').bind(c.user.id,rr.room,id)
]
if(rr.thread)stmts.push(c.env.DB.prepare('update threads set last_msg=?,last_at=?,count=count+1 where id=?').bind(id,t,rr.room))
else if(rr.kind==='channel')stmts.push(c.env.DB.prepare('update channels set last_msg=? where id=?').bind(id,rr.room))
else{
stmts.push(c.env.DB.prepare('update conversations set last_msg=?,last_message_at=? where id=?').bind(id,t,rr.room))
stmts.push(c.env.DB.prepare('update conv_members set hidden=0 where conv_id=? and hidden=1').bind(rr.room))
stmts.push(c.env.DB.prepare('update conv_members set accepted=1 where conv_id=? and user_id=? and accepted=0').bind(rr.room,c.user.id))
}
for(const f of files)stmts.push(c.env.DB.prepare('update files set message_id=? where id=?').bind(id,f.id))
if(stk)stmts.push(c.env.DB.prepare('update messages set sticker_id=? where id=?').bind(stk.id,id))
const notify=[]
if(rr.kind==='channel'){
for(const uid of users){
const tm=await loadMember(c.env,rr.serverId,uid)
if(!tm)continue
if(!(chanPerms(tm,rr.ch,rr.ovs)&P.VIEW))continue
const blk=await c.env.DB.prepare('select 1 x from blocks where user_id=? and blocked_id=?').bind(uid,c.user.id).first()
if(blk)continue
notify.push(uid)
}
for(const uid of notify){
stmts.push(c.env.DB.prepare('insert into read_state(user_id,room,last_read,mentions) values(?,?,?,1) on conflict(user_id,room) do update set mentions=mentions+1').bind(uid,rr.room,''))
stmts.push(c.env.DB.prepare('insert into notifications(id,user_id,type,data,created_at) values(?,?,?,?,?)').bind(newId('n'),uid,'mention',JSON.stringify({room:rr.room,server_id:rr.serverId,message_id:id,from:c.user.display_name}),t))
}
if(wantEveryone||roleIds.length){
const ev=await c.env.DB.prepare('select perms from roles where id=?').bind(rr.m.everyone).first()
const open=rr.ovs.length===0&&ev&&(ev.perms&P.VIEW)
if(open){
if(wantEveryone)stmts.push(c.env.DB.prepare("insert into read_state(user_id,room,last_read,mentions) select user_id,?,'',1 from members where server_id=? and user_id!=? limit 1000 on conflict(user_id,room) do update set mentions=mentions+1").bind(rr.room,rr.serverId,c.user.id))
else for(const rid of roleIds)stmts.push(c.env.DB.prepare("insert into read_state(user_id,room,last_read,mentions) select user_id,?,'',1 from member_roles where role_id=? and server_id=? and user_id!=? limit 1000 on conflict(user_id,room) do update set mentions=mentions+1").bind(rr.room,rid,rr.serverId,c.user.id))
}
}
}
await c.env.DB.batch(stmts)
const row=await c.env.DB.prepare('select * from messages where id=?').bind(id).first()
const[message]=await hydrate(c.env,[row],c.user.id)
await publishMsg(c,rr,{t:'msg.new',m:message,ment:{users:notify,everyone:wantEveryone,roles:roleIds}})
labsAfter(c,rr,message)
if(rr.kind==='channel'&&!c.user.is_bot)fireHooks(c,rr.serverId,'message.create',{id,channel_id:rr.room,author:{id:c.user.id,username:c.user.username,display_name:c.user.display_name},content:content.slice(0,4000),created_at:row.created_at})
if(rr.kind==='channel'&&filterOn(rr.m.server))c.ec.waitUntil(scanMsg(c,rr,id,content))
if(rr.thread)c.pub(rr.hub,{t:'thread.update',thread:{id:rr.thread.id,channel_id:rr.thread.channel_id,name:rr.thread.name,count:rr.thread.count+1,archived:!!rr.thread.archived,locked:!!rr.thread.locked,last_at:t}},{ch:rr.gate})
for(const uid of notify)c.pub('u_'+uid,{t:'notif',room:rr.room,server_id:rr.serverId})
if(c.env.VAPID_PRIVATE_JWK){
const preview=content.replace(/<@&?[a-z0-9_]+>/g,'@mention').slice(0,120)
if(rr.kind==='channel'&&notify.length)c.ec.waitUntil(pushTo(c.env,notify,{title:c.user.display_name+' mentioned you in #'+rr.ch.name,body:preview,room:rr.room,sid:rr.serverId,mid:id}))
else if(rr.kind==='dm'){
const others=(await c.env.DB.prepare('select user_id from conv_members where conv_id=? and user_id!=?').bind(rr.room,c.user.id).all()).results.map(x=>x.user_id)
if(others.length)c.ec.waitUntil(pushTo(c.env,others,{title:c.user.display_name,body:preview,room:rr.room,mid:id}))
}
}
if(rr.kind==='channel'&&!c.user.is_bot&&!rr.thread&&content)c.ec.waitUntil(runBlocks(c,rr,message).catch(()=>{}))
return json({message},201)
})

r.add('PATCH','/api/rooms/:room/messages/:mid',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const m=await getMsg(c,rr,c.p.mid)
if(m.author_id!==c.user.id)fail(403,'You can only edit your own messages')
if(!(rr.perms&P.SEND))fail(403,'You cannot edit messages here')
limit('edit:'+c.user.id,30,60000)
const b=await body(c.req,40000)
const content=str(b.content,1,MAX_LEN,'Message')
await automod(c.env,rr,content)
await extBlock(c.env,rr,content,null)
const et=now()
await c.env.DB.prepare('update messages set content=?,edited_at=?,sig=? where id=?').bind(content,et,await signMsg(c.env,{id:m.id,room:m.room,author_id:m.author_id,created_at:m.created_at,edited_at:et,content}),m.id).run()
const[message]=await hydrate(c.env,[await c.env.DB.prepare('select * from messages where id=?').bind(m.id).first()],c.user.id)
await publishMsg(c,rr,{t:'msg.update',m:message})
return{message}
})

r.add('DELETE','/api/rooms/:room/messages/:mid',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const m=await getMsg(c,rr,c.p.mid)
const mod=rr.kind==='channel'&&!!(rr.perms&P.MANAGE_MESSAGES)
if(m.author_id!==c.user.id&&!mod)fail(403,'You cannot delete this message')
const files=(await c.env.DB.prepare('select id,r2_key from files where message_id=?').bind(m.id).all()).results
for(const f of files)await c.env.FILES.delete(f.r2_key)
const stmts=[
c.env.DB.prepare("update messages set deleted_at=?,content='',pinned=0 where id=?").bind(now(),m.id),
c.env.DB.prepare('delete from reactions where message_id=?').bind(m.id),
c.env.DB.prepare('delete from files where message_id=?').bind(m.id),
c.env.DB.prepare('delete from saved where message_id=?').bind(m.id)
]
if(m.author_id!==c.user.id)stmts.push(c.logStmt(rr.serverId,'message.delete',m.author_id,`in ${rr.ch.name}`))
await c.env.DB.batch(stmts)
await publishMsg(c,rr,{t:'msg.delete',room:rr.room,id:m.id})
return{ok:true}
})

async function scanMsg(c,rr,id,content){
let bad=false
for(const u of urlsIn(content)){if(await inspectLink(c.env,u)){bad=true;break}}
const files=(await c.env.DB.prepare("select id,r2_key,size,mime from files where message_id=? and mime like 'image/%'").bind(id).all()).results
if(!bad)for(const f of files.slice(0,4)){
try{
const o=await c.env.FILES.get(f.r2_key,{size:f.size})
if(o&&await imageExplicit(c.env,new Uint8Array(await o.arrayBuffer()))){bad=true;break}
}catch{}
}
if(!bad)return
const m=await c.env.DB.prepare('select author_id from messages where id=? and deleted_at is null').bind(id).first()
if(!m)return
const all=(await c.env.DB.prepare('select r2_key from files where message_id=?').bind(id).all()).results
for(const f of all)await c.env.FILES.delete(f.r2_key)
await c.env.DB.batch([
c.env.DB.prepare("update messages set deleted_at=?,content='',pinned=0 where id=?").bind(now(),id),
c.env.DB.prepare('delete from reactions where message_id=?').bind(id),
c.env.DB.prepare('delete from files where message_id=?').bind(id),
c.logStmt(rr.serverId,'message.explicit',m.author_id,'removed by the explicit content scanner')
])
await publishMsg(c,rr,{t:'msg.delete',room:rr.room,id})
c.pub('u_'+m.author_id,{t:'safety.removed',room:rr.room})
}

async function pinGuard(rr){
if(rr.kind==='channel'&&!(rr.perms&P.MANAGE_MESSAGES))fail(403,'You need the Manage Messages permission to pin')
}
r.add('PUT','/api/rooms/:room/pins/:mid',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
await pinGuard(rr)
const m=await getMsg(c,rr,c.p.mid)
const n=await c.env.DB.prepare('select count(*) n from messages where room=? and pinned=1').bind(rr.room).first()
if(n.n>=50)fail(400,'Pin limit reached (50)')
await c.env.DB.prepare('update messages set pinned=1 where id=?').bind(m.id).run()
const[message]=await hydrate(c.env,[{...m,pinned:1}],c.user.id)
await publishMsg(c,rr,{t:'msg.update',m:message})
return{ok:true}
})
r.add('DELETE','/api/rooms/:room/pins/:mid',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
await pinGuard(rr)
const m=await getMsg(c,rr,c.p.mid)
await c.env.DB.prepare('update messages set pinned=0 where id=?').bind(m.id).run()
const[message]=await hydrate(c.env,[{...m,pinned:0}],c.user.id)
await publishMsg(c,rr,{t:'msg.update',m:message})
return{ok:true}
})
r.add('GET','/api/rooms/:room/pins',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const rows=(await c.env.DB.prepare('select * from messages where room=? and pinned=1 and deleted_at is null order by id desc limit 50').bind(rr.room).all()).results
return{messages:await hydrate(c.env,rows,c.user.id)}
})

r.add('PUT','/api/rooms/:room/messages/:mid/reactions/:emoji',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
if(!(rr.perms&P.REACT))fail(403,'You cannot react here')
if(!emojiOk(c.p.emoji))fail(400,'Invalid emoji')
limit('react:'+c.user.id,60,60000)
const m=await getMsg(c,rr,c.p.mid)
const ex=await c.env.DB.prepare('select count(distinct emoji) n,max(emoji=?) has from reactions where message_id=?').bind(c.p.emoji,m.id).first()
if(!ex.has&&ex.n>=20)fail(400,'This message has too many different reactions')
const res=await c.env.DB.prepare('insert or ignore into reactions(message_id,user_id,emoji) values(?,?,?)').bind(m.id,c.user.id,c.p.emoji).run()
if(res.meta.changes){await publishMsg(c,rr,{t:'reaction',room:rr.room,mid:m.id,emoji:c.p.emoji,uid:c.user.id,add:true});labsReact(c,rr,m,c.p.emoji,c.user.id,true)}
return{ok:true}
})
r.add('DELETE','/api/rooms/:room/messages/:mid/reactions/:emoji',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const m=await getMsg(c,rr,c.p.mid)
const res=await c.env.DB.prepare('delete from reactions where message_id=? and user_id=? and emoji=?').bind(m.id,c.user.id,c.p.emoji).run()
if(res.meta.changes){await publishMsg(c,rr,{t:'reaction',room:rr.room,mid:m.id,emoji:c.p.emoji,uid:c.user.id,add:false});labsReact(c,rr,m,c.p.emoji,c.user.id,false)}
return{ok:true}
})

r.add('POST','/api/rooms/:room/read',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const b=await body(c.req).catch(()=>({}))
let upto=typeof b.message_id==='string'?b.message_id:null
if(!upto){
const l=rr.kind==='channel'?rr.ch.last_msg:rr.conv.last_msg
upto=l||''
}
await c.env.DB.prepare("insert into read_state(user_id,room,last_read,mentions) values(?,?,?,0) on conflict(user_id,room) do update set last_read=case when excluded.last_read>last_read then excluded.last_read else last_read end,mentions=0").bind(c.user.id,rr.room,upto).run()
c.pub('u_'+c.user.id,{t:'read',room:rr.room})
return{ok:true}
})

r.add('GET','/api/unread',async c=>{
const out=[]
const servers=(await c.env.DB.prepare('select server_id,joined_at from members where user_id=?').bind(c.user.id).all()).results
const joined=Object.fromEntries(servers.map(s=>[s.server_id,s.joined_at]))
const cand=(await c.env.DB.prepare("select c.id,c.server_id,c.last_msg,rs.last_read,coalesce(rs.mentions,0) mentions from channels c join members m on m.server_id=c.server_id and m.user_id=? left join read_state rs on rs.user_id=? and rs.room=c.id where c.type!='voice' and c.last_msg!=''").bind(c.user.id,c.user.id).all()).results
const need=cand.filter(x=>x.last_msg>(x.last_read||floorId(joined[x.server_id])))
const bySrv={}
for(const x of need)(bySrv[x.server_id]||=[]).push(x)
for(const sid of Object.keys(bySrv)){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)continue
const vis=new Set((await visibleChannels(c.env,m)).map(v=>v.ch.id))
for(const x of bySrv[sid])if(vis.has(x.id))out.push({room:x.id,server_id:sid,last_read:x.last_read||floorId(joined[sid]),mentions:x.mentions})
}
const convs=(await c.env.DB.prepare("select cv.id,cv.last_msg,rs.last_read,coalesce(rs.mentions,0) mentions,cm.joined_at from conv_members cm join conversations cv on cv.id=cm.conv_id left join read_state rs on rs.user_id=cm.user_id and rs.room=cv.id where cm.user_id=? and cv.last_msg!=''").bind(c.user.id).all()).results
for(const x of convs)if(x.last_msg>(x.last_read||floorId(x.joined_at)))out.push({room:x.id,server_id:null,last_read:x.last_read||floorId(x.joined_at),mentions:x.mentions})
const stmts=out.slice(0,60).map(x=>c.env.DB.prepare('select ? room,count(*) n from (select 1 from messages where room=? and id>? and deleted_at is null and author_id!=? limit 100)').bind(x.room,x.room,x.last_read,c.user.id))
const counts=stmts.length?await c.env.DB.batch(stmts):[]
const cmap={}
for(const res of counts){const row=res.results[0];if(row)cmap[row.room]=row.n}
return{unread:out.map(x=>({room:x.room,server_id:x.server_id,count:Math.min(cmap[x.room]??1,99),mentions:x.mentions})).filter(x=>x.count>0||x.mentions>0)}
})

r.add('GET','/api/search',async c=>{
limit('search:'+c.user.id,60,60000)
const sp=c.url.searchParams
const q=(sp.get('q')||'').trim().slice(0,100)
const scope=sp.get('scope')||'room'
let rooms=[]
if(scope==='room'){
const rr=await resolveRoom(c.env,sp.get('room'),c.user.id)
rooms=[rr.room]
}else if(scope==='server'){
const m=await loadMember(c.env,sp.get('server')||'',c.user.id)
if(!m)fail(404,'Server not found')
rooms=(await visibleChannels(c.env,m)).filter(x=>x.ch.type!=='voice').map(x=>x.ch.id)
}else if(scope==='dm'){
rooms=(await c.env.DB.prepare('select conv_id from conv_members where user_id=? limit 90').bind(c.user.id).all()).results.map(x=>x.conv_id)
}else fail(400,'Invalid scope')
rooms=rooms.slice(0,90)
if(!rooms.length)return{messages:[],next:null}
const hasFilter=sp.get('has')||sp.get('from')||sp.get('pinned')||sp.get('after')||sp.get('before_date')
if(!q&&!hasFilter)fail(400,'Enter something to search for')
const args=[...rooms]
let where=`m.room in (${placeholders(rooms)}) and m.deleted_at is null`
if(q){where+=" and m.content like ? escape '\\'";args.push(likeEsc(q))}
if(sp.get('from')){where+=' and m.author_id=?';args.push(sp.get('from'))}
if(sp.get('has')==='attachment')where+=' and exists(select 1 from files f where f.message_id=m.id)'
if(sp.get('has')==='link')where+=" and (m.content like '%http://%' or m.content like '%https://%')"
if(sp.get('pinned'))where+=' and m.pinned=1'
if(sp.get('after')){where+=' and m.created_at>=?';args.push(clamp(sp.get('after'),0,0,9e15))}
if(sp.get('before_date')){where+=' and m.created_at<=?';args.push(clamp(sp.get('before_date'),9e15,0,9e15))}
if(sp.get('cursor')){where+=' and m.id<?';args.push(sp.get('cursor'))}
const rows=(await c.env.DB.prepare(`select m.* from messages m where ${where} order by m.id desc limit 11`).bind(...args).all()).results
const page=rows.slice(0,10)
return{messages:await hydrate(c.env,page,c.user.id),next:rows.length>10?page[page.length-1].id:null}
})

r.add('PUT','/api/saved/:mid',async c=>{
const m=await c.env.DB.prepare('select room from messages where id=? and deleted_at is null').bind(c.p.mid).first()
if(!m)fail(404,'Message not found')
await resolveRoom(c.env,m.room,c.user.id)
const n=await c.env.DB.prepare('select count(*) n from saved where user_id=?').bind(c.user.id).first()
if(n.n>=500)fail(400,'You can save up to 500 messages')
await c.env.DB.prepare('insert or ignore into saved(user_id,message_id,created_at) values(?,?,?)').bind(c.user.id,c.p.mid,now()).run()
return{ok:true}
})
r.add('DELETE','/api/saved/:mid',async c=>{
await c.env.DB.prepare('delete from saved where user_id=? and message_id=?').bind(c.user.id,c.p.mid).run()
return{ok:true}
})
r.add('GET','/api/saved',async c=>{
const rows=(await c.env.DB.prepare('select m.* from saved s join messages m on m.id=s.message_id where s.user_id=? and m.deleted_at is null order by s.created_at desc limit 50').bind(c.user.id).all()).results
const ok=[]
const seen={}
for(const m of rows){
if(!(m.room in seen))seen[m.room]=await resolveRoom(c.env,m.room,c.user.id).then(()=>true,()=>false)
if(seen[m.room])ok.push(m)
}
return{messages:await hydrate(c.env,ok,c.user.id)}
})
}
