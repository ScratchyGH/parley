import{fail,now,newId,randHex,sha,pbkdf2,str,limit,body,json,safeEq}from'./util.js'
import{nameProblem,claimOwner,claimStmt}from'./names.js'
import{sessionUser,makeSession,ip,iters,recoveryCode,me,isOwner}from'./auth.js'

const PROV={
github:{name:'GitHub',auth:'https://github.com/login/oauth/authorize',token:'https://github.com/login/oauth/access_token',user:'https://api.github.com/user',scope:'read:user',pick:j=>({id:String(j.id),name:j.login,label:j.login})},
google:{name:'Google',auth:'https://accounts.google.com/o/oauth2/v2/auth',token:'https://oauth2.googleapis.com/token',user:'https://openidconnect.googleapis.com/v1/userinfo',scope:'openid profile',pick:j=>({id:String(j.sub),name:(j.given_name||j.name||'user'),label:j.name||'Google account'})},
discord:{name:'Discord',auth:'https://discord.com/oauth2/authorize',token:'https://discord.com/api/oauth2/token',user:'https://discord.com/api/users/@me',scope:'identify',pick:j=>({id:String(j.id),name:j.username,label:j.global_name||j.username})}
}
const cfg=(env,p)=>{
const d=PROV[p]
if(!d)return null
const U=p.toUpperCase()
const id=env['OAUTH_'+U+'_ID'],secret=env['OAUTH_'+U+'_SECRET']
if(!id||!secret)return null
return{...d,id,secret,auth:env['OAUTH_'+U+'_AUTH_URL']||d.auth,token:env['OAUTH_'+U+'_TOKEN_URL']||d.token,user:env['OAUTH_'+U+'_USER_URL']||d.user}
}
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const unb64u=s=>{
const t=s.replace(/-/g,'+').replace(/_/g,'/')
const bin=atob(t+'='.repeat((4-t.length%4)%4))
return Uint8Array.from(bin,c=>c.charCodeAt(0))
}
function cbor(u8,o=0){
const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength)
const head=()=>{
const b=u8[o++]
const t=b>>5
let n=b&31
if(n===24)n=u8[o++]
else if(n===25){n=dv.getUint16(o);o+=2}
else if(n===26){n=dv.getUint32(o);o+=4}
else if(n>=27)fail(400,'Unsupported data')
return[t,n]
}
const item=()=>{
const[t,n]=head()
if(t===0)return n
if(t===1)return-1-n
if(t===2){const v=u8.slice(o,o+n);o+=n;return v}
if(t===3){const v=new TextDecoder().decode(u8.slice(o,o+n));o+=n;return v}
if(t===4){const a=[];for(let i=0;i<n;i++)a.push(item());return a}
if(t===5){const m=new Map();for(let i=0;i<n;i++){const k=item();m.set(k,item())}return m}
fail(400,'Unsupported data')
}
const v=item()
return[v,o]
}
const derToRaw=der=>{
if(der[0]!==0x30)fail(401,'Bad signature')
let o=2
if(der[1]&0x80)o=2+(der[1]&0x7f)
const out=new Uint8Array(64)
for(let k=0;k<2;k++){
if(der[o]!==0x02)fail(401,'Bad signature')
let l=der[o+1]
let s=der.slice(o+2,o+2+l)
o+=2+l
while(s.length>32&&s[0]===0)s=s.slice(1)
if(s.length>32)fail(401,'Bad signature')
out.set(s,k*32+32-s.length)
}
return out
}
const rpHash=async url=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url.hostname)))
const eqBytes=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i])

async function challenge(c,kind,userId){
const id=b64u(crypto.getRandomValues(new Uint8Array(32)))
await c.env.DB.batch([
c.env.DB.prepare('delete from webauthn_challenges where expires_at<?').bind(now()),
c.env.DB.prepare('insert into webauthn_challenges(id,user_id,kind,expires_at) values(?,?,?,?)').bind(id,userId||null,kind,now()+300000)
])
return id
}
async function takeChallenge(c,id,kind,userId){
const row=await c.env.DB.prepare('select * from webauthn_challenges where id=?').bind(id).first()
await c.env.DB.prepare('delete from webauthn_challenges where id=?').bind(id).run()
if(!row||row.kind!==kind||row.expires_at<now()||(userId&&row.user_id!==userId))fail(400,'That request expired, try again')
}
function clientData(c,raw,type){
let cd
try{cd=JSON.parse(new TextDecoder().decode(raw))}catch{fail(400,'Bad client data')}
if(cd.type!==type||cd.origin!==c.url.origin)fail(400,'Request does not match this site')
return cd
}
const asBytes=(v,n)=>{
if(typeof v!=='string'||v.length>8192)fail(400,n+' is invalid')
try{return unb64u(v)}catch{fail(400,n+' is invalid')}
}

async function newUser(c,want,label){
const clean=String(want||'user').replace(/[^a-zA-Z0-9_.-]/g,'').slice(0,18)
for(let i=0;i<8;i++){
let name=clean.length>=3?clean:'user'+clean
if(i)name=name.slice(0,18)+Math.floor(1000+Math.random()*9000)
if(nameProblem(c.env,name)||await claimOwner(c.env,name))continue
const id=newId('u'),t=now()
try{
await c.env.DB.batch([c.env.DB.prepare('insert into users(id,username,display_name,pass_hash,pass_salt,pass_iters,created_at) values(?,?,?,?,?,?,?)').bind(id,name,String(label||name).slice(0,32)||name,'!','00',1,t),claimStmt(c.env,id,name,t)])
return id
}catch(e){if(!String(e.message).includes('UNIQUE'))throw e}
}
fail(409,'Could not pick a username, sign in another way')
}

const page=(c,msg,extra={})=>new Response(null,{status:302,headers:{location:msg?'/?autherror='+encodeURIComponent(msg):'/',...extra}})
const clearState=c=>`oas=; Path=/api/auth/oauth; HttpOnly; SameSite=Lax; Max-Age=0${c.url.protocol==='https:'?'; Secure':''}`

export default function signinRoutes(r){
r.add('GET','/api/auth/providers',async c=>({oauth:Object.keys(PROV).filter(p=>cfg(c.env,p)).map(p=>({id:p,name:PROV[p].name})),passkeys:true,registration:c.env.REGISTRATION_OPEN!=='false'}),{auth:false})

r.add('GET','/api/auth/oauth/:p/start',async c=>{
limit('oas:'+ip(c),30,900000)
const p=cfg(c.env,c.p.p)
if(!p)return page(c,'That sign-in option is not set up')
const mode=c.url.searchParams.get('mode')==='link'?'link':'login'
if(mode==='link'){
const u=await sessionUser(c.env,c.req)
if(!u||u.is_bot)return page(c,'Sign in first')
}
const state=randHex(16)
const u=new URL(p.auth)
u.searchParams.set('client_id',p.id)
u.searchParams.set('redirect_uri',c.url.origin+'/api/auth/oauth/'+c.p.p+'/callback')
u.searchParams.set('response_type','code')
u.searchParams.set('scope',p.scope)
u.searchParams.set('state',state)
return new Response(null,{status:302,headers:{location:u.href,'set-cookie':`oas=${state}.${mode}; Path=/api/auth/oauth; HttpOnly; SameSite=Lax; Max-Age=600${c.url.protocol==='https:'?'; Secure':''}`}})
},{auth:false})

r.add('GET','/api/auth/oauth/:p/callback',async c=>{
limit('oac:'+ip(c),30,900000)
const clear={'set-cookie':clearState(c)}
const p=cfg(c.env,c.p.p)
if(!p)return page(c,'That sign-in option is not set up',clear)
const q=c.url.searchParams
const ck=(c.req.headers.get('cookie')||'').match(/(?:^|;\s*)oas=([a-f0-9]{32})\.(login|link)/)
if(q.get('error'))return page(c,'Sign-in was cancelled',clear)
if(!ck||!q.get('state')||!safeEq(q.get('state'),ck[1])||!q.get('code'))return page(c,'Sign-in expired, try again',clear)
let prof
try{
const tr=await fetch(p.token,{method:'POST',headers:{accept:'application/json','content-type':'application/x-www-form-urlencoded','user-agent':'parley'},body:new URLSearchParams({client_id:p.id,client_secret:p.secret,code:q.get('code'),redirect_uri:c.url.origin+'/api/auth/oauth/'+c.p.p+'/callback',grant_type:'authorization_code'})})
const tj=await tr.json()
if(!tj.access_token)throw new Error('no token')
const ur=await fetch(p.user,{headers:{authorization:'Bearer '+tj.access_token,accept:'application/json','user-agent':'parley'}})
prof=p.pick(await ur.json())
if(!prof.id||prof.id==='undefined')throw new Error('no id')
}catch{return page(c,'Could not complete sign-in with '+p.name,clear)}
const found=await c.env.DB.prepare('select user_id from oauth_identities where provider=? and subject=?').bind(c.p.p,prof.id).first()
if(ck[2]==='link'){
const u=await sessionUser(c.env,c.req)
if(!u||u.is_bot)return page(c,'Sign in first',clear)
if(found&&found.user_id!==u.id)return page(c,'That '+p.name+' account is already linked to another Parley account',clear)
await c.env.DB.prepare('insert or replace into oauth_identities(provider,subject,user_id,label,created_at) values(?,?,?,?,?)').bind(c.p.p,prof.id,u.id,String(prof.label||'').slice(0,60),now()).run()
return page(c,null,clear)
}
let uid
if(found)uid=found.user_id
else{
if(c.env.REGISTRATION_OPEN==='false')return page(c,'Registration is closed',clear)
const existing=await sessionUser(c.env,c.req)
uid=existing&&!existing.is_bot?existing.id:await newUser(c,prof.name,prof.label)
await c.env.DB.prepare('insert into oauth_identities(provider,subject,user_id,label,created_at) values(?,?,?,?,?)').bind(c.p.p,prof.id,uid,String(prof.label||'').slice(0,60),now()).run()
}
const u=await c.env.DB.prepare('select suspended,deleted_at from users where id=?').bind(uid).first()
if(!u||u.deleted_at)return page(c,'That account no longer exists',clear)
if(u.suspended)return page(c,'This account is suspended. You can submit an appeal at /appeal.',clear)
const sc=await makeSession(c,uid)
const h=new Headers({location:'/'})
for(const x of sc)h.append('set-cookie',x)
h.append('set-cookie',clearState(c))
return new Response(null,{status:302,headers:h})
},{auth:false})

r.add('GET','/api/me/security',async c=>{
const ids=(await c.env.DB.prepare('select provider,label,created_at from oauth_identities where user_id=? order by created_at').bind(c.user.id).all()).results
const pks=(await c.env.DB.prepare('select id,name,created_at,last_used from passkeys where user_id=? order by created_at').bind(c.user.id).all()).results
return{identities:ids.map(i=>({...i,name:PROV[i.provider]?.name||i.provider})),passkeys:pks,has_password:c.user.pass_hash!=='!',providers:Object.keys(PROV).filter(p=>cfg(c.env,p)).map(p=>({id:p,name:PROV[p].name}))}
})
const lastMethod=async(c,except)=>{
if(c.user.pass_hash!=='!')return false
const a=await c.env.DB.prepare('select (select count(*) from oauth_identities where user_id=?)+(select count(*) from passkeys where user_id=?) n').bind(c.user.id,c.user.id).first()
return a.n<=1
}
r.add('DELETE','/api/me/identities/:p',async c=>{
if(await lastMethod(c))fail(409,'Set a password or add another sign-in method first')
await c.env.DB.prepare('delete from oauth_identities where provider=? and user_id=?').bind(c.p.p,c.user.id).run()
return{ok:true}
})
r.add('POST','/api/me/setpassword',async c=>{
if(c.user.pass_hash!=='!')fail(409,'You already have a password')
limit('spw:'+c.user.id,5,3600000)
const b=await body(c.req)
const pw=str(b.password,10,200,'Password')
const salt=randHex(16),n=iters(c.env),code=recoveryCode()
await c.env.DB.prepare('update users set pass_hash=?,pass_salt=?,pass_iters=?,recovery_hash=? where id=?').bind(await pbkdf2(pw,salt,n),salt,n,await sha(code),c.user.id).run()
return{recovery_code:code}
})

r.add('POST','/api/me/passkeys/options',async c=>{
limit('pko:'+c.user.id,30,3600000)
const n=await c.env.DB.prepare('select count(*) n from passkeys where user_id=?').bind(c.user.id).first()
if(n.n>=10)fail(409,'You can register up to 10 passkeys')
const existing=(await c.env.DB.prepare('select id from passkeys where user_id=?').bind(c.user.id).all()).results
return{publicKey:{challenge:await challenge(c,'reg',c.user.id),rp:{name:'Parley',id:c.url.hostname},user:{id:b64u(new TextEncoder().encode(c.user.id)),name:c.user.username,displayName:c.user.display_name},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{residentKey:'required',userVerification:'preferred'},excludeCredentials:existing.map(x=>({type:'public-key',id:x.id})),attestation:'none',timeout:120000}}
})
r.add('POST','/api/me/passkeys',async c=>{
limit('pkr:'+c.user.id,30,3600000)
const b=await body(c.req)
const raw=asBytes(b.clientDataJSON,'Client data')
const cd=clientData(c,raw,'webauthn.create')
await takeChallenge(c,cd.challenge,'reg',c.user.id)
const att=cbor(asBytes(b.attestationObject,'Attestation'))[0]
const ad=att instanceof Map?att.get('authData'):null
if(!(ad instanceof Uint8Array)||ad.length<55)fail(400,'Bad attestation')
if(!eqBytes(ad.slice(0,32),await rpHash(c.url)))fail(400,'Request does not match this site')
if(!(ad[32]&1)||!(ad[32]&0x40))fail(400,'The passkey was not confirmed')
const idLen=(ad[53]<<8)|ad[54]
const credId=ad.slice(55,55+idLen)
const key=cbor(ad,55+idLen)[0]
if(!(key instanceof Map)||key.get(1)!==2||key.get(3)!==-7||key.get(-1)!==1)fail(400,'Only ES256 passkeys are supported')
const x=key.get(-2),y=key.get(-3)
if(!(x instanceof Uint8Array)||!(y instanceof Uint8Array)||x.length!==32||y.length!==32)fail(400,'Bad key')
const jwk={kty:'EC',crv:'P-256',x:b64u(x),y:b64u(y)}
const id=b64u(credId)
const name=typeof b.name==='string'&&b.name.trim()?b.name.trim().slice(0,40):'Passkey'
try{await c.env.DB.prepare('insert into passkeys(id,user_id,pub,counter,name,created_at) values(?,?,?,?,?,?)').bind(id,c.user.id,JSON.stringify(jwk),new DataView(ad.buffer,ad.byteOffset+33,4).getUint32(0),name,now()).run()}
catch(e){if(String(e.message).includes('UNIQUE'))fail(409,'That passkey is already registered');throw e}
return json({id,name},201)
})
r.add('DELETE','/api/me/passkeys/:id',async c=>{
if(await lastMethod(c))fail(409,'Set a password or add another sign-in method first')
await c.env.DB.prepare('delete from passkeys where id=? and user_id=?').bind(c.p.id,c.user.id).run()
return{ok:true}
})
r.add('POST','/api/auth/passkey/options',async c=>{
limit('pka:'+ip(c),60,900000)
return{publicKey:{challenge:await challenge(c,'auth',null),rpId:c.url.hostname,userVerification:'preferred',timeout:120000}}
},{auth:false})
r.add('POST','/api/auth/passkey/login',async c=>{
limit('pkl:'+ip(c),30,900000)
const b=await body(c.req)
const raw=asBytes(b.clientDataJSON,'Client data')
const cd=clientData(c,raw,'webauthn.get')
await takeChallenge(c,cd.challenge,'auth',null)
const credId=typeof b.id==='string'&&b.id.length<=1024?b.id:fail(400,'Bad credential')
const row=await c.env.DB.prepare('select p.*,u.suspended,u.deleted_at from passkeys p join users u on u.id=p.user_id where p.id=?').bind(credId).first()
if(!row||row.deleted_at)fail(401,'Passkey not recognised')
const ad=asBytes(b.authenticatorData,'Authenticator data')
if(ad.length<37||!eqBytes(ad.slice(0,32),await rpHash(c.url))||!(ad[32]&1))fail(401,'Passkey check failed')
const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',raw))
const msg=new Uint8Array(ad.length+32)
msg.set(ad);msg.set(hash,ad.length)
const key=await crypto.subtle.importKey('jwk',JSON.parse(row.pub),{name:'ECDSA',namedCurve:'P-256'},false,['verify'])
const good=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,derToRaw(asBytes(b.signature,'Signature')),msg)
if(!good)fail(401,'Passkey check failed')
const ctr=new DataView(ad.buffer,ad.byteOffset+33,4).getUint32(0)
if((ctr||row.counter)&&ctr<=row.counter)fail(401,'Passkey check failed')
if(row.suspended)fail(403,'This account is suspended. You can submit an appeal at /appeal.')
await c.env.DB.prepare('update passkeys set counter=?,last_used=? where id=?').bind(ctr,now(),row.id).run()
const sc=await makeSession(c,row.user_id)
const u=await c.env.DB.prepare('select * from users where id=?').bind(row.user_id).first()
u.owner=isOwner(c.env,u.username)
u.admin=!!u.is_admin||u.owner||(c.env.ADMIN_USERNAMES||'').toLowerCase().split(',').map(s=>s.trim()).includes(u.username.toLowerCase())
return json({user:me(u)},200,{'set-cookie':sc})
},{auth:false})
}
