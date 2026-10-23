import{h,mount,GET,POST,fail,toast}from'./util.js'
const LBL={violation:'Likely violation',no_violation:'Likely fine',unclear:'Needs a human'}
const COL={violation:'#ef4444',no_violation:'#22c55e',unclear:'#a3a3a3'}
const CAT=c=>c&&c!=='none'?c.replace('_',' '):''
export function aiBadge(x){
if(!x||!x.ai_verdict)return null
const col=COL[x.ai_verdict]||COL.unclear
const sev=x.ai_severity>=3?' · severe':x.ai_severity===2?' · clear':''
return h('div',{style:{margin:'4px 0',padding:'6px 8px',borderRadius:'10px',background:'rgba(127,127,127,.1)',borderLeft:'3px solid '+col}},
h('div',{style:{fontWeight:'700',color:col}},'AI: '+(LBL[x.ai_verdict]||'Needs a human')+(CAT(x.ai_category)?' · '+CAT(x.ai_category):'')+sev+' · '+x.ai_conf+'%'),
x.ai_note?h('small',null,x.ai_note):null)
}
export async function modaiPanel(onChange){
const box=h('div',{class:'card',style:{margin:'8px 0',padding:'10px 12px'}})
try{
const d=await GET('/api/admin/modai')
const sel=h('select',{class:'sel',on:{change:async()=>{try{await POST('/api/admin/modai',{mode:sel.value});toast('AI moderation set to '+sel.value,'ok');if(onChange)onChange()}catch(e){fail(e)}}}},
h('option',{value:'off'},'Off'),h('option',{value:'suggest'},'Suggest only'),h('option',{value:'auto'},'Suggest and act on certain cases'))
sel.value=d.mode
mount(box,h('b',null,'AI report moderation'),
h('p',{class:'hint'},d.available?'Every new report is read in context by two AI models. Suggest only labels and sorts the queue. The third mode also removes messages when both models agree with very high confidence and closes reports that are clearly fine. It never acts on admins, server owners, users or servers.':'The AI binding is not available on this deployment.'),
sel,h('small',null,`Last 30 days: ${d.last30.analyzed} analyzed, ${d.last30.removed} removed, ${d.last30.dismissed} dismissed`))
}catch(e){mount(box,h('div',{class:'err'},e.message))}
return box
}
export function handledList(rows){
if(!rows||!rows.length)return null
return h('div',null,h('h3',null,'Handled by AI'),h('div',{class:'list'},rows.map(r=>h('div',{class:'li',style:{alignItems:'flex-start'}},h('div',{class:'grow'},h('b',null,(r.ai_action==='auto_removed'?'Removed ':'Dismissed ')+r.target_type+(CAT(r.ai_category)?' · '+CAT(r.ai_category):'')+' · '+r.ai_conf+'%'),h('div',null,r.ai_note||''),h('small',null,r.target_id))))))
}
