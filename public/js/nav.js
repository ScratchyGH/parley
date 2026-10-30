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
if(!/^\/(bots|lab|discover|friends|settings|s|dm|pars|hollow)(\/|$)/.test(p))return
e.preventDefault()
go(p+a.search)
})
export function parse(){
const u=new URL(location.href)
const p=u.pathname.split('/').filter(Boolean)
const m=u.searchParams.get('m')
if(!p.length||p[0]==='home'||p[0]==='friends')return{name:'home',page:p[0]==='friends'?(p[1]||'all'):'overview'}
if(p[0]==='dm')return{name:'dm',room:p[1]||null,m}
if(p[0]==='s'&&p[2]==='settings')return{name:'ssettings',sid:p[1],page:p[3]||''}
if(p[0]==='s')return{name:'server',sid:p[1],ch:p[2]||null,m}
if(p[0]==='discover')return{name:'discover'}
if(p[0]==='pars')return{name:'pars'}
if(p[0]==='hollow')return{name:'hollow'}
if(p[0]==='docs')return{name:'docs'}
if(p[0]==='games')return{name:'games'}
if(p[0]==='lab'){
if(!p[1])return{name:'lab',view:'mine'}
if(p[1]==='new')return{name:'lab',view:'new'}
if(p[2]==='blocks')return{name:'lab',view:'blocks',slug:p[1]}
return{name:'lab',view:'edit',slug:p[1]}
}
if(p[0]==='bots'){
if(!p[1])return{name:'bots',view:'browse'}
if(p[1]==='mine')return{name:'lab',view:'mine'}
if(p[1]==='new')return{name:'lab',view:'new'}
if(p[2]==='edit')return{name:'lab',view:'edit',slug:p[1]}
if(p[2]==='blocks')return{name:'lab',view:'blocks',slug:p[1]}
return{name:'bots',view:'project',slug:p[1],tab:p[2]||''}
}
if(p[0]==='settings')return{name:'settings',page:p[1]||'account'}
if(p[0]==='invite')return{name:'invite',code:p[1]}
if(p[0]==='appeal')return{name:'appeal'}
return{name:'home',page:'friends'}
}
export function lastChan(sid){try{return localStorage.getItem('parley:last:'+sid)}catch{return null}}
export function setLastChan(sid,ch){try{localStorage.setItem('parley:last:'+sid,ch)}catch{}}
