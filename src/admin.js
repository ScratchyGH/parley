import{fail,now,newId,str,body,clamp}from'./util.js'
import{invalidateMaintenance}from'./worker.js'

const guard=c=>{if(!c.user.admin)fail(404,'Not found')}
const alog=(c,action,target,detail='')=>c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),null,c.user.id,action,target,String(detail).slice(0,500),now())

export default function(r){
r.add('GET','/api/admin/stats',async c=>{
guard(c)
const q=s=>c.env.DB.prepare(s).first()
const[u,s,m,f,rp,ap,mt,sess]=await Promise.all([
q('select count(*) n from users where deleted_at is null'),
q('select count(*) n from servers'),
q('select count(*) n from messages where deleted_at is null'),
q('select coalesce(sum(size),0) n,count(*) c from files'),
q("select count(*) n from reports where status='open'"),
q("select count(*) n from appeals where status='open'"),
q("select v from app_settings where k='maintenance'"),
q('select count(*) n from sessions where expires_at>'+now())
])
return{users:u.n,servers:s.n,messages:m.n,storage_bytes:f.n,files:f.c,open_reports:rp.n,open_appeals:ap.n,maintenance:mt?.v==='1',sessions:sess.n,
note:'Provider quota usage (D1 rows, requests, R2 operations) is shown in the Cloudflare dashboard; Workers do not expose it to the application.'}
})

r.add('POST','/api/admin/maintenance',async c=>{
guard(c)
const b=await body(c.req)
await c.env.DB.batch([
c.env.DB.prepare("insert into app_settings(k,v) values('maintenance',?) on conflict(k) do update set v=excluded.v").bind(b.on?'1':'0'),
alog(c,b.on?'maintenance.on':'maintenance.off','')
])
invalidateMaintenance()
return{ok:true}
})

r.add('GET','/api/admin/users',async c=>{
guard(c)
const qs=(c.url.searchParams.get('q')||'').trim().slice(0,40)
if(qs.length<2)fail(400,'Enter at least 2 characters')
const rows=(await c.env.DB.prepare("select id,username,display_name,created_at,suspended,deleted_at from users where username like ? escape '\\' order by created_at desc limit 25").bind('%'+qs.replace(/[\\%_]/g,'\\$&')+'%').all()).results
return{users:rows}
})

r.add('POST','/api/admin/users/:id/suspend',async c=>{
guard(c)
const b=await body(c.req)
const t=await c.env.DB.prepare('select id,username from users where id=? and deleted_at is null').bind(c.p.id).first()
if(!t)fail(404,'User not found')
if(t.id===c.user.id)fail(400,'You cannot suspend yourself')
const on=b.suspended?1:0
await c.env.DB.batch([
c.env.DB.prepare('update users set suspended=? where id=?').bind(on,t.id),
...(on?[c.env.DB.prepare('delete from sessions where user_id=?').bind(t.id)]:[]),
alog(c,on?'user.suspend':'user.unsuspend',t.id,str(b.reason||'no reason given',1,300,'Reason'))
])
if(on)c.pubClose('u_'+t.id,{close:[t.id]})
return{ok:true}
})

r.add('GET','/api/admin/reports',async c=>{
guard(c)
const rows=(await c.env.DB.prepare("select r.id,r.target_type,r.target_id,r.server_id,r.reason,r.created_at,u.username reporter from reports r join users u on u.id=r.reporter_id where r.status='open' order by r.created_at desc limit 100").all()).results
return{reports:rows}
})
r.add('POST','/api/admin/reports/:id',async c=>{
guard(c)
await c.env.DB.batch([c.env.DB.prepare("update reports set status='resolved' where id=?").bind(c.p.id),alog(c,'report.resolve',c.p.id)])
return{ok:true}
})

r.add('GET','/api/admin/appeals',async c=>{
guard(c)
const rows=(await c.env.DB.prepare("select a.id,a.user_id,a.message,a.created_at,u.username from appeals a join users u on u.id=a.user_id where a.server_id is null and a.status='open' order by a.created_at desc limit 100").all()).results
return{appeals:rows}
})
r.add('POST','/api/admin/appeals/:id',async c=>{
guard(c)
const b=await body(c.req)
const a=await c.env.DB.prepare("select * from appeals where id=? and server_id is null and status='open'").bind(c.p.id).first()
if(!a)fail(404,'Appeal not found')
const ok=b.accept===true
await c.env.DB.batch([
c.env.DB.prepare('update appeals set status=? where id=?').bind(ok?'accepted':'denied',a.id),
...(ok?[c.env.DB.prepare('update users set suspended=0 where id=?').bind(a.user_id)]:[]),
alog(c,ok?'appeal.accept':'appeal.deny',a.user_id)
])
return{ok:true}
})

r.add('GET','/api/admin/log',async c=>{
guard(c)
const before=clamp(c.url.searchParams.get('before'),9e15,0,9e15)
const rows=(await c.env.DB.prepare('select l.id,l.action,l.target_id,l.detail,l.created_at,u.username actor from mod_log l join users u on u.id=l.actor_id where l.server_id is null and l.created_at<? order by l.created_at desc limit 50').bind(before).all()).results
return{entries:rows}
})
}
