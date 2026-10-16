import{fail,now,newId,msgId,str,opt,int,limit,body,json,clamp,sha,randHex,placeholders}from'./util.js'
import{P,resolveRoom,loadMember,need}from'./perms.js'
import{hydrate,publishMsg}from'./messages.js'
import{signMsg,pubKey}from'./sign.js'

const nm=(v,n)=>{
const s=str(v,1,80,n)
if(/[\u0000-\u001f]/.test(s))fail(400,n+' contains invalid characters')
return s
}

export async function automod(env,rr,content){
if(rr.kind!=='channel')return
if(rr.m.admin||(rr.perms&(P.MANAGE_MESSAGES|P.MODERATE)))return
let a
try{a=JSON.parse(rr.m.server.automod||'{}')}catch{return}
if(!a||!Object.keys(a).length)return
const low=content.toLowerCase()
for(const w of a.words||[])if(w&&low.includes(w))fail(422,'Your message was blocked by this server\'s AutoMod')
if(a.block_links&&/https?:\/\/|discord\.gg\//i.test(content))fail(422,'Links are not allowed in this server')
if(a.max_mentions>0){const n=(content.match(/<@[&a-z0-9_]+>/g)||[]).length;if(n>a.max_mentions)fail(422,`Too many mentions (max ${a.max_mentions})`)}
}

async function chanOf(c,cid,bit){
const rr=await resolveRoom(c.env,cid,c.user.id)
if(rr.kind!=='channel'||rr.room.startsWith('th_'))fail(400,'Not a channel')
if(bit)need(rr.perms,bit)
return rr
}
const threadRow=async(env,id)=>env.DB.prepare('select * from threads where id=?').bind(id).first()
const toThread=t=>({id:t.id,channel_id:t.channel_id,parent_message_id:t.parent_message_id,name:t.name,owner_id:t.owner_id,created_at:t.created_at,last_at:t.last_at,count:t.count,locked:!!t.locked,archived:!!t.archived})

export async function pollData(env,mids,meId){
const q=(s,...a)=>env.DB.prepare(s).bind(...a).all().then(x=>x.results)
const ph=placeholders(mids)
const[ps,os,vs,mine]=await Promise.all([
q(`select * from polls where message_id in (${ph})`,...mids),
q(`select message_id,idx,text from poll_options where message_id in (${ph}) order by idx`,...mids),
q(`select message_id,idx,count(*) n from poll_votes where message_id in (${ph}) group by message_id,idx`,...mids),
q(`select message_id,idx from poll_votes where user_id=? and message_id in (${ph})`,meId,...mids)
])
const out={}
for(const p of ps){
const options=os.filter(o=>o.message_id===p.message_id).map(o=>({idx:o.idx,text:o.text,votes:vs.find(v=>v.message_id===p.message_id&&v.idx===o.idx)?.n||0}))
out[p.message_id]={question:p.question,multi:!!p.multi,closes_at:p.closes_at,closed:!!(p.closes_at&&p.closes_at<now()),options,total:options.reduce((a,o)=>a+o.votes,0),mine:mine.filter(v=>v.message_id===p.message_id).map(v=>v.idx)}
}
return out
}

export default function(r){
r.add('GET','/api/p2p/key',async c=>({alg:'Ed25519',key:await pubKey(c.env),format:'p1\\n{id}\\n{room}\\n{author_id}\\n{created_at}\\n{edited_at||0}\\n{content}'}))

r.add('POST','/api/rooms/:room/messages/:mid/thread',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
if(rr.kind!=='channel'||rr.room.startsWith('th_')||rr.ch.type==='forum'||rr.ch.type==='voice')fail(400,'Threads can only start from channel messages')
need(rr.perms,P.SEND,'You cannot start threads here')
limit('thr:'+c.user.id,10,60000)
const m=await c.env.DB.prepare('select * from messages where id=? and room=? and deleted_at is null').bind(c.p.mid,rr.room).first()
if(!m)fail(404,'Message not found')
const b=await body(c.req)
const name=nm(b.name||m.content.slice(0,60)||'Thread','Name')
if(await c.env.DB.prepare('select 1 x from threads where parent_message_id=?').bind(m.id).first())fail(409,'This message already has a thread')
const id=newId('th')
const t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into threads(id,channel_id,server_id,parent_message_id,name,owner_id,created_at,last_at) values(?,?,?,?,?,?,?,?)').bind(id,rr.room,rr.serverId,m.id,name,c.user.id,t,t),
c.env.DB.prepare('update messages set thread_id=? where id=?').bind(id,m.id)
])
const th=toThread(await threadRow(c.env,id))
c.pub(rr.hub,{t:'thread.new',thread:th,message_id:m.id},{ch:rr.room})
return json({thread:th},201)
})

r.add('POST','/api/channels/:cid/posts',async c=>{
const rr=await chanOf(c,c.p.cid)
if(rr.ch.type!=='forum')fail(400,'Not a forum channel')
const chPerms=rr.perms
if(!(chPerms&P.VIEW))fail(404,'Channel not found')
if(rr.m.timeout_until>now())fail(403,'You are timed out')
if(rr.ch.locked&&!(rr.perms&P.MANAGE_CHANNELS))fail(403,'This forum is locked')
limit('post:'+c.user.id,6,60000)
const b=await body(c.req)
const name=nm(b.title,'Title')
const id=newId('th')
const t=now()
await c.env.DB.prepare('insert into threads(id,channel_id,server_id,name,owner_id,created_at,last_at) values(?,?,?,?,?,?,?)').bind(id,rr.room,rr.serverId,name,c.user.id,t,t).run()
const th=toThread(await threadRow(c.env,id))
c.pub(rr.hub,{t:'thread.new',thread:th},{ch:rr.room})
return json({thread:th},201)
})

r.add('GET','/api/channels/:cid/threads',async c=>{
const rr=await chanOf(c,c.p.cid)
const arch=c.url.searchParams.get('archived')==='1'?1:0
const rows=(await c.env.DB.prepare('select t.*,u.display_name owner_name,(select substr(content,1,200) from messages where room=t.id and deleted_at is null order by id limit 1) preview from threads t join users u on u.id=t.owner_id where t.channel_id=? and t.archived=? order by t.last_at desc limit 50').bind(rr.room,arch).all()).results
return{threads:rows.map(t=>({...toThread(t),owner_name:t.owner_name,preview:t.preview||''}))}
})

r.add('GET','/api/threads/:tid',async c=>{
const t=await threadRow(c.env,c.p.tid)
if(!t)fail(404,'Thread not found')
await resolveRoom(c.env,t.id,c.user.id)
return{thread:toThread(t),server_id:t.server_id}
})

r.add('PATCH','/api/threads/:tid',async c=>{
const t=await threadRow(c.env,c.p.tid)
if(!t)fail(404,'Thread not found')
const rr=await resolveRoom(c.env,t.id,c.user.id)
const mod=!!(rr.perms&P.MANAGE_MESSAGES)
if(t.owner_id!==c.user.id&&!mod)fail(403,'Only the thread owner or a moderator can change this thread')
const b=await body(c.req)
const sets=[],vals=[]
if('name'in b){sets.push('name=?');vals.push(nm(b.name,'Name'))}
if('archived'in b){sets.push('archived=?');vals.push(b.archived?1:0)}
if('locked'in b){if(!mod)fail(403,'Only moderators can lock threads');sets.push('locked=?');vals.push(b.locked?1:0)}
if(!sets.length)fail(400,'Nothing to change')
await c.env.DB.prepare(`update threads set ${sets.join(',')} where id=?`).bind(...vals,t.id).run()
const th=toThread(await threadRow(c.env,t.id))
c.pub(rr.hub,{t:'thread.update',thread:th},{ch:t.channel_id})
return{thread:th}
})

r.add('POST','/api/rooms/:room/polls',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
need(rr.perms,P.SEND,'You cannot post here')
limit('poll:'+c.user.id,6,60000)
const b=await body(c.req)
const q=str(b.question,1,300,'Question')
if(!Array.isArray(b.options)||b.options.length<2||b.options.length>10)fail(400,'A poll needs 2 to 10 options')
const opts=b.options.map(o=>str(o,1,100,'Option'))
if(new Set(opts.map(o=>o.toLowerCase())).size!==opts.length)fail(400,'Options must be different')
const hours=b.hours==null?null:int(b.hours,1,720,'Duration')
const id=msgId()
const t=now()
const msg={id,room:rr.room,author_id:c.user.id,created_at:t,edited_at:null,content:q}
const sig=await signMsg(c.env,msg)
const stmts=[
c.env.DB.prepare('insert into messages(id,room,server_id,author_id,content,created_at,has_poll,sig) values(?,?,?,?,?,?,1,?)').bind(id,rr.room,rr.serverId||null,c.user.id,q,t,sig),
c.env.DB.prepare('insert into polls(message_id,question,multi,closes_at) values(?,?,?,?)').bind(id,q,b.multi?1:0,hours?t+hours*3600000:null),
c.env.DB.prepare('insert into read_state(user_id,room,last_read,mentions) values(?,?,?,0) on conflict(user_id,room) do update set last_read=excluded.last_read,mentions=0').bind(c.user.id,rr.room,id)
]
opts.forEach((o,i)=>stmts.push(c.env.DB.prepare('insert into poll_options(message_id,idx,text) values(?,?,?)').bind(id,i,o)))
if(rr.kind==='channel')stmts.push(rr.room.startsWith('th_')?c.env.DB.prepare('update threads set last_msg=?,last_at=?,count=count+1 where id=?').bind(id,t,rr.room):c.env.DB.prepare('update channels set last_msg=? where id=?').bind(id,rr.room))
else stmts.push(c.env.DB.prepare('update conversations set last_msg=?,last_message_at=? where id=?').bind(id,t,rr.room))
await c.env.DB.batch(stmts)
const[message]=await hydrate(c.env,[await c.env.DB.prepare('select * from messages where id=?').bind(id).first()],c.user.id)
await publishMsg(c,rr,{t:'msg.new',m:message,ment:{users:[],everyone:false,roles:[]}})
return json({message},201)
})

async function pollOf(c,room,mid){
const rr=await resolveRoom(c.env,room,c.user.id)
const p=await c.env.DB.prepare('select p.* from polls p join messages m on m.id=p.message_id where p.message_id=? and m.room=? and m.deleted_at is null').bind(mid,rr.room).first()
if(!p)fail(404,'Poll not found')
return{rr,p}
}
r.add('POST','/api/rooms/:room/messages/:mid/vote',async c=>{
const{rr,p}=await pollOf(c,c.p.room,c.p.mid)
need(rr.perms,P.REACT,'You cannot vote here')
if(p.closes_at&&p.closes_at<now())fail(400,'This poll has closed')
limit('vote:'+c.user.id,30,60000)
const b=await body(c.req)
if(!Array.isArray(b.options))fail(400,'Options required')
const picks=[...new Set(b.options.map(Number))].filter(Number.isInteger)
if(picks.length>(p.multi?10:1))fail(400,p.multi?'Too many options':'Pick one option')
const valid=(await c.env.DB.prepare('select idx from poll_options where message_id=?').bind(p.message_id).all()).results.map(x=>x.idx)
if(picks.some(x=>!valid.includes(x)))fail(400,'Invalid option')
const stmts=[c.env.DB.prepare('delete from poll_votes where message_id=? and user_id=?').bind(p.message_id,c.user.id)]
for(const x of picks)stmts.push(c.env.DB.prepare('insert into poll_votes(message_id,user_id,idx) values(?,?,?)').bind(p.message_id,c.user.id,x))
await c.env.DB.batch(stmts)
const d=(await pollData(c.env,[p.message_id],c.user.id))[p.message_id]
await publishMsg(c,rr,{t:'poll.update',room:rr.room,id:p.message_id,options:d.options.map(o=>o.votes),total:d.total,closed:d.closed})
return{poll:d}
})
r.add('POST','/api/rooms/:room/messages/:mid/poll/close',async c=>{
const{rr,p}=await pollOf(c,c.p.room,c.p.mid)
const m=await c.env.DB.prepare('select author_id from messages where id=?').bind(p.message_id).first()
if(m.author_id!==c.user.id&&!(rr.kind==='channel'&&(rr.perms&P.MANAGE_MESSAGES)))fail(403,'Only the author or a moderator can close this poll')
await c.env.DB.prepare('update polls set closes_at=? where message_id=?').bind(now()-1,p.message_id).run()
const d=(await pollData(c.env,[p.message_id],c.user.id))[p.message_id]
await publishMsg(c,rr,{t:'poll.update',room:rr.room,id:p.message_id,options:d.options.map(o=>o.votes),total:d.total,closed:true})
return{poll:d}
})

async function srv(c,sid,bit){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(bit&&!(m.base&bit))fail(403,'You do not have permission to do that')
return m
}
const evOut=(e,rs,me)=>({id:e.id,title:e.title,description:e.description,location:e.location,starts_at:e.starts_at,ends_at:e.ends_at,creator_id:e.creator_id,going:rs.filter(x=>x.event_id===e.id&&x.state==='going').length,interested:rs.filter(x=>x.event_id===e.id&&x.state==='interested').length,mine:rs.find(x=>x.event_id===e.id&&x.user_id===me)?.state||null})
async function eventList(c,sid){
const t=now()
const es=(await c.env.DB.prepare('select * from events where server_id=? and coalesce(ends_at,starts_at+7200000)>? order by starts_at limit 50').bind(sid,t).all()).results
if(!es.length)return[]
const rs=(await c.env.DB.prepare(`select event_id,user_id,state from event_rsvps where event_id in (${placeholders(es)})`).bind(...es.map(e=>e.id)).all()).results
return es.map(e=>evOut(e,rs,c.user.id))
}
function evBody(b){
const starts=int(b.starts_at,now()-3600000,now()+3*365*86400000,'Start time')
const ends=b.ends_at==null?null:int(b.ends_at,starts,starts+30*86400000,'End time')
return{title:str(b.title,1,100,'Title'),description:opt(b.description,1000,'Description'),location:opt(b.location,200,'Location'),starts,ends}
}
r.add('GET','/api/servers/:sid/events',async c=>{await srv(c,c.p.sid);return{events:await eventList(c,c.p.sid)}})
r.add('POST','/api/servers/:sid/events',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const n=await c.env.DB.prepare('select count(*) n from events where server_id=? and coalesce(ends_at,starts_at+7200000)>?').bind(m.server.id,now()).first()
if(n.n>=50)fail(409,'Too many upcoming events')
const e=evBody(await body(c.req))
const id=newId('ev')
await c.env.DB.prepare('insert into events(id,server_id,creator_id,title,description,location,starts_at,ends_at,created_at) values(?,?,?,?,?,?,?,?,?)').bind(id,m.server.id,c.user.id,e.title,e.description,e.location,e.starts,e.ends,now()).run()
c.pub('s_'+m.server.id,{t:'events.changed',server_id:m.server.id})
return json({events:await eventList(c,m.server.id)},201)
})
r.add('PATCH','/api/servers/:sid/events/:eid',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const ex=await c.env.DB.prepare('select * from events where id=? and server_id=?').bind(c.p.eid,m.server.id).first()
if(!ex)fail(404,'Event not found')
const e=evBody({...ex,...await body(c.req)})
await c.env.DB.prepare('update events set title=?,description=?,location=?,starts_at=?,ends_at=? where id=?').bind(e.title,e.description,e.location,e.starts,e.ends,ex.id).run()
c.pub('s_'+m.server.id,{t:'events.changed',server_id:m.server.id})
return{events:await eventList(c,m.server.id)}
})
r.add('DELETE','/api/servers/:sid/events/:eid',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
await c.env.DB.batch([c.env.DB.prepare('delete from event_rsvps where event_id in (select id from events where id=? and server_id=?)').bind(c.p.eid,m.server.id),c.env.DB.prepare('delete from events where id=? and server_id=?').bind(c.p.eid,m.server.id)])
c.pub('s_'+m.server.id,{t:'events.changed',server_id:m.server.id})
return{ok:true}
})
r.add('PUT','/api/servers/:sid/events/:eid/rsvp',async c=>{
const m=await srv(c,c.p.sid)
const ev=await c.env.DB.prepare('select id from events where id=? and server_id=?').bind(c.p.eid,m.server.id).first()
if(!ev)fail(404,'Event not found')
const b=await body(c.req)
if(!['going','interested','none'].includes(b.state))fail(400,'Invalid state')
if(b.state==='none')await c.env.DB.prepare('delete from event_rsvps where event_id=? and user_id=?').bind(ev.id,c.user.id).run()
else await c.env.DB.prepare('insert into event_rsvps(event_id,user_id,state) values(?,?,?) on conflict(event_id,user_id) do update set state=excluded.state').bind(ev.id,c.user.id,b.state).run()
return{events:await eventList(c,m.server.id)}
})

r.add('GET','/api/servers/:sid/emoji',async c=>{await srv(c,c.p.sid);return{emoji:(await c.env.DB.prepare('select id,name,file_id from emoji where server_id=? order by name').bind(c.p.sid).all()).results}})
r.add('POST','/api/servers/:sid/emoji',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const b=await body(c.req)
const name=str(b.name,2,32,'Name')
if(!/^[a-zA-Z0-9_]+$/.test(name))fail(400,'Name can use letters, numbers and underscores')
const n=await c.env.DB.prepare('select count(*) n from emoji where server_id=?').bind(m.server.id).first()
if(n.n>=50)fail(409,'This server has reached the 50 emoji limit')
const f=await c.env.DB.prepare("select id from files where id=? and owner_id=? and kind='emoji' and server_id=?").bind(String(b.file_id),c.user.id,m.server.id).first()
if(!f)fail(400,'Upload the image first')
if(await c.env.DB.prepare('select 1 x from emoji where server_id=? and name=? collate nocase').bind(m.server.id,name).first())fail(409,'An emoji with that name exists')
const id=newId('em')
await c.env.DB.prepare('insert into emoji(id,server_id,name,file_id,created_by,created_at) values(?,?,?,?,?,?)').bind(id,m.server.id,name,f.id,c.user.id,now()).run()
c.pub('s_'+m.server.id,{t:'emoji.changed',server_id:m.server.id})
return json({emoji:(await c.env.DB.prepare('select id,name,file_id from emoji where server_id=? order by name').bind(m.server.id).all()).results},201)
})
r.add('DELETE','/api/servers/:sid/emoji/:eid',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const e=await c.env.DB.prepare('select * from emoji where id=? and server_id=?').bind(c.p.eid,m.server.id).first()
if(!e)fail(404,'Emoji not found')
const f=await c.env.DB.prepare('select r2_key from files where id=?').bind(e.file_id).first()
if(f)await c.env.FILES.delete(f.r2_key)
await c.env.DB.batch([c.env.DB.prepare('delete from emoji where id=?').bind(e.id),c.env.DB.prepare('delete from files where id=?').bind(e.file_id),c.env.DB.prepare('delete from reactions where emoji=?').bind('e:'+e.file_id)])
c.pub('s_'+m.server.id,{t:'emoji.changed',server_id:m.server.id})
return{ok:true}
})

r.add('GET','/api/servers/:sid/automod',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
let a={}
try{a=JSON.parse(m.server.automod||'{}')}catch{}
return{automod:{words:a.words||[],block_links:!!a.block_links,max_mentions:a.max_mentions||0}}
})
r.add('PUT','/api/servers/:sid/automod',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const b=await body(c.req)
const words=Array.isArray(b.words)?[...new Set(b.words.map(w=>String(w).trim().toLowerCase()).filter(w=>w.length>=2&&w.length<=40))].slice(0,100):[]
const a={words,block_links:!!b.block_links,max_mentions:int(b.max_mentions??0,0,50,'Max mentions')}
await c.env.DB.batch([c.env.DB.prepare('update servers set automod=? where id=?').bind(JSON.stringify(a),m.server.id),c.logStmt(m.server.id,'automod.update',m.server.id,`${words.length} words`)])
return{automod:a}
})

r.add('GET','/api/servers/:sid/webhooks',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
return{webhooks:(await c.env.DB.prepare('select id,channel_id,name,created_at from webhooks where server_id=?').bind(m.server.id).all()).results}
})
r.add('POST','/api/channels/:cid/webhooks',async c=>{
const rr=await chanOf(c,c.p.cid,P.MANAGE_SERVER)
if(rr.ch.type==='voice'||rr.ch.type==='forum')fail(400,'Webhooks post to text channels')
const n=await c.env.DB.prepare('select count(*) n from webhooks where server_id=?').bind(rr.serverId).first()
if(n.n>=10)fail(409,'Too many webhooks')
const b=await body(c.req)
const name=nm(b.name,'Name')
const id=newId('wh'),bot=newId('u'),token=randHex(24),t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into users(id,username,display_name,pass_hash,pass_salt,pass_iters,is_bot,created_at) values(?,?,?,?,?,?,1,?)').bind(bot,'wh_'+randHex(8),name,'!','!',1,t),
c.env.DB.prepare('insert into webhooks(id,server_id,channel_id,name,token_hash,bot_user_id,created_by,created_at) values(?,?,?,?,?,?,?,?)').bind(id,rr.serverId,rr.room,name,await sha(token),bot,c.user.id,t),
c.logStmt(rr.serverId,'webhook.create',id,name)
])
return json({id,name,token,path:`/api/webhooks/${id}/${token}`},201)
})
r.add('DELETE','/api/servers/:sid/webhooks/:wid',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const w=await c.env.DB.prepare('select * from webhooks where id=? and server_id=?').bind(c.p.wid,m.server.id).first()
if(!w)fail(404,'Webhook not found')
await c.env.DB.batch([c.env.DB.prepare('delete from webhooks where id=?').bind(w.id),c.env.DB.prepare('update users set deleted_at=?,suspended=1 where id=?').bind(now(),w.bot_user_id),c.logStmt(m.server.id,'webhook.delete',w.id,w.name)])
return{ok:true}
})
r.add('POST','/api/webhooks/:id/:token',async c=>{
limit('wh:'+c.p.id,30,60000)
const w=await c.env.DB.prepare('select * from webhooks where id=?').bind(c.p.id).first()
const ok=w&&(await sha(c.p.token))===w.token_hash
if(!ok)fail(404,'Webhook not found')
const b=await body(c.req,20000)
const content=str(b.content,1,2000,'Content')
const ch=await c.env.DB.prepare('select * from channels where id=?').bind(w.channel_id).first()
if(!ch)fail(404,'Channel no longer exists')
const id=msgId(),t=now()
const msg={id,room:ch.id,author_id:w.bot_user_id,created_at:t,edited_at:null,content}
const sig=await signMsg(c.env,msg)
await c.env.DB.batch([
c.env.DB.prepare('insert into messages(id,room,server_id,author_id,content,created_at,sig) values(?,?,?,?,?,?,?)').bind(id,ch.id,ch.server_id,w.bot_user_id,content,t,sig),
c.env.DB.prepare('update channels set last_msg=? where id=?').bind(id,ch.id)
])
const[message]=await hydrate(c.env,[await c.env.DB.prepare('select * from messages where id=?').bind(id).first()],w.bot_user_id)
c.pub('s_'+ch.server_id,{t:'msg.new',m:message,ment:{users:[],everyone:false,roles:[]}},{ch:ch.id})
return json({ok:true,id},201)
},{auth:false})
}
