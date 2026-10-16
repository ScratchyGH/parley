import{h,mount,GET,POST,avatar,fail,dialog,field,copyText,confirmBox}from'./util.js'

export async function switchTo(id){
await POST('/api/accounts/switch',{user_id:id})
location.href='/'
}

export function addAccountDialog(){
let tab='login'
const body=h('div',{class:'bd'})
const d=dialog('Add an account',body,{})
const draw=()=>{
const err=h('div',{class:'err',role:'alert'})
const un=h('input',{class:'inp',autocomplete:'username',autocapitalize:'none',spellcheck:false,maxLength:40,required:true})
const pw=h('input',{class:'inp',type:'password',autocomplete:tab==='login'?'current-password':'new-password',maxLength:200,required:true})
const tot=h('input',{class:'inp',autocomplete:'one-time-code',maxLength:24,placeholder:'123456 or backup code','aria-label':'Two-factor code'})
const totBox=h('div',{hidden:true},field('Two-factor code',tot))
const go_=h('button',{class:'btn pri',type:'submit',style:{width:'100%',marginTop:'8px'}},tab==='login'?'Sign in':'Create account')
const form=h('form',{on:{submit:async e=>{
e.preventDefault()
err.textContent=''
go_.disabled=true
try{
if(tab==='login'){
await POST('/api/auth/login',{username:un.value.trim(),password:pw.value,totp:tot.value.trim()||undefined})
location.href='/'
}else{
if(pw.value.length<10){err.textContent='Password must be at least 10 characters';go_.disabled=false;return}
const r=await POST('/api/auth/register',{username:un.value.trim(),password:pw.value})
mount(body,h('p',{class:'hint',style:{marginTop:0}},'Parley has no email on file. This recovery code is the only way to reset the password. It is shown once.'),
h('div',{class:'card',style:{fontFamily:'var(--mono)',fontSize:'18px',textAlign:'center',userSelect:'all',margin:'12px 0'}},r.recovery_code),
h('div',{class:'row'},h('button',{class:'btn',on:{click:()=>copyText(r.recovery_code)}},'Copy'),h('button',{class:'btn pri',on:{click:()=>{location.href='/'}}},'I have saved it, continue')))
}
}catch(x){
if(x.data?.need_totp){totBox.hidden=false;tot.focus()}
err.textContent=x.message
go_.disabled=false
}
}}},field('Username',un),field('Password',pw),totBox,err,go_)
mount(body,h('div',{class:'tabs',style:{marginBottom:'12px'}},[['login','Sign in'],['register','Create new']].map(([k,l])=>h('button',{type:'button',class:tab===k?'on':'',on:{click:()=>{tab=k;draw()}}},l))),
h('p',{class:'hint',style:{marginTop:0}},'The account you are using now stays signed in on this device. You can switch between them at any time.'),form)
un.focus()
}
draw()
return d
}

export async function accountsList(){
const box=h('div',{class:'list'})
async function draw(){
let d
try{d=await GET('/api/accounts')}catch(e){mount(box,h('div',{class:'err'},e.message));return}
mount(box,d.accounts.map(a=>h('div',{class:'li'},avatar(a,'sm'),h('div',{class:'grow'},h('b',null,a.display_name),h('small',null,'@'+a.username+(a.current?' · in use':''))),
a.current?null:h('button',{class:'btn sm pri',on:{click:async()=>{try{await switchTo(a.id)}catch(e){fail(e)}}}},'Switch'),
a.current?null:h('button',{class:'btn sm dng',on:{click:async()=>{
if(!await confirmBox('Forget @'+a.username+'?','It is signed out on this device. You can sign in to it again later.','Forget',true))return
try{await POST('/api/accounts/remove',{user_id:a.id});draw()}catch(e){fail(e)}
}}},'Forget'))))
}
await draw()
return box
}

export function accountsDialog(){
const body=h('div',{class:'bd'})
const d=dialog('Switch account',body,{footer:close=>[h('button',{class:'btn',on:{click:()=>{close();addAccountDialog()}}},'Add an account'),h('button',{class:'btn pri',on:{click:close}},'Done')]})
accountsList().then(l=>mount(body,l))
return d
}
