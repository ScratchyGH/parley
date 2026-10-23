import{fail,limit}from'./util.js'
import{resolveRoom}from'./perms.js'
import{publishMsg,hydrate}from'./messages.js'
const MODEL='@cf/openai/whisper-large-v3-turbo'
function b64(buf){
const u=new Uint8Array(buf);let s=''
for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768))
return btoa(s)
}
export default function(r){
r.add('POST','/api/files/:id/transcribe',async c=>{
limit('tx:'+c.user.id,120,600000)
if(!c.env.AI)fail(503,'Transcription is not available right now')
const f=await c.env.DB.prepare("select id,owner_id,room,message_id,r2_key,size,mime,name,transcript from files where id=? and kind='attachment'").bind(c.p.id).first()
if(!f||f.owner_id!==c.user.id||!f.message_id)fail(404,'File not found')
if(!f.mime.startsWith('audio/')||!/^voice-clip/i.test(f.name))fail(400,'Only voice clips can be transcribed')
if(f.transcript)return{transcript:f.transcript}
if(f.size>6291456)fail(413,'That clip is too large to transcribe')
const rr=await resolveRoom(c.env,f.room,c.user.id)
let text
try{
const o=await c.env.FILES.get(f.r2_key)
if(!o)fail(404,'File not found')
const out=await c.env.AI.run(MODEL,{audio:b64(await o.arrayBuffer()),vad_filter:true})
text=String(out&&out.text||'').replace(/\s+/g,' ').trim().slice(0,12000)||'(no speech detected)'
}catch(e){
if(e&&e.status)throw e
text='(could not transcribe)'
}
await c.env.DB.prepare('update files set transcript=? where id=?').bind(text,f.id).run()
const row=await c.env.DB.prepare('select * from messages where id=? and deleted_at is null').bind(f.message_id).first()
if(row){const[message]=await hydrate(c.env,[row],c.user.id);await publishMsg(c,rr,{t:'msg.update',m:message})}
return{transcript:text}
})
}
