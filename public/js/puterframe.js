const b=document.getElementById('b')
const s=document.getElementById('s')
let ready=null
const load=()=>ready||(ready=new Promise((res,rej)=>{
const t=document.createElement('script')
t.src='https://js.puter.com/v2/'
t.onload=()=>res()
t.onerror=()=>{ready=null;rej(new Error('Puter could not be loaded'))}
document.head.append(t)
}))
const msg=e=>(e&&(e.message||(e.error&&e.error.message)||e.msg))||'Puter returned an error'
const post=o=>parent.postMessage(o,location.origin)
const say=t=>{s.textContent=t}
async function state(){
try{
await load()
const on=!!puter.auth.isSignedIn()
b.hidden=on
say(on?'Connected to Puter':'Not connected')
post({type:'state',on})
}catch(e){say(msg(e));post({type:'state',on:false,error:msg(e)})}
}
b.addEventListener('click',async()=>{
try{await load();await puter.auth.signIn()}catch(e){say(msg(e))}
state()
})
addEventListener('message',async e=>{
if(e.origin!==location.origin||e.source!==parent)return
const d=e.data||{}
const reply=o=>post({type:'reply',id:d.id,...o})
try{
await load()
if(!puter.auth.isSignedIn())throw new Error('Connect Puter first')
if(d.op==='models'){
const l=await puter.ai.listModels()
reply({ok:true,models:(Array.isArray(l)?l:[]).map(m=>typeof m==='string'?m:m&&(m.id||m.name)).filter(x=>typeof x==='string').slice(0,200)})
}else if(d.op==='chat'){
const r=await puter.ai.chat(String(d.prompt||'').slice(0,12000),d.model?{model:String(d.model)}:{})
const c=r&&r.message&&r.message.content
const text=typeof r==='string'?r:Array.isArray(c)?c.map(x=>x&&x.text||'').join(''):typeof c==='string'?c:''
reply({ok:true,text})
}else reply({ok:false,error:'Unknown request'})
}catch(err){reply({ok:false,error:msg(err)})}
})
state()
