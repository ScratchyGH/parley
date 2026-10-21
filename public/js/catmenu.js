import{h,mount,PUT,PATCH,DEL,dialog,field,toast,fail,confirmBox}from'./util.js'
import{S,P,PERM_INFO,loadServer}from'./state.js'
const BITS=['VIEW','SEND','ATTACH','REACT','MENTION_ALL','CONNECT','MANAGE_MESSAGES','CREATE_INVITE']
export function categoryMenu(sid,cat){
return[
{label:'Rename category',fn:()=>renameDialog(sid,cat)},
{label:'Permissions for all channels',fn:()=>permsDialog(sid,cat)},
{label:'Delete category',danger:true,fn:async()=>{
if(!await confirmBox('Delete '+cat.name,'Channels inside move out of the category. They are not deleted.','Delete category',true))return
try{await DEL(`/api/servers/${sid}/categories/${cat.id}`);await loadServer(sid)}catch(e){fail(e)}
}}
]
}
function renameDialog(sid,cat){
const name=h('input',{class:'inp',maxLength:40,value:cat.name,autofocus:true})
dialog('Rename category',h('div',{class:'bd'},field('Name',name)),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),h('button',{class:'btn pri',on:{click:async()=>{
if(!name.value.trim())return
try{await PATCH(`/api/servers/${sid}/categories/${cat.id}`,{name:name.value.trim()});await loadServer(sid);close()}catch(e){fail(e)}
}}},'Save')]})
}
function permsDialog(sid,cat){
const d=S.sdata[sid]
const n=d.channels.filter(c=>c.category_id===cat.id).length
const who=h('select',{class:'sel'},d.roles.map(r=>h('option',{value:r.id},r.name)))
const st={}
const rows=BITS.map(k=>{
const info=PERM_INFO.find(x=>x[0]===k)
st[k]='inherit'
const box=h('div',{class:'tabs',style:{margin:0}})
const draw=()=>mount(box,[['deny','Deny'],['inherit','Inherit'],['allow','Allow']].map(([v,l])=>h('button',{type:'button',class:st[k]===v?'on':'','aria-pressed':String(st[k]===v),on:{click:()=>{st[k]=v;draw()}}},l)))
draw()
return h('div',{class:'row sp',style:{padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('span',null,info?info[1]:k),box)
})
dialog('Permissions for '+cat.name,h('div',{class:'bd'},h('p',{class:'hint'},'Sets this role\'s overrides on all '+n+' channel'+(n===1?'':'s')+' in the category, replacing what is there for that role. Choose Inherit on everything to clear them.'),field('Role',who),rows),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),h('button',{class:'btn pri',on:{click:async()=>{
let allow=0,deny=0
for(const k of BITS){if(st[k]==='allow')allow|=P[k];if(st[k]==='deny')deny|=P[k]}
try{const r=await PUT(`/api/servers/${sid}/categories/${cat.id}/overrides`,{target_type:'role',target_id:who.value,allow,deny});await loadServer(sid);toast('Applied to '+r.applied+' channel'+(r.applied===1?'':'s')+(r.skipped?' ('+r.skipped+' skipped: you cannot see them)':''),'ok');close()}catch(e){fail(e)}
}}},'Apply')]})
}
