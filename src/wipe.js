const UCOLS=new Set(['user_id','bot_id','bot_user_id','author_id','from_user','to_user','requester','uid'])
const SKIP=new Set(['users','servers','channels','categories','roles','threads'])
let cols=null
async function schema(env){
if(cols)return cols
const m=new Map()
const rows=(await env.DB.prepare("select m.name t,p.name c from sqlite_master m join pragma_table_info(m.name) p where m.type='table' and m.name not like 'sqlite\\_%' escape '\\' and m.name not like '\\_%' escape '\\'").all()).results
for(const r of rows){if(!m.has(r.t))m.set(r.t,[]);m.get(r.t).push(r.c)}
cols=m
return m
}
async function dropFiles(env,where,args){
const fs=(await env.DB.prepare('select id,r2_key from files where '+where+' limit 500').bind(...args).all()).results
for(const f of fs){try{await env.FILES.delete(f.r2_key)}catch{}}
if(fs.length)await env.DB.prepare('delete from files where id in ('+fs.map(()=>'?').join(',')+')').bind(...fs.map(f=>f.id)).run()
return fs.length
}
export async function wipeUser(env,uid){
const sc=await schema(env)
for(let i=0;i<20;i++)if(!(await dropFiles(env,'owner_id=?',[uid])))break
const mt=sc.get('messages')?'(select id from messages where author_id=?)':null
const st=[]
if(mt)for(const[t,cs]of sc){if(t==='messages'||SKIP.has(t))continue;if(cs.includes('message_id'))st.push(env.DB.prepare(`delete from ${t} where message_id in ${mt}`).bind(uid))}
for(const[t,cs]of sc){
if(SKIP.has(t))continue
const w=cs.filter(c=>UCOLS.has(c))
if(!w.length)continue
st.push(env.DB.prepare(`delete from ${t} where ${w.map(c=>c+'=?').join(' or ')}`).bind(...w.map(()=>uid)))
}
st.push(env.DB.prepare('delete from app_settings where k like ?').bind('%:'+uid+'%'))
st.push(env.DB.prepare('delete from users where id=?').bind(uid))
for(let i=0;i<st.length;i+=40){try{await env.DB.batch(st.slice(i,i+40))}catch{for(const s of st.slice(i,i+40)){try{await s.run()}catch{}}}}
}
export async function sweepGone(env,t){
const D=86400000
const us=(await env.DB.prepare('select id from users where deleted_at is not null and deleted_at<? limit 25').bind(t-D).all()).results
for(const u of us)await wipeUser(env,u.id)
const sc=await schema(env)
for(let k=0;k<5;k++){
const ms=(await env.DB.prepare('select id from messages where deleted_at is not null and pinned=0 and deleted_at<? limit 200').bind(t-D).all()).results.map(x=>x.id)
if(!ms.length)break
const q='('+ms.map(()=>'?').join(',')+')'
const fs=(await env.DB.prepare('select id,r2_key from files where message_id in '+q).bind(...ms).all()).results
for(const f of fs){try{await env.FILES.delete(f.r2_key)}catch{}}
const st=[]
for(const[tb,cs]of sc){if(tb==='messages'||tb==='files'||SKIP.has(tb))continue;if(cs.includes('message_id'))st.push(env.DB.prepare(`delete from ${tb} where message_id in ${q}`).bind(...ms))}
st.push(env.DB.prepare('delete from files where message_id in '+q).bind(...ms),env.DB.prepare('delete from messages where id in '+q).bind(...ms))
for(const s of st){try{await s.run()}catch{}}
}
}
