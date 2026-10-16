import{spawn}from'node:child_process'
import fs from'node:fs'
import crypto from'node:crypto'
const child=spawn('node',['test/fakes.mjs','8791','/tmp/store.key'],{stdio:'ignore'})
await new Promise(r=>setTimeout(r,1500))
const{d1Store,place}=await import('../src/store.js')
const sa=JSON.stringify({project_id:'p',client_email:'a@b.c',private_key:fs.readFileSync('/tmp/store.key','utf8')})
const env={SUPABASE_URL:'http://127.0.0.1:8791/sb',SUPABASE_KEY:'sb-test',FIREBASE_SA:sa,FIRESTORE_HOST:'http://127.0.0.1:8791/fs',FIREBASE_TOKEN_URL:'http://127.0.0.1:8791/token'}
let pass=0,fail=0
const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}}
const st=d1Store(env)
for(const tag of['s','f']){
const data=crypto.randomBytes(1300000)
const key=tag+'~u/x/f_'+tag
const sum=crypto.createHash('sha256').update(data).digest('hex')
const r=await st.put(key,data,{sha256:sum})
ok(r.size===data.length,tag+' put size')
const all=await st.get(key,{size:data.length})
ok(all&&Buffer.compare(Buffer.from(all.body),data)===0,tag+' full read')
const part=await st.get(key,{range:new Headers({range:'bytes=500000-1100000'}),size:data.length})
ok(part&&part.range.offset===500000&&part.range.length===600001&&Buffer.compare(Buffer.from(part.body),data.subarray(500000,1100001))===0,tag+' range across chunks')
const tail=await st.get(key,{range:new Headers({range:'bytes=-100'}),size:data.length})
ok(tail&&Buffer.compare(Buffer.from(tail.body),data.subarray(data.length-100))===0,tag+' suffix range')
let bad=false
try{await st.put(key,data,{sha256:'0'.repeat(64)})}catch{bad=true}
ok(bad,tag+' wrong sha rejected')
const mp=st.resumeMultipartUpload(key)
await mp.uploadPart(1,data)
const c=await mp.complete([{partNumber:1,etag:'1'}],data.length)
ok(c.size===data.length&&Buffer.from(c.checksums.sha256).toString('hex')===sum,tag+' multipart single part complete')
await st.delete(key)
ok(await st.get(key,{size:data.length})===null,tag+' deleted')
}
const e2={...env}
const seen=new Set()
for(let i=0;i<200;i++)seen.add(place(e2,'u/a/f'+i,1000)[0])
ok(seen.has('s')&&seen.has('f'),'small files spread over supabase and firestore')
ok(!new Set([...Array(50)].map((_,i)=>place(e2,'u/a/g'+i,20*1048576)[0])).has('s'),'large files never go to object stores')
ok(place({FILES:{}},'k',1)==='k','real R2 keeps plain key')
console.log(pass+' passed, '+fail+' failed')
child.kill()
process.exit(fail?1:0)
