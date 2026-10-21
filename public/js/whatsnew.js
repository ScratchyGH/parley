import{h,POST,dialog}from'./util.js'
import{S}from'./state.js'
import{parIcon}from'./pars.js'
import{VERSION,RELEASES}from'./changelog.js'
export{VERSION}
const TAG={New:'ok',Changed:'info',Fixed:'warn'}
const card=r=>h('article',{class:'wn-rel'},
h('div',{class:'wn-meta'},h('span',{class:'wn-v'},'v'+r.v),h('span',{class:'wn-d'},r.date)),
h('h3',{class:'wn-t'},r.title),
r.sections.map(([k,items])=>h('div',{class:'wn-sec'},h('span',{class:'wn-tag '+(TAG[k]||'info')},k),h('ul',null,items.map(x=>h('li',null,x))))))
export function updatesBoard(){
dialog('Parley Updated!',h('div',{class:'bd wn-board'},RELEASES.map(card)),{cls:'wn-dlg',footer:close=>[h('button',{class:'btn pri',on:{click:close}},'Close')]})
}
export function whatsNew(force){
if(!force&&(!S.me||S.me.seen_version===VERSION))return
const r=RELEASES[0]
const close=()=>{if(force)return;S.me.seen_version=VERSION;POST('/api/me/seen-version',{version:VERSION}).catch(()=>{})}
dialog('Parley Updated!',h('div',{class:'wn'},
h('div',{class:'wn-hero'},h('div',{class:'wn-badge'},parIcon(34)),h('div',null,h('div',{class:'wn-kick'},'v'+r.v+' · '+r.date),h('h2',null,r.title))),
h('div',{class:'wn-scroll'},r.sections.map(([k,items])=>h('div',{class:'wn-sec'},h('span',{class:'wn-tag '+(TAG[k]||'info')},k),h('ul',null,items.map(x=>h('li',null,x))))))),
{cls:'wn-dlg',bare:true,onclose:close,footer:c=>[h('button',{class:'btn',on:{click:()=>{c();updatesBoard()}}},'Earlier updates'),h('button',{class:'btn pri',on:{click:c}},'Got it')]})
}
