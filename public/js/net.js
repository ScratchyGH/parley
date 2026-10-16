import{emit}from'./state.js'

const socks=new Map()
let wanted=new Set()
let pinger=null
let stopped=false

function connect(room){
let s=socks.get(room)
if(!s){s={ws:null,tries:0,timer:null,opened:0};socks.set(room,s)}
if(s.ws&&(s.ws.readyState===0||s.ws.readyState===1))return
clearTimeout(s.timer)
const proto=location.protocol==='https:'?'wss':'ws'
let ws
try{ws=new WebSocket(`${proto}://${location.host}/ws?room=${encodeURIComponent(room)}`)}catch{schedule(room,false);return}
s.ws=ws
let opened=false
ws.onopen=()=>{
opened=true
const again=s.opened>0
s.opened++
s.tries=0
emit('ws:open',{room,again})
}
ws.onmessage=e=>{
let m
try{m=JSON.parse(e.data)}catch{return}
if(m&&m.t)emit('ev',{room,m})
}
ws.onclose=ev=>{
if(s.ws!==ws)return
s.ws=null
emit('ws:close',{room,code:ev.code,opened})
if(stopped||!wanted.has(room))return
if(!opened)s.tries++
if(s.tries>=4&&!opened)emit('ws:authcheck',{room})
schedule(room,ev.code===4001)
}
ws.onerror=()=>{}
}
function schedule(room,resync){
const s=socks.get(room)
if(!s||stopped||!wanted.has(room))return
clearTimeout(s.timer)
const base=resync?300:Math.min(30000,500*2**Math.min(s.tries,7))
s.timer=setTimeout(()=>connect(room),base+Math.random()*(resync?900:base*.4))
}
export function setRooms(rooms){
stopped=false
const next=new Set(rooms.filter(Boolean))
for(const r of [...socks.keys()]){
if(!next.has(r)){
const s=socks.get(r)
clearTimeout(s.timer)
const ws=s.ws
s.ws=null
if(ws){ws.onclose=null;try{ws.close(1000)}catch{}}
socks.delete(r)
}
}
wanted=next
for(const r of next)connect(r)
if(!pinger)pinger=setInterval(()=>{for(const s of socks.values())if(s.ws&&s.ws.readyState===1)s.ws.send('{"t":"ping"}')},25000)
}
export function send(room,obj){
const s=socks.get(room)
if(s?.ws&&s.ws.readyState===1){s.ws.send(JSON.stringify(obj));return true}
return false
}
export const isOpen=room=>{const s=socks.get(room);return !!(s?.ws&&s.ws.readyState===1)}
export function stopAll(){
stopped=true
wanted=new Set()
for(const s of socks.values()){clearTimeout(s.timer);if(s.ws){s.ws.onclose=null;try{s.ws.close(1000)}catch{}}}
socks.clear()
clearInterval(pinger)
pinger=null
}
function kick(){
for(const r of wanted){
const s=socks.get(r)
if(!s||!s.ws||s.ws.readyState>1){if(s)s.tries=0;connect(r)}
}
}
addEventListener('online',kick)
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')kick()})
export function sendAll(obj){
const s=JSON.stringify(obj)
for(const v of socks.values())if(v.ws&&v.ws.readyState===1)v.ws.send(s)
}
