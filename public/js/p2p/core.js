import{packJson,packChunk,unpack,CHUNK_SIZE}from'./frames.js'
const HIGH=1048576
export class Peer{
constructor(engine,info,tr,initiator){
this.engine=engine
this.cid=info.cid
this.uid=info.uid
this.tr=tr
this.initiator=initiator
this.channels=new Set()
this.caps={}
this.ready=false
this.rtt=null
this.bps=0
this.pending=new Map()
this.chunks=new Map()
this.seq=1
this.rr=0
this.serving=0
this.bad=0
this.zip=false
this.closed=false
this.stats={tx:0,rx:0}
}
attach(){
const tr=this.tr
tr.ctl.onmessage=u=>this.onFrame(u)
for(const l of tr.bulk)l.onmessage=u=>this.onFrame(u)
tr.onclose=()=>this.engine.dropPeer(this)
}
async onFrame(u8){
let f
try{f=await unpack(u8)}catch{this.bad++;return}
if(!f){this.bad++;return}
this.stats.rx+=u8.length
if(f.t===2){
const c=this.chunks.get(f.id)
if(c){c.cb(f.offset,f.data);const now=performance.now();const dt=Math.max(1,now-(this.lastRx||now));this.lastRx=now;this.bps=this.bps?this.bps*0.9+(f.data.length/dt*1000)*0.1:f.data.length/dt*1000}
return
}
const m=f.obj
if(!m||typeof m.k!=='string')return
if(m.k==='hello'){this.caps=m.caps||{};this.zip=!!(this.caps.zip&&this.engine.cfg.zip);this.ready=true;this.engine.peerReady(this);return}
if(m.k==='ping'){this.sendJson({k:'pong',t:m.t});return}
if(m.k==='pong'){const r=performance.now()-m.t;this.rtt=this.rtt==null?r:this.rtt*0.7+r*0.3;return}
if(m.k==='r'){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.ok?p.res(m.d):p.rej(new Error(m.e||'peer error'))}return}
if(m.k==='q')this.onRequest(m)
}
async sendJson(obj){
if(this.closed)return
const u=await packJson(obj,this.zip)
this.stats.tx+=u.length
await this.send(this.tr.ctl,u)
}
async send(link,u8){
if(this.closed)return
while(link.buffered()>HIGH){await link.drain();if(this.closed)return}
link.send(u8)
}
request(a,d,timeout=8000){
return new Promise((res,rej)=>{
const id=this.seq++
const timer=setTimeout(()=>{this.pending.delete(id);rej(new Error('peer timeout'))},timeout)
this.pending.set(id,{res,rej,timer})
this.sendJson({k:'q',id,a,d}).catch(rej)
})
}
async onRequest(m){
const h=this.engine.handlers.get(m.a)
if(!h){this.sendJson({k:'r',id:m.id,ok:false,e:'unsupported'});return}
try{
const d=await h(this,m.d||{},m.id)
await this.sendJson({k:'r',id:m.id,ok:true,d})
}catch(e){
await this.sendJson({k:'r',id:m.id,ok:false,e:String(e&&e.message||e).slice(0,120)})
}
}
async sendChunk(id,offset,payload){
const links=this.tr.bulk.length?this.tr.bulk:[this.tr.ctl]
const l=links[this.rr++%links.length]
const u=packChunk(id,offset,payload)
this.stats.tx+=u.length
await this.send(l,u)
}
stream(a,d,onChunk,timeout=10000){
return new Promise((res,rej)=>{
const id=this.seq++
let got=0,resp=null,timer=null
const fin=()=>{clearTimeout(timer);this.chunks.delete(id);this.pending.delete(id)}
const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{fin();rej(new Error('peer timeout'))},timeout)}
const check=()=>{if(resp&&got>=resp.len){fin();res({got,resp})}}
this.chunks.set(id,{cb:(off,data)=>{got+=data.length;arm();onChunk(off,data);check()}})
this.pending.set(id,{res:r=>{resp=r;check()},rej:e=>{fin();rej(e)},timer:0})
arm()
this.sendJson({k:'q',id,a,d}).catch(e=>{fin();rej(e)})
})
}
expect(id,cb){this.chunks.set(id,{cb});return()=>this.chunks.delete(id)}
close(){
if(this.closed)return
this.closed=true
for(const p of this.pending.values()){clearTimeout(p.timer);p.rej(new Error('peer closed'))}
this.pending.clear()
try{this.tr.close()}catch{}
}
}
export class Engine{
constructor(o){
this.me=o.me
this.sendHub=o.sendHub
this.connect=o.connect
this.cfg={maxPeers:12,maxUploads:6,zip:true,pingMs:15000,...o.cfg}
this.gateOf=o.gateOf||(r=>r)
this.peers=new Map()
this.channels=new Set()
this.handlers=new Map()
this.addons=new Map()
this.listeners=new Set()
this.uploads=0
this.timer=null
}
use(addon){
this.addons.set(addon.name,addon)
for(const[k,fn]of Object.entries(addon.handlers||{}))this.handlers.set(k,(peer,d,id)=>fn(peer,d,id))
if(addon.init)addon.init(this)
return this
}
caps(){
const c={zip:this.cfg.zip?1:0}
for(const a of this.addons.values())c[a.name]=a.version||1
return c
}
on(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
emit(e){for(const f of this.listeners)try{f(e)}catch{}}
start(){
if(!this.timer)this.timer=setInterval(()=>{for(const p of this.peers.values())if(p.ready)p.sendJson({k:'ping',t:performance.now()})},this.cfg.pingMs)
}
stop(){
clearInterval(this.timer);this.timer=null
for(const p of[...this.peers.values()])p.close()
this.peers.clear()
for(const ch of this.channels)this.sendHub({t:'p2p.leave',ch})
this.channels.clear()
this.emit({t:'stopped'})
}
join(ch){
if(this.channels.has(ch))return
this.channels.add(ch)
this.sendHub({t:'p2p.join',ch})
}
leave(ch){
if(!this.channels.delete(ch))return
this.sendHub({t:'p2p.leave',ch})
for(const p of[...this.peers.values()]){
p.channels.delete(ch)
if(!p.channels.size)this.dropPeer(p,true)
}
}
resync(){
const chs=[...this.channels]
for(const p of[...this.peers.values()])p.close()
this.peers.clear()
for(const ch of chs)this.sendHub({t:'p2p.join',ch})
}
onHub(e){
if(e.t==='p2p.peers'){
if(!this.channels.has(e.ch))return
for(const info of e.peers)this.touch(info,e.ch,true)
}else if(e.t==='p2p.peer'){
if(!this.channels.has(e.ch))return
if(e.up)this.touch(e,e.ch,false)
else{
const p=this.peers.get(e.cid)
if(p){p.channels.delete(e.ch);if(!p.channels.size)this.dropPeer(p,true)}
}
}else if(e.t==='p2p.sig'){
if(!this.channels.has(e.ch))return
let p=this.peers.get(e.from)
if(!p)p=this.touch({cid:e.from,uid:e.uid},e.ch,false)
if(p&&p.tr&&p.tr.signal)p.tr.signal(e.data)
else if(p)(p.early||(p.early=[])).push(e.data)
}
}
touch(info,ch,initiator){
if(!info||typeof info.cid!=='string'||info.cid===this.me.cid)return null
let p=this.peers.get(info.cid)
if(p){p.channels.add(ch);return p}
if(this.peers.size>=this.cfg.maxPeers)return null
const holder={channels:new Set([ch])}
const signal=data=>{
const c=[...(this.peers.get(info.cid)?.channels||holder.channels)][0]
if(c)this.sendHub({t:'p2p.sig',ch:c,to:info.cid,data})
}
p=new Peer(this,info,null,initiator)
p.channels=holder.channels
this.peers.set(info.cid,p)
const tr=this.connect(info,{initiator,signal})
p.tr=tr
tr.opened.then(()=>{
if(p.closed)return
p.attach()
p.sendJson({k:'hello',caps:this.caps()})
},()=>this.dropPeer(p))
if(p.early){for(const d of p.early)tr.signal&&tr.signal(d);p.early=null}
return p
}
peerReady(p){
this.emit({t:'peer',peer:p})
for(const a of this.addons.values())if(a.onPeer)a.onPeer(p,this)
}
dropPeer(p,hard){
if(this.peers.get(p.cid)===p)this.peers.delete(p.cid)
p.close()
this.emit({t:'peer-gone',peer:p})
for(const a of this.addons.values())if(a.onGone)a.onGone(p,this)
}
canServe(peer,room){
return peer.channels.has(this.gateOf(room))
}
ready(){return[...this.peers.values()].filter(p=>p.ready)}
best(n,filter){
return this.ready().filter(p=>!filter||filter(p)).sort((a,b)=>(b.bps-a.bps)||((a.rtt??999)-(b.rtt??999))).slice(0,n)
}
}
export{CHUNK_SIZE}
