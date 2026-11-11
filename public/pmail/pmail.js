const $=document.getElementById('app')
const root=document.documentElement
const h=(t,a,...k)=>{
const e=document.createElement(t)
for(const[n,v]of Object.entries(a||{})){
if(v==null||v===false)continue
if(n==='class')e.className=v
else if(n.startsWith('on'))e.addEventListener(n.slice(2),v)
else if(n==='value')e.value=v
else if(n==='checked')e.checked=!!v
else e.setAttribute(n,v===true?'':v)
}
for(const c of k.flat(9)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}
return e
}
const mount=(el,...k)=>{el.replaceChildren(...k.flat(9).filter(Boolean))}
async function api(m,p,b){
const r=await fetch('/api/pmail'+p,{method:m,headers:b?{'content-type':'application/json'}:{},body:b?JSON.stringify(b):undefined,credentials:'same-origin',referrerPolicy:'no-referrer'})
const j=await r.json().catch(()=>({}))
if(!r.ok){const e=new Error(j.error||'Error '+r.status);e.status=r.status;throw e}
return j
}
let DOM='pmail.parley'
const S={me:null,folder:'inbox',items:[],more:false,sel:null,msg:null,q:'',busy:false}
const PRESETS={midnight:['#0e1116','#6ea8fe'],paper:['#f4f1ea','#a8431f'],forest:['#0d1511','#59d38a'],rose:['#17101a','#f27aa8'],mono:['#0a0a0a','#ffffff'],terminal:['#050805','#3dff7a']}
function theme(p){
p=p||{}
root.dataset.preset=p.preset||'midnight'
for(const k of['density','layout','font','width','radius'])root.dataset[k]=p[k]||({density:'comfortable',layout:'three',font:'system',width:'medium',radius:'soft'})[k]
for(const[k,v]of[['--accent',p.accent],['--bg',p.bg],['--text',p.text]]){if(v)root.style.setProperty(k,v);else root.style.removeProperty(k)}
if(p.accent){
const n=parseInt(p.accent.slice(1),16),l=((n>>16)*299+((n>>8)&255)*587+(n&255)*114)/1000
root.style.setProperty('--on',l>150?'#0b0b0b':'#ffffff')
}else root.style.removeProperty('--on')
}
function toast(t){const e=h('div',{class:'toast',role:'status'},t);document.body.append(e);setTimeout(()=>e.remove(),2600)}
const TRACK=/^(utm_.*|fbclid|gclid|gclsrc|dclid|msclkid|mc_eid|mc_cid|igshid|igsh|yclid|_hsenc|_hsmi|mkt_tok|spm|s_cid|vero_id|oly_enc_id|oly_anon_id|trk|trkcampaign|wickedid|twclid|ttclid|li_fat_id|ref_src|ref_url|cmpid|cid|campaign_id|ad_id|si|pk_campaign|pk_kwd|_ga|_gl|scid|sc_cid|epik|ck_subscriber_id)$/i
function cleanUrl(raw){
let u
try{u=new URL(raw)}catch{return null}
if(!/^https?:$/.test(u.protocol))return null
let n=0
for(const k of[...u.searchParams.keys()])if(TRACK.test(k)){u.searchParams.delete(k);n++}
if(/^(www\.)?(youtube\.com|youtu\.be)$/.test(u.hostname)){}
return{href:u.href,host:u.hostname,n}
}
let shielded=0
function body(text){
shielded=0
const out=[]
const re=/https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]/gi
let last=0,m
while((m=re.exec(text))){
out.push(text.slice(last,m.index))
const c=cleanUrl(m[0])
if(c){
shielded+=c.n
out.push(h('a',{href:c.href,target:'_blank',rel:'noopener noreferrer nofollow',referrerpolicy:'no-referrer',title:'Opens '+c.host+(c.n?' after removing '+c.n+' tracking parameter'+(c.n>1?'s':''):'')},c.href.length>70?c.href.slice(0,67)+'...':c.href))
out.push(h('span',{class:'shield'},c.host+(c.n?' · '+c.n+' tracker'+(c.n>1?'s':'')+' removed':'')))
}else out.push(m[0])
last=m.index+m[0].length
}
out.push(text.slice(last))
return out
}
const fmt=ts=>{
const d=new Date(ts),n=new Date()
if(d.toDateString()===n.toDateString())return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
if(d.getFullYear()===n.getFullYear())return d.toLocaleDateString([],{month:'short',day:'numeric'})
return d.toLocaleDateString([],{year:'numeric',month:'short',day:'numeric'})
}
const full=ts=>new Date(ts).toLocaleString([],{dateStyle:'medium',timeStyle:'short'})
const hero=()=>h('section',{class:'hero'},h('div',null,h('h1',{class:'mark'},'P',h('b',null,'Mail')),h('p',{class:'tag'},'Mail that keeps to itself.')),h('ol',{class:'promises'},
h('li',null,h('i',null,'01'),h('div',null,h('b',null,'Nothing tracks you'),h('span',null,'Plain text only. No pixels, no remote images, links cleaned of trackers.'))),
h('li',null,h('i',null,'02'),h('div',null,h('b',null,'Sealed before it is stored'),h('span',null,'Every message is encrypted to your own key. Your password opens it.'))),
h('li',null,h('i',null,'03'),h('div',null,h('b',null,'Yours to arrange'),h('span',null,'Throwaway aliases, rules, folders, themes and layouts.')))))
const page=box=>mount($,h('div',{class:'auth'},hero(),h('div',{class:'formside'},box)))
function auth(){
theme({})
let owner=false
api('GET','/check?local=aaa').then(r=>{if(r.domain&&r.domain!==DOM){DOM=r.domain;for(const e of document.querySelectorAll('.addr span'))e.textContent='@'+DOM}}).catch(()=>{})
let mode='in'
const box=h('div',{class:'authbox'})
const draw=()=>{
const err=h('div',{class:'err',role:'alert'})
const a=h('input',{autocomplete:'username',autocapitalize:'none',spellcheck:'false',placeholder:'yourname',maxlength:'30'})
const pw=h('input',{type:'password',autocomplete:mode==='up'?'new-password':'current-password',placeholder:mode==='up'?'At least 10 characters':'Password'})
const dn=h('input',{placeholder:'Optional',maxlength:'40'})
const go=h('button',{class:'btn pri',type:'submit'},mode==='up'?'Create my PMail':'Sign in')
const dom=DOM
const form=h('form',{onsubmit:async e=>{
e.preventDefault()
go.disabled=true;err.textContent=''
try{
if(mode==='up'){
const r=await api('POST','/signup',{local:a.value.trim().toLowerCase(),password:pw.value,display:dn.value})
recovery(r)
}else{
await api('POST','/login',{address:a.value.trim().toLowerCase(),password:pw.value})
await boot()
}
}catch(x){err.textContent=x.message;go.disabled=false}
}},
h('label',{class:'f'},h('span',null,mode==='up'?'Choose your address':'Address'),h('div',{class:'addr'},a,h('span',null,'@'+dom))),
mode==='up'?h('label',{class:'f'},h('span',null,'Name shown on messages'),dn):null,
h('label',{class:'f'},h('span',null,'Password'),pw),
mode==='in'?h('p',{class:'hint'},h('a',{href:'#',onclick:e=>{e.preventDefault();reset()}},'Forgot your password? Use your recovery code.')):h('p',{class:'hint'},'Your password encrypts your mailbox. Nobody, including us, can reset it without your recovery code.'),
err,go)
if(mode==='up'){let t;a.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(async()=>{const v=a.value.trim().toLowerCase();if(v.length<3){err.textContent='';return}try{const r=await api('GET','/check?local='+encodeURIComponent(v));err.textContent=r.ok?'':r.reason;err.className=r.ok?'err ok':'err'}catch{}},350)})}
mount(box,
h('h2',null,mode==='up'?'Get your address':'Welcome back'),
h('div',{class:'tabs'},h('button',{class:mode==='in'?'on':'',type:'button',onclick:()=>{mode='in';draw()}},'Sign in'),h('button',{class:mode==='up'?'on':'',type:'button',onclick:()=>{mode='up';draw()}},'Create PMail')),
form,
owner?h('p',{class:'hint'},h('a',{href:'#',onclick:async e=>{e.preventDefault();try{await api('POST','/owner-open',{});await boot()}catch(x){toast(x.message)}}},'Open parley@'+DOM+' as the Parley owner')):null
)
a.focus()
}
draw()
page(box)
api('GET','/owner-status').then(r=>{if(r.owner){owner=true;draw()}}).catch(()=>{})
}
function recovery(r){
const box=h('div',{class:'authbox'})
mount(box,h('h2',null,'Welcome, '+r.address.split('@')[0]),
h('p',null,'Your address is ',h('b',null,r.address),'.'),
h('div',{class:'rec'},h('div',{class:'hint'},'Your recovery code. Shown once.'),h('code',null,r.recovery),h('div',{class:'hint'},'Write it down or save it in a password manager. If you forget your password it is the only way to open your mail.')),
h('button',{class:'btn pri',onclick:()=>boot()},'I saved it, open my inbox'))
page(box)
}
function reset(){
const err=h('div',{class:'err',role:'alert'})
const a=h('input',{placeholder:'yourname',autocapitalize:'none'}),rc=h('input',{placeholder:'xxxxx-xxxxx-xxxxx-xxxxx',autocapitalize:'none',spellcheck:'false'}),pw=h('input',{type:'password',autocomplete:'new-password',placeholder:'At least 10 characters'})
const box=h('div',{class:'authbox'},h('h2',null,'Reset password'),h('p',{class:'hint'},'Enter your address and recovery code. Your mail stays intact.'),
h('form',{onsubmit:async e=>{e.preventDefault();err.textContent='';try{await api('POST','/reset',{address:a.value,recovery:rc.value,next:pw.value});toast('Password changed. Sign in.');auth()}catch(x){err.textContent=x.message}}},
h('label',{class:'f'},h('span',null,'Address'),a),h('label',{class:'f'},h('span',null,'Recovery code'),rc),h('label',{class:'f'},h('span',null,'New password'),pw),err,
h('div',{},h('button',{class:'btn pri',type:'submit'},'Set new password'),' ',h('button',{class:'btn',type:'button',onclick:auth},'Back'))))
page(box)
}
const NAMES={inbox:'Inbox',starred:'Starred',sent:'Sent',archive:'Archive',trash:'Trash'}
const fname=f=>NAMES[f]||(f.startsWith('f:')?f.slice(2):f)
async function load(more){
if(S.busy)return
S.busy=true
try{
const before=more&&S.items.length?S.items[S.items.length-1].ts:''
const r=await api('GET','/list?folder='+encodeURIComponent(S.folder)+(before?'&before='+before:''))
S.items=more?S.items.concat(r.items):r.items
S.more=r.more
}catch(e){if(e.status===401)return auth();toast(e.message)}
S.busy=false
paintList()
}
async function refreshMe(){
try{S.me=await api('GET','/me');theme(S.me.prefs)}catch(e){if(e.status===401)auth()}
}
const fold=()=>['inbox','starred','sent','archive','trash']
let pend=null
function shell(){
const side=h('nav',{class:'side',id:'side','aria-label':'Folders'})
const list=h('div',{class:'list',id:'list',tabindex:'-1'})
const read=h('article',{class:'read',id:'read'},h('div',{class:'empty'},'Select a message'))
const q=h('input',{type:'search',placeholder:'Search this folder',id:'q','aria-label':'Search this folder',value:S.q,oninput:e=>{S.q=e.target.value;paintList()}})
mount($,h('div',{class:'shell'},
h('header',{class:'top'},h('button',{class:'ico menu',onclick:()=>side.classList.toggle('open'),'aria-label':'Menu'},'☰'),h('h1',{class:'mk'},'P',h('b',null,'Mail')),q,h('span',{class:'sp'}),h('span',{class:'who'},S.me.address),h('button',{class:'btn sm',onclick:()=>settings()},'Settings'),h('button',{class:'btn sm',onclick:async()=>{try{await api('POST','/logout',{})}catch{}S.me=null;auth()}},'Sign out')),
h('div',{class:'cols'},side,list,read)))
paintSide()
paintList()
if(S.msg)paintMsg()
}
function paintSide(){
const side=document.getElementById('side')
if(!side)return
const c=S.me.counts||{}
const btn=(f,label)=>h('button',{class:'fo'+(S.folder===f?' on':''),onclick:()=>go(f)},label,(c[f]&&c[f].un&&f!=='trash'&&f!=='sent')?h('i',null,c[f].un):null)
mount(side,h('button',{class:'btn pri',onclick:()=>compose()},'Write'),
fold().map(f=>btn(f,NAMES[f])),
S.me.prefs.folders.length?h('h4',null,'Folders'):null,
S.me.prefs.folders.map(f=>btn('f:'+f,f)),
h('h4',null,'Your addresses'),
h('div',{class:'mine'},h('div',null,S.me.address),S.me.aliases.filter(a=>a.enabled).slice(0,4).map(a=>h('div',{title:a.label},a.addr+'@'+S.me.domain)),S.me.aliases.filter(a=>a.enabled).length>4?h('div',null,'and '+(S.me.aliases.filter(a=>a.enabled).length-4)+' more'):null))
}
async function go(f){
S.folder=f;S.sel=null;S.msg=null;S.items=[]
document.getElementById('side')?.classList.remove('open')
document.getElementById('read')?.classList.remove('open')
paintSide()
mount(document.getElementById('read'),h('div',{class:'empty'},'Select a message'))
await load()
}
function paintList(){
const el=document.getElementById('list')
if(!el)return
const q=S.q.trim().toLowerCase()
const items=q?S.items.filter(i=>(i.s+' '+i.fn+' '+i.from+' '+i.to+' '+i.sn).toLowerCase().includes(q)):S.items
mount(el,
S.busy&&!S.items.length?h('div',{class:'empty'},'Loading'):null,
!S.busy&&!items.length?h('div',{class:'empty'},q?'Nothing matches in the loaded messages.':'Nothing here yet.'):null,
items.map(i=>h('div',{class:'row'+(i.read?'':' un')+(S.sel===i.id?' on':''),tabindex:'0',role:'button',onclick:()=>openMsg(i.id),onkeydown:e=>{if(e.key==='Enter')openMsg(i.id)}},
h('span',{class:'fr'},S.folder==='sent'||i.folder==='sent'?'To '+i.to:(i.fn||i.from)),
h('span',{class:'dt'},i.star?h('span',{class:'star'},'★ '):null,fmt(i.ts)),
h('span',{class:'su'},i.s),
i.sn?h('span',{class:'sn'},i.sn):null)),
S.more?h('div',{class:'empty'},h('button',{class:'btn',onclick:()=>load(true)},'Load older')):null)
}
async function openMsg(id){
S.sel=id
paintList()
try{
S.msg=await api('GET','/msg/'+id)
const it=S.items.find(x=>x.id===id)
if(it&&!it.read){it.read=true;const c=S.me.counts[it.folder];if(c&&c.un)c.un--;if(it.star&&S.me.counts.starred.un)S.me.counts.starred.un--;paintSide();paintList()}
paintMsg()
document.getElementById('read').classList.add('open')
}catch(e){toast(e.message)}
}
async function act(path,body){try{await api('POST',path,body);await refreshMe();await load();paintSide()}catch(e){toast(e.message)}}
function paintMsg(){
const m=S.msg,el=document.getElementById('read')
if(!el||!m)return
const fm=S.me.prefs.folders
const mv=h('select',{'aria-label':'Move to',onchange:async e=>{const f=e.target.value;if(!f)return;await act('/msg/'+m.id,{folder:f});closeMsg();toast('Moved to '+fname(f))}},h('option',{value:''},'Move to'),['inbox','archive','trash'].filter(f=>f!==m.folder).map(f=>h('option',{value:f},NAMES[f])),fm.filter(f=>'f:'+f!==m.folder).map(f=>h('option',{value:'f:'+f},f)))
const nodes=body(m.b)
const shieldN=shielded
mount(el,
h('div',{class:'bar'},
h('button',{class:'btn sm back',onclick:closeMsg},'Back'),
h('button',{class:'btn sm',onclick:()=>compose({to:m.from,subject:/^re:/i.test(m.s)?m.s:'Re: '+m.s,body:'\n\n'+m.from+' wrote:\n'+m.b.split('\n').map(l=>'> '+l).join('\n'),sig:true})},'Reply'),
h('button',{class:'btn sm',onclick:()=>compose({subject:/^fwd:/i.test(m.s)?m.s:'Fwd: '+m.s,body:'\n\n---------- Forwarded ----------\nFrom: '+m.from+'\nDate: '+full(m.ts)+'\n\n'+m.b})},'Forward'),
h('button',{class:'btn sm',onclick:async()=>{await act('/msg/'+m.id,{star:!m.star});m.star=!m.star;paintMsg()}},m.star?'★ Starred':'☆ Star'),
h('button',{class:'btn sm',onclick:async()=>{await act('/msg/'+m.id,{read:false});closeMsg()}},'Mark unread'),
m.folder!=='archive'&&m.folder!=='sent'?h('button',{class:'btn sm',onclick:async()=>{await act('/msg/'+m.id,{folder:'archive'});closeMsg();toast('Archived')}},'Archive'):null,
mv,
h('button',{class:'btn sm dng',onclick:async()=>{await act('/delete-msg/'+m.id,{});closeMsg();toast(m.folder==='trash'?'Deleted for good':'Moved to Trash')}},m.folder==='trash'?'Delete forever':'Delete')),
h('h2',null,m.s),
h('dl',{class:'meta'},h('dt',null,'From'),h('dd',null,m.fn?m.fn+' <'+m.from+'>':m.from),h('dt',null,'To'),h('dd',null,(m.all||[m.to]).join(', ')),h('dt',null,'Date'),h('dd',null,full(m.ts))),
shieldN?h('div',{class:'note'},'Removed '+shieldN+' tracking parameter'+(shieldN>1?'s':'')+' from links in this message.'):null,
h('div',{class:'msg'},nodes))
}
function closeMsg(){
S.sel=null;S.msg=null
document.getElementById('read')?.classList.remove('open')
const el=document.getElementById('read')
if(el)mount(el,h('div',{class:'empty'},'Select a message'))
paintList()
}
function compose(o){
o=o||{}
document.querySelector('.comp')?.remove()
const to=h('input',{value:o.to||'',placeholder:'name@'+S.me.domain+', another@'+S.me.domain,autocapitalize:'none',spellcheck:'false','aria-label':'To'})
const sub=h('input',{value:o.subject||'',placeholder:'Subject',maxlength:'200','aria-label':'Subject'})
const bd=h('textarea',{'aria-label':'Message'},'')
bd.value=o.body||''
const err=h('div',{class:'err',role:'alert'})
const sig=h('input',{type:'checkbox',checked:true})
sig.style.width='auto'
const send=h('button',{class:'btn pri',onclick:async()=>{
send.disabled=true;err.textContent=''
try{
const r=await api('POST','/send',{to:to.value,subject:sub.value,body:bd.value,sig:sig.checked})
c.remove();toast(r.total>1?'Sent to '+r.total+' people':'Sent')
await refreshMe()
if(S.folder==='sent')await load()
paintSide()
}catch(x){err.textContent=x.message;send.disabled=false}
}},'Send')
const c=h('div',{class:'comp',role:'dialog','aria-label':'New message'},
h('header',null,'New message',h('button',{class:'ico',onclick:()=>{if(!bd.value.trim()||confirm('Discard this message?'))c.remove()},'aria-label':'Close'},'✕')),
h('div',{class:'in'},to,sub,bd,err),
h('footer',null,send,S.me.prefs.sig?h('label',{class:'hint'},sig,' Add signature'):null,h('span',{class:'hint'},'Plain text. Nothing remote can load.')))
document.body.append(c)
;(o.to?bd:to).focus()
if(o.to)bd.setSelectionRange(0,0)
}
function settings(tab){
tab=tab||'look'
const dlg=h('div',{class:'dlg',role:'dialog','aria-label':'Settings'})
const scrim=h('div',{class:'scrim',onmousedown:e=>{if(e.target===scrim){scrim.remove();paintSide();if(S.msg)paintMsg()}}},dlg)
const close=()=>{scrim.remove();paintSide();paintList();if(S.msg)paintMsg()}
const save=async(p,extra)=>{try{const r=await api('POST','/prefs',{prefs:p,...(extra||{})});S.me.prefs=r.prefs;if(extra&&extra.display!==undefined)S.me.display=extra.display;theme(S.me.prefs)}catch(e){toast(e.message)}}
const seg=(key,opts)=>h('div',{class:'seg'},opts.map(([v,l])=>h('button',{type:'button',class:(S.me.prefs[key]===undefined||S.me.prefs[key]===''?opts[0][0]:S.me.prefs[key])===v?'on':'',onclick:async()=>{await save({[key]:v});draw()}},l)))
const tabs=[['look','Look'],['addr','Addresses'],['rules','Rules'],['sec','Security'],['priv','Privacy']]
const draw=()=>{
const p=S.me.prefs
let body
if(tab==='look'){
const sig=h('textarea',{maxlength:'400','aria-label':'Signature'});sig.value=p.sig||'';sig.style.minHeight='70px'
const nm=h('input',{value:S.me.display||'',maxlength:'40',placeholder:'Shown on your messages'})
const ac=h('input',{type:'color',value:p.accent||PRESETS[p.preset||'midnight'][1]}),bg=h('input',{type:'color',value:p.bg||PRESETS[p.preset||'midnight'][0]})
for(const i of[ac,bg])i.style.cssText='height:40px;padding:3px'
body=h('div',null,
h('div',{class:'swatches'},Object.entries(PRESETS).map(([k,[b,a]])=>h('button',{class:'sw'+((p.preset||'midnight')===k?' on':''),onclick:async()=>{await save({preset:k,accent:'',bg:'',text:''});draw()}},h('i',{id:'s_'+k}),h('span',null,k==='midnight'?'Ink':k)))),
h('div',{class:'g2'},h('label',{class:'f'},h('span',null,'Accent colour'),ac),h('label',{class:'f'},h('span',null,'Background'),bg)),
h('p',null,h('button',{class:'btn sm',onclick:async()=>{await save({accent:ac.value,bg:bg.value});draw()}},'Apply colours'),' ',h('button',{class:'btn sm',onclick:async()=>{await save({accent:'',bg:'',text:''});draw()}},'Reset colours')),
h('div',{class:'g2'},
h('div',null,h('p',{class:'hint'},'Layout'),seg('layout',[['three','Three panes'],['two','Two panes'],['list','Single list']])),
h('div',null,h('p',{class:'hint'},'Density'),seg('density',[['comfortable','Comfortable'],['compact','Compact'],['spacious','Spacious']])),
h('div',null,h('p',{class:'hint'},'Font'),seg('font',[['system','System'],['serif','Serif'],['mono','Mono'],['rounded','Rounded']])),
h('div',null,h('p',{class:'hint'},'Reading width'),seg('width',[['medium','Medium'],['narrow','Narrow'],['wide','Wide']])),
h('div',null,h('p',{class:'hint'},'Corners'),seg('radius',[['soft','Soft'],['sharp','Sharp'],['round','Round']])),
h('div',null,h('p',{class:'hint'},'List previews'),seg('preview',[[true,'Show'],[false,'Hide']]))),
h('hr',{}),
h('label',{class:'f'},h('span',null,'Your name on messages'),nm),
h('label',{class:'f'},h('span',null,'Signature'),sig),
h('button',{class:'btn pri',onclick:async()=>{await save({sig:sig.value},{display:nm.value});toast('Saved')}},'Save name and signature'),
h('p',{class:'hint'},'Keyboard shortcuts: c write, / search, j and k move, e archive, # delete, s star.'),
h('label',{class:'f'},h('input',{type:'checkbox',checked:p.keys!==false,onchange:async e=>{await save({keys:e.target.checked})}}),' Enable keyboard shortcuts'))
body.querySelector('hr').style.cssText='border:0;border-top:1px solid var(--line);margin:18px 0'
for(const[k,[b,a]]of Object.entries(PRESETS)){const i=body.querySelector('#s_'+k);if(i)i.style.background='linear-gradient(135deg,'+b+' 55%,'+a+' 55%)'}
for(const i of body.querySelectorAll('input[type=checkbox]'))i.style.width='auto'
}else if(tab==='addr'){
const lb=h('input',{placeholder:'What is it for? e.g. Shopping',maxlength:'40'}),cu=h('input',{placeholder:'Pick a name, or leave empty for a random one',autocapitalize:'none',maxlength:'30'})
const err=h('div',{class:'err'})
body=h('div',null,
h('p',null,'Your main address is ',h('b',null,S.me.address),'. Anything sent to ',h('b',null,S.me.local+'+anything@'+S.me.domain),' reaches you too, so you can tag an address per site.'),
h('h4',null,'Aliases'),
h('p',{class:'hint'},'Give each service its own alias. When one gets spammed or sold, turn it off and the rest keep working.'),
S.me.aliases.length?S.me.aliases.map(a=>h('div',{class:'line'},h('span',null,a.addr+'@'+S.me.domain,h('br'),h('small',null,a.label||'No label')),h('button',{class:'btn sm',onclick:async()=>{try{const r=await api('POST','/alias/'+a.addr,{enabled:!a.enabled});S.me.aliases=r.aliases;draw()}catch(e){toast(e.message)}}},a.enabled?'Turn off':'Turn on'),h('button',{class:'btn sm dng',onclick:async()=>{if(!confirm('Delete this alias? Mail sent to it will bounce.'))return;try{const r=await api('POST','/alias/'+a.addr,{remove:true});S.me.aliases=r.aliases;draw()}catch(e){toast(e.message)}}},'Delete'))):h('p',{class:'hint'},'No aliases yet.'),
h('div',{class:'g2'},h('label',{class:'f'},h('span',null,'Label'),lb),h('label',{class:'f'},h('span',null,'Custom name (optional)'),cu)),err,
h('button',{class:'btn pri',onclick:async()=>{err.textContent='';try{const r=await api('POST','/alias',{label:lb.value,addr:cu.value});S.me.aliases=r.aliases;draw()}catch(e){err.textContent=e.message}}},'Create alias'))
body.querySelector('.g2').style.marginTop='14px'
}else if(tab==='rules'){
const rules=p.rules.slice(),folders=p.folders.slice()
const fl=h('input',{placeholder:'New folder name',maxlength:'24'})
const rf=h('select',null,h('option',{value:'from'},'From contains'),h('option',{value:'subject'},'Subject contains'),h('option',{value:'body'},'Body contains'))
const rt=h('input',{placeholder:'text to match',maxlength:'80'})
const ra=h('select',null,h('option',{value:'folder'},'Move to folder'),h('option',{value:'read'},'Mark as read'),h('option',{value:'star'},'Star it'),h('option',{value:'trash'},'Send to Trash'))
const rfo=h('select',null,folders.map(f=>h('option',{value:f},f)))
const sv=async()=>{await save({rules,folders});await refreshMe();draw()}
body=h('div',null,
h('h4',null,'Folders'),
folders.length?folders.map((f,i)=>h('div',{class:'line'},h('span',null,f),h('button',{class:'btn sm dng',onclick:()=>{folders.splice(i,1);sv()}},'Remove'))):h('p',{class:'hint'},'No folders yet.'),
h('div',{class:'line'},fl,h('button',{class:'btn sm',onclick:()=>{const v=fl.value.trim();if(v&&!folders.includes(v)){folders.push(v);sv()}}},'Add')),
h('p',{class:'hint'},'Removing a folder keeps its messages. Move them first if you want to see them.'),
h('h4',null,'Rules'),
h('p',{class:'hint'},'Rules run when mail arrives, in order.'),
rules.length?rules.map((r,i)=>h('div',{class:'line'},h('span',null,({from:'From',subject:'Subject',body:'Body'})[r.field]+' contains "'+r.has+'" → '+({folder:'move to '+r.folder,read:'mark as read',star:'star',trash:'send to Trash'})[r.act]),h('button',{class:'btn sm dng',onclick:()=>{rules.splice(i,1);sv()}},'Remove'))):h('p',{class:'hint'},'No rules yet.'),
h('div',{class:'g2'},rf,rt,ra,folders.length?rfo:h('span',{class:'hint'},'Create a folder to move mail')),
h('p',null,h('button',{class:'btn pri',onclick:()=>{const t=rt.value.trim();if(!t)return;if(ra.value==='folder'&&!folders.length)return toast('Create a folder first');rules.push({field:rf.value,has:t,act:ra.value,folder:ra.value==='folder'?rfo.value:''});sv()}},'Add rule')))
for(const e of body.querySelectorAll('.g2'))e.style.margin='12px 0'
}else if(tab==='sec'){
const cur=h('input',{type:'password',autocomplete:'current-password'}),nw=h('input',{type:'password',autocomplete:'new-password',placeholder:'At least 10 characters'})
const err=h('div',{class:'err'})
const ss=h('div',null,h('p',{class:'hint'},'Loading sessions'))
api('GET','/sessions').then(r=>mount(ss,r.sessions.map(s=>h('div',{class:'line'},h('span',null,s.label,s.current?' (this device)':'',h('br'),h('small',null,'Signed in '+full(s.created_at))),s.current?null:h('button',{class:'btn sm',onclick:async()=>{await api('POST','/sessions/revoke',{id:s.id});settings('sec')}},'Sign out'))),r.sessions.length>1?h('p',null,h('button',{class:'btn sm',onclick:async()=>{await api('POST','/sessions/revoke',{});settings('sec')}},'Sign out everywhere else')):null)).catch(()=>{})
body=h('div',null,
h('h4',null,'Signed-in devices'),ss,
h('h4',null,'Change password'),
h('div',{class:'g2'},h('label',{class:'f'},h('span',null,'Current password'),cur),h('label',{class:'f'},h('span',null,'New password'),nw)),err,
h('button',{class:'btn pri',onclick:async()=>{err.textContent='';try{await api('POST','/password',{current:cur.value,next:nw.value});toast('Password changed. Other devices were signed out.');cur.value='';nw.value=''}catch(e){err.textContent=e.message}}},'Change password'),
h('h4',null,'Delete account'),
h('p',{class:'hint'},'Deletes your address, aliases and every message. It cannot be undone.'),
h('button',{class:'btn dng',onclick:async()=>{const pw=prompt('Type your password to delete this PMail account and all its mail.');if(!pw)return;try{await api('POST','/destroy',{password:pw});S.me=null;scrim.remove();auth()}catch(e){toast(e.message)}}},'Delete my PMail'))
for(const e of body.querySelectorAll('h4'))e.style.margin='22px 0 8px'
}else{
body=h('div',null,h('ul',{class:'facts'},
h('li',null,h('b',null,'No tracking pixels'),'PMail messages are plain text. There is no HTML, so nothing can embed a hidden image or script, and the page itself loads nothing from other sites.'),
h('li',null,h('b',null,'Links are cleaned'),'Links show their real address, open without a referrer, and lose common tracking parameters such as utm_, fbclid and gclid.'),
h('li',null,h('b',null,'No read receipts or last seen'),'Senders cannot tell if or when you opened a message. PMail does not record when you were last online.'),
h('li',null,h('b',null,'Encrypted before storage'),'Each message is encrypted to your own key. Your key is locked by your password and recovery code, so the stored mailbox is unreadable without them. Delivery and reading happen on the server, so messages are decrypted in memory while you are signed in; this protects stored mail, not against a compromised server.'),
h('li',null,h('b',null,'Closed system'),'PMail sends and receives only between PMail addresses and from Parley itself. Nothing arrives from outside, so spam and phishing from the open internet cannot reach you.'),
h('li',null,h('b',null,'Strict page'),'The PMail page blocks all third-party content, sends no referrer and uses a cookie that is HttpOnly and never sent cross-site.'),
h('li',null,h('b',null,'What is stored'),'Your address, name, settings, and for each message the sender, recipient and time, with the subject and body encrypted. Messages live in the Parley database.')))
}
mount(dlg,h('header',null,'PMail settings',h('button',{class:'ico',onclick:close,'aria-label':'Close'},'✕')),h('div',{class:'st',role:'tablist'},tabs.map(([k,l])=>h('button',{class:tab===k?'on':'',role:'tab',onclick:()=>{tab=k;draw()}},l))),h('section',null,body))
}
draw()
document.body.append(scrim)
}
document.addEventListener('keydown',e=>{
if(!S.me||S.me.prefs.keys===false||e.ctrlKey||e.metaKey||e.altKey)return
const t=e.target
if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)){if(e.key==='Escape')t.blur();return}
if(document.querySelector('.scrim'))return
const k=e.key
if(k==='c'){e.preventDefault();compose()}
else if(k==='/'){e.preventDefault();document.getElementById('q')?.focus()}
else if(k==='j'||k==='k'){
const i=S.items.findIndex(x=>x.id===S.sel),n=k==='j'?Math.min(S.items.length-1,i+1):Math.max(0,i-1)
if(S.items[n])openMsg(S.items[n].id)
}else if(S.msg){
if(k==='e'&&S.msg.folder!=='archive'&&S.msg.folder!=='sent')act('/msg/'+S.msg.id,{folder:'archive'}).then(closeMsg)
else if(k==='#')act('/delete-msg/'+S.msg.id,{}).then(closeMsg)
else if(k==='s')act('/msg/'+S.msg.id,{star:!S.msg.star}).then(()=>{S.msg.star=!S.msg.star;paintMsg()})
else if(k==='Escape')closeMsg()
}
})
async function boot(){
try{
S.me=await api('GET','/me')
}catch{
S.me=null
return auth()
}
theme(S.me.prefs)
S.folder='inbox';S.items=[];S.msg=null;S.sel=null
shell()
await load()
}
setInterval(async()=>{if(!S.me||document.hidden)return;try{const m=await api('GET','/me');const before=S.me.counts.inbox?S.me.counts.inbox.n:0;S.me.counts=m.counts;S.me.aliases=m.aliases;if((m.counts.inbox?m.counts.inbox.n:0)!==before&&S.folder==='inbox'&&!S.busy)await load();paintSide()}catch{}},45000)
boot()
