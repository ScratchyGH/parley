const BASE='/vendor/codecs/'
const mods={}
async function load(name){
if(!mods[name]){
const f=(await import(BASE+name+'.js')).default
mods[name]=f({noInitialRun:true,locateFile:p=>BASE+p})
}
return mods[name]
}
const JXL={effort:5,quality:75,progressive:false,epf:-1,lossyPalette:false,decodingSpeedTier:0,photonNoiseIso:0,lossyModular:false,lossless:false}
const AVIF={quality:60,qualityAlpha:-1,denoiseLevel:0,tileColsLog2:0,tileRowsLog2:0,speed:7,subsample:1,chromaDeltaQ:false,sharpness:0,tune:0,enableSharpYUV:false,bitDepth:8,lossless:false}
async function bitmapOf(buf,mime){
return createImageBitmap(new Blob([buf],{type:mime}))
}
async function pixels(buf,mime,maxDim){
let w,h,data
if(mime==='image/jxl'){
const m=await load('jxl_dec')
const r=m.decode(buf)
if(!r)throw new Error('JPEG XL decode failed')
w=r.width;h=r.height;data=new Uint8ClampedArray(r.data)
}else if(mime==='image/avif'&&typeof createImageBitmap!=='function'){
const m=await load('avif_dec')
const r=m.decode(buf,8)
if(!r)throw new Error('AVIF decode failed')
w=r.width;h=r.height;data=new Uint8ClampedArray(r.data)
}else{
const bmp=await bitmapOf(buf,mime)
w=bmp.width;h=bmp.height
const s=maxDim&&Math.max(w,h)>maxDim?maxDim/Math.max(w,h):1
const tw=Math.max(1,Math.round(w*s)),th=Math.max(1,Math.round(h*s))
const cv=new OffscreenCanvas(tw,th)
const cx=cv.getContext('2d')
cx.drawImage(bmp,0,0,tw,th)
bmp.close()
const id=cx.getImageData(0,0,tw,th)
return{w:tw,h:th,data:id.data}
}
if(maxDim&&Math.max(w,h)>maxDim){
const s=maxDim/Math.max(w,h)
const tw=Math.max(1,Math.round(w*s)),th=Math.max(1,Math.round(h*s))
const src=new OffscreenCanvas(w,h)
src.getContext('2d').putImageData(new ImageData(data,w,h),0,0)
const cv=new OffscreenCanvas(tw,th)
const cx=cv.getContext('2d')
cx.drawImage(src,0,0,tw,th)
const id=cx.getImageData(0,0,tw,th)
return{w:tw,h:th,data:id.data}
}
return{w,h,data}
}
self.onmessage=async e=>{
const{id,op,buf,mime,to,quality,maxDim}=e.data
try{
if(op==='decode'){
const p=await pixels(buf,mime,0)
const cv=new OffscreenCanvas(p.w,p.h)
cv.getContext('2d').putImageData(new ImageData(p.data,p.w,p.h),0,0)
const blob=await cv.convertToBlob({type:'image/png'})
self.postMessage({id,ok:true,buf:await blob.arrayBuffer(),mime:'image/png',w:p.w,h:p.h})
return
}
if(op==='encode'){
const p=await pixels(buf,mime,maxDim)
let out,type
if(to==='webp'){
const cv=new OffscreenCanvas(p.w,p.h)
cv.getContext('2d').putImageData(new ImageData(p.data,p.w,p.h),0,0)
const b=await cv.convertToBlob({type:'image/webp',quality:quality/100})
if(b.type!=='image/webp')throw new Error('This browser cannot encode WebP')
out=await b.arrayBuffer();type='image/webp'
}else if(to==='avif'){
const m=await load('avif_enc')
const r=m.encode(p.data,p.w,p.h,{...AVIF,quality:Math.round(quality*0.6+10)})
out=r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength);type='image/avif'
}else if(to==='jxl'){
const m=await load('jxl_enc')
const r=m.encode(p.data,p.w,p.h,{...JXL,quality})
out=r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength);type='image/jxl'
}else throw new Error('Unknown format')
self.postMessage({id,ok:true,buf:out,mime:type,w:p.w,h:p.h},[out])
}
}catch(err){
self.postMessage({id,ok:false,error:String(err&&err.message||err)})
}
}
