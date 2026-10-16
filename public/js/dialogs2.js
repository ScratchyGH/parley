import{h,mount,icon,GET,POST,PUT,DEL,toast,fail,dialog,field,toggle,fmtStamp,rid,confirmBox}from'./util.js'
import{S,P,can,noteThread,convTitle}from'./state.js'
import{go}from'./nav.js'

const errBox=()=>h('div',{class:'err',role:'alert'})
const submitter=(btn,err,fn)=>async e=>{
e?.preventDefault?.()
err.textContent=''
btn.disabled=true
try{await fn()}catch(x){err.textContent=x.message;btn.disabled=false}
}

export function pollDialog(room){
const err=errBox()
const q=h('input',{class:'inp',maxLength:300,required:true,autofocus:true,placeholder:'Ask a question'})
const list=h('div',{style:{display:'flex',flexDirection:'column',gap:'6px'}})
const opts=['','']
const draw=()=>mount(list,opts.map((v,i)=>h('div',{class:'row'},h('input',{class:'inp grow',maxLength:100,value:v,placeholder:'Option '+(i+1),'aria-label':'Option '+(i+1),on:{input:e=>{opts[i]=e.target.value}}}),opts.length>2?h('button',{type:'button',class:'ib',title:'Remove option','aria-label':'Remove option',on:{click:()=>{opts.splice(i,1);draw()}}},icon('x','s')):null)))
draw()
const add=h('button',{type:'button',class:'btn sm',on:{click:()=>{if(opts.length<10){opts.push('');draw()}}}},icon('plus','s'),'Add option')
let multi=false
const dur=h('select',{class:'sel'},[['','No time limit'],['1','1 hour'],['24','24 hours'],['72','3 days'],['168','7 days']].map(([v,l])=>h('option',{value:v},l)))
const btn=h('button',{class:'btn pri',type:'submit'},'Create poll')
const d=dialog('Create poll',h('div',{class:'bd'},h('form',{on:{submit:submitter(btn,err,async()=>{
const options=opts.map(x=>x.trim()).filter(Boolean)
if(options.length<2)throw new Error('Add at least two options')
await POST(`/api/rooms/${room}/polls`,{question:q.value.trim(),options,multi,hours:dur.value?parseInt(dur.value):null})
d.close()
})}},field('Question',q),h('div',null,h('label',{class:'f'},'Options'),list,h('div',{style:{marginTop:'6px'}},add)),h('div',{class:'row sp',style:{padding:'8px 0'}},h('span',null,'Allow multiple answers'),toggle(false,v=>{multi=v},'Allow multiple answers')),field('Duration',dur),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},btn))),{})
}

export function threadDialog(sid,room,m){
const err=errBox()
const name=h('input',{class:'inp',maxLength:80,required:true,autofocus:true,value:(m.content||'Thread').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,60)||'Thread'})
const btn=h('button',{class:'btn pri',type:'submit'},'Start thread')
const d=dialog('Start thread',h('div',{class:'bd'},h('form',{on:{submit:submitter(btn,err,async()=>{
const r=await POST(`/api/rooms/${room}/messages/${m.id}/thread`,{name:name.value.trim()})
noteThread(r.thread,sid)
d.close()
go(`/s/${sid}/${r.thread.id}`)
})}},field('Thread name',name),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'12px'}},btn))),{})
}

export function forwardDialog(m){
const q=h('input',{class:'inp',type:'search',placeholder:'Search channels and conversations','aria-label':'Search',autofocus:true})
const list=h('div',{class:'list',style:{maxHeight:'320px',overflow:'auto'}})
const dests=[]
for(const c of S.convs)dests.push({id:c.id,label:convTitle(c),sub:'Direct message',ic:'chat'})
for(const s of S.servers){
const d=S.sdata[s.id]
if(!d)continue
for(const c of d.channels)if((c.type==='text'||c.type==='announce')&&(c.perms&P.SEND))dests.push({id:c.id,label:'#'+c.name,sub:s.name,ic:'hash'})
}
const draw=()=>{
const t=q.value.trim().toLowerCase()
const items=dests.filter(x=>!t||x.label.toLowerCase().includes(t)||x.sub.toLowerCase().includes(t)).slice(0,40)
mount(list,items.length?items.map(x=>h('button',{class:'ci',on:{click:async()=>{
try{
await POST(`/api/rooms/${x.id}/messages`,{forward_of:m.id,nonce:rid()})
d.close()
toast('Forwarded to '+x.label,'ok')
}catch(e){fail(e)}
}}},icon(x.ic,'s'),h('b',null,x.label),h('span',{class:'hint',style:{margin:'0 0 0 auto'}},x.sub))):h('div',{class:'hint'},'Nothing matches'))
}
q.addEventListener('input',draw)
draw()
const d=dialog('Forward message',h('div',{class:'bd'},q,list,h('p',{class:'hint'},'The message text is quoted with the original author. Attachments are not forwarded.')),{})
}

export async function eventsDialog(sid){
const manage=can(sid,P.MANAGE_SERVER)
const body=h('div',{class:'bd'},h('div',{class:'hint'},'Loading…'))
const d=dialog('Events',body,{cls:'wide'})
const stamp=ms=>{const x=new Date(ms);return x.toISOString().slice(0,16)}
async function draw(events){
let evs=events
if(!evs){try{evs=(await GET(`/api/servers/${sid}/events`)).events}catch(e){mount(body,h('div',{class:'err'},e.message));return}}
const rsvp=async(ev,state)=>{try{const r=await PUT(`/api/servers/${sid}/events/${ev.id}/rsvp`,{state});draw(r.events)}catch(e){fail(e)}}
const cards=evs.map(ev=>h('div',{class:'card',style:{margin:'0 0 8px'}},
h('b',{style:{color:'var(--strong)'}},ev.title),
h('div',{class:'hint',style:{margin:'2px 0'}},icon('calendar','s'),' '+fmtStamp(ev.starts_at)+(ev.ends_at?' – '+fmtStamp(ev.ends_at):''),ev.location?' · '+ev.location:''),
ev.description?h('p',{style:{margin:'4px 0'}},ev.description):null,
h('div',{class:'row'},
h('button',{class:'btn sm'+(ev.mine==='going'?' pri':''),'aria-pressed':String(ev.mine==='going'),on:{click:()=>rsvp(ev,ev.mine==='going'?'none':'going')}},'Going · '+ev.going),
h('button',{class:'btn sm'+(ev.mine==='interested'?' pri':''),'aria-pressed':String(ev.mine==='interested'),on:{click:()=>rsvp(ev,ev.mine==='interested'?'none':'interested')}},'Interested · '+ev.interested),
manage?h('button',{class:'btn sm dng',on:{click:async()=>{if(!await confirmBox('Delete event','This removes the event and all RSVPs.','Delete',true))return;try{await DEL(`/api/servers/${sid}/events/${ev.id}`);draw()}catch(e){fail(e)}}}},'Delete'):null)))
const kids=[cards.length?cards:h('div',{class:'empty'},'No upcoming events')]
if(manage){
const err=errBox()
const title=h('input',{class:'inp',maxLength:100,required:true,placeholder:'Event title'})
const when=h('input',{class:'inp',type:'datetime-local',required:true,value:stamp(Date.now()+86400000).slice(0,16)})
const until=h('input',{class:'inp',type:'datetime-local'})
const where=h('input',{class:'inp',maxLength:200,placeholder:'Location or link (optional)'})
const desc=h('textarea',{class:'inp',rows:2,maxLength:1000,placeholder:'Description (optional)'})
const btn=h('button',{class:'btn pri',type:'submit'},'Create event')
kids.push(h('h4',{style:{margin:'16px 0 6px'}},'New event'),h('form',{on:{submit:submitter(btn,err,async()=>{
const starts=new Date(when.value).getTime()
const ends=until.value?new Date(until.value).getTime():null
const r=await POST(`/api/servers/${sid}/events`,{title:title.value.trim(),description:desc.value.trim(),location:where.value.trim(),starts_at:starts,ends_at:ends})
draw(r.events)
})}},field('Title',title),h('div',{class:'row'},field('Starts',when),field('Ends (optional)',until)),field('Location',where),field('Description',desc),err,h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'8px'}},btn)))
}
mount(body,kids)
}
draw()
}
