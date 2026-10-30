import{fail,now,newId,randHex,sha,pbkdf2,safeEq,str,int,limit,body}from'./util.js'
const SQL=[
'create table if not exists kp_parents(id text primary key,username text not null,pass_hash text not null,pass_salt text not null,rec_hash text not null,created_at integer not null)',
'create unique index if not exists kp_parents_u on kp_parents(lower(username))',
'create table if not exists kp_psess(hash text primary key,parent_id text not null,exp integer not null)',
'create table if not exists kp_devices(id text primary key,pair text not null,pub text not null,parent_id text,child_id text,label text not null default \'\',status text not null,created_at integer not null,last_seen integer not null,paired_exp integer not null)',
'create unique index if not exists kp_devices_pair on kp_devices(pair)',
'create index if not exists kp_devices_parent on kp_devices(parent_id)',
'create table if not exists kp_codes(id text primary key,parent_id text not null,device_id text not null,child_id text,code_hash text not null,exp integer not null,used_at integer,revoked integer not null default 0,tries integer not null default 0,created_at integer not null)',
'create index if not exists kp_codes_dev on kp_codes(device_id)',
'create table if not exists kp_children(id text primary key,parent_id text not null,username text not null,display_name text not null,avatar text not null,status text not null,consent_at integer,created_at integer not null)',
'create unique index if not exists kp_children_u on kp_children(lower(username))',
'create index if not exists kp_children_parent on kp_children(parent_id)',
'create table if not exists kp_ksess(hash text primary key,device_id text not null,exp integer not null)',
'create table if not exists kp_chal(device_id text primary key,nonce text not null,exp integer not null)',
'create table if not exists kp_log(id text primary key,parent_id text not null,kind text not null,detail text not null,at integer not null)',
'create index if not exists kp_log_p on kp_log(parent_id,at)'
]
let ready=null
const ensure=env=>{
if(!ready)ready=env.DB.batch(SQL.map(s=>env.DB.prepare(s))).catch(e=>{ready=null;throw e})
return ready
}
const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const pick=n=>{const b=crypto.getRandomValues(new Uint8Array(n));let s='';for(const x of b)s+=AL[x%32];return s}
const ip=c=>c.req.headers.get('cf-connecting-ip')||'local'
const b64=s=>{const t=s.replace(/-/g,'+').replace(/_/g,'/');const r=atob(t+'==='.slice((t.length+3)%4));const o=new Uint8Array(r.length);for(let i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o}
const AV=['fox','owl','cat','bear','frog','panda','whale','bunny']
const UN=/^[a-z0-9_]{3,16}$/i
const PITER=100000
const TTL=7*86400000
const logp=(env,pid,kind,detail)=>env.DB.prepare('insert into kp_log(id,parent_id,kind,detail,at) values(?,?,?,?,?)').bind(newId('kl'),pid,kind,String(detail).slice(0,200),now())
const bearer=c=>{const m=(c.req.headers.get('authorization')||'').match(/^Bearer ([a-z0-9_]{20,80})$/);return m?m[1]:null}
async function parentOf(c){
await ensure(c.env)
const t=bearer(c)
if(!t||!t.startsWith('pt_'))fail(401,'Sign in to PK Connect')
const h=await sha(t)
const r=await c.env.DB.prepare('select p.id,p.username from kp_psess s join kp_parents p on p.id=s.parent_id where s.hash=? and s.exp>?').bind(h,now()).first()
if(!r)fail(401,'Sign in to PK Connect')
limit('kpp:'+r.id,300,60000)
return r
}
async function deviceOf(c,needChild){
await ensure(c.env)
const t=bearer(c)
if(!t||!t.startsWith('kt_'))fail(401,'This device is not signed in')
const h=await sha(t)
const r=await c.env.DB.prepare('select d.id,d.status,d.parent_id,d.child_id,d.label from kp_ksess s join kp_devices d on d.id=s.device_id where s.hash=? and s.exp>?').bind(h,now()).first()
if(!r)fail(401,'This device is not signed in')
if(r.status!=='active'){await c.env.DB.prepare('delete from kp_ksess where hash=?').bind(h).run();fail(403,'This device is not authorized')}
limit('kpk:'+r.id,300,60000)
await c.env.DB.prepare('update kp_devices set last_seen=? where id=? and last_seen<?').bind(now(),r.id,now()-60000).run()
return r
}
async function verify(pubJson,msg,sig){
try{
const k=await crypto.subtle.importKey('jwk',JSON.parse(pubJson),{name:'ECDSA',namedCurve:'P-256'},false,['verify'])
return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,b64(sig),new TextEncoder().encode(msg))
}catch{return false}
}
async function takeNonce(env,id){
const r=await env.DB.prepare('delete from kp_chal where device_id=? returning nonce,exp').bind(id).first()
return r&&r.exp>now()?r.nonce:null
}
async function session(env,deviceId){
const t='kt_'+randHex(24)
await env.DB.batch([
env.DB.prepare('delete from kp_ksess where device_id=? and exp<?').bind(deviceId,now()),
env.DB.prepare('insert into kp_ksess(hash,device_id,exp) values(?,?,?)').bind(await sha(t),deviceId,now()+TTL)
])
return t
}
const childOut=r=>r?{id:r.id,username:r.username,display_name:r.display_name,avatar:r.avatar,status:r.status}:null
async function nameCheck(env,username,excludeId){
if(!UN.test(username))fail(400,'Usernames use 3 to 16 letters, numbers or underscores')
const bad=/(fuck|shit|bitch|cunt|dick|cock|pussy|nigg|fag|rape|porn|sex|nazi|kill|die|suicide|hate)/i
if(bad.test(username.replace(/[_0-9]/g,'')))fail(400,'Choose a friendlier username')
const x=await env.DB.prepare('select id from kp_children where lower(username)=lower(?)').bind(username).first()
if(x&&x.id!==excludeId)fail(409,'That username is taken')
}
const dispOk=(v)=>{
const t=str(v,1,20,'Display name')
if(!/^[\p{L}\p{N} ._-]+$/u.test(t))fail(400,'Display names use letters, numbers and spaces')
return t
}
export default function(r){
const P=(m,p,h)=>r.add(m,p,h,{auth:false})
P('POST','/api/kids/device',async c=>{
await ensure(c.env)
limit('kpd:'+ip(c),10,3600000)
const b=await body(c.req,2000)
const pub=b.pub
if(!pub||pub.kty!=='EC'||pub.crv!=='P-256'||typeof pub.x!=='string'||typeof pub.y!=='string')fail(400,'Invalid device key')
const jwk=JSON.stringify({kty:'EC',crv:'P-256',x:pub.x,y:pub.y})
const id=newId('dv'),t=now()
for(let i=0;i<5;i++){
const pair=pick(8)
try{
await c.env.DB.prepare('insert into kp_devices(id,pair,pub,status,created_at,last_seen,paired_exp) values(?,?,?,?,?,?,?)').bind(id,pair,jwk,'new',t,t,t+30*60000).run()
return{id,pair:pair.slice(0,4)+'-'+pair.slice(4)}
}catch(e){if(i===4)throw e}
}
})
P('POST','/api/kids/device/challenge',async c=>{
await ensure(c.env)
limit('kpc:'+ip(c),60,60000)
const b=await body(c.req,500)
const id=String(b.id||'')
const d=await c.env.DB.prepare('select id from kp_devices where id=?').bind(id).first()
if(!d)fail(404,'Unknown device')
const nonce=randHex(16)
await c.env.DB.prepare('insert or replace into kp_chal(device_id,nonce,exp) values(?,?,?)').bind(id,nonce,now()+60000).run()
return{nonce}
})
P('POST','/api/kids/device/status',async c=>{
await ensure(c.env)
limit('kps:'+ip(c),120,60000)
const b=await body(c.req,500)
const d=await c.env.DB.prepare('select status,parent_id,paired_exp from kp_devices where id=?').bind(String(b.id||'')).first()
if(!d)return{status:'unknown'}
if(d.status==='new'&&d.paired_exp<now())return{status:'expired'}
return{status:d.status,paired:!!d.parent_id}
})
P('POST','/api/kids/device/activate',async c=>{
await ensure(c.env)
limit('kpa:'+ip(c),20,600000)
const b=await body(c.req,1500)
const id=String(b.id||''),code=String(b.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12),sig=String(b.sig||'')
const d=await c.env.DB.prepare('select * from kp_devices where id=?').bind(id).first()
if(!d)fail(404,'Unknown device')
limit('kpa:'+id,10,600000)
const nonce=await takeNonce(c.env,id)
if(!nonce)fail(400,'Try again')
if(!await verify(d.pub,'parley-kids|activate|'+id+'|'+nonce+'|'+code,sig)){
if(d.parent_id)await logp(c.env,d.parent_id,'fail','A device failed to prove its identity during activation').run()
fail(403,'This device could not be verified')
}
if(d.status!=='paired')fail(403,d.status==='revoked'?'This device was removed by a parent':'Ask a parent to add this device in PK Connect first')
const cd=await c.env.DB.prepare('select * from kp_codes where device_id=? and used_at is null and revoked=0 and exp>? order by created_at desc limit 1').bind(id,now()).first()
if(!cd)fail(403,'That code is not valid. Ask a parent for a new one.')
if(cd.tries>=5){await c.env.DB.prepare('update kp_codes set revoked=1 where id=?').bind(cd.id).run();fail(429,'Too many wrong tries. Ask a parent for a new code.')}
const hh=await sha(id+'|'+code+'|'+cd.id)
if(!safeEq(hh,cd.code_hash)){
await c.env.DB.prepare('update kp_codes set tries=tries+1 where id=?').bind(cd.id).run()
await logp(c.env,d.parent_id,'fail','A wrong activation code was entered on '+(d.label||'a device')).run()
fail(403,'That code is not right')
}
const t=now()
const u=await c.env.DB.prepare('update kp_codes set used_at=? where id=? and used_at is null and revoked=0 returning id').bind(t,cd.id).first()
if(!u)fail(403,'That code is not valid')
await c.env.DB.batch([
c.env.DB.prepare('update kp_devices set status=\'active\',child_id=? where id=?').bind(cd.child_id,id),
logp(c.env,d.parent_id,'device','Device activated: '+(d.label||'device'))
])
return{token:await session(c.env,id),child:cd.child_id?true:false}
})
P('POST','/api/kids/device/login',async c=>{
await ensure(c.env)
limit('kpl:'+ip(c),60,600000)
const b=await body(c.req,1000)
const id=String(b.id||'')
const d=await c.env.DB.prepare('select * from kp_devices where id=?').bind(id).first()
if(!d)fail(404,'Unknown device')
const nonce=await takeNonce(c.env,id)
if(!nonce)fail(400,'Try again')
if(!await verify(d.pub,'parley-kids|login|'+id+'|'+nonce,String(b.sig||''))){
if(d.parent_id)await logp(c.env,d.parent_id,'fail','A device failed to prove its identity when signing in').run()
fail(403,'This device could not be verified')
}
if(d.status!=='active')fail(403,d.status==='revoked'?'This device was removed by a parent':'This device is not authorized')
return{token:await session(c.env,id)}
})
P('GET','/api/kids/me',async c=>{
const d=await deviceOf(c)
const ch=d.child_id?await c.env.DB.prepare('select * from kp_children where id=?').bind(d.child_id).first():null
return{device:{id:d.id,label:d.label},child:childOut(ch)}
})
P('POST','/api/kids/account',async c=>{
const d=await deviceOf(c)
limit('kpn:'+d.id,10,600000)
if(d.child_id){
const ex=await c.env.DB.prepare('select * from kp_children where id=?').bind(d.child_id).first()
if(ex&&ex.status!=='rejected')fail(409,'This device already has an account')
if(ex)await c.env.DB.prepare('delete from kp_children where id=?').bind(ex.id).run()
}
const b=await body(c.req,800)
const username=str(b.username,3,16,'Username'),dn=dispOk(b.display_name)
const av=AV.includes(b.avatar)?b.avatar:fail(400,'Pick an avatar')
await nameCheck(c.env,username)
const id=newId('kc'),t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into kp_children(id,parent_id,username,display_name,avatar,status,created_at) values(?,?,?,?,?,?,?)').bind(id,d.parent_id,username,dn,av,'pending',t),
c.env.DB.prepare('update kp_devices set child_id=? where id=?').bind(id,d.id),
logp(c.env,d.parent_id,'child','New account waiting for your approval: '+username)
])
return{ok:true}
})
P('POST','/api/connect/signup',async c=>{
await ensure(c.env)
limit('kps2:'+ip(c),5,3600000)
const b=await body(c.req,600)
const username=str(b.username,3,24,'Username'),pw=str(b.password,10,100,'Password')
if(!/^[a-zA-Z0-9_.-]+$/.test(username))fail(400,'Usernames use letters, numbers and . _ -')
if(!b.terms)fail(400,'Confirm that you are a parent or legal guardian')
const salt=randHex(16),rec=pick(16)
const id=newId('kp')
try{
await c.env.DB.prepare('insert into kp_parents(id,username,pass_hash,pass_salt,rec_hash,created_at) values(?,?,?,?,?,?)').bind(id,username,await pbkdf2(pw,salt,PITER),salt,await sha(rec),now()).run()
}catch{fail(409,'That username is taken')}
const t='pt_'+randHex(24)
await c.env.DB.prepare('insert into kp_psess(hash,parent_id,exp) values(?,?,?)').bind(await sha(t),id,now()+TTL).run()
return{token:t,recovery:rec.slice(0,4)+'-'+rec.slice(4,8)+'-'+rec.slice(8,12)+'-'+rec.slice(12)}
})
P('POST','/api/connect/login',async c=>{
await ensure(c.env)
limit('kpg:'+ip(c),20,600000)
const b=await body(c.req,600)
const u=String(b.username||''),pw=String(b.password||'')
limit('kpg:'+u.toLowerCase(),10,600000)
const p=await c.env.DB.prepare('select * from kp_parents where lower(username)=lower(?)').bind(u).first()
const salt=p?p.pass_salt:randHex(16)
const h=await pbkdf2(pw,salt,PITER)
if(!p||!safeEq(h,p.pass_hash))fail(401,'Wrong username or password')
const t='pt_'+randHex(24)
await c.env.DB.batch([
c.env.DB.prepare('delete from kp_psess where parent_id=? and exp<?').bind(p.id,now()),
c.env.DB.prepare('insert into kp_psess(hash,parent_id,exp) values(?,?,?)').bind(await sha(t),p.id,now()+TTL)
])
return{token:t}
})
P('POST','/api/connect/recover',async c=>{
await ensure(c.env)
limit('kpr:'+ip(c),5,3600000)
const b=await body(c.req,600)
const pw=str(b.password,10,100,'Password')
const rc=String(b.recovery||'').toUpperCase().replace(/[^A-Z0-9]/g,'')
const p=await c.env.DB.prepare('select * from kp_parents where lower(username)=lower(?)').bind(String(b.username||'')).first()
if(!p||!safeEq(await sha(rc),p.rec_hash))fail(403,'That recovery code did not match')
const salt=randHex(16),rec=pick(16)
await c.env.DB.batch([
c.env.DB.prepare('update kp_parents set pass_hash=?,pass_salt=?,rec_hash=? where id=?').bind(await pbkdf2(pw,salt,PITER),salt,await sha(rec),p.id),
c.env.DB.prepare('delete from kp_psess where parent_id=?').bind(p.id),
logp(c.env,p.id,'security','Password was reset with the recovery code')
])
return{ok:true,recovery:rec.slice(0,4)+'-'+rec.slice(4,8)+'-'+rec.slice(8,12)+'-'+rec.slice(12)}
})
P('POST','/api/connect/logout',async c=>{
const p=await parentOf(c)
await c.env.DB.prepare('delete from kp_psess where hash=?').bind(await sha(bearer(c))).run()
return{ok:true}
})
P('GET','/api/connect/overview',async c=>{
const p=await parentOf(c)
const db=c.env.DB
const[ch,dv,lg,cd]=await Promise.all([
db.prepare('select * from kp_children where parent_id=? order by created_at').bind(p.id).all(),
db.prepare('select id,label,status,child_id,created_at,last_seen from kp_devices where parent_id=? order by created_at desc').bind(p.id).all(),
db.prepare('select kind,detail,at from kp_log where parent_id=? order by at desc limit 40').bind(p.id).all(),
db.prepare('select id,device_id,exp,tries from kp_codes where parent_id=? and used_at is null and revoked=0 and exp>?').bind(p.id,now()).all()
])
return{parent:{username:p.username},children:ch.results.map(childOut),devices:dv.results,log:lg.results,codes:cd.results}
})
P('POST','/api/connect/devices/claim',async c=>{
const p=await parentOf(c)
limit('kpq:'+p.id,10,600000)
const b=await body(c.req,300)
const pair=String(b.pair||'').toUpperCase().replace(/[^A-Z0-9]/g,'')
const label=str(b.label||'Child device',1,30,'Device name')
if(pair.length!==8)fail(400,'Enter the 8 character device ID shown on the child device')
const d=await c.env.DB.prepare('select * from kp_devices where pair=?').bind(pair).first()
if(!d||d.status!=='new'||d.paired_exp<now())fail(404,'No waiting device matches that ID. Open Parley Kids on the device and try again.')
const u=await c.env.DB.prepare('update kp_devices set parent_id=?,label=?,status=\'paired\' where id=? and status=\'new\' returning id').bind(p.id,label,d.id).first()
if(!u)fail(409,'That device was just claimed')
await logp(c.env,p.id,'device','Device added: '+label).run()
return{id:d.id}
})
P('POST','/api/connect/devices/:id/code',async c=>{
const p=await parentOf(c)
limit('kpo:'+p.id,10,600000)
const b=await body(c.req,300)
const mins=int(b.minutes??10,2,60,'Minutes')
const d=await c.env.DB.prepare('select * from kp_devices where id=? and parent_id=?').bind(c.p.id,p.id).first()
if(!d)fail(404,'No such device')
if(d.status!=='paired')fail(409,d.status==='revoked'?'This device was revoked. Add it again as a new device.':'This device is already activated')
let child=null
if(b.child){
child=await c.env.DB.prepare('select id from kp_children where id=? and parent_id=?').bind(String(b.child),p.id).first()
if(!child)fail(404,'No such child')
}
const code=pick(8),id=newId('cd'),t=now()
await c.env.DB.batch([
c.env.DB.prepare('update kp_codes set revoked=1 where device_id=? and used_at is null').bind(d.id),
c.env.DB.prepare('insert into kp_codes(id,parent_id,device_id,child_id,code_hash,exp,created_at) values(?,?,?,?,?,?,?)').bind(id,p.id,d.id,child?child.id:null,await sha(d.id+'|'+code+'|'+id),t+mins*60000,t),
logp(c.env,p.id,'code','Activation code created for '+(d.label||'a device'))
])
return{code:code.slice(0,4)+'-'+code.slice(4),exp:t+mins*60000,id}
})
P('POST','/api/connect/codes/:id/revoke',async c=>{
const p=await parentOf(c)
await c.env.DB.prepare('update kp_codes set revoked=1 where id=? and parent_id=?').bind(c.p.id,p.id).run()
return{ok:true}
})
P('POST','/api/connect/devices/:id/revoke',async c=>{
const p=await parentOf(c)
const d=await c.env.DB.prepare('select * from kp_devices where id=? and parent_id=?').bind(c.p.id,p.id).first()
if(!d)fail(404,'No such device')
await c.env.DB.batch([
c.env.DB.prepare('update kp_devices set status=\'revoked\' where id=?').bind(d.id),
c.env.DB.prepare('delete from kp_ksess where device_id=?').bind(d.id),
c.env.DB.prepare('update kp_codes set revoked=1 where device_id=? and used_at is null').bind(d.id),
logp(c.env,p.id,'device','Device revoked: '+(d.label||'device'))
])
return{ok:true}
})
P('POST','/api/connect/children/:id/approve',async c=>{
const p=await parentOf(c)
const b=await body(c.req,600)
if(b.consent!==true)fail(400,'Confirm your consent to create this account')
const ch=await c.env.DB.prepare('select * from kp_children where id=? and parent_id=?').bind(c.p.id,p.id).first()
if(!ch||ch.status!=='pending')fail(404,'Nothing to approve')
const username=b.username?str(b.username,3,16,'Username'):ch.username
const dn=b.display_name?dispOk(b.display_name):ch.display_name
const av=AV.includes(b.avatar)?b.avatar:ch.avatar
await nameCheck(c.env,username,ch.id)
await c.env.DB.batch([
c.env.DB.prepare('update kp_children set username=?,display_name=?,avatar=?,status=\'active\',consent_at=? where id=?').bind(username,dn,av,now(),ch.id),
logp(c.env,p.id,'child','Account approved: '+username)
])
return{ok:true}
})
P('POST','/api/connect/children/:id/reject',async c=>{
const p=await parentOf(c)
const ch=await c.env.DB.prepare('select * from kp_children where id=? and parent_id=?').bind(c.p.id,p.id).first()
if(!ch||ch.status!=='pending')fail(404,'Nothing to reject')
await c.env.DB.batch([
c.env.DB.prepare('update kp_children set status=\'rejected\' where id=?').bind(ch.id),
logp(c.env,p.id,'child','Account rejected: '+ch.username)
])
return{ok:true}
})
P('POST','/api/connect/children/:id/delete',async c=>{
const p=await parentOf(c)
const ch=await c.env.DB.prepare('select * from kp_children where id=? and parent_id=?').bind(c.p.id,p.id).first()
if(!ch)fail(404,'No such child')
await c.env.DB.batch([
c.env.DB.prepare('delete from kp_children where id=?').bind(ch.id),
c.env.DB.prepare('update kp_devices set child_id=null where child_id=?').bind(ch.id),
logp(c.env,p.id,'child','Child account deleted: '+ch.username)
])
return{ok:true}
})
P('GET','/api/connect/export',async c=>{
const p=await parentOf(c)
const db=c.env.DB
const[ch,dv,lg]=await Promise.all([
db.prepare('select id,username,display_name,avatar,status,consent_at,created_at from kp_children where parent_id=?').bind(p.id).all(),
db.prepare('select id,label,status,child_id,created_at,last_seen from kp_devices where parent_id=?').bind(p.id).all(),
db.prepare('select kind,detail,at from kp_log where parent_id=? order by at').bind(p.id).all()
])
return{parent:{username:p.username},children:ch.results,devices:dv.results,activity:lg.results}
})
P('POST','/api/connect/delete',async c=>{
const p=await parentOf(c)
const b=await body(c.req,300)
const row=await c.env.DB.prepare('select * from kp_parents where id=?').bind(p.id).first()
if(!safeEq(await pbkdf2(String(b.password||''),row.pass_salt,PITER),row.pass_hash))fail(403,'Wrong password')
const db=c.env.DB
await db.batch([
db.prepare('delete from kp_ksess where device_id in(select id from kp_devices where parent_id=?)').bind(p.id),
db.prepare('delete from kp_codes where parent_id=?').bind(p.id),
db.prepare('delete from kp_devices where parent_id=?').bind(p.id),
db.prepare('delete from kp_children where parent_id=?').bind(p.id),
db.prepare('delete from kp_log where parent_id=?').bind(p.id),
db.prepare('delete from kp_psess where parent_id=?').bind(p.id),
db.prepare('delete from kp_parents where id=?').bind(p.id)
])
return{ok:true}
})
}
