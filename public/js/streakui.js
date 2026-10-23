import{h,icon,GET,toast}from'./util.js'
import{on}from'./state.js'
const M=new Map()
export const streakOf=id=>M.get(id)
export function streakChip(userId){
const s=M.get(userId)
if(!s||!(s.count>0))return null
return h('span',{class:'stk'+(s.at_risk?' risk':''),title:s.at_risk?'Streak ends soon. Both of you need to message today.':s.count+' day streak'},icon('flame'),String(s.count))
}
export async function loadStreaks(){
try{
const d=await GET('/api/streaks')
M.clear()
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
