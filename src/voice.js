const MODEL='@cf/openai/whisper-large-v3-turbo'
function b64(buf){
const u=new Uint8Array(buf);let s=''
for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768))
return btoa(s)
}
export async function transcribeClips(c,rr,mid,ids,publishMsg,hydrate){
if(!c.env.AI||!ids.length)return
const rows=(await c.env.DB.prepare(`select id,r2_key,size,mime,name from files where id in (${ids.map(()=>'?').join(',')}) and mime like 'audio/%' and size<=4194304`).bind(...ids).all()).results.filter(f=>/^voice-clip/i.test(f.name))
if(!rows.length)return
let any=false
for(const f of rows){
try{
const o=await c.env.FILES.get(f.r2_key)
if(!o)continue
const out=await c.env.AI.run(MODEL,{audio:b64(await o.arrayBuffer())})
const text=String(out&&out.text||'').replace(/\s+/g,' ').trim().slice(0,1500)
await c.env.DB.prepare('update files set transcript=? where id=?').bind(text||'(no speech detected)',f.id).run()
any=true
}catch{
await c.env.DB.prepare("update files set transcript='(could not transcribe)' where id=?").bind(f.id).run().catch(()=>{})
any=true
}
}
if(!any)return
const row=await c.env.DB.prepare('select * from messages where id=? and deleted_at is null').bind(mid).first()
if(!row)return
const[message]=await hydrate(c.env,[row],c.user.id)
await publishMsg(c,rr,{t:'msg.update',m:message})
}
