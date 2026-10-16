import{fail,now,newId,str,body,clamp,limit,json}from'./util.js'
import{invalidateMaintenance}from'./worker.js'

const guard=c=>{if(!c.user.admin)fail(404,'Not found')}
const ownerOnly=c=>{if(!c.user.owner)fail(404,'Not found');limit('dbadm:'+c.user.id,240,60000)}
const SECRET=/pass_|hash|secret|token|totp|backup|private|vapid|p256dh|credential|public_key|auth_key|salt/i
const isSecret=n=>SECRET.test(n)
const q=n=>'"'+n.replace(/"/g,'""')+'"'
const SKIP=/^(sqlite_|_cf_|_migrations$|d1_migrations$|blob_chunks$)/
const alog=(c,action,target,detail='')=>c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),null,c.user.id,action,target,String(detail).slice(0,500),now())

export default function(r){
dbRoutes(r)
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

r.add('POST','/api/admin/studio',async c=>{
guard(c)
limit('studio:'+c.user.id,6,60000)
const b=await body(c.req)
const prompt=str(b.prompt,10,12000,'Brief')
const msgs=[{role:'system',content:'You reply with one valid JSON object only. No markdown, no commentary.'},{role:'user',content:prompt}]
const key=c.env.OPENROUTER_API_KEY
let res
try{res=key?await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+key,'x-title':'Parley'},body:JSON.stringify({model:c.env.OPENROUTER_MODEL||'openrouter/free',messages:msgs}),signal:AbortSignal.timeout(90000)}):await fetch('https://text.pollinations.ai/openai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:'openai',messages:msgs}),signal:AbortSignal.timeout(90000)})}catch{fail(502,'The AI service did not answer. Try again')}
if(!res.ok){const t=(await res.text().catch(()=>'')).slice(0,300);fail(502,(key?'OpenRouter ':'Pollinations ')+res.status+': '+t)}
const j=await res.json().catch(()=>null)
const text=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content
if(typeof text!=='string'||!text)fail(502,'The AI service returned nothing. Try again')
return{text,via:key?'openrouter':'pollinations'}
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
const rows=(await c.env.DB.prepare("select id,username,display_name,created_at,suspended,deleted_at,labs from users where username like ? escape '\\' order by created_at desc limit 25").bind('%'+qs.replace(/[\\%_]/g,'\\$&')+'%').all()).results
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

async function tables(c){
const rows=(await c.env.DB.prepare("select name from sqlite_master where type='table' order by name").all()).results.map(r=>r.name).filter(n=>!SKIP.test(n))
return rows
}
async function tableInfo(c,name){
const list=await tables(c)
if(!list.includes(name))fail(404,'Table not found')
const cols=(await c.env.DB.prepare('select name,type,pk,"notnull" nn from pragma_table_info(?)').bind(name).all()).results
return{cols,pk:cols.filter(x=>x.pk>0).sort((a,b)=>a.pk-b.pk).map(x=>x.name)}
}
const scalar=v=>v===null||typeof v==='string'||(typeof v==='number'&&Number.isFinite(v))
const where=(info,key)=>{
if(!key||typeof key!=='object')fail(400,'Row key is missing')
const names=info.pk.length?info.pk:['rowid']
for(const n of names)if(!(n in key)||!scalar(key[n])||key[n]===null)fail(400,'Row key is incomplete')
return{sql:names.map(n=>(n==='rowid'?'rowid':q(n))+'=?').join(' and '),args:names.map(n=>key[n])}
}
const mask=(info,row)=>{
for(const k of Object.keys(row))if(isSecret(k)&&row[k]!==null&&row[k]!=='')row[k]='••••'
return row
}

export function dbRoutes(r){
const alog2=(c,action,target,detail)=>alog(c,action,target,detail)
r.add('GET','/api/admin/db/tables',async c=>{
ownerOnly(c)
const list=await tables(c)
const counts=await c.env.DB.batch(list.map(n=>c.env.DB.prepare('select count(*) n from '+q(n))))
return{tables:list.map((n,i)=>({name:n,rows:counts[i].results[0].n}))}
})

r.add('GET','/api/admin/db/rows',async c=>{
ownerOnly(c)
const name=c.url.searchParams.get('table')||''
const info=await tableInfo(c,name)
const limit_=clamp(c.url.searchParams.get('limit'),50,1,200)
const offset=clamp(c.url.searchParams.get('offset'),0,0,1e9)
const find=(c.url.searchParams.get('q')||'').trim().slice(0,80)
const searchable=info.cols.filter(x=>!isSecret(x.name))
let w='',args=[]
if(find){
w=' where '+searchable.map(x=>'cast('+q(x.name)+' as text) like ? escape \'\\\'').join(' or ')
args=searchable.map(()=>'%'+find.replace(/[\\%_]/g,'\\$&')+'%')
}
const useRowid=!info.pk.length
const rows=(await c.env.DB.prepare('select '+(useRowid?'rowid as _rowid,':'')+'* from '+q(name)+w+' order by '+(useRowid?'rowid':info.pk.map(q).join(','))+' desc limit ? offset ?').bind(...args,limit_+1,offset).all()).results
const more=rows.length>limit_
const out=rows.slice(0,limit_).map(row=>{
const key={}
if(useRowid){key.rowid=row._rowid;delete row._rowid}else for(const n of info.pk)key[n]=row[n]
return{key,values:mask(info,row)}
})
return{columns:info.cols.map(x=>({name:x.name,type:x.type,pk:x.pk>0,secret:isSecret(x.name)})),rows:out,more}
})

r.add('POST','/api/admin/db/update',async c=>{
ownerOnly(c)
const b=await body(c.req,40000)
const info=await tableInfo(c,String(b.table||''))
const w=where(info,b.key)
const names=Object.keys(b.set||{})
if(!names.length)fail(400,'Nothing to change')
for(const n of names){
if(!info.cols.some(x=>x.name===n))fail(400,'Unknown column '+n)
if(isSecret(n))fail(400,'Secret columns cannot be edited here')
if(!scalar(b.set[n]))fail(400,'Values must be text, numbers or null')
}
const res=await c.env.DB.prepare('update '+q(b.table)+' set '+names.map(n=>q(n)+'=?').join(',')+' where '+w.sql).bind(...names.map(n=>b.set[n]),...w.args).run()
if(!res.meta.changes)fail(404,'Row not found')
await alog2(c,'db.update',b.table,JSON.stringify(w.args)+' '+names.join(',')).run()
return{ok:true}
})

r.add('POST','/api/admin/db/insert',async c=>{
ownerOnly(c)
const b=await body(c.req,40000)
const info=await tableInfo(c,String(b.table||''))
const names=Object.keys(b.values||{})
if(!names.length)fail(400,'Add at least one value')
for(const n of names){
if(!info.cols.some(x=>x.name===n))fail(400,'Unknown column '+n)
if(isSecret(n))fail(400,'Secret columns cannot be set here')
if(!scalar(b.values[n]))fail(400,'Values must be text, numbers or null')
}
await c.env.DB.prepare('insert into '+q(b.table)+'('+names.map(q).join(',')+') values('+names.map(()=>'?').join(',')+')').bind(...names.map(n=>b.values[n])).run()
await alog2(c,'db.insert',b.table,names.join(',')).run()
return json({ok:true},201)
})

r.add('POST','/api/admin/db/delete',async c=>{
ownerOnly(c)
const b=await body(c.req,4000)
if(b.confirm!==true)fail(400,'Confirm the delete')
const info=await tableInfo(c,String(b.table||''))
const w=where(info,b.key)
const res=await c.env.DB.prepare('delete from '+q(b.table)+' where '+w.sql).bind(...w.args).run()
if(!res.meta.changes)fail(404,'Row not found')
await alog2(c,'db.delete',b.table,JSON.stringify(w.args)).run()
return{ok:true}
})

r.add('POST','/api/admin/db/sql',async c=>{
ownerOnly(c)
const b=await body(c.req,20000)
let sql=String(b.sql||'').trim().replace(/;+\s*$/,'')
if(!sql)fail(400,'Type a statement')
if(sql.includes(';'))fail(400,'Run one statement at a time')
const verb=(sql.match(/^[a-z]+/i)||[''])[0].toLowerCase()
if(!['select','with','explain','insert','update','delete','replace'].includes(verb))fail(400,'Only select, insert, update and delete are allowed. Schema changes go through migrations.')
if(/\b(attach|detach|pragma|vacuum|load_extension|sqlite_master|sqlite_schema)\b/i.test(sql))fail(400,'That statement is not allowed')
if(SECRET.test(sql))fail(400,'That statement mentions a secret column')
const read=['select','with','explain'].includes(verb)
if(!read&&b.confirm!==true)fail(400,'Confirm this change')
if(read){
const res=await c.env.DB.prepare(sql).all()
const rows=res.results.slice(0,200)
return{columns:rows.length?Object.keys(rows[0]):[],rows,truncated:res.results.length>200}
}
const res=await c.env.DB.prepare(sql).run()
await alog2(c,'db.sql',verb,sql.slice(0,400)).run()
return{changes:res.meta.changes||0}
})
}
