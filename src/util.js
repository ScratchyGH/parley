export const enc=new TextEncoder()
export const now=()=>Date.now()
const A='0123456789abcdefghijklmnopqrstuvwxyz'
export const rnd=n=>{const b=crypto.getRandomValues(new Uint8Array(n));let s='';for(const x of b)s+=A[x%36];return s}
export const newId=p=>p+'_'+rnd(16)
export const msgId=()=>now().toString(36).padStart(9,'0')+rnd(8)
export const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
export const unhex=s=>new Uint8Array(s.match(/../g).map(h=>parseInt(h,16)))
export const randHex=n=>hex(crypto.getRandomValues(new Uint8Array(n)))
export const sha=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)))
export async function pbkdf2(pw,salt,iters){
const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits'])
return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(salt),iterations:iters},k,256))
}
export function safeEq(a,b){
if(a.length!==b.length)return false
let r=0
for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i)
return r===0
}
export class HttpError extends Error{constructor(s,m){super(m);this.status=s}}
export const fail=(s,m)=>{throw new HttpError(s,m)}
export const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store',...h}})
export const str=(v,min,max,n)=>{
if(typeof v!=='string')fail(400,n+' must be text')
const t=v.trim()
if(t.length<min||t.length>max)fail(400,`${n} must be ${min}-${max} characters`)
return t
}
export const opt=(v,max,n)=>{
if(v==null)return ''
if(typeof v!=='string'||v.length>max)fail(400,n+' is invalid')
return v.trim()
}
export const int=(v,min,max,n)=>{
const x=Number(v)
if(!Number.isInteger(x)||x<min||x>max)fail(400,n+' is invalid')
return x
}
export const color=(v,n)=>{
if(v==null||v==='')return null
if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v))fail(400,n+' must be a hex color')
return v.toLowerCase()
}
export const gradient=(v,n)=>{
if(v==null||v==='')return null
if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}(,#[0-9a-fA-F]{6})?$/.test(v))fail(400,n+' must be one or two hex colors')
return v.toLowerCase()
}
const buckets=new Map()
export function limit(key,max,ms){
const t=now()
let b=buckets.get(key)
if(!b||b.r<t){
b={c:0,r:t+ms}
buckets.set(key,b)
if(buckets.size>5000)for(const[k,v]of buckets)if(v.r<t)buckets.delete(k)
}
if(++b.c>max)fail(429,'Too many requests, slow down')
}
export async function body(req,max=65536){
const ct=req.headers.get('content-type')||''
if(!ct.includes('application/json'))fail(415,'Expected JSON')
const t=await req.text()
if(t.length>max)fail(413,'Request too large')
try{const v=JSON.parse(t);if(!v||typeof v!=='object')fail(400,'Invalid JSON body');return v}catch(e){if(e instanceof HttpError)throw e;fail(400,'Invalid JSON body')}
}
export const placeholders=a=>a.map(()=>'?').join(',')
export const clamp=(v,d,min,max)=>{const x=parseInt(v);return Number.isNaN(x)?d:Math.min(max,Math.max(min,x))}
