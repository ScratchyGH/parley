import{h,GET,POST,toast,avatar}from'./util.js'
import{sv,svg}from'./svg.js'
import{swatch}from'./pars.js'
import{fallOn}from'./fall.js'
import{TK_GAMES,openTk}from'./tkshell.js'
const st={d:null,subs:new Set(),loading:null,tab:'days',err:false}
const API='/api/events/thicket'
export const thicketData=()=>st.d
export const onThicket=fn=>{st.subs.add(fn);return()=>st.subs.delete(fn)}
export function loadThicket(){
if(st.loading)return st.loading
st.loading=GET(API).then(d=>{st.d=d;st.err=false;st.subs.forEach(f=>f(d));return d}).catch(()=>{st.err=true;return null}).finally(()=>{st.loading=null})
return st.loading
}
export const readyCount=d=>d?d.quests.filter(q=>!q.claimed&&!q.locked&&q.n>=q.target).length+d.tiers.filter(t=>!t.claimed&&d.wallet.xp>=t.xp).length:0
function css(){
if(document.getElementById('fallcss'))return
document.head.append(h('link',{id:'fallcss',rel:'stylesheet',href:'/thicket.css'}))
}
export function acornSvg(size=24){
return svg(size,'0 0 40 40',
sv('defs',null,sv('radialGradient',{id:'tag',cx:'.4',cy:'.35',r:'.8'},sv('stop',{offset:'0','stop-color':'#fcd34d'}),sv('stop',{offset:'.55','stop-color':'#d97706'}),sv('stop',{offset:'1','stop-color':'#78350f'}))),
sv('path',{d:'M20,36C12,34 9,26 9,19H31C31,26 28,34 20,36Z',fill:'url(#tag)',stroke:'#3b1a05','stroke-width':'1.6','stroke-linejoin':'round'}),
sv('path',{d:'M6.5,19C6.5,10 13,6 20,6C27,6 33.5,10 33.5,19Z',fill:'#92400e',stroke:'#3b1a05','stroke-width':'1.6','stroke-linejoin':'round'}),
sv('path',{d:'M12,15L16,10M18,16L22,9M24,15L28,10',stroke:'#451a03','stroke-width':'1.4','stroke-linecap':'round'}),
sv('path',{d:'M20,6V2.5',stroke:'#3b1a05','stroke-width':'2.6','stroke-linecap':'round'}))
}
export const candySvg=acornSvg
export function leafSvg(size=24){
return svg(size,'0 0 40 40',
sv('path',{d:'M20,3L25,12L34,10L31,19L37,25L28,27L29,36L20,31L11,36L12,27L3,25L9,19L6,10L15,12Z',fill:'#ea580c',stroke:'#7c2d12','stroke-width':'1.6','stroke-linejoin':'round'}),
sv('path',{d:'M20,10V37M20,22L13,17M20,26L28,20',stroke:'#fed7aa','stroke-width':'1.6','stroke-linecap':'round',fill:'none'}))
}
export function thicketBtn(on,go){
const b=h('button',{class:'wbtn fall-rail'+(on?' on':''),title:'Thankful Thicket','aria-label':'Thankful Thicket','aria-current':on?'page':null,on:{click:()=>go('/thicket')}},acornSvg(28))
const w=h('div',{class:'wwrap'},b)
const n=readyCount(st.d)
if(n)w.append(h('span',{class:'bdg'},String(n)))
return w
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
else toast((r.candy?'+'+r.candy+' acorns ':'')+(r.xp?'+'+r.xp+' XP ':'')+(r.item?'Unlocked '+r.item.name+'. Equip it in the Pars shop.':''),'ok')
}catch(e){toast(e.message||'Could not claim','err')}
await loadThicket()
after?.()
}
function setBar(el,p){el.style.setProperty('--p',Math.round(p)+'%')}
function questCard(q,rerender){
const s=qState(q),pr=Math.min(100,q.n/q.target*100)
const bar=h('div',{class:'tk-bar'},h('i'))
setBar(bar,pr)
return h('div',{class:'tk-q tk-q-'+s},
h('div',{class:'tk-q-art'},q.kind==='day'?h('span',{class:'tk-q-n'},String(q.seq)):acornSvg(26)),
h('div',{class:'tk-q-b'},h('h5',null,q.title),h('p',null,q.descr),bar,h('div',{class:'tk-q-rw'},h('span',{class:'tk-q-c'},acornSvg(15),String(q.candy)),h('span',null,q.xp+' XP'),h('span',{class:'tk-q-p'},metricText(q,q.n)))),
s==='claimed'?h('button',{class:'btn sm',disabled:true},'Claimed'):s==='lock'?h('button',{class:'btn sm',disabled:true},'Locked'):s==='done'?h('button',{class:'btn pri sm',on:{click:()=>claim({kind:'quest',id:q.id},rerender)}},'Claim'):h('span',{class:'tk-q-go'},Math.round(pr)+'%'))
}
const ART={dash:'#f59e0b,#b45309',stack:'#ea580c,#7c2d12',match:'#a16207,#422006',catch:'#dc2626,#7f1d1d',forage:'#65a30d,#365314'}
function gameTile(g,rerender){
const t=h('button',{class:'tk-gt',type:'button',on:{click:()=>{openTk(g[0]);const iv=setInterval(()=>{if(!document.querySelector('.tk-over')){clearInterval(iv);loadThicket().then(rerender)}},1500)}}},h('b',null,g[1]),h('span',null,g[2]),h('em',null,'Play'))
t.style.setProperty('--g',ART[g[0]])
return t
}
function daysView(d,rerender){
const days=d.quests.filter(q=>q.kind==='day')
const games=h('div',{class:'tk-games'},...Array.from(TK_GAMES,g=>gameTile(g,rerender)))
const path=h('div',{class:'tk-days'},...days.map(q=>{
const s=qState(q)
return h('div',{class:'tk-day tk-day-'+s},h('span',{class:'tk-day-n'},'Day '+q.seq),h('b',null,q.title.replace(/^Day \d: /,'')),h('span',{class:'tk-day-p'},metricText(q,q.n)),s==='done'?h('button',{class:'btn pri sm',on:{click:()=>claim({kind:'quest',id:q.id},rerender)}},'Claim '+q.candy):h('span',{class:'tk-day-s'},q.claimed?'Collected':q.locked?'Claim the last day first':q.descr))
}))
return h('div',null,h('h4',{class:'tk-h'},'Play'),h('p',{class:'tk-note'},'Every run pays Pars and counts toward your quests.'),games,h('h4',{class:'tk-h'},'Seven days'),path)
}
function questsView(d,rerender){
const part=(t,k)=>h('section',null,h('h4',{class:'tk-h'},t),h('div',{class:'tk-list'},...d.quests.filter(q=>q.kind===k).map(q=>questCard(q,rerender))))
return h('div',null,part('Daily','daily'),part('Event quests','event'),h('p',{class:'tk-note'},'Daily quests reset at midnight UTC.'))
}
function rewardPrev(t){
if(!t.item)return h('div',{class:'tk-r-c'},acornSvg(30),h('b',null,String(t.candy)))
const sw=swatch({kind:t.item.kind,id:t.item.id,name:t.item.name,mb:0})
return sw?h('div',{class:'tk-r-sw'},sw):h('b',null,t.item.name)
}
function trackView(d,rerender){
const xp=d.wallet.xp
const ready=d.tiers.filter(t=>!t.claimed&&xp>=t.xp)
const head=h('div',{class:'tk-rh'},h('span',null,ready.length?ready.length+' rewards ready':'Earn XP from quests to unlock tiers'),ready.length?h('button',{class:'btn pri sm',on:{click:async()=>{try{const r=await POST(API+'/claim-all',{});toast('Claimed '+r.items.length+' items and '+r.candy+' acorns.','ok')}catch(e){toast(e.message||'Could not claim','err')}await loadThicket();rerender()}}},'Claim all'):null)
const grid=h('div',{class:'tk-rg'},...d.tiers.map(t=>{
const s=t.claimed?'claimed':xp>=t.xp?'ready':'lock'
return h('div',{class:'tk-r tk-r-'+s+(t.item?' tk-r-big':'')},h('span',{class:'tk-r-t'},'Tier '+t.tier),h('div',{class:'tk-r-pv'},rewardPrev(t)),h('div',{class:'tk-r-n'},t.item?t.item.name:t.candy+' acorns'),s==='ready'?h('button',{class:'btn pri sm',on:{click:()=>claim({kind:'tier',id:t.tier},rerender)}},'Claim'):h('span',{class:'tk-r-s'},s==='claimed'?'Claimed':t.xp+' XP'))
}))
return h('div',null,head,grid)
}
function shopView(d,rerender){
const all=d.shop
const cards=all.map(s=>{
const sw=swatch({kind:s.kind,id:s.id,name:s.name,mb:0})
const b=h('button',{class:'btn pri sm',disabled:s.owned||d.wallet.candy<s.cost,on:{click:async()=>{
b.disabled=true
try{const r=await POST(API+'/shop',{id:s.id});toast('Bought '+(r.item?r.item.name:'it')+'. Equip it in the Pars shop.','ok')}catch(e){toast(e.message||'Could not buy','err')}
await loadThicket()
rerender()
}}},s.owned?'Owned':s.cost+' acorns')
return h('div',{class:'tk-r tk-shop'},h('div',{class:'tk-r-pv'},sw?h('div',{class:'tk-r-sw'},sw):h('b',null,s.name)),h('div',{class:'tk-r-n'},s.name),b)
})
return h('div',null,h('p',{class:'tk-note'},'Spend the acorns you earn on cosmetics that only the Thicket sells. You have '+d.wallet.candy+' acorns.'),h('div',{class:'tk-rg'},...cards))
}
function boardView(){
const box=h('div',{class:'tk-lb'},h('p',{class:'tk-note'},'Loading the board...'))
GET(API+'/leaderboard').then(r=>{
box.replaceChildren(...(r.rows.length?r.rows.map(x=>h('div',{class:'tk-lb-r'+(x.me?' me':'')},h('span',{class:'tk-lb-k'},String(x.rank)),avatar({id:x.id,display_name:x.display_name,avatar_id:x.avatar_id,accent:x.accent,frame:x.frame},'sm'),h('b',null,x.display_name+(x.me?' (you)':'')),h('span',{class:'tk-lb-s'},x.xp.toLocaleString()+' XP'))):[h('p',{class:'tk-note'},'Nobody is on the board yet. Finish a quest to take first place.')]))
}).catch(()=>box.replaceChildren(h('p',{class:'tk-note'},'Could not load the board.')))
return h('div',null,h('p',{class:'tk-note'},'Top 3 when the event ends get the Thicket Legend frame. Top 10 get the title.'),box)
}
function giftView(d,rerender){
const left=d.gifts.max_per_day-d.gifts.sent_today
const inp=h('input',{class:'inp',placeholder:'Username',maxLength:32,'aria-label':'Username to send a basket to'})
const btn=h('button',{class:'btn pri',on:{click:async()=>{
const to=inp.value.trim()
if(!to)return
btn.disabled=true
try{const r=await POST(API+'/gift',{to});toast('Basket sent to '+r.to+'.','ok');inp.value=''}catch(e){toast(e.message||'Could not send','err')}
btn.disabled=false
await loadThicket()
rerender()
}}},'Send a basket ('+d.gifts.cost+' acorns)')
return h('div',{class:'tk-gift'},h('div',{class:'tk-gift-art'},acornSvg(96)),h('div',null,h('h3',null,'Send a harvest basket'),h('p',null,'They get a gift basket with a cosmetic, a surprise, or a rare Golden Acorn frame. Costs '+d.gifts.cost+' acorns. You can send '+Math.max(0,left)+' more today.'),h('div',{class:'tk-gift-f'},inp,btn)))
}
const TABS=[['days','Days'],['quests','Quests'],['track','Rewards'],['shop','Shop'],['board','Leaderboard'],['gift','Gift']]
export function thicketPage(pg){
css()
pg.classList.add('tk-hub')
const hero=h('header',{class:'tk-hero'})
const tabs=h('nav',{class:'tk-tabs',role:'tablist'})
const view=h('div',{class:'tk-view'})
pg.append(hero,tabs,view)
const fill=()=>{
const d=st.d
if(!d){view.replaceChildren(h('p',{class:'tk-note'},st.err?'The Thicket could not load. Check your connection and sign in, then try again.':'Loading the Thicket...'),...(st.err?[h('button',{class:'btn',on:{click:()=>{st.err=false;fill();loadThicket().then(()=>{if(pg.isConnected)fill()})}}},'Try again')]:[]));return}
const xp=d.wallet.xp,cur=d.wallet.tier
const bar=h('div',{class:'tk-bar'},h('i'))
setBar(bar,Math.min(100,xp%100))
hero.replaceChildren(h('div',{class:'tk-hero-l'},h('h2',null,'Thankful Thicket'),h('p',null,'Five games, thirty tiers, a shop and a leaderboard. Everything you do in Parley earns acorns and XP.'),h('div',{class:'tk-cd'},d.season.live?'Ends in '+fmtLeft(d.season.end-Date.now()):d.season.grace?'Event over. Claim your rewards today.':'Event over')),h('div',{class:'tk-hero-r'},h('div',{class:'tk-stat'},acornSvg(26),h('b',null,String(d.wallet.candy)),h('span',null,'acorns')),h('div',{class:'tk-stat'},leafSvg(26),h('b',null,d.leaves.found+'/'+d.leaves.total),h('span',null,'leaves')),h('div',{class:'tk-tier'},h('div',{class:'tk-tier-t'},h('b',null,'Tier '+cur),h('span',null,xp+' / 3000 XP')),bar)))
tabs.replaceChildren(...TABS.map(([k,n])=>h('button',{class:'tk-tab'+(st.tab===k?' on':''),role:'tab','aria-selected':st.tab===k?'true':'false',on:{click:()=>{st.tab=k;fill()}}},n)))
view.replaceChildren(st.tab==='days'?daysView(d,fill):st.tab==='quests'?questsView(d,fill):st.tab==='track'?trackView(d,fill):st.tab==='shop'?shopView(d,fill):st.tab==='gift'?giftView(d,fill):boardView())
}
fill()
loadThicket().then(()=>{if(pg.isConnected)fill()})
const iv=setInterval(()=>{if(!pg.isConnected)clearInterval(iv);else if(st.d&&!document.hidden){const c=hero.querySelector('.tk-cd');if(c&&st.d.season.live)c.textContent='Ends in '+fmtLeft(st.d.season.end-Date.now())}},30000)
}
const SLOTS={rail:'.ws',composer:'.comp',sidebar:'.ctx-b',topbar:'.ctx-h',members:'.panel',pars:'.par-page',settings:'.ov-top',hub:'.tk-hero',dm:'.ci',server:'.wwrap',menu:'.menu',dialog:'.dlg',messages:'.msgs .m',discover:'.disc',friends:'.fr-page'}
let mo=null,tm=0
function place(){
const d=st.d
if(!d||!d.leaves.open.length){if(mo){mo.disconnect();mo=null}return}
for(const p of d.leaves.open){
const sel=SLOTS[p.slot]
const host=sel&&document.querySelector(sel)
if(!host||document.querySelector('.tk-lf[data-id="'+p.id+'"]'))continue
if(getComputedStyle(host).position==='static')host.classList.add('tk-lfh')
const b=h('button',{class:'tk-lf tk-lf-'+p.slot,'data-id':p.id,title:'A hidden leaf','aria-label':'Hidden leaf',on:{click:async e=>{
e.stopPropagation()
b.classList.add('pop')
try{
const r=await POST(API+'/leaf',{id:p.id})
if(r.new)toast('Hidden leaf found. +10 acorns, +10 XP ('+r.found+'/'+d.leaves.total+')','ok')
}catch(x){toast(x.message||'Could not collect','err')}
setTimeout(()=>b.remove(),400)
await loadThicket()
}}},leafSvg(22))
host.append(b)
}
}
function watch(){
if(mo)return
mo=new MutationObserver(()=>{if(tm)return;tm=setTimeout(()=>{tm=0;place()},500)})
mo.observe(document.body,{childList:true,subtree:true})
place()
}
export function startThicket(){
if(!fallOn())return
css()
loadThicket().then(()=>watch())
setInterval(()=>{if(!document.hidden)loadThicket().then(()=>{if(st.d?.leaves.open.length)watch()})},300000)
}
