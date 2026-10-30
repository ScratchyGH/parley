import{h,mount,icon,toast,GET,POST}from'./util.js'
import{topBar}from'./shell.js'
const TILES=[['rush','Gourd Rush','Hold out in the dark until dawn.'],['terror','Terror Night','Gourd Rush with the lights almost out.'],['night','Hollow Siege','Five nights in a rotting chapel.'],['team','Gourd Rush: Teamup','Squad lobby with friends.']]
export function gamesPage(r){
const bar=topBar({lead:icon('flask'),title:'Games',topic:'Unlock seasonal games for good'})
const page=h('div',{class:'pgh gp-page'})
const draw=async()=>{
let d
try{d=await GET('/api/games/packs')}catch(e){mount(page,h('div',{class:'gp-none'},e.message||'Could not load games'));return}
const cards=d.packs.map(p=>{
let sure=false
const buy=h('button',{class:'btn pri',type:'button'},'Unlock for '+p.price+' Pars')
buy.addEventListener('click',async()=>{
if(d.pars<p.price){toast('You need '+p.price+' Pars. You have '+d.pars+'.','err');return}
if(!sure){sure=true;buy.textContent='Spend '+p.price+' Pars? Click again';setTimeout(()=>{sure=false;buy.textContent='Unlock for '+p.price+' Pars'},4000);return}
buy.disabled=true
try{await POST('/api/games/buy',{pack:p.id});toast('Unlocked '+p.name,'ok')}catch(e){toast(e.message||'Could not unlock','err')}
draw()
})
const tiles=h('div',{class:'gp-tiles'},...TILES.map(t=>{
const b=h('button',{class:'gp-tile',type:'button',disabled:!p.owned,title:p.owned?'':'Unlock the pack to play'},h('b',null,t[1]),h('span',null,t[2]),h('em',null,p.owned?'Play':'Locked'))
b.addEventListener('click',async()=>{
if(t[0]==='team'){const x=await import('./teamup.js');x.openTeamup();return}
let n=1
if(t[0]==='night'){n=Number(prompt('Which night? 1 to 5','1'))||1;n=Math.max(1,Math.min(5,n))}
const{playLocal}=await import('./hollow.js')
playLocal(t[0],n)
})
return b
}))
return h('section',{class:'gp-card'+(p.owned?' own':'')},h('div',{class:'gp-h'},h('h3',null,p.name),h('span',{class:'gp-st'},p.owned?'Owned':p.live?'In season now':'Out of season')),h('p',null,p.desc),h('div',{class:'gp-row'},p.owned?h('span',{class:'gp-ok'},'Unlocked for good'):buy,null),tiles)
})
mount(page,h('div',{class:'gp-head'},h('h2',null,'Game Library'),h('p',null,'Seasonal games leave the event page when the season ends. Pay once and keep them: play in the app any time.'),h('div',{class:'gp-bal'},'Your Pars: ',h('b',null,String(d.pars)))),...cards)
}
draw()
return{nodes:[bar,page],title:'Games • Parley',cleanup:null,ready:Promise.resolve()}
}
