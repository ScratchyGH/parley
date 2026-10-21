import{h,dialog,mount,POST,fail}from'./util.js'
import{S}from'./state.js'
const UPDATED='October 22, 2026'
const PRIVACY=[
['Information we store','Account details (username, display name, password hash, profile, connected sign-in providers), content you create (messages, files, reactions, polls, scheduled messages), your servers, friends and settings, and active sessions. Direct messages are stored on the server so they can be delivered, searched and moderated; they are not end-to-end encrypted.'],
['Technical information','Requests are rate limited by IP address; the address is not added to your profile. A random per-browser device identifier is sent with requests, and only its hash is kept so moderators can block a banned device. Clearing site data resets it. A session cookie keeps you signed in; Parley does not use advertising or tracking cookies.'],
['Optional diagnostics','Crash reports are off unless you enable them in Privacy and safety. When on, the browser sends the error text, script name and page address, never message content. Reports are deleted after 30 days.'],
['Third-party services','Features you use can contact other services: GIF search providers, link previews for addresses you post, sign-in providers you connect (GitHub, Google, Discord), and AI services used for optional assistants and content screening. Only what the feature needs is sent. Each service applies its own policy.'],
['Backups','The operator keeps automatic daily backups of the database for 7 days. Backups include account records and messages, and are accessible only to the site owner.'],
['Retention and deletion','Server owners can delete messages automatically after 30 days, 90 days or one year; pinned messages are kept. You can export your data or delete your account in Settings. Deleting your account removes your profile and sessions; messages in shared spaces may remain without your name. Deleted data can persist in backups until they expire.'],
['Security','Passwords are hashed, messages are signed, requests are rate limited and sessions can be reviewed and ended in Settings. No online service is perfectly secure; report vulnerabilities to the operator.'],
['Operator and contact','Parley is run by the person who deployed this site. They can access stored data and are responsible for it. Contact them for access, correction or deletion requests that Settings does not cover.']
]
const TERMS=[
['Acceptable use','Do not harass, threaten or impersonate others, send spam, distribute malware, scrape private data, or try to disrupt or bypass the service. Moderators and server owners may remove content, time out members and suspend accounts.'],
['Illegal and harmful content','Do not post content that is illegal under applicable law. Child sexual abuse material is removed immediately, the account is suspended, devices can be banned, and the matter is referred to the proper authorities.'],
['Your content','You keep ownership of what you post. You give Parley permission to store, process and display it to the people and spaces you choose, and to run safety checks on it. You are responsible for your content and for having the right to share it.'],
['Accounts','Keep your password secure and do not share or sell your account. Do not create accounts to evade a suspension or ban. You can appeal a suspension from the sign-in screen.'],
['Pars and cosmetics','Pars are a free reward for taking part. They have no cash value, cannot be bought, sold or transferred outside Parley, and may be removed if earned through abuse. Cosmetics and boosts apply only within Parley.'],
['Bots, plugins and webhooks','You are responsible for what your bots, plugins and webhooks do. Automation that spams, scrapes private data, evades limits or violates these terms can be disabled.'],
['Service availability','Parley is provided as is, without warranties. It may change, be limited by hosting quotas or become unavailable, and features can be removed. The operator is not liable for loss resulting from use of the service, to the extent the law allows.']
]
const doc=(title,list)=>dialog(title,h('div',{class:'bd legal'},h('p',{class:'hint',style:{marginTop:0}},'Last updated '+UPDATED),list.map(([t,x],i)=>h('section',null,h('h4',null,(i+1)+'. '+t),h('p',null,x)))),{footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Close')]})
export const privacyDialog=()=>doc('Privacy policy',PRIVACY)
export const termsDialog=()=>doc('Terms of service',TERMS)

const SHORT=[
['Your content stays yours','You own what you post. Parley stores it and shows it to the people and spaces you choose.'],
['Respect others','No harassment, threats, spam, malware or illegal content. Moderators can remove content and suspend accounts, and you can appeal.'],
['Child safety','Child sexual abuse material is removed at once, the account is suspended and the matter is referred to authorities.'],
['What we store','Your account, messages, files and settings. Direct messages are not end-to-end encrypted, so the site operator can access them. Daily backups are kept for 7 days.'],
['Your choices','Crash reports are off unless you turn them on. You can export your data or delete your account at any time in Settings.'],
['No guarantees','Parley is free and provided as is. It can change or go down, and Pars have no cash value.']
]
const LONG=[
['Terms of service',null],
...TERMS,
['Privacy policy',null],
...PRIVACY,
['Changes to these documents','When these documents change in a meaningful way, you will be asked to read and accept them again before continuing. The date above shows the latest revision.']
]
let n
const sections=list=>{n=0;return[h('p',{class:'hint',style:{marginTop:0}},'Last updated '+UPDATED),...list.map(([t,x])=>{if(x===null){n=0;return h('h3',{class:'legal-h'},t)}n++;return h('section',{class:'legal-s'},h('h4',null,(list===SHORT?'':n+'. ')+t),h('p',null,x))})]}
export const shortTerms=()=>doc('Terms and privacy, short version',SHORT)
export function tosGate(preview){
return new Promise(res=>{
let mode='short',ready=false,t0=Date.now()
const body=h('div',{class:'tos-body',tabindex:'0'})
const chk=h('input',{type:'checkbox',id:'tos-ok','aria-label':'I have read and agree'})
const ok=h('button',{class:'btn pri',disabled:true,on:{click:async()=>{
ok.disabled=true
try{if(!preview){await POST('/api/me/tos',{version:S.me.tos_version,read:mode});S.me.tos_ok=true}d.close();res()}catch(e){fail(e);ok.disabled=false}
}}},'Agree and continue')
const hint=h('div',{class:'hint',style:{margin:0}})
const upd=()=>{
const need=mode==='short'?3000:9000
const left=Math.max(0,Math.ceil((need-(Date.now()-t0))/1000))
const end=body.scrollTop+body.clientHeight>=body.scrollHeight-8
ready=left===0&&end
hint.textContent=ready?'Tick the box to continue.':!end?'Scroll to the bottom to continue.':'Take a moment to read it ('+left+'s).'
chk.disabled=!ready
if(!ready)chk.checked=false
ok.disabled=!(ready&&chk.checked)
}
const draw=()=>{
t0=Date.now()
mount(body,mode==='short'?sections(SHORT):sections(LONG))
body.scrollTop=0
tabs.forEach(([k,b])=>{b.classList.toggle('on',k===mode);b.setAttribute('aria-pressed',String(k===mode))})
upd()
}
const tabs=[['short',h('button',{type:'button',class:'tos-tab',on:{click:()=>{mode='short';draw()}}},'Short version')],['long',h('button',{type:'button',class:'tos-tab',on:{click:()=>{mode='long';draw()}}},'Full version')]]
body.addEventListener('scroll',upd)
chk.addEventListener('change',upd)
const iv=setInterval(upd,500)
const d=dialog('Before you continue',h('div',{class:'bd tos'},h('p',{style:{margin:'0 0 10px'}},'Read the terms of service and privacy policy, short or full, then agree to keep using Parley.'),h('div',{class:'tos-tabs'},tabs.map(x=>x[1])),body,h('label',{class:'tos-agree'},chk,'I have read and agree to the terms of service and privacy policy')),{sticky:!preview,cls:'tos-dlg',bare:false,onclose:()=>clearInterval(iv),footer:close=>[h('button',{class:'btn',on:{click:async()=>{if(preview){d.close();res();return}try{await POST('/api/auth/logout',{})}catch{}location.reload()}}},preview?'Close preview':'Decline and sign out'),hint,ok]})
if(!preview)d.el.querySelector('header button')?.remove()
draw()
})
}
