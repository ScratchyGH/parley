import{h,mount,icon,GET,POST,PUT,fail,toast,field,dialog,rid,fmtRel,avatar}from'./util.js'
import{S,on}from'./state.js'
import{sv,svg}from'./svg.js'
import{checkGifts}from'./giftreveal.js'

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
setTimeout(checkGifts,3000)
on('pars.gift',()=>checkGifts())
}
export const parIcon=(s=18)=>svg(s,'0 0 24 24',sv('circle',{cx:'12',cy:'12',r:'10',fill:'#f5c542'}),sv('circle',{cx:'12',cy:'12',r:'7',fill:'none',stroke:'#92400e','stroke-width':'1.6'}),sv('path',{d:'M10 16V8h3a2.2 2.2 0 0 1 0 4.4h-3',fill:'none',stroke:'#92400e','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round'}))
const KINDS=[['vanity','Server upgrades'],['boost','Upload boosts'],['frame','Avatar frames'],['effect','Avatar effects'],['nameplate','Nameplates'],['namefx','Name styles'],['badge','Badges'],['title','Titles'],['bubble','Message styles']]
const EQ=['nameplate','frame','effect','namefx','badge','title','bubble']
const COS=new Set(EQ)
const bundleData=it=>{try{return JSON.parse(it.data||'{}')}catch{return{}}}
const variantsOf=it=>{const d=bundleData(it);return d.variants||{main:{label:'Bundle',items:d.items||[],vanity_days:d.vanity_days||0,price:it.price,gift_price:it.price,server_price:0}}}
const owns=(d,id,sid)=>d.owned.some(o=>o.item_id===id&&(sid===undefined||o.server_id===sid))
const marker=(it,k)=>'bundle:'+it.id+':'+k
const nameOf=(d,id)=>(d.items.find(i=>i.id===id)||{name:id}).name
const left=ms=>{const s=Math.max(0,Math.floor(ms/1000)),dd=Math.floor(s/86400),hh=Math.floor(s%86400/3600),mm=Math.floor(s%3600/60),ss=s%60;return(dd?dd+'d ':'')+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')}
export function swatch(it){
if(it.kind==='nameplate')return h('div',{class:'np par-np '+it.id},S.me.display_name)
if(it.kind==='frame')return h('div',{class:'par-av'},avatar({...S.me,frame:it.id,effect:null},'lg'))
if(it.kind==='effect')return h('div',{class:'par-av'},avatar({...S.me,effect:it.id,frame:null},'lg'))
if(it.kind==='namefx')return h('div',{class:'par-np'},h('b',null,h('span',{class:'nf '+it.id},S.me.display_name)))
if(it.kind==='badge')return h('div',{class:'par-np'},h('b',null,S.me.display_name,h('span',{class:'bdg-i '+it.id})))
if(it.kind==='title')return h('div',{class:'par-np'},h('b',null,S.me.display_name,h('span',{class:'ttl '+it.id})))
if(it.kind==='bubble')return h('div',{class:'par-msg '+it.id},h('b',null,S.me.display_name),' Hey, this is how your messages will look.')
if(it.kind==='vanity')return h('div',{class:'par-big'},h('span',{class:'par-bi'},icon('link')),h('b',null,'/your-name'))
if(it.kind==='boost')return h('div',{class:'par-big'},h('span',{class:'par-bi'},icon('upload')),h('b',null,'+'+it.mb+' MB'))
return null
}
export function parsPage(pg){
const box=h('div',null,h('div',{class:'hint'},'Loading'))
mount(pg,box)
let tick=[]
load()
async function load(){
try{
const d=await GET('/api/pars')
S.me.pars=d.balance
for(const k of EQ)S.me[k]=d[k]
draw(d)
}catch(e){mount(box,h('div',{class:'hint'},e.message))}
}
const sec=(id,title,sub,...kids)=>h('section',{class:'par-sec',id:'sh-'+id},h('h3',null,title,sub?h('small',null,sub):null),...kids)
function draw(d){
tick.forEach(clearInterval);tick=[]
const hrs=(d.today_ms/3600000).toFixed(1)
const pct=Math.min(100,Math.round(d.today_ms/(d.daily_cap_hours*36000)))
const items=d.items.filter(i=>!i.hidden)
const bn=items.filter(i=>i.kind==='bundle')
const tss=bn.filter(i=>bundleData(i).limited&&bundleData(i).ends_at>Date.now()).sort((a,b)=>bundleData(a).ends_at-bundleData(b).ends_at)
const reg=bn.filter(i=>!tss.includes(i)&&!(bundleData(i).ends_at&&bundleData(i).ends_at<=Date.now()))
const cats=KINDS.filter(([k])=>items.some(i=>i.kind===k))
const go=id=>document.getElementById('sh-'+id)?.scrollIntoView({behavior:'smooth',block:'start'})
mount(box,
h('div',{class:'par-hero'},parIcon(40),h('div',{style:{flex:'1',minWidth:0}},h('div',{class:'par-bal'},String(d.balance)),h('div',{class:'hint',style:{margin:'4px 0 0'}},'Earn '+d.rate+' Pars for every hour you actively use Parley. Today: '+hrs+' of '+d.daily_cap_hours+' hours counted.'),h('div',{class:'par-bar'},h('i',{style:{width:pct+'%'}})),h('div',{class:'hint',style:{margin:'6px 0 0'}},d.notice))),
h('nav',{class:'sh-nav','aria-label':'Shop sections'},[...tss.map(i=>['ts-'+i.id,i.name]),reg.length?['bn','Bundles']:null,...cats.map(([k,l])=>[k,l]),['gift','Gift Pars'],['own','Your items']].filter(Boolean).map(([id,l])=>h('button',{on:{click:()=>go(id)}},l))),
...tss.map(i=>tsSection(d,i)),
reg.length?sec('bn','Bundles','Hover to pause',carousel(d,reg)):null,
...cats.map(([k,l])=>sec(k,l,null,h('div',{class:'par-grid'},items.filter(i=>i.kind===k).map(it=>card(d,it))))),
sec('gift','Gift Pars',null,giftBox(d)),
sec('own','Your items',null,own(d)),
sec('hist','History',null,hist(d)))
}
function giftBtn(d,it,vk){
return h('button',{class:'gift-b',title:'Send as a gift',on:{click:()=>giftDialog(d,it,vk)}},icon('gift'))
}
function card(d,it){
const have=COS.has(it.kind)&&owns(d,it.id)
const eq=d[it.kind]===it.id
const cant=d.balance<it.price
return h('div',{class:'par-card'},h('div',{class:'pc-top'},swatch(it)),h('b',null,it.name),h('div',{class:'hint',style:{margin:0}},it.descr),h('div',{class:'pc-act'},h('span',{class:'par-price'},parIcon(14),' '+it.price),have?h('button',{class:'btn sm',on:{click:async()=>{try{await POST('/api/pars/equip',{kind:it.kind,item:eq?null:it.id});load()}catch(e){fail(e)}}}},eq?'Unequip':'Equip'):h('button',{class:'btn sm pri',disabled:cant,title:cant?'You need '+(it.price-d.balance)+' more Pars':'',on:{click:()=>buy(d,it)}},'Buy'),giftBtn(d,it)))
}
function preview(d,it,v){
const ids=v.items||[]
const by=k=>d.items.find(i=>ids.includes(i.id)&&i.kind===k)?.id||null
const np=by('nameplate'),fr=by('frame'),ef=by('effect'),nf=by('namefx'),bd=by('badge'),ti=by('title'),bb=by('bubble')
const name=nf?h('span',{class:'nf '+nf},S.me.display_name):S.me.display_name
const kids=[h('div',{class:'par-av'},avatar({...S.me,frame:fr,effect:ef},'lg')),h('b',{class:np?'np '+np:null,style:{padding:'4px 12px'}},name,bd?h('span',{class:'bdg-i '+bd}):null,ti?h('span',{class:'ttl '+ti}):null)]
if(bb)kids.push(h('div',{class:'par-msg '+bb},'Your messages look like this.'))
return h('div',{class:'pb-prev'},...kids)
}
function contents(d,v,prev){
const names=(v.items||[]).map(id=>{const nm=nameOf(d,id);return h('span',{class:prev&&prev.items?.includes(id)?'':'plus'},nm.replace(/ (nameplate|frame|badge|title|message style|effect)$/i,m=>m))})
if(v.vanity_days)names.push(h('span',{class:'plus'},'Vanity link for '+(v.vanity_days>=365?'1 year':v.vanity_days+' days')))
return h('div',{class:'pb-list'},names)
}
function bundleCard(d,it,cls,clone){
const vs=variantsOf(it),keys=Object.keys(vs)
let key=keys[keys.length-1]
const wrap=h('div',{class:cls})
if(clone){wrap.setAttribute('data-clone','1');wrap.setAttribute('aria-hidden','true');wrap.inert=true}
const draw=()=>{
const v=vs[key]
const have=owns(d,marker(it,key))
const cant=d.balance<v.price
const toggle=keys.length>1?h('div',{class:'vt',role:'group','aria-label':'Version'},keys.map(k=>h('button',{class:k===key?'on':'','aria-pressed':String(k===key),on:{click:()=>{key=k;draw()}}},vs[k].label))):null
const prev=key==='modern'?vs.legacy:null
mount(wrap,preview(d,it,v),h('b',{style:{fontSize:'17px',color:'var(--strong)'}},it.name),toggle,contents(d,v,prev),h('div',{class:'hint',style:{margin:0,minHeight:'2.6em'}},key==='legacy'?'The classic set, as it was before the update.':key==='modern'?'Everything in Legacy, plus the new extras (highlighted).':it.descr),h('div',{class:'pc-act'},h('span',{class:'par-price'},parIcon(14),' '+v.price),h('button',{class:'btn pri',disabled:have||cant,title:have?'You already own this':cant?'You need '+(v.price-d.balance)+' more Pars':'',on:{click:()=>buy(d,it,key)}},have?'Owned':'Buy'),giftBtn(d,it,key)))
}
draw()
return wrap
}
function carousel(d,list){
const track=h('div',{class:'car-track',style:{'--dur':Math.max(30,list.length*14)+'s'}},list.map(it=>bundleCard(d,it,'bcard',false)),list.map(it=>bundleCard(d,it,'bcard',true)))
return h('div',{class:'car'},track)
}
function tsSection(d,it){
const bd=bundleData(it),v=variantsOf(it).main,end=bd.ends_at,start=bd.starts_at||0
const soon=start>Date.now()
const have=owns(d,marker(it,'main'))
const cant=d.balance<v.price
const clock=h('span',{class:'ts-time'})
const upd=()=>{const n=Date.now();if(n<start){clock.textContent='Starts in '+left(start-n)}else{const ms=end-n;clock.textContent=ms>0?left(ms)+' left':'Ended'}}
upd();const t=setInterval(()=>{if(!clock.isConnected){clearInterval(t);return}upd()},1000);tick.push(t)
const tag=soon?'Admin preview · starts '+new Date(start).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'Limited time'
return h('section',{class:'par-sec',id:'sh-ts-'+it.id},h('div',{class:'ts'+(bd.season?' sx-'+bd.season:'')},h('div',{class:'pb-prev'},preview(d,it,v)),h('div',{style:{display:'flex',flexDirection:'column',gap:'10px',minWidth:0}},h('span',{class:'ts-tag'},tag),h('h3',null,it.name),h('div',{class:'hint',style:{margin:0}},it.descr),contents(d,v),clock),h('div',{class:'pb-buy'},h('span',{class:'par-price'},parIcon(20),' '+v.price),h('div',{class:'row',style:{gap:'8px'}},h('button',{class:'btn pri',disabled:have||cant,title:have?'You already own this':cant?'You need '+(v.price-d.balance)+' more Pars':'',on:{click:()=>buy(d,it,'main')}},have?'Owned':'Get the bundle'),giftBtn(d,it,'main')),h('span',{class:'hint',style:{margin:0,color:'#c7d2fe'}},'Gifts cost '+v.gift_price+' and include everything except the vanity link.'))))
}
function own(d){
const rows=d.owned.filter(o=>!String(o.item_id).startsWith('bundle:'))
if(!rows.length)return h('div',{class:'hint'},'Nothing yet.')
return h('div',null,h('div',{class:'hint'},'Account upload boost: +'+d.account_boost_mb+' MB.'),rows.map(o=>h('div',{class:'row sp',style:{padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('span',null,nameOf(d,o.item_id)+(o.server_name?' on '+o.server_name:'')+(o.gift_from&&!String(o.gift_from).startsWith('bundle:')?' (gift)':'')+(o.expires_at?' until '+new Date(o.expires_at).toLocaleDateString():'')),h('span',{class:'hint',style:{margin:0}},fmtRel(o.created_at)))))
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
return h('div',null,h('div',{class:'hint'},'Send Pars to another person. Gifts are final and limited per day. Pars have no cash value.'),h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},to,amt,nt,go))
}
async function send(b,label){
await POST('/api/pars/buy',{...b,req:rid()})
toast(label)
load()
}
function giftDialog(d,it,vk){
const isB=it.kind==='bundle'
const v=isB?variantsOf(it)[vk]:null
const giftPrice=isB?v.gift_price:it.price
const serverPrice=isB?v.server_price:it.price
const canGift=isB||COS.has(it.kind)||it.kind==='boost'
const canServer=it.kind==='vanity'||it.kind==='boost'||(isB&&v.vanity_days>0)
let tab=canGift?'friend':'server'
const body=h('div',{class:'bd gd'})
const q=h('input',{class:'inp',placeholder:'Search friends',style:{marginBottom:'8px'}})
const price=tab=>tab==='friend'?giftPrice:serverPrice
const confirmBtn=(label,cost,fn)=>{
const b=h('button',{class:'btn sm pri',disabled:d.balance<cost,title:d.balance<cost?'You need '+(cost-d.balance)+' more Pars':''},label+' · '+cost)
let armed=false
b.addEventListener('click',async()=>{
if(!armed){armed=true;b.textContent='Confirm';setTimeout(()=>{if(b.isConnected&&armed){armed=false;b.textContent=label+' · '+cost}},3500);return}
b.disabled=true
try{await fn();dlg.close?.()}catch(e){b.disabled=false;armed=false;b.textContent=label+' · '+cost;fail(e)}
})
return b
}
const friends=()=>{
const f=(S.fr.friends||[]).filter(u=>!q.value.trim()||(u.display_name+' '+u.username).toLowerCase().includes(q.value.trim().toLowerCase()))
if(!f.length)return h('div',{class:'hint',style:{padding:'12px'}},S.fr.friends?.length?'No friends match that search.':'Add friends to send them gifts.')
return f.map(u=>h('div',{class:'gd-row'},avatar(u,'sm'),h('div',{class:'nm'},h('b',null,u.display_name),h('span',null,'@'+u.username)),confirmBtn('Gift',giftPrice,()=>send(it.kind==='boost'?{item:it.id,target:'user',user:u.username}:{item:it.id,variant:isB?vk:undefined,to:u.username},'Gift sent to '+u.display_name))))
}
const servers=()=>{
if(!S.servers.length)return h('div',{class:'hint',style:{padding:'12px'}},'You are not in any servers.')
return S.servers.map(s=>h('div',{class:'gd-row'},avatar({id:s.id,name:s.name,icon_id:s.icon_id},'sm'),h('div',{class:'nm'},h('b',null,s.name)),confirmBtn('Apply',serverPrice,()=>send(isB?{item:it.id,variant:vk,target:'server',server_id:s.id}:it.kind==='boost'?{item:it.id,target:'server',server_id:s.id}:{item:it.id,server_id:s.id},it.name+' applied to '+s.name))))
}
const draw=()=>{
const list=h('div',{class:'gd-list'})
if(tab==='friend'){mount(list,friends());q.oninput=()=>mount(list,friends())}else mount(list,servers())
mount(body,
h('div',{class:'tabs'},h('button',{class:tab==='friend'?'on':'',disabled:!canGift,title:canGift?'':'This can only be applied to a server',on:{click:()=>{tab='friend';draw()}}},'Gift to someone'),h('button',{class:tab==='server'?'on':'',disabled:!canServer,title:canServer?'':'Cosmetics belong to a person, not a server',on:{click:()=>{tab='server';draw()}}},'Purchase for server')),
h('p',{class:'hint',style:{marginTop:0}},tab==='friend'?(it.name+(isB?' ('+v.label+')':'')+' as a gift for '+giftPrice+' Pars.'+(isB&&v.vanity_days?' Gifts include the cosmetics but not the vanity link.':'')):(isB?'The '+(v.vanity_days>=365?'1 year':v.vanity_days+' day')+' vanity link from this bundle, applied to a server you manage, for '+serverPrice+' Pars.':it.name+' for the server you pick, for '+it.price+' Pars.')),
tab==='friend'?q:null,list)
}
const dlg=dialog('Send a gift',body,{})
draw()
return dlg
}
async function buy(d,it,vk){
const isB=it.kind==='bundle'
const v=isB?variantsOf(it)[vk]:null
const price=isB?v.price:it.price
const bv=isB&&v.vanity_days
let mode=it.kind==='vanity'||bv?'server':it.kind==='boost'?'server':'self'
const sel=h('select',{class:'sel'},S.servers.map(s=>h('option',{value:s.id},s.name)))
const who=h('input',{class:'inp',placeholder:'Username to gift to',maxLength:24})
const where=h('div',null)
const modes=it.kind==='boost'?[['server','A server I am in'],['self','My account'],['user','Gift to someone']]:[]
const drawW=()=>mount(where,modes.length?h('div',{class:'tabs',style:{marginBottom:'8px'}},modes.map(([k,l])=>h('button',{class:mode===k?'on':'',on:{click:()=>{mode=k;drawW()}}},l))):null,mode==='server'||bv?field('Server',sel):null,mode==='user'?field('Person',who):null)
drawW()
return dialog('Confirm purchase',h('div',{class:'bd'},h('p',null,h('b',null,it.name+(isB&&Object.keys(variantsOf(it)).length>1?' ('+v.label+')':'')),' for ',h('b',null,price+' Pars'),'. You have '+d.balance+', leaving '+(d.balance-price)+'.'),h('p',{class:'hint'},bv?'The vanity link is added to the server you pick for '+(bv>=365?'1 year':bv+' days')+'. You can only buy each bundle once.':isB?'You can only buy each bundle once. Items you already own are not charged again, but the price stays the same.':it.kind==='vanity'?'Belongs to the server. Anyone with Manage Server can use it.':it.kind==='boost'?'Belongs to the target you pick: a server, your account, or the person you gift it to. It cannot be refunded.':'Belongs to your account.'),where),{footer:close=>[h('button',{class:'btn',on:{click:close}},'Cancel'),h('button',{class:'btn pri',on:{click:async e=>{
e.target.disabled=true
try{
const b={item:it.id,req:rid()}
if(isB)b.variant=vk
if(it.kind==='boost')b.target=mode
if(mode==='server'||bv)b.server_id=sel.value
if(mode==='user')b.user=who.value
await POST('/api/pars/buy',b)
toast('Purchased '+it.name)
close();load()
}catch(x){e.target.disabled=false;fail(x)}
}}},'Buy for '+price)]})
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
export function loadoutBox(){
const KS=[['frame','Avatar frame'],['effect','Avatar effect'],['nameplate','Nameplate'],['namefx','Name style'],['badge','Badge'],['title','Title'],['bubble','Message style']]
const box=h('div',{class:'lo'},h('div',{class:'hint'},'Loading'))
const key='parley.looks'
const looks=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}}
const saveLooks=a=>{try{localStorage.setItem(key,JSON.stringify(a.slice(0,8)))}catch{}}
let d=null
async function load(){
try{d=await GET('/api/pars');for(const[k]of KS)S.me[k]=d[k];draw()}catch(e){mount(box,h('div',{class:'hint'},e.message))}
}
const mine=k=>d.items.filter(i=>i.kind===k&&owns(d,i.id))
async function set(k,v){
try{await POST('/api/pars/equip',{kind:k,item:v||null});S.me[k]=v||null;d[k]=v||null;draw()}catch(e){fail(e)}
}
async function apply(l){
try{for(const[k]of KS){const v=l[k]&&owns(d,l[k])?l[k]:null;await POST('/api/pars/equip',{kind:k,item:v});S.me[k]=v;d[k]=v}draw();toast('Look applied')}catch(e){fail(e)}
}
function draw(){
const cur=Object.fromEntries(KS.map(([k])=>[k,d[k]||null]))
const nm=cur.namefx?h('span',{class:'nf '+cur.namefx},S.me.display_name):S.me.display_name
const prev=h('div',{class:'pb-prev lo-prev'},h('div',{class:'par-av'},avatar({...S.me,frame:cur.frame,effect:cur.effect},'lg')),h('b',{class:cur.nameplate?'np '+cur.nameplate:null,style:{padding:'4px 12px'}},nm,cur.badge?h('span',{class:'bdg-i '+cur.badge}):null,cur.title?h('span',{class:'ttl '+cur.title}):null),cur.bubble?h('div',{class:'par-msg '+cur.bubble},'Your messages look like this.'):null)
const sels=KS.map(([k,l])=>{
const list=mine(k)
const s=h('select',{class:'sel','aria-label':l,on:{change:e=>set(k,e.target.value)}},h('option',{value:''},'None'),...list.map(i=>h('option',{value:i.id,selected:cur[k]===i.id},i.name)))
return h('label',{class:'lo-f'},h('span',null,l+(list.length?'':' (none owned)')),s)
})
const ls=looks()
const nameIn=h('input',{class:'inp',placeholder:'Name this look',maxlength:24,'aria-label':'Look name'})
const saved=h('div',{class:'lo-saved'},ls.length?ls.map((l,i)=>h('span',{class:'lo-chip'},h('button',{class:'btn sm',on:{click:()=>apply(l)}},l.name),h('button',{class:'btn sm',title:'Delete look','aria-label':'Delete '+l.name,on:{click:()=>{const a=looks();a.splice(i,1);saveLooks(a);draw()}}},'×'))):h('span',{class:'hint',style:{margin:0}},'No saved looks yet.'))
mount(box,h('div',{class:'lo-grid'},prev,h('div',{class:'lo-sels'},...sels)),h('div',{class:'row',style:{gap:'8px',marginTop:'12px',flexWrap:'wrap'}},nameIn,h('button',{class:'btn',on:{click:()=>{const n=nameIn.value.trim();if(!n)return;const a=looks().filter(x=>x.name!==n);a.unshift({name:n,...cur});saveLooks(a);draw();toast('Look saved on this device')}}},'Save this look')),saved,h('div',{class:'hint'},'Mix any items you own. Get more in the Pars shop.'))
}
load()
return box
}
export async function seasonAdmin(pg){
const d=await GET('/api/pars')
const list=d.items.filter(i=>i.kind==='bundle'&&bundleData(i).season).sort((a,b)=>bundleData(a).starts_at-bundleData(b).starts_at)
const fmt=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})
const prev=v=>{
const ids=v.items||[]
const by=k=>d.items.find(i=>ids.includes(i.id)&&i.kind===k)?.id||null
const np=by('nameplate'),nf=by('namefx'),bd=by('badge'),ti=by('title'),bb=by('bubble')
const name=nf?h('span',{class:'nf '+nf},S.me.display_name):S.me.display_name
const kids=[h('div',{class:'par-av'},avatar({...S.me,frame:by('frame'),effect:by('effect')},'lg')),h('b',{class:np?'np '+np:null,style:{padding:'4px 12px'}},name,bd?h('span',{class:'bdg-i '+bd}):null,ti?h('span',{class:'ttl '+ti}):null)]
if(bb)kids.push(h('div',{class:'par-msg '+bb},'Your messages look like this.'))
return h('div',{class:'pb-prev'},...kids)
}
const card=it=>{
const bd=bundleData(it),v=variantsOf(it).main
const btn=h('button',{class:'btn sm',on:{click:async()=>{btn.disabled=true;try{await POST('/api/pars/buy',{item:it.id,variant:'main',req:rid()});toast('Purchased '+it.name)}catch(e){fail(e)}finally{btn.disabled=false}}}},'Test buy')
return h('div',{class:'sa-card'},h('div',{class:'ts sx-'+bd.season,style:{gridTemplateColumns:'1fr',padding:'16px'}},prev(v),h('div',{style:{display:'flex',flexDirection:'column',gap:'6px'}},h('span',{class:'ts-tag'},bd.status==='live'?'Live now':'Starts '+fmt(bd.starts_at)),h('h3',null,it.name),h('div',{class:'hint',style:{margin:0}},fmt(bd.starts_at)+' to '+fmt(bd.ends_at)+' (UTC)'),h('div',{class:'pb-list'},(v.items||[]).map(id=>h('span',null,nameOf(d,id)))),h('div',{class:'row',style:{gap:'8px',alignItems:'center'}},h('span',{class:'par-price'},parIcon(16),' '+v.price),btn))))
}
return h('section',{class:'lab'},h('h3',null,'Seasonal bundles'),h('p',{class:'hint'},'Everyone else only sees a bundle while its window is live. You can preview and buy any of them at any time.'),h('div',{class:'sa-grid'},list.map(card)))
}
