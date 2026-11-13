import{h,icon,GET,toast,dialog,avatar}from'./util.js'
import{parIcon}from'./pars.js'
import{on,S}from'./state.js'
const M=new Map()
let RW=[]
export const streakOf=id=>M.get(id)
export function streakChip(userId){
const s=M.get(userId)
if(!s||!(s.count>0))return null
return h('span',{class:'stk'+(s.frozen?' frz':s.at_risk?' risk':''),role:'button',tabindex:'0',title:(s.frozen?'Frozen. A freeze will save it if you both message today. ':s.at_risk?'Streak ends soon. Both of you need to message today. ':'')+s.count+' day streak. Click to see rewards',on:{click:e=>{e.stopPropagation();e.preventDefault();streakDialog(s)},keydown:e=>{if(e.key==='Enter'||e.key===' '){e.stopPropagation();e.preventDefault();streakDialog(s)}}}},icon('flame'),String(s.count))
}
const KL={badge:'Badge',frame:'Frame',nameplate:'Nameplate',title:'Title',namefx:'Name style',effect:'Effect',bubble:'Message style'}
const me=()=>S.me||{display_name:'You'}
const nm=()=>me().display_name||me().username||'You'
function prev(it){
const u=me()
if(it.kind==='frame')return h('div',{class:'sp-pv av3'},avatar({...u,frame:it.id,effect:null},'lg'))
if(it.kind==='effect')return h('div',{class:'sp-pv av3'},avatar({...u,frame:null,effect:it.id},'lg'))
if(it.kind==='nameplate')return h('div',{class:'sp-pv'},h('b',{class:'np '+it.id,style:{padding:'3px 12px',fontSize:'14px'}},nm()))
if(it.kind==='namefx')return h('div',{class:'sp-pv'},h('b',{class:'nf '+it.id,style:{fontSize:'17px'}},nm()))
if(it.kind==='title')return h('div',{class:'sp-pv'},h('b',{style:{color:'var(--strong)'}},nm()),h('span',{class:'ttl '+it.id}))
if(it.kind==='badge')return h('div',{class:'sp-pv'},h('b',{style:{color:'var(--strong)'}},nm()),h('span',{class:'bdg-i sp-bg '+it.id}))
if(it.kind==='bubble')return h('div',{class:'sp-pv'},h('div',{class:'m '+it.id+' sp-m'},h('div',{class:'bd'},'Your messages look like this')))
return h('div',{class:'sp-pv'},it.name)
}
function tile(it,lock){
return h('div',{class:'sp-t'},prev(it),h('div',{class:'sp-tn'},h('b',null,it.name),h('small',null,KL[it.kind]||it.kind)))
}
export function streakDialog(s){
const best=Math.max(s.best||0,s.count||0)
const list=RW.length?RW:[{n:1,pars:0,items:[{id:'bd_streaker',kind:'badge',name:'New Streaker'}]}]
const nextI=list.findIndex(r=>s.count<r.n)
let nextEl=null
const cols=list.map((r,i)=>{
const got=best>=r.n,cur=i===nextI
const el=h('li',{class:'sp-c'+(got?' done':cur?' next':' lock')},
h('div',{class:'sp-rail'},h('span',{class:'sp-dot'},got?icon('check'):cur?icon('flame'):icon('lock')),h('i',{class:'sp-ln'})),
h('div',{class:'sp-card'},
h('div',{class:'sp-top'},h('b',null,'Day '+r.n),h('span',{class:'sp-tag'},got?'Unlocked':cur?(r.n-s.count)+' day'+(r.n-s.count===1?'':'s')+' to go':'Locked')),
(r.items||[]).map(it=>tile(it)),
r.pars?h('div',{class:'sp-pars'},parIcon(18),h('b',null,'+'+r.pars+' Pars')):null))
if(cur)nextEl=el
return el
})
const prior=nextI>0?list[nextI-1].n:0
const pct=nextI<0?100:Math.max(0,Math.min(100,Math.round(((s.count-prior)/(list[nextI].n-prior))*100)))
const pipe=h('ol',{class:'sp-pipe'},cols)
dialog('Streak rewards',h('div',{class:'bd sp'},
h('div',{class:'sp-head'},h('span',{class:'sp-fl'},icon('flame')),h('div',null,h('b',null,s.count+' day streak'),h('small',null,'Best '+best+(nextI>=0?' · next reward at day '+list[nextI].n:' · every reward unlocked'))),h('div',{class:'sp-pct'},pct+'%')),
h('div',{class:'sp-frz'+(s.frozen?' on':'')},icon('snow'),h('div',null,h('b',null,(s.freezes||0)+' streak freeze'+((s.freezes||0)===1?'':'s')),h('small',null,s.frozen?'Frozen. Message today to use a freeze and keep your streak.':'Miss a day and a freeze keeps it alive automatically. Earn one every 7 days, up to 2.'))),
h('div',{class:'sp-bar'},h('i',{style:{width:pct+'%'}})),
pipe,
h('p',{class:'hint'},'Rewards go to both of you and land in your Pars wardrobe. Message each other at least twice a day to keep the streak alive. Pars bonuses need accounts older than 3 days.')),{cls:'sp-dlg'})
setTimeout(()=>{try{if(nextEl)pipe.scrollTo({left:Math.max(0,nextEl.offsetLeft-24),behavior:'smooth'})}catch{}},120)
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
toast((m.froze?'Freeze used, streak saved. ':'')+m.count+' day streak unlocked'+(m.bonus?' (+'+m.bonus+' Pars)':''),'ok')
go()
})
on('streak.sync',go)
}
