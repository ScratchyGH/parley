import{fail,now,randHex,sha,pbkdf2,safeEq,str,limit,body,json,newId,enc,unhex}from'./util.js'
import{newSecret,genCode}from'./totp.js'
const dec=new TextDecoder()
export const DOMAIN='pmail.parley'
export const domain=()=>DOMAIN
const OWNER_LOCAL='parley'
const RESERVED=new Set(['parley','admin','administrator','postmaster','abuse','support','security','noreply','no-reply','root','mailer-daemon','pmail','help','staff','system','webmaster','hostmaster','info','contact'])
const LOCAL=/^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])$/
const FOLDERS=['inbox','sent','archive','trash']
const DAY=86400000
const ttlOf=u=>(u&&u.ttl_days||14)*DAY
const LOCKOUT=15*60000
const MAX_FAILS=5
const ITERS=100000
const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode(...u8.subarray(i,i+8192));return btoa(s)}
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0))
const aesKey=(raw,use)=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,use)
async function pwKey(pw,saltHex,use){
const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveKey'])
return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:unhex(saltHex),iterations:ITERS},k,{name:'AES-GCM',length:256},false,use)
}
async function lock(key,bytes){
const iv=crypto.getRandomValues(new Uint8Array(12))
const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes))
return b64(iv)+'.'+b64(ct)
}
async function unlock(key,s){
const[iv,ct]=String(s).split('.')
return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv)},key,unb64(ct)))
}
const tokKey=async(tok,use)=>aesKey(await crypto.subtle.digest('SHA-256',enc.encode('pmail-session:'+tok)),use)
async function seal(pubB64,obj){
const eph=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey'])
const pub=await crypto.subtle.importKey('raw',unb64(pubB64),{name:'ECDH',namedCurve:'P-256'},false,[])
const k=await crypto.subtle.deriveKey({name:'ECDH',public:pub},eph.privateKey,{name:'AES-GCM',length:256},false,['encrypt'])
const iv=crypto.getRandomValues(new Uint8Array(12))
const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,enc.encode(JSON.stringify(obj))))
return{eph:b64(new Uint8Array(await crypto.subtle.exportKey('raw',eph.publicKey))),iv:b64(iv),ct:b64(ct)}
}
async function open(priv,row){
const eph=await crypto.subtle.importKey('raw',unb64(row.eph),{name:'ECDH',namedCurve:'P-256'},false,[])
const k=await crypto.subtle.deriveKey({name:'ECDH',public:eph},priv,{name:'AES-GCM',length:256},false,['decrypt'])
return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(row.iv)},k,unb64(row.ct))))
}
const ecKey=(pkcs8)=>crypto.subtle.importKey('pkcs8',pkcs8,{name:'ECDH',namedCurve:'P-256'},false,['deriveKey'])
const clean=t=>String(t==null?'':t).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f‪-‮⁦-⁩]/g,'')
const cookieOf=(req,n)=>{const m=new RegExp('(?:^|;\\s*)'+n+'=([a-f0-9]{64})').exec(req.headers.get('cookie')||'');return m?m[1]:null}
const setCookie=(url,tok,age)=>'pm='+tok+'; Path=/api/pmail; HttpOnly; SameSite=Strict; Max-Age='+age+(url.protocol==='https:'?'; Secure':'')
const ipOf=c=>c.req.headers.get('cf-connecting-ip')||'local'
const labelOf=ua=>{
const u=String(ua||'')
const b=/Edg\//.test(u)?'Edge':/OPR\//.test(u)?'Opera':/Firefox\//.test(u)?'Firefox':/Chrome\//.test(u)?'Chrome':/Safari\//.test(u)?'Safari':'Browser'
const o=/Windows/.test(u)?'Windows':/Android/.test(u)?'Android':/iPhone|iPad/.test(u)?'iOS':/Mac OS/.test(u)?'Mac':/Linux/.test(u)?'Linux':'device'
return b+' on '+o
}
const ADJ=['swift','quiet','amber','lucid','brisk','cobalt','dusty','eager','fuzzy','gentle','hollow','ivory','jolly','keen','lunar','mellow','nimble','opal','plucky','rustic','sunny','tidy','velvet','wild']
const NOUN=['otter','falcon','maple','comet','harbor','lotus','meadow','pebble','quartz','raven','sparrow','thistle','willow','yarrow','badger','cedar','delta','ember','fjord','glacier','heron','iris','juniper','kestrel']
const pick=a=>a[crypto.getRandomValues(new Uint32Array(1))[0]%a.length]
const addrOf=(env,l)=>l+'@'+domain(env)
const splitAddr=(env,a)=>{
const m=/^([^@\s]{1,64})@([^@\s]+)$/.exec(String(a||'').trim().toLowerCase())
if(!m||m[2]!==domain(env))return null
return m[1].replace(/\+.*$/,'')
}
async function srvKey(env){
let k=await env.DB.prepare("select v from app_settings where k='pmail_owner_key'").first()
if(!k){await env.DB.prepare("insert or ignore into app_settings(k,v) values('pmail_owner_key',?)").bind(randHex(32)).run();k=await env.DB.prepare("select v from app_settings where k='pmail_owner_key'").first()}
return k.v
}
async function ownerBox(env){
let u=await env.DB.prepare('select id,local,display,pub,prefs,priv_enc from pm_users where local=?').bind(OWNER_LOCAL).first()
if(u)return u
const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey'])
const pkcs8=new Uint8Array(await crypto.subtle.exportKey('pkcs8',kp.privateKey))
const pub=b64(new Uint8Array(await crypto.subtle.exportKey('raw',kp.publicKey)))
const k={v:await srvKey(env)}
const id=newId('pu')
const none=randHex(16)
await env.DB.prepare('insert or ignore into pm_users(id,local,display,pass_salt,pass_hash,pass_iters,kdf_salt,pub,priv_enc,rec_salt,priv_rec,prefs,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,OWNER_LOCAL,'Parley',none,randHex(32),ITERS,none,pub,await lock(await aesKey(unhex(k.v),['encrypt']),pkcs8),none,'-','{}',now()).run()
return env.DB.prepare('select id,local,display,pub,prefs,priv_enc from pm_users where local=?').bind(OWNER_LOCAL).first()
}
async function ownerPriv(env,u){
return unlock(await aesKey(unhex(await srvKey(env)),['decrypt']),u.priv_enc)
}
async function resolve(env,local){
if(local===OWNER_LOCAL)return ownerBox(env)
const u=await env.DB.prepare('select id,local,display,pub,prefs from pm_users where local=?').bind(local).first()
if(u)return u
const a=await env.DB.prepare('select user_id from pm_alias where addr=? and enabled=1').bind(local).first()
if(!a)return null
return env.DB.prepare('select id,local,display,pub,prefs from pm_users where id=?').bind(a.user_id).first()
}
const jparse=(s,d)=>{try{const v=JSON.parse(s);return v&&typeof v==='object'?v:d}catch{return d}}
const COLOR=/^#[0-9a-f]{6}$/i
const PREF_KEYS={preset:['dimmed','silver','light','contrast'],density:['compact','comfortable','spacious'],layout:['three','two','list'],font:['default','system','serif','mono'],width:['narrow','medium','wide'],radius:['sharp','soft','round']}
export function cleanPrefs(o){
const out={}
if(!o||typeof o!=='object')return out
for(const[k,v]of Object.entries(PREF_KEYS))if(v.includes(o[k]))out[k]=o[k]
for(const k of['accent','bg','text'])if(COLOR.test(o[k]||''))out[k]=o[k].toLowerCase()
out.keys=o.keys!==false
out.preview=o.preview!==false
out.sig=clean(o.sig).slice(0,400)
out.name=clean(o.name).replace(/[<>]/g,'').slice(0,40)
out.folders=Array.isArray(o.folders)?[...new Set(o.folders.map(x=>clean(x).replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,24)).filter(Boolean))].slice(0,20):[]
out.rules=Array.isArray(o.rules)?o.rules.slice(0,20).map(r=>({field:['from','subject','body'].includes(r&&r.field)?r.field:'from',has:clean(r&&r.has).slice(0,80).toLowerCase(),act:['folder','read','star','trash'].includes(r&&r.act)?r.act:'folder',folder:clean(r&&r.folder).slice(0,24)})).filter(r=>r.has):[]
return out
}
async function newSession(c,u,priv){
const tok=randHex(32)
const id=await sha('pm:'+tok)
await c.env.DB.prepare('insert into pm_sessions(id,user_id,priv_sess,label,created_at,expires_at,seen_at) values(?,?,?,?,?,?,?)').bind(id,u.id,await lock(await tokKey(tok,['encrypt']),priv),labelOf(c.req.headers.get('user-agent')),now(),now()+ttlOf(u),now()).run()
await c.env.DB.prepare('delete from pm_sessions where user_id=? and expires_at<?').bind(u.id,now()).run()
return tok
}
async function auth(c,locked){
const tok=cookieOf(c.req,'pm')
if(!tok)fail(401,'Not signed in')
const id=await sha('pm:'+tok)
const s=await c.env.DB.prepare('select * from pm_sessions where id=?').bind(id).first()
if(!s||s.expires_at<now())fail(401,'Not signed in')
const u=await c.env.DB.prepare('select * from pm_users where id=?').bind(s.user_id).first()
if(!u)fail(401,'Not signed in')
let lk=!!s.locked
if(!lk&&u.pin_hash&&u.lock_min>0&&s.seen_at&&now()-s.seen_at>u.lock_min*60000){lk=true;await c.env.DB.prepare('update pm_sessions set locked=1 where id=?').bind(id).run()}
if(lk&&!locked)fail(423,'Locked')
if(!lk&&now()-s.seen_at>60000)await c.env.DB.prepare('update pm_sessions set seen_at=? where id=?').bind(now(),id).run()
let priv
try{priv=await ecKey(await unlock(await tokKey(tok,['decrypt']),s.priv_sess))}catch{fail(401,'Not signed in')}
return{u,priv,sid:id,locked:lk,prefs:cleanPrefs(jparse(u.prefs,{}))}
}
const here=c=>labelOf(c.req.headers.get('user-agent'))+' · '+(c.req.headers.get('cf-ipcountry')||'unknown location')
async function logAct(c,uid,kind,detail){
await c.env.DB.prepare('insert into pm_activity(id,user_id,ts,kind,detail) values(?,?,?,?,?)').bind(newId('pa'),uid,now(),kind,detail===undefined?here(c):detail).run()
await c.env.DB.prepare('delete from pm_activity where user_id=? and id not in (select id from pm_activity where user_id=? order by ts desc limit 200)').bind(uid,uid).run()
}
async function alert(c,u,subject,text){
if(!u.alerts||u.local===OWNER_LOCAL)return
const to=addrOf(c.env,u.local)
await deliver(c.env,u,{from:'parley@'+domain(c.env),fn:'PMail Security',to:[to],toOne:to,s:subject,b:text+'\n\nWhere: '+here(c)+'\nWhen: '+new Date().toUTCString()+'\n\nIf this was not you, change your password, turn on two-factor authentication and sign out other devices in Settings, Security. You can turn these alerts off there too.',ts:now()}).catch(()=>{})
}
const pwOk=async(u,pw)=>safeEq(await pbkdf2(String(pw||'').slice(0,200),u.pass_salt,u.pass_iters),u.pass_hash)
const real=a=>{if(a.u.local===OWNER_LOCAL)fail(400,'The owner mailbox has no password, so this does not apply to it')}
async function secretOf(env,u){
return new TextDecoder().decode(await unlock(await aesKey(unhex(await srvKey(env)),['decrypt']),u.totp_secret))
}
async function second(env,u,input){
const t=String(input||'').trim().toLowerCase().replace(/\s/g,'')
if(/^\d{6}$/.test(t)){
if(!u.totp_secret)return false
const secret=await secretOf(env,u)
const step=Math.floor(now()/30000)
for(const d of[-1,0,1]){
const n=step+d
if(n>u.totp_last&&safeEq(await genCode(secret,n),t)){await env.DB.prepare('update pm_users set totp_last=? where id=?').bind(n,u.id).run();return true}
}
return false
}
const hx=t.replace(/[^0-9a-f]/g,'')
if(hx.length!==8||!u.backup_hashes)return false
const list=jparse(u.backup_hashes,[])
const i=list.indexOf(await sha(hx.slice(0,4)+'-'+hx.slice(4)))
if(i<0)return false
list.splice(i,1)
await env.DB.prepare('update pm_users set backup_hashes=? where id=?').bind(JSON.stringify(list),u.id).run()
return true
}
async function strike(c,u,why){
const n=(u.fails||0)+1
if(n>=MAX_FAILS){
await c.env.DB.prepare('update pm_users set fails=0,locked_until=? where id=?').bind(now()+LOCKOUT,u.id).run()
await logAct(c,u.id,'lockout','Locked for 15 minutes after '+MAX_FAILS+' failed sign-ins')
await alert(c,u,'Sign-in attempts locked','Someone failed to sign in to your PMail '+MAX_FAILS+' times. Sign-ins are paused for 15 minutes.')
}else{
await c.env.DB.prepare('update pm_users set fails=? where id=?').bind(n,u.id).run()
await logAct(c,u.id,'login_fail',why+' wrong · '+here(c))
}
}
async function purge(env,u){
if(u.keep_days>0)await env.DB.prepare('delete from pm_msgs where user_id=? and star=0 and ts<?').bind(u.id,now()-u.keep_days*DAY).run()
}
const mine=async(env,uid)=>(await env.DB.prepare('select addr,label,enabled from pm_alias where user_id=? order by created_at').bind(uid).all()).results||[]
async function deliver(env,rcpt,m){
const prefs=cleanPrefs(jparse(rcpt.prefs,{}))
let folder='inbox',read=0,star=0
const hay={from:(m.from+' '+(m.fn||'')).toLowerCase(),subject:String(m.s).toLowerCase(),body:String(m.b).toLowerCase()}
for(const r of prefs.rules){
if(!hay[r.field].includes(r.has))continue
if(r.act==='read')read=1
else if(r.act==='star')star=1
else if(r.act==='trash'){folder='trash';read=1}
else if(r.act==='folder'&&prefs.folders.includes(r.folder))folder='f:'+r.folder
}
const cnt=await env.DB.prepare('select count(*) n from pm_msgs where user_id=?').bind(rcpt.id).first()
if(cnt&&cnt.n>=3000)return false
const sl=await seal(rcpt.pub,{s:m.s,b:m.b,fn:m.fn||'',to:m.to})
await env.DB.prepare('insert into pm_msgs(id,user_id,folder,from_addr,to_addr,ts,read,star,eph,iv,ct) values(?,?,?,?,?,?,?,?,?,?,?)').bind(newId('pm'),rcpt.id,folder,m.from,m.toOne,m.ts,read,star,sl.eph,sl.iv,sl.ct).run()
return true
}
export async function systemMail(env,to,subject,text){
const local=splitAddr(env,to)
if(!local)return{ok:false,error:'Not a PMail address'}
const r=await resolve(env,local)
if(!r)return{ok:false,error:'No PMail account with that address. Create one at /pmail/ first.'}
const ok=await deliver(env,r,{from:'parley@'+domain(env),fn:'Parley',to:[to],toOne:to,s:clean(subject).slice(0,200),b:clean(text).slice(0,20000),ts:now()})
return ok?{ok:true,via:'pmail'}:{ok:false,error:'That PMail mailbox is full'}
}
async function meOut(c,a){
const counts={}
const q=await c.env.DB.prepare('select folder,count(*) n,sum(case when read=0 then 1 else 0 end) un from pm_msgs where user_id=? group by folder').bind(a.u.id).all()
for(const r of q.results||[])counts[r.folder]={n:r.n,un:r.un||0}
const st=await c.env.DB.prepare('select count(*) n,sum(case when read=0 then 1 else 0 end) un from pm_msgs where user_id=? and star=1 and folder!=\'trash\'').bind(a.u.id).first()
counts.starred={n:st.n||0,un:st.un||0}
const left=a.u.backup_hashes?jparse(a.u.backup_hashes,[]).length:0
return{address:addrOf(c.env,a.u.local),local:a.u.local,display:a.u.display,domain:domain(c.env),prefs:a.prefs,aliases:await mine(c.env,a.u.id),counts,sec:{owner:a.u.local===OWNER_LOCAL,pin:!!a.u.pin_hash,totp:!!a.u.totp_on,backup_left:left,lock_min:a.u.lock_min||0,keep_days:a.u.keep_days||0,ttl_days:a.u.ttl_days||14,alerts:!!a.u.alerts}}
}
export default function(r){
const O={auth:false}
r.add('GET','/api/pmail/check',async c=>{
limit('pmc:'+ipOf(c),60,60000)
const l=String(c.url.searchParams.get('local')||'').trim().toLowerCase()
if(!LOCAL.test(l)||/\.\.|[._-]{2}/.test(l))return{ok:false,domain:domain(c.env),reason:'Use 3 to 30 letters, numbers, dots, dashes or underscores'}
if(RESERVED.has(l))return{ok:false,domain:domain(c.env),reason:'That name is reserved'}
const t=await c.env.DB.prepare('select 1 x from pm_users where local=? union select 1 from pm_alias where addr=?').bind(l,l).first()
return t?{ok:false,domain:domain(c.env),reason:'Already taken'}:{ok:true,domain:domain(c.env)}
},O)
r.add('POST','/api/pmail/signup',async c=>{
limit('pms:'+ipOf(c),5,3600000)
const b=await body(c.req)
const l=String(b.local||'').trim().toLowerCase()
if(!LOCAL.test(l)||/\.\.|[._-]{2}/.test(l))fail(400,'Use 3 to 30 letters, numbers, dots, dashes or underscores')
if(RESERVED.has(l))fail(400,'That name is reserved')
const pw=str(b.password,10,200,'Password')
const display=clean(b.display).replace(/[<>]/g,'').trim().slice(0,40)
if(await c.env.DB.prepare('select 1 x from pm_users where local=? union select 1 from pm_alias where addr=?').bind(l,l).first())fail(409,'That address is taken')
const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey'])
const pkcs8=new Uint8Array(await crypto.subtle.exportKey('pkcs8',kp.privateKey))
const pub=b64(new Uint8Array(await crypto.subtle.exportKey('raw',kp.publicKey)))
const kdf=randHex(16),ps=randHex(16),rs=randHex(16)
const rec=randHex(10).match(/.{5}/g).join('-')
const id=newId('pu')
const row={id,local:l,display,pass_salt:ps,pass_iters:ITERS,kdf_salt:kdf,pub,rec_salt:rs}
try{
await c.env.DB.prepare('insert into pm_users(id,local,display,pass_salt,pass_hash,pass_iters,kdf_salt,pub,priv_enc,rec_salt,priv_rec,prefs,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,l,display,ps,await pbkdf2(pw,ps,ITERS),ITERS,kdf,pub,await lock(await pwKey(pw,kdf,['encrypt']),pkcs8),rs,await lock(await pwKey(rec,rs,['encrypt']),pkcs8),'{}',now()).run()
}catch{fail(409,'That address is taken')}
const tok=await newSession(c,row,pkcs8)
await logAct(c,id,'signup')
await deliver(c.env,{id,pub,prefs:'{}'},{from:'parley@'+domain(c.env),fn:'PMail',to:[addrOf(c.env,l)],toOne:addrOf(c.env,l),s:'Welcome to PMail',b:'Your address is '+addrOf(c.env,l)+'.\n\nWhat PMail does:\n- Messages are plain text only, so nothing can load a tracking pixel or remote image.\n- Links are shown in full with tracking parameters stripped.\n- There are no read receipts and no last-seen times.\n- Every message is encrypted for you before it is stored. Only your password (or your recovery code) can open your mailbox.\n- Create throwaway aliases in Settings, Addresses. Anything sent to '+l+'+anything@'+domain(c.env)+' also reaches you.\n\nKeep your recovery code somewhere safe. It is the only way back in if you forget your password.\n\nFor more protection, open Settings, Security to add a PIN lock, two-factor authentication and an activity log.',ts:now()})
return json({ok:true,address:addrOf(c.env,l),recovery:rec},200,{'set-cookie':setCookie(c.url,tok,ttlOf(null)/1000)})
},O)
r.add('POST','/api/pmail/login',async c=>{
const b=await body(c.req)
const l=String(b.address||'').trim().toLowerCase().replace(/@.*$/,'')
if(l===OWNER_LOCAL)fail(403,'This mailbox opens from the Parley owner account')
limit('pml:'+ipOf(c),20,600000)
limit('pml:'+l,20,600000)
const u=await c.env.DB.prepare('select * from pm_users where local=?').bind(l).first()
if(u&&u.locked_until>now())fail(429,'Too many failed attempts. Try again in '+Math.ceil((u.locked_until-now())/60000)+' minutes.')
const pw=String(b.password||'').slice(0,200)
const hash=await pbkdf2(pw,u?u.pass_salt:randHex(16),u?u.pass_iters:ITERS)
if(!u||!safeEq(hash,u.pass_hash)){if(u)await strike(c,u,'Password');fail(403,'Wrong address or password')}
let pkcs8
try{pkcs8=await unlock(await pwKey(pw,u.kdf_salt,['decrypt']),u.priv_enc)}catch{fail(403,'Wrong address or password')}
if(u.totp_on){
if(!b.code)return{ok:false,need:'2fa'}
if(!await second(c.env,u,b.code)){await strike(c,u,'Two-factor code');fail(403,'That code is not valid')}
}
if(u.fails)await c.env.DB.prepare('update pm_users set fails=0 where id=?').bind(u.id).run()
const known=await c.env.DB.prepare("select 1 x from pm_activity where user_id=? and kind in ('login','signup') and detail=? limit 1").bind(u.id,here(c)).first()
const tok=await newSession(c,u,pkcs8)
await logAct(c,u.id,'login')
if(!known)await alert(c,u,'New sign-in to your PMail','A new device or place just signed in to your PMail.')
await purge(c.env,u)
return json({ok:true},200,{'set-cookie':setCookie(c.url,tok,ttlOf(u)/1000)})
},O)
const isOwner=c=>String(c.user&&c.user.username||'').toLowerCase()===String(c.env.OWNER_USERNAME||'ParleyOfficial').toLowerCase()
r.add('GET','/api/pmail/owner-status',async c=>({owner:isOwner(c)}),{auth:true})
r.add('POST','/api/pmail/owner-open',async c=>{
if(!isOwner(c))fail(403,'Only the Parley owner can open this mailbox')
const u=await ownerBox(c.env)
const o=await c.env.DB.prepare('select pin_hash,locked_until from pm_users where id=?').bind(u.id).first()
if(o&&o.locked_until>now())fail(429,'Too many wrong PINs. Try again in '+Math.ceil((o.locked_until-now())/60000)+' minutes.')
const tok=await newSession(c,u,await ownerPriv(c.env,u))
if(o&&o.pin_hash)await c.env.DB.prepare('update pm_sessions set locked=1 where id=?').bind(await sha('pm:'+tok)).run()
await logAct(c,u.id,'login','Parley owner account · '+here(c))
return json({ok:true},200,{'set-cookie':setCookie(c.url,tok,ttlOf(null)/1000)})
},{auth:true})
r.add('POST','/api/pmail/logout',async c=>{
const t=cookieOf(c.req,'pm')
if(t)await c.env.DB.prepare('delete from pm_sessions where id=?').bind(await sha('pm:'+t)).run()
return json({ok:true},200,{'set-cookie':setCookie(c.url,'',0)})
},O)
r.add('GET','/api/pmail/me',async c=>{
const a=await auth(c,true)
if(a.locked)return{locked:true,address:addrOf(c.env,a.u.local)}
await purge(c.env,a.u)
return meOut(c,a)
},O)
r.add('GET','/api/pmail/list',async c=>{
const a=await auth(c)
let f=String(c.url.searchParams.get('folder')||'inbox')
const prefs=a.prefs
if(f!=='starred'&&!FOLDERS.includes(f)&&!(f.startsWith('f:')&&prefs.folders.includes(f.slice(2))))fail(400,'Unknown folder')
const before=Math.min(Number(c.url.searchParams.get('before'))||Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER)
const rows=(await(f==='starred'?c.env.DB.prepare("select * from pm_msgs where user_id=? and star=1 and folder!='trash' and ts<? order by ts desc limit 26").bind(a.u.id,before):c.env.DB.prepare('select * from pm_msgs where user_id=? and folder=? and ts<? order by ts desc limit 26').bind(a.u.id,f,before)).all()).results||[]
const more=rows.length>25
const items=[]
for(const m of rows.slice(0,25)){
let d={s:'(could not decrypt)',b:'',fn:''}
try{d=await open(a.priv,m)}catch{}
items.push({id:m.id,folder:m.folder,from:m.from_addr,to:m.to_addr,fn:d.fn||'',ts:m.ts,read:!!m.read,star:!!m.star,s:d.s,sn:a.prefs.preview?String(d.b).replace(/\s+/g,' ').slice(0,110):''})
}
return{items,more}
},O)
r.add('GET','/api/pmail/msg/:id',async c=>{
const a=await auth(c)
const m=await c.env.DB.prepare('select * from pm_msgs where id=? and user_id=?').bind(c.p.id,a.u.id).first()
if(!m)fail(404,'Not found')
let d
try{d=await open(a.priv,m)}catch{fail(500,'Could not decrypt this message')}
if(!m.read)await c.env.DB.prepare('update pm_msgs set read=1 where id=?').bind(m.id).run()
return{id:m.id,folder:m.folder,from:m.from_addr,to:m.to_addr,fn:d.fn||'',all:d.to||[m.to_addr],ts:m.ts,star:!!m.star,s:d.s,b:d.b}
},O)
r.add('POST','/api/pmail/msg/:id',async c=>{
const a=await auth(c)
const b=await body(c.req)
const m=await c.env.DB.prepare('select id,folder from pm_msgs where id=? and user_id=?').bind(c.p.id,a.u.id).first()
if(!m)fail(404,'Not found')
const sets=[],vals=[]
if(b.read!==undefined){sets.push('read=?');vals.push(b.read?1:0)}
if(b.star!==undefined){sets.push('star=?');vals.push(b.star?1:0)}
if(b.folder!==undefined){
const f=String(b.folder)
if(!(FOLDERS.includes(f)&&f!=='sent'||(f.startsWith('f:')&&a.prefs.folders.includes(f.slice(2)))))fail(400,'Unknown folder')
sets.push('folder=?');vals.push(f)
}
if(!sets.length)return{ok:true}
await c.env.DB.prepare('update pm_msgs set '+sets.join(',')+' where id=?').bind(...vals,m.id).run()
return{ok:true}
},O)
r.add('POST','/api/pmail/delete-msg/:id',async c=>{
const a=await auth(c)
const m=await c.env.DB.prepare('select id,folder from pm_msgs where id=? and user_id=?').bind(c.p.id,a.u.id).first()
if(!m)fail(404,'Not found')
if(m.folder==='trash')await c.env.DB.prepare('delete from pm_msgs where id=?').bind(m.id).run()
else await c.env.DB.prepare("update pm_msgs set folder='trash',read=1 where id=?").bind(m.id).run()
return{ok:true,gone:m.folder==='trash'}
},O)
r.add('POST','/api/pmail/empty-trash',async c=>{
const a=await auth(c)
await c.env.DB.prepare("delete from pm_msgs where user_id=? and folder='trash'").bind(a.u.id).run()
return{ok:true}
},O)
r.add('POST','/api/pmail/send',async c=>{
const a=await auth(c)
limit('pmsend:'+a.u.id,60,3600000)
const b=await body(c.req,60000)
const list=[...new Set((Array.isArray(b.to)?b.to:String(b.to||'').split(/[,;\s]+/)).map(x=>String(x).trim().toLowerCase()).filter(Boolean))]
if(!list.length)fail(400,'Add at least one recipient')
if(list.length>20)fail(400,'At most 20 recipients')
const s=clean(b.subject).replace(/[\r\n]+/g,' ').trim().slice(0,200)||'(no subject)'
let text=clean(b.body).slice(0,20000)
if(a.prefs.sig&&b.sig!==false)text+='\n\n-- \n'+a.prefs.sig
const rc=[]
for(const x of list){
const l=splitAddr(c.env,x)
if(!l)fail(400,x+' is not a PMail address. PMail delivers to @'+domain(c.env)+' addresses.')
const u=await resolve(c.env,l)
if(!u)fail(404,'No PMail account at '+x)
rc.push([x,u])
}
const ts=now()
const from=addrOf(c.env,a.u.local)
const fn=a.prefs.name||a.u.display||''
let sent=0
for(const[x,u]of rc){if(await deliver(c.env,u,{from,fn,to:list,toOne:x,s,b:text,ts}))sent++}
const own=await seal((await c.env.DB.prepare('select pub from pm_users where id=?').bind(a.u.id).first()).pub,{s,b:text,fn,to:list})
await c.env.DB.prepare("insert into pm_msgs(id,user_id,folder,from_addr,to_addr,ts,read,star,eph,iv,ct) values(?,?,'sent',?,?,?,1,0,?,?,?)").bind(newId('pm'),a.u.id,from,list.join(', ').slice(0,300),ts,own.eph,own.iv,own.ct).run()
return{ok:true,delivered:sent,total:rc.length}
},O)
r.add('POST','/api/pmail/prefs',async c=>{
const a=await auth(c)
const b=await body(c.req)
const p=cleanPrefs({...a.prefs,...(b.prefs||{})})
await c.env.DB.prepare('update pm_users set prefs=? where id=?').bind(JSON.stringify(p),a.u.id).run()
if(b.display!==undefined)await c.env.DB.prepare('update pm_users set display=? where id=?').bind(clean(b.display).replace(/[<>]/g,'').trim().slice(0,40),a.u.id).run()
return{ok:true,prefs:p}
},O)
r.add('POST','/api/pmail/alias',async c=>{
const a=await auth(c)
limit('pma:'+a.u.id,30,3600000)
const b=await body(c.req)
const n=await c.env.DB.prepare('select count(*) n from pm_alias where user_id=?').bind(a.u.id).first()
if(n.n>=25)fail(400,'You can have up to 25 aliases')
let addr=''
const custom=String(b.addr||'').trim().toLowerCase()
if(custom){
if(!LOCAL.test(custom)||/\.\.|[._-]{2}/.test(custom)||RESERVED.has(custom))fail(400,'That alias name is not allowed')
addr=custom
}
for(let i=0;i<8;i++){
if(!custom)addr=pick(ADJ)+'-'+pick(NOUN)+'-'+String(crypto.getRandomValues(new Uint32Array(1))[0]%9000+1000)
if(!(await c.env.DB.prepare('select 1 x from pm_users where local=? union select 1 from pm_alias where addr=?').bind(addr,addr).first()))break
if(custom)fail(409,'That address is taken')
if(i===7)fail(500,'Try again')
}
await c.env.DB.prepare('insert into pm_alias(addr,user_id,label,enabled,created_at) values(?,?,?,1,?)').bind(addr,a.u.id,clean(b.label).slice(0,40),now()).run()
return{ok:true,aliases:await mine(c.env,a.u.id)}
},O)
r.add('POST','/api/pmail/alias/:addr',async c=>{
const a=await auth(c)
const b=await body(c.req)
const own=await c.env.DB.prepare('select addr from pm_alias where addr=? and user_id=?').bind(c.p.addr,a.u.id).first()
if(!own)fail(404,'Not found')
if(b.remove)await c.env.DB.prepare('delete from pm_alias where addr=?').bind(own.addr).run()
else await c.env.DB.prepare('update pm_alias set enabled=? where addr=?').bind(b.enabled?1:0,own.addr).run()
return{ok:true,aliases:await mine(c.env,a.u.id)}
},O)
r.add('GET','/api/pmail/sessions',async c=>{
const a=await auth(c)
const q=await c.env.DB.prepare('select id,label,created_at,expires_at,seen_at from pm_sessions where user_id=? and expires_at>? order by created_at desc').bind(a.u.id,now()).all()
return{sessions:(q.results||[]).map(s=>({id:s.id.slice(0,16),label:s.label,created_at:s.created_at,seen_at:s.seen_at,current:s.id===a.sid}))}
},O)
r.add('POST','/api/pmail/sessions/revoke',async c=>{
const a=await auth(c)
const b=await body(c.req)
if(b.id){
const all=(await c.env.DB.prepare('select id from pm_sessions where user_id=?').bind(a.u.id).all()).results||[]
const hit=all.find(s=>s.id.slice(0,16)===String(b.id)&&s.id!==a.sid)
if(hit)await c.env.DB.prepare('delete from pm_sessions where id=?').bind(hit.id).run()
}else await c.env.DB.prepare('delete from pm_sessions where user_id=? and id!=?').bind(a.u.id,a.sid).run()
await logAct(c,a.u.id,'session_revoke',b.id?'Signed out one device':'Signed out all other devices')
return{ok:true}
},O)
async function rewrap(c,a,u,pkcs8,next){
const ps=randHex(16),kdf=randHex(16)
await c.env.DB.prepare('update pm_users set pass_salt=?,pass_hash=?,pass_iters=?,kdf_salt=?,priv_enc=? where id=?').bind(ps,await pbkdf2(next,ps,ITERS),ITERS,kdf,await lock(await pwKey(next,kdf,['encrypt']),pkcs8),u.id).run()
}
r.add('POST','/api/pmail/password',async c=>{
const a=await auth(c)
limit('pmpw:'+a.u.id,6,3600000)
const b=await body(c.req)
const cur=String(b.current||'').slice(0,200)
real(a)
if(!await pwOk(a.u,cur))fail(403,'Current password is wrong')
const next=str(b.next,10,200,'New password')
let pkcs8
try{pkcs8=await unlock(await pwKey(cur,a.u.kdf_salt,['decrypt']),a.u.priv_enc)}catch{fail(403,'Current password is wrong')}
await rewrap(c,a,a.u,pkcs8,next)
await c.env.DB.prepare('delete from pm_sessions where user_id=? and id!=?').bind(a.u.id,a.sid).run()
await logAct(c,a.u.id,'password')
await alert(c,a.u,'Your PMail password was changed','The password for your PMail address was just changed and other devices were signed out.')
return{ok:true}
},O)
r.add('POST','/api/pmail/reset',async c=>{
limit('pmr:'+ipOf(c),6,3600000)
const b=await body(c.req)
const l=String(b.address||'').trim().toLowerCase().replace(/@.*$/,'')
limit('pmr:'+l,5,3600000)
const u=await c.env.DB.prepare('select * from pm_users where local=?').bind(l).first()
const rec=String(b.recovery||'').toLowerCase().replace(/[^0-9a-f]/g,'')
const code=rec.length===20?rec.match(/.{5}/g).join('-'):''
const next=str(b.next,10,200,'New password')
let pkcs8
try{if(!u||!code||u.local===OWNER_LOCAL)throw 0;pkcs8=await unlock(await pwKey(code,u.rec_salt,['decrypt']),u.priv_rec)}catch{fail(403,'That recovery code does not match')}
if(u.totp_on&&!await second(c.env,u,b.code))fail(403,'This mailbox uses two-factor authentication. Enter an authenticator or backup code too.')
await rewrap(c,null,u,pkcs8,next)
await c.env.DB.prepare('delete from pm_sessions where user_id=?').bind(u.id).run()
await c.env.DB.prepare('update pm_users set fails=0,locked_until=0 where id=?').bind(u.id).run()
await logAct(c,u.id,'reset','Password reset with recovery code · '+here(c))
await alert(c,u,'Your PMail password was reset','Your PMail password was reset with your recovery code and all devices were signed out.')
return{ok:true}
},O)
r.add('POST','/api/pmail/destroy',async c=>{
const a=await auth(c)
limit('pmd:'+a.u.id,4,3600000)
const b=await body(c.req)
real(a)
if(!await pwOk(a.u,b.password))fail(403,'Password is wrong')
if(a.u.totp_on&&!await second(c.env,a.u,b.code))fail(403,'Enter a valid authenticator or backup code')
await c.env.DB.batch(['pm_msgs','pm_alias','pm_sessions','pm_activity'].map(t=>c.env.DB.prepare('delete from '+t+' where user_id=?').bind(a.u.id)).concat([c.env.DB.prepare('delete from pm_users where id=?').bind(a.u.id)]))
return json({ok:true},200,{'set-cookie':setCookie(c.url,'',0)})
},O)
r.add('POST','/api/pmail/lock',async c=>{
const a=await auth(c)
if(!a.u.pin_hash)fail(400,'Set a PIN first')
await c.env.DB.prepare('update pm_sessions set locked=1 where id=?').bind(a.sid).run()
return{ok:true}
},O)
r.add('POST','/api/pmail/unlock',async c=>{
const a=await auth(c,true)
const b=await body(c.req)
limit('pmu:'+a.sid,30,600000)
if(!a.locked)return{ok:true}
if(a.u.locked_until>now())fail(429,'Too many wrong PINs. Try again in '+Math.ceil((a.u.locked_until-now())/60000)+' minutes.')
const pin=String(b.pin||'').slice(0,12)
if(a.u.pin_hash&&safeEq(await pbkdf2(pin,a.u.pin_salt,ITERS),a.u.pin_hash)){
await c.env.DB.prepare('update pm_sessions set locked=0,fails=0,seen_at=? where id=?').bind(now(),a.sid).run()
return{ok:true}
}
const s=await c.env.DB.prepare('select fails from pm_sessions where id=?').bind(a.sid).first()
const n=(s&&s.fails||0)+1
if(n>=MAX_FAILS){
await c.env.DB.prepare('delete from pm_sessions where id=?').bind(a.sid).run()
await c.env.DB.prepare('update pm_users set locked_until=? where id=?').bind(now()+LOCKOUT,a.u.id).run()
await logAct(c,a.u.id,'unlock_lockout','Signed out after '+MAX_FAILS+' wrong PINs')
await alert(c,a.u,'PIN entered wrong 5 times','Someone entered the wrong PIN '+MAX_FAILS+' times on a locked PMail session. That session was signed out.')
return json({error:'Too many wrong PINs. Sign in again.',gone:true},401,{'set-cookie':setCookie(c.url,'',0)})
}
await c.env.DB.prepare('update pm_sessions set fails=? where id=?').bind(n,a.sid).run()
await logAct(c,a.u.id,'unlock_fail','Wrong PIN · '+here(c))
fail(403,'Wrong PIN. '+(MAX_FAILS-n)+' tries left.')
},O)
r.add('POST','/api/pmail/pin',async c=>{
const a=await auth(c)
limit('pmpin:'+a.u.id,10,3600000)
const b=await body(c.req)
if(a.u.local!==OWNER_LOCAL&&!await pwOk(a.u,b.password))fail(403,'Password is wrong')
if(b.off){
await c.env.DB.prepare('update pm_users set pin_hash=null,pin_salt=null,lock_min=0 where id=?').bind(a.u.id).run()
await c.env.DB.prepare('update pm_sessions set locked=0 where user_id=?').bind(a.u.id).run()
await logAct(c,a.u.id,'pin_off','PIN lock turned off')
return{ok:true}
}
const pin=String(b.pin||'')
if(!/^\d{4,8}$/.test(pin))fail(400,'A PIN is 4 to 8 digits')
const salt=randHex(16)
await c.env.DB.prepare('update pm_users set pin_salt=?,pin_hash=? where id=?').bind(salt,await pbkdf2(pin,salt,ITERS),a.u.id).run()
await logAct(c,a.u.id,'pin_on','PIN lock set')
return{ok:true}
},O)
r.add('POST','/api/pmail/security',async c=>{
const a=await auth(c)
const b=await body(c.req)
const pick1=(v,ok,d)=>ok.includes(Number(v))?Number(v):d
const lm=pick1(b.lock_min,[0,1,5,15,30,60],a.u.lock_min||0)
if(lm>0&&!a.u.pin_hash)fail(400,'Set a PIN before turning on auto-lock')
const kd=pick1(b.keep_days,[0,7,30,90,365],a.u.keep_days||0)
const td=pick1(b.ttl_days,[1,7,14,30],a.u.ttl_days||14)
const al=b.alerts===undefined?a.u.alerts:(b.alerts?1:0)
await c.env.DB.prepare('update pm_users set lock_min=?,keep_days=?,ttl_days=?,alerts=? where id=?').bind(lm,kd,td,al,a.u.id).run()
await purge(c.env,{...a.u,keep_days:kd})
await logAct(c,a.u.id,'settings','Security settings changed')
return{ok:true}
},O)
r.add('POST','/api/pmail/2fa/setup',async c=>{
const a=await auth(c)
real(a)
limit('pm2:'+a.u.id,10,600000)
const b=await body(c.req)
if(!await pwOk(a.u,b.password))fail(403,'Password is wrong')
if(a.u.totp_on)fail(409,'Two-factor authentication is already on')
const secret=newSecret()
await c.env.DB.prepare('update pm_users set totp_secret=?,totp_last=0 where id=?').bind(await lock(await aesKey(unhex(await srvKey(c.env)),['encrypt']),enc.encode(secret)),a.u.id).run()
return{secret,uri:'otpauth://totp/PMail:'+encodeURIComponent(addrOf(c.env,a.u.local))+'?secret='+secret+'&issuer=PMail&algorithm=SHA1&digits=6&period=30'}
},O)
const backupCodes=()=>Array.from({length:8},()=>randHex(4).replace(/(.{4})(.{4})/,'$1-$2'))
async function setBackup(env,uid,codes){
await env.DB.prepare('update pm_users set backup_hashes=? where id=?').bind(JSON.stringify(await Promise.all(codes.map(x=>sha(x)))),uid).run()
}
r.add('POST','/api/pmail/2fa/enable',async c=>{
const a=await auth(c)
real(a)
limit('pm2:'+a.u.id,10,600000)
const b=await body(c.req)
if(a.u.totp_on)fail(409,'Two-factor authentication is already on')
if(!a.u.totp_secret)fail(400,'Start setup first')
if(!await second(c.env,a.u,b.code))fail(400,'That code is not valid. Check the time on your phone and try again.')
const codes=backupCodes()
await c.env.DB.prepare('update pm_users set totp_on=1 where id=?').bind(a.u.id).run()
await setBackup(c.env,a.u.id,codes)
await logAct(c,a.u.id,'2fa_on','Two-factor authentication turned on')
await alert(c,a.u,'Two-factor authentication is on','Two-factor authentication was turned on for your PMail address.')
return{backup_codes:codes}
},O)
r.add('POST','/api/pmail/2fa/disable',async c=>{
const a=await auth(c)
real(a)
limit('pm2:'+a.u.id,10,600000)
const b=await body(c.req)
if(!await pwOk(a.u,b.password))fail(403,'Password is wrong')
if(!a.u.totp_on)fail(409,'Two-factor authentication is off')
if(!await second(c.env,a.u,b.code))fail(403,'That code is not valid')
await c.env.DB.prepare('update pm_users set totp_on=0,totp_secret=null,backup_hashes=null where id=?').bind(a.u.id).run()
await logAct(c,a.u.id,'2fa_off','Two-factor authentication turned off')
await alert(c,a.u,'Two-factor authentication is off','Two-factor authentication was turned off for your PMail address.')
return{ok:true}
},O)
r.add('POST','/api/pmail/2fa/backup',async c=>{
const a=await auth(c)
real(a)
limit('pm2:'+a.u.id,10,600000)
const b=await body(c.req)
if(!await pwOk(a.u,b.password))fail(403,'Password is wrong')
if(!a.u.totp_on)fail(409,'Turn on two-factor authentication first')
if(!await second(c.env,a.u,b.code))fail(403,'That code is not valid')
const codes=backupCodes()
await setBackup(c.env,a.u.id,codes)
await logAct(c,a.u.id,'backup_regen','New backup codes created')
return{backup_codes:codes}
},O)
r.add('POST','/api/pmail/recovery',async c=>{
const a=await auth(c)
real(a)
limit('pmrc:'+a.u.id,5,3600000)
const b=await body(c.req)
const pw=String(b.password||'').slice(0,200)
if(!await pwOk(a.u,pw))fail(403,'Password is wrong')
if(a.u.totp_on&&!await second(c.env,a.u,b.code))fail(403,'Enter a valid authenticator or backup code')
let pkcs8
try{pkcs8=await unlock(await pwKey(pw,a.u.kdf_salt,['decrypt']),a.u.priv_enc)}catch{fail(403,'Password is wrong')}
const rec=randHex(10).match(/.{5}/g).join('-'),rs=randHex(16)
await c.env.DB.prepare('update pm_users set rec_salt=?,priv_rec=? where id=?').bind(rs,await lock(await pwKey(rec,rs,['encrypt']),pkcs8),a.u.id).run()
await logAct(c,a.u.id,'recovery_regen','New recovery code created')
await alert(c,a.u,'A new recovery code was created','A new PMail recovery code was created. The old one no longer works.')
return{recovery:rec}
},O)
r.add('GET','/api/pmail/activity',async c=>{
const a=await auth(c)
const q=await c.env.DB.prepare('select ts,kind,detail from pm_activity where user_id=? order by ts desc limit 100').bind(a.u.id).all()
return{items:q.results||[]}
},O)
}
