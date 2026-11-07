import{now,msgId,limit,newId}from'./util.js'
import{resolveRoom,loadMember,P}from'./perms.js'
import{signMsg}from'./sign.js'
import{hydrate,publishMsg}from'./messages.js'
import{execute,levelOf}from'./blockrun.js'
import{runApi,runHttp,runWebhook}from'./apiblock.js'
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
if(!sid)await c.env.DB.prepare('update conversations set last_msg=?,last_message_at=? where id=?').bind(id,t,room).run().catch(()=>{})
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


const caseSt=(c,sid,botId,uid,type,reason)=>c.env.DB.prepare('insert into mod_cases(id,server_id,num,user_id,mod_id,type,reason,evidence,status,created_at,updated_at) values(?,?,(select coalesce(max(num),0)+1 from mod_cases where server_id=?),?,?,?,?,?,?,?,?)').bind(newId('mc'),sid,sid,uid,botId,type,String(reason||'').slice(0,500),'','open',now(),now())
async function removeFrom(c,sid,botId,uid,kind,reason,force){
const bm=await loadMember(c.env,sid,botId),tm=await loadMember(c.env,sid,uid)
const need=kind==='ban'?P.BAN:P.KICK
if(!tm||uid===botId||tm.owner||tm.admin||!force&&(!bm||!(bm.admin||(bm.base&need))||tm.top>=bm.top))return
const st=[
c.env.DB.prepare('delete from member_roles where server_id=? and user_id=?').bind(sid,uid),
c.env.DB.prepare('delete from members where server_id=? and user_id=?').bind(sid,uid),
c.env.DB.prepare('delete from read_state where user_id=? and room in (select id from channels where server_id=?)').bind(uid,sid),
caseSt(c,sid,botId,uid,kind,reason)]
if(kind==='ban')st.push(c.env.DB.prepare('insert or replace into bans(server_id,user_id,reason,by_id,created_at) values(?,?,?,?,?)').bind(sid,uid,reason,botId,now()))
await c.env.DB.batch(st)
c.pub('s_'+sid,{t:'member.leave',uid})
c.pubClose('s_'+sid,{close:[uid],purge:true})
c.pub('u_'+uid,{t:'server.removed',id:sid,reason:kind==='ban'?'banned':'kicked'})
}

export async function punish(c,sid,actor,uid,a,reason){
if(a==='timeout'){
if(!await loadMember(c.env,sid,uid))return
await c.env.DB.batch([c.env.DB.prepare('update members set timeout_until=? where server_id=? and user_id=?').bind(now()+86400000,sid,uid),caseSt(c,sid,actor,uid,'timeout',reason)])
c.pub('u_'+uid,{t:'notice',text:'You were timed out for 24 hours: '+reason})
c.pub('s_'+sid,{t:'member.update',uid})
return
}
await removeFrom(c,sid,actor,uid,a==='ban'?'ban':'kick',reason,true)
}
const warnCount=async(c,sid,uid)=>(await c.env.DB.prepare("select count(*) n from mod_cases where server_id=? and user_id=? and type='warn' and status!='overturned'").bind(sid,uid).first()).n
export async function warnLimit(c,sid,actor,uid){
const r=await c.env.DB.prepare('select v from app_settings where k=?').bind('warnlim:'+sid).first()
let o
try{o=JSON.parse(r.v)}catch{return}
if(o&&o.n&&await warnCount(c,sid,uid)===o.n)await punish(c,sid,actor,uid,o.a,'Reached the warning limit of '+o.n)
}
export function makeIo(c,botId,sid,room,user,message){
const uid=user.id
return{
adjXp:async(mode,amt)=>{const k=vkey('xp','user',uid);let cur=Number(await getVar(c,botId,sid,k))||0;amt=Math.max(0,Math.min(1e9,Math.floor(Number(amt))||0));cur=mode==='give'?cur+amt:mode==='take'?Math.max(0,cur-amt):mode==='set'?amt:0;await putVar(c,botId,sid,k,cur);return cur},
xpBan:async b=>{await putVar(c,botId,sid,'xpban:'+uid,b?1:0)},
xpBanned:async()=>Number(await getVar(c,botId,sid,'xpban:'+uid))===1,
dm:async text=>{
const{slurHit,spammy}=await import('./dmguard.js')
if(slurHit(text)||spammy(text))return false
try{limit('botdm:'+botId,30,3600000);limit('botdmu:'+botId+':'+uid,6,600000)}catch{return false}
const t=await c.env.DB.prepare('select id,settings,is_bot from users where id=? and deleted_at is null').bind(uid).first()
if(!t||t.is_bot)return false
let pol='everyone';try{pol=(JSON.parse(t.settings||'{}').dm_policy)||'everyone'}catch{}
if(pol==='none')return false
const blk=await c.env.DB.prepare('select 1 x from blocks where (user_id=? and blocked_id=?) or (user_id=? and blocked_id=?)').bind(uid,botId,botId,uid).first().catch(()=>null)
if(blk)return false
const key=[botId,uid].sort().join(':')
let conv=await c.env.DB.prepare('select id from conversations where dm_key=?').bind(key).first()
if(!conv){
const id=newId('cv'),tt=Date.now()
await c.env.DB.batch([c.env.DB.prepare('insert into conversations(id,type,dm_key,created_at) values(?,?,?,?)').bind(id,'dm',key,tt),c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted,hidden) values(?,?,?,1,0)').bind(id,botId,tt),c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted,hidden) values(?,?,?,1,0)').bind(id,uid,tt)])
conv={id}
}else{
const tt=Date.now()
await c.env.DB.batch([c.env.DB.prepare('insert or ignore into conv_members(conv_id,user_id,joined_at,accepted,hidden) values(?,?,?,1,0)').bind(conv.id,botId,tt),c.env.DB.prepare('insert or ignore into conv_members(conv_id,user_id,joined_at,accepted,hidden) values(?,?,?,1,0)').bind(conv.id,uid,tt),c.env.DB.prepare('update conv_members set hidden=0,accepted=1 where conv_id=? and user_id in (?,?)').bind(conv.id,botId,uid)])
}
await say(c,conv.id,null,botId,text,null)
return true
},
linkConnect:async(key,alias)=>{
if(!key)return false
const o=await c.env.DB.prepare('select bot_id from bot_projects where merge_key=?').bind(key).first()
if(!o||o.bot_id===botId)return false
await c.env.DB.prepare('insert or replace into bot_links(bot_id,alias,other_bot_id) values(?,?,?)').bind(botId,alias,o.bot_id).run()
return true
},
linkGet:async(alias,k,scope)=>{const l=await c.env.DB.prepare('select other_bot_id o from bot_links where bot_id=? and alias=?').bind(botId,alias).first();if(!l)return 0;return(await getVar(c,l.o,sid,vkey(k,scope,uid)))||0},
linkSet:async(alias,k,scope,v)=>{const l=await c.env.DB.prepare('select other_bot_id o from bot_links where bot_id=? and alias=?').bind(botId,alias).first();if(!l)return;await putVar(c,l.o,sid,vkey(k,scope,uid),/^-?\d+(\.\d+)?$/.test(v)?Number(v):v)},
cardKey:st=>btoa(botId+'|'+sid+'|'+uid+(st?'|'+st:'')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),
xp:async(amt,cd)=>{
const k=vkey('xp','user',uid)
if(Number(await getVar(c,botId,sid,'xpban:'+uid))===1){const cx=Number(await getVar(c,botId,sid,k))||0,lx=levelOf(cx);return{xp:cx,level:lx,next:50*(lx+1)*(lx+2)-cx,up:false}}
let cur=await getVar(c,botId,sid,k),up=false
const ck=vkey('cd_xp','user',uid),last=await getVar(c,botId,sid,ck),t=Date.now()
if(!last||t-last>=cd*1000){await putVar(c,botId,sid,ck,t);const before=levelOf(cur);cur=await addVar(c,botId,sid,k,amt);up=levelOf(cur)>before}
const l=levelOf(cur)
return{xp:cur,level:l,next:50*(l+1)*(l+2)-cur,up}
},
xpGet:()=>getVar(c,botId,sid,vkey('xp','user',uid)),
top:async n=>{
const rows=(await c.env.DB.prepare("select substr(k,4) u,v from bot_vars where bot_id=? and server_id=? and k like 'xp:%' order by v desc limit ?").bind(botId,sid,n).all()).results
if(!rows.length)return[]
const us=(await c.env.DB.prepare('select id,display_name from users where id in ('+rows.map(()=>'?').join(',')+')').bind(...rows.map(x=>x.u)).all()).results
const nm=new Map(us.map(u=>[u.id,u.display_name]))
return rows.map(x=>({name:nm.get(x.u)||'Member',v:x.v}))
},
getSecret:async k=>{const r=await c.env.DB.prepare('select v from bot_vars where bot_id=? and server_id=? and k=?').bind(botId,sid,'sec_'+k).first();return r?String(r.v):''},
setSecret:async(k,v)=>{const m=await loadMember(c.env,sid,uid);if(!m||!(m.admin||m.owner||(m.base&P.MANAGE_SERVER)))return false;await putVar(c,botId,sid,'sec_'+k,v);return true},
as:async t=>{
const id=(t.match(/<@([a-z0-9_]+)>/i)||[])[1]||t.replace(/^@/,'')
const u=await c.env.DB.prepare('select u.id,u.username,u.display_name from members m join users u on u.id=m.user_id where m.server_id=? and (u.id=? or u.username=?)').bind(sid,id,id).first()
return u?makeIo(c,botId,sid,room,u,message):new Proxy({},{get:()=>async()=>0})
},
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
isOwner:async()=>{const m=await loadMember(c.env,sid,uid);return!!m&&!!m.owner},
joinedDays:async()=>{const r=await c.env.DB.prepare('select joined_at from members where server_id=? and user_id=?').bind(sid,uid).first();return r?Math.floor((now()-r.joined_at)/86400000):null},
notice:async t=>{c.pub('u_'+uid,{t:'notice',text:t})},
unpin:async()=>{
if(!message)return
const brr=await resolveRoom(c.env,room,botId)
if(!(brr.perms&P.MANAGE_MESSAGES))return
await c.env.DB.prepare('update messages set pinned=0 where id=?').bind(message.id).run()
const row=await c.env.DB.prepare('select * from messages where id=?').bind(message.id).first()
const[m]=await hydrate(c.env,[row],botId)
await publishMsg(c,brr,{t:'msg.update',m})
},
slowmode:async sec=>{
const bm=await loadMember(c.env,sid,botId)
if(!bm||!(bm.admin||(bm.base&P.MANAGE_CHANNELS)))return
await c.env.DB.prepare('update channels set slowmode=? where id=? and server_id=?').bind(Math.max(0,Math.min(21600,sec)),room,sid).run()
c.pub('s_'+sid,{t:'server.update'})
},
setNick:async nick=>{
const bm=await loadMember(c.env,sid,botId),tm=await loadMember(c.env,sid,uid)
if(!bm||!tm||!(bm.admin||(bm.base&P.MODERATE))||tm.owner||tm.admin||tm.top>=bm.top)return
await c.env.DB.prepare('update members set nickname=? where server_id=? and user_id=?').bind(nick||null,sid,uid).run()
c.pub('s_'+sid,{t:'member.update',uid})
},
untimeout:async()=>{
const bm=await loadMember(c.env,sid,botId)
if(!bm||!(bm.admin||(bm.base&P.MODERATE)))return
await c.env.DB.prepare('update members set timeout_until=0 where server_id=? and user_id=?').bind(sid,uid).run()
c.pub('s_'+sid,{t:'member.update',uid})
},
kick:r=>removeFrom(c,sid,botId,uid,'kick',r),
ban:r=>removeFrom(c,sid,botId,uid,'ban',r),
purge:async n=>{
const brr=await resolveRoom(c.env,room,botId)
if(!(brr.perms&P.MANAGE_MESSAGES))return
const rows=(await c.env.DB.prepare('select id from messages where room=? and author_id=? and deleted_at is null order by created_at desc limit ?').bind(room,uid,Math.max(1,Math.min(10,n))).all()).results
for(const r of rows){
await c.env.DB.prepare("update messages set deleted_at=?,content='',pinned=0 where id=? and deleted_at is null").bind(now(),r.id).run()
await publishMsg(c,brr,{t:'msg.delete',room,id:r.id})
}
},
warn:async reason=>{
await c.env.DB.batch([caseSt(c,sid,botId,uid,'warn',reason)])
c.pub('u_'+uid,{t:'notice',text:'You received a warning: '+reason})
const w=await addVar(c,botId,sid,vkey('warns','user',uid),1)
await warnLimit(c,sid,botId,uid)
return w
},
warns:()=>warnCount(c,sid,uid),
punish:(a,r)=>punish(c,sid,botId,uid,a,r),
save:(k,v,scope)=>putVar(c,botId,sid,vkey('tx_'+k,scope,uid),v),
load:async(k,scope)=>{const r=await c.env.DB.prepare('select v from bot_vars where bot_id=? and server_id=? and k=?').bind(botId,sid,vkey('tx_'+k,scope,uid)).first();return r?r.v:null},
getCount:(k,scope)=>getVar(c,botId,sid,vkey(k,scope,uid)),
memberInfo:async what=>{
const m=await c.env.DB.prepare('select nickname,joined_at from members where server_id=? and user_id=?').bind(sid,uid).first()
if(!m)return''
if(what==='nickname')return m.nickname||user.display_name||''
if(what==='joined_days')return Math.floor((now()-m.joined_at)/86400000)
const rs=(await c.env.DB.prepare('select r.name from member_roles mr join roles r on r.id=mr.role_id where mr.server_id=? and mr.user_id=? and r.is_everyone=0 order by r.position desc limit 25').bind(sid,uid).all()).results
return what==='role_count'?rs.length:rs.map(x=>x.name).join(', ')
},
api:(k,i)=>runApi('b:'+botId,k,i),
http:(u,pt)=>runHttp('b:'+botId,u,pt),
webhook:async(u,b)=>{
const r=await runWebhook('b:'+botId,u,b)
if(r===true)return true
try{limit('whfail:'+botId,3,300000);const o=await c.env.DB.prepare('select bot_owner from users where id=?').bind(botId).first();if(o&&o.bot_owner)c.pub('u_'+o.bot_owner,{t:'notice',text:'Your bot could not send to Discord: '+r})}catch{}
return r
},
device:async acts=>{
try{limit('dev:'+botId+':'+uid,6,60000)}catch{return}
const b=await c.env.DB.prepare('select display_name from users where id=?').bind(botId).first()
c.pub('u_'+uid,{t:'bot.device',bot:botId,name:b?b.display_name:'A bot',acts})
},
serverInfo:async what=>{
if(what==='name')return(await c.env.DB.prepare('select name from servers where id=?').bind(sid).first())?.name||''
const t=what==='members'?'members':what==='channels'?'channels':'roles'
return(await c.env.DB.prepare(`select count(*) n from ${t} where server_id=?`).bind(sid).first()).n
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
let ch=0
if(add)ch=(await c.env.DB.prepare('insert or ignore into member_roles(server_id,user_id,role_id) values(?,?,?)').bind(sid,uid,role.id).run()).meta?.changes||0
else ch=(await c.env.DB.prepare('delete from member_roles where server_id=? and user_id=? and role_id=?').bind(sid,uid,role.id).run()).meta?.changes||0
if(ch)c.pub('s_'+sid,{t:'member.update',uid})
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
const ctx={fromBot:!!c.user.is_bot,user,channel:rr.ch.name,server:rr.m.server.name,text:message.content||'',mentioned:(message.content||'').includes('<@'+row.bot_id+'>'),attachments:(message.attachments||[]).length,replied:!!(message.reply||message.reply_to),at:Date.now()}
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
isOwner:async()=>false,joinedDays:async()=>30,notice:async t=>{sent.push({note:'Privately notifies the member: '+t})},unpin:async()=>{sent.push({note:'Unpins the message'})},slowmode:async s=>{sent.push({note:'Sets slow mode to '+s+' seconds'})},setNick:async n=>{sent.push({note:n?'Sets the nickname to '+n:'Clears the nickname'})},untimeout:async()=>{sent.push({note:'Ends the time out'})},kick:async r=>{sent.push({note:'Kicks the member: '+r})},ban:async r=>{sent.push({note:'Bans the member: '+r})},purge:async n=>{sent.push({note:'Deletes up to '+n+' recent messages from the member'})},
warn:async r=>{const k='user:warns';mem.set(k,(mem.get(k)||0)+1);sent.push({note:'Warns the member: '+r});return mem.get(k)},
save:async(k,v,s)=>{mem.set('tx:'+s+':'+k,v)},load:async(k,s)=>mem.has('tx:'+s+':'+k)?mem.get('tx:'+s+':'+k):null,getCount:async(k,s)=>mem.get(s+':'+k)||0,memberInfo:async w=>w==='joined_days'?30:w==='role_count'?1:w==='roles'?'Member':'Tester',serverInfo:async w=>w==='name'?'Your server':w==='members'?42:w==='channels'?8:5,
api:(k,i)=>runApi('t:'+user.id,k,i),http:(u,pt)=>runHttp('t:'+user.id,u,pt),webhook:async()=>false,device:async a=>{sent.push({note:'Asks the member to allow on their device: '+a.map(x=>x.k).join(', ')})},
as:async()=>io,
xp:async(a,cd)=>{const cur=(mem.get('xp')||0)+a;mem.set('xp',cur);const l=levelOf(cur);return{xp:cur,level:l,next:50*(l+1)*(l+2)-cur,up:levelOf(cur)>levelOf(cur-a)}},
xpGet:async()=>mem.get('xp')||0,
xpBan:async()=>{},xpBanned:async()=>false,dm:async x=>{sent.push({note:'Sends a private message: '+x});return true},linkConnect:async k=>!!k,linkGet:async()=>0,linkSet:async()=>{},adjXp:async(m,a)=>{let cur=mem.get('xp')||0;a=Math.max(0,Math.floor(Number(a))||0);cur=m==='give'?cur+a:m==='take'?Math.max(0,cur-a):m==='set'?a:0;mem.set('xp',cur);sent.push({note:'Changes XP ('+m+') to '+cur});return cur},
top:async()=>[{name:user.display_name||'You',v:mem.get('xp')||0}],
getSecret:async()=>'',setSecret:async()=>false,
warns:async()=>mem.get('user:warns')||0,
punish:async a=>{sent.push({note:'Would '+a+' the member'})},
isMod:async()=>false,
hasRole:async()=>false,
del:async()=>{sent.push({note:'Deletes the message'})},
pin:async()=>{sent.push({note:'Pins the message'})},
timeout:async m=>{sent.push({note:'Times the member out for '+m+' minutes'})},
role:async(n,a)=>{sent.push({note:(a?'Gives':'Takes')+' the role '+n})}
}
const log=await execute(graph,{user,channel:'general',server:'Your server',text:event==='join'?'':text,event:event||undefined,hook:event==='hook'?hook:undefined,mentioned:/<@bot>/.test(text),attachments:/\[image\]/.test(text)?1:0,replied:/\[reply\]/.test(text),dry:true,at:Date.now()},io)
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
