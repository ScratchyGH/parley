import{fail,now,newId,str,body,limit}from'./util.js'
import{banUserDevices}from'./devices.js'
const guard=c=>{if(!c.user.admin)fail(404,'Not found')}
const HEX=/^[a-f0-9]{64}$/
export async function hashBlocked(env,sum){
if(!sum||!HEX.test(sum))return false
return!!(await env.DB.prepare('select 1 x from blocked_hashes where hash=?').bind(sum).first())
}
export default function(r){
r.add('POST','/api/content-reports',async c=>{
limit('creport:'+c.user.id,10,3600000)
const b=await body(c.req)
if(!['illegal','csam','threat'].includes(b.category))fail(400,'Invalid category')
if(!['message','user','server'].includes(b.type))fail(400,'Invalid report type')
const id=String(b.id||'').slice(0,60)
let serverId=null
if(b.type==='message'){
const m=await c.env.DB.prepare('select server_id from messages where id=?').bind(id).first()
if(!m)fail(404,'Message not found')
serverId=m.server_id
}else if(b.type==='user'){if(!await c.env.DB.prepare('select 1 x from users where id=?').bind(id).first())fail(404,'User not found')}
else{if(!await c.env.DB.prepare('select 1 x from servers where id=?').bind(id).first())fail(404,'Server not found')}
await c.env.DB.prepare('insert into content_reports(id,reporter_id,category,target_type,target_id,server_id,details,created_at) values(?,?,?,?,?,?,?,?)').bind(newId('cr'),c.user.id,b.category,b.type,id,serverId,str(String(b.details||'').trim()||'none',1,1000,'Details'),now()).run()
return{ok:true}
})
r.add('GET','/api/admin/content-reports',async c=>{
guard(c)
const rows=(await c.env.DB.prepare("select c.id,c.category,c.target_type,c.target_id,c.server_id,c.details,c.status,c.decision,c.created_at,u.username reporter,(select author_id from messages where id=c.target_id) msg_author,(select substr(content,1,300) from messages where id=c.target_id and c.target_type='message') excerpt from content_reports c join users u on u.id=c.reporter_id where c.status='open' order by case c.category when 'csam' then 0 when 'illegal' then 1 else 2 end,c.created_at limit 100").all()).results
return{reports:rows}
})
r.add('POST','/api/admin/content-reports/:id',async c=>{
guard(c)
const b=await body(c.req)
const rp=await c.env.DB.prepare("select * from content_reports where id=? and status='open'").bind(c.p.id).first()
if(!rp)fail(404,'Report not found or already closed')
const note=str(String(b.note||'').trim()||'none',1,500,'Note')
const out={removed:0,hashes:0,suspended:false}
if(b.action==='dismiss'){
await c.env.DB.prepare("update content_reports set status='closed',reviewer_id=?,decision=?,resolved_at=? where id=?").bind(c.user.id,'dismissed: '+note,now(),rp.id).run()
return out
}
if(b.action!=='act')fail(400,'Choose act or dismiss')
let author=null
if(rp.target_type==='message'){
const m=await c.env.DB.prepare('select author_id from messages where id=?').bind(rp.target_id).first()
author=m?.author_id||null
const files=(await c.env.DB.prepare('select id,r2_key,sha256 from files where message_id=?').bind(rp.target_id).all()).results
const stmts=[c.env.DB.prepare("update messages set deleted_at=?,content='' where id=?").bind(now(),rp.target_id)]
for(const f of files){
if(f.sha256&&HEX.test(f.sha256)){stmts.push(c.env.DB.prepare('insert or ignore into blocked_hashes(hash,reason,added_by,created_at) values(?,?,?,?)').bind(f.sha256,rp.category+' report '+rp.id,c.user.id,now()));out.hashes++}
stmts.push(c.env.DB.prepare('delete from files where id=?').bind(f.id))
}
await c.env.DB.batch(stmts)
for(const f of files){try{await c.env.FILES.delete(f.r2_key)}catch{}}
out.removed=1
}else if(rp.target_type==='user')author=rp.target_id
if(b.suspend&&author&&author!==c.user.id){
await c.env.DB.batch([c.env.DB.prepare("update users set suspended=1,suspended_until=null,suspend_reason=? where id=?").bind('Removed for '+rp.category+' content',author),c.env.DB.prepare('delete from sessions where user_id=?').bind(author)])
await banUserDevices(c.env,author,'Removed for '+rp.category+' content')
out.suspended=true
}
await c.env.DB.batch([
c.env.DB.prepare("update content_reports set status='closed',reviewer_id=?,decision=?,resolved_at=? where id=?").bind(c.user.id,'actioned: '+note,now(),rp.id),
c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),null,c.user.id,'content.report.act',rp.target_id,(rp.category+' '+note).slice(0,500),now())
])
return out
})
r.add('GET','/api/admin/blocked-hashes',async c=>{
guard(c)
return{hashes:(await c.env.DB.prepare('select hash,reason,created_at from blocked_hashes order by created_at desc limit 200').all()).results}
})
r.add('POST','/api/admin/blocked-hashes',async c=>{
guard(c)
const b=await body(c.req)
const h=String(b.hash||'').trim().toLowerCase()
if(!HEX.test(h))fail(400,'Enter a SHA-256 hash (64 hex characters)')
await c.env.DB.prepare('insert or ignore into blocked_hashes(hash,reason,added_by,created_at) values(?,?,?,?)').bind(h,str(String(b.reason||'manual'),1,200,'Reason'),c.user.id,now()).run()
return{ok:true}
})
r.add('DELETE','/api/admin/blocked-hashes/:hash',async c=>{
guard(c)
await c.env.DB.prepare('delete from blocked_hashes where hash=?').bind(c.p.hash).run()
return{ok:true}
})
}
