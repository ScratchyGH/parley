import{h,dialog,POST,fail,toast,copyText,field}from'./util.js'
export function parseDelay(s){
const m=/^(\d{1,4})\s*(m|min|mins|h|hr|hrs|d|day|days)?$/i.exec(String(s||'').trim())
if(!m)return 0
const n=+m[1],u=(m[2]||'m').toLowerCase()
return u[0]==='h'?n*60:u[0]==='d'?n*1440:n
}
export async function translateMsg(text){
const lang=h('select',{class:'sel'},['English','Spanish','French','German','Portuguese','Italian','Japanese','Korean','Chinese','Russian','Arabic','Hindi','Turkish','Dutch','Polish'].map(l=>h('option',{value:l},l)))
try{lang.value=localStorage.getItem('parley.trlang')||'English'}catch{}
const out=h('div',{class:'card',style:{padding:'10px',whiteSpace:'pre-wrap',minHeight:'48px'}},'Translating…')
let last=''
const run=async()=>{
try{localStorage.setItem('parley.trlang',lang.value)}catch{}
out.textContent='Translating…'
try{const d=await POST('/api/translate',{text,to:lang.value});last=d.text;out.textContent=last}catch(e){out.textContent=e.message}
}
lang.addEventListener('change',run)
dialog('Translate',h('div',{class:'bd'},field('Translate to',lang),out,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'10px'}},h('button',{class:'btn',on:{click:()=>last&&copyText(last)}},'Copy'))))
run()
}
export async function catchUp(room){
const out=h('div',{class:'card',style:{padding:'10px',whiteSpace:'pre-wrap',minHeight:'60px'}},'Reading the last messages…')
dialog('Catch me up',h('div',{class:'bd'},out,h('div',{class:'hint'},'A short AI summary of the most recent messages in this channel.')))
try{const d=await POST('/api/rooms/'+room+'/catchup',{});out.textContent=d.summary}catch(e){out.textContent=e.message}
}
export async function remind(minutes,note,messageId){
try{await POST('/api/reminders',{minutes,note,message_id:messageId});toast('Reminder set','ok')}catch(e){fail(e)}
}
export function remindDialog(m){
const sel=h('select',{class:'sel'},[[5,'In 5 minutes'],[15,'In 15 minutes'],[60,'In 1 hour'],[180,'In 3 hours'],[1440,'Tomorrow'],[10080,'In a week']].map(([v,l])=>h('option',{value:v},l)))
const d=dialog('Remind me',h('div',{class:'bd'},field('When',sel),h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'10px'}},h('button',{class:'btn pri',on:{click:async()=>{await remind(+sel.value,'',m.id);d.close()}}},'Set reminder'))))
}
