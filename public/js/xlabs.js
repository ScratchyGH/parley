import{h,mount,GET,POST,PUT,DEL,PATCH,fail,toast,dialog,toggle,field,fmtDate,fmtStamp}from'./util.js'
import{S,can,P}from'./state.js'

const api=sid=>`/api/servers/${sid}/labs`
const textChans=sid=>S.sdata[sid].channels.filter(c=>c.type==='text'||c.type==='announce')
const chanSel=(sid,val,on,ph='Pick a channel')=>{
const el=h('select',{class:'sel','aria-label':ph,on:{change:()=>on(el.value)}},h('option',{value:''},ph),textChans(sid).map(c=>h('option',{value:c.id,selected:val===c.id},'#'+c.name)))
return el
}
const roleSel=(sid,val,on)=>{
const el=h('select',{class:'sel','aria-label':'Role',on:{change:()=>on(el.value)}},h('option',{value:''},'Pick a role'),S.sdata[sid].roles.filter(r=>!r.is_everyone).map(r=>h('option',{value:r.id,selected:val===r.id},r.name)))
return el
}
const num=(val,min,max,on,label)=>{
const el=h('input',{class:'inp',type:'number',min:String(min),max:String(max),value:String(val),'aria-label':label,style:{width:'110px'},on:{input:()=>on(Number(el.value))}})
return el
}
const btn=(label,fn,cls='btn')=>h('button',{class:cls,type:'button',on:{click:async e=>{const b=e.currentTarget;b.disabled=true;try{await fn()}catch(x){fail(x)}finally{b.disabled=false}}}},label)
const row=(...k)=>h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap',alignItems:'center',margin:'6px 0'}},...k)
const box=(title,...k)=>h('div',{style:{marginTop:'10px',paddingTop:'8px',borderTop:'1px solid var(--border)'}},h('b',null,title),...k)
const empty=t=>h('div',{class:'hint'},t)

function configControls(sid,key,cfg){
const out=[]
if('channel_id' in cfg&&key!=='sticky'){
const label={starboard:'Starboard channel',levels:'Level-up announcements (blank uses the channel they chat in)',counting:'Counting channel',qotd:'Question channel',confessions:'Confession channel',birthdays:'Birthday channel',suggestions:'Suggestions channel',reminders:'Reminder channel',giveaways:'Channel'}[key]||'Channel'
out.push(field(label,chanSel(sid,cfg.channel_id,v=>{cfg.channel_id=v},key==='levels'?'Same channel':'Pick a channel')))
}
if(key==='starboard'){
const em=h('input',{class:'inp',maxLength:8,value:cfg.emoji,style:{width:'80px'},'aria-label':'Emoji',on:{input:()=>{cfg.emoji=em.value.trim()}}})
out.push(row(field('Emoji',em),field('Reactions needed',num(cfg.threshold,1,50,v=>{cfg.threshold=v},'Reactions needed'))))
}
if(key==='qotd')out.push(field('Post hour (UTC, 0 to 23)',num(cfg.hour,0,23,v=>{cfg.hour=v},'Hour')))
if(key==='levels'){
const list=h('div')
const draw=()=>mount(list,cfg.rewards.map((r,i)=>row('At level',num(r.level,1,200,v=>{r.level=v},'Level'),roleSel(sid,r.role_id,v=>{r.role_id=v}),h('button',{class:'btn sm',type:'button',on:{click:()=>{cfg.rewards.splice(i,1);draw()}}},'Remove'))),cfg.rewards.length<10?h('button',{class:'btn sm',type:'button',on:{click:()=>{cfg.rewards.push({level:5,role_id:''});draw()}}},'Add role reward'):null)
draw()
out.push(h('div',null,h('label',{class:'f'},'Role rewards'),list))
}
return out
}

function rrTools(sid){
const body=h('div')
const load=async()=>{
const r=await GET(api(sid)+'/rr')
const msg=h('input',{class:'inp',placeholder:'Message ID (copy it from the message menu)','aria-label':'Message ID'})
const em=h('input',{class:'inp',placeholder:'Emoji',maxLength:8,style:{width:'90px'},'aria-label':'Emoji'})
let role=''
mount(body,r.items.length?r.items.map(i=>row(h('span',null,i.emoji),h('span',null,'gives '+(i.role_name||'a deleted role')),h('span',{class:'hint'},i.preview||'(message gone)'),h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await DEL(api(sid)+'/rr/'+i.message_id+'/'+encodeURIComponent(i.emoji));load()}catch(e){fail(e)}}}},'Remove'))):empty('No reaction roles yet.'),row(msg,em,roleSel(sid,'',v=>{role=v}),btn('Add',async()=>{await POST(api(sid)+'/rr',{message_id:msg.value.trim(),emoji:em.value.trim(),role_id:role});toast('Reaction role added','ok');load()})))
}
load().catch(e=>mount(body,e.message))
return box('Reaction roles',body)
}

function giveawayTools(sid){
const body=h('div')
const load=async()=>{
const r=await GET(api(sid)+'/giveaways')
let ch='',prize=h('input',{class:'inp',maxLength:100,placeholder:'Prize','aria-label':'Prize'}),w=1,mins=60
mount(body,row(prize,chanSel(sid,'',v=>{ch=v}),'Winners',num(1,1,10,v=>{w=v},'Winners'),'Minutes',num(60,1,43200,v=>{mins=v},'Minutes'),btn('Start giveaway',async()=>{await POST(api(sid)+'/giveaways',{channel_id:ch,prize:prize.value,winners:w,minutes:mins});toast('Giveaway started','ok');load()})),
r.items.length?r.items.map(g=>row(h('b',null,g.prize),h('span',{class:'hint'},g.ended?'Ended '+fmtStamp(g.ends_at):'Ends '+fmtStamp(g.ends_at)),g.ended?btn('Reroll',async()=>{await POST(api(sid)+`/giveaways/${g.id}/reroll`);toast('Winners drawn again','ok')},'btn sm'):btn('End now',async()=>{await POST(api(sid)+`/giveaways/${g.id}/end`);load()},'btn sm'))):empty('No giveaways yet.'))
}
load().catch(e=>mount(body,e.message))
return box('Giveaways',body)
}

function qotdTools(sid){
const body=h('div')
const load=async()=>{
const r=await GET(api(sid)+'/qotd')
const q=h('input',{class:'inp',maxLength:300,placeholder:'Add a question','aria-label':'Question',style:{minWidth:'260px'}})
mount(body,row(q,btn('Add to queue',async()=>{await POST(api(sid)+'/qotd',{text:q.value});load()}),btn('Post next now',async()=>{await POST(api(sid)+'/qotd/ask');toast('Question posted','ok');load()})),
r.items.length?r.items.map(i=>row(h('span',{style:{opacity:i.used_at?.6:1}},i.text),h('span',{class:'hint'},i.used_at?'Asked '+fmtDate(i.used_at):'Waiting'),h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await DEL(api(sid)+'/qotd/'+i.id);load()}catch(e){fail(e)}}}},'Delete'))):empty('The queue is empty.'))
}
load().catch(e=>mount(body,e.message))
return box('Question queue',body)
}

function confessionTools(sid){
const body=h('div')
const load=async()=>{
const r=await GET(api(sid)+'/confessions')
mount(body,h('p',{class:'hint'},'Only people with Moderate members or Manage server can see who wrote these.'),r.items.length?r.items.map(i=>row(h('span',null,i.text||'(removed)'),h('span',{class:'hint'},(i.display_name||'Unknown')+' • '+fmtStamp(i.created_at)),i.text?btn('Remove',async()=>{await POST(api(sid)+`/confessions/${i.id}/remove`);load()},'btn sm'):null,btn(i.banned?'Unblock sender':'Block sender',async()=>{await POST(api(sid)+`/confessions/${i.id}/block`,{on:!i.banned});load()},'btn sm'))):empty('No confessions yet.'))
}
load().catch(e=>mount(body,e.message))
return box('Confession log',body)
}

function stickyTools(sid){
const body=h('div')
const load=async()=>{
const r=await GET(api(sid)+'/sticky')
let ch='',txt=h('textarea',{class:'inp',rows:2,maxLength:1500,placeholder:'Message to keep at the bottom','aria-label':'Sticky message'})
mount(body,r.items.map(i=>row(h('b',null,'#'+i.name),h('span',null,i.content.slice(0,80)),btn('Remove',async()=>{await DEL(api(sid)+'/sticky/'+i.channel_id);load()},'btn sm'))),row(chanSel(sid,'',v=>{ch=v}),txt,btn('Save sticky',async()=>{if(!ch)throw new Error('Pick a channel first');await PUT(api(sid)+'/sticky/'+ch,{content:txt.value});toast('Sticky message set','ok');load()})))
}
load().catch(e=>mount(body,e.message))
return box('Sticky messages',body)
}

function suggestionTools(sid){
const body=h('div')
const load=async()=>{
const r=await GET(api(sid)+'/suggestions')
mount(body,r.items.length?r.items.map(i=>suggestionRow(sid,i,r.can_review,load)):empty('No suggestions yet.'))
}
load().catch(e=>mount(body,e.message))
return box('Suggestions',body)
}
function suggestionRow(sid,i,review,reload){
const note=h('input',{class:'inp',maxLength:300,placeholder:'Note (optional)','aria-label':'Note'})
const set=s=>btn(s[0].toUpperCase()+s.slice(1),async()=>{await PATCH(api(sid)+'/suggestions/'+i.id,{status:s,note:note.value});reload()},'btn sm')
return h('div',{style:{padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('div',null,i.text),h('div',{class:'hint'},(i.display_name||'Unknown')+' • '+fmtDate(i.created_at)+' • '+i.status+(i.note?' • '+i.note:'')),review?row(note,set('approved'),set('considering'),set('declined')):null)
}

const EXTRA={reactionroles:rrTools,giveaways:giveawayTools,qotd:qotdTools,confessions:confessionTools,sticky:stickyTools,suggestions:suggestionTools}

export async function labsPage(pg,sid){
mount(pg,h('h3',null,'Server labs'),empty('Loading'))
let r
try{r=await GET(api(sid))}catch(e){mount(pg,h('h3',null,'Server labs'),empty(e.message));return}
if(!r.active){mount(pg,h('h3',null,'Server labs'),empty('Server labs are part of the Experimental Servers Program. Turn the program on for this server under Experimental program to use them.'));return}
const cards=Object.entries(r.features).map(([key,f])=>{
const cfg=JSON.parse(JSON.stringify(f.config))
let en=f.enabled
const ctrls=configControls(sid,key,cfg)
const tools=f.enabled&&EXTRA[key]?EXTRA[key](sid):null
const hasCfg=ctrls.length>0
return h('div',{class:'card',style:{marginBottom:'12px'}},
h('div',{class:'row',style:{justifyContent:'space-between',gap:'12px'}},h('div',null,h('b',null,f.name),h('div',{class:'hint'},f.descr)),toggle(en,v=>{en=v},'Turn on '+f.name)),
ctrls,
h('div',{class:'row',style:{marginTop:'8px'}},btn('Save',async()=>{await PUT(api(sid)+'/'+key,hasCfg?{enabled:en,config:cfg}:{enabled:en});toast('Saved','ok');labsPage(pg,sid)},'btn pri'),key==='counting'&&f.enabled?btn('Reset count',async()=>{await POST(api(sid)+'/counting/reset');toast('Count reset to 0','ok')}):null),
tools)
})
mount(pg,h('h3',null,'Server labs'),h('p',{class:'hint'},'Experimental server features. Posts come from a bot named Server plugins. These can change or be removed while they are tested.'),cards)
}

export async function communityDialog(sid){
const body=h('div',{class:'bd',style:{minWidth:'min(560px,92vw)'}},empty('Loading'))
dialog('Community tools',body,{cls:'wide'})
let r
try{r=await GET(api(sid))}catch(e){mount(body,empty(e.message));return}
const f=r.features,on=k=>r.active&&f[k].enabled
const parts=[]
if(on('levels')){
const sec=h('div');parts.push(box('Levels',sec))
GET(api(sid)+'/leaderboard').then(x=>mount(sec,x.me?h('p',null,`You are level ${x.me.level} with ${x.me.xp} XP${x.me.rank?', rank #'+x.me.rank:''}. Next level at ${x.me.next_at} XP.`):empty('Chat to start earning XP.'),x.top.map(t=>h('div',{class:'row sp',style:{padding:'2px 0'}},h('span',null,'#'+t.rank+' '+t.display_name),h('span',{class:'hint'},'Level '+t.level+' • '+t.xp+' XP'))))).catch(e=>mount(sec,e.message))
}
if(on('counting')){
const sec=h('div');parts.push(box('Counting',sec))
GET(api(sid)+'/counting').then(x=>mount(sec,'Current count '+x.last+', best '+x.best+'.')).catch(e=>mount(sec,e.message))
}
if(on('giveaways')){
const sec=h('div');parts.push(box('Giveaways',sec))
GET(api(sid)+'/giveaways').then(x=>mount(sec,x.items.length?x.items.slice(0,8).map(g=>row(h('b',null,g.prize),h('span',{class:'hint'},g.ended?'Ended':'Running until '+fmtStamp(g.ends_at))))):empty('No giveaways right now.'))).catch(e=>mount(sec,e.message))
}
if(on('confessions')){
const t=h('textarea',{class:'inp',rows:3,maxLength:1500,placeholder:'Write your confession','aria-label':'Confession'})
parts.push(box('Anonymous confession',h('p',{class:'hint'},'Other members will not see your name. Moderators can see who sent it.'),t,row(btn('Post anonymously',async()=>{await POST(api(sid)+'/confessions',{text:t.value});t.value='';toast('Confession posted','ok')},'btn pri'))))
}
if(on('suggestions')){
const t=h('textarea',{class:'inp',rows:3,maxLength:1000,placeholder:'Your idea for the server','aria-label':'Suggestion'})
const list=h('div')
const load=async()=>{const x=await GET(api(sid)+'/suggestions');mount(list,x.items.slice(0,10).map(i=>suggestionRow(sid,i,x.can_review,load)))}
load().catch(e=>mount(list,e.message))
parts.push(box('Suggestions',t,row(btn('Send suggestion',async()=>{await POST(api(sid)+'/suggestions',{text:t.value});t.value='';toast('Suggestion sent','ok');load()},'btn pri')),list))
}
if(on('birthdays')){
const sec=h('div');parts.push(box('Birthdays',sec))
const load=async()=>{
const x=await GET(api(sid)+'/birthdays')
const mo=h('select',{class:'sel','aria-label':'Month'},['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((n,i)=>h('option',{value:i+1,selected:x.mine&&x.mine.m===i+1},n)))
const dy=h('input',{class:'inp',type:'number',min:'1',max:'31',value:x.mine?String(x.mine.d):'1',style:{width:'80px'},'aria-label':'Day'})
mount(sec,h('p',{class:'hint'},'Adding yours shows it to this server and gets you a shout-out on the day (UTC).'),row(mo,dy,btn('Save mine',async()=>{await PUT(api(sid)+'/me/birthday',{m:Number(mo.value),d:Number(dy.value)});toast('Birthday saved','ok');load()}),x.mine?btn('Remove mine',async()=>{await DEL(api(sid)+'/me/birthday');load()}):null),x.items.slice(0,30).map(i=>h('div',{class:'row sp',style:{padding:'2px 0'}},h('span',null,i.display_name),h('span',{class:'hint'},i.m+'/'+i.d))))
}
load().catch(e=>mount(sec,e.message))
}
mount(body,parts.length?parts:empty('No community tools are turned on in this server.'))
}

export const hasLabs=sid=>!!S.sdata[sid]?.server?.experimental
export const canManageLabs=sid=>can(sid,P.MANAGE_SERVER)
