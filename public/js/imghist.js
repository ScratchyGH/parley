import{h,mount,GET,DEL,fail,confirmBox,fileUrl}from'./util.js'

export function historyBox(kind,current,apply){
const box=h('div',{class:'ihist'})
async function draw(){
let d
try{d=await GET('/api/me/images?kind='+kind)}catch(e){mount(box,h('div',{class:'hint'},e.message));return}
const cur=current()
if(!d.images.length){mount(box,h('div',{class:'hint'},'Nothing here yet. Each new '+(kind==='avatar'?'avatar':'banner')+' you set is kept here.'));return}
mount(box,d.images.map(i=>{
const on_=i.id===cur
return h('div',{class:'ih'+(on_?' on':'')+' '+kind},
h('button',{type:'button',class:'ihp',disabled:on_,title:on_?'In use':'Use this image','aria-label':on_?'Image in use':'Use this image',on:{click:async()=>{try{await apply(i.id);await draw()}catch(e){fail(e)}}}},h('img',{src:fileUrl(i.id),alt:'',loading:'lazy',decoding:'async'})),
on_?h('span',{class:'ihc'},'In use'):h('button',{type:'button',class:'ihx',title:'Delete this image','aria-label':'Delete this image',on:{click:async()=>{
if(!await confirmBox('Delete this image?','It is removed from your history and storage.','Delete',true))return
try{await DEL(`/api/me/images/${i.id}?kind=${kind}`);await draw()}catch(e){fail(e)}
}}},'×'))
}))
}
draw()
return{el:box,reload:draw}
}
