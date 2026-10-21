import{S}from'./state.js'
import{deviceId}from'./util.js'
let sent=0,seen=new Set(),on=false
async function report(msg,src){
if(!S.me?.settings?.diagnostics||sent>=5)return
msg=String(msg||'').slice(0,300)
if(!msg||seen.has(msg))return
seen.add(msg);sent++
try{await fetch('/api/client-error',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-device':deviceId()},body:JSON.stringify({msg,src:String(src||'').slice(0,200),url:location.pathname})})}catch{}
}
export function startDiag(){
if(on)return
on=true
addEventListener('error',e=>report(e.message,e.filename))
addEventListener('unhandledrejection',e=>report('Unhandled: '+(e.reason&&e.reason.message||e.reason),''))
}
