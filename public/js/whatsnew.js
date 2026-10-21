import{h,POST,dialog}from'./util.js'
import{S}from'./state.js'
import{parIcon}from'./pars.js'

export const VERSION='2026.10.22'
const SECTIONS=[
['New',[
'The Pars shop now lives on the main page, under Friends.',
'Avatar effects: Angel halo, Crown, Aurora ring, Sparkle, Ember glow, Neon pulse, Frost and Void.',
'Eight new animated nameplates: Sakura, Nebula, Circuit, Gilded, Glacier, Sunset, Neon and Holo.',
'Scheduled messages: use the clock button in the message box. Delivery runs once a minute.',
'Right-click a category to rename it or set a role\'s permissions on every channel in it.',
'YouTube links show a thumbnail.',
'Performance mode (Settings > Appearance) turns off animations and effects.',
'Privacy policy and Terms in Settings > Privacy and safety, plus an opt-in switch for crash reports.',
'Reports can now be marked as illegal content, which goes to the top of the moderator queue.'
]],
['Changed',[
'Pars moved out of Settings. The old Settings link now opens the shop.',
'Photo and file uploads retry on their own after a network error.'
]]
]
export function whatsNew(){
if(!S.me||S.me.seen_version===VERSION)return
const close=()=>{S.me.seen_version=VERSION;POST('/api/me/seen-version',{version:VERSION}).catch(()=>{})}
dialog('What is new in Parley',h('div',{class:'bd wn'},h('div',{class:'row',style:{gap:'10px',alignItems:'center'}},parIcon(30),h('div',null,h('b',null,'Pars shop, effects and more'),h('div',{class:'hint',style:{margin:0}},'Look in the sidebar under Friends.'))),SECTIONS.map(([t,l])=>h('section',null,h('h4',null,t),h('ul',null,l.map(x=>h('li',null,x)))))),{onclose:close,footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Got it')]})
}
