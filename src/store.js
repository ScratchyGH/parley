const CH=1048576
const PART_CHUNKS=16
const toU8=v=>v instanceof ArrayBuffer?new Uint8Array(v):ArrayBuffer.isView(v)?new Uint8Array(v.buffer,v.byteOffset,v.byteLength):Uint8Array.from(v)
async function readAll(src){
if(src instanceof ArrayBuffer)return new Uint8Array(src)
if(ArrayBuffer.isView(src))return toU8(src)
return new Uint8Array(await new Response(src).arrayBuffer())
}
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
async function insertChunks(db,key,first,u8){
const st=[]
for(let i=0;i*CH<u8.length;i++)st.push(db.prepare('insert or replace into blob_chunks(key,idx,data) values(?,?,?)').bind(key,first+i,u8.slice(i*CH,(i+1)*CH).buffer))
for(let i=0;i<st.length;i+=25)await db.batch(st.slice(i,i+25))
}
async function sizeOf(db,key){
const r=await db.prepare('select coalesce(sum(length(data)),0) s,count(*) n from blob_chunks where key=?').bind(key).first()
return r&&r.n?r.s:null
}
const ready=new WeakSet()
async function ensure(db){
if(ready.has(db))return
await db.exec('create table if not exists blob_chunks(key text not null,idx integer not null,data blob not null,primary key(key,idx)) without rowid')
ready.add(db)
}
const hash=k=>{let h=2166136261;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function d1Store(env){
const extra=[]
for(let i=1;i<=8;i++)if(env['BLOB'+i])extra.push(env['BLOB'+i])
const all=extra.length?[...extra,env.DB]:[env.DB]
const homeOf=k=>{const d=extra.length?extra[hash(k)%extra.length]:env.DB;return[d,...all.filter(x=>x!==d)]}
const find=async k=>{
for(const d of homeOf(k)){await ensure(d);const n=await sizeOf(d,k);if(n!==null)return{db:d,size:n}}
return null
}
const self={
async put(key,buf,opts){
const db=homeOf(key)[0]
await ensure(db)
const u8=toU8(buf)
const sum=await crypto.subtle.digest('SHA-256',u8)
if(opts&&opts.sha256){
const hex=[...new Uint8Array(sum)].map(b=>b.toString(16).padStart(2,'0')).join('')
if(hex!==opts.sha256)throw new Error('checksum')
}
await db.prepare('delete from blob_chunks where key=?').bind(key).run()
await insertChunks(db,key,0,u8)
return{size:u8.length,checksums:{sha256:sum}}
},
async get(key,o){
const f=await find(key)
if(!f)return null
const{db,size}=f
const r=o&&o.range?parseRange(o.range,size):null
const off=r?r.offset:0
const len=r?r.length:size
const lo=Math.floor(off/CH),hi=Math.floor((off+len-1)/CH)
const rows=(await db.prepare('select idx,data from blob_chunks where key=? and idx between ? and ? order by idx').bind(key,lo,hi).all()).results
const out=new Uint8Array(len)
for(const row of rows){
const d=toU8(row.data)
const start=row.idx*CH
const from=Math.max(off,start),to=Math.min(off+len,start+d.length)
if(to>from)out.set(d.subarray(from-start,to-start),from-off)
}
const res={body:out,size,arrayBuffer:async()=>out.buffer}
if(r)res.range={offset:off,length:len}
return res
},
async delete(key){
for(const d of all){await ensure(d);await d.prepare('delete from blob_chunks where key=?').bind(key).run()}
},
async createMultipartUpload(){return{uploadId:'d1'}},
resumeMultipartUpload(key){
return{
async uploadPart(n,src){
const u8=await readAll(src)
const db=homeOf(key)[0]
await ensure(db)
await insertChunks(db,key,(n-1)*PART_CHUNKS,u8)
return{etag:String(n)}
},
async complete(){
const f=await find(key)
const o=await self.get(key)
return{size:f?f.size:0,checksums:{sha256:o?await crypto.subtle.digest('SHA-256',o.body):undefined}}
},
async abort(){await self.delete(key)}
}
}
}
return self
}
