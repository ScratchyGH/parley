import{fail,now,randHex,sha,pbkdf2,safeEq,str,limit,body,json,newId,enc,unhex}from'./util.js'
const dec=new TextDecoder()
export const DOMAIN='pmail.parley'
export const domain=()=>DOMAIN
const OWNER_LOCAL='parley'
const RESERVED=new Set(['parley','admin','administrator','postmaster','abuse','support','security','noreply','no-reply','root','mailer-daemon','pmail','help','staff','system','webmaster','hostmaster','info','contact'])
const LOCAL=/^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])$/
const FOLDERS=['inbox','sent','archive','trash']
const TTL=14*86400000
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
async function ownerBox(env){
let u=await env.DB.prepare('select id,local,display,pub,prefs,priv_enc from pm_users where local=?').bind(OWNER_LOCAL).first()
if(u)return u
const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey'])
const pkcs8=new Uint8Array(await crypto.subtle.exportKey('pkcs8',kp.privateKey))
const pub=b64(new Uint8Array(await crypto.subtle.exportKey('raw',kp.publicKey)))
let k=await env.DB.prepare("select v from app_settings where k='pmail_owner_key'").first()
if(!k){await env.DB.prepare("insert or ignore into app_settings(k,v) values('pmail_owner_key',?)").bind(randHex(32)).run();k=await env.DB.prepare("select v from app_settings where k='pmail_owner_key'").first()}
const id=newId('pu')
const none=randHex(16)
await env.DB.prepare('insert or ignore into pm_users(id,local,display,pass_salt,pass_hash,pass_iters,kdf_salt,pub,priv_enc,rec_salt,priv_rec,prefs,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,OWNER_LOCAL,'Parley',none,randHex(32),ITERS,none,pub,await lock(await aesKey(unhex(k.v),['encrypt']),pkcs8),none,'-','{}',now()).run()
return env.DB.prepare('select id,local,display,pub,prefs,priv_enc from pm_users where local=?').bind(OWNER_LOCAL).first()
}
async function ownerPriv(env,u){
const k=await env.DB.prepare("select v from app_settings where k='pmail_owner_key'").first()
return unlock(await aesKey(unhex(k.v),['decrypt']),u.priv_enc)
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
await c.env.DB.prepare('insert into pm_sessions(id,user_id,priv_sess,label,created_at,expires_at) values(?,?,?,?,?,?)').bind(id,u.id,await lock(await tokKey(tok,['encrypt']),priv),labelOf(c.req.headers.get('user-agent')),now(),now()+TTL).run()
await c.env.DB.prepare('delete from pm_sessions where user_id=? and expires_at<?').bind(u.id,now()).run()
return tok
}
async function auth(c){
const tok=cookieOf(c.req,'pm')
if(!tok)fail(401,'Not signed in')
const id=await sha('pm:'+tok)
const s=await c.env.DB.prepare('select * from pm_sessions where id=?').bind(id).first()
if(!s||s.expires_at<now())fail(401,'Not signed in')
const u=await c.env.DB.prepare('select * from pm_users where id=?').bind(s.user_id).first()
if(!u)fail(401,'Not signed in')
let priv
try{priv=await ecKey(await unlock(await tokKey(tok,['decrypt']),s.priv_sess))}catch{fail(401,'Not signed in')}
return{u,priv,sid:id,prefs:cleanPrefs(jparse(u.prefs,{}))}
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
return{address:addrOf(c.env,a.u.local),local:a.u.local,display:a.u.display,domain:domain(c.env),prefs:a.prefs,aliases:await mine(c.env,a.u.id),counts}
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
await deliver(c.env,{id,pub,prefs:'{}'},{from:'parley@'+domain(c.env),fn:'PMail',to:[addrOf(c.env,l)],toOne:addrOf(c.env,l),s:'Welcome to PMail',b:'Your address is '+addrOf(c.env,l)+'.\n\nWhat PMail does:\n- Messages are plain text only, so nothing can load a tracking pixel or remote image.\n- Links are shown in full with tracking parameters stripped.\n- There are no read receipts and no last-seen times.\n- Every message is encrypted for you before it is stored. Only your password (or your recovery code) can open your mailbox.\n- Create throwaway aliases in Settings, Addresses. Anything sent to '+l+'+anything@'+domain(c.env)+' also reaches you.\n\nKeep your recovery code somewhere safe. It is the only way back in if you forget your password.',ts:now()})
return json({ok:true,address:addrOf(c.env,l),recovery:rec},200,{'set-cookie':setCookie(c.url,tok,TTL/1000)})
},O)
r.add('POST','/api/pmail/login',async c=>{
const b=await body(c.req)
const l=String(b.address||'').trim().toLowerCase().replace(/@.*$/,'')
if(l===OWNER_LOCAL)fail(403,'This mailbox opens from the Parley owner account')
limit('pml:'+ipOf(c),20,600000)
limit('pml:'+l,8,600000)
const u=await c.env.DB.prepare('select * from pm_users where local=?').bind(l).first()
const pw=String(b.password||'').slice(0,200)
const hash=await pbkdf2(pw,u?u.pass_salt:randHex(16),u?u.pass_iters:ITERS)
if(!u||!safeEq(hash,u.pass_hash))fail(403,'Wrong address or password')
let pkcs8
try{pkcs8=await unlock(await pwKey(pw,u.kdf_salt,['decrypt']),u.priv_enc)}catch{fail(403,'Wrong address or password')}
const tok=await newSession(c,u,pkcs8)
return json({ok:true},200,{'set-cookie':setCookie(c.url,tok,TTL/1000)})
},O)
const isOwner=c=>String(c.user&&c.user.username||'').toLowerCase()===String(c.env.OWNER_USERNAME||'ParleyOfficial').toLowerCase()
r.add('GET','/api/pmail/owner-status',async c=>({owner:isOwner(c)}),{auth:true})
r.add('POST','/api/pmail/owner-open',async c=>{
if(!isOwner(c))fail(403,'Only the Parley owner can open this mailbox')
const u=await ownerBox(c.env)
const tok=await newSession(c,u,await ownerPriv(c.env,u))
return json({ok:true},200,{'set-cookie':setCookie(c.url,tok,TTL/1000)})
},{auth:true})
r.add('POST','/api/pmail/logout',async c=>{
const t=cookieOf(c.req,'pm')
if(t)await c.env.DB.prepare('delete from pm_sessions where id=?').bind(await sha('pm:'+t)).run()
return json({ok:true},200,{'set-cookie':setCookie(c.url,'',0)})
},O)
r.add('GET','/api/pmail/me',async c=>meOut(c,await auth(c)),O)
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
const q=await c.env.DB.prepare('select id,label,created_at,expires_at from pm_sessions where user_id=? and expires_at>? order by created_at desc').bind(a.u.id,now()).all()
return{sessions:(q.results||[]).map(s=>({id:s.id.slice(0,16),label:s.label,created_at:s.created_at,current:s.id===a.sid}))}
},O)
r.add('POST','/api/pmail/sessions/revoke',async c=>{
const a=await auth(c)
const b=await body(c.req)
if(b.id){
const all=(await c.env.DB.prepare('select id from pm_sessions where user_id=?').bind(a.u.id).all()).results||[]
const hit=all.find(s=>s.id.slice(0,16)===String(b.id)&&s.id!==a.sid)
if(hit)await c.env.DB.prepare('delete from pm_sessions where id=?').bind(hit.id).run()
}else await c.env.DB.prepare('delete from pm_sessions where user_id=? and id!=?').bind(a.u.id,a.sid).run()
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
if(!safeEq(await pbkdf2(cur,a.u.pass_salt,a.u.pass_iters),a.u.pass_hash))fail(403,'Current password is wrong')
const next=str(b.next,10,200,'New password')
let pkcs8
try{pkcs8=await unlock(await pwKey(cur,a.u.kdf_salt,['decrypt']),a.u.priv_enc)}catch{fail(403,'Current password is wrong')}
await rewrap(c,a,a.u,pkcs8,next)
await c.env.DB.prepare('delete from pm_sessions where user_id=? and id!=?').bind(a.u.id,a.sid).run()
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
try{if(!u||!code)throw 0;pkcs8=await unlock(await pwKey(code,u.rec_salt,['decrypt']),u.priv_rec)}catch{fail(403,'That recovery code does not match')}
await rewrap(c,null,u,pkcs8,next)
await c.env.DB.prepare('delete from pm_sessions where user_id=?').bind(u.id).run()
return{ok:true}
},O)
r.add('POST','/api/pmail/destroy',async c=>{
const a=await auth(c)
limit('pmd:'+a.u.id,4,3600000)
const b=await body(c.req)
if(!safeEq(await pbkdf2(String(b.password||'').slice(0,200),a.u.pass_salt,a.u.pass_iters),a.u.pass_hash))fail(403,'Password is wrong')
await c.env.DB.batch(['pm_msgs','pm_alias','pm_sessions'].map(t=>c.env.DB.prepare('delete from '+t+' where user_id=?').bind(a.u.id)).concat([c.env.DB.prepare('delete from pm_users where id=?').bind(a.u.id)]))
return json({ok:true},200,{'set-cookie':setCookie(c.url,'',0)})
},O)
}
