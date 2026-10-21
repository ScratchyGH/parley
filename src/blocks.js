import{now,msgId,limit}from'./util.js'
import{resolveRoom,loadMember,P}from'./perms.js'
import{signMsg}from'./sign.js'
import{hydrate,publishMsg}from'./messages.js'
import{execute}from'./blockrun.js'
import{messageExplicit,filterOn}from'./safety.js'

async function say(c,room,sid,botId,text,replyTo){
const brr=await resolveRoom(c.env,room,botId)
if(!(brr.perms&P.SEND))return
if(filterOn(brr.m.server)&&messageExplicit(text))return
const id=msgId(),t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into messages(id,room,server_id,author_id,content,reply_to,created_at,nonce,sig) values(?,?,?,?,?,?,?,?,?)').bind(id,room,sid||null,botId,text,replyTo||null,t,null,await signMsg(c.env,{id,room,author_id:botId,created_at:t,content:text})),
c.env.DB.prepare('update channels set last_msg=? where id=?').bind(id,room)
])
const row=await c.env.DB.prepare('select * from messages where id=?').bind(id).first()
const[message]=await hydrate(c.env,[row],botId)
await publishMsg(c,brr,{t:'msg.new',m:message,ment:{users:[],everyone:false,roles:[]}})
}

async function react(c,room,botId,mid,emoji){
if(!mid)return
const brr=await resolveRoom(c.env,room,botId)
if(!(brr.perms&P.REACT)||/[\s<>\u0000-\u001f]/.test(emoji))return
const ex=await c.env.DB.prepare('select count(distinct emoji) n,max(emoji=?) has from reactions where message_id=?').bind(emoji,mid).first()
if(!ex.has&&ex.n>=20)return
const res=await c.env.DB.prepare('insert or ignore into reactions(message_id,user_id,emoji) values(?,?,?)').bind(mid,botId,emoji).run()
if(res.meta.changes)await publishMsg(c,brr,{t:'reaction',room,mid,emoji,uid:botId,add:true})
}

const vkey=(k,scope,uid)=>scope==='user'?k+':'+uid:k
async function getVar(c,botId,sid,k){
const r=await c.env.DB.prepare('select v from bot_vars where bot_id=? and server_id=? and k=?').bind(botId,sid,k).first()
return r?r.v:0
}
async function putVar(c,botId,sid,k,v){
await c.env.DB.prepare('insert into bot_vars(bot_id,server_id,k,v) values(?,?,?,?) on conflict(bot_id,server_id,k) do update set v=excluded.v').bind(botId,sid,k,v).run()
return v
}
async function addVar(c,botId,sid,k,by){
await c.env.DB.prepare('insert into bot_vars(bot_id,server_id,k,v) values(?,?,?,?) on conflict(bot_id,server_id,k) do update set v=v+excluded.v').bind(botId,sid,k,by).run()
return getVar(c,botId,sid,k)
}

export function makeIo(c,botId,sid,room,user,message){
const uid=user.id
return{
send:(text,reply)=>say(c,room,sid,botId,text,reply&&message?message.id:null),
sendTo:async(name,text)=>{
const ch=await c.env.DB.prepare("select id from channels where server_id=? and lower(name)=lower(?) and type in ('text','announce') limit 1").bind(sid,name).first()
if(ch)await say(c,ch.id,sid,botId,text,null)
},
react:e=>react(c,room,botId,message&&message.id,e),
count:(k,by,scope)=>addVar(c,botId,sid,vkey(k,scope,uid),by),
setCount:(k,v,scope)=>putVar(c,botId,sid,vkey(k,scope,uid),v),
cooldown:async(id,sec,scope)=>{
const k=vkey('cd_'+id,scope,uid),last=await getVar(c,botId,sid,k),t=Date.now()
if(last&&t-last<sec*1000)return false
await putVar(c,botId,sid,k,t)
return true
},
isMod:async()=>{const m=await loadMember(c.env,sid,uid);return!!m&&(m.admin||(m.base&(P.MODERATE|P.MANAGE_MESSAGES))!==0)},
hasRole:async name=>!!await c.env.DB.prepare('select 1 x from member_roles mr join roles r on r.id=mr.role_id where mr.server_id=? and mr.user_id=? and lower(r.name)=lower(?)').bind(sid,uid,name).first(),
del:async()=>{
if(!message)return
const brr=await resolveRoom(c.env,room,botId)
if(!(brr.perms&P.MANAGE_MESSAGES))return
await c.env.DB.prepare("update messages set deleted_at=?,content='',pinned=0 where id=? and deleted_at is null").bind(now(),message.id).run()
await publishMsg(c,brr,{t:'msg.delete',room,id:message.id})
},
pin:async()=>{
if(!message)return
const brr=await resolveRoom(c.env,room,botId)
if(!(brr.perms&P.MANAGE_MESSAGES))return
const n=await c.env.DB.prepare('select count(*) n from messages where room=? and pinned=1').bind(room).first()
if(n.n>=50)return
await c.env.DB.prepare('update messages set pinned=1 where id=?').bind(message.id).run()
const row=await c.env.DB.prepare('select * from messages where id=?').bind(message.id).first()
const[m]=await hydrate(c.env,[row],botId)
await publishMsg(c,brr,{t:'msg.update',m})
},
timeout:async mins=>{
const bm=await loadMember(c.env,sid,botId),tm=await loadMember(c.env,sid,uid)
if(!bm||!tm||!(bm.admin||(bm.base&P.MODERATE))||tm.owner||tm.admin||tm.top>=bm.top)return
await c.env.DB.prepare('update members set timeout_until=? where server_id=? and user_id=?').bind(now()+mins*60000,sid,uid).run()
c.pub('u_'+uid,{t:'notice',text:`You were timed out in ${bm.server.name} for ${mins} minutes`})
},
role:async(name,add)=>{
const bm=await loadMember(c.env,sid,botId)
if(!bm||!(bm.admin||(bm.base&P.MANAGE_ROLES)))return
const role=await c.env.DB.prepare('select id,position,is_everyone from roles where server_id=? and lower(name)=lower(?)').bind(sid,name).first()
if(!role||role.is_everyone||!(bm.owner||role.position<bm.top))return
if(!await loadMember(c.env,sid,uid))return
if(add)await c.env.DB.prepare('insert or ignore into member_roles(server_id,user_id,role_id) values(?,?,?)').bind(sid,uid,role.id).run()
else await c.env.DB.prepare('delete from member_roles where server_id=? and user_id=? and role_id=?').bind(sid,uid,role.id).run()
c.pub('s_'+sid,{t:'member.update',uid})
}
}
}

export async function runBlocks(c,rr,message){
if(rr.kind!=='channel'||rr.thread||!message.content&&!(message.attachments||[]).length)return
const rows=(await c.env.DB.prepare('select p.bot_id,p.blocks from bot_installs i join bot_projects p on p.id=i.project_id join members m on m.server_id=i.server_id and m.user_id=p.bot_id where i.server_id=? and p.blocks is not null limit 5').bind(rr.serverId).all()).results
for(const row of rows){
let graph
try{graph=JSON.parse(row.blocks)}catch{continue}
try{limit('blk:'+row.bot_id+':'+rr.room,30,60000)}catch{continue}
const user=message.author||{id:message.author_id,username:'',display_name:''}
const ctx={user,channel:rr.ch.name,server:rr.m.server.name,text:message.content||'',mentioned:(message.content||'').includes('<@'+row.bot_id+'>'),attachments:(message.attachments||[]).length,at:Date.now()}
try{await execute(graph,ctx,makeIo(c,row.bot_id,rr.serverId,rr.room,user,message))}catch{}
}
}

export async function runJoin(c,sid,user){
const rows=(await c.env.DB.prepare("select p.bot_id,p.blocks from bot_installs i join bot_projects p on p.id=i.project_id join members m on m.server_id=i.server_id and m.user_id=p.bot_id where i.server_id=? and p.blocks like '%\"join\"%' limit 5").bind(sid).all()).results
if(!rows.length)return
const chs=(await c.env.DB.prepare("select id,name from channels where server_id=? and type='text' order by position,created_at limit 20").bind(sid).all()).results
const ch=chs.find(x=>x.name==='general')||chs[0]
if(!ch)return
const srv=await c.env.DB.prepare('select name from servers where id=?').bind(sid).first()
for(const row of rows){
let graph
try{graph=JSON.parse(row.blocks)}catch{continue}
try{limit('blkj:'+row.bot_id+':'+sid,20,60000)}catch{continue}
const ctx={event:'join',user:{id:user.id,username:user.username,display_name:user.display_name},channel:ch.name,server:srv?srv.name:'',text:'',at:Date.now()}
try{await execute(graph,ctx,makeIo(c,row.bot_id,sid,ch.id,user,null))}catch{}
}
}

export async function dryRun(graph,text,user,event,hook){
const sent=[]
const mem=new Map()
const io={
send:async(t,r)=>{sent.push({say:t,reply:!!r})},
sendTo:async(ch,t)=>{sent.push({say:t,to:ch})},
react:async e=>{sent.push({react:e})},
count:async(k,by,s)=>{const key=s+':'+k;mem.set(key,(mem.get(key)||0)+by);return mem.get(key)},
setCount:async(k,v,s)=>{mem.set(s+':'+k,v);return v},
cooldown:async()=>true,
isMod:async()=>false,
hasRole:async()=>false,
del:async()=>{sent.push({note:'Deletes the message'})},
pin:async()=>{sent.push({note:'Pins the message'})},
timeout:async m=>{sent.push({note:'Times the member out for '+m+' minutes'})},
role:async(n,a)=>{sent.push({note:(a?'Gives':'Takes')+' the role '+n})}
}
const log=await execute(graph,{user,channel:'general',server:'Your server',text:event==='join'?'':text,event:event||undefined,hook:event==='hook'?hook:undefined,mentioned:/<@bot>/.test(text),attachments:/\[image\]/.test(text)?1:0,at:Date.now()},io)
return{log,sent}
}

export async function runHook(c,project,name,text,who){
const rows=(await c.env.DB.prepare("select i.server_id from bot_installs i join members m on m.server_id=i.server_id and m.user_id=? where i.project_id=? limit 25").bind(project.bot_id,project.id).all()).results
let ran=0
for(const row of rows){
const chs=(await c.env.DB.prepare("select id,name from channels where server_id=? and type='text' order by position,created_at limit 20").bind(row.server_id).all()).results
const ch=chs.find(x=>x.name==='general')||chs[0]
if(!ch)continue
const srv=await c.env.DB.prepare('select name from servers where id=?').bind(row.server_id).first()
let graph
try{graph=JSON.parse(project.blocks)}catch{continue}
const user={id:'hook_'+name,username:'webhook',display_name:who||'Webhook'}
const ctx={event:'hook',hook:name,user,channel:ch.name,server:srv?srv.name:'',text,at:Date.now()}
try{await execute(graph,ctx,makeIo(c,project.bot_id,row.server_id,ch.id,user,null));ran++}catch{}
}
return ran
}
