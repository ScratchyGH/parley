import{h,toast}from'./util.js'
import{S}from'./state.js'
import{connectParty}from'./tunet.js'
import{gameBar}from'./gamebar.js'
const APP='043ce2ab-4718-42a7-aaea-a56071a539bf'
const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const mkCode=()=>Array.from({length:6},()=>AL[Math.floor(Math.random()*AL.length)]).join('')
let open=false
const css=()=>{
if(!document.getElementById('hwcss2'))document.head.append(h('link',{id:'hwcss2',rel:'stylesheet',href:'/hollow.css'}))
if(!document.getElementById('tucss'))document.head.append(h('link',{id:'tucss',rel:'stylesheet',href:'/teamup.css?v=13'}))
}
export function openSiegeMP(){
if(open)return
open=true
css()
const me=S.me.id,myName=S.me.display_name||S.me.username
const root=h('div',{class:'hs-m',role:'dialog','aria-modal':'true','aria-label':'Hollow Siege: MP Edition'})
const card=h('div',{class:'hs-c'})
root.append(card)
document.body.append(root)
let net=null,code='',host=false,night=1,roster=[],game=null,closed=false,hostUid=null
const send=(d,to)=>{if(net)net.send(d,to)}
const bcast=()=>send({k:'ros',list:roster,night})
const close=()=>{
if(closed)return
closed=true
open=false
if(game)game.stop()
if(net)net.close()
root.remove()
}
const menu=()=>{
const inp=h('input',{class:'hs-in',maxlength:'6',placeholder:'Party code',autocomplete:'off'})
const mk=h('button',{class:'btn pri',type:'button'},'Create party')
const jn=h('button',{class:'btn',type:'button'},'Join')
mk.addEventListener('click',()=>connect(mkCode(),true))
jn.addEventListener('click',()=>{const c=inp.value.trim().toUpperCase();if(c.length!==6){toast('Enter the 6 character code','err');return}connect(c,false)})
card.replaceChildren(h('h3',null,'Hollow Siege: MP Edition'),h('p',{class:'hs-p'},'Up to 4 players take on the same night at the same time and see each other\'s status live.'),mk,h('div',{class:'hs-row'},inp,jn),h('button',{class:'btn sm',type:'button',on:{click:close}},'Close'))
}
const lobby=()=>{
const list=h('div',{class:'hs-list'},...roster.map(r=>h('div',{class:'hs-r'},h('b',null,r.n),h('span',null,r.u===hostUid?'Host':'Ready'))))
const nn=h('div',{class:'hs-nights'},...[1,2,3,4,5].map(n=>{const b=h('button',{class:'btn sm'+(n===night?' pri':''),type:'button',disabled:!host},'Night '+n);b.addEventListener('click',()=>{night=n;bcast();lobby()});return b}))
const go=h('button',{class:'btn pri',type:'button',disabled:!host||roster.length<1},host?'Start night':'Waiting for host')
go.addEventListener('click',()=>{send({k:'go',night,list:roster});begin(night,roster)})
card.replaceChildren(h('h3',null,'Party '+code),h('p',{class:'hs-p'},host?'Share this code. Pick a night and start.':'Waiting in the party.'),list,nn,go,h('button',{class:'btn sm',type:'button',on:{click:close}},'Leave'))
}
const begin=async(n,list)=>{
if(game)return
const st=new Map(list.map(r=>[r.u,{n:r.n,s:'playing'}]))
const{playNight}=await import('/g3d/doom3d.js')
const box=h('div',{class:'hw-gamebox'})
const hud=h('div',{class:'hs-hud'})
const out=h('button',{class:'btn sm hw-gx',type:'button','aria-label':'Leave the shift'},'Leave shift')
const g=h('div',{class:'hw-game',role:'dialog','aria-modal':'true','aria-label':'Hollow Siege'},box,hud,out)
document.body.append(g)
gameBar(g,'parley')
const draw=()=>hud.replaceChildren(...[...st.values()].map(v=>h('div',{class:'hs-s hs-'+v.s},h('b',null,v.n),h('span',null,v.s==='playing'?'In the siege':v.s==='won'?'Survived':v.s==='lost'?'Down':'Left'))))
draw()
let stop=null,fin=false
const end=()=>{
if(fin)return
fin=true
try{stop?.()}catch{}
g.remove()
game=null
card.hidden=false
root.style.display=''
lobby()
}
const mark=(u,s)=>{const v=st.get(u);if(v&&v.s==='playing'){v.s=s;draw()
if([...st.values()].every(x=>x.s!=='playing')){const w=[...st.values()].every(x=>x.s==='won');toast(w?'The whole squad survived night '+n+'.':'The siege is over.',w?'ok':undefined)}}}
game={stop:end,mark,left:u=>mark(u,'left')}
out.addEventListener('click',()=>{send({k:'dn',s:'left'});mark(me,'left');end()})
root.style.display='none'
stop=playNight(n,box,r=>{
if(fin)return
const s=r.ok?'won':'lost'
send({k:'dn',s});mark(me,s)
setTimeout(end,r.ok?2200:1200)
})
}
const onMsg=(f,d)=>{
if(d.k==='hi'&&host){
if(game){send({k:'busy'},f);return}
if(roster.length>=4&&!roster.some(r=>r.u===f)){send({k:'full'},f);return}
if(!roster.some(r=>r.u===f))roster.push({u:f,n:String(d.n||'Player').slice(0,24)})
bcast();lobby()
}else if(d.k==='ros'&&!host){hostUid=f;roster=d.list;night=d.night;if(!roster.some(r=>r.u===me)){toast('You were removed from the party','err');close();return}lobby()}
else if(d.k==='go'&&f===hostUid){begin(d.night,d.list)}
else if(d.k==='full'){toast('That party is full','err');close()}
else if(d.k==='busy'){toast('That night already started','err');close()}
else if(d.k==='dn'&&game)game.mark(f,d.s)
}
const connect=(c,create)=>{
code=c;host=create;hostUid=create?me:null
roster=create?[{u:me,n:myName}]:[]
card.replaceChildren(h('p',{class:'hs-p'},'Connecting'))
let hn=0,tm=null
net=connectParty({code:c,create,me,app:APP,max:4,pre:'hs',on:{
open(){
if(create){lobby();return}
const hi=()=>send({k:'hi',n:myName})
hi()
tm=setInterval(()=>{hn++;if(hn>8){clearInterval(tm);toast('That party is not open','err');close()}else hi()},2000)
},
fail(t){toast(t,'err');close()},
close(){if(closed)return;toast('Lost connection to the party','err');close()},
left(u){
if(game)game.left(u)
if(host){roster=roster.filter(r=>r.u!==u);bcast();if(!game)lobby()}
else if(u===hostUid&&!game){toast('The host closed the party','err');close()}
},
msg:(u,d)=>{if(tm&&d.k==='ros'){clearInterval(tm);tm=null}onMsg(u,d)}
}})
}
menu()
}
