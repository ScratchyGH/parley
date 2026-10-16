import{enc}from'./util.js'
let cache=null
const b64=b=>{let s='';for(const x of new Uint8Array(b))s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function load(env){
if(cache)return cache
let jwk=null
if(env.SIGNING_JWK)jwk=JSON.parse(env.SIGNING_JWK)
else{
let r=await env.DB.prepare("select v from app_settings where k='signing_jwk'").first()
if(!r){
const kp=await crypto.subtle.generateKey('Ed25519',true,['sign','verify'])
const j=await crypto.subtle.exportKey('jwk',kp.privateKey)
await env.DB.prepare("insert or ignore into app_settings(k,v) values('signing_jwk',?)").bind(JSON.stringify(j)).run()
r=await env.DB.prepare("select v from app_settings where k='signing_jwk'").first()
}
jwk=JSON.parse(r.v)
}
const key=await crypto.subtle.importKey('jwk',jwk,'Ed25519',false,['sign'])
cache={key,pub:jwk.x}
return cache
}
export const canon=m=>`p1\n${m.id}\n${m.room}\n${m.author_id}\n${m.created_at}\n${m.edited_at||0}\n${m.content}`
export async function signMsg(env,m){
const k=await load(env)
return b64(await crypto.subtle.sign('Ed25519',k.key,enc.encode(canon(m))))
}
export async function pubKey(env){return(await load(env)).pub}
