import{h,mount,GET,POST,fail,toast,fmtRel}from'./util.js'

export const LABEL={approved:'Approved',needs_review:'Needs review',rejected:'Rejected',pending_human:'Waiting for human review',changes_requested:'Changes requested',unscreened:'Not screened',legacy:'Approved'}
export const screenPill=s=>s&&s.status&&s.status!=='unscreened'?h('span',{class:'bh-pill scr-'+s.status},LABEL[s.status]||s.status):null
const sev={bad:'Problem',warn:'Warning',info:'Note'}
const findings=r=>r&&r.findings&&r.findings.length?h('ul',{class:'scr-f'},r.findings.map(f=>h('li',{class:f.sev},h('b',null,sev[f.sev]||'Note'),' '+f.text))):h('div',{class:'hint'},'No issues found.')
export function screenPanel(p){
const box=h('div',null,h('div',{class:'hint'},'Loading'))
load()
async function load(){
try{
const d=await GET('/api/bothub/'+p.id+'/screening')
draw(d)
}catch(e){mount(box,h('div',{class:'err'},e.message))}
}
function draw(d){
const why={pending_human:'A person will review this bot before it can be listed. You will see the decision here.',approved:'This bot passed screening.',legacy:'This bot was listed before screening existed.',rejected:'This bot was rejected. Fix the issues below, then resubmit, or appeal if you think the decision is wrong.',needs_review:'Some things need attention before this bot can be listed. Fix them and resubmit.',changes_requested:'A reviewer asked for changes. Update the bot and resubmit.',unscreened:'Screening runs when you set the bot to Listed.'}[d.status]||''
const reason=h('textarea',{class:'inp',rows:3,maxLength:1500,placeholder:'Why should this be reconsidered?'})
const canFix=['rejected','needs_review','changes_requested','unscreened'].includes(d.status)
mount(box,
h('div',{class:'row',style:{gap:'10px',alignItems:'center'}},screenPill({status:d.status}),d.score!=null?h('span',{class:'hint',style:{margin:0}},'Quality score '+d.score+'/100, uncertainty '+d.uncertainty+'%'+(d.uncertainty>=25?' (25% or more goes to a person)':'')):null),
h('p',{class:'hint'},why+' Screening checks quality and spam only. It is separate from security scanning.'),
findings(d.report),
d.report&&d.report.ai?h('div',{class:'hint'},'Optional AI check ('+d.report.ai.provider+'): '+(d.report.ai.verdict==='unavailable'?'unavailable, skipped':d.report.ai.verdict)):null,
canFix?h('div',{class:'row',style:{gap:'8px',marginTop:'8px'}},h('button',{class:'btn',type:'button',on:{click:async e=>{e.target.disabled=true;try{const r=await POST('/api/bothub/'+p.id+'/screen',{});toast('Result: '+(LABEL[r.status]||r.status));load()}catch(x){fail(x);e.target.disabled=false}}}},'Run screening again')):null,
['rejected','needs_review','changes_requested'].includes(d.status)?h('div',{style:{marginTop:'8px'}},reason,h('button',{class:'btn',type:'button',style:{marginTop:'6px'},on:{click:async e=>{e.target.disabled=true;try{await POST('/api/bothub/'+p.id+'/appeal',{reason:reason.value});toast('Appeal sent to a reviewer','ok');load()}catch(x){fail(x);e.target.disabled=false}}}},'Appeal to a human reviewer')):null,
h('h4',null,'Review history'),
d.reviews.length?d.reviews.map(r=>h('div',{class:'scr-r'},h('b',null,(r.kind==='auto'?'Automatic':r.kind==='appeal'?'Your appeal':'Reviewer'+(r.actor?' '+r.actor:''))+': '+(LABEL[r.status]||r.status)),h('span',{class:'hint',style:{margin:'0 0 0 8px'}},fmtRel(r.created_at)),r.reason?h('div',null,r.reason):null)):h('div',{class:'hint'},'Nothing yet.'))
}
return box
}
export function screeningAdmin(){
const box=h('section',{class:'lab'},h('h3',null,'Bot screening queue'))
const list=h('div'),stSel=h('select',{class:'sel',on:{change:()=>load()}},[['pending_human','Waiting for human review'],['needs_review','Needs review'],['rejected','Rejected'],['changes_requested','Changes requested'],['approved','Approved']].map(([v,l])=>h('option',{value:v},l)))
box.append(stSel,list)
load()
async function load(){
mount(list,h('div',{class:'hint'},'Loading'))
try{
const d=await GET('/api/admin/screening?status='+stSel.value)
if(!d.projects.length){mount(list,h('div',{class:'hint'},'Nothing in this list.'));return}
mount(list,d.projects.map(p=>{
const why=h('input',{class:'inp',placeholder:'Reason (recorded in history)',maxLength:1000})
const act=(l,a,cls)=>h('button',{class:'btn sm '+(cls||''),on:{click:async()=>{try{await POST('/api/admin/screening/'+p.id,{action:a,reason:why.value});toast('Recorded','ok');load()}catch(e){fail(e)}}}},l)
return h('div',{class:'card',style:{margin:'8px 0'}},h('b',null,p.name),' by '+p.owner,h('div',{class:'hint'},p.summary),h('div',{class:'hint'},'Score '+p.screen_score+', uncertainty '+p.screen_uncertainty+'%'),findings(p.report),h('a',{href:'/bots/'+p.slug,target:'_blank',rel:'noopener'},'Open bot page'),h('div',{class:'row',style:{gap:'8px',marginTop:'6px',flexWrap:'wrap'}},why,act('Approve','approve','pri'),act('Request changes','changes'),act('Reject','reject','dng')))
}))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
return box
}
