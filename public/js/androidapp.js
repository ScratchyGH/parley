import{h,icon}from'./util.js'
import{go}from'./nav.js'
const T=[['menu','Servers',null],['chat','Home','/'],['users','Friends','/friends'],['compass','Discover','/discover'],['user','You','/settings']]
export function androidApp(){
if(!/ParleyAndroid\//.test(navigator.userAgent)||document.querySelector('.tabbar'))return
const d=document.documentElement
d.classList.add('app-android')
const buzz=()=>{try{window.Capacitor?.Plugins?.Haptics?.impact({'style':'LIGHT'})}catch{}}
const sh=()=>document.querySelector('.shell')
const bar=h('nav',{class:'tabbar','aria-label':'Main'},T.map(([i,l,p])=>h('button',{type:'button','data-p':p||'',on:{click:()=>{buzz();if(p)go(p);else sh()?.classList.toggle('nav')}}},icon(i),h('span',null,l))))
const mark=()=>{
const p=location.pathname
d.classList.toggle('in-chat',/^\/(dm\/[^/]+|s\/[^/]+\/[^/]+)/.test(p)&&!/\/settings/.test(p))
for(const b of bar.children){const q=b.dataset.p;b.classList.toggle('on',!!q&&(q==='/'?p==='/'||p==='/home'||p.startsWith('/dm'):p.startsWith(q)))}
}
for(const k of['pushState','replaceState']){const o=history[k];history[k]=function(...a){const r=o.apply(this,a);setTimeout(mark,0);return r}}
addEventListener('popstate',mark)
document.body.append(bar)
mark()
}
