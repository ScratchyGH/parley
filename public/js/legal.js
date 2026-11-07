import{h,dialog,mount,POST,fail}from'./util.js'
import{S}from'./state.js'
const UPDATED='November 7, 2026'
const PRIVACY=[
['Information we store','Account details (username, display name, password hash, profile, connected sign-in providers), content you create (messages, files, reactions, polls, scheduled messages), your servers, friends and settings, and active sessions. Direct messages are stored on the server so they can be delivered, searched and moderated; they are not end-to-end encrypted.'],
['Technical information','Requests are rate limited by IP address; the address is not added to your profile. A random per-browser device identifier is sent with requests, and only its hash is kept so moderators can block a banned device. Clearing site data resets it. A session cookie keeps you signed in; Parley does not use advertising or tracking cookies.'],
['Optional diagnostics','Crash reports are off unless you enable them in Privacy and safety. When on, the browser sends the error text, script name and page address, never message content. Reports are deleted after 30 days.'],
['Third-party services','Features you use can contact other services: GIF search providers, link previews for addresses you post, sign-in providers you connect (GitHub, Google, Discord), and AI services used for optional assistants and content screening. Only what the feature needs is sent. Each service applies its own policy.'],
['Backups','The operator keeps automatic daily backups of the database for 7 days. Backups include account records and messages, and are accessible only to the site owner.'],
['Retention and deletion','Server owners can delete messages automatically after 30 days, 90 days or one year; pinned messages are kept. You can export your data or delete your account in Settings. Deleting your account removes your profile and sessions; messages in shared spaces may remain without your name. Deleted data can persist in backups until they expire.'],
['Security','Passwords are hashed, messages are signed, requests are rate limited and sessions can be reviewed and ended in Settings. No online service is perfectly secure; report vulnerabilities to the operator.'],
['Email', 'If you add an email address it is stored with your account and sent to our email provider only to deliver verification codes, password resets and security alerts. It is never shown to other members and you can remove it in Settings.'],
['Connected accounts','When you connect an account we store the account name and ID and show a link on your profile. Verification reads the public profile text of that account. For Steam we also read your public profile to show the game you are currently playing; this is cached briefly and not stored in your profile.'],
['Bots and your messages','Bots you add to a server can read messages in the channels they can see and may store values such as XP or counters for members. Bot owners are responsible for that data. Level cards and other bot output can show your name, picture, banner and level to members of that server.'],
['Moderation and screening','Content and public bots may be checked by automatic filters and AI review agents to find spam, slurs, scams and illegal material. Moderation logs, reports, appeals and warnings are kept so abuse can be handled and decisions reviewed.'],
['Cookies and local storage','Parley uses a session cookie to keep you signed in and local storage in your browser for settings and the device identifier. It does not use advertising or tracking cookies, and no third-party analytics.'],
['Children','Parley is for people 13 and older. If you believe a child under 13 has an account, tell the operator and it will be removed.'],
['Your rights and choices','You can see, correct and export your data in Settings, hide your activity and connections, and delete your account. For requests Settings does not cover, contact the operator. Where the law gives you more rights, they apply.'],
['Where data is processed','Parley runs on Cloudflare and uses external database services. Your data can be processed in the countries where those providers operate.'],
['Messages you delete','When you delete a message it is hidden at once and removed from the database later. Copies may stay in backups for up to 7 days, and other people may already have seen, saved or quoted it.'],
['Direct messages and group chats','Direct messages and group chats are visible to the people in them and are not end-to-end encrypted, so the operator can access them when needed for safety, legal reasons or to fix problems.'],
['Files and pictures','Files you upload are stored by Parley and are served only to people who can see the place you posted them. Pictures can contain hidden location data, so remove it before sharing if that matters to you.'],
['Profile and activity visibility','Your username, display name, avatar, banner, badges and connections can be seen by other members. Your status, current activity and game can be hidden in Settings.'],
['Game status','If you connect Steam, Parley may read your public Steam profile to show the game you are playing. The result is cached for about a minute and is not saved in your profile. Remove the connection to stop it.'],
['Voice and calls','Voice and video are sent between participants and are not recorded by Parley. A call can reveal your network address to the people in it.'],
['Notifications','Push notifications use your browser\'s push service, which receives the notification text and your device token. You can turn notifications off in Settings and in your browser.'],
['Legal requests','The operator can share information when the law requires it or to protect people from serious harm. They will limit what is shared to what is needed.'],
['Sale of data','Parley does not sell your personal data and does not use it for advertising.'],
['Changes to this policy','When this policy changes in a meaningful way you will be asked to read and accept it again.'],
['Operator and contact','Parley is run by the person who deployed this site. They can access stored data and are responsible for it. Contact them for access, correction or deletion requests that Settings does not cover.']
]
const TERMS=[
['Who can use Parley','You must be at least 13 years old, or the minimum age to use online services where you live if that is higher. If you are under the age of majority, a parent or guardian should review these terms with you. Parley is not intended for children under 13 and accounts found to belong to them can be removed.'],
['Acceptable use','Do not harass, threaten, stalk, dox or impersonate others, send spam or unsolicited bulk messages, distribute malware, scrape private data, or try to disrupt, overload or bypass the service or its limits. Moderators and server owners may remove content, time out members and suspend accounts.'],
['Hateful and harmful content','Do not post slurs, hate speech or content that attacks people for who they are, and do not encourage self-harm, violence or dangerous acts. Do not post graphic violence or sexual content outside channels and spaces where it is explicitly allowed for adults, and never involving minors.'],
['Illegal content','Do not post content that is illegal under applicable law. Child sexual abuse material is removed immediately, the account is suspended, devices can be banned, and the matter is referred to the proper authorities.'],
['Your content','You keep ownership of what you post. You give Parley a worldwide, non-exclusive, royalty-free permission to store, process, copy and display it to the people and spaces you choose, and to run safety checks on it. You are responsible for your content and for having the right to share it.'],
['Copyright','Do not post material you do not have the right to share. If you believe something infringes your copyright, report it to the operator with the location of the content and proof you own the rights. Content that is clearly infringing can be removed and repeat infringers can lose their accounts.'],
['Accounts','Keep your password secure and do not share, sell or transfer your account. Do not create accounts to evade a suspension or ban, or to get around limits. You are responsible for activity on your account. You can appeal a suspension from the sign-in screen.'],
['Email addresses','An email address is optional and is used only for account verification, password resets and security alerts. Do not add an address that is not yours. Messages are sent through a third-party email provider.'],
['Connected accounts','You can connect accounts such as GitHub, Roblox, Steam, Bluesky, YouTube and others to your profile. Verification works by placing a one-time code in a public profile field, so only connect accounts you own. A connected account is shown as a link on your profile. If you connect Steam, Parley may read what game your public Steam profile says you are playing and show it on your profile; remove the connection to stop this.'],
['Pars and cosmetics','Pars are a free reward for taking part. They have no cash value, cannot be bought, sold or transferred outside Parley, and may be removed if earned through abuse, exploits or automation. Cosmetics, frames and boosts apply only within Parley and can change or be retired. Only the owner account can grant Pars to itself.'],
['Experience points and levels','Levels, XP and leaderboards are created by bots in a server and belong to that server. Server owners can reset them, remove them or stop a member from earning XP. Do not exploit bots to gain XP, and do not expect levels to carry between servers.'],
['Bots, plugins and webhooks','You are responsible for what your bots, plugins and webhooks do. Automation that spams, scrapes private data, evades limits, sends unsolicited private messages, or violates these terms can be disabled and its owner restricted.'],
['Bot messages and private messages from bots','A bot may only send a private message when a member started it, for example by running a command, joining or mentioning the bot. Bots must not send advertising, slurs, repeated text or links to strangers. Private messages from bots are rate limited, and a bot that breaks these rules can be removed.'],
['Bot screening','Public bots are reviewed before they are listed. Review combines automatic checks with three AI review agents that must agree. Screening is not a guarantee that a bot is safe, and a bot can be rejected, unlisted or removed later if it breaks the rules. Owners can fix issues and resubmit, or appeal.'],
['Bot ownership and collaborators','A bot belongs to the account that created it. Owners can invite collaborators as viewers, editors, maintainers or co-owners. A co-owner can manage the bot but cannot delete it or transfer ownership. A merge key lets another bot link to yours; anyone who has the key can link to that bot, so keep it private and reset it if it leaks.'],
['Servers and community rules','Server owners and moderators set additional rules for their space and can enforce them. Those rules apply on top of these terms and never override them. Moderation actions such as warnings, timeouts, kicks and bans are recorded in the server moderation log.'],
['Voice, video and peer-to-peer features','Voice, video and screen share can connect you directly to other people, which can reveal your network address to the people in the call. Do not record or share other people\'s calls without their consent where the law requires it.'],
['Games and events','Games and seasonal events are provided for fun. Rewards can change, end or be removed, and scores or rewards obtained through cheating can be reversed.'],
['Safety and enforcement','Reports are reviewed by moderators and the operator. Parley can warn, restrict, suspend or ban accounts and devices that break these terms, and can remove content without notice when needed to protect people or the service.'],
['Termination','You can delete your account at any time in Settings. The operator can suspend or end access for breaking these terms, for security reasons or if the service is shut down. Sections that by their nature should survive termination will survive.'],
['Service availability','Parley is provided as is, without warranties of any kind. It may change, be limited by hosting quotas or become unavailable, and features can be removed. The operator is not liable for loss resulting from use of the service, to the extent the law allows.'],
['Limits on liability','To the extent allowed by law, the operator is not liable for indirect, incidental or consequential damages, loss of data, or the actions of other users, bots and third-party services. Nothing in these terms limits rights you have under the law that cannot be limited.'],
['Agreement and changes','By using Parley you agree to these terms and the privacy policy. When they change in a meaningful way you will be asked to read and accept them again, and you cannot keep using Parley until you do. If you do not agree, stop using the service and delete your account.'],
['Respecting other people','Treat members as you would in person. Do not pressure people into sharing personal details, do not contact someone who asked you to stop, and do not use Parley to organize harassment against a person or a server, including raids and brigading.'],
['Scams and deception','Do not run scams, fake giveaways, phishing links, fake support accounts or schemes that trick people out of accounts, Pars or money. Do not pretend to be staff, a moderator or a well known person.'],
['Sexual and adult content','Adult content is only allowed in channels marked for it, and only for members who have confirmed they are adults. Never post sexual content involving minors, and never share intimate images of anyone without their clear consent.'],
['Self-harm and crisis','If someone talks about hurting themselves, take it seriously and encourage them to contact local emergency services or a crisis line. Do not mock, encourage or pressure anyone toward self-harm.'],
['Dangerous activity and weapons','Do not share instructions meant to cause serious harm, build weapons, or commit crimes, and do not post content that praises or helps violent extremist groups.'],
['Impersonation and parody','Accounts, bots and servers must not copy another person, brand or project in a way that could mislead people. Clearly labelled parody is allowed if nobody could mistake it for the real thing.'],
['Names, pictures and banners','Usernames, display names, nicknames, avatars, banners, status text and server names follow the same rules as messages. Names that are slurs, impersonate staff or contain personal information can be changed or removed.'],
['Security research and reporting bugs','If you find a security problem, report it to the operator privately and give them reasonable time to fix it. Do not access other people\'s data, disrupt the service or share the problem publicly before it is fixed.'],
['Automated access and the API','Use the API only with tokens made for your own bots and within the rate limits. Do not scrape the service, create accounts in bulk, bypass limits, or use automation to take Pars, XP or other rewards.'],
['Bans, appeals and ban evasion','Moderators can ban members from servers and the operator can ban accounts and devices. You can appeal from the sign-in screen or the appeals form. Creating new accounts to return after a ban is evasion and can lead to a longer ban.'],
['Moderator and owner conduct','People who moderate or own a server must use their powers fairly, must not abuse them to harass members, and must keep the moderation log honest. The operator can remove a moderator or take over a server that is used to break these terms.'],
['Server ownership and transfers','A server belongs to its owner until they transfer it or delete it. The operator can restore, lock or remove a server when needed for safety. Deleting a server deletes its channels, messages and settings.'],
['Backups and recovery','The operator keeps backups for a limited time to recover from failures. Restoring a backup can bring back data that was deleted after it was taken, and nothing is promised about how fast data can be restored.'],
['Notices and support','The operator can send notices inside Parley and, if you added an email, by email for security and account matters. You can contact the operator through the support page for account, safety and legal questions.'],
['Third-party links and services','Links, embeds, games and connected services belong to other people and have their own terms. Parley is not responsible for them, and you use them at your own risk.'],
['Donations, gifts and virtual items','Pars gifts and bundles are free rewards sent between members. Gifts cannot be refunded or exchanged for money, and items received by abuse can be taken back.'],
['Governing law and disputes','These terms are governed by the laws that apply where the operator lives, unless your local law requires something else. Try to solve a dispute by contacting the operator first.'],
['If a part of these terms is invalid','If any part of these terms cannot be enforced, the rest stays in effect.']
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
['Bots and connections','Bots can level you up and may message you only after you start it. Connected accounts and your current Steam game can show on your profile, and you can remove them anytime.'],
['Be 13 or older','Parley is for people 13 and up, and your email stays private.'],
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
const need=mode==='short'?5000:15000
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
