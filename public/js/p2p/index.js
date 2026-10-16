import{Engine}from'./core.js'
import{IdbStore,MemoryStore}from'./store.js'
import{histAddon}from'./hist.js'
import{swarmAddon}from'./swarm.js'
import{makeVerifier}from'./verify.js'
import{makeConnect}from'./rtc.js'
import{GET}from'../util.js'
import{S,on,emit,hubOf}from'../state.js'
import{send as sockSend}from'../net.js'
import{pref,onPref}from'../prefs.js'

let store=null
let verifier=null
let ice=null
const engines=new Map()
const cids=new Map()
const joined=new Map()
let local=null

function getStore(){
if(store)return store
const max=(pref('cacheMb')||256)*1048576
try{store=new IdbStore(indexedDB,'parley-p2p',max)}catch{store=new MemoryStore(max)}
return store
}
async function getVerify(){
if(!verifier)verifier=(async()=>{const d=await GET('/api/p2p/key');return makeVerifier(d.key)})()
try{return await verifier}catch{verifier=null;throw new Error('Could not load the message signing key')}
}
async function getIce(){
if(ice&&Date.now()-ice.t<600000)return ice.v
try{const d=await GET('/api/rtc/ice');ice={t:Date.now(),v:d.iceServers}}catch{ice={t:Date.now(),v:[{urls:['stun:stun.cloudflare.com:3478']}]}}
return ice.v
}
const gateOf=room=>typeof room==='string'&&room.startsWith('th_')?(S.threads[room]?.channel_id||room):room
const enabled=()=>!!pref('p2p')

async function ensure(hub){
if(engines.has(hub))return engines.get(hub)
const cid=cids.get(hub)
if(!cid)return null
const st=getStore()
const verify=await getVerify()
const hist=histAddon({store:st,verify,serve:pref('p2pServe')})
const sw=swarmAddon({store:st,serve:pref('p2pServe')})
const e=new Engine({
me:{uid:S.me.id,cid},
sendHub:m=>sockSend(hub,m),
connect:makeConnect(getIce,{relayOnly:()=>pref('p2pRelay')}),
gateOf,
cfg:{zip:true}
})
e.use(hist).use(sw)
e.hist=hist.api
e.sw=sw.api
e.on(()=>emit('p2p'))
e.start()
engines.set(hub,e)
return e
}
function dropHub(hub){
const e=engines.get(hub)
if(e){try{e.stop()}catch{}engines.delete(hub)}
cids.delete(hub)
}
export function startP2P(){
on('ev',({room,m})=>{
if(!S.me)return
if(m.t==='ready'&&m.cid){
cids.set(room,m.cid)
const want=joined.get(room)
if(want&&want.length&&enabled())ensure(room).then(e=>{if(e)for(const ch of want)e.join(ch)}).catch(()=>{})
}else if(m.t&&m.t.startsWith('p2p.')){
const e=engines.get(room)
if(e)e.onHub(m)
}
})
on('ws:close',({room})=>{
const e=engines.get(room)
if(e){e.stop();engines.delete(room)}
cids.delete(room)
})
onPref((k,v)=>{
if(k==='p2p'&&!v)stopP2P()
if(k==='p2pServe')for(const e of engines.values()){e.hist.setServe(v);e.sw.setServe(v)}
if(k==='p2pRelay')for(const e of engines.values())e.resync()
if(k==='p2p'&&v){const r=S.nav.room;if(r)joinRoom(r)}
})
}
export function stopP2P(){
for(const e of engines.values())try{e.stop()}catch{}
engines.clear()
joined.clear()
}
export async function joinRoom(room){
if(!enabled()||!S.me)return
const hub=hubOf(room)
if(!hub)return
const ch=gateOf(room)
let list=joined.get(hub)||[]
list=[ch,...list.filter(x=>x!==ch)].slice(0,3)
const dropped=(joined.get(hub)||[]).filter(x=>!list.includes(x))
joined.set(hub,list)
const e=await ensure(hub).catch(()=>null)
if(!e)return
for(const d of dropped)e.leave(d)
e.join(ch)
}
export async function pageFromPeers(room,before,limit){
if(!enabled()||!pref('p2pHistory'))return null
const e=engines.get(hubOf(room))
if(!e)return null
return e.hist.page(e,room,before,limit)
}
export async function recordMessages(room,msgs,seg){
if(!enabled()||!pref('p2pHistory')&&!pref('p2pServe'))return
const e=engines.get(hubOf(room))
const h=e?e.hist:(await soloHist())
try{await h.record(room,msgs,seg)}catch{}
}
export async function forgetMessage(room,id){
if(!store)return
try{await store.delMsg(room,id)}catch{}
}
async function soloHist(){
if(!local){const st=getStore();const verify=await getVerify();local={hist:histAddon({store:st,verify}).api,sw:swarmAddon({store:st,serve:false}).api}}
return local.hist
}
function soloSwarm(){
if(!local){const st=getStore();local={hist:null,sw:swarmAddon({store:st,serve:false}).api}}
return local.sw
}
const rangeFetch=id=>async(a,b,signal)=>{
const r=await fetch('/api/files/'+id,{headers:{range:`bytes=${a}-${b-1}`},credentials:'same-origin',signal})
if(!r.ok)throw new Error('Download failed ('+r.status+')')
const buf=new Uint8Array(await r.arrayBuffer())
return r.status===206?buf:buf.subarray(a,b)
}
export function canSwarm(meta){
return !!meta.sha256&&meta.size>=262144&&meta.size<=268435456&&(pref('fastDl')||enabled())
}
export async function downloadFile(meta,opt={}){
const e=meta.room?engines.get(hubOf(meta.room)):null
const sw=e?e.sw:soloSwarm()
const usePeers=enabled()&&pref('p2pFiles')&&!!e
return sw.download(meta,{server:rangeFetch(meta.id),usePeers,onProgress:opt.onProgress,signal:opt.signal})
}
export async function seedFile(meta,file){
if(!enabled()||!pref('p2pServe')||!meta.sha256)return
try{await getStore().putBlob({id:meta.id,room:meta.room,name:meta.name,mime:meta.mime,sha256:meta.sha256,size:file.size},file)}catch{}
}
export async function p2pStats(){
const out={peers:0,pageCount:0,pageMsgs:0,peerBytes:0,serverBytes:0,served:0,rejected:0,mismatch:0,cached:{messages:0,files:0,bytes:0}}
for(const e of engines.values()){
out.peers+=e.ready().length
out.pageCount+=e.hist.stats.pages;out.pageMsgs+=e.hist.stats.msgs;out.rejected+=e.hist.stats.rejected
out.peerBytes+=e.sw.stats.peerBytes;out.serverBytes+=e.sw.stats.serverBytes;out.served+=e.sw.stats.served;out.mismatch+=e.sw.stats.mismatch
}
if(local){out.peerBytes+=local.sw.stats.peerBytes;out.serverBytes+=local.sw.stats.serverBytes}
try{out.cached=await getStore().stats()}catch{}
return out
}
export async function clearP2PCache(){
try{await getStore().clear()}catch{}
}
