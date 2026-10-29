import{h,toast,POST,avatar}from'./util.js'
import{S,loadFriends}from'./state.js'
import{gameBar}from'./gamebar.js'
import{connectParty}from'./tunet.js'
import{buildArt}from'./rushart.js'
const MODES=[['Solos',1,'Go in alone'],['Duos',2,'You and one friend'],['Trios',3,'Full squad of three']]
const COL=['#ff9d2e','#6ec1ff','#9be564']
const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const mkCode=()=>Array.from({length:6},()=>AL[Math.floor(Math.random()*AL.length)]).join('')
let active=null,art=null
const css=()=>{
if(!document.getElementById('hwcss2'))document.head.append(h('link',{id:'hwcss2',rel:'stylesheet',href:'/hollow.css'}))
if(!document.getElementById('tucss'))document.head.append(h('link',{id:'tucss',rel:'stylesheet',href:'/teamup.css'}))
if(!document.getElementById('rscss'))document.head.append(h('link',{id:'rscss',rel:'stylesheet',href:'/rush.css'}))
}
const sprite=(i)=>{
if(!art)art=buildArt(4)
const s=art.player[0],c=document.createElement('canvas')
c.width=s.w;c.height=s.h
c.getContext('2d').drawImage(s.c,0,0)
c.className='tu-spr'
c.style.filter=i===0?'none':i===1?'hue-rotate(160deg)':'hue-rotate(70deg)'
return c
}
export function showInvite(m){
const code=String(m.code||'')
if(!/^[A-Z0-9]{6}$/.test(code))return
document.querySelector('.tu-inv')?.remove()
const el=h('div',{class:'tu-inv',role:'alert'},h('b',null,String(m.from||'A friend')),' invited you to Gourd Rush: Teamup',h('div',{class:'row'},h('button',{class:'btn pri sm',type:'button',on:{click:()=>{el.remove();openTeamup(code)}}},'Join'),h('button',{class:'btn sm',type:'button',on:{click:()=>el.remove()}},'Not now')))
document.body.append(el)
setTimeout(()=>el.remove(),30000)
}
export async function openTeamup(join){
if(active){toast('You are already in a party');return}
css()
const code=join||mkCode()
const myName=S.me.display_name||S.me.username
let isHost=!join,hostUid=isHost?S.me.id:null,mode=0,roster=[{u:S.me.id,n:myName}],phase='lobby',game=null,net=null,joinTimer=null,closed=false,online=false,status=join?'Joining':'Connecting'
const box=h('div',{class:'hw-gamebox tu-box'})
const root=h('div',{class:'hw-game tu',role:'dialog','aria-modal':'true','aria-label':'Gourd Rush: Teamup'},box)
document.body.append(root)
active=root
const send=(d,to)=>{if(net)net.send(d,to)}
const close=()=>{
if(closed)return
closed=true
clearTimeout(joinTimer)
try{game&&game.stop()}catch{}
try{net&&net.close()}catch{}
root.remove()
active=null
}
const bcast=()=>send({k:'ros',list:roster,mode})
const addUser=(f,n)=>{
if(roster.some(x=>x.u===f))return true
if(phase!=='lobby'){send({k:'busy'},f);return false}
if(roster.length>=MODES[mode][1]){send({k:'full'},f);return false}
roster.push({u:f,n:String(n||'Player').slice(0,24)})
return true
}
const lobby=()=>{
if(phase!=='lobby')return
const cap=MODES[mode][1]
const link=location.origin+'/?tu='+code
const slots=Array.from({length:3},(_,i)=>{
const m=roster[i]
if(m)return h('div',{class:'tu-slot on',style:{'--c':COL[i]}},sprite(i),h('b',null,m.n),h('span',null,m.u===hostUid?'Host':'Ready'))
if(i<cap)return h('div',{class:'tu-slot open',style:{'--c':COL[i]}},h('i',{class:'tu-plus'},'+'),h('span',null,'Waiting for a friend'))
return h('div',{class:'tu-slot locked'},h('span',null,'Locked'))
})
const modes=h('div',{class:'tu-modes',role:'group','aria-label':'Squad size'},MODES.map((m,i)=>h('button',{type:'button',class:'tu-mode'+(i===mode?' on':''),disabled:!isHost||m[1]<roster.length,on:{click:()=>{mode=i;bcast();lobby()}}},h('b',null,m[0]),h('span',null,m[2]))))
const fr=(S.fr?.friends||[]).slice().sort((a,b)=>(S.pres[b.id]&&S.pres[b.id]!=='offline')-(S.pres[a.id]&&S.pres[a.id]!=='offline'))
const frl=h('div',{class:'tu-fr'},fr.length?fr.slice(0,40).map(u=>h('button',{type:'button',class:'tu-f',disabled:!online||!isHost,title:'Invite '+u.display_name,on:{click:async e=>{const b=e.currentTarget;b.disabled=true;try{await POST('/api/teamup/invite',{code,username:u.username});toast('Invite sent to '+u.display_name,'ok')}catch(x){toast(x.message||'Could not invite','err');b.disabled=false}}}},avatar(u,'sm',S.pres[u.id]),h('span',null,u.display_name),h('em',null,S.pres[u.id]&&S.pres[u.id]!=='offline'?'Online':'Offline'))):h('p',{class:'hint'},'Add friends to invite them here.'))
const start=h('button',{class:'tu-go',type:'button',disabled:!isHost,on:{click:()=>{
phase='game'
send({k:'go',list:roster,mode})
launch(roster)
}}},isHost?(roster.length>1?'Start match':'Start solo'):'Waiting for the host')
box.replaceChildren(h('div',{class:'tu-lobby'},
h('div',{class:'tu-head'},h('h2',null,'Gourd Rush'),h('b',null,'Teamup'),h('p',null,'Hold the hollow until dawn. Board up doors, throw candy bombs, revive your squad.')),
h('div',{class:'tu-main'},
h('div',{class:'tu-left'},modes,h('div',{class:'tu-slots'},slots),h('div',{class:'tu-act'},start,h('button',{class:'btn',type:'button',on:{click:close}},'Leave'))),
h('div',{class:'tu-right'},
h('div',{class:'tu-code'},h('span',null,online?'Party code':status),h('b',null,code),h('button',{class:'btn sm',type:'button',on:{click:()=>navigator.clipboard?.writeText(link).then(()=>toast('Invite link copied','ok'),()=>toast(link))}},'Copy invite link')),
h('h4',null,'Friends'),frl))))
}
const launch=list=>{
phase='game'
box.replaceChildren()
import('/js/tugame.js').then(({playTeamup})=>{
if(closed)return
game=playTeamup({box,me:S.me.id,list:list.map(m=>({u:m.u,n:m.n})),host:isHost,hostUid,send,onEnd:()=>{
try{game.stop()}catch{}
game=null
phase='lobby'
if(isHost)bcast()
lobby()
}})
box.append(h('button',{class:'btn sm hw-gx',type:'button',on:{click:close}},'Leave match'))
gameBar(root,'gourd-rush-teamup')
})
}
const onMsg=(f,d)=>{
if(isHost){
if(d.k==='hi'){if(addUser(f,d.n)){bcast();lobby()}}
else if(game)game.msg(f,d)
return
}
if(d.k==='ros'){
clearTimeout(joinTimer)
hostUid=f;roster=d.list;mode=d.mode
if(!roster.some(x=>x.u===S.me.id)){toast('You were removed from the party','err');close();return}
if(phase==='lobby')lobby()
}else if(d.k==='full'){toast('That party is full','err');close()}
else if(d.k==='busy'){toast('That match already started','err');close()}
else if(d.k==='go'&&f===hostUid){roster=d.list;launch(roster)}
else if(game)game.msg(f,d)
}
net=connectParty({code,create:isHost,me:S.me.id,on:{
open(){
online=true;status='Party code'
if(isHost){lobby();return}
send({k:'hi',n:myName})
joinTimer=setTimeout(()=>{toast('That party is not open','err');close()},6000)
},
fail(t){
if(isHost){online=false;status='Offline, solo only';net=null;toast(t,'err');lobby();return}
toast(t,'err');close()
},
close(){
if(closed)return
if(isHost){online=false;status='Offline';net=null;if(phase==='lobby')lobby();return}
toast('Lost connection to the party','err');close()
},
left(u){
if(isHost){const n=roster.length;roster=roster.filter(x=>x.u!==u);if(roster.length!==n){game&&game.left(u);bcast();if(phase==='lobby')lobby()}}
else if(u===hostUid){if(game)game.left(u);else{toast('The host closed the party','err');close()}}
},
msg:onMsg
}})
if(isHost)lobby();else box.replaceChildren(h('p',{class:'tu-wait'},'Joining the party'))
loadFriends().then(()=>{if(phase==='lobby'&&!closed&&box.querySelector('.tu-lobby'))lobby()}).catch(()=>{})
}
