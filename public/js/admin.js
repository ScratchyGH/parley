import{h,mount,icon,api,GET,POST,fail,dialog,confirmBox,toggle,fmtStamp,fmtSize,debounce,field,toast}from'./util.js'
import{S}from'./state.js'
import{guiPreview}from'./guipreview.js'
import{studio}from'./studio.js'
import{parsAdmin,seasonAdmin}from'./pars.js'
import{programAdmin}from'./exp.js'
import{screeningAdmin}from'./screenui.js'

export function adminView(pg){
let cur='stats'
const tabs=[['stats','Overview'],['gui','GUI preview'],['users','Users'],['reports','Reports'],['appeals','Appeals'],['log','Audit log'],['studio','Server studio'],['pars','Pars'],['seasons','Seasonal bundles'],['program','Experimental program'],['screening','Bot screening'],...(S.me.owner?[['backups','Backups'],['db','Database']]:[])]
const nav=h('div',{class:'tabs',role:'tablist',style:{marginBottom:'14px',flexWrap:'wrap'}})
const body=h('div')
function draw(){
mount(nav,tabs.map(([k,l])=>h('button',{type:'button',role:'tab','aria-selected':String(cur===k),class:cur===k?'on':'',on:{click:()=>{cur=k;draw()}}},l)))
mount(body)
const fn={backups,stats,gui:b=>b.append(guiPreview()),users,reports,appeals,log,db,studio,seasons:async b=>{try{b.append(await seasonAdmin())}catch(e){mount(b,h('div',{class:'err'},e.message))}},pars:async b=>{try{b.append(await parsAdmin())}catch(e){mount(b,h('div',{class:'err'},e.message))}},program:async b=>{try{b.append(await programAdmin())}catch(e){mount(b,h('div',{class:'err'},e.message))}},screening:b=>b.append(screeningAdmin())}[cur]
fn(body)
}
mount(pg,h('h3',null,'Admin'),nav,body)
draw()
}

function healthBox(){
const box=h('div',{style:{marginTop:'16px'}},h('h4',null,'Health'),h('div',{class:'hint'},'Checking…'))
GET('/api/admin/health').then(d=>{
const row=(l,ok,txt)=>h('div',{class:'li'},h('span',{style:{color:ok?'var(--ok)':'var(--err,#e5534b)',width:'18px'}},ok?'●':'●'),h('div',{class:'grow'},h('b',null,l),h('small',null,txt)))
mount(box,h('h4',null,'Health'),h('div',{class:'list'},
row('Database',d.db==='ok','Answering queries'),
row('Scheduler',d.cron.ok,d.cron.last?'Last ran '+fmtStamp(d.cron.last):'Has not run yet. Check that the cron trigger is deployed.'),
row('Nightly cleanup',d.sweep.ok,d.sweep.last?'Last ran '+fmtStamp(d.sweep.last):'Has not run yet'),
row('Scheduled messages',!d.scheduled_overdue,d.scheduled_pending+' waiting'+(d.scheduled_overdue?'. Some are overdue.':'')),
row('Browser errors',d.client_errors_1h<20,d.client_errors_1h+' in the last hour, '+d.client_errors_24h+' in 24 hours'),
row('Event webhooks',!d.event_webhooks_disabled,d.event_webhooks+' configured'+(d.event_webhooks_disabled?', '+d.event_webhooks_disabled+' paused':''))),
h('p',{class:'hint'},d.backups))
}).catch(e=>mount(box,h('h4',null,'Health'),h('div',{class:'err'},e.message)))
return box
}
async function stats(pg){
mount(pg,h('h3',null,'Overview'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/admin/stats')
const cell=(l,v)=>h('div',{class:'card'},h('div',{class:'hint',style:{margin:0}},l),h('div',{style:{fontSize:'22px',color:'var(--strong)'}},String(v)))
mount(pg,h('h3',null,'Overview'),
h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'8px'}},cell('Users',d.users),cell('Servers',d.servers),cell('Messages',d.messages),cell('Files',d.files),cell('Stored',fmtSize(d.storage_bytes)),cell('Active sessions',d.sessions),cell('Open reports',d.open_reports),cell('Open appeals',d.open_appeals)),
h('div',{class:'perm',style:{marginTop:'16px'}},toggle(d.maintenance,async v=>{try{await POST('/api/admin/maintenance',{on:v})}catch(e){fail(e)}},'Maintenance mode'),h('div',null,h('div',{style:{color:'var(--strong)'}},'Maintenance mode'),h('div',{class:'hint',style:{margin:0}},'Blocks writes for everyone except admins.'))),
h('p',{class:'hint'},d.note),healthBox())
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}

function users(pg){
const q=h('input',{class:'inp',type:'search',placeholder:'Search usernames (2+ characters)','aria-label':'Search users'})
const list=h('div',{class:'list'})
const run=async()=>{
if(q.value.trim().length<2){mount(list);return}
try{
const d=await GET('/api/admin/users?q='+encodeURIComponent(q.value.trim()))
mount(list,d.users.map(u=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,u.display_name+' (@'+u.username+')'),h('small',null,'Joined '+fmtStamp(u.created_at)+(u.suspended?' · suspended'+(u.suspended_until?' until '+fmtStamp(u.suspended_until):' (permanent)'):'')+(u.deleted_at?' · deleted':''))),
u.deleted_at?null:h('button',{class:'btn sm'+(u.labs?' pri':''),title:'Give or take away the Experimental tab',on:{click:async()=>{try{await POST(`/api/admin/users/${u.id}/labs`,{on:!u.labs});u.labs=u.labs?0:1;run()}catch(e){fail(e)}}}},u.labs?'Experimental on':'Experimental off'),
u.deleted_at||u.id===S.me.id?null:h('button',{class:'btn sm'+(u.suspended?'':' dng'),on:{click:async()=>{
if(!u.suspended){suspendDialog(u,run);return}
try{await POST(`/api/admin/users/${u.id}/suspend`,{suspended:false,reason:'admin action'});run()}catch(e){fail(e)}
}}},u.suspended?'Unsuspend':'Suspend'))))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
q.oninput=debounce(run,300)
mount(pg,h('h3',null,'Users'),q,list)
}

const DURS=[['1','1 hour'],['24','1 day'],['168','7 days'],['720','30 days'],['0','Permanent']]
export function suspendDialog(u,done){
const dur=h('select',{class:'sel'},DURS.map(([v,l])=>h('option',{value:v,selected:v==='24'},l)))
const why=h('input',{class:'inp',maxLength:300,placeholder:'Reason (recorded in the audit log)'})
const dev=h('input',{type:'checkbox'})
dialog('Suspend @'+u.username,h('div',null,
h('p',{class:'hint'},'They are signed out now and cannot sign in until the suspension ends or an administrator lifts it.'),
field('Length',dur),field('Reason',why),
h('label',{class:'perm'},dev,h('span',null,'Also ban the devices they have used. Best effort only: it blocks this browser profile, not the hardware.'))),
{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),h('button',{class:'btn dng',on:{click:async()=>{
if(!why.value.trim()){toast('Add a reason first','err');return}
try{await POST(`/api/admin/users/${u.id}/suspend`,{suspended:true,reason:why.value.trim(),hours:+dur.value,device:dev.checked});close();toast('Suspended','ok');done?.()}catch(e){fail(e)}
}}},'Suspend')]})
}

async function contentReports(){
const box=h('div')
try{
const d=await GET('/api/admin/content-reports')
const bh=await GET('/api/admin/blocked-hashes')
const hv=h('input',{class:'inp',placeholder:'SHA-256 to block (64 hex characters)',maxLength:64})
mount(box,h('h3',null,'Illegal content reports'),h('p',{class:'hint'},'Acting removes the message and attachments, blocks the file hashes from being uploaded again, and can suspend the author with a device ban. Parley does not file reports with authorities for you: for child sexual abuse material, report it to the NCMEC CyberTipline (US) or your local hotline yourself.'),
h('div',{class:'list'},d.reports.length?d.reports.map(r=>{
const note=h('input',{class:'inp',placeholder:'Note for the record',maxLength:300})
const sus=h('input',{type:'checkbox',checked:r.category==='csam'})
const go=async a=>{try{await POST('/api/admin/content-reports/'+r.id,{action:a,note:note.value,suspend:sus.checked});contentReports().then(n=>mount(box,...n.childNodes))}catch(e){fail(e)}}
return h('div',{class:'li',style:{alignItems:'flex-start',flexDirection:'column',gap:'6px'}},h('b',null,(r.category==='csam'?'Child safety':r.category==='threat'?'Threat':'Illegal content')+' · '+r.target_type+' · by @'+r.reporter),r.excerpt?h('div',{class:'hint',style:{margin:0}},'Text: '+r.excerpt):null,h('div',null,r.details),h('small',null,r.target_id+' · '+fmtStamp(r.created_at)),note,h('label',{class:'perm'},sus,h('span',null,'Suspend the author and ban their devices')),h('div',{class:'row',style:{gap:'8px'}},h('button',{class:'btn sm dng',on:{click:()=>go('act')}},'Remove and act'),h('button',{class:'btn sm',on:{click:()=>go('dismiss')}},'Dismiss')))
}):h('div',{class:'hint'},'No open reports')),
h('h4',null,'Blocked file hashes ('+bh.hashes.length+')'),h('div',{class:'row',style:{gap:'8px'}},hv,h('button',{class:'btn sm',on:{click:async()=>{try{await POST('/api/admin/blocked-hashes',{hash:hv.value,reason:'manual'});toast('Added','ok');hv.value=''}catch(e){fail(e)}}}},'Block')),
h('p',{class:'hint'},'Uploads are checked against this list when the upload carries a SHA-256 checksum or storage returns one. This is an exact-match list, not image matching.'))
}catch(e){mount(box,h('div',{class:'err'},e.message))}
return box
}
async function reports(pg){
mount(pg,h('h3',null,'Reports'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/admin/reports')
mount(pg,await contentReports(),h('h3',null,'Open reports'),h('div',{class:'list'},d.reports.length?d.reports.map(r=>h('div',{class:'li',style:{alignItems:'flex-start'}},h('div',{class:'grow'},h('b',null,`${r.target_type} · reported by @${r.reporter}`),h('div',null,r.reason),h('small',null,`${r.target_id}${r.server_id?' in '+r.server_id:''} · ${fmtStamp(r.created_at)}`)),h('button',{class:'btn sm',on:{click:async()=>{try{await POST('/api/admin/reports/'+r.id,{});reports(pg)}catch(e){fail(e)}}}},'Resolve'),(()=>{const uid=r.target_type==='user'?r.target_id:r.msg_author;return uid&&uid!==S.me.id?h('button',{class:'btn sm dng',on:{click:()=>suspendDialog({id:uid,username:r.target_type==='user'?'user':'message author'},()=>reports(pg))}},'Suspend…'):null})())):h('div',{class:'hint'},'No open reports')))
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}
async function appeals(pg){
mount(pg,h('h3',null,'Account appeals'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/admin/appeals')
mount(pg,h('h3',null,'Account appeals'),h('div',{class:'list'},d.appeals.length?d.appeals.map(a=>h('div',{class:'li',style:{alignItems:'flex-start'}},h('div',{class:'grow'},h('b',null,'@'+a.username),h('div',null,a.message),a.evidence?h('div',null,(()=>{try{return JSON.parse(a.evidence)}catch{return[]}})().map(l=>h('a',{href:l,target:'_blank',rel:'noopener noreferrer',style:{display:'block'}},l))):null,h('small',null,fmtStamp(a.created_at))),
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

const clip=v=>v===null?'NULL':String(v).length>70?String(v).slice(0,70)+'…':String(v)

function db(pg){
const st={table:'',offset:0,q:'',cols:[],rows:[],more:false}
const list=h('div',{class:'dbtabs'})
const grid=h('div',{class:'dbgrid'})
const bar=h('div',{class:'row',style:{marginBottom:'8px',flexWrap:'wrap'}})
const q=h('input',{class:'inp',type:'search',placeholder:'Search this table',maxLength:80,'aria-label':'Search this table',style:{maxWidth:'260px'}})
const sqlBox=h('div',{hidden:true})
const pager=h('div',{class:'row',style:{justifyContent:'space-between',marginTop:'8px'}})
let gen=0
async function tables(){
try{
const d=await GET('/api/admin/db/tables')
mount(list,d.tables.map(t=>h('button',{type:'button',class:'btn sm'+(st.table===t.name?' pri':''),on:{click:()=>{st.table=t.name;st.offset=0;st.q='';q.value='';tables();load()}}},t.name+' ',h('small',null,String(t.rows)))))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
async function load(){
if(!st.table){mount(grid,h('div',{class:'hint'},'Pick a table.'));return}
const my=++gen
try{
const d=await GET(`/api/admin/db/rows?table=${encodeURIComponent(st.table)}&offset=${st.offset}&limit=50&q=${encodeURIComponent(st.q)}`)
if(my!==gen)return
st.cols=d.columns;st.rows=d.rows;st.more=d.more
draw()
}catch(e){mount(grid,h('div',{class:'err'},e.message))}
}
function cell(r,c){
const v=r.values[c.name]
const td=h('td',{class:c.secret?'sec':'',title:c.secret?'Secret columns are hidden and cannot be edited':'Select to edit'},clip(v))
if(c.secret)return td
td.addEventListener('click',()=>{
if(td.querySelector('input'))return
const inp=h('input',{class:'inp',value:v===null?'':String(v),'aria-label':'Edit '+c.name})
const nul=h('button',{class:'btn sm',type:'button',on:{click:()=>save(null)}},'NULL')
const save=async nv=>{
let out=nv
if(out!==null&&typeof v==='number'&&out.trim()!==''&&!Number.isNaN(Number(out)))out=Number(out)
try{await POST('/api/admin/db/update',{table:st.table,key:r.key,set:{[c.name]:out}});toast('Saved','ok');load()}catch(e){fail(e);load()}
}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')save(inp.value);if(e.key==='Escape')draw()})
mount(td,inp,nul)
inp.focus()
})
return td
}
function draw(){
if(!st.cols.length){mount(grid);return}
mount(grid,h('table',{class:'t dbt'},h('thead',null,h('tr',null,st.cols.map(c=>h('th',null,c.name+(c.pk?' •':''))),h('th',null))),
h('tbody',null,st.rows.map(r=>h('tr',null,st.cols.map(c=>cell(r,c)),h('td',null,h('button',{class:'btn sm dng',type:'button','aria-label':'Delete row',on:{click:async()=>{
if(!await confirmBox('Delete this row?',st.table+' '+JSON.stringify(r.key),'Delete',true))return
try{await POST('/api/admin/db/delete',{table:st.table,key:r.key,confirm:true});toast('Row deleted','ok');tables();load()}catch(e){fail(e)}
}}},'×')))))))
mount(pager,h('button',{class:'btn sm',disabled:st.offset===0,on:{click:()=>{st.offset=Math.max(0,st.offset-50);load()}}},'Previous'),h('small',{class:'hint',style:{margin:0}},st.rows.length?`Rows ${st.offset+1} to ${st.offset+st.rows.length}`:'No rows'),h('button',{class:'btn sm',disabled:!st.more,on:{click:()=>{st.offset+=50;load()}}},'Next'))
}
function addRow(){
if(!st.table)return
const ins=st.cols.filter(c=>!c.secret).map(c=>({c,i:h('input',{class:'inp','aria-label':c.name,placeholder:c.type||'value'})}))
const d=dialog('Add a row to '+st.table,h('div',{class:'bd'},h('p',{class:'hint',style:{marginTop:0}},'Leave a box empty to use the column default.'),ins.map(x=>field(x.c.name,x.i))),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),h('button',{class:'btn pri',on:{click:async()=>{
const values={}
for(const x of ins)if(x.i.value!=='')values[x.c.name]=/int|real|num/i.test(x.c.type)&&!Number.isNaN(Number(x.i.value))?Number(x.i.value):x.i.value
try{await POST('/api/admin/db/insert',{table:st.table,values});close();toast('Row added','ok');tables();load()}catch(e){fail(e)}
}}},'Add row')]})
return d
}
function sql(){
sqlBox.hidden=!sqlBox.hidden
if(!sqlBox.hidden&&!sqlBox.firstChild){
const ta=h('textarea',{class:'inp',rows:4,spellcheck:false,placeholder:'select * from users limit 10','aria-label':'SQL statement',style:{fontFamily:'var(--mono)'}})
const chk=h('input',{type:'checkbox',id:'sqlok'})
const out=h('div')
const run=h('button',{class:'btn pri',type:'button',on:{click:async()=>{
try{
const d=await POST('/api/admin/db/sql',{sql:ta.value,confirm:chk.checked})
if(d.columns)mount(out,h('div',{class:'dbgrid'},h('table',{class:'t dbt'},h('thead',null,h('tr',null,d.columns.map(c=>h('th',null,c)))),h('tbody',null,d.rows.map(r=>h('tr',null,d.columns.map(c=>h('td',null,clip(r[c])))))))),d.truncated?h('div',{class:'hint'},'Showing the first 200 rows.'):null)
else{mount(out,h('div',{class:'hint'},d.changes+' row(s) changed'));tables();load()}
}catch(e){mount(out,h('div',{class:'err'},e.message))}
}}},icon('check','s'),'Run')
mount(sqlBox,h('p',{class:'hint'},'One select, insert, update or delete at a time. Changes need the box ticked and are written to the audit log. Secret columns and schema changes are refused.'),ta,h('div',{class:'row',style:{margin:'8px 0'}},h('input',{type:'checkbox',id:'sqlok2',hidden:true}),h('label',{style:{display:'flex',gap:'6px',alignItems:'center'}},chk,'This statement changes data'),run),out)
}
}
q.addEventListener('input',debounce(()=>{st.q=q.value.trim();st.offset=0;load()},300))
mount(bar,q,h('button',{class:'btn sm',type:'button',on:{click:()=>{tables();load()}}},icon('refresh','s'),'Refresh'),h('button',{class:'btn sm',type:'button',on:{click:addRow}},icon('plus','s'),'Add row'),h('button',{class:'btn sm',type:'button',on:{click:sql}},icon('code','s'),'SQL'))
mount(pg,h('h3',null,'Database'),h('p',{class:'hint'},'Direct access to the live database. Edits apply immediately and are written to the audit log. Select a cell to change it.'),list,bar,sqlBox,grid,pager)
tables()
load()
}

function backups(pg){
const list=h('div',{class:'list'})
async function load(){
try{
const r=await GET('/api/admin/backups')
mount(list,r.backups.length?r.backups.map(b=>h('div',{class:'li'},
h('div',{class:'grow'},h('b',null,fmtStamp(b.created_at)),h('small',null,fmtSize(b.size))),
h('a',{class:'btn sm',href:'/api/admin/backups/'+b.name,download:'parley-backup-'+b.name},'Download'),
h('button',{class:'btn sm',on:{click:async()=>{
if(!await confirmBox('Restore from this backup','Rows that were deleted since this backup are added back. Rows that exist now are not changed. Nothing is removed.','Restore',true))return
try{const x=await POST('/api/admin/backups/'+b.name+'/restore',{confirm:true});toast(x.added+' rows restored','ok')}catch(e){fail(e)}
}}},'Restore'),
h('button',{class:'btn sm dng',on:{click:async()=>{
if(!await confirmBox('Delete backup','This backup file is removed permanently.','Delete',true))return
try{await api('DELETE','/api/admin/backups/'+b.name);load()}catch(e){fail(e)}
}}},'Delete'))):h('div',{class:'empty'},'No backups yet'))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
const btn=h('button',{class:'btn pri',on:{click:async()=>{
btn.disabled=true
try{await POST('/api/admin/backups',{});toast('Backup created','ok');load()}catch(e){fail(e)}
btn.disabled=false
}}},'Back up now')
mount(pg,h('h3',null,'Backups'),h('p',{class:'hint'},'Parley saves a full copy of the database to storage once a day and keeps the last 7. Backups include account password hashes, so keep downloaded files private. Sessions, uploaded file contents and sign-in attempts are not included.'),h('div',{class:'row'},btn),list)
load()
}
