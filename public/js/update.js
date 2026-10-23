import{h}from'./util.js'
import{V}from'./voice.js'
let cur=null,busy=false
const check=async()=>{
if(busy)return
try{
const r=await fetch('/api/health?lite=1',{cache:'no-store'})
const d=await r.json()
if(!d||!d.build)return
if(cur===null){cur=d.build;return}
if(d.build!==cur)restart()
}catch{}
}
function restart(){
busy=true
const t=h('span',null,'5')
const b=h('div',{class:'updb',role:'status','aria-live':'polite'},h('b',null,'Parley updated'),h('span',null,'Restarting in ',t,' seconds'))
document.body.append(b)
let n=5
const tick=()=>{
if(V.ch||V.joining){t.textContent='when your call ends';setTimeout(tick,2000);return}
t.textContent=String(n)
if(n--<=0){location.reload();return}
setTimeout(tick,1000)
}
tick()
}
export function startUpdates(){
check()
setInterval(()=>{if(!document.hidden)check()},45000)
document.addEventListener('visibilitychange',()=>{
document.documentElement.classList.toggle('hid',document.hidden)
if(!document.hidden)check()
})
addEventListener('online',check)
}
