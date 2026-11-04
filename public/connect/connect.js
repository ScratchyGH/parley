import{h,api,mount,ls}from'/kids/ui.js'
const root=document.getElementById('app')
const AV=['fox','owl','cat','bear','frog','panda','whale','bunny']
const NS='http://www.w3.org/2000/svg'
const ic=(d,s=18)=>{const v=document.createElementNS(NS,'svg');v.setAttribute('viewBox','0 0 24 24');v.setAttribute('width',s);v.setAttribute('height',s);v.setAttribute('fill','none');v.setAttribute('stroke','currentColor');v.setAttribute('stroke-width','2');v.setAttribute('stroke-linecap','round');v.setAttribute('stroke-linejoin','round');v.setAttribute('aria-hidden','true');const p=document.createElementNS(NS,'path');p.setAttribute('d',d);v.append(p);return v}
const I={home:'M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',dev:'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2',kid:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',fr:'M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.9M16 2.1a4 4 0 010 7.8',act:'M3 12h4l3-9 4 18 3-9h4',acc:'M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z',ok:'M5 13l4 4L19 7'}
let tok=ls.get('pc.tok'),D=null,S=null,tab='overview',flash=null,code=null,tick=0
const ago=t=>{const s=Math.max(0,(Date.now()-t)/1000);return s<60?'just now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':new Date(t).toLocaleDateString()}
const say=(t,k)=>{flash={t,k}}
const logo=()=>h('div',{class:'brand'},h('i',null,ic(I.acc,20)),'PK Connect',h('small',null,'for Parley Kids'))
const call=async(path,body,method)=>{
try{return await api(path,body,tok,method)}
catch(e){if(e.status===401&&tok){tok=null;ls.del('pc.tok');authView()}throw e}
}
function authView(mode='login',recovery){
const err=h('div',{class:'msg e',hidden:true})
const un=h('input',{autocomplete:'username',maxlength:'24','aria-label':'Username'})
const pw=h('input',{type:'password',autocomplete:mode==='login'?'current-password':'new-password','aria-label':'Password'})
const terms=h('input',{type:'checkbox'})
const rc=h('input',{autocomplete:'off','aria-label':'Recovery code',placeholder:'XXXX-XXXX-XXXX-XXXX'})
const go=h('button',{class:'btn',type:'button'},mode==='login'?'Sign in':mode==='signup'?'Create parent account':'Reset password')
const run=async()=>{
go.disabled=true;err.hidden=true
try{
if(mode==='login'){const r=await api('/api/connect/login',{username:un.value,password:pw.value});tok=r.token;ls.set('pc.tok',tok);load()}
else if(mode==='signup'){const r=await api('/api/connect/signup',{username:un.value,password:pw.value,terms:terms.checked});tok=r.token;ls.set('pc.tok',tok);recoveryView(r.recovery)}
else{const r=await api('/api/connect/recover',{username:un.value,password:pw.value,recovery:rc.value});recoveryView(r.recovery,true)}
}catch(e){err.hidden=false;err.textContent=e.message;go.disabled=false}
}
go.addEventListener('click',run)
for(const i of[un,pw,rc])i.addEventListener('keydown',e=>{if(e.key==='Enter')run()})
const sw=(m,t)=>h('button',{class:'btn sec sm',type:'button',on:{click:()=>authView(m)}},t)
mount(root,h('main',{class:'auth'},logo(),h('section',{class:'panel'},h('h1',null,mode==='login'?'Sign in':mode==='signup'?'Create your parent account':'Reset your password'),h('p',null,mode==='signup'?'PK Connect is where you approve your child\'s device, account and friends for Parley Kids.':mode==='login'?'Manage your children\'s devices, friends and safety.':'Use the recovery code you saved when you made your account.'),h('label',null,'Username',un),mode==='recover'?h('label',null,'Recovery code',rc):null,h('label',null,mode==='recover'?'New password':'Password',pw),mode==='signup'?h('p',{class:'hint'},'Use at least 10 characters.'):null,mode==='signup'?h('label',{class:'chk'},terms,h('span',null,'I am a parent or legal guardian of the children I will add. I read the ',h('a',{href:'/kids/privacy.html',target:'_blank',rel:'noopener'},'privacy notice'),'.')):null,err,go),h('div',{class:'acts'},mode!=='login'?sw('login','Sign in'):null,mode!=='signup'?sw('signup','New parent account'):null,mode==='login'?sw('recover','Forgot password'):null)))
}
function recoveryView(rec,reset){
const ok=h('input',{type:'checkbox'})
const go=h('button',{class:'btn',type:'button',disabled:true,on:{click:()=>reset?authView('login'):load()}},reset?'Go to sign in':'Continue')
ok.addEventListener('change',()=>{go.disabled=!ok.checked})
mount(root,h('main',{class:'auth'},logo(),h('section',{class:'panel'},h('h1',null,'Save your recovery code'),h('p',null,'This is the only way back in if you forget your password. It is shown once. Write it down or keep it in a password manager.'),h('div',{class:'code'},rec),h('label',{class:'chk'},ok,h('span',null,'I saved my recovery code.')),go)))
}
let unl=false
function lockView(){
const pin=h('input',{type:'password','aria-label':'Passcode',autocomplete:'off'}),m=h('div',{class:'msg e'}),b=h('button',{class:'btn',type:'button'},'Unlock')
const go=async()=>{try{await call('/api/connect/pin/verify',{pin:pin.value});unl=true;view()}catch(e){m.textContent=e.message;pin.value=''}}
b.addEventListener('click',go)
pin.addEventListener('keydown',e=>{if(e.key==='Enter')go()})
mount(root,h('main',{class:'auth'},logo(),h('h1',null,'Enter your passcode'),h('p',null,'PK Connect is locked.'),pin,b,m))
pin.focus()
}
function pinCard(){
const o=h('input',{type:'password','aria-label':'Current passcode',placeholder:D.parent.pin?'Current passcode':'',autocomplete:'off'}),n=h('input',{type:'password','aria-label':'New passcode',placeholder:'New passcode, 4 to 32 characters',autocomplete:'off'})
const set=h('button',{class:'btn sec',type:'button'},D.parent.pin?'Change passcode':'Set passcode'),rm=h('button',{class:'btn bad',type:'button'},'Remove passcode')
act(set,async()=>{await call('/api/connect/pin',{old:o.value,pin:n.value});unl=true;say('Passcode saved','o')})
act(rm,async()=>{await call('/api/connect/pin',{old:o.value,clear:1});say('Passcode removed','o')})
return h('section',{class:'panel'},h('h2',null,'Passcode'),h('p',null,'Ask for a passcode every time PK Connect opens, so a child cannot get into the parent panel. Use a PIN, a word or a phrase.'),D.parent.pin?o:null,n,h('div',{class:'acts'},set,D.parent.pin?rm:null))
}
function childSettings(c){
const box=h('section',{class:'panel'},h('h2',null,c.display_name+': settings'),h('p',{class:'empty'},'Loading'))
call('/api/connect/children/'+c.id+'/settings').then(cf=>{
const th=h('select',{'aria-label':'Kids app theme'},[['normal','Normal'],['educational','Educational'],['calm','Calm'],['night','Night']].map(([v,l])=>h('option',{value:v,selected:cf.theme===v},l)))
const qs=h('input',{type:'time',value:cf.qs,'aria-label':'Quiet hours start'}),qe=h('input',{type:'time',value:cf.qe,'aria-label':'Quiet hours end'})
const ln=h('input',{type:'checkbox',checked:!!cf.links,'aria-label':'Block links'})
const cap=h('input',{type:'number',min:'0',max:'1000',value:String(cf.cap),'aria-label':'Messages per day'})
const sv=h('button',{class:'btn',type:'button'},'Save settings')
act(sv,async()=>{await call('/api/connect/children/'+c.id+'/settings',{theme:th.value,qs:qs.value,qe:qe.value,tz:-new Date().getTimezoneOffset(),links:ln.checked?1:0,cap:Number(cap.value)||0});say('Settings saved','o')})
mount(box,h('h2',null,c.display_name+': settings'),h('label',null,'Kids app theme',th),h('label',null,'Chat closed from',qs),h('label',null,'Chat opens again at',qe),h('label',null,'Block links ',ln),h('label',null,'Messages per day, 0 for no limit',cap),h('div',{class:'acts'},sv))
}).catch(e=>mount(box,h('p',{class:'msg e'},e.message)))
return box
}
async function load(){
try{[D,S]=await Promise.all([call('/api/connect/overview'),call('/api/connect/safety')]);if(D.parent.pin&&!unl)lockView();else view()}catch(e){if(!tok)return;mount(root,h('main',{class:'auth'},logo(),h('div',{class:'msg e'},e.message),h('button',{class:'btn',type:'button',on:{click:load}},'Try again')))}
}
const pill=(s,t)=>h('span',{class:'pill '+(['active','paired','verified'].includes(s)?'g':['pending','new'].includes(s)?'a':['revoked','rejected','blocked'].includes(s)?'r':'')},t||({paired:'Waiting for code',active:'Active',pending:'Needs approval',revoked:'Revoked',rejected:'Rejected',verified:'Verified',blocked:'Blocked'}[s]||s))
const act=(btn,f)=>btn.addEventListener('click',async()=>{btn.disabled=true;try{await f();await load()}catch(e){say(e.message,'e');view();btn.disabled=false}})
const childName=id=>{const c=D.children.find(x=>x.id===id);return c?c.display_name:null}
const todo=()=>{
const a=D.children.some(c=>c.status==='active'),d=D.devices.some(x=>x.status==='active')
return[['Add your child\'s device',D.devices.length>0],['Give consent and make an activation code',d||D.devices.some(x=>x.consent_at)],['Approve your child\'s account',a],['Approve a friend',S.friends.some(f=>f.status==='active')],['Finish the ID check (optional, unlocks more)',D.parent.id_status==='verified']]
}
function pendingCard(c){
const dn=h('input',{value:c.display_name,maxlength:'20','aria-label':'Display name'}),un=h('input',{value:c.username,maxlength:'16','aria-label':'Username'})
const av=h('select',{'aria-label':'Avatar'},AV.map(a=>h('option',{value:a,selected:a===c.avatar},a)))
const ok=h('input',{type:'checkbox'})
const yes=h('button',{class:'btn',type:'button'},'Approve account'),no=h('button',{class:'btn bad',type:'button'},'Reject')
act(yes,async()=>{if(!ok.checked)throw new Error('Tick the consent box to approve');await call('/api/connect/children/'+c.id+'/approve',{consent:true,username:un.value,display_name:dn.value,avatar:av.value});say('Account approved','o')})
act(no,async()=>{await call('/api/connect/children/'+c.id+'/reject',{});say('Account rejected','o')})
return h('section',{class:'panel hl'},h('div',{class:'ph'},h('h2',null,'Approve '+c.display_name+'\'s account'),pill('pending')),h('p',null,'Your child chose these details. You can change them before approving.'),h('div',{class:'two'},h('label',null,'Display name',dn),h('label',null,'Username',un)),h('label',null,'Avatar',av),h('label',{class:'chk'},ok,h('span',null,'I am this child\'s parent or legal guardian and I consent to this Parley Kids account.')),h('div',{class:'acts'},yes,no))
}
function friendRow(f){
const yes=h('button',{class:'btn sm',type:'button'},'Approve'),no=h('button',{class:'btn bad sm',type:'button'},f.status==='active'?'Remove':'Decline')
act(yes,async()=>{await call('/api/connect/friends/'+f.id+'/approve',{});say('Approved','o')})
act(no,async()=>{await call('/api/connect/friends/'+f.id+'/remove',{});say('Done','o')})
return h('div',{class:'row'},h('div',{class:'grow'},h('b',null,f.a+' and '+f.b),h('span',null,f.status==='active'?'Can chat':f.mine?'Waiting for you':'Waiting for the other parent')),pill(f.status==='active'?'active':'pending',f.status==='active'?'Friends':f.mine?'Needs you':'Waiting'),h('div',{class:'acts'},f.mine?yes:null,f.status==='active'||f.mine?no:null))
}
function addDevice(){
const pair=h('input',{maxlength:'9',autocomplete:'off',placeholder:'XXXX-XXXX','aria-label':'Device ID'}),label=h('input',{value:'Child device',maxlength:'30','aria-label':'Device name'})
const go=h('button',{class:'btn',type:'button'},'Add device')
act(go,async()=>{await call('/api/connect/devices/claim',{pair:pair.value,label:label.value});say('Device added. Now give consent and make an activation code for it.','o')})
return h('section',{class:'panel'},h('h2',null,'Add child device'),h('p',null,'Open Parley Kids on your child\'s device. It shows an 8 character device ID. Enter it here.'),h('div',{class:'two'},h('label',null,'Device ID',pair),h('label',null,'Device name',label)),h('div',{class:'acts'},go))
}
function deviceRow(d){
const mins=h('select',{'aria-label':'Code lifetime'},[5,10,15,30,60].map(m=>h('option',{value:m,selected:m===10},m+' min')))
const kid=h('select',{'aria-label':'Child account'},h('option',{value:''},'New child account'),D.children.filter(c=>c.status==='active').map(c=>h('option',{value:c.id},c.display_name)))
const cons=h('input',{type:'checkbox','aria-label':'Parental consent'})
const mk=h('button',{class:'btn sm',type:'button'},'Make activation code'),rv=h('button',{class:'btn bad sm',type:'button'},'Revoke')
act(mk,async()=>{if(!cons.checked)throw new Error('Tick the consent box to make a code');const r=await call('/api/connect/devices/'+d.id+'/code',{minutes:Number(mins.value),child:kid.value||undefined,consent:true});code={id:r.id,dev:d.id,code:r.code,exp:r.exp};say('Code created. Type it on the child device.','o')})
act(rv,async()=>{if(!confirm('Revoke '+d.label+'? It will lose access immediately.'))throw new Error('Cancelled');await call('/api/connect/devices/'+d.id+'/revoke',{});say('Device revoked','o')})
const shown=code&&code.dev===d.id&&code.exp>Date.now()&&d.status==='paired'
return h('div',{class:'dev'},h('div',{class:'row'},h('div',{class:'grow'},h('b',null,d.label),h('span',null,(d.child_id?childName(d.child_id)||'Child':'No child yet')+' / seen '+ago(d.last_seen))),pill(d.status),d.status!=='revoked'?rv:null),d.status==='paired'?h('div',{class:'sub'},shown?h('div',null,h('div',{class:'code'},code.code),h('p',null,'Expires '+new Date(code.exp).toLocaleTimeString()+'. Works once, only on '+d.label+'.')):h('div',null,h('label',{class:'chk'},cons,h('span',null,'I am this child\'s parent or legal guardian. I read the ',h('a',{href:'/kids/privacy.html',target:'_blank',rel:'noopener'},'privacy notice'),' and consent to Parley Kids collecting the details described in it.')),h('div',{class:'acts'},mins,kid,mk))):null)
}
function idCard(){
const st=D.parent.id_status
const f=h('input',{type:'file',accept:'image/jpeg,image/png','aria-label':'Photo of your ID'})
const go=h('button',{class:'btn',type:'button'},st==='rejected'?'Try again':'Send for review')
act(go,async()=>{
const file=f.files[0]
if(!file)throw new Error('Choose a photo of your ID first')
const url=URL.createObjectURL(file)
const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('That file is not an image'));i.src=url})
const k=Math.min(1,1400/Math.max(img.width,img.height)),cv=document.createElement('canvas')
cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k)
cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height)
URL.revokeObjectURL(url)
await call('/api/connect/idcheck',{image:cv.toDataURL('image/jpeg',.72)})
say('Sent. A person reviews it, then the photo is deleted.','o')
})
return h('section',{class:'panel'},h('div',{class:'ph'},h('h2',null,'ID check'),pill(st==='none'?'':st,st==='none'?'Optional':st==='pending'?'In review':st==='verified'?'Verified':'Not approved')),h('p',null,'Optional. A person checks a photo of your government ID to confirm you are an adult, then the photo is deleted right away. We do not store your name or ID number.'),h('div',{class:'cmp'},h('div',null,h('b',null,'Without it'),h('span',null,'1 child account, up to 3 friends each. Chat works fully.')),h('div',null,h('b',null,'With it'),h('span',null,'Up to 5 child accounts, up to 20 friends each.'))),st==='verified'?h('div',{class:'msg o'},'Your ID check is complete.'):st==='pending'?h('div',{class:'msg o'},'Your photo is waiting for review.'):h('div',null,h('label',null,'Photo of your ID',f),h('div',{class:'acts'},go)))
}
function view(){
const pend=D.children.filter(c=>c.status==='pending')
const fneed=S.friends.filter(f=>f.mine).length
const tabs=[['overview','Overview',I.home,pend.length],['devices','Devices',I.dev,0],['children','Children',I.kid,0],['friends','Friends and safety',I.fr,fneed],['activity','Activity',I.act,0],['account','Account',I.acc,0]]
const nav=h('nav',{class:'nav','aria-label':'PK Connect'},tabs.map(t=>h('button',{type:'button','aria-current':tab===t[0]?'page':undefined,on:{click:()=>{tab=t[0];flash=null;view()}}},ic(t[2]),h('span',null,t[1]),t[3]?h('b',null,String(t[3])):null)))
const fl=flash?h('div',{class:'msg '+flash.k},flash.t):null
let body
if(tab==='overview'){
const steps=todo(),left=steps.filter(s=>!s[1]).length
body=[h('header',{class:'top'},h('h1',null,'Overview'),h('p',null,D.children.length?'Everything for your family in one place.':'Set up Parley Kids for your child in a few steps.')),fl,
h('div',{class:'stats'},h('div',{class:'stat'},h('b',null,String(D.children.filter(c=>c.status==='active').length)),h('span',null,'Children')),h('div',{class:'stat'},h('b',null,String(D.devices.filter(d=>d.status==='active').length)),h('span',null,'Active devices')),h('div',{class:'stat'},h('b',null,String(S.friends.filter(f=>f.status==='active').length)),h('span',null,'Friendships')),h('div',{class:'stat'+(pend.length+fneed?' warn':'')},h('b',null,String(pend.length+fneed)),h('span',null,'Need you'))),
...pend.map(pendingCard),
...S.friends.filter(f=>f.mine).map(f=>h('section',{class:'panel hl'},h('h2',null,'Friend request'),friendRow(f))),
left?h('section',{class:'panel'},h('h2',null,'Setup'),h('ul',{class:'todo'},steps.map(s=>h('li',{class:s[1]?'done':''},h('i',null,s[1]?ic(I.ok,14):null),s[0])))):null,
D.devices.length?null:addDevice()]
}else if(tab==='devices'){
body=[h('header',{class:'top'},h('h1',null,'Devices'),h('p',null,'Every device needs your code. Codes work once, on one device.')),fl,addDevice(),h('section',{class:'panel'},h('h2',null,'Linked devices'),D.devices.length?h('div',null,D.devices.map(deviceRow)):h('p',{class:'empty'},'Nothing linked yet.'))]
}else if(tab==='children'){
body=[h('header',{class:'top'},h('h1',null,'Children'),h('p',null,'Up to '+D.caps.kids+' child account'+(D.caps.kids>1?'s':'')+(D.parent.id_status==='verified'?'.':'. Finish the ID check for more.'))),fl,...pend.map(pendingCard),h('section',{class:'panel'},D.children.length?h('div',null,D.children.map(c=>{
const del=h('button',{class:'btn bad sm',type:'button'},'Delete'),chat=h('button',{class:'btn sec sm',type:'button'},c.chat_off?'Turn chat on':'Turn chat off')
act(del,async()=>{if(!confirm('Delete '+c.display_name+'\'s account? This cannot be undone.'))throw new Error('Cancelled');await call('/api/connect/children/'+c.id+'/delete',{});say('Account deleted','o')})
act(chat,async()=>{await call('/api/connect/children/'+c.id+'/chat',{off:!c.chat_off});say(c.chat_off?'Chat is on':'Chat is off','o')})
return h('div',{class:'row'},h('div',{class:'grow'},h('b',null,c.display_name),h('span',null,'@'+c.username+(c.muted_until>Date.now()?' / chat paused for a bit':'')+(c.chat_off?' / chat off':''))),pill(c.status),h('div',{class:'acts'},c.status==='active'?chat:null,del))})):h('p',{class:'empty'},'No children yet.')),...D.children.filter(c=>c.status==='active').map(childSettings)]
}else if(tab==='friends'){
body=[h('header',{class:'top'},h('h1',null,'Friends and safety'),h('p',null,'Children can only chat with friends that both parents approved. Every message is checked before it is sent.')),fl,h('section',{class:'panel'},h('h2',null,'Friends'),S.friends.length?h('div',null,S.friends.map(friendRow)):h('p',{class:'empty'},'No friends yet. Your child shares their friend code, and you both approve the request.')),h('section',{class:'panel'},h('h2',null,'Reports'),S.reports.length?h('div',null,S.reports.map(r=>h('div',{class:'row'},h('div',{class:'grow'},h('b',null,r.rn+' reported '+r.an),h('span',null,'"'+r.body+'" / '+ago(r.at))),pill(r.status==='open'?'pending':'active',r.status==='open'?'In review':'Closed')))):h('p',{class:'empty'},'No reports.')),h('section',{class:'panel'},h('h2',null,'Safety alerts'),D.log.filter(l=>l.kind==='safety').length?D.log.filter(l=>l.kind==='safety').map(l=>h('div',{class:'log'},h('time',null,ago(l.at)),h('span',null,l.detail))):h('p',{class:'empty'},'No alerts. Blocked messages that look unsafe show up here.')),h('section',{class:'panel'},h('h2',null,'How it is kept safe'),h('ul',{class:'bul'},h('li',null,'Messages are checked before they send, including spaced out, swapped and hidden letters.'),h('li',null,'Blocked: bad language, threats, bullying, links, phone numbers, emails, addresses, school and password details, requests for photos, secrets, meeting up and moving to other apps.'),h('li',null,'Repeated blocks pause chat, then turn it off until you turn it back on. Serious ones alert you at once.'),h('li',null,'Children can report a message and block a friend. There are no images, files or strangers.')))]
}else if(tab==='activity'){
body=[h('header',{class:'top'},h('h1',null,'Activity'),h('p',null,'Setup and safety events from the last 90 days.')),h('section',{class:'panel'},D.log.length?D.log.map(l=>h('div',{class:'log'},h('time',null,ago(l.at)),h('span',null,l.detail))):h('p',{class:'empty'},'Nothing yet.'))]
}else{
const ex=h('button',{class:'btn sec',type:'button'},'Download my data'),out=h('button',{class:'btn sec',type:'button'},'Sign out')
const pw=h('input',{type:'password','aria-label':'Password to confirm',autocomplete:'current-password'}),del=h('button',{class:'btn bad',type:'button'},'Delete account and all children')
act(ex,async()=>{const j=await call('/api/connect/export');const a=h('a',{href:URL.createObjectURL(new Blob([JSON.stringify(j,null,1)],{type:'application/json'})),download:'pk-connect-data.json'});document.body.append(a);a.click();a.remove();say('Data downloaded','o')})
out.addEventListener('click',async()=>{try{await call('/api/connect/logout',{})}catch{}tok=null;ls.del('pc.tok');authView()})
del.addEventListener('click',async()=>{if(!pw.value){say('Enter your password to confirm','e');view();return}if(!confirm('Permanently delete your account, every child account and every device?'))return;try{await call('/api/connect/delete',{password:pw.value});tok=null;ls.del('pc.tok');authView()}catch(e){say(e.message,'e');view()}})
body=[h('header',{class:'top'},h('h1',null,'Account')),fl,idCard(),pinCard(),h('section',{class:'panel'},h('h2',null,'Your data'),h('p',null,'Download everything PK Connect stores about your family.'),h('div',{class:'acts'},ex,out,h('a',{class:'btn sec',href:'/kids/privacy.html',target:'_blank',rel:'noopener'},'Privacy notice'))),h('section',{class:'panel'},h('h2',null,'Delete account'),h('p',null,'Removes your parent account, all child accounts and all devices. Children lose access at once.'),h('label',null,'Password',pw),h('div',{class:'acts'},del))]
}
mount(root,h('div',{class:'app'},h('aside',{class:'side'},logo(),nav,h('div',{class:'who'},h('b',null,D.parent.username),h('span',null,D.parent.id_status==='verified'?'ID verified':'Parent account'))),h('main',{class:'main'},body)))
clearInterval(tick)
tick=setInterval(()=>{const a=document.activeElement;if(!document.hidden&&tab!=='account'&&!(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)))load()},15000)
}
if(tok)load();else authView('login')
