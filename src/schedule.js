import{fail,now,newId,body,str,limit}from'./util.js'
import{P,resolveRoom}from'./perms.js'
const MAX_PENDING=25
export default function(r){
r.add('POST','/api/rooms/:room/scheduled',async c=>{
limit('sched:'+c.user.id,20,60000)
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
if(!(rr.perms&P.SEND))fail(403,'You cannot send messages here')
const b=await body(c.req,8000)
const content=str(String(b.content||'').trim(),1,4000,'Message')
const at=Number(b.send_at)
if(!Number.isFinite(at)||at<now()+30000)fail(400,'Pick a time at least a minute from now')
if(at>now()+30*86400000)fail(400,'Messages can be scheduled up to 30 days ahead')
const n=await c.env.DB.prepare("select count(*) n from scheduled_msgs where user_id=? and status='pending'").bind(c.user.id).first()
if(n.n>=MAX_PENDING)fail(429,'You can have '+MAX_PENDING+' scheduled messages at once')
const id=newId('sm')
await c.env.DB.prepare('insert into scheduled_msgs(id,user_id,room,content,reply_to,send_at,created_at) values(?,?,?,?,?,?,?)').bind(id,c.user.id,rr.room,content,b.reply_to?String(b.reply_to).slice(0,40):null,Math.floor(at),now()).run()
return{id,send_at:Math.floor(at)}
})
r.add('GET','/api/scheduled',async c=>{
const rows=(await c.env.DB.prepare("select id,room,content,send_at,status,error from scheduled_msgs where user_id=? and (status='pending' or (status in('failed','sent') and send_at>?)) order by send_at limit 60").bind(c.user.id,now()-86400000).all()).results
return{scheduled:rows}
})
r.add('DELETE','/api/scheduled/:id',async c=>{
const x=await c.env.DB.prepare("delete from scheduled_msgs where id=? and user_id=? and status in('pending','failed')").bind(c.p.id,c.user.id).run()
if(!x.meta.changes)fail(404,'Not found or already sent')
return{ok:true}
})
}
export async function deliverDue(env,call){
const due=(await env.DB.prepare("select * from scheduled_msgs where status='pending' and send_at<=? order by send_at limit 40").bind(now()).all()).results
let sent=0
for(const m of due){
const g=await env.DB.prepare("update scheduled_msgs set status='sending' where id=? and status='pending'").bind(m.id).run()
if(!g.meta.changes)continue
try{
const u=await env.DB.prepare('select * from users where id=? and deleted_at is null and suspended=0').bind(m.user_id).first()
if(!u)throw new Error('Account unavailable')
await call(u,'POST','/api/rooms/'+m.room+'/messages',{content:m.content,reply_to:m.reply_to||undefined,nonce:('s'+m.id).slice(0,40)})
await env.DB.prepare("update scheduled_msgs set status='sent' where id=?").bind(m.id).run()
sent++
}catch(e){
await env.DB.prepare("update scheduled_msgs set status='failed',error=? where id=?").bind(String(e.message||e).slice(0,200),m.id).run()
}
}
await env.DB.prepare("delete from scheduled_msgs where status in('sent','failed') and send_at<?").bind(now()-7*86400000).run()
return sent
}
