import{h,mount,GET,POST,fail,dialog,confirmBox,toggle,fmtStamp,fmtSize,debounce}from'./util.js'
import{S}from'./state.js'

export function openAdmin(){
const tabs=[['stats','Overview'],['users','Users'],['reports','Reports'],['appeals','Account appeals'],['log','Audit log']]
let cur='stats'
const nav=h('nav',{'aria-label':'Admin sections'})
const pg=h('div',{class:'pg'})
dialog('Admin panel',h('div',{class:'split'},nav,pg),{cls:'wide'})
function draw(){
mount(nav,tabs.map(([k,l])=>h('button',{class:cur===k?'on':'',on:{click:()=>{cur=k;draw()}}},l)))
mount(pg)
const fn={stats,users,reports,appeals,log}[cur]
fn(pg)
}
draw()
}

async function stats(pg){
mount(pg,h('h3',null,'Overview'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/admin/stats')
const cell=(l,v)=>h('div',{class:'card'},h('div',{class:'hint',style:{margin:0}},l),h('div',{style:{fontSize:'22px',color:'var(--strong)'}},String(v)))
mount(pg,h('h3',null,'Overview'),
h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'8px'}},cell('Users',d.users),cell('Servers',d.servers),cell('Messages',d.messages),cell('Files',d.files),cell('Stored',fmtSize(d.storage_bytes)),cell('Active sessions',d.sessions),cell('Open reports',d.open_reports),cell('Open appeals',d.open_appeals)),
h('div',{class:'perm',style:{marginTop:'16px'}},toggle(d.maintenance,async v=>{try{await POST('/api/admin/maintenance',{on:v})}catch(e){fail(e)}},'Maintenance mode'),h('div',null,h('div',{style:{color:'var(--strong)'}},'Maintenance mode'),h('div',{class:'hint',style:{margin:0}},'Blocks writes for everyone except admins.'))),
h('p',{class:'hint'},d.note))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}

function users(pg){
const q=h('input',{class:'inp',type:'search',placeholder:'Search usernames (2+ characters)','aria-label':'Search users'})
const list=h('div',{class:'list'})
const run=async()=>{
if(q.value.trim().length<2){mount(list);return}
try{
const d=await GET('/api/admin/users?q='+encodeURIComponent(q.value.trim()))
mount(list,d.users.map(u=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,u.display_name+' (@'+u.username+')'),h('small',null,'Joined '+fmtStamp(u.created_at)+(u.suspended?' · suspended':'')+(u.deleted_at?' · deleted':''))),
u.deleted_at||u.id===S.me.id?null:h('button',{class:'btn sm'+(u.suspended?'':' dng'),on:{click:async()=>{
if(!u.suspended&&!await confirmBox('Suspend @'+u.username,'They will be signed out and unable to log in.','Suspend',true))return
try{await POST(`/api/admin/users/${u.id}/suspend`,{suspended:!u.suspended,reason:'admin action'});run()}catch(e){fail(e)}
}}},u.suspended?'Unsuspend':'Suspend'))))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
q.oninput=debounce(run,300)
mount(pg,h('h3',null,'Users'),q,list)
}

async function reports(pg){
mount(pg,h('h3',null,'Reports'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/admin/reports')
mount(pg,h('h3',null,'Open reports'),h('div',{class:'list'},d.reports.length?d.reports.map(r=>h('div',{class:'li',style:{alignItems:'flex-start'}},h('div',{class:'grow'},h('b',null,`${r.target_type} · reported by @${r.reporter}`),h('div',null,r.reason),h('small',null,`${r.target_id}${r.server_id?' in '+r.server_id:''} · ${fmtStamp(r.created_at)}`)),h('button',{class:'btn sm',on:{click:async()=>{try{await POST('/api/admin/reports/'+r.id,{});reports(pg)}catch(e){fail(e)}}}},'Resolve'))):h('div',{class:'hint'},'No open reports')))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}
async function appeals(pg){
mount(pg,h('h3',null,'Account appeals'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/admin/appeals')
mount(pg,h('h3',null,'Account appeals'),h('div',{class:'list'},d.appeals.length?d.appeals.map(a=>h('div',{class:'li',style:{alignItems:'flex-start'}},h('div',{class:'grow'},h('b',null,'@'+a.username),h('div',null,a.message),h('small',null,fmtStamp(a.created_at))),
h('button',{class:'btn sm',on:{click:async()=>{try{await POST('/api/admin/appeals/'+a.id,{accept:true});appeals(pg)}catch(e){fail(e)}}}},'Accept'),
h('button',{class:'btn sm dng',on:{click:async()=>{try{await POST('/api/admin/appeals/'+a.id,{accept:false});appeals(pg)}catch(e){fail(e)}}}},'Deny'))):h('div',{class:'hint'},'No open appeals')))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}
async function log(pg){
mount(pg,h('h3',null,'Audit log'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/admin/log')
mount(pg,h('h3',null,'Admin audit log'),h('table',{class:'t'},h('thead',null,h('tr',null,h('th',null,'When'),h('th',null,'Actor'),h('th',null,'Action'),h('th',null,'Detail'))),h('tbody',null,d.entries.map(e=>h('tr',null,h('td',null,fmtStamp(e.created_at)),h('td',null,'@'+e.actor),h('td',null,e.action),h('td',null,(e.detail||e.target_id||'').slice(0,80)))))))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}
