import{h,GET,POST,toast,avatar}from'./util.js'
import{sv,svg}from'./svg.js'
import{swatch}from'./pars.js'
import{hwOn}from'./halloween.js'
const st={d:null,subs:new Set(),loading:null,tab:'nights',lb:null}
const API='/api/events/halloween'
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')||document.documentElement.classList.contains('perf')
export const hollowData=()=>st.d
export const onHollow=fn=>{st.subs.add(fn);return()=>st.subs.delete(fn)}
export function loadHollow(){
if(st.loading)return st.loading
st.loading=GET(API).then(d=>{st.d=d;st.subs.forEach(f=>f(d));return d}).catch(()=>null).finally(()=>{st.loading=null})
return st.loading
}
export const readyCount=d=>d?d.quests.filter(q=>!q.claimed&&!q.locked&&q.n>=q.target).length+d.tiers.filter(t=>!t.claimed&&d.wallet.xp>=t.xp).length:0
function css(){
if(document.getElementById('hwcss2'))return
const l=h('link',{id:'hwcss2',rel:'stylesheet',href:'/hollow.css'})
document.head.append(l)
}
export function pumpkinSvg(size=24){
return svg(size,'0 0 40 40',
sv('defs',null,sv('radialGradient',{id:'hpg',cx:'.4',cy:'.35',r:'.8'},sv('stop',{offset:'0','stop-color':'#fdba74'}),sv('stop',{offset:'.55','stop-color':'#f97316'}),sv('stop',{offset:'1','stop-color':'#9a3412'}))),
sv('ellipse',{cx:'12',cy:'23',rx:'9',ry:'12',fill:'#c2410c',stroke:'#3b1304','stroke-width':'1.6'}),
sv('ellipse',{cx:'28',cy:'23',rx:'9',ry:'12',fill:'#c2410c',stroke:'#3b1304','stroke-width':'1.6'}),
sv('ellipse',{cx:'20',cy:'23',rx:'8.6',ry:'12.6',fill:'url(#hpg)',stroke:'#3b1304','stroke-width':'1.6'}),
sv('path',{d:'M20,10.4C20,6 22,4 25,3',fill:'none',stroke:'#4d7c0f','stroke-width':'3.2','stroke-linecap':'round'}),
sv('path',{d:'M13,20L17,16.6L18,21ZM27,20L23,16.6L22,21ZM12.6,28L16,26.4L20,29.6L24,26.4L27.4,28L24,32.4L16,32.4Z',fill:'#fde047'}))
}
export const candySvg=size=>svg(size,'0 0 32 32',
sv('path',{d:'M4,9L13,16L4,23Z',fill:'#8b5cf6',stroke:'#2e1065','stroke-width':'1.2','stroke-linejoin':'round'}),
sv('path',{d:'M28,9L19,16L28,23Z',fill:'#8b5cf6',stroke:'#2e1065','stroke-width':'1.2','stroke-linejoin':'round'}),
sv('ellipse',{cx:'16',cy:'16',rx:'9',ry:'7.4',fill:'#f97316',stroke:'#431407','stroke-width':'1.4'}),
sv('path',{d:'M9,13C12,11 20,11 23,13',fill:'none',stroke:'#fed7aa','stroke-width':'1.4','stroke-linecap':'round'}))
export function hollowBtn(on,go){
const b=h('button',{class:'wbtn hw-rail'+(on?' on':''),title:'Haunted Hollow','aria-label':'Haunted Hollow','aria-current':on?'page':null,on:{click:()=>go('/hollow')}},pumpkinSvg(28))
const w=h('div',{class:'wwrap'},b)
const n=readyCount(st.d)
if(n)w.append(h('span',{class:'bdg'},String(n)))
return w
}
const reel=()=>sv('g',{class:'tp-reel'},sv('circle',{r:'9',fill:'#0b0b10',stroke:'#cbd5e1','stroke-width':'1.6'}),sv('path',{d:'M0,-7V7M-7,0H7M-5,-5L5,5M-5,5L5,-5',stroke:'#cbd5e1','stroke-width':'1.2'}),sv('circle',{r:'2.4',fill:'#cbd5e1'}))
export function tape3d({title,tag,state,progress}){
const win=sv('svg',{viewBox:'0 0 120 40',width:'120',height:'40','aria-hidden':'true'},sv('rect',{x:'1',y:'1',width:'118',height:'38',rx:'8',fill:'#07070a',stroke:'#475569'}),sv('g',{transform:'translate(32,20)'},reel()),sv('g',{transform:'translate(88,20)'},reel()),sv('path',{d:'M32,29H88',stroke:'#64748b','stroke-width':'1',opacity:'.7'}))
const front=h('div',{class:'tp-f tp-front'},h('div',{class:'tp-lab'},h('b',null,tag),h('span',null,title)),win,h('div',{class:'tp-bar'},h('i',{style:{width:Math.round(progress*100)+'%'}})),state==='lock'?h('div',{class:'tp-lockmark'},'LOCKED'):state==='claimed'?h('div',{class:'tp-stamp'},'FOUND'):state==='done'?h('div',{class:'tp-stamp ready'},'READY'):null)
const f=c=>h('div',{class:'tp-f '+c})
const body=h('div',{class:'tp-3d'},front,f('tp-back'),f('tp-l'),f('tp-r'),f('tp-t'),f('tp-b'))
const root=h('div',{class:'tp tp-'+state,tabindex:'0','aria-label':tag+': '+title},body)
if(state!=='lock'&&!still()){
let raf=0,rx=0,ry=0
const set=()=>{raf=0;root.style.setProperty('--rx',rx+'deg');root.style.setProperty('--ry',ry+'deg')}
root.addEventListener('pointermove',e=>{
const r=root.getBoundingClientRect()
ry=((e.clientX-r.left)/r.width-.5)*50
rx=-((e.clientY-r.top)/r.height-.5)*34
root.classList.add('tp-hov')
if(!raf)raf=requestAnimationFrame(set)
})
root.addEventListener('pointerleave',()=>{rx=0;ry=0;root.classList.remove('tp-hov');if(!raf)raf=requestAnimationFrame(set)})
}
return root
}
const fmtLeft=ms=>{
if(ms<=0)return'ended'
const d=Math.floor(ms/864e5),hh=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4)
return(d?d+'d ':'')+hh+'h '+m+'m'
}
const metricText=(q,n)=>q.metric==='shift_sec'?Math.floor(n/60)+' / '+Math.floor(q.target/60)+' min':n+' / '+q.target
const qState=q=>q.claimed?'claimed':q.locked?'lock':q.n>=q.target?'done':'go'
async function claim(body,after){
try{
const r=await POST(API+'/claim',body)
if(r.duplicate)toast('Already claimed.')
else toast((r.candy?'+'+r.candy+' candy ':'')+(r.xp?'+'+r.xp+' XP ':'')+(r.item?(r.duplicate?'':'Unlocked '+r.item.name+'. Equip it in the Pars shop.'):''),'ok')
}catch(e){toast(e.message||'Could not claim','err')}
await loadHollow()
after?.()
}
function questCard(q,rerender){
const s=qState(q),pr=Math.min(100,q.n/q.target*100)
return h('div',{class:'hq hq-'+s},
h('div',{class:'hq-art'},q.kind==='night'?h('span',{class:'hq-n'},String(q.seq)):candySvg(26)),
h('div',{class:'hq-b'},h('h5',null,q.title),h('p',null,q.descr),h('div',{class:'hq-bar'},h('i',{style:{width:pr+'%'}})),h('div',{class:'hq-rw'},h('span',{class:'hq-c'},candySvg(15),String(q.candy)),h('span',null,q.xp+' XP'),h('span',{class:'hq-prog'},metricText(q,q.n)))),
s==='claimed'?h('button',{class:'btn sm',disabled:true},'Claimed'):s==='lock'?h('button',{class:'btn sm',disabled:true},'Locked'):s==='done'?h('button',{class:'btn pri sm',on:{click:()=>claim({kind:'quest',id:q.id},rerender)}},'Claim'):h('span',{class:'hq-go'},Math.round(pr)+'%'))
}
async function startRush(rerender,mode){
let run
try{run=(await POST(API+'/rush/start',{})).run}catch(e){toast(e.message||'Could not start','err');return}
css()
const playRush=mode==='run'?(await import('/g3d/run3d.js')).playRun:(await import('/g3d/gourd3d.js')).playRush
const box=h('div',{class:'hw-gamebox'})
const closeBtn=h('button',{class:'btn sm hw-gx','aria-label':'Leave the run'},'Leave run')
const root=h('div',{class:'hw-game hw-rushg',role:'dialog','aria-modal':'true','aria-label':'Gourd Rush'},box,closeBtn)
document.body.append(root)
let stop=null,over=false
const end=async()=>{
if(over)return
over=true
try{stop?.()}catch{}
root.remove()
await loadHollow()
rerender?.()
}
closeBtn.addEventListener('click',()=>{if(over)return;over=true;try{stop?.()}catch{}root.remove()})
stop=playRush(box,async r=>{
if(over)return
try{
const x=await POST(API+'/rush/finish',{run,ok:!!r.ok,secs:r.secs,kills:r.kills})
toast(x.candy?'Run paid '+x.candy+' candy.':x.left===0?'Daily candy limit reached for runs.':'Survive 20 seconds to earn candy.',x.candy?'ok':undefined)
}catch(e){toast(e.message||'Could not save the result','err')}
setTimeout(end,600)
})
}
async function startNight(night,rerender){
let run
try{run=(await POST(API+'/night/start',{night})).run}catch(e){toast(e.message||'Could not start','err');return}
css()
const [{playNight}]=await Promise.all([import('/g3d/nightshift3d.js')])
const box=h('div',{class:'hw-gamebox'})
const closeBtn=h('button',{class:'btn sm hw-gx','aria-label':'Leave the shift'},'Leave shift')
const root=h('div',{class:'hw-game',role:'dialog','aria-modal':'true','aria-label':'Night Shift'},box,closeBtn)
document.body.append(root)
let stop=null,over=false
const end=async()=>{
if(over)return
over=true
try{stop?.()}catch{}
root.remove()
await loadHollow()
rerender?.()
}
closeBtn.addEventListener('click',()=>{if(over)return;over=true;try{stop?.()}catch{}root.remove();POST(API+'/night/finish',{run,ok:false}).catch(()=>{})})
stop=playNight(night,box,async r=>{
if(over)return
try{
const x=await POST(API+'/night/finish',{run,ok:!!r.ok})
if(x.ok)toast('Night '+night+' survived. +'+x.candy+' candy.','ok')
else toast('The shift ended early. No tape this time.')
}catch(e){toast(e.message||'Could not save the result','err')}
setTimeout(end,r.ok?2600:1200)
})
}
function nightsView(d,rerender){
const nights=d.quests.filter(q=>q.kind==='night')
const row=h('div',{class:'hw-tapes'},...nights.map(q=>h('div',{class:'hw-tape'},tape3d({title:q.title.replace(/^Night \d: /,''),tag:'NIGHT '+q.seq,state:qState(q),progress:q.n/q.target}),h('div',{class:'hw-tcap'},h('b',null,metricText(q,q.n)),qState(q)==='done'?h('button',{class:'btn pri sm',on:{click:()=>claim({kind:'quest',id:q.id},rerender)}},'Claim '+q.candy+' candy'):h('span',null,q.claimed?'Collected':q.locked?'Claim the last night first':q.descr)))))
const max=d.wallet.night_max
const play=h('div',{class:'hw-play hw-scan'},h('div',{class:'hw-play-t'},h('span',{class:'hw-rec'},'REC  CAM 01'),h('h3',null,'Night Shift'),h('p',null,'Hold the hall until six. Watch the feeds, close the door when something walks up, keep the power alive. Each win pays candy.')),h('div',{class:'hw-play-b'},...[1,2,3,4,5].map(n=>h('button',{class:'btn'+(n<=max?' pri':''),disabled:n>max,on:{click:()=>startNight(n,rerender)}},n<=max?'Night '+n:'Night '+n+' locked'))))
const rush=h('div',{class:'hw-play hw-rush'},h('div',{class:'hw-play-t'},h('span',{class:'hw-rec'},'LIVE  ARENA'),h('h3',null,'Gourd Rush'),h('p',null,'Hold out in the dark until dawn. Move with WASD or the arrow keys, your lantern fires on its own. Level up, grab upgrades and take down the Hollowgrin. Runs pay candy, up to 8 a day.')),h('div',{class:'hw-play-b'},h('button',{class:'btn pri',on:{click:()=>startRush(rerender)}},'Play Gourd Rush')))
const runp=h('div',{class:'hw-play hw-rush'},h('div',{class:'hw-play-t'},h('span',{class:'hw-rec'},'LIVE  TRACK'),h('h3',null,'Hollow Run'),h('p',null,'Sprint down the graveyard road. A and D change lane, W jumps fences, S slides under webs. Candy on the road counts toward your payout. Shares the daily run limit with Gourd Rush.')),h('div',{class:'hw-play-b'},h('button',{class:'btn pri',on:{click:()=>startRush(rerender,'run')}},'Play Hollow Run')))
return h('div',null,rush,runp,play,row)
}
function questsView(d,rerender){
const part=(t,k)=>h('section',null,h('h4',{class:'hw-h'},t),h('div',{class:'hq-list'},...d.quests.filter(q=>q.kind===k).map(q=>questCard(q,rerender))))
return h('div',null,part('Daily shifts','daily'),part('Event quests','event'),h('p',{class:'hw-note'},'Daily quests reset at midnight UTC.'))
}
function rewardPrev(t){
if(!t.item)return h('div',{class:'hr-candy'},candySvg(30),h('b',null,String(t.candy)))
const sw=swatch({kind:t.item.kind,id:t.item.id,name:t.item.name,mb:0})
return sw?h('div',{class:'hr-sw'},sw):h('b',null,t.item.name)
}
function trackView(d,rerender){
const xp=d.wallet.xp
const ready=d.tiers.filter(t=>!t.claimed&&xp>=t.xp)
const head=h('div',{class:'hr-head'},h('span',null,ready.length?ready.length+' rewards ready':'Earn XP from quests to unlock tiers'),ready.length?h('button',{class:'btn pri sm',on:{click:async()=>{try{const r=await POST(API+'/claim-all',{});toast('Claimed '+r.items.length+' items and '+r.candy+' candy.','ok')}catch(e){toast(e.message||'Could not claim','err')}await loadHollow();rerender()}}},'Claim all'):null)
const grid=h('div',{class:'hr-grid'},...d.tiers.map(t=>{
const s=t.claimed?'claimed':xp>=t.xp?'ready':'lock'
return h('div',{class:'hr hr-'+s+(t.item?' hr-big':'')},h('span',{class:'hr-t'},'Tier '+t.tier),h('div',{class:'hr-pv'},rewardPrev(t)),h('div',{class:'hr-n'},t.item?t.item.name:t.candy+' candy'),s==='ready'?h('button',{class:'btn pri sm',on:{click:()=>claim({kind:'tier',id:t.tier},rerender)}},'Claim'):h('span',{class:'hr-s'},s==='claimed'?'Claimed':t.xp+' XP'))
}))
return h('div',null,head,grid)
}
function boardView(){
const box=h('div',{class:'hl'},h('p',{class:'hw-note'},'Loading the board...'))
GET(API+'/leaderboard').then(r=>{
box.replaceChildren(...(r.rows.length?r.rows.map(x=>h('div',{class:'hl-r'+(x.me?' me':'')},h('span',{class:'hl-k'},String(x.rank)),avatar({id:x.id,display_name:x.display_name,avatar_id:x.avatar_id,accent:x.accent,frame:x.frame},'sm'),h('b',null,x.display_name+(x.me?' (you)':'')),h('span',{class:'hl-s'},x.xp.toLocaleString()+' XP'))):[h('p',{class:'hw-note'},'Nobody is on the board yet. Finish a quest to take first place.')]))
}).catch(()=>box.replaceChildren(h('p',{class:'hw-note'},'Could not load the board.')))
return box
}
function giftView(d,rerender){
const left=d.gifts.max_per_day-d.gifts.sent_today
const inp=h('input',{class:'inp',placeholder:'Username',maxLength:32,'aria-label':'Username to send a pumpkin to'})
const btn=h('button',{class:'btn pri',on:{click:async()=>{
const to=inp.value.trim()
if(!to)return
btn.disabled=true
try{const r=await POST(API+'/gift',{to});toast('Pumpkin sent to '+r.to+'.','ok');inp.value=''}catch(e){toast(e.message||'Could not send','err')}
btn.disabled=false
await loadHollow()
rerender()
}}},'Send a pumpkin ('+d.gifts.cost+' candy)')
return h('div',{class:'hw-gift'},h('div',{class:'hw-gift-art'},pumpkinSvg(96)),h('div',null,h('h3',null,'Send a pumpkin'),h('p',null,'They get a gift pumpkin that cracks open into a treat or a trick. Costs '+d.gifts.cost+' candy. You can send '+Math.max(0,left)+' more today.'),h('div',{class:'hw-gift-f'},inp,btn)))
}
const TABS=[['nights','Nights'],['quests','Quests'],['track','Rewards'],['board','Leaderboard'],['gift','Gift']]
export function hollowPage(pg){
css()
pg.classList.add('hw-hub')
const root=h('div',{class:'hw-body'})
const hero=h('header',{class:'hw-hero hw-scan'})
const tabs=h('nav',{class:'hw-tabs',role:'tablist'})
const view=h('div',{class:'hw-view'})
pg.append(hero,tabs,view)
const fill=()=>{
const d=st.d
if(!d){view.replaceChildren(h('p',{class:'hw-note'},'Loading the Hollow...'));return}
const xp=d.wallet.xp,cur=d.wallet.tier
hero.replaceChildren(h('div',{class:'hw-hero-l'},h('span',{class:'hw-rec'},'REC  HAUNTED HOLLOW'),h('h2',null,'Haunted Hollow'),h('p',null,'Work the night shift. Every quest pays candy and XP toward 24 tiers of rewards.'),h('div',{class:'hw-cd'},d.season.live?'Ends in '+fmtLeft(d.season.end-Date.now()):d.season.grace?'Event over. Claim your rewards today.':'Event over')),h('div',{class:'hw-hero-r'},h('div',{class:'hw-stat'},candySvg(26),h('b',null,String(d.wallet.candy)),h('span',null,'candy')),h('div',{class:'hw-stat'},pumpkinSvg(26),h('b',null,d.pumpkins.found+'/'+d.pumpkins.total),h('span',null,'pumpkins')),h('div',{class:'hw-tier'},h('div',{class:'hw-tier-t'},h('b',null,'Tier '+cur),h('span',null,xp+' / 2400 XP')),h('div',{class:'hq-bar'},h('i',{style:{width:Math.min(100,xp%100)+'%'}})))))
tabs.replaceChildren(...TABS.map(([k,n])=>h('button',{class:'hw-tab'+(st.tab===k?' on':''),role:'tab','aria-selected':st.tab===k?'true':'false',on:{click:()=>{st.tab=k;fill()}}},n)))
const re=()=>fill()
view.replaceChildren(st.tab==='nights'?nightsView(d,re):st.tab==='quests'?questsView(d,re):st.tab==='track'?trackView(d,re):st.tab==='gift'?giftView(d,re):boardView())
}
fill()
loadHollow().then(()=>{if(pg.isConnected)fill()})
const iv=setInterval(()=>{if(!pg.isConnected)clearInterval(iv);else if(st.d&&st.tab!=='board'&&!document.hidden){const c=hero.querySelector('.hw-cd');if(c&&st.d.season.live)c.textContent='Ends in '+fmtLeft(st.d.season.end-Date.now())}},30000)
}
const SLOTS={rail:'.ws',composer:'.comp',sidebar:'.ctx-b',topbar:'.ctx-h',members:'.panel',pars:'.par-page',settings:'.ov-top',hub:'.hw-hero',dm:'.ci',server:'.wwrap',menu:'.menu',dialog:'.dlg',messages:'.msgs .m'}
let mo=null,tm=0
function place(){
const d=st.d
if(!d||!d.pumpkins.open.length){if(mo){mo.disconnect();mo=null}return}
for(const p of d.pumpkins.open){
const sel=SLOTS[p.slot]
const host=sel&&document.querySelector(sel)
if(!host||host.querySelector(':scope>.hw-pk[data-id="'+p.id+'"]'))continue
if(getComputedStyle(host).position==='static')host.classList.add('hw-pkh')
const b=h('button',{class:'hw-pk hw-pk-'+p.slot,'data-id':p.id,title:'A hidden pumpkin','aria-label':'Hidden pumpkin',on:{click:async e=>{
e.stopPropagation()
b.classList.add('pop')
try{
const r=await POST(API+'/pumpkin',{id:p.id})
if(r.new)toast('Hidden pumpkin found. +10 candy, +10 XP ('+r.found+'/'+d.pumpkins.total+')','ok')
}catch(x){toast(x.message||'Could not collect','err')}
setTimeout(()=>b.remove(),400)
await loadHollow()
}}},pumpkinSvg(22))
host.append(b)
}
}
function watch(){
if(mo)return
mo=new MutationObserver(()=>{if(tm)return;tm=setTimeout(()=>{tm=0;place()},500)})
mo.observe(document.body,{childList:true,subtree:true})
place()
}
export function startHollow(){
if(!hwOn())return
css()
loadHollow().then(()=>watch())
setInterval(()=>{if(!document.hidden)loadHollow().then(()=>{if(st.d?.pumpkins.open.length)watch()})},300000)
}
