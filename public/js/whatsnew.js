import{h,mount,POST,dialog}from'./util.js'
import{S}from'./state.js'
import{VERSION,RELEASES}from'./changelog.js'
export{VERSION}
const TAG={New:'ok',Fixes:'warn'}
const sec=([k,items])=>h('section',{class:'wn-sec'},h('h4',{class:'wn-sh'},h('span',{class:'wn-tag '+(TAG[k]||'info')},k)),h('ul',null,items.map(([t,x])=>h('li',null,h('b',null,t),h('span',null,x)))))
function viewer(start,onclose){
let cur=start
const rail=h('nav',{class:'wn-rail','aria-label':'Releases'})
const main=h('div',{class:'wn-main'})
const draw=()=>{
const r=RELEASES[cur]
mount(rail,RELEASES.map((x,i)=>h('button',{type:'button',class:i===cur?'on':'','aria-current':i===cur?'true':null,on:{click:()=>{cur=i;draw()}}},h('b',null,'v'+x.v),h('small',null,x.date))))
mount(main,h('div',{class:'wn-head'},r.img?h('img',{class:'wn-img',src:r.img,alt:'Brit',width:84,height:84}):null,h('div',{class:'wn-meta'},h('span',{class:'wn-v'},'Version '+r.v),h('span',null,r.date),i0(cur)),h('h2',null,r.title),h('p',{class:'wn-sum'},r.summary)),r.sections.map(sec))
main.scrollTop=0
}
const i0=i=>i===0?h('span',{class:'wn-latest'},'Latest'):null
draw()
return h('div',{class:'wn'},h('div',{class:'wn-brand'},h('div',{class:'wn-badge'},h('img',{src:'/logo-192.png',alt:'',width:38,height:38})),h('div',null,h('b',null,'Parley Updated!'),h('small',null,'Release notes'))),rail,main)
}
export function updatesBoard(){
dialog('Parley Updated!',viewer(0),{cls:'wn-dlg',bare:true,footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Close')]})
}
export function whatsNew(force){
if(!force&&(!S.me||S.me.seen_version===VERSION))return
const close=()=>{if(force)return;S.me.seen_version=VERSION;POST('/api/me/seen-version',{version:VERSION}).catch(()=>{})}
dialog('Parley Updated!',viewer(0),{cls:'wn-dlg',bare:true,onclose:close,footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Continue')]})
}
