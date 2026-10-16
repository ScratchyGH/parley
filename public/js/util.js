export const h=(tag,props,...kids)=>{
const el=document.createElement(tag)
if(props)for(const[k,v]of Object.entries(props)){
if(v==null||v===false)continue
if(k==='class')el.className=v
else if(k==='on')for(const[ev,fn]of Object.entries(v))el.addEventListener(ev,fn)
else if(k==='style')for(const[sk,sv]of Object.entries(v)){if(sk.startsWith('--')||sk.includes('-'))el.style.setProperty(sk,sv);else el.style[sk]=sv}
else if(k in el&&k!=='list'&&k!=='type'&&k!=='form')el[k]=v
else el.setAttribute(k,v===true?'':v)
}
add(el,kids)
return el
}
export function add(el,kids){
for(const k of kids.flat(Infinity)){
if(k==null||k===false)continue
el.append(k.nodeType?k:document.createTextNode(String(k)))
}
return el
}
export const $=(s,r=document)=>r.querySelector(s)
export const clear=el=>{while(el.firstChild)el.firstChild.remove();return el}
export const mount=(el,...kids)=>add(clear(el),kids)

const ICONS={
image:'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M8.5 9.5h.01',
hash:'M4 9h16M4 15h16M10 3L8 21M16 3l-2 18',
volume:'M11 5L6 9H2v6h4l5 4V5z M15.5 8.5a5 5 0 0 1 0 7 M19 5a9 9 0 0 1 0 14',
mic:'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3',
micoff:'M2 2l20 20 M9 9v3a3 3 0 0 0 5.1 2.1 M15 9.3V5a3 3 0 0 0-5.9-.6 M19 10v2a7 7 0 0 1-.9 3.4 M5 10v2a7 7 0 0 0 11 5.7 M12 19v3',
headphones:'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
deaf:'M2 2l20 20 M3 18v-6a9 9 0 0 1 14-7.5 M21 12v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3 M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3',
video:'M23 7l-7 5 7 5V7z M3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
videooff:'M2 2l20 20 M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2 M23 7l-7 5 7 5V7z M10.6 5H14a2 2 0 0 1 2 2v3.4',
screen:'M2 4h20v12H2z M8 20h8 M12 16v4',
leave:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
plus:'M12 5v14M5 12h14',
x:'M18 6L6 18M6 6l12 12',
sliders:'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
menu:'M3 6h18M3 12h18M3 18h18',
reply:'M9 17l-5-5 5-5 M4 12h11a5 5 0 0 1 5 5v2',
smile:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01',
pin:'M12 17v5 M9 3h6l-1 7 3 3v2H7v-2l3-3-1-7z',
edit:'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
trash:'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6',
more:'M12 12h.01 M19 12h.01 M5 12h.01',
clip:'M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9',
send:'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
lock:'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
down:'M6 9l6 6 6-6',
right:'M9 6l6 6-6 6',
bookmark:'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
compass:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M16 8l-2 6-6 2 2-6 6-2z',
shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
download:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
bold:'M6 4h8a4 4 0 0 1 0 8H6z M6 12h9a4 4 0 0 1 0 8H6z',
italic:'M19 4h-9 M14 20H5 M15 4L9 20',
code:'M16 18l6-6-6-6 M8 6l-6 6 6 6',
quote:'M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a4 4 0 0 1-4 4 M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a4 4 0 0 1-4 4',
strike:'M16 4H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H8 M4 12h16',
eyeoff:'M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5-5.9 M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2 M1 1l22 22',
check:'M20 6L9 17l-5-5',
useradd:'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M20 8v6 M23 11h-6',
phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
forward:'M15 17l5-5-5-5 M4 18v-2a4 4 0 0 1 4-4h12',
flag:'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
copy:'M9 9h11v11H9z M5 15H4V4h11v1',
link:'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7 M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
globe:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
calendar:'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
ban:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M4.9 4.9l14.2 14.2',
clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
refresh:'M23 4v6h-6 M1 20v-6h6 M3.5 9a9 9 0 0 1 14.9-3.4L23 10 M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
volx:'M11 5L6 9H2v6h4l5 4V5z M23 9l-6 6 M17 9l6 6',
flask:'M9 3h6 M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3 M7.5 15h9',
bot:'M12 8V4H8 M4 8h16v12H4z M2 14h2 M20 14h2 M9 13v2 M15 13v2',
mega:'M3 11v2a1 1 0 0 0 1 1h3l8 5V5L7 10H4a1 1 0 0 0-1 1z M19 8a5 5 0 0 1 0 8',
hand:'M18 11V6a2 2 0 0 0-4 0 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3-2.8L8 15',
star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z',
database:'M12 8c4.4 0 8-1.1 8-2.5S16.4 3 12 3 4 4.1 4 5.5 7.6 8 12 8z M4 5.5v13C4 19.9 7.6 21 12 21s8-1.1 8-2.5v-13 M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5',
gif:'M3 6h18v12H3z M10 10H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2v-2H9 M13 10v4 M16 14v-4h3 M16 12h2',
swap:'M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3'
}
export function icon(name,cls=''){
const s=document.createElementNS('http://www.w3.org/2000/svg','svg')
s.setAttribute('viewBox','0 0 24 24')
s.setAttribute('class','i '+cls)
s.setAttribute('aria-hidden','true')
const p=document.createElementNS('http://www.w3.org/2000/svg','path')
p.setAttribute('d',ICONS[name]||ICONS.hash)
s.append(p)
return s
}

export async function api(method,path,body){
const init={method,credentials:'same-origin',headers:{}}
if(body!==undefined||method==='POST'||method==='PUT'||method==='PATCH'){init.body=JSON.stringify(body??{});init.headers['content-type']='application/json'}
let r
try{r=await fetch(path,init)}catch{const e=new Error('Network error. Check your connection.');e.status=0;throw e}
let data=null
if((r.headers.get('content-type')||'').includes('json'))data=await r.json().catch(()=>null)
if(!r.ok){const e=new Error(data?.error||`Request failed (${r.status})`);e.status=r.status;e.data=data;throw e}
return data
}
export const GET=p=>api('GET',p)
export const POST=(p,b)=>api('POST',p,b)
export const PATCH=(p,b)=>api('PATCH',p,b)
export const PUT=(p,b)=>api('PUT',p,b)
export const DEL=p=>api('DELETE',p)

export function upload(file,params,onProgress,headers){
const xhr=new XMLHttpRequest()
const q=new URLSearchParams(params).toString()
const p=new Promise((res,rej)=>{
xhr.open('POST','/api/upload?'+q)
xhr.setRequestHeader('x-filename',encodeURIComponent(file.name))
xhr.setRequestHeader('content-type',file.type||'application/octet-stream')
if(headers)for(const k of Object.keys(headers))xhr.setRequestHeader(k,headers[k])
xhr.upload.onprogress=e=>{if(e.lengthComputable&&onProgress)onProgress(e.loaded/e.total)}
xhr.onload=()=>{
let d=null
try{d=JSON.parse(xhr.responseText)}catch{}
if(xhr.status>=200&&xhr.status<300)res(d)
else rej(Object.assign(new Error(d?.error||`Upload failed (${xhr.status})`),{status:xhr.status}))
}
xhr.onerror=()=>rej(new Error('Network error during upload'))
xhr.onabort=()=>rej(Object.assign(new Error('Upload cancelled'),{cancelled:true}))
xhr.send(file)
})
p.abort=()=>xhr.abort()
return p
}

export const fileUrl=id=>'/api/files/'+id
export const gtag=(t,e,i)=>t?h('span',{class:'gtag',title:'Server tag'},i?h('img',{src:fileUrl(i),alt:'',loading:'lazy'}):e?h('span',{class:'gte'},e):null,t):null
export function fmtSize(n){
if(n<1024)return n+' B'
if(n<1048576)return (n/1024).toFixed(1)+' KB'
if(n<1073741824)return (n/1048576).toFixed(1)+' MB'
return (n/1073741824).toFixed(2)+' GB'
}
const pad=n=>String(n).padStart(2,'0')
export function fmtTime(t){
const d=new Date(t)
return pad(d.getHours())+':'+pad(d.getMinutes())
}
export function fmtDate(t){
return new Date(t).toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'})
}
export function fmtStamp(t){
const d=new Date(t),n=new Date()
const day=x=>x.getFullYear()*400+x.getMonth()*32+x.getDate()
const y=new Date(n);y.setDate(n.getDate()-1)
const hm=fmtTime(t)
if(day(d)===day(n))return 'Today at '+hm
if(day(d)===day(y))return 'Yesterday at '+hm
return d.toLocaleDateString()+' '+hm
}
export function fmtRel(t){
const s=Math.max(0,Math.floor((Date.now()-t)/1000))
if(s<60)return 'just now'
if(s<3600)return Math.floor(s/60)+'m ago'
if(s<86400)return Math.floor(s/3600)+'h ago'
if(s<2592000)return Math.floor(s/86400)+'d ago'
return new Date(t).toLocaleDateString()
}
export const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()}
export const idTime=id=>parseInt(String(id).split('_').pop().slice(0,9),36)

export function initials(name){
const p=String(name||'?').trim().split(/\s+/)
return ((p[0]?.[0]||'?')+(p.length>1?p[p.length-1][0]:'')).toUpperCase()
}
function hashColor(s){
let x=0
for(let i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))>>>0
return `hsl(${x%360} 14% 34%)`
}
export const accentBg=a=>{
if(!a)return null
const p=a.split(',')
return p.length>1?`linear-gradient(135deg,${p[0]},${p[1]})`:p[0]
}
export function coverBg(el,fileId,over){
el.style.backgroundImage=(over?over+',':'')+`url(${fileUrl(fileId)})`
el.style.backgroundSize='cover'
el.style.backgroundPosition='center'
return el
}
export function heroBox(accent,bannerId,cls){
const el=h('div',{class:cls||'hero'})
const bg=accentBg(accent)
const grad=bg&&bg.startsWith('linear')
if(bg&&!grad)el.style.backgroundColor=bg
if(bannerId)coverBg(el,bannerId,'')
else if(grad)el.style.backgroundImage=bg
return el
}
export function avatar(u,size,status){
const el=h('div',{class:'av '+(size||''),style:{background:accentBg(u?.accent)||hashColor(u?.id||u?.name||'?')}})
if(u?.avatar_id||u?.icon_id){
const img=h('img',{src:fileUrl(u.avatar_id||u.icon_id),alt:'',loading:'lazy',decoding:'async'})
img.onerror=()=>{img.remove();el.prepend(initials(u.display_name||u.name))}
el.append(img)
}else el.append(initials(u?.display_name||u?.name))
if(status)el.append(h('span',{class:'st '+status}))
return el
}
export const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms))
export const rid=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join('')

export function toast(text,kind,action){
const el=h('div',{class:'toast '+(kind||''),role:kind==='err'?'alert':'status'},h('div',null,text))
if(action){
const row=h('div',{class:'row'},h('button',{class:'btn sm',on:{click:()=>{action.fn();el.remove()}}},action.label))
el.append(row)
}
document.getElementById('toasts').append(el)
setTimeout(()=>el.remove(),action?10000:5000)
return el
}
export const fail=e=>toast(e?.message||'Something went wrong','err')

let openMenu=null
export function closeMenu(){
if(openMenu){openMenu.remove();openMenu=null;document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',menuKey,true)}
}
function outside(e){if(openMenu&&!openMenu.contains(e.target))closeMenu()}
function menuKey(e){
if(e.key==='Escape'){e.stopPropagation();closeMenu();return}
if(!openMenu)return
const items=[...openMenu.querySelectorAll('button:not(:disabled)')]
const i=items.indexOf(document.activeElement)
if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length]?.focus()}
else if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length]?.focus()}
}
export function popup(content,x,y,cls){
closeMenu()
const el=h('div',{class:'menu '+(cls||''),role:'menu'},content)
document.getElementById('layer').append(el)
openMenu=el
const w=el.offsetWidth,hh=el.offsetHeight
el.style.left=Math.max(4,Math.min(x,innerWidth-w-4))+'px'
el.style.top=Math.max(4,Math.min(y,innerHeight-hh-4))+'px'
setTimeout(()=>{document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',menuKey,true);el.querySelector('button,input')?.focus()},0)
return el
}
export function menu(items,x,y){
const kids=[]
for(const it of items){
if(!it)continue
if(it==='-'){kids.push(h('hr'));continue}
if(it.head){kids.push(h('h5',null,it.head));continue}
kids.push(h('button',{class:it.danger?'dng':'',role:'menuitem',disabled:it.disabled,on:{click:()=>{closeMenu();it.fn()}}},it.icon?icon(it.icon,'s'):null,h('span',null,it.label)))
}
return popup(kids,x,y)
}
export function menuAt(el,items){
const r=el.getBoundingClientRect()
const m=menu(items,r.left,r.bottom+4)
if(r.bottom+4+m.offsetHeight>innerHeight-4)m.style.top=Math.max(4,r.top-4-m.offsetHeight)+'px'
return m
}
export function ctxMenu(e,items){
e.preventDefault()
menu(items,e.clientX,e.clientY)
}

const stack=[]
export function dialog(title,body,opts={}){
const prev=document.activeElement
const close=()=>{
scrim.remove()
const i=stack.indexOf(api2);if(i>=0)stack.splice(i,1)
if(opts.onclose)opts.onclose()
prev?.focus?.()
}
const dlg=h('div',{class:'dlg '+(opts.cls||''),role:'dialog','aria-modal':'true','aria-label':title},
opts.bare?null:h('header',null,h('span',null,title),h('button',{class:'ib',title:'Close','aria-label':'Close',on:{click:close}},icon('x'))),
body,
opts.footer?h('footer',null,opts.footer(close)):null)
const scrim=h('div',{class:'scrim',on:{pointerdown:e=>{if(e.target===scrim&&!opts.sticky)close()}}},dlg)
document.getElementById('layer').append(scrim)
const api2={close,el:dlg}
stack.push(api2)
setTimeout(()=>(dlg.querySelector('[autofocus]')||dlg.querySelector('input,textarea,select,button.pri'))?.focus(),0)
dlg.addEventListener('keydown',e=>{
if(e.key==='Escape'&&!opts.sticky){e.stopPropagation();close()}
if(e.key==='Tab'){
const f=[...dlg.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]')].filter(x=>x.offsetParent)
if(!f.length)return
const first=f[0],last=f[f.length-1]
if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
}
})
return api2
}
export const closeTopDialog=()=>{const t=stack[stack.length-1];if(t)t.close();return!!t}
export const dialogOpen=()=>stack.length>0

export function confirmBox(title,text,label,danger){
return new Promise(res=>{
let done=false
const d=dialog(title,h('div',{class:'bd'},h('p',{style:{margin:'0'}},text)),{
footer:close=>[
h('button',{class:'btn',on:{click:()=>{done=true;close();res(false)}}},'Cancel'),
h('button',{class:'btn '+(danger?'dng':'pri'),on:{click:()=>{done=true;close();res(true)}}},label||'Confirm')
],
onclose:()=>{if(!done)res(false)}
})
})
}

export function field(label,input,hint){
return h('div',null,h('label',{class:'f'},label),input,hint?h('div',{class:'hint'},hint):null)
}
export function toggle(on,fn,label){
const b=h('button',{class:'tg',role:'switch','aria-checked':String(!!on),'aria-label':label||'',on:{click:()=>{
const v=b.getAttribute('aria-checked')!=='true'
b.setAttribute('aria-checked',String(v))
fn(v)
}}})
return b
}
export function copyText(t){
return navigator.clipboard.writeText(t).then(()=>toast('Copied','ok')).catch(()=>toast('Could not copy','err'))
}
export function tip(el,text){
el.setAttribute('title',text)
el.setAttribute('aria-label',text)
return el
}
export function lightbox(src){
const l=h('div',{class:'lbox',tabindex:'0',on:{click:()=>l.remove(),keydown:e=>{if(e.key==='Escape')l.remove()}}},h('img',{src,alt:''}))
document.getElementById('layer').append(l)
l.focus()
}
export function saveBlob(blob,name){
const a=h('a',{href:URL.createObjectURL(blob),download:name})
document.body.append(a)
a.click()
setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)
}
