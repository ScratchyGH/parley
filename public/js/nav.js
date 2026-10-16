let handler=()=>{}
export const setRouteHandler=fn=>{handler=fn}
export function go(path,replace){
if(location.pathname+location.search===path){handler();return}
history[replace?'replaceState':'pushState'](null,'',path)
handler()
}
addEventListener('popstate',()=>handler())
addEventListener('click',e=>{
if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return
const a=e.target.closest?.('a[href]')
if(!a||a.target||a.hasAttribute('download')||a.origin!==location.origin)return
const p=a.pathname
if(!/^\/(bots|discover|friends|s|dm)(\/|$)/.test(p))return
e.preventDefault()
go(p+a.search)
})
export function parse(){
const u=new URL(location.href)
const p=u.pathname.split('/').filter(Boolean)
const m=u.searchParams.get('m')
if(!p.length||p[0]==='home'||p[0]==='friends')return{name:'home',page:p[0]==='friends'?(p[1]||'all'):'overview'}
if(p[0]==='dm')return{name:'dm',room:p[1]||null,m}
if(p[0]==='s')return{name:'server',sid:p[1],ch:p[2]||null,m}
if(p[0]==='discover')return{name:'discover'}
if(p[0]==='bots'){
if(!p[1])return{name:'bots',view:'browse'}
if(p[1]==='mine'||p[1]==='new')return{name:'bots',view:p[1]}
if(p[2]==='edit')return{name:'bots',view:'edit',slug:p[1]}
return{name:'bots',view:'project',slug:p[1],tab:p[2]||''}
}
if(p[0]==='invite')return{name:'invite',code:p[1]}
if(p[0]==='appeal')return{name:'appeal'}
return{name:'home',page:'friends'}
}
export function lastChan(sid){try{return localStorage.getItem('parley:last:'+sid)}catch{return null}}
export function setLastChan(sid,ch){try{localStorage.setItem('parley:last:'+sid,ch)}catch{}}
