import{fail,now,newId,str,body,json,limit,randHex,hex,enc}from'./util.js'
import{P,loadMember}from'./perms.js'

export const HOOK_EVENTS=['message.create','member.join']
const MAX=5
const BAD_HOST=/^(localhost|.*\.localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i
export function checkUrl(u){
let x
try{x=new URL(String(u||''))}catch{fail(400,'Enter a full https:// address')}
if(x.protocol!=='https:')fail(400,'Only https:// addresses are allowed')
if(x.username||x.password)fail(400,'The address cannot contain a username or password')
if(x.port&&x.port!=='443')fail(400,'Only the standard https port is allowed')
const h=x.hostname
if(BAD_HOST.test(h)||/^\d+\.\d+\.\d+\.\d+$/.test(h)||h.includes(':')||!h.includes('.'))fail(400,'That address is not allowed. Use a public host name.')
return x.toString().slice(0,300)
}
async function sign(secret,text){
const k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign'])
return hex(await crypto.subtle.sign('HMAC',k,enc.encode(text)))
}
async function deliver(env,hk,event,data,test){
const payload=JSON.stringify({id:newId('ev'),event,time:now(),server_id:hk.server_id,data})
const ts=String(Math.floor(now()/1000))
let status=0
try{
const ctl=new AbortController()
const to=setTimeout(()=>ctl.abort(),5000)
const res=await fetch(hk.url,{method:'POST',redirect:'manual',signal:ctl.signal,headers:{'content-type':'application/json','user-agent':'Parley-Webhooks/1','x-parley-event':event,'x-parley-timestamp':ts,'x-parley-signature':'sha256='+await sign(hk.secret,ts+'.'+payload)},body:payload})
clearTimeout(to)
status=res.status
}catch{status=0}
const okk=status>=200&&status<300
if(!test)await env.DB.prepare('update server_hooks set last_status=?,last_at=?,fails=case when ? then 0 else fails+1 end,enabled=case when ? or fails+1<10 then enabled else 0 end where id=?').bind(status,now(),okk?1:0,okk?1:0,hk.id).run().catch(()=>{})
return{ok:okk,status}
}
export function fireHooks(c,serverId,event,data){
c.ec.waitUntil((async()=>{
const rows=(await c.env.DB.prepare('select * from server_hooks where server_id=? and enabled=1').bind(serverId).all()).results
await Promise.allSettled(rows.filter(r=>r.events.split(',').includes(event)).map(r=>deliver(c.env,r,event,data)))
})().catch(()=>{}))
}
async function mgr(c,sid){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage server permission')
return m
}
export default function(r){
r.add('GET','/api/servers/:sid/hooks',async c=>{
await mgr(c,c.p.sid)
const rows=(await c.env.DB.prepare('select id,url,events,enabled,fails,last_status,last_at,created_at from server_hooks where server_id=? order by created_at').bind(c.p.sid).all()).results
return{hooks:rows.map(x=>({...x,events:x.events.split(',')})),events:HOOK_EVENTS}
})
r.add('POST','/api/servers/:sid/hooks',async c=>{
await mgr(c,c.p.sid)
limit('shook:'+c.user.id,20,3600000)
const b=await body(c.req)
const url=checkUrl(b.url)
const ev=[...new Set(Array.isArray(b.events)?b.events:[])].filter(e=>HOOK_EVENTS.includes(e))
if(!ev.length)fail(400,'Pick at least one event')
const n=await c.env.DB.prepare('select count(*) n from server_hooks where server_id=?').bind(c.p.sid).first()
if(n.n>=MAX)fail(409,`A server can have up to ${MAX} event webhooks`)
const id=newId('sh'),secret='whsec_'+randHex(24)
await c.env.DB.prepare('insert into server_hooks(id,server_id,url,secret,events,created_by,created_at) values(?,?,?,?,?,?,?)').bind(id,c.p.sid,url,secret,ev.join(','),c.user.id,now()).run()
return json({id,url,events:ev,secret},201)
})
r.add('PATCH','/api/servers/:sid/hooks/:hid',async c=>{
await mgr(c,c.p.sid)
const b=await body(c.req)
const h=await c.env.DB.prepare('select * from server_hooks where id=? and server_id=?').bind(c.p.hid,c.p.sid).first()
if(!h)fail(404,'Webhook not found')
const ev=b.events===undefined?h.events:[...new Set(Array.isArray(b.events)?b.events:[])].filter(e=>HOOK_EVENTS.includes(e)).join(',')
if(!ev)fail(400,'Pick at least one event')
const en=b.enabled===undefined?h.enabled:(b.enabled?1:0)
await c.env.DB.prepare('update server_hooks set events=?,enabled=?,fails=case when ?=1 then 0 else fails end where id=?').bind(ev,en,en,h.id).run()
return{ok:true}
})
r.add('DELETE','/api/servers/:sid/hooks/:hid',async c=>{
await mgr(c,c.p.sid)
await c.env.DB.prepare('delete from server_hooks where id=? and server_id=?').bind(c.p.hid,c.p.sid).run()
return{ok:true}
})
r.add('POST','/api/servers/:sid/hooks/:hid/test',async c=>{
await mgr(c,c.p.sid)
limit('shooktest:'+c.user.id,20,3600000)
const h=await c.env.DB.prepare('select * from server_hooks where id=? and server_id=?').bind(c.p.hid,c.p.sid).first()
if(!h)fail(404,'Webhook not found')
return await deliver(c.env,h,'ping',{note:'Test delivery from Parley'},true)
})
}
