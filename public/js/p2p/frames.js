const te=new TextEncoder(),td=new TextDecoder()
export const T_JSON=0,T_ZJSON=1,T_CHUNK=2
export const CHUNK_SIZE=16384
export async function deflate(u8){
const cs=new CompressionStream('deflate-raw')
const w=cs.writable.getWriter()
w.write(u8);w.close()
return new Uint8Array(await new Response(cs.readable).arrayBuffer())
}
export async function inflate(u8){
const ds=new DecompressionStream('deflate-raw')
const w=ds.writable.getWriter()
w.write(u8);w.close()
return new Uint8Array(await new Response(ds.readable).arrayBuffer())
}
export async function packJson(obj,zip){
const raw=te.encode(JSON.stringify(obj))
let type=T_JSON,body=raw
if(zip&&raw.length>=512&&typeof CompressionStream!=='undefined'){
const z=await deflate(raw)
if(z.length<raw.length*0.9){type=T_ZJSON;body=z}
}
const out=new Uint8Array(1+body.length)
out[0]=type
out.set(body,1)
return out
}
export function packChunk(id,offset,payload){
const out=new Uint8Array(9+payload.length)
const dv=new DataView(out.buffer)
out[0]=T_CHUNK
dv.setUint32(1,id)
dv.setUint32(5,offset)
out.set(payload,9)
return out
}
export async function unpack(u8){
if(!(u8 instanceof Uint8Array)||u8.length<1)return null
const t=u8[0]
if(t===T_JSON)return{t,obj:JSON.parse(td.decode(u8.subarray(1)))}
if(t===T_ZJSON){const raw=await inflate(u8.subarray(1));if(raw.length>4194304)return null;return{t,obj:JSON.parse(td.decode(raw))}}
if(t===T_CHUNK&&u8.length>=9){const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);return{t,id:dv.getUint32(1),offset:dv.getUint32(5),data:u8.subarray(9)}}
return null
}
