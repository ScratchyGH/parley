import{h,GET,PUT,toast,fail,AB,toggle,avatar}from'./util.js'
import{S}from'./state.js'
import{uploadImage}from'./dialogs.js'
import{pickCropped}from'./cropper.js'
export async function abBoot(){
try{const d=await GET('/api/ab');for(const k of Object.keys(AB))delete AB[k];Object.assign(AB,d.map)}catch{}
}
export function abBox(){
const box=h('div',{class:'ab-box'})
const draw=async()=>{
let o
try{o=(await GET('/api/ab/me')).ab}catch(e){box.replaceChildren(h('p',{class:'hint'},e.message));return}
const prev=avatar({...S.me,avatar_id:o.avatar_id||S.me.avatar_id},'lg')
const pick=h('button',{class:'btn',on:{click:async()=>{
try{
const f=await pickCropped({aspect:1,round:true,width:512,title:'Profile picture B'})
if(!f)return
const up=await uploadImage('avatar',{},f)
await PUT('/api/ab/me',{on:o.on,avatar_id:up.id})
toast('Picture B saved','ok');draw()
}catch(e){fail(e)}
}}},o.avatar_id?'Change picture B':'Choose picture B')
const tg=toggle(!!o.on,async v=>{try{await PUT('/api/ab/me',{on:v,avatar_id:o.avatar_id});draw()}catch(e){fail(e);draw()}},'Show picture B to half of viewers')
box.replaceChildren(h('h3',null,'A/B profile'),h('p',{class:'hint'},'Half of the people who see you will see picture B instead of your normal picture. Each person always sees the same one. Your name stays the same.'),h('div',{class:'row sp'},prev,pick),h('div',{class:'row sp',style:{padding:'8px 0'}},h('span',null,'Run the test'),tg))
}
draw()
return box
}
