const MAX_MSGS=3000
export function mergeSegs(segs,lo,hi){
const out=[]
let a=lo,b=hi
for(const s of[...segs].sort((x,y)=>x[0]<y[0]?-1:1)){
if(s[1]<a||s[0]>b){out.push(s)}
else{a=s[0]<a?s[0]:a;b=s[1]>b?s[1]:b}
}
out.push([a,b])
return out.sort((x,y)=>x[0]<y[0]?-1:1)
}
export function pick(segs,before){
for(const s of segs)if(s[0]<before&&before<=s[1])return s
return null
}
class Base{
async pageBefore(room,before,limit){
const segs=await this.segs(room)
const s=pick(segs,before)
if(!s)return null
const all=await this.msgsBefore(room,before,limit+1,s[0])
if(!all.length)return null
const msgs=all.slice(0,limit).reverse()
const reachedStart=s[0]===''&&all.length<=limit
return{msgs,lo:s[0],end:reachedStart,complete:msgs.length>=limit||reachedStart}
}
}
export class MemoryStore extends Base{
constructor(max=268435456){super();this.m=new Map();this.s=new Map();this.b=new Map();this.max=max;this.clock=0}
async segs(room){return this.s.get(room)||[]}
room(r){let x=this.m.get(r);if(!x){x=new Map();this.m.set(r,x)}return x}
async putMsgs(room,msgs,seg){
const m=this.room(room)
for(const x of msgs){const o=m.get(x.id);if(!o||(x.edited_at||0)>=(o.edited_at||0))m.set(x.id,x)}
if(seg)this.s.set(room,mergeSegs(this.s.get(room)||[],seg[0],seg[1]))
if(m.size>MAX_MSGS){
const ids=[...m.keys()].sort()
const cut=ids.slice(0,m.size-MAX_MSGS+500)
for(const id of cut)m.delete(id)
const lo=ids[cut.length]
this.s.set(room,(this.s.get(room)||[]).map(s=>[s[1]<lo?s[1]:(s[0]<lo?lo:s[0]),s[1]]).filter(s=>s[0]<=s[1]))
}
}
async delMsg(room,id){this.room(room).delete(id);const s=this.s.get(room);if(s)this.s.set(room,s.flatMap(x=>x[0]<id&&id<x[1]?[[x[0],id],[id,x[1]]]:[x]))}
async msgsBefore(room,before,n,lo){
return[...this.room(room).values()].filter(x=>x.id<before&&x.id>=(lo||'')).sort((a,b)=>a.id<b.id?1:-1).slice(0,n)
}
async putBlob(meta,blob){
this.b.set(meta.id,{meta:{...meta,t:++this.clock},blob})
await this.evict()
}
async getBlob(id){const e=this.b.get(id);if(!e)return null;e.meta.t=++this.clock;return e}
async hasBlob(id){return this.b.has(id)}
async roomOfBlob(id){return this.b.get(id)?.meta.room||null}
async evict(){
let total=0
for(const e of this.b.values())total+=e.blob.size
if(total<=this.max)return
for(const e of[...this.b.values()].sort((a,b)=>a.meta.t-b.meta.t)){
if(total<=this.max)break
this.b.delete(e.meta.id);total-=e.blob.size
}
}
async stats(){let bytes=0;for(const e of this.b.values())bytes+=e.blob.size;let n=0;for(const m of this.m.values())n+=m.size;return{messages:n,files:this.b.size,bytes}}
async clear(){this.m.clear();this.s.clear();this.b.clear()}
}
const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
const done=t=>new Promise((res,rej)=>{t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})
export class IdbStore extends Base{
constructor(idb,name='parley-p2p',max=268435456){super();this.idb=idb;this.name=name;this.max=max;this.db=null;this.clock=Date.now()}
async open(){
if(this.db)return this.db
this.db=await new Promise((res,rej)=>{
const r=this.idb.open(this.name,1)
r.onupgradeneeded=()=>{
const d=r.result
d.createObjectStore('msgs',{keyPath:['room','id']})
d.createObjectStore('segs',{keyPath:'room'})
d.createObjectStore('blobs',{keyPath:'id'})
}
r.onsuccess=()=>res(r.result)
r.onerror=()=>rej(r.error)
})
return this.db
}
async segs(room){const d=await this.open();const x=await req(d.transaction('segs').objectStore('segs').get(room));return x?x.list:[]}
async putMsgs(room,msgs,seg){
const d=await this.open()
const segs=seg?mergeSegs(await this.segs(room),seg[0],seg[1]):null
const t=d.transaction(['msgs','segs'],'readwrite')
const ms=t.objectStore('msgs')
for(const x of msgs){
const o=await req(ms.get([room,x.id]))
if(!o||(x.edited_at||0)>=(o.m.edited_at||0))ms.put({room,id:x.id,m:x})
}
if(segs)t.objectStore('segs').put({room,list:segs})
await done(t)
const n=await req(d.transaction('msgs').objectStore('msgs').count(IDBKeyRange.bound([room,''],[room,'￿'])))
if(n>MAX_MSGS)await this.prune(room,n-MAX_MSGS+500)
}
async prune(room,count){
const d=await this.open()
const t=d.transaction(['msgs','segs'],'readwrite')
const ms=t.objectStore('msgs')
let lo=null,i=0
await new Promise((res,rej)=>{
const c=ms.openCursor(IDBKeyRange.bound([room,''],[room,'￿']))
c.onsuccess=()=>{const cur=c.result;if(!cur)return res();if(i<count){cur.delete();i++;cur.continue()}else{lo=cur.key[1];res()}}
c.onerror=()=>rej(c.error)
})
if(lo){
const sg=await req(t.objectStore('segs').get(room))
if(sg)t.objectStore('segs').put({room,list:sg.list.map(s=>[s[1]<lo?s[1]:(s[0]<lo?lo:s[0]),s[1]]).filter(s=>s[0]<=s[1])})
}
await done(t)
}
async delMsg(room,id){
const d=await this.open()
const segs=(await this.segs(room)).flatMap(x=>x[0]<id&&id<x[1]?[[x[0],id],[id,x[1]]]:[x])
const t=d.transaction(['msgs','segs'],'readwrite')
t.objectStore('msgs').delete([room,id])
t.objectStore('segs').put({room,list:segs})
await done(t)
}
async msgsBefore(room,before,n,lo){
const d=await this.open()
return new Promise((res,rej)=>{
const out=[]
const c=d.transaction('msgs').objectStore('msgs').openCursor(IDBKeyRange.bound([room,lo||''],[room,before],false,true),'prev')
c.onsuccess=()=>{const cur=c.result;if(!cur||out.length>=n)return res(out);out.push(cur.value.m);cur.continue()}
c.onerror=()=>rej(c.error)
})
}
async putBlob(meta,blob){
const d=await this.open()
const t=d.transaction('blobs','readwrite')
t.objectStore('blobs').put({id:meta.id,meta:{...meta,t:++this.clock},blob})
await done(t)
await this.evict()
}
async getBlob(id){
const d=await this.open()
const e=await req(d.transaction('blobs').objectStore('blobs').get(id))
if(!e)return null
const t=d.transaction('blobs','readwrite')
e.meta.t=++this.clock
t.objectStore('blobs').put(e)
return{meta:e.meta,blob:e.blob}
}
async hasBlob(id){const d=await this.open();return!!(await req(d.transaction('blobs').objectStore('blobs').getKey(id)))}
async roomOfBlob(id){const d=await this.open();const e=await req(d.transaction('blobs').objectStore('blobs').get(id));return e?e.meta.room:null}
async evict(){
const d=await this.open()
const all=await req(d.transaction('blobs').objectStore('blobs').getAll())
let total=all.reduce((a,e)=>a+e.blob.size,0)
if(total<=this.max)return
const t=d.transaction('blobs','readwrite')
for(const e of all.sort((a,b)=>a.meta.t-b.meta.t)){
if(total<=this.max)break
t.objectStore('blobs').delete(e.id);total-=e.blob.size
}
await done(t)
}
async stats(){
const d=await this.open()
const all=await req(d.transaction('blobs').objectStore('blobs').getAll())
const messages=await req(d.transaction('msgs').objectStore('msgs').count())
return{messages,files:all.length,bytes:all.reduce((a,e)=>a+e.blob.size,0)}
}
async clear(){
const d=await this.open()
const t=d.transaction(['msgs','segs','blobs'],'readwrite')
for(const s of['msgs','segs','blobs'])t.objectStore(s).clear()
await done(t)
}
}
