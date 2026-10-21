import{S,setting}from'./state.js'

let ctx=null
export async function requestDesktop(){
if(!('Notification'in window))return false
if(Notification.permission==='granted')return true
if(Notification.permission==='denied')return false
return (await Notification.requestPermission())==='granted'
}
function quiet(){
if(S.me.presence==='busy'||setting('dnd',false))return true
if(!setting('quiet_on',false))return false
const [sh,sm]=setting('quiet_start','22:00').split(':').map(Number)
const [eh,em]=setting('quiet_end','07:00').split(':').map(Number)
const d=new Date()
const n=d.getHours()*60+d.getMinutes()
const a=sh*60+sm,b=eh*60+em
return a<=b?n>=a&&n<b:n>=a||n<b
}
export function tone(notes,vol=.1){
if(!setting('sound',true))return
try{
ctx||=new (window.AudioContext||window.webkitAudioContext)()
if(ctx.state==='suspended')ctx.resume()
let t=ctx.currentTime
for(const[f,d]of notes){
const o=ctx.createOscillator(),g=ctx.createGain()
o.type='sine'
o.frequency.setValueAtTime(f,t)
g.gain.setValueAtTime(.0001,t)
g.gain.exponentialRampToValueAtTime(vol,t+.02)
g.gain.exponentialRampToValueAtTime(.0001,t+d)
o.connect(g).connect(ctx.destination)
o.start(t)
o.stop(t+d+.02)
t+=d
}
}catch{}
}
export function ping(){
if(!setting('sound',true)||quiet())return
try{
ctx||=new (window.AudioContext||window.webkitAudioContext)()
if(ctx.state==='suspended')ctx.resume()
const o=ctx.createOscillator(),g=ctx.createGain()
o.type='sine'
o.frequency.setValueAtTime(880,ctx.currentTime)
o.frequency.setValueAtTime(660,ctx.currentTime+.09)
g.gain.setValueAtTime(.0001,ctx.currentTime)
g.gain.exponentialRampToValueAtTime(.12,ctx.currentTime+.02)
g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.22)
o.connect(g).connect(ctx.destination)
o.start()
o.stop(ctx.currentTime+.25)
}catch{}
}
export function desktop(title,body,tag,onclick){
if(!setting('desktop',false)||quiet()||!('Notification'in window)||Notification.permission!=='granted')return
if(document.hasFocus()&&!document.hidden)return
const opts={body:String(body).slice(0,140),tag,silent:true,icon:'/logo-192.png'}
try{
const n=new Notification(title,opts)
n.onclick=()=>{window.focus();onclick?.();n.close()}
}catch{
navigator.serviceWorker?.getRegistration().then(r=>r?.showNotification(title,{...opts,data:{url:'/'}})).catch(()=>{})
}
}
export async function testDesktop(){
if(!(await requestDesktop()))return false
const opts={body:'Notifications are working.',tag:'parley_test',icon:'/logo-192.png'}
try{new Notification('Parley',opts)}catch{
const r=await navigator.serviceWorker?.getRegistration()
if(!r)return false
await r.showNotification('Parley',{...opts,data:{url:'/'}})
}
return true
}
