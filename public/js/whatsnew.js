import{h,POST,dialog}from'./util.js'
import{S}from'./state.js'
import{parIcon}from'./pars.js'

export const VERSION='2026.10.23'
const SECTIONS=[
['New',[
'Bot builder: Save and Test are at the top, with autosave, right-click menus, block descriptions, templates, import and export, and a checker that flags problems on the blocks.',
'New blocks: On/off switch, Choose a path, Subflows, Notes and Webhook triggers.',
'Work on a bot together: invite people as viewers, editors or maintainers, see their cursors live, restore earlier versions, and use branches with merging and conflict choices.',
'Bot hub: rate bots, sort by rating or forks, and fork a bot with its license and credit kept.',
'Settings > Appearance: theme presets, plus an interface font and a message font.',
'Screen sharing: choose resolution, frame rate and bitrate, and share sound. Optional live captions in calls.',
'Server settings > Webhooks: signed event webhooks for new messages and joins.',
'Admins get a Health panel on the overview page.'
]],
['Changed',[
'Calls retry the connection on their own if it drops for a few seconds.'
]]
]
export function whatsNew(){
if(!S.me||S.me.seen_version===VERSION)return
const close=()=>{S.me.seen_version=VERSION;POST('/api/me/seen-version',{version:VERSION}).catch(()=>{})}
dialog('What is new in Parley',h('div',{class:'bd wn'},h('div',{class:'row',style:{gap:'10px',alignItems:'center'}},parIcon(30),h('div',null,h('b',null,''),h('div',{class:'hint',style:{margin:0}},'Look in the sidebar under Friends.'))),SECTIONS.map(([t,l])=>h('section',null,h('h4',null,t),h('ul',null,l.map(x=>h('li',null,x)))))),{onclose:close,footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Got it')]})
}
