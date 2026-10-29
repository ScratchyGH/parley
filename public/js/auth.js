import{h,mount,icon,GET,POST,field,copyText,saveBlob,toast,avatar}from'./util.js'
import{switchTo}from'./accounts.js'
import{passkeysSupported,signInWithPasskey}from'./webauthn.js'

export function renderAuth(root,onDone,note){
let tab='login'
const social=h('div',{class:'oauth'})
GET('/api/auth/providers').then(d=>{
const kids=d.oauth.map(p=>h('a',{class:'btn',href:'/api/auth/oauth/'+p.id+'/start'},'Continue with '+p.name))
if(passkeysSupported())kids.unshift(h('button',{class:'btn',type:'button',on:{click:async e=>{
const b=e.currentTarget
b.disabled=true
try{onDone(await signInWithPasskey())}catch(x){if(!x.cancelled)toast(x.message,'err');b.disabled=false}
}}},icon('lock','s'),'Sign in with a passkey'))
if(kids.length)mount(social,h('div',{class:'or'},'or'),kids)
}).catch(()=>{})
const card=h('div',{class:'card'})
const saved=h('div',{class:'list',style:{marginBottom:'12px'}})
mount(root,h('div',{class:'auth'},card))
GET('/api/accounts').then(d=>{
if(!d.accounts.length)return
mount(saved,h('div',{class:'hint'},'Continue as'),d.accounts.map(u=>h('button',{type:'button',class:'li',style:{width:'100%',textAlign:'left',cursor:'pointer'},on:{click:async()=>{try{await switchTo(u.id)}catch(x){toast(x.message,'err')}}}},avatar(u,'sm'),h('div',{class:'grow'},h('b',null,u.display_name),h('small',null,'@'+u.username)))))
}).catch(()=>{})
draw()
function codeScreen(username,code,then){
let ack=false
const btn=h('button',{class:'btn pri',disabled:true,on:{click:then}},'Continue')
const cb=h('input',{type:'checkbox',id:'ack',on:{change:e=>{ack=e.target.checked;btn.disabled=!ack}}})
mount(card,
h('h1',null,'Save your recovery code'),
h('p',{class:'hint'},'Parley has no email on file. This code is the only way to reset your password. It is shown once and each use replaces it.'),
h('div',{class:'card',style:{'font-family':'var(--mono)','font-size':'18px','text-align':'center','letter-spacing':'.06em','margin':'12px 0','user-select':'all'}},code),
h('div',{class:'row'},
h('button',{class:'btn',on:{click:()=>copyText(code)}},icon('copy','s'),'Copy'),
h('button',{class:'btn',on:{click:()=>saveBlob(new Blob([`Parley recovery code for ${username}\n${code}\n`],{type:'text/plain'}),'parley-recovery-code.txt')}},icon('download','s'),'Download')),
h('div',{class:'row',style:{margin:'16px 0 12px'}},cb,h('label',{for:'ack'},'I have stored this code somewhere safe')),
btn)
}
function draw(){
const err=h('div',{class:'err',role:'alert'})
const un=h('input',{class:'inp',autocomplete:'username',autocapitalize:'none',spellcheck:false,maxLength:80,required:true,autofocus:true})
const pw=h('input',{class:'inp',type:'password',autocomplete:tab==='login'?'current-password':'new-password',required:true,maxLength:200})
const dn=h('input',{class:'inp',maxLength:32,autocomplete:'nickname'})
const rc=h('input',{class:'inp',autocomplete:'off',spellcheck:false,placeholder:'xxxxx-xxxxx-xxxxx-xxxxx'})
const tot=h('input',{class:'inp',autocomplete:'one-time-code',inputmode:'text',spellcheck:false,maxLength:40,placeholder:'123456, backup code or recovery code','aria-label':'Two-factor code'})
const totBox=h('div',{hidden:true},field('Two-factor code',tot))
const pw2=h('input',{class:'inp',type:'password',autocomplete:'new-password',maxLength:200})
const submit=h('button',{class:'btn pri',type:'submit',style:{width:'100%',margin:'8px 0 0'}},tab==='login'?'Sign in':tab==='register'?'Create account':'Reset password')
const form=h('form',{on:{submit:async e=>{
e.preventDefault()
err.textContent=''
if(tab!=='login'&&pw.value.length<10){err.textContent='Password must be at least 10 characters';return}
if(tab!=='login'&&pw.value!==pw2.value){err.textContent='Passwords do not match';return}
submit.disabled=true
try{
if(tab==='login'){
const d=await POST('/api/auth/login',{username:un.value.trim(),password:pw.value,totp:tot.value.trim()||undefined})
onDone(d.user)
}else if(tab==='register'){
const d=await POST('/api/auth/register',{username:un.value.trim(),password:pw.value,display_name:dn.value.trim()||undefined})
codeScreen(un.value.trim(),d.recovery_code,()=>onDone(d.user))
}else{
const d=await POST('/api/auth/recover',{username:un.value.trim(),recovery_code:rc.value.trim(),password:pw.value})
codeScreen(un.value.trim(),d.recovery_code,()=>{tab='login';draw()})
}
}catch(x){if(x.data?.need_totp){totBox.hidden=false;tot.focus()}err.textContent=x.message;submit.disabled=false}
}}},
field('Username',un,tab==='register'?'3 to 24 letters (any language), numbers, dots, dashes or underscores':null),
tab==='register'?field('Display name (optional)',dn):null,
tab==='recover'?field('Recovery code',rc):null,
field(tab==='recover'?'New password':'Password',pw,tab!=='login'?'At least 10 characters':null),
tab!=='login'?field('Confirm password',pw2):null,
tab==='login'?totBox:null,
err,submit)
const tabs=h('div',{class:'tabs',role:'tablist'},
...[['login','Sign in'],['register','Register']].map(([k,l])=>h('button',{role:'tab','aria-selected':String(tab===k),class:tab===k?'on':'',on:{click:()=>{tab=k;draw()}}},l)))
mount(card,
h('div',{class:'logo'},h('img',{class:'au-m',src:'/mascot.webp',width:56,height:56,alt:''}),h('div',null,h('h1',null,'Parley'),h('div',{class:'hint',style:{margin:'0'}},'Chat, voice and communities'))),
note?h('div',{class:'ban',style:{margin:'0 0 12px',borderRadius:'6px',border:'1px solid var(--warn)'}},note):null,
tab==='login'?saved:null,
tab==='recover'?null:tabs,
tab==='recover'?h('h2',{style:{margin:'0 0 8px',fontSize:'16px',color:'var(--strong)'}},'Reset your password'):null,
form,
tab==='recover'?null:social,
h('div',{class:'row',style:{justifyContent:'center',marginTop:'12px'}},
tab==='recover'?h('button',{class:'btn sm',on:{click:()=>{tab='login';draw()}}},'Back to sign in'):h('button',{class:'btn sm',on:{click:()=>{tab='recover';draw()}}},'Forgot password?')))
}
}

export function renderAppeal(root,back){
const err=h('div',{class:'err',role:'alert'})
const un=h('input',{class:'inp',autocomplete:'username',required:true,maxLength:40})
const pw=h('input',{class:'inp',type:'password',autocomplete:'current-password',required:true})
const msg=h('textarea',{class:'inp',rows:5,minLength:10,maxLength:2000,required:true})
const evi=h('textarea',{class:'inp',rows:3,maxLength:1200,placeholder:'https://… (one link per line, up to 5)'})
const btn=h('button',{class:'btn pri',type:'submit'},'Submit appeal')
mount(root,h('div',{class:'auth'},h('div',{class:'card'},h('h1',null,'Appeal a suspension'),h('p',{class:'hint'},'Sign in details are only used to confirm the account is yours. An administrator will review your appeal.'),
h('form',{on:{submit:async e=>{
e.preventDefault()
err.textContent=''
btn.disabled=true
try{
await POST('/api/appeals',{username:un.value.trim(),password:pw.value,message:msg.value.trim(),evidence:evi.value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,5)})
mount(root,h('div',{class:'auth'},h('div',{class:'card'},h('h1',null,'Appeal submitted'),h('p',null,'An administrator will review it. Check back by trying to sign in later.'),h('button',{class:'btn',on:{click:back}},'Back to sign in'))))
}catch(x){err.textContent=x.message;btn.disabled=false}
}}},field('Username',un),field('Password',pw),field('What happened?',msg),field('Evidence links (optional)',evi,'Screenshots or posts hosted somewhere you control. Only https:// links are accepted.'),err,h('div',{class:'row',style:{marginTop:'8px'}},h('button',{type:'button',class:'btn',on:{click:back}},'Back'),btn)))))
}
