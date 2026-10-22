import{h,GET}from'./util.js'
export const REVAMP_AT=Date.UTC(2027,0,1,5,0,0)
const KEY='parley.rv.preview'
const mem={p:false}
const get=()=>{try{return localStorage.getItem(KEY)==='1'}catch{return mem.p}}
const set=v=>{mem.p=v;try{v?localStorage.setItem(KEY,'1'):localStorage.removeItem(KEY)}catch{}}
let skew=0
const live=()=>Date.now()+skew>=REVAMP_AT
export const revampOn=()=>live()||get()
function apply(on){
document.documentElement.classList.toggle('rv27',on)
let l=document.getElementById('rvcss')
if(on&&!l){l=document.createElement('link');l.id='rvcss';l.rel='stylesheet';l.href='/revamp27.css';document.head.append(l)}
}
function overlay(sec,done){
const o=h('div',{id:'rvlay',role:'status','aria-live':'polite'})
const n=h('div',{class:'rvn'},String(sec))
o.append(h('div',null,h('h1',null,'Parley 2027'),h('p',null,'A new look is arriving. Restarting in'),n))
const cols=['#fcd34d','#a78bfa','#38bdf8','#f472b6','#fff']
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)for(let i=0;i<60;i++){const p=h('i',{class:'rvp'});p.style.cssText=`left:${Math.random()*100}%;background:${cols[i%5]};animation-duration:${2+Math.random()*3}s;animation-delay:${Math.random()*2}s`;o.append(p)}
document.body.append(o)
let s=sec
const t=setInterval(()=>{s--;n.textContent=String(Math.max(s,0));if(s<=0){clearInterval(t);done()}},1000)
}
export function previewRestart(){set(true);overlay(5,()=>location.reload())}
export function previewToggle(on){set(on);apply(on)}
export const previewActive=get
apply(revampOn())
let fired=false
export function startRevamp(){
GET('/api/health').then(r=>{if(r&&r.time)skew=r.time-Date.now()}).catch(()=>{})
setInterval(()=>{
if(fired||get()||document.documentElement.classList.contains('rv27'))return
if(live()){fired=true;overlay(5,()=>location.reload())}
},1000)
}
