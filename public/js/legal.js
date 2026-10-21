import{h,dialog}from'./util.js'
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
