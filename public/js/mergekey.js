import{h,GET,POST,fail,toast,copyText,confirmBox,dialog}from'./util.js'
export function mergeKeyBox(p){
const out=h('code',{style:{userSelect:'all',wordBreak:'break-all'}},'Hidden')
let shown=false,key=''
const load=async()=>{if(!key)key=(await GET(`/api/bothub/${p.id}/mergekey`)).key;return key}
const eye=h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await load();shown=!shown;out.textContent=shown?key:'Hidden';eye.textContent=shown?'Hide':'Show'}catch(e){fail(e)}}}},'Show')
const cp=h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await load();copyText(key);toast('Merge key copied','ok')}catch(e){fail(e)}}}},'Copy')
const re=h('button',{class:'btn sm dng',type:'button',on:{click:async()=>{if(!await confirmBox('Make a new merge key?','Bots linked with the old key are disconnected.','Make new key',true))return;try{key=(await POST(`/api/bothub/${p.id}/mergekey`,{})).key;shown=true;out.textContent=key;eye.textContent='Hide'}catch(e){fail(e)}}}},'New key')
return h('div',{style:{marginTop:'12px'}},h('b',null,'Merge key'),h('p',{class:'hint'},'Paste it into a Connect another bot block on another bot to share values with this one.'),h('p',{class:'hint',style:{color:'var(--err,#e5534b)',fontWeight:'600'}},'Do not share this key with anyone you do not fully trust. Anyone who has it can link their bot to yours and read and change its saved values, like XP.'),h('div',{class:'row'},out,eye,cp,re))
}
export function mergeKeyDialog(p){dialog('Merge key',h('div',{class:'bd'},mergeKeyBox(p)),{footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Close')]})}
