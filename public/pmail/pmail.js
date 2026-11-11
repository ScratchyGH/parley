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
const IC={
inbox:'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
star:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
send:'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
archive:'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
trash:'M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
folder:'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
pen:'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
back:'M19 12H5M12 19l-7-7 7-7',
mail:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
reply:'M9 17l-5-5 5-5M20 18v-2a4 4 0 0 0-4-4H4',
fwd:'M15 17l5-5-5-5M4 18v-2a4 4 0 0 1 4-4h12',
x:'M18 6L6 18M6 6l12 12',
menu:'M3 12h18M3 6h18M3 18h18',
out:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
eyeoff:'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22',
lock:'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'
}
const ico=(n,s)=>{
const v=document.createElementNS('http://www.w3.org/2000/svg','svg')
v.setAttribute('viewBox','0 0 24 24')
v.setAttribute('class','i'+(s?' s':''))
v.setAttribute('aria-hidden','true')
const p=document.createElementNS('http://www.w3.org/2000/svg','path')
p.setAttribute('d',IC[n]||IC.mail)
v.append(p)
return v
}
async function api(m,p,b){
const r=await fetch('/api/pmail'+p,{method:m,headers:b?{'content-type':'application/json'}:{},body:b?JSON.stringify(b):undefined,credentials:'same-origin',referrerPolicy:'no-referrer'})
const j=await r.json().catch(()=>({}))
if(r.status===423||(r.ok&&j.locked&&p==='/me')){lockScreen();const e=new Error('PMail is locked');e.status=423;throw e}
if(!r.ok){const e=new Error(j.error||'Error '+r.status);e.status=r.status;throw e}
return j
}
let DOM='pmail.parley'
const S={me:null,folder:'inbox',items:[],more:false,sel:null,msg:null,q:'',busy:false}
const PRESETS={dimmed:['#212829','#d46a86'],silver:['#2c3436','#d46a86'],light:['#ffffff','#0969da'],contrast:['#0a0c10','#71b7ff']}
function theme(p){
p=p||{}
root.dataset.preset=PRESETS[p.preset]?p.preset:'dimmed'
for(const k of['density','layout','font','width','radius'])root.dataset[k]=p[k]||({density:'comfortable',layout:'three',font:'default',width:'medium',radius:'soft'})[k]
for(const[k,v]of[['--hi',p.accent],['--bg',p.bg],['--text',p.text]])if(v)root.style.setProperty(k,v);else root.style.removeProperty(k)
if(p.accent){
const n=parseInt(p.accent.slice(1),16),l=((n>>16)*299+((n>>8)&255)*587+(n&255)*114)/1000
root.style.setProperty('--accent','color-mix(in srgb,'+p.accent+' 38%,#000)')
root.style.setProperty('--on-accent','#fff')
}else{root.style.removeProperty('--accent');root.style.removeProperty('--on-accent')}
if(p.bg)root.style.setProperty('--side','color-mix(in srgb,'+p.bg+' 86%,#000)');else root.style.removeProperty('--side')
}
function toast(t){const e=h('div',{class:'toast',role:'status'},t);document.body.append(e);setTimeout(()=>e.remove(),2600)}
const TRACK=/^(utm_.*|fbclid|gclid|gclsrc|dclid|msclkid|mc_eid|mc_cid|igshid|igsh|yclid|_hsenc|_hsmi|mkt_tok|spm|s_cid|vero_id|oly_enc_id|oly_anon_id|trk|trkcampaign|wickedid|twclid|ttclid|li_fat_id|ref_src|ref_url|cmpid|cid|campaign_id|ad_id|si|pk_campaign|pk_kwd|_ga|_gl|scid|sc_cid|epik|ck_subscriber_id)$/i
function cleanUrl(raw){
let u
try{u=new URL(raw)}catch{return null}
if(!/^https?:$/.test(u.protocol))return null
let n=0
for(const k of[...u.searchParams.keys()])if(TRACK.test(k)){u.searchParams.delete(k);n++}
return{href:u.href,host:u.hostname,n}
}
let shielded=0
function bodyNodes(text){
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
const initial=s=>(String(s||'?').trim()[0]||'?').toUpperCase()
const page=(box,below)=>mount($,h('div',{class:'auth'},box,below))
const tiles=()=>h('div',{class:'tiles'},
h('div',{class:'tile'},h('div',{class:'tic'},ico('eyeoff',1)),h('div',null,h('b',null,'No trackers'),h('small',null,'Plain text only. No pixels, no remote images, links cleaned.'))),
h('div',{class:'tile'},h('div',{class:'tic'},ico('lock',1)),h('div',null,h('b',null,'Encrypted for you'),h('small',null,'Every message is sealed to your own key before it is stored.'))),
h('div',{class:'tile'},h('div',{class:'tic'},ico('sliders',1)),h('div',null,h('b',null,'Yours to shape'),h('small',null,'Aliases, rules, folders, themes and layouts.'))))
function auth(){
theme({})
api('GET','/check?local=aaa').then(r=>{if(r.domain&&r.domain!==DOM){DOM=r.domain;for(const e of document.querySelectorAll('.addr span'))e.textContent='@'+DOM}}).catch(()=>{})
let mode='in'
const box=h('div',{class:'authbox'})
const draw=()=>{
const err=h('div',{class:'err',role:'alert'})
const a=h('input',{autocomplete:'username',autocapitalize:'none',spellcheck:'false',placeholder:'yourname',maxlength:'30'})
const pw=h('input',{type:'password',autocomplete:mode==='up'?'new-password':'current-password',placeholder:mode==='up'?'At least 10 characters':'Password'})
const dn=h('input',{placeholder:'Optional',maxlength:'40'})
const cd=h('input',{autocomplete:'one-time-code',autocapitalize:'none',spellcheck:'false',placeholder:'6-digit code or backup code'})
const cl=h('label',{class:'f',hidden:true},h('span',null,'Authenticator code'),cd)
const go=h('button',{class:'btn pri wide',type:'submit'},mode==='up'?'Create my PMail':'Sign in')
const form=h('form',{onsubmit:async e=>{
e.preventDefault()
go.disabled=true;err.textContent='';err.className='err'
try{
if(mode==='up'){recovery(await api('POST','/signup',{local:a.value.trim().toLowerCase(),password:pw.value,display:dn.value}))}
else{const r=await api('POST','/login',{address:a.value.trim().toLowerCase(),password:pw.value,code:cd.value});if(r.need==='2fa'){cl.hidden=false;err.textContent='Enter the code from your authenticator app, or one of your backup codes.';cd.focus();go.disabled=false;return}await boot()}
}catch(x){err.textContent=x.message;go.disabled=false}
}},
h('label',{class:'f'},h('span',null,mode==='up'?'Choose your address':'Address'),h('div',{class:'addr'},a,h('span',null,'@'+DOM))),
mode==='up'?h('label',{class:'f'},h('span',null,'Name shown on messages'),dn):null,
h('label',{class:'f'},h('span',null,'Password'),pw),
mode==='in'?cl:null,
mode==='in'?h('p',{class:'hint'},h('a',{href:'#',onclick:e=>{e.preventDefault();reset()}},'Forgot your password? Use your recovery code.')):h('p',{class:'hint'},'Your password locks your mailbox. Nobody can reset it without your recovery code.'),
err,go)
if(mode==='up'){let t;a.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(async()=>{const v=a.value.trim().toLowerCase();if(v.length<3){err.textContent='';return}try{const r=await api('GET','/check?local='+encodeURIComponent(v));err.textContent=r.ok?'That address is free':r.reason;err.className=r.ok?'err ok':'err'}catch{}},350)})}
mount(box,
h('img',{class:'mas',src:'/mascot-sm.webp',alt:''}),
h('h1',null,'PMail'),
h('p',{class:'sub'},'Private mail for Parley'),
h('div',{class:'tabs'},h('button',{class:mode==='in'?'on':'',type:'button',onclick:()=>{mode='in';draw()}},'Sign in'),h('button',{class:mode==='up'?'on':'',type:'button',onclick:()=>{mode='up';draw()}},'Create PMail')),
form)
a.focus()
}
draw()
page(box,tiles())
}
function recovery(r){
const box=h('div',{class:'authbox'},h('img',{class:'mas',src:'/mascot-sm.webp',alt:''}),h('h2',null,'You are in'),
h('p',{class:'sub'},'Your address is ',h('b',null,r.address)),
h('div',{class:'rec'},h('div',{class:'hint'},'Your recovery code. Shown once.'),h('code',null,r.recovery),h('div',{class:'hint'},'Write it down or keep it in a password manager. If you forget your password, this is the only way to open your mail.')),
h('button',{class:'btn pri wide',onclick:()=>boot()},'I saved it, open my inbox'))
page(box)
}
function reset(){
const err=h('div',{class:'err',role:'alert'})
const a=h('input',{placeholder:'yourname',autocapitalize:'none'}),rc=h('input',{placeholder:'xxxxx-xxxxx-xxxxx-xxxxx',autocapitalize:'none',spellcheck:'false'}),pw=h('input',{type:'password',autocomplete:'new-password',placeholder:'At least 10 characters'}),cd=h('input',{placeholder:'Only if two-factor is on',autocapitalize:'none',spellcheck:'false'})
const box=h('div',{class:'authbox'},h('img',{class:'mas',src:'/mascot-sm.webp',alt:''}),h('h2',null,'Reset password'),h('p',{class:'sub'},'Enter your recovery code. Your mail stays intact.'),
h('form',{onsubmit:async e=>{e.preventDefault();err.textContent='';try{await api('POST','/reset',{address:a.value,recovery:rc.value,next:pw.value,code:cd.value});toast('Password changed. Sign in.');auth()}catch(x){err.textContent=x.message}}},
h('label',{class:'f'},h('span',null,'Address'),a),h('label',{class:'f'},h('span',null,'Recovery code'),rc),h('label',{class:'f'},h('span',null,'New password'),pw),h('label',{class:'f'},h('span',null,'Authenticator or backup code'),cd),err,
h('button',{class:'btn pri wide',type:'submit'},'Set new password'),h('p',{class:'hint'},h('a',{href:'#',onclick:e=>{e.preventDefault();auth()}},'Back to sign in'))))
page(box)
}
const NAMES={inbox:'Inbox',starred:'Starred',sent:'Sent',archive:'Archive',trash:'Trash'}
const NIC={inbox:'inbox',starred:'star',sent:'send',archive:'archive',trash:'trash'}
const ACT={signup:'Account created',login:'Signed in',login_fail:'Failed sign-in',lockout:'Sign-ins paused',password:'Password changed',reset:'Password reset',pin_on:'PIN lock turned on',pin_off:'PIN lock turned off',unlock_fail:'Wrong PIN',unlock_lockout:'Signed out after wrong PINs',['2fa_on']:'Two-factor turned on',['2fa_off']:'Two-factor turned off',backup_regen:'New backup codes',recovery_regen:'New recovery code',session_revoke:'Devices signed out',settings:'Security settings changed'}
const BAD=new Set(['login_fail','lockout','unlock_fail','unlock_lockout'])
function ask(title,note,fields){
return new Promise(res=>{
const ins=fields.map(([k,l,t,a])=>[k,l,h('input',{type:t||'password',autocomplete:'off',...(a||{})})])
const done=v=>{sc.remove();res(v)}
const form=h('form',{class:'dlg ask',onsubmit:e=>{e.preventDefault();done(Object.fromEntries(ins.map(([k,,i])=>[k,i.value])))}},
h('header',null,title),
h('section',null,note?(typeof note==='string'?h('p',{class:'hint'},note):note):null,ins.map(([,l,i])=>h('label',{class:'f'},h('span',null,l),i)),h('div',{class:'row'},h('button',{class:'btn',type:'button',onclick:()=>done(null)},'Cancel'),h('button',{class:'btn pri',type:'submit'},'Continue'))))
const sc=h('div',{class:'scrim top',onmousedown:e=>{if(e.target===sc)done(null)}},form)
document.body.append(sc)
ins[0][2].focus()
})
}
function modal(title,...k){
return new Promise(res=>{
const done=()=>{sc.remove();res()}
const sc=h('div',{class:'scrim top'},h('div',{class:'dlg ask'},h('header',null,title),h('section',null,k,h('div',{class:'row'},h('button',{class:'btn pri',onclick:done},'Done')))))
document.body.append(sc)
})
}
function lockScreen(){
if(document.querySelector('.lockbox'))return
document.querySelectorAll('.scrim,.comp').forEach(e=>e.remove())
const err=h('div',{class:'err',role:'alert'})
const pin=h('input',{class:'pin',type:'password',inputmode:'numeric',autocomplete:'off',maxlength:'8','aria-label':'PIN'})
const out=async()=>{try{await api('POST','/logout',{})}catch{}S.me=null;auth()}
const box=h('div',{class:'authbox lockbox'},h('img',{class:'mas',src:'/mascot-sm.webp',alt:''}),h('h2',null,'PMail is locked'),h('p',{class:'sub'},'Enter your PIN to continue'),
h('form',{onsubmit:async e=>{e.preventDefault();err.textContent='';try{await api('POST','/unlock',{pin:pin.value});await boot()}catch(x){pin.value='';err.textContent=x.message;if(x.status===401){S.me=null;auth()}}}},pin,err,h('button',{class:'btn pri wide',type:'submit'},'Unlock')),
h('p',{class:'hint'},h('a',{href:'#',onclick:e=>{e.preventDefault();out()}},'Sign out instead')))
page(box)
pin.focus()
}
async function lockNow(){try{await api('POST','/lock',{});lockScreen()}catch(e){toast(e.message)}}
const fname=f=>NAMES[f]||(f.startsWith('f:')?f.slice(2):f)
async function load(more){
if(S.busy)return
S.busy=true
try{
const before=more&&S.items.length?S.items[S.items.length-1].ts:''
const r=await api('GET','/list?folder='+encodeURIComponent(S.folder)+(before?'&before='+before:''))
S.items=more?S.items.concat(r.items):r.items
S.more=r.more
}catch(e){S.busy=false;if(e.status===401)return auth();toast(e.message)}
S.busy=false
paintList()
}
async function refreshMe(){
try{S.me=await api('GET','/me');theme(S.me.prefs)}catch(e){if(e.status===401)auth()}
}
const FOLDERS=['inbox','starred','sent','archive','trash']
function shell(){
const q=h('input',{type:'search',placeholder:'Search this folder',id:'q','aria-label':'Search this folder',value:S.q,oninput:e=>{S.q=e.target.value;paintList()}})
mount($,h('div',{class:'shell'},
h('nav',{class:'rail','aria-label':'PMail'},
h('a',{class:'wbtn on',href:'/pmail/',title:'PMail'},h('img',{src:'/mascot-sm.webp',alt:'PMail'})),
h('div',{class:'sep'}),
h('button',{class:'wbtn pri',title:'Write (c)',onclick:()=>compose()},ico('pen')),
h('div',{class:'gap'}),
h('a',{class:'wbtn',href:'/',title:'Back to Parley'},ico('back')),
S.me.sec&&S.me.sec.pin?h('button',{class:'wbtn',title:'Lock now',onclick:lockNow},ico('lock')):null,
h('button',{class:'wbtn',title:'Settings',onclick:()=>settings()},ico('gear'))),
h('aside',{class:'ctx',id:'side'},
h('div',{class:'ctx-h'},'Mail'),
h('div',{class:'find'},ico('search',1),q),
h('div',{class:'nav',id:'nav'}),
h('div',{class:'me'},h('div',{class:'av'},initial(S.me.display||S.me.local)),h('div',null,h('b',null,S.me.display||S.me.local),h('small',null,S.me.address)),h('button',{class:'ib',title:'Sign out','aria-label':'Sign out',onclick:async()=>{try{await api('POST','/logout',{})}catch{}S.me=null;auth()}},ico('out')))),
h('section',{class:'listcol'},h('div',{class:'lh'},h('button',{class:'ib menu',onclick:()=>document.getElementById('side').classList.toggle('open'),'aria-label':'Folders'},ico('menu')),h('span',{id:'lt'}),h('button',{class:'btn sm menu',onclick:()=>compose()},'Write')),h('div',{class:'list',id:'list',tabindex:'-1'})),
h('article',{class:'read',id:'read'},h('div',{class:'empty'},ico('mail'),'Select a message'))))
paintSide()
paintList()
if(S.msg)paintMsg()
}
function paintSide(){
const nav=document.getElementById('nav')
if(!nav)return
const c=S.me.counts||{}
const btn=(f,label,ic)=>{const un=c[f]&&c[f].un&&f!=='trash'&&f!=='sent'?c[f].un:0;return h('button',{class:'nv'+(S.folder===f?' on':''),onclick:()=>go(f)},ico(ic),h('span',null,label),un?h('em',null,un):null)}
const act=S.me.aliases.filter(a=>a.enabled)
mount(nav,
FOLDERS.map(f=>btn(f,NAMES[f],NIC[f])),
S.me.prefs.folders.length?h('h4',null,'Folders'):null,
S.me.prefs.folders.map(f=>btn('f:'+f,f,'folder')),
h('h4',null,'Your addresses'),
h('div',{class:'mine'},h('div',null,S.me.address),act.slice(0,4).map(a=>h('div',{title:a.label},a.addr+'@'+S.me.domain)),act.length>4?h('div',null,'and '+(act.length-4)+' more'):null))
const lt=document.getElementById('lt')
if(lt)lt.textContent=fname(S.folder)
}
async function go(f){
S.folder=f;S.sel=null;S.msg=null;S.items=[]
document.getElementById('side')?.classList.remove('open')
document.getElementById('read')?.classList.remove('open')
paintSide()
mount(document.getElementById('read'),h('div',{class:'empty'},ico('mail'),'Select a message'))
await load()
}
function paintList(){
const el=document.getElementById('list')
if(!el)return
const q=S.q.trim().toLowerCase()
const items=q?S.items.filter(i=>(i.s+' '+i.fn+' '+i.from+' '+i.to+' '+i.sn).toLowerCase().includes(q)):S.items
mount(el,
S.busy&&!S.items.length?h('div',{class:'empty'},'Loading'):null,
!S.busy&&!items.length?h('div',{class:'empty'},ico('inbox'),q?'Nothing matches in the loaded messages.':'Nothing here yet.'):null,
items.map(i=>{
const sent=S.folder==='sent'||i.folder==='sent'
const who=sent?'To '+i.to:(i.fn||i.from)
return h('div',{class:'row'+(i.read?'':' un')+(S.sel===i.id?' on':''),tabindex:'0',role:'button',onclick:()=>openMsg(i.id),onkeydown:e=>{if(e.key==='Enter')openMsg(i.id)}},
h('div',{class:'av'},initial(sent?i.to:(i.fn||i.from))),
h('span',{class:'fr'},who),
h('span',{class:'dt'},i.star?h('span',{class:'star'},'★ '):null,fmt(i.ts)),
h('span',{class:'su'},i.s),
i.sn?h('span',{class:'sn'},i.sn):null)
}),
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
const mv=h('select',{'aria-label':'Move to',title:'Move to',onchange:async e=>{const f=e.target.value;if(!f)return;await act('/msg/'+m.id,{folder:f});closeMsg();toast('Moved to '+fname(f))}},h('option',{value:''},'Move to'),['inbox','archive','trash'].filter(f=>f!==m.folder).map(f=>h('option',{value:f},NAMES[f])),fm.filter(f=>'f:'+f!==m.folder).map(f=>h('option',{value:'f:'+f},f)))
const nodes=bodyNodes(m.b)
const shieldN=shielded
const ib=(n,t,fn,cls)=>h('button',{class:'ib'+(cls?' '+cls:''),title:t,'aria-label':t,onclick:fn},ico(n))
mount(el,
h('div',{class:'rbar'},
ib('back','Back',closeMsg,'back'),
ib('reply','Reply',()=>compose({to:m.from,subject:/^re:/i.test(m.s)?m.s:'Re: '+m.s,body:'\n\n'+m.from+' wrote:\n'+m.b.split('\n').map(l=>'> '+l).join('\n'),sig:true})),
ib('fwd','Forward',()=>compose({subject:/^fwd:/i.test(m.s)?m.s:'Fwd: '+m.s,body:'\n\n---------- Forwarded ----------\nFrom: '+m.from+'\nDate: '+full(m.ts)+'\n\n'+m.b})),
ib('star',m.star?'Unstar':'Star',async()=>{await act('/msg/'+m.id,{star:!m.star});m.star=!m.star;paintMsg()},m.star?'star':''),
m.folder!=='archive'&&m.folder!=='sent'?ib('archive','Archive',async()=>{await act('/msg/'+m.id,{folder:'archive'});closeMsg();toast('Archived')}):null,
ib('mail','Mark unread',async()=>{await act('/msg/'+m.id,{read:false});closeMsg()}),
h('span',{class:'sp'}),
mv,
ib('trash',m.folder==='trash'?'Delete forever':'Delete',async()=>{await act('/delete-msg/'+m.id,{});closeMsg();toast(m.folder==='trash'?'Deleted for good':'Moved to Trash')})),
h('div',{class:'rbody'},
h('h2',null,m.s),
h('div',{class:'who'},h('div',{class:'av'},initial(m.fn||m.from)),h('div',null,h('b',null,m.fn||m.from),h('small',null,(m.fn?m.from+' · ':'')+'to '+(m.all||[m.to]).join(', ')),h('small',null,full(m.ts)))),
shieldN?h('div',{class:'note'},'Removed '+shieldN+' tracking parameter'+(shieldN>1?'s':'')+' from links in this message.'):null,
h('div',{class:'msg'},nodes)))
}
function closeMsg(){
S.sel=null;S.msg=null
document.getElementById('read')?.classList.remove('open')
const el=document.getElementById('read')
if(el)mount(el,h('div',{class:'empty'},ico('mail'),'Select a message'))
paintList()
}
function compose(o){
o=o||{}
document.querySelector('.comp')?.remove()
const to=h('input',{value:o.to||'',placeholder:'To: name@'+S.me.domain,autocapitalize:'none',spellcheck:'false','aria-label':'To'})
const sub=h('input',{value:o.subject||'',placeholder:'Subject',maxlength:'200','aria-label':'Subject'})
const bd=h('textarea',{'aria-label':'Message',placeholder:'Write your message'},'')
bd.value=o.body||''
const err=h('div',{class:'err',role:'alert'})
const sig=h('input',{type:'checkbox',checked:true})
const send=h('button',{class:'btn pri',onclick:async()=>{
send.disabled=true;err.textContent=''
try{
const r=await api('POST','/send',{to:to.value,subject:sub.value,body:bd.value,sig:sig.checked})
c.remove();toast(r.total>1?'Sent to '+r.total+' people':'Sent')
await refreshMe()
if(S.folder==='sent')await load()
paintSide()
}catch(x){err.textContent=x.message;send.disabled=false}
}},ico('send',1),'Send')
const c=h('div',{class:'comp',role:'dialog','aria-label':'New message'},
h('header',null,'New message',h('button',{class:'ib',onclick:()=>{if(!bd.value.trim()||confirm('Discard this message?'))c.remove()},'aria-label':'Close'},ico('x'))),
h('div',{class:'in'},to,sub,bd,err),
h('footer',null,send,S.me.prefs.sig?h('label',{class:'hint'},sig,' Add signature'):null,h('span',{class:'hint'},'Plain text. Nothing remote can load.')))
document.body.append(c)
;(o.to?bd:to).focus()
if(o.to)bd.setSelectionRange(0,0)
}
function settings(tab){
tab=tab||'look'
const dlg=h('div',{class:'dlg',role:'dialog','aria-label':'Settings'})
const scrim=h('div',{class:'scrim',onmousedown:e=>{if(e.target===scrim)close()}},dlg)
const close=()=>{scrim.remove();paintSide();paintList();if(S.msg)paintMsg()}
const save=async(p,extra)=>{try{const r=await api('POST','/prefs',{prefs:p,...(extra||{})});S.me.prefs=r.prefs;if(extra&&extra.display!==undefined)S.me.display=extra.display;theme(S.me.prefs)}catch(e){toast(e.message)}}
const cur=(key,opts)=>{const v=S.me.prefs[key];return v===undefined||v===''?opts[0][0]:v}
const seg=(key,opts)=>h('div',{class:'seg'},opts.map(([v,l])=>h('button',{type:'button',class:cur(key,opts)===v?'on':'',onclick:async()=>{await save({[key]:v});draw()}},l)))
const tabs=[['look','Look'],['addr','Addresses'],['rules','Rules'],['sec','Security'],['log','Activity'],['priv','Privacy']]
const draw=()=>{
const p=S.me.prefs
let body
if(tab==='look'){
const sig=h('textarea',{maxlength:'400','aria-label':'Signature'});sig.value=p.sig||'';sig.style.minHeight='70px'
const nm=h('input',{value:S.me.display||'',maxlength:'40',placeholder:'Shown on your messages'})
const ac=h('input',{type:'color',value:p.accent||PRESETS[p.preset||'dimmed'][1]}),bg=h('input',{type:'color',value:p.bg||PRESETS[p.preset||'dimmed'][0]})
body=h('div',null,
h('h4',null,'Theme'),
h('div',{class:'swatches'},Object.entries(PRESETS).map(([k,[b,a]])=>{const i=h('i');i.style.background='linear-gradient(135deg,'+b+' 55%,'+a+' 55%)';return h('button',{class:'sw'+((p.preset||'dimmed')===k?' on':''),onclick:async()=>{await save({preset:k,accent:'',bg:'',text:''});draw()}},i,h('span',null,k))})),
h('div',{class:'g2'},h('label',{class:'f'},h('span',null,'Accent colour'),ac),h('label',{class:'f'},h('span',null,'Background'),bg)),
h('p',null,h('button',{class:'btn sm',onclick:async()=>{await save({accent:ac.value,bg:bg.value});draw()}},'Apply colours'),' ',h('button',{class:'btn sm',onclick:async()=>{await save({accent:'',bg:'',text:''});draw()}},'Reset colours')),
h('h4',null,'Layout'),
h('div',{class:'g2'},
h('div',null,h('p',{class:'hint'},'Panes'),seg('layout',[['three','Three panes'],['two','Two panes'],['list','Single list']])),
h('div',null,h('p',{class:'hint'},'Density'),seg('density',[['comfortable','Comfortable'],['compact','Compact'],['spacious','Spacious']])),
h('div',null,h('p',{class:'hint'},'Font'),seg('font',[['default','Parley'],['system','System'],['serif','Serif'],['mono','Mono']])),
h('div',null,h('p',{class:'hint'},'Reading width'),seg('width',[['medium','Medium'],['narrow','Narrow'],['wide','Wide']])),
h('div',null,h('p',{class:'hint'},'Corners'),seg('radius',[['soft','Soft'],['sharp','Sharp'],['round','Round']])),
h('div',null,h('p',{class:'hint'},'List previews'),seg('preview',[[true,'Show'],[false,'Hide']]))),
h('h4',null,'You'),
h('label',{class:'f'},h('span',null,'Your name on messages'),nm),
h('label',{class:'f'},h('span',null,'Signature'),sig),
h('button',{class:'btn pri',onclick:async()=>{await save({sig:sig.value},{display:nm.value});toast('Saved')}},'Save name and signature'),
h('p',{class:'hint'},'Shortcuts: c write, / search, j and k move, e archive, # delete, s star.'),
h('label',{class:'f'},h('input',{type:'checkbox',checked:p.keys!==false,onchange:async e=>{await save({keys:e.target.checked})}}),' Enable keyboard shortcuts'))
}else if(tab==='addr'){
const lb=h('input',{placeholder:'What is it for? e.g. Shopping',maxlength:'40'}),cu=h('input',{placeholder:'Pick a name, or leave empty for a random one',autocapitalize:'none',maxlength:'30'})
const err=h('div',{class:'err'})
body=h('div',null,
h('p',null,'Your main address is ',h('b',null,S.me.address),'. Anything sent to ',h('b',null,S.me.local+'+anything@'+S.me.domain),' reaches you too, so you can tag an address per site.'),
h('h4',null,'Aliases'),
h('p',{class:'hint'},'Give each service its own alias. When one gets spammed or sold, turn it off and the rest keep working.'),
S.me.aliases.length?S.me.aliases.map(a=>h('div',{class:'line'},h('span',null,a.addr+'@'+S.me.domain,h('br'),h('small',null,a.label||'No label')),h('button',{class:'btn sm',onclick:async()=>{try{const r=await api('POST','/alias/'+a.addr,{enabled:!a.enabled});S.me.aliases=r.aliases;draw()}catch(e){toast(e.message)}}},a.enabled?'Turn off':'Turn on'),h('button',{class:'btn sm dng',onclick:async()=>{if(!confirm('Delete this alias? Mail sent to it will bounce.'))return;try{const r=await api('POST','/alias/'+a.addr,{remove:true});S.me.aliases=r.aliases;draw()}catch(e){toast(e.message)}}},'Delete'))):h('p',{class:'hint'},'No aliases yet.'),
h('h4',null,'New alias'),
h('div',{class:'g2'},h('label',{class:'f'},h('span',null,'Label'),lb),h('label',{class:'f'},h('span',null,'Custom name (optional)'),cu)),err,
h('button',{class:'btn pri',onclick:async()=>{err.textContent='';try{const r=await api('POST','/alias',{label:lb.value,addr:cu.value});S.me.aliases=r.aliases;draw()}catch(e){err.textContent=e.message}}},'Create alias'))
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
}else if(tab==='sec'){
const sc=S.me.sec||{}
const err=h('div',{class:'err'})
const ss=h('div',null,h('p',{class:'hint'},'Loading sessions'))
api('GET','/sessions').then(r=>mount(ss,r.sessions.map(s=>h('div',{class:'line'},h('span',null,s.label,s.current?' (this device)':'',h('br'),h('small',null,'Signed in '+full(s.created_at)+(s.seen_at?', active '+full(s.seen_at):''))),s.current?null:h('button',{class:'btn sm',onclick:async()=>{await api('POST','/sessions/revoke',{id:s.id});settings('sec')}},'Sign out'))),r.sessions.length>1?h('p',null,h('button',{class:'btn sm',onclick:async()=>{await api('POST','/sessions/revoke',{});settings('sec')}},'Sign out everywhere else')):null)).catch(()=>{})
const cu=h('input',{type:'password',autocomplete:'current-password'}),nw=h('input',{type:'password',autocomplete:'new-password',placeholder:'At least 10 characters'})
const again=async()=>{await refreshMe();shell();settings('sec')}
const guard=f=>async()=>{try{await f()}catch(e){toast(e.message)}}
const codeF=['code','Authenticator or backup code','text',{autocomplete:'one-time-code',autocapitalize:'none'}]
const pwF=['password','Password','password',{autocomplete:'current-password'}]
const pws=sc.owner?[]:[pwF]
const row=(t,d,...ctl)=>h('div',{class:'sec-row'},h('div',null,h('b',null,t),h('small',null,d)),ctl)
const opts=(key,list,fmt)=>h('div',{class:'seg'},list.map(v=>h('button',{type:'button',class:sc[key]===v?'on':'',onclick:guard(async()=>{await api('POST','/security',{[key]:v});await again()})},fmt(v))))
const showCodes=codes=>modal('Backup codes',h('p',{class:'hint'},'Each code works once if you lose your authenticator. Keep them somewhere safe. They are shown only now.'),h('div',{class:'codes'},codes.map(x=>h('code',null,x))),h('p',null,h('button',{class:'btn sm',onclick:()=>navigator.clipboard&&navigator.clipboard.writeText(codes.join('\n')).then(()=>toast('Copied'))},'Copy all')))
const on2fa=guard(async()=>{
const v=await ask('Turn on two-factor','Enter your password to begin.',[pwF]);if(!v)return
const t=await api('POST','/2fa/setup',{password:v.password})
const c=await ask('Add to your authenticator',h('div',null,h('p',{class:'hint'},'In an authenticator app such as Aegis, 2FAS, Authy or 1Password, add a time-based key and type in this setup key:'),h('code',{class:'secret'},t.secret),h('p',{class:'hint'},h('a',{href:t.uri},'Open in an authenticator app on this device'),'. Then enter the 6-digit code it shows.')),[['code','6-digit code','text',{inputmode:'numeric',maxlength:'6',autocomplete:'one-time-code'}]])
if(!c)return
const r=await api('POST','/2fa/enable',{code:c.code})
await showCodes(r.backup_codes)
await again()
})
const off2fa=guard(async()=>{const v=await ask('Turn off two-factor','This makes sign-in need only your password.',[pwF,codeF]);if(!v)return;await api('POST','/2fa/disable',v);await again()})
const regen=guard(async()=>{const v=await ask('New backup codes','Old backup codes stop working.',[pwF,codeF]);if(!v)return;const r=await api('POST','/2fa/backup',v);await showCodes(r.backup_codes);await again()})
const setPin=guard(async()=>{const v=await ask(sc.pin?'Change PIN':'Set a PIN','A PIN locks PMail on this device without signing you out. Use 4 to 8 digits.',[...pws,['pin','New PIN','password',{inputmode:'numeric',maxlength:'8'}]]);if(!v)return;await api('POST','/pin',v);await again()})
const offPin=guard(async()=>{const v=sc.owner?{}:await ask('Turn off PIN lock',null,[pwF]);if(!v)return;await api('POST','/pin',{...v,off:true});await again()})
const newRec=guard(async()=>{const v=await ask('New recovery code','The old recovery code stops working.',sc.totp?[pwF,codeF]:[pwF]);if(!v)return;const r=await api('POST','/recovery',v);await modal('Your new recovery code',h('div',{class:'rec'},h('code',null,r.recovery),h('div',{class:'hint'},'Write it down or keep it in a password manager.')))})
const chip=on=>h('span',{class:'chip'+(on?' on':'')},on?'On':'Off')
body=h('div',null,
sc.owner?h('p',{class:'hint'},'This is the Parley owner mailbox. It opens from your Parley account, so it has no password or two-factor code of its own. A PIN adds a lock on top: every new session starts locked until the PIN is entered.'):null,
sc.owner?null:h('h4',null,'Sign-in protection'),
sc.owner?null:row('Two-factor authentication','A code from an authenticator app, asked after your password.',chip(sc.totp),sc.totp?h('button',{class:'btn sm dng',onclick:off2fa},'Turn off'):h('button',{class:'btn sm pri',onclick:on2fa},'Set up')),
sc.totp&&!sc.owner?row('Backup codes',sc.backup_left+' unused. Each works once if you lose your authenticator.',h('button',{class:'btn sm',onclick:regen},'Get new codes')):null,
sc.owner?null:row('Recovery code','Opens your mailbox if you forget your password.',h('button',{class:'btn sm',onclick:newRec},'Create new')),
row('Stay signed in for','How long this device remembers you.',opts('ttl_days',[1,7,14,30],v=>v+(v===1?' day':' days'))),
sc.owner?null:row('Security alerts','Mail to your inbox about new devices, lockouts and security changes.',h('button',{class:'btn sm',onclick:guard(async()=>{await api('POST','/security',{alerts:!sc.alerts});await again()})},sc.alerts?'On':'Off')),
h('h4',null,'Screen lock'),
row('PIN lock','Locks PMail with a PIN without signing you out. Five wrong PINs sign this device out.',chip(sc.pin),h('button',{class:'btn sm pri',onclick:setPin},sc.pin?'Change':'Set PIN'),sc.pin?h('button',{class:'btn sm dng',onclick:offPin},'Turn off'):null),
row('Auto-lock after idle',sc.pin?'Locks after this long without use.':'Set a PIN first.',opts('lock_min',[0,1,5,15,30,60],v=>v?v+' min':'Off'),sc.pin?h('button',{class:'btn sm',onclick:lockNow},'Lock now'):null),
h('h4',null,'Mail retention'),
row('Delete mail automatically','Removes mail older than this on sign-in. Starred mail is kept.',opts('keep_days',[0,7,30,90,365],v=>v?(v===365?'1 year':v+' days'):'Never')),
h('h4',null,'Signed-in devices'),ss,
sc.owner?null:h('h4',null,'Change password'),
sc.owner?null:[h('div',{class:'g2'},h('label',{class:'f'},h('span',null,'Current password'),cu),h('label',{class:'f'},h('span',null,'New password'),nw)),err,
h('button',{class:'btn pri',onclick:async()=>{err.textContent='';try{await api('POST','/password',{current:cu.value,next:nw.value});toast('Password changed. Other devices were signed out.');cu.value='';nw.value=''}catch(e){err.textContent=e.message}}},'Change password')],
sc.owner?null:h('h4',null,'Delete account'),
sc.owner?null:h('p',{class:'hint'},'Deletes your address, aliases and every message. It cannot be undone.'),
sc.owner?null:h('button',{class:'btn dng',onclick:guard(async()=>{const v=await ask('Delete PMail','This deletes your address and all mail. It cannot be undone.',sc.totp?[pwF,codeF]:[pwF]);if(!v)return;await api('POST','/destroy',v);S.me=null;scrim.remove();auth()})},'Delete my PMail'))
}else if(tab==='log'){
const lg=h('div',{class:'log'},h('p',{class:'hint'},'Sign-ins, failed attempts and security changes on your mailbox. It cannot be edited or cleared. The latest 100 entries are kept.'),h('p',{class:'hint'},'Loading'))
api('GET','/activity').then(r=>mount(lg,h('p',{class:'hint'},'Sign-ins, failed attempts and security changes on your mailbox. It cannot be edited or cleared. The latest 100 entries are kept.'),r.items.length?r.items.map(i=>h('div',{class:'line'},h('span',{class:BAD.has(i.kind)?'bad':''},h('b',null,ACT[i.kind]||i.kind),h('small',null,i.detail),h('small',null,full(i.ts))))):h('p',{class:'hint'},'Nothing yet.'))).catch(()=>{})
body=lg
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
mount(dlg,h('header',null,'PMail settings',h('button',{class:'ib',onclick:close,'aria-label':'Close'},ico('x'))),h('div',{class:'st',role:'tablist'},tabs.map(([k,l])=>h('button',{class:tab===k?'on':'',role:'tab',onclick:()=>{tab=k;draw()}},l))),h('section',null,body))
}
draw()
document.querySelector('.scrim')?.remove()
document.body.append(scrim)
}
document.addEventListener('keydown',e=>{
if(!S.me||!S.me.prefs||document.querySelector('.lockbox')||S.me.prefs.keys===false||e.ctrlKey||e.metaKey||e.altKey)return
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
try{S.me=await api('GET','/me')}catch(e){
if(e.status===423)return
try{await api('POST','/owner-open',{});S.me=await api('GET','/me')}catch{S.me=null;return auth()}
}
theme(S.me.prefs)
S.folder='inbox';S.items=[];S.msg=null;S.sel=null
shell()
await load()
}
setInterval(async()=>{if(!S.me||document.hidden)return;try{const m=await api('GET','/me');const before=S.me.counts.inbox?S.me.counts.inbox.n:0;S.me.counts=m.counts;S.me.aliases=m.aliases;if((m.counts.inbox?m.counts.inbox.n:0)!==before&&S.folder==='inbox'&&!S.busy)await load();paintSide()}catch{}},45000)
boot()
