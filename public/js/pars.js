import{h,mount,GET,POST,PUT,fail,toast,field,dialog,rid,fmtRel}from'./util.js'
import{S,on}from'./state.js'
import{sv,svg}from'./svg.js'

let marks=new Set(),beat=null
const note=()=>{marks.add(Math.floor(Date.now()/5000))}
export function startPars(){
if(beat)return
for(const ev of['keydown','pointerdown','wheel','touchstart'])addEventListener(ev,e=>{if(e.isTrusted)note()},{passive:true,capture:true})
beat=setInterval(async()=>{
const cut=Math.floor(Date.now()/5000)-12
const i=[...marks].filter(x=>x>cut).length
marks=new Set([...marks].filter(x=>x>cut))
if(document.visibilityState!=='visible'||!document.hasFocus())return
try{
const r=await POST('/api/pars/beat',{i,v:true})
if(S.me)S.me.pars=r.balance
if(r.earned>0)toast('+'+r.earned+' Pars earned',null)
for(const n of r.notes||[])toast(n)
}catch{}
},60000)
setTimeout(()=>POST('/api/pars/beat',{i:0,v:true}).catch(()=>{}),1500)
on('pars.gift',d=>toast((d.from||'Someone')+' sent you '+d.amount+' Pars'))
}
export const parIcon=(s=18)=>svg(s,'0 0 24 24',sv('circle',{cx:'12',cy:'12',r:'10',fill:'#f5c542'}),sv('circle',{cx:'12',cy:'12',r:'7',fill:'none',stroke:'#92400e','stroke-width':'1.6'}),sv('path',{d:'M10 16V8h3a2.2 2.2 0 0 1 0 4.4h-3',fill:'none',stroke:'#92400e','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round'}))
const KINDS=[['vanity','Server upgrades'],['boost','Upload boosts'],['nameplate','Nameplates'],['frame','Avatar frames']]
const owns=(d,id,sid)=>d.owned.some(o=>o.item_id===id&&(sid===undefined||o.server_id===sid))
function swatch(it){
const c=String(it.data||'').split(',')
if(it.kind==='nameplate')return h('div',{class:'par-np',style:{background:`linear-gradient(90deg,${c[0]},${c[1]||c[0]})`}},S.me.display_name)
if(it.kind==='frame')return h('div',{class:'par-fr',style:{boxShadow:`0 0 0 3px ${c[0]}`}})
return null
}
export function parsPage(pg){
const box=h('div',null,h('div',{class:'hint'},'Loading'))
mount(pg,h('h2',null,'Pars'),box)
load()
async function load(){
try{
const d=await GET('/api/pars')
S.me.pars=d.balance
S.me.nameplate=d.nameplate
S.me.frame=d.frame
draw(d)
}catch(e){mount(box,h('div',{class:'hint'},e.message))}
}
function draw(d){
const hrs=(d.today_ms/3600000).toFixed(1)
mount(box,
h('div',{class:'par-hero'},parIcon(34),h('div',null,h('div',{class:'par-bal'},String(d.balance)),h('div',{class:'hint',style:{margin:0}},'Earn '+d.rate+' Pars for every hour you actively use Parley. Today: '+hrs+' of '+d.daily_cap_hours+' hours counted. '+d.notice))),
...KINDS.map(([k,l])=>{
const list=d.items.filter(i=>i.kind===k)
if(!list.length)return null
return h('section',{class:'par-sec'},h('h3',null,l),h('div',{class:'par-grid'},list.map(it=>card(d,it))))
}),
giftBox(d),
h('section',{class:'par-sec'},h('h3',null,'Your upgrades'),own(d)),
h('section',{class:'par-sec'},h('h3',null,'History'),hist(d)))
}
function card(d,it){
const have=(it.kind==='nameplate'||it.kind==='frame')&&owns(d,it.id)
const eq=d[it.kind]===it.id
return h('div',{class:'par-card'},swatch(it),h('b',null,it.name),h('div',{class:'hint',style:{margin:0}},it.descr),h('div',{class:'row sp'},h('span',{class:'par-price'},parIcon(14),' '+it.price),have?h('button',{class:'btn sm',on:{click:async()=>{try{await POST('/api/pars/equip',{kind:it.kind,item:eq?null:it.id});load()}catch(e){fail(e)}}}},eq?'Unequip':'Equip'):h('button',{class:'btn sm pri',disabled:d.balance<it.price,title:d.balance<it.price?'You need '+(it.price-d.balance)+' more Pars':'',on:{click:()=>buy(d,it)}},'Buy')))
}
function own(d){
if(!d.owned.length)return h('div',{class:'hint'},'Nothing yet.')
const name=id=>(d.items.find(i=>i.id===id)||{name:id}).name
return h('div',null,h('div',{class:'hint'},'Account upload boost: +'+d.account_boost_mb+' MB.'),d.owned.map(o=>h('div',{class:'row sp',style:{padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('span',null,name(o.item_id)+(o.server_name?' on '+o.server_name:'')+(o.gift_from?' (gift)':'')),h('span',{class:'hint',style:{margin:0}},fmtRel(o.created_at)))))
}
function hist(d){
if(!d.tx.length)return h('div',{class:'hint'},'No activity yet.')
return d.tx.map(t=>h('div',{class:'row sp',style:{padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('span',null,t.note||t.kind,h('span',{class:'hint',style:{margin:'0 0 0 8px'}},fmtRel(t.created_at))),h('b',{style:{color:t.delta>0?'var(--ok,#34d399)':'var(--strong)'}},(t.delta>0?'+':'')+t.delta)))
}
function giftBox(d){
const to=h('input',{class:'inp',placeholder:'Username',maxLength:24,autocomplete:'off'})
const amt=h('input',{class:'inp',type:'number',min:'1',max:String(d.gift_max),value:'10',style:{width:'90px'}})
const nt=h('input',{class:'inp',placeholder:'Note (optional)',maxLength:80})
const go=h('button',{class:'btn pri',on:{click:async()=>{
go.disabled=true
try{await POST('/api/pars/gift',{to:to.value,amount:Number(amt.value),note:nt.value,req:rid()});toast('Pars sent');load()}catch(e){fail(e)}finally{go.disabled=false}
}}},'Send Pars')
return h('section',{class:'par-sec'},h('h3',null,'Gift Pars'),h('div',{class:'hint'},'Send Pars to another person. Gifts are final and limited per day. Pars have no cash value.'),h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},to,amt,nt,go))
}
async function buy(d,it){
let mode=it.kind==='vanity'?'server':it.kind==='boost'?'server':'self'
const servers=S.servers
const sel=h('select',{class:'sel'},servers.map(s=>h('option',{value:s.id},s.name)))
const who=h('input',{class:'inp',placeholder:'Username to gift to',maxLength:24})
const where=h('div',null)
const modes=it.kind==='boost'?[['server','A server I am in'],['self','My account'],['user','Gift to someone']]:[]
const drawW=()=>mount(where,modes.length?h('div',{class:'tabs',style:{marginBottom:'8px'}},modes.map(([k,l])=>h('button',{class:mode===k?'on':'',on:{click:()=>{mode=k;drawW()}}},l))):null,mode==='server'?field('Server',sel):null,mode==='user'?field('Person',who):null)
drawW()
const dlg=dialog('Confirm purchase',h('div',{class:'bd'},h('p',null,h('b',null,it.name),' for ',h('b',null,it.price+' Pars'),'. You have '+d.balance+', leaving '+(d.balance-it.price)+'.'),h('p',{class:'hint'},it.kind==='vanity'?'Belongs to the server. Anyone with Manage Server can use it.':it.kind==='boost'?'Belongs to the target you pick: a server, your account, or the person you gift it to. It cannot be refunded.':'Belongs to your account.'),where),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),h('button',{class:'btn pri',on:{click:async e=>{
e.target.disabled=true
try{
const b={item:it.id,req:rid()}
if(it.kind==='boost')b.target=mode
if(mode==='server')b.server_id=sel.value
if(mode==='user')b.user=who.value
await POST('/api/pars/buy',b)
toast('Purchased '+it.name)
close();load()
}catch(x){e.target.disabled=false;fail(x)}
}}},'Buy for '+it.price)]})
return dlg
}
}
export async function parsAdmin(pg){
const d=await GET('/api/admin/pars')
const cfg=Object.entries(d.cfg).map(([k,v])=>{
const i=h('input',{class:'inp',type:'number',value:String(v),style:{width:'110px'}})
return{k,i,row:h('div',{class:'row sp',style:{padding:'4px 0'}},h('span',null,k),i)}
})
const save=h('button',{class:'btn',on:{click:async()=>{try{const b={};for(const c of cfg)b[c.k]=Number(c.i.value);await PUT('/api/admin/pars/config',b);toast('Saved')}catch(e){fail(e)}}}},'Save settings')
const items=d.items.map(it=>{
const pr=h('input',{class:'inp',type:'number',value:String(it.price),style:{width:'90px'}})
const en=h('input',{type:'checkbox',checked:!!it.enabled})
const b=h('button',{class:'btn sm',on:{click:async()=>{try{await PUT('/api/admin/pars/items/'+it.id,{price:Number(pr.value),enabled:en.checked});toast('Saved')}catch(e){fail(e)}}}},'Save')
return h('div',{class:'row sp',style:{padding:'4px 0'}},h('span',null,it.name),h('span',{class:'row',style:{gap:'8px'}},pr,h('label',null,en,' on'),b))
})
const who=h('input',{class:'inp',placeholder:'Username'}),amt=h('input',{class:'inp',type:'number',placeholder:'Amount (negative removes)',style:{width:'170px'}}),why=h('input',{class:'inp',placeholder:'Reason'})
const gr=h('button',{class:'btn',on:{click:async()=>{try{await POST('/api/admin/pars/grant',{user:who.value,amount:Number(amt.value),note:why.value});toast('Done')}catch(e){fail(e)}}}},'Grant or adjust')
return h('section',{class:'lab'},h('h3',null,'Pars'),h('p',{class:'hint'},d.total_supply+' Pars held by '+d.holders+' people.'),cfg.map(c=>c.row),save,h('h4',null,'Prices'),items,h('h4',null,'Bonus Pars'),h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},who,amt,why,gr))
}
