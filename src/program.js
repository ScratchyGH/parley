import{fail,now,newId,body,limit,sha}from'./util.js'
import{loadMember,P}from'./perms.js'

const DEF={pct:15,paused:false}
export async function expCfg(env){
const r=await env.DB.prepare("select v from app_settings where k='exp_cfg'").first()
let o={}
try{o=r?JSON.parse(r.v):{}}catch{}
return{pct:Number.isFinite(o.pct)?o.pct:DEF.pct,paused:!!o.paused}
}
export const expActive=(s,cfg)=>!!(s.exp_on&&!s.exp_block&&!cfg.paused)
async function selected(sid,pct){
const h=await sha('exp:'+sid)
return parseInt(h.slice(0,8),16)%10000<pct*100
}
async function load(c,sid){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
return m
}
const guard=c=>{if(!c.user.admin)fail(404,'Not found')}
const alog=(c,a,t,d)=>c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),null,c.user.id,a,t,String(d||'').slice(0,300),now())
export default function(r){
r.add('GET','/api/servers/:sid/program',async c=>{
const m=await load(c,c.p.sid)
const cfg=await expCfg(c.env)
let s=m.server
if(m.owner&&!s.exp_state&&!s.exp_block&&!cfg.paused&&await selected(s.id,cfg.pct)){
const res=await c.env.DB.prepare("update servers set exp_state='offered',exp_at=? where id=? and exp_state is null").bind(now(),s.id).run()
if(res.meta.changes)s={...s,exp_state:'offered'}
}
const out={active:expActive(s,cfg),paused:cfg.paused}
if(m.owner)Object.assign(out,{state:s.exp_state||null,on:!!s.exp_on,blocked:!!s.exp_block,offer:s.exp_state==='offered'&&!s.exp_block&&!cfg.paused})
return out
})
r.add('POST','/api/servers/:sid/program',async c=>{
const m=await load(c,c.p.sid)
if(!m.owner)fail(403,'Only the server owner can change this')
limit('prog:'+c.user.id,30,60000)
const b=await body(c.req,500)
const s=m.server,cfg=await expCfg(c.env)
if(s.exp_block)fail(403,'This server cannot take part in the program right now')
const a=b.action
const set=(state,on)=>c.env.DB.prepare('update servers set exp_state=?,exp_on=?,exp_at=? where id=?').bind(state,on,now(),s.id).run()
if(a==='accept'){
if(s.exp_state!=='offered'||cfg.paused)fail(409,'There is no offer to accept')
await set('accepted',1)
}else if(a==='decline'){
if(s.exp_state!=='offered')fail(409,'There is no offer to decline')
await set('declined',0)
}else if(a==='enable'){
if(s.exp_state!=='accepted'&&s.exp_state!=='disabled')fail(409,'Accept the offer first')
if(cfg.paused)fail(409,'The program is paused')
await set('accepted',1)
}else if(a==='disable'){
if(s.exp_state!=='accepted')fail(409,'This server is not in the program')
await set('disabled',0)
}else fail(400,'Unknown action')
c.pub('s_'+s.id,{t:'server.update',server_id:s.id})
return{ok:true}
})
r.add('POST','/api/servers/:sid/program/feedback',async c=>{
const m=await load(c,c.p.sid)
if(!m.admin&&!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
if(!m.server.exp_on)fail(409,'This server is not in the program')
limit('progf:'+c.user.id,10,3600000)
const b=await body(c.req,4000)
const t=typeof b.text==='string'?b.text.trim():''
if(t.length<5||t.length>1500)fail(400,'Feedback must be 5 to 1500 characters')
await c.env.DB.prepare('insert into program_feedback(id,server_id,user_id,text,created_at) values(?,?,?,?,?)').bind(newId('pf'),m.server.id,c.user.id,t,now()).run()
return{ok:true}
})
r.add('GET','/api/servers/:sid/insights',async c=>{
const m=await load(c,c.p.sid)
if(!m.admin&&!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
const cfg=await expCfg(c.env)
if(!expActive(m.server,cfg))fail(403,'Server insights are part of the Experimental Servers Program')
const sid=m.server.id,since=now()-7*86400000
const[mem,days,top,joins]=await Promise.all([
c.env.DB.prepare('select count(*) n from members where server_id=?').bind(sid).first(),
c.env.DB.prepare("select strftime('%Y-%m-%d',created_at/1000,'unixepoch') d,count(*) n,count(distinct author_id) a from messages where server_id=? and created_at>? and deleted_at is null group by d order by d").bind(sid,since).all(),
c.env.DB.prepare('select c.name,count(*) n from messages m join channels c on c.id=m.room where m.server_id=? and m.created_at>? and m.deleted_at is null group by c.id order by n desc limit 5').bind(sid,since).all(),
c.env.DB.prepare('select count(*) n from members where server_id=? and joined_at>?').bind(sid,since).first()
])
return{members:mem.n,joined_7d:joins.n,days:days.results,top_channels:top.results}
})
r.add('GET','/api/admin/program',async c=>{
guard(c)
const q=s=>c.env.DB.prepare(s).first()
const[a,o,d,x,f]=await Promise.all([q("select count(*) n from servers where exp_on=1 and exp_block=0"),q("select count(*) n from servers where exp_state='offered'"),q("select count(*) n from servers where exp_state='declined'"),q('select count(*) n from servers where exp_block=1'),c.env.DB.prepare('select f.id,f.server_id,f.text,f.created_at,s.name server_name from program_feedback f join servers s on s.id=f.server_id order by f.created_at desc limit 30').all()])
return{cfg:await expCfg(c.env),enrolled:a.n,pending:o.n,declined:d.n,blocked:x.n,feedback:f.results}
})
r.add('PUT','/api/admin/program/config',async c=>{
guard(c)
const b=await body(c.req,500)
const cur=await expCfg(c.env)
if(b.pct!==undefined){const v=Number(b.pct);if(!Number.isFinite(v)||v<0||v>100)fail(400,'Percent must be 0 to 100');cur.pct=v}
if(b.paused!==undefined)cur.paused=!!b.paused
await c.env.DB.batch([c.env.DB.prepare("insert into app_settings(k,v) values('exp_cfg',?) on conflict(k) do update set v=excluded.v").bind(JSON.stringify(cur)),alog(c,'program.config','',JSON.stringify(cur))])
return{cfg:cur}
})
r.add('POST','/api/admin/program/servers/:sid',async c=>{
guard(c)
const b=await body(c.req,500)
const s=await c.env.DB.prepare('select id,exp_state from servers where id=?').bind(c.p.sid).first()
if(!s)fail(404,'Server not found')
const a=b.action
let st
if(a==='offer')st=c.env.DB.prepare("update servers set exp_state='offered',exp_on=0,exp_block=0,exp_at=? where id=?").bind(now(),s.id)
else if(a==='block')st=c.env.DB.prepare("update servers set exp_block=1,exp_on=0 where id=?").bind(s.id)
else if(a==='unblock')st=c.env.DB.prepare('update servers set exp_block=0 where id=?').bind(s.id)
else if(a==='remove')st=c.env.DB.prepare("update servers set exp_state='disabled',exp_on=0 where id=?").bind(s.id)
else fail(400,'Unknown action')
await c.env.DB.batch([st,alog(c,'program.'+a,s.id,'')])
c.pub('s_'+s.id,{t:'server.update',server_id:s.id})
return{ok:true}
})
}
