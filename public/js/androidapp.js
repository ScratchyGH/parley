import{h,icon}from'./util.js'
import{go}from'./nav.js'
const T=[['menu','Servers',null],['chat','Home','/'],['users','Friends','/friends'],['compass','Discover','/discover'],['user','You','/settings']]
export function androidApp(){
const app=/ParleyAndroid\//.test(navigator.userAgent),pwa=/Android/i.test(navigator.userAgent)&&matchMedia('(display-mode:standalone)').matches
if(!(app||pwa)||document.querySelector('.tabbar'))return
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
const kb=on=>d.classList.toggle('kb',on)
addEventListener('keyboardWillShow',()=>kb(true));addEventListener('keyboardDidShow',()=>kb(true));addEventListener('keyboardWillHide',()=>kb(false));addEventListener('keyboardDidHide',()=>kb(false))
const typing=e=>/^(INPUT|TEXTAREA)$/.test(e.target?.tagName)||e.target?.isContentEditable
addEventListener('focusin',e=>{if(typing(e))kb(true)})
addEventListener('focusout',()=>setTimeout(()=>{if(!typing({target:document.activeElement}))kb(false)},120))
const A=window.Capacitor?.Plugins?.App
if(A?.addListener)A.addListener('backButton',({canGoBack})=>{
const sc=[...document.querySelectorAll('.scrim')].pop()
if(sc){const x=sc.querySelector('header .ib');if(x)x.click();else sc.remove();return}
const m=document.querySelector('.menu,.popup,.ctxmenu')
if(m){m.remove();return}
const sh=document.querySelector('.shell.nav')
if(sh){sh.classList.remove('nav');return}
if(canGoBack||history.length>1)history.back();else A.minimizeApp?.()
})
}
