import{h,mount,toast,toggle,saveBlob}from'./util.js'
import{pref,setPref}from'./prefs.js'
export const tw=k=>!!pref('tw_'+k)
const TRACK=/^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|igshid|igsh|mc_eid|mc_cid|yclid|_hsenc|_hsmi|ref_src|ref_url|si|spm|vero_id|oly_enc_id|oly_anon_id|twclid|ttclid|wbraid|gbraid)$/i
export function clearUrl(href){
if(!tw('clear_urls'))return href
try{
const u=new URL(href)
let n=0
for(const k of[...u.searchParams.keys()])if(TRACK.test(k)){u.searchParams.delete(k);n++}
return n?u.href:href
}catch{return href}
}
export function anonName(n){
const m=String(n||'').match(/\.[A-Za-z0-9]{1,8}$/)
return Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>(x%36).toString(36)).join('')+(m?m[0]:'')
}
const SHEET=typeof CSSStyleSheet!=='undefined'?new CSSStyleSheet():null
let attached=false
export function applyTweaks(){
if(typeof document==='undefined'||!document.documentElement||!document.documentElement.classList)return
const r=document.documentElement.classList
r.toggle('tw-hidefx',tw('hide_fx'))
r.toggle('tw-nobadge',tw('hide_badges'))
r.toggle('tw-flat',tw('flat_msgs'))
r.toggle('tw-wide',tw('wide_chat'))
if(!SHEET)return
try{SHEET.replaceSync(String(pref('tw_css')||'').slice(0,20000))}catch{}
if(!attached){
try{document.adoptedStyleSheets=[...document.adoptedStyleSheets,SHEET];attached=true}catch{}
}
}
applyTweaks()
const LIST=[
['Chat',[
['show_username','Show usernames','Show @username next to each display name, so people with the same display name are easy to tell apart.'],
['precise_time','Precise timestamps','Show 24-hour times with seconds on messages.'],
['silent_typing','Silent typing','Do not tell others when you are typing.'],
['flat_msgs','Flat messages','Remove bubble backgrounds and extra padding from messages.'],
['wide_chat','Wide chat','Let messages use the full width of the window.']
]],
['Cosmetics',[
['hide_fx','Hide name and avatar effects','Turn off animated name colours, nameplates and avatar effects from other people.'],
['hide_badges','Hide badges and titles','Hide badges and titles next to names.']
]],
['Links and files',[
['clear_urls','Clear tracking from links','Strip utm_, fbclid, gclid and similar tracking parameters from links in messages.'],
['anon_files','Anonymise file names','Upload attachments with a random file name and keep only the extension.']
]],
['Developer',[
['dev_ids','Developer mode','Add Copy message ID, Copy user ID and Copy channel ID to the message menu.']
]]
]
export function tweaksPage(pg){
const row=(label,sub,control)=>h('div',{class:'row sp',style:{padding:'8px 0',borderBottom:'1px solid var(--border)'}},h('div',null,h('div',{style:{color:'var(--strong)'}},label),sub?h('div',{class:'hint',style:{margin:0}},sub):null),control)
const css=h('textarea',{class:'inp',rows:12,spellcheck:false,maxLength:20000,placeholder:'/* Your CSS, applied on this device only */\n.m{border-radius:12px}','aria-label':'Quick CSS',style:{fontFamily:'ui-monospace,Menlo,Consolas,monospace',fontSize:'13px',whiteSpace:'pre',tabSize:2}},pref('tw_css')||'')
let t=0
css.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{setPref('tw_css',css.value);applyTweaks()},300)})
css.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const a=css.selectionStart;css.setRangeText('  ',a,css.selectionEnd,'end');css.dispatchEvent(new Event('input'))}})
const file=h('input',{type:'file',accept:'application/json,.json',hidden:true,on:{change:async e=>{
const f=e.target.files[0]
if(!f)return
try{
const o=JSON.parse(await f.text())
if(!o||typeof o!=='object'||Array.isArray(o))throw new Error('bad')
for(const k of Object.keys(o))if(k.startsWith('tw_')&&k.length<40&&(typeof o[k]==='boolean'||(k==='tw_css'&&typeof o[k]==='string'&&o[k].length<=20000)))setPref(k,o[k])
applyTweaks()
toast('Tweaks imported','ok')
tweaksPage(pg)
}catch{toast('That file is not a Parley tweaks backup','err')}
e.target.value=''
}}})
const all=()=>{const o={};for(const[,items]of LIST)for(const[k]of items)o['tw_'+k]=tw(k);o.tw_css=pref('tw_css')||'';return o}
mount(pg,h('h3',null,'Tweaks'),h('p',{class:'hint'},'Small client-side options in the spirit of Vencord. They apply on this device only and never change what other people see.'),
...LIST.map(([title,items])=>h('div',null,h('h4',{style:{margin:'18px 0 4px'}},title),...items.map(([k,l,sub])=>row(l,sub,toggle(tw(k),v=>{setPref('tw_'+k,v);applyTweaks()},l))))),
h('h4',{style:{margin:'18px 0 4px'}},'Quick CSS'),
h('p',{class:'hint'},'Runs after the built-in styles. Clear the box if something looks broken.'),
h('div',{style:{marginTop:'8px'}},css),
h('h4',{style:{margin:'18px 0 4px'}},'Backup'),
h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},
h('button',{class:'btn sm',on:{click:()=>saveBlob(new Blob([JSON.stringify(all(),null,1)],{type:'application/json'}),'parley-tweaks.json')}},'Export tweaks'),
h('button',{class:'btn sm',on:{click:()=>file.click()}},'Import tweaks'),
h('button',{class:'btn sm',on:{click:()=>{for(const k of Object.keys(all()))setPref(k,k==='tw_css'?'':false);applyTweaks();toast('Tweaks reset','ok');tweaksPage(pg)}}},'Reset all')),file)
}
