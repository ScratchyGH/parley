import{POST,DEL,upload}from'./util.js'
import{sha256Fast,sha256Blob}from'./p2p/sha.js'
import{optimize}from'./codec.js'
const SIMPLE_MAX=48*1048576
const LANES=4
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
function putPart(url,blob,onProg,reg){
return new Promise((res,rej)=>{
const x=new XMLHttpRequest()
reg(x)
x.open('PUT',url)
x.setRequestHeader('content-type','application/octet-stream')
x.upload.onprogress=e=>{if(e.lengthComputable)onProg(e.loaded)}
x.onload=()=>{
let d=null
try{d=JSON.parse(x.responseText)}catch{}
if(x.status>=200&&x.status<300&&d&&d.etag)res(d.etag)
else rej(Object.assign(new Error(d&&d.error||'Part upload failed ('+x.status+')'),{status:x.status}))
}
x.onerror=()=>rej(new Error('Network error during upload'))
x.onabort=()=>rej(Object.assign(new Error('Upload cancelled'),{cancelled:true}))
x.send(blob)
})
}
export function uploadAttachment(file,params,onProgress){
let aborted=false
const xhrs=new Set()
let uploadId=null
let inner=null
const p=(async()=>{
const stage=s=>onProgress&&onProgress(null,s)
stage('Optimizing')
let f=await optimize(file)
if(aborted)throw Object.assign(new Error('Upload cancelled'),{cancelled:true})
stage('Checking')
const sha=f.size<=67108864?await sha256Fast(f):await sha256Blob(f,x=>stage('Checking '+Math.round(x*100)+'%'))
if(aborted)throw Object.assign(new Error('Upload cancelled'),{cancelled:true})
stage('Uploading')
if(f.size<=SIMPLE_MAX){
let d
for(let t=0;;t++){
inner=upload(f,{kind:'attachment',room:params.room},x=>onProgress&&onProgress(x),{'x-sha256':sha})
try{d=await inner;break}catch(e){
if(aborted||e.cancelled||(e.status&&e.status<500)||t>=2)throw e
stage('Retrying ('+(t+2)+' of 3)')
await new Promise(r=>setTimeout(r,1200*(t+1)))
}
}
return{...d,sha256:sha,optimized:f!==file,file:f}
}
const init=await POST('/api/upload/init',{kind:'attachment',room:params.room,name:f.name,size:f.size,sha256:sha})
uploadId=init.id
const total=init.parts,ps=init.part_size
const sent=new Array(total).fill(0)
const etags=new Array(total)
let next=0
const report=()=>onProgress&&onProgress(sent.reduce((a,b)=>a+b,0)/f.size)
const lane=async()=>{
while(next<total&&!aborted){
const i=next++
const blob=f.slice(i*ps,Math.min(f.size,(i+1)*ps))
let lastErr
for(let t=0;t<4;t++){
try{
etags[i]=await putPart(`/api/upload/${init.id}/part/${i+1}`,blob,n=>{sent[i]=n;report()},x=>xhrs.add(x))
sent[i]=blob.size;report();lastErr=null;break
}catch(e){
lastErr=e
if(e.cancelled||(e.status&&e.status<500&&e.status!==429))throw e
sent[i]=0
await sleep(400*(t+1))
}
}
if(lastErr)throw lastErr
}
}
await Promise.all(Array.from({length:Math.min(LANES,total)},lane))
if(aborted)throw Object.assign(new Error('Upload cancelled'),{cancelled:true})
const d=await POST(`/api/upload/${init.id}/complete`,{parts:etags.map((etag,i)=>({n:i+1,etag}))})
uploadId=null
return{...d,sha256:sha,optimized:f!==file,file:f}
})()
p.catch(()=>{if(uploadId)DEL('/api/upload/'+uploadId).catch(()=>{})})
p.abort=()=>{aborted=true;for(const x of xhrs)try{x.abort()}catch{};if(inner&&inner.abort)inner.abort()}
return p
}
