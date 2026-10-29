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
