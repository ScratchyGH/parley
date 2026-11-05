import{h,POST,toast}from'./util.js'
export const TK_GAMES=[
['dash','Turkey Dash','Sprint through the thicket, leap logs and snag pies.',()=>import('./tk_dash.js')],
['stack','Pie Stack','Stack the pies into a towering feast.',()=>import('./tk_stack.js')],
['match','Harvest Match','Flip and match the harvest table.',()=>import('./tk_match.js')],
['catch','Cornucopia Catch','Catch the falling harvest, dodge the rotten.',()=>import('./tk_catch.js')],
['forage','Thicket Survivors','Hold the clearing against the fox pack.',()=>import('./tk_forage.js')]
]
export function openTk(id){
if(!document.getElementById('fallcss'))document.head.append(h('link',{id:'fallcss',rel:'stylesheet',href:'/thicket.css'}))
const g=TK_GAMES.find(x=>x[0]===id)
if(!g)return
const host=h('div',{class:'tk-host'})
const x=h('button',{class:'btn sm tk-close',type:'button'},'Close')
const root=h('div',{class:'tk-over',role:'dialog','aria-modal':'true','aria-label':g[1]},host,x)
document.body.append(root)
let stop=null,gone=false
const close=()=>{if(gone)return;gone=true;try{stop&&stop()}catch{}root.remove();removeEventListener('keydown',esc)}
const esc=e=>{if(e.key==='Escape')close()}
addEventListener('keydown',esc)
x.addEventListener('click',close)
const api={
close,
reduced:()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm'),
lite:()=>document.documentElement.classList.contains('perf'),
async finish(score,secs){
try{const d=await POST('/api/games/turkey/finish',{game:id,score:Math.floor(score),secs:Math.floor(secs)});if(d.pars>0)toast('+'+d.pars+' Pars','ok');return d}catch(e){toast(e.message||'Could not save the score','err');return{pars:0}}
}
}
g[3]().then(m=>{if(gone)return;stop=m.default(host,api)}).catch(e=>{toast('Could not load '+g[1]+': '+(e.message||e),'err');close()})
}
