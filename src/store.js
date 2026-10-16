const CH=1048576
const FCH=524288
const PART_BYTES=16*1048576
const toU8=v=>v instanceof ArrayBuffer?new Uint8Array(v):ArrayBuffer.isView(v)?new Uint8Array(v.buffer,v.byteOffset,v.byteLength):Uint8Array.from(v)
async function readAll(src){
if(src instanceof ArrayBuffer)return new Uint8Array(src)
if(ArrayBuffer.isView(src))return toU8(src)
return new Uint8Array(await new Response(src).arrayBuffer())
}
const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));return btoa(s)}
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0))
const hexOf=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')
function parseRange(h,size){
if(!h)return null
if(typeof h.get==='function'){
const m=/^bytes=(\d*)-(\d*)$/.exec(h.get('range')||'')
if(!m||(m[1]===''&&m[2]===''))return null
let a,b
if(m[1]===''){a=Math.max(0,size-parseInt(m[2]));b=size-1}
else{a=parseInt(m[1]);b=m[2]===''?size-1:Math.min(parseInt(m[2]),size-1)}
if(a>b||a>=size)return null
return{offset:a,length:b-a+1}
}
const o=h.offset??0
return{offset:o,length:Math.min(h.length??size-o,size-o)}
}
const hash=k=>{let h=2166136261;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}

const ready=new WeakSet()
async function ensure(db){
if(ready.has(db))return
await db.exec('create table if not exists blob_chunks(key text not null,idx integer not null,data blob not null,primary key(key,idx)) without rowid')
ready.add(db)
}
function sqlBackend(db){
return{
async putPart(key,n,u8){
await ensure(db)
const first=(n-1)*(PART_BYTES/CH)
const st=[]
for(let i=0;i*CH<u8.length;i++)st.push(db.prepare('insert or replace into blob_chunks(key,idx,data) values(?,?,?)').bind(key,first+i,u8.slice(i*CH,(i+1)*CH).buffer))
for(let i=0;i<st.length;i+=25)await db.batch(st.slice(i,i+25))
},
async read(key,off,len){
await ensure(db)
const lo=Math.floor(off/CH),hi=Math.floor((off+len-1)/CH)
const rows=(await db.prepare('select idx,data from blob_chunks where key=? and idx between ? and ? order by idx').bind(key,lo,hi).all()).results
if(!rows.length)return null
const out=new Uint8Array(len)
for(const row of rows){
const d=toU8(row.data)
const start=row.idx*CH
const from=Math.max(off,start),to=Math.min(off+len,start+d.length)
if(to>from)out.set(d.subarray(from-start,to-start),from-off)
}
return out
},
async remove(key){await ensure(db);await db.prepare('delete from blob_chunks where key=?').bind(key).run()}
}
}

function supabaseBackend(env){
const base=env.SUPABASE_URL.replace(/\/$/,'')+'/storage/v1'
const bucket=env.SUPABASE_BUCKET||'parley'
const hd={authorization:'Bearer '+env.SUPABASE_KEY,apikey:env.SUPABASE_KEY}
const path=k=>k.split('/').map(encodeURIComponent).join('/')
return{
async putPart(key,n,u8){
if(n!==1)throw new Error('object backend holds single part files')
const r=await fetch(`${base}/object/${bucket}/${path(key)}`,{method:'POST',headers:{...hd,'x-upsert':'true','content-type':'application/octet-stream'},body:u8})
if(!r.ok)throw new Error('supabase '+r.status)
},
async read(key,off,len){
const r=await fetch(`${base}/object/authenticated/${bucket}/${path(key)}`,{headers:{...hd,range:`bytes=${off}-${off+len-1}`}})
if(r.status===404||r.status===400)return null
if(!r.ok)throw new Error('supabase '+r.status)
const u8=new Uint8Array(await r.arrayBuffer())
return r.status===206?u8:u8.subarray(off,off+len)
},
async remove(key){
const r=await fetch(`${base}/object/${bucket}/${path(key)}`,{method:'DELETE',headers:hd})
if(!r.ok&&r.status!==404&&r.status!==400)throw new Error('supabase '+r.status)
}
}
}

let fbToken=null
const pem=s=>Uint8Array.from(atob(s.replace(/-----[^-]+-----/g,'').replace(/\s+/g,'')),c=>c.charCodeAt(0))
const urlb64=u8=>b64(u8).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
async function firebaseToken(env,sa){
if(fbToken&&fbToken.exp>Date.now()+60000)return fbToken.tok
const enc=new TextEncoder()
const iat=Math.floor(Date.now()/1000)
const head=urlb64(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'})))
const aud=env.FIREBASE_TOKEN_URL||'https://oauth2.googleapis.com/token'
const claim=urlb64(enc.encode(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/datastore',aud,iat,exp:iat+3600})))
const key=await crypto.subtle.importKey('pkcs8',pem(sa.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign'])
const sig=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(head+'.'+claim)))
const r=await fetch(aud,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'grant_type='+encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')+'&assertion='+head+'.'+claim+'.'+urlb64(sig)})
if(!r.ok)throw new Error('firebase auth '+r.status)
const j=await r.json()
fbToken={tok:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000}
return fbToken.tok
}
function firestoreBackend(env){
const sa=JSON.parse(env.FIREBASE_SA)
const host=(env.FIRESTORE_HOST||'https://firestore.googleapis.com').replace(/\/$/,'')
const root=`projects/${sa.project_id}/databases/(default)/documents`
const id=(k,i)=>k.replace(/[^A-Za-z0-9_-]/g,'_')+'_'+i
const name=(k,i)=>`${root}/parley_blobs/${id(k,i)}`
async function call(path,body){
const tok=await firebaseToken(env,sa)
const r=await fetch(`${host}/v1/${path}`,{method:'POST',headers:{authorization:'Bearer '+tok,'content-type':'application/json'},body:JSON.stringify(body)})
if(!r.ok)throw new Error('firestore '+r.status+' '+(await r.text()).slice(0,200))
return r.json()
}
async function manifest(key){
const tok=await firebaseToken(env,sa)
const r=await fetch(`${host}/v1/${name(key,'m')}`,{headers:{authorization:'Bearer '+tok}})
if(r.status===404)return null
if(!r.ok)throw new Error('firestore '+r.status)
const j=await r.json()
return parseInt(j.fields.n.integerValue)
}
return{
async putPart(key,n,u8){
if(n!==1)throw new Error('object backend holds single part files')
const count=Math.max(1,Math.ceil(u8.length/FCH))
const writes=[]
for(let i=0;i<count;i++)writes.push({update:{name:name(key,i),fields:{d:{bytesValue:b64(u8.subarray(i*FCH,(i+1)*FCH))}}}})
for(let i=0;i<writes.length;i+=6)await call(`${root}:commit`,{writes:writes.slice(i,i+6)})
await call(`${root}:commit`,{writes:[{update:{name:name(key,'m'),fields:{n:{integerValue:String(count)}}}}]})
},
async read(key,off,len){
const lo=Math.floor(off/FCH),hi=Math.floor((off+len-1)/FCH)
const names=[];for(let i=lo;i<=hi;i++)names.push(name(key,i))
const out=new Uint8Array(len)
let found=0
for(let g=0;g<names.length;g+=8){
const res=await call(`${root}:batchGet`,{documents:names.slice(g,g+8)})
for(const e of res){
if(!e.found)continue
found++
const nm=e.found.name
const i=parseInt(nm.slice(nm.lastIndexOf('_')+1))
const d=unb64(e.found.fields.d.bytesValue||'')
const start=i*FCH
const from=Math.max(off,start),to=Math.min(off+len,start+d.length)
if(to>from)out.set(d.subarray(from-start,to-start),from-off)
}
}
return found?out:null
},
async remove(key){
const n=await manifest(key)
if(n===null)return
const writes=[{delete:name(key,'m')}]
for(let i=0;i<n;i++)writes.push({delete:name(key,i)})
for(let i=0;i<writes.length;i+=100)await call(`${root}:commit`,{writes:writes.slice(i,i+100)})
}
}
}

export function place(env,key,len){
if(env.FILES&&!env.FILES.shim)return key
const c=[]
if(len<=PART_BYTES){
if(env.SUPABASE_URL&&env.SUPABASE_KEY)c.push('s')
if(env.FIREBASE_SA)c.push('f')
}
let blobs=0
for(let i=1;i<=8;i++)if(env['BLOB'+i]){c.push('b'+i);blobs++}
if(env.TURSO_URL||!blobs)c.push('d')
return c[hash(key)%c.length]+'~'+key
}

export function d1Store(env){
const cache={}
const resolve=full=>{
const m=/^([a-z0-9]+)~(.*)$/.exec(full)
const tag=m?m[1]:'d'
const key=m?m[2]:full
if(!cache[tag]){
if(tag==='s')cache[tag]=supabaseBackend(env)
else if(tag==='f')cache[tag]=firestoreBackend(env)
else if(/^b\d$/.test(tag)&&env['BLOB'+tag[1]])cache[tag]=sqlBackend(env['BLOB'+tag[1]])
else cache[tag]=sqlBackend(env.DB)
}
return{be:cache[tag],key}
}
const self={
shim:true,
async put(full,buf,opts){
const{be,key}=resolve(full)
const u8=toU8(buf)
const sum=await crypto.subtle.digest('SHA-256',u8)
if(opts&&opts.sha256&&hexOf(sum)!==opts.sha256)throw new Error('checksum')
await be.remove(key)
await be.putPart(key,1,u8)
return{size:u8.length,checksums:{sha256:sum}}
},
async get(full,o){
const{be,key}=resolve(full)
const size=o&&o.size
const r=o&&o.range?parseRange(o.range,size):null
const off=r?r.offset:0
const len=r?r.length:size
const out=await be.read(key,off,len)
if(!out)return null
const res={body:out,size,arrayBuffer:async()=>out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength)}
if(r)res.range={offset:off,length:len}
return res
},
async delete(full){const{be,key}=resolve(full);await be.remove(key)},
async createMultipartUpload(){return{uploadId:'d1'}},
resumeMultipartUpload(full){
const{be,key}=resolve(full)
return{
async uploadPart(n,src){
await be.putPart(key,n,await readAll(src))
return{etag:String(n)}
},
async complete(list,size){
const o=await be.read(key,0,size)
return{size:o?o.length:0,checksums:{sha256:o?await crypto.subtle.digest('SHA-256',o):undefined}}
},
async abort(){await be.remove(key)}
}
}
}
return self
}
