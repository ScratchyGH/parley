import{h,icon,GET,toast,dialog,avatar}from'./util.js'
import{parIcon}from'./pars.js'
import{on}from'./state.js'
const M=new Map()
let RW=[]
export const streakOf=id=>M.get(id)
export function streakChip(userId){
const s=M.get(userId)
if(!s||!(s.count>0))return null
return h('span',{class:'stk'+(s.at_risk?' risk':''),role:'button',tabindex:'0',title:(s.at_risk?'Streak ends soon. Both of you need to message today. ':'')+s.count+' day streak. Click to see rewards',on:{click:e=>{e.stopPropagation();e.preventDefault();streakDialog(s)},keydown:e=>{if(e.key==='Enter'||e.key===' '){e.stopPropagation();e.preventDefault();streakDialog(s)}}}},icon('flame'),String(s.count))
}
const KL={badge:'Badge',frame:'Frame',nameplate:'Nameplate',title:'Title',namefx:'Name style',effect:'Effect'}
const chip=it=>{
const pv=it.kind==='badge'?h('span',{class:'bdg-i '+it.id}):it.kind==='frame'?h('span',{class:'sp-fm'},avatar({display_name:'A',frame:it.id},'sm')):it.kind==='nameplate'?h('b',{class:'np '+it.id+' sp-np'},'Name'):it.kind==='title'?h('span',{class:'ttl '+it.id}):it.kind==='namefx'?h('b',{class:'nf '+it.id},'Name'):null
return h('span',{class:'sp-b k-'+it.kind,title:KL[it.kind]+': '+it.name},pv,h('span',null,it.name),h('small',null,KL[it.kind]))
}
export function streakDialog(s){
const best=Math.max(s.best||0,s.count||0)
const list=RW.length?RW:[{n:1,pars:0,items:[{id:'bd_streaker',kind:'badge',name:'New Streaker'}]}]
const nextI=list.findIndex(r=>s.count<r.n)
const nodes=list.map((r,i)=>{
const got=best>=r.n,cur=i===nextI
const st=got?'done':cur?'next':''
return h('li',{class:'sp-n '+st},
h('span',{class:'sp-dot'},got?icon('check'):h('b',null,String(r.n))),
h('div',{class:'sp-card'},
h('div',{class:'sp-top'},h('b',null,'Day '+r.n),h('span',{class:'sp-tag'},got?'Unlocked':cur?(r.n-s.count)+' to go':'Locked')),
h('div',{class:'sp-rw'},
(r.items||[]).map(chip),
r.pars?h('span',{class:'sp-p'},parIcon(16),'+'+r.pars):null)))
})
const pct=nextI<0?100:Math.max(0,Math.min(100,Math.round(((nextI>0?s.count-list[nextI-1].n:s.count)/(list[nextI].n-(nextI>0?list[nextI-1].n:0)))*100)))
dialog('Streak rewards',h('div',{class:'bd sp'},
h('div',{class:'sp-head'},h('span',{class:'sp-fl'},icon('flame')),h('div',null,h('b',null,s.count+' day streak'),h('small',null,'Best '+best+(nextI>=0?' · next reward at day '+list[nextI].n:' · every reward unlocked'))),),
h('div',{class:'sp-bar'},h('i',{style:{width:pct+'%'}})),
h('ol',{class:'sp-pipe'},nodes),
h('p',{class:'hint'},'Rewards go to both of you. Message each other at least twice a day to keep it alive. Pars bonuses need accounts older than 3 days.')),{cls:'sp-dlg'})
}
export async function loadStreaks(){
try{
const d=await GET('/api/streaks')
M.clear()
if(Array.isArray(d.rewards))RW=d.rewards
for(const x of d.streaks)M.set(x.friend,x)
}catch{}
}
export function startStreaks(redraw){
const go=async()=>{await loadStreaks();redraw()}
setTimeout(go,2500)
setInterval(()=>{if(!document.hidden)go()},300000)
on('streak',m=>{
toast(m.count+' day streak unlocked'+(m.bonus?' (+'+m.bonus+' Pars)':''),'ok')
go()
})
on('streak.sync',go)
}
