import{fail,now,newId,str,opt,limit,body,json,clamp,placeholders}from'./util.js'
import{P,resolveRoom,loadMember}from'./perms.js'
import{PUBLIC,badgesOf,linksOf}from'./auth.js'

const pair=(x,y)=>x<y?[x,y]:[y,x]
const settingsOf=u=>{try{return JSON.parse(u.settings||'{}')}catch{return{}}}

async function areFriends(env,x,y){
const[a,b]=pair(x,y)
const f=await env.DB.prepare("select 1 x from friends where a=? and b=? and status='accepted'").bind(a,b).first()
return!!f
}
async function blockedEither(env,x,y){
return!!await env.DB.prepare('select 1 x from blocks where (user_id=? and blocked_id=?) or (user_id=? and blocked_id=?)').bind(x,y,y,x).first()
}
async function userById(env,id){
const u=await env.DB.prepare(`select ${PUBLIC},u.settings,u.is_admin,u.labs,u.is_bot from users u where u.id=? and u.deleted_at is null`).bind(id).first()
if(!u)fail(404,'User not found')
return u
}
const strip=u=>{const{settings,is_admin,labs,is_bot,...rest}=u;return rest}

async function convMembers(env,ids){
if(!ids.length)return{}
const rows=(await env.DB.prepare(`select cm.conv_id,u.id,u.username,u.display_name,u.avatar_id,u.accent from conv_members cm join users u on u.id=cm.user_id where cm.conv_id in (${placeholders(ids)})`).bind(...ids).all()).results
const out={}
for(const r of rows)(out[r.conv_id]||=[]).push({id:r.id,username:r.username,display_name:r.display_name,avatar_id:r.avatar_id,accent:r.accent})
return out
}

async function maybeDelete(c,convId){
const left=await c.env.DB.prepare('select count(*) n from conv_members where conv_id=?').bind(convId).first()
if(left.n>0)return
const files=(await c.env.DB.prepare('select r2_key from files where room=?').bind(convId).all()).results
for(const f of files)await c.env.FILES.delete(f.r2_key)
await c.env.DB.batch([
c.env.DB.prepare('delete from files where room=?').bind(convId),
c.env.DB.prepare('delete from reactions where message_id in (select id from messages where room=?)').bind(convId),
c.env.DB.prepare('delete from messages where room=?').bind(convId),
c.env.DB.prepare('delete from read_state where room=?').bind(convId),
c.env.DB.prepare('delete from conversations where id=?').bind(convId)
])
}

export default function(r){
r.add('GET','/api/users/by-name/:username',async c=>{
const u=await c.env.DB.prepare(`select ${PUBLIC} from users u where u.username=? and u.deleted_at is null`).bind(c.p.username).first()
if(!u)fail(404,'No user with that username')
return{user:u}
})

r.add('GET','/api/users/:id',async c=>{
const raw=await userById(c.env,c.p.id)
const u=strip(raw)
u.links=linksOf(u.links)
u.badges=badgesOf(c.env,raw)
const[a,b]=pair(c.user.id,u.id)
const f=await c.env.DB.prepare('select status,requester from friends where a=? and b=?').bind(a,b).first()
const blocked=await c.env.DB.prepare('select 1 x from blocks where user_id=? and blocked_id=?').bind(c.user.id,u.id).first()
const mutual=await c.env.DB.prepare('select count(*) n from members m1 join members m2 on m1.server_id=m2.server_id where m1.user_id=? and m2.user_id=?').bind(c.user.id,u.id).first()
return{user:u,relationship:{friend:f?.status==='accepted',pending:f?.status==='pending'?(f.requester===c.user.id?'outgoing':'incoming'):null,blocked:!!blocked},mutual_servers:mutual.n}
})

r.add('GET','/api/friends',async c=>{
const rows=(await c.env.DB.prepare(`select f.a,f.b,f.status,f.requester,${PUBLIC} from friends f join users u on u.id=case when f.a=? then f.b else f.a end where (f.a=? or f.b=?) and u.deleted_at is null order by u.display_name`).bind(c.user.id,c.user.id,c.user.id).all()).results
const out={friends:[],incoming:[],outgoing:[]}
for(const x of rows){
const{a,b,status,requester,...u}=x
if(status==='accepted')out.friends.push(u)
else if(requester===c.user.id)out.outgoing.push(u)
else out.incoming.push(u)
}
out.blocked=(await c.env.DB.prepare(`select ${PUBLIC} from blocks b join users u on u.id=b.blocked_id where b.user_id=?`).bind(c.user.id).all()).results
return out
})

r.add('POST','/api/friends/request',async c=>{
limit('freq:'+c.user.id,20,3600000)
const b=await body(c.req)
const t=await c.env.DB.prepare('select id,settings from users where username=? and deleted_at is null').bind(str(b.username,1,40,'Username')).first()
if(!t||t.id===c.user.id)fail(404,'No user with that username')
if(await blockedEither(c.env,c.user.id,t.id))fail(403,'Unable to send a friend request to this user')
const[a,bb]=pair(c.user.id,t.id)
const ex=await c.env.DB.prepare('select status,requester from friends where a=? and b=?').bind(a,bb).first()
if(ex?.status==='accepted')fail(409,'You are already friends')
if(ex&&ex.requester===c.user.id)fail(409,'Friend request already sent')
if(ex){
await c.env.DB.prepare("update friends set status='accepted' where a=? and b=?").bind(a,bb).run()
c.pub('u_'+t.id,{t:'friend'});c.pub('u_'+c.user.id,{t:'friend'})
return{status:'accepted'}
}
if(settingsOf(t).friend_policy==='none')fail(403,'This user is not accepting friend requests')
await c.env.DB.batch([
c.env.DB.prepare("insert into friends(a,b,status,requester,created_at) values(?,?,'pending',?,?)").bind(a,bb,c.user.id,now()),
c.env.DB.prepare('insert into notifications(id,user_id,type,data,created_at) values(?,?,?,?,?)').bind(newId('n'),t.id,'friend_request',JSON.stringify({from:c.user.id,name:c.user.display_name}),now())
])
c.pub('u_'+t.id,{t:'friend'});c.pub('u_'+t.id,{t:'notif'})
return json({status:'pending'},201)
})

r.add('POST','/api/friends/:uid/accept',async c=>{
const[a,b]=pair(c.user.id,c.p.uid)
const res=await c.env.DB.prepare("update friends set status='accepted' where a=? and b=? and status='pending' and requester=?").bind(a,b,c.p.uid).run()
if(!res.meta.changes)fail(404,'No pending request from this user')
c.pub('u_'+c.p.uid,{t:'friend'});c.pub('u_'+c.user.id,{t:'friend'})
return{ok:true}
})

r.add('DELETE','/api/friends/:uid',async c=>{
const[a,b]=pair(c.user.id,c.p.uid)
await c.env.DB.prepare('delete from friends where a=? and b=?').bind(a,b).run()
c.pub('u_'+c.p.uid,{t:'friend'});c.pub('u_'+c.user.id,{t:'friend'})
return{ok:true}
})

r.add('POST','/api/blocks/:uid',async c=>{
if(c.p.uid===c.user.id)fail(400,'You cannot block yourself')
await userById(c.env,c.p.uid)
const[a,b]=pair(c.user.id,c.p.uid)
await c.env.DB.batch([
c.env.DB.prepare('insert or ignore into blocks(user_id,blocked_id,created_at) values(?,?,?)').bind(c.user.id,c.p.uid,now()),
c.env.DB.prepare('delete from friends where a=? and b=?').bind(a,b)
])
c.pub('u_'+c.p.uid,{t:'friend'});c.pub('u_'+c.user.id,{t:'friend'})
return{ok:true}
})
r.add('DELETE','/api/blocks/:uid',async c=>{
await c.env.DB.prepare('delete from blocks where user_id=? and blocked_id=?').bind(c.user.id,c.p.uid).run()
c.pub('u_'+c.user.id,{t:'friend'})
return{ok:true}
})

r.add('GET','/api/conversations',async c=>{
const rows=(await c.env.DB.prepare('select cv.id,cv.type,cv.name,cv.icon_id,cv.owner_id,cv.last_msg,cv.last_message_at,cv.created_at,cm.muted,cm.hidden,cm.accepted from conv_members cm join conversations cv on cv.id=cm.conv_id where cm.user_id=? and cm.hidden=0 order by cv.last_message_at desc,cv.created_at desc limit 90').bind(c.user.id).all()).results
const mem=await convMembers(c.env,rows.map(x=>x.id))
return{conversations:rows.map(x=>({...x,members:mem[x.id]||[]}))}
})

r.add('POST','/api/conversations',async c=>{
limit('mkconv:'+c.user.id,30,3600000)
const b=await body(c.req)
const uid=String(b.user_id)
if(uid===c.user.id)fail(400,'You cannot message yourself')
const t=await userById(c.env,uid)
if(await blockedEither(c.env,c.user.id,uid))fail(403,'You cannot message this user')
const[x,y]=pair(c.user.id,uid)
const key=x+':'+y
let conv=await c.env.DB.prepare('select id from conversations where dm_key=?').bind(key).first()
if(!conv){
const fr=await areFriends(c.env,c.user.id,uid)
const pol=settingsOf(t).dm_policy||'everyone'
if(!fr&&pol==='none')fail(403,'This user is not accepting direct messages')
if(!fr&&pol==='friends')fail(403,'This user only accepts messages from friends')
const id=newId('cv')
await c.env.DB.batch([
c.env.DB.prepare('insert into conversations(id,type,dm_key,created_at) values(?,?,?,?)').bind(id,'dm',key,now()),
c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted) values(?,?,?,1)').bind(id,c.user.id,now()),
c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted,hidden) values(?,?,?,?,1)').bind(id,uid,now(),fr?1:0)
])
conv={id}
}else{
const mine=await c.env.DB.prepare('select 1 x from conv_members where conv_id=? and user_id=?').bind(conv.id,c.user.id).first()
if(!mine)await c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted) values(?,?,?,1)').bind(conv.id,c.user.id,now()).run()
else await c.env.DB.prepare('update conv_members set hidden=0 where conv_id=? and user_id=?').bind(conv.id,c.user.id).run()
const other=await c.env.DB.prepare('select 1 x from conv_members where conv_id=? and user_id=?').bind(conv.id,uid).first()
if(!other)await c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted,hidden) values(?,?,?,0,1)').bind(conv.id,uid,now()).run()
}
return json({id:conv.id},201)
})

r.add('POST','/api/conversations/group',async c=>{
limit('mkgrp:'+c.user.id,10,3600000)
const b=await body(c.req)
const ids=[...new Set((Array.isArray(b.user_ids)?b.user_ids:[]).map(String))].filter(x=>x!==c.user.id)
if(ids.length<2||ids.length>9)fail(400,'Pick between 2 and 9 friends')
for(const u of ids){if(!await areFriends(c.env,c.user.id,u))fail(403,'You can only add friends to a group')}
const id=newId('cv')
const t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into conversations(id,type,name,owner_id,created_at) values(?,?,?,?,?)').bind(id,'group',b.name?str(b.name,1,50,'Group name'):'',c.user.id,t),
c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted) values(?,?,?,1)').bind(id,c.user.id,t),
...ids.map(u=>c.env.DB.prepare('insert into conv_members(conv_id,user_id,joined_at,accepted) values(?,?,?,1)').bind(id,u,t))
])
for(const u of ids)c.pub('u_'+u,{t:'conv.update'})
return json({id},201)
})

async function groupCtx(c){
const rr=await resolveRoom(c.env,c.p.id,c.user.id)
if(rr.kind!=='dm'||rr.conv.type!=='group')fail(400,'Not a group conversation')
return rr
}
const notifyConv=async(c,id)=>{
const ms=(await c.env.DB.prepare('select user_id from conv_members where conv_id=?').bind(id).all()).results
for(const m of ms)c.pub('u_'+m.user_id,{t:'conv.update'})
}

r.add('PATCH','/api/conversations/:id',async c=>{
const rr=await groupCtx(c)
if(rr.conv.owner_id!==c.user.id)fail(403,'Only the group owner can change this')
const b=await body(c.req)
const sets=[],vals=[]
if('name'in b){sets.push('name=?');vals.push(b.name?str(b.name,1,50,'Group name'):'')}
if('icon_id'in b){
if(b.icon_id===null){sets.push('icon_id=?');vals.push(null)}
else{
const f=await c.env.DB.prepare("select id from files where id=? and kind='conv_icon' and room=?").bind(String(b.icon_id),rr.room).first()
if(!f)fail(400,'Upload the image first')
sets.push('icon_id=?');vals.push(f.id)
}
}
if(sets.length)await c.env.DB.prepare(`update conversations set ${sets.join(',')} where id=?`).bind(...vals,rr.room).run()
await notifyConv(c,rr.room)
return{ok:true}
})

r.add('POST','/api/conversations/:id/members',async c=>{
const rr=await groupCtx(c)
if(rr.conv.owner_id!==c.user.id)fail(403,'Only the group owner can add members')
const b=await body(c.req)
const uid=String(b.user_id)
if(!await areFriends(c.env,c.user.id,uid))fail(403,'You can only add friends to a group')
const n=await c.env.DB.prepare('select count(*) n from conv_members where conv_id=?').bind(rr.room).first()
if(n.n>=10)fail(400,'Groups can have up to 10 members')
await c.env.DB.prepare('insert or ignore into conv_members(conv_id,user_id,joined_at,accepted) values(?,?,?,1)').bind(rr.room,uid,now()).run()
await notifyConv(c,rr.room)
return{ok:true}
})

r.add('DELETE','/api/conversations/:id/members/:uid',async c=>{
const rr=await groupCtx(c)
const self=c.p.uid===c.user.id
if(!self&&rr.conv.owner_id!==c.user.id)fail(403,'Only the group owner can remove members')
const ms=(await c.env.DB.prepare('select user_id from conv_members where conv_id=? order by joined_at').bind(rr.room).all()).results
if(!ms.some(m=>m.user_id===c.p.uid))fail(404,'Member not found')
const stmts=[c.env.DB.prepare('delete from conv_members where conv_id=? and user_id=?').bind(rr.room,c.p.uid)]
const rest=ms.filter(m=>m.user_id!==c.p.uid)
if(rr.conv.owner_id===c.p.uid&&rest.length)stmts.push(c.env.DB.prepare('update conversations set owner_id=? where id=?').bind(rest[0].user_id,rr.room))
await c.env.DB.batch(stmts)
for(const m of ms)c.pub('u_'+m.user_id,{t:'conv.update'})
await maybeDelete(c,rr.room)
return{ok:true}
})

r.add('POST','/api/conversations/:id/decline',async c=>{
const rr=await resolveRoom(c.env,c.p.id,c.user.id)
if(rr.kind!=='dm'||rr.conv.type!=='dm')fail(400,'Not a direct message')
await c.env.DB.prepare('delete from conv_members where conv_id=? and user_id=?').bind(rr.room,c.user.id).run()
await maybeDelete(c,rr.room)
return{ok:true}
})

r.add('PATCH','/api/conversations/:id/me',async c=>{
const rr=await resolveRoom(c.env,c.p.id,c.user.id)
const b=await body(c.req)
const sets=[],vals=[]
if('muted'in b){sets.push('muted=?');vals.push(b.muted?1:0)}
if('hidden'in b){sets.push('hidden=?');vals.push(b.hidden?1:0)}
if(b.accepted===true){sets.push('accepted=?');vals.push(1)}
if(sets.length)await c.env.DB.prepare(`update conv_members set ${sets.join(',')} where conv_id=? and user_id=?`).bind(...vals,rr.room,c.user.id).run()
c.pub('u_'+c.user.id,{t:'conv.update'})
return{ok:true}
})

r.add('POST','/api/conversations/:id/ring',async c=>{
limit('ring:'+c.user.id,6,60000)
const rr=await resolveRoom(c.env,c.p.id,c.user.id)
if(rr.kind!=='dm'||!(rr.perms&P.CONNECT))fail(403,'You cannot call here')
if(rr.perms===P.VIEW)fail(403,'You cannot call this user')
const b=await body(c.req).catch(()=>({}))
const only=Array.isArray(b.user_ids)?new Set(b.user_ids.filter(x=>typeof x==='string').slice(0,20)):null
const ms=(await c.env.DB.prepare('select user_id from conv_members where conv_id=? and user_id!=? and accepted=1').bind(rr.room,c.user.id).all()).results.filter(m=>!only||only.has(m.user_id))
for(const m of ms)c.pub('u_'+m.user_id,{t:'call.ring',room:rr.room,from:{id:c.user.id,display_name:c.user.display_name,avatar_id:c.user.avatar_id}})
return{ok:true,rang:ms.length}
})

r.add('POST','/api/conversations/:id/ring/:action',async c=>{
limit('ringa:'+c.user.id,30,60000)
if(!['decline','cancel'].includes(c.p.action))fail(404,'Not found')
const rr=await resolveRoom(c.env,c.p.id,c.user.id)
if(rr.kind!=='dm')fail(400,'Not a conversation')
const b=await body(c.req).catch(()=>({}))
const ms=(await c.env.DB.prepare('select user_id from conv_members where conv_id=? and user_id!=?').bind(rr.room,c.user.id).all()).results
const ev=c.p.action==='cancel'?{t:'call.cancel',room:rr.room,by:c.user.id}:{t:'call.declined',room:rr.room,busy:!!b.busy,by:{id:c.user.id,display_name:c.user.display_name}}
for(const m of ms)c.pub('u_'+m.user_id,ev)
return{ok:true}
})

r.add('GET','/api/users/:id/note',async c=>{
const n=await c.env.DB.prepare('select note from user_notes where user_id=? and target_id=?').bind(c.user.id,c.p.id).first()
return{note:n?n.note:''}
})
r.add('PUT','/api/users/:id/note',async c=>{
limit('note:'+c.user.id,60,60000)
const b=await body(c.req,2000)
const note=typeof b.note==='string'?b.note.trim().slice(0,500):''
await userById(c.env,c.p.id)
if(!note)await c.env.DB.prepare('delete from user_notes where user_id=? and target_id=?').bind(c.user.id,c.p.id).run()
else await c.env.DB.prepare('insert into user_notes(user_id,target_id,note,updated_at) values(?,?,?,?) on conflict(user_id,target_id) do update set note=excluded.note,updated_at=excluded.updated_at').bind(c.user.id,c.p.id,note,now()).run()
return{ok:true}
})

r.add('GET','/api/notifications',async c=>{
const before=clamp(c.url.searchParams.get('before'),9e15,0,9e15)
const rows=(await c.env.DB.prepare('select id,type,data,created_at,read_at from notifications where user_id=? and created_at<? order by created_at desc limit 40').bind(c.user.id,before).all()).results
const n=await c.env.DB.prepare('select count(*) n from notifications where user_id=? and read_at is null').bind(c.user.id).first()
return{notifications:rows.map(x=>({...x,data:JSON.parse(x.data)})),unread:n.n}
})
r.add('POST','/api/notifications/read',async c=>{
const b=await body(c.req).catch(()=>({}))
if(Array.isArray(b.ids)&&b.ids.length){
const ids=b.ids.slice(0,50).map(String)
await c.env.DB.prepare(`update notifications set read_at=? where user_id=? and read_at is null and id in (${placeholders(ids)})`).bind(now(),c.user.id,...ids).run()
}else await c.env.DB.prepare('update notifications set read_at=? where user_id=? and read_at is null').bind(now(),c.user.id).run()
return{ok:true}
})

r.add('POST','/api/reports',async c=>{
limit('report:'+c.user.id,10,3600000)
const b=await body(c.req)
if(!['message','user','server'].includes(b.type))fail(400,'Invalid report type')
const reason=str(b.reason,5,1000,'Reason')
const id=String(b.id)
let serverId=null
if(b.type==='message'){
const m=await c.env.DB.prepare('select room,server_id from messages where id=?').bind(id).first()
if(!m)fail(404,'Message not found')
await resolveRoom(c.env,m.room,c.user.id)
serverId=m.server_id
}else if(b.type==='user')await userById(c.env,id)
else{const s=await c.env.DB.prepare('select id from servers where id=?').bind(id).first();if(!s)fail(404,'Server not found')}
await c.env.DB.prepare('insert into reports(id,reporter_id,target_type,target_id,server_id,reason,created_at) values(?,?,?,?,?,?,?)').bind(newId('rp'),c.user.id,b.type,id,serverId,reason,now()).run()
return json({ok:true},201)
})

r.add('GET','/api/servers/:sid/reports',async c=>{
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MODERATE))fail(403,'You do not have permission to do that')
const rows=(await c.env.DB.prepare("select r.id,r.target_type,r.target_id,r.reason,r.created_at,u.username reporter,(select content from messages where id=r.target_id and r.target_type='message') content from reports r join users u on u.id=r.reporter_id where r.server_id=? and r.status='open' order by r.created_at desc limit 100").bind(m.server.id).all()).results
return{reports:rows}
})
r.add('POST','/api/servers/:sid/reports/:rid',async c=>{
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MODERATE))fail(403,'You do not have permission to do that')
await c.env.DB.batch([c.env.DB.prepare("update reports set status='resolved' where id=? and server_id=?").bind(c.p.rid,m.server.id),c.logStmt(m.server.id,'report.resolve',c.p.rid)])
return{ok:true}
})
}
