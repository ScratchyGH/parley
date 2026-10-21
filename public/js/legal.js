import{h,dialog,mount,POST,fail}from'./util.js'
import{S}from'./state.js'
const PRIVACY=[
['What Parley stores','Your account (username, display name, password hash, profile), the messages, files and reactions you post, your servers and friends, your settings, and your active sessions. Direct messages are stored on the server so they can be delivered and searched; they are not end-to-end encrypted.'],
['Technical data','Requests are rate limited by IP address, which is not kept in your profile. A random per-browser device id is stored in your browser and sent with requests; its hash is kept so moderators can block a banned device. It is not your hardware id and clearing site data resets it.'],
['Crash reports','Only if you turn on "Send crash reports" in Privacy and safety. When on, the browser sends the error message, the script name and the page address when something breaks. Reports are deleted after 30 days. Message text is never included.'],
['Retention','Server owners can set messages to delete automatically after 30 days, 90 days or a year (pinned messages are kept). You can export your data or delete your account in Settings > Data and deletion.'],
['Who runs this','Parley is run by whoever deployed this site. They can see stored data. Contact them for anything not covered here.']
]
const TERMS=[
['Be decent','No harassment, threats, spam, or attempts to break the service. Moderators can remove content and suspend accounts.'],
['Illegal content','Do not post illegal content. Child sexual abuse material is removed immediately, the account is suspended and devices can be banned. Reports are handled by moderators, who are responsible for reporting to the proper authorities.'],
['Your content','You keep your content and allow Parley to store and show it to the people you send it to. You are responsible for what you post.'],
['Pars','Pars are a free reward for using Parley. They have no cash value, cannot be bought, and can be removed if they were earned by abuse.'],
['Service','Parley is provided as is, may change or go down, and may be limited by free hosting quotas.']
]
const doc=(title,list)=>dialog(title,h('div',{class:'bd'},list.map(([t,x])=>h('section',{style:{marginBottom:'12px'}},h('h4',{style:{margin:'0 0 4px'}},t),h('p',{style:{margin:0}},x)))),{footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Close')]})
export const privacyDialog=()=>doc('Privacy policy',PRIVACY)
export const termsDialog=()=>doc('Terms of service',TERMS)

const SHORT=[
['You own what you post','You keep your content. Parley stores it and shows it to the people you send it to.'],
['Be decent','No harassment, threats, spam or illegal content. Moderators can remove content and suspend accounts.'],
['Child safety','Child sexual abuse material is removed at once, the account is suspended and devices can be banned.'],
['Your data','Parley stores your account, messages, files and settings. Direct messages are readable by the server operator. Crash reports are off unless you turn them on.'],
['No guarantees','Parley is free, may change or go down, and is limited by free hosting. Pars have no cash value.']
]
const LONG=[
['Terms of service',null],
...TERMS,
['Account','You are responsible for your account and password. Do not share it, sell it, or create accounts to evade a suspension or ban. Accounts used to evade moderation can be removed.'],
['Moderation','Moderators and server owners can delete content, time out members and suspend accounts. You can appeal a suspension from the sign-in screen. Decisions can be reversed or upheld.'],
['Bots and the developer API','Bots, webhooks and plugins you run must follow these terms. You are responsible for what your bot does. Bots that spam, scrape private data or evade limits can be removed.'],
['Privacy policy',null],
...PRIVACY,
['Your choices','You can change your settings, export your data and delete your account in Settings. Deleting your account removes your profile and sessions; messages you sent in shared spaces may remain without your name.'],
['Changes','When these terms change in a meaningful way you will be asked to read and accept them again.']
]
const sections=list=>list.map(([t,x])=>x===null?h('h3',{style:{margin:'18px 0 6px',color:'var(--strong)'}},t):h('section',{style:{marginBottom:'12px'}},h('h4',{style:{margin:'0 0 4px'}},t),h('p',{style:{margin:0}},x)))
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
