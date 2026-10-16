import{pref}from'./prefs.js'
const TINY={
'image/jxl':'/woAELASCAgQAEQASxLFgoUk1mjrA0cHQBBL9gE=',
'image/avif':'AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABggQEDQgMg8WQAYYYYQAAHd0217EXxA='
}
let worker=null,seq=1
const pend=new Map()
function getWorker(){
if(worker)return worker
worker=new Worker('/js/codec-worker.js',{type:'module'})
worker.onmessage=e=>{
const p=pend.get(e.data.id)
if(!p)return
pend.delete(e.data.id)
e.data.ok?p.res(e.data):p.rej(new Error(e.data.error))
}
worker.onerror=()=>{for(const p of pend.values())p.rej(new Error('Image codec failed to load'));pend.clear();worker=null}
return worker
}
function call(msg,transfer){
return new Promise((res,rej)=>{
const id=seq++
pend.set(id,{res,rej})
getWorker().postMessage({id,...msg},transfer||[])
})
}
const native={}
export function nativeSupport(mime){
if(mime in native)return native[mime]
const b64=TINY[mime]
if(!b64)return Promise.resolve(true)
native[mime]=new Promise(res=>{
const img=new Image()
img.onload=()=>res(img.width===1)
img.onerror=()=>res(false)
img.src='data:'+mime+';base64,'+b64
})
return native[mime]
}
const cache=new Map()
export async function displayBlob(blob,mime){
if(mime!=='image/jxl'||await nativeSupport(mime))return URL.createObjectURL(blob)
const buf=await blob.arrayBuffer()
const d=await call({op:'decode',buf,mime},[buf])
return URL.createObjectURL(new Blob([d.buf],{type:d.mime}))
}
export async function displayUrl(url,mime){
if(mime!=='image/jxl'||await nativeSupport(mime))return url
if(cache.has(url))return cache.get(url)
const p=(async()=>{
const r=await fetch(url,{credentials:'same-origin'})
if(!r.ok)throw new Error('Could not load image')
return displayBlob(await r.blob(),mime)
})()
cache.set(url,p)
p.catch(()=>cache.delete(url))
return p
}
const SRC_OK=/^image\/(png|jpeg|webp|bmp|avif|jxl|x-icon)$/
export async function optimize(file){
const to=pref('optimize')
if(to==='off'||!SRC_OK.test(file.type)||file.type==='image/gif')return file
if(file.type==='image/'+to)return file
if(to==='jxl'||to==='avif'||to==='webp'){
try{
const buf=await file.arrayBuffer()
const d=await call({op:'encode',buf,mime:file.type,to,quality:pref('optQuality'),maxDim:pref('optMaxDim')},[buf])
if(d.buf.byteLength>=file.size*0.95)return file
const ext={webp:'webp',avif:'avif',jxl:'jxl'}[to]
const name=file.name.replace(/\.[^.]+$/,'')+'.'+ext
return new File([d.buf],name,{type:d.mime})
}catch{return file}
}
return file
}
