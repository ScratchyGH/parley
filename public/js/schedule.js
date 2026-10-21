import{h,mount,GET,POST,DEL,dialog,field,toast,fail,fmtStamp}from'./util.js'
const pad=n=>String(n).padStart(2,'0')
const local=t=>{const d=new Date(t);return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
export function scheduleDialog(room,text,done){
const when=h('input',{class:'inp',type:'datetime-local',value:local(Date.now()+3600000),min:local(Date.now()+60000),max:local(Date.now()+30*86400000)})
const msg=h('textarea',{class:'inp',rows:4,maxLength:4000,value:text||'',placeholder:'Message to send later'})
msg.value=text||''
const list=h('div',{class:'list'})
const draw=async()=>{
try{
const d=await GET('/api/scheduled')
const mine=d.scheduled.filter(x=>x.room===room)
mount(list,mine.length?mine.map(x=>h('div',{class:'li'},h('div',{class:'grow'},h('div',null,x.content.slice(0,120)),h('small',{class:'hint',style:{margin:0}},fmtStamp(x.send_at)+' · '+(x.status==='pending'?'waiting':x.status==='failed'?'failed: '+(x.error||''):x.status))),x.status==='pending'||x.status==='failed'?h('button',{class:'btn sm',on:{click:async()=>{try{await DEL('/api/scheduled/'+x.id);draw()}catch(e){fail(e)}}}},'Cancel'):null)):h('div',{class:'hint'},'Nothing scheduled here.'))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
dialog('Schedule message',h('div',{class:'bd'},h('p',{class:'hint'},'Sent as you at the chosen time, up to 30 days ahead. Delivery runs once a minute, so it can be up to a minute late. Your permissions are checked when it sends.'),field('Message',msg),field('Send at',when),h('h4',null,'Scheduled in this chat'),list),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Close'),h('button',{class:'btn pri',on:{click:async e=>{
const t=new Date(when.value).getTime()
if(!msg.value.trim()){toast('Write a message first','err');return}
e.target.disabled=true
try{await POST('/api/rooms/'+room+'/scheduled',{content:msg.value.trim(),send_at:t});toast('Scheduled','ok');if(text&&msg.value.trim()===text.trim())done?.();msg.value='';draw()}catch(x){fail(x)}finally{e.target.disabled=false}
}}},'Schedule')]})
draw()
}
