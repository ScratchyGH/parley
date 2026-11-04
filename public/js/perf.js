export const LV=['Low','Medium','Normal','High','Max']
const get=k=>{try{const v=parseInt(localStorage.getItem('parley.'+k));return v>=0&&v<=4?v:2}catch{return 2}}
export const cpu=()=>get('cpu')
export const gpu=()=>get('gpu')
export const pcap=()=>[60,120,300,500,800][gpu()]
export const dpr=()=>[.6,.85,1,1.25,1.5][gpu()]*Math.min(2,devicePixelRatio||1)
export function apply(){
const r=document.documentElement
r.dataset.cpu=cpu()
r.dataset.gpu=gpu()
window.__perf={cpu:cpu(),gpu:gpu()}
}
export function setLevel(k,v){
try{localStorage.setItem('parley.'+k,String(v))}catch{}
apply()
}
apply()
export function gblr(){
try{
if(localStorage.getItem('parley.gpu')!==null)return
const gl=document.createElement('canvas').getContext('webgl')
const x=gl&&gl.getExtension('WEBGL_debug_renderer_info')
const r=x?String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL)):''
const weak=/Mali-[2-4]|Adreno \(TM\) [1-4]\d\d|PowerVR|Intel.*(HD Graphics [2-5]\d\d\d|GMA)|SwiftShader|llvmpipe|Software/i.test(r)
const mid=/Intel|UHD|Iris|Mali|Adreno|Apple GPU|Radeon (Vega|R[5-7])|GTX (6|7|9)\d\d|GT \d/i.test(r)
setLevel('gpu',weak?0:mid?1:2)
}catch{}
}
gblr()
