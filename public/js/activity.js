import{S,on,emit,setting}from'./state.js'
import{sendAll}from'./net.js'
import{h,icon,dialog,field,toast,fail}from'./util.js'
const LK='parley.act'
const L={play:'Playing ',listen:'Listening to ',watch:'Watching ',custom:''}
const R=[[/^\/games/,'play','Parley Games'],[/^\/(thicket|hollow)/,'play','The Thankful Thicket'],[/^\/pars/,'custom','Browsing the Pars shop'],[/^\/bots|^\/lab/,'custom','Building a bot']]
let manual=null,auto=null
try{manual=JSON.parse(localStorage.getItem(LK)||'null')}catch{}
export const myAct=()=>manual||auto
export const actText=a=>a?(L[a.k]||'')+a.n:''
const push=()=>{
let a=myAct()
if(!setting('show_activity',true))a=null
if(S.me){if(a)S.act[S.me.id]=a;else delete S.act[S.me.id]}
sendAll({t:'activity',a})
emit('act')
}
export function setActivity(a){
manual=a?{k:a.k,n:a.n,t:Date.now()}:null
try{if(manual)localStorage.setItem(LK,JSON.stringify(manual));else localStorage.removeItem(LK)}catch{}
push()
}
const route=()=>{
const r=R.find(x=>x[0].test(location.pathname))
const n=r?{k:r[1],n:r[2],t:auto&&auto.n===r[2]?auto.t:Date.now()}:null
if((n&&n.n)!==(auto&&auto.n)){auto=n;push()}
}
export function startActivity(){
if(!S.act)S.act={}
for(const k of['pushState','replaceState']){const o=history[k];history[k]=function(...a){const r=o.apply(this,a);setTimeout(route,0);return r}}
addEventListener('popstate',route)
on('ev',({m})=>{
if(m.t==='ready'){
for(const p of m.presence||[]){if(p.a)S.act[p.uid]=p.a;else delete S.act[p.uid]}
if(myAct())push()
emit('act')
}else if(m.t==='activity'){
if(m.a)S.act[m.uid]=m.a;else delete S.act[m.uid]
emit('act')
}else if(m.t==='presence'&&m.s==='offline'){delete S.act[m.uid];emit('act')}
})
on('settings',push)
route()
if(manual)push()
}
const since=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?'just started':m<60?m+' min':Math.floor(m/60)+'h '+m%60+'m'}
export function actWidget(u){
const a=u&&(u.id===S.me?.id?myAct():S.act?.[u.id])
if(!a)return null
return h('div',{class:'actw'},h('div',{class:'aci'},icon(a.k==='listen'?'volume':a.k==='watch'?'screen':a.k==='play'?'star':'smile')),h('div',{class:'act'},h('small',null,{play:'Playing',listen:'Listening to',watch:'Watching',custom:'Activity'}[a.k]),h('b',null,a.n),h('span',null,since(a.t))))
}
export function activityDialog(){
const cur=manual
const kind=h('select',{class:'sel','aria-label':'Type'},[['play','Playing'],['listen','Listening to'],['watch','Watching'],['custom','Custom']].map(([v,l])=>h('option',{value:v,selected:cur&&cur.k===v},l)))
const nm=h('input',{class:'inp',maxLength:40,value:cur?cur.n:'',placeholder:'What are you up to?','aria-label':'Activity'})
dialog('Set an activity',h('div',null,field('Type',kind),field('Name',nm),h('div',{class:'hint'},'Shown on your profile and next to your name in member lists. Turn it off any time in Privacy settings.')),{footer:close=>[
h('button',{class:'btn',type:'button',on:{click:()=>{setActivity(null);close()}}},'Clear'),
h('button',{class:'btn pri',type:'button',on:{click:()=>{const n=nm.value.trim();if(!n){fail(new Error('Type what you are doing'));return}setActivity({k:kind.value,n});close();toast('Activity set','ok')}}},'Save')]})
}
