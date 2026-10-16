import{CHUNK_SIZE}from'./frames.js'
import{Sha256}from'./sha.js'
const SEG=1048576
const hashBuf=async buf=>{
if(buf.length<=67108864&&globalThis.crypto&&crypto.subtle){
const d=new Uint8Array(await crypto.subtle.digest('SHA-256',buf))
let s='';for(const x of d)s+=x.toString(16).padStart(2,'0')
return s
}
const h=new Sha256()
for(let o=0;o<buf.length;o+=4194304)h.update(buf.subarray(o,o+4194304))
return h.digest()
}
export function swarmAddon(o){
const{store}=o
const maxBuf=o.maxBuf||268435456
const maxSeed=o.maxSeed||268435456
const stats={peerBytes:0,serverBytes:0,served:0,fallbacks:0,mismatch:0}
let serve=o.serve!==false
let engine=null
const allowed=async(peer,id)=>{
const room=await store.roomOfBlob(id)
return room&&engine.canServe(peer,room)
}
async function fromServer(meta,srv,onBytes,signal){
const buf=new Uint8Array(meta.size)
const lanes=meta.size>SEG*8?4:1
let next=0
const total=Math.ceil(meta.size/SEG)
await Promise.all(Array.from({length:lanes},async()=>{
while(next<total){
if(signal&&signal.aborted)throw new Error('cancelled')
const i=next++
const a=i*SEG,b=Math.min(meta.size,a+SEG)
const d=await srv(a,b,signal)
buf.set(d,a);onBytes(d.length,false)
}
}))
return buf
}
async function viaSwarm(meta,srv,opt,peers,onBytes){
const total=Math.ceil(meta.size/SEG)
const buf=new Uint8Array(meta.size)
const queue=Array.from({length:total},(_,i)=>i)
const finished=new Set()
const inflight=new Map()
let fatal=null
const take=()=>{
if(queue.length)return queue.shift()
for(const[i,n]of inflight)if(n===1&&!finished.has(i))return i
return null
}
const run=async(src)=>{
let fails=0
while(finished.size<total&&!fatal){
if(opt.signal&&opt.signal.aborted){fatal=new Error('cancelled');return}
const i=take()
if(i===null){await new Promise(r=>setTimeout(r,20));if(inflight.size===0&&!queue.length)return;continue}
inflight.set(i,(inflight.get(i)||0)+1)
const a=i*SEG,b=Math.min(meta.size,a+SEG)
try{
let data
if(src.peer){
const part=new Uint8Array(b-a)
let got=0
await src.peer.stream('file.get',{id:meta.id,from:a,to:b},(off,d)=>{if(off+d.length<=part.length){part.set(d,off);got+=d.length}},8000)
if(got<b-a)throw new Error('short')
data=part
}else data=await src.server(a,b,opt.signal)
if(!finished.has(i)){finished.add(i);buf.set(data,a);onBytes(data.length,!!src.peer)}
fails=0
}catch(e){
if(!finished.has(i))queue.push(i)
if(src.peer){fails++;if(fails>=2){src.peer.bad++;inflight.set(i,(inflight.get(i)||1)-1);return}}else if(++fails>=3){fatal=e;return}
}
const n=(inflight.get(i)||1)-1
if(n<=0)inflight.delete(i);else inflight.set(i,n)
}
}
const lanes=[...peers.map(p=>({peer:p})),...Array.from({length:peers.length?2:4},()=>({server:srv}))]
await Promise.all(lanes.map(run))
if(fatal)throw fatal
if(finished.size<total)throw new Error('incomplete download')
return buf
}
const api={
stats,
setServe(v){serve=!!v},
async seed(meta,blob){
if(blob.size>maxSeed||!meta.sha256)return
await store.putBlob({id:meta.id,room:meta.room,name:meta.name,mime:meta.mime,sha256:meta.sha256,size:blob.size},blob)
},
async download(meta,opt={}){
const cached=await store.getBlob(meta.id)
if(cached&&cached.blob.size===meta.size)return{blob:cached.blob,source:'cache',peerBytes:0,serverBytes:0}
const srv=opt.server
let pb=0,sb=0
const onBytes=(n,peer)=>{if(peer){pb+=n;stats.peerBytes+=n}else{sb+=n;stats.serverBytes+=n}if(opt.onProgress)opt.onProgress((pb+sb)/meta.size,{peerBytes:pb,serverBytes:sb})}
let peers=[]
const eligible=opt.usePeers!==false&&meta.sha256&&meta.size>=(opt.minPeerSize??262144)&&meta.size<=maxBuf&&engine
if(eligible){
const cand=engine.best(8,p=>p.caps.swarm&&engine.canServe(p,meta.room)&&p.bad<3)
await Promise.allSettled(cand.map(p=>p.request('file.have',{ids:[meta.id]},2500).then(r=>{if(r&&r.have&&r.have.includes(meta.id))peers.push(p)})))
}
let buf
if(peers.length){
try{buf=await viaSwarm(meta,srv,opt,peers,onBytes)}catch(e){if(opt.signal&&opt.signal.aborted)throw e;buf=null}
if(buf&&meta.sha256&&await hashBuf(buf)!==meta.sha256){stats.mismatch++;for(const p of peers)p.bad+=3;buf=null}
if(!buf){stats.fallbacks++;pb=0;sb=0;buf=await fromServer(meta,srv,onBytes,opt.signal)}
}else buf=await fromServer(meta,srv,onBytes,opt.signal)
if(meta.sha256&&meta.size<=maxBuf&&await hashBuf(buf)!==meta.sha256)throw new Error('Downloaded file failed its integrity check')
const blob=new Blob([buf],{type:meta.mime||'application/octet-stream'})
if(meta.sha256&&meta.room)api.seed(meta,blob).catch(()=>{})
return{blob,source:peers.length&&pb?'peers':'server',peerBytes:pb,serverBytes:sb}
}
}
return{
name:'swarm',version:1,api,
handlers:{
'file.have':async(peer,d)=>{
if(!serve||!d||!Array.isArray(d.ids))return{have:[]}
const have=[]
for(const id of d.ids.slice(0,50))if(typeof id==='string'&&await store.hasBlob(id)&&await allowed(peer,id))have.push(id)
return{have}
},
'file.get':async(peer,d,reqId)=>{
if(!serve||!d||typeof d.id!=='string')throw new Error('denied')
if(!await allowed(peer,d.id))throw new Error('denied')
if(engine.uploads>=engine.cfg.maxUploads)throw new Error('busy')
const e=await store.getBlob(d.id)
if(!e)throw new Error('missing')
const a=Math.max(0,parseInt(d.from)||0),b=Math.min(e.blob.size,parseInt(d.to)||0)
if(!(b>a)||b-a>4194304)throw new Error('bad range')
engine.uploads++
try{
const u=new Uint8Array(await e.blob.slice(a,b).arrayBuffer())
for(let off=0;off<u.length;off+=CHUNK_SIZE)await peer.sendChunk(reqId,off,u.subarray(off,Math.min(u.length,off+CHUNK_SIZE)))
stats.served+=u.length
return{len:u.length}
}finally{engine.uploads--}
}
},
init(e){engine=e}
}
}
