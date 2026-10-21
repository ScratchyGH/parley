import{h,icon}from'./util.js'
let ov=null,kind=null,body=null,ttl=null,lead=null,closeFn=null
export function overlayKind(){return kind}
export function showOverlay(k,title,leadNode,content,onClose){
closeFn=onClose
if(!ov){
ttl=h('h2',null)
lead=h('span',{class:'ov-lead'})
body=h('div',{class:'ov-body'})
ov=h('div',{class:'ov',role:'dialog','aria-modal':'true'},h('header',{class:'ov-top'},h('button',{class:'ov-close',title:'Close','aria-label':'Close',on:{click:()=>closeFn?.()}},icon('x'),h('span',null,'Close')),lead,ttl),body)
document.body.append(ov)
void ov.offsetWidth
requestAnimationFrame(()=>ov?.classList.add('in'))
}
kind=k
ttl.textContent=title
lead.replaceChildren(leadNode||'')
body.replaceChildren(content)
body.scrollTop=0
ov.setAttribute('aria-label',title)
}
export function hideOverlay(){
if(!ov)return
const o=ov
ov=null;kind=null
o.classList.remove('in')
setTimeout(()=>o.remove(),300)
}
addEventListener('keydown',e=>{if(e.key==='Escape'&&ov&&!document.querySelector('.scrim'))closeFn?.()})
