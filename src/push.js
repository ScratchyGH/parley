import{fail,now,newId,body,json,limit,enc,placeholders}from'./util.js'
const b64u=b=>{let s='';for(const x of new Uint8Array(b))s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
const unb64u=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)),c=>c.charCodeAt(0))
const cat=(...a)=>{const o=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let i=0;for(const x of a){o.set(x,i);i+=x.length}return o}
let vk=null
async function vapid(env){
if(!env.VAPID_PRIVATE_JWK)return null
if(vk)return vk
const jwk=JSON.parse(env.VAPID_PRIVATE_JWK)
vk={key:await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']),pub:b64u(cat(new Uint8Array([4]),unb64u(jwk.x),unb64u(jwk.y)))}
return vk
}
const hkdf=async(key,salt,info,len)=>{
const k=await crypto.subtle.importKey('raw',key,'HKDF',false,['deriveBits'])
return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,len*8))
}
export async function encryptPayload(uaPub,authSecret,data){
const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits'])
const asPub=new Uint8Array(await crypto.subtle.exportKey('raw',kp.publicKey))
const ua=await crypto.subtle.importKey('raw',uaPub,{name:'ECDH',namedCurve:'P-256'},false,[])
const secret=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:ua},kp.privateKey,256))
const ikm=await hkdf(secret,authSecret,cat(enc.encode('WebPush: info\0'),uaPub,asPub),32)
const salt=crypto.getRandomValues(new Uint8Array(16))
const cek=await hkdf(ikm,salt,enc.encode('Content-Encoding: aes128gcm\0'),16)
const nonce=await hkdf(ikm,salt,enc.encode('Content-Encoding: nonce\0'),12)
const ak=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt'])
const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},ak,cat(data,new Uint8Array([2]))))
const rs=new Uint8Array(4);new DataView(rs.buffer).setUint32(0,4096)
return cat(salt,rs,new Uint8Array([asPub.length]),asPub,ct)
}
async function jwt(env,aud){
const v=await vapid(env)
const head=b64u(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'})))
const pay=b64u(enc.encode(JSON.stringify({aud,exp:Math.floor(now()/1000)+43200,sub:env.VAPID_SUBJECT||'mailto:admin@localhost.invalid'})))
const sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},v.key,enc.encode(head+'.'+pay)))
return`${head}.${pay}.${b64u(sig)}`
}
export async function pushTo(env,userIds,payload){
if(!env.VAPID_PRIVATE_JWK||!userIds.length)return
try{
const ids=userIds.slice(0,10)
const subs=(await env.DB.prepare(`select * from push_subs where user_id in (${placeholders(ids)}) limit 12`).bind(...ids).all()).results
if(!subs.length)return
const v=await vapid(env)
const data=enc.encode(JSON.stringify(payload).slice(0,3000))
const dead=[]
await Promise.all(subs.map(async s=>{
try{
const body=await encryptPayload(unb64u(s.p256dh),unb64u(s.auth),data)
const aud=new URL(s.endpoint).origin
const res=await fetch(s.endpoint,{method:'POST',headers:{authorization:`vapid t=${await jwt(env,aud)}, k=${v.pub}`,'content-encoding':'aes128gcm','content-type':'application/octet-stream',ttl:'3600',urgency:'normal'},body})
if(res.status===404||res.status===410)dead.push(s.id)
}catch{}
}))
if(dead.length)await env.DB.prepare(`delete from push_subs where id in (${placeholders(dead)})`).bind(...dead).run()
}catch{}
}
export default function(r){
r.add('GET','/api/push/key',async c=>{
const v=await vapid(c.env)
return v?{enabled:true,key:v.pub}:{enabled:false}
})
r.add('POST','/api/push/subscribe',async c=>{
if(!c.env.VAPID_PRIVATE_JWK)fail(501,'Push notifications are not configured on this server')
limit('push:'+c.user.id,20,600000)
const b=await body(c.req,4000)
let u
try{u=new URL(b.endpoint)}catch{fail(400,'Invalid endpoint')}
if(u.protocol!=='https:')fail(400,'Invalid endpoint')
const p=b.keys&&b.keys.p256dh,a=b.keys&&b.keys.auth
if(typeof p!=='string'||typeof a!=='string'||p.length>200||a.length>60)fail(400,'Invalid keys')
const n=await c.env.DB.prepare('select count(*) n from push_subs where user_id=?').bind(c.user.id).first()
if(n.n>=8)fail(409,'Too many devices registered')
await c.env.DB.prepare('insert into push_subs(id,user_id,endpoint,p256dh,auth,created_at) values(?,?,?,?,?,?) on conflict(endpoint) do update set user_id=excluded.user_id,p256dh=excluded.p256dh,auth=excluded.auth').bind(newId('ps'),c.user.id,b.endpoint,p,a,now()).run()
return json({ok:true},201)
})
r.add('POST','/api/push/unsubscribe',async c=>{
const b=await body(c.req,2000)
await c.env.DB.prepare('delete from push_subs where user_id=? and endpoint=?').bind(c.user.id,String(b.endpoint||'')).run()
return{ok:true}
})
}
