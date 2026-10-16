import{h,mount,icon,GET,avatar,toast,fail,popup,field,toggle}from'./util.js'
import{S,on,emit}from'./state.js'
import{send as wsSend,isOpen}from'./net.js'

export const V={ch:null,hub:null,label:'',path:'',peers:new Map(),mic:null,cam:null,scr:null,muted:false,deaf:false,speaking:new Set(),quality:{},ice:null,watch:new Map(),joining:false}

const KEY='parley:voice'
export function voicePrefs(){
let p={}
try{p=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
return{input:'',output:'',camera:'',echo:true,noise:true,agc:true,ptt:false,pttKey:'KeyV',...p}
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
const setState=()=>wsSend(V.hub,{t:'voice.state',m:V.muted||V.deaf,d:V.deaf,vid:!!V.cam,scr:!!V.scr})

export async function joinVoice({ch,hub,label,path}){
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
V.mic=await navigator.mediaDevices.getUserMedia({audio:{deviceId:pr.input?{ideal:pr.input}:undefined,echoCancellation:pr.echo,noiseSuppression:pr.noise,autoGainControl:pr.agc},video:false})
}catch(e){
V.mic=null
V.muted=true
toast('Microphone unavailable ('+(e.name==='NotAllowedError'?'permission denied':e.message)+'). Joined listen-only.','err')
}
V.ch=ch;V.hub=hub;V.label=label;V.path=path
V.joined=false
V.joining=false
if(V.mic){
if(pr.ptt){V.mic.getAudioTracks().forEach(t=>t.enabled=false);V.muted=true}
watchStream('me',V.mic)
}
wsSend(hub,{t:'voice.join',ch,m:V.muted,d:false})
startTimers()
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
for(const s of[V.mic,V.cam,V.scr])s?.getTracks().forEach(t=>t.stop())
V.mic=V.cam=V.scr=null
V.ch=V.hub=null
V.joined=false
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
}
function dropPeer(uid){
const p=V.peers.get(uid)
if(!p)return
closePeer(p)
V.peers.delete(uid)
V.watch.delete(uid)
V.speaking.delete(uid)
emit('voice:streams')
}

function mkPeer(uid){
const pc=new RTCPeerConnection({iceServers:V.ice})
const p={uid,pc,polite:S.me.id<uid,making:false,ignore:false,streams:new Map(),kinds:{},senders:{},audioEl:null,vol:1}
V.peers.set(uid,p)
pc.onicecandidate=e=>{if(e.candidate)sig(uid,{cand:e.candidate})}
pc.onnegotiationneeded=async()=>{
try{p.making=true;await pc.setLocalDescription();sig(uid,{desc:pc.localDescription})}catch{}finally{p.making=false}
}
pc.onconnectionstatechange=()=>{
if(pc.connectionState==='failed'){try{pc.restartIce()}catch{}}
emit('voice:streams')
}
pc.ontrack=e=>{
const stream=e.streams[0]||new MediaStream([e.track])
if(e.track.kind==='audio'){
if(!p.audioEl){
p.audioEl=new Audio()
p.audioEl.autoplay=true
sink.append(p.audioEl)
const pr=voicePrefs()
if(pr.output&&p.audioEl.setSinkId)p.audioEl.setSinkId(pr.output).catch(()=>{})
}
p.audioEl.srcObject=stream
p.audioEl.muted=V.deaf
p.audioEl.volume=p.vol
watchStream(uid,stream)
}else{
p.streams.set(stream.id,stream)
e.track.onended=()=>{if(!stream.getTracks().some(t=>t.readyState==='live')){p.streams.delete(stream.id);emit('voice:streams')}}
stream.onremovetrack=()=>{if(!stream.getVideoTracks().length){p.streams.delete(stream.id);emit('voice:streams')}}
emit('voice:streams')
}
}
if(V.mic)for(const t of V.mic.getAudioTracks())p.senders.mic=pc.addTrack(t,V.mic)
if(V.cam)for(const t of V.cam.getVideoTracks())p.senders.cam=pc.addTrack(t,V.cam)
if(V.scr)for(const t of V.scr.getVideoTracks())p.senders.scr=pc.addTrack(t,V.scr)
if(V.cam||V.scr)setTimeout(()=>sendKinds(uid),300)
return p
}
function kindsMap(){
const o={}
if(V.cam)o[V.cam.id]='cam'
if(V.scr)o[V.scr.id]='screen'
return o
}
function sendKinds(uid){sig(uid,{streams:kindsMap()})}

async function handleSig(from,data){
if(!V.ch)return
const p=V.peers.get(from)||mkPeer(from)
const pc=p.pc
try{
if(data.streams){p.kinds=data.streams;emit('voice:streams');return}
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
if(Object.keys(m.users).length)S.voice[m.ch]=m.users;else delete S.voice[m.ch]
if(V.ch===m.ch){
for(const uid of [...V.peers.keys()])if(!m.users[uid])dropPeer(uid)
if(V.joined&&!m.users[S.me.id]){teardown()}
}
emit('voice:update')
return true
}
if(m.t==='voice.joined'){
if(V.ch!==m.ch)return true
V.joined=true
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
if(!V.mic){toast('No microphone is available','err');return}
if(V.deaf){setDeaf(false);return}
setMuted(!V.muted)
}
export function setDeaf(v){
V.deaf=v
for(const p of V.peers.values())if(p.audioEl)p.audioEl.muted=v
V.mic?.getAudioTracks().forEach(t=>t.enabled=!v&&!V.muted)
setState()
emit('voice:update')
}
export const toggleDeaf=()=>setDeaf(!V.deaf)

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
export async function toggleScreen(){
if(!V.ch)return
if(V.scr){stopScreen();return}
if(!navigator.mediaDevices.getDisplayMedia){toast('Screen sharing is not supported in this browser','err');return}
try{V.scr=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30}},audio:false})}
catch(e){if(e.name!=='NotAllowedError')toast('Could not start screen share: '+e.message,'err');return}
V.scr.getVideoTracks()[0].onended=()=>stopScreen()
for(const p of V.peers.values())for(const t of V.scr.getVideoTracks())p.senders.scr=p.pc.addTrack(t,V.scr)
for(const uid of V.peers.keys())setTimeout(()=>sendKinds(uid),300)
setState()
emit('voice:update')
emit('voice:streams')
}
function stopScreen(){
if(!V.scr)return
V.scr.getTracks().forEach(t=>t.stop())
for(const p of V.peers.values()){if(p.senders.scr){try{p.pc.removeTrack(p.senders.scr)}catch{}p.senders.scr=null}}
V.scr=null
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
export function applyOutput(id){
for(const p of V.peers.values())if(p.audioEl?.setSinkId)p.audioEl.setSinkId(id||'').catch(()=>{})
}
export function setPeerVolume(uid,v){
const p=V.peers.get(uid)
if(p){p.vol=v;if(p.audioEl)p.audioEl.volume=v}
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
if(id==='me'&&(V.muted||V.deaf))speaking=false
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

export function mountVoiceRoom(container,chId,label,hub,path){
const draw=()=>{
const users=S.voice[chId]||{}
const joined=V.ch===chId
const ids=Object.keys(users)
const grid=h('div',{class:'vgrid',style:{gridTemplateColumns:`repeat(auto-fit,minmax(${ids.length>4?'200px':'280px'},1fr))`}})
const mkTile=(uid,opts={})=>{
const u=uid===S.me.id?S.me:S.users.get(uid)||{id:uid,display_name:'Member'}
const st=users[uid]||{}
const tile=h('div',{class:'tile'+(V.speaking.has(uid)&&!opts.stream?' sp':'')})
if(opts.stream){
const v=h('video',{autoplay:true,playsInline:true,muted:uid===S.me.id})
v.srcObject=opts.stream
tile.append(v)
tile.addEventListener('dblclick',()=>v.requestFullscreen?.())
}else tile.append(avatar(u,'lg'))
const q=uid!==S.me.id?V.quality[uid]:null
tile.append(h('div',{class:'nm'},opts.label||u.display_name,st.m&&!opts.stream?icon('micoff','s'):null,st.d&&!opts.stream?icon('deaf','s'):null,q&&!opts.stream?h('span',{class:'q '+(q==='fair'?'fair':q==='poor'?'poor':''),title:'Connection: '+q},icon('refresh','s')):null))
if(uid!==S.me.id&&!opts.stream)tile.addEventListener('contextmenu',e=>{
e.preventDefault()
const p=V.peers.get(uid)
const r=h('input',{type:'range',min:0,max:1,step:.05,value:p?.vol??1,'aria-label':'Volume',on:{input:e=>setPeerVolume(uid,+e.target.value)}})
popup([h('div',{style:{padding:'8px'}},h('div',{class:'hint'},'Volume for '+u.display_name),r)],e.clientX,e.clientY)
})
return tile
}
for(const uid of ids){
grid.append(mkTile(uid))
if(uid===S.me.id){
if(V.cam)grid.append(mkTile(uid,{stream:V.cam,label:'You (camera)'}))
if(V.scr)grid.append(mkTile(uid,{stream:V.scr,label:'You (screen)'}))
}else{
const p=V.peers.get(uid)
if(p){
let first=true
for(const[sid,stream]of p.streams){
const kind=p.kinds[sid]||(first?'cam':'screen')
first=false
const u=S.users.get(uid)
grid.append(mkTile(uid,{stream,label:(u?.display_name||'Member')+(kind==='screen'?' (screen)':' (camera)')}))
}
}
}
}
if(!ids.length)grid.append(h('div',{class:'empty',style:{gridColumn:'1/-1'}},'Nobody is in this voice channel yet.'))
const btn=(ic,t,fn,cls)=>h('button',{class:'ib '+(cls||''),title:t,'aria-label':t,'aria-pressed':cls?.includes('on')?'true':'false',on:{click:fn}},icon(ic))
const bar=h('div',{class:'vbar',role:'toolbar','aria-label':'Voice controls'})
if(joined){
bar.append(
btn(V.muted||V.deaf?'micoff':'mic',V.muted?'Unmute':'Mute',toggleMute,V.muted||V.deaf?'on':''),
btn(V.deaf?'deaf':'headphones',V.deaf?'Undeafen':'Deafen',toggleDeaf,V.deaf?'on':''),
btn(V.cam?'video':'videooff',V.cam?'Turn camera off':'Turn camera on',toggleCam,V.cam?'on':''),
btn('screen',V.scr?'Stop sharing screen':'Share screen',toggleScreen,V.scr?'on':''),
btn('sliders','Voice settings',()=>emit('ui:voicesettings')),
btn('leave','Disconnect',leaveVoice,'dng'))
}else bar.append(h('button',{class:'btn pri',on:{click:()=>joinVoice({ch:chId,hub,label,path})}},icon('volume','s'),'Join voice'),h('button',{class:'btn',on:{click:()=>emit('ui:voicesettings')}},icon('sliders','s'),'Settings'))
mount(container,h('div',{class:'vroom'},grid,bar))
}
draw()
const offs=[on('voice:update',draw),on('voice:streams',draw),on('voice:speaking',draw)]
return()=>offs.forEach(f=>f())
}

export function ringToast(from,room,accept){
const t=toast(`${from.display_name} is calling you`,'ok')
const row=h('div',{class:'row'},h('button',{class:'btn sm pri',on:{click:()=>{t.remove();accept()}}},'Answer'),h('button',{class:'btn sm',on:{click:()=>t.remove()}},'Decline'))
t.append(row)
setTimeout(()=>t.remove(),25000)
}
