import{fail,now,sha,newId,body,str,limit}from'./util.js'

let bans={at:0,set:new Set()}
const seen=new Map()
export const deviceOf=req=>{
const v=req.headers.get('x-device')||''
return/^[a-f0-9]{24,64}$/.test(v)?v:''
}
async function banned(env,hash){
if(now()-bans.at>30000){
const rows=(await env.DB.prepare('select hash from device_bans').all()).results
bans={at:now(),set:new Set(rows.map(r=>r.hash))}
}
return bans.set.has(hash)
}
export const dropBanCache=()=>{bans.at=0}
export async function checkDevice(env,req,user,path){
const d=deviceOf(req)
if(!d||path==='/api/appeals'||path==='/api/health')return
const hash=await sha('dev:'+d)
if(await banned(env,hash))fail(403,'This device has been banned from Parley. You can appeal at /appeal if your account was suspended.')
if(user&&!user.is_bot){
const k=user.id+hash
if(now()-(seen.get(k)||0)>3600000){
seen.set(k,now())
if(seen.size>5000)seen.clear()
await env.DB.prepare('insert into user_devices(user_id,hash,last_seen) values(?,?,?) on conflict(user_id,hash) do update set last_seen=excluded.last_seen').bind(user.id,hash,now()).run()
}
}
}
export async function banUserDevices(env,userId,reason,t=now()){
const rows=(await env.DB.prepare('select hash from user_devices where user_id=?').bind(userId).all()).results
if(!rows.length)return 0
await env.DB.batch(rows.map(r=>env.DB.prepare('insert or ignore into device_bans(hash,user_id,reason,created_at) values(?,?,?,?)').bind(r.hash,userId,reason,t)))
dropBanCache()
return rows.length
}
export async function unbanUserDevices(env,userId){
await env.DB.prepare('delete from device_bans where user_id=?').bind(userId).run()
dropBanCache()
}
export default function(r){
r.add('POST','/api/client-error',async c=>{
limit('cerr:'+c.user.id,10,3600000)
const b=await body(c.req,3000)
await c.env.DB.prepare('insert into client_errors(id,user_id,msg,src,ua,url,created_at) values(?,?,?,?,?,?,?)').bind(newId('ce'),c.user.id,str(String(b.msg||''),1,400,'Message'),String(b.src||'').slice(0,200),(c.req.headers.get('user-agent')||'').slice(0,160),String(b.url||'').slice(0,160),now()).run()
return{ok:true}
})
r.add('GET','/api/admin/client-errors',async c=>{
if(!c.user.admin)fail(404,'Not found')
const rows=(await c.env.DB.prepare('select e.id,e.msg,e.src,e.ua,e.url,e.created_at,u.username from client_errors e left join users u on u.id=e.user_id order by e.created_at desc limit 100').all()).results
return{errors:rows}
})
r.add('GET','/api/legal',async c=>{
const rows=(await c.env.DB.prepare("select k,v from app_settings where k in ('legal_privacy','legal_tos','legal_report')").all()).results
const o={privacy:'',tos:'',report:''}
for(const x of rows)o[x.k.slice(6)]=x.v
return o
},{auth:false})
r.add('PUT','/api/admin/legal',async c=>{
if(!c.user.admin)fail(404,'Not found')
const b=await body(c.req,60000)
const st=[]
for(const k of['privacy','tos','report'])if(typeof b[k]==='string'){
if(b[k].length>20000)fail(400,k+' text is too long')
st.push(c.env.DB.prepare('insert into app_settings(k,v) values(?,?) on conflict(k) do update set v=excluded.v').bind('legal_'+k,b[k]))
}
if(st.length)await c.env.DB.batch(st)
return{ok:true}
})
}
