const KEY='parley.fall.preview'
const mem={p:false}
const get=()=>{try{return localStorage.getItem(KEY)==='1'}catch{return mem.p}}
const set=v=>{mem.p=v;try{v?localStorage.setItem(KEY,'1'):localStorage.removeItem(KEY)}catch{}}
const inWindow=()=>{const d=new Date();return d.getMonth()===10||(d.getMonth()===11&&d.getDate()<=5)}
export const fallOn=()=>inWindow()||get()
export const fallPreview=on=>{set(on);apply(fallOn())}
function apply(on){
document.documentElement.classList.toggle('fall',on)
if(on&&!document.getElementById('fallcss'))document.head.append(Object.assign(document.createElement('link'),{id:'fallcss',rel:'stylesheet',href:'/thicket.css'}))
}
apply(fallOn())
