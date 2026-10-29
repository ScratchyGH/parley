import{h,toast,POST,avatar}from'./util.js'
import{S,loadFriends}from'./state.js'
import{gameBar}from'./gamebar.js'
const MODES=[['Solos',1],['Duos',2],['Trios',3]]
const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const mkCode=()=>Array.from({length:6},()=>A[Math.floor(Math.random()*A.length)]).join('')
let active=null
const css=()=>{if(!document.getElementById('hwcss2'))document.head.append(h('link',{id:'hwcss2',rel:'stylesheet',href:'/hollow.css'}))}
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
let isHost=!join,hostUid=isHost?S.me.id:null,mode=0,roster=[{u:S.me.id,n:S.me.display_name||S.me.username}],phase='lobby',game=null,ws=null,joinTimer=null,closed=false
const box=h('div',{class:'hw-gamebox tu-box'})
const root=h('div',{class:'hw-game tu',role:'dialog','aria-modal':'true','aria-label':'Gourd Rush: Teamup'},box)
document.body.append(root)
active=root
const send=(d,to)=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify({t:'tu',d,to}))}
const close=()=>{
if(closed)return
closed=true
clearTimeout(joinTimer)
try{game&&game.stop()}catch{}
try{ws&&ws.close()}catch{}
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
const slots=[...roster.map(m=>h('div',{class:'tu-slot on'},h('b',null,m.n),h('span',null,m.u===hostUid?'Host':'Ready'))),...Array.from({length:Math.max(0,cap-roster.length)},()=>h('div',{class:'tu-slot'},h('span',null,'Open slot')))]
const modes=h('div',{class:'tu-modes',role:'group','aria-label':'Squad size'},MODES.map((m,i)=>h('button',{type:'button',class:'btn'+(i===mode?' pri':''),disabled:!isHost||m[1]<roster.length,on:{click:()=>{mode=i;bcast();lobby()}}},m[0])))
const fr=(S.fr?.friends||[]).slice().sort((a,b)=>(S.pres[b.id]&&S.pres[b.id]!=='offline')-(S.pres[a.id]&&S.pres[a.id]!=='offline'))
const frl=h('div',{class:'tu-fr'},fr.length?fr.slice(0,30).map(u=>h('button',{type:'button',class:'tu-f',title:'Invite '+u.display_name,on:{click:async e=>{e.currentTarget.disabled=true;try{await POST('/api/teamup/invite',{code,username:u.username});toast('Invite sent to '+u.display_name,'ok')}catch(x){toast(x.message||'Could not invite','err')}}}},avatar(u,'sm',S.pres[u.id]),h('span',null,u.display_name))):h('p',{class:'hint'},'Add friends to invite them here.'))
const start=h('button',{class:'btn pri',type:'button',disabled:!isHost,on:{click:()=>{
phase='game'
send({k:'go',list:roster,mode})
launch(roster)
}}},isHost?'Start match':'Waiting for the host')
box.replaceChildren(h('div',{class:'tu-lobby'},
h('h2',null,'Gourd Rush: Teamup'),
h('p',{class:'tu-sub'},'Squad up and hold the hollow together. Board up doors, throw candy bombs and revive your friends.'),
modes,
h('div',{class:'tu-slots'},slots),
h('div',{class:'tu-code'},h('span',null,'Party code'),h('b',null,code),h('button',{class:'btn sm',type:'button',on:{click:()=>navigator.clipboard?.writeText(link).then(()=>toast('Invite link copied','ok'),()=>toast(link))}},'Copy invite link')),
h('h4',null,'Invite a friend'),frl,
h('div',{class:'row'},start,h('button',{class:'btn',type:'button',on:{click:close}},'Leave party'))))
}
const launch=list=>{
phase='game'
box.replaceChildren()
import('/js/tugame.js').then(({playTeamup})=>{
if(closed)return
game=playTeamup({box,me:S.me.id,list:list.map(m=>({u:m.u,n:m.n})),host:isHost,hostUid,send:d=>send(d),onEnd:()=>{
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
const proto=location.protocol==='https:'?'wss':'ws'
try{ws=new WebSocket(`${proto}://${location.host}/ws?room=tu_${code}`)}catch{close();toast('Could not connect','err');return}
ws.addEventListener('open',()=>{
if(isHost){lobby();return}
send({k:'hi',n:S.me.display_name||S.me.username})
box.replaceChildren(h('p',{class:'tu-wait'},'Joining the party'))
joinTimer=setTimeout(()=>{toast('That party is not open','err');close()},4000)
})
ws.addEventListener('close',()=>{if(!closed){toast('Lost connection to the party','err');close()}})
ws.addEventListener('message',e=>{
let m
try{m=JSON.parse(e.data)}catch{return}
if(m.t==='presence'&&m.s==='offline'){
if(isHost){const n=roster.length;roster=roster.filter(x=>x.u!==m.uid);if(roster.length!==n){game&&game.left(m.uid);bcast();lobby()}}
else if(m.uid===hostUid){game?game.left(m.uid):(toast('The host closed the party','err'),close())}
return
}
if(m.t!=='tu'||!m.d)return
const d=m.d,f=m.f
if(isHost){
if(d.k==='hi'){if(addUser(f,d.n)){bcast();lobby()}}
else if(game)game.msg(f,d)
return
}
if(d.k==='ros'&&f){
clearTimeout(joinTimer)
hostUid=f;roster=d.list;mode=d.mode
if(!roster.some(x=>x.u===S.me.id)){toast('You were removed from the party','err');close();return}
lobby()
}else if(d.k==='full'){toast('That party is full','err');close()}
else if(d.k==='busy'){toast('That match already started','err');close()}
else if(d.k==='go'&&f===hostUid){roster=d.list;launch(roster)}
else if(game)game.msg(f,d)
})
loadFriends().then(()=>{if(phase==='lobby'&&!closed&&box.querySelector('.tu-lobby'))lobby()}).catch(()=>{})
}
