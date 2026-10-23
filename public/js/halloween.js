const KEY='parley.hw.preview'
const mem={p:false}
const get=()=>{try{return localStorage.getItem(KEY)==='1'}catch{return mem.p}}
const set=v=>{mem.p=v;try{v?localStorage.setItem(KEY,'1'):localStorage.removeItem(KEY)}catch{}}
export const hwEnd=()=>{const d=new Date();return new Date(d.getFullYear(),9,31,23,59,59,999).getTime()}
const inWindow=()=>{const d=new Date();return d.getMonth()===9}
export const hwOn=()=>inWindow()||get()
export const hwPreview=on=>{set(on);apply(hwOn())}
function loadCss(){
let l=document.getElementById('hwcss')
if(!l){l=document.createElement('link');l.id='hwcss';l.rel='stylesheet';l.href='/halloween.css';document.head.append(l)}
}
function apply(on){
document.documentElement.classList.toggle('hw',on)
if(on)loadCss()
}
apply(hwOn())
if(inWindow()&&!get()){
const ms=hwEnd()-Date.now()+1000
if(ms>0&&ms<2147483647)setTimeout(()=>apply(hwOn()),ms)
}
