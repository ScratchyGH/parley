import{h,POST,dialog}from'./util.js'
import{S}from'./state.js'
import{parIcon}from'./pars.js'

export const VERSION='2026.10.21'
const SECTIONS=[
['New',[
'Pars: a free reward currency. You earn 5 Pars for every hour you actively use Parley. Spend them in Settings > Pars on vanity links, nameplates, avatar frames and upload boosts, or gift them to friends. Pars can never be bought with money.',
'Upload boosts: raise the upload limit for a server you are in, for your own account, or as a gift.',
'Experimental Servers Program: some servers will be invited to try features early. Owners decide, and nothing is enrolled automatically.',
'Bot quality screening: listed bots are checked for spam and quality. Unsure cases go to a human reviewer, and you can appeal decisions.',
'AI Provider Chooser: every AI feature now lets you pick Pollinations, Ch.at, OpenRouter or your own endpoint.',
'More syntax highlighting languages in code blocks.',
'Moderation: temporary suspensions, best-effort device bans, appeals with evidence links, and a stronger filter against disguised slurs.',
'Server options: block emoji and stickers from other servers, and automatically delete old messages after 30 days, 90 days or a year.',
'Settings > Apps lists the .exe and .apk downloads once a build has been published.'
]],
['Changed',[
'Vanity server links now cost 25 Pars per server. Existing links keep working.',
'The message box and the Quick switcher are tighter, with less empty space.'
]],
['Fixed',[
'Wide gap between the message text and its buttons.',
'Quick switcher results spread too far apart.'
]],
['Removed',[
'Free vanity link claims for new servers.'
]]
]
export function whatsNew(){
if(!S.me||S.me.seen_version===VERSION)return
const close=()=>{S.me.seen_version=VERSION;POST('/api/me/seen-version',{version:VERSION}).catch(()=>{})}
dialog('What is new in Parley',h('div',{class:'bd wn'},h('div',{class:'row',style:{gap:'10px',alignItems:'center'}},parIcon(30),h('div',null,h('b',null,'Meet Pars'),h('div',{class:'hint',style:{margin:0}},'Earn them just by using Parley.'))),SECTIONS.map(([t,l])=>h('section',null,h('h4',null,t),h('ul',null,l.map(x=>h('li',null,x)))))),{onclose:close,footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Got it')]})
}
