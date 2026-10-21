import{h,mount,GET,POST,PUT,fail,toast,dialog,toggle,field,fmtDate}from'./util.js'
import{S,loadServer,loadServers}from'./state.js'
import{expLogo}from'./svg.js'

const asked=new Set()
async function act(sid,action){
await POST('/api/servers/'+sid+'/program',{action})
await Promise.all([loadServer(sid),loadServers()])
}
export async function checkOffer(sid){
const s=S.servers.find(x=>x.id===sid)
if(!s||s.owner_id!==S.me.id||asked.has(sid))return
asked.add(sid)
let p
try{p=await GET('/api/servers/'+sid+'/program')}catch{return}
if(!p.offer)return
const done=async a=>{
try{await act(sid,a);toast(a==='accept'?'Your server is now in the Experimental Servers Program':'Offer declined. You will not be asked again',a==='accept'?'ok':null);return true}
catch(e){fail(e);return false}
}
const d=dialog('Experimental Servers Program',h('div',{class:'bd exp-offer'},h('div',{class:'exp-logo'},expLogo(96)),h('h2',null,'Wanna Join The Experimental Servers Program?'),h('p',null,'Your server has been randomly selected to participate in the Experimental Servers Program! The program gives selected servers early access to experimental Community Apps and other features being tested before wider release. These features may change, have bugs, or be removed as testing continues.'),h('p',{class:'hint'},'You can turn the program on or off in server settings if you accept the offer.'),h('div',{class:'row',style:{justifyContent:'flex-end',gap:'8px'}},h('button',{class:'btn',on:{click:async()=>{if(await done('decline'))d.close()}}},'Decline Offer'),h('button',{class:'btn pri',on:{click:async()=>{if(await done('accept'))d.close()}}},'Accept Offer'))),{bare:true,sticky:true})
}
export const expTag=sid=>S.sdata[sid]?.server?.experimental?h('span',{class:'exp-tag',title:'This server is in the Experimental Servers Program'},'Experimental'):null
export async function programPage(pg,sid){
mount(pg,h('h2',null,'Experimental Servers Program'),h('div',{class:'hint'},'Loading'))
let p
try{p=await GET('/api/servers/'+sid+'/program')}catch(e){mount(pg,h('div',{class:'hint'},e.message));return}
const draw=async()=>programPage(pg,sid)
const head=h('h2',null,'Experimental Servers Program')
if(!p.state){mount(pg,head,h('p',{class:'hint'},'Your server has not been selected. If it is, the owner sees an invitation the next time they open the server. Nothing is enrolled automatically.'));return}
if(p.state==='offered'){mount(pg,head,h('p',null,'You have a pending invitation. Open the server to answer it.'));return}
if(p.state==='declined'){mount(pg,head,h('p',{class:'hint'},'You declined the invitation, so this server will not be asked again.'));return}
const kids=[head,h('p',{class:'hint'},'While this is on, members see an Experimental tag on the server and you can use features that are still being tested. Turning it off removes the tag and those features. Your server data stays as it is.'),
h('div',{class:'row sp',style:{padding:'8px 0'}},h('span',null,'Take part in the program'),toggle(p.on&&!p.blocked,async v=>{try{await act(sid,v?'enable':'disable');draw()}catch(e){fail(e);draw()}},'Take part in the program'))]
if(p.blocked)kids.push(h('p',{class:'hint'},'An administrator has paused this server in the program.'))
if(p.paused)kids.push(h('p',{class:'hint'},'The program is paused for everyone right now. Experimental features are off until it resumes.'))
if(p.active){
const ins=h('div',{class:'hint'},'Loading insights')
kids.push(h('h3',null,'Server insights'),ins)
GET('/api/servers/'+sid+'/insights').then(r=>{
mount(ins,h('div',null,h('div',null,r.members+' members, '+r.joined_7d+' joined in the last 7 days'),h('div',{style:{marginTop:'6px'}},r.days.length?r.days.map(x=>h('div',{class:'row sp',style:{padding:'2px 0'}},h('span',null,x.d),h('span',null,x.n+' messages from '+x.a+' people'))):'No messages in the last 7 days.'),r.top_channels.length?h('div',{style:{marginTop:'6px'}},'Busiest channels: '+r.top_channels.map(x=>'#'+x.name+' ('+x.n+')').join(', ')):null))
}).catch(e=>mount(ins,e.message))
const fb=h('textarea',{class:'inp',rows:3,maxLength:1500,placeholder:'What worked, what broke?'})
kids.push(h('h3',null,'Send feedback'),field('Feedback for the Parley team',fb),h('button',{class:'btn',style:{marginTop:'8px'},on:{click:async e=>{e.target.disabled=true;try{await POST('/api/servers/'+sid+'/program/feedback',{text:fb.value});fb.value='';toast('Feedback sent','ok')}catch(x){fail(x)}finally{e.target.disabled=false}}}},'Send feedback'))
}
mount(pg,...kids)
}
const adminAct=(sid,action)=>POST('/api/admin/program/servers/'+sid,{action})
export async function programAdmin(){
const d=await GET('/api/admin/program')
const pct=h('input',{class:'inp',type:'number',min:'0',max:'100',value:String(d.cfg.pct),style:{width:'90px'}})
const pause=h('input',{type:'checkbox',checked:d.cfg.paused})
const save=h('button',{class:'btn',on:{click:async()=>{try{await PUT('/api/admin/program/config',{pct:Number(pct.value),paused:pause.checked});toast('Saved','ok')}catch(e){fail(e)}}}},'Save')
const sid=h('input',{class:'inp',placeholder:'Server id (sv_...)',style:{width:'260px'}})
const btn=(l,a)=>h('button',{class:'btn sm',on:{click:async()=>{try{await adminAct(sid.value.trim(),a);toast('Done','ok')}catch(e){fail(e)}}}},l)
return h('section',{class:'lab'},h('h3',null,'Experimental Servers Program'),h('p',{class:'hint'},d.enrolled+' enrolled, '+d.pending+' invitations pending, '+d.declined+' declined, '+d.blocked+' blocked.'),h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},h('span',null,'Share of servers invited'),pct,'%',h('label',null,pause,' Emergency pause'),save),h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap',marginTop:'8px'}},sid,btn('Send invitation','offer'),btn('Block','block'),btn('Unblock','unblock'),btn('Remove from program','remove')),h('h4',null,'Recent feedback'),d.feedback.length?d.feedback.map(f=>h('div',{style:{padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('b',null,f.server_name),' '+fmtDate(f.created_at),h('div',null,f.text))):h('div',{class:'hint'},'None yet.'))
}
