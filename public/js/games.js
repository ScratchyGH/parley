import{h,mount,GET,POST,toast,fail}from'./util.js'
import{sv,svg}from'./svg.js'
import{swatch,parIcon}from'./pars.js'
import{S}from'./state.js'
import{gameBar}from'./gamebar.js'
import{hwOn}from'./halloween.js'
import{go}from'./nav.js'
const GM={
snake:['Snake','Eat, grow, do not hit yourself. Arrows, WASD or swipe.','classic'],
g2048:['2048','Slide and merge tiles to reach 2048. Arrows or swipe.','classic'],
breakout:['Breakout','Clear every brick. Mouse, touch or arrows, Space to launch.','classic'],
deepsleep:['Deep Sleep','A story game. Say goodnight, fall asleep, and find out what lives inside the dream. Contains Terror Night.','horror'],
snowrun:['Snow Drift','Ski downhill, dodge trees, grab gifts.','winter'],
bloom:['Petal Catch','Catch falling petals in your basket. Avoid the bees.','spring'],
waves:['Wave Rider','Surf and jump rocks and sharks. Space or tap.','summer']
}
const FILE={g2048:'g2048'}
const PK={winter:['Winter games','Snow, gifts and cold air.'],spring:['Spring games','Petals, bees and sunshine.'],summer:['Summer games','Waves, sand and sharks.']}
let cssOn=false
const css=()=>{if(cssOn)return;cssOn=true;document.head.append(h('link',{rel:'stylesheet',href:'/games.css'}))}
export const gamesIcon=s=>svg(s,'0 0 24 24',sv('path',{d:'M7 8h10a5 5 0 0 1 4.8 6.4l-.9 3a2.4 2.4 0 0 1-4 1L15 17H9l-1.9 1.4a2.4 2.4 0 0 1-4-1l-.9-3A5 5 0 0 1 7 8Z',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linejoin':'round'}),sv('path',{d:'M8 11v4M6 13h4',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round'}),sv('circle',{cx:'15.5',cy:'12',r:'1',fill:'currentColor'}),sv('circle',{cx:'17.5',cy:'14',r:'1',fill:'currentColor'}))
async function launch(id){
css()
const box=h('div',{class:'gm-box'})
const x=h('button',{class:'btn sm gm-x','aria-label':'Leave the game'},'Leave game')
const root=h('div',{class:'gm-game',role:'dialog','aria-modal':'true','aria-label':GM[id][0]},box)
document.body.append(root,x)
gameBar(root,id)
let stop=null,over=false
const end=()=>{if(over)return;over=true;try{stop&&stop()}catch{}root.remove();x.remove();document.exitFullscreen?.().catch(()=>{})}
x.addEventListener('click',end)
try{const m=await import('/gm/'+(FILE[id]||id)+'.js');if(over)return;stop=m.play(box)}catch(e){end();toast('Could not load the game','err')}
}
export function gamesPage(pg){
css()
const st={tab:'play',d:null,pars:null}
const rid=()=>'g'+Math.random().toString(36).slice(2,12)
const card=(id,locked,pack)=>h('div',{class:'gm-card'+(locked?' gm-lock':'')},h('h3',null,GM[id][0]),h('p',null,GM[id][1]),h('div',{class:'row'},locked?h('button',{class:'btn sm',on:{click:()=>unlock(pack)}},'Unlock for '+st.d.packs[pack].price+' Pars'):h('button',{class:'btn sm primary',on:{click:()=>launch(id)}},'Play')))
async function unlock(pack){
try{await POST('/api/games/unlock',{pack});toast('Unlocked '+PK[pack][0],'ok');await load()}catch(e){fail(e)}
}
async function load(){
try{st.d=await GET('/api/games');S.me.pars=st.d.balance}catch(e){mount(pg,h('div',{class:'hint'},e.message));return}
draw()
}
async function shop(){
if(!st.pars)try{st.pars=await GET('/api/pars')}catch(e){mount(pg,h('div',{class:'hint'},e.message));return}
draw()
}
function draw(){
const tabs=h('div',{class:'gm-tabs'},[['play','Games'],['seasonal','Seasonal'],['horror','Horror shop']].map(([k,l])=>h('button',{class:'btn sm'+(st.tab===k?' primary':''),'aria-pressed':String(st.tab===k),on:{click:()=>{st.tab=k;if(k==='horror')shop();else draw()}}},l)))
const head=h('div',{class:'row',style:{display:'flex',gap:'10px',alignItems:'center',marginBottom:'12px'}},h('h2',{style:{margin:0}},'Games'),h('span',{class:'hint'},parIcon(16),' '+(st.d?st.d.balance:0)+' Pars'))
let body
if(st.tab==='play'){
const cl=Object.keys(GM).filter(k=>GM[k][2]==='classic'),hr=['deepsleep']
body=[h('h3',{class:'gm-sec'},'Classics',h('small',null,'Free. Play any time.')),h('div',{class:'gm-grid'},cl.map(k=>card(k,false))),h('h3',{class:'gm-sec'},'Horror',h('small',null,'Free story mode. Pairs with Terror Night.')),h('div',{class:'gm-grid'},hr.map(k=>card(k,false)),hwOn()?h('div',{class:'gm-card'},h('h3',null,'Haunted Hollow'),h('p',null,'Gourd Rush, Terror Night and Hollow Siege for the Halloween event.'),h('div',{class:'row'},h('button',{class:'btn sm',on:{click:()=>go('/hollow')}},'Open the event'))):null)]
}else if(st.tab==='seasonal'){
body=Object.keys(PK).map(p=>{const un=st.d.unlocked.includes(p);return h('div',null,h('h3',{class:'gm-sec'},PK[p][0],h('small',null,un?'Unlocked. '+PK[p][1]:PK[p][1]+' Unlock with Pars.')),h('div',{class:'gm-grid'},Object.keys(GM).filter(k=>GM[k][2]===p).map(k=>card(k,!un,p))))})
}else{
const it=(st.pars?.items||[]).filter(i=>i.id.endsWith('_horror')),own=new Set((st.pars?.owned||[]).map(o=>o.item_id))
body=[h('h3',{class:'gm-sec'},'Horror shop',h('small',null,'Dark cosmetics for your name, avatar and messages.')),h('div',{class:'gm-shop'},it.map(i=>h('div',{class:'gm-card'},h('div',{class:'gm-prev'},swatch(i)),h('h3',null,i.name),h('p',null,i.descr),h('div',{class:'row'},own.has(i.id)?h('span',{class:'hint'},'Owned'):h('button',{class:'btn sm primary',on:{click:async e=>{e.target.disabled=true;try{await POST('/api/pars/buy',{item:i.id,req:rid()});toast('Bought '+i.name,'ok');st.pars=null;await load();if(st.tab==='horror')shop()}catch(x){e.target.disabled=false;fail(x)}}}},'Buy for '+i.price+' Pars')))))]
}
mount(pg,[head,tabs,...[].concat(body)])
}
load()
}
