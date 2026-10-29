import{h,mount,icon,GET,POST,avatar,toast,fail,popup,field,toggle,dialog}from'./util.js'
import{tone,desktop}from'./notify.js'
import{S,on,emit,conv}from'./state.js'
import{send as wsSend,isOpen}from'./net.js'

export const V={ch:null,hub:null,label:'',path:'',peers:new Map(),mic:null,cam:null,scr:null,muted:false,deaf:false,speaking:new Set(),quality:{},ice:null,watch:new Map(),joining:false,relayFor:new Map(),relayVia:new Map(),scrFor:new Map(),scrVia:new Map()}

const KEY='parley:voice'
export function voicePrefs(){
let p={}
try{p=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
return{input:'',output:'',camera:'',echo:true,noise:true,agc:true,ptt:false,pttKey:'KeyV',scrRes:'720',scrFps:30,scrKbps:0,scrAudio:false,captions:false,...p}
}
export function saveVoicePrefs(p){
try{localStorage.setItem(KEY,JSON.stringify(p))}catch{}
}

let audioCtx=null
const sink=document.createElement('div')
sink.style.display='none'
document.body.append(sink)
let timers=[]

const sig=(to,data)=>wsSend(V.hub,{t:'sig',to,ch:V.ch,data})
const setState=()=>wsSend(V.hub,{t:'voice.state',m:V.muted||V.deaf,d:V.deaf,vid:!!V.cam,scr:!!V.scr,h:!!V.hand})

const micWhy=e=>{
const n=e&&e.name
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return['Microphone not available here','This page cannot reach a microphone. Open Parley directly in Chrome, Edge, Firefox or Safari (not inside another app) and make sure the address starts with https.']
if(n==='NotAllowedError'||n==='SecurityError')return['Allow microphone access','Your browser is blocking the microphone for Parley. Click the lock or tune icon next to the address bar, set Microphone to Allow, then press Allow microphone below. On a phone, also check that your browser is allowed to use the microphone in system settings.']
if(n==='NotFoundError'||n==='OverconstrainedError')return['No microphone found','Plug in or enable a microphone, then press Allow microphone below. If you picked a specific microphone in voice settings, it may be unplugged.']
if(n==='NotReadableError'||n==='AbortError')return['Your microphone is busy','Another app or tab is using your microphone. Close it, then press Allow microphone below.']
return['Microphone problem',(e&&e.message)||'The microphone could not be started.']
}
const micOpts=()=>{const pr=voicePrefs();return{audio:{deviceId:pr.input?{ideal:pr.input}:undefined,echoCancellation:pr.echo,noiseSuppression:pr.noise,autoGainControl:pr.agc},video:false}}
function askMic(first){
return new Promise(res=>{
let done=false
const title=h('b',null),msg=h('p',{style:{margin:'8px 0 0'}})
const set=e=>{const[t,m]=micWhy(e);title.textContent=t;msg.textContent=m}
set(first)
const finish=v=>{if(done)return;done=true;res(v)}
const d=dialog('Microphone needed',h('div',{class:'bd'},h('div',{style:{display:'flex',gap:'12px',alignItems:'flex-start'}},icon('mic'),h('div',null,title,msg))),{sticky:true,onclose:()=>finish(null),footer:close=>[
h('button',{class:'btn',on:{click:()=>{close()}}},'Continue without microphone'),
h('button',{class:'btn pri',on:{click:async()=>{
try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('none');const st=await navigator.mediaDevices.getUserMedia(micOpts());done=true;d.close();res(st)}catch(e){set(e)}
}}},'Allow microphone')
]})
})
}
export async function enableMic(){
if(!V.ch||V.mic)return
const st=await askMic(null)
if(!st)return
V.mic=st
V.muted=false
for(const p of V.peers.values()){for(const t of st.getAudioTracks())p.senders.mic=p.pc.addTrack(t,st)}
watchStream('me',st)
for(const uid of V.peers.keys())setTimeout(()=>sendKinds(uid),300)
setState()
emit('voice:update')
}
export async function joinVoice({ch,hub,label,path,stage}){
if(V.joining)return
if(V.ch===ch)return
if(V.ch)await leaveVoice()
if(!isOpen(hub)){toast('Not connected to the server yet. Try again in a moment.','err');return}
V.joining=true
try{
const d=await GET('/api/rtc/ice')
V.ice=d.iceServers
}catch(e){V.joining=false;fail(e);return}
const pr=voicePrefs()
V.muted=false
V.deaf=false
try{
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('none')
V.mic=await navigator.mediaDevices.getUserMedia(micOpts())
}catch(e){
V.mic=await askMic(e)
if(!V.mic){V.muted=true;toast('Joined listen-only. Press the microphone button any time to turn it on.')}
}
V.ch=ch;V.hub=hub;V.label=label;V.path=path
V.joined=false
V.joining=false
if(V.mic){
if(pr.ptt||stage){V.mic.getAudioTracks().forEach(t=>t.enabled=false);V.muted=true}
watchStream('me',V.mic)
}
wsSend(hub,{t:'voice.join',ch,m:V.muted,d:false})
startTimers()
if(voicePrefs().captions&&captionsSupported)startCaptions()
emit('voice:update')
}

export async function leaveVoice(){
if(!V.ch)return
if(V.hub)wsSend(V.hub,{t:'voice.leave'})
teardown()
emit('voice:update')
}
function teardown(){
for(const p of V.peers.values())closePeer(p)
V.peers.clear()
V.relayFor.clear()
V.relayVia.clear()
V.scrFor.clear()
V.scrVia.clear()
for(const s of[V.mic,V.cam,V.scr])s?.getTracks().forEach(t=>t.stop())
V.mic=V.cam=V.scr=V.scrA=null
stopCaptions()
V.ch=V.hub=null
V.joined=false
if(V.since)tone([[620,.08],[400,.14]])
V.since=0
V.hand=false
V.label=V.path=''
V.speaking.clear()
V.watch.clear()
V.quality={}
timers.forEach(clearInterval)
timers=[]
}
function closePeer(p){
try{p.pc.close()}catch{}
p.audioEl?.remove()
p.audioEl=null
p.scrAudioEl?.remove()
p.scrAudioEl=null
}
function dropPeer(uid){
const p=V.peers.get(uid)
if(!p)return
closePeer(p)
V.peers.delete(uid)
V.watch.delete(uid)
V.speaking.delete(uid)
try{
const r=V.relayFor.get(uid)
if(r)p.pc.removeTrack(r.sender)
}catch{}
V.relayFor.delete(uid)
V.relayVia.delete(uid)
for(const[k,r]of[...V.scrFor])if(r.to===uid||r.src===uid){for(const sd of r.senders)try{V.peers.get(r.to)?.pc.removeTrack(sd)}catch{}V.scrFor.delete(k)}
V.scrVia.delete(uid)
for(const[toUid,r]of[...V.relayFor])if(r.fromUid===uid){try{V.peers.get(toUid)?.pc.removeTrack(r.sender)}catch{}V.relayFor.delete(toUid)}
emit('voice:streams')
}

function routeAudio(p){
let micId=null
for(const[id,st]of p.astreams){const kk=p.kinds[id];const ks=kk&&kk.k||kk;if(ks==='mic'||(!kk&&micId==null&&!Object.values(p.kinds).some(x=>(x&&x.k||x)==='screenaudio')))micId=micId||id}
for(const[id,st]of p.astreams){
const kk=p.kinds[id]
const k=kk&&kk.k||kk
const from=kk&&kk.from
const t=from&&V.peers.get(from)?V.peers.get(from):p
const scr=k==='screenaudio'||(k!=='mic'&&micId!=null&&id!==micId)
if(scr){
if(!t.scrAudioEl){t.scrAudioEl=new Audio();t.scrAudioEl.autoplay=true;sink.append(t.scrAudioEl);const pr=voicePrefs();if(pr.output&&t.scrAudioEl.setSinkId)t.scrAudioEl.setSinkId(pr.output).catch(()=>{})}
if(t.scrAudioEl.srcObject!==st)t.scrAudioEl.srcObject=st
setVol(t.scrAudioEl,V.deaf?0:t.vol)
}else{
if(!t.audioEl){t.audioEl=new Audio();t.audioEl.autoplay=true;sink.append(t.audioEl);const pr=voicePrefs();if(pr.output&&t.audioEl.setSinkId)t.audioEl.setSinkId(pr.output).catch(()=>{})}
if(t.audioEl.srcObject!==st){t.audioEl.srcObject=st;watchStream(t.uid,st)}
setVol(t.audioEl,V.deaf?0:t.vol)
}
}
}
function mkPeer(uid){
const pc=new RTCPeerConnection({iceServers:V.ice})
const p={uid,pc,astreams:new Map(),polite:S.me.id<uid,making:false,ignore:false,streams:new Map(),kinds:{},senders:{},audioEl:null,vol:2.5}
V.peers.set(uid,p)
pc.onicecandidate=e=>{if(e.candidate)sig(uid,{cand:e.candidate})}
pc.onnegotiationneeded=async()=>{
try{p.making=true;await pc.setLocalDescription();sig(uid,{desc:pc.localDescription})}catch{}finally{p.making=false}
}
pc.onconnectionstatechange=()=>{
if(pc.connectionState==='failed'){
try{pc.restartIce()}catch{}
setTimeout(()=>{if(V.peers.get(uid)===p&&pc.connectionState==='failed'){tryRelay(uid);tryScrRelay(uid)}},8000)
}
if(pc.connectionState==='disconnected')setTimeout(()=>{if(pc.connectionState==='disconnected'&&V.peers.get(uid)===p){try{pc.restartIce()}catch{}}},5000)
if(pc.connectionState==='connected'&&V.scrVia.has(uid)){sig(V.scrVia.get(uid).via,{scrStop:uid});V.scrVia.delete(uid)}
if(pc.connectionState==='connected'&&V.relayVia.has(uid)){sig(V.relayVia.get(uid),{relayStop:uid});V.relayVia.delete(uid)}
emit('voice:streams')
}
pc.ontrack=e=>{
const stream=e.streams[0]||new MediaStream([e.track])
if(e.track.kind==='audio'){
p.astreams.set(stream.id,stream)
routeAudio(p)
}else{
p.streams.set(stream.id,stream)
e.track.onended=()=>{if(!stream.getTracks().some(t=>t.readyState==='live')){p.streams.delete(stream.id);emit('voice:streams')}}
stream.onremovetrack=()=>{if(!stream.getVideoTracks().length){p.streams.delete(stream.id);emit('voice:streams')}}
emit('voice:streams')
}
}
setTimeout(()=>{if(V.peers.get(uid)===p&&pc.connectionState!=='connected'&&pc.connectionState!=='closed')tryScrRelay(uid)},14000)
sendKinds(uid)
if(!V.mic)pc.addTransceiver('audio',{direction:'recvonly'})
if(V.mic)for(const t of V.mic.getAudioTracks())p.senders.mic=pc.addTrack(t,V.mic)
if(V.cam)for(const t of V.cam.getVideoTracks())p.senders.cam=pc.addTrack(t,V.cam)
if(V.scr)for(const t of V.scr.getVideoTracks()){p.senders.scr=pc.addTrack(t,V.scr);tuneSender(p.senders.scr)}
if(V.scrA)for(const t of V.scrA.getAudioTracks())p.senders.scrA=pc.addTrack(t,V.scrA)
setTimeout(()=>sendKinds(uid),300)
return p
}
function kindsMap(){
const o={}
if(V.mic)o[V.mic.id]='mic'
if(V.cam)o[V.cam.id]='cam'
if(V.scr)o[V.scr.id]='screen'
if(V.scrA)o[V.scrA.id]='screenaudio'
return o
}
function sendKinds(uid){
const base=kindsMap()
const r=V.relayFor.get(uid)
if(r&&r.track)base[r.track.id]={k:'mic',from:r.fromUid}
for(const x of V.scrFor.values())if(x.to===uid)for(const[id,k]of Object.entries(x.kinds))base[id]={k,from:x.src}
sig(uid,{streams:base})
}
function relayHandle(fromUid,toUid){
try{
if(fromUid===toUid||toUid===S.me.id)return
const reqP=V.peers.get(fromUid)
if(!reqP)return
const toP=V.peers.get(toUid)||mkPeer(toUid)
let micStream=null
for(const[id,st]of reqP.astreams){const k=reqP.kinds[id];const ks=k&&k.k||k;if(ks==='mic'||!ks){micStream=st;if(ks==='mic')break}}
const track=micStream?.getAudioTracks?.()[0]
if(!track||toP.pc.connectionState==='closed')return
const old=V.relayFor.get(toUid)
if(old)try{toP.pc.removeTrack(old.sender)}catch{}
const sender=toP.pc.addTrack(track)
V.relayFor.set(toUid,{fromUid,track,sender})
sendKinds(toUid)
}catch{}
}
function scrRelayHandle(fromUid,srcUid){
try{
const reqP=V.peers.get(fromUid),srcP=V.peers.get(srcUid)
if(!reqP||!srcP||fromUid===srcUid||srcUid===S.me.id||reqP.pc.connectionState==='closed')return
const key=fromUid+'|'+srcUid
if(V.scrFor.has(key))return
const senders=[],kinds={}
for(const[id,st]of srcP.streams){const kk=srcP.kinds[id];const k=kk&&kk.k||kk;if(k==='screen')for(const t of st.getVideoTracks()){senders.push(reqP.pc.addTrack(t,st));kinds[st.id]='screen'}}
for(const[id,st]of srcP.astreams){const kk=srcP.kinds[id];const k=kk&&kk.k||kk;if(k==='screenaudio')for(const t of st.getAudioTracks()){senders.push(reqP.pc.addTrack(t,st));kinds[st.id]='screenaudio'}}
if(!senders.length){sig(fromUid,{scrNo:srcUid});return}
V.scrFor.set(key,{to:fromUid,src:srcUid,senders,kinds})
sendKinds(fromUid)
}catch{}
}
function scrStopHandle(fromUid,srcUid){
const key=fromUid+'|'+srcUid
const r=V.scrFor.get(key)
if(!r)return
for(const sd of r.senders)try{V.peers.get(fromUid)?.pc.removeTrack(sd)}catch{}
V.scrFor.delete(key)
sendKinds(fromUid)
}
function tryScrRelay(srcUid){
try{
if(V.scrVia.has(srcUid)&&V.scrVia.get(srcUid).done)return
const tried=V.scrVia.get(srcUid)?.tried||new Set()
const via=[...V.peers.values()].find(q=>q.uid!==srcUid&&q.pc.connectionState==='connected'&&!tried.has(q.uid))
if(!via)return
tried.add(via.uid)
V.scrVia.set(srcUid,{via:via.uid,tried})
sig(via.uid,{scrReq:srcUid})
}catch{}
}
function relayStopHandle(fromUid,toUid){
try{
const r=V.relayFor.get(toUid)
if(r&&r.fromUid===fromUid){V.peers.get(toUid)?.pc.removeTrack(r.sender);V.relayFor.delete(toUid);sendKinds(toUid)}
}catch{}
}
function tryRelay(uid){
try{
if(!V.mic||V.relayVia.has(uid))return
const relay=[...V.peers.values()].find(q=>q.uid!==uid&&q.pc.connectionState==='connected')
if(!relay)return
V.relayVia.set(uid,relay.uid)
sig(relay.uid,{relayReq:uid})
}catch{}
}

function handleSig(from,data){
if(!V.ch)return
if(data.relayReq!==undefined){relayHandle(from,data.relayReq);return}
if(data.relayStop!==undefined){relayStopHandle(from,data.relayStop);return}
if(data.scrReq!==undefined){scrRelayHandle(from,data.scrReq);return}
if(data.scrStop!==undefined){scrStopHandle(from,data.scrStop);return}
if(data.scrNo!==undefined){tryScrRelay(data.scrNo);return}
const p=V.peers.get(from)||mkPeer(from)
p.q=(p.q||Promise.resolve()).then(()=>doSig(p,from,data)).catch(()=>{})
return p.q
}
async function doSig(p,from,data){
const pc=p.pc
try{
if(data.streams){p.kinds=data.streams;routeAudio(p);emit('voice:streams');return}
if(typeof data.cap==='string'){if(voicePrefs().captions)emit('voice:caption',{uid:from,text:data.cap.slice(0,200)});return}
if(data.desc){
const collision=data.desc.type==='offer'&&(p.making||pc.signalingState!=='stable')
p.ignore=!p.polite&&collision
if(p.ignore)return
await pc.setRemoteDescription(data.desc)
if(data.desc.type==='offer'){await pc.setLocalDescription();sig(from,{desc:pc.localDescription})}
}else if(data.cand){
try{await pc.addIceCandidate(data.cand)}catch(e){if(!p.ignore)throw e}
}
}catch{}
}

export function voiceEvent(room,m){
if(m.t==='ready'){
for(const[ch,users]of Object.entries(m.voice||{}))S.voice[ch]=users
emit('voice:update')
return true
}
if(m.t==='voice.state'){
const before=S.voice[m.ch]||{}
if(Object.keys(m.users).length)S.voice[m.ch]=m.users;else delete S.voice[m.ch]
if(V.ch===m.ch){
if(V.joined){
const nj=Object.keys(m.users).filter(u=>!before[u]&&u!==S.me.id).length,nl=Object.keys(before).filter(u=>!m.users[u]&&u!==S.me.id).length
if(nj)tone([[660,.08],[880,.1]])
else if(nl)tone([[880,.08],[560,.12]])
}
for(const uid of [...V.peers.keys()])if(!m.users[uid])dropPeer(uid)
if(V.joined&&!m.users[S.me.id]){teardown()}
}
emit('voice:update')
return true
}
if(m.t==='voice.joined'){
if(V.ch!==m.ch)return true
V.joined=true
V.since||=Date.now()
tone([[523,.08],[784,.12]])
for(const uid of m.peers)if(!V.peers.has(uid))mkPeer(uid)
emit('voice:update')
return true
}
if(m.t==='voice.error'){toast(m.error,'err');if(V.ch===m.ch)teardown();emit('voice:update');return true}
if(m.t==='sig'){handleSig(m.from,m.data);return true}
return false
}

on('ws:open',({room,again})=>{
if(again&&V.ch&&room===V.hub){
V.joined=false
for(const p of V.peers.values())closePeer(p)
V.peers.clear()
wsSend(V.hub,{t:'voice.join',ch:V.ch,m:V.muted||V.deaf,d:V.deaf})
}
})
on('ws:close',({room})=>{
if(V.ch&&room===V.hub)emit('voice:update')
})

export function setMuted(v){
V.muted=v
V.mic?.getAudioTracks().forEach(t=>t.enabled=!v&&!V.deaf)
setState()
emit('voice:update')
}
export const toggleMute=()=>{
if(!V.mic){enableMic();return}
if(V.deaf){setDeaf(false);return}
setMuted(!V.muted)
}
export function setDeaf(v){
V.deaf=v
for(const p of V.peers.values()){if(p.audioEl)setVol(p.audioEl,v?0:p.vol);if(p.scrAudioEl)setVol(p.scrAudioEl,v?0:p.vol)}
V.mic?.getAudioTracks().forEach(t=>t.enabled=!v&&!V.muted)
setState()
emit('voice:update')
}
export const toggleDeaf=()=>setDeaf(!V.deaf)
export function toggleHand(){
V.hand=!V.hand
setState()
emit('voice:update')
}

export async function toggleCam(){
if(!V.ch)return
if(V.cam){
V.cam.getTracks().forEach(t=>t.stop())
for(const p of V.peers.values()){if(p.senders.cam){try{p.pc.removeTrack(p.senders.cam)}catch{}p.senders.cam=null}}
V.cam=null
}else{
const pr=voicePrefs()
try{V.cam=await navigator.mediaDevices.getUserMedia({video:{deviceId:pr.camera?{ideal:pr.camera}:undefined,width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}}})}
catch(e){toast('Camera unavailable: '+(e.name==='NotAllowedError'?'permission denied':e.message),'err');return}
for(const p of V.peers.values())for(const t of V.cam.getVideoTracks()){p.senders.cam=p.pc.addTrack(t,V.cam)}
for(const uid of V.peers.keys())setTimeout(()=>sendKinds(uid),300)
}
setState()
emit('voice:update')
emit('voice:streams')
}
const RES={'parli':[854,480],'480':[854,480],'720':[1280,720],'1080':[1920,1080],'1440':[2560,1440]}
function scrConstraints(pr){
const r=RES[pr.scrRes]
const v={frameRate:{ideal:pr.scrFps,max:pr.scrFps}}
if(r){v.width={ideal:r[0],max:r[0]};v.height={ideal:r[1],max:r[1]}}
return v
}
function kbpsFor(pr){
if(pr.scrKbps>0)return pr.scrKbps*1000
const r=RES[pr.scrRes]
const px=r?r[0]*r[1]:1920*1080
return Math.round(Math.min(10e6,Math.max(600e3,px*pr.scrFps*0.06)))
}
async function tuneSender(sender){
if(!sender||!sender.getParameters)return
try{
const pr=voicePrefs()
const prm=sender.getParameters()
if(!prm.encodings||!prm.encodings.length)prm.encodings=[{}]
prm.encodings[0].maxBitrate=kbpsFor(pr)
prm.encodings[0].maxFramerate=pr.scrFps
if(pr.scrFps>=30)prm.degradationPreference='maintain-framerate'
else prm.degradationPreference='maintain-resolution'
await sender.setParameters(prm)
}catch{}
}
export async function applyScreenQuality(){
if(!V.scr)return
const pr=voicePrefs()
const vt=V.scr.getVideoTracks()[0]
try{await vt.applyConstraints(scrConstraints(pr))}catch{}
try{vt.contentHint=pr.scrRes==='parli'?'detail':pr.scrFps>=30?'motion':'detail'}catch{}
for(const p of V.peers.values())await tuneSender(p.senders.scr)
}
export async function toggleScreen(){
if(!V.ch)return
if(V.scr){stopScreen();return}
const md=navigator.mediaDevices
if(!md){toast('Sharing needs a secure connection and a modern browser.','err');return}
const pr=voicePrefs()
if(!md.getDisplayMedia){
try{V.scr=await md.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}},audio:false});toast('This device cannot share its screen, so your camera is being shared instead.')}catch(e){if(e.name!=='NotAllowedError')toast('Could not start sharing: '+e.message,'err');return}
}else try{
V.scr=await md.getDisplayMedia({video:scrConstraints(pr),audio:pr.scrAudio?{echoCancellation:false,noiseSuppression:false,autoGainControl:false}:false})
}catch(e){
if(e.name==='NotAllowedError')return
try{V.scr=await md.getDisplayMedia({video:true,audio:false})}catch(e2){if(e2.name!=='NotAllowedError')toast('Could not start screen share: '+e2.message,'err');return}
}
const at=V.scr.getAudioTracks()
if(pr.scrAudio&&!at.length)toast('No audio was shared. In the picker, choose a tab or the entire screen and tick the audio box.','err')
V.scrA=at.length?new MediaStream(at):null
try{V.scr.getVideoTracks()[0].contentHint=pr.scrRes==='parli'?'detail':pr.scrFps>=30?'motion':'detail'}catch{}
V.scr.getVideoTracks()[0].onended=()=>stopScreen()
for(const uid of V.peers.keys())sendKinds(uid)
for(const p of V.peers.values()){
for(const t of V.scr.getVideoTracks()){p.senders.scr=p.pc.addTrack(t,V.scr);tuneSender(p.senders.scr)}
if(V.scrA)for(const t of V.scrA.getAudioTracks())p.senders.scrA=p.pc.addTrack(t,V.scrA)
}
setState()
emit('voice:update')
emit('voice:streams')
}
function stopScreen(){
if(!V.scr)return
V.scr.getTracks().forEach(t=>t.stop())
for(const p of V.peers.values()){
for(const k of['scr','scrA'])if(p.senders[k]){try{p.pc.removeTrack(p.senders[k])}catch{}p.senders[k]=null}
}
V.scr=null;V.scrA=null
for(const uid of V.peers.keys())sendKinds(uid)
setState()
emit('voice:update')
emit('voice:streams')
}

export async function switchInput(id){
const pr=voicePrefs()
if(!V.mic)return
try{
const ns=await navigator.mediaDevices.getUserMedia({audio:{deviceId:id?{exact:id}:undefined,echoCancellation:pr.echo,noiseSuppression:pr.noise,autoGainControl:pr.agc}})
const nt=ns.getAudioTracks()[0]
nt.enabled=!V.muted&&!V.deaf
for(const p of V.peers.values())if(p.senders.mic)await p.senders.mic.replaceTrack(nt)
V.mic.getTracks().forEach(t=>t.stop())
V.mic=ns
V.watch.delete('me')
watchStream('me',ns)
}catch(e){fail(e)}
}
let boostCtx=null
function setVol(a,v){
const st=a.srcObject
try{
if(!boostCtx){boostCtx=new AudioContext();const o=voicePrefs().output;if(o&&boostCtx.setSinkId)boostCtx.setSinkId(o).catch(()=>{})}
if(st&&a._st!==st){try{a._src&&a._src.disconnect()}catch{}a._st=st;a._src=boostCtx.createMediaStreamSource(st);a._g=boostCtx.createGain();a._src.connect(a._g);a._g.connect(boostCtx.destination)}
if(a._g){a.volume=0;a._g.gain.value=v;if(boostCtx.state==='suspended')boostCtx.resume().catch(()=>{});return}
}catch{}
a.volume=Math.min(1,v)
}
export function applyOutput(id){
if(boostCtx?.setSinkId)boostCtx.setSinkId(id||'').catch(()=>{})
for(const p of V.peers.values())for(const a of[p.audioEl,p.scrAudioEl])if(a?.setSinkId)a.setSinkId(id||'').catch(()=>{})
}
export function setPeerVolume(uid,v){
const p=V.peers.get(uid)
if(p){p.vol=v;if(p.audioEl)setVol(p.audioEl,V.deaf?0:v);if(p.scrAudioEl)setVol(p.scrAudioEl,V.deaf?0:v)}
}

function watchStream(id,stream){
try{
audioCtx||=new (window.AudioContext||window.webkitAudioContext)()
if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{})
const src=audioCtx.createMediaStreamSource(stream)
const an=audioCtx.createAnalyser()
an.fftSize=512
src.connect(an)
V.watch.set(id,{an,buf:new Uint8Array(an.fftSize),on:0})
}catch{}
}
function startTimers(){
timers.push(setInterval(()=>{
let changed=false
for(const[id,w]of V.watch){
w.an.getByteTimeDomainData(w.buf)
let sum=0
for(const v of w.buf){const x=(v-128)/128;sum+=x*x}
const rms=Math.sqrt(sum/w.buf.length)
const uid=id==='me'?S.me.id:id
let speaking=rms>0.035
if(id==='me'&&(V.muted||V.deaf)){
if(rms>0.08&&!V.deaf&&V.mic&&Date.now()-(V.nudge||0)>30000&&(V.loud=(V.loud||0)+1)>12){V.nudge=Date.now();V.loud=0;toast('You are muted. Others cannot hear you.')}
speaking=false
}else V.loud=0
if(speaking)w.on=Date.now()
const act=speaking||Date.now()-w.on<350
if(act!==V.speaking.has(uid)){act?V.speaking.add(uid):V.speaking.delete(uid);changed=true}
}
if(changed)emit('voice:speaking')
},100))
timers.push(setInterval(async()=>{
const q={}
for(const[uid,p]of V.peers){
try{
const stats=await p.pc.getStats()
let rtt=null,lost=0,recv=0
stats.forEach(r=>{
if(r.type==='candidate-pair'&&r.nominated&&r.state==='succeeded'&&r.currentRoundTripTime!=null)rtt=r.currentRoundTripTime*1000
if(r.type==='inbound-rtp'&&r.kind==='audio'){lost+=r.packetsLost||0;recv+=r.packetsReceived||0}
})
const loss=recv+lost?lost/(recv+lost)*100:0
q[uid]=rtt==null?(p.pc.connectionState==='connected'?'good':'connecting'):rtt<150&&loss<3?'good':rtt<300&&loss<8?'fair':'poor'
}catch{}
}
V.quality=q
emit('voice:streams')
},4000))
}

addEventListener('keydown',e=>{
const pr=voicePrefs()
if(!V.ch||!pr.ptt||e.code!==pr.pttKey||e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return
if(V.mic&&!V.deaf){V.mic.getAudioTracks().forEach(t=>t.enabled=true);V.muted=false;setState();emit('voice:update')}
})
addEventListener('keyup',e=>{
const pr=voicePrefs()
if(!V.ch||!pr.ptt||e.code!==pr.pttKey)return
V.mic?.getAudioTracks().forEach(t=>t.enabled=false)
V.muted=true
setState()
emit('voice:update')
})
addEventListener('beforeunload',()=>{if(V.ch&&V.hub)wsSend(V.hub,{t:'voice.leave'})})

const SR=window.SpeechRecognition||window.webkitSpeechRecognition
export const captionsSupported=!!SR
let rec=null,recOn=false
export function startCaptions(){
if(!SR||!V.ch||rec)return false
recOn=true
rec=new SR()
rec.continuous=true;rec.interimResults=false;rec.lang=navigator.language||'en-US'
rec.onresult=e=>{
for(let i=e.resultIndex;i<e.results.length;i++){
if(!e.results[i].isFinal)continue
const text=e.results[i][0].transcript.trim().slice(0,200)
if(!text||V.muted||V.deaf)continue
emit('voice:caption',{uid:S.me.id,text})
for(const uid of V.peers.keys())sig(uid,{cap:text})
}
}
rec.onend=()=>{rec=null;if(recOn&&V.ch&&voicePrefs().captions)setTimeout(startCaptions,400)}
rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){recOn=false;toast('Captions need microphone speech recognition, which this browser blocked','err')}}
try{rec.start()}catch{rec=null;return false}
return true
}
export function stopCaptions(){recOn=false;try{rec?.stop()}catch{}rec=null}
export function voiceSettingsView(){
const pr=voicePrefs()
const wrap=h('div')
const save=patch=>{Object.assign(pr,patch);saveVoicePrefs(pr)}
const sel=(label,kind,key,onChange)=>{
const s=h('select',{class:'sel',on:{change:e=>{save({[key]:e.target.value});onChange?.(e.target.value)}}},h('option',{value:''},'System default'))
navigator.mediaDevices?.enumerateDevices().then(list=>{
for(const d of list.filter(x=>x.kind===kind))s.append(h('option',{value:d.deviceId,selected:pr[key]===d.deviceId},d.label||(kind+' '+(s.options.length))))
}).catch(()=>{})
return field(label,s)
}
mount(wrap,
sel('Input device','audioinput','input',id=>switchInput(id)),
sel('Output device','audiooutput','output',id=>applyOutput(id)),
sel('Camera','videoinput','camera'),
h('div',{class:'perm'},toggle(pr.echo,v=>save({echo:v}),'Echo cancellation'),h('span',null,'Echo cancellation')),
h('div',{class:'perm'},toggle(pr.noise,v=>save({noise:v}),'Noise suppression'),h('span',null,'Noise suppression')),
h('div',{class:'perm'},toggle(pr.agc,v=>save({agc:v}),'Automatic gain'),h('span',null,'Automatic gain control')),
h('div',{class:'hint'},'Echo, noise and gain changes apply the next time you join a call.'),
h('h4',{style:{margin:'16px 0 6px'}},'Screen sharing'),
field('Resolution',h('select',{class:'sel','aria-label':'Screen share resolution',on:{change:e=>{save({scrRes:e.target.value});applyScreenQuality()}}},[['parli','Parli-2K Optimized'],['480','480p'],['720','720p (recommended)'],['1080','1080p'],['1440','1440p'],['native','Source size']].map(([v,l])=>h('option',{value:v,selected:String(pr.scrRes)===v},l)))),
field('Frame rate',h('select',{class:'sel','aria-label':'Screen share frame rate',on:{change:e=>{save({scrFps:+e.target.value});applyScreenQuality()}}},[[5,'5 fps, slides'],[15,'15 fps'],[30,'30 fps'],[60,'60 fps, games']].map(([v,l])=>h('option',{value:v,selected:+pr.scrFps===v},l)))),
field('Maximum bitrate',h('select',{class:'sel','aria-label':'Screen share bitrate',on:{change:e=>{save({scrKbps:+e.target.value});applyScreenQuality()}}},[[0,'Automatic'],[1500,'1.5 Mbps'],[3000,'3 Mbps'],[6000,'6 Mbps'],[10000,'10 Mbps']].map(([v,l])=>h('option',{value:v,selected:+pr.scrKbps===v},l))),'Calls connect people directly, so each viewer uses this much of your upload. Lower it if the picture stutters.'),
h('div',{class:'perm'},toggle(pr.scrAudio,v=>save({scrAudio:v}),'Share audio with screen'),h('span',null,'Share sound with my screen')),
h('div',{class:'hint'},'Sound sharing depends on your browser and system. Chrome and Edge can share a tab or the whole screen’s audio on Windows and ChromeOS. Changes to resolution, frame rate and bitrate apply to a share in progress.'),
h('h4',{style:{margin:'16px 0 6px'}},'Captions'),
captionsSupported?h('div',{class:'perm'},toggle(pr.captions,v=>{save({captions:v});if(v)startCaptions();else stopCaptions()},'Live captions'),h('span',null,'Show live captions in calls')):h('div',{class:'hint'},'Live captions are not supported in this browser.'),
captionsSupported?h('div',{class:'hint'},'Your browser’s speech recognition turns your own speech into text and sends it to the others in the call. Some browsers send the audio to their speech service to do this.'):null,
h('div',{class:'perm',style:{marginTop:'12px'}},toggle(pr.ptt,v=>save({ptt:v}),'Push to talk'),h('span',null,'Push to talk')),
(()=>{
const b=h('button',{class:'btn',on:{click:()=>{
b.textContent='Press a key…'
const fn=e=>{e.preventDefault();save({pttKey:e.code});b.textContent=e.code;removeEventListener('keydown',fn,true)}
addEventListener('keydown',fn,true)
}}},pr.pttKey)
return field('Push-to-talk key',b,'Push to talk only works while this tab is focused.')
})())
return wrap
}

import{upscale}from'./upscale.js'
const vids=new WeakMap()
let mega=null
const place=v=>{v.style.transform='translate('+v._x+'px,'+v._y+'px) scale('+v._z+')';v.style.cursor=v._z>1?'grab':'zoom-in'}
const vidOf=(stream,mute)=>{
let v=vids.get(stream)
if(v)return v
const vd=h('video',{autoplay:true,playsInline:true,muted:mute})
vd.srcObject=stream
v=h('div',{class:'vw'},vd)
upscale(vd,v)
v._z=1;v._x=0;v._y=0;v._d=null
v.addEventListener('wheel',e=>{e.preventDefault();v._z=Math.max(1,Math.min(8,v._z*(e.deltaY<0?1.2:1/1.2)));if(v._z===1){v._x=0;v._y=0}place(v)},{passive:false})
v.addEventListener('pointerdown',e=>{if(v._z<=1)return;v.setPointerCapture(e.pointerId);v._d=[e.clientX,e.clientY,v._x,v._y]})
v.addEventListener('pointermove',e=>{if(!v._d)return;v._x=v._d[2]+e.clientX-v._d[0];v._y=v._d[3]+e.clientY-v._d[1];place(v)})
v.addEventListener('pointerup',()=>{v._d=null})
vd.play?.().catch(()=>{})
place(v)
vids.set(stream,v)
return v
}
addEventListener('keydown',e=>{if(e.key==='Escape'&&mega){mega=null;document.querySelectorAll('.tile.mega').forEach(t=>t.classList.remove('mega'))}})
export function mountVoiceRoom(container,chId,label,hub,path,stage){
const draw=()=>{
const users=S.voice[chId]||{}
const joined=V.ch===chId
const ids=Object.keys(users)
const grid=h('div',{class:'vgrid',style:{gridTemplateColumns:`repeat(auto-fit,minmax(${ids.length>4?'200px':'280px'},1fr))`}})
const aud=h('div',{class:'vgrid vaud',style:{gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))'}})
const mkTile=(uid,opts={})=>{
const u=uid===S.me.id?S.me:S.users.get(uid)||{id:uid,display_name:'Member'}
const st=users[uid]||{}
const tile=h('div',{class:'tile'+(V.speaking.has(uid)&&!opts.stream?' sp':'')})
if(opts.stream){
const v=vidOf(opts.stream,uid===S.me.id)
tile.append(v)
if(mega===opts.stream)tile.classList.add('mega')
const eb=h('button',{type:'button',class:'vt',title:'Fill the window',on:{click:e=>{e.stopPropagation();mega=mega===opts.stream?null:opts.stream;document.querySelectorAll('.tile.mega').forEach(t=>t.classList.remove('mega'));if(mega)tile.classList.add('mega');eb.textContent=mega?'Shrink':'Expand'}}},mega===opts.stream?'Shrink':'Expand')
tile.append(h('div',{class:'vtools'},eb,h('button',{type:'button',class:'vt',title:'Full screen',on:{click:e=>{e.stopPropagation();tile.requestFullscreen?.()}}},'Full screen'),h('button',{type:'button',class:'vt',title:'Reset zoom',on:{click:e=>{e.stopPropagation();v._z=1;v._x=0;v._y=0;place(v)}}},'Reset zoom')))
tile.addEventListener('dblclick',()=>{if(document.fullscreenElement)document.exitFullscreen();else tile.requestFullscreen?.()})
}else tile.append(avatar(u,'lg'))
const q=uid!==S.me.id?V.quality[uid]:null
tile.append(h('div',{class:'nm'},opts.label||u.display_name,st.h&&!opts.stream?h('span',{class:'hand',title:'Hand raised'},icon('hand','s')):null,st.m&&!opts.stream?icon('micoff','s'):null,st.d&&!opts.stream?icon('deaf','s'):null,q&&!opts.stream?h('span',{class:'q '+(q==='fair'?'fair':q==='poor'?'poor':''),title:'Connection: '+q},icon('refresh','s')):null))
if(uid!==S.me.id&&!opts.stream)tile.addEventListener('contextmenu',e=>{
e.preventDefault()
const p=V.peers.get(uid)
const r=h('input',{type:'range',min:0,max:4,step:.1,value:p?.vol??2.5,'aria-label':'Volume',on:{input:e=>setPeerVolume(uid,+e.target.value)}})
popup([h('div',{style:{padding:'8px'}},h('div',{class:'hint'},'Volume for '+u.display_name),r)],e.clientX,e.clientY)
})
return tile
}
for(const uid of ids){
(stage&&(users[uid]||{}).m?aud:grid).append(mkTile(uid))
if(uid===S.me.id){
if(V.cam)grid.append(mkTile(uid,{stream:V.cam,label:'You (camera)'}))
if(V.scr)grid.append(mkTile(uid,{stream:V.scr,label:'You (screen)'}))
}else{
const p=V.peers.get(uid)
const u=S.users.get(uid)
let direct=false
if(p){
let first=true
for(const[sid,stream]of p.streams){
const kk=p.kinds[sid]
const kind=(kk&&kk.k||kk)||(first?'cam':'screen')
if(kk&&kk.from&&kk.from!==uid)continue
first=false
if(kind==='screen')direct=true
grid.append(mkTile(uid,{stream,label:(u?.display_name||'Member')+(kind==='screen'?' (screen)':' (camera)')}))
}
}
if(!direct)for(const q of V.peers.values()){
if(q.uid===uid)continue
for(const[sid,stream]of q.streams){
const kk=q.kinds[sid]
if(kk&&kk.from===uid&&kk.k==='screen')grid.append(mkTile(uid,{stream,label:(u?.display_name||'Member')+' (screen)'}))
}
}
}
}
if(stage&&!grid.children.length&&ids.length)grid.append(h('div',{class:'empty',style:{gridColumn:'1/-1'}},h('div',{class:'vempty'},h('b',null,'Nobody is speaking'),h('p',null,'Listeners can raise a hand; unmute to take the stage.'))))
if(!ids.length)grid.append(h('div',{class:'empty',style:{gridColumn:'1/-1'}},h('div',{class:'vempty'},h('b',null,stage?'The stage is empty':'Nobody is here yet'),h('p',null,stage?'Join as a listener, raise your hand and unmute to speak.':'Join to talk, turn on your camera or share your screen.'))))
const btn=(ic,t,fn,cls)=>h('button',{class:'ib '+(cls||''),title:t,'aria-label':t,'aria-pressed':cls?.includes('on')?'true':'false',on:{click:fn}},icon(ic))
const bar=h('div',{class:'vbar',role:'toolbar','aria-label':'Voice controls'})
if(joined){
bar.append(
btn(V.muted||V.deaf?'micoff':'mic',V.muted?'Unmute':'Mute',toggleMute,V.muted||V.deaf?'on':''),
btn(V.deaf?'deaf':'headphones',V.deaf?'Undeafen':'Deafen',toggleDeaf,V.deaf?'on':''),
btn(V.cam?'video':'videooff',V.cam?'Turn camera off':'Turn camera on',toggleCam,V.cam?'on':''),
btn('hand',V.hand?'Lower hand':'Raise hand',toggleHand,V.hand?'on':''),
btn('screen',V.scr?'Stop sharing screen':'Share screen',toggleScreen,V.scr?'on':''),
...(conv(chId)?.members?.length>2?[h('button',{class:'ib',title:'Add people to this call','aria-label':'Add people to this call',on:{click:e=>invitePeople(chId,e.currentTarget)}},icon('plus'))]:[]),
btn('sliders','Voice settings',()=>emit('ui:voicesettings')),
btn('leave','Disconnect',leaveVoice,'dng'))
}else bar.append(h('button',{class:'btn pri',on:{click:()=>joinVoice({ch:chId,hub,label,path,stage})}},icon(stage?'hand':'volume','s'),stage?'Join stage':'Join voice'),h('button',{class:'btn',on:{click:()=>emit('ui:voicesettings')}},icon('sliders','s'),'Settings'))
const clock=h('span',{class:'vtime'})
const tick=()=>{if(V.ch===chId&&V.since){const s=Math.floor((Date.now()-V.since)/1000);clock.textContent=(s>=3600?Math.floor(s/3600)+':':'')+String(Math.floor(s%3600/60)).padStart(s>=3600?2:1,'0')+':'+String(s%60).padStart(2,'0')}else clock.textContent=''}
tick()
if(joined)bar.prepend(clock)
mount(container,h('div',{class:'vroom'},...(stage?[h('div',{class:'vsec'},'On stage'),grid,h('div',{class:'vsec'},'Audience ('+aud.children.length+')'),aud]:[grid]),capBar,bar))
}
const capBar=h('div',{class:'vcaps','aria-live':'polite',hidden:true})
const caps=[]
const offCap=on('voice:caption',({uid,text})=>{const u=uid===S.me.id?S.me:S.users.get(uid);caps.push({n:u?.display_name||'Member',t:text,at:Date.now()});while(caps.length>3)caps.shift();showCaps()})
function showCaps(){const live=caps.filter(c=>Date.now()-c.at<7000);capBar.hidden=!live.length;mount(capBar,live.map(c=>h('div',null,h('b',null,c.n+': '),c.t)));setTimeout(()=>{if(caps.some(c=>Date.now()-c.at>=7000))showCaps()},7200)}
draw()
const iv=setInterval(()=>{const c=container.querySelector('.vtime');if(c&&V.since&&V.ch===chId){const s=Math.floor((Date.now()-V.since)/1000);c.textContent=(s>=3600?Math.floor(s/3600)+':':'')+String(Math.floor(s%3600/60)).padStart(s>=3600?2:1,'0')+':'+String(s%60).padStart(2,'0')}},1000)
const offs=[on('voice:update',draw),on('voice:streams',draw),on('voice:speaking',draw)]
return()=>{clearInterval(iv);offs.forEach(f=>f());offCap()}
}

const rings=new Map()
export function stopRing(room){
const r=rings.get(room)
if(!r)return
clearInterval(r.iv)
clearTimeout(r.to)
r.t.remove()
rings.delete(room)
}
export function ringToast(from,room,accept){
stopRing(room)
const t=toast(`${from.display_name} is calling you`,'ok',null,true)
desktop(`${from.display_name} is calling you`,'Open Parley to answer','call_'+room,()=>{stopRing(room);accept()})
const ring=()=>tone([[740,.12],[587,.12],[740,.12],[587,.12]],.13)
ring()
const iv=setInterval(ring,2400)
const to=setTimeout(()=>stopRing(room),30000)
rings.set(room,{t,iv,to})
t.append(h('div',{class:'row'},h('button',{class:'btn sm pri',on:{click:()=>{stopRing(room);accept()}}},'Answer'),h('button',{class:'btn sm',on:{click:()=>{stopRing(room);POST(`/api/conversations/${room}/ring/decline`,{}).catch(()=>{})}}},'Decline')))
}

function invitePeople(room,anchor){
const c=conv(room)
if(!c)return
const inCall=new Set(Object.keys(S.voice[room]||{}))
const others=c.members.filter(m=>m.id!==S.me.id)
const r=anchor.getBoundingClientRect()
const rows=others.map(m=>{
const here=inCall.has(m.id)
return h('div',{class:'li',style:{padding:'6px 10px',minWidth:'240px'}},avatar(m,28),h('div',{class:'grow'},h('b',null,m.display_name),h('small',null,here?'In the call':'Not in the call')),here?null:h('button',{class:'btn sm',on:{click:async e=>{
e.currentTarget.disabled=true
try{await POST(`/api/conversations/${room}/ring`,{user_ids:[m.id]});e.currentTarget.textContent='Ringing'}catch(x){fail(x);e.currentTarget.disabled=false}
}}},'Ring'))
})
const missing=others.filter(m=>!inCall.has(m.id))
popup(h('div',null,h('div',{class:'hint',style:{padding:'8px 10px'}},`${inCall.size} of 12 in the call. Calls use direct connections, so 12 is the limit.`),rows,missing.length?h('div',{style:{padding:'8px 10px'}},h('button',{class:'btn pri sm',on:{click:async()=>{try{await POST(`/api/conversations/${room}/ring`,{user_ids:missing.map(m=>m.id)});toast('Ringing '+missing.length+' people','ok')}catch(x){fail(x)}}}},'Ring everyone not here')):null),Math.max(8,r.left-200),Math.max(8,r.top-60-others.length*46))
}
