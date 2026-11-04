import{setting}from'./state.js'
const db=()=>new Promise((res,rej)=>{const r=indexedDB.open('parley-bgm',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
const tx=async(m,f)=>{const d=await db();return new Promise((res,rej)=>{const t=d.transaction('f',m),q=f(t.objectStore('f'));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)})}
let a
export const bgmStop=()=>{if(a){a.pause();URL.revokeObjectURL(a.src);a=null}}
export const bgmPlay=f=>{bgmStop();a=new Audio(URL.createObjectURL(f));a.loop=true;a.volume=.3;return a.play().catch(()=>{})}
export const bgmSave=f=>tx('readwrite',s=>s.put(f,'bgm'))
export const bgmClear=()=>{bgmStop();return tx('readwrite',s=>s.delete('bgm')).catch(()=>{})}
export async function bgmBoot(){
if(!setting('bgm',false))return
const f=await tx('readonly',s=>s.get('bgm')).catch(()=>null)
if(f)addEventListener('pointerdown',()=>bgmPlay(f),{once:true})
}
