import{readFileSync,writeFileSync}from'node:fs'
const dir=new URL('../public/vendor/codecs/',import.meta.url)
let pass=0,fail=0
const ok=(c,n)=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n)}
const load=async(name)=>{
const m=(await import(new URL(name+'.js',dir))).default
return m({noInitialRun:true,wasmBinary:readFileSync(new URL(name+'.wasm',dir))})
}
const W=64,H=48
const px=new Uint8ClampedArray(W*H*4)
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;px[i]=x*4;px[i+1]=y*5;px[i+2]=128;px[i+3]=255}
const img={data:px,width:W,height:H}
const near=(a,b,tol)=>{let worst=0;globalThis.__w=0;for(let i=0;i<a.length;i++)if(i%4!==3)worst=Math.max(worst,Math.abs(a[i]-b[i]));globalThis.__w=worst;return worst<=tol}
const jd=await load('jxl_dec'),je=await load('jxl_enc')
const jopts={effort:3,quality:90,progressive:false,epf:-1,lossyPalette:false,decodingSpeedTier:0,photonNoiseIso:0,lossyModular:false,lossless:true}
const jl=je.encode(px,W,H,{...jopts,quality:100})
const jb=Buffer.from(jl.buffer.slice(jl.byteOffset,jl.byteOffset+jl.byteLength))
ok(jb[0]===0xff&&jb[1]===0x0a||jb.subarray(4,8).toString()==='JXL ','jxl encoder emits JXL signature')
const jr=jd.decode(jl.buffer.slice(jl.byteOffset,jl.byteOffset+jl.byteLength))
ok(jr&&jr.width===W&&jr.height===H,'jxl decoder returns dimensions')
ok(near(px,jr.data,1),'jxl lossless roundtrip is within 1 level per channel')
const jy=je.encode(px,W,H,{...jopts,lossless:false,quality:80})
ok(jy.byteLength<jl.byteLength,'lossy jxl is smaller than lossless')
const ad=await load('avif_dec'),ae=await load('avif_enc')
const aopts={quality:60,qualityAlpha:-1,denoiseLevel:0,tileColsLog2:0,tileRowsLog2:0,speed:8,subsample:1,chromaDeltaQ:false,sharpness:0,tune:0,enableSharpYUV:false,bitDepth:8,lossless:false}
const av=ae.encode(px,W,H,aopts)
const ab=av.buffer.slice(av.byteOffset,av.byteOffset+av.byteLength)
ok(Buffer.from(ab).subarray(4,8).toString()==='ftyp','avif encoder emits ftyp box')
const ar=ad.decode(ab,8)
ok(ar&&ar.width===W&&ar.height===H,'avif decoder returns dimensions')
ok(near(px,ar.data,40),'avif lossy roundtrip is close')
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail?1:0)
