const BULK=3
const LOW=262144
function wrap(dc){
const l={onmessage:null,send:u=>dc.send(u),buffered:()=>dc.bufferedAmount,close:()=>{try{dc.close()}catch{}}}
dc.binaryType='arraybuffer'
dc.bufferedAmountLowThreshold=LOW
dc.onmessage=e=>{if(l.onmessage)l.onmessage(new Uint8Array(e.data))}
l.drain=()=>new Promise(res=>{
if(dc.bufferedAmount<=LOW||dc.readyState!=='open')return res()
const f=()=>{dc.removeEventListener('bufferedamountlow',f);dc.removeEventListener('close',f);res()}
dc.addEventListener('bufferedamountlow',f)
dc.addEventListener('close',f)
})
return l
}
export function makeConnect(getIce,opts={}){
return(info,{initiator,signal})=>{
const tr={ctl:null,bulk:[],onclose:null,signal:null,close:()=>{try{pc.close()}catch{}}}
let pc=null
let openRes,openRej
tr.opened=new Promise((res,rej)=>{openRes=res;openRej=rej})
const timeout=setTimeout(()=>{openRej(new Error('connect timeout'));try{pc&&pc.close()}catch{}},25000)
const chans={}
const want=1+BULK
const check=()=>{
if(Object.keys(chans).length===want&&Object.values(chans).every(d=>d.readyState==='open')){
clearTimeout(timeout)
tr.ctl=wrap(chans.ctl)
tr.bulk=Array.from({length:BULK},(_,i)=>wrap(chans['b'+i]))
openRes()
}
}
const take=dc=>{
chans[dc.label]=dc
dc.onopen=check
dc.onclose=()=>{if(tr.onclose)tr.onclose()}
check()
}
const queue=[]
let ready=false
const handle=async d=>{
try{
if(d.sdp){
await pc.setRemoteDescription(d.sdp)
if(d.sdp.type==='offer'){
await pc.setLocalDescription(await pc.createAnswer())
signal({sdp:pc.localDescription})
}
}else if(d.ice){
await pc.addIceCandidate(d.ice)
}
}catch{}
}
tr.signal=d=>{ready?handle(d):queue.push(d)}
Promise.resolve(getIce()).then(ice=>{
pc=new RTCPeerConnection({iceServers:ice,iceTransportPolicy:opts.relayOnly&&opts.relayOnly()?'relay':'all'})
pc.onicecandidate=e=>{if(e.candidate)signal({ice:e.candidate})}
pc.onconnectionstatechange=()=>{
if(pc.connectionState==='failed'||pc.connectionState==='closed'){openRej(new Error('connection '+pc.connectionState));if(tr.onclose)tr.onclose()}
else if(pc.connectionState==='disconnected')setTimeout(()=>{if(pc.connectionState==='disconnected'&&tr.onclose)tr.onclose()},8000)
}
if(initiator){
take(pc.createDataChannel('ctl',{ordered:true}))
for(let i=0;i<BULK;i++)take(pc.createDataChannel('b'+i,{ordered:true}))
pc.onnegotiationneeded=async()=>{
try{await pc.setLocalDescription(await pc.createOffer());signal({sdp:pc.localDescription})}catch{}
}
}else pc.ondatachannel=e=>take(e.channel)
ready=true
for(const d of queue.splice(0))handle(d)
},e=>openRej(e))
return tr
}
}
