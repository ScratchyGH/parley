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
if(!document.getElementById('tucss'))document.head.append(h('link',{id:'tucss',rel:'stylesheet',href:'/teamup.css?v=14'}))
}
export function openSiegeMP(){
if(open)return
open=true
css()
const me=S.me.id,myName=S.me.display_name||S.me.username
const root=h('div',{class:'hs-m tu-box',role:'dialog','aria-modal':'true','aria-label':'Hollow Siege: MP Edition'})
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
const shell=(...k)=>h('div',{class:'tu-lobby hs-lb'},h('div',{class:'tu-moon'}),h('div',{class:'tu-head'},h('h2',null,'Hollow Siege'),h('b',null,'MP Edition'),h('p',null,'Hold the chapel together. Up to four players, one night, everyone at once.')),...k)
const menu=()=>{
const inp=h('input',{class:'hs-in',maxlength:'6',placeholder:'CODE',autocomplete:'off','aria-label':'Party code'})
const mk=h('button',{class:'tu-go',type:'button'},h('span',{class:'tu-gt'},'Create party'),h('span',{class:'tu-gs'},'You host. Share the code.'))
const jn=h('button',{class:'tu-pill',type:'button'},'Join')
mk.addEventListener('click',()=>connect(mkCode(),true))
jn.addEventListener('click',()=>{const c=inp.value.trim().toUpperCase();if(c.length!==6){toast('Enter the 6 character code','err');return}connect(c,false)})
inp.addEventListener('keydown',e=>{if(e.key==='Enter')jn.click()})
card.replaceChildren(shell(h('div',{class:'hs-two'},mk,h('div',{class:'hs-join'},h('b',null,'Have a code?'),h('div',{class:'hs-row'},inp,jn))),h('button',{class:'tu-d hs-x',type:'button',on:{click:close}},h('b',null,'Close'))))
}
const COL=['#ffc233','#6a3be0','#4aff9a','#ff6a8a']
const lobby=()=>{
const seats=h('div',{class:'hs-seats'},...[0,1,2,3].map(i=>{const r=roster[i];return r?h('div',{class:'tu-slot on hs-seat',style:{'--c':COL[i]}},h('i',{class:'hs-av'},r.n.slice(0,1).toUpperCase()),h('b',null,r.n),h('span',null,r.u===hostUid?'Host':'Ready')):h('div',{class:'tu-slot open hs-seat',style:{'--c':COL[i]}},h('i',{class:'hs-av hs-em'},'+'),h('b',null,'Open seat'),h('span',null,'Share the code'))}))
const nn=h('div',{class:'hs-nights'},...[1,2,3,4,5].map(n=>{const b=h('button',{class:'tu-mc'+(n===night?' on':''),type:'button',disabled:!host},h('b',null,'Night '+n),h('span',null,n===1?'Warm-up shift':n===5?'Final shift':'Harder than the last'));b.addEventListener('click',()=>{night=n;bcast();lobby()});return b}))
const go=h('button',{class:'tu-go',type:'button',disabled:!host},h('span',{class:'tu-gt'},host?(roster.length>1?'Start night '+night:'Start solo'):'Waiting for host'),h('span',{class:'tu-gs'},'Night '+night+' / '+roster.length+' of 4 players'))
go.addEventListener('click',()=>{send({k:'go',night,list:roster});begin(night,roster)})
const cp=h('button',{class:'tu-pill',type:'button',on:{click:()=>{navigator.clipboard?.writeText(code).then(()=>toast('Code copied','ok')).catch(()=>{})}}},'Copy')
card.replaceChildren(shell(h('div',{class:'hs-code'},h('span',null,'Party code'),h('b',null,code),cp),seats,h('h4',{class:'hs-h'},'Pick the night'),nn,go,h('button',{class:'tu-d hs-x',type:'button',on:{click:close}},h('b',null,'Leave party'))))
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
card.replaceChildren(h('p',{class:'tu-wait'},'Connecting'))
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
