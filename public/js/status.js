import{h,icon,PATCH,fail,popup,closeMenu,dialog,field}from'./util.js'
import{S}from'./state.js'
const E=['😀','😎','🥳','😴','🤔','😭','🔥','💻','🎮','🎧','📚','🍕','☕','🏠','🚗','✈️','🎬','🏋️','🎂','💤','🛠️','🎨','🌙','☀️','❤️','👀','🤒','🔇','📵','🎯']
const PR=[['online','Online',''],['idle','Idle',''],['busy','Do Not Disturb','No desktop notifications'],['invisible','Invisible','You appear offline']]
const DUR=[['','Don\'t clear'],['1800000','30 minutes'],['3600000','1 hour'],['14400000','4 hours'],['today','Today'],['604800000','7 days']]
const until=v=>{if(!v)return null;if(v==='today'){const d=new Date();d.setHours(23,59,59,0);return d.getTime()}return Date.now()+Number(v)}
function custom(after){
let em=S.me.status_emoji||''
const eb=h('button',{type:'button',class:'btn','aria-label':'Choose emoji',style:{fontSize:'20px',minWidth:'46px'}},em||'😀')
const tx=h('input',{class:'inp',maxLength:100,value:S.me.status_text||'',placeholder:'What is happening?','aria-label':'Status'})
const sel=h('select',{class:'sel','aria-label':'Clear after'},DUR.map(([v,l])=>h('option',{value:v},l)))
const own=h('input',{class:'inp',maxLength:16,placeholder:'Or paste any emoji','aria-label':'Any emoji',on:{input:e=>{const v=e.target.value.trim();if(v){em=v;eb.textContent=v}}}})
const grid=h('div',{class:'emg',hidden:true},E.map(x=>h('button',{type:'button',on:{click:()=>{em=x;eb.textContent=x;grid.hidden=true}}},x)),own)
eb.onclick=()=>{grid.hidden=!grid.hidden}
const save=async(b,close)=>{try{const d=await PATCH('/api/me',b);S.me=d.user;close();after()}catch(e){fail(e)}}
dialog('Set a custom status',h('div',{class:'stdlg'},h('div',{class:'row'},eb,tx),grid,field('Clear after',sel)),{footer:close=>[
h('button',{class:'btn',type:'button',on:{click:()=>save({status_emoji:'',status_text:'',status_until:null},close)}},'Clear status'),
h('button',{class:'btn pri',type:'button',on:{click:()=>{const t=tx.value.trim();save({status_emoji:t||em?em:'',status_text:t,status_until:t||em?until(sel.value):null},close)}}},'Save')]})
}
export function statusMenu(anchor,after,extra){
const r=anchor.getBoundingClientRect()
const set=async(b,p)=>{closeMenu();try{const d=await PATCH('/api/me',b);S.me=d.user;after(p)}catch(e){fail(e)}}
const has=S.me.status_emoji||S.me.status_text
const cs=h('button',{class:'stc',role:'menuitem',on:{click:()=>{closeMenu();custom(after)}}},h('span',{class:'ste'},S.me.status_emoji||'😀'),h('span',{class:'stt'},S.me.status_text||'Set a custom status'),has?h('span',{class:'stx',role:'button',tabindex:'0','aria-label':'Clear status',title:'Clear status',on:{click:e=>{e.stopPropagation();set({status_emoji:'',status_text:'',status_until:null})}}},icon('x','s')):null)
const rows=PR.map(([p,l,d])=>h('button',{role:'menuitem',class:'stp'+(S.me.presence===p?' on':''),on:{click:()=>set({presence:p},p)}},h('i',{class:'sd '+p}),h('span',null,h('b',null,l),d?h('small',null,d):null)))
const more=(extra||[]).map(it=>it==='-'?h('hr'):it?h('button',{role:'menuitem',on:{click:()=>{closeMenu();it.fn()}}},it.icon?icon(it.icon,'s'):null,h('span',null,it.label)):null)
const m=popup([cs,h('hr'),...rows,h('hr'),...more],r.left,r.bottom+4,'stmenu')
if(r.bottom+4+m.offsetHeight>innerHeight-4)m.style.top=Math.max(4,r.top-4-m.offsetHeight)+'px'
}
