import{fail,now,newId,body,limit}from'./util.js'
import{place}from'./store.js'

const SKIP=/^(sqlite_|_cf_|_migrations$|d1_migrations$|blob_chunks$|sessions$|login_attempts$|uploads$)/
const NAME=/^\d{13}\.json\.gz$/
const MAX=48*1024*1024
const q=n=>'"'+n.replace(/"/g,'""')+'"'
const owner=c=>{if(!c.user.owner)fail(404,'Not found');limit('bk:'+c.user.id,30,3600000)}

async function tableNames(env){
return(await env.DB.prepare("select name from sqlite_master where type='table'").all()).results.map(x=>x.name).filter(n=>!SKIP.test(n)).sort()
}
async function order(env,names){
const deps=new Map()
for(const n of names){
const fk=(await env.DB.prepare('pragma foreign_key_list('+q(n)+')').all()).results
deps.set(n,new Set(fk.map(x=>x.table).filter(t=>t!==n&&names.includes(t))))
}
const out=[],done=new Set()
while(out.length<names.length){
let moved=false
for(const n of names){
if(done.has(n))continue
if([...deps.get(n)].every(d=>done.has(d))){out.push(n);done.add(n);moved=true}
}
if(!moved){for(const n of names)if(!done.has(n)){out.push(n);done.add(n)}}
}
return out
}
async function gz(text){
const s=new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
return new Uint8Array(await new Response(s).arrayBuffer())
}
async function gunzip(buf){
const s=new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))
return await new Response(s).text()
}

export async function makeBackup(env){
const names=await order(env,await tableNames(env))
const parts=[],t=now()
let size=0
parts.push(JSON.stringify({parley_backup:1,created_at:t,tables:names})+'\n')
for(const n of names){
const cols=(await env.DB.prepare('pragma table_info('+q(n)+')').all()).results.map(x=>x.name)
const info=(await env.DB.prepare('pragma table_info('+q(n)+')').all()).results
const pk=info.filter(x=>x.pk>0).sort((a,b)=>a.pk-b.pk).map(x=>q(x.name))
const ord=pk.length?pk.join(','):'rowid'
let off=0,count=0
for(;;){
const rows=(await env.DB.prepare('select * from '+q(n)+(n==='files'?" where kind!='backup'":'')+' order by '+ord+' limit 500 offset ?').bind(off).all()).results
if(!rows.length)break
for(const row of rows){
const line=JSON.stringify({t:n,r:cols.map(k=>row[k])})+'\n'
size+=line.length
if(size>MAX)throw new Error('The database is too large for a single backup file')
parts.push(line)
count++
}
off+=rows.length
if(rows.length<500)break
}
parts.push(JSON.stringify({end:n,cols,count})+'\n')
}
const buf=await gz(parts.join(''))
const id=newId('bk'),name=t+'.json.gz'
const key=place(env,'backups/'+id,buf.byteLength)
await env.FILES.put(key,buf,{httpMetadata:{contentType:'application/gzip'}})
await env.DB.prepare('insert into files(id,owner_id,kind,r2_key,name,mime,size,created_at) values(?,?,?,?,?,?,?,?)').bind(id,'system','backup',key,name,'application/gzip',buf.byteLength,t).run()
return{id,name,size:buf.byteLength,created_at:t,tables:names.length}
}
const rows=env=>env.DB.prepare("select id,r2_key,name,size,created_at from files where kind='backup' order by created_at desc").all().then(x=>x.results)
export async function pruneBackups(env,keep=7){
for(const o of(await rows(env)).slice(keep)){
try{await env.FILES.delete(o.r2_key)}catch{}
await env.DB.prepare('delete from files where id=?').bind(o.id).run()
}
}
export async function dailyBackup(env){
await makeBackup(env)
await pruneBackups(env,7)
}
const one=async(env,name)=>{
if(!NAME.test(name))fail(404,'Not found')
const o=await env.DB.prepare("select id,r2_key,name,size from files where kind='backup' and name=?").bind(name).first()
if(!o)fail(404,'Backup not found')
return o
}
const read=async(env,o)=>{
const f=await env.FILES.get(o.r2_key,{size:o.size})
if(!f)fail(404,'The backup file is missing from storage')
return f
}

async function restore(env,buf){
let text
try{text=await gunzip(buf)}catch{fail(400,'This is not a Parley backup file')}
const lines=text.split('\n').filter(Boolean)
let head
try{head=JSON.parse(lines[0])}catch{fail(400,'This is not a Parley backup file')}
if(head.parley_backup!==1)fail(400,'This is not a Parley backup file')
const live=new Set(await tableNames(env))
const meta=new Map()
for(const l of lines){
if(l.charCodeAt(2)!==101)continue
try{const o=JSON.parse(l);if(o.end)meta.set(o.end,o.cols)}catch{}
}
const colsOf=new Map()
for(const n of live)colsOf.set(n,new Set((await env.DB.prepare('pragma table_info('+q(n)+')').all()).results.map(x=>x.name)))
const stmts=[],report={}
for(const l of lines){
let o;try{o=JSON.parse(l)}catch{continue}
if(!o.t||!o.r)continue
if(!live.has(o.t)){report[o.t]=report[o.t]||{skipped:true,added:0};continue}
const cols=meta.get(o.t)
if(!cols||cols.length!==o.r.length)continue
const use=[],vals=[]
cols.forEach((k,i)=>{if(colsOf.get(o.t).has(k)){use.push(q(k));vals.push(o.r[i])}})
if(!use.length)continue
stmts.push({t:o.t,s:env.DB.prepare('insert or ignore into '+q(o.t)+'('+use.join(',')+') values('+use.map(()=>'?').join(',')+')').bind(...vals)})
}
let added=0
for(let i=0;i<stmts.length;i+=80){
const chunk=stmts.slice(i,i+80)
const res=await env.DB.batch([env.DB.prepare('pragma defer_foreign_keys=on'),...chunk.map(x=>x.s)])
chunk.forEach((x,j)=>{const ch=res[j+1].meta?.changes||0;added+=ch;report[x.t]=report[x.t]||{added:0};report[x.t].added+=ch})
}
return{added,tables:Object.entries(report).filter(([,v])=>v.added||v.skipped).map(([name,v])=>({name,added:v.added,skipped:!!v.skipped}))}
}

export default function(r){
r.add('GET','/api/admin/backups',async c=>{
owner(c)
return{backups:(await rows(c.env)).map(o=>({name:o.name,size:o.size,created_at:o.created_at})),keep:7}
})
r.add('POST','/api/admin/backups',async c=>{
owner(c)
let res
try{res=await makeBackup(c.env)}catch(e){fail(500,String(e.message||'Backup failed'))}
await pruneBackups(c.env,7)
await c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),null,c.user.id,'backup.create',res.id,res.size+' bytes',now()).run()
return{ok:true,name:res.name,size:res.size}
})
r.add('GET','/api/admin/backups/:name',async c=>{
owner(c)
const f=await read(c.env,await one(c.env,c.p.name))
return new Response(f.body,{headers:{'content-type':'application/gzip','content-disposition':'attachment; filename="parley-backup-'+c.p.name+'"','cache-control':'no-store','x-content-type-options':'nosniff'}})
})
r.add('DELETE','/api/admin/backups/:name',async c=>{
owner(c)
const o=await one(c.env,c.p.name)
try{await c.env.FILES.delete(o.r2_key)}catch{}
await c.env.DB.prepare('delete from files where id=?').bind(o.id).run()
return{ok:true}
})
r.add('POST','/api/admin/backups/:name/restore',async c=>{
owner(c)
const o=await one(c.env,c.p.name)
const b=await body(c.req,2000)
if(b.confirm!==true)fail(400,'Confirm the restore first')
const f=await read(c.env,o)
const res=await restore(c.env,await f.arrayBuffer())
await c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),null,c.user.id,'backup.restore',o.id,res.added+' rows restored',now()).run()
return{ok:true,...res}
})
}
