import{DurableObject}from'cloudflare:workers'
const MAX_PER_SEC=40
export class Hub extends DurableObject{
constructor(state,env){
super(state,env)
this.cache=new Map()
this.rate=new WeakMap()
}
async fetch(req){
const u=new URL(req.url)
if(u.pathname==='/ws'){
if(req.headers.get('upgrade')!=='websocket')return new Response('Expected websocket',{status:426})
const uid=req.headers.get('x-uid')
const access=JSON.parse(req.headers.get('x-access')||'{}')
const tu=req.headers.get('x-tu')==='1'
if(tu&&!this.socketsOf(uid).length&&new Set(this.ctx.getWebSockets().map(w=>(w.deserializeAttachment()||{}).uid)).size>=12)return new Response('Party is full',{status:403})
await this.ctx.storage.put('a:'+uid,access)
this.cache.set(uid,access)
const pair=new WebSocketPair()
const first=!this.socketsOf(uid).length
this.ctx.acceptWebSocket(pair[1])
const cid=crypto.randomUUID().replace(/-/g,'').slice(0,10)
pair[1].serializeAttachment({uid,cid,pres:req.headers.get('x-pres')||'online',p2p:[],tu})
const presence=[]
const seen=new Set()
for(const w of this.ctx.getWebSockets()){const a=w.deserializeAttachment();if(a&&!seen.has(a.uid)){seen.add(a.uid);if(a.pres!=='invisible')presence.push({uid:a.uid,s:a.pres})}}
const voice=await this.getVoice()
pair[1].send(JSON.stringify({t:'ready',presence,voice,cid}))
if(first)await this.broadcast({t:'presence',uid,s:req.headers.get('x-pres')||'online'},null,uid)
return new Response(null,{status:101,webSocket:pair[0]})
}
if(u.pathname==='/publish'&&req.method==='POST'){
const b=await req.json()
if(b.closeAll){for(const w of this.ctx.getWebSockets())try{w.close(4001,'resync')}catch{}}
else if(b.close){
for(const id of b.close){
for(const w of this.socketsOf(id))try{w.close(4001,'resync')}catch{}
if(b.purge){this.cache.delete(id);await this.ctx.storage.delete('a:'+id)}
}
}
if(b.e)await this.broadcast(b.e,b.ch||null,null,b.only)
return new Response('ok')
}
return new Response('Not found',{status:404})
}
socketsOf(uid){return this.ctx.getWebSockets().filter(w=>{const a=w.deserializeAttachment();return a&&a.uid===uid})}
async access(uid){
let a=this.cache.get(uid)
if(!a){a=await this.ctx.storage.get('a:'+uid)||{v:[],c:[]};this.cache.set(uid,a)}
return a
}
async broadcast(e,ch,skipUid,only){
const data=JSON.stringify(e)
for(const w of this.ctx.getWebSockets()){
const a=w.deserializeAttachment()
if(!a||a.uid===skipUid)continue
if(only&&!only.includes(a.uid))continue
if(ch){const ac=await this.access(a.uid);if(ac.v!=='*'&&!ac.v.includes(ch))continue}
try{w.send(data)}catch{}
}
}
async getVoice(){return await this.ctx.storage.get('voice')||{}}
async setVoice(v){await this.ctx.storage.put('voice',v)}
async leaveVoice(uid){
const v=await this.getVoice()
let changed=null
for(const ch of Object.keys(v))if(v[ch][uid]){delete v[ch][uid];if(!Object.keys(v[ch]).length)delete v[ch];changed=ch}
if(changed){await this.setVoice(v);await this.broadcast({t:'voice.state',ch:changed,users:v[changed]||{}},changed)}
return changed
}
async webSocketMessage(ws,raw){
const a=ws.deserializeAttachment()
if(!a)return
const r=this.rate.get(ws)||{c:0,r:0}
const t=Date.now()
if(r.r<t){r.c=0;r.r=t+1000}
if(++r.c>MAX_PER_SEC){this.rate.set(ws,r);return}
this.rate.set(ws,r)
let m
try{m=JSON.parse(raw)}catch{return}
if(!m||typeof m.t!=='string')return
const ac=await this.access(a.uid)
const canView=ch=>ac.v==='*'||(typeof ch==='string'&&ac.v.includes(ch))
if(m.t==='ping'){ws.send('{"t":"pong"}');return}
if(m.t==='tu'){
if(!a.tu)return
const d=JSON.stringify({t:'tu',f:a.uid,d:m.d})
if(d.length>8000)return
for(const w of this.ctx.getWebSockets()){const x=w.deserializeAttachment();if(!x||!x.tu||x.cid===a.cid)continue;if(m.to&&x.uid!==m.to)continue;try{w.send(d)}catch{}}
return
}
if(m.t==='typing'){if(canView(m.ch))await this.broadcast({t:'typing',ch:m.ch,uid:a.uid},m.ch,a.uid);return}
if(m.t==='bw.cursor'){
const x=Number(m.x),y=Number(m.y)
if(!Number.isFinite(x)||!Number.isFinite(y))return
await this.broadcast({t:'bw.cursor',uid:a.uid,x:Math.round(x),y:Math.round(y),b:typeof m.b==='string'?m.b.slice(0,40):''},null,a.uid)
return
}
if(m.t==='presence'){
if(!['online','idle','busy','invisible'].includes(m.s))return
ws.serializeAttachment({...a,pres:m.s})
await this.broadcast({t:'presence',uid:a.uid,s:m.s})
return
}
if(m.t==='voice.join'){
if(!canView(m.ch)||!(ac.c==='*'||ac.c.includes(m.ch)))return
const v=await this.getVoice()
for(const ch of Object.keys(v)){if(v[ch][a.uid]){delete v[ch][a.uid];if(!Object.keys(v[ch]).length)delete v[ch];await this.broadcast({t:'voice.state',ch,users:v[ch]||{}},ch)}}
const room=v[m.ch]||(v[m.ch]={})
if(Object.keys(room).length>=12&&!room[a.uid]){ws.send(JSON.stringify({t:'voice.error',ch:m.ch,error:'This voice channel is full (12 participants)'}));return}
room[a.uid]={m:!!m.m,d:!!m.d,vid:false,scr:false,h:false}
await this.setVoice(v)
ws.send(JSON.stringify({t:'voice.joined',ch:m.ch,peers:Object.keys(room).filter(x=>x!==a.uid)}))
await this.broadcast({t:'voice.state',ch:m.ch,users:room},m.ch)
return
}
if(m.t==='p2p.join'){
if(!canView(m.ch))return
const set=new Set(a.p2p||[]);set.add(m.ch)
const na={...a,p2p:[...set].slice(-8)}
ws.serializeAttachment(na)
const peers=this.p2pPeers(m.ch,a.cid)
ws.send(JSON.stringify({t:'p2p.peers',ch:m.ch,peers:peers.slice(0,11)}))
const note=JSON.stringify({t:'p2p.peer',ch:m.ch,cid:a.cid,uid:a.uid,up:true})
for(const w of this.p2pSockets(m.ch,a.cid))try{w.send(note)}catch{}
return
}
if(m.t==='p2p.leave'){await this.p2pLeave(ws,a,m.ch);return}
if(m.t==='p2p.sig'){
if(typeof m.to!=='string'||!(a.p2p||[]).includes(m.ch))return
const payload=JSON.stringify({t:'p2p.sig',ch:m.ch,from:a.cid,uid:a.uid,data:m.data})
if(payload.length>20000)return
for(const w of this.p2pSockets(m.ch,a.cid))if(w.deserializeAttachment().cid===m.to)try{w.send(payload)}catch{}
return
}
if(m.t==='voice.leave'){await this.leaveVoice(a.uid);return}
if(m.t==='voice.state'){
const v=await this.getVoice()
for(const ch of Object.keys(v))if(v[ch][a.uid]){
const s=v[ch][a.uid]
for(const k of['m','d','vid','scr','h'])if(typeof m[k]==='boolean')s[k]=m[k]
await this.setVoice(v)
await this.broadcast({t:'voice.state',ch,users:v[ch]},ch)
}
return
}
if(m.t==='sig'){
const v=await this.getVoice()
const ch=m.ch
if(!v[ch]||!v[ch][a.uid]||!v[ch][m.to])return
const payload=JSON.stringify({t:'sig',ch,from:a.uid,data:m.data})
if(payload.length>20000)return
for(const w of this.socketsOf(m.to))try{w.send(payload)}catch{}
}
}
p2pSockets(ch,skip){return this.ctx.getWebSockets().filter(w=>{const x=w.deserializeAttachment();return x&&x.cid!==skip&&(x.p2p||[]).includes(ch)})}
p2pPeers(ch,skip){return this.p2pSockets(ch,skip).map(w=>{const x=w.deserializeAttachment();return{cid:x.cid,uid:x.uid}})}
async p2pLeave(ws,a,ch){
if(!(a.p2p||[]).includes(ch))return
try{ws.serializeAttachment({...a,p2p:a.p2p.filter(x=>x!==ch)})}catch{}
const note=JSON.stringify({t:'p2p.peer',ch,cid:a.cid,uid:a.uid,up:false})
for(const w of this.p2pSockets(ch,a.cid))try{w.send(note)}catch{}
}
async webSocketClose(ws){await this.dropped(ws)}
async webSocketError(ws){await this.dropped(ws)}
async dropped(ws){
const a=ws.deserializeAttachment()
if(!a)return
for(const ch of a.p2p||[])await this.p2pLeave(ws,a,ch)
if(this.socketsOf(a.uid).filter(w=>w!==ws).length)return
await this.leaveVoice(a.uid)
await this.broadcast({t:'presence',uid:a.uid,s:'offline'},null,a.uid)
}
}
