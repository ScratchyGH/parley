import{h}from'./util.js'
import{V}from'./voice.js'
import{gaming}from'./gamebar.js'
let cur=null,busy=false
const check=async()=>{
if(busy)return
try{
const r=await fetch('/api/health?lite=1',{cache:'no-store'})
const d=await r.json()
if(!d||!d.build)return
if(cur===null){cur=d.build;return}
if(d.build!==cur){if(document.hidden&&!V.ch&&!V.joining&&!gaming()){location.reload();return}restart()}
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
if(gaming()){t.textContent='when your game ends';setTimeout(tick,2000);return}
t.textContent=String(n)
if(n--<=0){location.reload();return}
setTimeout(tick,1000)
}
tick()
}
export const checkUpdate=()=>check()
export function startUpdates(){
check()
setInterval(check,45000)
document.addEventListener('visibilitychange',()=>{
document.documentElement.classList.toggle('hid',document.hidden)
if(!document.hidden)check()
})
addEventListener('online',check)
}

export function previewUpdate(mode){
document.querySelector('.updb')?.remove()
const t=h('span',null,'5')
const b=h('div',{class:'updb',role:'status','aria-live':'polite'},h('b',null,'Parley updated'),h('span',null,'Restarting in ',t,' seconds'),h('small',{style:{opacity:.7,marginLeft:'8px'}},'preview only'))
document.body.append(b)
if(mode==='call'){t.textContent='when your call ends';setTimeout(()=>b.remove(),5000);return}
if(mode==='game'){t.textContent='when your game ends';setTimeout(()=>b.remove(),5000);return}
let n=5
const tick=()=>{
if(!b.isConnected)return
t.textContent=String(n)
if(n--<=0){b.remove();return}
setTimeout(tick,1000)
}
tick()
}
export async function buildInfo(){
try{const d=await(await fetch('/api/health?lite=1',{cache:'no-store'})).json();return{loaded:cur,live:d&&d.build}}catch{return null}
}
