import{h,api,mount,ls}from'/kids/ui.js'
const root=document.getElementById('app')
const AV=['fox','owl','cat','bear','frog','panda','whale','bunny']
let tok=ls.get('pc.tok'),D=null,tab='overview',flash=null,code=null,tick=0
const ago=t=>{const s=Math.max(0,(Date.now()-t)/1000);return s<60?'just now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':new Date(t).toLocaleDateString()}
const say=(t,k)=>{flash={t,k}}
const logo=()=>h('div',{class:'brand'},h('i',null,(()=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d','M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z');p.setAttribute('fill','#fff');s.append(p);return s})()),'PK Connect',h('small',null,'for Parley Kids'))
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
mount(root,h('main',{class:'auth'},logo(),h('section',{class:'panel'},h('h1',null,mode==='login'?'Sign in':mode==='signup'?'Create your parent account':'Reset your password'),h('p',null,mode==='signup'?'PK Connect is where you approve your child\'s device and account for Parley Kids.':mode==='login'?'Manage your children\'s devices and accounts.':'Use the recovery code you saved when you made your account.'),h('label',null,'Username',un),mode==='recover'?h('label',null,'Recovery code',rc):null,h('label',null,mode==='recover'?'New password':'Password',pw),mode==='signup'?h('p',null,'Use at least 10 characters.'):null,mode==='signup'?h('label',{class:'chk'},terms,h('span',null,'I am a parent or legal guardian of the children I will add. I read the ',h('a',{href:'/kids/privacy.html',target:'_blank',rel:'noopener'},'privacy notice'),'.')):null,err,go),h('div',{class:'acts'},mode!=='login'?sw('login','Sign in'):null,mode!=='signup'?sw('signup','New parent account'):null,mode==='login'?sw('recover','Forgot password'):null)))
}
function recoveryView(rec,reset){
const ok=h('input',{type:'checkbox'})
const go=h('button',{class:'btn',type:'button',disabled:true,on:{click:()=>reset?authView('login'):load()}},reset?'Go to sign in':'Continue')
ok.addEventListener('change',()=>{go.disabled=!ok.checked})
mount(root,h('main',{class:'auth'},logo(),h('section',{class:'panel'},h('h1',null,'Save your recovery code'),h('p',null,'This is the only way to get back in if you forget your password. It is shown once. Write it down or store it in a password manager.'),h('div',{class:'code'},rec),h('label',{class:'chk'},ok,h('span',null,'I saved my recovery code.')),go)))
}
async function load(){
try{D=await call('/api/connect/overview');view()}catch(e){if(!tok)return;mount(root,h('main',{class:'auth'},logo(),h('div',{class:'msg e'},e.message),h('button',{class:'btn',type:'button',on:{click:load}},'Try again')))}
}
const pill=s=>h('span',{class:'pill '+(s==='active'||s==='paired'?'g':s==='pending'||s==='new'?'a':s==='revoked'||s==='rejected'?'r':'')},s==='paired'?'Waiting for code':s==='active'?'Active':s==='pending'?'Needs approval':s==='revoked'?'Revoked':s==='rejected'?'Rejected':s)
const act=(btn,f)=>btn.addEventListener('click',async()=>{btn.disabled=true;try{await f();await load()}catch(e){say(e.message,'e');view();btn.disabled=false}})
const childName=id=>{const c=D.children.find(x=>x.id===id);return c?c.display_name:null}
function pendingCard(c){
const dn=h('input',{value:c.display_name,maxlength:'20','aria-label':'Display name'}),un=h('input',{value:c.username,maxlength:'16','aria-label':'Username'})
const av=h('select',{'aria-label':'Avatar'},AV.map(a=>h('option',{value:a,selected:a===c.avatar},a)))
const ok=h('input',{type:'checkbox'})
const yes=h('button',{class:'btn',type:'button'},'Approve account'),no=h('button',{class:'btn bad',type:'button'},'Reject')
act(yes,async()=>{if(!ok.checked)throw new Error('Tick the consent box to approve');await call('/api/connect/children/'+c.id+'/approve',{consent:true,username:un.value,display_name:dn.value,avatar:av.value});say('Account approved','o')})
act(no,async()=>{await call('/api/connect/children/'+c.id+'/reject',{});say('Account rejected','o')})
return h('section',{class:'panel'},h('h2',null,'Approve '+c.display_name+'\'s account'),h('p',null,'Your child chose these details. You can change them before approving.'),h('div',{class:'two'},h('label',null,'Display name',dn),h('label',null,'Username',un)),h('label',null,'Avatar',av),h('label',{class:'chk'},ok,h('span',null,'I am this child\'s parent or legal guardian and I consent to this Parley Kids account.')),h('div',{class:'acts'},yes,no))
}
function addDevice(){
const pair=h('input',{maxlength:'9',autocomplete:'off',placeholder:'XXXX-XXXX','aria-label':'Device ID'}),label=h('input',{value:'Child device',maxlength:'30','aria-label':'Device name'})
const go=h('button',{class:'btn',type:'button'},'Add device')
act(go,async()=>{const r=await call('/api/connect/devices/claim',{pair:pair.value,label:label.value});say('Device added. Now make an activation code for it.','o')})
return h('section',{class:'panel'},h('h2',null,'Add child device'),h('p',null,'Open Parley Kids on your child\'s device. It shows an 8 character device ID. Enter it here.'),h('div',{class:'two'},h('label',null,'Device ID',pair),h('label',null,'Device name',label)),h('div',{class:'acts'},go))
}
function deviceRow(d){
const mins=h('select',{'aria-label':'Code lifetime'},[5,10,15,30,60].map(m=>h('option',{value:m,selected:m===10},m+' min')))
const kid=h('select',{'aria-label':'Child account'},h('option',{value:''},'New child account'),D.children.filter(c=>c.status==='active').map(c=>h('option',{value:c.id},c.display_name)))
const cons=h('input',{type:'checkbox','aria-label':'Parental consent'})
const mk=h('button',{class:'btn sm',type:'button'},'Make activation code'),rv=h('button',{class:'btn bad sm',type:'button'},'Revoke')
act(mk,async()=>{if(!cons.checked)throw new Error('Tick the consent box to make a code');const r=await call('/api/connect/devices/'+d.id+'/code',{minutes:Number(mins.value),child:kid.value||undefined,consent:true});code={id:r.id,dev:d.id,code:r.code,exp:r.exp};say('Code created. Type it on the child device.','o')})
act(rv,async()=>{if(!confirm('Revoke '+d.label+'? It will lose access immediately.'))throw new Error('Cancelled');await call('/api/connect/devices/'+d.id+'/revoke',{});say('Device revoked','o')})
const shown=code&&code.dev===d.id&&code.exp>Date.now()
const cc=shown?h('div',null,h('div',{class:'code'},code.code),h('p',null,'Expires '+new Date(code.exp).toLocaleTimeString()+'. Works once, only on '+d.label+'.')):null
return h('div',{class:'row'},h('div',{class:'grow'},h('b',null,d.label),h('span',null,(d.child_id?childName(d.child_id)||'Child':'No child yet')+' / seen '+ago(d.last_seen))),pill(d.status),d.status==='paired'?h('div',{class:'grow'},h('label',{class:'chk'},cons,h('span',null,'I am this child\'s parent or legal guardian. I read the ',h('a',{href:'/kids/privacy.html',target:'_blank',rel:'noopener'},'privacy notice'),' and consent to Parley Kids collecting the details described in it.')),h('div',{class:'acts'},mins,kid,mk)):null,d.status!=='revoked'?rv:null,cc?h('div',{class:'grow'},cc):null)
}
function view(){
const pend=D.children.filter(c=>c.status==='pending')
const tabs=[['overview','Overview',pend.length],['devices','Devices',0],['children','Children',0],['activity','Activity',0],['account','Account',0]]
const nav=h('nav',{class:'nav','aria-label':'PK Connect'},tabs.map(t=>h('button',{type:'button','aria-current':tab===t[0]?'page':undefined,on:{click:()=>{tab=t[0];flash=null;view()}}},t[1],t[2]?h('b',null,String(t[2])):null)))
const fl=flash?h('div',{class:'msg '+flash.k},flash.t):null
let body
if(tab==='overview'){
body=[h('h1',null,'Overview'),fl,...pend.map(pendingCard),h('section',{class:'panel'},h('h2',null,'Your family'),h('div',null,D.children.length?D.children.map(c=>h('div',{class:'row'},h('div',{class:'grow'},h('b',null,c.display_name),h('span',null,'@'+c.username)),pill(c.status))):h('p',{class:'empty'},'No children yet. Add a child device to begin.'))),h('section',{class:'panel'},h('h2',null,'Devices'),D.devices.length?h('div',null,D.devices.slice(0,5).map(d=>h('div',{class:'row'},h('div',{class:'grow'},h('b',null,d.label),h('span',null,'seen '+ago(d.last_seen))),pill(d.status)))):h('p',{class:'empty'},'No devices yet.')),D.devices.length?null:addDevice()]
}else if(tab==='devices'){
body=[h('h1',null,'Devices'),fl,addDevice(),h('section',{class:'panel'},h('h2',null,'Linked devices'),D.devices.length?h('div',null,D.devices.map(deviceRow)):h('p',{class:'empty'},'Nothing linked yet.'))]
}else if(tab==='children'){
body=[h('h1',null,'Children'),fl,...pend.map(pendingCard),h('section',{class:'panel'},D.children.length?h('div',null,D.children.map(c=>{const del=h('button',{class:'btn bad sm',type:'button'},'Delete');act(del,async()=>{if(!confirm('Delete '+c.display_name+'\'s account? This cannot be undone.'))throw new Error('Cancelled');await call('/api/connect/children/'+c.id+'/delete',{});say('Account deleted','o')});return h('div',{class:'row'},h('div',{class:'grow'},h('b',null,c.display_name),h('span',null,'@'+c.username+' / '+c.avatar)),pill(c.status),del)})):h('p',{class:'empty'},'No children yet.'))]
}else if(tab==='activity'){
body=[h('h1',null,'Activity'),h('section',{class:'panel'},D.log.length?D.log.map(l=>h('div',{class:'log'},h('time',null,ago(l.at)),h('span',null,l.detail))):h('p',{class:'empty'},'Nothing yet.'))]
}else{
const ex=h('button',{class:'btn sec',type:'button'},'Download my data'),out=h('button',{class:'btn sec',type:'button'},'Sign out')
const pw=h('input',{type:'password','aria-label':'Password to confirm',autocomplete:'current-password'}),del=h('button',{class:'btn bad',type:'button'},'Delete account and all children')
act(ex,async()=>{const j=await call('/api/connect/export');const a=h('a',{href:URL.createObjectURL(new Blob([JSON.stringify(j,null,1)],{type:'application/json'})),download:'pk-connect-data.json'});document.body.append(a);a.click();a.remove();say('Data downloaded','o')})
out.addEventListener('click',async()=>{try{await call('/api/connect/logout',{})}catch{}tok=null;ls.del('pc.tok');authView()})
del.addEventListener('click',async()=>{if(!pw.value){say('Enter your password to confirm','e');view();return}if(!confirm('Permanently delete your account, every child account and every device?'))return;try{await call('/api/connect/delete',{password:pw.value});tok=null;ls.del('pc.tok');authView()}catch(e){say(e.message,'e');view()}})
body=[h('h1',null,'Account'),fl,h('section',{class:'panel'},h('h2',null,'Your data'),h('p',null,'Download everything PK Connect stores about your family.'),h('div',{class:'acts'},ex,out)),h('section',{class:'panel'},h('h2',null,'Delete account'),h('p',null,'Removes your parent account, all child accounts and all devices. Children lose access at once.'),h('label',null,'Password',pw),h('div',{class:'acts'},del))]
}
mount(root,h('div',{class:'app'},h('aside',{class:'side'},logo(),nav,h('div',{class:'who'},'Signed in as '+D.parent.username)),h('main',{class:'main'},body)))
clearInterval(tick)
tick=setInterval(()=>{const a=document.activeElement;if(!document.hidden&&tab!=='account'&&!(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)))load()},15000)
}
if(tok)load();else authView('login')
